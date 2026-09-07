<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call(ContainerSeeder::class);

        $this->call(BranchSeeder::class);
        $this->call(UserRoleTable::class);

        $this->call(CategorySeeder::class);
        $this->call([
            PermissionSeeder::class,
            PurchasesPermissionSeeder::class,
            CreateDeliveryPermissionSeeder::class,
        ]);
        $this->call(UnitSeeder::class);
        $this->call(ImportUsersSeeder::class);

    }
}
