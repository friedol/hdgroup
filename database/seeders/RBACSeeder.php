<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RBACSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Truncate Pivot Tables First
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\Role::truncate();
        \App\Models\Permission::truncate();
        \Illuminate\Support\Facades\DB::table('role_permissions')->truncate();
        \Illuminate\Support\Facades\DB::table('user_roles')->truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Define Permissions (Module, Name, Slug, Action)
        $perms = [
            // Dashboard
            ['module' => 'Dashboard', 'name' => 'View Dashboard', 'slug' => 'dashboard.view', 'action' => 'view'],
            ['module' => 'Dashboard', 'name' => 'Global Metrics Visibility', 'slug' => 'dashboard.global', 'action' => 'global'],

            // POS
            ['module' => 'POS', 'name' => 'Access POS Terminal', 'slug' => 'pos.access', 'action' => 'access'],
            ['module' => 'POS', 'name' => 'Create Sales', 'slug' => 'pos.create', 'action' => 'create'],
            ['module' => 'POS', 'name' => 'Process Returns', 'slug' => 'pos.returns', 'action' => 'returns'],

            // Inventory
            ['module' => 'Inventory', 'name' => 'View Inventory', 'slug' => 'inventory.view', 'action' => 'view'],
            ['module' => 'Inventory', 'name' => 'Manage Products', 'slug' => 'inventory.manage', 'action' => 'manage'],
            ['module' => 'Inventory', 'name' => 'Manage Transfers', 'slug' => 'inventory.transfer', 'action' => 'transfer'],
            ['module' => 'Inventory', 'name' => 'Stock Adjustments', 'slug' => 'inventory.adjust', 'action' => 'adjust'],

            // Finance
            ['module' => 'Finance', 'name' => 'View Financial Analytics', 'slug' => 'finance.view', 'action' => 'view'],
            ['module' => 'Finance', 'name' => 'Financial Reports', 'slug' => 'finance.reports', 'action' => 'reports'],
            ['module' => 'Finance', 'name' => 'Manage Expenses', 'slug' => 'finance.expenses', 'action' => 'expenses'],
            ['module' => 'Finance', 'name' => 'Manage Loans', 'slug' => 'finance.loans', 'action' => 'loans'],

            // Manufacturing
            ['module' => 'Manufacturing', 'name' => 'View Production', 'slug' => 'production.view', 'action' => 'view'],
            ['module' => 'Manufacturing', 'name' => 'Create Production', 'slug' => 'production.create', 'action' => 'create'],
            ['module' => 'Manufacturing', 'name' => 'Manage BOM', 'slug' => 'production.manage_bom', 'action' => 'manage_bom'],

            // User Management
            ['module' => 'Users', 'name' => 'View Staff', 'slug' => 'users.view', 'action' => 'view'],
            ['module' => 'Users', 'name' => 'Manage Permissions', 'slug' => 'users.manage', 'action' => 'manage'],

            // Logistics
            ['module' => 'Logistics', 'name' => 'View Deliveries', 'slug' => 'logistics.deliveries', 'action' => 'deliveries'],
            ['module' => 'Logistics', 'name' => 'Update Delivery Status', 'slug' => 'logistics.update_status', 'action' => 'update_status'],

            // System
            ['module' => 'System', 'name' => 'Access Settings', 'slug' => 'settings.access', 'action' => 'access'],
            ['module' => 'System', 'name' => 'Delete Settings/Logs', 'slug' => 'settings.delete', 'action' => 'delete'],
            ['module' => 'System', 'name' => 'Audit Logs Visibility', 'slug' => 'settings.logs', 'action' => 'logs'],
            ['module' => 'System', 'name' => 'Manage Branches', 'slug' => 'branches.manage', 'action' => 'manage'],
        ];

        foreach ($perms as $p) {
            \App\Models\Permission::create($p);
        }

        // 3. Define Roles
        $roles = [
            'CEO' => [
                'scope' => 'global',
                'perms' => '*', // All
            ],
            'General Manager' => [
                'scope' => 'global',
                'perms' => \App\Models\Permission::whereNotIn('slug', ['settings.delete'])->pluck('slug')->toArray(),
            ],
            'Accountant Manager' => [
                'scope' => 'global',
                'perms' => ['dashboard.view', 'dashboard.global', 'finance.view', 'finance.reports', 'finance.loans', 'finance.expenses', 'production.view'],
            ],
            'Branch Manager' => [
                'scope' => 'branch',
                'perms' => ['dashboard.view', 'pos.access', 'pos.create', 'pos.returns', 'inventory.view', 'inventory.manage', 'inventory.transfer', 'inventory.adjust', 'finance.view', 'production.view', 'production.create', 'production.manage_bom', 'users.view'],
            ],
            'Branch Accountant' => [
                'scope' => 'branch',
                'perms' => ['dashboard.view', 'finance.view', 'finance.reports', 'finance.expenses', 'finance.loans', 'pos.access'],
            ],
            'Storekeeper' => [
                'scope' => 'branch',
                'perms' => ['dashboard.view', 'inventory.view', 'inventory.manage', 'inventory.transfer', 'inventory.adjust', 'production.view'],
            ],
            'Seller' => [
                'scope' => 'branch',
                'perms' => ['dashboard.view', 'pos.access', 'pos.create', 'pos.returns'],
            ],
            'Delivery' => [
                'scope' => 'branch',
                'perms' => ['dashboard.view', 'logistics.deliveries', 'logistics.update_status'],
            ],
            'Staff' => [
                'scope' => 'branch',
                'perms' => [], // Configurable manually
            ],
        ];

        $i = 1;
        foreach ($roles as $name => $data) {
            $role = \App\Models\Role::create([
                'role_id' => $i++,
                'role_name' => $name,
                'scope_type' => $data['scope'],
            ]);

            if ($data['perms'] === '*') {
                $role->permissions()->attach(\App\Models\Permission::all());
            } elseif (!empty($data['perms'])) {
                $pIds = \App\Models\Permission::whereIn('slug', $data['perms'])->pluck('id');
                $role->permissions()->attach($pIds);
            }
        }

        // 4. Migrate Existing Users to Roles
        // For simplicity, we map old CEO/SuperAdmin role (usually id 1) to new CEO role
        $ceoRole = \App\Models\Role::where('role_name', 'CEO')->first();
        \App\Models\User::where('role_id', 1)->get()->each(function($user) use ($ceoRole) {
            $user->roles()->attach($ceoRole->id);
            $user->update(['is_global' => true]);
        });
        
        // Map developer specifically
        $dev = \App\Models\User::where('staff_email', 'developer@gmail.com')->first();
        if ($dev) {
            $dev->roles()->sync([$ceoRole->id]);
            $dev->update(['is_global' => true]);
        }
    }
}
