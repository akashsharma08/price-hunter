import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Headphones, Laptop, Smartphone } from 'lucide-react';
import { fetchCategories } from '@/shared/api/products';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/ErrorState';

const ICONS = {
  smartphones: Smartphone,
  laptops: Laptop,
  headphones: Headphones,
} as const;

export function CategoriesSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await fetchCategories()).data,
  });

  return (
    <section className="border-y border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">Categories</p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Popular categories</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Launch categories for India — counts come from the live API database.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : null}

        {isError ? (
          <ErrorState description="Could not load categories." onRetry={() => refetch()} />
        ) : null}

        {data ? (
          <div className="grid gap-4 md:grid-cols-3">
            {data.map((category) => {
              const Icon = ICONS[category.id];
              return (
                <Link
                  key={category.id}
                  to={`/search?category=${category.id}`}
                  className="group rounded-lg border border-border bg-canvas p-6 transition-colors hover:border-accent/40"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-elevated text-accent transition-colors group-hover:border-accent/40">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-xl font-semibold text-ink">{category.name}</h3>
                  <p className="mt-2 text-sm text-ink-muted">{category.description}</p>
                  <p className="mt-4 font-mono text-xs text-ink-faint">
                    {category.productCount} products
                  </p>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
