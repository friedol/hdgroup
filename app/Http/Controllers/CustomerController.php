<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Role;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;

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
        $query = Customer::query()->orderBy('customer_name', 'asc');

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

        // Pagination
        $perPage = $request->input('per_page', 15);
        $customers = $query->paginate($perPage);

        return \Inertia\Inertia::render('Customers/Index', [
            'customers' => [
                'data' => $customers->items(),
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status', 'all'),
                'customer_type' => $customerType,
            ]
        ]);
    }

    /**
     * Show the form for creating a new customer
     */
    public function createCrud()
    {
        $salespeople = User::query()
            ->whereNotNull('staff_name')
            ->orderBy('staff_name')
            ->get(['id', 'staff_name']);

        return \Inertia\Inertia::render('Customers/Create', [
            'salespeople' => $salespeople,
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
        ]);

        $customerPhone = !empty($validated['country_code']) && !empty($validated['phone_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['country_code'], $validated['phone_local'])
            : ($validated['customer_phone'] ?? null);

        if (!$customerPhone) {
            return back()->withErrors(['customer_phone' => 'Phone number is required.']);
        }

        $whatsAppPhone = !empty($validated['whatsapp_country_code']) && !empty($validated['whatsapp_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['whatsapp_country_code'], $validated['whatsapp_local'])
            : ($validated['whatsapp_no'] ?? null);

        try {
            $customerData = [
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => \App\Services\SmsApiService::formatPhoneNumber($customerPhone),
                'customer_address' => $validated['customer_address'] ?? '',
                'whatsapp_no' => $whatsAppPhone ? \App\Services\SmsApiService::formatPhoneNumber($whatsAppPhone) : null,
                'company_name' => $validated['company_name'] ?? null,
                'business_address' => $validated['business_address'] ?? null,
                'brought_by' => $validated['brought_by'] ?? null,
                'is_walking_customer' => (bool) ($validated['is_walking_customer'] ?? false),
                'credit_limit' => $validated['credit_limit'],
                'is_active' => true,
            ];

            if (!empty($validated['password'])) {
                $customerData['password'] = Hash::make($validated['password']);
            }

            $customer = Customer::create($customerData);

            if (!empty($customer->customer_email)) {
                event(new Registered($customer));
                $customer->sendEmailVerificationNotification();
            }

            return redirect()->route('customers.index')->with('success', 'Customer created successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create customer: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified customer
     */
    public function showCrud($id)
    {
        $customer = Customer::findOrFail($id);

        // Get customer orders/sales
        $orders = \App\Models\Sale::where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'order_number' => $sale->invoice_number ?? 'ORD-' . $sale->id,
                    'total_amount' => $sale->payable_amount ?? 0,
                    'status' => 'completed',
                    'created_at' => $sale->created_at->toDateTimeString(),
                ];
            });

        $totalSpent = \App\Models\Sale::where('customer_id', $customer->id)->sum('payable_amount');
        
        // Get outstanding balance (loans)
        $outstandingBalance = \App\Models\Loan::whereIn('unique_id', \App\Models\Sale::where('customer_id', $customer->id)->pluck('invoice_number'))
            ->where('status', 'active')
            ->sum('balance') ?? 0;

        return \Inertia\Inertia::render('Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'customer_name' => $customer->customer_name,
                'customer_email' => $customer->customer_email,
                'customer_phone' => $customer->customer_phone,
                'customer_address' => $customer->customer_address,
                'credit_limit' => (float) $customer->credit_limit,
                'is_active' => (boolean) $customer->is_active,
                'created_at' => $customer->created_at->toDateTimeString(),
                'updated_at' => $customer->updated_at->toDateTimeString(),
                'total_orders' => $orders->count(),
                'total_spent' => (float) ($totalSpent ?? 0),
                'outstanding_balance' => (float) $outstandingBalance,
                'orders' => $orders,
            ]
        ]);
    }

    /**
     * Show the form for editing the specified customer
     */
    public function editCrud($id)
    {
        $customer = Customer::findOrFail($id);

        return \Inertia\Inertia::render('Customers/Edit', [
            'customer' => [
                'id' => $customer->id,
                'customer_name' => $customer->customer_name,
                'customer_email' => $customer->customer_email,
                'customer_phone' => $customer->customer_phone,
                'customer_address' => $customer->customer_address,
                'credit_limit' => (float) $customer->credit_limit,
                'is_active' => (boolean) $customer->is_active,
            ]
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
            'customer_email' => 'nullable|email|unique:customers,customer_email,' . $customer->id,
            'country_code' => 'nullable|string|regex:/^[1-9][0-9]{0,3}$/',
            'phone_local' => 'nullable|string|regex:/^[1-9][0-9]{5,14}$/',
            'customer_phone' => 'nullable|string|max:20|unique:customers,customer_phone,' . $customer->id,
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
        ]);

        $customerPhone = !empty($validated['country_code']) && !empty($validated['phone_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['country_code'], $validated['phone_local'])
            : ($validated['customer_phone'] ?? null);

        if (!$customerPhone) {
            return back()->withErrors(['customer_phone' => 'Phone number is required.']);
        }

        $whatsAppPhone = !empty($validated['whatsapp_country_code']) && !empty($validated['whatsapp_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['whatsapp_country_code'], $validated['whatsapp_local'])
            : ($validated['whatsapp_no'] ?? null);

        try {
            $updateData = [
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => \App\Services\SmsApiService::formatPhoneNumber($customerPhone),
                'customer_address' => $validated['customer_address'] ?? '',
                'whatsapp_no' => $whatsAppPhone ? \App\Services\SmsApiService::formatPhoneNumber($whatsAppPhone) : null,
                'company_name' => $validated['company_name'] ?? null,
                'business_address' => $validated['business_address'] ?? null,
                'brought_by' => $validated['brought_by'] ?? null,
                'is_walking_customer' => (bool) ($validated['is_walking_customer'] ?? false),
                'credit_limit' => $validated['credit_limit'],
            ];

            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $customer->update($updateData);

            return redirect()->route('customers.show', $customer->id)->with('success', 'Customer updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update customer: ' . $e->getMessage()]);
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
            $hasOrders = \App\Models\Sale::where('customer_id', $customer->id)->exists();
            
            if ($hasOrders) {
                return back()->withErrors(['error' => 'Cannot delete customer with existing orders']);
            }

            $customer->delete();

            return redirect()->route('customers.index')->with('success', 'Customer deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete customer: ' . $e->getMessage()]);
        }
    }

    private function buildPhoneFromCodeAndLocal(string $countryCode, string $local): string
    {
        $code = preg_replace('/\D+/', '', $countryCode) ?: '255';
        $localDigits = preg_replace('/\D+/', '', $local) ?: '';
        $localDigits = ltrim($localDigits, '0');

        return '+' . $code . $localDigits;
    }
}
