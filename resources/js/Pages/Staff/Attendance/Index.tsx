import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Clock, LogIn, LogOut, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Attendance', href: '/hr/attendance' },
];

interface AttendanceRecord {
    id: number;
    user_id: number;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    notes: string | null;
    user?: { id: number; name: string };
}

interface Employee {
    id: number;
    name: string;
}

interface Props {
    today: AttendanceRecord | null;
    my_recent: AttendanceRecord[];
    records: AttendanceRecord[];
    employees: Employee[];
    is_admin: boolean;
    filter_date: string;
}

const STATUS_STYLES: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-rose-100 text-rose-700',
    on_leave: 'bg-neutral-100 text-neutral-600',
};

function fmtTime(datetime: string | null) {
    if (!datetime) return '—';
    return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ManualEntryDialog({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        user_id: '',
        date: new Date().toISOString().slice(0, 10),
        clock_in: '',
        clock_out: '',
        status: 'present',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.attendance.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> Manual Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Record Attendance</DialogTitle>
                </DialogHeader>
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
                        <Label className="text-xs font-bold">Date *</Label>
                        <Input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} className="text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Clock In</Label>
                            <Input type="time" value={data.clock_in} onChange={(e) => setData('clock_in', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Clock Out</Label>
                            <Input type="time" value={data.clock_out} onChange={(e) => setData('clock_out', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Status *</Label>
                        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="present" className="text-xs">Present</SelectItem>
                                <SelectItem value="late" className="text-xs">Late</SelectItem>
                                <SelectItem value="absent" className="text-xs">Absent</SelectItem>
                                <SelectItem value="on_leave" className="text-xs">On Leave</SelectItem>
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
                            {processing ? 'Saving...' : 'Save Record'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AttendanceIndex({ today, my_recent, records, employees, is_admin, filter_date }: Props) {
    const [now, setNow] = useState(new Date());
    const [dateFilter, setDateFilter] = useState(filter_date);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const clockIn = () => {
        router.post(route('hr.attendance.clock-in'), {}, { preserveScroll: true });
    };
    const clockOut = () => {
        router.post(route('hr.attendance.clock-out'), {}, { preserveScroll: true });
    };

    const applyDateFilter = (date: string) => {
        setDateFilter(date);
        router.get(route('hr.attendance.index'), { date }, { preserveScroll: true, preserveState: true });
    };

    const removeRecord = (id: number) => {
        if (confirm('Remove this attendance record?')) {
            router.delete(route('hr.attendance.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">Attendance</h1>
                </div>

                <Card className="border-none bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-500/20">
                    <CardContent className="flex flex-col items-center gap-4 p-8 sm:flex-row sm:justify-between">
                        <div className="text-center sm:text-left">
                            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Current Time</p>
                            <p className="font-mono text-3xl font-extrabold">{now.toLocaleTimeString()}</p>
                            <p className="text-xs opacity-70">{now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-[10px] font-bold uppercase opacity-70">Clock In</p>
                                <p className="font-mono text-lg font-bold">{fmtTime(today?.clock_in ?? null)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold uppercase opacity-70">Clock Out</p>
                                <p className="font-mono text-lg font-bold">{fmtTime(today?.clock_out ?? null)}</p>
                            </div>
                            {!today?.clock_in ? (
                                <Button onClick={clockIn} className="gap-2 bg-white text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                                    <LogIn className="h-4 w-4" /> Clock In
                                </Button>
                            ) : !today?.clock_out ? (
                                <Button onClick={clockOut} className="gap-2 bg-white text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                                    <LogOut className="h-4 w-4" /> Clock Out
                                </Button>
                            ) : (
                                <Badge className="bg-white/20 px-3 py-2 text-xs font-bold text-white">Done for today</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                    <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                            <Clock className="h-4 w-4 text-indigo-600" /> My Recent Attendance
                        </h2>
                    </div>
                    <Table>
                        <TableHeader className="bg-neutral-50/50">
                            <TableRow>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Date</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Clock In</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Clock Out</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {my_recent.map((r) => (
                                <TableRow key={r.id} className="hover:bg-neutral-50/80">
                                    <TableCell className="px-4 py-3 text-xs font-bold text-neutral-700">{r.date}</TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">{fmtTime(r.clock_in)}</TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">{fmtTime(r.clock_out)}</TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[r.status] || 'bg-neutral-100 text-neutral-700'}`}>
                                            {r.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {my_recent.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-16 text-center text-xs text-neutral-400">No attendance records yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {is_admin && (
                    <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                        <div className="flex flex-col gap-3 border-b border-neutral-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-sm font-bold text-neutral-700">All Employees — Daily Register</h2>
                            <div className="flex items-center gap-2">
                                <Input type="date" value={dateFilter} onChange={(e) => applyDateFilter(e.target.value)} className="h-9 w-40 text-xs" />
                                <ManualEntryDialog employees={employees} />
                            </div>
                        </div>
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow>
                                    <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Clock In</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Clock Out</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Notes</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((r) => (
                                    <TableRow key={r.id} className="hover:bg-neutral-50/80">
                                        <TableCell className="px-4 py-3 text-xs font-bold text-neutral-800">{r.user?.name}</TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-neutral-600">{fmtTime(r.clock_in)}</TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-neutral-600">{fmtTime(r.clock_out)}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[r.status] || 'bg-neutral-100 text-neutral-700'}`}>
                                                {r.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-neutral-500">{r.notes || '—'}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeRecord(r.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {records.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-16 text-center text-xs text-neutral-400">No records for this date.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
