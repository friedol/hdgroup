import { Head, router, usePage } from "@inertiajs/react";
import { Database } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/SettingsLayout";

import GeneralSettings from "@/components/settings/GeneralSettings";
import HeroAdsSettings from "@/components/settings/HeroAdsSettings";
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
    { title: "System Settings", href: "/settings" },
];

export default function SettingsPage({
    settings = {},
    initialBranches = [],
    initialStores = [],
    initialHeroSlides = [],
}: SettingsPageProps) {
    const { url } = usePage();
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        const params = new URLSearchParams(url.split("?")[1] || "");
        const tab = params.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [url]);

    const getSettingValue = (key: string, defaultVal: string = "") => {
        for (const group in settings) {
            const found = settings[group].find((s: any) => s.key === key);
            if (found) return found.value;
        }
        return defaultVal;
    };

    const handleTabChange = (tab: string) => {
        if (tab === "branches") { router.visit("/branches"); return; }
        if (tab === "stores")   { router.visit("/all-stores"); return; }
        setActiveTab(tab);
        router.get("/settings", { tab }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Configuration" />
            <div className="max-w-[1600px] mx-auto space-y-8 pb-10">

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Configurations</h2>
                    <Button variant="outline" size="sm" className="font-bold uppercase text-[10px]">
                        <Database className="w-4 h-4 mr-2" /> System Audit
                    </Button>
                </div>

                <SettingsLayout activeTab={activeTab} onTabChange={handleTabChange}>

                    <TabsContent value="general" className="mt-0">
                        <GeneralSettings settings={settings} getSettingValue={getSettingValue} />
                    </TabsContent>

                    <TabsContent value="slides" className="mt-0">
                        <HeroAdsSettings
                            initialHeroSlides={initialHeroSlides}
                            branches={initialBranches}
                            settings={settings}
                            getSettingValue={getSettingValue}
                        />
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

                </SettingsLayout>
            </div>
        </AppLayout>
    );
}
