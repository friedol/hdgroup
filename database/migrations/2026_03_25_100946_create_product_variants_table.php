<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');   // FK → products.id (the base product e.g. "A5 D-Cut")
            $table->string('color')->nullable();         // "Blue", "Red", "Green" …
            $table->decimal('qty', 15, 2)->default(0);  // Running stock for this color
            $table->decimal('buying_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->index(['product_id', 'color']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
