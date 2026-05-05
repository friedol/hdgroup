<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogisticsManifest extends Model
{
    use HasFactory, \App\Traits\HasBranch;

    protected $fillable = [
        'unique_id',
        'manifest_name',
        'container_id',
        'status',
        'total_weight',
        'total_cbm',
        'created_by',
        'branch_id',
    ];

    public function container()
    {
        return $this->belongsTo(Container::class, 'container_id');
    }

    public function items()
    {
        return $this->hasMany(Order::class, 'manifest_id'); 
        // Note: 'Order' model is acting as ManifestItem
    }
}
