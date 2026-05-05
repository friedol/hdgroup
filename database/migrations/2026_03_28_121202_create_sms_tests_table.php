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
        Schema::create('sms_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('phone_number');
            $table->text('message');
            $table->string('provider')->default('custom');
            $table->string('status')->default('pending'); // pending, success, failed
            $table->text('response')->nullable();
            $table->integer('http_code')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index('branch_id');
            $table->index('provider');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_tests');
    }
};
