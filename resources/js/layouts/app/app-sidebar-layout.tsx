import { usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { AppSidebarHeader } from "@/components/app-sidebar-header";
import { AppSidebar } from "@/components/layout/AppSidebar";
import type { AppLayoutProps } from "@/types";

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { activeBranch } = usePage().props as any;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // Update favicon
    useEffect(() => {
        if (activeBranch?.favicon) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }

            link.href = `/storage/${activeBranch.favicon}`;
        }
    }, [activeBranch]);

    // Sidebar width based on desktop collapse state
    const sidebarW = collapsed ? 64 : 240;

    // Reset mobile state on resize to avoid hidden drawers when rotating devices
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-50 relative">
            {/* Navigation Sidebar */}
            <AppSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((c) => !c)}
                width={sidebarW}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            {/* Main Page Area */}
            <div
                className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]'}`}
            >
                {/* Header with mobile toggle */}
                <AppSidebarHeader onOpenMobile={() => setMobileOpen(true)} />

                {/* Main scrollable content */}
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
            <Toaster position="top-right" richColors closeButton />
        </div>
    );
}
