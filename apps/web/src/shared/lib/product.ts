import type { Product, ProductOffer } from '@price-hunter/shared';

export function getBestOffer(product: Product): ProductOffer | undefined {
  if (product.offers.length === 0) return undefined;
  return [...product.offers].sort((a, b) => a.price.amount - b.price.amount)[0];
}

export function getDisplayPrice(product: Product): number {
  return getBestOffer(product)?.price.amount ?? 0;
}

export function categoryLabel(category: Product['category']): string {
  switch (category) {
    case 'smartphones':
      return 'Smartphones';
    case 'laptops':
      return 'Laptops';
    case 'headphones':
      return 'Headphones';
  }
}
