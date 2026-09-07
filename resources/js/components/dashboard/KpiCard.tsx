import { Link } from "@inertiajs/react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  className?: string;
  href?: string;
  bgClass?: string;
  iconBgClass?: string;
  subtitle?: string;
}

export function KpiCard({ 
  title, 
  value, 
  change = 0, 
  icon: Icon, 
  className = "", 
  href = "#",
  bgClass = "bg-white dark:bg-slate-900",
  iconBgClass = "bg-blue-50 dark:bg-blue-950/40",
  subtitle
}: KpiCardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const trendLabel = isNeutral ? "Stable" : isPositive ? "Up" : "Down";

  // Check if we are using a solid colored card
  const isSolid = bgClass !== "bg-white" && !bgClass.includes("bg-white") && !bgClass.includes("/50");

  const getAccentClasses = (tone: string) => {
    if (isSolid) {
      return { border: "border-transparent", chip: "bg-white/10 text-white" };
    }
    if (tone.includes("blue")) return { border: "border-blue-200 dark:border-blue-800/50", chip: "bg-blue-50/80 dark:bg-blue-900/40" };
    if (tone.includes("emerald")) return { border: "border-emerald-200 dark:border-emerald-800/50", chip: "bg-emerald-50/80 dark:bg-emerald-900/40" };
    if (tone.includes("rose") || tone.includes("red")) return { border: "border-rose-200 dark:border-rose-800/50", chip: "bg-rose-50/80 dark:bg-rose-900/40" };
    if (tone.includes("amber") || tone.includes("orange")) return { border: "border-amber-200 dark:border-amber-800/50", chip: "bg-amber-50/80 dark:bg-amber-900/40" };
    if (tone.includes("indigo")) return { border: "border-indigo-200 dark:border-indigo-800/50", chip: "bg-indigo-50/80 dark:bg-indigo-900/40" };
    if (tone.includes("violet")) return { border: "border-violet-200 dark:border-violet-800/50", chip: "bg-violet-50/80 dark:bg-violet-900/40" };
    if (tone.includes("sky")) return { border: "border-sky-200 dark:border-sky-800/50", chip: "bg-sky-50/80 dark:bg-sky-900/40" };
    if (tone.includes("lime")) return { border: "border-lime-200 dark:border-lime-800/50", chip: "bg-lime-50/80 dark:bg-lime-900/40" };
    return { border: "border-slate-200 dark:border-slate-800", chip: "bg-white/60 dark:bg-slate-800/60" };
  };

  const accent = getAccentClasses(iconBgClass);

  return (
    <Link 
      href={href} 
      className={`block rounded-2xl border ${accent.border} p-4 shadow-sm hover:shadow-lg transition-all duration-300 group ${bgClass} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl ${isSolid ? 'bg-white/10 text-white' : `shadow-sm ${iconBgClass}`}`}>
          <Icon className="h-4 w-4" />
        </div>
        {change !== undefined && change !== 0 && (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.chip} ${
              !isSolid && (isNeutral
                ? "text-zinc-500 dark:text-zinc-400"
                : isPositive
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400")
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trendLabel}
          </div>
        )}
      </div>
      <p className={`text-lg font-bold tracking-tight leading-none ${isSolid ? 'text-white' : 'text-slate-900 dark:text-white'} tabular-nums`}>{value}</p>
      <p className={`text-xs font-medium mt-1 truncate ${isSolid ? 'text-white/90' : 'text-slate-800 dark:text-slate-200'}`}>{title}</p>
      {subtitle && (
        <p className={`text-[10px] font-medium mt-1 truncate ${isSolid ? 'text-white/70' : 'text-slate-400 dark:text-slate-400'}`}>{subtitle}</p>
      )}
    </Link>
  );
}
