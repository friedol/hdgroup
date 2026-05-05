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
        Schema::create('containers', function (Blueprint $table) {
            $table->id();
            $table->string('container_id');
            $table->string('name');
            $table->string('length');
            $table->string('width');
            $table->string('height');
            $table->string('capacity');
            $table->string('tare_weight');
            $table->string('gross_weight');
            $table->string('max_payload');
            $table->string('used_capacity')->default(0);
            $table->longText('description');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('containers');
    }
};
