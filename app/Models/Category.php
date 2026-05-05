<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    //
    public $table = "categories";
    use \App\Traits\HasBranch;

    protected $fillable = [
        'category_name',
        'branch_id',
        'image_url',
    ];

    public function products()
    {
        return $this->hasManyThrough(
            Product::class,
            ProductManagement::class,
            'category_id',
            'product_management_id',
            'id',
            'id'
        );
    }
}
