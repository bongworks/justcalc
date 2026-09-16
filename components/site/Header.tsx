import Link from 'next/link';

export function Header() {
  return <header className="site-header"><Link href="/" prefetch={false}>바로계산기</Link></header>;
}
