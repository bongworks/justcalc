export function Header() {
  // A new document initializes one sanitized page view without GA history tracking.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <header className="site-header"><a href="/">바로계산기</a></header>;
}
