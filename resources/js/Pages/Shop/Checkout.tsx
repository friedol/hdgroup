import { Head, router, Link } from '@inertiajs/react';
import { Truck, ChevronLeft, Lock, Receipt } from 'lucide-react';
import { useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomLayout from '@/layouts/app/custom-layout';

interface CartItem {
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
    user: {
        name: string;
        email: string;
        phone: string;
        country?: string;
        city?: string;
        street?: string;
        tin_number?: string;
    } | null;
}

const VAT_RATE = 0.18;
const DEFAULT_COUNTRY_ISO = 'TZ';
const DEFAULT_COUNTRY_CODE = '255';

const IntlAny = Intl as any;
const regionNames =
    typeof Intl !== 'undefined' && IntlAny.DisplayNames
        ? new IntlAny.DisplayNames(['en'], { type: 'region' })
        : null;

const COUNTRY_CODE_OPTIONS = getCountries()
    .map((iso2) => {
        try {
            return {
                iso2,
                dialCode: getCountryCallingCode(iso2),
                name: regionNames?.of(iso2) || iso2,
            };
        } catch {
            return null;
        }
    })
    .filter((v): v is { iso2: string; dialCode: string; name: string } => Boolean(v))
    .sort((a, b) => {
        if (a.iso2 === DEFAULT_COUNTRY_ISO) return -1;
        if (b.iso2 === DEFAULT_COUNTRY_ISO) return 1;
        return a.name.localeCompare(b.name);
    });

const FIELD_CLASS = 'h-12 border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-0';

function isoToFlag(iso2: string): string {
    return iso2
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function splitPhone(rawPhone?: string) {
    const raw = (rawPhone || '').trim();
    if (!raw) {
        return { countryCode: DEFAULT_COUNTRY_CODE, phoneLocal: '' };
    }

    const parsed = parsePhoneNumberFromString(raw);
    if (parsed?.countryCallingCode && parsed?.nationalNumber) {
        return {
            countryCode: parsed.countryCallingCode,
            phoneLocal: parsed.nationalNumber,
        };
    }

    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length > DEFAULT_COUNTRY_CODE.length) {
        return {
            countryCode: DEFAULT_COUNTRY_CODE,
            phoneLocal: digits.slice(DEFAULT_COUNTRY_CODE.length),
        };
    }

    return {
        countryCode: DEFAULT_COUNTRY_CODE,
        phoneLocal: digits.replace(/^0+/, ''),
    };
}

export default function Checkout({ cartItems, subtotal, subtotalAfterDiscount, promoDiscount = 0, appliedPromo, tax, total, shippingCost, user }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [includeVat, setIncludeVat] = useState(true);
    const initialPhone = splitPhone(user?.phone || '');
    const [formData, setFormData] = useState({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        countryCode: initialPhone.countryCode,
        phoneLocal: initialPhone.phoneLocal,
        address: user?.street || '',
        city: user?.city || '',
        country: user?.country || 'Tanzania',
    });

    const baseSubtotal = subtotalAfterDiscount ?? Math.max(0, subtotal - promoDiscount);
    const vatAmount  = includeVat ? baseSubtotal * VAT_RATE : 0;
    const grandTotal = baseSubtotal + shippingCost + vatAmount;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;

        if (id === 'phoneLocal') {
            const digitsOnly = value.replace(/\D/g, '').replace(/^0+/, '');
            setFormData(prev => ({ ...prev, phoneLocal: digitsOnly }));
            return;
        }

        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.phoneLocal || formData.phoneLocal.startsWith('0')) {
            alert('Please enter phone number without starting 0. Example for +255: 784419707');
            return;
        }

        setIsProcessing(true);
        router.post('/store/checkout', {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            country_code: formData.countryCode,
            phone: formData.phoneLocal,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            include_vat: includeVat,
            vat_amount: vatAmount,
            grand_total: grandTotal,
        }, {
            onFinish: () => setIsProcessing(false),
        });
    };

    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-US').format(Math.round(amt)) + ' TSH';

    return (
        <CustomLayout>
            <Head title="Checkout" />

            <div className="min-h-screen bg-slate-50">
                {/* Hero */}
                <section className="relative bg-amber-400 text-slate-900 overflow-hidden py-8">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300/50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />
                    <div className="mx-auto w-[99%] max-w-[1920px] px-2 sm:px-4 relative z-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-amber-300/50 shadow-xl shadow-amber-950/10">
                                <Lock className="w-5 h-5 text-slate-900" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 tracking-[0.2em]">Secure Transaction Layer</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Secure Checkout</h1>
                        <p className="text-xs text-slate-800 max-w-2xl mx-auto font-normal">Finalize your order through our encrypted gateway.</p>
                    </div>
                </section>

                <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4 py-8">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* LEFT: Delivery Information only */}
                        <div>
                            <div className="bg-white rounded-xl p-8 border shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Truck className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Delivery Information</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-xs font-bold text-slate-500">First Name</Label>
                                        <Input id="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="John" className={FIELD_CLASS} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-xs font-bold text-slate-500">Last Name</Label>
                                        <Input id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" className={FIELD_CLASS} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-bold text-slate-500">Email Address</Label>
                                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="name@example.com" className={FIELD_CLASS} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneLocal" className="text-xs font-bold text-slate-500">Phone</Label>
                                        <div className="h-12 rounded-md border border-slate-200 bg-slate-50/70 flex items-stretch overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
                                            <select
                                                id="countryCode"
                                                value={formData.countryCode}
                                                onChange={handleInputChange}
                                                className="h-full min-w-[86px] bg-transparent px-2 text-sm font-semibold text-slate-800 border-r border-slate-200 focus:outline-none"
                                            >
                                                {COUNTRY_CODE_OPTIONS.map((opt) => (
                                                    <option key={opt.iso2} value={opt.dialCode}>
                                                        {isoToFlag(opt.iso2)} +{opt.dialCode}
                                                    </option>
                                                ))}
                                            </select>
                                            <Input
                                                id="phoneLocal"
                                                value={formData.phoneLocal}
                                                onChange={handleInputChange}
                                                required
                                                inputMode="numeric"
                                                pattern="[1-9][0-9]{5,14}"
                                                placeholder="784419707"
                                                className="h-full border-0 bg-transparent rounded-none shadow-none focus-visible:ring-0 text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            Use number without leading 0. Example for +{formData.countryCode}: 784419707
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="address" className="text-xs font-bold text-slate-500">Street Address</Label>
                                    <Input id="address" value={formData.address} onChange={handleInputChange} required placeholder="Street, area, house/building" className={FIELD_CLASS} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-xs font-bold text-slate-500">City</Label>
                                        <Input id="city" value={formData.city} onChange={handleInputChange} placeholder="Dar es Salaam" className={FIELD_CLASS} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="text-xs font-bold text-slate-500">Country</Label>
                                        <Input id="country" value={formData.country} onChange={handleInputChange} placeholder="Tanzania" className={FIELD_CLASS} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Order Summary */}
                        <div className="space-y-4">
                            <div className="bg-yellow-50 text-slate-800 rounded-xl p-8 shadow-lg sticky top-8 border border-yellow-200">
                                <h2 className="text-xl font-bold mb-8 border-b border-yellow-200 pb-4 tracking-tight text-slate-900">
                                    Order Summary
                                </h2>

                                {/* Cart Items */}
                                <div className="space-y-6 max-h-[300px] overflow-y-auto mb-8 pr-2">
                                    {cartItems && cartItems.map((item, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="w-16 h-16 bg-yellow-100 rounded-lg overflow-hidden flex-shrink-0 border border-yellow-200">
                                                {item.product_image ? (
                                                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-yellow-600 text-2xl">📦</div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-semibold text-sm line-clamp-1 text-slate-900">{item.product_name}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-slate-600">Qty: {item.quantity} {item.unit}</p>
                                                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="space-y-3 pt-6 border-t border-yellow-200">
                                    <div className="flex justify-between text-xs font-medium text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {promoDiscount > 0 && (
                                        <>
                                            <div className="flex justify-between text-xs font-medium text-emerald-700">
                                                <span>Promo ({appliedPromo?.code})</span>
                                                <span className="font-semibold">-{formatCurrency(promoDiscount)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-medium text-slate-600">
                                                <span>Discounted Subtotal</span>
                                                <span className="font-semibold text-slate-900">{formatCurrency(baseSubtotal)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between text-xs font-medium text-slate-600">
                                        <span>Shipping</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(shippingCost)}</span>
                                    </div>

                                    {/* VAT Toggle Row */}
                                    <div className="flex items-center justify-between py-3 px-4 bg-yellow-100 rounded-lg border border-yellow-200 mt-2">
                                        <div className="flex items-center gap-3">
                                            <Receipt className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-900">VAT (18%)</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {includeVat ? formatCurrency(vatAmount) : 'Not applied'}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Toggle Switch */}
                                        <button
                                            type="button"
                                            onClick={() => setIncludeVat(v => !v)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                                includeVat ? 'bg-slate-800' : 'bg-yellow-200'
                                            }`}
                                            aria-label="Toggle VAT"
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                                                    includeVat ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Grand Total */}
                                    <div className="flex justify-between items-center pt-4 border-t border-yellow-200 mt-2">
                                        <span className="text-sm font-bold text-slate-900">Total Payable</span>
                                        <span className="text-3xl font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <Link href="/my-carts" className="h-16 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors font-bold text-sm">
                                        <ChevronLeft className="w-4 h-4" />
                                        Modify Cart
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="h-16 bg-amber-400 hover:bg-amber-500 text-slate-900 text-base font-bold transition-all shadow-xl shadow-amber-300/40 active:scale-[0.98]"
                                    >
                                        {isProcessing ? 'Processing Order...' : 'Confirm Order'}
                                    </Button>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-medium ">
                                    <Lock className="w-3 h-3" />
                                    Secure SSL Encryption
                                </div>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
        </CustomLayout>
    );
}
