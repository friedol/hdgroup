<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\CustomerProductAnalytic;
use App\Models\CustomerCategoryAnalytic;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CustomerAnalyticsService
{
    /**
     * Recalculate all analytics for a customer
     */
    public function recalculateCustomerAnalytics(int $customerId)
    {
        $customer = Customer::find($customerId);
        if (!$customer) return;

        // Fetch completed sales for the customer
        // Logic: we consider 'Paid' and 'Partially Paid' as completed or valid for analytics
        $sales = Sale::where('customer_id', $customer->id)
            ->orWhere('pos_customer_id', $customer->id)
            ->whereIn('payment_status', ['Paid', 'Partially Paid'])
            ->where('is_return', false)
            ->orderBy('created_at', 'asc')
            ->get();

        if ($sales->isEmpty()) {
            $customer->update([
                'total_orders' => 0,
                'total_spent' => 0,
                'avg_reorder_interval' => null,
                'last_order_date' => null,
                'next_expected_order_date' => null,
                'follow_up_status' => 'New Customer',
                'priority_ranking' => 0,
            ]);
            return;
        }

        $totalOrders = $sales->count();
        $totalSpent = $sales->sum('payable_amount');
        $lastOrderDate = $sales->last()->created_at;

        // Calculate intervals between orders
        $intervals = [];
        for ($i = 1; $i < $totalOrders; $i++) {
            $prevDate = Carbon::parse($sales[$i - 1]->created_at);
            $currDate = Carbon::parse($sales[$i]->created_at);
            $intervals[] = $prevDate->diffInDays($currDate);
        }

        $avgInterval = count($intervals) > 0 
            ? (int)(array_sum($intervals) / count($intervals)) 
            : null;

        // Predict next order date
        $nextExpectedDate = $avgInterval 
            ? Carbon::parse($lastOrderDate)->addDays($avgInterval) 
            : null;

        // Determine status and priority
        $status = $this->determineStatus($nextExpectedDate);
        $priority = $this->calculatePriority($totalSpent, $totalOrders);

        // Update customer
        $customer->update([
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'avg_reorder_interval' => $avgInterval,
            'last_order_date' => $lastOrderDate->toDateString(),
            'next_expected_order_date' => $nextExpectedDate ? $nextExpectedDate->toDateString() : null,
            'follow_up_status' => $status,
            'priority_ranking' => $priority,
        ]);

        // Update detailed analytics
        $this->updateProductAnalytics($customer, $sales);
        $this->updateCategoryAnalytics($customer, $sales);
    }

    /**
     * Determine follow-up status
     */
    public function determineStatus(?string $nextExpectedDate): string
    {
        if (!$nextExpectedDate) return 'New Customer';

        $today = Carbon::today();
        $expected = Carbon::parse($nextExpectedDate)->startOfDay();

        if ($expected->isSameDay($today)) {
            return 'Due Today';
        }
        
        if ($expected->isPast()) {
            return 'Overdue';
        }
        
        if ($expected->diffInDays($today) <= 3) {
            return 'Upcoming';
        }
        
        return 'Active';
    }

    /**
     * Calculate priority ranking
     */
    public function calculatePriority(float $totalSpent, int $totalOrders): int
    {
        // Base score (0) + spent factor (0.5 per 1,000) + order factor (5 per order)
        $spentFactor = floor($totalSpent / 1000) * 0.5;
        $orderFactor = $totalOrders * 5;
        return (int)($spentFactor + $orderFactor);
    }

    /**
     * Update per-product analytics
     */
    protected function updateProductAnalytics(Customer $customer, $sales)
    {
        $productPurchases = [];

        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                if (!$item->product_id) continue;
                
                if (!isset($productPurchases[$item->product_id])) {
                    $productPurchases[$item->product_id] = [];
                }
                
                $productPurchases[$item->product_id][] = [
                    'date' => $sale->created_at,
                    'quantity' => $item->quantity
                ];
            }
        }

        foreach ($productPurchases as $productId => $purchases) {
            $totalQty = array_sum(array_column($purchases, 'quantity'));
            $lastPurchaseDate = Carbon::parse(end($purchases)['date']);
            
            $intervals = [];
            for ($i = 1; $i < count($purchases); $i++) {
                $prevDate = Carbon::parse($purchases[$i - 1]['date']);
                $currDate = Carbon::parse($purchases[$i]['date']);
                $intervals[] = $prevDate->diffInDays($currDate);
            }

            $avgInterval = count($intervals) > 0 
                ? (int)(array_sum($intervals) / count($intervals)) 
                : null;
            $nextExpectedDate = $avgInterval 
                ? Carbon::parse($lastPurchaseDate)->addDays($avgInterval) 
                : null;

            CustomerProductAnalytic::updateOrCreate(
                ['customer_id' => $customer->id, 'product_id' => $productId],
                [
                    'avg_reorder_interval' => $avgInterval,
                    'last_purchase_date' => $lastPurchaseDate->toDateString(),
                    'next_expected_purchase_date' => $nextExpectedDate ? $nextExpectedDate->toDateString() : null,
                    'total_quantity_bought' => $totalQty,
                ]
            );
        }
    }

    /**
     * Update per-category analytics
     */
    protected function updateCategoryAnalytics(Customer $customer, $sales)
    {
        $categoryPurchases = [];

        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $categoryId = $item->product?->category_id;
                if (!$categoryId) continue;
                
                if (!isset($categoryPurchases[$categoryId])) {
                    $categoryPurchases[$categoryId] = [];
                }
                
                $categoryPurchases[$categoryId][] = [
                    'date' => $sale->created_at,
                    'quantity' => $item->quantity
                ];
            }
        }

        foreach ($categoryPurchases as $categoryId => $purchases) {
            $totalQty = array_sum(array_column($purchases, 'quantity'));
            $lastPurchaseDate = Carbon::parse(end($purchases)['date']);
            
            $intervals = [];
            for ($i = 1; $i < count($purchases); $i++) {
                $prevDate = Carbon::parse($purchases[$i - 1]['date']);
                $currDate = Carbon::parse($purchases[$i]['date']);
                $intervals[] = $prevDate->diffInDays($currDate);
            }

            $avgInterval = count($intervals) > 0 
                ? (int)(array_sum($intervals) / count($intervals)) 
                : null;
            $nextExpectedDate = $avgInterval 
                ? Carbon::parse($lastPurchaseDate)->addDays($avgInterval) 
                : null;

            CustomerCategoryAnalytic::updateOrCreate(
                ['customer_id' => $customer->id, 'category_id' => $categoryId],
                [
                    'avg_reorder_interval' => $avgInterval,
                    'last_purchase_date' => $lastPurchaseDate->toDateString(),
                    'next_expected_purchase_date' => $nextExpectedDate ? $nextExpectedDate->toDateString() : null,
                    'total_quantity_bought' => $totalQty,
                ]
            );
        }
    }
}
