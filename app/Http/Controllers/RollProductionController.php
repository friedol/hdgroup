<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\ProductionBenchmark;
use App\Models\Store;
use App\Services\RollProductionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RollProductionController extends Controller
{
    protected $rollService;

    public function __construct(RollProductionService $rollService)
    {
        $this->rollService = $rollService;
    }

    // HD PACKAGES is branch_id = 3 — the only production branch.
    // Global users (CEO/Admin) default to HD PACKAGES so they can test/manage production.
    const HD_PACKAGES_BRANCH_ID = 3;

    public function index()
    {
        $branchId = active_branch_id();

        // If user is global (no branch), default to HD PACKAGES for production context
        $productionBranchId = $branchId ?? self::HD_PACKAGES_BRANCH_ID;

        // Show all rolls in the branch (including consumed/zero stock) for full visibility.
        $allRolls = RawMaterial::with(['inventory'])
            ->where('is_roll', true)
            ->whereNull('parent_roll_id')
            ->where('branch_id', $productionBranchId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by base name
        $rolls = $allRolls->map(function ($roll) {
            // Business rule: 1 roll unit equals full roll length (e.g., 500m).
            // Available meters should therefore be units * total_length.
            $roll->total_group_units = (float) $roll->inventory_qty;
            $roll->total_group_metres = ((float) $roll->inventory_qty) * ((float) ($roll->total_length ?: 0));
            return $roll;
        });

        $stores = Store::where('branch_id', $productionBranchId)->get();

        $standardSizes = \App\Models\ProductionBenchmark::where('is_active', true)->get()->keyBy('name')->toArray();

        $manufacturedProducts = Product::where('branch_id', $productionBranchId)
            ->where('product_type', 'manufactured')
            ->where('is_enabled', true)
            ->orderBy('product_name', 'asc')
            ->get(['id', 'product_name', 'product_id as sku', 'product_price', 'buying_price']);

        return \Inertia\Inertia::render('Admin/Production/RollProduction', compact('rolls', 'stores', 'standardSizes', 'manufacturedProducts'));
    }

    public function simulate(Request $request)
    {
        try {
            $request->validate([
                'roll_id' => 'required|exists:raw_materials,id',
                'bag_width' => 'required|numeric|min:1',
                'bag_length' => 'required|numeric|min:1',
                'selling_price' => 'nullable|numeric',
                'handle_cost' => 'nullable|numeric|min:0',
                'thread_cost' => 'nullable|numeric|min:0',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Roll Production Simulation Validation Failed:', [
                'errors' => $e->errors(),
                'data' => $request->all()
            ]);
            return response()->json(['error' => 'Validation failed: ' . implode(', ', \Illuminate\Support\Arr::flatten($e->errors()))], 422);
        }

        try {
            $roll = RawMaterial::findOrFail($request->roll_id);

            // For Yield Matrix: If we have multiple rolls in stock (>1), we should simulate on a FULL roll length.
            // Only if we truly have ONLY one partial roll (qty=1 and rem < total) do we use the remaining.
            $totalLength = (float) ($roll->total_length ?: 1);
            $qty = (float) $roll->inventory_qty;
            
            // If we have > 1 roll or the current roll is not started (rem == total), use full length.
            // Otherwise, use the remainder of this specific partial roll.
            $availableLength = ($qty > 1 || (float)$roll->remaining_length >= $totalLength || (float)$roll->remaining_length <= 0) 
                ? $totalLength 
                : (float)$roll->remaining_length;

            $yield = $this->rollService->calculateYield(
                $roll,
                (float) $request->bag_width,
                (float) $request->bag_length,
                $availableLength
            );

            // Log simulation request for debugging
            Log::debug('Roll Production Simulation Request', [
                'roll_id' => $request->roll_id,
                'bag_width' => $request->bag_width,
                'bag_length' => $request->bag_length,
                'benchmark_target' => $request->input('benchmark_target'),
                'calculated_bags' => $yield['max_possible_bags'],
            ]);

            // 1. Try to find an explicit benchmark if not provided but dimensions match
            $benchmarkTarget = (int) ($request->input('benchmark_target') ?? 0);
            
            if ($benchmarkTarget <= 0) {
                $matchingBenchmarkQuery = \App\Models\ProductionBenchmark::where('width', (float) $request->bag_width)
                    ->where('length', (float) $request->bag_length)
                    ->where('is_active', true);

                // Disambiguate by checking req_roller matching roll width.
                $matchingBenchmark = $matchingBenchmarkQuery->clone()->where('req_roller', $roll->width)->first() 
                    ?: $matchingBenchmarkQuery->first();
                
                if ($matchingBenchmark) {
                    $benchmarkTarget = $matchingBenchmark->target;
                    Log::info('Auto-detected benchmark for dimensions', [
                        'name' => $matchingBenchmark->name,
                        'target' => $benchmarkTarget
                    ]);
                }
            }

            // If we have a benchmark target (explicit or detected), use it as the definitive yield
            if ($benchmarkTarget > 0) {
                Log::debug('Applying company standard/benchmark target', [
                    'benchmark_target' => $benchmarkTarget,
                    'calculated_bags' => $yield['max_possible_bags'],
                ]);
                $yield['max_possible_bags'] = $benchmarkTarget;
            }

            // Calculate Potential Profit using available cost fields
            $acrossCount = (int) ($yield['across_count'] ?: 1);
            // Use the authoritative max_possible_bags for used length calculation
            $usedLength = $acrossCount > 0
                ? ($yield['max_possible_bags'] / $acrossCount) * ((float) $request->bag_length / 100)
                : 0;

            // Use cost_per_kg if available, otherwise use cost_per_unit
            if ($roll->cost_per_kg && $roll->weight_kg) {
                $fabricCostPerMeter = ($roll->cost_per_kg * $roll->weight_kg) / $totalLength;
            } else {
                $fabricCostPerMeter = (float) $roll->cost_per_unit / $totalLength; // Fallback
            }

            $potentialFabricCost = $fabricCostPerMeter * $usedLength;

            $sellingPrice = (float) ($request->selling_price ?: 0);
            $potentialRevenue = $yield['max_possible_bags'] * $sellingPrice;

            // Calculate accessory costs (handles and thread)
            $accessoryCost = $this->calculateAccessoryCosts($yield['max_possible_bags'], (float) $request->handle_cost, (float) $request->thread_cost);

            $totalCost = $potentialFabricCost + $accessoryCost;
            $potentialProfit = $potentialRevenue - $totalCost;

            // Calculate material efficiency
            $widthUtilization = $yield['used_width'] > 0 ? round(($yield['used_width'] / $roll->width) * 100, 1) : 0;
            $wasteArea = $yield['leftover_width'] * $usedLength * 100; // in cm²

            // Calculate material analysis
            $fabricWeight = ((float) $roll->width * $usedLength * (float) $roll->gsm) / 10000; // kg (width in cm, length in m, gsm in g/m²)
            $weightPerBag = ($yield['max_possible_bags'] > 0) ? ($fabricWeight * 1000) / $yield['max_possible_bags'] : 0; // grams
            $totalWaste = $yield['leftover_width'] > 0 ? round(($yield['leftover_width'] / $roll->width) * 100, 1) : 0;

            // Calculate production metrics
            $costPerBag = $yield['max_possible_bags'] > 0 ? $totalCost / $yield['max_possible_bags'] : 0;
            $profitPerBag = $yield['max_possible_bags'] > 0 ? $potentialProfit / $yield['max_possible_bags'] : 0;
            $profitMargin = $potentialRevenue > 0 ? round(($potentialProfit / $potentialRevenue) * 100, 1) : 0;
            $roi = $totalCost > 0 ? round(($potentialProfit / $totalCost) * 100, 1) : 0;
            $breakEven = $sellingPrice > 0 ? ceil($totalCost / $sellingPrice) : 0;

            return response()->json([
                'success' => true,
                'yield' => $yield,
                'is_from_benchmark' => ($benchmarkTarget > 0),
                'benchmark_name' => $matchingBenchmark->name ?? ($request->input('benchmark_name') ?? 'manual'),
                'financials' => [
                    'potential_revenue' => $potentialRevenue,
                    'potential_fabric_cost' => $potentialFabricCost,
                    'accessory_cost' => $accessoryCost,
                    'total_cost' => $totalCost,
                    'potential_profit' => $potentialProfit,
                    'cost_per_bag' => $costPerBag,
                    'profit_per_bag' => $profitPerBag,
                ],
                'efficiency' => [
                    'width_utilization' => $widthUtilization,
                    'waste_area' => $wasteArea,
                ],
                'material' => [
                    'fabric_weight' => $fabricWeight,
                    'weight_per_bag' => $weightPerBag,
                    'total_waste' => $totalWaste,
                ],
                'metrics' => [
                    'profit_margin' => $profitMargin,
                    'roi' => $roi,
                    'break_even' => $breakEven,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Roll Production Simulation Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['error' => 'Calculation Error: ' . $e->getMessage()], 500);
        }
    }

    private function calculateAccessoryCosts($bagCount, $handleCost = null, $threadCost = null)
    {
        // Use provided costs or defaults
        $handleCostPerBag = $handleCost ?? 0;
        $threadCostPerBag = $threadCost ?? 0;

        return ($handleCostPerBag * 2 + $threadCostPerBag) * $bagCount;
    }

    public function split(Request $request)
    {
        $request->validate([
            'roll_id' => 'required|exists:raw_materials,id',
            'bag_width' => 'required|numeric|min:1',
        ]);

        try {
            DB::beginTransaction();
            $roll = RawMaterial::findOrFail($request->roll_id);
            $this->rollService->splitRoll($roll, $request->bag_width);
            DB::commit();

            return response()->json(['success' => 'Roll split successfully. New child roll created for leftover width.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function produce(Request $request)
    {
        $request->validate([
            'roll_id' => 'required|exists:raw_materials,id',
            'store_id' => 'required|exists:stores,id',
            'bag_width' => 'required|numeric|min:1',
            'bag_length' => 'required|numeric|min:1',
            'actual_used_length' => 'nullable|numeric|min:0',
            'rolls_used' => 'nullable|integer|min:1',
            'expected_bags' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'handle_cost' => 'nullable|numeric|min:0',
            'thread_cost' => 'nullable|numeric|min:0',
            'benchmark_name' => 'nullable|string|max:255',
            'product_id' => 'nullable|exists:products,id',
        ]);

        try {
            DB::beginTransaction();

            $roll = RawMaterial::findOrFail($request->roll_id);

            // Prioritize simulation's actual length (meters) for accurate cost reporting.
            // fallback to rolls used or remaining length only if simulate data missed.
            if ($request->filled('actual_used_length') && (float)$request->actual_used_length > 0) {
                $actualUsedLength = (float) $request->actual_used_length;
            } else {
                $rollsUsed = (int) ($request->input('rolls_used') ?? 0);
                if ($rollsUsed > 0) {
                    $actualUsedLength = $rollsUsed * ($roll->total_length ?: 0);
                } else {
                    $actualUsedLength = $request->actual_used_length ?: $roll->remaining_length;
                }
            }

            // Check against TOTAL group stock length (pooled inventory)
            // Strip numbering like "(Roll 1 of 100)" to find the base group name
            $baseName = trim(preg_replace('/\s*\(Roll\s*\d+\s*of\s*\d+\)/i', '', $roll->name));

            $similarRolls = RawMaterial::where('name', 'LIKE', "$baseName%")
                ->where('width', $roll->width)
                ->where('gsm', $roll->gsm)
                ->where('branch_id', $roll->branch_id)
                ->where('roll_status', '!=', 'consumed')
                ->get()
                ->filter(function($r) use ($baseName) {
                    $rBase = trim(preg_replace('/\s*\(Roll\s*\d+\s*of\s*\d+\)/i', '', $r->name));
                    return strtolower($rBase) === strtolower($baseName);
                });

            $totalAvailable = 0;
            foreach ($similarRolls as $r) {
                // For pooled inventory, we check if the roll has ANY physical units in inventory
                // Use existing inventory_qty (count of roll objects) for the calculation
                $q = (float) $r->inventory_qty;
                if ($q > 0) {
                   $totalAvailable += (($q - 1) * $r->total_length) + $r->remaining_length;
                }
            }

            if ($actualUsedLength > $totalAvailable) {
                return response()->json(['error' => "Requested length ($actualUsedLength) exceeds TOTAL available stock (" . number_format($totalAvailable, 2) . "m)."], 422);
            }

            // 1. Use the selected store branch as production branch to keep inventory + products in sync.
            $selectedStore = Store::findOrFail($request->store_id);
            $branchId = (int) ($selectedStore->branch_id ?: (session('active_branch_id') ?: Auth::user()->branch_id ?: 1));

            if ((int) $roll->branch_id !== $branchId) {
                return response()->json([
                    'error' => 'Selected store branch does not match the selected roll branch. Please pick a store from the same branch.'
                ], 422);
            }

            $order = ProductionOrder::create([
                'branch_id' => $branchId,
                'store_id' => $request->store_id,
                'bom_id' => null, // Explicitly set to null for roll-based production
                'roll_id' => $roll->id,
                'product_id' => $request->product_id, // Link to selected product if provided
                'bag_width' => $request->bag_width,
                'bag_length' => $request->bag_length,
                'selling_price' => $request->selling_price ?? 0, // Add selling price
                'quantity_to_produce' => 0, // Set to 0 for roll-based production (not applicable)
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            // 2. Execute via Service with custom accessory costs
            $this->rollService->executeProduction(
                $order,
                $actualUsedLength,
                $request->handle_cost,
                $request->thread_cost,
                $request->input('expected_bags'),
                $request->benchmark_name,
                (int) ($request->input('rolls_used') ?? 0)
            );

            // 3. Optional: Deduct accessories if logic added to service
            // ...

            DB::commit();

            // Debug: Log the order details
            Log::info('Production completed', [
                'order_id' => $order->id,
                'bags_produced' => $order->bags_produced,
                'store_name' => $order->store->store_name,
                'roll_name' => $order->roll->name
            ]);

            // Return success with production details
            return response()->json([
                'success' => 'Production batch completed successfully.',
                'order_id' => $order->id,
                'bags_produced' => $order->bags_produced,
                'product_name' => $order->roll->name . ' Bag ' . $order->bag_width . 'x' . $order->bag_length . 'cm',
                'store_name' => $order->store->store_name,
                'redirect_url' => route('productions.index')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Production failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function productionOrders()
    {
        $branchId = session('active_branch_id');

        $orders = ProductionOrder::with(['roll', 'store', 'createdBy'])
            ->where('branch_id', $branchId)
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        $stores = \App\Models\Store::where('branch_id', $branchId)->get();

        return \Inertia\Inertia::render('Admin/Production/ProductionOrders', compact('orders', 'stores'));
    }

    public function orderDetails($id)
    {
        $order = ProductionOrder::with(['roll', 'store', 'createdBy'])
            ->findOrFail($id);

        $html = view('admin.production.partials.order_details', compact('order'))->render();

        return response()->json(['html' => $html]);
    }
}
