<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Branch;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class CleanRBACSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Wipe everything
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        User::truncate();
        Role::truncate();
        Permission::truncate();
        DB::table('role_permissions')->truncate();
        DB::table('user_roles')->truncate();
        DB::table('user_permissions')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Seed Permissions
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
            Permission::create($p);
        }

        // 3. Define Roles
        $rolesData = [
            'CEO' => ['scope' => 'global', 'perms' => '*'],
            'General Manager' => ['scope' => 'global', 'perms' => Permission::pluck('slug')->toArray()],
            'Accountant Manager' => ['scope' => 'global', 'perms' => ['dashboard.view', 'dashboard.global', 'finance.view', 'finance.reports', 'finance.loans', 'finance.expenses', 'production.view']],
            'Branch Manager' => ['scope' => 'branch', 'perms' => ['dashboard.view', 'pos.access', 'pos.create', 'pos.returns', 'inventory.view', 'inventory.manage', 'inventory.transfer', 'inventory.adjust', 'finance.view', 'production.view', 'production.create', 'production.manage_bom', 'users.view']],
            'Branch Accountant' => ['scope' => 'branch', 'perms' => ['dashboard.view', 'finance.view', 'finance.reports', 'finance.expenses', 'finance.loans', 'pos.access']],
            'Storekeeper' => ['scope' => 'branch', 'perms' => ['dashboard.view', 'inventory.view', 'inventory.manage', 'inventory.transfer', 'inventory.adjust', 'production.view']],
            'Seller' => ['scope' => 'branch', 'perms' => ['dashboard.view', 'pos.access', 'pos.create', 'pos.returns']],
            'Delivery' => ['scope' => 'branch', 'perms' => ['dashboard.view', 'logistics.deliveries', 'logistics.update_status']],
            'Staff' => ['scope' => 'branch', 'perms' => []],
        ];

        $i = 1;
        $roleMap = [];
        foreach ($rolesData as $name => $data) {
            $role = Role::create([
                'role_id' => $i++,
                'role_name' => $name,
                'scope_type' => $data['scope'],
            ]);
            $roleMap[$name] = $role;

            if ($data['perms'] === '*') {
                $role->permissions()->attach(Permission::all());
            } elseif (!empty($data['perms'])) {
                $pIds = Permission::whereIn('slug', $data['perms'])->pluck('id');
                $role->permissions()->attach($pIds);
            }
        }

        // 4. Create CEO User
        $ceoUser = User::create([
            'staff_id' => 'CEO-001',
            'staff_name' => 'System CEO',
            'username' => 'ceo',
            'staff_email' => 'ceo@hdgroup.com',
            'staff_phone' => '0711000000',
            'password' => 'password',
            'role_id' => $roleMap['CEO']->role_id,
            'is_global' => true,
        ]);
        $ceoUser->roles()->attach($roleMap['CEO']->id);

        // 5. Create users for each branch
        $branches = Branch::all();
        $phoneCounter = 711000001;
        foreach ($branches as $branch) {
            $branchSlug = strtolower(str_replace(' ', '_', $branch->name));
            
            foreach ($rolesData as $roleName => $data) {
                if ($data['scope'] === 'global' && $roleName !== 'CEO') continue; 
                if ($roleName === 'CEO') continue; 

                $email = strtolower(str_replace(' ', '', $roleName)) . '@' . $branchSlug . '.com';
                
                $user = User::create([
                    'staff_id' => strtoupper(substr($roleName, 0, 2)) . '-' . $branch->id . '-' . rand(100, 999),
                    'staff_name' => $roleName . ' - ' . $branch->name,
                    'username' => strtolower(substr($roleName, 0, 3)) . '_' . $branchSlug . '_' . rand(1, 99),
                    'staff_email' => $email,
                    'staff_phone' => '0' . $phoneCounter++,
                    'password' => 'password',
                    'branch_id' => $branch->id,
                    'role_id' => $roleMap[$roleName]->role_id,
                ]);
                $user->roles()->attach($roleMap[$roleName]->id);
            }
        }

        // Add developer specifically
        $dev = User::create([
            'staff_id' => 'DEV-001',
            'staff_name' => 'Arfath Jupo',
            'username' => 'developer',
            'staff_email' => 'developer@gmail.com',
            'staff_phone' => '0711999999',
            'password' => 'password',
            'role_id' => $roleMap['CEO']->role_id,
            'is_global' => true,
        ]);
        $dev->roles()->attach($roleMap['CEO']->id);
    }
}
