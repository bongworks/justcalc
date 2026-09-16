# 바로계산기

자동차 구매·운행, 대출·예적금, 월 생활비에 필요한 비용을 브라우저에서 계산하는 한국어 웹 도구입니다.

계산 입력값과 결과는 서버로 전송하거나 저장하지 않습니다. 모든 결과는 참고용이며 실제 계약·청구 금액과 다를 수 있습니다.

## 시작하기

Node.js 24, pnpm 10.18.2와 정적 미리보기용 Python 3가 필요합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 열립니다.

## 검증

```bash
pnpm lint
pnpm check:catalog
pnpm check:privacy
pnpm test
NEXT_PUBLIC_GA_MEASUREMENT_ID='' pnpm build
pnpm check:static
pnpm test:e2e
```

`pnpm build`는 계산기 9개·정책 페이지 5개·홈, `robots.txt`, `sitemap.xml` 및 정적 자산을 `out/`에 생성합니다. 배포 대상은 `out/` 전체이며 Next 서버, API, 데이터베이스가 필요하지 않습니다. `pnpm start`는 현재 `out/`만 Python 정적 서버로 제공합니다. E2E도 이 산출물을 사용하며 실행 중인 개발 서버를 재사용하지 않습니다. 빌드 후 `pnpm start`로 [정적 미리보기](http://127.0.0.1:3000)를 확인할 수 있습니다.

품질 게이트는 카탈로그 필수 콘텐츠, 입력·결과의 URL/저장소/네트워크/GA 유출 경계, HTML·사이트맵·canonical·색인 설정·자산 누락, 페이지별 gzip JS 300 KiB / CSS 30 KiB 예산을 검사합니다. 출시는 별도의 [출시 체크리스트](docs/release-checklist.md)를 모두 충족해야 합니다.

## 공개 출시와 분석·검색 설정

운영 주소는 `https://calc.bongworks.co.kr`입니다. `.env.example`의 실제 GA4 측정 ID와 Google/Naver 소유권 검증 토큰을 설정한 뒤 재빌드합니다. 빈 값은 해당 기능을 끄며 개발 환경에서는 GA를 로드하지 않습니다.

실제 법적 운영 주체와 유효한 문의 채널을 제공·검증하기 전에는 프로덕션 정책 페이지 배포, 공개 출시와 AdSense 신청을 보류합니다. GA ID 활성화 전에는 관리자에서 향상된 측정(양식, 사이트 검색, 이탈 클릭, 기록 변경)을 꺼야 합니다. 기본 페이지 방문과 값이 제외된 계산기 이벤트만 사용합니다. 실제 분석 설정·보관 기간과 필요한 고지·동의 절차도 공개 전에 확정해야 합니다.

설정 절차와 프로덕션 분석 검증 명령은 [분석 및 검색 연결 가이드](docs/analytics-and-search.md)를 참고하세요.
