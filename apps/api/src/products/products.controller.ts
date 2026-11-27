import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PriceHistoryQueryDto, ProductQueryDto } from './dto/product-query.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filtering and pagination' })
  list(@Query() query: ProductQueryDto) {
    return this.productsService.list(query);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  search(@Query() query: ProductQueryDto) {
    return this.productsService.search(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product detail by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }

  @Public()
  @Get(':id/offers')
  @ApiOperation({ summary: 'Get current retailer offers for a product id' })
  getOffers(@Param('id') id: string) {
    return this.productsService.getOffers(id);
  }

  @Public()
  @Get(':id/price-history')
  @ApiOperation({ summary: 'Get immutable price history snapshots for a product' })
  getPriceHistory(@Param('id') id: string, @Query() query: PriceHistoryQueryDto) {
    return this.productsService.getPriceHistory(id, query);
  }
}
