<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRequest extends Model
{
    protected $fillable = [
        'reference',
        'branch_id',
        'created_by',
        'invoice_number',
        'customer_name',
        'customer_email',
        'customer_phone',
        'amount_requested',
        'due_date',
        'status',
        'notes',
        'sent_at',
        'paid_at',
    ];

    protected $casts = [
        'amount_requested' => 'float',
        'due_date'         => 'date',
        'sent_at'          => 'datetime',
        'paid_at'          => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateReference(): string
    {
        do {
            $ref = 'PRQ-' . strtoupper(substr(uniqid(), -6));
        } while (static::where('reference', $ref)->exists());

        return $ref;
    }
}
