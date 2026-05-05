<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = "inventories";
    use \App\Traits\HasBranch;

    protected $fillable = [
        'store_id',
        'product_id',
        'product_type',
        'qty',
        'reorder_level',
        'overstock_threshold',
        'branch_id',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function product()
    {
        return $this->morphTo('product', 'product_type', 'product_id');
    }

    public function logs()
    {
        return $this->hasMany(InventoryLog::class);
    }
}
