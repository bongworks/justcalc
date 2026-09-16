import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[1];
export const metadata = pageMetadata(page);

export default function EditorialPolicy() {
  return <PolicyPage page={page}>
    <h2>작성과 검토 기준</h2>
    <p>계산식과 예시는 일반적인 산술·금융 계산을 바탕으로 작성하며 공식 기관의 자료를 함께 안내합니다. 참고 자료는 조건을 확인하기 위한 출처이며 해당 기관의 보증이나 제휴를 뜻하지 않습니다.</p>
    <p>검토 시 정상 사례, 0% 금리와 같은 경계 조건, 입력 범위, 반올림, 총액과 세부 항목의 일치 여부를 확인합니다. 계산기별 마지막 검토일은 해당 계산식과 안내를 검토한 날짜이며 실시간 정보 갱신일은 아닙니다.</p>
    <h2>오류 정정</h2>
    <p>오류가 확인되면 재현 조건과 원인을 검토하고 계산식·예시·유의사항을 함께 수정합니다. 수정 후 관련 테스트를 실행하고 검토일을 갱신합니다.</p>
    <p>정정 요청을 받을 실제 문의 창구는 아직 준비 중입니다. <a href="/contact/">운영 및 문의 안내</a>에 유효한 연락 수단이 공개되기 전에는 공개 운영을 시작하지 않습니다. 문의 시 개인정보나 실제 금융정보를 보내지 마세요.</p>
  </PolicyPage>;
}
