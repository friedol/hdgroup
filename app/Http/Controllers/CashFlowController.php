<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\CashFlow;
use App\Models\Branch;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class CashFlowController extends Controller
{
    public function index(Request $request)
    {
        $branchId = session('branchId') ?? Auth::user()->branch_id;
        $isGlobal = !$branchId || $branchId == 'global';

        /** @var \Illuminate\Database\Eloquent\Builder $query */
        $query = CashFlow::query()->with(['user', 'branch']);

        if (!$isGlobal) {
            $query->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        // Filtering by date range
        $from = $request->input('from');
        $to = $request->input('to');
        if ($from && $to) {
            $query->whereBetween('transaction_date', [
                Carbon::parse($from)->startOfDay(),
                Carbon::parse($to)->endOfDay()
            ]);
        } else {
            // Default to current month
            $query->whereMonth('transaction_date', now()->month)
                  ->whereYear('transaction_date', now()->year);
        }

        $transactions = $query->orderBy('transaction_date', 'desc')->get();

        return Inertia::render('CashFlowPage', [
            'transactions' => $transactions,
            'filters' => $request->only(['from', 'to']),
            'summary' => [
                'totalIn' => $transactions->where('flow', 'IN')->sum('amount'),
                'totalOut' => $transactions->where('flow', 'OUT')->sum('amount'),
                'count' => $transactions->count(),
            ],
            'branches' => $isGlobal ? Branch::all() : [],
            'isGlobal' => $isGlobal
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'flow' => 'required|in:IN,OUT',
            'source_name' => 'required|string',
            'source_phone' => 'nullable|string',
            'details' => 'nullable|string',
            'method' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'ref' => 'nullable|string',
            'transaction_date' => 'required|date',
            'branch_id' => 'nullable|exists:branches,id'
        ]);

        $branchId = $validated['branch_id'] ?? session('branchId') ?? Auth::user()->branch_id;
        if ($branchId == 'global') $branchId = Auth::user()->branch_id;

        $cashflow = CashFlow::create([
            'branch_id' => $branchId,
            'user_id' => Auth::id(),
            'flow' => $validated['flow'],
            'source_name' => $validated['source_name'],
            'source_phone' => $validated['source_phone'],
            'details' => $validated['details'],
            'method' => $validated['method'],
            'amount' => $validated['amount'],
            'ref' => $validated['ref'],
            'transaction_date' => $validated['transaction_date'],
        ]);

        return redirect()->back()->with('success', 'Transaction recorded successfully');
    }

    public function destroy(CashFlow $cashFlow)
    {
        $cashFlow->delete();
        return redirect()->back()->with('success', 'Transaction deleted successfully');
    }
}
