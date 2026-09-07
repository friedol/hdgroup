<?php

namespace App\Models;

use App\Traits\HasBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasBranch, HasFactory, SoftDeletes;

    protected $fillable = [
        'purchase_number',
        'invoice_number',
        'supplier_id',
        'branch_id',
        'user_id',
        'warehouse_id',
        'total_amount',
        'status',
        'purchase_date',
        'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Store::class, 'warehouse_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
