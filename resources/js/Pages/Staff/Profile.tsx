import { Head, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  Lock, 
  Save, 
  Building2, 
  Calendar,
  ShieldCheck,
  Smartphone,
  MapPin,
  FileText,
  Camera,
  Upload
} from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { auth } = usePage().props as any;
  const user = auth.user;
  const [activeTab, setActiveTab] = useState("info");
  const [preview, setPreview] = useState<string | null>(null);

  // Profile Update Form
  const { data, setData, post, processing, errors } = useForm({
    customer: user.staff_name || user.name || "",
    email: user.staff_email || user.email || "",
    phone: user.staff_phone || user.phone || "",
    city: user.location || user.city || "",
    street: user.street || "",
    country: user.country || "Tanzania",
    tin_number: user.tin_number || "",
    profile: null as File | null,
  });

  // Password Change Form
  const passwordForm = useForm({
    password: "",
    password_confirm: "",
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    post("/profile/update", {
      forceFormData: true,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.post("/password/change", {
      onSuccess: () => passwordForm.reset(),
    });
  };

  return (
    <AppLayout>
      <Head title="My Profile" />
      
      <div className="w-full mx-auto py-8 px-0">


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sidebar Left Panel */}
            <div className="lg:col-span-3 space-y-8">
                {/* Profile Picture Box View */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="aspect-square w-full rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden relative group">
                        {preview || user.profile ? (
                            <img 
                                src={preview || (user.profile?.startsWith('http') ? user.profile : `/storage/${user.profile}`)} 
                                alt={user.staff_name} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User size={60} strokeWidth={1} />
                        )}
                        
                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={24} className="text-white mb-1" />
                            <span className="text-[10px] text-white font-bold uppercase tracking-widest">Update Photo</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setData('profile', file);
                                        setPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </label>
                    </div>
                    
                    <div className="mt-4 text-center">
                        <h1 className="text-lg font-bold text-slate-900 leading-tight">{user.staff_name || user.name}</h1>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{auth.role_name || "Employee"}</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-1.5">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'info' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <User size={18} />
                        Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab("password")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'password' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Lock size={18} />
                        Password & Security
                    </button>
                </nav>

                <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-5 px-1">System Meta</h3>
                    <div className="space-y-4 text-xs font-semibold">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-slate-400 font-medium tracking-tight">Joined Date</span>
                            <span className="text-slate-800 tabular-nums">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-slate-400 font-medium tracking-tight">Official Staff ID</span>
                            <span className="text-blue-600 tabular-nums font-bold">{user.staff_id || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-slate-400 font-medium tracking-tight">Account Status</span>
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0 px-2 rounded-lg font-bold">Active</Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9">
                {activeTab === "info" ? (
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800">Personal Information</h2>
                            <p className="text-[13px] text-slate-500 mt-1 font-medium">Manage your basic information and contact details.</p>
                        </div>
                        
                        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-1.5">
                                        <IdCard size={12} className="text-blue-400" />
                                        Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.customer}
                                        onChange={e => setData('customer', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                    />
                                    {errors.customer && <p className="text-xs text-rose-500 mt-1">{errors.customer}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <Mail size={12} className="text-blue-500" />
                                        Email Address
                                    </label>
                                    <input 
                                        type="email" 
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                    />
                                    {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <Smartphone size={12} className="text-blue-500" />
                                        Phone Number
                                    </label>
                                    <input 
                                        type="tel" 
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                    />
                                    {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <FileText size={12} className="text-blue-500" />
                                        TIN Number
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.tin_number}
                                        onChange={e => setData('tin_number', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                        placeholder="Enter your TIN number"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <Building2 size={12} className="text-blue-500" />
                                        City
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.city}
                                        onChange={e => setData('city', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <MapPin size={12} className="text-blue-500" />
                                        Street Address
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.street}
                                        onChange={e => setData('street', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    disabled={processing}
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-900 text-white font-bold text-sm shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800">Security & Password</h2>
                            <p className="text-[13px] text-slate-500 mt-1 font-medium">Update your password to keep your account secure.</p>
                        </div>

                        <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                            <div className="max-w-md space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-1.5">
                                        <Lock size={12} className="text-blue-400" />
                                        New Password
                                    </label>
                                    <input 
                                        type="password" 
                                        value={passwordForm.data.password}
                                        onChange={e => passwordForm.setData('password', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                        placeholder="Minimum 8 characters"
                                    />
                                    {passwordForm.errors.password && <p className="text-xs text-rose-500 mt-1">{passwordForm.errors.password}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <ShieldCheck size={12} className="text-blue-500" />
                                        Confirm New Password
                                    </label>
                                    <input 
                                        type="password" 
                                        value={passwordForm.data.password_confirm}
                                        onChange={e => passwordForm.setData('password_confirm', e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                        placeholder="Repeat your new password"
                                    />
                                    {passwordForm.errors.password_confirm && <p className="text-xs text-rose-500 mt-1">{passwordForm.errors.password_confirm}</p>}
                                </div>

                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Security Advice</p>
                                        <p className="text-xs font-medium text-amber-700 mt-0.5 leading-relaxed">
                                            For your security, use a strong password with a mix of uppercase, lowercase, numbers, and symbols. Avoid using common words or personal info.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        disabled={passwordForm.processing}
                                        type="submit"
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-sm shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        <Lock size={18} />
                                        {passwordForm.processing ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
