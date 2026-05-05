<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;

class UserController extends Controller
{

    public function index()
    {
        $roles = Role::withCount('users')->get();
        $users = User::with(['role', 'branch'])
            ->filter(request(['search']))
            ->where('role_id', '!=', 4)
            ->where('staff_email', '!=', 'friedolj99@gmail.com')
            ->latest()
            ->paginate(15);

        return \Inertia\Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'metrics' => [
                'total_users' => User::count(),
                'active_users' => User::count(), // TODO: add activity track
                'total_roles' => $roles->count(),
            ]
        ]);
    }

    public function indexCrud(Request $request)
    {
        return $this->index();
    }

    public function createCrud()
    {
        return $this->create();
    }

    public function storeCrud(Request $request)
    {
        return $this->store($request);
    }

    public function showCrud(string $id)
    {
        return $this->show($id);
    }

    public function editCrud(string $id)
    {
        return $this->edit($id);
    }

    public function updateCrud(Request $request, string $id)
    {
        return $this->update($request, $id);
    }

    public function destroyCrud(string $id)
    {
        return $this->destroy($id);
    }


    public function create()
    {
        $roles = Role::whereNot('id', '4')->get();
        $branches = Branch::where('is_active', true)->orderBy('name')->get();

        return \Inertia\Inertia::render('Admin/Users/Create', compact('roles', 'branches'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_name' => 'required|string|max:255',
            'role_id' => 'required',
            'branch_id' => 'nullable|exists:branches,id',
            'staff_email' => 'required|email|unique:users,staff_email',
            'staff_phone' => 'required|unique:users,staff_phone',
            'username' => 'required|unique:users,username',
            'password' => 'required|min:6',
        ]);

        if ($request->hasFile('profile')) {
            $validated['profile'] = $request->file('profile')->store('profiles', 'public');
        }

        /** @var \App\Models\User $user */
        $user = User::create($validated);

        // Attach optional additional role (single select)
        $additionalRoleId = $request->filled('additional_role_id') ? [(int) $request->additional_role_id] : [];
        $user->roles()->sync($additionalRoleId);

        event(new Registered($user));
        $user->sendEmailVerificationNotification();

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function show(string $id)
    {
        $user = User::with('role', 'permissions')->findOrFail($id);

        // Fetch Sales History (As Cashier)
        $sales = \App\Models\Sale::where('user_id', $id)->latest()->take(10)->get();
        $totalSales = \App\Models\Sale::where('user_id', $id)->sum('payable_amount');
        $totalTransactions = \App\Models\Sale::where('user_id', $id)->count();

        // Fetch Loans/Debts (If applicable, matching by staff_name or similar logic if user is also a customer/staff taking loans)
        // Assuming 'staff_name' in Loan matches User's 'staff_name'
        $loans = \App\Models\Loan::where('staff_name', $user->staff_name)->get();
        $outstandingLoans = $loans->sum('balance');

        // Fetch Payments/Expenses (Salary, Bonuses, etc.)
        $payments = $user->expenses()->latest()->get();
        $totalPayments = $payments->sum('amount');

        return \Inertia\Inertia::render('Admin/Users/Show', compact('user', 'sales', 'totalSales', 'totalTransactions', 'loans', 'outstandingLoans', 'payments', 'totalPayments'));
    }

    public function storePayment(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'category' => 'required|string',
            'payment_method' => 'required|string',
            'description' => 'nullable|string',
        ]);

        try {
            \App\Models\Expense::create([
                'user_id' => $id,
                'amount' => $request->amount,
                'date' => $request->date,
                'category' => $request->category,
                'payment_method' => $request->payment_method,
                'description' => $request->description,
                'status' => 'Paid', // Auto-approve for now
            ]);

            return back()->with('success', 'Payment recorded successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to record payment. Please try again.');
        }
    }

    public function edit(string $id)
    {
        $user = User::with(['roles'])->findOrFail($id);
        $roles = Role::whereNot('id', '4')->get();
        $branches = Branch::where('is_active', true)->orderBy('name')->get();
        $userRoleIds = $user->roles->pluck('id')->toArray();

        return \Inertia\Inertia::render('Admin/Users/Edit', compact('user', 'roles', 'branches', 'userRoleIds'));
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'staff_name' => 'required|string|max:255',
            'role_id' => 'required',
            'branch_id' => 'nullable|exists:branches,id',
            'staff_email' => 'required|email|unique:users,staff_email,' . $user->id,
            'staff_phone' => 'required|unique:users,staff_phone,' . $user->id,
            'username' => 'required|unique:users,username,' . $user->id,
            'password' => 'nullable|min:6',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        if ($request->hasFile('profile')) {
            $validated['profile'] = $request->file('profile')->store('profiles', 'public');
        }

        $user->update($validated);

        // Sync optional additional role (single select)
        $additionalRoleId = $request->filled('additional_role_id') ? [(int) $request->additional_role_id] : [];
        $user->roles()->sync($additionalRoleId);

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $unit = User::findOrFail($id);
        try {
            $unit->delete();
            return back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred. Please try again.');
        }
    }
}
