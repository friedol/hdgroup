<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAdjustment extends Model
{
    use \App\Traits\HasBranch, HasFactory;

    protected $fillable = [
        'product_id',
        'variant_id',
        'variant_color',
        'product_type',
        'store_id',
        'user_id',
        'adjustment_type',
        'quantity',
        'financial_loss_value',
        'damage_category',
        'reason',
        'notes',
        'status',
        'approved_by',
        'approved_at',
        'branch_id',
    ];

    public function product()
    {
        return $this->morphTo('product', 'product_type', 'product_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
