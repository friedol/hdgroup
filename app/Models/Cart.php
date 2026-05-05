<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use \App\Traits\HasBranch;

    protected $casts = [
        'is_checked' => 'boolean',
    ];
    protected $fillable = [
        'branch_id',
        'is_checked',
        'unique_id',
        'product_id',
        'email',
        'country',
        'city',
        'district',
        'street',
        'village',
        'box_name',
        'kata',
        'cargo',
        'tin_number',
        'name',
        'phone_number',
        'product_name',
        'quantity',
        'qty_checked',
        'selected_image',
        'price',
        'status',
        'staff_recommeded',
        'discount',
        'promo_code',
        'promo_discount_total',
        'unit_type',
        'needs_vat',
        'payment_method',
        'amount_paid',
        'balance',
        'is_loan',
    ];
}
