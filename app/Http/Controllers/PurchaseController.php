<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\Store;
use App\Models\Supplier;
use App\Services\PurchaseService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    protected $purchaseService;

    public function __construct(PurchaseService $purchaseService)
    {
        $this->purchaseService = $purchaseService;
    }

    public function index()
    {
        return Inertia::render('Purchases/Index', [
            'purchases' => Purchase::with(['supplier', 'user', 'warehouse'])->latest()->paginate(20),
        ]);
    }

    public function printIndex(Request $request)
    {
        $purchases = Purchase::with(['supplier', 'user', 'warehouse'])->latest()->get();
        if ($request->has('download')) {
            $pdf = \PDF::loadView('admin.purchases.print-history', compact('purchases'));

            return $pdf->download('purchases-history.pdf');
        }

        return view('admin.purchases.print-history', compact('purchases'));
    }

    public function printReturns(Request $request)
    {
        $returns = PurchaseReturn::with(['purchase', 'product.productManagement', 'user'])->latest()->get();
        if ($request->has('download')) {
            $pdf = \PDF::loadView('admin.purchases.print-returns', compact('returns'));

            return $pdf->download('purchase-returns.pdf');
        }

        return view('admin.purchases.print-returns', compact('returns'));
    }

    public function printPriceHistory(Request $request)
    {
        $histories = ProductPriceHistory::with(['product.productManagement', 'user'])->latest()->get();
        if ($request->has('download')) {
            $pdf = \PDF::loadView('admin.purchases.print-price-history', compact('histories'));

            return $pdf->download('price-history.pdf');
        }

        return view('admin.purchases.print-price-history', compact('histories'));
    }

    public function show(Purchase $purchase)
    {
        $purchase->load(['supplier', 'user', 'warehouse', 'items.product.productManagement']);

        return Inertia::render('Purchases/Show', [
            'purchase' => $purchase,
        ]);
    }

    public function printShow(Purchase $purchase)
    {
        $purchase->load(['supplier', 'user', 'warehouse', 'items.product.productManagement']);

        return view('admin.purchases.print-show', compact('purchase'));
    }

    public function downloadPDF(Purchase $purchase)
    {
        $purchase->load(['supplier', 'user', 'warehouse', 'items.product.productManagement']);
        $pdf = \PDF::loadView('admin.purchases.pdf-show', compact('purchase'));

        return $pdf->download('purchase-'.$purchase->purchase_number.'.pdf');
    }

    public function create()
    {
        return Inertia::render('Purchases/Create', [
            'suppliers' => Supplier::all(),
            'warehouses' => Store::all(),
            'products' => Product::with('productManagement')->get(),
        ]);
    }

    public function store(Request $request, PurchaseService $purchaseService)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:stores,id',
            'purchase_date' => 'required|date',
            'reference_number' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.buying_price' => 'required|numeric|min:0',
            'items.*.selling_price' => 'required|numeric|min:0',
        ]);

        try {
            $purchase = $purchaseService->createPurchase($validated);

            return redirect()->route('purchases.show', $purchase)->with('success', 'Purchase created successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function edit(Purchase $purchase)
    {
        if (in_array($purchase->status, ['Received', 'Completed'])) {
            return back()->with('error', 'Cannot edit a completed purchase.');
        }

        $purchase->load(['items.product.productManagement', 'supplier', 'warehouse']);

        return Inertia::render('Purchases/Edit', [
            'purchase' => $purchase,
            'suppliers' => Supplier::all(),
            'warehouses' => Store::all(),
            'products' => Product::with('productManagement')->get(),
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'nullable|exists:stores,id',
            'total_amount' => 'required|numeric',
            'purchase_date' => 'required|date',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.buying_price' => 'required|numeric',
            'items.*.total' => 'required|numeric',
        ]);

        try {
            $this->purchaseService->updatePurchase($purchase, $request->all());

            return redirect()->route('purchases.index')->with('success', 'Purchase updated successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function destroy(Purchase $purchase)
    {
        try {
            $this->purchaseService->deletePurchase($purchase);

            return redirect()->route('purchases.index')->with('success', 'Purchase deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function markAsReceived(Purchase $purchase)
    {
        if (in_array($purchase->status, ['Completed', 'Received'])) {
            return back()->with('error', 'Purchase is already completed.');
        }

        try {
            \DB::beginTransaction();
            $purchase->update(['status' => 'Completed']);
            $this->purchaseService->receivePurchase($purchase);
            \DB::commit();

            return back()->with('success', 'Purchase marked as received and inventory updated!');
        } catch (\Exception $e) {
            \DB::rollBack();

            return back()->with('error', $e->getMessage());
        }
    }

    public function returns()
    {
        return Inertia::render('Purchases/Returns', [
            'returnsHistory' => PurchaseReturn::with(['purchase', 'product.productManagement', 'user'])->latest()->get(),
        ]);
    }

    public function createReturn()
    {
        return Inertia::render('Purchases/CreateReturn', [
            'purchases' => Purchase::where('status', 'Completed')->with(['supplier', 'items.product.productManagement'])->latest()->get(),
        ]);
    }

    public function storeReturn(Request $request)
    {
        $validated = $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'items' => 'required|array',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.quantity_returned' => 'required|numeric|min:1',
            'items.*.reason' => 'nullable|string',
        ]);

        $purchase = Purchase::findOrFail($request->purchase_id);
        $this->purchaseService->processReturn($purchase, $request->all());

        return redirect()->route('purchases.returns')->with('success', 'Return processed successfully.');
    }

    public function priceHistory()
    {
        $history = ProductPriceHistory::with(['product.productManagement', 'user'])->latest()->paginate(50);

        return Inertia::render('Purchases/PriceHistory', [
            'history' => $history->items(),
        ]);
    }
}
