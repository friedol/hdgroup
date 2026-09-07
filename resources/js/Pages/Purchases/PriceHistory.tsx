import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download } from 'lucide-react';

export default function PriceHistory({ history }: any) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchases', href: '/purchases' },
        { title: 'Price History', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Price History" />
            
            <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Price History</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Log of all historical product price changes.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a 
                            href="/purchases/price-history/print?print=true"
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </a>
                        <a 
                            href="/purchases/price-history/print?download=true"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                    </div>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Old Buy Price</TableHead>
                                <TableHead>New Buy Price</TableHead>
                                <TableHead>Old Sell Price</TableHead>
                                <TableHead>New Sell Price</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!history || history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No price history logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{record.product?.product_name || 'Unknown Product'}</TableCell>
                                        <TableCell className="text-muted-foreground">{record.product?.product_management?.unit_name || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground line-through">TZS {record.previous_buying_price}</TableCell>
                                        <TableCell className="text-green-600">TZS {record.new_buying_price}</TableCell>
                                        <TableCell className="text-muted-foreground line-through">TZS {record.previous_selling_price}</TableCell>
                                        <TableCell className="text-green-600">TZS {record.new_selling_price}</TableCell>
                                        <TableCell>{record.reason || 'Manual Update'}</TableCell>
                                        <TableCell>{record.user?.staff_name || record.user?.name}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
