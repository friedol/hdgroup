import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({ children, variant = "sidebar" }: { children: ReactNode; variant?: "sidebar" | "header" }) {
    if (variant === "header") {
        return <div className="flex min-h-screen w-full flex-col bg-background">{children}</div>;
    }

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-background overflow-hidden">
                {children}
            </div>
        </SidebarProvider>
    );
}
