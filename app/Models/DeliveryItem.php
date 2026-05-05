<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryItem extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'delivery_id',
        'item_type',
        'item_id',
        'product_name',
        'quantity',
        'unit_price',
        'total_price',
        'description',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    /**
     * Get the delivery this item belongs to
     */
    public function delivery()
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }

    /**
     * Get the source order/item
     */
    public function getSourceItem()
    {
        if ($this->item_type === 'loan') {
            return Loan::find($this->item_id);
        } elseif ($this->item_type === 'export') {
            return Export::find($this->item_id);
        } elseif ($this->item_type === 'online_order') {
            return Myorder::find($this->item_id);
        }
        return null;
    }
}
