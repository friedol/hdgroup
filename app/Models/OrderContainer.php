<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderContainer extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'order_containers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'unique_id',
        'order_name',
        'container_id',
        'container_quantity',
        'used_quantity',
        'remaining_quantity',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'container_quantity' => 'decimal:2',
        'used_quantity' => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
    ];

    /**
     * Automatically calculate the remaining quantity whenever a record is saved.
     */
    // public static function boot()
    // {
    //     parent::boot();

    //     static::saving(function ($model) {
    //         $model->remaining_quantity = $model->container_quantity - $model->used_quantity;
    //     });
    // }
}
