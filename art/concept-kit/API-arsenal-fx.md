# API — `k-arsenal-fx.js` · `PN.arsenalFx` v1.0-d3b2-r1 (무기 44종 전장 효과 — 납품 3, 2회 2/2 수정: 각성 기믹 P2 이어지는 효과 + 검수 7차 F1·F2 + 검수 8차 F1)

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
| 3차 1회(3a) | 2026-10-19 | 각성 기믹 **P1 17종**(§14): 땅 조각 8종(`SPEC.zone`), 삼각 봉인·펼쳐지는 족자·여덟째 인장·개기일식·거세지는 폭우(`SPEC.gimmick`), 적 오버레이 5종(`overlays` = silence, prey, crow, freeze, scorch, `SPEC.overlay`). 새 조각 107장(새 그룹 8 + 기존 그룹 끝에 붙임), `SPEC.layout`에 기믹 단계, `SPEC.fills` 9줄. `SPEC.version` `1.0-d3a`. 기존 출력은 그대로다(§11 `k10-keep-all-d3a`) |
| 3차 1회 수정(3a-r1) | 2026-10-19 | 검수 5차('## K10 검수 5차') F1·F2·R3: F1 불먹 발밑 불길 `scorch12/19/28/38/54`를 땅 조각 불길(`flame-a/b`) 문체의 덩이 1~3개로 다시 그림(박스·앵커·장 수·drive·층·r 그대로), F2 땅 조각 가운데 물건의 loop·idx 장 α 규칙(§14.3), R3 §1 의존 문장. `SPEC.version` `1.0-d3a-r1`. 바뀐 출력은 scorch 다섯 조각(10장)과 그것을 쓰는 `overlay('scorch')`·불먹 맥락 그림, 번개 기둥·회전 베기 참고 합성뿐이다(§11 `k10-keep-3a-r1`) |
| 3차 2회 1/2(3b1) | 2026-10-19 | 각성 기믹 P2의 **적 표식·발 오버레이 9종**(§14.10): 머리 표식 공포·약화·얼룩 1~3·헤맴, 보스 균열판 1~5, 꽃가루 포자, 발 서리 수 1·2·묶임·가시. 새 조각 36장(새 그룹 5 + 기존 그룹 끝에 붙임), `overlays` 9키, `SPEC.overlay` 새 하위 키, 단계 9(우선 2). 검수 5차 R1 까마귀(첫째 깃·부리)와 결정 ②의 SPEC 기록(`SPEC.gimmick.eclipseHalo.layers`·`reducedFlash`). `SPEC.version` `1.0-d3b1`. 바뀐 기존 출력은 까마귀 조각 6장과 그것을 쓰는 단계·오버레이뿐이다(§11 `k10-keep-3b1`) |
| 3차 2회 2/2(3b2) | 2026-10-19 | 각성 기믹 P2의 **이어지는 효과**(§14.11: 얼룩 터짐, 늦은 붓자국, 도미노, 감전 도약, 공포 고리, 꽃가루 고리·퍼짐, 배후 응징, 균열 터짐, 밀쳐 부딪힘, 메아리, 갈라짐, 되감김, 증폭, 묶인 사슬, 가지창, 되쓸기, 되받기, 결 가속, 마름쇠 꺾임, 해바늘 배율 규칙). 새 조각 38장(새 그룹 4 + 기존 그룹 끝), `SPEC.gimmick` 새 키 20, 새 단계 15(우선 2), 3b1 단계 넷(stain·fear·crack·pollen)에 사건을 더함. 검수 7차 F1(헤맴 `lost`)·F2(가시 `thorn<r>`)·R2(얼룩 1)·R4(서리 1, 12 등급)·§5-6(포자). `SPEC.version` `1.0-d3b2`. 바뀐 기존 출력은 고친 조각(`lost`, `thorn12~54`, `mark-stain1`, `frost1-12`, `spore-a/b`)과 그것을 쓰는 단계·오버레이, 사건을 더한 네 단계뿐이다(§11 `k10-keep-3b2`) |
| 3차 2회 2/2 수정(3b2-r1) | 2026-10-20 | 검수 8차('## K10 검수 8차') F1: 꽃가루 고리(`SPEC.gimmick.inkBloom.ring`)를 지시서의 먹 + 청록 점선 샌드위치로 되돌림(고리 전체, 먹 대시가 청록 대시 양 끝으로 0.6씩 김). 조각은 바뀌지 않는다. API §14.11에 C10 규칙(폭 3 이하의 테·획은 면이 아니다)을 적음. `SPEC.version` `1.0-d3b2-r1`. 바뀐 출력은 `inkBloom/pollen` 단계 draw와 SPEC의 `gimmick.inkBloom`뿐이다(§11 `k10-keep-3b2-r1`) |

안 그린 단계·조각은 `META.stages`·`gimmicks`·`groups`에 없다. 그래서 지시서 §7.2의 명령이 납품마다 그대로 돈다. 메인 세션은 `META[id].done.fx === true`인 것만 등록한다.

## 1. 로드와 의존

```html
<script src="kit/lib.js"></script>
<script src="kit/k-arsenal-fx.js"></script>   <!-- window.PN.arsenalFx -->
```

- 모든 선언은 IIFE 안에 있다(`window.PN = window.PN || {}`).
- **의존 없음.** 다른 킷 모듈(`PN.skillVfx`·`PN.arsenal`(K9)·`PN.hazards`(K11)·`PN.env`·`PN.heroKit`·`PN.enemies`)을 부르지도 읽지도 않는다. `lib.js`의 도우미도 쓰지 않는다(모듈 안의 도우미만 쓴다). 그래서 로드 순서에 매이지 않는다. 참고 합성 `context: true`만 `PN.enemies`·`PN.heroKit`을 읽는다(§14.9). `stamp`와 기본 `draw`는 의존 없음.
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
  version: '1.0',   // 납품 단계는 SPEC.version(지금 '1.0-d3b2-r1')
  K,          // 토큰 11개(§7.1). 이름은 PN.skillVfx.K와 같고 값은 구현값 hex
  ids,        // 44개, src/content/data/arsenal.ts 순서
  kinds,      // ['volley','burst','spray','rear','seeker','strike','nova','lob','chain','beam','halo']
  META,       // §4 (얼려 있음)
  groups,     // 조각이 있는 무기 id: 1차 22개, 3a부터 30개(투사체 무기 8개가 기믹 조각으로 더해짐), 3b1부터 35개(+inkDarts, headsmanDarts, inkBloom, thornHalo, bossbane), 3b2부터 39개(+brushQuills, sealArrows, thunderNeedles, tailGuard)
  overlays,   // 적 오버레이 키: 3a ['silence', 'prey', 'crow', 'freeze', 'scorch'] + 3b1 ['fear', 'lost', 'weak', 'stain', 'crack', 'pollen', 'frost', 'bound', 'thorn']
  SPEC,       // §7. 토큰 이름·숫자·영어 낱말만 → 매니페스트에 그대로
  jit,        // jit(seed, i) → 0..1
  parts(group),                        // → [{part, frames, drive, fps, seconds, still, box, anchor, place, rotate, layer, lod, flash, window, r?}] (복사본)
  stamp(group, part, { frame }),       // 굽는 조각(로컬 박스). frame은 [0, frames−1]로 자른다
  layout(id, stage, opts),             // → [{prim, part, x, y, angle, flip, phase, prio, z, dr?, index?}] (§8.2)
  paths(id, stage, opts),              // → { 이름: [[x, y], …] } 매개 도형의 정의 점(C9, §8.3). 수정 1회차에 splash·drops·tilt 키가 더해졌다
  lobPath(id, { x0, y0, x1, y1, t, mini? }),  // → { x, y, h, angle, shadow: { rx, ry, alpha } } (§8.4). mini는 송이 단지만
  draw(id, stage, opts),               // 참고 합성(리뷰·골든). 원점은 §2, lob 'flight'는 던진 자리
  overlay(key, opts),                  // §14.5·§14.10. 원점 = 적의 발, opts.r·top·t·stack·facing·peck·layer
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
| `ch` | 1 | 1~5. 맥락 그림(`context`)의 장 |
| `context` | false | 3a부터: 기믹 단계의 참고 합성에 맥락(그 장의 먹귀, 결)을 함께 그린다(C5, §14.8). 주 단계·비행에는 쓰지 않는다 |
| `peck` | 없음 | `overlay('crow')`·`draw('crowFeathers', 'crow')`만: 까마귀 쪼기 틱(자료 `crowAt`) 뒤 초. 0 ≤ peck < 0.12면 쪼기를 그린다(§14.5). 없으면 맴돌기만(기본 출력) |
| `layer` | 없음 | `overlay`만: `'feet'`·`'front'`·`'head'` 중 그 층의 조각만(§14.5). 없으면 셋 다 그 순서로(기본 출력) |
| `r`, `top` | 12, −30 | `overlay`만: 적 반지름(크기 등급), 스프라이트 꼭대기 y |
| `stack` | 1 | `overlay`·표식 단계만(3b1): 얼룩 1~3, 균열 1~5, 서리 수 1~2. 범위 밖은 자른다 |
| `facing` | 1 | `overlay`만(3b1): −1이면 `rotate: 'face'` 표식(공포 땀방울)을 좌우 반전한다(적이 왼쪽을 볼 때) |
| `reducedFlash` | false | `draw('eclipseHalo', 'total')`만(3b1): 섬광 감소. 원판·띠 α × `SPEC.gimmick.eclipseHalo.reducedFlash`(0.5) |
| `share` | 없음 | `draw('frostChainlet', 'link')`만(3b2): 공유 피해 뒤 초. 0 ≤ share < 0.18이면 links를 α 1로 그린다(§14.11). 없으면 α 0.45(기본 출력) |

- 3b2 단계에서 `points`: `leap`은 [튄 적, 맞은 적] 둘, `link`는 사슬 구성원(결 없음), `rewind`·`amplify`는 결부터의 연쇄 점이다. `facing`(−1)은 `haste`도 좌우 반전한다.
- 3b2 단계의 `context`(C5 판): 연쇄 셋은 점 최대 여섯을 64 간격으로(x −170부터), 빔 둘은 길이를 300(가지창)·380(되쓸기)으로 자르고 결을 왼쪽으로 옮겨 그린다(칸 520 안). `context` 없는 참고 합성은 지시서 값 그대로다.

**잘못된 호출**(C7 5줄 ok)
- `parts(모르는 group)`, `stamp(모르는 group, …)`, `stamp(group, 모르는 part)`: `throw new Error('PN.arsenalFx: unknown …')`. 굽기가 조용히 다른 그림을 굽지 않게 한다.
- `draw(모르는 id 또는 납품 안 된 단계)`, `overlay(모르는 key)`: `console.warn('PN.arsenalFx: …')`를 남기고 정확히 `'<g/>'`를 돌려준다.
- `layout`은 같은 경우에 `[]`, `paths`는 `{}`를 돌려준다(경고 없음). `lobPath(lob이 아닌 id)`는 `null`이다.

## 4. META (44종)

필드: `name`(ko.json `skill.<id>`, 문서용) · `rarity`·`kind`·`look`(arsenal.ts 그대로) · `geo`(arsenal.ts의 기하: `radius`·`length`·`count`·`jumps`는 [기본, 레벨당], 나머지는 `inner`·`width`·`directions`·`hop`·`scatter`·`delay`·`size`) · `main`(주 단계, 투사체 무기는 `null`) · `stages`(납품한 단계) · `gimmicks`(납품한 기믹 `[{stage, priority}]`, 1차 `[]`) · `object`(대표 물건 조각, C15) · `done`(`{fx, lob, gimmick}`).

| id | 이름 | 등급 | kind | look | main | stages | object | 기믹(지시서 §4.1, 3차) | done fx/lob/gimmick |
|---|---|---|---|---|---|---|---|---|---|
| inkDarts | 먹침 | common | volley | needleStorm | — | stain | mark-stain2 | 먹 얼룩 P2(표식 3b1, 터짐 3b2) | ✗/✗/✓ |
| brushQuills | 붓깃 | common | volley | fanKnives | — | dab | dab | 늦게 터지는 붓자국 P2(3b2) | ✗/✗/✓ |
| sealArrows | 인장 화살 | rare | volley | needleStorm | — | topple | topple | 도미노 P2(3b2) | ✗/✗/✓ |
| frostNeedles | 서리침 | rare | volley | needleStorm | — | freeze, frost | — | 동결 P1 · 서리 수 P2(3b1) | ✗/✗/✓ |
| thunderNeedles | 뇌침 | rare | volley | needleStorm | — | leap | leapHit | 감전 도약 P2(3b2) | ✗/✗/✓ |
| twinBlades | 쌍날 | common | volley | fanKnives | — | spin | spin | 회전 베기 P1 | ✗/✗/✓ |
| ghostVolley | 혼령 일제사격 | epic | volley | mirrorClone | — | — | — | (P3) | ✗/✗/✗ |
| headsmanDarts | 망나니 침 | legendary | volley | needleStorm | — | fear | mark-fear | 공포 P2(표식 3b1, 고리 3b2) | ✗/✗/✓ |
| paperStorm | 종이 폭풍 | rare | burst | fanKnives | — | — | — | (그림 없음) | ✗/✗/✗ |
| inkBloom | 먹꽃 | rare | burst | needleStorm | — | pollen | spore-a | 꽃가루 P2(포자 3b1, 고리·퍼짐 3b2) | ✗/✗/✓ |
| thornHalo | 가시 테 | epic | burst | needleStorm | — | thorn | thorn28 | 가시 박힘 P2(3b1) | ✗/✗/✓ |
| starShards | 별조각 | epic | burst | mirrorClone | — | — | — | (P3) | ✗/✗/✗ |
| sunNeedles | 해바늘 | mythic | burst | needleStorm | — | — | — | 작열 P2(렌더러 배율 규칙만, `SPEC.gimmick.sunNeedles`, 단계 없음) | ✗/✗/✗ |
| inkDrizzle | 먹 이슬비 | common | spray | needleStorm | — | — | — | (그림 없음) | ✗/✗/✗ |
| pinHail | 핀 우박 | rare | spray | fanKnives | — | caltrop, snap | caltrop-a | 마름쇠 P1 · 꺾임 P2(3b2) | ✗/✗/✓ |
| tailGuard | 꼬리 방패 | common | rear | fanKnives | — | rear | rearHit | 배후 응징 P2(3b2) | ✗/✗/✓ |
| smokeTail | 연막 꼬리 | rare | rear | needleStorm | — | smoke, lost | puff-a | 연막 P1 · 헤맴 P2(3b1) | ✗/✗/✓ |
| gravePins | 묘침 | epic | rear | needleStorm | — | grave, bound | grave-a | 묘비 P1 · 묶임 P2(3b1) | ✗/✗/✓ |
| trackingSeals | 추적 인장 | rare | seeker | needleStorm | — | triangle | sealStrike | 삼각 봉인 P1 | ✗/✗/✓ |
| huntersMarks | 사냥꾼 표식 | epic | seeker | mirrorClone | — | prey | mark-prey | 사냥감 P1 | ✗/✗/✓ |
| crowFeathers | 까마귀 깃 | rare | seeker | fanKnives | — | crow | crow | 까마귀 떼 P1 | ✗/✗/✓ |
| bossbane | 보스 사냥침 | legendary | seeker | needleStorm | — | crack | mark-crack3 | 균열 P2(균열판 3b1, 터짐 3b2) | ✗/✗/✓ |
| inkLightning | 먹번개 | rare | strike | chainSpark | impact | impact, pillar | bolt | 번개 기둥 P1 | ✓/✗/✓ |
| brushDownpour | 붓 폭우 | epic | strike | boneMortar | impact | impact, surge | stroke-a | 거세지는 폭우 P1(새 그림 없음, §12-25) | ✓/✗/✓ |
| fallingScroll | 족자 낙하 | epic | strike | boneMortar | impact | impact, unroll | scroll | 펼쳐지는 족자 P1 | ✓/✗/✓ |
| seventhSeal | 일곱째 인장 | mythic | strike | voidMine | impact | impact, eighth | seal | 여덟째 인장 P1 | ✓/✗/✓ |
| inkPulse | 먹 파동 | common | nova | boneMortar | burst | burst, bump | null | 밀쳐 부딪힘 P2(3b2) | ✓/✗/✓ |
| frostRing | 서리 고리 | rare | nova | blackSun | burst | burst | shard-a | (P3) | ✓/✗/✗ |
| thunderclap | 천둥 박수 | epic | nova | chainSpark | burst | burst, echo | clap | 메아리 P2(3b2) | ✓/✗/✓ |
| silenceBell | 침묵의 종 | legendary | nova | voidMine | burst | burst, silence | bell | 침묵 P1 | ✓/✗/✓ |
| inkPots | 먹단지 | common | lob | boneMortar | land | land, flight, fire | pot | 불먹 P1 | ✓/✓/✓ |
| clusterPots | 송이 단지 | rare | lob | boneMortar | land | land, flight, split | pot-m | 갈라짐 P2(3b2) | ✓/✓/✓ |
| tarJar | 타르 항아리 | epic | lob | voidMine | land | land, flight, gather | jar | 끈끈이 모음 P1 | ✓/✓/✓ |
| meteorBrush | 유성 붓 | legendary | lob | boneMortar | land | land, flight, mark, haste | comet | 별똥 자국 P1 · 결 가속 P2(3b2) | ✓/✓/✓ |
| sparkThread | 불꽃실 | common | chain | chainSpark | jump | jump, rewind | spark | 되감김 P2(3b2) | ✓/✗/✓ |
| stormThread | 폭풍실 | epic | chain | chainSpark | jump | jump, amplify | null | 증폭 P2(3b2) | ✓/✗/✓ |
| frostChainlet | 서리 사슬 | rare | chain | chainSpark | jump | jump, link | null | 묶인 사슬 P2(3b2) | ✓/✗/✓ |
| inkLance | 먹창 | rare | beam | railSpear | stroke | stroke, branch | tassel | 가지창 P2(3b2) | ✓/✗/✓ |
| wideBrush | 넓은 붓 | epic | beam | frostLine | stroke | stroke, resweep | brush | 되쓸기 P2(3b2) | ✓/✗/✓ |
| crossStrokes | 십자 획 | epic | beam | railSpear | stroke | stroke | null | (P3) | ✓/✗/✗ |
| judgmentLine | 심판선 | mythic | beam | railSpear | stroke | stroke | inkbox | (P3) | ✓/✗/✗ |
| inkOrbit | 먹 궤도 | common | halo | orbitScythes | sweep | sweep, deflect | null | 되받기 P2(3b2) | ✓/✗/✓ |
| wardRing | 수호 고리 | rare | halo | eclipseStep | sweep | sweep, weak | knot-a | 약화 P2(3b1) | ✓/✗/✓ |
| eclipseHalo | 일식 테 | legendary | halo | eclipseStep | sweep | sweep, total | ribbon-a | 개기일식 P1 | ✓/✗/✓ |

- `object`: lob 4종은 1차에 착탄 조각(shatter·burst·crack·impact)을 적었고, 2차부터 비행 물건(pot·pot-m·jar·comet)이다. `stages`는 주 단계가 앞이고 `flight`가 뒤다.
- 3차 3a(P1 기믹): 기믹 단계는 `stages` 끝에 붙고 `gimmicks` = [{stage, priority 1}], `done.gimmick` = true다(17종). 투사체 무기(주 단계 없음)의 `object`는 기믹 물건이다(C15). 서리침(동결)은 발 오버레이라 `object`가 없다. 까마귀 깃의 K9 아이콘은 깃이고 기믹 물건은 까마귀다(같은 물건이 아님, §12-63). P2 기믹이 남은 무기(서리침 서리 수, 연막 꼬리 헤맴, 묘침 묶임, 유성 붓 결 가속)도 P1만으로 `done.gimmick` = true이고 P2는 3차 2회에 `gimmicks`에 더한다.
- 물건 조각이 없는 무기: 먹 파동(주인공이 매듭), 폭풍실·서리 사슬·십자 획·먹 궤도(선·띠가 물건이다).
- 3차 3b1(P2 표식·발 오버레이): 단계는 `stages` 끝에 붙고 `gimmicks`에 {stage, priority 2}가 더해진다(9종). 주 단계도 P1도 없던 무기(먹침, 망나니 침, 먹꽃, 가시 테, 보스 사냥침)는 이 단계로 `done.gimmick` = true가 되고, `object`는 기믹 물건(표식·가시·포자)이다. 터짐·고리처럼 같은 기믹의 이어지는 효과는 3b2에서 같은 단계에 더한다(그때 그 단계의 참고 합성이 바뀐다).
- 3차 3b2(P2 이어지는 효과): 새 단계 15개가 `stages` 끝에 붙고 `gimmicks`에 {stage, priority 2}가 더해진다(P2 단계는 모두 24개). 그림이 없던 투사체 무기 넷(붓깃, 인장 화살, 뇌침, 꼬리 방패)은 이 단계로 `done.gimmick` = true가 되고 `object`는 그 사건 조각이다(`dab`, `topple`, `leapHit`, `rearHit`). 주 단계가 있던 무기(먹 파동, 천둥 박수, 송이 단지, 불꽃실, 폭풍실, 서리 사슬, 먹창, 넓은 붓, 먹 궤도)는 `done.gimmick`이 처음 true가 된다. 해바늘은 규칙(`SPEC.gimmick.sunNeedles`)만 있고 단계가 없어 `done.gimmick`이 false로 남는다.

## 5. 굽는 조각 (`parts(group)`) — 354장, 박스 넓이 합 603,884 단위² (1차 141장 → 수정 1회차 137장(유성 붓 `streak-a/b` 삭제) → 2차 +36장: 비행 물건 32 + `mini` 4 → 3a +107장: 기믹 P1, 표는 §14.2 → 3b1 +36장: P2 표식·발 오버레이, 표는 §14.10 → 3b2 +38장: P2 이어지는 효과, 표는 §14.11)

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
| 1950, 1951, 1960 | 3a: 마름쇠 변형, 묘비 변형, 회전 베기 호 시작각. disc prim은 k, k+40, k+80, k+120, k+160(k < 40)을 쓴다(§14.6·§14.7) |
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
- 3a 기믹의 층: 땅 조각은 위험지형 층 맨 앞(채움·테·ground 조각), `stand` 조각은 bodies 층에서 발 y로 정렬, 오버레이는 `feet`(groundMarks)·`front`(그 적 몸 바로 뒤)·`head`(overheads)다(§14.3·§14.5).
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
| 각성 기믹 P1(3a) | §14.8 |

판정 도형(고리·띠·선·캡슐·wash)은 어느 설정에서도 그린다.

### 9.5 상한(3차에서 쓰는 기준값, `SPEC.caps`·`priority`)
화면당 K10 조각 220/140/70, 데칼 16/8/0 등 지시서 §4.5·§5.4 그대로. `caps.splash` [12, 8, 3](수정 1회차). 1차 조각 중 버리는 순서: deco 조각 → 데칼 → (물건·판정 도형은 버리지 않음). splash가 상한을 넘으면 넘는 사건의 splash만 빼고 고리·물건은 그대로 그린다(어느 사건을 먼저 빼는지는 렌더러의 상한 규칙과 함께 메인 세션이 정한다).

## 10. 예산 실측
- 3b2 뒤: 조각 **354장**, 박스 넓이 합 **603,884 단위²**(C2). 3b2가 더한 것은 38장·54,504(먹침 9,984, 붓깃 7,752, 인장 화살 1,792, 뇌침 1,152, 먹꽃 3,024, 핀 우박 2,640, 꼬리 방패 3,840, 보스 사냥침 8,064, 먹 파동 2,048, 유성 붓 8,320, 먹창 1,568, 먹 궤도 4,320). 지시서 계획(35장·46,440)에 균열 터짐 가운데 조각 `crackBurst`(3장·8,064, §12-93)를 더했다. 상한 380장·640,000까지 26장·36,116이 남는다.
- 3b1 뒤: 조각 **316장**, 박스 넓이 합 **549,380 단위²**(C2). 3b1이 더한 것은 36장·26,416(먹침 1,452, 망나니 침 484, 먹꽃 1,120, 가시 테 7,184, 보스 사냥침 3,120, 서리침 7,584, 연막 꼬리 1,344, 묘침 3,644, 수호 고리 484). 상한 380장·640,000까지 64장·90,620이 남고, 3b2(이어지는 효과 35장·46,440 계획)를 넣을 자리가 있다.
- 3a 뒤: 조각 **280장**, 박스 넓이 합 **522,964 단위²**(C2). 3a가 더한 것은 107장·133,036(서리침 8,160, 쌍날 9,600, 핀 우박 3,432, 연막 꼬리 13,440, 묘침 8,640, 추적 인장 7,320, 사냥꾼 표식 1,056, 까마귀 깃 3,320, 먹번개 21,504, 족자 1,728, 인장 22,368, 침묵의 종 484, 먹단지 23,992, 타르 5,416, 유성 붓 1,120, 일식 테 1,456). 상한 380장·640,000 안이고 P2(계획 약 75장·7만)를 넣을 자리가 있다.
- 2차까지: 조각 **173장**, 박스 넓이 합 **389,928 단위²**(C2, 2차). 1차 141장·343,592 → 수정 1회차 137장·341,032(유성 붓 `streak-a/b` 4장 삭제) → 2차 +36장·+48,896(먹단지 8,160, 송이 단지 6,848(mini 1,440 포함), 타르 10,336, 유성 붓 23,552). 지시서 상한 380장·640,000 안이고, 계획 361장·약 61만 중 1·2차 몫이다. 가장 큰 그룹: 유성 붓 65,696, 붓 폭우 59,592, 족자 43,264, 먹번개 35,808.
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

**3차 1회(3a, 각성 기믹 P1)**
- 마지막 상태에서 다시 돌린 것(이름 끝 `d3a2`·`d3a3`): C1 `k10-c1-all-d3a3` ok. C2 `k10-c2-parts-d3a2` `frames=280 ok boxArea=522964 ok badParts=0`(새 줄 44개는 §14.2). C5 `k10-c5-gimmicks-p1-d3a2`(PRI 1, 17칸, 맥락, 1배) ok. C6 `k10-c6-scan-d3a3` `calls=376 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`. C7 `k10-c7-geometry-d3a3` 1~4줄 0건·5줄 ok. C8 `k10-c8-unchanged-d3a2` 고정값 4개 같음, K9 `n4n4y2/2117692`·K11 `bvf9fj/934797` 전후 same, fixed set same, PN keys same, 호출 366. C9 `k10-c9-vectors-d3a2`(지시서 원문 명령) **69줄**: 기믹 사례 7개가 25~31·35~36·63~65줄을 낸다(2차까지 이 일곱 사례는 `layout []` 한 줄씩이었다). 2차 납품서의 75줄은 검수 1차가 더한 사례 셋(11줄)이 든 명령이고, 같은 명령으로 3a는 80줄이다.
- 그림만 보는 검사(앞 회차 렌더, 그 뒤 바뀐 것은 맥락 그림의 동결 층뿐): C10 `k10-c10-contrast-d3a` `fills=24 fail=0`. C12 `k10-c12-scene` ok. C13 `k10-c13-marks-d3a`(2배, 다섯 장) ok. C14 `k10-c14-pairs-gray`·`-deutan`·`-protan` ok(일곱 쌍 모두 점선 청록 테 대 실선 색·먹 테와 무늬로 갈림). C15 `k10-c15-pairs-d3a` ok. 쪼기·층 `k10d3-crow-peck-layers`(3배)·`k10d3-crow-peck-x5`, 동결 맥락 `k10d3-freeze-ctx-x4`, 땅 조각 처음·끝 장과 LOD `k10d3-zone-ends-lod`(2배) ok.
- **보존 해시**(검수 4차 §3 규칙: 이번 납품이 더한 조각·단계·SPEC 키만 빼고 같은 식) `k10-keep-all-d3a3`(마지막 상태): stamps `nvezmq len=535352`, draw `16q45bq len=4419724`, spec `ej7o5i len=13529`, parts `9on297 len=13871` — **2차 수정 1회차 값과 같다.** 뺀 것:
  - 조각: 새 그룹 8개(frostNeedles, twinBlades, pinHail, smokeTail, gravePins, trackingSeals, huntersMarks, crowFeathers) 전부와, 기존 그룹 끝에 붙인 part `/^(pillar|roller|seal8|print8|mark-silence|flame-|scorch\d|string-|jarBroken|mote-|corona-)/`
  - 단계: freeze, spin, caltrop, smoke, grave, triangle, prey, crow, pillar, surge, unroll, eighth, silence, fire, gather, mark, total
  - SPEC: `version`, `zone`, `gimmick`, `overlay`; `fills`의 새 9줄(smokeTail.smoke, inkPots.fire, tarJar.gather, meteorBrush.mark, seventhSeal.eighth, seventhSeal.shadow, trackingSeals.fill, fallingScroll.unroll, eclipseHalo.total); `layout`의 기믹 단계 항목과 새 그룹 id 항목
  - parts: 새 그룹과 위 part를 뺀 목록
- 같은 명령을 아무것도 빼지 않고(검수 4차 원문 그대로) 잰 3a 뒤 값(`k10-keep-all-d3a3`의 raw 네 줄): stamps `1g0md21 len=704665`, draw `1m88g03 len=5467013`, spec `146lftr len=17916`, parts `qe5odc len=22955`. (3a-r1에서 아래 값으로 바뀌었다.)

**3차 1회 수정(3a-r1, 검수 5차 F1·F2)**
- 검수서 명령 `k10-keep-3a-r1`: `stamps raw=mwewtb/715817 | without inkPots/scorch*=15xeu33/676866`, `draw raw=7vot8j/5466897 | without inkLightning/pillar, twinBlades/spin=c3gfpf/5397061`, `spec=146lftr/17916 parts=qe5odc/22955 overlays without scorch=m2dsj8/82965`. 그대로여야 하는 다섯 값이 모두 3a와 같고, raw stamps·raw draw만 바뀌었다.
- 원문 넷(검수 4차 명령 그대로, `k10-keep-all-3a-r1`, 글자 코드로 확인): stamps `mwewtb len=715817`, draw `7vot8j len=5466897`, spec `146lftr len=17916`, parts `qe5odc len=22955`. **3차 2회의 보존 기준이다**(그 회차가 더한 것만 빼고 잰다).
- C1 `k10-c1-all-3a-r1` ok. C2 `k10-c2-parts-3a-r1` `frames=280 ok boxArea=522964 ok badParts=0`, scorch 다섯 줄 그대로. C6 `k10-c6-scan-3a-r1` `calls=376 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`. C7 `k10-c7-geometry-3a-r1` 1~4줄 0건·5줄 ok.
- F1 렌더: 6배 `k10r5f1-scorch-x6`(scorch12~54 두 장씩 + `flame-a/b` 0번 장, 1장 바닥, 위 색·아래 흑백), 1배 `k10r5f1-c13-x1`·`k10r5f1-c13-x1-gray`(C13, 다섯 장), `k10r5f1-fire-ctx-x1`(`draw('inkPots','fire',{context:true})` ch 1·3·5, 위 색·아래 흑백).
- F2 나이 훑기 `k10r5f2-age-sweep-alpha`(가운데 물건의 장과 α를 draw 출력에서 읽음)와 `k10r5f2-age-sweep`(2배 그림): 번개 기둥 a 0.06·0.11 `pillar-start` α1, 0.13·0.15·0.84·0.95·0.98·1.00 loop α1, 1.03·1.14 `pillar-end` α1. 회전 베기 a 0.10 α0.67(처음 조각이 없어 0.15초 페이드), 0.20·0.30·0.345 α1, 0.355·0.40·0.475 `spin-end` α1. 묘비 a 2.6 α1, 2.8 α0.67, 2.95 α0.17.

**3차 2회 1/2(3b1, P2 표식·발 오버레이 + R1 까마귀 + 결정 ② 기록)**
- **보존 해시** `k10-keep-3b1`(검수 4차 `k10-keep-all` 식에서 이번에 더한 것만 뺌, 글자 코드로 확인). 뺀 것: 새 그룹 5개(inkDarts, headsmanDarts, inkBloom, thornHalo, bossbane), 기존 그룹 끝의 part `/^(mark-weak|lost|frost[12]-\d+|bound\d+)$/`, 단계 9개(stain, fear, weak, crack, lost, pollen, frost, bound, thorn), SPEC의 `version`·`overlay.head.parts.{fear, lost, weak, stain}`·`overlay.feet.{frost, bound, thorn}`·`overlay.{crack, pollen}`·`gimmick.eclipseHalo.{layers, reducedFlash}`.
  - spec `146lftr len=17916`, parts `qe5odc len=22955`: 3a-r1과 **같다**.
  - stamps `ege9ps len=716624`(3a-r1 `mwewtb/715817`), draw `1nsdkzn len=5468237`(3a-r1 `7vot8j/5466897`): R1이 기존 조각 `crowFeathers/crow`(6장)를 고쳐서 바뀌었다.
  - 그 조각과 그 조각을 그리는 단계(`crowFeathers/crow`)까지 빼면 stamps `mk33bj len=704087`, draw `rq8mbn len=5442029`다. 3b1을 시작하기 전 3a-r1 코드에서 같은 식으로 잰 값(`k10-keep-3b1-base`)과 **같다**. 그래서 바뀐 기존 출력은 까마귀 조각뿐이다(오버레이 `crow`, C12·C13의 까마귀도 이 조각을 쓴다).
- 원문 넷(아무것도 빼지 않음, `k10-keep-all-3b1`): stamps `ornn3o len=786972`, draw `1mc15ab len=5720453`, spec `p3d9vk len=18629`, parts `1fawmjd len=28554`. 3b2의 보존 기준이다.
- C1 `k10-c1-all-d3b1` ok. C2 `k10-c2-parts-d3b1` `frames=316 ok boxArea=549380 ok badParts=0`(새 줄 27개는 §14.10). C6 `k10-c6-scan-d3b1` `calls=448 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`. C7 `k10-c7-geometry-d3b1` 1~4줄 0건·5줄 ok. C8 `k10-c8-unchanged-d3b1` 고정값 4개 같음, K9 `n4n4y2/2117692`·K11 `bvf9fj/934797` 전후 same, PN keys same, 호출 420. C9 `k10-c9-vectors-d3b1` 69줄(3b1은 layout·paths를 더하지 않는다, `k10-c9-count-d3b1` 글자 해시 `19cnic1` len 8948). C10 `k10-c10-contrast-d3b1` `fills=24 fail=0`(채움을 더하지 않음).
- 그림 검사: C5 PRI 2 `k10-c5-gimmicks-p2-d3b1`(이름표, 9칸)·`k10-c5-gimmicks-p2-blind-gray-d3b1`(BLIND·흑백) ok. C13 `k10-c13-marks-d3b1`·`-gray-d3b1`(다섯 장, P1·P2 오버레이 14키 + 정예·기절·xp·동전 대조 칸, 렌더러 층 순서 feet → 몸 → front·head)·`-gray-d3b1-x4`·`k10-c13-marks-d3b1-x4a`·`-x4b`(4배) ok. C12 `k10-c12-scene-p2`(1배 색)·`-p2-gray-x08`(0.8배 흑백): 적 200에 머리 표식 24·발 오버레이 24·까마귀 12·포자 8마리(상한대로 주인공에게 가까운 적부터) ok. C15 `k10-c15-pairs-d3b1` ok.
- 확대·대조: `k10d3b-marks-x6`(머리 표식·포자 6배), `k10d3b-feet-x4`(발 오버레이와 박스·rect 4배), `k10d3b-feet7-x3`(발 오버레이 일곱 종을 한 적에 층대로, 색·흑백 3배), `k10d3b-feet-ctx-x3`·`k10d3b-c5-cells-x3`(맥락 칸 확대), `k10d3b-crow-before-x8`·`k10d3b-crow-after-x10`(R1 전후), `k10d3b-k9-p2-icons`(K9 대조).

**3차 2회 2/2(3b2, P2 이어지는 효과 + 검수 7차 F1·F2·R2·R4·§5-6)**
- **보존 해시** `k10-keep-3b2`(검수 7차 §3 끝 `k10-keep-3b1-r1`을 넓힌 식, 글자 코드로 확인). 같은 식을 3b1 코드에서 먼저 잰 값(`k10-keep-3b2-base`)과 비교했다.
  - 뺀 것(3b2가 더한 것): 새 그룹 4개(brushQuills, sealArrows, thunderNeedles, tailGuard), 기존 그룹 끝의 part `inkDarts/stainBurst`·`inkBloom/pollenPuff`·`bossbane/crackBurst`·`inkPulse/bump`·`inkLance/fork`·`inkOrbit/deflect-start|travel|end`·`meteorBrush/haste`·`pinHail/caltrop-snap`, 새 단계 15개(dab, topple, leap, rear, bump, echo, split, rewind, amplify, link, branch, resweep, deflect, haste, snap), SPEC의 `version`·`gimmick`의 새 키 20(inkDarts … sunNeedles).
  - 뺀 것(이번에 바뀐 기존 출력): 사건을 더한 단계 넷(stain, fear, crack, pollen)의 draw, 고친 조각 `smokeTail/lost`·`thornHalo/*`(F1·F2)·`inkDarts/mark-stain1`(R2)·`frostNeedles/frost1-12`(R4)·`inkBloom/spore-a|b`(§5-6)와 단계 `lost`·`thorn`, 오버레이에서 그 조각을 쓰는 조합(`lost`, `thorn`, `pollen` 전부, `stain` stack 1, `frost` r 12·stack 1).
  - 결과(3b1 코드 → 3b2 코드): stamps `1h66c1i/754425` → 같음, draw `ob7a83/5582105` → 같음, spec `p3d9vk/18629` → 같음(= 3b1 원문 spec), parts `1fawmjd/28554` → 같음(= 3b1 원문 parts), overlays `1c7d5xg/807605` → 같음.
  - 같은 3b1 코드에서 검수 7차 식(lost·thorn만 뺌)은 stamps `1d1pfw/759026`, draw `i29rer/5642637`, overlays `18o4se4/846311`로 검수서 값과 같았다(측정 식 확인).
- 원문 다섯(아무것도 빼지 않음, `k10-keep-3b2-final`): stamps `l0nap6/878803`, draw `8crhz3/7063925`, spec `128ji9u/22506`, parts `qxfght/31609`, overlays `1umqwpr/1079940`. 다음 회차의 보존 기준이다.
- C1 `k10-c1-all-d3b2` ok. C2 `k10-c2-parts-d3b2` `frames=354 ok boxArea=603884 ok badParts=0`(새 줄 15개는 §14.11). C6 `k10-c6-scan-d3b2` `calls=516 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`. C7 `k10-c7-geometry-d3b2` 1~4줄 0건·5줄 ok. C8 `k10-c8-unchanged-d3b2` 고정값 4개 같음, K9 `n4n4y2/2117692`·K11 `bvf9fj/934797` 전후 same, fixed set same, PN keys same, 호출 488. C9 지시서 명령 `k10-c9-count-d3b2` 69줄·글자 해시 `19cnic1` len 8948(3b1과 같음), 3b2 단계 벡터 `k10-c9b-vectors-d3b2` 29줄(§14.11, 3b2-r1에서 28줄). C10 `k10-c10-contrast-d3b2` `fills=24 fail=0`(채움 줄을 더하지 않음, §12-95).
- 그림 검사: C5 PRI 2 `k10-c5-gimmicks-p2-d3b2`(이름표, 24칸, 1배; 칸 확대 `k10-c5-p2-crop-a~d`)·`k10-c5-gimmicks-p2-blind-gray-d3b2`(BLIND·흑백 0.6배) ok. C13 `k10-c13-marks-d3b2`·`-gray-d3b2`(1배, 14키 + 정예·기절 점·xp·동전)·`-d3b2-x4`(4배) ok. C12 `k10-c12-scene-p2-d3b2`(1배 색)·`-gray-x08-d3b2`(0.8배 흑백) ok. C15 `k10-c15-pairs-d3b2` ok.
- F1·F2 합격 판(검수 7차 판과 같은 짜임): `k10b2-feet7-x1`(발 오버레이 일곱 + 없음 × 1·3·5장 × 색·흑백, 1배)·`k10b2-feet7-zoom-x4`, `k10b2-heads-x1`(머리 표식·포자·균열판 + 정예·기절 점·xp·동전·회복·자석, 1배)·`k10b2-heads-lost-x6`, 헤맴 장별 `k10b2-lost-x8d`(8배, 박스 − 3 표시, 색·흑백).
- 그 밖: 새 조각 `k10b2-new-parts-x3`·`-x3b`·`-x3c`(3·4배, 박스·앵커), 사건 고리 `k10b2-rings-x2`·`k10b2-dabring-x5`, LOD·감소 설정 588호출 `k10b2-variants`(빈 출력 16 = minimal의 꽃가루·헤맴, deco).

**3차 2회 2/2 수정(3b2-r1, 검수 8차 F1)**
- 보존 해시(검수서 명령 `k10-keep-3b2-r1` 그대로):
  - 그대로여야 하는 값: stamps `l0nap6/878803`, parts `qxfght/31609`, overlays `1umqwpr/1079940`, draw without inkBloom/pollen `1skcben/7041757`, spec without gimmick.inkBloom `1ba8cfh/22210` — **모두 같다.**
  - 바뀐 것: draw raw `8crhz3/7063925` → `v80e67/7065693`, spec raw `128ji9u/22506` → `ii86b1/22458`(글자는 `k10-keep-3b2-r1-x2`에서 대·소문자로 확인).
- 원문 다섯(다음 기준): stamps `l0nap6/878803`, draw `v80e67/7065693`, spec `ii86b1/22458`, parts `qxfght/31609`, overlays `1umqwpr/1079940`. version `1.0-d3b2-r1`.
- C1 `k10-c1-all-d3b2-r1` ok. C6 `k10-c6-scan-d3b2-r1` `calls=516 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`. C7 `k10-c7-geometry-d3b2-r1` 1~4줄 0건·5줄 ok.
- 합격 판: `k10b2r1-rings-vs-tele`(1배, 1장, 위 색·아래 흑백, 적 예고 preview·imminent·active r50 옆에 꽃가루 고리 셋 — p 0.35·0.6, 추적자를 두른 p 0.5), 흑백 3배 확대 `k10b2r1-rings-vs-tele-gray-x3`.

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

**3차 1회(3a, 각성 기믹 P1)에서 정하거나 다르게 한 것**

63. **P1만 먼저 납품**: 지시자가 허락한 대로 P1 17종을 `1.0-d3a`로 냈다. P2(§4.1의 P2 전부)와 남은 오버레이는 3차 2회다. 까마귀 깃의 C15는 K9 아이콘(깃)과 기믹 물건(까마귀)이 다른 물건이라 같은 꼴 대조가 아니다(아이콘이 깃이라 바꿀 수 없음).
64. **새 SPEC 키 셋**: 지시서는 `halo.eclipseTotal`·`line.edges`·`line.unroll`처럼 기존 키 아래 이름을 적었지만, 보존 해시(검수 4차 §3)가 '더한 키만 빼기'로 재도록 기존 `ring`·`line`·`halo`·`rim`·`caps`·`marks`·`priority` 값은 건드리지 않고 `SPEC.zone`(땅 조각 8)·`SPEC.gimmick`(삼각 봉인, 펼쳐지는 족자, 여덟째 인장, 개기일식, 거세지는 폭우)·`SPEC.overlay`(오버레이)에 넣었다. 배치는 지시서대로 `SPEC.layout[id][stage]`에 붙였다(C7 3줄이 읽는다).
65. **기믹 단계 이름**: 지시서 §7.2 명령이 쓰는 이름(fire, gather, smoke, caltrop, grave, mark, pillar, spin, total, unroll, eighth)을 썼고, 명령에 없는 것은 freeze, triangle, prey, crow, surge, silence로 정했다.
66. **disc prim의 minGap**: §1.6의 'minGap·r'을 조각 반경 R의 몫으로 읽었다(불먹 0.35, 연막 0.45, 별가루 0.3).
67. **ring prim과 바깥쪽**: 타르 줄은 dr −6에 있어도 +x가 바깥이다(`glayout`). 1차 layout의 ring은 dr < 0이면 안쪽을 보게 돌리지만(서릿발) 그 코드는 건드리지 않았다.
68. **묘비 그림자 rx 21**(지시서 22): 박스 48×36에서 박스 − 3 안에 넣을 수 있는 최대다.
69. **삼각 봉인 인영에 안쪽 네모 없음**: K9 인장은 네모 패이지만, 네모 안의 네모는 한자('回')로 읽혀 종이 네모 + 대각 반쪽 그늘 + (찍힌 장) 청록 매듭으로 그렸다.
70. **송이·마름쇠·연막 시안**: 똑바로 선 핀 셋(둥근 고리 머리)은 작은 사람으로, 먹 짙은 연기 덩이는 바위로 읽혀 고쳤다(핀은 크게 기울이고 깊이를 엇갈림, 연기는 밝은 덩이 + 낮은 먹 심 + 밝은 컬).
71. **펼쳐지는 족자의 띠 = 판정 폭**: 띠는 반폭 w(50)까지의 종이 띠(V4)이고, 띠 머리에 SPEC 축봉(`head` [[ink,6],[p50,3.4]])이 띠 폭 전체를 가로지른다. `roller` 조각(36×24)은 그 가운데의 말린 종이 + 청록 걸이 끈이다(박스가 띠 폭보다 작아서다).
72. **여덟째 인장 고리의 틈**: r120 무거운 고리에 틈 둘(6~10°)을 줬다. 고른 닫힌 고리는 'O'로 읽힌다(§6 피할 것).
73. **개기일식**: 원판 전체(inner 0)를 옅은 먹 α0.2로 덮고 0.62R~R을 먹 α0.22로 한 번 더 덮어 '닫힌 초승'을 그렸다. 굵은 바깥 테, 가장자리의 찢긴 종이 깃(corona), 리본. 검은 원반(검은 태양)이 아니도록 바닥이 비치는 반투명이다.
74. **거세지는 폭우**: 새 그림이 없다. 참고 합성 `surge`는 같은 착탄을 R × 1·1.2·1.4·1.6으로 넷 그리고 자국 s/m/l은 반경 계단이 고른다.
75. **참고 합성의 맥락**(opts.context): `PN.enemies`·`PN.heroKit`을 읽기만 한다(§1.1). 작은 조각(R < 50)은 적을 조각 옆에, 큰 조각은 안에 둔다.
76. **오버레이 층과 까마귀 쪼기**(추가): `overlay(key, {layer})`가 렌더러 층 하나(`feet`·`front`·`head`)만 돌려준다. 동결의 `-back`은 몸 아래, `-front`는 몸 바로 뒤에 그려야 해서다(기본 출력은 전처럼 셋 다). 쪼기는 지시서 §4.3 문장('틱마다 0.12초 동안 머리로 내려오고 peck이 번쩍인다')을 `opts.peck`과 `SPEC.overlay.crow.dive` {crow [7, −5], peck [0, −1]}로 정했다(§14.5). 지시서에 없던 삼각 봉인 터짐 변의 fade(at 0.6)와 펼쳐지는 족자의 fade(at 0.75)는 `SPEC.gimmick`에 적었다(렌더러가 이식할 값은 모두 SPEC에 있다).
77. **땅 조각의 처음·끝 조각은 α 1**(검수 5차 결정 ③ 수용): 지시서 §4.2의 '시작 0.15초·끝 0.3초 α'를 채움·테 밖 조각에 걸고, 가운데 물건의 `zone-start`·`zone-end` 조각(`grave-rise`, `pillar-start`·`-end`, `spin-end`)에는 걸지 않았다. 둘을 겹치면 땅에서 솟는 묘비와 내리치는 기둥의 첫 장이 α 0~0.5로 거의 안 보였다(`k10d3-zone-ends-lod`). reduced LOD에서는 deco 조각(별가루·코로나·바느질)도 prio 2 항목처럼 하나 건너 하나 뺀다.
    - **3a-r1(검수 5차 F2)**: 가운데(center) 물건의 loop·idx 장 α = min(Z.start ? 1 : fadeIn(a), Z.end ? 1 : fadeOut(a)), fadeIn(a) = clamp(a/0.15), fadeOut(a) = clamp((life − a)/0.3). 처음·끝 조각이 있는 쪽의 페이드는 그 조각이 맡아서, 물건이 그 조각 옆에서 옅어졌다 다시 진해지지 않는다. 그래서 번개 기둥(start·end)은 loop 내내 α 1, 회전 베기(end만)는 처음 0.15초만 페이드, 묘비(start만)는 끝 0.3초만 페이드, 마름쇠·깨진 항아리(둘 다 없음)는 α(a) 그대로다. floor·wash·gloss·arcs·disc·ring 조각은 α(a), 테는 α 1이다. SPEC 값은 바꾸지 않았다(규칙은 `zone[id].start`·`end`가 있는지로 정해진다).
78. **`SPEC.version`** `1.0-d2r1` → `1.0-d3a`.

**3차 1회 수정(3a-r1, 검수 5차 F1·F2·R3)에서 정하거나 다르게 한 것**

79. **발밑 불길 덩이(F1)**: 검수서 §3 F1의 덩이 표 그대로이고, 38 등급 가운데 덩이만 x −1 → −2로 옮겼다. 표대로면 덩이 중심 간격이 18·18로 같아서다(지금 17·19). 덩이의 큰 혀 끝에 덩이마다 다른 lean(+0.5, −0.6, +0.4 × H/18)을 더해 끝을 굽혔다. 바닥 타원은 덩이 가운데 (x, −1)에 rx = 덩이 반폭 + 1, ry 1.4로 두어 발 선 위에 앉힌다. 안쪽 청록 혀 폭은 min(0.52w, w − 2.4 − 0.24·|lean|)이다. 0.52w만 쓰면 곁 혀(폭 3.4)의 먹 테가 0.82가 되어 '먹 테 1.2 이상'(지시서 :308)을 밑돈다. 큰 혀(폭 5 이상)는 0.52w와 거의 같다. 종이 불티는 가장 큰 덩이의 큰 혀 끝에서 (+2.1, +1.2)에 r 0.75(먹 0.45)로 두고, 박스 − 3과 발 rect 안일 때만 그린다(19~54 등급 모두 들어감, 12 등급은 없음).
80. **`SPEC.version`** `1.0-d3a` → `1.0-d3a-r1`. SPEC의 다른 값은 그대로다(`spec=146lftr/17916`).

**3차 2회 1/2(3b1, P2 표식·발 오버레이)에서 정하거나 다르게 한 것**

81. **둘로 나눠 납품**: 지시자가 허락한 대로 표식·발 오버레이를 먼저(`1.0-d3b1`), 이어지는 효과를 다음(`1.0-d3b2`)에 낸다. 같은 기믹의 두 부분(먹 얼룩 표식 + 터짐, 공포 표식 + 고리, 균열판 + 균열 터짐, 꽃가루 포자 + 고리·퍼짐)은 한 단계(stain, fear, crack, pollen)에 모으고, 3b2에서 그 단계의 참고 합성에 사건을 더한다(그때 그 네 단계의 draw 해시가 바뀐다).
82. **발 오버레이 셋의 층 = front**: 지시서 §4.3 표는 서리 수 1·2와 가시를 `feet`(몸 아래) 층에 두었다. 그 층에서는 적의 발과 몸이 거의 다 가렸다(`k10d3b-feet-ctx-x3` 앞 렌더, 1배에서 보이지 않음). 박스·rect를 넓히지 않고 보이게 하려고 묶임과 같이 `front`(그 몸 바로 뒤)에 두고, 키를 몸 높이의 25% 이하로 두었다. 가시는 발 선 앞 땅과 옆에 꽂았다(발 뒤에 둔 가시는 앞 층에서도 앞뒤가 어긋난다).
83. **오버레이 키**: `frost`(stack 1~2 = 서리 1·2), `stain`(1~3), `crack`(1~5)은 한 키에 `opts.stack`을 받는다. `SPEC.priority.feet`의 `frost1`·`frost2`는 `frost`의 stack 1·2다. 균열판은 `priority.heads`에 넣지 않고 늘 그린다(지시서 §4.5). 다른 머리 표식과 함께면 `SPEC.overlay.crack.beside`(26)만큼 오른쪽에 둔다.
84. **꽃가루 포자**: 둘을 `SPEC.overlay.pollen.at`의 두 자리에서 cycle 1초로 띄운다(`marks.spores` rise 16·drift 6, 반 주기 엇갈림). 포자는 먹 테를 두른 청록 알갱이 + allyG 점이다. 종이 알갱이 안에 먹 점을 둔 첫 시안은 눈알로 읽혔고, 꼬리를 단 시안은 숫자 9로 읽혀 꼬리를 뺐다. 3px라 '먹 ≥ 2 + 청록 + 심'은 줄여 먹 1 + 청록 + allyG다.
85. **공포 땀방울 `rotate: 'face'`**: 머리 뒤쪽에 비켜 둔 방울을 렌더러가 적이 보는 쪽에 맞춰 좌우 반전한다(`opts.facing`). 정예의 흡혈 방울(채운 자수정)과는 종이 + 먹 테 + 청록 반짝 + 기울기로 갈린다.
86. **약화 매듭**: 수호 고리의 꼰 줄 한 토막을 가운데에서 한 번 묶고 두 끝을 길이가 다르게 늘어뜨렸다(리본 나비가 아니게). 청록은 매듭을 꿰는 바느질 한 땀이다.
87. **얼룩**: 얼룩 1·2·3 모두 종이 테 1.2 + 먹 바깥 선. 청록은 젖은 먹 위의 반짝 호(먹 위 청록 + allyG)다(지시서 표에는 청록이 없지만 모든 오버레이에 청록이 있어야 한다, C6 nocyan).
88. **헤맴**: 연기 컬 둘에 각각 작은 청록 리본 끝을 달았다(연막 꼬리의 K9 청록 리본). 컬 둘이 같은 꼴이라 4장이 반 바퀴로 이어진다.
89. **R1 까마귀**(검수 5차): 든 장·수평 장(0·1·2·4·5)의 날개 끝을 홈 셋으로 갈라 첫째 깃 넷을 벌리고, 가장 긴 둘에만 종이 깃대 획을 둔다(넷 모두 두면 빗살로 읽혔다, `k10d3b-crow-after-x10` 이전 시안). 내린 장(3)은 닫힌 날개 그대로다. 부리는 밑동 1.6 → 2.4, 길이 2.2 → 3.2로 굵고 길게 했다. 눈 없음, 6장, 박스 26×18, 청록(다리 실) 그대로다.
90. **결정 ②의 SPEC 기록**: `SPEC.gimmick.eclipseHalo.layers` {wash: ground, band: ground, outer·inset·corona·ribbon: ally}, `reducedFlash` 0.5(원판·띠 α에 곱함). 참고 합성은 `opts.reducedFlash`로 같은 규칙을 그린다(기본 출력 그대로).
91. **`SPEC.version`** `1.0-d3a-r1` → `1.0-d3b1`.

**3차 2회 2/2(3b2, P2 이어지는 효과 + 검수 7차 수정)에서 정하거나 다르게 한 것**

92. **SPEC 자리**: 지시서의 `ring.stainBurst`·`ring.dabBurst`·`ring.crackBurst`·`ring.fear`·`ring.pollen`·`ring.thunderclapEcho`·`line.leap`·`line.frostLink` 같은 이름 대신, 모두 `SPEC.gimmick[id]`의 새 키에 넣었다(검수 7차 §5-1). 대응: ring.stainBurst = `gimmick.inkDarts.ring`, ring.dabBurst = `gimmick.brushQuills.ring`, ring.crackBurst = `gimmick.bossbane.ring`(+ `cracks`), ring.fear = `gimmick.headsmanDarts.ring`, ring.pollen = `gimmick.inkBloom.ring`, ring.thunderclapEcho = `gimmick.thunderclap.ring`, line.leap = `gimmick.thunderNeedles.line`, line.frostLink = `gimmick.frostChainlet.line`. 배치도 `SPEC.layout`에 더하지 않고 같은 키(`burst`, `dab`, `hit`, `event`, `fork`, `start`·`travel`·`end`, `part`)에 적었다.
93. **균열 터짐 가운데 조각 `crackBurst`(추가)**: 지시서 §4.1·§4.4 본문은 세 터짐 모두 '가운데 조각 + SPEC 고리'인데 §4.4 조각 표에는 균열 터짐 조각이 없다. 얼룩 터짐과 같은 문법으로 3장(56×48, 앵커 28,30, prog 0.3, center·ally·info)을 더했다(+3장·8,064).
94. **사건 고리**: 검수 7차 §5-3(중심선 R, 고른 닫힌 고리 금지, 청록 ≤ 1/3)을 지시서 값보다 앞세웠다.
    - ~~꽃가루: 먹 점선은 호 전체, 청록은 core 60~100°에만~~ → **3b2-r1에서 지시서 값으로 되돌림**(§12-119).
    - 메아리: 지시서 [[ink300,3.4],[ally,1.6]] → 호 전체 [[ink300,3.4],[p300,1.2]], 청록 층 [[ink300,3.4],[ally,1.6]]은 core 80~110°에만, 틈 둘(10~16°), 갈래 없음, α0.75.
    - 얼룩 터짐·늦은 붓자국·균열 터짐: 층이 정해지지 않아 stroke [[ink,3.2],[p50,1.2]]·band ink 2.4~5·stroke [[ink,3.4],[p50,1.6]]으로 했다. 청록은 core 60~100°·40~70°·70~110°다(모두 120° 이하).
    - 공포: 지시서대로 청록이 없다. p50 3 + 먹 테 1.2, 안쪽 찢김, 찢어진 곳 둘(5~9°), 끝은 찢긴 혀. 적 예고의 점선 테·물방울 붓 머리가 없다.
    - 사건 고리에는 각성 가는 선(R − 6)과 core × 1.5를 쓰지 않는다. 기믹은 각성에서만 일어나므로 각성 표지가 아니라 사건 문법이다.
95. **C10 줄을 더하지 않음(판단 요청)**: 새 SPEC은 gimmick·overlay 아래에만 넣으므로 `SPEC.fills`를 늘리지 않았다. 되쓸기 띠는 넓은 붓 띠(`wideBrush.band` p50 α0.45)에 0.65를 곱한 α0.29라 이미 있는 줄보다 어둡다. 공포 고리의 종이 띠(폭 3, α0.85, 0.45초)는 침묵의 종 고리의 종이 심(2.6)과 같은 선으로 보아 면으로 세지 않았다(§7.9). 면으로 센다면 C10 기준(0.3초를 넘는 채움 Y ≤ 0.62)을 넘으므로 α나 폭을 바꿔야 한다.
96. **해바늘**: 그림·단계가 없다. 규칙만 `SPEC.gimmick.sunNeedles.scale` {by 'radius', over 'size', max 1.6}에 적었다(렌더러가 탄 조각을 shot.radius / geo.size배, 1.6까지 키움 — '조각을 늘이지 않는다'의 유일한 예외, 지시서 §4.1). `META.gimmicks`에 넣지 않아 C5 칸이 없다.
97. **가지창 `fork`의 place = 'point'**(지시서 'origin'): C7 2줄은 'origin' 조각이 앵커에서 26 안에 칠하면 실패로 센다(결 발밑 규칙). `fork`는 결이 아니라 창 끝(가지의 시작)에 놓이므로 'point'로 했다. rotate는 지시서대로 'beam'이다.
98. **window**: 사건 조각은 `event`, 대기 `dab`은 `pending`(seconds 없음, 자료의 대기), 도약 `leapHit`은 `chain`(seconds 없음), 되받은 탄은 `vel`, 결 가속은 `status`다.
99. **되쓸기**: '같은 넓은 붓 띠를 α0.65로, 붓 방향을 뒤집어'를 같은 빔 축에서 머리가 먼 끝(L)에서 결 쪽(26)으로 돌아오는 띠로 그렸다(띠는 [x1, L]). 붓 조각은 앵커를 축으로 좌우 반전(`head: 'mirror'`)하고, 띠·테·비백·앞선·붓 모두 α × 0.65다. 가장자리·비백은 seed + 500이다(첫 쓸기와 다르게).
100. **가지창**: 창 끝(x = L)에서 ±35°, 길이 0.4L. 가지는 창의 blade 문법(thrust 0.18, retract 0.7 → 0.6L, 창날 × 0.85)에서 술을 뺀 것이다. 판정 캡슐(p50 α0.16 + 먹 1.2)은 가지 시작(0)에서 곧게 시작한다(결이 아니므로 26을 비우지 않는다). 가지는 창이 끝에 닿은 뒤(thrust × 수명 = 0.05초) 시작하고, `fork`는 그때부터 0.2초다.
101. **되감김**: sag −0.16은 구간마다 원래 실과 반대쪽으로 휜 곡선이다. 그 곡선을 결 쪽 26에서 자른 뒤 거꾸로(꼬리 → 머리) 그려 나간다. 층은 지시서 [[ink,2.6],[ally,1.4],[allyG,0.5]]. 닿은 적에는 평상 `spark`(덧타격이라 작은 쪽)를 둔다.
102. **증폭**: 구간 i(0 = 결 → 첫 적)의 두 가닥 층 굵기 × (1 + 0.15i), 진폭 × (1 + 0.1i), 꺾음 seed = flicker seed + 31i. 점 조각은 그 점에서 끝나는 구간 i ≥ 3이면 `gust-b`, 아니면 `gust-a`다(1차의 J(600) 고르기 대신).
103. **묶인 사슬**: 구성원(결 없음)을 차례로 잇는 links(서리 사슬 문법, pitch 20, 처음 비움 0). α0.45, 공유 피해 뒤 0.18초(`opts.share`)는 α 1, 수명 2초의 끝 15%(fade at 0.85)에 사라진다. minimal은 꺾은 줄 하나다.
104. **감전 도약 kink**: 지시서 §1.5의 'kink | seg, push'를 n = clamp(round(L/24), 3, 8) 구간, 꼭짓점 자리 흔들림 0.5/n, 옆으로 3~8을 번갈아 미는 것으로 정했다. 층은 먹번개 고리와 같은 [[ink,3.4],[ally,1.8],[allyG,0.6]], 깜빡임 seed [3,4](12fps), 수명 0.2초의 앞 35% 동안 그려 나가고 닿은 점에 `leapHit`.
105. **갈라짐**: 새 조각이 없다. 작은 단지는 `mini`(4장 loop)로 lobMini를 0.35초 날고, 터지면 송이 단지 `burst`와 송이 단지 고리를 0.6R로 그린다(평상: 각성 가는 선 없음). 참고 합성은 ±60을 x축 위에 둔다(게임은 자료의 자리).
106. **결 가속**: 칠한 범위 y −32.7 ~ −12(지시서 −34 ~ −11 안), 얼굴 구역 밖, 발밑 링 밖(C7 2줄). 띠 둘은 결 발 뒤(−x)에서 뒤·위로 감아 오른다. 뒤로 말려 돌아오는 띠 둘은 4배에서 겹친 'C'·초승달로, 가운데가 두꺼운 띠는 잎 둘로 읽혀 굵기 ≤ 2.4의 길쭉한 띠(길이 다름, 엇갈리지 않음)로 바꿨다.
107. **되받은 탄의 소용돌이**: 머리 가운데의 동심 소용돌이는 흰 타원 속 검은 고리라 '눈'으로, 머리 뒤에서 말리는 고리는 'G'로 읽혔다. 머리 위쪽에서 들어와 뒤로 휘어 꼬리 가운데로 빠지는 한 획(소용돌이치는 혜성 심)으로 그렸다. 머리는 각진 파편(타원이 아님)이다.
108. **늦은 붓자국 `dab`**: 끝에 꼬리와 점이 있는 납작한 먹 덩이는 '눈 달린 물고기'로 읽혀, 들쭉날쭉한 먹 웅덩이 + 펜촉의 청록 획(먹 밑 + 청록 + allyG)으로 그렸다. K9의 청록 요소는 펜촉 끝 점이지만, 땅 위의 작은 청록 점은 눈이나 결 발밑 링으로 읽힐 수 있어 획으로 했다.
109. **얼룩 터짐**: 팔·방울까지 종이 테를 두르면 분자 모형(공과 막대)으로 읽혀, 종이 테는 얼룩 몸(0번 장)과 흩어진 조각(1번 장)에만 둔다.
110. **도미노 `topple`**: K9 인장 머리(종이 덩이 + 아래 먹 인면 띠 + 청록 테)가 넘어진다. 처음 그린 꼭지는 병으로 읽혀 뺐다.
111. **밀쳐 부딪힘 `bump`**: 지시서 표에 회전이 없어 벽 쪽을 모른다. 둥근 충격(먹 덩이 + 찢긴 종이 섬광)에 먹 파동의 검은 띠 조각과 청록 앞선을 왼쪽 아래에 둔다(위에 둔 호는 눈썹으로 읽혔다).
112. **배후 응징 `rearHit`**: 두 배 피해를 베기 둘로 그렸다(1번 장). 둘은 나란히 엇갈리고 겹치지 않는다(✕ 아님). 청록은 rear 무기의 목도리 색으로, 단검 손잡이 끝의 짧은 리본이다.
113. **헤맴(검수 7차 F1)**: 층은 처방 그대로다. 크기는 처방 k·1.7·궤도 5 대신 k·1.6·궤도 4.7('안팎')이다. 컬의 열린 끝을 늘 바깥으로 두면 1.7·5에서 x가 박스 − 3(±9)을 0.5 넘었다. 4장은 반 바퀴 돌기(0·45·90·135°) 대신, 쌍이 0 → 13° → 25° → 13°로 흔들리며 컬마다 돈다. 반 바퀴 돌기는 90° 장에서 두 컬이 앞뒤로 겹쳐 한 덩이가 됐다(높이 14 박스라 위아래로 벌릴 수 없음). 43°까지 흔들면 맞닿았다(`k10b2-lost-x8`, `-x8b`). 4장, loop 8, deco, 박스, 앵커, 리본은 그대로다.
114. **가시(검수 7차 F2)**: 갈고리 방향은 3b1 그대로다(옆 가시 둘은 안쪽, 앞 가시는 오른쪽으로 휨). 검수서의 '둘은 바깥, 하나는 안쪽'과 다르게 읽힐 수 있어 적는다. 청록 심은 앞 가시(가장 큰 것)로 옮겼다(1배에서 보이게). 종이 띠는 볼록한 가장자리를 따라 밑동 0.25·b에서 끝 0으로 가늘어진다.
115. **포자(검수 7차 §5-6)**: 반지름 2로 키웠다(박스 10×14 − 3 안의 최대, 먹 테까지 지름 약 5px). 박스는 그대로다. 몸은 allyG(0.62배)를 청록 테가 두르고, 종이 반짝은 왼쪽 위로 비켰다. 꼬리 없음.
116. **3b1 단계의 참고 합성(context)**: 사건이 있는 네 단계는 몸 → 사건 → 머리 표식 순으로 그린다(사건이 머리 표식을 덮지 않게, `ctxEnemy`의 `heads` 인자). 터지는 적에는 표식을 걸지 않는다(터지면 초기화된다).
117. **별똥 자국의 'inside' 테**: `drawZone`이 내부 옵션 `inside`를 받아 결 가속 참고 합성에서 `rim.pad.inside`를 그린다. 기존 호출의 출력은 그대로다(보존 해시).
118. **`SPEC.version`** `1.0-d3b1` → `1.0-d3b2`.

**3차 2회 2/2 수정(3b2-r1, 검수 8차 F1)에서 정하거나 다르게 한 것**

119. **꽃가루 고리를 먹 + 청록 점선 샌드위치로 되돌림**(검수 8차 결정 7·F1): 3b2는 검수 7차 §5-3('청록 1/3 이하')을 꽃가루 고리에도 걸어 고리 대부분을 맨 먹 점선으로 그렸다. r 50의 맨 먹 점선 원이 0.5초마다 적 둘레에 생기면 적 예고의 붓 점선 테(지시서 §1.7 `:317`)로 읽혀 '적 범위 공격 준비'로 오독될 수 있다. 점선 고리의 아군 문법은 `rim.ally`와 같은 먹 + 청록 샌드위치다. 그래서 `SPEC.gimmick.inkBloom.ring`을 지시서 `:909` 값(dashed, [[ink,1.6],[ally,1]], dash [4,5], pad 0.6)으로 돌리고 `core`를 지웠다. 틈 둘(16~28°), grow 0.6 → 1 / 0.25초, 수명 0.45, fade 0.6은 그대로다. '청록 1/3 이하'는 실선 사건 고리(얼룩·늦은 붓자국·균열 터짐·메아리)에만 남는다. 조각은 바뀌지 않았다.
120. **`SPEC.version`** `1.0-d3b2` → `1.0-d3b2-r1`.

## 13. 사람 원화가에게 남길 것 (바이블 §15)

- 물건의 붓 외곽·블랙 스팟·비백: 번개와 먹구름, 붓 획(붓털 비백), 족자, 둥근 도장, 손, 손종, 백자 조각, 타르 항아리와 줄, 큰 붓, 먹통, 술, 리본, 매듭.
- 서리 결정·얼음판·찢긴 종이 획·먹 폭발 팔·타르 윤기의 붓 질감(절차형으로 낼 수 없다).
- 문화 검토: 손뼉(맞닿는 장이 합장으로 보이지 않게 — 지금은 32° 기울임 + 어긋남 + 섬광), 손종(범종이 아니게), 도장·인영(글자·인주 없음, 인영 안 올가미 매듭이 글자로 읽히지 않게), 족자(글자 없음, 산 능선이 'M'으로 읽히지 않게), 십자 획의 십자 모양(Q9).
- 수정 1회차에 더한 것: 유성 붓 꼬리 갈래의 마른 붓 끝과 짓눌린 붓털, 쓰러진 항아리의 입·굽·깨진 어깨 단면, 인영의 찍힘 질감(라틴 글자 같은 말림을 피함), 서리 결정 각기둥의 면, 먹단지 사기 조각의 휜 단면, splash 가시의 붓 질감(절차형 쐐기다).
- 수정 2회차에 더한 것: 인영 끈(a·b)의 찍힘 질감과 끊김, 공 꼭지의 옻칠 광택.
- 2차에 더한 것: 비행 단지의 먹 흘림과 뚜껑 붓 외곽, 송이 끈 리본의 펄럭임, 타르 줄의 윤기와 늘어짐, 유성 붓 붓털 머리(눌린 갈래)와 비행 꼬리의 마른 갈래, 인영 c의 찍힘 질감. 게임 크기(단지 약 13~18px, 송이 단지 약 7~13px)의 1배 픽셀 다듬기.
- 3a에 더한 것: 서리 결정·얼음판의 면, 회전 날의 붓 외곽, 마름쇠 핀(1배 13px에서 작은 사람으로 읽히지 않게), 연기 덩이의 붓 질감과 컬, 묘비 핀, 네모 인영의 찍힘, 표식 셋(손종·패·까마귀 16~18px의 1배 픽셀), 번개 기둥, 말린 족자, 큰 인장과 큰 인영, 먹 불길과 불먹 발밑 불길, 타르 줄, 깨진 항아리, 별가루, 코로나 깃. 문화 검토: 묘비(십자·비문 없음 — 둥근 머리만), 까마귀(불길한 상징이 아니게), 손종(범종 아님).
- 3a-r1에 더한 것: 발밑 불길 덩이(12 등급은 덩이 하나, 1배 약 10px)의 1배 픽셀 다듬기와 혀 끝의 붓 질감.
- 3b1에 더한 것: 머리 표식 넷(땀방울, 꼰 줄 매듭, 얼룩 1~3, 연기 컬)과 보스 균열판 1~5의 16~18px 1배 픽셀 다듬기와 찢긴 종이 가장자리, 포자(3px), 서리 결정의 면, 가시의 휜 꼴과 종이 면, 묶임 바느질의 들고 나는 땀과 작은 묘침, 까마귀 첫째 깃의 마른 붓 끝. 1배에서 작은 등급(12)의 가시·서리 수는 몇 px라 사람 다듬기가 필요하다. 문화 검토: 땀방울(만화 기호가 우스꽝스럽지 않게), 가시(가시관 아님 — 발치 땅에만).
- 3b2에 더한 것: 사건 조각의 붓 질감(먹 튐·찢긴 종이 섬광·종이 파편), 늦은 붓자국 웅덩이와 펜 튐, 깃 날개 조각, 인장 덩이, 단검과 둥근 날밑, 균열판 파편, 되받은 탄의 파편 머리·꼬리·소용돌이 획, 결 가속 띠, 부러진 핀 반쪽. 1배 픽셀 다듬기: `leapHit`(24 박스), 꽃가루 알갱이, 헤맴 컬(약 8px), 12 등급 가시(앞 가시 6.4)·서리 수. 사건 고리의 붓 질감(공포 고리의 찢긴 종이 띠, 꽃가루 점선)과 균열선의 종이 결. 검수 7차 R3(약화 매듭이 자석 말굽 ∩와 갈리게 줄이 한 번 교차하는 매듭)과 균열판 1~2의 첫 금(봉투 ✉로 읽히지 않게 모서리 대각선보다 들쭉날쭉하게)은 사람 몫으로 남겼다. 문화 검토: 배후 응징(베기는 종이 획, 피·절단면 없음), 도미노 인장(글자 없음).
- (1차의 '유성 붓 비백 줄기' 항목은 수정 1회차 M2로 줄기를 없애 지웠다.)
- 게임 크기(1배)의 픽셀 다듬기: 머리 위 손(~30px)과 손종(~40px), 불꽃·바람 획(≤ 24px), 술·먹통(뒤쪽 26~56).
- 정식 판독 시험(n ≥ 8)은 하지 않았다.

## 14. 각성 기믹 P1 (3차 1회, 3a)

지시서 §4의 P1 17종이다. §12(땅 조각·침묵·불먹 정정)와 §15-3(송이 단지 각성 비행 조각 없음)을 따른다. 단계 이름은 `META[id].gimmicks[0].stage`이고, 참고 합성은 `draw(id, stage, opts)`, 배치는 `layout`, 정의 점은 `paths`다. P2는 3차 2회다.

### 14.1 단계와 자료

| 무기 | 단계 | 종류 | 자료(RenderWorld) | 크기·판정 | 그리는 것 |
|---|---|---|---|---|---|
| frostNeedles | `freeze` | 발 오버레이 | `awk.freeze`(새) | 적 r 등급 12·19·28 | `freeze-back-<r>`(feet) + `freeze-front-<r>`(front) |
| twinBlades | `spin` | 땅 조각 | zones: r 60, 0.5초 | 테 `rim.ally` r 60 | `spin`, 끝 0.15초는 `spin-end`. 0.75R에 도는 종이 호 둘(SPEC) |
| pinHail | `caltrop` | 땅 조각 | zones: r 18, 1.5초, 상한 24 | 테·채움 없음 | `caltrop-a/b/c` 하나(J(1950)). 그림자 rx 18은 조각 안에 있다 |
| smokeTail | `smoke` | 땅 조각 | zones: r 70, 2초, 상한 12 | `rim.ally` | wash ink300 α0.16 + `puff-a/b/c` 2~4(disc) |
| gravePins | `grave` | 땅 조각(stand) | zones: r 22, 3초, 상한 24 | 테 없음 | 처음 0.15초 `grave-rise`, 그 뒤 `grave-a/b/c` 하나(J(1951)). 그림자 rx 21은 조각 안에 있다 |
| trackingSeals | `triangle` | 대기 + 사건 | 빔 셋(폭 2 → 8)과 세 적 자리 | 변 = 빔 | 대기 0.6초: 바느질 변 + `sealCorner`. 터짐 0.28초: 굵은 변 + 채움 0.1초 + `sealStrike` |
| huntersMarks | `prey` | 머리 표식 | `awk.prey` | — | `mark-prey` |
| crowFeathers | `crow` | 머리 위 까마귀 | `awk.crow`·`crowAt` | — | `crow`(맴돌기) + `peck`(쪼기) |
| inkLightning | `pillar` | 땅 조각(stand) | zones: r 40, 1.2초 | `rim.ally` r 40 | `pillar-start` 0.12초 → `pillar` loop → `pillar-end` 0.2초 |
| brushDownpour | `surge` | 새 그림 없음 | `area/blast` 반경(커진다) | 고리 R = 사건 반경 | 주 단계 `impact` 그대로. 자국 s/m/l은 반경 계단(52·72)이 고른다 |
| fallingScroll | `unroll` | 빔 | BeamEffect(skillId fallingScroll): 길이 240, 폭 50 | 띠 반폭 w = 판정 | 종이 띠 + 산 능선 + 머리 축봉(SPEC) + `roller` |
| seventhSeal | `eighth` | 대기 + 사건 | 새 `pending` 0.3초 → `area/blast` echo r 120 | 고리 R 120 | 대기: 그림자 타원 + 일곱 인영에서 오는 바느질. 터짐: `print8` + wash + 무거운 고리 + `seal8` |
| silenceBell | `silence` | 머리 표식 | `awk.silence` | — | `mark-silence`(아군 청록 실, 자수정 없음) |
| inkPots | `fire` | 땅 조각 + 발 | zones: 0.6 × 무기 반경, 2초 | `rim.ally` | wash ink α0.24 + `flame-a/b` 2~5(disc). 안에 선 적의 발에 `scorch<r>`(산호 물듦 대신 K10 먹 불길, 청록 심) |
| tarJar | `gather` | 땅 조각 | zones: 1 × 무기 반경, 1.5초 | `rim.ally` | wash ink700 α0.32 + 윤기 호 둘 + `jarBroken` + `string-a/b` 5~7(ring, dr −6) |
| meteorBrush | `mark` | 땅 조각 | zones: 0.6 × 무기 반경, 4초 | `rim.pad` 실선(결이 안에 있으면 `inside`) | 바닥 `crater` + wash p50 α0.14 + `mote-a/b` 3~6(disc) |
| eclipseHalo | `total` | halo 사건 | skillMark heavy(넷째 휘두름마다) | 바깥 R, inner 0 | 원판 먹 α0.2 + 0.62R~R 먹 α0.22 + 바깥 테 + 각성 가는 선 + `corona-a/b` 7~9 + 리본 |

- 땅 조각 반경은 `SPEC.zone[id]`의 `r`(고정) 또는 `area` × 무기 반경(레벨·각성 반영)이다. 수명 `life`는 `src/content/data/awakenings.ts`에서 옮긴 참고값이다. 렌더러는 자료(zones)의 반경과 수명을 쓴다.
- 땅 조각에는 가운데 기호 원판과 allyGlow 채움이 없다. wash는 모두 Y ≤ 0.62다(C10).

### 14.2 조각 (3a: 44종 107장, 박스 넓이 133,036)

C2 줄 그대로다(새 그룹 8개는 목록 앞, 기존 그룹에 붙인 것은 그 그룹 끝).

```
frostNeedles/freeze-back-12 f1 idx box36x20 a18,10 feet none feet info r12 w:status
frostNeedles/freeze-back-19 f1 idx box48x24 a24,12 feet none feet info r19 w:status
frostNeedles/freeze-back-28 f1 idx box64x30 a32,15 feet none feet info r28 w:status
frostNeedles/freeze-front-12 f1 idx box32x24 a16,20 feet none front info r12 w:status
frostNeedles/freeze-front-19 f1 idx box44x30 a22,25 feet none front info r19 w:status
frostNeedles/freeze-front-28 f1 idx box60x38 a30,32 feet none front info r28 w:status
twinBlades/spin f4 loop@16 still0 box40x40 a20,20 center none ally info w:zone
twinBlades/spin-end f2 prog 0.15s box40x40 a20,20 center none ally info w:zone-end
pinHail/caltrop-a f1 idx box44x26 a22,17 center none ground info w:variant
pinHail/caltrop-b f1 idx box44x26 a22,17 center none ground info w:variant
pinHail/caltrop-c f1 idx box44x26 a22,17 center none ground info w:variant
smokeTail/puff-a f4 loop@6 still0 box40x28 a20,24 disc none ground info w:zone
smokeTail/puff-b f4 loop@6 still0 box40x28 a20,24 disc none ground info w:zone
smokeTail/puff-c f4 loop@6 still0 box40x28 a20,24 disc none ground info w:zone
gravePins/grave-a f1 idx box48x36 a24,27 center none stand info w:variant
gravePins/grave-b f1 idx box48x36 a24,27 center none stand info w:variant
gravePins/grave-c f1 idx box48x36 a24,27 center none stand info w:variant
gravePins/grave-rise f2 prog 0.15s box48x36 a24,27 center none stand info w:zone-start
trackingSeals/sealCorner f3 prog 0.6s box26x20 a13,10 point none ally info w:pending
trackingSeals/sealStrike f3 prog 0.28s box48x40 a24,22 center none ally info w:event
huntersMarks/mark-prey f2 loop@4 still0 box22x24 a11,22 over none head info w:status
crowFeathers/crow f6 loop@12 still0 box26x18 a13,9 orbit face head info w:status
crowFeathers/peck f2 prog 0.12s box16x16 a8,8 orbit none head deco w:event
inkLightning/pillar-start f2 prog 0.12s box32x84 a16,78 center none stand info w:zone-start
inkLightning/pillar f4 loop@12 still0 box32x84 a16,78 center none stand info w:zone
inkLightning/pillar-end f2 prog 0.2s box32x84 a16,78 center none stand info w:zone-end
fallingScroll/roller f2 loop@12 still0 box36x24 a18,12 tip beam ally info w:beam
seventhSeal/seal8 f4 prog 0.45s box60x80 a30,74 center none ally info flash w:mark
seventhSeal/print8 f1 idx 1.2s box88x36 a44,18 center none ground deco w:decal
silenceBell/mark-silence f1 idx box22x22 a11,20 over none head info w:status
inkPots/flame-a f6 loop@12 still0 box22x28 a11,25 disc none ground info w:zone
inkPots/flame-b f6 loop@12 still0 box22x28 a11,25 disc none ground info w:zone
inkPots/scorch12 f2 loop@8 still0 box30x18 a15,14 feet none front info r12 w:status
inkPots/scorch19 f2 loop@8 still0 box40x22 a20,17 feet none front info r19 w:status
inkPots/scorch28 f2 loop@8 still0 box56x26 a28,21 feet none front info r28 w:status
inkPots/scorch38 f2 loop@8 still0 box72x30 a36,25 feet none front info r38 w:status
inkPots/scorch54 f2 loop@8 still0 box96x34 a48,29 feet none front info r54 w:status
tarJar/string-a f4 loop@8 still1 box40x14 a36,7 ring radial ground info w:zone
tarJar/string-b f4 loop@8 still1 box40x14 a36,7 ring radial ground info w:zone
tarJar/jarBroken f1 idx box36x26 a18,18 center none ground info w:variant
meteorBrush/mote-a f4 cycle 1.2s box10x14 a5,12 disc none ally deco w:zone
meteorBrush/mote-b f4 cycle 1.2s box10x14 a5,12 disc none ally deco w:zone
eclipseHalo/corona-a f2 prog 0.3s box26x14 a3,7 ring radial ally deco w:mark
eclipseHalo/corona-b f2 prog 0.3s box26x14 a3,7 ring radial ally deco w:mark
```

- 새 창(`window`): `zone`(땅 조각 수명 동안), `zone-start`·`zone-end`(가운데 물건의 처음·끝 seconds), `status`(적 상태가 있는 동안), `event`(사건 한 번, seconds), `pending`(대기, seconds = 대기 길이), `variant`(고르는 변형, 그 조각의 수명). 새 drive `cycle`: 장 = ⌊frac(t/seconds + phase)·frames⌋(1.2초에 한 번 오르고 사라짐).
- 새 place: `disc`(땅 조각 안 흩기), `over`(머리 위 (0, top − 12)), `orbit`(머리 위 맴돌기), `feet`(적 발). 새 rotate `face`: 까마귀는 가는 쪽을 보게 좌우 반전만 한다(돌리지 않는다).

| group | 그림 | 청록 |
|---|---|---|
| 서리침 | `freeze-back`: 바닥에 누운 들쭉날쭉한 종이 얼음판(먹 테 1.2, p300 면 하나)과 그 뒤로 짧은 결정 넷(−114~−64°). `freeze-front`: 앞 서릿발 두 무더기(결정 여섯, −118~−64°, 높이 0.5~0.9H, H = 13·17·23 ≈ 몸 높이의 40%)와 얼음 조각 셋. 서리 고리와 같은 각기둥 결정(먹 테를 종이 아래에 깖). 눈을 가리지 않는다. 박스는 `SPEC.marks.rects` 안(C7 2줄) | 가장 높은 결정의 심 |
| 쌍날 | `spin`: 손잡이 없는 종이 초승 날 둘(r 15, 110° 호, 두께 4.6)이 마주 보고, 날 뒤에 ink300 바람 호. 장마다 45°라 16fps 4장이 초당 2바퀴다(한 쌍은 180°마다 같다). `spin-end`: 0 = p300 날(느려짐), 1 = 납작하게 쓰러짐 α0.7 | 날 심 [ink 1.6, ally 0.8] |
| 핀 우박 | `caltrop-a/b/c`: K9 아이콘의 단검 핀(마름모 종이 날, 속 빈 고리 손잡이 r 1.7) 2~3개가 끝을 땅에 박고 크게 기울어(−60~−126°) 깊이를 엇갈려 선다. 바닥 그림자 rx 18 α0.25, 흙 점 | 한 핀의 날 홈 |
| 연막 꼬리 | `puff-a/b/c`: 밝은 ink300 연기 덩이(덩이 3~4, 크기 제각각) + 낮은 ink500 심 + 위의 열린 p300 컬 + ink500 아래 가장자리. 4장 동안 덩이가 굴러 흐른다 | 없음(땅 조각 테가 청록) |
| 묘침 | `grave-a/b/c`: 땅에 박힌 K9 묘침(먹 핀대, 둥근 머리 종이 비석판 + p300 그늘, 글자·십자 없음), 기울기 −8·10·−3°, 그림자 rx 21. `grave-rise`: 0 = 둥근 머리만 땅 위로, 1 = 핀 대부분 + 흙덩이 | 핀대에 감긴 실 둘 |
| 추적 인장 | `sealCorner`: 바닥에 납작하게 찍힌 작은 네모 인영(변 11.5, 14° 돌림): 0 옅음, 1 반쯤, 2 찍힘. `sealStrike`: 큰 네모 인영(변 22): 0 찢긴 종이 섬광, 1 ink700 먹 튐, 2 바램 α0.75. 네모 안 네모 없음(§12-69) | 2번 장 매듭, 실 끝 셋(0·1장) |
| 사냥꾼 표식 | `mark-prey`: 구멍 뚫린 종이 패(약 9 × 10)가 끈 고리에 매달려 ±9° 흔들린다(2장 4fps) | 끈 고리 |
| 까마귀 깃 | `crow`: 먹 까마귀(+x로 난다), 날개 가장자리 종이 획, 눈 없음, 날갯짓 6장. `peck`: 0 = 종이 6갈래 별 r 4.8, 1 = p300 작은 별 + 먹 점 둘 | 다리에 감은 실 |
| 먹번개 | `pillar*`: 작은 먹구름(y −62~−72)에서 땅까지 서는 좁은 먹 번개 기둥(굵기 7 → 5, 좌우 ±4, 칠한 폭 ≤ 14), 발치 종이 튐. `pillar-start` 0 = 절반까지, 1 = 땅에 닿음 + 종이 섬광 r 6.2. `pillar` 4장 = 꺾임이 바뀜. `pillar-end` 0 = 두 토막(ink700), 1 = ink300 구름 + 점 잔해 α0.8 | 기둥 심 [ally 1.6, allyG 0.5] |
| 족자 낙하 | `roller`: 띠 머리 가운데의 말린 종이(위에서 본 원통 8.4 × 15.2, p300 그늘, 감긴 결 셋이 구름, 양 끝 먹 마개). 띠 폭 전체를 가로지르는 축봉은 SPEC(§14.4) | 걸이 끈(감은 띠 + 매듭 + 뒤로 끌리는 끝) |
| 일곱째 인장 | `seal8`: 인장 꼴 1.55배(몸 34 × 25, 목 + 공 꼭지 r 6.2). 0 = 무겁게 눌림(1.06 × 0.9) + 땅에 납작하게 깔린 찢긴 종이 섬광(`flash`) + 속도 획 둘 + 먼지, 1·2 = 8·14 들림, 3 = 18 들림 α0.55. `print8`: rx 32 납작 큰 인영 — 종이 α0.25, 두 호로 끊긴 붓 테 + 안쪽 ink300 호 둘(겹 테), 풀린 끈 한 획, 먹 점 셋 | 인면 테 [ink 3.6, ally 2] |
| 침묵의 종 | `mark-silence`: 무기의 종이 손종(칠한 높이 약 12, 폭 14.4) | 입을 동여맨 실 두 줄 + 매듭 + 끝 |
| 먹단지 | `flame-a/b`: 혀 셋(a)·둘(b)을 합친 먹 불길(높이 16~18), 종이 불티 둘, 6장 흔들림. `scorch<r>`(3a-r1, 검수 5차 F1): 같은 불길의 **덩이** 1~3개를 발 앞에 둔다. 덩이 [x, 배율, 혀 수]는 12: [−1, 1, 3] · 19: [−5, 1, 3], [7, 0.72, 2] · 28: [−8, 1, 3], [10, 0.76, 2] · 38: [−19, 0.8, 2], [−2, 1, 3], [17, 0.64, 2] · 54: [−30, 0.86, 3], [1, 1, 3], [29, 0.68, 2]이고, 높이 H = hm·배율(hm 9.5·12·15·18·21)이다. 혀는 `flame-a`(셋)·`flame-b`(둘)를 H/18로 줄인 것이다(큰 혀 폭 ≥ 5, 곁 혀 ≥ 3.4). 칠 순서는 혀 전부 + 덩이마다 바닥 타원(rx 반폭 + 1, ry 1.4)을 먹 한 경로로 → 안쪽 혀(0.7h, min(0.52w, w − 2.4 − 0.24·|lean|)) 청록 → 덩이마다 큰 혀에 allyG 심(0.42h, max(1.4, 0.3w)) → 19~54 등급은 가장 큰 덩이 끝 옆에 종이 불티 하나(r 0.75). 1번 장: 큰 혀 sway +1·높이 ×0.95, 곁 혀 sway −0.7·높이 ×1.05 | 불길 몸(ally) + 심(allyG). scorch도 덩이마다 같다 |
| 타르 항아리 | `string-a/b`: 테 쪽(앵커)에서 가운데로 끌린 타르 줄(굵기 3 → 1.1 → 방울 2.4 → 끝 0.5, p300 윤기), 4장 동안 조여 든다. `jarBroken`: 착탄의 쓰러진 항아리 0.5배 + 입에서 흘러나온 타르 | 항아리 봉인 끈 |
| 유성 붓 | `mote-a/b`: 종이 별가루(5·6갈래, r 1.85 → 1.1)가 y −2.6 → −7.6으로 오르며 바랜다(마지막 장 p300) | 없음(테가 청록) |
| 일식 테 | `corona-a/b`: 테에서 바깥으로 나온 찢긴 종이 깃(길이 17·13.5, 끝 홈). 1 = 짧아지고 p300 | 없음(리본이 청록) |

### 14.3 땅 조각 (`SPEC.zone`, 참고 = `drawZone`)

- 원점 = 조각 중심. 나이 a, 수명 life(자료). α(a) = min(clamp(a/0.15), clamp((life − a)/0.3)) (`SPEC.zone.fadeIn`·`fadeOut`).
- 그리는 순서와 층
  1. 위험지형 층 맨 앞(아군 지대 K4, 적 위험지형 K11보다 먼저): `floor` 조각(별똥 자국 `crater`, α) → wash(원 R, token·alpha × α) → `gloss`(타르: 반지름 at[i]·R, 시작 span0 + 12i°, 길이 span1 − span0, [[p300,1.4]], α) → **테**(`rim.ally`: 점선 [6,4] pad 0.6 / `rim.pad`: 실선 [[ink,3.4],[ally,1.8],[allyG,0.6]], 결이 조각 안에 있으면 `inside` [[ink,4],[ally,2.4],[allyG,0.8]]. **α를 곱하지 않고 수명 내내 그린다**, V4) → z `ground` 조각
  2. bodies 층: z `stand` 조각(묘비, 번개 기둥)을 발 y로 적·결과 함께 정렬
  3. allyAttacks 층: z `ally` 조각(회전 날, 별가루), 회전 베기 호
- 조각 장
  - 가운데 물건(center)은 처음 `start.seconds` 동안 `start.part`(장 ⌊a/seconds·frames⌋), 끝 `end.seconds` 동안 `end.part`(장 ⌊(a − life + seconds)/seconds·frames⌋)다. start·end 조각은 물건이 나오고 사라지는 그림이라 **α 1**로 그린다. end 조각은 수명 끝의 seconds 안에서 재생하고 수명 뒤로 넘기지 않는다(V4).
  - **가운데 물건의 loop·idx 장**(3a-r1, 검수 5차 F2): α = min(Z.start ? 1 : clamp(a/0.15), Z.end ? 1 : clamp((life − a)/0.3)). 처음·끝 조각이 있는 쪽의 페이드는 그 조각이 맡는다. 번개 기둥(start·end): 0.12~1.0초 내내 α 1. 회전 베기(end만): 처음 0.15초만 페이드, 0.15초부터 `spin-end`까지 α 1. 묘비(start만): 끝 0.3초만 페이드. 마름쇠·깨진 항아리(둘 다 없음): α(a).
  - 나머지 조각(disc·ring 조각, floor, wash, gloss, 회전 베기 호)은 α(a)다. 테는 α 1이다.
  - loop: ⌊t·fps + phase·frames⌋ mod frames(reduced LOD fps 절반). 감소 모션·minimal: min(frames − 1, ⌊phase·frames⌋)(phase가 0인 가운데 물건은 0번 장).
  - cycle: ⌊frac(t/seconds + phase)·frames⌋. 감소 모션·minimal은 loop와 같다.
  - idx: 0.
- 회전 베기 호(`zone.twinBlades.arcs`): th0 = 2π·J(1960) + 2π·turns·a(감소 모션은 J만), 호 k = th0 + k·2π/n에서 시계 방향 span°, 반지름 at·R, 층 [[ink,3.2],[p50,1.6]], α(a).
- 별똥 자국이 선 착탄 자리는 `land`의 `crater` 데칼을 따로 그리지 않는다(자국의 `floor`가 같은 조각이다. 두 겹 방지).
- `zone.pinHail.shadow`·`zone.gravePins.shadow`(rx 18·21, α0.25)는 조각 안에 이미 그려진 바닥 그림자의 기록값이다. 렌더러가 따로 그리지 않는다.
- 마름쇠(상한 24)·묘비(상한 24)·연막(12)은 조각 수가 많다. 상한은 엔진 자료(`cap`)가 지키고, 렌더러는 `caps.zoneStamps` [120, 72, 36]로 조각 수를 센다.

### 14.4 `SPEC.gimmick` 도형

**삼각 봉인 `triangle`**(원점 = 화면, `points` = 봉인된 세 적, 나이 a ∈ [0, 0.6 + 0.28])
- 대기(a < `delay` 0.6): u = a/0.6(감소 모션 1). 변 k(P_k → P_{k+1})를 g_k = clamp(3u − k)만큼 `pre` 층 [[ink,2.6],[ally,1.4]] 점선 [6,4] pad 0.6으로 꿰맨다. 세 모서리에 `sealCorner` 장 min(2, ⌊3u⌋).
- 터짐(v = a − 0.6, `life` 0.28): v < `fillSeconds` 0.1이면 삼각형 채움 p50 α0.25. 변은 `strike` 층 [[ink,4],[ally,2.2],[allyG,0.7]], α = fade(at 0.6). 모서리 `sealCorner` 2번 장. 무게중심에 `sealStrike` 장 ⌊v/0.28·3⌋.
- 빔 판정(폭 2 → 8)은 엔진 값이고, 그림의 변은 그 빔 축 위에 있다.

**펼쳐지는 족자 `unroll`**(빔 틀: 원점 = 족자 착지, +x = 빔 방향, 나이 a ∈ [0, 0.28])
- 머리 x1 = L·easeOut(clamp(a/`grow` 0.2))(감소 모션 L). α = fade(at 0.75).
- 띠: (0, ±w)~(x1, ±w) 종이 p50 α0.5, 위아래 곧은 가장자리 [[ink,1.6]]. 능선(`ridge`): x = lerp(0.06L, 0.96L, s)(25점), y = 0.18w − 0.25w·|sin(π·2·(x − 0.06L)/(0.9L))|, x ≤ x1 − 3만, [[ink,1.4]]. 머리 축봉 (x1, −w) → (x1, w) [[ink,6],[p50,3.4]]. `roller`를 (x1, 0)에 loop(감소 모션·minimal still 0).
- 띠의 반폭 w = 판정 폭(V4). 지금의 폭 100 먹 막대(지시서 §0.1 ⑨)를 대신한다.

**여덟째 인장 `eighth`**(원점 = 일곱 인영의 무게중심, 나이 a ∈ [0, 0.3 + 0.5])
- 대기(a < 0.3): u = a/0.3. 그림자 타원 rx = lerp(18, 64, u), ry 0.42rx, 먹 α lerp(0.12, 0.35, u). 일곱 인영 자리 → 가운데로 (1 − u)까지 바느질 선 [[ink,2],[ally,1]] 점선 [5,4] pad 0.6(deco: minimal 없음, reduced 하나 건너 하나). 일곱 자리는 게임에서 그 시전의 사건 자리다(참고 합성은 §9.3 배치).
- 터짐(v = a − 0.3, 수명 0.5): `print8`(데칼 1.2초, §7.2 decal 페이드) → wash p50 α0.2(원 Rg) → 무거운 고리(틈 2 · 6~10°, grow 0.7/0.08, fade 0.6, [[ink,4],[ally,2.2],[allyG,0.7]]) → `seal8` 장 ⌊v/0.45·4⌋(`sealSeconds`).

**개기일식 `total`**(원점 = 주인공 발, 수명 0.3, α = fade(at 0.6))
- 원판(inner 0) 먹 α0.2 → 0.62R~R 띠 먹 α0.22(evenodd) → 바깥 테 [[ink,4],[p50,2]] → 각성 가는 선(R − 6, §7.2) → `corona-a/b`(ring, R + 2, 7~9개, 장 ⌊a/0.3·2⌋, radial; deco) → 리본(`tail`, §8.2와 같은 식, loop).
- 검은 원판이 아니다. 바닥이 비친다(§12-73).

**거세지는 폭우 `surge`**: 새 도형이 없다. 렌더러는 커진 사건 반경으로 주 단계 고리와 자국을 그린다. `SPEC.gimmick.brushDownpour.scale` [1, 1.2, 1.4, 1.6]은 참고 합성(사건 넷, 2 × 2 배치)만 쓴다.

### 14.5 적 오버레이 (`overlay(key, opts)`, `SPEC.overlay`)

- 원점 = 적의 발. `opts.r`(적 반지름 → 가장 가까운 등급), `opts.top`(스프라이트 꼭대기 y, 렌더러는 실제 꼭대기), `opts.t`(시계), `opts.peck`, `opts.layer`.
- **층**: `feet` = groundMarks(몸 아래): `freeze-back-<r>`. `front` = 그 적의 몸 바로 뒤: `freeze-front-<r>`, `scorch<r>`. `head` = overheads: `mark-silence`, `mark-prey`, `crow`, `peck`. `layer`를 주면 그 층만, 없으면 셋 다(feet → front → head).
- **머리 표식**: 앵커를 (0, top − 12)에 둔다. 적 하나에 하나, `priority.heads` 순서(silence > prey > fear > lost > weak > stain). `mark-prey`는 loop 4fps(감소 모션·minimal still 0), `mark-silence`는 idx.
- **까마귀**: 맴돌기 a = 2π·t/0.9, 앵커 (14·cos a, top − 8 + 5·sin a), sin a > 0(왼쪽으로 갈 때)이면 좌우 반전, 장 ⌊t·12⌋ mod 6(`marks.crow` rx 14, ry 5, period 0.9, lift 8).
  - 쪼기(`opts.peck` = `crowAt` 틱 뒤 초, 0 ≤ peck < `marks.crow.dive` 0.12): k = sin(π·peck/0.12). 앵커가 맴돌기 자리에서 ((반전이면 +7, 아니면 −7), top − 5)까지 k만큼 갔다 돌아온다(`overlay.crow.dive.crow`, 부리가 머리 가운데를 향함). `peck`을 (0, top − 1)에 장 ⌊peck/0.12·2⌋로 그린다(`dive.peck`, deco: minimal 없음, `caps.events`로 센다).
  - 감소 모션: (6, top − 6)에 still 0으로 앉는다(`sit`). 쪼기 조각은 그린다.
  - `caps.crows` [12, 8, 4], 표식과 따로 센다.
- **동결**: `freeze-back-<r>` + `freeze-front-<r>`, r = 12·19·28 중 가장 가까운 것. `priority.feet` 맨 앞이고 버리지 않는다(`priority.keep`). 백묵 절단의 분필 고리(`root<r>-awakened`) 대신 그린다(지시서 §9-4).
- **불먹**: `scorch<r>`, r = 12·19·28·38·54, loop 8fps(감소 모션·minimal still 0). 불먹 땅 조각 안에 선 적에게 건다. 적 몸에 산호 물듦을 쓰지 않는다.
- 상한: `caps.heads`·`feet` [24, 16, 8], 주인공에게 가까운 적부터. 발 오버레이는 적 하나에 하나(`priority.feet`).

### 14.6 배치 prim (`layout`, 기믹 단계)

| prim | 식 | 쓰는 곳 |
|---|---|---|
| center | (0, 0). `pick`이면 parts[⌊J(pick)·len⌋] | 마름쇠 1950, 묘비 1951, 회전 날, 기둥, 인장, 항아리 |
| disc | k = 0..39: 각 2π·J(k), 거리 (R − margin)·√J(k + 40). 이미 놓인 것과 hypot(dx, 1.3dy) < minGap·R이면 버린다. n = clamp(round(R/per), min, max)개가 차면 멈춘다. 변형 parts[⌊J(k + 80)·len⌋], flip J(k + 120) < 0.5, phase J(k + 160). 앞 `info`개는 prio 0, 나머지 prio 2(`info`가 없으면 모두 0). 출력에 `margin` | 연막(per 26, 2~4, margin 16, minGap 0.45, info 1), 불먹(24, 2~5, 10, 0.35, 1), 별가루(30, 3~6, 8, 0.3) |
| ring | 1차 ring과 같은 식(n = count0 + ⌊J(900)·…⌋, 건너뜀 J(k + 100), 각 J(k), 변형 J(k + 200), phase J(k + 400), 자리 R + dr). **angle은 늘 바깥(+x = 바깥)이다**(dr < 0이어도 돌리지 않는다) | 타르 줄(5~7, jitter 0.3, dr −6, info 3), 코로나(7~9, 0.35, dr 2) |
| corner | `points`의 세 점(없으면 참고 삼각형 (−110, 40), (104, 56), (−6, −92)), `index` 0~2 | sealCorner |
| centroid | 세 점의 무게중심 | sealStrike |
| tip | (x1, 0), x1 = §14.4 족자 머리 | roller |
| tail | §8.2 tail과 같다(평상 span) | 일식 리본 |

z 순서는 ground → feet → stand → ally다.

### 14.7 jit 번호대 (3a)
- 1950: 마름쇠 변형. 1951: 묘비 변형. 1960: 회전 베기 호 시작각.
- disc: k, k + 40, k + 80, k + 120, k + 160(k < 40). 1차 ring prim(0~399)과 번호가 겹치지만 한 단계 안에서 함께 쓰지 않는다.
- ring(기믹): 900, k, k + 100, k + 200, k + 400(1차와 같은 쓰임). tail: 953, 410, 700.
- 참고 합성만: 여덟째 인장의 일곱 자리 960 + k, 980 + k(§9.3).

### 14.8 LOD·감소 설정·버리는 순서 (3a)

| 설정 | 3a |
|---|---|
| full | 전부 |
| reduced | loop fps 절반. 땅 조각 안 deco 조각과 prio 2 항목, 코로나, 여덟째 인장 바느질은 하나 건너 하나 |
| minimal | 땅 조각은 가운데 물건 하나(마름쇠, 묘비, 기둥, 회전 날, 항아리)와 바닥(분화구)·채움·테만. 연막·불먹·별가루·타르 줄·코로나·바느질·쪼기 없음. 표식은 `caps.heads` 8까지, 동결은 남긴다 |
| 감소 모션 | 회전 베기 호는 시작각에 멈춤, 까마귀는 앉음, loop·cycle은 phase 장, prog는 재생. 삼각 봉인 대기 변은 다 꿰맨 채(u = 1), 족자 띠는 다 펼친 채(x1 = L), 여덟째 인장 고리는 grow 없음 |
| 감소 섬광 | `seal8`(`flash: true`)만 α × 0.5 |

- 넘칠 때 버리는 순서는 `SPEC.priority.drop`(deco → 사건 → 데칼 → 먼 표식 → 먼 발 오버레이 → 땅 조각 안 여분)이다. 판정 테·선·띠, 가운데 물건, 대기 표시, 동결은 버리지 않는다(`priority.keep`).
- 땅 조각 하나 안의 상한 `caps.perZone` {smoke 4, flame 5, string 7, mote 6}은 layout의 max와 같다.

### 14.9 참고 합성의 맥락 (`context: true`, C5만)
- `PN.enemies.meta`·`draw(ch, role, {lod: 'game'})`와 `PN.heroKit.placeSprite`를 읽기만 한다. 다른 킷 모듈이 없으면 맥락 없이 그린다.
- 땅 조각: R < 50(마름쇠, 묘비, 기둥)은 적 하나를 조각 오른쪽(x + R + 16)에, 큰 조각은 R/75배 자리에 안에 둔다. 불먹 안의 적에게 `scorch`를 건다. 별똥 자국 안에는 결을 세운다.
- 오버레이 맥락은 층대로 그린다: `feet` → 적 몸 → `front` → `head`.
- 삼각 봉인은 세 모서리에, 펼쳐지는 족자는 띠 위에 적을 둔다. 개기일식은 결을 가운데에 둔다.
- 3b1 표식 단계: 적 셋(사수, 추적자, 돌격자)에 그 오버레이를 건다. 쌓이는 표식은 겹 수를 바꿔 건다(얼룩 1·2·3, 서리 수 1·2·2). 보스 균열판은 보스 대신 간수 셋에 1·3·5겹으로 건다(참고 합성만).

### 14.10 P2 표식·발 오버레이 (3차 2회 1/2, 3b1)

지시서 §4.3의 P2 표식·발 오버레이 9종이다. 이어지는 효과(§4.4)는 §14.11(3b2)이다. 3b2에서 검수 7차 F1·F2·R2·R4·§5-6으로 `lost`·`thorn<r>`·`mark-stain1`·`frost1-12`·`spore-a/b`의 그림을 고쳤다(아래 표의 굵은 글씨, 박스·앵커·장 수·drive·층은 그대로).

| 무기 | 단계 | 오버레이 키 | 자료(Entity.awk) | 조각 | 층 | 우선·상한 |
|---|---|---|---|---|---|---|
| inkDarts | `stain` | `stain` (stack 1~3) | `awk.stain`·`stainUntil` | `mark-stain1~3` | head | heads 마지막(stain) |
| headsmanDarts | `fear` | `fear` | `awk.fear` | `mark-fear`(rotate face) | head | heads 셋째 |
| wardRing | `weak` | `weak` | `awk.weak` | `mark-weak` | head | heads 다섯째 |
| smokeTail | `lost` | `lost` | `awk.wander` | `lost`(loop 8, deco) | head | heads 넷째 |
| bossbane | `crack` | `crack` (stack 1~5) | `awk.crack` | `mark-crack1~5` | head | 우선순위 밖, 늘 그림(보스만) |
| inkBloom | `pollen` | `pollen` | `awk.pollen` | `spore-a/b`(cycle 1초, deco) | head | `caps.spores` [16, 8, 0](포자 수) |
| frostNeedles | `frost` | `frost` (stack 1~2) | `awk.frost` | `frost1-<r>`, `frost2-<r>` | front | feet: frost2 > frost1 |
| gravePins | `bound` | `bound` | `awk.bound`(새) | `bound<r>` | front | feet 둘째 |
| thornHalo | `thorn` | `thorn` | `awk.thorn` | `thorn<r>` | front | feet 여섯째 |

- 머리 표식은 적 하나에 하나(`priority.heads`: silence > prey > fear > lost > weak > stain), 발 오버레이도 하나(`priority.feet`: freeze > bound > scorch > frost2 > frost1 > thorn > rime). 화면 상한은 `caps.heads`·`feet` [24, 16, 8], 주인공에게 가까운 적부터. 까마귀와 포자는 따로 센다.
- 균열판은 보스에 늘 그린다. 머리 표식이 함께 있으면 x + `SPEC.overlay.crack.beside`(26)에 둔다.

**조각(C2 줄, 3b1의 27줄 36장)**
```
inkDarts/mark-stain1 f1 idx box22x22 a11,20 over none head info w:stack
inkDarts/mark-stain2 f1 idx box22x22 a11,20 over none head info w:stack
inkDarts/mark-stain3 f1 idx box22x22 a11,20 over none head info w:stack
frostNeedles/frost1-12 f1 idx box36x20 a18,10 feet none front info r12 w:stack
frostNeedles/frost1-19 f1 idx box48x24 a24,12 feet none front info r19 w:stack
frostNeedles/frost1-28 f1 idx box64x30 a32,15 feet none front info r28 w:stack
frostNeedles/frost2-12 f1 idx box36x20 a18,10 feet none front info r12 w:stack
frostNeedles/frost2-19 f1 idx box48x24 a24,12 feet none front info r19 w:stack
frostNeedles/frost2-28 f1 idx box64x30 a32,15 feet none front info r28 w:stack
headsmanDarts/mark-fear f1 idx box22x22 a11,20 over face head info w:status
inkBloom/spore-a f4 cycle 1s box10x14 a5,12 over none head deco w:status
inkBloom/spore-b f4 cycle 1s box10x14 a5,12 over none head deco w:status
thornHalo/thorn12 f1 idx box30x16 a15,8 feet none front info r12 w:status
thornHalo/thorn19 f1 idx box40x18 a20,9 feet none front info r19 w:status
thornHalo/thorn28 f1 idx box56x22 a28,11 feet none front info r28 w:status
thornHalo/thorn38 f1 idx box72x26 a36,13 feet none front info r38 w:status
thornHalo/thorn54 f1 idx box96x30 a48,15 feet none front info r54 w:status
smokeTail/lost f4 loop@8 still0 box24x14 a12,10 over none head deco w:status
gravePins/bound12 f1 idx box34x20 a17,10 feet none front info r12 w:status
gravePins/bound19 f1 idx box46x24 a23,12 feet none front info r19 w:status
gravePins/bound28 f1 idx box62x30 a31,15 feet none front info r28 w:status
bossbane/mark-crack1 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack2 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack3 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack4 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack5 f1 idx box26x24 a13,22 over none head info w:stack
wardRing/mark-weak f1 idx box22x22 a11,20 over none head info w:status
```
박스·앵커는 지시서 §4.3 표 그대로다. 층만 서리 수·가시가 `feet` → `front`다(§12-82).

| 조각 | 그림 | 청록 |
|---|---|---|
| `mark-fear` | 종이 식은땀 방울 하나(높이 12.4, 먹 테 1.4, 오른쪽 아래 p300), −16° 기울여 머리 뒤쪽(−x)에 둔다 | 방울 안 반짝 획 [ink 2, ally 1.1, allyG 0.4] |
| `mark-weak` | 수호 고리의 꼰 줄 한 토막(종이, 먹 테 1.3, 비스듬한 꼰 자국)을 가운데에서 한 번 묶은 혹 매듭, 왼쪽 끝은 길게·오른쪽 끝은 짧게 늘어지고 끝이 풀림 | 매듭을 꿰는 바느질 한 땀 |
| `mark-stain1~3` | 먹 얼룩(1: r 3.6, 2: r 4.8 + 방울 하나, 3: r 5.8 + 가장자리 방울 둘, 들쭉날쭉), 둘레에 종이 테 1.2 + 먹 바깥 선. **3b2 R2**: 얼룩 1은 가로로 넓고(rx 1.15r, ry 0.85r) 더 들쭉날쭉하다(0.26 → 0.34) — 방울 없이도 '번짐'. 2·3은 그대로 | 젖은 먹 위 반짝 호 |
| `mark-crack1~5` | 찢긴 종이판(19 × 13, 먹 테 1.4, 아래·오른쪽 p300)에 왼쪽 위 모서리에서 갈라지는 금 n개(각 12·30·49·61·82°, 길이 15.6·10.2·13.2·8.4·9.4, 두 번 꺾임, 긴 금은 한 번 가지) | 가장 새 금 [ink 2, ally 1, allyG 0.35] |
| `lost` | **3b2 F1**: 머리 위 연기 컬 둘, 먹 테를 두른 열린 곱슬(앞 [ink 3.4, p300 1], 뒤 [ink 2.8, ink300 0.8] — 앞뒤는 크기와 심 명도로 가른다), 컬 k·1.6(3b1 1.2), 궤도 x ±4.7(3b1 3.6). 4장 동안 쌍이 0 → 13° → 25° → 13°로 흔들리며 컬마다 돈다(열린 끝은 늘 바깥). 칠한 범위 x −8.9 ~ 9.0, y −5.9 ~ −0.5(박스 24×14 − 3 안) | 컬 끝의 작은 리본 [ink 2.2, ally 1.2, allyG 0.4] |
| `spore-a/b` | **3b2 §5-6**: 꽃가루 알갱이 반지름 2(먹 테 1까지 지름 약 5px, a 2 × 2.2, b 2 × 1.7), 몸은 allyG(0.62배)를 청록 테가 두르고 종이 반짝은 왼쪽 위. 0: 0.72배, 1·2: 다 핌, 3: allyD·ink300 테로 바램. 꼬리 없음 | 알갱이 자체 |
| `frost1/2-<r>` | 발 앞 땅에서 솟은 짧은 결정 각기둥(서리 고리·동결과 같은 결정). 1: 한 무더기 셋 + 얼음 조각, 2: 두 무더기(셋 + 둘) + 얇은 얼음 판 + 조각 둘. 가장 높은 결정 H = **5.6**(3b2 R4, 3b1 4.6)·5.8·7.4(1), 6.2·8·10.6(2) = 몸 높이의 25% 이하 | 가장 높은 결정의 심 |
| `bound<r>` | 발 앞을 지나는 열린 호(rx 10·14.6·21.4) 위의 청록 홈질(점선 [3.4, 2.4] pad 0.6), 왼쪽 끝은 땅에 누운 풀린 실, 오른쪽에 3a 묘침을 줄인 작은 핀(머리 4.2~6.6)과 실 매듭. 닫힌 고리가 아니다(주인공 발밑 링과 갈림) | 실, 핀대의 감긴 실 |
| `thorn<r>` | **3b2 F2**: 발치 땅에 박힌 어두운 갈고리 셋. 먹 몸 + 볼록한 가장자리를 따라 가늘어지는 종이 띠(밑동 0.25·b → 끝 0), 먹 외곽 1.2, 밑동의 땅 패임(ink700 α0.6). 앞 가시가 가장 크고 가장 앞(땅 y 가장 큼): 높이 6.4·7.6·9.6·11.6·13.6(12·19·28·38·54), 곁 가시는 그 0.78·0.62배로 발 선 가까이 더 위, 밑동 폭은 높이의 0.75배 — 셋이 발 둘레의 얕은 호에 놓인다. 갈고리는 3b1 그대로(곁 둘은 안쪽, 앞은 오른쪽) | 앞 가시의 안쪽 반을 따라 [ally 1, allyG 0.35] |

**규칙(`SPEC.overlay`, 렌더러)**
- 머리 표식은 (0, top + `head.dy`)에 앵커를 둔다(dy −12). `head.parts[key].stack`이 있으면 조각 = part + clamp(stack). `lost`는 loop 8fps(감소 모션·minimal은 still 0, deco라 minimal에서 빼는 것이 먼저다). `mark-fear`는 적이 왼쪽을 보면 좌우 반전한다.
- 균열판: (0, top + `crack.dy`), 다른 머리 표식이 있으면 x = `crack.beside`. 조각 = `mark-crack` + clamp(stack, 1, 5).
- 꽃가루: 포자 i(0·1)는 `pollen.parts[i]`, u = frac(t/1 + `phase[i]`)(감소 모션은 u = phase[i]로 멈춤), 자리 = (`at[i].x` + side·drift·u, top + `at[i].y` − rise·u), side = at[i].x의 부호, drift 6·rise 16(`marks.spores`), 장 = ⌊u·4⌋. minimal에서는 그리지 않는다(deco).
- 발 오버레이: 조각 = part + (stack +) 가장 가까운 등급. 서리 수·묶임·가시 모두 `front` 층.
- 까마귀(R1): 조각만 바뀌고 규칙(§14.5)은 그대로다.
- 개기일식(결정 ②): `SPEC.gimmick.eclipseHalo.layers`대로 원판·띠는 ground(몸 아래), 바깥 테·각성 선·코로나·리본은 ally. 섬광 감소에서 원판·띠 α × `reducedFlash` 0.5.

### 14.11 P2 이어지는 효과 (3차 2회 2/2, 3b2)

지시서 §4.1·§4.4의 P2 이어지는 효과다. 같은 기믹의 표식이 3b1에 있는 넷(stain, fear, crack, pollen)은 그 단계에 사건을 더했고, 나머지 15개는 새 단계(우선 2)다. SPEC은 모두 `SPEC.gimmick[id]`의 새 키다(§12-92).

**단계와 자료**

| 무기 | 단계 | 자료(엔진) | 판정(V4) | 그리는 것 |
|---|---|---|---|---|
| inkDarts | `stain`(+ 터짐) | 셋째 얼룩: `area/blast` echo r 70 | 고리 r 70 | `stainBurst`(적 자리, 0.3초) + 사건 고리(stroke) |
| brushQuills | `dab` | 새 `pending` 0.6초 → `area/blast` r 50 | 고리 r 50 | 대기 `dab`(첫 명중 자리, ground, 대기 진행률로 장) → `dabBurst`(0.24초) + 사건 고리(band) |
| sealArrows | `topple` | `enemy/stunned` source(밀린 적이 0.4초 안에 다른 적과 닿음) | — | `topple`(부딪힌 자리, 0.16초, deco) |
| thunderNeedles | `leap` | ChainEffect skillId(기절한 적 → 200 안 가장 가까운 적) | 점 둘 | kink 선(SPEC) + 닿은 점에 `leapHit`(deco) |
| headsmanDarts | `fear`(+ 고리) | 처형 자리, r 160 | 고리 r 160 | 찢긴 종이 띠 고리(torn) |
| inkBloom | `pollen`(+ 고리·퍼짐) | `awk.pollen`, 0.5초마다, r 50 | 고리 r 50 | 먹 + 청록 점선 고리(dashed, 고리 전체, 0.45초) + `pollenPuff`(0.3초, deco) |
| tailGuard | `rear` | skillMark(뒤쪽 ±70°, 200 안에서 맞으면 두 배) | — | 맞은 적에 `rearHit`(0.2초, deco) |
| bossbane | `crack`(+ 터짐) | 다섯째 균열: `area/blast` r 90(보스 자리) | 고리 r 90 | 종이 균열선(SPEC) + 사건 고리(stroke) + `crackBurst`(0.3초) |
| inkPulse | `bump` | `enemy/stunned` source(밀린 적이 0.5초 안에 장애물·가장자리에 부딪힘) | — | `bump`(부딪힌 자리, 0.16초, deco) |
| thunderclap | `echo` | `area/blast` echo, 0.5초 뒤, 반경 × 1.4 | 고리 1.4R | jag 고리(손 없음, 0.3초) |
| clusterPots | `split` | 새 `pending` 0.35초(작은 단지 둘) → `area/blast` echo 둘(±60, 반경 × 0.6) | 고리 0.6R 둘 | `mini` 비행(lobMini) → `burst` + 송이 단지 고리 |
| sparkThread | `rewind` | ChainEffect echo(마지막 적 → 처음 적) | 점 목록 | sag −0.16 선(꼬리에서 머리로) + 닿은 적에 `spark` |
| stormThread | `amplify` | ChainEffect(건너뛸 때마다 +15%) | 점 목록 | twist, 구간마다 굵어지고 출렁임이 커짐, 점 조각 `gust-a`·`gust-b` |
| frostChainlet | `link` | 새 `awk.link`(2초, 구성원 목록, 공유 피해 순간) | 구성원 점 | links α0.45 pitch 20, 공유 피해 뒤 0.18초 α 1 |
| inkLance | `branch` | BeamEffect echo 둘(창 끝에서 ±35°, 길이 0.4L) | 캡슐 둘 | 가지 창(술 없음) + 창 끝에 `fork`(deco) |
| wideBrush | `resweep` | BeamEffect echo(0.3초 뒤, 같은 선) | 같은 캡슐 | 같은 띠 α × 0.65, 머리가 먼 끝에서 결 쪽으로, 붓 좌우 반전 |
| inkOrbit | `deflect` | Projectile echo(되받은 적 탄, 속도 × 2, 1.2초) | 탄 r 7 | `deflect-start`(0.06초) → `deflect-travel`(loop) → `deflect-end`(0.1초), +x = 속도 |
| meteorBrush | `haste` | 별똥 자국 안의 결 | — | 결 몸 바로 뒤 `haste`(loop 12) + 자국 테 `rim.pad.inside` |
| pinHail | `snap` | 마름쇠 zone 끝(처음 밟은 적) | — | 마름쇠 자리에 `caltrop-snap`(0.15초, deco) |
| sunNeedles | (없음) | `shot.radius` | 탄 r | 그림 없음. 렌더러가 탄 조각을 shot.radius / geo.size(≤ 1.6)배로 키운다 |

**조각(C2 줄, 3b2의 15줄 38장, 박스 넓이 54,504)**
```
inkDarts/stainBurst f3 prog 0.3s box64x52 a32,30 center none ally info w:event
brushQuills/dab f3 prog box28x18 a14,9 target none ground info w:pending
brushQuills/dabBurst f3 prog 0.24s box52x40 a26,24 center none ally info w:event
sealArrows/topple f2 prog 0.16s box32x28 a16,14 event none ally deco w:event
thunderNeedles/leapHit f2 prog box24x24 a12,12 point none ally deco w:chain
inkBloom/pollenPuff f3 prog 0.3s box36x28 a18,18 target none ally deco w:event
pinHail/caltrop-snap f2 prog 0.15s box44x30 a22,19 center none ally deco w:event
tailGuard/rearHit f3 prog 0.2s box40x32 a20,18 target none ally deco w:event
bossbane/crackBurst f3 prog 0.3s box56x48 a28,30 center none ally info w:event
inkPulse/bump f2 prog 0.16s box32x32 a16,16 event none ally deco w:event
meteorBrush/haste f4 loop@12 still0 box52x40 a26,36 hero face front info w:status
inkLance/fork f2 prog 0.2s box28x28 a14,14 point beam ally deco w:event
inkOrbit/deflect-start f2 prog 0.06s box40x18 a27,9 air vel ally info w:vel
inkOrbit/deflect-travel f2 loop@12 still0 box40x18 a27,9 air vel ally info w:vel
inkOrbit/deflect-end f2 prog 0.1s box40x18 a27,9 air vel ally info w:vel
```
박스·앵커·장 수·drive·층은 지시서 §4.4 표 그대로다. 다른 것은 `crackBurst`(추가, §12-93)와 `fork`의 place(`point`, §12-97)뿐이다. 새 그룹 넷(brushQuills, sealArrows, thunderNeedles, tailGuard)은 `groups` 앞쪽(IDS 순서), 나머지는 그 그룹 목록 끝에 붙었다.

| 조각 | 그림 | 청록 |
|---|---|---|
| `stainBurst` | 0 = 셋째 얼룩이 터짐: 종이 테 1.2를 두른 젖은 얼룩 몸(r 6.8)에서 테 없는 먹 팔 여덟과 방울. 1 = 테를 두른 얼룩 조각 넷이 흩어지고, 가운데는 ink700 잔해와 짧은 줄기(조각에 닿지 않음), 방울은 맨 먹. 2 = 땅에 누운 ink700 얼룩(p300 테)과 방울 | 젖은 먹 위 반짝 호(표식과 같음, 0·1장) |
| `dab` | 납작하고 들쭉날쭉한 먹 웅덩이(rx 8.2, 위성 방울 둘) + p300 윤기 호 + 펜촉의 청록 획. 1 = 1.08배, 방울이 떨림. 2 = 1.16배, 표면이 부풂(ink500 호) + 위로 뜨는 방울 둘 | 펜촉 획(먹 밑 + 청록 + allyG) |
| `dabBurst` | 0 = 납작한 자국에서 곧은 펜 튐 여섯(밑이 굵고 끝이 갈고리로 가늚, 각·길이 제각각) + 끝 방울 + 깃 날개 종이 조각 둘 + 펜촉 획이 위로. 1 = 가는 튐 넷이 방울로 끊김, 조각이 뜸. 2 = ink700 자국 + 방울 + p300 조각 | 펜촉 획(0·1장) |
| `topple` | 인장 머리(종이 덩이 9.2 × 9, 아래 먹 인면 띠 + 청록 테)가 28° → 62° 넘어짐. 0 = 부딪힌 자리의 찢긴 종이 터짐 + 넘어지는 획 둘, 1 = p300 터짐 + 흙. 글자·꼭지 없음 | 인면 테 [ink 2, ally 1.1] |
| `leapHit` | 닿은 점에서 길이·각이 다른 꺾인 번개 가지 셋 + 짧은 하나(먹, 청록 심, 첫 가지 allyG) + 가운데 작은 종이 섬광(5갈래 r 3.4). 1 = 0.62배, ink300·allyD. 불꽃실의 종이 별과 다르다 | 번개 심 |
| `pollenPuff` | 꽃가루 알갱이 여섯(r 1~1.9, 포자와 같은 밝은 알갱이)이 모여 나오고 옅은 ink300 컬 둘. 1 = 1.6배로 퍼지며 오름, 2 = 2.1배, 작고 allyD | 알갱이 |
| `caltrop-snap` | 0 = 마름쇠가 꺾임: 땅에 납작한 찢긴 종이 섬광 + 부러진 핀 반쪽 둘(날 끝 반쪽에 청록 홈, 손잡이 반쪽에 속 빈 고리) + 먹 조각. 1 = 더 높이, p300·ink300 | 날 홈(0장) |
| `rearHit` | 0 = 꼬리 방패 단검(종이 날, 둥근 종이 날밑, 가운데 점 없음)이 종이 베기 획을 지나 찌름 + 먹 튐 + 손잡이 끝의 짧은 청록 리본. 1 = 둘째 베기(첫째 옆, 겹치지 않음) + 단검이 물러남 + 먹 방울. 2 = p300 베기 둘 + 방울 | 리본(0·1장) |
| `crackBurst` | 0 = 균열판이 터짐: 찢긴 종이 섬광(먹 테 1.4) + 판 조각 넷(종이, p300 그늘, 먹 금), 가장 큰 조각에 가장 새 금의 청록. 1 = 더 멀리 + 작은 ink700 먹 튐. 2 = p300 조각이 떨어짐 | 가장 새 금(0·1장) |
| `bump` | 0 = 납작한 먹 덩이와 굵고 짧은 팔 + 뒤의 찢긴 종이 섬광 + 왼쪽 아래의 검은 띠 조각(먹 5)과 그 바깥 청록 앞선. 1 = ink700, p300 섬광, allyD 띠 조각. 회전 없음 | 띠 앞선 |
| `haste` | 결 발 뒤(−x)로 감아 오르는 청록 띠 둘(먹 테, 굵기 ≤ 2.4, 길이 다르게 뒤·위로, 엇갈리지 않음) + 올라가는 종이 별가루 둘(5·6갈래). 4장 동안 띠가 흔들리고 allyG가 위로 오르고 별가루가 오른다. 칠한 범위 y −32.7 ~ −12 | 띠 |
| `fork` | 0 = 창 끝의 작은 먹 튐(앞으로 쏠림) + 뒤의 찢긴 종이 섬광 + 술의 청록 매듭 띠가 가로지름. 1 = ink700, p300, allyD. 가지 둘은 SPEC 창이다(V를 따로 그리지 않음) | 매듭 띠 |
| `deflect-*` | 종이 파편 혜성: 각진 종이 파편 머리(앞끝 +8.6, 옆 ±5.2, 먹 테 1.5, p300 면 + 접힌 선) + 머리 위쪽에서 들어와 뒤로 휘어 꼬리 가운데로 나가는 소용돌이 획 + 종이 꼬리(−22까지, 끝이 파편으로 끊김). start 0 = 찢긴 종이 섬광 + 머리, 1 = 짧은 꼬리. travel 0·1 = 꼬리·파편이 흔들림. end 0 = 머리가 셋으로 깨지고 앞에 먹 튐 + 소용돌이 토막, 1 = p300 파편만. 먹알 + 종이 점(적 탄)이 아니고 산호가 없다 | 소용돌이 획 [ink 2, ally 1.1, allyG 0.35] |

**`SPEC.gimmick` 새 키(20)**

| 키 | 값 |
|---|---|
| inkDarts | stage stain, stacks 3, r 70, life 0.3, burst `stainBurst`, ring {stroke, [[ink,3.2],[p50,1.2]], gaps 3~4 · 9~18°, core [[ink,3.6],[ally,1.6],[allyG,0.5]] 60~100°, punch 1.8/0.1/1.5, grow 0.7/0.08, fade 0.6} |
| brushQuills | stage dab, delay 0.6, r 50, life 0.24, dab `dab`, burst `dabBurst`, ring {band ink, width 2.4~5, knots 10, gaps 3 · 10~18°, endTaper 9, core [[ink,3.6],[ally,1.6],[allyG,0.5]] 40~70° mid dab, grow 0.75/0.06, fade 0.6} |
| sealArrows | stage topple, life 0.16, event `topple`, window 0.4 |
| thunderNeedles | stage leap, range 200, life 0.2, hit `leapHit`, lift 14, line {kink, seg 24, n 3~8, shift 0.5, push 3~8, [[ink,3.4],[ally,1.8],[allyG,0.6]], flicker 12fps [3,4], grow frac 0.35, fade 0.6} |
| headsmanDarts | stage fear, r 160, life 0.45, ring {torn, p50 width 3, alpha 0.85, edge [[ink,1.2]], tear {pitch 6, depth 0.4~2.6, skip 0.3, end 1.6, [[ink,1]]}, gaps 2 · 5~9°, grow 0.4/0.15, fade 0.6} |
| inkBloom | stage pollen, r 50, tick 0.5, life 0.45, puff `pollenPuff`, ring {dashed, [[ink,1.6],[ally,1]], dash [4,5], pad 0.6, gaps 2 · 16~28°, grow 0.6/0.25, fade 0.6}(3b2-r1: 지시서 값, core 없음) |
| tailGuard | stage rear, reach 200, arc 70, life 0.2, hit `rearHit`, lift 14 |
| bossbane | stage crack, r 90, life 0.3, burst `crackBurst`, ring {stroke, [[ink,3.4],[p50,1.6]], gaps 2~3 · 8~16°, core [[ink,3.6],[ally,1.8],[allyG,0.6]] 70~110°, punch 2/0.1/1.5, grow 0.65/0.09, fade 0.6}, cracks {n 6~8, from 0.24, to 0.55~0.9, jitter 0.35, steps [0.32,0.26,0.24,0.18], bend 8~22°, [[ink,3],[p50,1.4]], core {n 2, [[ink,3],[ally,1.4],[allyG,0.4]]}, fork {n 1, at 2, deg 30, len 0.26}, grow 0.4/0.09} |
| inkPulse | stage bump, life 0.16, event `bump`, window 0.5 |
| thunderclap | stage echo, delay 0.5, reach 1.4, life 0.3, ring {jag, alpha 0.75, [[ink300,3.4],[p300,1.2]], core [[ink300,3.4],[ally,1.6]] 80~110°, seg 26, amp 1.5~6.5, forks 0, gaps 2 · 10~16°, flicker 12fps [7,8], grow 0.85/0.08, fade 0.6} |
| clusterPots | stage split, delay 0.35, offset 60, area 0.6, mini `mini`, burst `burst`, ring 'clusterPots'(= `SPEC.ring.clusterPots`) |
| sparkThread | stage rewind, hit `spark`, line {sag, sag −0.16, step 8, from 'tail', [[ink,2.6],[ally,1.4],[allyG,0.5]], grow frac 0.4, fade 0.65 dash [5,4]} |
| stormThread | stage amplify, width 0.15, amp 0.1, big {part `gust-b`, from 3} |
| frostChainlet | stage link, life 2, line {links, pitch 20, alpha 0.45, clear 0}, share {seconds 0.18, alpha 1}, fade 0.85 |
| inkLance | stage branch, angle 35, branch 0.4, fork `fork`, head 0.85, tassel false |
| wideBrush | stage resweep, delay 0.3, alpha 0.65, seed 500, head 'mirror' |
| inkOrbit | stage deflect, speed 2, life 1.2, hitR 7, start/travel/end `deflect-*` |
| meteorBrush | stage haste, part `haste`, at 'feet', rim 'inside' |
| pinHail | stage snap, life 0.15, event `caltrop-snap` |
| sunNeedles | scale {by 'radius', over 'size', max 1.6}(단계 없음) |

**식(렌더러가 옮길 규칙, `draw`가 같은 규칙을 그린다)**
- **사건 고리 공통**: R(grow) 위에 중심선. 틈은 SPEC.ring과 같은 gapList(J(10), J(20 + k), J(40 + k)). 실선 고리(stroke·band·jag)의 청록은 core 호에만(coreArc: 시작 2π·J(60), 길이 lerp(span, J(61))°, × 1.5 하지 않음). 점선 고리(dashed)는 고리 전체가 먹 + 청록 샌드위치다(3b2-r1). 각성 가는 선 없음. α = fade(at, 수명 = life) × alpha(torn 0.85, jag 0.75). 감소 모션은 grow 없이 α가 grow 시간 동안 들어온다(§7.2), punch ≤ 1.5.
- **C10 규칙**(검수 8차 결정 1): 폭 3 이하의 테·획은 C10 면이 아니다. 원판, 띠 채움, 폭이 3보다 넓은 것만 센다. 그래서 공포 고리의 종이 띠(폭 3)와 사건 고리의 종이 심은 `SPEC.fills`에 없다.
- **stroke**(얼룩 터짐 r 70, 균열 터짐 r 90): 틈 사이 호마다 layers(× punch m), 그 위 core 호에 core 층(× m).
- **band**(늦은 붓자국 r 50): §7.3 band와 같다(fringe 없음, 닫힌 띠 없음). core는 가장 긴 찍음 가운데(dab).
- **torn**(공포 r 160): 틈 사이 호 a(번호 ai)마다 n = max(6, round((a1 − a0)·R0/6)). 바깥 가장자리 R + 1.5, 안쪽 R − 1.5 − d_k: 짝수 k(끝 제외)만 d = J(2100 + 97ai + k) < 0.3이면 0, 아니면 lerp(0.4, 2.6, J(2150 + 97ai + k)). 끝은 가운데가 1.6만큼 틈으로 내민 찢긴 혀. 채움 p50(α), 바깥 가장자리 [[ink,1.2]], 안쪽 가장자리와 두 끝 [[ink,1]]. grow 0.4 → 1을 0.15초.
- **dashed**(꽃가루 r 50, 3b2-r1): 틈 사이 호마다 먹 + 청록 점선 샌드위치를 고리 전체에 그린다(`rim.ally`와 같은 규칙, 지시서 §1.5 `:218`). 청록 [ally,1]은 점선 [4, 5](butt, 호 시작에서 위상 0), 먹 [ink,1.6]은 같은 위상에서 대시를 양 끝으로 pad 0.6씩 늘린 점선 [5.2, 3.8], dashoffset 0.6이다. 호마다 무늬가 그 호의 시작에서 다시 시작한다. grow 0.6 → 1을 0.25초, 수명 0.45초, fade 0.6.
- **jag**(메아리 1.4R): 꼭짓점은 §8.3 jag을 R0(= 1.4 × 사건 반경)에서 flicker seed [7,8]로 만들고 R/R0로 늘인다(갈래 없음). 틈(사건 seed) 사이 호마다 각이 그 호 안인 꼭짓점을 각 순서로 이은 열린 꺾은선에 layers(miter 6), core 구간의 꼭짓점을 core 층으로 한 번 더.
- **균열선**(균열 터짐): n = 6 + ⌊J(1900)·3⌋줄, θk = 2π·J(1901) + (k + 0.5 + (J(1910 + k) − 0.5)·0.7)·2π/n. 시작 0.24R, 길이 L = lerp(0.55, 0.9, J(1930 + k))·R. 네 걸음(걸음 j 길이 steps_j·(L − 0.24R)), 걸음 j 방향 θk ± lerp(8, 22, J(1980 + 4k + j))°(J(1950 + 4k + j) < 0.5면 −). 줄 ⌊J(1902)·n⌋은 꼭짓점 2에서 θk ± 30°(J(1904) < 0.5면 −)로 0.26L 갈래. 줄 c = ⌊J(1903)·n⌋와 (c + ⌊n/2⌋) mod n은 core 층. 자람: 길이 × lerp(0.4, 1, easeOut(나이/0.09))(감소 모션 1), 갈래는 0.75부터. α는 고리 α.
- **kink**(감전 도약): A, B = 두 적 자리 − (0, lift 14). n = clamp(round(|AB|/24), 3, 8). 안쪽 꼭짓점 i: t = (i + (J(2000 + i) − 0.5)·0.5)/n, 옆으로 lerp(3, 8, J(2020 + i))·(i 홀수 +, 짝수 −). J의 seed = 사건 seed·13 + flicker seed([3,4][⌊t·12⌋ mod 2], 감소 모션 3). 수명 0.2초의 앞 35% 동안 A에서 길이를 따라 그려 나가고, 닿으면 B에 `leapHit`(장: 수명의 60% 전 0, 뒤 1). fade 0.6.
- **되감김**: 점 목록(결 = 첫 점)에 sag −0.16의 sagCurves(구간 i 제어점 = 중점 + 법선·(±0.16·L)·(−1), 짝수 +), 결 쪽 26 안을 자른 뒤 점 순서를 뒤집어 그려 나간다(수명 앞 40%). 0.65 뒤 먹 1.82 점선 [5,4]. 꼬리부터 곧은 길이 누적이 도달 길이 안인 적에 `spark`(장: 수명 절반 전 0, 뒤 1).
- **증폭**: 구간 i마다 twistGeo(그 구간 두 점, amp 4·(1 + 0.1i), 꺾음 seed = flicker seed + 31i). 가닥 층 굵기 × (1 + 0.15i). 결 쪽 첫 구간만 26 안을 자른다. grow 0.3: 도달 길이(곧은 길이 누적)까지 구간마다 잘라 그림. 점 조각: 점 j(구간 j에서 끝남)가 j ≥ 3이면 `gust-b`, 아니면 `gust-a`, 반전 J(650 + j) < 0.5.
- **묶인 사슬**: §8.3 links를 구성원 점에 pitch 20, 처음 비움 0으로(고리·막대·혹, 구간마다 가운데 고리 청록). α = (공유 뒤 0.18초면 1, 아니면 0.45) × fade(at 0.85, 수명 2). minimal: 꺾은 줄 [[ink,3],[ally,1.6]].
- **가지창**: 창(stroke 단계)을 그대로 그리고, 창 끝 (L, 0)에서 ±35°로 돌린 가지 틀(+x = 가지 방향)에 길이 0.4L의 blade를 그린다: 나이 v = 나이 − 0.18·0.28. 끝 = v/수명 < 0.18이면 lerp(4, 0.4L, easeOut), 0.7 뒤 0.6·0.4L로 물러나며 α 1 − v'. 창날 길이 30·0.85(각성 × 1.2), 반폭 6.5·0.85, 창대 4.8 → 3. 판정 캡슐: (0, ±w)에서 (0.4L, ±w) + 끝 반원, p50 α0.16 + [[ink,1.2]]. `fork`를 (L, 0)에 v < 0.2 동안(장 ⌊v/0.2·2⌋, deco).
- **되쓸기**: 머리 x1 = L − (L − 26)·easeOut(나이/(0.3·0.28)). 띠 [x1, L]: 위·아래 가장자리 raggedEdge(seed + 500, §8.3 brushBand), 채움 p50 α0.45 × A, 가장자리 [[ink,2]], 비백 n = 3 + ⌊J(300)·3⌋줄(길이 lerp(0.3, 0.8, J(320 + j))·(L − x1), 끝이 L에서 J(330 + j)만큼 안), 앞선 (x1 + 4, −w) → Q (x1 − 3, 0) → (x1 + 4, w). A = fade(0.6) × 0.65. 붓 조각을 (x1, 0)에 좌우 반전·α A로.
- **되받은 탄**: 조각 +x = 탄 속도. 시작 0.06초 `deflect-start`(장 ⌊나이/0.03⌋), 그 뒤 `deflect-travel` loop 12fps(감소 모션·minimal still 0), 끝 0.1초 `deflect-end`. 판정 r 7(앞끝 +8.6 ≤ r + 2.5, 옆 5.2 ≤ r + 2.5, 뒤 22 ≤ 8r).
- **결 가속**: 결 발(앵커 26,36)에 front 층, loop 12fps(still 0), 결이 왼쪽을 보면 좌우 반전(rotate 'face'). 같은 때 별똥 자국 테는 `rim.pad.inside`.
- **갈라짐**: 작은 단지 k(±1): lobPath(clusterPots, {x0, y0 = 터진 자리, x1 = ±60 자리, t = 나이/0.35, mini: true})의 그림자 타원 + `mini`(loop, phase J(1850 + k)). 0.35초 뒤 그 자리마다 `burst`(장 ⌊v/0.24·3⌋)와 SPEC.ring.clusterPots 고리(반경 0.6 × 사건 반경, seed + 17k, 평상).
- **해바늘**: 탄 조각을 앵커를 축으로 s = clamp(shot.radius / geo.size, 1, 1.6)배로 그린다(이 규칙만 조각을 키운다).

**층·LOD·상한**
- 층: 사건 고리·균열선·사건 조각·도약·되감김·증폭·묶인 사슬·가지창·되쓸기·되받은 탄 = allyAttacks(몸 위, 적 탄·예고 아래). 대기 `dab` = 바닥(ground, 위험지형 층 앞). `haste` = 결 몸 바로 뒤(front). 꽃가루 고리·퍼짐은 적 자리, 공포 고리는 처형 자리.
- LOD: deco 조각(`topple`, `leapHit`, `bump`, `pollenPuff`, `rearHit`, `fork`, `caltrop-snap`)은 minimal에 없고 reduced에서 하나 건너 하나. 꽃가루 고리는 minimal 0(`caps.pollenRings` [8, 4, 0]). 묶인 사슬은 minimal에서 꺾은 줄. 사건 고리·균열선·도약·가지 캡슐·되쓸기 띠·대기 `dab`·되받은 탄은 어느 설정에서도 그린다.
- 감소 모션: 고리 grow 없음, jag·kink 첫 seed, loop는 still 장, prog는 재생.
- 상한: 사건 조각은 `caps.events` [16, 10, 4], 사슬 도형은 `caps.links` [120, 60, 0], 대기 표시는 `caps.pending` [12, 12, 12], 비행(작은 단지)은 `caps.flights`. 넘칠 때 버리는 순서는 §14.8.

**jit 번호대(3b2)**: 10·20 + k·40 + k(틈), 60·61(core), 1900~1904·1910 + k·1930 + k·1950 + 4k + j·1980 + 4k + j(균열선), 2000 + i·2020 + i(kink, seed·13 + flicker), 2100 + 97a + k·2150 + 97a + k(찢김), 650 + j(증폭 바람 획 반전), 1850 + k(작은 단지 phase). 사건 seed = 그 사건의 표시 일련번호.

**참고 합성(`draw`)**
- 사건이 있는 3b1 단계: context 없으면 r 19 표식 + 원점의 사건(나이 = p × 수명, 꽃가루는 p × 0.5). context: 몸(발·front) → 사건 → 머리 표식. 얼룩은 표식 1·2 적 둘 + 터지는 적, 공포는 표식 적 셋 + 원점의 고리, 균열은 균열판 1·3 간수 둘 + 터지는 간수, 꽃가루는 포자 적 둘(고리·퍼짐은 추적자에서) + 고리 안의 돌격자.
- 새 단계: `dab`(context 없으면 대기 → 터짐 한 사건, 있으면 대기 하나 + 터짐 하나), `topple`·`bump`·`rear`·`snap`(사건 조각, context는 적·결·벽 선·마름쇠), `leap`(두 적 사이), `echo`(결 둘레 1.4R), `split`(context는 터지는 순간), `rewind`·`amplify`·`link`(context는 점 최대 여섯 64 간격), `branch`(context는 창 300, 결 −210), `resweep`(context는 380, 결 −190), `deflect`(context는 먹 궤도 훑기 + 사수 둘 + 탄 셋), `haste`(별똥 자국 + 결 + 결 가속).

**C9 벡터(3b2 단계, 28줄, `k10-c9b-count-d3b2-r1`로 셈. 3b2의 `k10-c9b-vectors-d3b2`는 29줄이었다(3b2 납품서의 '31줄'은 잘못 센 것). 3b2-r1이 꽃가루 고리의 core를 지워 `inkBloom/pollen path core` 줄이 빠졌고, 나머지 줄은 같다)**
```
inkDarts/stain path gaps [[8.78,25.06],[186.99,198.45],[276.21,291.87]]
inkDarts/stain path core [[65.16,162.84]]
brushQuills/dab path gaps [[8.68,25.16],[186.62,198.82],[276.08,292]]
brushQuills/dab path knots [[0,3.93],[36,2.54],[72,3.75],[108,3.13],[144,4.34],[180,2.95],[216,4.92],[252,3.53],[288,2.91],[324,4.12]]
brushQuills/dab path core [[71.76,140.02]]
headsmanDarts/fear path gaps [[21.26,29.5],[286.03,292.13]]
headsmanDarts/fear path torn [[43.77,-152.34],[37.53,-151.94],[32.2,-155.2],[26.09,-154.82],[20.44,-157.18],[14.42,-156.84],[8.56,-158.27],[2.61,-158.48],[-3.36,-158.46],[-9.32,-158.23],[-15.26,-157.76],[-21.19,-157.08]]
inkBloom/pollen path gaps [[12.53,38.23],[279.44,298.72]]
bossbane/crack path gaps [[18.14,32.62],[283.98,294.18]]
bossbane/crack path core [[65.16,172.84]]
bossbane/crack path cracks [[-5.34,-20.93],[-5.97,-33.58],[-5.32,-43.85],[-5.96,-53.33],[-10.09,-59.14],[5.17,-20.97],[5.24,-38.33],[11,-51.2],[10.33,-64.2],[14.16,-73.17],[21.43,-2.7],[32.08,-8.16]]
  [[41.23,-11.42],[50.01,-9.59],[56.22,-12.2]]
bossbane/crack path fork [[-5.32,-43.85],[-16.43,-55.24]]
bossbane/crack path coreLines [[0,8],[4,8]]
thunderclap/echo path gaps [[29.64,44.88],[348.22,360.26]]
thunderclap/echo path core [[195.48,275.72]]
thunderclap/echo path jag [[188.19,-0.35],[193.56,23.03],[179.43,52.91],[180.04,77.62],[156,101.18],[147.2,117.93],[136.12,138.95],[106.9,154.02],[94.94,171.06],[58.75,178.41],[39.81,179.67],[18.95,193.17]]
thunderNeedles/leap path kink [[0,-14],[23.03,-17.91],[39.85,-33.5],[70.93,-32.69],[83.7,-49.31],[118.37,-48.86],[132.47,-61.49],[162.94,-62.53],[180,-74]]
sparkThread/rewind path controls [[98.8,-70.2],[305.6,7],[520.4,-45.2],[738.8,30.2]]
sparkThread/rewind path end [[21.67,-14.37]]
stormThread/amplify path scale [[1,1],[1.15,1.1],[1.3,1.2],[1.45,1.3]]
stormThread/amplify path strandA [[220,-70],[225.27,-67.28],[230.54,-64.54],[234.32,-58.5],[242.13,-61.39],[247.69,-59.32],[251.89,-54.2],[257.01,-51.13],[262.21,-48.24],[269.17,-49.26],[275.13,-48.07],[280.81,-46.23]]
frostChainlet/link path links [[237.93,-61.93],[256.17,-53.73],[274.4,-45.52],[292.64,-37.31],[310.88,-29.1],[329.12,-20.9],[347.36,-12.69],[365.6,-4.48],[383.83,3.73],[402.07,11.93],[433.52,16.31],[452.82,11.05]]
inkLance/branch path tips [[849.7,-146.84],[849.7,146.84]]
wideBrush/resweep path top [[26,-36.16],[35.85,-32.91],[45.69,-34.61],[55.54,-32.46],[65.38,-32.93],[75.23,-36],[85.08,-33.07],[94.92,-36.45],[104.77,-32.62],[114.62,-31.69],[124.46,-35.83],[134.31,-33.24]]
wideBrush/resweep path head [[26,0]]
clusterPots/split path land [[-60,0],[60,0]]
clusterPots/split path mini [[15,-21],[30,-28],[45,-21]]
```
사례: stain·dab·fear·pollen·crack seed 7, echo radius 136 seed 5, leap points (0,0)→(180,−60) seed 3, rewind·amplify points = 지시서 C9의 PTS seed 1, link points = PTS의 결 뺀 넷, branch length 640 width 12, resweep length 410 width 34 p 0.5, split radius 64 seed 3. `coreLines`는 [줄 번호, 줄 수], `scale`은 [굵기 배율, 진폭 배율].
