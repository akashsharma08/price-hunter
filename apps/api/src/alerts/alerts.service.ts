import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { decimalToNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAlertDto) {
    const listing = await this.prisma.retailerListing.findUnique({
      where: { id: dto.retailerListingId },
      include: {
        retailer: true,
        productVariant: { include: { product: true } },
      },
    });
    if (!listing) throw new NotFoundException('Retailer listing not found');

    const alert = await this.prisma.priceAlert.create({
      data: {
        userId,
        retailerListingId: dto.retailerListingId,
        targetPrice: dto.targetPrice,
      },
    });

    return this.mapAlert(alert, listing);
  }

  async list(userId: string) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { userId },
      include: {
        retailerListing: {
          include: {
            retailer: true,
            productVariant: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((alert) => this.mapAlert(alert, alert.retailerListing));
  }

  async update(userId: string, alertId: string, dto: UpdateAlertDto) {
    const existing = await this.prisma.priceAlert.findUnique({
      where: { id: alertId },
      include: {
        retailerListing: {
          include: {
            retailer: true,
            productVariant: { include: { product: true } },
          },
        },
      },
    });
    if (!existing) throw new NotFoundException('Alert not found');
    if (existing.userId !== userId) throw new ForbiddenException();

    const alert = await this.prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        ...(dto.targetPrice != null ? { targetPrice: dto.targetPrice } : {}),
        ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
      },
      include: {
        retailerListing: {
          include: {
            retailer: true,
            productVariant: { include: { product: true } },
          },
        },
      },
    });

    return this.mapAlert(alert, alert.retailerListing);
  }

  async remove(userId: string, alertId: string) {
    const existing = await this.prisma.priceAlert.findUnique({ where: { id: alertId } });
    if (!existing) throw new NotFoundException('Alert not found');
    if (existing.userId !== userId) throw new ForbiddenException();

    await this.prisma.priceAlert.delete({ where: { id: alertId } });
    return { deleted: true };
  }

  private mapAlert(
    alert: {
      id: string;
      userId: string;
      retailerListingId: string;
      targetPrice: { toNumber?: () => number } | number | string;
      isActive: boolean;
      createdAt: Date;
    },
    listing: {
      currentPrice: { toNumber?: () => number } | number | string;
      currency: string;
      retailer: { name: string };
      productVariant: { product: { id: string; name: string; slug: string } };
    },
  ) {
    return {
      id: alert.id,
      retailerListingId: alert.retailerListingId,
      productId: listing.productVariant.product.id,
      productName: listing.productVariant.product.name,
      productSlug: listing.productVariant.product.slug,
      retailerName: listing.retailer.name,
      targetPrice: {
        amount: decimalToNumber(alert.targetPrice as never),
        currency: 'INR' as const,
      },
      currentPrice: {
        amount: decimalToNumber(listing.currentPrice as never),
        currency: listing.currency,
      },
      isActive: alert.isActive,
      createdAt: alert.createdAt.toISOString(),
    };
  }
}
