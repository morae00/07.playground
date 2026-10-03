# K4 납품서 — 스킬 VFX 17종 + 각성 (`PN.skillVfx`)

> 메인 세션 메모(2026-10-03): K4 발주(`docs/outsourcing/R4-orders.md` 2단계)의 kit-artist 응답을 그대로 저장했다. 새 파일은 `art/concept-kit/k-skills-vfx.js`, `art/concept-kit/API-skills-vfx.md` 두 개다. 검수(3단계) 결과는 이 파일 끝에 "검수 N차" 절로 덧붙인다.

작성: kit-artist, 2026-10-03 · 지시서 `docs/art/briefs/skill-vfx.md`

요약: 17종의 굽는 조각 188장, 매개 도형 SPEC, `draw`·`hit` 참고 그림을 납품합니다. `--check`는 실행한 렌더 전부 ok, C6 감사 0건, C7 범위 밖 0건, C9은 §2와 숫자가 같습니다. 지시서와 다르게 한 곳이 9개 있고, 가장 큰 세 가지는 이렇습니다.
- 바느질 점선 값: [4.5, 7.5]로 그렸습니다. `allyZone` 값 [8, 5]로는 땀 사이 바닥이 0이 됩니다.
- 분신 박스: 112×100 / 앵커 (56, 79)로 키웠습니다.
- 분신 바느질: 필터 대신 상태별 벡터 감싼 선으로 그렸습니다.

모두 §4에 이유와 함께 적었습니다. 맡은 두 파일 밖은 고치지 않았고, 아무것도 내려받지 않았습니다. 작업 중 다른 모듈(k-bosses1/2)에서 "kit error"는 한 번도 나지 않았습니다.

## 1. 납품 목록

| 파일 | 내용 |
|---|---|
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-skills-vfx.js` (새 파일, 1,509줄) | `window.PN.skillVfx` v1.0. 모든 선언이 IIFE 안에 있고, id는 호출마다 `ksv<N>_`, 루트는 `<g class="ksv ksv-<id>">` + 자기 `<defs>`. 결정적(`Math.random`·`Date` 0) |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-skills-vfx.md` (새 파일) | 로드·좌표·회전, 공개 API, META, parts 전체 표, 조각 그림 요약, SPEC 렌더러 규칙, 렌더러 연결표, 감소 모션/LOD, 신호색, 다르게 한 것, 사람 원화 메모 |

공개 API(`k-skills-vfx.js:1494-1507`):
- 데이터: `version`, `K`(11토큰), `ids`(17, worldTypes 순서), `groups`(+`common`), `META`(:192-210), `SIZES`(:144-163), `SPEC`(:166-190)
- `jit(seed, i)`(추가)
- `parts(group)` → `{part, frames, drive, fps, window, box, anchor, rotate, layer, lod, still, flash}`. `flash`는 추가 필드로, 흑선 `flash*` 조각이 섬광 감소 대상이라는 표시다.
- `stamp(group, part, {frame})`
- `draw(id, stage, opts)` / `hit(id, stage, opts)`
  - opts: `level, awakened, frame, progress, t, radius, width, length, points, reduced, lod`
  - 추가 opts `copy`: 흑선 레일의 ±42 복제 레일(`spearCopy`)을 함께 그린다.

조각은 188장이다(바늘 14, 단검 14, 연쇄 3, 백묵 14, 흑선 9, 궤도 4, 박격 16, 분신 33, 무음 지뢰 16, 검은 태양 16, 일식 10, 철골 5, 자석 2, 갑주 7, 회복 실 8, 동전 7, 집행 8, 공용 2). 박스 넓이 합은 **845,856 단위²**다(C7, 한도 900,000).

## 2. API 요약

### 2.1 단위·좌표
- 월드 단위(1440×900, 줌 1.0의 1x px)이고 `scale: 1`, @2x로 굽는다. 앵커가 시뮬 좌표에 놓인다.
- 원과 띠는 참 원이다. 발밑 표식만 ry = 0.42·rx 타원이다.
- 회전 값은 `vel, beam, radial, tangent, ray, face, none`(지시서 §1.2 그대로)이고, 바늘 파편은 `beam`(x1,y1 = 맞은 적 → x2,y2 = 파편 대상)이다.
- 층은 `ground/body/ally`, lod는 `info/deco`다.

### 2.2 META (cell · origin · main)

| id | 평상 단계 | 각성 단계 | main | cell | origin | draw 원점 |
|---|---|---|---|---|---|---|
| needleStorm | start, travel, end | +shard | travel | 184×196 | 28,98 | 주인공 발 |
| fanKnives | start, travel, end | start, travel, return, end | travel | 160×268 | 14,134 | 주인공 발 |
| chainSpark | start, hold, end | +burst | hold | 904×172 | 10,118 | 주인공 발 |
| frostLine | start, hold, end, chill | start, hold, end, root | hold | 728×92 | 44,46 | 빔 시작 |
| railSpear | start, hold, end | +fissure | hold | 744×136 | 52,68 | 빔 시작 |
| orbitScythes | hold | hold | hold | 396×396 | 198,198 | 주인공 발 |
| boneMortar | warn, blast | warn, blast | warn | 408×408 | 204,204 | 착탄점 |
| mirrorClone | volley, travel | volley, travel | travel | 196×176 | 52,120 | 주인공 발 |
| voidMine | start, hold, end | start, hold, collapse | hold | 436×436 | 218,218 | 장판 중심 |
| blackSun | start, hold, end | start, hold, collapse | hold | 536×536 | 268,268 | 장판 중심 |
| eclipseStep | slash | slash, afterimage | slash | 556×556 | 278,278 | 주인공 발 |
| ironFrame | pop, aura | pop, shield | shield | 88×128 | 44,114 | 주인공 발(팝 (0,−68)) |
| magnetSigil | pop, aura | pop, pulse | pulse | 324×324 | 162,162 | 주인공 발 |
| paperWard | pop, plates | +ward | ward | 312×312 | 156,156 | 주인공 발 |
| recoveryThread | pop, aura | pop, volley | volley | 180×184 | 90,108 | 주인공 발 |
| coinFever | pop, glint | +frenzy | frenzy | 100×124 | 50,110 | 주인공 발 |
| executionMark | pop, mark | +markBoss | mark | 116×116 | 26,106 | 주인공 발(표식 (64,−30)) |

### 2.3 parts 전체 표 (`k-skills-vfx.js:216-335`)
still은 loop 조각만 0이고 나머지는 null이다. fps는 loop만 값이 있다.

| group / part | 장 | drive | fps | box | anchor | rotate | layer | lod | still |
|---|---|---|---|---|---|---|---|---|---|
| needleStorm / start · travel · end | 2·2·2 | prog / loop / prog | 0/12/0 | 64×20 | 46,10 | vel | ally | info | –/0/– |
| needleStorm / start·travel·end-awakened | 2·2·2 | 같음 | 0/12/0 | 64×24 | 46,12 | vel | ally | info | –/0/– |
| needleStorm / shard-awakened | 2 | prog | 0 | 48×14 | 4,7 | beam | ally | deco | – |
| fanKnives / start · travel · end | 2·2·2 | prog / loop / prog | 0/12/0 | 44×16 | 28,8 | vel | ally | info | –/0/– |
| fanKnives / start·travel·end-awakened | 2·2·2 | 같음 | 0/12/0 | 44×16 | 28,8 | vel | ally | info | –/0/– |
| fanKnives / return-awakened | 2 | loop | 12 | 44×16 | 28,8 | vel | ally | info | 0 |
| chainSpark / burst-awakened | 3 | prog | 0 | 64×64 | 32,32 | none | ally | deco | – |
| frostLine / origin, origin-awakened | 2·2 | prog | 0 | 48×48 | 24,24 | beam | ally | deco | – |
| frostLine / chill12·19·28·38·54 | 1씩 | idx | 0 | 36×24·50×28·68×36·88×44·120×58 | 박스 중심 | none | ground | deco | – |
| frostLine / root12…54-awakened | 1씩 | idx | 0 | 같음 | 박스 중심 | none | ground | info | – |
| railSpear / origin, origin-awakened | 2·2 | prog | 0 | 64×64 | 32,32 | beam | ally | deco | – |
| railSpear / flash, flash-awakened (flash: true) | 1·1 | prog | 0 | 64×64 | 32,32 | beam | ally | deco | – |
| railSpear / fissure-awakened | 3 | prog | 0 | 72×72 | 36,36 | none | ground | deco | – |
| orbitScythes / blade, blade-outer-awakened | 2·2 | loop | 8 | 44×44 | 22,22 | radial | ally | info | 0 |
| boneMortar / shell, shell-awakened | 4·4 | prog | 0 | 40×176 | 20,166 | none | ally | deco | – |
| boneMortar / blast, blast-awakened | 3·3 | prog | 0 | 96×96 | 48,48 | none | ally | deco | – |
| boneMortar / dust | 2 | idx | 0 | 24×16 | 12,8 | radial | ally | deco | – |
| mirrorClone / clone-idle 6·run 8·throw 4·hurt 3 | 21 | idx | 0 | **112×100** | **56,79** | face | body | info | – |
| mirrorClone / shot-start·travel·end | 2·2·2 | prog / loop / prog | 0/12/0 | 52×16 | 38,8 | vel | ally | info | –/0/– |
| mirrorClone / shot-*-awakened | 2·2·2 | 같음 | 0/12/0 | 52×16 | 38,8 | vel | ally | info | –/0/– |
| voidMine / core-start 3·core-hold 2·core-end 3 | 8 | prog / loop / prog | 0/6/0 | 64×48 | 32,24 | none | ground | info | –/0/– |
| voidMine / core-start-awakened 3·core-hold-awakened 2 | 5 | prog / loop | 0/6 | 64×48 | 32,24 | none | ground | info | –/0 |
| voidMine / collapse-awakened | 3 | prog | 0 | 96×96 | 48,48 | none | ally | info | – |
| blackSun / core-start 3·hold 2·end 3 | 8 | prog / loop / prog | 0/6/0 | 96×96 | 48,48 | none | ground | info | –/0/– |
| blackSun / core-start-awakened 3·hold-awakened 2 | 5 | prog / loop | 0/6 | 112×112 | 56,56 | none | ground | info | –/0 |
| blackSun / collapse-awakened | 3 | prog | 0 | 120×120 | 60,60 | none | ally | info | – |
| eclipseStep / slash, slash-awakened | 2·2 | prog | 0 | 128×24 | 124,12 | ray | ally | deco | – |
| eclipseStep / feet, feet-awakened | 3·3 | prog | 0 | 72×32 | 36,16 | none | ground | info | – |
| 패시브 6종 / pop, pop-awakened | 1·1 | idx | 0 | 36×38 | 18,35 | none | ally | info | – |
| ironFrame / shield | 3 | prog | 0 | 72×100 | 36,88 | none | body | info | – |
| paperWard / plates | 3 | prog | 0 | 80×100 | 40,88 | none | body | info | – |
| paperWard / plate-awakened | 2 | idx | 0 | 20×14 | 10,7 | radial | ally | deco | – |
| recoveryThread / shot-start·travel·end-awakened | 2·2·2 | prog / loop / prog | 0/12/0 | 36×14 | 26,7 | vel | ally | info | –/0/– |
| coinFever / glint | 2 | prog | 0 | 24×24 | 12,12 | none | ally | deco | – |
| coinFever / frenzy-awakened | 3 | loop | 8 | 84×40 | 42,30 | none | ground | info | 0 |
| executionMark / mark | 3 | prog | 0 | 32×32 | 16,29 | none | ally | info | – |
| executionMark / markBoss-awakened | 3 | prog | 0 | 44×44 | 22,41 | none | ally | info | – |
| common / stitchHead | 2 | loop | 12 | 28×12 | 16,6 | tangent | ally | deco | 0 |

각 조각의 `window`(구간 설명)는 `parts()` 출력과 API 문서 §5에 있다.

### 2.4 SPEC 전체 값 (`k-skills-vfx.js:166-190`)

| 키 | 값 |
|---|---|
| stitch | layers [ink 5, ally 2.8, allyG 0.8], **dash [4.5, 7.5]**, cap round, fit 1, start −90, dir cw. fit은 n = max(3, round(2πR/12))이고 dash에 2πR/(12n)를 곱한다 |
| guide | [allyD 1.2], α 0.55 |
| fill | p50 α 0.25 |
| dots | ally r 1.5, pitch 6, angle 45. alphaWarn 0.6(박격 원 전체), alphaVortex 1(띠), band [34, 0.25] → 띠 폭 min(34, 0.25R) |
| thread | [ink 4, ally 2.2, allyG 0.7], 0.24초, fade 0.6 |
| threadHeavy | [ink 5, ally 2.8, allyG 0.8], 시간은 thread와 같음 |
| band | 백묵: edge [ink 1.2], inner [p50 0.8, w − 1.4]. 흑선: edge [ink 1.4] |
| chalk | edge [3.5, 2], step 12, fill p50, line [ink 0.8], core [ally 2.2], grow 0.25 |
| chalk.dust | every 14, r [0.8, 1.6], p50 + [ink 0.4], inset 3 |
| spear | ink, half [6, 4], grain [p50 0.9, y −3], core [ally 2.4, allyG 0.8], head 18(오목한 잎), headHalf 6.5, grow 0.25, fade {ink 3, [6, 4]} |
| spearCopy | offset 42, edge [ink300 1.2] [5, 3], shaft {p50 α 0.5, [ink300 0.9]}, core [ink 2.6, ally 1.6] [6, 4], pad 0.6 |
| bolt | [ink 6, ally 3, p50 1.2], 각성 [ink 7, ally 3.6, p50 1.4], miter 10, cap round, seg 30, push [3, 3], seeds [11, 12], start 0.28, end 0.35, fade {ink, [6, 4]} |
| tether | [ink 3, ally 1.6], [6, 4], pad 0.6, sag 0.06 |
| swirl.voidMine | 팔 3, r [0.16, 0.88], 200°, 폭 [0.09, 0.015], ink α 0.5, 0.6 rad/s, turn cw |
| swirl.blackSun | 팔 4, r [0.16, 0.88], 190°, 폭 [0.1, 0.02], ink α 0.55, 0.45 rad/s, turn cw |
| unravel | 0.3초, gap ×[1, 2], α [1, 0] |
| slashRing | band [p50 5], edge [ink 1.2](R ± 2.5), outer at 4.4 [ink 3, ally 1.6], 0.2초 |
| wardRing | band [p50 4], jag [10, 2], edge [ink 1.2], outer at 4.6 [ink 2.6, ally 1.6] [6, 4] pad 0.6, 0.24초 |
| wardRing.plates | 6장, 20 → 140, 0.2초 |
| pulse | [allyD 1.2, allyG 0.5], r [24, 150], 0.45초, ease 2(1 − (1 − u)²), α [0.6, 0], delay 0.08, reducedR 60 |
| orbitTrail | 0.35 rad, [p50 1, ally 0.8], α [0.6, 0] |
| aura | stitchR 30, 0.3초, centerY −32 |
| jit | mul 31, hash 2654435761, mod 1000 |

- `stitch`의 점선 값은 `allyZone` 값을 그대로 쓰지 않았다(§4-1).
- 청록이 든 butt 점선은 먹 층 대시를 [d + 2pad, g − 2pad], offset = pad로 그린다. 보이는 대시는 지시서 값이고, 먹이 대시 양 끝을 받친다.

### 2.5 게임 표시 크기와 앵커
투사체·낫·장판 중심·폭발·표식은 위 박스 그대로 1:1이다(월드 단위 = 1x px).
- 분신: 주인공 스프라이트와 같은 키(64)이고, 앵커 = 발.
- 팝: 주인공 머리 꼭대기 − 4(발 −68).
- 집행 표식: 대상 몸 꼭대기 − 4.
- 일식 slash: 앵커(바깥 끝)를 R − 2에 둔다.

## 3. 검사 결과

명령은 지시서 §6의 틀을 그대로 썼다(`<id>`를 바꿔 넣고, 이름은 `k4-`). 출력 폴더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`.

| 검사 | 돌린 렌더 | 결과 |
|---|---|---|
| C1 | `k4-c1-stamps`(scale 2, 188장 + 앵커 점) | ok |
| C2 | `k4-<id>-stages` 17종(scale 1) + `k4-<id>-stages-08` 17종(scale 0.8) | 34개 모두 ok |
| C3 | `k4-<id>-hit` 17종 | 17개 모두 ok |
| C4 | `k4-<id>-scene-ch1`, `-ch1-08`(0.8), `-ch5`(#ABA5AC), `-ch1-L1`(`{level:1}`) × 17종 | 68개 모두 ok |
| C5 | `k4-c5-gray` | ok |
| C6 | `k4-c6-audit` | calls 316, text 0, blur/gradient/blend 0, image 0, non-hex colour 0, nondeterministic 0, bad colours {} |
| C7 | `k4-c7-bounds` | checked 316, **outside 0**, stamp box area **845856** |
| C8 | `k4-c8-pops`(scale 3), `k4-c8-pops-1x` | ok |
| C9 | `k4-c9-sizes` | 지시서 §2와 숫자가 하나도 다르지 않음 |
| 얼굴 | `k4-clone-face`(`--crop 26,0,60,48 --scale 8`) | ok, 주인공 머리 그대로(같은 시점, 덧그린 이목구비 없음) |
| 기타 | `k4-fusions-railcopy`, `k4-final-load` | ok |

C3 확대 확인(1px 이내):
- `k4-frostLine-hit-zoom`: 띠 가장자리 ink 1.2 한가운데에 자홍 선.
- `k4-voidMine-hit-zoom`: 땀 캡슐 중심에 자홍 선, 땀 사이 바닥 약 2.5.
- `k4-rings-hit-zoom`: slashRing·wardRing 종이 띠 중심 = R.
- `k4-orbit-hit-zoom`: 정·역 낫 모두 r 17 원 안.

직접 열어 본 PNG:
- 참고: a2d-ref-allyzone-rim, a2d-proto-clone-filter / projectiles / zones / zones2 / band-design, a2d-ref-icons, a2d-ref-hero-throw
- 확인용: k4-ref-allyzone-rim(·16), k4-ref-dash-test, k4-proto-clone, k4-dev-proj, k4-dev-beams, k4-dev-zones(·2), k4-dev-passive, k4-dev-clones, k4-dev-mix, k4-dev-clone2x(3회), k4-dev-herounion, k4-dev-envelope, k4-dbg-bbox, k4-dev-passive-draws, k4-fusions, k4-fusions-railcopy
- 공식:
  - C1·C5~C9: k4-c1-stamps, k4-c5-gray, k4-c6-audit, k4-c7-bounds, k4-c8-pops, k4-c8-pops-1x, k4-c9-sizes, k4-clone-face
  - C2(1배): needleStorm, fanKnives, chainSpark, frostLine, railSpear, orbitScythes, boneMortar, mirrorClone, voidMine, blackSun, eclipseStep, coinFever, paperWard
  - C2(0.8배): fanKnives
  - C3: frostLine, voidMine, eclipseStep, mirrorClone
  - C4: voidMine-ch1, blackSun-ch5(0.8), mirrorClone-ch1, needleStorm-ch1, boneMortar-ch1, orbitScythes-ch1, frostLine-ch1, eclipseStep-ch1, ironFrame-ch1, coinFever-ch1, recoveryThread-ch1, paperWard-ch5, railSpear-ch5, voidMine-L1, executionMark-L1

## 4. 지시서 대비

### 4.1 반영한 것
- **공통(§1)**
  - 색은 K 11개만 쓴다(C6).
  - 샌드위치: 청록은 늘 [ink, ally] 층 위에 있다. 예외는 §6-9의 회복 실 구슬 납작한 α 0.22 후광과 SPEC guide·pulse다.
  - 해칭·블러·종이결·헤일로 0. 망점 피치 6, 띠 폭 ≥ 18.
  - 장판 먹 면은 약 10~15%(팔 + 중심), 빔 창대는 띠 폭의 13~29%.
  - 감소 모션·minimal은 C2 4·5행에서 확인했다. loop는 still, 소용돌이 회전 0, 펄스 r 60, 연쇄 seed 고정, 갑편은 140에 바로. minimal은 deco·가루·꼬리·펄스를 뺀다.
  - `hit`는 설정과 무관하다.
- **§1.7 금지 모양**: 검토하면서 걸리는 것을 고쳤다.
  - 바늘 끝 풀림 "<" → 끝이 가늘어지는 실
  - 단검 출발 끌림 획(깃처럼 보임) → 삭제
  - 회복 실 W자 → S 한 번
  - 일식 발밑 코로나의 고른 방사 눈금(적 문법) → 끊긴 접선 호
  - 동전 폭주의 눈처럼 보이는 쌍 → 두께·구멍·높이 엇갈림
  - 동전 팝이 폭탄·눈처럼 보임 → 동전을 아래 왼쪽, 반짝임 하나를 위 오른쪽에 떼어 둠
  - 무음 지뢰 각성의 흰 점선 고리(이빨처럼 보임) → 짧은 가시 관
  - 검은 태양 코로나의 고른 삼각 가시 → 휜 긴 가닥 + 가는 가닥
  - 붕괴 장면의 해 그림문자 → 바람개비
  - 박격 폭발 구름의 O자 → 가운데 덩이
  - 거울 레일 삼각 창날 → 오목한 잎
- **§2 판정**: SIZES = §2(C9).
  - 분신 수치는 `mirrorCloneVolley` 확인 결과, 레벨 숫자 1,2,2,3,3,4가 관통 수다. 옆 사격은 늘 2발, 각성 조준 사격 +2.
  - 일식 잔상은 `Math.round(0.82R)` = 216이다.
- **§3 스킬별**: 모양·단계·시간은 API 문서 §5.1·§7에 적었다.
  - 빔 띠 반폭 = width(§9-3 기본안).
  - 아군 진행은 12시에서 시계 방향 바느질, guide는 첫 프레임부터.
  - 소용돌이 망점은 테 띠만.
  - 분신·잔상은 주인공 프레임의 ink300 선 사본.
- **§4 얼굴**: 새 얼굴 없음. 분신은 주인공 머리를 필터로 바꾼 것이라 시점이 같다.
- **§9 열린 질문**: 모두 기본안으로 했다.
  - 분신 조각은 불투명, 렌더러 α 0.8에서 시작.
  - 집행 표식 = 바늘 + 220° 바느질 반원.
  - 잔상 = 선 사본.
  - 공통 팩.
  - 투사체는 땅.
  - 팝은 머리 위.
  - 합성 6종은 기존 조각 재사용을 렌더 `k4-fusions`로 확인했다.

### 4.2 다르게 한 것 (§1.10 우선순위로 판단)
1. **stitch dash [8, 5] → [4.5, 7.5] + fit**
   - §1.5 안에서 "allyZone 값 그대로"와 "땀 사이 바닥 2.5 이상(잰 값 약 [4.5, 7.5])"가 부딪친다.
   - [8, 5] 둥근 끝(먹 5)은 직선과 큰 R에서 바닥이 0이다(`k4-ref-dash-test`). 잴 수 있는 기준 쪽을 따랐다. 층 굵기는 그대로다.
2. **분신 박스 112×96 / (56,75) → 112×100 / (56,79)**(`k-skills-vfx.js:266-271`)
   - 주인공 킷 run 2·6번 장이 발 위 74.3까지 올라가서 C7 여백 3을 지킬 수 없다.
   - 발 아래 21은 그대로다. 박스 넓이 +9,408.
3. **분신 바느질 = 상태별 벡터 감싼 선**(`:1035-1050`)
   - "실루엣을 따르거나 감싼 타원" 중 상태별(idle·run·throw·hurt) 합집합을 3.5 바깥에서 감싸는 매끈한 선으로 했다. 1.5, [5, 3], 먹 2.7 + pad 0.6.
   - 필터로 실루엣을 바로 따르는 방식은 시험했다. 바둑판 대시가 방향·해상도에 따라 이어지거나 끊기고 @2x에서 흐려져서 버렸다(`k4-dev-clone2x`).
   - 선 사본 필터의 알파 가장자리는 erode 1.1이 아니라 1.4다(외곽 1.5 안팎).
4. **청록 butt 점선의 먹 패드 0.6**: 대시 끝에서 청록이 바닥에 닿지 않게 했다. 보이는 값은 그대로다.
5. **slashRing 바깥 청록**: "바깥 ally 1.6"을 R + 4.4의 [ink 3, ally 1.6]으로 그렸다(샌드위치).
6. **바늘 shard 회전**: 새 값을 만들지 않고 `beam`으로 적었다.
7. **패시브 main**: 지시서에 없어서 정했다. shield / pulse / ward / volley / frenzy / mark.
8. **회복 실 aura**: 반지름 30 바느질을 몸 중심(발 −32)에 두었다. 발 중심이면 바닥 청록 고리 금지에 걸린다.
9. **각성 단검 end**: 귀환 중에 수명이 끝나므로 손잡이가 앞이다(날끝이 주인공을 겨누지 않게).
   - 각성 전에 관통이 다해 사라지는 단검은 평상 `end`를 쓴다.

## 5. 메인 세션이 할 일

1. **킷 로드**: `scripts/build-atlas.mjs`의 `KIT_FILES`에서 `k-hero.js` 뒤에 `k-skills-vfx.js`를 넣는다. 분신 21장이 `PN.heroKit.sprite`를 부른다. 주인공 스프라이트가 바뀌면 `skill/mirrorClone/clone-*`를 다시 구워야 한다.
2. **굽기 사양**(`art/atlas-spec.mjs`, 공통 팩)
   - 프레임: `PN.skillVfx.groups` × `parts(g)` × frames → `{ key: 'skill/<g>/<part>/<f>', call: ['PN.skillVfx.stamp', g, part, { frame: f }], box, anchor, scale: 1 }`
   - 애니메이션: `skill/<g>`: `{ [part]: { frames, fps: drive === 'loop' ? fps : 0 } }`
   - 매니페스트: `skillVfx: { spec: PN.skillVfx.SPEC, parts: { 구동·회전·층·lod·still·flash } }`
   - BOSS_SPRITES·BOSS_SLOTS·BOSS_PORTRAITS 등록은 해당 없음.
3. **렌더러**: API 문서 §7 표대로 조각 블릿 + SPEC 매개 도형을 그린다. 토큰은 `palette.ts`로 바꾼다.
   - 분신 조각은 α 0.8에서 시작해 1배 판독으로 정한다.
   - 단검 귀환 여부(`returning` 또는 나이 ≥ 0.675초)와 분신 조준 사격 여부(추적 대상 id)가 RenderWorld에 있어야 조각을 고를 수 있다.
4. **렌더 전용 데이터**(§8-5)
   - BeamEffect.skillId, ChainEffect.skillId
   - area/damage의 radius·source
   - 백묵 감속·속박을 지형과 구별할 값(그전까지 chill/root 표식은 연결하지 않음)
   - 동전 폭주 남은 시간
   - (선택) 바늘 파편 이벤트
5. **지금 렌더러에서 바뀌는 것**(§8-6)
   - 빔 굵기를 판정의 두 배 폭으로
   - 아군 착탄 예고의 방사 눈금 삭제
   - 아군 고리를 텔레그래프 아래로, 45% 확장 삭제
   - +π/2·+π 관례 폐기
   - #2a2134·#fff0ed 삭제
   - 분신 실을 `tether`로
6. **확인**: `npm run build:atlas`, `test:unit`, `build`(예산), `bench:render`(망점 패턴 장판 여럿). 지시서 §8-7·8대로 한다.

## 6. 알려진 한계 · 사람 원화가 몫 (바이블 §15)

- **사람 원화가 다시 그릴 곳**
  - 분필 가장자리, 먹 소용돌이 팔, 검은 태양 코로나, 일식 붓 획의 붓 질감(비백·번짐)
  - 필터 선 사본의 이중 윤곽(흑립 동심선, 외곽 띠)과 상태별 감싼 바느질의 땀 배치. throw 바늘 끝은 감싼 선 밖으로 나온다.
  - 28px 팝 기호의 픽셀 다듬기. 특히 동전 팝은 작은 크기에서 폭탄처럼 읽힐 여지가 남았다.
  - 종이 갑편 접힘, 엽전 3/4 원근, 옹기 노끈 매듭
- **판독**
  - 동전 폭주는 ground 층이라 1배에서 주인공 발에 가려 약하게 보인다.
  - 일식 광선은 시뮬대로 5+L개가 고르게 돌지만, 원 안쪽의 긴 붓 획이라 적 imminent 눈금(원 밖 짧은 쐐기)과 갈린다.
  - 연쇄 리뷰 배치(x 90, y ±30)는 지시서 배치라 크게 지그재그가 된다. 실제 판독은 C4로 본다.
  - 회복 실 획득 오라와 철골 보호막은 둘 다 몸을 감싼 청록 바느질이다. 대들보·리벳 유무와 진행 바늘로 갈린다.
- **기타**
  - minimal에서 장식뿐인 단계(백묵 chill, 동전 glint)의 참고 그림은 비울 수 없어서 표식이나 팝을 남긴다. 렌더러는 `lod: 'deco'`로 뺀다.
  - C7은 Chrome getBBox 기준이다. 곡선 제어점까지 잡는 듯해 실제 먹은 더 안쪽이다.

---

# 검수 1차 — art-director · 2026-10-03

- 검수 대상: 납품서 `docs/art/deliveries/K4-skill-vfx.md`
- 모듈: `art/concept-kit/k-skills-vfx.js`, `art/concept-kit/API-skills-vfx.md`
- 대조 기준: 지시서 `docs/art/briefs/skill-vfx.md`
- 표기: (확인) = 렌더나 코드로 본 것, (추정) = 판단, (미확인) = 보지 못한 것
- 중단 뒤 부채 단검부터 이어서 봤고, 17종 전부를 다뤘다.

## 0. 판정: 수정 후 합격

뼈대는 합격이다(확인).
- API, SPEC, parts 메타, 판정 정렬, 감소 모션/LOD, 색 감사가 모두 통과했다.
- C1·C6·C7·C9에 위반이 없다.
- 고칠 곳은 모두 조각 함수 안에 있다. API·SPEC 값·판정은 바꾸지 않는다. 동전 폭주만 예외로 박스와 층이 바뀐다.

**굽기 전에 고칠 것은 7건이다(§5).**
1. 회복 실 탄이 올챙이(정자)처럼 읽힌다.
2. 집행 표식이 ⊘처럼 읽힌다.
3. 각성 바늘 실이 Y·집게처럼 읽힌다.
4. 분신 선 사본이 5장 바닥, 0.8배에서 거의 사라진다.
5. 동전 팝이 과녁·눈(평상), 폭탄(각성)처럼 읽힌다.
6. 동전 폭주가 주인공에게 가린다.
7. 무음 지뢰 생성 0번 장에 "같은 크기 둥근 점 둘이 같은 높이에" 있다.

이 가운데 1·2·3·5와 6의 일부는 내 지시서 문구가 원인이다. 지시서 정정은 §7에 있다.

**진행 방법**
- 고친 뒤 `k4r2-` 렌더로 고친 항목만 다시 검수한다.
- 메인 세션은 렌더러 연결 코드 준비는 시작해도 된다. parts·SPEC 구조는 바뀌지 않는다.
- 굽기와 커밋은 재검수가 통과한 뒤에 한다.

## 1. 내가 본 렌더와 `--check`

출력 폴더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`다.

**감사·참조**
- `k4r1-c1-stamps`(2x, ok)
- `k4r1-c5-gray`(ok)
- `k4r1-c6-audit`: calls 316, text 0, blur 0, image 0, non-hex 0, nondeterministic 0, bad colours {}
- `k4r1-c7-bounds`: checked 316, outside 0, 박스 넓이 845,856
- `k4r1-c9-sizes`: §2와 같음
- `k4r1-allyzone-dash`, `k4r1-hero-bbox`: 숫자 출력용이라 `--check` 없이 돌렸다.

**단계 시트(C2)**
- 1x: needleStorm, fanKnives, chainSpark, frostLine, railSpear, orbitScythes, boneMortar, voidMine
- 2x: mirrorClone, recoveryThread
- 3x: ironFrame, coinFever
- 1.5x: paperWard, magnet+exec
- 0.8x: blackSun, eclipseStep
- 모두 ok다.

**판정·고리 확대(C3 대용)**
- frost-zoom(L1 반폭 ±15), rail-head-zoom(각성 ±45)
- mortar-blast-zoom(R, 0.55R), stitch-rim-zoom
- slashring-zoom, wardring-zoom, collapse-ring-zoom(감소 모션에서 R+30)
- scythe-zoom(r17), knife-zoom(r5.2)
- 모두 ok다.

**게임 크기 장면(C4)**
- Ch1 1x에서 17종 각성: `k4r1-scene-a/b/c/d-ch1`
- L1: `k4r1-scene-L1-ch1`
- Ch5 0.8x: `k4r1-scene-zones-ch5-08`
- `k4r1-clone-grounds-1x`
- 모두 ok다.

**팝(C8)**: `k4r1-c8-pops`(3x), `k4r1-c8-pops-1x`, ok.

**그 밖의 확대**
- clone-idle-zoom, clone-run26, clone-throw-zoom
- clone-face(8x, crop 26,4,60,48)와 hero-face-ref
- needle-awk-zoom, shell-zoom, fissure-zoom, rail-origin-zoom
- cores-zoom, corestart-zoom, collapse-zoom, eclipse-stamps
- mark-zoom, mark-1x, frenzy-hero, aura-vs-shield, fusion-afterimage
- 모두 ok다.

**다른 모듈의 kit error**
- `k4r1-hero-run2-top`을 1·2차에 돌렸을 때 `kit error: Identifier 'headT' has already been declared`가 났다.
- `k-skills-vfx.js` 밖에서 난 것이다(이 모듈은 모든 선언이 IIFE 안에 있다). 작업 중인 K3·K5 모듈로 추정한다.
- 3차 실행은 ok였다. 앞뒤의 다른 `--check`는 모두 ok였다.

**미확인**
- 실제 게임 화면: 렌더러가 아직 연결되지 않았고 `artifacts/visual/actual/`도 없다.
- Ch2~4 바닥.
- 연쇄 r78 고리의 1px 정렬: 단계 시트 배율로만 봤다.
- 백묵 각성(반폭 35)의 가장자리 확대: 작업자 렌더만 있다.

## 2. 지시서 대조

| 항목 | 결과 | 근거 |
|---|---|---|
| §1.1 파일·IIFE·id·글자 0·결정성 | 통과 | C6; 모든 렌더 `--check` id 검사 ok |
| §1.2 회전 기준 | 통과 | 바늘·단검 +x가 앞이다. 귀환·각성 end는 손잡이가 앞이다. 낫은 정방향 +y, 역방향 −y로 앞날이 나간다. 일식 slash 앵커는 R−2에 있다(확대에서 확인) |
| §1.3~1.4 API·parts | 통과 | `jit`·`copy`·`flash`를 더한 것은 수용한다 |
| §1.5 SPEC | 통과(점선 값은 §3-1) | 키·층·굵기가 지시서와 같다(`k-skills-vfx.js:166-190`) |
| §1.6 색·명도·선 | 통과 | bad colours {}. 창대/띠 = 12/90 ~ 12/42(13~29%). 장판 먹 면 35% 이하(추정) |
| §1.7 금지 모양 | **불통과 5건** | §5 고침 1·2·3·5·7, 권장 R1~R5 |
| §1.8 감소 모션·LOD | 통과 | 시트 4·5행. 소용돌이가 정지하고, 펄스는 r60에 머물고, deco가 빠지고, 판정은 그대로다 |
| §1.9 층 | 통과(예외 2건) | 동전 폭주(고침 6). 회복 실 aura 층 미지정(R7) |
| §2 판정 수치 | 통과 | C9 |
| §3.1 바늘 | 고침 3 | 평상은 좋다(1x에서 바늘+실로 읽힌다) |
| §3.2 단검 | 통과 | 11자루가 1x에서 뭉치지 않는다. 귀환은 손잡이가 앞이다 |
| §3.3 연쇄 | 통과 | Z·N 글자는 리뷰 배치 탓이다. 볼트 자체는 작은 꺾임이다 |
| §3.4 백묵 | 통과 | 가장자리 중심선이 ±w에 있다(L1 확인) |
| §3.5 흑선 | 통과(권장 R1) | 창날이 오목한 잎이다. 섬광은 7·9갈래 불규칙이다. 균열이 거미처럼 읽힌다 |
| §3.6 궤도 | 통과 | r17 안. 정/역이 명도 반전이다. 각 배치가 시뮬과 같다(`GameEngine.ts:2659-2665`) |
| §3.7 박격 | 통과(권장 R4) | 고리 중심선이 R과 0.55R에 있다. 가루가 고른 간격이다 |
| §3.8 분신 | 고침 4 | 얼굴은 통과다 |
| §3.9 무음 지뢰 | 고침 7(권장 R3) | 붕괴 R+30 확인 |
| §3.10 검은 태양 | 통과(권장 R2) | |
| §3.11 일식 | 통과 | 발밑 원반 rx 18이 링 rx 24 안이고, 코로나는 링 밖이다 |
| §3.12 철골 | 통과 | |
| §3.13 자석 | 통과 | 펄스가 가늘고 채움이 없다 |
| §3.14 갑주 | 통과(권장 R5) | wardRing 띠 중심이 140에 있다(1px 이내) |
| §3.15 회복 실 | 고침 1 | |
| §3.16 동전 | 고침 5·6 | |
| §3.17 집행 | 고침 2 | |
| §4 얼굴 | 통과 | 머리가 주인공과 같은 시점이고 덧그린 이목구비가 없다. 2×2 눈빛은 속 빈 네모로 남는다(1x에서 점이라 문제없다) |

## 3. 작업자가 다르게 한 9건

1. **stitch 점선 [4.5, 7.5] + fit: 수용.**
   - `allyZone`의 실제 값은 `stroke-dasharray="8 5"`, 둥근 끝, 먹 5다(`k4r1-allyzone-dash`, 확인). 땀 사이 중심선 간격이 0이다.
   - 지시서의 "잰 값 약 [4.5, 7.5]"는 내 측정 오류였고, 작업자가 옳다.
   - `allyZone`은 굽지 않는다(`art/atlas-spec.mjs:388-389`, common = 주인공·타격·픽업). 따라서 게임 안의 불일치는 없다.
   - 8x 확대에서 땀 길이는 9.5, 바닥은 약 3, 중심선은 R 위에 있다.
2. **분신 박스 112×100 / (56,79): 수용.**
   - run 2·6번 장의 getBBox 꼭대기는 −74.3이다(확인).
   - 다만 보이는 먹의 꼭대기는 약 −67이다(`k4r1-hero-run2-top`). 남은 약 7은 주인공 스프라이트 안의 보이지 않는 도형으로 추정하고, K0 쪽 메모로 남긴다.
   - 넓이 845,856 ≤ 900,000. 발 = 앵커이므로 게임 영향이 없다.
3. **상태별 벡터 감싼 선: 수용.**
   - 지시서가 "실루엣을 따르거나 감싼 타원"을 허용했다. 선 사본 자체는 여전히 필터다.
   - 조건 1: 감싼 선 점 목록(`k-skills-vfx.js:1035-1040`)은 주인공 프레임에 묶여 있다. 주인공 스프라이트가 바뀌면 분신 21장 C1·C7과 확대를 다시 본다. API §1과 굽기 체크리스트에 적는다.
   - 조건 2: 선 사본의 대비 문제는 따로 고친다(고침 4).
4. **butt 점선 먹 패드 0.6: 수용.** 샌드위치 규칙(§1.6)에 맞고, 보이는 값은 그대로다.
5. **slashRing 바깥 [ink 3, ally 1.6] @R+4.4: 수용.** 8x에서 띠 가장자리와 붙어 테 하나로 읽힌다. 경계가 둘로 보이지 않는다.
6. **shard 회전 `beam`: 수용.**
7. **패시브 main(shield/pulse/ward/volley/frenzy/mark): 수용.**
8. **회복 실 aura 중심 발 −32: 수용.** 발 중심이면 금지된 "바닥 청록 고리"가 된다. 층 지정은 권장 R7.
9. **각성 단검 end 손잡이 앞: 수용.**
   - end는 남은 수명 0.10초에서만 돈다. 각성 단검은 0.675~1.35초가 귀환 구간이라 맞다.
   - 다만 API §7의 "각성 전에 관통이 다해 사라지는 단검은 `end`" 문장은 틀렸다. 관통으로 사라지는 투사체는 end 없이 사라진다. 문장을 고친다(문서만).

## 4. 작업자 §6 판독 우려 3건

1. **동전 팝이 폭탄처럼 읽힘: 맞다.** 1x 평상 팝도 동심원 + 가운데 점(과녁·눈, 5장 일식 눈 문법)으로 읽힌다. 고침 5.
2. **동전 폭주가 발에 가림: 맞다.** `k4r1-frenzy-hero`에서 6닢 중 2닢이 코트 뒤에 있고, 나머지도 코트 가장자리에 반쯤 가린다. 고침 6.
3. **회복 실 aura와 철골 보호막이 비슷함: 문제없다.**
   - `k4r1-aura-vs-shield`(3x): 회복 실은 굵은 캡슐 땀(먹 5)의 원 r30에 진행 바늘이 붙는다. 철골은 가는 점선(2.6)의 세로 달걀 타원에 대들보 5개와 리벳이 있다.
   - 발동 계기도 다르다(획득 대 피격). 바꾸지 않는다.

## 5. 고칠 것 (kit-artist, `k-skills-vfx.js`만)

### 고침 1 · 회복 실 탄이 올챙이(정자)로 읽힌다
- 렌더: `k4r1-scene-d-ch1` 1x(확인). 8방향 탄이 둥근 머리 + 꼬불 꼬리라 정자·올챙이 떼로 보인다.
- 원인
  - `bead()`(`:657-661`): 채운 청록 원 r2.5 + α0.22 후광 r4
  - `curlD`(`:663`): S파
  - 지시서 §3.15의 "S자 실 + 구슬 머리"가 원인이다.
- 머리
  - 채운 원과 후광을 없앤다.
  - THREAD 층(`:536`)으로 속이 빈 가는 매듭 고리를 그린다. 앞끝 (+5.5, 0), 뒤 교차점 (−4.5, 0), 가장 넓은 반폭 2.2 (x ≈ −0.5)인 눈물방울 모양이다.
  - 실이 뒤에서 한 번 엇갈린다(이것이 매듭이다). 고리 안으로 바닥이 보인다.
- 꼬리
  - 교차점에서 x −20까지 휨이 한 번뿐인 호다. 예: Q 제어점 (−12, +3.5) → 끝 (−20, +1.5). 변곡이 없어야 한다.
  - 끝 6은 `frayedThread`(`:569-572`)처럼 [ink 1.6, ally 0.8]으로 가늘게 하고, 길이가 다른 섬유 둘(3, 5)로 푼다.
- 장
  - travel f0/f1은 꼬리 처짐만 다르게 한다(+3.5 / +2).
  - start는 꼬리 8.
  - end는 교차점이 2 벌어지고 꼬리가 처지며 allyD로 어두워진다.
- 지킬 것: 박스 36×14, 앵커 (26,7), 범위 x −23~+6, y −4~+4. 판정 r5가 고리를 덮어야 한다.
- 합격
  - 지시서 C4(`recoveryThread`, 각성, 1x와 0.8x)에서 둥근 머리 + 꼬불 꼬리로 읽히는 것이 없다.
  - 8x 확대에서 채운 원이 0이다.
  - C7 0, C6 {}.

### 고침 2 · 집행 표식이 ⊘로 읽힌다
- 렌더: `k4r1-mark-1x`(2x, 먹귀 위), `k4r1-c8-pops-1x`(확인). f1에서 220° 점선 원호와 바늘귀 실이 원을 닫고, 그 가운데를 바늘이 대각으로 지난다. 적 위에 뜨면 "무효/금지"로 오독될 수 있다.
- 원인
  - `markArt`(`:1129-1139`): 호 r 9.2(보스 9.6/13.4), 중심 (0, cy), 220°. 바늘 B (8.6,−23.6) → T (−5.6,−8)이 원 중심 근처를 지난다.
  - 1번 장 이후의 실(`:1136`)이 원을 닫는다.
  - 팝(`:1075-1076`)도 같은 구성이다.
  - 지시서 §3.17의 "반원 220°"가 원인이다.
- 땀 호
  - 중심을 바늘 **끝 T**에 두고, 반지름 7(보스 9), 범위 ≤ 120°로 바늘 반대쪽 아래(T 기준 60°→180°)에만 둔다.
  - 땀 3개(보스 4개), 길이 3.0 / 2.4 / 1.8로 서로 다르게, 틈 ≥ 1.8.
  - 바늘이 호의 중심 위를 지나지 않는다.
- 실: 바늘귀 B에서 오른쪽 위 바깥으로 풀리는 꼬리 8. 휨은 한 번이고, 호로 돌아와 원을 닫지 않는다.
- 보스: 긴 바늘(지금처럼) + 땀 4 + 3.5 바깥에 짧은 땀 2. 겹치는 동심 반원은 쓰지 않는다.
- 팝: 같은 구성을 원판 r ≤ 10 안에 넣는다. 바늘은 오른쪽 위 → 왼쪽 아래, 땀 3은 바늘 끝 아래에 둔다. 원판 중심을 감싸는 호는 0이다.
- 합격
  - 아래 명령과 C8(1x/3x)에서 닫힌 원 + 사선이 없다.
  - C7 0, ✕ 0.
  ```
  node scripts/art-review-sheet.mjs expr --name k4r2-mark-1x --scale 2 --check --crop 0,0,260,90 --expr '(function(S){var es=0.225,s="<rect width=\"260\" height=\"90\" fill=\"#B8AC93\"/>";for(var f=0;f<3;f++){var x=30+f*60,y=70;s+="<g transform=\"translate("+(x-100*es)+" "+(y-146*es)+") scale("+es+")\">"+PN.enemies.draw(1,"stalker",{lod:"game",shadow:false,halo:true})+"</g><g transform=\"translate("+(x-16)+" "+(y-24-29)+")\">"+S.stamp("executionMark","mark",{frame:f})+"</g>"}s+="<g transform=\"translate(210 4)\">"+S.stamp("executionMark","markBoss-awakened",{frame:1})+"</g>";return s})(PN.skillVfx)'
  ```

### 고침 3 · 각성 바늘의 갈라진 실이 Y·집게로 읽힌다
- 렌더: `k4r1-scene-a-ch1` 1x, `k4r1-needle-awk-zoom` 8x(확인). 각성 바늘은 각성 뒤 런 내내 화면에 가장 많이 뜨는 그림이다.
- 원인: `splitThread`(`:587-592`). 두 가닥이 ±4.4·k·t^0.75로 벌어지고(끝 간격 약 9), 줄기가 −9.6→−17이다.
- 꼬인 겹실로 바꾼다
  - A = +1.6·sin(φ + 2.2π·t)·env(t), B = −1.6·sin(φ + 2.2π·t)·env(t) + 0.4. env는 t = 0.3까지 0→1.
  - 중심 간격 ≤ 3.2, 교차 2번.
  - 끝점 x를 3~5 다르게 한다.
  - B는 [ink 2.0, ally 1.1]로 가늘게 한다.
  - start·end 변형도 같은 규칙이다.
- 지킬 것: 박스 64×24, 앵커 (46,12), 범위 y −8~+8.
- 합격: C4 needleStorm 각성(1x, 0.8x)에 Y·V 실루엣이 없고 "실이 굵은 바늘"로 읽힌다.

### 고침 4 · 분신 선 사본이 5장 바닥, 0.8배에서 사라진다
- 렌더: `k4r1-scene-zones-ch5-08`, `k4r1-clone-grounds-1x`(확인). #ABA5AC 위의 ink300(#8C8579) 선은 명도 차가 작다. 렌더러 α 0.8을 곱하면 감싼 청록 점선만 남는다.
- 원인: `CLONE_FILTER`(`:1027-1032`)가 두 가장자리를 모두 ink300으로 채운다.
- 고칠 것
  - 알파 바깥 가장자리(`ea`)는 ink500 #46423D로 채운다.
  - 먹 부분 가장자리(`ei`)는 ink300으로 둔다. 두 번 flood·composite한 뒤 merge한다.
  - 먹 채움은 넣지 않는다.
  - 선택 비교안: SourceAlpha 위에 p50 α 0.2 채움을 더한 판. 둘을 나란히 납품한다.
- 합격
  - Ch1·Ch5, 1x와 0.8x, opacity 0.8에서 모자·몸 윤곽·다리가 읽힌다.
  - 주인공보다 확실히 약하다(흰 코트 면과 검은 모자 덩어리가 없다).
  - 얼굴 crop(26,4,60,48, 8x)의 시점이 그대로다.
  - 확인 명령은 `k4r1-clone-grounds-1x`의 명령을 이름만 `k4r2-`로 바꾸고, 지시서 C4 mirrorClone `--scale 0.8`, 바닥 `"#ABA5AC"`도 돌린다.

### 고침 5 · 동전 팝 (`POP_SYMBOL.coinFever`, `:1073-1074`)
- 렌더: `k4r1-c8-pops-1x`, `k4r1-mark-zoom`(확인).
- 원인
  - 평상: r12 원판 안에 정원 엽전과 가운데 네모가 들어가 동심원 + 중심 점이 된다.
  - 각성: ink100 회색 공 + 오른쪽 위 별이라 폭탄처럼 보인다. 각성 기호가 종이가 아닌 것은 지시서 §3.12 "먹 원 + 종이 기호" 위반이다.
- 고칠 것
  - `coin3q`(`:1114-1118`)를 써서 엽전을 3/4로 그린다. 위치 (−1, 2), s 6.4, squash 0.55, tilt −20°, 두께 테 포함.
  - 각성: 면은 p50, 두께 테는 p300, 네모 구멍으로 먹 원판이 보인다.
  - 반짝임: 엽전 왼쪽 위 테에 걸친 5갈래 r 2.6 (−5.5, −1.5). 오른쪽 위 사분면에는 엽전 밖 요소가 0이다.
  - 선택: 뒤에 옆으로 선 엽전 하나(타원 6×1.6, 20°).
- 합격: C8 1x에서 기울어진 구멍 엽전으로 읽히고 과녁·눈·폭탄으로 읽히지 않는다. 평상/각성이 명도 반전이다. 청록 0.

### 고침 6 · 동전 폭주가 가린다 (`frenzy-awakened`, `:1119-1126`)
- 원인
  - 발 타원 rx 32 위의 6닢 가운데 x −11, +16 두 닢이 코트 뒤에 있다.
  - 높이는 −14까지다.
  - 층이 ground라 모두 주인공 아래에 그려진다.
  - idle 코트는 y −20~0에서 x 약 −24~+18이다(확인). run은 ±33까지 간다(bbox 확인).
- 고칠 것
  - 엽전은 |x| ≥ 24의 좌우 두 기둥(x −40~−26, +24~+40)에만 둔다.
  - y +4 → −30으로 솟는다. 크기 3.6~4.8.
  - 한쪽에 동시에 두 닢 이하, 높이 차 ≥ 6.
  - 종이 별은 |x| ≥ 20, y ≥ −30.
  - **층 `ally`**(실루엣 밖이라 몸을 덮지 않는다). 박스 96×48, 앵커 (48,38).
  - parts와 API §5 표를 고친다. 넓이는 +3,744 → 849,600 ≤ 900,000.
  - 얼굴 금지 구역은 비운다(−34 위로 가지 않는다).
- 합격: 지시서 C4 coinFever 각성(주인공을 위에 그린 1x)에서 매 장 양쪽에 엽전이 보인다. C7 0.

### 고침 7 · 무음 지뢰 `core-start` 0번 장의 "눈" 두 개
- 렌더: `k4r1-corestart-zoom` 10x(확인).
- 원인: `:908`, `:911`의 `specks(4, 95|96, …, 'p300','ink300')`. 둥근 알갱이 가운데 둘이 원반 위 같은 높이(y ≈ −9)에 있고, 그 아래 종이 테 호(∩)가 있다. §1.7 "같은 크기 둥근 점 둘을 같은 높이에" 위반이다.
- 고칠 것: `chipD` 모난 조각 3개를 고정 자리에 둔다. 예: (−15,−3, 1.2), (−4,−10, 1.8), (10,−6, 1.0). p300 + ink300 0.6, 높이 차 ≥ 3.
- 합격: 10x에서 같은 높이의 둥근 점 쌍이 0이다.

## 6. 권장 (이번에 해도 되고 사람 원화로 넘겨도 된다)

- **R1 흑선 균열** `fissure-awakened`(`:776-788`)
  - 4토막 꺾인 금 6개 + 가운데 먹 덩이가 거미 다리처럼 읽힌다.
  - 금을 2토막으로 줄이고 길이 8~27(긴 것 하나), 가운데 덩이 r ≤ 2.5, 끝의 무릎 꺾임을 0으로.
- **R2 검은 태양 붕괴 0번 장**(`:963-970`)
  - 고른 휜 가닥 9개 + 먹 원판 + 지그재그가 거미나 얼굴로 읽힌다.
  - 가닥 5~6개로 길이·폭을 들쭉날쭉하게 하고, 가운데 지그재그는 테까지 가는 금으로 옮기거나 뺀다.
- **R3 무음 지뢰 붕괴 0번 장**(`:917-918`): R2와 같다.
- **R4 박격 가루**(`:1331-1335`)
  - 40마다 고르게, 한 칸 건너 먹 가시를 두면 고른 방사 눈금(§1.7)에 가깝다.
  - 각도를 ±0.35칸 흔들고, jit로 25%를 건너뛰고, 가시 변형은 1/3만 쓴다. API §7 렌더러 규칙도 같이 고친다(지시서 §3.7의 "둘레 40마다"가 원인).
- **R5 갑편 6장**(`:1418-1422`)
  - 60° 등간격이라 고리 위에 시계 눈금처럼 선다.
  - 각도 ±10°, 끝 반지름 126~140으로 흔든다. 감소 모션도 같다.
- **R6 바늘 반짝임** `SPARK`(`:593-596`): 늘 붙은 종이 별이 타격 별과 겹친다. 크기 ≤ 0.75, travel 0번 장에만.
- **R7 aura 층**
  - `SPEC.aura`(`:188`)와 API §6·§7에 `layer: 'ally'`를 적는다.
  - r30 먹 테 안쪽 가장자리가 얼굴 금지 구역 오른쪽 위 모서리에 약 1.3 들어간다(계산, 추정). r 28로 줄이는 것을 검토한다.
- **R8 분신 throw 2번 장의 바늘**(+45.9까지, 확인)
  - 감싼 선 밖으로 나온 선 사본 바늘이 속 빈 화살표 "→"처럼 보인다.
  - throw 감싼 선 오른쪽에 바늘 자리 혹을 더하거나, 사람 원화로 넘긴다.
- **R9 문서**: API §7의 단검 end 문장(§3-9).

## 7. 지시서 정정 (내 오류, 메인 세션이 `docs/art/briefs/skill-vfx.md`에 반영)

1. **§1.5 stitch**: "allyZone 값 그대로 / 잰 값 약 [4.5, 7.5]"를 "dash [4.5, 7.5] 둥근 끝 + fit(n = max(3, round(2πR/12)))"로 바꾼다. allyZone은 [8, 5]이고 참고용이다.
2. **§3.8과 §6**
   - 분신 박스: 112×100, 앵커 (56,79)
   - 얼굴 crop: `26,4,60,48`
   - "주인공 스프라이트가 바뀌면 분신 21장 재검수"를 추가한다.
3. **§3.1**: 각성 실은 꼬인 겹실(중심 간격 ≤ 3.2)이고 벌어지는 Y는 금지다.
4. **§3.15**: 탄 = 속 빈 매듭 고리 + 한 번 휘는 꼬리. 둥근 구슬 머리와 S 꼬리는 금지다.
5. **§3.16**: 폭주는 좌우 기둥, 층 ally, 박스 96×48 (48,38), 높이 −30까지. 팝은 3/4 엽전이고 각성은 종이 엽전이다.
6. **§3.17**: 땀 호 ≤ 120°, 바늘 끝 중심, 원을 닫지 않는다.
7. **§3.7·§3.14**: 가루와 갑편 배치를 흔든다.
8. **§1.9**: 회복 실 aura는 ally다.
9. **§8-2**: 공통 팩 위치가 `art/atlas-spec.mjs:388-389`(PACKS.common)로 바뀌었다(지시서는 `:375`).

## 8. 재검수 통과 뒤 메인 세션이 등록·굽기·연결 때 확인할 것

1. **킷 로드**: `scripts/build-atlas.mjs:11` `KIT_FILES`에서 `k-hero.js` 뒤에 넣는다(분신이 `PN.heroKit.sprite`를 부른다).
2. **굽기 사양**
   - PACKS.common에 188장을 브라우저 쪽에서 펼친다(`build-atlas.mjs:144-170` 방식). 키는 `skill/<group>/<part>/<frame>`다.
   - 매니페스트에 `skillVfx: { spec, parts(drive·window·rotate·layer·lod·still·flash) }`를 넣는다. 폭주 박스 변경도 반영한다.
3. **굽기 뒤**
   - 공통 페이지 크기와 초기 에셋 합계를 잰다. 3 MB 경고(`docs/art/pipeline.md:109`)에 닿으면 런용 `skills` 팩으로 옮긴다.
   - `npm run build`로 App JS 예산을 본다(경고선 106,283 B).
   - `npm run bench:render`를 망점 장판 여럿으로 돌린다(`worldRenderer.ts:575-581`).
   - `npm run test:unit`. `fingerprint:draw`는 달라지는 것이 맞다.
4. **렌더 데이터**(지시서 §8-5, 메인 세션 판단, `harness.ts:102` 지문 주의)
   - BeamEffect/ChainEffect skillId
   - area/damage radius·source
   - 백묵 감속 출처
   - 폭주 남은 시간
   - 단검 returning
   - 분신 조준 사격 여부
5. **`npm run test:visual` 장면**(지금은 스킬 장면이 없다, `scripts/visual-gate.mjs:26`)
   - a. 아군 장판 위에 적 원 텔레그래프가 겹친 장면: 장판이 아래, 텔레그래프가 위(V3).
   - b. 백묵·흑선 L1과 각성: 축에서 w + r − 1 거리의 적이 띠 안에 보인다.
   - c. 일식 L1과 L5 각성: 고리 + 5+L 획 + 발밑 원반이 링 rx 24 안에 있다.
   - d. 분신 사격을 5장 바닥, 0.8배, α 0.8로 본다.
   - e. 패시브 팝과 디버프 타이머를 함께 띄운다.
   - f. 감소 모션: 소용돌이 정지, 펄스 r60, 낫은 계속 움직임. 섬광 감소: 흑선 flash α × 0.5.
   - g. LOD minimal(적 160 이상): 가루·꼬리·바느질 머리·펄스·균열·glint가 빠지고 테·띠는 남는다.
   - h. 회복 실 탄과 집행 표식을 군중 위에서 본다(고친 모양).

## 9. 사람 원화가 몫 (§15)

- 작업자 목록에 동의한다.
  - 분필·소용돌이·코로나·일식 획의 붓 질감
  - 분신 이중 윤곽과 땀 배치
  - 28px 팝 픽셀 다듬기
  - 갑편 접힘, 엽전 3/4, 옹기 매듭
- 더할 것
  - 균열·붕괴 폭발의 최종 실루엣(생물처럼 읽히지 않게)
  - 고친 뒤 집행 표식·동전 팝의 최종 기호

## 10. 열린 질문

1. **분신 α(§9-1)**: 고침 4 뒤 5장 0.8배에서 0.8로 둘지 0.9로 둘지.
2. **allyZone 정렬**: K1 모듈 `k-icons.js`의 [8, 5]를 [4.5, 7.5] + fit으로 맞출지(게임 영향 없음).
3. **일식 광선 바퀴살**: 시뮬대로 등간격이고 L1에서 바퀴살처럼 보인다. 장식이니 렌더러가 광선마다 장을 번갈아 쓰거나 길이를 흔들지. 기본안은 지금대로 수용이다.
4. **동전 폭주 남은 시간 데이터**: 넣지 않으면 폭주 그림은 연결되지 않는다.

---

# 수정 납품 1 (검수 1차 반영) — kit-artist · 2026-10-03

## 0. 요약
검수 1차의 고침 1~7을 모두 반영했습니다. 권장 R1~R7·R9도 넣었고, R8(분신 throw 바늘)은 잘라 내는 방식으로 처리했습니다.

- 각 고침의 "합격" 명령을 직접 돌렸습니다. 렌더는 모두 `--check` ok입니다(C6·C7·C9은 지시서대로 `--check` 없이 실행).
- 최종 검사 숫자:
  - C6: calls 316, text 0, blur/gradient/blend 0, image 0, non-hex 0, nondeterministic 0, bad colours `{}`
  - C7: checked 316, **outside 0**, stamp box area **849,600**
  - C9: 지시서 §2와 같음(SIZES는 고치지 않음)
- 고친 파일은 맡은 두 개뿐입니다. §3의 수용된 9건은 그대로 두었습니다.
- 검수에 없던 곳을 하나 더 고쳤습니다. 고침 7을 확인하다가 각성 무음 지뢰 0번 장에서 같은 높이의 점 한 쌍을 하나 더 찾아서 없앴습니다(§4-8).

## 1. 납품 목록
| 파일 | 상태 |
|---|---|
| `art/concept-kit/k-skills-vfx.js` | 1,587줄(K4 납품 때 1,509줄), `PN.skillVfx` v1.0 |
| `art/concept-kit/API-skills-vfx.md` | 손본 절: §1, §2, §3, §4, §5(머리 넓이, dust·frenzy 행), §5.1, §6(wardRing·aura·blastDust), §7, §8, §9, §10(2·3·8 수정, 10~17 추가), §11, §12 |

- 조각은 188장 그대로이고, 박스가 바뀐 곳은 동전 폭주 하나뿐입니다.
- **굽기 결과가 바뀌는 조각은 53장**입니다.
  - 바늘 `*-awakened` 6
  - 회복 실 `shot-*-awakened` 6
  - 분신 `clone-*` 21(필터 색 변경)
  - 집행 `mark` 3, `markBoss-awakened` 3, `pop`·`pop-awakened` 2
  - 동전 `pop`·`pop-awakened` 2, `frenzy-awakened` 3
  - 무음 지뢰 `core-start` 0번, `core-start-awakened` 0번, `collapse-awakened` 0번
  - 검은 태양 `collapse-awakened` 0번
  - 흑선 `fissure-awakened` 3
- `draw()` 참고 그림의 기본 출력도 바뀌었습니다.
  - 위 조각을 쓰는 단계 전부
  - 박격 blast의 가루 배치, 갑주 ward의 갑편 배치
  - 회복 실 aura(r 35)
  - 동전 frenzy(glint를 빼고 폭주만 그림)

## 2. 바꾼 함수와 줄 (`k-skills-vfx.js`)
| 곳 | 줄 | 고침 |
|---|---|---|
| `SPEC.wardRing.plates`(angleJitter 10, toMin 126, seed 9) | :185 | R5 |
| `SPEC.aura`(stitchR 30 → 35, layer `'ally'`) | :188 | R7 |
| `SPEC.blastDust`(새 키) | :189 | R4 |
| `PARTS_RAW.coinFever` frenzy-awakened: 84×40/(42,30)/ground → **96×48/(48,38)/ally** | :318-319 | 고침 6 |
| `twinThread`, `SPARK`, `needleStorm` start·travel·end-awakened(`splitThread` 삭제) | :588-601 | 고침 3, R6 |
| `TH_DIM`, `qpt`, `knotLoopD`, `knotTail`, `knotShot`, recoveryThread `shot-*-awakened`(`bead`·`curlD` 삭제) | :661-683 | 고침 1 |
| `FISSURE_L`, railSpear `fissure-awakened` | :793-806 | R1 |
| `mine()` 가시 관 종이 빛(crown ≥ 0.5일 때만) | :919-920 | 추가 발견 |
| `mineDust`, voidMine `core-start`·`core-start-awakened` | :927-934 | 고침 7 |
| voidMine `collapse-awakened` 0번 장 | :936-945 | R3 |
| blackSun `collapse-awakened` 0번 장 | :987-997 | R2 |
| `CLONE_FILTER`(바깥 가장자리 ink500, `fill` 비교안) | :1050-1062 | 고침 4 |
| `cloneArt`(throw 2번 장 clipPath, `fill` 전달), 분신 등록 | :1072-1093 | R8, 고침 4 |
| `POP_SYMBOL.coinFever` | :1110-1115 | 고침 5 |
| `POP_SYMBOL.executionMark` | :1116-1118 | 고침 2 |
| `coin3q`(뚫린 구멍이 테까지, 선을 따로 그림) | :1155-1166 | 고침 5·6 |
| `FRENZY`, coinFever `frenzy-awakened` | :1167-1179 | 고침 6 |
| `stitchArcs`, `MARK_SPEC`, `markArt` | :1181-1211 | 고침 2 |
| `stamp()`: opts를 조각 함수에 넘김(`fill`) | :1217-1225 | 고침 4 |
| `DRAW.boneMortar` 가루 배치 | :1401-1410 | R4 |
| `wardPlates` | :1493-1502 | R5 |
| `DRAW.recoveryThread` aura(SPEC.aura 사용) | :1515-1518 | R7 |
| `DRAW.coinFever`(frenzy 단계는 폭주만) | :1530-1535 | 고침 6 |

## 3. 고침별 결과
출력 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 모두 열어 직접 봤습니다.

**고침 1 · 회복 실 탄 — 합격 기준 충족**
- 렌더: `k4r2-recoveryThread-scene-ch1`(1x), `-scene-ch1-08`(0.8x), `-scene-zoom`(4x), `k4r2-recovery-shot-zoom`(8x, 판정 r5 겹침), `k4r2-recoveryThread-stages`
- 1x·0.8x에서 탄이 속 빈 매듭 고리 + 한 번 휜 꼬리로 보입니다. 둥근 머리 + 꼬불 꼬리는 없습니다.
- 8x에서 채운 원이 0이고, 고리 안으로 바닥이 보입니다.
- 고리는 앞끝 +5.5, 교차점 (−4.5, 0), 반폭 2.2입니다. 꼬리는 2차 곡선 하나이고, 끝 6은 [ink 1.6, ally 0.8]로 가늘어지며 섬유 둘(약 5·3)로 풀립니다.
- 장별 차이: travel은 처짐만 다릅니다. start는 꼬리 8, end는 교차점이 2 벌어지고 allyD로 어두워집니다.
- 이번 라운드 첫 C7에서 end 장 꼬리가 y +4를 넘어 걸렸습니다. 제어점을 (−12, 4.5) → (−12, 3.8)로 낮춰 0건이 됐습니다.

**고침 2 · 집행 표식 — 합격 기준 충족**
- 렌더: `k4r2-mark-1x`(검수 명령 그대로), `k4r2-mark-zoom`(10x), `k4r2-c8-pops`·`-1x`, `k4r2-executionMark-stages`
- 닫힌 원 + 사선(⊘)이 없고, ✕도 0입니다.
- 땀 호는 바늘 끝 T를 중심으로 r 7, 64° → 174°이고 땀 3개입니다. 바늘은 호 중심 위를 지나지 않습니다.
- 실은 바늘귀에서 오른쪽 위로 풀리는 꼬리 약 8 하나이고, 호로 돌아오지 않습니다.
- 보스는 긴 바늘 + 땀 4 + 3.5 바깥의 짧은 땀 2입니다. 팝은 같은 구성을 원판 안에 넣었고, 원판 중심을 감싸는 호는 없습니다.

**고침 3 · 각성 바늘 — 합격 기준 충족**
- 렌더: `k4r2-needleStorm-scene-ch1`(1x), `-scene-ch1-08`(0.8x), `-scene-zoom`(4x), `k4r2-needle-awk-zoom`(8x, y ±8 선), `k4r2-needleStorm-stages`
- 꼬인 겹실이라 1x·0.8x에서 "실이 굵은 바늘"로 읽힙니다. Y·V 실루엣은 없습니다.
- 바늘귀 뒤에서 두 번 교차하고, B 가닥이 4 짧고 [ink 2, ally 1.1]로 가늡니다. 범위는 y −8~+8 안입니다.

**고침 4 · 분신 선 사본 — 합격 기준 충족, 비교안도 나란히 렌더**
- 렌더: `k4r2-clone-grounds-1x`, `-08`, `-2x`, `k4r2-mirrorClone-scene-ch5-08`(지시서 C4, 0.8x, #ABA5AC), `k4r2-clone-face`(8x, crop 26,4,60,48), `k4r2-hero-face-ref`(같은 crop), `k4r2-mirrorClone-stages`
- 바깥 가장자리를 ink500, 먹 부분 가장자리를 ink300으로 따로 채워 merge했습니다. 먹 채움은 없습니다.
- Ch1·Ch5, 1x·0.8x, α 0.8에서 모자·몸 윤곽·다리가 읽힙니다. 흰 코트 면과 검은 모자 덩어리가 없어 주인공보다 확실히 약합니다.
- 얼굴 crop의 시점은 주인공 원본과 같습니다.
- 검수의 `k4r1-clone-grounds-1x` 명령 원문은 제게 없었습니다. 같은 구성으로 다시 만들었습니다:
  - 주인공 idle 0
  - 분신 idle0·run2·throw2·hurt0(α 0.8)
  - `fill` 비교안 idle0·throw2(6·7번째 칸)
  - 바닥 Ch1·Ch5 두 줄
- 비교안(p50 α 0.2 채움)은 Ch5 0.8x에서 몸이 조금 더 덩어리로 읽히지만, 선만 쓴 기본안도 기준을 넘습니다. 기본안을 권하고, 비교안은 게임 캡처에서 약하면 쓰는 예비안으로 둡니다. 비교안은 `stamp(..., {fill:true})`로만 나오고 굽지 않습니다.

**고침 5 · 동전 팝 — 합격 기준 충족(1x 각성에 약한 잔여 위험)**
- 렌더: `k4r2-c8-pops`(3x), `k4r2-c8-pops-1x`, `k4r2-coinpop-zoom3`(6x). `k4r2-coinpop-zoom`·`-zoom2`는 중간판입니다.
- 엽전은 `coin3q`(−1, 2), s 6.4, 눌림 0.55, 기울기 −20°이고, 두께 테가 있습니다. 반짝임은 왼쪽 위 테의 5갈래 r 2.6입니다.
- 오른쪽 위 사분면에는 엽전 밖 요소가 0입니다. 평상/각성은 명도 반전이고 청록은 0입니다.
- 1x에서 기울어진 구멍 엽전으로 읽히고, 동심원 과녁이나 회색 공 + 별(폭탄)은 없어졌습니다.
- 앞 판에서는 구멍 밑이 테 타원으로 막혀 있었습니다. 지금은 구멍이 테까지 뚫려 먹 원판(평상은 종이 원판)이 비칩니다.
- 남은 위험: 각성 1x에서 흰 타원 속 먹 구멍이 2px 점이라 눈으로 읽힐 여지가 조금 있습니다(§7).

**고침 6 · 동전 폭주 — 합격 기준 충족**
- 렌더: `k4r2-coinFever-scene-ch1`(C4 1x, 주인공을 위에), `k4r2-frenzy-frames`(3x, 0~2번 장, 주인공을 위에), `k4r2-coinFever-stages`
- 매 장 양쪽에 엽전이 둘씩 보입니다.
- 엽전은 좌우 기둥에만 있습니다(왼쪽 x −34·−30, 오른쪽 29·35, 크기 3.8~4.8). 한쪽 높이 차는 15.5이고 −30 위로 가지 않습니다.
- 종이 별 둘은 |x| ≥ 22, y −6 → −28입니다.
- 층 ally, 박스 96×48 / 앵커 (48, 38). C7 0, 넓이 849,600.
- `k4r2-frenzy-f0-zoom`(8x)에서 참고 그림의 glint(30, −6)가 오른쪽 기둥 엽전을 덮는 것을 보고, frenzy 단계 참고 그림에서 glint를 뺐습니다.

**고침 7 · 무음 지뢰 생성 0번 장 — 합격 기준 충족**
- 렌더: `k4r2-corestart-zoom`(10x, 평상·각성), `k4r2-voidMine-stages`
- 모난 `chipD` 조각 셋을 고정 자리에 두었습니다. 평상 (−15,−3)·(−4,−10)·(10,−6), 각성 (−16,−2)·(−5,−11)·(11,−5.5). p300 + ink300 0.6, 높이 차 ≥ 3.
- 같은 높이의 둥근 점 쌍은 0입니다.
- 추가로 각성 0번 장에서 가시 관(crown 0.2)의 종이 빛 두 줄이 원반 위 같은 높이의 점 쌍으로 보여, crown ≥ 0.5일 때만 그리게 했습니다(1번 장부터).

**권장 R1~R9**
| 항목 | 결과 | 렌더 |
|---|---|---|
| R1 균열 | 금 6개, 금마다 두 토막(가운데 꺾임 1, 끝 꺾임 0). 길이 12/9/27/14/8/16, 덩이 r 2.2, 가지 없음 | `k4r2-fissure-zoom`(5x) |
| R2 검은 태양 붕괴 | 가닥 6(길이 26~44, 폭 2.2~4.6 제각각) + 원반 r 17 + 테까지 가는 금 하나. 가운데 지그재그 없음 | `k4r2-collapse-zoom`(4x) |
| R3 무음 지뢰 붕괴 | 쐐기 5(길이 22~35, 폭 3~6) + 덩이 r 7.6 + 테까지 가는 금 | `k4r2-collapse-zoom` |
| R4 박격 가루 | 40마다 한 칸, 각 ±0.35칸, 25% 건너뜀, 가시 변형 1/3. 같은 규칙을 `SPEC.blastDust`와 API §6·§7에 적음 | `k4r2-boneMortar-stages`, `k4r2-mortar-dust-zoom`(2x) |
| R5 갑편 | 각 ±10°, 끝 반지름 126~140(jit). 감소 모션도 끝 반지름에 바로. wardRing 140은 자홍 선 위 | `k4r2-paperWard-stages`, `k4r2-paperWard-hit`(C3) |
| R6 바늘 반짝임 | 크기 0.75, travel-awakened 0번 장에만 | `k4r2-needle-awk-zoom` |
| R7 aura | `layer: 'ally'`를 SPEC과 API §6·§7에 적음. 반지름은 28이 아니라 **35**(§4-2) | `k4r2-aura-facezone`(3x, r 28/30/35) |
| R8 분신 throw 바늘 | 바늘만 clipPath로 잘라 냄(팔 높이 띠 y −42~−22에서 x > 22.5). 모자 챙·손·코트는 남음. 감싼 선 밖으로 나오는 것 0 | `k4r2-clone-throw-zoom`(3x), `k4r2-clone-throw2-hand`(8x), `k4r2-hero-throw2-ref`(자르기 위치 계획용 격자) |
| R9 문서 | API §7: "관통이 다해(또는 맞아서) 지워지는 투사체는 `end` 없이 그 틱에 사라진다. `end`는 수명이 다해 가는 투사체에만. 각성 단검의 수명 끝은 늘 귀환 중이라 `end-awakened`" | 문서 |

## 4. 다르게 한 것 (API §10-10~17에 같은 내용)
1. **각성 겹실 진폭 1.4**(검수 1.6 대신). 간격이 env·|2·진폭·sin − 0.4|라서 1.6이면 최대 3.6으로 "≤ 3.2"를 넘습니다. 1.4이면 정확히 3.2입니다.
2. **aura r 35**(R7의 "r 28 검토" 대신).
   - 먹 층 폭 5의 안쪽 가장자리가 얼굴 금지 구역의 가장 먼 모서리(몸 중심에서 31.6)보다 바깥이려면 r > 34.1이어야 합니다.
   - r 28·30은 구역 오른쪽 위를 지납니다(`k4r2-aura-facezone`).
3. **R8을 혹 대신 자르기로 처리**했습니다. 혹을 더하면 감싼 선이 +46까지 뻗어 "화살 자루"가 됩니다.
4. **동전 팝의 선택안 "옆으로 선 엽전"을 뺐습니다.** 1x에서 프라이팬·돋보기 손잡이처럼 튀어나왔습니다.
5. **폭주 시작 높이 y +1**(검수 +4 대신).
   - 발 아래 여백이 10이고, C7 여백 3을 빼면 7입니다. +4에서 띄우면 두께 테까지 +8을 넘습니다.
   - 앞 판(+2)도 C7에서 0.1 넘어 걸렸습니다.
6. **회복 실 앞끝 +5.5**: 검수 좌표 그대로라 판정 r 5보다 0.5 바깥입니다(낫의 "1 이내" 허용과 같은 수준).
7. **집행 땀 틈을 넓혔습니다.**
   - 표식 3.2/3, 보스 3/2.9/2.8(검수 "≥ 1.8"). 틈이 먹 층 2.6보다 좁으면 둥근 끝 먹이 이어져 사슬 하나로 보였습니다.
   - 호는 110°/116°로 120° 안입니다. 보스 땀 길이(3/2.6/2.2/1.8)는 검수에 값이 없어서 정했습니다.
   - 팝은 r 4.4로 줄이고 틈 2.2/2(117°)입니다.
8. **각성 무음 지뢰 가시 관의 종이 빛**(검수에 없던 항목, 위 고침 7 참고).

## 5. 검사 결과
- `--check` ok인 렌더(모두 `k4r2-`): c1-stamps, recoveryThread-scene-ch1, -scene-ch1-08, -scene-zoom, recovery-shot-zoom, mark-1x, mark-zoom, c8-pops, c8-pops-1x, coinpop-zoom/2/3, needleStorm-scene-ch1, -scene-ch1-08, -scene-zoom, needle-awk-zoom, clone-grounds-1x/-2x/-08, clone-face, hero-face-ref, mirrorClone-scene-ch5-08, coinFever-scene-ch1, frenzy-frames, frenzy-f0-zoom, corestart-zoom, fissure-zoom, collapse-zoom, mortar-dust-zoom, aura-facezone, clone-throw-zoom, clone-throw2-hand, hero-throw2-ref, C2 stages(boneMortar, paperWard, coinFever, voidMine, mirrorClone, executionMark, needleStorm, recoveryThread), paperWard-hit(C3), final-load
- 최종 C1 `k4r2-c1-stamps` ok(188장, 앵커 점 확인)
- C6 `k4r2-c6-audit`, C7 `k4r2-c7-bounds`, C9 `k4r2-c9-sizes`: §0의 숫자. 최종 코드로 다시 돌린 값입니다.
- **다른 모듈의 kit error**: 실행 3번이 실패로 끝났습니다(`k4r2-coinpop-zoom3` 2번, `k4r2-c8-pops-1x` 1번).
  - 메시지: `kit error: Failed to execute 'appendChild' on 'Node': Unexpected token ')'`
  - 제 그림은 같은 실행에서 렌더됐습니다(`PN.skillVfx`가 있었음). 이 모듈 밖의 오류이고, 작업 중인 K3-2(`k-bosses1/2`) 쪽으로 추정합니다.
  - 같은 명령을 다시 돌리니 둘 다 ok였습니다. 그 뒤로는 나지 않았습니다.

> 메인 세션 메모: 위 kit error는 K5 작업자가 알린 `k-env.js:1300`의 일시 문법 오류(같은 메시지)와 맞는다. K3-2 쪽이 아니다.

## 6. 메인 세션이 할 일
1. **parts 변경**: `coinFever/frenzy-awakened` 96×48 / (48,38) / ally. 굽기 사양이 `parts()`를 읽으면 자동으로 따라오고, 매니페스트의 layer도 ally가 됩니다. 박스 넓이 합은 849,600입니다.
2. **다시 구울 조각**: §1의 53장. 키 체계와 장 수는 그대로입니다.
3. **SPEC 변경**(매니페스트 `skillVfx.spec`):
   - `aura` r 35 + layer ally
   - `wardRing.plates`에 angleJitter·toMin·seed 추가
   - 새 키 `blastDust`
   - 렌더러 규칙(가루 자리·변형, 갑편 각·끝 반지름)은 API §6·§7에 식으로 적었습니다.
4. **굽지 말 것**: `stamp`의 `fill` 옵션은 비교안 전용입니다. 사양에 넣지 않습니다.
5. **굽기 체크리스트에 한 줄**: "주인공 스프라이트가 바뀌면 분신 21장 C1·C7과 얼굴 crop(26,4,60,48, 8x)을 다시 본다." 감싼 선 점 목록과 throw 2번 장 자르기 좌표가 주인공 프레임에 묶여 있습니다(API §1).
6. `KIT_FILES` 순서(`k-hero.js` 뒤)와 지시서 §8의 나머지는 그대로입니다.
7. **art-director에게 넘길 결정**:
   - 분신 비교안 채택 여부
   - 분신 α 0.8/0.9(검수 §10-1)

## 7. 알려진 한계 · 사람 원화가 몫
- **동전 팝 각성**: 1x에서 먹 구멍이 2px 점이라 눈으로 읽힐 여지가 남았습니다. 28px 픽셀 다듬기가 필요합니다.
- **분신 throw 2번 장**: 손 끝이 직선으로 잘립니다(1x에서 1~2px). 선 사본의 이중 윤곽 정리도 손으로 해야 합니다.
- **최종 실루엣**: 균열(fissure)과 붕괴 0번 장(검은 태양·무음 지뢰)은 생물처럼 읽히지 않게 사람이 다듬어야 합니다(검수 §9).
- **최종 기호**: 고친 집행 표식·동전 팝·회복 실 매듭의 최종 기호, 엽전 3/4 원근, 붓 질감(분필·소용돌이·코로나·일식 획)은 사람 원화가 몫입니다(API §11).
- **회복 실 볼리**: 8발은 시뮬대로 8방향 등간격입니다. 각 탄이 휜 꼬리라 곧은 방사 눈금으로 보이지는 않습니다.

---

# 검수 2차 — art-director · 2026-10-03

- 대상: 이 파일 끝의 "# 수정 납품 1" 절
- 모듈: `art/concept-kit/k-skills-vfx.js`(1,587줄), `art/concept-kit/API-skills-vfx.md`
- 대조: 검수 1차 §5 고침 1~7, §6 권장 R1~R9
- 표기: (확인) = 렌더나 코드로 본 것, (추정) = 판단, (미확인) = 보지 못한 것

## 0. 판정: 합격 (굽기·연결 진행 가능)

- 고침 7건이 모두 기준을 채웠다(확인).
  - 예외는 고침 5(동전 팝)의 **각성** 팝 하나다. 1x에서 "흰 아몬드 + 가운데 검은 점", 곧 눈으로 읽힐 여지가 남았다(작업자도 적었다).
  - 각성 팝은 런마다 각성 때 한 번만 뜬다. 노출이 작아 굽기를 막지 않는다.
  - 다음 킷 라운드에서 고친다(§5 처방). 고쳐도 다시 구울 장은 1장이다.
- 권장 R1~R9는 모두 반영됐다. 보기에 맞다(확인).
- 감사 결과
  - C6: calls 316, text 0, blur 0, image 0, non-hex 0, nondeterministic 0, bad colours {}
  - C7: checked 316, outside 0, 박스 넓이 849,600 ≤ 900,000
  - C9: SIZES가 지시서 §2와 같다.
  - C1: 188장이 모두 있고 앵커 점이 맞다.

## 1. 내가 본 렌더

출력 폴더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`다.

**`--check` ok**
- `k4r2r-c1-stamps`(2x)
- 회복 실: `k4r2r-recoveryThread-scene-ch1`(C4 1x), `k4r2r-recovery-shot-zoom`(8x, r5 겹침), `k4r2r-recovery-scene-zoom`(4x)
- 집행: `k4r2r-mark-1x`(1차 명령 그대로), `k4r2r-mark-zoom`(6x)
- 팝: `k4r2r-c8-pops`(3x), `k4r2r-c8-pops-1x`, `k4r2r-coinpop-zoom`(10x)
- 바늘: `k4r2r-needle-awk-zoom`(8x), `k4r2r-needle-scene-zoom`(3x)
- 분신: `k4r2r-clone-grounds-1x`(Ch1·Ch5, α 0.8, fill 비교안 포함), `k4r2r-clone-ch5-08`(선 대 fill, Ch5 0.8x, α 0.8), `k4r2r-clone-face`(8x, crop 26,4,60,48), `k4r2r-clone-throw2`(6x)
- 동전: `k4r2r-frenzy-frames`(0~2번 장, idle·run 주인공을 위에, 3x), `k4r2r-coinFever-stages`(2x)
- 그 밖: `k4r2r-corestart-zoom`(10x), `k4r2r-fissure-collapse`(4x), `k4r2r-dust-plates`(1x, 감소 모션 포함), `k4r2r-aura-hero`(3x, 얼굴 금지 구역 겹침)

**숫자 출력용(`--check` 없음)**: `k4r2r-c6-audit`, `k4r2r-c7-bounds`, `k4r2r-c9-sizes`(SPEC aura·plates·blastDust와 frenzy parts 출력 포함)

**kit error**: 내 실행에서는 한 번도 나지 않았다. 작업자가 적은 `Unexpected token ')'`는 메인 세션 메모대로 `k-env.js`의 일시 오류로 본다.

**미확인**
- 회복 실과 바늘의 0.8x 전체 장면: 작업자 렌더만 있고, 나는 1x와 확대로 봤다.
- 바뀌지 않은 스킬의 단계 시트와 C5.

## 2. 고침 1~7

| 고침 | 판정 | 근거 |
|---|---|---|
| 1 회복 실 탄 | **합격** | 속 빈 뾰족한 매듭 고리 + 휨 한 번인 꼬리 + 두 갈래로 풀린 끝이다. 1x 8방향에서 올챙이·정자 읽힘이 사라졌다. 8x에서 채운 원 0. end는 교차점이 벌어지고 allyD로 어두워진다 |
| 2 집행 표식 | **합격** | 바늘 끝을 중심으로 한 땀 호(≤ 120°)가 바늘 아래쪽에만 있다. 실은 바늘귀에서 바깥으로 풀린다. 닫힌 원, ⊘, ✕가 없다. 보스와 팝도 같다 |
| 3 각성 바늘 | **합격** | 꼬인 겹실(두 번 교차, B가 짧고 가늘다)이다. 3x 부채꼴에서 Y·V가 없고 "실이 굵은 바늘"로 읽힌다. 반짝임은 travel 0번 장에만 작게 있다(R6) |
| 4 분신 선 사본 | **합격** | 바깥 가장자리 ink500 덕에 Ch1·Ch5, 1x와 0.8x, α 0.8에서 모자·몸·다리가 읽힌다. 주인공보다 확실히 약하다. 얼굴 crop은 원본과 같은 시점이고 덧그린 이목구비가 없다 |
| 5 동전 팝 | **부분 합격** | 평상: 1x에서 기운 구멍 엽전으로 읽히고 과녁이 사라졌다. 각성: 1x에서 눈으로 읽힐 여지가 남았다(§5) |
| 6 동전 폭주 | **합격** | 0~2번 장, idle과 run 2 모두 양쪽에 엽전이 둘씩 보인다. 코트 밖이고 −30 위로 가지 않는다. 층 ally, 박스 96×48, 앵커 (48,38) |
| 7 무음 지뢰 0번 장 | **합격** | 모난 조각 셋의 높이가 다르다. 각성 가시 관의 종이 빛 한 쌍도 없앴다 |

## 3. 권장 R1~R9

| 항목 | 판정 | 비고 |
|---|---|---|
| R1 균열 | 반영, 수용 | 두 토막 금, 길이 불규칙, 작은 덩이. 거미 읽힘이 약해져 깨진 땅으로 읽힌다 |
| R2 검은 태양 붕괴 | 반영, 수용 | 가닥 6 + 테까지 가는 금. 0번 장(0.1초)에 바람개비·거미 기운이 조금 남았다. 사람 원화 몫으로 둔다 |
| R3 무음 지뢰 붕괴 | 반영, 수용 | 쐐기 5개, 길이·폭이 제각각 |
| R4 박격 가루 | 반영, 수용 | `SPEC.blastDust`와 API §6 식(건너뛰기 25%, 각 ±0.35칸, 가시 1/3)이 있다 |
| R5 갑편 | 반영, 수용 | 각 ±10°, 끝 반지름 126~140. 감소 모션에서도 시계 눈금처럼 보이지 않는다 |
| R6 반짝임 | 반영, 수용 | |
| R7 aura | 반영, r 35로 수용(§4-2) | 층 ally. SPEC과 API §6에 적혀 있다 |
| R8 throw 바늘 | 자르기로 수용(§4-3) | 1x에서 손끝이 1~2px 직선으로 잘린다. 사람 원화 몫 |
| R9 문서 | 반영, 수용 | API §7의 end 문장이 맞게 고쳐졌다 |

## 4. 작업자가 다르게 한 8건

1. **겹실 진폭 1.4: 수용.** 간격 = env·|2·진폭·sin − 0.4|라서 1.6이면 최대 3.6이 되어 내가 준 "≤ 3.2"와 모순된다. 1.4에서 정확히 3.2다. 측정 기준을 따른 것이 맞고, 보기에도 겹실로 읽힌다.
2. **aura r 35: 수용.** 내 "r 28 검토"가 틀렸다.
   - 얼굴 금지 구역의 가장 먼 모서리 (18, −58)은 몸 중심 (0, −32)에서 31.6이다.
   - 먹 층 폭 5의 안쪽 가장자리가 그 밖에 있으려면 r > 34.1이어야 한다.
   - `k4r2r-aura-hero`에서 구역 전체가 고리 안쪽에 여유 있게 든다.
   - 대신 고리가 모자 꼭대기(−67)와 발(+3)을 지난다. ally 층 0.3초 획득 연출이라 수용한다.
   - 철골 보호막(가는 점선 달걀 + 대들보)과도 계속 구별된다.
3. **R8을 자르기로 처리: 수용.** 혹을 달면 감싼 선이 +46까지 뻗어 화살대가 된다는 판단에 동의한다. 자르기 좌표(팔 높이 띠 y −42~−22에서 x > 22.5)는 주인공 throw 2번 장에 묶여 있으니 굽기 체크리스트에 넣는다(§7).
4. **선택안 "옆으로 선 엽전" 제외: 수용.** 원래 선택이었다.
5. **폭주 시작 높이 y +1: 수용.** 박스 여백(C7) 때문이다. 발선 바로 아래에서 시작해 보기에도 문제없다.
6. **회복 실 앞끝 +5.5(r5보다 0.5 밖): 수용.** 내가 준 좌표다. 낫에 둔 허용치(1 이내)와 같은 수준이다.
7. **집행 땀 틈 확대**(3.2/3, 보스 3/2.9/2.8, 팝 r 4.4·틈 2.2/2): **수용.** 둥근 끝 먹 층 2.6보다 틈이 좁으면 땀이 이어져 사슬이 된다. 호는 110°/116°로 120° 안이다.
8. **각성 무음 지뢰 가시 관의 종이 빛을 crown ≥ 0.5에서만: 수용.** §1.7(같은 높이 점 쌍)을 스스로 찾아 고친 것이다.

## 5. 넘겨받은 결정 2건과 남은 수정

**분신 fill 비교안(p50 α 0.2): 채택하지 않는다.**
- `k4r2r-clone-ch5-08`과 `k4r2r-clone-grounds-1x`에서 선만 쓴 기본안이 Ch5 0.8x, α 0.8 기준을 넘는다.
- fill은 분신을 "밝은 덩어리"로 만들어 주인공의 밝은 면과 겨룬다(P1). 얻는 판독은 작다.
- `stamp(…, {fill:true})`는 굽지 않는 예비안으로 둔다. 실제 게임 캡처(§7 장면 d)에서 약하면 다시 본다.

**분신 α: 0.8.** ink500 외곽으로 0.8에서도 읽힌다. 0.9는 주인공 무게에 가까워진다. 게임 캡처로 한 번 더 확인한다.

**남은 수정 1건(권장, 굽기를 막지 않음): 동전 각성 팝**
- 대상: `POP_SYMBOL.coinFever`(`k-skills-vfx.js:1110-1115`)의 각성 갈래만. 평상은 그대로 둔다.
- 처방
  - 기울기 −20° → −34°(가로 아몬드에서 대각선 원판으로)
  - 눌림 0.55 → 0.7
  - 중심 (−1, 2) → (−2, 3)(원판 정중앙에서 비킴)
  - 두께 테 p300이 아래 오른쪽에 1.2 이상 보이게
  - 구멍 위쪽 안벽 띠(p300)가 0.8 이상 보이게 해서 "검은 눈동자"가 아니라 "뚫린 구멍"으로 읽히게 한다.
- 합격: C8 1x에서 기운 두께 있는 엽전으로 읽히고 눈(가운데 동공이 있는 아몬드)으로 읽히지 않는다. C7 0.
- 다음 킷 라운드에 하고, 다시 굽는 것은 1장이다.

## 6. 지시서 정정 추가 (`docs/art/briefs/skill-vfx.md`, 1차 §7에 더함)

- §3.1: 겹실 진폭 1.4(중심 간격 ≤ 3.2)
- §3.15: aura 반지름 **35**, 층 ally. 1차 §6 R7의 "r 28 검토"는 철회한다.
- §3.16: 폭주 시작 y +1, 꼭대기 −30. 팝 선택안(옆으로 선 엽전)은 뺀다.
- §3.17: 땀 틈 ≥ 먹 층 굵기(2.6)보다 넓게(표식 3.2/3, 보스 3/2.9/2.8). 팝은 r 4.4.
- §3.8: throw 2번 장 손의 바늘은 선 사본에서 잘라 낸다(x > 22.5, y −42~−22).
- §9-1: 분신 α 0.8, fill 없음.

## 7. 굽기·연결 때 확인할 것: 1차 §8에서 바뀐 것

**바뀌거나 더해진 것**
1. **parts**: `coinFever/frenzy-awakened` 96×48 / (48,38) / 층 **ally**. 렌더러는 이 조각을 ground가 아니라 allyAttacks 층에 그린다. 박스 넓이 849,600.
2. **SPEC**(매니페스트 `skillVfx.spec`에 그대로 실림). 렌더러가 API §6 식을 그대로 옮긴다.
   - `aura`: stitchR **35**, layer ally
   - `wardRing.plates`: angleJitter 10, toMin 126, seed 9. 갑편 i의 각·끝 반지름은 jit로 정한다. 감소 모션은 r_i에 바로 둔다.
   - 새 키 `blastDust`: every 40, jitter 0.35, skip 0.25, spike 0.33, seed 5, reach 7. 가루 자리·건너뛰기·변형을 jit로 정하고, minimal에서 뺀다.
3. **굽지 말 것**: `stamp`의 `fill` 옵션. 굽기 호출은 `{ frame }`만 넘긴다.
4. **굽기 체크리스트에 더할 줄**: 주인공 스프라이트가 바뀌면 분신 21장의 C1·C7, 얼굴 crop(26,4,60,48, 8x), throw 2번 장 자르기 위치(x > 22.5, y −42~−22)를 다시 본다. 감싼 선 점 목록과 자르기 좌표가 주인공 프레임에 묶여 있다(API §1).
5. **렌더러 상수**: 분신 α 0.8.
6. **`npm run test:visual` 장면에 더할 것**
   - 동전 폭주를 idle과 달리기 주인공에 겹쳐 본다(양쪽 엽전이 보이는지).
   - 회복 실 획득 오라 r 35를 주인공 위(ally)에 그린다(모자 꼭대기·발을 지나는 것 확인).
   - 박격 착탄 가루와 종이 갑주 밀침의 갑편이 불규칙한지, 감소 모션에서도 그런지 본다.
   - 1차 §8-5의 d(분신, 5장 바닥, 0.8배)는 α 0.8로 본다.

**그대로인 것**
- KIT_FILES 순서(`k-hero.js` 뒤)
- 공통 팩 펼치기와 키 체계 `skill/<group>/<part>/<frame>`(188장, 아직 처음 굽는 것이라 "다시 구울 53장"은 따로 처리할 일이 없다)
- 렌더 전용 데이터 목록(폭주 남은 시간 포함)
- 예산·bench·test:unit 확인
- 1차 §8-5의 a~h 장면

## 8. 사람 원화가 몫 (작업자 §7에 동의)

- 동전 각성 팝 28px 다듬기(위 수정을 못 하면 이쪽으로)
- 분신 throw 2번 장의 잘린 손끝, 선 사본 이중 윤곽
- 균열·붕괴 0번 장의 최종 실루엣(특히 검은 태양 붕괴의 바람개비 기운)
- 집행 표식·동전 팝·회복 실 매듭의 최종 기호
- 엽전 3/4 원근, 붓 질감(분필·소용돌이·코로나·일식 획)

열린 질문은 1차 §10의 2·3·4(allyZone 정렬, 일식 바퀴살, 폭주 데이터)가 그대로 남는다. 1번(분신 α)은 0.8로 정했다.

> 메인 세션 메모(2026-10-03): 굽기는 메인 세션의 결정에 따라 공통 팩이 아니라 따로 `skills` 팩(`assets/packs/skills/`)에 한다. 188장이 초기 에셋 경고선(3 MB)을 넘길 수 있어서다(지시서 §9-5의 기본안이 정한 대안). 키 체계는 그대로다.
