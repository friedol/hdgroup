<?php

namespace App\Models;

use App\Services\InventoryService;
use App\Traits\HasBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasBranch, HasFactory;

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $query->where('product_name', 'like', '%'.request('search').'%')
                ->orwhere('product_id', 'like', '%'.request('search').'%')
                ->orwhere('store_name', 'like', '%'.request('search').'%')
                ->orwhere('created_at', 'like', '%'.request('search').'%');
        }
    }

    protected $fillable = [
        'product_id',
        'product_management_id',
        'product_name',
        'product_type',
        // 'unit_id',
        // 'unit_name',
        // 'product_unit',
        // 'unit_description',
        'product_price',
        'unit_price',
        'buying_price',
        // 'description',
        // 'category_name',
        'category_id',
        'level',
        'video',
        'feature',
        'is_enabled',
        'branch_id',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public static function single($id)
    {
        $products = self::all();

        foreach ($products as $product) {
            if ($product['id'] == $id) {
                return $product;
            }
        }
    }

    public function inventories()
    {
        return $this->morphMany(Inventory::class, 'product', 'product_type', 'product_id');
    }

    public function getCurrentStockAttribute()
    {
        return (new InventoryService)->getTotalInventoryQuantity($this->id, 'finished_product', 'all');
    }

    protected $appends = ['current_stock', 'average_rating', 'reviews_count'];

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function getAverageRatingAttribute()
    {
        return round($this->reviews()->avg('rating'), 1) ?: 0;
    }

    public function getReviewsCountAttribute()
    {
        return $this->reviews()->count();
    }

    public function productManagement()
    {
        return $this->belongsTo(ProductManagement::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function specifications()
    {
        return $this->hasOne(ProductSpecification::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }
}
