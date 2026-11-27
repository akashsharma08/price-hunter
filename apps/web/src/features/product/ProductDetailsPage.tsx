import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, ExternalLink, Sparkles } from 'lucide-react';
import {
  addToWatchlist,
  createAlert,
  fetchProductBySlug,
  fetchProductPriceHistory,
  fetchProducts,
} from '@/shared/api/products';
import { ProductCard } from '@/shared/components/ProductCard';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';
import { formatDate, formatMoney, formatRelative } from '@/shared/lib/format';
import { categoryLabel, getBestOffer } from '@/shared/lib/product-view';
import { cn } from '@/shared/lib/cn';
import { useAuthStore } from '@/store/auth-store';
import { PriceHistoryChart } from './PriceHistoryChart';

export function ProductDetailsPage() {
  const { slug = '' } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [trackMessage, setTrackMessage] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const productQuery = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await fetchProductBySlug(slug)).data,
    enabled: Boolean(slug),
  });

  const historyQuery = useQuery({
    queryKey: ['product-history', productQuery.data?.id],
    queryFn: async () =>
      (await fetchProductPriceHistory(productQuery.data!.id, 180)).data,
    enabled: Boolean(productQuery.data?.id),
  });

  const similarQuery = useQuery({
    queryKey: ['products', 'similar', productQuery.data?.category],
    queryFn: async () => {
      const result = await fetchProducts({
        category: productQuery.data!.category,
        pageSize: 4,
      });
      return result.data.items.filter((p) => p.id !== productQuery.data!.id).slice(0, 3);
    },
    enabled: Boolean(productQuery.data?.category),
  });

  const watchMutation = useMutation({
    mutationFn: async () => {
      if (!productQuery.data) throw new Error('No product');
      return addToWatchlist({
        productId: productQuery.data.id,
        productVariantId: productQuery.data.primaryVariantId ?? undefined,
      });
    },
    onSuccess: () => {
      setTrackMessage('Added to watchlist');
      void queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => setTrackMessage(error.message),
  });

  const alertMutation = useMutation({
    mutationFn: async () => {
      const best = productQuery.data ? getBestOffer(productQuery.data) : null;
      if (!best) throw new Error('No offers available');
      const target = Math.round(best.price.amount * 0.95);
      return createAlert(best.id, target);
    },
    onSuccess: () => {
      setTrackMessage('Price alert created at ~5% below current best offer');
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: Error) => setTrackMessage(error.message),
  });

  const product = productQuery.data;
  const chartSnapshots = useMemo(
    () =>
      (historyQuery.data?.snapshots ?? []).map((snap) => ({
        recordedAt: snap.recordedAt,
        amount: snap.amount,
      })),
    [historyQuery.data],
  );

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <ProductCardSkeleton />
      </div>
    );
  }

  if (productQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          description="Could not load this product from the API."
          onRetry={() => productQuery.refetch()}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Product not found"
          description="This slug is not in the catalog."
          action={
            <Link to="/search">
              <Button variant="secondary">Back to search</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const best = getBestOffer(product);
  const sortedOffers = [...product.offers].sort((a, b) => a.price.amount - b.price.amount);
  const images = product.imageUrls.length ? product.imageUrls : [product.image];

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 lg:px-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <Link to="/search" className="hover:text-ink">
          Search
        </Link>
        <span>/</span>
        <Link to={`/search?category=${product.category}`} className="hover:text-ink">
          {categoryLabel(product.category)}
        </Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <img
              src={images[activeImage] ?? images[0]}
              alt={`${product.name} ${product.variant}`}
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  'h-16 w-16 shrink-0 overflow-hidden rounded-md border',
                  index === activeImage ? 'border-accent' : 'border-border',
                )}
                aria-label={`Show image ${index + 1}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{product.brand}</Badge>
              {product.isDemonstration ? <Badge tone="warning">Demonstration data</Badge> : null}
              {best?.dealLabel ? <Badge tone="lime">{best.dealLabel}</Badge> : null}
            </div>
            <h1 className="font-display text-4xl text-ink sm:text-5xl">{product.name}</h1>
            <p className="text-ink-muted">{product.variant}</p>
            <p className="text-sm leading-relaxed text-ink-muted">{product.description}</p>
          </div>

          {best ? (
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">Best offer</p>
                  <p className="mt-1 font-mono text-3xl text-ink">
                    {formatMoney({ amount: best.price.amount, currency: 'INR' })}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">{best.retailerName}</p>
                </div>
                <div className="text-right text-xs text-ink-faint">
                  <p>Verified {formatRelative(best.price.verifiedAt)}</p>
                  <p className="capitalize">{best.price.availability.replaceAll('_', ' ')}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  disabled={!user || watchMutation.isPending}
                  onClick={() => watchMutation.mutate()}
                  title={user ? 'Add to watchlist' : 'Log in to track prices'}
                >
                  <Bell className="h-4 w-4" />
                  {user ? 'Add to watchlist' : 'Log in to track'}
                </Button>
                <Button
                  variant="secondary"
                  disabled={!user || alertMutation.isPending}
                  onClick={() => alertMutation.mutate()}
                >
                  Create alert
                </Button>
                <Button variant="ghost" disabled title="Retailer deep-links require adapters">
                  <ExternalLink className="h-4 w-4" />
                  Open retailer
                </Button>
              </div>
              {trackMessage ? <p className="mt-3 text-sm text-accent">{trackMessage}</p> : null}
            </div>
          ) : null}

          {historyQuery.data?.lowestObservedPrice ? (
            <p className="text-sm text-ink-muted">
              Lowest observed:{' '}
              <span className="font-mono text-ink">
                {formatMoney({
                  amount: historyQuery.data.lowestObservedPrice.amount,
                  currency: 'INR',
                })}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Retailer offers</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="pb-3 font-medium">Retailer</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Availability</th>
                  <th className="pb-3 font-medium">Verified</th>
                </tr>
              </thead>
              <tbody>
                {sortedOffers.map((offer) => (
                  <tr key={offer.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3">
                      <div className="font-medium text-ink">{offer.retailerName}</div>
                      {offer.dealLabel ? (
                        <span className="text-xs text-lime">{offer.dealLabel}</span>
                      ) : null}
                    </td>
                    <td className="py-3 font-mono text-ink">
                      {formatMoney({ amount: offer.price.amount, currency: 'INR' })}
                    </td>
                    <td className="py-3 capitalize text-ink-muted">
                      {offer.price.availability.replaceAll('_', ' ')}
                    </td>
                    <td className="py-3 text-ink-faint">{formatDate(offer.price.verifiedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Historical price</h2>
            <Badge tone="warning">Immutable snapshots</Badge>
          </div>
          {historyQuery.isLoading ? <ProductCardSkeleton /> : null}
          {historyQuery.data ? <PriceHistoryChart snapshots={chartSnapshots} /> : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Variant attributes</h2>
          {product.variants?.map((variant) => (
            <div key={variant.id} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
                {variant.sku}
              </h3>
              <dl className="divide-y divide-border/80">
                {Object.entries(variant.attributes).map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[1fr_1.2fr] gap-3 py-2.5 text-sm">
                    <dt className="capitalize text-ink-muted">{label}</dt>
                    <dd className="text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
            <h2 className="text-lg font-semibold text-ink">AI buying advisor</h2>
          </div>
          <p className="text-sm leading-relaxed text-ink-muted">
            Coming in a later phase. This placeholder will summarize trade-offs across price
            history, specs, and retailer reliability.
          </p>
          <Button variant="secondary" className="mt-5" disabled>
            Advisor unavailable
          </Button>
        </div>
      </section>

      {similarQuery.data && similarQuery.data.length > 0 ? (
        <section>
          <h2 className="mb-6 font-display text-3xl text-ink">Similar products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarQuery.data.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
