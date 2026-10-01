import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[1];
export const metadata = pageMetadata(page);

export default function EditorialPolicy() {
  return <PolicyPage page={page}>
    <h2>작성과 검토 기준</h2>
    <p>계산식과 예시는 일반적인 산술·금융 계산을 바탕으로 작성하며 공식 기관의 자료를 함께 안내합니다. 참고 자료는 조건을 확인하기 위한 출처이며 해당 기관의 보증이나 제휴를 뜻하지 않습니다.</p>
    <p>검토 시 정상 사례, 0% 금리와 같은 경계 조건, 입력 범위, 반올림, 총액과 세부 항목의 일치 여부를 확인합니다. 계산기별 마지막 검토일은 해당 계산식과 안내를 검토한 날짜이며 실시간 정보 갱신일은 아닙니다.</p>
    <h2>활용 가이드의 예시와 출처</h2>
    <p>활용 가이드의 비교표는 명시한 가정으로 계산한 예시입니다. 현재 시세나 상품 견적, 개인의 계약 조건을 대신하지 않습니다. 납입 시점·복리 주기·반올림과 제외 비용을 함께 밝히고, 입력값을 확인할 수 있는 자료와 계산기를 연결합니다.</p>
    <p>설명과 코드 작성에는 AI 도구를 활용합니다. 예시 숫자는 계산식과 구현 결과를 교차 확인하며, 자동 검증이 세무·법률·의료 전문가의 검토를 뜻하지는 않습니다. 가이드의 작성일과 기존 계산식의 검토일은 구별해 표시하고, 의미 있는 내용 변경이 없는 페이지의 날짜를 최신으로 바꾸지 않습니다.</p>
    <h2>오류 정정</h2>
    <p>오류 제보를 받으면 재현 조건과 원인을 확인해 계산식·예시·유의사항을 함께 수정하고, 필요한 경우 검토일을 갱신합니다.</p>
    <p>오류 정정이나 내용 관련 문의는 <a href="mailto:service.bongworks@gmail.com">service.bongworks@gmail.com</a>으로 보내 주세요. 문의에는 개인정보, 계좌번호, 비밀번호 등 민감한 정보를 포함하지 마세요.</p>
  </PolicyPage>;
}
