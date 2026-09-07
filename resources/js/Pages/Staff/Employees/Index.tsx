import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
    Briefcase,
    Building2,
    DollarSign,
    Edit2,
    Plus,
    Search,
    Trash2,
    UserCheck,
    UserMinus,
    Users,
} from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Employees', href: '/hr/employees' },
];

interface Employee {
    id: number;
    user_id: number;
    employee_number: string;
    name: string;
    email: string;
    phone: string | null;
    role: string | null;
    department: string | null;
    position: string | null;
    employment_type: string;
    status: string;
    hire_date: string | null;
    probation_end_date: string | null;
    confirmed_at: string | null;
    basic_salary: string | null;
    national_id: string | null;
    date_of_birth: string | null;
    gender: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    photo_path: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
}

interface Props {
    employees: Employee[];
    departments: string[];
    roles: string[];
}

const EMPLOYMENT_TYPES = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
];

const STATUS_STYLES: Record<string, string> = {
    probation: 'bg-sky-100 text-sky-700',
    active: 'bg-emerald-100 text-emerald-700',
    on_leave: 'bg-amber-100 text-amber-700',
    terminated: 'bg-rose-100 text-rose-700',
};

function photoUrl(path: string | null) {
    return path ? `/storage/${path}` : undefined;
}

function EmployeeFormFields({ data, setData, errors, isEdit, roles }: any) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
                <Label className="text-xs font-bold">Full Name *</Label>
                <Input value={data.name} onChange={(e: any) => setData('name', e.target.value)} className="text-xs" />
                {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Email *</Label>
                <Input type="email" value={data.email} onChange={(e: any) => setData('email', e.target.value)} className="text-xs" />
                {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Phone</Label>
                <Input value={data.phone} onChange={(e: any) => setData('phone', e.target.value)} className="text-xs" />
            </div>
            {!isEdit && (
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Password *</Label>
                    <Input type="password" value={data.password} onChange={(e: any) => setData('password', e.target.value)} className="text-xs" />
                    {errors.password && <p className="text-xs text-rose-600">{errors.password}</p>}
                </div>
            )}
            <div className="space-y-1">
                <Label className="text-xs font-bold">System Role *</Label>
                <Select value={data.role} onValueChange={(v) => setData('role', v)}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                        {(roles as string[]).map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-rose-600">{errors.role}</p>}
            </div>
            {isEdit && (
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Employment Status *</Label>
                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="probation" className="text-xs">Probation</SelectItem>
                            <SelectItem value="active" className="text-xs">Active</SelectItem>
                            <SelectItem value="on_leave" className="text-xs">On Leave</SelectItem>
                            <SelectItem value="terminated" className="text-xs">Terminated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-1">
                <Label className="text-xs font-bold">Employee Number *</Label>
                <Input value={data.employee_number} onChange={(e: any) => setData('employee_number', e.target.value)} className="text-xs" placeholder="e.g. EMP-0001" />
                {errors.employee_number && <p className="text-xs text-rose-600">{errors.employee_number}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Employment Type *</Label>
                <Select value={data.employment_type} onValueChange={(v) => setData('employment_type', v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {EMPLOYMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Department</Label>
                <Input value={data.department} onChange={(e: any) => setData('department', e.target.value)} className="text-xs" placeholder="e.g. Workshop" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Position / Job Title</Label>
                <Input value={data.position} onChange={(e: any) => setData('position', e.target.value)} className="text-xs" placeholder="e.g. Welder" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Hire Date</Label>
                <Input type="date" value={data.hire_date} onChange={(e: any) => setData('hire_date', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Basic Salary (TZS)</Label>
                <Input type="number" min="0" value={data.basic_salary} onChange={(e: any) => setData('basic_salary', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">National ID</Label>
                <Input value={data.national_id} onChange={(e: any) => setData('national_id', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Employee TIN</Label>
                <Input value={data.tin} onChange={(e: any) => setData('tin', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">NSSF Number</Label>
                <Input value={data.nssf_number} onChange={(e: any) => setData('nssf_number', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Date of Birth</Label>
                <Input type="date" value={data.date_of_birth} onChange={(e: any) => setData('date_of_birth', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Gender</Label>
                <Select value={data.gender} onValueChange={(v) => setData('gender', v)}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male" className="text-xs">Male</SelectItem>
                        <SelectItem value="female" className="text-xs">Female</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">Address</Label>
                <Input value={data.address} onChange={(e: any) => setData('address', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Emergency Contact Name</Label>
                <Input value={data.emergency_contact_name} onChange={(e: any) => setData('emergency_contact_name', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Emergency Contact Phone</Label>
                <Input value={data.emergency_contact_phone} onChange={(e: any) => setData('emergency_contact_phone', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Bank Name</Label>
                <Input value={data.bank_name} onChange={(e: any) => setData('bank_name', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Bank Account Number</Label>
                <Input value={data.bank_account_number} onChange={(e: any) => setData('bank_account_number', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-bold">Bank Account Name</Label>
                <Input value={data.bank_account_name} onChange={(e: any) => setData('bank_account_name', e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">Photo</Label>
                <Input type="file" accept="image/*" onChange={(e: any) => setData('photo', e.target.files?.[0] ?? null)} className="text-xs" />
            </div>
        </div>
    );
}

function AddEmployeeDialog({ roles }: { roles: string[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm<any>({
        name: '', email: '', phone: '', password: '', role: '',
        employee_number: '', department: '', position: '', employment_type: 'full_time',
        hire_date: '', basic_salary: '', national_id: '', date_of_birth: '', gender: '',
        address: '', emergency_contact_name: '', emergency_contact_phone: '',
        bank_name: '', bank_account_number: '', bank_account_name: '', tin: '', nssf_number: '', photo: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.employees.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">New Employee</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <EmployeeFormFields data={data} setData={setData} errors={errors} isEdit={false} roles={roles} />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Save Employee'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditEmployeeDialog({ employee, roles, open, onOpenChange }: { employee: Employee; roles: string[]; open: boolean; onOpenChange: (v: boolean) => void }) {
    const { data, setData, post, processing, errors, transform } = useForm<any>({
        name: employee.name, email: employee.email, phone: employee.phone ?? '', role: employee.role ?? '',
        employee_number: employee.employee_number, department: employee.department ?? '', position: employee.position ?? '',
        employment_type: employee.employment_type, status: employee.status,
        hire_date: employee.hire_date ?? '', termination_date: '', basic_salary: employee.basic_salary ?? '',
        national_id: employee.national_id ?? '', tin: (employee as any).tin ?? '', nssf_number: (employee as any).nssf_number ?? '',
        date_of_birth: employee.date_of_birth ?? '', gender: employee.gender ?? '',
        address: employee.address ?? '', emergency_contact_name: employee.emergency_contact_name ?? '',
        emergency_contact_phone: employee.emergency_contact_phone ?? '', bank_name: employee.bank_name ?? '',
        bank_account_number: employee.bank_account_number ?? '', bank_account_name: (employee as any).bank_account_name ?? '', photo: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((d) => ({ ...d, _method: 'put' }));
        post(route('hr.employees.update', employee.id), {
            forceFormData: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Edit Employee — {employee.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <EmployeeFormFields data={data} setData={setData} errors={errors} isEdit={true} roles={roles} />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Update Employee'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface SalaryRevisionItem {
    id: number;
    previous_salary: string | null;
    new_salary: string;
    effective_date: string;
    reason: string | null;
    approved_by?: { name: string } | null;
}

interface PayrollHistoryItem {
    payroll_period: string;
    net_salary: string;
}

function SalaryHistoryDialog({ employee, open, onOpenChange }: { employee: Employee; open: boolean; onOpenChange: (v: boolean) => void }) {
    const [revisions, setRevisions] = useState<SalaryRevisionItem[]>([]);
    const [payrollHistory, setPayrollHistory] = useState<PayrollHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const { data, setData, post, processing, reset, errors } = useForm({
        new_salary: '', effective_date: new Date().toISOString().slice(0, 10), reason: '',
    });

    const load = () => {
        setLoading(true);
        fetch(route('hr.employees.salary-history', employee.id))
            .then((res) => res.json())
            .then((json) => {
                setRevisions(json.revisions);
                setPayrollHistory(json.payroll_history);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (open) load();
    }, [open]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.employees.salary-revisions.store', employee.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); load(); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Salary History — {employee.name}</DialogTitle>
                </DialogHeader>

                {payrollHistory.length > 1 && (
                    <div className="h-[160px] w-full rounded-lg border border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={payrollHistory}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="payroll_period" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 500, fill: '#171717' }} />
                                <YAxis hide />
                                <Tooltip />
                                <Line type="monotone" dataKey="net_salary" stroke="#4f46e5" strokeWidth={2} dot={false} name="Net Salary" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-4 dark:bg-neutral-800/30">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">New Salary (TZS) *</Label>
                        <Input type="number" value={data.new_salary} onChange={(e) => setData('new_salary', e.target.value)} className="text-xs" />
                        {errors.new_salary && <p className="text-xs text-rose-600">{errors.new_salary}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Effective Date *</Label>
                        <Input type="date" value={data.effective_date} onChange={(e) => setData('effective_date', e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs font-bold">Reason</Label>
                        <Input value={data.reason} onChange={(e) => setData('reason', e.target.value)} className="text-xs" placeholder="e.g. Annual increment" />
                    </div>
                    <div className="sm:col-span-4">
                        <Button type="submit" disabled={processing} className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            <DollarSign className="h-3.5 w-3.5" /> {processing ? 'Saving...' : 'Record Salary Revision'}
                        </Button>
                    </div>
                </form>

                <Table>
                    <TableHeader className="bg-neutral-50/50">
                        <TableRow>
                            <TableHead className="px-4 py-2 text-xs font-bold text-neutral-700">Effective Date</TableHead>
                            <TableHead className="px-4 py-2 text-xs font-bold text-neutral-700">Change</TableHead>
                            <TableHead className="px-4 py-2 text-xs font-bold text-neutral-700">Reason</TableHead>
                            <TableHead className="px-4 py-2 text-xs font-bold text-neutral-700">Approved By</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {revisions.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="px-4 py-2 text-xs text-neutral-600">{r.effective_date}</TableCell>
                                <TableCell className="px-4 py-2 text-xs font-bold text-neutral-800">
                                    {r.previous_salary ? `${Number(r.previous_salary).toLocaleString()} → ` : ''}{Number(r.new_salary).toLocaleString()}
                                </TableCell>
                                <TableCell className="px-4 py-2 text-xs text-neutral-500">{r.reason || '—'}</TableCell>
                                <TableCell className="px-4 py-2 text-xs text-neutral-500">{r.approved_by?.name || '—'}</TableCell>
                            </TableRow>
                        ))}
                        {!loading && revisions.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="py-8 text-center text-xs text-neutral-400">No salary revisions recorded yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}

export default function EmployeesIndex({ employees, departments, roles }: Props) {
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [salaryHistoryEmployee, setSalaryHistoryEmployee] = useState<Employee | null>(null);

    const filtered = useMemo(() => {
        return employees.filter((e) => {
            const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.employee_number.toLowerCase().includes(search.toLowerCase()) ||
                e.email.toLowerCase().includes(search.toLowerCase());
            const matchesDept = departmentFilter === 'All' || e.department === departmentFilter;
            const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
            return matchesSearch && matchesDept && matchesStatus;
        });
    }, [employees, search, departmentFilter, statusFilter]);

    const stats = useMemo(() => ({
        total: employees.length,
        active: employees.filter((e) => e.status === 'active').length,
        onLeave: employees.filter((e) => e.status === 'on_leave').length,
        departments: new Set(employees.map((e) => e.department).filter(Boolean)).size,
    }), [employees]);

    const removeEmployee = (employee: Employee) => {
        if (confirm(`Remove ${employee.name} from active employees? Their account and payroll history will be preserved.`)) {
            router.delete(route('hr.employees.destroy', employee.id), { preserveScroll: true });
        }
    };

    const confirmEmployment = (employee: Employee) => {
        if (confirm(`Confirm ${employee.name}'s employment? This ends their probation period and marks them as a permanent employee.`)) {
            router.post(route('hr.employees.confirm', employee.id), {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Records" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">Employee Records</h1>
                    </div>
                    <AddEmployeeDialog roles={roles} />
                </div>

                <StatsSummaryCards
                    stats={[
                        { label: 'Total Employees', value: stats.total, icon: <Users />, color: 'indigo' },
                        { label: 'Active', value: stats.active, icon: <UserCheck />, color: 'emerald' },
                        { label: 'On Leave', value: stats.onLeave, icon: <UserMinus />, color: 'orange' },
                        { label: 'Departments', value: stats.departments, icon: <Building2 />, color: 'purple' },
                    ]}
                />

                <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <Input
                                className="pl-9 text-xs"
                                placeholder="Search by name, employee number or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-full text-xs sm:w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All" className="text-xs">All Departments</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full text-xs sm:w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All" className="text-xs">All Statuses</SelectItem>
                                <SelectItem value="probation" className="text-xs">Probation</SelectItem>
                                <SelectItem value="active" className="text-xs">Active</SelectItem>
                                <SelectItem value="on_leave" className="text-xs">On Leave</SelectItem>
                                <SelectItem value="terminated" className="text-xs">Terminated</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                    <Table>
                        <TableHeader className="bg-neutral-50/50">
                            <TableRow>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Department / Position</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Role</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employment</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">NSSF Number</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee TIN</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Bank Name</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Account Name</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Account Number</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((employee) => (
                                <TableRow key={employee.id} className="hover:bg-neutral-50/80">
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={photoUrl(employee.photo_path)} />
                                                <AvatarFallback className="bg-indigo-100 text-xs font-bold text-indigo-700">
                                                    {employee.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-[13px] font-bold text-neutral-800">{employee.name}</p>
                                                <p className="text-[11px] text-neutral-400">{employee.employee_number} · {employee.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs font-bold text-neutral-700">
                                            <Briefcase className="h-3 w-3 text-neutral-400" />
                                            {employee.position || '—'}
                                        </div>
                                        <p className="text-[11px] text-neutral-400">{employee.department || 'No department'}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge className="bg-neutral-100 text-[11px] font-bold text-neutral-700">{employee.role || '—'}</Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs font-medium text-neutral-600">
                                        {EMPLOYMENT_TYPES.find((t) => t.value === employee.employment_type)?.label || employee.employment_type}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">
                                        {(employee as any).nssf_number || '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">
                                        {(employee as any).tin || '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">
                                        {employee.bank_name || '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs font-bold text-indigo-600">
                                        {(employee as any).bank_account_name || '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600 font-mono">
                                        {employee.bank_account_number || '—'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[employee.status] || 'bg-neutral-100 text-neutral-700'}`}>
                                            {employee.status.replace('_', ' ')}
                                        </Badge>
                                        {employee.status === 'probation' && employee.probation_end_date && (
                                            <p className="mt-1 text-[10px] font-bold text-neutral-400">Ends {employee.probation_end_date}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {employee.status === 'probation' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 gap-1 px-2 text-[11px] font-bold text-sky-700 hover:bg-sky-50"
                                                    onClick={() => confirmEmployment(employee)}
                                                >
                                                    <UserCheck className="h-3.5 w-3.5" /> Confirm
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => setEditingEmployee(employee)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-emerald-50 hover:text-emerald-600" onClick={() => setSalaryHistoryEmployee(employee)}>
                                                <DollarSign className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeEmployee(employee)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-16 text-center text-xs text-neutral-400">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {editingEmployee && (
                <EditEmployeeDialog
                    employee={editingEmployee}
                    roles={roles}
                    open={!!editingEmployee}
                    onOpenChange={(v) => !v && setEditingEmployee(null)}
                />
            )}

            {salaryHistoryEmployee && (
                <SalaryHistoryDialog
                    employee={salaryHistoryEmployee}
                    open={!!salaryHistoryEmployee}
                    onOpenChange={(v) => !v && setSalaryHistoryEmployee(null)}
                />
            )}
        </AppLayout>
    );
}
