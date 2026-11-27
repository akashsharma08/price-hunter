import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { AddWatchlistDto } from './dto/add-watchlist.dto';
import { WatchlistService } from './watchlist.service';

@ApiTags('watchlist')
@ApiBearerAuth()
@Controller('users/me/watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'List watchlist items for the current user' })
  list(@CurrentUser() user: AuthUser) {
    return this.watchlistService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a product variant to the watchlist' })
  add(@CurrentUser() user: AuthUser, @Body() dto: AddWatchlistDto) {
    return this.watchlistService.add(user.id, dto);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from the watchlist' })
  remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.watchlistService.remove(user.id, productId);
  }
}
