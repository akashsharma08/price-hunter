import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-ink-muted">{label}</span> : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-ink placeholder:text-ink-faint',
          'transition-colors hover:border-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
          error && 'border-danger focus:border-danger focus:ring-danger/30',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
    </label>
  );
});
