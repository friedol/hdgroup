import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tag, Copy, Check, Trash2, ToggleLeft, ToggleRight, Plus, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

type PromoCode = {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  usage_limit_per_user?: number | null;
  usage_limit_global?: number | null;
  used_count: number;
  is_active: boolean;
};

const emptyForm = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '' as string | number,
  min_order_amount: '',
  max_discount_amount: '',
  usage_limit_per_user: '',
  usage_limit_global: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
  auto_generate: true,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="ml-2 text-slate-400 hover:text-blue-600 transition-colors" title="Copy code">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function usageBarColor(used: number, limit: number | null): string {
  if (!limit) return 'bg-blue-400';
  const ratio = used / limit;
  if (ratio >= 1) return 'bg-red-400';
  if (ratio >= 0.75) return 'bg-amber-400';
  return 'bg-emerald-400';
}

export default function PromoCodesIndex({ promoCodes }: { promoCodes: PromoCode[] }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo(() => promoCodes || [], [promoCodes]);

  const isExpired = (dt: string | null | undefined) =>
    dt ? new Date(dt) < new Date() : false;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    setSubmitting(true);
    router.post('/promo-codes', {
      ...form,
      discount_value: Number(form.discount_value),
      min_order_amount: form.min_order_amount || null,
      max_discount_amount: form.max_discount_amount || null,
      usage_limit_per_user: form.usage_limit_per_user || null,
      usage_limit_global: form.usage_limit_global || null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
    }, {
      onSuccess: () => { setForm({ ...emptyForm }); setShowForm(false); setSubmitting(false); toast.success('Promo code created!'); },
      onError: () => { setSubmitting(false); toast.error('Failed to create promo code'); },
    });
  };

  const toggleActive = (row: PromoCode) => {
    router.put(`/promo-codes/${row.id}`, { ...row, is_active: !row.is_active }, {
      onSuccess: () => toast.success(row.is_active ? 'Promo code disabled' : 'Promo code activated'),
    });
  };

  const deleteCode = (row: PromoCode) => {
    if (!confirm(`Delete promo code "${row.code}"? This cannot be undone.`)) return;
    router.delete(`/promo-codes/${row.id}`, {
      onSuccess: () => toast.success('Promo code deleted'),
    });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Promo Codes', href: '/promo-codes' }]}>
      <Head title="Promo Codes" />
      <div className="max-w-[1700px] mx-auto space-y-8 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" /> Promo Codes
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] h-10 px-5">
              <Plus className="h-4 w-4 mr-2" /> New Code
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <p className="text-lg sm:text-2xl font-semibold text-slate-900 leading-none">{rows.length}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Total Codes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <p className="text-lg sm:text-2xl font-semibold text-emerald-600 leading-none">{rows.filter(r => r.is_active && !isExpired(r.expires_at)).length}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Active Codes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <p className="text-lg sm:text-2xl font-semibold text-slate-900 leading-none">{rows.reduce((s, r) => s + r.used_count, 0)}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Total Uses</p>
          </div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-5xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" /> New Promo Code
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. SAVE20"
                      value={form.code}
                      onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase(), auto_generate: e.target.value === '' }))}
                      className="h-10 text-sm font-mono uppercase"
                      disabled={form.auto_generate}
                    />
                    <Button
                      type="button"
                      variant={form.auto_generate ? 'default' : 'outline'}
                      size="sm"
                      className="h-10 whitespace-nowrap text-[10px] font-bold uppercase"
                      onClick={() => setForm(p => ({ ...p, auto_generate: !p.auto_generate, code: '' }))}
                    >
                      {form.auto_generate ? 'Auto' : 'Manual'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400">{form.auto_generate ? 'Code will be auto-generated (HD-XXXXXXXX)' : 'Custom code entered above'}</p>
                </div>

                {/* Discount Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount Type</Label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm(p => ({ ...p, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (TZS)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {form.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount (TZS)'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    placeholder={form.discount_type === 'percentage' ? '10' : '500'}
                    value={form.discount_value}
                    onChange={(e) => setForm(p => ({ ...p, discount_value: e.target.value }))}
                    className="h-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Order (TZS)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0 = any" value={form.min_order_amount} onChange={(e) => setForm(p => ({ ...p, min_order_amount: e.target.value }))} className="h-10 text-sm" />
                </div>
                {form.discount_type === 'percentage' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Max Discount (TZS)</Label>
                    <Input type="number" min="0" step="0.01" placeholder="Cap amount" value={form.max_discount_amount} onChange={(e) => setForm(p => ({ ...p, max_discount_amount: e.target.value }))} className="h-10 text-sm" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Global Usage Limit</Label>
                  <Input type="number" min="1" placeholder="∞ unlimited" value={form.usage_limit_global} onChange={(e) => setForm(p => ({ ...p, usage_limit_global: e.target.value }))} className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per-User Limit</Label>
                  <Input type="number" min="1" placeholder="∞ unlimited" value={form.usage_limit_per_user} onChange={(e) => setForm(p => ({ ...p, usage_limit_per_user: e.target.value }))} className="h-10 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valid From</Label>
                  <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm(p => ({ ...p, starts_at: e.target.value }))} className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires At</Label>
                  <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm(p => ({ ...p, expires_at: e.target.value }))} className="h-10 text-sm" />
                </div>
                <div className="flex items-end gap-4 pb-0.5">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                    Activate immediately
                  </label>
                  <Button type="button" variant="outline" className="ml-auto" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="ml-auto bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]">
                    <Plus className="h-4 w-4 mr-2" /> Create Code
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Promo Codes Table */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-4 border-b border-slate-100 px-6">
            <CardTitle className="text-sm font-semibold">All Promo Codes ({rows.length})</CardTitle>
          </CardHeader>
          <div>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Tag className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No promo codes yet</p>
                <p className="text-xs mt-1">Create your first promo code above</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 text-left">Code</th>
                        <th className="px-5 py-3 text-left">Discount</th>
                        <th className="px-5 py-3 text-left">Constraints</th>
                        <th className="px-5 py-3 text-left">Usage</th>
                        <th className="px-5 py-3 text-left">Validity</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => {
                        const expired = isExpired(row.expires_at);
                        const effectivelyActive = row.is_active && !expired;
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Code */}
                            <td className="px-5 py-4">
                              <div className="flex items-center">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs tracking-widest">{row.code}</span>
                                <CopyButton text={row.code} />
                              </div>
                            </td>

                            {/* Discount */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                {row.discount_type === 'percentage'
                                  ? <Percent className="h-3.5 w-3.5 text-blue-500" />
                                  : <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                }
                                <span className="font-semibold text-slate-900">
                                  {row.discount_type === 'percentage' ? `${row.discount_value}%` : `TZS ${Number(row.discount_value).toLocaleString()}`}
                                </span>
                              </div>
                              {row.max_discount_amount && (
                                <p className="text-[10px] text-slate-400 mt-0.5">Cap: TZS {Number(row.max_discount_amount).toLocaleString()}</p>
                              )}
                            </td>

                            {/* Constraints */}
                            <td className="px-5 py-4 text-xs text-slate-500">
                              {row.min_order_amount
                                ? <p>Min: TZS {Number(row.min_order_amount).toLocaleString()}</p>
                                : <p className="text-slate-300">No minimum</p>
                              }
                              {row.usage_limit_per_user
                                ? <p>{row.usage_limit_per_user}x per user</p>
                                : <p className="text-slate-300">Unlimited per user</p>
                              }
                            </td>

                            {/* Usage */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700">{row.used_count}</span>
                                <span className="text-slate-400 text-xs">/ {row.usage_limit_global ?? '∞'}</span>
                              </div>
                              {row.usage_limit_global && (
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${usageBarColor(row.used_count, row.usage_limit_global)}`}
                                    style={{ width: `${Math.min(100, (row.used_count / row.usage_limit_global) * 100)}%` }}
                                  />
                                </div>
                              )}
                            </td>

                            {/* Validity */}
                            <td className="px-5 py-4 text-xs text-slate-500">
                              {row.starts_at && <p>From: {new Date(row.starts_at).toLocaleDateString()}</p>}
                              {row.expires_at
                                ? <p className={expired ? 'text-red-500 font-semibold' : ''}>
                                    {expired ? 'Expired: ' : 'Until: '}{new Date(row.expires_at).toLocaleDateString()}
                                  </p>
                                : <p className="text-slate-300">No expiry</p>
                              }
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4">
                              {effectivelyActive ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase">Active</Badge>
                              ) : expired ? (
                                <Badge className="bg-red-100 text-red-600 border-red-200 text-[10px] font-bold uppercase">Expired</Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] font-bold uppercase">Disabled</Badge>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => toggleActive(row)}
                                  className="h-8 text-[10px] font-bold uppercase gap-1" title={row.is_active ? 'Disable' : 'Enable'}>
                                  {row.is_active
                                    ? <><ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> Disable</>
                                    : <><ToggleLeft className="h-3.5 w-3.5 text-slate-400" /> Enable</>
                                  }
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => deleteCode(row)}
                                  className="h-8 text-[10px] font-bold uppercase text-red-600 border-red-200 hover:bg-red-50 gap-1">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {rows.map((row) => {
                    const expired = isExpired(row.expires_at);
                    const effectivelyActive = row.is_active && !expired;
                    return (
                      <div key={row.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs tracking-widest">{row.code}</span>
                            <CopyButton text={row.code} />
                          </div>
                          {effectivelyActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase shrink-0">Active</Badge>
                          ) : expired ? (
                            <Badge className="bg-red-100 text-red-600 text-[10px] font-bold uppercase shrink-0">Expired</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase shrink-0">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            {row.discount_type === 'percentage' ? <Percent className="h-3.5 w-3.5 text-blue-500" /> : <DollarSign className="h-3.5 w-3.5 text-emerald-500" />}
                            <span className="font-semibold text-slate-900">
                              {row.discount_type === 'percentage' ? `${row.discount_value}%` : `TZS ${Number(row.discount_value).toLocaleString()}`}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">Used: {row.used_count}/{row.usage_limit_global ?? '∞'}</span>
                          {row.expires_at && (
                            <span className={`text-xs ${expired ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                              {expired ? 'Expired ' : 'Until '}{new Date(row.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleActive(row)} className="h-7 text-[10px] font-bold uppercase gap-1">
                            {row.is_active
                              ? <><ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> Disable</>
                              : <><ToggleLeft className="h-3.5 w-3.5 text-slate-400" /> Enable</>
                            }
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCode(row)}
                            className="h-7 text-[10px] font-bold uppercase text-red-600 border-red-200 hover:bg-red-50 gap-1">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
