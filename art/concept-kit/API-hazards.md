# API — `k-hazards.js` · `PN.hazards` v1.0 (위험지형 7종 + 주인공·적 오버레이 — 납품 2)

작업 지시서: `docs/art/briefs/terrain-hazards.md`(K11, R5 추가 발주 B6). 우선순위는 §14 검수 2차 정정(S1~S5, §14-7 공용 틀) > §13 검수 1차 정정(R1~R8, §13-10) > §12 메인 세션 정정 > 본문이다.
- §12: 열린 질문 Q1~Q13은 모두 권고안이다. 불 테는 먹 + 산호이고 해칭이 없다. 그림에서는 가운데 기호를 빼고 바닥 그림으로 구분한다. **null 산호 링은 끈다**(Q3). 불 위 적은 발밑 불길만 그리고 몸 물듦이 없다. 주인공은 곱하기 산호 물듦이다.
- §13: 몸 무더기는 m/l만 쓴다. 치마 대신 s 무더기 테두리 고리를 두른다. 낮은 불길은 작은 무더기 문법으로 그린다. 불티를 키우고, 테 안쪽에 열 띠를 넣고, 그을음 개수를 늘린다. 납품 2 전 공용 틀(§13-10): 솟는 조각은 inset 도우미, 바닥 조각은 내접 타원 ≤ r − 2, `_.check()`에 종류별 면적.
- §14: 몸 무더기 개수를 넓이에 비례시키고 최선 후보로 흩는다. 고리는 먼 테에서 안으로 옮기고 `skirt-low`를 지운다. 상한은 고리를 고르게 솎는다. 합격선은 덮임(정의 B) ≥ 45%, 빈 자리 ≤ 44다. §14-7: 솟는 조각은 `rimPlace`/rimDist 'rise', 바닥 조각은 rimDist 'ground', 흩는 것은 모두 `scatter`, 상한은 `capCut`, 종류별 `MASKS`로 `areaOf` 면적을 보고한다.

스타일 기준: 바이블 v1 §3·§4·§5.3·§6·§7.2·§12·§13·§15, v1.0 부록 §10.3(용광의 입: 검은 불꽃 + 산호 판정 코어, 꺼진 뒤 무해한 그을음).
킷 출력은 잠정 아트다(바이블 §15). 붓 실루엣과 비백은 사람이 다시 긋는다(§14).

**이 판은 납품 2(v1.0)이다.**
- 들어 있는 것: 공용 틀, 7종 전부(fire·shock·slow·water·root·trap·null)의 모든 상태, 주인공 오버레이 back·front·embers·bind-back·bind-front, 적 발밑 불길 mob/front-12·19·28.
- `kinds`·`groups`·`states`는 7종·9그룹 전체이고 `planned`와 같다.
- **불(fire)의 출력은 수정 2회차(`1.0-d1r2`)와 같다.** C9 불 벡터 넷과 반경별 덮임·빈 자리 표가 그대로다(§12.1). 공용 `scatter()`에 더한 선택 키(`pool`, `mirror`)는 불이 쓰지 않는다.

## 1. 로드와 의존

```html
<script src="kit/lib.js"></script>
<script src="kit/k-env.js"></script>
<script src="kit/k-hazards.js"></script>  <!-- window.PN.hazards -->
```

- 굽기에서는 `scripts/build-atlas.mjs:11`의 `KIT_FILES`에서 `k-env.js` 바로 뒤에 둔다. 리뷰 시트는 파일 이름순으로 자동으로 읽는다.
- 다른 킷 모듈은 부르지 않는다. 덫 기계 조각만 `PN.env.CH[ch]`의 light·base·deep·spot을 읽는다(읽기 전용). `E.uid`·`E.mix`·`PN.env.hazard`는 부르지 않는다.
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
  - 바닥 조각(z `ground`: char·웅덩이·물결·흐름·반짝임·부스러기·돌 조각·덫 기계)의 앵커는 박스 가운데다(돌 조각 `pebble`만 밑동 5,8).
- 불길·덩굴·기포는 회전하지 않는다. 좌우 반전(`flip`)만 하며, 반전은 앵커를 축으로 한다: `translate(x y) scale(-1 1) translate(-ax -ay)`. 솟는 것은 언제나 화면 위쪽으로 솟는다.

## 3. 공개 API

```js
PN.hazards = {
  version: '1.0',
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
| static | 담묵 원판 → 물결 `ripple-*`(cycle) → 흐름 `flow-*`(loop) → 반짝임 `glint`(loop) → 젖은 테. 신호색·해칭 없음 |

### 4.5 root

| 상태 | 언제 | p | 그리는 것 |
|---|---|---|---|
| emerge | 생긴 뒤 0.25초 | 나이 / 0.25 | 바닥·해칭, `vine-*-emerge` 장 min(3, ⌊4p⌋), 테 |
| static | 그 사이 | (t) | `vine-*` 루프 6fps |
| wither | 남은 수명 < 0.4초 | 1 − 남은 수명 / 0.4 | `vine-*-wither` 장 min(3, ⌊4p⌋) |
| faded | 주인공 속박 면역 중(`player.rootImmunity > 0`) | — | 합성 전체 α 0.35, 덩굴은 phase 장에서 멈춤(현행 `worldRenderer.ts:846`과 같은 뜻) |

**주인공 묶임**(`player.root > 0`, 덫의 묶임은 제외): `overlay('hero','bind-back'|'bind-front',{p})`, p = 묶인 뒤 초 / 0.2, 장 = min(3, ⌊4p⌋), 마지막 장을 유지한다.

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

## 5. 굽는 조각 (`parts(group)`) — 285장, 박스 넓이 합 400,936 단위²

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
| 장 | 116 | 20 | 12 | 28 | 20 | 30 | 36 | 20 | 3 | **285** |
| 박스 넓이(단위²) | 164,496 | 24,696 | 11,624 | 29,968 | 28,624 | 17,024 | 22,464 | 101,680 | 360 | **400,936** |

- 지시서 표(301장)에서 불 치마 18장(R2·S5)을 빼고, 감속 `mire-xl` 2장을 더했다(§13-16).
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

### 6.6 water — 물결

- **`ripple-*`**(칠한 범위 x −16.4~14.3, y −5.2~5.8): 납작한 고리(ry = 0.3·rx)가 rx 3 → 16으로 퍼지고(바깥 고리 p300 1.6 → 0.8), 2번 장부터 안쪽 고리가 늦게 따라온다(rx 3 → 12). 아래 +0.6에 ink300 0.8 그늘선. 6·7번 장에서 호가 끊기며 사라진다. b는 안쪽 고리가 반대쪽으로 0.8 치우친다. 감소 모션 3번 장.
- **`flow-*`**(x −17~16, y −1.5~2.0): 끊긴 짧은 가로 물줄 둘(p300 최대 1.4, 길이 14·11 / 13·10)이 장마다 오른쪽으로 2씩 흐른다.
- **`glint`**(6.0×1.6): p50 짧은 렌즈(4×1.2 → 6×1.6). 별 모양 아님.
- 청록·장 재질색을 쓰지 않는다(먹·종이만).

### 6.7 root — 먹 덩굴, 주인공 묶임

- **`vine-a`·`-b`·`-c`**(칠한 높이 ≤ 15.5, 폭 17~19): 땅 균열(먹 쐐기, 앵커 아래 ≤ 0.8)에서 나온 가시덤불이다. 긴 낮은 줄기가 기어가다 끝이 일어나 안쪽(+x)으로 작은 갈고리를 말고, 반대쪽으로 짧은 둘째 줄기(굵기 1.8)가 나간다. 주 줄기는 굵기 2.2 → 0.15로 뾰족하게 끝나고(둥근 끝·혹 없음), 바깥 면에 가시 쐐기 3~4(높이 1.7), 좌상 쪽 ink500 윤기 띠. 높이: a 12.4, b 10.5, c 15.4.
- **루프 4장 @6fps**: 끝이 2만큼 흔들린다(x +0.3 → −0.8 → −1.7 → −0.8, 높이 12 이상은 전부, 그 아래는 높이에 비례). 갈고리가 박스 오른쪽 여백에 닿아 있어 안쪽(−x)으로 기운다.
- **emerge 4장**: 균열 + 담묵 흙 부스러기 → 뾰족한 두 끝 → 줄기 62% + 둘째 줄기 70% → 다 자라고 끝이 한 번 더 감김(가시는 같은 자리).
- **wither 4장**: 갈고리가 30°·52° 처짐 → 두 토막 → 토막이 0.55배로 균열에 가라앉는다.
- **`bind-back`·`bind-front`**: 다리마다 덩굴 두 가닥이 코트 자락 높이(y −9.4·−6.4, 다리 x ±6.5)를 ±14° 기울어 감는다(앞 반쪽이 X로 겹친다). 땅 덩굴이 x ±18(back)·±16.4(front)에서 다리로 올라온다. 장마다 0.3 / 0.6 / 0.85 / 1만큼 자라고, 마지막 장에 가시 둘씩. 먹 띠 3.6 → 1.8.
  - 칠한 범위: back x −18.5~18.5, y −15.7~1.8(상한 [−20, −16]–[20, 2]), front x −16.9~16.9, y −11.6~2.8(상한 [−18, −15]–[18, 3]). 얼굴 금지 구역과 청록 링(y +6.8 at x ±18) 밖이다.

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
| `jit` | {mul 31, hash 2654435761, mod 1000, kron [0.7548776662466927, 0.5698402909980532, 0.6287067210378087, 0.5385972572236101, 0.4614032426986125]} | J(i) = `((Math.imul(seed*31 + i, 2654435761) >>> 0) % 1000) / 1000`. `kron`은 `scatter` pool 'kr'의 Kronecker 걸음(§8.0-2) |
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
| `slow.layout.bubble` | {per 30, min 2, max 6, cycle 0.9, spread [0.7, 0.6], still 2, jit 3200} | §8.8 |
| `slow.layout.caps` | [24, 12, 3] | |
| `root.windows` | {emerge 0.25, wither 0.4} | §4.5 |
| `root.faded` | {alpha 0.35} | 주인공 속박 면역 중 합성 전체 α 0.35, 흔들림 정지 |
| `root.layout` | {vine {per 12, min 3, max 6, tries 40, cand 6, reach {frac 0.72, pad 99}, gap {frac 0.5, cap 24}, squash 1.2, far 6, mirror 6, pool 'kr', jit {base 5000, stride 5}}, caps [6, 6, 6]} | §8.10 |

### 7.6 water·trap·null

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `water.base` | {token ink, alpha 0.24} | 중립. 신호색·해칭 없음 |
| `water.rim` | [[ink, 2.6, 0], [p300, 1.2, −2.4, 0.8]] | 젖은 가장자리 |
| `water.layout` | ripple {per 40, min 3, max 7, still 3, cycle 1.6, spread [0.7, 0.6], tries 40, cand 6, reach {frac 0, pad 24}, gap {frac 1, cap 36}, squash 2, mirror 2, pool 'kr', jit {base 4000, stride 5}}, flow {per 60, min 2, max 5, tries 40, cand 6, reach {frac 0, pad 30}, gap {frac 1, cap 30}, squash 3, mirror 2, pool 'kr', jit {base 4100, stride 5}}, glint {angle −2.356, spread 0.3, at 0.45, jit 4300}, caps [13, 7, 1] | §8.9 |
| `trap.plate` | {token ink700, alpha 0.5} | 판 = 판정 원. 닫힌 뒤 α × 0.7 |
| `trap.rim` | [[ink, 3.4, 0]] | |
| `trap.groove` | [[ink, 1.6, −6, 0.7]] | |
| `trap.spokes` | {count 6, from −6, to 38, layers [[ink, 1.4, 0, 0.5]]} | 살 i: 각 2πi/6 + π/6, 중심에서 38 → r − 6 |
| `trap.rivets` | {per 40, min 8, at −11, size 2, token p300, shape 'square'} | n = max(8, round(2πr/40)), 각 2π(i + 0.5)/n, 반지름 r − 11의 2×2 네모 |
| `trap.windows` | {spring 0.15, fadeLast 0.6, sprungAlpha 0.7, fallback {5: 1}} | §4.6 |
| `trap.layout` | {caps [1, 1, 1]} | |
| `null.base` | {token voidPaper, alpha 1} | |
| `null.ghost` | {lines [4, 6], split 150, dash [4, 3], layers [[ink300, 1, 0, 0.6]], inset 6, jit {angle 2200, offset 2240}} | 식 §8.6 |
| `null.rim` | [[ink, 5.4, 0, 1, [0.1, 9]], [warn, 3, 0, 1, [0.1, 9]]] | 둥근 끝 점선. 현행과 같다 |
| `null.active` | {**on false**, layers [[ink, 3.2], [hostile, 1.5]], at 0.9} | §12.3 Q3로 끔(그림을 다시 그리지 않고 켤 수 있다) |
| `null.erase` | {seconds 0.3, jag {points 12, depth 6, jit 2280}} | void = jag(§8.6)를 g = 1 − (1 − p)²배 한 닫힌 Catmull-Rom(구간당 4점) |
| `null.restore` | {seconds 0.5, line [ink300, 1.4]} | §4.7 |
| `null.layout` | {crumb {per 16, min 5, max 9, inset {pad 2, jitter 4}, jit {angle 6000, dist 6040, variant 6080, flip 6120}}, caps [9, 0, 0]} | §8.12 |

## 8. layout·paths 식과 jit 번호대

### 8.0 공용 배치 도우미 — 모든 종류가 쓰고, 렌더러는 한 번씩만 옮긴다

기호: J(i) = jit(seed, i), frac(v) = v − ⌊v⌋. farOK(x, y, tip, far) = !(y − tip < −√max(0, r² − x²) − far)다.

**jit의 성질(이식 때 알아 둘 것)**: J(i + 1)은 J(i)로 정해진다. frac(J(i) + 0.761)(약 38%) 아니면 frac(J(i) + 0.465)(약 62%)다(2654435761 mod 1000 = 761, 2³² mod 1000 = 296). 그래서 연속한 두 값 (J(ix), J(ix+1))로 만든 2D 점은 단위 정사각형의 두 직선 위에만 있다. 불의 후보(a = 2πJ(ix), d = reach·√J(ix+1))는 원 안의 나선 두 줄 위에만 놓인다. 불은 합격한 판이라 그대로 두고, 납품 2 종류는 pool 'kr'을 쓴다.

1. **`rimDist(r, a, box, mode, u, o)`**: 각 a 쪽에 놓는 조각의 중심 거리 상한이다.
   - `'rise'`(솟는 조각, 앵커는 밑동): d = r − (max(o.min, hw·|cos a| + o.pad) + o.jitter·u), hw = (box w − 6)/2. o 기본값은 `fire.layout.rim.inset` {min 12, pad 4, jitter 3}.
   - `'ground'`(바닥 조각, 앵커는 박스 가운데): ex = (box w − 6)/2, ey = (box h − 6)/2.
     1. d = r − 2 − √((ex cos a)² + (ey sin a)²)로 시작한다.
     2. 그 타원의 16점(A = kπ/8) 중 중심에서 가장 먼 점 m을 구해 m > r − 2이면 d를 m − (r − 2)만큼 줄인다. 두 번 한다.
     3. 마지막에 − o.pad − o.jitter·u(기본 0)를 한다. 내접 타원 전체가 r − 2 안에 든다.
2. **`scatter(r, seed, o)`**: 최선 후보 흩기. o = {n, tries, cand, reach {frac, pad}, gap {frac, cap}, squash, mode, box, tip, far, inset, fixed, mirror, pool, jit {base, stride}}.
   - reach = max(o.reach.frac·r, r − o.reach.pad), gap = min(o.gap.frac·r, o.gap.cap), sq = o.squash.
   - pool 'kr'이면 k0[t] = J(o.jit.base + t)(t = 0..4), kr(t, q) = frac(k0[t] + q·SPEC.jit.kron[t])다.
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
   - `MASKS`: fire {채움 = z flame, 띠 = 열 띠, inset 12}, slow {채움 = `mire-*`, inset 6}, water {채움 = `ripple-*`·`flow-*`, inset 6, **extent**: 채움을 칠한 픽셀 대신 내접 타원(box − 6)으로 센다 — 고리가 자라며 쓸고 가는 자리}, root {채움 = `vine-*`, inset 6}. shock·trap·null은 흩는 채움이 없어 마스크가 없다.

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
- ghost: n = r < 150 ? 4 : 6줄. 줄 i: θ = π·J(2200 + i), c = clamp((J(2240 + i) − 0.5)·1.2r, −0.8r, 0.8r), R0 = r − 6, h = √max(0, R0² − c²), d = (cos θ, sin θ), m = (−sin θ, cos θ). 선 = [c·m − h·d, c·m + h·d](원 r − 6의 현).
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
3. **기포**(full만, 웅덩이가 있을 때): nb = clamp(round(r/30), 2, 6). b = 0..nb−1: q = mire[b mod mire 수], hx·hy = q 조각의 (box − 6)/2, ix = 3200 + 4b, 위치 = (q.x + (J(ix) − 0.5)·0.8hx, q.y + (J(ix+1) − 0.5)·0.6hy + 1), phase J(ix+3), part `bubble-` + (b 홀수 ? b : a), z flame, prio 2, gen 300 + b.
4. **LOD**: full = mire + 기포, reduced = mire 앞 ⌈n/2⌉(큰 것 먼저, 고르게 퍼진 순서), minimal = mire 앞 3. capCut([24, 12, 3], {even 2, keep 1}) — 넘치면 기포를 고르게 뺀다.

### 8.9 layout('water', r, seed, {lod})

1. nr = clamp(round(r/40), 3, 7), nf = clamp(round(r/60), 2, 5).
2. 물결: scatter(r, seed, {n: nr, tries 40, cand 6, reach {0, 24}(= r − 24), gap {1, 36}(= min(r, 36)), squash 2, mirror 2, pool 'kr', mode 'ground', box [40, 18], jit {base 4000, stride 5}}) → {part `ripple-` + (w0 < 0.5 ? a : b), x, y, flip w1 < 0.5, phase w2, z ground, prio 0, gen i}.
3. 흐름: scatter(r, seed, {n: nf, tries 40, cand 6, reach r − 30, gap min(r, 30), squash 3, mirror 2, pool 'kr', mode 'ground', box [44, 10], **fixed = 물결**, jit {base 4100, stride 5}}) → {part `flow-` + (w0 < 0.5 ? a : b), flip false, phase w2, prio 1, gen 100 + i}.
4. 반짝임: a = −2.356 + (J(4300) − 0.5)·0.6, 위치 = (cos a, sin a)·0.45r(빛은 좌상), phase J(4301), prio 2, gen 200.
5. LOD: full = 물결 + 흐름 + 반짝임, reduced = 물결 앞 ⌈nr/2⌉ + 흐름 앞 ⌈nf/2⌉, minimal = 물결 앞 1(3번 장 정지). capCut([13, 7, 1], {even 1, keep 1}).

### 8.10 layout('root', r, seed, {lod})

n = clamp(round(r/12), 3, 6). scatter(r, seed, {n, tries 40, cand 6, reach {0.72, 99}(= 0.72r), gap {0.5, 24}(= min(0.5r, 24)), squash 1.2, mirror 6, pool 'kr', mode 'rise', box [26, 24], tip 20, far 6, inset 기본 {12, 4, 3}, jit {base 5000, stride 5}}) → {part `vine-` + 'abc'[min(2, ⌊3·w0⌋)], x, y, **flip = x > 0**(말림이 늘 중심을 향한다), phase w2, z flame, prio 0, gen k}. 모든 LOD 같다(info). capCut([6, 6, 6], {even −1, keep 1}).

### 8.11 layout('trap', r, seed, {ch})

항목 하나 {part `armed-ch<c>`, x 0, y 0, flip false, phase 0, z ground, prio 0}, c = ch ≤ 4 ? ch : 1. 렌더러가 상태에 맞춰 `spring-ch<c>`·`shut-ch<c>`로 바꾼다.

### 8.12 layout('null', r, seed, {lod})

full만: n = clamp(round(r/16), 5, 9). i = 0..n−1: a = 2π(i + J(6000 + i))/n, d = rimDist(r, a, [12, 10], 'ground', J(6040 + i), {pad 2, jitter 4}), part `crumb-` + 'abc'[min(2, ⌊3J(6080 + i)⌋)], flip J(6120 + i) < 0.5, z ground, prio 0. capCut([9, 0, 0]).

### 8.13 검증 벡터 (C9, 소수 둘째 자리 반올림, phase 셋째 자리)

필드는 [part, x, y, flip, phase, z, prio]다. 원문은 2차 납품서에 있다(메인 세션 이식 시험의 기준).
- 불(수정 2회차와 같음): `fire:50:1` 11항목, `fire:74:7` 20항목, `fire:98:7` 31항목, `fire:150:23` 36항목. 불티 벡터 다섯도 그대로다.
- `slow:150:5`(ch 3) 23항목: mire-l 17 + mire-m 1 + 기포 5.
- `water:200:3`(ch 3) 9항목: 물결 5 + 흐름 3 + 반짝임 1.
- `root:52:9` 4항목.
- `null:130:11` 8항목, paths ghost 4줄 + jag 1줄(12점).
- `shock:190:11` 6항목(돌 조각), paths cracks 14줄.

## 9. 그리는 순서(렌더러, `draw`도 같은 순서)

**층 순서(한 지형 안)**: 바닥(원판·해칭) → z ground 조각 → 매개 선(균열·유령 선·다이얼·바퀴살) → 테 → z flame(y 오름차순) → z air.

| kind | 순서 |
|---|---|
| fire | 원판 → char → 테(열 띠 → 먹 → 산호 → glow) → ignite 섬광 띠 → 무더기(y순) → 불티 → 연기 |
| shock telegraph | 균열 → 돌 조각(imminent) → 예고 테(현행) |
| shock burst | 산호 채움 → 망점 가장자리 → 섬광 띠 → 균열 → core → 파편 → 먼지 |
| shock decal(데칼 층) | 웅덩이 → 담묵 균열 → (처음 0.05초) 파편·먼지 |
| slow | 바닥 채움 → 해칭 → 웅덩이(ground) → 기포(flame) → 테. 4장: 바닥 → 해칭 → 다이얼 눈금 → 바늘 → 바퀴통 → 테 |
| water | 담묵 원판 → 물결·흐름·반짝임(ground, y순) → 젖은 테 |
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
| water | 물결 + 흐름 + 반짝임 | 물결 ⌈nr/2⌉ + 흐름 ⌈nf/2⌉ | 물결 1(3번 장 정지) |
| root | 덩굴 전부, 6fps | 3fps | phase 장 정지(덩굴은 그대로, info) |
| trap | 기계 1 | 같음 | 같음 |
| null | 부스러기 5~9 | 부스러기 0 | 부스러기 0 |
| 모든 종류 | 테·바닥·해칭·다이얼·균열·유령 선·바퀴살은 모든 LOD에서 그린다 | | |
| hero | back·front·embers·bind | front·bind 그대로 | front 정지, embers 0, bind는 그대로(prog) |

| 설정 | 처리 |
|---|---|
| 감소 모션 | 루프는 인스턴스별 phase 장에서 정지. prog(ignite·gutter·emerge·wither·spring·burst·bind)는 재생. 불티·연기·흐름·반짝임 0. 기포 2번 장, 물결 3번 장. 다이얼 바늘은 눈금 단위로 뛴다. 물듦 α 0.20 고정. 흔들림·회전·펄스 없음 |
| 감소 섬광(`flash: 0.5`) | 불 시작 띠, shock 섬광 띠·core·산호 채움 α × 0.5. 물듦 α 0.20 고정 |

## 11. 예산 실측

- **조각**: 285장, 박스 넓이 합 400,936 단위²(상한 330장·45만). @2x 약 160만 px²로 2048² 한 장(419만 px²)에 든다.
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
  | water 140·145 / 200 / 270 | 7 / 9 / 13 | 3 / 5 / 7 | 1 | 13 / 7 / 1 |
  | root 50·52 | 4 | 4 | 4 | 6 |
  | trap 60~98 | 1 | 1 | 1 | 1 |
  | null 110 / 120·130 / 170 | 7 / 8 / 9 | 0 | 0 | 9 / 0 / 0 |

- **덮임·빈 자리**(`areaOf`, §8.0-5. 2차 납품서에 원문):

  | 종류 r | 채움 | 빈 자리 | seed, 격자 |
  |---|---|---|---|
  | fire 74 / 98 / 150 | 덮임(B) 51.2~52.6 / 47.4~49.7 / 29.8~30.3 | 28.3~30.5 / 33.9~43.3 / 62.2~76.4 | 1·7·23·42·99, 2(수정 2회차와 같음) |
  | slow 60 / 86 / 100 / 120 | 30.8~30.9 / 29.8~30.0 / 29.9~30.0 / 29.8~29.9 | 23.3~36.0 / 30.5~36.0 / 40.2~51.2 / 51.2~62.1 | 1·5·9, 2 |
  | slow 145 / 150 / 160 | 29.9 / 29.8~30.0 / 28.9~30.6 | 56.7~59.4 / 57.3~61.3 / 54.4~61.2 | |
  | slow 200 / 240 / 270 | 30.0~30.2 / 29.8 / 29.2~29.4 | 75.5~77.3 / 95.1~99.1 / 102.5~132.5 | |
  | root 50 / 52 | 2.5~2.6 / 2.4~2.5 | 38.6~40.2 / 42.5~44.2 | 1·5·9, 1 |
  | water 145 / 200 / 270 | 자리(extent) 2.2~2.3 / 1.6 / 1.2~1.3 | 116.2~124.9 / 152.0~164.7 / 184.0~201.0 | 1·3·7, 2 |

  - 웅덩이는 모든 반경에서 25~35% 안(28.9~30.9%)이다. 빈 자리는 웅덩이 크기와 함께 커진다(지름 대비 약 0.2~0.25).
  - 물은 물결·흐름이 작고(40×18, 44×10) 개수 상한이 13이라, 칠한 자리가 1~2%이고 빈 자리가 크다(§15 알려진 한계).

## 12. 자가 확인

### 12.1 명령(지시서 §7.2 C1~C12, 2차 렌더 이름 `k11-d2-`)

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
| C7 | 1~5줄 0건, 6줄 `invalid calls ok`(4줄은 `RC.back` [−22,−26,22,2]) |
| C8 | `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045` |
| C9 | §8.13(불 넷은 수정 2회차와 같음) |
| C10 | 모든 줄 ok(fire 1.78~1.82, water 1.57~1.60, trap 2.31~2.42, null 1.54~1.75, soot 1.34~1.36, 코트 Y 0.620/0.780/0.705) |
| C11 | 40장 ok |
| C12 | `frames=285 ok boxArea=400936 ok badDrive=0` |
| `PN.hazards._.check()` | 0건(약 20초), `{areas: false}` 0건 |

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
| `AREA_RULES.water` | 보고만(145·200·270 × seed 1·3·7) | 검수 2차 §7-4 |
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
31. **묶임 오버레이 높이**: 발목(장화)은 어두워 덩굴이 묻혀서 코트 자락 높이(y −9.4·−6.4)에 감았다. 범위 상한은 지켰다.
32. **water 면적 마스크**: 물결은 얇은 고리라서 `areaOf`가 칠한 픽셀 대신 내접 타원(자리)으로 센다(`extent`). 보고만 한다.
33. **slow `MASKS`·`AREA_RULES.slow`의 반경**: 지시서 §13-10의 25~35%를 맵 반경(145·200·270)까지 검사한다.

## 14. 사람 원화가에게 남길 것 (바이블 §15)

- 불길 무더기와 낮은 불길의 붓 실루엣: 손으로 그린 불의 리듬, 끝의 비백, 그늘 쪽 먹의 붓 굵기.
- 숯불 바닥과 그을음 얼룩의 비백, 숯덩이 모양, 빛나는 금의 붓질. 불티·연기의 붓질.
- 먹 덩굴의 가시와 테이퍼, 묶임 덩굴이 다리를 감는 앞뒤 관계(지금은 두 가닥 X).
- 장별 덫 기계(특히 3장 그물과 4장 톱니)의 쇠 질감.
- shock 돌 조각·core의 판석 파편, 균열 가지의 붓 리듬.
- 웅덩이 가장자리의 먹 번짐, 큰 웅덩이(xl)의 표면(지금은 평평한 ink700 + 초승 윤기).
- null 지우개 부스러기의 말린 모양.
- 주인공 front는 달리기 큰 걸음 장(run 0·4)에서 장화 먹이 14~23%만 보인다(예외 승인).
- 정식 판독 시험(n ≥ 8)은 하지 않았다.

## 15. 알려진 한계

- **물의 무늬가 성기다**: 물결 40×18·흐름 44×10과 한 지형 상한 13 때문에 r ≥ 200에서 물결·흐름이 원의 1~2%만 지난다. 물은 담묵 원판 + 젖은 테로 읽히지만(T1 통과), 더 촘촘한 수면이 필요하면 xl 웅덩이처럼 큰 물결 단을 더하는 것이 같은 방식의 처방이다.
- **불의 후보 나선**: §8.0의 jit 성질 때문에 불 몸 무더기 후보도 나선 두 줄 위에 있다. 합격 판이라 그대로 두었다.
- **정지 렌더로 판단하지 못한 것**: 2Hz 물듦과 루프·cycle 움직임, 다이얼 바늘 쓸기, 성능.
