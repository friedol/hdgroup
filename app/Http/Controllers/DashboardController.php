<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Store;
use App\Models\Export;
use App\Models\Comment;
use App\Models\Product;
use App\Models\Transfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        if (!$user)
            return redirect()->route('login');

        // Determine primary role/dashboard type
        $roleName = $user->roles->first()->role_name ?? ($user->role->role_name ?? 'Staff');

        $data = $this->collectDashboardData($roleName, $request);

        return \Inertia\Inertia::render('DashboardPage', array_merge($data, [
            'user' => $user,
            'roleName' => $roleName,
            'branches' => $user->isGlobal() ? \App\Models\Branch::all() : [],
        ]));
    }

    private function getDashboardView($roleName)
    {
        $roleViews = [
            'CEO' => 'dashboard.ceo',
            'SuperAdmin' => 'dashboard.ceo',
            'Admin' => 'dashboard.ceo',
            'General Manager' => 'dashboard.ceo',
            'Accountant Manager' => 'dashboard.financial',
            'Branch Manager' => 'dashboard.branch_manager',
            'Branch Accountant' => 'dashboard.financial',
            'Storekeeper' => 'dashboard.inventory',
            'Seller' => 'dashboard.seller',
            'Delivery' => 'dashboard.delivery',
            'Staff' => 'dashboard.staff',
        ];

        return $roleViews[$roleName] ?? 'dashboard.dashboard';
    }

    private function collectDashboardData($roleName, Request $request)
    {
        $data = [
            'year' => $request->year ?? now()->year,
        ];

        // Grouping logic based on user request
        $isExecutive = in_array($roleName, ['CEO', 'Manager', 'Operator', 'Accountant', 'SuperAdmin', 'Admin', 'General Manager', 'Branch Accountant', 'Accountant Manager']);

        if ($isExecutive) {
            return array_merge($data, $this->getGlobalAggregatedData($request));
        }

        switch ($roleName) {
            case 'Store Keeper':
            case 'Storekeeper':
                $data = array_merge($data, $this->getInventoryMetrics($request));
                break;
            case 'Seller':
                $data = array_merge($data, $this->getSellerPerformance($request));
                break;
            case 'Delivery':
                $data = array_merge($data, $this->getDeliveryQueue($request));
                break;
            case 'Gatekeeper':
            case 'Gatekeepr':
                $data = array_merge($data, $this->getGatekeeperData($request));
                break;
            case 'Receptionist':
                $data = array_merge($data, $this->getReceptionistData($request));
                break;
            default:
                $data = array_merge($data, $this->getStaffData($request));
        }

        return $data;
    }

    private function getGatekeeperData($request)
    {
        $branchId = active_branch_id();
        $today = now()->toDateString();
        $userId = auth()->id();

        // Hourly trends for today
        $trends = [];
        for ($i = 0; $i < 24; $i += 2) {
            $hour = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
            $in = \App\Models\GatekeeperLog::whereDate('created_at', $today)
                ->where('type', 'IN')
                ->whereRaw('HOUR(created_at) >= ? AND HOUR(created_at) < ?', [$i, $i + 2])
                ->count();
            $out = \App\Models\GatekeeperLog::whereDate('created_at', $today)
                ->where('type', 'OUT')
                ->whereRaw('HOUR(created_at) >= ? AND HOUR(created_at) < ?', [$i, $i + 2])
                ->count();
            $trends[] = ['time' => $hour, 'incoming' => $in, 'outgoing' => $out];
        }

        return [
            'total_movements' => \App\Models\GatekeeperLog::whereDate('created_at', $today)->count(),
            'my_entries' => \App\Models\GatekeeperLog::whereDate('created_at', $today)->where('recorded_by_id', $userId)->count(),
            'incoming_today' => \App\Models\GatekeeperLog::whereDate('created_at', $today)->where('type', 'IN')->count(),
            'outgoing_today' => \App\Models\GatekeeperLog::whereDate('created_at', $today)->where('type', 'OUT')->count(),
            'movement_trends' => $trends,
            'recent_logs' => \App\Models\GatekeeperLog::latest()->limit(10)->get(),
            'ready_for_pickup' => \App\Models\ProductionOrder::with(['product', 'createdBy'])
                ->where('status', 'completed')
                ->latest()
                ->limit(10)
                ->get(),
            'containers_in_transit' => \App\Models\Container::where('status', 'in_transit')->where('branch_id', $branchId)->count(),
        ];
    }

    private function getReceptionistData($request)
    {
        $branchId = active_branch_id();
        return [
            'today_visitors' => \App\Models\Customer::whereDate('created_at', now())->count(),
            'recent_customers' => \App\Models\Customer::latest()->limit(10)->get(),
            'pending_followups' => \App\Models\CustomerFollowUp::where('status', 'pending')->count(),
        ];
    }

    private function getGlobalAggregatedData($request)
    {
        $year = $request->year ?? now()->year;
        $branchId = $request->branch_id ?? session('active_branch_id');
        $period = $request->period ?? 'today'; // today, yesterday, week, month, year, custom, all
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $branchQuery = function ($q) use ($branchId) {
            if ($branchId && $branchId !== 'all') {
                $q->where('branch_id', $branchId);
            }
        };

        $periodQuery = function ($q) use ($period, $startDate, $endDate) {
            if ($period === 'today') {
                $q->whereDate('created_at', now()->toDateString());
            } elseif ($period === 'yesterday') {
                $q->whereDate('created_at', now()->subDay()->toDateString());
            } elseif ($period === 'week') {
                $q->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            } elseif ($period === 'month') {
                $q->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
            } elseif ($period === 'year') {
                $q->whereYear('created_at', now()->year);
            } elseif ($period === 'custom') {
                $from = $startDate ? Carbon::parse($startDate)->startOfDay() : now()->startOfDay();
                $to = $endDate ? Carbon::parse($endDate)->endOfDay() : now()->endOfDay();
                if ($from->gt($to)) {
                    [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
                }
                $q->whereBetween('created_at', [$from, $to]);
            }
        };

        // Financials (Overall vs Collected)
        $totalRevenue = \App\Models\Sale::where('is_return', false)
            ->when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->sum('payable_amount');

        $totalCollected = \App\Models\Payment::when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->sum('amount_paid');

        $totalExpenses = \App\Models\Expense::when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->sum('amount');

        $balanceDue = max(0, $totalRevenue - $totalCollected);
        $netProfit = $totalRevenue - $totalExpenses;

        // Inventory & Production
        $totalOrders = \App\Models\Sale::when($branchId && $branchId !== 'all', $branchQuery)->count();
        $pendingProduction = \App\Models\ProductionOrder::whereIn('status', ['draft', 'approved', 'in_progress'])->when($branchId && $branchId !== 'all', $branchQuery)->count();
        $staffCount = \App\Models\User::count();
        $containersCount = \App\Models\Container::when($branchId && $branchId !== 'all', $branchQuery)->count();

        // Calculate total metres and refined valuation for Raw Materials
        $rawRolls = \App\Models\RawMaterial::when($branchId && $branchId !== 'all', $branchQuery)
            ->where('is_roll', true)
            ->get();

        $totalRawMaterialsMetres = 0;
        $extraRmValuation = 0;

        foreach ($rawRolls as $roll) {
            $qty = (float) (new \App\Services\InventoryService())->getTotalInventoryQuantity($roll->id, \App\Models\RawMaterial::class, $branchId);
            if ($qty > 0) {
                // Metres
                $fullMetres = ($qty - 1) * ($roll->total_length ?? 0);
                $partialMetres = (float) $roll->remaining_length;
                if ($partialMetres <= 0)
                    $partialMetres = $roll->total_length;
                $totalRawMaterialsMetres += ($fullMetres + $partialMetres);

                // Valuation (InventoryService might miss this if it only looks at buying_price)
                // We'll calculate the gap here if needed, but better to fix InventoryService valuation logic.
            }
        }

        // Customers
        $totalCustomers = \App\Models\Customer::when($period !== 'all', $periodQuery)->count();

        // Stock Alerts
        $branchIdForAlerts = active_branch_id();
        $stockAlertsCount = \Illuminate\Support\Facades\DB::table('products')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->join('inventories', 'products.id', '=', 'inventories.product_id')
            ->select('products.id')
            ->where('product_managements.low_stock_threshold', '>', 0)
            ->when($branchIdForAlerts && $branchIdForAlerts !== 'all', function ($q) use ($branchIdForAlerts) {
                return $q->where('inventories.branch_id', $branchIdForAlerts);
            })
            ->groupBy('products.id', 'product_managements.low_stock_threshold')
            ->havingRaw('SUM(inventories.qty) <= product_managements.low_stock_threshold')
            ->get()
            ->count();

        // Daily Trends for line chart (Last 30 Days)
        $labels = [];
        $revenueTrend = [];
        $expenseTrend = [];
        $productionTrend = [];

        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $labels[] = $date->format('M d');

            $dayRev = \App\Models\Sale::where('is_return', false)->whereDate('created_at', $date->format('Y-m-d'))->when($branchId && $branchId !== 'all', $branchQuery)->sum('payable_amount');
            $dayExp = \App\Models\Expense::whereDate('created_at', $date->format('Y-m-d'))->when($branchId && $branchId !== 'all', $branchQuery)->sum('amount');
            $dayProd = \App\Models\ProductionOrder::where('status', 'completed')->whereDate('updated_at', $date->format('Y-m-d'))->when($branchId && $branchId !== 'all', $branchQuery)->count();

            $revenueTrend[] = (float) $dayRev;
            $expenseTrend[] = (float) $dayExp;
            $productionTrend[] = (float) $dayProd;
        }

        // Staff Performance (TOP 5)
        $staffPerformance = \App\Models\User::select('users.staff_name as name', \Illuminate\Support\Facades\DB::raw('SUM(sales.payable_amount) as total_sales'))
            ->join('sales', 'users.id', '=', 'sales.user_id')
            ->where('sales.is_return', false)
            ->when($branchId && $branchId !== 'all', function ($q) use ($branchId) {
                return $q->where('sales.branch_id', $branchId);
            })
            ->groupBy('users.id', 'users.staff_name')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->get();

        // Production Status Distribution (Donut Chart)
        $prodStats = \App\Models\ProductionOrder::selectRaw('status, count(*) as count')
            ->when($branchId && $branchId !== 'all', $branchQuery)
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            // Row 1 & 2 Cards (12 requested)
            'total_revenue' => $totalRevenue,
            'net_profit' => $netProfit,
            'total_expenses' => $totalExpenses,
            'balance_due' => $balanceDue,
            'inventory_value' => (new \App\Services\InventoryService())->getInventoryValuation($branchId && $branchId !== 'all' ? $branchId : null),
            'total_orders' => $totalOrders,
            'pending_production' => $pendingProduction,
            'stock_alerts' => $stockAlertsCount,
            'total_customers' => $totalCustomers,
            'staff_count' => $staffCount,
            'containers_count' => $containersCount,
            'rm_metres' => (float) $totalRawMaterialsMetres,

            // Tables
            'recentSales' => \App\Models\Sale::with('customer')->orderBy('created_at', 'desc')->limit(8)->get(),
            'recentProduction' => \App\Models\ProductionOrder::with('createdBy')->orderBy('updated_at', 'desc')->limit(8)->get(),
            'recentExpenses' => \App\Models\Expense::orderBy('created_at', 'desc')->limit(8)->get(),

            // Charts
            'statistics' => $this->getMonthlySalesStatistics($year),
            'trend_labels' => $labels,
            'revenue_trend' => $revenueTrend,
            'expense_trend' => $expenseTrend,
            'production_trend' => $productionTrend,
            'staffPerformance' => $staffPerformance,
            'prod_stats' => $prodStats,
        ];
    }

    private function getMonthlySalesStatistics($year)
    {
        $sales = \App\Models\Sale::selectRaw('MONTH(created_at) as month, SUM(payable_amount) as total')
            ->whereYear('created_at', $year)
            ->where('is_return', false)
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $statistics = collect();
        for ($m = 1; $m <= 12; $m++) {
            $monthName = Carbon::create(null, $m)->format('F');
            $statistics->put($monthName, $sales[$m] ?? 0);
        }

        return $statistics;
    }

    private function getGlobalFinancialData($request)
    {
        $totalRevenue = \App\Models\Sale::where('is_return', false)->sum('payable_amount');
        $totalExpenses = \App\Models\Expense::sum('amount');
        $outstandingLoans = \App\Models\Loan::whereNotIn('status', ['Paid', 'paid'])->sum('balance');

        $cashFlow = [
            'cash_in' => $totalRevenue,
            'cash_out' => $totalExpenses,
        ];

        $recentRevenue = \App\Models\Sale::with('customer')
            ->where('is_return', false)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        $branches = \App\Models\Branch::all();
        $branch_comparison = $branches->map(function ($branch) {
            $rev = \App\Models\Sale::where('is_return', false)->where('branch_id', $branch->id)->sum('payable_amount');
            $exp = \App\Models\Expense::where('branch_id', $branch->id)->sum('amount');
            $loans = \App\Models\Loan::where('branch_id', $branch->id)->whereNotIn('status', ['Paid', 'paid'])->sum('balance');
            return [
                'name' => $branch->name,
                'revenue' => $rev,
                'expenses' => $exp,
                'net' => $rev - $exp,
                'outstanding_loans' => $loans,
            ];
        })->toArray();

        return [
            'financial_summary' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'net_profit' => $totalRevenue - $totalExpenses,
                'outstanding_loans' => $outstandingLoans,
            ],
            'branch_comparison' => $branch_comparison,
            'cash_flow' => $cashFlow,
            'recent_revenue' => $recentRevenue,
        ];
    }

    private function getBranchMetrics($request)
    {
        return [
            'branch_sales' => Export::where('is_checked', true)->count(),
            'branch_stock_alerts' => [],
            'branch_production' => \App\Models\ProductionOrder::count(),
        ];
    }

    private function getBranchFinancials($request)
    {
        $user = Auth::user();
        $branchId = $user->branch_id ?? session('active_branch_id');

        // Safety: if somehow no branch_id, fall back to 0 so we never leak all branches
        if (!$branchId) {
            $branchId = 0;
        }

        $totalRevenue = \App\Models\Sale::where('is_return', false)
            ->where('branch_id', $branchId)
            ->sum('payable_amount');

        $totalExpenses = \App\Models\Expense::where('branch_id', $branchId)
            ->sum('amount');

        $outstandingLoans = \App\Models\Loan::where('branch_id', $branchId)
            ->whereNotIn('status', ['Paid', 'paid'])
            ->sum('balance');

        $cashFlow = [
            'cash_in' => $totalRevenue,
            'cash_out' => $totalExpenses,
        ];

        $recentRevenue = \App\Models\Sale::with('customer')
            ->where('is_return', false)
            ->where('branch_id', $branchId)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        // For branch accountants we only compare their own branch
        $branch = \App\Models\Branch::find($branchId);
        $branch_comparison = [];

        if ($branch) {
            $branch_comparison[] = [
                'name' => $branch->name,
                'revenue' => $totalRevenue,
                'expenses' => $totalExpenses,
                'net' => $totalRevenue - $totalExpenses,
                'outstanding_loans' => $outstandingLoans,
            ];
        }

        return [
            'financial_summary' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'net_profit' => $totalRevenue - $totalExpenses,
                'outstanding_loans' => $outstandingLoans,
            ],
            'branch_comparison' => $branch_comparison,
            'cash_flow' => $cashFlow,
            'recent_revenue' => $recentRevenue,
        ];
    }

    private function getInventoryMetrics($request)
    {
        return [
            'total_products' => Product::count(),
            'adjustments' => \App\Models\StockAdjustment::count(),
            'transfers' => \App\Models\Transfer::count(),
        ];
    }

    private function getSellerPerformance($request)
    {
        return [
            'my_sales' => \App\Models\Sale::where('user_id', Auth::id())->count(),
            'daily_sales' => \App\Models\Sale::whereDate('created_at', now())->sum('payable_amount'),
        ];
    }

    private function getDeliveryQueue($request)
    {
        $user = auth()->user();

        // Find if this user is a delivery person (linked by email or phone)
        $driver = \App\Models\DeliveryPerson::where('email', $user->staff_email)
            ->orWhere('phone', $user->staff_phone)
            ->orWhere('name', 'like', '%' . $user->staff_name . '%')
            ->first();

        $driverId = $driver ? $driver->id : null;

        $query = \App\Models\Delivery::query();
        if ($driverId) {
            $query->where('delivery_person_id', $driverId);
        }

        $today = now()->toDateString();

        $stats = [
            'assigned_count' => (clone $query)->where('status', 'assigned')->whereDate('created_at', $today)->count(),
            'pending_count' => (clone $query)->whereIn('status', ['pending', 'picked-up', 'in-transit'])->count(),
            'delivered_count' => (clone $query)->where('status', 'delivered')->count(),
            'failed_count' => (clone $query)->whereIn('status', ['failed', 'cancelled'])->count(),
        ];

        // Monthly performance chart data (last 30 days)
        $chartData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->toDateString();
            $label = $date->format('D, M d');

            $chartData['labels'][] = $label;
            $chartData['data'][] = (clone $query)->whereDate('created_at', $dateStr)->count();
        }

        $recentDeliveries = (clone $query)
            ->with(['items'])
            ->latest()
            ->limit(10)
            ->get();

        return [
            'delivery_stats' => $stats,
            'recent_deliveries' => $recentDeliveries,
            'performance_chart' => $chartData,
            'is_driver' => !!$driver,
            'driver_info' => $driver
        ];
    }

    private function getStaffData($request)
    {
        return [
            'products' => collect(),
            'exports' => collect(),
            'stores' => collect(),
            'inventoryValue' => 0,
            'recentActivity' => collect(),
            'statistics' => collect(),
        ];
    }

    public function manufacturingDashboard(Request $request)
    {
        $branchId = session('active_branch_id');
        $inventoryService = new \App\Services\InventoryService();

        // Helper for branch filtering
        $branchFilter = function ($query) use ($branchId) {
            if ($branchId && $branchId !== 'all') {
                $query->where('branch_id', $branchId);
            }
        };

        // 1. Production Orders Stats
        $productionOrdersQuery = \App\Models\ProductionOrder::query();
        if ($branchId && $branchId !== 'all') {
            $productionOrdersQuery->where('branch_id', $branchId);
        }
        $productionOrders = $productionOrdersQuery->get();

        $ordersCount = [
            'total' => $productionOrders->count(),
            'pending' => $productionOrders->whereIn('status', ['draft', 'approved', 'in_progress'])->count(),
            'completed' => $productionOrders->where('status', 'completed')->count(),
            'total_produced' => (float) $productionOrders->sum('bags_produced'),
            'total_revenue' => (float) $productionOrders->sum('revenue'),
            'total_cost' => (float) $productionOrders->sum('total_cost'),
        ];

        // 2. Value Metrics
        $manufacturedProductsQuery = \App\Models\Product::where('product_type', 'manufactured');
        if ($branchId && $branchId !== 'all') {
            $manufacturedProductsQuery->where('branch_id', $branchId);
        }
        $manufacturedProducts = $manufacturedProductsQuery->get();

        $finishedGoodsValue = 0;
        foreach ($manufacturedProducts as $product) {
            $stock = (float) $inventoryService->getTotalInventoryQuantity($product->id, \App\Models\Product::class, $branchId);
            // Use market price (product_price) as requested
            $price = (float) ($product->product_price ?? $product->unit_price ?? $product->buying_price ?? 0);
            $finishedGoodsValue += ($stock * $price);
        }

        $rawMaterialsQuery = \App\Models\RawMaterial::query();
        if ($branchId && $branchId !== 'all') {
            $rawMaterialsQuery->where('branch_id', $branchId);
        }
        $rawMaterials = $rawMaterialsQuery->get();

        $rawMaterialsValue = 0;
        $totalRawMaterialMetres = 0;

        foreach ($rawMaterials as $rm) {
            $qty = (float) $inventoryService->getTotalInventoryQuantity($rm->id, \App\Models\RawMaterial::class, $branchId);

            // Value Calculation
            if ($rm->is_roll && ($rm->total_length ?? 0) > 0) {
                // For rolls: (qty-1) full rolls + 1 partial roll value
                $fullRollsValue = ($qty > 1) ? ($qty - 1) * (float) $rm->cost_per_unit : 0;
                $partialRatio = ($rm->remaining_length > 0) ? ($rm->remaining_length / $rm->total_length) : 0;
                $partialRollValue = $qty > 0 ? ($partialRatio * (float) $rm->cost_per_unit) : 0;
                $rawMaterialsValue += ($fullRollsValue + $partialRollValue);

                // Metres Calculation
                if ($qty > 0) {
                    $fullMetres = ($qty - 1) * $rm->total_length;
                    $partialMetres = (float) $rm->remaining_length;

                    // Fallback if remaining is 0 but qty > 0 (it's a new roll)
                    if ($partialMetres <= 0)
                        $partialMetres = $rm->total_length;

                    $totalRawMaterialMetres += ($fullMetres + $partialMetres);
                }
            } else {
                // Accessories or non-rolls
                $rawMaterialsValue += ($qty * (float) ($rm->cost_per_unit ?? 0));
            }
        }

        // 3. 30-Day Performance Trends
        $days = 30;
        $trend_labels = [];
        $production_trend = [];
        $revenue_trend = [];
        $cost_trend = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $displayDate = now()->subDays($i)->format('M d');
            $trend_labels[] = $displayDate;

            $dayStatsQuery = \App\Models\ProductionOrder::whereDate('updated_at', $date)
                ->where('status', 'completed');

            if ($branchId && $branchId !== 'all') {
                $dayStatsQuery->where('branch_id', $branchId);
            }

            $dayStats = $dayStatsQuery->selectRaw('SUM(bags_produced) as bags, SUM(revenue) as rev, SUM(total_cost) as cost')->first();

            $production_trend[] = (float) ($dayStats->bags ?? 0);
            $revenue_trend[] = (float) ($dayStats->rev ?? 0);
            $cost_trend[] = (float) ($dayStats->cost ?? 0);
        }

        // 4. Product Distribution (Pie Chart)
        $productDistributionQuery = \App\Models\ProductionOrder::with('product')
            ->whereNotNull('product_id');

        if ($branchId && $branchId !== 'all') {
            $productDistributionQuery->where('branch_id', $branchId);
        }

        $productDistribution = $productDistributionQuery->selectRaw('product_id, SUM(bags_produced) as total_qty')
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->product->product_name ?? 'Unknown',
                    'value' => (float) $item->total_qty
                ];
            });

        // 5. Status Distribution distribution over all branches if 'all'
        $statusDistributionQuery = \App\Models\ProductionOrder::query();
        if ($branchId && $branchId !== 'all') {
            $statusDistributionQuery->where('branch_id', $branchId);
        }

        $statusDistribution = $statusDistributionQuery->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return ['name' => ucfirst($item->status), 'value' => $item->count];
            });

        // 6. Recent Activity
        $recentJobsQuery = \App\Models\ProductionOrder::with(['product', 'createdBy', 'store', 'roll']);
        if ($branchId && $branchId !== 'all') {
            $recentJobsQuery->where('branch_id', $branchId);
        }

        $recentJobs = $recentJobsQuery->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();


        return \Inertia\Inertia::render('Operations/ProductionPage', [
            'ordersCount' => $ordersCount,
            'finishedGoodsValue' => $finishedGoodsValue,
            'rawMaterialsValue' => $rawMaterialsValue,
            'totalRawMaterialMetres' => (float) $totalRawMaterialMetres,
            'trends' => [
                'labels' => $trend_labels,
                'production' => $production_trend,
                'revenue' => $revenue_trend,
                'cost' => $cost_trend,
            ],
            'productDistribution' => $productDistribution,
            'statusDistribution' => $statusDistribution,
            'recentJobs' => $recentJobs
        ]);
    }
}
