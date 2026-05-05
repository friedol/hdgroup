<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromoCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'max_discount_amount',
        'min_order_amount',
        'starts_at',
        'expires_at',
        'usage_limit_per_user',
        'usage_limit_global',
        'used_count',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'max_discount_amount' => 'float',
        'min_order_amount' => 'float',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function usages()
    {
        return $this->hasMany(PromoCodeUsage::class);
    }

    public function calculateDiscount(float $subtotal): float
    {
        if ($subtotal <= 0) {
            return 0;
        }

        if ($this->discount_type === 'fixed') {
            return min($subtotal, (float) $this->discount_value);
        }

        $discount = $subtotal * ((float) $this->discount_value / 100);
        if ($this->max_discount_amount) {
            $discount = min($discount, (float) $this->max_discount_amount);
        }

        return min($subtotal, $discount);
    }
}
