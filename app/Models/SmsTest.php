<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsTest extends Model
{
    protected $fillable = [
        'branch_id',
        'phone_number',
        'message',
        'provider',
        'status',
        'response',
        'http_code',
        'error_message',
    ];

    protected $casts = [
        'response' => 'array',
        'http_code' => 'integer',
    ];

    /**
     * Get the branch this test belongs to
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Scope to successful tests
     */
    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope to failed tests
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope by provider
     */
    public function scopeByProvider($query, $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope by branch
     */
    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
