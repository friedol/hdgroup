<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Delivery;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\InventoryService;

class NotificationController extends Controller
{
    public function fetch()
    {
        $user = auth()->user();
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $branchId = session('active_branch_id') ?: $user->branch_id;
        $notifications = [];

        // 1. Incoming Online Orders
        $onlineOrders = Cart::where('status', 'Pending')
            ->latest()
            ->limit(5)
            ->get();

        foreach ($onlineOrders as $order) {
            $notifications[] = [
                'id' => 'order-' . $order->id,
                'type' => 'online_order',
                'title' => 'New Online Order',
                'message' => "Order #{$order->unique_id} for {$order->product_name} requires action.",
                'time' => $order->created_at->diffForHumans(),
                'link' => '/online-orders',
                'priority' => 'high'
            ];
        }

        // 2. Stock Alerts
        $inventoryService = new InventoryService();
        $stockAlerts = DB::table('products')
            ->join('product_managements', 'products.product_management_id', '=', 'product_managements.id')
            ->join('inventories', 'products.id', '=', 'inventories.product_id')
            ->select('products.id', 'products.product_name', 'product_managements.low_stock_threshold', DB::raw('SUM(inventories.qty) as current_qty'))
            ->where('product_managements.low_stock_threshold', '>', 0)
            ->when($branchId && $branchId !== 'all', function($q) use ($branchId) {
                return $q->where('inventories.branch_id', $branchId);
            })
            ->groupBy('products.id', 'products.product_name', 'product_managements.low_stock_threshold')
            ->havingRaw('SUM(inventories.qty) <= product_managements.low_stock_threshold')
            ->limit(5)
            ->get();

        foreach ($stockAlerts as $alert) {
            $notifications[] = [
                'id' => 'stock-' . $alert->id,
                'type' => 'stock_alert',
                'title' => 'Low Stock Warning',
                'message' => "{$alert->product_name} is running low ({$alert->current_qty} left).",
                'time' => 'Just now',
                'link' => '/all-products?tab=low-stock',
                'priority' => 'critical'
            ];
        }

        // 3. Pending Deliveries
        $pendingDeliveries = Delivery::whereIn('status', ['pending', 'assigned'])
            ->when($branchId && $branchId !== 'all', function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })
            ->latest()
            ->limit(5)
            ->get();

        foreach ($pendingDeliveries as $delivery) {
            $notifications[] = [
                'id' => 'delivery-' . $delivery->id,
                'type' => 'delivery',
                'title' => 'Pending Delivery',
                'message' => "Delivery {$delivery->delivery_number} for {$delivery->customer_name} is pending.",
                'time' => $delivery->created_at->diffForHumans(),
                'link' => '/deliveries',
                'priority' => 'medium'
            ];
        }

        return response()->json([
            'notifications' => $notifications,
            'count' => count($notifications)
        ]);
    }
}
