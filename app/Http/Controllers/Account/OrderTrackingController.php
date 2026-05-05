<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderTrackingController extends Controller
{
    public function show($order_number)
    {
        $user = Auth::guard('customers')->user() ?: Auth::user();

        abort_unless($user, 403);

        $phone = $user instanceof \App\Models\Customer
            ? $user->customer_phone
            : $user->staff_phone;

        $items = Cart::where('unique_id', $order_number)
            ->where('phone_number', $phone)
            ->orderBy('id')
            ->get();

        abort_if($items->isEmpty(), 404);

        $firstItem = $items->first();
        $subtotal = (float) $items->sum(fn ($item) => ((float) $item->price) * ((int) $item->quantity));

        $order = [
            'id' => $firstItem->id,
            'order_number' => $order_number,
            'total_amount' => $subtotal,
            'status' => strtolower((string) ($firstItem->status ?? 'pending')) === 'complete' ? 'delivered' : strtolower((string) ($firstItem->status ?? 'pending')),
            'payment_status' => ((float) ($firstItem->amount_paid ?? 0)) > 0 ? 'paid' : 'unpaid',
            'created_at' => optional($firstItem->created_at)->toIso8601String(),
            'estimatedDelivery' => now()->addDays(3)->toDateString(),
            'items' => $items->map(fn ($item) => [
                'product_name' => $item->product_name,
                'quantity' => (int) $item->quantity,
                'price' => (float) $item->price,
                'subtotal' => ((float) $item->price) * ((int) $item->quantity),
                'unit' => $item->unit_type,
            ])->toArray(),
        ];

        return Inertia::render('Account/OrderTracking', [
            'order' => $order,
        ]);
    }
}
