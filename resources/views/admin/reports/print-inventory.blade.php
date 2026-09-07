@extends('admin.purchases.print-layout')

@php
    $pageTitles = [
        'valued' => 'Valued Inventory Report',
        'unvalued' => 'Out of Stock Inventory Report',
        'top-selling' => 'Top Selling Products Report',
        'alerts' => 'Stock Alerts Report',
    ];
    $previewTitles = [
        'valued' => 'VALUED INVENTORY REPORT PREVIEW',
        'unvalued' => 'OUT OF STOCK REPORT PREVIEW',
        'top-selling' => 'TOP SELLING REPORT PREVIEW',
        'alerts' => 'STOCK ALERTS PREVIEW',
    ];
    $documentTitles = [
        'valued' => 'Valued Inventory',
        'unvalued' => 'Out of Stock Inventory',
        'top-selling' => 'Top Selling Products',
        'alerts' => 'Stock Alerts',
    ];
@endphp

@section('page_title', $pageTitles[$type] ?? 'Inventory Report')
@section('preview_title', $previewTitles[$type] ?? 'INVENTORY REPORT PREVIEW')
@section('document_title', $documentTitles[$type] ?? 'Inventory')

@section('content')
<div class="row mb-3">
    <div class="col-6">
        <div><strong>Store:</strong> {{ $storeName ?? 'All Stores' }}</div>
        <div><strong>Reporting Period:</strong> {{ $periodLabel ?? 'All dates' }}</div>
    </div>
    @isset($overview)
    <div class="col-6 text-end">
        <div><strong>Stock Cost:</strong> TZS {{ number_format($overview['stock_cost'], 2) }}</div>
        <div><strong>Expected Sale Value:</strong> TZS {{ number_format($overview['expected_sale_value'], 2) }}</div>
        <div><strong>Expected Sell Profit:</strong> TZS {{ number_format($overview['expected_sell_profit'], 2) }}</div>
        <div><strong>Total Stock:</strong> {{ number_format($overview['total_stock'], 2) }} units</div>
    </div>
    @endisset
</div>

<table class="table-pro">
    <thead>
        <tr>
            <th class="text-start">#</th>
            <th class="text-start">Product Name</th>
            @if($type === 'top-selling')
                <th class="text-end">Units Sold</th>
                <th class="text-end">Total Revenue</th>
            @else
                <th class="text-start">SKU</th>
                <th class="text-start">Category</th>
                <th class="text-start">Store</th>
                <th class="text-end">Quantity</th>
                <th class="text-end">Unit</th>
                @if($type === 'valued')
                    <th class="text-end">Price</th>
                    <th class="text-end">Total Value</th>
                @endif
            @endif
        </tr>
    </thead>
    <tbody>
        @if($type === 'top-selling')
            @forelse($topProducts as $index => $item)
                <tr>
                    <td class="text-start">{{ $index + 1 }}</td>
                    <td class="text-start fw-bold" style="text-transform: uppercase;">{{ $item->product_name }}</td>
                    <td class="text-end">{{ number_format($item->total_qty) }}</td>
                    <td class="text-end fw-semibold">TZS {{ number_format($item->total_revenue, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">No top selling products found.</td>
                </tr>
            @endforelse
        @elseif($type === 'alerts')
            @forelse($outStock as $index => $item)
                <tr>
                    <td class="text-start">{{ $index + 1 }}</td>
                    <td class="text-start fw-bold" style="text-transform: uppercase;">{{ $item->product_name }}</td>
                    <td class="text-start">{{ $item->PRDID ?? '-' }}</td>
                    <td class="text-start">{{ $item->category_name ?? '-' }}</td>
                    <td class="text-start">{{ $item->store_name ?? 'N/A' }}</td>
                    <td class="text-end text-danger fw-bold">{{ number_format($item->pro_quantity, 2) }}</td>
                    <td class="text-end">{{ $item->unit_name ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">No stock alerts found.</td>
                </tr>
            @endforelse
        @else
            @php
                $grandTotalQty = 0;
                $grandTotalVal = 0;
                $filteredPrd = collect($prd)->filter(function($item) use ($type) {
                    if ($type === 'valued') {
                        return $item->pro_quantity > 0;
                    }
                    return $item->pro_quantity <= 0;
                });
            @endphp
            @forelse($filteredPrd as $index => $item)
                @php
                    $grandTotalQty += $item->pro_quantity;
                    $grandTotalVal += ($item->pro_quantity * $item->product_price);
                @endphp
                <tr>
                    <td class="text-start">{{ $loop->iteration }}</td>
                    <td class="text-start fw-bold" style="text-transform: uppercase;">{{ $item->product_name }}</td>
                    <td class="text-start">{{ $item->PRDID }}</td>
                    <td class="text-start">{{ $item->category_name ?? '-' }}</td>
                    <td class="text-start">{{ $item->store_name ?: 'N/A' }}</td>
                    <td class="text-end">{{ number_format($item->pro_quantity, 2) }}</td>
                    <td class="text-end">{{ $item->unit_name ?? '-' }}</td>
                    @if($type === 'valued')
                        <td class="text-end">TZS {{ number_format($item->product_price, 2) }}</td>
                        <td class="text-end fw-semibold">TZS {{ number_format($item->pro_quantity * $item->product_price, 2) }}</td>
                    @endif
                </tr>
            @empty
                <tr>
                    <td colspan="{{ $type === 'valued' ? 9 : 7 }}" class="text-center py-4 text-muted">No inventory records found for this view.</td>
                </tr>
            @endforelse
        @endif
    </tbody>
</table>

@if(in_array($type, ['valued', 'unvalued']))
<div class="row justify-content-end mt-4">
    <div class="col-6">
        <div class="d-flex justify-content-between border-bottom pb-2">
            <strong>Total Quantity:</strong>
            <span class="fw-bold text-dark">{{ number_format($grandTotalQty, 2) }}</span>
        </div>
        @if($type === 'valued')
            <div class="d-flex justify-content-between border-bottom pb-2 mt-2">
                <strong>Grand Total Value:</strong>
                <span class="fw-bold text-dark">TZS {{ number_format($grandTotalVal, 2) }}</span>
            </div>
        @endif
    </div>
</div>
@endif
@endsection
