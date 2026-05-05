<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\DeliveryPerson;
use App\Models\DeliveryItem;
use App\Models\DeliveryTracking;
use App\Models\Loan;
use App\Models\Export;
use App\Models\Cart;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    /**
     * Display delivery management dashboard
     */
    public function index(Request $request)
    {
        $query = Delivery::with(['deliveryPerson', 'assignedSaler:id,staff_name', 'items', 'latestTracking']);
        $statusFilter = $request->input('status');
        $search = trim((string) $request->input('search', ''));
        $driverId = $request->input('driver_id');

        // Search
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('delivery_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($statusFilter) {
            $normalizedStatusFilter = strtolower((string) $statusFilter);
            if ($normalizedStatusFilter === 'in_transit') {
                $normalizedStatusFilter = 'in-transit';
            }

            if ($normalizedStatusFilter === 'pending') {
                $query->whereIn('status', ['pending', 'Pending']);
            } elseif ($normalizedStatusFilter === 'in-transit') {
                $query->whereIn('status', ['in-transit', 'in_transit']);
            } else {
                $query->where('status', $normalizedStatusFilter);
            }
        }

        // Filter by delivery person
        if ($driverId) {
            $query->where('delivery_person_id', $driverId);
        }

        // Filter by date range
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        $deliveries = $query->latest()->paginate(15);

        $existingDeliveryNumbers = Delivery::query()
            ->pluck('delivery_number')
            ->filter()
            ->map(fn ($number) => (string) $number)
            ->all();

        $virtualRows = collect();

        $includeVirtualRows = !$driverId;
        if ($includeVirtualRows) {
            $onlineOrdersQuery = Cart::query()
                ->whereNotNull('unique_id')
                ->where('unique_id', '!=', '')
                ->whereNotIn('status', ['delivered', 'complete', 'completed', 'cancelled', 'rejected']);

            if ($search !== '') {
                $onlineOrdersQuery->where(function ($q) use ($search) {
                    $q->where('unique_id', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhere('phone_number', 'like', "%{$search}%");
                });
            }

            $onlineOrders = $onlineOrdersQuery
                ->get()
                ->groupBy('unique_id')
                ->map(function (Collection $rows, string $orderNumber) {
                    $first = $rows->first();
                    $normalized = $this->normalizeDeliveryStatus((string) ($first?->status ?? 'pending'));

                    $deliveryTotal = (float) $rows->sum(function ($row) {
                        $price = (float) ($row->price ?? 0);
                        $qty = (float) ($row->quantity ?? 0);
                        $discount = (float) ($row->discount ?? 0);
                        return ($price * $qty) - $discount;
                    });

                    return [
                        'id' => 'cart-' . $orderNumber,
                        'delivery_number' => $orderNumber,
                        'customer_name' => $first?->name ?? 'Guest Customer',
                        'phone' => $first?->phone_number ?? '-',
                        'delivery_address' => $first?->street ?? '-',
                        'delivery_cost' => 0,
                        'delivery_discount' => 0,
                        'delivery_total' => max(0, $deliveryTotal),
                        'status' => $normalized,
                        'priority' => 'normal',
                        'delivery_person' => null,
                        'assignment_mode' => null,
                        'assigned_saler' => null,
                        'external_partner' => null,
                        'created_at' => $first?->created_at,
                        'source' => 'online_order',
                    ];
                })
                ->reject(fn ($row) => in_array((string) ($row['delivery_number'] ?? ''), $existingDeliveryNumbers, true))
                ->filter(function ($row) use ($statusFilter) {
                    if (!$statusFilter) {
                        return true;
                    }

                    return $this->normalizeDeliveryStatus((string) ($row['status'] ?? 'pending')) === $statusFilter;
                })
                ->values();

            $salesQuery = Sale::with(['posCustomer:id,customer_name,customer_phone,business_address,brought_by'])
                ->whereNotIn('invoice_number', $existingDeliveryNumbers)
                ->orderByDesc('created_at');

            if ($search !== '') {
                $salesQuery->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                      ->orWhereHas('posCustomer', fn ($c) => $c->where('customer_name', 'like', "%{$search}%"));
                });
            }

            $salesOrders = $salesQuery
                ->limit(200)
                ->get()
                ->map(function ($sale) {
                    return [
                        'id' => 'sale-' . $sale->invoice_number,
                        'delivery_number' => $sale->invoice_number,
                        'customer_name' => $sale->posCustomer?->customer_name ?? 'Walking Customer',
                        'phone' => $sale->posCustomer?->customer_phone ?? '-',
                        'delivery_address' => $sale->posCustomer?->business_address ?? '-',
                        'delivery_cost' => 0,
                        'delivery_discount' => 0,
                        'delivery_total' => (float) ($sale->payable_amount ?? 0),
                        'status' => 'pending',
                        'priority' => 'normal',
                        'delivery_person' => null,
                        'assignment_mode' => null,
                        'assigned_saler' => null,
                        'assigned_saler_id' => $sale->posCustomer?->brought_by,
                        'external_partner' => null,
                        'created_at' => $sale->created_at,
                        'source' => 'sales_order',
                    ];
                })
                ->filter(function ($row) use ($statusFilter) {
                    if (!$statusFilter) {
                        return true;
                    }

                    return ((string) ($row['status'] ?? 'pending')) === $statusFilter;
                })
                ->values();

            $virtualRows = $onlineOrders->merge($salesOrders)->values();
        }

        if ($virtualRows->isNotEmpty()) {
            $deliveries->setCollection(
                collect($deliveries->items())
                    ->map(function ($delivery) {
                        $delivery->source = 'delivery';
                        return $delivery;
                    })
                    ->merge($virtualRows)
                    ->sortByDesc('created_at')
                    ->values()
            );
        }

        $drivers = DeliveryPerson::where('status', 'active')->get();
        $deliveryUsers = User::query()
            ->whereNotNull('staff_name')
            ->where(function ($q) {
                $q->whereHas('role', fn ($r) => $r->whereRaw('LOWER(role_name) like ?', ['%delivery%']))
                  ->orWhereHas('roles', fn ($r) => $r->whereRaw('LOWER(role_name) like ?', ['%delivery%']));
            })
            ->orderBy('staff_name')
            ->get(['id', 'staff_name']);

        $salers = User::query()
            ->whereNotNull('staff_name')
            ->where(function ($q) {
                $q->whereHas('role', fn ($r) => $r->whereRaw('LOWER(role_name) like ? or LOWER(role_name) like ?', ['%seller%', '%sale%']))
                  ->orWhereHas('roles', fn ($r) => $r->whereRaw('LOWER(role_name) like ? or LOWER(role_name) like ?', ['%seller%', '%sale%']));
            })
            ->orderBy('staff_name')
            ->get(['id', 'staff_name']);

        $virtualPendingCount = $virtualRows->where('status', 'pending')->count();
        $virtualTransitCount = $virtualRows->filter(function ($row) {
            $status = (string) ($row['status'] ?? '');
            return in_array($status, ['in-transit', 'in_transit'], true);
        })->count();

        $metrics = [
            'total_deliveries' => Delivery::count() + $virtualRows->count(),
            'pending_deliveries' => Delivery::whereIn('status', ['pending', 'Pending'])->count() + $virtualPendingCount,
            'in_transit_deliveries' => Delivery::whereIn('status', ['picked-up', 'in-transit', 'in_transit'])->count() + $virtualTransitCount,
            'completed_deliveries' => Delivery::where('status', 'delivered')->count(),
            'failed_deliveries' => Delivery::where('status', 'failed')->count(),
            'total_revenue' => Delivery::where('status', 'delivered')->sum('delivery_total'),
        ];

        return Inertia::render('Logistics/Delivery/Index', [
            'deliveries' => $deliveries,
            'drivers' => $drivers,
            'deliveryUsers' => $deliveryUsers,
            'salers' => $salers,
            'metrics' => $metrics,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'driver_id' => $request->input('driver_id'),
            ]
        ]);
    }

    public function assignOrder(Request $request)
    {
        $validated = $request->validate([
            'source_type' => 'required|in:delivery,online_order,sales_order',
            'order_number' => 'required|string',
            'assignment_mode' => 'required|in:delivery_personnel,bolt,saler',
            'delivery_person_id' => 'nullable|exists:delivery_people,id',
            'delivery_user_id' => 'nullable|exists:users,id',
            'saler_id' => 'nullable|exists:users,id',
        ]);

        if ($validated['assignment_mode'] === 'delivery_personnel' && empty($validated['delivery_user_id'])) {
            return back()->with('error', 'Select delivery personnel before assigning.');
        }

        if ($validated['assignment_mode'] === 'saler' && empty($validated['saler_id'])) {
            return back()->with('error', 'Select a saler before assigning.');
        }

        $orderNumber = trim($validated['order_number']);
        $sourceType = $validated['source_type'];

        $hasAssignmentModeColumn = Schema::hasColumn('deliveries', 'assignment_mode');
        $hasAssignedSalerColumn = Schema::hasColumn('deliveries', 'assigned_saler_id');
        $hasExternalPartnerColumn = Schema::hasColumn('deliveries', 'external_partner');

        $delivery = Delivery::where('delivery_number', $orderNumber)->first();

        if (!$delivery) {
            $seed = $this->resolveSourceOrderSeed($sourceType, $orderNumber);
            if (!$seed) {
                return back()->with('error', 'Order not found for delivery assignment.');
            }

            $delivery = Delivery::create([
                'delivery_number' => $orderNumber,
                'delivery_person_id' => null,
                ...($hasAssignmentModeColumn ? ['assignment_mode' => $validated['assignment_mode']] : []),
                ...($hasAssignedSalerColumn ? [
                    'assigned_saler_id' => $validated['assignment_mode'] === 'delivery_personnel'
                        ? $validated['delivery_user_id']
                        : ($validated['assignment_mode'] === 'saler' ? $validated['saler_id'] : null),
                ] : []),
                ...($hasExternalPartnerColumn ? ['external_partner' => $validated['assignment_mode'] === 'bolt' ? 'bolt' : null] : []),
                'delivery_type' => $seed['delivery_type'],
                'customer_name' => $seed['customer_name'],
                'phone' => $seed['phone'],
                'email' => $seed['email'],
                'delivery_address' => $seed['delivery_address'],
                'delivery_zone' => null,
                'delivery_cost' => 0,
                'delivery_discount' => 0,
                'delivery_total' => $seed['delivery_total'],
                'payment_method' => $seed['payment_method'],
                'status' => 'assigned',
                'priority' => 'normal',
                'scheduled_date' => null,
                'notes' => 'Assigned from Deliveries Management',
                'branch_id' => auth()->user()?->branch_id,
                'created_by' => auth()->user()?->name ?? 'system',
            ]);

            DeliveryTracking::create([
                'delivery_id' => $delivery->id,
                'status' => 'assigned',
                'notes' => 'Assigned from Deliveries Management',
                'updated_by' => auth()->user()?->name ?? 'system',
            ]);
        } else {
            $delivery->update([
                'delivery_person_id' => null,
                ...($hasAssignmentModeColumn ? ['assignment_mode' => $validated['assignment_mode']] : []),
                ...($hasAssignedSalerColumn ? [
                    'assigned_saler_id' => $validated['assignment_mode'] === 'delivery_personnel'
                        ? $validated['delivery_user_id']
                        : ($validated['assignment_mode'] === 'saler' ? $validated['saler_id'] : null),
                ] : []),
                ...($hasExternalPartnerColumn ? ['external_partner' => $validated['assignment_mode'] === 'bolt' ? 'bolt' : null] : []),
            ]);

            if ($delivery->status === 'pending') {
                $delivery->updateStatus('assigned', 'Assigned from Deliveries Management');
            }
        }

        if ($sourceType === 'online_order') {
            Cart::where('unique_id', $orderNumber)->update([
                'status' => 'processing',
            ]);
        }

        return back()->with('success', 'Order assigned successfully.');
    }

    /**
     * Show create delivery form
     */
    public function create(Request $request)
    {
        $drivers = DeliveryPerson::where('status', 'active')->get();
        $orderType = $request->input('type', 'loan'); // loan, export, online_order
        $orderId = $request->input('order_id');

        $order = [];
        if ($orderId) {
            if ($orderType === 'loan') {
                $order = Loan::find($orderId);
            } elseif ($orderType === 'export') {
                $order = Export::find($orderId);
            } elseif ($orderType === 'online_order') {
                $order = Cart::where('unique_id', $orderId)->orWhere('id', $orderId)->first();
            }
        }

        return Inertia::render('Logistics/Delivery/Create', [
            'drivers' => $drivers,
            'orderType' => $orderType,
            'order' => $order,
        ]);
    }

    /**
     * Store a new delivery
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'delivery_type' => 'required|in:loan,export,online_order',
            'customer_name' => 'required|string',
            'phone' => 'required|string',
            'email' => 'nullable|email',
            'delivery_address' => 'required|string',
            'delivery_zone' => 'nullable|string',
            'delivery_cost' => 'required|numeric|min:0',
            'delivery_discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string',
            'delivery_person_id' => 'nullable|exists:delivery_people,id',
            'priority' => 'nullable|in:normal,urgent,scheduled',
            'scheduled_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|integer',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // Generate unique delivery number
        $deliveryNumber = Delivery::generateDeliveryNumber();

        // Calculate totals
        $deliveryTotal = $validated['delivery_cost'] - ($validated['delivery_discount'] ?? 0);

        // Create delivery
        $delivery = Delivery::create([
            'delivery_number' => $deliveryNumber,
            'delivery_person_id' => $validated['delivery_person_id'] ?? null,
            'delivery_type' => $validated['delivery_type'],
            'customer_name' => $validated['customer_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'delivery_address' => $validated['delivery_address'],
            'delivery_zone' => $validated['delivery_zone'] ?? null,
            'delivery_cost' => $validated['delivery_cost'],
            'delivery_discount' => $validated['delivery_discount'] ?? 0,
            'delivery_total' => $deliveryTotal,
            'payment_method' => $validated['payment_method'],
            'status' => 'Pending',
            'priority' => $validated['priority'] ?? 'normal',
            'scheduled_date' => $validated['scheduled_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'branch_id' => auth()->user()?->branch_id,
            'created_by' => auth()->user()?->name ?? 'system',
        ]);

        // Create delivery items
        $totalItemsValue = 0;
        foreach ($validated['items'] as $item) {
            $itemTotal = $item['quantity'] * $item['unit_price'];
            $totalItemsValue += $itemTotal;

            DeliveryItem::create([
                'delivery_id' => $delivery->id,
                'item_type' => $validated['delivery_type'],
                'item_id' => $item['item_id'],
                'product_name' => $item['product_name'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $itemTotal,
            ]);
        }

        // Create initial tracking record
        DeliveryTracking::create([
            'delivery_id' => $delivery->id,
            'status' => 'Pending',
            'notes' => 'Delivery created',
            'updated_by' => auth()->user()?->name ?? 'system',
        ]);

        // Update related order with delivery info
        $this->updateRelatedOrder($validated['delivery_type'], $validated['items'][0]['item_id'] ?? null, $delivery);

        return redirect("/deliveries/{$delivery->id}")
            ->with('success', "Delivery {$deliveryNumber} created successfully!");
    }

    /**
     * Show delivery details
     */
    public function show(Delivery $delivery)
    {
        $delivery->load(['deliveryPerson', 'items', 'tracking']);

        return Inertia::render('Logistics/Delivery/Show', [
            'delivery' => $delivery,
            'tracking' => $delivery->tracking,
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(Delivery $delivery)
    {
        $drivers = DeliveryPerson::where('status', 'active')->get();

        return Inertia::render('Logistics/Delivery/Edit', [
            'delivery' => $delivery->load(['items', 'deliveryPerson']),
            'drivers' => $drivers,
        ]);
    }

    /**
     * Update delivery
     */
    public function update(Request $request, Delivery $delivery)
    {
        // Only allow editing if not delivered/failed/cancelled
        if (in_array($delivery->status, ['delivered', 'failed', 'cancelled'])) {
            return back()->with('error', 'Cannot edit completed/cancelled deliveries');
        }

        $validated = $request->validate([
            'delivery_person_id' => 'nullable|exists:delivery_people,id',
            'delivery_address' => 'required|string',
            'delivery_cost' => 'required|numeric|min:0',
            'delivery_discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string',
            'priority' => 'nullable|in:normal,urgent,scheduled',
            'scheduled_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $deliveryTotal = $validated['delivery_cost'] - ($validated['delivery_discount'] ?? 0);

        $delivery->update([
            'delivery_person_id' => $validated['delivery_person_id'],
            'delivery_address' => $validated['delivery_address'],
            'delivery_cost' => $validated['delivery_cost'],
            'delivery_discount' => $validated['delivery_discount'] ?? 0,
            'delivery_total' => $deliveryTotal,
            'payment_method' => $validated['payment_method'],
            'priority' => $validated['priority'] ?? 'normal',
            'scheduled_date' => $validated['scheduled_date'],
            'notes' => $validated['notes'],
        ]);

        return back()->with('success', 'Delivery updated successfully!');
    }

    /**
     * Update delivery status
     */
    public function updateStatus(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,assigned,picked-up,in-transit,delivered,failed,cancelled',
            'notes' => 'nullable|string',
            'location' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'photo' => 'nullable|file|image|max:5120',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('delivery-proofs', 'public');
        }

        // Update delivery status
        $delivery->updateStatus(
            $validated['status'],
            $validated['notes'] ?? null,
            $validated['location'] ?? null
        );

        // Update tracking with photo and coordinates
        $tracking = $delivery->latestTracking()->first();
        if ($tracking && $photoPath) {
            $tracking->update(['photo' => $photoPath]);
        }

        if ($validated['latitude'] && $validated['longitude']) {
            $tracking->update([
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
            ]);
        }

        return back()->with('success', 'Delivery status updated to ' . $validated['status']);
    }

    /**
     * Assign delivery to driver
     */
    public function assignDriver(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'delivery_person_id' => 'required|exists:delivery_people,id',
        ]);

        $delivery->update([
            'delivery_person_id' => $validated['delivery_person_id'],
        ]);

        $delivery->updateStatus('assigned', 'Assigned to driver');

        return back()->with('success', 'Driver assigned successfully!');
    }

    /**
     * Delete delivery
     */
    public function destroy(Delivery $delivery)
    {
        // Only allow deleting pending deliveries
        if ($delivery->status !== 'pending') {
            return back()->with('error', 'Can only delete pending deliveries');
        }

        $delivery->delete();
        return redirect('/deliveries')->with('success', 'Delivery deleted successfully!');
    }

    /**
     * Update related order with delivery information
     */
    private function updateRelatedOrder($type, $orderId, $delivery)
    {
        if ($type === 'loan' && $orderId) {
            Loan::find($orderId)?->update([
                'delivery_id' => $delivery->id,
                'delivery_cost' => $delivery->delivery_cost,
                'delivery_discount' => $delivery->delivery_discount,
                'delivery_address' => $delivery->delivery_address,
                'delivery_status' => 'Pending',
            ]);
        } elseif ($type === 'export' && $orderId) {
            Export::find($orderId)?->update([
                'delivery_id' => $delivery->id,
                'delivery_cost' => $delivery->delivery_cost,
                'delivery_discount' => $delivery->delivery_discount,
                'delivery_address' => $delivery->delivery_address,
                'delivery_status' => 'Pending',
            ]);
        } elseif ($type === 'online_order' && $orderId) {
            Cart::where('unique_id', $orderId)->orWhere('id', $orderId)->update([
                'delivery_id' => $delivery->id,
                'status' => 'Pending',
            ]);
        }
    }

    private function normalizeDeliveryStatus(string $status): string
    {
        $s = strtolower(trim($status));

        return match ($s) {
            'approved' => 'confirmed',
            'complete', 'completed', 'delivered' => 'delivered',
            'in_transit' => 'in-transit',
            'processing' => 'processing',
            'confirmed' => 'confirmed',
            'assigned' => 'assigned',
            'picked-up' => 'picked-up',
            'failed' => 'failed',
            'cancelled' => 'cancelled',
            default => 'pending',
        };
    }

    private function resolveSourceOrderSeed(string $sourceType, string $orderNumber): ?array
    {
        if ($sourceType === 'online_order') {
            $rows = Cart::where('unique_id', $orderNumber)->get();
            if ($rows->isEmpty()) {
                return null;
            }

            $first = $rows->first();
            $deliveryTotal = (float) $rows->sum(function ($row) {
                $price = (float) ($row->price ?? 0);
                $qty = (float) ($row->quantity ?? 0);
                $discount = (float) ($row->discount ?? 0);
                return ($price * $qty) - $discount;
            });

            return [
                'delivery_type' => 'online_order',
                'customer_name' => $first?->name ?? 'Guest Customer',
                'phone' => $first?->phone_number ?? '-',
                'email' => $first?->email,
                'delivery_address' => $first?->street ?? '-',
                'delivery_total' => max(0, $deliveryTotal),
                'payment_method' => $first?->payment_method ?? 'Cash',
            ];
        }

        if ($sourceType === 'sales_order') {
            $sale = Sale::with('posCustomer:id,customer_name,customer_phone,business_address')
                ->where('invoice_number', $orderNumber)
                ->first();

            if (!$sale) {
                return null;
            }

            return [
                'delivery_type' => 'sale',
                'customer_name' => $sale->posCustomer?->customer_name ?? 'Walking Customer',
                'phone' => $sale->posCustomer?->customer_phone ?? '-',
                'email' => null,
                'delivery_address' => $sale->posCustomer?->business_address ?? '-',
                'delivery_total' => (float) ($sale->payable_amount ?? 0),
                'payment_method' => $sale->payment_method ?? 'Cash',
            ];
        }

        return null;
    }
}
