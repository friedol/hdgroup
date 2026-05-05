<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Category;
use App\Models\ProductManagement;
use App\Models\ProductManagementImage;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Support\Str;

class SampleProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $branches = Branch::where('is_active', true)->get();
        
        $categories = Category::all();
        if ($categories->isEmpty()) {
            $categories = collect([
                Category::create(['category_name' => 'Home Appliances']),
                Category::create(['category_name' => 'Computing']),
                Category::create(['category_name' => 'Fashion']),
            ]);
        }

        $sampleData = [
            [
                'name' => 'Premium Gaming Laptop 15"',
                'description' => 'High performance gaming laptop with dedicated GPU and RGB keyboard.',
                'price' => 1500000,
                'buying_price' => 1200000,
                'image' => 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'name' => 'Wireless Noise-Canceling Headphones',
                'description' => 'Over-ear headphones with premium sound quality and active noise cancellation.',
                'price' => 350000,
                'buying_price' => 280000,
                'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'name' => 'Smart Fitness Watch Pro',
                'description' => 'Track your health, workouts, and receive notifications on your wrist.',
                'price' => 120000,
                'buying_price' => 85000,
                'image' => 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'name' => '4K Ultra HD Smart TV',
                'description' => 'Enjoy cinematic viewing experience with vivid colors and smart apps.',
                'price' => 850000,
                'buying_price' => 700000,
                'image' => 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'name' => 'Ergonomic Office Chair',
                'description' => 'Comfortable chair designed for long hours of productive work.',
                'price' => 45000,
                'buying_price' => 30000,
                'image' => 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'name' => 'Mechanical Keyboard RGB',
                'description' => 'Tactile mechanical switches perfect for gaming and typing.',
                'price' => 85000,
                'buying_price' => 60000,
                'image' => 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
            ]
        ];

        foreach ($branches as $branch) {
            foreach ($sampleData as $index => $data) {
                // Pick a random category
                $category = $categories->random();

                // 1) Create ProductManagement
                $pm = ProductManagement::create([
                    'product_name' => $data['name'],
                    'product_type' => 'Trading',
                    'sku' => strtoupper(Str::random(6)),
                    'brand' => 'Generic',
                    'unit_id' => 1,
                    'unit_name' => 'Piece',
                    'unit_description' => '1 Piece',
                    'product_price' => $data['price'],
                    'unit_price' => $data['price'],
                    'buying_price' => $data['buying_price'],
                    'description' => $data['description'],
                    'category_id' => $category->id,
                    'category_name' => $category->category_name,
                    'is_enabled' => true,
                    'is_featured' => ($index < 2),
                    'branch_id' => $branch->id,
                ]);

                // 2) Create Product
                $product = Product::create([
                    'product_id' => 'PRD' . mt_rand(10000, 99999),
                    'product_management_id' => $pm->id,
                    'product_name' => $pm->product_name,
                    'product_type' => 'Trading',
                    'product_price' => $data['price'],
                    'unit_price' => $data['price'],
                    'buying_price' => $data['buying_price'],
                    'is_enabled' => true,
                    'branch_id' => $branch->id,
                ]);

                // 3) Create ProductManagementImage
                ProductManagementImage::create([
                    'product_management_id' => $pm->id,
                    'product_id' => $product->id,
                    'image_path' => $data['image'],
                    'is_featured' => true,
                ]);

                // 4) Add Inventory (random quantity 10-50)
                Inventory::create([
                    'product_type' => 'finished_product',
                    'product_id' => $product->id,
                    'qty' => mt_rand(10, 50),
                    'branch_id' => $branch->id,
                    'store_id' => 1,
                ]);
            }
        }
    }
}
