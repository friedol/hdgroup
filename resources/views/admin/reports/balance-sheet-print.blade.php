<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balance Sheet - {{ $companyName }}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .header {
            width: 100%;
            margin-bottom: 25px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }

        .company-info {
            float: left;
            width: 70%;
            display: table;
        }

        .logo-wrapper {
            display: table-cell;
            vertical-align: middle;
            padding-right: 15px;
            width: 65px;
        }

        .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            display: block;
        }

        .company-details {
            display: table-cell;
            vertical-align: middle;
        }

        .company-details h1 {
            font-size: 20px;
            font-weight: 900;
            margin: 0;
            color: #000;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }

        .company-details p {
            margin: 2px 0;
            color: #64748b;
            font-size: 10px;
        }

        .report-meta {
            float: right;
            width: 25%;
            text-align: right;
        }

        .report-meta p {
            margin: 2px 0;
            font-weight: 600;
        }

        .report-meta span {
            color: #64748b;
            font-weight: normal;
            display: inline-block;
            width: 80px;
        }

        .title-bar {
            background: #000;
            color: #fff;
            padding: 8px 15px;
            margin-bottom: 20px;
            clear: both;
        }

        .title-bar h2 {
            margin: 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
        }

        .title-bar .period {
            float: right;
            font-size: 9px;
            opacity: 0.8;
            margin-top: 3px;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .summary-table td {
            vertical-align: top;
            padding: 0 10px;
            width: 50%;
        }

        .summary-table td:first-child {
            padding-left: 0;
        }

        .summary-table td:last-child {
            padding-right: 0;
        }

        .summary-column {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }

        .summary-header {
            background: #f8fafc;
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 10px;
        }

        .summary-header .right {
            float: right;
        }

        .summary-row {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
        }

        .summary-row .label {
            float: left;
        }

        .summary-row .amount {
            float: right;
            font-family: monospace;
            font-weight: 700;
        }

        .summary-row.total {
            background: #fff;
            border-top: 2px solid #e2e8f0;
            font-weight: 800;
            padding-top: 10px;
            font-size: 12px;
        }

        .breakdown-section {
            margin-top: 20px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 10px;
            display: block;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }

        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
        }

        .breakdown-table th {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: right;
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
        }

        .breakdown-table th:first-child {
            text-align: left;
        }

        .breakdown-table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: right;
            font-weight: 600;
        }

        .breakdown-table td:first-child {
            text-align: left;
            font-weight: 800;
            color: #0f172a;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
        }

        .footer .left {
            float: left;
        }

        .footer .right {
            float: right;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

        @media print {
            .no-print {
                display: none;
            }

            body {
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>

    <div class="header clearfix">
        <div class="company-info">
            <div class="logo-wrapper">
                @if($logo)
                    <img src="data:{{ $logoMime }};base64,{{ $logo }}" class="logo" alt="Logo">
                @else
                    <div class="logo" style="background: #000; border-radius: 50%; width: 50px; height: 50px;"></div>
                @endif
            </div>
            <div class="company-details">
                <h1>{{ $companyName }}</h1>
                @if($companyAddress)
                <p>{{ $companyAddress }}</p> @endif
                @if($companyPhone)
                <p>Tel: {{ $companyPhone }}</p> @endif
                @if($companyEmail)
                <p>Email: {{ $companyEmail }}</p> @endif
            </div>
        </div>
        <div class="report-meta">
            <p><span>Basis :</span> Consolidated</p>
            <p><span>Currency :</span> TZS</p>
            <p><span>Date :</span> {{ \Carbon\Carbon::now()->format('d M Y') }}</p>
        </div>
    </div>

    <div class="title-bar clearfix">
        <h2>Balance Sheet</h2>
        <span class="period">PERIOD: YEAR ({{ $startDate->format('Y-m-d') }} - {{ $endDate->format('Y-m-d') }})</span>
    </div>

    <table class="summary-table">
        <tr>
            <td>
                <div class="summary-column">
                    <div class="summary-header">
                        <span>Assets</span>
                        <span class="right">TZS</span>
                    </div>
                    <div class="summary-row clearfix">
                        <span class="label">Mobile (net)</span>
                        <span class="amount">{{ number_format($summary['mobile']) }}</span>
                    </div>
                    <div class="summary-row clearfix">
                        <span class="label">Cash (net)</span>
                        <span class="amount">{{ number_format($summary['cash']) }}</span>
                    </div>
                    <div class="summary-row clearfix">
                        <span class="label">Bank (net)</span>
                        <span class="amount">{{ number_format($summary['bank']) }}</span>
                    </div>
                    <div class="summary-row clearfix">
                        <span class="label">Accounts receivable</span>
                        <span class="amount">{{ number_format($summary['receivables']) }}</span>
                    </div>
                    <div class="summary-row total clearfix">
                        <span class="label">Total assets</span>
                        <span class="amount">{{ number_format($summary['total_assets']) }}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="summary-column">
                    <div class="summary-header">
                        <span>Liabilities & Equity</span>
                        <span class="right">TZS</span>
                    </div>
                    <div class="summary-row clearfix">
                        <span class="label">Liabilities</span>
                        <span class="amount">{{ number_format($liabilities) }}</span>
                    </div>
                    <div class="summary-row clearfix">
                        <span class="label">Equity (net position)</span>
                        <span class="amount">{{ number_format($equity) }}</span>
                    </div>
                    <div class="summary-row" style="height: 14px;"></div>
                    <div class="summary-row" style="height: 14px;"></div>
                    <div class="summary-row total clearfix">
                        <span class="label">Total liabilities & equity</span>
                        <span class="amount">{{ number_format($liabilities + $equity) }}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="breakdown-section">
        <span class="section-title">BY PRODUCTS (YEAR ({{ $startDate->format('Y-m-d') }} -
            {{ $endDate->format('Y-m-d') }}))</span>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Mobile</th>
                    <th>Cash</th>
                    <th>Bank</th>
                    <th>Receivables</th>
                    <th>Total Assets</th>
                </tr>
            </thead>
            <tbody>
                @foreach($product_breakdown as $item)
                    <tr>
                        <td>{{ $item->name }}</td>
                        <td>{{ number_format($item->mobile) }}</td>
                        <td>{{ number_format($item->cash) }}</td>
                        <td>{{ number_format($item->bank) }}</td>
                        <td>{{ number_format($item->receivables) }}</td>
                        <td>{{ number_format($item->total_assets) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="breakdown-section" style="margin-top: 40px;">
        <span class="section-title">BY CUSTOMERS (YEAR ({{ $startDate->format('Y-m-d') }} -
            {{ $endDate->format('Y-m-d') }}))</span>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Cash</th>
                    <th>Bank</th>
                    <th>Receivables</th>
                    <th>Total Assets</th>
                </tr>
            </thead>
            <tbody>
                @foreach($customer_breakdown as $item)
                    <tr>
                        <td>{{ $item->name }}</td>
                        <td>{{ number_format($item->mobile) }}</td>
                        <td>{{ number_format($item->cash) }}</td>
                        <td>{{ number_format($item->bank) }}</td>
                        <td>{{ number_format($item->receivables) }}</td>
                        <td>{{ number_format($item->total_assets) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer clearfix">
        <div class="left">Generated by HD GROUP • {{ date('H:i:s') }}</div>
        <div class="right">© {{ date('Y') }} {{ $companyName }}. All rights reserved.</div>
    </div>

    <script>
        window.onload = function () {
            window.print();
        }
    </script>
</body>

</html>