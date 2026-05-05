import { Head, Link, router } from '@inertiajs/react';
import { 
  Plus, 
  Search, 
  Truck, 
  Phone, 
  Mail, 
  MapPin,
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  MoreHorizontal,
  Globe,
  Building2,
  ShieldCheck,
  Tag
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Supplier {
  id: number;
  supplier_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  category: string | null;
  tax_id: string | null;
  status: boolean;
  branch?: {
    name: string;
  };
}

interface SuppliersIndexProps {
  suppliers: { 
    data: Supplier[]; 
    current_page: number; 
    per_page: number; 
    total: number;
    last_page: number;
  };
  filters: {
    search?: string;
  };
  metrics: {
    total_suppliers: number;
    active_suppliers: number;
    categories_count: number;
  };
}

export default function SuppliersIndex({ suppliers, filters, metrics }: SuppliersIndexProps) {
  const [search, setSearch] = useState(filters.search || '');

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Suppliers', href: '#' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/suppliers', { search }, { preserveState: true });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      router.delete(`/suppliers/${id}`);
    }
  };

  return (
    <>
      <Head title="Suppliers" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suppliers</h1>
              <p className="text-sm text-slate-500 tracking-tight mt-0.5">Manage your procurement network and vendor relationships.</p>
            </div>
            <Link href="/suppliers/create">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-sm px-6 shadow-lg shadow-slate-200">
                <Plus className="h-4 w-4 mr-2" /> Register Supplier
              </Button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200 rounded-sm shadow-sm flex items-center gap-5 p-6">
              <div className="bg-slate-50 p-3 rounded-sm"><Truck className="h-6 w-6 text-slate-400" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Total Vendors</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{metrics?.total_suppliers || 0}</p>
              </div>
            </Card>
            <Card className="border-slate-200 rounded-sm shadow-sm flex items-center gap-5 p-6">
              <div className="bg-amber-50 p-3 rounded-sm"><ShieldCheck className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Active Status</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{metrics?.active_suppliers || 0}</p>
              </div>
            </Card>
            <Card className="border-slate-200 rounded-sm shadow-sm flex items-center gap-5 p-6">
              <div className="bg-slate-50 p-3 rounded-sm"><Tag className="h-6 w-6 text-slate-400" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Categories</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{metrics?.categories_count || 0}</p>
              </div>
            </Card>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                   <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                   <Input 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search suppliers..." 
                     className="pl-10 h-10 border-slate-200 focus:ring-slate-400 rounded-sm text-xs"
                   />
                </form>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="h-10 px-4 rounded-sm font-bold text-slate-600 border-slate-200">Export Registry</Button>
                </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b-slate-200">
                  <TableHead className="font-bold text-slate-800">Supplier Details</TableHead>
                  <TableHead className="font-bold text-slate-800">Contact Info</TableHead>
                  <TableHead className="font-bold text-slate-800">Location</TableHead>
                  <TableHead className="font-bold text-slate-800">Category</TableHead>
                  <TableHead className="font-bold text-slate-800 text-center">Status</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.data.length > 0 ? (
                  suppliers.data.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-slate-50 border-b-slate-100 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-900">{supplier.supplier_name}</span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase">Branch: {supplier.branch?.name || 'All'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                            {supplier.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Phone className="h-3 w-3 text-slate-400" /> {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Mail className="h-3 w-3 text-slate-400" /> {supplier.email}
                              </div>
                            )}
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                               <MapPin className="h-3 w-3 text-slate-400" /> {supplier.city || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                               <Globe className="h-3 w-3" /> {supplier.country}
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none rounded-xs font-bold text-[9px] px-2 uppercase">
                           {supplier.category || 'Standard'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge 
                           className={`border-none rounded-full px-2 py-0.5 font-bold text-[8px] uppercase ${
                             supplier.status 
                             ? 'bg-emerald-100 text-emerald-700' 
                             : 'bg-rose-100 text-rose-700'
                           }`}
                         >
                           {supplier.status ? 'Active' : 'Inactive'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-sm">
                               <Link href={`/suppliers/${supplier.id}/edit`}>
                                  <DropdownMenuItem className="text-xs cursor-pointer">
                                     <Edit2 className="h-3 w-3 mr-2 text-slate-400" /> Edit Details
                                  </DropdownMenuItem>
                               </Link>
                               <DropdownMenuItem 
                                 className="text-xs cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                                 onClick={() => handleDelete(supplier.id)}
                               >
                                  <Trash2 className="h-3 w-3 mr-2" /> Remove Supplier
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                     <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30 grayscale">
                           <Truck className="h-10 w-10 mb-2" />
                           <p className="text-sm font-bold">No suppliers registered yet</p>
                        </div>
                     </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {suppliers.last_page > 1 && (
              <div className="p-4 border-t bg-slate-50/30 flex items-center justify-between">
                 <p className="text-[10px] font-medium text-slate-500">Page {suppliers.current_page} of {suppliers.last_page}</p>
                 <div className="flex gap-1">
                    <Link href={`/suppliers?page=${suppliers.current_page - 1}${search ? `&search=${search}` : ''}`}>
                       <Button 
                         variant="outline" 
                         size="icon" 
                         className="h-8 w-8 rounded-sm border-slate-200" 
                         disabled={suppliers.current_page === 1}
                       >
                          <ChevronLeft className="h-4 w-4" />
                       </Button>
                    </Link>
                    <Link href={`/suppliers?page=${suppliers.current_page + 1}${search ? `&search=${search}` : ''}`}>
                       <Button 
                         variant="outline" 
                         size="icon" 
                         className="h-8 w-8 rounded-sm border-slate-200" 
                         disabled={suppliers.current_page === suppliers.last_page}
                       >
                          <ChevronRight className="h-4 w-4" />
                       </Button>
                    </Link>
                 </div>
              </div>
            )}
          </div>

        </div>
      </AppLayout>
    </>
  );
}
