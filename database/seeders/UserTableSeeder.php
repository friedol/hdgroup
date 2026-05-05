<?php

namespace Database\Seeders;

use App\Models\User;
use App\Helper\Common;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class UserTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //

        $users = Common::getDefaultUsers();

        foreach ($users as $user) {
            User::create($user);
        }

    }
}
