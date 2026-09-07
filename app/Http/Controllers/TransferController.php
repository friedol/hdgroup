<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Store;
use App\Models\Transfer;
use App\Models\User;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TransferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(Request $request)
    {
        $d['transfers'] = $this->getTransferData($request);
        $d['stores'] = Store::all();
        $d['users'] = User::where('staff_email', '!=', 'developer@gmail.com')->get();

        return Inertia::render('Admin/Transfers/All', $d);
    }

    public function reports(Request $request)
    {
        // dd($request->all());
        $d['transfers'] = $transfers = $this->getTransferData($request, true);
        $d['totalQuantity'] = $transfers->sum('total_quantity');
        $d['totalBuyingValue'] = $transfers->sum('total_buying_value');
        $d['totalSellingValue'] = $transfers->sum('total_selling_value');
        $d['filters'] = [
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ];

        return Inertia::render('Admin/Transfers/Reports', $d);
    }

    private function getTransferData($request, $getAll = false)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $query = Transfer::withoutGlobalScope('branch')->selectRaw('
                unique_id,
                store_name as source_store,
                source_store as destination_store,
                staff_name,
                staff_recommeded,
                created_at,
                SUM(product_quantity) as total_quantity,
                SUM(product_quantity * COALESCE(buying_price, 0)) as total_buying_value,
                SUM(product_quantity * COALESCE(selling_price, 0)) as total_selling_value,
                MIN(status) as status,
                MIN(source_store_id) as source_store_id,
                MIN(destination_store_id) as destination_store_id,
                MIN(base_unit) as base_unit,
                COUNT(*) as product_count
            ')
            ->groupBy('unique_id', 'source_store', 'store_name', 'created_at', 'staff_name', 'staff_recommeded')
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

        // For listing page we want a paginator; for reports we need full collection
        return $getAll ? $query->get() : $query->paginate(15);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Transfers/Create', [
            'stores' => Store::all(),
            'users' => User::where('staff_email', '!=', 'developer@gmail.com')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        $validatedData = $request->validate([
            'store_name' => 'required', // destination_store_id
            'source_store' => 'required', // source_store_id
            'staff_recommeded' => 'required',
            'product_id.*' => 'required',
            'product_quantity.*' => 'required|integer|min:1',
            'reason' => 'required|max:255',
        ]);

        DB::beginTransaction(); // Start the transaction

        try {
            $uniqueId = 'ORD_'.mt_rand(10000000, 99999999);

            foreach ($validatedData['product_id'] as $index => $productId) {
                $sourceStoreId = $validatedData['source_store'];
                $destinationStoreId = $validatedData['store_name'];

                $sourceStore = Store::find($sourceStoreId);
                $destinationStore = Store::find($destinationStoreId);

                $staffRecommended = $validatedData['staff_recommeded'];

                $productQuantity = $validatedData['product_quantity'][$index];
                $reasons = $validatedData['reason'];
                $staffName = Auth::guard('web')->user()->staff_name;

                $product = Product::withoutGlobalScope('branch')
                    ->with(['productManagement'])
                    ->find($productId);
                if (! $product) {
                    throw new \Exception("Product ID {$productId} not found.");
                }
                $productName = $product->product_name;

                // Snapshot pricing (internal/office use on the transfer document).
                $buyingPrice = (float) ($product->buying_price ?: optional($product->productManagement)->buying_price ?: 0);
                $sellingPrice = (float) ($product->product_price ?: optional($product->productManagement)->product_price ?: 0);

                // Resolve base-unit factor so qty entered in base units converts to raw pieces
                $pm = $product->productManagement;
                $rawSaleUnits = $pm?->sale_units ?? [];
                if (is_string($rawSaleUnits)) {
                    $rawSaleUnits = json_decode($rawSaleUnits, true) ?? [];
                }
                $unitName = $pm?->unit_name ?? '';
                $unitLow = strtolower(trim($unitName));
                $unitFactor = 1.0;
                foreach ($rawSaleUnits as $su) {
                    if (strtolower(trim($su['unit_name'] ?? $su['name'] ?? '')) === $unitLow) {
                        $unitFactor = max(1.0, (float) ($su['factor'] ?? 1));
                        break;
                    }
                }
                if ($unitFactor === 1.0 && ! empty($rawSaleUnits)) {
                    $unitFactor = max(1.0, (float) ($rawSaleUnits[0]['factor'] ?? 1));
                }

                // Move raw pieces in inventory (user entered base-unit qty)
                $rawQtyToTransfer = (int) round($productQuantity * $unitFactor);

                $transferred = $this->inventoryService->transferStock(
                    $productId,
                    $sourceStoreId,
                    $destinationStoreId,
                    $rawQtyToTransfer
                );

                if (! $transferred) {
                    $displayAvail = 'insufficient';
                    throw new \Exception("Insufficient stock for {$product->product_name} in the selected source store. Please check available quantity.");
                }

                Transfer::create([
                    'unique_id' => $uniqueId,
                    'product_id' => $productId,
                    'product_name' => $productName,
                    'staff_name' => $staffName,
                    'store_name' => $sourceStore->store_name,
                    'staff_recommeded' => $staffRecommended,
                    'product_quantity' => $productQuantity,   // base-unit qty (human-readable)
                    'unit_factor' => $unitFactor,
                    'base_unit' => $unitName ?: 'pcs',
                    'buying_price' => $buyingPrice,
                    'selling_price' => $sellingPrice,
                    'source_store' => $destinationStore->store_name,
                    'source_store_id' => $sourceStore->id,
                    'destination_store_id' => $destinationStore->id,
                    'reason' => $reasons,
                    'status' => 'pending',
                ]);
            }
            DB::commit();

            return redirect()->route('transfers.index')->with('success', 'Products transferred successfully.');
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback the transaction on error

            return back()->with('error', 'An error occurred: '.$e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $unique_id)
    {
        $d = $this->buildTransferDocument($unique_id);

        return Inertia::render('Admin/Transfers/Show', $d);
    }

    /**
     * Printable internal transfer document (source/destination stores, items,
     * quantities, transfer date, operator and both buying + selling prices).
     */
    public function printDocument(Request $request, string $unique_id)
    {
        $d = $this->buildTransferDocument($unique_id);

        if ($d['transfers']->isEmpty()) {
            abort(404, 'Transfer not found.');
        }

        if ($request->has('download')) {
            $pdf = \PDF::loadView('admin.transfers.print-document', $d);

            return $pdf->download('transfer-'.$unique_id.'.pdf');
        }

        return view('admin.transfers.print-document', $d);
    }

    /**
     * Shared data builder for the transfer detail screen and the printable
     * document. Resolves the real source/destination store names and layers
     * the internal pricing (buying + selling) onto every line.
     */
    private function buildTransferDocument(string $unique_id): array
    {
        $rows = Transfer::withoutGlobalScope('branch')
            ->where('unique_id', $unique_id)
            ->orderBy('id')
            ->get();

        $storeNames = Store::whereIn('id', $rows->pluck('source_store_id')
            ->merge($rows->pluck('destination_store_id'))
            ->filter()
            ->unique())
            ->pluck('store_name', 'id');

        $transfers = $rows->map(function ($t) use ($storeNames) {
            $factor = (float) ($t->unit_factor ?: 1);
            $qty = (float) $t->product_quantity;
            $buying = (float) ($t->buying_price ?? 0);
            $selling = (float) ($t->selling_price ?? 0);

            return [
                'id' => $t->id,
                'unique_id' => $t->unique_id,
                'product_id' => $t->product_id,
                'product_name' => $t->product_name,
                'product_quantity' => $qty,
                'unit_factor' => $factor,
                'base_unit' => $t->base_unit ?: 'pcs',
                'raw_pieces' => (int) round($qty * $factor),
                'buying_price' => $buying,
                'selling_price' => $selling,
                'buying_value' => $buying * $qty,
                'selling_value' => $selling * $qty,
                'expected_profit' => ($selling - $buying) * $qty,
                'reason' => $t->reason,
                'status' => $t->status,
                'staff_name' => $t->staff_name,
                'staff_recommeded' => $t->staff_recommeded,
                'created_at' => $t->created_at,
                'source_store_name' => $storeNames[$t->source_store_id] ?? $t->store_name,
                'destination_store_name' => $storeNames[$t->destination_store_id] ?? $t->source_store,
            ];
        });

        $first = $transfers->first();

        return [
            'transfers' => $transfers,
            'summary' => [
                'unique_id' => $unique_id,
                'source_store' => $first['source_store_name'] ?? null,
                'destination_store' => $first['destination_store_name'] ?? null,
                'staff_name' => $first['staff_name'] ?? null,
                'staff_recommeded' => $first['staff_recommeded'] ?? null,
                'status' => $first['status'] ?? null,
                'created_at' => $first['created_at'] ?? null,
                'total_quantity' => $transfers->sum('product_quantity'),
                'total_buying_value' => $transfers->sum('buying_value'),
                'total_selling_value' => $transfers->sum('selling_value'),
                'total_expected_profit' => $transfers->sum('expected_profit'),
                'line_count' => $transfers->count(),
            ],
        ];
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

    public function confirm(string $unique_id)
    {
        $updated = Transfer::withoutGlobalScope('branch')
            ->where('unique_id', $unique_id)
            ->where('status', 'pending')
            ->update(['status' => 'confirmed']);

        if (! $updated) {
            return back()->with('error', 'Transfer not found or already processed.');
        }

        return back()->with('success', 'Transfer confirmed successfully.');
    }

    public function cancel(string $unique_id)
    {
        $records = Transfer::withoutGlobalScope('branch')
            ->where('unique_id', $unique_id)
            ->where('status', 'pending')
            ->get();

        if ($records->isEmpty()) {
            return back()->with('error', 'Transfer not found or already processed.');
        }

        DB::beginTransaction();
        try {
            foreach ($records as $record) {
                // Reverse: move raw pieces back from destination → source
                $rawReverseQty = (int) round($record->product_quantity * ($record->unit_factor ?? 1));
                $reversed = $this->inventoryService->transferStock(
                    $record->product_id,
                    $record->destination_store_id,
                    $record->source_store_id,
                    $rawReverseQty
                );

                if (! $reversed) {
                    throw new \Exception("Could not reverse stock for {$record->product_name}. Destination store may not have enough stock.");
                }
            }

            Transfer::withoutGlobalScope('branch')
                ->where('unique_id', $unique_id)
                ->update(['status' => 'cancelled']);

            DB::commit();

            return back()->with('success', 'Transfer cancelled and stock reversed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Cancellation failed: '.$e->getMessage());
        }
    }

    public function destroyBatch(string $unique_id)
    {
        $records = Transfer::withoutGlobalScope('branch')
            ->where('unique_id', $unique_id)
            ->get();

        if ($records->isEmpty()) {
            return back()->with('error', 'Transfer not found.');
        }

        // If still pending, reverse inventory before deleting
        if ($records->first()->status === 'pending' || $records->first()->status === null) {
            DB::beginTransaction();
            try {
                foreach ($records as $record) {
                    $rawReverseQty = (int) round($record->product_quantity * ($record->unit_factor ?? 1));
                    $this->inventoryService->transferStock(
                        $record->product_id,
                        $record->destination_store_id,
                        $record->source_store_id,
                        $rawReverseQty
                    );
                }
                Transfer::withoutGlobalScope('branch')->where('unique_id', $unique_id)->delete();
                DB::commit();

                return back()->with('success', 'Transfer deleted and stock reversed successfully.');
            } catch (\Exception $e) {
                DB::rollBack();

                return back()->with('error', 'Delete failed: '.$e->getMessage());
            }
        }

        // Confirmed or cancelled — just delete the records
        Transfer::withoutGlobalScope('branch')->where('unique_id', $unique_id)->delete();

        return back()->with('success', 'Transfer record deleted.');
    }

    public function getStoreProducts($storeId)
    {
        try {
            Log::info('Fetching products for store: '.$storeId);

            $products = Product::withoutGlobalScope('branch')
                ->with(['productManagement'])
                ->orderBy('product_name')
                ->get()
                ->map(function ($product) use ($storeId) {
                    $rawQty = $this->inventoryService->getInventoryQuantity($product->id, $storeId);
                    $pm = $product->productManagement;
                    $rawUnits = $pm?->sale_units ?? [];
                    $pmUnits = is_array($rawUnits) ? $rawUnits : (json_decode($rawUnits, true) ?? []);
                    $unitName = $pm?->unit_name ?? 'pcs';

                    // Convert to display unit (e.g. 34300 pcs → 1715 Catton)
                    $factor = 1.0;
                    $unitLower = strtolower(trim($unitName));
                    foreach ($pmUnits as $su) {
                        if (strtolower(trim($su['unit_name'] ?? $su['name'] ?? '')) === $unitLower) {
                            $factor = max(1.0, (float) ($su['factor'] ?? 1));
                            break;
                        }
                    }
                    if ($factor === 1.0 && ! empty($pmUnits)) {
                        $factor = max(1.0, (float) ($pmUnits[0]['factor'] ?? 1));
                    }
                    $displayQty = $factor > 1 ? round($rawQty / $factor, 4) : $rawQty;

                    return [
                        'id' => $product->id,
                        'product_name' => $product->product_name,
                        'qty' => $displayQty,
                        'raw_qty' => $rawQty,
                        'unit' => $unitName,
                        'factor' => $factor,
                    ];
                })->filter(function ($p) {
                    return $p['raw_qty'] > 0;
                })->values();

            Log::info('Found '.count($products).' products.');

            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Error fetching store products: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
