<?php

namespace App\Http\Controllers;

use App\Models\Bom;
use App\Models\BomItem;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class BomController extends Controller
{
    protected $rollService;

    public function __construct(\App\Services\RollProductionService $rollService)
    {
        $this->rollService = $rollService;
    }

    // Raw Materials Management (Temporary Workaround)
    public function rawMaterialsIndex(Request $request)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);

        $query = RawMaterial::with(['branch', 'createdBy']);

        // Filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%')
                    ->orWhere('category', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status === 'active');
        }

        // Filtering for low stock needs to happen on the collection or via subquery.
        // For simplicity and pagination, we will handle basic filters here and move low stock check to the view or a separate query if needed.
        // However, the user specifically requested low stock filtering.
        if ($request->filled('stock_status') && $request->stock_status === 'low') {
            $lowStockIds = RawMaterial::where('branch_id', $branchId)
                ->get()
                ->filter(function ($item) {
                    return $item->is_low_stock;
                })
                ->pluck('id');
            $query->whereIn('id', $lowStockIds);
        }

        if ($request->filled('roll_status')) {
            $query->where('roll_status', $request->roll_status);
        }

        $branchId = active_branch_id();

        // Only apply branch filter if we have one, otherwise let global scope or lack thereof take over
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $rawMaterials = $query->with(['inventory.store'])->latest()->paginate(20);
        $rawMaterials->getCollection()->each->setAppends(['current_stock', 'store_name', 'image_url']);

        // Metrics
        $allMaterialsQuery = RawMaterial::query();
        if ($branchId) {
            $allMaterialsQuery->where('branch_id', $branchId);
        }
        $allMaterials = $allMaterialsQuery->get();
        $units = \App\Models\Unit::orderBy('unit_name')->get();
        $metrics = [
            'total_materials' => $allMaterials->count(),
            'active_materials' => $allMaterials->filter(function ($item) {
                return $item->is_roll ? $item->roll_status !== 'consumed' : $item->status;
            })->count(),
            'low_stock_count' => $allMaterials->filter(function ($item) {
                return $item->is_low_stock;
            })->count(),
            'total_value' => $allMaterials->sum(function ($item) {
                return $item->total_value;
            }),
            'categories' => $allMaterials->pluck('category')->unique()->filter(),
        ];

        $stores = \App\Models\Store::all();

        return \Inertia\Inertia::render('Operations/RawMaterials/Index', [
            'materials' => $rawMaterials,
            'metrics' => $metrics,
            'units' => $units,
            'stores' => $stores
        ]);
    }

    public function rawMaterialsCreate()
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);

        // Get units for dropdown
        $units = Unit::orderBy('unit_name')->get();

        // Get categories for dropdown (Global categories + unique strings already in materials)
        $globalCategories = \App\Models\Category::pluck('category_name')->toArray();
        $existingCategories = RawMaterial::where('branch_id', $branchId)->distinct('category')->pluck('category')->filter()->toArray();
        $categories = array_unique(array_merge($globalCategories, $existingCategories));

        $stores = \App\Models\Store::with('branches')->get();
        $branches = \App\Models\Branch::all();
        $suppliers = \App\Models\Supplier::withoutGlobalScope('branch')
            ->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            })
            ->orderBy('supplier_name')
            ->get();

        return \Inertia\Inertia::render('Operations/RawMaterials/Create', compact('units', 'categories', 'stores', 'branches', 'suppliers'));
    }

    public function rawMaterialsStore(Request $request)
    {
        // Pre-trim the name for cleaner matching and validation
        $request->merge(['name' => trim($request->name)]);

        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'base_unit' => 'required|string|max:50',
            'cost_per_unit' => 'required|numeric|min:0',
            'minimum_stock' => 'required|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'opening_stock' => 'required|numeric|min:0',
            'status' => 'nullable|boolean',
            'is_roll' => 'nullable|boolean',
            'is_accessory' => 'nullable|boolean',
            'code' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'weight_kg' => 'nullable|numeric|min:0',
            'conv_ratio' => 'nullable|numeric|min:0',
            'buying_unit_source' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'gsm' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'total_length' => 'nullable|numeric|min:0',
            'opening_store_id' => 'required|exists:stores,id',
            'branch_id' => 'required|exists:branches,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'color' => 'nullable|string|max:50',
        ]);

        $branchId = (int) $request->branch_id;

        try {
            DB::beginTransaction();

            $isRoll = (bool) $request->is_roll;
            $isAccessory = (bool) $request->is_accessory;
            $qty = (float) $request->opening_stock;

            // Auto-generate SKU if empty
            $sku = $request->code;
            if (empty($sku)) {
                $sku = 'SKU-' . strtoupper(substr(uniqid(), -8));
            }

            // Auto-generate Barcode if empty (random 12 digits)
            $barcode = $request->barcode;
            if (empty($barcode)) {
                $barcode = str_pad(rand(0, 999999999999), 12, '0', STR_PAD_LEFT);
            }

            // SMART CONSOLIDATION: 
            // If it's NOT a roll and a material with this name already exists in this branch,
            // we update the existing one and just adjust stock instead of creating a copy.
            $rawMaterial = null;
            if (!$isRoll) {
                $rawMaterial = RawMaterial::where('name', $request->name)
                    ->where('branch_id', $branchId)
                    ->where('is_roll', false)
                    ->first();
            }

            if ($rawMaterial) {
                // Consolidation Mode
                $rawMaterial->update([
                    'category' => $request->category ?: $rawMaterial->category,
                    'cost_per_unit' => $request->cost_per_unit,
                    'minimum_stock' => $request->minimum_stock,
                    'supplier' => $request->supplier ?: $rawMaterial->supplier,
                    'status' => true,
                    'is_accessory' => $isAccessory,
                    'sku' => $request->code ?: $rawMaterial->sku,
                    'purchase_unit' => $request->buying_unit_source ?: $rawMaterial->purchase_unit,
                    'conversion_ratio' => $request->conv_ratio ?: $rawMaterial->conversion_ratio,
                    'weight_kg' => $request->weight_kg ?: $rawMaterial->weight_kg,
                    'barcode' => $barcode,
                    'brand' => $request->brand ?: $rawMaterial->brand,
                    'description' => $request->description ?: $rawMaterial->description,
                    'reorder_point' => $request->reorder_point ?: $rawMaterial->reorder_point,
                    'material' => $request->material ?: $rawMaterial->material,
                ]);

                $actionType = 'Consolidated into row';
            } else {
                // Creation Mode
                // Generate unique internal code with collision check
                do {
                    $code = 'RM-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);
                } while (RawMaterial::where('code', $code)->exists());

                $rawMaterial = RawMaterial::create([
                    'code' => $code,
                    'name' => $request->name,
                    'category' => $request->category,
                    'base_unit' => $request->base_unit,
                    'cost_per_unit' => $request->cost_per_unit,
                    'minimum_stock' => $request->minimum_stock,
                    'supplier' => $request->supplier,
                    'status' => $request->boolean('status', true),
                    'branch_id' => $branchId,
                    'created_by' => Auth::id(),
                    'is_roll' => $isRoll,
                    'is_accessory' => $isAccessory,
                    'gsm' => $isRoll ? $request->gsm : null,
                    'width' => $isRoll ? $request->width : null,
                    'total_length' => $isRoll ? $request->total_length : null,
                    'remaining_length' => $isRoll ? ($qty > 0 ? $request->total_length : 0) : null,
                    'sku' => $request->code,
                    'purchase_unit' => $request->buying_unit_source,
                    'conversion_ratio' => $request->conv_ratio,
                    'weight_kg' => $request->weight_kg,
                    'barcode' => $barcode,
                    'brand' => $request->brand,
                    'reorder_point' => $request->reorder_point,
                    'material' => $request->material,
                    'image_path' => $request->hasFile('image') ? $request->file('image')->store('raw_materials', 'public') : null,
                    'color' => $request->color,
                ]);

                // Sync to product table for UI listing/POS visibility (DISABLED as per requirement)
                // $this->rollService->syncRollToProductListing($rawMaterial);

                $actionType = 'Opening stock registration';
            }

            // Record opening stock via InventoryService
            if ($qty > 0) {
                $inventoryService = new \App\Services\InventoryService();
                $inventoryService->adjustInventory(
                    $rawMaterial->id,
                    abs($qty),
                    $request->opening_store_id,
                    'increase',
                    'adjustment',
                    $actionType,
                    null,
                    \App\Models\RawMaterial::class,
                    null,
                    $rawMaterial->cost_per_unit,
                    $branchId
                );
            }

            DB::commit();

            $message = $actionType == 'Consolidated into row'
                ? "Raw material '{$rawMaterial->name}' stock has been updated successfully."
                : "Raw material '{$rawMaterial->name}' registered successfully with code: {$rawMaterial->code}";

            return redirect()->route('raw-materials.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create raw material: ' . $e->getMessage())->withInput();
        }
    }
    public function rawMaterialsShow($id)
    {
        $rawMaterial = RawMaterial::with(['branch', 'createdBy', 'movements.createdBy', 'movements.store'])
            ->findOrFail($id);

        $stores = \App\Models\Store::all();
        $rawMaterial->append('total_value'); 
        return \Inertia\Inertia::render('Operations/RawMaterials/Show', compact('rawMaterial', 'stores'));
    }

    public function rawMaterialsJson($id)
    {
        $rawMaterial = RawMaterial::findOrFail($id);

        return response()->json([
            'id' => $rawMaterial->id,
            'name' => $rawMaterial->name,
            'category' => $rawMaterial->category === 'Uncategorized' ? '' : $rawMaterial->category,
            'base_unit' => $rawMaterial->base_unit,
            'cost_per_unit' => $rawMaterial->cost_per_unit,
            'minimum_stock' => $rawMaterial->minimum_stock,
            'supplier' => $rawMaterial->supplier,
            'status' => $rawMaterial->status ? 1 : 0,
            'is_roll' => $rawMaterial->is_roll ? 1 : 0,
            'is_accessory' => $rawMaterial->is_accessory ? 1 : 0,
            'gsm' => $rawMaterial->gsm,
            'width' => $rawMaterial->width,
            'total_length' => $rawMaterial->total_length,
            'cost_per_kg' => $rawMaterial->cost_per_kg,
            'formatted_code' => $rawMaterial->formatted_code,
            'sku' => $rawMaterial->sku,
            'purchase_unit' => $rawMaterial->purchase_unit,
            'conversion_ratio' => $rawMaterial->conversion_ratio,
            'weight_kg' => $rawMaterial->weight_kg,
            'barcode' => $rawMaterial->barcode,
            'brand' => $rawMaterial->brand,
            'description' => $rawMaterial->description,
            'reorder_point' => $rawMaterial->reorder_point,
            'material' => $rawMaterial->material,
            'image_url' => $rawMaterial->image_path ? asset('storage/' . $rawMaterial->image_path) : null,
            'color' => $rawMaterial->color,
            'store_id' => \App\Models\Inventory::where('product_id', $rawMaterial->id)
                ->where('product_type', \App\Models\RawMaterial::class)
                ->value('store_id'),
        ]);
    }

    public function rawMaterialsEdit($id)
    {
        $rawMaterial = RawMaterial::findOrFail($id);
        $branchId = $rawMaterial->branch_id;
        $units = Unit::orderBy('unit_name')->get();
        
        $globalCategories = \App\Models\Category::pluck('category_name')->toArray();
        $existingCategories = RawMaterial::where('branch_id', $branchId)->distinct('category')->pluck('category')->filter()->toArray();
        $categories = array_unique(array_merge($globalCategories, $existingCategories));

        $stores = \App\Models\Store::with('branches')->get();
        $branches = \App\Models\Branch::all();
        $suppliers = \App\Models\Supplier::withoutGlobalScope('branch')
            ->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            })
            ->orderBy('supplier_name')
            ->get();

        $rawMaterial->image_url = $rawMaterial->image_path ? asset('storage/' . $rawMaterial->image_path) : null;
        $rawMaterial->current_store_id = \App\Models\Inventory::where('product_id', $rawMaterial->id)
            ->where('product_type', \App\Models\RawMaterial::class)
            ->value('store_id');

        return \Inertia\Inertia::render('Operations/RawMaterials/Edit', compact('rawMaterial', 'units', 'categories', 'stores', 'branches', 'suppliers'));
    }

    public function rawMaterialsUpdate(Request $request, $id)
    {
        $rawMaterial = RawMaterial::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:raw_materials,code,' . $id,
            'category' => 'nullable|string|max:100',
            'base_unit' => 'required|string|max:50',
            'cost_per_unit' => 'required|numeric|min:0',
            'minimum_stock' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'status' => 'nullable',
            'is_roll' => 'nullable',
            'is_accessory' => 'nullable',
            'gsm' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'total_length' => 'nullable|numeric|min:0',
            'color' => 'nullable|string|max:50',
            'cost_per_kg' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:100',
            'purchase_unit' => 'nullable|string|max:50',
            'conversion_ratio' => 'nullable|numeric|min:0',
            'weight_kg' => 'nullable|numeric|min:0',
            'barcode' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'reorder_point' => 'nullable|numeric|min:0',
            'material' => 'nullable|string|max:255',
            'opening_store_id' => 'required|exists:stores,id',
            'branch_id' => 'required|exists:branches,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $branchId = (int) $request->branch_id;

        $isRoll = $request->has('is_roll');
        $isAccessory = $request->has('is_accessory');
        // Checkbox unchecked sends nothing; checked sends the value "1"
        $status = $request->has('status') ? (bool) $request->status : false;

        $sku = $request->sku;
        if (empty($sku)) {
            $sku = $rawMaterial->sku ?: 'SKU-' . strtoupper(substr(uniqid(), -8));
        }

        $barcode = $request->barcode;
        if (empty($barcode)) {
            $barcode = $rawMaterial->barcode ?: str_pad(rand(0, 999999999999), 12, '0', STR_PAD_LEFT);
        }

        $rawMaterial->update([
            'name' => $request->name,
            'code' => $request->code, // Also saving code correctly
            'category' => $request->category,
            'base_unit' => $request->base_unit,
            'cost_per_unit' => $request->cost_per_unit,
            'minimum_stock' => $request->minimum_stock,
            'supplier' => $request->supplier,
            'status' => $status,
            'is_accessory' => $isAccessory,
            // Roll fields — only update if the material is/was a roll
            'gsm' => $isRoll ? $request->gsm : $rawMaterial->gsm,
            'width' => $isRoll ? $request->width : $rawMaterial->width,
            'total_length' => $isRoll ? $request->total_length : $rawMaterial->total_length,
            'cost_per_kg' => $isRoll ? $request->cost_per_kg : $rawMaterial->cost_per_kg,
            'sku' => $sku,
            'purchase_unit' => $request->purchase_unit,
            'conversion_ratio' => $request->conversion_ratio,
            'weight_kg' => $request->weight_kg,
            'barcode' => $barcode,
            'brand' => $request->brand,
            'description' => $request->description,
            'reorder_point' => $request->reorder_point,
            'material' => $request->material,
            'color' => $request->color,
            'branch_id' => $branchId,
        ]);

        // Ensure inventory and transaction reflect the chosen store warehouse
        if ($request->has('opening_store_id') && !empty($request->opening_store_id)) {
            $existingInventory = \App\Models\Inventory::where('product_id', $rawMaterial->id)
                ->where('product_type', \App\Models\RawMaterial::class)
                ->first();
                
            if ($existingInventory) {
                if ($existingInventory->store_id != $request->opening_store_id) {
                    $existingInventory->update(['store_id' => $request->opening_store_id]);
                    
                    \App\Models\InventoryTransaction::where('product_id', $rawMaterial->id)
                        ->where('product_type', \App\Models\RawMaterial::class)
                        ->update(['store_id' => $request->opening_store_id]);
                }
            } else {
                // If it was somehow skipped, create the baseline inventory record with 0 stock
                \App\Models\Inventory::create([
                    'product_id' => $rawMaterial->id,
                    'product_type' => \App\Models\RawMaterial::class,
                    'store_id' => $request->opening_store_id,
                    'branch_id' => $branchId,
                    'qty' => 0,
                    'reorder_level' => $request->minimum_stock ?: 0,
                    'overstock_threshold' => 100
                ]);
            }
        }

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($rawMaterial->image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($rawMaterial->image_path);
            }
            $path = $request->file('image')->store('raw_materials', 'public');
            $rawMaterial->update(['image_path' => $path]);
        }

        // Sync to product table for UI listing/POS visibility (DISABLED as per requirement)
        // $this->rollService->syncRollToProductListing($rawMaterial);

        return redirect()->route('raw-materials.index')->with('success', "Raw material '{$rawMaterial->name}' updated successfully.");
    }


    public function rawMaterialsDestroy($id)
    {
        $rawMaterial = RawMaterial::findOrFail($id);

        if (!$rawMaterial->canBeDeleted()) {
            return back()->with('error', 'Cannot delete raw material as it is currently used in one or more BOMs.');
        }

        $rawMaterial->delete();
        return redirect()->route('raw-materials.index')->with('success', 'Raw material deleted successfully.');
    }

    public function rawMaterialsAdjustStock(Request $request, $id)
    {
        $request->validate([
            'adjustment_quantity' => 'required|numeric',
            'adjustment_notes' => 'nullable|string|max:255',
            'store_id' => 'required|exists:stores,id',
        ]);

        try {
            DB::beginTransaction();

            $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
            $rawMaterial = RawMaterial::forBranch($branchId)->findOrFail($id);

            $inventoryService = new \App\Services\InventoryService();
            $inventoryService->adjustInventory(
                $rawMaterial->id,
                abs($request->adjustment_quantity),
                $request->store_id,
                $request->adjustment_quantity > 0 ? 'increase' : 'decrease',
                'adjustment',
                $request->adjustment_notes ?: 'Manual stock adjustment',
                null,
                \App\Models\RawMaterial::class,
                null,
                $rawMaterial->cost_per_unit,
                $branchId
            );

            DB::commit();
            return back()->with('success', 'Stock adjusted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to adjust stock: ' . $e->getMessage());
        }
    }

    public function index(Request $request)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);

        $query = Bom::with(['finishedProduct', 'branch', 'createdBy'])
            ->forBranch($branchId)
            ->whereHas('finishedProduct', function ($q) {
                $q->where('product_type', 'manufactured');
            });

        // Filters
        if ($request->filled('product_name')) {
            $query->whereHas('finishedProduct', function ($q) use ($request) {
                $q->where('product_name', 'like', '%' . $request->product_name . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $boms = $query->latest()->paginate(20);

        // Aggregate Metrics for the Dashboard
        $metrics = [
            'total_boms' => Bom::forBranch($branchId)->count(),
            'active_boms' => Bom::forBranch($branchId)->active()->count(),
            'total_components' => DB::table('bom_items')
                ->join('boms', 'bom_items.bom_id', '=', 'boms.id')
                ->where('boms.branch_id', $branchId)
                ->where('boms.is_active', true)
                ->count(),
        ];

        return \Inertia\Inertia::render('Operations/BOMs/Index', compact('boms', 'metrics'));
    }

    public function indexCrud(Request $request)
    {
        return $this->index($request);
    }

    public function create()
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);

        // Get manufactured products for current branch
        $manufacturedProducts = Product::where('product_type', 'manufactured')
            ->where('branch_id', $branchId)
            ->orderBy('product_name')
            ->get();

        // Get raw materials for current branch
        $rawMaterials = RawMaterial::where('status', true)
            ->where('branch_id', (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1))
            ->orderBy('name')
            ->get();

        // Get units for dropdown
        $units = Unit::orderBy('unit_name')->get();

        return \Inertia\Inertia::render('Operations/BOMs/Create', compact('manufacturedProducts', 'rawMaterials', 'units'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'finished_product_id' => 'required|exists:products,id',
            'raw_material_id' => 'required|array|min:1',
            'raw_material_id.*' => 'required|exists:products,id',
            'quantity_required' => 'required|array|min:1',
            'quantity_required.*' => 'required|numeric|min:0.0001',
            'unit' => 'required|array|min:1',
            'unit.*' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
            $finishedProduct = Product::findOrFail($request->finished_product_id);

            // Validate product type
            if ($finishedProduct->product_type !== 'manufactured') {
                throw new \Exception("Only manufactured products can have BOMs.");
            }

            // Validate branch isolation
            if ($finishedProduct->branch_id != $branchId) {
                throw new \Exception("Product does not belong to the current branch.");
            }

            // 1. Deactivate old BOMs for this product in this branch
            Bom::where('finished_product_id', $finishedProduct->id)
                ->where('branch_id', $branchId)
                ->update(['is_active' => false]);

            // 2. Get latest version number
            $latestVersion = Bom::where('finished_product_id', $finishedProduct->id)
                ->where('branch_id', $branchId)
                ->max('version') ?? 0;

            // 3. Create new BOM
            $bill = Bom::create([
                'finished_product_id' => $finishedProduct->id,
                'branch_id' => $branchId,
                'version' => $latestVersion + 1,
                'is_active' => true,
                'created_by' => Auth::id(),
            ]);

            // 4. Add items and validate branch isolation
            foreach ($request->raw_material_id as $index => $rmId) {
                if ($rmId) {
                    $rawMaterial = RawMaterial::findOrFail($rmId);

                    // Validate raw material status
                    if (!$rawMaterial->status) {
                        throw new \Exception("Material #{$rawMaterial->id} is not active.");
                    }

                    // Validate branch isolation
                    if ($rawMaterial->branch_id != $branchId) {
                        throw new \Exception("Raw material #{$rawMaterial->id} does not belong to the current branch.");
                    }

                    BomItem::create([
                        'bom_id' => $bill->id,
                        'raw_material_id' => $rmId,
                        'quantity_required' => $request->quantity_required[$index],
                        'unit' => $request->unit[$index],
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('boms.index')->with('success', 'BOM Created successfully (Version ' . $bill->version . ')');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create BOM: ' . $e->getMessage())->withInput();
        }
    }

    public function show($id)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
        $bom = Bom::with(['finishedProduct', 'items.rawMaterial', 'branch', 'createdBy'])
            ->forBranch($branchId)
            ->findOrFail($id);

        return \Inertia\Inertia::render('Operations/BOMs/Show', compact('bom'));
    }

    public function edit($id)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
        $bom = Bom::with(['items.rawMaterial'])
            ->forBranch($branchId)
            ->findOrFail($id);

        // Check if BOM has been used in production
        $hasBeenUsed = $this->hasBeenUsedInProduction($bom->id);

        $manufacturedProducts = Product::where('product_type', 'manufactured')
            ->where('branch_id', $branchId)
            ->orderBy('product_name')
            ->get();

        $rawMaterials = RawMaterial::where('status', true)
            ->where('branch_id', $branchId)
            ->orderBy('name')
            ->get();

        $units = Unit::orderBy('unit_name')->get();

        return \Inertia\Inertia::render('Operations/BOMs/Edit', compact('bom', 'manufacturedProducts', 'rawMaterials', 'units', 'hasBeenUsed'));
    }

    public function update(Request $request, $id)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
        $bom = Bom::forBranch($branchId)->findOrFail($id);

        // Check if BOM has been used in production
        $hasBeenUsed = $this->hasBeenUsedInProduction($bom->id);

        if ($hasBeenUsed) {
            return back()->with('error', 'Cannot edit BOM that has been used in production. Create a new version instead.');
        }

        $request->validate([
            'raw_material_id' => 'required|array|min:1',
            'raw_material_id.*' => 'required|exists:products,id',
            'quantity_required' => 'required|array|min:1',
            'quantity_required.*' => 'required|numeric|min:0.0001',
            'unit' => 'required|array|min:1',
            'unit.*' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            // Remove existing items
            $bom->items()->delete();

            // Add new items
            foreach ($request->raw_material_id as $index => $rmId) {
                if ($rmId) {
                    $rawMaterial = RawMaterial::findOrFail($rmId);

                    if (!$rawMaterial->status) {
                        throw new \Exception("Material #{$rawMaterial->id} is not active.");
                    }

                    if ($rawMaterial->branch_id != $branchId) {
                        throw new \Exception("Raw material #{$rawMaterial->id} does not belong to the current branch.");
                    }

                    BomItem::create([
                        'bom_id' => $bom->id,
                        'raw_material_id' => $rmId,
                        'quantity_required' => $request->quantity_required[$index],
                        'unit' => $request->unit[$index],
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('boms.show', $bom->id)->with('success', 'BOM updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update BOM: ' . $e->getMessage())->withInput();
        }
    }

    public function activate($id)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
        $bom = Bom::forBranch($branchId)->findOrFail($id);

        try {
            DB::beginTransaction();

            // Deactivate all other BOMs for this product
            Bom::where('finished_product_id', $bom->finished_product_id)
                ->where('branch_id', $branchId)
                ->update(['is_active' => false]);

            // Activate this BOM
            $bom->update(['is_active' => true]);

            DB::commit();
            return back()->with('success', 'BOM activated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to activate BOM: ' . $e->getMessage());
        }
    }

    public function deactivate($id)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
        $bom = Bom::forBranch($branchId)->findOrFail($id);

        $bom->update(['is_active' => false]);

        return back()->with('success', 'BOM deactivated successfully.');
    }

    public function destroy($id)
    {
        $branchId = (int) (session('active_branch_id') ?: Auth::user()->branch_id ?: 1);
        $bom = Bom::forBranch($branchId)->findOrFail($id);

        // Check if BOM has been used in production
        $hasBeenUsed = $this->hasBeenUsedInProduction($bom->id);

        if ($hasBeenUsed) {
            return back()->with('error', 'Cannot delete BOM that has been used in production.');
        }

        $bom->delete();

        return redirect()->route('boms.index')->with('success', 'BOM deleted successfully.');
    }

    private function hasBeenUsedInProduction($billId)
    {
        // Check if this BOM has been referenced in any production runs
        // This would need to be implemented based on your production system
        // For now, return false (allow deletion)
        return false;
    }

    // API endpoint for cost calculation
    public function calculateCost(Request $request)
    {
        $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
            'quantity' => 'required|numeric|min:0.0001',
            'unit' => 'required|string',
        ]);

        $rawMaterial = RawMaterial::findOrFail($request->raw_material_id);
        $costPerUnit = $rawMaterial->cost_per_unit ?? 0;

        // Convert to base unit (implement proper conversion later)
        $baseQuantity = $request->quantity;

        $estimatedCost = $baseQuantity * $costPerUnit;

        return response()->json([
            'estimated_cost' => number_format($estimatedCost, 2),
            'cost_per_unit' => number_format($costPerUnit, 2),
        ]);
    }
}
