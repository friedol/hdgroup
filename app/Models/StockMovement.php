<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use \App\Traits\HasBranch;

    protected $fillable = [
        'product_id',
        'store_id',
        'type',
        'quantity',
        'reference_id',
        'user_id',
        'notes',
        'branch_id',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
