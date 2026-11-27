import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginationMeta } from '../common/utils/api-response';
import { decimalToNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { PriceHistoryQueryDto, ProductQueryDto } from './dto/product-query.dto';
import { mapOfferRow, mapProductDetail, mapProductSummary } from './products.mapper';

const listingInclude = {
  retailer: true,
} as const;

const productInclude = {
  variants: {
    include: {
      listings: {
        // Never present stale listings as current offers.
        where: { retailer: { isActive: true }, isStale: false },
        include: listingInclude,
        orderBy: { currentPrice: 'asc' as const },
      },
    },
  },
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where = this.buildWhere(query);

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query.sortBy),
      }),
    ]);

    let items = products.map(mapProductSummary);

    if (query.sortBy === 'price_asc' || query.sortBy === 'price_desc') {
      items = [...items].sort((a, b) => {
        const pa = a.bestOffer?.price.amount ?? Number.POSITIVE_INFINITY;
        const pb = b.bestOffer?.price.amount ?? Number.POSITIVE_INFINITY;
        return query.sortBy === 'price_asc' ? pa - pb : pb - pa;
      });
    }

    return {
      data: {
        items,
        filters: await this.getFilterFacets(),
      },
      meta: paginationMeta(page, pageSize, total),
    };
  }

  async search(query: ProductQueryDto) {
    return this.list({ ...query, sortBy: query.sortBy ?? 'relevance' });
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return mapProductDetail(product);
  }

  async getOffers(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');

    const offers = product.variants
      .flatMap((variant) =>
        variant.listings.map((listing) => ({
          ...mapOfferRow(listing),
          variantId: variant.id,
          sku: variant.sku,
        })),
      )
      .sort((a, b) => a.price.amount - b.price.amount);

    return { productId, offers };
  }

  async getPriceHistory(productId: string, query: PriceHistoryQueryDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { variants: { select: { id: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');

    const days = query.days ?? 90;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const variantIds = product.variants.map((v) => v.id);
    const listings = await this.prisma.retailerListing.findMany({
      where: { productVariantId: { in: variantIds } },
      include: {
        retailer: true,
        priceHistory: {
          where: { recordedAt: { gte: since } },
          orderBy: { recordedAt: 'asc' },
        },
      },
    });

    const snapshots = listings.flatMap((listing) =>
      listing.priceHistory.map((snap) => ({
        id: snap.id,
        retailerListingId: listing.id,
        retailerId: listing.retailerId,
        retailerName: listing.retailer.name,
        amount: decimalToNumber(snap.price),
        currency: snap.currency,
        recordedAt: snap.recordedAt.toISOString(),
        source: snap.source,
        availability: listing.availability,
        isDemonstration: snap.source === 'seed',
      })),
    );

    const amounts = snapshots.map((s) => s.amount);
    const lowestObservedPrice =
      amounts.length > 0
        ? { amount: Math.min(...amounts), currency: 'INR' as const }
        : null;

    return {
      productId,
      days,
      lowestObservedPrice,
      snapshots,
    };
  }

  private buildWhere(query: ProductQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.brands) {
      const brands = query.brands
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (brands.length) {
        where.brand = { in: brands, mode: 'insensitive' };
      }
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice != null || query.maxPrice != null) {
      where.variants = {
        some: {
          listings: {
            some: {
              currentPrice: {
                ...(query.minPrice != null ? { gte: query.minPrice } : {}),
                ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
              },
            },
          },
        },
      };
    }

    return where;
  }

  private buildOrderBy(
    sortBy?: ProductQueryDto['sortBy'],
  ): Prisma.ProductOrderByWithRelationInput {
    if (sortBy === 'newest') return { createdAt: 'desc' };
    return { name: 'asc' };
  }

  private async getFilterFacets() {
    const products = await this.prisma.product.findMany({
      select: { brand: true, category: true },
    });
    const brands = [...new Set(products.map((p) => p.brand))].sort();
    const categories = [...new Set(products.map((p) => p.category))];
    const priceAgg = await this.prisma.retailerListing.aggregate({
      _min: { currentPrice: true },
      _max: { currentPrice: true },
    });
    return {
      brands,
      categories,
      priceBounds: {
        min: priceAgg._min.currentPrice
          ? decimalToNumber(priceAgg._min.currentPrice)
          : 0,
        max: priceAgg._max.currentPrice
          ? decimalToNumber(priceAgg._max.currentPrice)
          : 0,
      },
    };
  }
}
