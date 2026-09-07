<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Export extends Model
{
    use \App\Traits\HasBranch, HasFactory;

    protected $casts = [
        'is_checked' => 'boolean',
    ];

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('created_at', 'like', '%'.request('search').'%')
                ->orwhere('id', 'like', '%'.request('search').'%')
                ->orwhere('tin', 'like', '%'.request('search').'%');
        }
    }

    protected $fillable = [
        'is_checked',
        'unique_id',
        'tin',
        'product_name',
        'product_id',
        'customer_name',
        'staff_name',
        'staff_name',
        'product_quantity',
        'unit_price',
        'product_price',
        'product_image',
        'phone',
        'staff_recommeded',
        'sale_mode',
        'payment_date',
        'status',
        'discount',
        'branch_id',
        'delivery_id',
        'delivery_cost',
        'delivery_discount',
        'delivery_status',
        'delivery_address',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class, 'item_id')
            ->where('item_type', 'export');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
