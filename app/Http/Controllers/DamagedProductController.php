<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockAdjustment;
use App\Models\Store;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DamagedProductController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public const DAMAGE_CATEGORIES = [
        'Physical Damage',
        'Expired / Spoiled',
        'Manufacturing Defect',
        'Water / Moisture Damage',
        'Fire / Heat Damage',
        'Theft / Lost',
        'Handling Error',
        'Other',
    ];

    public function index(Request $request)
    {
        $branchId = session('active_branch_id') ?? active_branch_id();

        $query = StockAdjustment::with(['product', 'store', 'user', 'variant'])
            ->whereIn('adjustment_type', ['Damage', 'Loss', 'Expiry'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        if ($request->filled('search')) {
            $query->whereHas('product', fn ($q) => $q->where('product_name', 'like', '%'.$request->search.'%'));
        }

        if ($request->filled('type')) {
            $query->where('adjustment_type', $request->type);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [$request->start_date.' 00:00:00', $request->end_date.' 23:59:59']);
        }

        $records = $query->latest()->paginate(20)->withQueryString();

        $mappedRecords = $records->through(function ($adj) {
            $productName = $adj->product instanceof Product
                ? $adj->product->product_name
                : ($adj->product?->raw_material_name ?? 'Unknown');

            $lossValue = $adj->financial_loss_value;
            if (! $lossValue && $adj->product instanceof Product) {
                $lossValue = (float) $adj->product->product_price * (float) $adj->quantity;
            }

            return [
                'id' => $adj->id,
                'product_name' => $productName,
                'variant_color' => $adj->variant_color,
                'store' => $adj->store?->store_name ?? '—',
                'adjustment_type' => $adj->adjustment_type,
                'damage_category' => $adj->damage_category ?? '—',
                'quantity' => (float) $adj->quantity,
                'financial_loss_value' => (float) ($lossValue ?? 0),
                'reason' => $adj->reason,
                'notes' => $adj->notes,
                'reported_by' => $adj->user?->staff_name ?? 'System',
                'status' => $adj->status,
                'date' => $adj->created_at->format('d M Y'),
                'time' => $adj->created_at->format('g:i A'),
            ];
        });

        // KPIs
        $kpiBase = StockAdjustment::whereIn('adjustment_type', ['Damage', 'Loss', 'Expiry'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $totalLoss = (clone $kpiBase)->sum('financial_loss_value');
        $todayLoss = (clone $kpiBase)->whereDate('created_at', today())->sum('financial_loss_value');
        $totalItems = (clone $kpiBase)->count();
        $totalQty = (clone $kpiBase)->sum('quantity');

        $products = Product::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->with(['variants:id,product_id,color,qty'])
            ->get(['id', 'product_name', 'product_price', 'product_type']);

        $stores = Store::when($branchId, fn ($q) => $q->where('branch_id', $branchId))->get(['id', 'store_name']);

        return Inertia::render('Admin/DamagedProducts/Index', [
            'records' => $mappedRecords,
            'kpis' => [
                'total_loss' => (float) $totalLoss,
                'today_loss' => (float) $todayLoss,
                'total_records' => $totalItems,
                'total_qty' => (float) $totalQty,
            ],
            'products' => $products,
            'stores' => $stores,
            'damage_categories' => self::DAMAGE_CATEGORIES,
            'filters' => $request->only(['search', 'type', 'start_date', 'end_date']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'store_id' => 'required|exists:stores,id',
            'adjustment_type' => 'required|in:Damage,Loss,Expiry',
            'damage_category' => 'nullable|string|max:100',
            'quantity' => 'required|numeric|min:0.01',
            'financial_loss_value' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Auto-calculate financial loss if not provided
        $lossValue = $validated['financial_loss_value']
            ?? ((float) $product->product_price * (float) $validated['quantity']);

        $selectedVariant = null;
        if (! empty($validated['variant_id'])) {
            $selectedVariant = ProductVariant::where('id', $validated['variant_id'])
                ->where('product_id', $product->id)
                ->first();
        }

        $branchId = session('active_branch_id') ?? active_branch_id();

        $adjustment = StockAdjustment::create([
            'product_id' => $validated['product_id'],
            'variant_id' => $selectedVariant?->id,
            'variant_color' => $selectedVariant?->color,
            'product_type' => Product::class,
            'store_id' => $validated['store_id'],
            'user_id' => Auth::id(),
            'adjustment_type' => $validated['adjustment_type'],
            'quantity' => $validated['quantity'],
            'financial_loss_value' => $lossValue,
            'damage_category' => $validated['damage_category'] ?? null,
            'reason' => $validated['reason'] ?? 'Damage recorded',
            'notes' => $validated['notes'] ?? '',
            'status' => 'Pending',
            'branch_id' => $branchId,
        ]);

        try {
            $this->inventoryService->approveAdjustment($adjustment->id);

            return back()->with('success', 'Damage record saved and inventory updated.');
        } catch (\Exception $e) {
            return back()->with('error', 'Damage recorded but inventory update failed: '.$e->getMessage());
        }
    }

    public function destroy(int $id)
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if ($adjustment->status === 'Approved') {
            return back()->with('error', 'Cannot delete an approved record. Reverse via stock correction instead.');
        }

        $adjustment->delete();

        return back()->with('success', 'Damage record deleted.');
    }
}
