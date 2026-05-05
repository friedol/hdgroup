import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'date' | 'datetime' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

interface FormProps {
  fields: FormField[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  columns?: number;
}

export function Form({
  fields,
  values,
  errors,
  onChange,
  onSubmit,
  loading = false,
  submitText = "Save",
  cancelText = "Cancel",
  onCancel,
  columns = 1
}: FormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className={`grid grid-cols-1 ${columns > 1 ? `lg:grid-cols-${columns}` : ''} gap-6`}>
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                placeholder={field.placeholder}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={field.disabled || loading}
                className="min-h-[100px]"
              />
            ) : field.type === 'select' ? (
              <Select
                value={values[field.name] || ''}
                onValueChange={(value) => onChange(field.name, value)}
                disabled={field.disabled || loading}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={field.disabled || loading}
              />
            )}

            {field.hint && (
              <p className="text-xs text-slate-500">{field.hint}</p>
            )}
            {errors[field.name] && (
              <p className="text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : submitText}
        </Button>
      </div>
    </form>
  );
}

export default Form;
