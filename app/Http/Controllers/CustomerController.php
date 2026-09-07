<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\Export;
use App\Models\Loan;
use App\Models\Sale;
use App\Models\User;
use App\Services\CustomerAnalyticsService;
use App\Services\SmsApiService;
use Carbon\Carbon;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return $this->indexCrud($request);
    }

    public function show($id)
    {
        return $this->showCrud($id);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return $this->createCrud();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        return $this->storeCrud($request);
    }

    public function edit(string $id)
    {
        return $this->editCrud($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        return $this->updateCrud($request, $id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        return $this->destroyCrud($id);
    }

    // ───────────────────────── NEW INERTIA CRUD METHODS ──────────────────────

    /**
     * Display a listing of customers for the new Inertia interface
     */
    public function indexCrud(Request $request)
    {
        $query = Customer::with('branch')
            ->forSaler(auth()->user())
            ->orderBy('customer_name', 'asc');

        // Search filtering
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        // Status filtering
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        // Customer type filtering (regular vs guest/walk-in)
        $customerType = $request->input('customer_type', 'all');
        if ($customerType === 'guest') {
            $query->where('is_walking_customer', true);
        } elseif ($customerType === 'regular') {
            $query->where(function ($q) {
                $q->where('is_walking_customer', false)
                    ->orWhereNull('is_walking_customer');
            });
        }

        // Calculate KPIs from the filtered query BEFORE pagination
        $kpiQuery = clone $query;
        $totalCustomers = $kpiQuery->count();

        $totalCredit = 0;
        $activeCount = 0;
        $guestCount = 0;

        // Safely calculate each KPI
        try {
            $totalCredit = (float) (clone $kpiQuery)->sum('credit_limit');
        } catch (\Exception $e) {
        }
        try {
            $activeCount = (clone $kpiQuery)->where('is_active', true)->count();
        } catch (\Exception $e) {
        }
        try {
            $guestCount = (clone $kpiQuery)->where('is_walking_customer', true)->count();
        } catch (\Exception $e) {
        }

        $kpis = [
            'total' => $totalCustomers,
            'active' => $activeCount,
            'guests' => $guestCount,
            'total_credit' => $totalCredit,
            'avg_credit' => $totalCustomers > 0 ? $totalCredit / $totalCustomers : 0,
        ];

        // Pagination
        $perPage = $request->input('per_page', 15);
        $customers = $query->paginate($perPage);

        return Inertia::render('Customers/Index', [
            'customers' => [
                'data' => $customers->items(),
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
            'kpis' => $kpis,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status', 'all'),
                'customer_type' => $customerType,
            ],
        ]);
    }

    public function createCrud()
    {
        $salespeople = User::query()
            ->whereNotNull('staff_name')
            ->orderBy('staff_name')
            ->get(['id', 'staff_name']);

        $branches = Branch::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Customers/Create', [
            'salespeople' => $salespeople,
            'branches' => $branches,
            'activeBranchId' => session('active_branch_id') ?? auth()->user()->branch_id,
        ]);
    }

    /**
     * Store a newly created customer
     */
    public function storeCrud(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|unique:customers',
            'country_code' => 'nullable|string|regex:/^[1-9][0-9]{0,3}$/',
            'phone_local' => 'nullable|string|regex:/^[1-9][0-9]{5,14}$/',
            'customer_phone' => 'nullable|string|max:20|unique:customers',
            'whatsapp_country_code' => 'nullable|string|regex:/^[1-9][0-9]{0,3}$/',
            'whatsapp_local' => 'nullable|string|regex:/^[1-9][0-9]{5,14}$/',
            'whatsapp_no' => 'nullable|string|max:30',
            'company_name' => 'nullable|string|max:255',
            'business_address' => 'nullable|string|max:500',
            'brought_by' => 'nullable|integer|exists:users,id',
            'is_walking_customer' => 'nullable|boolean',
            'customer_address' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'credit_limit' => 'required|numeric|min:0',
            'password' => 'nullable|string|min:6',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $customerPhone = ! empty($validated['country_code']) && ! empty($validated['phone_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['country_code'], $validated['phone_local'])
            : ($validated['customer_phone'] ?? null);

        if (! $customerPhone) {
            return back()->withErrors(['customer_phone' => 'Phone number is required.']);
        }

        $whatsAppPhone = ! empty($validated['whatsapp_country_code']) && ! empty($validated['whatsapp_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['whatsapp_country_code'], $validated['whatsapp_local'])
            : ($validated['whatsapp_no'] ?? null);

        try {
            $customerData = [
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => SmsApiService::formatPhoneNumber($customerPhone),
                'location' => $validated['customer_address'] ?? '',
                'whatsapp_no' => $whatsAppPhone ? SmsApiService::formatPhoneNumber($whatsAppPhone) : null,
                'company_name' => $validated['company_name'] ?? null,
                'business_address' => $validated['business_address'] ?? null,
                'brought_by' => $validated['brought_by'] ?? null,
                'is_walking_customer' => (bool) ($validated['is_walking_customer'] ?? false),
                'credit_limit' => $validated['credit_limit'],
                'branch_id' => $validated['branch_id'] ?? session('active_branch_id') ?? auth()->user()->branch_id,
                'is_active' => true,
            ];

            if (! empty($validated['password'])) {
                $customerData['password'] = Hash::make($validated['password']);
            }

            $customer = Customer::create($customerData);

            if (! empty($customer->customer_email)) {
                event(new Registered($customer));
                $customer->sendEmailVerificationNotification();
            }

            return redirect()->route('customers.index')->with('success', 'Customer created successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create customer: '.$e->getMessage()]);
        }
    }

    /**
     * Display the specified customer
     */
    public function showCrud($id)
    {
        $customer = Customer::findOrFail($id);

        // Get customer name for string-based searches
        $customerName = $customer->customer_name;

        // Recalculate analytics to ensure profile KPIs are fresh
        try {
            app(CustomerAnalyticsService::class)->recalculateCustomerAnalytics($customer->id);
            $customer->refresh();
        } catch (\Exception $e) {
            // Service might fail if dependencies are missing
        }

        // Get customer identifiers for cross-reference
        $customerName = $customer->customer_name;
        $customerPhone = substr($customer->customer_phone, -9); // Last 9 digits for flexible matching
        $customerEmail = $customer->customer_email;

        // 1. Get POS Sales (Expanded search to catch orders linked by name/phone/email)
        $sales = Sale::withoutGlobalScope('branch')->with('branch')
            ->where(function ($q) use ($customer, $customerName, $customerPhone) {
                $q->where('pos_customer_id', $customer->id)
                    ->orWhere('customer_id', $customer->id)
                    ->orWhereHas('posCustomer', function ($sq) use ($customerName) {
                        $sq->where('customer_name', 'like', '%'.$customerName.'%');
                    });

                if ($customerName) {
                    $q->orWhereExists(function ($eq) use ($customerName) {
                        $eq->select(DB::raw(1))
                            ->from('customers')
                            ->whereColumn('customers.id', 'sales.pos_customer_id')
                            ->where('customer_name', 'like', '%'.$customerName.'%');
                    });
                }

                // If no ID match, try identifiers (legacy or unlinked sales)
                if ($customerPhone) {
                    $q->orWhere('notes', 'like', '%'.$customerPhone.'%'); // Some legacy systems put phone in notes
                }

                // Search by name/phone in posCustomer relationship or directly if it was a guest
                $q->orWhere('invoice_number', 'like', '%'.$customerName.'%'); // Sometimes name is in invoice? unlikely but safe
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // 2. Get Loans (legacy orders - Expanded search)
        $loans = Loan::withoutGlobalScope('branch')->with('branch')
            ->where(function ($q) use ($customerName, $customerPhone) {
                $q->where('customer_name', 'like', '%'.$customerName.'%');
                if ($customerPhone) {
                    $q->orWhere('phone', 'like', '%'.$customerPhone.'%');
                }
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // 3. Get Exports (legacy orders - Expanded search)
        $exports = Export::withoutGlobalScope('branch')->with('branch')
            ->where(function ($q) use ($customerName, $customerPhone) {
                $q->where('customer_name', 'like', '%'.$customerName.'%');
                if ($customerPhone) {
                    $q->orWhere('phone', 'like', '%'.$customerPhone.'%');
                }
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // 4. Get Online Orders (Carts)
        $carts = Cart::withoutGlobalScope('branch')->with('branch')->where(function ($q) use ($customerName, $customer) {
            $q->where('name', 'like', '%'.$customerName.'%')
                ->orWhere('email', $customer->customer_email)
                ->orWhere('phone_number', 'like', '%'.substr($customer->customer_phone, -9).'%');
        })
            ->get();

        // Group carts manually to preserve branch info if needed, or just use the first one
        $groupedCarts = $carts->groupBy('unique_id')->map(function ($group) {
            $first = $group->first();

            return (object) [
                'unique_id' => $first->unique_id,
                'status' => $first->status,
                'created_at' => $first->created_at,
                'total_price' => $group->sum(fn ($c) => $c->price * $c->quantity),
                'branch_name' => $first->branch->name ?? 'Online',
            ];
        });

        // Consolidate and format orders
        $orders = collect();

        // Add Sales
        foreach ($sales as $sale) {
            $orders->push([
                'id' => $sale->id,
                'order_number' => $sale->invoice_number ?? 'ORD-'.$sale->id,
                'total_amount' => (float) ($sale->payable_amount ?? 0),
                'status' => $sale->payment_status ?? 'completed',
                'created_at' => $sale->created_at->toDateTimeString(),
                'source' => 'POS',
                'branch_name' => $sale->branch->name ?? 'Global',
            ]);
        }

        // Add Carts (Online)
        $processedUniqueIds = $sales->pluck('invoice_number')->filter()->toArray();

        foreach ($groupedCarts as $cart) {
            if (in_array($cart->unique_id, $processedUniqueIds)) {
                continue;
            }

            $orders->push([
                'id' => $cart->unique_id,
                'order_number' => $cart->unique_id,
                'total_amount' => (float) ($cart->total_price ?? 0),
                'status' => $cart->status ?? 'pending',
                'created_at' => $cart->created_at instanceof Carbon ? $cart->created_at->toDateTimeString() : $cart->created_at,
                'source' => 'Online',
                'branch_name' => $cart->branch_name,
            ]);
            $processedUniqueIds[] = $cart->unique_id;
        }

        // Add Loans/Exports and avoid duplicates by order number (unique_id)
        foreach ($loans->concat($exports) as $legacy) {
            if (in_array($legacy->unique_id, $processedUniqueIds)) {
                continue;
            }

            $orders->push([
                'id' => $legacy->id,
                'order_number' => $legacy->unique_id,
                'total_amount' => (float) ($legacy->total_amount ?? $legacy->product_price ?? 0),
                'status' => $legacy->status ?? 'pending',
                'created_at' => $legacy->created_at->toDateTimeString(),
                'source' => 'Legacy',
                'branch_name' => $legacy->branch->name ?? 'Global',
            ]);
            $processedUniqueIds[] = $legacy->unique_id;
        }

        // Sort orders by date
        $orders = $orders->sortByDesc('created_at')->values();

        // Get manufacturing batches
        $batches = collect();

        $totalSpent = $orders->sum('total_amount');

        // Get outstanding balance (loans) - Bypass branch scope for full financial view
        $outstandingBalance = Loan::withoutGlobalScope('branch')->where('customer_name', 'like', '%'.$customerName.'%')
            ->where('status', '!=', 'Paid')
            ->sum('balance') ?? 0;

        return Inertia::render('Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'customer_name' => $customer->customer_name,
                'customer_email' => $customer->customer_email,
                'customer_phone' => $customer->customer_phone,
                'customer_address' => $customer->location,
                'credit_limit' => (float) $customer->credit_limit,
                'is_active' => (bool) $customer->is_active,
                'created_at' => $customer->created_at->toDateTimeString(),
                'updated_at' => $customer->updated_at->toDateTimeString(),
                'total_orders' => $orders->count(),
                'total_spent' => (float) ($totalSpent ?? 0),
                'outstanding_balance' => (float) $outstandingBalance,
                'orders' => $orders,
                'batches' => $batches,
            ],
        ]);
    }

    public function editCrud($id)
    {
        $customer = Customer::findOrFail($id);

        $branches = Branch::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Customers/Edit', [
            'branches' => $branches,
            'customer' => [
                'id' => $customer->id,
                'customer_name' => $customer->customer_name,
                'customer_email' => $customer->customer_email,
                'customer_phone' => $customer->customer_phone,
                'customer_address' => $customer->location,
                'company_name' => $customer->company_name,
                'business_address' => $customer->business_address,
                'brought_by' => $customer->brought_by,
                'credit_limit' => (float) $customer->credit_limit,
                'branch_id' => $customer->branch_id,
                'is_active' => (bool) $customer->is_active,
            ],
        ]);
    }

    /**
     * Update the specified customer
     */
    public function updateCrud(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|unique:customers,customer_email,'.$customer->id,
            'country_code' => 'nullable|string|regex:/^[1-9][0-9]{0,3}$/',
            'phone_local' => 'nullable|string|regex:/^[1-9][0-9]{5,14}$/',
            'customer_phone' => 'nullable|string|max:20|unique:customers,customer_phone,'.$customer->id,
            'whatsapp_country_code' => 'nullable|string|regex:/^[1-9][0-9]{0,3}$/',
            'whatsapp_local' => 'nullable|string|regex:/^[1-9][0-9]{5,14}$/',
            'whatsapp_no' => 'nullable|string|max:30',
            'company_name' => 'nullable|string|max:255',
            'business_address' => 'nullable|string|max:500',
            'brought_by' => 'nullable|integer|exists:users,id',
            'is_walking_customer' => 'nullable|boolean',
            'customer_address' => 'nullable|string',
            'credit_limit' => 'required|numeric|min:0',
            'password' => 'nullable|string|min:6',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $customerPhone = ! empty($validated['country_code']) && ! empty($validated['phone_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['country_code'], $validated['phone_local'])
            : ($validated['customer_phone'] ?? null);

        if (! $customerPhone) {
            return back()->withErrors(['customer_phone' => 'Phone number is required.']);
        }

        $whatsAppPhone = ! empty($validated['whatsapp_country_code']) && ! empty($validated['whatsapp_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['whatsapp_country_code'], $validated['whatsapp_local'])
            : ($validated['whatsapp_no'] ?? null);

        try {
            $updateData = [
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => SmsApiService::formatPhoneNumber($customerPhone),
                'location' => $validated['customer_address'] ?? '',
                'whatsapp_no' => $whatsAppPhone ? SmsApiService::formatPhoneNumber($whatsAppPhone) : null,
                'company_name' => $validated['company_name'] ?? null,
                'business_address' => $validated['business_address'] ?? null,
                'brought_by' => $validated['brought_by'] ?? null,
                'is_walking_customer' => (bool) ($validated['is_walking_customer'] ?? false),
                'credit_limit' => $validated['credit_limit'],
                'branch_id' => $validated['branch_id'] ?? $customer->branch_id,
            ];

            if (! empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $customer->update($updateData);

            return redirect()->route('customers.show', $customer->id)->with('success', 'Customer updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update customer: '.$e->getMessage()]);
        }
    }

    /**
     * Remove the specified customer
     */
    public function destroyCrud($id)
    {
        $customer = Customer::findOrFail($id);

        try {
            // Check if customer has orders
            $hasOrders = Sale::where('customer_id', $customer->id)->exists();

            if ($hasOrders) {
                return back()->withErrors(['error' => 'Cannot delete customer with existing orders']);
            }

            $customer->delete();

            return redirect()->route('customers.index')->with('success', 'Customer deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete customer: '.$e->getMessage()]);
        }
    }

    private function buildPhoneFromCodeAndLocal(string $countryCode, string $local): string
    {
        $code = preg_replace('/\D+/', '', $countryCode) ?: '255';
        $localDigits = preg_replace('/\D+/', '', $local) ?: '';
        $localDigits = ltrim($localDigits, '0');

        return '+'.$code.$localDigits;
    }
}
