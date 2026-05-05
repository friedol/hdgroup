<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasBranch;

class ProductionOrder extends Model
{
    use HasFactory, HasBranch;

    protected $fillable = [
        'order_number',
        'branch_id',
        'store_id',
        'bom_id',
        'roll_id',
        'product_id',
        'bag_width',
        'bag_length',
        'selling_price',
        'across_count',
        'actual_used_length',
        'bags_produced',
        'fabric_cost_used',
        'accessory_cost_used',
        'revenue',
        'gross_profit',
        'quantity_to_produce',
        'status',
        'total_cost',
        'created_by',
    ];

    protected $casts = [
        'bag_width' => 'decimal:2',
        'bag_length' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'actual_used_length' => 'decimal:2',
        'bags_produced' => 'decimal:2',
        'fabric_cost_used' => 'decimal:2',
        'accessory_cost_used' => 'decimal:2',
        'revenue' => 'decimal:2',
        'gross_profit' => 'decimal:2',
        'quantity_to_produce' => 'decimal:4',
        'total_cost' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->order_number) {
                $lastOrder = static::withoutGlobalScopes()->max('id') ?: 0;
                $nextNumber = $lastOrder + 1;
                $model->order_number = 'PO-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function bom()
    {
        return $this->belongsTo(Bom::class);
    }

    public function roll()
    {
        return $this->belongsTo(RawMaterial::class, 'roll_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    public function materialUsages()
    {
        return $this->hasMany(ProductionMaterialUsage::class, 'production_id');
    }
}
