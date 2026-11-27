import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NormalizedRetailerOffer } from '../providers/types';

export type PriceValidationCode =
  | 'ok'
  | 'invalid_price'
  | 'missing_url'
  | 'unavailable'
  | 'suspicious_change'
  | 'stale';

export interface PriceValidationResult {
  code: PriceValidationCode;
  accepted: boolean;
  markStale?: boolean;
  message: string;
}

@Injectable()
export class PriceValidatorService {
  constructor(private readonly config: ConfigService) {}

  validate(
    offer: NormalizedRetailerOffer,
    previousPrice?: number | null,
    options?: { treatAsCurrent?: boolean },
  ): PriceValidationResult {
    if (!Number.isFinite(offer.price) || offer.price <= 0) {
      return {
        code: 'invalid_price',
        accepted: false,
        message: 'Price must be a positive finite INR amount',
      };
    }

    if (!offer.productUrl?.startsWith('http')) {
      return {
        code: 'missing_url',
        accepted: false,
        message: 'Purchase link is required for every offer',
      };
    }

    if (offer.availability === 'out_of_stock') {
      return {
        code: 'unavailable',
        accepted: true,
        message: 'Product unavailable — retain snapshot but do not promote as buyable current deal',
      };
    }

    const verifiedAt = new Date(offer.lastVerifiedAt);
    const staleHours = this.config.get<number>('integrations.staleAfterHours') ?? 24;
    const ageMs = Date.now() - verifiedAt.getTime();
    if (Number.isNaN(verifiedAt.getTime()) || ageMs > staleHours * 3_600_000) {
      return {
        code: 'stale',
        accepted: false,
        markStale: true,
        message: `Offer older than ${staleHours}h cannot be shown as current`,
      };
    }

    if (previousPrice != null && previousPrice > 0 && options?.treatAsCurrent !== false) {
      const changePct = Math.abs(offer.price - previousPrice) / previousPrice;
      const threshold =
        (this.config.get<number>('integrations.suspiciousChangePercent') ?? 40) / 100;
      if (changePct >= threshold) {
        return {
          code: 'suspicious_change',
          accepted: false,
          message: `Price changed by ${(changePct * 100).toFixed(1)}% vs previous verified amount`,
        };
      }
    }

    return { code: 'ok', accepted: true, message: 'Valid offer' };
  }

  isStaleTimestamp(lastVerifiedAt: Date | string, now = new Date()): boolean {
    const verifiedAt = new Date(lastVerifiedAt);
    const staleHours = this.config.get<number>('integrations.staleAfterHours') ?? 24;
    return now.getTime() - verifiedAt.getTime() > staleHours * 3_600_000;
  }
}
