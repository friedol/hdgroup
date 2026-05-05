<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    public function scopeFilter($query, array $filters){
        if($filters['search'] ?? false){
            $query->where('staff_id', 'like' , '%' . request('search') . '%')
            ->orwhere('staff_name' , 'like' , '%' . request('search') . '%');
        }
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [ 
        'staff_id',
        'staff_name',
        'role_id',
        'staff_email',
        'country',
        'tin_number',
        'staff_phone',
        'username',
        'password',
        'profile',
        'location',
        'salary',
        'joining_date',
        'address',
        'emergency_contact',
        'branch_id',
        'is_global',
        'access_start_time',
        'access_end_time',
        'is_time_restricted',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Standard Inertia appends
     */
    protected $appends = ['name', 'email', 'role_name'];

    public function getRoleNameAttribute()
    {
        return $this->role->role_name ?? "User";
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions');
    }

    public function hasPermission($slug)
    {
        // 1. Developer Bypass
        if ($this->staff_email === 'developer@gmail.com') {
            return true;
        }

        // 2. Direct role_id = 1 check (CEO role is always role_id 1 by convention)
        //    Also check the belongsTo role name directly for privileged roles
        $directRole = $this->role; // belongsTo via role_id
        if ($directRole && in_array($directRole->role_name, ['CEO', 'SuperAdmin', 'Admin'])) {
            return true;
        }

        // 3. Legacy fallback: role_id = 1 historically means CEO/SuperAdmin
        if ($this->role_id == 1) {
            return true;
        }

        // 4. Check Direct Permissions on user
        if ($this->permissions->contains('slug', $slug)) {
            return true;
        }

        // 5. Check Role-Based Permissions (Many-to-Many roles via user_roles)
        $allRoles = $this->roles->toBase()->merge([$directRole])->filter();

        foreach ($allRoles as $role) {
            if ($role->permissions->contains('slug', $slug)) {
                return true;
            }

            // CEO/SuperAdmin/Admin bypass
            if (in_array($role->role_name, ['CEO', 'SuperAdmin', 'Admin'])) {
                return true;
            }
        }

        return false;
    }

    public function getAllPermissionSlugs()
    {
        if ($this->staff_email === 'developer@gmail.com') {
            return ['*'];
        }

        $directRole = $this->role;
        if ($directRole && in_array($directRole->role_name, ['CEO', 'SuperAdmin', 'Admin'])) {
            return ['*'];
        }

        if ($this->role_id == 1) {
            return ['*'];
        }

        $direct = $this->permissions->pluck('slug')->toArray();
        
        $rolePermissions = $this->roles->flatMap(function($role) {
            return $role->permissions->pluck('slug');
        })->toArray();

        $primaryRolePermissions = $directRole ? $directRole->permissions->pluck('slug')->toArray() : [];

        // Check if any role is a super role
        $allRoles = $this->roles->toBase()->merge([$directRole])->filter();
        foreach ($allRoles as $role) {
            if (in_array($role->role_name, ['CEO', 'SuperAdmin', 'Admin'])) {
                return ['*'];
            }
        }

        return array_values(array_unique(array_merge($direct, $rolePermissions, $primaryRolePermissions)));
    }

    public function isGlobal()
    {
        if ($this->is_global) return true;
        if ($this->staff_email === 'developer@gmail.com') return true;
        
        // Check current primary role
        $role = $this->role;
        if ($role && ($role->scope_type === 'global' || in_array($role->role_name, ['CEO', 'SuperAdmin', 'Admin']))) {
            return true;
        }

        // Check any of the assigned roles
        foreach ($this->roles as $r) {
            if ($r->scope_type === 'global' || in_array($r->role_name, ['CEO', 'SuperAdmin', 'Admin'])) {
                return true;
            }
        }

        return false;
    }

    public function canSwitchBranch()
    {
        if ($this->staff_email === 'developer@gmail.com') return true;
        
        // Roles that can switch branches (CEO, Finance Manager, General Manager)
        $privilegedRoles = [
            'CEO',
            'SuperAdmin',
            'Admin',
            'General Manager',      // Manager role
            'Accountant Manager',   // Finance Global role
            'Finance Manager',
            'HR',
            'HDGROUP Manager',
            'Manager'
        ];
        
        // Check primary role
        $role = $this->role;
        if ($role) {
            // Allow if role has global scope OR is in privileged roles list
            if ($role->scope_type === 'global' || in_array($role->role_name, $privilegedRoles)) {
                return true;
            }
        }

        // Check assigned roles
        foreach ($this->roles as $r) {
            if ($r->scope_type === 'global' || in_array($r->role_name, $privilegedRoles)) {
                return true;
            }
        }

        return false;
    }


    public function sales()
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }

    public function staffSales()
    {
        return $this->hasMany(Sale::class, 'user_id');
    }

    public function stockAdjustments()
    {
        return $this->hasMany(StockAdjustment::class, 'user_id');
    }

    public function loans()
    {
        return $this->hasMany(Loan::class, 'sale_id', 'id'); // Adjusting based on Sale relationship if needed, or direct
    }

    public function getNameAttribute()
    {
        return $this->staff_name;
    }

    public function getEmailAttribute()
    {
        return $this->staff_email;
    }

    public function getEmailForVerification()
    {
        return $this->staff_email;
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function isCustomer()
    {
        return $this->role_id == 12;
    }
}
