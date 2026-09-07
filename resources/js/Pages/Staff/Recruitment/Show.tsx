import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    FileText,
    GraduationCap,
    ListChecks,
    Mail,
    MapPin,
    Pencil,
    Phone,
    ShieldCheck,
    Sparkles,
    Users,
    Wrench,
    XCircle,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import {
    AI_RECOMMENDATION_LABELS,
    AI_RECOMMENDATION_STYLES,
    AssessCandidateButton,
    CandidateItem,
    HireDialog,
    Interviewer,
    PipelineStepper,
    ScheduleInterviewDialog,
    STAGE_LABELS,
    STAGE_ORDER,
    STAGE_STYLES,
} from './shared';

interface Props {
    candidate: CandidateItem;
    interviewers: Interviewer[];
    roles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Human Resources', href: '#' },
    { title: 'Recruitment', href: '/hr/recruitment' },
    { title: 'Candidate', href: '#' },
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    const isEmpty = value === null || value === undefined || value === '';
    return (
        <div>
            <p className="text-[10px] font-bold tracking-wide text-neutral-400 uppercase">{label}</p>
            <p className="text-xs font-bold text-neutral-800">{isEmpty ? '—' : value}</p>
        </div>
    );
}

function YesNo({ label, value }: { label: string; value: boolean | null | undefined }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span className="text-xs font-bold text-neutral-700">{label}</span>
            {value === null || value === undefined ? (
                <span className="text-[11px] text-neutral-400">—</span>
            ) : value ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Yes</span>
            ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600"><XCircle className="h-3.5 w-3.5" /> No</span>
            )}
        </div>
    );
}

function SkillGroup({ title, items }: { title: string; items?: string[] }) {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <p className="mb-1 text-[10px] font-bold tracking-wide text-neutral-400 uppercase">{title}</p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((i) => (
                    <Badge key={i} className="bg-indigo-50 text-[11px] font-bold text-indigo-700">{i}</Badge>
                ))}
            </div>
        </div>
    );
}

function DocumentLink({ label, path }: { label: string; path?: string | null }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span className="flex items-center gap-1 text-xs font-bold text-neutral-700">
                <FileText className="h-3.5 w-3.5 text-neutral-400" /> {label}
            </span>
            {path ? (
                <a href={`/storage/${path}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-indigo-600 hover:underline">
                    View
                </a>
            ) : (
                <span className="text-[11px] text-neutral-400">Not provided</span>
            )}
        </div>
    );
}

function PipelineDetailsForm({ candidate: c, onSaved }: { candidate: CandidateItem; onSaved?: () => void }) {
    const { data, setData, put, processing, recentlySuccessful } = useForm({
        phone_screening_notes: c.phone_screening_notes ?? '',
        skills_assessment_score: c.skills_assessment_score ?? '',
        skills_assessment_notes: c.skills_assessment_notes ?? '',
        reference_check_status: c.reference_check_status ?? '',
        reference_check_notes: c.reference_check_notes ?? '',
        background_check_status: c.background_check_status ?? '',
        background_check_notes: c.background_check_notes ?? '',
        medical_exam_status: c.medical_exam_status ?? '',
        medical_exam_notes: c.medical_exam_notes ?? '',
        selection_notes: c.selection_notes ?? '',
        offer_amount: c.offer_amount ?? '',
        offer_sent_at: c.offer_sent_at ? c.offer_sent_at.slice(0, 10) : '',
        offer_accepted_at: c.offer_accepted_at ? c.offer_accepted_at.slice(0, 10) : '',
        documents_received: {
            national_id: c.documents_received?.national_id ?? false,
            tax_number: c.documents_received?.tax_number ?? false,
            social_security: c.documents_received?.social_security ?? false,
            bank_details: c.documents_received?.bank_details ?? false,
            academic_certificates: c.documents_received?.academic_certificates ?? false,
        },
        onboarding_notes: c.onboarding_notes ?? '',
        onboarding_completed_at: c.onboarding_completed_at ? c.onboarding_completed_at.slice(0, 10) : '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('hr.recruitment.candidates.pipeline', c.id), { preserveScroll: true, onSuccess: () => onSaved?.() });
    };

    const documentLabels: Record<string, string> = {
        national_id: 'National ID',
        tax_number: 'Tax Number (TIN)',
        social_security: 'Social Security (NSSF)',
        bank_details: 'Bank Details',
        academic_certificates: 'Academic Certificates',
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Phone Screening Notes</Label>
                    <Textarea value={data.phone_screening_notes} onChange={(e) => setData('phone_screening_notes', e.target.value)} className="text-xs" rows={2} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Skills Assessment Score (0-100)</Label>
                    <Input type="number" min="0" max="100" value={data.skills_assessment_score} onChange={(e) => setData('skills_assessment_score', e.target.value as any)} className="text-xs" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-bold">Skills Assessment Notes</Label>
                    <Textarea value={data.skills_assessment_notes} onChange={(e) => setData('skills_assessment_notes', e.target.value)} className="text-xs" rows={2} />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-bold">Reference Check Status</Label>
                    <Select value={data.reference_check_status} onValueChange={(v) => setData('reference_check_status', v)}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="Pending" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                            <SelectItem value="verified" className="text-xs">Verified</SelectItem>
                            <SelectItem value="failed" className="text-xs">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Reference Check Notes</Label>
                    <Input value={data.reference_check_notes} onChange={(e) => setData('reference_check_notes', e.target.value)} className="text-xs" />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-bold">Background Verification Status</Label>
                    <Select value={data.background_check_status} onValueChange={(v) => setData('background_check_status', v)}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="Pending" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                            <SelectItem value="verified" className="text-xs">Verified</SelectItem>
                            <SelectItem value="failed" className="text-xs">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Background Verification Notes</Label>
                    <Input value={data.background_check_notes} onChange={(e) => setData('background_check_notes', e.target.value)} className="text-xs" />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-bold">Medical Examination Status</Label>
                    <Select value={data.medical_exam_status} onValueChange={(v) => setData('medical_exam_status', v)}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="Pending" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                            <SelectItem value="passed" className="text-xs">Passed</SelectItem>
                            <SelectItem value="failed" className="text-xs">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Medical Examination Notes</Label>
                    <Input value={data.medical_exam_notes} onChange={(e) => setData('medical_exam_notes', e.target.value)} className="text-xs" />
                </div>

                <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-bold">Selection Decision Notes</Label>
                    <Textarea value={data.selection_notes} onChange={(e) => setData('selection_notes', e.target.value)} className="text-xs" rows={2} />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-bold">Job Offer Amount (TZS)</Label>
                    <Input type="number" min="0" value={data.offer_amount} onChange={(e) => setData('offer_amount', e.target.value as any)} className="text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Offer Sent</Label>
                        <Input type="date" value={data.offer_sent_at} onChange={(e) => setData('offer_sent_at', e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Offer Accepted</Label>
                        <Input type="date" value={data.offer_accepted_at} onChange={(e) => setData('offer_accepted_at', e.target.value)} className="text-xs" />
                    </div>
                </div>

                <div className="sm:col-span-2 space-y-2">
                    <Label className="text-xs font-bold">Pre-Employment Documentation Received</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.entries(documentLabels).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700">
                                <Checkbox
                                    checked={(data.documents_received as any)[key]}
                                    onCheckedChange={(v) => setData('documents_received', { ...data.documents_received, [key]: !!v })}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-bold">Onboarding Completed On</Label>
                    <Input type="date" value={data.onboarding_completed_at} onChange={(e) => setData('onboarding_completed_at', e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold">Onboarding Notes</Label>
                    <Input value={data.onboarding_notes} onChange={(e) => setData('onboarding_notes', e.target.value)} className="text-xs" />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
                {recentlySuccessful && <span className="text-[11px] font-bold text-emerald-600">Saved.</span>}
                <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                    {processing ? 'Saving...' : 'Save Pipeline Details'}
                </Button>
            </div>
        </form>
    );
}

function PipelineDetailsDialog({ candidate }: { candidate: CandidateItem }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px] font-bold">
                    <Pencil className="h-3 w-3" /> Fill Pipeline Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Pipeline Details — {candidate.name}</DialogTitle>
                </DialogHeader>
                <PipelineDetailsForm candidate={candidate} onSaved={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

export default function RecruitmentCandidateShow({ candidate: c, interviewers, roles }: Props) {
    const skills = c.skills ?? {};
    const hasSkills = Object.values(skills).some((v) => Array.isArray(v) && v.length > 0) || !!skills.other;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Candidate — ${c.name}`} />

            <div className="flex h-full flex-1 shrink-0 flex-col gap-6 bg-neutral-50/50 py-4 md:py-8 px-3 md:px-4 dark:bg-neutral-900/50">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <Link href={route('hr.recruitment.index')} className="mb-1 flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-indigo-600">
                            <ArrowLeft className="h-3 w-3" /> Back to Recruitment
                        </Link>
                        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white md:text-xl">{c.name}</h1>
                        <p className="text-xs font-medium text-neutral-500">{c.email} · {c.phone || 'No phone'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`text-xs font-bold ${STAGE_STYLES[c.stage]}`}>{STAGE_LABELS[c.stage] ?? c.stage}</Badge>
                        {c.stage !== 'hired' && c.stage !== 'rejected' && (
                            <>
                                <ScheduleInterviewDialog candidate={c} interviewers={interviewers} />
                                <HireDialog candidate={c} roles={roles} />
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900 lg:col-span-2">
                        <CardHeader className="flex-col items-start gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <ListChecks className="h-4 w-4 text-indigo-600" /> Recruitment Pipeline
                            </CardTitle>
                            {c.stage !== 'hired' && c.stage !== 'rejected' && (
                                <Select
                                    value={c.stage}
                                    onValueChange={(v) => router.put(route('hr.recruitment.candidates.stage', c.id), { stage: v }, { preserveScroll: true })}
                                >
                                    <SelectTrigger className={`h-7 w-48 text-[11px] font-bold ${STAGE_STYLES[c.stage]}`}>
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
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <PipelineStepper stage={c.stage} />
                            <PipelineDetailsDialog candidate={c} />
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900 lg:col-span-2">
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <Sparkles className="h-4 w-4 text-indigo-600" /> AI Qualification Assessment
                            </CardTitle>
                            <AssessCandidateButton candidate={c} />
                        </CardHeader>
                        <CardContent>
                            {c.ai_assessed_at ? (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className={`text-xs font-bold ${AI_RECOMMENDATION_STYLES[c.ai_recommendation ?? ''] ?? 'bg-neutral-100 text-neutral-700'}`}>
                                            {AI_RECOMMENDATION_LABELS[c.ai_recommendation ?? ''] ?? c.ai_recommendation}
                                        </Badge>
                                        <span className="text-xs font-bold text-neutral-600">Match Score: {c.ai_score}/100</span>
                                        <span className="text-[11px] text-neutral-400">
                                            Assessed {new Date(c.ai_assessed_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {c.ai_summary && <p className="text-xs leading-relaxed text-neutral-700">{c.ai_summary}</p>}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {c.ai_strengths && c.ai_strengths.length > 0 && (
                                            <div>
                                                <p className="mb-1 text-[10px] font-bold tracking-wide text-emerald-600 uppercase">Strengths</p>
                                                <ul className="space-y-1">
                                                    {c.ai_strengths.map((s, i) => (
                                                        <li key={i} className="text-xs text-neutral-700">• {s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {c.ai_concerns && c.ai_concerns.length > 0 && (
                                            <div>
                                                <p className="mb-1 text-[10px] font-bold tracking-wide text-rose-600 uppercase">Concerns</p>
                                                <ul className="space-y-1">
                                                    {c.ai_concerns.map((s, i) => (
                                                        <li key={i} className="text-xs text-neutral-700">• {s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-400">
                                    Not assessed yet. Run the AI assessment to get a qualification recommendation based on this
                                    candidate's profile against the job requirements.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <Users className="h-4 w-4 text-indigo-600" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Field label="Full Name" value={c.name} />
                            <Field label="Gender" value={c.gender} />
                            <Field label="Phone" value={<span className="flex items-center gap-1"><Phone className="h-3 w-3 text-neutral-400" />{c.phone}</span>} />
                            <Field label="Email" value={<span className="flex items-center gap-1"><Mail className="h-3 w-3 text-neutral-400" />{c.email}</span>} />
                            <Field label="Date of Birth" value={c.date_of_birth} />
                            <div className="col-span-2">
                                <Field
                                    label="Address"
                                    value={
                                        [c.address_line1, c.address_line2, c.city, c.state, c.postal_code].filter(Boolean).length
                                            ? <span className="flex items-start gap-1"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-neutral-400" />{[c.address_line1, c.address_line2, c.city, c.state, c.postal_code].filter(Boolean).join(', ')}</span>
                                            : undefined
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <Briefcase className="h-4 w-4 text-indigo-600" /> Job Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Field label="Position Applying For" value={c.job_opening?.title || c.applied_category} />
                            <Field label="Source" value={c.source} />
                            <Field label="Years of Experience" value={c.years_experience} />
                            <Field label="Expected Salary" value={c.expected_salary} />
                            <Field label="Available From" value={c.available_from} />
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <GraduationCap className="h-4 w-4 text-indigo-600" /> Education
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Field label="Highest Education" value={c.education_level} />
                            <Field label="Graduation Year" value={c.graduation_year} />
                            <Field label="School Attended" value={c.school_name} />
                            <Field label="Course / Field of Study" value={c.course} />
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <Wrench className="h-4 w-4 text-indigo-600" /> Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {hasSkills ? (
                                <>
                                    <SkillGroup title="Welding" items={skills.welding} />
                                    <SkillGroup title="Fabrication" items={skills.fabrication} />
                                    <SkillGroup title="Drawing Reading" items={skills.drawing_reading} />
                                    <SkillGroup title="Grinding" items={skills.grinding} />
                                    <SkillGroup title="Fitting" items={skills.fitting} />
                                    <SkillGroup title="Painting" items={skills.painting} />
                                    <SkillGroup title="Machine Operation" items={skills.machine_operation} />
                                    <SkillGroup title="Safety" items={skills.safety} />
                                    <SkillGroup title="Machine Experience" items={skills.machines} />
                                    {skills.other && (
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-wide text-neutral-400 uppercase">Other Skills</p>
                                            <p className="text-xs text-neutral-700">{skills.other}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-neutral-400">No skills information provided.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <Briefcase className="h-4 w-4 text-indigo-600" /> Employment History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Field label="Previous Employer" value={c.prev_employer} />
                            <Field label="Position Held" value={c.prev_position} />
                            <Field label="Start Date" value={c.employment_start_date} />
                            <Field label="End Date" value={c.employment_end_date} />
                            <div className="col-span-2">
                                <Field label="Responsibilities" value={c.employment_responsibilities} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <Users className="h-4 w-4 text-indigo-600" /> Referee
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Field label="Name" value={[c.referee_first_name, c.referee_middle_name, c.referee_last_name].filter(Boolean).join(' ') || undefined} />
                            <Field label="Relationship" value={c.referee_relationship} />
                            <Field label="Company" value={c.referee_company} />
                            <Field label="Phone" value={c.referee_phone} />
                            <Field label="Email" value={c.referee_email} />
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <ShieldCheck className="h-4 w-4 text-indigo-600" /> Additional Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <YesNo label="Can ride a motorcycle?" value={c.can_ride_motorcycle} />
                            <YesNo label="City riding experience?" value={c.motorcycle_city_experience} />
                            <YesNo label="Willing to work in Kigamboni, Dar es Salaam?" value={c.willing_kigamboni} />
                            <YesNo label="Has a driving license?" value={c.has_driving_license} />
                            <YesNo label="Willing to do overtime?" value={c.willing_overtime} />
                            <YesNo label="Worked at a fabrication company before?" value={c.worked_fabrication_before} />
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <FileText className="h-4 w-4 text-indigo-600" /> Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <DocumentLink label="CV / Resume" path={c.resume_path} />
                            <DocumentLink label="National ID" path={c.national_id_path} />
                            <DocumentLink label="Academic Certificates" path={c.academic_certificates_path} />
                            <DocumentLink label="Passport Photo" path={c.passport_photo_path} />
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900 lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Declaration & Signature
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <YesNo label="Agreed to terms & confirmed information is true" value={c.agreement} />
                            {c.signature_path ? (
                                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                                    <img src={`/storage/${c.signature_path}`} alt="Signature" className="h-16 object-contain" />
                                </div>
                            ) : (
                                <span className="text-xs text-neutral-400">No signature provided</span>
                            )}
                        </CardContent>
                    </Card>

                    {c.notes && (
                        <Card className="border-none bg-white shadow-sm dark:bg-neutral-900 lg:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-neutral-700">Internal Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-neutral-700">{c.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-none bg-white shadow-sm dark:bg-neutral-900 lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-neutral-700">
                                <Calendar className="h-4 w-4 text-indigo-600" /> Interview History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {c.interviews.length > 0 ? c.interviews.map((i) => (
                                <div key={i.id} className="flex flex-col justify-between gap-2 rounded-lg bg-neutral-50 p-3 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="text-xs font-bold text-neutral-800">
                                            {new Date(i.scheduled_at).toLocaleString()} · <span className="capitalize">{i.mode.replace('_', ' ')}</span>
                                        </p>
                                        <p className="text-[11px] text-neutral-500">
                                            {i.interviewer?.name ? `Interviewer: ${i.interviewer.name}` : 'No interviewer assigned'}
                                            {i.location_or_link && ` · ${i.location_or_link}`}
                                        </p>
                                        {i.feedback && <p className="mt-1 text-[11px] text-neutral-600">Feedback: {i.feedback}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {i.rating && <Badge className="bg-amber-100 text-[11px] font-bold text-amber-700">{i.rating} / 5</Badge>}
                                        <Badge className="bg-neutral-200 text-[11px] font-bold text-neutral-700 capitalize">{i.status.replace('_', ' ')}</Badge>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-neutral-400">No interviews scheduled yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
