<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `loans` MODIFY COLUMN `status` ENUM('Pending', 'Paid', 'Partially Paid', 'Unpaid') DEFAULT 'Pending'");
    }

    public function down(): void
    {
        // Update any 'Unpaid' rows back to 'Pending' before removing the value
        DB::statement("UPDATE `loans` SET `status` = 'Pending' WHERE `status` = 'Unpaid'");
        DB::statement("ALTER TABLE `loans` MODIFY COLUMN `status` ENUM('Pending', 'Paid', 'Partially Paid') DEFAULT 'Pending'");
    }
};
