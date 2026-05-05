<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CartController;
use App\Http\Controllers\Account\OrderTrackingController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;

// use App\Http\Controllers\Auth\AuthController;

// Route::get('/sitemap', function () {
//     return asset('sekosupplier.xml');
// });
// Route::get('/index', [HomeController::class, 'index'])->name('login');
Route::get('/', [HomeController::class , 'home_page'])->name('home');
Route::get('/all/category', [HomeController::class , 'category'])->name('category.all');
Route::get('/category/{id}', [HomeController::class , 'filter_product'])->name('selectedCategory');
Route::get('/help/desk', [HomeController::class , 'help_desk'])->name('help.desk');
Route::post('/help/desk/save', [HomeController::class , 'saveFeedback'])->name('saveFeedback');
Route::get('/about', [HomeController::class , 'about'])->name('about');
Route::get('/product/find', [HomeController::class , 'searchProduct'])->name('product.search');


Route::get('/register', [ProfileController::class , 'register'])->name('register');
// Route::post('/ajax-register', [AuthController::class, 'ajaxRegister']);

Route::post('/create-account', [ProfileController::class , 'store_accounts'])->name('create.account');

// Email verification resend (Supports both Staff and Customers)
Route::post('/email/verification-notification', function (\Illuminate\Http\Request $request) {
    $user = auth()->user(); // Checks default/active guard
    
    if ($user && !$user->hasVerifiedEmail()) {
        $user->sendEmailVerificationNotification();
        return back()->with('status', 'verification-link-sent'); // Standard Laravel status for VerifyEmail page
    }
    return back()->with('status', 'Your email is already verified.');
})->middleware('auth:customers,web')->name('verification.send.customer');

// Custom Email Verification Handler (Overrides Fortify's single-guard limitation)
Route::get('/email/verify/{id}/{hash}', function ($id, $hash, \Illuminate\Http\Request $request) {
    // Try to find the user in either table
    $user = \App\Models\User::find($id) ?: \App\Models\Customer::find($id);

    if (! $user || ! hash_equals((string) $id, (string) $user->getKey()) ||
        ! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect()->route('login')->with('error', 'Invalid verification link.');
    }

    if ($user->hasVerifiedEmail()) {
        return redirect()->route('home')->with('success', 'Email already verified.');
    }

    if ($user->markEmailAsVerified()) {
        event(new \Illuminate\Auth\Events\Verified($user));
    }

    return redirect()->route('login')->with('success', 'Email verified successfully! Please log in.');
})->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

// Customer logout
Route::post('/customer/logout', function () {
    auth()->guard('customers')->logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect()->route('home');
})->name('customer.logout');
Route::get('/profile/show', [ProfileController::class , 'profile'])->name('profile')->middleware('auth:customers,web');
Route::get('/profile/change_password', [ProfileController::class , 'changepasswordPanel'])->name('profile.changePassword')->middleware('auth:customers,web');
Route::post('/password/change', [ProfileController::class , 'change_password'])->name('password.change')->middleware('auth:customers,web');
Route::post('/profile/update', [ProfileController::class , 'updateProfile'])->name('profile.change')->middleware('auth:customers,web');


// Cart management Route starts here
Route::get('/shop', [CartController::class , 'view_all'])->name('shop');
Route::get('/categories', [HomeController::class , 'category'])->name('categories');
Route::get('/cart', [CartController::class , 'showCart'])->name('cart');
Route::get('/contact', [HomeController::class , 'help_desk'])->name('contact');

Route::post('cart/add/{productId?}', [CartController::class , 'add'])->name('cart.add');
Route::get('/my-carts', [CartController::class , 'showCart'])->name('cart.show');
Route::delete('/cart/{productId}', [CartController::class , 'removeFromCart'])->name('cart.remove');
Route::put('/cart/{id}', [CartController::class , 'updateCart'])->name('cart.update');
Route::post('/cart/promo/apply', [CartController::class, 'applyPromo'])->name('cart.promo.apply');
Route::post('/cart/promo/remove', [CartController::class, 'removePromo'])->name('cart.promo.remove');
Route::post('/cart/clear', [CartController::class , 'clearCart'])->name('cart.clear');
Route::get('/checkout', [CartController::class , 'checkout'])->name('cart.checkout');
Route::post('/store/checkout', [CartController::class , 'store_checkout'])->name('store.checkout');
Route::post('/checkout/process', [CartController::class , 'store_checkout']); // Alias for compatibility
Route::get('/order/confirmation/{unique_id}', [CartController::class , 'order_confirmation'])->name('order.confirmation');
Route::get('/order/track', [CartController::class, 'track_order_lookup'])->name('order.track.lookup');
Route::post('/order/track', [CartController::class, 'track_order_submit'])->name('order.track.submit');
Route::get('/order/track/{unique_id}', [CartController::class, 'track_order'])->name('order.track');
Route::get('/account/order-tracking/{order_number}', [OrderTrackingController::class, 'show'])
    ->name('account.order-tracking')
    ->middleware('auth:customers,web');
Route::get('/order-product/{product}', [CartController::class , 'product_view'])->name('order-product');
Route::get('/product/all', [CartController::class , 'view_all'])->name('visit.product');
Route::post('/product/{productId}/reviews', [App\Http\Controllers\ReviewController::class, 'store'])->name('reviews.store');
Route::get('/order/history', [CartController::class , 'my_orders'])->name('orders.history')->middleware('auth:customers,web');
Route::post('/contact/message', [HomeController::class, 'submitContact'])->name('contact.submit');