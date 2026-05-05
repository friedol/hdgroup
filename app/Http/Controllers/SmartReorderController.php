<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\Production;
use App\Models\Sale;
use App\Models\SaleItem;

class SmartReorderController extends Controller
{
    public function dashboard()
    {
        return \Inertia\Inertia::render('Admin/SmartReorder/Dashboard');
    }

    public function getReorderSuggestions()
    {
        $suggestions = $this->generateReorderSuggestions();
        
        return response()->json([
            'suggestions' => $suggestions,
            'critical_count' => $suggestions->where('urgency', 'critical')->count(),
            'warning_count' => $suggestions->where('urgency', 'warning')->count(),
            'info_count' => $suggestions->where('urgency', 'info')->count()
        ]);
    }

    public function getMaterialDepletionPredictions()
    {
        $predictions = Product::where('auto_reorder_enabled', true)
            ->with(['inventory', 'production'])
            ->get()
            ->map(function ($product) {
                $currentStock = $product->inventory?->quantity ?? 0;
                $dailyUsage = $this->calculateDailyUsage($product);
                $productionRate = $this->calculateProductionRate($product);
                $salesVelocity = $this->calculateSalesVelocity($product);
                
                $totalDailyConsumption = $dailyUsage + $productionRate + $salesVelocity;
                
                if ($totalDailyConsumption <= 0) {
                    return null;
                }

                $daysUntilDepletion = $currentStock / $totalDailyConsumption;
                $reorderPoint = $product->reorder_point ?? ($totalDailyConsumption * $product->lead_time_days);
                
                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'current_stock' => $currentStock,
                    'daily_usage' => $dailyUsage,
                    'production_rate' => $productionRate,
                    'sales_velocity' => $salesVelocity,
                    'total_daily_consumption' => $totalDailyConsumption,
                    'days_until_depletion' => round($daysUntilDepletion, 1),
                    'reorder_point' => $reorderPoint,
                    'lead_time_days' => $product->lead_time_days,
                    'safety_stock' => $product->safety_stock,
                    'urgency' => $this->calculateUrgency($daysUntilDepletion, $currentStock, $reorderPoint),
                    'suggested_order_date' => $this->calculateSuggestedOrderDate($daysUntilDepletion, $product->lead_time_days),
                    'suggested_order_quantity' => $this->calculateOptimalOrderQuantity($product, $totalDailyConsumption)
                ];
            })
            ->filter()
            ->sortBy('days_until_depletion')
            ->values();

        return response()->json($predictions);
    }

    public function getCriticalShortageAlerts()
    {
        $criticalAlerts = Product::where('auto_reorder_enabled', true)
            ->with(['inventory'])
            ->get()
            ->filter(function ($product) {
                $currentStock = $product->inventory?->quantity ?? 0;
                $reorderPoint = $product->reorder_point ?? 0;
                
                return $currentStock <= $reorderPoint;
            })
            ->map(function ($product) {
                $currentStock = $product->inventory?->quantity ?? 0;
                $dailyConsumption = $this->calculateTotalDailyConsumption($product);
                
                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'current_stock' => $currentStock,
                    'reorder_point' => $product->reorder_point,
                    'days_of_stock_left' => $dailyConsumption > 0 ? round($currentStock / $dailyConsumption, 1) : 0,
                    'urgency' => $currentStock <= ($product->reorder_point * 0.5) ? 'critical' : 'high',
                    'impact_assessment' => $this->assessShortageImpact($product)
                ];
            })
            ->sortByDesc('urgency')
            ->values();

        return response()->json($criticalAlerts);
    }

    public function getFinishedGoodsDepletion()
    {
        $finishedGoods = Product::where('product_type', 'finished_goods')
            ->where('auto_reorder_enabled', true)
            ->with(['inventory'])
            ->get()
            ->map(function ($product) {
                $currentStock = $product->inventory?->quantity ?? 0;
                $salesVelocity = $this->calculateSalesVelocity($product);
                $productionRate = $this->calculateProductionRate($product);
                
                $netDailyChange = $productionRate - $salesVelocity;
                
                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'current_stock' => $currentStock,
                    'daily_sales' => $salesVelocity,
                    'daily_production' => $productionRate,
                    'net_daily_change' => $netDailyChange,
                    'days_until_depletion' => $netDailyChange < 0 ? round($currentStock / abs($netDailyChange), 1) : null,
                    'trend' => $netDailyChange > 0 ? 'increasing' : ($netDailyChange < 0 ? 'decreasing' : 'stable'),
                    'production_recommendation' => $this->getProductionRecommendation($product, $netDailyChange)
                ];
            })
            ->sortBy('days_until_depletion')
            ->values();

        return response()->json($finishedGoods);
    }

    public function updateReorderSettings(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        
        $validated = $request->validate([
            'auto_reorder_enabled' => 'boolean',
            'reorder_prediction_days' => 'integer|min:1|max:365',
            'reorder_point' => 'numeric|min:0',
            'economic_order_quantity' => 'numeric|min:0',
            'lead_time_days' => 'integer|min:0',
            'safety_stock' => 'numeric|min:0',
            'ordering_cost' => 'numeric|min:0',
            'holding_cost_percentage' => 'numeric|min:0|max:1'
        ]);

        $product->update($validated);

        // Auto-calculate EOQ if not provided
        if ($request->has('calculate_eoq') && $request->calculate_eoq) {
            $product->economic_order_quantity = $this->calculateEOQ($product);
            $product->save();
        }

        return response()->json([
            'message' => 'Reorder settings updated successfully',
            'product' => $product->fresh()
        ]);
    }

    public function generatePurchaseOrders()
    {
        $suggestions = $this->generateReorderSuggestions();
        $purchaseOrders = [];

        foreach ($suggestions as $suggestion) {
            if ($suggestion['urgency'] === 'critical' || $suggestion['urgency'] === 'high') {
                $purchaseOrders[] = [
                    'product_id' => $suggestion['product_id'],
                    'product_name' => $suggestion['product_name'],
                    'suggested_quantity' => $suggestion['suggested_order_quantity'],
                    'urgency' => $suggestion['urgency'],
                    'suggested_order_date' => $suggestion['suggested_order_date'],
                    'estimated_cost' => $suggestion['estimated_cost'],
                    'supplier_info' => $this->getSupplierInfo($suggestion['product_id'])
                ];
            }
        }

        return response()->json([
            'purchase_orders' => $purchaseOrders,
            'total_estimated_cost' => collect($purchaseOrders)->sum('estimated_cost'),
            'generated_at' => now()->toISOString()
        ]);
    }

    private function generateReorderSuggestions()
    {
        return Product::where('auto_reorder_enabled', true)
            ->with(['inventory'])
            ->get()
            ->map(function ($product) {
                $currentStock = $product->inventory?->quantity ?? 0;
                $dailyConsumption = $this->calculateTotalDailyConsumption($product);
                $reorderPoint = $product->reorder_point ?? ($dailyConsumption * $product->lead_time_days);
                
                if ($dailyConsumption <= 0) {
                    return null;
                }

                $daysUntilReorder = ($currentStock - $reorderPoint) / $dailyConsumption;
                $suggestedQuantity = $this->calculateOptimalOrderQuantity($product, $dailyConsumption);
                $estimatedCost = $suggestedQuantity * ($product->cost_price ?? 0);

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'current_stock' => $currentStock,
                    'reorder_point' => $reorderPoint,
                    'daily_consumption' => $dailyConsumption,
                    'days_until_reorder' => round($daysUntilReorder, 1),
                    'suggested_order_quantity' => $suggestedQuantity,
                    'estimated_cost' => $estimatedCost,
                    'urgency' => $this->calculateUrgency($daysUntilReorder, $currentStock, $reorderPoint),
                    'suggested_order_date' => $this->calculateSuggestedOrderDate($daysUntilReorder, $product->lead_time_days)
                ];
            })
            ->filter()
            ->sortBy('days_until_reorder')
            ->values();
    }

    private function calculateDailyUsage($product)
    {
        return Production::where('product_id', $product->id)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->sum('quantity') / 30;
    }

    private function calculateProductionRate($product)
    {
        return Production::where('product_id', $product->id)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->sum('quantity') / 30;
    }

    private function calculateSalesVelocity($product)
    {
        return SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sale_items.product_id', $product->id)
            ->where('sales.created_at', '>=', Carbon::now()->subDays(30))
            ->sum('sale_items.quantity') / 30;
    }

    private function calculateTotalDailyConsumption($product)
    {
        return $this->calculateDailyUsage($product) + $this->calculateSalesVelocity($product);
    }

    private function calculateUrgency($daysUntilDepletion, $currentStock, $reorderPoint)
    {
        if ($currentStock <= $reorderPoint * 0.5) {
            return 'critical';
        } elseif ($currentStock <= $reorderPoint) {
            return 'high';
        } elseif ($daysUntilDepletion <= 7) {
            return 'warning';
        } elseif ($daysUntilDepletion <= 14) {
            return 'info';
        }
        
        return 'low';
    }

    private function calculateSuggestedOrderDate($daysUntilDepletion, $leadTimeDays)
    {
        $orderDate = now()->addDays(max(0, $daysUntilDepletion - $leadTimeDays));
        return $orderDate->format('Y-m-d');
    }

    private function calculateOptimalOrderQuantity($product, $dailyConsumption)
    {
        if ($product->economic_order_quantity > 0) {
            return $product->economic_order_quantity;
        }

        // Calculate EOQ using Wilson formula
        $annualDemand = $dailyConsumption * 365;
        $orderingCost = $product->ordering_cost ?? 50; // Default ordering cost
        $holdingCost = ($product->cost_price ?? 1) * ($product->holding_cost_percentage ?? 0.25);

        if ($annualDemand <= 0 || $holdingCost <= 0) {
            return $dailyConsumption * 30; // Default to 30 days supply
        }

        $eoq = sqrt((2 * $annualDemand * $orderingCost) / $holdingCost);
        
        // Add safety stock
        $safetyStock = $product->safety_stock ?? ($dailyConsumption * $product->lead_time_days * 0.5);
        
        return round($eoq + $safetyStock);
    }

    private function calculateEOQ($product)
    {
        $annualDemand = $product->annual_demand ?? ($this->calculateTotalDailyConsumption($product) * 365);
        $orderingCost = $product->ordering_cost ?? 50;
        $holdingCost = ($product->cost_price ?? 1) * ($product->holding_cost_percentage ?? 0.25);

        if ($annualDemand <= 0 || $holdingCost <= 0) {
            return 0;
        }

        return sqrt((2 * $annualDemand * $orderingCost) / $holdingCost);
    }

    private function assessShortageImpact($product)
    {
        $salesVelocity = $this->calculateSalesVelocity($product);
        $productionRate = $this->calculateProductionRate($product);
        
        if ($salesVelocity > 0) {
            return 'High - Will affect customer orders and sales revenue';
        } elseif ($productionRate > 0) {
            return 'Medium - Will affect production schedules';
        }
        
        return 'Low - Minimal immediate impact';
    }

    private function getProductionRecommendation($product, $netDailyChange)
    {
        if ($netDailyChange < -10) {
            return 'Urgent - Increase production immediately';
        } elseif ($netDailyChange < -5) {
            return 'High - Plan production increase';
        } elseif ($netDailyChange < 0) {
            return 'Medium - Monitor and plan production';
        }
        
        return 'Low - Production levels adequate';
    }

    private function getSupplierInfo($productId)
    {
        // Placeholder - would integrate with supplier management
        return [
            'preferred_supplier' => 'Default Supplier',
            'lead_time' => '7 days',
            'min_order_quantity' => 100
        ];
    }
}
