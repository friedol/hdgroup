<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductPriceHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'user_id',
        'previous_buying_price',
        'new_buying_price',
        'previous_selling_price',
        'new_selling_price',
        'reason',
    ];

    protected $casts = [
        'previous_buying_price' => 'decimal:2',
        'new_buying_price' => 'decimal:2',
        'previous_selling_price' => 'decimal:2',
        'new_selling_price' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
