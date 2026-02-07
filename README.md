# Voxel Frontier (Web Mini Minecraft v1)

`Three.js + Vite` 기반의 1인칭 싱글플레이 복셀 샌드박스입니다.

## v1 기능

- 1인칭 이동/점프/달리기
- 절차적 무한 청크 (`16 x 16 x 96`, 렌더거리 6)
- 블록 파괴/설치 (거리 6)
- 핫바 선택 (`1~9`)
- 크리에이티브 방식(자원 무한)
- IndexedDB 저장/복원
- 효과음(파괴/설치/발소리/점프)

## 실행

```bash
npm install
npm run dev
```

## 빌드/검증

```bash
npm run check
npm run build
npm run preview
```

## 조작

- 이동: `W A S D`
- 점프: `Space`
- 달리기: `Shift`
- 시점: 마우스
- 파괴: 좌클릭
- 설치: 우클릭
- 핫바: `1~9`
- 디버그 HUD 토글: `F3`
- 포인터 잠금 해제: `Esc`

## 저장 구조

- IndexedDB DB: `voxel_world_v1`
- store:
  - `meta` (`seed`, 플레이어 상태, 설정)
  - `chunks` (`cx,cz` 키 기반 RLE 압축 블록 데이터)

## 주요 구조

- `/Users/jihoseo/Desktop/코덱스연습/src/main.js`: 부트스트랩/게임 루프
- `/Users/jihoseo/Desktop/코덱스연습/src/world/chunkManager.js`: 청크 로딩/메시/수정/플러시
- `/Users/jihoseo/Desktop/코덱스연습/src/world/worldGen.js`: 결정론적 지형 생성
- `/Users/jihoseo/Desktop/코덱스연습/src/world/mesher.js`: 면 컬링 기반 메시 생성
- `/Users/jihoseo/Desktop/코덱스연습/src/systems/saveIndexedDb.js`: 저장/복원

## Firebase Hosting + GitHub Actions

- CI: `.github/workflows/ci.yml`
  - `npm ci`
  - `npm run check`
- PR Preview: `.github/workflows/deploy-preview.yml`
  - check 성공 후 빌드 및 preview channel 배포 (`7d`)
- Production: `.github/workflows/deploy-prod.yml`
  - `main` push 시 check 성공 후 빌드 및 live 배포

필수 GitHub 설정:

- Secret: `FIREBASE_SERVICE_ACCOUNT`
- Variable: `FIREBASE_PROJECT_ID`

`/Users/jihoseo/Desktop/코덱스연습/.firebaserc` 의 `your-firebase-project-id`는 실제 Firebase 프로젝트 ID로 변경해야 합니다.

## CLI로 초기 배포 준비 (선택)

```bash
# GitHub
gh auth login
gh repo create <repo-name> --public --source=. --remote=origin --push

# Firebase
firebase login
firebase use --add
firebase deploy --only hosting
```
