import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  UserCheck,
  Truck,
  Layers,
  BarChart3,
  Factory,
  ArrowDownRight,
  ArrowRightFromLine,
  Calendar,
  Lock,
  Plus,
  Minus as MinusIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  User,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ArrowLeftToLine,
  Target,
  CheckCircle2,
  XCircle,
  ListTodo,
  ArrowRight,
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";

interface DashboardProps {
  user: any;
  roleName: string;
  total_revenue: number;
  net_profit: number;
  total_expenses: number;
  inventory_value: number;
  total_orders: number;
  stock_alerts: number;
  total_customers: number;
  balance_due?: number;
  receivables: number;
  staff_count: number;
  containers_count: number;
  recentSales: any[];
  recentExpenses: any[];
  staffPerformance: any[];
  trend_labels: string[];
  revenue_trend: number[];
  expense_trend: number[];
  my_sales?: number;
  daily_sales?: number;
  pending_deliveries?: number;
  daily_logs?: number;
  recent_logs?: any[];
  containers_in_transit?: number;
  today_visitors?: number;
  recent_customers?: any[];
  pending_followups?: number;
  total_movements?: number;
  my_entries?: number;
  incoming_today?: number;
  outgoing_today?: number;
  movement_trends?: any[];
  ready_for_pickup?: any[];
  delivery_stats?: {
    assigned_count: number;
    pending_count: number;
    delivered_count: number;
    failed_count: number;
  };
  recent_deliveries?: any[];
  performance_chart?: { labels: string[]; data: number[] };
  driver_info?: any;
  // New analytics
  payment_distribution?: Array<{ status: string; count: number; total: number }>;
  top_products?: Array<{ name: string; image: string | null; qty: number; revenue: number }>;
  low_stock_products?: Array<{ name: string; image: string | null; stock: number; threshold: number }>;
  unpaid_orders?: Array<{ invoice: string; customer: string; payable: number; paid: number; status: string; date: string }>;
  expense_by_category?: Array<{ category: string; total: number }>;
  monthly_bar_data?: Array<{ month: string; revenue: number; expenses: number }>;
  customer_growth?: Array<{ month: string; customers: number }>;
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6"];

const fmtK = (n: number) => {
  if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `TZS ${(n / 1_000).toFixed(0)}K`;
  return `TZS ${n.toLocaleString()}`;
};

export default function DashboardPage({
  user,
  roleName,
  total_revenue,
  net_profit,
  total_expenses,
  inventory_value,
  total_orders,
  stock_alerts,
  total_customers,
  balance_due,
  receivables,
  staff_count,
  containers_count,
  recentSales,
  recentExpenses,
  staffPerformance,
  trend_labels,
  revenue_trend,
  expense_trend,
  my_sales,
  daily_sales,
  pending_deliveries,
  daily_logs,
  recent_logs,
  containers_in_transit,
  today_visitors,
  recent_customers,
  pending_followups,
  total_movements,
  my_entries,
  incoming_today,
  outgoing_today,
  movement_trends,
  ready_for_pickup,
  delivery_stats,
  recent_deliveries,
  performance_chart,
  driver_info,
  payment_distribution = [],
  top_products = [],
  low_stock_products = [],
  unpaid_orders = [],
  expense_by_category = [],
  monthly_bar_data = [],
  customer_growth = [],
}: DashboardProps) {
  const [gatekeeperChartType, setGatekeeperChartType] = useState<"area" | "bar">("area");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    if (typeof window === "undefined") return "today";
    return new URLSearchParams(window.location.search).get("period") || "today";
  });
  const [startDate, setStartDate] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("start_date") || "";
  });
  const [endDate, setEndDate] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("end_date") || "";
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period === "custom") {
      const today = new Date().toISOString().split("T")[0];
      router.get('/dashboard', {
        period,
        start_date: startDate || today,
        end_date: endDate || today,
      }, { preserveState: true, replace: true });
      return;
    }

    router.get('/dashboard', { period }, { preserveState: true, replace: true });
  };

  const applyCustomRange = () => {
    const today = new Date().toISOString().split("T")[0];
    router.get('/dashboard', {
      period: "custom",
      start_date: startDate || today,
      end_date: endDate || today,
    }, { preserveState: true, replace: true });
  };

  const executiveRoles = ["CEO", "Manager", "Operator", "Accountant", "SuperAdmin", "Admin", "General Manager"];
  const financialRoles = ["Accountant Manager", "Branch Accountant"];
  const branchManagerRoles = ["Branch Manager"];
  const inventoryRoles = ["Store Keeper", "Storekeeper"];
  const sellerRoles = ["Seller"];
  const deliveryRoles = ["Delivery"];
  const gatekeeperRoles = ["Gatekeeper", "Gatekeepr"];
  const receptionistRoles = ["Receptionist"];

  const isExecutive = executiveRoles.includes(roleName);
  const isFinancial = financialRoles.includes(roleName);
  const isBranchManager = branchManagerRoles.includes(roleName);
  const isInventory = inventoryRoles.includes(roleName);
  const isSeller = sellerRoles.includes(roleName);
  const isDelivery = deliveryRoles.includes(roleName);
  const isGatekeeper = gatekeeperRoles.includes(roleName);
  const isReceptionist = receptionistRoles.includes(roleName);

  const allKpis = [
    { title: "Total Revenue", value: `TZS ${Number(total_revenue || 0).toLocaleString()}`, change: 0, icon: DollarSign, href: "/sales-history", bgClass: "bg-blue-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Billed" },
    { title: "Net Profit", value: `TZS ${Number(net_profit || 0).toLocaleString()}`, change: 0, icon: TrendingUp, href: "/report_profit", bgClass: "bg-violet-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "After expenses" },
    { title: "Total Expenses", value: `TZS ${Number(total_expenses || 0).toLocaleString()}`, change: 0, icon: Activity, href: "/expenses-crud", bgClass: "bg-red-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Spending" },
    { title: "Balance Due", value: `TZS ${Number(balance_due || 0).toLocaleString()}`, change: 0, icon: ArrowUpRight, href: "/sales-history", bgClass: "bg-amber-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Outstanding" },
    { title: "Inventory Value", value: `TZS ${Number(inventory_value || 0).toLocaleString()}`, change: 0, icon: Package, href: "/report_inventory", bgClass: "bg-blue-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Stock valuation" },
    { title: "Sales Orders", value: (total_orders || 0).toLocaleString(), change: 0, icon: ShoppingCart, href: "/orders-crud", bgClass: "bg-blue-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "In period" },
  ];

  const sellerKpis = [
    { title: "My Lifetime Sales", value: Number(my_sales || 0).toLocaleString(), change: 0, icon: ShoppingCart, href: "/sales-history", bgClass: "bg-blue-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "All-time total" },
    { title: "Today Revenue", value: `TZS ${Number(daily_sales || 0).toLocaleString()}`, change: 0, icon: DollarSign, href: "/sales-history", bgClass: "bg-emerald-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Earned today" },
    { title: "My Customers", value: Number(total_customers || 0).toLocaleString(), change: 0, icon: Users, href: "/customers", bgClass: "bg-sky-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Total registered" },
  ];

  const deliveryKpis = [
    { title: "Assigned", value: (delivery_stats?.assigned_count || 0).toLocaleString(), change: 0, subtitle: "Tasks for today", icon: ListTodo, href: "/deliveries", color: "blue", bgClass: "bg-blue-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", dotColor: "bg-white" },
    { title: "Pending", value: (delivery_stats?.pending_count || 0).toLocaleString(), change: 0, subtitle: "On the way", icon: Truck, href: "/deliveries", color: "amber", bgClass: "bg-amber-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", dotColor: "bg-white" },
    { title: "Delivered", value: (delivery_stats?.delivered_count || 0).toLocaleString(), change: 0, subtitle: "Successfully closed", icon: CheckCircle2, href: "/deliveries", color: "emerald", bgClass: "bg-emerald-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", dotColor: "bg-white" },
    { title: "Failed", value: (delivery_stats?.failed_count || 0).toLocaleString(), change: 0, subtitle: "Issues to report", icon: XCircle, href: "/deliveries", color: "rose", bgClass: "bg-rose-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", dotColor: "bg-white" },
  ];

  const gatekeeperKpis = [
    { title: "Total Movements", value: (total_movements || 0).toLocaleString(), change: 0, icon: Activity, href: "/gatekeeper", bgClass: "bg-blue-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white" },
    { title: "My Entries", value: (my_entries || 0).toLocaleString(), change: 0, icon: Users, href: "/gatekeeper", bgClass: "bg-sky-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white" },
    { title: "Incoming", value: (incoming_today || 0).toLocaleString(), change: 0, icon: ArrowDownRight, href: "/gatekeeper/record-in", bgClass: "bg-emerald-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", isGatekeeperIn: true },
    { title: "Outgoing", value: (outgoing_today || 0).toLocaleString(), change: 0, icon: ArrowUpRight, href: "/gatekeeper/record-out", bgClass: "bg-amber-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", isGatekeeperOut: true },
  ];

  const receptionistKpis = [
    { title: "Today Visitors", value: (today_visitors || 0).toLocaleString(), change: 0, icon: Users, href: "/customers", bgClass: "bg-sky-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white" },
    { title: "Pending Follows", value: (pending_followups || 0).toLocaleString(), change: 0, icon: Activity, href: "/customer-followups", bgClass: "bg-rose-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white" },
  ];

  let kpis = allKpis;
  if (isInventory) {
    kpis = allKpis.filter((k) => ["Inventory Value", "Sales Orders"].includes(k.title));
  } else if (isSeller) {
    kpis = sellerKpis;
  } else if (isDelivery) {
    kpis = deliveryKpis;
  } else if (isGatekeeper) {
    kpis = gatekeeperKpis;
  } else if (isReceptionist) {
    kpis = receptionistKpis;
  } else if (isFinancial) {
    kpis = allKpis.filter((k) => ["Total Revenue", "Net Profit", "Total Expenses", "Balance Due", "Inventory Value"].includes(k.title));
  } else if (isBranchManager) {
    kpis = allKpis.filter((k) => ["Total Revenue", "Sales Orders"].includes(k.title));
  }

  let xlGridCols = "xl:grid-cols-6";
  if (kpis.length === 5) xlGridCols = "xl:grid-cols-5 lg:grid-cols-5";
  else if (kpis.length === 4) xlGridCols = "xl:grid-cols-4 lg:grid-cols-4";
  else if (kpis.length === 3) xlGridCols = "xl:grid-cols-3 lg:grid-cols-3";
  else if (kpis.length === 2) xlGridCols = "xl:grid-cols-2 lg:grid-cols-2";

  const getKpiBorderClass = (tone: string = "") => {
    if (tone.includes("blue")) return "border-blue-200";
    if (tone.includes("emerald")) return "border-emerald-200";
    if (tone.includes("rose") || tone.includes("red")) return "border-rose-200";
    if (tone.includes("amber") || tone.includes("orange")) return "border-amber-200";
    if (tone.includes("indigo")) return "border-indigo-200";
    if (tone.includes("violet")) return "border-violet-200";
    if (tone.includes("sky")) return "border-sky-200";
    if (tone.includes("lime")) return "border-lime-200";
    return "border-slate-200";
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${roleName || 'User'} Dashboard`} />
      <div className="max-w-[1700px] mx-auto space-y-8 pb-10">
        
        {/* Header with Welcome and Period Filter */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">
              Hello! <span className="text-blue-600 font-bold">{user?.staff_name}</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" />
              {roleName} Dashboard
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isDelivery && !isGatekeeper && !isReceptionist && (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <select
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                  <option value="all">Lifetime Data</option>
                </select>
              </div>
            )}

            {!isDelivery && !isGatekeeper && !isReceptionist && selectedPeriod === "custom" && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 w-[118px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 w-[118px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                />
                <Button type="button" onClick={applyCustomRange} className="h-8 px-3 text-[10px] font-bold">
                  Apply
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* KPI CARDS */}
        <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 ${xlGridCols} gap-3 sm:gap-4`}>
          {kpis.map((kpi: any, i) => (
            <div key={kpi.title} className={`animate-fade-up stagger-${(i % 6) + 1}`}>
              {isDelivery ? (
                 <div className={`rounded-xl border border-slate-200 p-4 sm:p-5 bg-white flex flex-col justify-between h-full group transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                    <div className="flex items-center justify-between mb-4">
                       <div className={`p-1.5 sm:p-2 rounded-lg ${kpi.iconBgClass} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                         <kpi.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                       </div>
                       <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-widest">{kpi.title}</span>
                    </div>
                    <div>
                       <div className="flex items-baseline gap-2 mb-2">
                         <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 tracking-tight leading-none">{kpi.value}</p>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${kpi.dotColor} animate-pulse`} />
                          <span className="text-[9px] sm:text-[11px] font-bold text-slate-500">{kpi.subtitle}</span>
                       </div>
                    </div>
                 </div>
              ) : isGatekeeper && (kpi.isGatekeeperIn || kpi.isGatekeeperOut) ? (
                <div className={`rounded-xl border border-slate-200 p-4 sm:p-5 bg-white flex flex-col justify-between h-full group transition-all duration-300 hover:shadow-lg`}>
                   <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-2.5 rounded-xl ${kpi.iconBgClass}`}>
                        <kpi.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors tracking-widest">{kpi.title}</span>
                   </div>
                   <div className="space-y-3 sm:space-y-4">
                     <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 tracking-tight leading-none">{kpi.value}</p>
                      <Link href={kpi.href}>
                        <Button className={`w-full font-bold tracking-tighter text-[10px] sm:text-xs h-8 sm:h-9 ${kpi.isGatekeeperIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                          {kpi.isGatekeeperIn ? <><Plus className="w-3 h-3 mr-1" /> In</> : <><MinusIcon className="w-3 h-3 mr-1" /> Out</>}
                        </Button>
                      </Link>
                   </div>
                </div>
              ) : (
                <KpiCard {...kpi} className="shadow-sm hover:shadow-md transition-shadow" />
              )}
            </div>
          ))}
        </div>

        {/* ══ EXECUTIVE / FINANCIAL / BRANCH MANAGER — Smart Analytics Layout ══ */}
        {(isExecutive || isFinancial || isBranchManager || isInventory) && (
          <div className="space-y-6">

            {/* ROW 1 — Hero: 30-day trend (2/3) + Payment Status donut (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart revenueData={revenue_trend} expenseData={expense_trend} labels={trend_labels} />
              </div>
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 rounded-lg"><PieChartIcon className="w-4 h-4 text-emerald-600" /></div>
                    <div>
                      <CardTitle className="text-sm font-bold">Payment Status</CardTitle>
                      <CardDescription className="text-[10px]">Order payment distribution</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={payment_distribution.map(d => ({ name: d.status, value: d.count }))}
                        innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                        {payment_distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, name: any) => [v + ' orders', name]} contentStyle={{ fontSize: 11, fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1.5 mt-2">
                    {payment_distribution.map((d, i) => (
                      <div key={d.status} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold border"
                        style={{ borderColor: PIE_COLORS[i % PIE_COLORS.length] + '40', backgroundColor: PIE_COLORS[i % PIE_COLORS.length] + '12' }}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {d.status}
                        </span>
                        <span className="font-black text-slate-800 shrink-0">{d.count} <span className="text-slate-400 font-bold text-[10px]">({fmtK(d.total)})</span></span>
                      </div>
                    ))}
                    {payment_distribution.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No data for selected period</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROW 2 — Monthly Revenue vs Expenses bar (2/3) + Staff Leaderboard (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg"><BarChartIcon className="w-4 h-4 text-blue-600" /></div>
                    <div>
                      <CardTitle className="text-sm font-bold">Monthly Revenue vs Expenses</CardTitle>
                      <CardDescription className="text-[10px]">Full-year comparison — current year</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthly_bar_data} barCategoryGap="28%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => fmtK(v).replace('TZS ', '')} />
                      <Tooltip formatter={(v: any) => [`TZS ${Number(v).toLocaleString()}`, '']} contentStyle={{ fontSize: 11, fontWeight: 600 }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 justify-center">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Revenue</span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Expenses</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Selling Products — replaces staff leaderboard */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-violet-50 rounded-lg"><TrendingUp className="w-4 h-4 text-violet-600" /></div>
                      <div>
                        <CardTitle className="text-sm font-bold">Top Selling Products</CardTitle>
                        <CardDescription className="text-[10px]">By revenue — selected period</CardDescription>
                      </div>
                    </div>
                    <Link href="/report_inventory" className="text-[10px] font-bold text-violet-600">View All</Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-2">
                  {top_products.length === 0 && <p className="text-center text-xs text-slate-400 py-8">No sales data for this period</p>}
                  {top_products.map((p, i) => {
                    const maxRev = top_products[0]?.revenue || 1;
                    const pct = Math.round((p.revenue / maxRev) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image
                            ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <Package className="h-4 w-4 text-slate-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 truncate max-w-[55%]">{p.name}</span>
                            <span className="font-black text-slate-900 shrink-0">TZS {p.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold w-14 text-right shrink-0">{p.qty.toLocaleString()} pcs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* ROW 3 — Customer Growth (full width) */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-sky-50 rounded-lg"><Users className="w-4 h-4 text-sky-600" /></div>
                    <div>
                      <CardTitle className="text-sm font-bold">Customer Growth</CardTitle>
                      <CardDescription className="text-[10px]">New customers per month — current year</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={customer_growth}>
                      <defs>
                        <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip formatter={(v: any) => [v + ' customers', 'New']} contentStyle={{ fontSize: 11, fontWeight: 600 }} />
                      <Area type="monotone" dataKey="customers" stroke="#0ea5e9" fill="url(#custGrad)" strokeWidth={2.5}
                        dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            {/* ROW 4 — Critical Alerts: Low Stock | Outstanding Orders | Expense Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900">Low Stock</CardTitle>
                        <CardDescription className="text-[10px]">{stock_alerts} product(s) below threshold</CardDescription>
                      </div>
                    </div>
                    <Link href="/report_inventory" className="text-[10px] font-bold text-slate-500 hover:text-slate-700">Report</Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50 border-none">
                        <TableHead className="text-[10px] font-black text-slate-500 pl-5">Product</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 text-center">Stock</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 text-center pr-5">Min</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {low_stock_products.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center text-xs text-slate-400 py-6">All stock levels healthy ✓</TableCell></TableRow>
                      ) : low_stock_products.map((p, i) => (
                        <TableRow key={i} className="hover:bg-slate-50 border-slate-100 transition-colors">
                          <TableCell className="py-2 pl-5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg border border-slate-100 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                                {p.image
                                  ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  : <Package className="h-3.5 w-3.5 text-slate-300" />
                                }
                              </div>
                              <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">{p.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${p.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{p.stock}</span>
                          </TableCell>
                          <TableCell className="py-2 text-center pr-5 text-xs font-bold text-slate-400">{p.threshold}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-rose-100 rounded-lg"><ArrowUpRight className="w-4 h-4 text-rose-600" /></div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900">Outstanding</CardTitle>
                        <CardDescription className="text-[10px]">Unpaid & partially paid orders</CardDescription>
                      </div>
                    </div>
                    <Link href="/sales-history?status=Unpaid" className="text-[10px] font-bold text-slate-500 hover:text-slate-700">View All</Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50 border-none">
                        <TableHead className="text-[10px] font-black text-slate-500 pl-5">Invoice</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500">Customer</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 text-right pr-5">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaid_orders.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center text-xs text-slate-400 py-6">No outstanding orders ✓</TableCell></TableRow>
                      ) : unpaid_orders.map((o, i) => (
                        <TableRow key={i} className="hover:bg-slate-50 border-slate-100 transition-colors">
                          <TableCell className="py-2 pl-5">
                            <Link href={`/orders-crud/${o.invoice}`} className="text-[11px] font-black text-slate-700 font-mono hover:underline">{o.invoice}</Link>
                            <p className="text-[9px] text-slate-400">{o.date}</p>
                          </TableCell>
                          <TableCell className="py-2 text-[11px] font-bold text-slate-700 truncate max-w-[90px]">{o.customer}</TableCell>
                          <TableCell className="py-2 text-right pr-5">
                            <p className="text-[11px] font-black text-slate-900">TZS {(o.payable - o.paid).toLocaleString()}</p>
                            <Badge variant="outline" className={`text-[9px] font-black border-none ${o.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{o.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-rose-50 rounded-lg"><ArrowDownRight className="w-4 h-4 text-rose-600" /></div>
                      <div>
                        <CardTitle className="text-sm font-bold">Expenses by Category</CardTitle>
                        <CardDescription className="text-[10px]">Where money is going</CardDescription>
                      </div>
                    </div>
                    <Link href="/expenses-crud" className="text-[10px] font-bold text-rose-600">Ledger</Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={expense_by_category.map(e => ({ name: e.category.length > 12 ? e.category.slice(0, 11) + '…' : e.category, total: e.total }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} tickFormatter={v => fmtK(v).replace('TZS ', '')} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} width={80} />
                      <Tooltip formatter={(v: any) => [`TZS ${Number(v).toLocaleString()}`, 'Spent']} contentStyle={{ fontSize: 11 }} />
                      <Bar dataKey="total" fill="#f87171" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {expense_by_category.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No expense data</p>}
                </CardContent>
              </Card>
            </div>

            {/* ROW 5 — Full-width Recent Orders table */}
            <RecentOrders orders={recentSales?.map((sale: any) => ({
              id: sale.invoice || `#SAL-${sale.id}`,
              name: sale.pos_customer?.customer_name || sale.posCustomer?.customer_name || sale.customer?.name || 'Walk-in Customer',
              email: '',
              amount: sale.payable_amount || sale.total_amount || 0,
              status: sale.payment_status || sale.status || 'Paid',
              date: new Date(sale.created_at).toLocaleDateString()
            }))} />

            {/* ROW 6 — Recent POS Activity (1/2) + Recent Expenses (1/2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-rose-500" />
                      <CardTitle className="text-sm font-bold">Recent POS Activity</CardTitle>
                    </div>
                    <Link href="/sales-history" className="text-[10px] font-bold text-rose-600">View All</Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableBody>
                      {recentSales?.map((sale: any) => (
                        <TableRow key={sale.id} className="hover:bg-slate-50 border-none transition-colors">
                          <TableCell className="py-2 pl-0">
                            <p className="text-xs font-bold text-slate-800">{sale.invoice || `#SAL-${sale.id}`}</p>
                            <p className="text-[10px] text-slate-400 italic">{sale.pos_customer?.customer_name || sale.posCustomer?.customer_name || 'Walk-in Customer'}</p>
                          </TableCell>
                          <TableCell className="py-2 text-right pr-0">
                            <p className="text-xs font-semibold text-slate-900">TZS {Number(sale.payable_amount || 0).toLocaleString()}</p>
                            <Badge variant="outline" className={`text-[9px] h-4 font-bold border-none ${sale.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : sale.payment_status === 'Partially Paid' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              {sale.payment_status || 'Paid'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      <CardTitle className="text-sm font-bold">Recent Expenses</CardTitle>
                    </div>
                    <Link href="/expenses-crud" className="text-[10px] font-bold text-red-600">Ledger</Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableBody>
                      {recentExpenses?.map((expense: any) => (
                        <TableRow key={expense.id} className="hover:bg-slate-50 border-none transition-colors">
                          <TableCell className="py-2 pl-0">
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{expense.particulars}</p>
                            <p className="text-[10px] text-slate-400 italic">{expense.category || 'General'}</p>
                          </TableCell>
                          <TableCell className="py-2 text-right pr-0">
                            <p className="text-xs font-semibold text-red-600">- TZS {Number(expense.amount || 0).toLocaleString()}</p>
                            <p className="text-[9px] text-slate-400">{new Date(expense.created_at).toLocaleDateString()}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* Gatekeeper Specialized Analytics */}
        {isGatekeeper && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                <Card className="animate-fade-up stagger-1 border-slate-200">
                   <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          Movement Trends
                        </CardTitle>
                        <CardDescription className="text-[10px]">Hourly movement distribution today</CardDescription>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                          onClick={() => setGatekeeperChartType("area")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${gatekeeperChartType === 'area' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <Activity className="w-3 h-3" /> Area
                        </button>
                        <button 
                          onClick={() => setGatekeeperChartType("bar")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${gatekeeperChartType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <BarChart3 className="w-3 h-3" /> Bar
                        </button>
                      </div>
                   </CardHeader>
                   <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                         {gatekeeperChartType === 'area' ? (
                         <AreaChart data={movement_trends}>
                            <defs>
                                <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip />
                            <Area type="monotone" dataKey="incoming" stroke="#10b981" fill="url(#inGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="outgoing" stroke="#f59e0b" fill="url(#outGrad)" strokeWidth={2} />
                         </AreaChart>
                         ) : (
                         <BarChart data={movement_trends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip />
                            <Bar dataKey="incoming" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="outgoing" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                         </BarChart>
                         )}
                      </ResponsiveContainer>
                   </CardContent>
                </Card>
             </div>
             
             <Card className="animate-fade-up stagger-2 border-slate-200">
                <CardHeader>
                   <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-emerald-600" />
                      In/Out Ratio
                   </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-8">
                   <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                         <Pie
                            data={[
                              { name: 'Incoming', value: incoming_today || 0 },
                              { name: 'Outgoing', value: outgoing_today || 0 }
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="w-full space-y-2 mt-4">
                      <div className="flex justify-between items-center p-2 rounded bg-emerald-50 border border-emerald-100">
                         <span className="text-xs font-bold text-emerald-700">Incoming</span>
                         <span className="text-xs font-black">{incoming_today}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-amber-50 border border-amber-100">
                         <span className="text-xs font-bold text-amber-700">Outgoing</span>
                         <span className="text-xs font-black">{outgoing_today}</span>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        )}

        {/* Ready for Pickup & Other operational boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Ready for Pickup Board */}
          {isGatekeeper && (
            <Card className="xl:col-span-3 animate-fade-up stagger-4 border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-sky-50 rounded-lg">
                          <Truck className="w-5 h-5 text-sky-600" />
                       </div>
                       <div>
                          <CardTitle className="text-sm font-black text-slate-800">Ready for Pickup</CardTitle>
                          <CardDescription className="text-[10px] font-bold">Waiting to be recorded as Out</CardDescription>
                       </div>
                    </div>
                    <Badge className="bg-sky-100 text-sky-700 border-sky-200 font-bold">{ready_for_pickup?.length} Items</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50 border-none transition-colors">
                                    <TableHead className="text-[10px] font-black tracking-widest text-slate-400 py-4 h-auto">Ref #</TableHead>
                                    <TableHead className="text-[10px] font-black tracking-widest text-slate-400 py-4 h-auto">Customer</TableHead>
                                    <TableHead className="text-[10px] font-black tracking-widest text-slate-400 py-4 h-auto">Item Details</TableHead>
                                    <TableHead className="text-[10px] font-black tracking-widest text-slate-400 py-4 h-auto">Status</TableHead>
                                    <TableHead className="text-right text-[10px] font-black tracking-widest text-slate-400 py-4 h-auto pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ready_for_pickup?.map((item: any) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50 border-none transition-colors group">
                                        <TableCell className="py-4 font-bold text-xs text-blue-600 underline decoration-blue-200 decoration-2 underline-offset-4">
                                           {item.order_number}
                                        </TableCell>
                                        <TableCell>
                                           <p className="text-xs font-black text-slate-800 tracking-tighter">
                                              {item.createdBy?.staff_name || 'System'}
                                           </p>
                                           <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                              <Activity size={10} /> +255 123 456 789
                                           </div>
                                        </TableCell>
                                        <TableCell>
                                           <p className="text-xs font-black text-slate-800 tracking-tighter">{item.product?.product_name || 'Production Item'}</p>
                                           <p className="text-[10px] text-zinc-400 font-bold italic">By: {item.createdBy?.staff_name || 'Staff'}</p>
                                        </TableCell>
                                        <TableCell>
                                           <Badge variant="outline" className="text-[10px] font-black tracking-tighter bg-sky-50 text-sky-700 border-sky-100 rounded-lg h-7 px-3">
                                              Ready for pickup
                                           </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                               <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-blue-600 hover:bg-blue-50">View / Comment</Button>
                                               <Link href="/gatekeeper/record-out">
                                                  <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black tracking-tighter flex items-center gap-1.5 px-4 shadow-sm">
                                                     <ArrowRightFromLine className="w-3 h-3" />
                                                     Record Out
                                                  </Button>
                                               </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          )}
          

          {/* Gatekeeper Board */}
          {isGatekeeper && (
            <Card className="animate-fade-up stagger-3 border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <CardTitle className="text-sm font-bold">Gate Movements</CardTitle>
                  </div>
                  <Link href="/gatekeeper-logs" className="text-[10px] font-bold text-blue-600">All Logs</Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    {recent_logs?.map((log: any) => (
                      <TableRow key={log.id} className="hover:bg-slate-50 border-none transition-colors">
                        <TableCell className="py-2 pl-0">
                          <p className="text-xs font-bold text-slate-800">{log.plate_number || 'No Plate'}</p>
                          <p className="text-[10px] text-slate-400 italic">{log.driver_name || 'Anonymous'}</p>
                        </TableCell>
                        <TableCell className="py-2 text-right pr-0">
                          <Badge variant="outline" className={`text-[10px] font-bold ${log.direction === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {log.direction?.toUpperCase()}
                          </Badge>
                          <p className="text-[9px] text-slate-400 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Reception intelligence */}
          {isReceptionist && (
            <Card className="animate-fade-up stagger-3 border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-500" />
                    <CardTitle className="text-sm font-bold">Customer Relations</CardTitle>
                  </div>
                  <Link href="/customers" className="text-[10px] font-bold text-sky-600">Visitors</Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    {recent_customers?.map((customer: any) => (
                      <TableRow key={customer.id} className="hover:bg-slate-50 border-none transition-colors">
                        <TableCell className="py-2 pl-0">
                          <p className="text-xs font-bold text-slate-800">{customer.name}</p>
                          <p className="text-[10px] text-slate-400 italic">{customer.phone}</p>
                        </TableCell>
                        <TableCell className="py-2 text-right pr-0">
                          <Badge variant="outline" className="text-[10px] font-bold bg-sky-50 text-sky-600">
                            New Lead
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

        </div>


        {/* Delivery Specialized Analytics */}
        {isDelivery && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Left: Monthly Performance Chart */}
               <div className="lg:col-span-2">
                  <Card className="animate-fade-up stagger-1 border-slate-200">
                     <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 tracking-tight">
                            <Activity className="w-4 h-4 text-blue-600" />
                            Delivery Performance (Month)
                          </CardTitle>
                          <CardDescription className="text-[10px] font-bold text-slate-400">Monthly breakdown of completed tasks</CardDescription>
                        </div>
                     </CardHeader>
                     <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={performance_chart?.labels.map((label, idx) => ({ date: label, count: performance_chart.data[idx] }))}>
                             <defs>
                                <linearGradient id="deliveryGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} hide />
                             <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                             <Tooltip contentStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                             <Area 
                               type="monotone" 
                               dataKey="count" 
                               stroke="#3b82f6" 
                               fill="url(#deliveryGrad)" 
                               strokeWidth={3} 
                               dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                               activeDot={{ r: 6, strokeWidth: 0 }}
                             />
                          </AreaChart>
                        </ResponsiveContainer>
                     </CardContent>
                  </Card>
               </div>

               {/* Right: Driver Status / Info */}
               <div>
                  <Card className="h-full border-slate-200 animate-fade-up stagger-2 bg-white">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        Driver Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                             </div>
                             <div>
                                <h3 className="text-sm font-black text-slate-900">{(driver_info as any)?.name || user?.staff_name}</h3>
                                <p className="text-[10px] font-bold text-slate-500 tracking-widest">Active Driver</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 mb-1">Vehicle</p>
                                <p className="text-xs font-black text-slate-800">{(driver_info as any)?.vehicle_registration || 'N/A'}</p>
                             </div>
                             <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 mb-1">Zone</p>
                                <p className="text-xs font-black text-slate-800">{(driver_info as any)?.delivery_zone || 'All Zones'}</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 tracking-widest px-1">Quick Actions</h4>
                          <div className="grid grid-cols-1 gap-2">
                             <Button variant="outline" className="w-full justify-between h-11 border-slate-200 hover:bg-slate-50 group">
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                   <Activity className="w-4 h-4 text-blue-500" />
                                   Update Current Location
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                             </Button>
                             <Button variant="outline" className="w-full justify-between h-11 border-slate-200 hover:bg-slate-50 group">
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                   <Truck className="w-4 h-4 text-emerald-500" />
                                   Report Delivery Status
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                             </Button>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
               </div>
            </div>

            {/* Recent Deliveries Table */}
            <Card className="animate-fade-up stagger-3 border-slate-200 shadow-sm">
               <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                  <div>
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ListTodo className="w-5 h-5 text-indigo-600" />
                      Assigned Deliveries
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500">Manage your current and upcoming delivery tasks</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    VIEW ALL DELIVERIES
                  </Button>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-[10px] font-black text-slate-400 tracking-wider h-10">Delivery #</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 tracking-wider h-10">Customer</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 tracking-wider h-10">Address</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 tracking-wider h-10 text-center">Items</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 tracking-wider h-10">Payment</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 tracking-wider h-10">Status</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 tracking-wider h-10 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recent_deliveries?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center">
                             <div className="flex flex-col items-center justify-center text-slate-400">
                                <Truck className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-bold tracking-widest opacity-40">No active deliveries assigned</p>
                             </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recent_deliveries?.map((delivery: any) => (
                          <TableRow key={delivery.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group">
                            <TableCell className="py-4">
                               <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{delivery.delivery_number}</span>
                                  <span className="text-[9px] font-bold text-slate-400">{new Date(delivery.created_at).toLocaleDateString()}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800">{delivery.customer_name}</span>
                                  <span className="text-[10px] text-slate-500">{delivery.phone}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-1 max-w-[200px]">
                                  <span className="text-xs font-medium text-slate-600 truncate">{delivery.delivery_address}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                               <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] font-black">
                                  {delivery.items?.length || 0} ITEMS
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                   <span className="text-xs font-semibold text-slate-900">TZS {Number(delivery.delivery_total || 0).toLocaleString()}</span>
                                   <span className="text-[9px] font-bold text-emerald-600 italic leading-none mt-0.5">{delivery.payment_method}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                               <Badge className={`text-[10px] font-black px-2.5 py-0.5 tracking-tighter ${
                                 delivery.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                 delivery.status === 'assigned' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                 delivery.status === 'in-transit' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                               }`}>
                                 {delivery.status}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-blue-50 text-blue-600">
                                  <ArrowRight className="w-4 h-4" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
               </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
