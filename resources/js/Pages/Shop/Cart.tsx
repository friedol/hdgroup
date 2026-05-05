import { Head, Link, router } from '@inertiajs/react';
import { Trash2, ChevronLeft, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CustomLayout from '@/layouts/app/custom-layout';

interface CartItem {
    id: string; // Composite key like "123_Unit"
    product_id: number;
    product_name: string;
    product_image?: string;
    price: number;
    quantity: number;
    subtotal: number;
    unit: string;
}

interface Props {
    cartItems: CartItem[];
    subtotal: number;
    subtotalAfterDiscount?: number;
    promoDiscount?: number;
    appliedPromo?: {
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
    } | null;
    tax: number;
    total: number;
    shippingCost: number;
}

export default function Cart({ cartItems, subtotal, subtotalAfterDiscount, promoDiscount = 0, appliedPromo, tax, total, shippingCost }: Props) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingItem, setUpdatingItem] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState(appliedPromo?.code || '');

    const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(cartItemId);

            return;
        }

        setUpdatingItem(cartItemId);
        setIsUpdating(true);

        router.put(`/cart/${cartItemId}`, { quantity: newQuantity }, {
            onFinish: () => {
                setIsUpdating(false);
                setUpdatingItem(null);
            },
        });
    };

    const handleRemoveItem = (cartItemId: string) => {
        setUpdatingItem(cartItemId);
        setIsUpdating(true);

        router.delete(`/cart/${cartItemId}`, {
            onFinish: () => {
                setIsUpdating(false);
                setUpdatingItem(null);
            },
        });
    };

    const handleClearCart = () => {
        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            router.post('/cart/clear');
        }
    };

    const handleApplyPromo = () => {
        if (!promoCode.trim()) {
            return;
        }
        router.post('/cart/promo/apply', { code: promoCode.trim() });
    };

    const handleRemovePromo = () => {
        router.post('/cart/promo/remove');
    };

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('en-US').format(amt) + ' TSH';
    }

    return (
        <CustomLayout>
            <Head title="Shopping Cart" />

            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative bg-amber-400 text-slate-900 overflow-hidden py-4 md:py-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

                    <div className="mx-auto w-[99%] max-w-[1920px] px-2 sm:px-4 relative z-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-1 md:gap-2 mb-2 md:mb-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/40 backdrop-blur-md rounded-lg md:rounded-xl flex items-center justify-center border border-amber-300/50 shadow-xl shadow-amber-950/10">
                                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-slate-900" />
                            </div>
                            <span className="text-[8px] md:text-[10px] font-bold text-amber-900 uppercase tracking-[0.2em]">Acquisition Layer</span>
                        </div>
                        <h1 className="text-xl md:text-3xl font-extrabold mb-1 tracking-tight">Shopping Cart</h1>
                        <p className="text-[10px] md:text-xs text-slate-800 max-w-2xl mx-auto font-normal">Review items and proceed to secure checkout.</p>
                    </div>
                </section>

                <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4 py-8">
                    {cartItems && cartItems.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg overflow-hidden border">
                                    <div className="divide-y">
                                         {cartItems.map((item) => (
                                            <div key={item.id} className="p-4 md:p-6 hover:bg-gray-50 transition">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <div className="flex gap-4 flex-1">
                                                        {/* Product Image */}
                                                        <div className="flex-shrink-0">
                                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden border">
                                                                {item.product_image ? (
                                                                    <img
                                                                        src={item.product_image}
                                                                        alt={item.product_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                                                        📦
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Product Details */}
                                                        <div className="flex-grow">
                                                            <Link
                                                                href={`/order-product/${item.product_id}`}
                                                                className="block hover:text-blue-600"
                                                            >
                                                                <h3 className="text-sm md:text-base font-bold text-gray-900 hover:text-blue-600 truncate max-w-[150px] md:max-w-none">
                                                                    {item.product_name}
                                                                </h3>
                                                            </Link>
                                                            <p className="text-[10px] md:text-sm text-gray-500 font-medium">
                                                                Unit: {item.unit}
                                                            </p>
                                                            <p className="text-base md:text-lg font-black text-slate-900 mt-1">
                                                                {formatCurrency(item.price)}
                                                            </p>

                                                            {/* Quantity Control */}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleQuantityChange(item.id, item.quantity - 1)
                                                                    }
                                                                    disabled={isUpdating && updatingItem === item.id}
                                                                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border rounded-md hover:bg-gray-100 disabled:opacity-50 font-bold"
                                                                >
                                                                    −
                                                                </button>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                                                                    }
                                                                    disabled={isUpdating && updatingItem === item.id}
                                                                    className="w-12 h-7 md:w-16 md:h-8 text-center font-bold text-xs"
                                                                />
                                                                <button
                                                                    onClick={() =>
                                                                        handleQuantityChange(item.id, item.quantity + 1)
                                                                    }
                                                                    disabled={isUpdating && updatingItem === item.id}
                                                                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border rounded-md hover:bg-gray-100 disabled:opacity-50 font-bold"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Subtotal & Remove */}
                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                                        <div className="text-left sm:text-right">
                                                            <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Subtotal</p>
                                                            <p className="text-sm md:text-lg font-black text-slate-900">
                                                                {formatCurrency(item.subtotal)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            disabled={isUpdating && updatingItem === item.id}
                                                            className="text-red-500 hover:text-red-700 p-2 -mr-2 disabled:opacity-50 flex items-center justify-end transition-colors"
                                                            title="Remove Item"
                                                        >
                                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                                            <span className="sm:hidden text-xs font-bold ml-1">Remove</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Continue Shopping */}
                                    <div className="px-4 md:px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                                        <Link href="/shop/products">
                                            <Button variant="outline" className="gap-2 font-bold h-10 md:h-11 border-slate-200 text-xs md:text-sm">
                                                <ChevronLeft className="w-4 h-4" />
                                                <span className="hidden sm:inline">Continue Shopping</span>
                                                <span className="sm:hidden">Shop</span>
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            onClick={handleClearCart}
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs md:text-sm"
                                        >
                                            Clear Cart
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg p-6 sticky top-20 border shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

                                    <div className="space-y-3 pb-6 border-b">
                                        <div className="flex justify-between text-gray-600 font-medium">
                                            <span>Subtotal</span>
                                            <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                                        </div>
                                        {promoDiscount > 0 && (
                                            <>
                                                <div className="flex justify-between text-emerald-700 font-medium">
                                                    <span>Promo ({appliedPromo?.code})</span>
                                                    <span>-{formatCurrency(promoDiscount)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-600 font-medium">
                                                    <span>Subtotal After Discount</span>
                                                    <span className="text-gray-900">{formatCurrency(subtotalAfterDiscount ?? subtotal - promoDiscount)}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between text-gray-600 font-medium">
                                            <span>Shipping</span>
                                            <span className="text-gray-900">{formatCurrency(shippingCost)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 font-medium">
                                            <span>Tax (18%)</span>
                                            <span className="text-gray-900">{formatCurrency(tax)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-6 mb-6">
                                        <span className="font-bold text-gray-700">Total</span>
                                        <span className="text-2xl font-black text-slate-900">
                                            {formatCurrency(total)}
                                        </span>
                                    </div>

                                    <Link href="/checkout">
                                        <Button className="w-full h-14 text-lg font-bold gap-2 bg-amber-400 text-slate-900 hover:bg-amber-500 shadow-lg shadow-amber-300/40">
                                            <ShoppingCart className="w-5 h-5" />
                                            Proceed to Checkout
                                        </Button>
                                    </Link>

                                    {/* Promo Code */}
                                    <div className="mt-6 pt-6 border-t">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                                            Promo Code
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter code"
                                                className="h-10 text-sm font-medium"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            />
                                            {!appliedPromo ? (
                                                <Button variant="outline" size="sm" className="h-10 font-bold" type="button" onClick={handleApplyPromo}>
                                                    Apply
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" className="h-10 font-bold text-red-600" type="button" onClick={handleRemovePromo}>
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg p-16 text-center border shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingCart className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet. Explore our products to find what you need.</p>
                            <Link href="/shop">
                                <Button size="lg" className="h-12 px-8 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold">Continue Shopping</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </CustomLayout>
    );
}

