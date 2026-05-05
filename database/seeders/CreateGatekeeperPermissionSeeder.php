<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class CreateGatekeeperPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            [
                'name' => 'View Gatekeeper Logs',
                'slug' => 'gatekeeper.access',
                'module' => 'Gatekeeper',
                'action' => 'view',
            ],
            [
                'name' => 'Record Product IN',
                'slug' => 'gatekeeper.record-in',
                'module' => 'Gatekeeper',
                'action' => 'record_in',
            ],
            [
                'name' => 'Record Product OUT',
                'slug' => 'gatekeeper.record-out',
                'module' => 'Gatekeeper',
                'action' => 'record_out',
            ],
            [
                'name' => 'Edit Gatekeeper Log',
                'slug' => 'gatekeeper.edit',
                'module' => 'Gatekeeper',
                'action' => 'edit',
            ],
            [
                'name' => 'Delete Gatekeeper Log',
                'slug' => 'gatekeeper.delete',
                'module' => 'Gatekeeper',
                'action' => 'delete',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        echo "Gatekeeper permissions created successfully!\n";
    }
}
