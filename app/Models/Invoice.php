<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use \App\Traits\HasBranch;

    protected $fillable = [
        'branch_id',
        'unique_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'amount_due',
        'amount_paid',
        'payment_date',
        'invoice_date',
        'status',
        'sale_id',
        'notes',
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'invoice_date' => 'datetime',
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
