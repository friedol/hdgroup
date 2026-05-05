<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

class CreateDeliveryPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permission if it doesn't exist
        $permission = Permission::firstOrCreate(
            ['slug' => 'logistics.deliveries'],
            ['name' => 'Logistics - Delivery Management']
        );

        // Assign to admin role
        $adminRole = Role::firstWhere('name', 'Admin');
        if ($adminRole && !$adminRole->permissions()->where('slug', 'logistics.deliveries')->exists()) {
            $adminRole->permissions()->attach($permission->id);
        }

        // Assign to manager role if it exists
        $managerRole = Role::firstWhere('name', 'Manager');
        if ($managerRole && !$managerRole->permissions()->where('slug', 'logistics.deliveries')->exists()) {
            $managerRole->permissions()->attach($permission->id);
        }

        // Give permission directly to any admin users
        User::whereHas('roles', function ($q) {
            $q->where('name', 'Admin');
        })->each(function ($user) use ($permission) {
            if (!$user->permissions()->where('slug', 'logistics.deliveries')->exists()) {
                $user->permissions()->attach($permission->id);
            }
        });
    }
}

