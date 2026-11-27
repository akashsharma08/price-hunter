import { NotFoundException } from '@nestjs/common';
import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  const prisma = {
    retailerListing: {
      findUnique: jest.fn(),
    },
    priceAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: AlertsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlertsService(prisma as never);
  });

  it('creates an alert for a valid listing', async () => {
    prisma.retailerListing.findUnique.mockResolvedValue({
      id: 'l1',
      currentPrice: { toNumber: () => 12000 },
      currency: 'INR',
      retailer: { name: 'Amazon.in' },
      productVariant: {
        product: { id: 'p1', name: 'Demo Phone', slug: 'demo-phone' },
      },
    });
    prisma.priceAlert.create.mockResolvedValue({
      id: 'a1',
      userId: 'u1',
      retailerListingId: 'l1',
      targetPrice: { toNumber: () => 10000 },
      isActive: true,
      createdAt: new Date('2026-11-01'),
    });

    const result = await service.create('u1', {
      retailerListingId: 'l1',
      targetPrice: 10000,
    });

    expect(result.id).toBe('a1');
    expect(result.targetPrice.amount).toBe(10000);
    expect(result.currentPrice.amount).toBe(12000);
  });

  it('rejects alert creation for unknown listing', async () => {
    prisma.retailerListing.findUnique.mockResolvedValue(null);
    await expect(
      service.create('u1', { retailerListingId: 'missing', targetPrice: 1000 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
