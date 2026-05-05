<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Models\Setting;

if (!function_exists('setting')) {
    /**
     * Get a setting value by key
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    function setting($key, $default = null)
    {
        return Setting::getValue($key, $default);
    }
}

if (!function_exists('active_branch_id')) {
    /**
     * Get the currently active branch ID for the authenticated user
     * 
     * @return int|null
     */
    function active_branch_id(): ?int
    {
        static $isProcessing = false;
        
        if ($isProcessing) {
            return null;
        }

        $isProcessing = true;

        try {
            // First check if a branch ID is set in the session
            if (Session::has('active_branch_id')) {
                $res = Session::get('active_branch_id');
                $isProcessing = false;
                return $res;
            }

            // If user is authenticated, use their branch ID
            if (Auth::check()) {
                $user = Auth::user();
                
                // Global users can access all branches for cross-tenant overview
                if ($user->isGlobal()) {
                    $isProcessing = false;
                    return null; 
                }

                // Branch users are always scoped to their branch
                $res = $user->branch_id ?? null;
                $isProcessing = false;
                return $res;
            }
        } catch (\Exception $e) {
            // Ignore session/auth errors during early boot
        }

        $isProcessing = false;
        return null;
    }
}

if (!function_exists('get_current_branch')) {
    /**
     * Get the current branch model instance
     * 
     * @return \App\Models\Branch|null
     */
    function get_current_branch()
    {
        $branchId = active_branch_id();
        
        if (!$branchId) {
            return null;
        }

        return \App\Models\Branch::find($branchId);
    }
}

if (!function_exists('set_active_branch')) {
    /**
     * Set the active branch in the session
     * 
     * @param int $branchId
     * @return void
     */
    function set_active_branch($branchId): void
    {
        Session::put('active_branch_id', $branchId);
    }
}

if (!function_exists('clear_active_branch')) {
    /**
     * Clear the active branch from session
     * 
     * @return void
     */
    function clear_active_branch(): void
    {
        Session::forget('active_branch_id');
    }
}

if (!function_exists('format_currency')) {
    /**
     * Format a value as currency
     * 
     * @param float $amount
     * @param string $currency
     * @return string
     */
    function format_currency($amount, $currency = 'USD'): string
    {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'TZS' => 'Tsh',
            'KES' => 'KSh',
        ];

        $symbol = $symbols[$currency] ?? $currency;

        return $symbol . number_format($amount, 2);
    }
}

if (!function_exists('get_permission_categories')) {
    /**
     * Get all available permission categories
     * 
     * @return array
     */
    function get_permission_categories(): array
    {
        return [
            'dashboard' => [
                'dashboard.global' => 'Global Dashboard Access',
                'dashboard.branch' => 'Branch Dashboard Access',
            ],
            'inventory' => [
                'inventory.view' => 'View Inventory',
                'inventory.manage' => 'Manage Products',
                'inventory.adjust' => 'Adjust Stock',
                'inventory.transfer' => 'Transfer Stock',
            ],
            'production' => [
                'production.view' => 'View Production',
                'production.manage_bom' => 'Manage Bill of Materials',
            ],
            'pos' => [
                'pos.access' => 'Access POS Terminal',
                'pos.returns' => 'Process Returns',
            ],
            'finance' => [
                'finance.loans' => 'Manage Loans/Credits',
                'finance.expenses' => 'Track Expenses',
                'finance.reports' => 'View Financial Reports',
            ],
            'logistics' => [
                'logistics.deliveries' => 'Manage Logistics',
            ],
            'users' => [
                'users.view' => 'View Users',
                'users.manage' => 'Manage Users',
            ],
            'settings' => [
                'settings.access' => 'System Settings',
                'settings.logs' => 'View Audit Logs',
            ],
        ];
    }
}

if (!function_exists('get_role_names')) {
    /**
     * Get standard role names
     * 
     * @return array
     */
    function get_role_names(): array
    {
        return [
            'Admin' => 'System Administrator',
            'CEO' => 'Chief Executive Officer',
            'Finance Officer' => 'Finance Officer',
            'Branch Manager' => 'Branch Manager',
            'Store Manager' => 'Store Manager',
            'POS Cashier' => 'Point of Sale Cashier',
            'Warehouse Staff' => 'Warehouse Staff',
            'Production Manager' => 'Production Manager',
            'Staff' => 'Staff Member',
        ];
    }
}

if (!function_exists('get_transaction_types')) {
    /**
     * Get available transaction types
     * 
     * @return array
     */
    function get_transaction_types(): array
    {
        return [
            'stock_addition' => 'Stock Addition',
            'stock_removal' => 'Stock Removal',
            'stock_transfer_in' => 'Stock Transfer In',
            'stock_transfer_out' => 'Stock Transfer Out',
            'stock_adjustment' => 'Stock Adjustment',
            'sale' => 'Sale',
            'return' => 'Return',
            'production' => 'Production',
        ];
    }
}

if (!function_exists('get_payment_statuses')) {
    /**
     * Get available payment statuses
     * 
     * @return array
     */
    function get_payment_statuses(): array
    {
        return [
            'Unpaid' => 'Unpaid',
            'Partially Paid' => 'Partially Paid',
            'Paid' => 'Paid',
            'Overdue' => 'Overdue',
        ];
    }
}

if (!function_exists('get_order_statuses')) {
    /**
     * Get available order statuses
     * 
     * @return array
     */
    function get_order_statuses(): array
    {
        return [
            'pending' => 'Pending',
            'approved' => 'Approved',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
            'on_hold' => 'On Hold',
        ];
    }
}

if (!function_exists('format_date')) {
    /**
     * Format a date for display
     * 
     * @param mixed $date
     * @param string $format
     * @return string
     */
    function format_date($date, $format = 'M d, Y'): string
    {
        try {
            return \Carbon\Carbon::parse($date)->format($format);
        } catch (\Exception $e) {
            return '';
        }
    }
}

if (!function_exists('format_datetime')) {
    /**
     * Format a datetime for display
     * 
     * @param mixed $datetime
     * @param string $format
     * @return string
     */
    function format_datetime($datetime, $format = 'M d, Y H:i'): string
    {
        try {
            return \Carbon\Carbon::parse($datetime)->format($format);
        } catch (\Exception $e) {
            return '';
        }
    }
}
