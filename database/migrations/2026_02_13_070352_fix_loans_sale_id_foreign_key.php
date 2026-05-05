<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            // Drop the old FK referencing 'sales'
            $table->dropForeign(['sale_id']);
            
            // Add new FK referencing 'carts'
            // We keep the column name 'sale_id' to avoid massive refactoring, 
            // but point it to 'carts.id'
            $table->foreign('sale_id')
                  ->references('id')
                  ->on('carts')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropForeign(['sale_id']);

            // Revert to referencing 'sales'
            $table->foreign('sale_id')
                  ->references('id')
                  ->on('sales')
                  ->onDelete('cascade');
        });
    }
};
