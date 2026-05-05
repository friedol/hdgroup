import { Head, Link, useForm } from "@inertiajs/react";
import { 
    Key, 
    ChevronLeft, 
    Save, 
    ShieldCheck,
    Trash2
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
}

interface Props {
    permission: Permission;
}

export default function PermissionEdit({ permission }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
        slug: permission.slug,
        module: permission.module,
        action: permission.action || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/roles-permissions/permissions/${permission.id}`, {
            onSuccess: () => toast.success("Permission updated correctly"),
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit Permission: ${permission.name}`} />
            
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/roles-permissions">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                             Update permission
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Modify existing system capability.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                Permission config
                            </CardTitle>
                            <CardDescription>ID: {permission.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold tracking-wider text-slate-500">Display name</Label>
                                <Input 
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData("name", e.target.value)}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-xs font-bold tracking-wider text-slate-500">System slug</Label>
                                <Input 
                                    id="slug"
                                    value={data.slug}
                                    onChange={e => setData("slug", e.target.value)}
                                    className={errors.slug ? "border-red-500" : ""}
                                />
                                {errors.slug && <p className="text-xs text-red-500 font-bold">{errors.slug}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="module" className="text-xs font-bold tracking-wider text-slate-500">Module</Label>
                                    <Input 
                                        id="module"
                                        value={data.module}
                                        onChange={e => setData("module", e.target.value.toUpperCase())}
                                        className={errors.module ? "border-red-500" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="action" className="text-xs font-bold tracking-wider text-slate-500">Action</Label>
                                    <Input 
                                        id="action"
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
                                Save changes
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
