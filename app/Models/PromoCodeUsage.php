<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromoCodeUsage extends Model
{
    use HasFactory;

    protected $fillable = [
        'promo_code_id',
        'order_unique_id',
        'user_identifier',
    ];

    public function promoCode()
    {
        return $this->belongsTo(PromoCode::class);
    }
}
