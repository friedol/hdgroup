<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('discount_type', ['percentage', 'fixed']);
            $table->decimal('discount_value', 14, 2);
            $table->decimal('max_discount_amount', 14, 2)->nullable();
            $table->decimal('min_order_amount', 14, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('usage_limit_per_user')->nullable();
            $table->unsignedInteger('usage_limit_global')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_codes');
    }
};
