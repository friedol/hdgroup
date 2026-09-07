import { Head, Link, router, usePage } from "@inertiajs/react";
import {
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  Store as StoreIcon,
  Calendar,
  CheckCircle2,
  Layers,
  User as UserIcon,
  Trash2,
  Eye,
  AlertCircle,
  Check,
  X,
  Clock
} from "lucide-react";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { KpiCard } from "@/components/dashboard/KpiCard";

interface TransferGroup {
  unique_id: string;
  source_store: string;
  destination_store: string;
  staff_name: string;
  staff_recommeded: string;
  created_at: string;
  total_quantity: number;
  base_unit?: string;
  product_count?: number;
  status: string | null;
}

interface Store {
  id: number;
  name?: string;
  store_name?: string;
}

interface User {
  id: number;
  name?: string;
  staff_name?: string;
}

interface Props {
  transfers: {
    data: TransferGroup[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
  };
  stores: Store[];
  users: User[];
  flash?: { success?: string; error?: string };
}

interface StoreProduct {
  id: number;
  product_name: string;
  qty: number;
  raw_qty: number;
  unit: string;
  factor: number;
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Check className="h-2.5 w-2.5" /> Confirmed
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
        <X className="h-2.5 w-2.5" /> Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
      <Clock className="h-2.5 w-2.5" /> Pending
    </span>
  );
}

export default function TransfersAll({ transfers, stores, users }: Props) {
  const { props } = usePage<any>();
  const flash = props.flash as { success?: string; error?: string } | undefined;

  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; status: string | null } | null>(null);

  /* ── Show SweetAlert on successful transfer redirect ── */
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Transfer Successful!',
        text: flash.success,
        confirmButtonColor: '#059669',
        confirmButtonText: 'Great!',
        timer: 4000,
        timerProgressBar: true,
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
      });
    }
    if (flash?.error) {
      Swal.fire({
        icon: 'error',
        title: 'Transfer Failed',
        text: flash.error,
        confirmButtonColor: '#dc2626',
      });
    }
  }, [flash?.success, flash?.error]);

  const handleConfirm = (unique_id: string) => {
    setActionLoading(unique_id + '_confirm');
    router.post(`/transfers/${unique_id}/confirm`, {}, {
      onSuccess: () => { toast.success('Transfer confirmed.'); },
      onError: () => { toast.error('Could not confirm transfer.'); },
      onFinish: () => setActionLoading(null),
    });
  };

  const handleCancel = (unique_id: string) => {
    setCancelTarget(unique_id);
  };

  const executeCancel = () => {
    if (!cancelTarget) return;
    setActionLoading(cancelTarget + '_cancel');
    setCancelTarget(null);
    router.post(`/transfers/${cancelTarget}/cancel`, {}, {
      onSuccess: () => { toast.success('Transfer cancelled and stock reversed.'); },
      onError: () => { toast.error('Could not cancel transfer.'); },
      onFinish: () => setActionLoading(null),
    });
  };

  const handleDelete = (unique_id: string, status: string | null) => {
    setDeleteTarget({ id: unique_id, status });
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id + '_delete');
    setDeleteTarget(null);
    router.delete(`/transfers/${deleteTarget.id}/batch`, {
      onSuccess: () => { toast.success('Transfer deleted successfully.'); },
      onError: () => { toast.error('Could not delete transfer.'); },
      onFinish: () => setActionLoading(null),
    });
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Inventory", href: "/products-new" },
    { title: "Transfers", href: "/transfers" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory Transfers" />
      
      <div className="space-y-8 animate-in fade-in duration-500 font-['Nunito_Sans']">
        
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 capitalize font-['Nunito_Sans']">Inventory Transfers</h1>
          </div>
          
          <Link href="/transfers/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md capitalize font-medium shadow-sm transition-all active:scale-95">
              <Plus className="h-4 w-4 mr-2" /> New Transfer
            </Button>
          </Link>
          </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-['Nunito_Sans'] font-normal">
           {[
             { title: "Total Batches", value: transfers.total.toLocaleString(), change: 0, icon: ArrowRightLeft, bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
             { title: "Units Transferred", value: transfers.data.reduce((acc, t) => acc + Number(t.total_quantity), 0).toLocaleString(), change: 0, icon: Layers, bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
             { title: "Active Stores", value: stores.length.toLocaleString(), change: 0, icon: StoreIcon, bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600" },
             { title: "Approved Movements", value: transfers.total.toLocaleString(), change: 0, icon: CheckCircle2, bgClass: "bg-indigo-50/50", iconBgClass: "bg-indigo-100 text-indigo-600" },
           ].map((k, i) => (
             <div key={k.title} className={`animate-fade-up stagger-${i + 1}`}>
               <KpiCard {...k} className="shadow-sm hover:shadow-md transition-shadow font-['Nunito_Sans']" />
             </div>
           ))}
        </div>

        {/* Filters and Table Area */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by ID or store..." 
                  className="pl-10 h-10 border-slate-200 text-xs rounded-md focus:ring-emerald-500 bg-white font-['Nunito_Sans']"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" className="h-10 text-xs font-medium capitalize text-slate-600 border-slate-200 rounded-md font-['Nunito_Sans']">
                   <Filter className="h-3 w-3 mr-2 text-slate-400" /> Filter
                </Button>
                <Button variant="outline" className="h-10 text-xs font-medium capitalize text-slate-600 border-slate-200 rounded-md font-['Nunito_Sans']">
                   <Calendar className="h-3 w-3 mr-2 text-slate-400" /> This Month
                </Button>
             </div>
          </div>

          <div className="overflow-x-auto font-['Nunito_Sans']">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-xs font-medium text-slate-500 py-3 pl-6 capitalize">Transfer Ref</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 capitalize">Source Store</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 capitalize">Destination Store</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-center capitalize">Qty Transferred</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 capitalize">Operator</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 capitalize">Recommended By</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-center capitalize">Status</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-center capitalize">Actions</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-right pr-6 capitalize">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.data.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={9} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                           <ArrowRightLeft className="h-10 w-10 mb-2 text-slate-400" />
                           <p className="text-sm font-medium capitalize text-slate-500">No transfers recorded</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : (
                  transfers.data.map((t) => {
                    const isPending = !t.status || t.status === 'pending';
                    const isConfirmLoading = actionLoading === t.unique_id + '_confirm';
                    const isCancelLoading = actionLoading === t.unique_id + '_cancel';
                    return (
                    <TableRow key={t.unique_id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                              <ArrowRightLeft className="h-4 w-4" />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-900 capitalize">{t.unique_id}</p>
                              <Badge variant="outline" className="text-[9px] font-normal text-slate-500 border-slate-200 mt-0.5">inter-store</Badge>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <StoreIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs text-slate-700 font-normal capitalize">{t.source_store ?? 'Main Store'}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <StoreIcon className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs text-slate-700 font-medium capitalize">{t.destination_store ?? 'Branch Stock'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs font-semibold px-2.5">
                            {t.total_quantity} {t.product_count === 1 && t.base_unit ? t.base_unit : 'units'}
                         </Badge>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs text-slate-700 font-normal capitalize">{t.staff_name ?? 'System'}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-700 border border-slate-200">
                               {t.staff_recommeded?.charAt(0) ?? 'M'}
                            </div>
                            <span className="text-xs text-slate-700 font-normal capitalize">{t.staff_recommeded ?? 'Manager'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="View details"
                            onClick={() => router.visit(`/transfers/${t.unique_id}`)}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {isPending && (
                            <>
                              <button
                                title="Confirm transfer"
                                disabled={!!actionLoading}
                                onClick={() => handleConfirm(t.unique_id)}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors disabled:opacity-50"
                              >
                                {isConfirmLoading
                                  ? <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                                  : <Check className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                title="Cancel & reverse transfer"
                                disabled={!!actionLoading}
                                onClick={() => handleCancel(t.unique_id)}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50"
                              >
                                {isCancelLoading
                                  ? <span className="h-3.5 w-3.5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                                  : <X className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          )}
                          <button
                            title="Delete transfer"
                            disabled={!!actionLoading}
                            onClick={() => handleDelete(t.unique_id, t.status)}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === t.unique_id + '_delete'
                              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <p className="text-xs font-medium text-slate-700">{new Date(t.created_at).toLocaleDateString()}</p>
                         <p className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between font-['Nunito_Sans']">
             <p className="text-xs font-normal text-slate-500 capitalize">showing {transfers.data.length} of {transfers.total} transfers</p>
             <div className="flex gap-1">
                <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={transfers.current_page === 1}
                   onClick={() => router.visit(`?page=${transfers.current_page - 1}`)}
                   className="h-8 rounded-md text-xs font-medium capitalize border-slate-200"
                >
                   previous
                </Button>
                <Button 
                   variant="outline" 
                   size="sm"
                   disabled={transfers.current_page === transfers.last_page}
                   onClick={() => router.visit(`?page=${transfers.current_page + 1}`)}
                   className="h-8 rounded-md text-xs font-medium capitalize border-slate-200"
                >
                   next
                </Button>
             </div>
          </div>
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4 font-['Nunito_Sans']">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                <X className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Cancel Transfer?</p>
                <p className="text-xs text-slate-500 mt-0.5">Stock will be reversed back to the source store.</p>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-md p-3 mb-5">
              <p className="text-xs text-rose-700 font-medium">Ref: {cancelTarget}</p>
              <p className="text-[11px] text-rose-500 mt-0.5">This action cannot be undone. The inventory movement will be reversed immediately.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 text-xs capitalize font-medium border-slate-200 text-slate-600"
                onClick={() => setCancelTarget(null)}
              >
                Keep Transfer
              </Button>
              <Button
                className="flex-1 h-10 text-xs capitalize font-medium bg-rose-500 hover:bg-rose-600 text-white border-none"
                onClick={executeCancel}
              >
                Yes, Cancel & Reverse
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4 font-['Nunito_Sans']">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Delete Transfer?</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {deleteTarget.status === 'pending' || !deleteTarget.status
                    ? 'Stock will be reversed and the record permanently deleted.'
                    : 'The transfer record will be permanently deleted.'}
                </p>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-md p-3 mb-5">
              <p className="text-xs text-rose-700 font-medium">Ref: {deleteTarget.id}</p>
              {(deleteTarget.status === 'pending' || !deleteTarget.status) && (
                <p className="text-[11px] text-rose-500 mt-0.5">Since this transfer is still pending, inventory will be reversed before deletion.</p>
              )}
              {deleteTarget.status === 'confirmed' && (
                <p className="text-[11px] text-rose-500 mt-0.5">This transfer is confirmed. Only the record will be deleted — inventory will not be reversed.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 text-xs capitalize font-medium border-slate-200 text-slate-600"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-10 text-xs capitalize font-medium bg-rose-500 hover:bg-rose-600 text-white border-none"
                onClick={executeDelete}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
