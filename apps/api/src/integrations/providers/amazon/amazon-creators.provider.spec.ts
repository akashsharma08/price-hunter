import { ConfigService } from '@nestjs/config';
import { AmazonCreatorsProvider } from './amazon-creators.provider';
import { ProviderNotConfiguredError } from '../types';

describe('AmazonCreatorsProvider', () => {
  it('reports not live-ready without credentials', () => {
    const config = {
      get: (key: string) => {
        if (key === 'integrations.amazon.enabled') return true;
        return undefined;
      },
    } as unknown as ConfigService;

    const provider = new AmazonCreatorsProvider(config);
    const status = provider.getStatus();
    expect(status.liveReady).toBe(false);
    expect(status.missingConfig).toEqual(
      expect.arrayContaining([
        'AMAZON_CREDENTIAL_ID',
        'AMAZON_CREDENTIAL_SECRET',
        'AMAZON_PARTNER_TAG',
      ]),
    );
  });

  it('refuses to invent prices when disabled', async () => {
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;
    const provider = new AmazonCreatorsProvider(config);

    await expect(
      provider.searchProducts({ keywords: 'iphone' }),
    ).rejects.toBeInstanceOf(ProviderNotConfiguredError);
  });
});
