import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface LineItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  order_date: string;
  notes?: string;
  line_items: LineItem[];
  created_at: string;
}

interface OrdersShowProps {
  order: Order;
}

export default function OrdersShow({ order }: OrdersShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Orders', href: '/orders-crud' },
    { title: order.order_number, href: '#' }
  ];

  return (
    <>
      <Head title={order.order_number} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/orders" className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-medium">{order.order_number}</h1>
              </div>
            </div>
            <Link href={`/orders/${order.id}/edit`}>
              <Button><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-slate-600">Customer</p>
              <p className="text-lg font-medium mt-1">{order.customer_name}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Total Amount</p>
              <p className="text-2xl font-medium text-amber-600 mt-1">TZS {order.total_amount.toFixed(2)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Status</p>
              <span className={`inline-block px-2 py-1 rounded text-sm mt-1 ${order.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {order.status}
              </span>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Payment</p>
              <span className={`inline-block px-2 py-1 rounded text-sm mt-1 ${order.payment_status === 'paid' ? 'bg-green-100' : 'bg-orange-100'}`}>
                {order.payment_status}
              </span>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Product</th>
                    <th className="px-4 py-2 text-right font-medium">Quantity</th>
                    <th className="px-4 py-2 text-right font-medium">Unit Price</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.line_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">TZS {item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium">TZS {(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {order.notes && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Notes</h2>
              <p>{order.notes}</p>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  );
}
