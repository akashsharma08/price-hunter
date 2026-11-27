import type { AvailabilityStatus, IntegrationProviderKey } from '@prisma/client';

export type ProviderAvailability = AvailabilityStatus;

/**
 * Normalized offer contract required by PRICE HUNTER before persistence.
 * Never invent values. Source must identify the authorized adapter.
 */
export interface NormalizedRetailerOffer {
  retailerId: string;
  productVariantId: string;
  price: number;
  currency: 'INR';
  availability: ProviderAvailability;
  productUrl: string;
  lastVerifiedAt: string;
  source: string;
  externalProductId?: string;
  dealLabel?: string;
  raw?: unknown;
}

export interface ProviderSearchQuery {
  keywords: string;
  brand?: string;
  category?: string;
  limit?: number;
}

export interface ProviderProductIdentity {
  externalProductId: string;
}

export interface ProviderSearchResultItem {
  externalProductId: string;
  title: string;
  brand?: string;
  modelNumber?: string;
  imageUrl?: string;
  productUrl?: string;
  price?: number;
  currency?: 'INR';
  availability?: ProviderAvailability;
  attributes?: Record<string, string>;
  raw?: unknown;
}

export interface ProviderProductDetails extends ProviderSearchResultItem {
  description?: string;
  variations?: ProviderSearchResultItem[];
}

export interface ProviderPriceResult {
  externalProductId: string;
  price: number;
  currency: 'INR';
  productUrl: string;
  verifiedAt: string;
  raw?: unknown;
}

export interface ProviderAvailabilityResult {
  externalProductId: string;
  availability: ProviderAvailability;
  verifiedAt: string;
  raw?: unknown;
}

export interface ProviderCapabilityStatus {
  providerKey: IntegrationProviderKey;
  displayName: string;
  configured: boolean;
  enabled: boolean;
  /** True only when credentials exist AND a live authorized call can be attempted. */
  liveReady: boolean;
  missingConfig: string[];
  notes: string[];
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerKey: string, missing: string[]) {
    super(
      `${providerKey} is not configured for live calls. Missing: ${missing.join(', ') || 'credentials'}`,
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

export class ProviderRequestError extends Error {
  constructor(
    readonly providerKey: string,
    message: string,
    readonly statusCode?: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ProviderRequestError';
  }
}
