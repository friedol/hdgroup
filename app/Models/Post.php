<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('product_name', 'like', '%' . request('search') . '%')
                ->orwhere('product_id', 'like', '%' . request('search') . '%');
        }
    }
    protected $fillable = [
        'product_id',
        'product_name',
        'cbm',
        'price',
        'weight',
        'pc_per_ctn'
    ];


    public function order()
    {
        return $this->hasMany(Order::class, 'product_id','product_id');
    }
}
