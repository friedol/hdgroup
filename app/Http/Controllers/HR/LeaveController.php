<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\LeaveApplication;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status');

        $applications = LeaveApplication::with(['user:id,name,staff_name,employee_number,department', 'leaveType', 'approver:id,name,staff_name'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $leaveTypes = LeaveType::all();

        // Seed default leave types if empty
        if ($leaveTypes->isEmpty()) {
            LeaveType::create(['name' => 'Annual Leave', 'days_per_year' => 28, 'is_paid' => true]);
            LeaveType::create(['name' => 'Sick Leave', 'days_per_year' => 14, 'is_paid' => true]);
            LeaveType::create(['name' => 'Maternity Leave', 'days_per_year' => 84, 'is_paid' => true]);
            LeaveType::create(['name' => 'Paternity Leave', 'days_per_year' => 7, 'is_paid' => true]);
            LeaveType::create(['name' => 'Compassionate Leave', 'days_per_year' => 7, 'is_paid' => true]);
            $leaveTypes = LeaveType::all();
        }

        $metrics = [
            'pending' => LeaveApplication::where('status', 'pending')->count(),
            'approved' => LeaveApplication::where('status', 'approved')->count(),
            'rejected' => LeaveApplication::where('status', 'rejected')->count(),
            'total_types' => $leaveTypes->count(),
        ];

        $staffMembers = User::select('id', 'name', 'staff_name', 'employee_number')->get();

        return Inertia::render('Staff/Leave/Index', [
            'applications' => $applications,
            'leaveTypes' => $leaveTypes,
            'metrics' => $metrics,
            'staffMembers' => $staffMembers,
            'filters' => ['status' => $status],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string',
        ]);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);
        $totalDays = $end->diffInDays($start) + 1;

        LeaveApplication::create([
            'user_id' => $validated['user_id'],
            'leave_type_id' => $validated['leave_type_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'total_days' => $totalDays,
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Leave application submitted successfully.');
    }

    public function approve(Request $request, LeaveApplication $leave)
    {
        $leave->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'admin_remarks' => $request->input('admin_remarks', 'Approved'),
        ]);

        return redirect()->back()->with('success', 'Leave application approved.');
    }

    public function reject(Request $request, LeaveApplication $leave)
    {
        $leave->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'admin_remarks' => $request->input('admin_remarks', 'Rejected'),
        ]);

        return redirect()->back()->with('success', 'Leave application rejected.');
    }
}
