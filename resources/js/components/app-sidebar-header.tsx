import React from 'react';
import { usePage, Link, router } from "@inertiajs/react";
import { Bell, Search, ChevronDown, Settings, Menu, ChevronRight, Building2, ShoppingCart, Heart, Package, LayoutDashboard, LogOut, ShoppingBag, User, Languages, Sun, Moon, Monitor } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@/hooks/use-appearance';
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

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'sw', label: 'Kiswahili', flag: '🇹ℤ' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function AppSidebarHeader({ breadcrumbs = [], onOpenMobile }: AppSidebarHeaderProps) {
    const { url, props } = usePage();
    const { branches, activeBranchId, auth } = props as any;
    const currentTitle = pageTitles[url] || "Dashboard";
    const { t, i18n } = useTranslation();
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
    };

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

    const handleBranchChange = (value: string) => {
        router.get(`/switch-branch/${value}`, {}, {
            preserveState: false,
            preserveScroll: false
        });
    };

    return (
        <header className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 z-40 transition-shadow duration-200">
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
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:block"
                    >
                        App
                    </Link>
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 mx-2 hidden sm:block" />
                    
                    {breadcrumbs.map((item, index) => (
                        <React.Fragment key={`${item.title}-${index}`}>
                            {index > 0 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 mx-2" />}
                            <Link
                                href={item.href}
                                className={index === breadcrumbs.length - 1 ? "text-slate-900 dark:text-white font-bold" : "text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"}
                            >
                                {item.title}
                            </Link>
                        </React.Fragment>
                    ))}
                    
                    {breadcrumbs.length === 0 && (
                         <span className="text-slate-900 dark:text-white font-bold truncate">
                            {currentTitle}
                         </span>
                    )}
                </nav>
            </div>

            {/* Right side: Search + Branch Switcher + Theme Switcher + Profile */}
            <div className="flex items-center gap-2 md:gap-4 ml-1 shrink-0">
                {/* Branch Switcher - ONLY for CEO/Superadmin */}
                {auth.canSwitchBranch && Array.isArray(branches) && branches.length > 0 && (
                    <>
                        {/* Mobile: compact icon dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex lg:hidden items-center gap-1 p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
                                    title={t('common.switchBranch')}
                                >
                                    <Building2 size={16} />
                                    <ChevronDown size={12} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl shadow-xl border-slate-200 mt-1">
                                <div className="px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t('common.switchBranch')}
                                </div>
                                {branches.map((branch: any) => (
                                    <DropdownMenuItem
                                        key={branch.id}
                                        className={`rounded-lg cursor-pointer text-xs font-medium ${activeBranchId === branch.id ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
                                        onClick={() => handleBranchChange(branch.id.toString())}
                                    >
                                        {activeBranchId === branch.id && <span className="mr-1.5">✓</span>}
                                        {branch.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Desktop: full select */}
                        <div className="hidden lg:flex items-center gap-2">
                            <Building2 size={16} className="text-slate-400" />
                            <Select
                                value={(activeBranchId ?? branches[0]?.id ?? '').toString()}
                                onValueChange={handleBranchChange}
                            >
                                <SelectTrigger className="w-[180px] h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-blue-500">
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch: any) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                {/* Theme Switcher */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold shrink-0"
                            title="Switch Theme"
                        >
                            {resolvedAppearance === 'dark' ? (
                                <Moon size={16} className="text-amber-400" />
                            ) : (
                                <Sun size={16} className="text-amber-500" />
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
                            <Sun size={14} />
                            <span>Light</span>
                            {appearance === 'light' && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className={`rounded-lg cursor-pointer text-xs font-medium gap-2 ${appearance === 'dark' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
                            onClick={() => updateAppearance('dark')}
                        >
                            <Moon size={14} />
                            <span>Dark</span>
                            {appearance === 'dark' && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className={`rounded-lg cursor-pointer text-xs font-medium gap-2 ${appearance === 'system' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
                            onClick={() => updateAppearance('system')}
                        >
                            <Monitor size={14} />
                            <span>System</span>
                            {appearance === 'system' && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Language Switcher */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold shrink-0"
                            title={t('language.label')}
                        >
                            <Languages size={14} />
                            <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
                            <span className="sm:hidden">{currentLang.flag}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 mt-1">
                        <div className="px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {t('language.label')}
                        </div>
                        {LANGUAGES.map(lang => (
                            <DropdownMenuItem
                                key={lang.code}
                                className={`rounded-lg cursor-pointer text-xs font-medium gap-2 ${i18n.language === lang.code ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
                                onClick={() => handleLanguageChange(lang.code)}
                            >
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                                {i18n.language === lang.code && <span className="ml-auto">✓</span>}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

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
                            <div className="hidden lg:flex flex-col justify-center text-right">
                                <p className="text-[11px] font-bold text-slate-800 leading-none truncate max-w-[100px]">{auth.user?.name || "Guest"}</p>
                            </div>
                            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-500/20 shrink-0 overflow-hidden">
                                {auth.user?.profile ? (
                                    <img 
                                        src={auth.user.profile.startsWith('http') ? auth.user.profile : `/storage/${auth.user.profile}`} 
                                        alt={auth.user?.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    (auth.user?.name || "AD").slice(0, 2).toUpperCase()
                                )}
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
                                <span>{t('common.accountSettings')}</span>
                            </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                            <Link href="/my-orders" className="flex items-center gap-2 w-full">
                                <Package className="w-4 h-4 text-slate-500" />
                                <span>{t('common.myOrders')}</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-2" />
                        
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer bg-blue-50 text-blue-900 border border-blue-100 hover:bg-blue-100 mb-1">
                            <Link href="/" className="flex items-center gap-2 w-full font-semibold">
                                <ShoppingBag className="w-4 h-4 text-blue-600" />
                                <span>{t('common.viewStorefront')}</span>
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
                                <span>{t('common.logout')}</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

