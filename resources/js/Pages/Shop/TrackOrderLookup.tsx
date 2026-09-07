import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Package } from 'lucide-react';
import CustomLayout from '@/layouts/app/custom-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    lastOrderNumber?: string | null;
}

export default function TrackOrderLookup({ lastOrderNumber }: Props) {
    const [orderNumber, setOrderNumber] = useState(lastOrderNumber || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!orderNumber.trim()) {
            return;
        }

        setIsSubmitting(true);

        router.post('/order/track', {
            order_number: orderNumber.trim(),
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <CustomLayout>
            <Head title="Track Your Order" />

            <div className="min-h-screen bg-slate-50">
                <section className="relative bg-blue-600 text-white overflow-hidden py-8">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8 relative z-10 text-center">
                        <span className="inline-block bg-white/20 text-white text-xl font-dancing font-bold px-5 py-1.5 rounded-full mb-3 backdrop-blur-sm border border-white/30">Order Status</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Track Your Order</h1>
                        <p className="text-sm text-white/80 max-w-2xl mx-auto">Enter your order number to see delivery status and order details.</p>
                    </div>
                </section>

                <div className="w-[99%] max-w-[720px] mx-auto px-4 py-10">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Package className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">Find Your Order</h2>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="order_number" className="text-xs font-bold text-slate-500">Order Number</Label>
                                <Input
                                    id="order_number"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    placeholder="e.g. ORD_12345678"
                                    className="h-12 border-slate-200"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Searching...' : 'Track Order'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
