import { Link } from '@inertiajs/react';
import type { AnchorHTMLAttributes } from 'react';

interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
}

export default function TextLink({ href, children, className = '', ...props }: TextLinkProps) {
    return (
        <Link
            href={href}
            {...props}
            className={`text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors ${className}`}
        >
            {children}
        </Link>
    );
}
