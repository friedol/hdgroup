<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_code_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promo_code_id')->constrained('promo_codes')->cascadeOnDelete();
            $table->string('order_unique_id')->nullable();
            $table->string('user_identifier')->nullable();
            $table->timestamps();

            $table->index(['promo_code_id', 'user_identifier']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_code_usages');
    }
};
