import { Head, Link } from "@inertiajs/react";
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  DollarSign,
  TrendingUp,
  History,
  Award,
  AlertCircle,
  User as UserIcon
} from "lucide-react";
import React from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";

interface User {
  id: number;
  staff_name: string;
  staff_email: string;
  staff_phone: string;
  username: string;
  profile?: string;
  role?: { role_name: string };
  branch?: { name: string };
  created_at: string;
}

interface Sale {
  id: number;
  invoice_no: string;
  payable_amount: number;
  created_at: string;
}

interface PageProps {
  user: User;
  sales: Sale[];
  totalSales: number;
  totalTransactions: number;
  outstandingLoans: number;
  totalPayments: number;
}

const breadcrumbs = [
  { title: "User Management", href: "/users-crud" },
  { title: "User Profile", href: "#" },
];

export default function UserShow({ user, sales, totalSales, totalTransactions, outstandingLoans, totalPayments }: PageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`User Profile: ${user.staff_name}`} />
      <div className="space-y-6 pb-10">
        
        <div className="flex items-center gap-4">
          <Link href="/users-crud">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 tracking-tight">User Profile</h1>
            <p className="text-sm text-slate-500">View detailed information for {user.staff_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           
           <div className="lg:col-span-1 space-y-6">
              <Card className="border-slate-200 shadow-none overflow-hidden">
                 <div className="h-20 bg-slate-100" />
                 <CardContent className="p-6 -mt-10 space-y-4 text-center">
                    <Avatar className="w-24 h-24 mx-auto border-4 border-white">
                       <AvatarImage src={user.profile ? `/storage/${user.profile}` : ''} />
                       <AvatarFallback className="bg-slate-100 text-slate-400">
                          <UserIcon className="h-10 w-10" />
                       </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                       <h3 className="text-lg font-medium text-slate-900">{user.staff_name}</h3>
                       <p className="text-xs text-slate-500">@{user.username}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-medium">
                       {user.role?.role_name || 'Staff Member'}
                    </Badge>

                    <div className="pt-4 border-t border-slate-100 space-y-4 text-left">
                       <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <div className="overflow-hidden">
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mb-1">Email</p>
                             <p className="text-xs font-medium text-slate-700 truncate">{user.staff_email}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <div>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mb-1">Phone</p>
                             <p className="text-xs font-medium text-slate-700">{user.staff_phone}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <div>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mb-1">Branch</p>
                             <p className="text-xs font-medium text-slate-700">{user.branch?.name || 'Global'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <div>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mb-1">Joined</p>
                             <p className="text-xs font-medium text-slate-700">
                                {new Date(user.created_at).toLocaleDateString()}
                             </p>
                          </div>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="lg:col-span-3 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-6 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase text-slate-500 tracking-wider">Total Sales</p>
                          <h3 className="text-xl font-medium text-slate-900">TZS {(totalSales || 0).toLocaleString()}</h3>
                          <p className="text-[10px] text-slate-400 font-medium">{totalTransactions} Transactions</p>
                       </div>
                       <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                          <TrendingUp size={20} />
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-6 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase text-slate-500 tracking-wider">Payments</p>
                          <h3 className="text-xl font-medium text-slate-900">TZS {(totalPayments || 0).toLocaleString()}</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Disbursed Funds</p>
                       </div>
                       <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <DollarSign size={20} />
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-6 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-medium uppercase text-slate-500 tracking-wider">Outstandings</p>
                          <h3 className="text-xl font-medium text-slate-900">TZS {(outstandingLoans || 0).toLocaleString()}</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Advances</p>
                       </div>
                       <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                          <AlertCircle size={20} />
                       </div>
                    </CardContent>
                 </Card>
              </div>

              <Card className="border-slate-200 shadow-none overflow-hidden">
                 <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-slate-400" />
                          <CardTitle className="text-sm font-semibold">Recent Sales Activity</CardTitle>
                       </div>
                       <Badge variant="outline" className="text-[10px] uppercase font-medium">POS History</Badge>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader>
                          <TableRow className="bg-slate-50/30">
                             <TableHead className="text-[10px] font-medium uppercase text-slate-500 pl-6">Invoice</TableHead>
                             <TableHead className="text-[10px] font-medium uppercase text-slate-500">Date</TableHead>
                             <TableHead className="text-[10px] font-medium uppercase text-slate-500 text-right pr-6">Amount</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {sales?.length > 0 ? (
                             sales.map((sale) => (
                                <TableRow key={sale.id}>
                                   <TableCell className="pl-6 font-medium text-xs text-slate-900">#{sale.invoice_no}</TableCell>
                                   <TableCell className="text-xs text-slate-500">
                                      {new Date(sale.created_at).toLocaleString()}
                                   </TableCell>
                                   <TableCell className="text-right pr-6 text-xs font-semibold text-slate-900">TZS {sale.payable_amount.toLocaleString()}</TableCell>
                                </TableRow>
                             ))
                          ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="py-10 text-center text-sm text-slate-400 italic">
                                   No activity found
                                </TableCell>
                             </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none overflow-hidden bg-slate-50">
                 <CardContent className="p-6">
                    <div className="flex gap-4 items-start">
                       <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm text-amber-500">
                          <Award size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">Performance Summary</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">
                             This staff member is currently maintaining an optimal system sync status. All transactions and operational logs are verified within regular audit parameters.
                          </p>
                          <div className="flex gap-6 pt-2">
                             <div>
                                <p className="text-[10px] font-medium uppercase text-slate-400 tracking-wider">Status</p>
                                <p className="text-sm font-medium text-emerald-600">Active</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-medium uppercase text-slate-400 tracking-wider">Score</p>
                                <p className="text-sm font-medium text-blue-600">Excellent</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>

      </div>
    </AppLayout>
  );
}
