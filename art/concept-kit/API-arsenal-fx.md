# API — `k-arsenal-fx.js` · `PN.arsenalFx` v1.0-d2r1 (무기 44종 전장 효과 — 납품 2: lob 비행, 수정 1회차)

작업 지시서: `docs/art/briefs/arsenal-fx.md`(K10, R5 추가 발주 B7, 2026-10-16). 끝의 §12 메인 세션 결정과 §13 검수 1차 정정이 본문보다 앞선다(열린 질문 Q1~Q13은 모두 권고안).
같은 물건의 꼴 기준: K9 검수 7차 §7(`docs/art/deliveries/K9-arsenal-icons.md`)과 그 뒤 R7·F2. 대조한 K9 아이콘 해시(평상/각성)는 유성 붓 `f0ap7s`/`1eekf35`, 타르 항아리 `1mq1jnw`/`chm7dz`, 일곱째 인장 `11totq1`/`1s8ck17`이다.
기준: 스타일 바이블 v1 §2.3·§3·§4.2·§5.1·§5.3·§6·§7.2·§9·§10.1·§12·§13·§15, 로어 바이블 §1.3·§1.4·§3.1·§4.
킷 출력은 잠정 아트다(바이블 §15). 물건의 붓 외곽·블랙 스팟·비백은 사람이 다시 긋는다(§13).

| 납품 | 날짜 | 들어 있는 것 |
|---|---|---|
| 1차 | 2026-10-16 | 뼈대 전부(토큰 `K`, `META` 44종과 `geo`, `SPEC`, `jit`, `layout`·`paths`·`lobPath`, `parts`·`stamp`, `draw`·`overlay`)와 투사체 없는 22종의 주 단계(평상·각성). lob 4종은 착탄(`land`)까지. `lobPath` 식과 `SPEC.lob`은 1차에 들어 있다(비행 조각은 2차) |
| 1차 수정 2회차 | 2026-10-19 | 검수 2차('## K10 검수 2차') F1·F2: 일곱째 인장만. 인영 a·b의 매듭 획을 곡률이 끊기지 않는 붓 한 획의 '풀린 끈'으로(c는 그대로), 인장 꼭지를 목 + 공 꼭지로. 바뀐 조각은 seventhSeal 9장(`seal` 3, `seal-awakened` 3, `print-a/b/c`)뿐이고, seventhSeal을 뺀 보존 해시 `k10-keep2`는 그대로다(§11). `SPEC.version` `1.0-d1r2` |
| 1차 수정 1회차 | 2026-10-19 | 검수 1차(`docs/art/deliveries/K10-arsenal-fx.md` '## K10 검수 1차') 필수 M1~M4와 권장 R1~R4. 새 매개 도형 `punch`(§7.3)·`splash`(§7.3a)·`tilt`(§7.3b), 유성 붓 `streak-a/b` 삭제(141 → 137장), 착탄 물건 다시 그림(먹단지·송이 단지 0번 장, 타르 항아리·유성 붓·인영 셋, 족자는 똑바로), 서리 결정·손뼉·얼음판 금. `SPEC.version` `1.0-d1r1`. 보존 해시는 §11 |
| 2차 | 2026-10-19 | lob 비행 4종: `flight` 단계(§9.1), 비행 물건 조각 32장(`pot`·`pot-awakened`, `pot-s`·`pot-m`, `jar`·`jar-awakened`, `comet`·`comet-awakened`), 갈라짐용 `mini` 4장, `SPEC.flight`(§7.7), `lobPath`의 `mini` 경로(§8.4), 그림자 채움 `lob.shadow`(§7.9). 검수 3차 판단 1의 `print-c` 붓 획. `SPEC.version` `1.0-d2`. 바뀐 기존 출력은 `print-c` 한 장뿐이다(§11) |
| 2차 수정 1회차 | 2026-10-19 | 검수 4차('## K10 검수 4차') F1·F2, 규칙만(그림 그대로): F1 먹단지 `pot`·`pot-awakened`를 prog(비행 진행률로 한 번 구름, `SPEC.flight.inkPots.frame` `'progress'`), F2 유성 붓 착탄 좌우 반전 규칙(`SPEC.flight.meteorBrush.landMirror`, 참고 합성 `draw(…, 'land', {dir: −1})`). `SPEC.version` `1.0-d2r1`. 보존 해시는 §11 |
| 3차 | — | 각성 기믹 P1 17종 → P2, 적 오버레이, `overlays` 목록, 이 문서의 기믹 절 |

안 그린 단계·조각은 `META.stages`·`gimmicks`·`groups`에 없다. 그래서 지시서 §7.2의 명령이 납품마다 그대로 돈다. 메인 세션은 `META[id].done.fx === true`인 것만 등록한다.

## 1. 로드와 의존

```html
<script src="kit/lib.js"></script>
<script src="kit/k-arsenal-fx.js"></script>   <!-- window.PN.arsenalFx -->
```

- 모든 선언은 IIFE 안에 있다(`window.PN = window.PN || {}`).
- **의존 없음.** 다른 킷 모듈(`PN.skillVfx`·`PN.arsenal`(K9)·`PN.hazards`(K11)·`PN.env`·`PN.heroKit`·`PN.enemies`)을 부르지도 읽지도 않는다. `lib.js`의 도우미도 쓰지 않는다(모듈 안의 도우미만 쓴다). 그래서 로드 순서에 매이지 않는다.
- 굽기: 메인 세션이 `scripts/build-atlas.mjs:11`의 `KIT_FILES`에서 `'k-icons2.js'` 바로 뒤에 넣는다. 리뷰 시트는 이름순으로 자동으로 읽는다.
- 반환은 늘 `<g class="kaf kaf-<group 또는 id>"><defs>…</defs>…</g>` 하나다. 호출마다 `kaf<N>_` 접두를 쓰는 `Ctx`를 갖지만, 1차 그림은 id를 쓰지 않는다(클립·패턴·필터 없음). 카운터는 되감지 않는다.
- 결정적이다. `Math.random`·`Date`가 없다. 들쭉날쭉한 값은 모두 `jit(seed, i)`(§8.1)다. id를 빼면 같은 호출의 출력은 같다.
- `<text>`·그라데이션·필터·혼합 모드·`<image>`·`<pattern>`이 없다(C6 `banned=0`).
- 한글은 `META[id].name`에만 있다. `SPEC`과 `parts()` 서술자에는 없다(C6 `korean=0`).

## 2. 단위·좌표·판정 (지시서 §1.3 그대로)

- 월드 단위 = 1440×900 줌 1.0의 1x px. 조각은 `scale: 1`로 @2x에 굽는다. **조각은 늘이지 않는다.**
- 조각은 로컬 박스 `[0, w] × [0, h]`에 그리고 `anchor`가 배치점에 놓인다. 칠한 기하는 박스 가장자리에서 3 이상 안쪽이다(C7 1줄 0건).
  - 돌린 물건(손뼉 두 손, 손종 흔들림, 쓰러진 항아리, 박힌 붓, 사기 조각, 바람 획)은 `<g transform="rotate">`가 아니라 **실제 좌표**로 그린다(모듈 안 `TX`·`txPath`). 돌린 `<g>`는 `getBBox`가 돌린 상자 전체를 재서 박스 검사가 실제보다 넓게 잡히기 때문이다.
  - 족자는 모든 장을 **똑바로** 굽고, 기울기는 렌더러가 `SPEC.tilt`(§7.3b)로 앵커를 축으로 돌린다.
- **판정 = 게임 값(V4).** 폭발 고리의 중심선은 정확히 R이다. 굵기가 변하는 띠는 R에 걸친다. halo는 바깥 R과 안쪽 `inner`, beam은 축에서 반폭 `width`인 캡슐, chain은 점 목록 그대로다.
- **원점**: 폭발 단계 = 사건 중심, nova·halo = 주인공 발, beam = 빔 시작점(+x = 빔 방향), chain = 첫 점(주인공), lob `flight` = 던진 자리(`opts.dx`·`dy`가 착지 자리).
- **주인공을 가리지 않는다**: 주인공 발에서 시작하는 선·띠·캡슐(beam 넷, chain의 첫 구간)은 시작점에서 `SPEC.footClear` = 26 떨어진 곳부터 칠한다. `place: 'origin'` 조각(술, 먹통)은 앵커에서 26 이상 떨어진 곳에만 칠한다. `place: 'head'` 조각(손뼉, 손종)은 앵커 아래로 칠하지 않는다(렌더러는 (0, `SPEC.headY` −66)에 놓고, 디버프 타이머가 있으면 `headLift` 26만큼 올린다).
- 판정 고리와 띠는 위에서 본 참 원이다. 땅에 눕는 자국(인영, 붓자국, 단지 튐, 타르 웅덩이, 분화구, 그을음)은 납작하게(ry ≈ 0.42·rx) 그린다. 얼음판(`rime<r>`)만 박스 높이 때문에 0.30~0.38이다(§12-13).
- 각도는 화면 좌표(y 아래)다. 0° = 오른쪽, 각이 커지는 쪽 = 시계 방향.

## 3. 공개 API

```js
PN.arsenalFx = {
  version: '1.0',   // 납품 단계는 SPEC.version(지금 '1.0-d2r1')
  K,          // 토큰 11개(§7.1). 이름은 PN.skillVfx.K와 같고 값은 구현값 hex
  ids,        // 44개, src/content/data/arsenal.ts 순서
  kinds,      // ['volley','burst','spray','rear','seeker','strike','nova','lob','chain','beam','halo']
  META,       // §4 (얼려 있음)
  groups,     // 조각이 있는 무기 id: 1차 22개
  overlays,   // 적 오버레이 키: 1차 [] (3차)
  SPEC,       // §7. 토큰 이름·숫자·영어 낱말만 → 매니페스트에 그대로
  jit,        // jit(seed, i) → 0..1
  parts(group),                        // → [{part, frames, drive, fps, seconds, still, box, anchor, place, rotate, layer, lod, flash, window, r?}] (복사본)
  stamp(group, part, { frame }),       // 굽는 조각(로컬 박스). frame은 [0, frames−1]로 자른다
  layout(id, stage, opts),             // → [{prim, part, x, y, angle, flip, phase, prio, z, dr?, index?}] (§8.2)
  paths(id, stage, opts),              // → { 이름: [[x, y], …] } 매개 도형의 정의 점(C9, §8.3). 수정 1회차에 splash·drops·tilt 키가 더해졌다
  lobPath(id, { x0, y0, x1, y1, t, mini? }),  // → { x, y, h, angle, shadow: { rx, ry, alpha } } (§8.4). mini는 송이 단지만
  draw(id, stage, opts),               // 참고 합성(리뷰·골든). 원점은 §2, lob 'flight'는 던진 자리
  overlay(key, opts),                  // 1차: 모든 key가 모르는 key
};
```

**opts**

| 옵션 | 기본값 | 뜻 |
|---|---|---|
| `level` | 3 | 1~5. `geo`로 수·반경·길이를 셈한다(`arsenalStats`와 같다: 수는 내림) |
| `awakened` | false | 각성 조각 + 공통 강화(수 +1, 반경·길이·beam 폭 ×1.2. halo `inner`는 그대로) + 각성 SPEC |
| `p` | 0.35 | 그 단계 안 진행률. 나이 = p × `SPEC.life[id].mark` |
| `t` | 0.2 | 초. loop 조각과 깜빡임(jag·twist)의 시계. **lob `flight`에서는 비행 진행률**(lobPath의 t, 0~1, 지시서 C11의 `t`)이고, 비행 나이 = t × `geo.delay` |
| `dx`, `dy` | 240, −60 | lob `flight`만: 던진 자리(원점)에서 착지 자리까지 |
| `dir` | 없음 | lob 착탄(`land`)만: −1이면 그 lob이 오른쪽에서 왼쪽으로 날아왔다(x1 < x0). `SPEC.flight[id].landMirror`가 있는 무기(유성 붓)는 그 조각을 좌우 반전한다(§9.2). 없거나 0 이상이면 반전하지 않는다(기본 출력 그대로) |
| `seed` | 1 | 정수. 게임에서는 표시 일련번호(지시서 §9-3) |
| `radius`, `inner`, `length`, `width`, `points` | `geo`에서 | 덮어쓰기(덮어쓴 값에는 각성 ×1.2를 다시 곱하지 않는다). `points`는 `[{x, y, r?}]` 또는 `[[x, y]]` |
| `lod` | `'full'` | `'full'`·`'reduced'`·`'minimal'` |
| `reduced` | false | 감소 모션 |
| `ch` | 1 | 1~5. 1차는 쓰지 않는다(3차 맥락 그림용) |
| `context` | false | 1차는 쓰지 않는다(3차 C5) |

**잘못된 호출**(C7 5줄 ok)
- `parts(모르는 group)`, `stamp(모르는 group, …)`, `stamp(group, 모르는 part)`: `throw new Error('PN.arsenalFx: unknown …')`. 굽기가 조용히 다른 그림을 굽지 않게 한다.
- `draw(모르는 id 또는 납품 안 된 단계)`, `overlay(모르는 key)`: `console.warn('PN.arsenalFx: …')`를 남기고 정확히 `'<g/>'`를 돌려준다.
- `layout`은 같은 경우에 `[]`, `paths`는 `{}`를 돌려준다(경고 없음). `lobPath(lob이 아닌 id)`는 `null`이다.

## 4. META (44종)

필드: `name`(ko.json `skill.<id>`, 문서용) · `rarity`·`kind`·`look`(arsenal.ts 그대로) · `geo`(arsenal.ts의 기하: `radius`·`length`·`count`·`jumps`는 [기본, 레벨당], 나머지는 `inner`·`width`·`directions`·`hop`·`scatter`·`delay`·`size`) · `main`(주 단계, 투사체 무기는 `null`) · `stages`(납품한 단계) · `gimmicks`(납품한 기믹 `[{stage, priority}]`, 1차 `[]`) · `object`(대표 물건 조각, C15) · `done`(`{fx, lob, gimmick}`).

| id | 이름 | 등급 | kind | look | main | stages | object | 기믹(지시서 §4.1, 3차) | done fx/lob/gimmick |
|---|---|---|---|---|---|---|---|---|---|
| inkDarts | 먹침 | common | volley | needleStorm | — | — | — | 먹 얼룩 P2 | ✗/✗/✗ |
| brushQuills | 붓깃 | common | volley | fanKnives | — | — | — | 늦게 터지는 붓자국 P2 | ✗/✗/✗ |
| sealArrows | 인장 화살 | rare | volley | needleStorm | — | — | — | 도미노 P2 | ✗/✗/✗ |
| frostNeedles | 서리침 | rare | volley | needleStorm | — | — | — | 동결 P1 · 서리 수 P2 | ✗/✗/✗ |
| thunderNeedles | 뇌침 | rare | volley | needleStorm | — | — | — | 감전 도약 P2 | ✗/✗/✗ |
| twinBlades | 쌍날 | common | volley | fanKnives | — | — | — | 회전 베기 P1 | ✗/✗/✗ |
| ghostVolley | 혼령 일제사격 | epic | volley | mirrorClone | — | — | — | (P3) | ✗/✗/✗ |
| headsmanDarts | 망나니 침 | legendary | volley | needleStorm | — | — | — | 공포 P2 | ✗/✗/✗ |
| paperStorm | 종이 폭풍 | rare | burst | fanKnives | — | — | — | (그림 없음) | ✗/✗/✗ |
| inkBloom | 먹꽃 | rare | burst | needleStorm | — | — | — | 꽃가루 P2 | ✗/✗/✗ |
| thornHalo | 가시 테 | epic | burst | needleStorm | — | — | — | 가시 박힘 P2 | ✗/✗/✗ |
| starShards | 별조각 | epic | burst | mirrorClone | — | — | — | (P3) | ✗/✗/✗ |
| sunNeedles | 해바늘 | mythic | burst | needleStorm | — | — | — | 작열 P2(렌더러 배율) | ✗/✗/✗ |
| inkDrizzle | 먹 이슬비 | common | spray | needleStorm | — | — | — | (그림 없음) | ✗/✗/✗ |
| pinHail | 핀 우박 | rare | spray | fanKnives | — | — | — | 마름쇠 P1 | ✗/✗/✗ |
| tailGuard | 꼬리 방패 | common | rear | fanKnives | — | — | — | 배후 응징 P2 | ✗/✗/✗ |
| smokeTail | 연막 꼬리 | rare | rear | needleStorm | — | — | — | 연막 P1 · 헤맴 P2 | ✗/✗/✗ |
| gravePins | 묘침 | epic | rear | needleStorm | — | — | — | 묘비 P1 · 묶임 P2 | ✗/✗/✗ |
| trackingSeals | 추적 인장 | rare | seeker | needleStorm | — | — | — | 삼각 봉인 P1 | ✗/✗/✗ |
| huntersMarks | 사냥꾼 표식 | epic | seeker | mirrorClone | — | — | — | 사냥감 P1 | ✗/✗/✗ |
| crowFeathers | 까마귀 깃 | rare | seeker | fanKnives | — | — | — | 까마귀 떼 P1 | ✗/✗/✗ |
| bossbane | 보스 사냥침 | legendary | seeker | needleStorm | — | — | — | 균열 P2 | ✗/✗/✗ |
| inkLightning | 먹번개 | rare | strike | chainSpark | impact | impact | bolt | 번개 기둥 P1 | ✓/✗/✗ |
| brushDownpour | 붓 폭우 | epic | strike | boneMortar | impact | impact | stroke-a | 거세지는 폭우 P1(새 그림 없음, §12-25) | ✓/✗/✗ |
| fallingScroll | 족자 낙하 | epic | strike | boneMortar | impact | impact | scroll | 펼쳐지는 족자 P1 | ✓/✗/✗ |
| seventhSeal | 일곱째 인장 | mythic | strike | voidMine | impact | impact | seal | 여덟째 인장 P1 | ✓/✗/✗ |
| inkPulse | 먹 파동 | common | nova | boneMortar | burst | burst | null | 밀쳐 부딪힘 P2 | ✓/✗/✗ |
| frostRing | 서리 고리 | rare | nova | blackSun | burst | burst | shard-a | (P3) | ✓/✗/✗ |
| thunderclap | 천둥 박수 | epic | nova | chainSpark | burst | burst | clap | 메아리 P2 | ✓/✗/✗ |
| silenceBell | 침묵의 종 | legendary | nova | voidMine | burst | burst | bell | 침묵 P1 | ✓/✗/✗ |
| inkPots | 먹단지 | common | lob | boneMortar | land | land, flight | pot | 불먹 P1 | ✓/✓/✗ |
| clusterPots | 송이 단지 | rare | lob | boneMortar | land | land, flight | pot-m | 갈라짐 P2 | ✓/✓/✗ |
| tarJar | 타르 항아리 | epic | lob | voidMine | land | land, flight | jar | 끈끈이 모음 P1 | ✓/✓/✗ |
| meteorBrush | 유성 붓 | legendary | lob | boneMortar | land | land, flight | comet | 별똥 자국 P1 · 결 가속 P2 | ✓/✓/✗ |
| sparkThread | 불꽃실 | common | chain | chainSpark | jump | jump | spark | 되감김 P2 | ✓/✗/✗ |
| stormThread | 폭풍실 | epic | chain | chainSpark | jump | jump | null | 증폭 P2 | ✓/✗/✗ |
| frostChainlet | 서리 사슬 | rare | chain | chainSpark | jump | jump | null | 묶인 사슬 P2 | ✓/✗/✗ |
| inkLance | 먹창 | rare | beam | railSpear | stroke | stroke | tassel | 가지창 P2 | ✓/✗/✗ |
| wideBrush | 넓은 붓 | epic | beam | frostLine | stroke | stroke | brush | 되쓸기 P2 | ✓/✗/✗ |
| crossStrokes | 십자 획 | epic | beam | railSpear | stroke | stroke | null | (P3) | ✓/✗/✗ |
| judgmentLine | 심판선 | mythic | beam | railSpear | stroke | stroke | inkbox | (P3) | ✓/✗/✗ |
| inkOrbit | 먹 궤도 | common | halo | orbitScythes | sweep | sweep | null | 되받기 P2 | ✓/✗/✗ |
| wardRing | 수호 고리 | rare | halo | eclipseStep | sweep | sweep | knot-a | 약화 P2 | ✓/✗/✗ |
| eclipseHalo | 일식 테 | legendary | halo | eclipseStep | sweep | sweep | ribbon-a | 개기일식 P1 | ✓/✗/✗ |

- `object`: lob 4종은 1차에 착탄 조각(shatter·burst·crack·impact)을 적었고, 2차부터 비행 물건(pot·pot-m·jar·comet)이다. `stages`는 주 단계가 앞이고 `flight`가 뒤다.
- 물건 조각이 없는 무기: 먹 파동(주인공이 매듭), 폭풍실·서리 사슬·십자 획·먹 궤도(선·띠가 물건이다).

## 5. 굽는 조각 (`parts(group)`) — 173장, 박스 넓이 합 389,928 단위² (1차 141장 → 수정 1회차 137장(유성 붓 `streak-a/b` 삭제) → 2차 +36장: 비행 물건 32 + `mini` 4)

- 굽기 키 `afx/<group>/<part>/<frame>`, 호출 `['PN.arsenalFx.stamp', group, part, { frame }]`, `scale: 1`.
- `fps`는 loop만 값이 있다(나머지 0). `still`은 loop만 값이 있다(나머지 `null`).
- `seconds`: prog는 그 창의 길이(초)다. `window`가 `chain`·`beam`인 prog는 `null`이고 자료(연쇄 0.18초, 빔 0.28초)가 창을 정한다. idx 데칼(`window: 'decal'`)의 `seconds`는 **데칼 수명**(참고값, `SPEC.life[id].decal`과 같다)이다.
- 각성에서만 쓰는 조각은 이름이 `-awakened`(서리 고리는 `shard-awakened-*`)다.
- `r`은 적 발밑 조각(`rime<r>`)의 크기 등급이다. 적 반지름에 가장 가까운 등급을 쓴다(≤ 15.5 → 12, ≤ 23.5 → 19, 그 밖 → 28).

| group / part | 장 | drive | 초 | window | box | anchor | place | rotate | layer | lod |
|---|---|---|---|---|---|---|---|---|---|---|
| inkLightning / bolt, bolt-awakened | 4씩 | prog | 0.24 | mark | 36×120 | 18,112 | target | none | ally | info |
| inkLightning / scorch | 1 | idx | (0.6) | decal | 52×24 | 26,12 | target | none | ground | deco |
| brushDownpour / stroke-a, stroke-b, stroke-a-awakened, stroke-b-awakened | 3씩 | prog | 0.18 | mark | 48×88 | 14,80 | target | none | ally | info |
| brushDownpour / mark-s · mark-m · mark-l | 1씩 | idx | (0.9) | decal | 56×28 · 76×36 · 100×46 | 가운데 | target | none | ground | deco |
| fallingScroll / scroll, scroll-awakened | 4씩 | prog | 0.42 | mark | 52×104 | 26,98 | target | none | ally | info |
| seventhSeal / seal, seal-awakened | 3씩 | prog | 0.3 | mark | 40×56 | 20,50 | target | none | ally | info |
| seventhSeal / print-a, -b, -c | 1씩 | idx | (1.2) | decal | 48×24 | 24,12 | target | none | ground | deco |
| inkPulse / splash-a, splash-b | 3씩 | prog | 0.3 | mark | 40×28 | 6,14 | ring | radial | ally | deco |
| frostRing / shard-a, -b, -c | 3씩 | prog | 0.45 | mark | 36×32 | 6,16 | ring | radial | ally | info (앞 3개 prio 0, 나머지 prio 2) |
| frostRing / shard-awakened-a, -b | 3씩 | prog | 0.45 | mark | 44×36 | 6,18 | ring | radial | ally | info (같음) |
| thunderclap / clap, clap-awakened | 3씩 | prog | 0.24 | mark | 60×44 | 30,42 | head | none | ally | info |
| silenceBell / bell, bell-awakened | 3씩 | prog | 0.45 | mark | 40×52 | 20,50 | head | none | ally | info |
| inkPots / shatter | 3 | prog | 0.3 | mark | 76×64 | 38,40 | target | none | ally | info |
| inkPots / splat | 1 | idx | (1.2) | decal | 64×30 | 32,15 | target | none | ground | deco |
| clusterPots / burst | 3 | prog | 0.24 | mark | 56×48 | 28,30 | target | none | ally | info |
| tarJar / crack | 3 | prog | 0.32 | mark | 80×56 | 40,34 | target | none | ally | info |
| tarJar / pool | 1 | idx | (1.5) | decal | 104×44 | 52,22 | target | none | ground | deco |
| meteorBrush / impact, impact-awakened | 3씩 | prog | 0.36 | mark | 88×68 | 44,46 | target | none | ally | info · **flash** |
| meteorBrush / crater | 1 | idx | (1.5) | decal | 120×52 | 60,26 | target | none | ground | info |
| inkPots / pot, pot-awakened (2차, 수정 1회차 F1) | 4씩 | **prog**(비행 진행률 t, §8.4) | (0.55) | flight | 30×34 | 15,17 | air | none | air | info |
| clusterPots / pot-s · pot-m (2차) | 4씩 | loop 12fps, still 0 | — | flight | 22×26 · 26×30 | 11,13 · 13,15 | air | none | air | info |
| clusterPots / mini (2차, 3차 갈라짐용) | 4 | loop 12fps, still 0 | — | pending | 18×20 | 9,11 | air | none | air | info |
| tarJar / jar, jar-awakened (2차) | 4씩 | loop 8fps, still 0 | — | flight | 34×38 | 17,19 | air | none | air | info |
| meteorBrush / comet, comet-awakened (2차) | 4씩 | loop 12fps, still 0 | — | flight | 32×92 | 16,14 | air | **path**(머리 위로 구움, §7.7 turn 90°) | air | info |
| sparkThread / spark, spark-awakened | 2씩 | prog | — | chain | 24×24 | 12,12 | point | none | ally | deco |
| stormThread / gust-a · gust-b | 2씩 | prog | — | chain | 24×20 · 32×26 | 12,10 · 16,13 | point | none | ally | deco |
| frostChainlet / rime12 · rime19 · rime28 | 1씩 | idx | — | class | 36×18 · 48×22 · 64×28 | 18,9 · 24,11 · 32,14 | feet | none | feet | info (r 12·19·28) |
| inkLance / tassel, tassel-awakened | 2씩 | prog | — | beam | 60×22 | 56,11 | origin | beam | ally | info |
| wideBrush / brush, brush-awakened | 3씩 | prog | — | beam | 56×48 | 14,24 | tip | beam | ally | info |
| crossStrokes / scrap-a, scrap-b | 2씩 | prog | — | beam | 20×16 | 10,8 | tip | beam | ally | deco |
| judgmentLine / inkbox, inkbox-awakened | 2씩 | prog | — | beam | 64×30 | 60,15 | origin | beam | ally | info |
| judgmentLine / flick-a, flick-b | 2씩 | prog | 0.24 | beam | 22×18 | 11,9 | line | beam | ally | deco |
| inkOrbit / chip-a, chip-b | 2씩 | prog | 0.24 | mark | 16×12 | 4,6 | ring | radial | ally | deco |
| wardRing / knot-a, knot-b | 1씩 | idx | — | variant | 22×18 | 11,9 | ring | radial | ally | info |
| eclipseHalo / ribbon-a, ribbon-b | 3씩 | loop 12fps, still 0 | — | mark | 36×18 | 32,9 | ring(초승 꼬리) | tangent | ally | info |

장 수: 먹번개 9, 붓 폭우 15, 족자 8, 인장 9, 먹 파동 6, 서리 고리 15, 천둥 박수 6, 침묵의 종 6, 먹단지 12(착탄 4 + 비행 8), 송이 단지 15(착탄 3 + 비행 8 + mini 4), 타르 12(4 + 8), 유성 붓 15(7 + 8), 불꽃실 4, 폭풍실 4, 서리 사슬 3, 먹창 4, 넓은 붓 6, 십자 획 4, 심판선 8, 먹 궤도 4, 수호 고리 2, 일식 테 6 = **173**.
- 굽기 키 `afx/meteorBrush/streak-a/*`·`streak-b/*`는 없어졌다(등록하지 않는다).
- 2차 조각은 각 그룹 목록의 **끝**에 붙였다(앞 조각의 순서·키는 그대로). 비행 조각은 `place: 'air'`, `layer: 'air'`(ally 층 + 땅 그림자)이고 loop의 창은 자료(비행 지연)가 정한다(`seconds` 없음). `mini`의 창은 3차 갈라짐의 대기(`pending`)다.
- 먹단지 `pot`·`pot-awakened`(수정 1회차 F1)는 prog다. 장은 비행 진행률 t로 고르고(min(3, ⌊t·4⌋)), `seconds` 0.55는 먹단지 비행 지연과 같은 참고값이다(지시서 C2 식이 prog에 seconds를 요구한다). 렌더러는 자료의 지연을 쓴다. 굽기 애니메이션에 fps를 싣지 않는다.

## 6. 조각 그림 요약

공통: 물건 외곽 먹 1.5~2.4, 내부선 0.8~1.2. 3계조(먹 / 담묵·중묵 / 종이), 망점 없음. 빛은 왼쪽 위. 청록은 늘 먹 위에 얹는다.
**각성 물건(§1.8)**: 물건 실루엣 아래에 먹 6.0 + 종이 4.4 선을 깐다(물건 외곽선이 안쪽 ~1을 덮으므로 종이 띠 ≈ 1.0~2.2, 먹 2.2~3.0 바깥). 섬광에는 두르지 않는다. 0번 장 물건 위 가장자리에 5~6갈래 불규칙 종이 반짝임 하나(r 2.4~2.8).

| 무기 | 물건 · 장 진행 | 청록 요소 |
|---|---|---|
| 먹번개 | 작은 먹구름(ink500 명부)에서 앵커까지 수직 먹 번개(꺾임 5, 구간 길이 13.9/24.6/15/26/12.2/19.4로 이웃끼리 ≥ 30% 다름, 굵기 7.5→11.5→4.6, 칠한 높이 ~108) + 종이 심 2.2. 0: 가장 밝음, 땅에 6갈래 종이 튐, 속도 획 2. 1: 위쪽에 짧은 가지 하나, 굵기 ×0.85. 2: ×0.55, 구름 ink700. 3: 먹 점선 잔해. 각성: 위쪽 반대편 짧은 가지 하나 더 + §1.8. 가지는 위쪽 절반에만(아래로 긴 가지 둘은 다리로 읽혔다). `scorch`: 담묵 그을음 + 중묵 얼룩, 금 없음 | 번개 심 1.4(위 절반) |
| 붓 폭우 | 오른쪽 위에서 내려온 굵은 붓 획. a는 수직에서 18°·길이 64, b는 26°·68(§12-2). 머리는 앵커에 눌린 **납작한** 먹 자국(7.6×3.8, 양옆 짧은 붓털 튐), 꼬리는 붓털 셋의 비백(사이로 바닥이 보인다). 0: 다 찍힘 + 속도 획 2 + 먹 방울. 1: 획이 위로 걷힘(비백 길어짐, ink700). 2: 머리 자국과 붓털 끝만(ink700·ink300). `mark-s/m/l`: 먹 얼룩 + 오른쪽 위로 끌린 비백 꼬리 셋(납작) + 방울 둘 | 젖은 결 1.2(ally + allyG 0.4) |
| 족자 낙하 | 세로 족자(칠한 높이 ~94): 위 축봉(마개 둘), p300 표장 + 종이 화면, 화면에 옅은 담묵 산 한 덩이 + 먹 능선 한 획, 아래 축봉(큰 마개 둘). **모든 장을 똑바로 굽는다**(수정 1회차 M4). 0: 땅에 닿아 살짝 눌림(1.03×0.97) + 옆 속도 획 2 + 아래 먼지. 1: 끈이 흔들림. 2: 끈 반대로. 3: p300·ink300으로 바래고 α 0.7. 기울기 0·6·12·12°는 렌더러가 `SPEC.tilt`로 돌린다(§7.3b, 꼭대기가 약 10·19 옮겨짐). 각성: 아래 축봉 밑에서 종이 혀가 말려 나옴 + §1.8 | 걸이 끈(아치, [ink 2.4, ally 1.3]) |
| 일곱째 인장 | 옆에서 본 낮고 넓은 원기둥 도장(종이 몸 22×16, 오른쪽 p300 그늘, 윗면 타원) + **목과 공 꼭지**(수정 2회차 F2, K9 검수 7차 §7 꼴): 목 `M-2,-19.2 L2,-19.2 L1.5,-25.2 L-1.5,-25.2 Z`(먹, 공 아래로 5.2 보임), 공 중심 (0, −28.4) r 4(먹, 지름 8 = 몸 폭 22의 0.36), ink500 빛면 (−1.2, −29.6) r 1.5, 종이 점 (−1.7, −30.2) r 0.6. 실루엣(각성 겹 테)은 몸 + 목 + 공. 0: 눌림(1.06×0.9) + 속도 획 2 + 먼지, 각성 반짝임은 공의 오른쪽 위 가장자리 (4.4, −29.4) r 2.6. 1: 10 들림 + 먹 점. 2: 14 들림, α 0.55, ink300. 위 여백(getBBox) 0·1·2번 장 17.0·7.6·3.6. `print-a/b/c`: rx 17·13.5·10.5 납작 인영. 테는 둘레의 75~78%만 찍힌 붓 호(가운데 1.8, 끝 0.5로 마름; a는 호 둘 215→400°·70→165°, b는 호 하나 290→560°, c는 100→380°, 틈 자리가 서로 다름). 매듭 획(수정 2회차 F1): **a**는 왼쪽 틈으로 들어와 가운데 아래로 고르게 처졌다가 오른쪽 테를 넘어 나가는 풀린 끈, **b**는 왼쪽 아래 테에서 나와 크게 한 번 휘어 오른쪽 위 테 밖으로 튕겨 나가는 풀린 끈이다. 둘 다 곡률이 끊기지 않는 붓 한 획(`brush`: 가운데 1.4·1.3, 끝 0.4로 마름, α 0.85)이고, 12° 안에서 곧은 구간이 인영 폭의 33%·25%, 꺾인 각 최소 177.9°·177.4°, 가운데에서 0.64·0.55(반지름 비) 떨어지며, 끝은 바깥을 향한다. 닫힌 고리·안으로 말린 끝·테를 따라 도는 획(겹 테·눈꺼풀로 읽혔다)이 없다. **c**는 반달 인영(왼쪽 위가 진하게 찍혀 테가 0.8 → 2.4 → 0.8, 종이 α 0.25는 125~335° 반쪽에만)이고, 그 S 물결도 2차부터 같은 붓 획이다(검수 3차 판단 1: 가운데 1.1·끝 0.4, 물결을 조금 깊게 해 12° 안 곧은 구간 25%(전 38%), 가운데에서 0.44, 오른쪽 아래 틈으로 나감). 먹 점 1~2. layout이 J(955) < 0.5면 좌우를 뒤집어 여섯 꼴이 된다. 가운데 점과 가운데를 지나는 획은 없다 | 인면 테(아래 앞 호, [ink 2.6, ally 1.4]) |
| 먹 파동 | `splash-a/b`: 띠에서 바깥으로 튀는 먹 덩이(0: 덩이 + 방울, 1: 떨어진 덩이 + 꼬리, 2: ink700 방울). b는 위아래 반전·작은 변형 | (띠의 앞선 호, SPEC) |
| 서리 고리 | `shard-*`(수정 1회차 R1): 곧은 결정 각기둥 3~4개의 부채. 기둥마다 변이 나란하고 끝은 끌 모양, 축을 따라 한쪽 면 p50·한쪽 면 p300으로 나뉜다. 밑동은 0.8씩 떨어져 각진 얼음 조각(p50, 오른쪽 면 p300, 먹 테 1.2)에 박힌다(둥근 밑동·가지·어깨가 깃털·화살촉으로 읽혔다). 먹 테는 종이 **아래**에 깐다(바깥 1.5). 길이 평상 14~26.5, 각성 19~34.5(박스 안 최대), 폭 2.6·3. 0: 0.55배로 자람, 1: 다 자람, 2: p300·ink300, 하나 부러짐(0.6) + 조각 | (띠 심, SPEC) |
| 천둥 박수 | 옆모습 손 둘(손가락 묶음, 엄지, 먹 소맷부리)이 **다른 각**으로 만난다(수정 1회차 R2): 뒤 손(왼쪽, p300)은 40°, 앞 손(오른쪽, p50)은 14°를 손끝이 만나는 점(0, −20.6)을 축으로 돌렸다. 그래서 손목 쪽으로 벌어지고 합장 꼴이 되지 않는다. 0: 벌어짐(틈 10) + 바깥 속도 획. 1: 맞부딪힘(앞 손이 4.2 아래로 어긋남) + 손끝의 7갈래 종이 섬광(r 10.5) + 짧은 충격 획 2(길이 다름). 2: 벌어지며 둘 다 p300 + 먼지 | 섬광 심(5갈래 ally 별 r 4.4 + allyG) |
| 침묵의 종 | 손잡이가 위인 종이 손종(나팔꼴 몸, 오른쪽 p300 그늘, 칼라, 입은 먹), 입 아래 먹 추. 0: 왼쪽으로 12°, 1: 오른쪽으로 12°, 2: 바로 서며 α 0.65. 소리선 없음 | 추를 묶은 실(감은 호 + 묶은 끈 둘) |
| 먹단지 | **0번 장이 가장 센 장**(수정 1회차 M1): 큰 먹 튐(1번 장과 같은 r 10·팔 8·reach 1.8~3.1, 가로 약 62, 방울은 아직 없음) 뒤로 7갈래 종이 섬광 r 23(골은 먹 튐 안에 숨어 갈래만 보인다), 막 갈라진 흰 백자 조각 다섯(휜 벽 조각, 안쪽 p300 띠, 단지 중심에서 8~12, 길이 5.2~9.6·돌림 −48~62°로 제각각이고 오른쪽 아래는 비움; 둘은 먹 위에 얹혀 먹에서 터져 나온다), 꼭지 없는 뚜껑이 왼쪽 위로, 끊긴 청록 목 끈이 오른쪽 위로 날아간다. 단지 몸은 없다(깨지기 전 단지는 2차 비행 그림). 1: 같은 먹 튐 + 방울 + 흰 조각 다섯이 15~19 날아감 + 끈 조각(1차와 같음). 2: 조각이 떨어짐, ink700(1차와 같음). `splat`: 납작한 먹 웅덩이 + 바깥 튐 9 | 날아가는 끈 조각 |
| 송이 단지 | 0(수정 1회차 M1): 먹 튐 r 6.5, 팔 6(손으로 둔 각 −176·−131·−88·−10·38·104°, reach 2~3, 가로 38.3) + 휜 흰 조각 둘 + 송이 끈 조각. 흰 원판·단지 몸은 없다. 1: **같은 먹 튐**에 방울 셋 + 조각 둘이 더 멀리 + 끈 조각(0 → 1에서 먹 튐이 줄지 않게 1차의 r 5.2 먹 튐을 바꿨다, §12-31). 2: ink700(1차와 같음) | 송이 끈 |
| 타르 항아리 | **쓰러진 검은 항아리**(수정 1회차 M3a, K9 아이콘과 같은 꼴): 똑바로 그린 항아리(굽 y 0 → 입 y −28, 몸통 최대 폭 22.4, 길이 : 폭 1.3)를 120° 돌려 눕혔다. 굽(띠, 빛 쪽 ink500, 가장자리에 p300 선 1.3)이 왼쪽 위, 열린 입(p50 2 테, 안은 먹 + ink700 안벽)이 오른쪽 아래, 어깨에 ink500 빛면과 p300 반사 한 획, 입 가까이 어두운 금 둘(ink500 0.8~0.9), 목을 감은 청록 봉인 끈(먹 2.8 / 청록 1.6)과 매듭에서 땅으로 처진 끝 하나. 번들한 타르가 아랫입술 위로 쏟아져 오른쪽 아래로 흐른다(p300 윤기 획 둘 + 종이 반짝). 휜 사기 조각 둘(먹, 깨진 면 ink500)과 타르 방울, 0번 장에 먼지 둘. 1: 위 어깨의 휜 조각이 금이 가 밀려나고(어두운 안 ink700과 굽은 단면 ink500 선이 보임) 타르 줄 셋이 틈을 잇는다, 타르가 더 쏟아짐. 2: 조각이 입 뒤쪽 땅에 누움, 줄이 끊겨 늘어짐, 입 앞에 타르가 고임, 끈 끝이 땅을 따라 누움. 흰 지그재그 금·둥근 돔·꼭지·위로 솟는 끈이 없다. `pool`: 번들한 먹 웅덩이(1차와 같음) | 봉인 끈 |
| 유성 붓 | **K9 아이콘의 붓**(수정 1회차 M3b): 왼쪽 위에서 42°로 머리부터 박힌 큰 붓. 짓눌린 먹 붓털 세 덩이(둘은 길게 앞·오른쪽 땅으로, 하나는 짧게 왼쪽, 끝이 갈라짐, ink500 결 두 줄; 한 덩이 이상이 먹 튐 가장자리 밖으로 9 이상), 종이 쇠테(띠 셋), 종이 대나무 자루(마디 둘, 아래 p300 그늘), 자루 뒤끝의 둥근 먹 마개 + 종이 걸이 고리(먹 테, 지름 약 5). 0: 진행 방향(오른쪽 아래)으로 치우친 찢긴 종이 섬광(`flash`, 갈래 10~27, 최대/최소 2.7, 긴 갈래 일부는 두 끝으로 찢김) + 짧은 먹 튐 + **혜성 꼬리 자락**(마개에서 자루 폭 4.4로 시작해 먼 끝 12.4까지 넓어지며 조금 위로 휨, 끝은 들쭉날쭉하고 길이가 다른 마른 갈래 넷이 이어지며 각 갈래 끝은 폭 2.2에 홈이 파인 두 가닥(가시 끝 금지, K9 R7), 끊긴 먹 방울 셋, 종이 마른 결 셋, 청록 심은 마개에서 시작해 꼬리 가운데를 따라가다 끝 앞에서 멈춤). 1: 땅에 납작하게 깔린 큰 먹 폭발(팔 8, 각성 10) + 붓, 꼬리 없음. 2: 붓 없이 ink700로 가라앉음(1차와 같음). `crater`: 1차와 같음 | 꼬리 심(0번 장) |
| 먹단지 비행(2차) | `pot`: K9 아이콘의 흰 백자 단지(가로 13.4 × 높이 17.7, 단지 좌표 가운데가 앵커). 종이 몸(먹 외곽 1.6), **꼭지 없는** 납작한 먹 뚜껑(빛 쪽 ink500 선), 뚜껑 밑에서 왼쪽 몸으로 흘러내린 먹 줄 하나(끝에 물방울), 목을 감은 청록 끈(오른쪽 매듭 + 어깨로 늘어진 끝), p300 굽. **네 장이 0·25·50·75°이고 비행 동안 한 번 구른다**(시계 방향, 수정 1회차 F1: 비행 진행률로 장을 고르는 prog), 빛은 늘 화면 왼쪽 위다: 그늘 띠(p300, 최대 3.2)는 돌린 뒤 화면 기준으로 몸의 오른쪽 아래에 깐다. `pot-awakened`: §1.8 겹 테(몸 + 뚜껑 + 굽) + 0번 장 뚜껑 오른쪽 위 반짝임 | 목 끈 |
| 송이 단지 비행(2차) | `pot-s`(k 9.6, 가로 약 10)·`pot-m`(k 12, 약 13): 뚜껑 없는 둥근 작은 단지. 열린 입을 두른 먹 띠(안은 ink700, 먼 안벽에 p300 선 — 뚜껑이 아니라 열린 입), 종이 몸 + 그늘 띠 + p300 굽, 목을 감은 청록 송이 끈과 매듭, 끈 끝은 리본(청록 + 먹 테 0.8)으로 **밖으로·아래로** 날린다(s는 왼쪽, m은 오른쪽: 한 시전의 s·m·s가 끈을 부채처럼 펼친다). 4장 동안 리본의 물결이 흘러간다. `mini`(k 6.6): 같은 꼴의 아주 작은 단지(3차 갈라짐의 ±60 대기 비행용) | 송이 끈 |
| 타르 항아리 비행(2차) | `jar`: 착탄의 쓰러진 항아리와 같은 꼴을 0.62배로 줄여 **35° 기울였다**(열린 입이 오른쪽 위). 굽(띠 + p300 선)이 왼쪽 아래, 먹 몸 + ink500 빛면 + 어깨 p300 반사가 왼쪽 위, 목을 감은 청록 봉인 끈과 왼쪽 위 매듭에서 **어깨 위로 늘어진** 끝, 열린 입(p50 1.5 테, 안은 먹 + ink700). 번들한 타르가 입술 가장 낮은 곳을 넘어 넓은 혀로 흐르고, 두 줄로 처지며 가늘어졌다가 끝에 방울이 모여 뾰족하게 떨어진다(굵기 2.8 → 1.2 → 2.4 → 0.3). 4장(8fps) 동안 두 줄이 흔들린다. 흰 금·꼭지·심지·도화선이 없다. `jar-awakened`: 겹 테(굽·몸·입) + 0번 장 왼쪽 위 어깨 반짝임 | 봉인 끈 |
| 유성 붓 비행(2차) | `comet`: K9 아이콘의 붓이 머리부터 난다. **머리를 위로 구웠다**(로컬 −y = 나는 쪽, 렌더러가 경로 각 + 90°로 돌림). 붓털 머리는 공기에 눌려 쇠테 뒤에서 넓고, 축에서 조금 휜 끝이 홈 하나로 두 갈래로 갈라진다(매끈한 원뿔 = 로켓 코, 둥근 덩이 = 횃불 둘 다 아님, ink500 결 셋). 종이 쇠테(띠 셋), 종이 대나무 자루(마디 둘, 오른쪽 p300 그늘), 둥근 먹 마개(ink500 빛) + 종이 걸이 고리. 꼬리: 마개에서 자루 폭 3.8로 시작해 20 뒤 11.6(약 3배)까지 넓어지고, 들쭉날쭉한 끝에서 길이가 다른 마른 갈래 넷(끝은 폭 2.2에 홈이 파인 두 가닥)과 끊긴 먹 방울 셋으로 흩어진다. 짧은 종이 마른 결 둘, 청록 심은 마개에서 꼬리 가운데를 따라가다 끝 한참 앞(꼬리 몸의 55~60%)에서 멈춘다. 머리 끝에서 방울까지 칠한 길이 약 83(붓 39 + 꼬리 44). 4장 동안 꼬리 갈래·방울·마른 결·심 길이가 흔들리고 붓은 그대로다. `comet-awakened`: 붓(머리·쇠테·자루·마개)에 겹 테, 꼬리에는 없음 + 0번 장 머리 옆 반짝임 | 꼬리 심 |
| 불꽃실 | `spark`: 6갈래 불규칙 종이 불꽃 r 8.4 + 먹 점(0), 작은 불꽃 + 담묵 점(1). `spark-awakened`: r 9 + 청록 5갈래 심 + allyG | (실, SPEC) · 각성 불꽃 심 |
| 폭풍실 | `gust-a/b`: 각도가 다른 열린 바람 획 2~3(한쪽 끝이 갈고리), 대각선을 따라 어긋나게 둔다(겹쳐 쌓은 평행 호는 눈썹으로 읽혔다). 채운 소용돌이 없음 | (실 번개, SPEC) |
| 서리 사슬 | `rime<r>`: 들쭉날쭉한 종이 얼음판(p300 면 하나, 담묵 금 둘) + 판 가장자리에서 땅에 누운 서리 결정 셋(좌·우·앞, 길이 다름). 금 둘(수정 1회차 R4): 하나는 판 왼쪽 가장자리에서 낮게 꺾여 들어오고, 하나는 오른쪽 위에 짧고 높게 있다(같은 높이에 나란한 'V'와 '\'는 감은 눈 한 쌍으로 읽혔다) | (고리 하나의 심, SPEC) |
| 먹창 | `tassel`: 창 뒤끝 자루 토막 + p300 고리 + 먹 술 다발 6가닥(흔들림) + 청록 술 매듭 띠(묶음을 감은 곡선 + 아래로 처진 끝 하나). 앵커 뒤 26.2~52에만 칠함 | 술 매듭 띠 |
| 넓은 붓 | `brush`: 띠 머리에 눌린 넓은 먹 붓털(뒤가 벌어짐, ink500 결) + 종이 쇠테(테 줄 하나) + 앞으로 기운 먹 자루(끝 p300 마개). 0·1: 뒤로 먹 방울, 2: 붓털이 들려 좁아짐(ink700) | (띠 앞선 테, SPEC) |
| 십자 획 | `scrap-a/b`: 획 끝에서 찢겨 나는 종이 조각 둘(1: 더 멀리, p300) | (찢은 획의 심, SPEC) |
| 심판선 | `inkbox`: 목수의 먹통 옆모습(긴 나무 상자 ink500, 앞의 먹 솜이 위로 솟음, 뒤에 상자 위로 반쯤 나온 감개 바퀴 p300 + 감긴 줄 + 크랭크). 둥근 것은 바퀴 하나뿐(우물과 바퀴를 나란히 두면 두 눈으로 읽혔다). 앵커 뒤 26.2~55.4. `flick-a/b`: 먹 방울 + 짧은 꼬리 | 먹줄이 나가는 짧은 청록 토막(줄 심은 SPEC) |
| 먹 궤도 | `chip-a/b`: 띠 바깥에서 깎여 튀는 먹 조각 2 | (혜성 심, SPEC) |
| 수호 고리 | `knot-a/b`: 줄을 가로지른 울퉁불퉁한 매듭(종이, S자 감김 한 획, 그늘 한 면) + 풀린 끝(a 안쪽, b 바깥쪽) | (바느질 1/3, SPEC) |
| 일식 테 | `ribbon-a/b`: 초승 꼬리 끝에서 뒤로 날리는 청록 리본 두 가닥(먹 테 1.1, allyG 결, 종이 점), 3장 물결 | 리본 |

## 7. SPEC — 렌더러가 그리는 매개 도형

모든 값은 모듈의 `SPEC`이 원본이다(여기 표는 사본). 층 표기는 `[토큰, 굵기, α?]`이고 아래에서 위로 그린다. 굵기는 선 전체 폭이며 판정 크기와 함께 바뀌지 않는다.

### 7.1 토큰(`K`)

| 이름 | hex(구현값) | palette.ts |
|---|---|---|
| ink | #101312 | NEUTRAL.ink |
| ink700 | #343936 | NEUTRAL.inkSoft |
| ink500 | #46423d | (조각 안에서만) |
| ink300 | #8c8579 | NEUTRAL.inkMuted |
| ink100 | #bcb4a5 | (안 씀) |
| p50 | #fffff8 | NEUTRAL.paperBright |
| paper | #f4f4ef | NEUTRAL.paper |
| p300 | #d8dad3 | NEUTRAL.paperShadow |
| ally · allyD · allyG | #00a8c6 · #007c94 · #cff6ff | SIGNAL.ally 계열 |

- 이름은 `PN.skillVfx.K`와 같다. 값은 K4 원본(`#121110` 등 v1.0 키트 값, 굽기 때 `COLOR_MAP`이 바꾼다)이 아니라 **구현값**이다. 지시서 C6이 원래 마크업에서 구현값만 받기 때문이다. `COLOR_MAP`은 이 값을 건드리지 않으므로 구운 색은 K4와 같다(§12-1).
- 산호·호박·자수정·연두·장 재질색·인주는 0이다.

### 7.2 공통 키

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `jit` | {mul 31, hash 2654435761, mod 1000} | `((Math.imul(seed*31 + i, 2654435761) >>> 0) % 1000) / 1000` |
| `headY`, `headLift`, `footClear`, `faceZone` | −66, 26, 26, [−8, −58, 18, −34] | §2 |
| `rim.ally`, `rim.pad` | 지시서 값 그대로 | 3차(땅 조각 테) |
| `awakened` | {inset 6, layers [[ink,1],[p50,0.6]], coreScale 1.5, count 1, reach 1.2, object {offset 1.2, paper 1, ink 0.8, sparkle {points [5,6], r [2.4,3]}}, prims [stroke, band, multi, jag, ripple, halo]} | 각성 고리·halo에 R − 6 원 하나(수호 고리는 줄 안쪽 가장자리와 겹쳐서 뺀다). 청록 core 길이 ×1.5. 선(chain·beam)에는 가는 선이 없다(무기별 각성 값만) |
| `decal` | {fadeAt 0.5} | 데칼 α = 1(수명 앞 절반) → 0(끝)까지 직선 |
| `life[id]` | {mark, decal?} | §7.8 |
| `zorder` | [ground, feet, stand, ally] | layout 출력 순서 |
| `reference` | {chainStep [90, 40], spread [120, 80]} | 참고 합성만(§9.3) |
| `caps`, `priority`, `marks`, `rim` | 지시서 §4.5·§5.4·§1.5 값 | 1차는 쓰지 않는다(3차 기준값). 다만 `caps.splash` [12, 8, 3]은 수정 1회차부터 쓴다(§7.3a) |
| `splash` | `shape` + 무기별(inkPots·clusterPots·meteorBrush) | §7.3a |
| `tilt` | {fallingScroll: {parts [scroll, scroll-awakened], deg [0,6,12,12], sign 954}} | §7.3b |

**grow·fade(모든 고리·선 공통)**
- `grow {from, seconds}`: r(나이) = R·(from + (1 − from)·(1 − (1 − u)²)), u = clamp(나이/seconds, 0, 1). 감소 모션에서는 R 그대로이고 α가 u로 들어온다.
- `fade {at}`: α = 1(나이/수명 ≤ at), 그 뒤 (1 − 나이/수명)/(1 − at)로 0까지. `fade {at, dash}`(천둥 박수, 불꽃실): at 뒤에는 먹 층만 점선으로 그리고 α도 같이 준다.

### 7.3 고리 — `SPEC.ring[id]` (strike·nova·lob 폭발, 중심선 = R)

**틈(stroke·band 공통)**: n = n0 + ⌊J(10)·(n1 − n0 + 1)⌋(≤ n1). 틈 k의 중심 c_k = 2π(k + J(20 + k))/n, 폭 = lerp(deg0, deg1, J(40 + k))°. 정렬하고 겹치면 합친다. 틈 사이 호(시계 방향)를 그리고 1.5° 미만 호는 버린다. 틈이 없으면 −90°에서 시작하는 온 원 하나다.
**core(청록 호)**: 시작 2π·J(60), 길이 lerp(span0, span1, J(61))°(각성 ×1.5, ≤ 360), 호 위에 있는 부분만 그린다.

| id | prim | 값 | punch scale(수정 1회차) | 비고 |
|---|---|---|---|---|
| inkLightning | stroke | layers [[ink,3.4],[ally,1.8],[allyG,0.6]], gaps n 2~3 · 8~14°, grow 0.7/0.08초, fade 0.6 | 2.0 | 고리 전체가 청록 샌드위치 |
| brushDownpour | band | ink, width 1.5~6, knots 13, gaps 5~7 · 12~26°, endTaper 7°, core [[ink,4],[ally,1.8]] 30~50° at mid **dab**, grow 0.8/0.06, fade 0.6 | — | 붓으로 찍은 테. core는 가장 긴 찍음 한가운데 |
| fallingScroll | ripple | arcs {0.72R, 15~165°, **[[ink,3],[p50,1.6]]**}, {R, 10~170°, **[[ink,3.4],[p50,2]]**}, full R **[[ink,1.6,0.6]]**, core [[ink,3.2],[ally,1.6]] 60~120° on arc 1, grow 0.5/0.15, fade 0.6 | 2.0(호·전체 원·core 모두) | 앞쪽(아래) 반원 종이 파문. 판정 원 뒤 절반이 1배에서 보이게 굵혔다(M1-4) |
| seventhSeal | stroke | wash p50 α0.18 **union**, layers [[ink,2.6]], gaps 2 · 10~18°, inner 0.92R [[ink300,1]], core [[ink,3],[ally,1.4]] 40~70°, grow 0.85/0.06, fade 0.6 | 1.5(inner 포함) | 한 시전의 원판은 한 경로(§9.2) |
| inkPulse | band | ink, width 6~16, knots 9, gaps 3~4 · 3~7°(띠를 끊는다), core [[ink,4],[ally,2]] 80~120° at outer, grow 0.55/0.1, fade 0.6, 각성 width ×1.2 + 0.8R [[ink,1.6]] | — | 유일한 검은 띠 고리 |
| frostRing | band | p50 **α 0.5**, edge [[ink,2.2]], width **14~17**, knots 9, core [[ink,3.2],[ally,1.6]] 360°(at mid), fringe {side −1, pitch 7, h **2~7**, skip 0.35, [[ink,1.4]]}, grow 0.6/0.12, **fade 0.3**, 각성 fringe 양쪽 | — | α·fade는 C10(P1) 때문(§12-5). 폭·술은 R1로 키웠다 |
| thunderclap | jag | layers [[ink,5],[ally,2.4],[p50,0.8]], seg 26, amp 1.5~6.5, forks 3 · 12~24, flicker 12fps seeds [5,6], grow 0.5/0.08, fade 0.65 dash [6,4] | — | §8.3 jag |
| silenceBell | multi | rings {1, 0, 1}, {0.86, 0.08, 0.7}, {0.72, 0.16, 0.45}(final, delay, α), layers [[ink,5.4],[p50,2.6]], grow 0.35/0.3, fade 0.7, 각성 ring {0.58, 0.24, 0.3} | — | 매끈한 흰 고리 3겹, 짧게 퍼지고 사라짐 |
| inkPots | stroke | [[ink,3],[ally,1.6]], gaps 2 · 6~10°, grow 0.75/0.07, fade 0.6 | 2.2 | |
| clusterPots | stroke | [[ink,2.6],[ally,1.4]], gaps 1 · 8~14°, grow 0.75/0.06, fade 0.6 | 1.8 | |
| tarJar | stroke | [[ink,3.2],[ally,1.4]], gaps 1 · 8~14°, grow 0.75/0.08, fade 0.6 | 2.0 | |
| meteorBrush | stroke | [[ink,5],[ally,2.8],[allyG,0.8]], gaps 2 · 6~10°, grow 0.7/0.08, fade 0.6 | 2.2 | |

**punch**(수정 1회차 M1-2, `SPEC.ring[id].punch = {scale, seconds 0.1, reducedMax 1.5}`)
- 맞는 순간 그 고리의 **모든 층**(stroke: layers·inner·core, ripple: full·arcs·core) 굵기에 m을 곱한다. m = 1 + (s − 1)·(1 − u)², u = clamp(나이/seconds, 0, 1), s = scale(감소 모션에서는 min(scale, reducedMax) = 1.5 이하).
- 중심선은 그대로 R(grow)이다. 각성 가는 선(R − 6)과 wash는 곱하지 않는다. band·jag·multi 고리에는 punch가 없다.
- 0.1초 뒤 m = 1이라 굵기가 정확히 1차 값으로 돌아온다(그 뒤의 출력은 1차와 같다).

### 7.3a splash — `SPEC.splash` (수정 1회차 M1-3: R에 맞춰 자라는 먹 튐, lob 착탄 셋)

| 무기 | n(각성) | from | to | width | jitter | fork | drop p · r · gap | grow from · 초 | fade at | minimal 가시 |
|---|---|---|---|---|---|---|---|---|---|---|
| inkPots | 7~9 (8~10) | 0.12 | 0.42~0.72 | 5~10 | 0.4 | 0.25 | 0.5 · 1.8~3.2 · 4~9 | 0.3 · 0.06 | 0.4 | 3 |
| clusterPots | 5~6 (6~7) | 0.15 | 0.35~0.58 | 4~7 | 0.4 | 0 | 0.35 · 1.4~2.4 · 3~6 | 0.3 · 0.05 | 0.4 | 0 |
| meteorBrush | 8~10 (10~12) | 0.10 | 0.50~0.82 | 7~14 | 0.35 | 0.35 | 0.6 · 2.6~4.6 · 6~14 | 0.25 · 0.07 | 0.5 | 3 |

`SPEC.splash.shape` = {shoulder [0.45, 0.55], bend 0.5, fork {at 0.7, deg 7, short 0.82}, drop {stretch 1.7, clear 6}, reducedIn 0.06}. 칠은 `token` ink 하나(종이·청록 없음).

식(R0 = 다 자란 R = 그 사건의 반경, seed = 사건 seed, J(i) = jit(seed, i))
- 가시 수 n = n0 + ⌊J(1700)·(n1 − n0 + 1)⌋(각성은 awakenedN).
- 가시 k의 방향 θk = 2π·J(1701) + (k + 0.5 + (J(1710 + k) − 0.5)·2·jitter)·2π/n.
- 밑 rb = from·R0, 끝 rt = lerp(to0, to1, J(1730 + k))·R0, 길이 L = rt − rb, 반폭 h = lerp(w0, w1, J(1740 + k))/2, 휨 b = (J(1750 + k) − 0.5)·0.5·h.
- 가시 꼴(θk 방향 축의 지역 좌표, y는 시계 방향 쪽): (rb, −h) → (rb + 0.45L', −0.55h + b) → (rb + L', 0) → (rb + 0.45L', 0.55h + b) → (rb, h). L' = L·g(자란 몫).
- 갈래: J(1760 + k) < fork면 끝 30%를 두 갈래로 나눈다. 점 (rb, −h) → (rb + 0.45L', −0.55h + b) → **갈래 B 끝** = 극좌표 (rb + 0.82L', θk − 7°) → **사타구니** (rb + 0.7L', b/2) → **갈래 A 끝** = 극좌표 (rb + L', θk + 7°) → (rb + 0.45L', 0.55h + b) → (rb, h). ±7°는 사건 중심을 축으로 한 각이다(§12-29).
- 방울: J(1770 + k) < p면 반지름 r = lerp(r0, r1, J(1790 + k)), 틈 gap = lerp(g0, g1, J(1780 + k)), 중심 = 극좌표 (rt + gap, θk)의 타원(반지름 방향 반축 1.7r, 옆 반축 r, θk로 돌림). **먼 끝 rt + gap + 1.7r이 R0 − 6을 넘으면 그 방울은 뺀다.** 그래서 고리 위·바깥에는 아무것도 없다(rt ≤ 0.82R0).
- 자람: g = from + (1 − from)·(1 − (1 − u)²), u = clamp(나이/grow.seconds). 방울은 g = 1(다 자란 뒤)부터 보인다. α = 1, 나이/수명(`life[id].mark`) > fade.at 뒤로 (1 − 나이/수명)/(1 − fade.at)까지 직선으로 준다.
- 감소 모션: g = 1(다 자란 길이), α에 clamp(나이/0.06)를 곱한다.
- 한 사건의 가시와 방울 전부를 **한 경로**로 nonzero 한 번 채운다(겹쳐도 α가 쌓이지 않는다).
- LOD: reduced = 짝수 k 가시만, 방울 없음. minimal = clusterPots 0, 나머지는 k = 0, ⌊n/3⌋, ⌊2n/3⌋ 셋, 방울 없음. 방울은 full에서만.
- 화면당 상한 `caps.splash` [12, 8, 3](full/reduced/minimal, 사건 수).
- 먹 면적(실측, 겹침을 두 번 센 상한값): Lv1~5 × 평상/각성 × seed 1~300(무기마다 3,000건) 최대 inkPots 8.57%·clusterPots 4.43%·meteorBrush 9.79%, 평균 5.84%·2.73%·7.24% — 모두 원판 넓이의 10% 이하.
- 꼴 규칙: 가운데를 흰 구멍으로 비우지 않는다(밑 rb 안쪽은 조각의 먹 튐이 덮는다), 방울에 종이 점이 없다.

### 7.3b tilt — `SPEC.tilt` (수정 1회차 M4)
- `fallingScroll`: parts [scroll, scroll-awakened], deg [0, 6, 12, 12](장 번호로 고름), sign 954.
- 렌더러는 그 장의 각에 s = J(954) < 0.5 ? −1 : +1(사건 seed)을 곱해 **앵커를 축으로** 돌린다(양수 = 화면 시계 방향). 조각은 좌우 반전하지 않는다(빛이 왼쪽 위라 반전하면 그늘이 뒤집힌다).
- `draw`의 `putItems`가 같은 규칙을 쓴다. `paths`는 `tilt` = [[장, 부호 붙인 각°], …]를 낸다.

**band**
- 폭: 매듭 k(θ_k = 2πk/K)의 w_k = lerp(w0, w1, J(1100 + k)) × widthScale(먹 파동 각성 1.2). w(θ)는 이웃 매듭 사이 코사인 보간((1 − cos πu)/2).
- 마디 점: 호마다 n = max(6, ⌈(a1 − a0)·R0/5⌉), θ_i = lerp(a0, a1, i/n)(닫힌 띠는 i < n). **R0 = 다 자란 R**이다(자라는 동안 점 수가 변하지 않는다). 바깥 R + w/2, 안쪽 R − w/2. 폭은 grow로 줄지 않는다.
- endTaper: 호 끝에서 endTaper° 안이면 w × (0.3 + 0.7·sin(π/2·d/endTaper)), d = 끝까지 각.
- 채움: token, α = alpha(없으면 1) × fade. 닫힌 띠는 evenodd.
- fringe: 호마다 n_f = max(8, round((a1 − a0)·(R0 + 6·side)/pitch)), 꼭짓점 k의 θ = lerp(a0, a1, k/n_f), 반지름 R + side·(w/2 + h_k). h_k = 0(홀수 k), 짝수는 J(base + k) < skip이면 0, 아니면 lerp(h0, h1, J(base + 100 + k)). base = 1300(안쪽, side −1), 1500(바깥). fringe 쪽 가장자리는 fringe.layers로, 반대쪽은 edge로 긋는다.
- core: at mid = R 위, at outer = R + w(θ)/2 위. `dab`이면 가장 긴 호(같으면 앞의 것)의 가운데에 두고 길이는 min(core 길이, 호 − 4°). 360°는 닫힌 고리.

**ripple**: full 원 → 호 둘(at·R, span0°~span1°) → core(호 1 위, 가운데 90°, 길이 60°, 각성 90°, 호 안으로 자름).

**jag**: §8.3. grow는 R0에서 만든 꼭짓점 전체를 R(나이)/R0로 늘이고 줄인다. 갈래는 [ink 3, ally 1.32](고리 층의 0.6·0.55배). fade 뒤에는 먹 3.0 점선 [6, 4]만.

**multi**: 고리 j의 나이 = 나이 − delay_j(음수면 안 그림), r_j = grow(final_j·R, 나이_j), α_j = alpha_j × fade(나이).

**각성 공통**: R − 6에 [[ink,1],[p50,0.6]] 원 하나(multi는 첫 고리 기준).

### 7.4 선 — `SPEC.line[id]`

| id | prim | 값 |
|---|---|---|
| sparkThread | sag | sag 0.16, step 8, [[ink,3.4],[ally,1.8],[allyG,0.6]], grow frac 0.4, fade 0.65 dash [5,4] |
| stormThread | twist | amp 4, wave 36, step 6, strands [[ink,3],[ally,1.5]] / [[ink,2.6],[p50,1]], kinkEvery 3, kinkAmp 5, kinkStrand 0, flicker 12fps seeds [7,8], grow 0.3, fade 0.6 |
| frostChainlet | links | pitch 14, ellipse rx 7.5 ry 4 [[ink,3.4],[p50,1.6]], bar 14×3.2 p300 + [ink,1.6], core [[ink,3.4],[ally,1.6]](구간마다 고리 하나), nubs 4개마다 r 2.4 p50 + [ink,0.8], grow 0.3, fade 0.6, minimal [[ink,3],[ally,1.6]] |
| inkLance | blade | capsule p50 α0.16 + [[ink,1.2]], shaft ink 4.8→3 + grain [p50,0.8], head 30 × 6.5 p50 + [ink,1.6], thrust 0.18, retract at 0.7 → 0.6L, 각성 head ×1.2 + shadow 옆 3 [[ink300,1.2]] |
| wideBrush | brushBand | fill p50 α0.45, edge [[ink,2]] ragged pitch 10 · 0.5~2.5 both, streaks 3~5 [[ink300,1.2]] 0.3~0.8, front [[ink,3],[ally,1.6]], grow 0.3, fade 0.6 |
| crossStrokes | brushBand | capsule edge [[ink300,1,0.6]] dash [6,4], fill p50 α0.5, edge [[ink,1.6]] ragged pitch 8 · 0.5~3 back(아래쪽 +y만), taper [[0,0.15],[0.35,1],[1,0.4]], core [[ink,3],[ally,1.4]] from 0.7, grow 0.25, fade 0.6, aim 30(참고 합성만) |
| judgmentLine | string | capsule p50 α0.12 + [[ink300,1.2]] dash [6,4], layers [[ink,2.8],[ally,1.2],[p50,0.4]], **punch {scale 2, seconds 0.06, reducedMax 1.5}**(줄 층에만, §7.3 식), after n 2 · **bow 9** · 0.12초 · sign [1, −0.7, 0.48] · [[ink300,1.2,0.6]], fade 0.7, 각성 after 3 + 굵기 ×1.2 (R3) |

규칙은 §8.3. beam은 빔 하나(BeamEffect 하나)의 로컬 틀(+x = 빔 방향, x 0 = 시작점)에서 그린다. 십자 획은 빔 넷을 각각 그린다.

### 7.5 halo — `SPEC.halo[id]` (원점 = 주인공 발, 수명 0.3초, fade 0.6)

| id | 값 |
|---|---|
| inkOrbit | wash ink α0.14(inner..R), outer [[ink,2.4]] gaps 2 · 8~14°, inner [[ink300,1.2]] dash [4,4], comet {span 100°(각성 140°), head 14~18, rim [ink,1.6], body p50, core [[ink,3.6],[ally,2]] from 0.08 to 0.55, sweep 240°} |
| wardRing | wash p50 α0.12(원판), rope {width 10(각성 12), body p50, edge [ink,1.4], twist pitch 9~15 · 40° · [[ink,1.4]]}, core 바느질 [[ink,2.4],[ally,1.4]] dash [5,4] pad 0.6 · 120°(각성 180°) · 줄 바깥 가장자리 + 1.6, grow 0.82/0.1 |
| eclipseHalo | outer R [[ink,3.6],[p50,1.8]], inner [[ink300,1.2]] dash [5,5], wash ink α0.1(inner..R), crescent {ink α0.35, span 90°(각성 110°), thick 0.9, sweep 180°, step 3°}, 각성 opposite {α0.18, thick 0.45} |

### 7.6 `SPEC.layout[id][stage]` — 조각 배치 서술자

| id / stage | 항목(prim · parts · 값 · z) |
|---|---|
| inkLightning / impact | center bolt(각성 bolt-awakened) ally · center scorch ground |
| brushDownpour / impact | center stroke-a·b(각성 -awakened) pick J(950) ally · center mark-s·m·l by radius(< 52 s, < 72 m, 그 밖 l) ground |
| fallingScroll / impact | center scroll(각성 scroll-awakened) ally |
| seventhSeal / impact | center seal(각성 seal-awakened) ally · center print-a·b·c pick J(951) **flip J(955) < 0.5** ground |
| inkPulse / burst | ring splash-a·b, count 3(각성 4), jitter 0.4, skip 0, dr 4, ally |
| frostRing / burst | ring shard-a·b·c(각성 shard-awakened-a·b), count 6(각성 7), jitter 0.35, skip 0.15, dr 6 inout, info 3, ally |
| thunderclap / burst | head clap(각성 clap-awakened) ally |
| silenceBell / burst | head bell(각성 bell-awakened) ally |
| inkPots / land | center shatter ally · center splat ground |
| clusterPots / land | center burst ally |
| tarJar / land | center crack ally · center pool ground |
| meteorBrush / land | center impact(각성 impact-awakened) ally · center crater ground (수정 1회차 M2: ring streak 항목 삭제. 고리 R − 4 ~ R + 30에는 고리 말고 아무것도 없다) |
| sparkThread / jump | point spark(각성 spark-awakened) ally |
| stormThread / jump | point gust-a·b(J(600 + i) < 0.35면 b) ally |
| frostChainlet / jump | point rime12·19·28 by r(점의 `r`, 없으면 19) feet |
| inkLance / stroke | center tassel(각성 -awakened) ally |
| wideBrush / stroke | tip brush(각성 -awakened) ally |
| crossStrokes / stroke | tip scrap-a·b pick J(952) ally |
| judgmentLine / stroke | center inkbox(각성 -awakened) ally · line flick-a·b count 4~6 offset 0.6 ally |
| inkOrbit / sweep | ring chip-a·b count 2~3 jitter 0.45 dr 2 ally |
| wardRing / sweep | ring knot-a·b count 2(각성 3) jitter 0.4 dr 0 ally |
| eclipseHalo / sweep | tail ribbon-a·b pick J(953) ally |

### 7.7 `SPEC.lob`, `SPEC.lobMini`, `SPEC.flight`(2차)
- `lob`(1차부터, 값 그대로): inkPots H [0.35, 48, 140] 그림자 rx 9→15 α 0.18→0.32 · clusterPots [0.35, 40, 120] 7→12 0.18→0.32 · tarJar [0.33, 48, 130] 10→16 0.18→0.32 · meteorBrush [0.5, 90, 220] 12→22 0.14→0.34.
- `lobMini`(1차부터, 값 그대로): h 28(고정 높이), 그림자 rx 5→7. α는 송이 단지의 0.18→0.32를 쓴다(§8.4).
- `flight`(2차, 새 키): 비행 물건 하나를 고르고 놓는 규칙.

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `inkPots` | {parts [pot], awakened [pot-awakened], **frame 'progress'**} | 조각 = parts[0](각성 awakened[0]). 장 = min(3, ⌊t·4⌋)(t = lobPath의 비행 진행률, phase 없음). minimal은 0번 장, 감소 모션도 같은 규칙(수정 1회차 F1) |
| `clusterPots` | {parts [pot-s, pot-m], by 'index', mini 'mini'} | lob k(한 시전 안 순번) = parts[k % 2] → s, m, s, m. 각성 조각은 없다(§12-47). `mini`는 3차 갈라짐의 대기 비행 조각 |
| `tarJar` | {parts [jar], awakened [jar-awakened]} | |
| `meteorBrush` | {parts [comet], awakened [comet-awakened], turn 90, **landMirror {when 'dx<0', parts [impact, impact-awakened]}**} | `rotate: 'path'` 조각을 lobPath.angle + turn° 만큼 앵커를 축으로 돌린다(조각은 머리를 위로 구웠다). landMirror: 착탄 반전 규칙(§9.2, 수정 1회차 F2) |
| `phase` | 1850 | loop 비행 조각의 lob k phase = J(1850 + k)(seed = 시전의 표시 일련번호). frame 'progress'(먹단지)는 쓰지 않는다 |
| `shadow` | {token ink} | 그림자 타원(rx, 0.42rx, α = lobPath.shadow) 채움 토큰 |

### 7.8 `SPEC.life` (초)

| 무기 | mark | decal |
|---|---|---|
| 먹번개 | 0.3 | 0.6 |
| 붓 폭우 | 0.3 | 0.9 |
| 족자 낙하 | 0.45 | — |
| 일곱째 인장 | 0.36 | 1.2 |
| 먹 파동 · 천둥 박수 | 0.3 | — |
| 서리 고리 | 0.45 | — |
| 침묵의 종 | 0.5 | — |
| 먹단지 | 0.36 | 1.2 |
| 송이 단지 | 0.3 | — |
| 타르 항아리 | 0.4 | 1.5 |
| 유성 붓 | 0.45 | 1.5 |
| 불꽃실 · 폭풍실 | 0.18(자료) | — |
| 서리 사슬 | 0.18(자료) | 0.48(얼음판 = 연쇄 + 0.3) |
| beam 넷 | 0.28(자료) | — |
| halo 셋 | 0.3 | — |

### 7.9 `SPEC.fills` (C10)
[이름, 토큰, α, 그 α 이상으로 보이는 초]: brushDownpour.band ink 1 0.3 · seventhSeal.wash p50 0.18 0.36 · seventhSeal.print p50 0.25 1.2 · inkPulse.band ink 1 0.3 · frostRing.band p50 0.5 0.29 · frostRing.band.tail p50 0.25 0.45 · inkLance.capsule p50 0.16 0.28 · wideBrush.band p50 0.45 0.28 · crossStrokes.band p50 0.5 0.28 · judgmentLine.capsule p50 0.12 0.28 · inkOrbit.wash ink 0.14 0.3 · wardRing.wash p50 0.12 0.3 · eclipseHalo.wash ink 0.1 0.3 · eclipseHalo.crescent ink 0.35 0.3 · **lob.shadow ink 0.14 1**(2차: lob 그림자, 가장 옅은 α와 가장 긴 비행 1.0초).
- 선 층(굵기 ≤ 3 종이 심: 침묵의 종 고리, 족자 파문 등)은 면이 아니라서 넣지 않았다.
- 서리 띠는 α 0.5로 0.135초 그린 뒤 fade 0.3부터 줄어 0.29초에 0.25가 되고 0.45초에 0이다. 그래서 두 줄로 적었다.

## 8. layout·paths·lobPath 식과 jit 번호대

### 8.1 jit
J(i) = jit(seed, i). seed는 layout·paths·draw의 `opts.seed`(정수)다. 예외: jag·twist의 깜빡임은 flicker seed(5·6, 7·8)를 쓰고 인스턴스 seed를 쓰지 않는다.

| 번호대 | 쓰는 곳 |
|---|---|
| 0~99 | ring prim 각(k), line prim 위치(j), jag 각(k) |
| 10, 20+k, 40+k | 틈 수·중심·폭(stroke·band·inkOrbit 바깥) |
| 20+k, 200+k | jag 진폭·부호 |
| 50+j, 60+j | line prim 옆 거리·변형 |
| 60, 61 | core 시작·길이 |
| 100+k, 200+k, 300+k, 400+k | ring prim 건너뜀·변형·inout 부호·phase. brushBand 위 가장자리 100+k(진폭)·150+k(부호), 아래 200+k·250+k |
| 300, 310+j, 320+j, 330+j | brushBand 비백 줄 수·y·길이·x |
| 410 | tail(리본) phase |
| 500+f ~ 530+f | jag 갈래 꼭짓점·방향·길이·꺾임 |
| 600+i, 650+i | point prim 큰 바람 획·반전 |
| 700, 710 | 혜성·초승 시작각, 혜성 머리 폭 |
| 800, 810+k, 820 | 꼰 줄 시작, 꼰 자국 간격, 바느질 시작 |
| 900 | ring·line prim 개수 |
| 950~953 | center·tip·tail 변형 고르기 |
| 954 | 족자 기울기 부호(`SPEC.tilt.sign`, 수정 1회차) |
| 955 | 인영 좌우 반전(layout `flip`, 수정 1회차) |
| 1700, 1701, 1710+k, 1730+k, 1740+k, 1750+k, 1760+k, 1770+k, 1780+k, 1790+k | splash 가시 수·시작각·각 흔들림·끝·폭·휨·갈래·방울 여부·방울 틈·방울 반지름(수정 1회차, §7.3a). 유성 붓 각성(n 10~12)의 k ≥ 10에서는 1730+k가 1740·1741과, 1740+k가 1750·1751과 … 겹쳐 쓰이고 1790+k는 1800·1801까지 간다. 값은 결정적이고 다른 쓰임과 겹치지 않는다(상관만 생김, 검수서 식 그대로 둠, §12-30) |
| 1850+k | lob 비행 물건의 loop phase(`SPEC.flight.phase`, 2차). 1700~1801(splash)과 겹치지 않는다. 먹단지(prog)는 쓰지 않는다 |
| 960+k, 980+k, 990+k | 참고 합성만: strike 사건 자리, 연쇄 점 |
| 1100+k | band 매듭 폭 |
| 1300+k, 1400+k / 1500+k, 1600+k | fringe 안쪽 건너뜀·높이 / 바깥쪽 |
| flicker seed, 1000·i + j | twist 꺾음(구간 i, 표본 j) |

### 8.2 layout(id, stage, opts)
출력 `{prim, part, x, y, angle, flip, phase, prio, z, dr?, index?}`. angle은 **라디안**이고 조각의 `rotate` 규칙을 따른다(none이면 0). z 순서(ground → feet → stand → ally)로, 같은 z 안에서는 서술자 순서로 낸다.
- `center`: (0, 0). `head`: (0, headY). 변형은 `pick`이면 parts[⌊J(pick)·len⌋], `by: 'radius'`면 반경 계단. 서술자에 `flip`(번호)이 있으면 flip = J(flip) < 0.5(인영 955), 없으면 false.
- `ring`: n = count0 + ⌊J(900)·(count1 − count0 + 1)⌋(각성 awakenedCount). k = 0..n−1: J(k + 100) < skip이면 건너뛴다. 각 = −π/2 + (k + 0.5 + (J(k) − 0.5)·2·jitter)·2π/n. dr = dr × (inout이고 J(k + 300) < 0.5면 −1). 자리 = (R + dr)(cos, sin). 변형 = parts[⌊J(k + 200)·len⌋]. angle = 각(dr < 0이면 각 + π, 안쪽 서릿발은 안쪽을 본다). phase = J(k + 400). prio = 앞의 info개(놓인 순서) 0, 나머지 2(info 없으면 모두 0).
- `point`: 연쇄 점 i ≥ 1마다. `index` = 점 번호. 바람 획은 J(600 + i) < big이면 gust-b, flip = J(650 + i) < 0.5. 얼음판은 점의 r로 등급.
- `tip`: (x_head, 0). 넓은 붓·십자 획의 x_head = 26 + (L − 26)·(1 − (1 − u)²), u = clamp(나이/(grow.frac·수명)).
- `line`: n = count0 + ⌊J(900)·(…)⌋, s_j = 26 + (L − 26)·(j + 0.5 + (J(j) − 0.5)·0.6)/n, y = (2J(j + 50) − 1)·offset·w, 변형 J(j + 60) < 0.5면 a, flip = y < 0, prio 2.
- `tail`: 초승 꼬리 끝 θ = φ − span/2(φ는 §8.3 eclipse), 자리 R(cos θ, sin θ), angle θ + π/2(시계 방향 접선), phase J(410).

### 8.3 매개 도형 규칙과 paths 출력

| 도형 | 규칙 | `paths` 키 |
|---|---|---|
| stroke | §7.3 틈·core. punch는 굵기만 바꾸므로 paths에 없다 | `gaps` [[시작°, 끝°]], `core` |
| splash | §7.3a. 다 자란 길이(g = 1)의 점이다. LOD를 따른다(opts.lod) | `splash`(가시마다 끝점; 갈래는 A 끝, B 끝 두 점), `drops`(방울 중심, full만) |
| tilt | §7.3b | `tilt` [[장, 부호 붙인 각°]] |
| band | §7.3 band | `knots` [[각°, 폭]], `gaps`, `core`(그린 그대로: dab 가운데·360°), `fringe`(첫 호의 fringe 꼭짓점 앞 12개) |
| ripple | §7.3 | `core` |
| jag | n = max(8, round(2πR0/26)). 꼭짓점 k: 각 (k + (J(k) − 0.5)·0.5)·2π/n, 반지름 R0 ± lerp(1.5, 6.5, J(20 + k)), J(200 + k) < 0.5면 −. 갈래 f: k_f = ⌊J(500 + f)·n⌋, a = atan2(V) + (J(510 + f) − 0.5)·0.6, len = lerp(12, 24, J(520 + f)), 꺾임 ±0.5(J(530 + f) < 0.5면 −), P1 = V + 0.55·len·(cos a, sin a), P2 = P1 + 0.45·len·(cos(a + 꺾임), sin(…)). seed = flicker.seeds[⌊t·12⌋ mod 2](감소 모션 [0]) | `jag`(꼭짓점 전부), `forks`(갈래마다 3점) |
| multi | §7.3 | `rings` [[반지름, α]] |
| sag | 구간 i: 제어점 = 중점 + 법선(−dy, dx)/L·(±0.16·L), 짝수 +·홀수 −. 구간마다 m = max(8, round(L/8)) 표본. 시작에서 26 안을 자른다(첫 교차점 보간). grow: 길이 비율 clamp(u/0.4). fade 0.65 뒤 먹 2.38 점선 [5, 4]. Catmull-Rom으로 잇는다 | `controls`(구간 제어점), `start`(자른 첫 점) |
| twist | 구간 i: m = max(6, round(L/6)), t = j/m, 축 + 법선·4·sin(2πtL/36 + φ)·sin(πt), A는 φ = 0, B는 φ = π. A는 j % 3 == 0(0 < j < m)에서 + 2·5·(J(fseed, 1000i + j) − 0.5). 자르기 26, grow 0.3, fade 0.6. B([ink 2.6, p50 1]) 먼저, A([ink 3, ally 1.5], miter) 위 | `strandA`, `strandB`(앞 12점) |
| links | 구간 i: s0 = 26(첫 구간), n = max(1, ⌊(L − s0)/14⌋), 시작 = s0 + ((L − s0) − 14n)/2 + 7, 항목 k = 시작 + 14k. 구간 안 짝수 = 고리(타원 7.5×4, 구간 방향으로 돎), 홀수 = 막대 14×3.2. 구간마다 가운데 고리가 청록. 전체 순서로 4번째마다 혹(r 2.4, ±(4 + 2.4), 항목 홀짝으로 옆). grow: 앞 ⌈항목 × clamp(u/0.3)⌉개 | `links`(앞 12개 중심) |
| blade | u = 나이/수명. 끝 = u < 0.18이면 lerp(34, L, 1 − (1 − u/0.18)²), 아니면 L. u > 0.7이면 끝 = lerp(L, 0.6L, v), α = 1 − v, v = (u − 0.7)/0.3. 창날 길이 hl = 30(각성 36), 반폭 hh = 6.5(7.8), xb = 끝 − hl. 창날 11점(Catmull-Rom): (xb, ∓1.6), (xb + 0.18hl, ∓0.85hh), (xb + 0.35hl, ∓hh), (xb + 0.62hl, ∓0.62hh), (xb + 0.86hl, ∓0.22hh), (끝, 0). 창대 x 26 → xb + 1, 굵기 4.8 → 3, 결 p50 0.8(y −0.9 → −0.7). 각성 그림자 y +3 | `tip`, `head` |
| brushBand | x0 = 26, x1 = §8.2 tip. 반폭 hw(x) = w × taperRatio((x − 26)/(L − 26))(taper가 있을 때). 가장자리 n = max(2, ⌈(x1 − x0)/pitch⌉), k = 0..n: x = lerp(x0, x1, k/n), 위 y = −max(0.6, hw + amp), 아래 +(…), amp = lerp(a0, a1, J(100 + k))·(J(150 + k) < 0.5면 −1)(아래는 200·250). 앞선(넓은 붓): (x1 − 4, −hw(x1)) → Q (x1 + 3, 0) → (x1 − 4, hw). 비백 줄: n = 3 + ⌊J(300)·3⌋, len = lerp(0.3, 0.8, J(320 + j))·(x1 − 26), x = 26 + J(330 + j)·(span − len), y = (2J(310 + j) − 1)·0.7w, 끝 y + 0.6. 심(십자 획): x = 26 + (L − 26)·from(각성 0.55) → x1 − 2 | `top`, `bottom`(앞 12점), `streaks`([시작, 끝] 쌍) |
| string | 캡슐 → 잔상 n개: (26, 0) → Q ((26 + L)/2, 2·9·sign_j·k) → (L, 0), k = 1 − clamp(나이/0.12) → 줄(굵기 ×1.2 각성 × punch m, m은 §7.3 식에 scale 2·seconds 0.06) | `after` [[x, 제어점 y]] |
| capsule | x 26 → L, 반폭 w, 끝은 반원, 26 쪽은 곧게 자른다 | — |
| comet | rm = (inner + R)/2, 머리 θh = 2π·J(700) + 240°·u(감소 모션은 J만). 표본 n = ⌈span/4°⌉, s = i/n의 각 θh − span·s, 폭 w = head·(1 − s)^0.9 + 0.8s, head = lerp(14, 18, J(710)). 앞머리 반타원 7점: H + 바깥·cos(πi/8)·head/2 + 앞(시계 방향)·sin(πi/8)·0.45head. 외곽 = 앞머리(역순) + 바깥 가장자리 + 안쪽 가장자리(역순). 심 = 중심선 표본 ⌊0.08n⌋ ~ max(+2, ⌊0.55n⌋) | `comet`(중심선 3개마다), `gaps` |
| rope | s = 2π·J(800)·R에서 s < 시작 + 2πR − 9 동안: θ = s/R, δ = tan40°·w/(2R), 자국 (R − w/2, θ − δ) → (R + w/2, θ + δ)를 Q로(제어점 = 중점 + 수직·0.12), s += lerp(9, 15, J(810 + k)). 바느질: 반지름 R + w/2 + 1.6, 2π·J(820)부터 120°(각성 180°). grow: 줄 묶음 전체를 R(나이)/R로 줄이고 늘인다 | `twist`(앞 6자국의 두 끝), `stitch` |
| crescent | φ = 2π·J(700) + 180°·u, d = 0.9·(R − inner). 바깥 점 R·(cos θ, sin θ), θ = φ − span/2 … φ + span/2(step), 안쪽 점 R − d·cos(π(θ − φ)/span)(역순, 양 끝 빼고). 각성 반대편 φ + 180°, d = 0.45(R − inner), α 0.18 | `crescent`(step 10°로 뽑은 꼭짓점) |

### 8.4 lobPath와 비행 그림(2차)
- 땅 (x, y) = (x0, y0) + t·(dx, dy). d = |(dx, dy)|, H = clamp(k·d, min, max), h = 4H·t(1 − t). angle = atan2(dy − 4H(1 − 2t), dx). 그림자 rx = lerp(rx0, rx1, t), ry = 0.42·rx, α = lerp(a0, a1, t).
- **`mini: true`**(송이 단지만, 3차 갈라짐의 작은 단지): H = `lobMini.h`(28, 거리와 무관), 그림자 rx = lerp(5, 7, t), α는 송이 단지와 같다. 다른 무기에서는 `mini`를 무시한다. C7 4줄은 무기 키만 본다(지시서 §7.2).
- 비행 그림(렌더러 = `draw(id, 'flight')`): lob마다 ① 그림자 타원(땅 (x, y), `SPEC.flight.shadow.token`, α = shadow.alpha)을 groundMarks 층(적 탄 그림자와 같은 곳)에, ② 물건 조각을 앵커가 (x, y − h)에 오게 air 층에 그린다. `rotate: 'path'`(유성 붓)만 angle + `turn`°로 돌리고 나머지는 돌리지 않는다(단지의 구름은 조각 안에 그려져 있다).
- 장(loop: 송이 단지·타르·유성 붓): 장 = ⌊나이·fps + J(1850 + k)·장 수⌋ mod 장 수, 나이 = t × 비행 지연(송이 0.6, 타르 0.7, 유성 붓 1.0초, 자료). reduced LOD는 fps 절반, minimal과 감소 모션은 still 장(0).
- 장(prog: 먹단지, `SPEC.flight.inkPots.frame` = `'progress'`, 수정 1회차 F1): 장 = min(3, ⌊t·4⌋), t = 비행 진행률(자료의 지연으로 잰다). phase를 쓰지 않는다. minimal은 0번 장, 감소 모션과 reduced LOD도 같은 규칙이다. 그래서 단지는 비행 동안 0 → 75° 한 번 구르고, 지시서 C11의 t .12/.30/.50/.70/.88에서 장이 0·1·2·2·3이다.
- **착지**: t가 1이 되는 순간(엔진의 `area/blast`) 비행 그림을 지우고 바로 착탄 0번 장(가장 센 장)을 그린다. 착지 예고 원은 그리지 않는다(지시서 §3).
- 상한: 화면당 비행 `caps.flights` [12, 12, 6]. minimal에서는 still 장과 그림자만이다(지시서 §3).

## 9. 그리는 순서·층·LOD·감소 설정

### 9.1 단계와 자료
| kind | 자료 | 그림 |
|---|---|---|
| strike·nova·lob(착탄) | `area/blast`(source = 무기 id, x, y, radius) | 사건마다 `ring` + layout(ground는 데칼, ally는 물건). 나이 = 사건 뒤 시간, 수명 `life[id].mark`, 데칼은 `life[id].decal` 동안 |
| chain | `ChainEffect`(points, skillId, 수명 0.18) | 선 도형 + point 조각. **점 조각은 자라는 선이 그 점에 닿은 뒤에 보인다**(곧은 구간 길이 누적 ≤ 도달 길이) |
| beam | `BeamEffect`(x1, y1 → x2, y2, width, 0.28) | 시작점 원점, +x = 빔 방향, L = 길이. 십자 획은 빔 넷 각각 |
| halo | `skillMark('ring', id, x, y, radius)` | inner는 무기 자료(`geo.inner`, 개기일식은 3차). 띠 + 도는 도형 + 조각 |
| lob 비행(2차) | RenderWorld `lobs`(지시서 §9-3: x0, y0, 착지 x, y, born, 지연, 무기 id, 각성, 시전 안 순번 k) | t = (지금 − born)/지연. lobPath로 그림자 + 물건(§8.4). t ≥ 1이면 그리지 않고 착탄으로 넘긴다 |

### 9.2 층 (지시서 §5.1)
- 바닥: K10 데칼(`scorch`, `mark-*`, `print-*`, `splat`, `pool`, `crater`) — 처치 얼룩 뒤.
- groundMarks: 적 발 오버레이(1차는 `rime<r>`), lob 그림자 타원(2차, 적 탄 그림자와 같은 곳).
- air(2차): lob 비행 물건. allyAttacks 층에 그리되 그림자는 위의 groundMarks에 따로 둔다.
- allyAttacks: 고리·띠·선·캡슐·wash, 물건, 점 조각(적 탄·텔레그래프보다 아래).
- **일곱째 인장 wash**: 같은 틱·같은 source의 사건들 원판을 한 경로로 그리고 nonzero로 한 번 채운다(겹쳐도 α가 쌓이지 않는다). 테·조각은 사건마다.
- 한 사건 안: wash → inner → 호 → core → 각성 가는 선. 여러 사건: 데칼 전부 → **splash 전부**(§7.3a, 수정 1회차) → 고리 전부 → 물건(y 순). 고리가 먹 튐 위에 온다.
- 족자 조각은 `SPEC.tilt`의 각으로 앵커를 축으로 돌려 놓는다(§7.3b).
- **유성 붓 착탄 반전**(`SPEC.flight.meteorBrush.landMirror`, 수정 1회차 F2): 그 `area/blast`를 낸 lob이 오른쪽에서 왼쪽으로 날아왔으면(x1 < x0, 'dx<0') `impact`·`impact-awakened`의 세 장을 **앵커를 축으로 좌우 반전**해 놓는다. 붓이 오른쪽 위에서 박혀 비행 방향이 이어진다(구운 빛은 오른쪽 위가 된다. 비행 혜성도 빛이 함께 돈다). `crater`, splash, 고리는 반전하지 않는다. 방향을 모르면(lob 자료가 없거나 x1 = x0) 반전하지 않는다. 엔진은 lob이 끝나는 틱에 같은 자리의 `area/blast`로 x1 − x0의 부호를 넘겨준다. 참고 합성은 `draw('meteorBrush', 'land', {dir: −1})`로 같은 반전을 그린다(기본 출력은 그대로).

### 9.3 참고 합성(`draw`)만의 배치
- strike `count`개 사건: k = 0..n−1, 각 2π(k + 0.7·J(960 + k))/n, 반지름비 0.35 + 0.65·√J(980 + k), 자리 = (120·cos, 80·sin)·비, 사건 seed = seed + 17k. 1개면 (0, 0).
- lob 사건: 게임과 같다(count > 1이면 scatter·(cos 2πk/n, sin 2πk/n)). 먹단지·타르·유성 붓은 scatter 0이라 겹친다.
- lob 비행(2차): 원점 = 던진 자리, 착지 = (dx, dy) + 위의 사건 자리(기본 dx 240, dy −60). `t` = 비행 진행률. 같은 자리로 가는 lob은 한 번만 그린다(겹친 그림이 장만 달라 두 겹으로 보이지 않게, 참고 합성만. 게임에서는 lob마다 표적이 따로다). 송이 단지 셋은 같은 자리에서 출발해 갈라진다.
- chain 점(points가 없을 때): (0, 0), (90k, ±40·(0.6 + 0.4·J(990 + k))) 번갈아. 점 수 = jumps + 1.
- 십자 획: 30°에서 시작해 90°씩(게임은 조준 방향, 각성은 22.5°씩 돈다).

### 9.4 LOD·감소 설정

| 설정 | K10 1차 |
|---|---|
| full | 전부 |
| reduced | loop fps 절반, **deco 조각과 prio 2 항목은 layout 순서로 하나 건너 하나** |
| minimal | deco 조각과 prio 2 항목 0(서리 고리 앞 3개 결정과 물건은 남는다), loop는 phase 장(phase 없으면 still)에 멈춤, 서리 사슬은 꺾은 줄 하나. 데칼은 지시서 상한(0)대로 렌더러가 뺀다. 유성 붓 `crater`만 lod info인데, 3차 별똥 자국(땅 조각)의 바닥이기도 해서다. 평상 착탄 데칼로는 minimal에서 빼고 별똥 자국에서는 그린다(`draw`는 lod info라 minimal에도 그린다) |
| 감소 모션 | 고리 grow 없음(R에서 α로 들어옴), punch scale ≤ 1.5, splash는 다 자란 길이에서 α가 0.06초에 걸쳐 들어옴, 혜성·초승 시작각에 멈춤, jag·twist 첫 seed 고정, loop는 phase 장, prog는 재생(족자 기울기도 장을 따른다) |
| 감소 섬광 | `flash: true` 조각(유성 붓 impact·impact-awakened)만 α × 0.5. 다른 조각의 한 장 안 종이 섬광은 박스 넓이의 30% 이하(먹단지 0번 섬광 r 23은 먹 튐 뒤에서 갈래만 보임, 손뼉 섬광 r 10.5) |
| splash LOD | full: 가시 전부 + 방울. reduced: 짝수 k 가시만. minimal: 송이 단지 0, 나머지 가시 셋(§7.3a). 화면당 12/8/3 사건 |
| lob 비행(2차) | full: loop 12fps(타르 8). reduced: fps 절반. minimal·감소 모션: still 장(0)과 그림자. 먹단지(prog, 수정 1회차 F1): 어느 설정에서도 진행률로 장을 고르고 minimal만 0번 장(바로 선 꼴). 화면당 12/12/6. 그림자는 어느 설정에서도 그린다 |

판정 도형(고리·띠·선·캡슐·wash)은 어느 설정에서도 그린다.

### 9.5 상한(3차에서 쓰는 기준값, `SPEC.caps`·`priority`)
화면당 K10 조각 220/140/70, 데칼 16/8/0 등 지시서 §4.5·§5.4 그대로. `caps.splash` [12, 8, 3](수정 1회차). 1차 조각 중 버리는 순서: deco 조각 → 데칼 → (물건·판정 도형은 버리지 않음). splash가 상한을 넘으면 넘는 사건의 splash만 빼고 고리·물건은 그대로 그린다(어느 사건을 먼저 빼는지는 렌더러의 상한 규칙과 함께 메인 세션이 정한다).

## 10. 예산 실측
- 조각 **173장**, 박스 넓이 합 **389,928 단위²**(C2, 2차). 1차 141장·343,592 → 수정 1회차 137장·341,032(유성 붓 `streak-a/b` 4장 삭제) → 2차 +36장·+48,896(먹단지 8,160, 송이 단지 6,848(mini 1,440 포함), 타르 10,336, 유성 붓 23,552). 지시서 상한 380장·640,000 안이고, 계획 361장·약 61만 중 1·2차 몫이다. 가장 큰 그룹: 유성 붓 65,696, 붓 폭우 59,592, 족자 43,264, 먹번개 35,808.
- 팩 페이지 수·바이트는 메인 세션이 `npm run build:atlas`로 잰다(K4의 849,600 단위²가 1장에 들어간 것으로 보아 1장 기대).

## 11. 자가 확인 명령 (지시서 §7.2, 렌더 이름 `k10-`)

| 명령 | 1차 결과 | 수정 1회차 결과 |
|---|---|---|
| C1 모든 호출 | ok | ok |
| C2 조각 표·예산 | `frames=141 ok boxArea=343592 ok badParts=0` | `frames=137 ok boxArea=341032 ok badParts=0` |
| C3 조각 확대 | 모든 그룹 ok | (바뀐 조각만 4배·6배·8배로 다시 봄) |
| C4 T1·T2·T3 | 모두 ok | (다시 돌리지 않음, 1배 타격감 판으로 대신) |
| C5 기믹 | 3차 | 3차 |
| C6 | `calls=185 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0` | `calls=181 …` 나머지 같음(streak 4장만큼 호출이 줄었다) |
| C7 | 1~4줄 0건, 5줄 `invalid calls ok` | 같음 |
| C8 | 고정값 `k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244`, K9·K11·고정 묶음·PN 키 호출 전후 same | 고정값 같음, K9 `n4n4y2/2117692`·K11 `xkyc9r/881478` 전후 same, PN 키 same |
| C9 | 납품서에 원문 | 사례 셋(inkPots land r92 seed 9, clusterPots land r64 seed 9, fallingScroll impact r110 seed 4)을 더해 75줄, 납품서에 원문 |
| C10 | `fills=14 fail=0` | 같음(값도 같음) |
| C11·C12·C13·C14 | 2차·3차 | 2차·3차 |
| C15 | ok | ok. K9 검수 7차 §7 기준 아이콘(위 해시)과 대조 |

**검수 1차 §8 명령(수정 1회차에 돌린 것)**
- 보존 해시 `k10-keep-hash`(명령은 검수서 §8): 수정 전 = R4 전 = `k10-keep-stamps=1oioxia len=158464`, `k10-keep-draw=tlb0e8 len=1615017`, `k10-keep-spec=v6ki5j len=2682`. R4(얼음판 금)를 넣은 뒤 = `k10-keep-stamps=fxjb0m len=158470`, `k10-keep-draw=2rsj2w len=1615076`, `k10-keep-spec=v6ki5j len=2682`. 앞의 둘은 `frostChainlet/rime12·19·28`이 이 묶음에 들어 있고 연쇄 `draw`가 그 조각을 놓기 때문에 바뀌었다. 다음 수정부터는 뒤의 값이 기준이다.
- 1배 타격감 `k10-impact-ages-lob`·`-strike`(1배 색), `-lob-gray-x08`(0.8배 흑백), M2 `k10-meteor-vs-imminent-gray`, M3a `k10-tar-vs-bomber`(3배)·`-x1-gray`, M3c `k10-seal-prints`(2배). 모두 `--check` ok.

**검수 2차 §8 명령(수정 2회차)**
- `k10-keep2`(seventhSeal을 뺀 모든 조각·draw와 version을 뺀 SPEC 전체): 수정 전·후 모두 `k10-keep2-stamps=s5zgbw len=309624`, `k10-keep2-draw=4rja1n len=3324145`, `k10-keep2-spec=4k7tt6 len=13113`. 바뀐 것은 seventhSeal뿐이다.
- 옛 `k10-keep-hash`는 `seal`이 들어 있어 `k10-keep-stamps`만 `vume3m len=158248`로 바뀌었다(검수서가 예상한 변화). `k10-keep-draw=2rsj2w len=1615076`, `k10-keep-spec=v6ki5j len=2682`는 그대로다.
- C2 `frames=137 ok boxArea=341032 ok badParts=0`, C6 `calls=181 … 모두 0`, C7 1~4줄 0건·5줄 ok, C10 `fills=14 fail=0`(값 그대로), C1 ok, C8 고정값 4개 같음·K9 `n4n4y2/2117692`와 K11 `bvf9fj/934797` 호출 전후 same·PN keys same.

**2차(lob 비행 + print-c)**
- C1 `k10-c1-all-d2` ok. C2 `k10-c2-parts-d2b` `frames=173 ok boxArea=389928 ok badParts=0`. C6 `k10-c6-scan-d2` `calls=225 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`. C7 `k10-c7-geometry-d2b` 1~4줄 0건·5줄 ok. C8 `k10-c8-unchanged-d2` 고정값 4개 같음, K9 `n4n4y2/2117692`·K11 `bvf9fj/934797` 호출 전후 same, PN keys same, 호출 225. C9 `k10-c9-vectors-d2` 75줄, lob 네 줄(72~75)은 1차와 같다. mini 경로는 `k10-c9-mini-d2`(납품서). C10 `k10-c10-contrast-d2` `fills=15 fail=0`(lob.shadow Y 0.288~0.330, 결 코트 대비 2.50:1). C11 `k10-c11-lob`(색)·`-gray`(흑백) ok. C13 `k10-c13-marks-d2` ok(오버레이는 3차라 칸이 없다). C15 `k10-c15-pairs-d2` ok(lob 넷은 비행 물건과 K9 아이콘).
- **보존 해시**: 검수서의 `k10-keep2` 명령을 그대로 돌리면 2차가 **더한** 조각·`flight` 단계·`SPEC.flight`·`lob.shadow`까지 묶여 값이 바뀐다(`1gv83el/518960`, `1bdlklp/3831623`, `x87qbn/13444`). 더한 것만 빼고 같은 식으로 잰 `k10-keep2-d2`는 수정 2회차 값과 **같다**: `k10-keep2-stamps=s5zgbw len=309624`, `k10-keep2-draw=4rja1n len=3324145`, `k10-keep2-spec=4k7tt6 len=13113`. 명령은 검수서 §8의 `k10-keep2`에 아래 셋만 더한 것이다.
  - 조각: `NEWP={pot,pot-awakened,pot-s,pot-m,mini,jar,jar-awakened,comet,comet-awakened}`에 든 part는 건너뛴다.
  - draw: 단계가 `flight`면 건너뛴다.
  - SPEC: `delete S.flight; S.fills=S.fills.filter(q=>q[0]!=="lob.shadow")`.
  - seventhSeal은 이 묶음 밖이다. 인장에서 바뀐 것은 `PRINTS['print-c']` 한 줄(`brush: true`, 매듭 점 둘, w 1 → 1.1)이고 `seal`·`print-a/b` 코드는 그대로다.

**2차 수정 1회차(검수 4차 F1·F2, 규칙만)**
- C2 `k10-c2-parts-d2r1`: `frames=173 ok boxArea=389928 ok badParts=0`, `inkPots/pot f4 prog 0.55s box30x34 a15,17 air none air info w:flight`(`pot-awakened`도 같음).
- 먹단지 비행 장(`k10-pot-flight-frames`, t .12/.30/.50/.70/.88, dx 560, dy −40, seed 3): full 0·1·2·2·3, 각성 0·1·2·2·3, minimal 0·0·0·0·0, 감소 모션 0·1·2·2·3, reduced LOD 0·1·2·2·3. 같은 t에서 전의 loop는 2·3·0·2·3이었다(`k10-pot-frame-old-new`).
- 착탄 반전(`k10-meteor-land-dir`, 2배, 왼쪽 기본·오른쪽 `dir: −1`): 오른쪽 열에서 붓이 오른쪽 위에서 박힌다. 글자 비교(`k10-meteor-dir-diff`): `dir: −1` 출력에서 ` scale(-1 1)`(impact 사건 수만큼 1·1·3·2개)만 빼면 기본 출력과 **같다**. 분화구·splash·고리는 그대로다. 먹단지 `land`는 `dir`과 관계없이 같다.
- `k10-keep2-d2r1`: `s5zgbw len=309624`, `4rja1n len=3324145`, `4k7tt6 len=13113` — 그대로.
- `k10-keep-all`(검수 4차 §3 명령) 수정 전(`k10-keep-all-before`) → 후
  - stamps `nvezmq len=535352` → `nvezmq len=535352`(그대로: 그림을 다시 그리지 않았다)
  - draw `16q45bq len=4419724` → `16q45bq len=4419724`(그대로, §12-61)
  - spec `x87qbn len=13444` → `ej7o5i len=13529`(+85: `frame: 'progress'`, `landMirror`)
  - parts `1lej6wb len=13867` → `9on297 len=13871`(+4: pot 두 서술자의 fps 12 → 0, still 0 → null)
  - 3차부터는 이 네 값이 '3차가 더한 것만 뺀' 보존 기준이다(검수 4차 §3).
- C1 `k10-c1-all-d2r1` ok, C6 `k10-c6-scan-d2r1` `calls=225 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`, C7 `k10-c7-geometry-d2r1` 1~4줄 0건·5줄 ok.

## 12. 지시서와 다르게 한 것

1. **토큰 값**: `K`는 지시서 §0.3의 이름·값(구현값 hex)이다. K4 파일의 원래 `K`는 v1.0 키트 값(`#121110` 등)이고 지시서 §0.3의 값은 리뷰 시트가 출력 글자에도 `COLOR_MAP`을 적용해서 보인 값이다. C6이 원래 마크업을 구현값으로만 받으므로 구현값을 그대로 썼다. 구운 색은 K4와 같다.
2. **붓 폭우 b 길이 68**(지시서 76): 박스 48×88 / 앵커 (14, 80)에서 26° 획의 꼬리가 x 31을 넘지 않는 최대 길이다.
3. ~~족자 기울기 3°·3.5°·3.5°~~ → **수정 1회차 M4로 해결**: 조각은 똑바로 굽고 렌더러가 `SPEC.tilt`로 0·6·12·12°를 돌린다(검수 결정 (a), 박스 52×104 그대로).
4. **족자 파문 core 층**: 지시서가 층을 정하지 않아 [[ink,3.2],[ally,1.6]]로 정했다. 각성은 길이 ×1.5(90°).
5. **서리 고리 띠**: p50 **α 0.5**, fade at **0.3**. 지시서의 띠(종이, 0.45초)는 C10 기준(0.3초를 넘는 채움 Y ≤ 0.62, 짧은 띠 Y ≤ 0.69)을 넘는다. α 0.5로 그리고 0.135초부터 줄여 α > 0.25인 시간이 0.29초다. 서릿발 결정(조각)은 흰색 그대로다.
6. **일곱째 인장 wash union**(추가): 한 시전의 원판을 한 경로로 채운다. 7~10개가 겹치면 α가 쌓여 P1을 넘기 때문이다.
7. **서리 고리 inout 결정**: 안쪽(dr < 0)에 놓인 결정은 안쪽을 본다(angle + π). 띠의 양쪽으로 서리가 자란다.
8. **먹 파동 틈**: "바깥 가장자리 틈"을 띠를 끊는 틈으로 그렸다(먹 덩이가 고리를 끊는 아이콘과 같은 뜻).
9. **붓 폭우 core**: "한 찍음에만"을 가장 긴 찍음 가운데로 정했다(jit로 고르면 4°짜리 찍음에 걸리기도 했다).
10. **천둥 박수 jag**: 깜빡임 seed(5·6)만 쓰고 인스턴스 seed는 쓰지 않는다(지시서 문구 그대로). jag은 R0에서 만들고 grow로 늘인다.
11. **침묵의 종 각성 넷째 고리**: final 0.58에 delay 0.24·α 0.3을 정했다.
12. **일식 초승 그림자**: "중심을 옮긴 원"이 아니라 코사인 두께 초승(R − d·cos(π(θ − φ)/span))이다. 옮긴 원을 span으로 자르면 끝이 곧게 잘린 부채꼴이 되고, 세 점을 지나는 원은 이 값(d > 활꼴 높이)에서 같은 방향으로 휘지 않는다. 끝이 뾰족한 초승이 된다.
13. **얼음판 비율**: `rime12/19/28`은 ry/rx 0.38·0.33·0.28이다. 박스 높이(18·22·28)와 발 범위 아래쪽(+4·+4·+5) 안에 0.42를 넣을 수 없다. 서릿발은 위로 세우지 않고 판 가장자리에서 땅에 누인 결정 셋이다.
14. **사슬·폭풍실 grow**(추가): 서리 사슬은 수명 앞 30% 동안 고리가 차례로 생기고, 폭풍실은 30% 동안 그려 나간다. 지시서에 grow가 없어 불꽃실과 같은 문법을 줬다.
15. **연쇄 점 조각의 등장**(추가): 점 조각(불꽃·바람 획·얼음판)은 자라는 선이 그 점에 닿은 뒤에 보인다. 선보다 먼저 끝점에 불꽃이 떠 있었다.
16. **먹창 thrust·retract**: 수명의 비율로 읽었다(0.18, 0.7 → 0.6L). 창끝은 26 + 8에서 나간다.
17. **십자 획 "뒤쪽만 먹 테"**: 빔 틀의 +y 쪽(그늘 쪽) 가장자리에만 먹 테를 둔다.
18. **심판선 잔상 부호**: [1, −0.7, 0.48](셋째는 각성).
19. **캡슐 시작**: 26에서 곧게 자른다(둥근 시작 끝을 26 밖으로 그리지 않는다).
20. **틈 각도가 없던 고리**: 송이 단지·타르 항아리 틈 1개는 8~14°, 먹 궤도 바깥 틈 2개는 8~14°, 유성 붓은 틈 2개(6~10°)를 줬다(굵기 고른 닫힌 고리 'O'를 피함).
21. **grow·fade가 없던 고리**: 인장 0.85/0.06·0.6, 붓 폭우 0.8/0.06·0.6, 먹단지 0.75/0.07, 송이 0.75/0.06, 타르 0.75/0.08, 족자 fade 0.6, halo fade 0.6을 줬다.
22. **head prim**(추가): 머리 위 물건 자리를 `prim: 'head'`(0, headY)로 냈다. layout 항목에 `index`(point)와 `dr`(ring)를 더 냈다.
23. **데칼 페이드 규칙**(추가): `SPEC.decal.fadeAt` 0.5. idx 데칼 조각의 `seconds`에 데칼 수명을 적었다(참고값).
24. **reduced LOD의 deco 절반**: layout 순서로 deco·prio 2 항목 하나 건너 하나.
25. **거세지는 폭우**: 새 그림이 없다. 렌더러가 사건 반경으로 고리와 자국 s/m/l을 고르면 된다. 1차 `gimmicks`에는 넣지 않았다(3차에서 등록).
26. **lob `object`**: 1차는 착탄 조각이다. 2차에서 비행 물건으로 바꾼다.
27. **각성 가는 선**: 고리·halo에만 둔다(`SPEC.awakened.prims`). 수호 고리는 줄 안쪽 가장자리(R − 6)와 겹쳐서 뺐고, 선(chain·beam)은 무기별 각성 값만 쓴다.

**수정 1회차(검수 1차 M1~M4·R1~R4)에서 정하거나 다르게 한 것**

28. **punch·splash 값과 합격 기준이 서로 맞지 않는다(값은 처방대로 두었다)**: 처방 식으로는 나이 0.02초의 고리 먹이 먹단지 5.30·송이 단지 3.93(기준 6·4.5, 나이 0에서는 6.6·4.68), splash가 0.5R(먹단지)·0.6R(유성 붓)에 닿는 가시 수가 2·0(기준 5·6)이다. 0.04초에 6·3, 0.08초(다 자람)에 7·5다(검수 렌더 seed 5·19). 검수서 §9가 이 값을 '설계값, 검수 2차 렌더로 다시 판단'이라 했으므로 식·값을 바꾸지 않고 실측을 납품서에 적었다. 맞추려면 punch에 `hold`(0.03초 동안 m = scale), splash grow seconds 0.02, 유성 붓 to 아래 끝 0.6이 가장 작은 변경이다.
29. **splash 갈래의 ±7°**: 사건 중심을 축으로 한 극좌표 각으로 읽었다. 갈래 A 끝 = (rb + L, θk + 7°), B 끝 = (rb + 0.82L, θk − 7°), 사타구니 = 축 위 rb + 0.7L(옆으로 휨/2). 가시 축을 기준으로 돌리면 B 갈래가 0.12L로 너무 짧아 1배에서 갈래가 보이지 않았다.
30. **jit 번호대 겹침**: 검수서 식 그대로 1710+k … 1790+k를 쓰면 유성 붓 각성(n ≤ 12)의 k = 10·11에서 1730+k가 1740·1741과 겹치고 1790+k가 1800·1801이 된다. 결정적이고 다른 쓰임과 겹치지 않아 그대로 두었다(가시 10·11의 끝 길이가 가시 0·1의 폭과 상관만 있다).
31. **송이 단지 1번 장의 먹 튐**: 0번 장(r 6.5, 팔 6, reach 1.9~3.0)과 같은 먹 튐에 방울을 단 것으로 바꿨다. 1차의 1번 장 먹 튐(r 5.2, reach 1.7~2.6)을 두면 0 → 1에서 먹 튐이 30% 줄어 1배에서 깜빡였다. 지시서가 0번 장만 적었으므로 다르게 한 것으로 적는다.
32. **타르 항아리 1·2번 장**: 둘로 쪼개지는 그림(1차) 대신, 쓰러진 항아리 꼴은 그대로 두고 위 어깨의 휜 조각이 금 가 밀려났다가(1) 입 뒤 땅에 떨어지는(2) 그림으로 그렸다. 반쪽 둘은 1·3배에서 검은 관 토막으로 읽혔고, 들어 올린 조각은 항아리 위에 선 심지로 읽혔다. 꼴 기준(K9 검수 7차 §7)이 '쓰러진 항아리 하나'라 실루엣을 지키는 쪽을 골랐다.
33. **유성 붓 걸이 고리**: 검수서 M3b의 '먹 1.2 고리' 대신 K9 기준과 같은 종이 고리(먹 테 2.6 위 종이 1.1, 지름 약 5)로 했다. 마개 끝에서 아래로 늘어지고, 먹 꼬리와 먹 마개 옆이라 먹 고리는 보이지 않았다. 꼬리는 K9 기준대로 마개에서 자루 폭으로 시작해 먼 끝에서 가장 넓다('자루를 감싸는' 꼴은 기준 꼴로 바꿨다).
34. **인영 테의 붓 폭**: K9 기준 §7대로 테 호를 가운데 1.8, 끝 0.5로 마르는 붓 획으로 했다(반달 c는 검수서대로 0.8 → 2.4 → 0.8).
35. **방울을 뺄 때의 '끝 + 방울'**: 방울의 먼 끝 rt + gap + 1.7r로 쟀다.
36. **방울은 full LOD에서만**: reduced는 검수서대로 방울 없음, minimal도 방울 없음으로 했다.
37. **punch를 받지 않는 것**: 각성 가는 선(R − 6)과 wash는 그 고리의 SPEC 층이 아니라 곱하지 않았다. 유성 붓은 맞는 순간 먹 11이라 안쪽 가장자리가 R − 5.5로 각성 선(R − 6)에 닿는다(0.1초).
38. **`SPEC.version`** `1.0-d1` → `1.0-d1r1`. 보존 해시 `keep-spec`에 들지 않는다.
39. ~~인장 몸은 K9 기준과 다르다~~ → **수정 2회차 F2로 해결**: 목 + 공 꼭지(검수 2차 §5 값 그대로). K9 아이콘의 꼭지는 종이(먹 테)이고 K10은 처방대로 먹이다(빛면 ink500 + 종이 점).

**수정 2회차(검수 2차 F1·F2)에서 정하거나 다르게 한 것**

40. **매듭 획의 '곧은 구간' 재는 법**: 획을 Catmull-Rom 표본(구간당 16)으로 나누고, 접선 방향이 12° 창 안에 머무는 가장 긴 길이를 인영 폭(2rx)으로 나눴다. a 33%, b 25%다(기준 35% 이하). 바꾸지 않은 c는 같은 잣대로 38%다.
41. **a·b의 새 꼴**: 테를 따라 도는 획은 1·2배에서 겹 테나 눈꺼풀로 읽혀서(시안 `k10r3-cord-candidates*`) 버렸다. 실을 꿰듯 테 틈이나 테를 넘나드는 끈으로 그렸다. a는 왼쪽 틈(165~215°)으로 들어와 오른쪽 테(0°)를 넘어 나가고, b는 왼쪽 아래 테(약 145°)에서 나와 오른쪽 위 테 밖(약 315°)으로 튕긴다. 'ㄱ자로 말린 획'·'열린 고리'라는 1차 표현은 쓰지 않는다.
42. ~~c는 그대로~~ → **2차에서 바꿈**(검수 3차 판단 1): c의 S 물결도 a·b와 같은 `brush` 붓 획이다(§12-57).
43. **붓 획 그리기**: 매듭 점 → `crPts`(`smooth`와 같은 곡선의 표본) → `brushD`, 폭 = 0.4 + (w − 0.4)·sin(πt)^0.6.
44. **각성 반짝임 자리**: 0번 장은 인장을 1.06×0.9로 누르므로, 검수서 예 (5.2, −32.6)(누르지 않은 공 기준)를 눌린 공의 오른쪽 위 가장자리 (4.4, −29.4)로 옮겼다.
45. **`SPEC.version`** `1.0-d1r1` → `1.0-d1r2`. `k10-keep2`는 version을 빼고 재므로 영향이 없다.

**2차(lob 비행, 지시서 §3·§8)에서 정하거나 다르게 한 것**

46. ~~먹단지 구름의 loop 톱니~~ → **수정 1회차 F1로 해결**(검수 4차 결정 가 = prog): `pot`·`pot-awakened`는 prog(seconds 0.55 참고값, window flight)이고 장은 비행 진행률로 min(3, ⌊t·4⌋)이다(`SPEC.flight.inkPots.frame` `'progress'`). 단지가 비행 동안 0 → 75° 한 번 구르고 되감기지 않는다. 그림·박스·앵커는 그대로다.
47. **송이 단지에는 각성 비행 조각이 없다**(검수 4차 결정 나: 더하지 않음): 7~13px 단지에 겹 테를 두르면 12~17px 밝은 원판이 되어 동전 픽업과 헷갈린다. 각성은 수 +1과 3차 갈라짐(`mini`)이 맡는다.
48. **`mini` 조각과 lobPath `mini`**: 지시서 §8의 '송이 단지 mini'를 조각 + 경로로 읽었다. 조각 `clusterPots/mini`(4장, 18×20, 앵커 9,11, 창 `pending`)는 3차 갈라짐(±60으로 나는 작은 단지 둘)이 쓴다. `lobPath(…, {mini: true})`는 송이 단지에서만 높이 28 고정·그림자 rx 5→7이고, 그림자 α는 지시서에 없어 송이 단지 값을 쓴다. 박스는 처음 16×20이었는데 리본 끝이 C7 박스 − 3을 넘어 18×20으로 넓혔다.
49. **유성 붓 `comet`은 머리를 위로 굽는다**: 지시서 박스 32×92·앵커 (16,14)를 그대로 쓰려면 붓이 세로여야 한다. 모듈의 다른 회전 조각은 +x가 회전 방향이지만, comet은 로컬 −y가 나는 쪽이다. 그래서 `SPEC.flight.meteorBrush.turn` = 90을 두고 렌더러가 lobPath.angle + 90°로 돌린다.
50. **유성 붓 꼬리 길이 약 44**(지시서 60~70): 박스 92 안에 K9 꼴의 붓(머리·쇠테·자루·마개 약 39)과 꼬리를 함께 넣으면 꼬리는 약 44다. 붓을 더 줄이면 1배에서 쇠테 띠와 마디가 뭉개진다. 머리 끝에서 방울까지는 약 83이다.
51. **붓털 머리**: 지시서 §3은 '뾰족한 끝'과 '횃불처럼 둥근 머리 금지', K9 검수 7차 §7은 '뾰족한 앞끝(로켓 코) 금지', 지시자는 '짓눌린 붓털'을 적었다. 쇠테 뒤에서 넓고, 축에서 조금 휜 끝이 홈 하나로 두 갈래로 갈라지는 붓끝으로 그렸다(매끈한 원뿔도 둥근 덩이도 아님). 처음 그린 세 덩이 갈래는 횃불 불꽃·왕관으로, 둥근 세 덩이는 횃불로 읽혀 버렸다(`k10d2-comet-x5`, `-x5b`).
52. **끈 끝은 아래·바깥으로**: 먹단지 목 끈, 송이 끈, 타르 봉인 끈의 끝을 모두 아래나 바깥으로 늘어뜨렸다. 위로 선 끈 끝은 단지 위의 도화선, 곧 K7 폭탄병으로 읽혔다(`k10d2-flight-f0-x10b`).
53. **송이 단지 입**: '먹 입 띠'를 먹 띠로 두르되 안을 ink700, 먼 안벽을 p300 선으로 보여 열린 입으로 그렸다. 꽉 찬 먹 띠는 1·10배에서 뚜껑으로 읽혔다.
54. **타르 항아리 비행**: 착탄 항아리와 같은 꼴(굽·입·빛면)을 0.62배·35°로 돌려 썼다(같은 물건). 타르는 입술 가장 낮은 곳(돌린 뒤 계산)에서 넓은 혀로 넘치고 두 줄로 처진다. 가는 막대 끝 둥근 방울은 북채·다리로 읽혀 '굵음 → 가늚 → 방울 → 뾰족한 끝'으로 바꿨다.
55. **`SPEC.flight`(새 키)**: 지시서에 없는, 렌더러가 비행 조각을 고르고(무기·각성·순번), 장 phase를 정하고(J(1850 + k)), comet을 돌리는(turn) 규칙이다. `SPEC.lob`·`lobMini`의 값은 바꾸지 않았다.
56. **`lob.shadow` 채움**(`SPEC.fills` 끝에 추가): lob 그림자는 0.3초 넘게 남는 채움이라 C10에 넣었다(ink α 0.14, 1초 — 가장 옅고 가장 긴 경우).
57. **print-c 붓 획**(검수 3차 판단 1): `brush: true`, w 1.1, 매듭 점 둘을 조금 깊게(−0.56, 0.58 → −0.57, 0.62와 0.22, 0.72 → 0.23, 0.78). 12° 안 곧은 구간 38% → 25%, 가운데에서 0.44 그대로, 폭 80%, 끝은 바깥. 반달 테·반쪽 종이·점·rx·박스·앵커는 그대로다. 같은 잣대(§12-40)로 a 33%·b 25%도 다시 재어 같다.
58. **`draw(id, 'flight')`의 `t`는 진행률**: 지시서 C11이 `t`를 0.12~0.88로 넘긴다. 그래서 flight에서만 `t`를 lobPath의 t로 읽고, 비행 나이 = t × 지연이다. t ≥ 1이면 빈 그림이다. 같은 자리로 가는 lob은 한 번만 그린다(§9.3).
59. **`SPEC.version`** `1.0-d1r2` → `1.0-d2`.
60. ~~왼쪽으로 던진 유성 붓의 착지~~ → **수정 1회차 F2로 해결**(검수 4차 결정 다 = 렌더러 반전): `SPEC.flight.meteorBrush.landMirror` = {when 'dx<0', parts [impact, impact-awakened]}. 렌더러는 x1 < x0인 lob의 착탄에서 그 조각 세 장을 앵커를 축으로 좌우 반전한다. 분화구·splash·고리는 반전하지 않고, 방향을 모르면 반전하지 않는다(§9.2). 참고 합성은 `draw('meteorBrush', 'land', {dir: −1})`. 반전 꼴을 따로 굽지 않는다. 단지·항아리는 그대로다.
61. **`k10-keep-all-draw`가 F1 뒤에도 그대로인 까닭**: 이 명령은 비행을 t = p × 0.3 = 0.03·0.15·0.27, seed 7로 그린다. 먹단지는 같은 자리 lob을 한 번만 그리므로 lob 0 하나이고, 전의 loop 장 ⌊t·0.55·12 + 4·J(7, 1850)⌋ mod 4는 J(7, 1850) = 0.995라 0·0·1이 된다. 새 prog 장 ⌊t·4⌋도 0·0·1이라 그린 것이 같다(`k10-pot-frame-old-new`). F1은 C11의 t에서 장을 바꾼다(2·3·0·2·3 → 0·1·2·2·3).
62. **`SPEC.version`** `1.0-d2` → `1.0-d2r1`.

## 13. 사람 원화가에게 남길 것 (바이블 §15)

- 물건의 붓 외곽·블랙 스팟·비백: 번개와 먹구름, 붓 획(붓털 비백), 족자, 둥근 도장, 손, 손종, 백자 조각, 타르 항아리와 줄, 큰 붓, 먹통, 술, 리본, 매듭.
- 서리 결정·얼음판·찢긴 종이 획·먹 폭발 팔·타르 윤기의 붓 질감(절차형으로 낼 수 없다).
- 문화 검토: 손뼉(맞닿는 장이 합장으로 보이지 않게 — 지금은 32° 기울임 + 어긋남 + 섬광), 손종(범종이 아니게), 도장·인영(글자·인주 없음, 인영 안 올가미 매듭이 글자로 읽히지 않게), 족자(글자 없음, 산 능선이 'M'으로 읽히지 않게), 십자 획의 십자 모양(Q9).
- 수정 1회차에 더한 것: 유성 붓 꼬리 갈래의 마른 붓 끝과 짓눌린 붓털, 쓰러진 항아리의 입·굽·깨진 어깨 단면, 인영의 찍힘 질감(라틴 글자 같은 말림을 피함), 서리 결정 각기둥의 면, 먹단지 사기 조각의 휜 단면, splash 가시의 붓 질감(절차형 쐐기다).
- 수정 2회차에 더한 것: 인영 끈(a·b)의 찍힘 질감과 끊김, 공 꼭지의 옻칠 광택.
- 2차에 더한 것: 비행 단지의 먹 흘림과 뚜껑 붓 외곽, 송이 끈 리본의 펄럭임, 타르 줄의 윤기와 늘어짐, 유성 붓 붓털 머리(눌린 갈래)와 비행 꼬리의 마른 갈래, 인영 c의 찍힘 질감. 게임 크기(단지 약 13~18px, 송이 단지 약 7~13px)의 1배 픽셀 다듬기.
- (1차의 '유성 붓 비백 줄기' 항목은 수정 1회차 M2로 줄기를 없애 지웠다.)
- 게임 크기(1배)의 픽셀 다듬기: 머리 위 손(~30px)과 손종(~40px), 불꽃·바람 획(≤ 24px), 술·먹통(뒤쪽 26~56).
- 정식 판독 시험(n ≥ 8)은 하지 않았다.
