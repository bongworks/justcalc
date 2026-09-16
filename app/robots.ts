import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: getSiteOrigin() + '/sitemap.xml' };
}
