<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bom extends Model
{
    protected $table = 'boms';

    protected $fillable = [
        'finished_product_id',
        'branch_id',
        'version',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function finishedProduct()
    {
        return $this->belongsTo(Product::class, 'finished_product_id');
    }

    public function items()
    {
        return $this->hasMany(BomItem::class, 'bom_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForProduct($query, $productId)
    {
        return $query->where('finished_product_id', $productId);
    }
}
