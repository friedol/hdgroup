import { Head, Link, usePage } from '@inertiajs/react';
import { Truck, Clock, CheckCircle, Package, ChevronLeft } from 'lucide-react';
import CustomLayout from '@/layouts/app/custom-layout';
import { Button } from '@/components/ui/button';

interface OrderItem {
    product_name: string;
    quantity: number;
    price: number;
    subtotal?: number;
    unit?: string;
}

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    items: OrderItem[];
    estimatedDelivery?: string;
}

interface Props {
    order: Order;
    isGuestTracking?: boolean;
}

const trackingSteps = (order: Order) => [
    {
        key: 'ordered',
        label: 'Ordered',
        icon: Package,
        date: new Date(order.created_at).toLocaleDateString(),
    },
    {
        key: 'processing',
        label: 'Processing',
        icon: Clock,
        date: '24-48 Hours',
    },
    {
        key: 'in_transit',
        label: 'In Transit',
        icon: Truck,
        date: order.estimatedDelivery || '',
    },
    {
        key: 'delivered',
        label: 'Delivered',
        icon: CheckCircle,
        date: '',
    },
];

const statusMap: Record<string, number> = {
    'pending': 0,
    'confirmed': 1,
    'approved': 1,
    'processing': 1,
    'in_transit': 2,
    'delivered': 3,
    'completed': 3,
};

export default function OrderTracking({ order, isGuestTracking = false }: Props) {
    const steps = trackingSteps(order);
    const currentStep = statusMap[order.status?.toLowerCase?.()] ?? 0;

    return (
        <CustomLayout>
            <Head title={`Track Order #${order.order_number}`} />
            <div className="min-h-screen bg-slate-50">
                <div className="w-[96%] max-w-[1920px] mx-auto px-4 py-8">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <Link href={isGuestTracking ? '/order/track' : '/order/history'}>
                            <Button variant="ghost" className="h-9 px-3 text-sm font-bold"><ChevronLeft className="w-4 h-4 mr-2" />#{order.order_number}</Button>
                        </Link>
                        <p className="text-sm font-bold text-slate-500 text-right">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm mb-6">
                        <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-600" />
                            Expedition Roadmap
                        </h3>
                        <div className="relative flex justify-between items-start">
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 -z-0">
                                <div className="h-full bg-blue-600" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>
                            </div>
                            {steps.map((step, idx) => {
                                const Icon = step.icon;
                                const isCompleted = idx < currentStep;
                                const isCurrent = idx === currentStep;
                                return (
                                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-3 text-center group w-1/4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all
                                            ${isCompleted ? 'bg-emerald-400 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}
                                        >
                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className={`text-[11px] md:text-sm font-bold tracking-tight ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                                            <p className={`text-[10px] md:text-xs font-bold ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-slate-900' : 'text-slate-300'}`}>{step.date}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-6">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Manifest of Goods</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="px-5 py-4 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-base">📦</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.product_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-wide">Qty: {item.quantity} {item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">TZS {item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
