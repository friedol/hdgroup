import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, Plus, Trash2, TrendingUp, TrendingDown, Minus, Building2, User } from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: number;
  period_type: string;
  period_label: string;
  branch_id: number | null;
  branch_name: string;
  user_id: number | null;
  staff_name: string;
  target_amount: number;
  target_units: number;
  actual_amount: number;
  actual_units: number;
  amount_pct: number;
  units_pct: number;
  notes: string | null;
}

interface BranchSummary {
  branch_id: number;
  branch_name: string;
  total_revenue: number;
  total_orders: number;
}

interface Props {
  achievements: Achievement[];
  branchSummaries: BranchSummary[];
  branches: { id: number; name: string }[];
  staff: { id: number; staff_name: string; branch_id: number }[];
  filters: { period_type: string; period_label: string; branch_id: number | null };
  isGlobal: boolean;
}

const breadcrumbs = [
  { title: "Reports", href: "/report_sales" },
  { title: "Sales Targets", href: "/sales-targets" },
];

function fmt(n: number) {
  return "TZS " + Number(n).toLocaleString("en-TZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const color =
    pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`text-xs font-bold w-12 text-right ${pct >= 100 ? "text-emerald-600" : pct >= 50 ? "text-blue-600" : "text-red-500"}`}>
        {pct}%
      </span>
    </div>
  );
}

function StatusBadge({ pct }: { pct: number }) {
  if (pct >= 100) return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase gap-1"><TrendingUp className="h-3 w-3" />On Target</Badge>;
  if (pct >= 75)  return <Badge className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase gap-1"><Minus className="h-3 w-3" />Near</Badge>;
  return <Badge className="bg-red-100 text-red-600 text-[10px] font-bold uppercase gap-1"><TrendingDown className="h-3 w-3" />Behind</Badge>;
}

// Period label helpers
function currentMonthLabel() { return new Date().toISOString().slice(0, 7); }
function currentQuarterLabel() {
  const m = new Date().getMonth(); // 0-11
  const q = Math.floor(m / 3) + 1;
  return `Q${q}-${new Date().getFullYear()}`;
}
function currentYearLabel() { return String(new Date().getFullYear()); }
function defaultLabel(type: string) {
  if (type === "quarterly") return currentQuarterLabel();
  if (type === "yearly") return currentYearLabel();
  return currentMonthLabel();
}

export default function SalesTargetsIndex({ achievements, branchSummaries, branches, staff, filters, isGlobal }: Props) {
  const [periodType, setPeriodType] = useState(filters.period_type);
  const [periodLabel, setPeriodLabel] = useState(filters.period_label);
  const [filterBranch, setFilterBranch] = useState(String(filters.branch_id ?? "all"));

  // Form state
  const [form, setForm] = useState({
    period_type: "monthly",
    period_label: currentMonthLabel(),
    branch_id: "",
    user_id: "",
    target_amount: "",
    target_units: "",
    notes: "",
  });
  const [showForm, setShowForm] = useState(false);

  const filteredStaff = useMemo(
    () => (form.branch_id ? staff.filter(s => String(s.branch_id) === form.branch_id) : staff),
    [form.branch_id, staff]
  );

  const applyFilters = (type?: string, label?: string, branch?: string) => {
    const t = type ?? periodType;
    const l = label ?? periodLabel;
    const b = branch ?? filterBranch;
    router.get(
      "/sales-targets",
      { period_type: t, period_label: l, branch_id: b === "all" ? undefined : b },
      { preserveState: true }
    );
  };

  const handlePeriodTypeChange = (val: string) => {
    setPeriodType(val);
    const lbl = defaultLabel(val);
    setPeriodLabel(lbl);
    applyFilters(val, lbl);
  };

  const submitTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.target_amount || Number(form.target_amount) <= 0) {
      toast.error("Target amount must be greater than 0");
      return;
    }
    router.post(
      "/sales-targets",
      {
        ...form,
        branch_id: form.branch_id || null,
        user_id: form.user_id || null,
        target_units: form.target_units ? Number(form.target_units) : 0,
      },
      {
        onSuccess: () => { toast.success("Target saved!"); setShowForm(false); },
        onError: () => toast.error("Failed to save target"),
      }
    );
  };

  const deleteTarget = (id: number) => {
    if (!confirm("Delete this target?")) return;
    router.delete(`/sales-targets/${id}`, {
      onSuccess: () => toast.success("Target deleted"),
    });
  };

  // KPI totals
  const totalTargetRevenue  = achievements.reduce((s, a) => s + a.target_amount, 0);
  const totalActualRevenue  = achievements.reduce((s, a) => s + a.actual_amount, 0);
  const overallPct = totalTargetRevenue > 0 ? Math.round((totalActualRevenue / totalTargetRevenue) * 100) : 0;
  const onTarget = achievements.filter(a => a.amount_pct >= 100).length;

  const kpiCards = [
    {
      title: "Total Target",
      value: fmt(totalTargetRevenue),
      icon: Target,
      cardClass: "border-blue-200 bg-blue-50/30",
      iconClass: "bg-blue-100 text-blue-600",
      chipClass: "text-blue-700 bg-blue-100/70",
      chipLabel: "Planned",
      valueClass: "text-slate-900",
    },
    {
      title: "Actual Revenue",
      value: fmt(totalActualRevenue),
      icon: TrendingUp,
      cardClass: "border-emerald-200 bg-emerald-50/30",
      iconClass: "bg-emerald-100 text-emerald-600",
      chipClass: "text-emerald-700 bg-emerald-100/70",
      chipLabel: "Achieved",
      valueClass: "text-emerald-700",
    },
    {
      title: "Overall Achievement",
      value: `${overallPct}%`,
      icon: overallPct >= 100 ? TrendingUp : overallPct >= 75 ? Minus : TrendingDown,
      cardClass: overallPct >= 100 ? "border-emerald-200 bg-emerald-50/30" : overallPct >= 50 ? "border-amber-200 bg-amber-50/30" : "border-rose-200 bg-rose-50/30",
      iconClass: overallPct >= 100 ? "bg-emerald-100 text-emerald-600" : overallPct >= 50 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600",
      chipClass: overallPct >= 100 ? "text-emerald-700 bg-emerald-100/70" : overallPct >= 50 ? "text-amber-700 bg-amber-100/70" : "text-rose-700 bg-rose-100/70",
      chipLabel: overallPct >= 100 ? "On track" : overallPct >= 50 ? "Midway" : "Behind",
      valueClass: overallPct >= 100 ? "text-emerald-700" : overallPct >= 50 ? "text-amber-700" : "text-rose-700",
    },
    {
      title: "On Target",
      value: `${onTarget} / ${achievements.length}`,
      icon: User,
      cardClass: "border-violet-200 bg-violet-50/30",
      iconClass: "bg-violet-100 text-violet-600",
      chipClass: "text-violet-700 bg-violet-100/70",
      chipLabel: "Staff",
      valueClass: "text-violet-700",
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sales Targets" />
      <div className="w-full space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" /> Sales Targets
            </h1>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
          >
            <Plus className="h-4 w-4 mr-2" />Create
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title} className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${kpi.cardClass}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg shadow-sm ${kpi.iconClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.chipClass}`}>
                      {kpi.chipLabel}
                    </span>
                  </div>
                  <p className={`text-[13px] sm:text-[14px] font-semibold leading-none tabular-nums ${kpi.valueClass}`}>{kpi.value}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-2 uppercase tracking-wide">{kpi.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-slate-200 shadow-none">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Period Type</Label>
                <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                  <SelectTrigger className="h-9 w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Period</Label>
                {periodType === "monthly" && (
                  <Input type="month" value={periodLabel} onChange={e => { setPeriodLabel(e.target.value); applyFilters(undefined, e.target.value); }} className="h-9 w-40 text-sm" />
                )}
                {periodType === "quarterly" && (
                  <Select value={periodLabel} onValueChange={v => { setPeriodLabel(v); applyFilters(undefined, v); }}>
                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Q1", "Q2", "Q3", "Q4"].map(q => (
                        <SelectItem key={q} value={`${q}-${new Date().getFullYear()}`}>{q} {new Date().getFullYear()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {periodType === "yearly" && (
                  <Input type="number" value={periodLabel} onChange={e => { setPeriodLabel(e.target.value); applyFilters(undefined, e.target.value); }} className="h-9 w-28 text-sm" min="2020" max="2099" />
                )}
              </div>

              {isGlobal && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Branch</Label>
                  <Select value={filterBranch} onValueChange={v => { setFilterBranch(v); applyFilters(undefined, undefined, v); }}>
                    <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" /> Set Sales Target
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={submitTarget} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period Type</Label>
                  <Select value={form.period_type} onValueChange={v => setForm(p => ({ ...p, period_type: v, period_label: defaultLabel(v) }))}>
                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period</Label>
                  {form.period_type === "monthly" && (
                    <Input type="month" value={form.period_label} onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} className="h-10 text-sm" />
                  )}
                  {form.period_type === "quarterly" && (
                    <Select value={form.period_label} onValueChange={v => setForm(p => ({ ...p, period_label: v }))}>
                      <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                          <SelectItem key={q} value={`${q}-${new Date().getFullYear()}`}>{q} {new Date().getFullYear()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {form.period_type === "yearly" && (
                    <Input type="number" value={form.period_label} onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} className="h-10 text-sm" min="2020" max="2099" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</Label>
                  <Select value={form.branch_id || "none"} onValueChange={v => setForm(p => ({ ...p, branch_id: v === "none" ? "" : v, user_id: "" }))}>
                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Branches</SelectItem>
                      {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff (optional)</Label>
                  <Select value={form.user_id || "none"} onValueChange={v => setForm(p => ({ ...p, user_id: v === "none" ? "" : v }))}>
                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Branch-level (no staff)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Branch Level</SelectItem>
                      {filteredStaff.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.staff_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Target (TZS)</Label>
                  <Input type="number" min="0" step="100" placeholder="e.g. 500000" value={form.target_amount} onChange={e => setForm(p => ({ ...p, target_amount: e.target.value }))} className="h-10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Units / Orders Target</Label>
                  <Input type="number" min="0" placeholder="Optional" value={form.target_units} onChange={e => setForm(p => ({ ...p, target_units: e.target.value }))} className="h-10 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes (optional)</Label>
                <Input placeholder="e.g. End-of-quarter push target" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-10 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]">
                  <Target className="h-4 w-4 mr-2" /> Save Target
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Achievements Table */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3 border-b border-slate-100 px-6">
            <CardTitle className="text-sm font-semibold">
              Target Achievement — {periodLabel}
            </CardTitle>
          </CardHeader>
          <div>
            {achievements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Target className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No targets set for this period</p>
                <p className="text-xs mt-1">Click "New Target" to add one</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 text-left">Scope</th>
                        <th className="px-5 py-3 text-left">Revenue Progress</th>
                        <th className="px-5 py-3 text-left">Units Progress</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {achievements.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {a.user_id
                                ? <User className="h-4 w-4 text-blue-500 shrink-0" />
                                : <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                              }
                              <div>
                                <p className="font-semibold text-slate-900">{a.user_id ? a.staff_name : a.branch_name}</p>
                                {a.user_id && <p className="text-[10px] text-slate-400">{a.branch_name}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 w-60">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>{fmt(a.actual_amount)}</span>
                                <span>of {fmt(a.target_amount)}</span>
                              </div>
                              <ProgressBar pct={a.amount_pct} />
                            </div>
                          </td>
                          <td className="px-5 py-4 w-48">
                            {a.target_units > 0 ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-500">
                                  <span>{a.actual_units.toLocaleString()}</span>
                                  <span>of {a.target_units.toLocaleString()}</span>
                                </div>
                                <ProgressBar pct={a.units_pct} />
                              </div>
                            ) : <span className="text-xs text-slate-300">Not set</span>}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge pct={a.amount_pct} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTarget(a.id)}
                              className="h-8 text-[10px] font-bold uppercase text-red-600 border-red-200 hover:bg-red-50 gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {achievements.map(a => (
                    <div key={a.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {a.user_id
                            ? <User className="h-4 w-4 text-blue-500 shrink-0" />
                            : <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          }
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{a.user_id ? a.staff_name : a.branch_name}</p>
                            {a.user_id && <p className="text-[10px] text-slate-400">{a.branch_name}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge pct={a.amount_pct} />
                          <Button variant="outline" size="sm" onClick={() => deleteTarget(a.id)} className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold">Revenue</span>
                          <span>{fmt(a.actual_amount)} / {fmt(a.target_amount)}</span>
                        </div>
                        <ProgressBar pct={a.amount_pct} />
                      </div>
                      {a.target_units > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span className="font-semibold">Units</span>
                            <span>{a.actual_units.toLocaleString()} / {a.target_units.toLocaleString()}</span>
                          </div>
                          <ProgressBar pct={a.units_pct} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Branch Sales Summary */}
        {branchSummaries.length > 0 && (
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-3 border-b border-slate-100 px-6">
              <CardTitle className="text-sm font-semibold">Branch Sales Summary — {periodLabel}</CardTitle>
            </CardHeader>
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">Branch</th>
                      <th className="px-5 py-3 text-right">Revenue</th>
                      <th className="px-5 py-3 text-right">Orders</th>
                      <th className="px-5 py-3 text-right">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branchSummaries.map(s => (
                      <tr key={s.branch_id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-medium text-slate-800">{s.branch_name}</td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600">{fmt(s.total_revenue)}</td>
                        <td className="px-5 py-3 text-right text-slate-700">{s.total_orders.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-slate-500">{s.total_orders > 0 ? fmt(s.total_revenue / s.total_orders) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y divide-slate-100">
                {branchSummaries.map(s => (
                  <div key={s.branch_id} className="p-4 flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-800 text-sm">{s.branch_name}</p>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600 text-sm">{fmt(s.total_revenue)}</p>
                      <p className="text-[10px] text-slate-400">{s.total_orders} orders · Avg {s.total_orders > 0 ? fmt(s.total_revenue / s.total_orders) : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
