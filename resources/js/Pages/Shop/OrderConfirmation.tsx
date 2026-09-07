import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle, Truck, Package, Clock, ChevronRight, MessageCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomLayout from '@/layouts/app/custom-layout';

interface OrderItem {
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
    unit: string;
}

interface Props {
    order: {
        id: number;
        order_number: string;
        total_amount: number;
        subtotal: number;
        promo_discount?: number;
        tax: number;
        shipping_cost: number;
        status: string;
        payment_status: string;
        created_at: string;
        items: OrderItem[];
    };
    estimatedDelivery: string;
    trackingUrl: string;
}

export default function OrderConfirmation({ order, estimatedDelivery, trackingUrl }: Props) {
    const { activeBranch, businessWhatsapp } = usePage().props as any;
    const whatsappSource = businessWhatsapp || activeBranch?.phone || '';
    const whatsappNum = String(whatsappSource).replace(/[^0-9]/g, '');
    const whatsappLink = `https://wa.me/${whatsappNum}?text=Hello,%20I%20would%20like%20to%20follow%20up%20on%20my%20order%20%23${order.order_number}`;

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('en-US').format(amt) + ' TSH';
    }

    return (
        <CustomLayout>
            <Head title="Order Confirmed" />

            <div className="min-h-screen bg-slate-50">
                {/* Success Banner */}
                <div className="bg-blue-600 text-white py-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8 text-center relative z-10">
                        <span className="inline-block bg-white/20 text-white text-xl font-dancing font-bold px-5 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/30">Order Confirmed</span>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-4">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Order Confirmed!</h1>
                        <p className="text-sm text-white/80 max-w-2xl mx-auto font-normal">
                            Your order <span className="text-white font-bold">#{order.order_number}</span> is now being processed by our logistics team.
                        </p>
                    </div>
                </div>

                <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 pt-8 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary Cards */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Order Status Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">Order #</p>
                                    <p className="text-sm font-bold text-slate-900">{order.order_number}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">Status</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <p className="text-sm font-bold text-emerald-600 capitalize">{order.status}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">Payment</p>
                                    <p className="text-sm font-bold text-slate-900 capitalize">{order.payment_status}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 mb-1">Date</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Logistics Tracking */}
                            <div className="bg-white rounded-lg p-8 border shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                                    <Truck className="w-6 h-6 text-blue-600" />
                                    Expedition Roadmap
                                </h3>
                                
                                <div className="relative flex justify-between items-start">
                                    {/* Line */}
                                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-100 -z-0">
                                        <div className="h-full bg-blue-600 w-1/3"></div>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center gap-4 text-center group">
                                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black tracking-tight text-slate-900">Ordered</p>
                                            <p className="text-[10px] font-medium text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center gap-4 text-center group">
                                        <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 text-slate-300 flex items-center justify-center">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black tracking-tight text-slate-400">Processing</p>
                                            <p className="text-[10px] font-medium text-slate-300">24-48 Hours</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center gap-4 text-center group">
                                        <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 text-slate-300 flex items-center justify-center">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black tracking-tight text-slate-400">Delivery</p>
                                            <p className="text-[10px] font-medium text-slate-300">{estimatedDelivery}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Manifest */}
                            <div className="bg-white rounded-lg overflow-hidden border shadow-sm">
                                <div className="px-8 py-6 border-b bg-slate-50/50">
                                    <h3 className="font-black text-slate-900 tracking-tighter">Manifest of Goods</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="px-8 py-6 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-xl">📦</div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.product_name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 ">Qty: {item.quantity} {item.unit}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">{formatCurrency(item.subtotal)}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{formatCurrency(item.price)} / unit</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Financial Ledger Widget */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg p-8 border shadow-sm sticky top-8">
                                <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight border-b pb-4">Financial Ledger</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 ">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    {(order.promo_discount || 0) > 0 && (
                                        <div className="flex justify-between items-center text-xs font-bold text-emerald-700 ">
                                            <span>Promo Discount</span>
                                            <span>-{formatCurrency(order.promo_discount || 0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 ">
                                        <span>Logistics</span>
                                        <span className="text-slate-900">{formatCurrency(order.shipping_cost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 ">
                                        <span>Tax (VAT)</span>
                                        <span className="text-slate-900">{formatCurrency(order.tax)}</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-dashed border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-900 ">Grand Total</span>
                                            <span className="text-2xl font-black text-blue-600 tracking-tighter">{formatCurrency(order.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-row gap-2 sm:gap-3">
                                    <Link href="/shop" className="w-full flex-1">
                                        <Button className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black rounded-md transition-all active:scale-95 shadow-lg shadow-red-300/30 px-2 sm:px-4 text-xs sm:text-sm">
                                            <ShoppingBag className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                                            <span className="truncate">Store</span>
                                        </Button>
                                    </Link>
                                    <Link href={trackingUrl} className="w-full flex-1">
                                        <Button type="button" variant="outline" className="w-full h-14 border-2 border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold rounded-md transition-all px-2 sm:px-4 text-xs sm:text-sm">
                                            <Truck className="w-4 h-4 mr-2" />
                                            Track Order
                                        </Button>
                                    </Link>
                                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full flex-1">
                                        <Button type="button" variant="outline" className="w-full h-14 border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-600 font-semibold rounded-md transition-all px-2 sm:px-4 text-xs sm:text-sm">
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            WhatsApp
                                        </Button>
                                    </a>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                        An invoice has been sent to your email. For support, please reference ID: <span className="text-slate-900">{order.order_number}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
