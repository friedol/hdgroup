<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Container;
use App\Models\Export;
use App\Models\Order;
use App\Models\Post;
use App\Models\Product;
use App\Models\Role;
use App\Models\Session;
use App\Models\Store;
use App\Models\Transfer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PageController extends Controller
{
    //

    public function index()
    {
        return Inertia::render('Auth/Index');
    }

    public function home_page()
    {
        // if (Auth()->check()) {
        //     $cartCount = Cart::where('phone_number', Auth()->user()->staff_phone)
        //         ->where('status', 'Pending')
        //         ->count();
        // } else {
        //     $cartCount = 0;
        // }

        // $todayDate = Carbon::now()->format('Y-m-d');
        // $allproducts = Product::all();
        // $categories = Category::orderBy('category_name', 'asc')->get();
        // $productsCounter = Product::all()->count();
        // $categoryCounter = Category::all()->count();
        // $customersCounter = User::where('role_id', 4)->count();
        // $newArrivalsCounter = Product::whereDate('created_at', $todayDate)->count();
        // $products = Product::filter(request(['search']))->orderBy('product_name', 'asc')->get();

        return Inertia::render('HomePage');
    }

    public function categories($id)
    {
        if (Auth()->check()) {
            $cartCount = Cart::where('phone_number', Auth()->user()->staff_phone)
                ->where('status', 'Pending')
                ->count();
        } else {
            $cartCount = 0;
        }

        $todayDate = Carbon::now()->format('Y-m-d');
        $allproducts = Product::where('id', $id)->get();
        $categories = Category::orderBy('category_name', 'asc')->get();
        $productsCounter = Product::all()->count();
        $categoryCounter = Category::all()->count();
        $customersCounter = User::where('role_id', 4)->count();
        $newArrivalsCounter = Product::whereDate('created_at', $todayDate)->count();
        $products = Product::filter(request(['search']))->orderBy('product_name', 'asc')->get();

        return Inertia::render('HomePage', compact('products', 'categories', 'productsCounter', 'categoryCounter', 'customersCounter', 'newArrivalsCounter', 'allproducts', 'cartCount'));
    }

    public function register()
    {
        return Inertia::render('Auth/Register');
    }

    public function explore(Request $request)
    {
        $todayDate = Carbon::now()->format('Y-m-d');
        $productsCounter = Product::all()->count();
        $categoryCounter = Category::all()->count();
        $customersCounter = User::where('role_id', 4)->count();
        $newArrivalsCounter = Product::whereDate('created_at', $todayDate)->count();

        $newProducts = Product::whereDate('created_at', $todayDate)->orderBy('product_name', 'asc')->get();

        $allproducts = Product::orderBy('product_name', 'asc')
            ->filter(request(['search']))
            ->paginate(12);

        $images = [];
        $names = [];

        foreach ($newProducts as $key => $product) {
            $newProducts[$key]->images = json_decode($product->images, true);
            $newProducts[$key]->names = json_decode($product->product_name, true);
        }

        foreach ($allproducts as $key => $product) {
            $allproducts[$key]->images = json_decode($product->images, true);
        }

        if ($request->ajax()) {
            return response()->json([
                'products' => view('partials.products', compact('allproducts'))->render(),
                'next_page' => $allproducts->nextPageUrl(),
            ]);
        }

        $categories = Category::all();

        $catProducts = Product::where('category', 7)->get();

        foreach ($catProducts as $key => $product) {
            $catProducts[$key]->images = json_decode($product->images, true);
        }

        return Inertia::render('Explore', compact(
            'productsCounter',
            'categoryCounter',
            'customersCounter',
            'newArrivalsCounter',
            'newProducts',
            'allproducts',
            'images',
            'names',
            'categories',
            'catProducts'
        ));
    }

    public function store_orders(Request $request)
    {
        $cartDetails = $request->validate([
            'email' => 'nullable',
            'city' => 'nullable|string|max:255',
            'district' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'phone_number' => 'required|digits_between:10,13',
            'product_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'selected_image' => 'required|string|max:255',
            'price' => 'required|numeric',
        ]);

        Cart::create($cartDetails);

        // dd($request->all());

        return redirect('/my-carts')->with('cart_success_msg', 'You ordered product successfully!');
    }

    public function my_carts()
    {
        $todayDate = Carbon::now()->format('Y-m-d');
        if (Auth()->check()) {
            $cartCount = Cart::where('phone_number', Auth()->user()->staff_phone)
                ->where('status', 'Pending')
                ->count();
        } else {
            $cartCount = 0;
        }
        $productsCounter = Product::count();
        $categoryCounter = Category::count();
        $customersCounter = User::where('role_id', 4)->count();
        $newArrivalsCounter = Product::whereDate('created_at', $todayDate)->count();

        $carts = Cart::where('phone_number', Auth::guard('web')->user()->staff_phone)
            ->where('status', 'Pending')
            ->orderBy('id', 'desc')->get();

        $completeCart = Cart::where('phone_number', Auth::guard('web')->user()->staff_phone)
            ->where('status', 'complete')
            ->orderBy('id', 'desc')->get();

        $cartCounter = Cart::where('phone_number', Auth::guard('web')->user()->staff_phone)->count();

        return Inertia::render('Customer/MyCart', compact('productsCounter', 'categoryCounter', 'customersCounter', 'newArrivalsCounter', 'carts', 'cartCounter', 'cartCount', 'completeCart'));
    }

    public function store_my_order()
    {
        $user = Auth()->user()->staff_phone;
        $userCart = Cart::where('phone_number', $user)
            ->where('status', 'Pending')
            ->update(['status' => 'Complete']);

        return redirect()->back()->with('success', 'Order Submitted successfully');
    }

    public function store_accounts(Request $request)
    {
        $accountData = $request->validate([
            'role_id' => 'required|integer|in:3,4',
            'staff_name' => 'required|string|max:255',
            'staff_phone' => 'required|string|max:13|min:10|unique:users,staff_phone',
            'location' => 'nullable|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:8',
        ]);

        $existingUser = User::where('staff_phone', $request->input('staff_phone'))->first();

        if ($existingUser) {
            return redirect()->back()->with('user_exists', 'User exists!');
        }

        User::create($accountData);

        // dd($request->all());

        return redirect()->back()->with('account_success_created', 'Customer registered successfully!');
    }

    public function orders()
    {
        $todayDate = Carbon::now()->format('Y-m-d');
        $carts = Cart::whereDate('created_at', $todayDate)->get();

        return Inertia::render('Admin/Orders', compact('carts'));
    }

    public function delete_order_cart(Request $request, Cart $cart)
    {
        $cart->delete();

        return redirect()->back()->with('success_delete_cart', 'Order deleted successfully!');
    }

    public function edit_myprofile(Request $request, User $user)
    {
        $userProfileData = $request->validate([
            'profile' => 'nullable',
            'staff_phone' => 'required',
            'location' => 'required',
            'staff_email' => 'nullable',
            'username' => 'required',
            'password' => 'required',
        ]);

        $user->update($userProfileData);

        // dd($request->all());

        return redirect()->back()->with('user_updated_success', 'Profile details updated successfully!');
    }

    public function re_order(Request $request)
    {
        $re_orderDetails = $request->validate([
            'email' => 'nullable',
            'city' => 'nullable',
            'district' => 'nullable',
            'street' => 'nullable',
            'name' => 'required',
            'phone_number' => 'required',
            'product_name' => 'required',
            'quantity' => 'required',
            'selected_image' => 'required',
            'price' => 'required',
        ]);

        Cart::create($re_orderDetails);

        // dd($request->all());

        return redirect('/my-carts')->with('cart_success_msg', 'You ordered product successfully!');
    }

    public function update_status(Request $request, Cart $cart)
    {
        $cartStatus = $request->validate([
            'status' => 'required',
        ]);

        $cart->update($cartStatus);

        dd($request->all());

        // return redirect()->back();
    }

    public function report_loader(Request $request)
    {
        $transfers = Export::filter(request(['search']))->get();

        $totalQuantity = 0;
        $totalPrice = 0;

        foreach ($transfers as $key => $exported) {
            $transfers[$key]->productIds = json_decode($exported->product_id, true);
            $transfers[$key]->productNames = json_decode($exported->product_name, true);
            $transfers[$key]->quantities = json_decode($exported->product_quantity, true);
            $transfers[$key]->prices = json_decode($exported->product_price, true);
            $transfers[$key]->customerName = json_decode($exported->tin, true);

            if (is_array($transfers[$key]->quantities) && is_array($transfers[$key]->prices)) {
                foreach ($transfers[$key]->quantities as $index => $qty) {
                    $totalQuantity += $qty;
                    $totalPrice += $qty * $transfers[$key]->prices[$index];
                }
            } else {
                $totalQuantity += $transfers[$key]->quantities;
                $totalPrice += $transfers[$key]->quantities * $transfers[$key]->prices;
            }
        }

        if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            $transfers = Export::whereBetween('created_at', [$startDate, $endDate])->get();
            $datePrice = 0;

            foreach ($transfers as $filteredExport) {
                $quantities = json_decode($filteredExport->product_quantity, true);
                $prices = json_decode($filteredExport->product_price, true);

                if (is_array($quantities) && is_array($prices)) {
                    foreach ($quantities as $key => $qty) {
                        $datePrice += $qty * $prices[$key];
                    }
                } else {
                    $datePrice += $quantities * $prices;
                }
            }
        } else {
            $datePrice = $totalPrice;
        }

        return Inertia::render('Admin/Reports', [
            'exports' => $transfers,
            'myexports' => $totalPrice,
        ], compact('datePrice', 'totalQuantity', 'totalPrice'));
    }

    public function inventory_report(Request $request)
    {
        $stores = Store::all();
        $products = Product::all();

        $totalQuantity = 0;
        $totalPrice = 0;
        $totalQuantityOnHand = 0;
        $ToatlQuantityIn = 0;
        $TotalQuantityOut = 0;

        if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            $products = Product::whereBetween('created_at', [$startDate, $endDate])->get();
        }

        foreach ($products as $product) {
            $quantityOut = 0;
            $quantityOrdered = 0;

            $exports = Export::all();

            foreach ($exports as $export) {
                $exportedItems = json_decode($export->product_name, true);
                $exportedQuantities = json_decode($export->product_quantity, true);

                if (is_array($exportedItems) && is_array($exportedQuantities)) {
                    foreach ($exportedItems as $index => $item) {
                        if (isset($item['product_name']) && isset($exportedQuantities[$index]['product_quantity'])) {
                            if (trim(strtolower($item['product_name'])) == trim(strtolower($product->product_name))) {
                                $quantityOut += $exportedQuantities[$index]['product_quantity'];
                            }
                        }
                    }
                }
            }

            $quantityOrdered = $product->product_quantity + $quantityOut;

            $quantityOnHand = $product->product_quantity - $quantityOut;

            $product->quantity_ordered = $quantityOrdered;
            $product->quantity_out = $quantityOut;
            $product->quantity_on_hand = $quantityOnHand;

            $totalQuantityOnHand += $product->quantity_on_hand;
            $totalQuantity += $product->product_quantity;
            $totalPrice += $product->product_price * $product->product_quantity;
            $ToatlQuantityIn += $product->product_quantity;
            $TotalQuantityOut += $product->quantity_out;
        }

        return Inertia::render('Admin/InventoryReport', compact('products', 'stores', 'totalQuantity', 'totalPrice', 'totalQuantityOnHand', 'ToatlQuantityIn', 'TotalQuantityOut'));
    }

    public function recommended_product()
    {
        $user = Auth::user();
        $role = $user->role_id;

        // Get today's date
        $today = Carbon::now()->format('Y-m-d');

        // Base query for Transfer table
        $transferQuery = Transfer::select(
            'unique_id',
            DB::raw('SUM(product_quantity) as total_quantity'),
            'staff_recommeded',
            'source_store',
            'store_name as destination_store',
            'status',
            'created_at'
        )
            // ->whereDate('created_at', $today) // Filter for today's date
            ->groupBy('unique_id', 'staff_recommeded', 'source_store', 'store_name', 'status', 'created_at');

        $exportQuery = Export::selectRaw('
            unique_id,
            staff_recommeded,
            status,
            SUM(product_quantity) as total_quantity,
            SUM(product_price) as total_price,
            created_at
        ')
            // ->where('status',null)
            ->groupBy('unique_id', 'staff_recommeded', 'status', 'created_at')
            ->orderBy('id', 'desc')
            ->filter(request(['search'])); // Apply filters if present

        // Apply filter for staff_recommeded if the user role is 3
        if ($role == 3) {
            $d['loggedTrue'] = $loggedInStaff = $user->staff_name;
            // $transferQuery->where('staff_recommeded', $loggedInStaff);
            // $exportQuery->where('staff_recommeded', $loggedInStaff);
        }

        // Execute query
        $d['transfers'] = $transferQuery->get();
        $d['exports'] = $exportQuery->get();

        // Return the view with data
        return Inertia::render('Admin/Comments/Recommended', $d);
    }

    public function sales_recommended()
    {
        $user = Auth::user();
        $role = $user->role_id;

        // Get today's date
        $today = Carbon::now()->format('Y-m-d');

        $exportQuery = Export::selectRaw('
            unique_id,
            customer_name,
            staff_recommeded,
            status,
            SUM(product_quantity) as total_quantity,
            SUM(product_price) as total_price,
            created_at
        ')
            // ->where('status',null)
            ->groupBy('unique_id', 'customer_name', 'staff_recommeded', 'status', 'created_at')
            ->orderBy('id', 'desc')
            ->filter(request(['search'])); // Apply filters if present

        // Apply filter for staff_recommeded if the user role is 3
        if ($role == 3) {
            $d['loggedTrue'] = $loggedInStaff = $user->staff_name;
            $d['adminLoggedTrue'] = false;
            $exportQuery->where('staff_recommeded', $loggedInStaff);
        }

        if ($role == 1 || $role == 2) {
            $d['adminLoggedTrue'] = $user->staff_name;
        }

        // Execute query
        $d['exports'] = $exportQuery->get();

        // High-Fidelity HUD Metrics
        $metricQuery = Export::whereNotNull('staff_recommeded');
        if ($role == 3) {
            $metricQuery->where('staff_recommeded', $user->staff_name);
        }

        $d['totalAdvocacyVolume'] = (clone $metricQuery)->sum('product_quantity');
        $d['verifiedPipeline'] = (clone $metricQuery)->where('status', 'Checked')->count();
        $d['pendingVerification'] = (clone $metricQuery)->where(function ($q) {
            $q->whereNull('status')->orWhere('status', '');
        })->count();
        $d['volumeToday'] = (clone $metricQuery)->whereDate('created_at', Carbon::today())->sum('product_quantity');

        // Return the view with data
        return Inertia::render('Admin/Comments/SalesRecommended', $d);
    }

    public function order_recommended()
    {
        $user = Auth::user();
        $role = $user->role_id;

        // Get today's date
        $today = Carbon::now()->format('Y-m-d');

        // Base query for Transfer table
        $orderQuery = Cart::selectRaw('
                        unique_id,
                        staff_recommeded,
                        name,
                        is_checked,
                        status,
                        created_at,
                        SUM(quantity) as total_quantity,
                        SUM(price) as total_price
                    ')
            ->groupBy('unique_id', 'is_checked', 'name', 'staff_recommeded', 'status', 'created_at')
            ->orderBy('id', 'desc');

        // Apply filter for staff_recommeded if the user role is 3
        if ($role == 3) {
            $d['loggedTrue'] = $loggedInStaff = $user->staff_name;
            // $orderQuery->where('staff_recommeded', $loggedInStaff);
        }

        // Execute query
        $d['orders'] = $orderQuery->get();

        // High-Fidelity HUD Metrics for Procurement Advocacy
        $metricQuery = Cart::whereNotNull('staff_recommeded');
        if ($role == 3) {
            $metricQuery->where('staff_recommeded', $user->staff_name);
        }

        $d['totalAdvocacyVolume'] = (clone $metricQuery)->sum('quantity');
        $d['verifiedOrders'] = (clone $metricQuery)->where('is_checked', true)->count();
        $d['pendingVerification'] = (clone $metricQuery)->where('is_checked', false)->count();
        $d['volumeToday'] = (clone $metricQuery)->whereDate('created_at', Carbon::today())->sum('quantity');

        // Return the view with data
        return Inertia::render('Admin/Comments/OrderRecommended', $d);
    }

    public function order_recommended_edit($unique_id)
    {
        $d['orders'] = Cart::where('unique_id', $unique_id)->get();
        $d['ordersDetail'] = Cart::where('unique_id', $unique_id)->first();

        // Return the view with data
        return Inertia::render('Admin/Comments/OrderRecommendedEdit', $d);
    }

    public function order_recommended_show($unique_id)
    {
        $d['orders'] = Cart::where('unique_id', $unique_id)->get();
        $d['ordersDetail'] = Cart::where('unique_id', $unique_id)->first();

        // Return the view with data
        return Inertia::render('Admin/Comments/OrderRecommendedShow', $d);
    }

    public function order_recommended_update(Request $request, string $unique_id)
    {
        $transferStatus = $request->validate([
            'qty_checked.*' => 'required',
        ]);
        foreach ($request->order_id as $index => $orderId) {

            $qty_checked = $request->qty_checked[$index];
            $cart = Cart::where('unique_id', $unique_id)
                ->where('id', $orderId)
                ->first();
            if ($cart) {
                $cart->qty_checked = $qty_checked;
                $cart->is_checked = true;
                $cart->status = 'Complete';
                $cart->save();
            } else {
                throw new \Exception("Order with ID $orderId not found for the unique_id $unique_id.");
            }
        }

        return back()->with('success', 'Order Checked');
    }

    public function settings()
    {
        return Inertia::render('Admin/Settings');
    }

    public function exported_products(Request $request)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $customerName = [];

        $exports = Export::whereDate('created_at', $currentDate)->orderBy('id', 'desc')->filter(request(['search']))->get();

        foreach ($exports as $export) {
            $decodedTin = json_decode($export->tin, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $customerName[] = $decodedTin;
            } else {
                $customerName[] = $export->tin;
            }
        }

        $myexports = Export::all()->sum(function ($export) {
            $quantities = json_decode($export->product_quantity, true);
            $prices = json_decode($export->product_price, true);

            if (is_array($quantities) && is_array($prices)) {
                $total = 0;
                foreach ($quantities as $index => $quantity) {
                    if (isset($prices[$index])) {
                        $total += (float) $quantity * (float) $prices[$index];
                    }
                }

                return $total;
            }

            return 0;
        });

        // Calculate total of all products exported today
        $datePrice = Export::whereDate('created_at', $currentDate)->get()->sum(function ($export) {
            $quantities = json_decode($export->product_quantity, true);
            $prices = json_decode($export->product_price, true);

            if (is_array($quantities) && is_array($prices)) {
                $total = 0;
                foreach ($quantities as $index => $quantity) {
                    if (isset($prices[$index])) {
                        $total += (float) $quantity * (float) $prices[$index];
                    }
                }

                return $total;
            }

            return 0;
        });

        // Count total components exported today
        $totalComponents = Export::whereDate('created_at', $currentDate)->whereNotNull('product_name')->count();

        if ($request->has('search') && $request->search != '') {
            $searchDate = $request->search;

            $datePrice = Export::whereDate('created_at', $searchDate)->get()->sum(function ($export) {
                $quantities = json_decode($export->product_quantity, true);
                $prices = json_decode($export->product_price, true);

                if (is_array($quantities) && is_array($prices)) {
                    $total = 0;
                    foreach ($quantities as $index => $quantity) {
                        if (isset($prices[$index])) {
                            $total += (float) $quantity * (float) $prices[$index];
                        }
                    }

                    return $total;
                }

                return 0;
            });

            $totalComponents = Export::whereDate('created_at', $searchDate)->whereNotNull('product_name')->count();
        }

        return Inertia::render('Admin/ExportedProducts', [
            'products' => Product::all(),
            'exports' => $exports,
        ], compact('myexports', 'datePrice', 'totalComponents', 'currentDate', 'customerName'));
    }

    public function view_all_sales(Request $request)
    {
        $currentDate = Carbon::now()->format('Y-m-d');

        $sales = Export::all();

        $customerName = [];

        $exports = Export::orderBy('id', 'desc')->get();

        foreach ($exports as $export) {
            $decodedTin = json_decode($export->tin, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $customerName[] = $decodedTin;
            } else {
                $customerName[] = $export->tin;
            }
        }

        $myexports = Export::all()->sum(function ($export) {
            $quantities = json_decode($export->product_quantity, true);
            $prices = json_decode($export->product_price, true);

            if (is_array($quantities) && is_array($prices)) {
                $total = 0;
                foreach ($quantities as $index => $quantity) {
                    if (isset($prices[$index])) {
                        $total += (float) $quantity * (float) $prices[$index];
                    }
                }

                return $total;
            }

            return 0;
        });

        $datePrice = $myexports;
        $totalComponents = Export::whereNotNull('product_name')->count();

        if ($request->has('search') && $request->search != '') {
            $searchDate = $request->search;

            $exports = Export::whereDate('created_at', $searchDate)->get();

            $datePrice = Export::whereDate('created_at', $searchDate)->get()->sum(function ($export) {
                $quantities = json_decode($export->product_quantity, true);
                $prices = json_decode($export->product_price, true);

                if (is_array($quantities) && is_array($prices)) {
                    $total = 0;
                    foreach ($quantities as $index => $quantity) {
                        if (isset($prices[$index])) {
                            $total += (float) $quantity * (float) $prices[$index];
                        }
                    }

                    return $total;
                }

                return 0;
            });

            $totalComponents = Export::whereDate('created_at', $searchDate)->whereNotNull('product_name')->count();
        }

        // $exports =  Export::whereDate('created_at', $currentDate);

        return Inertia::render('Admin/AllSales', [
            'products' => Product::all(),
            'exports' => $exports,
        ], compact('myexports', 'datePrice', 'totalComponents', 'currentDate', 'customerName'));
    }

    public function loans_products(Request $request)
    {
        $todayDate = Carbon::now()->format('Y-m-d');

        $exports = Export::filter(request(['search']))->get();

        $decodedExports = [];
        $customer_name = [];

        foreach ($exports as $export) {
            $decodedExports[] = [
                'id' => $export->id,
                'customerNames' => json_decode($export->tin, true),
                'productName' => json_decode($export->product_name, true),
                'unitPrice' => json_decode($export->product_price, true),
                'product_quantity' => json_decode($export->product_quantity, true),
                'staffName' => json_decode($export->staff_name, true),
                'status' => json_decode($export->status, true),
                'payment_date' => json_decode($export->payment_date, true),
                'saleMode' => json_decode($export->sale_mode, true),
                'created_at' => $export->created_at,
            ];
            $customer_name[] = json_decode($export->customer_name, true);
        }

        if ($request->has(['start_date', 'end_date']) && $request->start_date != '' && $request->end_date != '') {
            $fromDate = $request->start_date;
            $toDate = $request->end_date;

            $exports = Export::whereJsonContains('payment_date', function ($query) use ($fromDate, $toDate) {
                $query->whereBetween('payment_date', [$fromDate, $toDate]);
            })->get();
        }

        return Inertia::render('Admin/LoansProduct', [
            'exports' => $decodedExports,
            'todayDate' => $todayDate,
        ], compact('customer_name'));
    }

    // public function authentication(Request $request)
    // {
    //     $credentials = $request->validate([
    //         'email_or_phone' => 'required',
    //         'password' => 'required',
    //     ]);
    //     if (
    //         Auth::guard('web')->attempt(
    //             [
    //                 'staff_email' => $credentials['email_or_phone'],
    //                 'password' => $credentials['password']
    //             ]
    //         )
    //         || Auth::guard('web')->attempt(
    //             [
    //                 'staff_phone' => $credentials['email_or_phone'],
    //                 'password' => $credentials['password']
    //             ]
    //         )
    //     ) {
    //         $user = Auth::guard('web')->user();
    //         $request->session()->regenerate();

    //         switch ($user->role_id) {
    //             case '1':
    //             case '2':
    //             case '3':
    //                 return redirect(route('dashboard'))->with('message', 'Login SuccesFully')
    //                     ->with('status', 'success')
    //                     ->withInput();
    //                 ;
    //             case '4':
    //                 return redirect('/')
    //                 // ->route('/')
    //                 ->with('success', 'Logged in successfully!');
    //             default:
    //                 Auth::guard('web')->logout();
    //                 return redirect()->back()->with('error', 'Unauthorized role!');
    //         }
    //     }
    //     return redirect()->back()
    //         ->with('message', 'Incorrect Phone Number or password!')
    //         ->with('status', 'danger')
    //         ->withInput();

    // }

    public function authentication(Request $request)
    {
        $credentials = $request->validate([
            'email_or_phone' => 'required',
            'password' => 'required',
        ]);

        \Log::info('Login Attempt Dump', ['creds' => $credentials]);

        $loginField = filter_var($credentials['email_or_phone'], FILTER_VALIDATE_EMAIL) ? 'staff_email' : 'staff_phone';

        if (Auth::guard('web')->attempt([
            $loginField => $credentials['email_or_phone'],
            'password' => $credentials['password'],
        ])) {
            $user = Auth::guard('web')->user();
            \Log::info('Web Guard Success', ['user_id' => $user->id, 'role_id' => $user->role_id]);

            if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
                \Log::info('Unverified Email - logging out');
                Auth::guard('web')->logout();

                return redirect()->back()->with('message', 'Please verify your email address before logging in. If you did not receive the email, please check your spam folder.')->with('status', 'warning');
            }

            $request->session()->regenerate();
            \Log::info('Session regenerated');

            if ($user->role_id == 12) {
                $url = route('home');
            } else {
                $url = route('dashboard');
            }

            \Log::info('Redirecting to intended URL', ['url' => $url]);

            return redirect()->intended($url)
                ->with('message', 'Login Successfully')
                ->with('status', 'success');
        } else {
            \Log::info('Web Guard Failed');
        }

        // Customer Guard Fallback
        \Log::info('Checking Customer Guard');
        $loginFieldCustomer = filter_var($credentials['email_or_phone'], FILTER_VALIDATE_EMAIL) ? 'customer_email' : 'customer_phone';
        if (Auth::guard('customers')->attempt([
            $loginFieldCustomer => $credentials['email_or_phone'],
            'password' => $credentials['password'],
        ])) {
            $user = Auth::guard('customers')->user();
            \Log::info('Customer Guard Success', ['user_id' => $user->id]);

            if ($user && ! $user->hasVerifiedEmail()) {
                \Log::info('Unverified Customer Email - logging out');
                Auth::guard('customers')->logout();

                return redirect()->back()->with('message', 'Please verify your email address before logging in. If you did not receive the email, please check your spam folder.')->with('status', 'warning');
            }

            $request->session()->regenerate();
            \Log::info('Customer Redirecting to Home', ['url' => route('home')]);

            return redirect()->intended(route('home'))
                ->with('message', 'Login Successfully')
                ->with('status', 'success');
        } else {
            \Log::info('Customer Guard Failed');
        }

        \Log::info('Both guards failed - redirecting back with errors');

        return redirect()->back()
            ->withErrors(['email_or_phone' => 'Incorrect Email/Phone or password!'])
            ->withInput();
    }

    public function edit_profile_details(Request $request, User $user)
    {
        $profileDetails = $request->validate([
            'staff_id' => 'required',
            'staff_name' => 'required',
            'staff_email' => 'required',
            'staff_phone' => 'required',
            'profile' => 'required',
        ]);
        if ($request->hasFile('profile')) {
            $profileDetails['profile'] = $request->file('profile')->store('profiles', 'public');
        }

        $user->update($profileDetails);

        return redirect()->back()->with('success_update', 'Profile updated successfully!');
    }

    public function edit_user_pass(Request $request, User $user)
    {
        $user_passDetails = $request->validate([
            'username' => 'required',
            'password' => 'required|min:8',
            'password_confirm' => 'required|min:8',
        ]);

        $password = $request->password;
        $password_confirm = $request->password_confirm;

        if ($password != $password_confirm) {
            return redirect()->back()
                ->with('message', 'Sorry! Passwords do not match!')
                ->with('status', 'danger')
                ->withInput();
        } else {

            $user->update([
                $user_passDetails['username'],
                $user_passDetails['password'],
            ]);

            return redirect()->back()
                ->with('message', 'Passwords updated successfully!')
                ->with('status', 'success')
                ->withInput();
        }
    }

    public function invalidate_users(Request $request)
    {
        // Logout staff/admin
        if (Auth::guard('web')->check()) {
            Auth::guard('web')->logout();
        }

        // Logout customers
        if (Auth::guard('customers')->check()) {
            Auth::guard('customers')->logout();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('logout_flash_mgs', 'Logged out successfully!');
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

        $transfers = Transfer::all();

        foreach ($transfers as $key => $transfer) {
            $transfers[$key]->product_name = json_decode($transfer->product_name, true);
            $transfers[$key]->store_name = json_decode($transfer->store_name, true);
            $transfers[$key]->product_quantity = json_decode($transfer->product_quantity, true);
        }

        return Inertia::render('Admin/SingleExport', [
            // 'transfers' => Transfer::all(),
            'stores' => Store::all(),
            'product' => $product,
            'stores' => Store::all(),
            'users' => User::where('staff_email', '!=', 'developer@gmail.com')->get(),
            'sales' => $sales,
            'chartData' => $chartData,
        ], compact('transfers'));
    }

    public function edit_loan_details(Request $request, Export $export)
    {
        $loanDetails = $request->validate([
            'status.*' => 'required|string',
            'payment_date.*' => 'required|date',
        ]);

        $loanStatus = $loanDetails['status'];
        $loanPaymentDate = $loanDetails['payment_date'];

        $export->update([
            'status' => json_encode($loanStatus),
            'payment_date' => json_encode($loanPaymentDate),
        ]);

        // dd($request->all());

        return redirect()->back();
    }

    public function make_orders(Request $request)
    {
        $orders = Order::filter(request(['search']))->orderBy('id', 'desc')->get();

        $productName = [];
        $quantity = [];
        foreach ($orders as $key => $order) {
            $productName[] = json_decode($order->product_name, true);
            $quantity[] = json_decode($order->quantity, true);
        }

        if ($request->has(['start_date', 'end_date']) && $request->start_date != '' && $request->end_date != '') {
            $fromDate = $request->start_date;
            $toDate = $request->end_date;

            $orders = Order::whereBetween('created_at', [$fromDate, $toDate])->get();
        }

        $containers = Container::orderBy('id', 'asc')->get();
        $posts = Post::filter(request(['search']))->orderBy('id', 'asc')->get();

        return Inertia::render('Admin/CreateOrders', compact('posts', 'containers', 'orders', 'productName', 'quantity'));
    }

    public function post_orders(Request $request)
    {

        $orderDetails = $request->validate([
            'order_name' => 'required|max:255',
            'staff_name' => 'required|string|max:255',
            'container_id' => 'required',
            // 'product_name' => 'required',
            // 'quantity' => 'required|integer',
        ]);

        $orderName = $orderDetails['order_name'];
        $staffName = $orderDetails['staff_name'];
        $containerIds = $orderDetails['container_id'];
        // $productNames = $orderDetails['product_name'];
        // $quantities = $orderDetails['quantity'];

        Order::create([
            'order_name' => $orderName,
            'staff_name' => $staffName,
            'container_id' => $containerIds,
            // 'product_name' => $productNames,
            // 'quantity' => $quantities,
        ]);

        return redirect()->back()->with('success_created', 'Order created successfully!');
    }

    public function single_order($id)
    {
        $containers = Container::all();

        $order = Order::find($id);
        $orderId = json_decode($order->id, true);
        $staffName = json_decode($order->staff_name, true);
        $containerId = json_decode($order->container_id, true);
        $productName = json_decode($order->product_name, true);
        $quantity = json_decode($order->quantity, true);

        return Inertia::render('Admin/ViewMore', compact('order', 'staffName', 'containerId', 'productName', 'quantity', 'containers'));
    }

    public function create_products(Request $request)
    {
        $postPrpduct = $request->validate([
            'product_id' => ['required', Rule::unique('posts', 'product_id')],
            'product_name' => 'required|string|max:255',
            'cbm' => 'required|numeric',
            // 'length' => 'required|numeric',
            // 'width' => 'required|numeric',
            // 'height' => 'required|numeric',
            'weight' => 'required|numeric',
            'price' => 'required|numeric',
        ]);

        $existingPost = Post::where('product_id', $request->input('product_id'))->first();

        if ($existingPost) {
            return redirect()->back()->withErrors('Product already exists!')->withInput();
        }

        Post::create($postPrpduct);

        return redirect()->back()->with('prod_created_flash_msg', 'Product registered successfully!');
    }

    public function edit_product_imported(Request $request, Product $product)
    {
        $editedImported = $request->validate([
            // 'product_id' => 'required',
            'product_name' => 'required',
            'product_quantity' => 'required',
            'product_price' => 'required',
            'store_name' => 'required',
            'description' => 'required',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('product_image')) {
            $editedImported['product_image'] = $request->file('product_image')->store('products', 'public');
        }

        $product->update($editedImported);

        return redirect()->back()->with('import_success', 'Product impoted successfully');
    }

    public function store_comments(Request $request)
    {
        $commentsDetails = $request->validate([
            'product_name' => 'required',
            'comment' => 'required|string|max:255',
            'store_name' => 'required',
            'commented_staff' => 'required',
        ]);

        Comment::create($commentsDetails);

        return redirect()->back()->with('comment_sent', 'Comment sent successfully!');
    }

    public function single_user_load($id)
    {
        return Inertia::render('Admin/SingleUser', [
            'user' => User::find($id),
        ]);
    }

    public function edit_user(Request $request, User $user)
    {
        $editedProfile = $request->validate([
            'staff_id' => 'required',
            'staff_name' => 'required',
            'staff_role' => 'required',
            'staff_email' => 'required',
            'staff_phone' => 'required',
            'username' => 'required',
            'password' => 'required',
            'profile' => 'nullable',
        ]);

        if ($request->hasFile('profile')) {
            $editedProfile['profile'] = $request->file('profile')->store('profiles', 'public');
        }

        $user->update($editedProfile);

        return redirect()->back()->with('success_edit', 'User updated successfully!');
    }

    public function delete_user(Request $request, User $user)
    {
        $user->delete();

        return redirect('/admin/users')->with('success_delete', 'User deleted successfully!');
    }

    public function show_single_store($id)
    {
        $product_name = Product::select('product_name')->groupBy('product_name')->get();
        $productDescrp = Product::select('description')->groupBy('description')->get();

        $store = Store::find($id);

        $singleTransfer = Transfer::all();

        $storeName = [];
        $productName = [];
        $productQuantity = [];
        $created_at = [];

        foreach ($singleTransfer as $index => $transfer) {
            $storeName[] = $this->decodeJson($transfer->store_name);
            $productName[] = $this->decodeJson($transfer->product_name);
            $productQuantity[] = $this->decodeJson($transfer->product_quantity);
            $created_at[] = $this->decodeJson($transfer->created_at);
        }

        return Inertia::render('Admin/SingleStore', [
            'users' => User::where('staff_email', '!=', 'developer@gmail.com')->get(),
            'store' => $store,
            'products' => Product::orderBy('id', 'asc')->get(),
            'transfers' => Transfer::all(),
        ], compact('storeName', 'productName', 'productQuantity', 'created_at', 'product_name', 'productDescrp'));
    }

    private function decodeJson($data)
    {
        return is_string($data) && is_array(json_decode($data, true)) ? json_decode($data, true) : $data;
    }

    public function reset_password()
    {
        return Inertia::render('ResetPassword');
    }

    public function edit_export_product($id)
    {
        return Inertia::render('Admin/EditExproduct', [
            'product' => Export::find($id),
        ]);
    }

    public function edit_sales(Request $request, Export $product)
    {
        $salesData = $request->validate([
            // 'product_image' => 'required',
            // 'product_id' => 'required',
            'product_name' => 'required',
            'customer_name' => 'required',
            'staff_name' => 'required',
            'product_quantity' => 'required',
            'product_price' => 'required',
        ]);

        $product->update($salesData);

        return redirect('/admin/exported-products')->with('edit_success_sale', 'Sales updated successfully!');
    }

    public function tranfered_products()
    {
        $exports = Transfer::select('product_name', 'created_at', 'product_quantity')
            ->orderBy('created_at', 'asc')
            ->get();

        $chartData = $exports->map(function ($export) {
            $productNames = is_string($export->product_name) ? json_decode($export->product_name) : [];
            $productQuantities = is_string($export->product_quantity) ? json_decode($export->product_quantity) : [];

            if (! is_array($productNames) || ! is_array($productQuantities) || count($productNames) !== count($productQuantities)) {
                return null;
            }

            return [
                'product_names' => $productNames,
                'created_at' => $export->created_at->format('Y-m-d'),
                'product_quantities' => $productQuantities,
            ];
        })->filter();

        $dates = $chartData->pluck('created_at')->unique()->sort()->values();

        $dataByProduct = $chartData->flatMap(function ($data) {
            return collect($data['product_names'])->mapWithKeys(function ($productName, $index) use ($data) {
                if (isset($data['product_quantities'][$index])) {
                    return [$productName => [$data['created_at'] => $data['product_quantities'][$index]]];
                } else {
                    return [];
                }
            });
        })->groupBy(function ($item, $key) {
            return $key;
        })->map(function ($items) {
            return $items->collapse();
        });
        $nowDate = Carbon::now()->format('Y-m-d');

        return Inertia::render('Admin/TransferedProducts', [
            'transfers' => Transfer::latest()->filter(request(['search']))->paginate(10),
            'chartData' => $dataByProduct,
            'dates' => $dates,
        ], compact('nowDate'));
    }

    public function single_transfer($id)
    {

        $stores = Store::all();

        $nowDate = Carbon::now()->format('Y-m-d');

        $transfer = Transfer::find($id);

        $createdAt = json_decode($transfer->created_at, true);
        $staff_name = json_decode($transfer->staff_name, true);
        $reason = json_decode($transfer->reason, true);
        $staff_recommended = json_decode($transfer->staff_recommeded, true);
        $sourceStores = json_decode($transfer->source_store, true);
        $destinationStores = json_decode($transfer->store_name, true);
        $productNames = json_decode($transfer->product_name, true);
        $productQuantities = json_decode($transfer->product_quantity, true);

        return Inertia::render('Admin/TransferedItem', [
            'transfer' => $transfer,
        ], compact('productNames', 'productQuantities', 'sourceStores', 'destinationStores', 'createdAt', 'staff_name', 'reason', 'staff_recommended', 'nowDate', 'stores'));
    }

    public function all_transfers()
    {
        $nowDate = Carbon::now()->format('Y-m-d');

        return Inertia::render('Admin/AllTransfers', [
            'transfers' => Transfer::latest()->filter(request(['search']))->get(),
        ], compact('nowDate'));
    }

    public function print_invoice($id)
    {
        $product = Export::find($id);
        $product->customer_name = json_decode($product->customer_name, true);
        $product->phone = json_decode($product->phone, true);
        $product->tin = json_decode($product->tin, true);

        return Inertia::render('Admin/Print', [
            'product' => $product,
            'customer_name' => $product->customer_name,
            'customerPhone' => $product->phone,
            'tin' => $product->tin,
        ]);
    }

    public function delete_single_product(Request $request, Product $product)
    {
        $product->delete();

        return redirect()->back()->with('success_delete_product', 'Product deleted successfully!');
    }

    public function transfer_report(Request $request)
    {
        $transfers = Transfer::all();
        $quantity = [];
        $totalQuantity = 0;
        $totalPrice = 0;

        foreach ($transfers as $key => $product) {
            $transfers[$key]->quantity = json_decode($product->product_quantity, true);
            $transfers[$key]->price = json_decode($product->product_price, true);
            $transfers[$key]->productId = json_decode($product->product_id, true);
            $transfers[$key]->productName = json_decode($product->product_name, true);
            $transfers[$key]->productDate = json_decode($product->created_at, true);
            $transfers[$key]->sourceStore = json_decode($product->source_store, true);
            $transfers[$key]->destinationStore = json_decode($product->store_name, true);

            $sourceStore = json_decode($product->source_store, true);
            $destinationStore = json_decode($product->store_name, true);
            $reason = json_decode($product->reason, true);
            $staffRec = json_decode($product->staff_recommeded, true);
            $status = json_decode($product->status, true);

            if (is_array($transfers[$key]->quantity) && is_array($transfers[$key]->price)) {
                foreach ($transfers[$key]->quantity as $idx => $qty) {
                    $totalQuantity += $qty;
                    $totalPrice += $qty * $transfers[$key]->price[$idx];
                }
            } elseif (is_numeric($transfers[$key]->quantity) && is_numeric($transfers[$key]->price)) {
                $totalQuantity += $transfers[$key]->quantity;
                $totalPrice += $transfers[$key]->quantity * $transfers[$key]->price;
            }
        }

        $myexports = $totalPrice;

        if ($request->has(['start_date', 'end_date']) && $request->start_date && $request->end_date) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            $transfers = Transfer::whereBetween('created_at', [$startDate, $endDate])->get();

            $datePrice = 0;
            foreach ($transfers as $filteredExport) {
                $filteredQuantity = json_decode($filteredExport->product_quantity, true);
                $filteredPrice = json_decode($filteredExport->product_price, true);

                if (is_array($filteredQuantity) && is_array($filteredPrice)) {
                    foreach ($filteredQuantity as $idx => $qty) {
                        $datePrice += $qty * $filteredPrice[$idx];
                    }
                } else {
                    if (is_numeric($filteredQuantity) && is_numeric($filteredPrice)) {
                        $datePrice += $filteredQuantity * $filteredPrice;
                    }
                }
            }
        } else {
            $datePrice = $myexports;
        }

        $flattenArray = function ($array) {
            $flatArray = [];
            array_walk_recursive($array, function ($value) use (&$flatArray) {
                $flatArray[] = $value;
            });

            return $flatArray;
        };

        $quantities = array_column($transfers->toArray(), 'quantity');
        $flatQuantities = $flattenArray($quantities);
        $myquantities = array_sum($flatQuantities);

        return Inertia::render('Admin/TransferReport', [
            'totalQuantity' => $myquantities,
            'products' => Product::all(),
        ], compact('datePrice', 'transfers', 'sourceStore', 'destinationStore', 'staffRec', 'reason', 'status'));
    }

    public function delete_order(Request $request, Order $order)
    {
        $order->delete();

        return redirect('/admin/create-orders')->with('order_deleted_flash_msg', 'Order deleted successfully!');
    }

    public function edit_order(Request $request, Order $order)
    {
        // Validate the input
        $orderDetails = $request->validate([
            'order_name' => 'required',
            'container_id' => 'required',
            'product_name.*' => 'required',
            'quantity.*' => 'required',
        ]);

        $orderName = $orderDetails['order_name'];
        $containerId = $orderDetails['container_id'];
        $productName = $orderDetails['product_name'];
        $quantity = $orderDetails['quantity'];

        $existingProductNames = is_array($order->product_name) ? $order->product_name : json_decode($order->product_name, true);
        $existingQuantities = is_array($order->quantity) ? $order->quantity : json_decode($order->quantity, true);

        $mergedProductNames = array_merge($existingProductNames ?? [], $productName);
        $mergedQuantities = array_merge($existingQuantities ?? [], $quantity);

        $order->update([
            'order_name' => $orderName,
            'container_id' => $containerId,
            'product_name' => json_encode($mergedProductNames),
            'quantity' => json_encode($mergedQuantities),
        ]);

        return redirect()->back()->with('order_updated_msg', 'Order updated successfully!');
    }

    public function view_posters(Request $request)
    {
        $posts = Post::orderBy('id', 'asc')->get();

        if ($request->has(['start_date', 'end_date']) && $request->start_date != '' && $request->end_date != '') {
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            $posts = Post::whereBetween('created_at', [$startDate, $endDate])->get();
        }

        return Inertia::render('Admin/ViewProducts', compact('posts'));
    }

    public function delete_post_product(Request $request, Post $post)
    {
        $post->delete();

        return redirect()->back();
    }

    public function edit_post_product(Request $request, Post $post)
    {
        $postDetails = $request->validate([
            'product_id' => 'required',
            'product_name' => 'required',
            'price' => 'required',
            'weight' => 'required',
            'cbm' => 'required',
        ]);

        $post->update($postDetails);

        return redirect()->back();
    }

    public function view_order($id)
    {
        $containers = Container::all();
        $order = Order::find($id);

        $productName = json_decode($order->product_name, true);
        $quantity = json_decode($order->quantity, true);

        $posts = Post::all();

        return Inertia::render('Admin/ViewOrder', compact('posts', 'order', 'containers', 'productName', 'quantity'));
    }

    public function add_product_order(Request $request, Order $order)
    {
        $orderProductsAdd = $request->validate([
            'product_name.*' => 'required',
            'quantity.*' => 'required',
        ]);

        $productName = $orderProductsAdd['product_name'];
        $quantity = $orderProductsAdd['quantity'];

        $order->update([
            'product_name' => json_encode($productName),
            'quantity' => json_encode($quantity),
        ]);

        return redirect()->back()->with('success_order_msg', 'Order Products added to this order!');
    }
}
