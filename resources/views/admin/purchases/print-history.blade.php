@extends('admin.purchases.print-layout')

@section('page_title', 'Purchase History')
@section('preview_title', 'PURCHASE HISTORY PREVIEW')
@section('document_title', 'Purchase History')

@section('content')
<table class="table-pro">
    <thead style="display: table-header-group;">
        <tr>
            <th class="text-start">Date</th>
            <th class="text-start">Purchase #</th>
            <th class="text-start">Supplier</th>
            <th class="text-end">Total Amount</th>
            <th class="text-start">Status</th>
        </tr>
    </thead>
    <tbody>
        @forelse($purchases as $purchase)
            <tr>
                <td class="text-start">{{ $purchase->created_at->format('d M Y') }}</td>
                <td class="text-start fw-bold">{{ $purchase->purchase_number }}</td>
                <td class="text-start">{{ $purchase->supplier->supplier_name ?? 'N/A' }}</td>
                <td class="text-end">TZS {{ number_format($purchase->total_amount, 2) }}</td>
                <td class="text-start">{{ $purchase->status }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">No purchases found.</td>
            </tr>
        @endforelse
    </tbody>
</table>
@endsection
