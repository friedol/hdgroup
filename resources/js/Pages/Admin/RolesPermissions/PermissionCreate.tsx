import { Head, Link, useForm } from "@inertiajs/react";
import { 
    Key, 
    ChevronLeft, 
    Save, 
    ShieldCheck
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";

export default function PermissionCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        slug: "",
        module: "",
        action: "",
    });

    // Auto-slugify name
    const handleNameChange = (name: string) => {
        setData(prev => ({
            ...prev,
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/roles-permissions/permissions", {
            onSuccess: () => toast.success("Permission registered successfully"),
        });
    };

    return (
        <AppLayout>
            <Head title="Register Permission" />
            
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/roles-permissions">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                             System permission
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Define a new functional capability in the system.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Key className="h-5 w-5 text-blue-600" />
                                Permission details
                            </CardTitle>
                            <CardDescription>Granular action definition.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold tracking-wider text-slate-500">Display name</Label>
                                <Input 
                                    id="name"
                                    placeholder="e.g. View all orders"
                                    value={data.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-xs font-bold tracking-wider text-slate-500">System slug (Unique)</Label>
                                <Input 
                                    id="slug"
                                    placeholder="e.g. view-all-orders"
                                    value={data.slug}
                                    onChange={e => setData("slug", e.target.value)}
                                    className={errors.slug ? "border-red-500" : ""}
                                />
                                {errors.slug && <p className="text-xs text-red-500 font-bold">{errors.slug}</p>}
                                <p className="text-[10px] text-slate-400 font-medium">Used for backend check: auth(){"->"}user(){"->"}hasPermission('slug')</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="module" className="text-xs font-bold tracking-wider text-slate-500">Module group</Label>
                                    <Input 
                                        id="module"
                                        placeholder="e.g. INVENTORY"
                                        value={data.module}
                                        onChange={e => setData("module", e.target.value.toUpperCase())}
                                        className={errors.module ? "border-red-500" : ""}
                                    />
                                    {errors.module && <p className="text-xs text-red-500 font-bold">{errors.module}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="action" className="text-xs font-bold tracking-wider text-slate-500">Action type</Label>
                                    <Input 
                                        id="action"
                                        placeholder="e.g. view, create, delete"
                                        value={data.action}
                                        onChange={e => setData("action", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button 
                                type="submit" 
                                className="w-full bg-blue-600 hover:bg-blue-700 font-black h-12 gap-2 shadow-lg shadow-blue-500/20"
                                disabled={processing}
                            >
                                <Save className="h-5 w-5" />
                                Register permission
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
