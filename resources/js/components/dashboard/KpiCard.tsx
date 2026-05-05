import { Link } from "@inertiajs/react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  className?: string;
  href?: string;
  bgClass?: string;
  iconBgClass?: string;
}

export function KpiCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  className = "", 
  href = "#",
  bgClass = "bg-white",
  iconBgClass = "bg-blue-50"
}: KpiCardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const trendLabel = isNeutral ? "Stable" : isPositive ? "Up" : "Down";

  const getAccentClasses = (tone: string) => {
    if (tone.includes("blue")) return { border: "border-blue-200", chip: "bg-blue-50/80" };
    if (tone.includes("emerald")) return { border: "border-emerald-200", chip: "bg-emerald-50/80" };
    if (tone.includes("rose") || tone.includes("red")) return { border: "border-rose-200", chip: "bg-rose-50/80" };
    if (tone.includes("amber") || tone.includes("orange")) return { border: "border-amber-200", chip: "bg-amber-50/80" };
    if (tone.includes("indigo")) return { border: "border-indigo-200", chip: "bg-indigo-50/80" };
    if (tone.includes("violet")) return { border: "border-violet-200", chip: "bg-violet-50/80" };
    if (tone.includes("sky")) return { border: "border-sky-200", chip: "bg-sky-50/80" };
    if (tone.includes("lime")) return { border: "border-lime-200", chip: "bg-lime-50/80" };
    return { border: "border-slate-200", chip: "bg-white/60" };
  };

  const accent = getAccentClasses(iconBgClass);

  return (
    <Link 
      href={href} 
      className={`block rounded-xl border ${accent.border} p-3 md:p-6 shadow-sm hover:shadow-md transition-shadow group ${bgClass} ${className}`}
    >
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className={`bg-white p-1.5 md:p-2 rounded-lg shadow-sm ${iconBgClass}`}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div
          className={`flex items-center gap-1 text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full ${accent.chip} ${
            isNeutral
              ? "text-zinc-500"
              : isPositive
              ? "text-emerald-700"
              : "text-red-700"
          }`}
        >
          {isNeutral ? (
            <Minus className="w-2.5 h-2.5 md:w-3 md:h-3" />
          ) : isPositive ? (
            <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
          ) : (
            <TrendingDown className="w-2.5 h-2.5 md:w-3 md:h-3" />
          )}
          {trendLabel}
        </div>
      </div>
      <p className="text-[13px] md:text-[14px] font-bold text-slate-900 tabular-nums leading-none">{value}</p>
      <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 truncate">{title}</p>
    </Link>
  );
}
