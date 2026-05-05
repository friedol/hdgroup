import React, { useState } from "react";
import { Plus, Building2, ImageIcon, Trash2, X, Upload, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

interface BranchesSettingsProps {
  initialBranches: any[];
}

export default function BranchesSettings({ initialBranches }: BranchesSettingsProps) {
  const [branches, setBranches] = useState(initialBranches);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    system_name: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
    logo: null as any,
    favicon: null as any
  });

  const handleEditBranch = (branch: any) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name || "",
      system_name: branch.system_name || "",
      address: branch.location || "",
      phone: branch.phone || "",
      email: branch.email || "",
      is_active: branch.status === "Active",
      logo: null,
      favicon: null
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async () => {
    try {
      const formData = new FormData();
      formData.append("name", branchForm.name);
      formData.append("system_name", branchForm.system_name);
      formData.append("address", branchForm.address);
      formData.append("phone", branchForm.phone);
      formData.append("email", branchForm.email);
      formData.append("is_active", branchForm.is_active ? "1" : "0");

      if (branchForm.logo) {
        formData.append("logo", branchForm.logo);
      }

      if (branchForm.favicon) {
        formData.append("favicon", branchForm.favicon);
      }

      if (editingBranch?.id) {
        formData.append("_method", "PUT");
        await axios.post(`/branches/${editingBranch.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(`${branchForm.system_name || branchForm.name} identity synchronized`);
      } else {
        await axios.post(`/branches`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(`${branchForm.system_name || branchForm.name} identity created`);
      }
      
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Institutional identity synchronization failure");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Active Branches</h3>
        </div>
        <Button 
          onClick={() => handleEditBranch({})}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Branch
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b: any) => (
          <Card key={b.id} className="border-slate-200 shadow-none flex flex-col">
            <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-blue-600 overflow-hidden shrink-0">
                    {b.logo ? (
                      <img src={`/storage/${b.logo}`} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={20} />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">{b.system_name || b.name}</CardTitle>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{b.location}</p>
                  </div>
                </div>
                <Badge variant={b.status === "Active" ? "default" : "secondary"} className="text-[9px] uppercase font-bold">
                  {b.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Manager</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{b.manager}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Phone</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{b.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold uppercase" onClick={() => handleEditBranch(b)}>Edit Identity</Button>
                <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl rounded-lg shadow-xl overflow-hidden border-none">
            <CardHeader className="p-6 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded">
                    <Building2 size={20} />
                  </div>
                  <CardTitle className="text-sm font-bold">Branch Identity</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setIsBranchModalOpen(false)}><X size={16} /></Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Unit Name</Label>
                    <Input className="h-10 text-sm" value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">System Name</Label>
                    <Input className="h-10 text-sm" value={branchForm.system_name} onChange={e => setBranchForm({...branchForm, system_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Email</Label>
                    <Input className="h-10 text-sm" value={branchForm.email} onChange={e => setBranchForm({...branchForm, email: e.target.value})} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Phone</Label>
                    <Input className="h-10 text-sm" value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Address</Label>
                    <Textarea className="text-sm min-h-[100px]" value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Logo</Label>
                  <div className="border border-dashed border-slate-200 rounded p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/30">
                    <div className="h-16 w-16 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
                      {branchForm.logo ? (
                        <img src={URL.createObjectURL(branchForm.logo)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (editingBranch?.logo ? <img src={`/storage/${editingBranch.logo}`} alt="Current" className="w-full h-full object-cover" /> : <ImageIcon size={24} />)}
                    </div>
                    <div className="flex flex-col items-center">
                      <label htmlFor="branch-logo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-600 bg-white px-4 py-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                          <Upload size={14} /> Upload Logo
                        </div>
                        <input id="branch-logo-upload" type="file" className="hidden" accept="image/*" onChange={e => setBranchForm({...branchForm, logo: e.target.files?.[0] || null})} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Favicon</Label>
                  <div className="border border-dashed border-slate-200 rounded p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/30">
                    <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
                      {branchForm.favicon ? (
                        <img src={URL.createObjectURL(branchForm.favicon)} alt="Favicon Preview" className="w-full h-full object-contain p-1" />
                      ) : (editingBranch?.favicon ? <img src={`/storage/${editingBranch.favicon}`} alt="Current" className="w-full h-full object-contain p-1" /> : <Smartphone size={20} />)}
                    </div>
                    <div className="flex flex-col items-center">
                      <label htmlFor="branch-favicon-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-600 bg-white px-4 py-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                          <Upload size={14} /> Upload Favicon
                        </div>
                        <input id="branch-favicon-upload" type="file" className="hidden" accept="image/*" onChange={e => setBranchForm({...branchForm, favicon: e.target.files?.[0] || null})} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 border-t border-slate-100 flex justify-end gap-3 shadow-none">
              <Button variant="ghost" size="sm" onClick={() => setIsBranchModalOpen(false)}>Cancel</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]" onClick={handleSaveBranch}>
                Synchronize Identity
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
