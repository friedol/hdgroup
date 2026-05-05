<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\SalesTarget;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SalesTargetController extends Controller
{
    public function index(Request $request)
    {
        $user   = Auth::user();
        $period = $request->get('period_type', 'monthly');
        $label  = $request->get('period_label', now()->format('Y-m'));

        // Branch scope
        $branchId = $user->is_global
            ? $request->get('branch_id')
            : $user->branch_id;

        // Load targets for the selected period + branch scope
        $targets = SalesTarget::with(['branch', 'user'])
            ->where('period_type', $period)
            ->where('period_label', $label)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get();

        // Build achievement data: compare actual sales to targets
        [$startDate, $endDate] = $this->periodDates($period, $label);

        $achievements = $targets->map(function (SalesTarget $t) use ($startDate, $endDate) {
            $query = Sale::whereBetween('created_at', [$startDate, $endDate]);

            if ($t->user_id) {
                $query->where('user_id', $t->user_id);
            } elseif ($t->branch_id) {
                $query->where('branch_id', $t->branch_id);
            }

            $actualAmount = (float) $query->sum('payable_amount');
            $actualUnits  = (int)   $query->sum('quantity'); // sum of items if available, else order count
            if ($actualUnits === 0) {
                $actualUnits = $query->count(); // fallback: count orders
            }

            $amountPct = $t->target_amount > 0
                ? round(($actualAmount / $t->target_amount) * 100, 1)
                : 0;

            $unitsPct = $t->target_units > 0
                ? round(($actualUnits / $t->target_units) * 100, 1)
                : 0;

            return [
                'id'             => $t->id,
                'period_type'    => $t->period_type,
                'period_label'   => $t->period_label,
                'branch_id'      => $t->branch_id,
                'branch_name'    => $t->branch?->name ?? 'All Branches',
                'user_id'        => $t->user_id,
                'staff_name'     => $t->user?->staff_name ?? 'Branch Target',
                'target_amount'  => $t->target_amount,
                'target_units'   => $t->target_units,
                'actual_amount'  => $actualAmount,
                'actual_units'   => $actualUnits,
                'amount_pct'     => $amountPct,
                'units_pct'      => $unitsPct,
                'notes'          => $t->notes,
            ];
        });

        // Branch-level sales summary for the period
        $branchSummaries = $this->branchSalesSummary($startDate, $endDate, $branchId);

        return Inertia::render('Admin/SalesTargets/Index', [
            'achievements'    => $achievements,
            'branchSummaries' => $branchSummaries,
            'branches'        => Branch::select('id', 'name')->get(),
            'staff'           => User::query()
                ->select('id', 'staff_name', 'branch_id', 'role_id')
                ->whereNotNull('branch_id')
                ->whereHas('role', function ($q) {
                    $q->where('role_name', 'Seller')
                      ->orWhere('role_name', 'like', '%Sales%');
                })
                ->orderBy('staff_name')
                ->get(),
            'filters'         => [
                'period_type'  => $period,
                'period_label' => $label,
                'branch_id'    => $branchId,
            ],
            'isGlobal'        => (bool) $user->is_global,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'period_type'   => 'required|in:monthly,quarterly,yearly',
            'period_label'  => 'required|string|max:20',
            'branch_id'     => 'nullable|exists:branches,id',
            'user_id'       => 'nullable|exists:users,id',
            'target_amount' => 'required|numeric|min:0',
            'target_units'  => 'nullable|integer|min:0',
            'notes'         => 'nullable|string|max:500',
        ]);

        SalesTarget::updateOrCreate(
            [
                'period_type'  => $data['period_type'],
                'period_label' => $data['period_label'],
                'branch_id'    => $data['branch_id'] ?? null,
                'user_id'      => $data['user_id'] ?? null,
            ],
            $data
        );

        return redirect()->back()->with('success', 'Sales target saved.');
    }

    public function destroy(SalesTarget $salesTarget)
    {
        $salesTarget->delete();
        return redirect()->back()->with('success', 'Sales target deleted.');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function periodDates(string $type, string $label): array
    {
        switch ($type) {
            case 'quarterly':
                // label format: Q1-2026
                [$q, $y] = explode('-', $label);
                $qNum = (int) ltrim($q, 'Q');
                $start = Carbon::create($y)->startOfYear()->addMonths(($qNum - 1) * 3);
                $end   = (clone $start)->addMonths(3)->subSecond();
                return [$start, $end];

            case 'yearly':
                $start = Carbon::create($label)->startOfYear();
                $end   = Carbon::create($label)->endOfYear();
                return [$start, $end];

            default: // monthly  label format: 2026-04
                $start = Carbon::createFromFormat('Y-m', $label)->startOfMonth();
                $end   = Carbon::createFromFormat('Y-m', $label)->endOfMonth();
                return [$start, $end];
        }
    }

    private function branchSalesSummary(Carbon $start, Carbon $end, ?int $branchId): array
    {
        $query = Sale::whereBetween('created_at', [$start, $end])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->selectRaw('branch_id, SUM(payable_amount) as total_revenue, COUNT(*) as total_orders')
            ->groupBy('branch_id')
            ->with('branch:id,name');

        return $query->get()->map(fn ($row) => [
            'branch_id'     => $row->branch_id,
            'branch_name'   => $row->branch?->name ?? 'Unknown',
            'total_revenue' => (float) $row->total_revenue,
            'total_orders'  => (int) $row->total_orders,
        ])->values()->toArray();
    }
}
