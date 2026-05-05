<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Report - {{ $branch ? strtoupper($branch->name) : 'All Branches' }}</title>
    <style>
        @page { size: A4; margin: 0.5in; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
        
        .header { width: 100%; margin-bottom: 25px; display: table; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header-left { display: table-cell; vertical-align: top; }
        .header-right { display: table-cell; vertical-align: top; text-align: right; }
        
        .logo { width: 60px; height: 60px; object-fit: contain; }
        h1 { margin: 0; font-size: 18px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
        h2 { margin: 0; font-size: 16px; font-weight: 800; color: #444; }
        
        table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-top: 10px; }
        th { background: #f4f4f4; border: 1px solid #ccc; padding: 10px 5px; text-align: left; font-size: 10px; font-weight: bold; color: #333; }
        td { border: 1px solid #ddd; padding: 8px 5px; font-size: 10px; vertical-align: middle; color: #444; }
        
        .text-right { text-align: right; }
        .text-bold { font-weight: bold; }
        .text-rose { color: #e11d48; }
        
        .summary-box { margin-top: 30px; border-top: 2px solid #333; padding-top: 15px; text-align: right; }
        .total-label { font-size: 11px; color: #666; font-weight: bold; margin-right: 15px; }
        .total-value { font-size: 18px; font-weight: 900; color: #e11d48; }

        @media print {
            .no-print { display: none; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1>{{ strtoupper($branch->name ?? 'HD Group') }}</h1>
            <p style="margin: 3px 0 0 0; font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px;">EXPENSE REPORT</p>
        </div>
        <div class="header-right">
            <h2>FINANCIAL SUMMARY</h2>
            <div style="margin-top: 5px; font-size: 10px;">
                @if(isset($filters['date_from']) && isset($filters['date_to']))
                    <span style="font-weight: bold;">PERIOD:</span> {{ \Carbon\Carbon::parse($filters['date_from'])->format('d M Y') }} - {{ \Carbon\Carbon::parse($filters['date_to'])->format('d M Y') }}
                @else
                    <span style="font-weight: bold;">DATE:</span> {{ now()->format('d M Y') }}
                @endif
            </div>
            <div style="font-size: 9px; color: #888; margin-top: 3px;">Generated: {{ now()->format('d M Y H:i') }}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%">DATE</th>
                <th style="width: 20%">CATEGORY</th>
                <th style="width: 35%">DESCRIPTION / NOTES</th>
                <th style="width: 15%">METHOD</th>
                <th style="width: 15%" class="text-right">AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expenses as $expense)
            <tr>
                <td>{{ \Carbon\Carbon::parse($expense->date)->format('d M Y') }}</td>
                <td class="text-bold">{{ strtoupper($expense->category) }}</td>
                <td>{{ $expense->description ?: '-' }}</td>
                <td>{{ $expense->payment_method }}</td>
                <td class="text-right text-bold text-rose">TZS {{ number_format($expense->amount, 0) }}</td>
            </tr>
            @endforeach
            @if(count($expenses) == 0)
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px; color: #888;">No expense records found for the selected filters.</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="summary-box">
        <span class="total-label">ACCUMULATED TOTAL:</span>
        <span class="total-value">TZS {{ number_format($total_amount, 0) }}</span>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
