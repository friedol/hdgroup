import type { HTMLAttributes } from 'react';

interface InputErrorProps extends HTMLAttributes<HTMLParagraphElement> {
    message?: string;
}

export default function InputError({ message, className = '', ...props }: InputErrorProps) {
    return message ? (
        <p
            {...props}
            className={'text-xs font-medium text-red-600 dark:text-red-400 ' + className}
        >
            {message}
        </p>
    ) : null;
}
