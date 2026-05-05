<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HumanResourceController extends Controller
{
    public function payrollDashboard()
    {
        return \Inertia\Inertia::render('Admin/Hr/Payroll');
    }

    public function getPayrollSummary(Request $request)
    {
        $date = Carbon::now();
        $month = $request->get('month', $date->month);
        $year = $request->get('year', $date->year);

        // All active staff eligible for payroll (non-admins)
        $eligibleStaff = User::whereHas('role', function($q) {
                $q->whereNotIn('role_name', ['CEO', 'SuperAdmin', 'Admin']);
            })
            ->whereNotNull('salary')
            ->where('salary', '>', 0)
            ->get();

        $totalLiability = $eligibleStaff->sum('salary');
        
        // Actual payments made this month
        $actualPayments = \App\Models\Expense::where('category', 'Salary')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        $totalPaid = $actualPayments->sum('amount');
        $staffPaidCount = $actualPayments->unique('user_id')->count();
        $staffCount = $eligibleStaff->count();

        $departmentBreakdown = $eligibleStaff->groupBy(function($item) {
            return $item->branch->name ?? 'Global';
        })->map(function ($group) {
            return [
                'count' => $group->count(),
                'total' => $group->sum('salary'),
                'avg' => $group->avg('salary')
            ];
        });

        // Historical data for charts
        $recentPayouts = \App\Models\Expense::where('category', 'Salary')
            ->selectRaw('DATE_FORMAT(date, "%Y-%m") as month_year, SUM(amount) as total, COUNT(DISTINCT user_id) as count')
            ->groupBy('month_year')
            ->orderBy('month_year', 'desc')
            ->take(6)
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->month_year . "-01")->format('Y-m-d'),
                    'amount' => (float)$item->total,
                    'status' => 'Paid'
                ];
            });

        return response()->json([
            'total_payroll' => $totalLiability,
            'total_paid' => $totalPaid,
            'staff_count' => $staffCount,
            'staff_paid_count' => $staffPaidCount,
            'average_salary' => $staffCount > 0 ? $totalLiability / $staffCount : 0,
            'department_breakdown' => $departmentBreakdown,
            'recent_payouts' => $recentPayouts
        ]);
    }

    public function getStaffList()
    {
        $users = User::with(['role', 'branch'])
            ->whereHas('role', function($q) {
                $q->whereNotIn('role_name', ['CEO', 'SuperAdmin', 'Admin']);
            })
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'staff_id' => $user->staff_id,
                    'staff_name' => $user->staff_name,
                    'role_name' => $user->role->role_name ?? 'N/A',
                    'branch_name' => $user->branch->name ?? 'Global',
                    'salary' => $user->salary,
                ];
            });
            
        return response()->json($users);
    }

    public function processPayout(Request $request)
    {
        $admin = auth()->user();
        $date = Carbon::now();
        $monthName = $date->format('F Y');

        // Get all staff with salaries who haven't been paid this month
        $staffToPay = User::whereHas('role', function($q) {
                $q->whereNotIn('role_name', ['CEO', 'SuperAdmin', 'Admin']);
            })
            ->whereNotNull('salary')
            ->where('salary', '>', 0)
            ->get();

        $processedCount = 0;
        $totalAmount = 0;

        DB::beginTransaction();
        try {
            foreach ($staffToPay as $employee) {
                // Check if already paid this month
                $alreadyPaid = \App\Models\Expense::where('user_id', $employee->id)
                    ->where('category', 'Salary')
                    ->whereMonth('date', $date->month)
                    ->whereYear('date', $date->year)
                    ->exists();

                if (!$alreadyPaid) {
                    \App\Models\Expense::create([
                        'date' => $date->format('Y-m-d'),
                        'amount' => $employee->salary,
                        'category' => 'Salary',
                        'payment_method' => 'Cash', // Default
                        'description' => "Monthly salary for {$employee->staff_name} - {$monthName}",
                        'status' => 'Paid',
                        'user_id' => $employee->id,
                        'branch_id' => $employee->branch_id ?? $admin->branch_id,
                    ]);
                    $processedCount++;
                    $totalAmount += $employee->salary;
                }
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully processed payroll for {$processedCount} staff members.",
                'total_amount' => $totalAmount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error processing payroll: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateSalary(Request $request, $id)
    {
        $request->validate([
            'salary' => 'required|numeric|min:0'
        ]);

        $user = User::findOrFail($id);
        $user->salary = $request->salary;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Salary updated for {$user->staff_name}"
        ]);
    }
}
