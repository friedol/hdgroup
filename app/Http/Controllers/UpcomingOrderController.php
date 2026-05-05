<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Store;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Models\UpcomingOrder;
use App\Models\UpcomingProduct;
use App\Models\ProductManagement;
use App\Services\InventoryService;
use Illuminate\Support\Facades\Log;

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
        return \Inertia\Inertia::render('Admin/Products/UpcomingOrder/IndexV2', $d);
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
        return \Inertia\Inertia::render('Admin/Products/UpcomingOrder/Create', $d);
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
            return back()->with('error', 'Error: ' . $e->getMessage())->withInput();
        }
    }


    public function publish($order_id)
    {
        $upcomingOrder = UpcomingOrder::with('upcomingProducts')->findOrFail($order_id);

        if ($upcomingOrder->is_published) {
            return back()->with('error', 'Order is already published.');
        }

        $store = Store::first(); // you may later improve by selecting correct store per user

        try {
            foreach ($upcomingOrder->upcomingProducts as $upcomingProduct) {
                if ($upcomingProduct->is_published || $upcomingProduct->product_quantity <= 0) {
                    continue; // skip if already published or no quantity
                }

                $product = Product::where('product_id', $upcomingProduct->product_id)->first();

                if (!$product) {
                    // Create new product
                    $product = Product::create([
                        'product_id' => $upcomingProduct->product_id,
                        'product_management_id' => $upcomingProduct->product_management_id,
                        'product_name' => $upcomingProduct->product_name,
                        'product_price' => $upcomingProduct->product_price,
                        'unit_price' => $upcomingProduct->unit_price,
                        'buying_price' => $upcomingProduct->buying_price,
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
                    $upcomingOrder->id,
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

        return \Inertia\Inertia::render('Admin/Products/UpcomingOrder/Show', $d);
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
            'order_name' => 'required|string|max:255|unique:upcoming_orders,order_name' . ($id ? ",$id" : ''),
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
