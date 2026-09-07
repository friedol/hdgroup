@php
    $companyName    = \App\Models\Setting::getValue('business_name', 'Company Name');
    $companyEmail   = \App\Models\Setting::getValue('business_email', '');
    $companyPhone   = \App\Models\Setting::getValue('business_phone', '');
    $companyAddress = \App\Models\Setting::getValue('business_address', '');
    $logoPath       = \App\Models\Setting::getValue('system_logo');
    $companyLogo    = $logoPath ? asset('storage/' . $logoPath) : asset('images/logo.png');
    $footerText     = \App\Models\Setting::getValue('footer_text', '');

    $addressParts   = explode("\n", $companyAddress);
    $isProforma     = ($invoiceType === 'proforma');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $isProforma ? 'Proforma Invoice' : 'Sales Invoice' }} - {{ $order->invoice_number }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" href="{{ $faviconPath }}" sizes="any">
    <link rel="apple-touch-icon" href="{{ $faviconPath }}">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700;800&display=swap');

        body {
            font-family: 'Nunito Sans', sans-serif;
            background-color: #fff;
            color: #444;
            font-size: 8.5pt;
            line-height: 1.3;
        }

        .invoice-wrapper {
            max-width: 850px;
            margin: 0 auto;
            padding: 10px 15px;
        }

        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
        }

        .company-header-info {
            font-size: 9pt;
            line-height: 1.4;
        }

        .company-header-info h1 {
            font-weight: 800;
            font-size: 14pt;
            margin: 0 0 5px 0;
            color: #16a34a;
        }

        .invoice-header-title {
            text-align: right;
        }

        .invoice-header-title h2 {
            font-size: 24pt;
            font-weight: 800;
            margin: 0;
            color: #333;
            text-transform: uppercase;
            letter-spacing: -1px;
        }

        .balance-due-header-box {
            margin-top: 10px;
        }

        .balance-due-header-box .amount {
            font-weight: 800;
            font-size: 18pt;
            color: #d63031;
        }

        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .bill-to h3 {
            font-size: 10pt;
            color: #666;
            margin: 0 0 5px 0;
            font-weight: 400;
        }

        .bill-to .customer-name {
            font-weight: 700;
            font-size: 11pt;
            color: #000;
        }

        .invoice-details table { border-collapse: collapse; }

        .invoice-details td {
            padding: 2px 10px;
            font-size: 9.5pt;
        }

        .invoice-details td:first-child { text-align: right; color: #555; }
        .invoice-details td:last-child  { text-align: right; font-weight: 500; }

        .table-pro {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }

        .table-pro th {
            background-color: #16a34a !important;
            padding: 10px;
            font-weight: 500;
            font-size: 10pt;
            color: #fff;
            border: none;
        }

        .table-pro td {
            border-bottom: 1px solid #eee;
            padding: 12px 10px;
            vertical-align: middle;
            font-size: 10pt;
        }

        .table-pro tr:last-child td { border-bottom: 2px solid #ccc; }

        .financial-summary {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }

        .summary-box { width: 320px; }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 10pt;
        }

        .summary-row.grand-total { font-weight: 700; font-size: 10.5pt; }
        .summary-row.paid-row    { color: #16a34a; font-weight: 600; }

        .summary-row.balance-due-row {
            background-color: #f5f5f5;
            padding: 12px 10px;
            margin-top: 10px;
            font-weight: 700;
            font-size: 11pt;
            color: #d63031;
        }

        .notes-section { margin-top: 30px; font-size: 10pt; }
        .notes-section h3 { font-size: 11pt; color: #333; margin-bottom: 8px; font-weight: 400; }

        .footer-content {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            font-size: 9.5pt;
            line-height: 1.5;
        }

        .payment-info h4 { font-size: 10pt; font-weight: 700; margin: 0 0 5px 0; text-transform: uppercase; }

        .company-contact { text-align: right; }
        .company-contact .name { font-weight: 700; text-transform: uppercase; font-size: 10pt; }

        @media print {
            @page { size: A4; margin: 0mm; }

            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 15mm 15mm 140px 15mm !important;
                margin: 0 !important;
                background: white;
            }

            .no-print { display: none !important; }

            .invoice-wrapper { width: 100%; max-width: 100%; padding: 0; margin: 0; }

            .table-pro thead { display: table-header-group; }
            .table-pro tr    { page-break-inside: avoid; }

            .financial-summary, .notes-section { page-break-inside: avoid; }

            .footer-container {
                position: fixed;
                bottom: 0; left: 0; right: 0;
                width: 100%;
                background: white !important;
                padding: 0 15mm 10mm 15mm;
                z-index: 1000;
            }

            .footer-content {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 0 !important;
                border-top: 1px solid #eee !important;
                padding-top: 15px !important;
                font-size: 8pt !important;
            }

            .dev-credit { margin-top: 10px !important; border-top: none; padding-top: 0; }
        }

        .dev-credit {
            font-size: 7.5pt;
            color: #666;
            text-align: center;
            line-height: 1.4;
            margin-top: 15px;
        }

        .dev-credit a { color: #444 !important; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>

    <div class="no-print p-3 bg-primary text-white d-flex justify-content-between align-items-center mb-4">
        <div class="ms-2">
            <h6 class="mb-0 fw-bold">
                <i class="fas fa-print me-2"></i>
                {{ $isProforma ? 'PROFORMA INVOICE PREVIEW' : 'SALES INVOICE PREVIEW' }}
            </h6>
        </div>
        <div class="me-2">
            <button class="btn btn-light fw-bold px-4" onclick="window.print()">PRINT NOW</button>
            <button class="btn btn-outline-light ms-2" onclick="window.close() || window.history.back()">CLOSE</button>
        </div>
    </div>

    <div class="invoice-wrapper">
        <div class="header-section">
            <div class="company-header-info">
                <img src="{{ $companyLogo }}" alt="{{ $companyName }}" style="height: 60px; margin-bottom: 10px;"
                    onerror="this.src='{{ asset('images/logo.webp') }}'">
                <h1>{{ $companyName }}</h1>
                @foreach($addressParts as $part)
                    @if(trim($part))
                        <div>{{ trim($part) }}</div>
                    @endif
                @endforeach
                @if($companyPhone)
                    <div>{{ $companyPhone }}</div>
                @endif
                @if($companyEmail)
                    <div>{{ $companyEmail }}</div>
                @endif
            </div>
            <div class="invoice-header-title">
                <h2>{{ $isProforma ? 'Proforma' : 'Invoice' }}</h2>
                <div class="customer-id-header" style="font-size: 10pt; color: #666;"># {{ $order->invoice_number }}</div>
                <div class="balance-due-header-box">
                    <div class="label" style="font-size: 9pt; color: #888; text-transform: uppercase; font-weight: 600;">
                        {{ $isProforma ? 'Total Amount' : 'Balance Due' }}
                    </div>
                    <div class="amount">
                        TZS {{ number_format($isProforma ? $order->total_amount : $order->balance, 2) }}
                    </div>
                </div>
            </div>
        </div>

        <div class="info-section">
            <div class="bill-to">
                <h3>Bill To</h3>
                <div class="customer-name">
                    {{ $order->posCustomer->customer_name ?? $order->customer->staff_name ?? 'Walking Customer' }}
                </div>
                <div>{{ $order->posCustomer->customer_phone ?? $order->customer->staff_phone ?? '' }}</div>
                <div>{{ $order->posCustomer->customer_email ?? $order->customer->staff_email ?? '' }}</div>
            </div>
            <div class="invoice-details">
                <table>
                    <tr>
                        <td>Date :</td>
                        <td>{{ $order->created_at->format('d M Y') }}</td>
                    </tr>
                    @if(!$isProforma)
                    <tr>
                        <td>Invoice # :</td>
                        <td>INV-{{ $order->id }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td>Order Code :</td>
                        <td>{{ $order->invoice_number }}</td>
                    </tr>
                    <tr>
                        <td>Seller :</td>
                        <td>{{ $order->cashier->staff_name ?? 'System' }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <table class="table-pro">
            <thead style="display: table-header-group;">
                <tr>
                    <th class="text-center" style="width: 40px;">#</th>
                    <th class="text-start">Item & Description</th>
                    <th class="text-end" style="width: 80px;">Qty</th>
                    <th class="text-end" style="width: 120px;">Rate</th>
                    <th class="text-end" style="width: 140px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-start">
                            <div class="fw-bold">
                                {{ $item->product_name ?: ($item->product->name ?? $item->product->product_name ?? 'Unknown') }}
                            </div>
                            @if($item->variants)
                                <div class="small text-muted" style="font-size: 8.5pt;">
                                    @foreach($item->variants as $k => $v)
                                        <span class="me-2">{{ ucfirst($k) }}: {{ is_array($v) ? implode(', ', $v) : $v }}</span>
                                    @endforeach
                                </div>
                            @endif
                        </td>
                        <td class="text-end">{{ number_format($item->quantity, 2) }}</td>
                        <td class="text-end">{{ number_format($item->unit_price, 2) }}</td>
                        <td class="text-end">{{ number_format($item->subtotal, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="financial-summary">
            <div class="summary-box">
                <div class="summary-row">
                    <span>Sub Total</span>
                    <span>{{ number_format($order->subtotal, 2) }}</span>
                </div>
                @if($order->discount > 0)
                    <div class="summary-row">
                        <span>Discount</span>
                        <span>-{{ number_format($order->discount, 2) }}</span>
                    </div>
                @endif
                @if($order->vat_amount > 0)
                    <div class="summary-row">
                        <span>VAT (18%)</span>
                        <span>{{ number_format($order->vat_amount, 2) }}</span>
                    </div>
                @endif
                <div class="summary-row grand-total mt-1">
                    <span>Grand Total</span>
                    <span>TZS {{ number_format($order->total_amount, 2) }}</span>
                </div>
                @if(!$isProforma)
                    <div class="summary-row paid-row">
                        <span>Amount Paid</span>
                        <span>TZS {{ number_format($order->amount_paid, 2) }}</span>
                    </div>
                    <div class="summary-row balance-due-row">
                        <span>Balance Due</span>
                        <span>TZS {{ number_format($order->balance, 2) }}</span>
                    </div>
                @endif
            </div>
        </div>

        <div class="notes-section">
            <h3>Notes</h3>
            @if($isProforma)
                <div>This is a Proforma Invoice. Please note that prices are subject to change after 7 days.</div>
                <div class="mt-1 text-muted">Thanks for your business.</div>
            @else
                <div>Thanks for your business.</div>
            @endif
        </div>

        <div class="footer-container">
            <div class="footer-content">
                <div class="payment-info" style="width: 50%;">
                    @if($footerText)
                        {!! nl2br(e($footerText)) !!}
                    @else
                        <h4>{{ strtoupper($companyName) }}</h4>
                    @endif
                </div>
                <div class="company-contact text-end" style="width: 50%;">
                    <div class="name">{{ $companyName }}</div>
                    @foreach($addressParts as $part)
                        @if(trim($part))
                            <div>{{ trim($part) }}</div>
                        @endif
                    @endforeach
                    @if($companyPhone)
                        <div>MOB: {{ $companyPhone }}</div>
                    @endif
                    @if($companyEmail)
                        <div>EMAIL: {{ $companyEmail }}</div>
                    @endif
                </div>
            </div>
            <div class="dev-credit">
                Developed by <a href="https://www.fridoltech.org" target="_blank">Fridoltech</a>
            </div>
        </div>
    </div>

    <script>
        window.onload = function () {
            if (window.location.search.includes('print=true')) {
                setTimeout(() => { window.print(); }, 500);
            }
        };
    </script>
</body>
</html>
