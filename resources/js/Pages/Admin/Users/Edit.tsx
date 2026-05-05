import { Head, Link, useForm, router } from "@inertiajs/react";
import { 
  ChevronLeft, 
  Save, 
  Mail, 
  Phone, 
  User as UserIcon, 
  Lock, 
  Camera,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Trash2
} from "lucide-react";
import React, { useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";

interface Role {
  id: number;
  role_name: string;
}

interface Branch {
  id: number;
  name: string;
}

interface User {
  id: number;
  staff_name: string;
  staff_email: string;
  staff_phone: string;
  username: string;
  profile?: string;
  role_id?: string;
  branch_id?: string;
  status?: string;
}

interface PageProps {
  user: User;
  roles: Role[];
  branches: Branch[];
  userRoleIds: number[];
}

const breadcrumbs = [
  { title: "User Management", href: "/users-crud" },
  { title: "Edit User", href: "#" },
];

export default function UserEdit({ user, roles, branches, userRoleIds }: PageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, setData, post, processing, errors } = useForm({
    staff_name: user.staff_name || "",
    role_id: user.role_id?.toString() || "",
    branch_id: user.branch_id?.toString() || "",
    staff_email: user.staff_email || "",
    staff_phone: user.staff_phone || "",
    username: user.username || "",
    password: "",
    profile: null as File | null,
    additional_role_id: userRoleIds?.length > 0 ? userRoleIds[0].toString() : "",
    _method: "PUT",
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profile ? `/storage/${user.profile}` : null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setData("profile", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/users-crud/${user.id}`, {
      onSuccess: () => {
        toast.success("User updated successfully");
      },
      onError: () => toast.error("Please check the form for errors."),
    });
  };

  const handleDeleteUser = () => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      router.delete(`/users-crud/${user.id}`, {
        onSuccess: () => toast.success("User deleted"),
      });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit User: ${user.staff_name}`} />
      <div className="space-y-6 pb-10">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link href="/users-crud">
                <Button variant="outline" size="icon" className="h-8 w-8">
                   <ChevronLeft className="h-4 w-4" />
                </Button>
             </Link>
             <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit User</h1>
                <p className="text-sm text-slate-500">Update staff member information</p>
             </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDeleteUser} className="font-bold uppercase text-[10px]">
             <Trash2 className="h-4 w-4 mr-2" /> Delete Account
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-none">
               <CardHeader className="text-center">
                  <div className="flex flex-col items-center space-y-4">
                     <div className="relative">
                        <Avatar className="w-24 h-24">
                           <AvatarImage src={previewUrl || ""} />
                           <AvatarFallback>
                              <UserIcon className="h-10 w-10 text-slate-300" />
                           </AvatarFallback>
                        </Avatar>
                        <button 
                           type="button"
                           onClick={() => fileInputRef.current?.click()}
                           className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white shadow-sm hover:bg-blue-700"
                        >
                           <Camera size={14} />
                        </button>
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleFileChange}
                        />
                     </div>
                     <div className="text-center">
                        <p className="font-semibold text-slate-900">{data.staff_name || "Staff Member"}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1 uppercase font-bold">User ID: {user.id}</Badge>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Role</Label>
                     <Select value={data.role_id} onValueChange={(val) => setData("role_id", val)}>
                        <SelectTrigger className="h-10 text-sm">
                           <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                           {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                 {role.role_name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     {errors.role_id && <p className="text-xs text-rose-500 font-medium">{errors.role_id}</p>}
                  </div>

                  <div className="space-y-2">
                     <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Assignment</Label>
                     <Select value={data.branch_id} onValueChange={(val) => setData("branch_id", val)}>
                        <SelectTrigger className="h-10 text-sm">
                           <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                           {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id.toString()}>
                                 {branch.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Additional Role (Optional)</Label>
                     <Select value={data.additional_role_id} onValueChange={(val) => setData("additional_role_id", val)}>
                        <SelectTrigger className="h-10 text-sm">
                           <SelectValue placeholder="No additional role" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="none">None</SelectItem>
                           {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                 {role.role_name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </CardContent>
            </Card>

            <Button 
               type="submit" 
               className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold"
               disabled={processing}
            >
               <RefreshCw className={`h-4 w-4 mr-2 ${processing ? "animate-spin" : ""}`} /> Update User
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <Card className="border-slate-200 shadow-none">
                <CardHeader className="pb-4 border-b border-slate-100 mb-6">
                   <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <UserIcon className="h-3.5 w-3.5 text-blue-500" /> Full Name
                         </Label>
                         <Input 
                            placeholder="e.g. John Doe" 
                            className="h-10 text-sm"
                            value={data.staff_name}
                            onChange={(e) => setData("staff_name", e.target.value)}
                         />
                         {errors.staff_name && <p className="text-xs text-rose-500 font-medium">{errors.staff_name}</p>}
                      </div>

                      <div className="space-y-2">
                         <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-blue-500" /> Email Address
                         </Label>
                         <Input 
                            type="email"
                            placeholder="staff@example.com" 
                            className="h-10 text-sm"
                            value={data.staff_email}
                            onChange={(e) => setData("staff_email", e.target.value)}
                         />
                         {errors.staff_email && <p className="text-xs text-rose-500 font-medium">{errors.staff_email}</p>}
                      </div>

                      <div className="space-y-2">
                         <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-blue-500" /> Phone Number
                         </Label>
                         <Input 
                            placeholder="+255 XXX XXX XXX" 
                            className="h-10 text-sm"
                            value={data.staff_phone}
                            onChange={(e) => setData("staff_phone", e.target.value)}
                         />
                         {errors.staff_phone && <p className="text-xs text-rose-500 font-medium">{errors.staff_phone}</p>}
                      </div>
                   </div>
                </CardContent>
             </Card>

             <Card className="border-slate-200 shadow-none">
                <CardHeader className="pb-4 border-b border-slate-100 mb-6">
                   <CardTitle className="text-sm font-semibold">Account Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" /> Username
                         </Label>
                         <Input 
                            placeholder="Unique username" 
                            className="h-10 text-sm"
                            value={data.username}
                            onChange={(e) => setData("username", e.target.value)}
                         />
                         {errors.username && <p className="text-xs text-rose-500 font-medium">{errors.username}</p>}
                      </div>

                      <div className="space-y-2">
                         <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5 text-slate-400" /> New Password (Optional)
                         </Label>
                         <Input 
                            type="password"
                            placeholder="Leave blank to keep current" 
                            className="h-10 text-sm"
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                         />
                         {errors.password && <p className="text-xs text-rose-500 font-medium">{errors.password}</p>}
                      </div>
                   </div>

                   <div className="p-4 bg-slate-50 rounded-lg flex gap-4">
                      <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-slate-900 uppercase">Security Note</p>
                         <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            If you change the username or password, the user may be logged out of their current sessions.
                         </p>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

        </form>

      </div>
    </AppLayout>
  );
}
