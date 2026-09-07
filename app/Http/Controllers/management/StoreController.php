<?php

namespace App\Http\Controllers\management;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        try {
            return Inertia::render('Admin/Management/Stores/All', [
                'stores' => Store::with('branches')->filter(request(['search']))->get(),
                'users' => User::where('staff_email', '!=', 'developer@gmail.com')->get(),
                'branches' => Branch::all(),
            ]);
        } catch (\Throwable $e) {
            \Log::error('Store Dashboard Load Failed: '.$e->getMessage().' in '.$e->getFile().':'.$e->getLine());
            abort(500, 'Store Dashboard Load Failed: '.$e->getMessage());
        }
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'store_name' => 'required|unique:stores,store_name',
            'store_location' => 'required',
            'district' => 'required',
            'street' => 'required',
            'branch_ids' => 'required|array',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        try {
            DB::beginTransaction();
            $lastId = Store::withoutGlobalScopes()->max('id') ?: 0;
            $newId = $lastId + 1;
            $validatedData['store_id'] = 'STR '.str_pad($newId, 6, '0', STR_PAD_LEFT);

            $store = Store::create([
                'store_name' => $validatedData['store_name'],
                'store_id' => $validatedData['store_id'],
                'store_location' => $validatedData['store_location'],
                'district' => $validatedData['district'],
                'street' => $validatedData['street'],
            ]);

            $store->branches()->sync($validatedData['branch_ids']);
            DB::commit();

            return response()->json(['success' => 'Store Created successfully.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Store Creation Failed: '.$e->getMessage().' in '.$e->getFile().':'.$e->getLine());

            return response()->json(['error' => 'An error occurred during store creation: '.$e->getMessage()], 500);
        }
    }

    public function edit(string $id)
    {
        $store = Store::where('id', $id)
            ->orWhere('store_name', $id)
            ->orWhere('store_id', $id)
            ->firstOrFail();

        return response()->json($store);
    }

    /**
     * Update the specified resource in storage.
     */
    public function show($identifier, Request $request)
    {
        $store = Store::where('id', $identifier)
            ->orWhere('store_name', $identifier)
            ->orWhere('store_id', $identifier)
            ->firstOrFail();

        $storeId = $store->id;
        $dateStart = $request->input('start_date', now()->subDays(30)->toDateString());
        $dateEnd = $request->input('end_date', now()->toDateString());

        // 1. Fetch Products for this Store with localized quantity and thresholds
        $productsQuery = Product::with(['productManagement'])
            ->withSum(['inventories as total_qty' => function ($query) use ($storeId) {
                $query->where('store_id', $storeId);
            }], 'qty')
            ->whereHas('inventories', function ($query) use ($storeId) {
                $query->where('store_id', $storeId);
            });

        // Apply Filters
        if ($request->filled('category_id')) {
            $productsQuery->whereHas('productManagement', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        $products = $productsQuery->orderBy('product_name', 'asc')->get()->map(function ($product) {
            $pm = $product->productManagement;

            // Image URL
            $product->image_url = ($pm && $pm->image_1) ? asset('storage/'.$pm->image_1) : null;

            // Category name
            $product->category_name = $pm?->category_name ?? '—';

            // Display unit conversion
            $rawUnits = $pm?->sale_units ?? [];
            if (is_string($rawUnits)) {
                $rawUnits = json_decode($rawUnits, true) ?? [];
            }
            $unitName = $pm?->unit_name ?? 'pcs';
            $unitLow = strtolower(trim($unitName));
            $factor = 1.0;
            foreach ($rawUnits as $su) {
                if (strtolower(trim($su['unit_name'] ?? $su['name'] ?? '')) === $unitLow) {
                    $factor = max(1.0, (float) ($su['factor'] ?? 1));
                    break;
                }
            }
            if ($factor === 1.0 && ! empty($rawUnits)) {
                $factor = max(1.0, (float) ($rawUnits[0]['factor'] ?? 1));
            }
            $rawQty = $product->total_qty ?? 0;
            $product->display_qty = $factor > 1 ? floor($rawQty / $factor) : $rawQty;
            $product->stock_unit = $unitName;
            $product->stock_factor = $factor;

            return $product;
        });

        // 2. Calculate KPI Metrics
        $totalStockVal = 0;
        $potentialSalesVal = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;
        $totalStockQty = 0;

        foreach ($products as $p) {
            $qty = $p->total_qty ?? 0;
            $totalStockQty += $qty;
            $totalStockVal += $qty * ($p->buying_price ?? 0);
            $potentialSalesVal += $qty * ($p->product_price ?? 0);

            // Reorder check (Store specific if set, otherwise global)
            $inventory = $p->inventories->where('store_id', $storeId)->first();
            $threshold = ($inventory && $inventory->reorder_level > 0)
                         ? $inventory->reorder_level
                         : ($p->productManagement->low_stock_threshold ?? 5);

            if ($qty <= 0) {
                $outOfStockCount++;
            } elseif ($qty <= $threshold) {
                $lowStockCount++;
            }
        }

        $profitMargin = $potentialSalesVal - $totalStockVal;

        // 3. Movement Analytics (Recent 30 days) - Daily Aggregate
        $movementStats = StockMovement::where('store_id', $storeId)
            ->where('created_at', '>=', now()->subDays(30))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END) as inflow'),
                DB::raw('SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END) as outflow')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $chartLabels = [];
        $inflowData = [];
        $outflowData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $stat = $movementStats->where('date', $date)->first();
            $chartLabels[] = now()->subDays($i)->format('d M');
            $inflowData[] = $stat ? (float) $stat->inflow : 0;
            $outflowData[] = $stat ? (float) $stat->outflow : 0;
        }

        $damagedQty = StockAdjustment::where('store_id', $storeId)
            ->where('adjustment_type', 'Damage')
            ->where('status', 'Approved')
            ->sum('quantity');

        // 4. Intelligence: Fast/Slow/Dead Stock
        $saleQuantities = StockMovement::where('store_id', $storeId)
            ->where('type', 'Sale')
            ->where('created_at', '>=', now()->subDays(60))
            ->select('product_id', DB::raw('SUM(ABS(quantity)) as total_sold'))
            ->groupBy('product_id')
            ->pluck('total_sold', 'product_id');

        // Category distribution for doughnut
        $categoryDistribution = $products->groupBy('productManagement.category_name')
            ->map(function ($items) {
                return $items->sum('total_qty');
            });

        $deadStockCount = 0;
        $deadStockDays = Setting::getValue('dead_stock_days', 90);
        foreach ($products as $p) {
            $lastSale = StockMovement::where('product_id', $p->id)
                ->where('store_id', $storeId)
                ->where('type', 'Sale')
                ->latest()
                ->first();

            if (! $lastSale || $lastSale->created_at->diffInDays(now()) > $deadStockDays) {
                $deadStockCount++;
            }
        }

        $recentAdjustments = StockAdjustment::with(['product', 'user'])
            ->where('store_id', $storeId)
            ->latest()
            ->limit(10)
            ->get();

        $d = [
            'store' => $store,
            'products' => $products,
            'users' => User::where('staff_email', '!=', 'developer@gmail.com')->get(),
            'stores' => Store::all(),
            'transfers' => Transfer::where('source_store_id', $storeId)->orWhere('destination_store_id', $storeId)->get(),
            'categories' => Category::all(),
            'recentAdjustments' => $recentAdjustments,
            'metrics' => [
                'total_skus' => $products->count(),
                'total_qty' => $totalStockQty,
                'total_value_cost' => $totalStockVal,
                'total_value_sales' => $potentialSalesVal,
                'profit_margin' => $profitMargin,
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
                'damaged_qty' => abs($damagedQty),
                'dead_stock' => $deadStockCount,
                'fast_moving' => $saleQuantities->count(),
                'chart_labels' => $chartLabels,
                'inflow_series' => $inflowData,
                'outflow_series' => $outflowData,
                'category_labels' => $categoryDistribution->keys(),
                'category_data' => $categoryDistribution->values(),
            ],
            'filters' => [
                'start_date' => $dateStart,
                'end_date' => $dateEnd,
                'category_id' => $request->category_id,
            ],
        ];

        return Inertia::render('Admin/Management/Stores/Show', $d);
    }

    public function getProductList(Request $request, $identifier)
    {
        $store = Store::where('id', $identifier)
            ->orWhere('store_name', $identifier)
            ->orWhere('store_id', $identifier)
            ->first();

        if (! $store) {
            return response()->json([]);
        }

        $storeId = $store->id;

        $products = Product::withSum(['inventories as remaining_quantity' => function ($query) use ($storeId) {
            $query->where('store_id', $storeId);
        }], 'qty')
            ->whereHas('inventories', function ($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->orderBy('product_name', 'asc')
            ->get();

        return response()->json($products);
    }

    public function update(Request $request, string $id)
    {
        $validatedData = $request->validate([
            'store_name' => 'required',
            'store_location' => 'required',
            'district' => 'required',
            'street' => 'required',
            'branch_ids' => 'required|array',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        $store = Store::where('id', $id)
            ->orWhere('store_name', $id)
            ->orWhere('store_id', $id)
            ->firstOrFail();

        try {
            DB::beginTransaction();
            $store->update([
                'store_name' => $validatedData['store_name'],
                'store_location' => $validatedData['store_location'],
                'district' => $validatedData['district'],
                'street' => $validatedData['street'],
            ]);

            $store->branches()->sync($validatedData['branch_ids']);
            DB::commit();

            return response()->json(['success' => 'Store Updated successfully.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Store Update Failed: '.$e->getMessage().' in '.$e->getFile().':'.$e->getLine());

            return response()->json(['error' => 'An error occurred during store update: '.$e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $store = Store::where('id', $id)
            ->orWhere('store_name', $id)
            ->orWhere('store_id', $id)
            ->firstOrFail();

        try {
            $store->delete();

            return response()->json(['success' => 'Store Deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }

    public function intelligenceReport($identifier, $type, Request $request)
    {
        $store = Store::where('id', $identifier)
            ->orWhere('store_name', $identifier)
            ->orWhere('store_id', $identifier)
            ->firstOrFail();

        $storeId = $store->id;

        $productsQuery = Product::with(['productManagement', 'inventories'])
            ->withSum(['inventories as total_qty' => function ($query) use ($storeId) {
                $query->where('store_id', $storeId);
            }], 'qty')
            ->whereHas('inventories', function ($query) use ($storeId) {
                $query->where('store_id', $storeId);
            });

        $reportTitle = '';
        $reportDescription = '';
        $reportIcon = '';
        $reportClass = '';

        if ($type == 'fast-moving') {
            $reportTitle = 'Fast Moving Assets';
            $reportDescription = 'High-velocity products with the most sales activity in the last 60 days.';
            $reportIcon = 'fa-fire';
            $reportClass = 'pill-emerald-soft';

            $saleIds = StockMovement::where('store_id', $storeId)
                ->where('type', 'Sale')
                ->where('created_at', '>=', now()->subDays(60))
                ->select('product_id', DB::raw('SUM(ABS(quantity)) as total_sold'))
                ->groupBy('product_id')
                ->having('total_sold', '>', 0)
                ->orderByDesc('total_sold')
                ->get()
                ->pluck('total_sold', 'product_id');

            $productsQuery->whereIn('id', $saleIds->keys());
            $products = $productsQuery->get()->map(function ($p) use ($saleIds) {
                $p->velocity = $saleIds[$p->id] ?? 0;

                return $p;
            })->sortByDesc('velocity');

        } elseif ($type == 'reorder-priority') {
            $reportTitle = 'Reorder Priority';
            $reportDescription = 'Critical assets currently at or below established inventory thresholds.';
            $reportIcon = 'fa-plus-circle';
            $reportClass = 'pill-amber-soft';

            $allProducts = $productsQuery->get();
            $products = $allProducts->filter(function ($p) use ($storeId) {
                $inventory = $p->inventories->where('store_id', $storeId)->first();
                $threshold = ($inventory && $inventory->reorder_level > 0)
                             ? $inventory->reorder_level
                             : ($p->productManagement->low_stock_threshold ?? 5);

                return $p->total_qty <= $threshold;
            })->sortBy('total_qty');

        } elseif ($type == 'dead-stock') {
            $reportTitle = 'Dead Stock Analysis';
            $reportDescription = 'Dormant assets with no registered sales activity for 90+ days. Strategic clearance or relocation recommended.';
            $reportIcon = 'fa-snowflake';
            $reportClass = 'pill-slate-soft';

            $deadStockDays = Setting::getValue('dead_stock_days', 90);

            $allProducts = $productsQuery->get();
            $products = $allProducts->filter(function ($p) use ($storeId, $deadStockDays) {
                $lastSale = StockMovement::where('product_id', $p->id)
                    ->where('store_id', $storeId)
                    ->where('type', 'Sale')
                    ->latest()
                    ->first();

                $days = $lastSale ? $lastSale->created_at->diffInDays(now()) : 999;
                $p->last_sale_date = $lastSale ? $lastSale->created_at->format('d M, Y') : 'Never Sold';
                $p->days_dormant = $days;
                $p->capital_locked = ($p->total_qty ?: 0) * ($p->buying_price ?: 0);

                return $days >= $deadStockDays;
            })->sortByDesc('days_dormant');
        } else {
            abort(404);
        }

        return Inertia::render('Admin/Management/Stores/IntelligenceReport', [
            'store' => $store,
            'products' => $products,
            'reportType' => $type,
            'reportTitle' => $reportTitle,
            'reportDescription' => $reportDescription,
            'reportIcon' => $reportIcon,
            'reportClass' => $reportClass,
            'role' => Auth::user()->role_id,
        ]);
    }
}
