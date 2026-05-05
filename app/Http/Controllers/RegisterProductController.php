<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Product;
use Illuminate\Http\Request;

class RegisterProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $posts = Post::all();
        return \Inertia\Inertia::render('Logistics/Products/Index', [
            'posts' => $posts
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    /**
     * Show the form for creating a new resource.
     */
    /**
     * Show the form for creating a new resource.
     */
    public function create() 
    {
        return \Inertia\Inertia::render('Logistics/Products/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $postPrpduct = $request->validate([
            'product_id' => 'required|unique:posts,product_id',
            'product_name' => 'required|string|max:255',
            'cbm' => 'required|numeric',
            'weight' => 'required|numeric',
            'price' => 'nullable|numeric',
            'pc_per_ctn'=>'nullable|integer|max:1000'
        ]);

        try {
            // Hardening: Ensure we don't accidentally register manufactured products directly
            $productRef = Product::where('product_id', $postPrpduct['product_id'])->first();
            if ($productRef && $productRef->product_type === 'manufactured') {
                throw new \Exception("Manufactured products cannot be registered via Port/Import. They must be produced.");
            }

            Post::create($postPrpduct);

            if ($request->ajax()) {
                return response()->json(['success' => 'Product Registered successfully.']);
            }
            return back()->with('success', 'Product Registered successfully.');

        } catch (\Exception $e) {
            if ($request->ajax()) {
                return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
            }
            return back()->with('error', 'Error: ' . $e->getMessage())->withInput();
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // Show returns edit for now
        return redirect()->route('register-products.edit', $id);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $post = Post::findOrFail($id);
        return \Inertia\Inertia::render('Logistics/Products/Edit', [
            'post' => $post
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $postPrpduct = $request->validate([
            'product_id' => 'required|unique:posts,product_id'. ($id ? ",$id" : ''),
            'product_name' => 'required|string|max:255',
            'cbm' => 'required|numeric',
     
            'weight' => 'required|numeric',
            'price' => 'required|numeric',
        ]);
        // dd($id);
        $Post = Post::findOrFail($id);
        try {
            $Post->update($postPrpduct);
            return response()->json(['success' => 'Post Updated  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $Post = Post::findOrFail($id);
        try {
            $Post->delete();
            return response()->json(['success' => 'Post deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
}
