import { Head, Link, router } from "@inertiajs/react";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Mail, 
  Phone,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Download
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";

import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from "@/components/ui/pagination";

interface User {
  id: number;
  staff_name: string;
  staff_email: string;
  staff_phone: string;
  username: string;
  profile?: string;
  role?: { id: number; role_name: string };
  branch?: { id: number; name: string };
  status: string;
}

interface UsersIndexProps {
  users: { 
    data: User[]; 
    current_page: number; 
    per_page: number; 
    total: number; 
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  metrics: {
    total_users: number;
    active_users: number;
    total_roles: number;
  };
}

const breadcrumbs = [
  { title: "Management", href: "#" },
  { title: "Users & Staff", href: "/users-crud" },
];

export default function UsersIndex({ users, metrics }: UsersIndexProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get("/users-crud", { search: searchTerm }, { preserveState: true, replace: true });
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Permanently remove this user account?")) {
      router.delete(`/users-crud/${id}`, {
        onSuccess: () => toast.success("User account deactivated"),
        onError: () => toast.error("Failed to delete user"),
      });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Enterprise Staff Management" />
      <div className="w-full space-y-8 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Enterprise Staff</h1>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm">
                <Download className="w-4 h-4" /> Export Directory
             </Button>
             <Link href="/users-crud/create">
                <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 px-4 shadow-lg shadow-blue-500/20">
                    <UserPlus className="w-4 h-4" /> Provision New User
                </Button>
             </Link>
          </div>
        </div>

        {/* Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="border-none shadow-sm bg-blue-50/50">
              <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Active Directory</p>
                       <h3 className="text-3xl font-black text-slate-900">{metrics.total_users || 0}</h3>
                       <p className="text-[10px] text-slate-500 font-bold">Total Provisioned Accounts</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                       <Users size={24} />
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-emerald-50/50">
              <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Global Status</p>
                       <h3 className="text-3xl font-black text-slate-900">{metrics.active_users || 0}</h3>
                       <p className="text-[10px] text-slate-500 font-bold">Accounts Currently Active</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                       <CheckCircle2 size={24} />
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-indigo-50/50">
              <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Policy Nodes</p>
                       <h3 className="text-3xl font-black text-slate-900">{metrics.total_roles || 0}</h3>
                       <p className="text-[10px] text-slate-500 font-bold">Unique Access Policy Levels</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                       <ShieldCheck size={24} />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Directory Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
           <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                    <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">Staff Directory</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-500 mt-0.5">Chronologically sorted list of system operators and staff</CardDescription>
                 </div>
                 <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                       placeholder="Search by name, email, username..." 
                       className="pl-10 h-10 w-full md:w-[300px] border-slate-200 text-xs font-bold shadow-none"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="hidden" />
                 </form>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <Table>
                 <TableHeader className="bg-slate-50/40">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                       <TableHead className="w-[80px] text-[10px] font-black uppercase text-slate-500 tracking-widest pl-6">Profile</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Account Info</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Identity</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Scope & Role</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Status</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-right pr-6">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {users.data.length > 0 ? (
                       users.data.map((user) => (
                          <TableRow key={user.id} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                             <TableCell className="pl-6">
                                <Avatar className="w-10 h-10 border border-slate-200 shadow-sm">
                                   <AvatarImage src={user.profile ? `/storage/${user.profile}` : ''} />
                                   <AvatarFallback className="bg-blue-50 text-blue-600 font-black text-xs">
                                      {user.staff_name.substring(0, 2).toUpperCase()}
                                   </AvatarFallback>
                                </Avatar>
                             </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                   <p className="text-sm font-semibold text-slate-900">{user.staff_name}</p>
                                   <div className="flex flex-col text-xs text-slate-500">
                                      <span>{user.staff_email}</span>
                                      <span>{user.staff_phone}</span>
                                   </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                 <Badge variant="secondary" className="font-normal">
                                    @{user.username}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col items-center gap-1">
                                    <Badge>
                                       {user.role?.role_name || 'Staff'}
                                    </Badge>
                                    <span className="text-xs text-slate-400">
                                       {user.branch?.name || 'Global'}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center text-xs">
                                 {user.status || 'Active'}
                              </TableCell>
                             <TableCell className="pr-6 text-right">
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                         <MoreVertical size={16} className="text-slate-400" />
                                      </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end" className="w-48 p-1 border-slate-200 shadow-xl rounded-xl">
                                      <DropdownMenuItem onClick={() => router.get(`/users-crud/${user.id}`)} className="text-xs font-bold gap-2 focus:bg-blue-50 focus:text-blue-600 cursor-pointer p-2 rounded-lg">
                                         <ExternalLink size={14} /> Full Portfolio
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => router.get(`/users-crud/${user.id}/edit`)} className="text-xs font-bold gap-2 focus:bg-blue-50 focus:text-blue-600 cursor-pointer p-2 rounded-lg">
                                         <Edit2 size={14} /> Edit Identity
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-slate-100" />
                                      <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-xs font-bold gap-2 focus:bg-rose-50 focus:text-rose-600 cursor-pointer p-2 rounded-lg">
                                         <Trash2 size={14} /> Revoke Access
                                      </DropdownMenuItem>
                                   </DropdownMenuContent>
                                </DropdownMenu>
                             </TableCell>
                          </TableRow>
                       ))
                    ) : (
                       <TableRow>
                          <TableCell colSpan={6} className="h-64 text-center">
                             <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                <Users size={48} className="text-slate-400" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No matching staff accounts detected</p>
                             </div>
                          </TableCell>
                       </TableRow>
                    )}
                 </TableBody>
              </Table>
           </CardContent>
        </Card>

        {/* Pagination Section */}
        {users.last_page > 1 && (
           <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-bold">
                 Showing {users.data.length} of {users.total} entries
              </p>
              <Pagination className="mx-0 w-auto">
                 <PaginationContent>
                    <PaginationItem>
                       <PaginationPrevious 
                          href={users.links[0]?.url || "#"} 
                          className={!users.links[0]?.url ? "pointer-events-none opacity-50" : ""}
                       />
                    </PaginationItem>
                    
                    {users.links.slice(1, -1).map((link, i) => (
                       <PaginationItem key={i}>
                          <PaginationLink 
                             href={link.url || "#"} 
                             isActive={link.active}
                          >
                             {link.label}
                          </PaginationLink>
                       </PaginationItem>
                    ))}

                    <PaginationItem>
                       <PaginationNext 
                          href={users.links[users.links.length - 1]?.url || "#"}
                          className={!users.links[users.links.length - 1]?.url ? "pointer-events-none opacity-50" : ""}
                       />
                    </PaginationItem>
                 </PaginationContent>
              </Pagination>
           </div>
        )}

      </div>
    </AppLayout>
  );
}
