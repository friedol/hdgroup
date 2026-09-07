<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaveController extends Controller
{
    protected function canApprove(): bool
    {
        /** @var User $user */
        $user = Auth::user();

        return $user->hasRole(['CEO', 'HR', 'Super Admin']) || $user->hasPermissionTo('manage hr');
    }

    public function index()
    {
        $user = Auth::user();
        $canApprove = $this->canApprove();

        $myRequests = LeaveRequest::with('leaveType', 'approver', 'user')
            ->when(! $canApprove, fn ($query) => $query->where('user_id', $user->id))
            ->latest()
            ->get();

        $leaveTypes = LeaveType::orderBy('name')->get();

        $yearStart = now()->startOfYear();
        $balances = $leaveTypes->map(function (LeaveType $type) use ($user, $yearStart) {
            $used = LeaveRequest::where('user_id', $user->id)
                ->where('leave_type_id', $type->id)
                ->where('status', 'approved')
                ->where('start_date', '>=', $yearStart)
                ->sum('days_requested');

            return [
                'leave_type_id' => $type->id,
                'name' => $type->name,
                'days_allowed_per_year' => $type->days_allowed_per_year,
                'used' => (int) $used,
                'remaining' => max(0, $type->days_allowed_per_year - $used),
            ];
        });

        $pendingApprovals = $canApprove
            ? LeaveRequest::with('user', 'leaveType')
                ->where('status', 'pending')
                ->where('user_id', '!=', $user->id)
                ->latest()
                ->get()
            : [];

        $employees = $canApprove
            ? User::whereHas('employeeProfile', function ($query) {
                $query->where('status', '!=', 'terminated');
            })->select('id', 'name')->orderBy('name')->get()
            : [];

        return Inertia::render('HR/Leave/Index', [
            'my_requests' => $myRequests,
            'leave_types' => $leaveTypes,
            'balances' => $balances,
            'pending_approvals' => $pendingApprovals,
            'can_approve' => $canApprove,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $canApprove = $this->canApprove();

        $validated = $request->validate([
            'user_id' => [$canApprove ? 'required' : 'nullable', 'exists:users,id'],
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        $days = Carbon::parse($validated['start_date'])
            ->diffInDays(Carbon::parse($validated['end_date'])) + 1;

        LeaveRequest::create([
            'user_id' => $canApprove ? (int) $validated['user_id'] : Auth::id(),
            'leave_type_id' => $validated['leave_type_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'days_requested' => $days,
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Leave request submitted.');
    }

    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        if (! $this->canApprove()) {
            return back()->withErrors(['error' => 'You are not authorized to approve leave requests.']);
        }

        if ($leaveRequest->user_id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot approve your own leave request.']);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'approval_notes' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update([
            'status' => $validated['status'],
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'approval_notes' => $validated['approval_notes'] ?? null,
        ]);

        return back()->with('success', 'Leave request '.$validated['status'].'.');
    }

    public function cancel(LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->user_id !== Auth::id() && ! $this->canApprove()) {
            return back()->withErrors(['error' => 'You can only cancel your own leave requests.']);
        }

        if ($leaveRequest->status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending requests can be cancelled.']);
        }

        $leaveRequest->update(['status' => 'cancelled']);

        return back()->with('success', 'Leave request cancelled.');
    }
}
