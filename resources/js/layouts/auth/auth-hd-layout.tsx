import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthHdLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { systemLogo, businessName } = usePage().props as any;

    return (
        <div className="relative flex min-h-svh items-center justify-center bg-background p-4 dark:bg-zinc-950 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-5%] h-64 w-64 rounded-full blur-[100px]" style={{ backgroundColor: 'rgba(58,157,117,0.12)' }} />
            <div className="absolute bottom-[10%] right-[-10%] h-96 w-96 rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(58,157,117,0.07)' }} />
            <div className="absolute top-[20%] right-[10%] h-32 w-32 rounded-full blur-[60px]" style={{ backgroundColor: 'rgba(58,157,117,0.10)' }} />

            <div className="relative z-10 flex w-full max-w-[950px] overflow-hidden rounded-xl bg-white shadow-xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                {/* Left Side - Banner */}
                <div className="relative hidden w-[42%] lg:block overflow-hidden" style={{ backgroundColor: '#3a9d75' }}>
                    
                    <div className="relative flex h-full flex-col p-12 text-zinc-900 border-r border-black/10 shadow-2xl">
                        {/* Circle Logo Area */}
                        <div className="flex flex-col items-center justify-center mb-10">
                            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/40 border border-white/60 backdrop-blur-xl p-6 overflow-hidden transition-all duration-700 hover:scale-105 shadow-xl">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                                {systemLogo ? (
                                    <img src={systemLogo} alt={businessName} className="relative z-10 size-20 object-cover rounded-full" />
                                ) : (
                                    <AppLogoIcon className="relative z-10 size-20 fill-current text-zinc-900" />
                                )}
                            </div>
                            
                            <div className="mt-8 text-center text-zinc-900">
                                <h2 className="text-[22px] font-black tracking-tight uppercase leading-tight">
                                    Welcome to <br />
                                    <span className="text-white drop-shadow-sm">{businessName || 'HD GROUP'}</span>
                                </h2>
                                <p className="mt-3 text-[10px] font-bold text-zinc-800/70 max-w-[280px] leading-relaxed uppercase tracking-wider">
                                
                                </p>
                            </div>
                        </div>

                        {/* Feature Cards - High Contrast on Blue */}
                        <div className="space-y-3 mt-auto">
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/10 border border-zinc-900/10 backdrop-blur-sm hover:translate-x-2 transition-transform duration-300">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </div>
                                <div className="text-zinc-900">
                                    <h4 className="font-extrabold text-xs uppercase tracking-tight">Quality Products</h4>
                                    <p className="text-[9px] font-bold opacity-60 leading-tight">Get Quality Products</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/10 border border-zinc-900/10 backdrop-blur-sm hover:translate-x-2 transition-transform duration-300">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-zinc-900">
                                    <h4 className="font-extrabold text-xs uppercase tracking-tight">Fast Delivery</h4>
                                    <p className="text-[9px] font-bold opacity-60 leading-tight">Get your products delivered to your doorstep in no time</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/10 border border-zinc-900/10 backdrop-blur-sm hover:translate-x-2 transition-transform duration-300">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="text-zinc-900">
                                    <h4 className="font-extrabold text-xs uppercase tracking-tight">24/7 Customer Support</h4>
                                    <p className="text-[9px] font-bold opacity-60 leading-tight">Get support anytime you need it</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form Container */}
                <div className="flex flex-1 flex-col p-6 md:p-10 lg:p-12">
                    {/* Header with Centered Logo */}
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center p-0 overflow-hidden rounded-full shadow-lg">
                             {systemLogo ? (
                                <img src={systemLogo} alt={businessName} className="h-full w-full object-cover rounded-full" />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full p-2.5" style={{ backgroundColor: '#3a9d75' }}>
                                    <AppLogoIcon className="size-full fill-current text-white" />
                                </div>
                            )}
                        </div>
                        
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
                        
                        </p>
                        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                            {title === 'Login' ? 'Welcome Back' : title}
                        </h1>
                        <p className="mt-1 text-[10px] font-medium text-zinc-400">
                            {title === 'Login' ? 'Sign in to continue to your account' : description}
                        </p>
                    </div>

                    {/* Flash Message Overlay */}
                    {(usePage().props.flash as any)?.message && (
                        <div className={`mt-6 p-4 rounded-lg border text-xs font-bold text-center animate-in fade-in slide-in-from-top-2 duration-500 ${
                            (usePage().props.flash as any).status === 'warning' 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100' 
                                : 'bg-green-50 border-green-200 text-green-700 shadow-sm shadow-green-100'
                        }`}>
                            <div className="flex items-center justify-center gap-2">
                                {(usePage().props.flash as any).status === 'warning' ? (
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                ) : (
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                <span>{(usePage().props.flash as any).message}</span>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 scrollbar-hide flex-1">
                        {children}
                    </div>

                    {/* Footer attribution */}
                    <div className="mt-auto border-t pt-8 dark:border-zinc-800 text-center">
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.3em]">
                            © {new Date().getFullYear()} {businessName || 'Jopo Juniours Co. Ltd'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
