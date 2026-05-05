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
        // 1. Update roles table
        Schema::table('roles', function (Blueprint $table) {
            $table->enum('scope_type', ['global', 'branch'])->default('branch')->after('role_name');
        });

        // 2. Update permissions table
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('action')->nullable()->after('slug');
        });

        // 3. Create role_permissions pivot
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->timestamps();
        });

        // 4. Create user_roles pivot
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->timestamps();
        });

        // 5. Update users table for global and time restrictions
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_global')->default(false)->after('role_id');
            $table->time('access_start_time')->nullable()->after('is_global');
            $table->time('access_end_time')->nullable()->after('access_start_time');
            $table->boolean('is_time_restricted')->default(false)->after('access_end_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_global', 'access_start_time', 'access_end_time', 'is_time_restricted']);
        });

        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn('action');
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('scope_type');
        });
    }
};
