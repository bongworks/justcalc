import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteOrigin, getVerification } from '@/lib/seo/site';

afterEach(() => vi.unstubAllEnvs());

it('rejects unsafe configured origins instead of publishing poisoned metadata', () => {
  for (const value of ['javascript:alert(1)', 'http://calc.bongworks.co.kr', 'https://user:pass@calc.bongworks.co.kr', 'https://calc.bongworks.co.kr/?income=123', 'https://calc.bongworks.co.kr/private', 'https://evil.example', 'invalid']) {
    expect(() => getSiteOrigin(value)).toThrow();
  }
  expect(getSiteOrigin('')).toBe('https://calc.bongworks.co.kr');
  expect(getSiteOrigin('https://calc.bongworks.co.kr/')).toBe('https://calc.bongworks.co.kr');
});

it('omits blank verification values and emits configured provider tokens', () => {
  expect(getVerification('', '')).toEqual({});
  expect(getVerification('google-token', 'naver-token')).toEqual({ google: 'google-token', other: { 'naver-site-verification': 'naver-token' } });
});

it('escapes script terminators in structured data', () => {
  const html = renderToStaticMarkup(<JsonLd data={{ name: '</script><script>alert(1)</script>' }} />);
  expect(html.match(/<script/g)).toHaveLength(1);
  const raw = html.slice(html.indexOf('>') + 1, html.lastIndexOf('</script>'));
  expect(JSON.parse(raw).name).toBe('</script><script>alert(1)</script>');
});
