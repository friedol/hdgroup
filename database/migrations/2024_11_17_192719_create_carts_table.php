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
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->string('unique_id')->nullable();

            $table->string('email')->nullable();
            $table->string('city')->nullable();
            $table->string('district')->nullable();
            $table->string('street')->nullable();
            // $table->string('village')->nullable();
            // $table->string('box_name')->nullable();
            // $table->string('kata')->nullable();
            // $table->string('cargo')->nullable();
            // $table->string('tin_number')->nullable();
            $table->string('name');
            $table->string('phone_number');
            $table->string('product_name');
            $table->integer('quantity');
            $table->string('selected_image');
            $table->integer('price');
            $table->integer('product_id');
            $table->string('status')->default('Pending')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
