import React, { useState, useEffect } from 'react';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from "@/components/ui/sheet";
import { 
    Bell, 
    Package, 
    AlertTriangle, 
    Truck, 
    ArrowRight, 
    Clock, 
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Link, router } from "@inertiajs/react";
import axios from 'axios';

interface Notification {
    id: string;
    type: 'online_order' | 'stock_alert' | 'delivery' | 'message';
    title: string;
    message: string;
    time: string;
    link: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/notifications/fetch');
            setNotifications(response.data.notifications);
            setCount(response.data.count);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'online_order': return <Package className="w-4 h-4 text-blue-500" />;
            case 'stock_alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'delivery': return <Truck className="w-4 h-4 text-emerald-500" />;
            default: return <Bell className="w-4 h-4 text-rose-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'border-l-4 border-l-red-500 bg-red-50';
            case 'high': return 'border-l-4 border-l-orange-500 bg-orange-50';
            case 'medium': return 'border-l-4 border-l-blue-500 bg-blue-50';
            default: return 'border-l-4 border-l-slate-200 bg-slate-50';
        }
    };

    return (
        <Sheet open={open} onOpenChange={(v) => {
            setOpen(v);
            if (v) fetchNotifications();
        }}>
            <SheetTrigger asChild>
                <button className="relative p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all outline-none group">
                    <Bell size={17} className="group-hover:rotate-12 transition-transform" />
                    {count > 0 && (
                        <span className="absolute top-2 right-2.5 w-4 h-4 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                            {count}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col border-l border-slate-200 shadow-2xl">
                <SheetHeader className="p-6 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            NotificationsCenter
                            {count > 0 && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase">
                                    {count} New
                                </span>
                            )}
                        </SheetTitle>
                        <button 
                            onClick={fetchNotifications}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock size={16} />}
                        </button>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 gap-3 opacity-50">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Syncing alerts...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 gap-4 text-center px-8">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900">All caught up!</p>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">No new notifications for your branch at the moment.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.id}
                                    onClick={() => {
                                        setOpen(false);
                                        router.get(notif.link);
                                    }}
                                    className={`group p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-100 relative bg-white ${getPriorityColor(notif.priority)}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                                                {getIcon(notif.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1 pr-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{notif.title}</h4>
                                                <span className="text-[10px] text-slate-400 font-bold">{notif.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>
                                        <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight size={14} className="text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                    <button 
                        onClick={() => setNotifications([])}
                        className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all uppercase tracking-wider"
                    >
                        Mark all as read
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-bold mt-4 uppercase tracking-[0.2em]">HD Group Notification Center</p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
