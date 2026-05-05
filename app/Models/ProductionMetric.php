<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_id',
        'expected_material_usage',
        'actual_material_usage',
        'waste_percentage',
        'labor_hours',
        'downtime_minutes',
        'labor_cost',
        'efficiency_score',
        'notes'
    ];

    protected $casts = [
        'expected_material_usage' => 'decimal:2',
        'actual_material_usage' => 'decimal:2',
        'waste_percentage' => 'decimal:2',
        'labor_hours' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'efficiency_score' => 'decimal:2'
    ];

    public function production()
    {
        return $this->belongsTo(Production::class);
    }

    public function calculateEfficiencyScore()
    {
        $materialEfficiency = $this->expected_material_usage > 0 
            ? ($this->expected_material_usage / $this->actual_material_usage) * 100 
            : 100;

        $timeEfficiency = $this->labor_hours > 0 
            ? max(0, 100 - ($this->downtime_minutes / ($this->labor_hours * 60) * 100))
            : 100;

        $wasteEfficiency = max(0, 100 - $this->waste_percentage);

        $this->efficiency_score = ($materialEfficiency + $timeEfficiency + $wasteEfficiency) / 3;
        $this->save();

        return $this->efficiency_score;
    }

    public function getVarianceAttribute()
    {
        return $this->actual_material_usage - $this->expected_material_usage;
    }

    public function getVariancePercentageAttribute()
    {
        return $this->expected_material_usage > 0 
            ? ($this->variance / $this->expected_material_usage) * 100 
            : 0;
    }
}
