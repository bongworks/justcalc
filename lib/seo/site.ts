import type { Metadata } from 'next';

export const productionOrigin = 'https://calc.bongworks.co.kr';
export const siteName = '바로계산기';
export const homePage = { route: '/', title: '바로계산기 | 차량, 금융, 생활, 건강 계산기', description: '차량 비용부터 생활비, 급여, 세금, 건강까지 필요한 계산을 한곳에서.' };
export const policyPages = [
  { route: '/about/', title: '서비스 소개', description: '바로계산기의 목적과 제공하는 계산 범위를 소개합니다.' },
  { route: '/editorial-policy/', title: '편집 및 검토 정책', description: '계산식, 자료 출처, 검토일과 오류 정정 기준을 안내합니다.' },
  { route: '/contact/', title: '운영 및 문의 안내', description: '운영자 정보와 문의 창구의 공개 준비 상태를 안내합니다.' },
  { route: '/privacy/', title: '개인정보 처리방침', description: '브라우저 내 계산과 방문 분석의 정보 처리 범위를 안내합니다.' },
  { route: '/terms/', title: '이용약관', description: '참고용 계산 결과의 이용 조건과 한계를 안내합니다.' },
] as const;

/** Deployment cannot silently replace canonical URLs with a typo or an untrusted origin. */
export function getSiteOrigin(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (!value?.trim()) return productionOrigin;
  const url = new URL(value);
  if (url.origin !== productionOrigin || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be https://calc.bongworks.co.kr without credentials, path, query or fragment.');
  }
  return url.origin;
}

export function getVerification(google = process.env.GOOGLE_SITE_VERIFICATION, naver = process.env.NAVER_SITE_VERIFICATION): Metadata['verification'] {
  return {
    ...(google?.trim() ? { google: google.trim() } : {}),
    ...(naver?.trim() ? { other: { 'naver-site-verification': naver.trim() } } : {}),
  };
}

export function pageMetadata(page: { title: string; description: string; route: string }): Metadata {
  const url = getSiteOrigin() + page.route;
  const images = [getSiteOrigin() + '/og-default.png'];
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, siteName, locale: 'ko_KR', type: 'website', images },
    twitter: { card: 'summary', title: page.title, description: page.description, images },
  };
}

export function webPageData(page: { title: string; description: string; route: string; lastReviewed?: string }) {
  return { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: getSiteOrigin() + page.route, inLanguage: 'ko', ...(page.lastReviewed ? { lastReviewed: page.lastReviewed } : {}) };
}
