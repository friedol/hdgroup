<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    use \App\Traits\HasBranch, HasFactory;

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('product_name', 'like', '%'.request('search').'%')
                ->orwhere('created_at', 'like', '%'.request('search').'%');
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
        'unit_factor',
        'base_unit',
        'product_price',
        'buying_price',
        'selling_price',
        'product_image',
        'status',
        'source_store',
        'reason',
        'branch_id',
    ];
}
