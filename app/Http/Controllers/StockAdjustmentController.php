<?php

namespace App\Http\Controllers;

use App\Models\StockAdjustment;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StockAdjustmentController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        $branchId = active_branch_id();
        
        $adjustments = \App\Models\StockAdjustment::with(['product', 'store'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->latest()
            ->paginate(15);

        $products = \App\Models\Product::where('branch_id', $branchId)
            ->with(['variants:id,product_id,color,qty,plain_qty,printed_qty'])
            ->get();
        $rawMaterials = \App\Models\RawMaterial::where('branch_id', $branchId)->get();
        $stores = \App\Models\Store::where('branch_id', $branchId)->get();

        return \Inertia\Inertia::render('Operations/StockAdjustments/Index', [
            'adjustments' => $adjustments,
            'products' => $products,
            'rawMaterials' => $rawMaterials,
            'stores' => $stores
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required',
            'variant_id' => 'nullable|exists:product_variants,id',
            'print_type' => 'nullable|in:plain,printed',
            'product_type' => 'required|string',
            'store_id' => 'required|exists:stores,id',
            'adjustment_type' => 'required|in:Damage,Loss,Correction,Expiry',
            'quantity' => 'required|numeric',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $selectedVariant = null;
        if ($validated['product_type'] === Product::class) {
            $product = Product::findOrFail($validated['product_id']);

            if ($product->product_type === 'manufactured') {
                $hasVariants = ProductVariant::where('product_id', $product->id)->exists();
                if ($hasVariants && empty($validated['variant_id'])) {
                    return back()->withErrors([
                        'variant_id' => 'Please select a color variant for manufactured goods adjustment.',
                    ]);
                }
            }

            if (!empty($validated['variant_id'])) {
                $selectedVariant = ProductVariant::where('id', $validated['variant_id'])
                    ->where('product_id', $product->id)
                    ->first();

                if (!$selectedVariant) {
                    return back()->withErrors([
                        'variant_id' => 'Selected variant does not belong to the chosen product.',
                    ]);
                }
            }
        }

        $branchId = active_branch_id();

        $adjustment = StockAdjustment::create([
            'product_id' => $validated['product_id'],
            'variant_id' => $selectedVariant?->id,
            'variant_color' => $selectedVariant?->color,
            'product_type' => $validated['product_type'],
            'store_id' => $validated['store_id'],
            'user_id' => Auth::id(),
            'adjustment_type' => $validated['adjustment_type'],
            'quantity' => $validated['quantity'],
            'reason' => $validated['reason'] ?? 'Manual Correction',
            'notes' => $validated['notes'] ?? '',
            'status' => 'Pending',
            'branch_id' => $branchId
        ]);

        try {
            // Process immediately if requested or per policy
            $this->inventoryService->approveAdjustment($adjustment->id);
            return back()->with('success', 'Adjustment logged and applied successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to apply adjustment: ' . $e->getMessage());
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
