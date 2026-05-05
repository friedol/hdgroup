<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\Category;
use App\Models\Transfer;
use Illuminate\Http\Request;
use App\Models\UpcomingProduct;
use App\Traits\FileUploadTrait;
use App\Models\ProductManagement;
use App\Models\ProductManagementImage;
use App\Services\InventoryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUpcomingProductRequest;
use App\Http\Requests\UpdateUpcomingProductRequest;

class UpcomingProductController extends Controller
{
    use FileUploadTrait;
    protected $inventoryService;
    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }
    public function index()
    {

        $categories = Category::orderBy('category_name', 'asc')->get();

        $transfers = Transfer::all();

        foreach ($transfers as $key => $transfer) {
            $transfers[$key]->product_name = json_decode($transfer->product_name, true);
            $transfers[$key]->store_name = json_decode($transfer->store_name, true);
            $transfers[$key]->product_quantity = json_decode($transfer->product_quantity, true);
        }

        $myProducts = UpcomingProduct::filter(request(['search']))->orderBy('product_name', 'asc')->get();

        $images = [];

        foreach ($myProducts as $key => $product) {
            $myProducts[$key]->images = json_decode($product->images, true);
        }

        return \Inertia\Inertia::render('Admin/Products/Upcoming', [
            'stores' => Store::all(),
            'products' => $myProducts,
            'users' => User::filter(request(['search']))->whereNot('role_id', 4)->get(),

        ], compact('transfers', 'categories', 'images'));
    }


    public function store(Request $request)
    {
        $this->phpInitialize();
        $validatedData = $request->validate([
            'product_id.*' => 'required|string|max:30',
            'product_price.*' => 'nullable',
            'unit_price.*' => 'nullable',
            'buying_price.*' => 'nullable',
            'product_management_id.*' => 'required|string|max:30',
            'product_quantity.*' => 'required|integer|min:0',
            'upcoming_order_id' => 'required|exists:upcoming_orders,id'
        ]);

        try {
            foreach ($validatedData['product_management_id'] as $index => $productManagementId) {
                $product = ProductManagement::find($productManagementId);

                $product_id = $validatedData['product_id'][$index];
                $quantity = $validatedData['product_quantity'][$index];
                $product_price = $validatedData['product_price'][$index];
                $unit_price = $validatedData['unit_price'][$index];
                // $buying_price = $validatedData['buying_price'][$index];
                UpcomingProduct::create([
                    'upcoming_order_id' => $validatedData['upcoming_order_id'],
                    'product_id' => $product_id,
                    'product_management_id' => $productManagementId,
                    'product_name' => $product->product_name,
                    'product_quantity' => $quantity,
                    'product_price' => $product_price ?? null,
                    'unit_price' => $unit_price ?? null,
                    // 'buying_price' => $buying_price ?? null,
                ]);
            }

            return response()->json(['success' => 'Product added successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.' . $e], 500);
        }
        // Create product
    }

    public function edit(string $id)
    {
        return \Inertia\Inertia::render('Admin/Products/EditUpcoming', [
                'product' => UpcomingProduct::findOrFail($id),
            ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $this->phpInitialize();
        $product = UpcomingProduct::findOrFail($id);

        $validatedData = $request->validate([
            'sku' => 'required|string|max:100|unique:products,product_id|unique:upcoming_products,sku,' . $id,
            'product_name' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:100',
            'category_id' => 'required|exists:categories,id',
            'store_id' => 'required|exists:stores,id',
            'brand' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'unit_id' => 'required|exists:units,id',
            
            'buying_price' => 'required|numeric',
            'buying_unit_id' => 'nullable|exists:units,id',
            'qty_in_buying_unit' => 'nullable|numeric|min:1',
            'cost_per_base_unit' => 'nullable|numeric',

            'product_quantity' => 'required|integer|min:0',
            'reorder_point' => 'nullable|integer',
            'low_stock_threshold' => 'nullable|integer',

            'material' => 'nullable|string',
            'weight' => 'nullable|numeric',
            'weight_unit' => 'nullable|string',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'dimension_unit' => 'nullable|string',
            'volume' => 'nullable|numeric',
            'volume_unit' => 'nullable|string',

            'sale_units_names' => 'nullable|array',
            'sale_units_factors' => 'nullable|array',
            'sale_units_prices' => 'nullable|array',
            'spec_keys' => 'nullable|array',
            'spec_values' => 'nullable|array',

            'is_enabled' => 'nullable',
            'is_featured' => 'nullable',
            'is_public' => 'nullable',
            'feature' => 'nullable|string|max:255',
            'level' => 'nullable|integer|min:0',
        ]);

        try {
            // 1. Prepare JSON Data
            $saleUnits = [];
            if ($request->has('sale_units_names')) {
                foreach ($request->sale_units_names as $index => $name) {
                    if ($name) {
                        $saleUnits[] = [
                            'name' => $name,
                            'factor' => $request->sale_units_factors[$index] ?? 1,
                            'price' => $request->sale_units_prices[$index] ?? 0,
                        ];
                    }
                }
            }

            $specifications = [];
            if ($request->has('spec_keys')) {
                foreach ($request->spec_keys as $index => $key) {
                    if ($key) {
                        $specifications[] = [
                            'key' => $key,
                            'value' => $request->spec_values[$index] ?? '',
                        ];
                    }
                }
            }

            // 2. Handle Media (5 Slots)
            $imageSlots = [];
            for ($i = 1; $i <= 5; $i++) {
                $slotName = "image_slot_$i";
                $existingSlot = "existing_image_slot_$i";
                
                if ($request->hasFile($slotName)) {
                    // Delete old if exists
                    if ($product->{"image_$i"}) {
                        $this->deleteFiles($product->{"image_$i"});
                    }
                    $path = $this->handleUploadedFiles([$request->file($slotName)], 'products/images', true);
                    $imageSlots["image_$i"] = $path;
                } else {
                    $imageSlots["image_$i"] = $request->input($existingSlot);
                }
            }

            // 3. Metadata fetching for display columns
            $cat = Category::find($validatedData['category_id']);
            $unit = Unit::find($validatedData['unit_id']);
            $store = \App\Models\Store::find($validatedData['store_id']);
            
            // Sync product_id with sku as per legacy usage if needed, but sku is the new primary
            $product_id = $validatedData['sku'];

            // 4. Update Draft
            $product->update(array_merge($validatedData, $imageSlots, [
                'product_id' => $product_id,
                'category_name' => $cat->category_name,
                'unit_name' => $unit->unit_name,
                'store_name' => $store->store_name,
                'sale_units' => json_encode($saleUnits),
                'specifications' => json_encode($specifications),
                'is_enabled' => $request->has('is_enabled'),
                'is_featured' => $request->has('is_featured'),
                'is_public' => $request->has('is_public'),
                'product_price' => $saleUnits[0]['price'] ?? 0, // Primary price from first unit
                'unit_price' => $saleUnits[0]['price'] ?? 0, 
            ]));

            return response()->json([
                'success' => 'Draft Asset Updated successfully.',
                'redirect' => route('upcoming-orders.show', $product->upcoming_order_id)
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Update Failed: ' . $e->getMessage()], 500);
        }
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $unit = UpcomingProduct::findOrFail($id);
        try {
            $unit->delete();
            return response()->json(['success' => 'Unit Deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
    public function publish($product_id)
    {
        $upcomingProduct = UpcomingProduct::findOrFail($product_id);

        try {
            if ($upcomingProduct->is_published) {
                return back()->with('error', 'Product already Published');
            }

            $existProduct = Product::where('product_id', $upcomingProduct->product_id)->first();
            $store = Store::find($upcomingProduct->store_id) ?? Store::first();

            // 1. Auto-create ProductManagement entry if it doesn't exist (Draft Staging)
            if (!$upcomingProduct->product_management_id) {
                $management = ProductManagement::create([
                    'product_name' => $upcomingProduct->product_name,
                    'sku' => $upcomingProduct->sku,
                    'barcode' => $upcomingProduct->barcode,
                    'brand' => $upcomingProduct->brand,
                    'unit_id' => $upcomingProduct->unit_id ?? Unit::first()->id,
                    'unit_name' => $upcomingProduct->unit_name ?? 'Units',
                    'unit_description' => $upcomingProduct->unit_description ?? 'Standard unit',
                    'product_price' => $upcomingProduct->product_price,
                    'unit_price' => $upcomingProduct->unit_price,
                    'buying_price' => $upcomingProduct->buying_price,
                    'buying_unit_id' => $upcomingProduct->buying_unit_id,
                    'qty_in_buying_unit' => $upcomingProduct->qty_in_buying_unit,
                    'cost_per_base_unit' => $upcomingProduct->cost_per_base_unit,
                    'reorder_point' => $upcomingProduct->reorder_point,
                    'low_stock_threshold' => $upcomingProduct->low_stock_threshold,
                    'store_id' => $upcomingProduct->store_id,
                    'store_name' => $upcomingProduct->store_name,
                    'description' => $upcomingProduct->description,
                    'category_id' => $upcomingProduct->category_id ?? Category::first()->id,
                    'category_name' => $upcomingProduct->category_name ?? 'General',
                    'level' => $upcomingProduct->level,
                    'material' => $upcomingProduct->material,
                    'weight' => $upcomingProduct->weight,
                    'weight_unit' => $upcomingProduct->weight_unit,
                    'length' => $upcomingProduct->length,
                    'width' => $upcomingProduct->width,
                    'height' => $upcomingProduct->height,
                    'dimension_unit' => $upcomingProduct->dimension_unit,
                    'volume' => $upcomingProduct->volume,
                    'volume_unit' => $upcomingProduct->volume_unit,
                    'sale_units' => $upcomingProduct->sale_units,
                    'specifications' => $upcomingProduct->specifications,
                    'image_1' => $upcomingProduct->image_1,
                    'image_2' => $upcomingProduct->image_2,
                    'image_3' => $upcomingProduct->image_3,
                    'image_4' => $upcomingProduct->image_4,
                    'image_5' => $upcomingProduct->image_5,
                    'video' => $upcomingProduct->video,
                    'feature' => $upcomingProduct->feature,
                    'is_enabled' => $upcomingProduct->is_enabled ?? true,
                    'is_featured' => $upcomingProduct->is_featured ?? false,
                    'is_public' => $upcomingProduct->is_public ?? true,
                    'status' => 'active',
                ]);
                
                $upcomingProduct->update(['product_management_id' => $management->id]);

                // 1.1 Create ProductManagementImage records for all 5 slots
                for ($i = 1; $i <= 5; $i++) {
                    $imagePath = $management->{"image_$i"};
                    if ($imagePath) {
                        ProductManagementImage::updateOrCreate(
                            ['product_management_id' => $management->id, 'is_featured' => ($i === 1)],
                            ['image_path' => $imagePath]
                        );
                    }
                }
            }

            if ($existProduct) {
                $this->inventoryService->adjustInventory(
                    $existProduct->id,
                    $upcomingProduct->product_quantity,
                    $store->id,
                    'increase'
                );
            } else {
                // Create new product entry linked to catalog
                $product = Product::create([
                    'product_id' => $upcomingProduct->product_id,
                    'product_management_id' => $upcomingProduct->product_management_id,
                    'product_name' => $upcomingProduct->product_name,
                    'product_price' => $upcomingProduct->product_price,
                    'unit_price' => $upcomingProduct->unit_price,
                    'buying_price' => $upcomingProduct->buying_price,
                    'image' => $upcomingProduct->image_1,
                ]);

                $this->inventoryService->adjustInventory(
                    $product->id,
                    $upcomingProduct->product_quantity,
                    $store->id,
                    'increase'
                );
            }

            // Mark as published
            $upcomingProduct->update([
                'is_published' => true
            ]);

            return back()->with('success', 'Product published successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred: ' . $e->getMessage());
        }
    }
}
