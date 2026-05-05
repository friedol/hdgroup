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
        Schema::table('stock_adjustments', function (Blueprint $table) {
            // Drop existing foreign key safely
            // Note: Different DBs use different naming conventions for keys
            $table->dropForeign(['product_id']);
            
            // Add polymorphic type
            $table->string('product_type')->after('product_id')->default('App\\Models\\Product');
            
            if (!Schema::hasColumn('stock_adjustments', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('approved_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            $table->dropColumn('product_type');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }
};
