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
import { Head, useForm } from '@inertiajs/react';
import { Award, ClipboardCheck, Plus, Star } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Performance Appraisals', href: '/hr/appraisals' },
];

interface Cycle {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
}

interface Person {
    id: number;
    name: string;
}

interface AppraisalItem {
    id: number;
    cycle: Cycle;
    user?: Person;
    reviewer?: Person;
    goals: string | null;
    achievements: string | null;
    strengths: string | null;
    areas_for_improvement: string | null;
    rating: number | null;
    status: string;
    employee_comments: string | null;
}

interface Props {
    cycles: Cycle[];
    my_appraisals: AppraisalItem[];
    review_assignments: AppraisalItem[];
    all_appraisals: AppraisalItem[];
    employees: Person[];
    is_admin: boolean;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    submitted: 'bg-blue-100 text-blue-700',
    acknowledged: 'bg-emerald-100 text-emerald-700',
};

function StarRating({ rating }: { rating: number | null }) {
    if (!rating) return <span className="text-xs text-neutral-400">—</span>;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`} />
            ))}
        </div>
    );
}

function NewCycleDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', start_date: '', end_date: '', status: 'draft',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.appraisals.cycles.store'), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-1 text-xs font-bold">
                    <Plus className="h-3.5 w-3.5" /> New Cycle
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-sm font-bold">New Appraisal Cycle</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Cycle Name *</Label>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="text-xs" placeholder="e.g. 2026 H1 Review" />
                        {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Start Date *</Label>
                            <Input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">End Date *</Label>
                            <Input type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Status *</Label>
                        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                                <SelectItem value="active" className="text-xs">Active</SelectItem>
                                <SelectItem value="closed" className="text-xs">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Create Cycle'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AssignAppraisalDialog({ cycles, employees }: { cycles: Cycle[]; employees: Person[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        appraisal_cycle_id: '', user_id: '', reviewer_id: '', goals: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.appraisals.store'), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> Assign Appraisal
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-sm font-bold">Assign Appraisal</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Cycle *</Label>
                        <Select value={data.appraisal_cycle_id} onValueChange={(v) => setData('appraisal_cycle_id', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select cycle" /></SelectTrigger>
                            <SelectContent>
                                {cycles.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.appraisal_cycle_id && <p className="text-xs text-rose-600">{errors.appraisal_cycle_id}</p>}
                    </div>
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
                        <Label className="text-xs font-bold">Reviewer *</Label>
                        <Select value={data.reviewer_id} onValueChange={(v) => setData('reviewer_id', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select reviewer" /></SelectTrigger>
                            <SelectContent>
                                {employees.map((e) => (
                                    <SelectItem key={e.id} value={String(e.id)} className="text-xs">{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.reviewer_id && <p className="text-xs text-rose-600">{errors.reviewer_id}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Goals</Label>
                        <Textarea value={data.goals} onChange={(e) => setData('goals', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Assign'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FillAppraisalDialog({ appraisal }: { appraisal: AppraisalItem }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        goals: appraisal.goals ?? '',
        achievements: appraisal.achievements ?? '',
        strengths: appraisal.strengths ?? '',
        areas_for_improvement: appraisal.areas_for_improvement ?? '',
        rating: appraisal.rating ?? 0,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('hr.appraisals.update', appraisal.id), {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-7 gap-1 bg-indigo-600 px-2 text-[11px] font-bold text-white hover:bg-indigo-700">
                    <ClipboardCheck className="h-3 w-3" /> Fill Review
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-sm font-bold">Review — {appraisal.user?.name}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Goals</Label>
                        <Textarea value={data.goals} onChange={(e) => setData('goals', e.target.value)} className="text-xs" rows={2} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Achievements</Label>
                        <Textarea value={data.achievements} onChange={(e) => setData('achievements', e.target.value)} className="text-xs" rows={2} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Strengths</Label>
                        <Textarea value={data.strengths} onChange={(e) => setData('strengths', e.target.value)} className="text-xs" rows={2} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Areas for Improvement</Label>
                        <Textarea value={data.areas_for_improvement} onChange={(e) => setData('areas_for_improvement', e.target.value)} className="text-xs" rows={2} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Overall Rating (1–5) *</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button type="button" key={n} onClick={() => setData('rating', n)}>
                                    <Star className={`h-6 w-6 ${n <= data.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`} />
                                </button>
                            ))}
                        </div>
                        {errors.rating && <p className="text-xs text-rose-600">{errors.rating}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AcknowledgeDialog({ appraisal }: { appraisal: AppraisalItem }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing } = useForm({ employee_comments: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.appraisals.acknowledge', appraisal.id), {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-7 gap-1 bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-700">
                    Acknowledge
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-sm font-bold">Acknowledge Review</DialogTitle></DialogHeader>
                <div className="space-y-3 text-xs text-neutral-600">
                    <p><span className="font-bold">Strengths:</span> {appraisal.strengths || '—'}</p>
                    <p><span className="font-bold">Areas for Improvement:</span> {appraisal.areas_for_improvement || '—'}</p>
                    <div className="flex items-center gap-2"><span className="font-bold">Rating:</span> <StarRating rating={appraisal.rating} /></div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Your Comments</Label>
                        <Textarea value={data.employee_comments} onChange={(e) => setData('employee_comments', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700">
                            {processing ? 'Saving...' : 'Acknowledge'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AppraisalsIndex({ cycles, my_appraisals, review_assignments, all_appraisals, employees, is_admin }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance Appraisals" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">Performance Appraisals</h1>
                    </div>
                    {is_admin && (
                        <div className="flex gap-2">
                            <NewCycleDialog />
                            <AssignAppraisalDialog cycles={cycles} employees={employees} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {cycles.slice(0, 4).map((c) => (
                        <Card key={c.id} className="border-none bg-white shadow-sm dark:bg-neutral-900">
                            <CardContent className="flex flex-col gap-1 p-4">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-500">
                                    <Award className="h-3 w-3" /> {c.name}
                                </div>
                                <Badge className={`w-fit text-[10px] font-bold capitalize ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : c.status === 'closed' ? 'bg-neutral-100 text-neutral-600' : 'bg-amber-100 text-amber-700'}`}>
                                    {c.status}
                                </Badge>
                                <span className="text-[10px] text-neutral-400">{c.start_date} → {c.end_date}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="my-appraisals">
                    <TabsList>
                        <TabsTrigger value="my-appraisals" className="text-xs font-bold">My Appraisals</TabsTrigger>
                        {review_assignments.length > 0 && (
                            <TabsTrigger value="to-review" className="text-xs font-bold">To Review ({review_assignments.length})</TabsTrigger>
                        )}
                        {is_admin && <TabsTrigger value="all" className="text-xs font-bold">All Appraisals</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="my-appraisals">
                        <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                            <Table>
                                <TableHeader className="bg-neutral-50/50">
                                    <TableRow>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Cycle</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Reviewer</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Rating</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {my_appraisals.map((a) => (
                                        <TableRow key={a.id} className="hover:bg-neutral-50/80">
                                            <TableCell className="px-4 py-3 text-xs font-bold text-neutral-800">{a.cycle.name}</TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-neutral-600">{a.reviewer?.name || '—'}</TableCell>
                                            <TableCell className="px-4 py-3"><StarRating rating={a.rating} /></TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[a.status]}`}>{a.status}</Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                {a.status === 'submitted' && <AcknowledgeDialog appraisal={a} />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {my_appraisals.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="py-16 text-center text-xs text-neutral-400">No appraisals assigned yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    {review_assignments.length > 0 && (
                        <TabsContent value="to-review">
                            <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                                <Table>
                                    <TableHeader className="bg-neutral-50/50">
                                        <TableRow>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Cycle</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {review_assignments.map((a) => (
                                            <TableRow key={a.id} className="hover:bg-neutral-50/80">
                                                <TableCell className="px-4 py-3 text-xs font-bold text-neutral-800">{a.user?.name}</TableCell>
                                                <TableCell className="px-4 py-3 text-xs text-neutral-600">{a.cycle.name}</TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[a.status]}`}>{a.status}</Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    {a.status === 'pending' && <FillAppraisalDialog appraisal={a} />}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>
                    )}

                    {is_admin && (
                        <TabsContent value="all">
                            <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                                <Table>
                                    <TableHeader className="bg-neutral-50/50">
                                        <TableRow>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Employee</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Cycle</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Reviewer</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Rating</TableHead>
                                            <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {all_appraisals.map((a) => (
                                            <TableRow key={a.id} className="hover:bg-neutral-50/80">
                                                <TableCell className="px-4 py-3 text-xs font-bold text-neutral-800">{a.user?.name}</TableCell>
                                                <TableCell className="px-4 py-3 text-xs text-neutral-600">{a.cycle.name}</TableCell>
                                                <TableCell className="px-4 py-3 text-xs text-neutral-600">{a.reviewer?.name || '—'}</TableCell>
                                                <TableCell className="px-4 py-3"><StarRating rating={a.rating} /></TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge className={`text-[11px] font-bold capitalize ${STATUS_STYLES[a.status]}`}>{a.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {all_appraisals.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="py-16 text-center text-xs text-neutral-400">No appraisals yet.</TableCell></TableRow>
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
