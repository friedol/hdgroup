import { usePage, Link } from "@inertiajs/react";
import { Bell, Search, ChevronDown, ShoppingCart, Sun, Moon, Monitor } from "lucide-react";
import { useAppearance } from "@/hooks/use-appearance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory",
  "/pos": "Point of Sale",
  "/finance": "Finance",
  "/logistics": "Logistics",
  "/users": "User Management",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

export function AppHeader() {
  const { url } = usePage();
  const title = pageTitles[url] || "Dashboard";
  const { appearance, resolvedAppearance, updateAppearance } = useAppearance();

  return (
    <header className="h-16 border-b border-border bg-card sticky top-0 z-10">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground leading-none">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Jopo Juniours Co. Ltd • Main Branch</p>
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

        {/* Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Switch Theme">
              {resolvedAppearance === 'dark' ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 p-1.5 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 mt-1">
            <div className="px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Theme
            </div>
            <DropdownMenuItem
              className={`rounded-lg cursor-pointer text-xs font-medium gap-2 ${appearance === 'light' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
              onClick={() => updateAppearance('light')}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Light</span>
              {appearance === 'light' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`rounded-lg cursor-pointer text-xs font-medium gap-2 ${appearance === 'dark' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
              onClick={() => updateAppearance('dark')}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Dark</span>
              {appearance === 'dark' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`rounded-lg cursor-pointer text-xs font-medium gap-2 ${appearance === 'system' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
              onClick={() => updateAppearance('system')}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>System</span>
              {appearance === 'system' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
