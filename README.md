# 바로계산기

자동차 구매·운행, 대출·예적금, 월 생활비에 필요한 비용을 브라우저에서 계산하는 한국어 웹 도구입니다.

계산 입력값과 결과는 서버로 전송하거나 저장하지 않습니다. 모든 결과는 참고용이며 실제 계약·청구 금액과 다를 수 있습니다.

## 시작하기

```bash
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 열립니다.

## 검증

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```
