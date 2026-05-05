import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface ProductionOrder {
  id: number;
  order_number: string;
  quantity: number;
  status: string;
  scheduled_date: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
}

interface ProductionOrdersShowProps {
  order: ProductionOrder;
}

export default function ProductionOrdersShow({ order }: ProductionOrdersShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Production Orders', href: '/production-orders-new' },
    { title: order.order_number, href: '#' }
  ];

  return (
    <>
      <Head title={order.order_number} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/production-orders" className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-medium">{order.order_number}</h1>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-sm ${order.status === 'completed' ? 'bg-green-100' : order.status === 'in-progress' ? 'bg-amber-100' : 'bg-yellow-100'}`}>
                  {order.status}
                </span>
              </div>
            </div>
            <Link href={`/production-orders/${order.id}/edit`}>
              <Button><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-slate-600">Quantity</p>
              <p className="text-2xl font-medium mt-1">{order.quantity}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-lg font-medium mt-1 capitalize">{order.status}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Scheduled Date</p>
              <p className="text-lg font-medium mt-1">{new Date(order.scheduled_date).toLocaleDateString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Completion</p>
              <p className="text-lg font-medium mt-1">{order.completion_date ? new Date(order.completion_date).toLocaleDateString() : 'Pending'}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Notes</p>
                <p className="mt-1">{order.notes || 'No notes'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-slate-600">Created</p>
                  <p className="mt-1">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
