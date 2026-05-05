<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BranchSmsConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'gateway_url',
        'api_key',
        'api_secret_key',
        'app_id',
        'sender_id',
        'username',
        'password',
        'account_sid',
        'auth_token',
        'phone_number',
        'provider',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByProvider($query, $provider)
    {
        return $query->where('provider', $provider);
    }

    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    // Methods
    /**
     * Check if SMS config is properly configured
     */
    public function isConfigured(): bool
    {
        if ($this->provider === 'twilio') {
            return !empty($this->account_sid) && !empty($this->auth_token) && !empty($this->phone_number);
        }

        if ($this->provider === 'africastalking') {
            return !empty($this->api_key) && !empty($this->username);
        }

        if ($this->provider === 'beem') {
            return !empty($this->api_key) && !empty($this->api_secret_key) && !empty($this->sender_id);
        }

        // Default custom provider
        return !empty($this->gateway_url) && !empty($this->api_key);
    }

    /**
     * Get the configuration as an array
     */
    public function getConfigArray(): array
    {
        return [
            'provider' => $this->provider,
            'gateway_url' => $this->gateway_url,
            'api_key' => $this->api_key,
            'api_secret_key' => $this->api_secret_key,
            'app_id' => $this->app_id,
            'sender_id' => $this->sender_id,
            'username' => $this->username,
            'password' => $this->password,
            'account_sid' => $this->account_sid,
            'auth_token' => $this->auth_token,
            'phone_number' => $this->phone_number,
        ];
    }
}
