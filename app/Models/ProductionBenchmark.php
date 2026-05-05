<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionBenchmark extends Model
{
    protected $fillable = [
        'name',
        'image_path',
        'type',
        'description',
        'width',
        'length',
        'target',
        'price',
        'req_roller',
        'is_active',
    ];
}
