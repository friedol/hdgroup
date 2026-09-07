import React, { useState } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter,
  RefreshCw,
  Phone,
  MessageSquare,
  Mail,
  MoreVertical,
  Target,
  BarChart3,
  Calendar,
  Search,
  Printer,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Briefcase,
  ExternalLink,
  Smartphone,
  History,
  Info
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Customer {
  id: number;
  customer_name: string;
  customer_phone: string;
  whatsapp_no: string;
  company_name: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  next_expected_order_date: string;
  manual_follow_up_date: string;
  effective_follow_up_date: string;
  follow_up_status: string;
  status_color: string;
  priority_ranking: number;
}

interface Stats {
  due_today: number;
  overdue: number;
  upcoming: number;
  total_customers: number;
}

interface Props {
  customers: {
    data: Customer[];
    links: any[];
    current_page: number;
  };
  stats: Stats;
  statusFilter: string;
}

const breadcrumbs = [
  { title: "CRM", href: "#" },
  { title: "Follow-up Center", href: "/customer-data-center" },
];

export default function FollowUpIndex({ customers, stats, statusFilter }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const crmKpis = [
    {
      title: 'Due Today',
      value: stats.due_today.toLocaleString(),
      icon: Clock,
      chipLabel: 'Priority',
      cardClass: 'border-amber-200 bg-amber-50/30',
      iconClass: 'bg-amber-100 text-amber-600',
      chipClass: 'text-amber-700 bg-amber-100/70',
      valueClass: 'text-amber-700',
    },
    {
      title: 'Overdue',
      value: stats.overdue.toLocaleString(),
      icon: TrendingDown,
      chipLabel: 'Urgent',
      cardClass: 'border-rose-200 bg-rose-50/30',
      iconClass: 'bg-rose-100 text-rose-600',
      chipClass: 'text-rose-700 bg-rose-100/70',
      valueClass: 'text-rose-700',
    },
    {
      title: 'Upcoming (3d)',
      value: stats.upcoming.toLocaleString(),
      icon: Calendar,
      chipLabel: 'Pipeline',
      cardClass: 'border-blue-200 bg-blue-50/30',
      iconClass: 'bg-blue-100 text-blue-600',
      chipClass: 'text-blue-700 bg-blue-100/70',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Total Managed',
      value: stats.total_customers.toLocaleString(),
      icon: Target,
      chipLabel: 'CRM',
      cardClass: 'border-slate-200 bg-slate-50/40',
      iconClass: 'bg-slate-100 text-slate-600',
      chipClass: 'text-slate-700 bg-slate-100/70',
      valueClass: 'text-slate-900',
    },
  ];

  const handleRefresh = (customerId?: number) => {
    setIsRefreshing(true);
    const url = customerId 
      ? `/customer-data-center/${customerId}/refresh` 
      : `/customer-data-center/refresh-all`;
      
    router.post(url, {}, {
      onSuccess: () => {
        setIsRefreshing(false);
        toast.success("Intelligence data updated successfully");
      },
      onFinish: () => setIsRefreshing(false)
    });
  };

  const handleFilterChange = (status: string) => {
    router.get('/customer-data-center', { status }, { preserveState: true });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-TZ').format(val || 0);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Follow-up Center" />
      
      <div className="w-full space-y-6 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-1xl font-bold text-slate-900 tracking-tight">Customer Follow-up Center</h1>

          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 gap-2 border-slate-200 bg-white" onClick={() => handleRefresh()} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh All
            </Button>
            
            <Link href="/customers">
              <Button className="h-10 gap-2 bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md">
                <Users className="w-4 h-4" /> CRM Directory
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {crmKpis.map((kpi) => {
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

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1 bg-white border border-slate-100 p-1 rounded-xl w-fit shadow-sm">
            {[
              { id: 'due', label: 'Priority Hub' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'active', label: 'Healthy Flow' },
              { id: 'new', label: 'Initial List' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-sm w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
            <Input 
              placeholder="Search customers..." 
              className="pl-9 bg-white h-11 border-slate-200 rounded-xl shadow-sm focus-visible:ring-rose-500 focus-visible:border-rose-500" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        <Card className="border shadow-none overflow-hidden rounded-2xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 text-[11px]">Customer Insight</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 text-[11px] text-center">ROI Stats</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 text-[11px]">Expectation</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 text-[11px]">Value Index</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 text-[11px]">Intelligence</th>
                  <th className="text-right px-6 py-4 font-bold text-slate-500 text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.data.map((customer) => (
                  <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-xl shadow-sm border border-slate-200/50 group-hover:scale-110 transition-transform">
                          {customer.priority_ranking > 100 ? '⭐' : '👤'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{customer.customer_name}</p>
                          <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                            <Smartphone className="w-3 h-3 text-slate-400" /> {customer.customer_phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="inline-flex flex-col items-center">
                          <p className="text-lg font-black text-slate-700 leading-none">{customer.total_orders}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">Orders</p>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <History className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-slate-400 font-bold">Last:</span>
                          <span className="font-bold text-slate-700">{customer.last_order_date || '--'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <Target className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-slate-400 font-bold">Next:</span>
                          <span className={cn(
                             "font-bold",
                             customer.follow_up_status === 'Overdue' ? 'text-rose-600 underline decoration-rose-200' : 'text-slate-700'
                          )}>
                             {customer.effective_follow_up_date || 'TBD'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">TZS {formatCurrency(customer.total_spent)}</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5">Accumulated revenue</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                         <Badge 
                           className={`w-fit text-[9px] font-bold px-2 py-0.5 rounded-md border-none
                             ${customer.follow_up_status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 
                               customer.follow_up_status === 'Due Today' ? 'bg-amber-100 text-amber-700' : 
                               customer.follow_up_status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                               'bg-emerald-100 text-emerald-700'}
                           `}
                         >
                           {customer.follow_up_status}
                         </Badge>
                         <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                            <ArrowUpRight className="w-2.5 h-2.5 text-emerald-500" /> Rank #{customer.priority_ranking}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2.5 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors border border-transparent hover:border-emerald-100 shadow-none hover:shadow-sm"
                            onClick={() => window.open(`https://wa.me/${customer.whatsapp_no?.replace(/[^0-9]/g, '')}`)}
                            title="WhatsApp Contact"
                          >
                             <MessageSquare className="w-4.5 h-4.5" />
                          </button>
                          
                          <Link href={`/customer-data-center/${customer.id}`}>
                            <button className="h-10 px-4 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-all font-bold text-xs flex items-center gap-2 shadow-sm">
                               <Info className="w-3.5 h-3.5" /> Intelligence
                            </button>
                          </Link>
                       </div>
                    </td>
                  </tr>
                ))}
                {customers.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
                             <Users className="w-10 h-10 text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No customers synced for this filter</p>
                          <Button variant="outline" size="sm" onClick={() => handleRefresh()}>Force Analytics Sync</Button>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          <div className="bg-[#f8fafc] border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention Stable</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Prime</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-rose-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Factor High</span>
                </div>
             </div>
             
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Last update batch: {new Date().toLocaleTimeString()}
             </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
