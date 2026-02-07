# Pixel Meadow (웹 2D 픽셀아트 게임 샘플)

브라우저에서 바로 실행 가능한 순수 HTML/CSS/JS 기반 2D 픽셀아트 게임입니다.

## 실행 방법

1. 폴더에서 `index.html`을 브라우저로 열기
2. 또는 간단한 로컬 서버 실행

```bash
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속

## 조작

- 이동: `WASD` 또는 방향키
- 달리기: `Shift`
- 모바일: 화면 하단 터치 패드

## 포함된 기본 기능

- 픽셀 렌더링(Nearest Neighbor)
- 타일 기반 맵 + 충돌
- 카메라 추적
- 보석 수집(10개) 목표

## Firebase Hosting + GitHub CI/CD

### 1) GitHub 저장소 연결

현재 폴더는 로컬 Git 저장소(`main`)로 초기화되어 있습니다.
원격 저장소를 만든 뒤 아래 명령으로 연결하세요.

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git add .
git commit -m "chore: setup firebase hosting ci cd"
git push -u origin main
```

### 2) Firebase 프로젝트 준비

1. Firebase Console에서 새 프로젝트 생성
2. Hosting 활성화
3. 서비스 계정 키(JSON) 발급

`.firebaserc`의 `your-firebase-project-id`를 실제 프로젝트 ID로 변경하세요.

### 3) GitHub Actions 시크릿/변수 설정

GitHub 저장소 `Settings > Secrets and variables > Actions`에서 아래를 추가하세요.

- Secret: `FIREBASE_SERVICE_ACCOUNT`
  - 값: 서비스 계정 JSON 전체 문자열
- Variable: `FIREBASE_PROJECT_ID`
  - 값: Firebase 프로젝트 ID (예: `pixel-meadow-game`)

### 4) 자동 배포 동작

- PR 생성/업데이트: `.github/workflows/deploy-preview.yml`
  - 문법 체크 후 Firebase Preview 채널 배포
  - PR 코멘트로 미리보기 URL 제공
- `main` 푸시: `.github/workflows/deploy-prod.yml`
  - 문법 체크 후 실서버(`live`) 배포
- 공통 CI: `.github/workflows/ci.yml`
  - `npm run check` 실행

### 5) 롤백

Firebase Console > Hosting > Release history에서 이전 릴리즈를 선택해 롤백할 수 있습니다.
