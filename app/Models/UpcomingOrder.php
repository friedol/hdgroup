<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UpcomingOrder extends Model
{
    /** @use HasFactory<\Database\Factories\UpcomingOrderFactory> */
    use HasFactory, \App\Traits\HasBranch;
    public $fillable = [
        'order_name',
        'is_published','published_date',
        'branch_id',
    ];
    function upcomingProducts()
    {
        return $this->HasMany(UpcomingProduct::class);
    }
}
