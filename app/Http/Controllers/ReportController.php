<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Expense;
use App\Models\Inventory;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductManagement;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalesTarget;
use App\Models\Setting;
use App\Models\Store;
use App\Models\Transfer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Inventory Report — a combined stock dashboard, store-level inventory,
     * product list and stock-transfer view in one interface.
     */
    public function inventory_index(Request $request)
    {
        $filters = $this->resolveInventoryFilters($request);
        $storeId = $filters['store_id'];
        $range = $filters['range']; // [start Carbon, end Carbon] or null

        $prd = $this->getInventoryProducts($storeId);
        $overview = $this->getInventoryOverview($storeId, $range);
        $productList = $this->getInventoryProductList($storeId);
        $transfers = $this->getInventoryTransfers($storeId, $range);
        $outStock = $this->getOutOfStockProducts($storeId);
        $totalQty = $overview['total_stock'];
        $inventory_profit = $overview['stock_cost'];
        $categories = Category::orderBy('category_name')->get();
        $stores = Store::withoutGlobalScope('branch')->orderBy('store_name')->get(['id', 'store_name']);

        $topProductsQ = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->where('sales.is_return', false);
        if ($range) {
            $topProductsQ->whereBetween('sales.created_at', [$range[0], $range[1]]);
        }
        if ($storeId) {
            $topProductsQ->where('sale_items.source_store_id', $storeId);
        }
        $topProducts = $topProductsQ
            ->selectRaw('products.product_name, product_managements.image_1, SUM(sale_items.quantity) as total_qty, SUM(sale_items.subtotal) as total_revenue')
            ->groupBy('products.id', 'products.product_name', 'product_managements.image_1')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->product_name,
                'image' => $r->image_1,
                'qty' => (int) $r->total_qty,
                'revenue' => (float) $r->total_revenue,
            ]);

        return Inertia::render('Admin/Reports/Inventory', compact(
            'prd',
            'totalQty',
            'inventory_profit',
            'overview',
            'productList',
            'transfers',
            'outStock',
            'categories',
            'topProducts',
            'stores',
            'filters'
        ));
    }

    public function print_inventory(Request $request)
    {
        $filters = $this->resolveInventoryFilters($request);
        $storeId = $filters['store_id'];
        $range = $filters['range'];

        $prd = $this->getInventoryProducts($storeId);
        $overview = $this->getInventoryOverview($storeId, $range);
        $outStock = $this->getOutOfStockProducts($storeId);

        $topProductsQ = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.is_return', false);
        if ($range) {
            $topProductsQ->whereBetween('sales.created_at', [$range[0], $range[1]]);
        }
        if ($storeId) {
            $topProductsQ->where('sale_items.source_store_id', $storeId);
        }
        $topProducts = $topProductsQ
            ->selectRaw('products.product_name, SUM(sale_items.quantity) as total_qty, SUM(sale_items.subtotal) as total_revenue')
            ->groupBy('products.id', 'products.product_name')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();

        $storeName = $filters['store_name'];
        $periodLabel = $range
            ? $range[0]->format('d M Y').' — '.$range[1]->format('d M Y')
            : 'All dates';

        $type = $request->get('type', 'valued'); // valued, unvalued, top-selling, alerts
        $data = compact('prd', 'type', 'topProducts', 'outStock', 'overview', 'storeName', 'periodLabel');

        if ($request->has('download')) {
            $pdf = \PDF::loadView('admin.reports.print-inventory', $data);

            return $pdf->download('inventory-report-'.$type.'.pdf');
        }

        return view('admin.reports.print-inventory', $data);
    }

    /**
     * Kept for backwards compatibility with the old filter route.
     */
    public function filter_inventory_by_date(Request $request)
    {
        return $this->inventory_index($request);
    }

    /**
     * Resolve the store + date-range filters shared across the inventory report.
     *
     * @return array{store_id: int|null, store_name: string, range: array{0: Carbon, 1: Carbon}|null, start_date: string|null, end_date: string|null}
     */
    private function resolveInventoryFilters(Request $request): array
    {
        $storeId = $request->filled('store_id') && $request->store_id !== 'all'
            ? (int) $request->store_id
            : null;

        $storeName = 'All Stores';
        if ($storeId) {
            $storeName = Store::withoutGlobalScope('branch')->whereKey($storeId)->value('store_name') ?: 'All Stores';
        }

        $start = $request->input('start_date');
        $end = $request->input('end_date');

        $range = null;
        if ($start && $end) {
            $s = Carbon::parse($start)->startOfDay();
            $e = Carbon::parse($end)->endOfDay();
            if ($s->lte($e)) {
                $range = [$s, $e];
            }
        }

        return [
            'store_id' => $storeId,
            'store_name' => $storeName,
            'range' => $range,
            'start_date' => $start,
            'end_date' => $end,
        ];
    }

    /**
     * Stock overview + "important inventory information" figures, all derived
     * from live database data (never hardcoded).
     */
    private function getInventoryOverview(?int $storeId, ?array $range): array
    {
        $buyExpr = 'COALESCE(NULLIF(products.buying_price, 0), NULLIF(product_managements.buying_price, 0), 0)';
        $sellExpr = 'COALESCE(NULLIF(products.product_price, 0), NULLIF(product_managements.product_price, 0), 0)';

        $stockQ = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->leftJoin('product_managements', 'products.product_management_id', '=', 'product_managements.id');
        if ($storeId) {
            $stockQ->where('inventories.store_id', $storeId);
        }
        $stock = $stockQ->selectRaw("
            COALESCE(SUM(inventories.qty), 0) as total_stock,
            COALESCE(SUM(inventories.qty * {$buyExpr}), 0) as stock_cost,
            COALESCE(SUM(inventories.qty * {$sellExpr}), 0) as expected_sale_value
        ")->first();

        $stockCost = (float) ($stock->stock_cost ?? 0);
        $saleValue = (float) ($stock->expected_sale_value ?? 0);
        $totalStock = (float) ($stock->total_stock ?? 0);

        // Total distinct products that carry an inventory record (optionally in the store).
        $productsQ = DB::table('inventories')->distinct();
        if ($storeId) {
            $productsQ->where('store_id', $storeId);
        }
        $totalProducts = $productsQ->count('product_id');

        // Low stock / out of stock against the product reorder level.
        $levelQ = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->whereNotNull('product_managements.level');
        if ($storeId) {
            $levelQ->where('inventories.store_id', $storeId);
        }
        $levelRows = $levelQ->selectRaw('inventories.qty, product_managements.level')->get();
        $lowStock = $levelRows->filter(fn ($r) => $r->qty > 0 && $r->qty <= $r->level)->count();
        $outOfStock = $levelRows->filter(fn ($r) => $r->qty <= 0)->count();

        // Stock transfers in the period.
        $transferQ = Transfer::withoutGlobalScope('branch');
        if ($range) {
            $transferQ->whereBetween('created_at', [$range[0], $range[1]]);
        }
        if ($storeId) {
            $transferQ->where(function ($q) use ($storeId) {
                $q->where('source_store_id', $storeId)->orWhere('destination_store_id', $storeId);
            });
        }
        $stockTransfers = (clone $transferQ)->distinct('unique_id')->count('unique_id');

        // Units sold in the period.
        $soldQ = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.is_return', false);
        if ($range) {
            $soldQ->whereBetween('sales.created_at', [$range[0], $range[1]]);
        }
        if ($storeId) {
            $soldQ->where('sale_items.source_store_id', $storeId);
        }
        $productsSold = (float) $soldQ->sum('sale_items.quantity');

        // Stock adjustments in the period.
        $adjustQ = DB::table('stock_adjustments');
        if ($range) {
            $adjustQ->whereBetween('created_at', [$range[0], $range[1]]);
        }
        if ($storeId) {
            $adjustQ->where('store_id', $storeId);
        }
        $stockAdjustments = $adjustQ->count();

        return [
            'stock_cost' => $stockCost,
            'expected_sale_value' => $saleValue,
            'expected_sell_profit' => $saleValue - $stockCost,
            'total_stock' => $totalStock,
            'total_products' => $totalProducts,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'stock_transfers' => $stockTransfers,
            'products_sold' => $productsSold,
            'stock_adjustments' => $stockAdjustments,
        ];
    }

    /**
     * Product list — every product with its current stock level, optionally
     * scoped to a single store.
     */
    private function getInventoryProductList(?int $storeId): Collection
    {
        $buyExpr = 'COALESCE(NULLIF(products.buying_price, 0), NULLIF(product_managements.buying_price, 0), 0)';
        $sellExpr = 'COALESCE(NULLIF(products.product_price, 0), NULLIF(product_managements.product_price, 0), 0)';

        $query = DB::table('products')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->leftJoin('inventories', function ($join) use ($storeId) {
                $join->on('inventories.product_id', '=', 'products.id');
                if ($storeId) {
                    $join->where('inventories.store_id', '=', $storeId);
                }
            })
            ->groupBy(
                'products.id',
                'products.product_name',
                'products.product_id',
                'products.buying_price',
                'products.product_price',
                'product_managements.unit_name',
                'product_managements.category_name',
                'product_managements.level',
                'product_managements.buying_price',
                'product_managements.product_price'
            )
            ->orderBy('products.product_name')
            ->selectRaw("
                products.id,
                products.product_name,
                products.product_id as sku,
                product_managements.unit_name,
                product_managements.category_name,
                product_managements.level,
                COALESCE(SUM(inventories.qty), 0) as qty,
                {$buyExpr} as buying_price,
                {$sellExpr} as selling_price,
                COALESCE(SUM(inventories.qty), 0) * {$buyExpr} as stock_cost,
                COALESCE(SUM(inventories.qty), 0) * {$sellExpr} as stock_value
            ");

        return $query->get()->map(function ($r) {
            $qty = (float) $r->qty;
            $level = $r->level !== null ? (float) $r->level : null;
            $status = $qty <= 0 ? 'out' : ($level !== null && $qty <= $level ? 'low' : 'ok');

            return [
                'id' => $r->id,
                'product_name' => $r->product_name,
                'sku' => $r->sku,
                'unit_name' => $r->unit_name,
                'category_name' => $r->category_name,
                'level' => $level,
                'qty' => $qty,
                'buying_price' => (float) $r->buying_price,
                'selling_price' => (float) $r->selling_price,
                'stock_cost' => (float) $r->stock_cost,
                'stock_value' => (float) $r->stock_value,
                'status' => $status,
            ];
        });
    }

    /**
     * Grouped stock transfers for the report (source/destination store, item
     * count, quantity and internal buying + selling values).
     */
    private function getInventoryTransfers(?int $storeId, ?array $range): Collection
    {
        $query = Transfer::withoutGlobalScope('branch')
            ->selectRaw('
                unique_id,
                MIN(created_at) as created_at,
                MIN(staff_name) as staff_name,
                MIN(status) as status,
                MIN(source_store_id) as source_store_id,
                MIN(destination_store_id) as destination_store_id,
                COUNT(*) as product_count,
                SUM(product_quantity) as total_quantity,
                SUM(product_quantity * COALESCE(buying_price, 0)) as total_buying_value,
                SUM(product_quantity * COALESCE(selling_price, 0)) as total_selling_value
            ')
            ->groupBy('unique_id')
            ->orderByDesc('created_at')
            ->limit(200);

        if ($range) {
            $query->whereBetween('created_at', [$range[0], $range[1]]);
        }
        if ($storeId) {
            $query->where(function ($q) use ($storeId) {
                $q->where('source_store_id', $storeId)->orWhere('destination_store_id', $storeId);
            });
        }

        $rows = $query->get();

        $storeNames = Store::withoutGlobalScope('branch')
            ->whereIn('id', $rows->pluck('source_store_id')->merge($rows->pluck('destination_store_id'))->filter()->unique())
            ->pluck('store_name', 'id');

        return $rows->map(fn ($t) => [
            'unique_id' => $t->unique_id,
            'created_at' => $t->created_at,
            'staff_name' => $t->staff_name,
            'status' => $t->status,
            'product_count' => (int) $t->product_count,
            'total_quantity' => (float) $t->total_quantity,
            'total_buying_value' => (float) $t->total_buying_value,
            'total_selling_value' => (float) $t->total_selling_value,
            'source_store' => $storeNames[$t->source_store_id] ?? '—',
            'destination_store' => $storeNames[$t->destination_store_id] ?? '—',
        ]);
    }

    public function profit_index(Request $request)
    {
        $period = $request->get('period', 'month');
        /** @var User $user */
        $user = Auth::user();
        $isGlobal = $user->isGlobal();
        $branchId = $isGlobal ? $request->get('branch_id') : $user->branch_id;
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $startDate = match ($period) {
            'today' => Carbon::today(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->startOfQuarter(),
            'year' => Carbon::now()->startOfYear(),
            'custom' => $dateFrom ? Carbon::parse($dateFrom) : Carbon::now()->startOfMonth(),
            default => Carbon::now()->startOfMonth(),
        };
        $endDate = ($period === 'custom' && $dateTo) ? Carbon::parse($dateTo)->endOfDay() : Carbon::now();

        $salesQuery = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $expenseQuery = Expense::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $saleIds = (clone $salesQuery)->pluck('id');

        $saleItemsQuery = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereIn('sale_items.sale_id', $saleIds);

        $total_sales = (float) (clone $saleItemsQuery)->sum('sale_items.subtotal');
        $total_cogs = (float) (clone $saleItemsQuery)->selectRaw('SUM(COALESCE(products.buying_price,0) * sale_items.quantity) as total')->value('total');
        $gross_profit = $total_sales - $total_cogs;

        $discounts_total = (float) (clone $salesQuery)->sum('discount_amount');
        $tax_total = (float) (clone $salesQuery)->sum('tax_amount');
        $orders_count = (int) (clone $salesQuery)->count();
        $items_sold = (float) (clone $saleItemsQuery)->sum('sale_items.quantity');
        $average_order_value = $orders_count > 0 ? $total_sales / $orders_count : 0;

        $total_expenses = (float) (clone $expenseQuery)->where('status', 'Approved')->sum('amount');
        $pending_expenses = (float) (clone $expenseQuery)->where('status', 'Pending')->sum('amount');
        $net_profit = $gross_profit - $total_expenses;

        $gross_margin_pct = $total_sales > 0 ? ($gross_profit / $total_sales) * 100 : 0;
        $net_margin_pct = $total_sales > 0 ? ($net_profit / $total_sales) * 100 : 0;
        $expense_ratio_pct = $total_sales > 0 ? ($total_expenses / $total_sales) * 100 : 0;
        $break_even_revenue = $gross_margin_pct > 0 ? ($total_expenses / ($gross_margin_pct / 100)) : 0;

        $expenses = (clone $expenseQuery)
            ->select('id', 'description', 'amount', 'date')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => 'Expense',
                'description' => $item->description ?: 'Expense entry',
                'amount' => -1 * (float) $item->amount,
                'date' => $item->date,
            ]);

        $salesTransactions = (clone $salesQuery)
            ->select('id', 'invoice_number', 'payable_amount', 'created_at')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => 'Sales',
                'description' => 'Sale: '.$item->invoice_number,
                'amount' => (float) $item->payable_amount,
                'date' => $item->created_at,
            ]);

        $transactions = collect($expenses->all())->merge($salesTransactions->all())->sortByDesc('date')->values();

        $topProducts = (clone $saleItemsQuery)
            ->selectRaw('sale_items.product_id, products.product_name, SUM(sale_items.subtotal - (COALESCE(products.buying_price,0) * sale_items.quantity)) as total_profit')
            ->groupBy('sale_items.product_id', 'products.product_name')
            ->orderByDesc('total_profit')
            ->limit(10)
            ->get();

        $paymentBreakdown = (clone $salesQuery)
            ->selectRaw('payment_method, COUNT(*) as total_orders, SUM(payable_amount) as total_amount')
            ->groupBy('payment_method')
            ->orderByDesc('total_amount')
            ->get();

        $statusBreakdown = (clone $salesQuery)
            ->selectRaw('payment_status, COUNT(*) as total_orders, SUM(payable_amount) as total_amount')
            ->groupBy('payment_status')
            ->orderByDesc('total_amount')
            ->get();

        $expenseCategories = (clone $expenseQuery)
            ->where('status', 'Approved')
            ->selectRaw('category, SUM(amount) as total_amount')
            ->groupBy('category')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        $trendDays = [];
        $cursor = $startDate->copy()->startOfDay();
        while ($cursor->lte($endDate) && count($trendDays) < 366) {
            $trendDays[] = $cursor->format('Y-m-d');
            $cursor->addDay();
        }

        $salesDaily = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->selectRaw('DATE(sales.created_at) as day, SUM(sale_items.subtotal) as revenue')
            ->groupBy('day')
            ->pluck('revenue', 'day');

        $cogsDaily = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->selectRaw('DATE(sales.created_at) as day, SUM(COALESCE(products.buying_price,0) * sale_items.quantity) as cogs')
            ->groupBy('day')
            ->pluck('cogs', 'day');

        $expensesDaily = DB::table('expenses')
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'Approved')
            ->selectRaw('DATE(date) as day, SUM(amount) as expenses')
            ->groupBy('day')
            ->pluck('expenses', 'day');

        $profitTrend = collect($trendDays)->map(function ($day) use ($salesDaily, $cogsDaily, $expensesDaily) {
            $revenue = (float) ($salesDaily[$day] ?? 0);
            $cogs = (float) ($cogsDaily[$day] ?? 0);
            $expenses = (float) ($expensesDaily[$day] ?? 0);

            return [
                'day' => $day,
                'revenue' => $revenue,
                'gross_profit' => $revenue - $cogs,
                'expenses' => $expenses,
                'net_profit' => ($revenue - $cogs) - $expenses,
            ];
        });

        $financialStats = [
            'total_cogs' => $total_cogs,
            'discounts_total' => $discounts_total,
            'tax_total' => $tax_total,
            'orders_count' => $orders_count,
            'items_sold' => $items_sold,
            'average_order_value' => $average_order_value,
            'pending_expenses' => $pending_expenses,
            'net_profit' => $net_profit,
            'gross_margin_pct' => $gross_margin_pct,
            'net_margin_pct' => $net_margin_pct,
            'expense_ratio_pct' => $expense_ratio_pct,
            'break_even_revenue' => $break_even_revenue,
        ];

        $categories = Category::orderBy('category_name')->get();
        $branches = $isGlobal ? Branch::select('id', 'name')->orderBy('name')->get() : [];
        $filters = ['period' => $period, 'branch_id' => $branchId, 'date_from' => $dateFrom, 'date_to' => $dateTo];

        return Inertia::render('Admin/Reports/ProfitLoss', compact(
            'total_sales', 'gross_profit', 'total_expenses',
            'transactions', 'topProducts', 'paymentBreakdown', 'statusBreakdown',
            'expenseCategories', 'profitTrend', 'financialStats',
            'categories', 'branches', 'filters', 'isGlobal'
        ));
    }

    public function profit_print(Request $request)
    {
        $period = $request->get('period', 'month');
        /** @var User $user */
        $user = Auth::user();
        $isGlobal = $user->isGlobal();
        $branchId = $isGlobal ? $request->get('branch_id') : $user->branch_id;
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $startDate = match ($period) {
            'today' => Carbon::today(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->startOfQuarter(),
            'year' => Carbon::now()->startOfYear(),
            'custom' => $dateFrom ? Carbon::parse($dateFrom) : Carbon::now()->startOfMonth(),
            default => Carbon::now()->startOfMonth(),
        };
        $endDate = ($period === 'custom' && $dateTo) ? Carbon::parse($dateTo)->endOfDay() : Carbon::now();

        $salesQuery = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $expenseQuery = Expense::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $saleIds = (clone $salesQuery)->pluck('id');

        $saleItemsQuery = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereIn('sale_items.sale_id', $saleIds);

        $totalSales = (float) (clone $saleItemsQuery)->sum('sale_items.subtotal');
        $totalCogs = (float) (clone $saleItemsQuery)->selectRaw('SUM(COALESCE(products.buying_price,0) * sale_items.quantity) as total')->value('total');
        $grossProfit = $totalSales - $totalCogs;

        $discountsTotal = (float) (clone $salesQuery)->sum('discount_amount');
        $taxTotal = (float) (clone $salesQuery)->sum('tax_amount');
        $totalExpenses = (float) (clone $expenseQuery)->where('status', 'Approved')->sum('amount');
        $netProfit = $grossProfit - $totalExpenses;
        $netSales = $totalSales - $discountsTotal;
        $operatingProfit = $grossProfit - $totalExpenses;
        $profitBeforeTax = $operatingProfit + $taxTotal;

        $expenseCategories = (clone $expenseQuery)
            ->where('status', 'Approved')
            ->selectRaw('category, SUM(amount) as total_amount')
            ->groupBy('category')
            ->orderByDesc('total_amount')
            ->get();

        $paymentBreakdown = (clone $salesQuery)
            ->selectRaw('payment_method, SUM(payable_amount) as total_amount')
            ->groupBy('payment_method')
            ->orderByDesc('total_amount')
            ->get();

        $companyName = Setting::getValue('business_name', Setting::getValue('system_name', config('app.name', 'Jopo Juniours Co. Ltd')));
        $companyAddress = Setting::getValue('business_address', '');
        $branchName = 'Global';
        if ($branchId) {
            $branch = Branch::find($branchId);
            if ($branch) {
                $branchName = $branch->name ?? $branch->system_name ?? 'Branch';
            }
        }

        return view('admin.reports.profit-loss-print', [
            'companyName' => $companyName,
            'companyAddress' => $companyAddress,
            'branchName' => $branchName,
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalSales' => $totalSales,
            'discountsTotal' => $discountsTotal,
            'netSales' => $netSales,
            'totalCogs' => $totalCogs,
            'grossProfit' => $grossProfit,
            'totalExpenses' => $totalExpenses,
            'operatingProfit' => $operatingProfit,
            'taxTotal' => $taxTotal,
            'profitBeforeTax' => $profitBeforeTax,
            'netProfit' => $netProfit,
            'expenseCategories' => $expenseCategories,
            'paymentBreakdown' => $paymentBreakdown,
            'printAction' => $request->get('action') === 'print',
        ]);
    }

    public function loans_index(Request $request)
    {
        $startDate = $request->query('start');
        $EndDate = $request->query('end');
        $Amount = $request->query('amount');
        $overDue = $request->query('overDue');
        $loan = Loan::where('status', 'pending')
            ->where('payment_date', '>', now()->toDateString())
            ->get();
        $loan_paid = Loan::where('status', 'paid')->get();
        // $loan_Due = Loan::whereBetween('payment_date', [now()->toDateString(), now()->addDays(7)->toDateString()])->get();
        $loan_Due = Loan::where('payment_date', '<', now()->toDateString())
            ->where('status', '!=', 'paid')
            ->get();
        $payment_history = Payment::all();
        $categories = Category::orderBy('category_name')->get();

        return Inertia::render('Admin/Reports/Loans', compact('loan', 'loan_paid', 'loan_Due', 'payment_history', 'categories'));
    }

    public function sales_index(Request $request)
    {
        $filterType = $request->input('filter_type', 'today');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');
        $categoryId = $request->get('category_id');
        $paymentMethod = $request->get('payment_method');

        // Define Current & Previous Periods for Growth Calculation
        $currentStart = now()->startOfDay();
        $currentEnd = now()->endOfDay();
        $prevStart = now()->subDay()->startOfDay();
        $prevEnd = now()->subDay()->endOfDay();

        if ($filterType == 'yesterday') {
            $currentStart = now()->subDay()->startOfDay();
            $currentEnd = now()->subDay()->endOfDay();
            $prevStart = now()->subDays(2)->startOfDay();
            $prevEnd = now()->subDays(2)->endOfDay();
        } elseif ($filterType == 'week') {
            $currentStart = now()->startOfWeek();
            $currentEnd = now()->endOfWeek();
            $prevStart = now()->subWeek()->startOfWeek();
            $prevEnd = now()->subWeek()->endOfWeek();
        } elseif ($filterType == 'month') {
            $currentStart = now()->startOfMonth();
            $currentEnd = now()->endOfMonth();
            $prevStart = now()->subMonth()->startOfMonth();
            $prevEnd = now()->subMonth()->endOfMonth();
        } elseif ($filterType == 'year') {
            $currentStart = now()->startOfYear();
            $currentEnd = now()->endOfYear();
            $prevStart = now()->subYear()->startOfYear();
            $prevEnd = now()->subYear()->endOfYear();
        } elseif ($startDateInput && $endDateInput) {
            $currentStart = Carbon::parse($startDateInput)->startOfDay();
            $currentEnd = Carbon::parse($endDateInput)->endOfDay();
            $diff = $currentStart->diffInDays($currentEnd) + 1;
            $prevStart = (clone $currentStart)->subDays($diff);
            $prevEnd = (clone $currentEnd)->subDays($diff);
        }

        $periodTypeForTarget = match ($filterType) {
            'year' => 'yearly',
            default => 'monthly',
        };
        $periodLabelForTarget = $periodTypeForTarget === 'yearly'
            ? $currentStart->format('Y')
            : $currentStart->format('Y-m');

        // Fetch Current Period Data from modern POS tables
        $user = Auth::user();
        $branchId = $user->isGlobal() ? ($request->get('branch_id') ?: session('active_branch_id')) : $user->branch_id;

        $query = SaleItem::select(
            'sale_items.*',
            'sale_items.unit_price as product_price',
            'sale_items.quantity as product_quantity',
            'p.product_name',
            'p.buying_price',
            'pm.sku as linked_sku',
            'c.category_name',
            's.payment_method as sale_mode',
            's.user_id as seller_id',
            'u.staff_name as seller_name'
        )
            ->join('sales as s', 'sale_items.sale_id', '=', 's.id')
            ->join('products as p', 'sale_items.product_id', '=', 'p.id')
            ->leftJoin('product_managements as pm', 'p.product_management_id', '=', 'pm.id')
            ->leftJoin('categories as c', 'pm.category_id', '=', 'c.id')
            ->leftJoin('users as u', 's.user_id', '=', 'u.id')
            ->whereBetween('sale_items.created_at', [$currentStart, $currentEnd])
            ->where('s.is_return', false);

        // Apply Multi-Dimension Filters
        if ($branchId && $branchId !== 'all') {
            $query->where('s.branch_id', $branchId);
        }
        if ($categoryId) {
            $query->where('pm.category_id', $categoryId);
        }
        if ($paymentMethod) {
            $query->where('s.payment_method', $paymentMethod);
        }

        $exports = $query->orderBy('sale_items.created_at', 'DESC')->get();

        // Fetch Previous Period Data for Growth
        $prevQuery = SaleItem::select('sale_items.*', 'p.buying_price')
            ->join('sales as s', 'sale_items.sale_id', '=', 's.id')
            ->join('products as p', 'sale_items.product_id', '=', 'p.id')
            ->whereBetween('sale_items.created_at', [$prevStart, $prevEnd])
            ->where('s.is_return', false);

        if ($branchId && $branchId !== 'all') {
            $prevQuery->where('s.branch_id', $branchId);
        }

        $prevExports = $prevQuery->get();

        // Calculate Core Metrics matching Dashboard exactly
        $metricCalc = function ($data) {
            $saleIds = $data->pluck('sale_id')->unique()->filter();
            $rev = (float) Sale::whereIn('id', $saleIds)->where('is_return', false)->sum('payable_amount');
            $prof = (float) $data->sum(function ($i) {
                return ((float) $i->unit_price - (float) $i->buying_price) * (float) $i->quantity;
            });

            return [
                'revenue' => $rev,
                'profit' => $prof,
                'velocity' => $saleIds->count(),
                'margin' => $rev > 0 ? ($prof / $rev) * 100 : 0,
            ];
        };

        $currMetrics = $metricCalc($exports);
        $prevMetrics = $metricCalc($prevExports);
        $totalUnits = (float) $exports->sum(function ($i) {
            return (float) $i->quantity;
        });
        $avgOrderValue = $currMetrics['velocity'] > 0
            ? $currMetrics['revenue'] / $currMetrics['velocity']
            : 0;

        $growth = function ($curr, $prev) {
            if ($prev == 0) {
                return $curr > 0 ? 100 : 0;
            }

            return (($curr - $prev) / $prev) * 100;
        };

        $metrics = [
            'total_revenue' => $currMetrics['revenue'],
            'total_profit' => $currMetrics['profit'],
            'sales_velocity' => $currMetrics['velocity'],
            'unit_margin' => $currMetrics['margin'],
            'total_units' => $totalUnits,
            'avg_order_value' => $avgOrderValue,
            'growth_revenue' => (float) $growth($currMetrics['revenue'], $prevMetrics['revenue']),
            'growth_profit' => (float) $growth($currMetrics['profit'], $prevMetrics['profit']),
            'growth_velocity' => (float) $growth($currMetrics['velocity'], $prevMetrics['velocity']),
            'growth_margin' => (float) ($currMetrics['margin'] - $prevMetrics['margin']),
        ];

        // 1. Revenue Dynamics (Daily vs Hourly Intelligence)
        $isSingleDay = $currentStart->diffInDays($currentEnd) < 1;

        if ($isSingleDay) {
            // Initialize 24-hour skeleton for "Continuous Analysis"
            $hourSkeleton = collect();
            for ($h = 0; $h < 24; $h++) {
                $hourKey = sprintf('%02d:00', $h);
                $hourSkeleton->put($hourKey, ['revenue' => 0.0, 'profit' => 0.0]);
            }

            // Group actual sales
            $actualDynamics = $exports->groupBy(function ($item) {
                return Carbon::parse($item->created_at)->format('H:00');
            })->map(function ($hour) {
                return [
                    'revenue' => (float) $hour->sum(function ($i) {
                        return (float) $i->unit_price * (float) $i->quantity;
                    }),
                    'profit' => (float) $hour->sum(function ($i) {
                        return ((float) $i->unit_price - (float) $i->buying_price) * (float) $i->quantity;
                    }),
                ];
            });

            // Merge actual into skeleton
            $dynamics = $hourSkeleton->merge($actualDynamics)->sortKeys();
        } else {
            // Group by Day for larger periods
            $dynamics = $exports->groupBy(function ($item) {
                return Carbon::parse($item->created_at)->format('M d');
            })->map(function ($day) {
                return [
                    'revenue' => (float) $day->sum(function ($i) {
                        return (float) $i->unit_price * (float) $i->quantity;
                    }),
                    'profit' => (float) $day->sum(function ($i) {
                        return ((float) $i->unit_price - (float) $i->buying_price) * (float) $i->quantity;
                    }),
                ];
            })->sortKeys();
        }

        // 2. Density Analysis (Robust Category Fallback)
        $density = $exports->groupBy(function ($i) {
            return $i->category_name ?? 'Uncategorized';
        })->map(function ($cat) {
            return (float) $cat->sum(function ($i) {
                return (float) $i->unit_price * (float) $i->quantity;
            });
        })->take(8);

        // 3. Temporal Flux (Hourly Velocity)
        $hours = [];
        for ($i = 0; $i < 24; $i++) {
            $hours[$i] = 0;
        }
        foreach ($exports as $ex) {
            $h = (int) Carbon::parse($ex->created_at)->format('H');
            $hours[$h] += (float) ((float) $ex->unit_price * (float) $ex->quantity);
        }

        // 4. Modal Distribution (Robust Mode Fallback)
        $modal = $exports->groupBy(function ($i) {
            return $i->sale_mode ?? 'Other';
        })->map(function ($group) {
            return (float) $group->sum(function ($i) {
                return (float) $i->unit_price * (float) $i->quantity;
            });
        });

        // 5. Seller Performance + Sales Target Achievement
        $salesRoleUserIds = User::query()
            ->where(function ($q) {
                $q->whereHas('role', function ($r) {
                    $r->whereRaw('LOWER(role_name) LIKE ?', ['%seller%'])
                        ->orWhereRaw('LOWER(role_name) LIKE ?', ['%sales%']);
                })->orWhereHas('roles', function ($r) {
                    $r->whereRaw('LOWER(role_name) LIKE ?', ['%seller%'])
                        ->orWhereRaw('LOWER(role_name) LIKE ?', ['%sales%']);
                });
            })
            ->pluck('id')
            ->toArray();

        $targetsBySeller = SalesTarget::where('period_type', $periodTypeForTarget)
            ->where('period_label', $periodLabelForTarget)
            ->whereNotNull('user_id')
            ->whereIn('user_id', $salesRoleUserIds)
            ->get()
            ->keyBy('user_id');

        $sellerPerformance = $exports
            ->groupBy(function ($i) {
                return $i->seller_id ?: 'unknown';
            })
            ->map(function ($rows, $sellerId) use ($targetsBySeller) {
                $first = $rows->first();
                $revenue = (float) $rows->sum(function ($i) {
                    return (float) $i->unit_price * (float) $i->quantity;
                });
                $profit = (float) $rows->sum(function ($i) {
                    return ((float) $i->unit_price - (float) $i->buying_price) * (float) $i->quantity;
                });
                $units = (float) $rows->sum(function ($i) {
                    return (float) $i->quantity;
                });
                $orders = $rows->pluck('sale_id')->unique()->count();

                $target = $targetsBySeller->get((int) $sellerId);
                $targetAmount = (float) ($target->target_amount ?? 0);
                $targetUnits = (float) ($target->target_units ?? 0);
                $achievementPct = $targetAmount > 0 ? round(($revenue / $targetAmount) * 100, 1) : 0;

                return [
                    'seller_id' => is_numeric($sellerId) ? (int) $sellerId : null,
                    'seller_name' => $first->seller_name ?: 'Unassigned',
                    'revenue' => $revenue,
                    'profit' => $profit,
                    'units' => $units,
                    'orders' => $orders,
                    'target_amount' => $targetAmount,
                    'target_units' => $targetUnits,
                    'achievement_pct' => $achievementPct,
                ];
            })
            ->filter(function ($row) use ($salesRoleUserIds) {
                return $row['seller_id'] && in_array((int) $row['seller_id'], $salesRoleUserIds, true);
            })
            ->sortByDesc('revenue')
            ->values();

        $sellerDistribution = $sellerPerformance
            ->map(function ($row) {
                return [
                    'name' => $row['seller_name'],
                    'value' => $row['revenue'],
                ];
            })
            ->values();

        $targetSummary = [
            'assigned_target_amount' => (float) $sellerPerformance->sum('target_amount'),
            'achieved_amount' => (float) $sellerPerformance->sum('revenue'),
            'avg_achievement_pct' => $sellerPerformance->count() > 0
                ? round((float) $sellerPerformance->avg('achievement_pct'), 1)
                : 0,
        ];

        // SKU Fallback
        foreach ($exports as $row) {
            if (! $row->linked_sku) {
                $fallback = ProductManagement::where('product_name', $row->product_name)->first();
                $row->product_sku = $fallback->sku ?? 'MANUAL';
            } else {
                $row->product_sku = $row->linked_sku;
            }
        }

        $categories = Category::orderBy('category_name')->get();

        $topSeller = $sellerPerformance->first();
        $metrics['top_seller_name'] = $topSeller['seller_name'] ?? null;
        $metrics['top_seller_revenue'] = (float) ($topSeller['revenue'] ?? 0);
        $metrics['target_attainment_pct'] = (float) ($targetSummary['avg_achievement_pct'] ?? 0);

        return Inertia::render('Admin/Reports/Sales', compact(
            'exports',
            'metrics',
            'dynamics',
            'density',
            'hours',
            'modal',
            'sellerPerformance',
            'sellerDistribution',
            'targetSummary',
            'filterType',
            'categories',
            'currentStart',
            'currentEnd'
        ));
    }

    public function product_sales($id)
    {
        $sales = DB::table('exports')
            ->join('products', 'exports.product_id', '=', 'products.id')
            ->where('exports.product_id', $id)
            ->get();

        return Inertia::render('Admin/Reports/ProductSales', compact('sales'));
    }

    public function expenses_index(Request $request)
    {
        $query = Expense::where('status', 'Approved');

        // Apply Filters
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('category_id')) {
            $category = Category::find($request->category_id);
            if ($category) {
                $query->where('category', $category->category_name);
            }
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Weekly expense trend by day name (Always based on current week or filtered range?)
        // Let's keep it based on the week of the start_date if provided, else current week.
        $start = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfWeek() : now()->startOfWeek();
        $end = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfWeek() : now()->endOfWeek();

        $weeklyData = Expense::select(
            DB::raw('DAYNAME(date) as day'),
            DB::raw('SUM(amount) as total')
        )
            ->whereBetween('date', [$start, $end])
            ->where('status', 'Approved')
            ->groupBy('day')
            ->get()
            ->pluck('total', 'day');

        // Arrange days: Monday to Sunday
        $daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $weeklyExpenses = [];
        foreach ($daysOfWeek as $day) {
            $weeklyExpenses[] = $weeklyData[$day] ?? 0;
        }

        // Summary data Based on filters
        $totalExpenses = (clone $query)->sum('amount');
        $mostExpensive = (clone $query)->orderByDesc('amount')->first();

        // Recent expenses Based on filters
        $recentExpenses = $query->orderBy('date', 'desc')->limit(50)->get();

        $categories = Category::orderBy('category_name')->get();

        return Inertia::render('Admin/Reports/Expenses', compact('weeklyExpenses', 'totalExpenses', 'mostExpensive', 'recentExpenses', 'categories'));
    }

    public function general_index()
    {
        // 1. Total Sales & Gross Profit (from exports/products)
        $exports = DB::table('exports')
            ->join('products', 'exports.product_id', '=', 'products.id')
            ->get();

        $totalSales = 0;
        $totalBuyingPrice = 0;
        foreach ($exports as $row) {
            $totalSales += ($row->product_price * $row->product_quantity);
            $totalBuyingPrice += ($row->buying_price * $row->product_quantity);
        }
        $grossProfit = $totalSales - $totalBuyingPrice;

        // 2. Total Expenses
        $totalExpenses = Expense::where('status', 'Approved')->sum('amount');

        // 3. Inventory Value (from payloads/products/mzigos - using mzigos logic from general.blade)
        // Actually, general.blade used 'inventory' variable which was join('inventories', 'products')
        $inventory = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->get();

        $inventoryValue = 0;
        foreach ($inventory as $row) {
            $inventoryValue += ($row->buying_price * $row->qty);
        }

        // 4. Net Profit
        $netProfit = $grossProfit - $totalExpenses;

        // 5. Total Purchases (Orders) - Legacy view had this as 0, keeping it safe for now
        $totalPurchases = 0;

        // 6. Outstanding Loans
        $outstandingLoans = Loan::sum('total_amount');

        $categories = Category::orderBy('category_name')->get();

        return Inertia::render('Admin/Reports/General', compact(
            'totalSales',
            'totalExpenses',
            'grossProfit',
            'netProfit',
            'inventoryValue',
            'totalPurchases',
            'outstandingLoans',
            'categories'
        ));
    }

    /*** Private helper methods ***/

    private function getInventoryProductsQuery(?int $storeId = null)
    {
        $query = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->leftJoin('stores', 'inventories.store_id', '=', 'stores.id')
            ->selectRaw('
                inventories.id,
                inventories.qty as pro_quantity,
                products.product_name,
                COALESCE(NULLIF(products.product_price, 0), NULLIF(product_managements.product_price, 0), 0) as product_price,
                COALESCE(NULLIF(products.buying_price, 0), NULLIF(product_managements.buying_price, 0), 0) as buying_price,
                products.product_id as PRDID,
                product_managements.unit_name,
                product_managements.category_name,
                stores.store_name
            ');

        if ($storeId) {
            $query->where('inventories.store_id', $storeId);
        }

        return $query;
    }

    private function getInventoryProducts(?int $storeId = null)
    {
        return $this->getInventoryProductsQuery($storeId)->get();
    }

    private function calculateInventoryProfit(?int $storeId = null)
    {
        $query = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->leftJoin('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->selectRaw('SUM(inventories.qty * COALESCE(NULLIF(products.buying_price, 0), NULLIF(product_managements.buying_price, 0), 0)) as total_profit');

        if ($storeId) {
            $query->where('inventories.store_id', $storeId);
        }

        return $query->value('total_profit');
    }

    private function getOutOfStockProducts(?int $storeId = null)
    {
        $query = DB::table('product_managements')
            ->join('products', 'product_managements.id', '=', 'products.product_management_id')
            ->join('inventories', 'products.id', '=', 'inventories.product_id')
            ->leftJoin('stores', 'inventories.store_id', '=', 'stores.id')
            ->select(
                'product_managements.category_name',
                'product_managements.unit_name',
                'product_managements.level',
                'products.product_name',
                'products.product_id as PRDID',
                'inventories.qty as pro_quantity',
                'stores.store_name'
            )
            ->whereNotNull('product_managements.level')
            ->whereColumn('inventories.qty', '<=', 'product_managements.level');

        if ($storeId) {
            $query->where('inventories.store_id', $storeId);
        }

        return $query->get();
    }

    public function balance_sheet()
    {
        // 1. ASSETS
        // Liquid Assets: Collected Payments - Approved Expenses
        $totalCollected = Payment::sum('amount_paid') ?? 0;
        $totalExpenses = Expense::where('status', 'Approved')->sum('amount') ?? 0;
        $cashOnHand = max(0, $totalCollected - $totalExpenses);

        // Current Assets: Inventory Valuation (buying_price * qty)
        $inventoryValue = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->selectRaw('SUM(products.buying_price * inventories.qty) as total')
            ->value('total') ?? 0;

        // Receivables: Pending Loans
        $receivables = Loan::where('status', 'pending')->sum('total_amount') ?? 0;

        $totalAssets = $cashOnHand + $inventoryValue + $receivables;

        // 2. LIABILITIES
        $liabilities = 0;

        // 3. EQUITY
        $equity = $totalAssets - $liabilities;

        $categories = Category::orderBy('category_name')->get();

        return Inertia::render('Admin/Reports/BalanceSheet', [
            'assets' => [
                'cash' => (float) $cashOnHand,
                'inventory' => (float) $inventoryValue,
                'receivables' => (float) $receivables,
                'total' => (float) $totalAssets,
            ],
            'liabilities' => [
                'total' => (float) $liabilities,
                'items' => [], // Future extension
            ],
            'equity' => [
                'net_worth' => (float) $equity,
            ],
            'categories' => $categories,
        ]);
    }

    public function product_movement(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        $isGlobal = $user->isGlobal();
        $branchId = $isGlobal ? $request->get('branch_id') : $user->branch_id;

        $dateFrom = $request->get('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', Carbon::now()->toDateString());
        $productId = $request->get('product_id');
        $category = $request->get('category');

        $query = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->leftJoin('categories', 'product_managements.category_id', '=', 'categories.id')
            ->whereBetween('sales.created_at', [
                Carbon::parse($dateFrom)->startOfDay(),
                Carbon::parse($dateTo)->endOfDay(),
            ])
            ->where('sales.is_return', false);

        if ($branchId) {
            $query->where('sales.branch_id', $branchId);
        }
        if ($productId) {
            $query->where('sale_items.product_id', $productId);
        }
        if ($category) {
            $query->where('categories.category_name', $category);
        }

        $movements = $query->select([
            'products.id as product_id',
            'product_managements.product_name',
            'product_managements.sku',
            DB::raw('COALESCE(categories.category_name, \'Uncategorized\') as category'),
            'sale_items.unit_price',
            DB::raw('SUM(sale_items.quantity) as total_qty_sold'),
            DB::raw('SUM(sale_items.subtotal) as total_revenue'),
            DB::raw('COUNT(DISTINCT sale_items.sale_id) as num_transactions'),
        ])
            ->groupBy('products.id', 'product_managements.product_name', 'product_managements.sku', 'categories.category_name', 'sale_items.unit_price')
            ->orderByDesc('total_qty_sold')
            ->get();

        $products = DB::table('products')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->orderBy('product_managements.product_name')
            ->get(['products.id', 'product_managements.product_name', 'product_managements.sku']);
        $categories = Category::orderBy('category_name')->get();
        $branches = $isGlobal ? Branch::orderBy('name')->get() : collect();

        return Inertia::render('Admin/Reports/ProductMovement', compact(
            'movements', 'products', 'categories', 'branches',
            'dateFrom', 'dateTo', 'productId', 'category', 'branchId'
        ));
    }

    public function product_movement_print(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        $isGlobal = $user->isGlobal();
        $branchId = $isGlobal ? $request->get('branch_id') : $user->branch_id;

        $dateFrom = $request->get('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', Carbon::now()->toDateString());
        $category = $request->get('category');
        $productId = $request->get('product_id');

        $query = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->leftJoin('categories', 'product_managements.category_id', '=', 'categories.id')
            ->whereBetween('sales.created_at', [
                Carbon::parse($dateFrom)->startOfDay(),
                Carbon::parse($dateTo)->endOfDay(),
            ])
            ->where('sales.is_return', false);

        if ($branchId) {
            $query->where('sales.branch_id', $branchId);
        }
        if ($productId) {
            $query->where('sale_items.product_id', $productId);
        }
        if ($category) {
            $query->where('categories.category_name', $category);
        }

        $movements = $query->select([
            'products.id as product_id',
            'product_managements.product_name',
            'product_managements.sku',
            DB::raw("COALESCE(categories.category_name, 'Uncategorized') as category"),
            'sale_items.unit_price',
            DB::raw('SUM(sale_items.quantity) as total_qty_sold'),
            DB::raw('SUM(sale_items.subtotal) as total_revenue'),
            DB::raw('COUNT(DISTINCT sale_items.sale_id) as num_transactions'),
        ])
            ->groupBy('products.id', 'product_managements.product_name', 'product_managements.sku', 'categories.category_name', 'sale_items.unit_price')
            ->orderByDesc('total_qty_sold')
            ->get();

        $companyName = Setting::getValue('business_name', 'Company Name');
        $companyPhone = Setting::getValue('business_phone', '');
        $companyEmail = Setting::getValue('business_email', '');
        $companyAddress = Setting::getValue('business_address', '');

        $branchName = 'All Branches';
        if ($branchId) {
            $branch = Branch::find($branchId);
            $branchName = $branch?->name ?? 'All Branches';
        }

        return view('admin.reports.product-movement-print', compact(
            'movements', 'dateFrom', 'dateTo', 'branchName',
            'companyName', 'companyPhone', 'companyEmail', 'companyAddress',
            'category', 'branchId'
        ))->with('filterCategory', $category);
    }
}
