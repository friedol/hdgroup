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
            // Drop the incorrect FK referencing 'carts'
            // We need to be careful with the name, the error message said 'loans_sale_id_foreign'
            $table->dropForeign(['sale_id']);
            
            // Re-point to 'sales' table which is the correct source for finalized loans
            $table->foreign('sale_id')
                  ->references('id')
                  ->on('sales')
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
            
            $table->foreign('sale_id')
                  ->references('id')
                  ->on('carts')
                  ->onDelete('cascade');
        });
    }
};
