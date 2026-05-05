<?php

namespace App\Notifications;

use App\Models\Customer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class CustomerFollowUpReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected $customer;
    protected $isHighValue;

    /**
     * Create a new notification instance.
     */
    public function __construct(Customer $customer, bool $isHighValue = false)
    {
        $this->customer = $customer;
        $this->isHighValue = $isHighValue;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database']; // Default to database, add mail if needed
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $status = $this->customer->follow_up_status;
        $title = $this->isHighValue ? '⭐ High Value Customer Alert' : ($status === 'Due Today' ? '🟡 Follow-up Due Today' : '🔴 Overdue Follow-up');
        $message = $this->isHighValue 
            ? "{$this->customer->customer_name} (Priority #{$this->customer->priority_ranking}) hasn't ordered in more than 7 days since expected!" 
            : ($status === 'Due Today' 
                ? "It's the best time to contact {$this->customer->customer_name} for their next order." 
                : "{$this->customer->customer_name} is overdue for follow-up. Last order was on {$this->customer->last_order_date}.");

        return [
            'title' => $title,
            'message' => $message,
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->customer_name,
            'priority' => $this->customer->priority_ranking,
            'status' => $status,
            'action_url' => "/admin/customer-data-center/{$this->customer->id}",
            'type' => 'customer_follow_up'
        ];
    }
}
