<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Models\Customer;
use App\Services\CustomerFollowUpService;
use Illuminate\Console\Command;

class PopulateCustomerFollowUps extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'customer-followup:populate {--branch-id= : Populate for specific branch only}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Populate or refresh customer follow-up data for all branches. Analyzes purchase patterns and predicts next order dates.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $branchId = $this->option('branch-id');
        $service = new CustomerFollowUpService();

        if ($branchId) {
            $branch = Branch::find($branchId);
            if (!$branch) {
                $this->error("Branch with ID {$branchId} not found");
                return 1;
            }
            $branches = [$branch];
        } else {
            $branches = Branch::where('is_active', true)->get();
        }

        foreach ($branches as $branch) {
            $this->info("Processing branch: {$branch->name}");
            
            $count = $service->syncBranchCustomers($branch);
            
            $this->info("✓ Updated {$count} customers for {$branch->name}");
        }

        $this->info("\n✅ Customer follow-up data population completed!");

        return 0;
    }
}
