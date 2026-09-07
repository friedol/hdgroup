<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FulfillmentController extends Controller
{
    /**
     * Orders assigned to the current user (or all, if manager).
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        $branchId = session('active_branch_id') ?? $user->branch_id;

        $query = Sale::with([
            'items' => fn ($q) => $q->withoutGlobalScope('branch'),
            'items.product',
            'items.fulfilledBy',
            'posCustomer',
            'assignedUser',
        ])
            ->where('is_return', false)
            ->whereNotNull('assigned_to')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        // Non-managers see only their own assignments
        if (! $user->hasPermission('users.manage')) {
            $query->where('assigned_to', $user->id);
        }

        if ($request->filled('search')) {
            $query->where('invoice_number', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status')) {
            $query->where('payment_status', $request->status);
        }

        $orders = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        $mappedOrders = $orders->through(function ($sale) {
            $items = $sale->items->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->product?->product_name ?? 'Item',
                'qty' => (float) $i->quantity,
                'fulfillment_status' => $i->fulfillment_status ?? 'pending',
                'fulfilled_by' => $i->fulfilledBy?->staff_name,
                'fulfilled_at' => $i->fulfilled_at
                    ? Carbon::parse($i->fulfilled_at)->format('d M Y g:i A')
                    : null,
                'source_store' => $i->source_store_name,
            ]);

            $allStatuses = $items->pluck('fulfillment_status');
            $overallStatus = 'pending';
            if ($allStatuses->every(fn ($s) => $s === 'checked')) {
                $overallStatus = 'checked';
            } elseif ($allStatuses->contains(fn ($s) => in_array($s, ['picked', 'processed', 'checked']))) {
                $overallStatus = 'in_progress';
            }

            return [
                'id' => $sale->id,
                'invoice' => $sale->invoice_number,
                'customer' => $sale->posCustomer?->customer_name ?? 'Walking Customer',
                'assigned_to' => $sale->assigned_to_name ?? $sale->assignedUser?->staff_name,
                'date' => $sale->created_at->format('d M Y'),
                'time' => $sale->created_at->format('g:i A'),
                'items_count' => $items->count(),
                'overall_status' => $overallStatus,
                'items' => $items->values(),
            ];
        });

        return Inertia::render('Admin/Fulfillment/Index', [
            'orders' => $mappedOrders,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Order detail page with item-level fulfillment controls.
     */
    public function show(string $invoice)
    {
        /** @var User $user */
        $user = Auth::user();
        $branchId = session('active_branch_id') ?? $user->branch_id;

        $sale = Sale::withoutGlobalScope('branch')
            ->with([
                'items' => fn ($q) => $q->withoutGlobalScope('branch'),
                'items.product',
                'items.fulfilledBy',
                'posCustomer',
                'assignedUser',
                'cashier',
            ])
            ->where('invoice_number', $invoice)
            ->firstOrFail();

        // Gate: only the assigned user or managers may see this
        if ($sale->assigned_to && $sale->assigned_to !== $user->id && ! $user->hasPermission('users.manage')) {
            abort(403, 'You are not authorized to view this order.');
        }

        $items = $sale->items
            ->filter(fn ($i) => $i->quantity > 0)
            ->map(fn ($i) => [
                'id' => $i->id,
                'product_id' => $i->product_id,
                'name' => $i->product?->product_name ?? 'Item',
                'variant_color' => $i->variant_color,
                'print_type' => $i->print_type,
                'qty' => (float) $i->quantity,
                'unit_price' => (float) $i->unit_price,
                'source_store' => $i->source_store_name,
                'fulfillment_status' => $i->fulfillment_status ?? 'pending',
                'fulfilled_by' => $i->fulfilledBy?->staff_name,
                'fulfilled_at' => $i->fulfilled_at
                    ? Carbon::parse($i->fulfilled_at)->format('d M Y g:i A')
                    : null,
            ])
            ->values(); // re-index so Inertia serialises as JSON array, not object

        return Inertia::render('Admin/Fulfillment/Show', [
            'sale' => [
                'id' => $sale->id,
                'invoice' => $sale->invoice_number,
                'customer' => $sale->posCustomer?->customer_name ?? 'Walking Customer',
                'cashier' => $sale->cashier?->staff_name ?? 'System',
                'assigned_to' => $sale->assigned_to_name ?? $sale->assignedUser?->staff_name,
                'date' => $sale->created_at->format('d M Y'),
                'time' => $sale->created_at->format('g:i A'),
                'payable' => (float) $sale->payable_amount,
                'status' => $sale->payment_status,
                'items' => $items,
            ],
        ]);
    }

    /**
     * Update fulfillment status for a single sale item.
     */
    public function updateItemStatus(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:sale_items,id',
            'status' => 'required|in:pending,picked,processed,checked',
        ]);

        /** @var User $user */
        $user = Auth::user();
        $item = SaleItem::withoutGlobalScope('branch')->with('sale')->findOrFail($validated['item_id']);

        // Gate: only the assigned user or managers may update
        if ($item->sale->assigned_to !== $user->id && ! $user->hasPermission('users.manage')) {
            return response()->json(['success' => false, 'message' => 'Not authorized.'], 403);
        }

        DB::beginTransaction();
        try {
            $item->update([
                'fulfillment_status' => $validated['status'],
                'fulfilled_by' => $user->id,
                'fulfilled_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Item status updated.',
                'fulfilled_by' => $user->staff_name,
                'fulfilled_at' => now()->format('d M Y g:i A'),
                'status' => $validated['status'],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk update all items for an order to a given status.
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'status' => 'required|in:pending,picked,processed,checked',
        ]);

        /** @var User $user */
        $user = Auth::user();
        $sale = Sale::findOrFail($validated['sale_id']);

        if ($sale->assigned_to !== $user->id && ! $user->hasPermission('users.manage')) {
            return response()->json(['success' => false, 'message' => 'Not authorized.'], 403);
        }

        DB::beginTransaction();
        try {
            SaleItem::withoutGlobalScope('branch')->where('sale_id', $sale->id)
                ->where('quantity', '>', 0)
                ->update([
                    'fulfillment_status' => $validated['status'],
                    'fulfilled_by' => $user->id,
                    'fulfilled_at' => now(),
                ]);

            DB::commit();

            return response()->json(['success' => true, 'message' => 'All items updated.']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
