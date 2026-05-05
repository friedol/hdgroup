<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Store;
use App\Models\Export;
use App\Models\Comment;
use App\Models\Product;
use App\Models\Transfer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StaffController extends Controller
{


    public function staff_profile()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/Profile', [
            'comments' => Transfer::all(),
        ], compact('staffNameConut'));
    }

    public function all_products()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/AllProducts', [
            'products' => Product::filter(request(['search']))->orderBy('id', 'asc')->paginate(10),
            'stores' => Store::all(),
            'comments' => Transfer::all(),
        ], compact('staffNameConut'));
    }

    public function single_export($id)
    {

        $product = Product::find($id);

        $sales = Export::where('id', $id)->orderBy('created_at', 'asc')->get();

        $chartData = $sales->map(function ($sale) {
            return [
                'created_at' => $sale->created_at->format('Y-m-d'),
                'product_quantity' => $sale->quantity,
                'product_name' => $sale->product_name,
            ];
        });

        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/SingleExport', [
            'product' => $product,
            'stores' => Store::all(),
            'users' => User::where('staff_email', '!=', 'developer@gmail.com')->get(),
            'sales' => $sales,
            'chartData' => $chartData,
            'comments' => Transfer::all(),
        ], compact('staffNameConut'));
    }

    public function exported_products(Request $request)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $myexports = Export::all()->sum(function ($export) {
            $quantities = json_decode($export->product_quantity, true);
            $prices = json_decode($export->product_price, true);
            $total = 0;
            foreach ($quantities as $index => $quantity) {
                $total += (float)$quantity * (float)$prices[$index];
            }
            return $total;
        });

        $dateProfit = $myexports;
        $totalComponents = Export::whereNotNull('product_name')->count();

        if ($request->has('search') && $request->search != '') {
            $searchDate = $request->search;

            $dateProfit = Export::whereDate('created_at', $searchDate)->get()->sum(function ($export) {
                $quantities = json_decode($export->product_quantity, true);
                $prices = json_decode($export->product_price, true);
                $total = 0;
                foreach ($quantities as $index => $quantity) {
                    $total += (float)$quantity * (float)$prices[$index];
                }
                return $total;
            });

            $totalComponents = Export::whereDate('created_at', $searchDate)->whereNotNull('product_name')->count();
        }

        $exports = Export::whereDate('created_at', $currentDate);

        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/ExportedProducts', [
            'products' => Product::all(),
            'exports' => $exports->latest()->filter(request(['search']))->paginate(10),
            // 'export' => $exports,
            'comments' => Transfer::all(),
        ], compact('myexports', 'dateProfit', 'totalComponents', 'currentDate', 'staffNameConut'));
    }

    public function all_stores()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/AllStores', [
            'stores' => Store::all(),
            'comments' => Comment::all(),
        ], compact('staffNameConut'));
    }

    public function recommended()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        $notficationCounter = Transfer::where('staff_recommeded', Auth::guard('web')->user()->staff_name)->count();

        $products = Product::all();

        $transfers = Transfer::filter(request(['search']))->orderBy('id', 'asc')->get();

        $productName = [];
        $quantity = [];
        $staffRecommended = [];
        $storeName = [];

        foreach ($transfers as $index => $transfer) {
            $productName = json_decode($transfer->product_name, true);
            $quantity = json_decode($transfer->product_quantity, true);
            $staffRecommended = json_decode($transfer->staff_recommeded, true);
            $storeName = json_decode($transfer->store_name, true);
        }


        return \Inertia\Inertia::render('Staff/Recommended', [
            'transfers' => $transfers,
            'comments' => Comment::latest()->filter(request(['search']))->paginate(10),
        ], compact('notficationCounter', 'staffNameConut', 'products', 'productName', 'quantity', 'staffRecommended', 'storeName'));
    }

    public function edit_transfer_status(Request $request, $unique_id)
    {
        // dd($unique_id);
        $transferStatus = $request->validate([
            'status' => 'required',
        ]);
        $transfer = Transfer::where('unique_id', $unique_id)->update($transferStatus);

        return redirect()->back()->with('success', 'Transfer checked successfully!');
    }

    public function print_doc($id)
    {
        $product = Export::find($id);
        // $product->product_name = json_decode($product->product_name, true);
        // $product->product_quantity = json_decode($product->product_quantity, true);
        // $product->product_price = json_decode($product->product_price, true);
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/Print', [
            'product' => $product,
            'comments' => Comment::all(),
        ], compact('staffNameConut'));
    }

    public function instock_product()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/InstockProducts', [
            'products' => Product::filter(request(['search']))->orderBy('id', 'asc')->paginate(10),
            'comments' => Transfer::all(),
        ], compact('staffNameConut'));
    }

    public function less_stock()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        return \Inertia\Inertia::render('Staff/LessProduct', [
            'products' => Product::filter(request(['search']))->orderBy('id', 'asc')->paginate(10),
            'comments' => Transfer::all(),
        ], compact('staffNameConut'));
    }

    public function outstock_products()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        $outstockProduct = Product::where('product_quantity', 0)->filter(request(['search']))->orderBy('id', 'asc')->paginate(10);
        return \Inertia\Inertia::render('Staff/LessProduct', [
            'products' => $outstockProduct,
            'comments' => Transfer::all(),
        ], compact('staffNameConut'));
    }

    public function view_comment()
    {
        $loggedInStaff = Auth::guard('web')->user()->staff_name;

        $staffNameConut = Transfer::where('staff_recommeded', $loggedInStaff)->count();

        $comments = Comment::orderBy('id', 'asc')->get();
        return \Inertia\Inertia::render('Staff/ViewComments', compact('comments', 'staffNameConut'));
    }
}
