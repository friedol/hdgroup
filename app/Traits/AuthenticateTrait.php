<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

/**
 * Trait AuthenticateTrait
 * 
 * Provides authentication helper methods for controllers.
 */
trait AuthenticateTrait
{
    /**
     * Check if user is authenticated
     * 
     * @return bool
     */
    public function isAuthenticated(): bool
    {
        return Auth::check();
    }

    /**
     * Get currently authenticated user
     * 
     * @return \App\Models\User|null
     */
    public function getCurrentUser()
    {
        return Auth::user();
    }

    /**
     * Check if user has a specific permission
     * 
     * @param string $permission
     * @return bool
     */
    public function hasPermission(string $permission): bool
    {
        $user = Auth::user();
        return $user && $user->hasPermission($permission);
    }

    /**
     * Check if user has a specific role
     * 
     * @param string $roleName
     * @return bool
     */
    public function hasRole(string $roleName): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        
        return $user->roles->contains('role_name', $roleName);
    }

    /**
     * Check if user is global admin
     * 
     * @return bool
     */
    public function isGlobalAdmin(): bool
    {
        $user = Auth::user();
        return $user && ($user->is_global ?? false);
    }

    /**
     * Redirect user by their role
     * 
     * @return \Illuminate\Http\RedirectResponse
     */
    public function redirectByRole()
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }

        $roleName = $user->roles->first()?->role_name ?? 
                    ($user->role?->role_name ?? 'Staff');

        return match ($roleName) {
            'Admin', 'SuperAdmin' => redirect()->route('dashboard'),
            'CEO' => redirect()->route('dashboard'),
            'Branch Manager' => redirect()->route('dashboard'),
            'Accountant Manager' => redirect()->route('dashboard'),
            'Seller' => redirect()->route('dashboard'),
            'Storekeeper' => redirect()->route('dashboard'),
            default => redirect()->route('dashboard')
        };
    }

    /**
     * Get user's active branch
     * 
     * @return int|null
     */
    public function getActiveBranch()
    {
        return active_branch_id();
    }

    /**
     * Check if user can access a specific branch
     * 
     * @param int $branchId
     * @return bool
     */
    public function canAccessBranch(int $branchId): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }

        // Global users can access all branches
        if ($user->is_global ?? false) {
            return true;
        }

        // Branch users can only access their branch
        return $user->branch_id === $branchId;
    }
}
