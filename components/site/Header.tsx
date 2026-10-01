export function Header() {
  // A new document initializes one sanitized page view without GA history tracking.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <header className="site-header"><a className="site-brand" href="/">바로계산기</a><nav aria-label="주 메뉴"><a href="/">계산기</a><a href="/guides/">활용 가이드</a><a href="/about/">서비스 소개</a></nav></header>;
}
