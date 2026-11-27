import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { PriceTrend as Trend } from '@price-hunter/shared';
import { cn } from '@/shared/lib/cn';

export function PriceTrendIndicator({
  trend,
  className,
}: {
  trend: Trend;
  className?: string;
}) {
  if (trend === 'down') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-success', className)}>
        <TrendingDown className="h-3.5 w-3.5" aria-hidden />
        <span className="text-xs font-medium">Falling</span>
      </span>
    );
  }
  if (trend === 'up') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-danger', className)}>
        <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        <span className="text-xs font-medium">Rising</span>
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-ink-faint', className)}>
      <Minus className="h-3.5 w-3.5" aria-hidden />
      <span className="text-xs font-medium">Stable</span>
    </span>
  );
}
