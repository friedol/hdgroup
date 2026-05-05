<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    //
    protected $fillable = [
        'role_id', 'role_name', 'scope_type'
    ];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_roles');
    }
}
