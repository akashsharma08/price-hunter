import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PriceIngestionService } from './ingestion/price-ingestion.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly ingestion: PriceIngestionService,
    private readonly prisma: PrismaService,
  ) {}

  getStatus() {
    const providers = this.ingestion.listProviderStatuses();
    const liveReadyCount = providers.filter((p) => p.liveReady).length;
    return {
      phase: 'phase-3-provider-architecture',
      productionReadyForLivePrices: liveReadyCount > 0,
      liveReadyCount,
      providers,
      rules: [
        'Never scrape retailer websites without explicit authorization',
        'Never fabricate prices',
        'Never show stale prices as current',
        'Every offer must include retailer, price, lastVerifiedAt, availability, productUrl',
      ],
      researchDoc: 'docs/RETAILER_API_RESEARCH.md',
    };
  }

  async refreshVariant(productVariantId: string) {
    return this.ingestion.refreshVariant(productVariantId);
  }

  async refreshProduct(productId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });
    if (variants.length === 0) {
      throw new NotFoundException('Product not found or has no variants');
    }
    const results = [];
    for (const variant of variants) {
      results.push(await this.ingestion.refreshVariant(variant.id));
    }
    return { productId, variants: results };
  }

  async markStale() {
    return this.ingestion.markStaleListings();
  }

  async recentFailures(limit = 20) {
    return this.prisma.integrationFailure.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
