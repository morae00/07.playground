# R5 외주 발주 실행서

| 항목 | 내용 |
|---|---|
| 상태 | 발주 준비 완료. R4 실행서(`docs/outsourcing/R4-orders.md`) §0의 규칙과 단계 순서를 그대로 쓴다 |
| 근거 | 2026-10-12 사용자 요청: 자폭 몹(SYS-14, 6d3901c), 무기 44종(SYS-15, e5d9464), 캐릭터 8명(CON-10, 43ecd8b). 같은 날 "모두 권장값으로": D-15 (b) 이야기 패널은 프롤로그 4장과 엔딩 핵심 2장만 손그림 |
| 지금 그림 | 자폭 몹은 그 장의 추적자(stalker) 그림에 표식만 얹는다. 무기 44종은 비슷한 기존 스킬(look)의 그림과 타일에 두 글자 배지를 단다. 캐릭터 7명은 주인공 '결'의 그림을 그대로 쓴다. 게임 동작은 모두 끝났고 그림만 기다린다 |
| 담당 | `art-director`(지시서·검수), `kit-artist`(킷 모듈만), `sound-designer`(소리) |
| 진행 | 1단계 끝(2026-10-12): B1 7e491cc, B2 66853ec, B4 a052a87, B3 8a81f57. 2026-10-14 사용자 "권장대로 진행해줘": 지시서의 열린 질문은 모두 권장안(아래 '결정'), 2단계 시작 |

**시작하는 법:** 새 Claude Code 세션에서 "docs/outsourcing/R5-orders.md 순서대로 외주를 진행해줘"라고 요청한다.

## 결정 (2026-10-14)

사용자가 지시서 네 벌의 열린 질문에 "권장대로 진행해줘"라고 답했다. 권장안이 따로 없던 두 질문(B1 Q4·Q6)은 범위를 늘리지 않는 쪽으로 정했다.

| 지시서 | 결정 |
|---|---|
| B1 자폭 몹 (§11) | Q1 스타일 바이블에 올린다(§8.1 역할 표, §10.1 렌더러 표식, §14 시험 재료; 반영 때 메인 세션이 고친다). Q2 해체 그림, Q3 터진 자리 얼룩은 다음 차수. Q4 도감에는 이번에 넣지 않는다. Q5 화면에 이름을 낼 때 문자열 표와 용어집을 거친다. Q6 즉시형의 덤벼드는 자세는 더하지 않는다(겹 고리와 몸이 예고). Q7 렌더러 제안 R1~R4는 반영 때 메인 세션이 판단한다: R1(심지 끝 불꽃)·R4(터짐 프레임)는 30b43d7에 넣었고, R2(고리 밑 먹 샌드위치·땅 타원)·R3(폭발 범위 원의 3단계 문법)는 하지 않는다(2026-10-15 사용자: "경로 등 지시선, 구분선은 현행 괜찮음") |
| B2 캐릭터 (§12) | Q1 death는 지금처럼 hurt로 대신한다. Q2 각자 원고 세계의 다른 직업이고 '베낀 선'이라 남았다. Q3 성별·나이 제안 승인(남: 단·서리·독·휘, 여: 노을·령·월, 결은 중성). Q4 노을의 고깔은 §6.2의 안전 조건으로 쓴다. Q5 서리의 정자관은 양식화로 허용. Q6 캐릭터별 팩. Q7 메뉴 키아트는 결로 고정. Q8 휘의 방어는 넓고 낮은 자세와 두꺼운 장삼으로 |
| B3 무기 아이콘 (§9) | Q1 무기 타일은 기존 시트와 따로 둔다. Q2 투사체 없는 22종의 전장 효과, Q3 lob 비행 그림은 다음 발주(K10). Q4 각성 타일의 覺 낙관은 기존 문법대로 둔다. Q5 이름은 그대로, 그림이 상징을 피한다. Q6 도감에 무기는 1.0 뒤로. Q7 20px 전용판은 T3 결과를 본 뒤 정한다 |
| B4 이야기 패널 (§11) | Q1 엔딩은 ending-2와 ending-4. Q2 흑립은 P1·P2 못걸이(뒷모습만) → P3부터 씀 → P4 눌러씀 → E4 올림. Q3 스승은 노년 필경사, 탕건과 도포, 얼굴은 끝내 보이지 않고 성별은 정하지 않는다. Q4 흉터는 가까운 뺨이 보이는 패널마다. Q5 먹귀는 지워진 선에서만 생긴다. Q6 엔딩의 화풍 섞임은 반영 때 이음을 줄이고, 플레이테스트에서 튀면 K6b로 추가 발주한다. Q7 이야기 패널을 바이블 §3 '키아트' 줄과 §6-8 종이결 예외에 적는다. Q8 정지 그림(키아트·이야기 패널)은 코트 망점 허용, 스프라이트와 움직이는 그림만 금지로 문구를 정리한다. Q9 해상도는 이번에 그대로. Q10 출처 기록은 `docs/art/pipeline.md` |
| B6 위험지형 (§11, 2026-10-16 추가) | Q1~Q13 모두 권고안. 불 테는 먹 + 산호(해칭 없음), 그림이 있을 때는 가운데 기호를 빼고 바닥 그림으로 구분, null 산호 링은 끈다, 불 위 적은 발밑 불길만(몸 물듦 없음), 주인공은 곱하기 산호 물듦, 수명 페이드 대신 끝 상태 그림, 꺼진 불 그을음 1.5초, 0.5초마다 불 피해 숫자(리마스터 규칙만). FX-03(fb4ece9)의 불 위 몸 그림을 바꾸는 법은 지시서 §12 |
| B7 무기 전장 효과 (§11, 2026-10-16 추가) | Q1~Q13 모두 권고안: 새 `arsenal-fx` 팩, 그림 전용 엔진 필드, 적에게 건 침묵은 아군 소속(자수정 금지), 불먹 안 적은 먹 불길(청록 심), 무기 감속 표시와 P3 기믹 그림은 하지 않음, 무기별 소리는 sound-designer 따로. 지금 렌더러의 위반 셋(밝은 땅 조각, 자수정 침묵 표식, 불먹의 산호 물듦)은 메인 세션이 먼저 고친다(지시서 §12) |

## 1단계 — 작업 지시서 (`art-director`, 서로 기다리지 않음)

공통 머리말: "작업 지시서 요청. `.claude/agents/CONTEXT.md`, 스타일 바이블, 아래 게임 쪽 정의를 읽고 네 정의의 지시서 형식으로 돌려라. 파일은 고치지 마라."

| # | 지시서 저장 경로 | 무엇을 | 게임 쪽 정의 |
|---|---|---|---|
| B1 | `docs/art/briefs/bombers.md` | 자폭 몹 2종 × 5장: 심지형(닿으면 멈춰 심지가 타는 자세)과 즉시형(빠르게 달려드는 자세). 이동 프레임, 심은 자세, 터지는 순간 1장. 멀리서도 일반 추적자와 구별되는 실루엣(심지·도화선·몸통의 터질 듯한 형태). 표식(호박색 점선 고리·불꽃, 겹 적색 고리)은 렌더러가 따로 그리므로 그림에 넣지 않는다 | `src/content/data/bombers.ts`, `docs/ARCHITECTURE.md` "Bombers (SYS-14)" |
| B2 | `docs/art/briefs/characters.md` | 캐릭터 7명(단·노을·서리·독·휘·령·월)의 게임 스프라이트(주인공과 같은 상태·프레임: idle·move·hurt·throw·death)와 초상(HUD·메뉴 카드). 시작 무기와 성격이 실루엣에 드러나게(예: 독은 먹단지 짐, 휘는 큰 붓). 얼굴은 R4 얼굴 리뷰 처방대로 한 시점에서 | `src/content/data/characters.ts`, 이름·칭호·한 줄 소개는 `public/assets/content/strings/ko.json`의 `character.*` |
| B3 | `docs/art/briefs/arsenal-icons.md` | 무기 44종 타일(평상·각성 88칸)과, 투사체가 있는 무기의 탄 모양. 같은 look을 쓰는 무기끼리 한눈에 구별되게(무기 이름 두 글자 배지는 그림이 들어오면 뗀다) | `src/content/data/arsenal.ts`(kind·look·효과), 이름·요약은 `skill.<id>`·`skill.<id>.summary` |
| B4 | `docs/art/briefs/story-panels.md` | D-15 (b): 프롤로그 4장과 엔딩 핵심 2장, 1200×675, 글자 없음. 에이전트 그림은 스타일 바이블 §15에 따라 여전히 잠정 아트다 | `public/assets/content/story.json`, 로어 바이블 §7, R4 실행서 6단계 |
| B6 | `docs/art/briefs/terrain-hazards.md` | 2026-10-15 사용자 요청 "불타는 지형은 실제 불 그림으로, 그 위 캐릭터는 피해를 입는 느낌으로"(경로 지시선·구분선은 그대로). 적·맵이 만드는 지형 7종(fire, shock, slow, water, root, trap, null)의 바닥 그림과 불 위 주인공·적 오버레이 | `src/game/engine/worldTypes.ts`(Hazard), `GameEngine.ts` 지형 효과·생성, `encounterGrammars.ts` |
| B7 | `docs/art/briefs/arsenal-fx.md` | 2026-10-15 사용자 요청 "같은 계열 무기가 구분이 안 됨, 각성 기믹이 더 특별했으면". 투사체 없는 22종의 전장 효과(평상·각성), lob 비행 4종, SYS-16 각성 기믹 44종의 전장 그림(우선순위 P1·P2) | `src/content/data/arsenal.ts`, `src/content/data/awakenings.ts`, `docs/decisions/SYS-16-awakening-gimmicks.md`, `GameEngine.ts` 무기·기믹 함수 |

## 2단계 — 제작 (`kit-artist`, 모듈마다 한 작업자)

| # | 맡을 파일 | 지시서 | 납품서 |
|---|---|---|---|
| K6 | `art/concept-kit/k-story.js`, `API-story.md` (새 모듈) | B4 | `docs/art/deliveries/K6-story.md` |
| K7 | `art/concept-kit/k-bombers.js`, `API-bombers.md` (새 모듈) | B1 | `docs/art/deliveries/K7-bombers.md` |
| K8 | `art/concept-kit/k-characters.js`, `API-characters.md` (새 모듈) | B2 | `docs/art/deliveries/K8-characters.md` |
| K9 | `art/concept-kit/k-icons2.js`, `API-icons2.md` (새 모듈) | B3 | `docs/art/deliveries/K9-arsenal-icons.md` |
| K11 | `art/concept-kit/k-hazards.js`, `API-hazards.md` (새 모듈) | B6 | `docs/art/deliveries/K11-hazards.md` |
| K10 | `art/concept-kit/k-arsenal-fx.js`, `API-arsenal-fx.md` (새 모듈) | B7 | `docs/art/deliveries/K10-arsenal-fx.md` |

권장 순서: K7·K8 먼저(플레이 중 가장 자주 보인다), 그 다음 K9, K6. 무거운 에이전트는 동시에 3개 이하.

## 3단계 — 검수 (`art-director`)

R4 실행서 3단계와 같다. 판정은 납품서 끝에 "검수 N차"로 붙이고, 수정은 2회까지.

## 4단계 — 반영 (메인 세션)

| 모듈 | 등록 | 렌더·UI | 커밋 항목 |
|---|---|---|---|
| K7 | `art/atlas-spec.mjs`에 장마다 `enemy/<ch>/bomber-fuse`, `bomber-burst` 슬롯; `slots.ts`의 적 슬롯 선택이 `enemy.bomber`를 본다 | `worldRenderer.enemySprite`가 폭탄병 슬롯을 고른다. 표식은 그대로 둔다 | ART-11 (SYS-14) |
| K8 | 공통 팩에 `hero/<id>/…` 슬롯, `art/ui-art-spec.mjs`에 초상 | 렌더러가 고른 캐릭터의 슬롯으로 주인공을 그린다(`RenderWorld`에 캐릭터 id), 메뉴 카드·HUD 초상 | ART-12 (CON-10) |
| K9 | `art/ui-art-spec.mjs`의 스킬 타일 시트에 44종 | `scripts/build-arsenal-art.mjs`의 별칭·배지를 걷어 낸다. 탄 모양은 `SKILL_SHOTS`와 VFX 그룹에 | FX-08 (SYS-15) |
| K6 | `art/ui-art-spec.mjs`의 `STORY_PANELS`를 새 모듈로 | `node scripts/build-ui-art.mjs story` | CON-06 (D-15) |
| K11 | 새 `hazards` 팩(`art/atlas-spec.mjs` PACKS, `build-atlas.mjs` KIT_FILES) | 새 `hazardArt.ts`(HazardPainter), `drawHazards`·주인공·적 오버레이, 팩 없으면 지금 벡터 그림. 지시서 §9·§12 | ART-06 (FX-03) |
| K10 | 새 `arsenal-fx` 팩(skills 팩과 함께 읽음) | 무기 자신의 그룹을 고르는 렌더러, lob 비행, `RenderWorld.zones`·`Entity.awk` 그림, 그림 전용 엔진 필드. 지시서 §9 | FX-08 (SYS-15, SYS-16) |

확인: `npm test`, `npm run build`(설치 에셋 예산), `npm run test:visual`, `npm run test:perf`(적 400마리 장면).

## 5단계 — 소리 (`sound-designer`)

- S4: "점검 요청: `art/sfx-spec.mjs` 끝의 `bomber.fuse`·`bomber.blast` 레시피(SYS-14)를 들어 보고, 심지가 1.15초 동안 타오르다 터진다는 것이 들리는지, 폭발이 효과음 흐름(`docs/decisions/AUD-05-loudness.md` §5) 위로 지나치게 튀지 않는지 판정하고 고칠 레시피를 제안해라." 승인된 수정만 반영한다(새 레시피는 끝에, 기존 `variants` 수는 그대로).
