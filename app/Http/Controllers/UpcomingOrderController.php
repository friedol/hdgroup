<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductManagement;
use App\Models\ProductManagementImage;
use App\Models\Store;
use App\Models\Unit;
use App\Models\UpcomingOrder;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UpcomingOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        // dd('Debug: Controller Active');
        $d['posts'] = UpcomingOrder::with('upcomingProducts')->get();

        return Inertia::render('Admin/Products/UpcomingOrder/IndexV2', $d);
    }

    /**
     * Show the form for creating a new resource.
     */
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $d['recentOrders'] = UpcomingOrder::latest()->take(5)->get();

        return Inertia::render('Admin/Products/UpcomingOrder/Create', $d);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $postPrpduct = $request->validate([
            'order_name' => 'required|string|max:255|unique:upcoming_orders,order_name',
        ]);

        try {
            $postPrpduct['published_date'] = Carbon::now();
            UpcomingOrder::create($postPrpduct);

            if ($request->ajax()) {
                return response()->json(['success' => 'Order Registered successfully.']);
            }

            return back()->with('success', 'Order Registered successfully.');

        } catch (\Exception $e) {
            if ($request->ajax()) {
                return response()->json(['error' => 'An error occurred. Please try again.'.$e], 500);
            }

            return back()->with('error', 'Error: '.$e->getMessage())->withInput();
        }
    }

    public function publish($order_id)
    {
        $upcomingOrder = UpcomingOrder::with('upcomingProducts')->findOrFail($order_id);

        if ($upcomingOrder->is_published) {
            return back()->with('error', 'Order is already published.');
        }

        $store = Store::first(); // you may later improve by selecting correct store per user
        $branchId = session('active_branch_id') ?? active_branch_id();

        try {
            foreach ($upcomingOrder->upcomingProducts as $upcomingProduct) {
                if ($upcomingProduct->is_published || $upcomingProduct->product_quantity <= 0) {
                    continue; // skip if already published or no quantity
                }

                $product = Product::where('product_id', $upcomingProduct->product_id)->first();

                if (! $product) {
                    // Auto-create ProductManagement entry if it doesn't exist (Draft Staging)
                    if (! $upcomingProduct->product_management_id) {
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
                            'sale_units' => is_string($upcomingProduct->sale_units) ? json_decode($upcomingProduct->sale_units, true) : $upcomingProduct->sale_units,
                            'specifications' => is_string($upcomingProduct->specifications) ? json_decode($upcomingProduct->specifications, true) : $upcomingProduct->specifications,
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

                        // Create ProductManagementImage records for all 5 slots
                        for ($i = 1; $i <= 5; $i++) {
                            $imagePath = $management->{"image_$i"};
                            if ($imagePath) {
                                ProductManagementImage::updateOrCreate(
                                    ['product_management_id' => $management->id, 'is_featured' => ($i === 1)],
                                    ['image_path' => $imagePath]
                                );
                            }
                        }
                    } else {
                        $management = ProductManagement::find($upcomingProduct->product_management_id);
                    }

                    $productType = $management ? $management->product_type : 'trading';

                    // Create new product
                    $product = Product::create([
                        'product_id' => $upcomingProduct->product_id,
                        'product_management_id' => $upcomingProduct->product_management_id,
                        'product_name' => $upcomingProduct->product_name,
                        'product_price' => $upcomingProduct->product_price,
                        'unit_price' => $upcomingProduct->unit_price,
                        'buying_price' => $upcomingProduct->buying_price,
                        'product_type' => $productType,
                    ]);
                }

                // Adjust inventory (increase stock)
                $this->inventoryService->adjustInventory(
                    $product->id,
                    $upcomingProduct->product_quantity,
                    $store->id,
                    'increase',
                    'purchase',
                    "Published from Upcoming Order: {$upcomingOrder->order_name}",
                    $branchId,
                    'finished_product',
                    'App\Models\UpcomingOrder',
                    $upcomingProduct->buying_price ?? 0
                );

                // Mark upcoming product as published
                $upcomingProduct->update([
                    'is_published' => true,
                ]);
            }

            // Mark entire order as published
            $upcomingOrder->update([
                'is_published' => true,
            ]);

            return back()->with('success', 'Order and products published successfully.');
        } catch (\Throwable $e) {
            Log::error('Publish Order Error', [
                'order_id' => $order_id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'An error occurred while publishing. Please try again.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $d['upcomingOrder'] = UpcomingOrder::with('upcomingProducts')->findOrFail($id);
        $d['productManagements'] = ProductManagement::orderBy('product_name', 'asc')->get();

        return Inertia::render('Admin/Products/UpcomingOrder/Show', $d);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        return response()->json(UpcomingOrder::findOrFail($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $postPrpduct = $request->validate([
            'order_name' => 'required|string|max:255|unique:upcoming_orders,order_name'.($id ? ",$id" : ''),
        ]);
        // dd($id);
        $Post = UpcomingOrder::findOrFail($id);
        try {
            $Post->update($postPrpduct);

            return response()->json(['success' => 'Post Updated  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $Post = UpcomingOrder::findOrFail($id);
        try {
            $Post->delete();

            return response()->json(['success' => 'Post deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
}
