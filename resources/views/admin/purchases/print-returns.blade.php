@extends('admin.purchases.print-layout')

@section('page_title', 'Purchase Returns History')
@section('preview_title', 'PURCHASE RETURNS PREVIEW')
@section('document_title', 'Purchase Returns')

@section('content')
<table class="table-pro">
    <thead style="display: table-header-group;">
        <tr>
            <th class="text-start">Date</th>
            <th class="text-start">Purchase #</th>
            <th class="text-start">Product</th>
            <th class="text-end">Qty Returned</th>
            <th class="text-start">Reason</th>
            <th class="text-start">Processed By</th>
        </tr>
    </thead>
    <tbody>
        @forelse($returns as $return)
            <tr>
                <td class="text-start">{{ $return->created_at->format('d M Y') }}</td>
                <td class="text-start fw-bold">{{ $return->purchase->purchase_number ?? 'N/A' }}</td>
                <td class="text-start">
                    {{ $return->product->product_name ?? 'N/A' }}
                    @if($return->product->productManagement->unit_name ?? false)
                        <span class="text-muted small">({{ $return->product->productManagement->unit_name }})</span>
                    @endif
                </td>
                <td class="text-end">{{ $return->quantity_returned }}</td>
                <td class="text-start">{{ $return->reason }}</td>
                <td class="text-start">{{ $return->user->staff_name ?? 'System' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">No purchase returns found.</td>
            </tr>
        @endforelse
    </tbody>
</table>
@endsection
