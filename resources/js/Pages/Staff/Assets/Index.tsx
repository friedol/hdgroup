import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Boxes, Plus, Trash2, UserCheck, Undo2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Assets', href: '/hr/assets' },
];

interface Employee {
    id: number;
    name: string;
}

interface CurrentAssignment {
    id: number;
    user?: Employee;
}

interface AssetItem {
    id: number;
    asset_tag: string;
    name: string;
    category: string | null;
    serial_number: string | null;
    condition: string;
    status: string;
    notes: string | null;
    current_assignment?: CurrentAssignment | null;
}

interface Props {
    assets: AssetItem[];
    employees: Employee[];
}

const STATUS_STYLES: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    assigned: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-amber-100 text-amber-700',
    retired: 'bg-neutral-100 text-neutral-500',
};

function AddAssetDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        asset_tag: '', name: '', category: '', serial_number: '',
        purchase_date: '', purchase_value: '', condition: 'good', notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.assets.store'), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> Register Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-sm font-bold">Register Company Asset</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Asset Tag *</Label>
                            <Input value={data.asset_tag} onChange={(e) => setData('asset_tag', e.target.value)} className="text-xs" placeholder="e.g. AST-0001" />
                            {errors.asset_tag && <p className="text-xs text-rose-600">{errors.asset_tag}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Name *</Label>
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="text-xs" />
                            {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Category</Label>
                            <Input value={data.category} onChange={(e) => setData('category', e.target.value)} className="text-xs" placeholder="e.g. laptop" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Serial Number</Label>
                            <Input value={data.serial_number} onChange={(e) => setData('serial_number', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Purchase Date</Label>
                            <Input type="date" value={data.purchase_date} onChange={(e) => setData('purchase_date', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Purchase Value (TZS)</Label>
                            <Input type="number" value={data.purchase_value} onChange={(e) => setData('purchase_value', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Condition *</Label>
                        <Select value={data.condition} onValueChange={(v) => setData('condition', v)}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new" className="text-xs">New</SelectItem>
                                <SelectItem value="good" className="text-xs">Good</SelectItem>
                                <SelectItem value="fair" className="text-xs">Fair</SelectItem>
                                <SelectItem value="poor" className="text-xs">Poor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Notes</Label>
                        <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="text-xs" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Register'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AssignAssetDialog({ asset, employees }: { asset: AssetItem; employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        user_id: '', assigned_date: new Date().toISOString().slice(0, 10), condition_at_assignment: asset.condition, notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.assets.assign', asset.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-7 gap-1 bg-indigo-600 px-2 text-[11px] font-bold text-white hover:bg-indigo-700">
                    <UserCheck className="h-3 w-3" /> Assign
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-sm font-bold">Assign {asset.name}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Employee *</Label>
                        <Select value={data.user_id} onValueChange={(v) => setData('user_id', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
                            <SelectContent>
                                {employees.map((e) => (
                                    <SelectItem key={e.id} value={String(e.id)} className="text-xs">{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.user_id && <p className="text-xs text-rose-600">{errors.user_id}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Assigned Date *</Label>
                        <Input type="date" value={data.assigned_date} onChange={(e) => setData('assigned_date', e.target.value)} className="text-xs" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Assigning...' : 'Assign'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AssetsIndex({ assets, employees }: Props) {
    const returnAsset = (assignmentId: number) => {
        router.post(route('hr.assets.return', assignmentId), {}, { preserveScroll: true });
    };

    const removeAsset = (asset: AssetItem) => {
        if (confirm(`Remove asset ${asset.name}?`)) {
            router.delete(route('hr.assets.destroy', asset.id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assets" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">Assets</h1>
                    </div>
                    <AddAssetDialog />
                </div>

                <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                    <Table>
                        <TableHeader className="bg-neutral-50/50">
                            <TableRow>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Asset</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Category</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Condition</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Assigned To</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map((a) => (
                                <TableRow key={a.id} className="hover:bg-neutral-50/80">
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                                            <Boxes className="h-3 w-3 text-neutral-400" /> {a.name}
                                        </div>
                                        <p className="text-[11px] text-neutral-400">{a.asset_tag}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs capitalize text-neutral-600">{a.category || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-xs capitalize text-neutral-600">{a.condition}</TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[a.status]}`}>{a.status}</Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">
                                        {a.current_assignment?.user?.name || '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {a.status === 'available' && <AssignAssetDialog asset={a} employees={employees} />}
                                            {a.status === 'assigned' && a.current_assignment && (
                                                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px] font-bold" onClick={() => returnAsset(a.current_assignment!.id)}>
                                                    <Undo2 className="h-3 w-3" /> Return
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeAsset(a)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {assets.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="py-16 text-center text-xs text-neutral-400">No assets registered yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </AppLayout>
    );
}
