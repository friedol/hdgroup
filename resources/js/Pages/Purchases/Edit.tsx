import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const ProductCombobox = ({ value, onChange, products, error }: any) => {
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
                                ? (products.find((p: any) => p.id === value)?.product_name || "Select product...")
                                : "Select product..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search product..." />
                        <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                                {products.map((product: any) => (
                                    <CommandItem
                                        key={product.id}
                                        value={product.product_name + " " + product.product_id}
                                        onSelect={() => {
                                            onChange(product.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={`mr-2 h-4 w-4 ${
                                                value === product.id ? "opacity-100" : "opacity-0"
                                            }`}
                                        />
                                        {product.product_name} ({product.product_id})
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

export default function Edit({ purchase, suppliers, products, warehouses }: any) {
    const { data, setData, put, processing, errors } = useForm({
        supplier_id: purchase.supplier_id || '',
        warehouse_id: purchase.warehouse_id || '',
        purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
        total_amount: purchase.total_amount || 0,
        notes: purchase.notes || '',
        invoice_number: purchase.invoice_number || '',
        items: purchase.items.length > 0 ? purchase.items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            buying_price: item.buying_price,
            selling_price: item.selling_price || 0,
            update_buying_price: false,
            update_selling_price: false,
            total: item.total
        })) : [{
            product_id: '',
            quantity: 1,
            buying_price: 0,
            selling_price: 0,
            update_buying_price: false,
            update_selling_price: false,
            total: 0
        }]
    });

    // Auto-calculate grand total whenever items change
    useEffect(() => {
        const total = data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        if (data.total_amount !== total) {
            setData('total_amount', total);
        }
    }, [data.items, data.total_amount]);

    const handleAddItem = () => {
        setData('items', [
            ...data.items, 
            { 
                product_id: '', 
                quantity: 1, 
                buying_price: 0, 
                selling_price: 0, 
                total: 0,
                update_buying_price: false,
                update_selling_price: false
            }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        const item = { ...newItems[index], [field]: value };

        // Auto calculate total for the line item
        if (field === 'quantity' || field === 'buying_price') {
            const qty = field === 'quantity' ? Number(value) : Number(item.quantity);
            const price = field === 'buying_price' ? Number(value) : Number(item.buying_price);
            item.total = qty * price;
        }
        
        // Auto-fill prices when product is selected
        if (field === 'product_id') {
            const product = products.find((p: any) => p.id.toString() === value.toString());
            if (product) {
                item.buying_price = product.cost_price || 0;
                item.selling_price = product.price || 0;
                item.total = item.quantity * item.buying_price;
            }
        }

        newItems[index] = item;
        setData('items', newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/purchases/${purchase.id}`, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Success!',
                    text: 'Purchase updated successfully.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6'
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to update purchase. Please check the form for errors.',
                    icon: 'error',
                    confirmButtonColor: '#d33'
                });
            }
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchases', href: '/purchases' },
        { title: `Edit ${purchase.purchase_number}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${purchase.purchase_number}`} />
            
            <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Edit {purchase.purchase_number}</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Record inbound stock, set pricing rules, and add to inventory.</p>
                    </div>
                </div>

                <div className="rounded-md border bg-card p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="supplier_id">Supplier <span className="text-red-500">*</span></Label>
                                <select 
                                    id="supplier_id"
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm h-10"
                                    value={data.supplier_id}
                                    onChange={e => setData('supplier_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select a supplier...</option>
                                    {suppliers.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.supplier_name}</option>
                                    ))}
                                </select>
                                {errors.supplier_id && <p className="text-red-500 text-sm">{errors.supplier_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="warehouse_id">Warehouse (Optional)</Label>
                                <select 
                                    id="warehouse_id"
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm h-10"
                                    value={data.warehouse_id}
                                    onChange={e => setData('warehouse_id', e.target.value)}
                                >
                                    <option value="">Default Warehouse</option>
                                    {warehouses.map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.store_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purchase_date">Purchase Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="purchase_date" 
                                    type="date" 
                                    value={data.purchase_date}
                                    onChange={e => setData('purchase_date', e.target.value)}
                                    required
                                />
                                {errors.purchase_date && <p className="text-red-500 text-sm">{errors.purchase_date}</p>}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-lg font-medium">Purchase Items</h3>
                                <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="gap-2">
                                    <Plus size={16} /> Add Product
                                </Button>
                            </div>
                            
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[25%]">Product</TableHead>
                                            <TableHead className="w-[10%]">Unit</TableHead>
                                            <TableHead className="w-[12%]">Quantity</TableHead>
                                            <TableHead className="w-[15%]">Buy Price</TableHead>
                                            <TableHead className="w-[15%]">Sell Price</TableHead>
                                            <TableHead className="w-[15%]">Total</TableHead>
                                            <TableHead className="w-[10%] text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                                                    No items added. Click "Add Product" to begin.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.items.map((item, index) => (
                                                <TableRow key={index} className="group">
                                                    <TableCell className="align-top pt-4">
                                                        <ProductCombobox 
                                                            value={item.product_id}
                                                            onChange={(val: any) => handleItemChange(index, 'product_id', val)}
                                                            products={products}
                                                            error={(errors as any)[`items.${index}.product_id`] ? "Product is required" : null}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-top pt-6 text-muted-foreground">
                                                        {item.product_id ? (products.find((p: any) => p.id === item.product_id)?.product_management?.unit_name || '-') : '-'}
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4">
                                                        <Input 
                                                            type="number" 
                                                            min="1" 
                                                            step="any"
                                                            value={item.quantity}
                                                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                            required
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4 space-y-2">
                                                        <Input 
                                                            type="number" 
                                                            step="0.01" 
                                                            value={item.buying_price}
                                                            onChange={e => handleItemChange(index, 'buying_price', e.target.value)}
                                                            required
                                                        />
                                                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={item.update_buying_price}
                                                                onChange={e => handleItemChange(index, 'update_buying_price', e.target.checked)}
                                                                className="rounded border-gray-300"
                                                            />
                                                            Update Master
                                                        </label>
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4 space-y-2">
                                                        <Input 
                                                            type="number" 
                                                            step="0.01" 
                                                            value={item.selling_price}
                                                            onChange={e => handleItemChange(index, 'selling_price', e.target.value)}
                                                        />
                                                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={item.update_selling_price}
                                                                onChange={e => handleItemChange(index, 'update_selling_price', e.target.checked)}
                                                                className="rounded border-gray-300"
                                                            />
                                                            Update Master
                                                        </label>
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4">
                                                        <div className="font-medium h-10 flex items-center">
                                                            TZS {Number(item.total).toFixed(2)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top pt-4 text-right">
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Footer & Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]"
                                    placeholder="Add any internal notes about this purchase..."
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex flex-col justify-end items-end space-y-4">
                                <div className="flex items-center gap-4 text-xl">
                                    <span className="font-medium text-muted-foreground">Grand Total:</span>
                                    <span className="font-bold text-2xl">TZS {Number(data.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex gap-4 w-full justify-end">
                                    <Button variant="outline" type="button" onClick={() => window.history.back()} className="w-32">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing || data.items.length === 0} className="w-48">
                                        {processing ? 'Saving...' : 'Update Purchase'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
