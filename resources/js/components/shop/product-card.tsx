import { Link, router } from '@inertiajs/react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Product {
    id: number;
    product_id: string;
    product_name: string;
    product_price: number;
    plain_price?: number;
    printed_price?: number;
    total_qty?: number;
    average_rating?: number;
    reviews_count?: number;
    feature?: string;
    product_type?: string;
    variants?: Array<{
        id: number;
        color: string;
        plain_price?: number;
        printed_price?: number;
        price?: number;
    }>;
    product_management?: {
        id: number;
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
        product_unit?: string;
        unit_name?: string;
        plain_selling_price?: number;
        printed_selling_price?: number;
        sale_units?: Array<{
            unit_name: string;
            unit_price?: number;
            market_price?: number;
            price?: number;
            plain_price?: number;
            printed_price?: number;
            description?: string;
        }>;
    };
}

interface Props {
    product: Product;
    view?: 'grid' | 'list';
}

export function ProductCard({ product, view = 'grid' }: Props) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const minQty = 1;
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedPrintType, setSelectedPrintType] = useState<'plain' | 'printed'>('plain');
    const displayUnit = product.product_management?.product_unit ?? product.product_management?.unit_name ?? product.feature ?? 'Unit';
    const categoryName = product.product_management?.category?.category_name;
    const isManufactured = product.product_type === 'manufactured' || product.product_type === 'finished_product' || categoryName === 'Wooven Fabric' || categoryName === 'Manufactured';
    
    // Process sale units defensively
    let rawSaleUnits = product.product_management?.sale_units;
    let saleUnits: Array<{ unit_name: string; unit_price?: number; market_price?: number; price?: number; plain_price?: number; printed_price?: number; description?: string }> = [];
    
    try {
        if (typeof rawSaleUnits === 'string') {
            saleUnits = JSON.parse(rawSaleUnits);
        } else if (Array.isArray(rawSaleUnits)) {
            saleUnits = rawSaleUnits;
        }
    } catch (e) {
        console.error("Failed to parse sale_units:", e);
    }
    
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

    // Default selection
    const maxPrice = saleUnits.length > 0 
        ? Math.max(...saleUnits.map((u: any) => Number(u.market_price || u.unit_price || u.price || 0))) 
        : Number(product.product_price);
    const maxUnit = saleUnits.length > 0 
        ? saleUnits.find(u => Number(u.market_price || u.unit_price || u.price || 0) === maxPrice)?.unit_name || displayUnit
        : displayUnit;
    const maxUnitDesc = saleUnits.length > 0 
        ? saleUnits.find(u => Number(u.market_price || u.unit_price || u.price || 0) === maxPrice)?.description || 'Primary Tier'
        : 'Primary Tier';
    const cardDisplayPrice = isManufactured ? resolveManufacturedPrice(saleUnits[0], undefined, 'plain') : maxPrice;

    const [selectedUnit, setSelectedUnit] = useState(`${product.product_price},${displayUnit}`);
    const selectedUnitName = (selectedUnit.split(',')[1] ?? displayUnit).trim();
    const selectedUnitObj = saleUnits.find((u) => u.unit_name === selectedUnitName);
    const selectedUnitPrice = isManufactured
        ? resolveManufacturedPrice(selectedUnitObj, undefined, selectedPrintType)
        : Number(selectedUnit.split(',')[0] ?? product.product_price);

    const inStock = (product.total_qty ?? 0) > 0;
    const imageUrl = product.product_management?.images?.[0]?.image_url ?? product.product_management?.image_url;
    const modalId = `modal-${product.id}`;
    
    const hasVariants = product.variants && product.variants.length > 0;
    const canAddToCart = inStock && (!hasVariants || selectedColor);

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

    const handleAddToCart = () => {
        const unitLabel = isManufactured
            ? `${selectedUnitName} (${selectedPrintType === 'printed' ? 'Printed Bag' : 'Plain Bag'})`
            : selectedUnitName;

        router.post(`/cart/add/${product.id}`, {
            quantity: parseInt(quantity.toString()),
            data: `${selectedUnitPrice},${unitLabel}`,
            color: selectedColor
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowModal(false);
                setQuantity(1);
                setSelectedColor(null);
            }
        });
    };

    return (
        <>
            <div className={`group bg-white rounded-2xl border border-slate-200 hover:border-blue-600/50 transition-all overflow-hidden flex relative shadow-sm hover:shadow-md ${view === 'grid' ? 'flex-col' : 'flex-row items-center p-2 gap-4'}`}>
                {view === 'grid' ? (
                    <Link href={`/order-product/${product.id}`} className="flex flex-col">
                        {/* Visual */}
                        <div className="relative aspect-[4/3] md:aspect-square overflow-hidden bg-white">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={product.product_name}
                                    className="w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-700"
                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                                />
                            ) : (
                                <img
                                    src="/placeholder.png"
                                    alt="Placeholder"
                                    className="w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-700"
                                />
                            )}

                             <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold z-10 shadow-sm capitalize">
                                {maxUnit.toLowerCase()}
                            </div>
                        </div>

                        {/* Intelligence */}
                        <div className="p-2 md:p-3 flex flex-col">
                            <div className="mb-2 md:mb-3">
                                 <h3 className="text-[11px] md:text-xs font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-all tracking-tight leading-tight line-clamp-1 capitalize">
                                    {product.product_name.toLowerCase()}
                                </h3>
                                <div className="flex items-center gap-0.5 mb-2 mt-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-3 h-3 ${i < Math.round(product.average_rating || 5) ? 'fill-blue-400 text-blue-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                    <span className="text-[10px] text-gray-500 ml-1 font-bold">({product.reviews_count || 0})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-wide">
                                        {maxUnitDesc}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-end justify-between pt-2 md:pt-3 border-t border-slate-50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-300 tracking-wide mb-1">
                                        Valuation
                                    </span>
                                     <div className="flex items-baseline space-x-1">
                                        <span className="text-[13px] md:text-[15px] font-bold text-slate-900 tracking-tighter leading-none">
                                            {new Intl.NumberFormat('en-US').format(cardDisplayPrice)}
                                        </span>
                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">
                                            TSH
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowModal(true);
                                    }}
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-lg shadow-blue-100/50"
                                    type="button"
                                >
                                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <>
                        {/* List View Layout */}
                        <Link href={`/order-product/${product.id}`} className="w-28 h-28 md:w-40 md:h-40 flex-shrink-0 relative overflow-hidden rounded-xl bg-white border border-slate-100">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={product.product_name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                                />
                            ) : (
                                <img
                                    src="/placeholder.png"
                                    alt="Placeholder"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                />
                            )}
                            <div className="absolute top-2 left-2 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold z-10 shadow-sm capitalize">
                                {maxUnit.toLowerCase()}
                            </div>
                        </Link>

                        <div className="flex-1 min-w-0 pr-4">
                            <Link href={`/order-product/${product.id}`} className="block mb-2">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 hover:text-blue-700 transition truncate capitalize">
                                    {product.product_name.toLowerCase()}
                                </h3>
                                <div className="flex items-center gap-1 mb-2 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < Math.round(product.average_rating || 5) ? 'fill-blue-400 text-blue-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                    <span className="text-xs text-gray-500 ml-1 font-bold">({product.reviews_count || 0} reviews)</span>
                                </div>
                                <p className="text-[10px] md:text-sm text-slate-500 font-bold line-clamp-1">
                                    Primary Tier Specification • {maxUnitDesc} • Quality Inspected
                                </p>
                            </Link>
                            
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-300 tracking-wide mb-1">Valuation</span>
                                     <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-slate-900">{new Intl.NumberFormat('en-US').format(Number(cardDisplayPrice))}</span>
                                        <span className="text-[11px] font-bold text-slate-400">TSH</span>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowModal(true);
                                    }}
                                    className="bg-blue-600 text-white px-5 py-2 rounded-md font-bold text-[11px] hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 shadow-md shadow-blue-200/50"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    Place order
                                </button>
                            </div>
                        </div>
                    </>
                )}

            </div>

            {/* Add to Cart Dialog */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-lg p-0 bg-white border-none rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-8 md:p-10">
                        <DialogHeader className="mb-8 text-left">
                            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                                {product.product_name}
                            </DialogTitle>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-wide">
                                Acquisition terminal
                            </p>
                        </DialogHeader>

                        <div className="space-y-10">
                            {/* Unit Selection */}
                            <div className="space-y-4">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wide block ml-1">
                                    Selection layer
                                </span>
                                <div className="space-y-3">
                                    {Array.isArray(saleUnits) && saleUnits.length > 0 ? (
                                         saleUnits.map((u: any, i) => {
                                            const unitPriceToUse = u.market_price || u.unit_price || u.price || 0;
                                            const unitVal = `${unitPriceToUse},${u.unit_name}`; // Changed market_price to unit_price
                                            const isSelected = selectedUnit === unitVal;
                                            return (
                                                <label 
                                                    key={i}
                                                    onClick={() => setSelectedUnit(unitVal)}
                                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 bg-slate-50 hover:border-blue-200'}`}
                                                >
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-sm font-bold text-slate-900 tracking-tight">
                                                            {u.unit_name}
                                                        </span>
                                                        <span className={`text-[10px] font-bold tracking-wide mt-0.5 ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                                                            {u.description || 'Secondary Tier'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                                 <span className="text-sm font-bold text-slate-900">
                                                            {new Intl.NumberFormat('en-US', {
                                                                maximumFractionDigits: 0,
                                                                    }).format(Number(isManufactured ? resolveManufacturedPrice(u, undefined, selectedPrintType) : unitPriceToUse))} TSH
                                                        </span>
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-700 bg-blue-700' : 'border-slate-300 bg-white'}`}>
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        <label className="flex items-center justify-between p-4 rounded-xl border-2 border-blue-600 bg-blue-50/30 cursor-pointer transition-all">
                                            <div className="flex flex-col text-left">
                                                 <span className="text-sm font-bold text-slate-900 tracking-tight">
                                                    {maxUnit}
                                                </span>
                                                <span className="text-[10px] text-blue-700 font-bold tracking-wide mt-0.5">
                                                    Primary tier
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                 <span className="text-sm font-bold text-slate-900">
                                                    {new Intl.NumberFormat('en-US', {
                                                        maximumFractionDigits: 0,
                                                    }).format(Number(isManufactured ? resolveManufacturedPrice(undefined, undefined, selectedPrintType) : maxPrice))} TSH
                                                </span>
                                                <div className="w-4 h-4 rounded-full border-2 border-blue-700 bg-blue-700 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                </div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Bag Type Selection For Manufactured Products */}
                            {isManufactured && (
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-wide block ml-1">
                                        Bag type
                                    </span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPrintType('plain')}
                                            className={`px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${selectedPrintType === 'plain' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'}`}
                                        >
                                            Plain Bag
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPrintType('printed')}
                                            className={`px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${selectedPrintType === 'printed' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'}`}
                                        >
                                            Printed Bag
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Color Selection Layer */}
                            {hasVariants && (
                                <div className="space-y-4">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-wide block ml-1">
                                        Color Attributes
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants!.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedColor(variant.color)}
                                                className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all shadow-sm ${
                                                    selectedColor === variant.color 
                                                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-blue-100' 
                                                    : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                                                        <div className="w-full h-full" style={{ backgroundColor: getVariantSwatchColor(variant.color) }}></div>
                                                    </div>
                                                    {variant.color}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {!selectedColor && (
                                        <p className="text-[10px] text-blue-700 font-bold mt-1">* Selection required</p>
                                    )}
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="relative text-left">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wide block ml-1 mb-3">
                                    Quantity node
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value) || minQty))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                                    placeholder="00"
                                    min={minQty}
                                />
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={!canAddToCart}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-[14px] transition-all hover:bg-slate-900 hover:text-white shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {inStock ? 'Place Order' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
