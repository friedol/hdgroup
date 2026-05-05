<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    /** @use HasFactory<\Database\Factories\UnitFactory> */
    use HasFactory, \App\Traits\HasBranch;
    public $table = 'units';
    protected $fillable = [
        'unit_name',
        'symbol',
        'branch_id',
    ];
}
