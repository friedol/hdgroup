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
        Schema::create('cash_flows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('flow', ['IN', 'OUT']);
            $table->string('source_name');
            $table->string('source_phone')->nullable();
            $table->string('details')->nullable();
            $table->string('method'); // MOBILE MONEY, BANK TRANSFER, CASH
            $table->decimal('amount', 15, 2);
            $table->string('ref')->nullable();
            $table->dateTime('transaction_date');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_flows');
    }
};
