import type { MetadataRoute } from 'next';
import { calculatorCatalog } from '@/lib/calculators/registry';
import { getSiteOrigin, homePage, policyPages } from '@/lib/seo/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  return [
    ...[homePage, ...policyPages].map(({ route }) => ({ url: origin + route })),
    ...calculatorCatalog.map(({ route, lastReviewed }) => ({ url: origin + route, lastModified: lastReviewed })),
  ];
}
