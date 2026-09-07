<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_name',
        'asset_code',
        'category',
        'assigned_to',
        'assigned_date',
        'condition',
        'status',
    ];

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
