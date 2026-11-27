import { Injectable } from '@nestjs/common';
import type {
  NormalizedRetailerOffer,
  ProviderAvailabilityResult,
  ProviderPriceResult,
  ProviderSearchResultItem,
} from '../providers/types';

@Injectable()
export class PriceNormalizerService {
  fromProviderPrice(input: {
    retailerId: string;
    productVariantId: string;
    source: string;
    price: ProviderPriceResult;
    availability?: ProviderAvailabilityResult['availability'];
  }): NormalizedRetailerOffer {
    return {
      retailerId: input.retailerId,
      productVariantId: input.productVariantId,
      price: Number(input.price.price),
      currency: 'INR',
      availability: input.availability ?? 'unknown',
      productUrl: input.price.productUrl,
      lastVerifiedAt: input.price.verifiedAt,
      source: input.source,
      externalProductId: input.price.externalProductId,
      raw: input.price.raw,
    };
  }

  fromSearchCandidate(input: {
    retailerId: string;
    productVariantId: string;
    source: string;
    candidate: ProviderSearchResultItem;
  }): NormalizedRetailerOffer | null {
    if (input.candidate.price == null || !input.candidate.productUrl) {
      return null;
    }
    return {
      retailerId: input.retailerId,
      productVariantId: input.productVariantId,
      price: Number(input.candidate.price),
      currency: 'INR',
      availability: input.candidate.availability ?? 'unknown',
      productUrl: input.candidate.productUrl,
      lastVerifiedAt: new Date().toISOString(),
      source: input.source,
      externalProductId: input.candidate.externalProductId,
      raw: input.candidate.raw,
    };
  }
}
