<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'color',
        'qty',
        'plain_qty',
        'printed_qty',
        'buying_price',
        'selling_price',
        'branch_id',
    ];

    protected $casts = [
        'qty'           => 'float',
        'plain_qty'     => 'float',
        'printed_qty'   => 'float',
        'buying_price'  => 'float',
        'selling_price' => 'float',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
