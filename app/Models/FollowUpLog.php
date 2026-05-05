<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUpLog extends Model
{
    protected $fillable = [
        'customer_id',
        'user_id',
        'follow_up_date',
        'action',
        'notes',
    ];

    protected $casts = [
        'follow_up_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
