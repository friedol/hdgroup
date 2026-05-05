<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerFollowUp;
use App\Models\Sale;
use App\Models\Branch;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CustomerFollowUpService
{
    /**
     * Analyze or create follow-up record for a customer in a branch
     */
    public function analyzeCustomer(Customer $customer, Branch $branch): CustomerFollowUp
    {
        // Get or create follow-up record
        $followUp = CustomerFollowUp::firstOrCreate(
            ['customer_id' => $customer->id, 'branch_id' => $branch->id],
            ['is_active' => true]
        );

        // Get customer's sales for this branch
        $sales = Sale::where('customer_id', $customer->id)
            ->orWhere('pos_customer_id', $customer->id)
            ->where('branch_id', $branch->id)
            ->where('is_return', false)
            ->orderBy('created_at', 'asc')
            ->get();

        if ($sales->isEmpty()) {
            // New customer
            $followUp->update([
                'total_orders' => 0,
                'total_spent' => 0,
                'follow_up_status' => 'new',
                'priority_tier' => 'low',
                'priority_score' => 0,
            ]);
            return $followUp;
        }

        // Calculate metrics
        $totalOrders = $sales->count();
        $totalSpent = $sales->sum('payable_amount') ?? $sales->sum('total_amount');
        $lastOrderDate = $sales->last()->created_at->toDateString();
        $frequentlyPurchasedProducts = $this->getFrequentlyPurchasedProducts($sales);

        // Calculate days between orders
        $daysBetweenOrders = [];
        for ($i = 1; $i < count($sales); $i++) {
            $prevDate = $sales[$i - 1]->created_at;
            $currDate = $sales[$i]->created_at;
            $daysBetweenOrders[] = $prevDate->diffInDays($currDate);
        }

        $averageDaysBetweenOrders = !empty($daysBetweenOrders) ? round(collect($daysBetweenOrders)->avg()) : null;
        $reorderCycleDays = $averageDaysBetweenOrders;

        // Predict next order date
        $nextExpectedOrderDate = null;
        if ($reorderCycleDays) {
            $lastSaleDate = Carbon::parse($lastOrderDate);
            $nextExpectedOrderDate = $lastSaleDate->addDays($reorderCycleDays)->toDateString();
        }

        // Calculate priority score (0-100)
        $priorityScore = $this->calculatePriorityScore($totalSpent, $totalOrders, $averageDaysBetweenOrders);
        $priorityTier = $this->getPriorityTier($priorityScore);

        // Determine reorder pattern
        $reorderPattern = $this->getReorderPattern($reorderCycleDays);

        // Update follow-up record
        $followUp->update([
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'average_days_between_orders' => $averageDaysBetweenOrders,
            'last_order_date' => $lastOrderDate,
            'next_expected_order_date' => $nextExpectedOrderDate,
            'reorder_cycle_days' => $reorderCycleDays,
            'reorder_pattern' => $reorderPattern,
            'frequently_purchased_products' => $frequentlyPurchasedProducts,
            'priority_score' => $priorityScore,
            'priority_tier' => $priorityTier,
        ]);

        // Update follow-up status
        $followUp->follow_up_status = $followUp->calculateStatus();
        $followUp->save();

        return $followUp;
    }

    /**
     * Get frequently purchased products (top 5)
     */
    private function getFrequentlyPurchasedProducts(Collection $sales): array
    {
        $products = [];
        
        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $productName = $item->product_name ?? $item->product?->name ?? 'Unknown';
                $products[$productName] = ($products[$productName] ?? 0) + $item->quantity;
            }
        }

        // Sort by quantity and get top 5
        arsort($products);
        return array_slice($products, 0, 5);
    }

    /**
     * Calculate priority score (0-100)
     * Based on spending amount and order frequency
     */
    private function calculatePriorityScore($totalSpent, $totalOrders, $avgDaysBetween): int
    {
        $score = 0;

        // Spending factor (0-40 points)
        if ($totalSpent > 0) {
            // Normalize spending: assume avg customer spends 5000-50000
            $spendingScore = min(40, ($totalSpent / 50000) * 40);
            $score += $spendingScore;
        }

        // Frequency factor (0-40 points)
        if ($totalOrders > 0) {
            // More orders = higher score
            $frequencyScore = min(40, ($totalOrders / 20) * 40);
            $score += $frequencyScore;
        }

        // Recency factor (0-20 points)
        if ($avgDaysBetween) {
            // Shorter cycles = higher score (more frequent = more valuable)
            $recencyScore = min(20, (30 / $avgDaysBetween) * 20);
            $score += $recencyScore;
        }

        return (int) $score;
    }

    /**
     * Get priority tier based on score
     */
    private function getPriorityTier($score): string
    {
        if ($score >= 70) {
            return 'high';
        } elseif ($score >= 40) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Get reorder pattern description
     */
    private function getReorderPattern($days): ?string
    {
        if (!$days) {
            return null;
        }

        if ($days < 7) {
            return 'weekly';
        } elseif ($days < 15) {
            return '14_days';
        } elseif ($days < 30) {
            return 'monthly';
        } elseif ($days < 90) {
            return 'quarterly';
        }
        return 'occasional';
    }

    /**
     * Get customers due for follow-up today
     */
    public function getCustomersDueToday(Branch $branch)
    {
        return CustomerFollowUp::where('branch_id', $branch->id)
            ->active()
            ->where('follow_up_status', 'due')
            ->orderBy('priority_score', 'desc')
            ->with('customer')
            ->get();
    }

    /**
     * Get overdue customers
     */
    public function getOverdueCustomers(Branch $branch)
    {
        return CustomerFollowUp::where('branch_id', $branch->id)
            ->active()
            ->where('follow_up_status', 'overdue')
            ->orderBy('priority_score', 'desc')
            ->with('customer')
            ->get();
    }

    /**
     * Get high-priority customers for the branch
     */
    public function getHighPriorityCustomers(Branch $branch, $limit = 20)
    {
        return CustomerFollowUp::where('branch_id', $branch->id)
            ->active()
            ->highPriority()
            ->orderBy('priority_score', 'desc')
            ->limit($limit)
            ->with('customer')
            ->get();
    }

    /**
     * Get daily follow-up list (customers to contact today)
     */
    public function getDailyFollowUpList(Branch $branch)
    {
        // Combine all customers who need follow-up today
        $dueToday = $this->getCustomersDueToday($branch);
        $overdue = $this->getOverdueCustomers($branch);

        // Merge and sort by priority score
        $combined = $dueToday->merge($overdue)
            ->unique('id')
            ->sortByDesc('priority_score')
            ->values();

        return $combined;
    }

    /**
     * Update customer follow-up after a sale
     */
    public function updateAfterSale(Sale $sale)
    {
        $customer = $sale->posCustomer ?? $sale->customer;
        $branch = $sale->branch;

        if (!$customer || !$branch) {
            return;
        }

        // Reanalyze the customer
        $this->analyzeCustomer($customer, $branch);
    }

    /**
     * Record a follow-up activity
     */
    public function recordActivity(
        CustomerFollowUp $followUp,
        $type, // call, whatsapp, email, sms, in_person
        $notes,
        $outcome = null,
        $resultedInSale = false,
        $saleAmount = null,
        $nextFollowUpDate = null,
        $nextFollowUpNotes = null
    ) {
        $activity = $followUp->activities()->create([
            'customer_id' => $followUp->customer_id,
            'branch_id' => $followUp->branch_id,
            'user_id' => auth()->id(),
            'activity_type' => $type,
            'notes' => $notes,
            'outcome' => $outcome,
            'resulted_in_sale' => $resultedInSale,
            'sale_amount' => $saleAmount,
            'next_follow_up_date' => $nextFollowUpDate,
            'next_follow_up_notes' => $nextFollowUpNotes,
            'activity_date' => now(),
        ]);

        // Update follow-up record
        $followUp->update([
            'last_follow_up_date' => now(),
            'follow_up_count' => $followUp->follow_up_count + 1,
        ]);

        // Update manual follow-up date if provided
        if ($nextFollowUpDate) {
            $followUp->update([
                'manual_follow_up_date' => $nextFollowUpDate,
                'manual_follow_up_notes' => $nextFollowUpNotes,
            ]);
        }

        return $activity;
    }

    /**
     * Sync all customers for a branch
     * Run this periodically or after bulk sales
     */
    public function syncBranchCustomers(Branch $branch)
    {
        $customers = Customer::where('branch_id', $branch->id)
            ->whereHas('sales', function ($q) use ($branch) {
                $q->where('branch_id', $branch->id)->where('is_return', false);
            })
            ->get();

        foreach ($customers as $customer) {
            $this->analyzeCustomer($customer, $branch);
        }

        return $customers->count();
    }

    /**
     * Get analytics dashboard data
     */
    public function getAnalyticsDashboard(Branch $branch)
    {
        $customers = CustomerFollowUp::where('branch_id', $branch->id)
            ->active()
            ->get();

        return [
            'total_active_customers' => $customers->count(),
            'due_today' => $customers->where('follow_up_status', 'due')->count(),
            'overdue' => $customers->where('follow_up_status', 'overdue')->count(),
            'high_priority' => $customers->where('priority_tier', 'high')->count(),
            'total_customer_value' => $customers->sum('total_spent'),
            'avg_customer_value' => $customers->avg('total_spent'),
            'avg_reorder_cycle' => $customers->avg('reorder_cycle_days'),
        ];
    }
}
