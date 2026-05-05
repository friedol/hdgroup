<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_number')->unique(); // unique delivery ID
            $table->foreignId('delivery_person_id')->nullable()->constrained('delivery_people')->onDelete('set null');
            $table->string('delivery_type'); // 'loan', 'export', 'online_order'
            $table->string('customer_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('delivery_address');
            $table->string('delivery_zone')->nullable(); // city, suburb, rural, etc.
            $table->decimal('delivery_cost', 10, 2)->default(0);
            $table->decimal('delivery_discount', 10, 2)->default(0);
            $table->decimal('delivery_total', 10, 2)->default(0); // delivery_cost - discount
            $table->string('payment_method'); // cash, card, bank transfer, mpesa, etc.
            $table->string('status')->default('pending'); // pending, assigned, picked-up, in-transit, delivered, failed, cancelled
            $table->string('priority')->default('normal'); // normal, urgent, scheduled
            $table->dateTime('scheduled_date')->nullable();
            $table->dateTime('pickup_time')->nullable();
            $table->dateTime('delivery_time')->nullable();
            $table->integer('rating')->nullable(); // 1-5 star rating
            $table->text('feedback')->nullable();
            $table->text('notes')->nullable();
            $table->string('proof_of_delivery')->nullable(); // signature/photo path
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->integer('branch_id')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
