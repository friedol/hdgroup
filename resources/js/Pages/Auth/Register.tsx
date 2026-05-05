import { Form, Head, Link } from '@inertiajs/react';
import { home } from '@/routes';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { useForm } from '@inertiajs/react';

import { Home, LogIn } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        staff_name: '',
        customer_email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <AuthLayout
            title="Register"
            description="Create your business account"
        >
            <Head title="Register" />
            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    {/* Full Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="staff_name">Full Name</Label>
                        <Input
                            id="staff_name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            name="staff_name"
                            value={data.staff_name}
                            onChange={e => setData('staff_name', e.target.value)}
                            placeholder="Your full name"
                        />
                        <InputError message={errors.staff_name} className="mt-2" />
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="customer_email">Email address</Label>
                        <Input
                            id="customer_email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            name="customer_email"
                            value={data.customer_email}
                            onChange={e => setData('customer_email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.customer_email} />
                    </div>

                    {/* Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            name="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            placeholder="At least 8 characters"
                        />
                        <InputError message={errors.password} />
                    </div>

                    {/* Confirm Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <PasswordInput
                            id="password_confirmation"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-12 bg-amber-400 hover:bg-amber-500 text-black rounded-md font-bold text-sm tracking-wide shadow-md shadow-amber-200/50 border-none transition-all duration-300"
                            tabIndex={5}
                            disabled={processing}
                            data-test="register-user-button"
                        >
                            {processing ? <Spinner /> : 'Create Account'}
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="relative w-full flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-100 dark:border-zinc-800" />
                        </div>
                        <span className="relative bg-white dark:bg-zinc-900 px-3 text-[10px] font-medium text-zinc-300 uppercase tracking-widest">
                            OR
                        </span>
                    </div>

                    <div className="flex w-full items-center gap-3">
                        <Link
                            href="/login"
                            className="flex-1 h-12 flex items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-zinc-600 font-semibold text-xs hover:bg-zinc-100 transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                        >
                            <LogIn className="size-4 mr-2" />
                            Log in
                        </Link>

                        <Link
                            href={home()}
                            className="flex-1 h-12 flex items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-zinc-400 font-semibold text-xs hover:text-amber-600 transition-all dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <Home className="size-4 mr-2" />
                            Home
                        </Link>
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}
