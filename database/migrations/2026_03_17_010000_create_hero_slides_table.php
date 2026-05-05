<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();

            $table->string('title');
            $table->text('subtitle')->nullable();
            $table->string('page_type')->default('all'); // homepage/services/products/etc
            $table->integer('sort_order')->default(0);

            $table->boolean('is_active')->default(true);
            $table->boolean('is_ad')->default(false);

            $table->string('button_text')->nullable();
            $table->string('button_link')->nullable();

            $table->string('image_path')->nullable();
            $table->string('background_color')->nullable();
            $table->unsignedTinyInteger('overlay_opacity')->default(40);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slides');
    }
};

