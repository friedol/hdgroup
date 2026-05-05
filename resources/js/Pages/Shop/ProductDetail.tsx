import { Head, Link, router } from '@inertiajs/react';
import { Star, ChevronLeft, Truck, Shield, RotateCcw, ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { RelatedProducts } from '@/components/shop/related-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomLayout from '@/layouts/app/custom-layout';

interface Product {
    id: number;
    product_id: string;
    product_name: string;
    product_price: number;
    plain_price?: number;
    printed_price?: number;
    buying_price?: number;
    unit_price?: number;
    is_enabled: boolean;
    total_qty?: number;
    product_type?: string;
    feature?: string;
    video?: string;
    product_management_id?: number;
    product_management?: {
        id: number;
        category_id?: number;
        images?: Array<{
            id: number;
            image_url: string;
            is_featured: boolean;
        }>;
        image_url?: string;
        brand?: string;
        category?: {
            id: number;
            category_name: string;
        };
        plain_selling_price?: number;
        printed_selling_price?: number;
        sale_units?: any;
    };
    created_at?: string;
    updated_at?: string;
    description?: string;
    sku?: string;
    variants?: Array<{
        id: number;
        color: string;
        qty?: number;
        plain_qty?: number;
        printed_qty?: number;
        plain_price?: number;
        printed_price?: number;
        price?: number;
    }>;
}

interface Review {
    id: number;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface Props {
    product: Product;
    relatedProducts?: Product[];
    reviews?: Review[];
    averageRating?: number;
    reviewCount?: number;
}

export default function ProductDetail({ 
    product, 
    relatedProducts = [], 
    reviews = [], 
    averageRating = 0, 
    reviewCount = 0 
}: Props) {
    const isManufactured = product.product_type === 'manufactured' || product.product_type === 'finished_product' || product.product_management?.category?.category_name === 'Wooven Fabric' || product.product_management?.category?.category_name === 'Manufactured';
    const minQty = isManufactured ? 100 : 1;
    const [quantity, setQuantity] = useState(minQty);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedPrintType, setSelectedPrintType] = useState<'plain' | 'printed'>('plain');
    const [isLoading, setIsLoading] = useState(false);

    const getVariantSwatchColor = (rawColor?: string) => {
        if (!rawColor) return '#cbd5e1';

        const input = rawColor.trim();
        if (!input) return '#cbd5e1';

        if (input.startsWith('#') || input.startsWith('rgb') || input.startsWith('hsl')) {
            return input;
        }

        const normalized = input.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        const named: Record<string, string> = {
            'pale pink': '#f8c8dc',
            'pink': '#ec4899',
            'red': '#ef4444',
            'blue': '#3b82f6',
            'green': '#22c55e',
            'yellow': '#eab308',
            'orange': '#f97316',
            'purple': '#a855f7',
            'black': '#111827',
            'white': '#ffffff',
            'gray': '#9ca3af',
            'grey': '#9ca3af',
            'brown': '#92400e',
            'navy': '#1e3a8a',
            'teal': '#0d9488',
        };

        return named[normalized] || normalized;
    };

    // Review Form State
    const [reviewForm, setReviewForm] = useState({ rating: 5, customer_name: '', comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingReview(true);
        router.post(`/product/${product.id}/reviews`, reviewForm, {
            onSuccess: () => {
                setReviewForm({ rating: 5, customer_name: '', comment: '' });
                alert('Review submitted successfully!');
            },
            onFinish: () => setIsSubmittingReview(false)
        });
    };

    // Parse sale units from product management
    const parseSaleUnits = () => {
        try {
            const rawUnits = product.product_management?.sale_units;
            if (!rawUnits) return [];
            
            // Handle both stringified JSON and direct array/object
            const parsed = typeof rawUnits === 'string' ? JSON.parse(rawUnits) : rawUnits;
            
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === 'object') return Object.values(parsed);
            
            return [];
        } catch (e) {
            console.error("Failed to parse sale units:", e);
            return [];
        }
    };

    const saleUnits = parseSaleUnits();

    const resolveManufacturedPrice = (unit?: any, variant?: any, printType: 'plain' | 'printed' = 'plain') => {
        const plainPrice = Number(
            variant?.plain_price
            ?? product.plain_price
            ?? product.product_management?.plain_selling_price
            ?? unit?.plain_price
            ?? unit?.market_price
            ?? unit?.unit_price
            ?? unit?.price
            ?? product.product_price
            ?? 0
        );

        const printedPrice = Number(
            variant?.printed_price
            ?? product.printed_price
            ?? product.product_management?.printed_selling_price
            ?? unit?.printed_price
            ?? unit?.market_price
            ?? unit?.unit_price
            ?? unit?.price
            ?? plainPrice
        );

        if (printType === 'printed') {
            return printedPrice > 0 ? printedPrice : plainPrice;
        }

        return plainPrice;
    };

    const resolveVariantDisplayPrice = (variant: NonNullable<Product['variants']>[number], printType: 'plain' | 'printed') => {
        const plainCandidate = variant.plain_price
            ?? product.plain_price
            ?? product.product_management?.plain_selling_price;

        const printedCandidate = variant.printed_price
            ?? product.printed_price
            ?? product.product_management?.printed_selling_price
            ?? plainCandidate;

        const target = printType === 'printed' ? printedCandidate : plainCandidate;

        if (target === undefined || target === null) {
            return null;
        }

        const num = Number(target);
        return Number.isFinite(num) ? num : null;
    };

    const formatPriceOrDash = (value: number | null) => {
        if (value === null) return '-';
        return `${new Intl.NumberFormat('en-US').format(value)} TSH`;
    };
    
    // Default to the first unit or create a fallback from product defaults
    const [selectedUnit, setSelectedUnit] = useState<any>(() => {
        if (saleUnits.length > 0) return saleUnits[0];
        return {
            unit_price: Number(product.product_price),
            unit_name: product.feature || 'Unit',
            description: 'Standard valuation node'
        };
    });

    const selectedUnitPrice = isManufactured
        ? resolveManufacturedPrice(selectedUnit, undefined, selectedPrintType)
        : Number(selectedUnit.market_price || selectedUnit.unit_price || selectedUnit.price || product.product_price);

    const selectedUnitLabel = isManufactured
        ? `${selectedUnit.unit_name} (${selectedPrintType === 'printed' ? 'Printed Bag' : 'Plain Bag'})`
        : selectedUnit.unit_name;

    const handleAddToCart = () => {
        setIsLoading(true);
        router.post(`/cart/add/${product.id}`, {
            quantity: quantity,
            data: `${selectedUnitPrice},${selectedUnitLabel}`,
            color: selectedColor
        }, {
            onFinish: () => setIsLoading(false),
        });
    };

    const inStock = (product.total_qty ?? 0) > 0;
    const maxQuantity = product.total_qty ?? 0;
    const imageUrl = product.product_management?.images?.[0]?.image_url ?? product.product_management?.image_url;
    
    const hasVariants = product.variants && product.variants.length > 0;
    const getVariantAvailableQty = (variant: NonNullable<Product['variants']>[number]) => {
        const totalQty = Number(variant.qty ?? 0);

        if (isManufactured) {
            if (selectedPrintType === 'printed') {
                const printedQty = Number(variant.printed_qty ?? 0);
                return printedQty > 0 ? printedQty : totalQty;
            }
            const plainQty = Number(variant.plain_qty ?? 0);
            return plainQty > 0 ? plainQty : totalQty;
        }

        return totalQty;
    };
    const selectedVariant = hasVariants ? product.variants?.find((v) => v.color === selectedColor) : undefined;
    const selectedVariantQty = selectedVariant ? getVariantAvailableQty(selectedVariant) : 0;
    const canAddToCart = inStock
        && (!hasVariants || (selectedColor && selectedVariantQty > 0))
        && !isLoading;

    return (
        <CustomLayout>
            <Head title={product.product_name} />

            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative bg-amber-400 text-slate-900 overflow-hidden py-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
 
                    <div className="mx-auto w-[99%] max-w-[1920px] px-2 sm:px-4 relative z-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-800 mb-4 font-semibold">
                            <div className="flex items-center gap-2">
                                <Link href="/shop/products" className="text-slate-800 hover:text-amber-700 transition tracking-wide text-[10px] uppercase">
                                    Products
                                </Link>
                                <span className="text-amber-600">/</span>
                                <span className="text-slate-800 tracking-wide text-[10px] uppercase">
                                    {product.product_management?.category?.category_name || 'General'}
                                </span>
                                <span className="text-amber-600">/</span>
                                <span className="text-amber-900 font-medium tracking-wide text-[10px] uppercase">{product.product_name}</span>
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight capitalize">{product.product_name.toLowerCase()}</h1>
                        <p className="text-xs text-slate-800 max-w-2xl mx-auto font-normal">Explore detailed specifications and acquisition metrics.</p>
                    </div>
                </section>

                <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4 py-8">
                    <Link href="/shop" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
                        <ChevronLeft className="w-4 h-4" />
                        Back to shop
                    </Link>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-12">
                        {/* Product Image */}
                        <div className="bg-white rounded-lg p-3 md:p-6 space-y-4 md:space-y-6">
                            <div className="aspect-[4/3] md:aspect-square bg-gray-200 rounded-lg mb-3 md:mb-4 flex items-center justify-center overflow-hidden border">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={product.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-gray-400 text-center">
                                        <p className="text-2xl">📦</p>
                                        <p className="text-sm mt-2">No image available</p>
                                    </div>
                                )}
                            </div>
                            {product.product_management?.images && product.product_management.images.length > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.product_management.images.slice(0, 4).map((image) => (
                                        <button
                                            key={image.id}
                                            className="aspect-square bg-gray-100 rounded border-2 border-transparent hover:border-blue-500 transition"
                                        >
                                            <img src={image.image_url} alt="" className="w-full h-full object-cover rounded" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="bg-white rounded-lg p-3 md:p-6">
                            {/* Category */}
                            <span className="text-[14px] text-blue-600 font-medium">
                                {product.product_management?.category?.category_name || 'Product'}
                            </span>

                            {/* Title */}
                             <h1 className="text-[18px] md:text-3xl font-medium text-slate-900 mt-2 mb-3 md:mb-4 capitalize leading-tight">
                                {product.product_name.toLowerCase()}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[12px] md:text-[14px] text-gray-600">
                                    {averageRating.toFixed(1)} ({reviewCount} reviews)
                                </span>
                            </div>

                             {/* Price Display */}
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[18px] md:text-4xl font-medium text-slate-900 tracking-tight">
                                        {new Intl.NumberFormat('en-US').format(Number(selectedUnitPrice))}
                                    </span>
                                    <span className="text-[14px] md:text-xl font-semibold text-slate-400">TSH</span>
                                    {product.buying_price && product.buying_price > Number(selectedUnitPrice) && (
                                        <span className="ml-2 text-[14px] md:text-lg text-slate-400 line-through font-medium">
                                            {new Intl.NumberFormat('en-US').format(product.buying_price)} TSH
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] md:text-[11px] font-medium text-amber-600 uppercase tracking-widest mt-1">
                                    Current Valuation Node
                                </p>
                            </div>

                            {isManufactured && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                    <label className="block text-[14px] font-medium text-slate-500 mb-3">
                                        Bag Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPrintType('plain')}
                                            className={`px-3 py-2 rounded-lg border-2 text-[14px] font-semibold transition-all ${selectedPrintType === 'plain' ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm shadow-amber-100' : 'border-slate-100 bg-white text-slate-600 hover:border-amber-200 hover:bg-slate-50'}`}
                                        >
                                            Plain Bag
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPrintType('printed')}
                                            className={`px-3 py-2 rounded-lg border-2 text-[14px] font-semibold transition-all ${selectedPrintType === 'printed' ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm shadow-amber-100' : 'border-slate-100 bg-white text-slate-600 hover:border-amber-200 hover:bg-slate-50'}`}
                                        >
                                            Printed Bag
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Unit Selection Layer */}
                            {saleUnits.length > 1 && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                    <label className="block text-[14px] font-medium text-slate-500 mb-3">
                                        Select Unit
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                                        {saleUnits.map((unit: any, idx: number) => {
                                            const isSelected = selectedUnit.unit_name === unit.unit_name;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setSelectedUnit(unit);
                                                        setQuantity(1);
                                                    }}
                                                    className={`flex flex-col p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden group ${
                                                        isSelected 
                                                        ? 'border-amber-400 bg-amber-50 shadow-md shadow-amber-100' 
                                                        : 'border-slate-100 bg-white hover:border-amber-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-[14px] font-medium capitalize ${isSelected ? 'text-amber-900' : 'text-slate-900'}`}>
                                                            {unit.unit_name.toLowerCase()}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                                                                <Check className="w-2.5 h-2.5 text-slate-900" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={`text-[14px] font-medium ${isSelected ? 'text-amber-700' : 'text-slate-600'}`}>
                                                            {new Intl.NumberFormat('en-US').format(Number(isManufactured ? resolveManufacturedPrice(unit, undefined, selectedPrintType) : (unit.market_price || unit.unit_price || unit.price || product.product_price)))}
                                                        </span>
                                                        <span className="text-[12px] font-semibold text-slate-400">TSH</span>
                                                    </div>
                                                    <p className="text-[12px] text-slate-400 mt-1 line-clamp-1 italic">
                                                        {unit.description || 'Standard distribution unit'}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                <p className="text-[14px] text-gray-600 leading-tight">
                                    Product ID: <span className="font-mono font-semibold tracking-tight break-all">{product.product_id}</span>
                                </p>
                                <div className="text-right">
                                    {inStock ? (
                                        <p className="text-[14px] text-green-600 font-semibold">
                                            ✓ In Stock
                                        </p>
                                    ) : (
                                        <p className="text-[14px] text-red-600 font-semibold">Out of Stock</p>
                                    )}
                                </div>
                            </div>

                            {/* Color Selection Layer */}
                            {hasVariants && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                    <label className="block text-[14px] font-medium text-slate-500 mb-3">
                                        Select Color 
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants!.map((variant) => {
                                            const availableQty = getVariantAvailableQty(variant);
                                            const outOfStock = availableQty <= 0;
                                            return (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedColor(variant.color)}
                                                disabled={outOfStock}
                                                className={`px-3 py-2 rounded-lg border-2 text-[14px] font-semibold transition-all shadow-sm ${
                                                    selectedColor === variant.color 
                                                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-amber-100' 
                                                    : outOfStock
                                                    ? 'border-slate-100 bg-slate-100/70 text-slate-400 cursor-not-allowed'
                                                    : 'border-slate-100 bg-white text-slate-600 hover:border-amber-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                                                        <div className="w-full h-full" style={{ backgroundColor: getVariantSwatchColor(variant.color) }}></div>
                                                    </div>
                                                    <span>{variant.color}</span>
                                                    <span className="text-[11px] font-medium text-slate-500">({availableQty.toLocaleString()} pcs)</span>
                                                </div>
                                            </button>
                                            );
                                        })}
                                    </div>
                                    {!selectedColor && (
                                        <p className="text-[10px] text-amber-600 font-medium mt-2">* Selection required</p>
                                    )}
                                    {selectedColor && selectedVariantQty <= 0 && (
                                        <p className="text-[10px] text-red-600 font-medium mt-2">* Selected color is out of stock for this bag type</p>
                                    )}
                                </div>
                            )}

                            {/* Quantity Selector */}
                            {inStock && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                    <label className="block text-[14px] font-medium text-slate-500 mb-3">
                                        Quantity ({selectedUnitLabel.toLowerCase()}) {isManufactured && '- Minimum 100'}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={minQty}
                                            max={product.total_qty ?? 1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value) || minQty))}
                                            className="w-full md:w-24 h-11 text-[14px] font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                             {/* Add to Cart Button */}
                            <Button
                                onClick={handleAddToCart}
                                disabled={!canAddToCart}
                                className="w-full h-12 md:h-14 text-[14px] md:text-lg font-semibold gap-2 mb-2 bg-amber-400 hover:bg-amber-500 text-slate-900 transition-all shadow-lg shadow-amber-200"
                                size="lg"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {isLoading ? 'Synchronizing...' : `Acquire ${selectedUnitLabel.toLowerCase()}`}
                            </Button>


                            {/* Features 
                            <div className="space-y-3 pt-6 border-t">
                                <div className="flex items-start gap-3">
                                    <Truck className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">Free Shipping</p>
                                        <p className="text-gray-600">On orders over $50</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">2-Year Warranty</p>
                                        <p className="text-gray-600">Extended protection</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <RotateCcw className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">30-Day Returns</p>
                                        <p className="text-gray-600">Easy returns & exchanges</p>
                                    </div>
                                </div>
                            </div>
                            */}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg p-6 mb-12">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList>
                                <TabsTrigger value="description">Description</TabsTrigger>
                                <TabsTrigger value="reviews">
                                    Reviews ({reviewCount})
                                </TabsTrigger>
                                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                                {hasVariants && <TabsTrigger value="variants">Variants ({product.variants?.length || 0})</TabsTrigger>}
                            </TabsList>

                            <TabsContent value="description" className="mt-6">
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="mt-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div>
                                        {reviews.length > 0 ? (
                                            <div className="space-y-6">
                                                {reviews.map((review) => (
                                                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="font-semibold text-gray-900">
                                                                {review.customer_name}
                                                            </p>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-600">{review.comment}</p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600">No reviews yet. Be the first to review!</p>
                                        )}
                                    </div>
                                    
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-max">
                                        <h3 className="text-lg font-medium text-slate-900 mb-4">Write a Review</h3>
                                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-900 mb-2">Rating</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            type="button"
                                                            key={star}
                                                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                            className="focus:outline-none"
                                                        >
                                                            <Star className={`w-6 h-6 ${reviewForm.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-900 mb-2">Your Name</label>
                                                <Input 
                                                    value={reviewForm.customer_name}
                                                    onChange={(e) => setReviewForm(prev => ({ ...prev, customer_name: e.target.value }))}
                                                    required 
                                                    placeholder="John Doe" 
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-900 mb-2">Comment</label>
                                                <textarea 
                                                    value={reviewForm.comment}
                                                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                                    className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                                    rows={4}
                                                    placeholder="Share your thoughts about this product..."
                                                ></textarea>
                                            </div>
                                            <Button type="submit" disabled={isSubmittingReview} className="w-full bg-slate-900 text-white font-medium hover:bg-slate-800">
                                                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="specifications" className="mt-6">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">SKU</p>
                                            <p className="text-sm text-gray-600 font-mono">{product.sku || product.product_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Category</p>
                                            <p className="text-sm text-gray-600">
                                                {product.product_management?.category?.category_name || 'Uncategorized'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Added</p>
                                            <p className="text-sm text-gray-600">
                                                {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">In Stock</p>
                                            <p className="text-sm text-gray-600">
                                                {product.total_qty || 0} units
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {hasVariants && (
                                <TabsContent value="variants" className="mt-6">
                                    <div className="space-y-4">
                                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Color</th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Plain Price</th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Printed Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {product.variants?.map((variant) => (
                                                        <tr key={variant.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div 
                                                                        className="w-6 h-6 rounded-full border-2 border-slate-300" 
                                                                        style={{ backgroundColor: getVariantSwatchColor(variant.color) }}
                                                                        title={variant.color}
                                                                    />
                                                                    <span className="font-medium text-slate-900">{variant.color}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                <span className={`font-medium ${resolveVariantDisplayPrice(variant, 'plain') === null ? 'text-slate-400 italic' : ''}`}>
                                                                    {formatPriceOrDash(resolveVariantDisplayPrice(variant, 'plain'))}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                <span className={`font-medium ${resolveVariantDisplayPrice(variant, 'printed') === null ? 'text-slate-400 italic' : ''}`}>
                                                                    {formatPriceOrDash(resolveVariantDisplayPrice(variant, 'printed'))}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                     
                                    </div>
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-medium text-gray-900 mb-6">Related Products</h2>
                            <RelatedProducts products={relatedProducts} />
                        </div>
                    )}
                </div>
            </div>
        </CustomLayout>
    );
}
