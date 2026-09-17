import Link from 'next/link';
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
    <p>계산식이나 서비스 제공 범위는 검토 결과에 따라 수정될 수 있습니다. 오류를 확인하면 <Link href="/editorial-policy/">편집 및 검토 정책</Link>에 따라 정정합니다. 이 안내는 관련 법령에 따른 이용자의 권리를 제한하지 않습니다.</p>
    <p>운영 정보와 문의 채널은 <Link href="/contact/">운영 및 문의 안내</Link>를 확인하세요. 현재는 공개 운영 준비 단계입니다.</p>
  </PolicyPage>;
}
