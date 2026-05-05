<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Add a separate column pointing to customers table for POS-created customers
            $table->unsignedBigInteger('pos_customer_id')->nullable()->after('customer_id');
            $table->foreign('pos_customer_id')->references('id')->on('customers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['pos_customer_id']);
            $table->dropColumn('pos_customer_id');
        });
    }
};
