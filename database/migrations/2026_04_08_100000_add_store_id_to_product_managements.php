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
        Schema::table('product_managements', function (Blueprint $table) {
            // Add source store tracking for manufactured products
            $table->unsignedBigInteger('source_store_id')->nullable()->after('branch_id');
            $table->foreign('source_store_id')
                ->references('id')
                ->on('stores')
                ->onDelete('set null');
            
            // Add index for faster lookups
            $table->index('source_store_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_managements', function (Blueprint $table) {
            $table->dropForeign(['source_store_id']);
            $table->dropColumn('source_store_id');
        });
    }
};
