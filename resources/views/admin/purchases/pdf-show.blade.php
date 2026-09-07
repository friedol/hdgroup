@php
    $companyName    = \App\Models\Setting::getValue('business_name', 'Company Name');
    $companyEmail   = \App\Models\Setting::getValue('business_email', '');
    $companyPhone   = \App\Models\Setting::getValue('business_phone', '');
    $companyAddress = \App\Models\Setting::getValue('business_address', '');
    $logoPath       = \App\Models\Setting::getValue('system_logo');
    
    // Convert logo to base64 for DomPDF compatibility if it exists
    $logoBase64 = null;
    if ($logoPath && file_exists(storage_path('app/public/' . $logoPath))) {
        $path = storage_path('app/public/' . $logoPath);
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
    }
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Receipt - {{ $purchase->purchase_number }}</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
            margin: 0;
            padding: 10px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }
        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #16a34a;
            margin: 0 0 5px 0;
        }
        .document-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            text-align: right;
            text-transform: uppercase;
            margin: 0 0 5px 0;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .details-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #555;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background-color: #16a34a;
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 8px 10px;
            font-size: 10px;
        }
        .items-table td {
            border-bottom: 1px solid #eee;
            padding: 8px 10px;
            font-size: 10px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .fw-bold { font-weight: bold; }
        
        .totals-table {
            width: 300px;
            float: right;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .totals-table td {
            padding: 6px 0;
            font-size: 11px;
        }
        .grand-total {
            font-size: 13px;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 8px;
        }
        .notes-section {
            margin-top: 40px;
            clear: both;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            font-size: 10px;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td>
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" style="max-height: 50px; margin-bottom: 10px;">
                @endif
                <div class="company-name">{{ $companyName }}</div>
                <div>{!! nl2br(e($companyAddress)) !!}</div>
                @if($companyPhone)<div>Phone: {{ $companyPhone }}</div>@endif
                @if($companyEmail)<div>Email: {{ $companyEmail }}</div>@endif
            </td>
            <td class="text-right">
                <div class="document-title">Purchase Receipt</div>
                <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;"># {{ $purchase->purchase_number }}</div>
                <div>Generated: {{ now()->format('d M Y, H:i') }}</div>
            </td>
        </tr>
    </table>

    <table class="details-table">
        <tr>
            <td style="width: 50%;">
                <div class="section-title" style="margin-right: 20px;">Supplier Details</div>
                <div class="fw-bold" style="font-size: 12px;">{{ $purchase->supplier->supplier_name ?? 'N/A' }}</div>
                <div>Phone: {{ $purchase->supplier->supplier_phone ?? 'N/A' }}</div>
                <div>Email: {{ $purchase->supplier->supplier_email ?? 'N/A' }}</div>
            </td>
            <td style="width: 50%;">
                <div class="section-title">Purchase Details</div>
                <table style="width: 100%; border: none;">
                    <tr>
                        <td class="fw-bold" style="padding: 2px 0;">Purchase Date:</td>
                        <td style="padding: 2px 0;">{{ \Carbon\Carbon::parse($purchase->purchase_date)->format('d M Y') }}</td>
                    </tr>
                    <tr>
                        <td class="fw-bold" style="padding: 2px 0;">Status:</td>
                        <td style="padding: 2px 0;">{{ $purchase->status }}</td>
                    </tr>
                    @if($purchase->warehouse)
                    <tr>
                        <td class="fw-bold" style="padding: 2px 0;">Warehouse:</td>
                        <td style="padding: 2px 0;">{{ $purchase->warehouse->name }}</td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 30px;">#</th>
                <th class="text-left">Product</th>
                <th class="text-left" style="width: 80px;">Unit</th>
                <th class="text-right" style="width: 60px;">Qty</th>
                <th class="text-right" style="width: 100px;">Unit Price</th>
                <th class="text-right" style="width: 120px;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchase->items as $index => $item)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td class="text-left">
                        <div class="fw-bold">{{ $item->product->product_name ?? 'N/A' }}</div>
                        <div style="color: #666; font-size: 8.5px;">SKU: {{ $item->product_id }}</div>
                    </td>
                    <td class="text-left">{{ $item->product->productManagement->unit_name ?? '-' }}</td>
                    <td class="text-right">{{ number_format($item->quantity, 2) }}</td>
                    <td class="text-right">TZS {{ number_format($item->buying_price, 2) }}</td>
                    <td class="text-right fw-bold">TZS {{ number_format($item->quantity * $item->buying_price, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr class="grand-total">
            <td class="fw-bold">Grand Total:</td>
            <td class="text-right fw-bold">TZS {{ number_format($purchase->total_amount, 2) }}</td>
        </tr>
    </table>

    @if($purchase->notes)
        <div class="notes-section">
            <div class="fw-bold" style="margin-bottom: 5px;">Notes:</div>
            <div>{{ $purchase->notes }}</div>
        </div>
    @endif

</body>
</html>
