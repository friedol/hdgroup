<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Container;

class ContainerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        Container::create([
            'container_id' => 'C-20F',
            'name' => '20-Foot Container (TEU)',
            'length' => '6.06',
            'width' => '2.44',
            'height' => '2.59',
            'capacity' => '33',
            'tare_weight' => '2050',
            'gross_weight' => '30480',
            'max_payload' => '28430',
            'description' => 'length, width, height in cm Capacity in cubic metres, tare weight, gross weight and max payload in Kg'
        ]);

        Container::create([
            'container_id' => 'C-40F',
            'name' => '40-Foot Container (FEU)',
            'length' => '12.19',
            'width' => '2.4',
            'height' => '2.59',
            'capacity' => '67',
            'tare_weight' => '3750',
            'gross_weight' => '30480',
            'max_payload' => '26730',
            'description' => 'length, width, height in cm Capacity in cubic metres, tare weight, gross weight and max payload in Kg'
        ]);

        Container::create([
            'container_id' => 'C-40FH',
            'name' => '40-Foot High Cube Container',
            'length' => '12.19',
            'width' => '2.44',
            'height' => '2.89',
            'capacity' => '76',
            'tare_weight' => '3900',
            'gross_weight' => '30480',
            'max_payload' => '26580',
            'description' => 'length, width, height in cm Capacity in cubic metres, tare weight, gross weight and max payload in Kg'
        ]);

        Container::create([
            'container_id' => 'C-45F',
            'name' => '45-Foot High Cube Container',
            'length' => '13.72',
            'width' => '2.44',
            'height' => '2.89',
            'capacity' => '86',
            'tare_weight' => '4820',
            'gross_weight' => '32500',
            'max_payload' => '27680',
            'description' => 'length, width, height in cm Capacity in cubic metres, tare weight, gross weight and max payload in Kg'
        ]);
    }
}
