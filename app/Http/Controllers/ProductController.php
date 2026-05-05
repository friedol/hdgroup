<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\User;
use App\Models\Store;
use App\Models\Export;
use App\Models\Product;
use App\Models\Category;
use App\Models\Transfer;
use App\Models\Inventory;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Traits\FileUploadTrait;
use App\Models\ProductManagement;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use App\Models\ProductManagementImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\ProductSpecification;
use App\Models\ProductionOrder;
use App\Models\InventoryTransaction;
use App\Models\RawMaterial;

class ProductController extends Controller
{
    use FileUploadTrait;

    protected $inventoryService;
    protected $rollService;

    public function __construct(InventoryService $inventoryService, \App\Services\RollProductionService $rollService)
    {
        $this->inventoryService = $inventoryService;
        $this->rollService = $rollService;
    }
    public function index(Request $request)
    {

        $categories = Category::orderBy('category_name', 'asc')->get();

        $products = Product::with([
            'productManagement.images' => function ($query) {
                $query->orderBy('is_featured', 'desc')->limit(1);
            },
            'bom.items.rawMaterial',
            'variants:id,product_id,color,qty,plain_qty,printed_qty'
        ])
            ->when($request->type, function ($query, $type) {
                return $query->where('product_type', $type);
            })
            ->orderBy('product_name', 'asc')
            ->get();

        // Compute real-time stock for each product from the correct ledger
        $branchId = session('active_branch_id') ?? (Auth::check() ? Auth::user()->branch_id : null);
        foreach ($products as $product) {
            if ($product->product_type === 'raw_material') {
                // Count available rolls (RawMaterial records) linked to this product via ProductManagement
                // Total metres available = SUM of remaining_length for all active rolls
                $rollQuery = \App\Models\RawMaterial::where('roll_status', '!=', 'consumed')
                    ->where(function ($q) use ($product) {
                        // Match by SKU pattern (created with SKU as code)
                        $q->where('code', 'like', $product->product_id . '%');
                    });
                
                if ($branchId && $branchId !== 'all') {
                    $rollQuery->where('branch_id', $branchId);
                }

                $product->total_qty = $rollQuery->count(); // number of rolls
                $product->total_metres = (float) $rollQuery->sum('remaining_length');
            } elseif ($product->product_type === 'manufactured') {
                $product->total_qty = (new \App\Services\InventoryService())->getTotalInventoryQuantity($product->id, \App\Models\Product::class, $branchId);
                $product->total_metres = null;
            } else {
                // Fallback for trading products
                $invQuery = $product->inventories();
                if ($branchId && $branchId !== 'all') {
                    $invQuery->where('branch_id', $branchId);
                }
                $product->total_qty = (float) $invQuery->sum('qty');
                $product->total_metres = null;
            }
        }

        // Dashboard Summary Stats
        $stats = [
            'total_products' => $products->count(),
            'total_stock' => $products->sum('total_qty') ?: 0,
            'low_stock' => $products->filter(function ($p) {
                $threshold = $p->productManagement->level ?? 10;
                return $p->total_qty > 0 && $p->total_qty < $threshold;
            })->count(),
            'out_of_stock' => $products->where('total_qty', '<=', 0)->count(),
            'total_value' => $products->sum(function ($p) {
                return ($p->total_qty ?: 0) * ($p->buying_price ?: 0);
            })
        ];

        $adjustmentsQuery = \App\Models\StockAdjustment::with(['product', 'store']);
        if ($branchId && $branchId !== 'all') {
            $adjustmentsQuery->where('branch_id', $branchId);
        }
        $adjustments = $adjustmentsQuery->latest()
            ->take(50)
            ->get();

        $rawMaterialsQuery = \App\Models\RawMaterial::query();
        if ($branchId && $branchId !== 'all') {
            $rawMaterialsQuery->where('branch_id', $branchId);
        }
        $rawMaterials = $rawMaterialsQuery->get();
        $allStores = Store::all();

        return \Inertia\Inertia::render('InventoryPage', [
            'products' => $products,
            'rawMaterials' => $rawMaterials,
            'adjustments' => $adjustments,
            'kpis' => [
                'total_products' => $stats['total_products'],
                'low_stock_alerts' => $stats['low_stock'],
                'out_of_stock' => $stats['out_of_stock'],
                'total_value' => $stats['total_value'],
            ],
            'categories' => $categories->pluck('category_name'),
            'stores' => $allStores,
        ]);
    }

    public function create(Request $request)
    {
        // Use session branch for global admins (active_branch_id() returns null for global users)
        $branchId = session('active_branch_id') ?? active_branch_id();

        // Stores can be linked via direct branch_id column OR via branch_store pivot table
        $storesQuery = Store::with('branches');
        if ($branchId) {
            $storesQuery->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $branchId));
            });
        }

        return \Inertia\Inertia::render('Products/Create', [
            'categories'    => Category::orderBy('category_name', 'asc')->get()->map(fn($c) => ['id' => $c->id, 'name' => $c->category_name]),
            'units'         => Unit::orderBy('unit_name', 'asc')->get()->map(fn($u) => ['id' => $u->id, 'name' => $u->unit_name]),
            'stores'        => $storesQuery->get()->map(function ($s) {
                // Resolve branch_id from pivot if direct column is null
                $bid = $s->branch_id ?? $s->branches->first()?->id;
                return ['id' => $s->id, 'name' => $s->store_name, 'branch_id' => $bid];
            }),
            'branches'      => \App\Models\Branch::where('is_active', true)->get()->map(fn($b) => ['id' => $b->id, 'name' => $b->name]),
            'activeBranchId' => $branchId,
        ]);
    }

    public function show(Request $request, $id, $year = null, $month = null)
    {
        // Universal ID lookup (handles numeric ID, raw SKU, or prefixed SKU: [Value])
        $lookupId = str_replace('SKU: ', '', $id);

        $d['product'] = $product = Product::with([
            'productManagement.images',
            'specifications',
            'bom.items.rawMaterial',
            'variants',
            'inventories' => function ($query) {
                $query->selectRaw('product_id, SUM(qty) as total_qty')
                    ->groupBy('product_id');
            }
        ])->where('id', $lookupId)
            ->orWhere('product_id', $lookupId)
            ->orWhere('product_id', $id) // Fallback for raw SKU
            ->first();

        if (!$product) {
            abort(404, 'Strategic Intelligence: Product Architecture Not Found.');
        }

        // Handle year and month input
        $d['year'] = $year = $request->year ?? $year ?? now()->year;
        $d['month'] = $month = $request->month ?? $month ?? now()->month;

        // Get sales data
        $d['sales'] = $sales = Export::where('product_id', $product->id)
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('created_at', 'asc')
            ->get();

        // Process sales data for chart
        $d['chartData'] = $chartData = $sales->groupBy(function ($sale) {
            return $sale->created_at->format('Y-m-d');
        })->map(function ($salesByDay) {
            return [
                'created_at' => $salesByDay->first()->created_at->format('Y-m-d'),
                'product_quantity' => $salesByDay->sum('product_quantity'),
                'product_name' => $salesByDay->first()->product_name,
            ];
        })->values()->all();

        // Get product store records
        $d['productStore'] = Product::where('product_id', $product->product_id)->get();

        // Get all transfers
        $d['transfers'] = Transfer::all();

        // Get store quantities
        $branchId = session('active_branch_id') ?? (Auth::check() ? Auth::user()->branch_id : null);
        if ($product->product_type === 'raw_material') {
            // For raw materials: count rolls and sum remaining_length grouped by store
            $rollsByStore = \App\Models\RawMaterial::where('branch_id', $branchId)
                ->where('code', 'like', $product->product_id . '%')
                ->where('roll_status', '!=', 'consumed')
                ->get()
                ->groupBy(function ($roll) {
                    return \App\Models\InventoryTransaction::where('product_id', $roll->id)
                        ->where('product_type', 'raw_material')
                        ->value('store_id');
                });

            $d['stores'] = \App\Models\InventoryTransaction::where('product_type', 'raw_material')
                ->whereIn('product_id', \App\Models\RawMaterial::where('branch_id', $branchId)
                    ->where('code', 'like', $product->product_id . '%')
                    ->pluck('id'))
                ->select('store_id', DB::raw('COUNT(DISTINCT product_id) as total_qty'))
                ->groupBy('store_id')
                ->with('store:id,store_name')
                ->get()
                ->map(function ($item) {
                    return (object) [
                        'store_name' => $item->store->store_name ?? 'Unknown',
                        'total_qty' => $item->total_qty
                    ];
                })->values();

            $rollQuery = \App\Models\RawMaterial::where('branch_id', $branchId)
                ->where('code', 'like', $product->product_id . '%')
                ->where('roll_status', '!=', 'consumed');
            $d['raw_material_roll_count'] = $rollQuery->count();
            $d['raw_material_total_metres'] = (float) $rollQuery->sum('remaining_length');
        } else {
            $d['stores'] = Inventory::where('product_id', $product->id)
                ->select('store_id', DB::raw('SUM(qty) as total_qty'))
                ->groupBy('store_id')
                ->with('store:id,store_name')
                ->get()
                ->map(function ($item) {
                    return (object) [
                        'store_name' => $item->store->store_name ?? 'Unknown',
                        'total_qty' => $item->total_qty
                    ];
                })
                ->values();
            $d['raw_material_roll_count'] = null;
            $d['raw_material_total_metres'] = null;
        }

        // ── COLOR VARIANTS (manufactured products) ──────────────────────
        $d['color_variants'] = ($product->product_type === 'manufactured' || $product->product_type === 'trading')
            ? $product->variants->map(fn($v) => [
                'color'         => $v->color,
                'qty'           => (float) $v->qty,
                'plain_qty'     => (float) ($v->plain_qty ?? 0),
                'printed_qty'   => (float) ($v->printed_qty ?? 0),
                'buying_price'  => (float) $v->buying_price,
                'selling_price' => (float) $v->selling_price,
                'branch_id'     => $v->branch_id,
            ])->values()->all()
            : [];

        // ──────────────────────────────────────────────────────────────
        // FETCH PRODUCTION / USAGE HISTORY
        // ──────────────────────────────────────────────────────────────
        $d['productionHistory'] = collect();
        if ($product->product_type === 'manufactured') {
            $d['productionHistory'] = ProductionOrder::whereHas('bom', function ($q) use ($product) {
                $q->where('finished_product_id', $product->id);
            })->with(['roll', 'createdBy'])->orderBy('created_at', 'desc')->get();
        }

        $d['usageHistory'] = collect();
        if ($product->product_type === 'raw_material') {
            $d['usageHistory'] = ProductionOrder::whereHas('roll', function ($q) use ($product) {
                $q->where('code', 'like', $product->product_id . '%');
            })->with(['bom.finishedProduct', 'createdBy'])->orderBy('created_at', 'desc')->get();
        }

        return \Inertia\Inertia::render('Products/Show', $d);
    }


    public function store(Request $request)
    {
        $this->phpInitialize();

        $validatedData = $request->validate([
            // Section 1: Basic Info
            'product_name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'category_id' => 'required|exists:categories,id',
            'store_id' => 'required|exists:stores,id',
            'brand' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'unit_id' => 'required|exists:units,id',
            'product_type' => 'required|in:trading,raw_material,manufactured',

            // Section 2: Buying & Cost
            'buying_price' => 'nullable|numeric',
            'buying_unit_id' => 'nullable|exists:units,id',
            'qty_in_buying_unit' => 'nullable|numeric|min:1',
            'cost_per_base_unit' => 'nullable|numeric',

            // Section 3: Inventory
            'product_quantity' => 'required|integer|min:0',
            'reorder_point' => 'nullable|integer',
            'low_stock_threshold' => 'nullable|integer',

            // Manufacturing Specs (Raw Material Roll)
            'gsm' => 'nullable|numeric',
            'width_cm' => 'nullable|numeric',
            'length_m' => 'nullable|numeric',
            'color' => 'nullable|string',
            'cost_per_kg' => 'nullable|numeric',
            'is_accessory' => 'nullable',

            // Section 4: Dimensions
            'material' => 'nullable|string',
            'weight' => 'nullable|numeric',
            'weight_unit' => 'nullable|string',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'dimension_unit' => 'nullable|string',
            'volume' => 'nullable|numeric',
            'volume_unit' => 'nullable|string',

            // Section 5 & 6 (JSON)
            'sale_units_names' => 'nullable|array',
            'sale_units_factors' => 'nullable|array',
            'sale_units_prices' => 'nullable|array',
            'spec_keys' => 'nullable|array',
            'spec_values' => 'nullable|array',

            // Section 7: Media
            'image_slot_1' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'image_slot_2' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'image_slot_3' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'image_slot_4' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'image_slot_5' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'video' => 'nullable|mimes:mp4,mov,avi,wmv|max:20480',

            // Section 8: Status
            'is_enabled' => 'nullable',
            'is_featured' => 'nullable',
            'is_public' => 'nullable',
        ]);

        try {
            DB::beginTransaction();

            // 1. Prepare JSON Data
            $saleUnits = [];
            if ($request->has('sale_units_names')) {
                foreach ($request->sale_units_names as $index => $name) {
                    if ($name) {
                        $saleUnits[] = [
                            'name' => $name,
                            'factor' => $request->sale_units_factors[$index] ?? 1,
                            'price' => $request->sale_units_prices[$index] ?? 0,
                        ];
                    }
                }
            }

            $specifications = [];
            if ($request->has('spec_keys')) {
                foreach ($request->spec_keys as $index => $key) {
                    if ($key) {
                        $specifications[] = [
                            'key' => $key,
                            'value' => $request->spec_values[$index] ?? '',
                        ];
                    }
                }
            }

            // 2. Auto-generate SKU if empty
            $sku = $request->sku;
            if (empty($sku)) {
                $sku = 'SKU-' . strtoupper(substr(uniqid(), -8));
            }

            // 3. Create or Update ProductManagement (Master)
            $cat = Category::find($validatedData['category_id']);
            $unit = Unit::find($validatedData['unit_id']);
            $selectedStore = Store::find($validatedData['store_id']);
            // Robust fallback: Store Branch -> Session -> User Branch -> Default Branch (1)
            $branchId = (int) ($selectedStore->branch_id ?: session('active_branch_id') ?: Auth::user()->branch_id ?: 1);

            // 4. Handle Media First (to include in create)
            $imageSlots = [];
            for ($i = 1; $i <= 5; $i++) {
                $slotName = "image_slot_$i";
                if ($request->hasFile($slotName)) {
                    $path = $this->handleUploadedFiles([$request->file($slotName)], 'products/images', true);
                    $imageSlots["image_$i"] = $path;
                }
            }
            $videoFile = $this->handleUploadedFiles($request->file('video') ? [$request->file('video')] : null, 'products/videos', true);

            if ($validatedData['product_type'] === 'raw_material') {
                $isAccessory = $request->has('is_accessory');
                $splitRolls = $request->has('split_rolls') && !$isAccessory;
                $totalQty = (float) ($validatedData['product_quantity'] ?: 1);
                $numRecords = $splitRolls ? (int) $totalQty : 1;

                // Consolidation check for non-split materials
                if (!$splitRolls) {
                    $existingMaterial = \App\Models\RawMaterial::where('name', $validatedData['product_name'])
                        ->where('branch_id', $branchId)
                        ->where('is_roll', !$isAccessory)
                        ->first();

                    if ($existingMaterial) {
                        $existingMaterial->update([
                            'cost_per_unit' => $validatedData['cost_per_base_unit'],
                            'gsm' => $validatedData['gsm'] ?? $existingMaterial->gsm,
                            'width' => $validatedData['width_cm'] ?? $existingMaterial->width,
                            'color' => $validatedData['color'] ?? $existingMaterial->color,
                            'material' => $validatedData['material'] ?? $existingMaterial->material,
                            'brand' => $validatedData['brand'] ?? $existingMaterial->brand,
                        ]);

    
                        $this->inventoryService->adjustInventory(
                            $existingMaterial->id,
                            $totalQty,
                            $validatedData['store_id'],
                            'increase',
                            'opening_stock',
                            "Stock update via product registration",
                            null,
                            \App\Models\RawMaterial::class,
                            null,
                            null,
                            $branchId
                        );

                        DB::commit();
                        return response()->json(['success' => 'Material stock updated successfully.', 'redirect' => route('raw-materials.index')]);
                    }
                }

                // Normal creation loop
                for ($i = 1; $i <= $numRecords; $i++) {
                    $itemCode = $sku;
                    $itemName = $validatedData['product_name'];

                    if ($numRecords > 1) {
                        $itemCode .= "-$i";
                        $itemName .= " (Unit $i of $numRecords)";
                    }

                    $rawMaterial = \App\Models\RawMaterial::create([
                        'branch_id' => $branchId,
                        'name' => $itemName,
                        'code' => $itemCode,
                        'category' => $cat->category_name,
                        'base_unit' => $unit->unit_name,
                        'cost_per_unit' => $validatedData['cost_per_base_unit'],
                        'cost_per_kg' => $validatedData['cost_per_kg'] ?? 0,
                        'minimum_stock' => $validatedData['low_stock_threshold'] ?? 0,
                        'status' => true,
                        'is_roll' => !$isAccessory,
                        'is_accessory' => $isAccessory,
                        'gsm' => $validatedData['gsm'] ?? null,
                        'width' => $validatedData['width_cm'] ?? null,
                        'total_length' => $validatedData['length_m'] ?? null,
                        'remaining_length' => $validatedData['length_m'] ?? null,
                        'color' => $validatedData['color'] ?? null,
                        'weight_kg' => $request->input('weight_per_roll'),
                        'brand' => $validatedData['brand'] ?? null,
                        'material' => $validatedData['material'] ?? null,
                        'created_by' => Auth::id(),
                    ]);

                    // Sync to product table for UI listing/POS visibility (DISABLED as per requirement)
                    // $this->rollService->syncRollToProductListing($rawMaterial);


                    // Initial Ledger Entry
                    $adjustQty = $splitRolls ? ($validatedData['length_m'] ?? 0) : $totalQty;
                    // If it's a roll but we are NOT splitting, we still adjust by length if it's the primary unit
                    if (!$isAccessory && ($unit->unit_name == 'meters' || $unit->unit_name == 'm' || $unit->symbol == 'm')) {
                        $adjustQty = $validatedData['length_m'] ?? $totalQty;
                    }

                    $this->inventoryService->adjustInventory(
                        $rawMaterial->id,
                        $adjustQty,
                        $validatedData['store_id'],
                        'increase',
                        'opening_stock',
                        "Initial registration stock",
                        null,
                        \App\Models\RawMaterial::class,
                        null,
                        null,
                        $branchId
                    );
                }

                DB::commit();
                return response()->json(['success' => 'Raw Material registered successfully.', 'redirect' => route('raw-materials.index')]);

            } else {
                $resolvedBuyingPrice = $validatedData['buying_price'] ?? $request->input('total_cost_per_roll', 0);
                // 3b. Trading or Manufactured Products (Standard Flow)
                $productMaster = ProductManagement::create(array_merge([
                    'product_name' => $validatedData['product_name'],
                    'product_type' => $validatedData['product_type'],
                    'sku' => $sku,
                    'barcode' => $validatedData['barcode'],
                    'category_id' => $validatedData['category_id'],
                    'category_name' => $cat->category_name,
                    'brand' => $validatedData['brand'] ?? null,
                    'description' => $validatedData['description'] ?? null,
                    'unit_id' => $validatedData['unit_id'],
                    'unit_name' => $unit->unit_name,
                    'unit_description' => $unit->unit_name,

                    'buying_price' => $resolvedBuyingPrice,
                    'buying_unit_id' => $validatedData['buying_unit_id'],
                    'qty_in_buying_unit' => $validatedData['qty_in_buying_unit'] ?? 1,
                    'cost_per_base_unit' => $validatedData['cost_per_base_unit'] ?? $resolvedBuyingPrice,

                    'reorder_point' => $validatedData['reorder_point'],
                    'low_stock_threshold' => $validatedData['low_stock_threshold'],

                    'material' => $validatedData['material'],
                    'weight' => $validatedData['weight'],
                    'weight_unit' => $validatedData['weight_unit'],
                    'length' => $validatedData['length'],
                    'width' => $validatedData['width'],
                    'height' => $validatedData['height'],
                    'dimension_unit' => $validatedData['dimension_unit'],
                    'volume' => $validatedData['volume'],
                    'volume_unit' => $validatedData['volume_unit'],

                    'sale_units' => $saleUnits,
                    'specifications' => $specifications,

                    'is_enabled' => $request->has('is_enabled'),
                    'is_featured' => $request->has('is_featured'),
                    'is_public' => $request->has('is_public'),
                    'video' => $videoFile,
                    'branch_id' => $branchId,
                ], $imageSlots));

                // 5. Create Product Instance (Store-specific)
                $productInstance = Product::create([
                    'product_id' => $sku,
                    'product_management_id' => $productMaster->id,
                    'product_name' => $productMaster->product_name,
                    'product_type' => $productMaster->product_type,
                    'product_price' => !empty($saleUnits) ? $saleUnits[0]['price'] : $resolvedBuyingPrice,
                    'buying_price' => $resolvedBuyingPrice,
                    'unit_price' => !empty($saleUnits) ? $saleUnits[0]['price'] : $resolvedBuyingPrice,
                    'branch_id' => $branchId,
                    'is_enabled' => true,
                ]);

                // Create Product Specifications
                ProductSpecification::create([
                    'product_id' => $productInstance->id,
                    'gsm' => $validatedData['gsm'] ?? null,
                    'width_cm' => $validatedData['width_cm'] ?? null,
                    'length_m' => $validatedData['length_m'] ?? null,
                    'color' => $validatedData['color'] ?? null,
                ]);

                // Initial Inventory
                $this->inventoryService->adjustInventory(
                    $productInstance->id,
                    $validatedData['product_quantity'],
                    $validatedData['store_id'],
                    'increase',
                    'opening_stock',
                    "Initial stock"
                );

                // 7. Legacy support for `product_managements_images`
                foreach ($imageSlots as $key => $imgPath) {
                    ProductManagementImage::create([
                        'product_management_id' => $productMaster->id,
                        'product_id' => $productInstance->id,
                        'image_path' => $imgPath,
                        'is_featured' => ($key === 'image_1'),
                    ]);
                }

                DB::commit();
                return redirect()->route('all-products.index')->with('success', 'Product published successfully.');
            }

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("PRODUCT_STORE_FAILURE: " . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            return response()->json(['error' => 'Failure: ' . $e->getMessage()], 500);
        }
    }




    public function update(Request $request, $id)
    {
        $this->phpInitialize();
        $product = Product::findOrFail($id);
        $pm = $product->productManagement;

        $validatedData = $request->validate([
            // Section 1: Basic Info
            'product_name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:product_managements,sku,' . $pm->id,
            'barcode' => 'nullable|string|max:100',
            'category_id' => 'required|exists:categories,id',
            'store_id' => 'required|exists:stores,id',
            'brand' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'unit_id' => 'required|exists:units,id',

            // Section 2: Buying & Cost
            'buying_price' => 'required|numeric',
            'buying_unit_id' => 'nullable|exists:units,id',
            'qty_in_buying_unit' => 'nullable|numeric|min:1',
            'cost_per_base_unit' => 'nullable|numeric',

            // Section 3: Inventory (READONLY on UI, but validate for safety)
            'reorder_point' => 'nullable|integer',
            'low_stock_threshold' => 'nullable|integer',

            // Section 4: Dimensions
            'material' => 'nullable|string',
            'weight' => 'nullable|numeric',
            'weight_unit' => 'nullable|string',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'dimension_unit' => 'nullable|string',
            'volume' => 'nullable|numeric',
            'volume_unit' => 'nullable|string',

            // Section 5 & 6 (JSON)
            'sale_units_names' => 'nullable|array',
            'sale_units_factors' => 'nullable|array',
            'sale_units_prices' => 'nullable|array',
            'spec_keys' => 'nullable|array',
            'spec_values' => 'nullable|array',

            // Section 8: Status
            'is_enabled' => 'nullable',
            'is_featured' => 'nullable',
            'is_public' => 'nullable',
            'gsm' => 'nullable|numeric',
            'width_cm' => 'nullable|numeric',
            'length_m' => 'nullable|numeric',
            'color' => 'nullable|string',
            'cost_per_kg' => 'nullable|numeric',
        ]);

        try {
            DB::beginTransaction();

            // 1. Prepare JSON Data
            $saleUnits = [];
            if ($request->has('sale_units_names')) {
                foreach ($request->sale_units_names as $index => $name) {
                    if ($name) {
                        $saleUnits[] = [
                            'name' => $name,
                            'factor' => $request->sale_units_factors[$index] ?? 1,
                            'price' => $request->sale_units_prices[$index] ?? 0,
                        ];
                    }
                }
            }

            $specifications = [];
            if ($request->has('spec_keys')) {
                foreach ($request->spec_keys as $index => $key) {
                    if ($key) {
                        $specifications[] = [
                            'key' => $key,
                            'value' => $request->spec_values[$index] ?? '',
                        ];
                    }
                }
            }

            // 2. Handle Media
            $imageSlots = [];
            for ($i = 1; $i <= 5; $i++) {
                $slotName = "image_slot_$i";
                $existingSlot = "existing_image_slot_$i";

                if ($request->hasFile($slotName)) {
                    // Delete old if exists
                    if ($pm->{"image_$i"}) {
                        $this->deleteFiles($pm->{"image_$i"});
                    }
                    $path = $this->handleUploadedFiles([$request->file($slotName)], 'products/images', true);
                    $imageSlots["image_$i"] = $path;

                    // Update ProductManagementImage record
                    ProductManagementImage::updateOrCreate(
                        ['product_management_id' => $pm->id, 'is_featured' => ($i === 1)],
                        ['image_path' => $path, 'product_id' => $product->id]
                    );
                } else {
                    $imageSlots["image_$i"] = $request->input($existingSlot);
                }
            }

            // 3. Update Master
            $cat = Category::find($validatedData['category_id']);
            $unit = Unit::find($validatedData['unit_id']);

            $pm->update(array_merge([
                'product_name' => $validatedData['product_name'],
                'barcode' => $validatedData['barcode'],
                'category_id' => $validatedData['category_id'],
                'category_name' => $cat->category_name,
                'brand' => $validatedData['brand'] ?? null,
                'description' => $validatedData['description'] ?? null,
                'unit_id' => $validatedData['unit_id'],
                'unit_name' => $unit->unit_name,

                'buying_price' => $validatedData['buying_price'],
                'buying_unit_id' => $validatedData['buying_unit_id'],
                'qty_in_buying_unit' => $validatedData['qty_in_buying_unit'] ?? 1,
                'cost_per_base_unit' => $validatedData['cost_per_base_unit'] ?? $validatedData['buying_price'],

                'reorder_point' => $validatedData['reorder_point'],
                'low_stock_threshold' => $validatedData['low_stock_threshold'],

                'material' => $validatedData['material'],
                'weight' => $validatedData['weight'],
                'weight_unit' => $validatedData['weight_unit'],
                'length' => $validatedData['length'],
                'width' => $validatedData['width'],
                'height' => $validatedData['height'],
                'dimension_unit' => $validatedData['dimension_unit'],
                'volume' => $validatedData['volume'],
                'volume_unit' => $validatedData['volume_unit'],

                'sale_units' => $saleUnits,
                'specifications' => $specifications,

                'is_enabled' => $request->has('is_enabled'),
                'is_featured' => $request->has('is_featured'),
                'is_public' => $request->has('is_public'),
            ], $imageSlots));

            // 3.5 Update/Create Product Specifications
            ProductSpecification::updateOrCreate(
                ['product_id' => $product->id],
                [
                    'gsm' => $validatedData['gsm'] ?? null,
                    'width_cm' => $validatedData['width_cm'] ?? null,
                    'length_m' => $validatedData['length_m'] ?? null,
                    'color' => $validatedData['color'] ?? null,
                ]
            );

            // 4. Update Instance
            $product->update([
                'product_name' => $pm->product_name,
                'product_price' => !empty($saleUnits) ? $saleUnits[0]['price'] : $validatedData['buying_price'],
                'buying_price' => $validatedData['buying_price'],
                'unit_price' => !empty($saleUnits) ? $saleUnits[0]['price'] : $validatedData['buying_price'],
                'is_enabled' => $pm->is_enabled,
            ]);

            DB::commit();
            return redirect()->route('all-products.index')->with('success', 'Product updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("PRODUCT_UPDATE_FAILURE: " . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            return response()->json(['error' => 'Update Failed: ' . $e->getMessage()], 500);
        }
    }


    public function edit(string $id)
    {
        $this->phpInitialize();
        $lookupId = str_replace('SKU: ', '', $id);
        $product = Product::with(['productManagement', 'inventories', 'specifications', 'bom.items.rawMaterial'])
            ->where('id', $lookupId)
            ->orWhere('product_id', $lookupId)
            ->orWhere('product_id', $id)
            ->firstOrFail();

        $branchId = session('active_branch_id') ?? (Auth::check() ? Auth::user()->branch_id : null);
        $pm = $product->productManagement;

        // Flatten PM metadata into product object for the frontend Edit.tsx
        if ($pm) {
            $product->sku = $pm->sku;
            $product->barcode = $pm->barcode;
            $product->brand = $pm->brand;
            $product->description = $pm->description;
            $product->category_id = $pm->category_id;
            $product->material_type = $pm->material;
            $product->base_unit = $pm->unit_id;
            $product->reorder_level = $pm->reorder_point;
            $product->low_alert = $pm->low_stock_threshold;
            $product->weight = $pm->weight;
            $product->weight_unit = $pm->weight_unit;
            $product->width = $pm->width;
            $product->length = $pm->length;
            $product->box_h = $pm->height;
            $product->box_unit = $pm->dimension_unit;
            $product->is_featured = $pm->is_featured;
            $product->is_public = $pm->is_public;
            
            // Map images to an array for the frontend
            $images = [];
            for ($i = 1; $i <= 5; $i++) {
                $field = "image_$i";
                if ($pm->$field) {
                    $images[] = asset('storage/' . $pm->$field);
                }
            }
            $product->images = $images;

            // Pricing Nodes
            $product->pricing_nodes = $pm->sale_units ?? [];
            
            // Tech Specs
            $product->tech_specs = $pm->specifications ?? [];
        }

        // BOM Items
        $bomItems = [];
        if ($product->bom) {
            foreach ($product->bom->items as $item) {
                $bomItems[] = [
                    'raw_material_id' => $item->raw_material_id,
                    'quantity' => $item->quantity,
                ];
            }
        }
        $product->bom_items = $bomItems;

        return \Inertia\Inertia::render('Products/Edit', [
            'product'       => $product,
            'categories'    => Category::orderBy('category_name', 'asc')->get()->map(fn($c) => ['id' => $c->id, 'name' => $c->category_name]),
            'units'         => Unit::orderBy('unit_name', 'asc')->get()->map(fn($u) => ['id' => $u->id, 'name' => $u->unit_name]),
            'stores'        => Store::get()->map(function ($s) {
                // Resolve effective branch_id (direct column or first pivot-linked branch)
                $bid = $s->branch_id ?? $s->branches->first()?->id;
                return ['id' => $s->id, 'name' => $s->store_name, 'branch_id' => $bid];
            }),
            'raw_materials' => RawMaterial::when($branchId, fn($q) => $q->where('branch_id', $branchId))->get()->map(fn($rm) => ['id' => $rm->id, 'name' => $rm->name]),
            'activeBranchId' => $branchId,
            'branches'      => \App\Models\Branch::where('is_active', true)->get()->map(fn($b) => ['id' => $b->id, 'name' => $b->name]),
        ]);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // $id is product_id (SKU)
        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // 1. Find the master record (try id, sku, or prefixed sku)
            $lookupId = str_replace('SKU: ', '', $id);
            $product = Product::where('id', $lookupId)
                ->orWhere('product_id', $lookupId)
                ->orWhere('product_id', $id)
                ->first();

            if (!$product) {
                return response()->json(['error' => 'Product architecture not found.'], 404);
            }

            $sku = $product->product_id;
            $pm = ProductManagement::where('sku', $sku)->first();

            // 2. Clear all instances (Products in different stores)
            $products = Product::where('product_id', $sku)->get();

            foreach ($products as $product) {
                // Delete inventory logs first
                $inventories = Inventory::where('product_id', $product->id)->get();
                foreach ($inventories as $inventory) {
                    \App\Models\InventoryLog::where('inventory_id', $inventory->id)->delete();
                }

                // Delete inventories
                Inventory::where('product_id', $product->id)->delete();

                // Delete color variants
                \App\Models\ProductVariant::where('product_id', $product->id)->delete();

                // Delete product instance
                $product->delete();
            }

            // 3. Clear master record and images
            if ($pm) {
                $images = ProductManagementImage::where('product_management_id', $pm->id)->get();
                foreach ($images as $img) {
                    if ($img->image_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($img->image_path)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($img->image_path);
                    }
                    $img->delete();
                }
                $pm->delete();
            }

            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['success' => 'Product and all associated data deleted successfully.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Deletion Failed: ' . $e->getMessage()], 500);
        }
    }

    public function toggleStatus(Request $request)
    {
        $product = Product::findOrFail($request->id);
        if ($product) {
            $product->is_enabled = !$product->is_enabled;
            $product->save();
            return response()->json([
                'status' => 'success',
                'is_enabled' => $product->is_enabled,
            ]);
        }
        return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
    }

    public function toggleVisibility(Request $request)
    {
        // Accept either 'id' or 'product_id' from the frontend
        $productId = $request->input('id') ?? $request->input('product_id');
        $product = Product::findOrFail($productId);
        if ($product && $product->productManagement) {
            $pm = $product->productManagement;
            $pm->is_public = !$pm->is_public;
            $pm->save();
            return response()->json([
                'status'    => 'success',
                'is_public' => $pm->is_public,
                'message'   => $pm->is_public ? 'Product is now public' : 'Product set to private',
            ]);
        }
        return response()->json(['status' => 'error', 'message' => 'Product management not found'], 404);
    }


    public function instock_product()
    {
        $branchId = active_branch_id();
        $products = Product::where('is_enabled', true)
            ->with(['productManagement'])
            ->get()
            ->map(function ($product) use ($branchId) {
                $product->total_qty = (float) (new \App\Services\InventoryService())->getTotalInventoryQuantity($product->id, Product::class, $branchId);
                return $product;
            })
            ->filter(function ($product) {
                // Instock: total_qty > reorder level (or at least > 0 if level not set)
                $threshold = (float) ($product->level ?: 0);
                return $product->total_qty > $threshold;
            })->values();

        return \Inertia\Inertia::render('Admin/Products/InstockOutstockProducts', [
            'products' => $products,
            'addTrue' => true,
            'title' => 'Instock Product',
        ]);
    }

    public function less_product()
    {
        $branchId = active_branch_id();
        $products = Product::where('is_enabled', true)
            ->with(['productManagement'])
            ->get()
            ->map(function ($product) use ($branchId) {
                $product->total_qty = (float) (new \App\Services\InventoryService())->getTotalInventoryQuantity($product->id, Product::class, $branchId);
                return $product;
            })
            ->filter(function ($product) {
                // Less: total_qty <= reorder level AND > 0
                $threshold = (float) ($product->level ?: 0);
                return $product->total_qty <= $threshold && $product->total_qty > 0;
            })->values();

        return \Inertia\Inertia::render('Admin/Products/InstockOutstockProducts', [
            'products' => $products,
            'addTrue' => false,
            'title' => 'Low Stock Alert',
        ]);
    }

    public function outstock_product()
    {
        $branchId = active_branch_id();
        $products = Product::where('is_enabled', true)
            ->with(['productManagement'])
            ->get()
            ->map(function ($product) use ($branchId) {
                $product->total_qty = (float) (new \App\Services\InventoryService())->getTotalInventoryQuantity($product->id, Product::class, $branchId);
                return $product;
            })
            ->filter(function ($product) {
                // Outstock: total_qty == 0
                return $product->total_qty <= 0;
            })->values();

        return \Inertia\Inertia::render('Admin/Products/InstockOutstockProducts', [
            'products' => $products,
            'addTrue' => false,
            'title' => 'Outstock Product',
        ]);
    }

    // ───────────────────────── NEW CRUD METHODS FOR INERTIA ──────────────────────

    /**
     * Display a listing of products for the new Inertia interface
     */
    public function indexCrud(Request $request)
    {
        $branchId = session('active_branch_id') ?? (Auth::check() ? Auth::user()->branch_id : null);

        $query = Product::with(['productManagement', 'bom.items.rawMaterial'])->orderBy('product_name', 'asc');

        // Search filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                  ->orWhere('product_id', 'like', "%{$search}%");
            });
        }

        // Type filtering (All / Trading / Manufactured / Raw)
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('product_type', $request->type);
        }

        // Status filtering
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_enabled', $request->status === 'active');
        }

        // Pagination
        $perPage = $request->input('per_page', 20);
        $products = $query->paginate($perPage);

        // Fetch latest Production Orders to calculate cost for manufactured products without Bom Cost
        $manufacturedProductIds = collect($products->items())->where('product_type', 'manufactured')->pluck('id');
        $latestPOs = \App\Models\ProductionOrder::whereIn('product_id', $manufacturedProductIds)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('product_id');

        // Add stock, image, public status and clean name to each product
        $products->getCollection()->transform(function ($product) use ($branchId, $latestPOs) {
            $pm = $product->productManagement;

            // Clean name: strip dimension patterns like "40.00x48.00cm"
            $cleanName = trim(preg_replace('/\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?:cm|mm|m|in|")?/i', '', $product->product_name ?? ''));
            $cleanName = trim(preg_replace('/\s*custom\s*$/i', '', $cleanName));

            $inventories = Inventory::where('product_id', $product->id)
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->get();

            $product->current_stock = $inventories->sum('qty');

            // ─── BOM Cost Calculation for Manufactured Products ───
            if ($product->product_type === 'manufactured') {
                $latestPO = $latestPOs->get($product->id)?->first();
                $poCostUnit = 0;
                
                if ($latestPO) {
                    $qtyProduced = $latestPO->bags_produced > 0 ? (float)$latestPO->bags_produced : (float)$latestPO->quantity_to_produce;
                    if ($qtyProduced > 0) {
                        $poCostUnit = (float)$latestPO->total_cost / $qtyProduced;
                    }
                }

                if ($poCostUnit > 0) {
                    $product->buying_price = $poCostUnit;
                    // Persist for future quick lookups if currently 0 in DB
                    if (((float)$product->getRawOriginal('buying_price')) <= 0) {
                        // Use direct update to avoid including dirty attributes like 'current_stock' which is not a real column
                        Product::where('id', $product->id)->update(['buying_price' => $poCostUnit]);
                        if ($pm = $product->productManagement) {
                            $pm->update(['buying_price' => $poCostUnit]);
                        }
                    }
                } else {
                    // Fallback to BOM if no production order exists
                    $bomCost = 0;
                    if ($bom = $product->bom) {
                        foreach ($bom->items as $item) {
                            $rm = $item->rawMaterial;
                            if ($rm) {
                                $cost = $rm->unit_price ?? ($rm->buying_price ?? 0);
                                $bomCost += ((float)$item->quantity * (float)$cost);
                            }
                        }
                    }
                    if ($bomCost > 0) {
                        $product->buying_price = $bomCost;
                        if (((float)$product->getRawOriginal('buying_price')) <= 0) {
                            Product::where('id', $product->id)->update(['buying_price' => $bomCost]);
                        }
                    }
                }
            }
            $product->status        = $product->is_enabled ? 'active' : 'inactive';
            $product->clean_name    = $cleanName ?: $product->product_name;
            $product->is_public     = (bool) ($pm?->is_public ?? false);
            $product->category_name = $pm?->category_name ?? $product->category?->category_name ?? 'General';
            $product->image_url     = ($pm && $pm->image_1) ? asset('storage/' . $pm->image_1) : null;

            return $product;
        });

        return \Inertia\Inertia::render('Products/Index', [
            'products' => [
                'data'         => $products->items(),
                'current_page' => $products->currentPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ],
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status', 'all'),
                'type'   => $request->input('type', 'all'),
            ],
        ]);
    }


    /**
     * Store a newly created product
     */
    public function storeCrud(Request $request)
    {
        // Use session branch first (respects admin's selected branch in header switcher)
        $branchId = session('active_branch_id') ?? active_branch_id() ?? (int) $request->input('branch_id') ?: null;

        $request->validate([
            'product_name'      => 'required|string|max:255',
            'sku'               => 'nullable|string|max:100',
            'category_id'       => 'nullable|exists:categories,id',
            'store_id'          => 'nullable|exists:stores,id',
            'total_buying_cost' => 'nullable|numeric|min:0',
            'opening_qty'       => 'nullable|numeric|min:0',
            'plain_selling_price' => 'nullable|numeric|min:0',
            'printed_selling_price' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Auto-generate SKU if empty or 'Auto'
            $sku = ($request->sku && $request->sku !== 'Auto')
                ? $request->sku
                : 'PRD-' . strtoupper(substr(md5(uniqid()), 0, 6));

            // Resolve pricing
            $pricingNodes = json_decode($request->pricing_nodes ?? '[]', true) ?? [];
            $sellingPrice = isset($pricingNodes[0]) ? (float) $pricingNodes[0]['market_price'] : 0;
            $plainSellingPrice = $request->filled('plain_selling_price')
                ? (float) $request->plain_selling_price
                : $sellingPrice;
            $printedSellingPrice = $request->filled('printed_selling_price')
                ? (float) $request->printed_selling_price
                : $plainSellingPrice;
            $buyingPrice  = (float) ($request->total_buying_cost ?? 0);
            $convRatio    = max(1, (float) ($request->conv_ratio ?? 1));
            $costPerBase  = $convRatio > 0 ? round($buyingPrice / $convRatio, 4) : 0;

            // 1. Insert into products (lean table)
            $product = Product::create([
                'product_name'  => $request->product_name,
                'product_id'    => $sku,
                'product_price' => $plainSellingPrice,
                'buying_price'  => $buyingPrice,
                'is_enabled'    => filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN),
                'product_type'  => 'trading',
                'branch_id'     => $branchId,
                'reorder_point' => (float) ($request->reorder_level ?? 0),
            ]);

            // Resolve unit — always provide a non-null name and id
            $resolvedUnit = null;
            if ($request->base_unit) {
                $resolvedUnit = is_numeric($request->base_unit)
                    ? Unit::find((int) $request->base_unit)
                    : Unit::where('unit_name', $request->base_unit)->first();
            }
            $unitId   = $resolvedUnit?->id   ?? 1;   // fallback to id=1
            $unitName = $resolvedUnit?->unit_name ?? ($request->base_unit ?: 'unit');

            // Resolve category — always provide non-null id and name
            $category     = $request->category_id ? Category::find($request->category_id) : null;
            $categoryId   = $category?->id          ?? ($request->category_id ?: 1);
            $categoryName = $category?->category_name ?? 'General';

            // 2. Insert into product_managements (rich metadata)
            $pm = ProductManagement::create([
                'product_name'        => $request->product_name,           // NOT NULL
                'sku'                 => $sku,
                'product_type'        => 'trading',
                'barcode'             => $request->barcode,
                'brand'               => $request->brand,
                'buying_unit_id'      => $unitId,
                'qty_in_buying_unit'  => $convRatio,
                'cost_per_base_unit'  => $costPerBase,
                'unit_id'             => $unitId,                           // NOT NULL
                'unit_name'           => $unitName,                         // NOT NULL
                'unit_description'    => '',                                 // NOT NULL
                'product_price'       => $plainSellingPrice,
                'plain_selling_price' => $plainSellingPrice,
                'printed_selling_price' => $printedSellingPrice,
                'buying_price'        => $buyingPrice,
                'description'         => $request->description,
                'category_id'         => $categoryId,                       // NOT NULL
                'category_name'       => $categoryName,                     // NOT NULL
                'status'              => 'active',
                'level'               => (float) ($request->reorder_level ?? 0),
                'reorder_point'       => (float) ($request->reorder_level ?? 0),
                'low_stock_threshold' => (float) ($request->low_alert ?? 0),
                'material'            => $request->material_type,
                'weight'              => $request->weight,
                'weight_unit'         => $request->weight_unit,
                'width'               => $request->width,
                'length'              => $request->length,
                'height'              => $request->box_h,
                'dimension_unit'      => $request->box_unit,
                'sale_units'          => $request->pricing_nodes,
                'specifications'      => $request->tech_specs,
                'is_enabled'          => filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN),
                'is_featured'         => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN),
                'is_public'           => filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN),
                'branch_id'           => $branchId,
            ]);

            // Update product with product_management_id link
            $product->update(['product_management_id' => $pm->id]);

            // 3. Save images (image_1..image_5 columns)
            $imageUpdates = [];
            foreach (range(0, 4) as $i) {
                $key = "images.{$i}";
                if ($request->hasFile($key)) {
                    $path = $request->file($key)->store('products', 'public');
                    $imageUpdates['image_' . ($i + 1)] = $path;
                }
            }
            if (!empty($imageUpdates)) {
                $pm->update($imageUpdates);
            }

            // 4. Save technical specifications
            $techSpecs = json_decode($request->tech_specs ?? '[]', true) ?? [];
            foreach ($techSpecs as $spec) {
                if (!empty($spec['title'])) {
                    ProductSpecification::create([
                        'product_id' => $product->id,
                        'title'      => $spec['title'],
                        'value'      => $spec['value'] ?? '',
                    ]);
                }
            }

            // 5. Create opening inventory record
            $storeId   = $request->store_id;
            $openingQty = (float) ($request->opening_qty ?? 0);
            if ($storeId && $openingQty > 0) {
                $inventory = Inventory::firstOrCreate(
                    ['product_id' => $product->id, 'product_type' => 'finished_product', 'store_id' => $storeId],
                    ['qty' => 0, 'branch_id' => $branchId, 'reorder_level' => (float)($request->reorder_level ?? 0)]
                );
                $inventory->increment('qty', $openingQty);

                // Add log for initial stock
                \App\Models\InventoryLog::create([
                    'product_id' => $product->id,
                    'product_type' => 'finished_product',
                    'store_id' => $storeId,
                    'branch_id' => $branchId,
                    'qty_before' => 0,
                    'qty_after' => $openingQty,
                    'change' => $openingQty,
                    'type' => 'adjustment',
                    'note' => 'Initial opening stock upon product creation.',
                    'user_id' => \Illuminate\Support\Facades\Auth::id(),
                ]);
            }

            DB::commit();
            return redirect('/products-new/' . $product->id)
                ->with('success', '"' . $product->product_name . '" published successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create product: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Display the specified product — full detail for trading & manufactured products
     */
    public function showCrud($id)
    {
        $branchId = active_branch_id();

        $product = Product::with([
            'productManagement',
            'specifications',
            'bom.items.rawMaterial',
            'variants',
        ])->findOrFail($id);

        $pm = $product->productManagement;

        // Stock per store
        $inventoriesByStore = Inventory::where('product_id', $product->id)
            ->with('store:id,store_name')
            ->get()
            ->map(fn($inv) => [
                'store_name' => $inv->store?->store_name ?? 'Unknown',
                'qty'        => (float) $inv->qty,
            ]);

        $totalStock = $inventoriesByStore->sum('qty');

        // Stock movements
        $stockMovements = InventoryTransaction::where('product_id', $product->id)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get()
            ->map(fn($t) => [
                'id'         => $t->id,
                'type'       => in_array($t->transaction_type, ['in','adjustment','purchase','production']) ? 'in' : 'out',
                'quantity'   => abs((float)($t->quantity_in ?? $t->quantity ?? 0) - (float)($t->quantity_out ?? 0)),
                'reference'  => $t->notes ?? $t->reference_type ?? 'Manual',
                'store'      => $t->store?->store_name ?? '—',
                'created_at' => $t->created_at->toDateTimeString(),
            ]);

        // BOM materials (for manufactured products)
        $bomItems = [];
        if ($product->bom) {
            $bomItems = $product->bom->items->map(fn($item) => [
                'material_name' => $item->rawMaterial?->name ?? $item->material_name ?? '—',
                'qty_per_unit'  => $item->quantity ?? 0,
                'unit'          => $item->unit ?? '—',
            ])->toArray();
        }

        // Parse sale_units and specifications from PM JSON fields
        $saleUnits     = json_decode($pm?->sale_units ?? '[]', true) ?? [];
        $techSpecs     = json_decode($pm?->specifications ?? '[]', true) ?? [];

        // Images (image_1 .. image_5 on PM)
        $images = [];
        if ($pm) {
            foreach (range(1, 5) as $i) {
                $img = $pm->{"image_{$i}"};
                if ($img) $images[] = asset('storage/' . $img);
            }
        }

        $colorVariants = ($product->product_type === 'manufactured' || $product->product_type === 'trading')
            ? $product->variants->map(fn($v) => [
                'id'            => $v->id,
                'color'         => $v->color,
                'qty'           => (float) ($v->qty ?? 0),
                'plain_qty'     => (float) ($v->plain_qty ?? 0),
                'printed_qty'   => (float) ($v->printed_qty ?? 0),
                'buying_price'  => (float) ($v->buying_price ?? 0),
                'selling_price' => (float) ($v->selling_price ?? 0),
                'branch_id'     => $v->branch_id,
            ])->values()->all()
            : [];

        return \Inertia\Inertia::render('Products/Show', [
            'product' => [
                'id'             => $product->id,
                'name'           => $product->product_name,
                'sku'            => $product->product_id,
                'product_type'   => $product->product_type, // 'trading' | 'manufactured' | 'raw_material'
                'status'         => $product->is_enabled ? 'active' : 'inactive',
                'created_at'     => $product->created_at->toDateTimeString(),
                'updated_at'     => $product->updated_at->toDateTimeString(),
                // Pricing
                'selling_price'  => (float) ($pm?->product_price  ?? $product->product_price  ?? 0),
                'plain_price'    => (float) ($pm?->plain_selling_price ?? $pm?->product_price ?? $product->product_price ?? 0),
                'printed_price'  => (float) ($pm?->printed_selling_price ?? $pm?->plain_selling_price ?? $pm?->product_price ?? $product->product_price ?? 0),
                'cost_price'     => (float) ($pm?->buying_price    ?? $product->buying_price   ?? 0),
                // Category & Unit
                'category'       => $pm?->category_name ? ['name' => $pm->category_name] : null,
                'brand'          => $pm?->brand,
                'unit_of_measurement' => $pm?->unit_name ?? 'pcs',
                'description'    => $pm?->description ?? $product->description ?? null,
                // Inventory
                'reorder_level'  => (float) ($product->reorder_point ?? $pm?->reorder_point ?? 0),
                'low_alert'      => (float) ($pm?->low_stock_threshold ?? 0),
                'current_stock'  => $totalStock,
                'total_stock_value' => $totalStock * (float)($product->buying_price ?? 0),
                'inventories_by_store' => $inventoriesByStore,
                // Physical specs
                'brand'          => $pm?->brand,
                'material'       => $pm?->material,
                'weight'         => $pm?->weight,
                'weight_unit'    => $pm?->weight_unit,
                'width'          => $pm?->width,
                'length'         => $pm?->length,
                'height'         => $pm?->height,
                'dimension_unit' => $pm?->dimension_unit,
                // Sale units pricing nodes
                'sale_units'     => $saleUnits,
                // Tech specs
                'specifications' => $techSpecs,
                // Images
                'images'         => $images,
                // BOM (manufacturing)
                'bom_items'      => $bomItems,
                // Movements
                'stock_movements' => $stockMovements,
                // Color variants (manufactured/trading)
                'variants'      => $colorVariants,
            ],
            'color_variants' => $colorVariants,
        ]);
    }

    /**
     * Show the form for editing the specified product
     */
    /**
     * Show the form for editing the specified product
     */
    public function editCrud($id)
    {
        $product = Product::with(['productManagement', 'specifications', 'bom.items.rawMaterial'])->findOrFail($id);
        $pm = $product->productManagement;
        // Use session branch for global admins (active_branch_id() returns null for global users)
        $branchId = session('active_branch_id') ?? active_branch_id() ?? $product->branch_id;

        return \Inertia\Inertia::render('Products/Edit', [
            'product' => [
                'id'                => $product->id,
                'product_name'      => $product->product_name,
                'product_type'      => $product->product_type,
                'has_bom'           => (bool) $product->has_bom,
                'sku'               => $product->product_id,
                'barcode'           => $pm?->barcode,
                'category_id'       => $product->category_id ?? $pm?->category_id,
                'brand'             => $pm?->brand,
                'material_type'     => $pm?->material,
                'base_unit'         => $pm?->unit_id ?? $pm?->unit_name,
                'description'       => $pm?->description ?? $product->description,
                'total_buying_cost' => (float) ($pm?->buying_price ?? $product->buying_price ?? 0),
                'conv_ratio'        => (float) ($pm?->qty_in_buying_unit ?? 1),
                'reorder_level'     => (float) ($product->reorder_point ?? $pm?->reorder_point ?? 0),
                'low_alert'         => (float) ($pm?->low_stock_threshold ?? 0),
                'weight'            => $pm?->weight,
                'weight_unit'       => $pm?->weight_unit,
                'width'             => $pm?->width,
                'length'            => $pm?->length,
                'box_h'             => $pm?->height,
                'box_unit'          => $pm?->dimension_unit,
                'is_enabled'        => (bool) $product->is_enabled,
                'is_featured'       => (bool) ($pm?->is_featured ?? false),
                'is_public'         => (bool) ($pm?->is_public ?? false),
                'plain_selling_price' => (float) ($pm?->plain_selling_price ?? $pm?->product_price ?? $product->product_price ?? 0),
                'printed_selling_price' => (float) ($pm?->printed_selling_price ?? $pm?->plain_selling_price ?? $pm?->product_price ?? $product->product_price ?? 0),
                'pricing_nodes'     => json_decode($pm?->sale_units ?? '[]', true),
                'tech_specs'        => json_decode($pm?->specifications ?? '[]', true),
                'bom_items'         => $product->bom?->items->map(fn($bi) => [
                    'id'               => $bi->id,
                    'raw_material_id'  => $bi->raw_material_id,
                    'quantity'         => (float) $bi->quantity_required,
                    'material_name'    => $bi->rawMaterial?->name ?? 'Unknown',
                ]) ?? [],
                'images'            => collect(range(1, 5))->map(fn($i) => $pm?->{"image_$i"} ? asset('storage/' . $pm->{"image_$i"}) : null)->filter()->values(),
            ],
            'categories' => Category::orderBy('category_name', 'asc')->get()->map(fn($cat) => [
                'id'   => $cat->id,
                'name' => $cat->category_name
            ]),
            'units' => Unit::orderBy('unit_name', 'asc')->get()->map(fn($u) => [
                'id'   => $u->id,
                'name' => $u->unit_name
            ]),
            'stores' => Store::with('branches')->get()->map(function ($s) {
                // Resolve branch_id from pivot if direct column is null
                $bid = $s->branch_id ?? $s->branches->first()?->id;
                return ['id' => $s->id, 'name' => $s->store_name, 'branch_id' => $bid];
            }),
            // For BOM editing
            'raw_materials' => RawMaterial::orderBy('name')->get()->map(fn($rm) => [
                'id'   => $rm->id,
                'name' => $rm->name
            ]),
            'branches'       => \App\Models\Branch::where('is_active', true)->get()->map(fn($b) => ['id' => $b->id, 'name' => $b->name]),
            'activeBranchId' => $branchId,
        ]);
    }



    /**
     * Update the specified product in storage
     */
    public function updateCrud(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $pm = $product->productManagement;
        $branchId = session('active_branch_id')
            ?? active_branch_id()
            ?? $product->branch_id
            ?? ($pm?->branch_id)
            ?? (Auth::check() ? Auth::user()->branch_id : null)
            ?? 1;

        $request->validate([
            'product_name'      => 'required|string|max:255',
            'sku'               => 'nullable|string|max:100',
            'category_id'       => 'nullable|exists:categories,id',
            'total_buying_cost' => 'nullable|numeric|min:0',
            'plain_selling_price' => 'nullable|numeric|min:0',
            'printed_selling_price' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $sku = ($request->sku && $request->sku !== 'Auto') ? $request->sku : $product->product_id;

            // Resolve pricing
            $pricingNodes = json_decode($request->pricing_nodes ?? '[]', true) ?? [];
            $sellingPrice = isset($pricingNodes[0]) ? (float) $pricingNodes[0]['market_price'] : 0;
            $plainSellingPrice = $request->filled('plain_selling_price')
                ? (float) $request->plain_selling_price
                : $sellingPrice;
            $printedSellingPrice = $request->filled('printed_selling_price')
                ? (float) $request->printed_selling_price
                : $plainSellingPrice;
            $buyingPrice  = (float) ($request->total_buying_cost ?? 0);
            $convRatio    = max(1, (float) ($request->conv_ratio ?? 1));
            $costPerBase  = $convRatio > 0 ? round($buyingPrice / $convRatio, 4) : 0;

            $category = $request->category_id ? Category::find($request->category_id) : null;

            // 1. Update Product
            $product->update([
                'product_name'  => $request->product_name,
                'product_id'    => $sku,
                'product_type'  => $request->product_type ?: $product->product_type,
                'has_bom'       => filter_var($request->has_bom, FILTER_VALIDATE_BOOLEAN),
                'product_price' => $plainSellingPrice,
                'buying_price'  => $buyingPrice,
                'is_enabled'    => filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN),
                'reorder_point' => (float) ($request->reorder_level ?? 0),
            ]);

            // Resolve units
            $resolvedUnit = null;
            if ($request->base_unit) {
                $resolvedUnit = is_numeric($request->base_unit)
                    ? Unit::find((int) $request->base_unit)
                    : Unit::where('unit_name', $request->base_unit)->first();
            }
            $unitId   = $resolvedUnit?->id   ?? 1;
            $unitName = $resolvedUnit?->unit_name ?? ($request->base_unit ?: 'unit');

            // 2. Update or Create ProductManagement
            $pmData = [
                'product_name'        => $request->product_name,
                'sku'                 => $sku,
                'barcode'             => $request->barcode,
                'brand'               => $request->brand,
                'buying_unit_id'      => $unitId,
                'qty_in_buying_unit'  => $convRatio,
                'cost_per_base_unit'  => $costPerBase,
                'unit_id'             => $unitId,
                'unit_name'           => $unitName,
                'unit_description'    => '',
                'product_price'       => $plainSellingPrice,
                'plain_selling_price' => $plainSellingPrice,
                'printed_selling_price' => $printedSellingPrice,
                'buying_price'        => $buyingPrice,
                'description'         => $request->description,
                'category_id'         => $category?->id ?? 1,
                'category_name'       => $category?->category_name ?? 'General',
                'level'               => (float) ($request->reorder_level ?? 0),
                'reorder_point'       => (float) ($request->reorder_level ?? 0),
                'low_stock_threshold' => (float) ($request->low_alert ?? 0),
                'material'            => $request->material_type,
                'weight'              => $request->weight,
                'weight_unit'         => $request->weight_unit,
                'width'               => $request->width,
                'length'              => $request->length,
                'height'              => $request->box_h,
                'dimension_unit'      => $request->box_unit,
                'sale_units'          => $request->pricing_nodes,
                'specifications'      => $request->tech_specs,
                'is_enabled'          => filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN),
                'is_featured'         => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN),
                'is_public'           => filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN),
            ];

            if ($pm) {
                $pm->update($pmData);
            } else {
                $pm = ProductManagement::create(array_merge($pmData, [
                    'product_management_id' => $product->id, // If needed
                    'product_type'          => $product->product_type,
                    'branch_id'             => $branchId,
                ]));
                $product->update(['product_management_id' => $pm->id]);
            }

            // 3. Handle Images
            $imageUpdates = [];
            foreach (range(0, 4) as $i) {
                $key = "images.{$i}";
                if ($request->hasFile($key)) {
                    $path = $request->file($key)->store('products', 'public');
                    $imageUpdates['image_' . ($i + 1)] = $path;
                }
            }
            if (!empty($imageUpdates)) {
                $pm->update($imageUpdates);
            }

            // 4. Update specs (simplified: delete and recreate)
            \App\Models\ProductSpecification::where('product_id', $product->id)->delete();
            $techSpecs = json_decode($request->tech_specs ?? '[]', true) ?? [];
            foreach ($techSpecs as $spec) {
                if (!empty($spec['title'])) {
                    \App\Models\ProductSpecification::create([
                        'product_id' => $product->id,
                        'title'      => $spec['title'],
                        'value'      => $spec['value'] ?? '',
                    ]);
                }
            }

            // 5. Update BOM (if manufactured)
            if ($request->product_type === 'manufactured' || $product->product_type === 'manufactured') {
                $bom = \App\Models\Bom::firstOrCreate(
                    ['finished_product_id' => $product->id],
                    ['branch_id' => $branchId, 'version' => '1.0', 'is_active' => true]
                );
                
                // Delete existing items and recreate
                $bom->items()->delete();
                $bomItemsData = json_decode($request->bom_items ?? '[]', true) ?? [];
                foreach ($bomItemsData as $item) {
                    if (!empty($item['raw_material_id'])) {
                        $bom->items()->create([
                            'raw_material_id'   => $item['raw_material_id'],
                            'quantity_required' => (float) ($item['quantity'] ?? 1),
                        ]);
                    }
                }
            }

            DB::commit();
            return redirect('/products-new/' . $product->id)->with('success', 'Product updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update product: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified product from storage
     */
    public function reactivateCrud($id)
    {
        $product = Product::findOrFail($id);

        try {
            DB::beginTransaction();

            $product->update(['is_enabled' => true]);

            if ($product->product_management_id) {
                ProductManagement::where('id', $product->product_management_id)
                    ->update(['is_enabled' => true]);
            }

            DB::commit();
            return redirect('/products-new')->with('success', 'Product reactivated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to reactivate product: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified product from storage
     */
    public function destroyCrud($id)
    {
        $product = Product::findOrFail($id);

        try {
            DB::beginTransaction();

            $productManagementId = $product->product_management_id;

            // Delete direct dependents first, then delete product to satisfy FK order.
            ProductSpecification::where('product_id', $product->id)->delete();
            Inventory::where('product_id', $product->id)->delete();
            
            $product->delete();

            // Clean up orphaned product management record (if no products reference it).
            if ($productManagementId && Product::where('product_management_id', $productManagementId)->doesntExist()) {
                ProductManagement::where('id', $productManagementId)->delete();
            }

            DB::commit();
            return redirect('/products-new')->with('success', 'Product deleted successfully');
        } catch (QueryException $e) {
            DB::rollBack();

            try {
                DB::beginTransaction();

                $productManagementId = $product->product_management_id;

                // Fallback behavior: archive instead of hard delete when FK relations exist.
                $product->update(['is_enabled' => false]);

                if ($productManagementId) {
                    $hasAnyActiveSibling = Product::where('product_management_id', $productManagementId)
                        ->where('id', '!=', $product->id)
                        ->where('is_enabled', true)
                        ->exists();

                    if (!$hasAnyActiveSibling) {
                        ProductManagement::where('id', $productManagementId)->update(['is_enabled' => false]);
                    }
                }

                DB::commit();
                return redirect('/products-new')->with('success', 'Product is linked to records and has been archived successfully.');
            } catch (\Exception $archiveException) {
                DB::rollBack();
                return back()->withErrors([
                    'error' => 'Failed to delete or archive product: ' . $archiveException->getMessage(),
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete product: ' . $e->getMessage()]);
        }
    }
}

