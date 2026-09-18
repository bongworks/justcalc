import { PolicyPage } from '@/components/site/PolicyPage';
import { pageMetadata, policyPages } from '@/lib/seo/site';

const page = policyPages[4];
export const metadata = pageMetadata(page);

export default function Terms() {
  return <PolicyPage page={page}>
    <h2>참고용 계산</h2>
    <p>바로계산기의 결과는 입력한 가정을 이해하기 위한 일반 정보입니다. 금융·투자·세무·법률 자문이나 상품 추천, 계약 금액의 확정 또는 수익 보장이 아닙니다.</p>
    <h2>이용자의 확인</h2>
    <p>입력 단위, 계산 방식과 제외 항목을 확인하고 중요한 의사결정 전에 관련 기관·계약서·전문가를 통해 검증하세요. 실제 금액은 납입일, 수수료, 세금, 반올림 등 조건에 따라 달라질 수 있습니다.</p>
    <h2>서비스 변경과 오류</h2>
    <p>계산식이나 서비스 제공 범위는 검토 결과에 따라 수정될 수 있습니다. 오류가 확인되면 계산식·예시·유의사항을 검토하고 정정합니다. 이 안내는 관련 법령에 따른 이용자의 권리를 제한하지 않습니다.</p>
    <p>기능 제안, 오류 제보, 서비스 이용 문의는 <a href="mailto:service.bongworks@gmail.com">service.bongworks@gmail.com</a>으로 보내 주세요.</p>
  </PolicyPage>;
}
