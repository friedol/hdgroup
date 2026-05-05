<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('category_name');
            $table->timestamps();
        });

        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('unit_name', 100);
            $table->string('symbol', 20);
            $table->timestamps();
        });

        Schema::create('product_managements', function (Blueprint $table) {
            $table->id();
            $table->string('product_name');
            $table->foreignId('unit_id')->constrained('units')->onDelete('cascade');
            $table->string('unit_name');
            $table->string('unit_description', 100);
            $table->integer('product_price')->nullable();
            $table->integer('unit_price')->nullable();
            $table->integer('buying_price')->nullable();
            $table->longText('description')->nullable();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('category_name');
            $table->string('status')->default('active');
            $table->integer('level')->nullable();
            $table->string('video')->nullable();
            $table->string('feature', 255)->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('product_id')->unique();
            $table->foreignId('product_management_id')->constrained();
            $table->string('product_name');

            $table->integer('product_price')->nullable();
            $table->integer('unit_price')->nullable();
            $table->integer('buying_price')->nullable();
            $table->timestamps();
        });

        Schema::create('product_managements_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_management_id')->constrained()->onDelete('cascade');
            $table->string('image_path');
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            // Index for better performance when querying featured images
            $table->index(['product_management_id', 'is_featured'], 'pm_images_pm_id_featured_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_managements_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_managements');
        Schema::dropIfExists('units');
        Schema::dropIfExists('categories');
    }
};
