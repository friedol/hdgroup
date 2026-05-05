<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Cart;
use App\Models\PromoCode;
use App\Models\PromoCodeUsage;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Traits\AuthenticateTrait;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\OrderConfirmation;
use App\Services\SmsApiService;

class CartController extends Controller
{
    use AuthenticateTrait;

    public function view_all()
    {
        // $redirect = $this->redirectByRole();
        // if ($redirect) {
        //     return $redirect; // Return the redirect response
        // }

        $products = Product::withSum('inventories as total_qty', 'qty')
            ->with([
            'productManagement.images' => function ($query) {
            $query->orderBy('is_featured', 'desc') // Show featured image first
                ->limit(1);
            },
            'productManagement.category',
            'variants'
        ])
            ->orderBy('product_name', 'asc')->limit(12)
            ->get();
        $categories = Category::orderBy('category_name', 'asc')->get();
        return inertia('Shop/Index', compact('products', 'categories'));
    }

    public function add(Request $request, $productId = null)
    {
        // Handle both URL and Body productId
        $productId = $productId ?? $request->productId ?? $request->product_id;

        // Validate the quantity
        $request->validate([
            'quantity' => 'required|integer|min:1|max:100000',
        ]);

        $product = Product::find($productId);

        if (!$product) {
            return back()->with('error', 'Product not found');
        }

        $carts = session()->get('cart', []);

        // Parse the 'data' from the request to get the product price and unit type
        $dataStr = $request->data ?? ($product->product_price . ',' . ($product->feature ?: 'Unit'));
        $parts = explode(',', $dataStr);
        $product_price = (float)($parts[0] ?? $product->product_price);
        $unit_type = $parts[1] ?? ($product->feature ?: 'Unit');
        $color = $request->color ?? null;

        $cartKey = $productId . '_' . $unit_type . ($color ? '_' . $color : '');
        $display_unit_type = $unit_type . ($color ? ' - ' . $color : '');

        if (isset($carts[$cartKey])) {
            $carts[$cartKey]['quantity'] += $request->quantity;
        }
        else {
            $firstImage = null;
            if ($pm = $product->productManagement) {
                $imageObj = $pm->images()->orderBy('is_featured', 'desc')->first();
                $firstImage = $imageObj ? $imageObj->image_url : $pm->image_url;
            }

            $carts[$cartKey] = [
                'id' => $cartKey, // For React 'key' and ID reference
                'product_id' => $product->id,
                'unit_selected' => $display_unit_type,
                'name' => $product->product_name . ($color ? ' (' . $color . ')' : ''),
                'product_number' => $product->product_id,
                'image' => $firstImage,
                'price' => $product_price,
                'quantity' => $request->quantity,
                'color' => $color,
            ];
        }

        session()->put('cart', $carts);
        session()->save();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => 'Item added to cart successfully!',
                'cart' => $carts,
                'total_items' => count($carts)
            ]);
        }

        return back()->with('success', 'Item added to cart!');
    }

    private function getCartTotals(?string $userIdentifier = null)
    {
        $cart = session()->get('cart', []);
        $subtotal = 0;
        $cartItems = [];

        foreach ($cart as $key => $item) {
            $itemSubtotal = $item['price'] * $item['quantity'];
            $subtotal += $itemSubtotal;

            $cartItems[] = [
                'id' => $key,
                'product_id' => $item['product_id'],
                'product_name' => $item['name'],
                'product_image' => $item['image'],
                'price' => (float)$item['price'],
                'quantity' => (int)$item['quantity'],
                'subtotal' => (float)$itemSubtotal,
                'unit' => $item['unit_selected'] ?? 'Unit',
            ];
        }

        $promo = $this->resolveAppliedPromo($subtotal, $userIdentifier);
        $promoDiscount = $promo['discount'] ?? 0;
        $subtotalAfterDiscount = max(0, $subtotal - $promoDiscount);
        $tax = $subtotalAfterDiscount * 0.18; // 18% VAT
        $shippingCost = $subtotalAfterDiscount > 500000 ? 0 : 15000; // Free shipping over 500k
        $total = $subtotalAfterDiscount + $tax + $shippingCost;

        return [
            'cartItems' => $cartItems,
            'subtotal' => round($subtotal, 2),
            'subtotalAfterDiscount' => round($subtotalAfterDiscount, 2),
            'promoDiscount' => round($promoDiscount, 2),
            'appliedPromo' => $promo ? [
                'code' => $promo['promo']->code,
                'discount_type' => $promo['promo']->discount_type,
                'discount_value' => (float) $promo['promo']->discount_value,
            ] : null,
            'tax' => round($tax, 2),
            'shippingCost' => round($shippingCost, 2),
            'total' => round($total, 2),
        ];
    }

    public function showCart()
    {
        return inertia('Shop/Cart', $this->getCartTotals($this->getUserIdentifier()));
    }

    public function removeFromCart($productId)
    {
        $cart = session()->get('cart', []);
        if (isset($cart[$productId])) {
            unset($cart[$productId]);
            session()->put('cart', $cart);
            return back()->with('success', 'Product removed from cart!');
        }
        return back()->with('error', 'Item not found in cart.');
    }

    public function updateCart(Request $request, $id)
    {
        $carts = session()->get('cart', []);

        if (isset($carts[$id])) {
            $quantity = (int)$request->quantity;
            if ($quantity < 1) {
                unset($carts[$id]);
            }
            else {
                $carts[$id]['quantity'] = $quantity;
            }

            session()->put('cart', $carts);
            session()->save();

            return back()->with('success', 'Cart updated!');
        }

        return back()->with('error', 'Item not found');
    }

    public function clearCart()
    {
        session()->forget('cart');
        return back()->with('success', 'Cart cleared!');
    }

    public function checkout()
    {
        $totals = $this->getCartTotals($this->getUserIdentifier());
        if (empty($totals['cartItems'])) {
            return redirect()->route('home')->with('error', 'Your cart is empty.');
        }

        /** @var \App\Models\User|\App\Models\Customer|null $user */
        $user = Auth::user() ?: Auth::guard('customers')->user();
        $guestInfo = session()->get('guest_checkout_info', []);

        return inertia('Shop/Checkout', array_merge($totals, [
            'user' => $user ? [
                'name' => ($user instanceof \App\Models\Customer) ? $user->customer_name : $user->staff_name,
                'email' => ($user instanceof \App\Models\Customer) ? $user->customer_email : $user->staff_email,
                'phone' => ($user instanceof \App\Models\Customer) ? $user->customer_phone : $user->staff_phone,
                'country' => $user->country,
                'city' => $user->location,
                'street' => $user->street,
                'tin_number' => $user->tin_number,
            ] : [
                'name' => $guestInfo['name'] ?? '',
                'email' => $guestInfo['email'] ?? '',
                'phone' => $guestInfo['phone'] ?? '',
                'country' => $guestInfo['country'] ?? 'Tanzania',
                'city' => $guestInfo['city'] ?? '',
                'street' => $guestInfo['street'] ?? '',
                'tin_number' => null,
            ],
        ]));
    }

    public function store_checkout(Request $request)
    {
        $request->validate([
            'firstName' => 'required|string',
            'lastName' => 'nullable|string',
            'country_code' => ['required', 'string', 'regex:/^[1-9][0-9]{0,3}$/'],
            'phone' => ['required', 'string', 'regex:/^[1-9][0-9]{5,14}$/'],
            'email' => 'required|email',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
        ], [
            'phone.regex' => 'Enter phone number without leading 0. Example for +255: 784419707.',
        ]);

        $cart = session()->get('cart', []);
        if (empty($cart)) {
            return redirect()->route('home')->with('error', 'Your cart is empty.');
        }

        $userIdentifier = $this->getUserIdentifier($request);
        $totals = $this->getCartTotals($userIdentifier);

        $uniqueId = 'ORD_' . mt_rand(10000000, 99999999);
        $customerName = trim($request->firstName . ' ' . ($request->lastName ?? ''));
        $formattedPhone = $this->formatCheckoutPhone(
            (string) $request->input('country_code'),
            (string) $request->input('phone')
        );

        foreach ($cart as $item) {
            $row = Cart::create([
                'unique_id' => $uniqueId,
                'product_id' => $item['name'], // Using name as the reference in this specific table structure
                'email' => $request->email,
                'country' => $request->country ?? 'Tanzania',
                'city' => $request->city ?? 'Unknown',
                'street' => $request->address,
                'name' => $customerName,
                'phone_number' => $formattedPhone,
                'product_name' => $item['name'],
                'quantity' => $item['quantity'],
                'qty_checked' => $item['quantity'],
                'selected_image' => $item['image'] ?? 'null',
                'price' => $item['price'],
                'unit_type' => $item['unit_selected'],
                'payment_method' => $request->payment_method ?? 'credit-card',
                'status' => 'Pending',
                'promo_code' => $totals['appliedPromo']['code'] ?? null,
                'promo_discount_total' => 0,
            ]);
        }

        if (($totals['promoDiscount'] ?? 0) > 0 && !empty($totals['appliedPromo']['code'])) {
            $this->applyPromoToPlacedOrder(
                $uniqueId,
                $totals['appliedPromo']['code'],
                (float) $totals['promoDiscount'],
                $userIdentifier
            );
        }

        $user = Auth::user() ?: Auth::guard('customers')->user();
        if ($user) {
            if ($user instanceof \App\Models\Customer) {
                 \App\Models\Customer::whereKey($user->id)->update([
                     'customer_name' => $customerName,
                     'customer_email' => $request->email,
                     'customer_phone' => $formattedPhone,
                     'country' => $request->country,
                     'city' => $request->city,
                     'street' => $request->address,
                 ]);
            } else {
                 \App\Models\User::whereKey($user->id)->update([
                     'staff_name' => $customerName,
                     'staff_email' => $request->email,
                     'staff_phone' => $formattedPhone,
                     'country' => $request->country,
                     'location' => $request->city,
                     'street' => $request->address,
                 ]);
            }
        }

        // Preserve guest checkout details for future prefill and quick tracking.
        session()->put('guest_checkout_info', [
            'name' => $customerName,
            'email' => $request->email,
            'phone' => $formattedPhone,
            'country' => $request->country,
            'city' => $request->city,
            'street' => $request->address,
            'last_order_number' => $uniqueId,
        ]);

        // Prepare data for the email
        $orderData = [
            'order_number' => $uniqueId,
            'created_at' => now()->toIso8601String(),
            'status' => 'Pending',
            'subtotal' => $totals['subtotal'],
            'promo_discount' => $totals['promoDiscount'] ?? 0,
            'tax' => $totals['tax'] ?? 0,
            'shipping_cost' => $totals['shippingCost'] ?? 0,
            'total_amount' => $totals['total'],
            'items' => $totals['cartItems'],
        ];

        // Send confirmation email (required) and SMS (best effort).
        try {
            Mail::to($request->email)->send(new OrderConfirmation($orderData));
        } catch (\Exception $e) {
            Log::error('Order Confirmation Email failed for ' . $uniqueId . ': ' . $e->getMessage());
        }

        try {
            $smsService = new SmsApiService(active_branch_id() ?? session('active_branch_id'));
            $smsItems = collect($totals['cartItems'])->map(fn ($item) => [
                'qty' => (int) ($item['quantity'] ?? 1),
                'name' => (string) ($item['product_name'] ?? 'Item'),
            ])->toArray();
            $smsText = SmsApiService::buildOrderConfirmationSms(
                $customerName,
                $uniqueId,
                $smsItems,
                (float) $totals['total'],
                (string) ($request->payment_method ?? 'Online')
            );
            $smsService->sendSMS($formattedPhone, $smsText);
        } catch (\Exception $smsEx) {
            Log::warning('Order confirmation SMS failed for ' . $uniqueId . ': ' . $smsEx->getMessage());
        }

        session()->forget('cart');
        session()->forget('applied_promo_code');

        return redirect(route('order.confirmation', $uniqueId))->with('success', 'Order placed successfully!');
    }
    public function order_confirmation($uniqueId)
    {
        $orders = Cart::where('unique_id', $uniqueId)->get();
        if ($orders->isEmpty()) {
            return redirect(route('home'))->with('error', 'Order not found.');
        }
        $firstOrder = $orders->first();
        if (!$firstOrder) {
            return redirect()->route('home')->with('error', 'Order not found.');
        }

        $subtotal = $orders->sum(fn($o) => $o->price * $o->quantity);
        $promoDiscount = $orders->sum(fn($o) => (float) ($o->promo_discount_total ?? 0));
        $tax = 0; // Logic for tax if needed
        $shipping = 0; // Logic for shipping if needed

        $orderData = [
            'id' => $firstOrder->id,
            'order_number' => $firstOrder->unique_id,
            'total_amount' => max(0, ($subtotal - $promoDiscount) + $tax + $shipping),
            'subtotal' => $subtotal,
            'promo_discount' => $promoDiscount,
            'tax' => $tax,
            'shipping_cost' => $shipping,
            'status' => $firstOrder->status,
            'payment_status' => 'Pending', // Or logic based on order
            'created_at' => $firstOrder->created_at->toIso8601String(),
            'items' => $orders->map(fn($o) => [
                'product_name' => $o->product_name,
                'price' => (float)$o->price,
                'quantity' => (int)$o->quantity,
                'subtotal' => (float)($o->price * $o->quantity),
                'unit' => $o->unit_type,
            ])->toArray()
        ];

        return inertia('Shop/OrderConfirmation', [
            'order' => $orderData,
            'estimatedDelivery' => '3-5 Business Days',
            'trackingUrl' => route('order.track', $uniqueId),
        ]);
    }

    public function track_order_lookup()
    {
        return inertia('Shop/TrackOrderLookup', [
            'lastOrderNumber' => session('guest_checkout_info.last_order_number'),
        ]);
    }

    public function track_order_submit(Request $request)
    {
        $validated = $request->validate([
            'order_number' => 'required|string|max:60',
        ]);

        return redirect()->route('order.track', trim($validated['order_number']));
    }

    public function track_order($uniqueId)
    {
        $orders = Cart::where('unique_id', $uniqueId)->orderBy('created_at')->get();
        if ($orders->isEmpty()) {
            return redirect()->route('order.track.lookup')->with('error', 'Order not found. Please check the order number and try again.');
        }

        $firstOrder = $orders->first();

        $subtotal = (float) $orders->sum(fn ($item) => ((float) $item->price) * ((int) $item->quantity));

        $status = strtolower((string) ($firstOrder->status ?? 'pending'));
        if ($status === 'complete') {
            $status = 'delivered';
        }

        $order = [
            'id' => $firstOrder->id,
            'order_number' => $uniqueId,
            'total_amount' => $subtotal,
            'status' => $status,
            'payment_status' => ((float) ($firstOrder->amount_paid ?? 0)) > 0 ? 'paid' : 'unpaid',
            'created_at' => optional($firstOrder->created_at)->toIso8601String(),
            'estimatedDelivery' => now()->addDays(3)->toDateString(),
            'items' => $orders->map(fn ($item) => [
                'product_name' => $item->product_name,
                'quantity' => (int) $item->quantity,
                'price' => (float) $item->price,
                'subtotal' => ((float) $item->price) * ((int) $item->quantity),
                'unit' => $item->unit_type,
            ])->toArray(),
        ];

        return inertia('Account/OrderTracking', [
            'order' => $order,
            'isGuestTracking' => true,
        ]);
    }

    public function applyPromo(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:40',
        ]);

        $cart = session()->get('cart', []);
        if (empty($cart)) {
            return back()->with('error', 'Your cart is empty.');
        }

        $subtotal = collect($cart)->sum(fn ($item) => ((float) $item['price']) * ((int) $item['quantity']));
        $code = strtoupper(trim($validated['code']));
        $promo = PromoCode::where('code', $code)->first();

        if (!$promo) {
            return back()->with('error', 'Promo code not found.');
        }

        $validation = $this->validatePromo($promo, $subtotal, $this->getUserIdentifier($request));
        if (!$validation['valid']) {
            return back()->with('error', $validation['message']);
        }

        session()->put('applied_promo_code', $promo->code);

        return back()->with('success', 'Promo code applied successfully.');
    }

    public function removePromo()
    {
        session()->forget('applied_promo_code');

        return back()->with('success', 'Promo code removed.');
    }

    private function getUserIdentifier(?Request $request = null): string
    {
        $user = Auth::user() ?: Auth::guard('customers')->user();
        if ($user) {
            return 'user:' . $user->getAuthIdentifier();
        }

        return 'session:' . ($request?->session()->getId() ?? session()->getId());
    }

    private function formatCheckoutPhone(string $countryCode, string $localPhone): string
    {
        $code = preg_replace('/\D+/', '', $countryCode) ?: '255';
        $local = preg_replace('/\D+/', '', $localPhone) ?: '';

        // Guardrail: local number must not begin with 0 when country code is selected separately.
        if (str_starts_with($local, '0')) {
            $local = ltrim($local, '0');
        }

        return '+' . $code . $local;
    }

    private function resolveAppliedPromo(float $subtotal, ?string $userIdentifier = null): ?array
    {
        $code = session()->get('applied_promo_code');
        if (!$code) {
            return null;
        }

        $promo = PromoCode::where('code', $code)->first();
        if (!$promo) {
            session()->forget('applied_promo_code');
            return null;
        }

        $validation = $this->validatePromo($promo, $subtotal, $userIdentifier ?? $this->getUserIdentifier());
        if (!$validation['valid']) {
            session()->forget('applied_promo_code');
            return null;
        }

        return [
            'promo' => $promo,
            'discount' => round($promo->calculateDiscount($subtotal), 2),
        ];
    }

    private function validatePromo(PromoCode $promo, float $subtotal, string $userIdentifier): array
    {
        if (!$promo->is_active) {
            return ['valid' => false, 'message' => 'This promo code is not active.'];
        }

        $now = now();
        if ($promo->starts_at && $now->lt($promo->starts_at)) {
            return ['valid' => false, 'message' => 'This promo code is not active yet.'];
        }
        if ($promo->expires_at && $now->gt($promo->expires_at)) {
            return ['valid' => false, 'message' => 'This promo code has expired.'];
        }
        if ($promo->min_order_amount && $subtotal < (float) $promo->min_order_amount) {
            return ['valid' => false, 'message' => 'Minimum order amount for this promo was not reached.'];
        }
        if ($promo->usage_limit_global !== null && $promo->used_count >= $promo->usage_limit_global) {
            return ['valid' => false, 'message' => 'This promo code has reached its global usage limit.'];
        }
        if ($promo->usage_limit_per_user !== null) {
            $usedByUser = PromoCodeUsage::where('promo_code_id', $promo->id)
                ->where('user_identifier', $userIdentifier)
                ->count();
            if ($usedByUser >= $promo->usage_limit_per_user) {
                return ['valid' => false, 'message' => 'You have reached your usage limit for this promo code.'];
            }
        }

        return ['valid' => true, 'message' => 'ok'];
    }

    private function applyPromoToPlacedOrder(string $uniqueId, string $promoCode, float $promoDiscount, string $userIdentifier): void
    {
        if ($promoDiscount <= 0) {
            return;
        }

        $promo = PromoCode::where('code', $promoCode)->first();
        if (!$promo) {
            return;
        }

        DB::transaction(function () use ($uniqueId, $promo, $promoDiscount, $userIdentifier) {
            $rows = Cart::where('unique_id', $uniqueId)->get();
            $subtotal = max(0.01, (float) $rows->sum(fn ($row) => $row->price * $row->quantity));
            $remaining = $promoDiscount;

            foreach ($rows as $index => $row) {
                $rowSubtotal = (float) ($row->price * $row->quantity);
                $rowDiscountTotal = $index === ($rows->count() - 1)
                    ? $remaining
                    : round(($rowSubtotal / $subtotal) * $promoDiscount, 2);

                $remaining -= $rowDiscountTotal;
                $unitDiscount = $row->quantity > 0 ? round($rowDiscountTotal / $row->quantity, 2) : 0;

                $row->update([
                    'promo_code' => $promo->code,
                    'promo_discount_total' => max(0, $rowDiscountTotal),
                    'discount' => max(0, $unitDiscount),
                ]);
            }

            PromoCodeUsage::create([
                'promo_code_id' => $promo->id,
                'order_unique_id' => $uniqueId,
                'user_identifier' => $userIdentifier,
            ]);

            $promo->increment('used_count');
        });
    }

    public function product_view($id)
    {
        $product = Product::with([
            'productManagement.images',
            'productManagement.category',
            'variants',
            'reviews',
        ])
        ->withSum(['inventories as total_qty' => function ($q) {
            $q->where('product_type', 'finished_product');
        }], 'qty')
        ->where('id', $id)->first();

        if (!$product) {
            abort(404);
        }

        // Flatten essential metadata for the frontend
        if ($pm = $product->productManagement) {
            $product->setAttribute('description', $pm->description);
            $product->setAttribute('sku', $pm->sku);
            $product->setAttribute('brand', $pm->brand);
        }

        // Fetch related products (e.g., from same category)
        $relatedProducts = Product::where('id', '!=', $id)
            ->whereHas('productManagement', function ($q) use ($product) {
                if ($pm = $product->product_management ?? $product->productManagement) {
                    $q->where('category_id', $pm->category_id);
                }
            })
            ->withSum('inventories as total_qty', 'qty')
            ->with(['productManagement.images'])
            ->limit(4)
            ->get();

        return inertia('Shop/ProductDetail', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'reviews' => $product->reviews,
            'averageRating' => $product->average_rating,
            'reviewCount' => $product->reviews_count,
        ]);
    }

    public function my_orders()
    {
        $user = Auth::user() ?: Auth::guard('customers')->user();

        if (!$user) {
            return redirect()->route('login');
        }

        $phone = $user instanceof \App\Models\Customer ? $user->customer_phone : $user->staff_phone;
        $email = $user instanceof \App\Models\Customer ? $user->customer_email : $user->staff_email;

        $cartGroups = Cart::where(function ($q) use ($phone, $email) {
                if ($phone) $q->orWhere('phone_number', $phone);
                if ($email) $q->orWhere('email', $email);
            })
            ->orderBy('id', 'desc')
            ->get()
            ->groupBy('unique_id');

        $statusMap = [
            'pending'    => 'pending',
            'confirmed'  => 'confirmed',
            'processing' => 'processing',
            'in_transit' => 'in_transit',
            'delivered'  => 'delivered',
            'complete'   => 'delivered',
            'rejected'   => 'rejected',
            'cancelled'  => 'cancelled',
        ];

        $formattedOrders = $cartGroups->map(function ($items, $uniqueId) use ($statusMap) {
            $firstItem  = $items->first();
            $subtotal   = $items->sum(fn($o) => $o->price * $o->quantity);
            $discount   = $items->sum(fn($o) => ($o->discount ?? 0) * $o->quantity);
            $amountPaid = (float) ($firstItem->amount_paid ?? 0);
            $net        = $subtotal - $discount;
            $rawStatus  = strtolower($firstItem->status ?? 'pending');
            $mappedStatus = $statusMap[$rawStatus] ?? 'pending';

            $paymentStatus = 'unpaid';
            if ($amountPaid >= $net - 1 && $amountPaid > 0) {
                $paymentStatus = 'paid';
            } elseif ($amountPaid > 0) {
                $paymentStatus = 'partial';
            }

            return [
                'id'             => $firstItem->id,
                'order_number'   => $uniqueId,
                'total_amount'   => $net,
                'amount_paid'    => $amountPaid,
                'status'         => $mappedStatus,
                'payment_status' => $paymentStatus,
                'created_at'     => $firstItem->created_at->toIso8601String(),
                'items'          => $items->map(fn($o) => [
                    'product_name' => $o->product_name,
                    'quantity'     => (int) $o->quantity,
                    'price'        => (float) $o->price,
                    'image'        => $o->selected_image,
                ])->toArray(),
            ];
        })->values()->toArray();

        return inertia('Account/MyOrders', [
            'orders' => $formattedOrders,
        ]);
    }
}