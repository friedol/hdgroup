<?php

namespace App\Http\Controllers\management;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $d['units'] = Unit::orderBy("unit_name")->get();
        return \Inertia\Inertia::render('Admin/Management/Units/Index', $d);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create() {}

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $branchId = session('active_branch_id') ?? (auth()->check() ? auth()->user()->branch_id : null);

        $validatedData = $request->validate([
            'unit_name' => 'required|max:100|unique:units,unit_name,NULL,id,branch_id,' . ($branchId ?: 'NULL'),
            'symbol' => 'required|max:20|unique:units,symbol,NULL,id,branch_id,' . ($branchId ?: 'NULL'),
        ]);
        try {
            // Idempotent create per branch
            $category = Unit::firstOrCreate(
                [
                    'unit_name' => $validatedData['unit_name'],
                    'symbol' => $validatedData['symbol'],
                    'branch_id' => $branchId,
                ],
                $validatedData
            );
            return redirect()->route('units.index')->with('success', 'Unit Created successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'An error occurred. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $d['Unit'] = Unit::findOrFail($id);
        return \Inertia\Inertia::render('Admin/Management/Categories/Show', $d);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        return response()->json(Unit::findOrFail($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $branchId = session('active_branch_id') ?? (auth()->check() ? auth()->user()->branch_id : null);

        $validatedData = $request->validate([
            'unit_name' => 'required|max:100|unique:units,unit_name,' . $id . ',id,branch_id,' . ($branchId ?: 'NULL'),
            'symbol' => 'required|max:20|unique:units,symbol,' . $id . ',id,branch_id,' . ($branchId ?: 'NULL'),
        ]);
        // dd($id);
        $Unit = Unit::findOrFail($id);
        try {
            $Unit->update($validatedData);
            return redirect()->route('units.index')->with('success', 'Unit Updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'An error occurred. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $unit = Unit::findOrFail($id);
        try {
            $unit->delete();
            return response()->json(['success' => 'Unit Deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
}
