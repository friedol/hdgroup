<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Profit and Loss Report</title>
    <style>
        @page { size: A4; margin: 0.45in; }
        * { font-family: Arial, Helvetica, sans-serif; }
        body { color: #222; margin: 0; font-size: 11px; }

        .header {
            background: #89a8cc;
            color: #fff;
            padding: 14px 16px;
            border: 1px solid #8ea7c4;
        }

        .header-grid {
            width: 100%;
            border-collapse: collapse;
        }

        .header-grid td { border: none; padding: 0; vertical-align: top; }

        .title-left { font-size: 18px; font-weight: 800; letter-spacing: 0.3px; }
        .title-right { font-size: 18px; font-weight: 800; text-align: right; letter-spacing: 0.2px; }
        .sub { margin-top: 4px; font-size: 12px; opacity: 0.95; }

        .meta {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 12px;
        }

        .meta th, .meta td {
            border: 1px solid #c9d2dc;
            padding: 6px 8px;
            text-align: center;
        }

        .meta th {
            background: #f3f6f9;
            font-size: 11px;
            color: #334155;
            font-weight: 700;
        }

        .section-title {
            background: #3f6ea7;
            color: #fff;
            padding: 7px 10px;
            font-size: 18px;
            font-weight: 800;
            border: 1px solid #295f9a;
            margin-top: 10px;
        }

        table.report {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
        }

        .report th, .report td {
            border: 1px solid #c5ccd5;
            padding: 6px 8px;
            font-size: 11px;
        }

        .report th {
            background: #4f78ad;
            color: #fff;
            font-weight: 700;
            text-align: right;
        }

        .report th:first-child { text-align: left; }

        .left { text-align: left; }
        .right { text-align: right; }

        .row-head {
            background: #e8f0fa;
            font-weight: 700;
            color: #173b69;
        }

        .row-total {
            background: #eef3fb;
            font-weight: 700;
        }

        .row-final {
            background: #dbe7f7;
            font-weight: 800;
            font-size: 12px;
        }

        .indent { padding-left: 22px !important; font-style: italic; }

        .summary {
            margin-top: 12px;
            width: 100%;
            border-collapse: collapse;
        }

        .summary td {
            border: 1px solid #c5ccd5;
            padding: 8px;
            font-size: 11px;
        }

        .summary .label { background: #f7fafc; font-weight: 700; color: #334155; width: 30%; }
        .summary .value { text-align: right; font-weight: 700; width: 20%; }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-grid">
            <tr>
                <td style="width: 50%;">
                    <div class="title-left">{{ $companyName }}</div>
                    <div class="sub">Address: {{ $companyAddress ?: 'N/A' }} | Branch: {{ $branchName }}</div>
                </td>
                <td style="width: 50%;">
                    <div class="title-right">Profit and Loss Report</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="meta">
        <tr>
            <th>Date Created</th>
            <th>Date Issued</th>
            <th>Period</th>
            <th>Branch</th>
        </tr>
        <tr>
            <td>{{ now()->format('d M, Y') }}</td>
            <td>{{ now()->format('d M, Y') }}</td>
            <td>{{ ucfirst($period) }} ({{ $startDate->format('d M, Y') }} - {{ $endDate->format('d M, Y') }})</td>
            <td>{{ $branchName }}</td>
        </tr>
    </table>

    <div class="section-title">Profit and Loss Report</div>
    <table class="report">
        <thead>
            <tr>
                <th class="left">Description</th>
                <th>Amount (TZS)</th>
            </tr>
        </thead>
        <tbody>
            <tr class="row-head">
                <td class="left">Revenue</td>
                <td></td>
            </tr>
            <tr>
                <td class="left">Sales</td>
                <td class="right">{{ number_format($totalSales, 2) }}</td>
            </tr>
            <tr>
                <td class="left indent">Less: Discounts and Allowances</td>
                <td class="right">{{ number_format($discountsTotal, 2) }}</td>
            </tr>
            <tr class="row-total">
                <td class="left">Net Sales</td>
                <td class="right">{{ number_format($netSales, 2) }}</td>
            </tr>

            <tr class="row-head">
                <td class="left">Cost of Goods Sold</td>
                <td></td>
            </tr>
            <tr>
                <td class="left">Materials / Cost Base</td>
                <td class="right">{{ number_format($totalCogs, 2) }}</td>
            </tr>
            <tr class="row-total">
                <td class="left">Total Cost of Goods Sold</td>
                <td class="right">{{ number_format($totalCogs, 2) }}</td>
            </tr>

            <tr class="row-total">
                <td class="left">Gross Profit</td>
                <td class="right">{{ number_format($grossProfit, 2) }}</td>
            </tr>

            <tr class="row-head">
                <td class="left">Operating Expenses</td>
                <td></td>
            </tr>
            @forelse($expenseCategories as $exp)
                <tr>
                    <td class="left">{{ $exp->category ?: 'General' }}</td>
                    <td class="right">{{ number_format((float)$exp->total_amount, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td class="left">No approved expenses</td>
                    <td class="right">0.00</td>
                </tr>
            @endforelse
            <tr class="row-total">
                <td class="left">Total Operating Expenses</td>
                <td class="right">{{ number_format($totalExpenses, 2) }}</td>
            </tr>

            <tr class="row-total">
                <td class="left">Operating Profit (Loss)</td>
                <td class="right">{{ number_format($operatingProfit, 2) }}</td>
            </tr>

            <tr class="row-head">
                <td class="left">Other Income</td>
                <td></td>
            </tr>
            <tr>
                <td class="left">Tax Collected</td>
                <td class="right">{{ number_format($taxTotal, 2) }}</td>
            </tr>

            <tr class="row-total">
                <td class="left">Profit (Loss) Before Taxes</td>
                <td class="right">{{ number_format($profitBeforeTax, 2) }}</td>
            </tr>

            <tr class="row-final">
                <td class="left">Net Profit (Loss)</td>
                <td class="right">{{ number_format($netProfit, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table class="summary">
        <tr>
            <td class="label">Payment Breakdown</td>
            <td class="label">Amount (TZS)</td>
            <td class="label">Share</td>
        </tr>
        @php
            $totalPay = collect($paymentBreakdown)->sum('total_amount');
        @endphp
        @foreach($paymentBreakdown as $row)
            @php $share = $totalPay > 0 ? ((float)$row->total_amount / $totalPay) * 100 : 0; @endphp
            <tr>
                <td>{{ $row->payment_method }}</td>
                <td class="value">{{ number_format((float)$row->total_amount, 2) }}</td>
                <td class="value">{{ number_format($share, 1) }}%</td>
            </tr>
        @endforeach
    </table>

    @if($printAction)
        <script>
            window.onload = function () {
                window.print();
            };
        </script>
    @endif
</body>
</html>
