<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Category::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $csvPath = public_path('categories.csv');

        if (! file_exists($csvPath)) {
            $this->command->error('categories.csv not found in public/');

            return;
        }

        $handle = fopen($csvPath, 'r');
        $header = fgetcsv($handle); // skip header row
        $nameIndex = array_search('name', $header);

        $names = [];
        while (($row = fgetcsv($handle)) !== false) {
            $name = trim($row[$nameIndex] ?? '');
            if ($name !== '') {
                $names[$name] = true;
            }
        }
        fclose($handle);

        $uniqueNames = array_keys($names);
        $branches = Branch::all();

        if ($branches->isEmpty()) {
            $this->command->warn('No branches found. Categories not seeded.');

            return;
        }

        $now = now();
        foreach ($branches as $branch) {
            $rows = array_map(fn ($name) => [
                'category_name' => $name,
                'branch_id' => $branch->id,
                'created_at' => $now,
                'updated_at' => $now,
            ], $uniqueNames);

            // Insert in chunks to avoid query size limits
            foreach (array_chunk($rows, 100) as $chunk) {
                Category::insert($chunk);
            }
        }

        $this->command->info(
            count($uniqueNames).' categories seeded for '.$branches->count().' branches ('.
            (count($uniqueNames) * $branches->count()).' total rows).'
        );
    }
}
