<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerFollowUp;
use App\Models\FollowUpActivity;
use App\Services\CustomerFollowUpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CustomerDataCenterController extends Controller
{
    protected $followUpService;

    public function __construct()
    {
        $this->followUpService = new CustomerFollowUpService();
    }

    /**
     * Dashboard view - main page
     */
    public function index()
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;
        $branch = Branch::find($branchId);

        if (!$branch && $user->isGlobal()) {
            $branch = Branch::first();
        }

        if (!$branch) {
            return redirect()->back()->with('error', 'Please select a branch to view CRM data.');
        }

        $analytics = $this->followUpService->getAnalyticsDashboard($branch);
        $dailyList = $this->followUpService->getDailyFollowUpList($branch);
        $highPriority = $this->followUpService->getHighPriorityCustomers($branch, 10);

        return Inertia::render('Admin/Crm/CustomerDataCenter', [
            'analytics' => $analytics,
            'dailyFollowUpList' => $dailyList->map(fn($f) => $this->formatFollowUpData($f)),
            'highPriorityCustomers' => $highPriority->map(fn($f) => $this->formatFollowUpData($f)),
            'allCustomersList' => collect(),
            'branch' => $branch,
        ]);
    }

    /**
     * Get all customers for the branch with follow-up data
     */
    public function getCustomersList(Request $request)
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;
        
        $query = CustomerFollowUp::where('branch_id', $branchId)
            ->active()
            ->with('customer');

        // Filtering
        if ($request->status) {
            $query->where('follow_up_status', $request->status);
        }

        if ($request->priority) {
            $query->where('priority_tier', $request->priority);
        }

        if ($request->search) {
            $query->whereHas('customer', function ($q) {
                $q->where('customer_name', 'like', '%' . request('search') . '%')
                  ->orWhere('customer_phone', 'like', '%' . request('search') . '%');
            });
        }

        $followUps = $query->orderBy('priority_score', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $followUps->map(fn($f) => $this->formatFollowUpData($f)),
            'pagination' => [
                'total' => $followUps->total(),
                'per_page' => $followUps->perPage(),
                'current_page' => $followUps->currentPage(),
                'last_page' => $followUps->lastPage(),
            ]
        ]);
    }

    /**
     * Get customer follow-up details
     */
    public function getCustomerDetails($customerId)
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;

        $followUp = CustomerFollowUp::where('customer_id', $customerId)
            ->where('branch_id', $branchId)
            ->with('customer', 'activities')
            ->firstOrFail();

        $customer = $followUp->customer;
        $sales = $followUp->getCustomerSales();

        return response()->json([
            'followUp' => $this->formatFollowUpData($followUp),
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->customer_name,
                'email' => $customer->customer_email,
                'phone' => $customer->customer_phone,
                'whatsapp' => $customer->whatsapp_no,
                'company' => $customer->company_name,
                'address' => $customer->business_address,
            ],
            'insights' => [
                'total_orders' => $followUp->total_orders,
                'total_spent' => $followUp->total_spent,
                'average_order_value' => $followUp->total_orders > 0 ? $followUp->total_spent / $followUp->total_orders : 0,
                'avg_reorder_days' => $followUp->average_days_between_orders,
                'frequently_purchased' => $followUp->frequently_purchased_products ?? [],
                'last_order' => $followUp->last_order_date,
                'next_expected' => $followUp->next_expected_order_date,
            ],
            'activityHistory' => $followUp->activities()
                ->recent()
                ->limit(10)
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'type' => $a->activity_type,
                    'typeLabel' => $a->getActivityTypeLabel(),
                    'date' => $a->activity_date->format('M d, Y H:i'),
                    'notes' => $a->notes,
                    'outcome' => $a->outcome,
                    'outcomeLabel' => $a->getOutcomeLabel(),
                    'resulted_in_sale' => $a->resulted_in_sale,
                    'sale_amount' => $a->sale_amount,
                    'user' => $a->user->name ?? 'Unknown',
                ]),
            'recent_sales' => $sales->take(10)->map(fn($s) => [
                'id' => $s->id,
                'date' => $s->created_at->format('M d, Y'),
                'amount' => $s->payable_amount ?? $s->total_amount,
                'items_count' => $s->items->count(),
            ]),
        ]);
    }

    /**
     * Record a follow-up activity
     */
    public function recordActivity(Request $request, $customerId)
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;

        $validated = $request->validate([
            'activity_type' => 'required|in:call,whatsapp,email,sms,in_person,other',
            'notes' => 'required|string',
            'outcome' => 'nullable|in:promised_order,interested,not_interested,no_response,rescheduled,other',
            'resulted_in_sale' => 'boolean',
            'sale_amount' => 'nullable|numeric|min:0',
            'next_follow_up_date' => 'nullable|date',
            'next_follow_up_notes' => 'nullable|string',
        ]);

        $followUp = CustomerFollowUp::where('customer_id', $customerId)
            ->where('branch_id', $branchId)
            ->firstOrFail();

        $activity = $this->followUpService->recordActivity(
            $followUp,
            $validated['activity_type'],
            $validated['notes'],
            $validated['outcome'] ?? null,
            $validated['resulted_in_sale'] ?? false,
            $validated['sale_amount'] ?? null,
            $validated['next_follow_up_date'] ?? null,
            $validated['next_follow_up_notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Activity recorded successfully',
            'activity' => [
                'id' => $activity->id,
                'type' => $activity->activity_type,
                'typeLabel' => $activity->getActivityTypeLabel(),
                'date' => $activity->activity_date->format('M d, Y H:i'),
                'notes' => $activity->notes,
            ]
        ]);
    }

    /**
     * Set manual follow-up date
     */
    public function setManualFollowUpDate(Request $request, $customerId)
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;

        $validated = $request->validate([
            'follow_up_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $followUp = CustomerFollowUp::where('customer_id', $customerId)
            ->where('branch_id', $branchId)
            ->firstOrFail();

        $followUp->update([
            'manual_follow_up_date' => $validated['follow_up_date'],
            'manual_follow_up_notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Follow-up date updated',
        ]);
    }

    /**
     * Refresh customer analysis
     */
    public function refresh(Customer $customer)
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;
        $branch = Branch::findOrFail($branchId);

        $this->followUpService->analyzeCustomer($customer, $branch);

        return back()->with('message_flash', 'Customer data refreshed successfully');
    }

    /**
     * Daily report view page
     */
    public function dailyReportView()
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;
        $branch = Branch::find($branchId);

        if (!$branch && $user->isGlobal()) {
            $branch = Branch::first();
        }

        if (!$branch) {
            return redirect()->back()->with('error', 'Please select a branch to view daily reports.');
        }

        $analytics = $this->followUpService->getAnalyticsDashboard($branch);
        $dailyList = $this->followUpService->getDailyFollowUpList($branch);

        return Inertia::render('Admin/Crm/CustomerDataCenter', [
            'viewMode' => 'daily-report',
            'analytics' => $analytics,
            'dailyFollowUpList' => $dailyList->map(fn($f) => $this->formatFollowUpData($f)),
            'highPriorityCustomers' => collect(),
            'allCustomersList' => collect(),
            'branch' => $branch,
        ]);
    }

    /**
     * All customers view page
     */
    public function allCustomers()
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;
        $branch = Branch::find($branchId);

        if (!$branch && $user->isGlobal()) {
            $branch = Branch::first();
        }

        if (!$branch) {
            return redirect()->back()->with('error', 'Please select a branch.');
        }

        $analytics = $this->followUpService->getAnalyticsDashboard($branch);
        $all = CustomerFollowUp::where('branch_id', $branch->id)
            ->active()
            ->with(['customer'])
            ->orderBy('total_spent', 'desc')
            ->paginate(100);

        return Inertia::render('Admin/Crm/CustomerDataCenter', [
            'viewMode' => 'all',
            'analytics' => $analytics,
            'dailyFollowUpList' => collect(),
            'highPriorityCustomers' => collect(),
            'allCustomersList' => $all->map(fn($f) => $this->formatFollowUpData($f)),
            'branch' => $branch,
        ]);
    }

    /**
     * Sync all customers for the branch
     */
    public function syncAll()
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;
        $branch = Branch::find($branchId);

        if (!$branch && $user->isGlobal()) {
            $branch = Branch::first();
        }

        if (!$branch) {
            return redirect()->back()->with('error', 'Select a branch first');
        }

        $count = $this->followUpService->syncBranchCustomers($branch);

        return back()->with('message_flash', "Refreshed analysis for $count customers.");
    }

    /**
     * Get daily follow-up report
     */
    public function getDailyReport()
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;
        $branch = Branch::find($branchId);

        if (!$branch && $user->isGlobal()) {
            $branch = Branch::first();
        }

        if (!$branch) {
            return response()->json(['error' => 'Please select a branch.'], 404);
        }

        $dailyList = $this->followUpService->getDailyFollowUpList($branch);
        $dueToday = $dailyList->where('follow_up_status', 'due')->count();
        $overdue = $dailyList->where('follow_up_status', 'overdue')->count();

        return response()->json([
            'date' => now()->format('F d, Y'),
            'total_to_contact' => $dailyList->count(),
            'due_today' => $dueToday,
            'overdue' => $overdue,
            'customers' => $dailyList->map(fn($f) => [
                'id' => $f->id,
                'customer_id' => $f->customer_id,
                'customer_name' => $f->customer->customer_name,
                'phone' => $f->customer->customer_phone,
                'whatsapp' => $f->customer->whatsapp_no,
                'status' => $f->follow_up_status,
                'status_emoji' => $f->getStatusEmoji(),
                'priority_score' => $f->priority_score,
                'priority_tier' => $f->priority_tier,
                'last_order_date' => $f->last_order_date?->format('M d'),
                'next_expected' => $f->next_expected_order_date?->format('M d'),
                'days_since_order' => $f->last_order_date ? now()->diffInDays($f->last_order_date) : null,
            ]),
        ]);
    }

    /**
     * Format follow-up data for response
     */
    private function formatFollowUpData(CustomerFollowUp $followUp): array
    {
        return [
            'id' => $followUp->id,
            'customer_id' => $followUp->customer_id,
            'customer_name' => $followUp->customer->customer_name,
            'phone' => $followUp->customer->customer_phone,
            'whatsapp' => $followUp->customer->whatsapp_no,
            'total_orders' => $followUp->total_orders,
            'total_spent' => $followUp->total_spent,
            'avg_order_value' => $followUp->total_orders > 0 ? $followUp->total_spent / $followUp->total_orders : 0,
            'last_order_date' => $followUp->last_order_date?->format('M d, Y'),
            'next_expected_order_date' => $followUp->next_expected_order_date?->format('M d, Y'),
            'days_until_next_order' => $followUp->getDaysUntilNextOrder(),
            'follow_up_status' => $followUp->follow_up_status,
            'status_emoji' => $followUp->getStatusEmoji(),
            'status_color' => $followUp->getStatusColor(),
            'priority_tier' => $followUp->priority_tier,
            'priority_score' => $followUp->priority_score,
            'reorder_cycle_days' => $followUp->reorder_cycle_days,
            'frequently_purchased' => $followUp->frequently_purchased_products ?? [],
            'last_follow_up_date' => $followUp->last_follow_up_date?->format('M d, Y'),
            'follow_up_count' => $followUp->follow_up_count,
        ];
    }

    /**
     * Show customer details page (legacy - for back compatibility)
     */
    public function show(Customer $customer)
    {
        $user = Auth::user();
        $branchId = session('active_branch_id') ?: $user->branch_id;

        $followUp = CustomerFollowUp::where('customer_id', $customer->id)
            ->where('branch_id', $branchId)
            ->first();

        if (!$followUp) {
            $followUp = $this->followUpService->analyzeCustomer($customer, Branch::find($branchId));
        }

        $orders = $customer->sales()
            ->where('branch_id', $branchId)
            ->latest()
            ->take(15)
            ->get();

        return Inertia::render('Admin/Customers/DataCenter/Show', [
            'customer' => $customer,
            'orders' => $orders,
            'followUp' => $this->formatFollowUpData($followUp),
        ]);
    }
}


