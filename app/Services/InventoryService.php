<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryLog;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockAdjustment;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * InventoryService
 *
 * Centralized service for managing inventory operations.
 * Handles stock movements, transfers, adjustments, and reporting.
 */
class InventoryService
{
    protected function resolveInventoryTypes($type): array
    {
        if (class_exists($type) && is_subclass_of($type, Model::class)) {
            $type = (new $type)->getMorphClass();
        }

        if (in_array($type, ['finished_product', Product::class], true)) {
            return ['finished_product', Product::class];
        }

        if ($type === 'raw_material') {
            return ['raw_material'];
        }

        return [$type];
    }

    /**
     * Get total inventory quantity for a product across all stores or a specific branch
     *
     * @param  int  $productId
     * @param  string  $type  'finished_product' or 'raw_material'
     * @param  int|null  $branchId
     */
    public function getTotalInventoryQuantity($productId, $type = 'finished_product', int|string|null $branchId = null): float
    {
        $types = $this->resolveInventoryTypes($type);

        if (in_array('finished_product', $types) || in_array(Product::class, $types)) {
            $product = Product::with('variants')->find($productId);
            if ($product && $product->variants->isNotEmpty()) {
                $effectiveVariantBranchId = $branchId ?? active_branch_id() ?? session('active_branch_id');
                $variants = $product->variants;
                if ($effectiveVariantBranchId && $effectiveVariantBranchId !== 'all') {
                    $variants = $variants->filter(fn ($v) => ! $v->branch_id || $v->branch_id == 0 || $v->branch_id == $effectiveVariantBranchId);
                }

                return (float) $variants->sum('qty');
            }
        }

        $query = Inventory::where('product_id', $productId)
            ->whereIn('product_type', $types);

        $effectiveBranchId = $branchId ?? active_branch_id() ?? session('active_branch_id');

        if ($effectiveBranchId && $effectiveBranchId !== 'all') {
            $query->where(function ($q) use ($effectiveBranchId) {
                $q->where('branch_id', $effectiveBranchId)
                    ->orWhereNull('branch_id')
                    ->orWhere('branch_id', 0);
            });
        }

        return (float) $query->sum('qty') ?: 0;
    }

    /**
     * Get inventory for a specific product in a store
     *
     * @param  int  $productId
     * @param  int  $storeId
     * @return Inventory|null
     */
    public function getInventory($productId, $storeId, $productType = 'finished_product')
    {
        $productTypes = $this->resolveInventoryTypes($productType);

        // Bypass HasBranch scope — when looking up by store_id, branch filter is redundant and breaks cross-branch store queries
        return Inventory::withoutGlobalScope('branch')
            ->where('product_id', $productId)
            ->whereIn('product_type', $productTypes)
            ->where('store_id', $storeId)
            ->first();
    }

    /**
     * Get inventory quantity for a specific product in a store
     *
     * @param  int  $productId
     * @param  int  $storeId
     * @param  string  $productType
     */
    public function getInventoryQuantity($productId, $storeId, $productType = 'finished_product'): float
    {
        $inv = $this->getInventory($productId, $storeId, $productType);

        return $inv ? (float) $inv->qty : 0.0;
    }

    /**
     * Add stock to inventory
     *
     * @param  int  $productId
     * @param  int  $storeId
     * @param  float  $quantity
     * @param  string  $reference
     * @param  string  $notes
     * @param  int|null  $branchId
     */
    public function addStock($productId, $storeId, $quantity, $reference = 'Manual Addition', $notes = '', $branchId = null, $productType = 'finished_product', $transactionType = 'adjustment'): bool
    {
        try {
            DB::beginTransaction();

            $branchId = $branchId ?? active_branch_id();
            $productTypes = $this->resolveInventoryTypes($productType);

            // Find inventory by product & store (unique combination, branch implied by store)
            $inventory = Inventory::where('product_id', $productId)
                ->whereIn('product_type', $productTypes)
                ->where('store_id', $storeId)
                ->first();

            if (! $inventory) {
                $normalizedType = class_exists($productType) && is_subclass_of($productType, Model::class)
                    ? (new $productType)->getMorphClass()
                    : $productTypes[0];

                $inventory = Inventory::create([
                    'product_id' => $productId,
                    'product_type' => $normalizedType,
                    'store_id' => $storeId,
                    'branch_id' => $branchId,
                    'qty' => 0,
                    'reorder_level' => 10,
                    'overstock_threshold' => 100,
                ]);
            }

            // Update quantity
            $inventory->increment('qty', $quantity);

            // Log detailed transaction record
            InventoryTransaction::create([
                'product_id' => $productId,
                'product_type' => $inventory->product_type,
                'store_id' => $storeId,
                'transaction_type' => $transactionType, // Use production_output, purchase, etc.
                'quantity_in' => $quantity,
                'quantity_out' => 0,
                'reference_type' => 'manual',
                'notes' => $notes ?: $reference,
                'branch_id' => $branchId,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stock addition failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Deduct stock from multiple stores until the total quantity is met.
     * Useful for POS where you don't care which store the stock comes from.
     *
     * @param  int  $productId
     * @param  float  $totalQuantity
     * @param  string  $productType
     * @param  int|null  $branchId
     */
    public function deductFromMultipleStores($productId, $totalQuantity, $productType = 'finished_product', $branchId = null, $referenceType = null, $referenceId = null, $notes = ''): bool
    {
        try {
            DB::beginTransaction();

            $branchId = $branchId ?? (active_branch_id() ?? session('active_branch_id'));
            $productTypes = $this->resolveInventoryTypes($productType);

            // Get all inventories for this product in the current branch, ordered by quantity desc
            $inventories = Inventory::where('product_id', $productId)
                ->whereIn('product_type', $productTypes)
                ->where('qty', '>', 0)
                ->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                        ->orWhereNull('branch_id')
                        ->orWhere('branch_id', 0);
                })
                ->orderBy('qty', 'desc')
                ->get();

            $remaining = $totalQuantity;

            foreach ($inventories as $inv) {
                if ($remaining <= 0) {
                    break;
                }

                $toDeduct = min($inv->qty, $remaining);
                $inv->decrement('qty', $toDeduct);

                // Log transaction
                InventoryTransaction::create([
                    'product_id' => $productId,
                    'product_type' => $inv->product_type,
                    'store_id' => $inv->store_id,
                    'transaction_type' => 'sale',
                    'quantity_in' => 0,
                    'quantity_out' => $toDeduct,
                    'reference_type' => $referenceType ?: 'pos_sale',
                    'reference_id' => $referenceId,
                    'notes' => $notes ?: 'Automatic deduction from POS terminal',
                    'branch_id' => $branchId,
                    'created_by' => Auth::id(),
                ]);

                $remaining -= $toDeduct;
            }

            if ($remaining > 0) {
                // If we still have remaining, take from an existing branch-scoped inventory record or create one
                $inv = Inventory::where('product_id', $productId)
                    ->whereIn('product_type', $productTypes)
                    ->where(function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId)
                            ->orWhereNull('branch_id')
                            ->orWhere('branch_id', 0);
                    })
                    ->first();

                if (! $inv) {
                    $firstStore = Store::where('branch_id', $branchId)->first() ?? Store::first();
                    $inv = Inventory::create([
                        'product_id' => $productId,
                        'product_type' => $productTypes[0],
                        'store_id' => $firstStore->id ?? 1,
                        'qty' => 0,
                        'branch_id' => $branchId,
                    ]);
                }

                $inv->decrement('qty', $remaining);

                InventoryTransaction::create([
                    'product_id' => $productId,
                    'product_type' => $inv->product_type,
                    'store_id' => $inv->store_id,
                    'transaction_type' => 'sale',
                    'quantity_in' => 0,
                    'quantity_out' => $remaining,
                    'reference_type' => $referenceType ?: 'pos_sale_overflow',
                    'reference_id' => $referenceId,
                    'notes' => $notes ?: 'Overflow deduction (insufficient stock)',
                    'branch_id' => $branchId,
                    'created_by' => Auth::id(),
                ]);
            }

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Deduction from multiple stores failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Remove stock from inventory
     *
     * @param  int  $productId
     * @param  int  $storeId
     * @param  float  $quantity
     * @param  string  $reference
     * @param  string  $notes
     * @param  int|null  $branchId
     */
    public function removeStock($productId, $storeId, $quantity, $reference = 'Stock Removal', $notes = '', $branchId = null, $productType = 'finished_product', $transactionType = 'adjustment'): bool
    {
        try {
            DB::beginTransaction();

            $branchId = $branchId ?? active_branch_id();
            $productTypes = $this->resolveInventoryTypes($productType);

            // Find inventory by product & store (unique combination)
            $inventory = Inventory::where('product_id', $productId)
                ->whereIn('product_type', $productTypes)
                ->where('store_id', $storeId)
                ->first();

            if (! $inventory || $inventory->qty < $quantity) {
                DB::rollBack();

                return false; // Insufficient stock
            }

            // Update quantity
            $inventory->decrement('qty', $quantity);

            // Create detailed transaction record
            InventoryTransaction::create([
                'product_id' => $productId,
                'product_type' => $inventory->product_type,
                'store_id' => $storeId,
                'transaction_type' => $transactionType, // Use production_consume, sale, etc.
                'quantity_in' => 0,
                'quantity_out' => $quantity,
                'reference_type' => 'manual',
                'notes' => $notes ?: $reference,
                'branch_id' => $branchId,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stock removal failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Transfer stock between stores
     *
     * @param  int  $productId
     * @param  int  $sourceStoreId
     * @param  int  $destinationStoreId
     * @param  float  $quantity
     * @param  int|null  $branchId
     */
    public function transferStock($productId, $sourceStoreId, $destinationStoreId, $quantity, $branchId = null): bool
    {
        try {
            DB::beginTransaction();

            // Bypass HasBranch global scope — inventory is scoped by store_id, not branch
            $sourceInventory = Inventory::withoutGlobalScope('branch')
                ->where('product_id', $productId)
                ->where('store_id', $sourceStoreId)
                ->first();

            if (! $sourceInventory || $sourceInventory->qty < $quantity) {
                DB::rollBack();

                return false;
            }

            // Use the branch_id from the source inventory record itself
            $branchId = $branchId ?? $sourceInventory->branch_id ?? active_branch_id();

            // Deduct from source
            $prevSourceQty = $sourceInventory->qty;
            $sourceInventory->decrement('qty', $quantity);

            InventoryLog::create([
                'inventory_id' => $sourceInventory->id,
                'user_id' => Auth::id(),
                'operation' => 'decrease',
                'quantity_change' => -$quantity,
                'previous_quantity' => $prevSourceQty,
                'new_quantity' => $sourceInventory->qty,
                'notes' => "Transfer to Store {$destinationStoreId}",
                'branch_id' => $branchId,
            ]);

            // Add to destination — bypass branch scope too
            $destInventory = Inventory::withoutGlobalScope('branch')
                ->where('product_id', $productId)
                ->where('store_id', $destinationStoreId)
                ->first();

            if (! $destInventory) {
                $destInventory = Inventory::withoutGlobalScopes()->create([
                    'product_id' => $productId,
                    'product_type' => $sourceInventory->product_type,
                    'store_id' => $destinationStoreId,
                    'branch_id' => $branchId,
                    'qty' => 0,
                    'reorder_level' => 10,
                    'overstock_threshold' => 100,
                ]);
            }

            $prevDestQty = $destInventory->qty;
            $destInventory->increment('qty', $quantity);

            InventoryLog::create([
                'inventory_id' => $destInventory->id,
                'user_id' => Auth::id(),
                'operation' => 'increase',
                'quantity_change' => $quantity,
                'previous_quantity' => $prevDestQty,
                'new_quantity' => $destInventory->qty,
                'notes' => "Transfer from Store {$sourceStoreId}",
                'branch_id' => $branchId,
            ]);

            // Create transaction records
            InventoryTransaction::create([
                'product_id' => $productId,
                'product_type' => $sourceInventory->product_type,
                'store_id' => $sourceStoreId,
                'transaction_type' => 'transfer',
                'quantity_in' => 0,
                'quantity_out' => $quantity,
                'reference_type' => 'stock_transfer',
                'notes' => "Transfer out to Store {$destinationStoreId}",
                'branch_id' => $branchId,
                'created_by' => Auth::id(),
            ]);

            InventoryTransaction::create([
                'product_id' => $productId,
                'product_type' => $sourceInventory->product_type,
                'store_id' => $destinationStoreId,
                'transaction_type' => 'transfer',
                'quantity_in' => $quantity,
                'quantity_out' => 0,
                'reference_type' => 'stock_transfer',
                'notes' => "Transfer in from Store {$sourceStoreId}",
                'branch_id' => $branchId,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stock transfer failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Get low stock products
     *
     * @param  int|null  $branchId
     * @return Collection
     */
    public function getLowStockProducts($branchId = null)
    {
        $branchId = $branchId ?? active_branch_id();

        return Inventory::where('branch_id', $branchId)
            ->whereRaw('qty <= reorder_level')
            ->with('product')
            ->get();
    }

    /**
     * Get overstock products
     *
     * @param  int|null  $branchId
     * @return Collection
     */
    public function getOverstockProducts($branchId = null)
    {
        $branchId = $branchId ?? active_branch_id();

        return Inventory::where('branch_id', $branchId)
            ->whereRaw('qty > overstock_threshold')
            ->where('overstock_threshold', '>', 0)
            ->with('product')
            ->get();
    }

    /**
     * Get inventory movements for a product
     *
     * @param  int  $productId
     * @param  Carbon|null  $startDate
     * @param  Carbon|null  $endDate
     * @param  int|null  $branchId
     * @return Collection
     */
    public function getInventoryMovements($productId, $startDate = null, $endDate = null, $branchId = null)
    {
        $effectiveBranchId = $branchId ?? active_branch_id();
        $query = InventoryTransaction::where('product_id', $productId)
            ->where(function ($q) use ($effectiveBranchId) {
                $q->where('branch_id', $effectiveBranchId)
                    ->orWhereNull('branch_id')
                    ->orWhere('branch_id', 0);
            });

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get inventory valuation
     *
     * @param  int|null  $branchId
     */
    public function getInventoryValuation(int|string|null $branchId = null): float
    {
        $branchId = $branchId ?? active_branch_id() ?? session('active_branch_id');

        $query = Inventory::with(['product']);

        if ($branchId && $branchId !== 'all') {
            $query->where('branch_id', $branchId);
        }

        return $query->get()
            ->sum(function ($inventory) {
                // Determine the cost/price per unit
                // Product has buying_price; RawMaterial has cost_per_unit
                $item = $inventory->product;
                if (! $item) {
                    return 0;
                }

                $type = $inventory->product_type;
                $price = (float) ($item->buying_price ?? $item->cost_per_unit ?? 0);
                $qty = (float) ($inventory->qty ?? 0);

                // Special case for rolls: use precise length-based valuation if it's the active unit
                if (isset($item->is_roll) && $item->is_roll && ($item->total_length ?? 0) > 0) {
                    // Logic: Value = (qty-1) * full price + (remaining_length/total_length) * full price
                    $fullPrice = (float) ($item->cost_per_unit ?? 0);
                    $fullUnitsValue = ($qty > 1) ? (($qty - 1) * $fullPrice) : 0;

                    $remainingLength = (float) ($item->remaining_length ?? $item->total_length ?? 0);
                    $ratio = $remainingLength / $item->total_length;
                    $partialUnitValue = ($qty >= 1) ? ($ratio * $fullPrice) : (($qty > 0) ? ($qty * $fullPrice) : 0);

                    return $fullUnitsValue + $partialUnitValue;
                }

                return $qty * $price;
            });
    }

    /**
     * Get stock report for a store
     *
     * @param  int  $storeId
     * @param  int|null  $branchId
     * @return Collection
     */
    public function getStoreStockReport($storeId, $branchId = null)
    {
        return Inventory::where('store_id', $storeId)
            ->where('branch_id', $branchId ?? active_branch_id())
            ->with('product')
            ->get();
    }

    /**
     * Adjust stock level (correction)
     *
     * @param  int  $productId
     * @param  int  $storeId
     * @param  float  $newQuantity
     * @param  string  $reason
     * @param  int|null  $branchId
     */
    public function adjustStock($productId, $storeId, $newQuantity, $reason = 'Inventory Adjustment', $branchId = null): bool
    {
        try {
            DB::beginTransaction();

            $branchId = $branchId ?? active_branch_id();

            $inventory = Inventory::where('product_id', $productId)
                ->where('store_id', $storeId)
                ->where('branch_id', $branchId)
                ->first();

            if (! $inventory) {
                DB::rollBack();

                return false;
            }

            $oldQuantity = $inventory->qty;
            $difference = $newQuantity - $oldQuantity;

            $inventory->update(['qty' => $newQuantity]);

            InventoryLog::create([
                'inventory_id' => $inventory->id,
                'user_id' => Auth::id(),
                'operation' => $difference >= 0 ? 'increase' : 'decrease',
                'quantity_change' => $difference,
                'previous_quantity' => $oldQuantity,
                'new_quantity' => $newQuantity,
                'notes' => $reason,
                'branch_id' => $branchId,
            ]);

            InventoryTransaction::create([
                'product_id' => $productId,
                'store_id' => $storeId,
                'transaction_type' => 'stock_adjustment',
                'quantity' => abs($difference),
                'reference' => $reason,
                'notes' => "Adjusted from {$oldQuantity} to {$newQuantity}",
                'branch_id' => $branchId,
            ]);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stock adjustment failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Facade for adjustStock to match controller calls
     */
    public function adjustInventory($productId, $quantity, $storeId, $type = 'increase', $reference = 'Manual', $notes = '', $branchId = null, $productType = 'finished_product', $unused = null, $unused2 = null, $branchIdAlt = null): bool
    {
        // Use provided branchId or fallback
        $effectiveBranchId = $branchId ?? $branchIdAlt ?? active_branch_id();

        if ($type === 'increase') {
            return $this->addStock($productId, $storeId, $quantity, $reference, $notes, $effectiveBranchId, $productType);
        } else {
            return $this->removeStock($productId, $storeId, $quantity, $reference, $notes, $effectiveBranchId, $productType);
        }
    }

    /**
     * Approve and apply a stock adjustment
     */
    public function approveAdjustment($adjustmentId)
    {
        try {
            DB::beginTransaction();

            $adjustment = StockAdjustment::findOrFail($adjustmentId);

            if ($adjustment->status === 'Approved') {
                throw new \Exception('Adjustment is already approved.');
            }

            $productId = $adjustment->product_id;
            $productType = $adjustment->product_type;

            // Resolve morph class to ensure consistency (e.g. App\Models\Product -> finished_product)
            if (class_exists($productType) && is_subclass_of($productType, Model::class)) {
                $productType = (new $productType)->getMorphClass();
            }

            $storeId = $adjustment->store_id;
            $quantity = (float) $adjustment->quantity;
            $branchId = $adjustment->branch_id;

            // Find existing inventory by product+store (ignore branch_id for lookup to avoid duplicates)
            $inventory = Inventory::firstOrCreate(
                [
                    'product_id' => $productId,
                    'product_type' => $productType,
                    'store_id' => $storeId,
                ],
                [
                    'qty' => 0,
                    'branch_id' => $branchId,
                    'reorder_level' => 0,
                    'overstock_threshold' => 0,
                ]
            );

            $oldQty = (float) $inventory->qty;

            // Note: Adjustment quantity is already positive or negative based on the UI?
            // Usually adjustments are "Correction to X" or "Add/Remove X".
            // Implementation logic: we take the quantity provided as a correction.
            // If the adjustment type is Damage/Loss/Expiry, it's a REMOVAL.

            $finalQtyChange = 0;
            if (in_array($adjustment->adjustment_type, ['Damage', 'Loss', 'Expiry'])) {
                $finalQtyChange = -abs($quantity);
            } else {
                // Correction type depends on the quantity sign provided
                $finalQtyChange = $quantity;
            }

            $inventory->increment('qty', $finalQtyChange);

            // If this adjustment targets a manufactured color variant, adjust that variant stock too.
            if (in_array($productType, ['finished_product', 'App\\Models\\Product']) && ! empty($adjustment->variant_id)) {
                $variant = ProductVariant::where('id', $adjustment->variant_id)
                    ->where('product_id', $productId)
                    ->first();

                if (! $variant) {
                    throw new \Exception('Selected variant was not found for this product.');
                }

                $variant->qty = (float) $variant->qty + $finalQtyChange;
                $variant->save();
            }

            // Create transaction log
            InventoryTransaction::create([
                'product_id' => $productId,
                'product_type' => $productType,
                'store_id' => $storeId,
                'transaction_type' => 'adjustment',
                'quantity_in' => $finalQtyChange > 0 ? abs($finalQtyChange) : 0,
                'quantity_out' => $finalQtyChange < 0 ? abs($finalQtyChange) : 0,
                'reference_type' => 'stock_adjustment',
                'reference_id' => $adjustment->id,
                'notes' => $adjustment->reason
                    .(! empty($adjustment->variant_color) ? " [Color: {$adjustment->variant_color}]" : '')

                    .($adjustment->notes ? ' - '.$adjustment->notes : ''),
                'branch_id' => $branchId,
                'created_by' => Auth::id(),
            ]);

            $adjustment->update([
                'status' => 'Approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Deduct inventory considering source store (for manufactured products).
     * If product has a source_store_id, deduct from there.
     * Otherwise, deduct from multiple stores in the branch.
     *
     * @param  int  $productId  Product ID
     * @param  float  $quantity  Quantity to deduct
     * @param  string  $productType  Product type (finished_product, etc.)
     * @param  int|null  $branchId  Branch ID (falls back to active branch)
     * @param  string|null  $referenceType  Reference type (Sale::class, etc.)
     * @param  int|null  $referenceId  Reference ID (sale ID, etc.)
     * @param  string  $notes  Additional notes
     * @return bool True if successful, false otherwise
     */
    public function deductInventoryWithSourceStore(
        $productId,
        $quantity,
        $productType = 'finished_product',
        $branchId = null,
        $referenceType = null,
        $referenceId = null,
        $notes = ''
    ): bool {
        try {
            DB::beginTransaction();

            $branchId = $branchId ?? active_branch_id() ?? session('active_branch_id');
            $productTypes = $this->resolveInventoryTypes($productType);

            // Load product management without branch scope because source store can belong to another branch.
            $product = Product::withoutGlobalScope('branch')
                ->with([
                    'productManagement' => fn ($query) => $query->withoutGlobalScope('branch'),
                ])
                ->find($productId);

            if (! $product || ! $product->productManagement) {
                DB::rollBack();

                return false;
            }

            $sourceStoreId = $product->productManagement->source_store_id;

            if ($sourceStoreId) {
                // Product has a source store - deduct from there
                $removed = $this->removeStock(
                    $productId,
                    $sourceStoreId,
                    $quantity,
                    $referenceType ?: 'Source Store Deduction',
                    $notes ?: 'Automatic deduction from source store',
                    $branchId,
                    $productType,
                    'sale'
                );

                if ($removed) {
                    DB::commit();

                    return true;
                }
            }

            // Fallback to multiple stores if no source store or if removeStock from source store returned false
            DB::rollBack(); // Release transaction opened above

            return $this->deductFromMultipleStores(
                $productId,
                $quantity,
                $productType,
                $branchId,
                $referenceType,
                $referenceId,
                $notes
            );
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Inventory deduction with source store failed: '.$e->getMessage());

            return false;
        }
    }

    public function deductVariantStock(int $productId, int $variantId, float $quantity, ?string $printType = null): bool
    {
        try {
            $variant = ProductVariant::where('id', $variantId)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if (! $variant) {
                throw new \Exception('Product variant not found.');
            }

            $field = match ($printType) {
                'plain' => 'plain_qty',
                'printed' => 'printed_qty',
                default => 'qty',
            };

            $specificAvailable = (float) ($variant->{$field} ?? 0);
            $useSpecificBucket = $field !== 'qty' && $specificAvailable > 0;
            $available = $useSpecificBucket ? $specificAvailable : (float) $variant->qty;

            if ($available < $quantity) {
                throw new \Exception("Insufficient variant stock for {$variant->color}. Available: {$available}, Requested: {$quantity}");
            }

            if ($useSpecificBucket) {
                $variant->{$field} = $specificAvailable - $quantity;
                $variant->qty = max(0, (float) $variant->qty - $quantity);
            } else {
                $variant->qty = max(0, (float) $variant->qty - $quantity);
            }

            $variant->save();

            return true;
        } catch (\Exception $e) {
            Log::error('Variant stock deduction failed: '.$e->getMessage());
            throw $e;
        }
    }
}
