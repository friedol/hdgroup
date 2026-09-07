<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_position_id',
        'full_name',
        'email',
        'phone',
        'resume_path',
        'stage',
        'score',
        'notes',
    ];

    public function jobPosition()
    {
        return $this->belongsTo(JobPosition::class);
    }
}
