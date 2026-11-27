import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RetailersService } from './retailers.service';

@ApiTags('retailers')
@Controller('retailers')
export class RetailersController {
  constructor(private readonly retailersService: RetailersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active retailers' })
  list() {
    return this.retailersService.list();
  }
}
