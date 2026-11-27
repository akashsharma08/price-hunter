import type { CurrencyCode, Money } from '@price-hunter/shared';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatMoney(money: Money | { amount: number; currency: CurrencyCode }): string {
  if (money.currency === 'INR') {
    return inrFormatter.format(money.amount);
  }
  return `${money.currency} ${money.amount.toLocaleString('en-IN')}`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatRelative(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(deltaMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function discountPercent(current: number, previous: number): number {
  if (previous <= 0 || current >= previous) return 0;
  return Math.round(((previous - current) / previous) * 100);
}
