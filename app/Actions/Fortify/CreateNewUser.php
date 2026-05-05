<?php

namespace App\Actions\Fortify;

use App\Models\Customer;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    /**
     * Validate and create a newly registered customer.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): Customer
    {
        Validator::make($input, [
            'staff_name'  => ['required', 'string', 'max:255'],
            'customer_email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('customers', 'customer_email'),
            ],
            'password' => ['required', 'string', 'confirmed', 'min:8'],
        ])->validate();

        $customer = Customer::create([
            'customer_name'  => $input['staff_name'],
            'customer_email' => $input['customer_email'],
            'password'       => $input['password'],
            'username'       => strstr($input['customer_email'], '@', true),
            'customer_phone' => $input['staff_phone'] ?? 'REG_' . mt_rand(100000, 999999),
        ]);

        $customer->sendEmailVerificationNotification();

        return $customer;
    }
}
