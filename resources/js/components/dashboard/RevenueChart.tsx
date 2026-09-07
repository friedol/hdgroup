import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";

interface RevenueChartProps {
    revenueData?: number[];
    expenseData?: number[];
    labels?: string[];
}

export function RevenueChart({ revenueData, expenseData, labels }: RevenueChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  const chartData = labels?.map((label, index) => ({
    month: label,
    revenue: revenueData?.[index] || 0,
    expenses: expenseData?.[index] || 0,
  })) || [
    { month: "Jan", revenue: 42000, expenses: 28000 },
    { month: "Feb", revenue: 38500, expenses: 25400 },
    { month: "Mar", revenue: 51200, expenses: 31000 },
    { month: "Apr", revenue: 47800, expenses: 29200 },
    { month: "May", revenue: 53400, expenses: 33600 },
    { month: "Jun", revenue: 61200, expenses: 35800 },
    { month: "Jul", revenue: 58900, expenses: 34200 },
    { month: "Aug", revenue: 64300, expenses: 37100 },
    { month: "Sep", revenue: 59800, expenses: 35400 },
    { month: "Oct", revenue: 67200, expenses: 38900 },
    { month: "Nov", revenue: 72100, expenses: 41200 },
    { month: "Dec", revenue: 78400, expenses: 43600 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-100 dark:border-slate-800 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Revenue vs Expenses</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Monthly financial overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
            <button 
              onClick={() => setChartType("area")}
              className={`p-1.5 rounded-sm flex items-center justify-center transition-all ${chartType === 'area' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              title="Line Graph"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setChartType("bar")}
              className={`p-1.5 rounded-sm flex items-center justify-center transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              title="Bar Graph"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-5 text-xs font-medium">
            <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Revenue
            </span>
            <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              Expenses
            </span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === "area" ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `TZS ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card, #0f172a)",
                borderColor: "var(--border, #1e293b)",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "0 8px 24px -4px rgba(0,0,0,0.2)",
                padding: "10px 14px",
                color: "var(--foreground, #f8fafc)",
              }}
              formatter={(value: any, name: any) => [
                `TZS ${Number(value).toLocaleString()}`,
                name === "revenue" ? "Revenue" : "Expenses"
              ]}
              labelStyle={{ fontWeight: 600, marginBottom: 4, color: "var(--foreground, #f8fafc)" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#fb923c"
              strokeWidth={2.5}
              fill="url(#expGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#fb923c", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `TZS ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card, #0f172a)",
                borderColor: "var(--border, #1e293b)",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "0 8px 24px -4px rgba(0,0,0,0.2)",
                padding: "10px 14px",
                color: "var(--foreground, #f8fafc)",
              }}
              formatter={(value: any, name: any) => [
                `TZS ${Number(value).toLocaleString()}`,
                name === "revenue" ? "Revenue" : "Expenses"
              ]}
              labelStyle={{ fontWeight: 600, marginBottom: 4, color: "var(--foreground, #f8fafc)" }}
            />
            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
