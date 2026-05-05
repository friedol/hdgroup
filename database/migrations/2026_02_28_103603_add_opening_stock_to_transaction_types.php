<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE inventory_transactions MODIFY COLUMN transaction_type ENUM(
            'purchase', 
            'production_consume', 
            'production_output', 
            'sale', 
            'transfer', 
            'adjustment',
            'refund',
            'opening_stock'
        ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE inventory_transactions MODIFY COLUMN transaction_type ENUM(
            'purchase', 
            'production_consume', 
            'production_output', 
            'sale', 
            'transfer', 
            'adjustment',
            'refund'
        ) NOT NULL");
    }
};
