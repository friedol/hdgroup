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
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained();
            $table->foreignId('product_id')->constrained();
            $table->integer('qty')->default(0);
            $table->timestamps();
        });

        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained();
            $table->foreignId('user_id')->constrained(); // Who made the change
            $table->enum('operation', ['increase', 'decrease']);
            $table->integer('quantity_change');
            $table->integer('previous_quantity');
            $table->integer('new_quantity');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
