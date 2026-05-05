import { Head, Link } from "@inertiajs/react";
import { 
  Factory, 
  Plus, 
  Search, 
  Eye, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Activity, 
  TrendingUp, 
  Layers, 
  Zap, 
  History,
  Gauge
} from "lucide-react";
import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";

const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899'];

interface ProductionProps {
  ordersCount: {
    total: number;
    pending: number;
    completed: number;
    total_produced: number;
    total_revenue: number;
    total_cost: number;
  };
  finishedGoodsValue: number;
  rawMaterialsValue: number;
  totalRawMaterialMetres: number;
  trends: {
    labels: string[];
    production: number[];
    revenue: number[];
    cost: number[];
  };
  productDistribution: any[];
  statusDistribution: any[];
  recentJobs: any[];
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Manufacturing Overview", href: "#" },
];

export default function ProductionPage({
  ordersCount,
  finishedGoodsValue,
  rawMaterialsValue,
  totalRawMaterialMetres,
  trends,
  productDistribution,
  statusDistribution,
  recentJobs
}: ProductionProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Transform trends for charts
  const performanceData = trends.labels.map((label, idx) => ({
    name: label,
    bags: trends.production[idx],
    revenue: trends.revenue[idx],
    cost: trends.cost[idx],
  }));

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'in_progress':
      case 'approved': return <Badge className="bg-amber-50 text-amber-700 border-amber-100 rounded-lg font-bold"><Activity className="h-3 w-3 mr-1" /> Processing</Badge>;
      default: return <Badge variant="secondary" className="rounded-lg">{status}</Badge>;
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Production Overview" />
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Factory className="h-6 w-6 text-amber-600" />
              Production Overview
            </h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Link href="/production/roll-based">
               <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg px-4 md:px-6 shadow-lg shadow-amber-200 transition-all active:scale-95 text-xs md:text-sm">
                 <Zap className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Start Production</span><span className="md:hidden">Start</span>
               </Button>
             </Link>
          </div>
        </div>

        {/* Top Level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="p-3 md:p-6 border-amber-200 bg-amber-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm"><Layers className="h-4 w-4 md:h-5 md:w-5 text-amber-600" /></div>
              <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold bg-white/50 px-1 md:px-2">TOTAL</Badge>
            </div>
            <p className="text-xl md:text-3xl font-black text-slate-900 tabular-nums">{(ordersCount.total_produced || 0).toLocaleString()}</p>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 truncate">Total units branch</p>
          </Card>

          <Card className="p-3 md:p-6 border-amber-200 bg-amber-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm"><TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-amber-600" /></div>
              <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold bg-white/50 px-1 md:px-2">VALUE</Badge>
            </div>
            <p className="text-xl md:text-3xl font-black text-amber-600 tabular-nums">{(finishedGoodsValue || 0).toLocaleString()}</p>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 truncate">Market Value (TZS)</p>
          </Card>

          <Card className="p-3 md:p-6 border-amber-200 bg-amber-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm"><Settings className="h-4 w-4 md:h-5 md:w-5 text-amber-600" /></div>
              <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold bg-white/50 px-1 md:px-2">STOCK</Badge>
            </div>
            <p className="text-xl md:text-3xl font-black text-slate-900 tabular-nums">{(totalRawMaterialMetres || 0).toLocaleString()}</p>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 truncate">Available Metres</p>
          </Card>

          <Card className="p-3 md:p-6 border-amber-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="bg-amber-50 p-1.5 md:p-2 rounded-lg"><Zap className="h-4 w-4 md:h-5 md:w-5 text-amber-600" /></div>
              <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold px-1 md:px-2">PROFIT</Badge>
            </div>
            <p className="text-xl md:text-3xl font-black text-amber-600 tabular-nums">
              {((ordersCount.total_revenue - ordersCount.total_cost) || 0).toLocaleString()}
            </p>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 truncate">Net Profit (Est.)</p>
          </Card>
        </div>

        {/* Charts & Analytical Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          
          <Card className="lg:col-span-2 p-4 md:p-6 border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Production Output Trend</h3>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500"></div><span className="text-[10px] font-bold text-slate-400">BAGS</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-400">REVENUE</span></div>
              </div>
            </div>
            <div className="h-[250px] md:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorBags" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} 
                    interval={5}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="bags" fill="url(#colorBags)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 md:p-6 border-slate-200 shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Product Mix</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Distribution by manufactured item</p>
            <div className="h-[220px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productDistribution}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {productDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 600, paddingTop: '20px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>

        {/* Activity & Operational Data */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
           <Card className="lg:col-span-3 p-0 border-slate-200 shadow-sm bg-white overflow-hidden">
             <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-3">
               <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <History className="h-4 w-4 text-slate-400" />
                 Recent Manufacturing Batches
               </h3>
               <Link href="/production-orders-new" className="text-xs font-bold text-amber-600 hover:text-amber-700">View History</Link>
             </div>

             <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-white border-b border-slate-100">
                     <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batch ID</th>
                     <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Produced</th>
                     <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll Source</th>
                     <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yield</th>
                     <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {recentJobs.length > 0 ? recentJobs.map((job) => (
                     <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 font-black text-amber-600 text-[11px] tracking-tight">{job.order_number}</td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-900">{job.product?.product_name || 'Production Batch'}</span>
                           <span className="text-[10px] text-slate-400">{job.store?.store_name || 'Main store'}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">{job.roll?.name || 'Manual'}</td>
                       <td className="px-6 py-4 text-right">
                         <span className="text-xs font-black text-slate-900">{(job.bags_produced || 0).toLocaleString()} <span className="text-[9px] text-slate-400">PCS</span></span>
                       </td>
                       <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                     </tr>
                   )) : (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-bold italic">No recent activity detected</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>

             <div className="md:hidden divide-y divide-slate-100">
               {recentJobs.length > 0 ? recentJobs.map((job) => (
                 <div key={job.id} className="p-4 space-y-2">
                   <div className="flex items-start justify-between gap-3">
                     <div>
                       <p className="text-[11px] font-black text-amber-600 tracking-tight">{job.order_number}</p>
                       <p className="text-sm font-bold text-slate-900 mt-1">{job.product?.product_name || 'Production Batch'}</p>
                       <p className="text-[10px] text-slate-400 mt-0.5">{job.store?.store_name || 'Main store'}</p>
                     </div>
                     {getStatusBadge(job.status)}
                   </div>

                   <div className="grid grid-cols-2 gap-2 text-[11px]">
                     <div>
                       <p className="text-slate-400 font-semibold">Roll Source</p>
                       <p className="text-slate-700 font-bold uppercase">{job.roll?.name || 'Manual'}</p>
                     </div>
                     <div>
                       <p className="text-slate-400 font-semibold">Yield</p>
                       <p className="text-slate-900 font-black">{(job.bags_produced || 0).toLocaleString()} <span className="text-[9px] text-slate-400">PCS</span></p>
                     </div>
                   </div>
                 </div>
               )) : (
                 <div className="px-4 py-12 text-center text-slate-400 text-xs font-bold italic">No recent activity detected</div>
               )}
             </div>
           </Card>

           <div className="space-y-6">
              <Card className="p-4 md:p-6 border-slate-200 shadow-sm bg-white">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Status Distribution</h3>
                <div className="space-y-4">
                   {statusDistribution.map((stat, idx) => (
                     <div key={idx} className="space-y-1.5">
                       <div className="flex justify-between text-[11px] font-bold">
                         <span className="text-slate-500 uppercase tracking-widest">{stat.name}</span>
                         <span className="text-slate-900 tabular-nums">{stat.value}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${stat.name === 'Completed' ? 'bg-emerald-500' : stat.name === 'Draft' ? 'bg-slate-300' : 'bg-amber-500'}`} 
                           style={{width: `${Math.min(100, (stat.value / ordersCount.total) * 100)}%`}}
                         ></div>
                       </div>
                     </div>
                   ))}
                </div>
              </Card>

              <Card className="p-4 md:p-6 border-amber-500 bg-amber-600 text-white shadow-xl shadow-amber-100">
                 <div className="flex items-center gap-2 mb-4">
                   <Gauge className="h-5 w-5 text-amber-400" />
                   <h3 className="text-sm font-bold">Yield Performance</h3>
                 </div>
                 <p className="text-2xl font-black mb-1">
                   {ordersCount.total > 0 ? ((ordersCount.completed / ordersCount.total) * 100).toFixed(1) : 0}%
                 </p>
                 <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Order Completion Efficiency</p>
              </Card>
           </div>
        </div>

      </div>
    </AppLayout>
  );
}
