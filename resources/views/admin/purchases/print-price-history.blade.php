@extends('admin.purchases.print-layout')

@section('page_title', 'Product Price History')
@section('preview_title', 'PRICE HISTORY PREVIEW')
@section('document_title', 'Price History')

@section('content')
<table class="table-pro">
    <thead style="display: table-header-group;">
        <tr>
            <th class="text-start">Date</th>
            <th class="text-start">Product</th>
            <th class="text-end">Old Buy Price</th>
            <th class="text-end">New Buy Price</th>
            <th class="text-end">Old Sell Price</th>
            <th class="text-end">New Sell Price</th>
            <th class="text-start">Reason</th>
        </tr>
    </thead>
    <tbody>
        @forelse($histories as $history)
            <tr>
                <td class="text-start">{{ $history->created_at->format('d M Y') }}</td>
                <td class="text-start fw-bold">
                    {{ $history->product->product_name ?? 'N/A' }}
                    @if($history->product->productManagement->unit_name ?? false)
                        <span class="text-muted small fw-normal">({{ $history->product->productManagement->unit_name }})</span>
                    @endif
                </td>
                <td class="text-end">TZS {{ number_format($history->old_buying_price, 2) }}</td>
                <td class="text-end text-success fw-medium">TZS {{ number_format($history->new_buying_price, 2) }}</td>
                <td class="text-end">TZS {{ number_format($history->old_selling_price, 2) }}</td>
                <td class="text-end text-success fw-medium">TZS {{ number_format($history->new_selling_price, 2) }}</td>
                <td class="text-start text-muted small">{{ $history->reason ?: '-' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">No price history found.</td>
            </tr>
        @endforelse
    </tbody>
</table>
@endsection
