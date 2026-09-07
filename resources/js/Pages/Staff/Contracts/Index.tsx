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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Edit2, FileSignature, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Contracts', href: '/hr/contracts' },
];

interface Employee {
    id: number;
    name: string;
}

interface ContractItem {
    id: number;
    user_id: number;
    user?: Employee;
    contract_type: string;
    start_date: string;
    end_date: string | null;
    salary: string | null;
    terms: string | null;
    document_path: string | null;
    status: string;
    signed_at: string | null;
    expiring_soon: boolean;
}

interface Props {
    contracts: ContractItem[];
    employees: Employee[];
}

const CONTRACT_TYPES = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'fixed_term', label: 'Fixed Term' },
    { value: 'probation', label: 'Probation' },
    { value: 'internship', label: 'Internship' },
];

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-neutral-100 text-neutral-600',
    terminated: 'bg-rose-100 text-rose-700',
};

function ContractFormFields({ data, setData, errors, employees }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <Label className="text-xs font-bold">Employee *</Label>
                <Select value={String(data.user_id)} onValueChange={(v) => setData('user_id', v)}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                        {employees.map((e: Employee) => (
                            <SelectItem key={e.id} value={String(e.id)} className="text-xs">{e.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.user_id && <p className="text-xs text-rose-600">{errors.user_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Contract Type *</Label>
                    <Select value={data.contract_type} onValueChange={(v) => setData('contract_type', v)}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {CONTRACT_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Status *</Label>
                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active" className="text-xs">Active</SelectItem>
                            <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                            <SelectItem value="terminated" className="text-xs">Terminated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Start Date *</Label>
                    <Input type="date" value={data.start_date} onChange={(e: any) => setData('start_date', e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">End Date</Label>
                    <Input type="date" value={data.end_date} onChange={(e: any) => setData('end_date', e.target.value)} className="text-xs" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Salary (TZS)</Label>
                    <Input type="number" value={data.salary} onChange={(e: any) => setData('salary', e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Signed Date</Label>
                    <Input type="date" value={data.signed_at} onChange={(e: any) => setData('signed_at', e.target.value)} className="text-xs" />
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Terms</Label>
                <Textarea value={data.terms} onChange={(e: any) => setData('terms', e.target.value)} className="text-xs" rows={3} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Contract Document</Label>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={(e: any) => setData('document', e.target.files?.[0] ?? null)} className="text-xs" />
            </div>
        </div>
    );
}

function AddContractDialog({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm<any>({
        user_id: '', contract_type: 'permanent', start_date: '', end_date: '',
        salary: '', terms: '', status: 'active', signed_at: '', document: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.contracts.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> New Contract
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-sm font-bold">New Employee Contract</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <ContractFormFields data={data} setData={setData} errors={errors} employees={employees} />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Create Contract'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditContractDialog({ contract, employees, open, onOpenChange }: { contract: ContractItem; employees: Employee[]; open: boolean; onOpenChange: (v: boolean) => void }) {
    const { data, setData, post, processing, errors, transform } = useForm<any>({
        user_id: contract.user_id, contract_type: contract.contract_type, start_date: contract.start_date,
        end_date: contract.end_date ?? '', salary: contract.salary ?? '', terms: contract.terms ?? '',
        status: contract.status, signed_at: contract.signed_at ?? '', document: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((d) => ({ ...d, _method: 'put' }));
        post(route('hr.contracts.update', contract.id), {
            forceFormData: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-sm font-bold">Edit Contract — {contract.user?.name}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <ContractFormFields data={data} setData={setData} errors={errors} employees={employees} />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Update Contract'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ContractsIndex({ contracts, employees }: Props) {
    const [editingContract, setEditingContract] = useState<ContractItem | null>(null);

    const removeContract = (contract: ContractItem) => {
        if (confirm(`Remove contract for ${contract.user?.name}?`)) {
            router.delete(route('hr.contracts.destroy', contract.id), { preserveScroll: true });
        }
    };

    const expiringCount = contracts.filter((c) => c.expiring_soon).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contracts" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">Contracts</h1>
                    </div>
                    <AddContractDialog employees={employees} />
                </div>

                {expiringCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">
                            {expiringCount} contract{expiringCount > 1 ? 's' : ''} expiring within 30 days.
                        </span>
                    </div>
                )}

                <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                    <Table>
                        <TableHeader className="bg-neutral-50/50">
                            <TableRow>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Type</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Duration</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Salary</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.map((c) => (
                                <TableRow key={c.id} className="hover:bg-neutral-50/80">
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                                            <FileSignature className="h-3 w-3 text-neutral-400" /> {c.user?.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs capitalize text-neutral-600">{c.contract_type.replace('_', ' ')}</TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">
                                        {c.start_date} → {c.end_date || 'Ongoing'}
                                        {c.expiring_soon && <Badge className="ml-2 bg-amber-100 text-[10px] font-bold text-amber-700">Expiring Soon</Badge>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs font-bold text-neutral-700">
                                        {c.salary ? `TZS ${Number(c.salary).toLocaleString()}` : '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[c.status]}`}>{c.status}</Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => setEditingContract(c)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeContract(c)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {contracts.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="py-16 text-center text-xs text-neutral-400">No contracts recorded yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {editingContract && (
                <EditContractDialog
                    contract={editingContract}
                    employees={employees}
                    open={!!editingContract}
                    onOpenChange={(v) => !v && setEditingContract(null)}
                />
            )}
        </AppLayout>
    );
}
