<?php

namespace App\Http\Controllers\management;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $query = Category::withCount('products')->orderBy('category_name');

        if ($search) {
            $query->where('category_name', 'like', "%{$search}%");
        }

        $categories = $query->paginate(15)->withQueryString();

        return Inertia::render('Inventory/Categories/Index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    // ───────────────────────── NEW INERTIA CRUD METHODS ──────────────────────

    public function indexCrud(Request $request)
    {
        return $this->index($request);
    }

    public function createCrud()
    {
        return Inertia::render('Inventory/Categories/Create');
    }

    public function storeCrud(Request $request)
    {
        $branchId = session('active_branch_id') ?? (auth()->check() ? auth()->user()->branch_id : null);

        $validatedData = $request->validate([
            'category_name' => 'required|max:200|unique:categories,category_name,NULL,id,branch_id,'.($branchId ?: 'NULL'),
            'category_desc' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
            $validatedData['image_url'] = '/storage/'.$imagePath;
        }

        $validatedData['branch_id'] = $branchId ?? active_branch_id();

        try {
            Category::create($validatedData);

            return redirect()->route('categories.index.crud')->with('success', 'Category Created successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'An error occurred while saving the category. Please try again.']);
        }
    }

    public function showCrud(string $id)
    {
        return $this->show($id);
    }

    public function editCrud(string $id)
    {
        $category = Category::findOrFail($id);

        return Inertia::render('Inventory/Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function updateCrud(Request $request, string $id)
    {
        $branchId = session('active_branch_id') ?? (auth()->check() ? auth()->user()->branch_id : null);

        $validatedData = $request->validate([
            'category_name' => 'required|max:200|unique:categories,category_name,'.$id.',id,branch_id,'.($branchId ?: 'NULL'),
            'category_desc' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $category = Category::findOrFail($id);

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
            $validatedData['image_url'] = '/storage/'.$imagePath;
        }

        try {
            $category->update($validatedData);

            return redirect()->route('categories.index.crud')->with('success', 'Category Updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'An error occurred. Please try again.']);
        }
    }

    public function destroyCrud(string $id)
    {
        $category = Category::findOrFail($id);

        try {
            $category->delete();

            return redirect()->route('categories.index.crud')->with('success', 'Category deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'An error occurred. Please try again.']);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create() {}

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $branchId = session('active_branch_id') ?? (auth()->check() ? auth()->user()->branch_id : null);

        $validatedData = $request->validate([
            'category_name' => 'required|max:200|unique:categories,category_name,NULL,id,branch_id,'.($branchId ?: 'NULL'),
        ]);
        $validatedData['branch_id'] = $branchId ?? active_branch_id();
        try {
            $category = Category::create($validatedData);

            return response()->json(['success' => 'Category Created  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while saving the budget. Please try again.'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = Category::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('category_name', $id);
        })->firstOrFail();

        $categoryId = $category->id;

        $d['category'] = $category;
        $d['products'] = Product::withSum('inventories as total_qty', 'qty')
            ->with('productManagement')
            ->whereHas('productManagement', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->orderBy('product_name', 'asc')
            ->get();

        // dd($d);
        return Inertia::render('Admin/Management/Categories/Show', $d);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $category = Category::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('category_name', $id);
        })->firstOrFail();

        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $branchId = session('active_branch_id') ?? (auth()->check() ? auth()->user()->branch_id : null);

        $validatedData = $request->validate([
            'category_name' => 'required|max:200|unique:categories,category_name,'.$id.',id,branch_id,'.($branchId ?: 'NULL'),
        ]);

        $category = Category::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('category_name', $id);
        })->firstOrFail();

        try {
            $category->update($validatedData);

            return response()->json(['success' => 'Category Updated  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('category_name', $id);
        })->firstOrFail();

        try {
            $category->delete();

            return response()->json(['success' => 'Category deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
}
