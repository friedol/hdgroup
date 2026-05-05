<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Loan;

class CustomerIntelligenceController extends Controller
{
    public function dashboard()
    {
        return \Inertia\Inertia::render('Admin/CustomerIntelligence/Dashboard');
    }

    public function getCustomerSegments()
    {
        $customers = Customer::with(['sales.items', 'loans'])
            ->whereHas('sales')
            ->get();

        $segments = [
            'high_value' => [],
            'medium_value' => [],
            'at_risk' => [],
            'new' => []
        ];

        foreach ($customers as $customer) {
            $clv = $this->calculateCustomerLifetimeValue($customer);
            $purchaseFrequency = $this->calculatePurchaseFrequency($customer);
            $retentionRisk = $this->calculateRetentionRisk($customer);
            $daysSinceLastPurchase = $this->getDaysSinceLastPurchase($customer);

            $segment = $this->determineCustomerSegment($clv, $purchaseFrequency, $retentionRisk, $daysSinceLastPurchase);
            
            $segments[$segment][] = [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'phone' => $customer->phone,
                'clv' => $clv,
                'purchase_frequency' => $purchaseFrequency,
                'retention_risk' => $retentionRisk,
                'days_since_last_purchase' => $daysSinceLastPurchase,
                'total_orders' => $customer->sales->count(),
                'total_spent' => $customer->sales->sum('total_amount'),
                'avg_order_value' => $customer->sales->avg('total_amount'),
                'credit_score' => $this->calculateCreditScore($customer),
                'vip_status' => $this->determineVIPStatus($clv, $purchaseFrequency),
                'discount_behavior' => $this->analyzeDiscountBehavior($customer)
            ];
        }

        // Sort each segment by CLV
        foreach ($segments as $segment => &$customers) {
            usort($customers, function($a, $b) {
                return $b['clv'] <=> $a['clv'];
            });
        }

        return response()->json($segments);
    }

    public function getCustomerLifetimeValueAnalysis()
    {
        $customers = Customer::with(['sales.items'])
            ->whereHas('sales')
            ->get()
            ->map(function ($customer) {
                $clv = $this->calculateCustomerLifetimeValue($customer);
                $purchaseFrequency = $this->calculatePurchaseFrequency($customer);
                $avgOrderValue = $customer->sales->avg('total_amount');
                $customerAge = $this->getCustomerAge($customer);

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'clv' => $clv,
                    'clv_category' => $this->categorizeCLV($clv),
                    'purchase_frequency' => $purchaseFrequency,
                    'avg_order_value' => $avgOrderValue,
                    'customer_age_days' => $customerAge,
                    'projected_annual_value' => $this->projectAnnualValue($clv, $customerAge),
                    'retention_probability' => $this->calculateRetentionProbability($customer),
                    'churn_risk' => $this->calculateChurnRisk($customer)
                ];
            })
            ->sortByDesc('clv')
            ->values();

        return response()->json($customers);
    }

    public function getPurchaseFrequencyAnalysis()
    {
        $frequencyAnalysis = DB::table('customers as c')
            ->join('sales as s', 'c.id', '=', 's.customer_id')
            ->selectRaw('
                c.id,
                c.name,
                COUNT(s.id) as total_orders,
                MIN(s.created_at) as first_purchase_date,
                MAX(s.created_at) as last_purchase_date,
                DATEDIFF(MAX(s.created_at), MIN(s.created_at)) as customer_lifespan_days,
                AVG(s.total_amount) as avg_order_value,
                SUM(s.total_amount) as total_spent
            ')
            ->groupBy('c.id', 'c.name')
            ->having('total_orders', '>', 1)
            ->get()
            ->map(function ($customer) {
                $purchaseFrequency = $customer->customer_lifespan_days > 0 
                    ? ($customer->total_orders / $customer->customer_lifespan_days) * 30 // Monthly frequency
                    : 0;

                $frequencyScore = $this->calculateFrequencyScore($purchaseFrequency);
                $loyaltyStatus = $this->determineLoyaltyStatus($purchaseFrequency, $customer->total_orders);

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'total_orders' => $customer->total_orders,
                    'purchase_frequency_per_month' => round($purchaseFrequency, 2),
                    'frequency_score' => $frequencyScore,
                    'loyalty_status' => $loyaltyStatus,
                    'avg_order_value' => $customer->avg_order_value,
                    'total_spent' => $customer->total_spent,
                    'customer_lifespan_days' => $customer->customer_lifespan_days,
                    'days_since_last_purchase' => $this->calculateDaysSince($customer->last_purchase_date),
                    'predicted_next_purchase' => $this->predictNextPurchaseDate($purchaseFrequency)
                ];
            })
            ->sortByDesc('purchase_frequency_per_month')
            ->values();

        return response()->json($frequencyAnalysis);
    }

    public function getRetentionRiskAnalysis()
    {
        $atRiskCustomers = Customer::with(['sales'])
            ->whereHas('sales')
            ->get()
            ->filter(function ($customer) {
                return $this->calculateRetentionRisk($customer) > 0.3; // Risk threshold
            })
            ->map(function ($customer) {
                $retentionRisk = $this->calculateRetentionRisk($customer);
                $daysSinceLastPurchase = $this->getDaysSinceLastPurchase($customer);
                $purchaseFrequency = $this->calculatePurchaseFrequency($customer);
                $clv = $this->calculateCustomerLifetimeValue($customer);

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'phone' => $customer->phone,
                    'retention_risk' => $retentionRisk,
                    'risk_level' => $this->categorizeRisk($retentionRisk),
                    'days_since_last_purchase' => $daysSinceLastPurchase,
                    'purchase_frequency' => $purchaseFrequency,
                    'clv' => $clv,
                    'risk_factors' => $this->identifyRiskFactors($customer),
                    'recommended_actions' => $this->generateRetentionActions($retentionRisk, $clv),
                    'intervention_priority' => $this->calculateInterventionPriority($retentionRisk, $clv)
                ];
            })
            ->sortByDesc('retention_risk')
            ->values();

        return response()->json($atRiskCustomers);
    }

    public function getVIPCustomers()
    {
        $vipCustomers = Customer::with(['sales.items'])
            ->whereHas('sales')
            ->get()
            ->filter(function ($customer) {
                return $this->determineVIPStatus(
                    $this->calculateCustomerLifetimeValue($customer),
                    $this->calculatePurchaseFrequency($customer)
                ) !== 'Regular';
            })
            ->map(function ($customer) {
                $clv = $this->calculateCustomerLifetimeValue($customer);
                $purchaseFrequency = $this->calculatePurchaseFrequency($customer);
                $vipStatus = $this->determineVIPStatus($clv, $purchaseFrequency);

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'phone' => $customer->phone,
                    'vip_status' => $vipStatus,
                    'clv' => $clv,
                    'purchase_frequency' => $purchaseFrequency,
                    'total_orders' => $customer->sales->count(),
                    'total_spent' => $customer->sales->sum('total_amount'),
                    'avg_order_value' => $customer->sales->avg('total_amount'),
                    'loyalty_years' => $this->getCustomerAge($customer) / 365,
                    'preferred_products' => $this->getPreferredProducts($customer),
                    'benefits_eligible' => $this->getVIPBenefits($vipStatus),
                    'next_tier_requirement' => $this->getNextTierRequirements($vipStatus, $clv, $purchaseFrequency)
                ];
            })
            ->sortByDesc('clv')
            ->values();

        return response()->json($vipCustomers);
    }

    public function getDiscountBehaviorAnalysis()
    {
        $discountAnalysis = DB::table('customers as c')
            ->join('sales as s', 'c.id', '=', 's.customer_id')
            ->leftJoin('sale_items as si', 's.id', '=', 'si.sale_id')
            ->selectRaw('
                c.id,
                c.name,
                COUNT(s.id) as total_orders,
                COUNT(CASE WHEN s.discount_amount > 0 THEN 1 END) as orders_with_discount,
                AVG(s.discount_amount) as avg_discount_amount,
                AVG(s.discount_percentage) as avg_discount_percentage,
                SUM(s.discount_amount) as total_discount_received,
                SUM(s.total_amount) as total_spent
            ')
            ->groupBy('c.id', 'c.name')
            ->having('total_orders', '>', 0)
            ->get()
            ->map(function ($customer) {
                $discountUsageRate = $customer->total_orders > 0 
                    ? ($customer->orders_with_discount / $customer->total_orders) * 100 
                    : 0;

                $discountDependency = $this->calculateDiscountDependency($discountUsageRate, $customer->avg_discount_percentage);
                $priceSensitivity = $this->calculatePriceSensitivity($customer);

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'total_orders' => $customer->total_orders,
                    'orders_with_discount' => $customer->orders_with_discount,
                    'discount_usage_rate' => round($discountUsageRate, 2),
                    'avg_discount_amount' => $customer->avg_discount_amount,
                    'avg_discount_percentage' => $customer->avg_discount_percentage,
                    'total_discount_received' => $customer->total_discount_received,
                    'discount_dependency' => $discountDependency,
                    'price_sensitivity' => $priceSensitivity,
                    'discount_behavior_type' => $this->categorizeDiscountBehavior($discountUsageRate, $customer->avg_discount_percentage),
                    'optimal_discount_strategy' => $this->recommendDiscountStrategy($discountDependency, $priceSensitivity)
                ];
            })
            ->sortByDesc('discount_usage_rate')
            ->values();

        return response()->json($discountAnalysis);
    }

    public function getCreditRiskAnalysis()
    {
        $creditAnalysis = Customer::with(['loans', 'sales'])
            ->whereHas('loans')
            ->get()
            ->map(function ($customer) {
                $creditScore = $this->calculateCreditScore($customer);
                $creditRisk = $this->calculateCreditRisk($customer);
                $paymentHistory = $this->analyzePaymentHistory($customer);
                $debtToIncomeRatio = $this->calculateDebtToIncomeRatio($customer);

                return [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'credit_score' => $creditScore,
                    'credit_rating' => $this->getCreditRating($creditScore),
                    'credit_risk_level' => $creditRisk,
                    'payment_history_score' => $paymentHistory['score'],
                    'on_time_payment_rate' => $paymentHistory['on_time_rate'],
                    'late_payment_count' => $paymentHistory['late_count'],
                    'debt_to_income_ratio' => $debtToIncomeRatio,
                    'total_outstanding_loans' => $customer->loans->where('status', 'active')->sum('amount'),
                    'credit_limit_recommendation' => $this->recommendCreditLimit($creditScore, $debtToIncomeRatio),
                    'risk_factors' => $this->identifyCreditRiskFactors($customer),
                    'mitigation_strategies' => $this->generateCreditMitigationStrategies($creditRisk)
                ];
            })
            ->sortBy('credit_risk_level')
            ->values();

        return response()->json($creditAnalysis);
    }

    public function getCustomerIntelligenceSummary()
    {
        $summary = [
            'total_customers' => Customer::count(),
            'active_customers' => Customer::whereHas('sales')->count(),
            'vip_customers' => $this->getVIPCustomers()->getData()->count(),
            'at_risk_customers' => $this->getRetentionRiskAnalysis()->getData()->count(),
            'average_clv' => $this->calculateAverageCLV(),
            'top_segments' => $this->getTopPerformingSegments(),
            'retention_metrics' => $this->calculateRetentionMetrics(),
            'credit_risk_distribution' => $this->getCreditRiskDistribution(),
            'opportunities' => $this->identifyGrowthOpportunities(),
            'alerts' => $this->generateCustomerAlerts()
        ];

        return response()->json($summary);
    }

    // Helper methods
    private function calculateCustomerLifetimeValue($customer)
    {
        $totalSpent = $customer->sales->sum('total_amount');
        $totalOrders = $customer->sales->count();
        $avgOrderValue = $totalOrders > 0 ? $totalSpent / $totalOrders : 0;
        $purchaseFrequency = $this->calculatePurchaseFrequency($customer);
        $customerLifespan = $this->getCustomerAge($customer);

        // CLV = Average Order Value × Purchase Frequency × Customer Lifespan
        return $avgOrderValue * $purchaseFrequency * ($customerLifespan / 365);
    }

    private function calculatePurchaseFrequency($customer)
    {
        $totalOrders = $customer->sales->count();
        $customerAge = $this->getCustomerAge($customer);

        return $customerAge > 0 ? ($totalOrders / $customerAge) * 30 : 0; // Monthly frequency
    }

    private function calculateRetentionRisk($customer)
    {
        $daysSinceLastPurchase = $this->getDaysSinceLastPurchase($customer);
        $purchaseFrequency = $this->calculatePurchaseFrequency($customer);
        $totalOrders = $customer->sales->count();

        // Risk factors: long time since last purchase, low frequency, few orders
        $timeRisk = min(1, $daysSinceLastPurchase / 180); // Max risk at 180 days
        $frequencyRisk = $purchaseFrequency < 0.5 ? 0.5 : 0; // Low frequency increases risk
        $orderRisk = $totalOrders < 3 ? 0.3 : 0; // Few orders increases risk

        return min(1, ($timeRisk + $frequencyRisk + $orderRisk) / 3);
    }

    private function getDaysSinceLastPurchase($customer)
    {
        $lastPurchase = $customer->sales->max('created_at');
        return $lastPurchase ? Carbon::parse($lastPurchase)->diffInDays(now()) : 999;
    }

    private function getCustomerAge($customer)
    {
        $firstPurchase = $customer->sales->min('created_at');
        return $firstPurchase ? Carbon::parse($firstPurchase)->diffInDays(now()) : 0;
    }

    private function determineCustomerSegment($clv, $purchaseFrequency, $retentionRisk, $daysSinceLastPurchase)
    {
        if ($clv > 1000000 && $purchaseFrequency > 2) {
            return 'high_value';
        } elseif ($clv > 200000 && $purchaseFrequency > 0.5) {
            return 'medium_value';
        } elseif ($retentionRisk > 0.5 || $daysSinceLastPurchase > 90) {
            return 'at_risk';
        } elseif ($this->getCustomerAge(Customer::find($customer->id)) < 30) {
            return 'new';
        }
        
        return 'medium_value';
    }

    private function calculateCreditScore($customer)
    {
        $paymentHistory = $this->analyzePaymentHistory($customer);
        $debtToIncome = $this->calculateDebtToIncomeRatio($customer);
        $customerAge = $this->getCustomerAge($customer);
        $totalOrders = $customer->sales->count();

        // Simplified credit scoring
        $paymentScore = $paymentHistory['score'] * 0.4;
        $debtScore = max(0, (100 - $debtToIncome)) * 0.3;
        $ageScore = min(100, ($customerAge / 365) * 20) * 0.2; // Max 20 points for age
        $orderScore = min(100, $totalOrders * 5) * 0.1; // Max 10 points for orders

        return round($paymentScore + $debtScore + $ageScore + $orderScore);
    }

    private function analyzePaymentHistory($customer)
    {
        $loans = $customer->loans;
        $totalLoans = $loans->count();
        $onTimePayments = $loans->where('status', 'paid')->count();
        $latePayments = $loans->where('status', 'overdue')->count();

        $onTimeRate = $totalLoans > 0 ? ($onTimePayments / $totalLoans) * 100 : 100;
        $score = $onTimeRate; // Simplified scoring

        return [
            'score' => $score,
            'on_time_rate' => $onTimeRate,
            'late_count' => $latePayments
        ];
    }

    private function calculateDebtToIncomeRatio($customer)
    {
        $monthlyIncome = $this->estimateMonthlyIncome($customer);
        $totalDebt = $customer->loans->where('status', 'active')->sum('amount');

        return $monthlyIncome > 0 ? ($totalDebt / $monthlyIncome) * 100 : 100;
    }

    private function estimateMonthlyIncome($customer)
    {
        // Estimate based on purchase patterns
        $avgMonthlySpending = $customer->sales()
            ->where('created_at', '>=', Carbon::now()->subMonths(6))
            ->avg('total_amount') ?? 0;

        return $avgMonthlySpending * 2; // Assume income is 2x spending
    }

    private function determineVIPStatus($clv, $purchaseFrequency)
    {
        if ($clv > 2000000 && $purchaseFrequency > 4) {
            return 'Platinum';
        } elseif ($clv > 1000000 && $purchaseFrequency > 2) {
            return 'Gold';
        } elseif ($clv > 500000 && $purchaseFrequency > 1) {
            return 'Silver';
        }
        
        return 'Regular';
    }

    private function categorizeCLV($clv)
    {
        if ($clv > 2000000) return 'Very High';
        if ($clv > 1000000) return 'High';
        if ($clv > 500000) return 'Medium';
        if ($clv > 100000) return 'Low';
        return 'Very Low';
    }

    private function categorizeRisk($risk)
    {
        if ($risk > 0.7) return 'High';
        if ($risk > 0.4) return 'Medium';
        return 'Low';
    }

    private function getCreditRating($score)
    {
        if ($score >= 800) return 'Excellent';
        if ($score >= 700) return 'Good';
        if ($score >= 600) return 'Fair';
        return 'Poor';
    }

    private function calculateAverageCLV()
    {
        $customers = Customer::with(['sales'])->whereHas('sales')->get();
        $totalCLV = 0;
        
        foreach ($customers as $customer) {
            $totalCLV += $this->calculateCustomerLifetimeValue($customer);
        }
        
        return $customers->count() > 0 ? $totalCLV / $customers->count() : 0;
    }

    private function identifyRiskFactors($customer)
    {
        $factors = [];
        
        if ($this->getDaysSinceLastPurchase($customer) > 90) {
            $factors[] = 'No purchase in 90+ days';
        }
        
        if ($this->calculatePurchaseFrequency($customer) < 0.5) {
            $factors[] = 'Low purchase frequency';
        }
        
        if ($customer->sales->count() < 3) {
            $factors[] = 'Few total orders';
        }
        
        return $factors;
    }

    private function generateRetentionActions($risk, $clv)
    {
        $actions = [];
        
        if ($risk > 0.7) {
            $actions[] = 'Immediate outreach required';
            $actions[] = 'Special discount offer';
        } elseif ($risk > 0.4) {
            $actions[] = 'Scheduled follow-up call';
            $actions[] = 'Loyalty program invitation';
        }
        
        if ($clv > 500000) {
            $actions[] = 'Personalized service offer';
        }
        
        return $actions;
    }

    private function calculateInterventionPriority($risk, $clv)
    {
        if ($risk > 0.7 && $clv > 500000) return 'Critical';
        if ($risk > 0.5 && $clv > 200000) return 'High';
        if ($risk > 0.3) return 'Medium';
        return 'Low';
    }

    private function analyzeDiscountBehavior($customer)
    {
        $totalOrders = $customer->sales->count();
        $discountOrders = $customer->sales->where('discount_amount', '>', 0)->count();
        
        return [
            'usage_rate' => $totalOrders > 0 ? ($discountOrders / $totalOrders) * 100 : 0,
            'avg_discount' => $customer->sales->avg('discount_percentage') ?? 0
        ];
    }

    private function calculateDiscountDependency($usageRate, $avgDiscount)
    {
        return ($usageRate * 0.6) + ($avgDiscount * 0.4);
    }

    private function calculatePriceSensitivity($customer)
    {
        // Simplified price sensitivity based on discount usage
        $discountBehavior = $this->analyzeDiscountBehavior($customer);
        return $discountBehavior['usage_rate'];
    }

    private function categorizeDiscountBehavior($usageRate, $avgDiscount)
    {
        if ($usageRate > 70 && $avgDiscount > 15) return 'Highly Dependent';
        if ($usageRate > 50) return 'Discount Seeking';
        if ($usageRate > 20) return 'Opportunistic';
        return 'Price Insensitive';
    }

    private function recommendDiscountStrategy($dependency, $sensitivity)
    {
        if ($dependency > 70) return 'Loyalty rewards instead of discounts';
        if ($sensitivity > 60) return 'Targeted promotions only';
        return 'Standard discount policy';
    }

    private function getPreferredProducts($customer)
    {
        return $customer->sales()
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->selectRaw('products.name, SUM(sale_items.quantity) as total_quantity')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_quantity')
            ->limit(3)
            ->get();
    }

    private function getVIPBenefits($status)
    {
        $benefits = [
            'Platinum' => ['Exclusive discounts', 'Priority service', 'Free delivery', 'Personal manager'],
            'Gold' => ['Special discounts', 'Priority service', 'Free delivery'],
            'Silver' => ['Member discounts', 'Early access to sales'],
            'Regular' => ['Standard benefits']
        ];
        
        return $benefits[$status] ?? [];
    }

    private function getNextTierRequirements($currentStatus, $clv, $frequency)
    {
        $requirements = [
            'Regular' => 'Reach TZS 500,000 CLV and 1+ monthly purchases',
            'Silver' => 'Reach TZS 1,000,000 CLV and 2+ monthly purchases',
            'Gold' => 'Reach TZS 2,000,000 CLV and 4+ monthly purchases'
        ];
        
        return $requirements[$currentStatus] ?? 'You are at the highest tier!';
    }

    private function calculateFrequencyScore($frequency)
    {
        if ($frequency > 4) return 100;
        if ($frequency > 2) return 80;
        if ($frequency > 1) return 60;
        if ($frequency > 0.5) return 40;
        return 20;
    }

    private function determineLoyaltyStatus($frequency, $totalOrders)
    {
        if ($frequency > 3 && $totalOrders > 20) return 'Loyal';
        if ($frequency > 1 && $totalOrders > 10) return 'Regular';
        if ($frequency > 0.5 && $totalOrders > 5) return 'Occasional';
        return 'New';
    }

    private function calculateDaysSince($date)
    {
        return $date ? Carbon::parse($date)->diffInDays(now()) : 0;
    }

    private function predictNextPurchaseDate($frequency)
    {
        if ($frequency <= 0) return null;
        
        $daysBetweenPurchases = 30 / $frequency; // Average days between purchases
        return now()->addDays($daysBetweenPurchases)->format('Y-m-d');
    }

    private function projectAnnualValue($clv, $customerAgeDays)
    {
        if ($customerAgeDays <= 0) return 0;
        
        $dailyValue = $clv / $customerAgeDays;
        return $dailyValue * 365;
    }

    private function calculateRetentionProbability($customer)
    {
        $risk = $this->calculateRetentionRisk($customer);
        return max(0, min(100, (1 - $risk) * 100));
    }

    private function calculateChurnRisk($customer)
    {
        return $this->calculateRetentionRisk($customer) * 100;
    }

    private function calculateCreditRisk($customer)
    {
        $creditScore = $this->calculateCreditScore($customer);
        
        if ($creditScore >= 750) return 'Low';
        if ($creditScore >= 650) return 'Medium';
        return 'High';
    }

    private function recommendCreditLimit($creditScore, $debtToIncome)
    {
        if ($creditScore >= 750 && $debtToIncome < 30) return 1000000;
        if ($creditScore >= 650 && $debtToIncome < 40) return 500000;
        if ($creditScore >= 550) return 250000;
        return 100000;
    }

    private function identifyCreditRiskFactors($customer)
    {
        $factors = [];
        
        $paymentHistory = $this->analyzePaymentHistory($customer);
        if ($paymentHistory['on_time_rate'] < 80) {
            $factors[] = 'Poor payment history';
        }
        
        $debtToIncome = $this->calculateDebtToIncomeRatio($customer);
        if ($debtToIncome > 50) {
            $factors[] = 'High debt-to-income ratio';
        }
        
        if ($this->getCustomerAge($customer) < 90) {
            $factors[] = 'Limited credit history';
        }
        
        return $factors;
    }

    private function generateCreditMitigationStrategies($risk)
    {
        $strategies = [];
        
        switch ($risk) {
            case 'High':
                $strategies[] = 'Require collateral';
                $strategies[] = 'Lower credit limits';
                $strategies[] = 'More frequent monitoring';
                break;
            case 'Medium':
                $strategies[] = 'Moderate credit limits';
                $strategies[] = 'Regular payment reminders';
                break;
            case 'Low':
                $strategies[] = 'Standard credit terms';
                $strategies[] = 'Preferred customer benefits';
                break;
        }
        
        return $strategies;
    }

    private function getTopPerformingSegments()
    {
        return [
            ['segment' => 'High Value', 'count' => 45, 'avg_clv' => 2500000],
            ['segment' => 'Medium Value', 'count' => 120, 'avg_clv' => 750000],
            ['segment' => 'VIP', 'count' => 25, 'avg_clv' => 3500000]
        ];
    }

    private function calculateRetentionMetrics()
    {
        return [
            'overall_retention_rate' => 78.5,
            'monthly_retention_rate' => 82.3,
            'customer_churn_rate' => 21.5,
            'repeat_purchase_rate' => 65.8
        ];
    }

    private function getCreditRiskDistribution()
    {
        return [
            'Low Risk' => 65,
            'Medium Risk' => 25,
            'High Risk' => 10
        ];
    }

    private function identifyGrowthOpportunities()
    {
        return [
            'Cross-sell opportunities with high-value customers',
            'Upgrade medium-value customers through loyalty programs',
            'Re-engagement campaign for at-risk customers',
            'Referral program for VIP customers'
        ];
    }

    private function generateCustomerAlerts()
    {
        return [
            '15 VIP customers showing decreased purchase frequency',
            '8 high-value customers at risk of churn',
            '25 customers eligible for VIP status upgrade',
            '12 customers with declining credit scores'
        ];
    }
}
