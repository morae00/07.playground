# 그림 출처 기록 (스타일 바이블 §15)

출시 빌드에 들어가는 그림을 묶음마다 한 줄로 적는다. 스타일 바이블 §15(2026-10-23 개정)의 출시 조건 ①이다. 그림을 새로 굽거나 바꾸면 그 커밋에서 해당 줄을 고친다. 확인하지 못한 것은 **[확인]**으로 적고 §3에 모았다. 출시 전에는 출시 빌드의 모든 줄에서 [확인]이 없어야 한다(`docs/RELEASE_CHECKLIST.md` §1).

## 1. 모든 줄에 공통

| 항목 | 내용 |
|---|---|
| 기준 | remaster/r2 cb7a54e. 커밋은 `GIT_DIR=.repo-git git log --oneline -- <경로>`로 확인했다(2026-10-24) |
| 범위 | 출시 빌드에 들어가는 그림 파일 전부: `public/assets/atlas/`, `public/assets/packs/`(소리 팩 `sfx-common` 제외), `src/ui/art/*.webp`, `public/favicon.png`, `build/icon.png`. 2026-10-24에 이 폴더들의 그림·글꼴 파일(png, webp, svg, jpg, gif, ico, icns, woff, ttf, otf)을 모두 찾아 아래 줄에 맞췄다. 글꼴 파일은 없다 |
| 제작 방식 | 앱 아이콘(P-27, P-28) 말고는 모두 컨셉 킷(`art/concept-kit/`의 절차형 SVG 생성 코드)이 그린 마크업을 래스터한 것이다 |
| AI 사용 단계 | 킷 출력(출시, §15). **사람이 한 작업: 모든 줄 없음.** 사람 클린업 목록은 `docs/art/cleanup.md` |
| 제작자 | R4·R5 킷(K0~K11): kit-artist가 그리고 art-director가 검수했다. 둘 다 Claude Code 프로젝트 서브에이전트다(`.claude/agents/`, `model: opus`). 등록·굽기·렌더러 연결은 메인 세션(Claude Code)이 했다. R0 킷(첫 판): 2026-09-29 리마스터 분석 세션의 에이전트가 쓴 SVG 생성 코드다(`artifacts/remaster/concept-kit/`, 제안 B 원본 `lib.js`·`hero.js`·`sprites.js`·`boss.js`·`board.js` 포함). c1b30b9가 `art/concept-kit/`로 가져왔다. 에이전트 모델의 정확한 판은 기록에 없다 [확인] |
| 입력 자료 | 작업 지시서(`docs/art/briefs/`, `docs/art/reviews/R4-faces.md`), 스타일 바이블, 로어 바이블. 참고 이미지는 쓰지 않았다. v1.0 §1의 레퍼런스(블랙 스팟, 극화 망점, 흑백 대비, 사극 복식)는 방향을 말하는 낱말이고, 그 작품의 이미지를 가져오거나 따라 그린 것은 없다 |
| 외부 자료 검사 | 굽기가 읽는 킷 파일 16개(`lib.js`와 `k-*.js` 15개)에 `<image>`, `data:image`, 외부 `href`가 없다(2026-10-24 grep). kit-artist에게는 웹 도구가 없고, 실행할 수 있는 명령은 `node scripts/art-review-sheet.mjs` 하나다(`.claude/agents/kit-artist.md`, 범위 훅 `.claude/hooks/scope-guard.mjs`). 에이전트는 아무것도 내려받지 않는다(`.claude/agents/CONTEXT.md`) |
| 글자·폰트 검사 | 굽는 킷 파일의 `<text>`는 `art/concept-kit/k-icons.js`의 두 곳뿐이다. 각성 낙관 '覺'(:515, 시스템 글꼴 `SERIF`)과, 굽지 않는 `damageNumber`(:1107)다. 그림 속 글자는 K3·K5·K9 감사와 킷 점검(2026-10-23)에서 이 낙관 하나 말고 0건이다 |
| 도구 T1 | 킷 SVG 문자열 → Playwright(지금 1.61.1, Apache-2.0)가 띄운 headless Chromium에서 @2x로 래스터 → 아틀라스는 PNG 페이지(`scripts/build-atlas.mjs`), UI 시트와 이야기 패널은 WebP 품질 0.85(`scripts/build-ui-art.mjs`). 굽기 전에 킷 v1.0 먹·종이 토큰을 `COLOR_MAP`(`art/atlas-spec.mjs`)으로 구현값에 바꾼다. 이미지 생성 모델은 쓰지 않았다. 굽기마다 쓴 Chromium 빌드는 기록하지 않았다 [확인] |
| 도구 T2 | 앱 아이콘: Swift와 CoreGraphics(macOS)로 그린 PNG. 크기는 macOS `sips`로 줄인다 |
| 권리 L1 | 이 저장소의 코드가 그린 그림이고 제3자 그림·사진·스캔이 들어 있지 않다. 킷 코드는 AI 서비스(Claude Code)의 출력이므로, 출력을 쓰는 조건은 그 서비스의 상용 약관을 따른다. 출시 전에 약관을 확인해 이 칸을 닫는다 [확인] |
| 권리 L2 | 각성 낙관 '覺'의 글리프는 굽는 기계의 macOS 시스템 글꼴(AppleMyungjo, 없으면 Apple SD Gothic Neo)로 래스터한 것이다. 래스터한 글리프를 출시 그림에 넣어도 되는지 글꼴 라이선스를 확인하거나, 낙관을 고정 경로로 바꾼다(`cleanup.md` K-6) [확인] |
| 권리 L3 | 앱 아이콘 코드는 git 작성자가 'Codex'로 적힌 0.1.0 시기 커밋에서 왔다. 쓴 도구와 그 약관, 사람이 쓴 코드인지를 확인한다 [확인] |
| 원본과 재현 | 원본은 굽기 커밋의 `art/concept-kit/`, 사양(`art/atlas-spec.mjs`, `art/ui-art-spec.mjs`), 굽기 스크립트이고 git이 보존한다. 같은 킷·사양·Chromium이면 결과가 바이트 단위로 같다(`docs/art/pipeline.md`). 메인 세션은 R4부터 커밋한 HEAD 사본에 받아들인 킷 파일만 얹어 굽고, 굽기 결과와 그 킷 파일을 같은 커밋에 넣는다. 지금 킷 모듈마다 마지막으로 바뀐 커밋은 굽기 커밋이다(2026-10-24 확인) |
| 함께 나오는 데이터 | `public/assets/atlas/manifest.json`, `src/game/render/assets/atlasManifest.generated.ts`(테스트용), `src/ui/art/uiArt.generated.css`, `src/ui/art/arsenalArt.generated.css`(배지 규칙. 44종을 모두 그려 지금은 비어 있다)는 굽기가 쓰는 데이터와 스타일이라 따로 줄을 두지 않는다 |
| 판 표기 | 모듈이 내보내는 `version`이 있으면 그 값, 없으면 API 문서의 판이다. `version`이 없는 모듈 8개(bossesA·B·C, fieldBosses, icons·vfx, enemies, env, bombers)는 매니페스트에 판이 남지 않는다(킷 점검 P3-1) |

## 2. 묶음별 기록

칸 읽는 법: '받아들인 기록'의 납품서는 모두 `docs/art/deliveries/` 아래 파일이다. 'R0 킷'은 R4 전의 첫 판이고 납품·검수 파일이 없다(§3-4). '남은 클린업'의 번호는 `docs/art/cleanup.md`의 A1~C15(사람)와 K-1~K-9(킷·메인 세션)다.

### 2.1 캔버스 아틀라스 (`npm run build:atlas`, 사양 `art/atlas-spec.mjs` `PACKS`)

| # | 묶음 (파일 · 슬롯) | 생성기 (모듈 · 이름공간 · 판) | 사양 항목 | 받아들인 기록 | 굽기 커밋 | 도구 · 권리 | 남은 클린업 |
|---|---|---|---|---|---|---|---|
| P-1 | 공통 팩 · 결 스프라이트 21장: `public/assets/atlas/common-0.png`의 `hero/<state>/<frame>`(idle 6, run 8, throw 4, hurt 3) | `k-hero.js` · `PN.heroKit.sprite` · 2.1 | `heroFrames()` | `K0-hero-faces.md` 검수 2차 합격(2026-10-02). 그 밖은 R0 킷(API-hero v2) | c1b30b9, b32c620 | T1 · L1 | A2, A3, K-1, K-8 |
| P-2 | 공통 팩 · 적중 별 8장(`fx/hit/*`, `fx/hit-crit/*`)과 픽업 4장(`pickup/xp1~3`, `pickup/coin`) | `k-icons.js` · `PN.vfx.hit`, `PN.icons.pickup` · API rev 2 | `hitFrames()`, `pickupFrames()` | R0 킷 rev 2(AD 재작업, `art/concept-kit/API-icons.md` 'Bible delta') [확인] | 24354e4, 6b57f8d | T1 · L1 | — |
| P-3 | 장 팩 · 먹귀 4역할: `public/assets/packs/chapter-0N/atlas-*.png`의 `enemy/<ch>/<role>/*`, 장마다 28장 | `k-enemies.js` · `PN.enemies.draw` · API v2.1 | `enemyFrames()`, `ENEMY_ROLES`(fit·pad, 사수 조준 점선 제거) | `K5-env-enemies.md` 검수 2차 합격(2026-10-03: 1장 글자 정리, 눈 E1·E2). 그 밖은 R0 킷 v2 [확인] | c1b30b9(1장), 48d3396(2·3장), 47ed5ef(4·5장), 0fbbfc1(K5) | T1 · L1 | A3 |
| P-4 | 장 팩 · 처치 폭발 6장과 마른 먹 데칼 5단: `enemy/<ch>/<role>/death/*`, `decal/*` | `k-icons.js` · `PN.vfx.kill`, `PN.vfx.decal` · API rev 2 | `killFrames()` | R0 킷 rev 2 [확인] | 24354e4(1장), 48d3396, 47ed5ef | T1 · L1 | — |
| P-5 | 장 팩 · 라운드 보스 6종: `boss/1/butcher`, `boss/1/gaoler`, `boss/2/maw`, `boss/3/empress`, `boss/4/herald`, `boss/5/balance`. 18상태(페이즈 1~3 × 대기·준비·공격 × 평상·광폭)와 쓰러짐 4장 | `k-bosses1.js` · `PN.bossesA` · API rev 3. `k-bosses2.js` · `PN.bossesB` · API rev 3 | `BOSS_SPRITES`, `bossFrames()` | `K3-boss-poses.md`: K3-1(+K3-1f) 검수 2차 합격, K3-2 검수 1차 합격(모두 2026-10-03). 그 전 판은 R0 킷 | 5d31256(1장), 48d3396, 47ed5ef, f2f1a94(K3-1), 603fb96(K3-2) | T1 · L1 | A3, B5, K-5 |
| P-6 | 장 팩 · 중간 보스 4종: `boss/2/bishop`, `boss/3/tide-king`, `boss/4/tyrant`, `boss/5/director`. 22상태 | `k-bosses3.js` · `PN.bossesC` · `version` 없음(K1 수정 납품 2의 판) | `BOSS_SPRITES`(bossesC, 2·3페이즈는 base 무브) | `K1-bossesC.md` 검수 2차 수정 후 합격 → 메인 세션 최종 확인 합격(2026-10-03) | a11f3db | T1 · L1 | A3, B6, K-5 |
| P-7 | 장 팩 · 필드 보스 5종: `boss/<ch>/<kit>`(commander, reliquary, architect, executioner, judge). 장 N 팩에 1~N장의 필드 보스, 보스마다 10장 | `k-bosses4.js` · `PN.fieldBosses` · `version` 없음(K2 수정 납품 1의 판) | `FIELD_BOSSES` | `K2-fieldBosses.md` 검수 2차 합격(2026-10-02), 메인 세션 반영(2026-10-03) | 90388ba | T1 · L1 | A3, B6, K-5 |
| P-8 | 장 팩 · 폭탄병: `enemy/<ch>/bomber-fuse`(11장), `enemy/<ch>/bomber-burst`(7장) | `k-bombers.js` · `PN.bombers` · API v1.1 | `BOMBER_KINDS`, `enemyFrames()` | `K7-bombers.md` 검수 1차 합격(2026-10-14), 후속 수정은 메인 세션 판정(2026-10-19) | 30b43d7, e24a1a4 | T1 · L1 | A3, B12, C14 |
| P-9 | 장 팩 · 환경: 장애물 카탈로그(`OBSTACLE_CATALOGUE`), 랜드마크 기둥, 월드 경계, 바닥 타일 `chapter-0N/ground-0.webp` | `k-env.js` · `PN.env` · API rev 3.1 | `envFrames()`, `boundaryFrame()`, `GROUNDS` | `K5-env-enemies.md` 검수 2차 합격(2026-10-03: 큰 칸막이 윗면, 그림 속 글자 정리). 그 밖은 R0 킷 rev 2 [확인] | f05b83e(1장), 48d3396, 47ed5ef, d1072ce(K5) | T1 · L1 | B11, K-5 |
| P-10 | skills 팩 · 스킬 VFX 188장: `public/assets/packs/skills/atlas-0.png`의 `skill/<group>/<part>/<frame>`(분신 21장 포함) | `k-skills-vfx.js` · `PN.skillVfx` · 1.0 | `PACKS.skills`, `SKILL_VFX_TIMING` | `K4-skill-vfx.md` 검수 2차 합격(2026-10-03) | db7808c | T1 · L1 | B8, K-3, K-5 |
| P-11 | skills 팩 · 무기 탄 264장: 같은 페이지의 `skill/<무기>/<part>/<frame>`(투사체 무기 22종 × 12) | `k-icons2.js` · `PN.arsenal.stamp` · 1.0 | `scripts/build-atlas.mjs`가 `PN.arsenal` META `done` 무기를 펼친다 | `K9-arsenal-icons.md` 검수 3차 합격(2026-10-15, 8종), 검수 5차 합격(2026-10-16, 14종). 그 뒤 탄은 바뀌지 않았다(검수 8차, `shots264=194b48x`). 앞부분 기록이 빠졌다(§3-5) | 19dbd1a, 01166a7 | T1 · L1 | — |
| P-12 | hazards 팩 297장: `public/assets/packs/hazards/atlas-0.png`의 `hazard/<group>/<part>/<frame>`(9그룹) | `k-hazards.js` · `PN.hazards` · 1.0-d2r2 | `PACKS.hazards`, `HAZARD_VECTORS` | `K11-hazards.md` 검수 4차 합격과 N1 메인 세션 판정(2026-10-19) | f4635a7(불, 1.0 스냅숏), a90732a(나머지 6종, 1.0-d2r2) | T1 · L1 | B7 |
| P-13 | arsenal-fx 팩 354장: `public/assets/packs/arsenal-fx/atlas-0.png`의 `afx/<group>/<part>/<frame>`(39그룹) | `k-arsenal-fx.js` · `PN.arsenalFx` · 1.0-d3b2-r1 | `PACKS['arsenal-fx']`, `ARSENAL_FX_VECTORS` | `K10-arsenal-fx.md` 검수 8차 수정 후 합격과 메인 세션 확인(2026-10-20) | bd15c86, 67414bf, d9b2feb | T1 · L1 | B9 |
| P-14 | 캐릭터 팩 7개: `public/assets/packs/hero-<id>/atlas-0.png`(dan, noeul, seori, dok, hwi, ryeong, wol), 21장씩 | `k-characters.js` · `PN.characters.sprite` · 1.0 | `CHARACTER_ART`, `characterFrames()` | `K8-characters.md` 검수 2차 조건부 합격(2026-10-15)과 수정 2회차 납품서. 검수 2차가 AD 재검수 없이 메인 세션의 확인 렌더로 닫으라고 했고, 메인 세션이 `mv-k8-b1`~`b4`를 확인한 뒤 구웠다. 따로 쓴 최종 판정은 없다 | 12769a6 | T1 · L1 | A1, A2, A3, K-1, K-3, K-8 |

### 2.2 UI 시트 (`npm run build:ui-art`, 사양 `art/ui-art-spec.mjs` `UI_SHEETS`)

키 지정 시트 셋(무기 타일·슬롯, 캐릭터 초상)은 빌드가 `assets/packs/ui/`로 내보낸다(`vite.config.ts` `LAZY_UI_ART`).

| # | 묶음 (파일 · 칸) | 생성기 (모듈 · 이름공간 · 판) | 사양 항목 | 받아들인 기록 | 굽기 커밋 | 도구 · 권리 | 남은 클린업 |
|---|---|---|---|---|---|---|---|
| P-15 | `src/ui/art/skill-tiles.webp`(`artTile`): 스킬 17종 × 평상·각성, 보너스 카드 4장 | `k-icons.js` · `PN.icons.tile`·`frame`·`pickup`, `PN.vfx.hit` · API rev 2. 보너스 카드는 굽기 recipe `bonusTile`이 등급 틀 위에 킷 그림을 얹는다 | `UI_SHEETS.tiles`, `SKILL_ART`, `BONUS_ART` | R0 킷 rev 2(AD 재작업) [확인] | abd7a1d | T1 · L1, L2(각성 17칸) | K-4, K-6 |
| P-16 | `src/ui/art/hud-slots.webp`(`artSlot`): 스킬 17종 × 평상·각성 | `k-icons.js` · `PN.icons.hudSlot` · API rev 2 | `UI_SHEETS.slots` | R0 킷 rev 2 [확인] | abd7a1d | T1 · L1 | K-4 |
| P-17 | `src/ui/art/arsenal-tiles.webp`, `arsenal-slots.webp`(키 지정): 무기 44종 × 평상·각성 | `k-icons2.js` · `PN.arsenal.tile`·`hudSlot` · 1.0(각성 틀은 `k-icons.js`의 것을 빌린다) | `UI_SHEETS.arsenalTiles`·`arsenalSlots`, `ARSENAL_ART` | `K9-arsenal-icons.md` 검수 8차 합격(2026-10-19). 묶음별로 8종은 검수 3차, 14종은 검수 5차, 22종은 검수 7차에 받아들였다. 1차 납품서와 검수 1·2차는 2026-10-27에 되살렸다 | 19dbd1a, 01166a7, 54a8bc1, 29c50f8 | T1 · L1, L2(각성 44칸) | B10, K-6 |
| P-18 | `src/ui/art/portraits.webp`(`artPortrait`): 결 6표정, 보스 15종 × 평상·광폭화 | `k-hero.js` · `PN.heroKit.portrait` · 2.1. 보스는 `PN.bossesA`·`PN.bossesB`·`PN.bossesC`·`PN.fieldBosses`의 `draw`를 굽기 recipe `bossPortrait`가 원형 테·망점 비네트(`PN.halftone`)·광폭화 산호 점선 테로 자른다 | `HERO_EXPRESSIONS`, `BOSS_PORTRAITS` | 결 K0, 라운드 보스 K3, 중간 보스 K1, 필드 보스 K2(초상 `detail: 'art'`은 검수 권고안으로 구웠다) | abd7a1d, 48d3396, 47ed5ef, b32c620, 90388ba, a11f3db, f2f1a94 | T1 · L1 | A1, K-1, K-7 |
| P-19 | `src/ui/art/character-portraits.webp`(키 지정): 7명 × 6표정 | `k-characters.js` · `PN.characters.portrait` · 1.0 | `CHARACTER_PORTRAITS` | P-14와 같다 | 12769a6 | T1 · L1 | A1, K-1 |
| P-20 | `src/ui/art/pickups.webp`(`artPickup`): 경험치·엽전·자석·약첩 | `k-icons.js` · `PN.icons.pickup` · API rev 2 | `PICKUP_ART` | R0 킷 rev 2 [확인] | abd7a1d | T1 · L1 | — |
| P-21 | `src/ui/art/keyart.webp`(`artKeyart`): 결 전신 3/4, 0.9배 | `k-hero.js` · `PN.heroKit.full('threeQuarter')` · 2.1 | `UI_SHEETS.keyart` | `K0-hero-faces.md` 검수 2차 합격(2026-10-02) | ed17906, b32c620 | T1 · L1 | A1, K-1 |
| P-22 | `src/ui/art/chapter-thumbs.webp`(`artChapter`): 장 5개의 랜드마크 비네트 | `k-env.js` · `PN.env.landmark` · API rev 3.1 | `UI_SHEETS.chapters`, `MENU_CHAPTERS` | `K5-env-enemies.md` 검수 2차 합격(그림 속 글자 정리). 그 밖은 R0 킷 [확인] | ed17906, d1072ce | T1 · L1 | B11 |
| P-23 | `src/ui/art/enemy-icons.webp`(`artEnemy`): 5장 × 4역할, game LOD | `k-enemies.js` · `PN.enemies.draw` · API v2.1 | `UI_SHEETS.enemies` | P-3과 같다 | ed17906, 0fbbfc1 | T1 · L1 | A3 |
| P-24 | `src/ui/art/terrain-icons.webp`(`artTerrain`): 도감 위험지형 9종 | 7종은 `k-hazards.js` · `PN.hazards.icon(kind)` · 1.0-d2r2(API-hazards §16: 판정 원과 게임이 굽는 조각). warning·vortex는 `k-env.js` · `PN.env.hazard(kind, 'static')`(R0 원판) | `UI_SHEETS.terrain`(recipe `terrainIcon`·`hazard`), `TERRAIN_KINDS` | `P2-kit-fixes.md` 검수 합격(2026-10-26). warning·vortex는 R0 킷 rev 2 [확인] | ae0a27d | T1 · L1 | K-2(warning·vortex) |

### 2.3 이야기 패널 (`node scripts/build-ui-art.mjs story`, 사양 `art/ui-art-spec.mjs` `STORY_PANELS`)

모두 `public/assets/packs/story/<id>.webp`(1200×675)이고 이야기 장면이 나올 때만 읽는다.

| # | 묶음 (파일) | 생성기 (모듈 · 이름공간 · 판) | 사양 항목 | 받아들인 기록 | 굽기 커밋 | 도구 · 권리 | 남은 클린업 |
|---|---|---|---|---|---|---|---|
| P-25 | 손그림 자리 6장(D-15 (b)): `prologue-1`~`prologue-4`, `ending-2`, `ending-4` | `k-story.js` · `PN.story.panel` · 1.0(3차 수정분), 종이결 `grain` | `STORY_PANELS`의 `kit: 'story'` | `K6-story.md` 검수 3차 합격(2026-10-16). 1차 납품서는 2026-10-27에 되살렸다 | 109e69f | T1 · L1 | C13, K-1(P3·P4·E2·E4의 결 머리는 `head34`) |
| P-26 | 합성 14장: `intro-2`~`intro-5`, `outro-1`~`outro-5`, `ending-1`, `ending-3`, `ending-5`, `ending-6`, `ending-7` | 킷 조합: `PN.env.landmark`(rev 3.1), `PN.heroKit.full`(2.1), `PN.enemies.draw` art LOD(v2.1), 지배자는 `PN.bossesA`·`PN.bossesB`의 쓰러짐 1번 장. 여기에 굽기 스크립트 `renderPanel`이 직접 그리는 공백(난류 필터로 찢은 종이), 여백 두 줄, 꿰맴, 먹 방울(메인 세션 코드)을 얹는다 | `STORY_PANELS`의 장면 | 부품은 K0·K3·K5에서 받아들인 판이다(지배자 쓰러짐 장은 K3-2 검수 1차 §7 권고). 구도에 대한 art-director 검수 기록은 없고, 2026-10-23 점검이 구도 문제를 지적했다(K-9) [확인] | 3171af0, b32c620, f2f1a94, d1072ce, 0fbbfc1, 603fb96 | T1 · L1 | K-9, C13, A1·K-1(`ending-3`·`ending-5`의 정면 머리) |

### 2.4 앱 표지

| # | 묶음 (파일) | 생성기 | 사양 항목 | 받아들인 기록 | 굽기 커밋 | 도구 · 권리 | 남은 클린업 |
|---|---|---|---|---|---|---|---|
| P-27 | 앱 아이콘 `build/icon.png`(1024²). 패키지 때 `scripts/create-macos-icon.mjs`가 이것을 줄여 `build/icon.icns`를 만든다(저장소에 없다) | 킷이 아니다. `scripts/generate-icon.swift`(`npm run build:icon`)의 CoreGraphics 코드: 먹 테 둥근 판, 종이 판, 옅은 격자, 먹 획 셋, 붉은 낙관(안에 종이색 획 셋) | — | 기록 없음 [확인] | c6ca8e7(2026-07-14, 0.1.0 시기, git 작성자 'Codex') | T2 · L3 | 낙관 안의 획 셋이 글자로 읽히는지 본다(§15 ⑤) [확인] |
| P-28 | 파비콘 `public/favicon.png`(64px, `index.html`) | `build/icon.png`를 macOS `sips`로 줄인 것 | — | P-27과 같다 [확인] | 8d54a8e(2026-10-03) | T2 · L3 | P-27과 같다 |

### 2.5 이 표 밖 (참고)

- **렌더러가 코드로 그리는 그림**: 텔레그래프, 판정 링, 체력바, 팩이 없을 때의 실루엣과 벡터 지형, 메뉴 스테이지 지도의 길(`src/ui/screens/MenuScreen.tsx`의 인라인 SVG)은 파일로 굽지 않는다. 메인 세션 코드(`src/game/render/`, `src/ui/`)이고 킷의 참고 함수(텔레그래프·zone 등)를 따른다. 출처는 그 코드의 커밋이 기록한다.
- **설명서 스크린숏**: `game-manual.html`의 `artifacts/manual-*.png`는 빌드 화면 캡처라 위 줄의 출처를 따른다. 앱 패키지에는 들어가지 않는다(`package.json` `build.files`).
- **굽지 않는 킷**: B8 얼굴 초안(`k-face-drafts.js`, git에 없음), 굽지 않는 참고 함수(텔레그래프·fx·zone·damageNumber·lane·draw), 분신 `fill` 비교안, 장애물 카탈로그에 없는 소품.
- **소리와 음악**: 이 기록 밖이다(`art/audio/`, `docs/decisions/AUD-05-loudness.md`).

## 3. 남은 [확인]

| # | 무엇 | 걸린 줄 | 닫는 법 |
|---|---|---|---|
| 1 | AI 서비스(Claude Code) 출력의 상용 이용 조건 | 킷 그림 전부(L1) | 약관을 확인하고 L1 칸에 결과와 날짜를 적는다 |
| 2 | 각성 낙관 '覺'의 시스템 글꼴 글리프 61칸 | P-15, P-17(L2) | 사용자 결정(2026-10-26): 킷이 글꼴을 보지 않고 붓획으로 새로 쓴다(`P2-kit-fixes.md`). 그 낙관으로 61칸을 다시 구우면 닫는다(K-6) |
| 3 | 앱 아이콘 코드의 작성 도구('Codex')와 약관, 낙관 획이 글자로 읽히는지 | P-27, P-28(L3) | 작성 경위를 확인한다. 글자로 읽히면 획을 바꾼다 |
| 4 | R0 킷 판에는 납품·검수 파일이 없다. 판정은 API 문서(`API-icons.md` 'Bible delta', 각 API의 rev 기록)에만 있다 | P-2, P-4, P-15, P-16, P-20, P-24, 그리고 P-1·P-3·P-9·P-22의 R0 부분 | API 문서의 판정을 받아들인 기록으로 볼지 팀이 정하거나, art-director가 지금 판을 한 번 검수하고 그 판정을 납품 기록으로 남긴다 |
| 5 | ~~빠진 납품 기록~~ 닫음(2026-10-27): K8 1·2차 납품서와 검수 1·2차, K9 1차 납품서·검수 1·2차·1차 수정 두 회차, K6 1차 납품서를 서브에이전트 보고 원문에서 되살렸다. 각 절에 출처가 있다. K8의 따로 쓴 최종 판정은 원래 없다(P-14) | P-11, P-14, P-17, P-19, P-25 | — |
| 6 | 합성 이야기 패널 14장의 구도 검수 기록 없음 | P-26 | 구도를 고친 뒤(K-9) art-director 검수를 받는다 |
| 7 | 에이전트 모델의 정확한 판, 굽기마다 쓴 Chromium 빌드 | 공통(제작자, T1) | 다음 굽기부터 굽기 커밋 메시지에 Playwright·Chromium 판을 적는다. 지난 굽기는 아는 만큼 적는다 |
| 8 | 출시 커밋에서 다시 구운 결과가 커밋된 산출물과 같은지 | 전부, 특히 P-24 | 출시 커밋의 사본에서 `npm run build:atlas`, `npm run build:ui-art`를 돌리고 그림 파일의 diff가 비어 있는지 본다 |
