<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PurchasesPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            [
                'id' => 'purchases.view',
                'name' => 'View Purchases',
                'description' => 'Can view purchases and purchase history',
            ],
            [
                'id' => 'purchases.create',
                'name' => 'Create Purchases',
                'description' => 'Can create new purchases and record items',
            ],
            [
                'id' => 'purchases.edit',
                'name' => 'Edit Purchases',
                'description' => 'Can edit existing purchases',
            ],
            [
                'id' => 'purchases.delete',
                'name' => 'Delete Purchases',
                'description' => 'Can delete purchases',
            ],
            [
                'id' => 'purchases.return',
                'name' => 'Return Purchases',
                'description' => 'Can process returns for purchased items',
            ],
            [
                'id' => 'products.update_prices',
                'name' => 'Update Product Prices',
                'description' => 'Can update buying/selling prices of products',
            ],
            [
                'id' => 'purchases.print',
                'name' => 'Print Purchase Reports',
                'description' => 'Can print purchase reports',
            ],
            [
                'id' => 'purchases.export',
                'name' => 'Export Purchase Reports',
                'description' => 'Can export purchase reports',
            ],
            [
                'id' => 'suppliers.manage',
                'name' => 'Manage Suppliers',
                'description' => 'Can manage suppliers',
            ],
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(
                ['id' => $perm['id']],
                [
                    'name' => $perm['name'],
                    'description' => $perm['description'],
                ]
            );
        }

        // Attach to Admin role (ID 1)
        $adminRole = Role::find(1);
        if ($adminRole) {
            $adminRole->permissions()->syncWithoutDetaching(collect($permissions)->pluck('id')->toArray());
        }
    }
}
