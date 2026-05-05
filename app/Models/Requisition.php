<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Requisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'issue_type',
        'subject',
        'description',
        'priority',
        'status',
        'attachment_path',
    ];
}

