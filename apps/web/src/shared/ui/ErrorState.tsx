import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this view. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-6 py-16 text-center"
      role="alert"
    >
      <AlertTriangle className="h-8 w-8 text-danger" aria-hidden />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
