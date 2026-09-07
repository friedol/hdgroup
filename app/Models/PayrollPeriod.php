<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_name',
        'start_date',
        'end_date',
        'status',
        'total_gross',
        'total_net',
    ];

    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }
}
