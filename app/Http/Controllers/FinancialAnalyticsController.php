<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FinancialAnalyticsController extends Controller
{
    public function dashboard()
    {
        $branchId = session('active_branch_id') ?: Auth::user()->branch_id;
        $user = Auth::user();
        $isGlobal = $user->isGlobal();

        // Standardise branchId for global users (if they pick 'All Branches', branchId is null)
        // But for non-global users, it must be their branch.
        if (! $isGlobal) {
            $branchId = $user->branch_id;
        }

        // --- KPI Calculations (This Month) ---
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $totalRevenue = Sale::query()->where('is_return', false)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('total_amount');

        $lastMonthRevenue = Sale::query()->where('is_return', false)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->sum('total_amount');

        $totalIn = Payment::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereMonth('payment_date', Carbon::now()->month)
            ->whereYear('payment_date', Carbon::now()->year)
            ->sum('amount_paid');

        $totalOut = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'Approved')
            ->whereMonth('date', Carbon::now()->month)
            ->whereYear('date', Carbon::now()->year)
            ->sum('amount');

        $lastMonthExpense = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'Approved')
            ->whereMonth('date', $lastMonth->month)
            ->whereYear('date', $lastMonth->year)
            ->sum('amount');

        // Growth metrics
        $revGrowth = $lastMonthRevenue > 0 ? (($totalRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : 0;
        $expGrowth = $lastMonthExpense > 0 ? (($totalOut - $lastMonthExpense) / $lastMonthExpense) * 100 : 0;

        // --- Charts Data ---

        // 1. Monthly Trends (Last 6 Months)
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            $income = (float) Payment::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->whereBetween('payment_date', [$monthStart, $monthEnd])
                ->sum('amount_paid');

            $expense = (float) Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->where('status', 'Approved')
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->sum('amount');

            $monthlyTrends[] = [
                'month' => $month->format('M'),
                'income' => $income,
                'expenses' => $expense,
                'profit' => $income - $expense,
            ];
        }

        // 2. Expense Category Breakdown (Pie Chart)
        $expenseBreakdown = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'Approved')
            ->whereMonth('date', Carbon::now()->month)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get()
            ->map(fn ($e) => [
                'name' => $e->category ?: 'Others',
                'value' => (float) $e->total,
            ]);

        // 3. Branch Performance (Bar Chart - Only if Global)
        $branchPerformance = [];
        if ($isGlobal && ! $branchId) {
            $branches = Branch::query()->where('is_active', true)->get();
            foreach ($branches as $branch) {
                $branchIncome = (float) Payment::query()->where('branch_id', $branch->id)
                    ->whereMonth('payment_date', Carbon::now()->month)
                    ->sum('amount_paid');

                $branchExpense = (float) Expense::query()->where('branch_id', $branch->id)
                    ->where('status', 'Approved')
                    ->whereMonth('date', Carbon::now()->month)
                    ->sum('amount');

                $branchPerformance[] = [
                    'name' => $branch->name,
                    'income' => $branchIncome,
                    'expenses' => $branchExpense,
                ];
            }
        }

        // --- Existing Data for Tables ---
        $loans = Loan::orderByDesc('id')->limit(20)->get();
        $payments = Payment::with('loan')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('payment_date')
            ->limit(20)
            ->get();

        $expenses = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('date')
            ->limit(50)
            ->get();

        return Inertia::render('FinancePage', [
            'kpis' => [
                'totalRevenue' => $totalRevenue,
                'totalExpenses' => $totalOut,
                'outstandingLoans' => Loan::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))->sum('total_amount') - Payment::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))->sum('amount_paid'), // Approximation
                'netCashFlow' => $totalIn - $totalOut,
                'revenueGrowth' => number_format($revGrowth, 1).'%',
                'expenseGrowth' => number_format($expGrowth, 1).'%',
            ],
            'loans' => $loans,
            'payments' => $payments,
            'expenses' => $expenses,
            'monthlyTrends' => $monthlyTrends,
            'expenseBreakdown' => $expenseBreakdown,
            'branchPerformance' => $branchPerformance,
            'isGlobal' => $isGlobal && ! $branchId,
        ]);
    }

    public function cashFlowLedger(Request $request)
    {
        $view = $request->get('view', 'history');
        $branchId = $request->get('branch_id') ?: session('active_branch_id');
        $departmentId = $request->get('department_id');
        $period = $request->get('period', 'month');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        // Period → date range (Chibo-style)
        if (is_null($dateFrom) || $dateFrom === '' || is_null($dateTo) || $dateTo === '') {
            switch ($period) {
                case 'today':
                    $dateFrom = Carbon::now()->format('Y-m-d');
                    $dateTo = Carbon::now()->format('Y-m-d');
                    break;
                case 'yesterday':
                    $dateFrom = Carbon::yesterday()->format('Y-m-d');
                    $dateTo = Carbon::yesterday()->format('Y-m-d');
                    break;
                case 'week':
                    $dateFrom = Carbon::now()->startOfWeek()->format('Y-m-d');
                    $dateTo = Carbon::now()->endOfWeek()->format('Y-m-d');
                    break;
                case 'month':
                    $dateFrom = Carbon::now()->startOfMonth()->format('Y-m-d');
                    $dateTo = Carbon::now()->endOfMonth()->format('Y-m-d');
                    break;
                case 'year':
                    $dateFrom = Carbon::now()->startOfYear()->format('Y-m-d');
                    $dateTo = Carbon::now()->endOfYear()->format('Y-m-d');
                    break;
                default:
                    $dateFrom = Carbon::now()->startOfMonth()->format('Y-m-d');
                    $dateTo = Carbon::now()->endOfMonth()->format('Y-m-d');
            }
        }
        $carbonFrom = Carbon::parse($dateFrom)->startOfDay();
        $carbonTo = Carbon::parse($dateTo)->endOfDay();

        $branches = Branch::query()->where('is_active', true)->orderBy('name')->get();
        $categories = Category::all();
        $departments = $categories;

        // 1. Fetch Inflows
        $inflows = DB::table('payments as p')
            ->leftJoin('sales as s', 'p.unique_id', '=', 's.invoice_number')
            ->leftJoin('users as u', 'p.user_id', '=', 'u.id')
            ->leftJoin('branches as b', 'p.branch_id', '=', 'b.id')
            ->select(
                'p.payment_date as date',
                'p.id',
                DB::raw("'IN' as flow"),
                DB::raw("COALESCE(u.staff_name, b.name, 'Direct Sale') as source"),
                DB::raw("COALESCE(u.staff_phone, '-') as phone"),
                DB::raw("'Manual Payment' as details"),
                'p.payment_method as method',
                'p.amount_paid as amount',
                'p.reference as ref',
                'p.branch_id',
                's.id as sale_id'
            )
            ->whereBetween('p.payment_date', [$carbonFrom, $carbonTo]);

        if ($branchId) {
            $inflows->where('p.branch_id', $branchId);
        }
        if ($request->filled('payment_method')) {
            $inflows->where('p.payment_method', $request->payment_method);
        }
        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $inflows->where(function ($q) use ($search) {
                $q->whereRaw("COALESCE(u.staff_name, b.name, 'Direct Sale') LIKE ?", [$search])
                    ->orWhere('p.reference', 'like', $search);
            });
        }
        if ($request->filled('department_id')) {
            $inflows->whereExists(function ($query) use ($request) {
                $query->select(DB::raw(1))
                    ->from('sale_items as si')
                    ->join('products as pr', 'si.product_id', '=', 'pr.id')
                    ->join('product_managements as pm', 'pr.product_management_id', '=', 'pm.id')
                    ->whereColumn('si.sale_id', 's.id')
                    ->where('pm.category_id', $request->department_id);
            });
        }

        // 2. Fetch Outflows (Expenses)
        $outflows = DB::table('expenses as e')
            ->leftJoin('branches as b', 'e.branch_id', '=', 'b.id')
            ->select(
                'e.date',
                'e.id',
                DB::raw("'OUT' as flow"),
                DB::raw("COALESCE(e.category, 'General') as source"),
                DB::raw("'-' as phone"),
                'e.description as details',
                'e.payment_method as method',
                'e.amount',
                DB::raw("'' as ref"),
                'e.branch_id',
                DB::raw('NULL as sale_id')
            )
            ->where('e.status', 'Approved')
            ->whereBetween('e.date', [$carbonFrom, $carbonTo]);

        if ($branchId) {
            $outflows->where('e.branch_id', $branchId);
        }
        if ($request->filled('payment_method')) {
            $outflows->where('e.payment_method', $request->payment_method);
        }
        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $outflows->where(function ($q) use ($search) {
                $q->where('e.description', 'like', $search)
                    ->orWhere('e.category', 'like', $search);
            });
        }

        // 3. Fetch Manual CashFlows
        $manualFlows = DB::table('cash_flows as cf')
            ->leftJoin('branches as b', 'cf.branch_id', '=', 'b.id')
            ->select(
                'cf.transaction_date as date',
                'cf.id',
                'cf.flow',
                'cf.source_name as source',
                'cf.source_phone as phone',
                'cf.details',
                'cf.method',
                'cf.amount',
                'cf.ref',
                'cf.branch_id',
                DB::raw('NULL as sale_id')
            )
            ->whereNull('cf.deleted_at')
            ->whereBetween('cf.transaction_date', [$carbonFrom, $carbonTo]);

        if ($branchId) {
            $manualFlows->where('cf.branch_id', $branchId);
        }
        if ($request->filled('payment_method')) {
            $manualFlows->where('cf.method', $request->payment_method);
        }
        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $manualFlows->where(function ($q) use ($search) {
                $q->where('cf.source_name', 'like', $search)
                    ->orWhere('cf.details', 'like', $search);
            });
        }

        $startDate = $carbonFrom->format('Y-m-d');
        $endDate = $carbonTo->format('Y-m-d');

        $branches = Branch::query()->where('is_active', true)->orderBy('name')->get();
        $categories = Category::all();
        $departments = $categories;

        // Customers view: aggregate by customer (from loans + payments)
        if ($view === 'customers') {
            $customers = Customer::query()
                ->when($branchId, function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })
                ->when($request->filled('search'), function ($q) use ($request) {
                    $q->where(function ($q) use ($request) {
                        $q->where('customer_name', 'like', '%'.$request->search.'%')
                            ->orWhere('customer_phone', 'like', '%'.$request->search.'%');
                    });
                })
                ->selectRaw('customers.*')
                ->selectRaw('(SELECT COALESCE(SUM(p.amount_paid), 0) FROM payments p INNER JOIN loans l ON l.unique_id = p.unique_id WHERE l.customer_name = customers.customer_name AND p.branch_id = customers.branch_id) as total_paid')
                ->selectRaw('(SELECT COALESCE(SUM(l.balance), 0) FROM loans l WHERE l.customer_name = customers.customer_name AND l.branch_id = customers.branch_id AND l.is_checked = 0) as unpaid_balance')
                ->orderByRaw('total_paid DESC')
                ->paginate(20)
                ->withQueryString();

            $paginatedEntries = $customers;
            $summary = ['totalIn' => 0, 'totalOut' => 0, 'count' => $paginatedEntries->total()];

            return Inertia::render('Admin/Finance/CashFlow', compact(
                'view', 'branches', 'categories', 'departments', 'branchId', 'period', 'dateFrom', 'dateTo',
                'paginatedEntries', 'startDate', 'endDate', 'summary'
            ));
        }
        $allEntries = $inflows->get()->concat($outflows->get())->concat($manualFlows->get())->sortByDesc('date')->values();

        $entries = $allEntries->map(function ($row) {
            return [
                'id' => $row->id,
                'date' => $row->date,
                'flow' => $row->flow,
                'source' => $row->source,
                'phone' => $row->phone,
                'details' => $row->details,
                'method' => $row->method,
                'amount' => (float) $row->amount,
                'ref' => $row->ref,
                'branch_id' => $row->branch_id,
            ];
        })->all();

        $summary = [
            'totalIn' => collect($entries)->where('flow', 'IN')->sum('amount'),
            'totalOut' => collect($entries)->where('flow', 'OUT')->sum('amount'),
            'count' => count($entries),
        ];

        if ($request->get('action') === 'print' || $request->boolean('print')) {
            $branch = $branchId ? Branch::find($branchId) : null;
            $logo = null;
            $logoMime = 'image/png';

            if ($branch && $branch->logo) {
                if (Storage::disk('public')->exists($branch->logo)) {
                    $logo = base64_encode(Storage::disk('public')->get($branch->logo));
                    $ext = strtolower(pathinfo($branch->logo, PATHINFO_EXTENSION));
                    $logoMime = in_array($ext, ['jpg', 'jpeg']) ? 'image/jpeg' : 'image/png';
                }
            } else {
                $systemLogo = Setting::getValue('system_logo');
                if ($systemLogo && Storage::disk('public')->exists($systemLogo)) {
                    $logo = base64_encode(Storage::disk('public')->get($systemLogo));
                    $ext = strtolower(pathinfo($systemLogo, PATHINFO_EXTENSION));
                    $logoMime = in_array($ext, ['jpg', 'jpeg']) ? 'image/jpeg' : 'image/png';
                }
            }

            return view('admin.finance.cash-flow-pdf', compact(
                'entries', 'summary', 'branch', 'startDate', 'endDate', 'period', 'logo', 'logoMime'
            ));
        }

        $perPage = 30;
        $page = $request->get('page', 1);
        $paginatedEntries = new LengthAwarePaginator(
            collect($entries)->forPage($page, $perPage)->values(),
            collect($entries)->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Admin/Finance/CashFlow', compact(
            'paginatedEntries', 'view', 'branches', 'categories', 'departments', 'branchId', 'period',
            'dateFrom', 'dateTo', 'startDate', 'endDate', 'summary'
        ));
    }

    public function getBranchProfitLoss(Request $request)
    {
        $branchId = $request->get('branch_id');
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

        $query = Branch::with(['sales', 'expenses']);

        if ($branchId) {
            $query->where('id', $branchId);
        }

        $branches = $query->get()->map(function ($branch) use ($startDate, $endDate) {
            $revenue = $branch->sales()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('total_amount');

            $cogs = $this->calculateCostOfGoodsSold($branch->id, $startDate, $endDate);
            $operatingExpenses = $branch->expenses()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount');

            $grossProfit = $revenue - $cogs;
            $netProfit = $grossProfit - $operatingExpenses;
            $grossMargin = $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0;
            $netMargin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

            return [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'revenue' => $revenue,
                'cost_of_goods_sold' => $cogs,
                'gross_profit' => $grossProfit,
                'operating_expenses' => $operatingExpenses,
                'net_profit' => $netProfit,
                'gross_margin' => round($grossMargin, 2),
                'net_margin' => round($netMargin, 2),
                'expense_ratio' => $revenue > 0 ? ($operatingExpenses / $revenue) * 100 : 0,
            ];
        });

        return response()->json($branches);
    }

    public function getChartData(Request $request)
    {
        $days = $request->get('days', 30);
        $startDate = Carbon::now()->subDays($days)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        // 1. Revenue vs Expenses (Line/Area)
        $revenueData = DB::table('sales')
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $expenseData = DB::table('expenses')
            ->selectRaw('DATE(date) as date, SUM(amount) as total')
            ->where('status', 'Approved')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Fill gaps in dates
        $period = new \DatePeriod(
            new \DateTime($startDate),
            new \DateInterval('P1D'),
            new \DateTime($endDate->addDay())
        );

        $labels = [];
        $revValues = [];
        $expValues = [];

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $labels[] = $date->format('M d');
            $revValues[] = $revenueData->firstWhere('date', $dateStr)->total ?? 0;
            $expValues[] = $expenseData->firstWhere('date', $dateStr)->total ?? 0;
        }

        // 2. Branch Performance (Bar Chart)
        $branchPerformance = Branch::all()->map(function ($branch) use ($startDate, $endDate) {
            return [
                'name' => $branch->name,
                'revenue' => $branch->sales()->whereBetween('created_at', [$startDate, $endDate])->sum('total_amount'),
                'expenses' => $branch->expenses()->where('status', 'Approved')->whereBetween('date', [$startDate, $endDate])->sum('amount'),
            ];
        })->sortByDesc('revenue')->values();

        // 3. Expense Categories (Donut)
        $expenseCategories = DB::table('expenses')
            ->selectRaw('category as name, SUM(amount) as value')
            ->where('status', 'Approved')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('category')
            ->orderByDesc('value')
            ->limit(6)
            ->get();

        return response()->json([
            'main_chart' => [
                'labels' => $labels,
                'revenue' => $revValues,
                'expenses' => $expValues,
            ],
            'branch_chart' => [
                'labels' => $branchPerformance->pluck('name'),
                'revenue' => $branchPerformance->pluck('revenue'),
                'expenses' => $branchPerformance->pluck('expenses'),
            ],
            'category_chart' => [
                'labels' => $expenseCategories->pluck('name'),
                'values' => $expenseCategories->pluck('value'),
            ],
        ]);
    }

    public function getConsolidatedProfitLoss(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

        $totalRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');

        $totalCOGS = $this->calculateCostOfGoodsSold(null, $startDate, $endDate);
        $totalExpenses = Expense::whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $grossProfit = $totalRevenue - $totalCOGS;
        $netProfit = $grossProfit - $totalExpenses;

        $monthlyComparison = $this->getMonthlyComparison($startDate, $endDate);

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'total_revenue' => $totalRevenue,
            'cost_of_goods_sold' => $totalCOGS,
            'gross_profit' => $grossProfit,
            'operating_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'gross_margin' => $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0,
            'net_margin' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0,
            'monthly_comparison' => $monthlyComparison,
            'branch_breakdown' => $this->getBranchContribution($startDate, $endDate),
        ]);
    }

    public function getProductProfitability()
    {
        $products = DB::table('products as p')
            ->leftJoin('sale_items as si', 'p.id', '=', 'si.product_id')
            ->leftJoin('sales as s', 'si.sale_id', '=', 's.id')
            ->selectRaw('
                p.id,
                p.name,
                p.cost_price,
                p.selling_price,
                COUNT(DISTINCT s.id) as total_orders,
                SUM(si.quantity) as total_units_sold,
                SUM(si.quantity * si.unit_price) as total_revenue,
                SUM(si.quantity * p.cost_price) as total_cost,
                (SUM(si.quantity * si.unit_price) - SUM(si.quantity * p.cost_price)) as net_profit,
                (SUM(si.quantity * si.unit_price) - SUM(si.quantity * p.cost_price)) / SUM(si.quantity * si.unit_price) * 100 as net_margin,
                SUM(si.quantity * si.unit_price) / COUNT(DISTINCT s.id) as avg_order_value
            ')
            ->where('s.created_at', '>=', Carbon::now()->subDays(90))
            ->whereNotNull('si.id')
            ->groupBy('p.id', 'p.name', 'p.cost_price', 'p.selling_price')
            ->orderByDesc('net_profit')
            ->get();

        return response()->json($products);
    }

    public function getProductContributionMargin()
    {
        $products = DB::table('products as p')
            ->leftJoin('sale_items as si', 'p.id', '=', 'si.product_id')
            ->leftJoin('sales as s', 'si.sale_id', '=', 's.id')
            ->selectRaw('
                p.id,
                p.name,
                p.cost_price as variable_cost_per_unit,
                p.selling_price as selling_price_per_unit,
                (p.selling_price - p.cost_price) as contribution_margin_per_unit,
                (p.selling_price - p.cost_price) / p.selling_price * 100 as contribution_margin_ratio,
                SUM(si.quantity) as total_units_sold,
                SUM(si.quantity * (p.selling_price - p.cost_price)) as total_contribution_margin
            ')
            ->where('s.created_at', '>=', Carbon::now()->subDays(90))
            ->whereNotNull('si.id')
            ->groupBy('p.id', 'p.name', 'p.cost_price', 'p.selling_price')
            ->orderByDesc('total_contribution_margin')
            ->get();

        return response()->json($products);
    }

    /**
     * Modern balance sheet screen that backs admin/finance/balance-sheet.blade.php.
     * This reuses the existing general report logic for now.
     */
    public function balanceSheet(Request $request)
    {
        // Resolve selected branch from request, or use default
        $selectedBranchId = $request->get('branch') ?: session('active_branch_id');
        $user = auth()->user();
        $isGlobal = $user->isGlobal();

        if (! $isGlobal) {
            $selectedBranchId = $selectedBranchId ?: $user->branch_id;
        }

        $branchId = ($selectedBranchId === 'all' || $selectedBranchId === 'null' || ! $selectedBranchId) ? null : $selectedBranchId;

        $branches = Branch::query()->where('is_active', true)
            ->get(['id', 'system_name as name'])
            ->toArray();

        $period = $request->get('period', 'month');
        $branchFilter = $request->get('branch') ?: 'all';
        $dateFrom = $request->get('start_date');
        $dateTo = $request->get('end_date');

        if (! $dateFrom || ! $dateTo) {
            switch ($period) {
                case 'today':
                    $dateFrom = $dateTo = now()->format('Y-m-d');
                    break;
                case 'yesterday':
                    $dateFrom = $dateTo = now()->subDay()->format('Y-m-d');
                    break;
                case 'week':
                    $dateFrom = now()->startOfWeek()->format('Y-m-d');
                    $dateTo = now()->endOfWeek()->format('Y-m-d');
                    break;
                case 'year':
                    $dateFrom = now()->startOfYear()->format('Y-m-d');
                    $dateTo = now()->endOfYear()->format('Y-m-d');
                    break;
                case 'month':
                default:
                    $dateFrom = now()->startOfMonth()->format('Y-m-d');
                    $dateTo = now()->endOfMonth()->format('Y-m-d');
            }
        }

        $dateFrom = Carbon::parse($dateFrom);
        $dateTo = Carbon::parse($dateTo);
        $asAt = $dateTo->copy();

        // Get all departments/categories
        $departments = Category::orderBy('category_name')->get();

        // Resolve liquid categories using the controller's helper logic
        $payments = Payment::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->get();

        $mobile = 0;
        $cash = 0;
        $bank = 0;
        foreach ($payments as $p) {
            $cat = $this->categorizePaymentMethod($p->payment_method);
            if ($cat === 'mobile') {
                $mobile += (float) $p->amount_paid;
            } elseif ($cat === 'bank') {
                $bank += (float) $p->amount_paid;
            } else {
                $cash += (float) $p->amount_paid;
            }
        }

        // 4. Accounts Receivable (outstanding loan balances at end date)
        $receivables = Loan::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'Paid')
            ->sum('balance');

        // 5. Inventory Value (sum of stock value from inventories table)
        $inventory = DB::table('inventories')
            ->join('products', function ($join) {
                $join->on('inventories.product_id', '=', 'products.id')
                    ->where('inventories.product_type', '=', 'App\\Models\\Product');
            })
            ->where('inventories.branch_id', $branchId)
            ->where('products.is_enabled', true)
            ->sum(DB::raw('inventories.qty * COALESCE(products.product_price, 0)')) ?? 0;

        $totalAssets = $mobile + $cash + $bank + $receivables + $inventory;

        // Calculate LIABILITIES & EQUITY
        // Liabilities: sum of unpaid/pending expenses
        $liabilities = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->whereIn('status', ['Pending', 'Partial'])
            ->sum('amount');

        // Equity: To ensure the balance sheet balances, Equity = Assets - Liabilities
        // We still calculate net profit for informational purposes
        $totalRevenue = Sale::query()->where('is_return', false)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->sum('total_amount');

        $totalExpenses = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->where('status', 'Approved')
            ->sum('amount');

        $netProfit = $totalRevenue - $totalExpenses;
        $equity = $totalAssets - $liabilities;
        $totalLiabilitiesEquity = $liabilities + $equity;

        // Asset Details
        $assets = collect([
            (object) ['name' => 'Mobile', 'amount' => $mobile, 'in_period' => true],
            (object) ['name' => 'Cash', 'amount' => $cash, 'in_period' => true],
            (object) ['name' => 'Bank', 'amount' => $bank, 'in_period' => true],
            (object) ['name' => 'Accounts Receivable', 'amount' => $receivables, 'in_period' => false],
            (object) ['name' => 'Inventory', 'amount' => $inventory, 'in_period' => false],
        ]);

        // Liability Details
        $liabilitiesBreakdown = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->whereIn('status', ['Pending', 'Partial'])
            ->select('category', DB::raw('SUM(amount) as amount'))
            ->groupBy('category')
            ->get()
            ->map(function ($row) {
                return (object) [
                    'name' => $row->category ?: 'General',
                    'amount' => (float) $row->amount,
                ];
            });

        // Branch Breakdown
        $department_breakdown = collect();
        if ($branchFilter === 'all') {
            $department_breakdown = Branch::query()->where('is_active', true)
                ->orderBy('system_name')
                ->get()
                ->map(function ($branch) use ($dateFrom, $dateTo) {
                    // Calculate assets for this branch
                    $mobile = Payment::query()->where('branch_id', $branch->id)
                        ->whereBetween('payment_date', [$dateFrom, $dateTo])
                        ->where('payment_method', 'mobile')
                        ->sum('amount_paid');

                    $cash = Payment::query()->where('branch_id', $branch->id)
                        ->whereBetween('payment_date', [$dateFrom, $dateTo])
                        ->where('payment_method', 'cash')
                        ->sum('amount_paid');

                    $bank = Payment::query()->where('branch_id', $branch->id)
                        ->whereBetween('payment_date', [$dateFrom, $dateTo])
                        ->where('payment_method', 'bank')
                        ->sum('amount_paid');

                    $receivables = Loan::query()->where('branch_id', $branch->id)
                        ->where('status', '!=', 'Paid')
                        ->sum('balance');

                    $inventory = DB::table('inventories')
                        ->join('products', function ($join) {
                            $join->on('inventories.product_id', '=', 'products.id')
                                ->where('inventories.product_type', '=', 'App\\Models\\Product');
                        })
                        ->where('inventories.branch_id', $branch->id)
                        ->where('products.is_enabled', true)
                        ->sum(DB::raw('inventories.qty * COALESCE(products.product_price, 0)'));

                    $totalAssets = $mobile + $cash + $bank + $receivables + $inventory;

                    $revenue = Sale::query()->where('branch_id', $branch->id)
                        ->where('is_return', false)
                        ->whereBetween('created_at', [$dateFrom, $dateTo])
                        ->sum('total_amount');

                    $expenses = Expense::query()->where('branch_id', $branch->id)
                        ->whereBetween('date', [$dateFrom, $dateTo])
                        ->where('status', 'Approved')
                        ->sum('amount');

                    return (object) [
                        'branch_name' => $branch->name ?: $branch->system_name ?: 'Branch',
                        'mobile' => $mobile,
                        'cash' => $cash,
                        'bank' => $bank,
                        'receivables' => $receivables,
                        'total_assets' => $totalAssets,
                        'revenue' => $revenue,
                        'expenses' => $expenses,
                    ];
                });
        }

        $product_breakdown = DB::table('inventories')
            ->join('products', function ($join) {
                $join->on('inventories.product_id', '=', 'products.id')
                    ->where('inventories.product_type', '=', 'App\\Models\\Product');
            })
            ->when($branchId, fn ($q) => $q->where('inventories.branch_id', $branchId))
            ->where('products.is_enabled', true)
            ->select('products.product_name as name', DB::raw('SUM(inventories.qty * COALESCE(products.product_price, 0)) as total_assets'))
            ->groupBy('products.id', 'products.product_name')
            ->get()
            ->map(function ($p) {
                return (object) [
                    'name' => $p->name ?: 'Product',
                    'mobile' => 0,
                    'cash' => 0,
                    'bank' => 0,
                    'receivables' => 0,
                    'total_assets' => $p->total_assets,
                ];
            });

        $customer_breakdown = Loan::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'Paid')
            ->select('customer_name as name', DB::raw('SUM(balance) as receivables'))
            ->groupBy('customer_name')
            ->get()
            ->map(function ($c) {
                return (object) [
                    'name' => $c->name ?: 'Customer',
                    'mobile' => 0,
                    'cash' => 0,
                    'bank' => 0,
                    'receivables' => $c->receivables,
                    'total_assets' => $c->receivables,
                ];
            });

        return Inertia::render('Admin/Finance/BalanceSheet', [
            'period' => $period,
            'dateFrom' => $dateFrom->format('Y-m-d'),
            'dateTo' => $dateTo->format('Y-m-d'),
            'asAt' => $asAt->format('M d, Y'),
            'currentBranchId' => $selectedBranchId,
            'isGlobal' => $isGlobal,
            'assets' => $assets,
            'liabilitiesBreakdown' => $liabilitiesBreakdown,
            'equityBreakdown' => collect([(object) ['name' => 'Net Profit', 'amount' => $netProfit]]),
            'department_breakdown' => $department_breakdown,
            'product_breakdown' => $product_breakdown,
            'customer_breakdown' => $customer_breakdown,
            'summary' => [
                'mobile' => $mobile,
                'cash' => $cash,
                'bank' => $bank,
                'receivables' => $receivables,
                'inventory' => $inventory,
                'total_assets' => $totalAssets,
                'liabilities' => $liabilities,
                'equity' => $equity,
                'total_liabilities_equity' => $totalLiabilitiesEquity,
            ],
        ]);
    }

    /**
     * PDF/print version of balance sheet
     */
    public function balanceSheetPdf(Request $request)
    {
        $selectedBranchId = $request->get('branch');
        $user = Auth::user();
        $isGlobal = $user->isGlobal();

        if (! $isGlobal) {
            $selectedBranchId = $selectedBranchId ?: session('active_branch_id') ?: $user->branch_id;
        }

        $branchId = ($selectedBranchId === 'all' || $selectedBranchId === 'null' || ! $selectedBranchId) ? null : $selectedBranchId;

        // Brading Logic
        $branch = null;
        $logo = null;
        $logoMime = 'image/png';
        $businessName = Setting::getValue('business_name', Setting::getValue('system_name', 'Jopo Juniours Co. Ltd'));
        $branchName = $businessName;
        $branchAddress = null;

        if ($branchId) {
            $branch = Branch::find($branchId);
            if ($branch) {
                $branchName = $branch->system_name ?: $branch->name;
                $branchAddress = $branch->address ?: null;
                if ($branch->logo) {
                    $branchLogoPath = storage_path('app/'.$branch->logo);
                    if (file_exists($branchLogoPath)) {
                        $logo = base64_encode(file_get_contents($branchLogoPath));
                        $ext = strtolower(pathinfo($branch->logo, PATHINFO_EXTENSION));
                        $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
                    }
                }
            }
        }

        if (! $logo) {
            $systemLogoPath = Setting::getValue('system_logo');
            if ($systemLogoPath && Storage::disk('public')->exists($systemLogoPath)) {
                $logo = base64_encode(Storage::disk('public')->get($systemLogoPath));
                $ext = strtolower(pathinfo($systemLogoPath, PATHINFO_EXTENSION));
                $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            }
        }

        // Resolve period / dates (reuse same logic)
        $period = $request->get('period', 'month');
        $branchFilter = $request->get('branch') ?: 'all';
        $dateFrom = $request->get('start_date');
        $dateTo = $request->get('end_date');

        if (! $dateFrom || ! $dateTo) {
            switch ($period) {
                case 'today':
                    $dateFrom = $dateTo = now()->format('Y-m-d');
                    break;
                case 'yesterday':
                    $dateFrom = $dateTo = now()->subDay()->format('Y-m-d');
                    break;
                case 'week':
                    $dateFrom = now()->startOfWeek()->format('Y-m-d');
                    $dateTo = now()->endOfWeek()->format('Y-m-d');
                    break;
                case 'year':
                    $dateFrom = now()->startOfYear()->format('Y-m-d');
                    $dateTo = now()->endOfYear()->format('Y-m-d');
                    break;
                case 'month':
                default:
                    $dateFrom = now()->startOfMonth()->format('Y-m-d');
                    $dateTo = now()->endOfMonth()->format('Y-m-d');
            }
        }

        $dateFrom = Carbon::parse($dateFrom);
        $dateTo = Carbon::parse($dateTo);
        $asAt = $dateTo->copy();

        // Resolve liquid categories using the controller's helper logic
        $payments = Payment::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->get();

        $mobile = 0;
        $cash = 0;
        $bank = 0;
        foreach ($payments as $p) {
            $cat = $this->categorizePaymentMethod($p->payment_method);
            if ($cat === 'mobile') {
                $mobile += (float) $p->amount_paid;
            } elseif ($cat === 'bank') {
                $bank += (float) $p->amount_paid;
            } else {
                $cash += (float) $p->amount_paid;
            }
        }

        $receivables = Loan::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'Paid')
            ->sum('balance');

        $inventory = DB::table('inventories')
            ->join('products', function ($join) {
                $join->on('inventories.product_id', '=', 'products.id')
                    ->where('inventories.product_type', '=', 'App\\Models\\Product');
            })
            ->where('inventories.branch_id', $branchId)
            ->where('products.is_enabled', true)
            ->sum(DB::raw('inventories.qty * COALESCE(products.product_price, 0)')) ?? 0;

        $totalAssets = $mobile + $cash + $bank + $receivables + $inventory;

        // Calculate LIABILITIES & EQUITY
        $liabilities = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->whereIn('status', ['Pending', 'Partial'])
            ->sum('amount');

        $totalRevenue = Sale::query()->where('is_return', false)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->sum('total_amount');

        $totalExpenses = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->where('status', 'Approved')
            ->sum('amount');

        $netProfit = $totalRevenue - $totalExpenses;
        $equity = $totalAssets - $liabilities;
        $totalLiabilitiesEquity = $liabilities + $equity;

        // Asset Details
        $assets = collect([
            (object) ['name' => 'Mobile', 'amount' => $mobile, 'in_period' => true],
            (object) ['name' => 'Cash', 'amount' => $cash, 'in_period' => true],
            (object) ['name' => 'Bank', 'amount' => $bank, 'in_period' => true],
            (object) ['name' => 'Accounts Receivable', 'amount' => $receivables, 'in_period' => false],
            (object) ['name' => 'Inventory', 'amount' => $inventory, 'in_period' => false],
        ]);

        // Liability Details
        $liabilitiesBreakdown = Expense::query()->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->whereIn('status', ['Pending', 'Partial'])
            ->select('category', DB::raw('SUM(amount) as amount'))
            ->groupBy('category')
            ->get()
            ->map(function ($row) {
                return (object) [
                    'name' => $row->category ?: 'General',
                    'amount' => (float) $row->amount,
                ];
            });

        // Branch Breakdown
        $department_breakdown = collect();
        if ($branchFilter === 'all') {
            $department_breakdown = Branch::query()->where('is_active', true)
                ->orderBy('system_name')
                ->get()
                ->map(function ($branch) use ($dateFrom, $dateTo) {
                    // Calculate assets for this branch
                    $mobile = Payment::query()->where('branch_id', $branch->id)
                        ->whereBetween('payment_date', [$dateFrom, $dateTo])
                        ->where('payment_method', 'mobile')
                        ->sum('amount_paid');

                    $cash = Payment::query()->where('branch_id', $branch->id)
                        ->whereBetween('payment_date', [$dateFrom, $dateTo])
                        ->where('payment_method', 'cash')
                        ->sum('amount_paid');

                    $bank = Payment::query()->where('branch_id', $branch->id)
                        ->whereBetween('payment_date', [$dateFrom, $dateTo])
                        ->where('payment_method', 'bank')
                        ->sum('amount_paid');

                    $receivables = Loan::query()->where('branch_id', $branch->id)
                        ->where('status', '!=', 'Paid')
                        ->sum('balance');

                    $inventory = DB::table('inventories')
                        ->join('products', function ($join) {
                            $join->on('inventories.product_id', '=', 'products.id')
                                ->where('inventories.product_type', '=', 'App\\Models\\Product');
                        })
                        ->where('inventories.branch_id', $branch->id)
                        ->where('products.is_enabled', true)
                        ->sum(DB::raw('inventories.qty * COALESCE(products.product_price, 0)'));

                    $totalAssets = $mobile + $cash + $bank + $receivables + $inventory;

                    return (object) [
                        'branch_name' => $branch->name ?: $branch->system_name ?: 'Branch',
                        'mobile' => $mobile,
                        'cash' => $cash,
                        'bank' => $bank,
                        'receivables' => $receivables,
                        'total_assets' => $totalAssets,
                    ];
                });
        }

        $product_breakdown = DB::table('inventories')
            ->join('products', function ($join) {
                $join->on('inventories.product_id', '=', 'products.id')
                    ->where('inventories.product_type', '=', 'App\\Models\\Product');
            })
            ->when($branchId, fn ($q) => $q->where('inventories.branch_id', $branchId))
            ->where('products.is_enabled', true)
            ->select('products.product_name as name', DB::raw('SUM(inventories.qty * COALESCE(products.product_price, 0)) as total_assets'))
            ->groupBy('products.id', 'products.product_name')
            ->get()
            ->map(function ($p) {
                return (object) [
                    'name' => $p->name ?: 'Product',
                    'mobile' => 0,
                    'cash' => 0,
                    'bank' => 0,
                    'receivables' => 0,
                    'total_assets' => $p->total_assets,
                ];
            });

        $customer_breakdown = Loan::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'Paid')
            ->select('customer_name as name', DB::raw('SUM(balance) as receivables'))
            ->groupBy('customer_name')
            ->get()
            ->map(function ($c) {
                return (object) [
                    'name' => $c->name ?: 'Customer',
                    'mobile' => 0,
                    'cash' => 0,
                    'bank' => 0,
                    'receivables' => $c->receivables,
                    'total_assets' => $c->receivables,
                ];
            });

        $data = [
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'startDate' => $dateFrom,
            'endDate' => $dateTo,
            'asAt' => $asAt->format('M d, Y'),
            'logo' => $logo,
            'logoMime' => $logoMime,
            'displayName' => $branchName,
            'displayAddress' => $branchAddress,
            'companyName' => $branchName,
            'companyAddress' => $branchAddress,
            'companyPhone' => Setting::getValue('phone', 'N/A'),
            'companyEmail' => Setting::getValue('email', 'info@hdgroup.com'),
            'isGlobal' => ! $branchId,
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'liabilitiesBreakdown' => $liabilitiesBreakdown,
            'equityBreakdown' => collect([(object) ['name' => 'Net Profit', 'amount' => $netProfit]]),
            'department_breakdown' => $department_breakdown,
            'product_breakdown' => $product_breakdown,
            'customer_breakdown' => $customer_breakdown,
            'summary' => [
                'mobile' => $mobile,
                'cash' => $cash,
                'bank' => $bank,
                'receivables' => $receivables,
                'inventory' => $inventory,
                'total_assets' => $totalAssets,
                'liabilities' => $liabilities,
                'equity' => $equity,
                'total_liabilities_equity' => $totalLiabilitiesEquity,
            ],
        ];

        if ($request->get('action') === 'print') {
            return view('admin.reports.balance-sheet-print', $data);
        }

        $htmlContent = view('admin.reports.balance-sheet-print', $data)->render();
        $pdf = Pdf::loadHTML($htmlContent);

        $filename = 'BalanceSheet-'.str_replace(' ', '-', $branchName).'-'.$dateTo->format('Y-m-d').'.pdf';

        return $pdf->download($filename);
    }

    /**
     * Wrapper for the finance "Financial Analytics Report" screen.
     */
    public function reports(Request $request)
    {
        // For now, reuse existing cash-flow ledger date resolution and pass through to the reports blade.
        $period = $request->get('period', 'month');
        $dateFrom = $request->get('date_from') ?: now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->get('date_to') ?: now()->endOfMonth()->format('Y-m-d');

        $departments = Category::orderBy('category_name')->get();
        $summary = [
            'total_orders' => 0,
            'total_tasks' => 0,
            'total_revenue' => 0,
            'active_salers' => 0,
        ];
        $salers = collect();
        $chartData = [
            'revenue' => [],
            'orders' => [],
            'tasks' => [],
            'labels' => [],
        ];

        return Inertia::render('Admin/Finance/Reports', compact(
            'period',
            'dateFrom',
            'dateTo',
            'departments',
            'summary',
            'salers',
            'chartData'
        ));
    }

    public function getCashFlowForecast(Request $request)
    {
        $days = $request->get('days', 30);

        $historicalCashFlow = $this->getHistoricalCashFlow(30);
        $forecast = $this->forecastCashFlow($historicalCashFlow, $days);

        return response()->json([
            'historical' => $historicalCashFlow,
            'forecast' => $forecast,
            'current_cash_position' => $this->getCurrentCashPosition(),
            'working_capital' => $this->calculateWorkingCapital(),
        ]);
    }

    public function getExpenseAnomalyDetection()
    {
        $expenses = Expense::query()->where('created_at', '>=', Carbon::now()->subDays(90))
            ->orderBy('created_at')
            ->get();

        $anomalies = [];
        $categoryGroups = $expenses->groupBy('category');

        foreach ($categoryGroups as $category => $categoryExpenses) {
            $amounts = $categoryExpenses->pluck('amount')->toArray();

            if (count($amounts) < 3) {
                continue;
            }

            $mean = array_sum($amounts) / count($amounts);
            $stdDev = sqrt(array_sum(array_map(function ($x) use ($mean) {
                return pow($x - $mean, 2);
            }, $amounts)) / count($amounts));

            $threshold = $mean + (2 * $stdDev);

            $categoryAnomalies = $categoryExpenses->filter(function ($expense) use ($threshold) {
                return $expense->amount > $threshold;
            });

            foreach ($categoryAnomalies as $expense) {
                $anomalies[] = [
                    'expense_id' => $expense->id,
                    'description' => $expense->description,
                    'category' => $category,
                    'amount' => $expense->amount,
                    'expected_range' => [
                        'min' => $mean - $stdDev,
                        'max' => $mean + $stdDev,
                        'mean' => $mean,
                    ],
                    'variance_percentage' => (($expense->amount - $mean) / $mean) * 100,
                    'severity' => $expense->amount > ($mean + (3 * $stdDev)) ? 'high' : 'medium',
                ];
            }
        }

        return response()->json($anomalies);
    }

    public function getFinancialHealthScores()
    {
        $branches = Branch::all()->map(function ($branch) {
            $healthScore = $this->calculateBranchHealthScore($branch->id);

            return [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'health_score' => $healthScore,
                'components' => [
                    'revenue_growth' => $this->getRevenueGrowthRate($branch->id),
                    'expense_ratio' => $this->getExpenseRatio($branch->id),
                    'stock_turnover' => $this->getStockTurnoverRatio($branch->id),
                ],
                'recommendations' => $this->generateHealthRecommendations($healthScore, $branch->id),
            ];
        });

        $companyHealthScore = $this->calculateCompanyHealthScore();

        return response()->json([
            'company_health_score' => $companyHealthScore,
            'branches' => $branches,
            'industry_benchmark' => 75.0,
            'grade' => $this->getGradeFromScore($companyHealthScore),
        ]);
    }

    private function calculateCostOfGoodsSold($branchId, $startDate, $endDate)
    {
        $query = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->join('products as p', 'si.product_id', '=', 'p.id')
            ->selectRaw('SUM(si.quantity * p.cost_price) as cogs');

        if ($branchId) {
            $query->where('s.branch_id', $branchId);
        }

        return $query->whereBetween('s.created_at', [$startDate, $endDate])
            ->value('cogs') ?? 0;
    }

    private function getMonthlyComparison($startDate, $endDate)
    {
        $previousPeriodStart = Carbon::parse($startDate)->subMonth();
        $previousPeriodEnd = Carbon::parse($endDate)->subMonth();

        $currentRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');

        $previousRevenue = Sale::whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])
            ->sum('total_amount');

        $currentProfit = $this->calculateNetProfit(null, $startDate, $endDate);
        $previousProfit = $this->calculateNetProfit(null, $previousPeriodStart, $previousPeriodEnd);

        return [
            'revenue_growth' => $previousRevenue > 0 ? (($currentRevenue - $previousRevenue) / $previousRevenue) * 100 : 0,
            'profit_growth' => $previousProfit > 0 ? (($currentProfit - $previousProfit) / $previousProfit) * 100 : 0,
        ];
    }

    private function getBranchContribution($startDate, $endDate)
    {
        return Branch::with(['sales'])
            ->get()
            ->map(function ($branch) use ($startDate, $endDate) {
                $revenue = $branch->sales()
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->sum('total_amount');

                return [
                    'branch_name' => $branch->name,
                    'revenue' => $revenue,
                    'contribution_percentage' => 0, // Will be calculated after total is known
                ];
            });
    }

    private function calculateNetProfit($branchId, $startDate, $endDate)
    {
        $revenue = Sale::whereBetween('created_at', [$startDate, $endDate]);
        $cogs = $this->calculateCostOfGoodsSold($branchId, $startDate, $endDate);
        $expenses = Expense::whereBetween('created_at', [$startDate, $endDate]);

        if ($branchId) {
            $revenue->where('branch_id', $branchId);
            $expenses->where('branch_id', $branchId);
        }

        return $revenue->sum('total_amount') - $cogs - $expenses->sum('amount');
    }

    private function getHistoricalCashFlow($days)
    {
        return DB::table('sales')
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as cash_in')
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($day) {
                $cashOut = Expense::whereDate('created_at', $day->date)->sum('amount');

                return [
                    'date' => $day->date,
                    'cash_in' => $day->cash_in,
                    'cash_out' => $cashOut,
                    'net_flow' => $day->cash_in - $cashOut,
                ];
            });
    }

    private function forecastCashFlow($historical, $days)
    {
        if ($historical->count() < 2) {
            return [];
        }

        $avgDailyInflow = $historical->avg('cash_in');
        $avgDailyOutflow = $historical->avg('cash_out');

        $forecast = [];
        $lastDate = Carbon::parse($historical->last()['date']);

        for ($i = 1; $i <= $days; $i++) {
            $futureDate = $lastDate->copy()->addDays($i);

            $forecast[] = [
                'date' => $futureDate->format('Y-m-d'),
                'projected_cash_in' => $avgDailyInflow,
                'projected_cash_out' => $avgDailyOutflow,
                'projected_net_flow' => $avgDailyInflow - $avgDailyOutflow,
            ];
        }

        return $forecast;
    }

    private function getCurrentCashPosition()
    {
        $totalCashIn = Sale::sum('total_amount');
        $totalCashOut = Expense::sum('amount');

        return $totalCashIn - $totalCashOut;
    }

    private function calculateWorkingCapital()
    {
        // Simplified working capital calculation
        $currentAssets = $this->getCurrentCashPosition();
        $inventoryValue = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->sum(DB::raw('inventories.quantity * products.cost_price'));

        return $currentAssets + $inventoryValue;
    }

    private function calculateBranchHealthScore($branchId)
    {
        $revenueGrowth = $this->getRevenueGrowthRate($branchId);
        $expenseRatio = $this->getExpenseRatio($branchId);
        $stockTurnover = $this->getStockTurnoverRatio($branchId);

        // Weighted scoring
        $score = (
            ($revenueGrowth * 0.4) +
            ((100 - $expenseRatio) * 0.35) +
            ($stockTurnover * 0.25)
        );

        return max(0, min(100, $score));
    }

    private function calculateCompanyHealthScore()
    {
        $branches = Branch::all();
        $totalScore = 0;

        foreach ($branches as $branch) {
            $totalScore += $this->calculateBranchHealthScore($branch->id);
        }

        return $branches->count() > 0 ? $totalScore / $branches->count() : 0;
    }

    private function getRevenueGrowthRate($branchId)
    {
        $currentMonthRevenue = Sale::query()->where('branch_id', $branchId)
            ->whereMonth('created_at', Carbon::now()->month)
            ->sum('total_amount');

        $previousMonthRevenue = Sale::query()->where('branch_id', $branchId)
            ->whereMonth('created_at', Carbon::now()->subMonth()->month)
            ->sum('total_amount');

        return $previousMonthRevenue > 0 ?
            (($currentMonthRevenue - $previousMonthRevenue) / $previousMonthRevenue) * 100 : 50;
    }

    private function getExpenseRatio($branchId)
    {
        $monthlyRevenue = Sale::query()->where('branch_id', $branchId)
            ->whereMonth('created_at', Carbon::now()->month)
            ->sum('total_amount');

        $monthlyExpenses = Expense::query()->where('branch_id', $branchId)
            ->whereMonth('created_at', Carbon::now()->month)
            ->sum('amount');

        return $monthlyRevenue > 0 ? ($monthlyExpenses / $monthlyRevenue) * 100 : 100;
    }

    private function getStockTurnoverRatio($branchId)
    {
        // Simplified stock turnover calculation
        $cogs = $this->calculateCostOfGoodsSold($branchId,
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth()
        );
        $avgInventory = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->where('inventories.branch_id', $branchId)
            ->avg(DB::raw('inventories.quantity * products.cost_price')) ?? 0;

        return $avgInventory > 0 ? ($cogs / $avgInventory) * 12 : 0; // Annualized
    }

    private function generateHealthRecommendations($score, $branchId)
    {
        $recommendations = [];

        if ($score < 60) {
            $recommendations[] = 'Critical: Immediate action required to improve financial health';
        } elseif ($score < 75) {
            $recommendations[] = 'Warning: Implement cost control measures';
        }

        if ($this->getExpenseRatio($branchId) > 70) {
            $recommendations[] = 'High expense ratio detected - review and optimize costs';
        }

        if ($this->getRevenueGrowthRate($branchId) < 0) {
            $recommendations[] = 'Declining revenue - implement growth strategies';
        }

        return $recommendations;
    }

    private function getGradeFromScore($score)
    {
        if ($score >= 90) {
            return 'A';
        }
        if ($score >= 80) {
            return 'B';
        }
        if ($score >= 70) {
            return 'C';
        }
        if ($score >= 60) {
            return 'D';
        }

        return 'F';
    }

    /**
     * Daily financial report. CEO can see all branches; others see their branch.
     */
    public function dailyReport(Request $request)
    {
        [$period, $dateFrom, $dateTo] = $this->resolveDailyReportPeriod(
            $request->get('period'),
            $request->get('date_from'),
            $request->get('date_to')
        );
        $branchId = $request->get('branch') ?: session('active_branch_id');
        $user = Auth::user();
        $isGlobal = $user->isGlobal();

        // If not global user, they can only see their own branch or active session branch
        if (! $isGlobal) {
            $branchId = $branchId ?: session('active_branch_id') ?: $user->branch_id;
        }

        // Get all branches for selector
        $branches = Branch::query()->where('is_active', true)
            ->get(['id', 'system_name as name'])
            ->toArray();

        $data = $this->buildDailyReportData($period, $dateFrom, $dateTo, $branchId);
        $data['isGlobal'] = $isGlobal && ! $branchId; // True only if global user AND no specific branch selected
        $data['currentBranch'] = $branchId ? Branch::find($branchId) : null;

        $pdfParams = array_filter([
            'period' => $period,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'branch' => $branchId,
        ], fn ($v) => $v !== null && $v !== '');

        $data['pdfUrl'] = route('admin.finance.daily-report.pdf', $pdfParams);
        $data['pdfFilename'] = 'finance-daily-report-'.($dateFrom === $dateTo ? $dateFrom : ($dateFrom.'_to_'.$dateTo)).'.pdf';

        return Inertia::render('Admin/Finance/DailyReport', $data);
    }

    /**
     * Print view for daily report (Chibo-style). Opens in new window and triggers print.
     */
    public function dailyReportPrint(Request $request)
    {
        [$period, $dateFrom, $dateTo] = $this->resolveDailyReportPeriod(
            $request->get('period'),
            $request->get('date_from'),
            $request->get('date_to')
        );
        $branchId = $request->get('branch') ?: session('active_branch_id');
        $user = Auth::user();
        $isGlobal = $user->isGlobal();

        if (! $isGlobal) {
            $branchId = $branchId ?: session('active_branch_id') ?: $user->branch_id;
        }

        // Get branch information for logo and header
        $branch = null;
        $logo = null;
        $logoMime = 'image/png';
        $businessName = Setting::getValue('business_name', Setting::getValue('system_name', 'Jopo Juniours Co. Ltd'));
        $branchName = $businessName;
        $branchAddress = null;

        if ($branchId && $branchId > 0) {
            $branch = Branch::find($branchId);
            if ($branch) {
                $branchName = $branch->system_name ?? $branch->name;
                $branchAddress = $branch->address ?? null;
                if ($branch->logo) {
                    $branchLogoPath = storage_path('app/'.$branch->logo);
                    if (file_exists($branchLogoPath)) {
                        $logo = base64_encode(file_get_contents($branchLogoPath));
                        $ext = strtolower(pathinfo($branch->logo, PATHINFO_EXTENSION));
                        $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
                    }
                }
            }
        }

        // If no branch logo, use system logo from settings
        if (! $logo) {
            $systemLogoPath = Setting::getValue('system_logo');
            if ($systemLogoPath && Storage::disk('public')->exists($systemLogoPath)) {
                $logo = base64_encode(Storage::disk('public')->get($systemLogoPath));
                $ext = strtolower(pathinfo($systemLogoPath, PATHINFO_EXTENSION));
                $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            }
        }

        $carbonFrom = Carbon::parse($dateFrom);
        $carbonTo = Carbon::parse($dateTo);
        $isRange = $dateFrom !== $dateTo;

        $data = $this->buildDailyReportData($period, $dateFrom, $dateTo, $branchId);

        return view('admin.finance.daily-report-pdf', [
            'reportData' => $data['reportData'] ?? [],
            'grandTotals' => $data['grandTotals'] ?? ['income' => [], 'expense' => []],
            'logo' => $logo,
            'logoMime' => $logoMime,
            'branchName' => $branchName,
            'branchAddress' => $branchAddress,
            'isGlobal' => $isGlobal && ! $branchId,
            'carbonFrom' => $carbonFrom,
            'carbonTo' => $carbonTo,
            'isRange' => $isRange,
        ]);
    }

    /**
     * Download daily report as PDF.
     */
    public function dailyReportDownloadPDF(Request $request)
    {
        [$period, $dateFrom, $dateTo] = $this->resolveDailyReportPeriod(
            $request->get('period'),
            $request->get('date_from'),
            $request->get('date_to')
        );
        $branchId = $request->get('branch') ?: session('active_branch_id');
        $user = Auth::user();
        $isGlobal = $user->isGlobal();

        if (! $isGlobal) {
            $branchId = $branchId ?: session('active_branch_id') ?: $user->branch_id;
        }

        // Get branch information for logo and header
        $branch = null;
        $logo = null;
        $logoMime = 'image/png';
        $businessName = Setting::getValue('business_name', Setting::getValue('system_name', 'Jopo Juniours Co. Ltd'));
        $branchName = $businessName;
        $branchAddress = null;

        if ($branchId && $branchId > 0) {
            $branch = Branch::find($branchId);
            if ($branch) {
                $branchName = $branch->system_name ?? $branch->name;
                $branchAddress = $branch->address ?? null;
                if ($branch->logo) {
                    $branchLogoPath = storage_path('app/'.$branch->logo);
                    if (file_exists($branchLogoPath)) {
                        $logo = base64_encode(file_get_contents($branchLogoPath));
                        $ext = strtolower(pathinfo($branch->logo, PATHINFO_EXTENSION));
                        $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
                    }
                }
            }
        }

        // If no branch logo, use system logo from settings
        if (! $logo) {
            $systemLogoPath = Setting::getValue('system_logo');
            if ($systemLogoPath && Storage::disk('public')->exists($systemLogoPath)) {
                $logo = base64_encode(Storage::disk('public')->get($systemLogoPath));
                $ext = strtolower(pathinfo($systemLogoPath, PATHINFO_EXTENSION));
                $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            }
        }

        $carbonFrom = Carbon::parse($dateFrom);
        $carbonTo = Carbon::parse($dateTo);
        $isRange = $dateFrom !== $dateTo;

        $data = $this->buildDailyReportData($period, $dateFrom, $dateTo, $branchId);

        $viewData = [
            'reportData' => $data['reportData'] ?? [],
            'grandTotals' => $data['grandTotals'] ?? ['income' => [], 'expense' => []],
            'logo' => $logo,
            'logoMime' => $logoMime,
            'branchName' => $branchName,
            'branchAddress' => $branchAddress,
            'isGlobal' => $isGlobal,
            'carbonFrom' => $carbonFrom,
            'carbonTo' => $carbonTo,
            'isRange' => $isRange,
        ];

        if ($request->get('action') === 'print') {
            return view('admin.finance.daily-report-pdf', $viewData);
        }

        $htmlContent = view('admin.finance.daily-report-pdf', $viewData)->render();

        $pdf = Pdf::loadHTML($htmlContent);
        $filename = 'Daily-Report-'.$branchName.'-'.$carbonFrom->format('Y-m-d').'.pdf';

        return $pdf->download($filename);
    }

    /**
     * Print daily report as PDF (with print dialog trigger).
     */
    public function dailyReportPrintPDF(Request $request)
    {
        [$period, $dateFrom, $dateTo] = $this->resolveDailyReportPeriod(
            $request->get('period'),
            $request->get('date_from'),
            $request->get('date_to')
        );
        $branchId = $request->get('branch') ?: session('active_branch_id');
        $user = Auth::user();
        $isGlobal = $user->isGlobal();

        if (! $isGlobal) {
            $branchId = $branchId ?: session('active_branch_id') ?: $user->branch_id;
        }

        // Get branch information for logo and header
        $branch = null;
        $logo = null;
        $logoMime = 'image/png';
        $businessName = Setting::getValue('business_name', Setting::getValue('system_name', 'Jopo Juniours Co. Ltd'));
        $branchName = $businessName;
        $branchAddress = null;

        if ($branchId && $branchId > 0) {
            $branch = Branch::find($branchId);
            if ($branch) {
                $branchName = $branch->system_name ?? $branch->name;
                $branchAddress = $branch->address ?? null;
                if ($branch->logo) {
                    $branchLogoPath = storage_path('app/'.$branch->logo);
                    if (file_exists($branchLogoPath)) {
                        $logo = base64_encode(file_get_contents($branchLogoPath));
                        $ext = strtolower(pathinfo($branch->logo, PATHINFO_EXTENSION));
                        $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
                    }
                }
            }
        }

        // If no branch logo, use system logo from settings
        if (! $logo) {
            $systemLogoPath = Setting::getValue('system_logo');
            if ($systemLogoPath && Storage::disk('public')->exists($systemLogoPath)) {
                $logo = base64_encode(Storage::disk('public')->get($systemLogoPath));
                $ext = strtolower(pathinfo($systemLogoPath, PATHINFO_EXTENSION));
                $logoMime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            }
        }

        $carbonFrom = Carbon::parse($dateFrom);
        $carbonTo = Carbon::parse($dateTo);
        $isRange = $dateFrom !== $dateTo;

        $data = $this->buildDailyReportData($period, $dateFrom, $dateTo, $branchId);

        $htmlContent = view('admin.finance.daily-report-pdf', [
            'reportData' => $data['reportData'] ?? [],
            'grandTotals' => $data['grandTotals'] ?? ['income' => [], 'expense' => []],
            'logo' => $logo,
            'logoMime' => $logoMime,
            'branchName' => $branchName,
            'branchAddress' => $branchAddress,
            'isGlobal' => $isGlobal,
            'carbonFrom' => $carbonFrom,
            'carbonTo' => $carbonTo,
            'isRange' => $isRange,
        ])->render();

        $pdf = Pdf::loadHTML($htmlContent);
        $filename = 'Daily-Report-'.$branchName.'-'.$carbonFrom->format('Y-m-d').'.pdf';

        // Return PDF for printing (displays in browser)
        return $pdf->stream($filename);

    }

    protected function resolveDailyReportPeriod($period, $dateFrom, $dateTo): array
    {
        if (! $period) {
            $period = ($dateFrom || $dateTo) ? 'custom' : 'today';
        }
        if ($period === 'custom') {
            $dateFrom = $dateFrom ?: now()->format('Y-m-d');
            $dateTo = $dateTo ?: now()->format('Y-m-d');
        } else {
            switch ($period) {
                case 'today':
                    $dateFrom = now()->format('Y-m-d');
                    $dateTo = now()->format('Y-m-d');
                    break;
                case 'yesterday':
                    $dateFrom = now()->subDay()->format('Y-m-d');
                    $dateTo = now()->subDay()->format('Y-m-d');
                    break;
                case 'week':
                    $dateFrom = now()->startOfWeek()->format('Y-m-d');
                    $dateTo = now()->endOfWeek()->format('Y-m-d');
                    break;
                case 'month':
                    $dateFrom = now()->startOfMonth()->format('Y-m-d');
                    $dateTo = now()->endOfMonth()->format('Y-m-d');
                    break;
                case 'year':
                    $dateFrom = now()->startOfYear()->format('Y-m-d');
                    $dateTo = now()->endOfYear()->format('Y-m-d');
                    break;
                default:
                    $dateFrom = now()->format('Y-m-d');
                    $dateTo = now()->format('Y-m-d');
            }
        }

        return [$period, $dateFrom, $dateTo];
    }

    protected function categorizePaymentMethod(string $method): string
    {
        $m = strtolower($method ?? '');
        if (str_contains($m, 'mobile') || str_contains($m, 'money') || str_contains($m, 'mpesa') || str_contains($m, 'tigopesa') || str_contains($m, 'airtel')) {
            return 'mobile';
        }
        if (str_contains($m, 'bank') || str_contains($m, 'transfer') || str_contains($m, 'crdb') || str_contains($m, 'nmb') || str_contains($m, 'card')) {
            return 'bank';
        }

        return 'cash';
    }

    protected function buildDailyReportData(string $period, string $dateFrom, string $dateTo, $branchId): array
    {
        $carbonFrom = Carbon::parse($dateFrom)->startOfDay();
        $carbonTo = Carbon::parse($dateTo)->endOfDay();
        $isRange = $dateFrom !== $dateTo;

        $branches = Branch::query()->where('is_active', true)->orderBy('name')->get();
        $reportData = [];
        $branchIds = $branchId ? [$branchId] : $branches->pluck('id')->toArray();

        // In global mode (no specific branch), also collect payments created under no branch
        if (! $branchId) {
            $branchIds[] = null;
        }

        foreach ($branchIds as $bid) {
            if ($bid === null) {
                $branch = ['name' => 'Global / Unassigned', 'id' => null];
            } else {
                $branch = $branches->firstWhere('id', $bid) ?? Branch::find($bid);
                if (! $branch) {
                    continue;
                }
            }

            $incomeItems = [];
            $payments = Payment::with(['loan', 'user', 'sale.items.product', 'sale.posCustomer', 'sale.customer'])
                ->when($bid !== null, fn ($q) => $q->where('branch_id', $bid), fn ($q) => $q->whereNull('branch_id'))
                ->whereBetween('payment_date', [$carbonFrom, $carbonTo])
                ->orderBy('payment_date')
                ->get();

            foreach ($payments as $p) {
                $customerName = 'Walk-in Customer';
                if ($p->sale && $p->sale->posCustomer) {
                    $customerName = $p->sale->posCustomer->customer_name ?? $p->sale->posCustomer->name ?? 'Walk-in Customer';
                } elseif ($p->sale && $p->sale->customer) {
                    $customerName = $p->sale->customer->name ?? 'Walk-in Customer';
                } elseif ($p->loan) {
                    $customerName = $p->loan->customer_name ?? 'Loan Customer';
                } elseif ($p->user) {
                    $customerName = $p->user->staff_name ?? $p->user->name ?? 'Staff';
                }

                // Prefer product name from related sale items; fall back to loan/payment text
                if ($p->sale && $p->sale->items->count() > 0) {
                    $productNames = $p->sale->items->map(function ($item) {
                        return $item->product->product_name ?? $item->product->name ?? 'Product';
                    })->toArray();
                    $desc = implode(', ', $productNames);
                } else {
                    $desc = $p->loan ? ('Debt '.($p->loan->unique_id ?? '')) : 'Payment';
                }
                $key = 'pay_'.$p->id;

                // Use sale balance when payment is for a sale; loan balance when payment is for a loan only
                $remain = 0.0;
                if ($p->sale) {
                    $remain = (float) ($p->sale->balance ?? max(0, ($p->sale->payable_amount - $p->sale->amount_paid)));
                } elseif ($p->loan) {
                    $remain = (float) ($p->loan->balance ?? 0);
                }
                $remain = max(0, $remain);
                $isDebt = $remain > 0;

                $incomeItems[$key] = [
                    'customer_name' => $customerName,
                    'description' => $desc,
                    'mobile' => 0,
                    'cash' => 0,
                    'bank' => 0,
                    'remain' => $remain,
                    'is_debt' => $isDebt,
                ];
                $cat = $this->categorizePaymentMethod($p->payment_method);
                $incomeItems[$key][$cat] = ($incomeItems[$key][$cat] ?? 0) + (float) $p->amount_paid;
            }

            // Append loans with outstanding balances that had no payment in this date range
            $paidLoanUids = $payments->filter(fn ($p) => $p->loan)->pluck('unique_id')->unique()->toArray();
            $outstandingLoansQuery = Loan::when($bid !== null, fn ($q) => $q->where('branch_id', $bid), fn ($q) => $q->whereNull('branch_id'))
                ->where('balance', '>', 0);
            if (! empty($paidLoanUids)) {
                $outstandingLoansQuery->whereNotIn('unique_id', $paidLoanUids);
            }
            foreach ($outstandingLoansQuery->get() as $loan) {
                $incomeItems['loan_'.$loan->id] = [
                    'customer_name' => $loan->customer_name ?? 'Loan Customer',
                    'description' => 'Outstanding Debt '.($loan->unique_id ?? ''),
                    'mobile' => 0,
                    'cash' => 0,
                    'bank' => 0,
                    'remain' => (float) ($loan->balance ?? 0),
                    'is_debt' => true,
                ];
            }

            $expenseItems = [];
            $expenses = Expense::query()
                ->when($bid !== null, fn ($q) => $q->where('branch_id', $bid), fn ($q) => $q->whereNull('branch_id'))
                ->where('status', 'Approved')
                ->whereBetween('date', [$carbonFrom, $carbonTo])
                ->orderBy('date')
                ->get();

            foreach ($expenses as $e) {
                $item = [
                    'description' => $e->description ?: $e->category,
                    'mobile' => 0,
                    'cash' => 0,
                    'bank' => 0,
                ];
                $cat = $this->categorizePaymentMethod($e->payment_method);
                $item[$cat] = (float) $e->amount;
                $expenseItems[] = $item;
            }

            // Skip the Global/Unassigned entry when it has no data
            if ($bid === null && empty($incomeItems) && empty($expenseItems)) {
                continue;
            }

            $reportData[] = [
                'branch' => $branch,
                'incomeItems' => array_values($incomeItems),
                'expenseItems' => $expenseItems,
            ];
        }

        $grandTotals = [
            'income' => ['mobile' => 0, 'cash' => 0, 'bank' => 0, 'remain' => 0, 'total_debt' => 0],
            'expense' => ['mobile' => 0, 'cash' => 0, 'bank' => 0],
        ];
        foreach ($reportData as $data) {
            foreach ($data['incomeItems'] as $item) {
                $grandTotals['income']['mobile'] += $item['mobile'];
                $grandTotals['income']['cash'] += $item['cash'];
                $grandTotals['income']['bank'] += $item['bank'];
                $grandTotals['income']['remain'] += $item['remain'];
                if ($item['is_debt'] ?? false) {
                    $grandTotals['income']['total_debt'] += $item['remain'];
                }
            }
            foreach ($data['expenseItems'] as $item) {
                $grandTotals['expense']['mobile'] += $item['mobile'];
                $grandTotals['expense']['cash'] += $item['cash'];
                $grandTotals['expense']['bank'] += $item['bank'];
            }
        }

        return compact(
            'reportData', 'dateFrom', 'dateTo',
            'carbonFrom', 'carbonTo', 'isRange', 'branches', 'period', 'grandTotals', 'branchId'
        );
    }
}
