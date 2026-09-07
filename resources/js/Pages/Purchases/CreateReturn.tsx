import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';

const PurchaseCombobox = ({ value, onChange, purchases, error }: any) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={`w-full justify-between h-10 px-3 py-1.5 font-normal truncate ${error ? 'border-red-500' : 'border-input'}`}
                    >
                        <span className="truncate">
                            {value
                                ? (purchases.find((p: any) => p.id === value)?.purchase_number || "Select a completed purchase...")
                                : "Select a completed purchase..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search purchase by number or supplier..." />
                        <CommandList>
                            <CommandEmpty>No purchase found.</CommandEmpty>
                            <CommandGroup>
                                {purchases.map((purchase: any) => (
                                    <CommandItem
                                        key={purchase.id}
                                        value={purchase.purchase_number + " " + (purchase.supplier?.supplier_name || '')}
                                        onSelect={() => {
                                            onChange(purchase.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={`mr-2 h-4 w-4 ${
                                                value === purchase.id ? "opacity-100" : "opacity-0"
                                            }`}
                                        />
                                        {purchase.purchase_number} - {purchase.supplier?.supplier_name} ({new Date(purchase.purchase_date).toLocaleDateString()})
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default function CreateReturn({ purchases }: any) {
    const { data, setData, post, processing, errors, transform } = useForm({
        purchase_id: '',
        items: [] as any[]
    });

    transform((data) => ({
        ...data,
        items: data.items.filter(item => item.selected && item.quantity_returned > 0)
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const hasReturns = data.items.some(item => item.selected && item.quantity_returned > 0);
        if (!hasReturns) {
            Swal.fire('Error', 'Please select at least one item and enter a return quantity.', 'error');
            return;
        }

        post('/purchases/returns', {
            onSuccess: () => {
                Swal.fire('Success!', 'Return processed successfully.', 'success');
                setData({ purchase_id: '', items: [] });
            },
            onError: (err) => {
                Swal.fire('Error!', err.error || 'Failed to process return.', 'error');
            }
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchases', href: '/purchases' },
        { title: 'Purchase Returns', href: '/purchases/returns' },
        { title: 'Create Return', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Returns" />
            
            <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Create Return</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Select a purchase to process returns for previously received items.</p>
                    </div>
                </div>

                <div className="rounded-md border bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_id">Select Purchase</Label>
                            <PurchaseCombobox 
                                value={data.purchase_id} 
                                onChange={(val: any) => {
                                    const purchase = purchases.find((p: any) => p.id === val);
                                    if (purchase) {
                                        setData({
                                            ...data,
                                            purchase_id: val,
                                            items: purchase.items.map((item: any) => ({
                                                purchase_item_id: item.id,
                                                product_name: item.product?.product_name,
                                                unit_name: item.product?.product_management?.unit_name || '-',
                                                max_quantity: Number(item.quantity),
                                                quantity_returned: Number(item.quantity),
                                                reason: '',
                                                selected: false
                                            }))
                                        });
                                    } else {
                                        setData('purchase_id', '');
                                    }
                                }} 
                                purchases={purchases} 
                                error={errors.purchase_id} 
                            />
                        </div>

                        {data.purchase_id && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Items to Return</h3>
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-3 text-left w-12">
                                                    <Checkbox 
                                                        checked={data.items.length > 0 && data.items.every(i => i.selected)}
                                                        onCheckedChange={(checked) => {
                                                            const newItems = data.items.map(i => ({...i, selected: !!checked}));
                                                            setData('items', newItems);
                                                        }}
                                                    />
                                                </th>
                                                <th className="p-3 text-left font-medium">Product</th>
                                                <th className="p-3 text-left font-medium">Unit</th>
                                                <th className="p-3 text-left font-medium">Purchased Qty</th>
                                                <th className="p-3 text-left font-medium">Return Qty</th>
                                                <th className="p-3 text-left font-medium">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((item, index) => (
                                                <tr key={item.purchase_item_id} className="border-t">
                                                    <td className="p-3">
                                                        <Checkbox 
                                                            checked={item.selected}
                                                            onCheckedChange={(checked) => {
                                                                const newItems = [...data.items];
                                                                newItems[index].selected = !!checked;
                                                                setData('items', newItems);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-3">{item.product_name}</td>
                                                    <td className="p-3 text-muted-foreground">{item.unit_name}</td>
                                                    <td className="p-3">{item.max_quantity}</td>
                                                    <td className="p-3">
                                                        <Input 
                                                            type="number" 
                                                            min="1" 
                                                            max={item.max_quantity}
                                                            value={item.quantity_returned}
                                                            disabled={!item.selected}
                                                            onChange={e => {
                                                                const newItems = [...data.items];
                                                                newItems[index].quantity_returned = Number(e.target.value);
                                                                setData('items', newItems);
                                                            }}
                                                            className="w-24"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <Input 
                                                            type="text" 
                                                            placeholder="Reason for return..."
                                                            value={item.reason}
                                                            disabled={!item.selected}
                                                            onChange={e => {
                                                                const newItems = [...data.items];
                                                                newItems[index].reason = e.target.value;
                                                                setData('items', newItems);
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={processing || !data.purchase_id}>
                                Process Return
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
