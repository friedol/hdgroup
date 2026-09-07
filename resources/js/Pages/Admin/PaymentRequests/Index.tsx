import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  FileText, Plus, Search, Send, CheckCircle, XCircle, Trash2,
  AlertTriangle, Clock, DollarSign
} from "lucide-react";
import { toast } from "sonner";

interface PaymentReq {
  id: number;
  reference: string;
  invoice_number: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  amount_requested: number;
  due_date: string | null;
  status: "pending" | "sent" | "paid" | "cancelled";
  notes: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  branch: { name: string } | null;
  creator: { staff_name: string } | null;
}

interface OutstandingSale {
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  payable_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
}

interface Summary {
  total: number;
  pending: number;
  sent: number;
  paid: number;
  overdue: number;
  total_requested: number;
}

interface Props {
  requests: { data: PaymentReq[]; current_page: number; last_page: number; total: number };
  outstandingSales: OutstandingSale[];
  summary: Summary;
  branches: { id: number; name: string }[];
  filters: { status: string; search: string; branch_id: number | null };
  isGlobal: boolean;
}

const breadcrumbs = [
  { title: "Finance", href: "/finance" },
  { title: "Payment Requests", href: "/payment-requests" },
];

function fmt(n: number) {
  return "TZS " + Number(n).toLocaleString("en-TZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return <Badge className={`${map[status] || ""} text-[10px] font-bold uppercase`}>{status}</Badge>;
}

const emptyForm = {
  invoice_number: "",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  amount_requested: "",
  due_date: "",
  notes: "",
  branch_id: "",
};

export default function PaymentRequestsIndex({ requests, outstandingSales, summary, branches, filters, isGlobal }: Props) {
  const [search, setSearch] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const handleSearch = () => {
    router.get("/payment-requests", { ...filters, search, status: statusFilter }, { preserveState: true });
  };

  const applyStatus = (val: string) => {
    setStatusFilter(val);
    router.get("/payment-requests", { ...filters, status: val, search }, { preserveState: true });
  };

  const fillFromSale = (sale: OutstandingSale) => {
    setForm(p => ({
      ...p,
      invoice_number: sale.invoice_number,
      customer_name: sale.customer_name,
      customer_email: sale.customer_email ?? "",
      customer_phone: sale.customer_phone ?? "",
      amount_requested: String(sale.balance),
    }));
    setShowForm(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount_requested || Number(form.amount_requested) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    router.post("/payment-requests", {
      ...form,
      branch_id: form.branch_id || null,
      due_date: form.due_date || null,
    }, {
      onSuccess: () => { toast.success("Payment request created!"); setForm({ ...emptyForm }); setShowForm(false); },
      onError: () => toast.error("Failed to create payment request"),
    });
  };

  const action = (url: string, method: "patch" | "delete", msg: string) => {
    if (!confirm(msg)) return;
    router[method](url, {}, {
      onSuccess: () => toast.success("Done"),
      onError: () => toast.error("Action failed"),
    });
  };

  const isOverdue = (req: PaymentReq) =>
    req.due_date && new Date(req.due_date) < new Date() && !["paid", "cancelled"].includes(req.status);

  const kpiCards = [
    {
      title: "Total",
      value: String(summary.total),
      icon: FileText,
      cardClass: "border-slate-200 bg-slate-50/40",
      iconClass: "bg-slate-100 text-slate-600",
      chipClass: "text-slate-700 bg-slate-100/70",
      chipLabel: "All",
      valueClass: "text-slate-900",
    },
    {
      title: "Pending",
      value: String(summary.pending),
      icon: Clock,
      cardClass: "border-amber-200 bg-amber-50/30",
      iconClass: "bg-amber-100 text-amber-600",
      chipClass: "text-amber-700 bg-amber-100/70",
      chipLabel: "Open",
      valueClass: "text-amber-700",
    },
    {
      title: "Sent",
      value: String(summary.sent),
      icon: Send,
      cardClass: "border-blue-200 bg-blue-50/30",
      iconClass: "bg-blue-100 text-blue-600",
      chipClass: "text-blue-700 bg-blue-100/70",
      chipLabel: "Issued",
      valueClass: "text-blue-700",
    },
    {
      title: "Paid",
      value: String(summary.paid),
      icon: CheckCircle,
      cardClass: "border-emerald-200 bg-emerald-50/30",
      iconClass: "bg-emerald-100 text-emerald-600",
      chipClass: "text-emerald-700 bg-emerald-100/70",
      chipLabel: "Closed",
      valueClass: "text-emerald-700",
    },
    {
      title: "Overdue",
      value: String(summary.overdue),
      icon: XCircle,
      cardClass: "border-rose-200 bg-rose-50/30",
      iconClass: "bg-rose-100 text-rose-600",
      chipClass: "text-rose-700 bg-rose-100/70",
      chipLabel: "Attention",
      valueClass: "text-rose-700",
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Payment Requests" />
      <div className="w-full space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Payment Requests
            </h1>
          </div>
          <Button onClick={() => setShowForm(true)} className="shrink-0 bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]">
            <Plus className="h-4 w-4 mr-2" /> Create
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        {/* Outstanding balance amount */}
        <Card className="border-amber-200 bg-amber-50 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">Outstanding Requested Amount</p>
              <p className="text-xl font-bold text-amber-800">{fmt(summary.total_requested)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Sales Quick-Add */}
        {outstandingSales.length > 0 && (
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-3 border-b border-slate-100 px-6">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Outstanding Sales ({outstandingSales.length})
              </CardTitle>
            </CardHeader>
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">Invoice</th>
                      <th className="px-5 py-3 text-left">Customer</th>
                      <th className="px-5 py-3 text-right">Payable</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outstandingSales.slice(0, 10).map(s => (
                      <tr key={s.invoice_number} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700">{s.invoice_number}</td>
                        <td className="px-5 py-3 text-slate-800">{s.customer_name}</td>
                        <td className="px-5 py-3 text-right text-slate-600">{fmt(s.payable_amount)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-red-500">{fmt(s.balance)}</td>
                        <td className="px-5 py-3">
                          <Badge className={s.payment_status === "Unpaid" ? "bg-red-100 text-red-600 text-[10px]" : "bg-amber-100 text-amber-700 text-[10px]"}>
                            {s.payment_status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => fillFromSale(s)} className="h-7 text-[10px] font-bold uppercase">
                            <Plus className="h-3 w-3 mr-1" /> Request
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y divide-slate-100">
                {outstandingSales.slice(0, 10).map(s => (
                  <div key={s.invoice_number} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">{s.invoice_number}</span>
                      <Badge className={s.payment_status === "Unpaid" ? "bg-red-100 text-red-600 text-[10px]" : "bg-amber-100 text-amber-700 text-[10px]"}>
                        {s.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-800">{s.customer_name}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        <p>Payable: {fmt(s.payable_amount)}</p>
                        <p className="text-red-500 font-semibold">Balance: {fmt(s.balance)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => fillFromSale(s)} className="h-8 text-[10px] font-bold uppercase shrink-0">
                        <Plus className="h-3 w-3 mr-1" /> Request
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          </Card>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" /> New Payment Request
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice # (optional)</Label>
                  <Input value={form.invoice_number} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} placeholder="INV-XXXX" className="h-10 text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name *</Label>
                  <Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} placeholder="Full name" className="h-10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Phone</Label>
                  <Input value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+255..." className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Email</Label>
                  <Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} placeholder="email@example.com" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (TZS) *</Label>
                  <Input type="number" min="0.01" step="0.01" value={form.amount_requested} onChange={e => setForm(p => ({ ...p, amount_requested: e.target.value }))} placeholder="0.00" className="h-10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="h-10 text-sm" />
                </div>
                {isGlobal && branches.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</Label>
                    <Select value={form.branch_id || "none"} onValueChange={v => setForm(p => ({ ...p, branch_id: v === "none" ? "" : v }))}>
                      <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific branch</SelectItem>
                        {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes (optional)</Label>
                <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional info for this request" className="h-10 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]">
                  <FileText className="h-4 w-4 mr-2" /> Create Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filters + Table */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-0 px-6 pt-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <CardTitle className="text-sm font-semibold">All Requests ({requests.total})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    className="h-9 pl-9 w-full sm:w-56 text-sm"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Select value={statusFilter} onValueChange={applyStatus}>
                  <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <div className="mt-4">
            {requests.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No payment requests found</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 text-left">Reference</th>
                        <th className="px-5 py-3 text-left">Customer</th>
                        <th className="px-5 py-3 text-left">Invoice</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                        <th className="px-5 py-3 text-left">Due Date</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.data.map(req => (
                        <tr key={req.id} className={`hover:bg-slate-50/50 transition-colors ${isOverdue(req) ? "bg-red-50/30" : ""}`}>
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-bold text-slate-700">{req.reference}</span>
                            {isOverdue(req) && <span className="ml-2 text-red-500 text-[10px] font-bold">OVERDUE</span>}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-900">{req.customer_name}</p>
                            {req.customer_phone && <p className="text-[10px] text-slate-400">{req.customer_phone}</p>}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-500">{req.invoice_number ?? "—"}</td>
                          <td className="px-5 py-4 text-right font-semibold text-slate-800">{fmt(req.amount_requested)}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {req.due_date ? new Date(req.due_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {req.status === "pending" && (
                                <Button
                                  variant="outline" size="sm"
                                  className="h-7 text-[10px] font-bold uppercase text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                                  onClick={() => action(`/payment-requests/${req.id}/sent`, "patch", "Mark this request as sent?")}
                                >
                                  <Send className="h-3 w-3" /> Sent
                                </Button>
                              )}
                              {["pending", "sent"].includes(req.status) && (
                                <Button
                                  variant="outline" size="sm"
                                  className="h-7 text-[10px] font-bold uppercase text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                                  onClick={() => action(`/payment-requests/${req.id}/paid`, "patch", "Mark this payment as received?")}
                                >
                                  <CheckCircle className="h-3 w-3" /> Paid
                                </Button>
                              )}
                              {["pending", "sent"].includes(req.status) && (
                                <Button
                                  variant="outline" size="sm"
                                  className="h-7 text-[10px] font-bold uppercase text-slate-500 border-slate-200 hover:bg-slate-50 gap-1"
                                  onClick={() => action(`/payment-requests/${req.id}/cancel`, "patch", "Cancel this request?")}
                                >
                                  <XCircle className="h-3 w-3" /> Cancel
                                </Button>
                              )}
                              <Button
                                variant="outline" size="sm"
                                className="h-7 text-[10px] font-bold uppercase text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                onClick={() => action(`/payment-requests/${req.id}`, "delete", `Delete request ${req.reference}?`)}
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {requests.data.map(req => (
                    <div key={req.id} className={`p-4 space-y-3 ${isOverdue(req) ? "bg-red-50/30" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-700">{req.reference}</span>
                            {isOverdue(req) && <span className="text-red-500 text-[10px] font-bold">OVERDUE</span>}
                          </div>
                          <p className="font-medium text-slate-900 text-sm mt-0.5">{req.customer_name}</p>
                          {req.customer_phone && <p className="text-[10px] text-slate-400">{req.customer_phone}</p>}
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-800">{fmt(req.amount_requested)}</span>
                        <span className="text-xs text-slate-500">{req.due_date ? new Date(req.due_date).toLocaleDateString() : "No due date"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {req.status === "pending" && (
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                            onClick={() => action(`/payment-requests/${req.id}/sent`, "patch", "Mark this request as sent?")}>
                            <Send className="h-3 w-3" /> Sent
                          </Button>
                        )}
                        {["pending", "sent"].includes(req.status) && (
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                            onClick={() => action(`/payment-requests/${req.id}/paid`, "patch", "Mark this payment as received?")}>
                            <CheckCircle className="h-3 w-3" /> Paid
                          </Button>
                        )}
                        {["pending", "sent"].includes(req.status) && (
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase text-slate-500 border-slate-200 hover:bg-slate-50 gap-1"
                            onClick={() => action(`/payment-requests/${req.id}/cancel`, "patch", "Cancel this request?")}>
                            <XCircle className="h-3 w-3" /> Cancel
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase text-red-600 border-red-200 hover:bg-red-50 gap-1"
                          onClick={() => action(`/payment-requests/${req.id}`, "delete", `Delete request ${req.reference}?`)}>
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {requests.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {requests.current_page} of {requests.last_page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={requests.current_page === 1}
                  onClick={() => router.get("/payment-requests", { ...filters, page: requests.current_page - 1 }, { preserveState: true })}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={requests.current_page === requests.last_page}
                  onClick={() => router.get("/payment-requests", { ...filters, page: requests.current_page + 1 }, { preserveState: true })}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}
