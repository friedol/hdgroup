<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryTracking extends Model
{
    use HasFactory;

    protected $table = 'delivery_tracking';

    protected $fillable = [
        'delivery_id',
        'status',
        'location',
        'latitude',
        'longitude',
        'updated_by',
        'notes',
        'photo',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    /**
     * Get the delivery this tracking belongs to
     */
    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }

    /**
     * Get human readable status
     */
    public function getStatusLabelAttribute()
    {
        $labels = [
            'pending' => 'Pending',
            'assigned' => 'Assigned to Driver',
            'picked-up' => 'Picked Up',
            'in-transit' => 'In Transit',
            'delivered' => 'Delivered',
            'failed' => 'Delivery Failed',
            'cancelled' => 'Cancelled',
        ];
        return $labels[$this->status] ?? $this->status;
    }
}
