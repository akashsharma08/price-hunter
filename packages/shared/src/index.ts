/**
 * Shared domain types for PRICE HUNTER.
 * Used by frontend demo data and future backend API contracts.
 */

export type CurrencyCode = 'INR';

export type ProductCategory = 'smartphones' | 'laptops' | 'headphones';

export type AvailabilityStatus = 'in_stock' | 'limited' | 'out_of_stock' | 'unknown';

export type PriceTrend = 'up' | 'down' | 'stable';

export type RetailerId =
  | 'amazon_in'
  | 'flipkart'
  | 'croma'
  | 'reliance_digital'
  | 'vijay_sales';

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

/**
 * Every product price must carry provenance metadata.
 * Never present amounts without source + verification context.
 */
export interface ProductPrice {
  amount: number;
  currency: CurrencyCode;
  source: RetailerId;
  retailerName: string;
  verifiedAt: string;
  availability: AvailabilityStatus;
  url?: string;
  isDemonstration?: boolean;
}

export interface PriceSnapshot {
  id: string;
  productId: string;
  retailerId: RetailerId;
  amount: number;
  currency: CurrencyCode;
  recordedAt: string;
  availability: AvailabilityStatus;
  isDemonstration?: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
  group?: string;
}

export interface ProductOffer {
  retailerId: RetailerId;
  retailerName: string;
  price: ProductPrice;
  shippingNote?: string;
  dealLabel?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  variant: string;
  brand: string;
  category: ProductCategory;
  description: string;
  imageUrls: string[];
  specs: ProductSpec[];
  offers: ProductOffer[];
  /** Lowest observed price across tracked history (demo or live). */
  lowestObservedPrice?: Money;
  previousPrice?: Money;
  discountPercent?: number;
  trend: PriceTrend;
  similarProductIds: string[];
  tags: string[];
  isDemonstration: boolean;
}

export interface SearchFilters {
  query?: string;
  categories?: ProductCategory[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'discount';
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: Money;
  currentPrice: Money;
  status: 'active' | 'triggered' | 'paused';
  createdAt: string;
  isDemonstration: boolean;
}

export interface WatchlistItem {
  id: string;
  productId: string;
  addedAt: string;
  isDemonstration: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: 'price_drop' | 'alert_triggered' | 'system';
  isDemonstration: boolean;
}
