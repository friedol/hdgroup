<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeliveryPerson extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\HasBranch;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'id_number',
        'vehicle_registration',
        'vehicle_type',
        'status',
        'base_delivery_rate',
        'address',
        'delivery_zone',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'base_delivery_rate' => 'decimal:2',
    ];

    /**
     * Get all deliveries assigned to this person
     */
    public function deliveries()
    {
        return $this->hasMany(Delivery::class, 'delivery_person_id');
    }

    /**
     * Get current active deliveries
     */
    public function activeDeliveries()
    {
        return $this->deliveries()
            ->whereNotIn('status', ['delivered', 'failed', 'cancelled'])
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get completed deliveries for today
     */
    public function completedDeliveriesToday()
    {
        return $this->deliveries()
            ->whereDate('delivery_time', today())
            ->where('status', 'delivered')
            ->count();
    }

    /**
     * Calculate total earnings
     */
    public function calculateEarnings($startDate = null, $endDate = null)
    {
        $query = $this->deliveries()
            ->where('status', 'delivered');

        if ($startDate) {
            $query->whereDate('delivery_time', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('delivery_time', '<=', $endDate);
        }

        return $query->sum('delivery_total');
    }
}
