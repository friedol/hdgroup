<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasBranch;

class CashFlow extends Model
{
    use HasFactory, SoftDeletes, HasBranch;

    protected $fillable = [
        'branch_id',
        'user_id',
        'flow',
        'source_name',
        'source_phone',
        'details',
        'method',
        'amount',
        'ref',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
