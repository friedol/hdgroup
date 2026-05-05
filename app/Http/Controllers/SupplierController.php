<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $branchId = active_branch_id();
        
        // Use withoutGlobalScope if you want to include Global suppliers (branch_id IS NULL)
        $query = Supplier::withoutGlobalScope('branch')->with('branch');

        if ($branchId) {
            $query->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            });
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('supplier_name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        $suppliers = $query->latest()->paginate(20)->withQueryString();

        $metrics = [
            'total_suppliers' => Supplier::withoutGlobalScope('branch')->count(),
            'active_suppliers' => Supplier::withoutGlobalScope('branch')->where('status', true)->count(),
            'categories_count' => Supplier::withoutGlobalScope('branch')->distinct('category')->count('category')
        ];

        return Inertia::render('Operations/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search']),
            'metrics' => $metrics
        ]);
    }

    public function create()
    {
        $branches = Branch::all();
        return Inertia::render('Operations/Suppliers/Create', [
            'branches' => $branches
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'branch_id' => 'nullable',
            'status' => 'nullable|boolean'
        ]);

        Supplier::create([
            ...$request->all(),
            'created_by' => Auth::id(),
            'status' => $request->has('status') ? $request->status : true,
            'branch_id' => ($request->branch_id === 'all_branches' || !$request->branch_id) ? null : $request->branch_id
        ]);

        return redirect()->route('suppliers.index')->with('success', 'Supplier created successfully.');
    }

    public function edit(Supplier $supplier)
    {
        $branches = Branch::all();
        return Inertia::render('Operations/Suppliers/Edit', [
            'supplier' => $supplier,
            'branches' => $branches
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'supplier_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'branch_id' => 'nullable',
            'status' => 'nullable|boolean'
        ]);

        $supplier->update([
            ...$request->all(),
            'status' => $request->has('status') ? $request->status : $supplier->status,
            'branch_id' => ($request->branch_id === 'all_branches' || !$request->branch_id) ? null : $request->branch_id
        ]);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully.');
    }

    public function json()
    {
        $branchId = active_branch_id();
        $suppliers = Supplier::withoutGlobalScope('branch')
            ->when($branchId, function($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            })
            ->get();
        return response()->json($suppliers);
    }
}
