<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    use HasFactory, \App\Traits\HasBranch;

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('product_name', 'like', '%' . request('search') . '%')
                ->orwhere('created_at', 'like', '%' . request('search') . '%');
        }
    }

    protected $fillable = [
        'unique_id',
        'product_id',
        'product_name',
        'staff_name',
        'source_store_id',
        'destination_store_id',
        'store_name',
        'staff_recommeded',
        'product_quantity',
        'product_price',
        'product_image',
        'status',
        'source_store',
        'reason',
        'branch_id',
    ];
}
