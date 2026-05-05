<?php

namespace App\Services;

use App\Models\RawMaterial;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\ProductionBenchmark;
use App\Models\Inventory;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class RollProductionService
{
    private function normalizeBagName(?string $value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', (string) $value));
    }

    /**
     * Calculate yield and efficiency for a roll-based production run
     */
    public function calculateYield(RawMaterial $roll, float $bagWidth, float $bagLength, float $rollLength): array
    {
        $rollWidth = (float) $roll->width;
        
        // Items across the roll width
        $acrossCount = floor($rollWidth / $bagWidth);
        $usedWidth = $acrossCount * $bagWidth;
        $leftoverWidth = $rollWidth - $usedWidth;
        
        // Items along the roll length (length in cm, rollLength in m)
        $lengthCount = floor(($rollLength * 100) / $bagLength);
        
        $maxPossibleBags = $acrossCount * $lengthCount;
        
        // Convert used length back to metres for reporting
        $usedLengthTotal = ($lengthCount * $bagLength) / 100;
        
        return [
            'max_possible_bags' => (int) $maxPossibleBags,
            'across_count' => (int) $acrossCount,
            'length_count' => (int) $lengthCount,
            'used_width' => $usedWidth,
            'leftover_width' => $leftoverWidth,
            'used_length' => $usedLengthTotal,
            'efficiency_percentage' => $rollWidth > 0 ? ($usedWidth / $rollWidth) * 100 : 0
        ];
    }

    /**
     * Execute production for a roll-based order
     */
    public function executeProduction($order, $actualUsedLength, $handleCost = 0, $threadCost = 0, $expectedBags = null, $benchmarkName = null, $rollsUsedOverride = 0)
    {
        try {
            DB::beginTransaction();

            $roll = RawMaterial::findOrFail($order->roll_id);
            $bagsProduced = (float) ($expectedBags ?? $order->bags_produced);

            // 1. CALCULATE COSTS (Kg-based calculation as requested)
            $perRollLength = (float) ($roll->total_length ?: 1);
            if ($roll->cost_per_kg && $roll->weight_kg) {
                // Sourced based on KG: (Total Cost of Roll) / Total Metres
                $fabricCostPerMeter = ($roll->cost_per_kg * $roll->weight_kg) / $perRollLength;
            } else {
                $fabricCostPerMeter = (float) ($roll->cost_per_unit ?? 0) / $perRollLength;
            }

            $fabricCostUsed = $fabricCostPerMeter * (float) $actualUsedLength;
            $accessoryCost = (($handleCost ?? 0) * 2 + ($threadCost ?? 0)) * $bagsProduced;
            $totalCost = $fabricCostUsed + $accessoryCost;
            $revenue = $bagsProduced * (float) ($order->selling_price ?? 0);
            $unitBuyingPrice = $bagsProduced > 0 ? $totalCost / $bagsProduced : 0;

            // 2. DEDUCT RAW MATERIAL (ROLLS) FROM INVENTORY
            $selectedRollsUsed = max(0, (int) $rollsUsedOverride);
            $unitsToDeduct = $selectedRollsUsed > 0
                ? $selectedRollsUsed
                : (int) floor($actualUsedLength / $perRollLength);

            $leftoverLengthUsed = $selectedRollsUsed > 0
                ? 0
                : ($actualUsedLength - ($unitsToDeduct * $perRollLength));

            $morphKey = (new RawMaterial())->getMorphClass();
            $inventoryRecord = Inventory::where('product_id', $roll->id)
                ->where('product_type', $morphKey)
                ->where('qty', '>', 0)
                ->first();

            $sourceStoreId = $inventoryRecord ? $inventoryRecord->store_id : $order->store_id;
            $sourceBranchId = $inventoryRecord ? ($inventoryRecord->branch_id ?? $order->branch_id) : $order->branch_id;

            if ($unitsToDeduct > 0) {
                $removed = (new InventoryService())->removeStock(
                    $roll->id, $sourceStoreId, $unitsToDeduct, 
                    "Production #{$order->id}", "Batch Consumption", 
                    $sourceBranchId, 'raw_material', 'production_consume'
                );
                
                if (!$removed) {
                    // Try to find ANY store with this roll stock in the same branch
                    $totalInBranch = (new InventoryService())->getTotalInventoryQuantity($roll->id, 'raw_material', $sourceBranchId);
                    if ($totalInBranch >= $unitsToDeduct) {
                         (new InventoryService())->deductFromMultipleStores($roll->id, $unitsToDeduct, 'raw_material', $sourceBranchId, 'ProductionOrder', $order->id, "Batch Consumption");
                    }
                }
            }

            // Consumption of partial roll
            $currentRemaining = (float) ($roll->remaining_length > 0 ? $roll->remaining_length : $perRollLength);
            if ($leftoverLengthUsed > 0) {
                if ($currentRemaining >= $leftoverLengthUsed) {
                    $roll->remaining_length = $currentRemaining - $leftoverLengthUsed;
                } else {
                    $roll->remaining_length = $perRollLength - ($leftoverLengthUsed - $currentRemaining);
                    (new InventoryService())->removeStock($roll->id, $sourceStoreId, 1.0, "Production #{$order->id}", "Partial roll used", $sourceBranchId, RawMaterial::class, 'production_consume');
                }
            } else if ($unitsToDeduct == 0 && $actualUsedLength > 0) {
                $roll->remaining_length = $currentRemaining - $actualUsedLength;
                if ($roll->remaining_length <= 0) {
                    $roll->remaining_length = 0;
                    (new InventoryService())->removeStock($roll->id, $sourceStoreId, 1, "Consumed", "", $sourceBranchId, RawMaterial::class, 'production_consume');
                }
            }
            // Keep roll meter/status in sync with inventory units after deductions.
            $remainingUnits = (new InventoryService())->getTotalInventoryQuantity($roll->id, 'raw_material', $sourceBranchId);
            if ($remainingUnits <= 0) {
                $roll->remaining_length = 0;
                $roll->roll_status = 'consumed';
            }

            $roll->save();

            // 3. PRODUCT / VARIANT UPSERT
            $product  = null;
            $benchmark = $benchmarkName ? ProductionBenchmark::where('name', $benchmarkName)->first() : null;
            $rollColor = $roll->color ? ucfirst(trim($roll->color)) : 'Default';

            if ($order->product_id) {
                $product = Product::find($order->product_id);
            } else if ($benchmark) {
                // Prefer exact benchmark mapping first.
                $product = Product::where('product_name', $benchmark->name)
                    ->where('branch_id', $order->branch_id)
                    ->where('product_type', 'manufactured')
                    ->first();

                // Fallback: robust name matching (handles spacing/punctuation differences).
                if (!$product) {
                    $normalizedBenchmark = $this->normalizeBagName($benchmark->name);
                    $product = Product::where('branch_id', $order->branch_id)
                        ->where('product_type', 'manufactured')
                        ->get()
                        ->first(function ($p) use ($normalizedBenchmark) {
                            $normalizedProduct = $this->normalizeBagName($p->product_name ?? '');
                            return $normalizedProduct === $normalizedBenchmark
                                || str_contains($normalizedProduct, $normalizedBenchmark)
                                || str_contains($normalizedBenchmark, $normalizedProduct);
                        });
                }
            }

            if (!$product) {
                $baseRollName = trim(preg_replace('/\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?:cm|mm|m|in)?\s*/i', '', $roll->name));
                $cleanName = $benchmark
                    ? trim($benchmark->name)
                    : (trim(preg_replace('/\s*Bag\s*$/i', '', $baseRollName)) . ' Bag');

                $product = Product::firstOrCreate(
                    ['product_name' => $cleanName, 'branch_id' => $order->branch_id, 'product_type' => 'manufactured'],
                    ['product_id' => 'PRD-ROLL-' . strtoupper(substr(uniqid(), -6)), 'product_price' => $order->selling_price ?? 0, 'is_enabled' => true]
                );
            }

            // Update Product Prices (Branch Level)
            $product->update([
                'product_price' => $order->selling_price ?? $product->product_price,
                'buying_price' => $unitBuyingPrice
            ]);

            // Update Master Product Management (Portfolio Level)
            if ($pm = $product->productManagement) {
                $pm->update([
                    'buying_price' => $unitBuyingPrice,
                    'cost_per_base_unit' => $unitBuyingPrice
                ]);
            }

            // Sync Color Variant with exact calculated Unit Buying Price
            // Sync Color Variant with exact calculated Unit Buying Price
            $variant = \App\Models\ProductVariant::firstOrCreate(
                ['product_id' => $product->id, 'color' => $rollColor, 'branch_id' => $order->branch_id],
                ['qty' => 0, 'buying_price' => $unitBuyingPrice, 'selling_price' => $order->selling_price ?? $product->product_price]
            );
            
            $variant->qty = (float)$variant->qty + $bagsProduced;
            $variant->buying_price = $unitBuyingPrice;
            $variant->selling_price = $order->selling_price ?? $product->product_price;
            $variant->save();

            // 4. ADD FINISHED GOODS STOCK
            (new InventoryService())->addStock(
                $product->id, $order->store_id, $bagsProduced, 
                "Roll Production", "Created from batch #{$order->id}", 
                $order->branch_id, Product::class, 'production_output'
            );

            // 5. UPDATE PRODUCTION ORDER METRICS
            $order->update([
                'status' => 'completed',
                'product_id' => $product->id,
                'bags_produced' => $bagsProduced,
                'actual_used_length' => (float) $actualUsedLength,
                'fabric_cost_used' => (float) $fabricCostUsed,
                'accessory_cost_used' => (float) $accessoryCost,
                'total_cost' => (float) $totalCost,
                'revenue' => (float) $revenue,
                'gross_profit' => (float) $revenue - (float) $totalCost,
            ]);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Roll production execution failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    // Helper methods (Split, Simulate, Stats) remain for context...
}
