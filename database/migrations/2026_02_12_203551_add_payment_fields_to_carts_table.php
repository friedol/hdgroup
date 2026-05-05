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
        Schema::table('carts', function (Blueprint $table) {
            $table->string('needs_vat')->default('No')->after('tin_number');
            $table->string('payment_method')->nullable()->after('status');
            $table->decimal('amount_paid', 15, 2)->default(0.00)->after('payment_method');
            $table->decimal('balance', 15, 2)->default(0.00)->after('amount_paid');
            $table->string('is_loan')->default('No')->after('balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn(['needs_vat', 'payment_method', 'amount_paid', 'balance', 'is_loan']);
        });
    }
};
