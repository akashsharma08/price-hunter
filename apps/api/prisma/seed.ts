/**
 * DEMONSTRATION SEED DATA
 * Prices are labelled sample values for development — not live retailer market data.
 * Real retailer adapters arrive in a later phase.
 */

import {
  AvailabilityStatus,
  PrismaClient,
  ProductCategory,
  NotificationType,
  PriceHistorySource,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type SeedOffer = {
  retailer: string;
  price: number;
  availability?: AvailabilityStatus;
  dealLabel?: string;
};

type SeedProduct = {
  name: string;
  slug: string;
  brand: string;
  category: ProductCategory;
  description: string;
  image: string;
  sku: string;
  attributes: Record<string, string>;
  offers: SeedOffer[];
};

const RETAILERS = [
  { name: 'Amazon.in', website: 'https://www.amazon.in', logo: '/demo/retailers/amazon.svg' },
  { name: 'Flipkart', website: 'https://www.flipkart.com', logo: '/demo/retailers/flipkart.svg' },
  { name: 'Croma', website: 'https://www.croma.com', logo: '/demo/retailers/croma.svg' },
  {
    name: 'Reliance Digital',
    website: 'https://www.reliancedigital.in',
    logo: '/demo/retailers/reliance.svg',
  },
  {
    name: 'Vijay Sales',
    website: 'https://www.vijaysales.com',
    logo: '/demo/retailers/vijay.svg',
  },
] as const;

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Apple iPhone 16 Pro',
    slug: 'apple-iphone-16-pro-128gb-black-titanium',
    brand: 'Apple',
    category: 'smartphones',
    description:
      'Flagship A18 Pro performance, titanium design, and advanced camera system for photography and video.',
    image: '/demo/products/iphone-16-pro.svg',
    sku: 'IPH16PRO-128-BT',
    attributes: { storage: '128GB', color: 'Black Titanium' },
    offers: [
      { retailer: 'Amazon.in', price: 112900, dealLabel: 'Festival deal' },
      { retailer: 'Flipkart', price: 114999 },
      { retailer: 'Croma', price: 116490, availability: 'limited' },
      { retailer: 'Reliance Digital', price: 117999 },
    ],
  },
  {
    name: 'Samsung Galaxy S25 Ultra',
    slug: 'samsung-galaxy-s25-ultra-256gb-titanium-gray',
    brand: 'Samsung',
    category: 'smartphones',
    description: 'S Pen productivity, 200MP camera stack, and Snapdragon leadership for power users.',
    image: '/demo/products/s25-ultra.svg',
    sku: 'S25U-256-TG',
    attributes: { storage: '256GB', color: 'Titanium Gray' },
    offers: [
      { retailer: 'Flipkart', price: 118999, dealLabel: 'Bank offer' },
      { retailer: 'Amazon.in', price: 121490 },
      { retailer: 'Vijay Sales', price: 124990, availability: 'limited' },
    ],
  },
  {
    name: 'Google Pixel 9 Pro',
    slug: 'google-pixel-9-pro-128gb-obsidian',
    brand: 'Google',
    category: 'smartphones',
    description: 'Computational photography flagship with clean Android and multi-year updates.',
    image: '/demo/products/pixel-9-pro.svg',
    sku: 'PIX9PRO-128-OB',
    attributes: { storage: '128GB', color: 'Obsidian' },
    offers: [
      { retailer: 'Amazon.in', price: 89999 },
      { retailer: 'Flipkart', price: 87999, dealLabel: 'Lowest today' },
      { retailer: 'Croma', price: 92990 },
    ],
  },
  {
    name: 'Nothing Phone (3)',
    slug: 'nothing-phone-3-256gb-black',
    brand: 'Nothing',
    category: 'smartphones',
    description:
      'Glyph interface design language with clean software and competitive mid-premium pricing.',
    image: '/demo/products/nothing-phone.svg',
    sku: 'NP3-256-BK',
    attributes: { storage: '256GB', color: 'Black' },
    offers: [
      { retailer: 'Flipkart', price: 44999, dealLabel: 'Launch price' },
      { retailer: 'Amazon.in', price: 45990 },
      { retailer: 'Reliance Digital', price: 46999, availability: 'limited' },
    ],
  },
  {
    name: 'OnePlus 13',
    slug: 'oneplus-13-256gb-midnight-ocean',
    brand: 'OnePlus',
    category: 'smartphones',
    description: 'Fast charging, high refresh display, and OxygenOS refinements for daily power use.',
    image: '/demo/products/oneplus-13.svg',
    sku: 'OP13-256-MO',
    attributes: { storage: '256GB', color: 'Midnight Ocean' },
    offers: [
      { retailer: 'Amazon.in', price: 69999 },
      { retailer: 'Flipkart', price: 68999, dealLabel: 'Exchange bonus' },
      { retailer: 'Croma', price: 71990 },
    ],
  },
  {
    name: 'MacBook Air 13" M3',
    slug: 'apple-macbook-air-13-m3-16gb-256gb',
    brand: 'Apple',
    category: 'laptops',
    description: 'Thin fanless notebook with M3 efficiency for students and creators on the move.',
    image: '/demo/products/macbook-air.svg',
    sku: 'MBA13-M3-16-256',
    attributes: { memory: '16GB', storage: '256GB', color: 'Midnight' },
    offers: [
      { retailer: 'Amazon.in', price: 114900, dealLabel: 'Education price' },
      { retailer: 'Flipkart', price: 116990, availability: 'limited' },
      { retailer: 'Croma', price: 118490 },
      { retailer: 'Reliance Digital', price: 119990 },
    ],
  },
  {
    name: 'ASUS Zenbook 14 OLED',
    slug: 'asus-zenbook-14-oled-ultra-7',
    brand: 'ASUS',
    category: 'laptops',
    description: 'OLED ultrabook with Intel Core Ultra and a light chassis for professionals.',
    image: '/demo/products/zenbook.svg',
    sku: 'ZB14-U7-16-1TB',
    attributes: { cpu: 'Ultra 7', memory: '16GB', storage: '1TB' },
    offers: [
      { retailer: 'Flipkart', price: 94990, dealLabel: 'Card discount' },
      { retailer: 'Amazon.in', price: 96990 },
      { retailer: 'Vijay Sales', price: 98990, availability: 'limited' },
    ],
  },
  {
    name: 'Dell XPS 14',
    slug: 'dell-xps-14-ultra-7-32gb',
    brand: 'Dell',
    category: 'laptops',
    description: 'Premium InfinityEdge laptop built for creators who need colour-accurate screens.',
    image: '/demo/products/xps.svg',
    sku: 'XPS14-U7-32-1TB',
    attributes: { cpu: 'Ultra 7', memory: '32GB', storage: '1TB' },
    offers: [
      { retailer: 'Amazon.in', price: 189990, availability: 'limited' },
      { retailer: 'Croma', price: 192490 },
      { retailer: 'Reliance Digital', price: 194990, availability: 'out_of_stock' },
    ],
  },
  {
    name: 'Lenovo Legion Pro 5',
    slug: 'lenovo-legion-pro-5-rtx-4070',
    brand: 'Lenovo',
    category: 'laptops',
    description: 'High-refresh gaming laptop with strong thermals for AAA titles and content work.',
    image: '/demo/products/legion.svg',
    sku: 'LEGPRO5-R7-4070',
    attributes: { cpu: 'Ryzen 7', gpu: 'RTX 4070', memory: '16GB' },
    offers: [
      { retailer: 'Flipkart', price: 139990, dealLabel: 'Bundle deal' },
      { retailer: 'Amazon.in', price: 142490 },
      { retailer: 'Vijay Sales', price: 144990 },
    ],
  },
  {
    name: 'Lenovo Yoga Slim 7i Aura',
    slug: 'lenovo-yoga-slim-7i-aura',
    brand: 'Lenovo',
    category: 'laptops',
    description: 'AI PC ultrabook with quiet performance and a bright OLED panel.',
    image: '/demo/products/yoga-slim.svg',
    sku: 'YOGA7I-U7-32-1TB',
    attributes: { cpu: 'Ultra 7', memory: '32GB', storage: '1TB' },
    offers: [
      { retailer: 'Amazon.in', price: 109990 },
      { retailer: 'Flipkart', price: 107990, dealLabel: 'Price drop' },
      { retailer: 'Croma', price: 112490, availability: 'limited' },
    ],
  },
  {
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5-black',
    brand: 'Sony',
    category: 'headphones',
    description:
      'Industry-leading noise cancellation with refined comfort for long flights and deep work.',
    image: '/demo/products/sony-xm5.svg',
    sku: 'SONY-XM5-BK',
    attributes: { color: 'Black', type: 'Over-ear' },
    offers: [
      { retailer: 'Amazon.in', price: 24990, dealLabel: 'Lightning deal' },
      { retailer: 'Flipkart', price: 25990 },
      { retailer: 'Croma', price: 26990 },
      { retailer: 'Reliance Digital', price: 27490, availability: 'limited' },
    ],
  },
  {
    name: 'Bose QuietComfort Ultra',
    slug: 'bose-quietcomfort-ultra-headphones',
    brand: 'Bose',
    category: 'headphones',
    description: 'Immersive audio with spatial modes and signature Bose noise cancellation.',
    image: '/demo/products/bose-qc.svg',
    sku: 'BOSE-QCU-BK',
    attributes: { color: 'Black', type: 'Over-ear' },
    offers: [
      { retailer: 'Flipkart', price: 28890 },
      { retailer: 'Amazon.in', price: 27990, dealLabel: 'Deal of the day' },
      { retailer: 'Croma', price: 29990, availability: 'limited' },
    ],
  },
  {
    name: 'Apple AirPods Max',
    slug: 'apple-airpods-max-usb-c-midnight',
    brand: 'Apple',
    category: 'headphones',
    description: 'Premium over-ear audio with Spatial Audio and seamless Apple ecosystem pairing.',
    image: '/demo/products/airpods-max.svg',
    sku: 'APMAX-USBC-MN',
    attributes: { color: 'Midnight', connector: 'USB-C' },
    offers: [
      { retailer: 'Amazon.in', price: 59900 },
      { retailer: 'Flipkart', price: 58900, availability: 'limited', dealLabel: 'Bank offer' },
      { retailer: 'Croma', price: 60900 },
    ],
  },
  {
    name: 'Samsung Galaxy Buds FE',
    slug: 'samsung-galaxy-buds-fe',
    brand: 'Samsung',
    category: 'headphones',
    description: 'Affordable true wireless earbuds with solid ANC for Galaxy phone users.',
    image: '/demo/products/buds-fe.svg',
    sku: 'BUDSFE-GR',
    attributes: { color: 'Graphite', type: 'TWS' },
    offers: [
      { retailer: 'Amazon.in', price: 6999, dealLabel: 'Prime deal' },
      { retailer: 'Flipkart', price: 7499 },
      { retailer: 'Reliance Digital', price: 7990 },
    ],
  },
  {
    name: 'Nothing Ear (Open)',
    slug: 'nothing-ear-open',
    brand: 'Nothing',
    category: 'headphones',
    description: 'Open-ear design for all-day awareness with transparent Nothing aesthetic.',
    image: '/demo/products/nothing-ear.svg',
    sku: 'EAROPEN-WH',
    attributes: { color: 'White', type: 'Open-ear' },
    offers: [
      { retailer: 'Flipkart', price: 12999 },
      { retailer: 'Amazon.in', price: 12499, dealLabel: 'Coupon applied' },
      { retailer: 'Croma', price: 13990, availability: 'limited' },
    ],
  },
];

function historyPoints(best: number): number[] {
  const points: number[] = [];
  for (let i = 23; i >= 0; i -= 1) {
    const wave = Math.sin(i / 3) * 0.03 + (i / 24) * 0.08;
    points.push(Math.round(best * (1 + wave)));
  }
  return points;
}

async function main() {
  console.log('Seeding PRICE HUNTER demonstration data…');

  await prisma.notification.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.retailerListing.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.retailer.deleteMany();

  const retailerMap = new Map<string, string>();
  for (const retailer of RETAILERS) {
    const created = await prisma.retailer.create({ data: { ...retailer, isActive: true } });
    retailerMap.set(created.name, created.id);
  }

  const verifiedAt = new Date('2026-11-27T06:00:00.000Z');
  let firstListingId: string | undefined;
  let firstVariantId: string | undefined;
  let sonyListingId: string | undefined;
  let budsListingId: string | undefined;
  let iphoneVariantId: string | undefined;
  let zenbookVariantId: string | undefined;

  for (const product of PRODUCTS) {
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        category: product.category,
        description: product.description,
        image: product.image,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: createdProduct.id,
        sku: product.sku,
        modelNumber: product.sku,
        attributes: product.attributes,
      },
    });

    if (product.slug.includes('iphone-16-pro')) iphoneVariantId = variant.id;
    if (product.slug.includes('zenbook')) zenbookVariantId = variant.id;
    if (!firstVariantId) firstVariantId = variant.id;

    const prices = product.offers.map((o) => o.price);
    const best = Math.min(...prices);
    const points = historyPoints(best);

    for (const offer of product.offers) {
      const retailerId = retailerMap.get(offer.retailer);
      if (!retailerId) continue;

      const listing = await prisma.retailerListing.create({
        data: {
          productVariantId: variant.id,
          retailerId,
          externalProductId: `${product.sku}-${offer.retailer}`,
          productUrl: `${RETAILERS.find((r) => r.name === offer.retailer)?.website ?? ''}/dp/${product.sku}`,
          currentPrice: offer.price,
          currency: 'INR',
          availability: offer.availability ?? 'in_stock',
          lastVerifiedAt: verifiedAt,
          dealLabel: offer.dealLabel,
        },
      });

      if (!firstListingId) firstListingId = listing.id;
      if (product.slug.includes('sony-wh-1000xm5') && offer.retailer === 'Amazon.in') {
        sonyListingId = listing.id;
      }
      if (product.slug.includes('buds-fe') && offer.retailer === 'Amazon.in') {
        budsListingId = listing.id;
      }

      for (let i = 0; i < points.length; i += 1) {
        const day = new Date(verifiedAt);
        day.setDate(day.getDate() - (points.length - 1 - i) * 7);
        await prisma.priceHistory.create({
          data: {
            retailerListingId: listing.id,
            price: i === points.length - 1 ? offer.price : points[i],
            currency: 'INR',
            recordedAt: day,
            source: PriceHistorySource.seed,
          },
        });
      }
    }
  }

  const passwordHash = await bcrypt.hash('password123', 12);
  const demoUser = await prisma.user.create({
    data: {
      name: 'Akash Sharma',
      email: 'akash@example.com',
      passwordHash,
      role: 'USER',
    },
  });

  if (iphoneVariantId) {
    await prisma.watchlist.create({
      data: { userId: demoUser.id, productVariantId: iphoneVariantId },
    });
  }
  if (firstVariantId && firstVariantId !== iphoneVariantId) {
    // also track sony via lookup
  }
  const sonyVariant = await prisma.productVariant.findFirst({
    where: { sku: 'SONY-XM5-BK' },
  });
  if (sonyVariant) {
    await prisma.watchlist.create({
      data: { userId: demoUser.id, productVariantId: sonyVariant.id },
    });
  }
  if (zenbookVariantId) {
    await prisma.watchlist.create({
      data: { userId: demoUser.id, productVariantId: zenbookVariantId },
    });
  }

  if (firstListingId) {
    await prisma.priceAlert.create({
      data: {
        userId: demoUser.id,
        retailerListingId: firstListingId,
        targetPrice: 109000,
        isActive: true,
      },
    });
  }
  if (sonyListingId) {
    await prisma.priceAlert.create({
      data: {
        userId: demoUser.id,
        retailerListingId: sonyListingId,
        targetPrice: 22990,
        isActive: true,
      },
    });
  }
  if (budsListingId) {
    await prisma.priceAlert.create({
      data: {
        userId: demoUser.id,
        retailerListingId: budsListingId,
        targetPrice: 6999,
        isActive: false,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'Price alert triggered',
        message: 'Samsung Galaxy Buds FE hit your target of ₹6,999 (demo seed).',
        type: NotificationType.alert_triggered,
      },
      {
        userId: demoUser.id,
        title: 'Price drop detected',
        message: 'Sony WH-1000XM5 dropped across tracked demo retailers.',
        type: NotificationType.price_drop,
      },
      {
        userId: demoUser.id,
        title: 'Weekly digest',
        message: '3 watchlist items moved this week. Review trends in your dashboard.',
        type: NotificationType.system,
        readAt: new Date('2026-11-24T08:00:00.000Z'),
      },
    ],
  });

  console.log('Seed complete.');
  console.log('Demo user: akash@example.com / password123');
  console.log('NOTE: All seeded prices are demonstration data, not live market prices.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
