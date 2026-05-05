<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use \App\Traits\HasBranch;

    protected $fillable = [
        'sale_id',
        'product_id',
        'variant_id',
        'variant_color',
        'print_type',
        'quantity',
        'unit_price',
        'subtotal',
        'discount',
        'branch_id',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
