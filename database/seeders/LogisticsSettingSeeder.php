<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class LogisticsSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'logistics_overload_tolerance'],
            [
                'value' => '5',
                'type' => 'number',
                'group' => 'logistics'
            ]
        );
    }
}
