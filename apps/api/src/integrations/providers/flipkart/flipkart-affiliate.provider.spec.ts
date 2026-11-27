import { ConfigService } from '@nestjs/config';
import { FlipkartAffiliateProvider } from './flipkart-affiliate.provider';
import { ProviderNotConfiguredError } from '../types';

describe('FlipkartAffiliateProvider', () => {
  it('reports not live-ready without credentials', () => {
    const config = {
      get: (key: string) => {
        if (key === 'integrations.flipkart.enabled') return true;
        return undefined;
      },
    } as unknown as ConfigService;

    const provider = new FlipkartAffiliateProvider(config);
    const status = provider.getStatus();
    expect(status.liveReady).toBe(false);
    expect(status.missingConfig).toEqual(
      expect.arrayContaining(['FLIPKART_AFFILIATE_ID', 'FLIPKART_AFFILIATE_TOKEN']),
    );
  });

  it('refuses live calls without credentials', async () => {
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;
    const provider = new FlipkartAffiliateProvider(config);

    await expect(
      provider.getCurrentPrice({ externalProductId: 'ABC' }),
    ).rejects.toBeInstanceOf(ProviderNotConfiguredError);
  });
});
