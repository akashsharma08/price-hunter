import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Settings, ShoppingBag, Watch } from 'lucide-react';
import {
  fetchAlerts,
  fetchMe,
  fetchNotifications,
  fetchWatchlist,
} from '@/shared/api/products';
import { formatMoney, formatRelative } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Input } from '@/shared/ui/Input';
import { cn } from '@/shared/lib/cn';
import { useAuthStore } from '@/store/auth-store';

type Tab = 'watchlist' | 'tracked' | 'alerts' | 'notifications' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof Watch }[] = [
  { id: 'watchlist', label: 'Watchlist', icon: Watch },
  { id: 'tracked', label: 'Tracked', icon: ShoppingBag },
  { id: 'alerts', label: 'Price alerts', icon: Bell },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Account settings', icon: Settings },
];

export function DashboardPage() {
  const [tab, setTab] = useState<Tab>('watchlist');
  const user = useAuthStore((s) => s.user);
  const enabled = Boolean(user);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await fetchMe()).data,
    enabled,
  });
  const watchlistQuery = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => (await fetchWatchlist()).data,
    enabled,
  });
  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await fetchAlerts()).data,
    enabled,
  });
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await fetchNotifications()).data,
    enabled,
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Sign in to open your dashboard"
          description="Watchlist, alerts, and notifications require an authenticated session."
          action={
            <Link to="/login">
              <Button>Log in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-8 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Dashboard</p>
          <Badge tone="accent">Authenticated API</Badge>
        </div>
        <h1 className="font-display text-4xl text-ink">Your shopping intelligence</h1>
        <p className="max-w-2xl text-sm text-ink-muted">
          Signed in as {user.email}. Data is served from NestJS + PostgreSQL.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border border-border bg-surface p-2">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Dashboard sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink',
                  tab === id && 'bg-surface-hover text-ink',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6">
          {tab === 'watchlist' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ink">Watchlist</h2>
              {watchlistQuery.isError ? (
                <ErrorState onRetry={() => watchlistQuery.refetch()} />
              ) : null}
              {watchlistQuery.data?.length === 0 ? (
                <EmptyState
                  title="Watchlist is empty"
                  description="Save products from product pages to track them here."
                />
              ) : null}
              <ul className="divide-y divide-border">
                {(watchlistQuery.data ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt=""
                        className="h-14 w-14 rounded-md border border-border object-cover"
                      />
                      <div>
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="font-medium text-ink hover:text-accent"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-ink-faint">
                          Added {formatRelative(item.addedAt)}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-lg text-ink">
                      {item.product.bestPrice
                        ? formatMoney({
                            amount: item.product.bestPrice.amount,
                            currency: 'INR',
                          })
                        : '—'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tab === 'tracked' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ink">Tracked products</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(watchlistQuery.data ?? []).map((item) => (
                  <Link
                    key={item.id}
                    to={`/products/${item.product.slug}`}
                    className="rounded-md border border-border bg-canvas p-4 transition-colors hover:border-accent/40"
                  >
                    <p className="font-medium text-ink">{item.product.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">{item.product.brand}</p>
                    <p className="mt-3 font-mono text-ink">
                      {item.product.bestPrice
                        ? formatMoney({
                            amount: item.product.bestPrice.amount,
                            currency: 'INR',
                          })
                        : '—'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {tab === 'alerts' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ink">Price alert overview</h2>
              {alertsQuery.isError ? <ErrorState onRetry={() => alertsQuery.refetch()} /> : null}
              <ul className="space-y-3">
                {(alertsQuery.data ?? []).map((alert) => (
                  <li
                    key={alert.id}
                    className="flex flex-col gap-3 rounded-md border border-border bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link
                        to={`/products/${alert.productSlug}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {alert.productName}
                      </Link>
                      <p className="mt-1 text-sm text-ink-muted">
                        Target {formatMoney({ amount: alert.targetPrice.amount, currency: 'INR' })} ·
                        Current{' '}
                        {formatMoney({ amount: alert.currentPrice.amount, currency: 'INR' })}
                      </p>
                    </div>
                    <Badge tone={alert.isActive ? 'accent' : 'neutral'}>
                      {alert.isActive ? 'active' : 'paused'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tab === 'notifications' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ink">Notification history</h2>
              <ul className="divide-y divide-border">
                {(notificationsQuery.data ?? []).map((note) => (
                  <li key={note.id} className="flex gap-3 py-4">
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        note.readAt ? 'bg-border' : 'bg-accent',
                      )}
                      aria-hidden
                    />
                    <div>
                      <p className="font-medium text-ink">{note.title}</p>
                      <p className="mt-1 text-sm text-ink-muted">{note.message}</p>
                      <p className="mt-2 text-xs text-ink-faint">
                        {formatRelative(note.createdAt)} · {note.type.replaceAll('_', ' ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tab === 'settings' ? (
            <div className="max-w-lg space-y-5">
              <h2 className="text-xl font-semibold text-ink">Account settings</h2>
              <Input
                label="Display name"
                defaultValue={meQuery.data?.name ?? user.name}
                name="displayName"
                disabled
              />
              <Input
                label="Email"
                type="email"
                defaultValue={meQuery.data?.email ?? user.email}
                name="email"
                disabled
              />
              <Input label="Preferred currency" defaultValue="INR" name="currency" disabled />
              <p className="text-sm text-ink-muted">
                Profile edits will land with a dedicated users update endpoint in a later phase.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
