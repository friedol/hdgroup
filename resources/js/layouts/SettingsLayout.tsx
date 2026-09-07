import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Globe,
    Shield,
    ImageIcon,
    Mail,
    Smartphone,
    Phone,
} from "lucide-react";

interface SettingsLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    sidebarTitle?: string;
}

const menuItems = [
    { id: "general",  label: "General Info",   icon: Globe },
    { id: "slides",   label: "Hero & Ads",      icon: ImageIcon },
    { id: "email",    label: "Mail Relay",      icon: Mail },
    { id: "sms",      label: "SMS Gateway",     icon: Smartphone },
    { id: "contact",  label: "Contact Info",    icon: Phone },
];

export default function SettingsLayout({
    children,
    activeTab,
    onTabChange,
    sidebarTitle = "Settings",
}: SettingsLayoutProps) {
    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-64 shrink-0">
                <Card className="border-slate-200 shadow-none">
                    <CardHeader className="py-4 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                            {sidebarTitle}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <TabsList className="flex flex-col w-full h-auto bg-transparent p-0 space-y-1">
                            {menuItems.map((item) => (
                                <TabsTrigger
                                    key={item.id}
                                    value={item.id}
                                    className={cn(
                                        "flex items-center justify-start w-full px-3 py-2 rounded-md text-sm font-medium transition-colors border-none",
                                        "data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 shadow-none",
                                        "hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon className="mr-3 h-4 w-4" />
                                    {item.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </CardContent>
                </Card>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="text-blue-600 h-4 w-4" />
                        <p className="text-xs font-bold text-blue-900 uppercase">Status</p>
                    </div>
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                        System is running in optimized mode. All security protocols are active.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                {children}
            </div>
        </Tabs>
    );
}
