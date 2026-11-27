import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Public()
  @Get('listings/:id')
  @ApiOperation({ summary: 'Get a retailer listing price snapshot' })
  getListing(@Param('id') id: string) {
    return this.pricingService.getListing(id);
  }

  @Public()
  @Get('listings/:id/history')
  @ApiOperation({ summary: 'Get immutable history for a retailer listing' })
  getHistory(@Param('id') id: string) {
    return this.pricingService.getListingHistory(id);
  }
}
