import { Button } from '@/components/ui/button';
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
import { router, useForm } from '@inertiajs/react';
import { CalendarPlus, Sparkles, UserCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export interface JobOpening {
    id: number;
    title: string;
    slug: string;
    image_path: string | null;
    department: string | null;
    description: string | null;
    requirements: string | null;
    employment_type: string;
    location: string | null;
    salary_range_min: string | null;
    salary_range_max: string | null;
    status: string;
    closing_date: string | null;
    created_at: string;
    candidates_count?: number;
}

export interface InterviewItem {
    id: number;
    scheduled_at: string;
    mode: string;
    location_or_link: string | null;
    status: string;
    feedback: string | null;
    rating: number | null;
    interviewer?: { id: number; name: string } | null;
}

export interface CandidateItem {
    id: number;
    job_opening_id: number | null;
    name: string;
    email: string;
    phone: string | null;
    stage: string;
    source: string | null;
    notes: string | null;
    resume_path: string | null;
    applied_category: string | null;
    job_opening: JobOpening | null;
    interviews: InterviewItem[];

    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;

    years_experience?: number | null;
    expected_salary?: string | null;
    available_from?: string | null;

    education_level?: string | null;
    school_name?: string | null;
    course?: string | null;
    graduation_year?: number | null;

    skills?: {
        welding?: string[];
        fabrication?: string[];
        drawing_reading?: string[];
        grinding?: string[];
        fitting?: string[];
        painting?: string[];
        machine_operation?: string[];
        safety?: string[];
        machines?: string[];
        other?: string | null;
    } | null;

    prev_employer?: string | null;
    prev_position?: string | null;
    employment_start_date?: string | null;
    employment_end_date?: string | null;
    employment_responsibilities?: string | null;

    referee_first_name?: string | null;
    referee_middle_name?: string | null;
    referee_last_name?: string | null;
    referee_relationship?: string | null;
    referee_company?: string | null;
    referee_phone?: string | null;
    referee_email?: string | null;

    national_id_path?: string | null;
    academic_certificates_path?: string | null;
    passport_photo_path?: string | null;
    signature_path?: string | null;

    can_ride_motorcycle?: boolean | null;
    motorcycle_city_experience?: boolean | null;
    willing_kigamboni?: boolean | null;
    has_driving_license?: boolean | null;
    willing_overtime?: boolean | null;
    worked_fabrication_before?: boolean | null;
    agreement?: boolean;

    ai_recommendation?: string | null;
    ai_score?: number | null;
    ai_summary?: string | null;
    ai_strengths?: string[] | null;
    ai_concerns?: string[] | null;
    ai_assessed_at?: string | null;

    phone_screening_notes?: string | null;
    skills_assessment_score?: number | null;
    skills_assessment_notes?: string | null;
    reference_check_status?: string | null;
    reference_check_notes?: string | null;
    background_check_status?: string | null;
    background_check_notes?: string | null;
    medical_exam_status?: string | null;
    medical_exam_notes?: string | null;
    selection_notes?: string | null;
    offer_amount?: string | null;
    offer_sent_at?: string | null;
    offer_accepted_at?: string | null;
    documents_received?: {
        national_id?: boolean;
        tax_number?: boolean;
        social_security?: boolean;
        bank_details?: boolean;
        academic_certificates?: boolean;
    } | null;
    onboarding_notes?: string | null;
    onboarding_completed_at?: string | null;
}

export interface Interviewer {
    id: number;
    name: string;
}

// Ordered recruitment pipeline stages (steps 5-17 of the documented recruitment
// process). 'hired' is the final step reached only via the Hire dialog;
// 'rejected' can happen from any stage and is shown separately, not in the stepper.
export const STAGE_ORDER = [
    'applied', 'screening', 'phone_screening', 'skills_assessment', 'interview',
    'reference_check', 'background_check', 'medical_exam', 'selection',
    'offer', 'contract', 'documentation', 'onboarding', 'hired',
];

export const STAGE_LABELS: Record<string, string> = {
    applied: 'Applied',
    screening: 'Application Screening',
    phone_screening: 'Phone Screening',
    skills_assessment: 'Skills Assessment',
    interview: 'Interview',
    reference_check: 'Reference Check',
    background_check: 'Background Verification',
    medical_exam: 'Medical Examination',
    selection: 'Selection Decision',
    offer: 'Job Offer',
    contract: 'Employment Contract',
    documentation: 'Pre-Employment Docs',
    onboarding: 'Onboarding',
    hired: 'Hired',
    rejected: 'Rejected',
};

export const STAGE_STYLES: Record<string, string> = {
    applied: 'bg-neutral-100 text-neutral-700',
    screening: 'bg-blue-100 text-blue-700',
    phone_screening: 'bg-sky-100 text-sky-700',
    skills_assessment: 'bg-cyan-100 text-cyan-700',
    interview: 'bg-amber-100 text-amber-700',
    reference_check: 'bg-violet-100 text-violet-700',
    background_check: 'bg-violet-100 text-violet-700',
    medical_exam: 'bg-violet-100 text-violet-700',
    selection: 'bg-fuchsia-100 text-fuchsia-700',
    offer: 'bg-purple-100 text-purple-700',
    contract: 'bg-indigo-100 text-indigo-700',
    documentation: 'bg-indigo-100 text-indigo-700',
    onboarding: 'bg-teal-100 text-teal-700',
    hired: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

export function PipelineStepper({ stage }: { stage: string }) {
    if (stage === 'rejected') {
        return (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                This candidate was rejected from the recruitment pipeline.
            </div>
        );
    }

    const currentIndex = STAGE_ORDER.indexOf(stage);

    return (
        <div className="flex flex-wrap gap-2">
            {STAGE_ORDER.map((s, i) => {
                const done = currentIndex >= 0 && i < currentIndex;
                const current = i === currentIndex;
                return (
                    <div
                        key={s}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                            current
                                ? 'bg-indigo-600 text-white'
                                : done
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-neutral-100 text-neutral-400'
                        }`}
                    >
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${current ? 'bg-white/20' : done ? 'bg-emerald-200' : 'bg-neutral-200'}`}>
                            {i + 1}
                        </span>
                        {STAGE_LABELS[s]}
                    </div>
                );
            })}
        </div>
    );
}

export const AI_RECOMMENDATION_STYLES: Record<string, string> = {
    hire: 'bg-emerald-100 text-emerald-700',
    interview: 'bg-amber-100 text-amber-700',
    reject: 'bg-rose-100 text-rose-700',
};

export const AI_RECOMMENDATION_LABELS: Record<string, string> = {
    hire: 'Recommend Hire',
    interview: 'Recommend Interview',
    reject: 'Not a Fit',
};

export function AssessCandidateButton({ candidate, size = 'sm' }: { candidate: CandidateItem; size?: 'sm' | 'xs' }) {
    const [processing, setProcessing] = useState(false);

    const run = () => {
        setProcessing(true);
        router.post(route('hr.recruitment.candidates.assess', candidate.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onError: (err) => {
                alert(err.error || 'Failed to assess candidate.');
            }
        });
    };

    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={processing}
            onClick={run}
            className={`gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 ${size === 'xs' ? 'h-7 px-2 text-[11px]' : 'text-xs'} font-bold`}
        >
            <Sparkles className="h-3 w-3" />
            {processing ? 'Assessing...' : candidate.ai_assessed_at ? 'Re-run AI Assessment' : 'Run AI Assessment'}
        </Button>
    );
}

export function ScheduleInterviewDialog({ candidate, interviewers }: { candidate: CandidateItem; interviewers: Interviewer[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        scheduled_at: '', mode: 'in_person', location_or_link: '', interviewer_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.recruitment.interviews.store', candidate.id), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px] font-bold hover:bg-indigo-50 hover:text-indigo-600">
                    <CalendarPlus className="h-3 w-3" /> Interview
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Schedule Interview — {candidate.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Date & Time *</Label>
                        <Input type="datetime-local" value={data.scheduled_at} onChange={(e) => setData('scheduled_at', e.target.value)} className="text-xs" />
                        {errors.scheduled_at && <p className="text-xs text-rose-600">{errors.scheduled_at}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Mode *</Label>
                        <Select value={data.mode} onValueChange={(v) => setData('mode', v)}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in_person" className="text-xs">In Person</SelectItem>
                                <SelectItem value="phone" className="text-xs">Phone</SelectItem>
                                <SelectItem value="video" className="text-xs">Video</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Location / Link</Label>
                        <Input value={data.location_or_link} onChange={(e) => setData('location_or_link', e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Interviewer</Label>
                        <Select value={data.interviewer_id} onValueChange={(v) => setData('interviewer_id', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select interviewer" /></SelectTrigger>
                            <SelectContent>
                                {interviewers.map((i) => (
                                    <SelectItem key={i.id} value={String(i.id)} className="text-xs">{i.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">
                            {processing ? 'Scheduling...' : 'Schedule'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function HireDialog({ candidate, roles }: { candidate: CandidateItem; roles: string[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        role: '', employee_number: '', department: candidate.job_opening?.department ?? candidate.applied_category ?? '',
        position: candidate.job_opening?.title ?? '', employment_type: 'full_time',
        hire_date: new Date().toISOString().slice(0, 10), basic_salary: '', password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hr.recruitment.candidates.hire', candidate.id), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-7 gap-1 bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-700">
                    <UserCheck className="h-3 w-3" /> Hire
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Hire {candidate.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">System Role *</Label>
                        <Select value={data.role} onValueChange={(v) => setData('role', v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-xs text-rose-600">{errors.role}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Employee Number *</Label>
                        <Input value={data.employee_number} onChange={(e) => setData('employee_number', e.target.value)} className="text-xs" placeholder="e.g. EMP-0002" />
                        {errors.employee_number && <p className="text-xs text-rose-600">{errors.employee_number}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Department</Label>
                            <Input value={data.department} onChange={(e) => setData('department', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Position</Label>
                            <Input value={data.position} onChange={(e) => setData('position', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Hire Date *</Label>
                            <Input type="date" value={data.hire_date} onChange={(e) => setData('hire_date', e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Basic Salary (TZS)</Label>
                            <Input type="number" value={data.basic_salary} onChange={(e) => setData('basic_salary', e.target.value)} className="text-xs" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">Account Password *</Label>
                        <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="text-xs" />
                        {errors.password && <p className="text-xs text-rose-600">{errors.password}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700">
                            {processing ? 'Hiring...' : 'Confirm Hire'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
