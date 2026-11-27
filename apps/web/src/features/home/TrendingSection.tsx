import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchProducts } from '@/shared/api/products';
import { ProductCard } from '@/shared/components/ProductCard';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/ErrorState';

export function TrendingSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const result = await fetchProducts({ sortBy: 'price_asc', pageSize: 6 });
      return result.data.items;
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Trending</p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Products people track</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Loaded from the PRICE HUNTER API (seeded demonstration catalog).
          </p>
        </div>
        <Link to="/search" className="hidden text-sm font-medium text-accent hover:underline sm:inline">
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState description="Could not load trending products from the API." onRetry={() => refetch()} />
      ) : null}

      {data ? (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {data.map((product) => (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </section>
  );
}
