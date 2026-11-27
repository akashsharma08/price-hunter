import type { ApiOffer, ApiProduct } from '@/shared/api/types';

export function getBestOffer(product: ApiProduct): ApiOffer | null {
  return product.bestOffer ?? product.offers[0] ?? null;
}

export function categoryLabel(category: ApiProduct['category']): string {
  switch (category) {
    case 'smartphones':
      return 'Smartphones';
    case 'laptops':
      return 'Laptops';
    case 'headphones':
      return 'Headphones';
  }
}

/** Approximate trend from offer set when history is not loaded. */
export function inferTrend(
  current: number,
  previous?: number,
): 'up' | 'down' | 'stable' {
  if (previous == null) return 'stable';
  if (current < previous * 0.98) return 'down';
  if (current > previous * 1.02) return 'up';
  return 'stable';
}
