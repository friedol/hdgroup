<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
   public $table = "feedbacks";
   protected $fillable=[
        'name',
        'phone',
        'inquire',
        'message',
     ];
}
