<?php

namespace App\Http\Controllers;

use App\Models\Container;
use App\Models\LogisticsManifest;
use Illuminate\Http\Request;

class ContainerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $containers = Container::paginate(15);
        
        $metrics = [
            'total_containers' => Container::count(),
            'total_capacity' => Container::sum('capacity'),
            'total_used_capacity' => Container::sum('used_capacity'),
        ];
        
        $metrics['avail_capacity'] = $metrics['total_capacity'] - $metrics['total_used_capacity'];

        return \Inertia\Inertia::render('Logistics/Containers/Index', [
            'containers' => $containers,
            'metrics' => $metrics
        ]);
    }

    public function indexCrud(Request $request) 
    {
        return $this->index();
    }

    /**
     * Show the form for creating a new resource.
     */
    /**
     * Show the form for creating a new resource.
     */
    public function create() 
    {
        return \Inertia\Inertia::render('Logistics/Containers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'container_id'   => 'required|string|max:255|unique:containers,container_id',
            'name'           => 'required|string|max:255',
            'length'         => 'required|numeric|min:0',
            'width'          => 'required|numeric|min:0',
            'height'         => 'required|numeric|min:0',
            'capacity'       => 'required|numeric|min:0',
            'tare_weight'    => 'required|numeric|min:0',
            'gross_weight'   => 'required|numeric|min:0',
            'max_payload'    => 'required|numeric|min:0',
            'description'    => 'nullable|string|max:1000',
            'used_capacity'  => 'required|numeric|min:0', 
        ]);

        try {
            Container::create($validatedData);
            return redirect()->route('containers.index')->with('success', 'Container registered successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $container = Container::findOrFail($id);
        $manifests = LogisticsManifest::where('container_id', $container->id)->get();
        return \Inertia\Inertia::render('Logistics/Containers/Show', [
            'container' => $container,
            'manifests' => $manifests
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $container = Container::findOrFail($id);
        return \Inertia\Inertia::render('Logistics/Containers/Edit', [
            'container' => $container
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validatedData = $request->validate([
            'container_id'   => 'required|string|max:255|unique:containers,container_id'. ($id ? ",$id" : ''),
            'name'           => 'required|string|max:255',
            'length'         => 'required|numeric|min:0',
            'width'          => 'required|numeric|min:0',
            'height'         => 'required|numeric|min:0',
            'capacity'       => 'required|numeric|min:0',
            'tare_weight'    => 'required|numeric|min:0',
            'gross_weight'   => 'required|numeric|min:0',
            'max_payload'    => 'required|numeric|min:0',
            'description'    => 'nullable|string|max:1000',
            'used_capacity'  => 'nullable|numeric|min:0', // used capacity should not exceed capacity
        ]);
        // dd($id);
        $Container = Container::findOrFail($id);
        try {
            $Container->update($validatedData);
            return response()->json(['success' => 'Container Updated  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $Container = Container::findOrFail($id);
        try {
            $Container->delete();
            return response()->json(['success' => 'Container deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
}
