<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Movement Report — {{ $companyName }}</title>
    <style>
        @page { size: A4 landscape; margin: 12mm 15mm; }

        * { box-sizing: border-box; }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #1e293b;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            background: #fff;
        }

        /* ── Header ── */
        .header {
            width: 100%;
            display: table;
            margin-bottom: 18px;
            border-bottom: 2.5px solid #1e3a5f;
            padding-bottom: 12px;
        }

        .header-left {
            display: table-cell;
            vertical-align: middle;
            width: 65%;
        }

        .logo-row {
            display: table;
        }

        .logo-cell {
            display: table-cell;
            vertical-align: middle;
            padding-right: 12px;
            width: 56px;
        }

        .logo {
            width: 52px;
            height: 52px;
            object-fit: contain;
        }

        .company-cell {
            display: table-cell;
            vertical-align: middle;
        }

        .company-name {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.3px;
            text-transform: uppercase;
            margin: 0 0 3px 0;
        }

        .company-meta {
            font-size: 9px;
            color: #64748b;
            margin: 1px 0;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 42%;
        }

        .report-title {
            font-size: 15px;
            font-weight: 900;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
        }

        .report-badge {
            display: inline-block;
            background: #1e3a5f;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 3px;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .meta-list {
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .meta-list li {
            font-size: 9px;
            color: #475569;
            margin-bottom: 2px;
        }

        .meta-list li span {
            font-weight: 700;
            color: #0f172a;
        }

        /* ── Summary ── */
        .summary-line {
            font-size: 10px;
            color: #334155;
            margin-bottom: 14px;
            text-align: right;
        }

        .summary-line strong {
            color: #0f172a;
            font-weight: 800;
        }

        /* ── Table ── */
        .section-title {
            background: #1e3a5f;
            color: #fff;
            padding: 6px 10px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 0;
        }

        table.report {
            width: 100%;
            border-collapse: collapse;
        }

        .report thead tr {
            background: #334d6e;
        }

        .report th {
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            padding: 7px 8px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border: 1px solid #2a3f5c;
        }

        .report th.right,
        .report td.right { text-align: right; }
        .report th.center,
        .report td.center { text-align: center; }

        .report tbody tr:nth-child(even) { background: #f8fafc; }
        .report tbody tr:nth-child(odd)  { background: #fff; }

        .report tbody tr:hover { background: #eff6ff; }

        .report td {
            padding: 6px 8px;
            font-size: 9.5px;
            border: 1px solid #e2e8f0;
            color: #334155;
        }

        .product-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 10px;
        }

        .sku-text {
            font-family: 'Courier New', monospace;
            color: #64748b;
            font-size: 9px;
        }

        .qty-val  { font-weight: 800; color: #2563eb; }
        .rev-val  { font-weight: 800; color: #16a34a; }
        .rank-val { font-weight: 700; color: #64748b; font-size: 9px; }

        .cat-badge {
            display: inline-block;
            background: #e2e8f0;
            color: #475569;
            font-size: 8px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 3px;
        }

        .row-total {
            background: #dbeafe !important;
            font-weight: 800;
            font-size: 10.5px;
        }

        .row-total td {
            border-top: 2px solid #3b82f6;
            color: #1e3a8a;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 16px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            display: table;
            width: 100%;
        }

        .footer-left {
            display: table-cell;
            font-size: 8px;
            color: #94a3b8;
            vertical-align: bottom;
        }

        .footer-right {
            display: table-cell;
            text-align: right;
            font-size: 8px;
            color: #94a3b8;
            vertical-align: bottom;
        }

        .signature-row {
            margin-top: 30px;
            display: table;
            width: 100%;
        }

        .sig-box {
            display: table-cell;
            width: 30%;
            padding-right: 30px;
            text-align: center;
            vertical-align: bottom;
        }

        .sig-line {
            border-top: 1px solid #94a3b8;
            padding-top: 4px;
            font-size: 9px;
            color: #64748b;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>

    @php
        $logoPath = \App\Models\Setting::getValue('system_logo');
        $logoUrl  = $logoPath ? asset('storage/' . $logoPath) : null;

        $totalQty = collect($movements)->sum('total_qty_sold');
        $totalRev = collect($movements)->sum('total_revenue');
        $totalTxn = collect($movements)->sum('num_transactions');
    @endphp

    {{-- ── HEADER ── --}}
    <div class="header">
        <div class="header-left">
            <div class="logo-row">
                @if($logoUrl)
                <div class="logo-cell">
                    <img src="{{ $logoUrl }}" alt="Logo" class="logo">
                </div>
                @endif
                <div class="company-cell">
                    <p class="company-name">{{ $companyName }}</p>
                    @if($companyPhone)
                        <p class="company-meta">Tel: {{ $companyPhone }}</p>
                    @endif
                    @if($companyEmail)
                        <p class="company-meta">Email: {{ $companyEmail }}</p>
                    @endif
                    @if($companyAddress)
                        <p class="company-meta">{{ $companyAddress }}</p>
                    @endif
                </div>
            </div>
        </div>
        <div class="header-right">
            <p class="report-title">Product Movement Report</p>
            <span class="report-badge">INVENTORY ANALYSIS</span>
            <ul class="meta-list">
                <li>Period: <span>{{ \Carbon\Carbon::parse($dateFrom)->format('d M Y') }} — {{ \Carbon\Carbon::parse($dateTo)->format('d M Y') }}</span></li>
                <li>Branch: <span>{{ $branchName }}</span></li>
                @if($filterCategory)
                <li>Category: <span>{{ $filterCategory }}</span></li>
                @endif
                <li>Products: <span>{{ count($movements) }}</span></li>
                <li>Generated: <span>{{ now()->format('d M Y, H:i') }}</span></li>
            </ul>
        </div>
    </div>

    {{-- ── SUMMARY ── --}}
    <div class="summary-line">
        Units Sold: <strong>{{ number_format($totalQty) }}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Total Revenue: <strong>TZS {{ number_format($totalRev) }}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Transactions: <strong>{{ number_format($totalTxn) }}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Products: <strong>{{ count($movements) }}</strong>
    </div>

    {{-- ── MOVEMENT TABLE ── --}}
    <div class="section-title">Product Sales Movement</div>
    <table class="report">
        <thead>
            <tr>
                <th style="width:4%">#</th>
                <th style="width:26%">Product Name</th>
                <th style="width:12%">SKU</th>
                <th style="width:14%">Category</th>
                <th class="right" style="width:11%">Qty Sold</th>
                <th class="right" style="width:15%">Revenue (TZS)</th>
                <th class="right" style="width:9%">Txns</th>
                <th class="right" style="width:9%">Avg Price</th>
            </tr>
        </thead>
        <tbody>
            @forelse($movements as $i => $row)
                @php
                    $avgPrice = $row->total_qty_sold > 0
                        ? $row->total_revenue / $row->total_qty_sold
                        : 0;
                @endphp
                <tr>
                    <td class="rank-val center">{{ $i + 1 }}</td>
                    <td>
                        <span class="product-name">{{ $row->product_name }}</span>
                    </td>
                    <td>
                        <span class="sku-text">{{ $row->sku ?: '—' }}</span>
                    </td>
                    <td>
                        <span class="cat-badge">{{ $row->category }}</span>
                    </td>
                    <td class="right">
                        <span class="qty-val">{{ number_format($row->total_qty_sold) }}</span>
                    </td>
                    <td class="right">
                        <span class="rev-val">{{ number_format($row->total_revenue) }}</span>
                    </td>
                    <td class="right">{{ number_format($row->num_transactions) }}</td>
                    <td class="right">{{ number_format($avgPrice) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align:center; padding: 30px; color:#94a3b8; font-style:italic;">
                        No product movement data found for the selected period.
                    </td>
                </tr>
            @endforelse

            {{-- Totals row --}}
            @if(count($movements) > 0)
            <tr class="row-total">
                <td colspan="4" class="right"><strong>TOTALS</strong></td>
                <td class="right"><strong>{{ number_format($totalQty) }}</strong></td>
                <td class="right"><strong>{{ number_format($totalRev) }}</strong></td>
                <td class="right"><strong>{{ number_format($totalTxn) }}</strong></td>
                <td class="right">—</td>
            </tr>
            @endif
        </tbody>
    </table>

    {{-- ── SIGNATURE AREA ── --}}
    <div class="signature-row">
        <div class="sig-box">
            <div class="sig-line">Prepared By</div>
        </div>
        <div class="sig-box">
            <div class="sig-line">Verified By</div>
        </div>
        <div class="sig-box">
            <div class="sig-line">Approved By</div>
        </div>
    </div>

    {{-- ── FOOTER ── --}}
    <div class="footer">
        <div class="footer-left">
            {{ $companyName }} &mdash; Product Movement Report &mdash; Confidential
        </div>
        <div class="footer-right">
            Printed: {{ now()->format('d M Y, H:i') }} &nbsp;|&nbsp; Page 1
        </div>
    </div>

    <script>
        window.onload = function () { window.print(); };
    </script>
</body>
</html>
