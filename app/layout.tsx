import type { Metadata } from 'next';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AdSenseLoader } from '@/components/adsense/AdSenseLoader';
import { getGaMeasurementId } from '@/lib/analytics/config';
import { getAdSenseConfig } from '@/lib/adsense/config';
import { getSiteOrigin, getVerification } from '@/lib/seo/site';
import './globals.css';

export const metadata: Metadata = {
  title: '바로계산기 | 차량, 금융, 생활, 건강 계산기',
  description: '차량 비용부터 생활비, 급여, 세금, 건강까지 필요한 계산을 한곳에서.',
  icons: { icon: '/favicon.svg' },
  metadataBase: new URL(getSiteOrigin()),
  verification: getVerification(),
  referrer: 'strict-origin',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const measurementId = getGaMeasurementId();
  const adSense = getAdSenseConfig();
  return (
    <html lang="ko">
      <head>{measurementId && <GoogleAnalytics measurementId={measurementId} siteOrigin={getSiteOrigin()} />}{adSense && <AdSenseLoader clientId={adSense.clientId} />}</head>
      <body>
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
