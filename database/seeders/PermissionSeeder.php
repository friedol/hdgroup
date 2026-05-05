<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing permissions to avoid duplicates during development
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Permission::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'view_dashboard', 'module' => 'Dashboard'],
            
            // POS & Sales
            ['name' => 'Access POS', 'slug' => 'access_pos', 'module' => 'POS & Sales'],
            ['name' => 'View Sales History', 'slug' => 'view_sales', 'module' => 'POS & Sales'],
            ['name' => 'Manage Orders (Loans)', 'slug' => 'manage_orders', 'module' => 'POS & Sales'],
            ['name' => 'Process Returns', 'slug' => 'process_returns', 'module' => 'POS & Sales'],

            // Products & Inventory
            ['name' => 'View All Products', 'slug' => 'view_products', 'module' => 'Inventory Management'],
            ['name' => 'Add/Edit Products', 'slug' => 'manage_products', 'module' => 'Inventory Management'], // Combined Add/Edit/Delete often better as Manage for simplicity, or keep granular
            ['name' => 'Delete Products', 'slug' => 'delete_products', 'module' => 'Inventory Management'],
            ['name' => 'Manage Transfers', 'slug' => 'manage_transfers', 'module' => 'Inventory Management'],
            ['name' => 'Stock Alerts (In/Out/Less)', 'slug' => 'view_stock_alerts', 'module' => 'Inventory Management'],
            
            // Management (Metadata)
            ['name' => 'Manage Categories', 'slug' => 'manage_categories', 'module' => 'System Data'],
            ['name' => 'Manage Units', 'slug' => 'manage_units', 'module' => 'System Data'],
            ['name' => 'Manage Stores', 'slug' => 'manage_stores', 'module' => 'System Data'],

            // Planning (Upcoming)
            ['name' => 'Manage Upcoming Orders', 'slug' => 'manage_upcoming_orders', 'module' => 'Planning & Logistics'],
            ['name' => 'Manage Upcoming Products', 'slug' => 'manage_upcoming_products', 'module' => 'Planning & Logistics'],

            // Parking List (Logistics)
            ['name' => 'Manage Containers', 'slug' => 'manage_containers', 'module' => 'Planning & Logistics'],
            ['name' => 'Port Registrations', 'slug' => 'manage_port_registrations', 'module' => 'Planning & Logistics'],
            ['name' => 'Logistics Orders', 'slug' => 'manage_logistics_orders', 'module' => 'Planning & Logistics'],

            // Users & Customers
            ['name' => 'View Users', 'slug' => 'view_users', 'module' => 'User Management'],
            ['name' => 'Manage Users', 'slug' => 'manage_users', 'module' => 'User Management'],
            ['name' => 'View Customers', 'slug' => 'view_customers', 'module' => 'User Management'],
            ['name' => 'Manage Customers', 'slug' => 'manage_customers', 'module' => 'User Management'],

            // Finance & Expenses
            ['name' => 'Manage Expenses', 'slug' => 'manage_expenses', 'module' => 'Finance'],

            // Reports
            ['name' => 'Inventory Reports', 'slug' => 'view_inventory_reports', 'module' => 'Reports'],
            ['name' => 'Financial Reports', 'slug' => 'view_financial_reports', 'module' => 'Reports'], // Profit, General, Expense
            ['name' => 'Sales Reports', 'slug' => 'view_sales_reports', 'module' => 'Reports'],
            ['name' => 'Loan Reports', 'slug' => 'view_loan_reports', 'module' => 'Reports'],
            ['name' => 'Export Data', 'slug' => 'export_data', 'module' => 'Reports'],

            // Recommendations & Feedback
            ['name' => 'View Sales Recommendations', 'slug' => 'view_sales_recs', 'module' => 'Insights'],
            ['name' => 'View Order Recommendations', 'slug' => 'view_order_recs', 'module' => 'Insights'],
            ['name' => 'Manage Feedbacks', 'slug' => 'manage_feedbacks', 'module' => 'Insights'],

            // Settings & Security
            ['name' => 'Access System Settings', 'slug' => 'access_settings', 'module' => 'Administration'],
            ['name' => 'View System Logs', 'slug' => 'view_system_logs', 'module' => 'Administration'],
        ];

        foreach ($permissions as $permission) {
            Permission::create($permission);
        }
    }
}
