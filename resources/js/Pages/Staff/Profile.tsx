import { Head, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
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
  FileText
} from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { auth } = usePage().props as any;
  const user = auth.user;
  const [activeTab, setActiveTab] = useState("info");

  // Profile Update Form
  const { data, setData, post, processing, errors } = useForm({
    customer: user.staff_name || user.name || "",
    email: user.staff_email || user.email || "",
    phone: user.staff_phone || user.phone || "",
    city: user.location || user.city || "",
    street: user.street || "",
    country: user.country || "Tanzania",
    tin_number: user.tin_number || "",
  });

  // Password Change Form
  const passwordForm = useForm({
    password: "",
    password_confirm: "",
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    post("/profile/update");
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
      
      <div className="max-w-[1700px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative mb-8">
            <div className="h-32 w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg border border-white/10" />
            <div className="absolute -bottom-6 left-8 flex items-end gap-6">
                <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-xl">
                    <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-blue-600 border border-slate-200">
                        <User size={40} strokeWidth={1.5} />
                    </div>
                </div>
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-white drop-shadow-sm">{user.staff_name || user.name}</h1>
                    <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
                        <ShieldCheck size={14} />
                        <span>{user.staff_id || "Staff Member"}</span>
                        <span className="opacity-40">•</span>
                        <span>{auth.role_name || "Employee"}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-3">
                <nav className="flex flex-col gap-1">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'info' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <User size={18} />
                        Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab("password")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'password' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Lock size={18} />
                        Password & Security
                    </button>
                </nav>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">System Info</h3>
                    <div className="space-y-4 text-xs font-medium">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-slate-500">Joined</span>
                            <span className="text-slate-800">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <span className="text-slate-500">Staff ID</span>
                            <span className="text-blue-600 font-bold">{user.staff_id || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <span className="text-slate-500">Status</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9">
                {activeTab === "info" ? (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                            <p className="text-sm text-slate-500 mt-1">Manage your basic information and contact details.</p>
                        </div>
                        
                        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <IdCard size={12} className="text-blue-500" />
                                        Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.customer}
                                        onChange={e => setData('customer', e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
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
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
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
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
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
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
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
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
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
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    disabled={processing}
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
                            <p className="text-sm text-slate-500 mt-1">Update your password to keep your account secure.</p>
                        </div>

                        <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                            <div className="max-w-md space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                                        <Lock size={12} className="text-blue-500" />
                                        New Password
                                    </label>
                                    <input 
                                        type="password" 
                                        value={passwordForm.data.password}
                                        onChange={e => passwordForm.setData('password', e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
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
                                        className="w-full h-11 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all text-sm outline-none"
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
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
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
