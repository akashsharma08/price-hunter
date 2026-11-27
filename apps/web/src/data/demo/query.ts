/**
 * DEMONSTRATION DATA ACCESS — client-side filtering over sample catalog only.
 * Not a live API. Replace with TanStack Query → NestJS endpoints in later phases.
 */

import type { Product, ProductCategory, SearchFilters } from '@price-hunter/shared';
import {
  DEMO_ALERTS,
  DEMO_NOTIFICATIONS,
  DEMO_PRICE_HISTORY,
  DEMO_PRODUCTS,
  DEMO_WATCHLIST,
} from './catalog';
import { getDisplayPrice } from '@/shared/lib/product';

export interface SearchResultPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  brands: string[];
  priceBounds: { min: number; max: number };
  /** Always true for this layer */
  isDemonstration: true;
}

function relevanceScore(product: Product, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const haystack = `${product.name} ${product.variant} ${product.brand} ${product.tags.join(' ')}`.toLowerCase();
  if (haystack.includes(q)) return 100;
  const tokens = q.split(/\s+/);
  return tokens.reduce((score, token) => (haystack.includes(token) ? score + 20 : score), 0);
}

export function searchProducts(
  filters: SearchFilters & { page?: number; pageSize?: number },
): SearchResultPage {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 9;
  let items = [...DEMO_PRODUCTS];

  if (filters.query?.trim()) {
    items = items
      .map((p) => ({ p, score: relevanceScore(p, filters.query ?? '') }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
  }

  if (filters.categories?.length) {
    const set = new Set(filters.categories);
    items = items.filter((p) => set.has(p.category));
  }

  if (filters.brands?.length) {
    const set = new Set(filters.brands.map((b) => b.toLowerCase()));
    items = items.filter((p) => set.has(p.brand.toLowerCase()));
  }

  if (filters.minPrice != null) {
    items = items.filter((p) => getDisplayPrice(p) >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    items = items.filter((p) => getDisplayPrice(p) <= filters.maxPrice!);
  }

  switch (filters.sortBy) {
    case 'price_asc':
      items.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
      break;
    case 'price_desc':
      items.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
      break;
    case 'discount':
      items.sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
      break;
    case 'relevance':
    default:
      break;
  }

  const allForBounds = DEMO_PRODUCTS.map(getDisplayPrice);
  const brands = [...new Set(DEMO_PRODUCTS.map((p) => p.brand))].sort();
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    items: pageItems,
    total,
    page,
    pageSize,
    totalPages,
    brands,
    priceBounds: {
      min: Math.min(...allForBounds),
      max: Math.max(...allForBounds),
    },
    isDemonstration: true,
  };
}

export function getProductBySlug(slug: string): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === id);
}

export function getTrendingProducts(limit = 6): Product[] {
  return [...DEMO_PRODUCTS]
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, limit);
}

export function getBestDeals(limit = 4): Product[] {
  return [...DEMO_PRODUCTS]
    .filter((p) => (p.discountPercent ?? 0) >= 10)
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, limit);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return DEMO_PRODUCTS.filter((p) => p.category === category);
}

export function getSimilarProducts(product: Product): Product[] {
  return product.similarProductIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));
}

export function getPriceHistory(productId: string) {
  return DEMO_PRICE_HISTORY[productId] ?? [];
}

export function getDashboardDemoData() {
  const watchlist = DEMO_WATCHLIST.map((item) => ({
    ...item,
    product: getProductById(item.productId),
  })).filter((item) => item.product);

  return {
    watchlist,
    alerts: DEMO_ALERTS,
    notifications: DEMO_NOTIFICATIONS,
    trackedProducts: watchlist.map((w) => w.product!).filter(Boolean),
    isDemonstration: true as const,
  };
}
