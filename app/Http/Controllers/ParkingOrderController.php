<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Loan;
use App\Models\Post;
use App\Models\Order;
use App\Models\Product;
use App\Models\Container;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\LogisticsManifest;
use App\Models\UpcomingOrder;
use App\Models\UpcomingProduct;
use App\Models\ProductManagement;

class ParkingOrderController extends Controller
{

    public function index(Request $request)
    {
        $d['title'] = 'Manifest Control';
        
        $query = LogisticsManifest::with(['container', 'items']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('unique_id', 'like', "%$search%")
                  ->orWhere('manifest_name', 'like', "%$search%");
        }

        if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $d['manifests'] = $query->latest()->get();

        // Calculate Overview Metrics
        $d['total_manifests'] = $d['manifests']->count();
        $d['active_weight'] = $d['manifests']->where('status', 'ACTIVE')->sum('total_weight');
        $d['active_cbm'] = $d['manifests']->where('status', 'ACTIVE')->sum('total_cbm');

        // Fetch all products
        $d['containers'] = Container::all();
        $d['products'] = Post::all();

        // Calculate volume and weight for all orders (can be optimized but fine for now)
        // For performance in large datasets, we'd use a single join query
        $metrics = DB::table('orders')
            ->join('posts', 'orders.product_id', '=', 'posts.product_id')
            ->selectRaw('SUM(orders.quantity * posts.cbm) as total_cbm, SUM(orders.quantity * posts.weight) as total_weight')
            ->first();

        $d['totalCBM'] = $metrics->total_cbm ?? 0;
        $d['totalWeight'] = $metrics->total_weight ?? 0;
        
        return \Inertia\Inertia::render('Logistics/Manifests/Index', [
            'manifests' => $d['manifests'],
            'containers' => $d['containers']
        ]);
    }


    public function reports(Request $request)
    {
        $manifests = LogisticsManifest::all();
        $data = [
            'total_containers' => Container::count(),
            'active_containers' => Container::where('status', 'AVAILABLE')->orWhere('status', 'LOADING')->count(),
            'total_capacity' => Container::sum('capacity'),
            'used_capacity' => Container::sum('current_cbm'),
            'avail_capacity' => Container::sum('capacity') - Container::sum('current_cbm'),
            'active_manifests' => $manifests->where('status', 'ACTIVE')->count(),
            'pending_manifests' => $manifests->where('status', 'DRAFT')->count(),
            'total_weight' => $manifests->sum('total_weight'),
            'total_cbm' => $manifests->sum('total_cbm'),
            'utilization_percent' => Container::count() > 0 ? ((Container::sum('current_cbm') / Container::sum('capacity')) * 100) : 0,
            'draft_manifests' => $manifests->where('status', 'DRAFT')->count(),
            'cancelled_manifests' => $manifests->where('status', 'CANCELLED')->count(),
            'dispatched_manifests' => $manifests->where('status', 'DISPATCHED')->count(),
            'total_manifests' => $manifests->count(),
            'container_status' => [
                'available' => Container::where('status', 'AVAILABLE')->count(),
                'loading' => Container::where('status', 'LOADING')->count(),
                'full' => Container::where('status', 'FULL')->count()
            ]
        ];

        return \Inertia\Inertia::render('Logistics/Reports', ['data' => $data]);
    }


    private function getParkingData($request, $getAll = false)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $query = Order::selectRaw('
                unique_id,
                order_name,
                staff_name,
                container_id,
                SUM(quantity) as total_quantity
            ')
            ->groupBy('unique_id', 'order_name', 'staff_name', 'container_id', )
            ->orderBy('id', 'desc')
            ->filter(request(['search']));

        if ($getAll) {
            if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
                $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
            }

        } else {
            if ($request->has('all')) {
                // $query;
            } elseif ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
                $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
            } else {
                $query->whereDate('created_at', $currentDate);
            }
        }

        return $query->get();
    }

    public function create()
    {
        $d['containers'] = Container::all();
        $d['products'] = Post::all();
        // Fetch distinct recent orders grouped by unique_id or just distinct names
        // Since an order spans multiple rows (products), we group by unique_id to show "Manifests"
        return \Inertia\Inertia::render('Logistics/Manifests/Create', [
            'containers' => $d['containers'],
            'products' => $d['products']
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'order_name' => 'required|max:100', // This is now Manifest Name
            'container_id' => 'required|exists:containers,id',
            'product_id.*' => 'required|exists:posts,product_id',
            'quantity.*' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        try {
            $containerId = $validatedData['container_id'];
            
            // 1. LOCK the container row to prevent race conditions
            // Note: In Laravel lockForUpdate() works on query builder.
            $container = Container::where('id', $containerId)->lockForUpdate()->first();

            // 2. Create the Manifest Helper (Status: ACTIVE by default for now to affect capacity immediately?)
            // Or DRAFT? User requirements: "Only manifests with status = ACTIVE affect container capacity."
            // If we make it ACTIVE immediately, we must validate immediately.
            $manifestStatus = 'ACTIVE'; 
            
            $uniqueId = uniqid('MAN-');
            $manifest = LogisticsManifest::create([
                'unique_id' => $uniqueId,
                'manifest_name' => $validatedData['order_name'],
                'container_id' => $container->id,
                'status' => $manifestStatus,
                'created_by' => Auth::guard('web')->user()->staff_name ?? 'System',
            ]);

            $totalBatchWeight = 0;
            $totalBatchCBM = 0;

            // 3. Process Items & Calculate Batch Totals
            foreach ($validatedData['product_id'] as $index => $productId) {
                $qty = $validatedData['quantity'][$index];
                $product = Post::where('product_id', $productId)->firstOrFail(); // Use model

                $itemWeight = $product->weight * $qty;
                $itemCBM = $product->cbm * $qty;

                $totalBatchWeight += $itemWeight;
                $totalBatchCBM += $itemCBM;

                // Create Order (ManifestItem) linked to Manifest
                Order::create([
                    'manifest_id' => $manifest->id, // Link to Parent
                    'unique_id' => $uniqueId, // Keep for legacy/redundancy if needed
                    'staff_name' => $manifest->created_by,
                    'order_name' => $manifest->manifest_name,
                    'container_id' => $container->id,
                    'product_name' => $product->product_name,
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'total_weight' => $itemWeight,
                    'total_cbm' => $itemCBM
                ]);
            }

            // 4. Update Manifest Totals
            $manifest->total_weight = $totalBatchWeight;
            $manifest->total_cbm = $totalBatchCBM;
            $manifest->save();

            // 5. CRITICAL: Validate Capacity against Container Current State
            // The Container model's current_weight should be up to date if we trust recalculateState.
            // But since we are inside a lock, we can rely on standard values.
            // However, we just added a NEW manifest. We need to check if existing + new > max.
            
            // NOTE: The container->current_weight hasn't been updated yet in DB.
            // So we take $container->current_weight (from DB lock) + $totalBatchWeight.
            
            $checkResult = $container->canAcceptLoad($totalBatchWeight, $totalBatchCBM);
            
            if (!$checkResult['allowed']) {
                throw new \Exception($checkResult['reason']);
            }

            // 6. Recalculate Container State (Updates current_weight/cbm in DB)
            $container->recalculateState();

            DB::commit();
            
            return redirect()->route('parking_orders.index')->with('success', 'Manifest created and Container Allocation updated.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Logistics Rule Violation: ' . $e->getMessage())->withInput();
        }
    }

    public function show(string $unique_id)
    {
        $manifest = LogisticsManifest::where('unique_id', $unique_id)->with(['container', 'items.post'])->firstOrFail();
        
        $d['manifest'] = $manifest;
        $d['container'] = $manifest->container;
        $d['orders'] = $manifest->items;
        $d['unique_id'] = $unique_id;
        return \Inertia\Inertia::render('Logistics/Manifests/Show', [
            'manifest' => $manifest,
            'container' => $manifest->container
        ]);
    }

    public function edit(string $unique_id)
    {
        $manifest = LogisticsManifest::where('unique_id', $unique_id)->with('items')->firstOrFail();
        
        return \Inertia\Inertia::render('Logistics/Manifests/Edit', [
            'manifest' => $manifest,
            'containers' => Container::all(),
            'products' => Post::all()
        ]);
    }

    public function update(Request $request, string $unique_id)
    {
        $validatedData = $request->validate([
            'order_name' => 'required|max:100',
            'container_id' => 'required|exists:containers,id',
            'product_id.*' => 'required|exists:posts,product_id',
            'quantity.*' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        try {
            $manifest = LogisticsManifest::where('unique_id', $unique_id)->with('items')->firstOrFail();
            $oldContainerId = $manifest->container_id;
            $newContainerId = $validatedData['container_id'];

            // 1. Lock New Container (to check capacity)
            $newContainer = Container::where('id', $newContainerId)->lockForUpdate()->first();

            // 2. Delete existing items (to recalculate correctly)
            Order::where('manifest_id', $manifest->id)->delete();

            // 3. Update Manifest Header
            $manifest->manifest_name = $validatedData['order_name'];
            $manifest->container_id = $newContainerId;
            $manifest->save();

            $totalBatchWeight = 0;
            $totalBatchCBM = 0;

            // 4. Re-create items and calculate totals
            foreach ($validatedData['product_id'] as $index => $productId) {
                $qty = $validatedData['quantity'][$index];
                $product = Post::where('product_id', $productId)->firstOrFail();

                $itemWeight = $product->weight * $qty;
                $itemCBM = $product->cbm * $qty;

                $totalBatchWeight += $itemWeight;
                $totalBatchCBM += $itemCBM;

                Order::create([
                    'manifest_id' => $manifest->id,
                    'unique_id' => $unique_id,
                    'staff_name' => Auth::guard('web')->user()->staff_name ?? 'System',
                    'order_name' => $manifest->manifest_name,
                    'container_id' => $newContainer->id,
                    'product_name' => $product->product_name,
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'total_weight' => $itemWeight,
                    'total_cbm' => $itemCBM
                ]);
            }

            // 5. Update Manifest Totals
            $manifest->total_weight = $totalBatchWeight;
            $manifest->total_cbm = $totalBatchCBM;
            $manifest->save();

            // 6. Recalculate State and Validate Capacity
            
            // Recalculate and Validate
            $newContainer->recalculateState();
            $check = $newContainer->canAcceptLoad(0, 0); // Check if current state (already updated) is valid
            if (!$check['allowed']) {
                throw new \Exception($check['reason']);
            }

            // Recalculate Old Container if it changed (no validation needed as load decreased)
            if ($oldContainerId != $newContainerId) {
                $oldContainer = Container::find($oldContainerId);
                if ($oldContainer) $oldContainer->recalculateState();
            }

            DB::commit();
            return redirect()->route('parking_orders.index')->with('success', 'Manifest Updated and Container State adjusted.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Update Violation: ' . $e->getMessage())->withInput();
        }
    }

    public function destroy($unique_id)
    {
        DB::beginTransaction();
        try {
            $manifest = LogisticsManifest::where('unique_id', $unique_id)->first();
            
            if ($manifest) {
                $containerId = $manifest->container_id;
                Order::where('manifest_id', $manifest->id)->delete();
                $manifest->delete();
                
                $container = Container::find($containerId);
                if ($container) $container->recalculateState();
            } else {
                // Fallback for legacy
                $order = Order::where('unique_id', $unique_id)->first();
                if ($order) {
                    $containerId = $order->container_id;
                    Order::where('unique_id', $unique_id)->delete();
                    $container = Container::find($containerId);
                    if ($container) $container->recalculateState();
                }
            }

            DB::commit();
            return back()->with('success', 'Manifest purged and Capacity restored.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Purge Error: ' . $e->getMessage());
        }
    }

    public function addProducts(Request $request)
    {
        $validatedData = $request->validate([
            'unique_id' => 'required|exists:logistics_manifests,unique_id',
            'product_id.*' => 'required|exists:posts,product_id',
            'quantity.*' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        try {
            $manifest = LogisticsManifest::where('unique_id', $validatedData['unique_id'])->firstOrFail();
            $container = Container::where('id', $manifest->container_id)->lockForUpdate()->first();

            $batchWeight = 0;
            $batchCBM = 0;

            foreach ($validatedData['product_id'] as $index => $productId) {
                $qty = $validatedData['quantity'][$index];
                $product = Post::where('product_id', $productId)->firstOrFail();

                $itemWeight = $product->weight * $qty;
                $itemCBM = $product->cbm * $qty;

                $batchWeight += $itemWeight;
                $batchCBM += $itemCBM;

                Order::create([
                    'manifest_id' => $manifest->id,
                    'unique_id' => $manifest->unique_id,
                    'staff_name' => Auth::guard('web')->user()->staff_name ?? 'System',
                    'order_name' => $manifest->manifest_name,
                    'container_id' => $container->id,
                    'product_name' => $product->product_name,
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'total_weight' => $itemWeight,
                    'total_cbm' => $itemCBM
                ]);
            }

            // Update Manifest Totals
            $manifest->total_weight += $batchWeight;
            $manifest->total_cbm += $batchCBM;
            $manifest->save();

            // Recalculate and Validate
            $container->recalculateState();
            $check = $container->canAcceptLoad(0, 0);
            if (!$check['allowed']) {
                throw new \Exception($check['reason']);
            }

            DB::commit();
            return response()->json(['success' => 'Manifest Expanded successfully.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Expansion Violation: ' . $e->getMessage()], 500);
        }
    }

    public function editItem($id)
    {
        $item = Order::with('post')->findOrFail($id);
        return response()->json($item);
    }

    public function updateItem(Request $request, $id)
    {
        $item = Order::findOrFail($id);
        $manifest = LogisticsManifest::findOrFail($item->manifest_id);
        $container = Container::where('id', $manifest->container_id)->lockForUpdate()->firstOrFail();

        $validatedData = $request->validate([
            'product_id' => 'required|exists:posts,product_id',
            'quantity' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        try {
            $product = Post::where('product_id', $validatedData['product_id'])->firstOrFail();

            $item->product_id = $validatedData['product_id'];
            $item->product_name = $product->product_name;
            $item->quantity = $validatedData['quantity'];
            $item->total_weight = $product->weight * $validatedData['quantity'];
            $item->total_cbm = $product->cbm * $validatedData['quantity'];
            $item->save();

            // Sync Manifest Header
            $manifest->total_weight = Order::where('manifest_id', $manifest->id)->sum('total_weight');
            $manifest->total_cbm = Order::where('manifest_id', $manifest->id)->sum('total_cbm');
            $manifest->save();

            // Sync Container
            $container->recalculateState();
            $check = $container->canAcceptLoad(0, 0);
            if (!$check['allowed']) {
                throw new \Exception($check['reason']);
            }

            DB::commit();
            return response()->json(['success' => 'Cargo item updated successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function removeItem($id)
    {
        $item = Order::findOrFail($id);
        $manifestId = $item->manifest_id;

        DB::beginTransaction();
        try {
            $manifest = LogisticsManifest::findOrFail($manifestId);
            $container = Container::where('id', $manifest->container_id)->lockForUpdate()->first();

            $item->delete();

            // Sync Manifest Header
            $manifest->total_weight = Order::where('manifest_id', $manifestId)->sum('total_weight');
            $manifest->total_cbm = Order::where('manifest_id', $manifestId)->sum('total_cbm');
            $manifest->save();

            // Sync Container
            if ($container) {
                $container->recalculateState();
            }

            DB::commit();
            return response()->json(['success' => 'Cargo item removed from manifest successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function pushUpcoming($unique_id)
    {
        DB::beginTransaction();
        try {
            $manifest = LogisticsManifest::where('unique_id', $unique_id)->with('items')->firstOrFail();

            if ($manifest->status === 'PUSHED') {
                return response()->json(['error' => 'This manifest has already been pushed to upcoming orders.'], 422);
            }

            // 1. Create Upcoming Order Staging
            $upcomingOrder = UpcomingOrder::create([
                'order_name' => $manifest->manifest_name . ' (' . $manifest->unique_id . ')',
                'is_published' => false,
                'published_date' => Carbon::now(),
            ]);

            // 2. Map Manifest Items to Upcoming Products
            foreach ($manifest->items as $item) {
                // Try to find matching ProductManagement record by SKU/ID
                $catalogItem = ProductManagement::where('sku', $item->product_id)
                    ->orWhere('id', $item->product_id) // Fallback for numeric IDs
                    ->first();

                UpcomingProduct::create([
                    'upcoming_order_id' => $upcomingOrder->id,
                    'product_management_id' => $catalogItem->id ?? null,
                    'sku' => $item->product_id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'product_quantity' => $item->quantity,
                    
                    // Fallback to catalog data if linked, otherwise use manifest data
                    'product_price' => $catalogItem->product_price ?? $item->post->price ?? 0,
                    'unit_price' => $catalogItem->unit_price ?? 0,
                    'buying_price' => $catalogItem->buying_price ?? 0,

                    // Transfer additional metadata if catalog item exists
                    'unit_id' => $catalogItem->unit_id ?? null,
                    'unit_name' => $catalogItem->unit_name ?? null,
                    'unit_description' => $catalogItem->unit_description ?? null,
                    'category_id' => $catalogItem->category_id ?? null,
                    'category_name' => $catalogItem->category_name ?? null,
                    'description' => $catalogItem->description ?? null,
                    'feature' => $catalogItem->feature ?? null,
                    
                    'is_published' => false,
                ]);
            }

            // 3. Update Manifest Status
            $manifest->status = 'PUSHED';
            $manifest->save();

            DB::commit();
            return response()->json(['success' => 'Manifest successfully pushed to Upcoming Orders.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Transfer Failed: ' . $e->getMessage()], 500);
        }
    }
}
