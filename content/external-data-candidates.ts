export interface ExternalDataCandidate {
  id: string;
  label: string;
  dataNeeded: string;
  candidateSource: string;
  browserEligible: boolean;
  reviewStatus: 'not-reviewed';
  fallbackInput: string;
  lastReviewed: null;
}

export const externalDataCandidates = [
  {
    id: 'exchange-rate',
    label: '환율',
    dataNeeded: '기준 통화와 대상 통화의 환율',
    candidateSource: '한국수출입은행 환율 정보',
    browserEligible: false,
    reviewStatus: 'not-reviewed',
    fallbackInput: '환율 직접 입력',
    lastReviewed: null,
  },
  {
    id: 'fuel-price',
    label: '유가',
    dataNeeded: '유종별 리터당 가격',
    candidateSource: '한국석유공사 오피넷',
    browserEligible: false,
    reviewStatus: 'not-reviewed',
    fallbackInput: '유종 단가 직접 입력',
    lastReviewed: null,
  },
  {
    id: 'ev-charging-rate',
    label: '전기차 충전 요금',
    dataNeeded: '충전 사업자와 충전 방식별 kWh당 요금',
    candidateSource: '환경부 무공해차 통합누리집',
    browserEligible: false,
    reviewStatus: 'not-reviewed',
    fallbackInput: '충전 단가 직접 입력',
    lastReviewed: null,
  },
  {
    id: 'electricity-tariff',
    label: '전기 요금',
    dataNeeded: '용도와 구간별 kWh당 전기 요금',
    candidateSource: '한국전력공사 전기요금표',
    browserEligible: false,
    reviewStatus: 'not-reviewed',
    fallbackInput: '전기 단가 직접 입력',
    lastReviewed: null,
  },
  {
    id: 'holiday-calendar',
    label: '공휴일 달력',
    dataNeeded: '국가와 연도별 공휴일 목록',
    candidateSource: '인사혁신처 공휴일 정보',
    browserEligible: false,
    reviewStatus: 'not-reviewed',
    fallbackInput: '공휴일 수 직접 입력',
    lastReviewed: null,
  },
  {
    id: 'time-zone',
    label: '시간대',
    dataNeeded: '지역별 UTC 오프셋과 일광절약시간 적용 여부',
    candidateSource: 'IANA Time Zone Database',
    browserEligible: false,
    reviewStatus: 'not-reviewed',
    fallbackInput: 'UTC 오프셋 직접 입력',
    lastReviewed: null,
  },
] as const satisfies ReadonlyArray<ExternalDataCandidate>;
