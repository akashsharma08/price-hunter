import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { searchProducts } from '@/shared/api/products';
import { ProductCard } from '@/shared/components/ProductCard';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/ErrorState';
import { cn } from '@/shared/lib/cn';
import { useUiStore } from '@/store/ui-store';

const CATEGORIES = [
  { id: 'smartphones', label: 'Smartphones' },
  { id: 'laptops', label: 'Laptops' },
  { id: 'headphones', label: 'Headphones' },
] as const;

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const layout = useUiStore((s) => s.searchLayout);
  const setLayout = useUiStore((s) => s.setSearchLayout);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = params.get('q') ?? '';
  const categoryParam = params.get('category') ?? '';
  const selectedCategories = categoryParam.split(',').filter(Boolean);
  const selectedBrands = (params.get('brands') ?? '').split(',').filter(Boolean);
  const minPrice = params.get('min') ? Number(params.get('min')) : undefined;
  const maxPrice = params.get('max') ? Number(params.get('max')) : undefined;
  const sortBy = params.get('sort') ?? 'relevance';
  const page = Number(params.get('page') ?? '1') || 1;

  const searchKey = useMemo(
    () => ({
      q: query || undefined,
      category: selectedCategories[0],
      brands: selectedBrands.length ? selectedBrands.join(',') : undefined,
      minPrice,
      maxPrice,
      sortBy,
      page,
      pageSize: 9,
    }),
    [query, selectedCategories, selectedBrands, minPrice, maxPrice, sortBy, page],
  );

  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['products', 'search', searchKey],
    queryFn: async () => searchProducts(searchKey),
  });

  function updateParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next);
  }

  function toggleCategory(id: string) {
    updateParams((next) => {
      if (next.get('category') === id) next.delete('category');
      else next.set('category', id);
      next.delete('page');
    });
  }

  function toggleBrand(brand: string) {
    updateParams((next) => {
      const current = new Set((next.get('brands') ?? '').split(',').filter(Boolean));
      if (current.has(brand)) current.delete(brand);
      else current.add(brand);
      if (current.size) next.set('brands', [...current].join(','));
      else next.delete('brands');
      next.delete('page');
    });
  }

  const filters = result?.data.filters;
  const items = result?.data.items ?? [];
  const total = result?.meta?.total ?? 0;
  const totalPages = result?.meta?.totalPages ?? 1;

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Category
        </h2>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="size-4 rounded border-border accent-accent"
              />
              {cat.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Brand
        </h2>
        <div className="max-h-48 space-y-2 overflow-auto pr-1">
          {(filters?.brands ?? []).map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="size-4 rounded border-border accent-accent"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Price range (INR)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={`Min ${filters?.priceBounds.min ?? ''}`}
            defaultValue={minPrice ?? ''}
            className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-sm"
            onBlur={(e) => {
              const value = e.target.value;
              updateParams((next) => {
                if (value) next.set('min', value);
                else next.delete('min');
                next.delete('page');
              });
            }}
            aria-label="Minimum price"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder={`Max ${filters?.priceBounds.max ?? ''}`}
            defaultValue={maxPrice ?? ''}
            className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-sm"
            onBlur={(e) => {
              const value = e.target.value;
              updateParams((next) => {
                if (value) next.set('max', value);
                else next.delete('max');
                next.delete('page');
              });
            }}
            aria-label="Maximum price"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Search</p>
            <Badge tone="accent">Live API</Badge>
          </div>
          <h1 className="font-display text-4xl text-ink">
            {query ? `Results for “${query}”` : 'Browse products'}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {total} product{total === 1 ? '' : 's'} · powered by NestJS + PostgreSQL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) =>
                updateParams((next) => {
                  next.set('sort', e.target.value);
                  next.delete('page');
                })
              }
              className="h-9 rounded-md border border-border bg-surface-elevated px-3 text-sm text-ink"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <div className="flex rounded-md border border-border p-0.5">
            <button
              type="button"
              aria-label="Grid view"
              className={cn(
                'rounded-sm p-2 text-ink-muted',
                layout === 'grid' && 'bg-surface-hover text-ink',
              )}
              onClick={() => setLayout('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              className={cn(
                'rounded-sm p-2 text-ink-muted',
                layout === 'list' && 'bg-surface-hover text-ink',
              )}
              onClick={() => setLayout('list')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside
          className={cn(
            'rounded-lg border border-border bg-surface p-4 lg:block',
            filtersOpen ? 'block' : 'hidden',
          )}
        >
          {filterPanel}
        </aside>

        <div className="space-y-6">
          {isLoading ? (
            <div
              className={cn(
                'grid gap-4',
                layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1',
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : null}

          {isError ? (
            <ErrorState description="Search request failed." onRetry={() => refetch()} />
          ) : null}

          {!isLoading && !isError && items.length === 0 ? (
            <EmptyState
              title="No products match"
              description="Try clearing filters or searching a different brand, category, or price range."
              action={
                <Button variant="secondary" onClick={() => setParams(query ? { q: query } : {})}>
                  Reset filters
                </Button>
              }
            />
          ) : null}

          {!isLoading && items.length > 0 ? (
            <div
              className={cn(
                'grid gap-4',
                layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1',
              )}
            >
              {items.map((product) => (
                <ProductCard key={product.id} product={product} layout={layout} />
              ))}
            </div>
          ) : null}

          {totalPages > 1 ? (
            <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  updateParams((next) => {
                    next.set('page', String(page - 1));
                  })
                }
              >
                Previous
              </Button>
              <span className="font-mono text-sm text-ink-muted">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  updateParams((next) => {
                    next.set('page', String(page + 1));
                  })
                }
              >
                Next
              </Button>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
