import type { MetadataRoute } from 'next';
import { calculatorCategories } from '@/lib/calculators/categories';
import { calculatorCatalog } from '@/lib/calculators/registry';
import { getSiteOrigin, homePage, policyPages } from '@/lib/seo/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  return [
    ...[homePage, ...policyPages].map(({ route }) => ({ url: origin + route })),
    ...calculatorCategories.map(({ route }) => ({ url: origin + route })),
    ...calculatorCatalog.map(({ route, lastReviewed }) => ({ url: origin + route, lastModified: lastReviewed })),
  ];
}
