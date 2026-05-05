<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_people', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('email')->nullable();
            $table->string('id_number')->unique();
            $table->string('vehicle_registration')->nullable();
            $table->string('vehicle_type')->nullable(); // motorcycle, car, van, truck
            $table->string('status')->default('active'); // active, inactive, on-leave
            $table->decimal('base_delivery_rate', 10, 2)->nullable();
            $table->text('address')->nullable();
            $table->string('delivery_zone')->nullable(); // city, suburb, rural, etc.
            $table->integer('branch_id')->nullable();
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_people');
    }
};
