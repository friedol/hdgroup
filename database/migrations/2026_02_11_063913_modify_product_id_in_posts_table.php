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
        Schema::table('posts', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['product_id']);
            // Change to string
            $table->string('product_id')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Revert changes (this might fail if data is incompatible, but good for structure)
            // We assume original was unsignedBigInteger
            // $table->unsignedBigInteger('product_id')->change();
            // $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }
};
