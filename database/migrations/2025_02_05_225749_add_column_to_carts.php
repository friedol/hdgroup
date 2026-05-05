<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->string('country')->after('tin_number');
        });
        // Schema::table('products', function (Blueprint $table) {
        //     $table->unique(['product_id', 'store_name']); // Unique per store
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('country');
        });
        // Schema::table('products', function (Blueprint $table) {
        //     $table->dropUnique(['product_id', 'store_name']); // Rollback
        // });
    }
};
