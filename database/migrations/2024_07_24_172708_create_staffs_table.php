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
        Schema::create('staffs', function (Blueprint $table) {
            $table->id();
            $table->string('staff_id')->unique();
            $table->string('staff_name');
            $table->string('staff_role');
            $table->string('staff_email')->unique();
            $table->string('staff_phone')->unique();
            $table->string('username')->unique();
            $table->string('password');
            $table->string('profile')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staffs');
    }
};
