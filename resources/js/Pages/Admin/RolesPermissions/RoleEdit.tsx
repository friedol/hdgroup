import { Head, Link, useForm } from "@inertiajs/react";
import { 
    Shield, 
    ChevronLeft, 
    Save, 
    Globe,
    GitBranch,
    Lock,
    Trash2
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
import AppLayout from "@/layouts/app-layout";

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

interface Role {
    id: number;
    role_name: string;
    scope_type: 'global' | 'branch';
}

interface Props {
    role: Role;
    permissions: Record<string, Permission[]>;
    rolePermissionIds: number[];
}

/**
 * Individual permission item extracted to prevent ref-looping in large maps
 */
const PermissionItem = React.memo(({ 
    p, 
    isChecked, 
    onToggle 
}: { 
    p: Permission; 
    isChecked: boolean; 
    onToggle: (id: number) => void 
}) => {
    return (
        <div 
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all group
                ${isChecked ? 'border-blue-200 bg-blue-50/30' : 'border-transparent hover:bg-slate-50/50'}
            `}
        >
            <Checkbox 
                id={`p-${p.id}`}
                checked={isChecked}
                onCheckedChange={() => onToggle(p.id)}
                className="mt-0.5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <div className="flex-1 space-y-0.5">
                <Label 
                    htmlFor={`p-${p.id}`} 
                    className="text-xs font-bold text-slate-700 cursor-pointer transition-colors group-hover:text-blue-600 leading-none"
                >
                    {p.name}
                </Label>
                <p className="text-[9px] text-slate-400 font-medium font-mono lowercase tracking-tighter truncate opacity-70 group-hover:opacity-100 italic">
                    {p.slug}
                </p>
            </div>
        </div>
    );
});

PermissionItem.displayName = "PermissionItem";

export default function RoleEdit({ role, permissions, rolePermissionIds }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        role_name: role.role_name,
        scope_type: role.scope_type,
        permissions: rolePermissionIds,
    });

    // Memoize the module list to stay stable across form updates
    const moduleEntries = React.useMemo(() => Object.entries(permissions), [permissions]);

    const togglePermission = React.useCallback((id: number) => {
        const current = [...data.permissions];
        const index = current.indexOf(id);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }

        setData("permissions", current);
    }, [data.permissions, setData]);

    const toggleModule = (module: string, ids: number[]) => {
        const current = [...data.permissions];
        const allInModule = ids.every(id => current.includes(id));
        
        if (allInModule) {
            setData("permissions", current.filter(id => !ids.includes(id)));
        } else {
            const unique = Array.from(new Set([...current, ...ids]));
            setData("permissions", unique);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/roles-permissions/roles/${role.id}`, {
            onSuccess: () => toast.success("Role updated successfully!"),
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit Role: ${role.role_name}`} />
            
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/roles-permissions">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Edit role: <span className="text-blue-600">{role.role_name}</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-500">Update security policy and access rights</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sidebar: Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Role settings</CardTitle>
                                    <CardDescription>Identity and reach.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role_name" className="text-xs font-bold tracking-wider text-slate-500">Role name</Label>
                                        <Input 
                                            id="role_name"
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
                                            >
                                                <RadioGroupItem value="global" id="global" className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor="global" className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                                                        <Globe className="h-4 w-4 text-amber-600" />
                                                        Global scope
                                                    </Label>
                                                </div>
                                            </div>

                                            <div 
                                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${data.scope_type === 'branch' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <RadioGroupItem value="branch" id="branch" className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor="branch" className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                                                        <GitBranch className="h-4 w-4 text-blue-600" />
                                                        Branch scope
                                                    </Label>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs tracking-tighter">
                                        <Lock className="h-4 w-4" />
                                        {data.permissions.length} Permissions active
                                    </div>
                                </CardFooter>
                            </Card>

                            <Button 
                                type="submit" 
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-black text-lg gap-2 shadow-lg shadow-blue-500/20"
                                disabled={processing}
                            >
                                <Save className="h-5 w-5" />
                                Update role
                            </Button>
                        </div>

                        {/* Main: Permissions Checklist */}
                        <div className="lg:col-span-2">
                            <Card className="border-none shadow-sm h-full">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-widest">Manage permissions</CardTitle>
                                        <CardDescription className="text-[10px] font-bold text-slate-500 mt-1">Toggle specific system capabilities</CardDescription>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-600 font-bold">
                                        Grouped by module
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {moduleEntries.map(([module, perms]) => {
                                         const ids = perms.map(p => p.id);
                                         const allChecked = ids.every(id => data.permissions.includes(id));
                                         
                                         return (
                                             <div key={module} className="border-b border-slate-100 last:border-0">
                                                 <div className="bg-slate-50/80 px-6 py-3 flex items-center justify-between border-b border-slate-100/50">
                                                     <div className="flex items-center gap-2">
                                                         <div className="p-1 bg-blue-100 rounded-md">
                                                             <Shield className="h-3.5 w-3.5 text-blue-600" />
                                                         </div>
                                                         <h3 className="text-xs font-black text-slate-800 tracking-wider capitalize">
                                                             {module.toLowerCase()}
                                                         </h3>
                                                         <Badge variant="outline" className="text-[9px] bg-white px-1.5 py-0 h-4 border-slate-200 text-slate-400 capitalize">
                                                             {perms.length} actions
                                                         </Badge>
                                                     </div>
                                                     <div className="flex items-center gap-2">
                                                         <Label 
                                                             htmlFor={`module-${module}`}
                                                             className="text-[10px] font-bold text-slate-500 cursor-pointer hover:text-blue-600 transition-colors"
                                                         >
                                                             Select all
                                                         </Label>
                                                         <Checkbox 
                                                             id={`module-${module}`}
                                                             checked={allChecked}
                                                             onCheckedChange={() => toggleModule(module, ids)}
                                                             className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                         />
                                                     </div>
                                                 </div>
                                                 
                                                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                     {perms.map((p) => (
                                                         <PermissionItem 
                                                             key={p.id}
                                                             p={p}
                                                             isChecked={data.permissions.includes(p.id)}
                                                             onToggle={togglePermission}
                                                         />
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
