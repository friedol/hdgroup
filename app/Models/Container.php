<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Container extends Model
{
    use HasFactory, \App\Traits\HasBranch;

    protected $fillable = [
        'container_id',
        'name',
        'length',
        'width',
        'height',
        'capacity',
        'tare_weight',
        'gross_weight',
        'max_payload',
        'description',
        'used_capacity',
        'current_weight',
        'current_cbm',
        'utilization_percent',
        'status',
        'branch_id',
    ];

    /**
     * Recalculates the container's weight and CBM based on all active manifests.
     */
    public function recalculateState()
    {
        $metrics = LogisticsManifest::where('container_id', $this->id)
            ->where('status', '!=', 'CANCELLED')
            ->selectRaw('SUM(total_weight) as weight, SUM(total_cbm) as cbm')
            ->first();

        $this->current_weight = $metrics->weight ?? 0;
        $this->current_cbm = $metrics->cbm ?? 0;
        
        if ($this->capacity > 0) {
            $this->utilization_percent = ($this->current_cbm / $this->capacity) * 100;
        }

        // Auto-update status based on load
        if ($this->current_weight >= $this->max_payload || $this->current_cbm >= $this->capacity) {
            $this->status = 'FULL';
        } elseif ($this->current_weight > 0) {
            $this->status = 'LOADING';
        } else {
            $this->status = 'AVAILABLE';
        }

        $this->save();
    }

    public function canAcceptLoad($additionalWeight, $additionalCBM)
    {
        $tolerance = (float) setting('logistics_overload_tolerance', 0);
        $factor = 1 + ($tolerance / 100);

        $allowedWeight = $this->max_payload * $factor;
        $allowedCBM = $this->capacity * $factor;

        $weightOk = ($this->current_weight + $additionalWeight <= $allowedWeight);
        $cbmOk = ($this->current_cbm + $additionalCBM <= $allowedCBM);

        if (!$weightOk) {
            return [
                'allowed' => false,
                'reason' => "Mass Load Violation: Total weight (" . number_format($this->current_weight + $additionalWeight, 1) . " kg) exceeds limit of " . number_format($allowedWeight, 1) . " kg (including {$tolerance}% tolerance)."
            ];
        }

        if (!$cbmOk) {
            return [
                'allowed' => false,
                'reason' => "Volume Violation: Total volume (" . number_format($this->current_cbm + $additionalCBM, 2) . " m³) exceeds limit of " . number_format($allowedCBM, 2) . " m³ (including {$tolerance}% tolerance)."
            ];
        }

        return ['allowed' => true, 'reason' => 'Load within limits.'];
    }

    public function order()
    {
        return $this->hasMany(Order::class,'container_id');
    }
}
