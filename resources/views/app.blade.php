<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="light">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    @php
        // Get system settings
        $systemFavicon = \App\Models\Setting::getValue('system_favicon');
        $systemLogo = \App\Models\Setting::getValue('system_logo');
        
        // Fallback to branch favicon if system favicon not set
        $activeBranchId = session('active_branch_id') ?: (auth()->user()?->branch_id ?: 1);
        $activeBranch = \App\Models\Branch::find($activeBranchId);
        $branchFavicon = $activeBranch?->favicon 
            ? "/storage/" . $activeBranch->favicon 
            : ($activeBranch?->logo ? "/storage/" . $activeBranch->logo : "/favicon.ico");
        
        // Use system favicon if available, otherwise use branch favicon
        $faviconPath = $systemFavicon ? "/storage/" . $systemFavicon : $branchFavicon;
    @endphp
    <link rel="icon" href="{{ $faviconPath }}" sizes="any">
    <link rel="apple-touch-icon" href="{{ $faviconPath }}">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>