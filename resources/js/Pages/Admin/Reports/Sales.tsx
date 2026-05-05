import { Head, router } from "@inertiajs/react";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Download,
  Search,
  Calendar,
  PieChart as PieIcon,
  Target,
  Users,
  Boxes,
  Wallet,
  Trophy,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "@/layouts/app-layout";

interface SalesReportProps {
  exports: any[];
  metrics: Record<string, number>;
  dynamics: Record<string, { revenue: number; profit: number }>;
  density: Record<string, number>;
  hours: number[] | Record<string, number>;
  modal: Record<string, number>;
  sellerPerformance?: Array<{
    seller_id: number | null;
    seller_name: string;
    revenue: number;
    profit: number;
    units: number;
    orders: number;
    target_amount: number;
    target_units: number;
    achievement_pct: number;
  }>;
  sellerDistribution?: Array<{ name: string; value: number }>;
  targetSummary?: {
    assigned_target_amount: number;
    achieved_amount: number;
    avg_achievement_pct: number;
  };
  filterType: string;
  categories: any[];
  currentStart: string;
  currentEnd: string;
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Reports", href: "#" },
  { title: "Sales Analysis", href: "/report_sales" },
];

export default function SalesReport({ 
  exports,
  metrics,
  dynamics,
  density,
  hours,
  modal,
  sellerPerformance = [],
  sellerDistribution = [],
  targetSummary,
  filterType,
}: SalesReportProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleFilterChange = (type: string) => {
    router.get('/report_sales', { filter_type: type }, { preserveState: true });
  };

  const filteredSales = React.useMemo(() => {
    if (!exports) {
return [];
}

    return exports.filter(item => 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exports, searchTerm]);

  const trendData = React.useMemo(() => {
    return Object.entries(dynamics || {}).map(([label, values]) => ({
      label,
      revenue: Number(values?.revenue || 0),
      profit: Number(values?.profit || 0),
    }));
  }, [dynamics]);

  const categoryBarData = React.useMemo(() => {
    return Object.entries(density || {}).map(([name, value]) => ({
      name,
      revenue: Number(value || 0),
    }));
  }, [density]);

  const paymentPieData = React.useMemo(() => {
    return Object.entries(modal || {}).map(([name, value]) => ({
      name,
      value: Number(value || 0),
    }));
  }, [modal]);

  const sellerBarData = React.useMemo(() => {
    return (sellerPerformance || []).map((s) => ({
      seller: s.seller_name,
      revenue: Number(s.revenue || 0),
      target: Number(s.target_amount || 0),
      achievement: Number(s.achievement_pct || 0),
    }));
  }, [sellerPerformance]);

  const staffDistributionData = React.useMemo(() => {
    if (sellerDistribution?.length) {
      return sellerDistribution
        .map((s) => ({ name: s.name, value: Number(s.value || 0) }))
        .sort((a, b) => b.value - a.value);
    }
    return sellerBarData
      .map((s) => ({ name: s.seller, value: Number(s.revenue || 0) }))
      .sort((a, b) => b.value - a.value);
  }, [sellerDistribution, sellerBarData]);

  const staffDistributionChartHeight = Math.max(320, staffDistributionData.length * 44);

  const hourlyData = React.useMemo(() => {
    const hourValues = Array.isArray(hours)
      ? hours
      : Object.keys(hours || {})
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => Number((hours as Record<string, number>)[k] || 0));

    return hourValues.map((value, idx) => ({
      hour: `${String(idx).padStart(2, "0")}:00`,
      revenue: Number(value || 0),
    }));
  }, [hours]);

  const targetAssigned = Number(targetSummary?.assigned_target_amount || 0);
  const targetAchieved = Number(targetSummary?.achieved_amount || 0);
  const targetPct = Number(targetSummary?.avg_achievement_pct || metrics?.target_attainment_pct || 0);

  const chartColors = ["#2563eb", "#10b981", "#f97316", "#8b5cf6", "#06b6d4", "#e11d48", "#64748b", "#84cc16"];

  const formatMoney = (v: number) => `TZS ${Number(v || 0).toLocaleString()}`;

  const tooltipCurrencyFormatter = (value: any) => {
    if (Array.isArray(value)) {
      const first = Number(value[0] ?? 0);
      return formatMoney(first);
    }
    return formatMoney(Number(value ?? 0));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sales Analysis" />
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Sales Performance</h1>
          </div>
          <div className="flex items-center gap-3">
             <Select value={filterType} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[160px] h-10 bg-white border-slate-200 text-xs font-bold">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
             </Select>
             <Button variant="outline" className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm">
                <Download className="h-4 w-4 mr-2" /> Export
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
           <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-blue-500" /> TOTAL REVENUE
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatMoney(metrics?.total_revenue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Growth: {(metrics?.growth_revenue || 0).toFixed(1)}%</p>
              </CardContent>
           </Card>

           <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> NET PROFIT
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-emerald-600">{formatMoney(metrics?.total_profit || 0)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Growth: {(metrics?.growth_profit || 0).toFixed(1)}%</p>
              </CardContent>
           </Card>

           <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3 text-indigo-500" /> ORDERS
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{Number(metrics?.sales_velocity || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Velocity growth: {(metrics?.growth_velocity || 0).toFixed(1)}%</p>
              </CardContent>
           </Card>

           <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <PieIcon className="h-3 w-3 text-orange-500" /> MARGIN
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{Number(metrics?.unit_margin || 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-0.5">Delta: {(metrics?.growth_margin || 0).toFixed(1)} pts</p>
              </CardContent>
           </Card>
           <Card className="border-l-4 border-l-violet-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Boxes className="h-3 w-3 text-violet-500" /> TOTAL UNITS
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{Number(metrics?.total_units || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Sold quantity</p>
              </CardContent>
           </Card>

           <Card className="border-l-4 border-l-sky-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-sky-500" /> AVG ORDER
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatMoney(metrics?.avg_order_value || 0)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Average ticket</p>
              </CardContent>
           </Card>

           <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Target className="h-3 w-3 text-rose-500" /> TARGET ATTAINMENT
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{Number(targetPct).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned: {formatMoney(targetAssigned)}</p>
              </CardContent>
           </Card>

           <Card className="border-l-4 border-l-emerald-600">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-emerald-600" /> TOP SALER
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm font-bold text-foreground truncate">{(metrics?.top_seller_name as any) || 'N/A'}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatMoney(metrics?.top_seller_revenue || 0)}</p>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue & Profit Trend (Line Graph)</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={tooltipCurrencyFormatter} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Sales by Category (Bar Graph)</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={tooltipCurrencyFormatter} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Payment Mode Share</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={105} label>
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipCurrencyFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue Contribution by Staff</CardTitle>
            </CardHeader>
            <CardContent className="h-[420px] overflow-y-auto">
              <div style={{ height: `${staffDistributionChartHeight}px`, minHeight: "320px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffDistributionData} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={tooltipCurrencyFormatter} />
                    <Bar dataKey="value" fill="#34d399" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Hourly Revenue Pulse (Bar Graph)</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={tooltipCurrencyFormatter} />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Saler Revenue vs Target (Bar Graph)</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sellerBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="seller" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={tooltipCurrencyFormatter} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-none overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Sales Target Achievement by Saler
              </CardTitle>
              <div className="text-xs text-slate-500 font-bold">
                Achieved {formatMoney(targetAchieved)} / Target {formatMoney(targetAssigned)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500">Saler</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Revenue</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Target</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Units</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-center">Achievement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerPerformance.map((seller, idx) => (
                  <TableRow key={`${seller.seller_id || 'na'}-${idx}`}>
                    <TableCell className="text-sm font-medium text-slate-900">{seller.seller_name}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatMoney(seller.revenue)}</TableCell>
                    <TableCell className="text-right text-sm">{formatMoney(seller.target_amount)}</TableCell>
                    <TableCell className="text-right text-sm">{Number(seller.units || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {Number(seller.achievement_pct || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!sellerPerformance.length && (
              <div className="py-12 text-center text-slate-400 italic text-sm">No seller target performance data found for this period</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Transaction Ledger</CardTitle>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input
                   placeholder="Search transactions..."
                   className="pl-9 h-9 w-[280px]"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500">Product / SKU</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-center">Qty</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Revenue</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Profit</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-center">Platform</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales?.map((sale, idx) => (
                   <TableRow key={idx}>
                      <TableCell>
                         <div className="space-y-0.5">
                            <p className="text-sm font-medium text-slate-900">{sale.product_name}</p>
                            <p className="text-[10px] text-slate-400">SKU: {sale.product_sku}</p>
                         </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{sale.product_quantity}</TableCell>
                       <TableCell className="text-right text-sm font-medium">{formatMoney((sale.unit_price || 0) * (sale.product_quantity || 0))}</TableCell>
                       <TableCell className="text-right text-sm font-semibold text-emerald-600">{formatMoney(((sale.unit_price || 0) - (sale.buying_price || 0)) * (sale.product_quantity || 0))}</TableCell>
                      <TableCell className="text-center">
                         <Badge variant="secondary" className="text-[9px] h-5 px-1.5 uppercase font-bold">{sale.sale_mode || 'POS'}</Badge>
                      </TableCell>
                   </TableRow>
                ))}
              </TableBody>
            </Table>
            {!filteredSales?.length && (
               <div className="py-20 text-center text-slate-400 italic text-sm">No sales logs found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
