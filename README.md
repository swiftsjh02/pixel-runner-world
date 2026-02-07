# Pixel Runner World (Mario-style Side Scroller)

순수 HTML/CSS/JS + Canvas 기반의 2D 횡스크롤 플랫폼 게임입니다.

## v1 포함 기능

- 월드맵 + 3개 스테이지 (`1-1`, `1-2`, `1-3`)
- 수동 좌우 이동 + 점프 + 대시
- 코요테 타임(100ms), 점프 버퍼(120ms)
- 생명 시스템 (시작 3, 최대 5)
- 피격 처리 (무적 1초 + 넉백 + 체크포인트 리스폰)
- 코인 점수 / 하트 회복
- 움직이는 발판 (수평/수직/무너짐)
- 장애물 + 적(순찰/돌진)
- 로컬 저장(`localStorage`)
- WebAudio 효과음
- 디버그 오버레이 (`F3` 토글)

## 실행

```bash
npm run serve
```

브라우저에서 `http://localhost:8080` 접속

## 조작

- 이동: `A/D` 또는 `←/→`
- 점프: `Space`, `W`, `↑`, `Enter`
- 대시: `Shift`
- 일시정지: `Esc`
- 모바일: 하단 터치 버튼 (`◀ ▶ JUMP DASH`)

## 점수 규칙

- 코인: `+100`
- 스테이지 클리어: `+1000`
- 남은 생명 보너스: `+300 / life`
- 하트 오버플로(최대 생명에서 획득): `+100`

## 저장 스키마

`pixel_runner_save_v1` 키에 다음 구조로 저장됩니다.

- `version`
- `unlockedStageIndex`
- `bestScoresByStage`
- `lastPlayedStageId`
- `sfxVolume`

## 구조

- `index.html`: 모듈 엔트리 + HUD + 모바일 컨트롤
- `styles.css`: 픽셀 렌더링/레이아웃/터치 UI
- `src/main.js`: 게임 루프/씬 전환/리사이즈/HUD 업데이트
- `src/data/stages.js`: `StageDefinition` 데이터 (1-1, 1-2, 1-3)
- `src/scenes/worldMapScene.js`: 월드맵 씬
- `src/scenes/stageScene.js`: 스테이지 플레이 씬
- `src/entities/*.js`: 플레이어/적/아이템/발판
- `src/systems/*.js`: 입력/저장/오디오/물리/충돌

## Firebase Hosting + GitHub CI/CD

### 1) GitHub 저장소 연결

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

GitHub 저장소 `Settings > Secrets and variables > Actions`:

- Secret: `FIREBASE_TOKEN`
- Variable: `FIREBASE_PROJECT_ID`

### 4) 자동 배포

- PR 생성/업데이트: 미리보기 채널 배포 (`7d`)
- `main` 푸시: `live` 채널 실배포
- 공통 CI: `npm run check`

### 5) 롤백

Firebase Console > Hosting > Release history에서 이전 릴리즈 선택
