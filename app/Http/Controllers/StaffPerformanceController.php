<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Inventory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StaffPerformanceController extends Controller
{
    public function dashboard()
    {
        $branches = Branch::select('id', 'name')->get();

        return Inertia::render('Admin/StaffPerformance/Dashboard', [
            'branches' => $branches,
        ]);
    }

    public function getSellerPerformance(Request $request)
    {
        $branchId = $request->get('branch_id');
        $period = $request->get('period', 'month');

        $startDate = $this->getStartDate($period);
        $endDate = Carbon::now();

        $sellers = User::whereHas('role', function ($q) {
            $q->whereNotIn('role_name', ['CEO', 'SuperAdmin', 'Admin']);
        })->whereHas('staffSales', function ($query) use ($startDate, $endDate, $branchId) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        })->with(['staffSales' => function ($query) use ($startDate, $endDate, $branchId) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        }, 'staffSales.items'])->get();

        $performanceData = $sellers->map(function ($seller) use ($startDate, $endDate, $period) {
            $sales = $seller->staffSales;
            $totalSales = $sales->sum('total_amount');
            $totalUnitsSold = $sales->sum(function ($sale) {
                return $sale->items->sum('quantity');
            });
            $totalOrders = $sales->count();

            // Calculate returns
            $returns = $this->calculateReturns($seller->id, $startDate, $endDate);
            $returnRate = $totalUnitsSold > 0 ? ($returns / $totalUnitsSold) * 100 : 0;

            // Calculate conversion rate (assuming leads/opportunities data available)
            $conversionRate = $this->calculateConversionRate($seller->id, $startDate, $endDate);

            // Calculate average order value
            $avgOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

            return [
                'staff_id' => $seller->id,
                'staff_name' => $seller->name,
                'total_sales' => $totalSales,
                'total_units_sold' => $totalUnitsSold,
                'total_orders' => $totalOrders,
                'avg_order_value' => $avgOrderValue,
                'conversion_rate' => $conversionRate,
                'return_rate' => $returnRate,
                'performance_score' => $this->calculateSellerPerformanceScore($totalSales, $conversionRate, $returnRate),
                'ranking' => 0, // Will be calculated after sorting
                'period' => $period,
            ];
        })->sortByDesc('total_sales')->values();

        // Add rankings
        $performanceData = $performanceData->map(function ($item, $index) {
            $item['ranking'] = $index + 1;

            return $item;
        });

        return response()->json($performanceData);
    }

    public function getBranchManagerPerformance(Request $request)
    {
        $branchId = $request->get('branch_id');
        $period = $request->get('period', 'month');

        $startDate = $this->getStartDate($period);
        $endDate = Carbon::now();

        $query = Branch::with(['sales', 'expenses', 'manager']);

        if ($branchId) {
            $query->where('id', $branchId);
        }

        $branches = $query->get();

        $performanceData = $branches->map(function ($branch) use ($startDate, $endDate, $period) {
            $revenue = $branch->sales()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('total_amount');

            $expenses = $branch->expenses()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount');

            $productionCosts = 0;

            $netProfit = $revenue - $expenses - $productionCosts;
            $expenseRatio = $revenue > 0 ? ($expenses / $revenue) * 100 : 100;

            // Calculate production efficiency (removed - set to 0)
            $productionEfficiency = 0;

            // Calculate profit growth
            $profitGrowth = $this->calculateProfitGrowth($branch->id, $startDate, $endDate);

            return [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'manager_name' => $branch->manager->name ?? 'Unassigned',
                'revenue' => $revenue,
                'expenses' => $expenses,
                'production_costs' => $productionCosts,
                'net_profit' => $netProfit,
                'expense_ratio' => $expenseRatio,
                'production_efficiency' => $productionEfficiency,
                'profit_growth' => $profitGrowth,
                'performance_score' => $this->calculateManagerPerformanceScore($netProfit, $expenseRatio, $profitGrowth),
                'ranking' => 0, // Will be calculated after sorting
                'period' => $period,
            ];
        })->sortByDesc('net_profit')->values();

        // Add rankings
        $performanceData = $performanceData->map(function ($item, $index) {
            $item['ranking'] = $index + 1;

            return $item;
        });

        return response()->json($performanceData);
    }

    public function getDeliveryPerformance(Request $request)
    {
        $branchId = $request->get('branch_id');
        $period = $request->get('period', 'month');

        $startDate = $this->getStartDate($period);
        $endDate = Carbon::now();

        // This would typically come from a delivery/logistics system
        // For now, we'll simulate with order data
        $deliveryData = DB::table('orders as o')
            ->join('branches as b', 'o.branch_id', '=', 'b.id')
            ->selectRaw('
                b.id as branch_id,
                b.name as branch_name,
                COUNT(o.id) as total_deliveries,
                SUM(CASE WHEN o.status = "delivered" AND o.delivered_at <= o.expected_delivery_date THEN 1 ELSE 0 END) as on_time_deliveries,
                SUM(CASE WHEN o.status = "failed" OR o.status = "cancelled" THEN 1 ELSE 0 END) as failed_deliveries,
                AVG(DATEDIFF(o.delivered_at, o.created_at)) as avg_delivery_time
            ')
            ->whereBetween('o.created_at', [$startDate, $endDate])
            ->when($branchId, function ($query, $branchId) {
                return $query->where('o.branch_id', $branchId);
            })
            ->groupBy('b.id', 'b.name')
            ->get();

        $performanceData = $deliveryData->map(function ($data) use ($period) {
            $onTimeDeliveryRate = $data->total_deliveries > 0 ? ($data->on_time_deliveries / $data->total_deliveries) * 100 : 0;
            $failedDeliveryRate = $data->total_deliveries > 0 ? ($data->failed_deliveries / $data->total_deliveries) * 100 : 0;

            return [
                'branch_id' => $data->branch_id,
                'branch_name' => $data->branch_name,
                'total_deliveries' => $data->total_deliveries,
                'on_time_deliveries' => $data->on_time_deliveries,
                'failed_deliveries' => $data->failed_deliveries,
                'on_time_delivery_rate' => round($onTimeDeliveryRate, 2),
                'failed_delivery_rate' => round($failedDeliveryRate, 2),
                'avg_delivery_time' => round($data->avg_delivery_time, 1),
                'performance_score' => $this->calculateDeliveryPerformanceScore($onTimeDeliveryRate, $failedDeliveryRate),
                'ranking' => 0, // Will be calculated after sorting
                'period' => $period,
            ];
        })->sortByDesc('on_time_delivery_rate')->values();

        // Add rankings
        $performanceData = $performanceData->map(function ($item, $index) {
            $item['ranking'] = $index + 1;

            return $item;
        });

        return response()->json($performanceData);
    }

    public function getStorekeeperPerformance(Request $request)
    {
        $branchId = $request->get('branch_id');
        $period = $request->get('period', 'month');

        $startDate = $this->getStartDate($period);
        $endDate = Carbon::now();

        $storekeepers = User::whereHas('role', function ($q) {
            $q->whereNotIn('role_name', ['CEO', 'SuperAdmin', 'Admin']);
        })->whereHas('stockAdjustments', function ($query) use ($startDate, $endDate, $branchId) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        })->with(['stockAdjustments' => function ($query) use ($startDate, $endDate, $branchId) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        }])->get();

        $performanceData = $storekeepers->map(function ($storekeeper) use ($startDate, $endDate, $period) {
            $adjustments = $storekeeper->stockAdjustments;

            // Calculate inventory accuracy
            $inventoryAccuracy = $this->calculateInventoryAccuracy($storekeeper->id, $startDate, $endDate);

            // Calculate adjustment frequency
            $adjustmentFrequency = $adjustments->count();

            // Calculate adjustment types
            $positiveAdjustments = $adjustments->where('adjustment_type', 'positive')->count();
            $negativeAdjustments = $adjustments->where('adjustment_type', 'negative')->count();

            // Calculate stock turnover rate
            $stockTurnover = $this->calculateStockTurnover($storekeeper->id, $startDate, $endDate);

            return [
                'staff_id' => $storekeeper->id,
                'staff_name' => $storekeeper->name,
                'inventory_accuracy' => $inventoryAccuracy,
                'adjustment_frequency' => $adjustmentFrequency,
                'positive_adjustments' => $positiveAdjustments,
                'negative_adjustments' => $negativeAdjustments,
                'stock_turnover_rate' => $stockTurnover,
                'performance_score' => $this->calculateStorekeeperPerformanceScore($inventoryAccuracy, $adjustmentFrequency, $stockTurnover),
                'ranking' => 0, // Will be calculated after sorting
                'period' => $period,
            ];
        })->sortByDesc('inventory_accuracy')->values();

        // Add rankings
        $performanceData = $performanceData->map(function ($item, $index) {
            $item['ranking'] = $index + 1;

            return $item;
        });

        return response()->json($performanceData);
    }

    public function getPerformanceTrends(Request $request)
    {
        $role = $request->get('role', 'seller');
        $period = $request->get('period', '30');

        $trends = [];

        switch ($role) {
            case 'seller':
                $trends = $this->getSellerTrends($period);
                break;
            case 'manager':
                $trends = $this->getManagerTrends($period);
                break;
            case 'delivery':
                $trends = $this->getDeliveryTrends($period);
                break;
            case 'storekeeper':
                $trends = $this->getStorekeeperTrends($period);
                break;
        }

        return response()->json($trends);
    }

    public function getPerformanceSummary()
    {
        $summary = [
            'top_performers' => [
                'sellers' => $this->getTopSellers(5),
                'managers' => $this->getTopManagers(3),
                'delivery_staff' => $this->getTopDeliveryStaff(3),
                'storekeepers' => $this->getTopStorekeepers(3),
            ],
            'performance_averages' => [
                'avg_seller_score' => $this->getAverageSellerScore(),
                'avg_manager_score' => $this->getAverageManagerScore(),
                'avg_delivery_score' => $this->getAverageDeliveryScore(),
                'avg_storekeeper_score' => $this->getAverageStorekeeperScore(),
            ],
            'improvement_areas' => $this->getImprovementAreas(),
            'recognition_opportunities' => $this->getRecognitionOpportunities(),
        ];

        return response()->json($summary);
    }

    private function getStartDate($period)
    {
        switch ($period) {
            case 'week':
                return Carbon::now()->subWeek();
            case 'month':
                return Carbon::now()->subMonth();
            case 'quarter':
                return Carbon::now()->subQuarter();
            case 'year':
                return Carbon::now()->subYear();
            default:
                return Carbon::now()->subMonth();
        }
    }

    private function calculateReturns($sellerId, $startDate, $endDate)
    {
        // This would typically come from a returns system
        // For now, we'll estimate based on sales data
        return SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.user_id', $sellerId)
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->sum('quantity') * 0.05; // Assuming 5% return rate
    }

    private function calculateConversionRate($sellerId, $startDate, $endDate)
    {
        // This would typically come from a CRM/leads system
        // For now, we'll estimate based on sales data
        $totalSales = Sale::where('user_id', $sellerId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $totalLeads = $totalSales * 3; // Assuming 3:1 lead-to-sale ratio

        return $totalLeads > 0 ? ($totalSales / $totalLeads) * 100 : 0;
    }

    private function calculateSellerPerformanceScore($totalSales, $conversionRate, $returnRate)
    {
        $salesScore = min(100, ($totalSales / 1000000) * 100); // Normalize to 1M sales
        $conversionScore = $conversionRate;
        $returnScore = max(0, 100 - $returnRate);

        return ($salesScore * 0.5) + ($conversionScore * 0.3) + ($returnScore * 0.2);
    }

    private function calculateProfitGrowth($branchId, $startDate, $endDate)
    {
        $currentPeriodProfit = $this->calculateBranchProfit($branchId, $startDate, $endDate);

        $previousStartDate = Carbon::parse($startDate)->subDays(Carbon::parse($startDate)->diffInDays($endDate));
        $previousEndDate = $startDate;

        $previousPeriodProfit = $this->calculateBranchProfit($branchId, $previousStartDate, $previousEndDate);

        return $previousPeriodProfit > 0 ? (($currentPeriodProfit - $previousPeriodProfit) / $previousPeriodProfit) * 100 : 0;
    }

    private function calculateBranchProfit($branchId, $startDate, $endDate)
    {
        $revenue = Sale::where('branch_id', $branchId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');

        $expenses = DB::table('expenses')
            ->where('branch_id', $branchId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        return $revenue - $expenses;
    }

    private function calculateManagerPerformanceScore($netProfit, $expenseRatio, $profitGrowth)
    {
        $profitScore = min(100, ($netProfit / 500000) * 100); // Normalize to 500K profit
        $expenseScore = max(0, 100 - $expenseRatio);
        $growthScore = max(0, min(100, $profitGrowth + 50)); // Normalize growth

        return ($profitScore * 0.5) + ($expenseScore * 0.3) + ($growthScore * 0.2);
    }

    private function calculateDeliveryPerformanceScore($onTimeRate, $failedRate)
    {
        return ($onTimeRate * 0.7) + (max(0, 100 - $failedRate) * 0.3);
    }

    private function calculateInventoryAccuracy($storekeeperId, $startDate, $endDate)
    {
        // This would typically come from physical inventory counts vs system records
        return 95.0; // Placeholder
    }

    private function calculateStockTurnover($storekeeperId, $startDate, $endDate)
    {
        // Calculate how quickly inventory moves
        return 8.5; // Placeholder
    }

    private function calculateStorekeeperPerformanceScore($inventoryAccuracy, $adjustmentFrequency, $stockTurnover)
    {
        $accuracyScore = $inventoryAccuracy;
        $adjustmentScore = max(0, 100 - ($adjustmentFrequency * 2)); // Fewer adjustments is better
        $turnoverScore = min(100, $stockTurnover * 10); // Normalize turnover

        return ($accuracyScore * 0.5) + ($adjustmentScore * 0.2) + ($turnoverScore * 0.3);
    }

    private function getSellerTrends($days)
    {
        return DB::table('sales as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->selectRaw('
                DATE(s.created_at) as date,
                u.name as seller_name,
                SUM(s.total_amount) as daily_sales,
                COUNT(s.id) as daily_orders
            ')
            ->where('s.created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date', 'u.id', 'u.name')
            ->orderBy('date')
            ->get();
    }

    private function getManagerTrends($days)
    {
        return DB::table('sales as s')
            ->join('branches as b', 's.branch_id', '=', 'b.id')
            ->selectRaw('
                DATE(s.created_at) as date,
                b.name as branch_name,
                SUM(s.total_amount) as daily_revenue,
                COUNT(s.id) as daily_orders
            ')
            ->where('s.created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date', 'b.id', 'b.name')
            ->orderBy('date')
            ->get();
    }

    private function getDeliveryTrends($days)
    {
        return DB::table('orders')
            ->selectRaw('
                DATE(created_at) as date,
                COUNT(*) as daily_deliveries,
                SUM(CASE WHEN status = "delivered" AND delivered_at <= expected_delivery_date THEN 1 ELSE 0 END) as on_time_deliveries
            ')
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getStorekeeperTrends($days)
    {
        return DB::table('stock_adjustments')
            ->join('users as u', 'user_id', '=', 'u.id')
            ->selectRaw('
                DATE(created_at) as date,
                u.name as storekeeper_name,
                COUNT(*) as daily_adjustments
            ')
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date', 'u.id', 'u.name')
            ->orderBy('date')
            ->get();
    }

    private function getTopSellers($limit)
    {
        return $this->getSellerPerformance((object) ['period' => 'month'])
            ->getData()
            ->take($limit);
    }

    private function getTopManagers($limit)
    {
        return $this->getBranchManagerPerformance((object) ['period' => 'month'])
            ->getData()
            ->take($limit);
    }

    private function getTopDeliveryStaff($limit)
    {
        return $this->getDeliveryPerformance((object) ['period' => 'month'])
            ->getData()
            ->take($limit);
    }

    private function getTopStorekeepers($limit)
    {
        return $this->getStorekeeperPerformance((object) ['period' => 'month'])
            ->getData()
            ->take($limit);
    }

    private function getAverageSellerScore()
    {
        return 78.5; // Placeholder
    }

    private function getAverageManagerScore()
    {
        return 82.3; // Placeholder
    }

    private function getAverageDeliveryScore()
    {
        return 85.7; // Placeholder
    }

    private function getAverageStorekeeperScore()
    {
        return 88.2; // Placeholder
    }

    private function getImprovementAreas()
    {
        return [
            'Sales team conversion rates below industry average',
            'Delivery on-time rates need improvement in Branch C',
            'Inventory accuracy issues in Branch B',
            'High expense ratios in some branches',
        ];
    }

    private function getRecognitionOpportunities()
    {
        return [
            'Top performer of the month: John Doe (Sales)',
            'Most improved: Branch A (Management)',
            'Perfect delivery record: Delivery Team B',
            'Inventory excellence: Storekeeper Jane Smith',
        ];
    }
}
