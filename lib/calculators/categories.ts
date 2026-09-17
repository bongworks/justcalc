export const calculatorCategories = [
  { slug: 'car', label: '자동차', description: '차량 구매와 운행 비용을 계산합니다.', route: '/car/' },
  { slug: 'finance', label: '금융', description: '대출과 저축 계획을 비교합니다.', route: '/finance/' },
  { slug: 'salary', label: '급여·고용', description: '급여와 근무 보상을 가늠합니다.', route: '/salary/' },
  { slug: 'realestate', label: '부동산', description: '주거 거래와 보유 비용을 계산합니다.', route: '/realestate/' },
  { slug: 'business', label: '세금·사업', description: '사업 정산과 수익성을 계산합니다.', route: '/business/' },
  { slug: 'health', label: '건강·운동', description: '몸 상태와 운동 목표를 계산합니다.', route: '/health/' },
  { slug: 'life', label: '생활·날짜', description: '일상 비용과 날짜를 계산합니다.', route: '/life/' },
  { slug: 'education', label: '교육·단위', description: '학습과 단위 변환을 돕습니다.', route: '/education/' },
] as const;

export type CalculatorCategory = typeof calculatorCategories[number]['slug'];

export function getCategoryBySlug(slug: string) {
  return calculatorCategories.find((category) => category.slug === slug);
}
