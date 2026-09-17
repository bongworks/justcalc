import { CalculatorDirectory } from '@/components/content/CalculatorDirectory';
import { calculatorCatalog } from '@/lib/calculators/registry';
import { calculatorCategories } from '@/lib/calculators/categories';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteOrigin, homePage, pageMetadata, siteName, webPageData } from '@/lib/seo/site';

export const metadata = pageMetadata(homePage);

export default function Home() {
  return (
    <div className="page-shell">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: siteName, url: getSiteOrigin() + '/', description: homePage.description, inLanguage: 'ko' }} />
      <JsonLd data={webPageData(homePage)} />
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">생활에 필요한 비용을 빠르게</p>
        <h1 id="home-title">차를 사고 유지하고, 돈을 빌리고 모을 때 드는 실제 비용을 한눈에 계산합니다.</h1>
        <p>로그인이나 개인정보 입력 없이, 필요한 값만 직접 넣어 보세요. 모든 계산은 이 브라우저에서만 처리됩니다.</p>
      </section>
      <section aria-labelledby="category-title">
        <h2 id="category-title">어떤 계산이 필요한가요?</h2>
        <CalculatorDirectory calculators={calculatorCatalog} categories={calculatorCategories} />
      </section>
    </div>
  );
}
