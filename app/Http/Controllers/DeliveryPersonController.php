<?php

namespace App\Http\Controllers;

use App\Models\DeliveryPerson;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryPersonController extends Controller
{
    /**
     * Display all delivery personnel
     */
    public function index(Request $request)
    {
        $query = DeliveryPerson::query();

        // Search
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by zone
        if ($zone = $request->input('zone')) {
            $query->where('delivery_zone', $zone);
        }

        $deliveryPeople = $query->latest()->paginate(15);

        $metrics = [
            'total_personnel' => DeliveryPerson::count(),
            'active_personnel' => DeliveryPerson::where('status', 'active')->count(),
            'inactive_personnel' => DeliveryPerson::where('status', 'inactive')->count(),
            'on_leave_personnel' => DeliveryPerson::where('status', 'on-leave')->count(),
        ];

        return Inertia::render('Logistics/DeliveryPersonnel/Index', [
            'deliveryPeople' => $deliveryPeople,
            'metrics' => $metrics,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'zone' => $request->input('zone'),
            ]
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        $zones = [
            'city' => 'City Center',
            'suburb' => 'Suburbs',
            'rural' => 'Rural Areas',
            'industrial' => 'Industrial Zone',
            'airport' => 'Airport Area',
        ];

        $vehicleTypes = [
            'motorcycle' => 'Motorcycle',
            'car' => 'Car',
            'van' => 'Van',
            'truck' => 'Truck',
        ];

        return Inertia::render('Logistics/DeliveryPersonnel/Create', [
            'zones' => $zones,
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    /**
     * Store new delivery person
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:delivery_people,phone',
            'email' => 'nullable|email|unique:delivery_people,email',
            'id_number' => 'required|string|unique:delivery_people,id_number',
            'vehicle_registration' => 'nullable|string',
            'vehicle_type' => 'nullable|in:motorcycle,car,van,truck',
            'status' => 'required|in:active,inactive,on-leave',
            'base_delivery_rate' => 'nullable|numeric|min:0',
            'address' => 'nullable|string',
            'delivery_zone' => 'nullable|string',
        ]);

        DeliveryPerson::create([
            ...$validated,
            'branch_id' => auth()->user()?->branch_id,
            'created_by' => auth()->user()?->name ?? 'system',
        ]);

        return redirect('/delivery-personnel')
            ->with('success', 'Delivery personnel created successfully!');
    }

    /**
     * Show personnel details
     */
    public function show(DeliveryPerson $deliveryPerson)
    {
        $deliveryPerson->load('deliveries');

        $stats = [
            'total_deliveries' => $deliveryPerson->deliveries()->count(),
            'completed_deliveries' => $deliveryPerson->deliveries()->where('status', 'delivered')->count(),
            'failed_deliveries' => $deliveryPerson->deliveries()->where('status', 'failed')->count(),
            'average_rating' => $deliveryPerson->deliveries()->whereNotNull('rating')->avg('rating'),
            'total_earnings' => $deliveryPerson->calculateEarnings(),
        ];

        // Get active deliveries (not completed/failed/cancelled)
        $active_deliveries = $deliveryPerson->deliveries()
            ->whereNotIn('status', ['delivered', 'failed', 'cancelled'])
            ->get();

        // Get recent deliveries (last 5 completed)
        $recent_deliveries = $deliveryPerson->deliveries()
            ->where('status', 'delivered')
            ->latest('delivery_time')
            ->take(5)
            ->get();

        return Inertia::render('Logistics/DeliveryPersonnel/Show', [
            'person' => $deliveryPerson,
            'active_deliveries' => $active_deliveries,
            'recent_deliveries' => $recent_deliveries,
            'total_deliveries' => $stats['total_deliveries'],
            'completed_deliveries' => $stats['completed_deliveries'],
            'failed_deliveries' => $stats['failed_deliveries'],
            'average_rating' => $stats['average_rating'],
            'total_earnings' => $stats['total_earnings'],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(DeliveryPerson $deliveryPerson)
    {
        $zones = [
            'city' => 'City Center',
            'suburb' => 'Suburbs',
            'rural' => 'Rural Areas',
            'industrial' => 'Industrial Zone',
            'airport' => 'Airport Area',
        ];

        $vehicleTypes = [
            'motorcycle' => 'Motorcycle',
            'car' => 'Car',
            'van' => 'Van',
            'truck' => 'Truck',
        ];

        return Inertia::render('Logistics/DeliveryPersonnel/Edit', [
            'person' => $deliveryPerson,
            'zones' => $zones,
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    /**
     * Update personnel
     */
    public function update(Request $request, DeliveryPerson $deliveryPerson)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:delivery_people,phone,' . $deliveryPerson->id,
            'email' => 'nullable|email|unique:delivery_people,email,' . $deliveryPerson->id,
            'vehicle_registration' => 'nullable|string',
            'vehicle_type' => 'nullable|in:motorcycle,car,van,truck',
            'status' => 'required|in:active,inactive,on-leave',
            'base_delivery_rate' => 'nullable|numeric|min:0',
            'address' => 'nullable|string',
            'delivery_zone' => 'nullable|string',
        ]);

        $deliveryPerson->update([
            ...$validated,
            'updated_by' => auth()->user()?->name ?? 'system',
        ]);

        return back()->with('success', 'Delivery personnel updated successfully!');
    }

    /**
     * Delete personnel
     */
    public function destroy(DeliveryPerson $deliveryPerson)
    {
        // Check if personnel has active deliveries
        if ($deliveryPerson->activeDeliveries()->exists()) {
            return back()->with('error', 'Cannot delete personnel with active deliveries');
        }

        $deliveryPerson->delete();
        return redirect('/delivery-personnel')
            ->with('success', 'Delivery personnel deleted successfully!');
    }
}
