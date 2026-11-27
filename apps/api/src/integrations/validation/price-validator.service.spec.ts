import { ConfigService } from '@nestjs/config';
import { PriceValidatorService } from './price-validator.service';
import type { NormalizedRetailerOffer } from '../providers/types';

describe('PriceValidatorService', () => {
  const config = {
    get: (key: string) => {
      if (key === 'integrations.staleAfterHours') return 24;
      if (key === 'integrations.suspiciousChangePercent') return 40;
      return undefined;
    },
  } as unknown as ConfigService;

  const validator = new PriceValidatorService(config);

  const baseOffer: NormalizedRetailerOffer = {
    retailerId: 'r1',
    productVariantId: 'v1',
    price: 10000,
    currency: 'INR',
    availability: 'in_stock',
    productUrl: 'https://www.amazon.in/dp/B0TEST',
    lastVerifiedAt: new Date().toISOString(),
    source: 'amazon_in_creators',
  };

  it('accepts a valid current offer', () => {
    expect(validator.validate(baseOffer).accepted).toBe(true);
  });

  it('rejects non-positive prices', () => {
    expect(validator.validate({ ...baseOffer, price: 0 }).code).toBe('invalid_price');
  });

  it('rejects missing purchase links', () => {
    expect(validator.validate({ ...baseOffer, productUrl: '' }).code).toBe('missing_url');
  });

  it('flags suspicious price swings', () => {
    const result = validator.validate(baseOffer, 20000);
    expect(result.code).toBe('suspicious_change');
    expect(result.accepted).toBe(false);
  });

  it('marks old timestamps as stale for current display', () => {
    const old = {
      ...baseOffer,
      lastVerifiedAt: new Date(Date.now() - 48 * 3_600_000).toISOString(),
    };
    const result = validator.validate(old);
    expect(result.code).toBe('stale');
    expect(result.markStale).toBe(true);
  });
});
