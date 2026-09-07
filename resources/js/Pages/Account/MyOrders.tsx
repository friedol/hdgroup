import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Package, Eye, Clock, Truck, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomLayout from '@/layouts/app/custom-layout';

interface OrderItem {
    product_name: string;
    quantity: number;
    price: number;
    image?: string;
}

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    amount_paid: number;
    status: string;
    payment_status: string;
    created_at: string;
    items: OrderItem[];
}

interface Props {
    orders: Order[];
}

const PIPELINE = ['pending', 'confirmed', 'processing', 'in_transit', 'delivered'] as const;
const PIPELINE_LABELS: Record<string, string> = {
    pending: 'Ordered', confirmed: 'Confirmed', processing: 'Processing',
    in_transit: 'In Transit', delivered: 'Delivered',
};

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
    pending:    { label: 'Pending',    dot: 'bg-blue-400',    text: 'text-blue-700' },
    confirmed:  { label: 'Confirmed',  dot: 'bg-blue-400',    text: 'text-blue-700' },
    processing: { label: 'Processing', dot: 'bg-violet-400',  text: 'text-violet-700' },
    in_transit: { label: 'In Transit', dot: 'bg-orange-400',  text: 'text-orange-700' },
    delivered:  { label: 'Delivered',  dot: 'bg-emerald-500', text: 'text-emerald-700' },
    rejected:   { label: 'Rejected',   dot: 'bg-rose-400',    text: 'text-rose-700' },
    cancelled:  { label: 'Cancelled',  dot: 'bg-slate-400',   text: 'text-slate-600' },
};

const paymentConfig: Record<string, { label: string; cls: string }> = {
    paid:    { label: 'Paid',    cls: 'bg-emerald-100 text-emerald-700' },
    partial: { label: 'Partial', cls: 'bg-blue-100 text-blue-700' },
    unpaid:  { label: 'Unpaid',  cls: 'bg-rose-100 text-rose-700' },
};

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'processing', 'in_transit']);
const DONE_STATUSES   = new Set(['delivered', 'rejected', 'cancelled']);

function MiniPipeline({ status }: { status: string }) {
    if (!PIPELINE.includes(status as (typeof PIPELINE)[number])) return null;
    const currentIdx = PIPELINE.indexOf(status as (typeof PIPELINE)[number]);
    return (
        <div className="flex items-center w-full mt-3">
            {PIPELINE.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isCurrent   = idx === currentIdx;
                return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${isCompleted ? 'bg-emerald-400' : isCurrent ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-slate-200'}`} />
                            <span className={`text-[9px] font-bold mt-1 whitespace-nowrap ${isCompleted ? 'text-emerald-500' : isCurrent ? 'text-blue-600' : 'text-slate-300'}`}>
                                {PIPELINE_LABELS[step]}
                            </span>
                        </div>
                        {idx < PIPELINE.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-3 mx-0.5 ${idx < currentIdx ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function OrderCard({ order }: { order: Order }) {
    const cfg    = statusConfig[order.status] ?? statusConfig.pending;
    const payCfg = paymentConfig[order.payment_status] ?? paymentConfig.unpaid;
    const isActive = ACTIVE_STATUSES.has(order.status);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[13px] font-extrabold text-slate-800 truncate">#{order.order_number}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-[15px] font-extrabold text-slate-900">TZS {order.total_amount.toLocaleString()}</p>
                    <div className="flex gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.text} bg-slate-50 border border-slate-100`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${payCfg.cls}`}>{payCfg.label}</span>
                    </div>
                </div>
            </div>

            <div className="px-5 py-3 border-b border-slate-50 space-y-1.5">
                {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                        <span className="text-[12px] font-semibold text-slate-700 truncate max-w-[62%]">{item.product_name}</span>
                        <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                            x{item.quantity} · TZS {item.price.toLocaleString()}
                        </span>
                    </div>
                ))}
                {order.items.length > 3 && (
                    <p className="text-[11px] text-slate-400 font-medium">
                        +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {isActive && (
                <div className="px-5 pt-3 pb-1">
                    <MiniPipeline status={order.status} />
                </div>
            )}

            {order.status === 'rejected' && (
                <div className="mx-5 my-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <p className="text-[11px] text-rose-600 font-semibold">This order was rejected by the store.</p>
                </div>
            )}

            <div className="px-5 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    {order.status === 'delivered'  && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {order.status === 'in_transit' && <Truck className="w-3.5 h-3.5 text-orange-400" />}
                    {order.status === 'processing' && <Clock className="w-3.5 h-3.5 text-violet-400" />}
                    {(order.status === 'pending' || order.status === 'confirmed') && <Package className="w-3.5 h-3.5 text-blue-400" />}
                    <span className={`text-[11px] font-bold ${cfg.text}`}>{cfg.label}</span>
                    {order.amount_paid > 0 && order.payment_status !== 'paid' && (
                        <span className="text-[10px] text-slate-400 font-medium ml-2">
                            Paid {order.amount_paid.toLocaleString()} / {order.total_amount.toLocaleString()}
                        </span>
                    )}
                </div>
                <Link href={`/account/order-tracking/${order.order_number}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-[11px] font-bold h-8 px-3">
                        <Eye className="w-3.5 h-3.5" />
                        {isActive ? 'Track' : 'View'}
                    </Button>
                </Link>
            </div>
        </div>
    );
}

type Tab = 'all' | 'active' | 'history';

export default function MyOrders({ orders = [] }: Props) {
    const [tab, setTab] = useState<Tab>('all');

    const active  = orders.filter(o => ACTIVE_STATUSES.has(o.status));
    const history = orders.filter(o => DONE_STATUSES.has(o.status));
    const displayed = tab === 'active' ? active : tab === 'history' ? history : orders;

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'all',     label: 'All Orders', count: orders.length },
        { key: 'active',  label: 'Active',      count: active.length },
        { key: 'history', label: 'History',     count: history.length },
    ];

    return (
        <CustomLayout>
            <Head title="My Orders" />
            <div className="min-h-screen bg-slate-50">
                <div className="relative bg-blue-600 text-white overflow-hidden border-b border-blue-700/40">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="w-[96%] max-w-[1920px] mx-auto px-4 py-5 flex items-center justify-between relative z-10">
                        <div>
                            <h1 className="text-lg font-extrabold text-white">My Orders</h1>
                            <p className="text-xs text-white/80 font-medium mt-0.5">
                                {orders.length} order{orders.length !== 1 ? 's' : ''} total
                            </p>
                        </div>
                        <Link href="/shop">
                            <Button className="text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white h-9 px-4">
                                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>

                    <div className="w-[96%] max-w-[1920px] mx-auto px-4 flex gap-1 overflow-x-auto relative z-10">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-slate-900'}`}
                            >
                                {t.label}
                                {t.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${tab === t.key ? 'bg-white/60 text-white' : 'bg-white/30 text-white/70'}`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-[96%] max-w-[1920px] mx-auto px-4 py-6">
                    {displayed.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {displayed.map(order => (
                                <OrderCard key={order.order_number} order={order} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 p-14 text-center shadow-sm">
                            <Package className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                            <h2 className="text-base font-extrabold text-slate-900 mb-1">
                                {tab === 'active'  ? 'No active orders' :
                                 tab === 'history' ? 'No completed orders yet' : 'No orders yet'}
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mb-6">
                                {tab === 'all' ? "You haven't placed any orders yet. Start shopping now!" : "Nothing to show here."}
                            </p>
                            {tab === 'all' && (
                                <Link href="/shop">
                                    <Button className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white">Go to Shop</Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </CustomLayout>
    );
}
