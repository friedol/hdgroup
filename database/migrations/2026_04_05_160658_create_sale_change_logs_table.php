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
        Schema::create('sale_change_logs', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->index();
            $table->unsignedBigInteger('changed_by_id')->nullable();
            $table->string('changed_by_name')->default('System');
            $table->string('action'); // created, updated, status_changed, note_changed, deleted
            $table->text('description');
            $table->json('changes')->nullable(); // {"field": {"old": "...", "new": "..."}}
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_change_logs');
    }
};
