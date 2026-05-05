import { Head } from "@inertiajs/react";
import { BarChart3, Download, Calendar, FileText, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";

interface ReportsPageProps {
  initialSalesTrend?: any[];
  initialBranchPerformance?: any[];
  initialCategorySales?: any[];
  initialTopCustomers?: any[];
  initialReportTemplates?: any[];
}

const pieColors = ["hsl(220,72%,50%)", "hsl(160,60%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(220,72%,75%)"];

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Reports", href: "/reports" },
];

export default function ReportsPage({
  initialSalesTrend = [],
  initialBranchPerformance = [],
  initialCategorySales = [],
  initialTopCustomers = [],
  initialReportTemplates = []
}: ReportsPageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Reports & Analytics" />
      <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10"><BarChart3 className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Reports & Analytics</h2>
            <p className="text-sm text-muted-foreground">Data insights, reports, and business intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-[140px]"><Calendar className="w-3.5 h-3.5 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="quarter">This Quarter</SelectItem><SelectItem value="year">This Year</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Download className="w-3.5 h-3.5" /> Export</Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="animate-fade-up stagger-1">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {/* Sales Trend */}
          <div className="bg-card rounded-xl border border-border/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-sm font-semibold text-foreground">Sales Performance vs Target</h3><p className="text-xs text-muted-foreground mt-0.5">9-month trend analysis</p></div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Actual</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(160,60%,45%)" }} /> Target</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={initialSalesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(220,72%,50%)" stopOpacity={0.15} /><stop offset="100%" stopColor="hsl(220,72%,50%)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="sales" stroke="hsl(220,72%,50%)" strokeWidth={2} fill="url(#salesGrad)" />
                <Line type="monotone" dataKey="target" stroke="hsl(160,60%,45%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Branch Performance */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Branch Performance</h3>
              <p className="text-xs text-muted-foreground mb-4">Revenue by branch this month</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={initialBranchPerformance}>
                  <XAxis dataKey="branch" tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220,10%,46%)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, ""]} />
                  <Bar dataKey="revenue" fill="hsl(220,72%,50%)" radius={[6,6,0,0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Sales by Category</h3>
              <p className="text-xs text-muted-foreground mb-4">Product category distribution</p>
              <div className="flex items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={initialCategorySales.length > 0 ? initialCategorySales : [{name: "No Data", value: 1}]} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" paddingAngle={3}>
                      {(initialCategorySales.length > 0 ? initialCategorySales : [{name: "No Data", value: 1}]).map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {initialCategorySales.map((c: any, i: number) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: pieColors[i % pieColors.length] }} />
                      <span className="text-muted-foreground w-16 truncate" title={c.name}>{c.name}</span>
                      <span className="font-medium text-foreground tabular-nums">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-card rounded-xl border border-border/50 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Top Customers</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left pb-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-right pb-3 font-medium text-muted-foreground">Revenue</th>
                <th className="text-right pb-3 font-medium text-muted-foreground">Orders</th>
                <th className="text-right pb-3 font-medium text-muted-foreground">Growth</th>
              </tr></thead>
              <tbody>
                {initialTopCustomers.map((c: any) => (
                  <tr key={c.name} className="border-b border-border/50">
                    <td className="py-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-3 text-right tabular-nums font-semibold">{c.revenue}</td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{c.orders}</td>
                    <td className={`py-3 text-right tabular-nums font-medium ${c.growth.startsWith("+") ? "text-accent" : "text-destructive"}`}>{c.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {initialReportTemplates.map((r: any) => (
              <div key={r.name} className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{r.name}</h4>
                    <p className="text-xs text-muted-foreground">{r.type} Report</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Last: {r.lastGenerated}</span>
                  <span className="px-2 py-0.5 rounded bg-secondary">{r.schedule}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1"><TrendingUp className="w-3 h-3" /> Generate</Button>
                  <Button variant="outline" size="sm" className="gap-1"><Download className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
