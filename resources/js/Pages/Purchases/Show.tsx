import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, FileText } from 'lucide-react';

export default function Show({ purchase }: any) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchases', href: '/purchases' },
        { title: purchase.purchase_number, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Purchase ${purchase.purchase_number}`} />
            
            <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/purchases">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-none">
                                    {purchase.purchase_number}
                                </h1>
                                <Badge variant={purchase.status === 'Completed' ? 'default' : 'secondary'}>
                                    {purchase.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Recorded on {new Date(purchase.purchase_date).toLocaleDateString()} by {purchase.user?.name || 'Unknown User'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={`/purchases/${purchase.id}/print?print=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </a>
                        <a
                            href={`/purchases/${purchase.id}/pdf`}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 h-9 px-4 py-2 rounded-md"
                        >
                            <FileText className="h-4 w-4" />
                            Download PDF
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-semibold text-slate-700">Supplier Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            <div className="grid grid-cols-3">
                                <span className="text-muted-foreground text-sm">Name:</span>
                                <span className="col-span-2 font-medium">{purchase.supplier?.supplier_name || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3">
                                <span className="text-muted-foreground text-sm">Phone:</span>
                                <span className="col-span-2">{purchase.supplier?.phone || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3">
                                <span className="text-muted-foreground text-sm">Email:</span>
                                <span className="col-span-2">{purchase.supplier?.email || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-semibold text-slate-700">Purchase Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            <div className="grid grid-cols-3">
                                <span className="text-muted-foreground text-sm">Invoice #:</span>
                                <span className="col-span-2 font-medium">{purchase.invoice_number || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3">
                                <span className="text-muted-foreground text-sm">Warehouse:</span>
                                <span className="col-span-2">{purchase.warehouse?.store_name || 'Default Warehouse'}</span>
                            </div>
                            <div className="grid grid-cols-3">
                                <span className="text-muted-foreground text-sm">Notes:</span>
                                <span className="col-span-2 text-sm">{purchase.notes || 'None'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-0 border-b">
                        <CardTitle className="text-sm font-semibold text-slate-700 pb-4">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-12 text-center">#</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!purchase.items || purchase.items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No items found for this purchase.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchase.items.map((item: any, index: number) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell className="font-medium">
                                                {item.product?.product_name}
                                                <div className="text-xs text-muted-foreground font-normal">
                                                    SKU: {item.product?.product_id}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{item.product?.product_management?.unit_name || '-'}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">TZS {Number(item.buying_price).toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium text-slate-900">
                                                TZS {Number(item.total).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        
                        <div className="border-t p-6 bg-slate-50 flex justify-end">
                            <div className="flex items-center gap-6 text-xl">
                                <span className="font-medium text-slate-600">Grand Total:</span>
                                <span className="font-bold text-2xl text-slate-900">TZS {Number(purchase.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
