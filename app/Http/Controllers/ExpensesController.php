<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Expense;
use App\Traits\FileUploadTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpensesController extends Controller
{
    use FileUploadTrait;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $expenses = Expense::with('user')->latest()->paginate(15);

        $metrics = [
            'todayBurn' => (float) Expense::whereDate('date', now())->sum('amount'),
            'weeklyBurn' => (float) Expense::whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])->sum('amount'),
            'pendingApproval' => Expense::where('status', 'Pending')->count(),
            'total' => (float) Expense::sum('amount'),
            'cash' => (float) Expense::where('payment_method', 'Cash')->sum('amount'),
            'mobile' => (float) Expense::where('payment_method', 'Mobile money')->sum('amount'),
            'bank' => (float) Expense::where('payment_method', 'Bank transfer')->sum('amount'),
        ];

        $allCategories = Expense::distinct()->pluck('category')->filter()->values();
        $isGlobal = auth()->user()?->isGlobal() ?? false;

        return Inertia::render('Finance/Expenses/Index', [
            'expenses' => $expenses,
            'metrics' => $metrics,
            'filters' => ['search' => '', 'date_from' => '', 'date_to' => '', 'category' => '', 'branch_id' => ''],
            'allCategories' => $allCategories,
            'branches' => $isGlobal ? Branch::where('is_active', true)->get(['id', 'name']) : [],
        ]);
    }

    public function indexCrud(Request $request)
    {
        $branchId = $request->get('branch_id') ?: (int) $request->header('X-Branch-Id') ?: auth()->user()->branch_id;
        $isGlobal = auth()->user()->isGlobal();

        $query = Expense::query()->with('user');

        // Dynamic filters
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        } elseif (! $isGlobal || $branchId) {
            $query->where('branch_id', $branchId ?: auth()->user()->branch_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('category', 'like', $search)
                    ->orWhere('description', 'like', $search);
            });
        }

        // For printing, we might want all records without pagination
        if ($request->get('action') === 'print') {
            $expenses = $query->latest('date')->get();

            return view('admin.finance.expenses-print', [
                'expenses' => $expenses,
                'filters' => $request->all(),
                'branch' => $branchId ? Branch::find($branchId) : null,
                'total_amount' => $expenses->sum('amount'),
            ]);
        }

        $expenses = $query->latest('date')->paginate(15)->withQueryString();

        // Get all categories used in the system for filtering
        $allCategories = Expense::distinct()->pluck('category')->filter()->values();

        $metrics = [
            'todayBurn' => (float) Expense::whereDate('date', now())->sum('amount'),
            'weeklyBurn' => (float) Expense::whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])->sum('amount'),
            'pendingApproval' => Expense::where('status', 'Pending')->count(),
            'total' => (float) Expense::sum('amount'),
            'cash' => (float) Expense::where('payment_method', 'Cash')->sum('amount'),
            'mobile' => (float) Expense::where('payment_method', 'Mobile money')->sum('amount'),
            'bank' => (float) Expense::where('payment_method', 'Bank transfer')->sum('amount'),
        ];

        return Inertia::render('Finance/Expenses/Index', [
            'expenses' => $expenses,
            'metrics' => $metrics,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'category', 'branch_id']),
            'allCategories' => $allCategories,
            'branches' => $isGlobal ? Branch::where('is_active', true)->get(['id', 'name']) : [],
        ]);
    }

    public function storeCrud(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'amount' => 'required|numeric',
            'category' => 'required|string',
            'payment_method' => 'required|string',
            'description' => 'nullable|string',
        ]);

        Expense::create([
            'date' => $request->date,
            'amount' => $request->amount,
            'category' => $request->category,
            'payment_method' => $request->payment_method,
            'description' => $request->description,
            'user_id' => auth()->id(),
            'branch_id' => auth()->user()->branch_id, // Default to current branch
            'status' => 'approved',
        ]);

        return redirect()->back()->with('success', 'Expense recorded successfully.');
    }

    public function updateCrud(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|date',
            'amount' => 'required|numeric',
            'category' => 'required|string',
            'payment_method' => 'required|string',
        ]);

        $expense = Expense::findOrFail($id);
        $expense->update($request->all());

        return redirect()->back()->with('success', 'Expense updated successfully.');
    }

    public function destroyCrud($id)
    {
        Expense::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Expense deleted successfully.');
    }

    public function reports(Request $request)
    {
        // dd($request->all());
        $d['expenses'] = $transfers = $this->getExpnesesData($request, true);
        $d['totalQuantity'] = $transfers->sum('total_quantity');

        return Inertia::render('Admin/Expenses/Reports', $d);
    }

    private function getExpnesesData($request, $getAll = false)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $query = Expense::select('*')
            ->orderBy('id', 'desc');

        if ($getAll) {
            if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
                $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
            }

        } else {
            if ($request->has('all')) {
                // $query;
            } elseif ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
                $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
            } else {
                $query->whereDate('created_at', $currentDate);
            }
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'amount' => 'required|numeric',
            'category' => 'required|string',
            'payment_method' => 'required|string',
            'receipt' => 'nullable|file|mimes:jpg,png,pdf,jpeg',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('receipts', 'public');
        }

        try {
            Expense::create([
                'date' => $request->date,
                'amount' => $request->amount,
                'category' => $request->category,
                'payment_method' => $request->payment_method,
                'description' => $request->description,
                'receipt' => $receiptPath,
            ]);

            return response()->json(['success' => 'Expense added  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while saving the budget. Please try again.'], 500);
        }

    }

    public function show(string $id)
    {
        $d['expnses'] = Expense::findOrFail($id);

        return Inertia::render('Finance/Expenses/Show', $d);

    }

    public function voucher(string $id)
    {
        $expense = Expense::with('user')->findOrFail($id);
        $expense->date = Carbon::parse($expense->date);
        $expense->department = (object) [
            'name' => $expense->category ? strtoupper(str_replace('_', ' ', $expense->category)) : 'General',
        ];
        $expense->approvedBy = $expense->user ?: (object) ['name' => 'System'];

        return Inertia::render('Admin/Finance/Voucher', compact('expense'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        return response()->json(Expense::findOrFail($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Expense $expense)
    {
        $request->validate([
            'date' => 'required|date',
            'amount' => 'required|numeric',
            'category' => 'required|string',
            'payment_method' => 'required|string',
            'receipt' => 'nullable|file|mimes:jpg,png,pdf,jpeg',
        ]);
        // dd($id);
        try {
            $expense->update([
                'date' => $request->date,
                'amount' => $request->amount,
                'category' => $request->category,
                'payment_method' => $request->payment_method,
                'description' => $request->description,
                'receipt' => $request->hasFile('receipt') ? $request->file('receipt')->store('receipts') : $expense->receipt,
            ]);

            return response()->json(['success' => 'Expense updated  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Expense $expense)
    {
        try {
            $expense->delete();

            return response()->json(['success' => 'Category deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
}
