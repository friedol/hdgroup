<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('raw_materials', function (Blueprint $blueprint) {
            $blueprint->boolean('is_roll')->default(false)->after('status');
            $blueprint->decimal('gsm', 8, 2)->nullable()->after('is_roll');
            $blueprint->decimal('width', 10, 2)->nullable()->after('gsm'); // in cm
            $blueprint->decimal('total_length', 10, 2)->nullable()->after('width'); // in meters
            $blueprint->decimal('remaining_length', 10, 2)->nullable()->after('total_length'); // in meters
            $blueprint->string('color')->nullable()->after('remaining_length');
            $blueprint->foreignId('parent_roll_id')->nullable()->after('color')->constrained('raw_materials')->onDelete('cascade');
            $blueprint->string('roll_status')->default('available')->after('parent_roll_id'); // available, split, partially_used, consumed
            $blueprint->decimal('cost_per_kg', 12, 2)->nullable()->after('cost_per_unit');
        });

        Schema::table('production_orders', function (Blueprint $blueprint) {
            $blueprint->foreignId('roll_id')->nullable()->after('bom_id')->constrained('raw_materials');
            $blueprint->decimal('bag_width', 10, 2)->nullable()->after('roll_id');
            $blueprint->decimal('bag_length', 10, 2)->nullable()->after('bag_width');
            $blueprint->integer('across_count')->nullable()->after('bag_length');
            $blueprint->decimal('actual_used_length', 10, 2)->nullable()->after('across_count');
            $blueprint->decimal('bags_produced', 12, 2)->nullable()->after('actual_used_length');
            $blueprint->decimal('fabric_cost_used', 12, 2)->nullable()->after('bags_produced');
            $blueprint->decimal('accessory_cost_used', 12, 2)->nullable()->after('fabric_cost_used');
            $blueprint->decimal('revenue', 12, 2)->nullable()->after('accessory_cost_used');
            $blueprint->decimal('gross_profit', 12, 2)->nullable()->after('revenue');
        });
    }

    public function down()
    {
        Schema::table('raw_materials', function (Blueprint $blueprint) {
            $blueprint->dropConstrainedForeignId('parent_roll_id');
            $blueprint->dropColumn([
                'is_roll', 'gsm', 'width', 'total_length', 'remaining_length', 
                'color', 'roll_status', 'cost_per_kg'
            ]);
        });

        Schema::table('production_orders', function (Blueprint $blueprint) {
            $blueprint->dropConstrainedForeignId('roll_id');
            $blueprint->dropColumn([
                'bag_width', 'bag_length', 'across_count', 'actual_used_length', 
                'bags_produced', 'fabric_cost_used', 'accessory_cost_used', 
                'revenue', 'gross_profit'
            ]);
        });
    }
};
