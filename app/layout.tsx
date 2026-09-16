import type { Metadata } from 'next';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: '바로계산기 | 생활비, 자동차, 대출 비용 계산기',
  description: '차를 사고 유지하고, 돈을 빌리고 모을 때 드는 실제 비용을 한눈에 계산합니다.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
