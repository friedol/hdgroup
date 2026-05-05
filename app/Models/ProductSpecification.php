<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSpecification extends Model
{
    protected $fillable = [
        'product_id',
        'gsm',
        'width_cm',
        'length_m',
        'color',
        'weight_per_roll',
        'batch_no',
        'supplier_reference',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
