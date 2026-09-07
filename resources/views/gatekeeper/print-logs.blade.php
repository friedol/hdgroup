<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Gatekeeper Logs Report</title>
    @if($system_favicon)
        <link rel="shortcut icon" href="{{ asset('storage/' . $system_favicon) }}" type="image/x-icon">
    @endif
    <style>
        @page { size: A4 landscape; margin: 0.45in; }
        * { font-family: Arial, Helvetica, sans-serif; }
        body { color: #222; margin: 0; font-size: 10px; }

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
        .sub { margin-top: 4px; font-size: 11px; opacity: 0.95; }

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
            font-size: 10px;
            color: #334155;
            font-weight: 700;
        }

        .section-title {
            background: #3f6ea7;
            color: #fff;
            padding: 7px 10px;
            font-size: 16px;
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
            font-size: 10px;
        }

        .report th {
            background: #4f78ad;
            color: #fff;
            font-weight: 700;
            text-align: left;
        }

        .center { text-align: center; }
        .right { text-align: right; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: 'Courier New', Courier, monospace; }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
        }
        .badge-in { background: #dcfce7; color: #166534; }
        .badge-out { background: #ffedd5; color: #9a3412; }
        .badge-verified { background: #dbeafe; color: #1e40af; }

        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 9px;
            color: #64748b;
            text-align: right;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-grid">
            <tr>
                <td style="width: 60%;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            @if($system_logo)
                                <td style="width: 70px; vertical-align: middle;">
                                    <img src="{{ asset('storage/' . $system_logo) }}" style="height: 55px; width: auto; display: block; margin-right: 15px;">
                                </td>
                            @endif
                            <td style="vertical-align: middle;">
                                <div class="title-left">{{ $companyName }}</div>
                                <div class="sub">Address: {{ $companyAddress ?: 'N/A' }} | Branch: {{ $branchName }}</div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width: 40%;">
                    <div class="title-right">Gatekeeper Movement Report</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="meta">
        <tr>
            <th>Date Generated</th>
            <th>Active Branch</th>
            <th>Report Scope</th>
            <th>Total Records</th>
        </tr>
        <tr>
            <td>{{ now()->format('d M, Y H:i') }}</td>
            <td>{{ $branchName }}</td>
            <td>
                @if(array_filter($filters))
                    Filtered Analysis
                @else
                    Complete History
                @endif
            </td>
            <td class="font-bold">{{ count($logs) }}</td>
        </tr>
    </table>

    @if(array_filter($filters))
    <div style="margin-bottom: 10px; font-size: 9px; color: #64748b;">
        <strong>Applied Filters:</strong>
        @foreach($filters as $key => $value)
            @if($value)
                <span style="margin-right: 10px;">{{ ucfirst(str_replace('_', ' ', $key)) }}: <strong>{{ $value }}</strong></span>
            @endif
        @endforeach
    </div>
    @endif

    <div class="section-title">Product Movement Logs</div>
    <table class="report">
        <thead>
            <tr>
                <th style="width: 5%">Type</th>
                <th style="width: 20%">Product / Category</th>
                <th style="width: 10%">Quantity</th>
                <th style="width: 15%">Handler Details</th>
                <th style="width: 15%">Source / Destination</th>
                <th style="width: 10%">Reference</th>
                <th style="width: 8%">Status</th>
                <th style="width: 17%">Recorded At</th>
            </tr>
        </thead>
        <tbody>
            @forelse($logs as $log)
                <tr>
                    <td class="center">
                        <span class="badge {{ $log->type === 'IN' ? 'badge-in' : 'badge-out' }}">
                            {{ $log->type }}
                        </span>
                    </td>
                    <td>
                        <div class="font-bold text-slate-900">{{ $log->product_name }}</div>
                        <div style="font-size: 8px; color: #64748b; text-transform: uppercase;">{{ $log->item_type === 'raw_material' ? 'Raw Material' : 'Finished Product' }}</div>
                    </td>
                    <td class="font-bold">
                        {{ number_format($log->quantity, 2) }} {{ $log->unit }}
                    </td>
                    <td>
                        <div class="font-bold">{{ $log->handler_name }}</div>
                        <div style="font-size: 8px; color: #64748b;">{{ $log->handler_type }}</div>
                    </td>
                    <td>
                        {{ $log->type === 'IN' ? ($log->source ?: 'External') : ($log->destination ?: 'Customer') }}
                    </td>
                    <td class="font-mono center">
                        {{ $log->reference_number ?: '-' }}
                    </td>
                    <td class="center">
                        <span class="badge badge-verified">{{ $log->status }}</span>
                    </td>
                    <td class="center">
                        {{ $log->recorded_at->format('d M Y, H:i') }}
                        <div style="font-size: 8px; color: #64748b;">by {{ $log->recorded_by_name }}</div>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="center" style="padding: 30px; color: #64748b;">
                        No product movement records found for the selected criteria.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated by the Mizzonite Group Gatekeeper System.</p>
        <p>Verified by: ___________________________ Date: _________________</p>
    </div>

    @if(request()->get('action') !== 'pdf')
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
    @endif
</body>
</html>
