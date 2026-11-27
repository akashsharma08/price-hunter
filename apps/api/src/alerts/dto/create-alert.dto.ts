import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty({ description: 'Retailer listing to monitor' })
  @IsString()
  retailerListingId!: string;

  @ApiProperty({ example: 99999 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  targetPrice!: number;
}
