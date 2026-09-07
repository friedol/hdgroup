import React from 'react';

interface StatItem {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
    description?: string;
}

interface StatsSummaryCardsProps {
    stats: StatItem[];
}

export function StatsSummaryCards({ stats }: StatsSummaryCardsProps) {
    const getColorClasses = (color: string = 'indigo') => {
        switch (color) {
            case 'emerald':
            case 'green':
                return { bg: 'bg-emerald-600', iconBg: 'bg-white/10' };
            case 'orange':
            case 'amber':
                return { bg: 'bg-amber-500', iconBg: 'bg-white/10' };
            case 'purple':
            case 'violet':
                return { bg: 'bg-violet-600', iconBg: 'bg-white/10' };
            case 'rose':
            case 'red':
                return { bg: 'bg-rose-500', iconBg: 'bg-white/10' };
            case 'blue':
            case 'sky':
                return { bg: 'bg-sky-600', iconBg: 'bg-white/10' };
            case 'indigo':
            default:
                return { bg: 'bg-blue-600', iconBg: 'bg-white/10' };
        }
    };

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {stats.map((stat, idx) => {
                const style = getColorClasses(stat.color);
                return (
                    <div
                        key={idx}
                        className={`rounded-2xl ${style.bg} text-white p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-xl ${style.iconBg} text-white`}>
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                                {stat.label}
                            </span>
                        </div>
                        <div>
                            <p className="text-xl font-bold tracking-tight leading-none text-white tabular-nums">
                                {stat.value}
                            </p>
                            {stat.description && (
                                <p className="text-[10px] font-medium text-white/80 mt-1 truncate">
                                    {stat.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default StatsSummaryCards;
