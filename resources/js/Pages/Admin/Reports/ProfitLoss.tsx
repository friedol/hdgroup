import { KpiCard } from "@/components/dashboard/KpiCard";
import { Head, Link, router } from "@inertiajs/react";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Calendar,
  Download,
  Search,
   Scale,
  Filter,
   Receipt,
   ShoppingCart,
   Package,
   Percent,
   Calculator,
   Wallet,
   Share2,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfitLossReportProps {
  total_sales: number;
  gross_profit: number;
  total_expenses: number;
  transactions: any[];
  topProducts: any[];
   paymentBreakdown?: { payment_method: string; total_orders: number; total_amount: number }[];
   statusBreakdown?: { payment_status: string; total_orders: number; total_amount: number }[];
   expenseCategories?: { category: string; total_amount: number }[];
   profitTrend?: { day: string; revenue: number; gross_profit: number; expenses: number; net_profit: number }[];
   financialStats?: {
      total_cogs: number;
      discounts_total: number;
      tax_total: number;
      orders_count: number;
      items_sold: number;
      average_order_value: number;
      pending_expenses: number;
      net_profit: number;
      gross_margin_pct: number;
      net_margin_pct: number;
      expense_ratio_pct: number;
      break_even_revenue: number;
   };
  branches?: { id: number; name: string }[];
  filters?: { period: string; branch_id: string | null; date_from: string | null; date_to: string | null };
  isGlobal?: boolean;
}

const breadcrumbs = [
  { title: "Analytics", href: "/analytics" },
  { title: "Profit & Loss", href: "/report_profit" },
];

export default function ProfitLossReport({ 
  total_sales, 
  gross_profit, 
  total_expenses, 
  transactions, 
  topProducts,
   paymentBreakdown = [],
   statusBreakdown = [],
   expenseCategories = [],
   profitTrend = [],
   financialStats,
  branches = [],
  filters = { period: 'month', branch_id: null, date_from: null, date_to: null },
  isGlobal = false,
}: ProfitLossReportProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [period, setPeriod] = React.useState(filters?.period ?? 'month');
  const [branchId, setBranchId] = React.useState(filters?.branch_id ?? '');
  const [dateFrom, setDateFrom] = React.useState(filters?.date_from ?? '');
  const [dateTo, setDateTo] = React.useState(filters?.date_to ?? '');

  const applyFilters = () => {
    const params: Record<string, string> = { period };
    if (branchId) params.branch_id = branchId;
    if (period === 'custom' && dateFrom) params.date_from = dateFrom;
    if (period === 'custom' && dateTo) params.date_to = dateTo;
    router.get('/report_profit', params, { preserveScroll: true });
  };

   const handlePrint = () => {
      const params = new URLSearchParams();
      params.set('period', period);
      if (branchId) params.set('branch_id', branchId);
      if (period === 'custom' && dateFrom) params.set('date_from', dateFrom);
      if (period === 'custom' && dateTo) params.set('date_to', dateTo);
      params.set('action', 'print');

      const printUrl = `/report_profit/print?${params.toString()}`;

      const existingIframe = document.getElementById('print-iframe');
      if (existingIframe) {
         document.body.removeChild(existingIframe);
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      iframe.src = printUrl;

      document.body.appendChild(iframe);
   };

   const handleShare = async () => {
      const params = new URLSearchParams();
      params.set('period', period);
      if (branchId) params.set('branch_id', branchId);
      if (period === 'custom' && dateFrom) params.set('date_from', dateFrom);
      if (period === 'custom' && dateTo) params.set('date_to', dateTo);

      const shareUrl = `${window.location.origin}/report_profit?${params.toString()}`;
      const shareTitle = `Profit & Loss Report (${period})`;

      if (navigator.share) {
         try {
            await navigator.share({
               title: shareTitle,
               text: 'Profit and Loss report',
               url: shareUrl,
            });
            return;
         } catch (err: any) {
            if (err?.name === 'AbortError') return;
         }
      }

      try {
         await navigator.clipboard.writeText(shareUrl);
         alert('Report link copied to clipboard!');
      } catch {
         alert('Unable to share automatically.');
      }
   };
  
   const net_profit = (financialStats?.net_profit ?? ((gross_profit || 0) - (total_expenses || 0)));

   const stats = {
      total_cogs: financialStats?.total_cogs ?? 0,
      discounts_total: financialStats?.discounts_total ?? 0,
      tax_total: financialStats?.tax_total ?? 0,
      orders_count: financialStats?.orders_count ?? 0,
      items_sold: financialStats?.items_sold ?? 0,
      average_order_value: financialStats?.average_order_value ?? 0,
      pending_expenses: financialStats?.pending_expenses ?? 0,
      gross_margin_pct: financialStats?.gross_margin_pct ?? 0,
      net_margin_pct: financialStats?.net_margin_pct ?? 0,
      expense_ratio_pct: financialStats?.expense_ratio_pct ?? 0,
      break_even_revenue: financialStats?.break_even_revenue ?? 0,
   };

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) {
return [];
}

    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Profit & Loss Audit" />
      <div className="w-full space-y-8 pb-10">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Profit & Loss Audit</h1>
            <p className="text-xs font-bold text-slate-500">Detailed P&L audit and transaction-level profitability analysis</p>
          </div>
          <div className="flex items-center gap-3">
             <Button onClick={handleShare} variant="outline" className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm">
                <Share2 className="w-4 h-4" /> Share
             </Button>
             <Button variant="outline" className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm">
                <Download className="w-4 h-4" /> Export Audit
             </Button>
             <Button onClick={handlePrint} variant="outline" className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm">
                Print
             </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-600">Filter Period</span>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-[140px] text-xs font-bold border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {period === 'custom' && (
            <>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="h-9 w-[140px] text-xs font-bold border-slate-200" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="h-9 w-[140px] text-xs font-bold border-slate-200" />
            </>
          )}
          {isGlobal && branches.length > 0 && (
            <Select value={branchId || 'all'} onValueChange={v => setBranchId(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-[160px] text-xs font-bold border-slate-200">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={applyFilters} className="h-9 bg-slate-900 hover:bg-black font-bold text-xs gap-2 px-5">
            <Calendar className="w-4 h-4" /> Apply
          </Button>
        </div>

            {/* Global Financial State + Deep Finance Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3 md:gap-4">
               <KpiCard
                  title="TOTAL SALES"
                  value={`TZS ${(total_sales || 0).toLocaleString()}`}
                  change={0}
                  icon={TrendingUp}
                  bgClass="bg-blue-50/20"
                  iconBgClass="bg-blue-100 text-blue-600"
               />
               <KpiCard
                  title="GROSS PROFIT"
                  value={`TZS ${(gross_profit || 0).toLocaleString()}`}
                  change={0}
                  icon={Scale}
                  bgClass="bg-emerald-50/20"
                  iconBgClass="bg-emerald-100 text-emerald-600"
               />
               <KpiCard
                  title="TOTAL EXPENSES"
                  value={`-TZS ${(total_expenses || 0).toLocaleString()}`}
                  change={0}
                  icon={ArrowDownRight}
                  bgClass="bg-rose-50/20"
                  iconBgClass="bg-rose-100 text-rose-600"
               />
               <KpiCard
                  title="NET FLOW (P&L)"
                  value={`TZS ${(net_profit || 0).toLocaleString()}`}
                  change={0}
                  icon={Activity}
                  bgClass="bg-indigo-50/20"
                  iconBgClass="bg-indigo-100 text-indigo-600"
               />
               <KpiCard
                  title="COGS"
                  value={`TZS ${stats.total_cogs.toLocaleString()}`}
                  change={0}
                  icon={Receipt}
                  bgClass="bg-orange-50/20"
                  iconBgClass="bg-orange-100 text-orange-600"
               />
               <KpiCard
                  title="DISCOUNTS"
                  value={`TZS ${stats.discounts_total.toLocaleString()}`}
                  change={0}
                  icon={ArrowDownRight}
                  bgClass="bg-amber-50/20"
                  iconBgClass="bg-amber-100 text-amber-600"
               />
               <KpiCard
                  title="TAX"
                  value={`TZS ${stats.tax_total.toLocaleString()}`}
                  change={0}
                  icon={Percent}
                  bgClass="bg-sky-50/20"
                  iconBgClass="bg-sky-100 text-sky-600"
               />
               <KpiCard
                  title="ORDERS"
                  value={stats.orders_count.toLocaleString()}
                  change={0}
                  icon={ShoppingCart}
                  bgClass="bg-indigo-50/20"
                  iconBgClass="bg-indigo-100 text-indigo-600"
               />
               <KpiCard
                  title="ITEMS SOLD"
                  value={Number(stats.items_sold).toLocaleString()}
                  change={0}
                  icon={Package}
                  bgClass="bg-emerald-50/20"
                  iconBgClass="bg-emerald-100 text-emerald-600"
               />
               <KpiCard
                  title="AVG ORDER"
                  value={`TZS ${Math.round(stats.average_order_value).toLocaleString()}`}
                  change={0}
                  icon={Wallet}
                  bgClass="bg-purple-50/20"
                  iconBgClass="bg-purple-100 text-purple-600"
               />
            </div>

            {/* Ratios + Breakdowns */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
               <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-bold text-slate-900">Performance Ratios</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {[
                        { label: 'Gross Margin', value: `${stats.gross_margin_pct.toFixed(2)}%` },
                        { label: 'Net Margin', value: `${stats.net_margin_pct.toFixed(2)}%` },
                        { label: 'Expense Ratio', value: `${stats.expense_ratio_pct.toFixed(2)}%` },
                        { label: 'Break-even Revenue', value: `TZS ${Math.round(stats.break_even_revenue).toLocaleString()}` },
                        { label: 'Pending Expenses', value: `TZS ${Math.round(stats.pending_expenses).toLocaleString()}` },
                     ].map((r) => (
                        <div key={r.label} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                           <span className="text-xs font-bold text-slate-500">{r.label}</span>
                           <span className="text-xs font-black text-slate-900">{r.value}</span>
                        </div>
                     ))}
                  </CardContent>
               </Card>

               <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-bold text-slate-900">Payment Method Mix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     {paymentBreakdown.length === 0 && <p className="text-xs text-slate-400 italic">No payment data</p>}
                     {paymentBreakdown.map((row) => {
                        const pct = total_sales > 0 ? (Number(row.total_amount) / total_sales) * 100 : 0;
                        return (
                           <div key={row.payment_method}>
                              <div className="flex justify-between mb-1">
                                 <span className="text-xs font-bold text-slate-700">{row.payment_method}</span>
                                 <span className="text-[11px] font-black text-slate-900">{pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                              </div>
                           </div>
                        );
                     })}
                  </CardContent>
               </Card>

               <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-bold text-slate-900">Expense Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     {expenseCategories.length === 0 && <p className="text-xs text-slate-400 italic">No approved expenses in range</p>}
                     {expenseCategories.slice(0, 6).map((row) => {
                        const pct = total_expenses > 0 ? (Number(row.total_amount) / total_expenses) * 100 : 0;
                        return (
                           <div key={row.category} className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[60%]">{row.category}</span>
                              <span className="text-[11px] font-black text-rose-600">TZS {Math.round(Number(row.total_amount)).toLocaleString()} ({pct.toFixed(1)}%)</span>
                           </div>
                        );
                     })}
                  </CardContent>
               </Card>
            </div>

            {/* Daily Net Trend Snapshot */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">Daily P&L Trend</CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-500">Revenue, expenses and net movement by day</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead className="text-[10px] font-black uppercase text-slate-400">Date</TableHead>
                           <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Revenue</TableHead>
                           <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Gross Profit</TableHead>
                           <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Expenses</TableHead>
                           <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Net</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {profitTrend.slice(-14).reverse().map((row) => (
                           <TableRow key={row.day}>
                              <TableCell className="text-xs font-bold text-slate-700">{row.day}</TableCell>
                              <TableCell className="text-xs font-black text-right text-slate-900">{Math.round(row.revenue).toLocaleString()}</TableCell>
                              <TableCell className="text-xs font-black text-right text-emerald-600">{Math.round(row.gross_profit).toLocaleString()}</TableCell>
                              <TableCell className="text-xs font-black text-right text-rose-600">{Math.round(row.expenses).toLocaleString()}</TableCell>
                              <TableCell className={`text-xs font-black text-right ${row.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {Math.round(row.net_profit).toLocaleString()}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Real-time Ledger */}
           <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
                 <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">Audit Ledger</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-slate-500 mt-0.5">Chronological feed of revenue and operational outflows</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                          placeholder="Search Audit Ledger..." 
                          className="pl-9 h-10 w-[240px] bg-white border-slate-200 font-bold text-xs shadow-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-slate-50/30">
                       <TableRow>
                          <TableHead className="py-4 pl-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</TableHead>
                          <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</TableHead>
                          <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Amount (TZS)</TableHead>
                          <TableHead className="py-4 pr-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Reference</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {filteredTransactions?.map((t, idx) => (
                          <TableRow key={t.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                             <TableCell className="py-4 pl-6">
                                <div>
                                   <p className="text-xs font-bold text-slate-900 lowercase capitalize">{t.description}</p>
                                   <p className="text-[10px] text-slate-500 mt-1 font-medium italic">{new Date(t.date).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                             </TableCell>
                             <TableCell className="py-4">
                                <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-tighter px-2 h-5 border-none ${t.type === 'Sales' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                   {t.type}
                                </Badge>
                             </TableCell>
                             <TableCell className={`py-4 text-right font-black text-xs ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.amount >= 0 ? '' : '-'}{(Math.abs(t.amount) || 0).toLocaleString()}
                             </TableCell>
                             <TableCell className="py-4 pr-6 text-center">
                                <p className="text-[10px] font-bold text-slate-400">#TRX-{t.id}</p>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
                 {!filteredTransactions?.length && (
                    <div className="py-20 text-center opacity-40">
                       <p className="text-xs font-bold text-slate-500 italic">No financial movements identified in this scope</p>
                    </div>
                 )}
              </CardContent>
           </Card>

           {/* Profitability Leaderboard */}
           <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                 <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                    <CardTitle className="text-xs font-bold text-slate-900 tracking-widest">Top Profit Generators</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    <div className="space-y-5">
                       {topProducts?.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                             <div className="flex items-center gap-3">
                                <div className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-100 rounded text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                   0{idx + 1}
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-xs font-bold text-slate-900 truncate w-32 lowercase capitalize">{p.product_name}</p>
                                   <p className="text-[10px] text-emerald-600 font-bold tracking-tight">Net: TZS {(p.total_profit || 0).toLocaleString()}</p>
                                </div>
                             </div>
                             <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                       ))}
                       {!topProducts?.length && (
                          <p className="text-[10px] text-slate-400 italic text-center py-6">Insufficient data for leaderboards</p>
                       )}
                    </div>
                 </CardContent>
              </Card>

              {/* Financial Health Summary */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-800 text-white overflow-hidden">
                 <CardContent className="p-6">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-100 mb-6">Health Audit Summary</p>
                    <div className="space-y-4">
                       <div className="flex justify-between items-end border-b border-white/10 pb-3">
                          <span className="text-[10px] font-bold text-indigo-100">Solvency Index</span>
                          <span className="text-sm font-black text-white">{(total_sales / (total_expenses || 1)).toFixed(2)}x</span>
                       </div>
                       <div className="flex justify-between items-end border-b border-white/10 pb-3">
                          <span className="text-[10px] font-bold text-indigo-100">EBITDA Margin</span>
                          <span className="text-sm font-black text-white">{(net_profit > 0 ? (net_profit / (total_sales || 1)) * 100 : 0).toFixed(1)}%</span>
                       </div>
                       <Link href="/report_sales" className="block pt-2">
                          <Button className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-black text-[10px] h-9 gap-2 shadow-none">
                             View Operational Intelligence <ArrowUpRight size={14} />
                          </Button>
                       </Link>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>

      </div>
    </AppLayout>
  );
}
