import { Injectable, NotFoundException } from '@nestjs/common';
import { decimalToNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Pricing module exposes listing-level price reads.
 * Live retailer adapters are intentionally not implemented in Phase 2.
 */
@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getListing(listingId: string) {
    const listing = await this.prisma.retailerListing.findUnique({
      where: { id: listingId },
      include: {
        retailer: true,
        productVariant: { include: { product: true } },
      },
    });
    if (!listing) throw new NotFoundException('Retailer listing not found');

    return {
      id: listing.id,
      productId: listing.productVariant.productId,
      productName: listing.productVariant.product.name,
      productSlug: listing.productVariant.product.slug,
      variantId: listing.productVariantId,
      retailerId: listing.retailerId,
      retailerName: listing.retailer.name,
      currentPrice: {
        amount: decimalToNumber(listing.currentPrice),
        currency: listing.currency,
        source: listing.retailer.name,
        retailerName: listing.retailer.name,
        verifiedAt: listing.lastVerifiedAt.toISOString(),
        availability: listing.availability,
        url: listing.productUrl ?? undefined,
        isDemonstration: true,
      },
      productUrl: listing.productUrl,
      dealLabel: listing.dealLabel,
    };
  }

  async getListingHistory(listingId: string) {
    const listing = await this.prisma.retailerListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Retailer listing not found');

    const history = await this.prisma.priceHistory.findMany({
      where: { retailerListingId: listingId },
      orderBy: { recordedAt: 'asc' },
    });

    return {
      retailerListingId: listingId,
      snapshots: history.map((snap) => ({
        id: snap.id,
        price: decimalToNumber(snap.price),
        currency: snap.currency,
        recordedAt: snap.recordedAt.toISOString(),
        source: snap.source,
        isDemonstration: snap.source === 'seed',
      })),
    };
  }
}
