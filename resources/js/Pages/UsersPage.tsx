import { Head } from "@inertiajs/react";
import { Users, Plus, Search, Eye, Edit, Trash2, Shield, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";

interface User {
  id: number;
  staff_id: string;
  name: string;
  staff_name?: string;
  staff_email: string;
  role?: { role_name: string } | string;
  role_name?: string;
  branch?: { name: string } | string;
  status?: string;
  lastLogin?: string;
}

interface Role {
  id: number;
  role_name?: string;
  name?: string;
  users_count?: number;
  users?: number;
  permissions_count?: number;
  permissions?: number;
  description?: string;
}

interface UsersPageProps {
  users: User[];
  roles: Role[];
  kpis?: {
    total_users: number;
    active_users: number;
    total_roles: number;
    total_permissions: number;
  };
}

const permissionGroups = [
  { module: "Inventory", permissions: ["View Products", "Create Products", "Edit Products", "Delete Products", "Stock Adjustments", "Transfers"] },
  { module: "POS", permissions: ["New Sale", "Process Returns", "View History", "Apply Discounts", "Void Transactions"] },
  { module: "Production", permissions: ["View BOMs", "Create BOMs", "Production Orders", "Raw Materials", "Benchmarks"] },
  { module: "Finance", permissions: ["View Loans", "Create Loans", "Record Payments", "Manage Expenses", "Financial Reports"] },
  { module: "Logistics", permissions: ["View Containers", "Manage Containers", "Generate Manifests", "Assign Orders"] },
  { module: "Users", permissions: ["View Users", "Create Users", "Edit Users", "Delete Users", "Manage Roles"] },
];

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Users", href: "/users" },
];

export default function UsersPage({
  users = [],
  roles = [],
  kpis = { total_users: 0, active_users: 0, total_roles: 0, total_permissions: 0 }
}: UsersPageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="User Management" />
      <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="text-xl font-bold text-foreground">User Management</h2>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up stagger-1">
        <div className="kpi-card"><p className="text-2xl font-bold text-foreground tabular-nums">{kpis.total_users}</p><p className="text-xs text-muted-foreground mt-1">Total Users</p></div>
        <div className="kpi-card"><p className="text-2xl font-bold text-accent tabular-nums">{kpis.active_users}</p><p className="text-xs text-muted-foreground mt-1">Active Now</p></div>
        <div className="kpi-card"><p className="text-2xl font-bold text-primary tabular-nums">{kpis.total_roles}</p><p className="text-xs text-muted-foreground mt-1">Roles</p></div>
        <div className="kpi-card"><p className="text-2xl font-bold text-foreground tabular-nums">{kpis.total_permissions}</p><p className="text-xs text-muted-foreground mt-1">Permissions</p></div>
      </div>

      <Tabs defaultValue="users" className="animate-fade-up stagger-2">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between">
            <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search users..." className="pl-9" /></div>
            <Dialog>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Add User</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Full Name</Label><Input placeholder="Staff name" className="mt-1.5" /></div>
                    <div><Label>Staff ID</Label><Input placeholder="STF-008" className="mt-1.5" /></div>
                  </div>
                  <div><Label>Email</Label><Input type="email" placeholder="email@hdgroup.co.ke" className="mt-1.5" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Role</Label>
                      <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.role_name || r.name || ""}>{r.role_name || r.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Branch</Label>
                      <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="Global">Global</SelectItem><SelectItem value="Main">Main</SelectItem><SelectItem value="Branch A">Branch A</SelectItem><SelectItem value="Branch B">Branch B</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter><Button variant="outline">Cancel</Button><Button>Create User</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Login</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u) => {
                  const resolvedName = u.staff_name || u.name || "Unknown User";
                  const resolvedRole = typeof u.role === 'object' ? u.role?.role_name || "" : u.role_name || u.role || "Staff";
                  const resolvedBranch = typeof u.branch === 'object' ? u.branch?.name || "" : u.branch || "Headquarters";

                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {resolvedName.split(" ").map(n => n?.[0] || "").join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{resolvedName}</p>
                            <p className="text-xs text-muted-foreground">{u.staff_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.staff_email}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-md bg-secondary`}>{resolvedRole}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{resolvedBranch}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-md ${u.status === "Active" ? "bg-accent/10 text-accent" : "bg-accent/10 text-accent"}`}>{u.status || "Active"}</span></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.lastLogin || "System Entry"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-secondary"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => {
              const roleName = r.role_name || r.name || "Custom Role";

              return (
                <div key={r.id} className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-foreground">{roleName}</h4>
                    </div>
                    <button className="p-1 rounded hover:bg-secondary"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{r.description || `Platform specific functions for ${roleName}`}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span><strong className="text-foreground">{r.users_count || r.users || 0}</strong> users</span>
                    <span><strong className="text-foreground">{r.permissions_count || r.permissions || 0}</strong> permissions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="space-y-4">
            {permissionGroups.map(g => (
              <div key={g.module} className="bg-card rounded-xl border border-border/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">{g.module}</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {g.permissions.map(p => (
                    <div key={p} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm text-foreground">{p}</span>
                      <Switch defaultChecked={Math.random() > 0.3} />
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
