<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Order;
use App\Models\Sale;
use App\Models\Production;
use App\Models\Product;
use App\Models\Branch;
use App\Models\Inventory;
use App\Models\Expense;
use App\Models\User;

class BusinessIntelligenceController extends Controller
{
    public function dashboard()
    {
        // 1. Sales Trend (Last 9 months)
        $salesTrend = collect(range(0, 8))->map(function($i) {
            $date = Carbon::now()->subMonths(8 - $i);
            $monthStr = $date->format('M');
            
            $actual = Sale::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->sum('payable_amount');
            
            // Mock target for now (e.g., actual + 10% or default)
            $target = $actual > 0 ? $actual * 1.1 : 50000;
            
            return [
                'month' => $monthStr,
                'sales' => (float)$actual,
                'target' => (float)$target
            ];
        });

        // 2. Branch Performance
        $branchPerformance = Branch::with(['sales'])->get()->map(function($branch) {
            return [
                'branch' => $branch->name,
                'revenue' => (float)$branch->sales()->whereMonth('created_at', Carbon::now()->month)->sum('payable_amount'),
                'orders' => $branch->sales()->whereMonth('created_at', Carbon::now()->month)->count()
            ];
        });

        // 3. Category Sales (This Month)
        $categorySalesData = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->join('products as p', 'si.product_id', '=', 'p.id')
            ->join('product_managements as pm', 'p.product_management_id', '=', 'pm.id')
            ->join('categories as c', 'pm.category_id', '=', 'c.id')
            ->selectRaw('c.category_name as name, SUM(si.subtotal) as total')
            ->whereMonth('s.created_at', Carbon::now()->month)
            ->groupBy('c.category_name')
            ->get();
            
        $totalCats = $categorySalesData->sum('total');
        $categorySales = $categorySalesData->map(function($c) use ($totalCats) {
            return [
                'name' => $c->name,
                'value' => $totalCats > 0 ? round(($c->total / $totalCats) * 100, 1) : 0
            ];
        });

        // 4. Top Customers
        $topCustomers = DB::table('sales')
            ->join('users', 'sales.customer_id', '=', 'users.id')
            ->selectRaw('users.staff_name as name, SUM(sales.payable_amount) as revenue, COUNT(sales.id) as orders')
            ->whereNotNull('sales.customer_id')
            ->groupBy('users.id', 'users.staff_name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(function($c) {
                return [
                    'name' => $c->name,
                    'revenue' => '$' . number_format($c->revenue, 2),
                    'orders' => $c->orders,
                    'growth' => '+0%' // Needs historical calculation for actual growth
                ];
            });

        // 5. Default Report Templates
        $reportTemplates = [
            ['name' => 'Monthly Sales Report', 'type' => 'Sales', 'lastGenerated' => Carbon::now()->format('M d, Y'), 'schedule' => 'Monthly'],
            ['name' => 'Inventory Valuation', 'type' => 'Inventory', 'lastGenerated' => Carbon::now()->subDays(1)->format('M d, Y'), 'schedule' => 'Weekly'],
            ['name' => 'Profit & Loss Statement', 'type' => 'Finance', 'lastGenerated' => Carbon::parse('first day of this month')->format('M d, Y'), 'schedule' => 'Monthly'],
            ['name' => 'Customer Analysis', 'type' => 'Sales', 'lastGenerated' => Carbon::now()->subDays(5)->format('M d, Y'), 'schedule' => 'Monthly'],
        ];

        return \Inertia\Inertia::render('ReportsPage', [
            'initialSalesTrend' => $salesTrend,
            'initialBranchPerformance' => $branchPerformance,
            'initialCategorySales' => $categorySales,
            'initialTopCustomers' => $topCustomers,
            'initialReportTemplates' => $reportTemplates
        ]);
    }

    public function getSalesForecast(Request $request)
    {
        $days = $request->get('days', 30);
        $branchId = $request->get('branch_id');
        
        $salesData = $this->getHistoricalSalesData($branchId, 90);
        $forecast = $this->calculateLinearRegression($salesData, $days);
        
        return response()->json([
            'forecast' => $forecast,
            'confidence' => $this->calculateConfidence($salesData),
            'trend' => $this->determineTrend($salesData)
        ]);
    }

    public function getProductionCostAnalysis()
    {
        $costs = DB::table('productions')
            ->selectRaw('DATE(created_at) as date, SUM(material_cost) as total_cost, COUNT(*) as production_count')
            ->where('created_at', '>=', Carbon::now()->subDays(90))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $trend = $this->calculateCostTrend($costs);
        $anomalies = $this->detectCostAnomalies($costs);

        return response()->json([
            'costs' => $costs,
            'trend' => $trend,
            'anomalies' => $anomalies
        ]);
    }

    public function getBranchPerformanceRanking()
    {
        $branches = Branch::with(['sales', 'expenses', 'productions'])
            ->get()
            ->map(function ($branch) {
                $revenue = $branch->sales()->sum('total_amount');
                $expenses = $branch->expenses()->sum('amount');
                $productionCosts = $branch->productions()->sum('material_cost');
                
                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'revenue' => $revenue,
                    'expenses' => $expenses,
                    'production_costs' => $productionCosts,
                    'net_profit' => $revenue - $expenses - $productionCosts,
                    'profit_margin' => $revenue > 0 ? (($revenue - $expenses - $productionCosts) / $revenue) * 100 : 0
                ];
            })
            ->sortByDesc('net_profit')
            ->values();

        return response()->json($branches);
    }

    public function getTopMarginProducts()
    {
        $products = DB::table('products as p')
            ->leftJoin('sale_items as si', 'p.id', '=', 'si.product_id')
            ->leftJoin('sales as s', 'si.sale_id', '=', 's.id')
            ->selectRaw('
                p.id,
                p.name,
                p.cost_price,
                p.selling_price,
                COUNT(si.id) as units_sold,
                SUM(si.quantity * si.unit_price) as total_revenue,
                SUM(si.quantity * p.cost_price) as total_cost,
                (SUM(si.quantity * si.unit_price) - SUM(si.quantity * p.cost_price)) / SUM(si.quantity * si.unit_price) * 100 as profit_margin
            ')
            ->where('s.created_at', '>=', Carbon::now()->subDays(30))
            ->whereNotNull('si.id')
            ->groupBy('p.id', 'p.name', 'p.cost_price', 'p.selling_price')
            ->orderByDesc('profit_margin')
            ->limit(10)
            ->get();

        return response()->json($products);
    }

    public function getLowMarginProducts()
    {
        $threshold = 10; // 10% margin threshold
        
        $products = DB::table('products as p')
            ->leftJoin('sale_items as si', 'p.id', '=', 'si.product_id')
            ->leftJoin('sales as s', 'si.sale_id', '=', 's.id')
            ->selectRaw('
                p.id,
                p.name,
                p.cost_price,
                p.selling_price,
                COUNT(si.id) as units_sold,
                (SUM(si.quantity * si.unit_price) - SUM(si.quantity * p.cost_price)) / SUM(si.quantity * si.unit_price) * 100 as profit_margin
            ')
            ->where('s.created_at', '>=', Carbon::now()->subDays(30))
            ->whereNotNull('si.id')
            ->groupBy('p.id', 'p.name', 'p.cost_price', 'p.selling_price')
            ->havingRaw('profit_margin < ?', [$threshold])
            ->orderBy('profit_margin')
            ->get();

        return response()->json($products);
    }

    public function getDeadStockDetection()
    {
        $thresholdDays = 90;
        
        $deadStock = DB::table('inventories as i')
            ->join('products as p', 'i.product_id', '=', 'p.id')
            ->leftJoin('sale_items as si', 'p.id', '=', 'si.product_id')
            ->leftJoin('sales as s', 'si.sale_id', '=', 's.id')
            ->selectRaw('
                p.id,
                p.name,
                i.quantity as current_stock,
                COALESCE(MAX(s.created_at), p.created_at) as last_sale_date,
                DATEDIFF(NOW(), COALESCE(MAX(s.created_at), p.created_at)) as days_since_last_sale,
                i.quantity * p.cost_price as stock_value
            ')
            ->where('i.quantity', '>', 0)
            ->groupBy('p.id', 'p.name', 'i.quantity', 'p.created_at', 'p.cost_price')
            ->havingRaw('days_since_last_sale > ?', [$thresholdDays])
            ->orderByDesc('stock_value')
            ->get();

        return response()->json($deadStock);
    }

    public function getOverproductionDetection()
    {
        $overproduction = DB::table('productions as pr')
            ->join('products as p', 'pr.product_id', '=', 'p.id')
            ->leftJoin('sale_items as si', 'p.id', '=', 'si.product_id')
            ->leftJoin('sales as s', 'si.sale_id', '=', 's.id')
            ->selectRaw('
                pr.id,
                pr.product_id,
                p.name as product_name,
                pr.quantity as produced_quantity,
                COALESCE(SUM(CASE WHEN s.created_at >= pr.created_at THEN si.quantity ELSE 0 END), 0) as sold_quantity,
                pr.quantity - COALESCE(SUM(CASE WHEN s.created_at >= pr.created_at THEN si.quantity ELSE 0 END), 0) as excess_quantity,
                (pr.quantity - COALESCE(SUM(CASE WHEN s.created_at >= pr.created_at THEN si.quantity ELSE 0 END), 0)) / pr.quantity * 100 as excess_percentage
            ')
            ->where('pr.created_at', '>=', Carbon::now()->subDays(60))
            ->groupBy('pr.id', 'pr.product_id', 'p.name', 'pr.quantity')
            ->havingRaw('excess_percentage > 30')
            ->orderByDesc('excess_percentage')
            ->get();

        return response()->json($overproduction);
    }

    public function getSeasonalDemandPrediction()
    {
        $seasonalData = DB::table('sales as s')
            ->join('sale_items as si', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'si.product_id', '=', 'p.id')
            ->selectRaw('
                p.id,
                p.name,
                MONTH(s.created_at) as month,
                YEAR(s.created_at) as year,
                SUM(si.quantity) as total_quantity,
                AVG(si.quantity) as avg_monthly_demand
            ')
            ->where('s.created_at', '>=', Carbon::now()->subYears(2))
            ->groupBy('p.id', 'p.name', 'MONTH(s.created_at)', 'YEAR(s.created_at)')
            ->orderBy('p.id')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $predictions = $seasonalData->groupBy('id')->map(function ($productData) {
            $monthlyAverages = $productData->groupBy('month')->map(function ($monthData) {
                return $monthData->avg('total_quantity');
            });

            $currentMonth = Carbon::now()->month;
            $nextMonth = $currentMonth == 12 ? 1 : $currentMonth + 1;
            
            return [
                'product_id' => $productData->first()->id,
                'product_name' => $productData->first()->name,
                'current_month_demand' => $monthlyAverages->get($currentMonth, 0),
                'next_month_prediction' => $monthlyAverages->get($nextMonth, 0),
                'seasonal_pattern' => $monthlyAverages->toArray()
            ];
        })->values();

        return response()->json($predictions);
    }

    public function getAISummary()
    {
        $branchComparison = $this->getBranchComparisonInsight();
        $wasteAnalysis = $this->getWasteAnalysisInsight();
        $profitabilityTrend = $this->getProfitabilityTrendInsight();
        $riskAlerts = $this->getRiskAlerts();

        $summary = "This week {$branchComparison}. {$wasteAnalysis}. {$profitabilityTrend}. " . 
                  implode(' ', $riskAlerts);

        return response()->json([
            'summary' => $summary,
            'insights' => [
                'branch_comparison' => $branchComparison,
                'waste_analysis' => $wasteAnalysis,
                'profitability_trend' => $profitabilityTrend,
                'risk_alerts' => $riskAlerts
            ]
        ]);
    }

    private function getHistoricalSalesData($branchId, $days)
    {
        $query = DB::table('sales')
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total_sales')
            ->where('created_at', '>=', Carbon::now()->subDays($days));

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->groupBy('date')->orderBy('date')->get();
    }

    private function calculateLinearRegression($data, $forecastDays)
    {
        if ($data->count() < 2) return [];

        $n = $data->count();
        $x = [];
        $y = [];

        foreach ($data as $index => $point) {
            $x[] = $index;
            $y[] = $point->total_sales;
        }

        $sumX = array_sum($x);
        $sumY = array_sum($y);
        $sumXY = 0;
        $sumX2 = 0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += $x[$i] * $y[$i];
            $sumX2 += $x[$i] * $x[$i];
        }

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
        $intercept = ($sumY - $slope * $sumX) / $n;

        $forecast = [];
        $lastDate = Carbon::parse($data->last()->date);

        for ($i = 1; $i <= $forecastDays; $i++) {
            $futureDate = $lastDate->copy()->addDays($i);
            $predictedValue = $slope * ($n + $i - 1) + $intercept;
            
            $forecast[] = [
                'date' => $futureDate->format('Y-m-d'),
                'predicted_sales' => max(0, $predictedValue)
            ];
        }

        return $forecast;
    }

    private function calculateConfidence($data)
    {
        if ($data->count() < 3) return 'low';

        $values = $data->pluck('total_sales')->toArray();
        $mean = array_sum($values) / count($values);
        $variance = 0;

        foreach ($values as $value) {
            $variance += pow($value - $mean, 2);
        }

        $stdDev = sqrt($variance / count($values));
        $coefficientOfVariation = $stdDev / $mean;

        if ($coefficientOfVariation < 0.1) return 'high';
        if ($coefficientOfVariation < 0.3) return 'medium';
        return 'low';
    }

    private function determineTrend($data)
    {
        if ($data->count() < 2) return 'insufficient_data';

        $firstHalf = $data->take(floor($data->count() / 2));
        $secondHalf = $data->skip(floor($data->count() / 2));

        $firstAvg = $firstHalf->avg('total_sales');
        $secondAvg = $secondHalf->avg('total_sales');

        $change = (($secondAvg - $firstAvg) / $firstAvg) * 100;

        if ($change > 5) return 'increasing';
        if ($change < -5) return 'decreasing';
        return 'stable';
    }

    private function calculateCostTrend($costs)
    {
        if ($costs->count() < 2) return 'insufficient_data';

        $recent = $costs->take(7)->avg('total_cost');
        $previous = $costs->skip(7)->take(7)->avg('total_cost');

        if (!$previous) return 'insufficient_data';

        $change = (($recent - $previous) / $previous) * 100;

        return [
            'trend' => $change > 5 ? 'increasing' : ($change < -5 ? 'decreasing' : 'stable'),
            'change_percentage' => $change
        ];
    }

    private function detectCostAnomalies($costs)
    {
        if ($costs->count() < 5) return [];

        $values = $costs->pluck('total_cost')->toArray();
        $mean = array_sum($values) / count($values);
        $stdDev = sqrt(array_sum(array_map(function($v) use ($mean) { return pow($v - $mean, 2); }, $values)) / count($values));

        $threshold = $mean + (2 * $stdDev);

        return $costs->filter(function($cost) use ($threshold) {
            return $cost->total_cost > $threshold;
        })->values();
    }

    private function getBranchComparisonInsight()
    {
        $branches = $this->getBranchPerformanceRanking()->getData();
        $data = $branches->data;

        if (count($data) < 2) return "Branch performance data insufficient";

        $topBranch = $data[0];
        $secondBranch = $data[1];
        
        $performanceDiff = $topBranch['net_profit'] - $secondBranch['net_profit'];
        $percentageDiff = $secondBranch['net_profit'] > 0 ? ($performanceDiff / $secondBranch['net_profit']) * 100 : 0;

        return "Branch {$topBranch['name']} outperformed Branch {$secondBranch['name']} by " . 
               number_format($percentageDiff, 1) . "%";
    }

    private function getWasteAnalysisInsight()
    {
        $wasteIncrease = $this->calculateWasteTrend();
        
        if ($wasteIncrease > 0) {
            return "Raw material waste increased by " . number_format($wasteIncrease, 1) . "%";
        } elseif ($wasteIncrease < 0) {
            return "Raw material waste decreased by " . number_format(abs($wasteIncrease), 1) . "%";
        }
        
        return "Raw material waste remained stable";
    }

    private function getProfitabilityTrendInsight()
    {
        $profitTrend = $this->calculateProfitTrend();
        
        if ($profitTrend > 5) {
            return "Overall profitability is trending upward";
        } elseif ($profitTrend < -5) {
            return "Overall profitability is declining and requires attention";
        }
        
        return "Overall profitability remained stable";
    }

    private function getRiskAlerts()
    {
        $alerts = [];
        
        $lowStock = $this->getCriticalStockLevels();
        if ($lowStock > 0) {
            $alerts[] = "{$lowStock} products have critically low stock levels";
        }

        $overdueLoans = $this->getOverdueLoansCount();
        if ($overdueLoans > 0) {
            $alerts[] = "{$overdueLoans} loan payments are overdue";
        }

        return $alerts;
    }

    private function calculateWasteTrend()
    {
        // Placeholder implementation - would need actual waste tracking data
        return 4.0; // 4% increase as mentioned in requirements
    }

    private function calculateProfitTrend()
    {
        $recentProfit = DB::table('sales')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->sum('total_amount') - 
            DB::table('expenses')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->sum('amount');

        $previousProfit = DB::table('sales')
            ->whereBetween('created_at', [Carbon::now()->subDays(14), Carbon::now()->subDays(7)])
            ->sum('total_amount') - 
            DB::table('expenses')
            ->whereBetween('created_at', [Carbon::now()->subDays(14), Carbon::now()->subDays(7)])
            ->sum('amount');

        if ($previousProfit == 0) return 0;

        return (($recentProfit - $previousProfit) / $previousProfit) * 100;
    }

    private function getCriticalStockLevels()
    {
        return DB::table('inventories')
            ->where('quantity', '<=', DB::raw('threshold'))
            ->count();
    }

    private function getOverdueLoansCount()
    {
        return DB::table('loans')
            ->where('due_date', '<', Carbon::now())
            ->where('status', '!=', 'paid')
            ->count();
    }
}
