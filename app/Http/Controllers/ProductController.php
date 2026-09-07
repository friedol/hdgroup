<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Export;
use App\Models\Inventory;
use App\Models\InventoryLog;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductManagement;
use App\Models\ProductManagementImage;
use App\Models\ProductSpecification;
use App\Models\ProductVariant;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\Transfer;
use App\Models\Unit;
use App\Models\User;
use App\Services\InventoryService;
use App\Traits\FileUploadTrait;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    use FileUploadTrait;

    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Convert raw inventory qty (stored in absolute base units) to the product's display unit.
     * e.g. 34300 pieces ÷ factor 20 → 1715 Catton
     *
     * @return array{qty: float, unit: string, factor: float}
     */
    private function resolveDisplayQty(float $rawQty, array $saleUnits, string $unitName): array
    {
        $factor = 1.0;
        $unitLower = strtolower(trim($unitName));

        foreach ($saleUnits as $su) {
            $suName = strtolower(trim($su['unit_name'] ?? $su['name'] ?? ''));
            if ($suName === $unitLower) {
                $factor = max(1.0, (float) ($su['factor'] ?? 1));
                break;
            }
        }
        // Fallback: first node's factor when unit name doesn't match any node
        if ($factor === 1.0 && ! empty($saleUnits)) {
            $factor = max(1.0, (float) ($saleUnits[0]['factor'] ?? 1));
        }

        return [
            'qty' => $factor > 1 ? round($rawQty / $factor, 4) : $rawQty,
            'unit' => $unitName ?: 'pcs',
            'factor' => $factor,
        ];
    }

    public function index(Request $request)
    {
        return $this->indexCrud($request);
    }

    public function create(Request $request)
    {
        // Use session branch for global admins (active_branch_id() returns null for global users)
        $branchId = session('active_branch_id') ?? active_branch_id();

        return Inertia::render('Products/Create', [
            // Categories and units are a shared taxonomy across branches — always show the
            // full list rather than filtering by the viewer's active branch. Previously this
            // filtered to branch-only-or-null categories, which meant a global admin with no
            // branch selected in session (branchId null) would only ever see "General".
            'categories' => Category::withoutGlobalScope('branch')
                ->orderBy('category_name', 'asc')->get()
                ->unique('category_name')->values()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->category_name]),
            'units' => Unit::withoutGlobalScope('branch')
                ->orderBy('unit_name', 'asc')->get()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->unit_name]),
            'stores' => Store::with('branches')->orderBy('store_name')->get()
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->store_name, 'branch_id' => $s->branch_id ?? $s->branches->first()?->id]),
            'branches' => Branch::where('is_active', true)->get()->map(fn ($b) => ['id' => $b->id, 'name' => $b->name]),
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
            'variants',
            'inventories' => function ($query) {
                $query->selectRaw('product_id, SUM(qty) as total_qty')
                    ->groupBy('product_id');
            },
        ])->where('id', $lookupId)
            ->orWhere('product_id', $lookupId)
            ->orWhere('product_id', $id) // Fallback for raw SKU
            ->first();

        if (! $product) {
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

        // Get store quantities — convert to display unit using product's sale_units factor
        $branchId = session('active_branch_id') ?? (Auth::check() ? Auth::user()->branch_id : null);
        $showPm = $product->productManagement;
        $showRawUnits = $showPm?->sale_units ?? [];
        $showSaleUnits = is_array($showRawUnits) ? $showRawUnits : (json_decode($showRawUnits, true) ?? []);
        $showUnitName = $showPm?->unit_name ?? 'pcs';

        $d['stores'] = Inventory::where('product_id', $product->id)
            ->select('store_id', DB::raw('SUM(qty) as total_qty'))
            ->groupBy('store_id')
            ->with('store:id,store_name')
            ->get()
            ->map(function ($item) use ($showSaleUnits, $showUnitName) {
                $display = $this->resolveDisplayQty((float) $item->total_qty, $showSaleUnits, $showUnitName);

                return (object) [
                    'store_name' => $item->store->store_name ?? 'Unknown',
                    'total_qty' => $display['qty'],
                    'unit' => $display['unit'],
                ];
            })
            ->values();

        // ── COLOR VARIANTS (manufactured products) ──────────────────────
        $d['color_variants'] = ($product->product_type === 'manufactured' || $product->product_type === 'trading')
            ? $product->variants->map(fn ($v) => [
                'color' => $v->color,
                'qty' => (float) $v->qty,
                'plain_qty' => (float) ($v->plain_qty ?? 0),
                'printed_qty' => (float) ($v->printed_qty ?? 0),
                'buying_price' => (float) $v->buying_price,
                'selling_price' => (float) $v->selling_price,
                'branch_id' => $v->branch_id,
            ])->values()->all()
            : [];

        // ──────────────────────────────────────────────────────────────
        // FETCH PRODUCTION / USAGE HISTORY
        // ──────────────────────────────────────────────────────────────
        $d['productionHistory'] = collect();
        $d['usageHistory'] = collect();

        return Inertia::render('Products/Show', $d);
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
            'product_type' => 'required|in:trading,manufactured',

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
                $sku = 'SKU-'.strtoupper(substr(uniqid(), -8));
            }

            // 3. Create or Update ProductManagement (Master)
            $cat = Category::withoutGlobalScope('branch')->find($validatedData['category_id']);
            $unit = Unit::withoutGlobalScope('branch')->find($validatedData['unit_id']);
            $selectedStore = Store::find($validatedData['store_id']);
            // Robust fallback: Store Branch -> Session -> User Branch -> Default Branch (1)
            $branchId = (int) ($selectedStore->branch_id ?: session('active_branch_id') ?: Auth::user()->branch_id ?: 1);

            // 4. Handle Media First (to include in create)
            $imageSlots = [];
            for ($i = 1; $i <= 5; $i++) {
                $slotName = "image_slot_$i";
                if ($request->hasFile($slotName)) {
                    $path = $this->uploadFile($request->file($slotName), 'products/images');
                    $imageSlots["image_$i"] = $path;
                }
            }
            $videoFile = $request->hasFile('video')
                ? $this->uploadFile($request->file('video'), 'products/videos')
                : null;

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
                'product_price' => ! empty($saleUnits) ? $saleUnits[0]['price'] : $resolvedBuyingPrice,
                'buying_price' => $resolvedBuyingPrice,
                'unit_price' => ! empty($saleUnits) ? $saleUnits[0]['price'] : $resolvedBuyingPrice,
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

            // Initial Inventory — convert entered qty (in base unit) to absolute smallest units
            $baseUnitFactor = 1.0;
            $unitNameLower = strtolower(trim($unit?->unit_name ?? ''));
            foreach ($saleUnits as $su) {
                if (strtolower(trim($su['name'] ?? '')) === $unitNameLower) {
                    $baseUnitFactor = max(1.0, (float) ($su['factor'] ?? 1));
                    break;
                }
            }
            if ($baseUnitFactor === 1.0 && ! empty($saleUnits)) {
                $baseUnitFactor = max(1.0, (float) ($saleUnits[0]['factor'] ?? 1));
            }
            $this->inventoryService->adjustInventory(
                $productInstance->id,
                (int) round($validatedData['product_quantity'] * $baseUnitFactor),
                $validatedData['store_id'],
                'increase',
                'opening_stock',
                "Initial stock: {$validatedData['product_quantity']} {$unit?->unit_name} × factor {$baseUnitFactor}"
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

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PRODUCT_STORE_FAILURE: '.$e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);

            return response()->json(['error' => 'Failure: '.$e->getMessage()], 500);
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
            'sku' => 'required|string|max:100|unique:product_managements,sku,'.$pm->id,
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
                        $this->deleteFile($pm->{"image_$i"});
                    }
                    $path = $this->uploadFile($request->file($slotName), 'products/images');
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
            $cat = Category::withoutGlobalScope('branch')->find($validatedData['category_id']);
            $unit = Unit::withoutGlobalScope('branch')->find($validatedData['unit_id']);

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
                'product_price' => ! empty($saleUnits) ? $saleUnits[0]['price'] : $validatedData['buying_price'],
                'buying_price' => $validatedData['buying_price'],
                'unit_price' => ! empty($saleUnits) ? $saleUnits[0]['price'] : $validatedData['buying_price'],
                'is_enabled' => $pm->is_enabled,
            ]);

            DB::commit();

            return redirect()->route('all-products.index')->with('success', 'Product updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PRODUCT_UPDATE_FAILURE: '.$e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);

            return response()->json(['error' => 'Update Failed: '.$e->getMessage()], 500);
        }
    }

    public function edit(string $id)
    {
        $this->phpInitialize();
        $lookupId = str_replace('SKU: ', '', $id);
        $product = Product::with(['productManagement', 'inventories', 'specifications'])
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
                    $images[] = asset('storage/'.$pm->$field);
                }
            }
            $product->images = $images;

            // Pricing Nodes
            $product->pricing_nodes = $pm->sale_units ?? [];

            // Tech Specs
            $product->tech_specs = $pm->specifications ?? [];
        }

        $product->bom_items = [];

        $editUnitsFn = function () use ($branchId) {
            if ($branchId) {
                $units = Unit::withoutGlobalScope('branch')
                    ->where('branch_id', $branchId)
                    ->orderBy('unit_name', 'asc')
                    ->get();
                if ($units->isNotEmpty()) {
                    return $units->map(fn ($u) => ['id' => $u->id, 'name' => $u->unit_name]);
                }
            }

            return Unit::withoutGlobalScope('branch')
                ->whereNull('branch_id')
                ->orderBy('unit_name', 'asc')
                ->get()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->unit_name]);
        };

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => Category::withoutGlobalScope('branch')
                ->where(function ($q) use ($branchId) {
                    $q->whereNull('branch_id');
                    if ($branchId) {
                        $q->orWhere('branch_id', $branchId);
                    }
                })
                ->orderBy('branch_id', 'desc')->orderBy('category_name', 'asc')->get()
                ->unique('category_name')->sortBy('category_name')->values()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->category_name]),
            'units' => $editUnitsFn(),
            'stores' => Store::orderBy('store_name')->get()
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->store_name]),
            'raw_materials' => [],
            'activeBranchId' => $branchId,
            'branches' => Branch::where('is_active', true)->get()->map(fn ($b) => ['id' => $b->id, 'name' => $b->name]),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // $id is product_id (SKU)
        DB::beginTransaction();
        try {
            // 1. Find the master record (try id, sku, or prefixed sku)
            $lookupId = str_replace('SKU: ', '', $id);
            $product = Product::where('id', $lookupId)
                ->orWhere('product_id', $lookupId)
                ->orWhere('product_id', $id)
                ->first();

            if (! $product) {
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
                    InventoryLog::where('inventory_id', $inventory->id)->delete();
                }

                // Delete inventories
                Inventory::where('product_id', $product->id)->delete();

                // Delete color variants
                ProductVariant::where('product_id', $product->id)->delete();

                // Delete product instance
                $product->delete();
            }

            // 3. Clear master record and images
            if ($pm) {
                $images = ProductManagementImage::where('product_management_id', $pm->id)->get();
                foreach ($images as $img) {
                    if ($img->image_path && Storage::disk('public')->exists($img->image_path)) {
                        Storage::disk('public')->delete($img->image_path);
                    }
                    $img->delete();
                }
                $pm->delete();
            }

            DB::commit();

            return response()->json(['success' => 'Product and all associated data deleted successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Deletion Failed: '.$e->getMessage()], 500);
        }
    }

    public function toggleStatus(Request $request)
    {
        $product = Product::findOrFail($request->id);
        if ($product) {
            $product->is_enabled = ! $product->is_enabled;
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
            $pm->is_public = ! $pm->is_public;
            $pm->save();

            return response()->json([
                'status' => 'success',
                'is_public' => $pm->is_public,
                'message' => $pm->is_public ? 'Product is now public' : 'Product set to private',
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'Product management not found'], 404);
    }

    public function instock_product()
    {
        $branchId = active_branch_id();
        $invSvc = new InventoryService;
        $products = Product::where('is_enabled', true)
            ->with(['productManagement'])
            ->get()
            ->map(function ($product) use ($branchId, $invSvc) {
                $rawQty = (float) $invSvc->getTotalInventoryQuantity($product->id, Product::class, $branchId);
                $pm = $product->productManagement;
                $rawUnits = $pm?->sale_units ?? [];
                $pmUnits = is_array($rawUnits) ? $rawUnits : (json_decode($rawUnits, true) ?? []);
                $display = $this->resolveDisplayQty($rawQty, $pmUnits, $pm?->unit_name ?? 'pcs');
                $product->total_qty = $display['qty'];
                $product->stock_unit = $display['unit'];

                return $product;
            })
            ->filter(function ($product) {
                $threshold = (float) ($product->level ?: 0);

                return $product->total_qty > $threshold;
            })->values();

        return Inertia::render('Admin/Products/InstockOutstockProducts', [
            'products' => $products,
            'addTrue' => true,
            'title' => 'Instock Product',
        ]);
    }

    public function less_product()
    {
        $branchId = active_branch_id();
        $invSvc = new InventoryService;
        $products = Product::where('is_enabled', true)
            ->with(['productManagement'])
            ->get()
            ->map(function ($product) use ($branchId, $invSvc) {
                $rawQty = (float) $invSvc->getTotalInventoryQuantity($product->id, Product::class, $branchId);
                $pm = $product->productManagement;
                $rawUnits = $pm?->sale_units ?? [];
                $pmUnits = is_array($rawUnits) ? $rawUnits : (json_decode($rawUnits, true) ?? []);
                $display = $this->resolveDisplayQty($rawQty, $pmUnits, $pm?->unit_name ?? 'pcs');
                $product->total_qty = $display['qty'];
                $product->stock_unit = $display['unit'];

                return $product;
            })
            ->filter(function ($product) {
                $threshold = (float) ($product->level ?: 0);

                return $product->total_qty <= $threshold && $product->total_qty > 0;
            })->values();

        return Inertia::render('Admin/Products/InstockOutstockProducts', [
            'products' => $products,
            'addTrue' => false,
            'title' => 'Low Stock Alert',
        ]);
    }

    public function outstock_product()
    {
        $branchId = active_branch_id();
        $invSvc = new InventoryService;
        $products = Product::where('is_enabled', true)
            ->with(['productManagement'])
            ->get()
            ->map(function ($product) use ($branchId, $invSvc) {
                $rawQty = (float) $invSvc->getTotalInventoryQuantity($product->id, Product::class, $branchId);
                $pm = $product->productManagement;
                $rawUnits = $pm?->sale_units ?? [];
                $pmUnits = is_array($rawUnits) ? $rawUnits : (json_decode($rawUnits, true) ?? []);
                $display = $this->resolveDisplayQty($rawQty, $pmUnits, $pm?->unit_name ?? 'pcs');
                $product->total_qty = $display['qty'];
                $product->stock_unit = $display['unit'];

                return $product;
            })
            ->filter(function ($product) {
                return $product->total_qty <= 0;
            })->values();

        return Inertia::render('Admin/Products/InstockOutstockProducts', [
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

        $query = Product::with(['productManagement'])->orderBy('product_name', 'asc');

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

        // Add stock, image, public status and clean name to each product
        $products->getCollection()->transform(function ($product) use ($branchId) {
            $pm = $product->productManagement;

            // Clean name: strip dimension patterns like "40.00x48.00cm"
            $cleanName = trim(preg_replace('/\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?:cm|mm|m|in|")?/i', '', $product->product_name ?? ''));
            $cleanName = trim(preg_replace('/\s*custom\s*$/i', '', $cleanName));

            $inventories = Inventory::where('product_id', $product->id)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->get();

            $rawSaleUnits = $pm?->sale_units ?? [];
            $pmSaleUnits = is_array($rawSaleUnits) ? $rawSaleUnits : (json_decode($rawSaleUnits, true) ?? []);
            $pmUnitName = $pm?->unit_name ?? 'pcs';
            $displayStock = $this->resolveDisplayQty((float) $inventories->sum('qty'), $pmSaleUnits, $pmUnitName);

            $product->display_qty = $displayStock['qty'];
            $product->stock_unit = $displayStock['unit'];
            $product->stock_factor = $displayStock['factor'];

            $product->status = $product->is_enabled ? 'active' : 'inactive';
            $product->clean_name = $cleanName ?: $product->product_name;
            $product->is_public = (bool) ($pm?->is_public ?? false);
            $product->category_name = $pm?->category_name ?? $product->category?->category_name ?? 'General';
            $product->image_url = ($pm && $pm->image_1) ? asset('storage/'.$pm->image_1) : null;

            // Selling price fields from ProductManagement
            $product->selling_price = (float) ($pm?->product_price ?? $product->product_price ?? 0);

            return $product;
        });

        // ─── Store Report Calculation ───
        $salesItemsQuery = SaleItem::select(
            'sale_items.quantity',
            'sale_items.variant_color',
            'products.product_name'
        )
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.is_return', false);

        if ($branchId && $branchId !== 'all') {
            $salesItemsQuery->where('sales.branch_id', $branchId);
        }

        $allSoldItems = $salesItemsQuery->get();

        $colorsSold = $allSoldItems->groupBy(function ($item) {
            return ! empty($item->variant_color) ? ucfirst(strtolower(trim($item->variant_color))) : 'Standard / Plain';
        })->map(function ($group, $color) {
            return [
                'color' => $color,
                'qty' => (float) $group->sum('quantity'),
            ];
        })->sortByDesc('qty')->values()->take(10);

        $sizesSold = $allSoldItems->groupBy(function ($item) {
            if (preg_match('/\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?:cm|mm|m|in|")?/i', $item->product_name, $matches)) {
                return strtolower(trim($matches[0]));
            }
            if (preg_match('/(?:small|medium|large|\d+\s*kg|\d+\s*ltr)/i', $item->product_name, $matches)) {
                return ucfirst(strtolower(trim($matches[0])));
            }

            return 'Standard Size';
        })->map(function ($group, $size) {
            return [
                'size' => $size,
                'qty' => (float) $group->sum('quantity'),
            ];
        })->sortByDesc('qty')->values()->take(10);

        return Inertia::render('Products/Index', [
            'products' => [
                'data' => $products->items(),
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status', 'all'),
                'type' => $request->input('type', 'all'),
            ],
            'storeReport' => [
                'total_bags_sold' => (float) $allSoldItems->sum('quantity'),
                'colors_sold' => $colorsSold,
                'sizes_sold' => $sizesSold,
            ],
        ]);
    }

    /**
     * Store a newly created product
     */
    public function storeCrud(Request $request)
    {
        // A product's branch is determined by the store it's stocked in — a store always
        // belongs to a branch, so resolve that first rather than relying on the admin's
        // session branch (which is null for global admins with no branch selected, and
        // previously left the product with no branch at all, invisible to branch staff).
        $selectedStore = $request->store_id ? Store::find($request->store_id) : null;
        $branchId = $selectedStore?->branch_id
            ?? $selectedStore?->branches()->first()?->id
            ?? ($request->filled('branch_id') ? (int) $request->branch_id : null)
            ?? session('active_branch_id')
            ?? active_branch_id()
            ?? (Auth::check() ? Auth::user()->branch_id : null)
            ?? 1;

        $request->validate([
            'product_name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'product_type' => 'required|in:trading,manufactured,raw_material',

            'total_buying_cost' => 'nullable|numeric|min:0',
            'opening_qty' => 'nullable|numeric|min:0',

            'branch_id' => 'nullable|exists:branches,id',
            'store_id' => 'nullable|exists:stores,id',
            'category_id' => 'nullable|exists:categories,id',
        ], [
            'product_name.required' => 'Product name is required.',
            'product_type.required' => 'Product type is required.',
            'product_type.in' => 'Product type must be trading, manufactured, or raw material.',

        ]);

        try {
            DB::beginTransaction();

            // Auto-generate SKU if empty or 'Auto'
            $sku = ($request->sku && $request->sku !== 'Auto')
                ? $request->sku
                : 'PRD-'.strtoupper(substr(md5(uniqid()), 0, 6));

            // Resolve pricing — derived entirely from the sale unit pricing nodes
            $pricingNodes = json_decode($request->pricing_nodes ?? '[]', true) ?? [];
            $sellingPrice = isset($pricingNodes[0]) ? (float) $pricingNodes[0]['market_price'] : 0;
            $plainSellingPrice = $sellingPrice;
            $printedSellingPrice = $plainSellingPrice;
            $buyingPrice = (float) ($request->total_buying_cost ?? 0);
            $convRatio = max(1, (float) ($request->conv_ratio ?? 1));
            $costPerBase = $convRatio > 0 ? round($buyingPrice / $convRatio, 4) : 0;

            // 1. Insert into products (lean table)
            $product = Product::create([
                'product_name' => $request->product_name,
                'product_id' => $sku,
                'product_price' => $plainSellingPrice,
                'buying_price' => $buyingPrice,
                'is_enabled' => true,
                'product_type' => $request->product_type ?: 'trading',
                'branch_id' => $branchId,
                'reorder_point' => (float) ($request->reorder_level ?? 0),
            ]);

            // Resolve unit — always provide a non-null name and id
            $resolvedUnit = null;
            if ($request->base_unit) {
                $resolvedUnit = is_numeric($request->base_unit)
                    ? Unit::withoutGlobalScope('branch')->find((int) $request->base_unit)
                    : Unit::withoutGlobalScope('branch')->where('unit_name', $request->base_unit)->first();
            }
            // Fallback: find any unit in the DB rather than hardcode id=1
            if (! $resolvedUnit) {
                $resolvedUnit = Unit::withoutGlobalScope('branch')->first();
            }
            $unitId = $resolvedUnit?->id;
            $unitName = $resolvedUnit?->unit_name ?? ($request->base_unit ?: 'unit');

            // Resolve category — look up by id, then by name, then first available
            $category = $request->category_id
                ? Category::withoutGlobalScope('branch')->find($request->category_id)
                : null;
            if (! $category) {
                $category = Category::withoutGlobalScope('branch')
                    ->where('category_name', 'General')->first()
                    ?? Category::withoutGlobalScope('branch')->first();
            }
            if (! $category) {
                // No categories exist at all — create a default so the FK is satisfied
                $category = Category::create(['category_name' => 'General', 'branch_id' => $branchId]);
            }
            $categoryId = $category->id;
            $categoryName = $category->category_name;

            // 2. Insert into product_managements (rich metadata)
            $pm = ProductManagement::create([
                'product_name' => $request->product_name,           // NOT NULL
                'sku' => $sku,
                'product_type' => $request->product_type ?: 'trading',
                'barcode' => $request->barcode,
                'brand' => $request->brand,
                'buying_unit_id' => $unitId,
                'qty_in_buying_unit' => $convRatio,
                'cost_per_base_unit' => $costPerBase,
                'unit_id' => $unitId,                           // NOT NULL
                'unit_name' => $unitName,                         // NOT NULL
                'unit_description' => '',                                 // NOT NULL
                'product_price' => $plainSellingPrice,
                'plain_selling_price' => $plainSellingPrice,
                'printed_selling_price' => $printedSellingPrice,
                'buying_price' => $buyingPrice,
                'description' => $request->description,
                'category_id' => $categoryId,                       // NOT NULL
                'category_name' => $categoryName,                     // NOT NULL
                'status' => 'active',
                'level' => (float) ($request->reorder_level ?? 0),
                'reorder_point' => (float) ($request->reorder_level ?? 0),
                'low_stock_threshold' => (float) ($request->low_alert ?? 0),
                'material' => $request->material_type,
                'weight' => $request->weight,
                'weight_unit' => $request->weight_unit,
                'width' => $request->width,
                'length' => $request->length,
                'height' => $request->box_h,
                'dimension_unit' => $request->box_unit,
                'sale_units' => array_values(array_filter($pricingNodes, fn ($n) => ! empty($n['unit_name']) || ! empty($n['name']))),
                'specifications' => json_decode($request->tech_specs ?? '[]', true) ?? [],
                'is_enabled' => filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN),
                'is_featured' => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN),
                'is_public' => filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN),
                'source_store_id' => $request->store_id ?: null,
                'branch_id' => $branchId,
            ]);

            // Update product with product_management_id link
            $product->update(['product_management_id' => $pm->id]);

            // 3. Save images (image_1..image_5 columns)
            $imageUpdates = [];
            foreach (range(0, 4) as $i) {
                $key = "images.{$i}";
                if ($request->hasFile($key)) {
                    $path = $request->file($key)->store('products', 'public');
                    $imageUpdates['image_'.($i + 1)] = $path;
                }
            }
            if (! empty($imageUpdates)) {
                $pm->update($imageUpdates);
            }

            // 4. Save technical specifications
            $techSpecs = json_decode($request->tech_specs ?? '[]', true) ?? [];
            foreach ($techSpecs as $spec) {
                if (! empty($spec['title'])) {
                    ProductSpecification::create([
                        'product_id' => $product->id,
                        'title' => $spec['title'],
                        'value' => $spec['value'] ?? '',
                    ]);
                }
            }

            // 5. Create opening inventory record
            // Convert entered qty (in base unit, e.g. cartons) to absolute smallest unit (pieces)
            // by multiplying by the base unit's factor from the pricing nodes.
            $storeId = $request->store_id;
            $openingQty = (float) ($request->opening_qty ?? 0);
            if ($storeId && $openingQty > 0) {
                // Find the factor of the selected base unit inside the pricing nodes
                $baseUnitFactor = 1.0;
                $unitNameNorm = strtolower(trim($unitName));
                foreach ($pricingNodes as $node) {
                    $nodeName = strtolower(trim($node['unit_name'] ?? $node['name'] ?? ''));
                    if ($nodeName === $unitNameNorm) {
                        $baseUnitFactor = max(1.0, (float) ($node['factor'] ?? 1));
                        break;
                    }
                }
                // Fallback: use the first pricing node's factor if no name match
                if ($baseUnitFactor === 1.0 && ! empty($pricingNodes)) {
                    $baseUnitFactor = max(1.0, (float) ($pricingNodes[0]['factor'] ?? 1));
                }
                $savedOpeningQty = $openingQty * $baseUnitFactor;

                $inventory = Inventory::firstOrCreate(
                    ['product_id' => $product->id, 'product_type' => 'finished_product', 'store_id' => $storeId],
                    ['qty' => 0, 'branch_id' => $branchId, 'reorder_level' => (float) ($request->reorder_level ?? 0)]
                );
                $inventory->increment('qty', $savedOpeningQty);

                // Add log for initial stock (quantities in absolute base units)
                InventoryLog::create([
                    'inventory_id' => $inventory->id,
                    'user_id' => Auth::id(),
                    'operation' => 'increase',
                    'quantity_change' => $savedOpeningQty,
                    'previous_quantity' => 0,
                    'new_quantity' => $savedOpeningQty,
                    'notes' => "Initial opening stock: {$openingQty} {$unitName} × factor {$baseUnitFactor} = {$savedOpeningQty} base units.",
                    'branch_id' => $branchId,
                ]);
            }

            DB::commit();

            return redirect('/products-new/'.$product->id)
                ->with('success', '"'.$product->product_name.'" published successfully.');
        } catch (QueryException $e) {
            DB::rollBack();
            Log::error('Product create DB error: '.$e->getMessage());
            $friendly = match (true) {
                str_contains($e->getMessage(), 'category_id') => 'The selected category is invalid. Please choose a valid category and try again.',
                str_contains($e->getMessage(), 'unit_id') => 'The selected unit is invalid. Please choose a valid unit and try again.',
                str_contains($e->getMessage(), 'store_id') => 'The selected store is invalid. Please choose a valid store and try again.',
                str_contains($e->getMessage(), 'Duplicate') => 'A product with this SKU already exists. Please use a different SKU.',
                default => 'Please fill in all required fields correctly and try again.',
            };

            return back()->withErrors(['error' => $friendly])->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product create error: '.$e->getMessage());

            return back()->withErrors(['error' => 'Please fill in all required fields correctly and try again.'])->withInput();
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
            'variants',
        ])->findOrFail($id);

        $pm = $product->productManagement;

        // Stock per store — convert raw qty to display unit (e.g. 34300 pcs → 1715 Catton)
        $rawSaleUnitsForStock = $pm?->sale_units ?? [];
        $saleUnitsForStock = is_array($rawSaleUnitsForStock) ? $rawSaleUnitsForStock : (json_decode($rawSaleUnitsForStock, true) ?? []);
        $unitNameForStock = $pm?->unit_name ?? 'pcs';

        $inventoriesByStore = Inventory::where('product_id', $product->id)
            ->with('store:id,store_name')
            ->get()
            ->map(function ($inv) use ($saleUnitsForStock, $unitNameForStock) {
                $display = $this->resolveDisplayQty((float) $inv->qty, $saleUnitsForStock, $unitNameForStock);

                return [
                    'store_name' => $inv->store?->store_name ?? 'Unknown',
                    'qty' => $display['qty'],
                    'unit' => $display['unit'],
                    'raw_qty' => (float) $inv->qty,
                ];
            });

        $totalRawStock = $inventoriesByStore->sum('raw_qty');
        $totalStockDisplay = $this->resolveDisplayQty($totalRawStock, $saleUnitsForStock, $unitNameForStock);
        $totalStock = $totalStockDisplay['qty'];
        $stockUnit = $totalStockDisplay['unit'];

        // Stock movements
        $stockMovements = InventoryTransaction::where('product_id', $product->id)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'type' => in_array($t->transaction_type, ['in', 'adjustment', 'purchase', 'production']) ? 'in' : 'out',
                'quantity' => abs((float) ($t->quantity_in ?? $t->quantity ?? 0) - (float) ($t->quantity_out ?? 0)),
                'reference' => $t->notes ?? $t->reference_type ?? 'Manual',
                'store' => $t->store?->store_name ?? '—',
                'created_at' => $t->created_at->toDateTimeString(),
            ]);

        // BOM materials (for manufactured products)
        $bomItems = [];

        // Parse sale_units and specifications from PM JSON fields (handle both array and legacy double-encoded string)
        $rawSaleUnits = $pm?->sale_units ?? [];
        $saleUnits = is_array($rawSaleUnits) ? $rawSaleUnits : (json_decode($rawSaleUnits, true) ?? []);
        $rawTechSpecs = $pm?->specifications ?? [];
        $techSpecs = is_array($rawTechSpecs) ? $rawTechSpecs : (json_decode($rawTechSpecs, true) ?? []);

        // Images (image_1 .. image_5 on PM)
        $images = [];
        if ($pm) {
            foreach (range(1, 5) as $i) {
                $img = $pm->{"image_{$i}"};
                if ($img) {
                    $images[] = asset('storage/'.$img);
                }
            }
        }

        $colorVariants = ($product->product_type === 'manufactured' || $product->product_type === 'trading')
            ? $product->variants->map(fn ($v) => [
                'id' => $v->id,
                'color' => $v->color,
                'qty' => (float) ($v->qty ?? 0),
                'plain_qty' => (float) ($v->plain_qty ?? 0),
                'printed_qty' => (float) ($v->printed_qty ?? 0),
                'buying_price' => (float) ($v->buying_price ?? 0),
                'selling_price' => (float) ($v->selling_price ?? 0),
                'branch_id' => $v->branch_id,
            ])->values()->all()
            : [];

        return Inertia::render('Products/Show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->product_name,
                'sku' => $product->product_id,
                'product_type' => $product->product_type, // 'trading' | 'manufactured' | 'raw_material'
                'status' => $product->is_enabled ? 'active' : 'inactive',
                'created_at' => $product->created_at->toDateTimeString(),
                'updated_at' => $product->updated_at->toDateTimeString(),
                // Pricing
                'selling_price' => (float) ($pm?->product_price ?? $product->product_price ?? 0),
                'plain_price' => (float) ($pm?->plain_selling_price ?? $pm?->product_price ?? $product->product_price ?? 0),
                'printed_price' => (float) ($pm?->printed_selling_price ?? $pm?->plain_selling_price ?? $pm?->product_price ?? $product->product_price ?? 0),
                'cost_price' => (float) ($pm?->buying_price ?? $product->buying_price ?? 0),
                // Category & Unit
                'category' => $pm?->category_name ? ['name' => $pm->category_name] : null,
                'unit_of_measurement' => $pm?->unit_name ?? 'pcs',
                'description' => $pm?->description ?? $product->description ?? null,
                // Inventory
                'reorder_level' => (float) ($product->reorder_point ?? $pm?->reorder_point ?? 0),
                'low_alert' => (float) ($pm?->low_stock_threshold ?? 0),
                'current_stock' => $totalStock,
                'stock_unit' => $stockUnit,
                'total_stock_value' => $totalRawStock * (float) ($product->buying_price ?? 0),
                'inventories_by_store' => $inventoriesByStore,
                // Physical specs
                'brand' => $pm?->brand,
                'material' => $pm?->material,
                'weight' => $pm?->weight,
                'weight_unit' => $pm?->weight_unit,
                'width' => $pm?->width,
                'length' => $pm?->length,
                'height' => $pm?->height,
                'dimension_unit' => $pm?->dimension_unit,
                // Sale units pricing nodes
                'sale_units' => $saleUnits,
                // Tech specs
                'specifications' => $techSpecs,
                // Images
                'images' => $images,
                // BOM (manufacturing)
                'bom_items' => $bomItems,
                // Movements
                'stock_movements' => $stockMovements,
                // Color variants (manufactured/trading)
                'variants' => $colorVariants,
            ],
            'color_variants' => $colorVariants,
        ]);
    }

    /**
     * Show the form for editing the specified product
     */
    public function editCrud($id)
    {
        $product = Product::with(['productManagement', 'specifications'])->findOrFail($id);
        $pm = $product->productManagement;
        // Use session branch for global admins (active_branch_id() returns null for global users)
        $branchId = session('active_branch_id') ?? active_branch_id() ?? $product->branch_id;

        return Inertia::render('Products/Edit', [
            'product' => [
                'id' => $product->id,
                'product_name' => $product->product_name,
                'product_type' => $product->product_type,
                'has_bom' => (bool) $product->has_bom,
                'sku' => $product->product_id,
                'barcode' => $pm?->barcode,
                'category_id' => $product->category_id ?? $pm?->category_id,
                'branch_id' => $product->branch_id ?? $pm?->branch_id,
                'store_id' => $pm?->source_store_id,
                'brand' => $pm?->brand,
                'material_type' => $pm?->material,
                'base_unit' => $pm?->unit_id ?: ($pm?->unit_name ?: null),
                'description' => $pm?->description ?? $product->description,
                'total_buying_cost' => (float) ($pm?->buying_price ?? $product->buying_price ?? 0),
                'conv_ratio' => (float) ($pm?->qty_in_buying_unit ?? 1),
                'reorder_level' => (float) ($product->reorder_point ?? $pm?->reorder_point ?? 0),
                'low_alert' => (float) ($pm?->low_stock_threshold ?? 0),
                'weight' => $pm?->weight,
                'weight_unit' => $pm?->weight_unit,
                'width' => $pm?->width,
                'length' => $pm?->length,
                'box_h' => $pm?->height,
                'box_unit' => $pm?->dimension_unit,
                'is_enabled' => (bool) $product->is_enabled,
                'is_featured' => (bool) ($pm?->is_featured ?? false),
                'is_public' => (bool) ($pm?->is_public ?? false),
                'pricing_nodes' => is_array($pm?->sale_units) ? $pm->sale_units : (json_decode($pm?->sale_units ?? '[]', true) ?? []),
                'tech_specs' => is_array($pm?->specifications) ? $pm->specifications : (json_decode($pm?->specifications ?? '[]', true) ?? []),
                'bom_items' => [],
                'images' => collect(range(1, 5))->map(fn ($i) => $pm?->{"image_$i"} ? asset('storage/'.$pm->{"image_$i"}) : null)->filter()->values(),
            ],
            // Categories and units are a shared taxonomy across branches — always show the
            // full list rather than relying on the implicit branch scope, which previously
            // meant a branch-scoped viewer could see a restricted (or "General"-only) list.
            'categories' => Category::withoutGlobalScope('branch')
                ->orderBy('category_name', 'asc')->get()
                ->unique('category_name')->values()
                ->map(fn ($cat) => ['id' => $cat->id, 'name' => $cat->category_name]),
            'units' => Unit::withoutGlobalScope('branch')
                ->orderBy('unit_name', 'asc')->get()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->unit_name]),
            'stores' => Store::with('branches')->get()->map(function ($s) {
                // Resolve branch_id from pivot if direct column is null
                $bid = $s->branch_id ?? $s->branches->first()?->id;

                return ['id' => $s->id, 'name' => $s->store_name, 'branch_id' => $bid];
            }),
            // For BOM editing
            'raw_materials' => [],
            'branches' => Branch::where('is_active', true)->get()->map(fn ($b) => ['id' => $b->id, 'name' => $b->name]),
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

        // A product's branch is determined by the store it's stocked in — resolve that
        // first so re-saving a product also self-heals a previously missing branch_id.
        $selectedStore = $request->store_id ? Store::find($request->store_id) : null;
        $branchId = $selectedStore?->branch_id
            ?? $selectedStore?->branches()->first()?->id
            ?? ($request->filled('branch_id') ? (int) $request->branch_id : null)
            ?? session('active_branch_id')
            ?? active_branch_id()
            ?? $product->branch_id
            ?? ($pm?->branch_id)
            ?? (Auth::check() ? Auth::user()->branch_id : null)
            ?? 1;

        $request->validate([
            'product_name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'product_type' => 'nullable|in:trading,manufactured,raw_material',
            'total_buying_cost' => 'nullable|numeric|min:0',
            'branch_id' => 'nullable|exists:branches,id',
            'store_id' => 'nullable|exists:stores,id',
            'category_id' => 'nullable|exists:categories,id',
        ], [
            'product_name.required' => 'Product name is required.',
            'product_type.in' => 'Product type must be trading, manufactured, or raw material.',
        ]);

        try {
            DB::beginTransaction();

            $sku = ($request->sku && $request->sku !== 'Auto') ? $request->sku : $product->product_id;

            // Resolve pricing — derived entirely from the sale unit pricing nodes
            $pricingNodes = json_decode($request->pricing_nodes ?? '[]', true) ?? [];
            $sellingPrice = isset($pricingNodes[0]) ? (float) $pricingNodes[0]['market_price'] : 0;
            $plainSellingPrice = $sellingPrice;
            $printedSellingPrice = $plainSellingPrice;
            $buyingPrice = (float) ($request->total_buying_cost ?? 0);
            $convRatio = max(1, (float) ($request->conv_ratio ?? 1));
            $costPerBase = $convRatio > 0 ? round($buyingPrice / $convRatio, 4) : 0;

            // Resolve category — look up by id, then by name, then first available
            $category = $request->category_id
                ? Category::withoutGlobalScope('branch')->find($request->category_id)
                : null;
            if (! $category) {
                $category = Category::withoutGlobalScope('branch')
                    ->where('category_name', 'General')->first()
                    ?? Category::withoutGlobalScope('branch')->first();
            }
            if (! $category) {
                $category = Category::create(['category_name' => 'General', 'branch_id' => $branchId]);
            }

            // 1. Update Product
            $product->update([
                'product_name' => $request->product_name,
                'product_id' => $sku,
                'product_type' => $request->product_type ?: $product->product_type,
                'has_bom' => filter_var($request->has_bom, FILTER_VALIDATE_BOOLEAN),
                'product_price' => $plainSellingPrice,
                'buying_price' => $buyingPrice,
                'is_enabled' => filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN),
                'reorder_point' => (float) ($request->reorder_level ?? 0),
            ]);

            // Resolve units — fallback to first available unit rather than hardcoded id=1
            $resolvedUnit = null;
            if ($request->base_unit) {
                $resolvedUnit = is_numeric($request->base_unit)
                    ? Unit::withoutGlobalScope('branch')->find((int) $request->base_unit)
                    : Unit::withoutGlobalScope('branch')->where('unit_name', $request->base_unit)->first();
            }
            if (! $resolvedUnit) {
                $resolvedUnit = Unit::withoutGlobalScope('branch')->first();
            }
            $unitId = $resolvedUnit?->id;
            $unitName = $resolvedUnit?->unit_name ?? ($request->base_unit ?: 'unit');

            // 2. Update or Create ProductManagement
            $pmData = [
                'product_name' => $request->product_name,
                'sku' => $sku,
                'barcode' => $request->barcode,
                'brand' => $request->brand,
                'buying_unit_id' => $unitId,
                'qty_in_buying_unit' => $convRatio,
                'cost_per_base_unit' => $costPerBase,
                'unit_id' => $unitId,
                'unit_name' => $unitName,
                'unit_description' => '',
                'product_price' => $plainSellingPrice,
                'plain_selling_price' => $plainSellingPrice,
                'printed_selling_price' => $printedSellingPrice,
                'buying_price' => $buyingPrice,
                'description' => $request->description,
                'category_id' => $category->id,
                'category_name' => $category->category_name,
                'level' => (float) ($request->reorder_level ?? 0),
                'reorder_point' => (float) ($request->reorder_level ?? 0),
                'low_stock_threshold' => (float) ($request->low_alert ?? 0),
                'material' => $request->material_type,
                'weight' => $request->weight,
                'weight_unit' => $request->weight_unit,
                'width' => $request->width,
                'length' => $request->length,
                'height' => $request->box_h,
                'dimension_unit' => $request->box_unit,
                'sale_units' => array_values(array_filter($pricingNodes, fn ($n) => ! empty($n['unit_name']) || ! empty($n['name']))),
                'specifications' => json_decode($request->tech_specs ?? '[]', true) ?? [],
                'is_enabled' => filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN),
                'is_featured' => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN),
                'is_public' => filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN),
                'source_store_id' => $request->store_id ?: null,
            ];

            if ($pm) {
                $pm->update($pmData);
            } else {
                $pm = ProductManagement::create(array_merge($pmData, [
                    'product_management_id' => $product->id, // If needed
                    'product_type' => $product->product_type,
                    'branch_id' => $branchId,
                ]));
                $product->update(['product_management_id' => $pm->id]);
            }

            // 3. Handle Images
            $imageUpdates = [];
            foreach (range(0, 4) as $i) {
                $key = "images.{$i}";
                if ($request->hasFile($key)) {
                    $path = $request->file($key)->store('products', 'public');
                    $imageUpdates['image_'.($i + 1)] = $path;
                }
            }
            if (! empty($imageUpdates)) {
                $pm->update($imageUpdates);
            }

            // 4. Update specs (simplified: delete and recreate)
            ProductSpecification::where('product_id', $product->id)->delete();
            $techSpecs = json_decode($request->tech_specs ?? '[]', true) ?? [];
            foreach ($techSpecs as $spec) {
                if (! empty($spec['title'])) {
                    ProductSpecification::create([
                        'product_id' => $product->id,
                        'title' => $spec['title'],
                        'value' => $spec['value'] ?? '',
                    ]);
                }
            }

            // 5. Ensure inventory record exists for selected store
            $storeId = $request->store_id ?: null;
            if ($storeId) {
                Inventory::firstOrCreate(
                    ['product_id' => $product->id, 'store_id' => $storeId],
                    ['qty' => 0, 'branch_id' => $branchId, 'product_type' => 'finished_product', 'reorder_level' => (float) ($request->reorder_level ?? 0)]
                );
            }

            DB::commit();

            return redirect('/products-new/'.$product->id)->with('success', 'Product updated successfully');
        } catch (QueryException $e) {
            DB::rollBack();
            Log::error('Product update DB error: '.$e->getMessage());
            $friendly = match (true) {
                str_contains($e->getMessage(), 'category_id') => 'The selected category is invalid. Please choose a valid category and try again.',
                str_contains($e->getMessage(), 'unit_id') => 'The selected unit is invalid. Please choose a valid unit and try again.',
                str_contains($e->getMessage(), 'Duplicate') => 'A product with this SKU already exists. Please use a different SKU.',
                default => 'Please fill in all required fields correctly and try again.',
            };

            return back()->withErrors(['error' => $friendly]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product update error: '.$e->getMessage());

            return back()->withErrors(['error' => 'Please fill in all required fields correctly and try again.']);
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

            return back()->withErrors(['error' => 'Failed to reactivate product: '.$e->getMessage()]);
        }
    }

    /**
     * Remove the specified product from storage
     */
    public function destroyCrud($id)
    {
        $product = Product::findOrFail($id);

        DB::beginTransaction();
        try {
            $productManagementId = $product->product_management_id;

            // Nullify FK references that have no CASCADE so the product can be
            // hard-deleted while keeping sale/order history intact.
            DB::table('sale_items')->where('product_id', $product->id)->update(['product_id' => null]);
            DB::table('stock_movements')->where('product_id', $product->id)->update(['product_id' => null]);

            // Delete owned child records
            ProductSpecification::where('product_id', $product->id)->delete();
            ProductVariant::where('product_id', $product->id)->delete();
            $inventories = Inventory::where('product_id', $product->id)->get();
            foreach ($inventories as $inv) {
                InventoryLog::where('inventory_id', $inv->id)->delete();
            }
            Inventory::where('product_id', $product->id)->delete();

            $product->delete();

            // Clean up orphaned product management record
            if ($productManagementId && Product::where('product_management_id', $productManagementId)->doesntExist()) {
                $pm = ProductManagement::find($productManagementId);
                if ($pm) {
                    // Delete product management images
                    foreach (range(1, 5) as $i) {
                        if ($pm->{"image_$i"} && Storage::disk('public')->exists($pm->{"image_$i"})) {
                            Storage::disk('public')->delete($pm->{"image_$i"});
                        }
                    }
                    ProductManagementImage::where('product_management_id', $pm->id)->delete();
                    $pm->delete();
                }
            }

            DB::commit();

            return redirect('/products-new')->with('success', 'Product permanently deleted.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to delete product: '.$e->getMessage()]);
        }
    }
}
