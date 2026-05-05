<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PosController extends Controller
{
    /**
     * Strip dimension suffixes and "Custom" keyword from product names.
     * Examples: "A5 D-CUTS Bag 40.00x48.00cm" => "A5 D-CUTS Bag"
     *           "A4 Bag 30x45cm Custom"        => "A4 Bag"
     */
    private function cleanProductName(string $name): string
    {
        // Remove dimension patterns like 40.00x48.00cm, 35x45cm, 30x60, etc.
        $name = preg_replace('/\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?:cm|mm|m|in|")?\s*/i', '', $name);
        // Remove trailing "Custom" keyword
        $name = preg_replace('/\s*custom\s*$/i', '', $name);
        return trim($name);
    }

    private function formatReceiptDimension(?float $width, ?float $length, ?string $unit): ?string
    {
        if (!$width || !$length) {
            return null;
        }

        $dimensionUnit = trim((string) ($unit ?: 'cm'));

        return rtrim(rtrim(number_format($width, 2, '.', ''), '0'), '.')
            . ' x '
            . rtrim(rtrim(number_format($length, 2, '.', ''), '0'), '.')
            . ' '
            . $dimensionUnit;
    }

    public function terminal()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $branchId = session('active_branch_id') ?: ($user ? $user->branch_id : 1);

        $inventoryService = new \App\Services\InventoryService();
        $productType = \App\Models\Product::class;
        $posProducts = \App\Models\Product::with([
            'productManagement' => fn ($query) => $query->withoutGlobalScope('branch')->with(['category', 'sourceStore']),
            'variants',
        ])
            ->where(fn($q) => $q->where('is_enabled', true))
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->limit(100)
            ->get()
            ->map(function ($p) use ($inventoryService, $branchId, $productType) {
                $productManagement = $p->productManagement;
                $cat = $productManagement?->category?->category_name ?? 'General';
                $unitPrice = $productManagement?->unit_price ?? $p->product_price;

                // Get raw units and normalize keys (unit_name -> name, market_price -> price)
                $rawUnits = $productManagement?->sale_units ?? [];
                if (is_string($rawUnits)) {
                    $rawUnits = json_decode($rawUnits, true) ?? [];
                }

                $saleUnits = collect($rawUnits)->map(function ($u) use ($p) {
                    $fallbackPrice = (float) ($u['price'] ?? $u['market_price'] ?? $u['unit_price'] ?? $p->product_price);

                    return [
                        'name' => $u['name'] ?? $u['unit_name'] ?? 'Unit',
                        'unit_name' => $u['unit_name'] ?? $u['name'] ?? 'Unit',
                        'factor' => (float) ($u['factor'] ?? 1),
                        'price' => $fallbackPrice,
                        'unit_price' => (float) ($u['unit_price'] ?? $fallbackPrice),
                        'market_price' => (float) ($u['market_price'] ?? $fallbackPrice),
                        'plain_price' => isset($u['plain_price']) ? (float) $u['plain_price'] : null,
                        'printed_price' => isset($u['printed_price']) ? (float) $u['printed_price'] : null,
                        'description' => $u['description'] ?? null,
                    ];
                })->toArray();

                if (empty($saleUnits)) {
                    $unit = $productManagement?->unit_name ?? 'Unit';
                    $saleUnits = [[
                        'name' => $unit,
                        'unit_name' => $unit,
                        'factor' => 1,
                        'price' => (float) $p->product_price,
                        'unit_price' => (float) $unitPrice,
                        'market_price' => (float) $p->product_price,
                        'plain_price' => (float) ($productManagement?->plain_selling_price ?? $p->product_price),
                        'printed_price' => (float) ($productManagement?->printed_selling_price ?? $p->product_price),
                        'description' => null,
                    ]];
                }

                return [
                    'id' => $p->id,
                    'sku' => $p->product_id,
                    'name' => $this->cleanProductName($p->product_name ?? ''),
                    'price' => (float) $p->product_price,
                    'plain_price' => (float) ($productManagement?->plain_selling_price ?? $p->product_price),
                    'printed_price' => (float) ($productManagement?->printed_selling_price ?? $p->product_price),
                    'unit_price' => (float) $unitPrice,
                    'category' => $cat,
                    'stock' => $inventoryService->getTotalInventoryQuantity($p->id, $productType, $branchId),
                    'sale_units' => $saleUnits,
                    'image' => ($productManagement && $productManagement->image_1)
                        ? asset('storage/' . $productManagement->image_1)
                        : asset('frontend/images/placeholder.png'),
                    'product_type' => $p->product_type,
                    'source_store' => $productManagement?->sourceStore ? [
                        'id' => $productManagement->sourceStore->id,
                        'name' => $productManagement->sourceStore->store_name,
                    ] : null,
                    'variants' => $p->variants->map(fn($v) => [
                        'id' => $v->id,
                        'color' => $v->color,
                        'qty' => $v->qty,
                        'price' => (float) $v->selling_price,
                        'plain_price' => (float) ($productManagement?->plain_selling_price ?? $v->selling_price ?? $p->product_price),
                        'printed_price' => (float) ($productManagement?->printed_selling_price ?? $productManagement?->plain_selling_price ?? $v->selling_price ?? $p->product_price),
                    ]),
                ];
            });

        $categories = $posProducts->pluck('category')->unique()->values()->all();

        $salesHistory = \App\Models\Sale::with(['posCustomer'])->orderByDesc('created_at')->limit(50)->get()->map(function ($s) {
            $customerName = 'Walking customer';
            if ($s->posCustomer) {
                $customerName = $s->posCustomer->customer_name;
                if ($s->posCustomer->company_name) {
                    $customerName .= ' — ' . $s->posCustomer->company_name;
                }
            }
            return [
                'id' => $s->invoice_number,
                'customer' => $customerName,
                'items' => $s->items()->sum('quantity') ?? 0,
                'total' => 'TZS ' . number_format($s->payable_amount, 2),
                'method' => $s->payment_method ?? 'Cash',
                'time' => $s->created_at->format('g:i A'),
                'status' => $s->payment_status,
            ];
        });


        // Branch staff for "Brought by" dropdown
        $branchStaff = \App\Models\User::where('branch_id', $branchId)
            ->get(['id', 'staff_name', 'staff_phone']);

        return \Inertia\Inertia::render('PosPage', [
            'initialProducts' => $posProducts,
            'initialCategories' => $categories,
            'initialSalesHistory' => $salesHistory,
            'branchStaff' => $branchStaff,
            'currentUser' => [
                'id' => $user->id,
                'name' => $user->staff_name,
                'branch_id' => $user->branch_id,
            ],
        ]);
    }

    public function searchProducts(Request $request)
    {
        $search = $request->get('q');
        $inventoryService = new \App\Services\InventoryService();
        $productType = \App\Models\Product::class;

        $branchId = session('active_branch_id');
        if (!$branchId || $branchId === 'all') {
            $branchId = \Illuminate\Support\Facades\Auth::check() ? \Illuminate\Support\Facades\Auth::user()->branch_id : 1;
        }

        $products = \App\Models\Product::with([
            'productManagement' => fn ($query) => $query->withoutGlobalScope('branch')->with('sourceStore'),
            'variants',
        ])
            ->where(function ($query) use ($search) {
                $query->where('product_name', 'LIKE', "%$search%")
                    ->orWhere('product_id', 'LIKE', "%$search%"); // SKU
            })
            ->limit(24)
            ->get()
            ->map(function ($product) use ($inventoryService, $branchId, $productType) {
                $productManagement = $product->productManagement;
                $stock = $inventoryService->getTotalInventoryQuantity($product->id, $productType, $branchId);

                // Refined Unit & Sale Units for manufactured products
                $unit = $productManagement?->unit_name ?? ($product->product_type === 'manufactured' ? 'Piece' : 'Unit');
                $saleUnits = $productManagement?->sale_units ?? [];
                if (is_string($saleUnits)) {
                    $saleUnits = json_decode($saleUnits, true) ?? [];
                }
                $saleUnits = collect($saleUnits)->map(function ($u) use ($product) {
                    $fallbackPrice = (float) ($u['price'] ?? $u['market_price'] ?? $u['unit_price'] ?? $product->product_price);

                    return [
                        'name' => $u['name'] ?? $u['unit_name'] ?? 'Unit',
                        'unit_name' => $u['unit_name'] ?? $u['name'] ?? 'Unit',
                        'factor' => (float) ($u['factor'] ?? 1),
                        'price' => $fallbackPrice,
                        'unit_price' => (float) ($u['unit_price'] ?? $fallbackPrice),
                        'market_price' => (float) ($u['market_price'] ?? $fallbackPrice),
                        'plain_price' => isset($u['plain_price']) ? (float) $u['plain_price'] : null,
                        'printed_price' => isset($u['printed_price']) ? (float) $u['printed_price'] : null,
                        'description' => $u['description'] ?? null,
                    ];
                })->values()->all();

                if (empty($saleUnits)) {
                    $saleUnits = [[
                        'name' => $unit,
                        'unit_name' => $unit,
                        'factor' => 1,
                        'price' => (float) $product->product_price,
                        'unit_price' => (float) ($product->unit_price ?? $product->product_price),
                        'market_price' => (float) $product->product_price,
                        'plain_price' => (float) ($productManagement?->plain_selling_price ?? $product->product_price),
                        'printed_price' => (float) ($productManagement?->printed_selling_price ?? $product->product_price),
                        'description' => null,
                    ]];
                }

                // Clean product name: remove dimensions and "Custom" keyword
                $rawName = $product->product_name ?? '';
                $cleanName = $this->cleanProductName($rawName);

                // Determine which branch's stores to show.
                // If the user has a specific branch selected, show that branch's stores.
                // If the user is viewing 'all' branches or has no session branch, use the product's own branch.
                $storeBranchId = (session('active_branch_id') && session('active_branch_id') !== 'all')
                    ? session('active_branch_id')
                    : ($product->branch_id ?? $branchId);

                return [
                    'id' => $product->id,
                    'name' => $cleanName,
                    'price' => $product->product_price,
                    'plain_price' => (float) ($productManagement?->plain_selling_price ?? $product->product_price),
                    'printed_price' => (float) ($productManagement?->printed_selling_price ?? $product->product_price),
                    'unit_price' => $product->unit_price,
                    'sku' => $product->product_id,
                    'stock' => $stock,
                    'unit' => $unit,
                    'sale_units' => $saleUnits,
                    'stores' => \App\Models\Store::where('branch_id', $storeBranchId)->get()->map(
                        function ($store) use ($product, $inventoryService) {
                            return [
                                'name' => $store->store_name,
                                'qty' => $inventoryService->getInventory($product->id, $store->id, \App\Models\Product::class)?->qty ?? 0,
                            ];
                        }
                    ),
                    'image' => ($productManagement && $productManagement->image_1) ? asset('storage/' . $productManagement->image_1) : asset('frontend/images/placeholder.png'),
                    'product_type' => $product->product_type,
                    'source_store' => $productManagement?->sourceStore ? [
                        'id' => $productManagement->sourceStore->id,
                        'name' => $productManagement->sourceStore->store_name,
                    ] : null,
                    'variants' => $product->variants->map(fn($v) => [
                        'id' => $v->id,
                        'color' => $v->color,
                        'qty' => $v->qty,
                        'price' => (float) $v->selling_price,
                        'plain_price' => (float) ($productManagement?->plain_selling_price ?? $v->selling_price ?? $product->product_price),
                        'printed_price' => (float) ($productManagement?->printed_selling_price ?? $productManagement?->plain_selling_price ?? $v->selling_price ?? $product->product_price),
                    ]),
                ];
            });

        return response()->json($products);
    }

    public function searchCustomers(Request $request)
    {
        $search = $request->get('q', '');
        $customers = \App\Models\Customer::where('customer_name', 'LIKE', "%$search%")
            ->orWhere('customer_phone', 'LIKE', "%$search%")
            ->orWhere('customer_email', 'LIKE', "%$search%")
            ->orWhere('company_name', 'LIKE', "%$search%")
            ->orWhere('whatsapp_no', 'LIKE', "%$search%")
            ->limit(15)
            ->get(['id', 'customer_name', 'customer_phone', 'customer_email', 'company_name', 'whatsapp_no', 'is_walking_customer']);

        return response()->json($customers);
    }

    public function quickCustomerStore(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'country_code' => 'nullable|string|regex:/^[1-9][0-9]{0,3}$/',
            'phone_local' => 'nullable|string|regex:/^[1-9][0-9]{5,14}$/',
            'customer_phone' => 'nullable|string|max:30',
            'customer_email' => 'nullable|email|max:255',
            'whatsapp_country_code' => 'nullable|string|regex:/^[1-9][0-9]{0,3}$/',
            'whatsapp_local' => 'nullable|string|regex:/^[1-9][0-9]{5,14}$/',
            'whatsapp_no' => 'nullable|string|max:30',
            'company_name' => 'nullable|string|max:255',
            'business_address' => 'nullable|string|max:500',
            'brought_by' => 'nullable|integer|exists:users,id',
            'is_walking_customer' => 'nullable|boolean',
        ]);

        $customerPhone = !empty($validated['country_code']) && !empty($validated['phone_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['country_code'], $validated['phone_local'])
            : ($validated['customer_phone'] ?? null);

        if (!$customerPhone) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['customer_phone' => ['Phone number is required.']],
            ], 422);
        }

        $whatsAppPhone = !empty($validated['whatsapp_country_code']) && !empty($validated['whatsapp_local'])
            ? $this->buildPhoneFromCodeAndLocal($validated['whatsapp_country_code'], $validated['whatsapp_local'])
            : ($validated['whatsapp_no'] ?? null);

        $branchId = session('active_branch_id') ?: (\Illuminate\Support\Facades\Auth::user()->branch_id ?? 1);

        // Normalize phone (add +255 if needed)
        $validated['customer_phone'] = \App\Services\SmsApiService::formatPhoneNumber($customerPhone);

        // Same for whatsapp
        if (!empty($whatsAppPhone)) {
            $validated['whatsapp_no'] = \App\Services\SmsApiService::formatPhoneNumber($whatsAppPhone);
        }

        $isWalking = $validated['is_walking_customer'] ?? false;

        $customer = \App\Models\Customer::create([
            'customer_name' => $isWalking ? 'Walking Customer' : $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'whatsapp_no' => $validated['whatsapp_no'] ?? null,
            'company_name' => $validated['company_name'] ?? null,
            'business_address' => $validated['business_address'] ?? null,
            'brought_by' => $validated['brought_by'] ?? null,
            'is_walking_customer' => $isWalking,
            'branch_id' => $branchId,
        ]);

        return response()->json([
            'success' => true,
            'id' => $customer->id,
            'customer_name' => $customer->customer_name,
            'customer_phone' => $customer->customer_phone,
            'customer_email' => $customer->customer_email,
            'company_name' => $customer->company_name,
            'is_walking_customer' => $customer->is_walking_customer,
        ]);
    }

    private function buildPhoneFromCodeAndLocal(string $countryCode, string $local): string
    {
        $code = preg_replace('/\D+/', '', $countryCode) ?: '255';
        $localDigits = preg_replace('/\D+/', '', $local) ?: '';
        $localDigits = ltrim($localDigits, '0');

        return '+' . $code . $localDigits;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cart' => 'required|array|min:1',
            'payment_method' => 'nullable|string',
            'payment_breakdown' => 'nullable|array',
            'payment_breakdown.*.method' => 'required_with:payment_breakdown|string|in:Cash,Mobile,Bank',
            'payment_breakdown.*.amount' => 'required_with:payment_breakdown|numeric|min:0',
            'payment_timing' => 'nullable|in:now,later',
            'customer_id' => 'nullable|integer',
            'discount' => 'nullable|numeric',
            'amount_received' => 'nullable|numeric',
            'tax_amount' => 'nullable|numeric',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $inventoryService = new \App\Services\InventoryService();
        $invoiceNumber = 'INV-' . strtoupper(substr(uniqid(), -8));

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $subtotal = 0;
            foreach ($validated['cart'] as $item) {
                $subtotal += $item['price'] * $item['qty'];
            }

            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax_amount'] ?? 0;
            $payable = $subtotal - $discount + $tax;
            $payLater = ($validated['payment_timing'] ?? 'now') === 'later';

            $paymentBreakdown = collect($validated['payment_breakdown'] ?? [])
                ->filter(fn($entry) => (float) ($entry['amount'] ?? 0) > 0)
                ->values();

            $received = $payLater
                ? 0
                : ($paymentBreakdown->isNotEmpty()
                    ? (float) $paymentBreakdown->sum(fn($entry) => (float) ($entry['amount'] ?? 0))
                    : (float) ($validated['amount_received'] ?? 0));

            $paymentMethod = $payLater
                ? null
                : ($paymentBreakdown->isNotEmpty()
                    ? $paymentBreakdown->pluck('method')->implode(' + ')
                    : ($validated['payment_method'] ?? 'Cash'));

            $status = $payLater ? 'Unpaid' : 'Paid';
            if (!$payLater && $received < $payable) {
                $status = ($received > 0) ? 'Partially Paid' : 'Unpaid';
            }

            $branchId = session('active_branch_id') ?: \Illuminate\Support\Facades\Auth::user()->branch_id ?: 1;

            // 1. Create Sale
            $sale = \App\Models\Sale::create([
                'invoice_number' => $invoiceNumber,
                'pos_customer_id' => ($validated['customer_id'] && $validated['customer_id'] > 0) ? $validated['customer_id'] : null,
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'total_amount' => $subtotal,
                'discount_amount' => $discount,
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'payable_amount' => $payable,
                'payment_method' => $paymentMethod ?: 'Pending',
                'payment_status' => $status,
                'notes' => $validated['notes'] ?? "POS Sale via Terminal",
                'branch_id' => $branchId
            ]);

            // 2. Process Items
            foreach ($validated['cart'] as $item) {
                $product = \App\Models\Product::findOrFail($item['id']);
                $factor = $item['factor'] ?? 1;
                $totalBaseQty = $item['qty'] * $factor;
                $variantId = isset($item['variant_id']) ? (int) $item['variant_id'] : null;
                $printType = $item['print_type'] ?? null;
                $variant = null;

                if ($variantId) {
                    $variant = \App\Models\ProductVariant::where('id', $variantId)
                        ->where('product_id', $product->id)
                        ->first();

                    if (!$variant) {
                        throw new \Exception("Selected variant not found for {$product->product_name}");
                    }

                    $variantStockField = match ($printType) {
                        'plain' => 'plain_qty',
                        'printed' => 'printed_qty',
                        default => 'qty',
                    };
                    $specificVariantAvailable = (float) ($variant->{$variantStockField} ?? 0);
                    $variantAvailable = $variantStockField !== 'qty' && $specificVariantAvailable > 0
                        ? $specificVariantAvailable
                        : (float) ($variant->qty ?? 0);

                    if ($variantAvailable < $totalBaseQty) {
                        throw new \Exception("Insufficient stock for {$product->product_name} ({$variant->color}). Available: {$variantAvailable}, Requested: {$totalBaseQty}");
                    }
                }

                // Stock Guard: Check branch-scoped stock first, fall back to global stock
                $currentStock = $inventoryService->getTotalInventoryQuantity($product->id, 'App\Models\Product', $branchId);

                // Fallback: if branch-scoped stock is 0, check total stock across all stores
                // This handles cases where inventory records have null/mismatched branch_id
                if ($currentStock <= 0) {
                    $currentStock = $inventoryService->getTotalInventoryQuantity($product->id, 'App\Models\Product', 'all');
                }

                if ($currentStock < $totalBaseQty) {
                    throw new \Exception("Insufficient stock for {$product->product_name}. Available: $currentStock, Requested: $totalBaseQty");
                }

                // 3. Deduct stock across all stores in the current branch
                // OR from the product's source store if it has one
                $inventoryService->deductInventoryWithSourceStore(
                    $product->id,
                    $totalBaseQty,
                    'App\Models\Product',
                    $branchId,
                    \App\Models\Sale::class,
                    $sale->id,
                    "POS Sale - $invoiceNumber"
                );

                if ($variantId) {
                    $inventoryService->deductVariantStock($product->id, $variantId, (float) $totalBaseQty, $printType);
                }

                // Create Sale Item
                \App\Models\SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'variant_id' => $variantId,
                    'variant_color' => $variant?->color,
                    'print_type' => $printType,
                    'quantity' => $item['qty'],
                    'unit_price' => $item['price'],
                    'subtotal' => $item['price'] * $item['qty'],
                    'discount' => 0 // Per-item discount could be added later
                ]);
            }

            // 3. Handle Loan if Unpaid/Partial
            if ($status !== 'Paid') {
                $customerName = "Walking Customer";
                $customerPhone = "";
                if ($sale->pos_customer_id) {
                    $customer = \App\Models\Customer::find($sale->pos_customer_id);
                    if ($customer) {
                        $customerName = $customer->customer_name;
                        $customerPhone = $customer->customer_phone;
                    }
                }

                $staffName = \Illuminate\Support\Facades\Auth::user()->staff_name ?? 'Admin';
                $dueDate = $validated['due_date'] ?? now()->addDays(30);

                foreach ($validated['cart'] as $item) {
                    $itemPayable = $item['price'] * $item['qty'];

                    // We distribute the received amount proportionally or just keep balance on total
                    // For simplicity in a multi-item loan, we track balance per item if needed, 
                    // but usually, it's easier to keep total balance on the invoice.
                    // However, to satisfy "Itemized Order Details", we need individual records.

                    \App\Models\Loan::create([
                        'sale_id' => $sale->id,
                        'unique_id' => $invoiceNumber,
                        'customer_name' => $customerName,
                        'phone' => $customerPhone,
                        'product_id' => $item['id'],
                        'product_name' => $item['name'],
                        'product_quantity' => $item['qty'],
                        'product_price' => $item['price'],
                        'unit_price' => $item['price'],
                        'staff_name' => $staffName,
                        'total_amount' => $itemPayable,
                        'amount_paid' => 0, // Individual item tracking can be complex; we'll sync total balance later
                        'balance' => $itemPayable,
                        'status' => $status,
                        'payment_date' => $dueDate,
                        'branch_id' => $branchId,
                    ]);
                }

                // Update the first item with the initial amount received to keep total balance correct
                $firstLoan = \App\Models\Loan::where('unique_id', $invoiceNumber)->first();
                if ($firstLoan) {
                    $firstLoan->update([
                        'amount_paid' => $received,
                        'balance' => $firstLoan->total_amount - $received
                    ]);
                }
            }

            // Phase 110: Record initial payment in payments table
            if ($received > 0) {
                if ($paymentBreakdown->isNotEmpty()) {
                    foreach ($paymentBreakdown as $entry) {
                        \App\Models\Payment::create([
                            'unique_id' => $invoiceNumber,
                            'user_id' => \Illuminate\Support\Facades\Auth::id(),
                            'amount_paid' => (float) ($entry['amount'] ?? 0),
                            'payment_date' => now()->toDateString(),
                            'payment_method' => $entry['method'] ?? 'Cash',
                            'reference' => 'Initial POS Payment (Split)'
                        ]);
                    }
                } else {
                    \App\Models\Payment::create([
                        'unique_id' => $invoiceNumber,
                        'user_id' => \Illuminate\Support\Facades\Auth::id(),
                        'amount_paid' => $received,
                        'payment_date' => now()->toDateString(),
                        'payment_method' => $paymentMethod,
                        'reference' => 'Initial POS Payment'
                    ]);
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            // --- Order Confirmation SMS (non-blocking) ---
            try {
                if (!empty($validated['customer_id']) && $validated['customer_id'] > 0) {
                    $smsCustomer = \App\Models\Customer::find($validated['customer_id']);
                    if ($smsCustomer && !empty($smsCustomer->customer_phone)) {
                        $smsService = new \App\Services\SmsApiService($branchId);
                        $smsText = \App\Services\SmsApiService::buildOrderConfirmationSms(
                            $smsCustomer->customer_name,
                            $invoiceNumber,
                            array_map(fn($i) => ['qty' => $i['qty'] ?? 1, 'name' => $i['name'] ?? 'Item'], $validated['cart']),
                            $payable,
                            $paymentMethod ?: 'Pending'
                        );
                        $smsService->sendSMS($smsCustomer->customer_phone, $smsText);
                    }
                }
            } catch (\Exception $smsEx) {
                \Illuminate\Support\Facades\Log::warning('POS order SMS failed: ' . $smsEx->getMessage());
            }

            return response()->json([
                'success' => true,
                'invoice' => $invoiceNumber,
                'message' => 'Sale completed successfully'
            ]);


        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function printReceipt($invoice)
    {
        $sale = \App\Models\Sale::withoutGlobalScope('branch')
            ->with(['items.product.productManagement', 'items.variant', 'posCustomer', 'cashier', 'branch'])
            ->where('invoice_number', $invoice)
            ->firstOrFail();

        $sale->syncStatus();

        $businessName = \App\Models\Setting::getValue(
            'business_name',
            \App\Models\Setting::getValue('system_name', config('app.name', 'HD Group Co. LTD'))
        );
        $businessAddress = \App\Models\Setting::getValue('business_address', $sale->branch?->address ?? '');
        $businessPhone = \App\Models\Setting::getValue('business_phone', $sale->branch?->phone ?? '');
        $businessEmail = \App\Models\Setting::getValue('business_email', $sale->branch?->email ?? '');

        return \Inertia\Inertia::render('Admin/Pos/Receipt', [
            'sale' => [
                'invoice' => $sale->invoice_number,
                'total' => (float) $sale->total_amount,
                'discount' => (float) $sale->discount_amount,
                'tax' => (float) $sale->tax_amount,
                'payable' => (float) $sale->payable_amount,
                'paid' => (float) $sale->amount_paid,
                'balance' => (float) $sale->balance,
                'status' => $sale->payment_status,
                'method' => $sale->payment_method ?? 'Cash',
                'date' => $sale->created_at->format('d/m/Y'),
                'time' => $sale->created_at->format('g:i A'),
                'customer' => $sale->posCustomer?->customer_name ?? 'Walking Customer',
                'cashier' => $sale->cashier?->staff_name ?? 'System',
                'items' => $sale->items->map(function ($i) {
                    $product = $i->product;
                    $pm = $product?->productManagement;

                    return [
                        'name' => $this->cleanProductName($product?->product_name ?? $i->item_name ?? 'Item')
                            . ($i->variant_color ? ' - ' . $i->variant_color : '')
                            . ($i->print_type ? ' [' . ucfirst($i->print_type) . ']' : ''),
                        'qty' => (float) $i->quantity,
                        'price' => (float) $i->unit_price,
                        'subtotal' => (float) ($i->unit_price * $i->quantity),
                        'dimension' => $this->formatReceiptDimension(
                            $pm?->width ? (float) $pm->width : null,
                            $pm?->length ? (float) $pm->length : null,
                            $pm?->dimension_unit
                        ),
                    ];
                }),
            ],
            'company' => [
                'name' => $businessName,
                'address' => $businessAddress,
                'phone' => $businessPhone,
                'email' => $businessEmail,
            ],
            'branch' => [
                'name' => $sale->branch?->system_name ?? $sale->branch?->name,
                'label' => $sale->branch?->name,
                'address' => $sale->branch?->address,
                'phone' => $sale->branch?->phone,
                'email' => $sale->branch?->email,
            ]
        ]);
    }

    public function processReturn(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'items' => 'required|array', // Array of items to return: [{id: sale_item_id, qty: return_qty}]
        ]);

        $originalSale = \App\Models\Sale::with('items')->findOrFail($validated['sale_id']);
        $inventoryService = new \App\Services\InventoryService();
        $returnInvoiceNumber = 'RET-' . strtoupper(substr(uniqid(), -8));

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $returnTotal = 0;

            // 1. Create Return Sale Record
            $returnSale = \App\Models\Sale::create([
                'invoice_number' => $returnInvoiceNumber,
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'customer_id' => $originalSale->customer_id,
                'total_amount' => 0, // Will update after items
                'payable_amount' => 0,
                'payment_method' => $originalSale->payment_method,
                'payment_status' => 'Paid',
                'is_return' => true,
                'returned_from_id' => $originalSale->id,
                'notes' => "Return for Sale " . $originalSale->invoice_number
            ]);

            foreach ($validated['items'] as $returnItem) {
                $saleItem = \App\Models\SaleItem::findOrFail($returnItem['id']);

                // 2. Restock (using the first available store in the branch)
                $targetStore = \App\Models\Store::first(); // Scoped by branch automatically
                if (!$targetStore)
                    throw new \Exception("No active store found for this branch.");

                $inventoryService->adjustInventory(
                    $saleItem->product_id,
                    $returnItem['qty'],
                    $targetStore->id,
                    'increase',
                    'refund',
                    "Return $returnInvoiceNumber",
                    $returnSale->id,
                    'finished_product',
                    'App\Models\Sale'
                );

                // Create negative Sale Item
                $subtotal = -($saleItem->unit_price * $returnItem['qty']);
                \App\Models\SaleItem::create([
                    'sale_id' => $returnSale->id,
                    'product_id' => $saleItem->product_id,
                    'quantity' => -$returnItem['qty'],
                    'unit_price' => $saleItem->unit_price,
                    'subtotal' => $subtotal,
                ]);

                $returnTotal += $subtotal;
            }

            $returnSale->update([
                'total_amount' => $returnTotal,
                'payable_amount' => $returnTotal
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['success' => true, 'message' => 'Return processed successfully']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($invoice)
    {
        $sale = \App\Models\Sale::withoutGlobalScope('branch')
            ->with(['items.product', 'posCustomer', 'cashier', 'payments'])
            ->where('invoice_number', $invoice)
            ->firstOrFail();

        $totalPaid = (float) $sale->payments->sum('amount_paid');
        $balance = (float) $sale->payable_amount - $totalPaid;

        $customerStats = null;
        if ($sale->pos_customer_id) {
            $customerStats = [
                'total_orders' => \App\Models\Sale::where('pos_customer_id', $sale->pos_customer_id)->count(),
                'total_spent' => (float) \App\Models\Sale::where('pos_customer_id', $sale->pos_customer_id)->sum('payable_amount'),
                'recent_sales' => \App\Models\Sale::where('pos_customer_id', $sale->pos_customer_id)
                    ->where('id', '!=', $sale->id)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(fn($s) => [
                        'invoice' => $s->invoice_number,
                        'payable' => (float) $s->payable_amount,
                        'status' => $s->payment_status,
                        'date' => $s->created_at->format('d M Y'),
                    ]),
            ];
        }

        return \Inertia\Inertia::render('Admin/Pos/Show', [
            'sale' => [
                'id' => $sale->id,
                'invoice' => $sale->invoice_number,
                'total' => (float) $sale->total_amount,
                'discount' => (float) $sale->discount_amount,
                'tax' => (float) $sale->tax_amount,
                'payable' => (float) $sale->payable_amount,
                'paid' => $totalPaid,
                'balance' => max(0, $balance),
                'method' => $sale->payment_method ?? 'Cash',
                'status' => $sale->payment_status,
                'notes' => $sale->notes,
                'date' => $sale->created_at->format('d M Y'),
                'time' => $sale->created_at->format('g:i A'),
                'created_at' => $sale->created_at->toISOString(),
                'customer' => $sale->posCustomer,
                'cashier' => $sale->cashier?->staff_name ?? 'System',
                'items' => $sale->items->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $this->cleanProductName($i->product?->product_name ?? $i->item_name),
                    'price' => (float) $i->unit_price,
                    'qty' => (float) $i->quantity,
                    'subtotal' => (float) ($i->unit_price * $i->quantity),
                    'unit' => $i->unit_name ?? 'pcs',
                ]),
                'payments' => $sale->payments->map(fn($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount_paid,
                    'method' => $p->payment_method,
                    'date' => $p->payment_date
                        ? (is_string($p->payment_date)
                            ? \Carbon\Carbon::parse($p->payment_date)->format('d M Y')
                            : $p->payment_date->format('d M Y'))
                        : '—',
                ]),
            ],
            'customerStats' => $customerStats
        ]);
    }

    public function storePayment(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|exists:sales,invoice_number',
            'amount_paid' => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $sale = \App\Models\Sale::where('invoice_number', $validated['invoice_number'])->firstOrFail();
            $totalPaidSoFar = \App\Models\Payment::where('unique_id', $sale->invoice_number)->sum('amount_paid');
            $remainingBalance = $sale->payable_amount - $totalPaidSoFar;

            if ($validated['amount_paid'] > $remainingBalance) {
                return response()->json(['success' => false, 'message' => 'Payment exceeds remaining balance.'], 422);
            }

            // 1. Create Payment Record
            \App\Models\Payment::create([
                'unique_id' => $sale->invoice_number,
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'amount_paid' => $validated['amount_paid'],
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference' => 'POS Payment Update'
            ]);

            // 2. Update Sale Status
            $newTotalPaid = $totalPaidSoFar + $validated['amount_paid'];
            if ($newTotalPaid >= $sale->payable_amount) {
                $sale->update(['payment_status' => 'Paid']);
            } else {
                $sale->update(['payment_status' => 'Partially Paid']);
            }

            // 3. Sync with Loan records if exists
            $loanItems = \App\Models\Loan::where('unique_id', $sale->invoice_number)->get();
            if ($loanItems->count() > 0) {
                $loanTotalPaid = \App\Models\Payment::where('unique_id', $sale->invoice_number)->sum('amount_paid');
                $overallBalance = $sale->payable_amount - $loanTotalPaid;

                foreach ($loanItems as $loan) {
                    $loan->update([
                        'status' => $sale->payment_status,
                        // Update individual items to reflect overall status, 
                        // individual balances are less critical than the overall transaction balance
                    ]);
                }

                // Update the first one with the specific balance info for any legacy logic that looks for it
                $loanItems->first()->update([
                    'amount_paid' => $loanTotalPaid,
                    'balance' => $overallBalance
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['success' => true, 'message' => 'Payment recorded successfully!']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $sale = \App\Models\Sale::findOrFail($id);

        // Optionally restock items if needed, but for now just delete the record
        // (In a real system, you might want to reverse stock movements)

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Delete related loan if exists
            \App\Models\Loan::where('sale_id', $sale->id)->delete();
            $sale->items()->delete();
            $sale->delete();
            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function history(Request $request)
    {
        $branchId = session('active_branch_id') ?? (\Illuminate\Support\Facades\Auth::user()?->branch_id);

        $query = \App\Models\Sale::with(['items.product', 'cashier', 'posCustomer'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        if ($request->filled('search')) {
            $query->where('invoice_number', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            $query->where('payment_status', $request->status);
        }

        if ($request->filled('method')) {
            $query->where('payment_method', $request->input('method'));
        }

        if ($request->filled('start_dt') && $request->filled('end_dt')) {
            $query->whereBetween('created_at', [$request->start_dt . ' 00:00:00', $request->end_dt . ' 23:59:59']);
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        // Summary KPIs (filtered)
        $kloneQ = \App\Models\Sale::when($branchId, fn($q) => $q->where('branch_id', $branchId));
        $todayRevenue = (clone $kloneQ)->whereDate('created_at', today())->sum('payable_amount');
        $totalRevenue = (clone $kloneQ)->sum('payable_amount');
        $totalSales = (clone $kloneQ)->count();
        $unpaidAmount = (clone $kloneQ)->where('payment_status', 'Unpaid')->sum('payable_amount');

        // Map for frontend
        $salesData = $sales->through(function ($s) {
            return [
                'id' => $s->id,
                'invoice' => $s->invoice_number,
                'customer' => $s->posCustomer?->customer_name ?? 'Walking customer',
                'company' => $s->posCustomer?->company_name,
                'cashier' => $s->cashier?->staff_name ?? 'System',
                'items_count' => $s->items->count(),
                'total' => (float) $s->total_amount,
                'discount' => (float) $s->discount_amount,
                'payable' => (float) $s->payable_amount,
                'method' => $s->payment_method ?? 'Cash',
                'status' => $s->payment_status,
                'date' => $s->created_at->format('d M Y'),
                'time' => $s->created_at->format('g:i A'),
                'created_at' => $s->created_at->toISOString(),
            ];
        });

        return \Inertia\Inertia::render('Admin/Pos/History', [
            'sales' => $salesData,
            'kpis' => [
                'today_revenue' => (float) $todayRevenue,
                'total_revenue' => (float) $totalRevenue,
                'total_sales' => $totalSales,
                'unpaid_amount' => (float) $unpaidAmount,
            ],
            'filters' => $request->only(['search', 'status', 'method', 'start_dt', 'end_dt']),
        ]);
    }

    public function returns()
    {
        $branchId = session('active_branch_id') ?? (\Illuminate\Support\Facades\Auth::user()?->branch_id);

        $salesQuery = \App\Models\Sale::where('is_return', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $totalReturnAmount = (clone $salesQuery)->sum('payable_amount');
        $todayReturnAmount = (clone $salesQuery)->whereDate('created_at', today())->sum('payable_amount');
        $totalReturnCount = (clone $salesQuery)->count();

        $sales = $salesQuery->with(['posCustomer', 'cashier', 'items'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($s) {
                return [
                    'id' => $s->id,
                    'invoice' => $s->invoice_number,
                    'customer' => $s->posCustomer?->customer_name ?? 'Walking customer',
                    'cashier' => $s->cashier?->staff_name ?? 'System',
                    'items_count' => $s->items->count(),
                    'payable' => (float) $s->payable_amount,
                    'method' => $s->payment_method ?? 'Cash',
                    'status' => $s->payment_status,
                    'date' => $s->created_at->format('d M Y'),
                    'time' => $s->created_at->format('g:i A'),
                ];
            });

        return \Inertia\Inertia::render('Admin/Pos/Returns', [
            'sales' => $sales,
            'totalReturnAmount' => (float) $totalReturnAmount,
            'todayReturnAmount' => (float) $todayReturnAmount,
            'totalReturnCount' => $totalReturnCount,
        ]);
    }
}