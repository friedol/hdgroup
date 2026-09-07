import { Head, Link, router } from '@inertiajs/react';
import { 
  Edit, 
  ArrowLeft, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  History as HistoryIcon, 
  CreditCard, 
  ShoppingBag, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  ExternalLink,
  ChevronRight,
  Package
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

interface Customer {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_spent?: number;
  outstanding_balance?: number;
  orders?: Array<{
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    source?: string;
    branch_name?: string;
  }>;
  batches?: Array<{
    id: number;
    batch_number: string;
    status: string;
    stage: string;
    produced_kg: number;
    created_at: string;
    branch_name?: string;
  }>;
}

interface ShowCustomerProps {
  customer: Customer;
}

export default function ShowCustomer({ customer }: ShowCustomerProps) {
  const [deleting, setDeleting] = useState(false);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'CRM', href: '#' },
    { title: 'Customers', href: '/customers' },
    { title: customer.customer_name, href: '#' }
  ];

  const handleDelete = () => {
    if (confirm('Are you sure you want to permanently delete this customer account? This cannot be undone.')) {
      setDeleting(true);
      router.delete(`/customers/${customer.id}`, {
        onFinish: () => setDeleting(false)
      });
    }
  };

  const initials = customer.customer_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase(); // Initials usually stay uppercase

  const formattedJoinDate = new Date(customer.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const availableCredit = customer.credit_limit - (customer.outstanding_balance || 0);
  const creditUsagePercent = customer.credit_limit > 0 
    ? ((customer.outstanding_balance || 0) / customer.credit_limit) * 100 
    : 0;

  const profileKpis = [
    {
      title: 'Purchases',
      value: `${customer.total_orders || 0} Orders`,
      subtitle: `Spent: ${(customer.total_spent || 0).toLocaleString()} TZS`,
      icon: ShoppingBag,
      chipLabel: 'Activity',
      cardClass: 'border-blue-200 bg-blue-50/30',
      iconClass: 'bg-blue-100 text-blue-600',
      chipClass: 'text-blue-700 bg-blue-100/70',
      valueClass: 'text-blue-700',
    },
    {
      title: 'Credit Limit',
      value: `${customer.credit_limit.toLocaleString()} TZS`,
      subtitle: `Used: ${creditUsagePercent.toFixed(1)}%`,
      icon: CreditCard,
      chipLabel: 'Credit',
      cardClass: 'border-indigo-200 bg-indigo-50/30',
      iconClass: 'bg-indigo-100 text-indigo-600',
      chipClass: 'text-indigo-700 bg-indigo-100/70',
      valueClass: 'text-indigo-700',
    },
    {
      title: 'Outstanding',
      value: `${(customer.outstanding_balance || 0).toLocaleString()} TZS`,
      subtitle: (customer.outstanding_balance || 0) > 0 ? 'Due soon' : 'Settled',
      icon: AlertTriangle,
      chipLabel: (customer.outstanding_balance || 0) > 0 ? 'Risk' : 'Stable',
      cardClass: (customer.outstanding_balance || 0) > 0 ? 'border-rose-200 bg-rose-50/30' : 'border-emerald-200 bg-emerald-50/30',
      iconClass: (customer.outstanding_balance || 0) > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600',
      chipClass: (customer.outstanding_balance || 0) > 0 ? 'text-rose-700 bg-rose-100/70' : 'text-emerald-700 bg-emerald-100/70',
      valueClass: (customer.outstanding_balance || 0) > 0 ? 'text-rose-700' : 'text-emerald-700',
    },
  ];

  return (
    <>
      <Head title={`${customer.customer_name} | Profile`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1650px] mx-auto space-y-8 pb-10 px-0">
          
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 -mx-4">
            <Link 
              href="/customers"
              className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center mr-3 group-hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Customer list</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                onClick={() => router.visit(`/customers/${customer.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2 text-slate-500" />
                Modify profile
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-10 px-4 active:scale-95 transition-all shadow-sm text-white flex items-center justify-center font-medium"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove account
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Essential Profile Card */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-900 to-blue-950 w-full" />
                <CardContent className="px-6 -mt-12 text-center pb-8">
                    <div className="relative inline-block">
                        <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-white">
                            <div className="h-full w-full rounded-xl bg-blue-950 flex items-center justify-center text-3xl font-semibold text-blue-100">
                                {initials}
                            </div>
                        </div>
                        <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white ${customer.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                    </div>
                    
                    <h1 className="mt-4 text-2xl font-medium text-slate-900 tracking-tight leading-tight">{customer.customer_name}</h1>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge variant={customer.is_active ? 'default' : 'secondary'} className={customer.is_active ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100 shadow-none text-[10px]' : 'text-[10px]'}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-500 tracking-tight leading-none">HD-{customer.id}</span>
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
                            <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm border border-slate-100">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="ml-3 text-left">
                                <p className="text-[10px] font-medium text-slate-400 leading-none">Email</p>
                                <a href={`mailto:${customer.customer_email}`} className="text-sm font-semibold text-slate-700 truncate block mt-0.5">{customer.customer_email}</a>
                            </div>
                        </div>
                        <div className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
                           <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-slate-400 group-hover:text-amber-500 shadow-sm border border-slate-100">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div className="ml-3 text-left">
                                <p className="text-[10px] font-medium text-slate-400 leading-none">Phone</p>
                                <a href={`tel:${customer.customer_phone}`} className="text-sm font-semibold text-slate-700 block mt-0.5">{customer.customer_phone}</a>
                            </div>
                        </div>
                        <div className="flex items-start p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group text-left">
                           <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm border border-slate-100 flex-shrink-0">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                                <p className="text-[10px] font-medium text-slate-400 leading-none">Address</p>
                                <p className="text-sm font-medium text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{customer.customer_address || 'No address.'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-medium text-slate-900">Timeline</h3>
                </div>
                <div className="space-y-4">
                    <div className="relative pl-6 pb-4 border-l-2 border-slate-100">
                        <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                        <p className="text-xs font-medium text-slate-900 leading-none">Joined</p>
                        <p className="text-[11px] text-slate-500 mt-1">{formattedJoinDate}</p>
                    </div>
                    <div className="relative pl-6">
                        <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-slate-200" />
                        <p className="text-xs font-medium text-slate-400 leading-none italic tracking-wider">Full history coming soon</p>
                    </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Dynamic Data & Analytics */}
            <div className="lg:col-span-8 space-y-8">
              
                {/* Financial Dashboard Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {profileKpis.map((kpi) => {
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
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-2 tracking-wide">{kpi.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{kpi.subtitle}</p>
                    </CardContent>
                  </Card>
                  );
                })}
                </div>

              {/* Tabbed Interface */}
              <Tabs defaultValue="orders" className="w-full">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 inline-flex mb-6">
                    <TabsList className="bg-transparent border-none p-0 flex space-x-1">
                        <TabsTrigger value="orders" className="rounded-lg px-6 py-2 h-9 text-xs font-medium data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            Sales
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="rounded-lg px-6 py-2 h-9 text-xs font-medium data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            Movement
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-lg px-6 py-2 h-9 text-xs font-medium data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            Security
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="orders" className="mt-0 focus-visible:ring-0">
                  <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                        <CardTitle className="text-sm font-medium text-slate-900 flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                            History
                        </CardTitle>
                        <span className="text-xs text-slate-400 font-medium tracking-tight">Total {customer.orders?.length || 0} records</span>
                    </CardHeader>
                    <CardContent className="p-0">
                        {customer.orders && customer.orders.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {customer.orders.map(order => (
                            <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-white border border-slate-100">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900">{order.order_number}</p>
                                            <Badge variant="outline" className="text-[9px] h-4 leading-none tracking-tighter border-slate-200 uppercase">
                                                {order.status}
                                            </Badge>
                                            {order.source && (
                                                <Badge className="text-[9px] h-4 bg-slate-100 text-slate-600 border-slate-200 shadow-none uppercase">
                                                    {order.source}
                                                </Badge>
                                            )}
                                            {order.branch_name && (
                                                <Badge className="text-[9px] h-4 bg-blue-50 text-blue-600 border-blue-100 shadow-none uppercase">
                                                    {order.branch_name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 font-medium">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                            <span>•</span>
                                            <span>
                                                {order.source === 'POS' && 'System invoice'}
                                                {order.source === 'Online' && 'Online store'}
                                                {order.source === 'Legacy' && 'Legacy record'}
                                                {!['POS', 'Online', 'Legacy'].includes(order.source || '') && 'Transaction'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <p className="font-medium text-slate-900 text-base">{Number(order.total_amount || 0).toLocaleString()}</p>
                                        <p className="text-[10px] font-medium text-slate-400 leading-none mt-1">TZS</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>
                        ) : (
                        <div className="p-10 text-center">
                            <ShoppingBag className="h-12 w-12 text-slate-100 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">No order artifacts recorded for this profile.</p>
                        </div>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <Card className="border-none shadow-sm bg-white p-8 text-center">
                    <HistoryIcon className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-base font-medium text-slate-900 mb-1 tracking-tight">Audit log system</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">Movement and logs related to account credits or sensitive updates will appear here.</p>
                  </Card>
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0">
                  <Card className="border-none shadow-sm bg-white p-8 text-center border-t-4 border-indigo-500">
                    <CardTitle className="text-lg font-medium text-slate-900 mb-4">Portal security</CardTitle>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">This customer account holds sensitive credit information. Ensure all contact data is verified before performing updates.</p>
                    <div className="flex flex-wrap justify-center gap-3">
                         <Link href={`/customers/${customer.id}/edit`}>
                             <Button variant="outline" className="h-10 text-xs font-medium tracking-widest border-slate-200 shadow-none">Reset customer password</Button>
                         </Link>
                         <Link href={`/customers/${customer.id}/edit`}>
                             <Button variant="outline" className="h-10 text-xs font-medium tracking-widest border-slate-200 shadow-none">Manage credentials</Button>
                         </Link>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
