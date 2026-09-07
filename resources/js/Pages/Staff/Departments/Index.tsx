import React, { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Plus, Search, Edit2, Trash2, Building2, Users, Phone, Mail, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: number;
  name: string;
  head_of_dep?: string | null;
  phone_number?: string | null;
  email?: string | null;
  description?: string | null;
  employee_count?: number;
}

interface StaffMember {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface DepartmentsIndexProps {
  departments: {
    data: Department[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
  };
  filters: {
    search?: string;
    per_page?: number;
  };
  staffMembers: StaffMember[];
}

const breadcrumbs = [
  { title: "HR Management", href: "#" },
  { title: "Departments List", href: "/hr/departments" },
];

export default function DepartmentsIndex({
  departments,
  filters = {},
  staffMembers = [],
}: DepartmentsIndexProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.per_page || 10);

  // Form for Add / Edit
  const { data, setData, post, put, processing, reset, errors } = useForm({
    name: "",
    head_of_dep: "",
    phone_number: "",
    email: "",
    description: "",
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    router.get(
      "/hr/departments",
      { search: value, per_page: perPage },
      { preserveState: true, replace: true }
    );
  };

  const handlePerPageChange = (val: number) => {
    setPerPage(val);
    router.get(
      "/hr/departments",
      { search: searchTerm, per_page: val },
      { preserveState: true, replace: true }
    );
  };

  const openAddModal = () => {
    reset();
    setEditingDept(null);
    setIsAddOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setData({
      name: dept.name || "",
      head_of_dep: dept.head_of_dep || "",
      phone_number: dept.phone_number || "",
      email: dept.email || "",
      description: dept.description || "",
    });
    setIsAddOpen(true);
  };

  const handleHeadSelect = (headName: string) => {
    const selectedStaff = staffMembers.find((s) => s.name === headName);
    setData((prev) => ({
      ...prev,
      head_of_dep: headName,
      phone_number: selectedStaff?.phone || prev.phone_number,
      email: selectedStaff?.email || prev.email,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) {
      put(`/hr/departments/${editingDept.id}`, {
        onSuccess: () => {
          setIsAddOpen(false);
          setEditingDept(null);
          reset();
        },
      });
    } else {
      post("/hr/departments", {
        onSuccess: () => {
          setIsAddOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingDept) return;
    router.delete(`/hr/departments/${deletingDept.id}`, {
      onSuccess: () => setDeletingDept(null),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Departments List" />
      <div className="space-y-4 pb-10">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Departments List
            </h1>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            HR Management <span className="mx-1">›</span> <span className="font-bold text-slate-700 dark:text-slate-300">Departments List</span>
          </div>
        </div>

        {/* Main Departments Card Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6 space-y-6">
          
          {/* Card Top Action Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Departments
            </h2>
            <Button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 h-9 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Departments
            </Button>
          </div>

          {/* Table Controls (Entries per page & Live Search) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select
                value={String(perPage)}
                onValueChange={(val) => handlePerPageChange(Number(val))}
              >
                <SelectTrigger className="w-16 h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Search:</span>
              <div className="relative">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 w-48 sm:w-64 text-xs pl-3 pr-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter departments..."
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold select-none">
                  <th className="py-3 px-4 w-16 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>No</span>
                      <span className="text-[10px] text-slate-400">♦</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span>Department Name</span>
                      <span className="text-[10px] text-slate-400">♦</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span>Head of Dep.</span>
                      <span className="text-[10px] text-slate-400">♦</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span>Phone Number</span>
                      <span className="text-[10px] text-slate-400">♦</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span>Email</span>
                      <span className="text-[10px] text-slate-400">♦</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>Employee</span>
                      <span className="text-[10px] text-slate-400">♦</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center w-24">
                    <div className="flex items-center justify-center gap-1">
                      <span>Action</span>
                      <span className="text-[10px] text-slate-400">♦</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {departments.data.length > 0 ? (
                  departments.data.map((dept, idx) => {
                    const rowNo = (departments.current_page - 1) * departments.per_page + idx + 1;
                    return (
                      <tr
                        key={dept.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-semibold text-slate-500 dark:text-slate-400">
                          {rowNo}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{dept.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {dept.head_of_dep || "—"}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {dept.phone_number || "—"}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {dept.email || "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs">
                            <Users className="w-3 h-3" />
                            {dept.employee_count || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(dept)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                              title="Edit Department"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingDept(dept)}
                              className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 transition-colors"
                              title="Delete Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium text-sm"
                    >
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div>
              {departments.total > 0
                ? `Showing ${departments.from || 0} to ${departments.to || 0} of ${departments.total} entries`
                : "Showing 0 to 0 of 0 entries"}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={departments.current_page === 1}
                onClick={() =>
                  router.get(
                    "/hr/departments",
                    { page: 1, search: searchTerm, per_page: perPage },
                    { preserveState: true }
                  )
                }
                className="h-8 text-xs font-medium px-2.5 border-slate-200 dark:border-slate-700"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={departments.current_page === 1}
                onClick={() =>
                  router.get(
                    "/hr/departments",
                    { page: departments.current_page - 1, search: searchTerm, per_page: perPage },
                    { preserveState: true }
                  )
                }
                className="h-8 text-xs font-medium px-2.5 border-slate-200 dark:border-slate-700"
              >
                Prev
              </Button>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold rounded-md border border-blue-200 dark:border-blue-800">
                {departments.current_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={departments.current_page === departments.last_page || departments.last_page === 0}
                onClick={() =>
                  router.get(
                    "/hr/departments",
                    { page: departments.current_page + 1, search: searchTerm, per_page: perPage },
                    { preserveState: true }
                  )
                }
                className="h-8 text-xs font-medium px-2.5 border-slate-200 dark:border-slate-700"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={departments.current_page === departments.last_page || departments.last_page === 0}
                onClick={() =>
                  router.get(
                    "/hr/departments",
                    { page: departments.last_page, search: searchTerm, per_page: perPage },
                    { preserveState: true }
                  )
                }
                className="h-8 text-xs font-medium px-2.5 border-slate-200 dark:border-slate-700"
              >
                Last
              </Button>
            </div>
          </div>

        </div>

      </div>

      {/* Add / Edit Department Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {editingDept ? "Edit Department" : "Add Departments"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Department Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                required
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                placeholder="e.g. Logistics & Transport"
                className="text-xs h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              {errors.name && <p className="text-[11px] text-rose-500 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Head of Department
              </Label>
              {staffMembers.length > 0 ? (
                <Select
                  value={data.head_of_dep || ""}
                  onValueChange={handleHeadSelect}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select Head of Department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.name} className="text-xs">
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="text"
                  value={data.head_of_dep}
                  onChange={(e) => setData("head_of_dep", e.target.value)}
                  placeholder="e.g. John Doe"
                  className="text-xs h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone Number
                </Label>
                <Input
                  type="text"
                  value={data.phone_number}
                  onChange={(e) => setData("phone_number", e.target.value)}
                  placeholder="e.g. +255 700 000 000"
                  className="text-xs h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  placeholder="e.g. dept@company.com"
                  className="text-xs h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Description / Notes
              </Label>
              <Textarea
                rows={3}
                value={data.description}
                onChange={(e) => setData("description", e.target.value)}
                placeholder="Brief description of department responsibilities..."
                className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                {processing ? "Saving..." : editingDept ? "Update Department" : "Save Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingDept} onOpenChange={() => setDeletingDept(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Delete Department?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{deletingDept?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
