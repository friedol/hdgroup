<?php

namespace App\Models;

use App\Services\CustomerAnalyticsService;
use App\Traits\HasBranch;
use Illuminate\Database\Eloquent\Model;

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
        'assigned_to',
        'assigned_to_name',
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

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
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

    public function getSubtotalAttribute()
    {
        return $this->relationLoaded('items')
            ? $this->items->sum('subtotal')
            : $this->items()->sum('subtotal');
    }

    public function getDiscountAttribute()
    {
        return (float) $this->discount_amount;
    }

    public function getVatAmountAttribute()
    {
        return (float) $this->tax_amount;
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
                app(CustomerAnalyticsService::class)->recalculateCustomerAnalytics($sale->pos_customer_id);
            }
        });

        static::deleted(function ($sale) {
            if ($sale->pos_customer_id) {
                app(CustomerAnalyticsService::class)->recalculateCustomerAnalytics($sale->pos_customer_id);
            }
        });
    }
}
