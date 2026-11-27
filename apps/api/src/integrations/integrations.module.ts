import { Module } from '@nestjs/common';
import { PriceIngestionService } from './ingestion/price-ingestion.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ProductMatcherService } from './matching/product-matcher.service';
import { PriceNormalizerService } from './normalization/price-normalizer.service';
import { AmazonCreatorsProvider } from './providers/amazon/amazon-creators.provider';
import { FlipkartAffiliateProvider } from './providers/flipkart/flipkart-affiliate.provider';
import { RETAILER_PROVIDERS } from './providers/retailer-provider.interface';
import { PriceValidatorService } from './validation/price-validator.service';

@Module({
  controllers: [IntegrationsController],
  providers: [
    AmazonCreatorsProvider,
    FlipkartAffiliateProvider,
    {
      provide: RETAILER_PROVIDERS,
      useFactory: (
        amazon: AmazonCreatorsProvider,
        flipkart: FlipkartAffiliateProvider,
      ) => [amazon, flipkart],
      inject: [AmazonCreatorsProvider, FlipkartAffiliateProvider],
    },
    ProductMatcherService,
    PriceNormalizerService,
    PriceValidatorService,
    PriceIngestionService,
    IntegrationsService,
  ],
  exports: [
    PriceIngestionService,
    ProductMatcherService,
    PriceValidatorService,
    IntegrationsService,
  ],
})
export class IntegrationsModule {}
