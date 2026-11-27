import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Refresh token to revoke. If omitted, all refresh tokens for the user are revoked.',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}
