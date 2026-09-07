<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExitClearance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'resignation_date',
        'last_working_day',
        'reason',
        'status',
        'assets_returned',
        'payroll_cleared',
        'exit_interview_notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
