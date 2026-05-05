<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\HasBranch;

class Order extends Model
{
    use HasFactory, HasBranch;

    public function scopeFilter($query, array $filters){
        if($filters['search'] ?? false){
            $query->where('id', 'like' , '%' . request('search') . '%')
            ->orwhere('container_id' , 'like' , '%' . request('search') . '%')
            ->orwhere('order_name' , 'like' , '%' . request('search') . '%');
        }
    }

    protected $fillable = [
        'unique_id',
        'order_name',
        'staff_name',
        'container_id',
        'product_name',
        'quantity',
        'product_id',
        'manifest_id',
        'total_weight',
        'total_cbm',
        'branch_id',
    ];

    public static function find($id){
        $orders = self::all();

        foreach ($orders as $order) {
           if($order['id'] == $id){
            return $order;
           }
        }
    }

    public function post()
    {
        return $this->belongsTo(Post::class,'product_id','product_id');
    }

    public function container()
    {
        return $this->belongsTo(Container::class,'container_id');
    }

    public function manifest()
    {
        return $this->belongsTo(LogisticsManifest::class, 'manifest_id');
    }
}
