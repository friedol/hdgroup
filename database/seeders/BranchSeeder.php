<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Branch::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Main Branch',
                'address' => 'HQ Address',
                'phone' => '0711000001',
                'email' => 'hq@hdgroup.com',
                'is_active' => true,
                'is_manufacturing_enabled' => true,
            ]
        );

        Branch::updateOrCreate(
            ['id' => 2],
            [
                'name' => 'HD TECH',
                'address' => 'Tech Park',
                'phone' => '0711000007',
                'email' => 'tech@hdgroup.com',
                'is_active' => true,
                'is_manufacturing_enabled' => true,
            ]
        );

        Branch::updateOrCreate(
            ['id' => 3],
            [
                'name' => 'HD PACKAGES',
                'address' => 'Industrial Area',
                'phone' => '0711000013',
                'email' => 'packages@hdgroup.com',
                'is_active' => true,
                'is_manufacturing_enabled' => true,
            ]
        );
    }
}
