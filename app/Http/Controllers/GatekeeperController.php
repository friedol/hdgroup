<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\GatekeeperLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class GatekeeperController extends Controller
{
    /**
     * Display the gatekeeper logs
     */
    public function index(Request $request)
    {
        $logs = GatekeeperLog::query()
            ->filter($request->only(['search', 'type', 'status', 'start_date', 'end_date']))
            ->orderBy('recorded_at', 'desc')
            ->paginate(50);

        // Summary statistics
        $today = now()->startOfDay();
        $summary = [
            'total_in' => GatekeeperLog::where('type', 'IN')->where('recorded_at', '>=', $today)->count(),
            'total_out' => GatekeeperLog::where('type', 'OUT')->where('recorded_at', '>=', $today)->count(),
            'total_quantity_in' => GatekeeperLog::where('type', 'IN')->where('recorded_at', '>=', $today)->sum('quantity'),
            'total_quantity_out' => GatekeeperLog::where('type', 'OUT')->where('recorded_at', '>=', $today)->sum('quantity'),
        ];

        return \Inertia\Inertia::render('Gatekeeper/Logs', [
            'logs' => $logs,
            'summary' => $summary,
            'filters' => $request->only(['search', 'type', 'status', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Show the record IN form
     */
    public function recordInForm()
    {
        $products = Product::where('is_enabled', true)->get(['id', 'product_name', 'product_price', 'unit_price']);
        $suppliers = User::where('role_id', 8)->orWhere('role_id', 9)->get(['id', 'staff_name']);

        return \Inertia\Inertia::render('Gatekeeper/RecordIn', [
            'products' => $products,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Store a record IN entry
     */
    public function storeRecordIn(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_name' => 'required|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'handler_type' => 'required|in:Registered,Staff,Supplier,Delivery,Customer',
            'handler_name' => 'required|string',
            'source' => 'required|string',
            'reference_number' => 'nullable|string',
            'contact_info' => 'nullable|string',
            'verification_code' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Verify the verification code (simple validation - can be enhanced)
        if ($verified = $this->verifyAccessCode($request->verification_code)) {
            $validated['status'] = 'verified';
        } else {
            $validated['status'] = 'pending';
        }

        $validated['type'] = 'IN';
        $validated['recorded_by_id'] = Auth::id();
        $validated['recorded_by_name'] = Auth::user()->name;
        $validated['recorded_at'] = now();

        $log = GatekeeperLog::create($validated);

        return redirect()->route('gatekeeper.index')
            ->with('success', "Product recorded IN successfully. Reference: {$log->id}");
    }

    /**
     * Show the record OUT form
     */
    public function recordOutForm()
    {
        $products = Product::where('is_enabled', true)->get(['id', 'product_name', 'product_price', 'unit_price']);
        $customers = User::where('role_id', 6)->get(['id', 'staff_name']);

        return \Inertia\Inertia::render('Gatekeeper/RecordOut', [
            'products' => $products,
            'customers' => $customers,
        ]);
    }

    /**
     * Store a record OUT entry
     */
    public function storeRecordOut(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_name' => 'required|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'handler_type' => 'required|in:Registered,Staff,Supplier,Delivery,Customer',
            'handler_name' => 'required|string',
            'destination' => 'required|string',
            'reference_number' => 'nullable|string',
            'contact_info' => 'nullable|string',
            'verification_code' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Verify the verification code
        if ($verified = $this->verifyAccessCode($request->verification_code)) {
            $validated['status'] = 'verified';
        } else {
            $validated['status'] = 'pending';
        }

        $validated['type'] = 'OUT';
        $validated['recorded_by_id'] = Auth::id();
        $validated['recorded_by_name'] = Auth::user()->name;
        $validated['recorded_at'] = now();

        $log = GatekeeperLog::create($validated);

        return redirect()->route('gatekeeper.index')
            ->with('success', "Product recorded OUT successfully. Reference: {$log->id}");
    }

    /**
     * Show a specific log entry
     */
    public function show(GatekeeperLog $log)
    {
        return \Inertia\Inertia::render('Gatekeeper/Show', [
            'log' => $log->load('recordedBy', 'product'),
        ]);
    }

    /**
     * Export logs as PDF for printing
     */
    public function exportPDF(Request $request)
    {
        $logs = GatekeeperLog::query()
            ->filter($request->only(['search', 'type', 'status', 'start_date', 'end_date']))
            ->orderBy('recorded_at', 'desc')
            ->get();

        $pdf = \PDF::loadView('gatekeeper.logs-pdf', [
            'logs' => $logs,
            'generated_at' => now(),
        ]);

        return $pdf->download('gatekeeper-logs-' . now()->format('Y-m-d-H-i-s') . '.pdf');
    }

    /**
     * Get printable view of logs
     */
    public function printLogs(Request $request)
    {
        $logs = GatekeeperLog::query()
            ->filter($request->only(['search', 'type', 'status', 'start_date', 'end_date']))
            ->orderBy('recorded_at', 'desc')
            ->get();

        return view('gatekeeper.print-logs', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'type', 'status', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Edit a log entry
     */
    public function edit(GatekeeperLog $log)
    {
        return \Inertia\Inertia::render('Gatekeeper/Edit', [
            'log' => $log,
        ]);
    }

    /**
     * Update a log entry
     */
    public function update(Request $request, GatekeeperLog $log)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'status' => 'in:pending,verified,rejected',
        ]);

        $log->update($validated);

        return redirect()->route('gatekeeper.show', $log)
            ->with('success', 'Log updated successfully');
    }

    /**
     * Delete a log entry
     */
    public function destroy(GatekeeperLog $log)
    {
        $log->delete();

        return redirect()->route('gatekeeper.index')
            ->with('success', 'Log entry deleted successfully');
    }

    /**
     * Verify access code (simple implementation)
     * Can be enhanced with database lookup or API validation
     */
    private function verifyAccessCode($code)
    {
        // Check if code is 4 digits
        return preg_match('/^\d{4}$/', $code) && in_array($code, [
            '1111', '2222', '3333', // Add allowed codes here
            Auth::user()->id % 10000, // Can use user-based codes
        ]);
    }

    /**
     * Get quick stats for dashboard
     */
    public function getStats()
    {
        $today = now()->startOfDay();
        $week = now()->subDays(7)->startOfDay();
        $month = now()->startOfMonth();

        return response()->json([
            'today' => [
                'in' => GatekeeperLog::where('type', 'IN')->where('recorded_at', '>=', $today)->count(),
                'out' => GatekeeperLog::where('type', 'OUT')->where('recorded_at', '>=', $today)->count(),
            ],
            'week' => [
                'in' => GatekeeperLog::where('type', 'IN')->where('recorded_at', '>=', $week)->count(),
                'out' => GatekeeperLog::where('type', 'OUT')->where('recorded_at', '>=', $week)->count(),
            ],
            'month' => [
                'in' => GatekeeperLog::where('type', 'IN')->where('recorded_at', '>=', $month)->count(),
                'out' => GatekeeperLog::where('type', 'OUT')->where('recorded_at', '>=', $month)->count(),
            ],
        ]);
    }
}
