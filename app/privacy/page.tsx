import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[3];
export const metadata = pageMetadata(page);

export default function Privacy() {
  return <PolicyPage page={page}>
    <h2>계산 입력값과 결과</h2>
    <p>계산 입력값과 결과는 사용 중인 브라우저에서 처리하며, 서비스는 이를 서버나 분석 서비스로 전송하거나 저장하지 않습니다. 계산값은 쿠키·로컬 저장소·세션 저장소에 저장하지 않으며 페이지를 새로 열면 초기화됩니다.</p>
    <p>결과 복사를 누르면 사용자의 요청에 따라 결과 텍스트가 기기의 클립보드에 복사됩니다. 복사한 내용은 분석 서비스로 보내지 않습니다. 링크 복사는 입력값·결과·URL 쿼리를 제외한 계산기 주소만 복사합니다.</p>
    <h2>방문 분석과 쿠키</h2>
    <p>서비스는 이용 현황을 이해하고 개선하기 위해 Google Analytics를 사용할 수 있습니다. 이 경우 Google은 방문·이용 정보, 브라우저·기기 정보, 유입 출처와 쿠키 기반 식별자를 처리할 수 있습니다.</p>
    <p>서비스가 분석에 사용하는 정보는 계산기 종류, 페이지 제목, 정해진 페이지 경로, 사이트 출처 수준의 유입 출처, 유효한 캠페인 코드, 계산 기능 이용 여부와 복사 동작 여부로 한정됩니다. 숫자 입력, 계산 결과, 오류의 원문, 클립보드 내용과 주소의 쿼리·해시 값은 분석 정보에 포함하지 않습니다.</p>
    <p>Google의 정보 처리에는 <a href="https://policies.google.com/privacy">Google 개인정보처리방침</a>이 적용됩니다. 브라우저에서 쿠키를 제한·삭제하거나 추적 차단 기능을 사용할 수 있으며, Google이 제공하는 <a href="https://tools.google.com/dlpage/gaoptout">Analytics 차단 도구</a>도 이용할 수 있습니다. 분석을 차단해도 계산 기능은 사용할 수 있습니다.</p>
    <h2>광고와 서비스 운영</h2>
    <p>서비스에 Google 광고가 표시되는 경우 Google의 광고 서비스가 쿠키와 기기·브라우저 정보를 처리할 수 있습니다. 계산 입력값과 결과는 광고 서비스로 전송하지 않습니다.</p>
    <h2>이메일 문의</h2>
    <p>문의 메일로 제공한 정보는 문의 확인과 답변을 위해서만 사용합니다. 개인정보나 민감한 금융정보는 문의에 포함하지 마세요.</p>
    <p>개인정보 처리에 관한 문의는 <a href="mailto:service.bongworks@gmail.com">service.bongworks@gmail.com</a>으로 보내 주세요.</p>
  </PolicyPage>;
}
