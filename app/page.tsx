import { calculatorCatalog } from '@/lib/calculators/registry';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteOrigin, homePage, pageMetadata, siteName, webPageData } from '@/lib/seo/site';

export const metadata = pageMetadata(homePage);

const categories = [
  {
    id: 'car',
    name: '자동차',
    description: '차량 구매부터 운행까지 필요한 비용을 계산합니다.',
  },
  {
    id: 'finance',
    name: '금융',
    description: '대출과 예적금의 이자·상환 금액을 비교합니다.',
  },
  {
    id: 'life',
    name: '생활비',
    description: '한 달의 수입과 지출, 저축 여력을 살펴봅니다.',
  },
] as const;

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
        <nav className="category-nav" aria-label="계산기 카테고리">
          <ul>
            {categories.map((category) => (
              <li key={category.id}><a href={`#${category.id}`}>{category.name}</a></li>
            ))}
          </ul>
        </nav>
        <div className="category-grid">
          {categories.map((category) => (
            <section className="category-card" id={category.id} key={category.name} aria-labelledby={`${category.id}-title`}>
              <h3 id={`${category.id}-title`}>{category.name}</h3>
              <p>{category.description}</p>
              <ul>
                {calculatorCatalog.filter((calculator) => calculator.category === category.id).map(({ title, route }) => (
                  <li key={route}><a href={route}>{title}</a></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
