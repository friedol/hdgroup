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
            $table->unsignedBigInteger('product_management_id')->nullable()->change();
            $table->unsignedBigInteger('unit_id')->nullable()->after('product_name');
            $table->string('unit_name')->nullable()->after('unit_id');
            $table->string('unit_description', 100)->nullable()->after('unit_name');
            $table->unsignedBigInteger('category_id')->nullable()->after('unit_description');
            $table->string('category_name')->nullable()->after('category_id');
            $table->string('store_name')->nullable()->after('product_price');
            $table->integer('level')->nullable()->after('store_name');
            $table->longText('description')->nullable()->after('level');
            $table->json('images')->nullable()->after('description');
            $table->string('video')->nullable()->after('images');
            $table->string('feature', 255)->nullable()->after('video');
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
