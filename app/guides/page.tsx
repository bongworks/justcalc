import { DecisionGuideCards } from '@/components/content/DecisionGuideCards';
import { PolicyPage } from '@/components/site/PolicyPage';
import { guideIndexPage } from '@/content/decision-guides';
import { pageMetadata } from '@/lib/seo/site';

export const metadata = pageMetadata(guideIndexPage);

export default function Guides() {
  return <PolicyPage page={guideIndexPage}>
    <p>월세가 없는 집은 정말 더 쌀까요? 마진 40%와 원가에 40%를 붙이는 건 같을까요?</p>
    <DecisionGuideCards showIndexLink={false} />
  </PolicyPage>;
}
