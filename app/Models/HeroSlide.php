<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasBranch;

class HeroSlide extends Model
{
    use HasFactory, HasBranch;

    protected $fillable = [
        'branch_id',
        'title',
        'subtitle',
        'page_type',
        'sort_order',
        'is_active',
        'is_ad',
        'button_text',
        'button_link',
        'image_path',
        'background_color',
        'overlay_opacity',
    ];
}

