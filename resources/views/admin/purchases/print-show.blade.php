@extends('admin.purchases.print-layout')

@section('page_title', 'Purchase Details - ' . $purchase->purchase_number)
@section('preview_title', 'PURCHASE DETAILS PREVIEW')
@section('document_title', 'Purchase Receipt')

@section('content')
<div class="row mb-4">
    <div class="col-6">
        <h5 class="fw-bold mb-2">Supplier Details</h5>
        <div class="fw-semibold text-dark">{{ $purchase->supplier->supplier_name ?? 'N/A' }}</div>
        <div>Phone: {{ $purchase->supplier->supplier_phone ?? 'N/A' }}</div>
        <div>Email: {{ $purchase->supplier->supplier_email ?? 'N/A' }}</div>
    </div>
    <div class="col-6 text-end">
        <h5 class="fw-bold mb-2">Purchase Info</h5>
        <div><strong>Purchase #:</strong> {{ $purchase->purchase_number }}</div>
        <div><strong>Date:</strong> {{ \Carbon\Carbon::parse($purchase->purchase_date)->format('d M Y') }}</div>
        <div><strong>Status:</strong> {{ $purchase->status }}</div>
        @if($purchase->warehouse)
            <div><strong>Warehouse:</strong> {{ $purchase->warehouse->name }}</div>
        @endif
    </div>
</div>

<table class="table-pro">
    <thead style="display: table-header-group;">
        <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th class="text-start">Product</th>
            <th class="text-start" style="width: 100px;">Unit</th>
            <th class="text-end" style="width: 80px;">Qty</th>
            <th class="text-end" style="width: 120px;">Unit Price</th>
            <th class="text-end" style="width: 140px;">Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($purchase->items as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="text-start">
                    <div class="fw-bold">{{ $item->product->product_name ?? 'N/A' }}</div>
                    <div class="small text-muted" style="font-size: 8.5pt;">SKU: {{ $item->product_id }}</div>
                </td>
                <td class="text-start">{{ $item->product->productManagement->unit_name ?? '-' }}</td>
                <td class="text-end">{{ number_format($item->quantity, 2) }}</td>
                <td class="text-end">TZS {{ number_format($item->buying_price, 2) }}</td>
                <td class="text-end fw-semibold">TZS {{ number_format($item->quantity * $item->buying_price, 2) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="row justify-content-end mt-4">
    <div class="col-4">
        <div class="d-flex justify-content-between border-bottom pb-2">
            <strong>Grand Total:</strong>
            <span class="fw-bold text-dark">TZS {{ number_format($purchase->total_amount, 2) }}</span>
        </div>
    </div>
</div>

@if($purchase->notes)
    <div class="mt-4 p-3 bg-light rounded" style="font-size: 9pt;">
        <strong>Notes:</strong><br>
        {{ $purchase->notes }}
    </div>
@endif
@endsection
