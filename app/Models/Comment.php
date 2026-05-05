<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    public function scopeFilter($query, array $filters){
        if($filters['search'] ?? false){
            $query->where('created_at' , 'like' , '%' . request('search') . '%')
            ->orwhere('product_name' , 'like' , '%' . request('search') . '%');
        }
    }

    protected $fillable = [
        'product_name',
        'comment',
        'store_name',
        'commented_staff',
    ];
}
