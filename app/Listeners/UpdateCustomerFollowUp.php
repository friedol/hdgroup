<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Services\CustomerFollowUpService;

class UpdateCustomerFollowUp
{
    protected $followUpService;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        $this->followUpService = new CustomerFollowUpService();
    }

    /**
     * Handle the event.
     */
    public function handle(SaleCreated $event): void
    {
        $sale = $event->sale;
        
        // Update customer follow-up data whenever a sale is created
        $this->followUpService->updateAfterSale($sale);
    }
}
