<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerFollowUp extends Model
{
    use HasFactory;
    use \App\Traits\HasBranch;

    protected $fillable = [
        'customer_id',
        'branch_id',
        'total_orders',
        'total_spent',
        'average_days_between_orders',
        'last_order_date',
        'next_expected_order_date',
        'follow_up_status',
        'manual_follow_up_date',
        'manual_follow_up_notes',
        'reorder_pattern',
        'reorder_cycle_days',
        'frequently_purchased_products',
        'follow_up_count',
        'last_follow_up_date',
        'priority_score',
        'priority_tier',
        'is_active',
    ];

    protected $casts = [
        'last_order_date' => 'date',
        'next_expected_order_date' => 'date',
        'manual_follow_up_date' => 'date',
        'last_follow_up_date' => 'date',
        'frequently_purchased_products' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function activities()
    {
        return $this->hasMany(FollowUpActivity::class);
    }

    /**
     * Get customer's sales for this branch
     */
    public function getCustomerSales()
    {
        return $this->customer
            ->sales()
            ->where('branch_id', $this->branch_id)
            ->where('is_return', false)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Calculate status based on next expected order date
     */
    public function calculateStatus()
    {
        if ($this->total_orders === 0) {
            return 'new';
        }

        if (!$this->next_expected_order_date) {
            return 'new';
        }

        $today = now()->toDateString();
        $nextDate = $this->next_expected_order_date->toDateString();

        if ($nextDate < $today) {
            return 'overdue';
        } elseif ($nextDate === $today) {
            return 'due';
        } else {
            return 'upcoming';
        }
    }

    /**
     * Get status color for UI
     */
    public function getStatusColor()
    {
        $status = $this->follow_up_status;
        return match ($status) {
            'new' => 'gray',
            'upcoming' => 'green',
            'due' => 'yellow',
            'overdue' => 'red',
            default => 'gray'
        };
    }

    /**
     * Get status emoji
     */
    public function getStatusEmoji()
    {
        $status = $this->follow_up_status;
        return match ($status) {
            'new' => '⚪',
            'upcoming' => '🟢',
            'due' => '🟡',
            'overdue' => '🔴',
            default => '⚪'
        };
    }

    /**
     * Days until next expected order
     */
    public function getDaysUntilNextOrder()
    {
        if (!$this->next_expected_order_date) {
            return null;
        }

        return now()->diffInDays($this->next_expected_order_date, false);
    }

    /**
     * Scope: Get customers due for follow-up today
     */
    public function scopeDueToday($query)
    {
        return $query->where('follow_up_status', 'due');
    }

    /**
     * Scope: Get overdue customers
     */
    public function scopeOverdue($query)
    {
        return $query->where('follow_up_status', 'overdue');
    }

    /**
     * Scope: Get high-priority customers
     */
    public function scopeHighPriority($query)
    {
        return $query->where('priority_tier', 'high');
    }

    /**
     * Scope: Get active customers only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
