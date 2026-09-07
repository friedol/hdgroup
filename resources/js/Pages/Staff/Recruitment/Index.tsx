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
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Briefcase,
    ExternalLink,
    Eye,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import {
    AI_RECOMMENDATION_LABELS,
    AI_RECOMMENDATION_STYLES,
    AssessCandidateButton,
    CandidateItem,
    HireDialog,
    Interviewer,
    JobOpening,
    ScheduleInterviewDialog,
    STAGE_LABELS,
    STAGE_ORDER,
    STAGE_STYLES,
} from './shared';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Recruitment', href: '/hr/recruitment' },
];

interface Props {
    job_openings: JobOpening[];
    candidates: CandidateItem[];
    interviewers: Interviewer[];
    roles: string[];
}

const JOB_STATUS_STYLES: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-600',
    open: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-rose-100 text-rose-700',
};

function AddJobDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm<{
        title: string; department: string; description: string; requirements: string;
        employment_type: string; location: string; salary_range_min: string; salary_range_max: string;
        status: string; closing_date: string; image: File | null;
    }>({
        title: '', department: '', description: '', requirements: '',
        employment_type: 'full_time', location: '', salary_range_min: '', salary_range_max: '',
        status: 'open', closing_date: '', image: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.recruitment.jobs.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> New Job Opening
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">New Job Opening</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Job Title *</Label>
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} className="text-xs" />
                        {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Job Banner Image</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setData('image', e.target.files?.[0] ?? null)} className="text-xs" />
                        {errors.image && <p className="text-xs text-rose-600">{errors.image}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Department</Label>
                            <Input value={data.department} onChange={(e) => setData('department', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Location</Label>
                            <Input value={data.location} onChange={(e) => setData('location', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Employment Type *</Label>
                            <Select value={data.employment_type} onValueChange={(v) => setData('employment_type', v)}>
                                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full_time" className="text-xs">Full-time</SelectItem>
                                    <SelectItem value="part_time" className="text-xs">Part-time</SelectItem>
                                    <SelectItem value="contract" className="text-xs">Contract</SelectItem>
                                    <SelectItem value="intern" className="text-xs">Intern</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Status *</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                                    <SelectItem value="open" className="text-xs">Open</SelectItem>
                                    <SelectItem value="closed" className="text-xs">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Closing Date</Label>
                            <Input type="date" value={data.closing_date} onChange={(e) => setData('closing_date', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Salary Range Min (TZS)</Label>
                            <Input type="number" value={data.salary_range_min} onChange={(e) => setData('salary_range_min', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Salary Range Max (TZS)</Label>
                            <Input type="number" value={data.salary_range_max} onChange={(e) => setData('salary_range_max', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Description</Label>
                        <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Requirements</Label>
                        <Textarea value={data.requirements} onChange={(e) => setData('requirements', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Create Job Opening'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditJobDialog({ job }: { job: JobOpening }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, transform, processing, errors } = useForm<{
        title: string; department: string; description: string; requirements: string;
        employment_type: string; location: string; salary_range_min: string; salary_range_max: string;
        status: string; closing_date: string; image: File | null;
    }>({
        title: job.title,
        department: job.department ?? '',
        description: job.description ?? '',
        requirements: job.requirements ?? '',
        employment_type: job.employment_type,
        location: job.location ?? '',
        salary_range_min: job.salary_range_min ?? '',
        salary_range_max: job.salary_range_max ?? '',
        status: job.status,
        closing_date: job.closing_date ?? '',
        image: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((d) => ({ ...d, _method: 'put' }));
        post(route('hr.recruitment.jobs.update', job.id), {
            forceFormData: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px] font-bold hover:bg-indigo-50 hover:text-indigo-600">
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Edit Job Opening — {job.title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Job Title *</Label>
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} className="text-xs" />
                        {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Job Banner Image</Label>
                        {job.image_path && !data.image && (
                            <img src={`/storage/${job.image_path}`} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
                        )}
                        <Input type="file" accept="image/*" onChange={(e) => setData('image', e.target.files?.[0] ?? null)} className="text-xs" />
                        {errors.image && <p className="text-xs text-rose-600">{errors.image}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Department</Label>
                            <Input value={data.department} onChange={(e) => setData('department', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Location</Label>
                            <Input value={data.location} onChange={(e) => setData('location', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Employment Type *</Label>
                            <Select value={data.employment_type} onValueChange={(v) => setData('employment_type', v)}>
                                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full_time" className="text-xs">Full-time</SelectItem>
                                    <SelectItem value="part_time" className="text-xs">Part-time</SelectItem>
                                    <SelectItem value="contract" className="text-xs">Contract</SelectItem>
                                    <SelectItem value="intern" className="text-xs">Intern</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Status *</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                                    <SelectItem value="open" className="text-xs">Open</SelectItem>
                                    <SelectItem value="closed" className="text-xs">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Closing Date</Label>
                            <Input type="date" value={data.closing_date} onChange={(e) => setData('closing_date', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Salary Range Min (TZS)</Label>
                            <Input type="number" value={data.salary_range_min} onChange={(e) => setData('salary_range_min', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Salary Range Max (TZS)</Label>
                            <Input type="number" value={data.salary_range_max} onChange={(e) => setData('salary_range_max', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Description</Label>
                        <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Requirements</Label>
                        <Textarea value={data.requirements} onChange={(e) => setData('requirements', e.target.value)} className="text-xs" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddCandidateDialog({ jobOpenings }: { jobOpenings: JobOpening[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm<any>({
        job_opening_id: '', name: '', email: '', phone: '', source: 'internal', notes: '', resume: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.recruitment.candidates.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-1 text-xs font-bold">
                    <Plus className="h-3.5 w-3.5" /> Add Candidate
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Add Candidate</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Job Opening *</Label>
                        <Select value={data.job_opening_id} onValueChange={(v) => setData('job_opening_id', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select job opening" /></SelectTrigger>
                            <SelectContent>
                                {jobOpenings.map((j) => (
                                    <SelectItem key={j.id} value={String(j.id)} className="text-xs">{j.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.job_opening_id && <p className="text-xs text-rose-600">{errors.job_opening_id}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Full Name *</Label>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="text-xs" />
                        {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Email *</Label>
                            <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="text-xs" />
                            {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Phone</Label>
                            <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Source</Label>
                        <Input value={data.source} onChange={(e) => setData('source', e.target.value)} className="text-xs" placeholder="e.g. referral, website" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Resume (PDF/Word)</Label>
                        <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setData('resume', e.target.files?.[0] ?? null)} className="text-xs" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Saving...' : 'Add Candidate'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function RecruitmentIndex({ job_openings, candidates, interviewers, roles }: Props) {
    const updateStage = (candidate: CandidateItem, stage: string) => {
        router.put(route('hr.recruitment.candidates.stage', candidate.id), { stage }, { preserveScroll: true });
    };

    const [candidateSearch, setCandidateSearch] = useState('');
    const [jobFilter, setJobFilter] = useState('All');
    const [stageFilter, setStageFilter] = useState('All');
    const [aiFilter, setAiFilter] = useState('All');

    const candidateJobOptions = useMemo(() => {
        const names = new Set<string>();
        candidates.forEach((c) => {
            const label = c.job_opening?.title || c.applied_category;
            if (label) names.add(label);
        });
        return Array.from(names).sort();
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        const term = candidateSearch.trim().toLowerCase();
        return candidates.filter((c) => {
            const jobLabel = c.job_opening?.title || c.applied_category || '';
            const matchesSearch = !term || c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term);
            const matchesJob = jobFilter === 'All' || jobLabel === jobFilter;
            const matchesStage = stageFilter === 'All' || c.stage === stageFilter;
            const matchesAi = aiFilter === 'All'
                || (aiFilter === 'not_assessed' ? !c.ai_assessed_at : c.ai_recommendation === aiFilter);
            return matchesSearch && matchesJob && matchesStage && matchesAi;
        });
    }, [candidates, candidateSearch, jobFilter, stageFilter, aiFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recruitment" />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">Recruitment</h1>
                    </div>
                    <div className="flex gap-2">
                        <AddCandidateDialog jobOpenings={job_openings} />
                        <AddJobDialog />
                    </div>
                </div>

                <Tabs defaultValue="jobs">
                    <TabsList>
                        <TabsTrigger value="jobs" className="text-xs font-bold">Job Openings</TabsTrigger>
                        <TabsTrigger value="candidates" className="text-xs font-bold">Candidates</TabsTrigger>
                    </TabsList>

                    <TabsContent value="jobs">
                        <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                            <Table>
                                <TableHeader className="bg-neutral-50/50">
                                    <TableRow>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Title</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Department</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Type</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Status</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Candidates</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Public Link</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Posted</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {job_openings.map((job) => (
                                        <TableRow key={job.id} className="hover:bg-neutral-50/80">
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                                                    <Briefcase className="h-3 w-3 text-neutral-400" /> {job.title}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-neutral-600">{job.department || '—'}</TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-neutral-600 capitalize">{job.employment_type.replace('_', ' ')}</TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge className={`text-[11px] font-bold capitalize ${JOB_STATUS_STYLES[job.status]}`}>{job.status}</Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge className="gap-1 bg-neutral-100 text-[11px] font-bold text-neutral-700">
                                                    <Users className="h-3 w-3" /> {job.candidates_count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                {job.status === 'open' && (
                                                    <a href={`/careers/apply?job=${job.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline">
                                                        View <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-neutral-600">
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <EditJobDialog job={job} />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-neutral-500 hover:bg-rose-50 hover:text-rose-600"
                                                        onClick={() => {
                                                            if ((job.candidates_count ?? 0) > 0) {
                                                                alert('This job opening has candidates attached to it and cannot be deleted. Close it instead.');
                                                                return;
                                                            }
                                                            if (confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
                                                                router.delete(route('hr.recruitment.jobs.destroy', job.id));
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {job_openings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-16 text-center text-xs text-neutral-400">No job openings yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="candidates">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    value={candidateSearch}
                                    onChange={(e) => setCandidateSearch(e.target.value)}
                                    placeholder="Search name or email..."
                                    className="h-8 pl-8 text-xs"
                                />
                            </div>
                            <Select value={jobFilter} onValueChange={setJobFilter}>
                                <SelectTrigger className="h-8 w-full text-xs sm:w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All" className="text-xs">All Jobs / Categories</SelectItem>
                                    {candidateJobOptions.map((label) => (
                                        <SelectItem key={label} value={label} className="text-xs">{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={stageFilter} onValueChange={setStageFilter}>
                                <SelectTrigger className="h-8 w-full text-xs sm:w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All" className="text-xs">All Stages</SelectItem>
                                    {STAGE_ORDER.map((s) => (
                                        <SelectItem key={s} value={s} className="text-xs">{STAGE_LABELS[s]}</SelectItem>
                                    ))}
                                    <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={aiFilter} onValueChange={setAiFilter}>
                                <SelectTrigger className="h-8 w-full text-xs sm:w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All" className="text-xs">All AI Matches</SelectItem>
                                    <SelectItem value="hire" className="text-xs">{AI_RECOMMENDATION_LABELS.hire}</SelectItem>
                                    <SelectItem value="interview" className="text-xs">{AI_RECOMMENDATION_LABELS.interview}</SelectItem>
                                    <SelectItem value="reject" className="text-xs">{AI_RECOMMENDATION_LABELS.reject}</SelectItem>
                                    <SelectItem value="not_assessed" className="text-xs">Not Assessed</SelectItem>
                                </SelectContent>
                            </Select>
                            {(candidateSearch || jobFilter !== 'All' || stageFilter !== 'All' || aiFilter !== 'All') && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-8 text-xs font-bold text-neutral-500 hover:bg-neutral-100"
                                    onClick={() => { setCandidateSearch(''); setJobFilter('All'); setStageFilter('All'); setAiFilter('All'); }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                            <span className="text-[11px] font-bold text-neutral-400 sm:ml-auto">
                                {filteredCandidates.length} of {candidates.length} candidates
                            </span>
                        </div>
                        <Card className="overflow-hidden border-none bg-white shadow-sm dark:bg-neutral-900">
                            <Table>
                                <TableHeader className="bg-neutral-50/50">
                                    <TableRow>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Candidate</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Job Opening</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">AI Match</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Stage</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Interviews</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-bold text-neutral-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCandidates.map((c) => (
                                        <TableRow key={c.id} className="hover:bg-neutral-50/80">
                                            <TableCell className="px-4 py-3">
                                                <Link href={route('hr.recruitment.candidates.show', c.id)} className="text-xs font-bold text-neutral-800 hover:text-indigo-600 hover:underline">
                                                    {c.name}
                                                </Link>
                                                <p className="text-[11px] text-neutral-400">{c.email}</p>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-neutral-600">{c.job_opening?.title || c.applied_category || '—'}</TableCell>
                                            <TableCell className="px-4 py-3">
                                                {c.ai_assessed_at ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge className={`text-[11px] font-bold ${AI_RECOMMENDATION_STYLES[c.ai_recommendation ?? ''] ?? 'bg-neutral-100 text-neutral-700'}`}>
                                                            {c.ai_score}/100
                                                        </Badge>
                                                        <span className="text-[11px] font-bold text-neutral-500">
                                                            {AI_RECOMMENDATION_LABELS[c.ai_recommendation ?? ''] ?? c.ai_recommendation}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <AssessCandidateButton candidate={c} size="xs" />
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                {c.stage === 'hired' || c.stage === 'rejected' ? (
                                                    <Badge className={`text-[11px] font-bold ${STAGE_STYLES[c.stage]}`}>{STAGE_LABELS[c.stage] ?? c.stage}</Badge>
                                                ) : (
                                                    <Select value={c.stage} onValueChange={(v) => updateStage(c, v)}>
                                                        <SelectTrigger className={`h-7 w-44 text-[11px] font-bold ${STAGE_STYLES[c.stage]}`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STAGE_ORDER.filter((s) => s !== 'hired').map((s) => (
                                                                <SelectItem key={s} value={s} className="text-xs">{STAGE_LABELS[s]}</SelectItem>
                                                            ))}
                                                            <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-neutral-600">
                                                {c.interviews.length > 0
                                                    ? c.interviews.map((i) => (
                                                        <div key={i.id} className="text-[11px]">
                                                            {new Date(i.scheduled_at).toLocaleString()} · {i.status}
                                                        </div>
                                                    ))
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Link href={route('hr.recruitment.candidates.show', c.id)}>
                                                        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px] font-bold hover:bg-neutral-100">
                                                            <Eye className="h-3 w-3" /> View
                                                        </Button>
                                                    </Link>
                                                    {c.stage !== 'hired' && c.stage !== 'rejected' && (
                                                        <>
                                                            <ScheduleInterviewDialog candidate={c} interviewers={interviewers} />
                                                            <HireDialog candidate={c} roles={roles} />
                                                        </>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-neutral-500 hover:bg-rose-50 hover:text-rose-600"
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to delete ${c.name}'s application? This action cannot be undone.`)) {
                                                                router.delete(route('hr.recruitment.candidates.destroy', c.id));
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredCandidates.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-16 text-center text-xs text-neutral-400">
                                                {candidates.length === 0 ? 'No candidates yet.' : 'No candidates match the current filters.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
