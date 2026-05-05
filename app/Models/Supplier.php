<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasBranch;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_name',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'category',
        'tax_id',
        'status',
        'branch_id',
        'created_by'
    ];

    protected $casts = [
        'status' => 'boolean'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
