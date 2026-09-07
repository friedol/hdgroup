<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\GatekeeperLog;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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

        return Inertia::render('Gatekeeper/Logs', [
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
        $rawMaterials = collect();
        $suppliers = User::where('role_id', 8)->orWhere('role_id', 9)->get(['id', 'staff_name']);

        return Inertia::render('Gatekeeper/RecordIn', [
            'products' => $products,
            'rawMaterials' => $rawMaterials,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Store a record IN entry
     */
    public function storeRecordIn(Request $request)
    {
        $itemType = $request->input('item_type', 'product');

        $rules = [
            'item_type' => 'required|in:product,raw_material',
            'product_name' => 'required|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'handler_type' => 'required|in:Registered,Staff,Supplier,Delivery,Customer,Transporter',
            'handler_name' => 'required|string',
            'source' => 'required|string',
            'reference_number' => 'nullable|string',
            'contact_info' => 'nullable|string',
            'verification_code' => 'nullable|string',
            'notes' => 'nullable|string',
        ];

        if ($itemType === 'raw_material') {
            $rules['raw_material_id'] = 'required|exists:raw_materials,id';
            $rules['product_id'] = 'nullable';
        } else {
            $rules['product_id'] = 'required|exists:products,id';
            $rules['raw_material_id'] = 'nullable';
        }

        $validated = $request->validate($rules);
        $validated['status'] = 'verified';
        $validated['type'] = 'IN';
        $validated['recorded_by_id'] = Auth::id();
        $validated['recorded_by_name'] = Auth::user()->name;
        $validated['recorded_at'] = now();

        $log = GatekeeperLog::create($validated);

        return redirect()->route('gatekeeper.index')
            ->with('success', "Item recorded IN successfully. Reference: {$log->id}");
    }

    /**
     * Show the record OUT form
     */
    public function recordOutForm()
    {
        $products = Product::where('is_enabled', true)->get(['id', 'product_name', 'product_price', 'unit_price']);
        $rawMaterials = collect();
        $customers = User::where('role_id', 6)->get(['id', 'staff_name']);

        return Inertia::render('Gatekeeper/RecordOut', [
            'products' => $products,
            'rawMaterials' => $rawMaterials,
            'customers' => $customers,
        ]);
    }

    /**
     * Store a record OUT entry
     */
    public function storeRecordOut(Request $request)
    {
        $itemType = $request->input('item_type', 'product');

        $rules = [
            'item_type' => 'required|in:product,raw_material',
            'product_name' => 'required|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'handler_type' => 'required|in:Registered,Staff,Supplier,Delivery,Customer,Transporter',
            'handler_name' => 'required|string',
            'destination' => 'required|string',
            'reference_number' => 'nullable|string',
            'contact_info' => 'nullable|string',
            'verification_code' => 'nullable|string',
            'notes' => 'nullable|string',
        ];

        if ($itemType === 'raw_material') {
            $rules['raw_material_id'] = 'required|exists:raw_materials,id';
            $rules['product_id'] = 'nullable';
        } else {
            $rules['product_id'] = 'required|exists:products,id';
            $rules['raw_material_id'] = 'nullable';
        }

        $validated = $request->validate($rules);
        $validated['status'] = 'verified';
        $validated['type'] = 'OUT';
        $validated['recorded_by_id'] = Auth::id();
        $validated['recorded_by_name'] = Auth::user()->name;
        $validated['recorded_at'] = now();

        $log = GatekeeperLog::create($validated);

        return redirect()->route('gatekeeper.index')
            ->with('success', "Item recorded OUT successfully. Reference: {$log->id}");
    }

    /**
     * Show a specific log entry
     */
    public function show(GatekeeperLog $log)
    {
        return Inertia::render('Gatekeeper/Show', [
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

        return $pdf->download('gatekeeper-logs-'.now()->format('Y-m-d-H-i-s').'.pdf');
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

        $branchId = session('branch_id') ?? Auth::user()?->branch_id;
        $branchName = 'Global';
        if ($branchId) {
            $branch = Branch::find($branchId);
            if ($branch) {
                $branchName = $branch->name ?? $branch->system_name ?? 'Branch';
            }
        }

        return view('gatekeeper.print-logs', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'type', 'status', 'start_date', 'end_date']),
            'companyName' => Setting::getValue('business_name', Setting::getValue('system_name', config('app.name', 'Jopo Juniours Co. Ltd'))),
            'companyAddress' => Setting::getValue('business_address', ''),
            'branchName' => $branchName,
            'system_logo' => Setting::getValue('system_logo'),
            'system_favicon' => Setting::getValue('system_favicon'),
        ]);
    }

    /**
     * Edit a log entry
     */
    public function edit(GatekeeperLog $log)
    {
        return Inertia::render('Gatekeeper/Edit', [
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
