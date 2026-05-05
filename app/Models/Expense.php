<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    /** @use HasFactory<\Database\Factories\ExpensesFactory> */
    use HasFactory, \App\Traits\HasBranch;
    protected $fillable = [
        'date',
        'amount',
        'category',
        'payment_method',
        'description',
        'receipt',
        'status',
        'user_id',
        'branch_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
