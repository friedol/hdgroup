<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\FollowUpLog;
use App\Models\Sale;
use App\Services\CustomerAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class CustomerDataCenterController extends Controller
{
    protected $analyticsService;

    public function __construct(CustomerAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * List all customers filtered by follow-up status
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Customer::query()->forSaler($user);

        $statusFilter = $request->get('status', 'due');
        
        if ($statusFilter === 'due') {
            $query->whereIn('follow_up_status', ['Due Today', 'Overdue']);
        } elseif ($statusFilter === 'upcoming') {
            $query->where('follow_up_status', 'Upcoming');
        } elseif ($statusFilter === 'new') {
            $query->where('follow_up_status', 'New Customer');
        } elseif ($statusFilter === 'active') {
            $query->where('follow_up_status', 'Active');
        } elseif ($statusFilter === 'all') {
            $query->whereNotNull('last_order_date'); // Customers who have ordered
        }

        $customers = $query->orderBy('priority_ranking', 'desc')
            ->orderBy('next_expected_order_date', 'asc')
            ->paginate(15)
            ->withQueryString();

        // Calculate summary statistics
        $stats = [
            'due_today' => Customer::forSaler($user)->where('follow_up_status', 'Due Today')->count(),
            'overdue' => Customer::forSaler($user)->where('follow_up_status', 'Overdue')->count(),
            'upcoming' => Customer::forSaler($user)->where('follow_up_status', 'Upcoming')->count(),
            'total_customers' => Customer::forSaler($user)->count(),
        ];

        return Inertia::render('Admin/Customers/DataCenter/Index', [
            'customers' => $customers,
            'stats' => $stats,
            'statusFilter' => $statusFilter,
        ]);
    }

    /**
     * Show customer details and history
     */
    public function show(Customer $customer)
    {
        $customer->load([
            'followUpLogs.user',
            'productAnalytics.product',
            'categoryAnalytics.category'
        ]);
        
        $sales = Sale::where('customer_id', $customer->id)
            ->orWhere('pos_customer_id', $customer->id)
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Admin/Customers/DataCenter/Show', [
            'customer' => $customer,
            'recentSales' => $sales,
        ]);
    }

    /**
     * Store follow-up activity
     */
    public function storeFollowUp(Request $request, Customer $customer)
    {
        $request->validate([
            'action' => 'required|string',
            'notes' => 'nullable|string',
            'next_follow_up_date' => 'nullable|date|after_or_equal:today',
        ]);

        FollowUpLog::create([
            'customer_id' => $customer->id,
            'user_id' => Auth::id(),
            'action' => $request->action,
            'notes' => $request->notes,
            'follow_up_date' => now(),
        ]);

        if ($request->next_follow_up_date) {
            $customer->update([
                'manual_follow_up_date' => $request->next_follow_up_date,
            ]);
        }

        // Recalculate status and analytics
        $this->analyticsService->recalculateCustomerAnalytics($customer->id);

        return back()->with('success', 'Follow-up activity recorded successfully.');
    }

    /**
     * Update manual follow-up date
     */
    public function updateFollowUpDate(Request $request, Customer $customer)
    {
        $request->validate([
            'manual_follow_up_date' => 'required|date',
        ]);

        $customer->update([
            'manual_follow_up_date' => $request->manual_follow_up_date,
        ]);

        $this->analyticsService->recalculateCustomerAnalytics($customer->id);

        return back()->with('success', 'Next follow-up date has been manually scheduled.');
    }

    /**
     * Refresh analytics
     */
    public function refresh(Customer $customer)
    {
        $this->analyticsService->recalculateCustomerAnalytics($customer->id);
        return back()->with('success', 'Analytics refreshed successfully.');
    }

    /**
     * Sync all customers analytics
     */
    public function syncAll()
    {
        $customers = Customer::all();
        foreach ($customers as $customer) {
            $this->analyticsService->recalculateCustomerAnalytics($customer->id);
        }
        return back()->with('success', 'All customer analytics have been recalculated.');
    }
}
