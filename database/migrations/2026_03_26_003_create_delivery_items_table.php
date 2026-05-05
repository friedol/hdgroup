<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained('deliveries')->onDelete('cascade');
            $table->string('item_type'); // 'loan', 'export', 'online_order'
            $table->integer('item_id'); // ID of the loan/export/myorder
            $table->string('product_name');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_items');
    }
};
