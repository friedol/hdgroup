<?php 

use App\Models\Cart;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

Route::get('/latest-order', function (Request $request) {
    // $latestOrder = Cart::latest()->first();
    $latestOrder = Cart::orderBy('id', 'desc')->first();

    // Debugging: Log if no order is found
    if (!$latestOrder) {
        Log::info('No orders found.');
        return response()->json(null);
    }

    // Get the last notified order ID
    $lastNotifiedId = Cache::get('last_notified_order', 0);

    Log::info('Latest Order ID: ' . $latestOrder->id . ', Last Notified ID: ' . $lastNotifiedId);

    // Check if the latest order is new
    if ($latestOrder->id > $lastNotifiedId) {
        Cache::put('last_notified_order', $latestOrder->id, now()->addMinutes(5));
        return response()->json($latestOrder);
    }

    return response()->json(null);
});

Route::get('/notifications/fetch', [\App\Http\Controllers\NotificationController::class, 'fetch'])->middleware('auth')->name('notifications.fetch');
