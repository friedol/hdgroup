<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasBranch;

class Sale extends Model
{
    use HasBranch;
    protected $fillable = [
        'invoice_number',
        'customer_id',
        'pos_customer_id',
        'user_id',
        'total_amount',
        'discount_amount',
        'tax_amount',
        'payable_amount',
        'payment_method',
        'payment_status',
        'notes',
        'is_return',
        'returned_from_id',
        'branch_id',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function posCustomer()
    {
        return $this->belongsTo(Customer::class, 'pos_customer_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'unique_id', 'invoice_number');
    }

    public function getAmountPaidAttribute()
    {
        return (float) $this->payments()->sum('amount_paid');
    }

    public function getBalanceAttribute()
    {
        return max(0, (float) $this->payable_amount - $this->amount_paid);
    }

    public function syncStatus()
    {
        $paid = $this->amount_paid;
        $payable = (float) $this->payable_amount;

        $newStatus = 'Paid';
        if ($paid < $payable - 1) { // 1 unit buffer
            $newStatus = ($paid > 0) ? 'Partially Paid' : 'Unpaid';
        }

        if ($this->payment_status !== $newStatus) {
            $this->payment_status = $newStatus;
            $this->save();
        }

        return $newStatus;
    }

    protected static function booted()
    {
        static::saved(function ($sale) {
            if ($sale->pos_customer_id) {
                app(\App\Services\CustomerAnalyticsService::class)->recalculateCustomerAnalytics($sale->pos_customer_id);
            }
        });

        static::deleted(function ($sale) {
            if ($sale->pos_customer_id) {
                app(\App\Services\CustomerAnalyticsService::class)->recalculateCustomerAnalytics($sale->pos_customer_id);
            }
        });
    }
}
