<?php

namespace App\Http\Controllers;

use App\Models\EmployeeContract;
use App\Models\EmployeeProfile;
use App\Models\SalaryRevision;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = EmployeeProfile::with('user.roles')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (EmployeeProfile $profile) {
                return array_merge($profile->toArray(), [
                    'name' => $profile->user->name,
                    'email' => $profile->user->email,
                    'phone' => $profile->user->phone,
                    'role' => $profile->user->getRoleNames()->first(),
                ]);
            });

        $departments = EmployeeProfile::whereNotNull('department')
            ->distinct()
            ->pluck('department');

        return Inertia::render('HR/Employees/Index', [
            'employees' => $employees,
            'departments' => $departments,
            'roles' => [
                'CEO', 'HR', 'Workshop Manager', 'CRM Officer', 'Technician',
                'Finance', 'Procurement', 'Store', 'Workshop Supervisor', 'Marketing',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
            'employee_number' => 'required|string|max:50|unique:employee_profiles',
            'department' => 'nullable|string|max:100',
            'position' => 'nullable|string|max:100',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
            'hire_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'national_id' => 'nullable|string|max:50',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:255',
            'tin' => 'nullable|string|max:50',
            'nssf_number' => 'nullable|string|max:50',
            'photo' => 'nullable|image|max:2048',
        ]);

        if (auth()->user()->hasRole('HR') && $validated['role'] === 'CEO') {
            return back()->withErrors(['role' => 'HR cannot assign the CEO role.']);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);
        $user->assignRole($validated['role']);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('hr/employee-photos', 'public');
        }

        EmployeeProfile::create([
            'user_id' => $user->id,
            'employee_number' => $validated['employee_number'],
            'department' => $validated['department'] ?? null,
            'position' => $validated['position'] ?? null,
            'employment_type' => $validated['employment_type'],
            'hire_date' => $validated['hire_date'] ?? null,
            'basic_salary' => $validated['basic_salary'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'tin' => $validated['tin'] ?? null,
            'nssf_number' => $validated['nssf_number'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'address' => $validated['address'] ?? null,
            'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'bank_account_name' => $validated['bank_account_name'] ?? null,
            'photo_path' => $photoPath,
        ]);

        return back()->with('success', 'Employee added successfully.');
    }

    public function update(Request $request, EmployeeProfile $employeeProfile)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($employeeProfile->user_id)],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($employeeProfile->user_id)],
            'role' => 'required|string|exists:roles,name',
            'employee_number' => ['required', 'string', 'max:50', Rule::unique('employee_profiles')->ignore($employeeProfile->id)],
            'department' => 'nullable|string|max:100',
            'position' => 'nullable|string|max:100',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
            'status' => 'required|in:probation,active,on_leave,terminated',
            'hire_date' => 'nullable|date',
            'termination_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'national_id' => 'nullable|string|max:50',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:255',
            'tin' => 'nullable|string|max:50',
            'nssf_number' => 'nullable|string|max:50',
            'photo' => 'nullable|image|max:2048',
        ]);

        $user = $employeeProfile->user;

        if (auth()->user()->hasRole('HR') && ($user->hasRole('CEO') || $validated['role'] === 'CEO')) {
            return back()->withErrors(['error' => 'HR cannot modify CEO accounts or assign the CEO role.']);
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ]);
        $user->syncRoles($validated['role']);

        if ($request->hasFile('photo')) {
            $validated['photo_path'] = $request->file('photo')->store('hr/employee-photos', 'public');
        }

        $employeeProfile->update(collect($validated)
            ->only([
                'employee_number', 'department', 'position', 'employment_type', 'status',
                'hire_date', 'termination_date', 'basic_salary', 'national_id', 'tin', 'nssf_number', 'date_of_birth',
                'gender', 'address', 'emergency_contact_name', 'emergency_contact_phone',
                'bank_name', 'bank_account_number', 'bank_account_name', 'photo_path',
            ])
            ->toArray());

        return back()->with('success', 'Employee updated successfully.');
    }

    public function destroy(EmployeeProfile $employeeProfile)
    {
        if (auth()->user()->hasRole('HR') && $employeeProfile->user->hasRole('CEO')) {
            return back()->withErrors(['error' => 'HR cannot remove CEO accounts.']);
        }

        $employeeProfile->update([
            'status' => 'terminated',
            'termination_date' => now(),
        ]);
        $employeeProfile->delete();

        return back()->with('success', 'Employee removed successfully.');
    }

    /**
     * Confirm a probationary employee into permanent status (step 20 of the
     * recruitment process — Confirmation of Employment).
     */
    public function confirmEmployment(EmployeeProfile $employeeProfile)
    {
        if ($employeeProfile->status !== 'probation') {
            return back()->withErrors(['error' => 'Only employees currently on probation can be confirmed.']);
        }

        $employeeProfile->update([
            'status' => 'active',
            'confirmed_at' => now(),
        ]);

        EmployeeContract::where('user_id', $employeeProfile->user_id)
            ->where('contract_type', 'probation')
            ->where('status', 'active')
            ->latest('start_date')
            ->first()
            ?->update([
                'contract_type' => 'permanent',
                'end_date' => null,
            ]);

        return back()->with('success', 'Employment confirmed. '.$employeeProfile->user->name.' is now a permanent employee.');
    }

    public function salaryHistory(EmployeeProfile $employeeProfile)
    {
        $revisions = SalaryRevision::with('approvedBy')
            ->where('user_id', $employeeProfile->user_id)
            ->orderByDesc('effective_date')
            ->get();

        $payrollHistory = $employeeProfile->user->payrollRecords()
            ->orderBy('payroll_period')
            ->get(['payroll_period', 'net_salary']);

        return response()->json([
            'revisions' => $revisions,
            'payroll_history' => $payrollHistory,
        ]);
    }

    public function storeSalaryRevision(Request $request, EmployeeProfile $employeeProfile)
    {
        $validated = $request->validate([
            'new_salary' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
        ]);

        SalaryRevision::create([
            'user_id' => $employeeProfile->user_id,
            'previous_salary' => $employeeProfile->basic_salary,
            'new_salary' => $validated['new_salary'],
            'effective_date' => $validated['effective_date'],
            'reason' => $validated['reason'] ?? null,
            'approved_by' => Auth::id(),
        ]);

        $employeeProfile->update(['basic_salary' => $validated['new_salary']]);

        return back()->with('success', 'Salary revision recorded.');
    }
}
