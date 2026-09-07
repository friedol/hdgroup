import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Download, Pencil, Trash2, MoreHorizontal, CheckCircle, Printer, Undo } from 'lucide-react';

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    total_amount: number;
    status: string;
    supplier: {
        supplier_name: string;
    };
    warehouse: {
        name: string;
    } | null;
}

interface IndexProps {
    purchases: {
        data: Purchase[];
        links: any[];
    };
}

export default function Index({ purchases }: { purchases: any }) {
    const handleReceive = (id: number) => {
        Swal.fire({
            title: 'Mark as Received?',
            text: "This will add the items to your inventory. This action cannot be reversed except via Returns.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, receive it!'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(`/purchases/${id}/receive`, {}, {
                    onSuccess: () => {
                        Swal.fire(
                            'Received!',
                            'Purchase has been marked as completed and inventory updated.',
                            'success'
                        )
                    },
                    onError: (errors) => {
                        Swal.fire(
                            'Error!',
                            errors.error || 'Failed to receive purchase.',
                            'error'
                        )
                    }
                });
            }
        });
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/purchases/${id}`, {
                    onSuccess: () => {
                        Swal.fire(
                            'Deleted!',
                            'Purchase has been deleted.',
                            'success'
                        )
                    },
                    onError: (errors) => {
                        Swal.fire(
                            'Error!',
                            errors.error || 'Failed to delete purchase.',
                            'error'
                        )
                    }
                });
            }
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchases', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchases" />
            
            <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Purchases</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <a 
                            href="/purchases/print?print=true"
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </a>
                        <a 
                            href="/purchases/print?download=true"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                        <Link href="/purchases/create">
                            <Button size="sm" className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Purchase
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Purchase No.</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No purchases found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                purchases.data.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                                        <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                                        <TableCell>{purchase.supplier?.supplier_name}</TableCell>
                                        <TableCell>{purchase.warehouse?.store_name || 'N/A'}</TableCell>
                                        <TableCell className="text-right">TZS {Number(purchase.total_amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={purchase.status === 'Completed' ? 'default' : 'secondary'}>
                                                {purchase.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/purchases/${purchase.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/purchases/${purchase.id}/pdf`}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download PDF
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/purchases/${purchase.id}/print?print=true`} target="_blank" rel="noopener noreferrer">
                                                            <Printer className="mr-2 h-4 w-4" />
                                                            Print Receipt
                                                        </a>
                                                    </DropdownMenuItem>
                                                    {purchase.status !== 'Completed' && purchase.status !== 'Received' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleReceive(purchase.id)} className="text-green-600 focus:text-green-600 focus:bg-green-50 cursor-pointer">
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Mark as Received
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/purchases/${purchase.id}/edit`}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit Purchase
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDelete(purchase.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Purchase
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {purchase.status === 'Completed' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/purchases/returns/create?purchase_id=${purchase.id}`}>
                                                                    <Undo className="mr-2 h-4 w-4" />
                                                                    Return Purchase
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
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
