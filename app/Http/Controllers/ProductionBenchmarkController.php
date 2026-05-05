<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProductionBenchmarkController extends Controller
{
    public function index()
    {
        $benchmarks = \App\Models\ProductionBenchmark::orderBy('req_roller')->orderBy('name')->get();
        return \Inertia\Inertia::render('Admin/Production/Benchmarks', compact('benchmarks'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'width' => 'required|numeric|min:1',
            'length' => 'required|numeric|min:1',
            'target' => 'required|integer|min:0',
            'price' => 'nullable|numeric|min:0',
            'req_roller' => 'required|numeric|min:1',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('benchmarks', 'public');
        }

        \App\Models\ProductionBenchmark::create($data);

        return redirect()->route('production.benchmarks.index')->with('success', 'Benchmark added successfully.');
    }

    public function update(Request $request, $id)
    {
        $benchmark = \App\Models\ProductionBenchmark::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'width' => 'required|numeric|min:1',
            'length' => 'required|numeric|min:1',
            'target' => 'required|integer|min:0',
            'price' => 'nullable|numeric|min:0',
            'req_roller' => 'required|numeric|min:1',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($benchmark->image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($benchmark->image_path);
            }
            $data['image_path'] = $request->file('image')->store('benchmarks', 'public');
        }

        $benchmark->update($data);

        return redirect()->route('production.benchmarks.index')->with('success', 'Benchmark updated successfully.');
    }

    public function destroy($id)
    {
        $benchmark = \App\Models\ProductionBenchmark::findOrFail($id);
        $benchmark->delete();

        return redirect()->route('production.benchmarks.index')->with('success', 'Benchmark deleted successfully.');
    }

    public function toggle($id)
    {
        $benchmark = \App\Models\ProductionBenchmark::findOrFail($id);
        $benchmark->update(['is_active' => !$benchmark->is_active]);

        return redirect()->back()->with('success', 'Status updated successfully.');
    }
}
