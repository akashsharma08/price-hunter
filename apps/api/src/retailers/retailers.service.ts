import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetailersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const retailers = await this.prisma.retailer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return retailers.map((r) => ({
      id: r.id,
      name: r.name,
      website: r.website,
      logo: r.logo,
      isActive: r.isActive,
    }));
  }
}
