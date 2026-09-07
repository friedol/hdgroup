import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Mail, 
  History, 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock, 
  BadgeCheck, 
  FileText,
  RefreshCw,
  Plus,
  Package,
  Layers,
  ShoppingBag,
  Info
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FollowUpLog {
  id: number;
  follow_up_date: string;
  action: string;
  notes: string;
  user: {
    staff_name: string;
  };
  created_at: string;
}

interface ProductAnalytic {
  id: number;
  product_id: number;
  product: {
    name: string;
  };
  avg_reorder_interval: number | null;
  last_purchase_date: string;
  next_expected_purchase_date: string | null;
  total_quantity_bought: number;
}

interface CategoryAnalytic {
  id: number;
  category_id: number;
  category: {
    name: string;
  };
  avg_reorder_interval: number | null;
  last_purchase_date: string;
  next_expected_purchase_date: string | null;
  total_quantity_bought: number;
}

interface Customer {
  id: number;
  customer_name: string;
  customer_phone: string;
  whatsapp_no: string;
  customer_email: string;
  company_name: string;
  total_orders: number;
  total_spent: number;
  avg_reorder_interval: number | null;
  last_order_date: string | null;
  next_expected_order_date: string | null;
  manual_follow_up_date: string | null;
  effective_follow_up_date: string | null;
  follow_up_status: string;
  status_color: string;
  priority_ranking: number;
  follow_up_logs: FollowUpLog[];
  product_analytics: ProductAnalytic[];
  category_analytics: CategoryAnalytic[];
}

interface Props {
  customer: Customer;
  recentSales: any[];
}

const breadcrumbs = [
  { title: "CRM", href: "#" },
  { title: "Data Center", href: "/customer-data-center" },
  { title: "Customer Insight", href: "#" },
];

export default function CustomerShow({ customer, recentSales }: Props) {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isManualDateOpen, setIsManualDateOpen] = useState(false);

  const { data, setData, post, processing, reset } = useForm({
    action: 'WhatsApp',
    notes: '',
    next_follow_up_date: '',
  });

  const { data: dateData, setData: setDateData, put, processing: dateProcessing } = useForm({
    manual_follow_up_date: customer.manual_follow_up_date || '',
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/customer-data-center/${customer.id}/follow-up`, {
      onSuccess: () => {
        toast.success("Follow-up logged successfully");
        setIsLogOpen(false);
        reset();
      }
    });
  };

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/customer-data-center/${customer.id}/follow-up-date`, {
      onSuccess: () => {
        toast.success("Next follow-up date scheduled");
        setIsManualDateOpen(false);
      }
    });
  };

  const handleRefresh = () => {
    router.post(`/customer-data-center/${customer.id}/refresh`, {}, {
      onSuccess: () => toast.success("Analytics refreshed"),
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-TZ').format(val || 0);
  };

  const detailKpis = [
    {
      title: 'Total Orders',
      value: (customer.total_orders || 0).toLocaleString(),
      icon: ShoppingBag,
      chipLabel: 'Volume',
      cardClass: 'border-blue-200 bg-blue-50/30',
      iconClass: 'bg-blue-100 text-blue-600',
      chipClass: 'text-blue-700 bg-blue-100/70',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Total Spent',
      value: `TZS ${formatCurrency(customer.total_spent || 0)}`,
      icon: TrendingUp,
      chipLabel: 'Revenue',
      cardClass: 'border-emerald-200 bg-emerald-50/30',
      iconClass: 'bg-emerald-100 text-emerald-600',
      chipClass: 'text-emerald-700 bg-emerald-100/70',
      valueClass: 'text-emerald-700',
    },
    {
      title: 'Avg Cycle',
      value: `${customer.avg_reorder_interval || '--'} Days`,
      icon: Clock,
      chipLabel: 'Frequency',
      cardClass: 'border-amber-200 bg-amber-50/30',
      iconClass: 'bg-amber-100 text-amber-600',
      chipClass: 'text-amber-700 bg-amber-100/70',
      valueClass: 'text-amber-700',
    },
    {
      title: 'Last Order',
      value: customer.last_order_date ? format(new Date(customer.last_order_date), 'MMM dd, yyyy') : 'N/A',
      icon: History,
      chipLabel: 'Recent',
      cardClass: 'border-slate-200 bg-slate-50/40',
      iconClass: 'bg-slate-100 text-slate-600',
      chipClass: 'text-slate-700 bg-slate-100/70',
      valueClass: 'text-slate-900',
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${customer.customer_name} - Intelligence`} />
      
      <div className="w-full space-y-6 pb-20">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/customer-data-center">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-medium text-slate-900 tracking-tight">{customer.customer_name}</h1>
                <Badge className={`bg-${customer.status_color}-100 text-${customer.status_color}-700 border-none px-2 py-0.5 font-medium uppercase text-[10px]`}>
                  {customer.follow_up_status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium">Customer Intelligence Profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleRefresh}>
               <RefreshCw className="w-4 h-4" /> Refresh ROI
             </Button>
             <Button 
                className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => window.open(`https://wa.me/${customer.whatsapp_no?.replace(/[^0-9]/g, '')}`)}
              >
                <MessageSquare className="w-4 h-4" /> Direct Contact
             </Button>
             <Button 
                className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setIsLogOpen(true)}
              >
                <Plus className="w-4 h-4" /> Log Result
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Analytics & Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {detailKpis.map((kpi) => {
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

            {/* Product & Category Intelligence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <CardTitle className="text-sm font-medium text-slate-700">Product Preferences</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50 text-sm">
                    {customer.product_analytics.length > 0 ? customer.product_analytics.map((p) => (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">{p.product.name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                             <span className="flex items-center gap-1 font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"><BadgeCheck className="w-3 h-3" /> {p.total_quantity_bought} Qty</span>
                             {p.avg_reorder_interval && <span className="font-medium">🔄 {p.avg_reorder_interval}d cycle</span>}
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-medium text-slate-400">Next Predicted</p>
                           <p className="text-xs font-medium text-blue-600">{p.next_expected_purchase_date || 'N/A'}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-xs italic">No product data analyzed</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <CardTitle className="text-sm font-medium text-slate-700">Category Loyalty</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50 text-sm">
                    {customer.category_analytics.length > 0 ? customer.category_analytics.map((c) => (
                      <div key={c.id} className="p-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">{c.category.name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                             <span className="flex items-center gap-1 font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{c.total_quantity_bought} Orders</span>
                             {c.avg_reorder_interval && <span className="font-medium">⏱️ {c.avg_reorder_interval}d average</span>}
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-medium text-slate-400">Retention</p>
                           <p className="text-xs font-medium text-emerald-600">Strong</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-xs italic">No category patterns found</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Follow-up Timeline */}
            <Card className="border shadow-none">
              <CardHeader className="py-4 px-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <CardTitle className="text-sm font-medium">Engagement Lifecycle</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 text-[11px] font-medium">View full history</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                  {customer.follow_up_logs.length > 0 ? customer.follow_up_logs.map((log) => (
                    <div key={log.id} className="relative flex items-start gap-6 group">
                      <div className={cn(
                        "absolute left-0 mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-md transition-all group-hover:scale-110",
                        log.action === 'WhatsApp' ? 'bg-emerald-500' : 'bg-blue-500'
                      )}>
                        {log.action === 'WhatsApp' ? <MessageSquare className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
                      </div>
                      <div className="ml-10 flex-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100 transition-all group-hover:border-slate-300 group-hover:bg-white group-hover:shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-900 tracking-tight">{log.action}</p>
                          <p className="text-[10px] font-medium text-slate-400 tabular-nums">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">"{log.notes}"</p>
                        <div className="mt-2 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                           Recorded by <span className="text-blue-600">{log.user?.staff_name}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center">
                       <p className="text-slate-400 text-xs italic">No follow-up activities recorded yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Prediction & High-level Stats */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Smart Prediction Card */}
            <Card className="border-none bg-slate-900 text-white shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Target className="w-32 h-32" />
               </div>
               <CardHeader className="relative z-10">
                  <Badge className="bg-blue-500/20 text-blue-400 border-none w-fit px-3 py-1 font-medium tracking-tight text-[10px] mb-2">Smart forecast</Badge>
                  <CardTitle className="text-lg">Predictive Analysis</CardTitle>
               </CardHeader>
               <CardContent className="relative z-10 space-y-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                     <p className="text-[10px] font-medium text-white/50 mb-1 tracking-tight">Next expected engagement</p>
                     <p className="text-2xl font-semibold text-blue-400">
                        {customer.effective_follow_up_date ? format(new Date(customer.effective_follow_up_date), 'MMMM dd, yyyy') : 'No data'}
                     </p>
                     <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">Optimized</Badge>
                        {customer.manual_follow_up_date && <Badge className="bg-amber-500/20 text-amber-400 text-[10px] font-medium underline cursor-help" title="Manually scheduled">Manual override</Badge>}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] font-medium text-white/50 mb-1">Priority rank</p>
                        <div className="flex items-end gap-1">
                           <span className="text-3xl font-semibold text-white">#{customer.priority_ranking}</span>
                           <span className="text-[10px] font-medium text-blue-400 mb-1">High value</span>
                        </div>
                     </div>
                     <div>
                        <p className="text-[10px] font-medium text-white/50 mb-1">Retention risk</p>
                        <div className="flex items-end gap-1">
                           <span className="text-3xl font-semibold text-white">Low</span>
                           <div className="h-2 w-10 bg-emerald-500 rounded-full mb-2"></div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                     <Button 
                       variant="ghost" 
                       className="w-full h-11 text-white hover:bg-white/5 font-medium text-[11px] border border-white/20 rounded-xl"
                       onClick={() => setIsManualDateOpen(true)}
                     >
                        <Calendar className="w-4 h-4 mr-2" /> Schedule manual date
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* Contact Details */}
            <Card className="border-none shadow-sm bg-white">
               <CardHeader className="py-4 border-b border-slate-50">
                  <CardTitle className="text-sm font-medium">Customer profile</CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Phone className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-medium text-slate-400 capitalize">Primary phone</p>
                        <p className="text-sm font-medium text-slate-800">{customer.customer_phone}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <MessageSquare className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-medium text-slate-400 capitalize">WhatsApp</p>
                        <p className="text-sm font-medium text-slate-800">{customer.whatsapp_no || 'N/A'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <Mail className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-medium text-slate-400 capitalize">Email address</p>
                        <p className="text-sm font-medium text-slate-800">{customer.customer_email || 'N/A'}</p>
                     </div>
                  </div>
                  {customer.company_name && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Company</p>
                        <p className="text-sm font-medium text-slate-800">{customer.company_name}</p>
                      </div>
                    </div>
                  )}
               </CardContent>
            </Card>

            {/* System Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
               <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">Intelligence Insights</span>
               </div>
               <p className="text-[11px] text-slate-600 leading-relaxed font-medium"> This customer's profile is generated based on {customer.total_orders} historical sales. Predictions improve with more engagement logs. Last calculated today.</p>
            </div>

          </div>

        </div>

      </div>

      {/* Log Activity Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleLogSubmit}>
            <DialogHeader>
              <DialogTitle>Log Activity Result</DialogTitle>
              <DialogDescription>
                Record the outcome of your latest contact with {customer.customer_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Contact Method</Label>
                <Select value={data.action} onValueChange={(val) => setData('action', val)}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp Message</SelectItem>
                    <SelectItem value="Phone Call">Direct Phone Call</SelectItem>
                    <SelectItem value="Email">Official Email</SelectItem>
                    <SelectItem value="In Person">Face to Face Meeting</SelectItem>
                    <SelectItem value="Other">Other Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conversation Summary</Label>
                <Textarea 
                  placeholder="What was discussed? Did they confirm an order? Are they still interested?" 
                  className="rounded-xl min-h-[100px]"
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Optionally Override Next Date</Label>
                <Input 
                   type="date"
                   className="rounded-xl h-10"
                   value={data.next_follow_up_date}
                   onChange={(e) => setData('next_follow_up_date', e.target.value)}
                />
                <p className="text-[10px] text-slate-500 italic">If the customer asked you to contact them on a specific date, set it here.</p>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={processing} type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 h-11 rounded-xl font-medium uppercase text-xs tracking-widest">
                Save Engagement Result
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Date Dialog */}
      <Dialog open={isManualDateOpen} onOpenChange={setIsManualDateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleDateSubmit}>
            <DialogHeader>
              <DialogTitle>Schedule Manual Follow-up</DialogTitle>
              <DialogDescription>
                Override the system's smart prediction with a manual contact date.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                 <Label>Select Follow-up Date</Label>
                 <Input 
                    type="date"
                    className="rounded-xl h-11"
                    value={dateData.manual_follow_up_date}
                    onChange={(e) => setDateData('manual_follow_up_date', e.target.value)}
                    required
                 />
               </div>
            </div>
            <DialogFooter>
               <Button disabled={dateProcessing} type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800 h-11 rounded-xl font-medium uppercase text-xs tracking-widest">
                  Update Schedule
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}
