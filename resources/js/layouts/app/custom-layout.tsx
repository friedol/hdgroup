import { Link, usePage, router } from '@inertiajs/react';
import { ShoppingCart, User, Menu, X, Search, LogOut, ChevronDown, MapPin, Check, Heart, Package, Settings, LayoutDashboard, LayoutGrid, ShoppingBag, ClipboardList, LogIn, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
    children: ReactNode;
}

export default function CustomLayout({ children }: Props) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState<'menu' | 'categories'>('menu');
    const [isBranchOpen, setIsBranchOpen] = useState(false);
    const branchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchDropdownRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { props, url: currentUrl } = usePage() as any;
    const auth = props.auth as any;
    const branches: any[] = props.branches || [];
    const activeBranch = props.activeBranch as any;

    // Close branch dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
                setIsBranchOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when drawer opens if requested
    useEffect(() => {
        if (isMobileMenuOpen && searchInputRef.current && activeMobileTab === 'menu') {
            // Small delay to allow drawer animation to start
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isMobileMenuOpen, activeMobileTab]);

    // Live search results
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/product/find?search=${searchQuery}`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                setSearchResults(data);
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Close search dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
                setSearchResults([]);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search when opened
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const resolveLogo = (logo?: string) => {
        if (!logo) return null;
        if (logo.startsWith('http')) return logo;
        return `/storage/${logo}`;
    };

    const resolveProfile = (profile?: string) => {
        if (!profile) return null;
        if (profile.startsWith('http') || profile.startsWith('/')) return profile;
        return `/storage/${profile}`;
    };

    const businessWhatsapp = props.businessWhatsapp || props.businessPhone || activeBranch?.phone || '';
    const whatsappDigits = String(businessWhatsapp).replace(/[^\d]/g, '');
    const whatsappLink = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '#';
    const businessPhone = props.businessPhone || activeBranch?.phone || businessWhatsapp || '+255 717 489 868';
    const businessEmail = props.businessEmail || 'info@hdpackaging.co.tz';
    const businessAddress = props.businessAddress || props.activeBranch?.location || 'Dar es Salaam, Tanzania';

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <nav className="bg-white border-b sticky top-0 z-50">
                <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8">
                    <div className="flex items-center justify-between h-12 md:h-16">
                        {/* Logo / Search Bar Transition */}
                        <div className="flex-1 flex items-center gap-4">
                            {!isSearchOpen ? (
                                <Link href="/" className="flex items-center gap-1.5 md:gap-2 text-slate-900 hover:text-blue-700 transition-all shrink-0">
                                    <div className="w-8 h-8 md:w-10 md:h-10 border border-slate-100 rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden shadow-sm bg-white">
                                        {activeBranch?.logo ? (
                                            <img src={`/storage/${activeBranch.logo}`} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-blue-600 font-black text-[10px] md:text-xs uppercase">HD</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="font-bold text-xs md:text-sm tracking-tight leading-none uppercase">
                                            {props.activeBranch?.id ? props.activeBranch.name : props.businessName}
                                        </span>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex-1 max-w-2xl relative animate-in slide-in-from-left-2 fade-in duration-300">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-700 transition-colors" />
                                        <input
                                            ref={searchInputRef}
                                            type="search"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Live product search..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-10 text-sm font-medium focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && searchQuery) {
                                                    setIsSearchOpen(false);
                                                    router.get(`/product/find?search=${searchQuery}`);
                                                }
                                                if (e.key === 'Escape') {
                                                    setIsSearchOpen(false);
                                                    setSearchQuery('');
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={() => {
                                                setIsSearchOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div ref={searchDropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                                            <div className="p-2 max-h-[350px] overflow-y-auto">
                                                {searchResults.map((product) => (
                                                    <Link
                                                        key={product.id}
                                                        href={`/product/find?search=${product.product_name}`}
                                                        onClick={() => {
                                                            setIsSearchOpen(false);
                                                            setSearchResults([]);
                                                        }}
                                                        className="flex items-center gap-2 md:gap-3 p-2 md:p-3 hover:bg-slate-50 rounded-lg transition-all group"
                                                    >
                                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 shrink-0">
                                                            {product.product_management?.images?.[0]?.image_url ? (
                                                                <img src={product.product_management.images[0].image_url} className="w-full h-full object-cover" alt={product.product_name} />
                                                            ) : product.product_management?.image_url ? (
                                                                <img src={product.product_management.image_url} className="w-full h-full object-cover" alt={product.product_name} />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                                                                    <Package className="w-4 h-4 text-slate-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] md:text-sm font-bold text-slate-900 truncate group-hover:text-blue-700">
                                                                {product.product_name}
                                                            </p>
                                                            <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-tight truncate">
                                                                {product.product_management?.category?.category_name || 'General Product'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs md:text-sm font-black text-slate-900">
                                                                {new Intl.NumberFormat('en-US').format(parseInt(product.unit_price || product.product_price || 0))} <span className="text-[9px] md:text-[10px]">TZS</span>
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                            <div className="bg-slate-50 px-3 py-2 border-t flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-slate-400 italic">Press Enter for all</span>
                                                <Link href={`/product/find?search=${searchQuery}`} className="font-black text-blue-700 hover:text-blue-800">View All</Link>
                                            </div>
                                        </div>
                                    )}
                                    {isSearching && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border p-4 text-center">
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent mr-2"></div>
                                            <span className="text-xs font-bold text-slate-500 italic">Searching items...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Desktop Navigation */}
                        {!isSearchOpen && (
                            <div className="hidden md:flex items-center gap-8 mr-8">
                                <Link href="/shop/products" className="text-gray-700 hover:text-blue-700 font-semibold text-[15px] transition-colors">
                                    Products
                                </Link>
                                <Link href="/shop/categories" className="text-gray-700 hover:text-blue-700 font-semibold text-[15px] transition-colors">
                                    Categories
                                </Link>
                                <Link href="/about" className="text-gray-700 hover:text-blue-700 font-semibold text-[15px] transition-colors">
                                    About
                                </Link>
                                <Link href="/contact" className="text-gray-700 hover:text-blue-700 font-semibold text-[15px] transition-colors">
                                    Contact
                                </Link>
                            </div>
                        )}

                        {/* Right Section */}
                        <div className="flex items-center gap-3">

                             {/* Branch Switcher */}
                            {branches.length > 0 && (
                                <div className="relative" ref={branchRef}>
                                    <button
                                        onClick={() => setIsBranchOpen(!isBranchOpen)}
                                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold text-slate-700 shadow-sm"
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span className="hidden sm:block max-w-[90px] lg:max-w-[100px] truncate text-[13px]">
                                            {activeBranch?.name || 'Branch'}
                                        </span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isBranchOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Panel */}
                                    {isBranchOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden z-50">
                                            <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Switch Branch</p>
                                            </div>
                                            <div className="py-2 max-h-80 overflow-y-auto">
                                                {/* Global Option */}
                                                <a
                                                    href="/?branch=global"
                                                    onClick={() => setIsBranchOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors ${!props.activeBranch?.id ? 'bg-blue-50' : ''}`}
                                                >
                                                    <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                                                        <LayoutGrid className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${!activeBranch?.id ? 'text-blue-800' : 'text-slate-800'}`}>Global Identity</p>
                                                        <p className="text-[11px] text-slate-400 truncate">All Branches</p>
                                                    </div>
                                                    {!activeBranch?.id && (
                                                        <Check className="w-4 h-4 text-blue-700 shrink-0" />
                                                    )}
                                                </a>

                                                <div className="my-1 border-t border-slate-100" />

                                                {branches.map((branch) => {
                                                    const isActive = activeBranch?.id === branch.id;
                                                    const logoUrl = resolveLogo(branch.logo);
                                                    return (
                                                        <a
                                                            key={branch.id}
                                                            href={`/?branch=${branch.slug}`}
                                                            onClick={() => setIsBranchOpen(false)}
                                                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors ${isActive ? 'bg-blue-50' : ''}`}
                                                        >
                                                            <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                                                                {logoUrl ? (
                                                                    <img src={logoUrl} alt={branch.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase">{branch.name?.slice(0, 2)}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-800' : 'text-slate-800'}`}>{branch.name}</p>
                                                                {branch.location && (
                                                                    <p className="text-[11px] text-slate-400 truncate">{branch.location}</p>
                                                                )}
                                                            </div>
                                                            {isActive && (
                                                                <Check className="w-4 h-4 text-blue-700 shrink-0" />
                                                            )}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Search */}
                            {!isSearchOpen && (
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                                </button>
                            )}

                             {/* Cart */}
                            <Link href="/cart" className="relative p-1.5 md:p-2 hover:bg-slate-100 rounded-lg group transition-colors">
                                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-slate-600 group-hover:text-blue-700 transition-colors" />
                                {props.cartCount > 0 && (
                                    <span className="absolute top-0 right-0 md:-top-1 md:-right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[11px] font-bold text-white shadow-lg shadow-red-500/30 ring-1 md:ring-2 ring-white zoom-in-0 duration-300">
                                        {props.cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* Auth Menu */}
                            {auth?.user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 p-1.5 md:px-3 md:py-1.5 md:border md:border-slate-200 md:rounded-xl hover:bg-slate-50 transition-all outline-none">
                                            <div className="w-7 h-7 md:w-5 md:h-5 rounded-full bg-slate-900 md:bg-transparent flex items-center justify-center overflow-hidden border border-slate-200/60">
                                                {resolveProfile(auth?.user?.profile) ? (
                                                    <img src={resolveProfile(auth?.user?.profile) || ''} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-white md:text-slate-600" />
                                                )}
                                            </div>
                                            <span className="hidden sm:inline text-xs md:text-sm font-semibold">{auth?.user?.name || 'Account'}</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-200">
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                            <Link href="/profile/show" className="flex items-center gap-2 w-full">
                                                <Settings className="w-4 h-4 text-slate-500" />
                                                <span>Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                            <Link href="/my-orders" className="flex items-center gap-2 w-full">
                                                <Package className="w-4 h-4 text-slate-500" />
                                                <span>My Orders</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-2" />
                                        {auth.user.is_global || auth.user.role?.name === 'Admin' ? (
                                            <>
                                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer bg-blue-50 text-blue-900 border border-blue-100 hover:bg-blue-100 mb-1">
                                                    <Link href="/admin" className="flex items-center gap-2 w-full font-semibold">
                                                        <LayoutDashboard className="w-4 h-4 text-blue-700" />
                                                        <span>Dashboard</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-2" />
                                            </>
                                        ) : null}
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
                            ) : (
                                <Link href="/login" className="flex items-center gap-2 p-1.5 md:px-3 md:py-1.5 md:border md:border-slate-200 md:rounded-xl hover:bg-slate-50 transition-all">
                                    <LogIn className="w-4 h-4 text-slate-600" />
                                    <span className="hidden sm:inline text-xs md:text-sm font-semibold">Sign In</span>
                                </Link>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-1.5 hover:bg-slate-50 rounded-lg"
                            >
                                <Menu className="w-5 h-5 text-slate-900" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer/Sidebar */}
            <div 
                className={`fixed inset-0 z-[60] lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                
                {/* Drawer Panel */}
                <div 
                    className={`absolute left-0 top-0 bottom-0 w-[72%] max-w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex flex-col h-full">
                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* User Profile Header - Now at TOP */}
                            <div className="px-6 py-6 border-b relative overflow-hidden group bg-white">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/10 transition-all"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                                            {auth?.user?.name ? (
                                                <div className="text-blue-700 font-bold text-lg uppercase">{auth.user.name.slice(0, 1)}</div>
                                            ) : (
                                                <User className="w-6 h-6 text-blue-700" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-base font-bold tracking-tight text-slate-900">
                                                {auth?.user?.name || (auth?.user ? "Authenticated User" : "Guest User")}
                                            </h3>
                                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                {auth?.user ? (auth.user.is_customer ? "Premium Client" : "Staff Member") : "Welcome to Hd Group"}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs - Now BELOW profile */}
                            <div className="flex border-b bg-slate-50/50">
                                <button
                                    onClick={() => setActiveMobileTab('menu')}
                                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeMobileTab === 'menu' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Menu
                                    {activeMobileTab === 'menu' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700" />}
                                </button>
                                <button
                                    onClick={() => setActiveMobileTab('categories')}
                                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeMobileTab === 'categories' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Categories
                                    {activeMobileTab === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700" />}
                                </button>
                            </div>



                            {activeMobileTab === 'menu' ? (
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1">

                                        <Link href="/shop/products" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all group" onClick={() => setIsMobileMenuOpen(false)}>
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <ShoppingBag className="w-4 h-4 text-blue-500" />
                                            </div>
                                            Products
                                        </Link>
                                        <Link href="/shop/categories" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all group" onClick={() => setIsMobileMenuOpen(false)}>
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                                <LayoutGrid className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            Categories
                                        </Link>
                                        <Link href="/cart" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all group" onClick={() => setIsMobileMenuOpen(false)}>
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <ShoppingCart className="w-4 h-4 text-blue-700" />
                                            </div>
                                          Shopping Cart
                                        </Link>
                                        <Link
                                            href={auth?.user ? '/my-orders' : '/order/track'}
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all group"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                                <ClipboardList className="w-4 h-4 text-purple-500" />
                                            </div>
                                            {auth?.user ? 'My Orders' : 'Track Order'}
                                        </Link>
                                    </div>

                                    <div className="space-y-1">

                                        <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all group" onClick={() => setIsMobileMenuOpen(false)}>
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            About Us
                                        </Link>
                                        <Link href="/contact" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all group" onClick={() => setIsMobileMenuOpen(false)}>
                                            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4 text-cyan-500" />
                                            </div>
                                            Our Support
                                        </Link>
                                    </div>

                                    {!auth?.user ? (
                                        <div className="pt-6 border-t mt-6 grid grid-cols-2 gap-3">
                                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs transition-transform active:scale-95 shadow-lg shadow-slate-200">
                                                <LogIn className="w-3.5 h-3.5" />
                                                Log In
                                            </Link>
                                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs transition-transform active:scale-95 shadow-lg shadow-blue-100">
                                                <User className="w-3.5 h-3.5" />
                                                Sign Up
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="pt-6 border-t mt-6 space-y-1">

                                            <Link href="/profile/show" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all group" onClick={() => setIsMobileMenuOpen(false)}>
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                    <Settings className="w-4 h-4 text-slate-500" />
                                                </div>
                                              Profile
                                            </Link>
                                            <Link href="/logout" method="post" as="button" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all w-full text-left" onClick={() => setIsMobileMenuOpen(false)}>
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                                    <LogOut className="w-4 h-4 text-red-500" />
                                                </div>
                                                Logout
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4">

                                     <div className="space-y-1">
                                        {(props.categories || []).map((cat: any) => (
                                            <Link 
                                                key={cat.id}
                                                href={`/category/${cat.id}`}
                                                className="flex items-center justify-between px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-xl transition-all group"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <span className="capitalize">{cat.category_name.toLowerCase()}</span>
                                                <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-blue-700" />
                                            </Link>
                                        ))}

                                        {(!props.categories || props.categories.length === 0) && (
                                            <div className="text-center py-10">
                                                <p className="text-sm text-slate-400 italic">No categories available</p>
                                            </div>
                                        )}
                                     </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className={`flex-1 ${auth?.user ? 'pb-24 md:pb-0' : ''}`}>
                {children}
            </main>

            {/* Floating Bottom Navigation - visible on mobile only when logged in */}
            {auth?.user && (
                <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-100 px-1 py-1.5">
                        <div className="flex items-center justify-around">

                            {/* Home */}
                            <Link
                                href="/shop"
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                                    currentUrl === '/shop' || currentUrl === '/' ? 'text-blue-700' : 'text-slate-500'
                                }`}
                            >
                                <Home className="w-5 h-5" />
                                <span className="text-[10px] font-bold">Home</span>
                            </Link>

                            {/* Products */}
                            <Link
                                href="/shop/products"
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                                    currentUrl?.startsWith('/shop/products') ? 'text-blue-700' : 'text-slate-500'
                                }`}
                            >
                                <ShoppingBag className="w-5 h-5" />
                                <span className="text-[10px] font-bold">Products</span>
                            </Link>

                            {/* Cart */}
                            <Link
                                href="/cart"
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                                    currentUrl === '/cart' || currentUrl === '/my-carts' ? 'text-blue-700' : 'text-slate-500'
                                }`}
                            >
                                <div className="relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {props.cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow-lg ring-1 ring-white">
                                            {props.cartCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold">Cart</span>
                            </Link>

                            {/* Orders */}
                            <Link
                                href="/my-orders"
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                                    currentUrl?.startsWith('/my-orders') ? 'text-blue-700' : 'text-slate-500'
                                }`}
                            >
                                <ClipboardList className="w-5 h-5" />
                                <span className="text-[10px] font-bold">Orders</span>
                            </Link>

                            {/* Profile */}
                            <Link
                                href="/profile/show"
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                                    currentUrl?.startsWith('/profile') ? 'text-blue-700' : 'text-slate-500'
                                }`}
                            >
                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-slate-200 flex items-center justify-center">
                                    {resolveProfile(auth?.user?.profile) ? (
                                        <img src={resolveProfile(auth?.user?.profile) || ''} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold">Profile</span>
                            </Link>

                        </div>
                    </div>
                </nav>
            )}

            {/* Footer - hidden on mobile when logged in */}
            <footer className={`bg-gray-900 text-gray-300 border-t border-gray-800 ${auth?.user ? 'hidden md:block' : ''}`}>

                {/* Newsletter Strip */}
                <div className="bg-blue-600">
                    <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-dancing font-bold text-slate-900 tracking-wider">Stay in the loop</p>
                            <p className="text-slate-700 text-sm font-medium">Get the latest deals and updates delivered to your inbox.</p>
                        </div>
                        <form
                            className="flex w-full sm:w-auto gap-2"
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="flex-1 sm:w-64 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-900 bg-white border-0 outline-none focus:ring-2 focus:ring-slate-900/20 placeholder-slate-400"
                            />
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Main Footer Grid */}
                <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8 py-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-10">

                        {/* Col 1 — Brand */}
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                {props.activeBranch?.logo ? (
                                    <img src={`/storage/${props.activeBranch.logo}`} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-gray-700" />
                                ) : props.systemLogo ? (
                                    <img src={props.systemLogo} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-gray-700" />
                                ) : (
                                    <div className="h-10 w-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] font-black text-white">HD</div>
                                )}
                                <div>
                                    <h3 className="font-black text-white uppercase text-[11px] tracking-widest leading-tight">{props.activeBranch?.system_name || 'Jopo Juniours Co. Ltd'}</h3>
                                    <p className="text-[10px] text-blue-600 font-semibold">Online Store</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-5">
                                Your trusted source for quality products, fast delivery, and dependable customer support across Tanzania.
                            </p>

                            {/* Social Icons */}
                            <div className="flex items-center gap-3">
                                {/* Facebook */}
                                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors group">
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                    </svg>
                                </a>
                                {/* Instagram */}
                                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors group">
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                                    </svg>
                                </a>
                                {/* WhatsApp */}
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-colors group">
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L.057 23.716a.5.5 0 00.625.617l5.965-1.548A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.798 9.798 0 01-5.031-1.386l-.36-.214-3.732.968.994-3.635-.235-.374A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                                    </svg>
                                </a>
                                {/* Twitter / X */}
                                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-sky-500 flex items-center justify-center transition-colors group">
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Col 2 — Quick Links */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Quick Links</h4>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <Link href="/shop" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/shop/products" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        All Products
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/shop/categories" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Categories
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/cart" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Shopping Cart
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Col 3 — Customer Service */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Customer Service</h4>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <Link href="/profile/show" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        My Account
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/my-orders" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Track My Orders
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/register" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Create Account
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Login
                                    </Link>
                                </li>
                                <li>
                                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Help &amp; Support
                                    </a>
                                </li>
                                <li>
                                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                                        Returns &amp; Refunds
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Col 4 — Contact Info */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Get In Touch</h4>
                            <ul className="space-y-4 text-sm">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-xs mb-0.5">Address</p>
                                        <p className="text-gray-400 leading-relaxed">{businessAddress}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-xs mb-0.5">Phone / WhatsApp</p>
                                        <a href={whatsappLink} className="text-gray-400 hover:text-blue-600 transition-colors">{businessPhone}</a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-xs mb-0.5">Email</p>
                                        <a href={`mailto:${businessEmail}`} className="text-gray-400 hover:text-blue-600 transition-colors">{businessEmail}</a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-xs mb-0.5">Working Hours</p>
                                        <p className="text-gray-400">Mon – Sat: 8:00 AM – 6:00 PM</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>



                    {/* Copyright Bar */}
                    <div className="border-t border-gray-800 pt-5 flex flex-col items-center justify-center gap-2 text-xs text-gray-500 text-center">
                        <p>&copy; 2026 {props.activeBranch?.name || 'Jopo Juniours Co. Ltd'}. All rights reserved.</p>
                        <p className="text-[11px] text-gray-400">Proudly serving Tanzania 🇹🇿</p>
                        <p>
                            Developed by{' '}
                            <a href="https://wa.me/255717489868" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-300 transition-colors font-semibold">
                                FridolTech
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
