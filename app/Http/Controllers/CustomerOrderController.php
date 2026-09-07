<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Cart;
use App\Models\Export;
use App\Models\Invoice;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleChangeLog;
use App\Models\SaleItem;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class CustomerOrderController extends Controller
{
    protected $inventoryService;

    protected function hasSaleChangeLogsTable(): bool
    {
        static $exists = null;

        if ($exists === null) {
            $exists = Schema::hasTable('sale_change_logs');
        }

        return $exists;
    }

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    private function formatPrintTypeLabel(?string $printType): ?string
    {
        if (! $printType) {
            return null;
        }

        $normalized = strtolower(trim($printType));
        if ($normalized === 'plain') {
            return 'Plain';
        }
        if ($normalized === 'printed') {
            return 'Printed';
        }

        return ucfirst($printType);
    }

    private function buildItemDisplayName(?string $baseName, ?string $variantColor = null, ?string $printType = null): string
    {
        $name = trim((string) ($baseName ?: 'Item'));
        $suffix = '';

        if (! empty($variantColor)) {
            $suffix .= ' - '.trim($variantColor);
        }

        $printTypeLabel = $this->formatPrintTypeLabel($printType);
        if ($printTypeLabel) {
            $suffix .= ' ['.$printTypeLabel.']';
        }

        return $name.$suffix;
    }

    private function buildOnlineItemDescriptor(object $row): string
    {
        $base = trim((string) ($row->product_name ?? 'Item'));
        $variation = trim((string) ($row->product_variation ?? $row->unit_type ?? ''));

        if ($variation !== '') {
            return $base.' - '.$variation;
        }

        return $base;
    }

    public function index(Request $request)
    {
        return $this->indexCrud($request);
    }

    public function general_orders(Request $request)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $loansQuery = Loan::select(
            'unique_id',
            'customer_name',
            'is_checked',
            DB::raw('SUM(product_quantity) as total_quantity'),
            DB::raw('SUM(total_amount) as total_amount'),
            DB::raw('SUM(amount_paid) as amount_paid'),
            DB::raw('SUM(balance) as balance'),
            'payment_date',
            'created_at'
        )
            ->groupBy('unique_id', 'customer_name', 'payment_date', 'created_at', 'is_checked')
            ->orderByDesc('id');

        $exportsQuery = Export::selectRaw('
            unique_id,
            is_checked,
            tin,
            customer_name,
            staff_name,
            phone,
            sale_mode,
            payment_date,
            status,
            created_at,
            SUM(product_quantity) as total_quantity,
            SUM(product_price * product_quantity) as total_product_price,
            SUM(unit_price * product_quantity) as total_unit_price,
            SUM(discount * product_quantity) as total_discount,
            SUM((product_price * product_quantity) + (unit_price * product_quantity) - discount) as total_price
        ')
            ->groupBy('unique_id', 'is_checked', 'tin', 'customer_name', 'staff_name', 'phone', 'created_at', 'sale_mode', 'payment_date', 'status')
            ->orderBy('id', 'desc');

        // Advanced Search
        if ($search = $request->input('search')) {
            $loansQuery->where(function ($q) use ($search) {
                $q->where('unique_id', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
            $exportsQuery->where(function ($q) use ($search) {
                $q->where('unique_id', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('tin', 'like', "%{$search}%");
            });
        }

        // Staff Filter
        if ($staff = $request->input('staff_name')) {
            $loansQuery->where('staff_name', $staff);
            $exportsQuery->where('staff_name', $staff);
        }

        // Period Filter logic
        $status = $request->input('status');
        $period = $request->input('period');
        $startDate = null;
        $endDate = null;

        if ($period) {
            switch ($period) {
                case 'today':
                    $startDate = Carbon::today();
                    $endDate = Carbon::now();
                    break;
                case 'yesterday':
                    $startDate = Carbon::yesterday();
                    $endDate = Carbon::yesterday()->endOfDay();
                    break;
                case 'week':
                    $startDate = Carbon::now()->startOfWeek();
                    $endDate = Carbon::now();
                    break;
                case 'month':
                    $startDate = Carbon::now()->startOfMonth();
                    $endDate = Carbon::now();
                    break;
                case '6months':
                    $startDate = Carbon::now()->subMonths(6);
                    $endDate = Carbon::now();
                    break;
                case 'year':
                    $startDate = Carbon::now()->startOfYear();
                    $endDate = Carbon::now();
                    break;
                case 'custom':
                    if ($request->filled('start_date') && $request->filled('end_date')) {
                        $startDate = Carbon::parse($request->start_date)->startOfDay();
                        $endDate = Carbon::parse($request->end_date)->endOfDay();
                    }
                    break;
            }
        }

        if ($startDate && $endDate) {
            $loansQuery->whereBetween('created_at', [$startDate, $endDate]);
            $exportsQuery->whereBetween('created_at', [$startDate, $endDate]);
        }

        // Multi-status Filtering Logic
        $filter = $request->input('filter');
        if ($filter) {
            switch ($filter) {
                // Operational Statuses
                case 'pending':
                    $loansQuery->whereIn('status', ['pending', 'Pending'])->where('is_checked', false);
                    $exportsQuery->whereIn('status', ['pending', 'Pending'])->where('is_checked', false);
                    break;
                case 'confirmed':
                    $loansQuery->whereIn('status', ['confirmed', 'Confirmed'])->where('is_checked', false);
                    $exportsQuery->whereIn('status', ['confirmed', 'Confirmed'])->where('is_checked', false);
                    break;
                case 'checked':
                    $loansQuery->where('is_checked', true);
                    $exportsQuery->where('is_checked', true);
                    break;

                    // Payment Statuses
                case 'full_paid':
                    $loansQuery->where('balance', '<=', 0)->where('amount_paid', '>', 0);
                    // Exports are typically full paid by definition or tracked differently,
                    // but for consistency we check total_price vs payments if needed.
                    // Based on current logic, exports in this view are usually from counter sales.
                    $exportsQuery->where('status', 'Paid');
                    break;
                case 'unpaid':
                    $loansQuery->where('amount_paid', '<=', 0);
                    $exportsQuery->where('status', 'Pending');
                    break;
                case 'balance':
                    $loansQuery->where('amount_paid', '>', 0)->where('balance', '>', 0);
                    // Exports with balance are usually moved to loans, so this might be empty for exports.
                    break;
                case 'completed':
                    // Derived state: Checked AND fully paid
                    $loansQuery->where('is_checked', true)->where('balance', '<=', 0);
                    $exportsQuery->where('is_checked', true)->where('status', 'Paid');
                    break;
            }
        } elseif ($request->has('status')) {
            // Legacy/Extra status filter
            if ($status == 'unchecked') {
                $loansQuery->where('is_checked', false);
                $exportsQuery->where('is_checked', false);
            } elseif ($status == 'checked') {
                $loansQuery->where('is_checked', true);
                $exportsQuery->where('is_checked', true);
            } elseif ($status == 'unpaid') {
                $loansQuery->where('is_checked', false);
                $exportsQuery->where('status', 'Pending');
            }
        } elseif (! $request->hasAny(['search', 'staff_name', 'period', 'filter'])) {
            // Default: Show most recent 50 records if no filters are applied
            $loansQuery->limit(50);
            $exportsQuery->limit(50);
        }

        $loans = $loansQuery->get()->map(function ($item) {
            $item->sale_type = 'installment';
            $item->formatted_total = $item->total_amount;
            $item->formatted_paid = $item->amount_paid;
            $item->formatted_balance = $item->balance;

            return $item;
        });

        $exports = $exportsQuery->get()->map(function ($item) {
            $item->sale_type = 'counter';
            $item->formatted_total = $item->total_price;
            $item->formatted_paid = ($item->status == 'Paid') ? $item->total_price : 0;
            $item->formatted_balance = ($item->status == 'Paid') ? 0 : $item->total_price;

            return $item;
        });

        // Merge and sort globally by created_at desc
        $unifiedOrders = $loans->concat($exports)->sortByDesc('created_at');

        // Calculate HUD Metrics from combined data
        $d['metrics'] = [
            'total_orders' => $unifiedOrders->count(),
            'total_revenue' => $unifiedOrders->sum('formatted_paid'),
            'pending_check' => $unifiedOrders->where('is_checked', false)->count(),
            'total_balance' => $unifiedOrders->sum('formatted_balance'),
        ];

        $d['orders'] = $unifiedOrders;
        $d['staff_members'] = User::where('role_id', '!=', 1)->pluck('staff_name');

        return Inertia::render('Admin/Orders/All', $d);
    }

    public function indexCrud(Request $request)
    {
        $search = $request->input('search', '');
        $paymentStatus = $request->input('payment_status', 'all');
        $period = $request->input('period', '');
        $isGlobal = Auth::user()?->isGlobal() && ! active_branch_id();

        $baseQuery = $isGlobal
            ? Sale::withoutGlobalScopes()
            : Sale::query();

        $query = $baseQuery->with([
            'posCustomer:id,customer_name,customer_phone',
            'customer:id,name,staff_name',
            'cashier:id,staff_name',
            'items:id,sale_id,product_id,variant_color,print_type',
            'items.product:id,product_name',
            'branch:id,name,system_name',
        ])
            ->withCount('items')
            ->withSum('payments', 'amount_paid')
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('posCustomer', fn ($c) => $c->where('customer_name', 'like', "%{$search}%"))
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%")->orWhere('staff_name', 'like', "%{$search}%"));
            });
        }

        if ($paymentStatus !== 'all') {
            $query->where('payment_status', $paymentStatus);
        }

        if ($period) {
            [$start, $end] = match ($period) {
                'today' => [Carbon::today(), Carbon::now()],
                'yesterday' => [Carbon::yesterday(), Carbon::yesterday()->endOfDay()],
                'week' => [Carbon::now()->startOfWeek(), Carbon::now()],
                'month' => [Carbon::now()->startOfMonth(), Carbon::now()],
                '6months' => [Carbon::now()->subMonths(6), Carbon::now()],
                'year' => [Carbon::now()->startOfYear(), Carbon::now()],
                default => [null, null],
            };
            if ($start) {
                $query->whereBetween('created_at', [$start, $end]);
            }
        }

        $sales = $query->limit(200)->get()->map(function ($sale) {
            $amountPaid = (float) ($sale->payments_sum_amount_paid ?? 0);
            $payable = (float) $sale->payable_amount;

            return [
                'unique_id' => $sale->invoice_number,
                'customer_name' => $sale->posCustomer?->customer_name ?? $sale->customer?->name ?? $sale->customer?->staff_name ?? 'Walking Customer',
                'cashier_name' => $sale->cashier?->staff_name ?? 'N/A',
                'payment_method' => $sale->payment_method,
                'payment_status' => $sale->payment_status,
                'formatted_total' => $payable,
                'formatted_paid' => $amountPaid,
                'formatted_balance' => max(0, $payable - $amountPaid),
                'items_count' => $sale->items_count,
                'items_preview' => $sale->items
                    ->take(2)
                    ->map(function ($item) {
                        $productName = $item->product?->product_name ?? $item->item_name ?? 'Item';

                        return $this->buildItemDisplayName($productName, $item->variant_color, $item->print_type);
                    })
                    ->implode(', '),
                'created_at' => $sale->created_at,
                'sale_type' => 'pos',
                'branch_name' => $sale->branch?->name ?? $sale->branch?->system_name ?? null,
                'branch_id' => $sale->branch_id,
            ];
        });

        $statsQuery = $isGlobal ? Sale::withoutGlobalScopes() : Sale::query();
        $allStats = $statsQuery->selectRaw('
            COUNT(*) as total_orders,
            SUM(payable_amount) as total_payable,
            SUM(CASE WHEN payment_status != "Paid" THEN 1 ELSE 0 END) as pending_count
        ')->first();

        $pluckQuery = $isGlobal ? Sale::withoutGlobalScopes() : Sale::query();
        $totalCollected = Payment::whereIn('unique_id', $pluckQuery->pluck('invoice_number'))->sum('amount_paid');

        $metrics = [
            'total_orders' => (int) ($allStats->total_orders ?? 0),
            'total_revenue' => (float) $totalCollected,
            'pending_check' => (int) ($allStats->pending_count ?? 0),
            'total_balance' => max(0, (float) ($allStats->total_payable ?? 0) - $totalCollected),
        ];

        return Inertia::render('Admin/Orders/All', [
            'orders' => $sales,
            'metrics' => $metrics,
            'staff_members' => [],
            'is_global' => $isGlobal,
        ]);
    }

    public function online_orders(Request $request)
    {
        $currentDate = Carbon::now()->format('Y-m-d');
        $cartsQuery = Cart::selectRaw('
        unique_id,
        MAX(is_checked) as is_checked,
        MAX(email) as email,
        MAX(name) as name,
        MAX(phone_number) as phone_number,
        MAX(status) as status,
        MAX(created_at) as created_at,
        SUM(quantity) as total_quantity,
        GROUP_CONCAT(CONCAT(quantity, " ", IFNULL(unit_type, "Units")) SEPARATOR ", ") as items_breakdown,
        SUM(price) as total_price,
        SUM((price * quantity) - (discount * quantity)) as total_disc_price,
        MAX(IFNULL(amount_paid, 0)) as total_paid
    ')
            ->groupBy('unique_id')
            ->orderByRaw('MAX(created_at) desc');

        $status = $request->input('status');
        $period = $request->input('period');
        $search = $request->input('search');
        $startDate = null;
        $endDate = null;

        // Period Filter logic
        if ($period) {
            switch ($period) {
                case 'today':
                    $startDate = Carbon::today();
                    $endDate = Carbon::now();
                    break;
                case 'yesterday':
                    $startDate = Carbon::yesterday();
                    $endDate = Carbon::yesterday()->endOfDay();
                    break;
                case 'week':
                    $startDate = Carbon::now()->startOfWeek();
                    $endDate = Carbon::now();
                    break;
                case 'month':
                    $startDate = Carbon::now()->startOfMonth();
                    $endDate = Carbon::now();
                    break;
                case '6months':
                    $startDate = Carbon::now()->subMonths(6);
                    $endDate = Carbon::now();
                    break;
                case 'year':
                    $startDate = Carbon::now()->startOfYear();
                    $endDate = Carbon::now();
                    break;
                case 'custom':
                    if ($request->filled('start_date') && $request->filled('end_date')) {
                        $startDate = Carbon::parse($request->start_date)->startOfDay();
                        $endDate = Carbon::parse($request->end_date)->endOfDay();
                    }
                    break;
            }
        }

        if ($search) {
            $cartsQuery->where(function ($q) use ($search) {
                $q->where('unique_id', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($startDate && $endDate) {
            $cartsQuery->whereBetween('created_at', [$startDate, $endDate]);
        }

        // Multi-status Filtering Logic
        $filter = $request->input('filter');
        if ($filter) {
            switch ($filter) {
                case 'pending':
                    $cartsQuery->where('status', 'pending')->where('is_checked', false);
                    break;
                case 'confirmed':
                    $cartsQuery->where('status', 'confirmed')->where('is_checked', false);
                    break;
                case 'checked':
                    $cartsQuery->where('is_checked', true);
                    break;
                case 'unpaid':
                    $cartsQuery->where('is_checked', false)->where('status', 'Pending');
                    break;
                case 'completed':
                    $cartsQuery->where('is_checked', true);
                    break;
                case 'full_paid':
                    $cartsQuery->havingRaw('total_paid >= total_disc_price');
                    break;
            }
        } elseif ($status == 'unchecked') {
            $cartsQuery->where('is_checked', false);
        } elseif ($status == 'checked') {
            $cartsQuery->where('is_checked', true);
        } elseif (! $request->hasAny(['search', 'status', 'period', 'filter'])) {
            // Default: Show most recent 50 records if no filters are applied
            $cartsQuery->limit(50);
        }

        $orders = $cartsQuery->get();

        $rowsByOrder = Cart::select('unique_id', 'quantity', 'product_name', 'unit_type')
            ->whereIn('unique_id', $orders->pluck('unique_id')->all())
            ->orderBy('id')
            ->get()
            ->groupBy('unique_id');

        $orders = $orders->map(function ($order) use ($rowsByOrder) {
            $rows = $rowsByOrder->get($order->unique_id, collect());
            $order->items_breakdown = $rows->map(function ($row) {
                return (int) $row->quantity.'x '.$this->buildOnlineItemDescriptor($row);
            })->implode(', ');

            return $order;
        });

        // Calculate HUD Metrics
        $d['metrics'] = [
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('total_disc_price'),
            'pending_check' => $orders->where('is_checked', false)->count(),
        ];

        $d['orders'] = $orders;
        $d['staff_members'] = User::where('role_id', '!=', 1)->pluck('staff_name');

        return Inertia::render('Admin/Orders/Online', $d);
    }

    public function reports(Request $request)
    {
        // dd($request->all());
        $d['transfers'] = $transfers = $this->getOrders($request, true);
        $d['totalQuantity'] = $transfers->sum('total_quantity');

        return Inertia::render('Admin/Orders/Reports', $d);
    }

    public function toggleStatus(Request $request)
    {
        $status = $request->is_checked ? 'Approved' : 'Pending';

        $updated = Cart::where('unique_id', $request->unique_id)->update([
            'status' => $status,
        ]);

        if ($updated) {
            if ($status === 'Approved') {
                $this->syncToSaleHistory($request->unique_id);
            }

            return back()->with('success', 'Order status updated to '.$status);
        }

        return back()->with('error', 'Cart not found');
    }

    private function syncToSaleHistory($unique_id)
    {
        $cartItems = Cart::where('unique_id', $unique_id)->get();
        if ($cartItems->isEmpty()) {
            return;
        }

        $firstItem = $cartItems->first();

        // Calculate totals
        $subtotal = 0;
        $totalDiscount = 0;
        $totalTax = 0;

        foreach ($cartItems as $item) {
            $itemSubtotal = $item->price * $item->quantity;
            $subtotal += $itemSubtotal;
            $totalDiscount += ($item->discount ?? 0) * $item->quantity;

            // Handle tax (18%) if needs_vat is Yes
            if ($item->needs_vat === 'Yes') {
                $totalTax += ($itemSubtotal - (($item->discount ?? 0) * $item->quantity)) * 0.18;
            }
        }

        $payable = $subtotal - $totalDiscount + $totalTax;
        $paid = $cartItems->sum('amount_paid');

        $status = 'Paid';
        if ($paid < $payable - 1) { // 1 unit buffer for rounding
            $status = ($paid > 0) ? 'Partially Paid' : 'Unpaid';
        }

        // Try to find if this customer is a registered user
        $customer = User::where('staff_phone', $firstItem->phone_number)
            ->orWhere('staff_email', $firstItem->email)
            ->first();

        // Update or Create Sale - use withoutGlobalScopes to bypass HasBranch scope
        // which would otherwise add branch_id filter and cause duplicate key errors
        $existingSale = Sale::withoutGlobalScopes()
            ->where('invoice_number', $unique_id)
            ->first();

        $saleData = [
            'customer_id' => $customer ? $customer->id : null,
            'user_id' => Auth::id(),
            'total_amount' => $subtotal,
            'discount_amount' => $totalDiscount,
            'tax_amount' => $totalTax,
            'payable_amount' => $payable,
            'payment_method' => $firstItem->payment_method ?? 'Online',
            'payment_status' => $status,
            'notes' => 'Online Order: '.($firstItem->cargo ?? 'General'),
            'branch_id' => $firstItem->branch_id ?? null,
        ];

        if ($existingSale) {
            $existingSale->update($saleData);
            $sale = $existingSale;
        } else {
            $sale = Sale::create(array_merge(['invoice_number' => $unique_id], $saleData));
        }

        // Sync items
        $sale->items()->delete();
        foreach ($cartItems as $item) {
            $productId = $item->product_id;

            // Resolve to numeric ID: try by product_id field (SKU), then by product_name, then skip if unresolvable
            if (! is_numeric($productId)) {
                $productRecord = Product::where('product_id', $productId)
                    ->orWhere('product_name', $productId)
                    ->first();
                if ($productRecord) {
                    $productId = $productRecord->id;
                } else {
                    // Cannot resolve to a valid product ID - skip this item
                    Log::warning("approveOrder: could not resolve product_id '{$item->product_id}' for cart item, skipping sale_item insert.");

                    continue;
                }
            }

            SaleItem::create([
                'sale_id' => $sale->id,
                'product_id' => $productId,
                'quantity' => $item->quantity,
                'unit_price' => $item->price,
                'subtotal' => $item->price * $item->quantity,
                'discount' => $item->discount ?? 0,
            ]);
        }

        return $sale;
    }

    private function getOrders($request, $getAll = false)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $query = Cart::selectRaw('
                unique_id,
                email,
                name,
                phone_number,
                status,
                created_at,
                SUM(quantity) as total_quantity,
                SUM(price) as total_price
            ')
            ->groupBy('unique_id', 'email', 'name', 'status', 'phone_number', 'created_at')
            ->orderBy('id', 'desc');

        if ($getAll) {
            if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
                $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
            }
        } else {
            if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
                $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
            } else {
                //
            }
        }

        return $query->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    public function edit_orders_status(Request $request)
    {
        $request->validate([
            'order_id' => 'required|array',
            'quantity' => 'required|array',
            'discount' => 'required|array',
            'staff_recommeded' => 'required',
            'payment_method' => 'required',
            'amount_paid' => 'required|numeric|min:0',
            'balance' => 'required|numeric',
            'order_status' => 'required|in:pending,confirmed,checked',
        ]);

        $order_status = $request->order_status;

        $staff_recommended = $request->staff_recommeded;
        $payment_method = $request->payment_method;
        $amount_paid_total = $request->amount_paid;
        $balance_total = $request->balance;
        $is_loan = $request->has('is_loan') ? 'Yes' : 'No';

        DB::beginTransaction();
        try {
            // Fetch all cart orders
            $orders = Cart::whereIn('id', $request->order_id)->get()->keyBy('id');

            if ($orders->isEmpty()) {
                return redirect()->back()->with('error', 'No Order found for the given unique ID.');
            }

            // Fetch all products with inventory sum
            $productIds = $orders->pluck('product_id')->unique();
            $products = Product::whereIn('product_id', $productIds)
                ->withSum('inventories as product_quantity', 'qty')
                ->get()
                ->keyBy('product_id');

            $total_calculated_price = 0;
            $firstOrder = $orders->first();
            $unique_id = $firstOrder->unique_id;

            // Protection: Cannot move backward from 'checked'
            $alreadyChecked = $orders->contains('is_checked', true);
            if ($alreadyChecked && $order_status !== 'checked') {
                return redirect()->back()->with('error', 'Strict Workflow Error: Finalized (Checked) orders cannot be reverted to Pending or Confirmed.');
            }

            // First pass: Calculate total price and update cart items
            foreach ($request->order_id as $index => $orderId) {
                if (! isset($orders[$orderId])) {
                    throw new \Exception("Order with ID $orderId not found.");
                }

                $cart = $orders[$orderId];
                $quantity = $request->quantity[$index];
                $discount = $request->discount[$index];

                if (! isset($products[$cart->product_id])) {
                    throw new \Exception("Product not found for order ID $orderId.");
                }

                $product = $products[$cart->product_id];

                if ($product->product_quantity < $quantity && ! setting('allow_negative_stock', false)) {
                    throw new \Exception("Insufficient stock for {$product->product_name}.");
                }

                $item_total = ($cart->price * $quantity) - ($discount * $quantity);

                // Add VAT if needed (18%)
                if ($cart->needs_vat === 'Yes') {
                    $item_total += ($item_total * 0.18);
                }

                $total_calculated_price += $item_total;

                // Update cart details
                $cart->update([
                    'quantity' => $quantity,
                    'staff_recommeded' => $staff_recommended,
                    'discount' => $discount,
                    'is_checked' => ($order_status === 'checked'),
                    'status' => $order_status,
                    'payment_method' => $payment_method,
                    'amount_paid' => 0,
                    'balance' => 0,
                    'is_loan' => $is_loan,
                    'city' => $request->city,
                    'cargo' => $request->cargo,
                    'box_name' => $request->box_name,
                    'tin_number' => $request->tin_number,
                ]);

                // Reduce stock using Inventory Service ONLY if transitioning to checked
                // Deduct from source store if product has one, otherwise from multiple stores
                if ($order_status === 'checked' && ! $cart->getOriginal('is_checked')) {
                    $this->inventoryService->deductInventoryWithSourceStore($product->id, $quantity, "App\Models\Product", null, "App\Models\Cart", $cart->id, 'Order Finalized: '.$unique_id);
                }
            }

            // Distribute amount_paid and balance to the first item for tracking purposes
            // (or we could have added these fields to a separate Orders table if it existed)
            $firstOrder->update([
                'amount_paid' => $amount_paid_total,
                'balance' => $balance_total,
            ]);

            // Handle Transaction Records (Loan/Payment) ONLY if checked
            if ($order_status === 'checked') {
                $sale = $this->syncToSaleHistory($unique_id);

                if ($is_loan === 'Yes' || $balance_total > 0) {
                    foreach ($orders as $orderId => $cart) {
                        $index = array_search($orderId, $request->order_id);
                        $quantity = $request->quantity[$index];
                        $discount = $request->discount[$index];

                        $item_total = ($cart->price * $quantity) - ($discount * $quantity);
                        $item_ratio = $total_calculated_price > 0 ? ($item_total / $total_calculated_price) : 0;

                        Loan::create([
                            'sale_id' => $sale->id,
                            'unique_id' => $cart->unique_id,
                            'customer_name' => $cart->name,
                            'tin' => $cart->tin_number,
                            'phone' => $cart->phone_number,
                            'product_name' => $cart->product_name,
                            'product_id' => $cart->product_id,
                            'staff_name' => $staff_recommended,
                            'product_quantity' => $quantity,
                            'unit_price' => $cart->price,
                            'product_price' => $cart->price,
                            'payment_date' => Carbon::now()->toDateString(),
                            'status' => $balance_total > 0 ? 'Pending' : 'Paid',
                            'amount_paid' => $amount_paid_total * $item_ratio,
                            'total_amount' => $item_total,
                            'balance' => $balance_total * $item_ratio,
                            'is_checked' => true,
                            'staff_recommeded' => $staff_recommended,
                            'discount' => $discount,
                            'branch_id' => $firstOrder->branch_id ?? 1,
                        ]);
                    }
                }

                // Create a payment record for the initial payment if applicable
                if ($amount_paid_total > 0) {
                    Payment::create([
                        'unique_id' => $unique_id,
                        'user_id' => Auth::id(),
                        'amount_paid' => $amount_paid_total,
                        'payment_date' => Carbon::now()->toDateString(),
                        'payment_method' => $payment_method,
                        'loan_id' => $sale->id, // Re-pointing to sale id if needed, or keeping it as is if it's for reference
                    ]);
                }
            }
            DB::commit();

            return redirect()->route('orders.all')->with('success', 'Order processed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'Error: '.$e->getMessage());
        }
    }

    public function orders_add_more(Request $request)
    {
        $validatedData = $request->validate([
            'product_id.*' => 'required|string|max:255',
            'product_quantity.*' => 'required|integer|min:1',
            'discount.*' => 'nullable|numeric|min:0',
            'price_type.*' => 'nullable|string|in:unit_price,product_price',
            'store_id' => 'required|exists:stores,id',
            'order_id' => 'nullable',
        ]);

        DB::beginTransaction();

        try {
            $uniqueId = $validatedData['order_id'];
            $isStaffRecommended = ! empty($validatedData['staff_recommeded']);

            // Get basic product info first
            $products = Product::whereIn('id', $validatedData['product_id'])
                ->select('id', 'product_name', 'unit_price', 'product_price')
                ->get()
                ->keyBy('id');

            foreach ($validatedData['product_id'] as $index => $productId) {
                $product = $products[$productId] ?? null;
                if (! $product) {
                    throw new \Exception("Product with ID {$productId} not found.");
                }

                $quantity = $validatedData['product_quantity'][$index];
                $discount = $validatedData['discount'][$index] ?? 0;
                $priceType = $validatedData['price_type'][$index] ?? null;

                // Check inventory if not staff recommended
                if (! $isStaffRecommended) {
                    $inventory = $this->inventoryService->getInventory(
                        $productId,
                        $validatedData['store_id']
                    );
                    $inventoryQuantity = $inventory?->qty ?? 0;

                    if ($inventoryQuantity < $quantity) {
                        throw new \Exception("Insufficient inventory for {$product->product_name}");
                    }
                }

                // Calculate price
                $totalPrice = ($priceType === 'unit_price' && $product->unit_price > 1)
                    ? $product->unit_price
                    : $product->product_price;
                $exportData = Export::where('unique_id', $uniqueId)->first();
                // Prepare record data
                $recordData = [
                    'is_checked' => $exportData->is_checked,
                    'unique_id' => $uniqueId,
                    'email' => $exportData->email,
                    'tin_number' => $exportData->tin_number,
                    'country' => $exportData->country,
                    'city' => $exportData->city,
                    'district' => $exportData->district,
                    'street' => $exportData->street,
                    'village' => $exportData->village,
                    'box_name' => $exportData->box_name,
                    'kata' => $exportData->kata,
                    'cargo' => $exportData->cargo,
                    'name' => $exportData->name,
                    'phone_number' => $exportData->phone_number,
                    'product_id' => $productId,
                    'product_name' => $product->product_name,
                    'quantity' => $quantity,
                    'qty_checked' => $quantity,
                    'price' => $totalPrice,
                    'discount' => $discount,
                    'staff_recommeded' => $exportData->staff_recommeded,
                    'status' => $exportData->status,
                ];

                $this->inventoryService->adjustInventory(
                    $productId,
                    $quantity,
                    $validatedData['store_id'],
                    'decrease',
                    'Exported product for '.$uniqueId.'by Full paid '
                );
                Export::create($recordData);
            }

            DB::commit();

            return back()->with('success', 'Sales recorded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $unique_id)
    {
        $d['orders'] = Cart::where('unique_id', $unique_id)->get();
        $d['ordersDetail'] = Cart::where('unique_id', $unique_id)->first();
        $d['users'] = User::filter(request(['search']))->whereNot('role_id', 4)->get();
        $d['orderId'] = $unique_id;
        $d['products'] = Product::withSum('inventories as product_quantity', 'qty')
            ->orderBy('product_name', 'asc')
            ->get();
        $d['settings'] = SystemSetting::first();

        // Financial Stats & Profit for Phase 116 Synchronization
        $totalProfit = 0;
        foreach ($d['orders'] as $order) {
            // Fetch product management data for SKU and Buying Price
            $product = Product::with('productManagement')->find($order->product_id);
            $order->product_sku = $product?->productManagement->sku ?? 'N/A';
            $order->buying_price = $product?->productManagement->buying_price ?? 0;

            $order->item_total = ($order->price * $order->quantity) - ($order->discount * $order->quantity);
            $order->profit = $order->item_total - ($order->buying_price * $order->quantity);
            $totalProfit += $order->profit;
        }
        $d['totalProfit'] = $totalProfit;

        $d['payments'] = Payment::with('user')->where('unique_id', $unique_id)
            ->orderBy('payment_date', 'asc')->get();

        $d['totalAmount'] = $d['orders']->sum('item_total');
        $d['totalPaid'] = $d['orders']->sum('amount_paid');
        $d['balance'] = $d['totalAmount'] - $d['totalPaid'];

        return Inertia::render('Admin/Orders/Show', $d);
    }

    public function showCrud($id)
    {
        $sale = Sale::where('invoice_number', $id)
            ->with([
                'items.product.productManagement',
                'payments.user',
                'posCustomer',
                'cashier',
            ])
            ->first();

        if (! $sale) {
            // Fallback to old Cart-based system
            return $this->show($id);
        }

        $totalProfit = 0;
        $items = $sale->items->map(function ($item) use (&$totalProfit) {
            $pm = $item->product?->productManagement;
            $buyingPrice = (float) ($pm?->buying_price ?? 0);
            $profit = ($item->unit_price - $buyingPrice) * $item->quantity;
            $profit -= (float) $item->discount;
            $totalProfit += $profit;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->product_name ?? 'Unknown Product',
                'display_name' => $this->buildItemDisplayName(
                    $item->product?->product_name ?? $item->item_name ?? 'Unknown Product',
                    $item->variant_color,
                    $item->print_type
                ),
                'product_sku' => $pm?->sku ?? 'N/A',
                'image' => $pm?->image_1 ? asset('storage/'.$pm->image_1) : null,
                'unit_price' => (float) $item->unit_price,
                'quantity' => (int) $item->quantity,
                'discount' => (float) $item->discount,
                'subtotal' => (float) $item->subtotal,
                'buying_price' => $buyingPrice,
                'profit' => $profit,
                'variant_color' => $item->variant_color,
                'print_type' => $item->print_type,
            ];
        });

        $amountPaid = (float) $sale->payments->sum('amount_paid');
        $payable = (float) $sale->payable_amount;

        $cartRows = Cart::where('unique_id', $id)->orderBy('id')->get();
        $deliveryStatus = null;
        if ($cartRows->isNotEmpty()) {
            $rawDelivery = strtolower((string) ($cartRows->first()->status ?? 'pending'));
            $deliveryStatus = match ($rawDelivery) {
                'approved' => 'confirmed',
                'complete', 'completed' => 'delivered',
                default => $rawDelivery,
            };
        }

        $saleData = [
            'invoice_number' => $sale->invoice_number,
            'customer_name' => $sale->posCustomer?->customer_name ?? 'Walking Customer',
            'customer_phone' => $sale->posCustomer?->customer_phone ?? '',
            'cashier_name' => $sale->cashier?->staff_name ?? 'N/A',
            'payment_method' => $sale->payment_method,
            'payment_status' => $sale->payment_status,
            'total_amount' => (float) $sale->total_amount,
            'discount_amount' => (float) $sale->discount_amount,
            'tax_amount' => (float) $sale->tax_amount,
            'payable_amount' => $payable,
            'amount_paid' => $amountPaid,
            'balance' => max(0, $payable - $amountPaid),
            'notes' => $sale->notes,
            'created_at' => $sale->created_at,
            'delivery_status' => $deliveryStatus,
            'can_manage_delivery' => $cartRows->isNotEmpty(),
        ];

        $payments = $sale->payments->map(fn ($p) => [
            'id' => $p->id,
            'amount_paid' => (float) $p->amount_paid,
            'payment_method' => $p->payment_method,
            'reference' => $p->reference ?? '',
            'payment_date' => $p->payment_date,
            'recorded_by' => $p->user?->staff_name ?? 'System',
        ]);

        $changeLogs = collect();
        if ($this->hasSaleChangeLogsTable()) {
            $changeLogs = SaleChangeLog::where('invoice_number', $id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'changed_by_name' => $log->changed_by_name,
                    'action' => $log->action,
                    'description' => $log->description,
                    'changes' => $log->changes,
                    'created_at' => $log->created_at,
                ]);
        }

        return Inertia::render('Admin/Orders/Show', [
            'sale' => $saleData,
            'items' => $items,
            'payments' => $payments,
            'change_logs' => $changeLogs,
            'total_profit' => $totalProfit,
            'is_pos_sale' => true,
        ]);
    }

    public function createCrud(Request $request)
    {
        return redirect()->route('pos.terminal');
    }

    public function editCrud($id)
    {
        $sale = Sale::withoutGlobalScopes()->where('invoice_number', $id)
            ->with([
                'items.product.productManagement',
                'payments.user',
                'posCustomer',
                'cashier',
            ])
            ->first();

        if (! $sale) {
            return $this->edit($id);
        }

        $totalProfit = 0;
        $items = $sale->items->map(function ($item) use (&$totalProfit) {
            $pm = $item->product?->productManagement;
            $buyingPrice = (float) ($pm?->buying_price ?? 0);
            $profit = ($item->unit_price - $buyingPrice) * $item->quantity;
            $profit -= (float) $item->discount;
            $totalProfit += $profit;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->product_name ?? 'Unknown Product',
                'display_name' => $this->buildItemDisplayName(
                    $item->product?->product_name ?? $item->item_name ?? 'Unknown Product',
                    $item->variant_color,
                    $item->print_type
                ),
                'product_sku' => $pm?->sku ?? 'N/A',
                'image' => $pm?->image_1 ? asset('storage/'.$pm->image_1) : null,
                'unit_price' => (float) $item->unit_price,
                'quantity' => (int) $item->quantity,
                'discount' => (float) $item->discount,
                'subtotal' => (float) $item->subtotal,
                'profit' => $profit,
                'variant_color' => $item->variant_color,
                'print_type' => $item->print_type,
            ];
        });

        $amountPaid = (float) $sale->payments->sum('amount_paid');
        $payable = (float) $sale->payable_amount;

        $payments = $sale->payments->map(fn ($p) => [
            'id' => $p->id,
            'amount_paid' => (float) $p->amount_paid,
            'payment_method' => $p->payment_method,
            'reference' => $p->reference ?? '',
            'payment_date' => $p->payment_date,
            'recorded_by' => $p->user?->staff_name ?? 'System',
        ]);

        $changeLogs = collect();
        if ($this->hasSaleChangeLogsTable()) {
            $changeLogs = SaleChangeLog::where('invoice_number', $id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'changed_by_name' => $log->changed_by_name,
                    'action' => $log->action,
                    'description' => $log->description,
                    'changes' => $log->changes,
                    'created_at' => $log->created_at,
                ]);
        }

        $allProducts = Product::where('is_enabled', true)
            ->with(['productManagement:id,product_id,product_price,plain_selling_price,printed_selling_price'])
            ->orderBy('product_name')
            ->get(['id', 'product_name', 'product_price', 'unit_price'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'product_name' => $p->product_name,
                'selling_price' => (float) (
                    $p->productManagement?->product_price
                    ?? $p->product_price
                    ?? $p->unit_price
                    ?? 0
                ),
            ]);
        $isGlobal = Auth::user()?->isGlobal() && ! active_branch_id();

        return Inertia::render('Admin/Orders/Edit', [
            'sale' => [
                'invoice_number' => $sale->invoice_number,
                'customer_name' => $sale->posCustomer?->customer_name ?? 'Walking Customer',
                'customer_phone' => $sale->posCustomer?->customer_phone ?? '',
                'cashier_name' => $sale->cashier?->staff_name ?? 'N/A',
                'payment_method' => $sale->payment_method,
                'payment_status' => $sale->payment_status,
                'discount_amount' => (float) $sale->discount_amount,
                'tax_amount' => (float) $sale->tax_amount,
                'payable_amount' => $payable,
                'amount_paid' => $amountPaid,
                'balance' => max(0, $payable - $amountPaid),
                'notes' => $sale->notes,
                'created_at' => $sale->created_at,
                'branch_id' => $sale->branch_id,
            ],
            'items' => $items,
            'products' => $allProducts,
            'payments' => $payments,
            'change_logs' => $changeLogs,
            'total_profit' => $totalProfit,
            'is_global' => $isGlobal,
        ]);
    }

    public function destroyCrud($id)
    {
        $sale = Sale::withoutGlobalScopes()->where('invoice_number', $id)->first();

        if (! $sale) {
            return $this->destroy($id);
        }

        $user = Auth::user();
        if ($this->hasSaleChangeLogsTable()) {
            SaleChangeLog::create([
                'invoice_number' => $id,
                'changed_by_id' => Auth::id(),
                'changed_by_name' => $user?->staff_name ?? $user?->name ?? 'System',
                'action' => 'deleted',
                'description' => 'Sale record was permanently deleted.',
                'changes' => null,
            ]);
        }

        $sale->items()->delete();
        $sale->payments()->delete();
        $sale->delete();

        return redirect('/orders-crud')->with('success', 'Sale deleted successfully.');
    }

    public function updateCrud(Request $request, $id)
    {
        $sale = Sale::withoutGlobalScopes()->where('invoice_number', $id)->first();

        if (! $sale) {
            return $this->update($request, $id);
        }

        $isGlobal = Auth::user()?->isGlobal();

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'payment_method' => 'nullable|string|max:50',
            'payment_status' => 'nullable|string|in:Paid,Partially Paid,Unpaid',
            'branch_id' => $isGlobal ? 'nullable|exists:branches,id' : 'prohibited',
            'items' => 'nullable|array',
            'items.*.id' => 'required|integer',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.product_id' => 'required|integer',
            'items.*.variant_color' => 'nullable|string',
        ]);

        $changes = [];
        $descriptions = [];

        if (array_key_exists('notes', $validated) && $validated['notes'] !== $sale->notes) {
            $changes['notes'] = ['old' => $sale->notes, 'new' => $validated['notes']];
            $descriptions[] = 'Notes updated';
        }

        if (! empty($validated['payment_method']) && $validated['payment_method'] !== $sale->payment_method) {
            $changes['payment_method'] = ['old' => $sale->payment_method, 'new' => $validated['payment_method']];
            $descriptions[] = "Payment method changed from {$sale->payment_method} to {$validated['payment_method']}";

            // Cascade update to associated payments and carts so finance analytics are correct
            $sale->payments()->update(['payment_method' => $validated['payment_method']]);
            Cart::where('unique_id', $sale->invoice_number)->update(['payment_method' => $validated['payment_method']]);
        }

        if (! empty($validated['payment_status']) && $validated['payment_status'] !== $sale->payment_status) {
            $changes['payment_status'] = ['old' => $sale->payment_status, 'new' => $validated['payment_status']];
            $descriptions[] = "Payment status changed from {$sale->payment_status} to {$validated['payment_status']}";
        }

        if ($isGlobal && array_key_exists('branch_id', $validated) && $validated['branch_id'] != $sale->branch_id) {
            $oldBranch = $sale->branch_id ? (Branch::find($sale->branch_id)?->name ?? "Branch #{$sale->branch_id}") : 'Unassigned (Global)';
            $newBranch = $validated['branch_id'] ? (Branch::find($validated['branch_id'])?->name ?? "Branch #{$validated['branch_id']}") : 'Unassigned';
            $changes['branch_id'] = ['old' => $sale->branch_id, 'new' => $validated['branch_id']];
            $descriptions[] = "Branch corrected from {$oldBranch} to {$newBranch}";
        }

        if ($request->filled('items')) {
            if ($sale->created_at->diffInHours(now()) > 24) {
                return redirect()->back()->with('error', 'Orders can only be modified within 24 hours of creation.');
            }

            foreach ($request->items as $itemData) {
                $item = SaleItem::withoutGlobalScope('branch')->find($itemData['id']);
                if ($item && $item->sale_id == $sale->id) {
                    $oldPrice = $item->unit_price;
                    $oldProductId = $item->product_id;
                    $oldColor = $item->variant_color;

                    $item->unit_price = $itemData['unit_price'];
                    $item->product_id = $itemData['product_id'];
                    $item->variant_color = $itemData['variant_color'] ?? null;
                    $item->subtotal = ($item->unit_price * $item->quantity) - $item->discount;
                    $item->save();

                    if ($oldPrice != $item->unit_price || $oldProductId != $item->product_id || $oldColor != $item->variant_color) {
                        $descriptions[] = "Item #{$item->id} updated (Price: {$oldPrice}->{$item->unit_price}, Size/Product: {$oldProductId}->{$item->product_id}, Color: {$oldColor}->{$item->variant_color})";
                        $changes["item_{$item->id}"] = [
                            'old' => "Price: {$oldPrice}, Product: {$oldProductId}, Color: {$oldColor}",
                            'new' => "Price: {$item->unit_price}, Product: {$item->product_id}, Color: {$item->variant_color}",
                        ];
                    }
                }
            }

            // Recalculate Sale totals
            $totalAmount = $sale->items()->sum('subtotal');
            $sale->total_amount = $totalAmount;
            $sale->payable_amount = $totalAmount - $sale->discount_amount + $sale->tax_amount;

            $amountPaid = (float) $sale->payments()->sum('amount_paid');

            if ($amountPaid >= $sale->payable_amount) {
                $sale->payment_status = 'Paid';
            } elseif ($amountPaid > 0) {
                $sale->payment_status = 'Partially Paid';
            } else {
                $sale->payment_status = 'Unpaid';
            }
        }

        if (empty($changes)) {
            return redirect("/orders-crud/{$id}")->with('info', 'No changes detected.');
        }

        $user = Auth::user();
        $changedByName = $user?->staff_name ?? $user?->name ?? 'System';

        $updateData = [
            'notes' => $validated['notes'] ?? $sale->notes,
            'payment_method' => $validated['payment_method'] ?? $sale->payment_method,
            'payment_status' => $validated['payment_status'] ?? $sale->payment_status,
            'total_amount' => $sale->total_amount,
            'payable_amount' => $sale->payable_amount,
        ];

        if ($isGlobal && array_key_exists('branch_id', $validated)) {
            $updateData['branch_id'] = $validated['branch_id'];
        }

        $sale->update($updateData);

        if ($this->hasSaleChangeLogsTable()) {
            SaleChangeLog::create([
                'invoice_number' => $id,
                'changed_by_id' => Auth::id(),
                'changed_by_name' => $changedByName,
                'action' => count($changes) === 1 && isset($changes['payment_status']) ? 'status_changed' : 'updated',
                'description' => implode('; ', $descriptions),
                'changes' => $changes,
            ]);
        }

        return redirect("/orders-crud/{$id}")->with('success', 'Order updated successfully.');
    }

    public function storeCrud(Request $request)
    {
        return $this->store($request);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $unique_id)
    {
        $d['orders'] = Cart::where('unique_id', $unique_id)->get();
        $d['users'] = User::filter(request(['search']))->whereNot('role_id', 4)->get();

        $d['ordersDetail'] = Cart::where('unique_id', $unique_id)->first();

        return Inertia::render('Operations/Orders/Edit', $d);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $unique_id)
    {
        foreach ($request->order_id as $index => $orderId) {
            $quantity = $request->quantity[$index];
            $staff_recommeded = $request->staff_recommeded;
            $discount = $request->discount[$index];
            $cart = Cart::where('unique_id', $unique_id)
                ->where('id', $orderId)
                ->first();
            if ($cart) {
                $cart->quantity = $quantity;
                $cart->staff_recommeded = $staff_recommeded;
                $cart->discount = $discount;
                $cart->save();
            } else {
                throw new \Exception("Order with ID $orderId not found for the unique_id $unique_id.");
            }
        }

        return back()->with('success', 'Order Updated');
    }

    public function markAsPaid(Request $request, $unique_id)
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:Cash,Bank Transfer,Mobile Money,Credit Card,Online',
            'payment_date' => 'required|date',
        ]);

        $carts = Cart::where('unique_id', $unique_id)->get();
        if ($carts->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        $firstCart = $carts->first();
        $newAmountPaid = $validated['amount_paid'];
        $paymentMethod = $validated['payment_method'];
        $paymentDate = $validated['payment_date'];

        // Recalculate payable total
        $payable = 0;
        foreach ($carts as $cart) {
            $itemSubtotal = $cart->price * $cart->quantity;
            $itemDiscount = ($cart->discount ?? 0) * $cart->quantity;
            $itemNet = $itemSubtotal - $itemDiscount;
            $payable += $cart->needs_vat === 'Yes' ? $itemNet * 1.18 : $itemNet;
        }

        $balance = max(0, $payable - $newAmountPaid);

        // Update all cart rows for this order
        $carts->each(fn ($c) => $c->update([
            'amount_paid' => $newAmountPaid,
            'balance' => $balance,
            'payment_method' => $paymentMethod,
        ]));

        // Sync sale history
        $sale = $this->syncToSaleHistory($unique_id);

        // Record payment - loan_id must be null for online orders (payments.loan_id references loans table, not sales)
        // Replace payment record - delete existing so editing paid amount doesn't create duplicate entries in financial reports
        Payment::where('unique_id', $unique_id)->where('loan_id', null)->delete();
        Payment::create([
            'unique_id' => $unique_id,
            'user_id' => Auth::id(),
            'amount_paid' => $newAmountPaid,
            'payment_date' => $paymentDate,
            'payment_method' => $paymentMethod,
            'loan_id' => null,
            'branch_id' => $firstCart->branch_id ?? null,
        ]);

        // Update or create invoice record for outstanding balance
        if ($balance > 0) {
            Invoice::updateOrCreate(
                ['unique_id' => $unique_id],
                [
                    'customer_name' => $firstCart->name,
                    'customer_email' => $firstCart->email,
                    'customer_phone' => $firstCart->phone_number,
                    'amount_due' => $balance,
                    'amount_paid' => $newAmountPaid,
                    'payment_date' => $paymentDate,
                    'invoice_date' => now()->toDateString(),
                    'status' => $newAmountPaid > 0 ? 'Partially Paid' : 'Pending',
                    'sale_id' => $sale->id ?? null,
                ]
            );
        } else {
            // Mark any existing invoice as paid
            Invoice::where('unique_id', $unique_id)
                ->update(['status' => 'Paid', 'amount_paid' => $newAmountPaid, 'amount_due' => 0]);
        }

        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $unique_id)
    {
        try {
            $carts = Cart::where('unique_id', $unique_id)->get();
            foreach ($carts as $cart) {

                $cart->delete();
            }

            return back()->with('success', 'Order deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred. Please try again.');
        }
    }

    /**
     * Show a single online order with all its details
     */
    public function showOnlineOrder($unique_id)
    {
        $cartItems = Cart::where('unique_id', $unique_id)->get();

        if ($cartItems->isEmpty()) {
            return redirect()->route('orders.online')->with('error', 'Order not found');
        }

        $firstItem = $cartItems->first();

        // Calculate totals
        $subtotal = 0;
        $totalDiscount = 0;
        $totalTax = 0;

        $items = $cartItems->map(function ($item) use (&$subtotal, &$totalDiscount, &$totalTax) {
            $itemSubtotal = $item->price * $item->quantity;
            $subtotal += $itemSubtotal;
            $itemDiscount = ($item->discount ?? 0) * $item->quantity;
            $totalDiscount += $itemDiscount;

            if ($item->needs_vat === 'Yes') {
                $totalTax += ($itemSubtotal - $itemDiscount) * 0.18;
            }

            return [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'product_variation' => $item->product_variation ?? $item->unit_type ?? null,
                'display_name' => $this->buildOnlineItemDescriptor($item),
                'price' => $item->price,
                'quantity' => $item->quantity,
                'discount' => $item->discount ?? 0,
                'needs_vat' => $item->needs_vat ?? 'No',
                'subtotal' => $itemSubtotal,
            ];
        });

        $payable = $subtotal - $totalDiscount + $totalTax;
        $paid = (float) ($cartItems->max('amount_paid') ?? 0);

        $paymentStatus = 'Unpaid';
        if ($paid >= $payable - 1) {
            $paymentStatus = 'Paid';
        } elseif ($paid > 0) {
            $paymentStatus = 'Partially Paid';
        }

        $data = [
            'unique_id' => $unique_id,
            'order_number' => $unique_id,
            'name' => $firstItem->name,
            'email' => $firstItem->email,
            'phone_number' => $firstItem->phone_number,
            'status' => $firstItem->status ?? 'pending',
            'is_checked' => $firstItem->is_checked ?? false,
            'payment_method' => $firstItem->payment_method ?? 'Online',
            'payment_status' => $paymentStatus,
            'items' => $items,
            'subtotal' => $subtotal,
            'discount_amount' => $totalDiscount,
            'tax_amount' => $totalTax,
            'payable_amount' => $payable,
            'amount_paid' => $paid,
            'balance' => max(0, $payable - $paid),
            'created_at' => $firstItem->created_at,
            'notes' => $firstItem->cargo ?? null,
        ];

        return Inertia::render('Admin/Orders/OnlineOrderDetail', $data);
    }

    /**
     * Approve an online order (mark as checked/verified)
     */
    public function approveOrder(Request $request, $unique_id)
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
        ]);

        $carts = Cart::where('unique_id', $unique_id)->get();

        if ($carts->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        $firstCart = $carts->first();
        $amountPaid = $validated['amount_paid'];
        $paymentDate = $validated['payment_date'];

        // Calculate totals
        $subtotal = 0;
        $totalDiscount = 0;
        $totalTax = 0;

        foreach ($carts as $cart) {
            $itemSubtotal = $cart->price * $cart->quantity;
            $subtotal += $itemSubtotal;
            $itemDiscount = ($cart->discount ?? 0) * $cart->quantity;
            $totalDiscount += $itemDiscount;

            if ($cart->needs_vat === 'Yes') {
                $totalTax += ($itemSubtotal - $itemDiscount) * 0.18;
            }
        }

        $payable = $subtotal - $totalDiscount + $totalTax;
        $balance = max(0, $payable - $amountPaid);

        foreach ($carts as $cart) {
            $cart->update([
                'is_checked' => true,
                'status' => 'confirmed',
                'amount_paid' => $amountPaid,
                'balance' => $balance,
            ]);
        }

        // Sync to sale history
        $sale = $this->syncToSaleHistory($unique_id);

        // Create payment record - loan_id must be null for online orders (payments.loan_id references loans table, not sales)
        // Replace payment record - delete existing so re-approvals don't create duplicate entries in financial reports
        Payment::where('unique_id', $unique_id)->where('loan_id', null)->delete();
        Payment::create([
            'unique_id' => $unique_id,
            'user_id' => Auth::id(),
            'amount_paid' => $amountPaid,
            'payment_date' => $paymentDate,
            'payment_method' => $firstCart->payment_method ?? 'Online',
            'loan_id' => null,
            'branch_id' => $firstCart->branch_id ?? null,
        ]);

        // Create debt/invoice record if there's outstanding balance
        if ($balance > 0) {
            $invoiceModel = Invoice::firstOrCreate(
                ['unique_id' => $unique_id],
                [
                    'customer_name' => $firstCart->name,
                    'customer_email' => $firstCart->email,
                    'customer_phone' => $firstCart->phone_number,
                    'amount_due' => $balance,
                    'amount_paid' => $amountPaid,
                    'payment_date' => $paymentDate,
                    'invoice_date' => now()->toDateString(),
                    'status' => 'Pending',
                    'sale_id' => $sale->id ?? null,
                ]
            );
        }

        if ($request->ajax() && ! $request->hasHeader('X-Inertia')) {
            return response()->json([
                'success' => true,
                'message' => 'Order approved successfully',
                'balance' => $balance,
            ]);
        }

        return back()->with('success', 'Order approved successfully. Balance: '.number_format($balance));
    }

    /**
     * Reject an online order
     */
    public function rejectOrder(Request $request, $unique_id)
    {
        $reason = $request->input('reason', 'No reason provided');

        $carts = Cart::where('unique_id', $unique_id)->get();

        if ($carts->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        foreach ($carts as $cart) {
            $cart->update([
                'status' => 'rejected',
                'is_checked' => false,
                'cargo' => ($cart->cargo ?? '')."\n[Rejected: $reason]",
            ]);
        }

        if ($request->ajax() && ! $request->hasHeader('X-Inertia')) {
            return response()->json([
                'success' => true,
                'message' => 'Order rejected successfully',
            ]);
        }

        return back()->with('success', 'Order rejected');
    }

    /**
     * Update delivery status for an approved online order
     */
    public function updateDeliveryStatus(Request $request, $unique_id)
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,processing,in_transit,delivered',
        ]);

        $carts = Cart::where('unique_id', $unique_id)->get();

        if ($carts->isEmpty()) {
            return back()->with('error', 'Order not found');
        }

        $firstCart = $carts->first();
        $currentStatus = strtolower((string) ($firstCart->status ?? 'pending'));

        // Allow guest/customer orders to move through the pipeline as long as they are not closed states.
        if (in_array($currentStatus, ['rejected', 'cancelled'], true)) {
            return back()->with('error', 'Cannot update delivery status for rejected or cancelled orders');
        }

        foreach ($carts as $cart) {
            $cart->update(['status' => $validated['status']]);
        }

        return back()->with('success', 'Delivery status updated to '.str_replace('_', ' ', $validated['status']));
    }

    /**
     * Remove the specified online order and all its associated data.
     */
    public function printInvoice($id)
    {
        return $this->renderInvoice($id, 'sales');
    }

    public function printProforma($id)
    {
        return $this->renderInvoice($id, 'proforma');
    }

    private function renderInvoice($id, string $invoiceType)
    {
        $order = Sale::withoutGlobalScope('branch')
            ->with(['items.product', 'posCustomer', 'customer', 'cashier'])
            ->where('invoice_number', $id)
            ->firstOrFail();

        $faviconPath = asset('images/favicon.ico');

        return view('admin.invoice.template', compact('order', 'faviconPath', 'invoiceType'));
    }

    public function destroyOnlineOrder($unique_id)
    {
        DB::beginTransaction();
        try {
            // Delete cart items
            Cart::where('unique_id', $unique_id)->delete();

            // Delete related sales if they exist
            $sale = Sale::where('invoice_number', $unique_id)->first();
            if ($sale) {
                // Delete sale items first
                $sale->items()->delete();
                $sale->delete();
            }

            // Delete related payments and invoices
            Payment::where('unique_id', $unique_id)->delete();
            Invoice::where('unique_id', $unique_id)->delete();

            DB::commit();

            return back()->with('success', 'Online order and associated records deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to delete order: '.$e->getMessage());
        }
    }
}
