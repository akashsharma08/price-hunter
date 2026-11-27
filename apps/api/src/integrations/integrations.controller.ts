import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Provider capability status (credentials never exposed)',
  })
  status() {
    return this.integrationsService.getStatus();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('variants/:variantId/refresh')
  @ApiOperation({
    summary: 'Refresh a variant from live-ready authorized providers only',
  })
  refreshVariant(@Param('variantId') variantId: string) {
    return this.integrationsService.refreshVariant(variantId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('products/:productId/refresh')
  @ApiOperation({ summary: 'Refresh all variants for a product from live providers' })
  refreshProduct(@Param('productId') productId: string) {
    return this.integrationsService.refreshProduct(productId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('maintenance/mark-stale')
  @ApiOperation({ summary: 'Mark listings older than stale threshold' })
  markStale() {
    return this.integrationsService.markStale();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('failures')
  @ApiOperation({ summary: 'Recent integration failures' })
  failures(@Query('limit') limit?: string) {
    return this.integrationsService.recentFailures(limit ? Number(limit) : 20);
  }
}
