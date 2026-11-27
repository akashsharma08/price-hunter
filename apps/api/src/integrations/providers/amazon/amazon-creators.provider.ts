import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationProviderKey } from '@prisma/client';
import type { RetailerProvider } from '../retailer-provider.interface';
import { providerFetch } from '../http';
import {
  ProviderNotConfiguredError,
  ProviderRequestError,
  type ProviderAvailabilityResult,
  type ProviderCapabilityStatus,
  type ProviderProductDetails,
  type ProviderPriceResult,
  type ProviderProductIdentity,
  type ProviderSearchQuery,
  type ProviderSearchResultItem,
} from '../types';

/**
 * Amazon.in Creators API adapter.
 * Live HTTP calls execute only when Credential ID/Secret + Partner Tag are configured.
 * Docs: https://affiliate-program.amazon.in/creatorsapi/docs/en-us/introduction
 */
@Injectable()
export class AmazonCreatorsProvider implements RetailerProvider {
  readonly providerKey = IntegrationProviderKey.amazon_in_creators;
  readonly displayName = 'Amazon India Creators API';
  readonly retailerName = 'Amazon.in';

  private readonly logger = new Logger(AmazonCreatorsProvider.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  getStatus(): ProviderCapabilityStatus {
    const missing = this.missingConfig();
    const enabled = this.config.get<boolean>('integrations.amazon.enabled') === true;
    return {
      providerKey: this.providerKey,
      displayName: this.displayName,
      configured: missing.length === 0,
      enabled,
      liveReady: enabled && missing.length === 0,
      missingConfig: missing,
      notes: [
        'Requires Amazon Associates (IN) acceptance and Creators API credentials.',
        'Docs cite ≥10 qualifying sales / 30 days for PA API access via Creators API.',
        'India credential version 3.2 uses api.amazon.co.uk/auth/o2/token.',
        'No scraping. Disabled adapters never invent prices.',
      ],
    };
  }

  async searchProducts(query: ProviderSearchQuery): Promise<ProviderSearchResultItem[]> {
    this.assertLiveReady();
    const token = await this.getAccessToken();
    const marketplace = this.marketplace();
    const response = await providerFetch(
      this.providerKey,
      'https://creatorsapi.amazon/catalog/v1/searchItems',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-marketplace': marketplace,
        },
        body: {
          keywords: query.keywords,
          brand: query.brand,
          marketplace,
          partnerTag: this.partnerTag(),
          itemCount: Math.min(query.limit ?? 10, 10),
          resources: [
            'itemInfo.title',
            'itemInfo.byLineInfo',
            'itemInfo.productInfo',
            'images.primary.large',
            'offersV2.listings.price',
            'offersV2.listings.availability',
          ],
        },
      },
    );

    if (!response.ok) {
      throw await this.toRequestError(response, 'search');
    }

    const payload = (await response.json()) as {
      items?: AmazonItem[];
      searchResult?: { items?: AmazonItem[] };
    };
    const items = payload.items ?? payload.searchResult?.items ?? [];
    return items.map((item) => this.mapItem(item));
  }

  async getProductDetails(identity: ProviderProductIdentity): Promise<ProviderProductDetails> {
    this.assertLiveReady();
    const token = await this.getAccessToken();
    const marketplace = this.marketplace();
    const response = await providerFetch(
      this.providerKey,
      'https://creatorsapi.amazon/catalog/v1/getItems',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-marketplace': marketplace,
        },
        body: {
          itemIds: [identity.externalProductId],
          marketplace,
          partnerTag: this.partnerTag(),
          resources: [
            'itemInfo.title',
            'itemInfo.byLineInfo',
            'itemInfo.features',
            'itemInfo.productInfo',
            'images.primary.large',
            'offersV2.listings.price',
            'offersV2.listings.availability',
          ],
        },
      },
    );

    if (!response.ok) {
      throw await this.toRequestError(response, 'details');
    }

    const payload = (await response.json()) as { items?: AmazonItem[] };
    const item = payload.items?.[0];
    if (!item) {
      throw new ProviderRequestError(this.providerKey, 'ASIN not found', 404);
    }
    return this.mapItem(item);
  }

  async getCurrentPrice(identity: ProviderProductIdentity): Promise<ProviderPriceResult> {
    const details = await this.getProductDetails(identity);
    if (details.price == null) {
      throw new ProviderRequestError(
        this.providerKey,
        'No authorized price returned for ASIN',
        404,
      );
    }
    return {
      externalProductId: details.externalProductId,
      price: details.price,
      currency: 'INR',
      productUrl: details.productUrl ?? this.fallbackUrl(details.externalProductId),
      verifiedAt: new Date().toISOString(),
      raw: details.raw,
    };
  }

  async getAvailability(
    identity: ProviderProductIdentity,
  ): Promise<ProviderAvailabilityResult> {
    const details = await this.getProductDetails(identity);
    return {
      externalProductId: details.externalProductId,
      availability: details.availability ?? 'unknown',
      verifiedAt: new Date().toISOString(),
      raw: details.raw,
    };
  }

  private mapItem(item: AmazonItem): ProviderProductDetails {
    const listing = item.offersV2?.listings?.[0];
    const amount = listing?.price?.amount ?? listing?.price?.money?.amount;
    const availabilityText = listing?.availability?.message ?? listing?.availability?.type;
    return {
      externalProductId: item.asin ?? item.itemId ?? '',
      title: item.itemInfo?.title?.displayValue ?? item.title ?? 'Unknown',
      brand: item.itemInfo?.byLineInfo?.brand?.displayValue,
      modelNumber: item.itemInfo?.productInfo?.modelNumber?.displayValue,
      imageUrl: item.images?.primary?.large?.url,
      productUrl: item.detailPageURL ?? this.fallbackUrl(item.asin ?? ''),
      price: typeof amount === 'number' ? amount : amount ? Number(amount) : undefined,
      currency: 'INR',
      availability: mapAmazonAvailability(availabilityText),
      attributes: {
        ...(item.itemInfo?.productInfo?.color?.displayValue
          ? { color: item.itemInfo.productInfo.color.displayValue }
          : {}),
        ...(item.itemInfo?.productInfo?.size?.displayValue
          ? { storage: item.itemInfo.productInfo.size.displayValue }
          : {}),
      },
      raw: item,
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.value;
    }

    const version = this.config.get<string>('integrations.amazon.credentialVersion') ?? '3.2';
    const tokenUrl =
      version.startsWith('3.1')
        ? 'https://api.amazon.com/auth/o2/token'
        : version.startsWith('3.3')
          ? 'https://api.amazon.co.jp/auth/o2/token'
          : 'https://api.amazon.co.uk/auth/o2/token';

    const response = await providerFetch(this.providerKey, tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        grant_type: 'client_credentials',
        client_id: this.config.get<string>('integrations.amazon.credentialId'),
        client_secret: this.config.get<string>('integrations.amazon.credentialSecret'),
        scope: 'creatorsapi::default',
      },
      retries: 1,
    });

    if (!response.ok) {
      throw await this.toRequestError(response, 'auth');
    }

    const payload = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.cachedToken = {
      value: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };
    this.logger.log('Fetched Amazon Creators API access token');
    return payload.access_token;
  }

  private missingConfig(): string[] {
    const missing: string[] = [];
    if (!this.config.get<string>('integrations.amazon.credentialId')) {
      missing.push('AMAZON_CREDENTIAL_ID');
    }
    if (!this.config.get<string>('integrations.amazon.credentialSecret')) {
      missing.push('AMAZON_CREDENTIAL_SECRET');
    }
    if (!this.config.get<string>('integrations.amazon.partnerTag')) {
      missing.push('AMAZON_PARTNER_TAG');
    }
    return missing;
  }

  private assertLiveReady(): void {
    const status = this.getStatus();
    if (!status.liveReady) {
      throw new ProviderNotConfiguredError(this.providerKey, status.missingConfig);
    }
  }

  private marketplace(): string {
    return this.config.get<string>('integrations.amazon.marketplace') ?? 'www.amazon.in';
  }

  private partnerTag(): string {
    return this.config.getOrThrow<string>('integrations.amazon.partnerTag');
  }

  private fallbackUrl(asin: string): string {
    const tag = this.config.get<string>('integrations.amazon.partnerTag');
    const base = `https://www.amazon.in/dp/${asin}`;
    return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
  }

  private async toRequestError(response: Response, stage: string) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    return new ProviderRequestError(
      this.providerKey,
      `Amazon Creators API ${stage} failed`,
      response.status,
      details,
    );
  }
}

interface AmazonItem {
  asin?: string;
  itemId?: string;
  title?: string;
  detailPageURL?: string;
  itemInfo?: {
    title?: { displayValue?: string };
    byLineInfo?: { brand?: { displayValue?: string } };
    productInfo?: {
      color?: { displayValue?: string };
      size?: { displayValue?: string };
      modelNumber?: { displayValue?: string };
      itemDimensions?: unknown;
    };
  };
  images?: { primary?: { large?: { url?: string } } };
  offersV2?: {
    listings?: Array<{
      price?: { amount?: number; money?: { amount?: number | string } };
      availability?: { message?: string; type?: string };
    }>;
  };
}

function mapAmazonAvailability(
  value?: string,
): ProviderSearchResultItem['availability'] {
  if (!value) return 'unknown';
  const lower = value.toLowerCase();
  if (lower.includes('out of stock') || lower.includes('unavailable')) return 'out_of_stock';
  if (lower.includes('only') || lower.includes('left')) return 'limited';
  if (lower.includes('in stock') || lower.includes('available')) return 'in_stock';
  return 'unknown';
}
