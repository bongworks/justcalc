'use client';

import Script from 'next/script';
import { calculators } from '@/content/calculators';
import { calculatorCategories } from '@/lib/calculators/categories';
import { homePage, policyPages } from '@/lib/seo/site';

/** Query access is limited to four bounded campaign codes; page URLs stay canonical. */
export function GoogleAnalytics({ measurementId, siteOrigin }: { measurementId: string; siteOrigin: string }) {
  const categoryPages = calculatorCategories.map(({ route, label }) => ({ route, title: `${label} 계산기` }));
  const pages = [homePage, ...policyPages, ...categoryPages, ...calculators].map(({ route, title }) => ({ route, title }));
  const bootstrap = `(function(){
    if(window.__justcalcGaInitialized)return;
    window.__justcalcGaInitialized=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    var pages=${JSON.stringify(pages).replace(/</g, '\\u003c')};
    var page=pages.find(function(entry){return entry.route===window.location.pathname;})||pages[0];
    var referrer='';
    try{var ref=new URL(document.referrer);if(ref.protocol==='https:'||ref.protocol==='http:')referrer=ref.origin+'/';}catch(e){}
    var campaign={};
    var query=new URLSearchParams(window.location.search);
    var campaignKeys={utm_source:'campaign_source',utm_medium:'campaign_medium',utm_campaign:'campaign_name',utm_content:'campaign_content'};
    Object.keys(campaignKeys).forEach(function(key){
      var values=query.getAll(key);
      if(values.length===1&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(values[0]))campaign[campaignKeys[key]]=values[0];
    });
    window.gtag('js',new Date());
    window.gtag('config',${JSON.stringify(measurementId)},Object.assign({send_page_view:true,page_location:${JSON.stringify(siteOrigin)}+page.route,page_path:page.route,page_title:page.title,page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false},campaign));
  })();`;
  return <>
    <script id="ga-bootstrap" dangerouslySetInnerHTML={{ __html: bootstrap }} />
    <Script id="ga-library" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
  </>;
}
