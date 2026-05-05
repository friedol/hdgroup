import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
