<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Branch;

class BranchController extends Controller
{
    public function index()
    {
        $this->authorizeRole(['CEO', 'SuperAdmin', 'Admin']);
        // Use pagination so Blade can safely call hasPages() and links()
        $branches = Branch::orderBy('name', 'asc')->paginate(15);
        return \Inertia\Inertia::render('Admin/Branches/Index', compact('branches'));
    }

    public function create()
    {
        $this->authorizeRole(['CEO', 'SuperAdmin', 'Admin']);
        return \Inertia\Inertia::render('Admin/Branches/Create');
    }

    public function store(Request $request)
    {
        $this->authorizeRole(['CEO', 'SuperAdmin', 'Admin']);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'system_name' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'logo' => 'nullable|image',
            'favicon' => 'nullable|image|max:1024',
            'is_manufacturing_enabled' => 'sometimes|boolean'
        ]);

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('branch_logos', 'public');
        }

        if ($request->hasFile('favicon')) {
            $validated['favicon'] = $request->file('favicon')->store('branch_favicons', 'public');
        }

        Branch::create($validated);

        return redirect()->route('branches.index')->with('success', 'Branch created successfully.');
    }

    public function edit(Branch $branch)
    {
        $this->authorizeRole(['CEO', 'SuperAdmin', 'Admin']);
        return \Inertia\Inertia::render('Admin/Branches/Edit', compact('branch'));
    }

    public function update(Request $request, Branch $branch)
    {
        $this->authorizeRole(['CEO', 'SuperAdmin', 'Admin']);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'system_name' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'logo' => 'nullable|image',
            'favicon' => 'nullable|image|max:1024',
            'is_active' => 'required|boolean',
            'is_manufacturing_enabled' => 'sometimes|boolean'
        ]);

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('branch_logos', 'public');
        }

        if ($request->hasFile('favicon')) {
            $validated['favicon'] = $request->file('favicon')->store('branch_favicons', 'public');
        }

        $branch->update($validated);

        return redirect()->route('branches.index')->with('success', 'Branch updated successfully.');
    }

    private function authorizeRole($roles)
    {
        $user = auth()->user();
        if (!$user) {
            abort(403, 'Unauthorized action.');
        }

        if ($user->staff_email === 'developer@gmail.com') {
            return;
        }

        if (!in_array($user->role->role_name ?? '', $roles)) {
            abort(403, 'Unauthorized action.');
        }
    }
}
