import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[2];
export const metadata = pageMetadata(page);

export default function Contact() {
  return <PolicyPage page={page}>
    <h2>문의 방법</h2>
    <p>기능 제안, 오류 제보, 서비스 이용 문의는 <a href="mailto:service.bongworks@gmail.com">service.bongworks@gmail.com</a>으로 보내 주세요.</p>
    <p>문의 내용을 확인한 뒤 가능한 범위에서 답변드립니다. 계산 결과에 필요한 개인정보, 계좌번호, 비밀번호 등 민감한 정보는 보내지 마세요.</p>
    <h2>오류 제보에 도움이 되는 내용</h2>
    <ul><li>이용한 계산기 이름</li><li>문제가 발생한 입력 항목과 화면에 표시된 안내</li><li>문제가 발생한 시점과 사용한 브라우저 또는 기기 정보</li></ul>
  </PolicyPage>;
}
