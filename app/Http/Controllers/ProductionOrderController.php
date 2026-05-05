<?php

namespace App\Http\Controllers;

use App\Models\ProductionOrder;
use App\Models\Bom;
use App\Models\Store;
use App\Models\RawMaterial;
use App\Models\ProductionBenchmark;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ProductionOrderController extends Controller
{
    protected $inventoryService;
    protected $rollService;

    public function __construct(InventoryService $inventoryService, \App\Services\RollProductionService $rollService)
    {
        $this->inventoryService = $inventoryService;
        $this->rollService = $rollService;
    }

    public function index(Request $request)
    {
        $branchId = session('active_branch_id');

        $query = ProductionOrder::with(['product', 'roll', 'store', 'createdBy']);
        
        if ($branchId && $branchId !== 'all') {
            $query->where('branch_id', $branchId);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate(20);

        return \Inertia\Inertia::render('Operations/ProductionOrders/Index', [
            'orders' => $orders,
        ]);
    }

    private function buildRawMaterialUsageSummary($branchId): array
    {
        // Raw material usage matrix (similar to sheet: size, color, amount, pcs@1roll, outgoing, remain)
        $rollsQuery = RawMaterial::query()
            ->where('is_roll', true)
            ->whereNull('parent_roll_id')
            ->where('roll_status', '!=', 'consumed');

        if ($branchId && $branchId !== 'all') {
            $rollsQuery->where('branch_id', $branchId);
        }

        $rolls = $rollsQuery->get();

        $benchmarks = ProductionBenchmark::where('is_active', true)->get();
        $benchmarkByWidth = $benchmarks
            ->groupBy(fn($b) => (string) ((float) $b->req_roller))
            ->map(function ($group) {
                return $group->sortByDesc('target')->first();
            });

        $formatSizeLabel = function (float $width) use ($benchmarkByWidth) {
            $key = (string) $width;
            $benchmark = $benchmarkByWidth->get($key);
            if (!$benchmark) {
                $benchmark = $benchmarkByWidth->first(function ($b) use ($width) {
                    return abs(((float) $b->req_roller) - $width) <= 1;
                });
            }

            $benchmarkName = $benchmark?->name ?? 'ROLL';
            $baseSize = strtoupper(trim(explode(' ', $benchmarkName)[0]));
            return trim($baseSize . ' ' . rtrim(rtrim(number_format($width, 2, '.', ''), '0'), '.') . 'CM');
        };

        $usageMap = [];

        // Build remaining counts from current roll inventory
        foreach ($rolls as $roll) {
            $width = (float) ($roll->width ?: 0);
            if ($width <= 0) {
                continue;
            }

            $sizeLabel = $formatSizeLabel($width);
            $color = strtoupper(trim($roll->color ?: 'N/A'));
            $bucket = $sizeLabel . '|' . $color;

            if (!isset($usageMap[$bucket])) {
                $bestBenchmark = $benchmarkByWidth->get((string) $width)
                    ?: $benchmarkByWidth->first(fn($b) => abs(((float) $b->req_roller) - $width) <= 1);

                $usageMap[$bucket] = [
                    'size' => $sizeLabel,
                    'width' => $width,
                    'color' => $color,
                    'amount' => 0,
                    'pcs_per_roll' => (int) ($bestBenchmark?->target ?? 0),
                    'outgoing' => 0,
                    'remain' => 0,
                ];
            }

            $remainUnits = max(0, (int) round((float) ($roll->inventory_qty ?? 0)));
            $usageMap[$bucket]['remain'] += $remainUnits;
        }

        // Outgoing units estimated from completed/produced roll-based orders
        $ordersForUsageQuery = ProductionOrder::with(['roll'])
            ->whereNotNull('roll_id')
            ->whereIn('status', ['completed', 'produced']);

        if ($branchId && $branchId !== 'all') {
            $ordersForUsageQuery->where('branch_id', $branchId);
        }

        $ordersForUsage = $ordersForUsageQuery->get();

        foreach ($ordersForUsage as $order) {
            if (!$order->roll) {
                continue;
            }

            $roll = $order->roll;
            $width = (float) ($roll->width ?: 0);
            if ($width <= 0) {
                continue;
            }

            $sizeLabel = $formatSizeLabel($width);
            $color = strtoupper(trim($roll->color ?: 'N/A'));
            $bucket = $sizeLabel . '|' . $color;

            if (!isset($usageMap[$bucket])) {
                $bestBenchmark = $benchmarkByWidth->get((string) $width)
                    ?: $benchmarkByWidth->first(fn($b) => abs(((float) $b->req_roller) - $width) <= 1);

                $usageMap[$bucket] = [
                    'size' => $sizeLabel,
                    'width' => $width,
                    'color' => $color,
                    'amount' => 0,
                    'pcs_per_roll' => (int) ($bestBenchmark?->target ?? 0),
                    'outgoing' => 0,
                    'remain' => 0,
                ];
            }

            $totalLength = max(1, (float) ($roll->total_length ?: 1));
            $actualUsed = max(0, (float) ($order->actual_used_length ?: 0));
            $outgoingUnits = $actualUsed > 0 ? (int) ceil($actualUsed / $totalLength) : 1;

            $usageMap[$bucket]['outgoing'] += $outgoingUnits;
        }

        // Amount follows the sheet logic: outgoing + remain
        foreach ($usageMap as $k => $entry) {
            $usageMap[$k]['amount'] = (int) $entry['outgoing'] + (int) $entry['remain'];
        }

        $rawMaterialUsage = collect(array_values($usageMap))
            ->sortBy([
                ['width', 'asc'],
                ['color', 'asc'],
            ])
            ->values();

        $rawMaterialUsageTotals = [
            'amount' => (int) $rawMaterialUsage->sum('amount'),
            'pcs_per_roll_total' => (int) $rawMaterialUsage->sum(fn($row) => ((int) $row['pcs_per_roll']) * ((int) $row['amount'])),
            'outgoing' => (int) $rawMaterialUsage->sum('outgoing'),
            'remain' => (int) $rawMaterialUsage->sum('remain'),
        ];

        return [
            'rawMaterialUsage' => $rawMaterialUsage,
            'rawMaterialUsageTotals' => $rawMaterialUsageTotals,
        ];
    }

    public function rawMaterialHistory(Request $request)
    {
        $branchId = session('active_branch_id');
        $summary = $this->buildRawMaterialUsageSummary($branchId);

        return \Inertia\Inertia::render('Operations/RawMaterialHistory/Index', $summary);
    }

    public function indexCrud(Request $request)
    {
        return $this->index($request);
    }

    public function create()
    {
        $branchId = session('active_branch_id');
        $bomsQuery = Bom::with('finishedProduct')->where('is_active', true);
        $storesQuery = Store::query();

        if ($branchId && $branchId !== 'all') {
            $bomsQuery->where('branch_id', $branchId);
            $storesQuery->where('branch_id', $branchId);
        }

        $boms = $bomsQuery->get();
        $stores = $storesQuery->get();

        return \Inertia\Inertia::render('Admin/ProductionOrders/Create', compact('boms', 'stores'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'bom_id' => 'required|exists:boms,id',
            'store_id' => 'required|exists:stores,id',
            'quantity_to_produce' => 'required|numeric|min:1',
        ]);

        $branchId = session('active_branch_id');
        // If 'all' branch is selected, we use the store's branch ID to ensure data integrity
        $store = Store::findOrFail($request->store_id);
        $bom = Bom::findOrFail($request->bom_id);

        try {
            DB::beginTransaction();

            $order = ProductionOrder::create([
                'branch_id' => $store->branch_id, // Use store's branch rather than session 'all'
                'store_id' => $request->store_id,
                'bom_id' => $bom->id,
                'quantity_to_produce' => $request->quantity_to_produce,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            return redirect()->route('production-orders.show', $order->id)->with('success', 'Production Order created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create order: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $branchId = session('active_branch_id');
        $query = ProductionOrder::with(['bom.finishedProduct', 'bom.items.rawMaterial', 'roll', 'product', 'store', 'createdBy']);
        
        if ($branchId && $branchId !== 'all') {
            $query->where('branch_id', $branchId);
        }

        $order = $query->findOrFail($id);

        return \Inertia\Inertia::render('Admin/ProductionOrders/Show', compact('order'));
    }

    public function updateStatus(Request $request, $id)
    {
        $branchId = session('active_branch_id');
        $order = ProductionOrder::with(['bom.items.rawMaterial'])->where('branch_id', $branchId)->findOrFail($id);

        $request->validate([
            'status' => 'required|in:approved,in_progress,completed,cancelled'
        ]);

        // Validate state transitions
        if ($order->status == 'completed' || $order->status == 'cancelled') {
            return back()->with('error', 'Order is already finalized.');
        }

        try {
            DB::beginTransaction();

            if ($request->status === 'completed') {
                $totalCost = 0;

                // 1. Deduct Raw Materials via InventoryService (this also validates stock availability dynamically)
                foreach ($order->bom->items as $item) {
                    $requiredMaterial = $order->quantity_to_produce * $item->quantity_required;

                    // Apply wastage
                    $wasteAdjustment = 1 + ($item->wastage_percent / 100);
                    $actualRequired = $requiredMaterial * $wasteAdjustment;

                    $rawMaterial = $item->rawMaterial;

                    // Sync to product table for UI listing/POS visibility (DISABLED as per requirement)
                    // if ($rawMaterial) {
                    //     $this->rollService->syncRollToProductListing($rawMaterial);
                    // }

                    $unitCost = $rawMaterial->cost_per_unit ?? 0;
                    $totalCost += ($actualRequired * $unitCost);

                    // Will throw exception if insufficient stock exists based on ledger
                    $this->inventoryService->adjustInventory(
                        $rawMaterial->id,
                        $actualRequired,
                        $order->store_id,
                        'decrease',
                        'production_consume',
                        "Consumed for PO: {$order->order_number}",
                        $order->id,
                        'raw_material',
                        'App\Models\ProductionOrder',
                        $unitCost
                    );

                    // Record actual usage for audit/history
                    \App\Models\ProductionMaterialUsage::create([
                        'production_id' => $order->id,
                        'raw_material_id' => $rawMaterial->id,
                        'quantity_used' => $actualRequired,
                        'cost_at_time' => $unitCost,
                    ]);
                }

                // 2. Add Finished Goods via InventoryService
                $finishedProduct = $order->bom->finishedProduct;
                $unitProductionCost = $order->quantity_to_produce > 0 ? ($totalCost / $order->quantity_to_produce) : 0;

                $this->inventoryService->adjustInventory(
                    $finishedProduct->id,
                    $order->quantity_to_produce,
                    $order->store_id,
                    'increase',
                    'production_output',
                    "Produced via PO: {$order->order_number}",
                    $order->id,
                    'finished_product',
                    'App\Models\ProductionOrder',
                    $unitProductionCost
                );

                // Update metrics for reporting UI
                $order->fabric_cost_used = $totalCost;
                $order->total_cost = $totalCost;
                $order->revenue = (float) $order->quantity_to_produce * (float) ($order->selling_price ?: ($finishedProduct->product_price ?? 0));
                $order->gross_profit = (float) $order->revenue - (float) $totalCost;
            }

            $order->status = $request->status;
            $order->save();

            DB::commit();

            return redirect()->route('production-orders.show', $order->id)->with('success', "Order status updated to {$request->status}.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Execution Failed: ' . $e->getMessage());
        }
    }
}
