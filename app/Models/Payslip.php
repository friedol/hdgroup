<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_period_id',
        'user_id',
        'basic_salary',
        'allowances',
        'overtime_pay',
        'gross_salary',
        'paye_tax',
        'nssf_deduction',
        'loan_deduction',
        'other_deductions',
        'net_salary',
        'status',
    ];

    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
