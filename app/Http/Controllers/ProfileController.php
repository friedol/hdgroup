<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\User;
use App\Traits\AuthenticateTrait;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    use AuthenticateTrait;

    public function index()
    {
        return Inertia::render('Staff/Profile');
    }

    public function register()
    {
        return inertia('Auth/Register');
    }

    public function store_accounts(Request $request)
    {
        $validated = $request->validate([
            'staff_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255|unique:customers,customer_email',
            'staff_phone' => 'required|string|max:13|min:10|unique:customers,customer_phone',
            'password' => 'required|string|min:8',
        ]);

        $customer = Customer::create([
            'customer_name' => $validated['staff_name'],
            'customer_phone' => $validated['staff_phone'],
            'customer_email' => $validated['customer_email'],
            'username' => $validated['staff_phone'],
            'password' => $validated['password'],
        ]);

        event(new Registered($customer));

        Auth::guard('customers')->login($customer);

        return redirect()->route('home')->with('success', 'Registration successful! Welcome to Jopo Juniours Co. Ltd.');
    }

    public function profile()
    {
        return inertia('Account/Account', ['user' => Auth::user()]);
    }

    public function updateProfile(Request $data)
    {
        $user = Auth::user();
        if (! $user) {
            return back();
        }

        $data->validate([
            'customer' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:255',
            'tin_number' => 'nullable|string|max:100',
            'profile' => 'nullable|image|max:5120',
        ]);

        $profilePath = null;
        if ($data->hasFile('profile')) {
            $profilePath = $data->file('profile')->store('profiles', 'public');
        }

        $fields = [
            'tin_number' => $data->tin_number,
            'country' => $data->country,
            'location' => $data->city,
            'street' => $data->street,
            'city' => $data->city,
        ];

        if ($profilePath) {
            $oldProfile = $user->profile;
            if ($oldProfile && ! str_starts_with($oldProfile, 'http') && Storage::disk('public')->exists($oldProfile)) {
                Storage::disk('public')->delete($oldProfile);
            }
            $fields['profile'] = $profilePath;
        }

        if ($user instanceof Customer) {
            $user->update(array_merge($fields, [
                'customer_name' => $data->customer,
                'customer_email' => $data->email,
                'customer_phone' => $data->phone,
            ]));
        } elseif ($user instanceof User) {
            $user->update(array_merge($fields, [
                'staff_name' => $data->customer,
                'staff_email' => $data->email,
                'staff_phone' => $data->phone,
            ]));
        }

        return redirect()->back()->with('success', 'Profile Updated successfully');
    }

    public function changepasswordPanel()
    {
        return inertia('Account/Account', ['user' => Auth::user(), 'tab' => 'password']);
    }

    public function change_password(Request $data)
    {
        $data->validate([
            'password' => 'required|string',
            'password_confirm' => 'required|string',
        ]);

        if ($data->password != $data->password_confirm) {
            return redirect()->back()->with('invalid', 'New password and confirm password do not match');
        }

        $user = Auth::user();
        if ($user instanceof Customer || $user instanceof User) {
            $user->update([
                'password' => $data->password, // Hash handled by model cast
            ]);
        }

        return redirect()->back()->with('success', 'Password changed successfully');
    }
}
