<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        Category::create([
            'category_name' => 'Socks',
        ]);

        Category::create([
            'category_name' => 'Makufuli',
        ]);

        Category::create([
            'category_name' => 'Leso',
        ]);

        Category::create([
            'category_name' => 'Brush ',
        ]);

        Category::create([
            'category_name' => 'Tochi',
        ]);

        Category::create([
            'category_name' => 'Sumu za Mbu',
        ]);

        Category::create([
            'category_name' => 'Air fresh',
        ]);

        Category::create([
            'category_name' => 'Mikasi',
        ]);

    }
}
