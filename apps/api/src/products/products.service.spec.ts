import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const prisma = {
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
    },
    retailerListing: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(prisma as never);
  });

  it('lists products with pagination meta', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        slug: 'demo-phone',
        name: 'Demo Phone',
        brand: 'Demo',
        category: 'smartphones',
        description: 'demo',
        image: '/demo.svg',
        createdAt: new Date(),
        updatedAt: new Date(),
        variants: [
          {
            id: 'v1',
            productId: 'p1',
            sku: 'DEMO-1',
            modelNumber: 'DEMO-1',
            attributes: { color: 'Black' },
            createdAt: new Date(),
            updatedAt: new Date(),
            listings: [
              {
                id: 'l1',
                productVariantId: 'v1',
                retailerId: 'r1',
                externalProductId: null,
                productUrl: null,
                currentPrice: { toNumber: () => 10000 },
                currency: 'INR',
                availability: 'in_stock',
                lastVerifiedAt: new Date(),
                dealLabel: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                retailer: {
                  id: 'r1',
                  name: 'Amazon.in',
                  website: 'https://amazon.in',
                  logo: null,
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            ],
          },
        ],
      },
    ]);
    prisma.product.count.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    prisma.product.findMany
      .mockResolvedValueOnce([
        // first call inside transaction handled above via $transaction
      ])
      .mockResolvedValueOnce([{ brand: 'Demo', category: 'smartphones' }]);

    // Re-wire transaction to return count + products
    prisma.$transaction.mockResolvedValue([
      1,
      [
        {
          id: 'p1',
          slug: 'demo-phone',
          name: 'Demo Phone',
          brand: 'Demo',
          category: 'smartphones',
          description: 'demo',
          image: '/demo.svg',
          createdAt: new Date(),
          updatedAt: new Date(),
          variants: [
            {
              id: 'v1',
              productId: 'p1',
              sku: 'DEMO-1',
              modelNumber: 'DEMO-1',
              attributes: { color: 'Black' },
              createdAt: new Date(),
              updatedAt: new Date(),
              listings: [
                {
                  id: 'l1',
                  productVariantId: 'v1',
                  retailerId: 'r1',
                  externalProductId: null,
                  productUrl: null,
                  currentPrice: { toNumber: () => 10000 },
                  currency: 'INR',
                  availability: 'in_stock',
                  lastVerifiedAt: new Date(),
                  dealLabel: null,
                  isStale: false,
                  providerKey: null,
                  rawPayload: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  retailer: {
                    id: 'r1',
                    name: 'Amazon.in',
                    website: 'https://amazon.in',
                    logo: null,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                },
              ],
            },
          ],
        },
      ],
    ]);
    prisma.retailerListing.aggregate.mockResolvedValue({
      _min: { currentPrice: { toNumber: () => 10000 } },
      _max: { currentPrice: { toNumber: () => 10000 } },
    });

    const result = await service.list({ page: 1, pageSize: 12 });
    expect(result.data.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.data.items[0].bestOffer?.price.amount).toBe(10000);
  });

  it('throws when product slug is missing', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.getBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
