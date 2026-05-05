<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Rename SuperAdmin to CEO and Add New Roles
        DB::table('roles')->where('role_name', 'SuperAdmin')->update(['role_name' => 'CEO']);
        
        $roles = ['Manager', 'Seller', 'Cashier'];
        $lastId = DB::table('roles')->max('id');
        
        foreach ($roles as $roleName) {
            if (!DB::table('roles')->where('role_name', $roleName)->exists()) {
                $lastId++;
                DB::table('roles')->insert([
                    'role_id' => $lastId, // Assuming role_id is sequential/custom
                    'role_name' => $roleName,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 2. Create Customers Table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('staff_id')->nullable(); // Legacy ID reference
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->unique();
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->string('profile')->nullable();
            $table->string('location')->nullable(); // From users table
            $table->string('country')->nullable();
            $table->string('tin_number')->nullable();
            $table->timestamps();
        });

        // 3. Migrate Existing Customers (role_id = 4) to Customers Table
        $customerRole = DB::table('roles')->where('role_name', 'Customer')->first();
        if ($customerRole) {
            $customerRoleId = $customerRole->role_id;
            
            $existingCustomers = DB::table('users')->where('role_id', $customerRoleId)->get();
            
            foreach ($existingCustomers as $user) {
                DB::table('customers')->insert([
                    'staff_id' => $user->staff_id,
                    'customer_name' => $user->staff_name,
                    'customer_email' => $user->staff_email,
                    'customer_phone' => $user->staff_phone,
                    'username' => $user->username,
                    'password' => $user->password,
                    'profile' => $user->profile,
                    'location' => $user->location,
                    'country' => $user->country,
                    'tin_number' => $user->tin_number,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]);
            }

            // 4. Delete Customers from Users Table
            // Disable foreign key checks to allow deletion if referenced
            Schema::disableForeignKeyConstraints();
            DB::table('users')->where('role_id', $customerRoleId)->delete();
            Schema::enableForeignKeyConstraints();
            
            // Optionally remove Customer Role, but might be safer to keep for history or reference
             // DB::table('roles')->where('id', $customerRole->id)->delete();
        }

        // 5. Add New Fields to Users Table
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('salary', 15, 2)->nullable()->after('role_id');
            $table->date('joining_date')->nullable()->after('salary');
            $table->text('address')->nullable()->after('joining_date');
            $table->string('emergency_contact')->nullable()->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse User Fields
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['salary', 'joining_date', 'address', 'emergency_contact']);
        });

        // Reverse Customers Table (Optional: Could try to merge back, but might be messy)
        Schema::dropIfExists('customers');

        // Reverse Roles
        DB::table('roles')->where('role_name', 'CEO')->update(['role_name' => 'SuperAdmin']);
        DB::table('roles')->whereIn('role_name', ['Manager', 'Seller', 'Cashier'])->delete();
    }
};
