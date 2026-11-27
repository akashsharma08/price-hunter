import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="PRICE HUNTER home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-elevated">
        <span className="absolute inset-0 rounded-md bg-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" aria-hidden>
          <path
            d="M4 18V6h2.4c1.8 0 2.9.95 2.9 2.45 0 .95-.5 1.7-1.35 2.05L10.8 18H8.9l-2-3.9H6.5V18H4zm2-5.4h.55c.85 0 1.3-.4 1.3-1.05S7.4 10.5 6.55 10.5H6v2.1z"
            fill="currentColor"
            className="text-accent"
          />
          <path
            d="M12.5 18l3.15-9h1.95L21 18h-2.05l-.55-1.6h-3.15L14.7 18H12.5zm3.9-3.1h2.05l-1-2.95-1.05 2.95z"
            fill="currentColor"
            className="text-lime"
          />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl tracking-wide text-ink">PRICE HUNTER</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
            India price intelligence
          </span>
        </span>
      ) : null}
    </Link>
  );
}
