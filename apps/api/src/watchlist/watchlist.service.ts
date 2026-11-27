import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { decimalToNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { AddWatchlistDto } from './dto/add-watchlist.dto';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        productVariant: {
          include: {
            product: true,
            listings: {
              include: { retailer: true },
              orderBy: { currentPrice: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => {
      const best = item.productVariant.listings[0];
      return {
        id: item.id,
        productVariantId: item.productVariantId,
        productId: item.productVariant.productId,
        addedAt: item.createdAt.toISOString(),
        product: {
          id: item.productVariant.product.id,
          slug: item.productVariant.product.slug,
          name: item.productVariant.product.name,
          brand: item.productVariant.product.brand,
          category: item.productVariant.product.category,
          image: item.productVariant.product.image,
          bestPrice: best
            ? {
                amount: decimalToNumber(best.currentPrice),
                currency: best.currency,
                retailerName: best.retailer.name,
                verifiedAt: best.lastVerifiedAt.toISOString(),
                availability: best.availability,
              }
            : null,
        },
      };
    });
  }

  async add(userId: string, dto: AddWatchlistDto) {
    const variantId = await this.resolveVariantId(dto);
    try {
      const item = await this.prisma.watchlist.create({
        data: { userId, productVariantId: variantId },
      });
      return { id: item.id, productVariantId: item.productVariantId };
    } catch {
      throw new ConflictException('Product is already on your watchlist');
    }
  }

  async remove(userId: string, productId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });
    if (variants.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const result = await this.prisma.watchlist.deleteMany({
      where: {
        userId,
        productVariantId: { in: variants.map((v) => v.id) },
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Watchlist item not found');
    }

    return { removed: true, count: result.count };
  }

  private async resolveVariantId(dto: AddWatchlistDto): Promise<string> {
    if (dto.productVariantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.productVariantId },
      });
      if (!variant) throw new NotFoundException('Product variant not found');
      return variant.id;
    }

    if (dto.productId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { productId: dto.productId },
        orderBy: { createdAt: 'asc' },
      });
      if (!variant) throw new NotFoundException('Product has no variants');
      return variant.id;
    }

    throw new BadRequestException('Provide productVariantId or productId');
  }
}
