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
import { BookOpen, CheckCircle2, Plus, Trash2, UserPlus, XCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Training Records', href: '/hr/training' },
];

interface Employee {
    id: number;
    name: string;
}

interface Participant {
    id: number;
    user?: Employee;
    status: string;
    score: number | null;
    completion_date: string | null;
}

interface TrainingItem {
    id: number;
    title: string;
    provider: string | null;
    description: string | null;
    start_date: string;
    end_date: string | null;
    cost: string | null;
    category: string | null;
    participants: Participant[];
}

interface Props {
    trainings: TrainingItem[];
    employees: Employee[];
}

const STATUS_STYLES: Record<string, string> = {
    enrolled: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
};

function AddTrainingDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '', provider: '', description: '', start_date: '', end_date: '', cost: '', category: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.training.store'), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> New Training
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-sm font-bold">New Training Program</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Title *</Label>
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} className="text-xs" />
                        {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Provider</Label>
                            <Input value={data.provider} onChange={(e) => setData('provider', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Category</Label>
                            <Input value={data.category} onChange={(e) => setData('category', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Start Date *</Label>
                            <Input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">End Date</Label>
                            <Input type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Cost (TZS)</Label>
                        <Input type="number" value={data.cost} onChange={(e) => setData('cost', e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Description</Label>
                        <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Create Training'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EnrollDialog({ training, employees }: { training: TrainingItem; employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({ user_id: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.training.enroll', training.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    const enrolledIds = new Set(training.participants.map((p) => p.user?.id));
    const available = employees.filter((e) => !enrolledIds.has(e.id));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px] font-bold">
                    <UserPlus className="h-3 w-3" /> Enroll
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle className="text-sm font-bold">Enroll in {training.title}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Employee *</Label>
                        <Select value={data.user_id} onValueChange={(v) => setData('user_id', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
                            <SelectContent>
                                {available.map((e) => (
                                    <SelectItem key={e.id} value={String(e.id)} className="text-xs">{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.user_id && <p className="text-xs text-rose-600">{errors.user_id}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Enrolling...' : 'Enroll'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ManageTrainingDialog({ training, employees }: { training: TrainingItem; employees: Employee[] }) {
    const [open, setOpen] = useState(false);

    const complete = (participantId: number, status: 'completed' | 'failed') => {
        const score = status === 'completed' ? prompt('Score (0-100, optional):') : null;
        router.post(route('hr.training.complete', participantId), {
            status,
            score: score || null,
        }, { preserveScroll: true });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-7 gap-1 bg-indigo-600 px-2 text-[11px] font-bold text-white hover:bg-indigo-700">
                    <BookOpen className="h-3 w-3" /> Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-sm font-bold">
                        {training.title}
                        <EnrollDialog training={training} employees={employees} />
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    {training.participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
                            <div>
                                <p className="text-xs font-bold text-neutral-800">{p.user?.name}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge className={`text-[10px] font-bold capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                                    {p.score !== null && <span className="text-[11px] text-neutral-500">Score: {p.score}</span>}
                                </div>
                            </div>
                            {p.status === 'enrolled' && (
                                <div className="flex gap-1">
                                    <Button size="sm" className="h-7 gap-1 bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-700" onClick={() => complete(p.id, 'completed')}>
                                        <CheckCircle2 className="h-3 w-3" /> Pass
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50" onClick={() => complete(p.id, 'failed')}>
                                        <XCircle className="h-3 w-3" /> Fail
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    {training.participants.length === 0 && (
                        <p className="py-8 text-center text-xs text-neutral-400">No participants enrolled yet.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function TrainingIndex({ trainings, employees }: Props) {
    const removeTraining = (training: TrainingItem) => {
        if (confirm(`Remove training "${training.title}"?`)) {
            router.delete(route('hr.training.destroy', training.id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Training Records" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">Training Records</h1>
                    </div>
                    <AddTrainingDialog />
                </div>

                <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                    <Table>
                        <TableHeader className="bg-neutral-50/50">
                            <TableRow>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Training</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Provider</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Dates</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Participants</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trainings.map((t) => (
                                <TableRow key={t.id} className="hover:bg-neutral-50/80">
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                                            <BookOpen className="h-3 w-3 text-neutral-400" /> {t.title}
                                        </div>
                                        {t.category && <p className="text-[11px] text-neutral-400">{t.category}</p>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">{t.provider || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-xs text-neutral-600">{t.start_date} {t.end_date ? `→ ${t.end_date}` : ''}</TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge className="bg-neutral-100 text-[11px] font-bold text-neutral-700">{t.participants.length}</Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <ManageTrainingDialog training={t} employees={employees} />
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeTraining(t)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {trainings.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="py-16 text-center text-xs text-neutral-400">No training programs yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </AppLayout>
    );
}
