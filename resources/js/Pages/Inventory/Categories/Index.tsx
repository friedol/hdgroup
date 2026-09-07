import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Edit, Trash2, Search, Image, FolderOpen, Package, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

/* ─── Types ────────────────────────────────────── */
interface Category {
  id: number;
  category_name: string;
  category_desc?: string;
  image_url?: string;
  products_count: number;
}

interface CategoriesIndexProps {
  categories: { data: Category[]; current_page: number; per_page: number; total: number };
  filters?: { search?: string };
}

/* ─── Component ────────────────────────────────── */
export default function CategoriesIndex({ categories, filters = {} }: CategoriesIndexProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState(filters.search ?? '');

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    category_name: '',
    category_desc: '',
    image: null as File | null,
    _method: 'post',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '#' },
    { title: 'Categories', href: '#' }
  ];

  const applyFilters = (overrides: Record<string, string> = {}) => {
    router.get(
      '/categories-crud',
      { search: searchQuery, ...overrides },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handlePage = (page: number) => {
    router.get('/categories-crud', { page, search: searchQuery }, { preserveState: true });
  };

  const openCreateModal = () => {
    setEditingCat(null);
    reset();
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setData({
      category_name: cat.category_name,
      category_desc: cat.category_desc || '',
      image: null,
      _method: 'put',
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const handleDelete = (row: Category) => {
    if (!confirm(`Permanently delete category "${row.category_name}"?`)) {
      return;
    }
    router.delete(`/categories-crud/${row.id}`, {
      onSuccess: () => toast.success('Category removed successfully'),
      onError: (errors) => toast.error((errors?.error as string) || 'Failed to delete category'),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCat) {
      data._method = 'put';
      post(`/categories-crud/${editingCat.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success('Category updated successfully');
          reset();
        },
        onError: (err) => {
          toast.error(err.error || 'Failed to save changes');
        }
      });
    } else {
      data._method = 'post';
      post('/categories-crud', {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success('Category created successfully');
          reset();
        },
        onError: (err) => {
          toast.error(err.error || 'Failed to create category');
        }
      });
    }
  };

  const totalPages = Math.ceil(categories.total / categories.per_page);
  const totalProducts = categories.data.reduce((sum, c) => sum + (Number(c.products_count) || 0), 0);

  return (
    <>
      <Head title="Product Categories" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Product Categories</h1>
            </div>
            <Button 
              size="sm" 
              onClick={openCreateModal}
              className="rounded-xl gap-2 text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30"
            >
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Button>
          </div>

          {/* ── Stats bar ── */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total categories', value: categories.total, valueColor: 'text-slate-900', border: 'border-slate-200', bg: 'bg-white', chip: 'bg-slate-50/80', chipText: 'Structure', icon: <Layers className="h-4 w-4 md:h-5 md:w-5" /> },
              { label: 'Segmented products', value: totalProducts, valueColor: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/30', chip: 'bg-blue-50/80', chipText: 'Products', icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${s.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow ${s.bg}`}>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm text-slate-500">{s.icon}</div>
                  <span className={`text-[8px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full ${s.chip} text-slate-600`}>
                    {s.chipText}
                  </span>
                </div>
                <p className={`text-lg md:text-2xl font-semibold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Table card ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="category-search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by category name..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all"
                />
              </form>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left w-[80px]">Photo</th>
                    <th className="px-5 py-3 text-left">Category Name</th>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-right">Products Count</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <FolderOpen className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No categories found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Create a new category to get started</p>
                      </td>
                    </tr>
                  ) : categories.data.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      
                      {/* Photo Thumbnail */}
                      <td className="px-5 py-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {row.image_url ? (
                            <img
                              src={row.image_url}
                              alt={row.category_name}
                              className="h-full w-full object-cover"
                              onError={e => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Image className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Category Name */}
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {row.category_name}
                        </p>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3 text-xs text-slate-500 max-w-md truncate">
                        {row.category_desc || '-'}
                      </td>

                      {/* Products Count */}
                      <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">
                        {row.products_count}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Edit category"
                            onClick={() => openEditModal(row)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete category"
                            onClick={() => handleDelete(row)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {categories.total > categories.per_page && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Showing <span className="text-slate-800">{categories.data.length}</span> of <span className="text-slate-800">{categories.total}</span> categories
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePage(categories.current_page - 1)}
                    disabled={categories.current_page === 1}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {categories.current_page} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePage(categories.current_page + 1)}
                    disabled={categories.current_page >= totalPages}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </AppLayout>

      {/* Shared Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingCat ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="category_name" className="text-xs font-semibold text-slate-600">Category Name <span className="text-red-500">*</span></Label>
              <Input
                id="category_name"
                value={data.category_name}
                onChange={(e) => setData('category_name', e.target.value)}
                placeholder="e.g. Electronics"
                className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-100"
              />
              {errors.category_name && <p className="text-red-500 text-xs mt-0.5">{errors.category_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category_desc" className="text-xs font-semibold text-slate-600">Category Description</Label>
              <Textarea
                id="category_desc"
                value={data.category_desc}
                onChange={(e) => setData('category_desc', e.target.value)}
                placeholder="Description of the category (optional)"
                rows={3}
                className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-100"
              />
              {errors.category_desc && <p className="text-red-500 text-xs mt-0.5">{errors.category_desc}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image" className="text-xs font-semibold text-slate-600">Category Picture (optional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)}
                className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-100 file:bg-slate-50 file:border-0 file:rounded-lg file:text-xs file:font-semibold text-xs cursor-pointer"
              />
              {errors.image && <p className="text-red-500 text-xs mt-0.5">{errors.image}</p>}
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs font-semibold h-9">Cancel</Button>
              <Button type="submit" disabled={processing} className="rounded-xl text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20">
                {processing ? 'Saving...' : (editingCat ? 'Save Changes' : 'Create Category')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
