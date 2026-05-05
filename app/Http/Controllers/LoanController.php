<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Loan;
use App\Models\User;
use App\Models\payment;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use App\Models\SystemSetting;
use App\Http\Controllers\Controller;

class LoanController extends Controller
{

    protected $inventoryService;
    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }


    private function getLoanData($request, $getAll = false)
    {
        $query = Loan::select(
            'loans.unique_id',
            'loans.customer_name',
            DB::raw('MAX(loans.id) as id'),
            DB::raw('SUM(loans.product_quantity) as total_quantity'),
            DB::raw('SUM(loans.total_amount) as total_amount'),
            DB::raw('COALESCE(SUM(payments.amount_paid), 0) as total_paid'),
            DB::raw('SUM(loans.total_amount) - COALESCE(SUM(payments.amount_paid), 0) as balance'),
            'loans.payment_date',
            'loans.created_at'
        )
            ->leftJoin('payments', 'loans.unique_id', '=', 'payments.unique_id')
            ->groupBy('loans.unique_id', 'loans.customer_name', 'loans.payment_date', 'loans.created_at')
            ->orderByDesc('loans.id');

        // Apply status filter
        $status = $request->input('status');
        if ($status === 'all') {
            $query;
        } elseif ($status === 'paid') {
            $query->havingRaw('COALESCE(SUM(payments.amount_paid), 0) >= SUM(loans.total_amount)');
        } elseif ($status === 'unpaid') {
            $query->havingRaw('COALESCE(SUM(payments.amount_paid), 0) = 0');
        } elseif ($status === 'uncomplete') {
            $query->havingRaw('COALESCE(SUM(payments.amount_paid), 0) > 0')
                ->havingRaw('COALESCE(SUM(payments.amount_paid), 0) < SUM(loans.total_amount)');
        } elseif ($status === 'overdue') {
            $query->havingRaw('COALESCE(SUM(payments.amount_paid), 0) < SUM(loans.total_amount)')
                ->where('loans.payment_date', '<', Carbon::today()->format('Y-m-d'));
        }

        // Date range filter
        if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
            $query->whereBetween('loans.created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        } elseif (!$getAll && !$request->has('status')) {
            // Default to all if no status specified, or as per original logic:
            // $query->whereDate('loans.created_at', Carbon::today());
        }

        // Search filter
        if ($request->has('search')) {
            $query->where('customer_name', 'like', '%' . $request->search . '%');
        }

        return $getAll ? $query->get() : $query->paginate($request->input('per_page', 10))->withQueryString();
    }

    public function create()
    {
        $products = Product::with(['inventories.store'])
            ->orderBy('product_name', 'asc')
            ->get();
        $users = User::whereNot('role_id', 4)->get();
        return \Inertia\Inertia::render('Finance/Loans/Create', compact('products', 'users'));
    }

    public function index(Request $request)
    {
        $loans = $this->getLoanData($request);
        
        // Calculate Summary Stats
        $allLoans = Loan::select(
            'loans.unique_id',
            DB::raw('SUM(loans.total_amount) as total_amount'),
            DB::raw('COALESCE(SUM(payments.amount_paid), 0) as total_paid'),
            'loans.payment_date'
        )
            ->leftJoin('payments', 'loans.unique_id', '=', 'payments.unique_id')
            ->groupBy('loans.unique_id', 'loans.payment_date')
            ->get();

        $summary = [
            'total_debt' => (float) $allLoans->sum(function($l) { return max(0, $l->total_amount - $l->total_paid); }),
            'overdue_debt' => (float) $allLoans->filter(function($l) {
                return $l->total_paid < $l->total_amount && $l->payment_date < date('Y-m-d');
            })->sum(function($l) { return max(0, $l->total_amount - $l->total_paid); }),
            'active_loans' => $allLoans->filter(function($l) { return $l->total_paid < $l->total_amount; })->count(),
            'overdue_count' => $allLoans->filter(function($l) {
                return $l->total_paid < $l->total_amount && $l->payment_date < date('Y-m-d');
            })->count(),
        ];

        // Prepare Trend Data (Last 30 Days)
        $trendData = Loan::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(total_amount) as amount')
        )
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        $chartData = [
            'labels' => $trendData->pluck('date')->map(fn($d) => Carbon::parse($d)->format('M d'))->toArray(),
            'datasets' => [[
                'label' => 'New Debt',
                'data' => $trendData->pluck('amount')->map(fn($v) => (float)$v)->toArray(),
            ]],
        ];

        $products = Product::withSum('inventories as product_quantity', 'qty')
            ->orderBy('product_name', 'asc')
            ->get();
        $users = User::filter(request(['search']))->whereNot('role_id', 4)->get();

        $filters = $request->only(['search', 'status', 'start_date', 'end_date']);
        return \Inertia\Inertia::render('Finance/Loans/Index', compact('products', 'loans', 'users', 'summary', 'chartData', 'filters'));
    }

    public function indexCrud(Request $request)
    {
        return $this->index($request);
    }


    public function reports(Request $request)
    {
        // dd($request->all());
        $d['loans'] = $loans = $this->getLoanData($request, true);

        return \Inertia\Inertia::render('Admin/Loans/Reports', $d);
    }


    // private function getLoanData($request, $getAll = false)
    // {
    //     $currentDate = Carbon::now()->format('Y-m-d');

    //     $query = $loansQuery = Loan::select(
    //         'unique_id',
    //         'customer_name',
    //         DB::raw('SUM(product_quantity) as total_quantity'),
    //         DB::raw('SUM(total_amount) as total_amount'),
    //         DB::raw('SUM(amount_paid) as amount_paid'),
    //         DB::raw('SUM(balance) as balance'),
    //         'payment_date'
    //     )
    //         ->where('is_checked', true)
    //         ->groupBy('unique_id', 'customer_name', 'payment_date')
    //         ->orderByDesc('id');
    //     $status = $request->input('status');

    //     if ($getAll) {
    //         if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
    //             $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
    //         }
    //     } else {
    //         if ($request->has('all')) {
    //             // $query;
    //         } elseif ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
    //             $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
    //         } elseif ($status == "paid") {
    //             $query->where('is_checked', false);
    //         } elseif ($status == "unpaid") {
    //             $query->where('is_checked', false);
    //         } else {
    //             $query->whereDate('created_at', $currentDate);
    //         }
    //     }

    //     return $query->get();
    // }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'customer_name' => 'required|string',
            'tin' => 'nullable|string',
            'phone' => 'required|string',
            'sale_mode' => 'required|string',
            'payment_date' => 'nullable|date',
            'staff_recommeded' => 'nullable|string',
            'product_id.*' => 'required|string',
            'product_quantity.*' => 'required|integer|min:1',
            'price_type.*' => 'required|string',
            'discount.*' => 'nullable|numeric|min:0',
        ]);

        $uniqueId = 'LN' . strtoupper(substr(uniqid(), -6));
        $isStaffRecommended = !empty($validatedData['staff_recommeded']);

        DB::beginTransaction();

        try {
            $products = Product::whereIn('id', $validatedData['product_id'])->get()->keyBy('id');

            foreach ($validatedData['product_id'] as $index => $productId) {
                $product = $products[$productId] ?? null;
                if (!$product) throw new \Exception("Product not found.");

                $quantity = $validatedData['product_quantity'][$index];
                $discount = $validatedData['discount'][$index] ?? 0;
                $priceType = $validatedData['price_type'][$index];

                $inventoryData = $this->inventoryService->getInventoryData($productId);
                if (!$isStaffRecommended) {
                    $inventoryQuantity = $this->inventoryService->getInventoryQuantity($productId, $inventoryData->store_id);
                    if ($inventoryQuantity < $quantity) {
                        throw new \Exception("Insufficient inventory for {$product->product_name}");
                    }
                }

                $unitPrice = ($priceType === 'unit_price' && $product->unit_price > 1) 
                    ? $product->unit_price 
                    : $product->product_price;
                
                $totalAmount = ($quantity * $unitPrice) - $discount;

                $recordData = [
                    'unique_id' => $uniqueId,
                    'tin' => $validatedData['tin'],
                    'product_id' => $productId,
                    'product_name' => $product->product_name,
                    'customer_name' => $validatedData['customer_name'],
                    'staff_name' => auth()->user()->staff_name,
                    'product_quantity' => $quantity,
                    'unit_price' => $priceType === 'unit_price' ? $unitPrice : 0,
                    'product_price' => $priceType !== 'unit_price' ? $unitPrice : 0,
                    'discount' => $discount,
                    'phone' => $validatedData['phone'],
                    'sale_mode' => $validatedData['sale_mode'],
                    'payment_date' => $validatedData['payment_date'],
                    'staff_recommeded' => $validatedData['staff_recommeded'],
                    'status' => 'Pending',
                    'is_checked' => false,
                    'total_amount' => $totalAmount,
                    'balance' => $totalAmount,
                ];

                $this->inventoryService->adjustInventory(
                    $productId, $quantity, $inventoryData->store_id, 'decrease', 
                    "Loan $uniqueId creation"
                );

                Loan::create($recordData);
            }

            DB::commit();
            return redirect()->route('loans.index')->with('success', 'Loan recorded successfully with ID: ' . $uniqueId);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage())->withInput();
        }
    }

    public function show($unique_id)
    {
        $loansQuery = Loan::select(
                'loans.*',
                'pm.sku as linked_sku',
                'pm.buying_price as current_buying_price'
            )
            ->leftJoin('products as p', 'loans.product_id', '=', 'p.id')
            ->leftJoin('product_managements as pm', 'p.product_management_id', '=', 'pm.id')
            ->where('loans.unique_id', $unique_id)
            ->orderBy('loans.id', 'ASC');

        $loans = $loansQuery->get();
        
        $totalProfit = 0;

        // SKU Fallback for legacy records or missing IDs
        foreach ($loans as $loan) {
            if (!$loan->linked_sku) {
                $fallback = \App\Models\ProductManagement::where('product_name', $loan->product_name)->first();
                $loan->product_sku = $fallback?->sku ?? 'MANUAL';
                $loan->buying_price = $fallback?->buying_price ?? 0;
            } else {
                $loan->product_sku = $loan->linked_sku;
                $loan->buying_price = $loan->current_buying_price;
            }
            
            // Calculate Profit: (Selling Price - Buying Price) * Qty
            // Note: unit_price might be for a pack, need to be careful.
            // Assuming unit_price in loan is the actual sold price per unit.
            // And buying_price is per single unit?
            // If loan->unit_price > 1, it might be a bulk sale.
            // Let's assume standard profit calculation: (Total Amount - (Buying Price * Qty)).
            // Buying price in PM is usually per smallest unit.
            // Loan quantity is number of units sold.
            $cost = $loan->buying_price * $loan->product_quantity;
            $loan->profit = $loan->total_amount - $cost;
            $totalProfit += $loan->profit;
        }

        if ($loans->isEmpty()) {
            return redirect()->route('loans.index')->with('error', 'Loan record not found.');
        }

        $d['loans'] = $loans;
        $d['totalProfit'] = $totalProfit;
        $d['loansData'] = $loans->first();
        $d['payments'] = payment::with('user')->where('unique_id', $unique_id)
            ->orderBy('payment_date', 'asc')->get();
        $d['unique_id'] = $unique_id;

        $d['products'] = Product::with(['inventories.store'])
            ->orderBy('product_name', 'asc')
            ->get();

        $d['users'] = User::whereNot('role_id', 4)->get();
        $d['settings'] = SystemSetting::first();

        return \Inertia\Inertia::render('Finance/Loans/Show', $d);
    }



    public function loans_add_more(Request $request)
    {
        $validatedData = $request->validate([
            'product_id.*' => 'required|string|max:255',
            'product_quantity.*' => 'required|integer|min:1',
            'discount.*' => 'nullable|numeric|min:0',
            'price_type.*' => 'nullable|string|in:unit_price,product_price',
            'order_id' => 'nullable',
        ]);

        DB::beginTransaction();

        try {
            $uniqueId = $validatedData['order_id'];
            $isStaffRecommended = !empty($validatedData['staff_recommeded']);

            // Get basic product info first
            $products = Product::whereIn('id', $validatedData['product_id'])
                ->select('id', 'product_name', 'unit_price', 'product_price')
                ->get()
                ->keyBy('id');

            foreach ($validatedData['product_id'] as $index => $productId) {
                $product = $products[$productId] ?? null;
                if (!$product) {
                    throw new \Exception("Product with ID {$productId} not found.");
                }

                $quantity = $validatedData['product_quantity'][$index];
                $discount = $validatedData['discount'][$index] ?? 0;
                $priceType = $validatedData['price_type'][$index] ?? null;

                // Check inventory if not staff recommended
                $inventoryData = $this->inventoryService->getInventoryData($productId);

                if (!$isStaffRecommended) {
                    $inventoryQuantity = $this->inventoryService->getInventoryQuantity(
                        $productId,
                        $inventoryData->store_id
                    );


                    if ($inventoryQuantity < $quantity) {
                        throw new \Exception("Insufficient inventory for {$product->product_name}");
                    }
                }

                // Calculate price
                $unitPrice = ($priceType === 'unit_price' && $product->unit_price > 1)
                    ? $product->unit_price
                    : $product->product_price;
                $totalAmount = $quantity * $unitPrice;

                $exportData = Loan::where('unique_id', $uniqueId)->first();
                // Prepare record data
                $recordData = [
                    'unique_id' => $uniqueId,
                    'tin' => $exportData->tin,
                    'product_id' => $productId,
                    'product_name' => $product->product_name,
                    'customer_name' => $exportData->customer_name,
                    'staff_name' => $exportData->staff_name,
                    'product_quantity' => $quantity,
                    'unit_price' => $priceType === 'unit_price' ? $unitPrice : 0,
                    'product_price' => $priceType !== 'unit_price' ? $unitPrice : 0,
                    'discount' => $discount,
                    'phone' => $exportData->phone,
                    'sale_mode' => $exportData->sale_mode,
                    'payment_date' => $exportData->payment_date,
                    'staff_recommeded' => $exportData->staff_recommeded,
                    'status' => $exportData->status,
                    'is_checked' => $exportData->is_checked,
                    'total_amount' => $totalAmount - $discount,
                    'balance' => $totalAmount,
                ];

                $this->inventoryService->adjustInventory(
                    $productId,
                    $quantity,
                    $inventoryData->store_id,
                    'decrease',
                    'Sales by loan -- product for ' . $uniqueId . 'by Full paid '
                );
                Loan::create($recordData);
            }

            DB::commit();
            return back()->with('success', 'Sales recorded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    public function edit($unique_id)
    {
        $loansQuery = Loan::select(
                'loans.*',
                'pm.sku as linked_sku'
            )
            ->leftJoin('products as p', 'loans.product_id', '=', 'p.id')
            ->leftJoin('product_managements as pm', 'p.product_management_id', '=', 'pm.id')
            ->where('loans.unique_id', $unique_id)
            ->orderBy('loans.id', 'ASC');

        $loans = $loansQuery->get();
        
        // SKU Fallback for legacy records or missing IDs
        foreach ($loans as $loan) {
            if (!$loan->linked_sku) {
                $fallback = \App\Models\ProductManagement::where('product_name', $loan->product_name)->first();
                $loan->product_sku = $fallback?->sku ?? 'MANUAL';
            } else {
                $loan->product_sku = $loan->linked_sku;
            }
        }

        if ($loans->isEmpty()) {
            return redirect()->route('loans.index')->with('error', 'Loan record not found.');
        }

        $d['loans'] = $loans;
        $d['loansData'] = $loans->first();
        $d['payments'] = payment::where('unique_id', $unique_id)->get();
        $d['unique_id'] = $unique_id;

        return \Inertia\Inertia::render('Finance/Loans/Edit', $d);
    }

    public function edit_loans_status(Request $request, $unique_id)
    {

        $transferStatus = $request->validate([
            'status' => 'required',
        ]);

        $cartQuery = Loan::where('unique_id', $unique_id);
        $orders = $cartQuery->get();

        if ($orders->isEmpty()) {
            return redirect()->back()->with('error', 'No Order found for the given unique ID.');
        }

        foreach ($orders as $order) {
            $product = Loan::where('product_name', $order->product_name)->first();
            // dd($product);
            if ($product) {
                $newQuantity = max(0, (int) $product->product_quantity - (int) $order->quantity);
                $product->update(['product_quantity' => $newQuantity]);
            }
        }
        $cartQuery->update([
            'is_checked' => true,
        ]);

        return redirect()->back()->with('success', 'Loans checked successfully!');
    }


    public function update(Request $request, string $unique_id)
    {
        foreach ($request->order_id as $index => $orderId) {
            $product_quantity = $request->quantity[$index];
            $staff_recommeded = $request->staff_recommeded;
            $discount = $request->discount[$index];
            $cart = Loan::where('unique_id', $unique_id)
                ->where('id', $orderId)
                ->first();

            if ($cart->unit_price > 1) {
                $unitPrice = $cart->unit_price;
                $total_amount = $product_quantity * $unitPrice;
            } else {
                $productPrice = $cart->product_price;
                $total_amount = $product_quantity * $productPrice;
            }

            $discount = $discount * $product_quantity;
            if ($cart) {
                $cart->product_quantity = $product_quantity;
                $cart->staff_recommeded = $staff_recommeded;
                $cart->discount = $discount;
                $cart->total_amount = $total_amount;
                $cart->save();
            } else {
                throw new \Exception("Order with ID $orderId not found for the unique_id $unique_id.");
            }
        }
        return back()->with('success', 'Order Updated');
    }


    public function destroy(string $unique_id)
    {
        try {
            $carts = Loan::where('unique_id', $unique_id)->get();
            foreach ($carts as $cart) {
                $cart->delete();
            }
            return back()->with('success', 'Order deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred. Please try again.');
        }
    }

    // ===== NEW INERTIA CRUD METHODS =====

    private function findLoanByIdOrUniqueId($idOrUniqueId): Loan
    {
        return Loan::query()
            ->where('id', $idOrUniqueId)
            ->orWhere('unique_id', $idOrUniqueId)
            ->firstOrFail();
    }

    public function createCrud()
    {
        return \Inertia\Inertia::render('Finance/Loans/Create');
    }

    public function storeCrud(Request $request)
    {
        $validated = $request->validate([
            'loan_number' => 'required|string|unique:loans',
            'customer_id' => 'required|integer',
            'principal_amount' => 'required|numeric',
            'interest_rate' => 'required|numeric',
            'status' => 'required|string',
            'start_date' => 'required|date',
            'maturity_date' => 'required|date',
        ]);

        Loan::create($validated);
        
        return redirect()->route('loans.index.crud')->with('success', 'Loan created successfully');
    }

    public function showCrud($id)
    {
        $loan = $this->findLoanByIdOrUniqueId($id);
        
        return \Inertia\Inertia::render('Finance/Loans/Show', [
            'loan' => $loan,
        ]);
    }

    public function editCrud($id)
    {
        $loan = $this->findLoanByIdOrUniqueId($id);
        
        return \Inertia\Inertia::render('Finance/Loans/Edit', [
            'loan' => $loan,
        ]);
    }

    public function updateCrud(Request $request, $id)
    {
        $loan = $this->findLoanByIdOrUniqueId($id);
        
        $validated = $request->validate([
            'loan_number' => 'required|string|unique:loans,loan_number,' . $loan->id,
            'customer_id' => 'required|integer',
            'principal_amount' => 'required|numeric',
            'interest_rate' => 'required|numeric',
            'status' => 'required|string',
            'start_date' => 'required|date',
            'maturity_date' => 'required|date',
        ]);

        $loan->update($validated);
        
        return redirect()->route('loans.index.crud')->with('success', 'Loan updated successfully');
    }

    public function destroyCrud($id)
    {
        $this->findLoanByIdOrUniqueId($id)->delete();
        
        return redirect()->route('loans.index.crud')->with('success', 'Loan deleted successfully');
    }
}
