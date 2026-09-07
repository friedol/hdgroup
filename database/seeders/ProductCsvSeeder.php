<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductManagement;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductCsvSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::where('name', 'Hardware')->first();

        if (! $branch) {
            $this->command->error('Hardware branch not found.');

            return;
        }

        $csvPath = public_path('products.csv');
        if (! file_exists($csvPath)) {
            $this->command->error('products.csv not found in public/');

            return;
        }

        // Build old CSV category_id → new DB category (for Hardware branch)
        $csvCategoryMap = $this->buildCategoryMap($branch->id);

        // Fallback category for products with no CSV category_id
        $fallback = Category::firstOrCreate(
            ['category_name' => 'Uncategorized', 'branch_id' => $branch->id]
        );

        // Wipe existing products for this branch to avoid duplicates on re-run
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $existingProductIds = Product::where('branch_id', $branch->id)->pluck('id');
        Inventory::whereIn('product_id', $existingProductIds)->delete();
        Product::where('branch_id', $branch->id)->delete();
        ProductManagement::where('branch_id', $branch->id)->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Build unit name → id map, creating missing units on the fly
        $unitCache = Unit::pluck('id', 'unit_name')->toArray();
        $resolveUnit = function (string $name) use (&$unitCache): int {
            $key = strtolower(trim($name));
            foreach ($unitCache as $uName => $uId) {
                if (strtolower($uName) === $key) {
                    return $uId;
                }
            }
            $unit = Unit::create(['unit_name' => ucfirst($key), 'symbol' => $key]);
            $unitCache[$unit->unit_name] = $unit->id;

            return $unit->id;
        };

        $handle = fopen($csvPath, 'r');
        $header = fgetcsv($handle);
        $col = array_flip($header);

        $seeded = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $get = fn (string $key) => isset($col[$key]) ? (trim($row[$col[$key]]) ?: null) : null;

            $productName = $get('name');
            if (! $productName) {
                continue;
            }

            // Resolve category — fall back to "Uncategorized" when CSV has no category
            $csvCatId = $get('category_id');
            $categoryId = $csvCategoryMap[$csvCatId]['id'] ?? $fallback->id;
            $categoryName = $csvCategoryMap[$csvCatId]['name'] ?? $fallback->category_name;

            $buyingPrice = (float) ($get('buying_price') ?? 0);
            $costPrice = (float) ($get('cost_price') ?? 0);
            $sellingPrice = (float) ($get('wholesale_price') ?: $buyingPrice);
            $qty = (float) ($get('quantity_in_stock') ?? 0);

            $specifications = null;
            $specsRaw = $get('specifications');
            if ($specsRaw) {
                $decoded = json_decode($specsRaw, true);
                $specifications = is_array($decoded) ? json_encode($decoded) : null;
            }

            $baseUnit = $get('base_unit') ?? 'piece';
            $unitId = $resolveUnit($baseUnit);

            // 1. ProductManagement
            $pm = ProductManagement::create([
                'product_name' => $productName,
                'product_type' => 'Trading',
                'sku' => $get('sku') ?? strtoupper(Str::random(8)),
                'barcode' => $get('barcode'),
                'brand' => $get('brand'),
                'description' => $get('description'),
                'category_id' => $categoryId,
                'category_name' => $categoryName,
                'buying_price' => $buyingPrice,
                'cost_per_base_unit' => $costPrice ?: $buyingPrice,
                'product_price' => $sellingPrice,
                'unit_price' => $sellingPrice,
                'unit_id' => $unitId,
                'unit_name' => $baseUnit,
                'unit_description' => $baseUnit,
                'qty_in_buying_unit' => (float) ($get('buying_unit_quantity') ?? 1),
                'reorder_point' => (float) ($get('reorder_point') ?? 0),
                'low_stock_threshold' => (float) ($get('low_stock_threshold') ?? 0),
                'material' => $get('material'),
                'weight' => $get('weight') ? (float) $get('weight') : null,
                'weight_unit' => $get('weight_unit'),
                'length' => $get('length') ? (float) $get('length') : null,
                'width' => $get('width') ? (float) $get('width') : null,
                'height' => $get('height') ? (float) $get('height') : null,
                'dimension_unit' => $get('dimension_unit'),
                'volume' => $get('volume') ? (float) $get('volume') : null,
                'volume_unit' => $get('volume_unit'),
                'specifications' => $specifications,
                'image_1' => $get('image1'),
                'image_2' => $get('image2'),
                'image_3' => $get('image3'),
                'image_4' => $get('image4'),
                'image_5' => $get('image5'),
                'is_enabled' => (bool) ($get('is_active') ?? 1),
                'is_featured' => (bool) ($get('is_featured') ?? 0),
                'is_public' => (bool) ($get('is_public') ?? 1),
                'branch_id' => $branch->id,
            ]);

            // 2. Product
            $product = Product::create([
                'product_id' => 'PRD'.str_pad($pm->id, 6, '0', STR_PAD_LEFT),
                'product_management_id' => $pm->id,
                'product_name' => $productName,
                'product_type' => 'Trading',
                'product_price' => $sellingPrice,
                'unit_price' => $sellingPrice,
                'buying_price' => $buyingPrice,
                'reorder_point' => (float) ($get('reorder_point') ?? 0),
                'is_enabled' => (bool) ($get('is_active') ?? 1),
                'branch_id' => $branch->id,
            ]);

            // 3. Inventory
            Inventory::create([
                'product_type' => 'finished_product',
                'product_id' => $product->id,
                'qty' => $qty,
                'branch_id' => $branch->id,
                'store_id' => 1,
            ]);

            $seeded++;
        }

        fclose($handle);

        $this->command->info("Seeded {$seeded} products to the Hardware branch.");
    }

    private function buildCategoryMap(int $branchId): array
    {
        // Load CSV categories: old id → name
        $csvCategories = [];
        $handle = fopen(public_path('categories.csv'), 'r');
        $header = fgetcsv($handle);
        $col = array_flip($header);
        while (($row = fgetcsv($handle)) !== false) {
            $csvCategories[$row[$col['id']]] = $row[$col['name']];
        }
        fclose($handle);

        // Load branch categories from DB: name → {id, name}
        $dbCategories = Category::where('branch_id', $branchId)
            ->pluck('id', 'category_name')
            ->toArray();

        // Map old CSV id → DB {id, name}
        $map = [];
        foreach ($csvCategories as $csvId => $name) {
            if (isset($dbCategories[$name])) {
                $map[$csvId] = ['id' => $dbCategories[$name], 'name' => $name];
            }
        }

        return $map;
    }
}
