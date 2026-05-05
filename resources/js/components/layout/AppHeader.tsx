import { usePage, Link } from "@inertiajs/react";
import { Bell, Search, ChevronDown, ShoppingCart } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory",
  "/pos": "Point of Sale",
  "/production": "Production",
  "/finance": "Finance",
  "/logistics": "Logistics",
  "/users": "User Management",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

export function AppHeader() {
  const { url } = usePage();
  const title = pageTitles[url] || "Dashboard";

  return (
    <header className="h-16 border-b border-border bg-card sticky top-0 z-10">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground leading-none">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">HD Group • Main Branch</p>
        </div>

        <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* POS Shortcut */}
        <Link 
          href="/pos" 
          className="p-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-all border border-transparent hover:border-rose-100 group"
          title="POS Terminal"
        >
          <ShoppingCart className="w-4 h-4" />
        </Link>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-secondary transition-colors">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-[11px] font-semibold text-white">
            AK
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block">Admin</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      </div>
    </header>
  );
}
