<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Loan;
use App\Models\Inventory;
use App\Models\User;
use App\Models\Export;
use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class ExportController extends Controller
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
        $currentDate = Carbon::now()->format('Y-m-d');

        // Start building the query
        $query = Export::selectRaw('
                unique_id,
                tin,
                customer_name,
                staff_name,
                phone,
                sale_mode,
                payment_date,
                status,
                is_checked,
                created_at,
                SUM(product_quantity) as total_quantity,
                SUM(product_price) as total_price
            ')
            ->where('is_checked', true)

            ->groupBy('unique_id', 'tin', 'is_checked', 'customer_name', 'staff_name', 'phone', 'created_at', 'sale_mode', 'payment_date', 'status')
            ->orderBy('id', 'desc')
            ->filter(request(['search']));

        // Apply date filter based on the request or default to today's date
        if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        } else {
            $query->whereDate('created_at', $currentDate);
        }

        // Execute the query to fetch the exports
        $exports = $query->get();

        // Calculate totals
        $d['exports'] = $exports;
        $d['totalItems'] = $exports->count();
        $d['totalAmount'] = $exports->sum('total_price');

        return \Inertia\Inertia::render('Staff/ExportedProducts', $d);
    }

    public function exports_change_to_loan(Request $request, $unique_id)
    {

        $exportsQuery = Export::where('unique_id', $unique_id);
        $exports = $exportsQuery->get();

        if ($exports->isEmpty()) {
            return redirect()->back()->with('error', 'No exports found for the given unique ID.');
        }

        foreach ($exports as $export) {
            $totalAmount = $export->product_quantity * $export->unit_price;

            $recordData = [
                'unique_id' => $export->unique_id,
                'tin' => $export->tin,
                'product_id' => $export->product_id,
                'product_name' => $export->product_name,
                'customer_name' => $export->customer_name,
                'staff_name' => $export->staff_name,
                'product_quantity' => $export->product_quantity,
                'unit_price' => $export->unit_price,
                'product_price' => $export->product_price,
                'discount' => $export->discount,
                'phone' => $export->phone,
                'sale_mode' => $export->sale_mode,
                'payment_date' => $export->payment_date,
                'staff_recommeded' => $export->staff_recommeded,
                'total_amount' => $totalAmount,
                'balance' => $totalAmount,
                'is_checked' => true,
                'created_at'=>$export->created_at
            ];
            Loan::create($recordData);

            $exportsQuery->delete();
        }
        return redirect()->route('loans.show', $unique_id);
    }


    public function edit_exports_status(Request $request, $unique_id)
    {
        $request->validate([
            'status' => 'required',
        ]);

        $exportsQuery = Export::where('unique_id', $unique_id);
        $exports = $exportsQuery->get();

        if ($exports->isEmpty()) {
            return redirect()->back()->with('error', 'No exports found for the given unique ID.'); 
        }
        foreach ($exports as $export) {
            $product = Inventory::where('product_id', $export->product_id)->first();
            if ($product) {
                $newQTY=$product->qty-$export->product_quantity;
                $product->update([
                    'qty'=>$newQTY,
                ]);
             }
              $export->update([
                'status' => $request->status,
                'is_checked' => true
            ]);
            // $this->inventoryService->adjustInventory(
            //     $export->product_id,
            //     $export->product_quantity,
            //     $export->store_id,
            //     'decrease',
            //     'Exported product for ' . $unique_id . 'by Full paid '
            // );
            $export->save();
        }
        $exportsQuery->update(['is_checked' => true]);
        return redirect()->back()->with('success', 'Transfer checked and stock updated successfully!');
    }


    public function fetchExportStatistics(Request $request)
    {
        $date = Carbon::parse($request->input('start_date', now()->toDateString()));
        $endDate = Carbon::parse($request->input('end_date', now()->toDateString()));

        // Fetch export data grouped by date and product
        $exports = Export::selectRaw('DATE(created_at) as export_date,
             product_name, SUM(product_quantity) as total_quantity')
            ->whereDate('created_at', $date)
            ->where('is_checked', true)
            ->groupBy('export_date', 'product_name')
            ->orderBy('export_date', 'asc')
            ->get();


        // Group data by export date
        $groupedExports = $exports->groupBy('export_date');

        // Extract unique dates for the X-axis (even for a single day)
        $dates = $groupedExports->keys()->toArray();

        // Extract unique product names
        $products = $exports->pluck('product_name')->unique();

        $series = [];

        // Build product data by date
        foreach ($products as $product) {
            $series[] = [
                'name' => $product,
                'data' => collect($dates)->mapWithKeys(function ($date) use ($groupedExports, $product) {
                    return [
                        $date => $groupedExports[$date]
                            ->where('product_name', $product)
                            ->sum('total_quantity')
                            ?: 0
                    ];
                })->values()->toArray()
            ];
        }

        return response()->json([
            'categories' => $dates,
            'series' => $series
        ]);
    }


    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'customer_name' => 'required|string|max:255',
            'tin' => 'nullable|string|max:255',
            'staff_recommeded' => 'nullable',
            'phone' => 'nullable|string|min:10|max:15',
            'sale_mode' => 'required|string|in:Paid,Loan',
            'payment_date' => 'required|date',
            'product_id.*' => 'required|string|max:255',
            'product_quantity.*' => 'required|integer|min:1',
            'discount.*' => 'nullable|numeric|min:0',
            'price_type.*' => 'nullable|string|in:unit_price,product_price',
        ]);

        DB::beginTransaction();

        try {
            $staffName = Auth::guard('web')->user()->staff_name;
            $uniqueId = 'ORD_' . mt_rand(10000000, 99999999);
            $isStaffRecommended = !empty($validatedData['staff_recommeded']);
            $isPaidMode = $validatedData['sale_mode'] === 'Paid';

            // Get basic product info first
            $products = Product::whereIn('id', $validatedData['product_id'])
                ->select('id', 'product_name', 'unit_price', 'product_price')
                ->get()
                ->keyBy('id');

            foreach ($validatedData['product_id'] as $index => $productId) {
                $product = $products[$productId] ?? null;
                if (!$product) {
                    throw new \Exception("Product with ID {$productId} not found.");
                }

                $quantity = $validatedData['product_quantity'][$index];
                $discount = $validatedData['discount'][$index] ?? 0;
                $priceType = $validatedData['price_type'][$index] ?? null;

                // Check inventory if not staff recommended
                $inventoryData = $this->inventoryService->getInventoryData($productId);
                if (!$isStaffRecommended) {

                    $inventoryQuantity = $this->inventoryService->getInventoryQuantity(
                        $productId,
                        $inventoryData->store_id
                    );


                    if ($inventoryQuantity < $quantity && !setting('allow_negative_stock', false)) {
                        throw new \Exception("Insufficient inventory for {$product->product_name}");
                    }

                    // Strict Guard for Manufactured Products
                    if ($product->product_type === 'manufactured' && $inventoryQuantity <= 0) {
                        throw new \Exception("No production stock available for manufactured product: {$product->product_name}");
                    }
                }

                // Calculate price
                $unitPrice = ($priceType === 'unit_price' && $product->unit_price > 1)
                    ? $product->unit_price
                    : $product->product_price;
                $totalAmount = $quantity * $unitPrice;

                // Prepare record data
                $recordData = [
                    'unique_id' => $uniqueId,
                    'tin' => $validatedData['tin'],
                    'product_id' => $productId,
                    'product_name' => $product->product_name,
                    'customer_name' => $validatedData['customer_name'],
                    'staff_name' => $staffName,
                    'product_quantity' => $quantity,
                    'unit_price' => $priceType === 'unit_price' ? $unitPrice : 0,
                    'product_price' => $priceType !== 'unit_price' ? $unitPrice : 0,
                    'discount' => $discount,
                    'phone' => $validatedData['phone'],
                    'sale_mode' => $validatedData['sale_mode'],
                    'payment_date' => $validatedData['payment_date'],
                    'staff_recommeded' => $validatedData['staff_recommeded'],
                ];

                if ($isPaidMode) {
                    if (!$isStaffRecommended) {
                        $this->inventoryService->adjustInventory(
                            $productId,
                            $quantity,
                            $inventoryData->store_id,
                            'decrease',
                            'Exported product for ' . $uniqueId . 'by Full paid '
                        );
                        $recordData['status'] = 'Checked';
                    }
                    Export::create($recordData);
                } else { // Loan mode
                    $recordData['total_amount'] = $totalAmount - $discount;
                    $recordData['balance'] = $totalAmount;
                    if (!$isStaffRecommended) {
                        $this->inventoryService->adjustInventory(
                            $productId,
                            $quantity,
                            $inventoryData->store_id,
                            'decrease',
                            'Exported product for ' . $uniqueId . 'by Loan '
                        );
                        $recordData['status'] = 'Pending';
                        $recordData['is_checked'] = true;
                    }
                    Loan::create($recordData);
                }
            }

            DB::commit();
            return back()->with('success', 'Sales recorded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }


    public function exports_add_more(Request $request)
    {
        $validatedData = $request->validate([
            'product_id.*' => 'required|string|max:255',
            'product_quantity.*' => 'required|integer|min:1',
            'discount.*' => 'nullable|numeric|min:0',
            'price_type.*' => 'nullable|string|in:unit_price,product_price',
            'order_id' => 'nullable',
        ]);

        DB::beginTransaction();

        try {
            $uniqueId = $validatedData['order_id'];
            $isStaffRecommended = !empty($validatedData['staff_recommeded']);

            // Get basic product info first
            $products = Product::whereIn('id', $validatedData['product_id'])
                ->select('id', 'product_name', 'unit_price', 'product_price')
                ->get()
                ->keyBy('id');

            foreach ($validatedData['product_id'] as $index => $productId) {
                $product = $products[$productId] ?? null;
                if (!$product) {
                    throw new \Exception("Product with ID {$productId} not found.");
                }

                $quantity = $validatedData['product_quantity'][$index];
                $discount = $validatedData['discount'][$index] ?? 0;
                $priceType = $validatedData['price_type'][$index] ?? null;

                $inventoryData = $this->inventoryService->getInventoryData($productId);

                // Check inventory if not staff recommended
                if (!$isStaffRecommended) {
                    $inventoryQuantity = $this->inventoryService->getInventoryQuantity(
                        $productId,
                        $inventoryData->store_id
                    );


                    if ($inventoryQuantity < $quantity && !setting('allow_negative_stock', false)) {
                        throw new \Exception("Insufficient inventory for {$product->product_name}");
                    }
                }

                // Calculate price
                $unitPrice = ($priceType === 'unit_price' && $product->unit_price > 1)
                    ? $product->unit_price
                    : $product->product_price;
                $exportData = Export::where('unique_id', $uniqueId)->first();
                // Prepare record data
                $recordData = [
                    'unique_id' => $uniqueId,
                    'tin' => $exportData->tin,
                    'product_id' => $productId,
                    'product_name' => $product->product_name,
                    'customer_name' => $exportData->customer_name,
                    'staff_name' => $exportData->staff_name,
                    'product_quantity' => $quantity,
                    'unit_price' => $priceType === 'unit_price' ? $unitPrice : 0,
                    'product_price' => $priceType !== 'unit_price' ? $unitPrice : 0,
                    'discount' => $discount,
                    'phone' => $exportData->phone,
                    'sale_mode' => $exportData->sale_mode,
                    'payment_date' => $exportData->payment_date,
                    'staff_recommeded' => $exportData->staff_recommeded,
                    'status' => $exportData->status,
                    'is_checked' => $exportData->is_checked,
                ];

                $this->inventoryService->adjustInventory(
                    $productId,
                    $quantity,
                    $inventoryData->store_id,
                    'decrease',
                    'Exported product for ' . $uniqueId . 'by Full paid '
                );
                Export::create($recordData);
            }

            DB::commit();
            return back()->with('success', 'Sales recorded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    public function show(string $unique_id)
    {
        $exports = Export::where('unique_id', $unique_id);
        // $d['products'] = Product::withSum('inventories as product_quantity', 'qty')
        //     ->orderBy('product_name', 'asc')
        //     ->get();

        $d['products'] = Product::with(['inventories.store'])
            ->orderBy('product_name', 'asc')
            ->get();

        $d['users'] = User::whereNot('role_id', 4)->get();

        return \Inertia\Inertia::render('Admin/Exports/Print', [
            'exports' => $exports->get(),
            'unique_id' => $unique_id,
            'exports_detail' => $exports->first(),
        ], $d);
    }


    public function check(string $unique_id)
    {
        $exports = Export::where('unique_id', $unique_id);

        return \Inertia\Inertia::render('Admin/Exports/Show', [
            'unique_id' => $unique_id,
            'exports' => $exports->get(),
            'exports_detail' => $exports->first(),
            'showCheck' => true
        ]);
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $unique_id)
    {
        $exports = Export::where('unique_id', $unique_id);

        return \Inertia\Inertia::render('Admin/Exports/Edit', [
            'unique_id' => $unique_id,
            'exports' => $exports->get(),
            'exports_detail' => $exports->first(),
            'showCheck' => true
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $unique_id)
    {
        foreach ($request->order_id as $index => $orderId) {
            $quantity = $request->quantity[$index];
            // $staff_recommeded = $request->staff_recommeded;
            $discount = $request->discount[$index];
            $cart = Export::where('unique_id', $unique_id)
                ->where('id', $orderId)
                ->first();
            if ($cart) {
                $cart->product_quantity = $quantity;
                // $cart->staff_recommeded = $staff_recommeded;
                $cart->discount = $discount * $quantity;
                $cart->save();
            } else {
                throw new \Exception("Order with ID $orderId not found for the unique_id $unique_id.");
            }
        }
        return back()->with('success', 'Order Updated');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $unique_id)
    {
        $exports = Export::where('unique_id', $unique_id)->get();
        try {
            foreach ($exports as $export) {

                $export->delete();
            }
            return back()->with('success', 'Order Deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred. Please try again.');
        }
    }

    public function reports(Request $request)
    {
        // Fetch all exports with filtering
        $d['exports'] = Export::filter(request(['search']))
            ->get();

        // Return the view with calculated values
        return \Inertia\Inertia::render('Admin/Exports/Reports', $d);
    }
}
