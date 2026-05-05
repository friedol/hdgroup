<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daily Report - {{ $branchName }}</title>
    <style>
        @page { size: A4; margin: 0.5in; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
        
        .header { width: 100%; margin-bottom: 20px; display: table; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header-left { display: table-cell; vertical-align: top; }
        .header-right { display: table-cell; vertical-align: top; text-align: right; }
        
        .logo { max-height: 50px; margin-bottom: 5px; }
        .header-left h1 { margin: 0; font-size: 18px; font-weight: bold; color: #111; }
        .header-right h2 { margin: 0; font-size: 20px; font-weight: 900; color: #444; }
        
        .report-section { margin-bottom: 25px; }
        
        table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-bottom: 20px; }
        th { background: #f4f4f4; border: 1px solid #ccc; padding: 10px 5px; text-align: left; font-size: 10px; font-weight: bold; color: #333; vertical-align: middle; }
        td { border: 1px solid #ddd; padding: 7px 5px; font-size: 10px; vertical-align: middle; color: #444; }
        
        .divider-col { border-left: 2px solid #000 !important; }
        
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-red { color: #d32f2f !important; }
        .text-blue { color: #2563eb !important; }
        .text-cyan { color: #0891b2 !important; }
        .text-emerald { color: #059669 !important; }
        .text-orange { color: #f59e0b !important; }
        
        .totals-row { background: #fff; font-weight: bold; }
        
        .summary-section { margin-top: 40px; border-top: 2px solid #333; padding-top: 30px; }
        .summary-title { font-size: 14px; font-weight: 800; color: #111; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .summary-grid { display: table; width: 100%; }
        .summary-col { display: table-cell; width: 50%; vertical-align: top; }
        
        .metric-row { display: table; width: 100%; margin-bottom: 15px; border-bottom: 1px solid #f9fafb; padding-bottom: 10px; }
        .metric-label { display: table-cell; font-size: 11px; color: #4b5563; }
        .metric-value { display: table-cell; text-align: right; font-size: 13px; font-weight: 900; color: #111; }

        @media print {
            .no-print { display: none; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <table style="width: 100%; border: none;">
                <tr>
                    @if($logo)
                        <td style="width: 75px; border: none; padding: 0;">
                            <img src="data:{{ $logoMime }};base64,{{ $logo }}" class="logo">
                        </td>
                    @endif
                    <td style="border: none; padding: 0; vertical-align: middle;">
                        <h1>{{ $branchName }}</h1>
                        <p style="margin: 2px 0 0 0; font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Daily Financial Report</p>
                    </td>
                </tr>
            </table>
        </div>
        <div class="header-right">
            <h2>DAILY REPORT</h2>
            <div style="margin-top: 5px;">
                <span style="font-weight: bold; font-size: 10px;">PERIOD:</span> 
                <span style="font-size: 10px;">{{ $carbonFrom->format('d M Y') }} @if($isRange) – {{ $carbonTo->format('d M Y') }} @endif</span>
            </div>
            <div style="font-size: 9px; color: #888; margin-top: 2px;">Generated: {{ now()->format('d M Y H:i') }}</div>
        </div>
    </div>

    @foreach($reportData as $report)
        <div class="report-section">
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%">Customer</th>
                        <th style="width: 25%;">{{ $report['branch']['name'] }} (Products)</th>
                        <th class="text-right">Mobile</th>
                        <th class="text-right">Cash</th>
                        <th class="text-right">Bank</th>
                        <th class="text-right">Remain</th>
                        <th style="width: 20%; color: #d32f2f" class="divider-col">CASHOUT (Expense)</th>
                        <th class="text-right text-red">M-Cash</th>
                        <th class="text-right text-red">Cash</th>
                        <th class="text-right text-red">Bank</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $maxIdx = max(count($report['incomeItems']), count($report['expenseItems']));
                    @endphp
                    @for($i = 0; $i < $maxIdx; $i++)
                        @php
                            $inc = $report['incomeItems'][$i] ?? null;
                            $exp = $report['expenseItems'][$i] ?? null;
                        @endphp
                        <tr>
                            <td>{{ $inc['customer_name'] ?? '' }}</td>
                            <td>{{ $inc['description'] ?? '' }}</td>
                            <td class="text-right">{{ $inc && (float)$inc['mobile'] != 0 ? number_format($inc['mobile'], 0) : '' }}</td>
                            <td class="text-right">{{ $inc && (float)$inc['cash'] != 0 ? number_format($inc['cash'], 0) : '' }}</td>
                            <td class="text-right">{{ $inc && (float)$inc['bank'] != 0 ? number_format($inc['bank'], 0) : '' }}</td>
                            <td class="text-right">{{ $inc && (float)$inc['remain'] != 0 ? number_format($inc['remain'], 0) : '' }}</td>
                            
                            <td class="divider-col">{{ $exp['description'] ?? '' }}</td>
                            <td class="text-right">{{ $exp && (float)$exp['mobile'] != 0 ? number_format($exp['mobile'], 0) : '' }}</td>
                            <td class="text-right">{{ $exp && (float)$exp['cash'] != 0 ? number_format($exp['cash'], 0) : '' }}</td>
                            <td class="text-right">{{ $exp && (float)$exp['bank'] != 0 ? number_format($exp['bank'], 0) : '' }}</td>
                        </tr>
                    @endfor
                    @php
                        $bIncMob = array_sum(array_column($report['incomeItems'], 'mobile'));
                        $bIncCsh = array_sum(array_column($report['incomeItems'], 'cash'));
                        $bIncBnk = array_sum(array_column($report['incomeItems'], 'bank'));
                        $bIncRem = array_sum(array_column($report['incomeItems'], 'remain'));
                        
                        $bExpMob = array_sum(array_column($report['expenseItems'], 'mobile'));
                        $bExpCsh = array_sum(array_column($report['expenseItems'], 'cash'));
                        $bExpBnk = array_sum(array_column($report['expenseItems'], 'bank'));
                    @endphp
                    <tr class="totals-row">
                        <td colspan="2">TOTAL FOR {{ strtoupper($report['branch']['name']) }}</td>
                        <td class="text-right">{{ $bIncMob != 0 ? number_format($bIncMob, 0) : '' }}</td>
                        <td class="text-right">{{ $bIncCsh != 0 ? number_format($bIncCsh, 0) : '' }}</td>
                        <td class="text-right">{{ $bIncBnk != 0 ? number_format($bIncBnk, 0) : '' }}</td>
                        <td class="text-right">{{ $bIncRem != 0 ? number_format($bIncRem, 0) : '' }}</td>
                        
                        <td class="divider-col text-red">EXP. TOTAL</td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endforeach

    <!-- Consolidated Summary -->
    <div class="summary-section">
        <div class="summary-grid">
            <div class="summary-col" style="padding-right: 40px;">
                <h3 class="summary-title">FINANCIAL SUMMARY</h3>
                
                <div class="metric-row">
                    <div class="metric-label">Total Revenue (In):</div>
                    <div class="metric-value">TZS {{ number_format($grandTotals['income']['mobile'] + $grandTotals['income']['cash'] + $grandTotals['income']['bank'], 0) }}</div>
                </div>
                
                <div class="metric-row">
                    <div class="metric-label">Total Expenses (Out):</div>
                    <div class="metric-value text-orange">TZS {{ number_format($grandTotals['expense']['mobile'] + $grandTotals['expense']['cash'] + $grandTotals['expense']['bank'], 0) }}</div>
                </div>

                <div class="metric-row">
                    <div class="metric-label">Total Outstanding (Remain):</div>
                    <div class="metric-value text-cyan">TZS {{ number_format($grandTotals['income']['remain'], 0) }}</div>
                </div>

                <div class="metric-row" style="border: none;">
                    <div class="metric-label">Total Debt Collected:</div>
                    <div class="metric-value text-emerald">TZS {{ number_format($grandTotals['income']['total_debt'], 0) }}</div>
                </div>
            </div>

            <div class="summary-col" style="border-left: 1px solid #eee; padding-left: 40px;">
                <h3 class="summary-title">PAYMENT BREAKDOWN</h3>
                
                <div style="display: table; width: 100%; margin-bottom: 20px;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding-bottom: 15px;">
                            <div style="font-size: 9px; color: #888; font-weight: bold;">CASH (IN)</div>
                            <div style="font-size: 15px; font-weight: 800; color: #059669;">TZS {{ number_format($grandTotals['income']['cash'], 0) }}</div>
                        </div>
                        <div style="display: table-cell; padding-bottom: 15px; padding-left: 25px;">
                            <div style="font-size: 9px; color: #888; font-weight: bold;">MOBILE (IN)</div>
                            <div style="font-size: 15px; font-weight: 800; color: #2563eb;">TZS {{ number_format($grandTotals['income']['mobile'], 0) }}</div>
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell;">
                            <div style="font-size: 9px; color: #888; font-weight: bold;">BANK (IN)</div>
                            <div style="font-size: 15px; font-weight: 800; color: #0891b2;">TZS {{ number_format($grandTotals['income']['bank'], 0) }}</div>
                        </div>
                        <div style="display: table-cell; padding-left: 25px;">
                            <div style="font-size: 9px; color: #888; font-weight: bold;">TOTAL IN</div>
                            <div style="font-size: 15px; font-weight: 800; color: #111;">TZS {{ number_format($grandTotals['income']['mobile'] + $grandTotals['income']['cash'] + $grandTotals['income']['bank'], 0) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @if(request('action') === 'print')
        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    @endif
</body>
</html>
