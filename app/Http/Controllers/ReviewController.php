<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request, $productId)
    {
        $validatedData = $request->validate([
            'customer_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $validatedData['product_id'] = $productId;

        Review::create($validatedData);

        return back()->with('success', 'Review submitted successfully.');
    }
}
