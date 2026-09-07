import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

interface Order {
  id: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  date: string;
}

interface RecentOrdersProps {
  orders?: Order[];
}

const statusStyles: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Processing: "bg-blue-50 text-blue-700 border-blue-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  Unpaid: "bg-rose-50 text-rose-700 border-rose-100",
  "Partially Paid": "bg-blue-50 text-blue-700 border-blue-100",
};

export function RecentOrders({ orders = [] }: RecentOrdersProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-up stagger-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Orders</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Tracking the most recent transactions</p>
        </div>
        <Link href="/orders" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
          View all
        </Link>
      </div>
      
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Order ID</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Amount</th>
              <th className="px-6 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map((order, i) => (
              <tr
                key={order.id || i}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xs shrink-0 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                      {(order.name || 'C').charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{order.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {order.id}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                  {order.date}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${statusStyles[order.status] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-white text-right tabular-nums">
                  TZS {order.amount?.toLocaleString()}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-center">
                  <Link 
                    href={`/orders/${order.id.replace('#SAL-', '')}`} 
                    className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 hover:text-blue-600 transition-colors"
                    title="View Order"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12 border-t border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-slate-300 dark:text-slate-600 font-bold text-xl px-2">?</span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">No recent orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
