import { Eye, EyeOff } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

export default function PasswordInput({ className = '', ...props }: PasswordInputProps) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative">
            <Input
                {...props}
                type={show ? 'text' : 'password'}
                className={'pr-10 ' + className}
            />
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShow(!show)}
            >
                {show ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                )}
            </Button>
        </div>
    );
}
