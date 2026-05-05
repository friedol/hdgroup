import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Edit } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface Category {
  id: number;
  category_name: string;
  category_desc?: string;
  image_url?: string;
  products_count: number;
}

interface CategoriesIndexProps {
  categories: { data: Category[]; current_page: number; per_page: number; total: number };
}

export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    category_name: '',
    category_desc: '',
    image: null as File | null,
    _method: 'post',
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCat) {
      data._method = 'put';
      post(`/categories-crud/${editingCat.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    } else {
      data._method = 'post';
      post('/categories-crud', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    }
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '#' },
    { title: 'Categories', href: '#' }
  ];

  const columns = [
    {
      key: 'category_name',
      label: 'Name',
      render: (value: string, row: Category) => (
        <span className="font-medium text-slate-800">{value}</span>
      ),
      sortable: true
    },
    { key: 'category_desc', label: 'Description', sortable: false },
    {
      key: 'products_count',
      label: 'Products',
      sortable: true
    }
  ];

  return (
    <>
      <Head title="Categories" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6 max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-1xl font-bold text-slate-900 tracking-tight leading-none">Product Categories</h1>

            </div>
            <Button onClick={openCreateModal}><Plus className="h-4 w-4 mr-2" />New Category</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
              <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Total Categories</p>
              <p className="text-3xl font-black mt-1 text-slate-900">{categories.total}</p>
            </div>
            <div className="bg-emerald-600 border-none rounded-lg p-5 text-white shadow-lg shadow-emerald-100">
              <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Total Products Segmented</p>
              <p className="text-3xl font-black mt-1">{categories.data.reduce((sum, c) => sum + (Number(c.products_count) || 0), 0)}</p>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-emerald-50/50">
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.data.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">No categories found.</td>
                    </tr>
                  ) : (
                    categories.data.map(row => (
                      <tr key={row.id} className="hover:bg-emerald-50/50">
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <span className="font-medium">{row.category_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.category_desc || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.products_count}</td>
                        <td className="px-4 py-3 text-sm">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50/50 border-t">
              <div className="text-sm text-slate-500">Showing page {categories.current_page} of {Math.ceil(categories.total / categories.per_page) || 1}</div>
              <div className="flex gap-2">
                <button disabled={categories.current_page <= 1} onClick={() => {}} className="px-3 py-1 border rounded text-sm text-slate-700 disabled:opacity-50 hover:bg-white transition-colors">Previous</button>
                <button disabled={categories.current_page >= Math.ceil(categories.total / categories.per_page)} onClick={() => {}} className="px-3 py-1 border rounded text-sm text-slate-700 disabled:opacity-50 hover:bg-white transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>

      {/* Shared Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_name">Category Name <span className="text-red-500">*</span></Label>
              <Input
                id="category_name"
                value={data.category_name}
                onChange={(e) => setData('category_name', e.target.value)}
                placeholder="e.g. Electronics"
              />
              {errors.category_name && <p className="text-red-500 text-xs">{errors.category_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_desc">Category Description</Label>
              <Textarea
                id="category_desc"
                value={data.category_desc}
                onChange={(e) => setData('category_desc', e.target.value)}
                placeholder="Description of the category (optional)"
                rows={3}
              />
              {errors.category_desc && <p className="text-red-500 text-xs">{errors.category_desc}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Category Picture (optional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)}
              />
              {errors.image && <p className="text-red-500 text-xs">{errors.image}</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : (editingCat ? 'Save Changes' : 'Create Category')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
