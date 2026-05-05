<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Loan;
use App\Models\Export;
use App\Models\Cart;
use App\Models\User;

class Delivery extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\HasBranch;

    protected $fillable = [
        'delivery_number',
        'delivery_person_id',
        'assignment_mode',
        'assigned_saler_id',
        'external_partner',
        'delivery_type',
        'customer_name',
        'phone',
        'email',
        'delivery_address',
        'delivery_zone',
        'delivery_cost',
        'delivery_discount',
        'delivery_total',
        'payment_method',
        'status',
        'priority',
        'scheduled_date',
        'pickup_time',
        'delivery_time',
        'rating',
        'feedback',
        'notes',
        'proof_of_delivery',
        'distance_km',
        'branch_id',
        'created_by',
    ];

    protected $casts = [
        'delivery_cost' => 'decimal:2',
        'delivery_discount' => 'decimal:2',
        'delivery_total' => 'decimal:2',
        'distance_km' => 'decimal:2',
        'scheduled_date' => 'datetime',
        'pickup_time' => 'datetime',
        'delivery_time' => 'datetime',
    ];

    /**
     * Get the delivery person assigned
     */
    public function deliveryPerson()
    {
        return $this->belongsTo(DeliveryPerson::class, 'delivery_person_id');
    }

    public function assignedSaler()
    {
        return $this->belongsTo(User::class, 'assigned_saler_id');
    }

    /**
     * Get all items in this delivery
     */
    public function items()
    {
        return $this->hasMany(DeliveryItem::class, 'delivery_id');
    }

    /**
     * Get all tracking records
     */
    public function tracking()
    {
        return $this->hasMany(DeliveryTracking::class, 'delivery_id')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get the latest tracking record
     */
    public function latestTracking()
    {
        return $this->hasOne(DeliveryTracking::class, 'delivery_id')->latestOfMany('created_at');
    }

    /**
     * Get related order (loan, export, or myorder)
     */
    public function getRelatedOrder()
    {
        if ($this->delivery_type === 'loan') {
            return Loan::whereHas('deliveries', function($q) {
                $q->where('deliveries.id', $this->id);
            })->first();
        } elseif ($this->delivery_type === 'export') {
            return Export::whereHas('deliveries', function($q) {
                $q->where('deliveries.id', $this->id);
            })->first();
        } elseif ($this->delivery_type === 'online_order') {
            return Myorder::whereHas('deliveries', function($q) {
                $q->where('deliveries.id', $this->id);
            })->first();
        }
        return null;
    }

    /**
     * Update delivery status
     */
    public function updateStatus($newStatus, $notes = null, $location = null)
    {
        // Update delivery main status
        $this->update([
            'status' => $newStatus,
            'delivery_time' => ($newStatus === 'delivered') ? now() : $this->delivery_time,
        ]);

        // Create tracking record
        DeliveryTracking::create([
            'delivery_id' => $this->id,
            'status' => $newStatus,
            'location' => $location,
            'notes' => $notes,
            'updated_by' => auth()->user()?->name ?? 'system',
        ]);

        // Update related order delivery status
        $this->updateRelatedOrderStatus($newStatus);

        return $this;
    }

    /**
     * Update the related order's delivery status
     */
    private function updateRelatedOrderStatus($status)
    {
        $statusMap = [
            'pending' => 'pending',
            'assigned' => 'assigned',
            'picked-up' => 'picked-up',
            'in-transit' => 'in-transit',
            'delivered' => 'delivered',
            'failed' => 'failed',
            'cancelled' => 'cancelled',
        ];

        $deliveryStatus = $statusMap[$status] ?? $status;

        if ($this->delivery_type === 'loan') {
            Loan::find($this->id)?->update(['delivery_status' => $deliveryStatus]);
        } elseif ($this->delivery_type === 'export') {
            Export::find($this->id)?->update(['delivery_status' => $deliveryStatus]);
        } elseif ($this->delivery_type === 'online_order') {
            Cart::where('unique_id', $this->id)->orWhere('id', $this->id)->update(['status' => $deliveryStatus]);
        }
    }

    /**
     * Generate unique delivery number
     */
    public static function generateDeliveryNumber()
    {
        $prefix = 'DEL';
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        return $prefix . $date . sprintf('%04d', $count);
    }

    /**
     * Calculate total value of all items
     */
    public function getTotalItemsValue()
    {
        return $this->items()->sum('total_price');
    }
}
