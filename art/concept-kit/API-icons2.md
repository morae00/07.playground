# API — `k-icons2.js` · `PN.arsenal` v1.0 (무기 44종: 아이콘·타일·HUD 슬롯 + 투사체 22종 탄)

작업 지시서: `docs/art/briefs/arsenal-icons.md`(K9, art-director 2026-10-12). 기준: 스타일 바이블 v1 §3·§4·§5.3·§6·§7.2·§10.2·§12·§13·§15, 로어 바이블 §1.4·§3.1·§4, `docs/art/briefs/characters.md` §6.3(서리침)·§6.6(혼령 화살).
킷 출력은 잠정 아트다(바이블 §15). 최종 붓 외곽·블랙 스팟·비백은 사람이 다시 긋는다(§10).

| 납품 | 날짜 | 그린 것 (`META[id].done === true`) |
|---|---|---|
| 1차 | 2026-10-14 | 뼈대 전부(틀 빌리기, META 44, `parts`·`stamp`, 자리표시) + volley 8종의 아이콘(평상·각성)과 탄 |
| 1차 수정 1회차 | 2026-10-14 | 검수 1차(`docs/art/deliveries/K9-arsenal-icons.md` '## 검수 1차') 필수 F1~F4와 권장 R1~R8. 바뀐 곳은 §6·§7·§9의 '수정 1회차' 표시 |
| 1차 수정 2회차 | 2026-10-15 | 검수 2차 F2b: 각성 망나니 침 아이콘만(§6, §9-16). 다른 출력은 보존 해시로 같음을 확인 |
| 2차 | — | burst·spray·rear·seeker 14종의 아이콘과 탄 |
| 3차 | — | strike·nova·lob·chain·beam·halo 22종의 아이콘 + 이 문서 완성 |

## 1. 로드와 의존

```html
<script src="kit/lib.js"></script>        <!-- PN.taper, PN.rng, PN.halftone -->
<script src="kit/k-icons.js"></script>    <!-- PN.icons (틀), PN._ki (도우미, 핵심 아이콘 표 ICON) -->
<script src="kit/k-icons2.js"></script>   <!-- window.PN.arsenal -->
```

- 순서는 `lib.js` → `k-icons.js` → `k-icons2.js`다. 리뷰 시트는 굽기 순서 다음에 나머지를 이름순으로 읽으므로 따로 할 일이 없다. 굽기 두 곳(`build-ui-art.mjs`, `build-atlas.mjs`)의 `KIT_FILES`에는 메인 세션이 `'k-icons.js'` 바로 뒤에 넣는다.
- `k-icons.js`가 먼저 없으면 모듈은 오류를 던지지 않고 `PN.arsenal = { version, error }`만 둔다(읽는 동안 kit error 0).
- 쓰는 것: `PN.icons.skill`·`tile`·`hudSlot`(§2 방식으로만), `PN.icons.K`, `PN._ki`의 `S·P·L·f·rng·taperPoly·taperFn·smooth·blob·drip·inkDot·slimNeedle`(읽기만), `PN._ki.ICON[look].draw`(자리표시, 읽기만). `PN.skillVfx`·`PN.heroKit`·`PN.enemies`·`PN.env`·`PN.vfx`·보스 모듈은 부르지 않는다.
- 결정적이다. `Math.random`·`Date`가 없다. 들쭉날쭉한 값은 `PN._ki.rng(seed)`다.
- 글자(`<text>`) 0. 각성 타일의 覺 낙관은 빌린 틀이 그리는 기존 문법이다(지시서 §9 Q4, 팀 결정 2026-10-14).
- 한글은 `META`의 `name`·`mass`·`cyan`(문서용)과 `parts()`의 `window`에만 있다. 굽기가 옮기는 나머지 서술자 필드에는 한글이 없다.

## 2. 틀 빌리기 (지시서 §1.3, 이 방식만)

무기 그림은 모듈 안의 자기 표(`DRAW`)에 두고, `PN.icons.skill`·`tile`·`hudSlot`을 **한 번 부르는 동안에만** `PN._ki.ICON[id]`에 빌려 넣었다가 `finally`에서 지운다.

```js
function borrow(id, fn) {            // k-icons2.js:601
  const ICON = PN._ki.ICON, def = defOf(id);          // 모르는 id면 throw
  if (Object.prototype.hasOwnProperty.call(ICON, id)) throw new Error(`${id} clashes with a core icon`);
  ICON[id] = def;
  try { return fn(); } finally { delete ICON[id]; }
}
```

- `def`의 꼴은 핵심 아이콘과 같다: `{ rarity, kind: 'active', name, draw(c, A) → { bg, fg, top? }, halo? }`. `rarity`는 `arsenal.ts` 값이다.
- 아직 안 그린 무기(`done: false`)는 `draw`가 그 look의 핵심 그림 `PN._ki.ICON[look].draw(c, A)`를 그대로 돌려주고 `halo`도 look 것을 따른다.
- `hudSlot(id, {awakened: true})`는 호출 동안만 `PN.icons.skill`을 각성 강제 래퍼로 바꿨다가 되돌린다(`build-ui-art.mjs:112-121`과 같은 방식).
- 호출 뒤 `PN.icons.list()`는 17, `Object.keys(PN._ki.ICON)`도 17이다(C5).

## 3. 공개 API

```js
PN.arsenal = {
  version: '1.0',
  K,               // = PN.icons.K (같은 토큰 객체)
  ids,             // 44개, src/content/data/arsenal.ts 순서
  kinds,           // ['volley','burst','spray','rear','seeker','strike','nova','lob','chain','beam','halo']
  META,            // §4 (얼려 있음)
  shots,           // 투사체가 있는 22종, ids 순서
  skill(id, { size = 128, awakened = false, pitchFor }),            // = PN.icons.skill 규격
  tile(id, { awakened, metal, size, rarity }),                      // = PN.icons.tile 규격
  hudSlot(id, { size = 40, level, cooldown, awakenReady, awakened }),// = PN.icons.hudSlot + awakened
  parts(id),       // 탄만: [{ part, frames, drive, fps, window, box, anchor, rotate, layer, lod, still, flash, scale }]
  stamp(id, part, { frame }),                                       // 탄 조각(로컬 박스)
  sheet({ kind, awakened }),   // 리뷰용: 한 kind의 타일 줄(166 간격, size 150). awakened를 빼면 [평상, 각성]
  shotSheet({ kind }),         // 리뷰용: 한 kind의 탄 전부(무기마다 140 간격 열, 조각마다 28 간격 행, 장 2개)
};
```

**오류(throw).** 굽기가 조용히 다른 그림을 굽지 않게 한다(C7 "invalid calls").
- 모르는 id: `skill`·`tile`·`hudSlot`·`parts`·`stamp` 모두 `unknown arsenal id <id>`.
- 투사체가 없는 무기에 `parts`·`stamp`: `<id> fires no projectile (kind <kind>)`.
- 모르는 조각 이름: `unknown shot part <id>/<part>`.
- 핵심 아이콘 id와 겹치는 무기 id(현재 없음): `<id> clashes with a core icon`.

**id.** 아이콘·타일·슬롯 안의 id는 빌린 `PN.icons`가 `ki<N>…`로 매긴다. 탄 조각과 리뷰 도우미는 `k-icons.js:28-62`의 ctx를 필터 없이 줄여 옮긴 자기 ctx로 `kar<N>_`를 쓴다. 루트는 `<g class="kar kar-<id>">` + 자기 `<defs>`다.

## 4. META (44종, `arsenal.ts` 순서)

필드: `name`(ko.json `skill.<id>`, 문서용) · `rarity`·`kind`·`look`(arsenal.ts 그대로, C7 대조) · `count`(volley·burst·rear·seeker·strike·lob = L1 `count`, chain = L1 `jumps` + 1(과녁 수), beam = `directions`, spray·nova·halo = `null`) · `awakenedCount`(각성 그림의 수, 지시서 §2.4·§3.4) · `r`(투사체 판정 반지름 = `size`, 없으면 `null`) · `shot` · `done` · `mass`·`cyan`(지시서 §3.4 문구, 문서용).

| id | 이름 | 등급 | kind | look | 수 | 각성 | r | 주 덩어리 (20px 기준) | 청록 요소 | done |
|---|---|---|---|---|---|---|---|---|---|---|
| inkDarts | 먹침 | common | volley | needleStorm | 2 | 3 | 4 | 오른쪽으로 가는 검은 쐐기 둘 | 위 다트의 깃 한 장(먹 테) | ✓ |
| brushQuills | 붓깃 | common | volley | fanKnives | 3 | 4 | 5 | 긴 흰 깃 셋의 좁은 다발 | 가운데 깃의 펜촉 끝 점(먹 테) | ✓ |
| sealArrows | 인장 화살 | rare | volley | needleStorm | 1 | 2 | 6 | 먹귀 셋을 꿴 굵은 가로 꼬치 + 네모 머리 | 인장 앞면 테 | ✓ |
| frostNeedles | 서리침 | rare | volley | needleStorm | 2 | 3 | 4.5 | 오른쪽 먹귀를 덮은 흰 서릿발(검은 몸 위) | 침 끝 둘 | ✓ |
| thunderNeedles | 뇌침 | rare | volley | needleStorm | 1 | 2 | 4.5 | 창을 가로지르는 굵은 꺾쇠 번개 + 바늘 | 번개 심 | ✓ |
| twinBlades | 쌍날 | common | volley | fanKnives | 2 | 3 | 6 | 크게 휜 흰 초승 날 둘 + 회전 호 | 위 날의 안쪽 날선 | ✓ |
| ghostVolley | 혼령 일제사격 | epic | volley | mirrorClone | 4 | 5 | 5 | 선만 있는 화살 넷의 부채 + 청록 불꽃 깃 | 불꽃 깃 넷 | ✓ |
| headsmanDarts | 망나니 침 | legendary | volley | needleStorm | 1 | 2 | 4.5 | 큰 외날 칼 머리 + 찢긴 먹귀 | 칼 날선 | ✓ |
| paperStorm | 종이 폭풍 | rare | burst | fanKnives | 8 | 10 | 5 | 감겨 퍼지는 흰 종이 바람개비 | 가운데에서 감겨 나오는 바람 획 한 줄 | — |
| inkBloom | 먹꽃 | rare | burst | needleStorm | 6 | 7 | 4.5 | 검은 꽃잎 여섯 | 꽃술 테 일부(반 바퀴 이하) | — |
| thornHalo | 가시 테 | epic | burst | needleStorm | 12 | 14 | 4 | 끊긴 먹 덩굴 고리 + 휜 가시 | 덩굴 한 토막 안쪽 실 | — |
| starShards | 별조각 | epic | burst | mirrorClone | 5 | 6 | 5.5 | 깨져 흩어지는 각진 흰 조각 | 섬광 심 | — |
| sunNeedles | 해바늘 | mythic | burst | needleStorm | 16 | 20 | 5 | 가운데 흰 바늘꽂이 + 흩어져 튀는 바늘 | 누빔 실 한 줄 | — |
| inkDrizzle | 먹 이슬비 | common | spray | needleStorm | — | — | 3.5 | 오른쪽으로 흩뿌린 작은 먹 방울 원뿔 | 맨 앞 방울 셋의 젖은 반짝 획 | — |
| pinHail | 핀 우박 | rare | spray | fanKnives | — | — | 4.5 | 넓은 원뿔의 흰 핀 무리 | 가장 큰 핀의 날 홈 | — |
| tailGuard | 꼬리 방패 | common | rear | fanKnives | 3 | 4 | 5 | 왼쪽으로 펼친 흰 단검 셋(방패꼴) | 목도리 꼬리 | — |
| smokeTail | 연막 꼬리 | rare | rear | needleStorm | 2 | 3 | 4.5 | 왼쪽으로 길게 퍼진 먹 연기 덩어리 | 목도리 꼬리 | — |
| gravePins | 묘침 | epic | rear | needleStorm | 5 | 6 | 4.5 | 왼쪽 아래 땅에 박힌 긴 핀 다섯 | 목도리 꼬리 | — |
| trackingSeals | 추적 인장 | rare | seeker | needleStorm | 3 | 4 | 4.5 | 갈라져 휘는 청록 실 셋 + 끝마다 작은 도장 | 추적 실 셋 | — |
| huntersMarks | 사냥꾼 표식 | epic | seeker | mirrorClone | 4 | 5 | 5 | 네 과녁에 꽂힌 흰 표식 패 | 패를 묶은 끈 | — |
| crowFeathers | 까마귀 깃 | rare | seeker | fanKnives | 5 | 6 | 5 | 오른쪽 반원으로 짧게 흩어진 검은 깃 다섯 | 한 깃의 깃대 심 | — |
| bossbane | 보스 사냥침 | legendary | seeker | needleStorm | 1 | 2 | 5.5 | 오른쪽 40%를 차지한 큰 보스 먹 덩어리(흰 가면) + 작살 침 | 침 꼬리 실(한 번 휨) | — |
| inkLightning | 먹번개 | rare | strike | chainSpark | 2 | 3 | — | 위 먹구름 띠 + 내리꽂는 굵은 번개 둘 | 번개 하나의 심 | — |
| brushDownpour | 붓 폭우 | epic | strike | boneMortar | 4 | 5 | — | 비스듬히 쏟아지는 굵은 붓 획 넷 + 바닥 붓자국 | 붓 획 하나의 젖은 결 | — |
| fallingScroll | 족자 낙하 | epic | strike | boneMortar | 1 | 2 | — | 크게 떨어지는 세로 족자 | 걸이 끈 | — |
| seventhSeal | 일곱째 인장 | mythic | strike | voidMine | 7 | 8 | — | 위에서 내리찍는 큰 둥근 도장 + 바닥의 둥근 인영 일곱 | 큰 도장 인면 테 | — |
| inkPulse | 먹 파동 | common | nova | boneMortar | — | — | — | 굵기가 들쭉날쭉한 먹 고리 + 튕겨지는 먹귀 | 고리 앞선 한 호(1/3 바퀴 이하) | — |
| frostRing | 서리 고리 | rare | nova | blackSun | — | — | — | 흰 서릿발 고리 + 고리에 얼어붙은 검은 먹귀 | 고리 심 | — |
| thunderclap | 천둥 박수 | epic | nova | chainSpark | — | — | — | 맞부딪친 두 손 + 들쭉날쭉한 충격 고리 | 섬광 심 | — |
| silenceBell | 침묵의 종 | legendary | nova | voidMine | — | — | — | 가운데 흰 손종 + 매끈한 종이 고리 | 추를 묶은 실 | — |
| inkPots | 먹단지 | common | lob | boneMortar | 1 | 2 | — | 꼭대기의 흰 단지 + 오른쪽 아래 먹 튐 | 단지 목 끈 | — |
| clusterPots | 송이 단지 | rare | lob | boneMortar | 3 | 4 | — | 끈으로 묶인 작은 단지 셋 + 세 갈래 착지 | 송이 끈 | — |
| tarJar | 타르 항아리 | epic | lob | voidMine | 1 | 2 | — | 오른쪽 아래 넓은 끈적 먹 웅덩이 + 검은 항아리 | 항아리 봉인 끈 | — |
| meteorBrush | 유성 붓 | legendary | lob | boneMortar | 1 | 2 | — | 왼쪽 위 → 오른쪽 아래로 떨어지는 큰 붓 혜성 | 꼬리 심 | — |
| sparkThread | 불꽃실 | common | chain | chainSpark | 4 | 5 | — | 먹귀 넷을 잇는 부드러운 실 호 | 실 | — |
| stormThread | 폭풍실 | epic | chain | chainSpark | 7 | 8 | — | 창 가운데를 도는 큰 나선 실 + 흩어진 작은 먹귀 | 실 번개 | — |
| frostChainlet | 서리 사슬 | rare | chain | chainSpark | 5 | 6 | — | 먹귀 다섯을 잇는 흰 사슬 고리 줄 | 고리 하나의 심 | — |
| inkLance | 먹창 | rare | beam | railSpear | 1 | 1 | — | 창 폭을 가로지르는 가는 수평 창 | 술 매듭 띠 | — |
| wideBrush | 넓은 붓 | epic | beam | frostLine | 1 | 1 | — | 수평으로 쓸고 간 넓은 흰 붓질 띠 | 띠 앞선 테 | — |
| crossStrokes | 십자 획 | epic | beam | railSpear | 4 | 4 | — | 가운데 결 매듭을 둘러싼 찢긴 먹귀 넷 | 찢은 획 하나의 심 | — |
| judgmentLine | 심판선 | mythic | beam | railSpear | 1 | 1 | — | 왼쪽 위 먹통 + 오른쪽 아래까지 팽팽한 먹줄 | 먹줄 심 | — |
| inkOrbit | 먹 궤도 | common | halo | orbitScythes | — | — | — | 가운데가 빈 두꺼운 먹 타원 띠 | 혜성 획 심 | — |
| wardRing | 수호 고리 | rare | halo | eclipseStep | — | — | — | 굵게 꼰 흰 줄 고리(작은 타원) + 튕겨지는 먹귀 | 고리 바느질 1/3 | — |
| eclipseHalo | 일식 테 | legendary | halo | eclipseStep | — | — | — | 넓고 가는 타원 테 + 먹 초승 그림자 | 리본 두 가닥 | — |

- beam의 각성 수: 각성은 `count`·`jumps`에만 +1을 더하고 beam은 방향 수가 그대로라 `count`와 같다(지시서 §3.4의 beam 각성은 길이·폭 1.2배).
- `done: false`인 36종은 아이콘이 look의 핵심 그림, 탄은 §7의 자리표시다. 메인 세션은 `done`인 것만 등록한다.

## 5. 타일·HUD 슬롯 규격과 아이콘 창 규칙

| 쓰는 곳 | 호출 | 칸(CSS) | 원점 | 아이콘 창 표시 |
|---|---|---|---|---|
| 드래프트 카드 | `tile(id, { awakened, metal: true, size: 150 })` | 166 × 166 (@2x 332) | (−8, −8) | 120 px |
| 빌드 줄 · HUD · 일시정지 · 정산 | `hudSlot(id, { size: 40, awakened })`, 레벨 점(`<rect x="46.4"…/>`)은 굽기가 지운다 | 56 × 60 (@2x 112 × 120) | (−2, −2) | 40 · 32(좁은 창 24) · 28.6 · 20 px |

- 무기마다 [평상, 각성] 2칸이다. 무기는 융합 재료도 도감 항목도 아니라 96px 융합 칸과 도감 칸은 쓰지 않는다.
- 아이콘 마스터는 128 × 128, 빛은 왼쪽 위다. `draw(c, A)`는 `{ bg, fg, top? }`를 돌려준다(빌린 `PN.icons.skill`이 평상 바탕·각성 바탕·각성 1.1배·종이 테 2.2·창 밖 10까지를 처리한다).
- 망점은 `c.dot`·`c.ht`로만 쓴다(하한 max(8, 3·128/표시 크기)). 해칭·블러·그라데이션·혼합 모드 0.
- 색은 `K`의 ink·ink7·ink5·ink3·ink1·p50·paper·p300·ally·allyD·allyG만 쓴다(C4).
- 청록은 무기마다 한 가지 요소이고 늘 먹 위에 얹는다(먹 ≥ 2 + 청록 + glow 또는 종이 심).
- **낙관 피할 구역**: 아이콘 좌표 (94~128, 0~34). 각성 타일의 覺 낙관과 HUD 각성 준비 배지(105~128, 0~21)가 덮는다. 주 덩어리·개수·과녁·모티프 머리를 두지 않는다(바탕·꼬리·속도 획은 괜찮다). 네 모서리 10 안에도 정보를 두지 않는다(영웅 이상 틀의 마름모).
- **각성 그림**: 수가 있는 kind는 수 + 1을 그린다. bg의 망점은 빼고, 큰 먹 면은 ink7, bg의 먹 선은 p300으로 바꾼다.

## 6. 그린 아이콘 (1차 + 수정 1회차: volley 8종)

공통(지시서 §3.1 volley): 왼쪽 아래에서 출발해 수평에서 8~18° 올라가는 좁은 다발이 과녁 먹귀 하나(`PN._ki.inkDot`, 1장 슬릿 눈)로 간다. 좌표는 128 창 기준이다. **블랙 스팟**(바이블 §6-2)은 무기마다 놓는 자리를 달리했다: 모티프 자체가 검은 것(먹침·인장 화살·뇌침·망나니 침·쌍날)과, 흰 모티프 뒤에 먹 바탕을 깐 것(붓깃: 붓질 띠, 서리침: 오른쪽 아래 언 땅, 혼령 일제사격: 왼쪽 아래 부채꼴 먹 번짐). 수정 1회차에 인장 화살·뇌침·망나니 침의 먹을 보탰다(검수 R1, §9-11). 창 안 먹 면적은 §10의 C10 값이다.

| id | 평상 | 효과 표지 · 청록 | 각성 |
|---|---|---|---|
| inkDarts | 짧고 굵은 다트 둘(길이 70·66, −12°, 간격 21, 13 엇갈림). 앞 45%는 먹 쐐기(폭 16, 곧은 날 + 빛 쪽의 끊긴 담묵 마른 붓 두 획), 뒤는 종이 몸(폭 7) + 손으로 감은 실 한 뭉치(먹 띠 + 종이 선 둘) + 뒤로 크게 젖힌 깃털 비행깃 2장(바깥 끝 = 몸 반폭 + 8.5). 앞 다트가 과녁 (103, 57) r 15에 박히고 박힌 자리에 6갈래 종이 튐. 다트마다 뒤로 마른 붓 먹 꼬리, 과녁 뒤(오른쪽)로 먹 튐. **수정 1회차 R6**: 같은 간격 실감기 셋 → 한 뭉치, 담묵 빗면 줄 → 끊긴 두 획, 깃 키움(미사일·만년필 뚜껑 기미) | 표지 없음 · 위 다트의 위 깃(청록 면, 먹 테 1.6 + glow 한 획). **수정 1회차 F4**: 깃 바깥 반폭 + 6.6 → + 8.5, 테 2.2 → 1.6 | 3발(위·아래로 엇갈림) |
| brushQuills | 깃펜 셋(길이 80·74·70, −19°/−12°/−5°, 벌어짐 14°): 위쪽만 넓은 깃(최대 10, 담묵 결 셋, 갈라진 홈 하나), 깃대, 종이 대롱, 먹 펜촉(앞 20%, 종이 틈). 가운데 깃이 과녁 (95, 64) r 13을 꿰뚫고 나와 펜촉이 (120, 60). 블랙 스팟은 다발 밑을 지나는 좁은 마른 붓 획(왼쪽에서 눌러 시작해 과녁 쪽으로 가늘어짐, 비백 셋) | 관통(나온 자리 종이 구멍) · 가운데 펜촉 끝 점(청록 r 3.6, 먹 테 1.8; 수정 1회차에 r 3 → 3.6, 32px에서 흐렸다) | 4개(하나 더, 과녁 뒤로 지나감) |
| sealArrows | 굵은 화살 하나(꼬리 (14, 69), −6°, 길이 110). 먹 자루 6(종이 테)이 먹귀 셋(r 9·11·13, x ≈ 36·60·86, 눈 아래로 지나감)을 꿰고, 나온 자리마다 종이 찢김. 머리는 옆에서 본 인장 몸(16 × 18: 종이 몸 6.5, 홈 한 줄, 아래 p300, 앞면 띠 8 = 먹 1.6 · 청록 인주 4.8 · 먹 1.6), 꼬리에 종이 깃 2장, 뒤로 굵은 마른 붓 먹 꼬리(폭 34, 각성 15). **수정 1회차**: 앞면 띠 3 → 8(F4), 먹 꼬리를 굵히고 맨 앞 먹귀의 끌림 획을 2배로(R1) | 밀침: 맨 앞 먹귀가 16° 젖혀지고 끌림 획 둘(굵기 6.8·5.2) · 인장 앞면(청록 인주 면 4.8 + glow 세로 획, 양쪽 먹 1.6; 1차는 청록 선 1.4) | 2발(아래 줄 길이 82, 먹귀 하나) → 꿴 먹귀 넷 |
| frostNeedles | 서리침 둘(핵심 바늘 몸 폭 9, 앞 45%(t 0.55부터)를 청록으로, 먹 테 1.4, 실 없음, 길이 58·55, −11.9°/−12.5°). 과녁 (100, 66) r 16의 아래 절반에 가지 친 얇은 서릿발 8(길이 9~19, 둘은 검은 몸 위; 지시서 5~7과 다름 §9-10), 발밑 얼음판 (100, 89) 23 × 5.5. 블랙 스팟은 오른쪽 아래에서 번져 오는 언 땅(먹). **수정 1회차 F4**: 폭 7 → 9, 청록 28% → 45% | 서리 감속 · 침 끝 둘(청록 밑변 약 6, 먹 테 포함 약 7.4) | 3개, 서릿발 셋 더(몸 2/3까지) |
| thunderNeedles | 바늘 하나((10, 90) → (104, 65), 길이 97). 번개는 창 공간 점 (4,100)(30,80)(36,90)(70,58)(66,72)(86,62)(99,66): 꺾임 5, 구간 33·12·47·15·22·13(이웃 구간이 30% 이상 다름), 굵기 8 → 15.5(세 계단, 먹 : 청록 : 종이 = 1 : 0.5 : 0.17), 꺾쇠 이음, 그림자 쪽(오른쪽 아래 2.1, 2.7)에 먹 사본. 바늘을 가로지르는 두 구간은 바늘 앞에 다시 그린다. 과녁 (98, 66) r 14 뒤로 탄 자국이 터져 나간다(오른쪽으로 치우친 납작하고 거친 먹 튐: 중심 (115, 72), r 30, 세로 0.82, 방울 셋). 먹귀 등 쪽(−80°~100°)에 종이 끊김 호(r + 1.3, 2.8)를 둬 윤곽이 탄 자국에 묻히지 않게 했다. **수정 1회차 R1**: 탄 자국·번개 그림자·끊김 호를 더함 | 기절: 머리 위 종이 나선 1.5바퀴 (99, 42) r 9.5, 0.38로 납작, 꼬리가 열림 · 번개 심 | 2발(둘째 바늘 + 가는 번개), 번개가 둘째 먹귀 (116, 96) r 9로 짧게 튐. 탄 자국은 ink7 |
| twinBlades | 초승 날 둘(R 18·20 = 지름 36·40, (59, 40)·(77, 86), 회전 200°·25°): 종이 날, 오목한 안쪽의 얇은 먹 등, 먼 쪽 p300 띠, 오른쪽 아래 그림자. 날마다 꼬리 쪽 회전 호 하나(반지름 R + 5, 110°, 먹 3 → 0.4 안에 종이 1.4 → 0.2, 날에서 멀어지며 가늘어짐). 아래 날이 과녁 (108, 71) r 13을 친다. **수정 1회차 R2**: 날마다 호 둘(먹 3~4 + 종이 심) → 하나 | 밀침: 먹귀가 15° 젖혀지고 끌림 획 둘(길이 다름) + 몸 앞 종이 튐 · 위 날의 안쪽 날선(볼록 날 안쪽 호, 청록 2.4 + 먹 테, 합 4.8) | 3개. 셋째 날(R 15, 150°)은 왼쪽 아래 뒤 (22, 93)에 둬 셋이 원상 안의 고른 삼각이 되지 않게 했다(**수정 1회차 R3**, 三つ巴·삼태극 기미). 크기·높이·회전 모두 다름 |
| ghostVolley | 혼령 화살 넷(출발 (−10, 92), −24°/−17°/−10°/−3.5°, 길이 58~66): 선 그림 — 촉은 잎맥 있는 버들잎 윤곽, 자루는 담묵 테의 종이 선, 깃은 두 갈래 청록 불꽃(먹 테 2). −10° 화살이 과녁 (98, 64) r 14를 꿰뚫어 나오고(종이 구멍), −17° 화살은 박힌다. 블랙 스팟은 다발 뒤 왼쪽 아래의 부채꼴 먹 번짐(과녁 앞에서 거칠게 끝남). `halo: false` | 관통 · 불꽃 깃 넷 | 5발, 불꽃 1.35배 |
| headsmanDarts | 굵은 침(먹 자루 6 + 종이 테 8.6, 깃 2장, (6, 89)에서 −16°, 길이 56) 끝의 외날 칼 머리(1.12배. 칼날 공간 x −4~40 · s −11.6~8.6, 약 49 × 23): 곧은 등, 끝 쪽이 가장 넓은 배(팔치온 꼴), 등선 끝에서 3~4 더 나간 마이터 끝(종이 삼각 + 먹 테 2.6), 위 가장자리만 덮는 먹 등 띠(두께 3~4)와 종이 날 몸, 배를 따라 2~3 안쪽의 p300 그늘, 날과 자루 사이의 먹 칼 목(x −4~0). 칼 머리는 대략 (53~101, 48~84). 과녁 (100, 80) r 16이 눈 아래 0.22r 지점을 지나는 7계단 찢김선을 따라 두 쪽으로 갈라지고, 위 조각이 (6, −8)·−22° 비스듬히 벌어진다. 먹 튐 셋은 찢김선의 t −0.75·0.15·0.9 r에서 찢김선에 거의 수직으로 아래 조각의 윤곽 밖으로 떨어진다(길이 9·5.5·11, 굵기 3·2.6·3.4, 가장 긴 가닥 끝에 떨어진 먹 방울). 평상판에는 먹귀 오른쪽 아래 땅에 납작하고 거친 먹 튐(중심 (108, 102), r 32, 세로 0.32, 방울 셋). **수정 1회차**: 칼 머리(F1), 먹 튐(F2), 땅의 먹 튐과 자루 5 → 6(F1-5·R1) | 처형(종이처럼 찢김, 깔끔한 절단면·✕ 없음) · 칼 날선(청록 2.4 + 먹 테, 배를 따라 2~3 안쪽) | 2발. 작은 칼 머리 0.72배는 (−4, 111)에서 −6°, 길이 38.6이고, 칼끝이 둘째 먹귀 윤곽에 닿는다. 찢긴 먹귀 둘째는 (71, 110) r 11, `open` (4, −5)·−12°다. 첫째와 중심 사이 41.7이고, 위 조각을 벌린 뒤에도 실루엣 사이는 약 9.5(각성 1.1배·종이 테 포함 약 6)다. 두 먹귀 모두 먹 튐이 없다(`tornGhoul` 옵션 `flicks: false`). 평상판과 같은 땅 먹 튐을 ink7로 깐다. **수정 2회차 F2b**: 1차·수정 1회차의 둘째 먹귀 (90, 106)은 첫째와 맞닿았다(중심 사이 27.9). 각성 종이 테가 둘을 머리·배 마디로 묶고, 테 두른 먹 튐과 둥근 끝이 다리처럼 보여 '다리 달린 벌레'로 읽혔다(§9-16) |

## 7. 탄 (`parts(id)` · `stamp(id, part, {frame})`)

투사체가 있는 kind(volley·burst·spray·rear·seeker) 22종만 해당한다. 굽기 키는 `skill/<id>/<part>/<frame>`, 호출은 `['PN.arsenal.stamp', id, part, { frame }]`, `scale: 1`(월드 단위 = 1x px)이다.

### 7.1 조각 (22종 모두 같은 6조각 × 2장 = 264장)

| part | frames | drive | fps | still | window | rotate | layer | lod | flash | scale |
|---|---|---|---|---|---|---|---|---|---|---|
| start | 2 | prog | 0 | null | 나이 0~0.06초 | vel | ally | info | false | 1 |
| travel | 2 | loop | 12 | 0 | 비행 중 | vel | ally | info | false | 1 |
| end | 2 | prog | 0 | null | 남은 수명 0.10→0초(수명이 다할 때만) | vel | ally | info | false | 1 |
| start-awakened | 2 | prog | 0 | null | 나이 0~0.06초 | vel | ally | info | false | 1 |
| travel-awakened | 2 | loop | 12 | 0 | 비행 중 | vel | ally | info | false | 1 |
| end-awakened | 2 | prog | 0 | null | 남은 수명 0.10→0초(수명이 다할 때만) | vel | ally | info | false | 1 |

- 이름이 K4 탄과 같아서 굽기의 `SKILL_VFX_TIMING`(`atlas-spec.mjs:395-399`: start 0.06, end 0.1)이 그대로 맞는다.
- **앵커** = 투사체 좌표 = 판정 원 중심, +x = 속도 방향. 칠한 모든 기하는 박스 가장자리에서 3 이상 안쪽이다(C7, getBBox 기준).
- 판정과 그림(V4): 앞끝 r − 0.5 ~ r + 2.5, 옆 ≤ r + 2.5, 뒤(꼬리 포함) ≤ 8r(렌더러가 8r 원으로 자른다). 그림은 판정을 바꾸지 않는다.

### 7.2 무기별 박스·앵커

| r | 박스 | 앵커 | 무기 (✓ = 1차에 그림, 나머지는 자리표시) |
|---|---|---|---|
| 3.5 | 40 × 18 | (31, 9) | inkDrizzle |
| 4 | 46 × 20 | (35, 10) | inkDarts ✓, thornHalo |
| 4.5 | 50 × 20 | (39, 10) | frostNeedles ✓, thunderNeedles ✓, headsmanDarts ✓, inkBloom, pinHail, smokeTail, gravePins, trackingSeals |
| 5 | 54 × 22 | (43, 11) | brushQuills ✓, ghostVolley ✓, paperStorm, sunNeedles, tailGuard, huntersMarks, crowFeathers |
| 5.5 | 60 × 22 | (47, 11) | starShards, bossbane |
| 6 | 64 × 24 | (51, 12) | sealArrows ✓, twinBlades ✓ |

### 7.3 장마다·각성 (모든 탄이 같은 감싸개 `shot()`을 쓴다)

| 조각 | 0번 장 | 1번 장 |
|---|---|---|
| start | 꼬리 30% | 꼬리 70% |
| travel | 흔들림 하나(실 위상·회전·펄럭임·불꽃 혀) | 0번 장과 위상이 다름 |
| end | 꼬리가 처짐, 청록 → allyD | 몸 p300, 외곽 ink300, 묶음 α 0.6 |

- 각성(세 조각 모두): 몸과 청록 요소는 그대로, 몸 둘레에 겹 테(종이 1.0 + 먹 0.8, 몸 외곽선을 넓게 그은 두 획: 먹 lw + 3.6 위에 종이 lw + 2)를 두른다. 테는 몸 외곽선을 x −3 옮긴 사본에 긋고 clip은 없다. 그래서 테가 몸 꼴을 끝까지 따라가고 앞끝보다 0.45 뒤에서 끝나 앞끝이 늘지 않는다. 회전하는 몸(쌍날)은 회전한 외곽선을 옮긴다. **수정 1회차 R5**: 1차는 앞 3 단위를 세로 clip으로 잘라 칼·인장 머리에서 테 끝이 칼로 자른 듯 남았다(§9-14). travel-awakened 0번 장에만 앞끝 위쪽에 6갈래 불규칙 종이 반짝임(r 2.5, 먹 0.6). 꼬리는 1.25배(8r 안).
- 색: K 토큰 11개만(산호·호박·자수정·연두·장 재질색 0). 필터·종이결·그라데이션·블러·혼합 모드 0, clipPath·묶음 opacity만. 몸 외곽 먹 1.5, 내부선 0.6~1.0. start·travel에는 늘 청록이 있다(C4). 둥근 먹알 + 종이 점(적 탄 문법)은 없다.
- **자리표시**(done: false): 종이 바늘(앞끝 r + 1, 뒤 −(2.4r + 4), 반폭 1.7, 먹 1.5) + 청록 바늘귀(end는 allyD). end 1번 장은 p300·ink300·α 0.6. 각성 표시는 없다.

### 7.4 그린 탄 (1차 + 수정 1회차: volley 8종, 앵커 기준 x · 반폭)

| id | r | 몸 | 꼬리(평상) | 청록 | travel 두 장 | 실측 앞/뒤/옆 |
|---|---|---|---|---|---|---|
| inkDarts | 4 | 다트 +5.5 ~ −7.5: 앞 30% 먹 쐐기(+1.6~+5.5, 반폭 3.2, 담금 경계 들쭉날쭉), 뒤 종이 몸(−7.5~+1.6, 반폭 2.0~2.4, 아래 p300 그늘), 쐐기 빛 쪽 p300 한 획. **수정 1회차 F3**: 1차는 앞 45% 먹 쐐기, 종이 반폭 1.8 | 종이 깃 2장(−4.4~−9.2, 바깥 4.6) + ink300 속도 획 1(−10~−18). 깃은 넓어진 몸에 가려지지 않게 밑동을 몸 가장자리로 옮기고 바깥을 3.6 → 4.6으로 늘렸다(§9-15) | 위 깃(청록, 먹 테 0.8) | 속도 획 길이 8 / 10.8 | 5.5 / 23.5 / 5.8 |
| brushQuills | 5 | 깃펜 +6 ~ −12: 위만 넓은 깃(4.6 / 1.6), 담묵 결 둘, 종이 대롱, 먹 펜촉(앞 4, 종이 틈) | 깃 끝 결 갈라짐 2획(−12~−18) | 펜촉 끝 점 r 1.3(먹 테 0.6) | 결이 위아래로 흔들림 | 6.2 / 19.5 / 5.9 |
| sealArrows | 6 | 인장 몸 머리(−1.5~+7.5, 반폭 3.8: 종이, 홈 x 0.8, 아래 p300, 앞면 먹 +6.3~+7.5) + 자루(먹 2.4 안에 종이 심 0.9, −16까지) + 종이 깃 2장(−13~−20). **수정 1회차 R4**: 1차는 +1.5~+7.5 · 반폭 4.5(길이 6 × 높이 9, 세로로 날면 망치·의사봉 기미) · 먹 자루 2.4 | 속도 획 둘(−22~−40·−24~−36, 각·길이 다름) | 인장 앞면 세로 획(먹 1.7 위 청록 0.9) | 깃 펄럭임 | 7.5 / 44.5 / 7.1 |
| frostNeedles | 4.5 | 종이 바늘 +6 ~ −10(반폭 2.2, 바늘귀), 앞 4는 청록(먹 테 0.6), 실 없음 | 종이 얼음 조각 셋(삼각·사각, 1.7~2.6, 먹 0.6, −12~−28, y ±2) | 바늘 끝 | 조각 자리 바뀜 | 6.0 / 32.1 / 5.3 |
| thunderNeedles | 4.5 | 종이 바늘(먹 끝) + 몸을 감는 꺾쇠 번개(꺾임 5, 먹 1.6 / 청록 1.0 / 종이 0.4, y ±3.3, x −16~+2, 구간 길이 제각각) | 없음 | 번개 심 | 꺾임 자리 바뀜(번쩍임) | 6.0 / 16.0 / 5.3 |
| twinBlades | 6 | 초승 날(지름 13: 종이, 오목한 쪽 먹 등 0.9, 볼록 쪽 안 청록 호) | 날 아래에서 시작해 뒤로 감기는 회전 호(종이 + ink300, 반지름 8 × 6.2, −15까지, 가늘어짐) | 안쪽 날선 | 날이 90° 돎(180° ↔ 270°) | 6.5 / 15.3 / 7.8 |
| ghostVolley | 5 | 속 빈 버들잎 촉(+6.5 ~ −1.2, ink300 1.4 + 종이 α 0.6, 잎맥) + 자루(−10까지, ink300 테 2.2 안의 종이 선 0.9) | 두 갈래 청록 불꽃 깃(먹 테 0.7, −9~−21.5, 긴 혀 위로·짧은 혀 아래로) | 불꽃 깃 | 불꽃 혀가 핥음 | 6.5 / 24.4 / 5.9 |
| headsmanDarts | 4.5 | 외날 칼 머리(앞끝 +6에서 등과 날이 만나는 뾰족한 끝, 위 5.2 / 아래 2.5: 종이 날, 등 먹 띠 약 1.2, 아래 p300) + 자루(먹 1.7 안에 종이 심 0.6, −12까지). **수정 1회차 F3**: 1차는 먹 등이 날 위 40%, 먹 자루 1.6(아이콘과 같은 문법으로 맞춤) | 속도 획 1(−14~−22) | 날선(먹 1.7 위 청록 0.9) | 획 길이 8 / 10.4 | 6.0 / 27.0 / 5.3 |

- 실측은 C7(모든 조각·장 중 최대, 각성 꼬리 1.25배와 반짝임 포함)이다.
- 탄 색 비율(C9, travel 0·1, 종이 / 먹): 먹침 34 / 57~58, 붓깃 33 / 51~52, 인장 화살 34 / 51, 서리침 33~34 / 64~65, 뇌침 26 / 54~55, 쌍날 27 / 58~60, 혼령 17~18 / 21(담묵 46~50), 망나니 침 33~34 / 53~54. 비교: K4 바늘 9 / 59, 부채 단검 32 / 66, 분신 탄 22 / 17. 1차의 먹침 14~15 / 75~77, 망나니 18~19 / 68~71, 인장 화살 종이 20 / 먹 64~66이 위 값으로 바뀌었다(F3·R4).
- 쌍날 탄은 90° 단위(180° ↔ 270°)로만 돈다. 회전한 묶음은 getBBox가 돌린 로컬 상자로 재서 45°이면 앞끝이 9.2로 잡힌다(C7 실패).

## 8. 자가 확인 명령 (지시서 §5.2 + 검수 1차 §7)

결과 PNG는 모두 직접 연다. `--check`를 붙인 명령은 `ok`이고 kit error가 0건이어야 한다. T1~T3, C4·C5·C7·C9~C11, 흑백판은 같은 그림을 여러 번 겹치거나 고정 id 필터를 쓰거나 글자로 결과를 내므로 `--check` 없이 돌린다. 명령 원문은 아래 두 코드 블록에 모두 옮겼다(지시서 줄 번호가 바뀌어도 깨지지 않게).

| 명령 | 이름 | 합격 |
|---|---|---|
| C1 모든 호출 | `k9-c1-all` (`--scale 0.25 --check`) | ok |
| C2 드래프트 크기 | `k9-c2-<kind>` (`--scale 1 --check --crop 0,0,2656,166`, `k="volley"`를 11 kind로) | ok, 산호 점선 네모(낙관 피할 구역) 안에 주 덩어리·개수·과녁·모티프 머리 없음 |
| T1 같은 look | `k9-t1-looks` | 각 줄에서 두 칸이 헷갈리지 않고 핵심 아이콘(점선 칸)과도 갈림 |
| T2 같은 kind | `k9-t2-kinds`, `k9-t2-kinds-awakened`(`AW=true`) | 32px 흑백에서 모두 갈리고 20px 흑백에서 주 덩어리가 서로 다름 |
| T3 섞은 20px | `k9-t3-blind20` → `k9-t3-key` | 검수자가 §4 표만 보고 44종 중 40종 이상 |
| C4 색·글자·해칭·청록 | `k9-c4-scan` | `icons bad=0 text=0 hatch=0 nocyan=0` / `stamps bad=0 text=0 filter=0 nocyan=0 colours={}` |
| C5 바뀌면 안 되는 출력 | `k9-c5-unchanged` | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18` |
| C6 탄 시트 | `k9-c6-shots` (`--scale 1`과 `--scale 6`, `--check`) | ok, 같은 kind 줄이 1배 실루엣으로 갈림 |
| C7 META·잘못된 호출·탄 규격 | `k9-c7-meta` | `meta ok \| invalid calls ok \| core list=17`, 탄 22줄 모두 ok |
| C8 1배 전투 장면 | `k9-c8-scene` (`--scale 1`·`0.8`·`3`, `--check`), 흑백 `k9-c8-scene-gray` | 모든 탄이 '밝은 몸 + 청록', 적 탄(먹 알 + 산호 테)과 갈림 |
| C9 탄 색 비율 | `k9-c9-paper` | 먹침·망나니 침 travel 0·1이 종이 25% 이상, 먹 60% 이하(검수 F3). 나머지는 먹 65%를 넘으면 다시 본다 |
| C10 아이콘 창 먹 면적 | `k9-c10-ink` | 15~55%(지시서 §2.2, 3차 T3 때 판정). `<use>`·clip·필터는 무시하는 근사다(§10) |
| C11 32px 청록 | `k9-c11-cyan32` | volley 8종 모두 32px 색에서 청록 한 점 이상 |
| C12 volley 탄만 1배 장면 | `k9-c12-volley-scene` (`--check`), 흑백 `-gray` | 몸의 가장 큰 덩어리가 종이로 읽힘(T4 근거) |
| 망나니 8배 | `k9-fix-headsman-x8` | 곧은 등·뾰족한 끝의 '자루에 꽂힌 외날', 두 먹귀에 수염·부리·얼굴 없음 |

```
node scripts/art-review-sheet.mjs expr --name k9-c1-all --scale 0.25 --check --expr '(function(){var X=PN.arsenal,s="",n=0;function put(m){s+="<g transform=\"translate("+(n%12)*170+","+Math.floor(n/12)*170+")\">"+m+"</g>";n++;}X.ids.forEach(function(id){[false,true].forEach(function(a){put(X.tile(id,{awakened:a,metal:true,size:150}));put("<g transform=\"scale(1.4)\">"+X.hudSlot(id,{size:40,awakened:a})+"</g>");put("<g transform=\"scale(1.2)\">"+X.skill(id,{awakened:a})+"</g>");});});X.shots.forEach(function(id){var b="";X.parts(id).forEach(function(p,i){for(var f=0;f<p.frames;f++)b+="<g transform=\"translate("+(f*70)+","+(i*26)+")\">"+X.stamp(id,p.part,{frame:f})+"</g>";});put(b);});return s;})()'
node scripts/art-review-sheet.mjs expr --name k9-c2-volley --scale 1 --check --crop 0,0,2656,166 --expr '(function(){var X=PN.arsenal,k="volley",L=X.ids.filter(function(id){return X.META[id].kind===k;}),s="<rect width=\"2656\" height=\"166\" fill=\"#fbfaf5\"/>";L.forEach(function(id,i){[false,true].forEach(function(a,j){var x=(i*2+j)*166;s+="<g transform=\"translate("+(x+8)+",8)\">"+X.tile(id,{awakened:a,metal:true,size:150})+"</g>";if(!a)s+="<rect x=\""+(x+111)+"\" y=\"23\" width=\"32\" height=\"32\" fill=\"none\" stroke=\"#ef5b4f\" stroke-width=\"1\" stroke-dasharray=\"3 2\"/>";});});return s;})()'
node scripts/art-review-sheet.mjs expr --name k9-t1-looks --scale 1 --crop 0,0,720,1380 --expr '(function(){var X=PN.arsenal,G={},order=[];X.ids.forEach(function(id){var l=X.META[id].look;if(!G[l]){G[l]=[];order.push(l);}G[l].push(id);});var s="<rect width=\"720\" height=\"1380\" fill=\"#b8ac93\"/>",g="";order.forEach(function(l,row){var y=8+row*124;s+="<text x=\"4\" y=\""+(y+10)+"\" font-size=\"10\" font-family=\"monospace\">"+l+"</text>";[["core",l]].concat(G[l].map(function(id){return ["ars",id];})).forEach(function(it,i){var m=it[0]==="core"?PN.icons.hudSlot(it[1],{size:40}):X.hudSlot(it[1],{size:40}),x=96+i*44;if(it[0]==="core")s+="<rect x=\""+(x-2)+"\" y=\""+(y-2)+"\" width=\"46\" height=\"120\" fill=\"none\" stroke=\"#101312\" stroke-width=\"1\" stroke-dasharray=\"3 2\"/>";s+="<g transform=\"translate("+x+","+y+") scale(0.80357)\">"+m+"</g>";g+="<g transform=\"translate("+x+","+(y+48)+") scale(0.80357)\">"+m+"</g><g transform=\"translate("+x+","+(y+94)+") scale(0.5)\">"+m+"</g>";});});return s+"<defs><filter id=\"k9g1\"><feColorMatrix type=\"saturate\" values=\"0\"/></filter></defs><g filter=\"url(#k9g1)\">"+g+"</g>";})()'
node scripts/art-review-sheet.mjs expr --name k9-t2-kinds --scale 1 --crop 0,0,460,1380 --expr '(function(){var X=PN.arsenal,AW=false,G={},order=[];X.ids.forEach(function(id){var k=X.META[id].kind;if(!G[k]){G[k]=[];order.push(k);}G[k].push(id);});var s="<rect width=\"460\" height=\"1380\" fill=\"#b8ac93\"/>",g="";order.forEach(function(k,row){var y=8+row*124;s+="<text x=\"4\" y=\""+(y+10)+"\" font-size=\"10\" font-family=\"monospace\">"+k+"</text>";G[k].forEach(function(id,i){var x=70+i*44,m=X.hudSlot(id,{size:40,awakened:AW});s+="<g transform=\"translate("+x+","+y+") scale(0.80357)\">"+m+"</g>";g+="<g transform=\"translate("+x+","+(y+48)+") scale(0.80357)\">"+m+"</g><g transform=\"translate("+x+","+(y+94)+") scale(0.5)\">"+m+"</g>";});});return s+"<defs><filter id=\"k9g2\"><feColorMatrix type=\"saturate\" values=\"0\"/></filter></defs><g filter=\"url(#k9g2)\">"+g+"</g>";})()'
node scripts/art-review-sheet.mjs expr --name k9-t3-blind20 --scale 1 --crop 0,0,310,136 --expr '(function(){var X=PN.arsenal,ids=X.ids.slice(),r=7;for(var i=ids.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1),t=ids[i];ids[i]=ids[j];ids[j]=t;}var g="";ids.forEach(function(id,i){g+="<g transform=\"translate("+(6+(i%11)*27)+","+(6+Math.floor(i/11)*31)+") scale(0.5)\">"+X.hudSlot(id,{size:40})+"</g>";});return "<rect width=\"310\" height=\"136\" fill=\"#b8ac93\"/><defs><filter id=\"k9g3\"><feColorMatrix type=\"saturate\" values=\"0\"/></filter></defs><g filter=\"url(#k9g3)\">"+g+"</g>";})()'
node scripts/art-review-sheet.mjs expr --name k9-t3-key --scale 1 --crop 0,0,1110,90 --expr '(function(){var X=PN.arsenal,ids=X.ids.slice(),r=7;for(var i=ids.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1),t=ids[i];ids[i]=ids[j];ids[j]=t;}return "<rect width=\"1110\" height=\"90\" fill=\"#fff\"/>"+ids.map(function(id,i){return "<text x=\""+(4+(i%11)*100)+"\" y=\""+(16+Math.floor(i/11)*20)+"\" font-size=\"10\" font-family=\"monospace\">"+(i+1)+" "+id+"</text>";}).join("");})()'
```

C4~C8(지시서 §5.2), C9~C12와 망나니 8배(검수 1차 §7):

```
node scripts/art-review-sheet.mjs expr --name k9-c4-scan --scale 1 --crop 0,0,1700,60 --expr '(function(){var X=PN.arsenal,OK={"#121110":1,"#2b2926":1,"#46423d":1,"#8c8579":1,"#bcb4a5":1,"#faf6ec":1,"#f3eee2":1,"#d8d0c0":1,"#00a8c6":1,"#007c94":1,"#cff6ff":1,"#000000":1,"#ffffff":1},bad={},ib=0,it=0,ih=0,inc=[],sb=0,st=0,sf=0,snc=[];function scan(m){var b=0;(m.match(/#[0-9a-fA-F]{6}\b/g)||[]).forEach(function(c){c=c.toLowerCase();if(!OK[c]){b++;bad[c]=(bad[c]||0)+1;}});return b;}X.ids.forEach(function(id){[false,true].forEach(function(a){var m=X.skill(id,{awakened:a});ib+=scan(m);it+=(m.match(/<text/g)||[]).length;ih+=(m.match(/<pattern[^>]*><rect/g)||[]).length;if(!/#00a8c6/i.test(m))inc.push(id+(a?"*":""));});});X.shots.forEach(function(id){X.parts(id).forEach(function(p){for(var f=0;f<p.frames;f++){var m=X.stamp(id,p.part,{frame:f});sb+=scan(m);st+=(m.match(/<text/g)||[]).length;sf+=(m.match(/<filter|Gradient|feTurbulence|feGaussianBlur|mix-blend/g)||[]).length;if(p.part.indexOf("end")!==0&&!/#00a8c6/i.test(m))snc.push(id+"/"+p.part+f);}});});return "<rect width=\"1700\" height=\"60\" fill=\"#fff\"/><text x=\"4\" y=\"22\" font-size=\"13\" font-family=\"monospace\">icons bad="+ib+" text="+it+" hatch="+ih+" nocyan="+inc.length+" "+inc.join(",")+"</text><text x=\"4\" y=\"44\" font-size=\"13\" font-family=\"monospace\">stamps bad="+sb+" text="+st+" filter="+sf+" nocyan="+snc.length+" "+snc.slice(0,12).join(",")+" colours="+JSON.stringify(bad).replace(/\x22/g,"")+"</text>";})()'
node scripts/art-review-sheet.mjs expr --name k9-c5-unchanged --scale 1 --crop 0,0,1500,40 --expr '(function(){var X=PN.arsenal;X.ids.forEach(function(id){[false,true].forEach(function(a){X.skill(id,{awakened:a});X.tile(id,{awakened:a,metal:true,size:150});X.hudSlot(id,{size:40,awakened:a});});});X.shots.forEach(function(id){X.parts(id).forEach(function(p){for(var f=0;f<p.frames;f++)X.stamp(id,p.part,{frame:f});});});function norm(m){return m.replace(/\b(ki|ksv|hk)\d+/g,"$1");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}var I=PN.icons,B="",V="";I.list().forEach(function(id){[false,true].forEach(function(aw){B+=norm(I.skill(id,{awakened:aw}))+norm(I.skill(id,{awakened:aw,size:40,pitchFor:40}))+norm(I.tile(id,{awakened:aw,metal:true,size:150}))+norm(I.hudSlot(id,{size:40,level:3,cooldown:0.4,awakenReady:aw}));});});I.RARITY.forEach(function(r){[false,true].forEach(function(aw){B+=norm(I.frame(r,{awakened:aw,metal:true,size:150}))+norm(I.frame(r,{awakened:aw,metal:false}));});});var S=PN.skillVfx;S.groups.forEach(function(g){S.parts(g).forEach(function(p){V+=JSON.stringify(p);for(var f=0;f<p.frames;f++)V+=norm(S.stamp(g,p.part,{frame:f}));});});V+=JSON.stringify(S.SPEC);return "<rect width=\"1500\" height=\"40\" fill=\"#fff\"/><text x=\"4\" y=\"26\" font-size=\"15\" font-family=\"monospace\">icons-all="+h(B)+" len="+B.length+" list="+I.list().length+" ICON="+Object.keys(PN._ki.ICON).length+" | skillvfx-all="+h(V)+" len="+V.length+" groups="+S.groups.length+"</text>";})()'
node scripts/art-review-sheet.mjs expr --name k9-c6-shots --scale 1 --check --crop 0,0,760,560 --expr '(function(){var X=PN.arsenal,G={},order=[];X.shots.forEach(function(id){var k=X.META[id].kind;if(!G[k]){G[k]=[];order.push(k);}G[k].push(id);});var s="<rect width=\"760\" height=\"560\" fill=\"#b8ac93\"/>";order.forEach(function(k,row){G[k].forEach(function(id,i){var r=X.META[id].r,P={},x=60+i*86;X.parts(id).forEach(function(p){P[p.part]=p;});s+="<text x=\""+(x-40)+"\" y=\""+(8+row*110)+"\" font-size=\"6\" font-family=\"monospace\">"+id+"</text>";[["travel",0],["travel-awakened",0],["start",0],["end",1]].forEach(function(q,j){var p=P[q[0]],y=22+row*110+j*24;s+="<g transform=\"translate("+(x-p.anchor[0])+","+(y-p.anchor[1])+")\">"+X.stamp(id,q[0],{frame:q[1]})+"</g><circle cx=\""+x+"\" cy=\""+y+"\" r=\""+r+"\" fill=\"none\" stroke=\"#ef5b4f\" stroke-width=\"0.5\" stroke-dasharray=\"1.5 1.5\"/>";});});});return s;})()'
node scripts/art-review-sheet.mjs expr --name k9-c7-meta --scale 1 --crop 0,0,1500,560 --expr '(function(){var X=PN.arsenal,E={inkDarts:"volley needleStorm common 4",brushQuills:"volley fanKnives common 5",sealArrows:"volley needleStorm rare 6",frostNeedles:"volley needleStorm rare 4.5",thunderNeedles:"volley needleStorm rare 4.5",twinBlades:"volley fanKnives common 6",ghostVolley:"volley mirrorClone epic 5",headsmanDarts:"volley needleStorm legendary 4.5",paperStorm:"burst fanKnives rare 5",inkBloom:"burst needleStorm rare 4.5",thornHalo:"burst needleStorm epic 4",starShards:"burst mirrorClone epic 5.5",sunNeedles:"burst needleStorm mythic 5",inkDrizzle:"spray needleStorm common 3.5",pinHail:"spray fanKnives rare 4.5",tailGuard:"rear fanKnives common 5",smokeTail:"rear needleStorm rare 4.5",gravePins:"rear needleStorm epic 4.5",trackingSeals:"seeker needleStorm rare 4.5",huntersMarks:"seeker mirrorClone epic 5",crowFeathers:"seeker fanKnives rare 5",bossbane:"seeker needleStorm legendary 5.5",inkLightning:"strike chainSpark rare 0",brushDownpour:"strike boneMortar epic 0",fallingScroll:"strike boneMortar epic 0",seventhSeal:"strike voidMine mythic 0",inkPulse:"nova boneMortar common 0",frostRing:"nova blackSun rare 0",thunderclap:"nova chainSpark epic 0",silenceBell:"nova voidMine legendary 0",inkPots:"lob boneMortar common 0",clusterPots:"lob boneMortar rare 0",tarJar:"lob voidMine epic 0",meteorBrush:"lob boneMortar legendary 0",sparkThread:"chain chainSpark common 0",stormThread:"chain chainSpark epic 0",frostChainlet:"chain chainSpark rare 0",inkLance:"beam railSpear rare 0",wideBrush:"beam frostLine epic 0",crossStrokes:"beam railSpear epic 0",judgmentLine:"beam railSpear mythic 0",inkOrbit:"halo orbitScythes common 0",wardRing:"halo eclipseStep rare 0",eclipseHalo:"halo eclipseStep legendary 0"},NS="http://www.w3.org/2000/svg",NAMES=["start","travel","end","start-awakened","travel-awakened","end-awakened"],L=[],b0=[],ids=Object.keys(E);if(X.ids.join()!==ids.join())b0.push("ids order");ids.forEach(function(id){var v=E[id].split(" "),m=X.META[id]||{},r=+v[3];if(m.kind!==v[0]||m.look!==v[1]||m.rarity!==v[2])b0.push(id+" meta");if(r>0?m.r!==r:!!m.r)b0.push(id+" r");if((r>0)!==(X.shots.indexOf(id)>=0))b0.push(id+" shots");});var inv=0;[function(){X.tile("nope",{});},function(){X.hudSlot("nope",{});},function(){X.skill("nope",{});},function(){X.parts("inkPulse");},function(){X.stamp("inkDarts","dance",{frame:0});}].forEach(function(fn){try{fn();}catch(e){inv++;}});L.push("meta "+(b0.length?"FAIL "+b0.slice(0,8).join(", "):"ok")+" | invalid calls "+(inv===5?"ok":"FAIL "+inv+"/5")+" | core list="+PN.icons.list().length);function bb(m){var s=document.createElementNS(NS,"svg");s.innerHTML=m;document.body.appendChild(s);var b=s.getBBox();s.remove();return b;}X.shots.forEach(function(id){var r=X.META[id].r,bad=[],ps=X.parts(id),names=ps.map(function(p){return p.part;});if(ps.length!==6||NAMES.some(function(n){return names.indexOf(n)<0;}))bad.push("parts="+names.join("/"));var fm=-99,bm=0,ym=0;ps.forEach(function(p){if(p.frames!==2)bad.push(p.part+" frames"+p.frames);var lp=p.part.indexOf("travel")===0;if(p.drive!==(lp?"loop":"prog")||p.rotate!=="vel"||p.layer!=="ally"||p.lod!=="info"||(lp&&(p.fps!==12||p.still!==0)))bad.push(p.part+" meta");for(var f=0;f<p.frames;f++){var b=bb(X.stamp(id,p.part,{frame:f})),ax=p.anchor[0],ay=p.anchor[1],fr=b.x+b.width-ax,bk=ax-b.x,yh=Math.max(ay-b.y,b.y+b.height-ay);if(b.x<3||b.y<3||b.x+b.width>p.box[0]-3||b.y+b.height>p.box[1]-3)bad.push(p.part+f+" margin");if(fr<r-0.5||fr>r+2.5)bad.push(p.part+f+" front "+fr.toFixed(1));if(bk>8*r)bad.push(p.part+f+" back "+bk.toFixed(1));if(yh>r+2.5)bad.push(p.part+f+" side "+yh.toFixed(1));fm=Math.max(fm,fr);bm=Math.max(bm,bk);ym=Math.max(ym,yh);}});L.push(id+" r="+r+" front="+fm.toFixed(1)+" back="+bm.toFixed(1)+" side="+ym.toFixed(1)+"  "+(bad.length?"FAIL "+bad.slice(0,6).join(", ")+(bad.length>6?" +"+(bad.length-6):""):"ok"));});return "<rect width=\"1500\" height=\"560\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(18+i*22)+"\" font-size=\"12\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
node scripts/art-review-sheet.mjs expr --name k9-c8-scene --scale 1 --check --crop 0,0,640,360 --expr '(function(){var X=PN.arsenal,s=PN.env.ground(1,640,360,3,{center:null,canalY:false,rose:null,ringC:null});function en(r,x,y,fl,f){var m=PN.enemies.meta(1,r),k=m.displayScale*{stalker:0.9,charger:0.963,shooter:0.783,warden:1}[r];return "<ellipse cx=\""+x+"\" cy=\""+y+"\" rx=\""+m.r+"\" ry=\""+(m.r*0.42)+"\" fill=\"#101312\" opacity=\"0.3\"/><g transform=\"translate("+(fl?x+m.feet[0]*k:x-m.feet[0]*k)+","+(y-m.feet[1]*k)+") scale("+(fl?-k:k)+","+k+")\">"+PN.enemies.draw(1,r,{lod:"game",frame:f})+"</g>";}function es(x,y,r){return "<circle cx=\""+x+"\" cy=\""+y+"\" r=\""+(r+1.2)+"\" fill=\"#101312\"/><circle cx=\""+x+"\" cy=\""+y+"\" r=\""+r+"\" fill=\"#ef5b4f\"/><circle cx=\""+x+"\" cy=\""+y+"\" r=\""+(r-2.4)+"\" fill=\"#101312\"/><circle cx=\""+(x-1)+"\" cy=\""+(y-1)+"\" r=\"1.2\" fill=\"#fffff8\"/>";}s+=en("stalker",120,96,false,0)+en("charger",470,116,true,1)+en("shooter",560,250,true,0)+en("warden",200,300,false,1)+en("stalker",400,316,true,2)+en("stalker",300,70,true,1);s+=es(380,200,7)+es(420,172,7)+es(460,146,8)+es(250,330,7);s+=PN.heroKit.placeSprite("run",2,320,210,1);X.shots.forEach(function(id,i){var P={};X.parts(id).forEach(function(p){P[p.part]=p;});var p=P[i%3===0?"travel-awakened":"travel"],a=(i*47)%360,x=50+(i%8)*76,y=36+Math.floor(i/8)*120+((i*37)%40);s+="<g transform=\"translate("+x+","+y+") rotate("+a+") translate("+(-p.anchor[0])+","+(-p.anchor[1])+")\">"+X.stamp(id,p.part,{frame:0})+"</g>";});return s;})()'
```

```
node scripts/art-review-sheet.mjs expr --name k9-c9-paper --scale 1 --crop 0,0,1400,420 --expr '(function(){var X=PN.arsenal,S=PN.skillVfx,NS="http://www.w3.org/2000/svg",L=[];var C={"#faf6ec":"p","#f3eee2":"p","#d8d0c0":"p","#fffff8":"p","#121110":"k","#2b2926":"k","#46423d":"k","#101312":"k","#8c8579":"t","#bcb4a5":"t","#00a8c6":"c","#007c94":"c","#cff6ff":"c"};function hex(v){var m=v.match(/[\d.]+/g);if(!m)return v;return "#"+m.slice(0,3).map(function(x){return ("0"+Math.round(+x).toString(16)).slice(-2);}).join("");}function meas(mk,box){var s=document.createElementNS(NS,"svg");s.setAttribute("width",box[0]);s.setAttribute("height",box[1]);s.innerHTML=mk;document.body.appendChild(s);var els=[].slice.call(s.querySelectorAll("path,circle,ellipse,rect,polygon,polyline,line")).filter(function(e){return !e.closest("clipPath,defs,mask,pattern");});var info=els.map(function(e){var cs=getComputedStyle(e);return {e:e,inv:e.getCTM().inverse(),st:cs.stroke!=="none"&&parseFloat(cs.strokeWidth)>0?hex(cs.stroke):null,fi:cs.fill!=="none"?hex(cs.fill):null};}).reverse();var n={p:0,k:0,t:0,c:0,x:0},st=0.25,pt=s.createSVGPoint();for(var y=0;y<box[1];y+=st)for(var x=0;x<box[0];x+=st){pt.x=x;pt.y=y;for(var i=0;i<info.length;i++){var q=info[i],lp=pt.matrixTransform(q.inv),col=null;if(q.st&&q.e.isPointInStroke(lp))col=q.st;else if(q.fi&&q.e.isPointInFill(lp))col=q.fi;if(col){n[C[col]||"x"]++;break;}}}s.remove();var tot=n.p+n.k+n.t+n.c+n.x;return "paper "+Math.round(100*n.p/tot)+"% ink "+Math.round(100*n.k/tot)+"% ink300 "+Math.round(100*n.t/tot)+"% cyan "+Math.round(100*n.c/tot)+"% other "+Math.round(100*n.x/tot)+"% (area "+(tot*st*st).toFixed(0)+")";}X.ids.filter(function(id){return X.META[id].done;}).forEach(function(id){var P={};X.parts(id).forEach(function(p){P[p.part]=p;});[["travel",0],["travel",1],["start",1],["end",0]].forEach(function(q){L.push(id+" "+q[0]+q[1]+": "+meas(X.stamp(id,q[0],{frame:q[1]}),P[q[0]].box));});});[["needleStorm","travel"],["fanKnives","travel"],["mirrorClone","shot-travel"]].forEach(function(g){var p=S.parts(g[0]).filter(function(x){return x.part===g[1];})[0];L.push("K4 "+g[0]+" "+g[1]+"0: "+meas(S.stamp(g[0],g[1],{frame:0}),p.box));});return "<rect width=\"1400\" height=\"420\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(12+i*11.6)+"\" font-size=\"10\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
node scripts/art-review-sheet.mjs expr --name k9-c10-ink --scale 1 --crop 0,0,1300,160 --expr '(function(){var X=PN.arsenal,I=PN.icons,NS="http://www.w3.org/2000/svg",L=[];var C={"#faf6ec":"p","#f3eee2":"p","#d8d0c0":"p","#fffff8":"p","#efe6d2":"p","#121110":"k","#2b2926":"k","#46423d":"k","#101312":"k","#000000":"k","#8c8579":"t","#bcb4a5":"t","#00a8c6":"c","#007c94":"c","#cff6ff":"c"};function hex(v){if(!v||v.indexOf("url")>=0)return "url";var m=v.match(/[\d.]+/g);if(!m)return v;return "#"+m.slice(0,3).map(function(x){return ("0"+Math.round(+x).toString(16)).slice(-2);}).join("");}function meas(mk){var s=document.createElementNS(NS,"svg");s.setAttribute("width",128);s.setAttribute("height",128);s.innerHTML=mk;document.body.appendChild(s);var info=[];[].slice.call(s.querySelectorAll("path,circle,ellipse,rect,polygon,polyline,line")).forEach(function(e){if(e.closest("clipPath,defs,mask,pattern"))return;if(e.tagName==="rect"&&e.getAttribute("filter"))return;var cs=getComputedStyle(e),m=e.getCTM(),b=e.getBBox(),sw=parseFloat(cs.strokeWidth)||0;var P=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(function(p){var q=s.createSVGPoint();q.x=p[0];q.y=p[1];return q.matrixTransform(m);});var xs=P.map(function(p){return p.x;}),ys=P.map(function(p){return p.y;}),pad=sw*2+1;info.push({e:e,inv:m.inverse(),x0:Math.min.apply(0,xs)-pad,x1:Math.max.apply(0,xs)+pad,y0:Math.min.apply(0,ys)-pad,y1:Math.max.apply(0,ys)+pad,st:cs.stroke!=="none"&&sw>0?hex(cs.stroke):null,fi:cs.fill!=="none"?hex(cs.fill):null});});info.reverse();var n={p:0,k:0,t:0,c:0,x:0},pt=s.createSVGPoint();for(var y=0.5;y<128;y+=1)for(var x=0.5;x<128;x+=1){pt.x=x;pt.y=y;for(var i=0;i<info.length;i++){var q=info[i];if(x<q.x0||x>q.x1||y<q.y0||y>q.y1)continue;var lp=pt.matrixTransform(q.inv),col=null;if(q.st&&q.e.isPointInStroke(lp))col=q.st;else if(q.fi&&q.e.isPointInFill(lp))col=q.fi;if(col){n[C[col]||"x"]++;break;}}}s.remove();var T=n.p+n.k+n.t+n.c+n.x;function pc(v){return Math.round(100*v/T)+"%";}return "ink "+pc(n.k)+" paper "+pc(n.p)+" ink300 "+pc(n.t)+" cyan "+pc(n.c)+" other "+pc(n.x);}X.ids.filter(function(id){return X.META[id].done;}).forEach(function(id){L.push(id+": "+meas(X.skill(id,{})));});["needleStorm","fanKnives","mirrorClone","railSpear"].forEach(function(id){L.push("core "+id+": "+meas(I.skill(id,{})));});return "<rect width=\"1300\" height=\"160\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(12+i*12)+"\" font-size=\"10\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
node scripts/art-review-sheet.mjs expr --name k9-c11-cyan32 --scale 1 --crop 0,0,400,48 --expr '(function(){var X=PN.arsenal,I=PN.icons,s="<rect width=\"400\" height=\"48\" fill=\"#efe6d2\"/>",L=[["c","needleStorm"],["c","fanKnives"],["c","mirrorClone"],["a","inkDarts"],["a","brushQuills"],["a","sealArrows"],["a","frostNeedles"],["a","thunderNeedles"],["a","twinBlades"],["a","ghostVolley"],["a","headsmanDarts"]];L.forEach(function(it,i){var m=it[0]==="c"?I.hudSlot(it[1],{size:40}):X.hudSlot(it[1],{size:40});s+="<g transform=\"translate("+(4+i*36)+",3) scale(0.80357)\">"+m+"</g>";});return s;})()'
node scripts/art-review-sheet.mjs expr --name k9-c12-volley-scene --scale 1 --check --crop 0,0,420,130 --expr '(function(){var X=PN.arsenal,S=PN.skillVfx,s=PN.env.ground(1,420,130,3,{center:null,canalY:false,rose:null,ringC:null});function es(x,y,r){return "<circle cx=\""+x+"\" cy=\""+y+"\" r=\""+(r+1.2)+"\" fill=\"#101312\"/><circle cx=\""+x+"\" cy=\""+y+"\" r=\""+r+"\" fill=\"#ef5b4f\"/><circle cx=\""+x+"\" cy=\""+y+"\" r=\""+(r-2.4)+"\" fill=\"#101312\"/><circle cx=\""+(x-1)+"\" cy=\""+(y-1)+"\" r=\"1.2\" fill=\"#fffff8\"/>";}var V=X.ids.filter(function(id){return X.META[id].kind==="volley";});[["travel",20],["travel-awakened",62]].forEach(function(row,ri){V.forEach(function(id,i){var P={};X.parts(id).forEach(function(p){P[p.part]=p;});var p=P[row[0]],a=[0,-30,200,150,30,-120,90,330][i],x=30+i*46,y=row[1]+(i%2)*8;s+="<g transform=\"translate("+x+","+y+") rotate("+a+") translate("+(-p.anchor[0])+","+(-p.anchor[1])+")\">"+X.stamp(id,row[0],{frame:0})+"</g>";});});var np=S.parts("needleStorm").filter(function(x){return x.part==="travel";})[0];s+="<g transform=\"translate(60,108) rotate(-20) translate("+(-np.anchor[0])+","+(-np.anchor[1])+")\">"+S.stamp("needleStorm","travel",{frame:0})+"</g>";var fp=S.parts("fanKnives").filter(function(x){return x.part==="travel";})[0];s+="<g transform=\"translate(130,108) rotate(15) translate("+(-fp.anchor[0])+","+(-fp.anchor[1])+")\">"+S.stamp("fanKnives","travel",{frame:0})+"</g>";s+=es(200,108,7)+es(240,104,7)+es(280,110,8)+PN.heroKit.placeSprite("run",2,360,118,1);return s;})()'
node scripts/art-review-sheet.mjs expr --name k9-fix-headsman-x8 --scale 8 --crop 50,40,230,90 --expr '(function(){var X=PN.arsenal;return "<g>"+X.skill("headsmanDarts",{})+"</g><g transform=\"translate(148,0)\">"+X.skill("headsmanDarts",{awakened:true})+"</g>";})()'
```

- C6은 같은 명령을 `--scale 6`(이름 `-x6`)으로도 돌린다. C8은 `--scale 0.8`(`-08`)·`--scale 3`(`-x3`)으로도 돌린다.
- C8·C12 흑백판: 끝의 `return s;`를 `return "<defs><filter id=\"k9g8\"><feColorMatrix type=\"saturate\" values=\"0\"/></filter></defs><g filter=\"url(#k9g8)\">"+s+"</g>";`로 바꾸고(C12는 필터 id만 `k9g12`로), 이름 끝에 `-gray`를 붙여 `--check` 없이 돌린다.
- C9·C10은 필터·clip·`<use>`·묶음 opacity를 무시하는 근사 측정이다. 망나니 침 아이콘은 찢긴 먹귀가 `<use>`라 C10에서 빠진다.

리뷰 도우미로 한 kind만 빨리 볼 때: `--expr "PN.arsenal.sheet({kind:'volley'})"`, `--expr "PN.arsenal.shotSheet({kind:'volley'})"`(둘 다 `--check` 통과).

## 9. 지시서와 다르게 한 것

### 9.1 1차 (납품서 §4.2와 같은 번호, 검수 1차에서 모두 수용)

1. **먹 바탕 추가**: §3.4에 없는 먹 바탕을 넷에 더했다. 흰 모티프는 종이 위에서 20px에 사라져서(지시서 §0.2 서리발 시안과 같은 이유) 먹 위에 얹었다. 붓깃 = 다발 밑 마른 붓 획, 서리침 = 오른쪽 아래 언 땅, 혼령 일제사격 = 왼쪽 아래 부채꼴 번짐, 먹침 = 다트 뒤 마른 붓 꼬리. 놓는 자리를 무기마다 달리해 20px에서 서로 갈리게 했다. 검수 조건: 2·3차에서 rear(왼쪽 부채)·spray(왼쪽 아래 발원)·lob(왼쪽 아래 출발)와 20px에서 겹치는지 T2·T3로 다시 본다.
2. **벌어짐 각**: 붓깃 ±8° → ±7°(14°), 혼령 일제사격 ±12° → 약 ±10°(20.5°). volley 틀 '벌어짐 ≤ 14°'와 무기 지시가 부딪쳐서 붓깃은 틀을 지키고, 혼령 일제사격은 부채로 읽히는 선에서 줄였다(지시서는 메인 세션이 고친다: 혼령만 22° 이하 예외).
3. **혼령 화살 촉(아이콘)**: 종이 α 0.6으로 채우면 120px에서 버들잎이 숟가락처럼 메워져 α 0.35 + 종이 안쪽 선 + 잎맥으로 바꿨다(탄은 α 0.6 그대로).
4. **혼령 탄의 자루**: 'ink300 1.2' 대신 ink300 테 2.2 안의 종이 선 0.9다. 종이 선과 담묵 테로 1배에서 밝게 보이게 했다. (1차 문서의 '몸의 종이 40% 이상'은 측정과 달라 고쳤다: C9 종이 17~19%, 담묵 46~52%.)
5. **뇌침 번개 굵기**: 아이콘 번개를 먹 8 → 15.5(세 계단)로 두껍게 했다(지시서 '먹 11'). 20px에서 망나니 침의 곧은 자루와 갈리게 하려는 것이고 먹 : 청록 : 종이 비율(1 : 0.5 : 0.17)은 그대로다.
6. **망나니 칼 머리 크기**: 1.12배(지시서 '날 26~32')로 키웠다. 20px 주 덩어리(짧은 변 ≥ 14)를 맞추려는 것이다. 자리는 지시서 (70~96, 46~78)보다 조금 왼쪽 아래다. 낙관 구역에는 닿지 않는다(수정 1회차 뒤 자리는 §9-13).
7. **찢김선**: 찢긴 가장자리에 종이 테를 두르면 들쭉날쭉한 선과 함께 이빨(웃는 입)로 읽혀서 테를 빼고 벌어진 틈의 종이만 보이게 했다. 깔끔한 절단면은 없다.
8. **쌍날의 긴 먹 꼬리 제거**: 날마다 긴 먹 꼬리를 끌면 두 꼬리가 왼쪽에서 만나 '<'가 되어 뺐다. 블랙 스팟은 날의 그림자와 먹 등이 맡는다.
9. **인장 꼭지(돔) 제거**: 옆에서 본 인장 꼭지를 달면 손잡이 달린 컵처럼 읽혀서 빼고, 몸에 홈 한 줄을 넣었다.

### 9.2 수정 1회차에 더한 것 (검수 1차 뒤)

10. **서리침 서릿발 8개**(지시서 5~7, 검수 R8): 그대로 두고 적는다. 먹귀 아래 절반을 덮어 20px 주 덩어리('검은 몸 위 흰 서릿발')를 만들려는 수다.
11. **블랙 스팟 보강**(검수 R1): 인장 화살 = 먹 꼬리를 굵히고 맨 앞 먹귀의 끌림 획을 2배로, 뇌침 = 과녁 뒤 탄 자국 + 번개 그림자 쪽 먹 사본 + 종이 끊김 호, 망나니 침 = 먹귀 아래 땅의 먹 튐 + 자루 5 → 6. 모두 지시서 §3.4에 없는 요소다(1번과 같은 근거, 지시서 §2.2). 낙관 구역과 왼쪽 아래(다른 kind 자리)는 피했다.
12. **망나니 먹 튐**(검수 F2): 처방은 찢김선 t ≈ −0.9·−0.2·+0.5·+1.1 r의 네 가닥(위 조각은 위로, 아래 조각은 아래로)이었다. 위 조각에서 위로 던진 가닥은 머리 꼭대기에서 나와 뿔·더듬이로 읽혀서(각성판 둘째 먹귀는 벌레 얼굴) 빼고, 아래 조각에서 세 가닥(t −0.75·0.15·0.9 r)을 떨어뜨렸다. 위 조각은 벌어진 틈이 찢김을 보여 준다. +1.1 r은 먹귀 윤곽 밖이라 0.9 r로 당겼다. 가닥은 찢김선에서 수직으로 그은 선이 윤곽을 나가는 자리에서 시작한다(몸 안에서 시작하면 뿔·이마 점으로 보였다).
13. **망나니 칼 머리 자리**: 처방 3(끝 3~4 더)·4(칼 목 x −4~0)만큼 (55~97, 50~84) → 대략 (53~101, 48~84)로 늘었다. 1.12배와 낙관 구역 비움은 그대로다.
14. **각성 탄 겹 테**(검수 R5): '몸 외곽을 x −3 옮긴 모양으로 자른다'를 '테를 x −3 옮긴 외곽선 사본에 두른다'로 했다. 옮긴 외곽선으로 clip하면 테(외곽선 둘레의 획)의 바깥 절반이 모두 잘려 테가 사라진다. 결과(몸 꼴을 따르고 앞끝이 늘지 않음)는 처방과 같고 C7 앞끝 값도 그대로다.
15. **먹침 탄 깃**: 검수 F3는 '깃은 그대로'였지만, 넓힌 종이 몸(반폭 2~2.4 + 외곽 1.5)이 깃을 거의 다 가려 청록 깃이 C9에서 0%가 됐다. 깃 밑동을 몸 가장자리로 옮기고 몸 밖 끝을 3.6 → 4.6으로 늘렸다(꼴·색·자리는 그대로). C7 옆 4.8 → 5.8(허용 6.5).

### 9.3 수정 2회차 (검수 2차 뒤)

16. **각성 망나니 침의 먹귀 둘**(검수 2차 F2b, 각성 아이콘만)
    - 둘째 먹귀를 (90, 106) → (71, 110)으로 옮겼다. 중심 사이는 27.9 → 41.7이고, 종이 테 포함 실루엣 사이는 약 6이다.
    - 작은 칼을 (−2, 111)·−10°·길이 48 → (−4, 111)·−6°·길이 38.6으로 바꿔 칼끝이 둘째 먹귀 윤곽에 닿게 했다.
    - 각성 호출에서는 두 먹귀 모두 먹 튐을 뺐다(`tornGhoul` 옵션 `flicks: false`). 그 대신 평상판과 같은 땅 먹 튐을 ink7로 깐다. 처방 (b)이고, 근거는 지시서 §2.4 각성 규칙이다.
    - (a)(윤곽 안쪽에서 시작하는 뾰족한 가닥 2개 이하) 대신 (b)를 골랐다.
      - 32~45px 각성 슬롯에서는 가닥이 짧아 종이 테에 묻혀 다시 다리처럼 보일 여지가 남는다.
      - (b)는 평상판과 같은 땅 먹 튐 문법이라 두 판이 같은 장면으로 읽힌다.
    - 평상판 아이콘·타일·슬롯과 탄 96장은 바뀌지 않았다(보존 해시 `volley-keep=vko1lv len=992714 | shots=8wzptx len=134704`).
    - 각성 1.1배에서 둘째 먹귀의 아래 끝과 종이 테가 창 아래 가장자리를 조금 넘는다(창 밖 10 안).

## 10. 알려진 한계와 사람 클린업 (바이블 §15)

- 1차라 36종이 자리표시다. T1의 그 칸과 T3 섞은 20px은 아직 정식으로 판정할 수 없다(자리표시가 핵심 그림과 같다).
- **블랙 스팟 면적**(지시서 §2.2, 15~55%): C10(평상판, 창 안 먹)은 먹침 18 · 붓깃 18 · 인장 화살 15 · 서리침 32 · 뇌침 15 · 쌍날 15 · 혼령 19 · 망나니 침 10%다. C10은 `<use>`와 clip을 무시한다. 둘을 반영한 보정 측정(검수 2차 `k9r2-c10u-ink`, 지시서 §5.2 정정안의 `k9-c10u-ink`)으로는 먹침 18.5 · 붓깃 17.4 · 인장 화살 15.4 · 서리침 31.6 · 뇌침 15.4 · 쌍날 12.3 · 혼령 19.3 · 망나니 침 13.9%다. 수정 1회차 문서의 '망나니 침 15.2'는 반쪽 clip이 덜 반영된 값이라 고쳤다. 쌍날은 C10이 날 안쪽 먹 등의 clip을 무시해 크게 잡은 것이라 실제로는 하한 아래다. 망나니 침·쌍날은 검수서 R1대로 3차 T3 때 44종을 함께 보며 정한다.
- 각성판은 20px에서 빌린 틀의 먹 바탕 + 종이 원상이 화면을 거의 채워 무기끼리 차이가 작다. 핵심 아이콘의 각성판도 같다(팀 결정 Q7 때 함께 본다).
- 32px 청록: 쌍날·망나니 침의 날선은 청록 2.4(먹 테 포함 4.8)라 C11에서 보이지만 흐리다. 검수 2차에서 '청록 심 3.2 이상'은 거두었다. 선 요소는 '청록 심 2.4 이상 + 양쪽 먹 1.2 이상, 길이 20 이상'을 기준으로 하며 지금 날선은 합격이다.
- 사람이 다시 그을 것: 44종의 최종 붓 외곽·블랙 스팟·비백(특히 마른 붓 꼬리, 먹 붓질 띠, 서릿발, 찢김선, 번개 꺾쇠), 20~32px 픽셀 다듬기(슬롯 하나를 20~45px에 쓴다), 탄 264장의 1x 픽셀 정리, 문화 검토(인장·종·손·가시·별·바늘꽂이의 최종 꼴, 로어 §1.4). 정식 판독 시험(n ≥ 8)은 하지 않았다.
- 수정 1회차에 더한 사람 클린업(검수서 §9 + 이번에 본 것): 망나니 칼 머리 실루엣, 찢긴 먹귀의 먹 튐과 땅의 먹 튐(킷의 다각형 튐은 꼭짓점이 곧다), 위 조각의 꺾인 끝(8배에서 부리처럼 뾰족해 보일 여지), 서릿발 꼴(흰 꽃잎·불꽃처럼 보일 기미), 뇌침 탄 자국과 종이 끊김 호, 쌍날 각성 배치의 문화 검토(三つ巴·삼태극).
- 기절 나선은 한 획 1.5바퀴라는 지시를 지키면 작은 크기에서 '@'와 닮을 여지가 남는다. 납작하게(0.38) 하고 꼬리를 열어 줄였다(검수 1차에서 사람 클린업으로 넘김).
