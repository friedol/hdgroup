import type { ReactNode } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppContent({ children, className, variant = "sidebar" }: { children: ReactNode; className?: string; variant?: "sidebar" | "header" }) {
    if (variant === "header") {
        return (
            <main className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
                {children}
            </main>
        );
    }

    return (
        <SidebarInset className={cn("flex flex-1 flex-col overflow-hidden bg-background min-w-0", className)}>
            <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
                {children}
            </main>
        </SidebarInset>
    );
}
