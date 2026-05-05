<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('production_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained()->onDelete('cascade');
            $table->decimal('expected_material_usage', 15, 2)->default(0);
            $table->decimal('actual_material_usage', 15, 2)->default(0);
            $table->decimal('waste_percentage', 5, 2)->default(0);
            $table->decimal('labor_hours', 8, 2)->default(0);
            $table->integer('downtime_minutes')->default(0);
            $table->decimal('labor_cost', 15, 2)->default(0);
            $table->decimal('efficiency_score', 5, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['production_id']);
            $table->index(['efficiency_score']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('production_metrics');
    }
};
