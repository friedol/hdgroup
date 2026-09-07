<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feedback;
use App\Models\HeroSlide;
use App\Models\Product;
use App\Models\Session;
use App\Models\Setting;
use App\Models\User;
use App\Traits\AuthenticateTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    use AuthenticateTrait;

    /**
     * Resolve and persist the active branch for public pages.
     * Priority: explicit ?branch / ?branch_id -> existing session -> null.
     */
    protected function resolveActiveBranchId(Request $request)
    {
        $requestedBranch = $request->input('branch') ?? $request->input('branch_id');

        if ($requestedBranch === 'global') {
            session()->forget('active_branch_id');

            return null;
        }
        if ($requestedBranch) {
            $branch = Branch::where('is_active', true)
                ->where(function ($q) use ($requestedBranch) {
                    $q->where('id', (is_numeric($requestedBranch) ? (int) $requestedBranch : 0))
                        ->orWhere('slug', $requestedBranch);
                })
                ->first();
            if ($branch) {
                session(['active_branch_id' => $branch->id]);
            }
        }

        return session('active_branch_id');
    }

    public function help_desk()
    {
        return inertia('Support/HelpDesk');
    }

    public function about()
    {
        return inertia('About');
    }

    public function contact()
    {
        $phonesRaw = Setting::getValue('support_phone_numbers');
        $phones = [];
        if ($phonesRaw) {
            $decoded = json_decode($phonesRaw, true);
            if (is_array($decoded)) {
                $phones = array_values(array_filter(array_map('trim', $decoded)));
            }
        }

        if (empty($phones)) {
            $phones = array_values(array_filter([
                Setting::getValue('business_whatsapp'),
                Setting::getValue('business_phone'),
                Setting::getValue('company_phone'),
            ]));
        }

        return inertia('Contact', [
            'contactInfo' => [
                'companyName' => Setting::getValue('business_name', 'HD GLOBAL GROUP LTD.'),
                'phones' => $phones,
                'email' => Setting::getValue('business_email', 'info@hdpackaging.co.tz'),
                'address' => Setting::getValue('business_address', 'Sinza Area, Block 45-A, Dar es Salaam'),
                'mapUrl' => Setting::getValue('business_map_url', 'https://maps.google.com'),
            ],
        ]);
    }

    public function saveFeedback(Request $data)
    {
        Feedback::create([
            'name' => $data->name,
            'phone' => $data->phone,
            'inquire' => $data->subject,
            'message' => $data->message,
        ]);

        return redirect()->back()->with('success', 'Feedback sent successfully');
    }

    public function submitContact(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'contact' => 'required|string|max:160',
            'message' => 'required|string|max:2000',
            'subject' => 'nullable|string|max:120',
        ]);

        Feedback::create([
            'name' => $validated['name'],
            'phone' => $validated['contact'],
            'inquire' => $validated['subject'] ?? 'Contact Form Message',
            'message' => $validated['message'],
        ]);

        return back()->with('success', 'Your message has been sent successfully.');
    }

    public function home_page(Request $request)
    {
        $selectedBranchId = $request->input('branch') ?? $request->input('branch_id');
        $activeBranchId = $this->resolveActiveBranchId($request);

        $categories = Category::orderBy('category_name', 'asc')->get();
        $productsQuery = Product::with([
            'productManagement.images' => function ($query) {
                $query->orderBy('is_featured', 'desc')->limit(1);
            },
            'productManagement.category',
            'variants',
        ])
            ->where('is_enabled', true);

        if ($activeBranchId) {
            $productsQuery
                ->withSum(['inventories as total_qty' => function ($q) use ($activeBranchId) {
                    $q->where('branch_id', $activeBranchId)->where('product_type', 'finished_product');
                }], 'qty');
        } else {
            $productsQuery->withSum(['inventories as total_qty' => function ($q) {
                $q->where('product_type', 'finished_product');
            }], 'qty');
        }

        $products = $productsQuery->orderBy('product_name', 'asc')->limit(24)->get();

        $heroSlides = HeroSlide::withoutGlobalScope('branch')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('page_type', 'home')->orWhereNull('page_type');
            })
            ->where('is_ad', false)
            ->where(function ($q) use ($activeBranchId) {
                // Show global slides (null branch_id) OR slides for the active branch
                $q->whereNull('branch_id');
                if ($activeBranchId) {
                    $q->orWhere('branch_id', $activeBranchId);
                }
            })
            ->orderBy('sort_order')
            ->get();

        $popupAds = HeroSlide::withoutGlobalScope('branch')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('page_type', 'home')->orWhereNull('page_type');
            })
            ->where('is_ad', true)
            ->where(function ($q) use ($activeBranchId) {
                // Show global ads (null branch_id) OR ads for the active branch
                $q->whereNull('branch_id');
                if ($activeBranchId) {
                    $q->orWhere('branch_id', $activeBranchId);
                }
            })
            ->orderBy('sort_order')
            ->get();

        $rightAd = $popupAds->first();

        return inertia('Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'activeBranchId' => $activeBranchId,
            'selectedBranchId' => $selectedBranchId,
            'heroSlides' => $heroSlides,
            'popupAds' => $popupAds,
            'rightAd' => $rightAd,
        ]);
    }

    public function searchProduct(Request $request)
    {
        $activeBranchId = $this->resolveActiveBranchId($request);
        $query = $request->input('search');

        if ($request->ajax() && ! $request->header('X-Inertia')) {
            $productsQuery = Product::with([
                'productManagement.images' => function ($query) {
                    $query->orderBy('is_featured', 'desc')->limit(1);
                },
                'productManagement.category',
                'variants',
            ])
                ->where('is_enabled', true);

            if ($activeBranchId) {
                $productsQuery->withSum(['inventories as total_qty' => function ($q) use ($activeBranchId) {
                    $q->where('branch_id', $activeBranchId)->where('product_type', 'finished_product');
                }], 'qty');
            } else {
                $productsQuery->withSum(['inventories as total_qty' => function ($q) {
                    $q->where('product_type', 'finished_product');
                }], 'qty');
            }

            $productsQuery->where(function ($q) use ($query) {
                $q->where('product_name', 'LIKE', "%{$query}%")
                    ->orWhere('product_id', 'LIKE', "%{$query}%")
                    ->orWhereHas('productManagement', function ($pmQuery) use ($query) {
                        $pmQuery->where('description', 'LIKE', "%{$query}%");
                    });
            });

            $products = $productsQuery->orderBy('product_name', 'asc')->get();

            return response()->json($products);
        } else {
            $productsQuery = Product::with([
                'productManagement.images' => function ($query) {
                    $query->orderBy('is_featured', 'desc')->limit(1);
                },
                'productManagement.category',
                'variants',
            ])
                ->where('is_enabled', true);

            if ($activeBranchId) {
                $productsQuery->withSum(['inventories as total_qty' => function ($q) use ($activeBranchId) {
                    $q->where('branch_id', $activeBranchId)->where('product_type', 'finished_product');
                }], 'qty');
            } else {
                $productsQuery->withSum(['inventories as total_qty' => function ($q) {
                    $q->where('product_type', 'finished_product');
                }], 'qty');
            }

            $productsQuery->where(function ($q) use ($query) {
                $q->where('product_name', 'LIKE', "%{$query}%")
                    ->orWhereHas('productManagement', function ($pmQuery) use ($query) {
                        $pmQuery->where('description', 'LIKE', "%{$query}%");
                    });
            });

            $products = $productsQuery->orderBy('product_name', 'asc')->get();

            return inertia('Shop/Index', [
                'products' => $products,
                'categories' => Category::orderBy('category_name', 'asc')->get(),
                'activeBranchId' => $activeBranchId,
            ]);
        }
    }

    public function filter_product(Request $request, $id)
    {
        $activeBranchId = $this->resolveActiveBranchId($request);

        $productsQuery = Product::with([
            'productManagement.images' => function ($query) {
                $query->orderBy('is_featured', 'desc')->limit(1);
            },
            'productManagement.category',
            'variants',
        ])
            ->whereHas('productManagement', function ($query) use ($id) {
                $query->where('category_id', $id);
            })
            ->where('is_enabled', true);

        if ($activeBranchId) {
            $productsQuery
                ->withSum(['inventories as total_qty' => function ($q) use ($activeBranchId) {
                    $q->where('branch_id', $activeBranchId);
                }], 'qty');
        } else {
            $productsQuery->withSum(['inventories as total_qty' => function ($q) {
                $q->where('product_type', 'finished_product');
            }], 'qty');
        }

        $products = $productsQuery->orderBy('product_name', 'asc')->get();
        $category = Category::find($id);
        $categories = Category::orderBy('category_name', 'asc')->get();

        return inertia('Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'selectedCategory' => $category?->id,
            'activeBranchId' => $activeBranchId,
        ]);
    }

    public function category(Request $request)
    {
        $activeBranchId = $this->resolveActiveBranchId($request);

        $categories = Category::orderBy('category_name', 'asc')->get();
        $productsQuery = Product::with([
            'productManagement.images' => function ($query) {
                $query->orderBy('is_featured', 'desc')->limit(1);
            },
            'productManagement.category',
            'variants',
        ])
            ->where('is_enabled', true);

        if ($activeBranchId) {
            $productsQuery
                ->withSum(['inventories as total_qty' => function ($q) use ($activeBranchId) {
                    $q->where('branch_id', $activeBranchId);
                }], 'qty');
        } else {
            $productsQuery->withSum(['inventories as total_qty' => function ($q) {
                $q->where('product_type', 'finished_product');
            }], 'qty');
        }

        $products = $productsQuery->orderBy('product_name', 'asc')->get();

        return inertia('Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'activeBranchId' => $activeBranchId,
        ]);
    }

    public function register()
    {
        return inertia('Auth/Register');
    }

    public function profile()
    {
        return inertia('Account/Account', [
            'user' => auth()->user(),
        ]);
    }

    public function change_password(Request $data)
    {
        $validate = $data->validate([
            'password' => 'required|string',
            'password_confirm' => 'required|string',
        ]);

        if ($data->password != $data->password_confirm) {
            return redirect()->back()->with('invalid', 'New password and confirm password not match');
        }

        User::where('id', Auth::id())->update([
            'password' => bcrypt($data->password_confirm),
        ]);

        return redirect()->back()->with('success', 'Password changed successfully');
    }

    public function all_products(Request $request)
    {
        $categories = Category::orderBy('category_name', 'asc')->get();
        $productsQuery = Product::withSum(['inventories as total_qty' => function ($q) {
            $q->where('product_type', 'finished_product');
        }], 'qty')
            ->with([
                'productManagement.images' => function ($query) {
                    $query->orderBy('is_featured', 'desc')->limit(1);
                },
                'productManagement.category',
                'variants',
            ])
            ->where('is_enabled', true);

        if ($request->has('search')) {
            $query = $request->input('search');
            $productsQuery->where('product_name', 'LIKE', "%{$query}%");
        }

        $products = $productsQuery->orderBy('product_name', 'asc')->get();

        return inertia('Shop/Products', [
            'products' => $products,
            'categories' => $categories,
            'searchQuery' => $request->input('search'),
        ]);
    }

    public function categories_page()
    {
        $categories = Category::withCount('products as product_count')
            ->orderBy('category_name', 'asc')
            ->get();

        return inertia('Shop/Categories', [
            'categories' => $categories,
        ]);
    }
}
