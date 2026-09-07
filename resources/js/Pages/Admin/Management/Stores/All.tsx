import { Head, Link, router } from "@inertiajs/react";
import {
    Plus, Edit, Trash2, Search, Store as StoreIcon,
    MapPin, Building2, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";

interface Branch {
    id: number;
    name: string;
}

interface Store {
    id: number;
    store_id: string;
    store_name: string;
    store_location: string;
    district?: string;
    street?: string;
    branches: Branch[];
}

interface StoresAllProps {
    stores: Store[];
    branches: Branch[];
}

const emptyForm = {
    store_name: "",
    store_location: "",
    district: "Tanzania",
    street: "Default",
    branch_ids: [] as number[],
};

export default function All({ stores: initialStores, branches }: StoresAllProps) {
    const [stores, setStores] = useState(initialStores);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: "Location", href: "#" },
        { title: "Stores", href: "/all-stores" },
    ];

    const openCreateModal = () => {
        setEditingStore(null);
        setForm(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (store: Store) => {
        setEditingStore(store);
        setForm({
            store_name: store.store_name,
            store_location: store.store_location,
            district: store.district || "Tanzania",
            street: store.street || "Default",
            branch_ids: (store.branches ?? []).map(b => b.id),
        });
        setIsModalOpen(true);
    };

    const toggleBranch = (id: number) => {
        setForm(prev => ({
            ...prev,
            branch_ids: prev.branch_ids.includes(id)
                ? prev.branch_ids.filter(b => b !== id)
                : [...prev.branch_ids, id],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingStore) {
                await axios.put(`/all-stores/${editingStore.id}`, form);
                toast.success("Store updated successfully");
            } else {
                await axios.post("/all-stores", form);
                toast.success("Store created successfully");
            }
            setIsModalOpen(false);
            router.reload({ only: ["stores"] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to save store");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (store: Store) => {
        if (!confirm(`Delete store "${store.store_name}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`/all-stores/${store.id}`);
            toast.success("Store deleted successfully");
            setStores(prev => prev.filter(s => s.id !== store.id));
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete store");
        }
    };

    const filtered = stores.filter(s =>
        s.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.store_location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.store_id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const linkedCount = stores.filter(s => (s.branches ?? []).length > 0).length;

    return (
        <>
            <Head title="Stores" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full space-y-8 pb-10">

                    <div className="mt-0 space-y-6">

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-900">Stores</h3>
                                <Button
                                    size="sm"
                                    onClick={openCreateModal}
                                    className="rounded-xl gap-2 text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Store
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total stores",       value: stores.length,                                   color: "text-slate-900",   border: "border-slate-200",   bg: "bg-white",         chip: "bg-slate-50/80",   chipText: "Units",    icon: <StoreIcon className="h-4 w-4 md:h-5 md:w-5" /> },
                                    { label: "Branch-linked",      value: linkedCount,                                     color: "text-emerald-700", border: "border-emerald-200", bg: "bg-emerald-50/30", chip: "bg-emerald-50/80", chipText: "Active",   icon: <Building2 className="h-4 w-4 md:h-5 md:w-5" /> },
                                    { label: "Total branches",     value: branches.length,                                 color: "text-blue-700",    border: "border-blue-200",    bg: "bg-blue-50/30",    chip: "bg-blue-50/80",    chipText: "Branches", icon: <Building2 className="h-4 w-4 md:h-5 md:w-5" /> },
                                    { label: "Unlinked stores",    value: stores.length - linkedCount,                     color: "text-slate-500",   border: "border-slate-200",   bg: "bg-slate-50/10",   chip: "bg-slate-100",     chipText: "Idle",     icon: <MapPin className="h-4 w-4 md:h-5 md:w-5" /> },
                                ].map(s => (
                                    <div key={s.label} className={`rounded-xl border ${s.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow ${s.bg}`}>
                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                            <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm text-slate-500">{s.icon}</div>
                                            <span className={`text-[8px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full ${s.chip} text-slate-600`}>{s.chipText}</span>
                                        </div>
                                        <p className={`text-lg md:text-2xl font-semibold tabular-nums leading-none ${s.color}`}>{s.value}</p>
                                        <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Table card */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                                {/* Toolbar */}
                                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search by name, location, ID..."
                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                                                <th className="px-5 py-3 text-left">Store ID</th>
                                                <th className="px-5 py-3 text-left">Store Name</th>
                                                <th className="px-5 py-3 text-left">Location</th>
                                                <th className="px-5 py-3 text-left">District</th>
                                                <th className="px-5 py-3 text-left">Linked Branches</th>
                                                <th className="px-5 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-16 text-center">
                                                        <StoreIcon className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                                                        <p className="text-sm font-semibold text-slate-400">No stores found</p>
                                                        <p className="text-[11px] text-slate-300 mt-1">Try another search or add a store</p>
                                                    </td>
                                                </tr>
                                            ) : filtered.map(row => (
                                                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{row.store_id}</span>
                                                    </td>
                                                    <td className="px-5 py-3 font-semibold text-slate-900">{row.store_name}</td>
                                                    <td className="px-5 py-3 text-slate-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                            {row.store_location || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-500 text-xs">{row.district || "-"}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {row.branches.length > 0 ? row.branches.map(b => (
                                                                <Badge key={b.id} variant="secondary" className="text-[10px] font-semibold">
                                                                    {b.name}
                                                                </Badge>
                                                            )) : (
                                                                <span className="text-[10px] text-amber-500 italic">Not linked</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Link href={`/all-stores/${row.id}`} title="View Stock" className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 border border-transparent hover:border-teal-100 transition-all">
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                            <button onClick={() => openEditModal(row)} title="Edit" className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(row)} title="Delete" className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                    </div>
                </div>
            </AppLayout>

            {/* Create / Edit dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="rounded-2xl max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {editingStore ? "Edit Store" : "Add Store"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-600">Store Name <span className="text-red-500">*</span></Label>
                                <Input value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} placeholder="e.g. Main Warehouse" className="rounded-xl border-slate-200" required />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">Location</Label>
                                <Input value={form.store_location} onChange={e => setForm({ ...form, store_location: e.target.value })} placeholder="e.g. Kariakoo" className="rounded-xl border-slate-200" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">District</Label>
                                <Input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="e.g. Ilala" className="rounded-xl border-slate-200" />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-600">Street</Label>
                                <Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="e.g. Uhuru Street" className="rounded-xl border-slate-200" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-600">Linked Branches</Label>
                                <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                                    {branches.length === 0 ? (
                                        <p className="col-span-2 text-xs text-slate-400 text-center">No branches available</p>
                                    ) : branches.map(b => (
                                        <div key={b.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`branch-${b.id}`}
                                                checked={form.branch_ids.includes(b.id)}
                                                onCheckedChange={() => toggleBranch(b.id)}
                                            />
                                            <label htmlFor={`branch-${b.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">{b.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs font-semibold h-9">Cancel</Button>
                            <Button type="submit" disabled={processing} className="rounded-xl text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20">
                                {processing ? "Saving..." : (editingStore ? "Save Changes" : "Add Store")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
