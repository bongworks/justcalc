# M2 self-hosted 배포

`.github/workflows/deploy.yml`은 M2 Mac의 GitHub Actions self-hosted runner에서 정적 산출물 `out/`을 빌드하고 배포한다. 일반 브랜치 푸시와 PR은 배포하지 않는다.

## 실행 조건

- `release-1.0.0` 형식의 태그를 푸시하면 실행된다. 태그 이름은 `release-X.Y.Z` 정수 SemVer 형식이어야 한다.
- Actions 화면의 **Build and deploy** → **Run workflow**에서 브랜치, 태그 또는 커밋 SHA를 지정해 수동 실행할 수 있다.
- runner에는 `self-hosted`, `bongbong-MacBookPro-M2` 레이블과 Python 3, `curl`, macOS 기본 `launchctl` 및 `ditto`가 필요하다. Node 24와 pnpm 10.18.2는 workflow가 준비한다.

## GitHub 설정

저장소 **Settings → Secrets and variables → Actions → Variables**에 다음 값을 등록한다.

| 이름 | 필수 | 값 |
| --- | --- | --- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 아니오 | 실제 `G-...` GA 측정 ID. 브라우저 정적 파일에 포함되므로 Secret이 아닌 Variable을 사용한다. |
| `JUSTCALC_DEPLOY_ROOT` | 아니오 | 배포 루트. 비워두면 runner 계정의 `$HOME/justcalc`를 사용한다. |

`NEXT_PUBLIC_SITE_URL`은 운영 canonical 주소인 `https://calc.bongworks.co.kr`로 workflow에 고정되어 있다. GA ID는 Next.js 정적 빌드 시점에 삽입되므로, 배포 서버에 `.env` 파일을 둘 필요가 없다.

## 배포 동작과 복원

배포 스크립트는 `DEPLOY_ROOT/releases/<release-name>`에 새 `out/`을 복사한 다음, `current` 심볼릭 링크를 원자적으로 교체한다. `launchd` LaunchAgent `com.bongworks.justcalc`을 다시 로드해 `0.0.0.0:34560`에서 Python 정적 서버를 실행하고 `http://127.0.0.1:34560/`을 확인한다. 확인에 실패하면 이전 `current` 릴리스로 되돌리고 다시 시작한다. 이전 릴리스는 자동 삭제하지 않는다.

생성되는 LaunchAgent는 `$HOME/Library/LaunchAgents/com.bongworks.justcalc.plist`에 놓이며 로그인 시 실행되고 비정상 종료 후 재시작한다. workflow runner는 이 LaunchAgent를 소유한 macOS 사용자 세션에서 실행되어야 한다.

이 구성은 서버를 모든 인터페이스의 34560 포트에 바인딩할 뿐이다. macOS 방화벽, 공유기 포트포워딩, TLS/리버스 프록시는 변경하지 않는다.
