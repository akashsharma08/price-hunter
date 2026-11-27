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
 * Flipkart Affiliate API adapter.
 * Live HTTP calls execute only when Affiliate ID + Token are configured.
 * Docs: https://affiliate.flipkart.com/api-docs/
 * Rate limit: 20 req/s. Search max 10 products.
 */
@Injectable()
export class FlipkartAffiliateProvider implements RetailerProvider {
  readonly providerKey = IntegrationProviderKey.flipkart_affiliate;
  readonly displayName = 'Flipkart Affiliate API';
  readonly retailerName = 'Flipkart';

  private readonly logger = new Logger(FlipkartAffiliateProvider.name);

  constructor(private readonly config: ConfigService) {}

  getStatus(): ProviderCapabilityStatus {
    const missing = this.missingConfig();
    const enabled = this.config.get<boolean>('integrations.flipkart.enabled') === true;
    return {
      providerKey: this.providerKey,
      displayName: this.displayName,
      configured: missing.length === 0,
      enabled,
      liveReady: enabled && missing.length === 0,
      missingConfig: missing,
      notes: [
        'Requires Flipkart Affiliate registration and API token.',
        'Auth headers: Fk-Affiliate-Id + Fk-Affiliate-Token.',
        'Rate limit 20 calls/sec. Keyword search returns ≤10 products.',
        'No scraping. Disabled adapters never invent prices.',
      ],
    };
  }

  async searchProducts(query: ProviderSearchQuery): Promise<ProviderSearchResultItem[]> {
    this.assertLiveReady();
    const resultCount = Math.min(query.limit ?? 10, 10);
    const url = new URL('https://affiliate-api.flipkart.net/affiliate/1.0/search.json');
    url.searchParams.set('query', query.keywords);
    url.searchParams.set('resultCount', String(resultCount));

    const response = await providerFetch(this.providerKey, url.toString(), {
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      throw await this.toRequestError(response, 'search');
    }

    const payload = (await response.json()) as FlipkartSearchResponse;
    const products = payload.products ?? [];
    this.logger.debug(`Flipkart search returned ${products.length} products`);
    return products.map((entry) => this.mapProduct(entry.productBaseInfoV1 ?? entry));
  }

  async getProductDetails(identity: ProviderProductIdentity): Promise<ProviderProductDetails> {
    this.assertLiveReady();
    const url = new URL('https://affiliate-api.flipkart.net/affiliate/1.0/product.json');
    url.searchParams.set('id', identity.externalProductId);

    const response = await providerFetch(this.providerKey, url.toString(), {
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      throw await this.toRequestError(response, 'details');
    }

    const payload = (await response.json()) as FlipkartProductResponse;
    const product = payload.productBaseInfoV1 ?? payload;
    return this.mapProduct(product);
  }

  async getCurrentPrice(identity: ProviderProductIdentity): Promise<ProviderPriceResult> {
    const details = await this.getProductDetails(identity);
    if (details.price == null) {
      throw new ProviderRequestError(
        this.providerKey,
        'No authorized price returned for Flipkart product id',
        404,
      );
    }
    return {
      externalProductId: details.externalProductId,
      price: details.price,
      currency: 'INR',
      productUrl: details.productUrl ?? '',
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

  private mapProduct(product: FlipkartProduct): ProviderProductDetails {
    const price =
      product.flipkartSpecialPrice?.amount ??
      product.flipkartSellingPrice?.amount ??
      product.maximumRetailPrice?.amount;

    return {
      externalProductId: product.productId ?? '',
      title: product.title ?? 'Unknown',
      brand: product.productBrand,
      imageUrl: product.imageUrls?.['400x400'] ?? product.imageUrls?.['200x200'],
      productUrl: product.productUrl,
      price: typeof price === 'number' ? price : price ? Number(price) : undefined,
      currency: 'INR',
      availability: product.inStock === false ? 'out_of_stock' : product.inStock ? 'in_stock' : 'unknown',
      attributes: {
        ...(product.productBrand ? { brand: product.productBrand } : {}),
      },
      raw: product,
    };
  }

  private authHeaders(): Record<string, string> {
    return {
      'Fk-Affiliate-Id': this.config.getOrThrow<string>('integrations.flipkart.affiliateId'),
      'Fk-Affiliate-Token': this.config.getOrThrow<string>('integrations.flipkart.affiliateToken'),
    };
  }

  private missingConfig(): string[] {
    const missing: string[] = [];
    if (!this.config.get<string>('integrations.flipkart.affiliateId')) {
      missing.push('FLIPKART_AFFILIATE_ID');
    }
    if (!this.config.get<string>('integrations.flipkart.affiliateToken')) {
      missing.push('FLIPKART_AFFILIATE_TOKEN');
    }
    return missing;
  }

  private assertLiveReady(): void {
    const status = this.getStatus();
    if (!status.liveReady) {
      throw new ProviderNotConfiguredError(this.providerKey, status.missingConfig);
    }
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
      `Flipkart Affiliate API ${stage} failed`,
      response.status,
      details,
    );
  }
}

interface FlipkartMoney {
  amount?: number | string;
}

interface FlipkartProduct {
  productId?: string;
  title?: string;
  productBrand?: string;
  productUrl?: string;
  inStock?: boolean;
  imageUrls?: Record<string, string>;
  flipkartSpecialPrice?: FlipkartMoney;
  flipkartSellingPrice?: FlipkartMoney;
  maximumRetailPrice?: FlipkartMoney;
}

interface FlipkartSearchResponse {
  products?: Array<{ productBaseInfoV1?: FlipkartProduct } & FlipkartProduct>;
}

interface FlipkartProductResponse extends FlipkartProduct {
  productBaseInfoV1?: FlipkartProduct;
}
