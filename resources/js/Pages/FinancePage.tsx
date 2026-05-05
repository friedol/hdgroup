import { Head } from "@inertiajs/react";
import { DollarSign, Plus, Search, Eye, Edit, CreditCard, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";

interface FinancePageProps {
  loans?: any[];
  payments?: any[];
  expenses?: any[];
  cashFlowData?: any[];
  expenseBreakdown?: any[];
  kpis?: {
    totalRevenue: number | string;
    totalExpenses: number | string;
    outstandingLoans: number | string;
    netCashFlow: number | string;
    revenueGrowth?: string;
    expenseGrowth?: string;
  };
}

const loanStatusStyle: Record<string, string> = {
  Active: "bg-primary/10 text-primary",
  Pending: "bg-warning/10 text-warning",
  Paid: "bg-accent/10 text-accent",
  Completed: "bg-accent/10 text-accent",
  Overdue: "bg-destructive/10 text-destructive",
};

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Finance", href: "/finance" },
];

export default function FinancePage({
  loans = [],
  payments = [],
  expenses = [],
  cashFlowData = [],
  expenseBreakdown = [],
  kpis = { totalRevenue: 0, totalExpenses: 0, outstandingLoans: 0, netCashFlow: 0 }
}: FinancePageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Finance" />
      <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10"><DollarSign className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Finance</h2>
            <p className="text-sm text-muted-foreground">Loans, payments, expenses, and financial reports</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-up stagger-1">
        <div className="kpi-card">
          <div className="flex items-center gap-1 text-accent text-xs font-medium mb-1"><TrendingUp className="w-3 h-3" /> {kpis.revenueGrowth || "+0.0%"}</div>
          <p className="text-2xl font-bold text-foreground tabular-nums">${typeof kpis.totalRevenue === 'number' ? kpis.totalRevenue.toLocaleString() : kpis.totalRevenue}</p>
          <p className="text-xs text-muted-foreground mt-1">Monthly Revenue</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-1 text-destructive text-xs font-medium mb-1"><TrendingDown className="w-3 h-3" /> {kpis.expenseGrowth || "+0.0%"}</div>
          <p className="text-2xl font-bold text-foreground tabular-nums">${typeof kpis.totalExpenses === 'number' ? kpis.totalExpenses.toLocaleString() : kpis.totalExpenses}</p>
          <p className="text-xs text-muted-foreground mt-1">Monthly Expenses</p>
        </div>
        <div className="kpi-card"><p className="text-2xl font-bold text-warning tabular-nums">${typeof kpis.outstandingLoans === 'number' ? kpis.outstandingLoans.toLocaleString() : kpis.outstandingLoans}</p><p className="text-xs text-muted-foreground mt-1">Outstanding Loans</p></div>
        <div className="kpi-card"><p className="text-2xl font-bold text-accent tabular-nums">${typeof kpis.netCashFlow === 'number' ? kpis.netCashFlow.toLocaleString() : kpis.netCashFlow}</p><p className="text-xs text-muted-foreground mt-1">Net Cash Flow</p></div>
      </div>

      <Tabs defaultValue="loans" className="animate-fade-up stagger-2">
        <TabsList>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <div className="flex justify-between">
            <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search loans..." className="pl-9" /></div>
            <Dialog>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> New Loan</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Loan</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div><Label>Customer</Label><Input placeholder="Customer name" className="mt-1.5" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Principal Amount</Label><Input type="number" placeholder="0.00" className="mt-1.5" /></div>
                    <div><Label>Interest Rate (%)</Label><Input type="number" placeholder="12" className="mt-1.5" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Start Date</Label><Input type="date" className="mt-1.5" /></div>
                    <div><Label>Due Date</Label><Input type="date" className="mt-1.5" /></div>
                  </div>
                </div>
                <DialogFooter><Button variant="outline">Cancel</Button><Button>Create Loan</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Loan ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Principal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Repayment</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Rate</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {loans.map((l: any, i: number) => {
                  const principal = parseFloat(l.total_amount || l.principal || "0");
                  const paid = parseFloat(l.balance !== undefined ? principal - l.balance : l.total_paid || l.paid || "0");
                  const rate = l.rate || 0;
                  const progressValue = principal > 0 ? (paid / principal) * 100 : 0;
                  const loanStatus = l.status || (principal <= paid ? "Paid" : "Active");

                  return (
                    <tr key={l.unique_id || l.id || i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{l.unique_id || l.id}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{l.customer_name || l.customer}</td>
                      <td className="px-4 py-3 text-right tabular-nums">${principal.toLocaleString()}</td>
                      <td className="px-4 py-3 w-36">
                        <div className="flex items-center gap-2">
                          <Progress value={progressValue} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground tabular-nums">{Math.round(progressValue)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{rate}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.payment_date || l.dueDate || "N/A"}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-md ${loanStatusStyle[loanStatus] || loanStatusStyle["Active"]}`}>{loanStatus}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-secondary"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button className="p-1.5 rounded hover:bg-secondary"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Payment history across all loans</p>
            <Button variant="outline" className="gap-2"><Download className="w-3.5 h-3.5" /> Export</Button>
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Loan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr></thead>
              <tbody>
                {payments.map((p: any, i: number) => {
                  const methodStr = p.payment_method || p.method || "Cash";
                  const amount = parseFloat(p.amount_paid || p.amount || "0");
                  
                  return (
                    <tr key={p.id || i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{p.id || `PAY-${i + 1}`}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.unique_id || p.loan || "-"}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.customer_name || p.customer?.customer_name || p.customer || "-"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-accent">${amount.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary">{methodStr}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{p.payment_date || p.date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between">
            <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search expenses..." className="pl-9" /></div>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr></thead>
              <tbody>
                {expenses.map((e: any, i: number) => {
                  const amount = parseFloat(e.amount || "0");

                  return (
                    <tr key={e.id || i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{e.id}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{e.description || e.name || "Expense"}</td>
                      <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary">{e.category || "General"}</span></td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-destructive">${amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.date || e.created_at || "N/A"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Cash Flow</h3>
              <p className="text-xs text-muted-foreground mb-4">Inflow vs outflow (last 6 months)</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(160,60%,45%)" stopOpacity={0.15} /><stop offset="100%" stopColor="hsl(160,60%,45%)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(0,72%,51%)" stopOpacity={0.1} /><stop offset="100%" stopColor="hsl(0,72%,51%)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="inflow" stroke="hsl(160,60%,45%)" strokeWidth={2} fill="url(#inflowGrad)" />
                  <Area type="monotone" dataKey="outflow" stroke="hsl(0,72%,51%)" strokeWidth={2} fill="url(#outflowGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Expense Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">Current month by category</p>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={expenseBreakdown.length > 0 ? expenseBreakdown : [{name: "No Data", value: 1}]} cx="50%" cy="50%" outerRadius={90} innerRadius={55} dataKey="total" paddingAngle={3}>
                      {(expenseBreakdown.length > 0 ? expenseBreakdown : [{name: "No Data", value: 1}]).map((_, i) => <Cell key={i} fill={["hsl(220,72%,50%)", "hsl(160,60%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(220,72%,75%)"][i % 5]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => typeof v === 'number' ? `$${v.toLocaleString()}` : `$${v}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {expenseBreakdown.map((e: any, i: number) => (
                  <span key={e.category || e.name || i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: ["hsl(220,72%,50%)", "hsl(160,60%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(220,72%,75%)"][i % 5] }} /> {e.category || e.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
