<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $search = $request->input('search');

        $attendances = Attendance::with('user:id,name,staff_name,employee_number,department')
            ->whereDate('date', $date)
            ->when($search, function ($q) use ($search) {
                $q->whereHas('user', function ($u) use ($search) {
                    $u->where('staff_name', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->get();

        $metrics = [
            'total_staff' => User::count(),
            'present' => Attendance::whereDate('date', $date)->where('status', 'present')->count(),
            'late' => Attendance::whereDate('date', $date)->where('status', 'late')->count(),
            'absent' => Attendance::whereDate('date', $date)->where('status', 'absent')->count(),
        ];

        $staffMembers = User::select('id', 'name', 'staff_name', 'employee_number')->get();

        return Inertia::render('Staff/Attendance/Index', [
            'attendances' => $attendances,
            'metrics' => $metrics,
            'selectedDate' => $date,
            'filters' => ['search' => $search],
            'staffMembers' => $staffMembers,
        ]);
    }

    public function clockIn(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'clock_in' => 'required',
            'location' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $date = Carbon::today()->toDateString();

        Attendance::updateOrCreate(
            ['user_id' => $validated['user_id'], 'date' => $date],
            [
                'clock_in' => $validated['clock_in'],
                'clock_in_location' => $validated['location'] ?? 'Office HQ',
                'status' => 'present',
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return redirect()->back()->with('success', 'Clock-in recorded successfully.');
    }

    public function clockOut(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'clock_out' => 'required',
            'location' => 'nullable|string',
        ]);

        $clockIn = Carbon::parse($attendance->clock_in);
        $clockOut = Carbon::parse($validated['clock_out']);
        $workHours = round($clockOut->diffInMinutes($clockIn) / 60, 2);

        $attendance->update([
            'clock_out' => $validated['clock_out'],
            'clock_out_location' => $validated['location'] ?? 'Office HQ',
            'work_hours' => $workHours,
        ]);

        return redirect()->back()->with('success', 'Clock-out recorded successfully.');
    }
}
