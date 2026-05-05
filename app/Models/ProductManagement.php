<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductManagement extends Model
{
    protected $table = "product_managements";
    use \App\Traits\HasBranch;

    protected $fillable = [
        'product_name',
        'product_type',
        'sku',
        'barcode',
        'brand',
        'unit_id',
        'unit_name',
        'product_unit',
        'unit_description',
        'buying_unit_id',
        'qty_in_buying_unit',
        'cost_per_base_unit',
        'product_price',
        'plain_selling_price',
        'printed_selling_price',
        'unit_price',
        'buying_price',
        'description',
        'category_name',
        'category_id',
        'level',
        'reorder_point',
        'low_stock_threshold',
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
        'video',
        'feature',
        'is_enabled',
        'is_featured',
        'is_public',
        'image_1', 'image_2', 'image_3', 'image_4', 'image_5',
        'branch_id',
        'source_store_id',
    ];

    protected $appends = [
        'image_url'
    ];

    /**
     * Get the primary image URL.
     *
     * @return string|null
     */
    public function getImageUrlAttribute()
    {
        if (!$this->image_1) {
            return null;
        }

        if (filter_var($this->image_1, FILTER_VALIDATE_URL)) {
            return $this->image_1;
        }

        return asset('storage/' . $this->image_1);
    }

    protected $casts = [
        'sale_units' => 'array',
        'specifications' => 'array',
        'plain_selling_price' => 'float',
        'printed_selling_price' => 'float',
        'is_enabled' => 'boolean',
        'is_featured' => 'boolean',
        'is_public' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function images()
    {
        return $this->hasMany(ProductManagementImage::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function sourceStore()
    {
        return $this->belongsTo(Store::class, 'source_store_id');
    }
}
