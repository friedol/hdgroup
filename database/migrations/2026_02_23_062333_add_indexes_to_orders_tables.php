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
            $table->index('status');
            $table->index('is_checked');
            $table->index('amount_paid');
            $table->index('balance');
        });

        Schema::table('exports', function (Blueprint $table) {
            $table->index('status');
            $table->index('is_checked');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->index('status');
            $table->index('is_checked');
            $table->index('amount_paid');
            $table->index('total_amount');
            $table->index('balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['is_checked']);
            $table->dropIndex(['amount_paid']);
            $table->dropIndex(['balance']);
        });

        Schema::table('exports', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['is_checked']);
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['is_checked']);
            $table->dropIndex(['amount_paid']);
            $table->dropIndex(['total_amount']);
            $table->dropIndex(['balance']);
        });
    }
};
