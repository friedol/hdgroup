import React from 'react';

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
};

export function RecentOrders({ orders: dynamicOrders }: RecentOrdersProps) {
  const displayOrders = dynamicOrders?.length ? dynamicOrders : [
    { id: "ORD-7291", name: "Mwangi Hardware", amount: 2340, status: "Completed", date: "2 min ago", email: "" },
    { id: "ORD-7290", name: "Nairobi Steel Ltd", amount: 8120, status: "Processing", date: "18 min ago", email: "" },
    { id: "ORD-7289", name: "Coastal Supplies", amount: 1450, status: "Completed", date: "1 hr ago", email: "" },
    { id: "ORD-7288", name: "Alpha Construction", amount: 3200, status: "Pending", date: "3 hrs ago", email: "" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden animate-fade-up stagger-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recent Orders</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Tracking the most recent transactions</p>
        </div>
        <button className="text-xs text-blue-600 font-bold hover:underline">View all</button>
      </div>
      
      <div className="p-2">
        <div className="space-y-1">
          {displayOrders.map((order, i) => (
            <div
              key={order.id || i}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all duration-200 group border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                  {(order.name || 'C').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">{order.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {order.id} <span className="mx-1.5 opacity-30">•</span> {order.date}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${statusStyles[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {order.status}
                </span>
                <span className="text-sm font-bold text-slate-800 tabular-nums min-w-[70px] text-right">
                  TZS {order.amount?.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {displayOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-slate-300 font-bold text-xl px-2">?</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">No recent orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
