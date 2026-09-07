<?php

namespace App\Models;

use App\Traits\HasBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    use HasBranch, HasFactory;

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $term = '%'.request('search').'%';
            $query->where(function ($q) use ($term) {
                $q->where('product_name', 'like', $term)
                    ->orWhere('unique_id', 'like', $term)
                    ->orWhere('staff_name', 'like', $term)
                    ->orWhere('store_name', 'like', $term)
                    ->orWhere('source_store', 'like', $term)
                    ->orWhere('created_at', 'like', $term);
            });
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
