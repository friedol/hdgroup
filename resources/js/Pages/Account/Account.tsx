import { Head, router, usePage } from '@inertiajs/react';
import { User, Lock, Mail, Phone, MapPin, ShieldCheck, Camera, Edit2, Save, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CustomLayout from '@/layouts/app/custom-layout';

interface UserData {
    name?: string;
    email?: string;
    phone?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    staff_name?: string;
    staff_email?: string;
    staff_phone?: string;
    country?: string;
    city?: string;
    street?: string;
    tin_number?: string;
    created_at?: string;
    profile?: string;
}

interface Props {
    user: UserData;
    tab?: 'profile' | 'password';
}

export default function Account({ user, tab = 'profile' }: Props) {
    const page = usePage<{ flash?: { success?: string; invalid?: string } }>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentTab, setCurrentTab] = useState<'profile' | 'password'>(tab);
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const resolvedName = user.name || user.customer_name || user.staff_name || '';
    const resolvedEmail = user.email || user.customer_email || user.staff_email || '';
    const resolvedPhone = user.phone || user.customer_phone || user.staff_phone || '';
    const resolvedProfile = user.profile || '';

    const buildProfileUrl = (path?: string) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('/')) return path;
        return `/storage/${path}`;
    };

    const [profilePreview, setProfilePreview] = useState<string | null>(buildProfileUrl(resolvedProfile));

    const [formData, setFormData] = useState({
        customer: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        country: user.country || 'Tanzania',
        city: user.city || '',
        street: user.street || '',
        tin_number: user.tin_number || '',
        profile: null as File | null,
    });

    const [passwordData, setPasswordData] = useState({
        password: '',
        password_confirm: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({ ...prev, profile: file }));

        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setProfilePreview(previewUrl);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setPasswordData(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);

        router.post('/profile/update', formData, {
            forceFormData: true,
            onFinish: () => {
                setIsSavingProfile(false);
                setIsEditing(false);
            },
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPassword(true);

        router.post('/password/change', passwordData, {
            onFinish: () => {
                setIsSavingPassword(false);
                setPasswordData({ password: '', password_confirm: '' });
            },
        });
    };

    return (
        <CustomLayout>
            <Head title="Customer Profile" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Header Section */}
                <section className="relative bg-blue-600 text-white overflow-hidden pt-8 pb-20">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </section>

                {/* Main Content Wrapper */}
                <div className="mx-auto w-[99%] max-w-[1920px] px-2 sm:px-4">
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 -mt-16 pb-8 relative z-20">
                    {/* Left: Profile Card */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 sticky lg:top-24">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 rounded-full border-4 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden flex items-center justify-center shadow-md">
                                        {profilePreview ? (
                                            <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-blue-400" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition-colors"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProfileFileChange}
                                />
                                <h2 className="text-xl font-bold text-slate-900 mb-1">{resolvedName || 'User Profile'}</h2>
                                <p className="text-sm text-slate-600 mb-4">{resolvedEmail}</p>
                                
                              

                                {!isEditing && (
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Alerts */}
                        {page.props.flash?.success && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 flex items-start gap-2">
                                <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                {page.props.flash.success}
                            </div>
                        )}

                        {page.props.flash?.invalid && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {page.props.flash.invalid}
                            </div>
                        )}

                        {/* Tab Navigation */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setCurrentTab('profile')}
                                className={`py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                                    currentTab === 'profile'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                            >
                                <User className="w-4 h-4 mr-2 inline-block" />
                                Profile
                            </button>
                            <button
                                onClick={() => setCurrentTab('password')}
                                className={`py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                                    currentTab === 'password'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                            >
                                <Lock className="w-4 h-4 mr-2 inline-block" />
                                Password
                            </button>
                        </div>

                        {/* Profile Tab Content */}
                        {currentTab === 'profile' && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 space-y-6">
                                {!isEditing ? (
                                    <div className="space-y-4">
                                        {/* View Mode - Info Cards Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InfoCard icon={User} label="Full Name" value={resolvedName} />
                                            <InfoCard icon={Mail} label="Email Address" value={resolvedEmail} />
                                            <InfoCard icon={Phone} label="Phone Number" value={resolvedPhone} />
                                            <InfoCard icon={ShieldCheck} label="TIN Number" value={user.tin_number} />
                                            <InfoCard icon={MapPin} label="Country" value={user.country} />
                                            <InfoCard icon={MapPin} label="City" value={user.city} />
                                            <div className="md:col-span-2">
                                                <InfoCard icon={MapPin} label="Street Address" value={user.street} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveProfile} className="space-y-6">
                                        {/* Edit Mode - Form Fields Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField icon={User} label="Full Name" id="customer" value={formData.customer} onChange={handleInputChange} required />
                                            <FormField icon={Mail} label="Email Address" id="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                            <FormField icon={Phone} label="Phone Number" id="phone" value={formData.phone} onChange={handleInputChange} required />
                                            <FormField icon={ShieldCheck} label="TIN Number" id="tin_number" value={formData.tin_number} onChange={handleInputChange} />
                                            <FormField icon={MapPin} label="Country" id="country" value={formData.country} onChange={handleInputChange} />
                                            <FormField icon={MapPin} label="City" id="city" value={formData.city} onChange={handleInputChange} />
                                            <div className="md:col-span-2">
                                                <FormField icon={MapPin} label="Street Address" id="street" value={formData.street} onChange={handleInputChange} />
                                            </div>
                                        </div>

                                        {/* Photo Upload in Edit Mode */}
                                        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                            <Camera className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                            <p className="text-sm font-bold text-blue-900">Click to change profile photo</p>
                                            <p className="text-xs text-blue-700 mt-1">or drag and drop</p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isSavingProfile}
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({
                                                        customer: resolvedName,
                                                        email: resolvedEmail,
                                                        phone: resolvedPhone,
                                                        country: user.country || 'Tanzania',
                                                        city: user.city || '',
                                                        street: user.street || '',
                                                        tin_number: user.tin_number || '',
                                                        profile: null,
                                                    });
                                                    setProfilePreview(buildProfileUrl(resolvedProfile));
                                                }}
                                                className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Password Tab Content */}
                        {currentTab === 'password' && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 space-y-6">
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={passwordData.password}
                                                onChange={handlePasswordChange}
                                                className="h-12 pl-11 border-slate-200 rounded-lg font-medium"
                                                placeholder="Enter new password"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                            <Input
                                                id="password_confirm"
                                                type="password"
                                                value={passwordData.password_confirm}
                                                onChange={handlePasswordChange}
                                                className="h-12 pl-11 border-slate-200 rounded-lg font-medium"
                                                placeholder="Confirm password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSavingPassword}
                                        className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors"
                                    >
                                        {isSavingPassword ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </form>

                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                    <p className="text-xs font-bold text-blue-800 flex items-start gap-2">
                                        <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <span>Use a strong password with at least 8 characters, including letters, numbers, and symbols for better security.</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}

// Helper Components for Form Fields and Info Cards
interface IconProps {
    className?: string;
}

type IconComponent = React.ComponentType<IconProps>;

function FormField({
    icon: Icon,
    label,
    id,
    type = 'text',
    value,
    onChange,
    required = false,
}: {
    icon: IconComponent;
    label: string;
    id: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}) {
    return (
        <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">{label}</label>
            <div className="relative">
                <div className="absolute left-3 top-3.5 text-slate-400">
                    <Icon className="w-5 h-5" />
                </div>
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    className="h-12 pl-11 border-slate-200 rounded-lg font-medium focus:border-blue-500 focus:ring-blue-200"
                    required={required}
                />
            </div>
        </div>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
}: {
    icon: IconComponent;
    label: string;
    value?: string;
}) {
    return (
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
            <div className="text-blue-500 pt-1">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
                <p className="text-sm font-bold text-slate-900 mt-1 break-words">{value || <span className="text-slate-400 italic">Not set</span>}</p>
            </div>
        </div>
    );
}
