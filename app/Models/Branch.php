<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\InventoryTransaction;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'system_name',
        'address',
        'phone',
        'email',
        'logo',
        'favicon',
        'is_active',
        'is_manufacturing_enabled',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($branch) {
            if (empty($branch->slug)) {
                $branch->slug = \Illuminate\Support\Str::slug($branch->name);
            }
        });

        static::updating(function ($branch) {
            if ($branch->isDirty('name') && empty($branch->slug)) {
                $branch->slug = \Illuminate\Support\Str::slug($branch->name);
            }
        });
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function productions()
    {
        return $this->hasMany(InventoryTransaction::class)->where('transaction_type', 'production_output');
    }



    public function manager()
    {
        return $this->hasOne(User::class)->whereHas('roles', function($q) {
            $q->where('role_name', 'Branch Manager');
        });
    }

    public function stores()
    {
        return $this->belongsToMany(Store::class, 'branch_store');
    }

    public function smsConfig()
    {
        return $this->hasOne(BranchSmsConfig::class);
    }
}
