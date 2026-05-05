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
  pending_production: number;
  stock_alerts: number;
  total_customers: number;
  balance_due?: number;
  receivables: number;
  staff_count: number;
  containers_count: number;
  rm_metres: number;
  recentSales: any[];
  recentProduction: any[];
  recentExpenses: any[];
  staffPerformance: any[];
  trend_labels: string[];
  revenue_trend: number[];
  expense_trend: number[];
  production_trend: number[];
  prod_stats: Record<string, number>;
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
  performance_chart?: {
    labels: string[];
    data: number[];
  };
  driver_info?: any;
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
];

export default function DashboardPage({
  user,
  roleName,
  total_revenue,
  net_profit,
  total_expenses,
  inventory_value,
  total_orders,
  pending_production,
  stock_alerts,
  total_customers,
  balance_due,
  receivables,
  staff_count,
  containers_count,
  rm_metres,
  recentSales,
  recentProduction,
  recentExpenses,
  staffPerformance,
  trend_labels,
  revenue_trend,
  expense_trend,
  production_trend,
  prod_stats,
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
  driver_info
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
    { title: "Total Revenue", value: `TZS ${Number(total_revenue || 0).toLocaleString()}`, change: 0, icon: DollarSign, href: "/sales-history", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
    { title: "Net Profit", value: `TZS ${Number(net_profit || 0).toLocaleString()}`, change: 0, icon: TrendingUp, href: "/report_profit", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
    { title: "Total Expenses", value: `TZS ${Number(total_expenses || 0).toLocaleString()}`, change: 0, icon: Activity, href: "/expenses-crud", bgClass: "bg-rose-50/50", iconBgClass: "bg-rose-100 text-rose-600" },
    { title: "Balance Due", value: `TZS ${Number(balance_due || 0).toLocaleString()}`, change: 0, icon: ArrowUpRight, href: "/sales-history", bgClass: "bg-red-50/50", iconBgClass: "bg-red-100 text-red-600" },
    { title: "Inventory Value", value: `TZS ${Number(inventory_value || 0).toLocaleString()}`, change: 0, icon: Package, href: "/report_inventory", bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600" },
    { title: "Sales Orders", value: (total_orders || 0).toLocaleString(), change: 0, icon: ShoppingCart, href: "/orders-crud", bgClass: "bg-indigo-50/50", iconBgClass: "bg-indigo-100 text-indigo-600" },
    { title: "Pending Prod.", value: (pending_production || 0).toLocaleString(), change: 0, icon: Factory, href: "/production-orders-new", bgClass: "bg-orange-50/50", iconBgClass: "bg-orange-100 text-orange-600" },
    { title: "Stock Alerts", value: (stock_alerts || 0).toLocaleString(), change: 0, icon: AlertTriangle, href: "/all-products", bgClass: "bg-red-50/50", iconBgClass: "bg-red-100 text-red-600" },
    { title: "Total Customers", value: (total_customers || 0).toLocaleString(), change: 0, icon: Users, href: "/customers", bgClass: "bg-sky-50/50", iconBgClass: "bg-sky-100 text-sky-600" },
    { title: "Active Staff", value: (staff_count || 0).toLocaleString(), change: 0, icon: UserCheck, href: "/users-crud", bgClass: "bg-violet-50/50", iconBgClass: "bg-violet-100 text-violet-600" },
    { title: "Containers", value: (containers_count || 0).toLocaleString(), change: 0, icon: Truck, href: "/containers-crud", bgClass: "bg-slate-50/50", iconBgClass: "bg-slate-100 text-slate-600" },
    { title: "Raw Material (M)", value: (rm_metres || 0).toLocaleString(), change: 0, icon: Layers, href: "/raw-materials", bgClass: "bg-lime-50/50", iconBgClass: "bg-lime-100 text-lime-600" },
  ];

  const sellerKpis = [
    { title: "My Lifetime Sales", value: Number(my_sales || 0).toLocaleString(), change: 0, icon: ShoppingCart, href: "/sales-history", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
    { title: "Today Revenue", value: `TZS ${Number(daily_sales || 0).toLocaleString()}`, change: 0, icon: DollarSign, href: "/sales-history", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
    { title: "My Customers", value: Number(total_customers || 0).toLocaleString(), change: 0, icon: Users, href: "/customers", bgClass: "bg-sky-50/50", iconBgClass: "bg-sky-100 text-sky-600" },
  ];

  const deliveryKpis = [
    { title: "Assigned", value: (delivery_stats?.assigned_count || 0).toLocaleString(), change: 0, subtitle: "Tasks for today", icon: ListTodo, href: "/deliveries", color: "blue", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600", dotColor: "bg-blue-500" },
    { title: "Pending", value: (delivery_stats?.pending_count || 0).toLocaleString(), change: 0, subtitle: "On the way", icon: Truck, href: "/deliveries", color: "amber", bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600", dotColor: "bg-amber-500" },
    { title: "Delivered", value: (delivery_stats?.delivered_count || 0).toLocaleString(), change: 0, subtitle: "Successfully closed", icon: CheckCircle2, href: "/deliveries", color: "emerald", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600", dotColor: "bg-emerald-500" },
    { title: "Failed", value: (delivery_stats?.failed_count || 0).toLocaleString(), change: 0, subtitle: "Issues to report", icon: XCircle, href: "/deliveries", color: "rose", bgClass: "bg-rose-50/50", iconBgClass: "bg-rose-100 text-rose-600", dotColor: "bg-rose-500" },
  ];

  const gatekeeperKpis = [
    { title: "Total Movements", value: (total_movements || 0).toLocaleString(), change: 0, icon: Activity, href: "/gatekeeper", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
    { title: "My Entries", value: (my_entries || 0).toLocaleString(), change: 0, icon: Users, href: "/gatekeeper", bgClass: "bg-sky-50/50", iconBgClass: "bg-sky-100 text-sky-600" },
    { title: "Incoming", value: (incoming_today || 0).toLocaleString(), change: 0, icon: ArrowDownRight, href: "/gatekeeper/record-in", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600", isGatekeeperIn: true },
    { title: "Outgoing", value: (outgoing_today || 0).toLocaleString(), change: 0, icon: ArrowUpRight, href: "/gatekeeper/record-out", bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600", isGatekeeperOut: true },
  ];

  const receptionistKpis = [
    { title: "Today Visitors", value: (today_visitors || 0).toLocaleString(), change: 0, icon: Users, href: "/customers", bgClass: "bg-sky-50/50", iconBgClass: "bg-sky-100 text-sky-600" },
    { title: "Pending Follows", value: (pending_followups || 0).toLocaleString(), change: 0, icon: Activity, href: "/customer-followups", bgClass: "bg-rose-50/50", iconBgClass: "bg-rose-100 text-rose-600" },
  ];

  let kpis = allKpis;
  if (isInventory) {
    kpis = allKpis.filter((k) => ["Inventory Value", "Stock Alerts", "Raw Material (M)", "Pending Prod.", "Sales Orders"].includes(k.title));
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
    kpis = allKpis.filter((k) => ["Total Revenue", "Sales Orders", "Pending Prod.", "Stock Alerts", "Total Customers", "Active Staff"].includes(k.title));
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
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">
              Hello! <span className="text-blue-600 font-bold">{user?.staff_name}</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 italic flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" />
              {roleName} Dashboard
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isDelivery && !isGatekeeper && !isReceptionist && (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-200 bg-white shadow-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <select
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none"
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
                  className="h-8 w-[118px] rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 w-[118px] rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none"
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
                 <div className={`rounded-xl border ${getKpiBorderClass(kpi.iconBgClass)} p-4 sm:p-5 ${kpi.bgClass} flex flex-col justify-between h-full group transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
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
                <div className={`rounded-xl border ${getKpiBorderClass(kpi.iconBgClass)} p-4 sm:p-5 ${kpi.bgClass} flex flex-col justify-between h-full group transition-all duration-300 hover:shadow-lg`}>
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

        {/* Main Intelligence Row */}
        {(isExecutive || isFinancial || isBranchManager || isInventory) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Expenses Intelligence */}
          <div className="lg:col-span-2 space-y-6 animate-fade-up stagger-1">
            <RevenueChart 
              revenueData={revenue_trend} 
              expenseData={expense_trend} 
              labels={trend_labels} 
            />
          </div>

          {/* Top Performance Leaderboard */}
          <Card className="animate-fade-up stagger-2 border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Top Sellers Performance</CardTitle>
                  <CardDescription className="text-[10px]">Highest revenue contributors this month</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPerformance?.map((staff, idx) => (
                  <div key={staff.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{staff.name}</p>
                        <p className="text-[10px] text-slate-500 italic">Senior Sales Specialist</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-900">TZS {Number(staff.total_sales || 0).toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-600 font-bold leading-none mt-1">
                        <TrendingUp size={10} /> 12%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
          
          {/* Recent Sales Command (Shared by many) */}
          {(isExecutive || isFinancial || isBranchManager || isInventory || isSeller) && (
          <Card className="animate-fade-up stagger-3 border-slate-200">
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
                  {recentSales?.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-slate-50 border-none transition-colors">
                      <TableCell className="py-2 pl-0">
                        <p className="text-xs font-bold text-slate-800">{sale.invoice || `#SAL-${sale.id}`}</p>
                        <p className="text-[10px] text-slate-400 italic capitalize">{sale.customer?.name || 'Walk-in Customer'}</p>
                      </TableCell>
                      <TableCell className="py-2 text-right pr-0">
                        <p className="text-xs font-semibold text-slate-900">TZS {Number(sale.payable_amount || 0).toLocaleString()}</p>
                        <Badge variant="outline" className="text-[9px] h-4 font-bold border-rose-100 bg-rose-50 text-rose-600">
                           Paid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}

           {/* Manufacturing Operations */}
           {(isExecutive || isBranchManager || isInventory) && (
           <Card className="animate-fade-up stagger-4 border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-50">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Factory className="w-4 h-4 text-orange-500" />
                   <CardTitle className="text-sm font-bold">Real-time Manufacturing</CardTitle>
                </div>
                <Link href="/production-orders-new" className="text-[10px] font-bold text-orange-600">Operations</Link>
               </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableBody>
                  {recentProduction?.map((job) => (
                    <TableRow key={job.id} className="hover:bg-slate-50 border-none transition-colors">
                      <TableCell className="py-2 pl-0">
                        <p className="text-xs font-bold text-slate-800">{job.batch_number || `BATCH-${job.id}`}</p>
                        <p className="text-[10px] text-slate-400 italic">Produced by: {job.created_by?.staff_name || 'System'}</p>
                      </TableCell>
                      <TableCell className="py-2 text-right pr-0">
                         <Badge variant="outline" className={`text-[10px] font-bold border-amber-100 bg-amber-50 text-amber-600`}>
                            {job.status || 'Active'}
                          </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
           )}

          {/* Expense Tracking */}
          {(isExecutive || isFinancial) && (
          <Card className="animate-fade-up stagger-5 border-slate-200 xl:col-span-1">
            <CardHeader className="pb-3 border-b border-slate-50">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <ArrowDownRight className="w-4 h-4 text-red-500" />
                   <CardTitle className="text-sm font-bold">Expense Monitoring</CardTitle>
                </div>
                <Link href="/expenses-crud" className="text-[10px] font-bold text-red-600">Ledger</Link>
               </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableBody>
                  {recentExpenses?.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-slate-50 border-none transition-colors">
                      <TableCell className="py-2 pl-0">
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{expense.particulars}</p>
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

        {/* Real-time Order Intensity (Optional Full-width recent orders) */}
        {(isExecutive || isFinancial || isBranchManager || isSeller) && (
          <div className="animate-fade-up stagger-6">
             <RecentOrders orders={recentSales?.map((sale: any) => ({
                id: sale.invoice || `#SAL-${sale.id}`,
                name: sale.customer?.name || 'Walk-in Customer',
                email: '',
                amount: sale.payable_amount || sale.total_amount || 0,
                status: sale.payment_status || sale.status || 'Paid',
                date: new Date(sale.created_at).toLocaleDateString()
             }))} />
          </div>
        )}

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
                  <Card className="h-full border-slate-200 animate-fade-up stagger-2 bg-gradient-to-br from-white to-slate-50/50">
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
