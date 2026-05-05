<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleChangeLog extends Model
{
    protected $fillable = [
        'invoice_number',
        'changed_by_id',
        'changed_by_name',
        'action',
        'description',
        'changes',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'invoice_number', 'invoice_number');
    }
}
