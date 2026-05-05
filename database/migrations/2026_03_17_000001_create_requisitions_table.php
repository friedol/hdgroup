<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requisitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('issue_type', 50);
            $table->string('subject', 150);
            $table->text('description');

            $table->string('priority', 20)->default('normal'); // low|normal|high|urgent
            $table->string('status', 20)->default('open'); // open|in_progress|resolved|closed

            $table->string('attachment_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisitions');
    }
};

