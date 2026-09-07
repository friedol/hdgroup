import { Head, Link, router } from "@inertiajs/react";
import { 
    Shield, 
    Key, 
    Users, 
    Settings, 
    Plus, 
    Edit2, 
    Trash2, 
    Search,
    ChevronRight,
    Lock,
    Globe,
    GitBranch,
    Activity
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";

interface Role {
    id: number;
    role_name: string;
    scope_type: 'global' | 'branch';
    permissions_count: number;
    users_count: number;
}

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
}

interface Props {
    roles: Role[];
    permissions: Record<string, Permission[]>;
    auth: any;
}

export default function RolesPermissionsIndex({ roles, permissions, auth }: Props) {
    const handleDeleteRole = (id: number) => {
        if (confirm("Are you sure you want to delete this role?")) {
            router.delete(`/roles-permissions/roles/${id}`, {
                onSuccess: () => toast.success("Role deleted successfully"),
                onError: (err: any) => toast.error(err.error || "Failed to delete role"),
            });
        }
    };

    const handleDeletePermission = (id: number) => {
        if (confirm("Are you sure you want to delete this permission?")) {
            router.delete(`/roles-permissions/permissions/${id}`, {
                onSuccess: () => toast.success("Permission deleted successfully"),
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Roles & Permissions" />
            
            <div className="w-full space-y-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-900 flex items-center gap-3 tracking-tight">
                            <Shield className="h-6 w-6 text-blue-600 mb-1" />
                            Security & access
                        </h1>
                        <p className="text-slate-500 font-bold text-xs">Manage user identities, access levels, and granular permissions</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link href="/roles-permissions/permissions/create">
                            <Button variant="outline" className="gap-2 font-bold border-slate-200 hover:bg-slate-50">
                                <Key className="h-4 w-4" />
                                Add permission
                            </Button>
                        </Link>
                        <Link href="/roles-permissions/roles/create">
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20">
                                <Plus className="h-4 w-4" />
                                Create new role
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-blue-600 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Active roles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{roles.length}</div>
                            <p className="text-xs text-slate-500 font-medium mt-1">Configured system roles</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Total permissions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">
                                {Object.values(permissions).flat().length}
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1">Granular access controls</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-amber-600 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                System health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">100%</div>
                            <p className="text-xs text-slate-500 font-medium mt-1">Access control active</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="roles" className="w-full">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200">
                        <TabsList className="bg-transparent h-12 w-fit p-0 gap-8">
                            <TabsTrigger 
                                value="roles" 
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-2 font-bold text-slate-500 transition-all h-full"
                            >
                                User roles
                            </TabsTrigger>
                            <TabsTrigger 
                                value="permissions" 
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-2 font-bold text-slate-500 transition-all h-full"
                            >
                                System permissions
                            </TabsTrigger>
                        </TabsList>
                        
                        <div className="hidden md:flex items-center gap-2 mb-2 p-1 bg-slate-50 border border-slate-200 rounded-lg max-w-sm">
                            <Search className="h-4 w-4 text-slate-400 ml-2" />
                            <Input 
                                placeholder="Search roles or permissions..." 
                                className="border-none bg-transparent h-8 text-sm focus-visible:ring-0 shadow-none min-w-[240px]"
                            />
                        </div>
                    </div>

                    <TabsContent value="roles" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map((role) => (
                                <Card key={role.id} className="group hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={role.scope_type === 'global' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-blue-50 text-blue-700 border-blue-100"}>
                                                    {role.scope_type === 'global' ? 'Global' : 'Branch'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/roles-permissions/roles/${role.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                    onClick={() => handleDeleteRole(role.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-sm font-bold text-slate-900 mt-2">{role.role_name}</CardTitle>
                                        <CardDescription className="text-slate-500 font-bold text-[10px]">
                                            System identification for {role.role_name} access level
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-6 mt-2">
                                            <div className="space-y-1 text-center bg-slate-50 rounded-xl p-3 flex-1 flex flex-col items-center">
                                                <div className="text-lg font-black text-slate-900">{role.permissions_count}</div>
                                                <div className="text-[10px] font-bold text-slate-500 tracking-wider">Permissions</div>
                                            </div>
                                            <div className="space-y-1 text-center bg-slate-50 rounded-xl p-3 flex-1 flex flex-col items-center">
                                                <div className="text-lg font-black text-slate-900">{role.users_count}</div>
                                                <div className="text-[10px] font-bold text-slate-500 tracking-wider">Assigned users</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 border-t border-slate-50 mt-2">
                                        <Link href={`/roles-permissions/roles/${role.id}/edit`} className="w-full mt-4">
                                            <Button variant="outline" className="w-full font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200">
                                                Manage policy
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="permissions" className="mt-0">
                        <div className="space-y-8">
                            {Object.entries(permissions).map(([module, perms]) => (
                                <div key={module} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                                        <h3 className="text-sm font-bold text-slate-900 tracking-tight capitalize">{module.toLowerCase()}</h3>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold text-[10px]">
                                            {perms.length} perms
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {perms.map((permission) => (
                                            <div key={permission.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                                                <div className="space-y-1 flex-1 overflow-hidden">
                                                    <div className="text-sm font-black text-slate-900 truncate tracking-tight">{permission.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter truncate">{permission.slug}</div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/roles-permissions/permissions/${permission.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                        onClick={() => handleDeletePermission(permission.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
