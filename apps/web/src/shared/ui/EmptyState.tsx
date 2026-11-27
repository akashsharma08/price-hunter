import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-16 text-center',
        className,
      )}
      role="status"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-elevated text-ink-muted">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden />}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
