<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained('deliveries')->onDelete('cascade');
            $table->string('status'); // pending, assigned, picked-up, in-transit, delivered, failed, cancelled
            $table->text('location')->nullable(); // GPS coordinates or address
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 10, 8)->nullable();
            $table->string('updated_by')->nullable(); // who made this update
            $table->text('notes')->nullable(); // why status changed, any issues, etc.
            $table->string('photo')->nullable(); // proof photo path
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_tracking');
    }
};
