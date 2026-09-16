import { policyPages } from '@/lib/seo/site';

export function Footer() {
  return <footer className="site-footer"><p>계산 결과는 참고용입니다.</p><nav aria-label="서비스 정책"><ul>{policyPages.map(({ route, title }) => <li key={route}><a href={route}>{title}</a></li>)}</ul></nav></footer>;
}
