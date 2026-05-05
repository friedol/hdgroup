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
        Schema::table('inventories', function (Blueprint $table) {
            // Drop foreign key safely
            $table->dropForeign(['product_id']);
            
            // Add product_type
            $table->string('product_type')->after('product_id')->default('App\\Models\\Product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropColumn('product_type');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }
};
