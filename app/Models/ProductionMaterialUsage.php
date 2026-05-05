<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionMaterialUsage extends Model
{
    protected $table = 'production_material_usage';

    protected $fillable = [
        'production_id',
        'raw_material_id',
        'quantity_used',
        'cost_at_time',
    ];

    public function productionOrder()
    {
        return $this->belongsTo(ProductionOrder::class, 'production_id');
    }

    public function rawMaterial()
    {
        return $this->belongsTo(Product::class, 'raw_material_id');
    }
}
