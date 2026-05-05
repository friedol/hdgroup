import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import React from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  order_date: string;
  status: string;
  payment_status: string;
}

interface OrdersIndexProps {
  orders: { data: Order[]; current_page: number; per_page: number; total: number };
}

export default function OrdersIndex({ orders }: OrdersIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Orders', href: '#' }
  ];

  const columns = [
    {
      key: 'order_number',
      label: 'Order No.',
      render: (value: string, row: Order) => (
        <Link href={`/orders/${row.id}`} className="text-amber-600 hover:underline font-medium">{value}</Link>
      ),
      sortable: true
    },
    { key: 'customer_name', label: 'Customer', sortable: true },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value: number) => `TZS ${(value ?? 0).toLocaleString()}`,
      sortable: true
    },
    {
      key: 'order_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-sm ${value === 'completed' ? 'bg-green-100' : value === 'pending' ? 'bg-yellow-100' : 'bg-amber-100'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-sm ${value === 'paid' ? 'bg-green-100' : 'bg-orange-100'}`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <>
      <Head title="Orders" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Customer Orders</h1>
              <p className="text-sm text-slate-600 mt-1">Manage customer orders</p>
            </div>
            <Link href="/orders/create">
              <Button><Plus className="h-4 w-4 mr-2" />New Order</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{orders.total}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{orders.data.filter(o => o.status === 'pending').length}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{orders.data.filter(o => o.status === 'completed').length}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">TZS {orders.data.reduce((s, o) => s + (o.total_amount ?? 0), 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <DataTable<Order>
              columns={columns}
              data={orders.data}
              keyExtractor={(row) => row.id}
              pagination={{ current: orders.current_page, total: orders.total, perPage: orders.per_page, onPageChange: () => {} }}
            />
          </div>
        </div>
      </AppLayout>
    </>
  );
}
