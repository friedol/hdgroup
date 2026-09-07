<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReturn;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    /**
     * Store a new purchase and its items.
     * Updates product prices if requested.
     */
    public function createPurchase(array $data)
    {
        DB::beginTransaction();
        try {
            // Generate purchase number
            $purchaseNumber = 'PUR-'.date('ymd').'-'.rand(1000, 9999);

            $purchase = Purchase::create([
                'purchase_number' => $purchaseNumber,
                'invoice_number' => $data['invoice_number'] ?? null,
                'supplier_id' => $data['supplier_id'],
                'branch_id' => active_branch_id(),
                'user_id' => auth()->id(),
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'total_amount' => $data['total_amount'],
                'status' => $data['status'] ?? 'Pending',
                'purchase_date' => $data['purchase_date'] ?? now()->toDateString(),
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'buying_price' => $itemData['buying_price'],
                    'selling_price' => $itemData['selling_price'] ?? null,
                    'total' => $itemData['total'],
                    'batch_number' => $itemData['batch_number'] ?? null,
                    'expiry_date' => $itemData['expiry_date'] ?? null,
                ]);

                // Handle price updates
                $updateBuying = $itemData['update_buying_price'] ?? false;
                $updateSelling = $itemData['update_selling_price'] ?? false;

                if ($updateBuying || $updateSelling) {
                    $this->updateProductPrices(
                        $product,
                        $updateBuying ? $itemData['buying_price'] : $product->cost_price,
                        $updateSelling ? $itemData['selling_price'] : $product->price,
                        'Purchase '.$purchase->purchase_number
                    );
                }
            }

            // If status is received/completed, add to inventory
            if (in_array($purchase->status, ['Received', 'Completed'])) {
                $this->receivePurchase($purchase);
            }

            DB::commit();

            return $purchase;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Updates product prices and logs history
     */
    public function updateProductPrices(Product $product, $newBuying, $newSelling, $reason = null)
    {
        $oldBuying = $product->cost_price ?? 0;
        $oldSelling = $product->price ?? 0;

        // Skip if no actual change
        if ($oldBuying == $newBuying && $oldSelling == $newSelling) {
            return;
        }

        ProductPriceHistory::create([
            'product_id' => $product->id,
            'user_id' => auth()->id() ?? 1,
            'previous_buying_price' => $oldBuying,
            'new_buying_price' => $newBuying,
            'previous_selling_price' => $oldSelling,
            'new_selling_price' => $newSelling,
            'reason' => $reason,
        ]);

        $product->update([
            'cost_price' => $newBuying,
            'price' => $newSelling,
        ]);
    }

    /**
     * Add purchase items to inventory
     */
    public function receivePurchase(Purchase $purchase)
    {
        $inventoryService = new InventoryService;

        foreach ($purchase->items as $item) {
            $added = $inventoryService->addStock(
                $item->product_id,
                $purchase->warehouse_id ?? 1, // Default store if null
                $item->quantity,
                'Purchase '.$purchase->purchase_number,
                '',
                $purchase->branch_id,
                'finished_product',
                'purchase'
            );

            if (! $added) {
                throw new \Exception("Failed to add stock for product #{$item->product_id} from purchase {$purchase->purchase_number}.");
            }
        }
    }

    /**
     * Process a return for a purchase
     */
    public function processReturn(Purchase $purchase, array $returnData)
    {
        DB::beginTransaction();
        try {
            $inventoryService = new InventoryService;

            foreach ($returnData['items'] as $itemData) {
                $item = PurchaseItem::findOrFail($itemData['purchase_item_id']);

                PurchaseReturn::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item->product_id,
                    'user_id' => auth()->id(),
                    'quantity_returned' => $itemData['quantity_returned'],
                    'reason' => $itemData['reason'] ?? 'Not specified',
                    'return_date' => now()->toDateString(),
                ]);

                // Reduce stock
                $removed = $inventoryService->removeStock(
                    $item->product_id,
                    $purchase->warehouse_id ?? 1,
                    $itemData['quantity_returned'],
                    'Purchase Return '.$purchase->purchase_number,
                    '',
                    $purchase->branch_id,
                    'finished_product'
                );

                if (! $removed) {
                    throw new \Exception("Insufficient stock to return {$itemData['quantity_returned']} of product #{$item->product_id}.");
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing pending purchase.
     */
    public function updatePurchase(Purchase $purchase, array $data)
    {
        if (in_array($purchase->status, ['Completed', 'Received'])) {
            throw new \Exception('Cannot edit a completed purchase. Please use returns.');
        }

        DB::beginTransaction();
        try {
            $purchase->update([
                'invoice_number' => $data['invoice_number'] ?? null,
                'supplier_id' => $data['supplier_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'total_amount' => $data['total_amount'],
                'purchase_date' => $data['purchase_date'] ?? now()->toDateString(),
                'notes' => $data['notes'] ?? null,
            ]);

            // Clear old items
            $purchase->items()->delete();

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'buying_price' => $itemData['buying_price'],
                    'selling_price' => $itemData['selling_price'] ?? null,
                    'total' => $itemData['total'],
                    'batch_number' => $itemData['batch_number'] ?? null,
                    'expiry_date' => $itemData['expiry_date'] ?? null,
                ]);

                // Handle price updates
                $updateBuying = $itemData['update_buying_price'] ?? false;
                $updateSelling = $itemData['update_selling_price'] ?? false;

                if ($updateBuying || $updateSelling) {
                    $this->updateProductPrices(
                        $product,
                        $updateBuying ? $itemData['buying_price'] : $product->cost_price,
                        $updateSelling ? $itemData['selling_price'] : $product->price,
                        'Purchase Update '.$purchase->purchase_number
                    );
                }
            }

            DB::commit();

            return $purchase;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete a pending purchase.
     */
    public function deletePurchase(Purchase $purchase)
    {
        if (in_array($purchase->status, ['Completed', 'Received'])) {
            throw new \Exception('Cannot delete a completed purchase. Please use returns.');
        }

        DB::beginTransaction();
        try {
            $purchase->items()->delete();
            $purchase->delete();
            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
