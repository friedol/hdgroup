import { Form, Head, Link } from '@inertiajs/react';
import { home } from '@/routes';
import { Mail, Lock, UserPlus, Home } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <AuthLayout
            title="Welcome Back"
            description=""
        >
            <Head title="Log in" />

            <Form
                action="/authenticate" method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email_or_phone">Email or Phone</Label>
                                <Input
                                    id="email_or_phone"
                                    type="text"
                                    name="email_or_phone"
                                    icon={<Mail className="size-4" />}
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com or Phone"
                                />
                                <InputError message={errors.email_or_phone} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    icon={<Lock className="size-4" />}
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                    />
                                    <Label htmlFor="remember" className="text-xs text-zinc-500">Remember me</Label>
                                </div>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs font-semibold text-orange-500 hover:text-orange-600 no-underline"
                                        tabIndex={5}
                                    >
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-amber-400 hover:bg-amber-500 text-black rounded-md font-bold text-sm tracking-wide shadow-md shadow-amber-200/50 border-none transition-all duration-300"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing ? <Spinner /> : 'Sign In'}
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
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="flex-1 h-12 flex items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-zinc-600 font-semibold text-xs hover:bg-zinc-100 transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                                    >
                                        <UserPlus className="size-4 mr-2" />
                                        Create Account
                                    </Link>
                                )}

                                <Link
                                    href={home()}
                                    className="flex-1 h-12 flex items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-zinc-400 font-semibold text-xs hover:text-amber-600 transition-all dark:bg-zinc-800 dark:border-zinc-700"
                                >
                                    <Home className="size-4 mr-2" />
                                    Home
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
