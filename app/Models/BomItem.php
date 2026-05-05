<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BomItem extends Model
{
    protected $table = 'bom_items';

    protected $fillable = [
        'bom_id',
        'raw_material_id',
        'quantity_required',
        'wastage_percent',
        'unit',
    ];

    protected $casts = [
        'quantity_required' => 'decimal:4',
        'wastage_percent' => 'decimal:2',
    ];

    public function bom()
    {
        return $this->belongsTo(Bom::class, 'bom_id');
    }

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }

    public function getEstimatedCostAttribute()
    {
        $rawMaterial = $this->rawMaterial;
        if (!$rawMaterial) return 0;
        
        $costPerUnit = $rawMaterial->cost_per_unit ?? 0;
        
        // Convert to base unit if needed. 
        // For simplicity, we assume quantity_required is already in base_unit 
        // as per the prompt instructions (or converted prior to saving).
        $baseQuantity = $this->quantity_required;
        
        // Apply wastage
        $wasteAdjustment = 1 + ($this->wastage_percent / 100);
        
        return ($baseQuantity * $wasteAdjustment) * $costPerUnit;
    }
}
