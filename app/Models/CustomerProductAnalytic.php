<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerProductAnalytic extends Model
{
    protected $fillable = [
        'customer_id',
        'product_id',
        'avg_reorder_interval',
        'last_purchase_date',
        'next_expected_purchase_date',
        'total_quantity_bought',
    ];

    protected $casts = [
        'last_purchase_date' => 'date',
        'next_expected_purchase_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
