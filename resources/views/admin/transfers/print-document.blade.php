@extends('admin.purchases.print-layout')

@section('page_title', 'Stock Transfer - ' . $summary['unique_id'])
@section('preview_title', 'STOCK TRANSFER DOCUMENT PREVIEW')
@section('document_title', 'Stock Transfer')

@section('content')
<div class="row mb-4">
    <div class="col-6">
        <h5 class="fw-bold mb-2">Transfer Route</h5>
        <div><strong>From (Source):</strong> {{ $summary['source_store'] ?? 'N/A' }}</div>
        <div><strong>To (Destination):</strong> {{ $summary['destination_store'] ?? 'N/A' }}</div>
    </div>
    <div class="col-6 text-end">
        <h5 class="fw-bold mb-2">Transfer Info</h5>
        <div><strong>Reference:</strong> {{ $summary['unique_id'] }}</div>
        <div><strong>Date:</strong> {{ \Carbon\Carbon::parse($summary['created_at'])->format('d M Y, H:i') }}</div>
        <div><strong>Status:</strong> {{ ucfirst($summary['status'] ?? 'pending') }}</div>
        <div><strong>Transferred By:</strong> {{ $summary['staff_name'] ?? 'N/A' }}</div>
        <div><strong>Recommended By:</strong> {{ $summary['staff_recommeded'] ?? 'N/A' }}</div>
    </div>
</div>

<table class="table-pro">
    <thead style="display: table-header-group;">
        <tr>
            <th class="text-center" style="width: 34px;">#</th>
            <th class="text-start">Product</th>
            <th class="text-end" style="width: 70px;">Qty</th>
            <th class="text-start" style="width: 64px;">Unit</th>
            <th class="text-end" style="width: 96px;">Buying Price</th>
            <th class="text-end" style="width: 96px;">Selling Price</th>
            <th class="text-end" style="width: 104px;">Buying Value</th>
            <th class="text-end" style="width: 104px;">Selling Value</th>
        </tr>
    </thead>
    <tbody>
        @forelse($transfers as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="text-start">
                    <div class="fw-bold" style="text-transform: uppercase;">{{ $item['product_name'] }}</div>
                    <div class="small text-muted" style="font-size: 8pt;">SKU: {{ $item['product_id'] }}
                        @if($item['unit_factor'] > 1) &middot; {{ number_format($item['raw_pieces']) }} pcs @endif
                    </div>
                </td>
                <td class="text-end">{{ rtrim(rtrim(number_format($item['product_quantity'], 2), '0'), '.') }}</td>
                <td class="text-start">{{ $item['base_unit'] }}</td>
                <td class="text-end">{{ number_format($item['buying_price'], 2) }}</td>
                <td class="text-end">{{ number_format($item['selling_price'], 2) }}</td>
                <td class="text-end">{{ number_format($item['buying_value'], 2) }}</td>
                <td class="text-end fw-semibold">{{ number_format($item['selling_value'], 2) }}</td>
            </tr>
        @empty
            <tr><td colspan="8" class="text-center py-4 text-muted">No items on this transfer.</td></tr>
        @endforelse
    </tbody>
</table>

<div class="row justify-content-end mt-4">
    <div class="col-5">
        <div class="d-flex justify-content-between border-bottom pb-2">
            <strong>Total Quantity:</strong>
            <span class="fw-bold text-dark">{{ rtrim(rtrim(number_format($summary['total_quantity'], 2), '0'), '.') }}</span>
        </div>
        <div class="d-flex justify-content-between border-bottom pb-2 mt-2">
            <strong>Total Stock Cost (Buying):</strong>
            <span class="fw-bold text-dark">TZS {{ number_format($summary['total_buying_value'], 2) }}</span>
        </div>
        <div class="d-flex justify-content-between border-bottom pb-2 mt-2">
            <strong>Total Sale Value (Selling):</strong>
            <span class="fw-bold text-dark">TZS {{ number_format($summary['total_selling_value'], 2) }}</span>
        </div>
        <div class="d-flex justify-content-between pb-2 mt-2">
            <strong>Expected Sell Profit:</strong>
            <span class="fw-bold text-dark">TZS {{ number_format($summary['total_expected_profit'], 2) }}</span>
        </div>
    </div>
</div>

<p class="text-muted mt-3" style="font-size: 8pt;">
    Prices shown are a snapshot taken at the time of transfer and are for internal / office use only.
</p>
@endsection
