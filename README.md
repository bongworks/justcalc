# 바로계산기

자동차, 금융, 급여·고용, 부동산, 세금·사업, 건강·운동, 생활·날짜, 교육·단위에 필요한 값을 브라우저에서 계산하는 한국어 웹 도구입니다. 현재 8개 카테고리에서 78개 계산기를 제공합니다.

계산 입력값과 결과는 서버로 전송하거나 저장하지 않습니다. 모든 결과는 참고용이며 실제 계약·청구 금액과 다를 수 있습니다.

## 시작하기

Node.js 24, pnpm 10.18.2와 정적 미리보기·E2E용 Python 3가 필요합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 열립니다. 이 프로젝트는 Next.js App Router를 사용하며, 배포 산출물은 서버 런타임 없는 정적 export입니다.

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

`pnpm build`는 홈 1개, 카테고리 허브 8개, 계산기 78개, 정책 페이지 5개로 총 92개의 canonical HTML 페이지와 `404.html`, `robots.txt`, `sitemap.xml`, favicon·OG 이미지 및 참조된 정적 자산을 `out/`에 생성합니다. 배포 대상은 `out/` 전체이며 Next 서버, API, 데이터베이스가 필요하지 않습니다. `pnpm start`는 현재 `out/`을 Python 정적 서버로 제공하며, 빌드 후 [http://127.0.0.1:3000](http://127.0.0.1:3000)에서 미리 볼 수 있습니다. E2E는 개발 서버를 재사용하지 않고 이 정적 산출물을 사용합니다.

`pnpm test:e2e:ui`는 Playwright UI 모드로 E2E를 실행합니다. GA4 전용 합성-ID 검증은 [분석 및 검색 연결 가이드](docs/analytics-and-search.md)의 순서대로 `pnpm test:e2e:analytics`를 실행합니다. 품질 게이트는 카탈로그 필수 콘텐츠, 입력·결과의 URL/저장소/네트워크/GA 유출 경계, 모든 공개 페이지의 HTML·사이트맵·canonical·색인 설정·자산 누락, 페이지별 gzip JS 300 KiB / CSS 30 KiB 예산을 검사합니다. 출시는 별도의 [출시 체크리스트](docs/release-checklist.md)를 모두 충족해야 합니다.

## 환경 변수와 분석·검색 설정

`.env.example`을 복사해 필요한 값을 설정하고 변경할 때마다 다시 빌드합니다. 값은 모두 정적 산출물에 반영되므로 비밀값을 `NEXT_PUBLIC_` 변수에 넣지 않습니다.

| 이름 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | canonical 운영 주소. `https://calc.bongworks.co.kr`만 허용됩니다. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 실제 GA4 측정 ID. 프로덕션 빌드에서 유효한 `G-...` 형식일 때만 GA를 로드합니다. |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | AdSense 게시자 ID. 프로덕션 빌드에서 유효한 `ca-pub-...` 형식일 때만 자동광고 스크립트를 로드합니다. |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console 소유권 검증 토큰입니다. |
| `NAVER_SITE_VERIFICATION` | Naver Search Advisor 소유권 검증 토큰입니다. |

운영 주소는 `https://calc.bongworks.co.kr`입니다. GA는 유효한 측정 ID가 있는 프로덕션 빌드에서만 공통 레이아웃으로 한 번 로드합니다. 계산기에서는 조회·시작·제출·성공/오류 결과·초기화·공유·관련 계산기 이동의 값 없는 이벤트만 전송합니다. 입력값과 계산 결과는 전송하거나 저장하지 않습니다.

홈, 카테고리 허브, 계산기, 정책 페이지는 각각 canonical 경로와 제목으로 page_view를 전송합니다. 쿼리와 해시는 page_view에 포함하지 않습니다.

AdSense 자동광고는 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`에 승인된 `ca-pub-...` 게시자 ID를 넣은 프로덕션 빌드에서만 공통 레이아웃 스크립트를 한 번 로드합니다. ID가 비어 있거나 형식이 맞지 않으면 어떤 페이지에도 Google 광고 스크립트나 빈 광고 영역을 만들지 않습니다. 자동 배치·광고 형식은 AdSense 관리 화면에서 설정합니다.

실제 법적 운영 주체와 유효한 문의 채널을 제공·검증하기 전에는 프로덕션 정책 페이지 배포, 공개 출시와 AdSense 신청을 보류합니다. GA ID 활성화 전에는 GA4 관리자에서 향상된 측정(양식, 사이트 검색, 이탈 클릭, 기록 변경), 사용자 제공 데이터 수집, Google 신호, 광고 개인 최적화 및 별도 맞춤 태그를 검토하고 필요한 항목을 비활성화해야 합니다. 실제 분석 설정·보관 기간과 필요한 고지·동의 절차도 공개 전에 확정해야 합니다. 자동광고 활성화 전에는 실제 광고가 표시된 모바일 화면에서 계산 완료율·CLS·광고 위치와 동의 흐름을 다시 확인합니다.

설정 절차와 프로덕션 분석 검증 명령은 [분석 및 검색 연결 가이드](docs/analytics-and-search.md)를 참고하세요.

## M2 배포

`release-1.0.0` 형식의 태그 또는 수동 GitHub Actions 실행으로 M2 self-hosted runner에서 빌드·배포할 수 있습니다. 워크플로는 린트·카탈로그·개인정보·단위 테스트, 통합 비활성화 정적 빌드와 E2E, 합성 GA ID 검증을 거친 뒤 최종 산출물을 만듭니다. 배포 스크립트는 `out/`을 릴리스 디렉터리에 복사하고 `current` 심볼릭 링크를 원자적으로 교체합니다. `launchd`는 정적 산출물을 `0.0.0.0:34560`에 제공하며, health check가 실패하면 이전 릴리스를 복원합니다. 실제 GA·AdSense ID와 선택적 `JUSTCALC_DEPLOY_ROOT`는 GitHub Actions Variables에서 주입합니다. 자세한 runner 설정, 변수와 복원 동작은 [M2 self-hosted 배포 가이드](docs/deployment.md)를 참고하세요.
