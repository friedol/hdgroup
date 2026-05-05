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
        Schema::create('branch_sms_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('gateway_url')->nullable();
            $table->string('api_key')->nullable();
            $table->string('sender_id')->nullable();
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->string('account_sid')->nullable(); // For Twilio
            $table->string('auth_token')->nullable(); // For Twilio
            $table->string('phone_number')->nullable(); // For Twilio
            $table->string('provider')->default('custom'); // custom, twilio, africastalking, etc
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Indexes for faster queries
            $table->unique(['branch_id']); // One SMS config per branch
            $table->index('provider');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_sms_configs');
    }
};
