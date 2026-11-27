import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ApiProduct } from '@/shared/api/types';
import { Badge } from '@/shared/ui/Badge';
import { PriceTrendIndicator } from '@/shared/components/PriceTrend';
import { formatMoney } from '@/shared/lib/format';
import { getBestOffer, inferTrend } from '@/shared/lib/product-view';
import { cn } from '@/shared/lib/cn';

export function ProductCard({
  product,
  layout = 'grid',
  showCompareCta = false,
  previousPrice,
  discountPercent,
}: {
  product: ApiProduct;
  layout?: 'grid' | 'list';
  showCompareCta?: boolean;
  previousPrice?: number;
  discountPercent?: number;
}) {
  const best = getBestOffer(product);
  if (!best) return null;

  const trend = inferTrend(best.price.amount, previousPrice);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-accent/40 hover:bg-surface-elevated',
        layout === 'list' && 'sm:flex sm:items-stretch',
      )}
    >
      <Link
        to={`/products/${product.slug}`}
        className={cn(
          'block overflow-hidden bg-canvas',
          layout === 'grid' ? 'aspect-square' : 'sm:w-48 sm:shrink-0',
        )}
      >
        <img
          src={product.imageUrls[0] ?? product.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{product.brand}</Badge>
              {product.isDemonstration ? <Badge tone="warning">Demo</Badge> : null}
              {best.dealLabel ? <Badge tone="lime">{best.dealLabel}</Badge> : null}
            </div>
            <h3 className="truncate text-base font-semibold text-ink">
              <Link to={`/products/${product.slug}`} className="hover:text-accent">
                {product.name}
              </Link>
            </h3>
            <p className="truncate text-sm text-ink-muted">{product.variant}</p>
          </div>
          <PriceTrendIndicator trend={trend} />
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xl font-medium tracking-tight text-ink">
              {formatMoney({ amount: best.price.amount, currency: 'INR' })}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              {previousPrice ? (
                <span className="line-through">
                  {formatMoney({ amount: previousPrice, currency: 'INR' })}
                </span>
              ) : null}
              {discountPercent ? (
                <span className="font-medium text-lime">{discountPercent}% off</span>
              ) : null}
              <span>· {best.retailerName}</span>
            </div>
          </div>
          {showCompareCta ? (
            <Link
              to={`/products/${product.slug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Compare <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
