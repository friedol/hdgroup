import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Plus, Printer, Download } from 'lucide-react';

export default function Returns({ returnsHistory = [] }: any) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchases', href: '/purchases' },
        { title: 'Purchase Returns', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Returns" />
            
            <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Purchase Returns</h1>
                        <p className="text-muted-foreground mt-2 text-sm">View history of returned items and process new returns.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a 
                            href="/purchases/returns/print?print=true"
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </a>
                        <a 
                            href="/purchases/returns/print?download=true"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                        <Button asChild>
                            <Link href="/purchases/returns/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Return
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border bg-card mt-8">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold">Return History</h2>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-4 text-left font-medium whitespace-nowrap">Date</th>
                                    <th className="p-4 text-left font-medium whitespace-nowrap">Purchase</th>
                                    <th className="p-4 text-left font-medium whitespace-nowrap">Product</th>
                                    <th className="p-4 text-left font-medium whitespace-nowrap">Unit</th>
                                    <th className="p-4 text-left font-medium whitespace-nowrap">Qty Returned</th>
                                    <th className="p-4 text-left font-medium">Reason</th>
                                    <th className="p-4 text-left font-medium whitespace-nowrap">Processed By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returnsHistory.length > 0 ? (
                                    returnsHistory.map((ret: any) => (
                                        <tr key={ret.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="p-4">{new Date(ret.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium">{ret.purchase?.purchase_number}</td>
                                            <td className="p-4">{ret.product?.product_name || 'Unknown'}</td>
                                            <td className="p-4 text-muted-foreground">{ret.product?.product_management?.unit_name || '-'}</td>
                                            <td className="p-4 text-red-600 font-medium">-{Number(ret.quantity_returned)}</td>
                                            <td className="p-4 text-muted-foreground">{ret.reason}</td>
                                            <td className="p-4">{ret.user?.name}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No return history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
