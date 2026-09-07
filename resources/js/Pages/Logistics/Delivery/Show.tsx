import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, MapPin, Clock, User, Phone, DollarSign, Box } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';

interface Delivery {
  id: number;
  delivery_number: string;
  customer_name: string;
  phone: string;
  email: string;
  delivery_address: string;
  delivery_cost: number;
  delivery_discount: number;
  delivery_total: number;
  status: string;
  priority: string;
  payment_method: string;
  rating: number;
  feedback: string;
  delivery_person?: { name: string; phone: string };
  items: any[];
  created_at: string;
}

interface DeliveryShowProps {
  delivery: Delivery;
  tracking: any[];
}

export default function DeliveryShow({ delivery, tracking }: DeliveryShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Deliveries', href: '/deliveries' },
    { title: delivery.delivery_number, href: '#' }
  ];

  const [selectedTab, setSelectedTab] = useState('details');

  const getStatusColor = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase().replace('_', '-');
    const colors: Record<string, string> = {
      'pending': 'bg-slate-50 border border-slate-150 text-slate-500',
      'confirmed': 'bg-indigo-50 border border-indigo-100 text-indigo-700',
      'processing': 'bg-purple-50 border border-purple-100 text-purple-700',
      'assigned': 'bg-blue-50 border border-blue-100 text-blue-700',
      'picked-up': 'bg-cyan-50 border border-cyan-100 text-cyan-700',
      'in-transit': 'bg-amber-50 border border-amber-100 text-amber-700',
      'delivered': 'bg-emerald-50 border border-emerald-100 text-emerald-700',
      'failed': 'bg-rose-50 border border-rose-100 text-rose-700',
      'cancelled': 'bg-slate-100 border border-slate-200 text-slate-500',
    };
    return colors[normalizedStatus] || 'bg-slate-50 border border-slate-100 text-slate-705';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'assigned': 'Assigned to Driver',
      'picked-up': 'Picked Up',
      'in-transit': 'In Transit',
      'delivered': 'Delivered',
      'failed': 'Delivery Failed',
      'cancelled': 'Cancelled',
    };
    return labels[status] || status;
  };

  const totalItemsValue = delivery.items?.reduce((sum: number, item: any) => sum + item.total_price, 0) || 0;

  return (
    <>
      <Head title={delivery.delivery_number} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/deliveries" className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">{delivery.delivery_number}</h1>
                <p className="text-xs font-medium text-slate-500 mt-1.5">Delivery Details</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusColor(delivery.status)}`}>
                {getStatusLabel(delivery.status)}
              </span>
              {delivery.status === 'pending' && (
                <Link href={`/deliveries/${delivery.id}/edit`}>
                  <button className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center transition-all">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Tabs Menu */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-2">
              {[
                { key: 'details', label: 'Details' },
                { key: 'tracking', label: 'Tracking History' },
                { key: 'items', label: 'Items List' }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedTab(t.key)}
                  className={`rounded-lg text-xs font-semibold px-4 py-1.5 transition-all ${
                    selectedTab === t.key 
                      ? 'bg-white text-blue-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Details Tab */}
          {selectedTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Info */}
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4 text-xs font-semibold text-slate-655 text-slate-600">
                  <div className="flex items-start gap-3 border-b border-slate-50 pb-3">
                    <User className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-450 uppercase tracking-wider mb-0.5">Customer Name</p>
                      <p className="text-sm font-bold text-slate-900">{delivery.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-b border-slate-50 pb-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-450 uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="text-sm font-bold text-slate-900">{delivery.phone}</p>
                    </div>
                  </div>
                  {delivery.email && (
                    <div className="flex items-start gap-3 border-b border-slate-50 pb-3">
                      <div className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-450 uppercase tracking-wider mb-0.5">Email</p>
                        <p className="text-sm font-bold text-slate-900">{delivery.email}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-450 uppercase tracking-wider mb-0.5">Delivery Address</p>
                      <p className="text-sm font-bold text-slate-850">{delivery.delivery_address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Driver Info */}
              {delivery.delivery_person && (
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-50 pb-4">
                    <CardTitle className="text-sm font-bold text-slate-800">Driver Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-start gap-3 border-b border-slate-50 pb-3">
                      <User className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-450 uppercase tracking-wider mb-0.5">Driver Name</p>
                        <p className="text-sm font-bold text-slate-900">{delivery.delivery_person.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-450 uppercase tracking-wider mb-0.5">Phone</p>
                        <p className="text-sm font-bold text-slate-900">{delivery.delivery_person.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Costs */}
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Delivery Costs</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-3 text-xs font-semibold text-slate-655 text-slate-600">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span className="text-slate-500">Delivery Cost:</span>
                    <span className="font-bold text-slate-900">TZS {delivery.delivery_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span className="text-slate-500">Discount:</span>
                    <span className="font-bold text-rose-600">-TZS {delivery.delivery_discount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center font-extrabold text-slate-900 text-sm">
                    <span>Delivery Total:</span>
                    <span className="text-blue-700">TZS {delivery.delivery_total.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-50">
                    <p className="text-[10px] text-slate-455 uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="text-sm font-bold text-slate-800 capitalize">{delivery.payment_method}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Other Details */}
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Other Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-3.5 text-xs font-semibold text-slate-655 text-slate-600">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                    <span className="text-slate-500">Priority:</span>
                    <span className="font-bold text-slate-800 capitalize">{delivery.priority}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                    <span className="text-slate-500">Created Date:</span>
                    <span className="font-bold text-slate-800">{new Date(delivery.created_at).toLocaleString()}</span>
                  </div>
                  {delivery.rating && (
                    <div>
                      <p className="text-[10px] text-slate-450 uppercase tracking-wider mb-1">Customer Rating</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-850">{delivery.rating} / 5</span>
                        <div className="flex gap-0.5 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < delivery.rating ? 'text-amber-400' : 'text-slate-200'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tracking Tab */}
          {selectedTab === 'tracking' && (
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Delivery Tracking Timeline</CardTitle>
                <CardDescription className="text-xs text-slate-400">All status updates and location history</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {tracking && tracking.length > 0 ? (
                    tracking.map((record, index) => (
                      <div key={record.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                            record.status === 'delivered' ? 'bg-emerald-500 border-emerald-250' :
                            record.status === 'failed' ? 'bg-rose-500 border-rose-250' :
                            record.status === 'in-transit' ? 'bg-amber-500 border-amber-250' :
                            'bg-blue-500 border-blue-250'
                          }`} />
                          {index < tracking.length - 1 && <div className="w-0.5 h-16 bg-slate-100 my-1" />}
                        </div>
                        <div className="flex-1 pb-6 text-xs">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 capitalize text-sm">{record.status.replace('-', ' ')}</h4>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {new Date(record.created_at).toLocaleString()}
                            </span>
                          </div>
                          {record.location && <p className="text-slate-500 font-semibold mb-1">📍 {record.location}</p>}
                          {record.notes && <p className="text-slate-655 font-medium">{record.notes}</p>}
                          {record.latitude && record.longitude && (
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              Coordinates: {record.latitude}, {record.longitude}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <Clock className="w-10 h-10 mx-auto text-slate-350 text-slate-300 mb-3" />
                      <p className="text-xs font-bold text-slate-400">No tracking history yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Tab */}
          {selectedTab === 'items' && (
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Delivery Items</CardTitle>
                <CardDescription className="text-xs text-slate-400">{delivery.items?.length || 0} items listed</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                        <th className="px-5 py-3 text-left">Product</th>
                        <th className="px-5 py-3 text-center">Quantity</th>
                        <th className="px-5 py-3 text-right">Unit Price</th>
                        <th className="px-5 py-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delivery.items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{item.product_name}</td>
                          <td className="px-5 py-3 text-center font-bold text-slate-800 tabular-nums">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">TZS {item.unit_price.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-900 tabular-nums">TZS {item.total_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-100 text-xs">
                      <tr>
                        <td colSpan={3} className="px-5 py-3 text-slate-655 text-slate-600">Items Subtotal:</td>
                        <td className="px-5 py-3 text-right text-slate-900 tabular-nums">TZS {totalItemsValue.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  );
}
