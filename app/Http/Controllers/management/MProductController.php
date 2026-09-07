<?php

namespace App\Http\Controllers\management;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductManagement;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return redirect()->route('products.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate product data
        $validatedData = $request->validate([
            'product_name' => 'required|string|max:255',
            'unit_id' => 'required|exists:units,id',
            'unit_description' => 'required|string|max:100',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'level' => 'nullable|integer|min:0',
            'feature' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        DB::beginTransaction();

        try {
            // Get related models
            $unit = Unit::findOrFail($validatedData['unit_id']);
            $category = Category::findOrFail($validatedData['category_id']);

            // Create product
            $product = ProductManagement::create(array_merge($validatedData, [
                'unit_name' => $unit->unit_name,
                'category_name' => $category->category_name,
                'status' => 'active', // Default status
            ]));

            // Handle image uploads if present
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $key => $image) {
                    if ($image->isValid()) {
                        $path = $image->store('products/images', 'public');

                        // First image will be marked as featured
                        $isFeatured = $key === 0;

                        $product->images()->create([
                            'image_path' => $path,
                            'is_featured' => $isFeatured,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => 'Product created successfully.',
                'product_id' => $product->id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to create product: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = ProductManagement::findOrFail($id);

        return response()->json($product);
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
