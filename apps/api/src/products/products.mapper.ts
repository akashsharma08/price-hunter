import type {
  AvailabilityStatus,
  Product,
  ProductCategory,
  ProductVariant,
  Retailer,
  RetailerListing,
} from '@prisma/client';
import { decimalToNumber } from '../common/utils/money';

type ListingWithRetailer = RetailerListing & { retailer: Retailer };
type VariantWithListings = ProductVariant & { listings: ListingWithRetailer[] };
type ProductWithVariants = Product & { variants: VariantWithListings[] };

function attributesToVariantLabel(attributes: unknown): string {
  if (!attributes || typeof attributes !== 'object') return '';
  const entries = Object.entries(attributes as Record<string, unknown>)
    .filter(([, v]) => v != null && String(v).length > 0)
    .map(([, v]) => String(v));
  return entries.join(' · ');
}

function mapOffer(listing: ListingWithRetailer) {
  const isDemonstration = listing.providerKey == null;
  return {
    id: listing.id,
    retailerId: listing.retailerId,
    retailerName: listing.retailer.name,
    retailerWebsite: listing.retailer.website,
    retailerLogo: listing.retailer.logo,
    externalProductId: listing.externalProductId,
    productUrl: listing.productUrl,
    dealLabel: listing.dealLabel,
    isStale: listing.isStale,
    providerKey: listing.providerKey,
    price: {
      amount: decimalToNumber(listing.currentPrice),
      currency: listing.currency,
      source: listing.providerKey ?? listing.retailer.name,
      retailerName: listing.retailer.name,
      verifiedAt: listing.lastVerifiedAt.toISOString(),
      availability: listing.availability as AvailabilityStatus,
      url: listing.productUrl ?? undefined,
      isDemonstration,
    },
  };
}

export function mapProductSummary(product: ProductWithVariants) {
  const primaryVariant = product.variants[0];
  const allListings = product.variants.flatMap((v) => v.listings);
  const best =
    allListings.length > 0
      ? [...allListings].sort(
          (a, b) => decimalToNumber(a.currentPrice) - decimalToNumber(b.currentPrice),
        )[0]
      : undefined;

  const hasLiveProvider = allListings.some((l) => l.providerKey != null);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category as ProductCategory,
    description: product.description,
    image: product.image,
    imageUrls: [product.image],
    variant: primaryVariant ? attributesToVariantLabel(primaryVariant.attributes) : '',
    primaryVariantId: primaryVariant?.id ?? null,
    offers: allListings.map(mapOffer),
    bestOffer: best ? mapOffer(best) : null,
    isDemonstration: !hasLiveProvider,
    createdAt: product.createdAt.toISOString(),
  };
}

export function mapProductDetail(product: ProductWithVariants) {
  const summary = mapProductSummary(product);
  return {
    ...summary,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      modelNumber: variant.modelNumber,
      attributes: variant.attributes,
      label: attributesToVariantLabel(variant.attributes),
      offers: variant.listings.map(mapOffer),
    })),
  };
}

export function mapOfferRow(listing: ListingWithRetailer) {
  return mapOffer(listing);
}
