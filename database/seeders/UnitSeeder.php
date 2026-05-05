<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $units = [
            ['unit_name' => 'Kilogram', 'symbol' => 'kg'],
            ['unit_name' => 'Gram', 'symbol' => 'g'],
            ['unit_name' => 'Liter', 'symbol' => 'L'],
            ['unit_name' => 'Milliliter', 'symbol' => 'mL'],
            ['unit_name' => 'Meter', 'symbol' => 'm'],
            ['unit_name' => 'Centimeter', 'symbol' => 'cm'],
            ['unit_name' => 'Piece', 'symbol' => 'pc'],
            ['unit_name' => 'Pack', 'symbol' => 'pk'],
        ];

        DB::table('units')->insert($units);
    }
}
