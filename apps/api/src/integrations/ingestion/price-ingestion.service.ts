import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IntegrationFailureStage,
  IntegrationProviderKey,
  PriceHistorySource,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductMatcherService } from '../matching/product-matcher.service';
import { PriceNormalizerService } from '../normalization/price-normalizer.service';
import {
  RETAILER_PROVIDERS,
  type RetailerProvider,
} from '../providers/retailer-provider.interface';
import {
  ProviderNotConfiguredError,
  ProviderRequestError,
  type NormalizedRetailerOffer,
} from '../providers/types';
import { PriceValidatorService } from '../validation/price-validator.service';

@Injectable()
export class PriceIngestionService {
  private readonly logger = new Logger(PriceIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RETAILER_PROVIDERS) private readonly providers: RetailerProvider[],
    private readonly matcher: ProductMatcherService,
    private readonly normalizer: PriceNormalizerService,
    private readonly validator: PriceValidatorService,
  ) {}

  listProviderStatuses() {
    return this.providers.map((provider) => provider.getStatus());
  }

  getLiveReadyProviders() {
    return this.providers.filter((provider) => provider.getStatus().liveReady);
  }

  /**
   * Attempt to refresh a catalog variant from all live-ready providers.
   * Disabled providers are skipped — never fabricate prices.
   */
  async refreshVariant(productVariantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: { product: true },
    });
    if (!variant) {
      return { ok: false as const, message: 'Variant not found', results: [] };
    }

    const liveProviders = this.getLiveReadyProviders();
    if (liveProviders.length === 0) {
      return {
        ok: false as const,
        message:
          'No authorized live retailer providers are configured. Phase 3 is not production-ready for live prices.',
        results: this.listProviderStatuses(),
      };
    }

    const attributes =
      variant.attributes && typeof variant.attributes === 'object'
        ? (variant.attributes as Record<string, unknown>)
        : {};

    const results = [];
    for (const provider of liveProviders) {
      results.push(
        await this.refreshWithProvider(provider, {
          productVariantId: variant.id,
          brand: variant.product.brand,
          name: variant.product.name,
          modelNumber: variant.modelNumber,
          attributes,
        }),
      );
    }

    return { ok: true as const, message: 'Refresh attempted', results };
  }

  private async refreshWithProvider(
    provider: RetailerProvider,
    catalog: {
      productVariantId: string;
      brand: string;
      name: string;
      modelNumber: string | null;
      attributes: Record<string, unknown>;
    },
  ) {
    try {
      const retailer = await this.prisma.retailer.findUnique({
        where: { name: provider.retailerName },
      });
      if (!retailer) {
        await this.recordFailure(
          provider.providerKey,
          IntegrationFailureStage.persist,
          `Retailer row missing for ${provider.retailerName}`,
        );
        return { provider: provider.providerKey, status: 'failed', reason: 'retailer_missing' };
      }

      const query = [catalog.brand, catalog.name, catalog.attributes.storage, catalog.attributes.color]
        .filter(Boolean)
        .join(' ');

      const candidates = await provider.searchProducts({
        keywords: query,
        brand: catalog.brand,
        limit: 10,
      });

      const best = this.matcher.bestMatch(
        {
          brand: catalog.brand,
          name: catalog.name,
          modelNumber: catalog.modelNumber,
          attributes: catalog.attributes,
        },
        candidates,
      );

      if (!best) {
        await this.recordFailure(
          provider.providerKey,
          IntegrationFailureStage.match,
          'No confident variant match',
          { catalog, candidateCount: candidates.length },
        );
        return { provider: provider.providerKey, status: 'unmatched' };
      }

      await this.prisma.productMatch.upsert({
        where: {
          productVariantId_providerKey_externalProductId: {
            productVariantId: catalog.productVariantId,
            providerKey: provider.providerKey,
            externalProductId: best.externalProductId,
          },
        },
        create: {
          productVariantId: catalog.productVariantId,
          providerKey: provider.providerKey,
          externalProductId: best.externalProductId,
          confidence: best.confidence,
          status: best.confidence >= 0.85 ? 'accepted' : 'pending',
          matchedOn: best.matchedOn,
        },
        update: {
          confidence: best.confidence,
          status: best.confidence >= 0.85 ? 'accepted' : 'pending',
          matchedOn: best.matchedOn,
        },
      });

      if (best.confidence < 0.85) {
        return {
          provider: provider.providerKey,
          status: 'pending_review',
          confidence: best.confidence,
          externalProductId: best.externalProductId,
        };
      }

      const price = await provider.getCurrentPrice({
        externalProductId: best.externalProductId,
      });
      const availability = await provider.getAvailability({
        externalProductId: best.externalProductId,
      });

      const normalized = this.normalizer.fromProviderPrice({
        retailerId: retailer.id,
        productVariantId: catalog.productVariantId,
        source: provider.providerKey,
        price,
        availability: availability.availability,
      });

      return this.persistOffer(provider.providerKey, normalized);
    } catch (error) {
      const stage = this.classifyStage(error);
      const message = error instanceof Error ? error.message : String(error);
      await this.recordFailure(provider.providerKey, stage, message, {
        error: error instanceof ProviderRequestError ? error.details : undefined,
      });
      return { provider: provider.providerKey, status: 'failed', reason: message };
    }
  }

  async persistOffer(providerKey: IntegrationProviderKey, offer: NormalizedRetailerOffer) {
    const existing = await this.prisma.retailerListing.findUnique({
      where: {
        productVariantId_retailerId: {
          productVariantId: offer.productVariantId,
          retailerId: offer.retailerId,
        },
      },
    });

    const previous = existing ? Number(existing.currentPrice) : null;
    const validation = this.validator.validate(offer, previous);

    if (!validation.accepted && validation.code !== 'unavailable') {
      await this.recordFailure(
        providerKey,
        IntegrationFailureStage.validate,
        validation.message,
        { offer, code: validation.code },
      );
      if (validation.markStale && existing) {
        await this.prisma.retailerListing.update({
          where: { id: existing.id },
          data: { isStale: true },
        });
      }
      return {
        provider: providerKey,
        status: 'rejected',
        reason: validation.code,
        message: validation.message,
      };
    }

    const listing = await this.prisma.retailerListing.upsert({
      where: {
        productVariantId_retailerId: {
          productVariantId: offer.productVariantId,
          retailerId: offer.retailerId,
        },
      },
      create: {
        productVariantId: offer.productVariantId,
        retailerId: offer.retailerId,
        externalProductId: offer.externalProductId,
        productUrl: offer.productUrl,
        currentPrice: offer.price,
        currency: offer.currency,
        availability: offer.availability,
        lastVerifiedAt: new Date(offer.lastVerifiedAt),
        isStale: false,
        providerKey,
        dealLabel: offer.dealLabel,
        rawPayload: offer.raw as Prisma.InputJsonValue | undefined,
      },
      update: {
        externalProductId: offer.externalProductId,
        productUrl: offer.productUrl,
        currentPrice: offer.price,
        currency: offer.currency,
        availability: offer.availability,
        lastVerifiedAt: new Date(offer.lastVerifiedAt),
        isStale: false,
        providerKey,
        dealLabel: offer.dealLabel,
        rawPayload: offer.raw as Prisma.InputJsonValue | undefined,
      },
    });

    await this.prisma.priceHistory.create({
      data: {
        retailerListingId: listing.id,
        price: offer.price,
        currency: offer.currency,
        recordedAt: new Date(offer.lastVerifiedAt),
        source: PriceHistorySource.adapter,
      },
    });

    return {
      provider: providerKey,
      status: 'persisted',
      listingId: listing.id,
      price: offer.price,
      availability: offer.availability,
    };
  }

  async markStaleListings() {
    const listings = await this.prisma.retailerListing.findMany({
      where: { isStale: false },
      select: { id: true, lastVerifiedAt: true },
    });
    const staleIds = listings
      .filter((listing) => this.validator.isStaleTimestamp(listing.lastVerifiedAt))
      .map((listing) => listing.id);

    if (staleIds.length) {
      await this.prisma.retailerListing.updateMany({
        where: { id: { in: staleIds } },
        data: { isStale: true },
      });
    }

    return { markedStale: staleIds.length };
  }

  private classifyStage(error: unknown): IntegrationFailureStage {
    if (error instanceof ProviderNotConfiguredError) return IntegrationFailureStage.auth;
    if (error instanceof ProviderRequestError) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return IntegrationFailureStage.auth;
      }
    }
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('search')) return IntegrationFailureStage.search;
    if (message.includes('match')) return IntegrationFailureStage.match;
    if (message.includes('price')) return IntegrationFailureStage.price;
    return IntegrationFailureStage.persist;
  }

  private async recordFailure(
    providerKey: IntegrationProviderKey,
    stage: IntegrationFailureStage,
    message: string,
    details?: unknown,
  ) {
    this.logger.warn(`[${providerKey}] ${stage}: ${message}`);
    await this.prisma.integrationFailure.create({
      data: {
        providerKey,
        stage,
        message,
        details: details as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
