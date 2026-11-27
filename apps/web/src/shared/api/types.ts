export interface ApiPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiPaginationMeta;
  error: null;
}

export interface ApiFailure {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export interface ApiMoney {
  amount: number;
  currency: string;
}

export interface ApiProductPrice extends ApiMoney {
  source: string;
  retailerName: string;
  verifiedAt: string;
  availability: 'in_stock' | 'limited' | 'out_of_stock' | 'unknown';
  url?: string;
  isDemonstration?: boolean;
}

export interface ApiOffer {
  id: string;
  retailerId: string;
  retailerName: string;
  retailerWebsite?: string;
  retailerLogo?: string | null;
  externalProductId?: string | null;
  productUrl?: string | null;
  dealLabel?: string | null;
  price: ApiProductPrice;
  variantId?: string;
  sku?: string;
}

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: 'smartphones' | 'laptops' | 'headphones';
  description: string;
  image: string;
  imageUrls: string[];
  variant: string;
  primaryVariantId: string | null;
  offers: ApiOffer[];
  bestOffer: ApiOffer | null;
  isDemonstration: boolean;
  createdAt: string;
  variants?: Array<{
    id: string;
    sku: string;
    modelNumber: string | null;
    attributes: Record<string, unknown>;
    label: string;
    offers: ApiOffer[];
  }>;
}

export interface ApiProductListData {
  items: ApiProduct[];
  filters: {
    brands: string[];
    categories: string[];
    priceBounds: { min: number; max: number };
  };
}

export interface ApiPriceHistory {
  productId: string;
  days: number;
  lowestObservedPrice: ApiMoney | null;
  snapshots: Array<{
    id: string;
    retailerListingId: string;
    retailerId: string;
    retailerName: string;
    amount: number;
    currency: string;
    recordedAt: string;
    source: string;
    availability: string;
    isDemonstration: boolean;
  }>;
}

export interface ApiCategory {
  id: 'smartphones' | 'laptops' | 'headphones';
  name: string;
  description: string;
  productCount: number;
}

export interface ApiAuthUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface ApiAuthResponse {
  user: ApiAuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface ApiWatchlistItem {
  id: string;
  productVariantId: string;
  productId: string;
  addedAt: string;
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
    image: string;
    bestPrice: {
      amount: number;
      currency: string;
      retailerName: string;
      verifiedAt: string;
      availability: string;
    } | null;
  };
}

export interface ApiAlert {
  id: string;
  retailerListingId: string;
  productId: string;
  productName: string;
  productSlug: string;
  retailerName: string;
  targetPrice: ApiMoney;
  currentPrice: ApiMoney;
  isActive: boolean;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}
