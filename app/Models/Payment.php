<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentFactory> */
    use HasFactory, \App\Traits\HasBranch;
    protected $fillable = [
        'loan_id',
        'unique_id',
        'user_id',
        'amount_paid',
        'payment_date',
        'payment_method',
        'reference',
        'branch_id',
    ];
    public function loan()
    {
        return $this->belongsTo(Loan::class,'unique_id','unique_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sale()
    {
        // For POS sales, payments.unique_id is the sales.invoice_number
        return $this->belongsTo(Sale::class, 'unique_id', 'invoice_number');
    }
}
