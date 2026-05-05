<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class BranchScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (Auth::check()) {
            $user = Auth::user();

            // 1. Developer bypass (Global visibility)
            if ($user->staff_email === 'developer@gmail.com') {
                return;
            }

            // 2. Check if user has any global role or is marked as global
            if ($user->isGlobal()) {
                return;
            }

            // 3. Enforce Branch Isolation for branch-scoped users
            if ($user->branch_id !== null) {
                $builder->where($model->getTable() . '.branch_id', $user->branch_id);
            }
        }
    }
}
