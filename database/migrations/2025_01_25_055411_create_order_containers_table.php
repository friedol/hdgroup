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
        Schema::create('order_containers', function (Blueprint $table) {
            $table->id();
            $table->string('unique_id')->nullable();
            $table->string('order_name');
            $table->string('container_id');
            $table->decimal('container_quantity')->default(0);
            $table->decimal('used_quantity')->default(0);
            $table->decimal('remaining_quantity')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_containers');
    }
};
