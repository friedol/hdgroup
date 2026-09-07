import { Head, Link, usePage } from '@inertiajs/react';
import { Search, ChevronDown, ArrowUpRight, MapPin, Phone, Mail, Send, Map, LayoutGrid, ArrowRight, ChevronRight, Truck, Shield, RotateCcw, Headphones, Star, ShoppingBag, Zap, Clock, BadgeCheck, Package, Users } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import CustomLayout from '@/layouts/app/custom-layout';

interface Product {
    id: number;
    product_id: string;
    product_name: string;
    product_price: number;
    buying_price: number;
    unit_price: number;
    is_enabled: boolean;
    total_qty?: number;
    product_type?: string;
    feature?: string;
    video?: string;
    product_management_id?: number;
    product_management?: {
        id: number;
        category_id: number;
        images?: Array<{
            id: number;
            image_url: string;
            is_featured: boolean;
        }>;
        category?: {
            id: number;
            category_name: string;
        };
    };
    variants?: Array<{
        id: number;
        color: string;
        qty?: number;
        plain_price?: number;
        printed_price?: number;
        price?: number;
    }>;
}

interface Category {
    id: number;
    category_name: string;
    category_description?: string;
}

interface Branch {
    id: number;
    name: string;
    slug: string;
    location?: string;
    description?: string;
    logo?: string;
    is_active: boolean;
}

interface Props {
    products: Product[];
    categories: Category[];
    branches?: Branch[];
    activeBranchId?: number | null;
    selectedBranchId?: number | null;
    cartCount?: number;
    cart_total?: number;
    heroSlides?: any[];
    popupAds?: any[];
    rightAd?: any;
}

export default function Shop({ 
    products, 
    categories, 
    branches = [], 
    activeBranchId = null,
    selectedBranchId = null,
    cartCount = 0, 
    cart_total = 0,
    heroSlides = [],
    popupAds = [],
    rightAd = null
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'newest'>('popular');

    const displayHeroSlides = heroSlides.length > 0 
        ? heroSlides 
        : [
            { id: 'f1', image_path: '/img/hero1.png' },
            { id: 'f2', image_path: '/img/hero2.png' },
            { id: 'f3', image_path: '/img/hero3.png' },
            { id: 'f4', image_path: '/img/hero4.png' }
          ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentPopupAdIndex, setCurrentPopupAdIndex] = useState(0);
    const [showPopupAd, setShowPopupAd] = useState(popupAds.length > 0);

    const activePopupAd = popupAds.length > 0
        ? popupAds[currentPopupAdIndex % popupAds.length]
        : rightAd;

    const activePopupAdTitle = activePopupAd?.title?.trim?.().toLowerCase() === 'popup ad'
        ? ''
        : activePopupAd?.title;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % displayHeroSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [displayHeroSlides.length]);

    useEffect(() => {
        if (popupAds.length === 0) {
            setCurrentPopupAdIndex(0);
            setShowPopupAd(false);
            return;
        }

        setShowPopupAd(true);
        setCurrentPopupAdIndex(Math.floor(Math.random() * popupAds.length));
    }, [popupAds.length]);

    useEffect(() => {
        if (popupAds.length <= 1) {
            return;
        }

        const timer = setInterval(() => {
            setCurrentPopupAdIndex((prev) => (prev + 1) % popupAds.length);
        }, 6000);

        return () => clearInterval(timer);
    }, [popupAds.length]);

    const resolveBranchLogo = (logo?: string) => {
        if (logo) {
            return logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/')
                ? logo
                : `/storage/${logo}`;
        }
        return '/img/medani_auth_bg.png'; // default placeholder if no logo in db
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.feature?.toLowerCase?.().includes(searchQuery.toLowerCase()) ?? false) ||
                (product.product_id?.toLowerCase?.().includes(searchQuery.toLowerCase()) ?? false);
            const matchesCategory = !selectedCategory || product.product_management?.category_id === selectedCategory;

            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.product_price - b.product_price;
                case 'price-high':
                    return b.product_price - a.product_price;
                case 'newest':
                    return b.id - a.id;
                default:
                    return 0;
            }
        });
    }, [products, searchQuery, selectedCategory, sortBy]);

    return (
        <CustomLayout>
            <Head title="Home" />
            
            <div className="relative min-h-screen bg-background">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-background pt-6 pb-2">
                    <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-2 h-full">
                            {/* Left Active Slide */}
                            <div className="relative w-full lg:w-[75%] rounded-[1.5rem] overflow-hidden shadow-sm h-[185px] sm:h-[220px] md:h-auto md:aspect-[16/10] lg:aspect-auto lg:h-[500px]">
                                {displayHeroSlides.map((slide, index) => (
                                    <div 
                                        key={slide.id}
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        <img src={slide.image_path.startsWith('/') ? slide.image_path : `/storage/${slide.image_path}`} alt={slide.title || `Slide ${index + 1}`} className="w-full h-full object-cover" />
                                         {(slide.subtitle || slide.button_text) && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 md:p-8">
                                                {slide.title && slide.title.toLowerCase() !== 'untitled' && <h2 className="text-xl md:text-2xl font-bold text-white mb-2 capitalize">{slide.title.toLowerCase()}</h2>}
                                                {slide.subtitle && <p className="text-sm md:text-base text-white/90 mb-4 drop-shadow-md">{slide.subtitle}</p>}
                                                {slide.button_text && (
                                                    <a href={slide.button_link || '#'} className="self-start px-5 py-2.5 bg-white text-slate-900 font-bold rounded-full hover:bg-blue-300 transition-colors text-sm">
                                                        {slide.button_text}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* Slide Navigation Dots */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-slate-900/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    {displayHeroSlides.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/70 hover:bg-white'}`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right Static Ad - desktop only */}
                            <div className="hidden lg:flex w-[25%] h-[500px] rounded-[1.5rem] overflow-hidden shadow-sm relative group">
                                {activePopupAd?.image_path ? (
                                    <img
                                        src={activePopupAd.image_path.startsWith('/') ? activePopupAd.image_path : `/storage/${activePopupAd.image_path}`}
                                        alt={activePopupAd.title || 'Promotion'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                                        <p className="text-white font-bold text-center text-sm px-4">Add a Popup Ad to display here</p>
                                    </div>
                                )}
                                {activePopupAd && (activePopupAdTitle || activePopupAd.button_text) && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4">
                                        {activePopupAdTitle && <p className="text-white font-bold text-sm mb-1">{activePopupAdTitle}</p>}
                                        {activePopupAd.button_text && (
                                            <a href={activePopupAd.button_link || '#'} className="self-start px-3 py-1.5 bg-blue-600 text-white font-bold rounded-full text-xs hover:bg-white transition-colors">
                                                {activePopupAd.button_text}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

   

                {/* Shop by Category */}
                {categories.length > 0 && (
                    <section className="py-8 md:py-12 bg-background">
                        <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-xl font-dancing text-red-500 mb-1 font-bold">Browse</p>
                                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Shop by Category</h2>
                                </div>
                                <Link
                                    href="/shop/categories"
                                    className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-blue-600 bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 hover:border-blue-700 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                    </svg>
                                    View all
                                </Link>
                            </div>
                            <div className="relative overflow-hidden touch-pan-x pb-2">
                                <style>{`@keyframes categoryAutoSlide { 0% { transform: translateX(0); } 100% { transform: translateX(-33.3333%); } }`}</style>
                                <div className="flex w-max animate-[categoryAutoSlide_180s_linear_infinite] hover:[animation-play-state:paused] active:[animation-play-state:paused]">
                                {[0, 1, 2].map((copyIndex) => (
                                    <div key={copyIndex} className="flex items-center gap-3 pr-3">
                                        {categories.map((cat) => (
                                            <Link
                                                key={`${copyIndex}-${cat.id}`}
                                                href={`/category/${cat.id}`}
                                                className="shrink-0 group flex flex-col items-center gap-2"
                                            >
                                                <div className="w-[74px] h-[74px] sm:w-[82px] sm:h-[82px] rounded-full bg-white border border-slate-200 group-hover:border-blue-300 group-hover:shadow-md group-hover:shadow-blue-100/60 transition-all flex flex-col items-center justify-center px-2 text-center">
                                                    <LayoutGrid className="w-4 h-4 text-blue-700 mb-1" />
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 leading-tight capitalize line-clamp-2">
                                                        {cat.category_name.toLowerCase()}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Hot Deals Ticker */}
                {/* <div className="bg-slate-900 py-3 overflow-hidden">
                    <div className="mx-auto w-[99%] max-w-[1920px] px-2 sm:px-4 flex items-center gap-4">
                        <div className="flex items-center gap-2 shrink-0 bg-blue-400 px-3 py-1.5 rounded-lg">
                            <Zap className="w-3.5 h-3.5 text-slate-900" />
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-wide">Hot Deals</span>
                        </div>
                        <div className="flex items-center gap-6 overflow-x-auto text-sm text-white/70 font-medium whitespace-nowrap">
                            <span>✨ New arrivals every week</span>
                            <span>•</span>
                            <span>🚚 Fast delivery across Tanzania</span>
                            <span>•</span>
                            <span>🔒 100% secure checkout</span>
                            <span>•</span>
                            <span>📞 WhatsApp: +255 717 489 868</span>
                        </div>
                    </div>
                </div> */}

                {/* Products Section */}
                <div className="py-5 md:py-14 bg-background relative">
                    <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8 relative z-10 mb-4 md:mb-10">
                        <div className="flex flex-row items-center justify-between gap-4 pb-4">
                            {/* Left: Title */}
                            <div>
                                <p className="text-xl font-dancing text-blue-600 mb-1 font-bold">Product Gallery</p>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                    Our Products
                                </h2>
                            </div>

                            {/* Right: Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href="/shop/products"
                                    className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-blue-600 bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 hover:border-blue-700 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                    </svg>
                                    View all
                                </Link>
                            </div>
                        </div>
                    </div>
                    {filteredProducts.length > 0 ? (
                        <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative z-10">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6 pb-8">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="animate-fade-up">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 relative z-10">
                            <p className="text-slate-500 font-medium">No products found for this branch.</p>
                        </div>
                    )}
                </div>
                {/* Why Choose Us */}
                <section className="py-10 md:py-16 bg-slate-50">
                    <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8">
                        <div className="text-center mb-8 md:mb-10">
                            <p className="text-xl font-dancing text-red-600 mb-2 font-bold">Why Shop With Us</p>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Your Shopping, Our Priority</h2>
                            <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">We go the extra mile to make your experience smooth, safe, and rewarding.</p>
                        </div>
                        <style>{`@keyframes featureFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } } @keyframes featureFloatSoft { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(6px) scale(1.05); } }`}</style>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                            <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 border border-blue-200/70 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full bg-blue-300/30 blur-2xl motion-safe:animate-[featureFloat_6s_ease-in-out_infinite]" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-blue-300/25 blur-2xl motion-safe:animate-[featureFloatSoft_7s_ease-in-out_infinite]" />
                                <div className="relative flex gap-4 items-start">
                                    <div className="w-11 h-11 shrink-0 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center ring-1 ring-blue-200/80">
                                        <ShoppingBag className="w-5 h-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-1">Wide Product Range</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">Thousands of products across all categories, handpicked for quality and value.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 border border-sky-200/70 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-100/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full bg-sky-300/30 blur-2xl motion-safe:animate-[featureFloat_6.5s_ease-in-out_infinite]" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-blue-300/25 blur-2xl motion-safe:animate-[featureFloatSoft_7.5s_ease-in-out_infinite]" />
                                <div className="relative flex gap-4 items-start">
                                    <div className="w-11 h-11 shrink-0 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center ring-1 ring-sky-200/80">
                                        <Truck className="w-5 h-5 text-sky-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-1">Fast &amp; Reliable Delivery</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">Get your orders delivered quickly to your doorstep across Tanzania.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full bg-emerald-300/30 blur-2xl motion-safe:animate-[featureFloat_6.8s_ease-in-out_infinite]" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-teal-300/25 blur-2xl motion-safe:animate-[featureFloatSoft_7.8s_ease-in-out_infinite]" />
                                <div className="relative flex gap-4 items-start">
                                    <div className="w-11 h-11 shrink-0 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center ring-1 ring-emerald-200/80">
                                        <Shield className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-1">Secure &amp; Safe Payments</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">All transactions are encrypted. M-Pesa, Airtel Money, Visa & cash accepted.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 border border-violet-200/70 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full bg-violet-300/30 blur-2xl motion-safe:animate-[featureFloat_7s_ease-in-out_infinite]" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-fuchsia-300/25 blur-2xl motion-safe:animate-[featureFloatSoft_8s_ease-in-out_infinite]" />
                                <div className="relative flex gap-4 items-start">
                                    <div className="w-11 h-11 shrink-0 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center ring-1 ring-violet-200/80">
                                        <RotateCcw className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-1">Easy Returns Policy</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">Not satisfied? Return within 7 days for a full refund, no questions asked.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 border border-blue-200/70 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                                <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full bg-blue-300/30 blur-2xl motion-safe:animate-[featureFloat_7.2s_ease-in-out_infinite]" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-blue-300/25 blur-2xl motion-safe:animate-[featureFloatSoft_8.2s_ease-in-out_infinite]" />
                                <div className="relative flex gap-4 items-start">
                                    <div className="w-11 h-11 shrink-0 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center ring-1 ring-blue-200/80">
                                        <BadgeCheck className="w-5 h-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-1">Quality Guaranteed</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">Every product is vetted for quality and authenticity before listing on our platform.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 border border-rose-200/70 bg-gradient-to-br from-rose-50 via-pink-50 to-red-100/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                                <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full bg-rose-300/30 blur-2xl motion-safe:animate-[featureFloat_7.5s_ease-in-out_infinite]" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-red-300/25 blur-2xl motion-safe:animate-[featureFloatSoft_8.5s_ease-in-out_infinite]" />
                                <div className="relative flex gap-4 items-start">
                                    <div className="w-11 h-11 shrink-0 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center ring-1 ring-rose-200/80">
                                        <Headphones className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-1">24/7 Customer Support</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">Our team is always available via WhatsApp, phone, or email to assist you anytime.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            {/* Popup Ad Modal */}
            {showPopupAd && popupAds && popupAds.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                        <button 
                            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                            onClick={() => setShowPopupAd(false)}
                            aria-label="Close popup"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                        
                        <div className="w-full aspect-square md:aspect-auto md:h-[500px] bg-slate-100 relative">
                             <img 
                                 src={activePopupAd.image_path.startsWith('/') ? activePopupAd.image_path : `/storage/${activePopupAd.image_path}`} 
                                 alt={activePopupAdTitle || "Promotional Offer"} 
                                 className="w-full h-full object-cover" 
                             />
                                 {(activePopupAdTitle || activePopupAd.button_text) && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-6 md:p-8 flex flex-col items-center text-center">
                                        {activePopupAdTitle && <h3 className="text-2xl font-bold text-white mb-2">{activePopupAdTitle}</h3>}
                                    {activePopupAd.subtitle && <p className="text-sm text-white/80 mb-4">{activePopupAd.subtitle}</p>}
                                    {activePopupAd.button_text && (
                                        <a href={activePopupAd.button_link || '#'} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition-colors w-full md:w-auto">
                                            {activePopupAd.button_text}
                                        </a>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </CustomLayout>
    );
}
