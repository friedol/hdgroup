import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    AlertTriangle,
    CheckCircle2,
    Edit2,
    Plus,
    Save,
    Star,
    Trash2,
    TrendingUp,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'HR', href: '#' },
    { title: 'Task Rate Configuration', href: '/hr/task-rates' },
];

function fmt(n: number) {
    return new Intl.NumberFormat('en-TZ').format(n);
}

interface TaskRate {
    id: number;
    activity_name: string;
    points: string;
    rate: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface UnconfiguredActivity {
    activity_name: string;
    activity_type: string;
}

interface Props {
    task_rates: TaskRate[];
    unconfigured: UnconfiguredActivity[];
    work_plan_types: UnconfiguredActivity[];
    total_rates: number;
    avg_rate: number;
    avg_points: number;
}

/** Row in edit mode */
function EditingRow({
    rate,
    onCancel,
}: {
    rate: TaskRate;
    onCancel: () => void;
}) {
    const { data, setData, put, processing } = useForm({
        activity_name: rate.activity_name,
        points: rate.points,
        rate: rate.rate,
        description: rate.description ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('hr.task-rates.update', rate.id), {
            onSuccess: onCancel,
        });
    };

    return (
        <TableRow className="bg-indigo-50/50 dark:bg-indigo-950/30">
            <TableCell className="px-4 py-2">
                <Input
                    value={data.activity_name}
                    onChange={(e) => setData('activity_name', e.target.value)}
                    className="h-8 text-xs font-bold"
                />
            </TableCell>
            <TableCell className="px-4 py-2">
                <Input
                    type="number"
                    min="0"
                    value={data.points}
                    onChange={(e) => setData('points', e.target.value)}
                    className="h-8 w-24 text-xs font-bold text-center"
                />
            </TableCell>
            <TableCell className="px-4 py-2">
                <Input
                    type="number"
                    min="0"
                    value={data.rate}
                    onChange={(e) => setData('rate', e.target.value)}
                    className="h-8 w-32 text-xs font-bold text-right"
                />
            </TableCell>
            <TableCell className="px-4 py-2 text-xs text-neutral-500 italic">
                {parseFloat(String(data.points)) > 0 && parseFloat(String(data.rate)) > 0
                    ? `${fmt(parseFloat(String(data.points)) * parseFloat(String(data.rate)))} TZS / unit`
                    : '—'}
            </TableCell>
            <TableCell className="px-4 py-2">
                <Input
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="e.g. Points per unit completed"
                />
            </TableCell>
            <TableCell className="px-4 py-2">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="h-7 w-7 p-0 bg-indigo-600 hover:bg-indigo-700"
                        onClick={submit}
                        disabled={processing}
                    >
                        <Save className="h-3.5 w-3.5 text-white" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600"
                        onClick={onCancel}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

/** Normal display row */
function DisplayRow({
    rate,
    onEdit,
}: {
    rate: TaskRate;
    onEdit: () => void;
}) {
    const earnings = parseFloat(rate.points) * parseFloat(rate.rate);
    return (
        <TableRow className="hover:bg-neutral-50/80 border-neutral-100">
            <TableCell className="px-4 py-3">
                <span className="text-[13px] font-bold text-neutral-800">{rate.activity_name}</span>
            </TableCell>
            <TableCell className="px-4 py-3 text-center">
                <Badge className="bg-indigo-100 text-indigo-700 font-mono font-bold text-xs gap-1">
                    <Star className="h-3 w-3" /> {parseFloat(rate.points).toFixed(0)} pts
                </Badge>
            </TableCell>
            <TableCell className="px-4 py-3 text-right">
                <span className="font-mono text-[13px] font-bold text-emerald-700">
                    {fmt(parseFloat(rate.rate))} TZS
                </span>
            </TableCell>
            <TableCell className="px-4 py-3 text-right">
                <span className="font-mono text-xs font-bold text-purple-700">
                    {fmt(earnings)} TZS/unit
                </span>
            </TableCell>
            <TableCell className="px-4 py-3 text-xs text-neutral-500 max-w-xs truncate">
                {rate.description || '—'}
            </TableCell>
            <TableCell className="px-4 py-3">
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={onEdit}
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => {
                            if (confirm(`Delete rate for "${rate.activity_name}"?`)) {
                                router.delete(route('hr.task-rates.destroy', rate.id), {
                                    preserveScroll: true,
                                });
                            }
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

/** Add new task rate dialog */
function AddRateDialog({ defaultName = '', workPlanTypes = [] }: { defaultName?: string, workPlanTypes?: UnconfiguredActivity[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        activity_name: defaultName,
        points: '',
        rate: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('hr.task-rates.store'), {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className={
                        defaultName
                            ? 'h-7 gap-1 bg-amber-500 text-xs font-bold text-white hover:bg-amber-600'
                            : 'gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700'
                    }
                >
                    <Plus className="h-3.5 w-3.5" />
                    {defaultName ? 'Configure' : 'Add Job Type'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">
                        {defaultName ? `Configure Rate: ${defaultName}` : 'New Job Type Rate'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Activity / Job Name *</Label>
                        <Input
                            list="work-plan-types"
                            value={data.activity_name}
                            onChange={(e) => setData('activity_name', e.target.value)}
                            className="text-xs"
                            placeholder="Type or select a job name..."
                        />
                        <datalist id="work-plan-types">
                            {workPlanTypes.map(u => (
                                <option key={u.activity_name} value={u.activity_name} />
                            ))}
                        </datalist>
                        {errors.activity_name && (
                            <p className="text-xs text-rose-600">{errors.activity_name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Points per Unit *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={data.points}
                                onChange={(e) => setData('points', e.target.value)}
                                className="text-xs"
                                placeholder="e.g. 10"
                            />
                            <p className="text-[10px] text-neutral-500">Points earned per completed unit</p>
                            {errors.points && <p className="text-xs text-rose-600">{errors.points}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Rate (TZS per Unit) *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="100"
                                value={data.rate}
                                onChange={(e) => setData('rate', e.target.value)}
                                className="text-xs"
                                placeholder="e.g. 9000"
                            />
                            <p className="text-[10px] text-neutral-500">Amount paid per completed unit</p>
                            {errors.rate && <p className="text-xs text-rose-600">{errors.rate}</p>}
                        </div>
                    </div>

                    {parseFloat(data.points) > 0 && parseFloat(data.rate) > 0 && (
                        <div className="rounded-lg bg-indigo-50 p-3 flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700">Earnings per unit</span>
                            <span className="font-mono text-sm font-extrabold text-indigo-700">
                                {fmt(parseFloat(data.points) * parseFloat(data.rate))} TZS
                            </span>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Description</Label>
                        <Textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="text-xs"
                            rows={2}
                            placeholder="e.g. Points per completed design"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                            {processing ? 'Saving...' : 'Save Rate'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function TaskRatesIndex({ task_rates, unconfigured, work_plan_types, total_rates, avg_rate, avg_points }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HR – Task Rate Configuration" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">
                            Job Type Rate Configuration
                        </h1>
                    </div>
                    <AddRateDialog workPlanTypes={work_plan_types} />
                </div>

                {/* Summary cards */}
                <StatsSummaryCards
                    stats={[
                        { label: 'Configured Job Types', value: total_rates, subValue: `of ${total_rates + unconfigured.length} total`, icon: <Star />, color: 'indigo' },
                        { label: 'Avg. Rate per Unit', value: `${fmt(Math.round(avg_rate))} TZS`, subValue: 'across all job types', icon: <TrendingUp />, color: 'emerald' },
                        { label: 'Avg. Points per Unit', value: Number(avg_points).toFixed(1), subValue: 'pts — across all job types', icon: <Zap />, color: 'purple' },
                    ]}
                    className="sm:grid-cols-3 lg:grid-cols-3"
                />

                {/* Unconfigured alert */}
                {unconfigured.length > 0 && (
                    <Card className="border-2 border-amber-200 bg-amber-50 shadow-none dark:bg-amber-950/30">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4" />
                                {unconfigured.length} Job Type{unconfigured.length > 1 ? 's' : ''} Without Rates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
                                These activity types appear in project work plans but have no points or rate configured yet.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {unconfigured.map((u) => (
                                    <div
                                        key={u.activity_name}
                                        className="flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1.5 shadow-sm"
                                    >
                                        <span className="text-xs font-bold text-neutral-700">{u.activity_name}</span>
                                        <Badge className="bg-amber-100 text-amber-700 text-[10px] uppercase">{u.activity_type}</Badge>
                                        <AddRateDialog defaultName={u.activity_name} workPlanTypes={work_plan_types} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {unconfigured.length === 0 && total_rates > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">
                            All known job types have rates configured.
                        </span>
                    </div>
                )}

                {/* Main table */}
                <Card className="shrink-0 overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                    <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                            All Job Type Rates
                            <Badge className="ml-auto bg-indigo-600 text-white font-mono">{total_rates}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-neutral-50/50">
                            <TableRow>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Job / Activity Name</TableHead>
                                <TableHead className="px-4 py-3 text-center text-xs font-bold text-indigo-700">
                                    <span className="flex items-center justify-center gap-1">
                                        <Star className="h-3.5 w-3.5" /> Points / Unit
                                    </span>
                                </TableHead>
                                <TableHead className="px-4 py-3 text-right text-xs font-bold text-emerald-700">Rate / Unit (TZS)</TableHead>
                                <TableHead className="px-4 py-3 text-right text-xs font-bold text-purple-700">
                                    <span className="flex items-center justify-end gap-1">
                                        <Zap className="h-3.5 w-3.5" /> Earnings / Unit
                                    </span>
                                </TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Description</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {task_rates.map((rate: TaskRate) =>
                                editingId === rate.id ? (
                                    <EditingRow
                                        key={rate.id}
                                        rate={rate}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ) : (
                                    <DisplayRow
                                        key={rate.id}
                                        rate={rate}
                                        onEdit={() => setEditingId(rate.id)}
                                    />
                                ),
                            )}
                            {task_rates.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-16 text-center text-xs text-neutral-400">
                                        No job types configured yet. Click "Add Job Type" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </AppLayout>
    );
}
