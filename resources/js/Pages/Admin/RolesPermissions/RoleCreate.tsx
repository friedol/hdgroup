import { Head, Link, useForm } from "@inertiajs/react";
import { 
    Shield, 
    ChevronLeft, 
    Save, 
    AlertCircle,
    CheckCircle2,
    Globe,
    GitBranch,
    Lock
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/layouts/app-layout";

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

interface Props {
    permissions: Record<string, Permission[]>;
}

export default function RoleCreate({ permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        role_name: "",
        scope_type: "branch" as "global" | "branch",
        permissions: [] as number[],
    });

    const togglePermission = (id: number) => {
        const current = [...data.permissions];
        const index = current.indexOf(id);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }

        setData("permissions", current);
    };

    const toggleModule = (module: string, ids: number[]) => {
        const current = [...data.permissions];
        const allInModule = ids.every(id => current.includes(id));
        
        if (allInModule) {
            // Remove all
            setData("permissions", current.filter(id => !ids.includes(id)));
        } else {
            // Add all missing
            const unique = Array.from(new Set([...current, ...ids]));
            setData("permissions", unique);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/roles-permissions/roles", {
            onSuccess: () => toast.success("Role created successfully!"),
        });
    };

    return (
        <AppLayout>
            <Head title="Create New Role" />
            
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/roles-permissions">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Create access role</h1>
                        <p className="text-xs font-bold text-slate-500">Define a new security policy for users</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Basic Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Role definition</CardTitle>
                                    <CardDescription>Primary identity and scope.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role_name" className="text-xs font-bold tracking-wider text-slate-500">Role name</Label>
                                        <Input 
                                            id="role_name"
                                            placeholder="e.g. Senior accountant"
                                            value={data.role_name}
                                            onChange={e => setData("role_name", e.target.value)}
                                            className={errors.role_name ? "border-red-500" : ""}
                                        />
                                        {errors.role_name && <p className="text-xs text-red-500 font-bold">{errors.role_name}</p>}
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold tracking-wider text-slate-500">Access scope</Label>
                                        <RadioGroup 
                                            value={data.scope_type} 
                                            onValueChange={(val: any) => setData("scope_type", val)}
                                            className="grid grid-cols-1 gap-2"
                                        >
                                            <div 
                                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${data.scope_type === 'global' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                                onClick={() => setData("scope_type", "global")}
                                            >
                                                <RadioGroupItem value="global" id="global" className="mt-1" onClick={(e) => e.stopPropagation()} />
                                                <div className="flex-1">
                                                    <Label htmlFor="global" className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                                                        <Globe className="h-4 w-4 text-amber-600" />
                                                        Global scope
                                                    </Label>
                                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Full access across all branches and system settings.</p>
                                                </div>
                                            </div>

                                            <div 
                                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${data.scope_type === 'branch' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                                onClick={() => setData("scope_type", "branch")}
                                            >
                                                <RadioGroupItem value="branch" id="branch" className="mt-1" onClick={(e) => e.stopPropagation()} />
                                                <div className="flex-1">
                                                    <Label htmlFor="branch" className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                                                        <GitBranch className="h-4 w-4 text-blue-600" />
                                                        Branch scope
                                                    </Label>
                                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Restricted to data within the assigned branch only.</p>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Lock className="h-4 w-4" />
                                        <span className="text-xs font-bold">{data.permissions.length} Permissions selected</span>
                                    </div>
                                </CardFooter>
                            </Card>

                            <Button 
                                type="submit" 
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-black text-lg gap-2 shadow-lg shadow-blue-500/20"
                                disabled={processing}
                            >
                                <Save className="h-5 w-5" />
                                Save secure policy
                            </Button>
                        </div>

                        {/* Permissions Checklist */}
                        <div className="lg:col-span-2">
                            <Card className="border-none shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-widest">Policy matrix</CardTitle>
                                        <CardDescription className="text-[10px] font-bold text-slate-500 mt-1">Select granular actions this role can perform</CardDescription>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700 font-bold border-blue-200">
                                        {Object.keys(permissions).length} modules
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-8 p-0">
                                    {Object.entries(permissions).map(([module, perms]) => {
                                        const ids = perms.map(p => p.id);
                                        const allChecked = ids.every(id => data.permissions.includes(id));
                                        
                                        return (
                                            <div key={module} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="bg-slate-50 px-6 py-3 flex items-center justify-between sticky top-0 z-10 border-y border-slate-100">
                                                    <h3 className="text-xs font-black text-slate-900 tracking-widest flex items-center gap-2 capitalize">
                                                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                                                        {module.toLowerCase()}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-[10px] font-bold text-slate-400">Toggle all</Label>
                                                        <Checkbox 
                                                            checked={allChecked}
                                                            onCheckedChange={() => toggleModule(module, ids)}
                                                            className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                                    {perms.map((p) => (
                                                        <div key={p.id} className="flex items-center gap-3 group">
                                                            <Checkbox 
                                                                id={`p-${p.id}`}
                                                                checked={data.permissions.includes(p.id)}
                                                                onCheckedChange={() => togglePermission(p.id)}
                                                                className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                            />
                                                            <Label 
                                                                htmlFor={`p-${p.id}`} 
                                                                className="flex-1 space-y-0.5 cursor-pointer py-1"
                                                            >
                                                                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors tracking-tight capitalize block">
                                                                    {p.name.toLowerCase()}
                                                                </span>
                                                                <p className="text-[10px] text-slate-400 font-medium font-mono lowercase tracking-tighter">
                                                                    {p.slug}
                                                                </p>
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
