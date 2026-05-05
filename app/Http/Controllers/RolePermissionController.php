<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('permissions', 'users')->orderBy('role_name')->get();
        $permissions = Permission::orderBy('module')->orderBy('name')->get()->groupBy('module');

        return \Inertia\Inertia::render('Admin/RolesPermissions/Index', compact('roles', 'permissions'));
    }

    public function roleCreate()
    {
        $permissions = Permission::orderBy('module')->orderBy('name')->get()->groupBy('module');

        return \Inertia\Inertia::render('Admin/RolesPermissions/RoleCreate', compact('permissions'));
    }

    public function roleStore(Request $request)
    {
        $validated = $request->validate([
            'role_name' => 'required|string|max:100',
            'scope_type' => 'required|in:global,branch',
        ]);

        $validated['role_id'] = (Role::max('role_id') ?? 0) + 1;
        $role = Role::create($validated);

        $role->permissions()->sync($request->input('permissions', []));

        return redirect()->route('roles-permissions.index')->with('success', 'Role created successfully.');
    }

    public function roleEdit(Role $role)
    {
        $role->load('permissions');
        $permissions = Permission::orderBy('module')->orderBy('name')->get()->groupBy('module');
        $rolePermissionIds = $role->permissions->pluck('id')->toArray();

        return \Inertia\Inertia::render('Admin/RolesPermissions/RoleEdit', compact('role', 'permissions', 'rolePermissionIds'));
    }

    public function roleUpdate(Request $request, Role $role)
    {
        $validated = $request->validate([
            'role_name' => 'required|string|max:100',
            'scope_type' => 'required|in:global,branch',
        ]);

        $role->update($validated);
        $role->permissions()->sync($request->input('permissions', []));

        return redirect()->route('roles-permissions.index')->with('success', 'Role updated successfully.');
    }

    public function roleDestroy(Role $role)
    {
        $primaryCount = \App\Models\User::where('role_id', $role->id)->count();
        $pivotCount = $role->users()->count();
        if ($primaryCount > 0 || $pivotCount > 0) {
            return redirect()->route('roles-permissions.index')->with('error', 'Cannot delete role that is assigned to users. Reassign or remove users first.');
        }
        $role->permissions()->detach();
        $role->delete();

        return redirect()->route('roles-permissions.index')->with('success', 'Role deleted successfully.');
    }

    public function permissionCreate()
    {
        return \Inertia\Inertia::render('Admin/RolesPermissions/PermissionCreate');
    }

    public function permissionStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:permissions,slug',
            'module' => 'required|string|max:80',
            'action' => 'nullable|string|max:50',
        ]);

        Permission::create($validated);

        return redirect()->route('roles-permissions.index')->with('success', 'Permission created successfully.');
    }

    public function permissionEdit(Permission $permission)
    {
        return \Inertia\Inertia::render('Admin/RolesPermissions/PermissionEdit', compact('permission'));
    }

    public function permissionUpdate(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:permissions,slug,' . $permission->id,
            'module' => 'required|string|max:80',
            'action' => 'nullable|string|max:50',
        ]);

        $permission->update($validated);

        return redirect()->route('roles-permissions.index')->with('success', 'Permission updated successfully.');
    }

    public function permissionDestroy(Permission $permission)
    {
        $permission->roles()->detach();
        $permission->users()->detach();
        $permission->delete();

        return redirect()->route('roles-permissions.index')->with('success', 'Permission deleted successfully.');
    }
}
