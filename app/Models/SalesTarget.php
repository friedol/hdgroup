<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesTarget extends Model
{
    protected $fillable = [
        'period_type',
        'period_label',
        'branch_id',
        'user_id',
        'target_amount',
        'target_units',
        'notes',
    ];

    protected $casts = [
        'target_amount' => 'float',
        'target_units'  => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
