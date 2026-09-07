<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Container;
use App\Models\Customer;
use App\Models\CustomerFollowUp;
use App\Models\Delivery;
use App\Models\DeliveryPerson;
use App\Models\Expense;
use App\Models\Export;
use App\Models\GatekeeperLog;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockAdjustment;
use App\Models\Transfer;
use App\Models\User;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return redirect()->route('login');
        }

        // Determine primary role/dashboard type
        $roleName = $user->role->role_name ?? ($user->roles->first()->role_name ?? 'Staff');

        $data = $this->collectDashboardData($roleName, $request);

        return Inertia::render('DashboardPage', array_merge($data, [
            'user' => $user,
            'roleName' => $roleName,
            'branches' => $user->isGlobal() ? Branch::all() : [],
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
            $hour = str_pad($i, 2, '0', STR_PAD_LEFT).':00';
            $in = GatekeeperLog::whereDate('created_at', $today)
                ->where('type', 'IN')
                ->whereRaw('HOUR(created_at) >= ? AND HOUR(created_at) < ?', [$i, $i + 2])
                ->count();
            $out = GatekeeperLog::whereDate('created_at', $today)
                ->where('type', 'OUT')
                ->whereRaw('HOUR(created_at) >= ? AND HOUR(created_at) < ?', [$i, $i + 2])
                ->count();
            $trends[] = ['time' => $hour, 'incoming' => $in, 'outgoing' => $out];
        }

        return [
            'total_movements' => GatekeeperLog::whereDate('created_at', $today)->count(),
            'my_entries' => GatekeeperLog::whereDate('created_at', $today)->where('recorded_by_id', $userId)->count(),
            'incoming_today' => GatekeeperLog::whereDate('created_at', $today)->where('type', 'IN')->count(),
            'incoming_today' => GatekeeperLog::whereDate('created_at', $today)->where('type', 'IN')->count(),
            'outgoing_today' => GatekeeperLog::whereDate('created_at', $today)->where('type', 'OUT')->count(),
            'movement_trends' => $trends,
            'recent_logs' => GatekeeperLog::latest()->limit(10)->get(),
            'ready_for_pickup' => collect(),
            'containers_in_transit' => Container::where('status', 'in_transit')->where('branch_id', $branchId)->count(),
        ];
    }

    private function getReceptionistData($request)
    {
        $branchId = active_branch_id();

        return [
            'today_visitors' => Customer::whereDate('created_at', now())->count(),
            'recent_customers' => Customer::latest()->limit(10)->get(),
            'pending_followups' => CustomerFollowUp::where('status', 'pending')->count(),
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
        $totalRevenue = Sale::where('is_return', false)
            ->when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->sum('payable_amount');

        $totalCollected = Payment::when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->sum('amount_paid');

        $totalExpenses = Expense::when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->sum('amount');

        $balanceDue = max(0, $totalRevenue - $totalCollected);
        $netProfit = $totalRevenue - $totalExpenses;

        // Inventory & Production
        $totalOrders = Sale::when($branchId && $branchId !== 'all', $branchQuery)->count();
        $pendingProduction = 0;
        $staffCount = User::count();
        $containersCount = Container::when($branchId && $branchId !== 'all', $branchQuery)->count();

        // Calculate total metres and refined valuation for Raw Materials
        $totalRawMaterialsMetres = 0;
        $extraRmValuation = 0;

        // Customers
        $totalCustomers = Customer::when($period !== 'all', $periodQuery)->count();

        // Stock Alerts
        $branchIdForAlerts = active_branch_id();
        $stockAlertsCount = DB::table('products')
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

            $dayRev = Sale::where('is_return', false)->whereDate('created_at', $date->format('Y-m-d'))->when($branchId && $branchId !== 'all', $branchQuery)->sum('payable_amount');
            $dayExp = Expense::whereDate('created_at', $date->format('Y-m-d'))->when($branchId && $branchId !== 'all', $branchQuery)->sum('amount');
            $dayProd = 0;

            $revenueTrend[] = (float) $dayRev;
            $expenseTrend[] = (float) $dayExp;
            $productionTrend[] = (float) $dayProd;
        }

        // Staff Performance (TOP 5)
        $staffPerformance = User::with('role')
            ->select('users.id', 'users.staff_name as name', 'users.role_id', DB::raw('SUM(sales.payable_amount) as total_sales'), DB::raw('COUNT(sales.id) as sales_count'))
            ->join('sales', 'users.id', '=', 'sales.user_id')
            ->where('sales.is_return', false)
            ->when($branchId && $branchId !== 'all', function ($q) use ($branchId) {
                return $q->where('sales.branch_id', $branchId);
            })
            ->groupBy('users.id', 'users.staff_name', 'users.role_id')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->get();

        // Payment Status Distribution (Pie/Donut)
        $paymentDistribution = Sale::where('is_return', false)
            ->when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->selectRaw('payment_status, COUNT(*) as count, SUM(payable_amount) as total')
            ->groupBy('payment_status')
            ->get()
            ->map(fn ($r) => [
                'status' => $r->payment_status,
                'count' => (int) $r->count,
                'total' => (float) $r->total,
            ])->toArray();

        // Top 8 Selling Products by revenue — apply period filter directly on joined sales.created_at
        $topProductsQuery = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->where('sales.is_return', false)
            ->when($branchId && $branchId !== 'all', fn ($q) => $q->where('sales.branch_id', $branchId));

        if ($period === 'today') {
            $topProductsQuery->whereDate('sales.created_at', now()->toDateString());
        } elseif ($period === 'yesterday') {
            $topProductsQuery->whereDate('sales.created_at', now()->subDay()->toDateString());
        } elseif ($period === 'week') {
            $topProductsQuery->whereBetween('sales.created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($period === 'month') {
            $topProductsQuery->whereMonth('sales.created_at', now()->month)->whereYear('sales.created_at', now()->year);
        } elseif ($period === 'year') {
            $topProductsQuery->whereYear('sales.created_at', now()->year);
        } elseif ($period === 'custom') {
            $from = $startDate ? Carbon::parse($startDate)->startOfDay() : now()->startOfDay();
            $to = $endDate ? Carbon::parse($endDate)->endOfDay() : now()->endOfDay();
            $topProductsQuery->whereBetween('sales.created_at', [$from, $to]);
        }

        $topProducts = $topProductsQuery
            ->selectRaw('products.product_name, product_managements.image_1, SUM(sale_items.quantity) as total_qty, SUM(sale_items.subtotal) as total_revenue')
            ->groupBy('products.id', 'products.product_name', 'product_managements.image_1')
            ->orderByDesc('total_revenue')
            ->limit(8)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->product_name,
                'image' => $r->image_1 ? asset('storage/'.$r->image_1) : null,
                'qty' => (float) $r->total_qty,
                'revenue' => (float) $r->total_revenue,
            ])->toArray();

        // Low Stock Products (below reorder level)
        $lowStockProducts = DB::table('products')
            ->join('inventories', 'products.id', '=', 'inventories.product_id')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->select(
                'products.id',
                'products.product_name',
                'product_managements.image_1',
                'product_managements.low_stock_threshold',
                DB::raw('SUM(inventories.qty) as current_stock')
            )
            ->where('product_managements.low_stock_threshold', '>', 0)
            ->when($branchIdForAlerts && $branchIdForAlerts !== 'all', fn ($q) => $q->where('inventories.branch_id', $branchIdForAlerts))
            ->groupBy('products.id', 'products.product_name', 'product_managements.image_1', 'product_managements.low_stock_threshold')
            ->havingRaw('SUM(inventories.qty) <= product_managements.low_stock_threshold')
            ->orderByRaw('SUM(inventories.qty) ASC')
            ->limit(8)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->product_name,
                'image' => $r->image_1 ? asset('storage/'.$r->image_1) : null,
                'stock' => (float) $r->current_stock,
                'threshold' => (float) $r->low_stock_threshold,
            ])->toArray();

        // Recent Unpaid / Partially Paid Orders
        $unpaidOrders = Sale::with(['posCustomer'])
            ->whereIn('payment_status', ['Unpaid', 'Partially Paid'])
            ->where('is_return', false)
            ->when($branchId && $branchId !== 'all', $branchQuery)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn ($s) => [
                'invoice' => $s->invoice_number,
                'customer' => $s->posCustomer?->customer_name ?? 'Walking Customer',
                'payable' => (float) $s->payable_amount,
                'paid' => (float) $s->payments()->sum('amount_paid'),
                'status' => $s->payment_status,
                'date' => $s->created_at->format('d M Y'),
            ])->toArray();

        // Expense by Category (Pie chart)
        $expenseByCategory = Expense::when($branchId && $branchId !== 'all', $branchQuery)
            ->when($period !== 'all', $periodQuery)
            ->selectRaw("COALESCE(category, 'Uncategorized') as category, SUM(amount) as total")
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($r) => ['category' => $r->category, 'total' => (float) $r->total])
            ->toArray();

        // Monthly Revenue + Expenses for Bar Chart
        $monthlyBarData = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthName = Carbon::create(null, $m)->format('M');
            $rev = Sale::where('is_return', false)
                ->whereYear('created_at', $year)->whereMonth('created_at', $m)
                ->when($branchId && $branchId !== 'all', $branchQuery)
                ->sum('payable_amount');
            $exp = Expense::whereYear('created_at', $year)->whereMonth('created_at', $m)
                ->when($branchId && $branchId !== 'all', $branchQuery)
                ->sum('amount');
            $monthlyBarData[] = ['month' => $monthName, 'revenue' => (float) $rev, 'expenses' => (float) $exp];
        }

        // Customer growth – new customers per month this year
        $customerGrowth = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthName = Carbon::create(null, $m)->format('M');
            $count = Customer::whereYear('created_at', $year)->whereMonth('created_at', $m)->count();
            $customerGrowth[] = ['month' => $monthName, 'customers' => $count];
        }

        return [
            'total_revenue' => $totalRevenue,
            'net_profit' => $netProfit,
            'total_expenses' => $totalExpenses,
            'balance_due' => $balanceDue,
            'inventory_value' => (new InventoryService)->getInventoryValuation($branchId && $branchId !== 'all' ? $branchId : null),
            'total_orders' => $totalOrders,
            'pending_production' => $pendingProduction,
            'stock_alerts' => $stockAlertsCount,
            'total_customers' => $totalCustomers,
            'staff_count' => $staffCount,
            'containers_count' => $containersCount,
            'rm_metres' => (float) $totalRawMaterialsMetres,

            // Tables
            'recentSales' => Sale::with(['customer', 'posCustomer'])->orderBy('created_at', 'desc')->limit(8)->get(),
            'recentProduction' => [],
            'recentExpenses' => Expense::orderBy('created_at', 'desc')->limit(8)->get(),

            // Charts & Analytics
            'statistics' => $this->getMonthlySalesStatistics($year),
            'trend_labels' => $labels,
            'revenue_trend' => $revenueTrend,
            'expense_trend' => $expenseTrend,
            'production_trend' => $productionTrend,
            'staffPerformance' => $staffPerformance,
            'prod_stats' => [],
            'payment_distribution' => $paymentDistribution,
            'top_products' => $topProducts,
            'low_stock_products' => $lowStockProducts,
            'unpaid_orders' => $unpaidOrders,
            'expense_by_category' => $expenseByCategory,
            'monthly_bar_data' => $monthlyBarData,
            'customer_growth' => $customerGrowth,
        ];
    }

    private function getMonthlySalesStatistics($year)
    {
        $sales = Sale::selectRaw('MONTH(created_at) as month, SUM(payable_amount) as total')
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
        $totalRevenue = Sale::where('is_return', false)->sum('payable_amount');
        $totalExpenses = Expense::sum('amount');
        $outstandingLoans = Loan::whereNotIn('status', ['Paid', 'paid'])->sum('balance');

        $cashFlow = [
            'cash_in' => $totalRevenue,
            'cash_out' => $totalExpenses,
        ];

        $recentRevenue = Sale::with(['customer', 'posCustomer'])
            ->where('is_return', false)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        $branches = Branch::all();
        $branch_comparison = $branches->map(function ($branch) {
            $rev = Sale::where('is_return', false)->where('branch_id', $branch->id)->sum('payable_amount');
            $exp = Expense::where('branch_id', $branch->id)->sum('amount');
            $loans = Loan::where('branch_id', $branch->id)->whereNotIn('status', ['Paid', 'paid'])->sum('balance');

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
            'branch_production' => 0,
        ];
    }

    private function getBranchFinancials($request)
    {
        $user = Auth::user();
        $branchId = $user->branch_id ?? session('active_branch_id');

        // Safety: if somehow no branch_id, fall back to 0 so we never leak all branches
        if (! $branchId) {
            $branchId = 0;
        }

        $totalRevenue = Sale::where('is_return', false)
            ->where('branch_id', $branchId)
            ->sum('payable_amount');

        $totalExpenses = Expense::where('branch_id', $branchId)
            ->sum('amount');

        $outstandingLoans = Loan::where('branch_id', $branchId)
            ->whereNotIn('status', ['Paid', 'paid'])
            ->sum('balance');

        $cashFlow = [
            'cash_in' => $totalRevenue,
            'cash_out' => $totalExpenses,
        ];

        $recentRevenue = Sale::with(['customer', 'posCustomer'])
            ->where('is_return', false)
            ->where('branch_id', $branchId)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        // For branch accountants we only compare their own branch
        $branch = Branch::find($branchId);
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
            'adjustments' => StockAdjustment::count(),
            'transfers' => Transfer::count(),
        ];
    }

    private function getSellerPerformance($request)
    {
        return [
            'my_sales' => Sale::where('user_id', Auth::id())->count(),
            'daily_sales' => Sale::whereDate('created_at', now())->sum('payable_amount'),
        ];
    }

    private function getDeliveryQueue($request)
    {
        $user = auth()->user();

        // Find if this user is a delivery person (linked by email or phone)
        $driver = DeliveryPerson::where('email', $user->staff_email)
            ->orWhere('phone', $user->staff_phone)
            ->orWhere('name', 'like', '%'.$user->staff_name.'%')
            ->first();

        $driverId = $driver ? $driver->id : null;

        $query = Delivery::query();
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
            'is_driver' => (bool) $driver,
            'driver_info' => $driver,
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
}
