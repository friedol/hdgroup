<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        $query = Department::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('head_of_dep', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $departments = $query->latest()
            ->paginate($perPage)
            ->withQueryString();

        // Attach employee count for each department
        $departments->getCollection()->transform(function ($dep) {
            $dep->employee_count = User::where('department', $dep->name)->count();

            return $dep;
        });

        // Potential department heads (staff / users list for dropdown select)
        $staffMembers = User::select('id', 'name', 'staff_name', 'phone', 'email')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->staff_name ?: $u->name,
                    'phone' => $u->phone,
                    'email' => $u->email,
                ];
            });

        return Inertia::render('Staff/Departments/Index', [
            'departments' => $departments,
            'filters' => [
                'search' => $search,
                'per_page' => (int) $perPage,
            ],
            'staffMembers' => $staffMembers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'head_of_dep' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
        ]);

        Department::create($validated);

        return redirect()->back()->with('success', 'Department created successfully.');
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'head_of_dep' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
        ]);

        $department->update($validated);

        return redirect()->back()->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department)
    {
        $department->delete();

        return redirect()->back()->with('success', 'Department deleted successfully.');
    }
}
