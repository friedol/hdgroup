import React from 'react';
import { usePage, Link, router } from "@inertiajs/react";
import { Bell, Search, ChevronDown, Settings, Menu, ChevronRight, Building2, ShoppingCart, Heart, Package, LayoutDashboard, LogOut, ShoppingBag, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { BreadcrumbItem } from "@/types/navigation";
import { NotificationCenter } from "@/components/NotificationCenter";

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/all-products": "Inventory",
    "/pos": "Point of Sale",
    "/online-orders": "Online Orders",
    "/manufacturing/dashboard": "Production",
    "/finance": "Finance",
    "/containers": "Logistics",
    "/users": "User Management",
    "/analytics": "Reports & Analytics",
    "/settings": "Settings",
};

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
    onOpenMobile?: () => void;
}

export function AppSidebarHeader({ breadcrumbs = [], onOpenMobile }: AppSidebarHeaderProps) {
    const { url, props } = usePage();
    const { branches, activeBranchId, auth } = props as any;
    const currentTitle = pageTitles[url] || "Dashboard";

    const handleBranchChange = (value: string) => {
        router.get(`/switch-branch/${value}`, {}, {
            preserveState: false,
            preserveScroll: false
        });
    };

    return (
        <header className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 z-40 transition-shadow duration-200">
            {/* Left side: Menu toggle (Mobile) + Breadcrumbs */}
            <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
                <button
                    onClick={onOpenMobile}
                    className="p-2 -ml-1 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden transition-colors shrink-0"
                >
                    <Menu size={20} />
                </button>

                {/* POS QUICK ACCESS (LEFT) */}
                <Link 
                    href="/pos" 
                    className="p-2 -ml-1 text-amber-500 hover:bg-amber-50 rounded-lg transition-all shrink-0 group"
                    title="POS Terminal"
                >
                    <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                </Link>

                <div className="h-4 w-px bg-slate-200 mx-1 hidden lg:block" />
                
                {/* Responsive Breadcrumbs */}
                <nav className="flex items-center text-sm font-medium whitespace-nowrap overflow-hidden">
                    <Link 
                        href="/dashboard" 
                        className="text-slate-400 hover:text-slate-900 transition-colors hidden sm:block"
                    >
                        App
                    </Link>
                    <ChevronRight size={14} className="text-slate-300 mx-2 hidden sm:block" />
                    
                    {breadcrumbs.map((item, index) => (
                        <React.Fragment key={`${item.title}-${index}`}>
                            {index > 0 && <ChevronRight size={14} className="text-slate-300 mx-2" />}
                            <Link
                                href={item.href}
                                className={index === breadcrumbs.length - 1 ? "text-slate-900 font-bold" : "text-slate-400 hover:text-slate-900 font-medium"}
                            >
                                {item.title}
                            </Link>
                        </React.Fragment>
                    ))}
                    
                    {breadcrumbs.length === 0 && (
                         <span className="text-slate-900 font-bold truncate">
                            {currentTitle}
                         </span>
                    )}
                </nav>
            </div>

            {/* Right side: Search + Branch Switcher + Profile */}
            <div className="flex items-center gap-2 md:gap-4 ml-1 shrink-0">
                {/* Branch Switcher - ONLY for CEO/Superadmin */}
                {auth.canSwitchBranch && (
                    <div className="hidden lg:flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        <Select value={(activeBranchId ?? 0).toString()} onValueChange={handleBranchChange}>
                            <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200 text-xs font-semibold focus:ring-blue-500">
                                <SelectValue placeholder="Switch Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">
                                    <span className="font-semibold text-blue-600">Global</span>
                                </SelectItem>
                                {Array.isArray(branches) && branches.map((branch: any) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Search Bar - hidden on mobile */}
                <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-40 lg:w-48 transition-all hover:border-blue-400 group">
                    <Search size={14} className="text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <input
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-xs font-medium text-slate-700 placeholder:text-slate-400 w-full focus:ring-0"
                    />
                </div>

                {/* Notification Icons */}
                {/* Notification Icons & Quick Settings */}
                <div className="flex items-center">
                    {/* Quick Settings - Only for High Level Roles */}
                    {(['CEO', 'SuperAdmin', 'Admin', 'Manager', 'General Manager'].includes(auth.user?.role_name) || auth.permissions?.includes('settings.access') || auth.permissions?.includes('*')) && (
                        <Link 
                            href="/settings" 
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                            title="System Settings"
                        >
                            <Settings size={17} className="hover:rotate-45 transition-transform duration-300" />
                        </Link>
                    )}
                    <NotificationCenter />
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 outline-none">
                            <div className="hidden lg:block text-right">
                                <p className="text-[11px] font-bold text-slate-800 leading-none truncate max-w-[100px]">{auth.user?.name || "Guest"}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">{auth.user?.role_name || "Profile"}</p>
                            </div>
                            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-500/20 shrink-0">
                                {(auth.user?.name || "AD").slice(0, 2).toUpperCase()}
                            </div>
                            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-200 mt-1">
                        <div className="px-2 py-1.5 mb-2 bg-slate-50 rounded-lg">
                            <p className="text-xs font-bold text-slate-900">{auth.user?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{auth.user?.email}</p>
                        </div>

                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                            <Link href="/account" className="flex items-center gap-2 w-full">
                                <Settings className="w-4 h-4 text-slate-500" />
                                <span>Account Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                            <Link href="/my-orders" className="flex items-center gap-2 w-full">
                                <Package className="w-4 h-4 text-slate-500" />
                                <span>My Orders</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-2" />
                        
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer bg-blue-50 text-blue-900 border border-blue-100 hover:bg-blue-100 mb-1">
                            <Link href="/" className="flex items-center gap-2 w-full font-semibold">
                                <ShoppingBag className="w-4 h-4 text-blue-600" />
                                <span>View Storefront</span>
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
                                <span>Logout</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

