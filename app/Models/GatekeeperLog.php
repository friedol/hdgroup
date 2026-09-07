<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GatekeeperLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'type', // 'IN' or 'OUT'
        'item_type', // 'product' or 'raw_material'
        'product_id',
        'raw_material_id',
        'product_name',
        'quantity',
        'unit_price',
        'unit',
        'handler_id',
        'handler_name',
        'handler_type', // 'Registered', 'Staff', 'Supplier', 'Delivery', 'Customer'
        'source', // Where it's coming from (for IN records)
        'destination', // Where it's going (for OUT records)
        'description',
        'reference_number', // Invoice/Order/Export number
        'contact_info',
        'verification_code',
        'notes',
        'recorded_by_id',
        'recorded_by_name',
        'status', // 'pending', 'verified', 'rejected'
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'quantity' => 'float',
        'unit_price' => 'float',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by_id');
    }

    public function scopeFilter($query, $filters)
    {
        if ($filters['search'] ?? false) {
            $search = $filters['search'];
            $query->where('product_name', 'like', "%{$search}%")
                ->orWhere('handler_name', 'like', "%{$search}%")
                ->orWhere('reference_number', 'like', "%{$search}%");
        }

        if ($filters['type'] ?? false) {
            $query->where('type', $filters['type']);
        }

        if ($filters['status'] ?? false) {
            $query->where('status', $filters['status']);
        }

        if ($filters['start_date'] ?? false) {
            $query->whereDate('recorded_at', '>=', $filters['start_date']);
        }

        if ($filters['end_date'] ?? false) {
            $query->whereDate('recorded_at', '<=', $filters['end_date']);
        }

        return $query;
    }

    public function scopeRecordedToday($query)
    {
        return $query->whereDate('recorded_at', today());
    }

    public function scopeRecordedThisMonth($query)
    {
        return $query->whereBetween('recorded_at', [
            now()->startOfMonth(),
            now()->endOfMonth(),
        ]);
    }
}
