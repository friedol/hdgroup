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
        Schema::table('upcoming_products', function (Blueprint $table) {
            $table->string('product_id')->unique();
            $table->decimal('product_price')->nullable();
            $table->decimal('unit_price')->nullable();
            $table->decimal('buying_price')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('upcoming_products', function (Blueprint $table) {
            //
        });
    }
};
