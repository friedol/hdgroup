<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\management\UnitController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\management\StoreController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\management\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExpensesController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\ContainerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ParkingOrderController;
use App\Http\Controllers\CustomerOrderController;
use App\Http\Controllers\UpcomingOrderController;
use App\Http\Controllers\RegisterProductController;
use App\Http\Controllers\UpcomingProductController;
use App\Http\Controllers\management\MProductController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\HomeController;

use App\Http\Controllers\ReportController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BusinessIntelligenceController;
use App\Http\Controllers\SmartReorderController;
use App\Http\Controllers\FinancialAnalyticsController;
use App\Http\Controllers\ProductionEfficiencyController;
use App\Http\Controllers\StaffPerformanceController;
use App\Http\Controllers\CustomerIntelligenceController;
use App\Http\Controllers\Admin\CustomerDataCenterController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\ProductionOrderController;
use App\Http\Controllers\BomController;
use App\Http\Controllers\HumanResourceController;
use App\Http\Controllers\RequisitionController;
use App\Http\Controllers\HeroSlideController;
use App\Http\Controllers\PopupAdController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DeliveryPersonController;
use App\Http\Controllers\DeliveryTrackingController;
use App\Http\Controllers\GatekeeperController;
use App\Http\Controllers\BranchSmsConfigController;
use App\Http\Controllers\PromoCodeController;
use App\Http\Controllers\SalesTargetController;
use App\Http\Controllers\PaymentRequestController;



require __DIR__ . '/other.php';

Route::get('/index', [PageController::class, 'index'])->name('page.index');
Route::get('/contact', [HomeController::class, 'contact'])->name('contact');
Route::get('/about', [HomeController::class, 'about'])->name('about');
Route::get('/shop/products', [HomeController::class, 'all_products'])->name('shop.products');
Route::get('/shop/categories', [HomeController::class, 'categories_page'])->name('shop.categories');
Route::redirect('/admin/dashboard', '/dashboard');
Route::redirect('/admin', '/dashboard');
Route::redirect('/my-orders', '/order/history');
Route::get('/wishlist', function () {
    return redirect()->back()->with('error', 'Wishlist functionality is coming soon.');
});

Route::post('/authenticate', [PageController::class, 'authentication']);

Route::get('/reset-password', [PageController::class, 'reset_password']);

Route::post('/logout', [PageController::class, 'invalidate_users'])->name('logout');

Route::group(['middleware' => ['auth', \App\Http\Middleware\RedirectCustomersFromAdmin::class]], function () {
    // Route::get('/admin-dashboard', [DashboardController::class, 'admin_dashboard'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');

    // Requisitions (internal requests)
    Route::get('/requisitions', [RequisitionController::class, 'index'])->name('requisitions.index');
    Route::get('/requisitions/create', [RequisitionController::class, 'create'])->name('requisitions.create');
    Route::post('/requisitions', [RequisitionController::class, 'store'])->name('requisitions.store');
    Route::get('/requisitions/{requisition}', [RequisitionController::class, 'show'])->name('requisitions.show');

    // Route::get('/recommended', [PageController::class, 'recommended_product'])->middleware('auth');
    // Route::get('/recommended', [PageController::class, 'recommended_product'])->middleware('auth');
    Route::get('/sales_recommended', [PageController::class, 'sales_recommended'])->middleware(['auth', 'permission:dashboard.global']);
    Route::get('/order_recommended', [PageController::class, 'order_recommended'])->middleware(['auth', 'permission:dashboard.global']);
    Route::get('/order_recommended/{unique_id}/edit', [PageController::class, 'order_recommended_edit'])->name('order_recommended_edit')->middleware('permission:dashboard.global');
    Route::get('/order_recommended/{unique_id}/show', [PageController::class, 'order_recommended_show'])->name('order_recommended_show')->middleware('permission:dashboard.global');
    Route::put('/order_recommended/{unique_id}/update', [PageController::class, 'order_recommended_update'])->name('order_recommended_update')->middleware('permission:dashboard.global');

    Route::get('/switch-branch/{id}', function ($id) {
        $user = auth()->user();
        if (!$user->isGlobal()) {
            abort(403);
        }

        $id = (int) $id;
        if ($id > 0) {
            $branch = \App\Models\Branch::where('id', $id)->where('is_active', true)->first();
            if (!$branch) {
                return redirect()->route('dashboard')->with('error', 'Invalid or inactive branch.');
            }
            session(['active_branch_id' => $branch->id]);
        } else {
            session()->forget('active_branch_id');
        }

        // Redirect to dashboard without any stale ?branch= query string
        // so MultiTenantMiddleware respects the session-based active branch.
        return redirect()->route('dashboard');
    })->name('branch.switch');


    Route::get('/feedback', [FeedbackController::class, 'index'])->middleware(['auth', 'permission:dashboard.global']); // Feedback as report/admin
    Route::delete('/feedback/{id}', [FeedbackController::class, 'destroy'])->name('feedback.delete')->middleware('permission:dashboard.global');


    Route::get('/instock-products', [ProductController::class, 'instock_product'])->middleware('permission:inventory.view');
    Route::get('/outstock-product', [ProductController::class, 'outstock_product'])->middleware('permission:inventory.view');
    Route::get('/less-product', [ProductController::class, 'less_product'])->middleware('permission:inventory.view');
    Route::resource('/products', MProductController::class)->except(['create'])->middleware('permission:inventory.manage');
    Route::resource('/all-products', ProductController::class)->except(['show'])->middleware('permission:inventory.view');
    Route::get('/all-products/{id}/{year?}/{month?}', [ProductController::class, 'show'])->name('all-products.show')->middleware('permission:inventory.view');

    // New Inertia CRUD Routes for Products
    Route::get('/products-new', [ProductController::class, 'indexCrud'])->name('products.index')->middleware('permission:inventory.view');
    Route::get('/products-new/create', [ProductController::class, 'create'])->name('products.create')->middleware('permission:inventory.manage');
    Route::post('/products-new', [ProductController::class, 'storeCrud'])->name('products.store')->middleware('permission:inventory.manage');
    Route::get('/products-new/{id}', [ProductController::class, 'showCrud'])->name('products.show')->middleware('permission:inventory.view');
    Route::get('/products-new/{id}/edit', [ProductController::class, 'editCrud'])->name('products.edit')->middleware('permission:inventory.manage');
    Route::put('/products-new/{id}', [ProductController::class, 'updateCrud'])->name('products.update')->middleware('permission:inventory.manage');
    Route::post('/products-new/{id}/reactivate', [ProductController::class, 'reactivateCrud'])->name('products.reactivate')->middleware('permission:inventory.manage');
    Route::delete('/products-new/{id}', [ProductController::class, 'destroyCrud'])->name('products.destroy')->middleware('permission:inventory.manage');

    // New Inertia CRUD Routes for Customers
    Route::get('/customers', [CustomerController::class, 'indexCrud'])->name('customers.index')->middleware('permission:customers.view');
    Route::get('/customers/create', [CustomerController::class, 'createCrud'])->name('customers.create')->middleware('permission:customers.manage');
    Route::post('/customers', [CustomerController::class, 'storeCrud'])->name('customers.store')->middleware('permission:customers.manage');
    Route::get('/customers/{id}', [CustomerController::class, 'showCrud'])->name('customers.show')->middleware('permission:customers.view');
    Route::get('/customers/{id}/edit', [CustomerController::class, 'editCrud'])->name('customers.edit')->middleware('permission:customers.manage');
    Route::put('/customers/{id}', [CustomerController::class, 'updateCrud'])->name('customers.update')->middleware('permission:customers.manage');
    Route::delete('/customers/{id}', [CustomerController::class, 'destroyCrud'])->name('customers.destroy')->middleware('permission:customers.manage');

    // New Inertia CRUD Routes for Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index')->middleware('permission:inventory.view');
    Route::get('/suppliers/create', [SupplierController::class, 'create'])->name('suppliers.create')->middleware('permission:inventory.manage');
    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store')->middleware('permission:inventory.manage');
    Route::get('/suppliers/{supplier}/edit', [SupplierController::class, 'edit'])->name('suppliers.edit')->middleware('permission:inventory.manage');
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update')->middleware('permission:inventory.manage');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy')->middleware('permission:inventory.manage');
    Route::get('/suppliers/json', [SupplierController::class, 'json'])->name('suppliers.json')->middleware('permission:inventory.view');

    // ===== FINANCE MODULE - CRUD ROUTES =====
    // Loans CRUD (new Inertia interface)
    Route::get('/loans', [LoanController::class, 'indexCrud'])->name('loans.index.crud')->middleware('permission:finance.loans');
    Route::get('/loans/create', [LoanController::class, 'createCrud'])->name('loans.create.crud')->middleware('permission:finance.loans');
    Route::post('/loans', [LoanController::class, 'storeCrud'])->name('loans.store.crud')->middleware('permission:finance.loans');
    Route::get('/loans/{id}', [LoanController::class, 'showCrud'])->name('loans.show.crud')->middleware('permission:finance.loans');
    Route::get('/loans/{id}/edit', [LoanController::class, 'editCrud'])->name('loans.edit.crud')->middleware('permission:finance.loans');
    Route::put('/loans/{id}', [LoanController::class, 'updateCrud'])->name('loans.update.crud')->middleware('permission:finance.loans');
    Route::delete('/loans/{id}', [LoanController::class, 'destroyCrud'])->name('loans.destroy.crud')->middleware('permission:finance.loans');

    // Payments CRUD (new Inertia interface)
    Route::get('/payments', [PaymentController::class, 'indexCrud'])->name('payments.index')->middleware('permission:finance.loans');
    Route::get('/payments/create', [PaymentController::class, 'createCrud'])->name('payments.create')->middleware('permission:finance.loans');
    Route::post('/payments', [PaymentController::class, 'storeCrud'])->name('payments.store')->middleware('permission:finance.loans');
    Route::get('/payments/{id}', [PaymentController::class, 'showCrud'])->name('payments.show')->middleware('permission:finance.loans');
    Route::get('/payments/{id}/edit', [PaymentController::class, 'editCrud'])->name('payments.edit')->middleware('permission:finance.loans');
    Route::put('/payments/{id}', [PaymentController::class, 'updateCrud'])->name('payments.update')->middleware('permission:finance.loans');
    Route::delete('/payments/{id}', [PaymentController::class, 'destroyCrud'])->name('payments.destroy')->middleware('permission:finance.loans');

    // Expenses CRUD (new Inertia interface)
    Route::get('/expenses-crud', [ExpensesController::class, 'indexCrud'])->name('expenses.index.crud')->middleware('permission:finance.expenses');
    Route::get('/expenses-crud/create', [ExpensesController::class, 'createCrud'])->name('expenses.create.crud')->middleware('permission:finance.expenses');
    Route::post('/expenses-crud', [ExpensesController::class, 'storeCrud'])->name('expenses.store.crud')->middleware('permission:finance.expenses');
    Route::get('/expenses-crud/{id}', [ExpensesController::class, 'showCrud'])->name('expenses.show.crud')->middleware('permission:finance.expenses');
    Route::get('/expenses-crud/{id}/edit', [ExpensesController::class, 'editCrud'])->name('expenses.edit.crud')->middleware('permission:finance.expenses');
    Route::put('/expenses-crud/{id}', [ExpensesController::class, 'updateCrud'])->name('expenses.update.crud')->middleware('permission:finance.expenses');
    Route::delete('/expenses-crud/{id}', [ExpensesController::class, 'destroyCrud'])->name('expenses.destroy.crud')->middleware('permission:finance.expenses');

    // ===== OPERATIONS MODULE - CRUD ROUTES =====
    // Production Orders CRUD
    Route::get('/production-orders-new', [ProductionOrderController::class, 'indexCrud'])->name('production-orders.index')->middleware('permission:production.view');
    Route::get('/production-orders-new/create', [ProductionOrderController::class, 'createCrud'])->name('production-orders.create')->middleware('permission:production.manage_bom');
    Route::post('/production-orders-new', [ProductionOrderController::class, 'storeCrud'])->name('production-orders.store')->middleware('permission:production.manage_bom');
    Route::get('/production-orders-new/{id}', [ProductionOrderController::class, 'showCrud'])->name('production-orders.show')->middleware('permission:production.view');
    Route::get('/production-orders-new/{id}/edit', [ProductionOrderController::class, 'editCrud'])->name('production-orders.edit')->middleware('permission:production.manage_bom');
    Route::put('/production-orders-new/{id}', [ProductionOrderController::class, 'updateCrud'])->name('production-orders.update')->middleware('permission:production.manage_bom');
    Route::delete('/production-orders-new/{id}', [ProductionOrderController::class, 'destroyCrud'])->name('production-orders.destroy')->middleware('permission:production.manage_bom');
    Route::get('/raw-material-history', [ProductionOrderController::class, 'rawMaterialHistory'])->name('raw-material-history.index')->middleware('permission:production.view');

    // BOMs CRUD
    Route::get('/boms-crud', [BomController::class, 'indexCrud'])->name('boms.index.crud')->middleware('permission:production.manage_bom');
    Route::get('/boms-crud/create', [BomController::class, 'createCrud'])->name('boms.create.crud')->middleware('permission:production.manage_bom');
    Route::post('/boms-crud', [BomController::class, 'storeCrud'])->name('boms.store.crud')->middleware('permission:production.manage_bom');
    Route::get('/boms-crud/{id}', [BomController::class, 'showCrud'])->name('boms.show.crud')->middleware('permission:production.manage_bom');
    Route::get('/boms-crud/{id}/edit', [BomController::class, 'editCrud'])->name('boms.edit.crud')->middleware('permission:production.manage_bom');
    Route::put('/boms-crud/{id}', [BomController::class, 'updateCrud'])->name('boms.update.crud')->middleware('permission:production.manage_bom');
    Route::delete('/boms-crud/{id}', [BomController::class, 'destroyCrud'])->name('boms.destroy.crud')->middleware('permission:production.manage_bom');

    // Orders CRUD (Customer Orders)
    Route::get('/orders-crud', [CustomerOrderController::class, 'indexCrud'])->name('orders.index.crud')->middleware('permission:finance.loans');
    Route::get('/orders-crud/create', [CustomerOrderController::class, 'createCrud'])->name('orders.create.crud')->middleware('permission:finance.loans');
    Route::post('/orders-crud', [CustomerOrderController::class, 'storeCrud'])->name('orders.store.crud')->middleware('permission:finance.loans');
    Route::get('/orders-crud/{id}', [CustomerOrderController::class, 'showCrud'])->name('orders.show.crud')->middleware('permission:finance.loans');
    Route::get('/orders-crud/{id}/edit', [CustomerOrderController::class, 'editCrud'])->name('orders.edit.crud')->middleware('permission:finance.loans');
    Route::put('/orders-crud/{id}', [CustomerOrderController::class, 'updateCrud'])->name('orders.update.crud')->middleware('permission:finance.loans');
    Route::delete('/orders-crud/{id}', [CustomerOrderController::class, 'destroyCrud'])->name('orders.destroy.crud')->middleware('permission:finance.loans');

    // ===== INVENTORY MODULE - CRUD ROUTES =====
    // Categories CRUD
    Route::get('/categories-crud', [CategoryController::class, 'indexCrud'])->name('categories.index.crud')->middleware('permission:inventory.manage');
    Route::get('/categories-crud/create', [CategoryController::class, 'createCrud'])->name('categories.create.crud')->middleware('permission:inventory.manage');
    Route::post('/categories-crud', [CategoryController::class, 'storeCrud'])->name('categories.store.crud')->middleware('permission:inventory.manage');
    Route::get('/categories-crud/{id}', [CategoryController::class, 'showCrud'])->name('categories.show.crud')->middleware('permission:inventory.manage');
    Route::get('/categories-crud/{id}/edit', [CategoryController::class, 'editCrud'])->name('categories.edit.crud')->middleware('permission:inventory.manage');
    Route::put('/categories-crud/{id}', [CategoryController::class, 'updateCrud'])->name('categories.update.crud')->middleware('permission:inventory.manage');
    Route::delete('/categories-crud/{id}', [CategoryController::class, 'destroyCrud'])->name('categories.destroy.crud')->middleware('permission:inventory.manage');

    // ===== LOGISTICS MODULE - CRUD ROUTES =====
    // Containers CRUD
    Route::get('/containers-crud', [ContainerController::class, 'indexCrud'])->name('containers.index.crud')->middleware('permission:logistics.deliveries');
    Route::get('/containers-crud/create', [ContainerController::class, 'createCrud'])->name('containers.create.crud')->middleware('permission:logistics.deliveries');
    Route::post('/containers-crud', [ContainerController::class, 'storeCrud'])->name('containers.store.crud')->middleware('permission:logistics.deliveries');
    Route::get('/containers-crud/{id}', [ContainerController::class, 'showCrud'])->name('containers.show.crud')->middleware('permission:logistics.deliveries');
    Route::get('/containers-crud/{id}/edit', [ContainerController::class, 'editCrud'])->name('containers.edit.crud')->middleware('permission:logistics.deliveries');
    Route::put('/containers-crud/{id}', [ContainerController::class, 'updateCrud'])->name('containers.update.crud')->middleware('permission:logistics.deliveries');
    Route::delete('/containers-crud/{id}', [ContainerController::class, 'destroyCrud'])->name('containers.destroy.crud')->middleware('permission:logistics.deliveries');

    // ===== MANAGEMENT MODULE - CRUD ROUTES =====
    // Users CRUD
    Route::get('/users-crud', [UserController::class, 'indexCrud'])->name('users.index.crud')->middleware('permission:users.view');
    Route::get('/users-crud/create', [UserController::class, 'createCrud'])->name('users.create.crud')->middleware('permission:users.manage');
    Route::post('/users-crud', [UserController::class, 'storeCrud'])->name('users.store.crud')->middleware('permission:users.manage');
    Route::get('/users-crud/{id}', [UserController::class, 'showCrud'])->name('users.show.crud')->middleware('permission:users.view');
    Route::get('/users-crud/{id}/edit', [UserController::class, 'editCrud'])->name('users.edit.crud')->middleware('permission:users.manage');
    Route::put('/users-crud/{id}', [UserController::class, 'updateCrud'])->name('users.update.crud')->middleware('permission:users.manage');
    Route::delete('/users-crud/{id}', [UserController::class, 'destroyCrud'])->name('users.destroy.crud')->middleware('permission:users.manage');

    Route::resource('/productions', ProductionController::class)->middleware('permission:production.view');
    Route::resource('/boms', BomController::class)->middleware('permission:production.manage_bom');

    // Raw Materials - Temporary Workaround Routes
    Route::get('/raw-materials', [BomController::class, 'rawMaterialsIndex'])->name('raw-materials.index')->middleware('permission:production.manage_bom');
    Route::get('/raw-materials/create', [BomController::class, 'rawMaterialsCreate'])->name('raw-materials.create')->middleware('permission:production.manage_bom');
    Route::post('/raw-materials', [BomController::class, 'rawMaterialsStore'])->name('raw-materials.store')->middleware('permission:production.manage_bom');
    Route::get('/raw-materials/{id}', [BomController::class, 'rawMaterialsShow'])->name('raw-materials.show')->middleware('permission:production.manage_bom');
    Route::get('/raw-materials/{id}/edit', [BomController::class, 'rawMaterialsEdit'])->name('raw-materials.edit')->middleware('permission:production.manage_bom');
    Route::put('/raw-materials/{id}', [BomController::class, 'rawMaterialsUpdate'])->name('raw-materials.update')->middleware('permission:production.manage_bom');
    Route::delete('/raw-materials/{id}', [BomController::class, 'rawMaterialsDestroy'])->name('raw-materials.destroy')->middleware('permission:production.manage_bom');
    Route::post('/raw-materials/{id}/adjust', [BomController::class, 'rawMaterialsAdjustStock'])->name('raw-materials.adjust-stock')->middleware('permission:production.manage_bom');
    Route::get('/raw-materials/{id}/json', [BomController::class, 'rawMaterialsJson'])->name('raw-materials.json')->middleware('permission:production.manage_bom');
    Route::post('/boms/calculate-cost', [BomController::class, 'calculateCost'])->name('boms.calculate-cost');
    Route::put('/boms/{id}/activate', [BomController::class, 'activate'])->name('boms.activate');
    Route::put('/boms/{id}/deactivate', [BomController::class, 'deactivate'])->name('boms.deactivate');

    // Roll-Based Production Engine
    Route::get('/production/roll-based', [\App\Http\Controllers\RollProductionController::class, 'index'])->name('production.roll-based')->middleware('permission:production.view');
    Route::post('/production/roll-based/simulate', [\App\Http\Controllers\RollProductionController::class, 'simulate'])->name('production.roll-based.simulate')->middleware('permission:production.view');
    Route::post('/production/roll-based/split', [\App\Http\Controllers\RollProductionController::class, 'split'])->name('production.roll-based.split')->middleware('permission:production.manage_bom');
    Route::post('/production/roll-based/produce', [\App\Http\Controllers\RollProductionController::class, 'produce'])->name('production.roll-based.produce')->middleware('permission:production.view');

    // Production Benchmarks
    Route::get('/production/benchmarks', [\App\Http\Controllers\ProductionBenchmarkController::class, 'index'])->name('production.benchmarks.index')->middleware('permission:production.manage_bom');
    Route::post('/production/benchmarks', [\App\Http\Controllers\ProductionBenchmarkController::class, 'store'])->name('production.benchmarks.store')->middleware('permission:production.manage_bom');
    Route::put('/production/benchmarks/{id}', [\App\Http\Controllers\ProductionBenchmarkController::class, 'update'])->name('production.benchmarks.update')->middleware('permission:production.manage_bom');
    Route::delete('/production/benchmarks/{id}', [\App\Http\Controllers\ProductionBenchmarkController::class, 'destroy'])->name('production.benchmarks.destroy')->middleware('permission:production.manage_bom');
    Route::post('/production/benchmarks/{id}/toggle', [\App\Http\Controllers\ProductionBenchmarkController::class, 'toggle'])->name('production.benchmarks.toggle')->middleware('permission:production.manage_bom');

    // Production Orders (Consolidated to Records)
    Route::get('/production-orders', function () {
        return redirect()->route('productions.index');
    })->name('production.orders');
    Route::get('/production-orders/{id}', [ProductionOrderController::class, 'show'])->name('production-orders.details.view')->middleware('permission:production.view');
    Route::get('/production-orders/{id}/edit', [ProductionOrderController::class, 'edit'])->name('production-orders.edit.view')->middleware('permission:production.manage_bom');
    Route::put('/production-orders/{id}', [ProductionOrderController::class, 'update'])->name('production-orders.update.view')->middleware('permission:production.manage_bom');
    Route::delete('/production-orders/{id}', [ProductionOrderController::class, 'destroy'])->name('production-orders.destroy.view')->middleware('permission:production.manage_bom');
    Route::get('/production-orders/{id}/details', function ($id) {
        return redirect()->route('productions.index');
    })->name('production.orders.details');
    Route::post('/production-orders/{id}/status', [ProductionOrderController::class, 'updateStatus'])->name('production-orders.update-status')->middleware('permission:production.manage_bom');
    Route::get('/manufacturing/dashboard', [DashboardController::class, 'manufacturingDashboard'])->name('manufacturing.dashboard')->middleware('permission:production.view');

    Route::resource('/upcoming-orders', UpcomingOrderController::class)->middleware('permission:inventory.manage');
    Route::put('upcoming-orders/publish/{product_id}', [UpcomingOrderController::class, 'publish'])->name('publish.upcoming-orders')->middleware('permission:inventory.manage');

    Route::resource('/upcoming-products', UpcomingProductController::class)->except(['create'])->middleware('permission:inventory.manage');
    Route::post('upcoming-products', [UpcomingProductController::class, 'store'])->name('upcoming-products.store')->middleware('permission:inventory.manage');
    Route::put('upcoming-products/publish/{product_id}', [UpcomingProductController::class, 'publish'])->name('publish.upcoming-products')->middleware('permission:inventory.manage');

    Route::resource('/users', Usercontroller::class)->middleware('permission:users.view');
    Route::post('/users/{id}/pay', [UserController::class, 'storePayment'])->name('users.pay')->middleware('permission:users.view');
    Route::resource('/customers', CustomerController::class)->except(['show'])->middleware('permission:customers.view');
    Route::get('/customers/{phone}', [CustomerController::class, 'show'])->name('customers.show')->middleware('permission:customers.view');
    Route::resource('/all-stores', StoreController::class)->except(['create'])->middleware('permission:inventory.manage');
    Route::get('/all-stores/{identifier}/intelligence/{type}', [StoreController::class, 'intelligenceReport'])->name('all-stores.intelligence')->middleware('permission:inventory.manage');
    Route::resource('/categories', CategoryController::class)->except(['create'])->middleware('permission:inventory.manage');
    Route::resource('/units', UnitController::class)->except(['create'])->middleware('permission:inventory.manage');
    // Debug route to check permissions
    Route::get('/debug-permissions/{userId}', function ($userId) {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return "User not found";
        }

        $permissions = $user->permissions;
        $permissionIds = $user->permissions->pluck('id')->toArray();

        return [
            'user_id' => $user->id,
            'user_name' => $user->staff_name,
            'permissions_count' => $permissions->count(),
            'permission_ids' => $permissionIds,
            'permissions' => $permissions->toArray()
        ];
    });

    Route::get('/exported-products', [ExportController::class, 'index'])->name('exports.index')->middleware('permission:pos.access');

    // COMPLETELY BLOCK ALL EXPORTS REQUESTS
    Route::get('/exports/create', function () {
        abort(404, 'This page has been permanently removed and no longer exists.');
    });
    Route::any('/exports/create', function () {
        abort(404, 'This page has been permanently removed and no longer exists.');
    });
    Route::post('/exports_add_more', [ExportController::class, 'exports_add_more'])->name('exports_add_more')->middleware('permission:pos.access');
    Route::get('/export-statistics', [ExportController::class, 'fetchExportStatistics'])->name('export-statistics')->middleware('permission:pos.access');
    Route::get('/exports/check/{unique_id}', [ExportController::class, 'check'])->name('exports.check')->middleware('permission:pos.access');

    Route::put('/exported-products/editstatus/{unique_id}', [ExportController::class, 'edit_exports_status'])->name('exports_edit_exports_status')->middleware('permission:pos.access');
    Route::put('/exported-products/change_to_loan/{unique_id}', [ExportController::class, 'exports_change_to_loan'])->name('exports_change_to_loan')->middleware('permission:finance.loans');



    Route::resource('/loans', LoanController::class)->middleware('permission:finance.loans'); // Loans as orders/sales
    Route::post('/loans_add_more', [LoanController::class, 'loans_add_more'])->name('loans_add_more')->middleware('permission:finance.loans');
    Route::put('/loans/editstatus/{unique_id}', [LoanController::class, 'edit_loans_status'])->name('loans_edit_status')->middleware('permission:finance.loans');
    Route::resource('/loan-payments', PaymentController::class)->except(['create'])->middleware('permission:finance.loans');

    Route::get('/transfers/store-products/{id}', [TransferController::class, 'getStoreProducts'])->middleware('permission:inventory.transfer');
    Route::resource('/transfers', TransferController::class)->except(['create'])->middleware('permission:inventory.transfer');
    Route::resource('/containers', ContainerController::class)->middleware('permission:logistics.deliveries');
    Route::resource('/register-products', RegisterProductController::class)->middleware('permission:logistics.deliveries');
    Route::resource('/profile', ProfileController::class)->except(['create']); // Profile accessible to all auth
    Route::resource('/expenses', ExpensesController::class)->except(['create'])->middleware('permission:finance.expenses');
    Route::resource('/parking_orders', ParkingOrderController::class)->middleware('permission:logistics.deliveries');

    Route::resource('/orders', CustomerOrderController::class)->except(['create'])->middleware('permission:finance.loans');
    Route::get('/general-orders', [CustomerOrderController::class, 'general_orders'])->name('orders.all')->middleware('permission:finance.loans');
    Route::get('/online-orders', [CustomerOrderController::class, 'online_orders'])->name('orders.online')->middleware('permission:finance.loans');
    Route::get('/online-orders/{unique_id}', [CustomerOrderController::class, 'showOnlineOrder'])->name('orders.online.show')->middleware('permission:finance.loans');
    Route::delete('/online-orders/{unique_id}', [CustomerOrderController::class, 'destroyOnlineOrder'])->name('orders.online.destroy')->middleware('permission:finance.loans');
    Route::post('/online-orders/{unique_id}/approve', [CustomerOrderController::class, 'approveOrder'])->name('orders.online.approve')->middleware('permission:finance.loans');
    Route::post('/online-orders/{unique_id}/reject', [CustomerOrderController::class, 'rejectOrder'])->name('orders.online.reject')->middleware('permission:finance.loans');
    Route::post('/online-orders/{unique_id}/pay', [CustomerOrderController::class, 'markAsPaid'])->name('orders.online.pay')->middleware('permission:finance.loans');
    Route::post('/online-orders/{unique_id}/delivery-status', [CustomerOrderController::class, 'updateDeliveryStatus'])->name('orders.online.delivery-status')->middleware('permission:finance.loans');
    Route::post('/orders_add_more', [CustomerOrderController::class, 'orders_add_more'])->name('orders_add_more')->middleware('permission:finance.loans');
    Route::put('/orders/editstatus/{unique_id}', [CustomerOrderController::class, 'edit_orders_status'])->name('orders_edit_orders_status')->middleware('permission:finance.loans');


    Route::post('/parking_orders_more', [ParkingOrderController::class, 'addProducts'])->name('parking_orders.products')->middleware('permission:logistics.deliveries');
    Route::get('/parking_orders/item/{id}/edit', [ParkingOrderController::class, 'editItem'])->name('parking_orders.item.edit')->middleware('permission:logistics.deliveries');
    Route::put('/parking_orders/item/{id}/update', [ParkingOrderController::class, 'updateItem'])->name('parking_orders.item.update')->middleware('permission:logistics.deliveries');
    Route::delete('/parking_orders/item/{id}/remove', [ParkingOrderController::class, 'removeItem'])->name('parking_orders.item.delete')->middleware('permission:logistics.deliveries');
    Route::post('/parking_orders/{unique_id}/push', [ParkingOrderController::class, 'pushUpcoming'])->name('parking_orders.push')->middleware('permission:logistics.deliveries');

    // Delivery Management Routes
    Route::resource('/deliveries', DeliveryController::class)->middleware('permission:logistics.deliveries');
    Route::resource('/delivery-personnel', DeliveryPersonController::class)->middleware('permission:logistics.deliveries');

    // Delivery Status Update
    Route::put('/deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus'])->name('deliveries.update-status')->middleware('permission:logistics.deliveries');
    Route::put('/deliveries/{delivery}/assign-driver', [DeliveryController::class, 'assignDriver'])->name('deliveries.assign-driver')->middleware('permission:logistics.deliveries');
    Route::post('/deliveries/assign-order', [DeliveryController::class, 'assignOrder'])->name('deliveries.assign-order')->middleware('permission:logistics.deliveries');

    // Delivery Tracking Routes
    Route::get('/track/{deliveryNumber}', [DeliveryTrackingController::class, 'track'])->name('delivery.track'); // Public tracking
    Route::get('/driver-dashboard', [DeliveryTrackingController::class, 'driverDashboard'])->name('driver.dashboard')->middleware('auth');

    // Driver Actions
    Route::put('/deliveries/{delivery}/accept', [DeliveryTrackingController::class, 'acceptDelivery'])->name('delivery.accept')->middleware('auth');
    Route::put('/deliveries/{delivery}/pickup', [DeliveryTrackingController::class, 'pickupDelivery'])->name('delivery.pickup')->middleware('auth');
    Route::put('/deliveries/{delivery}/in-transit', [DeliveryTrackingController::class, 'inTransit'])->name('delivery.in-transit')->middleware('auth');

    // Gatekeeper Routes
    Route::get('/gatekeeper', [GatekeeperController::class, 'index'])->name('gatekeeper.index')->middleware('permission:gatekeeper.access');
    Route::get('/gatekeeper/record-in', [GatekeeperController::class, 'recordInForm'])->name('gatekeeper.record-in-form')->middleware('permission:gatekeeper.record-in');
    Route::post('/gatekeeper/record-in', [GatekeeperController::class, 'storeRecordIn'])->name('gatekeeper.record-in')->middleware('permission:gatekeeper.record-in');
    Route::get('/gatekeeper/record-out', [GatekeeperController::class, 'recordOutForm'])->name('gatekeeper.record-out-form')->middleware('permission:gatekeeper.record-out');
    Route::post('/gatekeeper/record-out', [GatekeeperController::class, 'storeRecordOut'])->name('gatekeeper.record-out')->middleware('permission:gatekeeper.record-out');
    Route::get('/gatekeeper/{gatekeeperLog}', [GatekeeperController::class, 'show'])->name('gatekeeper.show')->middleware('permission:gatekeeper.access');
    Route::get('/gatekeeper/{gatekeeperLog}/edit', [GatekeeperController::class, 'edit'])->name('gatekeeper.edit')->middleware('permission:gatekeeper.edit');
    Route::put('/gatekeeper/{gatekeeperLog}', [GatekeeperController::class, 'update'])->name('gatekeeper.update')->middleware('permission:gatekeeper.edit');
    Route::delete('/gatekeeper/{gatekeeperLog}', [GatekeeperController::class, 'destroy'])->name('gatekeeper.destroy')->middleware('permission:gatekeeper.delete');
    Route::get('/gatekeeper/print', [GatekeeperController::class, 'printLogs'])->name('gatekeeper.print')->middleware('permission:gatekeeper.access');
    Route::get('/gatekeeper/export/pdf', [GatekeeperController::class, 'exportPDF'])->name('gatekeeper.export-pdf')->middleware('permission:gatekeeper.access');
    Route::get('/gatekeeper/stats', [GatekeeperController::class, 'getStats'])->name('gatekeeper.stats')->middleware('permission:gatekeeper.access');
    Route::put('/deliveries/{delivery}/complete', [DeliveryTrackingController::class, 'completeDelivery'])->name('delivery.complete')->middleware('auth');
    Route::put('/deliveries/{delivery}/fail', [DeliveryTrackingController::class, 'failDelivery'])->name('delivery.fail')->middleware('auth');

    // Customer Rating
    Route::put('/deliveries/{delivery}/rate', [DeliveryTrackingController::class, 'rateDelivery'])->name('delivery.rate')->middleware('auth');

    // API Endpoint for real-time tracking
    Route::get('/api/delivery/{deliveryNumber}', [DeliveryTrackingController::class, 'getDeliveryData'])->name('api.delivery.data');


    Route::get('/exports_reports', [ExportController::class, 'reports'])->name('exports.reports')->middleware('permission:finance.reports');
    // Route::get('/transfers_reports', [TransferController::class, 'reports'])->name('transfers.reports');
    Route::get('/expenses_reports', [ExpensesController::class, 'reports'])->name('expenses_reports')->middleware('permission:finance.reports');
    Route::get('/loans_reports', [LoanController::class, 'reports'])->name('loans_reports')->middleware('permission:finance.reports');
    Route::get('/inventory-report', [InventoryController::class, 'reports'])->name('inventory.view')->middleware('permission:inventory.view');
    Route::get('/logs', [SecurityController::class, 'system_logs'])->middleware('permission:settings.logs');

    Route::post('/product-toggle-status', [ProductController::class, 'toggleStatus'])->name('product-toggle.status')->middleware('permission:inventory.manage');
    Route::post('/product-toggle-visibility', [ProductController::class, 'toggleVisibility'])->name('product-toggle.visibility')->middleware('permission:inventory.manage');
    Route::post('/cart-toggle-status', [CustomerOrderController::class, 'toggleStatus'])->name('cart-toggle.status')->middleware('permission:finance.loans');

    // ajax
    Route::get('get-products-store/{storeName}', [StoreController::class, 'getProductList']);


    //System Report Routes
    Route::get('/report_inventory', [ReportController::class, 'inventory_index'])->name('report.inventory')->middleware('permission:inventory.view');
    Route::get('/report_inventory/Filter', [ReportController::class, 'Filter_inventory_by_Date'])->name('report.inventory.filter')->middleware('permission:inventory.view');
    Route::get('/report_profit', [ReportController::class, 'profit_index'])->name('report.profit')->middleware('permission:finance.reports');
    Route::get('/report_profit/print', [ReportController::class, 'profit_print'])->name('report.profit.print')->middleware('permission:finance.reports');
    Route::get('/report_loan', [ReportController::class, 'loans_index'])->name('report.loans')->middleware('permission:finance.loans');
    Route::get('/report_sales', [ReportController::class, 'sales_index'])->name('report.sales')->middleware('permission:finance.reports');
    Route::get('/report_sales/single_product/{id}', [ReportController::class, 'product_sales'])->name('report.sales.single_product')->middleware('permission:finance.reports');
    Route::get('/report_expenses', [ReportController::class, 'expenses_index'])->name('report.expenses')->middleware('permission:finance.expenses');
    Route::get('/report_general', [ReportController::class, 'general_index'])->name('report.general')->middleware('permission:finance.reports');
    Route::get('/balance_sheet', [ReportController::class, 'balance_sheet'])->name('report.balance_sheet')->middleware('permission:finance.reports');

    // System Settings
    Route::get('/settings', [SystemSettingController::class, 'index'])->name('settings.index')->middleware('permission:settings.access');
    Route::post('/settings/update', [SystemSettingController::class, 'update'])->name('settings.update')->middleware('permission:settings.access');
    Route::post('/settings/test-email', [SystemSettingController::class, 'testEmail'])->name('settings.test-email')->middleware('permission:settings.access');

    // Sales Targets
    Route::get('/sales-targets', [SalesTargetController::class, 'index'])->name('sales-targets.index')->middleware('permission:finance.reports');
    Route::post('/sales-targets', [SalesTargetController::class, 'store'])->name('sales-targets.store')->middleware('permission:finance.reports');
    Route::delete('/sales-targets/{salesTarget}', [SalesTargetController::class, 'destroy'])->name('sales-targets.destroy')->middleware('permission:finance.reports');

    // Payment Requests
    Route::get('/payment-requests', [PaymentRequestController::class, 'index'])->name('payment-requests.index')->middleware('permission:finance.reports');
    Route::post('/payment-requests', [PaymentRequestController::class, 'store'])->name('payment-requests.store')->middleware('permission:finance.reports');
    Route::patch('/payment-requests/{paymentRequest}/sent', [PaymentRequestController::class, 'markSent'])->name('payment-requests.sent')->middleware('permission:finance.reports');
    Route::patch('/payment-requests/{paymentRequest}/paid', [PaymentRequestController::class, 'markPaid'])->name('payment-requests.paid')->middleware('permission:finance.reports');
    Route::patch('/payment-requests/{paymentRequest}/cancel', [PaymentRequestController::class, 'cancel'])->name('payment-requests.cancel')->middleware('permission:finance.reports');
    Route::delete('/payment-requests/{paymentRequest}', [PaymentRequestController::class, 'destroy'])->name('payment-requests.destroy')->middleware('permission:finance.reports');

    // Promo Codes Management
    Route::get('/promo-codes', [PromoCodeController::class, 'index'])->name('promo-codes.index')->middleware('permission:settings.access');
    Route::post('/promo-codes', [PromoCodeController::class, 'store'])->name('promo-codes.store')->middleware('permission:settings.access');
    Route::put('/promo-codes/{promoCode}', [PromoCodeController::class, 'update'])->name('promo-codes.update')->middleware('permission:settings.access');
    Route::delete('/promo-codes/{promoCode}', [PromoCodeController::class, 'destroy'])->name('promo-codes.destroy')->middleware('permission:settings.access');

    // Branch SMS Configuration
    Route::get('/settings/sms-config/{branchId}', [BranchSmsConfigController::class, 'show'])->middleware('permission:settings.access');
    Route::post('/settings/sms-config/{branchId}', [BranchSmsConfigController::class, 'store'])->middleware('permission:settings.access');
    Route::post('/settings/sms-config/{branchId}/test', [BranchSmsConfigController::class, 'test'])->middleware('permission:settings.access');

    Route::get('/pos', [PosController::class, 'terminal'])->name('pos.terminal')->middleware('permission:pos.access');
    Route::post('/pos/store', [PosController::class, 'store'])->name('pos.store')->middleware('permission:pos.access');
    Route::get('/pos/search', [PosController::class, 'searchProducts'])->name('pos.search')->middleware('permission:pos.access');
    Route::get('/pos/search-customers', [PosController::class, 'searchCustomers'])->name('pos.search-customers')->middleware('permission:pos.access');
    Route::post('/pos/quick-customer', [PosController::class, 'quickCustomerStore'])->name('pos.quick-customer')->middleware('permission:pos.access');
    Route::get('/pos/find/{identifier}', [PosController::class, 'findProduct'])->name('pos.find')->middleware('permission:pos.access');
    Route::get('/pos/print/{invoice}', [PosController::class, 'printReceipt'])->name('pos.print')->middleware('permission:pos.access');
    Route::post('/pos/return', [PosController::class, 'processReturn'])->name('pos.return')->middleware('permission:pos.returns');
    Route::get('/sales-history', [PosController::class, 'history'])->name('pos.history')->middleware('permission:pos.access');
    Route::get('/pos/sale/{invoice}', [PosController::class, 'show'])->name('pos.show')->middleware('permission:pos.access');
    Route::post('/pos/sale/payment', [PosController::class, 'storePayment'])->name('pos.payment.store')->middleware('permission:finance.loans');
    Route::delete('/pos/sale/{id}', [PosController::class, 'destroy'])->name('pos.destroy')->middleware('permission:users.manage');
    Route::get('/returns', [PosController::class, 'returns'])->name('pos.returns')->middleware('permission:pos.returns');

    Route::resource('/stock-adjustments', \App\Http\Controllers\StockAdjustmentController::class)->only(['store', 'index', 'destroy'])->middleware('permission:inventory.adjust');
    Route::post('/stock-adjustments/{id}/approve', [\App\Http\Controllers\StockAdjustmentController::class, 'approve'])->name('stock-adjustments.approve')->middleware('permission:inventory.adjust');
    Route::post('/stock-adjustments/{id}/reject', [\App\Http\Controllers\StockAdjustmentController::class, 'reject'])->name('stock-adjustments.reject')->middleware('permission:inventory.adjust');

    Route::resource('/branches', BranchController::class)->except(['show', 'destroy']);

    // Roles & Permissions (Administration)
    Route::get('/roles-permissions', [\App\Http\Controllers\RolePermissionController::class, 'index'])->name('roles-permissions.index')->middleware('permission:settings.access');
    Route::get('/roles-permissions/roles/create', [\App\Http\Controllers\RolePermissionController::class, 'roleCreate'])->name('roles-permissions.role.create')->middleware('permission:settings.access');
    Route::post('/roles-permissions/roles', [\App\Http\Controllers\RolePermissionController::class, 'roleStore'])->name('roles-permissions.role.store')->middleware('permission:settings.access');
    Route::get('/roles-permissions/roles/{role}/edit', [\App\Http\Controllers\RolePermissionController::class, 'roleEdit'])->name('roles-permissions.role.edit')->middleware('permission:settings.access');
    Route::put('/roles-permissions/roles/{role}', [\App\Http\Controllers\RolePermissionController::class, 'roleUpdate'])->name('roles-permissions.role.update')->middleware('permission:settings.access');
    Route::delete('/roles-permissions/roles/{role}', [\App\Http\Controllers\RolePermissionController::class, 'roleDestroy'])->name('roles-permissions.role.destroy')->middleware('permission:settings.access');
    Route::get('/roles-permissions/permissions/create', [\App\Http\Controllers\RolePermissionController::class, 'permissionCreate'])->name('roles-permissions.permission.create')->middleware('permission:settings.access');
    Route::post('/roles-permissions/permissions', [\App\Http\Controllers\RolePermissionController::class, 'permissionStore'])->name('roles-permissions.permission.store')->middleware('permission:settings.access');
    Route::get('/roles-permissions/permissions/{permission}/edit', [\App\Http\Controllers\RolePermissionController::class, 'permissionEdit'])->name('roles-permissions.permission.edit')->middleware('permission:settings.access');
    Route::put('/roles-permissions/permissions/{permission}', [\App\Http\Controllers\RolePermissionController::class, 'permissionUpdate'])->name('roles-permissions.permission.update')->middleware('permission:settings.access');
    Route::delete('/roles-permissions/permissions/{permission}', [\App\Http\Controllers\RolePermissionController::class, 'permissionDestroy'])->name('roles-permissions.permission.destroy')->middleware('permission:settings.access');

    // Business Intelligence Routes
    Route::get('/analytics', [BusinessIntelligenceController::class, 'dashboard'])->name('analytics.dashboard')->middleware('permission:dashboard.global');
    Route::get('/analytics/sales-forecast', [BusinessIntelligenceController::class, 'getSalesForecast'])->middleware('permission:dashboard.global');
    Route::get('/analytics/production-costs', [BusinessIntelligenceController::class, 'getProductionCostAnalysis'])->middleware('permission:dashboard.global');
    Route::get('/analytics/branch-ranking', [BusinessIntelligenceController::class, 'getBranchPerformanceRanking'])->middleware('permission:dashboard.global');
    Route::get('/analytics/top-margin-products', [BusinessIntelligenceController::class, 'getTopMarginProducts'])->middleware('permission:dashboard.global');
    Route::get('/analytics/low-margin-products', [BusinessIntelligenceController::class, 'getLowMarginProducts'])->middleware('permission:dashboard.global');
    Route::get('/analytics/dead-stock', [BusinessIntelligenceController::class, 'getDeadStockDetection'])->middleware('permission:dashboard.global');
    Route::get('/analytics/overproduction', [BusinessIntelligenceController::class, 'getOverproductionDetection'])->middleware('permission:dashboard.global');
    Route::get('/analytics/seasonal-demand', [BusinessIntelligenceController::class, 'getSeasonalDemandPrediction'])->middleware('permission:dashboard.global');
    Route::get('/analytics/ai-summary', [BusinessIntelligenceController::class, 'getAISummary'])->middleware('permission:dashboard.global');

    // Smart Reorder Routes
    Route::get('/smart-reorder', [SmartReorderController::class, 'dashboard'])->name('smart-reorder.dashboard')->middleware('permission:inventory.manage');
    Route::get('/smart-reorder/suggestions', [SmartReorderController::class, 'getReorderSuggestions'])->middleware('permission:inventory.manage');
    Route::get('/smart-reorder/material-predictions', [SmartReorderController::class, 'getMaterialDepletionPredictions'])->middleware('permission:inventory.manage');
    Route::get('/smart-reorder/critical-alerts', [SmartReorderController::class, 'getCriticalShortageAlerts'])->middleware('permission:inventory.manage');
    Route::get('/smart-reorder/finished-goods', [SmartReorderController::class, 'getFinishedGoodsDepletion'])->middleware('permission:inventory.manage');
    Route::put('/smart-reorder/settings/{productId}', [SmartReorderController::class, 'updateReorderSettings'])->middleware('permission:inventory.manage');
    Route::get('/smart-reorder/purchase-orders', [SmartReorderController::class, 'generatePurchaseOrders'])->middleware('permission:inventory.manage');

    // Financial Analytics Routes
    // Finance hub (uses views in resources/views/admin/finance)
    Route::prefix('finance')->name('admin.finance.')->middleware('permission:finance.reports')->group(function () {
        Route::get('/', [FinancialAnalyticsController::class, 'dashboard'])->name('dashboard');
        Route::get('/cash-flow', [FinancialAnalyticsController::class, 'cashFlowLedger'])->name('cash-flow');
        Route::get('/cash-flow/print', [FinancialAnalyticsController::class, 'cashFlowLedger'])->name('cash-flow.print');
        Route::get('/daily-report', [FinancialAnalyticsController::class, 'dailyReport'])->name('daily-report');
        Route::get('/daily-report/pdf', [FinancialAnalyticsController::class, 'dailyReportPrint'])->name('daily-report.pdf');
        Route::get('/daily-report/download', [FinancialAnalyticsController::class, 'dailyReportDownloadPDF'])->name('daily-report.download');
        Route::get('/daily-report/print-pdf', [FinancialAnalyticsController::class, 'dailyReportPrintPDF'])->name('daily-report.print-pdf');
        Route::get('/balance-sheet', [FinancialAnalyticsController::class, 'balanceSheet'])->name('balance-sheet');
        Route::get('/balance-sheet/pdf', [FinancialAnalyticsController::class, 'balanceSheetPdf'])->name('balance-sheet.pdf');
        Route::get('/reports', [FinancialAnalyticsController::class, 'reports'])->name('reports');
        Route::get('/invoices/{invoice}/receipt', [PosController::class, 'printReceipt'])->name('invoices.receipt');
        Route::get('/expenses/{expense}/voucher', [ExpensesController::class, 'voucher'])->name('expenses.voucher');
    });

    // Production Efficiency Routes
    Route::get('/production-efficiency', [ProductionEfficiencyController::class, 'dashboard'])->name('production-efficiency.dashboard')->middleware('permission:production.view');
    Route::get('/production-efficiency/metrics', [ProductionEfficiencyController::class, 'getEfficiencyMetrics'])->middleware('permission:production.view');
    Route::get('/production-efficiency/branch-comparison', [ProductionEfficiencyController::class, 'getBranchEfficiencyComparison'])->middleware('permission:production.view');
    Route::get('/production-efficiency/trends', [ProductionEfficiencyController::class, 'getEfficiencyTrends'])->middleware('permission:production.view');
    Route::get('/production-efficiency/waste-analysis', [ProductionEfficiencyController::class, 'getMaterialWasteAnalysis'])->middleware('permission:production.view');
    Route::get('/production-efficiency/labor-costs', [ProductionEfficiencyController::class, 'getLaborCostAnalysis'])->middleware('permission:production.view');
    Route::get('/production-efficiency/downtime', [ProductionEfficiencyController::class, 'getDowntimeAnalysis'])->middleware('permission:production.view');
    Route::get('/production-efficiency/cost-variance', [ProductionEfficiencyController::class, 'getCostVarianceAnalysis'])->middleware('permission:production.view');
    Route::post('/production-efficiency/metrics', [ProductionEfficiencyController::class, 'storeProductionMetrics'])->middleware('permission:production.manage');
    Route::get('/production-efficiency/summary', [ProductionEfficiencyController::class, 'getEfficiencySummary'])->middleware('permission:production.view');

    // Staff Performance Routes
    // Human Resources & Staff Performance
    Route::get('/hr/payroll', [HumanResourceController::class, 'payrollDashboard'])->name('hr.payroll')->middleware('permission:users.view');
    Route::get('/hr/payroll/summary', [HumanResourceController::class, 'getPayrollSummary'])->middleware('permission:users.view');
    Route::get('/hr/payroll/list', [HumanResourceController::class, 'getStaffList'])->middleware('permission:users.view');
    Route::post('/hr/payroll/process', [HumanResourceController::class, 'processPayout'])->name('hr.payroll.process')->middleware('permission:users.view');
    Route::post('/hr/staff/{id}/update-salary', [HumanResourceController::class, 'updateSalary'])->name('hr.staff.update-salary')->middleware('permission:users.view');

    Route::get('/staff-performance', [StaffPerformanceController::class, 'dashboard'])->name('staff-performance.dashboard')->middleware('permission:users.view');
    Route::get('/staff-performance/sellers', [StaffPerformanceController::class, 'getSellerPerformance'])->middleware('permission:staff.view');
    Route::get('/staff-performance/managers', [StaffPerformanceController::class, 'getBranchManagerPerformance'])->middleware('permission:staff.view');
    Route::get('/staff-performance/delivery', [StaffPerformanceController::class, 'getDeliveryPerformance'])->middleware('permission:staff.view');
    Route::get('/staff-performance/storekeepers', [StaffPerformanceController::class, 'getStorekeeperPerformance'])->middleware('permission:staff.view');
    Route::get('/staff-performance/trends', [StaffPerformanceController::class, 'getPerformanceTrends'])->middleware('permission:staff.view');
    Route::get('/staff-performance/summary', [StaffPerformanceController::class, 'getPerformanceSummary'])->middleware('permission:staff.view');

    // Customer Intelligence Routes (legacy analytics)
    Route::get('/customer-intelligence', [CustomerIntelligenceController::class, 'dashboard'])->name('customer-intelligence.dashboard')->middleware('permission:customers.view');
    Route::get('/customer-intelligence/segments', [CustomerIntelligenceController::class, 'getCustomerSegments'])->middleware('permission:customers.view');
    Route::get('/customer-intelligence/clv', [CustomerIntelligenceController::class, 'getCustomerLifetimeValueAnalysis'])->middleware('permission:customers.view');
    Route::get('/customer-intelligence/frequency', [CustomerIntelligenceController::class, 'getPurchaseFrequencyAnalysis'])->middleware('permission:customers.view');
    Route::get('/customer-intelligence/retention-risk', [CustomerIntelligenceController::class, 'getRetentionRiskAnalysis'])->middleware('permission:customers.view');
    Route::get('/customer-intelligence/vip', [CustomerIntelligenceController::class, 'getVIPCustomers'])->middleware('permission:customers.view');
    Route::get('/customer-intelligence/discounts', [CustomerIntelligenceController::class, 'getDiscountBehaviorAnalysis'])->middleware('permission:customers.view');
    Route::get('/customer-intelligence/credit-risk', [CustomerIntelligenceController::class, 'getCreditRiskAnalysis'])->middleware('permission:customers.view');
    Route::get('/customer-intelligence/summary', [CustomerIntelligenceController::class, 'getCustomerIntelligenceSummary'])->middleware('permission:customers.view');

    // Customer Data Center (Predictive follow-up)
    Route::prefix('customer-data-center')->name('admin.customer-data-center.')->middleware('permission:customers.view')->group(function () {
        Route::get('/', [CustomerDataCenterController::class, 'index'])->name('index');
        Route::post('/refresh-all', [CustomerDataCenterController::class, 'syncAll'])->name('sync-all');
        Route::get('/{customer}', [CustomerDataCenterController::class, 'show'])->name('show');
        Route::post('/{customer}/refresh', [CustomerDataCenterController::class, 'refresh'])->name('refresh');
        Route::post('/{customer}/follow-up', [CustomerDataCenterController::class, 'storeFollowUp'])->name('follow-up.store');
        Route::put('/{customer}/follow-up-date', [CustomerDataCenterController::class, 'updateFollowUpDate'])->name('follow-up-date.update');
    });

    // Hero Slides (per-branch)
    Route::prefix('settings/hero-slides')->name('admin.hero-slides.')->middleware('permission:settings.access')->group(function () {
        Route::get('/', [HeroSlideController::class, 'index'])->name('index');
        Route::get('/create', [HeroSlideController::class, 'create'])->name('create');
        Route::post('/', [HeroSlideController::class, 'store'])->name('store');
        Route::post('/sort-order', [HeroSlideController::class, 'updateSortOrder'])->name('update-sort-order');
        Route::get('/{heroSlide}', [HeroSlideController::class, 'show'])->name('show');
        Route::get('/{heroSlide}/edit', [HeroSlideController::class, 'edit'])->name('edit');
        Route::put('/{heroSlide}', [HeroSlideController::class, 'update'])->name('update');
        Route::delete('/{heroSlide}', [HeroSlideController::class, 'destroy'])->name('destroy');
    });

    // Popup Ads (per-branch)
    Route::prefix('settings/popup-ads')->name('admin.popup-ads.')->middleware('permission:settings.access')->group(function () {
        Route::get('/', [PopupAdController::class, 'index'])->name('index');
        Route::get('/create', [PopupAdController::class, 'create'])->name('create');
        Route::post('/', [PopupAdController::class, 'store'])->name('store');
        Route::post('/sort-order', [PopupAdController::class, 'updateSortOrder'])->name('update-sort-order');
        Route::get('/{ad}', [PopupAdController::class, 'show'])->name('show');
        Route::get('/{ad}/edit', [PopupAdController::class, 'edit'])->name('edit');
        Route::put('/{ad}', [PopupAdController::class, 'update'])->name('update');
        Route::delete('/{ad}', [PopupAdController::class, 'destroy'])->name('destroy');
    });
});

require __DIR__ . '/notification.php';
Route::redirect('/account', '/order/history');
