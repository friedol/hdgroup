<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class CrmPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            [
                'name' => 'View Customers',
                'slug' => 'customers.view',
                'module' => 'CRM',
            ],
            [
                'name' => 'Manage Customers',
                'slug' => 'customers.manage',
                'module' => 'CRM',
            ],
            [
                'name' => 'Delete Customers',
                'slug' => 'customers.delete',
                'module' => 'CRM',
            ],
            [
                'name' => 'View CRM Dashboard',
                'slug' => 'crm.dashboard',
                'module' => 'CRM',
            ],
            [
                'name' => 'Manage Follow-ups',
                'slug' => 'customers.follow_up',
                'module' => 'CRM',
            ],
            [
                'name' => 'View Daily Reports',
                'slug' => 'customers.daily_reports',
                'module' => 'CRM',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }
}
