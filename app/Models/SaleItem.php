<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
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
        'fulfillment_status',
        'fulfilled_by',
        'fulfilled_at',
        'source_store_id',
        'source_store_name',
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

    public function sourceStore()
    {
        return $this->belongsTo(Store::class, 'source_store_id');
    }

    public function fulfilledBy()
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }
}
