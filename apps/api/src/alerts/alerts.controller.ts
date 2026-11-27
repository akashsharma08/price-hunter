import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a price alert' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAlertDto) {
    return this.alertsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List price alerts for the current user' })
  list(@CurrentUser() user: AuthUser) {
    return this.alertsService.list(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a price alert' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alertsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price alert' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.alertsService.remove(user.id, id);
  }
}
