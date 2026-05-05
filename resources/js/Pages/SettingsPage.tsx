import { Head } from "@inertiajs/react";
import { 
  Building2, 
  Receipt, 
  Mail, 
  Globe, 
  Database, 
  Shield, 
  Store as StoreIcon, 
  Smartphone,
  ImageIcon,
  Phone
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";
import { cn } from "@/lib/utils";

// Extracted Components
import GeneralSettings from "@/components/settings/GeneralSettings";
import HeroAdsSettings from "@/components/settings/HeroAdsSettings";
import BranchesSettings from "@/components/settings/BranchesSettings";
import StoresSettings from "@/components/settings/StoresSettings";
import EmailSettings from "@/components/settings/EmailSettings";
import SmsSettings from "@/components/settings/SmsSettings";
import ContactSettings from "@/components/settings/ContactSettings";

interface SettingsPageProps {
  settings?: any;
  initialBranches?: any[];
  initialStores?: any[];
  initialHeroSlides?: any[];
}

const breadcrumbs = [
  { title: "User Management", href: "/users-crud" },
  { title: "System Settings", href: "#" },
];

export default function SettingsPage({
  settings = {},
  initialBranches = [],
  initialStores = [],
  initialHeroSlides = []
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState("general");
  
  // Helper function to get settings value
  const getSettingValue = (key: string, defaultVal: string = "") => {
    for (const group in settings) {
        const found = settings[group].find((s: any) => s.key === key);
        if (found) {
          return found.value;
        }
    }
    return defaultVal;
  };

  const menuItems = [
    { id: "general", label: "General Info", icon: Globe, description: "Primary identity and locale" },
    { id: "slides", label: "Hero & Ads", icon: ImageIcon, description: "Manage landing carousels and ads" },
    { id: "branches", label: "Branches", icon: Building2, description: "Physical operational units" },
    { id: "stores", label: "Stores", icon: StoreIcon, description: "Storage and distribution" },
    { id: "email", label: "Mail Relay", icon: Mail, description: "SMTP and institutional email" },
    { id: "sms", label: "SMS Gateway", icon: Smartphone, description: "Bulk SMS and notification API" },
    { id: "contact", label: "Contact Info", icon: Phone, description: "Public contact page and WhatsApp" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="System Configuration" />
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-1xl font-bold text-slate-900 tracking-tight">Configurations</h2>
          </div>
          <Button variant="outline" size="sm" className="font-bold uppercase text-[10px]">
             <Database className="w-4 h-4 mr-2" /> System Audit
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-8">
           
           <div className="w-full lg:w-64 shrink-0">
              <Card className="border-slate-200 shadow-none">
                 <CardHeader className="py-4 px-4 border-b border-slate-100">
                    <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Settings</CardTitle>
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
                 <p className="text-[10px] text-blue-700 leading-relaxed font-medium">System is running in optimized mode. All security protocols are active.</p>
              </div>
           </div>

           {/* Content Area */}
           <div className="flex-1 w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              
              <TabsContent value="general" className="mt-0">
                 <GeneralSettings settings={settings} getSettingValue={getSettingValue} />
              </TabsContent>

              <TabsContent value="slides" className="mt-0">
                 <HeroAdsSettings initialHeroSlides={initialHeroSlides} branches={initialBranches} />
              </TabsContent>

              <TabsContent value="branches" className="mt-0">
                 <BranchesSettings initialBranches={initialBranches} />
              </TabsContent>

              <TabsContent value="stores" className="mt-0">
                 <StoresSettings initialStores={initialStores} branches={initialBranches} />
              </TabsContent>

              <TabsContent value="email" className="mt-0">
                 <EmailSettings getSettingValue={getSettingValue} />
              </TabsContent>

              <TabsContent value="sms" className="mt-0">
                 <SmsSettings branches={initialBranches} />
              </TabsContent>

              <TabsContent value="contact" className="mt-0">
                 <ContactSettings getSettingValue={getSettingValue} />
              </TabsContent>

           </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
