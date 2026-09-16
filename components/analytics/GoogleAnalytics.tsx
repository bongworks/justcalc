'use client';

import Script from 'next/script';
import { calculators } from '@/content/calculators';
import { homePage, policyPages } from '@/lib/seo/site';

/** The parser creates the queue before any calculator hydrates; the network script stays asynchronous. */
export function GoogleAnalytics({ measurementId, siteOrigin }: { measurementId: string; siteOrigin: string }) {
  const pages = [homePage, ...policyPages, ...calculators].map(({ route, title }) => ({ route, title }));
  const bootstrap = `(function(){
    if(window.__justcalcGaInitialized)return;
    window.__justcalcGaInitialized=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    var pages=${JSON.stringify(pages).replace(/</g, '\\u003c')};
    var page=pages.find(function(entry){return entry.route===window.location.pathname;})||pages[0];
    var referrer='';
    try{var ref=new URL(document.referrer);if(ref.protocol==='https:'||ref.protocol==='http:')referrer=ref.origin+'/';}catch(e){}
    window.gtag('js',new Date());
    window.gtag('config',${JSON.stringify(measurementId)},{send_page_view:true,page_location:${JSON.stringify(siteOrigin)}+page.route,page_path:page.route,page_title:page.title,page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false});
  })();`;
  return <>
    <script id="ga-bootstrap" dangerouslySetInnerHTML={{ __html: bootstrap }} />
    <Script id="ga-library" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
  </>;
}
