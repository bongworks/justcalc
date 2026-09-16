const categories = [
  {
    name: '자동차',
    description: '차량 구매부터 운행까지 필요한 비용을 계산합니다.',
    tools: [
      ['자동차 유지비 계산기', '/car/maintenance-cost/'],
      ['유류비·연비 계산기', '/car/fuel-cost/'],
      ['전기차 충전비 계산기', '/car/ev-charging-cost/'],
      ['차량 구매 총비용 계산기', '/car/purchase-cost/'],
      ['자동차 할부 계산기', '/car/installment/'],
    ],
  },
  {
    name: '금융',
    description: '대출과 예적금의 이자·상환 금액을 비교합니다.',
    tools: [
      ['대출 이자 계산기', '/finance/loan-interest/'],
      ['대출 상환 방식 비교 계산기', '/finance/loan-repayment/'],
      ['예적금·복리 계산기', '/finance/compound-interest/'],
    ],
  },
  {
    name: '생활비',
    description: '한 달의 수입과 지출, 저축 여력을 살펴봅니다.',
    tools: [['월 생활비 예산 계산기', '/life/monthly-budget/']],
  },
] as const;

export default function Home() {
  return (
    <div className="page-shell">
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">생활에 필요한 비용을 빠르게</p>
        <h1 id="home-title">차를 사고 유지하고, 돈을 빌리고 모을 때 드는 실제 비용을 한눈에 계산합니다.</h1>
        <p>로그인이나 개인정보 입력 없이, 필요한 값만 직접 넣어 보세요. 모든 계산은 이 브라우저에서만 처리됩니다.</p>
      </section>
      <section aria-labelledby="category-title">
        <h2 id="category-title">어떤 계산이 필요한가요?</h2>
        <div className="category-grid">
          {categories.map((category) => (
            <article className="category-card" key={category.name}>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <ul>
                {category.tools.map(([title, href]) => (
                  <li key={href}><a href={href}>{title}</a></li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
