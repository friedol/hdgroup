<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductionBenchmark;

class ProductionBenchmarkSeeder extends Seeder
{
    public function run()
    {
        ProductionBenchmark::truncate();

        $benchmarks = [
            // Loophands - Turned (A3, A4, A2)
            ['name' => 'A3 Loop (Turned)', 'type' => 'Loophands', 'width' => 35, 'length' => 45, 'target' => 1000, 'req_roller' => 104, 'is_active' => true],
            ['name' => 'A3 Loop (Unturned)', 'type' => 'Loophands', 'width' => 45, 'length' => 40, 'target' => 1000, 'req_roller' => 104, 'is_active' => true],
            
            ['name' => 'A4 Loop (Turned)', 'type' => 'Loophands', 'width' => 30, 'length' => 35, 'target' => 1200, 'req_roller' => 80, 'is_active' => true],
            ['name' => 'A4 Loop (Unturned)', 'type' => 'Loophands', 'width' => 40, 'length' => 30, 'target' => 1200, 'req_roller' => 80, 'is_active' => true],

            ['name' => 'A2 Loop (Turned)', 'type' => 'Loophands', 'width' => 40, 'length' => 54, 'target' => 900, 'req_roller' => 120, 'is_active' => true],
            ['name' => 'A2 Loop (Unturned)', 'type' => 'Loophands', 'width' => 50, 'length' => 47, 'target' => 900, 'req_roller' => 120, 'is_active' => true],

            // D-Cuts (A2, A3, A4, A5, A6)
            ['name' => 'A2 D-Cut', 'type' => 'Dcuts', 'width' => 40, 'length' => 48, 'target' => 1200, 'req_roller' => 120, 'is_active' => true],
            ['name' => 'A3 D-Cut', 'type' => 'Dcuts', 'width' => 35, 'length' => 45, 'target' => 1400, 'req_roller' => 104, 'is_active' => true],
            ['name' => 'A4 D-Cut', 'type' => 'Dcuts', 'width' => 25, 'length' => 34, 'target' => 1900, 'req_roller' => 80, 'is_active' => true],
            ['name' => 'A5 D-Cut', 'type' => 'Dcuts', 'width' => 20, 'length' => 30, 'target' => 2400, 'req_roller' => 72, 'is_active' => true],
            ['name' => 'A6 D-Cut', 'type' => 'Dcuts', 'width' => 16, 'length' => 20, 'target' => 3000, 'req_roller' => 50, 'is_active' => true],
        ];

        foreach ($benchmarks as $benchmark) {
            ProductionBenchmark::create($benchmark);
        }
    }
}
