<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UpcomingProduct extends Model
{
    use \App\Traits\HasBranch;

    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'product_price',
        'unit_price',
        'buying_price',
        'product_management_id',
        'upcoming_order_id',
        'product_name',
        'product_quantity',
        'is_published',
        'unit_id',
        'unit_name',
        'unit_description',
        'category_id',
        'category_name',
        'brand',
        'buying_unit_id',
        'qty_in_buying_unit',
        'cost_per_base_unit',
        'reorder_point',
        'low_stock_threshold',
        'store_id',
        'store_name',
        'level',
        'description',
        'material',
        'weight',
        'weight_unit',
        'length',
        'width',
        'height',
        'dimension_unit',
        'volume',
        'volume_unit',
        'sale_units',
        'specifications',
        'image_1',
        'image_2',
        'image_3',
        'image_4',
        'image_5',
        'video',
        'feature',
        'is_featured',
        'is_public',
        'branch_id',
    ];


    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('product_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('sku', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('product_id', 'like', '%' . $filters['search'] . '%');
        }
    }

    public function upcomingOrder()
    {
        return $this->belongsTo(UpcomingOrder::class);
    }

    /**
     * Check if the draft product has all mandatory fields for catalog sync.
     */
    public function isReadyToPublish()
    {
        // Mandatory fields for a valid ProductManagement/Product record
        $mandatoryFields = [
            'sku', 
            'product_name', 
            'category_id', 
            'unit_id', 
            'store_id',
            'buying_price'
        ];

        foreach ($mandatoryFields as $field) {
            if (empty($this->$field)) {
                return false;
            }
        }

        // Also check if sale_units JSON is present/valid (at least one unit)
        if (empty($this->sale_units)) {
            return false;
        }

        $saleUnits = json_decode($this->sale_units, true);
        if (!is_array($saleUnits) || count($saleUnits) === 0) {
            return false;
        }

        return true;
    }
}
