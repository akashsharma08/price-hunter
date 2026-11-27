import type {
  ProviderAvailabilityResult,
  ProviderCapabilityStatus,
  ProviderProductDetails,
  ProviderPriceResult,
  ProviderProductIdentity,
  ProviderSearchQuery,
  ProviderSearchResultItem,
} from './types';

/**
 * Provider-independent retailer adapter contract.
 * Each retailer implements this independently. No scraping — authorized APIs only.
 */
export interface RetailerProvider {
  readonly providerKey: ProviderCapabilityStatus['providerKey'];
  readonly displayName: string;
  /** Stable retailer display name used to resolve Retailer rows (e.g. Amazon.in). */
  readonly retailerName: string;

  getStatus(): ProviderCapabilityStatus;

  searchProducts(query: ProviderSearchQuery): Promise<ProviderSearchResultItem[]>;

  getProductDetails(identity: ProviderProductIdentity): Promise<ProviderProductDetails>;

  getCurrentPrice(identity: ProviderProductIdentity): Promise<ProviderPriceResult>;

  getAvailability(identity: ProviderProductIdentity): Promise<ProviderAvailabilityResult>;
}

export const RETAILER_PROVIDERS = Symbol('RETAILER_PROVIDERS');
