import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[0];
export const metadata = pageMetadata(page);

export default function About() {
  return <PolicyPage page={page}>
    <h2>생활 속 비용을 이해하기 위한 도구</h2>
    <p>바로계산기는 자동차 구매·유지 비용, 대출·예적금 이자, 월 생활비를 가정에 따라 비교하는 무료 계산 도구입니다. 로그인 없이 브라우저에서 계산합니다.</p>
    <h2>계산의 범위</h2>
    <p>각 계산기에서 계산식, 예시, 제외 항목, 참고 자료와 마지막 검토일을 제공합니다. 금리나 세율을 실시간 조회하지 않으며, 직접 입력한 조건과 화면에 설명한 가정만 반영합니다.</p>
    <p>결과는 참고용 계산입니다. 실제 납입액·세금·계약 조건은 관련 기관의 안내와 계약서를 확인하세요.</p>
    <p>현재 공개 운영을 준비 중입니다. 운영 정보와 문의 창구의 준비 상태는 <a href="/contact/">운영 및 문의 안내</a>에서 확인할 수 있습니다.</p>
  </PolicyPage>;
}
