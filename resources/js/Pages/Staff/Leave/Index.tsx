import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatsSummaryCards } from '@/components/StatsSummaryCards';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { CalendarClock, CheckCircle2, ChevronRight, Plus, Wallet, X, XCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Leave Management', href: '/hr/leave' },
];

interface LeaveType {
    id: number;
    name: string;
    days_allowed_per_year: number;
    paid: boolean;
}

interface LeaveRequestItem {
    id: number;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason: string | null;
    status: string;
    approval_notes: string | null;
    leave_type: LeaveType;
    user?: { id: number; name: string };
    approver?: { id: number; name: string } | null;
}

interface Balance {
    leave_type_id: number;
    name: string;
    days_allowed_per_year: number;
    used: number;
    remaining: number;
}

interface Props {
    my_requests: LeaveRequestItem[];
    leave_types: LeaveType[];
    balances: Balance[];
    pending_approvals: LeaveRequestItem[];
    can_approve: boolean;
    employees: { id: number; name: string }[];
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-neutral-100 text-neutral-500',
};

function RequestLeaveDialog({ leaveTypes, canManage, employees }: { leaveTypes: LeaveType[]; canManage: boolean; employees: { id: number; name: string }[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        user_id: '',
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.leave.store'), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-10 gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> {canManage ? 'Create Leave' : 'Request Leave'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">New Leave Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    {canManage && (
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Employee *</Label>
                            <Select value={data.user_id} onValueChange={(v) => setData('user_id', v)}>
                                <SelectTrigger className="text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee) => (
                                        <SelectItem key={employee.id} value={String(employee.id)} className="text-xs">{employee.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.user_id && <p className="text-xs text-rose-600">{errors.user_id}</p>}
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Leave Type *</Label>
                        <Select value={data.leave_type_id} onValueChange={(v) => setData('leave_type_id', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                            <SelectContent>
                                {leaveTypes.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)} className="text-xs">{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.leave_type_id && <p className="text-xs text-rose-600">{errors.leave_type_id}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Start Date *</Label>
                            <Input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} className="text-xs" />
                            {errors.start_date && <p className="text-xs text-rose-600">{errors.start_date}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">End Date *</Label>
                            <Input type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} className="text-xs" />
                            {errors.end_date && <p className="text-xs text-rose-600">{errors.end_date}</p>}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Reason</Label>
                        <Textarea value={data.reason} onChange={(e) => setData('reason', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function LeaveIndex({ my_requests, leave_types, balances, pending_approvals, can_approve, employees }: Props) {
    const cancelRequest = (id: number) => {
        if (confirm('Cancel this leave request?')) {
            router.post(route('hr.leave.cancel', id), {}, { preserveScroll: true });
        }
    };

    const decide = (id: number, status: 'approved' | 'rejected') => {
        const approval_notes = status === 'rejected' ? (prompt('Reason for rejection (optional):') ?? '') : '';
        router.post(route('hr.leave.approve', id), { status, approval_notes }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Management" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-5 bg-[#f7f9fc] px-3 py-4 md:px-4 md:py-6 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Human Resources</p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white md:text-2xl">Leave Management</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {can_approve ? 'Create, track, approve, and organize employee leave requests.' : 'Track your leave balances and manage your requests.'}
                        </p>
                    </div>
                    <RequestLeaveDialog leaveTypes={leave_types} canManage={can_approve} employees={employees} />
                </div>

                <StatsSummaryCards
                    compact
                    className="gap-3"
                    stats={balances.map((b, i) => ({
                        label: b.name,
                        value: b.remaining,
                        subValue: `of ${b.days_allowed_per_year} days left`,
                        icon: <Wallet />,
                        color: (['indigo', 'emerald', 'purple', 'orange', 'teal', 'blue'] as const)[i % 6],
                    }))}
                />

                    <Tabs defaultValue="my-requests" className="space-y-4">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <TabsList className="h-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/80">
                                <TabsTrigger value="my-requests" className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-900 dark:data-[state=active]:text-white">{can_approve ? 'All Requests' : 'My Requests'}</TabsTrigger>
                        {can_approve && (
                                <TabsTrigger value="approvals" className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-900 dark:data-[state=active]:text-white">
                                Pending Approvals
                                {pending_approvals.length > 0 && (
                                    <Badge className="ml-2 bg-amber-500 text-white">{pending_approvals.length}</Badge>
                                )}
                            </TabsTrigger>
                        )}
                            </TabsList>
                        </div>

                    <TabsContent value="my-requests">
                            <Card className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                                    <div>
                                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{can_approve ? 'Leave Requests' : 'My Leave Requests'}</h2>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Review request details, balances, and current statuses.</p>
                                    </div>
                                    <div className="hidden items-center gap-1 text-xs font-medium text-neutral-400 md:flex">
                                        <span>{my_requests.length} records</span>
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                            <Table>
                                    <TableHeader className="bg-neutral-50/80 dark:bg-neutral-950/40">
                                    <TableRow>
                                        {can_approve && <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee</TableHead>}
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Leave Type</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Dates</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Days</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Notes</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {my_requests.map((r) => (
                                        <TableRow key={r.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                                            {can_approve && <TableCell className="px-4 py-3 text-xs font-semibold text-neutral-800 dark:text-neutral-200">{r.user?.name || '—'}</TableCell>}
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                    <CalendarClock className="h-3 w-3 text-neutral-400" /> {r.leave_type.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">{r.start_date} → {r.end_date}</TableCell>
                                            <TableCell className="px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">{r.days_requested}</TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[r.status] || 'bg-neutral-100 text-neutral-700'}`}>
                                                    {r.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 truncate">{r.approval_notes || r.reason || '—'}</TableCell>
                                            <TableCell className="px-4 py-3">
                                                {r.status === 'pending' && (
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" onClick={() => cancelRequest(r.id)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {my_requests.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={can_approve ? 7 : 6} className="py-16 text-center text-xs text-neutral-400">No leave requests yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    {can_approve && (
                        <TabsContent value="approvals">
                            <Card className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                                    <div>
                                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Pending Approvals</h2>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Approve or reject requests that are waiting for action.</p>
                                    </div>
                                    <Badge className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{pending_approvals.length} pending</Badge>
                                </div>
                                <Table>
                                    <TableHeader className="bg-neutral-50/80 dark:bg-neutral-950/40">
                                        <TableRow>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Leave Type</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Dates</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Reason</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pending_approvals.map((r) => (
                                                <TableRow key={r.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                                                    <TableCell className="px-4 py-3 text-xs font-semibold text-neutral-800 dark:text-neutral-200">{r.user?.name}</TableCell>
                                                    <TableCell className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">{r.leave_type.name}</TableCell>
                                                    <TableCell className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">{r.start_date} → {r.end_date} ({r.days_requested}d)</TableCell>
                                                    <TableCell className="max-w-xs px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 truncate">{r.reason || '—'}</TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                            <Button size="sm" className="h-8 gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-700" onClick={() => decide(r.id, 'approved')}>
                                                            <CheckCircle2 className="h-3 w-3" /> Approve
                                                        </Button>
                                                            <Button size="sm" variant="outline" className="h-8 gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => decide(r.id, 'rejected')}>
                                                            <XCircle className="h-3 w-3" /> Reject
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {pending_approvals.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-16 text-center text-xs text-neutral-400">No pending approvals.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </AppLayout>
    );
}
