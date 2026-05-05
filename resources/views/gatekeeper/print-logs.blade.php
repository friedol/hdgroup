<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gatekeeper Logs - Print</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
        }
        .container {
            max-width: 210mm;
            padding: 10mm;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 10px;
            color: #666;
        }
        .filters {
            background: #f5f5f5;
            padding: 8px;
            margin-bottom: 15px;
            border-radius: 3px;
            font-size: 9px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background: #333;
            color: white;
            padding: 6px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #333;
        }
        td {
            padding: 5px;
            border: 1px solid #ddd;
            font-size: 10px;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .in {
            background: #d4edda;
            color: #155724;
            font-weight: bold;
        }
        .out {
            background: #fff3cd;
            color: #856404;
            font-weight: bold;
        }
        .footer {
            text-align: right;
            font-size: 9px;
            color: #666;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .container {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Gatekeeper Logs Report</h1>
            <p>HD GROUP - Product Movement Tracking</p>
            <p>Generated on {{ now()->format('d M Y H:i:s') }}</p>
        </div>

        @if(array_filter($filters))
        <div class="filters">
            <strong>Filters Applied:</strong>
            @if($filters['search'] ?? false)
                Search: <strong>{{ $filters['search'] }}</strong> |
            @endif
            @if($filters['type'] ?? false)
                Type: <strong>{{ $filters['type'] }}</strong> |
            @endif
            @if($filters['status'] ?? false)
                Status: <strong>{{ $filters['status'] }}</strong> |
            @endif
            @if($filters['start_date'] ?? false)
                From: <strong>{{ $filters['start_date'] }}</strong> -
                To: <strong>{{ $filters['end_date'] ?? 'Today' }}</strong>
            @endif
        </div>
        @endif

        <table>
            <thead>
                <tr>
                    <th style="width: 5%">Type</th>
                    <th style="width: 15%">Product</th>
                    <th style="width: 8%">Qty</th>
                    <th style="width: 15%">Handler</th>
                    <th style="width: 15%">From/To</th>
                    <th style="width: 10%">Ref #</th>
                    <th style="width: 8%">Status</th>
                    <th style="width: 15%">Date & Time</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                <tr>
                    <td class="{{ strtolower($log->type) }}">
                        {{ $log->type === 'IN' ? '→ IN' : '← OUT' }}
                    </td>
                    <td>{{ $log->product_name }}</td>
                    <td style="text-align: right;">{{ number_format($log->quantity, 2) }} {{ $log->unit }}</td>
                    <td>{{ $log->handler_name }} ({{ $log->handler_type }})</td>
                    <td>{{ $log->type === 'IN' ? $log->source : $log->destination }}</td>
                    <td style="text-align: center;">{{ $log->reference_number ?? '-' }}</td>
                    <td style="text-align: center;">{{ ucfirst($log->status) }}</td>
                    <td style="text-align: center;">{{ $log->recorded_at->format('d/m/Y H:i') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px;">No logs found</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <div class="footer">
            <p><strong>Total Records:</strong> {{ count($logs) }}</p>
            <p>This document is automatically generated. No signature required.</p>
            <p>For official records, ensure proper authorization and archival.</p>
        </div>
    </div>

    <script>
        window.print();
    </script>
</body>
</html>
