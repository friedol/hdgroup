<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductManagementImage extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'product_managements_images';

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = ['image_url'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'product_management_id',
        'product_id',
        'image_path',
        'is_featured',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_featured' => 'boolean',
    ];

    /**
     * Get the product that owns the image.
     */
    public function product()
    {
        return $this->belongsTo(ProductManagement::class, 'product_management_id');
    }

    /**
     * Get the full URL for the image.
     *
     * @return string|null
     */
    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return null;
        }

        if (filter_var($this->image_path, FILTER_VALIDATE_URL)) {
            return $this->image_path;
        }

        return asset('storage/' . $this->image_path);
    }

    /**
     * Scope a query to only include featured images.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
