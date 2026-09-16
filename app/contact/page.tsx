import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[2];
export const metadata = pageMetadata(page);

export default function Contact() {
  return <PolicyPage page={page}>
    <h2>공개 운영 준비 중</h2>
    <p>운영자의 실제 법적 이름 또는 사업자 정보와 유효한 문의 연락 수단이 아직 제공되지 않았습니다. 현재 이 페이지에서 문의를 접수하거나 답변을 약속할 수 없습니다.</p>
    <p>운영자가 실제 운영 주체와 연락 가능한 문의 채널을 제공하고 이를 확인하기 전까지 공개 출시와 AdSense 신청은 보류합니다. 이 조건이 충족되기 전에는 프로덕션 정책 페이지를 배포하지 않습니다.</p>
    <h2>공개 전에 필요한 정보</h2>
    <ul><li>운영 책임을 지는 실제 개인 또는 법인·사업자의 식별 정보</li><li>오류 정정과 개인정보 관련 문의를 받을 유효한 이메일 등 연락 수단</li><li>해당 연락 수단의 수신·응답 가능 여부 확인</li></ul>
    <p>가상의 이메일이나 사업자 정보는 게시하지 않습니다. 운영 정보가 확정되면 이 안내와 관련 정책을 함께 갱신합니다.</p>
  </PolicyPage>;
}
