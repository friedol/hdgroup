import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const data = [
  { name: "Iron Sheets", sales: 1847 },
  { name: "Nails (Box)", sales: 1523 },
  { name: "Steel Pipes", sales: 1204 },
  { name: "Wire Mesh", sales: 987 },
  { name: "Gutters", sales: 762 },
];

const barColors = [
  "#22c55e",
  "#3b82f6",
  "#60a5fa",
  "#94a3b8",
  "#cbd5e1",
];

export function TopProducts() {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Top Products</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Units sold this month</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={75}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "12px",
              boxShadow: "0 8px 24px -4px rgba(0,0,0,0.1)",
              padding: "10px 14px",
            }}
            formatter={(value: any) => [`${Number(value).toLocaleString()} units`, "Sales"]}
          />
          <Bar dataKey="sales" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={barColors[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
