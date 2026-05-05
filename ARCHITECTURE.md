# HD GROUP - ARCHITECTURAL OVERVIEW

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER / REACT                         │
│                    (Inertia.js Components)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Routes (routes/web.php)
                    300+ endpoints
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    HTTP MIDDLEWARE STACK                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Authentication      (Laravel Auth)                           │
│ 2. Multi-Tenancy      (Branch Scoping)                          │
│ 3. Permissions        (RBAC Checks)                             │
│ 4. CORS & Security    (Headers)                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   44+ CONTROLLERS                               │
├──────────────────────┬──────────────────────────────────────────┤
│ ProductController    │ Inventory, product lifecycle            │
│ PosController        │ Checkout, payments, returns             │
│ InventoryController  │ Stock reporting                         │
│ ProductionController │ Manufacturing records                   │
│ LoanController       │ Credit tracking                         │
│ FinanceAnalytics     │ Financial dashboards                    │
│ BusinessIntelligence │ Advanced analytics                      │
│ And 37+ more...      │ (See DEVELOPER_REFERENCE.md)           │
└──────────────────┬───┴────────────────────────────────────────┬─┘
                   │                                              │
     ┌─────────────▼──────┐                    ┌──────────────────▼─┐
     │  SERVICE LAYER     │                    │   TRAITS/MIXINS   │
     ├────────────────────┤                    ├────────────────────┤
     │ InventoryService   │                    │ HasBranch          │
     │ - addStock()       │                    │ - Auto branch_id   │
     │ - removeStock()    │                    │ - Global scope     │
     │ - transferStock()  │                    │ - Branch filtering │
     │ - getLowStock()    │                    │                    │
     │ - getValuation()   │                    │ FileUploadTrait    │
     │                    │                    │ - upload()         │
     │ RollProduction     │                    │ - delete()         │
     │ - simulate()       │                    │ - getUrl()         │
     │ - calculate       │                    │                    │
     │ - produce()        │                    │ Plus helpers...    │
     │                    │                    │ - active_branch() │
     │ Plus helpers:      │                    │ - format_date()   │
     │ - format_currency()│                    │ - get_options()   │
     │ - active_branch()  │                    │                    │
     │ - get_permissions()│                    │ [Used by 20+ models]
     │                    │                    │                    │
     └────────┬───────────┘                    └────────────┬───────┘
              │                                              │
              └──────────────┬───────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   MODELS (40+)   │
                    ├──────────────────┤
                    │ Product          │
                    │ Inventory        │
                    │ Sale             │
                    │ Order            │
                    │ Production       │
                    │ Container        │
                    │ Loan             │
                    │ Payment          │
                    │ [And 32 more]    │
                    │ [All use traits] │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────────────┐
                    │   ELOQUENT ORM QUERIES   │
                    │                          │
                    │ WITH GLOBAL SCOPE:       │
                    │ Automatic branch_id      │
                    │ filtering in all         │
                    │ queries                  │
                    └────────┬─────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DATABASE (MySQL)                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  BRANCHES   │    │   PRODUCTS   │    │  INVENTORIES     │   │
│  ├─────────────┤    ├──────────────┤    ├──────────────────┤   │
│  │ id (PK)     │    │ id (PK)      │    │ id (PK)          │   │
│  │ name        │◄───┤ branch_id(FK)├───►│ product_id (FK)  │   │
│  │ location    │    │ name         │    │ store_id (FK)    │   │
│  └─────────────┘    │ price        │    │ branch_id (FK)   │   │
│                     │ branch_id(FK)│    │ qty              │   │
│  ┌─────────────┐    └──────────────┘    │ reorder_level    │   │
│  │    USERS    │                         └──────────────────┘   │
│  ├─────────────┤    ┌──────────────┐    ┌──────────────────┐   │
│  │ id (PK)     │    │   SALES      │    │  PRODUCTIONS     │   │
│  │ branch_id(FK)◄───┤ id (PK)      │    │ id (PK)          │   │
│  │ role_id(FK) │    │ branch_id(FK)│    │ product_id (FK)  │   │
│  │ name        │    │ total_amount │    │ qty_produced     │   │
│  │ is_global   │    │ user_id (FK) │    │ cost             │   │
│  └─────────────┘    │ branch_id(FK)│    │ branch_id (FK)   │   │
│                     └──────────────┘    └──────────────────┘   │
│                                                                   │
│  [TOTAL: 40+ tables, ALL with branch_id foreign key]            │
│                                                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: POS Checkout

```
1. USER OPENS /system/pos
   └─► PosController::terminal()
       └─► Returns inertia('Pos/Terminal', data)
           with store list, payment methods

2. USER SEARCHES PRODUCT
   └─► GET /system/pos/search?q=widget
       └─► PosController::searchProducts()
           └─► Query runs:
               Product::where('name', 'LIKE', '%widget%')
               └─► [HasBranch filters automatically!]
               └─► Returns 24 matching products
               └─► Returns JSON response

3. USER ADDS TO CART
   └─► InventoryService checks stock
       └─► $inventoryService->getTotalInventoryQuantity($productId)
           └─► Returns: qty = 50
       └─► Frontend enables checkout

4. USER PROCESSES PAYMENT
   └─► POST /system/pos/store
       └─► PosController::store()
           └─► DB::beginTransaction()
               ├─► Create Sale record (branch_id auto-set)
               ├─► Create SaleItem records
               ├─► $inventoryService->removeStock($productId, $storeId, $qty)
               │   └─► Decrement inventory
               │   └─► Create InventoryLog
               │   └─► Create InventoryTransaction
               ├─► Create Payment record
               └─► DB::commit()
               
5. RECEIPT GENERATED
   └─► GET /system/pos/print/{invoice}
       └─► PosController::printReceipt()
           └─► Returns formatted receipt view

6. DATABASE STATE
   ┌──────────────────────────────────────────────┐
   │ sales table:                                 │
   │ [+1 record with branch_id=1, status=PAID]  │
   │                                              │
   │ sale_items table:                           │
   │ [+1 record for product, qty, price]        │
   │                                              │
   │ inventories table:                          │
   │ [product qty: 50→49]                        │
   │                                              │
   │ inventory_logs table:                       │
   │ [+1 log: qty_change=-1, type=sale]         │
   │                                              │
   │ inventory_transactions table:               │
   │ [+1 detail record with reference]          │
   │                                              │
   │ payments table:                             │
   │ [+1 record: amount, method, status=PAID]  │
   └──────────────────────────────────────────────┘
```

---

## Multi-Tenancy Example

### Scenario: User switches from Branch 1 to Branch 2

```
STEP 1: USER SESSION (GLOBAL USER)
┌────────────────────────────────┐
│ User: admin@example.com        │
│ is_global: true                │
│ Active Branch: 1               │
└────────────────────────────────┘

STEP 2: CLICK "SWITCH TO BRANCH 2"
└─► GET /system/switch-branch/2
    └─► BranchController logic:
        └─► session(['active_branch_id' => 2])

STEP 3: USER SESSION (AFTER SWITCH)
┌────────────────────────────────┐
│ User: admin@example.com        │
│ is_global: true                │
│ Active Branch: 2 ◄─ CHANGED!  │
└────────────────────────────────┘

STEP 4: QUERY RUNS
    Product::all()
    
    └─► HasBranch trait applies global scope:
        └─► WHERE products.branch_id = 2  ◄─ AUTO!
    
    └─► Returns: Only products from Branch 2

STEP 5: REPEAT FOR BRANCH 3
    Product::all()
    
    └─► session(['active_branch_id' => 3])
    └─► WHERE products.branch_id = 3  ◄─ AUTO!
    └─► Returns: Only products from Branch 3
```

**Result:** Same code works correctly for all branches without modification!

---

## Permission System Architecture

```
PERMISSION FLOW
├─ User has one+ Role (via role_id or pivot table)
├─ Role has many Permission (via role_permissions pivot)
├─ User can have direct Permission (via user_permissions pivot)
├─ Route checks permission via middleware:
│  └─ Route::resource('/products', ProductController::class)
│     ->middleware('permission:inventory.manage')
│
└─ Check at runtime:
   └─ if ($user->hasPermission('inventory.manage')) { ... }

PERMISSION CATEGORIES (20+ total)

Dashboard (2)
├─ dashboard.global  → View all branches
└─ dashboard.branch  → View own branch

Inventory (4)
├─ inventory.view    → View products/stock
├─ inventory.manage  → Create/edit products
├─ inventory.adjust  → Modify stock levels
└─ inventory.transfer → Move between stores

Production (2)
├─ production.view   → View production orders
└─ production.manage_bom → Create BOMs

POS (2)
├─ pos.access       → Use terminal
└─ pos.returns      → Process returns

Finance (3)
├─ finance.loans    → Manage loans
├─ finance.expenses → Track expenses
└─ finance.reports  → View financial reports

Logistics (1)
└─ logistics.deliveries → Manage containers/shipping

Users (2)
├─ users.view       → List users
└─ users.manage     → Create/edit users

Settings (2)
├─ settings.access  → Configure system
└─ settings.logs    → View audit logs

ROLE TYPES (9)
├─ Admin (Global) → All permissions, all branches
├─ CEO (Global) → Dashboard only, needs approval for operations
├─ Finance Officer → Finance + reports
├─ Branch Manager → All operations for own branch only
├─ Store Manager → Inventory + sales
├─ POS Cashier → POS access only
├─ Warehouse → Inventory management
├─ Production Manager → Production operations
└─ Staff → Limited read-only access
```

---

## Service Layer Integration

### InventoryService
```
Used by:
├─ ProductController.index()          - Display stock levels
├─ PosController.store()              - Validate before sale
├─ ProductController.show()           - Real-time quantities
├─ ProductionController.store()       - Material consumption
├─ TransferController.store()         - Stock movement
├─ StockAdjustmentController.store()  - Quick adjustments
└─ ReportController.inventory_index() - Stock reports

Provides:
├─ Real-time stock query
├─ Transactional updates
├─ Automatic logging
├─ Validation checks
└─ Historical tracking
```

### RollProductionService
```
Used by:
├─ RollProductionController.simulate() - What-if analysis
├─ RollProductionController.split()    - Cut planning
├─ RollProductionController.produce()  - Execute production
└─ ProductionController.store()        - Record output

Provides:
├─ Waste calculation
├─ Yield analysis
├─ Split dimensions
├─ Efficiency tracking
└─ Cost analysis
```

---

## Security Architecture

### Defense Layers

```
1. AUTHENTICATION (Laravel Auth)
   ├─ Password hashing (bcrypt)
   ├─ Session management
   ├─ CSRF protection
   └─ API token handling

2. AUTHORIZATION (RBAC)
   ├─ Role-based access
   ├─ Permission granularity
   ├─ Route middleware
   └─ Controller checks

3. MULTI-TENANCY
   ├─ Branch-level data isolation
   ├─ Global scope filtering
   ├─ Session-based context
   └─ Foreign key constraints

4. INPUT VALIDATION
   ├─ Form request classes
   ├─ Type hints on models
   ├─ Database constraints
   └─ Business logic checks

5. QUERY PROTECTION
   ├─ Eloquent ORM (parameterized)
   ├─ No raw SQL in user data
   ├─ Prepared statements
   └─ Global scope filtering

6. AUDIT TRAIL
   ├─ User activity logging
   ├─ Inventory transaction logging
   ├─ Role change logging
   └─ Timestamp tracking
```

---

## Extension Points (How to Add Features)

### Adding New Feature (e.g., "Gift Cards")
```
1. CREATE MODEL
   php artisan make:model GiftCard
   └─ add `use HasBranch;` trait
   └─ table must have branch_id column

2. CREATE CONTROLLER
   php artisan make:controller GiftCardController
   └─ extend Controller
   └─ add required methods (index, store, show, etc.)

3. CREATE MIGRATION
   php artisan make:migration create_gift_cards_table
   └─ include branch_id foreign key
   └─ add necessary columns

4. ADD ROUTES
   Route::resource('/gift-cards', GiftCardController::class)
       ->middleware('permission:sales.gift_cards');

5. ADD PERMISSION
   Insert into permissions:
   └─ sales.gift_cards

6. ADD TO SEEDER
   └─ Assign permission to appropriate roles
```

**Result:** New feature automatically:**
- Isolated by branch
- Protected by permission
- Scoped to active branch
- Included in branch reports

---

## Database Transaction Example

All critical operations wrapped in transactions:

```php
DB::beginTransaction();
try {
    // 1. Update first table
    $inventory->decrement('qty', $quantity);
    
    // 2. Log the change
    InventoryLog::create([...]);
    
    // 3. Detail transaction
    InventoryTransaction::create([...]);
    
    // All succeed together
    DB::commit();
    
} catch (\Exception $e) {
    // If ANY step fails, ROLLBACK ALL
    DB::rollBack();
    throw $e;
}

Result: Perfect consistency, no orphaned data
```

---

## Caching Strategy (Optional but Recommended)

```
Cache these to improve performance:

1. Permission Categories (change rarely)
   Cache::forever('permission_categories', get_permission_categories());

2. Role List (change rarely)
   Cache::forever('role_list', Role::all());

3. Branch List (change rarely)
   Cache::forever('branches', Branch::all());

4. User Permissions (change occasionally)
   Cache::remember('user_perms_' . auth()->id(), 3600, function() {
       return auth()->user()->permissions;
   });

5. Product Stock (change frequently)
   Cache::remember('stock_product_' . $id, 60, function() {
       return InventoryService::getTotalInventoryQuantity($id);
   });

Remember to:
└─ Clear cache on record update: Cache::forget('key')
```

---

## Monitoring & Alerts (Optional but Recommended)

```
Key Metrics to Monitor:

1. Inventory Alerts
   ├─ Low stock products (auto-generated)
   ├─ Overstock situations
   ├─ Dead stock (90+ days)
   └─ Discrepancies (count vs system)

2. Production Alerts
   ├─ Efficiency below benchmark
   ├─ Production costs trending up
   ├─ Waste above threshold
   └─ Material shortages

3. Financial Alerts
   ├─ Outstanding loans over limit
   ├─ Expense budget overruns
   ├─ Revenue declining
   └─ Margin compression

4. System Alerts
   ├─ Database errors
   ├─ Permission denials
   ├─ Failed transactions
   └─ Slow queries
```

---

## Deployment Checklist

```
Pre-Deployment
[ ] All tests passing
[ ] Code review complete
[ ] Migrations tested locally
[ ] Database backup ready
[ ] Environment variables set

At Deployment
[ ] Pull code
[ ] composer install (--no-dev)
[ ] composer dump-autoload -o (optimized)
[ ] php artisan migrate --force
[ ] php artisan cache:clear
[ ] npm run build (if React changes)
[ ] Clear foreign keys if needed
[ ] Test critical workflows

Post-Deployment
[ ] Monitor error logs
[ ] Check slow queries
[ ] Verify permissions working
[ ] Test branch switching
[ ] Test POS checkout
[ ] Test inventory updates
[ ] Monitor system health
```

---

## Summary

Your HD Group system now has:

✅ **Solid Architecture** - Service layer, traits, helpers
✅ **Multi-Tenancy** - Automatic branch scoping
✅ **Security** - RBAC, auth, isolation
✅ **Data Integrity** - Transactions, logging, audit trails
✅ **Scalability** - Stateless, extensible, cacheable
✅ **Maintainability** - Documented, tested, standard patterns

**Ready for:** Development, testing, and deployment!

