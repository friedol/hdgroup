<?php

namespace App\Http\Controllers;

use App\Models\PaymentRequest;
use App\Models\Sale;
use App\Models\Branch;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentRequestController extends Controller
{
    public function index(Request $request)
    {
        $user     = Auth::user();
        $branchId = $user->is_global ? $request->get('branch_id') : $user->branch_id;
        $status   = $request->get('status', 'all');
        $search   = $request->get('search');

        $requests = PaymentRequest::with(['branch', 'creator'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($search, fn ($q) => $q->where(function ($q2) use ($search) {
                $q2->where('customer_name', 'like', "%$search%")
                   ->orWhere('reference', 'like', "%$search%")
                   ->orWhere('invoice_number', 'like', "%$search%");
            }))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        // Outstanding sales (unpaid or partially paid) for quick lookup
        $outstandingSales = Sale::with(['posCustomer'])
            ->whereIn('payment_status', ['Unpaid', 'Partially Paid'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->limit(100)
            ->get()
            ->map(fn ($s) => [
                'invoice_number'  => $s->invoice_number,
                'customer_name'   => optional($s->posCustomer)->full_name ?? optional($s->customer)->staff_name ?? 'Walk-in',
                'customer_email'  => optional($s->posCustomer)->email,
                'customer_phone'  => optional($s->posCustomer)->phone,
                'payable_amount'  => (float) $s->payable_amount,
                'amount_paid'     => (float) $s->amount_paid,
                'balance'         => (float) $s->balance,
                'payment_status'  => $s->payment_status,
            ]);

        // Summary KPIs
        $base = PaymentRequest::when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $summary = [
            'total'     => (clone $base)->count(),
            'pending'   => (clone $base)->where('status', 'pending')->count(),
            'sent'      => (clone $base)->where('status', 'sent')->count(),
            'paid'      => (clone $base)->where('status', 'paid')->count(),
            'overdue'   => (clone $base)->whereIn('status', ['pending', 'sent'])->where('due_date', '<', now())->count(),
            'total_requested' => (clone $base)->whereIn('status', ['pending', 'sent'])->sum('amount_requested'),
        ];

        return Inertia::render('Admin/PaymentRequests/Index', [
            'requests'        => $requests,
            'outstandingSales'=> $outstandingSales,
            'summary'         => $summary,
            'branches'        => Branch::select('id', 'name')->get(),
            'filters'         => compact('status', 'search') + ['branch_id' => $branchId],
            'isGlobal'        => (bool) $user->is_global,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_number'   => 'nullable|string|max:50',
            'customer_name'    => 'required|string|max:200',
            'customer_email'   => 'nullable|email|max:200',
            'customer_phone'   => 'nullable|string|max:30',
            'amount_requested' => 'required|numeric|min:0.01',
            'due_date'         => 'nullable|date',
            'notes'            => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();

        PaymentRequest::create([
            ...$data,
            'reference'  => PaymentRequest::generateReference(),
            'branch_id'  => $user->is_global ? $request->get('branch_id') : $user->branch_id,
            'created_by' => $user->id,
            'status'     => 'pending',
        ]);

        return redirect()->back()->with('success', 'Payment request created.');
    }

    public function markSent(PaymentRequest $paymentRequest)
    {
        $paymentRequest->update(['status' => 'sent', 'sent_at' => now()]);
        return redirect()->back()->with('success', 'Marked as sent.');
    }

    public function markPaid(PaymentRequest $paymentRequest)
    {
        $paymentRequest->update(['status' => 'paid', 'paid_at' => now()]);
        return redirect()->back()->with('success', 'Marked as paid.');
    }

    public function cancel(PaymentRequest $paymentRequest)
    {
        $paymentRequest->update(['status' => 'cancelled']);
        return redirect()->back()->with('success', 'Payment request cancelled.');
    }

    public function destroy(PaymentRequest $paymentRequest)
    {
        $paymentRequest->delete();
        return redirect()->back()->with('success', 'Payment request deleted.');
    }
}
