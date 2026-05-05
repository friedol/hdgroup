<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    use HasFactory, \App\Traits\HasBranch;

    protected $casts = [
        'is_checked' => 'boolean',
    ];

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('customer_name', 'like', '%' . request('search') . '%');
        }
    }

    protected $fillable = [
        'sale_id',
        'unique_id',
        'customer_name',
        'tin',
        'phone',
        'product_name',
        'product_id',
        'staff_name',
        'product_quantity',
        'unit_price',
        'product_price',
        'payment_date',
        'status',
        'amount_paid',
        'total_amount',
        'balance',
        'is_checked',
        'staff_recommeded',
        'discount',
        'branch_id',
    ];


    public function payments()
    {
        return $this->hasMany(Payment::class,'unique_id','unique_id');
    }

    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class, 'item_id')
            ->where('item_type', 'loan');
    }
}
