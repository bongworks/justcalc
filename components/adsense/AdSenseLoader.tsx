import Script from 'next/script';

/** The automatic-ad loader is emitted once, only after production config is validated. */
export function AdSenseLoader({ clientId }: { clientId: string }) {
  return <Script strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`} crossOrigin="anonymous" />;
}
