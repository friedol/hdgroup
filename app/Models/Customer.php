<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Customer extends Authenticatable implements MustVerifyEmail
{
    use \App\Traits\HasBranch, HasFactory, Notifiable;

    protected $fillable = [
        'staff_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_address',
        'alternative_phone',
        'whatsapp_no',
        'company_name',
        'business_address',
        'brought_by',
        'is_walking_customer',
        'credit_limit',
        'is_active',
        'city',
        'notes',
        'username',
        'password',
        'profile',
        'location',
        'country',
        'tin_number',
        'branch_id',
        'email_verified_at',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['name', 'email'];

    protected $casts = [
        'password' => 'hashed',
        'is_walking_customer' => 'boolean',
        'is_active' => 'boolean',
        'credit_limit' => 'float',
        'email_verified_at' => 'datetime',
    ];

    /**
     * Laravel's auth system looks for `email` by default for verification emails.
     * We override getEmailForVerification() to use our custom column.
     */
    public function getEmailForVerification(): ?string
    {
        return $this->customer_email;
    }

    /**
     * The auth system also needs a way to look up by email for password reset.
     */
    public function getEmailForPasswordReset(): ?string
    {
        return $this->customer_email;
    }

    public function getEmailAttribute(): ?string
    {
        return $this->customer_email;
    }

    /**
     * Return display name for notifications.
     */
    public function getNameAttribute(): string
    {
        return $this->customer_name ?? $this->username ?? 'Customer';
    }

    public function sales()
    {
        return $this->hasMany(Sale::class, 'pos_customer_id');
    }

    public function followUpLogs()
    {
        return $this->hasMany(FollowUpLog::class);
    }

    public function productAnalytics()
    {
        return $this->hasMany(CustomerProductAnalytic::class);
    }

    public function categoryAnalytics()
    {
        return $this->hasMany(CustomerCategoryAnalytic::class);
    }

    public function broughtBy()
    {
        return $this->belongsTo(User::class, 'brought_by');
    }

    public function getStatusColorAttribute()
    {
        return match ($this->follow_up_status) {
            'Overdue' => 'danger',
            'Due Today' => 'warning',
            'Upcoming' => 'primary',
            'Active' => 'info',
            'New Customer' => 'success',
            default => 'secondary'
        };
    }

    public function getEffectiveFollowUpDateAttribute()
    {
        return $this->manual_follow_up_date ?: $this->next_expected_order_date;
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeForSaler($query, $user)
    {
        if (! $user) {
            return $query;
        }

        $roleName = $user->role->role_name ?? '';
        if (! in_array($roleName, ['Saler', 'Staff'])) {
            return $query;
        }

        return $query->where('brought_by', $user->id);
    }

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('customer_name', 'like', '%'.request('search').'%')
                ->orWhere('customer_email', 'like', '%'.request('search').'%')
                ->orWhere('customer_phone', 'like', '%'.request('search').'%')
                ->orWhere('company_name', 'like', '%'.request('search').'%');
        }
    }
}
