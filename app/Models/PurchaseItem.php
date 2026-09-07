<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',
        'buying_price',
        'selling_price',
        'total',
        'batch_number',
        'expiry_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'buying_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'total' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
