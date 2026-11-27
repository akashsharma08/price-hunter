import { ProductMatcherService } from './product-matcher.service';

describe('ProductMatcherService', () => {
  const matcher = new ProductMatcherService();

  const catalog = {
    brand: 'Apple',
    name: 'iPhone 16 Pro',
    modelNumber: 'A3293',
    attributes: { storage: '128GB', color: 'Black Titanium' },
  };

  it('scores a strong variant match highly', () => {
    const result = matcher.bestMatch(catalog, [
      {
        externalProductId: 'B0TEST',
        title: 'Apple iPhone 16 Pro 128GB Black Titanium',
        brand: 'Apple',
        modelNumber: 'A3293',
        attributes: { storage: '128GB', color: 'Black Titanium' },
      },
    ]);

    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result!.matchedOn).toEqual(
      expect.arrayContaining(['brand', 'storage', 'color', 'model_number']),
    );
  });

  it('rejects storage mismatches to prevent wrong variant comparisons', () => {
    const ranked = matcher.match(catalog, [
      {
        externalProductId: 'B0WRONG',
        title: 'Apple iPhone 16 Pro 256GB Black Titanium',
        brand: 'Apple',
        attributes: { storage: '256GB', color: 'Black Titanium' },
      },
    ]);

    expect(ranked[0].rejectedReason).toBe('storage_mismatch');
    expect(ranked[0].confidence).toBe(0);
  });

  it('rejects brand mismatches', () => {
    const ranked = matcher.match(catalog, [
      {
        externalProductId: 'B0OTHER',
        title: 'Samsung Galaxy S25 Ultra 128GB',
        brand: 'Samsung',
        attributes: { storage: '128GB' },
      },
    ]);

    expect(ranked[0].rejectedReason).toBe('brand_mismatch');
  });
});
