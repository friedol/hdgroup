<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasBranch;

class InventoryTransaction extends Model
{
    use HasFactory, HasBranch;

    protected $table = 'inventory_transactions';

    protected $fillable = [
        'branch_id',
        'store_id',
        'product_type',
        'product_id',
        'transaction_type',
        'quantity_in',
        'quantity_out',
        'unit_cost',
        'reference_type',
        'reference_id',
        'notes',
        'created_by'
    ];

    /**
     * Get the type for CSS classes (In/Out/Adjustment)
     */
    public function getTypeAttribute()
    {
        if ($this->transaction_type === 'adjustment') return 'ADJUSTMENT';
        return $this->quantity_in > 0 ? 'IN' : 'OUT';
    }

    /**
     * Get a human-readable label for the transaction type.
     */
    public function getTypeLabelAttribute()
    {
        return ucwords(str_replace('_', ' ', $this->transaction_type));
    }

    /**
     * Get a CSS class for the transaction type.
     */
    public function getTypeClassAttribute()
    {
        switch ($this->transaction_type) {
            case 'purchase':
            case 'production_output':
            case 'opening_stock':
                return 'success';
            case 'sale':
            case 'production_consume':
                return 'danger';
            case 'transfer':
            case 'adjustment':
                return 'warning';
            default:
                return 'secondary';
        }
    }

    /**
     * Get the absolute quantity of the movement.
     */
    public function getQuantityAttribute()
    {
        return $this->quantity_in > 0 ? $this->quantity_in : $this->quantity_out;
    }

    /**
     * Get the store associated with the transaction.
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Morph to the actual product (Product or RawMaterial).
     */
    public function product()
    {
        return $this->morphTo(__FUNCTION__, 'product_type', 'product_id');
    }

    /**
     * Morph to the reference model (Sale, ProductionOrder, Transfer, etc.)
     */
    public function reference()
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }

    /**
     * Get the user who created the transaction.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Helper to get the actual quantity change (in minus out).
     */
    public function getQuantityChangeAttribute()
    {
        return $this->quantity_in - $this->quantity_out;
    }
}
