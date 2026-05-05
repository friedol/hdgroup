<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FollowUpActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_follow_up_id',
        'customer_id',
        'branch_id',
        'user_id',
        'activity_type',
        'notes',
        'outcome',
        'resulted_in_sale',
        'sale_amount',
        'next_follow_up_date',
        'next_follow_up_notes',
        'activity_date',
    ];

    protected $casts = [
        'activity_date' => 'datetime',
        'next_follow_up_date' => 'date',
        'resulted_in_sale' => 'boolean',
        'sale_amount' => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function followUp()
    {
        return $this->belongsTo(CustomerFollowUp::class, 'customer_follow_up_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class); // seller/staff who made the follow-up
    }

    /**
     * Get activity type display name
     */
    public function getActivityTypeLabel()
    {
        return match ($this->activity_type) {
            'call' => '📞 Phone Call',
            'whatsapp' => '💬 WhatsApp',
            'email' => '📧 Email',
            'sms' => '📱 SMS',
            'in_person' => '👤 In-Person',
            'other' => '📋 Other',
            default => 'Unknown'
        };
    }

    /**
     * Get outcome display name
     */
    public function getOutcomeLabel()
    {
        return match ($this->outcome) {
            'promised_order' => '✅ Promised Order',
            'interested' => '👍 Interested',
            'not_interested' => '👎 Not Interested',
            'no_response' => '❌ No Response',
            'rescheduled' => '🔄 Rescheduled',
            'other' => '📝 Other',
            null => 'No outcome',
            default => 'Unknown'
        };
    }

    /**
     * Scope: Recent activities
     */
    public function scopeRecent($query)
    {
        return $query->orderBy('activity_date', 'desc');
    }

    /**
     * Scope: Filter by branch
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope: Filter by user/seller
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
