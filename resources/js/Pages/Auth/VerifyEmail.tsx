// Components
import { Form, Head, Link, usePage } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import verification from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            {(usePage().props.flash as any)?.message && (
                <div className={`mb-4 text-center text-sm font-medium p-3 rounded-lg border ${
                    (usePage().props.flash as any).status === 'warning' 
                        ? 'text-[#3a9d75] bg-green-50 border-green-200'
                        : 'text-green-600 bg-green-50 border-green-200'
                }`}>
                    {(usePage().props.flash as any).message}
                </div>
            )}

            <Form {...verification.send.customer.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} className="bg-[#3a9d75] hover:bg-[#2d8a63] text-white border-none">
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>

                        <Link
                            href={logout().url}
                            method="post"
                            as="button"
                            className="mx-auto block text-sm border-none bg-transparent shadow-none text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                        >
                            Log out
                        </Link>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
