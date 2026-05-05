<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Payment;
use Carbon\Carbon;
use App\Models\Loan;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Sale;

class PaymentController extends Controller
{

    public function index(Request $request)
    {

        $d['payments'] = payment::with('loan')->get();
        // Fetch all products
        $d['loans'] = DB::table('loans as l')
            ->leftJoin('payments as p', 'l.unique_id', '=', 'p.unique_id')
            ->select(
                'l.unique_id',
                DB::raw('MAX(l.customer_name) as customer_name'), // Ensures single customer name
                DB::raw('MAX(l.product_name) as product_name'),   // Ensures single product name
                DB::raw('MAX(l.created_at) as created_at'),       // Ensures latest created_at
                DB::raw('SUM(l.total_amount) as total_loan_amount'),
                DB::raw('COALESCE(SUM(p.amount_paid), 0) as total_amount_paid')
            )
            ->groupBy('l.unique_id') // Grouping only by unique_id
            ->havingRaw('SUM(l.total_amount) != COALESCE(SUM(p.amount_paid), 0)')
            ->get();


        // Return view with the loans and products
        return \Inertia\Inertia::render('Admin/Loans/Payments/Index', $d);
    }



    public function store(Request $request)
    {
        $loansDetails = $request->validate([
            'unique_id' => 'required|string',
            'amount_paid' => 'required|numeric|min:1',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|max:255',
        ]);

        DB::beginTransaction(); // Start the transaction

        try {
            // Check if it exists in either table
            $idExists = Loan::where('unique_id', $request->unique_id)->exists() ||
                Cart::where('unique_id', $request->unique_id)->exists();

            if (!$idExists) {
                return response()->json(['error' => 'Order/Loan ID not found.'], 404);
            }

            // Calculate total amount from Carts (ground truth for price)
            $totalOrderAmount = Cart::where('unique_id', $request->unique_id)
                ->selectRaw('SUM((price * quantity) - (discount * quantity)) as total')
                ->first()->total;

            // Calculate total amount paid so far
            $totalPaid = payment::where('unique_id', $request->unique_id)->sum('amount_paid');

            // Calculate remaining amount
            $amountRemaining = $totalOrderAmount - $totalPaid;

            // Ensure the amount paid does not exceed the remaining amount
            if ($request->amount_paid > $amountRemaining + 1) { // Adding small buffer for rounding
                return response()->json(['error' => 'Amount exceeds remaining balance. Total: ' . $totalOrderAmount . ' Remaining: ' . $amountRemaining], 400);
            }

            // Create payment record
            payment::create([
                'loan_id' => Loan::where('unique_id', $request->unique_id)->value('id'),
                'unique_id' => $request->unique_id,
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'amount_paid' => $request->amount_paid,
                'payment_date' => $request->payment_date,
                'payment_method' => $request->payment_method,
            ]);

            // Update all loan records for this unique_id proportionally (if they exist)
            $allLoans = Loan::where('unique_id', $request->unique_id)->get();
            $paymentAmount = $request->amount_paid;

            foreach ($allLoans as $l) {
                if ($paymentAmount <= 0)
                    break;

                $remainingItemBalance = $l->balance;
                if ($remainingItemBalance > 0) {
                    $toPay = min($paymentAmount, $remainingItemBalance);
                    $l->balance -= $toPay;
                    $l->amount_paid += $toPay;

                    if ($l->balance <= 0) {
                        $l->status = 'Paid';
                    }
                    $l->save();

                    $paymentAmount -= $toPay;
                }
            }

            // Sync with Carts table proportionally
            $allCarts = Cart::where('unique_id', $request->unique_id)->get();
            $paymentAmountCart = $request->amount_paid;

            foreach ($allCarts as $c) {
                if ($paymentAmountCart <= 0)
                    break;

                // Simple check for balance (Price * Qty - Discount * Qty - amount_paid)
                $itemTotal = ($c->price * $c->quantity) - ($c->discount * $c->quantity);
                $remainingCartBalance = $itemTotal - $c->amount_paid;

                if ($remainingCartBalance > 0) {
                    $toPayCart = min($paymentAmountCart, $remainingCartBalance);
                    $c->amount_paid += $toPayCart;
                    $c->balance = $itemTotal - $c->amount_paid;

                    if ($c->balance <= 0) {
                        $c->status = 'Verified'; // Or 'Paid' depending on system flow
                    }
                    $c->save();

                    $paymentAmountCart -= $toPayCart;
                }
            }

            $this->syncSaleStatus($request->unique_id);

            DB::commit(); // Commit the transaction
            return response()->json(['success' => 'Payment added successfully for ' . $request->unique_id]);
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback the transaction on error
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }


    public function update(Request $request, Loan $loan)
    {
        $loanUpdateDetaila = $request->validate([
            'payment_date' => 'required',
            'status' => 'required',
            'amount_paid' => 'required',
        ]);

        $loan->update($loanUpdateDetaila);

        // dd($request->all());

        return redirect()->back();
    }

    private function syncSaleStatus($unique_id)
    {
        $sale = Sale::where('invoice_number', $unique_id)->first();
        if ($sale) {
            $sale->syncStatus();
        }
    }

    // ===== NEW INERTIA CRUD METHODS =====

    public function indexCrud(Request $request)
    {
        $branchId = (int) $request->header('X-Branch-Id') ?: auth()->user()->branch_id;
        $isGlobal = auth()->user()->isGlobal();

        $query = payment::with(['loan', 'user', 'sale']);

        if (!$isGlobal || $branchId) {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId ?: auth()->user()->branch_id);
            });
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('unique_id', 'like', $search)
                    ->orWhere('payment_method', 'like', $search)
                    ->orWhere('reference', 'like', $search);
            });
        }

        $payments = $query->latest('payment_date')->paginate(15)->withQueryString();

        // Calculate Metrics
        $totalCollected = (float) (clone $query)->sum('amount_paid');
        $totalPaymentsCount = (clone $query)->count();

        // Count unique completed orders (where balance is 0 across all items with same unique_id)
        $completedCount = (clone $query)->distinct('unique_id')
            ->whereHas('loan', function ($q) {
                $q->where('status', 'Paid');
            })->count();

        return \Inertia\Inertia::render('Finance/Payments/Index', [
            'payments' => $payments,
            'metrics' => [
                'totalPayments' => $totalPaymentsCount,
                'totalCollected' => $totalCollected,
                'completed' => $completedCount,
            ],
            'filters' => $request->only(['search']),
        ]);
    }

    public function createCrud()
    {
        return \Inertia\Inertia::render('Finance/Payments/Create');
    }

    public function storeCrud(Request $request)
    {
        $validated = $request->validate([
            'loan_id' => 'required|integer',
            'amount' => 'required|numeric',
            'payment_date' => 'required|date',
            'method' => 'required|string',
        ]);

        payment::create($validated);

        return redirect()->route('payments.index')->with('success', 'Payment recorded successfully');
    }

    public function showCrud($id)
    {
        $payment_record = payment::findOrFail($id);

        return \Inertia\Inertia::render('Finance/Payments/Show', [
            'payment' => $payment_record,
        ]);
    }

    public function editCrud($id)
    {
        $payment_record = payment::findOrFail($id);

        return \Inertia\Inertia::render('Finance/Payments/Edit', [
            'payment' => $payment_record,
        ]);
    }

    public function updateCrud(Request $request, $id)
    {
        $payment_record = payment::findOrFail($id);

        $validated = $request->validate([
            'loan_id' => 'required|integer',
            'amount' => 'required|numeric',
            'payment_date' => 'required|date',
            'method' => 'required|string',
        ]);

        $payment_record->update($validated);

        return redirect()->route('payments.index')->with('success', 'Payment updated successfully');
    }

    public function destroyCrud($id)
    {
        payment::findOrFail($id)->delete();

        return redirect()->route('payments.index')->with('success', 'Payment deleted successfully');
    }
}
