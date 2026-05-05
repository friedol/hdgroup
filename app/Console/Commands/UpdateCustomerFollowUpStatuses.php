<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\User;
use App\Services\CustomerAnalyticsService;
use App\Notifications\CustomerFollowUpReminder;
use Illuminate\Console\Command;
use Carbon\Carbon;

class UpdateCustomerFollowUpStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'customers:update-follow-ups';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Recalculate customer follow-up statuses and send notifications to sellers.';

    /**
     * Execute the console command.
     */
    public function handle(CustomerAnalyticsService $service)
    {
        $this->info('Starting customer follow-up status update...');

        // Step 1: Recalculate ALL customers with order history
        $customersWithOrders = Customer::has('sales')->get();
        $this->info("Recalculating analytics for {$customersWithOrders->count()} customers...");
        
        $bar = $this->output->createProgressBar($customersWithOrders->count());
        foreach ($customersWithOrders as $customer) {
            $service->recalculateCustomerAnalytics($customer->id);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();

        // Step 2: Send notifications for Due Today and Overdue
        $today = Carbon::today()->toDateString();
        $dueCustomers = Customer::whereIn('follow_up_status', ['Due Today', 'Overdue'])->get();
        
        $notifiedCount = 0;
        foreach ($dueCustomers as $customer) {
            $sellerId = $customer->brought_by;
            if (!$sellerId) continue;

            $seller = User::find($sellerId);
            if (!$seller) continue;

            // Notify seller
            $seller->notify(new CustomerFollowUpReminder($customer));
            $notifiedCount++;
            
            // High value alert (Priority > 100 & Overdue > 7 days)
            if ($customer->priority_ranking > 100 && $customer->follow_up_status === 'Overdue') {
                $lastOrderDate = Carbon::parse($customer->last_order_date);
                if ($lastOrderDate->diffInDays(now()) > 7) {
                    // Also notify admins if any
                    $admins = User::where('role', 'admin')->get();
                    foreach ($admins as $admin) {
                        $admin->notify(new CustomerFollowUpReminder($customer, true));
                    }
                }
            }
        }

        $this->info("\n✅ Finished! Updated and analyzed {$customersWithOrders->count()} customers. Sent {$notifiedCount} notifications.");

        return 0;
    }
}
