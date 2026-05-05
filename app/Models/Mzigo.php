<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mzigo extends Model
{
  
    use \App\Traits\HasBranch;

    protected $fillable=[
         'product_id',
         'product_uniq',
         'pro_quantity', 
         'branch_id',
    ];
}
