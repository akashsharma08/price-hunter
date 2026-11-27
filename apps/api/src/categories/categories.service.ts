import { Injectable } from '@nestjs/common';
import { ProductCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CATEGORY_META: Record<
  ProductCategory,
  { name: string; description: string }
> = {
  smartphones: {
    name: 'Smartphones',
    description: 'Flagships and mid-range phones across major Indian retailers.',
  },
  laptops: {
    name: 'Laptops',
    description: 'Ultrabooks, creator machines, and gaming notebooks.',
  },
  headphones: {
    name: 'Headphones',
    description: 'ANC over-ears and true wireless earbuds.',
  },
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const grouped = await this.prisma.product.groupBy({
      by: ['category'],
      _count: { _all: true },
    });

    return Object.values(ProductCategory).map((id) => {
      const row = grouped.find((g) => g.category === id);
      return {
        id,
        name: CATEGORY_META[id].name,
        description: CATEGORY_META[id].description,
        productCount: row?._count._all ?? 0,
      };
    });
  }
}
