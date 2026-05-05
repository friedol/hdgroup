<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasBranch;

class RawMaterial extends Model
{
    use HasFactory, HasBranch;

    protected $fillable = [
        'code',
        'name',
        'category',
        'base_unit',
        'cost_per_unit',
        'minimum_stock',
        'supplier',
        'status',
        'branch_id',
        'created_by',
        'is_roll',
        'gsm',
        'width',
        'total_length',
        'remaining_length',
        'color',
        'parent_roll_id',
        'roll_status',
        'cost_per_kg',
        'weight_kg',
        'track_inventory',
        'barcode',
        'brand',
        'description',
        'reorder_point',
        'material',
        'is_accessory',
        'sku',
        'purchase_unit',
        'conversion_ratio',
        'image_path',
    ];

    protected $casts = [
        'cost_per_unit' => 'decimal:2',
        'minimum_stock' => 'decimal:4',
        'status' => 'boolean',
        'is_roll' => 'boolean',
        'gsm' => 'decimal:2',
        'width' => 'decimal:2',
        'total_length' => 'decimal:2',
        'remaining_length' => 'decimal:2',
        'cost_per_kg' => 'decimal:2',
        'is_accessory' => 'boolean',
    ];

    protected $attributes = [
        'minimum_stock' => 0,
        'status' => true,
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function movements()
    {
        return $this->hasMany(InventoryTransaction::class, 'product_id')
            ->where('product_type', 'raw_material');
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function parent()
    {
        return $this->belongsTo(RawMaterial::class, 'parent_roll_id');
    }

    public function children()
    {
        return $this->hasMany(RawMaterial::class, 'parent_roll_id');
    }

    public function productionOrders()
    {
        return $this->hasMany(ProductionOrder::class, 'roll_id');
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class, 'product_id')->where('product_type', self::class);
    }

    public function getStoreNameAttribute()
    {
        return $this->inventory
            ->where('branch_id', $this->branch_id)
            ->sortByDesc('qty')
            ->first()?->store?->store_name ?? 'N/A';
    }

    /**
     * Calculate weight in KG based on geometry.
     * Weight (kg) = (GSM ÷ 1000) × (Width in meters × Length in meters)
     */
    public function getWeightKgAttribute()
    {
        if (!$this->is_roll)
            return 0;

        $widthInMeters = $this->width / 100;
        return ($this->gsm / 1000) * ($widthInMeters * $this->total_length);
    }

    /**
     * Total Roll Cost = Weight × Cost per KG
     */
    public function getTotalRollCostAttribute()
    {
        if (!$this->is_roll)
            return 0;
        return $this->weight_kg * ($this->cost_per_kg ?: 0);
    }

    /**
     * Remaining Value = (Remaining Length ÷ Total Length) × Total Roll Cost
     */
    public function getRemainingValueAttribute()
    {
        if (!$this->is_roll || $this->total_length <= 0)
            return 0;
        return ($this->remaining_length / $this->total_length) * $this->total_roll_cost;
    }

    public function getCurrentStockAttribute()
    {
        // Always read from the live inventory table for accurate post-adjustment counts.
        // remaining_length tracks physical metres consumed in production – it is separate.
        return (new \App\Services\InventoryService())->getTotalInventoryQuantity($this->id, 'raw_material', $this->branch_id);
    }

    /**
     * Number of roll units in inventory (count of rolls, not metres).
     * For non-rolls this is the same as current_stock.
     */
    public function getInventoryQtyAttribute()
    {
        return (new \App\Services\InventoryService())->getTotalInventoryQuantity($this->id, 'raw_material', $this->branch_id);
    }

    public function getCategoryAttribute($value)
    {
        return $value ?: 'Uncategorized';
    }

    public function getFormattedCodeAttribute()
    {
        return $this->code ?? 'RM-' . str_pad($this->id, 4, '0', STR_PAD_LEFT);
    }

    public function getImageUrlAttribute()
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function getIsLowStockAttribute()
    {
        if ($this->is_roll) {
            return $this->remaining_length <= $this->minimum_stock;
        }
        return $this->current_stock <= $this->minimum_stock;
    }

    public function getStockStatusAttribute()
    {
        $current = $this->is_roll ? $this->remaining_length : $this->current_stock;

        if ($current <= 0) {
            return ['text' => 'Consumed/Out', 'class' => 'danger'];
        } elseif ($current <= $this->minimum_stock) {
            return ['text' => 'Low Stock', 'class' => 'warning'];
        } else {
            return ['text' => 'In Stock', 'class' => 'success'];
        }
    }

    public function getTotalValueAttribute()
    {
        if ($this->is_roll) {
            return $this->remaining_value;
        }
        return $this->current_stock * $this->cost_per_unit;
    }


    // Check if material can be deleted
    public function canBeDeleted()
    {
        // Check if used in any BOM
        $usedInBom = \App\Models\BomItem::where('raw_material_id', $this->id)->exists();
        // Check if has children rolls
        $hasChildren = $this->children()->exists();
        // Check if used in any roll-based production
        $usedInProduction = \App\Models\ProductionOrder::where('roll_id', $this->id)->exists();

        return !$usedInBom && !$hasChildren && !$usedInProduction;
    }
}
