import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AddWatchlistDto {
  @ApiPropertyOptional({
    description: 'Product variant id to watch. Prefer this when known.',
  })
  @IsOptional()
  @IsString()
  productVariantId?: string;

  @ApiPropertyOptional({
    description: 'Product id — watches the primary (first) variant when variant id is omitted.',
  })
  @IsOptional()
  @IsString()
  productId?: string;
}
