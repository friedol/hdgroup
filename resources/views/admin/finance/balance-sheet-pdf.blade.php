<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Balance Sheet - {{ $asAt }}</title>
    <style>
        @page { size: A4; margin: 0.45in; }
        :root {
            --ink: #111827;
            --muted: #4b5563;
            --line: #1f2937;
            --soft-line: #d1d5db;
            --bg: #ffffff;
        }
        * {
            font-family: Arial, Helvetica, sans-serif;
        }
        body {
            margin: 0;
            padding: 0;
            background: var(--bg);
            color: var(--ink);
            font-size: 13px;
            line-height: 1.35;
        }
        .sheet {
            width: 100%;
            background: #fff;
        }
        .heading {
            text-align: center;
            border-bottom: 2px solid var(--line);
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .company {
            margin: 0;
            font-size: 30px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }
        .title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
        }
        .as-at {
            margin: 2px 0 0;
            font-size: 16px;
            font-weight: 600;
        }
        .meta {
            margin-top: 3px;
            font-size: 10px;
            color: var(--muted);
            font-family: Arial, Helvetica, sans-serif;
        }

        .statement {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid var(--line);
            table-layout: fixed;
            margin-top: 10px;
        }
        .statement thead th {
            font-size: 13px;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 700;
            padding: 8px 10px;
            border-bottom: 2px solid var(--line);
        }
        .statement thead th:nth-child(1),
        .statement thead th:nth-child(3) {
            text-align: center;
        }
        .statement thead th:nth-child(2),
        .statement thead th:nth-child(4) {
            text-align: right;
            width: 120px;
            border-left: 1px solid var(--line);
        }
        .statement thead th:nth-child(3) {
            border-left: 2px solid var(--line);
        }

        .statement td {
            padding: 4px 10px;
            vertical-align: top;
        }
        .statement td:nth-child(2),
        .statement td:nth-child(4) {
            text-align: right;
            border-left: 1px solid var(--soft-line);
            width: 120px;
            white-space: nowrap;
        }
        .statement td:nth-child(3) {
            border-left: 2px solid var(--line);
        }

        .section {
            font-size: 16px;
            font-weight: 700;
            text-decoration: underline;
            padding-top: 10px;
            padding-bottom: 4px;
        }
        .line-item {
            font-size: 14px;
        }
        .indent {
            padding-left: 16px;
        }
        .line-amount {
            border-bottom: 2px solid #6b7280;
            padding-bottom: 1px;
            display: inline-block;
            min-width: 80px;
        }
        .subtotal {
            font-weight: 700;
            font-size: 15px;
            padding-top: 6px;
        }
        .grand-total {
            font-weight: 700;
            font-size: 16px;
            border-top: 2px solid var(--line);
            border-bottom: 3px double var(--line);
            padding-top: 6px;
            padding-bottom: 6px;
        }
        .spacer td {
            padding: 8px 0;
            font-size: 0;
            line-height: 0;
        }

        .notes {
            margin-top: 12px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: var(--muted);
            border-top: 1px solid var(--soft-line);
            padding-top: 8px;
        }
        .verify {
            margin-top: 10px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .verify.ok { color: #14532d; }
        .verify.warn { color: #991b1b; }

        .breakdown-section { margin-top: 16px; }
        .breakdown-title {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 6px;
            border-bottom: 1px solid var(--soft-line);
            padding-bottom: 3px;
        }
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
        }
        .breakdown-table th,
        .breakdown-table td {
            border: 1px solid #d1d5db;
            padding: 4px 6px;
            text-align: right;
        }
        .breakdown-table th:first-child,
        .breakdown-table td:first-child {
            text-align: left;
        }
        .breakdown-table th { background: #f9fafb; }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    @php
        $liabilitiesTotal = max(0, (float) $summary['total_liabilities_equity'] - (float) $summary['equity']);
        $currentAssetsTotal = (float) $summary['mobile'] + (float) $summary['cash'] + (float) $summary['bank'] + (float) $summary['receivables'] + (float) $summary['inventory'];
        $nonCurrentAssetsTotal = max(0, (float) $summary['total_assets'] - $currentAssetsTotal);

        $currentAssetRows = [
            ['Cash', (float) $summary['cash']],
            ['Mobile', (float) $summary['mobile']],
            ['Bank', (float) $summary['bank']],
            ['Accounts receivable', (float) $summary['receivables']],
            ['Inventory', (float) $summary['inventory']],
        ];

        $liabilityRows = collect($liabilitiesBreakdown ?? [])->map(function ($row) {
            return [$row->name, (float) $row->amount];
        })->values()->all();

        if (count($liabilityRows) === 0) {
            $liabilityRows = [
                ['Accounts payable', $liabilitiesTotal],
            ];
        }

        $equityRows = collect($equityBreakdown ?? [])->map(function ($row) {
            return [$row->name, (float) $row->amount];
        })->values()->all();

        if (count($equityRows) === 0) {
            $equityRows = [
                ['Retained earnings', (float) $summary['equity']],
            ];
        }

        $currentSectionRows = max(count($currentAssetRows), count($liabilityRows));
        $equitySectionRows = max(1, count($equityRows));
    @endphp

    <div class="sheet">
        <div class="heading">
            @if($logo)
                <div style="margin-bottom: 4px;">
                    <img src="data:{{ $logoMime }};base64,{{ $logo }}" style="height: 40px;">
                </div>
            @endif
            <p class="company">{{ strtoupper($displayName) }}</p>
            <p class="title">Balance Sheet</p>
            <p class="as-at">As at {{ $asAt }}</p>
            <div class="meta">Generated {{ now()->format('d M Y H:i') }} @if($displayAddress)| {{ $displayAddress }}@endif</div>
        </div>
        <table class="statement">
            <thead>
                <tr>
                    <th>Assets</th>
                    <th>$</th>
                    <th>Liabilities &amp; Stockholders' Equity</th>
                    <th>$</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="section">Current assets:</td>
                    <td></td>
                    <td class="section">Liabilities:</td>
                    <td></td>
                </tr>
                @for($i = 0; $i < $currentSectionRows; $i++)
                <tr>
                    <td class="line-item indent">{{ $currentAssetRows[$i][0] ?? '' }}</td>
                    <td class="line-item">{{ isset($currentAssetRows[$i]) ? number_format($currentAssetRows[$i][1], 0) : '' }}</td>
                    <td class="line-item indent">{{ $liabilityRows[$i][0] ?? '' }}</td>
                    <td class="line-item">{{ isset($liabilityRows[$i]) ? number_format($liabilityRows[$i][1], 0) : '' }}</td>
                </tr>
                @endfor
                <tr>
                    <td class="subtotal">Total current assets</td>
                    <td class="subtotal"><span class="line-amount">{{ number_format($currentAssetsTotal, 0) }}</span></td>
                    <td class="subtotal">Total liabilities</td>
                    <td class="subtotal"><span class="line-amount">{{ number_format($liabilitiesTotal, 0) }}</span></td>
                </tr>

                <tr class="spacer"><td colspan="4"></td></tr>

                <tr>
                    <td class="section">Non-current assets:</td>
                    <td></td>
                    <td class="section">Stockholders' equity:</td>
                    <td></td>
                </tr>
                @for($i = 0; $i < $equitySectionRows; $i++)
                <tr>
                    <td class="line-item indent">{{ $i === 0 ? 'Other long-term assets' : '' }}</td>
                    <td class="line-item">{{ $i === 0 ? number_format($nonCurrentAssetsTotal, 0) : '' }}</td>
                    <td class="line-item indent">{{ $equityRows[$i][0] ?? '' }}</td>
                    <td class="line-item">{{ isset($equityRows[$i]) ? number_format($equityRows[$i][1], 0) : '' }}</td>
                </tr>
                @endfor

                <tr>
                    <td class="subtotal">Total non-current assets</td>
                    <td class="subtotal"><span class="line-amount">{{ number_format($nonCurrentAssetsTotal, 0) }}</span></td>
                    <td class="subtotal">Total stockholders' equity</td>
                    <td class="subtotal"><span class="line-amount">{{ number_format($summary['equity'], 0) }}</span></td>
                </tr>
                <tr>
                    <td class="grand-total">Total assets</td>
                    <td class="grand-total">{{ number_format($summary['total_assets'], 0) }}</td>
                    <td class="grand-total">Total liabilities &amp; stockholders' equity</td>
                    <td class="grand-total">{{ number_format($summary['total_liabilities_equity'], 0) }}</td>
                </tr>
            </tbody>
        </table>

        @if($department_breakdown->count() > 0)
        <div class="breakdown-section">
            <div class="breakdown-title">Asset distribution by branch ({{ $dateFrom->format('d M Y') }} - {{ $dateTo->format('d M Y') }})</div>
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Branch</th>
                        <th>Mobile</th>
                        <th>Cash</th>
                        <th>Bank</th>
                        <th>Receivables</th>
                        <th>Total assets</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($department_breakdown as $row)
                    <tr>
                        <td>{{ $row->branch_name }}</td>
                        <td>{{ number_format($row->mobile, 0) }}</td>
                        <td>{{ number_format($row->cash, 0) }}</td>
                        <td>{{ number_format($row->bank, 0) }}</td>
                        <td>{{ number_format($row->receivables, 0) }}</td>
                        <td>{{ number_format($row->total_assets, 0) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        @if(abs($summary['total_assets'] - $summary['total_liabilities_equity']) <= 0.01)
        <div class="verify ok">Verified: Statement balanced as of {{ $asAt }}</div>
        @else
        <div class="verify warn">Alert: Balance sheet discrepancy detected (Diff: {{ number_format(abs($summary['total_assets'] - $summary['total_liabilities_equity']), 0) }})</div>
        @endif

        <div class="notes">
            End of financial statement | Jopo Juniours Co. Ltd ERP automated report
        </div>
    </div>

    <script>
        window.onload = function() {
            if (window.location.search.indexOf('action=print') !== -1) {
                window.print();
            }
        }
    </script>
</body>
</html>
