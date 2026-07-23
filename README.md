# DEEPRED — 공식 홈페이지

영화 예고편 스타일의 시네마틱 스크롤 경험으로 구성된 딥레드 쇼케이스 사이트입니다.

**스토리보드**: 콜드 오픈(폭풍 구름 + 번개 + 로고 리빌) → 클라우드 다이브 → 타워 리빌 → 제품 3종 리빌 시퀀스(Redrank·Finch·Viewscope, 제품별 고유 파티클 버스트) → 컨버전스(3색 빔 + 광주) → CTA → 투자자 섹션.

## 기술 스택

- **Next.js 16** (App Router, 정적 export) + TypeScript
- **Three.js + react-three-fiber** — 레이마칭 볼류메트릭 구름(GLSL), 프로시저럴 타워, GPU 파티클(로고 실루엣 → 버스트), 컨버전스 빔, 블룸 포스트프로세싱
- **GSAP ScrollTrigger + Lenis** — 스크롤 스크럽 마스터 타임라인, 부드러운 스크롤
- **WebAudio 프로시저럴 사운드** — 외부 음원 없이 합성한 앰비언트/천둥/임팩트 SFX (기본 음소거, 우측 상단 토글)
- 디바이스 품질 티어(파티클 수·셰이더 스텝 자동 조절), `prefers-reduced-motion` 정적 폴백

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 정적 export → out/
```

시각 검증(헤드리스 스크린샷 스윕):

```bash
node scripts/shots.mjs shots          # 데스크톱 전 구간
node scripts/shots.mjs shots --mobile # 모바일
```

## 배포

**현재 방식**: `gh-pages` 브랜치 직접 배포 → https://taehyeung123.github.io/DEEPRED-HOME/

```bash
bash scripts/deploy-pages.sh
```

**자동 배포(권장, 설정 필요)**: `docs/github-pages-workflow.yml`을
`.github/workflows/deploy.yml`로 옮겨 커밋하면 main 푸시마다 자동 배포됩니다.
단, 현재 GitHub CLI 토큰에 `workflow` 스코프가 없어 워크플로 파일 푸시가 거부되므로
먼저 아래를 실행해 스코프를 추가해야 합니다 (브라우저 인증 필요):

```bash
gh auth refresh -h github.com -s workflow
```

그 후 저장소 Settings → Pages → Source를 "GitHub Actions"로 변경하세요.

커스텀 도메인(예: `deepred.ai`) 연결 시:
1. Pages 설정에서 도메인 추가
2. Actions 워크플로의 `NEXT_PUBLIC_BASE_PATH`를 빈 값으로 변경
3. `src/app/layout.tsx`의 `NEXT_PUBLIC_SITE_URL` 환경변수 설정

## 콘텐츠 수정 포인트

| 무엇 | 어디 |
|---|---|
| 제품명·태그라인·도메인·**실서비스 URL** | `src/lib/products.ts` |
| 연락 이메일 | `src/lib/products.ts` (`CONTACT_EMAIL`) |
| 투자자 지표·로드맵 문구 | `src/components/ui/AfterSections.tsx` |
| 제품 목업 대시보드 수치 | `src/components/ui/MockDashboards.tsx` |
| 씬 타이밍(스크롤 구간) | `src/components/CinePage.tsx` + `src/lib/cine.ts` |

## 사람이 해야 할 일 (인수 체크리스트)

- [ ] **제품 실서비스 URL 연결** — `src/lib/products.ts`의 `url: null`을 실제 주소로 교체 (현재 "출시 준비 중" 표기)
- [ ] **제품 도메인 확정** — 현재 `redrank.ai` / `finch.social` / `viewscope.io`는 임의 표기입니다
- [ ] **투자자 지표 확정** — AfterSections의 지표는 사실 기반(제품 3종, 2026.08 법인)이지만, 트랙션 수치가 생기면 교체 권장. 목업 대시보드 안의 수치(94점, ROAS 412% 등)는 연출용 샘플입니다
- [ ] **로드맵 일정 확인** — "2026 하반기 정식 출시" 등은 추정 기재입니다
- [ ] **연락 이메일 확인** — 현재 rnjsxogud2165@gmail.com. 회사 공식 메일 생기면 교체
- [ ] **(주)딥레드 법인 설립 후** — 푸터의 "설립 예정" 문구를 사업자등록번호 포함 정식 표기로 교체
- [ ] **자동 배포 전환(선택)** — `gh auth refresh -h github.com -s workflow`로 토큰 스코프 추가 후 `docs/github-pages-workflow.yml`을 `.github/workflows/deploy.yml`로 이동·커밋, Pages Source를 "GitHub Actions"로 변경
- [ ] (선택) BGM — 현재 사운드는 전량 프로시저럴 합성입니다. 라이선스 음원을 쓰려면 `src/lib/audio.ts`에 스트리밍 재생 추가

© 2026 DEEPRED. (주)딥레드 — 2026년 8월 법인 설립 예정.
