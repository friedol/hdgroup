<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * Trait HasBranch
 *
 * Provides multi-tenant branch scoping for Eloquent models.
 * Automatically ensures all queries are filtered by the active branch.
 *
 * Usage:
 * 1. Add `use HasBranch;` to your model
 * 2. Ensure `branch_id` column exists in the database table
 * 3. All queries will automatically be scoped to the active branch
 */
trait HasBranch
{
    /**
     * Boot the trait - attach the global scope when model is instantiated
     */
    protected static function bootHasBranch(): void
    {
        static::creating(function ($model) {
            // Auto-set branch_id only when it was never explicitly provided.
            // If branch_id is explicitly null, respect it (means "global / all branches").
            if (! array_key_exists('branch_id', $model->getAttributes())) {
                $model->branch_id = active_branch_id();
            }
        });

        // Add global scope to filter records by active branch
        static::addGlobalScope('branch', function (Builder $builder) {
            $branchId = active_branch_id();
            if ($branchId) {
                $builder->where($builder->getModel()->getTable().'.branch_id', $branchId);
            }
        });
    }

    /**
     * Scope to filter records for a specific branch
     */
    public function scopeForBranch(Builder $query, ?int $branchId = null): Builder
    {
        return $query->where($this->getTable().'.branch_id', $branchId ?? active_branch_id());
    }

    /**
     * Get the branch_id value for this model instance
     */
    public function getBranchId(): ?int
    {
        return $this->branch_id;
    }

    /**
     * Set the branch_id value for this model instance
     *
     * @return $this
     */
    public function setBranchId(int $branchId)
    {
        $this->branch_id = $branchId;

        return $this;
    }
}
