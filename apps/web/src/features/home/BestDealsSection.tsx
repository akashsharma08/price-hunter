import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/shared/api/products';
import { ProductCard } from '@/shared/components/ProductCard';
import { Badge } from '@/shared/ui/Badge';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/ErrorState';

export function BestDealsSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', 'deals'],
    queryFn: async () => {
      const result = await fetchProducts({ sortBy: 'price_asc', pageSize: 4 });
      return result.data.items.filter((p) => p.offers.some((o) => o.dealLabel));
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">Best deals</p>
            <Badge tone="lime">API seeded deals</Badge>
          </div>
          <h2 className="font-display text-3xl text-ink sm:text-4xl">Worth a second look</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Deal labels come from retailer listings in PostgreSQL — still demonstration prices.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState description="Could not load deals from the API." onRetry={() => refetch()} />
      ) : null}

      {data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} layout="list" showCompareCta />
          ))}
        </div>
      ) : null}
    </section>
  );
}
