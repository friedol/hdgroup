<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Bom;
use App\Models\Production;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ProductionController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(Request $request)
    {
        $branchId = session('active_branch_id');
        $isGlobal = !$branchId || $branchId === 'all';

        // Fetch production output transactions from the ledger
        $productionsQuery = \App\Models\InventoryTransaction::with(['product.productManagement', 'createdBy', 'store'])
            ->where('transaction_type', 'production_output');

        if (!$isGlobal) {
            $productionsQuery->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                    ->orWhere('branch_id', 0); // Include legacy or system-wide records
            });
        }

        $productions = $productionsQuery->latest()->paginate(20);

        // Metrics from ledger for production output
        $metricsQuery = \App\Models\InventoryTransaction::with('product')
            ->where('transaction_type', 'production_output');

        if (!$isGlobal) {
            $metricsQuery->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                    ->orWhere('branch_id', 0);
            });
        }

        $allOutput = $metricsQuery->get();

        $cost = $allOutput->sum(function ($t) {
            return $t->quantity_in * $t->unit_cost;
        });

        $revenue = $allOutput->sum(function ($t) {
            return $t->quantity_in * ($t->product->selling_price ?? 0);
        });

        $metrics = [
            'total_produced' => $allOutput->sum('quantity_in'),
            'total_cost' => $cost,
            'total_revenue' => $revenue,
            'total_profit' => $revenue - $cost
        ];

        return \Inertia\Inertia::render('Admin/Productions/Index', compact('productions', 'metrics'));
    }

    public function create()
    {
        // Redirect to new Roll-Based Production flow
        return redirect()->route('production.roll-based');
    }

    public function show($id)
    {
        $branchId = session('active_branch_id');
        $isGlobal = !$branchId || $branchId === 'all';

        $query = \App\Models\InventoryTransaction::with(['product.productManagement', 'createdBy', 'store', 'reference']);

        if (!$isGlobal) {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                    ->orWhere('branch_id', 0);
            });
        }

        $production = $query->findOrFail($id);

        return \Inertia\Inertia::render('Admin/Productions/Show', compact('production'));
    }
}
