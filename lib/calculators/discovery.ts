import { calculators } from '@/content/calculators';

type CalculatorSlug = typeof calculators[number]['slug'];

const popularSlugs = [
  'maintenance-cost', 'loan-repayment', 'compound-interest',
  'take-home-pay', 'bmi', 'dday',
] as const satisfies ReadonlyArray<CalculatorSlug>;

export const calculatorDiscovery = [
  {
    id: 'popular-calculators',
    title: '인기 계산기',
    description: '실시간 이용 순위가 아닌, 자주 필요한 계산을 모은 편집 추천입니다.',
    calculators: popularSlugs.map((slug) => calculators.find((calculator) => calculator.slug === slug)!),
  },
  {
    id: 'recent-calculators',
    title: '최근 추가한 계산기',
    description: '새롭게 추가된 계산 도구를 살펴보세요.',
    calculators: calculators.slice(-6).reverse(),
  },
] as const;
