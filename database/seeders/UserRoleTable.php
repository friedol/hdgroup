<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class UserRoleTable extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //

        Role::create(['role_id' => '1', 'role_name' => 'CEO', 'scope_type' => 'global']);
        Role::create(['role_id' => '2', 'role_name' => 'Admin', 'scope_type' => 'global']);
        Role::create(['role_id' => '3', 'role_name' => 'Staff-Legacy']); // Generic staff if needed
        Role::create(['role_id' => '4', 'role_name' => 'Branch Manager']);
        Role::create(['role_id' => '5', 'role_name' => 'Branch Accountant']);
        Role::create(['role_id' => '6', 'role_name' => 'Storekeeper']);
        Role::create(['role_id' => '7', 'role_name' => 'Seller']);
        Role::create(['role_id' => '8', 'role_name' => 'Delivery']);
        Role::create(['role_id' => '9', 'role_name' => 'Staff']);
    }
}
