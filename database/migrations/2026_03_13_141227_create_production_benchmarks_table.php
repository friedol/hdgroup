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
        Schema::create('production_benchmarks', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., 'A2 D-Cut'
            $table->string('type')->default('D-Cut'); // 'D-Cut' or 'Loop'
            $table->float('width'); // e.g., 40
            $table->float('length'); // e.g., 48
            $table->integer('target'); // Target pieces, e.g., 1200
            $table->float('price')->default(0); // Selling price
            $table->float('req_roller')->default(0); // Required roller size, e.g., 120
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_benchmarks');
    }
};
