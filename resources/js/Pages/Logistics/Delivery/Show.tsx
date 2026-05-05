import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, MapPin, Clock, User, Phone, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    const colors: Record<string, string> = {
      'pending': 'bg-slate-100 text-slate-700',
      'assigned': 'bg-blue-100 text-blue-700',
      'picked-up': 'bg-cyan-100 text-cyan-700',
      'in-transit': 'bg-yellow-100 text-yellow-700',
      'delivered': 'bg-green-100 text-green-700',
      'failed': 'bg-red-100 text-red-700',
      'cancelled': 'bg-slate-400 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/deliveries">
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-medium">{delivery.delivery_number}</h1>
                <p className="text-sm text-slate-600 mt-1">Delivery Details</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                {getStatusLabel(delivery.status)}
              </span>
              {delivery.status === 'pending' && (
                <Link href={`/deliveries/${delivery.id}/edit`}>
                  <Button size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedTab('details')}
                className={`px-4 py-2 border-b-2 font-medium ${
                  selectedTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setSelectedTab('tracking')}
                className={`px-4 py-2 border-b-2 font-medium ${
                  selectedTab === 'tracking'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Tracking History
              </button>
              <button
                onClick={() => setSelectedTab('items')}
                className={`px-4 py-2 border-b-2 font-medium ${
                  selectedTab === 'items'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Items
              </button>
            </div>
          </div>

          {/* Details Tab */}
          {selectedTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p className="font-medium text-lg">{delivery.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{delivery.phone}</p>
                    </div>
                  </div>
                  {delivery.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{delivery.email}</p>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="font-medium">{delivery.delivery_address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Driver Info */}
              {delivery.delivery_person && (
                <Card>
                  <CardHeader>
                  <CardTitle className="text-sm">Driver Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Name</p>
                      <p className="font-medium text-lg">{delivery.delivery_person.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{delivery.delivery_person.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Costs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Delivery Costs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Cost:</span>
                    <span className="font-medium">TZS {delivery.delivery_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium">-TZS {delivery.delivery_discount.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-medium">
                    <span>Delivery Total:</span>
                    <span className="text-lg">TZS {delivery.delivery_total.toLocaleString()}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mt-4">Payment Method</p>
                    <p className="font-medium capitalize">{delivery.payment_method}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Other Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Other Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{delivery.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created Date</p>
                    <p className="font-medium">{new Date(delivery.created_at).toLocaleString()}</p>
                  </div>
                  {delivery.rating && (
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg">{delivery.rating}/5</span>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < delivery.rating ? 'text-yellow-400' : 'text-gray-300'}>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Delivery Tracking Timeline</CardTitle>
                <CardDescription>All status updates and location history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tracking && tracking.length > 0 ? (
                    tracking.map((record, index) => (
                      <div key={record.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            record.status === 'delivered' ? 'bg-green-500' :
                            record.status === 'failed' ? 'bg-red-500' :
                            record.status === 'in-transit' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                          {index < tracking.length - 1 && <div className="w-1 h-16 bg-gray-200 my-2" />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-lg capitalize">{record.status.replace('-', ' ')}</h4>
                            <span className="text-sm text-muted-foreground">
                              {new Date(record.created_at).toLocaleString()}
                            </span>
                          </div>
                          {record.location && <p className="text-sm text-muted-foreground mb-2">📍 {record.location}</p>}
                          {record.notes && <p className="text-sm">{record.notes}</p>}
                          {record.latitude && record.longitude && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Coordinates: {record.latitude}, {record.longitude}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No tracking history yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Tab */}
          {selectedTab === 'items' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Delivery Items</CardTitle>
                <CardDescription>{delivery.items?.length || 0} items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Product</th>
                        <th className="pb-3 font-medium">Quantity</th>
                        <th className="pb-3 font-medium">Unit Price</th>
                        <th className="pb-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {delivery.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3">{item.product_name}</td>
                          <td className="py-3">{item.quantity}</td>
                          <td className="py-3">TZS {item.unit_price.toLocaleString()}</td>
                          <td className="py-3 text-right font-medium">TZS {item.total_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-slate-50 font-medium">
                      <tr>
                        <td colSpan={3} className="py-3 px-3">Items Total:</td>
                        <td className="py-3 text-right">TZS {totalItemsValue.toLocaleString()}</td>
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
