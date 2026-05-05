import React, { useState } from "react";
import { Plus, Store as StoreIcon, Trash2, X, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import axios from "axios";

interface StoresSettingsProps {
  initialStores: any[];
  branches: any[];
}

export default function StoresSettings({ initialStores, branches }: StoresSettingsProps) {
  const [stores, setStores] = useState(initialStores);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [storeForm, setStoreForm] = useState({
    store_name: "",
    store_location: "",
    district: "Tanzania",
    street: "Default",
    branch_ids: [] as number[]
  });

  const handleEditStore = (store: any) => {
    setEditingStore(store);
    setStoreForm({
      store_name: store.name || "",
      store_location: store.location || "",
      district: store.district || "Tanzania",
      street: store.street || "Default",
      branch_ids: store.branches || []
    });
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = async () => {
    try {
      if (editingStore) {
        await axios.put(`/all-stores/${editingStore.id}`, storeForm);
        toast.success("Logistics repository updated");
      } else {
        await axios.post("/all-stores", storeForm);
        toast.success("Logistics node initialized");
      }

      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "System error during migration");
    }
  };

  const handleDeleteStore = async (id: number) => {
    if (confirm("Are you sure you want to delete this store? This will affect inventory data linked to this store.")) {
      try {
        await axios.delete(`/all-stores/${id}`);
        toast.success("Logistics node decommissioned");
        setStores(prev => prev.filter((s: any) => s.id !== id));
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete store");
      }
    }
  };

  const toggleBranchForStore = (branchId: number) => {
    setStoreForm(prev => {
      const branch_ids = prev.branch_ids.includes(branchId)
        ? prev.branch_ids.filter(id => id !== branchId)
        : [...prev.branch_ids, branchId];

      return { ...prev, branch_ids };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Stores</h3>
        </div>
        <Button 
          onClick={() => {
            setEditingStore(null); 
            setStoreForm({ store_name: "", store_location: "", district: "Tanzania", street: "Default", branch_ids: [] }); 
            setIsStoreModalOpen(true); 
          }}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Store
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((s: any) => (
          <Card key={s.id} className="border-slate-200 shadow-none flex flex-col">
            <CardContent className="p-6 flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-blue-50 text-blue-600 rounded">
                  <StoreIcon size={20} />
                </div>
                <Badge variant="outline" className="text-[9px] uppercase font-bold">#{s.id}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                  <MapPin size={10} className="text-slate-300" /> {s.location}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Linked Branches</p>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(s.branches) && s.branches.length > 0 ? s.branches.map((bId: number) => {
                    const branch = branches.find((b: any) => b.id === bId);
                    return (
                      <Badge key={`node-jurisdiction-${s.id}-${bId}`} variant="secondary" className="text-[9px] font-bold">
                        {branch?.name || `B#${bId}`}
                      </Badge>
                    )
                  }) : (
                    <p className="text-[10px] text-amber-500 italic">None</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold uppercase" onClick={() => handleEditStore(s)}>Configure</Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => handleDeleteStore(s.id)}
              >
                <Trash2 size={16} />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isStoreModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl rounded-lg shadow-xl overflow-hidden border-none">
            <CardHeader className="p-6 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded">
                    <StoreIcon size={20} />
                  </div>
                  <CardTitle className="text-sm font-bold">{editingStore ? "Edit Store" : "New Store"}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setIsStoreModalOpen(false)}><X size={16} /></Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Store Name</Label>
                  <Input className="h-10 text-sm" value={storeForm.store_name} onChange={e => setStoreForm({...storeForm, store_name: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Location</Label>
                  <Input className="h-10 text-sm" value={storeForm.store_location} onChange={e => setStoreForm({...storeForm, store_location: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">District</Label>
                  <Input className="h-10 text-sm" value={storeForm.district} onChange={e => setStoreForm({...storeForm, district: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Street</Label>
                  <Input className="h-10 text-sm" value={storeForm.street} onChange={e => setStoreForm({...storeForm, street: e.target.value})} />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase">Linked Branches</Label>
                <div className="grid grid-cols-2 gap-2 border border-slate-100 rounded p-4 bg-slate-50/50">
                  {Array.isArray(branches) && branches.map((b: any) => (
                    <div key={`store-branch-link-${b.id}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`branch-link-${b.id}`} 
                        checked={storeForm.branch_ids.includes(b.id)}
                        onCheckedChange={() => toggleBranchForStore(b.id)}
                      />
                      <label htmlFor={`branch-link-${b.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                        {b.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setIsStoreModalOpen(false)}>Cancel</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]" onClick={handleSaveStore}>
                {editingStore ? "Update Store" : "Create Store"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
