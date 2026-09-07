<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockAdjustment;
use App\Models\Store;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        $branchId = session('active_branch_id') ?? active_branch_id();
        $branchFilter = ($branchId && $branchId !== 'all') ? $branchId : null;

        $adjustments = StockAdjustment::with(['product', 'store'])
            ->when($branchFilter, fn ($q) => $q->where('branch_id', $branchFilter))
            ->latest()
            ->paginate(15);

        $products = Product::when($branchFilter, function ($q) use ($branchFilter) {
            $q->where(function ($sub) use ($branchFilter) {
                $sub->where('branch_id', $branchFilter)
                    ->orWhereNull('branch_id')
                    ->orWhereIn('branch_id', [0, 1]);
            });
        })
            ->with(['variants:id,product_id,color,qty,plain_qty,printed_qty'])
            ->get();

        $rawMaterials = collect();

        $stores = Store::when($branchFilter, function ($q) use ($branchFilter) {
            $q->where(function ($sub) use ($branchFilter) {
                $sub->where('branch_id', $branchFilter)
                    ->orWhereNull('branch_id')
                    ->orWhereIn('branch_id', [0, 1]);
            });
        })->get();

        return Inertia::render('Operations/StockAdjustments/Index', [
            'adjustments' => $adjustments,
            'products' => $products,
            'rawMaterials' => $rawMaterials,
            'stores' => $stores,
        ]);
    }

    public function create()
    {
        $branchId = session('active_branch_id') ?? active_branch_id();
        $branchFilter = ($branchId && $branchId !== 'all') ? $branchId : null;

        $products = Product::when($branchFilter, function ($q) use ($branchFilter) {
            $q->where(function ($sub) use ($branchFilter) {
                $sub->where('branch_id', $branchFilter)
                    ->orWhereNull('branch_id')
                    ->orWhereIn('branch_id', [0, 1]);
            });
        })
            ->with(['variants:id,product_id,color,qty,plain_qty,printed_qty', 'inventories', 'productManagement'])
            ->get();

        $stores = Store::when($branchFilter, function ($q) use ($branchFilter) {
            $q->where(function ($sub) use ($branchFilter) {
                $sub->where('branch_id', $branchFilter)
                    ->orWhereNull('branch_id')
                    ->orWhereIn('branch_id', [0, 1]);
            });
        })->get();

        return Inertia::render('Operations/StockAdjustments/Create', [
            'products' => $products,
            'rawMaterials' => collect(),
            'stores' => $stores,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|array',
            'product_id.*' => 'required',
            'variant_id' => 'nullable|array',
            'variant_id.*' => 'nullable|exists:product_variants,id',
            'print_type' => 'nullable|in:plain,printed',
            'product_type' => 'required|string',
            'store_id' => 'required|exists:stores,id',
            'adjustment_type' => 'required|in:Damage,Loss,Correction,Expiry',
            'quantity' => 'required|array',
            'quantity.*' => 'required|numeric',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $branchId = session('active_branch_id') ?? active_branch_id();
        $branchId = ($branchId && $branchId !== 'all') ? $branchId : null;

        DB::beginTransaction();

        try {
            foreach ($validated['product_id'] as $index => $productId) {
                if (empty($productId)) {
                    continue;
                }

                $selectedVariant = null;
                $variantId = $validated['variant_id'][$index] ?? null;
                $quantity = $validated['quantity'][$index] ?? 0;

                if ($validated['product_type'] === Product::class) {
                    $product = Product::findOrFail($productId);

                    if ($product->product_type === 'manufactured') {
                        $hasVariants = ProductVariant::where('product_id', $product->id)->exists();
                        if ($hasVariants && empty($variantId)) {
                            throw new \Exception("Please select a color variant for manufactured goods adjustment (Product ID: {$product->id}).");
                        }
                    }

                    if (! empty($variantId)) {
                        $selectedVariant = ProductVariant::where('id', $variantId)
                            ->where('product_id', $product->id)
                            ->first();

                        if (! $selectedVariant) {
                            throw new \Exception("Selected variant does not belong to the chosen product (ID: {$product->id}).");
                        }
                    }
                }

                $adjustment = StockAdjustment::create([
                    'product_id' => $productId,
                    'variant_id' => $selectedVariant?->id,
                    'variant_color' => $selectedVariant?->color,
                    'product_type' => $validated['product_type'],
                    'store_id' => $validated['store_id'],
                    'user_id' => Auth::id(),
                    'adjustment_type' => $validated['adjustment_type'],
                    'quantity' => $quantity,
                    'reason' => $validated['reason'] ?? 'Manual Correction',
                    'notes' => $validated['notes'] ?? '',
                    'status' => 'Pending',
                    'branch_id' => $branchId,
                ]);

                // Process immediately if requested or per policy
                $this->inventoryService->approveAdjustment($adjustment->id);
            }

            DB::commit();

            return redirect()->route('stock-adjustments.index')->with('success', 'Adjustments applied successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to apply adjustment: '.$e->getMessage());
        }
    }

    public function destroy($id)
    {
        $adjustment = StockAdjustment::findOrFail($id);

        // Only allow deleting pending adjustments or as per policy
        if ($adjustment->status === 'Approved') {
            return back()->with('error', 'Cannot delete an approved adjustment.');
        }

        $adjustment->delete();

        return redirect()->route('stock-adjustments.index')->with('success', 'Adjustment record deleted.');
    }

    public function approve($id)
    {
        try {
            $this->inventoryService->approveAdjustment($id);

            return response()->json(['success' => 'Adjustment approved and inventory updated.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function reject($id)
    {
        $adjustment = StockAdjustment::findOrFail($id);
        $adjustment->update(['status' => 'Rejected']);

        return response()->json(['success' => 'Adjustment rejected.']);
    }
}
