import { Injectable } from '@nestjs/common';
import type { ProviderSearchResultItem } from '../providers/types';

export interface CatalogVariantMatchInput {
  brand: string;
  name: string;
  modelNumber?: string | null;
  attributes: Record<string, unknown>;
}

export interface ProductMatchResult {
  externalProductId: string;
  confidence: number;
  matchedOn: string[];
  rejectedReason?: string;
  candidate: ProviderSearchResultItem;
}

/**
 * Variant-aware matcher. Prevents cross-variant comparisons by requiring
 * storage/color agreement when those attributes are present on both sides.
 */
@Injectable()
export class ProductMatcherService {
  match(
    catalog: CatalogVariantMatchInput,
    candidates: ProviderSearchResultItem[],
  ): ProductMatchResult[] {
    return candidates
      .map((candidate) => this.score(catalog, candidate))
      .sort((a, b) => b.confidence - a.confidence);
  }

  bestMatch(
    catalog: CatalogVariantMatchInput,
    candidates: ProviderSearchResultItem[],
    minConfidence = 0.72,
  ): ProductMatchResult | null {
    const ranked = this.match(catalog, candidates).filter((m) => !m.rejectedReason);
    const top = ranked[0];
    if (!top || top.confidence < minConfidence) return null;
    return top;
  }

  private score(
    catalog: CatalogVariantMatchInput,
    candidate: ProviderSearchResultItem,
  ): ProductMatchResult {
    const matchedOn: string[] = [];
    let score = 0;
    const catalogBrand = normalize(catalog.brand);
    const candidateBrand = normalize(candidate.brand ?? '');
    const catalogName = normalize(catalog.name);
    const candidateTitle = normalize(candidate.title);

    if (catalogBrand && candidateBrand) {
      if (catalogBrand === candidateBrand || candidateTitle.includes(catalogBrand)) {
        score += 0.28;
        matchedOn.push('brand');
      } else {
        return {
          externalProductId: candidate.externalProductId,
          confidence: 0,
          matchedOn,
          rejectedReason: 'brand_mismatch',
          candidate,
        };
      }
    }

    if (catalogName && candidateTitle.includes(catalogName)) {
      score += 0.22;
      matchedOn.push('product_name');
    } else {
      const overlap = tokenOverlap(catalogName, candidateTitle);
      score += overlap * 0.22;
      if (overlap >= 0.5) matchedOn.push('product_name_partial');
    }

    const model = normalize(catalog.modelNumber ?? '');
    if (model && (normalize(candidate.modelNumber ?? '').includes(model) || candidateTitle.includes(model))) {
      score += 0.2;
      matchedOn.push('model_number');
    }

    const catalogAttrs = flattenAttrs(catalog.attributes);
    const candidateAttrs = candidate.attributes ?? {};

    const storageCheck = compareAttr(catalogAttrs, candidateAttrs, ['storage', 'size', 'capacity'], candidateTitle);
    if (storageCheck === 'mismatch') {
      return {
        externalProductId: candidate.externalProductId,
        confidence: 0,
        matchedOn,
        rejectedReason: 'storage_mismatch',
        candidate,
      };
    }
    if (storageCheck === 'match') {
      score += 0.18;
      matchedOn.push('storage');
    }

    const colorCheck = compareAttr(catalogAttrs, candidateAttrs, ['color', 'colour'], candidateTitle);
    if (colorCheck === 'mismatch') {
      return {
        externalProductId: candidate.externalProductId,
        confidence: 0,
        matchedOn,
        rejectedReason: 'color_mismatch',
        candidate,
      };
    }
    if (colorCheck === 'match') {
      score += 0.12;
      matchedOn.push('color');
    }

    return {
      externalProductId: candidate.externalProductId,
      confidence: Number(Math.min(score, 0.99).toFixed(4)),
      matchedOn,
      candidate,
    };
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(a.split(' ').filter((t) => t.length > 1));
  const bTokens = new Set(b.split(' ').filter((t) => t.length > 1));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let hit = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) hit += 1;
  });
  return hit / aTokens.size;
}

function flattenAttrs(attrs: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(attrs).forEach(([key, value]) => {
    if (value != null) out[normalize(key)] = normalize(String(value));
  });
  return out;
}

function compareAttr(
  catalogAttrs: Record<string, string>,
  candidateAttrs: Record<string, string>,
  keys: string[],
  candidateTitle: string,
): 'match' | 'mismatch' | 'unknown' {
  const catalogValue = keys.map((k) => catalogAttrs[k]).find(Boolean);
  if (!catalogValue) return 'unknown';

  const candidateValue = keys.map((k) => candidateAttrs[k]).find(Boolean);
  const haystack = `${candidateValue ?? ''} ${candidateTitle}`;

  if (!candidateValue && !candidateTitle.includes(catalogValue.split(' ')[0] ?? '')) {
    // Attribute present on catalog but not findable on candidate → uncertain, not hard reject
    return 'unknown';
  }

  if (haystack.includes(catalogValue) || compact(haystack).includes(compact(catalogValue))) {
    return 'match';
  }

  // Both sides have an explicit conflicting value
  if (candidateValue && candidateValue !== catalogValue) {
    return 'mismatch';
  }

  return 'unknown';
}

function compact(value: string): string {
  return value.replace(/\s+/g, '');
}
