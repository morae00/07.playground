# API — `k-hazards.js` · `PN.hazards` v1.0-d2r2 (위험지형 7종 + 주인공·적 오버레이 — 납품 2, 검수 3차 수정판 + 검수 4차 N1)

작업 지시서: `docs/art/briefs/terrain-hazards.md`(K11, R5 추가 발주 B6). 우선순위는 §15 검수 3차 정정 > §14 검수 2차 정정(S1~S5, §14-7 공용 틀) > §13 검수 1차 정정(R1~R8, §13-10) > §12 메인 세션 정정 > 본문이다.
- §15: 2D 위치는 jit 두 값의 짝으로 뽑지 않고 Kronecker 열(`kron`, `scatter` pool 'kr')로 뽑는다(불 몸 무더기·char만 승인 예외). 물에 긴 수면 획 `wave-a`·`b`(W1, 물 상한 20/10/3), 묶임을 땅에서 올라와 감는 나선으로(B1), 속박 덩굴 clamp(round(r/8.5), 3, 6)(R1).
- §12: 열린 질문 Q1~Q13은 모두 권고안이다. 불 테는 먹 + 산호이고 해칭이 없다. 그림에서는 가운데 기호를 빼고 바닥 그림으로 구분한다. **null 산호 링은 끈다**(Q3). 불 위 적은 발밑 불길만 그리고 몸 물듦이 없다. 주인공은 곱하기 산호 물듦이다.
- §13: 몸 무더기는 m/l만 쓴다. 치마 대신 s 무더기 테두리 고리를 두른다. 낮은 불길은 작은 무더기 문법으로 그린다. 불티를 키우고, 테 안쪽에 열 띠를 넣고, 그을음 개수를 늘린다. 납품 2 전 공용 틀(§13-10): 솟는 조각은 inset 도우미, 바닥 조각은 내접 타원 ≤ r − 2, `_.check()`에 종류별 면적.
- §14: 몸 무더기 개수를 넓이에 비례시키고 최선 후보로 흩는다. 고리는 먼 테에서 안으로 옮기고 `skirt-low`를 지운다. 상한은 고리를 고르게 솎는다. 합격선은 덮임(정의 B) ≥ 45%, 빈 자리 ≤ 44다. §14-7: 솟는 조각은 `rimPlace`/rimDist 'rise', 바닥 조각은 rimDist 'ground', 흩는 것은 모두 `scatter`, 상한은 `capCut`, 종류별 `MASKS`로 `areaOf` 면적을 보고한다.

스타일 기준: 바이블 v1 §3·§4·§5.3·§6·§7.2·§12·§13·§15, v1.0 부록 §10.3(용광의 입: 검은 불꽃 + 산호 판정 코어, 꺼진 뒤 무해한 그을음).
킷 출력은 잠정 아트다(바이블 §15). 붓 실루엣과 비백은 사람이 다시 긋는다(§14).

**도감 아이콘 추가(2026-10-26, 전체 점검 art P2-2·kit P2-2)**: `PN.hazards.icon(kind, {ch})`와 그 자료 `PN.hazards.ICON`을 더했다(§16). 더하기만 했다. 조각·layout·paths·draw·overlay·SPEC은 한 글자도 바뀌지 않았고(§16.5 해시), 매니페스트가 움직이지 않도록 `version`은 `'1.0-d2r2'` 그대로다.

**이 판은 납품 2의 검수 3차 수정판(v1.0-d2r1)에 검수 4차 N1을 더한 판(v1.0-d2r2)이다.** 납품 2(v1.0, 285장)에서 W1·B1·R1·R2를 바꿨고, d2r2는 null 유령 선의 중심 거리(N1)만 바꿨다(`paths('null')`·`draw('null')`만 달라진다. 조각 297장은 d2r1과 같다).
- 들어 있는 것: 공용 틀, 7종 전부(fire·shock·slow·water·root·trap·null)의 모든 상태, 주인공 오버레이 back·front·embers·bind-back·bind-front, 적 발밑 불길 mob/front-12·19·28.
- `kinds`·`groups`·`states`는 7종·9그룹 전체이고 `planned`와 같다.
- **불(fire)의 출력은 수정 2회차(`1.0-d1r2`)와 같다.** C9 불 벡터 넷, 불티 벡터 다섯, 반경별 덮임·빈 자리 표가 그대로다(§12.1). 공용 `scatter()`에 더한 선택 키(`pool`, `mirror`)와 `kron`은 불이 쓰지 않는다.
- v1.0 대비 바뀐 출력: water(새 조각 `wave-*`, 배치·prio·상한), root(덩굴 6개), hero bind-back·bind-front(8장 다시 그림), slow(기포 위치·위상만), null(부스러기와 유령 선). shock·trap·fire·hero back/front/embers·mob은 그대로다.

## 1. 로드와 의존

```html
<script src="kit/lib.js"></script>
<script src="kit/k-env.js"></script>
<script src="kit/k-hazards.js"></script>  <!-- window.PN.hazards -->
```

- 굽기에서는 `scripts/build-atlas.mjs:11`의 `KIT_FILES`에서 `k-env.js` 바로 뒤에 둔다. 리뷰 시트는 파일 이름순으로 자동으로 읽는다.
  - 도감 아이콘(§16)을 굽는 UI 굽기(`scripts/build-ui-art.mjs:17`의 `KIT_FILES`)에도 `k-env.js` 바로 뒤에 `'k-hazards.js'`를 넣어야 한다.
- 다른 킷 모듈은 부르지 않는다. 덫 기계 조각만 `PN.env.CH[ch]`의 light·base·deep·spot을 읽고, 도감 아이콘이 바닥 색으로 `PN.env.CH[ch].base`를 읽는다(읽기 전용, `PN.env`가 없으면 ink500). `E.uid`·`E.mix`·`PN.env.hazard`는 부르지 않는다.
- 반환은 늘 `<g class="hzd …">` 하나이고 자기 `<defs>`를 가진다.
  - id를 쓰는 그림은 `draw('slow'|'root')`의 해칭 패턴 하나다. 호출마다 `hzd<N>_h<k>`이고 되감지 않는다(`Ctx().uid`).
  - 조각(stamp)과 오버레이는 id를 쓰지 않는다(필터·패턴·클립 없음).
- 결정적이다. `Math.random`·`Date`를 쓰지 않는다.
  - `layout`·`paths`와 슬롯 계산은 `SPEC.jit`(해시와 Kronecker 상수 `kron`)만 쓴다.
  - 조각 안의 고정된 들쭉날쭉함(숯불 바닥, 얼룩·웅덩이 가장자리, 돌 조각, 덫 그물)만 고정 seed의 mulberry32를 쓴다.
  - id를 빼면 같은 호출의 출력은 바이트 단위로 같다.
- 조각은 모두 채움(fill) 다각형이다. 선(stroke)이 없으므로 `getBBox()`가 칠한 범위 전체를 잰다(C7). `draw`의 테·열 띠·섬광 띠·균열·다이얼·바퀴살·유령 선만 SPEC 층을 그린 선이다.
- `<text>`, 블러, 그라데이션, 혼합 모드, `<image>`, 종이결이 없다. 색은 §7.1 토큰과 덫의 장 재질색뿐이다(C6 `bad colours=0 banned=0`).

## 2. 단위·좌표·판정

- 단위는 월드 단위이고, 1440×900 줌 1.0의 1x px다. 조각은 `scale: 1`로 @2x에 굽는다. **조각은 늘이지 않는다.**
- `draw` 원점은 지형 중심이고 시뮬 (x, y)다. **판정 원은 `Hazard.radius` 그대로**이고 테 중심선이 r에 온다(V4).
- `overlay` 원점은 발(판정 원 중심)이다. 오른쪽을 볼 때 그리고, `facing: -1`이면 x를 반전한다.
- 조각 박스는 [0, w] × [0, h]이고 `anchor`가 배치점에 놓인다. 칠한 영역은 박스 가장자리에서 3 안쪽이다(C7 1줄 0건).
  - 솟는 조각(불길·덩굴·기포·core)의 앵커는 땅에 닿는 밑동이다.
  - 바닥 조각(z `ground`: char·웅덩이·물결·수면 획·흐름·반짝임·부스러기·돌 조각·덫 기계)의 앵커는 박스 가운데다(돌 조각 `pebble`만 밑동 5,8).
- 불길·덩굴·기포는 회전하지 않는다. 좌우 반전(`flip`)만 하며, 반전은 앵커를 축으로 한다: `translate(x y) scale(-1 1) translate(-ax -ay)`. 솟는 것은 언제나 화면 위쪽으로 솟는다.

## 3. 공개 API

```js
PN.hazards = {
  version: '1.0-d2r2',
  K,            // 토큰(§7.1). SPEC 이름(ink, ink700, voidPaper, hostile …)과 짧은 이름(ink7, host …) 둘 다
  kinds,        // ['fire','shock','slow','water','root','trap','null']
  groups,       // kinds + ['hero','mob']
  states,       // {fire:[burn,ignite,gutter,soot], shock:[telegraph,burst,decal], slow:[static], water:[static],
                //  root:[emerge,static,wither,faded], trap:[armed,spring,shut], null:[erase,static,restore]}
  META,         // 7종: owner, 게임 반경, 상태 창, delivery(1|2)
  SPEC,         // §7. 숫자·토큰 이름·영어 문자열만(함수·한글 없음) → 매니페스트에 그대로
  jit,          // jit(seed, i) → 0..1
  planned,      // 전체 계약(= kinds·states·groups, heroLayers 5)
  parts(group),                                           // → [{part, frames, drive, fps, seconds, still, box, anchor, layer, z, lod, flash, ch}] (복사본)
  stamp(group, part, { frame }),                          // 굽는 조각(로컬 박스). frame은 [0, frames−1]로 자른다
  layout(kind, r, seed, { lod, ch }),                     // → [{part, x, y, flip, phase, z, prio}] (§8)
  paths(kind, r, seed),                                   // shock → {cracks}, null → {ghost, jag}. 값은 모두 선 목록 [[x,y],…][]. 나머지 {}
  draw(kind, state, { r, ch, t, p, seed, lod, reduced, flash, end }),  // 참고 합성(리뷰·골든). 원점 = 지형 중심
  overlay(group, layer, { t, p, r, facing, reduced, lod }),           // 'hero': back|front|embers|bind-back|bind-front, 'mob': front. 원점 = 발
  icon(kind, { ch }),                                                  // 도감 아이콘(§16). 원점 = 판정 원 중심, 로컬 박스 −32…32
  ICON,         // 도감 아이콘 자료(얼려 있음, §16.2). SPEC 밖이라 매니페스트에 들어가지 않는다
  _,            // 검사용(굽기·렌더러는 쓰지 않는다). §12.2
};
```

`_`(검사용)의 내용:

| 이름 | 하는 일 |
|---|---|
| `check(o)` | 위반 목록(빈 배열 = 통과). 몸 무더기·고리의 inset과 먼 테, 종류별 면적 규칙(`AREA_RULES`), 혀 규칙. `{areas: false}`면 DOM이 필요한 면적 검사를 건너뛴다 |
| `measure(o)` | 실측 숫자: 무더기 6종 × 루프 6장, 낮은 불길 5종 × 전 장, 불티 0~3번 장, 종류별 덮임·빈 자리(`area` 키: fire 반경 16개, slow·root·water는 `AREA_RULES`의 반경 × seed). DOM이 없으면 null |
| `areaOf(kind, r, seed, {step, holeStep, t, ch})` | 한 지형의 덮임·빈 자리(§8.0-5): {cover(정의 B), strict, fill, ground, hole, n, body}. 마스크는 fire·slow·water·root |
| `rimDist(r, a, box, mode, u, o)` | 테 쪽 조각의 중심 거리 상한(§8.0-1) |
| `scatter(r, seed, o)` · `rimPlace(r, a, box, tip, u, o)` · `capCut(items, cap, o)` | 공용 배치 도우미(§8.0). layout이 쓰는 함수를 그대로 내보낸다 |
| `kron(seed, base)` | Kronecker 열 kr(t, n)(§8.0-0). 납품 2 종류의 모든 2D 뽑기가 쓴다 |
| `AREA_RULES` | 종류별 면적 규칙표(§12.2) |
| `clusterTongues(size, v, mode, fr)` | 불 무더기 한 장의 혀 목록 |
| `emberSlots(r, seed, t, lod)` | 불티 슬롯(§8.3) |
| `heroEmberSlots(t)` | 주인공 불티 슬롯(§8.5) |

| 옵션 | 기본값 | 뜻 |
|---|---|---|
| `r` | 74 | 판정 반경(draw). overlay에서는 적 반경(mob 크기 고르기) |
| `ch` | 1 | 장. 정수 1~5만 받는다. slow 4장은 다이얼, trap은 장별 기계(5장은 1장 그림) |
| `t` | 0 | 초. 루프·cycle 조각과 불티·연기 슬롯의 시계 |
| `p` | 0 | 상태 안의 진행률 0~1(§4) |
| `seed` | 1 | 게임에서는 `Hazard.id` |
| `lod` | `'full'` | `'full'`, `'reduced'`, `'minimal'`. 다른 값은 full로 본다 |
| `reduced` | `false` | 감소 모션 |
| `flash` | 1 | 섬광 세기. SPEC flash 층(불 시작 띠, shock 섬광 띠·core)과 shock 산호 채움의 α에 곱한다. 섬광 감소 설정이면 0.5 |
| `end` | 0 | slow만. 끝 0.5초(`SPEC.slow.end`) 안의 진행률. 웅덩이·기포 α × (1 − end), 테·해칭은 그대로 |
| `facing` | 1 | −1이면 x 반전(overlay) |

**잘못된 호출**은 `console.warn('PN.hazards: …')`을 남기고 정확히 `'<g/>'`를 돌려준다(K7과 같은 문법).
- 모르는 kind·state·group·layer일 때
- `ch`가 1~5의 정수가 아닐 때
- `r ≤ 0`일 때

`layout`은 같은 경우에 `[]`, `paths`는 `{}`를 돌려준다. `parts(모르는 group)`은 `[]`다. `stamp`의 frame이 범위 밖이면 경고 없이 잘라 쓴다. `layout('slow', r, seed, {ch: 4})`는 `[]`다(다이얼만 그린다).

## 4. 상태와 시간 창

`p`는 그 상태 창 안의 진행률이다. 렌더러가 시뮬 시간으로 계산해 넘긴다. **테는 지형이 지워질 때까지 α 1이다(수명 페이드 없음, Q7).** 끝은 끝 상태 그림(gutter·wither·restore·덫 닫힘)이나 아래의 α 경사로 알린다.

### 4.1 fire

'무더기'는 몸 무더기(prio 0)와 테두리 고리의 s 무더기(prio 2)를 함께 이른다. 불길 항목은 모두 무더기다(`skirt-low`는 지웠다, §14-5).

| 상태 | 언제(렌더러) | `draw`의 p | 그리는 것 |
|---|---|---|---|
| ignite | 나이 < 0.25초(수명 있는 불) | 나이 / 0.25 | 원판·char·테와 열 띠(첫 장부터 α 1), 섬광 띠(나이 < 0.12초), 모든 무더기의 `cluster-*-ignite` 장 = min(3, ⌊4p⌋). 불티 슬롯은 없다 |
| burn | 그 사이 + 수명이 무한한 맵 불 전부 | (안 씀, t) | 원판, char, 테와 열 띠, `cluster-*` 루프, 불티 슬롯 |
| gutter | 남은 수명 < 0.5초 | 1 − 남은 수명 / 0.5 | 테와 열 띠 α 1, 모든 무더기의 `cluster-*-gutter` 장 = min(3, ⌊4p⌋), 불티는 새 주기를 시작하지 않음, 마지막 0.2초에 char(α 1 − x) → char-cold(α x) 교차(x = (나이 − 0.3)/0.2), 연기 슬롯 |
| soot | 지형이 사라진 뒤 1.5초(렌더러 기억) | 나이 / 1.5 | 데칼 층: 원판 먹 α 0.16·(1 − p), 같은 자리 char-cold α (1 − p). 테·열 띠 없음. 연기 슬롯(§8.4). minimal에서는 그리지 않는다 |

### 4.2 shock (균열 장교 예고 → 터짐 → 자국)

| 상태 | 언제 | p | 그리는 것 |
|---|---|---|---|
| telegraph | 예고 중(`telegraphPhase` preview·imminent) | 1 − life/maxLife | 균열(SPEC, 자람 g = min(1, p/0.85)^0.7). p < 0.65는 preview: 그린 호(ink 5) + 남은 호 점선(ink 1.5, 2/6) + 안쪽 호박 호(warn 2.6, −3.5), 호는 위에서 시계 방향으로 p/0.65만큼. p ≥ 0.65는 imminent: 먹 테 7 + 호박 점선 3.5(10/5, −3.5) + 방사 눈금 8(ink 3, r − 12 → r + 6) + 돌 조각 `pebble-*`(full만). 가운데 기호는 없다 |
| burst | 터진 뒤 0.25초(새 표시 목록 `shocks`) | 나이 / 0.25 | 산호 채움 α 0.55를 0.1초, 그 뒤 0.25초까지 0으로(× flash). 먹 망점 가장자리 띠(3줄, α = 채움/0.55). 종이 섬광 띠(0.1초, × flash). 균열(먹 + hostileGlow 0.5w + p50 0.18w). `core` 장 min(3, ⌊4p⌋)(× flash). 돌 파편 `shard-*`·먼지 `dust-*` 슬롯(§8.7) |
| decal | 그 뒤 1.2초(데칼 층) | 나이 / 1.2 | 가운데 먹 웅덩이(α 0.2·(1 − p)) + 담묵 균열(ink300 0.6w, α 0.6·(1 − p)). 테 없음. 처음 0.05초는 파편·먼지 슬롯이 마저 끝난다(0.3초 prog) |

- 감소 섬광(`flash: 0.5`): 산호 채움·섬광 띠·core가 α × 0.5다. 채움은 정보라서 끄지 않는다(§5.2).
- 렌더러의 imminent 눈금 맥동(`motionWave`)은 현행 그대로다(`draw`는 정지 그림이다).

### 4.3 slow

| 상태 | p | 그리는 것 |
|---|---|---|
| static | 4장 다이얼만: 진행 = 수명이 있으면 1 − life/maxLife, 무한이면 (t/12) mod 1 | 바닥(렌더러 채움 + 현행 해칭) → 웅덩이 `mire-*` → 기포 `bubble-*`(cycle) → 테. 4장은 웅덩이·기포 대신 다이얼(§7.5). 끝 0.5초는 옵션 `end`로 웅덩이·기포만 옅어진다 |

### 4.4 water

| 상태 | 그리는 것 |
|---|---|
| static | 담묵 원판 → 바닥 조각(수면 획 `wave-*` loop, 물결 `ripple-*` cycle, 흐름 `flow-*` loop, 반짝임 `glint` loop, y 순) → 젖은 테. 신호색·해칭 없음. 감소 모션에서 수면 획은 phase 장에 멈추고(info), 흐름·반짝임은 그리지 않는다 |

### 4.5 root

| 상태 | 언제 | p | 그리는 것 |
|---|---|---|---|
| emerge | 생긴 뒤 0.25초 | 나이 / 0.25 | 바닥·해칭, `vine-*-emerge` 장 min(3, ⌊4p⌋), 테 |
| static | 그 사이 | (t) | `vine-*` 루프 6fps |
| wither | 남은 수명 < 0.4초 | 1 − 남은 수명 / 0.4 | `vine-*-wither` 장 min(3, ⌊4p⌋) |
| faded | 주인공 속박 면역 중(`player.rootImmunity > 0`) | — | 합성 전체 α 0.35, 덩굴은 phase 장에서 멈춤(현행 `worldRenderer.ts:846`과 같은 뜻) |

**주인공 묶임**(`player.root > 0`, 덫의 묶임은 제외): `overlay('hero','bind-back'|'bind-front',{p})`, p = 묶인 뒤 초 / 0.2, 장 = min(3, ⌊4p⌋), 마지막 장을 유지한다. 묶인 동안 결의 자세(idle·run·hurt)와 facing에 상관없이 같은 조각을 쓴다(§6.7).

### 4.6 trap

| 상태 | 언제 | p | 그리는 것 |
|---|---|---|---|
| armed | 밟히기 전 | — | 쇠판(SPEC) + `armed-ch<c>` |
| spring | 밟힌 뒤 0.15초 | 나이 / 0.15 | 쇠판 + `spring-ch<c>` 장 min(2, ⌊3p⌋)(물림 → 닫힘 → 굳음 + 먼지) |
| shut | 그 뒤 | 마지막 0.6초 안의 진행률(그 전은 0) | 판 α 0.7(`sprungAlpha`) + `shut-ch<c>`. 마지막 0.6초에 판·홈·바퀴살·리벳·기계·테가 α (1 − p)로 사라진다 |

c = ch ≤ 4 ? ch : 1(`SPEC.trap.windows.fallback`).

### 4.7 null

| 상태 | 언제 | p | 그리는 것 |
|---|---|---|---|
| erase | 생긴 뒤 0.3초 | 나이 / 0.3 | void.paper가 가운데부터 들쭉날쭉하게 퍼진다(jag × g, g = 1 − (1 − p)²). 테는 첫 장부터 전부 |
| static | 그 사이 | — | void.paper 원판, 유령 점선(ink300 1, α 0.6, 4/3), 부스러기 `crumb-*`, 테 |
| restore | 마지막 0.5초 | 마지막 0.5초 안의 진행률 | void α 1 − p. 유령 선이 ink300 1.4 실선으로 처음부터 p만큼 다시 그어지고, 점선은 α 0.6·(1 − p). 부스러기 α 1 − p |

산호 링(`SPEC.null.active`)은 **끈다**(`on: false`, §12.3 Q3).

### 4.8 META

| kind | owner | radii(게임) | range | windows(초) |
|---|---|---|---|---|
| fire | hostile | 50, 60, 68, 74, 98, 150 | 50~150 | ignite 0.25, gutter 0.5, soot 1.5 |
| shock | hostile | 190 | 190 | burst 0.25, decal 1.2 |
| slow | hostile | 86, 150 | 86~270 | end 0.5 |
| water | neutral | — | 145~270 | — |
| root | hostile | 50, 52 | 50~52 | emerge 0.25, wither 0.4 |
| trap | neutral | — | 60~98 | spring 0.15, fadeLast 0.6 |
| null | hostile | 120, 130, 170 | 120~170 | erase 0.3, restore 0.5 |

## 5. 굽는 조각 (`parts(group)`) — 297장, 박스 넓이 합 417,736 단위²

- 굽기 키는 `hazard/<group>/<part>/<frame>`이고, 호출은 `['PN.hazards.stamp', group, part, { frame }]`, `scale: 1`이다.
- `fps`는 loop에만 값이 있다(나머지 0). `seconds`는 prog·cycle에만 있다(나머지 null).
- `still`은 cycle의 감소 모션 정지 장이다: `bubble-*` 2, `ripple-*` 3. 불티·연기는 null이다(감소 모션에서 그리지 않는다). loop는 인스턴스마다 ⌊phase·frames⌋ 장에서 멈춘다(§10).
- `z`는 위험지형 층 안의 순서다(`ground` → 매개 선·테 → `flame` → `air`). 몸 층 조각(hero·mob)은 `'body'`다.
- `ch`는 덫 조각에만 있다(1~4). 나머지는 null이다.

| group / part | 장 | drive | fps·초 | box | anchor | layer / z | lod |
|---|---|---|---|---|---|---|---|
| fire / `cluster-s-a`, `cluster-s-b` | 6씩 | loop | 12 | 28×32 | 14,28 | hazard / flame | info |
| fire / `cluster-m-a`, `cluster-m-b` | 6씩 | loop | 12 | 36×44 | 18,39 | hazard / flame | info |
| fire / `cluster-l-a`, `cluster-l-b` | 6씩 | loop | 12 | 48×58 | 24,52 | hazard / flame | info |
| fire / `cluster-{s,m,l}-{a,b}-ignite` | 4씩 | prog | 0.25 | 크기별 같음 | 같음 | hazard / flame | info |
| fire / `cluster-{s,m,l}-{a,b}-gutter` | 4씩 | prog | 0.5 | 크기별 같음 | 같음 | hazard / flame | info |
| fire / `char-a`~`char-d` | 1씩 | idx | — | 44×22 | 22,11 | hazard / ground | info |
| fire / `char-cold-a`~`char-cold-d` | 1씩 | idx | — | 44×22 | 22,11 | ground / ground | deco |
| fire / `ember-a`, `ember-b` | 6씩 | cycle | 0.7 | 12×14 | 6,7 | hazard / air | deco |
| fire / `smoke-a`, `smoke-b` | 6씩 | cycle | 1.0 | 18×34 | 9,30 | hazard / air | deco |
| shock / `pebble-a`, `pebble-b` | 2씩 | loop | 12 | 10×10 | 5,8 | hazard / ground | deco |
| shock / `shard-a`·`-b`·`-c` | 4씩 | prog | 0.3 | 20×20 | 10,16 | hazard / air | deco |
| shock / `core` | 4 | prog | 0.25 | 72×72 | 36,44 | hazard / flame | info, **flash** |
| shock / `dust-a`, `dust-b` | 4씩 | prog | 0.3 | 28×18 | 14,14 | hazard / air | deco |
| slow / `mire-s-a`·`-b` | 1씩 | idx | — | 36×20 | 18,10 | hazard / ground | info |
| slow / `mire-m-a`·`-b` | 1씩 | idx | — | 52×28 | 26,14 | hazard / ground | info |
| slow / `mire-l-a`·`-b` | 1씩 | idx | — | 76×40 | 38,20 | hazard / ground | info |
| slow / `mire-xl-a`·`-b`(추가) | 1씩 | idx | — | 132×60 | 66,30 | hazard / ground | info |
| slow / `bubble-a`, `bubble-b` | 6씩 | cycle | 0.9, still 2 | 14×14 | 7,11 | hazard / flame | deco |
| water / `ripple-a`, `ripple-b` | 8씩 | cycle | 1.6, still 3 | 40×18 | 20,9 | hazard / ground | info |
| water / `flow-a`, `flow-b` | 6씩 | loop | 6 | 44×10 | 22,5 | hazard / ground | deco |
| water / `glint` | 2 | loop | 2 | 14×8 | 7,4 | hazard / ground | deco |
| water / `wave-a`, `wave-b`(W1) | 6씩 | loop | 6 | 100×14 | 50,7 | hazard / ground | **info** |
| root / `vine-a`·`-b`·`-c` | 4씩 | loop | 6 | 26×24 | 13,20 | hazard / flame | info |
| root / `vine-{a,b,c}-emerge` | 4씩 | prog | 0.25 | 26×24 | 13,20 | hazard / flame | info |
| root / `vine-{a,b,c}-wither` | 4씩 | prog | 0.4 | 26×24 | 13,20 | hazard / flame | info |
| trap / `armed-ch1`~`ch4` | 1씩 | idx | — | 82×62 | 41,33 | hazard / ground | info, ch |
| trap / `spring-ch1`~`ch4` | 3씩 | prog | 0.15 | 82×62 | 41,33 | hazard / ground | info, ch |
| trap / `shut-ch1`~`ch4` | 1씩 | idx | — | 82×62 | 41,33 | hazard / ground | info, ch |
| null / `crumb-a`·`-b`·`-c` | 1씩 | idx | — | 12×10 | 6,5 | hazard / ground | deco |
| hero / `back` | 6 | loop | 12 | 50×34 | 25,29 | body-back / body | info |
| hero / `front` | 6 | loop | 12 | 42×24 | 21,18 | body-front / body | info |
| hero / `bind-back` | 4 | prog | 0.2(마지막 장 유지) | 46×24 | 23,19 | body-back / body | info |
| hero / `bind-front` | 4 | prog | 0.2(마지막 장 유지) | 42×24 | 21,18 | body-front / body | info |
| mob / `front-12` | 4 | loop | 12 | 30×19 | 15,14 | body-front / body | deco |
| mob / `front-19` | 4 | loop | 12 | 40×22 | 20,17 | body-front / body | deco |
| mob / `front-28` | 4 | loop | 12 | 56×26 | 28,21 | body-front / body | deco |

| 그룹 | fire | hero | mob | shock | slow | water | root | trap | null | 합 |
|---|---|---|---|---|---|---|---|---|---|---|
| 장 | 116 | 20 | 12 | 28 | 20 | 42 | 36 | 20 | 3 | **297** |
| 박스 넓이(단위²) | 164,496 | 24,696 | 11,624 | 29,968 | 28,624 | 33,824 | 22,464 | 101,680 | 360 | **417,736** |

- 지시서 표(301장)에서 불 치마 18장(R2·S5)을 빼고, 감속 `mire-xl` 2장(§13-16)과 물 `wave-a`·`b` 12장(W1, +16,800)을 더했다.
- v1.0(285장) 대비 새 키는 `hazard/water/wave-a/0..5`, `wave-b/0..5`다. `hazard/hero/bind-back/0..3`, `bind-front/0..3`은 키가 그대로이고 그림만 바뀌었다.
- 테두리 고리는 별도 조각이 없다. 몸 무더기와 같은 `hazard/fire/cluster-s-*` 키를 쓴다(ignite·gutter 포함). `skirt-*` 키는 없다.
- `char-cold-*`의 layer는 `ground`(데칼 층, soot)이지만, gutter 교차 때는 위험지형 층의 char 자리에 같이 그린다.
- shock `shard`·`dust`는 터짐(0.25초)보다 긴 0.3초 prog다. 자국의 처음 0.05초에도 그린다(§4.2).

## 6. 조각 그림 요약

### 6.1 불 무더기(cluster) — 몸 무더기(m·l)와 테두리 고리(s)

- **구성**: 혀 3~5개를 한 실루엣으로 합쳤다.
  - 먹 층 하나(숯불 바닥 + 모든 혀)를 먼저 칠한다. 그 위에 산호 층 하나, hostD 쐐기, glow, p50 열점, 먹 숯덩이를 차례로 칠한다.
  - 한 층은 같은 방향으로 감은 다각형들의 nonzero 합집합이다. 그래서 무더기 안쪽에 이음선이 없다.
- **혀**: 스윕 하나다. 중심선 c(u) = bx + lean·u^1.6 + bend·sin(πu), 반폭 w(u) = w·(1 − u)^1.3·(1 + 0.4·sin(π·min(1, u/0.62))), u는 0(밑동) … 1(끝)이다.
- **산호 몸**: 같은 스윕의 두 변을 수직 거리로 안쪽으로 민 것이다. 빛 쪽(왼쪽) s·m 2.0, l 2.4, 그늘 쪽(오른쪽) s 2.4, m 2.8, l 3.2. 끝은 먹 끝에서 3.2 이상 아래다.
- **변형**: a는 가운데 왼쪽이 가장 높고 바깥으로 기운 혀가 하나 있다. b는 봉우리가 둘이다. 이웃 혀의 높이는 모든 루프 장에서 15% 이상 다르다.
- **숯불 바닥**: 납작한 불규칙 타원(먹 테두리 바깥 s 20.8×8.6, m 28.4×11.6, l 39.6×14.4), 산호 채움 + 먹 테 2, 짧은 glow 줄 둘, 먹 숯덩이 s 2 / m 3 / l 4. 앵커 아래로 s 1, m·l 2까지.
- **glow 심** 8~14%, **p50 열점**, **hostD 쐐기**(m·l).
- **루프 6장 @12fps**: 혀 높이 ±12%, 끝 흔들림 lean ± 2, glow ±10%. 숯불 바닥과 밑동은 움직이지 않는다. 2·3번 장에서 주 혀 끝이 떨어져 나간다.
- **ignite 4장**: 바닥 60% + 불씨 → 혀 40% → 80%(혀 하나 솟음) → 110%.
- **gutter 4장**: 80%(혀 벌어짐) → 50%(glow 꺼짐) → 25% + 연기 시작 → 혀 없음, 작은 빛 점.

**실측**(`_.measure()`, 0.5 격자, 칠한 넓이 = 100, a·b 루프 6장):

| 크기 | 칠한 폭 | 칠한 높이(0번 장 a / b, 전체 범위) | 칠한 넓이 | 먹 | 산호 | hostD | glow | p50 |
|---|---|---|---|---|---|---|---|---|
| s | 20.7~21.1 | 22.8 / 22.3, 19.3~25.4 | 195~238 | 58.0~61.3 | 26.5~31.0 | 0 | 8.1~13.6 | 0.7~0.9 |
| m | 28.2~28.8 | 34.4 / 33.9, 29.2~36.8 | 394~490 | 49.0~52.4 | 32.5~35.9 | 2.5~4.1 | 8.9~13.8 | 0.6~0.7 |
| l | 39.3~40.2 | 45.8 / 45.4, 39.0~48.1 | 682~813 | 48.6~51.8 | 32.5~36.4 | 2.0~3.8 | 9.1~13.9 | 0.7~0.9 |

### 6.2 낮은 불길: hero back/front·mob front (R3, 작은 무더기 문법)

- 무리마다 높이가 다른 혀 3~5개(이웃 차 ≥ 15%)가 산호 숯불 띠에서 솟는다. 돔 몸통과 검은 밑 띠는 없다. 혀의 먹은 빛 쪽 1.4, 그늘 쪽 2.0, 산호 끝은 먹 끝에서 3.2 아래다. 무리마다 glow 심 하나.
- 루프: 혀 높이 ±12%, 끝 흔들림 ±2, glow ±10%. hero 6장, mob 4장.

| 조각 | 무리 / 혀 | 칠한 범위(앵커 원점, 전 장) | 범위 상한 | 먹 % | 산호 % | glow % |
|---|---|---|---|---|---|---|
| hero `back` | 3 / 3·3·3 | x −22.0~21.9, y −25.7~1.9 | [−22, −26]–[22, 2] | 60.8~61.7 | 31.5~33.3 | 5.0~7.5 |
| hero `front` | 2 / 3·3 | x −17.7~17.8, y −14.9~2.9 | [−18, −15]–[18, 3] | 57.9~59.6 | 32.0~34.4 | 6.2~9.2 |
| mob `front-12` | 1 / 4 | x −11.8~10.9, y −10.4~1.8 | [−12, −11]–[12, 2] | 60.0~61.7 | 33.5~34.9 | 3.4~5.8 |
| mob `front-19` | 1 / 4 | x −16.1~15.3, y −13.7~1.8 | [−17, −14]–[17, 2] | 50.7~52.3 | 42.0~43.0 | 4.8~7.2 |
| mob `front-28` | 1 / 5 | x −24.0~22.8, y −17.7~1.8 | [−25, −18]–[25, 2] | 42.3~44.1 | 50.3~52.2 | 4.2~6.6 |

- hero front 장화 먹이 보이는 비율: idle 87.3~90.4%, throw 87.6~92.0%, hurt 61.9~85.7%, run 0·4는 14.3~23.2%(§13 A 예외 승인). 흑립 챙·코트 삼각형·목도리·청록 링은 덮지 않는다.

### 6.3 그을음 조각(char)·불티·연기

- **char-a~d**: ink700 들쭉날쭉한 얼룩(초타원 지수 3.2), 먹 숯덩이 2~4, 빛나는 금 1줄 + 갈래 0~1(먹 2.6 / 산호 1.2 / glow 0.5), 재 부스러기 ≤ 3.
- **char-cold-a~d**: 판 ink700 α 0.55, 숯덩이 ink500 α 0.8, 금 ink300 1.2, 산호 없음, 재 부스러기 7~8.
- **ember-a·b**(박스 12×14, 칠한 크기 ≤ 5×7): 0 굵은 육각 + 넓은 glow 심 → 1 반대로 돈 조각 → 2 각진 물방울 → 3 쉼표 → 4 hostD 심 → 5 ink300 재. 먹 테 0.45~0.78(승인 예외 §13-1). 산호 + glow 58.3 / 56.3 / 59.3 / 63.0%.
- **smoke-a·b**: ink300 한 가닥이 오르며 넓어지고(α 0.7 → 0.55) 3번 장부터 갈라진다.

### 6.4 shock

| 조각 | 칠한 범위(앵커 원점, 전 장) | 그림 |
|---|---|---|
| `pebble-a`·`-b` | x −1.6~1.5, y −4.8~−1.0 | 각진 돌 조각(먹 테 0.55, ink500 면, 좌상 ink300 윤기). 0번 장은 땅에 앉고 1번 장은 1.4 뜨며 아래에 먹 α 0.55 그림자 줄. 둥근 점 아님 |
| `shard-a`·`-b`·`-c` | x −3.5~3.6, y −9.1~−2.9 | 크기가 다른 돌 조각이 장마다 65~80° 돈다. 3번 장은 0.8배 |
| `core` | x −26.1~27.1, y −31.5~13.0 (53×45, 지시서 ≤ 66×66) | 먹 테의 ink700 구덩이(반지름 21×8.4), 구덩이에서 뻗는 금 5(먹 3 / 산호 1.4 / glow, 3번 장은 hostD), 불규칙한 p50 섬광 덩어리 + hostileGlow 테(0·1번 장), 들린 판석 5(윗면 p300, 옆면 ink500, 먹 외곽)가 0~1번 장에 솟고 3번 장에 내려앉는다. 별 모양 아님 |
| `dust-a`·`-b` | x −9.8~10.0, y −10.0~−0.4 | ink300 먼지(α 0.7 → 0.3)가 퍼지고 갈라진다 |

- 균열·테·채움·망점 띠는 SPEC이다(§7.4).

### 6.5 slow — 먹물 웅덩이

- **`mire-*`**: 엽(lobe) 세 개로 흔든 납작한 타원(3/4 시점) + 작은 방울 1~2. 먹 테 2(바깥 윤곽이 칠한 범위), ink700 몸, 좌상 안쪽 가장자리에 ink500 초승 윤기(안쪽 2 → 3.8, xl은 4.6). **웅덩이 안에 점·종이 하이라이트가 없다.** 변형 a·b는 엽 위상이 다르다.

  | 조각 | 칠한 크기(a / b) | 지시서 상한 | 칠한 넓이(`fill`) |
  |---|---|---|---|
  | `mire-s-*` | 26.7×11.6 / 29.5×11.7 | 30×14 | 218 / 220 |
  | `mire-m-*` | 44.4×17.8 / 45.1×18.0 | 46×22 | 523 / 524 |
  | `mire-l-*` | 67.1×27.3 / 68.5×27.6 | 70×34 | 1,218 / 1,220 |
  | `mire-xl-*`(추가) | 118.2×48.8 / 121.2×49.3 | — | 3,893 / 3,900 |

- **`bubble-*`**(칠한 범위 x ±3.8, y −7.6~−0.2): 0 작은 혹 → 1·2 부푸는 돔(좌상 ink500 초승, 점 아님) → 3 늘어난 돔 → 4 터진 먹 고리 + 방울 3 → 5 사라지는 ink300 고리. b는 방울 위치가 반대다. 감소 모션 2번 장.

### 6.6 water — 수면 획·물결

- **`wave-a`·`-b`(W1, 칠한 범위 a x −38~28 × y −2.84~3.00 = 66.0×5.84, b x −44~36 × y −2.80~3.05 = 80.1×5.85, 상한 90×6)**: 한 조각에 끊긴 가로 수면 획 두 줄이다.
  - 줄 [x0, x1, 중심 y, 진폭, 파장, 위상]: a 위 [−38, 22, −1.5, 0.55, 34] / 아래 [−16, 28, +1.5, 0.5, 30], b 위 [−22, 36, −1.5, 0.5, 36] / 아래 [−44, 0, +1.5, 0.55, 30]. 위 줄 58~60, 아래 줄 44 길이, 두 줄 가운데가 14~29 어긋나고 세로 간격 3이다.
  - 줄마다 끊김 자리 둘 [c, φ](a 위 [−22, 0]·[2, 3], 아래 [−2, 1]·[16, 4] / b 위 [−8, 2]·[16, 5], 아래 [−30, 0]·[−12, 3]).
    - 장 f의 끊김 나이 a = (f + φ) mod 6, 자리 c − 6 + 2a, 폭 [0, 4, 6, 6, 4, 0][a]다.
    - 끊김이 장마다 오른쪽으로 2씩 흐르며 열렸다 닫힌다. 두 자리가 3장 어긋나 줄은 늘 2~3마디(최소 마디 8, 틈 4~6)다.
    - 줄 끝은 그대로라 통째로 밀리지 않는다. 마지막 장 → 첫 장에서도 보이는 끊김은 2만 옮긴다.
  - p300 1.6(마디 끝에서 0.8로 가늘어짐) + 0.6 아래 ink300 0.8 그늘선(물결과 같은 토큰). 닫힌 도형·점 없음.
  - 해칭 검사(`k11-r3-water-hatch-check`): 반경 145·200·270 × seed 1~20의 840줄에서 60×60 창 안 같은 길이(±2)·같은 간격(±1.5)·겹친 평행 3줄은 0건이다. 창 하나의 최대 줄 수는 4다.
- **`ripple-*`**(칠한 범위 x −16.4~14.3, y −5.2~5.8): 납작한 고리(ry = 0.3·rx)가 rx 3 → 16으로 퍼지고(바깥 고리 p300 1.6 → 0.8), 2번 장부터 안쪽 고리가 늦게 따라온다(rx 3 → 12). 아래 +0.6에 ink300 0.8 그늘선. 6·7번 장에서 호가 끊기며 사라진다. b는 안쪽 고리가 반대쪽으로 0.8 치우친다. 감소 모션 3번 장.
- **`flow-*`**(x −17~16, y −1.5~2.0): 끊긴 짧은 가로 물줄 둘(p300 최대 1.4, 길이 14·11 / 13·10)이 장마다 오른쪽으로 2씩 흐른다.
- **`glint`**(6.0×1.6): p50 짧은 렌즈(4×1.2 → 6×1.6). 별 모양 아님.
- 청록·장 재질색을 쓰지 않는다(먹·종이만).

### 6.7 root — 먹 덩굴, 주인공 묶임

- **`vine-a`·`-b`·`-c`**(칠한 높이 ≤ 15.5, 폭 17~19): 땅 균열(먹 쐐기, 앵커 아래 ≤ 0.8)에서 나온 가시덤불이다. 긴 낮은 줄기가 기어가다 끝이 일어나 안쪽(+x)으로 작은 갈고리를 말고, 반대쪽으로 짧은 둘째 줄기(굵기 1.8)가 나간다. 주 줄기는 굵기 2.2 → 0.15로 뾰족하게 끝나고(둥근 끝·혹 없음), 바깥 면에 가시 쐐기 3~4(높이 1.7), 좌상 쪽 ink500 윤기 띠. 높이: a 12.4, b 10.5, c 15.4.
- **루프 4장 @6fps**: 끝이 2만큼 흔들린다(x +0.3 → −0.8 → −1.7 → −0.8, 높이 12 이상은 전부, 그 아래는 높이에 비례). 갈고리가 박스 오른쪽 여백에 닿아 있어 안쪽(−x)으로 기운다.
- **emerge 4장**: 균열 + 담묵 흙 부스러기 → 뾰족한 두 끝 → 줄기 62% + 둘째 줄기 70% → 다 자라고 끝이 한 번 더 감김(가시는 같은 자리).
- **wither 4장**: 갈고리가 30°·52° 처짐 → 두 토막 → 토막이 0.55배로 균열에 가라앉는다.
- **`bind-back`·`bind-front`(B1로 다시 그림)**: 덩굴이 발밑 땅에서 나와 다리를 타고 올라 감긴다.
  - **back**(주인공 뒤)
    - 발밑과 양옆의 낮은 가시 뿌리 덩어리(x ±19, y −4.8~+1.7, 윗가장자리 p300 0.8)가 장마다 땅에서 솟는다(높이 0.45 → 1, 폭 0.7 → 1).
    - 양옆에서 덩굴 하나씩이 덩어리에서 실루엣 바깥(x ±17 → ±10)을 타고 y −13.8까지 오른다. 먹 3.6 → 2.4, 빛 쪽 p300 0.8 가장자리, 그늘 쪽 가시 둘(2번 장부터).
    - 묶인 결은 어느 자세에서도 실루엣 양옆에 '땅에서 올라온 덩굴'이 1x로 보인다.
  - **front**(주인공 앞)
    - 다리마다 나선 한 가닥: 다리 오른쪽 가장자리 바로 옆 땅(+1.0, +0.6)에서 나와, 다리 앞을 비스듬히 가로질러 왼쪽 가장자리 y −12.8까지 감아 오른다(다리 x ±6.5, 반폭 6.2, 3/4 시점 처짐 1.6). 두 다리가 같은 감김 방향이라 V자가 아니라 나선으로 읽힌다. 먹 3.4 → 2.4, 그늘 쪽 가시 셋.
    - 발끝마다 짧은 뿌리 고리 하나가 장화를 땅에 붙든다(먹 2.8 → 2.0).
  - 모든 덩굴의 빛 쪽(좌상)에 p300 0.8 가장자리가 있다. 검은 장화와 hurt 자세의 검은 코트 위에서도 덩굴이 남는다(hero 그룹 허용 색 안).
  - 장마다 0.3 / 0.6 / 0.85 / 1만큼 자란다(덩어리·오르는 덩굴 먼저, 나선은 0.45부터). 마지막 장을 유지한다.
  - 칠한 범위(4장 전체, 앵커 원점): back x −19.72~19.39, y −15.79~1.70(상한 [−20, −16]–[20, 2]), front x −13.88~16.15, y −13.21~2.19(상한 [−18, −15]–[18, 3]). 얼굴 금지 구역과 청록 링(아래 끝 ≤ +3) 밖이다.
  - 1x 비교(`k11-r3-bind-x1`, `-x1-gray`): idle·run 0·run 4·hurt 0 × facing ±1의 16칸 모두에서 묶인 결이 구별된다. 4배(`k11-r3-bind-x4`)에서 덩굴이 다리를 감는다.

### 6.8 trap — 장별 기계(판은 SPEC)

| 장 | armed | spring 3장 | shut | 칠한 범위(최대) |
|---|---|---|---|---|
| ch1 쥐덫 | 쇠 바닥판(먹 테 + 장 deep) 위 먹 이빨 고리(p300 이빨 16), 압력판(ink500), 왼쪽 용수철 코일 | 두 턱 막대가 위아래에서 다가와(6 → 0) 맞물리고 흔들림 1.2 + 먼지 | 맞물린 턱 + 금 두 줄 | 73.3×44.0 |
| ch2 쇠사슬 올가미 | 사슬 고리(먹 1.5, 짝수 고리 p300 윤기) 올가미 + 늘어진 사슬 + 말뚝(먹 + p300 윤기) | 올가미가 0.62 → 0.38 → 0.32로 조인다 + 장 deep 그늘 | 조여진 올가미 | 73.3×41.8 |
| ch3 젖은 쇠그물 | 쇠고리(먹 4 + 장 deep 1.4) + 고르지 않은 그물코(먹 1, 마디를 흔들고 연결을 4곳 중 1곳 뺌) + 장 light 물방울 5 | 그물이 들리며 0.75 → 0.42로 오므라든다 | 오므라든 그물 + 물방울 3 | 73.3×36.1 |
| ch4 톱니 | ink700 톱니 18(먹 외곽), p300 날 가장자리 9, ink500 고리, 장 spot 바퀴통 | 10° → 22° → 30° 돌며 ink300 회전 호 둘 | 34° 돌아 기울어진 톱니(세로 0.9배) | 73.3×42.1 |

- spring 장의 먼지(ink300 납작 덩어리, α 0.7 → 0.45)와 shut의 먼지·금 한 줄은 모든 장 공통이다. 평행 그물선 3줄, 둥근 밝은 점은 없다.

### 6.9 null — 지우개 부스러기

- **`crumb-a`·`-b`·`-c`**(칠한 크기 4.8~5.2 × 3.2~3.4): voidp 채움 + ink300 0.8 테의 말린 조각. b는 말린 자국 한 줄(ink300 0.4)을 더한다.

## 7. SPEC — 렌더러가 그리는 매개 도형과 배치 상수

### 7.1 토큰(`K`)과 palette.ts

| SPEC 이름 | 짧은 이름 | 킷 hex | palette.ts |
|---|---|---|---|
| `ink` | — | #121110 | NEUTRAL.ink |
| `ink700` | `ink7` | #2B2926 | NEUTRAL.inkSoft |
| `ink500` | `ink5` | #46423D | (조각 안에서만) |
| `ink300` | `ink3` | #8C8579 | NEUTRAL.inkMuted |
| `ink100` | `ink1` | #BCB4A5 | (쓰지 않음) |
| `p50` | — | #FAF6EC | NEUTRAL.paperBright |
| `p100` | — | #F3EEE2 | NEUTRAL.paper |
| `p300` | — | #D8D0C0 | NEUTRAL.paperShadow |
| `voidPaper` | `voidp` | #E2DBCB | 신규 NEUTRAL.voidPaper #e2dbcb |
| `hostile` | `host` | #EF5B4F | SIGNAL.hostile |
| `hostileDeep` | `hostD` | #B8352B | SIGNAL.hostileDeep |
| `hostileGlow` | `hostG` | #FFE4DF | SIGNAL.hostileGlow |
| `warn` | — | #D88D16 | SIGNAL.warn |
| `warnGlow` | `warnG` | #FFF0C9 | SIGNAL.warnGlow |

굽기는 `COLOR_MAP`이 킷 hex를 구현값으로 바꾼다. SPEC에는 ink500·ink100·청록·연두·자수정을 쓰지 않는다. 덫 조각의 장 재질색은 `PN.env.CH[c]` 값이 그대로 구워진다.

**소속**(C6, `palette.test.ts`): fire 산호·중립 / shock 호박·산호(채움·core)·중립 / slow·root 호박(테·해칭·다이얼)·중립 / null 호박(테)·중립(산호 링 꺼짐) / water·trap 중립(+ 덫 장 재질). 조각 중 산호는 fire·hero·mob·shock `core`에만 있다.

### 7.2 표기
- 층 행은 `[토큰, 굵기, r에서 중심선까지 오프셋(안쪽 −), α(생략 1), dash(선택)]`이다.
- 굵기는 선 전체 폭이다. 판정 크기와 함께 바뀌지 않는다. 층은 적힌 순서대로 그린다(앞 행이 아래).

### 7.3 공통·fire·hero·mob

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `jit` | {mul 31, hash 2654435761, mod 1000, kron [0.7548776662466927, 0.5698402909980532, 0.6287067210378087, 0.5385972572236101, 0.4614032426986125]} | J(i) = `((Math.imul(seed*31 + i, 2654435761) >>> 0) % 1000) / 1000`. `kron`은 Kronecker 열 kr(t, n)의 걸음이다(§8.0-0). 2D 뽑기는 모두 이것을 쓴다 |
| `caps` | {stamps [160, 90, 40]} | 한 화면 모든 지형 조각 수(full / reduced / minimal) |
| `fire.base` | {token ink, alpha 0.30} | 반경 r 원판, 평면 |
| `fire.rim` | [[hostile, 6, −9, 0.35], [ink, 5, 0], [hostile, 2.4, −3.6], [hostileGlow, 0.8, −3.6]] | 실선 원. 첫 행이 열 띠(R5, r − 12 ~ r − 6)다. soot를 뺀 모든 상태·LOD |
| `fire.size` | {m 56} | 몸 무더기: r < 56 → m, 그 밖 l(R1). s는 테두리 고리 전용 |
| `fire.windows` | {ignite 0.25, gutter 0.5} | §4.1 |
| `fire.ignite` | {flash {layers [[hostileGlow, 3, −7]], seconds 0.12, flash true}} | 섬광 띠 α × flash |
| `fire.gutter` | {coldCross 0.2} | 불티 새 주기 금지, 마지막 0.2초 char → char-cold |
| `fire.soot` | {seconds 1.5, base {token ink, alpha 0.16}, chars 'char-cold', caps [12, 6, 0]} | 데칼 층, α × (1 − 나이/1.5) |
| `fire.layout.cluster` | {area 1000, min 3, max 10, maxBig 16, big 100, minimal 3, tries 60, cand 6, reach {frac 0.6, pad 30}, gap {frac 0.48, cap 28}, far 6, squash 1.3, fallbackY 0.2, jit {base 3000, stride 5}} | §8.1 몸 무더기 |
| `fire.layout.rim` | {parts [cluster-s-a, cluster-s-b], countInset 9, pitch [32, 40], big 100, skip 0.15, angleJitter 0.6, inset {min 12, pad 4, jitter 3}, far 6, farIn 24, reduced 'even', jit {skip 500, angle 540, dist 580, variant 620, flip 660, phase 700}} | §8.1 테두리 고리 |
| `fire.layout.char` | {per 1400, min 2, max 10, maxBig 4, big 100, minimal 2, tries 40, inset 24, gap 0.35, jit {angle 1000, dist 1040, variant 1080, flip 1120}} | §8.1 그을음 |
| `fire.layout.caps` / `prio` / `cut` | [36, 22, 5] / {cluster 0, char 1, rim 2} / {even 2, keep 1} | 한 지형 상한(`capCut`) |
| `fire.embers` | {per 12, min 3, max 8, cycle 0.7, jitter 0.4, rise 34, drift 8, origin {dx [−8, 8], dy [−12, −4]}, jit {dx 1200, dy 1240, period 1280, phase 1320, sign 1360}} | §8.3 |
| `fire.smoke` | {max 3, cycle 1.0, jitter 0.3, start 0.25, stagger 0.25, until 0.6, origin {dy −8}, rise 10, drift 4, jit {period 1500, start 1540, sign 1580}} | §8.4 |
| `fire.caps` | {stamps [72, 40, 20], embers [32, 16, 0]} | 모든 불의 합. 몸 → char → 고리 순, 고리는 지형마다 고르게 솎는다 |
| `hero.tint` | {token hostile, composite multiply, alpha [0.30, 0.12], step 0.25, steady 0.20, fadeIn 0.1, fadeOut 0.15} | 곱하기 물듦 2Hz. 감소 모션·감소 섬광 0.20 고정. X-ray × 0.6 |
| `hero.embers` | {origins [[−18,−12], [−22,−28], [24,−10], [22,−24]], cycle 0.6, jitter 0.3, rise 30, drift 6, outward true, seed 1, jit {period 1400, phase 1440}} | §8.5 |
| `hero.faceZone` | [−8, −58, 18, −34] | 어떤 오버레이도 칠하지 않는다 |
| `hero.clear` | {ring [24, 10.3], back [−22,−26,22,2], front [−18,−15,18,3], bindBack [−20,−16,20,2], bindFront [−18,−15,18,3]} | 칠한 영역 상한(C7 4줄) |
| `mob` | {radii [12, 19, 28], rects {…}, caps [24, 12, 0]} | 적 반경에 가장 가까운 크기. 주인공에게 가까운 순 |

### 7.4 shock

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `shock.rim` | preview {drawn [[ink, 5, 0]], rest {layers [[ink, 1.5, 0]], dash [2, 6]}, inner [[warn, 2.6, −3.5]]}, imminent {layers [[ink, 7, 0]], inner {layers [[warn, 3.5, −3.5]], dash [10, 5]}, ticks {count 8, layers [[ink, 3]], from −12, to 6}}, renderer 'current-without-glyph' | 렌더러는 현행 예고 테를 그대로 쓰고 가운데 글리프만 뺀다. 이 값은 `draw`의 리뷰용 사본이다 |
| `shock.cracks` | {arms 7, start 10, seg 22, segJitter 0.3, turn 0.5, push [3, 5], reach 0.88, branchAt 0.55, branchLen 0.3, branchTurn 0.6, branchSegs 3, grow {full 0.85, power 0.7}, width [3.6, 1.6], jit {arm 2000, seg 2100, segStride 40, side 2090, branch 2400}} | 식 §8.6. 팔 마디 k의 먹 굵기 w = lerp(3.6, 1.6, (k − 1)/(n − 1)), 가지는 lerp(2.0, 1.2, …). 보이는 길이 = 전체 × g, g = min(1, p/0.85)^0.7. 가지는 g > 0.55부터 (g − 0.55)/0.45만큼. 둥근 끝 선 |
| `shock.coreLayers` | telegraph [[warn, 0.4]], imminent [[warn, 0.5], [warnGlow, 0.17]], burst [[hostileGlow, 0.5], [p50, 0.18]], decal [[ink300, 0.6]] | 먹 w 위에 [토큰, w의 배수]를 겹친다. decal은 먹 없이 ink300만 |
| `shock.burst` | {seconds 0.25, fill {token hostile, alpha 0.55, seconds 0.1}, edge {token ink, dots 40, band 14, pitch 6, rows [[−2.5, 2.2], [−7, 1.6], [−11.5, 1.0]]}, flash {layers [[p50, 3, −5]], seconds 0.1, flash true}, shards {count 8, from 0.3, to 0.9, out 14, hop 10, seconds 0.3, jit 7100}, dust {count 8, at −6, seconds 0.3, jit 7200}} | 채움 α: 나이 < 0.1이면 0.55, 그 뒤 0.25초에 0(× flash). 가장자리 망점: 줄 [오프셋, 점 반지름]마다 점 max(40, round(2π(r + 오프셋)/6))개, 홀수 줄은 반 칸 어긋남, α = 채움/0.55. 슬롯 §8.7 |
| `shock.decal` | {seconds 1.2, alpha [0.6, 0], crater {token ink, alpha 0.2, r 0.18}} | 데칼 층. 웅덩이는 0.18r × 0.09r 불규칙 타원. 테 없음 |
| `shock.layout` | {pebble {count 6, arms [0, 2, 4, 6], from 0.4, span 0.3, jit {at 7000, variant 7010, phase 7020, flip 7030}}, caps [6, 0, 0]} | §8.7 |

### 7.5 slow·root

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `slow.rim` = `root.rim` | [[ink, 5.6, 0], [warn, 3, 0], [p50, 0.8, 0]] | 킷 zoneRim과 같다 |
| `slow.hatch` = `root.hatch` | {renderer 'current'} | 현행 바닥 채움(slow `#f3ead7`, root `#efe6d3`)과 해칭 타일(12, 먹 0.8 오프셋 1 아래 호박 2, α 0.6, 오른쪽 위로)을 그대로 쓴다. `draw`는 채움 대신 p100 α 0.92를 깔고 같은 타일을 패턴으로 그린다 |
| `slow.end` | {seconds 0.5} | 끝 0.5초에 웅덩이·기포만 α 1 → 0(`draw`의 `end`) |
| `slow.dial`(4장) | {ticks 24, r0 −14, r1 −6, long −3, every 6, on [[ink, 3.6], [warn, 1.6]], off [[ink, 2, 0, 0.45]], hand {len 0.78, layers [[ink, 3.4], [warn, 1.4]], hub [ink, 4]}, period 12} | 눈금 i: 각 −π/2 + 2πi/24, r + r0 → r + (i mod 6 ? r1 : long), 둥근 끝. 켜진 눈금 = ⌊진행 × 24⌋(i < 켜진 수면 on 층, 아니면 off). 바늘: 각 −π/2 + 2π·진행(감소 모션은 켜진 수/24), 길이 0.78(r + r0), 바퀴통 먹 반지름 4. 진행 §4.3 |
| `slow.layout.mire` | {tiers [[0, m, s, 410], [100, l, m, 1000], [160, xl, l, 1000]], fill {s 220, m 524, l 1220, xl 3900}, target 0.3, min 3, max 18, minimal 3, tries 120, cand 10, reach {frac 1, pad 2}, sep 0.75, squash 2.2, mirror 2, pool 'kr', jit {base 3000, stride 5, small 6000}} | §8.8 |
| `slow.layout.bubble` | {per 30, min 2, max 6, cycle 0.9, spread [0.7, 0.6], still 2, jit 3200} | §8.8. 웅덩이 위 자리·위상은 kron(seed, 3200)(R2) |
| `slow.layout.caps` | [24, 12, 3] | |
| `root.windows` | {emerge 0.25, wither 0.4} | §4.5 |
| `root.faded` | {alpha 0.35} | 주인공 속박 면역 중 합성 전체 α 0.35, 흔들림 정지 |
| `root.layout` | {vine {per 8.5, min 3, max 6, tries 40, cand 6, reach {frac 0.72, pad 99}, gap {frac 0.5, cap 24}, squash 1.2, far 6, mirror 6, pool 'kr', jit {base 5000, stride 5}}, caps [6, 6, 6]} | §8.10. per 12 → 8.5(R1): 반경 50·52에서 6개 |

### 7.6 water·trap·null

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `water.base` | {token ink, alpha 0.24} | 중립. 신호색·해칭 없음 |
| `water.rim` | [[ink, 2.6, 0], [p300, 1.2, −2.4, 0.8]] | 젖은 가장자리 |
| `water.layout` | wave {area 6000, min 2, max 10, minimal 2, tries 60, cand 8, reach {frac 0, pad 28}, gap {frac 1, cap 46}, squash 3, mirror 2, pool 'kr', jit {base 4400, stride 5}}, ripple {per 40, min 3, max 7, still 3, cycle 1.6, spread [0.7, 0.6], tries 40, cand 6, reach {frac 0, pad 24}, gap {frac 1, cap 36}, squash 2, mirror 2, pool 'kr', jit {base 4000, stride 5}}, flow {per 60, min 2, max 5, tries 40, cand 6, reach {frac 0, pad 30}, gap {frac 1, cap 30}, squash 3, mirror 2, pool 'kr', jit {base 4100, stride 5}}, glint {angle −2.356, spread 0.3, at 0.45, jit 4300}, prio {wave 0, ripple 1, flow 2, glint 2}, caps [20, 10, 3], cut {even −1, keep 1} | §8.9. W1로 wave·prio·cut을 더하고 상한을 13/7/1 → 20/10/3으로 |
| `trap.plate` | {token ink700, alpha 0.5} | 판 = 판정 원. 닫힌 뒤 α × 0.7 |
| `trap.rim` | [[ink, 3.4, 0]] | |
| `trap.groove` | [[ink, 1.6, −6, 0.7]] | |
| `trap.spokes` | {count 6, from −6, to 38, layers [[ink, 1.4, 0, 0.5]]} | 살 i: 각 2πi/6 + π/6, 중심에서 38 → r − 6 |
| `trap.rivets` | {per 40, min 8, at −11, size 2, token p300, shape 'square'} | n = max(8, round(2πr/40)), 각 2π(i + 0.5)/n, 반지름 r − 11의 2×2 네모 |
| `trap.windows` | {spring 0.15, fadeLast 0.6, sprungAlpha 0.7, fallback {5: 1}} | §4.6 |
| `trap.layout` | {caps [1, 1, 1]} | |
| `null.base` | {token voidPaper, alpha 1} | |
| `null.ghost` | {lines [4, 6], split 150, dash [4, 3], layers [[ink300, 1, 0, 0.6]], inset 6, minOffset 0.15, jit {base 2200}} | 식 §8.6. 줄의 (각, 거리)는 kron(seed, 2200)(R2). 중심 거리 \|d\| ≥ minOffset·r(N1) |
| `null.rim` | [[ink, 5.4, 0, 1, [0.1, 9]], [warn, 3, 0, 1, [0.1, 9]]] | 둥근 끝 점선. 현행과 같다 |
| `null.active` | {**on false**, layers [[ink, 3.2], [hostile, 1.5]], at 0.9} | §12.3 Q3로 끔(그림을 다시 그리지 않고 켤 수 있다) |
| `null.erase` | {seconds 0.3, jag {points 12, depth 6, jit 2280}} | void = jag(§8.6)를 g = 1 − (1 − p)²배 한 닫힌 Catmull-Rom(구간당 4점) |
| `null.restore` | {seconds 0.5, line [ink300, 1.4]} | §4.7 |
| `null.layout` | {crumb {per 16, min 5, max 9, inset {pad 2, jitter 4}, jit {base 6000}}, caps [9, 0, 0]} | §8.12. kron(seed, 6000)(R2) |

## 8. layout·paths 식과 jit 번호대

### 8.0 공용 배치 도우미 — 모든 종류가 쓰고, 렌더러는 한 번씩만 옮긴다

기호: J(i) = jit(seed, i), frac(v) = v − ⌊v⌋. farOK(x, y, tip, far) = !(y − tip < −√max(0, r² − x²) − far)다.

**jit의 성질(이식 때 알아 둘 것)**: J(i + 1)은 J(i)로 정해진다. frac(J(i) + 0.761)(약 38%) 아니면 frac(J(i) + 0.465)(약 62%)다(2654435761 mod 1000 = 761, 2³² mod 1000 = 296). 간격이 k여도 같다(J(i + k) = frac(J(i) + c_k) 또는 frac(J(i) + c_k − 0.296·m), 예: k = 40이면 +0.336 또는 +0.040). 그래서 jit 두 값으로 만든 2D 점은 단위 정사각형의 직선 몇 개 위에만 있다. 불의 후보(a = 2πJ(ix), d = reach·√J(ix+1))는 seed와 상관없이 같은 나선 두 줄 위에만 놓인다.

**0. 2D 위치 규칙(검수 3차 R2, 지시서 §15-1, 범위는 검수 4차 (2))**
- **2D 위치(두 값이 한 점의 좌표가 되는 경우: 점의 x·y, 각·거리)를 jit 두 값의 짝으로 뽑지 않는다.** 간격이 무엇이든 직선 몇 개 위에 놓인다.
- **범위**: 한 선의 모양 매개(마디의 길이·꺾임·밀기처럼 선 하나를 이루는 값)는 jit을 써도 된다. 다만 결과에 눈에 띄는 규칙성(같은 배치가 되풀이되거나, 같은 각도로 늘어서거나, 한 곳으로 몰리는 것)이 보이면 kron으로 바꾼다.
- 줄 하나의 (각, 중심 거리)는 그 줄의 '자리'라서 2D 위치로 본다(유령 선은 kron).
- 대신 Kronecker 열을 쓴다: `kron(seed, base)` = kr(t, n) = frac(J(base + t) + n·SPEC.jit.kron[t]), t = 0..4, n = 0, 1, 2, ….
  - (kr(0, n), kr(1, n))은 seed로 돌린 R2 격자 점이다(고르게 퍼진다). kr(2..4, n)은 변형·flip·위상 같은 다른 뽑기에 쓴다.
  - `kron` 걸음 [0.7548776662466927, 0.5698402909980532]은 R2 수열(1/φ₂, 1/φ₂²), 나머지 셋은 R3·R4 계열의 무리수 걸음이다.
- 흩는 배치는 `scatter`의 pool 'kr'(+ mirror)을 쓴다. 흩지 않는 2D 뽑기(기포의 웅덩이 위 자리, 부스러기의 칸 안 각·깊이, 유령 선의 각·거리)는 `kron`을 직접 쓴다.
- 한 값만 뽑는 것(팔 하나 위의 위치, 테 위의 각 하나, 변형 하나)은 jit 하나를 그대로 써도 된다(shock 돌 조각·파편·먼지, 물 반짝임 각, jag 점 깊이).
- **승인된 예외**: 불(fire) 전체 — 몸 무더기(S1 후보식), char(각 J(k+1000)·거리 J(k+1040)), 테두리 고리의 칸 안 흔들림(J(i+540)·J(i+580)), 불티·연기 슬롯. 합격한 배치이고 바꾸면 합격선(빈 자리 ≤ 44)을 넘는다(검수 3차 (1)).
- shock 균열 마디의 (길이, 꺾임, 밀기)는 위치가 아니라 선 모양 매개라 jit 그대로 둔다(검수 4차 (2) 수용: 1x에서 규칙성 없이 자연스럽다. 합격한 균열 모양·벡터 유지).

1. **`rimDist(r, a, box, mode, u, o)`**: 각 a 쪽에 놓는 조각의 중심 거리 상한이다.
   - `'rise'`(솟는 조각, 앵커는 밑동): d = r − (max(o.min, hw·|cos a| + o.pad) + o.jitter·u), hw = (box w − 6)/2. o 기본값은 `fire.layout.rim.inset` {min 12, pad 4, jitter 3}.
   - `'ground'`(바닥 조각, 앵커는 박스 가운데): ex = (box w − 6)/2, ey = (box h − 6)/2.
     1. d = r − 2 − √((ex cos a)² + (ey sin a)²)로 시작한다.
     2. 그 타원의 16점(A = kπ/8) 중 중심에서 가장 먼 점 m을 구해 m > r − 2이면 d를 m − (r − 2)만큼 줄인다. 두 번 한다.
     3. 마지막에 − o.pad − o.jitter·u(기본 0)를 한다. 내접 타원 전체가 r − 2 안에 든다.
2. **`scatter(r, seed, o)`**: 최선 후보 흩기. o = {n, tries, cand, reach {frac, pad}, gap {frac, cap}, squash, mode, box, tip, far, inset, fixed, mirror, pool, jit {base, stride}}.
   - reach = max(o.reach.frac·r, r − o.reach.pad), gap = min(o.gap.frac·r, o.gap.cap), sq = o.squash.
   - pool 'kr'이면 kr = kron(seed, o.jit.base)다(§8.0-0).
   - k = 0..tries−1을 차례로 보며, 놓은 수가 n이 되면 멈춘다. k마다 후보 c = 0..cand−1:
     - q = k·cand + c, ix = o.jit.base + q·o.jit.stride
     - (u, v) = pool 'kr' ? (kr(0, q), kr(1, q)) : (J(ix), J(ix + 1))
     - a = 2πu, d = reach·√v, (x, y) = (d cos a, d sin a)
     - 'rise'면 farOK(x, y, o.tip, o.far)이고 d ≤ rimDist(r, a, o.box, 'rise', 0, o.inset)일 때, 'ground'면 d ≤ rimDist(r, a, o.box, 'ground', 0, o.inset)일 때만 후보다.
     - 놓은 점이나 o.fixed가 있으면: dp = 놓은 점과 o.fixed까지의 min hypot(q.x − x, sq·(q.y − y)). **dp < gap이면 버린다.** 점수 s = o.mirror가 없으면 dp, 있으면 min(dp, 2·(r − o.mirror − d)·hypot(cos a, sq·sin a))(원 r − mirror에 비친 자기 거울상을 이웃으로 친다).
     - 아무것도 없으면 s = −hypot(x, y)(가운데에 가장 가까운 후보가 첫 점).
   - 점수가 가장 큰 후보(같으면 앞의 것)를 놓는다. 남은 후보가 없으면 이번 k는 건너뛴다.
   - 결과는 [{x, y, ix, gen: k, w}](놓은 순서). pool 'kr'이면 n번째로 놓은 점(n = 0, 1, …)의 w = [kr(2, n), kr(3, n), kr(4, n)]이고 부르는 쪽이 변형·flip·phase로 쓴다. 불(pool 없음)은 w = null이고 J(ix + 2..4)를 쓴다.
   - o.pool·o.mirror가 없으면 수정 2회차의 불 규칙(S1)과 같은 결과다("dp < gap 후보 버림"은 "최고 점수 < gap이면 건너뜀"과 같다).
3. **`rimPlace(r, a, box, tip, u, o)`**: 테에 붙는 솟는 조각의 거리(S2). d0 = rimDist(r, a, box, 'rise', u, o.inset), d = d0 − k(k = 0, 1, …, d ≥ r − o.farIn) 중 farOK인 첫 d, 없으면 null(버림).
4. **`capCut(items, cap, o)`**: 한 지형 상한(S3). over = 개수 − cap. prio == o.even 항목을 gen 순으로 n개, nd = min(n, over), j = 0..nd−1마다 ⌊(j + 0.5)·n/nd⌋번째를 뺀다. 그래도 넘치면 나머지를 (prio 큰 것, gen 큰 것) 순으로 빼되 prio 0은 o.keep개 아래로 줄이지 않는다. 남은 항목은 입력 순서 그대로.
5. **`areaOf(kind, r, seed, {step, holeStep, t, ch})`**(검사용): full LOD 항목을 그 장(loop는 시각 t, 나머지 0번 장)으로 놓고 `isPointInFill`로 잰다.
   - cover = 항목 ∪ 띠, strict = 항목만, fill = 채움 항목만, ground = 나머지 항목만(모두 πr² 대비).
   - hole = r − inset 안에서 채움 항목이 칠하지 않은 가장 큰 원의 지름(step `holeStep` 마스크, 제곱 EDT, 2·max min(√D·holeStep, (r − inset) − |p|)).
   - `MASKS`: fire {채움 = z flame, 띠 = 열 띠, inset 12}, slow {채움 = `mire-*`, inset 6}, water {채움 = `wave-*`·`ripple-*`·`flow-*`, inset 6, **extent**: 채움을 칠한 픽셀 대신 내접 타원(box − 6)으로 센다 — 획·고리가 흐르며 쓸고 가는 자리}, root {채움 = `vine-*`, inset 6}. shock·trap·null은 흩는 채움이 없어 마스크가 없다.

### 8.1 layout('fire', r, seed, {lod}) — 수정 2회차와 같다

기호: size = r < 56 ? m : l, P = `cluster-<size>-a`, big = r ≥ 100.

**몸 무더기(S1)**:
1. n_c = clamp(round(r²/1000), 3, big ? 16 : 10).
2. scatter(r, seed, {n: n_c, tries 60, cand 6, reach {0.6, 30}, gap {0.48, 28}, squash 1.3, mode 'rise', box P.box, tip P.anchor y, far 6, jit {base 3000, stride 5}}).
3. 항목 {part `cluster-<size>-` + (J(ix+2) < 0.5 ? a : b), x, y, flip J(ix+3) < 0.5, phase J(ix+4), z flame, prio 0, gen k}.
4. 하나도 못 놓으면 {`cluster-<size>-a`, 0, 0.2r, flip false, phase 0, gen 0}.
5. minimal은 앞 min(n_c, 3)개, reduced는 full과 같다.

**테두리 고리(R2, S2, minimal 0)**: pitch = big ? 40 : 32, n_s = round(2π(r − 9)/pitch). i = 0..n_s−1(reduced는 짝수 i만), J(i+500) < 0.15이면 건너뜀. a = 2π(i + 0.5 + (J(i+540) − 0.5)·0.6)/n_s, u = J(i+580), part = J(i+620) < 0.5 ? s-a : s-b, d = rimPlace(r, a, part.box, part.anchor y, u, `fire.layout.rim`)(null이면 버림). 항목 {part, x, y, flip J(i+660) < 0.5, phase J(i+700), z flame, prio 2, gen 100 + i}.

**그을음(R6, S3)**: n_ch = clamp(round(r²/1400), 2, big ? 4 : 10). k = 0..39: 각 2πJ(k+1000), 거리 max(0, r − 24)·√J(k+1040), 받은 것과 hypot < 0.35r이면 버림. 항목 {`char-` + 'abcd'[min(3, ⌊4J(k+1080)⌋)], x, y, flip J(k+1120) < 0.5, phase 0, z ground, prio 1, gen 200 + k}. reduced 앞 ⌈n_ch/2⌉, minimal 앞 2.

**상한**: capCut(몸 + 고리 + char, [36, 22, 5][lod], {even 2, keep 1}). **출력**: ground(y, gen 오름차순) → flame(같은 규칙), 필드 {part, x, y, flip, phase, z, prio}. 렌더러는 지형 id로 상한 전의 세 목록을 캐시하고 LOD마다 거른 뒤 capCut한다.

### 8.2 조각 장 고르기
- **loop**: 감소 모션 또는 minimal이면 min(F−1, ⌊phase·F⌋). 아니면 fps′ = (reduced LOD ? fps/2 : fps), 장 = ⌊t·fps′ + phase·F⌋ mod F. hero·mob 오버레이는 phase 0.
- **prog**: 장 = min(F−1, ⌊p·F⌋).
- **cycle(기포·물결)**: 주기 T = cycle·(spread0 + spread1·frac(7.919·phase)) — 항목 자신의 phase에서 뽑는다. 장 = min(F−1, ⌊F·frac(t/T + phase)⌋). 감소 모션은 `still` 장(기포 2, 물결 3), minimal 물결도 3번 장.
- **cycle(불티·연기)**: 슬롯 식(§8.3·§8.4).

### 8.3 불티 슬롯 (burn, gutter / 감소 모션·minimal 0)
1. E = clamp(round(r/12), 3, 8), reduced ⌈E/2⌉.
2. clusters = layout 출력 순서의 몸 무더기(prio 0). c = clusters[j mod 수].
3. 시작점 = (c.x + lerp(−8, 8, J(j+1200)), c.y + lerp(−4, −12, J(j+1240))).
4. T = 0.7·(1 + 0.4·(J(j+1280) − 0.5)), u = frac(t/T + J(j+1320)). gutter에서는 t − u·T > gutter 시작 시각이면 그리지 않는다.
5. 부호 = J(j+1360) < 0.5 ? −1 : +1, 위치 = 시작점 + (부호·8u, −34u), 장 = min(5, ⌊6u⌋), 조각 = j 짝수 `ember-a` / 홀수 `ember-b`.

### 8.4 연기 슬롯 (gutter·soot / 감소 모션·minimal 0)
1. τ = gutter가 시작된 뒤의 초(gutter 0.5p, soot 0.5 + 1.5p). τ > 1.1이면 없음.
2. k = 0..min(몸 무더기 수, 3)−1(reduced 짝수 k만). t0 = 0.25 + 0.25·J(k+1540), T = 1.0·(1 + 0.3·(J(k+1500) − 0.5)), u = (τ − t0)/T, 0 ≤ u < 1일 때만.
3. 부호 = J(k+1580) < 0.5 ? −1 : 1, 위치 = 몸 무더기 + (부호·4u, −8 − 10u), 장 = min(5, ⌊6u⌋), 조각 = k 짝수 `smoke-a` / 홀수 `smoke-b`.

### 8.5 주인공 불티 (감소 모션·minimal 0)
슬롯 j = 0..3, o = origins[j], T = 0.6·(1 + 0.3·(jit(1, j+1400) − 0.5)), u = frac(t/T + jit(1, j+1440)), 위치 = (o.x + sign(o.x)·6u, o.y − 30u), 장 = min(5, ⌊6u⌋), 조각 = j 짝수 `ember-a` / 홀수 `ember-b`. 왼쪽을 보면 x 반전. 얼굴 금지 구역 ±3을 지나지 않는다.

### 8.6 paths

**`paths('shock', r, seed)` → {cracks}**: 팔 7줄 다음에 가지 7줄(모두 14줄)이다. R = 0.88r.
- 팔 i: a0 = 2π(i + (J(2000 + i) − 0.5)·0.6)/7, 법선 n = (−sin a0, cos a0), 시작점 = (cos a0, sin a0)·10.
  - 마디 k = 0, 1, …(최대 60): ix = 2100 + 40i + 3k, 길이 = 22·(0.7 + 0.6·J(ix)), 방향 = a0 + (J(ix+1) − 0.5)·1.0, 밀기 = (k 홀수 ? +1 : −1)·(3 + 2·J(ix+2)). 다음 점 = 점 + (cos 방향, sin 방향)·길이 + n·밀기.
  - 다음 점이 |q| ≥ R이면 선분과 원 R의 교점을 마지막 점으로 두고 멈춘다.
- 가지 i: 팔 i 길이의 55% 지점에서 그 마디 방향 + side·0.6(side = J(2090 + i) < 0.5 ? −1 : 1)으로 나간다. 마디 길이 = 0.3·팔 길이/3, 마디 k = 0..2: ix = 2400 + 10i + 2k, 방향 = 가지 방향 + (J(ix) − 0.5)·0.6, 밀기 = (k 홀수 ? +1 : −1)·(1.5 + J(ix+1)), R에서 자른다.
- 전체 길이로 돌려준다. 렌더러가 grow(p)로 자른다(§7.4).

**`paths('null', r, seed)` → {ghost, jag}**:
- ghost: n = r < 150 ? 4 : 6줄. kr = kron(seed, 2200). 줄 i:
  - θ = π·kr(0, i), v = kr(1, i)
  - 중심 거리 c = s·(minOffset + 1.1·|v − 0.5|)·r, s = (v < 0.5 ? −1 : +1)(v = 0.5에서도 +1이라 0이 되지 않는다). |c| ∈ [0.15r, 0.7r](검수 4차 N1: 가운데를 지나는 줄이 없어 두 줄이 가운데에서 '十·X'로 엇갈리지 않는다)
  - R0 = r − 6, h = √max(0, R0² − c²), d = (cos θ, sin θ), m = (−sin θ, cos θ). 선 = [c·m − h·d, c·m + h·d](원 r − 6의 현)
  - 이력: v1.0은 J(2200 + i)·J(2240 + i) 짝, d2r1은 kron + c = clamp((v − 0.5)·1.2r, ±0.8r)(가운데 엇갈림 r120·130 16.5%, r170 41%), d2r2가 지금 식(같은 기준 0%).
- jag: **닫힌 선 하나**(12점, 목록의 0번)다. 점 k: (cos, sin)(2πk/12)·r·(1 − (6/r)·J(2280 + k)). 다 지운 크기다. 렌더러가 g배로 줄여 그린다(§7.6).

### 8.7 shock 항목과 슬롯

**layout('shock', r, seed, {lod})**(돌 조각, full만, imminent에서 그린다): j = 0..5, 팔 = cracks 팔[[0, 2, 4, 6][j mod 4]], 위치 = 그 팔 길이의 (0.4 + 0.3·J(7000 + j)) 지점, part `pebble-` + (J(7010 + j) < 0.5 ? a : b), flip J(7030 + j) < 0.5, phase J(7020 + j), z ground, prio 1. capCut(caps [6, 0, 0]).

**파편 슬롯**(burst, 감소 모션에서도 재생 / reduced 짝수 j / minimal 0): u = min(1, 나이/0.3). j = 0..7: 바탕점 = 팔 (j mod 7)이 반지름 (0.3 + 0.6·J(7100 + j))·r에 처음 닿는 점, 방향 = 바탕점/|바탕점|, 위치 = 바탕점 + 방향·14u + (0, −40u(1 − u)), 장 = min(3, ⌊4u⌋), 조각 `shard-` + 'abc'[j mod 3].

**먼지 슬롯**(같은 LOD 규칙): u = min(1, 나이/0.3). j = 0..7: 각 = 2π(j + 0.5 + (J(7200 + j) − 0.5)·0.5)/8, 위치 = (cos, sin)·(r − 6), 장 = min(3, ⌊4u⌋), 조각 `dust-` + (j 홀수 ? b : a).

### 8.8 layout('slow', r, seed, {lod, ch}) — 웅덩이(넓이 목표) + 기포

ch 4는 `[]`(다이얼). 그 밖:
1. **계획**(`mirePlan`): 단 = `mire.tiers`에서 from ≤ r인 마지막 줄 [from, 큰 것, 작은 것, area]. n = clamp(round(r²/area), 3, 18). n_big = clamp(round((0.3·πr² − n·fill[작은 것]) / (fill[큰 것] − fill[작은 것])), 0, n), n_small = n − n_big.
   - 단: r < 100 → m·s, 100 ≤ r < 160 → l·m, r ≥ 160 → xl·l. fill = {s 220, m 524, l 1220, xl 3900}(조각에서 잰 칠한 넓이).
2. **두 번 흩기**: hw = (큰 것·작은 것 box w − 6)/2.
   - 큰 것: scatter(r, seed, {n: n_big, tries 120, cand 10, reach {1, 2}(= r), gap {99, 0.75·(hw큰 + hw큰)}, squash 2.2, mirror 2, pool 'kr', mode 'ground', box 큰 것, jit {base 3000, stride 5}}).
   - 작은 것: 같은 식, n_small, gap 0.75·(hw큰 + hw작은), box 작은 것, **fixed = 큰 것의 점**, jit base 6000.
   - 항목: {part `mire-<크기>-` + (w0 < 0.5 ? a : b), x, y, flip w1 < 0.5, phase 0, z ground, prio 0, gen 단계·100 + 순번}. mire = 큰 것 + 작은 것(놓은 순서).
3. **기포**(full만, 웅덩이가 있을 때): nb = clamp(round(r/30), 2, 6), kr = kron(seed, 3200). b = 0..nb−1: q = mire[b mod mire 수], hx·hy = q 조각의 (box − 6)/2, 위치 = (q.x + (kr(0, b) − 0.5)·0.8hx, q.y + (kr(1, b) − 0.5)·0.6hy + 1), phase kr(2, b), part `bubble-` + (b 홀수 ? b : a), z flame, prio 2, gen 300 + b. (v1.0의 J(ix)·J(ix+1) 짝을 R2로 바꿨다.)
4. **LOD**: full = mire + 기포, reduced = mire 앞 ⌈n/2⌉(큰 것 먼저, 고르게 퍼진 순서), minimal = mire 앞 3. capCut([24, 12, 3], {even 2, keep 1}) — 넘치면 기포를 고르게 뺀다.

### 8.9 layout('water', r, seed, {lod}) — W1

1. nw = clamp(round(r²/6000), 2, 10)(r145 4, r200 7, r270 10), nr = clamp(round(r/40), 3, 7), nf = clamp(round(r/60), 2, 5).
2. **수면 획**: scatter(r, seed, {n: nw, tries 60, cand 8, reach {0, 28}(= r − 28), gap {1, 46}(= min(r, 46)), squash 3, mirror 2, pool 'kr', mode 'ground', box [100, 14], jit {base 4400, stride 5}}) → {part `wave-` + (w0 < 0.5 ? a : b), x, y, flip w1 < 0.5, phase w2, z ground, prio 0, gen i}.
3. 물결: scatter(r, seed, {n: nr, tries 40, cand 6, reach {0, 24}(= r − 24), gap {1, 36}(= min(r, 36)), squash 2, mirror 2, pool 'kr', mode 'ground', box [40, 18], **fixed = 수면 획**, jit {base 4000, stride 5}}) → {part `ripple-` + (w0 < 0.5 ? a : b), x, y, flip w1 < 0.5, phase w2, z ground, prio 1, gen 100 + i}.
4. 흐름: scatter(r, seed, {n: nf, tries 40, cand 6, reach r − 30, gap min(r, 30), squash 3, mirror 2, pool 'kr', mode 'ground', box [44, 10], **fixed = 수면 획 + 물결**, jit {base 4100, stride 5}}) → {part `flow-` + (w0 < 0.5 ? a : b), flip false, phase w2, prio 2, gen 200 + i}.
5. 반짝임: a = −2.356 + (J(4300) − 0.5)·0.6(각 하나라 jit 그대로), 위치 = (cos a, sin a)·0.45r(빛은 좌상), phase J(4301), prio 2, gen 300.
6. LOD: full = 수면 획 + 물결 + 흐름 + 반짝임, reduced = 수면 획 앞 ⌈nw/2⌉ + 물결 앞 ⌈nr/2⌉(흐름·반짝임 0), minimal = 수면 획 앞 2(phase 장 정지) + 물결 앞 1(3번 장 정지).
7. 상한: capCut([20, 10, 3], {even −1, keep 1}) — 넘치면 prio 2부터, 나중 것(gen 큰 것)부터 뺀다. r270 full은 23 → 20(반짝임·흐름 둘을 뺀다).
8. 실측 항목 수(full): r140 10(획 3 + 물결 4 + 흐름 2 + 반짝임 1), r145 11(4 + 4 + 2 + 1), r200 16(7 + 5 + 3 + 1), r270 20(10 + 7 + 3). seed 1~40 모두 같은 수다(r145·200·270). reduced 4 / 4 / 7 / 9, minimal 3.

### 8.10 layout('root', r, seed, {lod})

n = clamp(round(r/8.5), 3, 6)(R1: r50·52에서 6, seed 1~60 모두 6개를 놓는다). scatter(r, seed, {n, tries 40, cand 6, reach {0.72, 99}(= 0.72r), gap {0.5, 24}(= min(0.5r, 24)), squash 1.2, mirror 6, pool 'kr', mode 'rise', box [26, 24], tip 20, far 6, inset 기본 {12, 4, 3}, jit {base 5000, stride 5}}) → {part `vine-` + 'abc'[min(2, ⌊3·w0⌋)], x, y, **flip = x > 0**(말림이 늘 중심을 향한다), phase w2, z flame, prio 0, gen k}. 모든 LOD 같다(info). capCut([6, 6, 6], {even −1, keep 1}).

### 8.11 layout('trap', r, seed, {ch})

항목 하나 {part `armed-ch<c>`, x 0, y 0, flip false, phase 0, z ground, prio 0}, c = ch ≤ 4 ? ch : 1. 렌더러가 상태에 맞춰 `spring-ch<c>`·`shut-ch<c>`로 바꾼다.

### 8.12 layout('null', r, seed, {lod})

full만: n = clamp(round(r/16), 5, 9), kr = kron(seed, 6000). i = 0..n−1: a = 2π(i + kr(0, i))/n, d = rimDist(r, a, [12, 10], 'ground', kr(1, i), {pad 2, jitter 4}), part `crumb-` + 'abc'[min(2, ⌊3·kr(2, i)⌋)], flip kr(3, i) < 0.5, z ground, prio 0. capCut([9, 0, 0]). (v1.0의 J(6000 + i)·J(6040 + i) 짝을 R2로 바꿨다.)

### 8.13 검증 벡터 (C9, 소수 둘째 자리 반올림, phase 셋째 자리)

필드는 [part, x, y, flip, phase, z, prio]다. 원문은 3차 납품서에 있다(메인 세션 이식 시험의 기준).
- 불(수정 2회차와 같음): `fire:50:1` 11항목, `fire:74:7` 20항목, `fire:98:7` 31항목, `fire:150:23` 36항목. 불티 벡터 다섯도 그대로다.
- `shock:190:11` 6항목(돌 조각), paths cracks 14줄 — v1.0과 같다.
- `slow:150:5`(ch 3) 23항목: mire-l 17 + mire-m 1 + 기포 5 — 웅덩이는 v1.0과 같고 기포 다섯의 자리·위상만 바뀌었다(R2).
- `water:200:3`(ch 3) 16항목: 수면 획 7 + 물결 5 + 흐름 3 + 반짝임 1 — 새 벡터(W1).
- `root:52:9` 6항목 — 새 벡터(R1). v1.0의 네 항목은 값까지 그대로이고, 둘(vine-b −17.73,−27.34 / vine-a 17.43,30.88)이 더해졌다(놓는 순서가 같아서다).
- `null:130:11` 8항목, paths ghost 4줄 + jag 1줄(12점) — 부스러기는 d2r1(R2)의 값, 유령 선은 d2r2(N1)의 값이다. jag는 v1.0부터 같다. 원문은 3차 수정 납품서에 있다.

## 9. 그리는 순서(렌더러, `draw`도 같은 순서)

**층 순서(한 지형 안)**: 바닥(원판·해칭) → z ground 조각 → 매개 선(균열·유령 선·다이얼·바퀴살) → 테 → z flame(y 오름차순) → z air.

| kind | 순서 |
|---|---|
| fire | 원판 → char → 테(열 띠 → 먹 → 산호 → glow) → ignite 섬광 띠 → 무더기(y순) → 불티 → 연기 |
| shock telegraph | 균열 → 돌 조각(imminent) → 예고 테(현행) |
| shock burst | 산호 채움 → 망점 가장자리 → 섬광 띠 → 균열 → core → 파편 → 먼지 |
| shock decal(데칼 층) | 웅덩이 → 담묵 균열 → (처음 0.05초) 파편·먼지 |
| slow | 바닥 채움 → 해칭 → 웅덩이(ground) → 기포(flame) → 테. 4장: 바닥 → 해칭 → 다이얼 눈금 → 바늘 → 바퀴통 → 테 |
| water | 담묵 원판 → 수면 획·물결·흐름·반짝임(ground, y순) → 젖은 테 |
| root | 바닥 채움 → 해칭 → 덩굴(y순) → 테. faded는 이 전체를 α 0.35 |
| trap | 판 → 홈 → 바퀴살 → 리벳 → 기계 조각 → 테 |
| null | void 원판(erase는 jag) → 유령 선 → 부스러기 → (active 링, 꺼짐) → 테 |

- **겹친 불**(불길 레인 등): 모든 불의 원판·char·테 → 모든 불의 불길 조각(월드 y순) → 불티·연기.
- **shock 터짐**은 몸 아래 층에 그린다(결을 덮지 않는다, V4·BUG-12).
- **soot·shock 자국**은 데칼 층(처치 얼룩과 같은 층)이다. 렌더러가 id·위치·반경을 기억하고 layout·paths(seed = id)로 자리를 다시 구한다.

**주인공**(`drawPlayerBody`):
1. `overlay('hero','back')`(불 위) · `overlay('hero','bind-back')`(묶임)
2. 외곽 코스메틱
3. 주인공
4. 물듦(곱하기, 불 위)
5. `overlay('hero','front')` · `overlay('hero','bind-front')`
6. `overlay('hero','embers')`

조건: 불길은 `player.burn > 0`, 물듦·불티는 그 위에 `player.shield <= 0`. 묶임은 `player.root > 0`이고 root 지형의 묶임만(덫은 `shut` 그림이 대신한다).

**적**: 스프라이트 적만, 몸 바로 뒤에 `overlay('mob','front',{r})`. 조건 `Entity.burn > 0`, 보스 제외, 주인공에게 가까운 순 24 / 12 / 0. 몸 물듦·테·불티 없음(V2).

## 10. LOD·감소 설정

| 종류 | full | reduced | minimal |
|---|---|---|---|
| fire | 모든 항목, 루프 12fps, 불티 E, 연기 ≤ 3 | 루프 6fps, 고리 짝수 i, char ⌈n/2⌉, 불티 ⌈E/2⌉, 연기 짝수, soot 상한 6 | 몸 ≤ 3 + char 2(phase 장 정지), 고리·불티·연기·soot 0 |
| shock | 균열, 돌 조각 6, 파편 8, 먼지 8 | 돌 조각 0, 파편·먼지 짝수 4 | 균열·core·채움만(돌·파편·먼지 0) |
| slow | 웅덩이 전부 + 기포 | 웅덩이 앞 ⌈n/2⌉, 기포 0 | 웅덩이 앞 3(큰 것) |
| water | 수면 획 + 물결 + 흐름 + 반짝임(상한 20) | 수면 획 ⌈nw/2⌉ + 물결 ⌈nr/2⌉, 흐름·반짝임 0(상한 10) | 수면 획 2(phase 장 정지) + 물결 1(3번 장 정지)(상한 3) |
| root | 덩굴 전부, 6fps | 3fps | phase 장 정지(덩굴은 그대로, info) |
| trap | 기계 1 | 같음 | 같음 |
| null | 부스러기 5~9 | 부스러기 0 | 부스러기 0 |
| 모든 종류 | 테·바닥·해칭·다이얼·균열·유령 선·바퀴살은 모든 LOD에서 그린다 | | |
| hero | back·front·embers·bind | front·bind 그대로 | front 정지, embers 0, bind는 그대로(prog) |

| 설정 | 처리 |
|---|---|
| 감소 모션 | 루프는 인스턴스별 phase 장에서 정지(수면 획도 정지해서 남는다, info). prog(ignite·gutter·emerge·wither·spring·burst·bind)는 재생. 불티·연기·흐름·반짝임 0. 기포 2번 장, 물결 3번 장. 다이얼 바늘은 눈금 단위로 뛴다. 물듦 α 0.20 고정. 흔들림·회전·펄스 없음 |
| 감소 섬광(`flash: 0.5`) | 불 시작 띠, shock 섬광 띠·core·산호 채움 α × 0.5. 물듦 α 0.20 고정 |

## 11. 예산 실측

- **조각**: 297장, 박스 넓이 합 417,736 단위²(상한 330장·45만). @2x 약 167만 px²로 2048² 한 장(419만 px²)에 든다.
- **한 지형 layout 항목**(seed 1·7·23, full / reduced / minimal, 평균 구성):

  | 종류 r | full | reduced | minimal | 상한 |
  |---|---|---|---|---|
  | fire 50 / 74 / 98 / 150 | 11~13 / 19~21 / 31~32 / 36 | 7~8 / 12~14 / 21~22 / 22 | 5 | 36 / 22 / 5 |
  | shock 190 | 6(돌 조각) | 0 | 0 | 6 / 0 / 0 |
  | slow 86 | 21(m 10 + s 8 + 기포 3) | 9 | 3 | 24 / 12 / 3 |
  | slow 110 | 16(l 7 + m 5 + 기포 4) | 6 | 3 | |
  | slow 145 / 150 | 23(l 15 + m 3 / l 17 + m 1, 기포 5) | 9 | 3 | |
  | slow 200 | 24(xl 6 + l 12 + 기포 6) | 9 | 3 | |
  | slow 270 | 24(xl 17 + l 1 + 기포 6) | 9 | 3 | |
  | water 140 / 145 / 200 / 270 | 10 / 11 / 16 / 20(획 3·4·7·10 포함) | 4 / 4 / 7 / 9 | 3 | 20 / 10 / 3 |
  | root 50·52 | 6 | 6 | 6 | 6 |
  | trap 60~98 | 1 | 1 | 1 | 1 |
  | null 110 / 120·130 / 170 | 7 / 8 / 9 | 0 | 0 | 9 / 0 / 0 |

- **덮임·빈 자리**(`areaOf`, §8.0-5. 3차 납품서에 원문 `k11-r3f-area-table`):

  | 종류 r | 채움 | 빈 자리 | seed, 격자 |
  |---|---|---|---|
  | fire 74 / 98 / 150 | 덮임(B) 51.2~52.6 / 47.4~49.7 / 29.8~30.3 | 28.3~30.5 / 33.9~43.3 / 62.2~76.4 | 1·7·23·42·99, 2(수정 2회차와 같음) |
  | slow 60 / 86 / 100 / 120 | 30.8~30.9 / 29.8~30.0 / 29.9~30.0 / 29.8~29.9 | 23.3~36.0 / 30.5~36.0 / 40.2~51.2 / 51.2~62.1 | 1·5·9, 2 |
  | slow 145 / 150 / 160 | 29.9 / 29.8~30.0 / 28.9~30.6 | 56.7~59.4 / 57.3~61.3 / 54.4~61.2 | |
  | slow 200 / 240 / 270 | 30.0~30.2 / 29.8 / 29.2~29.4 | 75.5~77.3 / 95.1~99.1 / 102.5~132.5 | |
  | root 50 / 52 | 3.8~3.9 / 3.5~3.7 | 28.8~39.6 / 34.2~37.9 | 1·5·9, 1(R1: 덩굴 6개, v1.0은 2.4~2.6% / 38.6~44.2) |
  | water 145 / 200 / 270 | 자리(extent) 5.8~5.9 / 4.7~4.9 / 3.7 | 81.2~98.1 / 106.2~113.8 / 130.2~148.0 | 1·3·7, 2(W1: v1.0은 2.2~2.3 / 1.6 / 1.2~1.3, 빈 자리 116~201) |

  - 웅덩이는 모든 반경에서 25~35% 안(28.9~30.9%)이다(R2로 바뀐 것은 기포뿐이라 같은 값). 빈 자리는 웅덩이 크기와 함께 커진다(지름 대비 약 0.2~0.25).
  - 물의 '자리'는 수면 획(내접 타원 94×8)·물결·흐름이 흐르며 쓸고 가는 넓이다. 획은 가로로 길고 얇아서 넓이 비율은 작지만, 1x에서 원 전체에 고르게 보인다(`k11-r3-water-big-x1b`). 빈 자리는 v1.0보다 30~35% 줄었다.

## 12. 자가 확인

### 12.1 명령(지시서 §7.2 C1~C12, 3차 렌더 이름 `k11-r3f-`, 작업 중 `k11-r3-`)

| 명령 | 이번 결과 |
|---|---|
| C1 모든 호출 | ok |
| C2a 1장 1x | ok(불 그림 그대로) |
| C2b 1~5장 1x, 3장 0.8x 흑백 | 모두 ok |
| C2c 충격 장면 | ok |
| C3 그룹별 확대 | 모두 ok |
| C4-fire, C4-misc | ok |
| C5 gray·deutan·protan·color | 모두 ok |
| C6 | `bad colours=0 banned=0` |
| C7 | 1~5줄 0건, 6줄 `invalid calls ok`(2줄의 물 상한은 20/10/3, 4줄은 `RC.back` [−22,−26,22,2]) |
| C8 | `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045` |
| C9 | §8.13(불 넷·불티 다섯·shock은 그대로, water·root·slow·null 새 값) |
| C10 | 모든 줄 ok(fire 1.78~1.82, water 1.57~1.60, trap 2.31~2.42, null 1.54~1.75, soot 1.34~1.36, 코트 Y 0.620/0.780/0.705) |
| C11 | 40장 ok |
| C12 | `frames=297 ok boxArea=417736 ok badDrive=0` |
| `PN.hazards._.check()` | 0건(약 22초), `{areas: false}` 0건 |
| W1 해칭 검사 | 840줄, 같은 길이·간격 평행 3줄 0건(`k11-r3-water-hatch-check`) |
| B1 1x 비교 | 16칸 모두 구별(`k11-r3-bind-x1`, `-x1-gray`), 4배 감김 확인(`k11-r3-bind-x4`) |
| N1 가운데 엇갈림(d2r2) | 두 줄 모두 중심 0.12r 안 + 엇갈림 > 60°: r120·130·170 × seed 1~200에서 0건(d2r1 식은 33·33·82건), 줄 \|d\|/r 0.150~0.700(`k11-n1-ghost-cross`). C7 3줄 0건, C1 ok, 불 해시 그대로 |

### 12.2 `_.check()`의 규칙

| 묶음 | 규칙 | 근거 |
|---|---|---|
| 몸 무더기·고리 | 덮임 반경 15개 + 150 × seed 1·7·23 × full·reduced에서 모든 불길 항목의 중심 거리 ≤ rimDist 'rise', 먼 테 규칙 | §13-2, §14-1·2 |
| 무더기 | 루프 6장 모두 먹 ≥ 40%, 산호 + hostD ≤ 45%, glow 8~14%, p50 ≤ 3% | §2.3, §13-9 |
| 낮은 불길 | 모든 장 산호 ≥ 30%(mob-12 ≥ 25%), 먹 ≤ 62% | §13-3 |
| 불티 | 0~3번 장 산호 + glow ≥ 55%, 0~1번 장 glow ≥ 1 단위² | §13-4 |
| `AREA_RULES.fire` | 덮임(B) ≥ 45%, 빈 자리 ≤ 44(반경 15개), r150 ≥ 27% / ≤ 84, char 단독 5~15% | §14-4 |
| `AREA_RULES.slow` | 먹물 웅덩이(`mire-*` 칠함) 25~35%: 게임 반경 86·145·150·200·270 × seed 1·5·9, 격자 2. 60·100·120·160·240은 보고만 | §1.9, §13-10 |
| `AREA_RULES.root` | 덩굴 칠함 ≤ 18%: 50·52 × seed 1·5·9, 격자 1 | §4.4, §13-10 |
| `AREA_RULES.water` | 보고만(145·200·270 × seed 1·3·7). 채움 = 수면 획·물결·흐름의 자리(extent) | 검수 2차 §7-4, 검수 3차 W1 |
| 빈 자리(slow·root·water) | 보고만 | 검수 2차 §7-4 |
| 혀 | 이웃 혀 높이 차 ≥ 15%, 산호 끝은 먹 끝에서 ≥ 3 아래(낮은 불길 3.2) | §2.3 |

## 13. 지시서와 다르게 한 것 · 승인 예외

**납품 1(불)에서 수용된 것**(검수 1·2차):
1. 불티 먹 테 0.45~0.78 — Q11(1.5)·R4(1.0~1.2)의 승인 예외. 조건: 칠한 크기 ≤ 5×7, 0~1번 장 glow 심, 원판 금지.
2. 연기 슬롯 SPEC(`fire.smoke`)을 새로 정했다.
3. 한 지형 항목 상한은 고른 솎기(`capCut`)다.
4. 무더기 칠한 크기: s 폭 21(박스 상한 22), m·l 0번 장 높이 +2.
5. `skirt-low` 삭제(S5)와 관련 SPEC 삭제.
6. 덮임 정의 B와 빈 자리 합격선(S4).
7. hero front glow 심 [0.55, 0.26].
8. 불길 없는 작은 숯불 바닥의 glow 줄 하나.
9. `cluster-l-c`는 더하지 않았다.
10. 불티·연기는 몸 무더기(prio 0)에서만.
11. l 무더기 먹 테 2.4 / 3.2.
12. char 초타원 지수 3.2, glow 심 변형별 계수와 둘째 심.
13. `draw`의 `flash` 옵션, hero·mob 조각 z `'body'`, `planned`. 이번 판에서 `kinds`·`groups`·`states`를 7종·9그룹 전체로 바꿔 `planned`와 같게 했다.
14. `fire.layout.char.big`(100).
15. 숯불 바닥 glow 두 줄, 불규칙 마디 금, 휜 불꽃 끝.

**납품 2에서 지시서와 다르게 한 것**:

16. **감속 웅덩이의 개수·크기(§1.6) → 넓이 목표 + `mire-xl` 조각 2장 추가.**
    - 지시서 식(n = clamp(round(r²/2600), 3, 18), r < 120 s·m, 그 밖 m·l)으로는 웅덩이가 원의 6~10%만 덮어 §1.9의 25~35%를 지키지 못한다.
    - 개수를 넓이로(단 [0 m·s 410], [100 l·m 1000], [160 xl·l 1000]), 큰 것의 수를 목표 30%로 정한다(§8.8). 맵 감속(반경 145~270)은 한 지형 상한 24 안에서 l만으로는 15%(r200)·8%(r270)에 그쳐, 같은 웅덩이 문법의 xl(132×60, 칠한 118~121×49)을 더했다.
    - 결과 28.9~30.9%(반경 60~270). 285장, 400,936(상한 안).
17. **`scatter`의 후보 pool 'kr'과 거울 경계 `mirror`(납품 2 종류만).**
    - `jit`의 연속 두 값이 두 직선 위에만 있어(§8.0), 불과 같은 후보식으로는 웅덩이·물결·덩굴이 나선 두 줄을 따라 몰리고 큰 빈 곳이 남았다(감속 r150·r270 1x에서 확인).
    - 후보를 시드로 돌린 R2 격자(Kronecker)에서 뽑고, 변형·flip·phase는 놓은 순서의 Kronecker 값(w)으로 뽑는다. 최선 후보가 테로 몰리는 버릇은 거울상 이웃(`mirror`)으로 막았다.
    - 불은 합격한 배치라 그대로 둔다(C9 같음). 불에 같은 pool을 쓰면 몸 무더기가 더 고르게 퍼지지만 벡터와 덮임 표가 바뀐다(메인 세션·검수 판단).
18. **`shock.coreLayers.burst`**: 지시서 [hostile 0.55w, hostileGlow 0.2w] → [hostileGlow 0.5w, p50 0.18w]. 산호 채움(α 0.55) 위에서 산호 금이 사라져 '빛나는 금'이 읽히지 않았다.
19. **`shock.burst.edge`**: 점 40개 한 줄 → 3줄(오프셋 −2.5·−7·−11.5, 점 2.2·1.6·1.0, 간격 6). 반경 190에서 40개는 띠로 읽히지 않았다. 띠 폭 14는 그대로다.
20. **jit 번호대를 정했다**: shock 균열 2000·2100(팔당 40)·2090·2400, 돌 조각 7000~7030, 파편 7100, 먼지 7200, null 유령 선 2200·2240, jag 2280, 부스러기 6000~6120, 웅덩이 3000·6000, 기포 3200, 물 4000·4100·4300, 덩굴 5000.
21. **root 배치**: 지시서의 고리식(각 2π(i + 0.5 + …)/n, 거리 r(0.35 + 0.4J)) 대신 §14-7대로 `scatter`('rise', reach 0.72r, gap min(0.5r, 24))를 쓴다. flip = x > 0은 그대로다.
22. **water 배치**: §14-7대로 `scatter`('ground'). 거리 ≤ r − 24(물결)·r − 30(흐름)과 간격 ≥ 36은 지시서 값이다. 흐름은 물결과도 30 떨어지게(`fixed`) 했다.
23. **null 부스러기 거리**: 지시서 "r − 6 − 4J" 대신 §14-7대로 rimDist 'ground'(pad 2, jitter 4). 칠한 범위가 r − 2 안에 든다.
24. **`null.ghost.inset`·jit 키, jag를 닫힌 선 하나의 목록으로**: `paths`의 값은 모두 선 목록이다(C9가 그대로 찍힌다).
25. **`null.active.on: false`**(§12.3 Q3). 그림은 다시 그리지 않고 켤 수 있다.
26. **`draw`의 `end` 옵션**(slow): `SPEC.slow.end` 0.5초의 웅덩이·기포 α 경사를 참고 합성에 넣었다.
27. **기포·물결 주기**: 지시서 "0.9·(0.7 + 0.6J)", "1.6·(0.7 + 0.6J)"의 J로 항목 자신의 phase에서 frac(7.919·phase)를 쓴다(렌더러가 따로 jit을 뽑지 않는다).
28. **shock 파편·먼지 0.3초 > 터짐 0.25초**: 자국의 처음 0.05초에 마저 그린다(`draw('shock','decal')`).
29. **덫 shut의 p**: 마지막 0.6초 안의 진행률(그 전 0). 판뿐 아니라 홈·바퀴살·리벳·기계·테가 함께 사라진다(덫 자체가 지워진다).
30. **덩굴 그림**: 한 줄 갈고리가 1x에서 해마·올챙이로 읽혀서, 긴 낮은 줄기 + 작은 갈고리 + 둘째 줄기의 가시덤불로 그렸다. 높이 ≤ 15.5(지시서 ≤ 16). 가시는 주 줄기 바깥 3 + 안쪽 1, 둘째 줄기 1이다(지시서 "바깥 면 2~3").
31. **묶임 오버레이 높이**(v1.0): 발목(장화)은 어두워 덩굴이 묻혀서 코트 자락 높이(y −9.4·−6.4)에 감았다. 검수 3차 B1로 다시 그렸다(34).
32. **water 면적 마스크**: 물결은 얇은 고리라서 `areaOf`가 칠한 픽셀 대신 내접 타원(자리)으로 센다(`extent`). 보고만 한다. 수면 획도 같은 마스크에 넣었다.
33. **slow `MASKS`·`AREA_RULES.slow`의 반경**: 지시서 §13-10의 25~35%를 맵 반경(145·200·270)까지 검사한다.

**검수 3차 수정판(d2r1)에서 정한 것**(지시서 §15, 검수서 §3·§4):

34. **B1 묶임의 모양**: 검수서는 'front 위 가닥 y −12~−13, 다리마다 나선 한 가닥, p300 0.8 가장자리, back은 땅에서 올라오는 덩굴'을 정했다. 이것을 그대로 따르고 다음을 더했다.
    - back에 발밑·양옆의 낮은 가시 뿌리 덩어리(x ±19, y −4.8~+1.7)를 두었다. 오르는 덩굴이 '땅에서 나온다'는 출발점이 1x에서 덩어리로 보이고, run 큰 걸음과 hurt의 검은 코트에서도 발밑이 어두운 가시 덩어리로 갈린다.
    - front 나선은 두 다리가 같은 감김 방향이다. 거울로 그리면 두 가닥이 V자(갈매기)로 읽혔다(`k11-r3-bind-idle-x6`, 고치기 전 판).
    - front에 발끝을 붙드는 짧은 뿌리 고리를 다리마다 하나 두었다(먹 2.8 → 2.0).
    - 칠한 범위 back x ±19.7·y −15.8(검수서 '폭 x ±18, 높이 y −15까지'는 덩굴이 닿는 곳으로 읽었다. 가장자리·가시를 포함한 칠은 C7 범위 [−20, −16]–[20, 2] 안이다), front x −13.9~16.2·y −13.2~2.2.
35. **W1 수면 획의 숫자**: 위 줄 58~60, 아래 줄 44(지시서 아래 25~45 안), 세로 간격 3, 줄마다 끊김 자리 둘(3장 어긋남)으로 늘 2~3마디·최소 마디 8·틈 4~6. 물결·흐름은 수면 획과 떨어지게(`fixed`) 놓았다.
36. **물 상한 넘침의 솎기**: prio 2(흐름·반짝임)부터 나중 것부터(`cut {even −1, keep 1}`). r270 full에서 반짝임과 흐름 둘이 빠진다.
37. **감소 모션의 수면 획**: 정보(info) 조각이라 phase 장에 멈춰 남긴다. 흐름·반짝임은 지시서대로 그리지 않는다.
38. **R2를 6종의 남은 jit 짝에도 적용**: 기포의 웅덩이 위 자리(J(ix)·J(ix+1)), 부스러기의 칸 안 각·깊이(J(6000+i)·J(6040+i)), 유령 선의 각·거리(J(2200+i)·J(2240+i))를 `kron`으로 바꿨다. 지시서 §15-1의 승인 예외가 불 몸 무더기와 char뿐이라서다. 그래서 slow:150:5(기포만)·null:130:11(부스러기·유령 선) 벡터가 바뀌었다. 웅덩이·jag·shock은 그대로다.
39. **shock 균열 마디**는 위치가 아니라 선 모양 매개라 jit 그대로 두었다(§8.0-0). 바꾸면 합격한 균열 모양과 벡터가 바뀐다.
40. **버전 문자열**을 `'1.0-d2r1'`로 했다(납품 1의 `'1.0-d1r2'`와 같은 표기). 메인 세션이 285장 스냅숏(`'1.0'`)과 가를 수 있다.

**검수 4차 N1(d2r2)**:

41. **null 유령 선의 중심 거리 |d| ≥ 0.15r**(`SPEC.null.ghost.minOffset 0.15`, 식 §8.6). 검수서의 식 그대로이고, s = sign(v − 0.5)는 v = 0.5에서 +1로 정했다(0이 되면 가운데를 지난다). 바뀐 출력은 `paths('null').ghost`와 그것을 그리는 `draw('null')`뿐이다. 버전은 `'1.0-d2r2'`다.
42. **2D 위치 규칙의 범위**를 §8.0-0에 적었다(검수 4차 (2)).

## 14. 사람 원화가에게 남길 것 (바이블 §15)

- 불길 무더기와 낮은 불길의 붓 실루엣: 손으로 그린 불의 리듬, 끝의 비백, 그늘 쪽 먹의 붓 굵기.
- 숯불 바닥과 그을음 얼룩의 비백, 숯덩이 모양, 빛나는 금의 붓질. 불티·연기의 붓질.
- 먹 덩굴의 가시와 테이퍼, 묶임 덩굴이 다리를 감는 앞뒤 관계(지금은 앞 반바퀴 나선 + 뒤의 오르는 덩굴과 뿌리 덩어리. 자세별로 다리 위치가 달라 run 큰 걸음에서는 나선이 다리와 어긋난다).
- 수면 획의 붓 리듬(지금은 고른 사인 물결 + 끝 테이퍼).
- 장별 덫 기계(특히 3장 그물과 4장 톱니)의 쇠 질감.
- shock 돌 조각·core의 판석 파편, 균열 가지의 붓 리듬.
- 웅덩이 가장자리의 먹 번짐, 큰 웅덩이(xl)의 표면(지금은 평평한 ink700 + 초승 윤기).
- null 지우개 부스러기의 말린 모양.
- 주인공 front는 달리기 큰 걸음 장(run 0·4)에서 장화 먹이 14~23%만 보인다(예외 승인).
- 정식 판독 시험(n ≥ 8)은 하지 않았다.

## 15. 알려진 한계

- **물의 수면 획(W1)**: r145·200·270에서 획 4·7·10개가 원 전체에 고르게 놓이고 1x·0.8x 흑백에서 수면으로 읽힌다. 다만 획이 모두 가로라 원의 테 근처 좌우(먼 x)에는 획이 덜 닿는다(scatter 'ground' 내접 타원이 r − 2 안이어야 해서). 넓이 비율(자리 3.7~5.9%)은 작다.
- **묶임(B1)은 자세를 모른다**: 조각 하나를 모든 자세에 쓴다. run 큰 걸음에서 다리가 벌어지면 front 나선이 다리 사이에 걸려 보인다(1x에서는 '발밑 덩굴'로 읽힌다). 자세별 조각이 필요하면 hero 프레임 수만큼 늘어난다.
- **불의 후보 나선**: §8.0의 jit 성질 때문에 불 몸 무더기 후보도 나선 두 줄 위에 있다. 승인된 예외라 그대로 두었다(검수 3차 (1)).
- **shock 균열 마디의 jit 상관**: 마디 (길이, 꺾임)가 jit 연속값이라 두 갈래 관계에 묶인다. 균열 모양은 합격했고, 규칙 범위 밖으로 수용됐다(39, 검수 4차 (2)).
- **null 유령 선의 방향**: θ = π·kr(0, i)라서 4줄은 서로 약 44°씩, 6줄이면 두 쌍이 3.5° 차이로 거의 나란하다. 가운데 엇갈림은 N1로 없앴고, 가장자리 쪽 교차는 지운 줄눈으로 읽힌다(`k11-n1-null-x1`, `-x2`).
- **정지 렌더로 판단하지 못한 것**: 2Hz 물듦과 루프·cycle 움직임, 다이얼 바늘 쓸기, 성능.

## 16. 도감 아이콘 `icon(kind, {ch})` (2026-10-26, 전체 점검 art P2-2·kit P2-2)

### 16.1 계약
- 도감 terrain 시트(64 CSS px 칸, @2x로 굽는다)에 쓰는 정지 아이콘이다. 게임 화면의 그림과 같은 물건을 아이콘 크기로 그린다: **판정 원(그 종류의 테 문법) + 대표 조각**이고, **가운데 기호가 없다.**
- 대표 조각은 굽는 조각과 같은 함수(`stamp`)가 그린 같은 그림이다. 조각마다 배율 하나(가로세로 같은 비)로 줄이기만 하고 늘이지 않는다. 아이콘용 새 그림은 없다.
- **로컬 박스** −32…32 × −32…32(칸 64×64), **원점 = 판정 원 중심(피벗)**, 원 반지름 `ICON.r` = 25.
  - 칠한 범위: fire·slow·water·root·trap·null ±26.8 이내, shock(눈금) ±28.4 이내. 칸 가장자리에서 3.5 이상 떨어져 있어 시트 굽기의 가장자리 검사를 통과한다.
  - 판정 원 밖은 그리지 않는다(도감 칸 배경이 보인다). 원 안은 먼저 장 바닥색(`PN.env.CH[ch].base`)으로 채운다. 게임처럼 반투명 원판(불 ink α0.30, 물 α0.24, 덫 판 α0.5)이 바닥 위에 놓여야 같은 명도로 읽히기 때문이다.
- **옵션** `ch` 1~5(기본 1): 바닥색과 덫 기계(5장 → 1장 기계)를 고른다. 모르는 kind, 1~5 정수가 아닌 `ch` → `console.warn('PN.hazards: …')` + 정확히 `'<g/>'`.
- **반환** `<g class="hzd hzd-icon hzd-icon-<kind>"><defs>…</defs>…</g>`. id는 slow·root의 해칭 패턴 하나(`hzd<N>_h<k>`, 호출마다 다름)뿐이다. 글자(`<text>`)·필터·그라데이션이 없다.
- **색**: SPEC 토큰 + 장 바닥색 + 덫 장 재질색. 소속은 §7.1 그대로다(불 산호·중립, shock·slow·root·null 호박·중립, 물·덫 중립). null 산호 링은 꺼진 채다.
- **대표 상태**: fire burn, shock telegraph imminent(균열 + 예고 테, 채움 없음), slow·root·water·null static, trap armed.

### 16.2 그리는 것 (§9의 draw 순서 그대로, 좌표는 아이콘 단위)

| kind | 순서와 조각 [조각, 장, (x, y), 배율, 반전] | 테 배율 |
|---|---|---|
| fire | 바닥 → 원판 ink α0.30 → `char-a` 0 (−3,10) ×0.6 → `fire.rim` 4줄 → 무더기 `cluster-s-b` 0 (−2,−12) ×0.55, `cluster-s-b` 0 (15,−1) ×0.72 반전, `cluster-s-a` 0 (−15,1) ×0.72, `cluster-l-a` 0 (0,15) ×0.72 | 0.6 |
| shock | 바닥 → 균열: `paths('shock', 120, 11)`의 팔 7 + 가지 7을 25/120로 줄이고, 먹 굵기 팔 1.9→0.9·가지 1.1→0.7 위에 imminent 심(warn 0.5w, warnGlow 0.17w) → 먹 테 3.15 → 호박 점선 1.58(오프셋 −1.58, dash 4.5/2.25) → 눈금 8개 먹 1.35(r − 5.4 → r + 2.7) | 0.45 |
| slow | 바닥 → 현행 바닥 채움 p100 α0.92 + 해칭 타일(§7.5)을 ×0.6(간격 7.2) → `mire-m-a` (−3,5) ×0.6, `mire-s-b` (9,−10) ×0.6 → `bubble-a` 2번 장 (−7,6) ×0.8 → `slow.rim` 3줄 | 0.55 |
| water | 바닥 → 원판 ink α0.24 → `wave-a` 0 (3,−10) ×0.55, `wave-b` 0 (2,3) ×0.55, `ripple-a` 3번 장(감소 모션 정지 장) (−6,14) ×0.7, `glint` 0 (−12,−16) ×1 → `water.rim` | 0.75 |
| root | 바닥 → 바닥 채움 + 해칭 ×0.6 → `vine-a` 0 (10,−6) ×0.85 반전, `vine-b` 0 (−10,−2) ×0.85, `vine-c` 0 (2,13) ×0.85(반전 = x > 0, 말림이 가운데를 본다) → `root.rim` | 0.55 |
| trap | 바닥 → 판 ink700 α0.5 → `trap.groove` → 바퀴살 6(반지름 16 → r − 3.6, 먹 0.84 α0.5) → 리벳 8(r − 6.6, 1.2 네모 p300) → `armed-ch<c>` (0,1) ×0.55 → `trap.rim` | 0.6 |
| null | 바닥 → void 원판 α1 → 유령 선 2줄(`paths('null', 120, 164)`의 0·3번 줄을 25/120로 줄임, ink300 0.8 α0.6, dash 3.2/2.4) → `crumb-a` (−12,−13) ×1.3, `crumb-b` (13,11) ×1.3 반전 → `null.rim` 점선 2줄 | 0.55 |

- 테 배율은 그 종류 SPEC 테 행의 굵기·오프셋·dash에 곱한다. 행의 순서·색·α는 그대로다(`ICON.rim`).
- **shock 균열을 r 120에서 가져온 까닭**: r 190 균열을 줄이면 팔 일곱이 한 점에 모여 '✳' 기호처럼 읽힌다. r 120 균열은 같은 식(§8.6)이고, 팔이 중심에서 2.1 떨어져 시작해 열린 충격점이 된다.
- **null 유령 선을 두 줄만 그린 까닭**: 네 줄은 각이 44°씩이라 늘 원 안 어딘가에서 '+'로 엇갈린다. 다른 두 줄 짝은 아이콘 크기에서 'V'·'Λ'·'X'로 만난다. 0·3번 짝(seed 164)은 원 안에서 만나지 않고 중심에서 0.38r 이상 떨어져 있다.
- **crumb-c를 뺀 까닭**: 1x 크기에서 '▲'로 보였다.
- `ICON`(얼려 있음): `{box [64,64], r 25, ch 1, hatch 0.6, rim {…}, shock {r 120, seed 11, arm [1.9,0.9], branch [1.1,0.7]}, trap {hub 16}, null {r 120, seed 164, lines [0,3], line 0.8}, pieces {kind: {ground, top}}}`. SPEC 밖이므로 매니페스트에 들어가지 않는다.

### 16.3 도감 시트 굽기 (메인 세션)
- `scripts/build-ui-art.mjs:17` `KIT_FILES`: `'k-env.js'` 바로 뒤에 `'k-hazards.js'`를 넣는다.
- recipe를 하나 더한다: `terrainIcon: (kind) => PN.hazards.icon(kind)`.
- `art/ui-art-spec.mjs:154` terrain 시트의 items: fire·shock·slow·water·root·trap·null은 `recipe: 'terrainIcon'`, warning·vortex는 지금 `recipe: 'hazard'` 그대로. 칸 [64, 64], origin [−32, −32], columns 9, 키 순서는 그대로다.
- 장 바닥을 종류별로 바꾸려면 `args: [kind]`에 `{ch}`를 더한다(예: 물 3장, null 5장). 기본은 1장 바닥과 1장 덫 기계다.

### 16.4 확인
- `--check`: `p2kit-hzicons-x4`, `-v2-x4`, `-ch1-5`(7종 × 1~5장), K11 C1 식에 아이콘 35개를 더한 `p2kit-k11-c1-all-icons` 모두 ok.
- 흑백 64·48 px(`p2kit-terrain-gray-64`): T1 쌍(fire↔slow, slow↔root, water↔slow, water↔null, trap↔fire)이 무늬로 갈린다. 가운데 기호가 없고 글자로 읽히는 것이 없다.
- 굽기 모사(`p2kit-terrain-sheet-before-after`, @2x): 위가 새 시트 9칸, 가운데가 지금 시트, 아래가 같은 종류의 `draw()`를 장 바닥 위에서 줄인 그림이다.

### 16.5 바뀌지 않았음을 보인 해시 (같은 식, 고치기 전 → 뒤)
- K11 불 해시 `fire-stamps=6wx6hi len=593187`, `fire-draws=1ydln4g len=2730763` → 같음. 식(3차 납품서 §5-1의 설명을 그대로 옮긴 것, 원문 값이 나온다): fire·mob 조각 전부, 그다음 hero back·front 12장을 `hzd\d+_ → hzd_`로 정규화해 이은 것, 그리고 `draw('fire', st, {r, seed, ch: 1, t: 0.3, p: 0.5})`를 st(burn·ignite·gutter·soot) → r(50·74·98·150) → seed(1·7) 순으로 이은 뒤 `overlay('hero', back·front·embers, {t: 0.3})`를 붙인 것. djb2-xor 36진수.
- C8(독립 실행) `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045` → 같음.
- hazards 전체(모든 조각과 서술자 / 7종 × 상태 × 1~5장 × p 0.2·0.7 × r 50·74·150(shock 190) draw / hero·mob overlay 23 / layout 3 LOD·paths 7종 × r 6 × seed 3 / version·kinds·groups·states·META·SPEC·planned JSON): `stamps=rt2n2/950187 draws=17ki52j/13592100 overlays=cx8avp/113926 data=15hhok4/357064` → 같음.
