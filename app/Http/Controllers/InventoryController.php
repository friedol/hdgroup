<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\Export;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class InventoryController extends Controller
{
    public function reports(Request $request)
    {
        $query = Product::withSum('inventories as product_quantity', 'qty')->orderBy('product_name', 'asc')
            ->filter(request(['search']));


        if ($request->has(['search']) && $request->search) {
            $query->where('product_name', 'like', '%' . request('search') . '%');
        }
        $d['products'] = $query->get();
        return \Inertia\Inertia::render('Admin/Inventory/Reports', $d);
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
