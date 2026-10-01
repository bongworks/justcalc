import type { CalculatorCategory } from '../lib/calculators/categories';
import type { calculators } from './calculators';

type CalculatorSlug = typeof calculators[number]['slug'];

interface CategoryGuidance {
  introduction: string;
  steps: ReadonlyArray<{ label: string; text: string; calculatorSlugs: ReadonlyArray<CalculatorSlug> }>;
}

export const categoryGuidance: Record<CalculatorCategory, CategoryGuidance> = {
  car: {
    introduction: '차값과 할부금만으로는 자동차 예산을 잡기 어렵습니다. 운행 지출과 나중에 차를 팔고 남는 비용까지 나눠 봅니다.',
    steps: [
      { label: '차값과 월 할부금', text: '차량·선택 비용을 현금과 할부로 나눕니다. 기간을 바꾸면 월 납입액뿐 아니라 총이자도 달라집니다.', calculatorSlugs: ['purchase-cost', 'installment'] },
      { label: '내가 달릴 거리의 유지비', text: '연간 거리와 실연비·전비, 보험·주차 비용을 씁니다. 연료비만 보면 세금·정비비가 빠집니다.', calculatorSlugs: ['fuel-cost', 'ev-charging-cost', 'maintenance-cost'] },
      { label: '몇 년 타고 팔 것인가', text: '보유 기간과 비용 포함 범위를 맞춰 구매·리스를 비교합니다. 구매 쪽 예상 매각액과 각 견적의 보험·정비 조건도 영향을 줍니다.', calculatorSlugs: ['total-ownership-cost', 'lease-vs-purchase'] },
    ],
  },
  finance: {
    introduction: '같은 금리에서도 원금을 갚는 속도와 돈을 넣는 날짜에 따라 이자는 달라집니다.',
    steps: [
      { label: '월 상환 예산', text: '순수입에서 생활비·기존 상환액을 뺀 뒤 여유를 봅니다. 상환 여력은 직접 정한 예산 기준이며 대출 한도나 승인 판정은 아닙니다.', calculatorSlugs: ['loan-affordability', 'dsr'] },
      { label: '첫 달 부담과 총이자', text: '원금·연 금리·개월 수를 맞춰 방식별로 비교합니다. 수수료·중도상환 조건은 실제 상품 설명의 비용을 따로 봅니다.', calculatorSlugs: ['loan-repayment', 'loan-interest'] },
      { label: '목돈 예치와 매월 저축', text: '예금은 단리, 적금·복리 도구는 월말 납입·월 복리로 계산합니다. 돈이 이자를 받는 기간이 서로 다르며 세율은 직접 입력합니다.', calculatorSlugs: ['deposit-interest', 'savings-maturity', 'compound-interest'] },
    ],
  },
  salary: {
    introduction: '근로계약서와 급여명세서가 있으면 필요한 값을 찾기 쉽습니다. 급여액과 함께 근로시간·지급 대상 기간도 계산에 쓰입니다.',
    steps: [
      { label: '근로시간과 유급 주 수', text: '시급·주 소정근로시간·유급으로 계산할 주 수를 씁니다. 주휴수당은 근무 요건 충족을 전제로 하며 숫자만으로 지급 자격을 판단하지 않습니다.', calculatorSlugs: ['hourly-monthly-pay', 'weekly-holiday-pay'] },
      { label: '명세서의 공제 내역', text: '보험 요율·기준소득·월 소득세를 직접 넣는 실수령액 도구입니다. 연봉만으로 법정 공제액이 산출되지는 않습니다.', calculatorSlugs: ['take-home-pay', 'salary-negotiation'] },
      { label: '퇴직금과 연차 정산', text: '퇴직금은 1일 평균임금·재직일수, 연차수당은 지급 대상 미사용 일수·1일 통상임금이 필요합니다. 평균임금과 통상임금은 서로 다른 기준입니다.', calculatorSlugs: ['severance-pay', 'annual-leave-allowance'] },
    ],
  },
  realestate: {
    introduction: '보증금 외에도 계약·이사 때 필요한 현금과 입주 후 지출이 있습니다. 주거비를 비교할 때 빠뜨리기 쉬운 항목입니다.',
    steps: [
      { label: '전세와 월세의 월 비용', text: '월세에 보증금의 기회비용을 더해 비교합니다. 전월세 전환은 입력한 전환율을 쓰며 법정 상한을 판정하지 않습니다.', calculatorSlugs: ['rent-vs-deposit', 'deposit-rent-conversion'] },
      { label: '계약·입주에 필요한 돈', text: '세율·중개보수 요율은 거래에 맞는 값을 직접 입력합니다. 이사·청소·가구비도 더해야 보증금 외의 초기 예산이 보입니다.', calculatorSlugs: ['acquisition-tax', 'brokerage-fee', 'moving-budget', 'one-person-setup-budget'] },
      { label: '대출과 연간 보유비', text: '가용 현금과 대출 조건으로 주택 예산을 잡고 세금·보험·관리비를 더합니다. 임대수익률은 비용이 임대료보다 커도 손실률 대신 0%로 표시하는 모델입니다.', calculatorSlugs: ['housing-affordability', 'holding-cost-checklist', 'rental-yield'] },
    ],
  },
  business: {
    introduction: '매출과 이익은 다릅니다. 매입 원가와 수수료·배송·반품 비용을 뺀 상품 이익에 월 고정비까지 넣어야 사업의 손익이 보입니다.',
    steps: [
      { label: '마진율과 원가 가산율', text: '가격의 부가세 포함 여부를 맞춥니다. 마진율은 매출, 원가 가산율은 원가를 분모로 써 같은 이익에도 비율이 다릅니다.', calculatorSlugs: ['vat', 'margin', 'markup'] },
      { label: '판매 후 정산액', text: '플랫폼·결제 수수료, 판매자 배송비, 반품액이 필요합니다. 정산액에서 상품 원가까지 뺐는지에 따라 실제 이익과 차이가 납니다.', calculatorSlugs: ['sales-commission', 'online-market-settlement'] },
      { label: '고정비와 손익분기점', text: '임대료·인건비와 판매량에 따른 변동비를 나눕니다. 손익분기 수량을 예상 판매량과 비교하면 목표까지 얼마나 더 팔아야 하는지 보입니다.', calculatorSlugs: ['break-even', 'monthly-profit-loss', 'business-feasibility'] },
    ],
  },
  health: {
    introduction: '키·체중과 운동 기록을 간단히 계산하는 도구입니다. 추정치는 진단이나 개인별 식단 처방을 대신하지 않습니다.',
    steps: [
      { label: '측정값과 BMI', text: '같은 시점의 키·체중을 씁니다. BMI는 체지방률 측정값이 아니며 근육량·임신 등 개인 상태를 반영하지 않습니다.', calculatorSlugs: ['bmi', 'target-weight'] },
      { label: '기초대사량과 하루 열량', text: '기초대사량은 하루 전체 소비 열량과 다릅니다. 활동 계수는 직접 넣는 값이며 개인의 건강 상태에 맞는 목표는 전문가와 상의할 항목입니다.', calculatorSlugs: ['bmr', 'daily-calories', 'macro-nutrients'] },
      { label: '달리기·걷기 기록', text: '거리와 걸린 시간으로 페이스를 구합니다. 걷기 열량은 직접 넣은 거리당 추정치를 쓰므로 기기의 측정값과 다를 수 있습니다.', calculatorSlugs: ['running-pace', 'walking-calories'] },
    ],
  },
  life: {
    introduction: '남은 날짜와 생활비를 계산할 때는 날짜를 세는 방식, 비용이 발생하는 기간부터 맞춥니다.',
    steps: [
      { label: '남은 날짜와 날짜 차이', text: '기준일 포함 여부에 따라 일수가 달라집니다. 이 도구의 날짜 차이는 같은 날을 0일로 세며 법정 기한·영업일 계산과는 다릅니다.', calculatorSlugs: ['dday', 'date-between', 'date-offset'] },
      { label: '월 예산과 장기 지출', text: '순수입·지출·목표 저축을 같은 달 기준으로 봅니다. 휴대폰은 약정 전체 비용, 전기요금은 수동 단가의 단순 추정으로 누진요금을 계산하지 않습니다.', calculatorSlugs: ['monthly-budget', 'phone-plan-cost', 'electricity-estimate'] },
      { label: '함께 쓴 돈 정산', text: '총금액과 인원으로 균등 분담액을 구합니다. 팁이 있다면 팁을 더한 총액을 나누고, 원 단위로 나눈 뒤 남는 돈은 따로 정산합니다.', calculatorSlugs: ['household-split', 'tip-split'] },
    ],
  },
  education: {
    introduction: '학점은 학교의 평점 체계, 단위 변환은 원래 값의 단위가 필요합니다. 제출용 성적은 기관의 공식 기준과 대조해야 합니다.',
    steps: [
      { label: '학점 가중 평균', text: '과목별 이수 학점을 가중치로 평균 평점을 구합니다. 다른 만점으로 비례 환산한 결과는 학교·채용기관의 공식 변환표와 다를 수 있습니다.', calculatorSlugs: ['gpa', 'grade-conversion'] },
      { label: '하루 공부 시간', text: '총 학습 시간을 분으로 바꿔 실제 공부할 일수로 나눕니다. 쉬는 날은 제외하고 복습·휴식 시간은 별도로 잡습니다.', calculatorSlugs: ['study-plan'] },
      { label: '단위와 시차', text: '같은 종류의 단위로 변환하며 연비의 km/L와 L/100km를 혼동하지 않도록 주의합니다. 시차는 해당 날짜의 서머타임을 반영한 UTC 오프셋을 직접 넣습니다.', calculatorSlugs: ['unit-conversion', 'fuel-efficiency-conversion', 'time-zone-comparison'] },
    ],
  },
};
