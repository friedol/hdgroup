<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Myorder extends Model
{
    
    protected $fillable=[
        'id',
        'product',
        'phone',
        'quantity',
        'total_price',
        'delivery_id',
        'delivery_cost',
        'delivery_discount',
        'delivery_status',
        'delivery_address',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class, 'item_id')
            ->where('item_type', 'online_order');
    }
}
