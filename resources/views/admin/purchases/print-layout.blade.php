@php
    $companyName    = \App\Models\Setting::getValue('business_name', 'Company Name');
    $companyEmail   = \App\Models\Setting::getValue('business_email', '');
    $companyPhone   = \App\Models\Setting::getValue('business_phone', '');
    $companyAddress = \App\Models\Setting::getValue('business_address', '');
    $logoPath       = \App\Models\Setting::getValue('system_logo');
    $companyLogo    = $logoPath ? asset('storage/' . $logoPath) : asset('images/logo.png');
    $faviconPath    = $logoPath ? asset('storage/' . $logoPath) : asset('images/favicon.ico');
    $footerText     = \App\Models\Setting::getValue('footer_text', '');
    $addressParts   = explode("\n", $companyAddress);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('page_title')</title>
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

        .footer-content {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            font-size: 9.5pt;
            line-height: 1.5;
        }

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

            .table-pro thead { display: table-row-group; }
            .table-pro tr    { page-break-inside: avoid; }

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
                @yield('preview_title')
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
                <h2>@yield('document_title')</h2>
                <div class="customer-id-header" style="font-size: 10pt; color: #666;">Generated: {{ now()->format('d M Y, H:i') }}</div>
            </div>
        </div>

        @yield('content')


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
