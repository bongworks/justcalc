/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation preserves the existing sanitized page-view flow. */
import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[0];
export const metadata = pageMetadata(page);

export default function About() {
  return <PolicyPage page={page}>
    <h2>생활 속 비용을 이해하기 위한 도구</h2>
    <p>바로계산기는 자동차 구매·유지 비용, 대출·저축, 급여·고용, 주거 비용, 세금·사업, 건강·운동, 생활·날짜, 교육·단위의 값을 직접 확인하는 무료 계산 도구입니다. 로그인 없이 브라우저에서 계산합니다.</p>
    <h2>숫자를 계산한 다음의 결정까지</h2>
    <p>같은 금액도 계산 기간과 포함한 항목에 따라 의미가 달라집니다. 자동차 월 지출과 총보유비용, 대출의 첫 달 부담과 총이자, 저축 납입 시점, 할인 후 실제 결제액을 비교할 수 있도록 <a href="/guides/">계산 활용 가이드</a>에서 가정과 계산 순서를 함께 설명합니다.</p>
    <h2>계산의 범위</h2>
    <p>각 계산기에서 계산식, 예시, 제외 항목, 참고 자료와 마지막 검토일을 제공합니다. 금리나 세율을 실시간으로 조회하지 않으며, 직접 입력한 조건과 화면에 설명한 가정만 반영합니다.</p>
    <p>결과는 참고용 계산입니다. 실제 납입액·세금·계약 조건은 관련 기관의 안내와 계약서를 확인하세요.</p>
  </PolicyPage>;
}
