# 분석 및 검색 연결

정적 페이지와 브라우저 내 계산만 제공합니다. 분석 프록시, API, 데이터베이스는 없습니다.

## 공개 출시 전 필수 확인

- 실제 법적 운영 주체와 연락 가능한 문의 채널을 운영자가 제공하고 검증한 뒤 `/contact/`와 개인정보 처리방침을 갱신합니다. 그 전에는 프로덕션 정책 페이지 배포, 공개 출시, AdSense 신청을 보류합니다.
- 실제 호스팅과 Google Analytics 설정에 맞춰 개인정보 처리 목적·보관 기간·제공자와 필요한 고지·동의 요건을 확정합니다.
- 현재 광고 스크립트는 없습니다. 광고 도입은 별도 작업입니다.

## 환경 변수와 빌드

`.env.example`을 참고합니다. 토큰과 ID는 실제 소유 계정에서 확인한 값만 사용합니다. 빈 값은 기능을 끕니다. `NEXT_PUBLIC_SITE_URL`은 확인된 운영 주소 `https://calc.bongworks.co.kr`만 허용하며 잘못된 주소는 빌드를 실패시킵니다. 변수를 변경하면 다시 빌드합니다.

`NEXT_PUBLIC_GA_MEASUREMENT_ID`가 유효한 `G-…` 형태이고 프로덕션 빌드인 경우에만 한 개의 GA 컴포넌트를 루트 레이아웃에서 로드합니다. 인라인 큐를 hydration 전에 만들고 외부 gtag 스크립트를 `afterInteractive`로 불러옵니다. 개발 및 ID 미설정 환경에는 스크립트가 없습니다.

## GA4 속성 설정: ID 활성화 전 필수

1. GA4 관리 → 데이터 스트림 → 웹 스트림에서 향상된 측정을 끕니다. 특히 양식 상호작용, 사이트 검색, 이탈 클릭, 브라우저 기록 기반 페이지 변경을 켜지 마세요. 이들은 브라우저 URL·검색어·링크 등의 추가 값을 수집할 수 있습니다. 이러한 속성 관리 설정을 임의의 gtag 플래그로 비활성화할 수 있다고 가정하지 않습니다.
2. 사용자 제공 데이터 수집, Google 신호, 광고 개인 최적화 및 별도 맞춤 태그를 활성화하지 않습니다. 코드도 Google 신호와 광고 개인 최적화 신호를 비활성화합니다.
3. 표준 `send_page_view: true`로 문서 방문을 한 번 수집합니다. GA가 제공하는 기본 세션·첫 방문·기기/브라우저 처리는 유지됩니다. 헤더의 홈 링크를 포함한 페이지 간 내부 링크는 일반 `<a>`로 문서 이동하여 새 페이지에서 한 번 초기화합니다. 같은 페이지의 카테고리·본문 앵커는 새 페이지 방문으로 세지 않습니다. 향후 SPA 탐색을 도입하면 중복 없는 페이지 추적을 별도로 검증해야 합니다.
4. 개발자 도구의 네트워크 요청 및 DebugView에서 테스트 입력, 결과, 클립보드, 허용된 UTM 캠페인 코드 외의 쿼리·해시가 전송되지 않는지 확인한 뒤 활성화합니다. 실제 GA 서버 수집과 관리자 설정은 로컬 자동 테스트로 검증할 수 없습니다.

모든 계산기 이벤트는 `lib/analytics/events.ts`의 타입·허용 목록을 통과합니다. 자동 페이지 설정에는 등록된 페이지 주소와 제목을 사용하고 유입 주소는 origin으로 축소합니다. `page_location`은 항상 쿼리와 해시가 없는 canonical 주소입니다. 브라우저의 외부 요청 referrer도 `strict-origin`으로 제한합니다. GA 속성을 나중에 변경하면 이 개인정보 경계를 다시 검증해야 합니다.

캠페인 분석은 최초 문서 URL에서 `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` 네 키만 읽어 각각 `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content`에 매핑합니다. 값은 ASCII 영문자로 시작하는 1~64자의 영문·숫자·밑줄·하이픈 코드만 허용하고, 중복 키는 거부합니다. 이메일·URL·공백·숫자로만 된 값·64자 초과 값은 제외합니다. 다른 쿼리와 해시, 계산값·결과는 전달하지 않으며 UTM을 저장하거나 링크에 전파하지 않습니다. 개인정보나 계산값을 캠페인 코드로 쓰지 마세요. 문자 필터만으로 임의 문자열의 의미가 개인정보인지 판별할 수 없으므로 운영자가 비개인 캠페인 코드를 관리해야 합니다. 이 제한된 파싱은 SHA-256 검토 대상 GA 부트스트랩 안에서만 허용됩니다.

## Search Console / Naver Search Advisor

- 실제 계정에서 발급한 토큰을 각각 `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`에 넣고 재빌드하면 verification 메타 태그가 생성됩니다.
- 공개 출시 조건을 충족한 후 소유권 검증을 완료하고 `https://calc.bongworks.co.kr/sitemap.xml`을 두 서비스에 제출합니다. 코드 변경만으로 소유권 검증이나 검색 등록이 완료되지는 않습니다.
- 사이트맵은 홈, 정책 5개, 계산기 9개의 총 15개 주소만 포함합니다. 쿼리별 페이지는 생성하지 않습니다.

## 검증

```sh
NEXT_PUBLIC_GA_MEASUREMENT_ID='' pnpm build
pnpm check:static
pnpm test:e2e
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST123456 pnpm build
pnpm check:static -- --ga-fixture
E2E_GA_PRODUCTION=1 pnpm test:e2e:analytics
# 합성 ID가 포함된 out/을 배포하지 않도록 반드시 최종 빌드를 복원합니다.
NEXT_PUBLIC_GA_MEASUREMENT_ID='' pnpm build
pnpm check:static
```

`G-TEST123456`은 자동 테스트용 합성 값입니다. 테스트는 HTML의 ID가 이 값인지 확인하고 외부 Google 스크립트 응답을 로컬에서 대체하며 나머지 외부 요청은 차단합니다. 실제 분석 전송을 하지 않으며 실제 GA 속성이나 관리자 설정의 검증을 대신하지 않습니다. 테스트가 실패했더라도 마지막 두 명령을 실행해 합성 ID 없는 산출물로 복원하세요. 배포 빌드에는 테스트 값을 사용하지 마세요.
