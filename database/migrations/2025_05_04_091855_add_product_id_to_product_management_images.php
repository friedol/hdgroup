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
        Schema::table('product_managements_images', function (Blueprint $table) {
            if (!Schema::hasColumn('product_managements_images', 'product_id')) {
                $table->unsignedBigInteger('product_id')->after('id');
                $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_managements_images', function (Blueprint $table) {
            if (Schema::hasColumn('product_managements_images', 'product_id')) {
                $table->dropForeign(['product_id']);
                $table->dropColumn('product_id');
            }
        });
    }
};
