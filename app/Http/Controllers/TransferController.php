<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Loan;
use App\Models\Store;
use App\Models\Export;
use App\Models\Product;
use App\Models\Transfer;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

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
        $d['users'] = \App\Models\User::where('staff_email', '!=', 'developer@gmail.com')->get();

        return \Inertia\Inertia::render('Admin/Transfers/All', $d);
    }


    public function reports(Request $request)
    {
        // dd($request->all());
        $d['transfers'] = $transfers = $this->getTransferData($request, true);
        $d['totalQuantity'] = $transfers->sum('total_quantity');

        return \Inertia\Inertia::render('Admin/Transfers/Reports', $d);
    }


    private function getTransferData($request, $getAll = false)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $query = Transfer::selectRaw('
                unique_id,
                source_store,
                store_name as destination_store,
                staff_name,
                staff_recommeded,
                created_at,
                SUM(product_quantity) as total_quantity
            ')
            ->groupBy('unique_id', 'source_store', 'destination_store', 'created_at', 'staff_name', 'staff_recommeded')
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
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        $validatedData = $request->validate([
            'store_name' => 'required', // destination_store_id
            'source_store' => 'required', //source_store_id
            'staff_recommeded' => 'required',
            'product_id.*' => 'required',
            'product_quantity.*' => 'required|integer|min:1',
            'reason' => 'required|max:255'
        ]);

        DB::beginTransaction(); // Start the transaction

        try {
            $uniqueId = 'ORD_' . mt_rand(10000000, 99999999);

            foreach ($validatedData['product_id'] as $index => $productId) {
                $product = $products[$productId] ?? null;

                $sourceStoreId = $validatedData['source_store'];
                $destinationStoreId = $validatedData['store_name'];

                $sourceStore = Store::find($sourceStoreId);
                $destinationStore = Store::find($destinationStoreId);


                $staffRecommended = $validatedData['staff_recommeded'];

                $productQuantity = $validatedData['product_quantity'][$index];
                $reasons = $validatedData['reason'];
                $staffName = Auth::guard('web')->user()->staff_name;


                // Check product availability
                $product = Product::find($productId);

                $productName = $product->product_name;
                $inventoryQuantity = $this->inventoryService->getInventoryQuantity(
                    $productId,
                    $sourceStoreId
                );


                if ($inventoryQuantity < $productQuantity) {
                    throw new \Exception("Insufficient inventory for {$product->product_name}");
                }

                // Transfer stock using the new atomic method
                $this->inventoryService->transferStock(
                    $productId, 
                    $productQuantity, 
                    $sourceStoreId, 
                    $destinationStoreId, 
                    'finished_product', 
                    null // referenceId will be linked via individual transfer records below if needed
                );

                Transfer::create([
                    'unique_id' => $uniqueId,
                    'product_id' => $productId,
                    'product_name' => $productName,
                    'staff_name' => $staffName,
                    'store_name' => $sourceStore->store_name, // Note: The columns seem swapped in the original code but following the existing pattern
                    'staff_recommeded' => $staffRecommended,
                    'product_quantity' => $productQuantity,
                    'source_store' => $destinationStore->store_name,
                    'source_store_id' => $sourceStore->id,
                    'destination_store_id' => $destinationStore->id,
                    'reason' => $reasons,
                ]);
            }
            DB::commit(); // Commit the transaction
            return back()->with('success', 'Product transferred successfully.');
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback the transaction on error
            return back()->with('error', 'An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $unique_id)
    {
        $d['transfers'] = Transfer::where('unique_id', $unique_id)->get();
        return \Inertia\Inertia::render('Admin/Transfers/Show', $d);
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

    public function getStoreProducts($storeId)
    {
        try {
            \Illuminate\Support\Facades\Log::info("Fetching products for store: " . $storeId);
            
            $products = \App\Models\Product::orderBy('product_name')->get()
                ->map(function($product) use ($storeId) {
                    return [
                        'id' => $product->id,
                        'product_name' => $product->product_name,
                        'qty' => $this->inventoryService->getInventoryQuantity($product->id, $storeId)
                    ];
                })->filter(function($p) {
                    return $p['qty'] > 0;
                })->values();

            \Illuminate\Support\Facades\Log::info("Found " . count($products) . " products.");

            return response()->json($products);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error fetching store products: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
