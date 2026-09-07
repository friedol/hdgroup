<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$invs = DB::table('inventories')->where('product_type', 'like', '%aw%')->get();
foreach ($invs as $inv) {
    echo "Inv ID: {$inv->id}, Product ID: {$inv->product_id}, Type: {$inv->product_type}, Qty: {$inv->qty}, Branch: {$inv->branch_id}\n";
}

$adjs = DB::table('stock_adjustments')->get();
foreach ($adjs as $adj) {
    echo "Adj ID: {$adj->id}, Product ID: {$adj->product_id}, Type: {$adj->product_type}, Qty: {$adj->quantity}, Status: {$adj->status}\n";
}

$rms = DB::table('raw_materials')->get();
foreach ($rms as $rm) {
    echo "RM ID: {$rm->id}, Name: {$rm->name}, Branch: {$rm->branch_id}\n";
}
