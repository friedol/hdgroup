<?php

namespace App\Http\Controllers;

use App\Models\EmployeeContract;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ContractController extends Controller
{
    public function index()
    {
        $contracts = EmployeeContract::with('user', 'createdBy')
            ->orderByDesc('start_date')
            ->get()
            ->map(function (EmployeeContract $contract) {
                $expiringSoon = $contract->end_date
                    && $contract->status === 'active'
                    && now()->diffInDays($contract->end_date, false) <= 30
                    && now()->diffInDays($contract->end_date, false) >= 0;

                return array_merge($contract->toArray(), ['expiring_soon' => $expiringSoon]);
            });

        $employees = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/Contracts/Index', [
            'contracts' => $contracts,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'contract_type' => 'required|in:permanent,fixed_term,probation,internship',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'salary' => 'nullable|numeric|min:0',
            'terms' => 'nullable|string|max:2000',
            'status' => 'required|in:active,expired,terminated',
            'signed_at' => 'nullable|date',
            'document' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $documentPath = null;
        if ($request->hasFile('document')) {
            $documentPath = $request->file('document')->store('hr/contracts', 'public');
        }

        EmployeeContract::create(array_merge($validated, [
            'document_path' => $documentPath,
            'created_by' => Auth::id(),
        ]));

        return back()->with('success', 'Contract created.');
    }

    public function update(Request $request, EmployeeContract $contract)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'contract_type' => 'required|in:permanent,fixed_term,probation,internship',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'salary' => 'nullable|numeric|min:0',
            'terms' => 'nullable|string|max:2000',
            'status' => 'required|in:active,expired,terminated',
            'signed_at' => 'nullable|date',
            'document' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ]);

        if ($request->hasFile('document')) {
            $validated['document_path'] = $request->file('document')->store('hr/contracts', 'public');
        }

        $contract->update($validated);

        return back()->with('success', 'Contract updated.');
    }

    public function destroy(EmployeeContract $contract)
    {
        $contract->delete();

        return back()->with('success', 'Contract removed.');
    }
}
