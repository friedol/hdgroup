import { Link, usePage } from "@inertiajs/react";
import { Bell, Search, ChevronDown, User, LogOut, Settings, Heart, Package, ShoppingBag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function AppHeader({ breadcrumbs = [] }: { breadcrumbs?: any[] }) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full transition-all duration-200">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    {/* Logo/Name */}
                    <Link href={user?.role_id === 12 ? "/" : "/dashboard"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                            <span className="text-sm font-bold tracking-tight">HD</span>
                        </div>
                        <span className="hidden text-sm font-bold tracking-tight sm:block uppercase">HD GROUP</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {!user?.role_id || user.role_id !== 12 ? (
                        <nav className="hidden items-center gap-6 md:flex">
                            <Link href="/dashboard" className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-blue-600 transition-colors">Dashboard</Link>
                            <Link href="/inventory" className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-blue-600 transition-colors">Inventory</Link>
                            <Link href="/pos" className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-blue-600 transition-colors">POS</Link>
                        </nav>
                    ) : (
                        <nav className="hidden items-center gap-6 md:flex">
                            <Link href="/" className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-blue-600 transition-colors">Home</Link>
                            <Link href="/shop/products" className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-blue-600 transition-colors">Shop</Link>
                            <Link href="/order/history" className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-blue-600 transition-colors">History</Link>
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Search bar */}
                    <div className="relative hidden lg:block">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="search"
                            placeholder="Search..."
                            className="h-8 w-64 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-8 text-xs outline-none focus:ring-2 focus:ring-blue-100 transition-all border border-transparent focus:border-blue-200"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-600">
                            <Bell className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 gap-2 px-1 hover:bg-zinc-100 focus:ring-0">
                                    <Avatar className="h-8 w-8 rounded-lg shadow-sm">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback className="rounded-lg bg-blue-600 text-[11px] font-bold text-white uppercase">
                                            {user?.name?.charAt(0) || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden flex-col items-start text-left sm:flex">
                                        <p className="text-xs font-bold leading-none text-zinc-900 dark:text-white uppercase tracking-tight">{user?.name || 'Admin'}</p>
                                        <p className="text-[10px] leading-tight text-zinc-400 mt-0.5 uppercase tracking-[0.05em] font-medium">Main Branch</p>
                                    </div>
                                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-200 mt-1">
                                <div className="px-2 py-1.5 mb-2 bg-slate-50 rounded-lg">
                                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                                </div>

                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                    <Link href="/account" className="flex items-center gap-2 w-full">
                                        <Settings className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-semibold">Account Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                    <Link href="/my-orders" className="flex items-center gap-2 w-full">
                                        <Package className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-semibold">My Orders</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-2" />
                                
                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer bg-blue-50 text-blue-900 border border-blue-100 hover:bg-blue-100 mb-1">
                                    <Link href="/" className="flex items-center gap-2 w-full font-bold">
                                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs">View Storefront</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-2" />

                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-2 w-full"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-xs font-semibold">Logout</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}
