import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, TrendingUp, Package, RefreshCw, Building2 } from "lucide-react";

interface Branch { id: number; name: string; }

interface SellerRow {
  ranking: number;
  staff_id: number;
  staff_name: string;
  total_sales: number;
  total_units_sold: number;
  total_orders: number;
  avg_order_value: number;
  performance_score: number;
}

interface ManagerRow {
  ranking: number;
  branch_id: number;
  branch_name: string;
  manager_name: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  expense_ratio: number;
  performance_score: number;
}

interface StorekeeperRow {
  ranking: number;
  staff_id: number;
  staff_name: string;
  inventory_accuracy: number;
  adjustment_frequency: number;
  positive_adjustments: number;
  negative_adjustments: number;
  performance_score: number;
}

const breadcrumbs = [
  { title: "Reports", href: "/report_sales" },
  { title: "Staff Performance", href: "/staff-performance" },
];

function fmt(n: number) {
  return "TZS " + Number(n).toLocaleString("en-TZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ScoreBadge({ score }: { score: number }) {
  const s = Math.round(score ?? 0);
  const color = s >= 80 ? "bg-emerald-100 text-emerald-700" : s >= 60 ? "bg-blue-100 text-blue-700" : s >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
  return <Badge className={`${color} text-[10px] font-bold`}>{s}</Badge>;
}

function RankBadge({ rank }: { rank: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  if (rank <= 3) return <span className="text-lg">{medals[rank - 1]}</span>;
  return <span className="text-xs font-bold text-slate-500">#{rank}</span>;
}

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

export default function StaffPerformanceDashboard({ branches }: { branches: Branch[] }) {
  const [period, setPeriod] = useState("month");
  const [branchId, setBranchId] = useState("all");
  const [activeTab, setActiveTab] = useState("sellers");
  const [loading, setLoading] = useState(false);

  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [storekeepers, setStorekeepers] = useState<StorekeeperRow[]>([]);

  const params = useCallback(() => ({
    period,
    branch_id: branchId === "all" ? undefined : branchId,
  }), [period, branchId]);

  const fetchTab = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      if (tab === "sellers") {
        const res = await axios.get("/staff-performance/sellers", { params: params() });
        setSellers(res.data);
      } else if (tab === "managers") {
        const res = await axios.get("/staff-performance/managers", { params: params() });
        setManagers(res.data);
      } else if (tab === "storekeepers") {
        const res = await axios.get("/staff-performance/storekeepers", { params: params() });
        setStorekeepers(res.data);
      }
    } catch {
      // silently ignore if endpoint returns no data
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, period, branchId, fetchTab]);

  const handleRefresh = () => fetchTab(activeTab);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Staff Performance" />
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Staff Performance
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Rankings and KPIs for sellers, branch managers, and storekeepers.</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <Select value={period} onValueChange={v => setPeriod(v)}>
              <SelectTrigger className="h-9 w-40 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {branches?.length > 0 && (
              <Select value={branchId} onValueChange={v => setBranchId(v)}>
                <SelectTrigger className="h-9 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full overflow-x-auto flex">
            <TabsTrigger value="sellers" className="rounded-lg text-xs font-semibold uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Sellers
            </TabsTrigger>
            <TabsTrigger value="managers" className="rounded-lg text-xs font-semibold uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Building2 className="h-3.5 w-3.5 mr-1.5" /> Branch Managers
            </TabsTrigger>
            <TabsTrigger value="storekeepers" className="rounded-lg text-xs font-semibold uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Package className="h-3.5 w-3.5 mr-1.5" /> Storekeepers
            </TabsTrigger>
          </TabsList>

          {/* Sellers Tab */}
          <TabsContent value="sellers" className="mt-4">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3 border-b border-slate-100 px-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Sales Rankings
                  {loading && <span className="text-xs text-slate-400 font-normal ml-2">Loading...</span>}
                </CardTitle>
              </CardHeader>
              <div>
                {sellers.length === 0 && !loading ? (
                  <EmptyState icon={<TrendingUp />} message="No sales data for this period" />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-5 py-3 text-left w-12">Rank</th>
                            <th className="px-5 py-3 text-left">Staff</th>
                            <th className="px-5 py-3 text-right">Revenue</th>
                            <th className="px-5 py-3 text-right">Orders</th>
                            <th className="px-5 py-3 text-right">Avg Order</th>
                            <th className="px-5 py-3 text-right">Units</th>
                            <th className="px-5 py-3 text-center">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sellers.map(row => (
                            <tr key={row.staff_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4 text-center"><RankBadge rank={row.ranking} /></td>
                              <td className="px-5 py-4 font-semibold text-slate-900">{row.staff_name}</td>
                              <td className="px-5 py-4 text-right font-semibold text-emerald-600">{fmt(row.total_sales)}</td>
                              <td className="px-5 py-4 text-right text-slate-700">{row.total_orders.toLocaleString()}</td>
                              <td className="px-5 py-4 text-right text-slate-500">{fmt(row.avg_order_value)}</td>
                              <td className="px-5 py-4 text-right text-slate-500">{row.total_units_sold.toLocaleString()}</td>
                              <td className="px-5 py-4 text-center"><ScoreBadge score={row.performance_score} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-slate-100">
                      {sellers.map(row => (
                        <div key={row.staff_id} className="p-4 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <RankBadge rank={row.ranking} />
                              <p className="font-semibold text-slate-900 text-sm">{row.staff_name}</p>
                            </div>
                            <ScoreBadge score={row.performance_score} />
                          </div>
                          <p className="text-base font-bold text-emerald-600">{fmt(row.total_sales)}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            <span>{row.total_orders} orders</span>
                            <span>Avg: {fmt(row.avg_order_value)}</span>
                            <span>{row.total_units_sold} units</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Branch Managers Tab */}
          <TabsContent value="managers" className="mt-4">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3 border-b border-slate-100 px-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" /> Branch Manager Rankings
                  {loading && <span className="text-xs text-slate-400 font-normal ml-2">Loading...</span>}
                </CardTitle>
              </CardHeader>
              <div>
                {managers.length === 0 && !loading ? (
                  <EmptyState icon={<Building2 />} message="No branch data for this period" />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-5 py-3 text-left w-12">Rank</th>
                            <th className="px-5 py-3 text-left">Branch / Manager</th>
                            <th className="px-5 py-3 text-right">Revenue</th>
                            <th className="px-5 py-3 text-right">Expenses</th>
                            <th className="px-5 py-3 text-right">Net Profit</th>
                            <th className="px-5 py-3 text-right">Expense %</th>
                            <th className="px-5 py-3 text-center">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {managers.map(row => (
                            <tr key={row.branch_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4 text-center"><RankBadge rank={row.ranking} /></td>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-900">{row.branch_name}</p>
                                <p className="text-[10px] text-slate-400">{row.manager_name}</p>
                              </td>
                              <td className="px-5 py-4 text-right font-semibold text-emerald-600">{fmt(row.revenue)}</td>
                              <td className="px-5 py-4 text-right text-red-500">{fmt(row.expenses)}</td>
                              <td className={`px-5 py-4 text-right font-semibold ${row.net_profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(row.net_profit)}</td>
                              <td className="px-5 py-4 text-right text-slate-500">{Math.round(row.expense_ratio)}%</td>
                              <td className="px-5 py-4 text-center"><ScoreBadge score={row.performance_score} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-slate-100">
                      {managers.map(row => (
                        <div key={row.branch_id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <RankBadge rank={row.ranking} />
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{row.branch_name}</p>
                                <p className="text-[10px] text-slate-400">{row.manager_name}</p>
                              </div>
                            </div>
                            <ScoreBadge score={row.performance_score} />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Revenue</p>
                              <p className="font-semibold text-emerald-600">{fmt(row.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Expenses</p>
                              <p className="font-semibold text-red-500">{fmt(row.expenses)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Net Profit</p>
                              <p className={`font-semibold ${row.net_profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(row.net_profit)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Storekeepers Tab */}
          <TabsContent value="storekeepers" className="mt-4">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3 border-b border-slate-100 px-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-violet-600" /> Storekeeper Performance
                  {loading && <span className="text-xs text-slate-400 font-normal ml-2">Loading...</span>}
                </CardTitle>
              </CardHeader>
              <div>
                {storekeepers.length === 0 && !loading ? (
                  <EmptyState icon={<Package />} message="No storekeeper activity for this period" />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-5 py-3 text-left w-12">Rank</th>
                            <th className="px-5 py-3 text-left">Staff</th>
                            <th className="px-5 py-3 text-right">Accuracy</th>
                            <th className="px-5 py-3 text-right">Adjustments</th>
                            <th className="px-5 py-3 text-right">+ Adj</th>
                            <th className="px-5 py-3 text-right">− Adj</th>
                            <th className="px-5 py-3 text-center">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {storekeepers.map(row => (
                            <tr key={row.staff_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4 text-center"><RankBadge rank={row.ranking} /></td>
                              <td className="px-5 py-4 font-semibold text-slate-900">{row.staff_name}</td>
                              <td className="px-5 py-4 text-right font-semibold text-blue-600">{Math.round(row.inventory_accuracy ?? 0)}%</td>
                              <td className="px-5 py-4 text-right text-slate-700">{row.adjustment_frequency}</td>
                              <td className="px-5 py-4 text-right text-emerald-500">{row.positive_adjustments}</td>
                              <td className="px-5 py-4 text-right text-red-400">{row.negative_adjustments}</td>
                              <td className="px-5 py-4 text-center"><ScoreBadge score={row.performance_score} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-slate-100">
                      {storekeepers.map(row => (
                        <div key={row.staff_id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <RankBadge rank={row.ranking} />
                              <p className="font-semibold text-slate-900 text-sm">{row.staff_name}</p>
                            </div>
                            <ScoreBadge score={row.performance_score} />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Accuracy</p>
                              <p className="font-semibold text-blue-600">{Math.round(row.inventory_accuracy ?? 0)}%</p>
                            </div>
                            <div>
                              <p className="text-slate-400">+Adj</p>
                              <p className="font-semibold text-emerald-500">{row.positive_adjustments}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">−Adj</p>
                              <p className="font-semibold text-red-400">{row.negative_adjustments}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="h-10 w-10 mb-3 opacity-30">{icon}</div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
