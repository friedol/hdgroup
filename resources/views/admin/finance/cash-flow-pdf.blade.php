<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Cash Flow Ledger - {{ $branch ? $branch->name : 'Global' }}</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #333; line-height: 1.4; margin: 0; padding: 20px; }
        .header { display: table; width: 100%; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header-left { display: table-cell; width: 60%; vertical-align: bottom; }
        .header-right { display: table-cell; width: 40%; vertical-align: bottom; text-align: right; }
        .header-left h1 { margin: 0; font-size: 18px; font-weight: bold; color: #111; }
        .header-right h2 { margin: 0; font-size: 18px; font-weight: 900; color: #333; text-transform: uppercase; }
        .header-right p { margin: 3px 0 0 0; color: #666; font-size: 9px; }

        .logo { max-height: 60px; display: block; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f8f9fa; border: 1px solid #eee; padding: 8px; text-align: left; font-size: 9px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        td { border: 1px solid #eee; padding: 8px; font-size: 10px; vertical-align: middle; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-green { color: #059669; }
        .text-red { color: #dc2626; }
        .flow-pill { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold; text-transform: uppercase; }
        .flow-in { background: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
        .flow-out { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <table style="width: 100%; border: none; margin-bottom: 0;">
                <tr>
                    @if($logo)
                        <td style="width: 70px; border: none; padding: 0;">
                            <img src="data:{{ $logoMime }};base64,{{ $logo }}" class="logo">
                        </td>
                    @endif
                    <td style="border: none; padding: 0 0 0 10px; vertical-align: middle;">
                        <h1>{{ $branch ? $branch->name : 'Global View' }}</h1>
                        <p style="margin: 3px 0 0 0; color: #666; font-size: 10px;">Cash Flow Ledger</p>
                    </td>
                </tr>
            </table>
        </div>
        <div class="header-right">
            <h2>CASH FLOW REPORT</h2>
            <p>Period: {{ $period === 'custom' ? ($startDate . ' to ' . $endDate) : ucfirst($period) }}</p>
            <p>Generated: {{ now()->format('d M Y H:i') }}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%">Date & Time</th>
                <th style="width: 8%; text-align: center;">Flow</th>
                <th style="width: 20%">Source / Entity</th>
                <th style="width: 25%">Details</th>
                <th style="width: 12%; text-align: center;">Method</th>
                <th style="width: 10%; text-align: right;">Amount</th>
                <th style="width: 10%; text-align: center;">Ref</th>
            </tr>
        </thead>
        <tbody>
            @foreach($entries as $item)
                <tr>
                    <td>
                        <div class="font-bold">{{ \Carbon\Carbon::parse($item['date'])->format('d M Y') }}</div>
                        <div style="font-size: 8px; color: #888;">{{ \Carbon\Carbon::parse($item['date'])->format('h:i A') }}</div>
                    </td>
                    <td style="text-align: center;">
                        <span class="flow-pill {{ $item['flow'] === 'IN' ? 'flow-in' : 'flow-out' }}">
                            {{ $item['flow'] }}
                        </span>
                    </td>
                    <td>
                        <div class="font-bold">{{ $item['source'] }}</div>
                        <div style="font-size: 8px; color: #888;">{{ $item['phone'] }}</div>
                    </td>
                    <td>{{ $item['details'] }}</td>
                    <td style="text-align: center;">
                        <span style="font-size: 8px; font-weight: bold; color: #666; background: #f3f4f6; padding: 2px 4px; border-radius: 4px;">
                            {{ $item['method'] }}
                        </span>
                    </td>
                    <td class="text-right font-bold {{ $item['flow'] === 'IN' ? 'text-green' : 'text-red' }}">
                        {{ $item['flow'] === 'IN' ? '+' : '-' }} {{ number_format($item['amount'], 0) }}
                    </td>
                    <td style="text-align: center; color: #888;">{{ $item['ref'] ?: '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="text-align: center; font-size: 9px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px;">
        End of Report • Total Records: {{ $summary['count'] }}
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
