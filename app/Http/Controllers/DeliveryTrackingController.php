<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\DeliveryTracking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryTrackingController extends Controller
{
    /**
     * Customer view: Track a delivery by tracking number
     */
    public function track($deliveryNumber)
    {
        $delivery = Delivery::where('delivery_number', $deliveryNumber)
            ->with(['deliveryPerson', 'items', 'tracking' => function($q) {
                $q->orderBy('created_at', 'desc');
            }])
            ->firstOrFail();

        $trackingHistory = $delivery->tracking;
        $latestTracking = $delivery->latestTracking()->first();

        return Inertia::render('Logistics/DeliveryTracking/Track', [
            'delivery' => $delivery,
            'trackingHistory' => $trackingHistory,
            'latestTracking' => $latestTracking,
        ]);
    }

    /**
     * Dashboard for delivery personnel to view their assignments
     */
    public function driverDashboard(Request $request)
    {
        $driver = auth()->user(); // Assuming driver is logged in

        // Get driver's deliveries
        $query = Delivery::where('delivery_person_id', $driver->id)
            ->with(['items', 'tracking']);

        // Filter by status
        if ($status = $request->input('status')) {
            if ($status === 'active') {
                $query->whereNotIn('status', ['delivered', 'failed', 'cancelled']);
            } else {
                $query->where('status', $status);
            }
        }

        $deliveries = $query->orderBy('created_at', 'desc')->paginate(10);

        // Statistics
        $stats = [
            'total_today' => Delivery::where('delivery_person_id', $driver->id)
                ->whereDate('created_at', today())
                ->count(),
            'completed_today' => Delivery::where('delivery_person_id', $driver->id)
                ->where('status', 'delivered')
                ->whereDate('delivery_time', today())
                ->count(),
            'pending_deliveries' => Delivery::where('delivery_person_id', $driver->id)
                ->whereNotIn('status', ['delivered', 'failed', 'cancelled'])
                ->count(),
            'failed_deliveries' => Delivery::where('delivery_person_id', $driver->id)
                ->where('status', 'failed')
                ->count(),
        ];

        return Inertia::render('Logistics/DeliveryTracking/DriverDashboard', [
            'deliveries' => $deliveries,
            'stats' => $stats,
            'currentFilter' => $request->input('status'),
        ]);
    }

    /**
     * Driver accepts a delivery assignment
     */
    public function acceptDelivery(Request $request, Delivery $delivery)
    {
        $driver = auth()->user();

        if ($delivery->delivery_person_id != $driver->id) {
            return back()->with('error', 'This delivery is not assigned to you');
        }

        $delivery->updateStatus('assigned', 'Driver accepted delivery');

        return back()->with('success', 'Delivery accepted! You can now start your route.');
    }

    /**
     * Driver marks delivery as picked up
     */
    public function pickupDelivery(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'photo' => 'nullable|file|image|max:5120',
        ]);

        $driver = auth()->user();

        if ($delivery->delivery_person_id != $driver->id) {
            return back()->with('error', 'This delivery is not assigned to you');
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('delivery-pickups', 'public');
        }

        $delivery->update(['pickup_time' => now()]);
        $delivery->updateStatus('picked-up', $validated['notes'] ?? 'Package picked up');

        if ($photoPath) {
            $latestTracking = $delivery->latestTracking()->first();
            if ($latestTracking) {
                $latestTracking->update(['photo' => $photoPath]);
            }
        }

        return back()->with('success', 'Package marked as picked up!');
    }

    /**
     * Driver marks delivery as in transit
     */
    public function inTransit(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $driver = auth()->user();

        if ($delivery->delivery_person_id != $driver->id) {
            return back()->with('error', 'This delivery is not assigned to you');
        }

        $delivery->updateStatus('in-transit', $validated['notes'] ?? 'Package in transit to customer');

        if ($validated['latitude'] && $validated['longitude']) {
            $latestTracking = $delivery->latestTracking()->first();
            if ($latestTracking) {
                $latestTracking->update([
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                ]);
            }
        }

        return back()->with('success', 'Delivery status updated to in-transit!');
    }

    /**
     * Driver marks delivery as completed
     */
    public function completeDelivery(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'photo' => 'required|file|image|max:5120', // Proof of delivery photo required
        ]);

        $driver = auth()->user();

        if ($delivery->delivery_person_id != $driver->id) {
            return back()->with('error', 'This delivery is not assigned to you');
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('delivery-proofs', 'public');
        }

        $delivery->update([
            'delivery_time' => now(),
            'proof_of_delivery' => $photoPath,
        ]);

        $delivery->updateStatus('delivered', $validated['notes'] ?? 'Delivery completed');

        if ($validated['latitude'] && $validated['longitude']) {
            $latestTracking = $delivery->latestTracking()->first();
            if ($latestTracking) {
                $latestTracking->update([
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'photo' => $photoPath,
                ]);
            }
        }

        // --- Delivery Confirmation SMS (non-blocking) ---
        try {
            if (!empty($delivery->phone)) {
                $smsService = new \App\Services\SmsApiService($delivery->branch_id ?? null);
                $smsText    = \App\Services\SmsApiService::buildDeliverySms(
                    $delivery->customer_name ?? 'Customer',
                    $delivery->delivery_number,
                    (float) ($delivery->delivery_total ?? 0)
                );
                $smsService->sendSMS($delivery->phone, $smsText);
            }
        } catch (\Exception $smsEx) {
            \Illuminate\Support\Facades\Log::warning('Delivery SMS failed: ' . $smsEx->getMessage());
        }

        return back()->with('success', 'Delivery completed successfully!');
    }


    /**
     * Driver marks delivery as failed
     */
    public function failDelivery(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string',
        ]);

        $driver = auth()->user();

        if ($delivery->delivery_person_id != $driver->id) {
            return back()->with('error', 'This delivery is not assigned to you');
        }

        $message = "Delivery failed - Reason: {$validated['reason']}. {$validated['notes']}";
        $delivery->updateStatus('failed', $message);

        return back()->with('success', 'Delivery marked as failed. Admin can reschedule.');
    }

    /**
     * Customer rate and review delivery
     */
    public function rateDelivery(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'nullable|string|max:1000',
        ]);

        if ($delivery->status !== 'delivered') {
            return back()->with('error', 'Can only rate completed deliveries');
        }

        $delivery->update([
            'rating' => $validated['rating'],
            'feedback' => $validated['feedback'] ?? null,
        ]);

        return back()->with('success', 'Thank you for rating this delivery!');
    }

    /**
     * Get real-time delivery tracking data (API endpoint)
     */
    public function getDeliveryData($deliveryNumber)
    {
        $delivery = Delivery::where('delivery_number', $deliveryNumber)
            ->with(['deliveryPerson', 'tracking', 'items'])
            ->firstOrFail();

        return response()->json([
            'delivery' => $delivery,
            'tracking' => $delivery->tracking,
            'driver' => $delivery->deliveryPerson,
            'latest_location' => $delivery->latestTracking()->first(),
        ]);
    }
}
