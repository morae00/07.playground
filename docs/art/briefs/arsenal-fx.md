# 작업 지시서 K10: 무기 44종의 전장 효과 — 투사체 없는 22종, lob 비행 4종, 각성 기믹 44종 — 새 모듈 `k-arsenal-fx.js` → `PN.arsenalFx`

> 저장할 곳: `docs/art/briefs/arsenal-fx.md`. 작성: art-director, 2026-10-16. 발주: R5 추가 발주 B7, 제작 K10.
> 경로는 모두 저장소 루트(`/Users/kyuukkang/CT_AX/07.playground`) 기준이다.
>
> **사용자 요청(2026-10-15, 원문 일부)**: "공격 및 지형지물 이펙트 고도화 * 경로 등 지시선, 구분선은 현행 괜찮음(돌진 경고 등) … * 추가된 다양한 무기들도 같은계열류 무기들이 있는거 같은데, 시각적으로 구분이 안됨. 좀더 구체적이고 구분되는 이미지로 바꿔줘. * 각성에 대한 기믹이 좀 더 특별했으면 좋겠어."
>
> **근거**
> - 게임 쪽 정의
>   - `src/content/data/arsenal.ts:54-102`: kind·look·수치. 각성 공통 강화는 `:102`
>   - `src/content/data/awakenings.ts:16-72`: 기믹 수치
>   - `docs/decisions/SYS-16-awakening-gimmicks.md`
>   - `src/game/arsenal.ts:13`(`lookOf`)
> - `GameEngine.ts`
>   - 발사·폭발: `fireArsenal` `:2461-2610`, `sweep` `:2613-2620`, `arsenalBlast` `:2626-2630`, `landArsenalLobs` `:2633-2642`, `lobLanded` `:2648-2659`, `after` `:2662`, `echoBlast` `:2678`
>   - 기믹: `addZone` `:2700-2703`, `turnShots` `:2706-2718`, `shotEnded` `:2748-2754`, `sealTriangle` `:2757-2776`, `updateZone` `:2798-2831`, `updateMarks` `:2837-2870`
>   - 피해: `dealDamage` `:5326-5386`, `hitScale` `:5393-5412`, `afterHit` `:5420-5520`
>   - 상태 필드: `TIMED_MARKS` `:603`, `arsenalLobs` `:915`, `later`·`zones` `:924-925`
> - 형식: `src/game/engine/worldTypes.ts`(`AwakenedMarks` `:190-219`, `AwakeningZone` `:222-234`, `BeamEffect` `:421-433`, `ChainEffect` `:447-454`, `SkillMark` `:461-475`), `src/game/engine/events.ts`(`area/blast` `:35`, `enemy/stunned` `:46`)
> - 렌더러
>   - `src/game/render/worldRenderer.ts`: `ZONE_ART` `:93-96`, `MARK_SIGNS` `:98-101`, `BEAM_ART` `:103`, `drawHazards` `:833-849`, `drawOverheads`의 표식 `:1099`, `drawAwakenedMarks` `:1160-1184`, `drawBeams`(연쇄 포함) `:1310-1326`, `drawSkillBeam` `:1333-1352`, `drawSkillMarks`·`drawSkillRing` `:1355-1401`, `ownShot` `:1469-1471`, `drawEnemyBody` `:1526-1561`(불 `:1543`), `drawBurning` `:1704-1733`
>   - `src/game/render/GameRenderer.ts`: `drawHazard` `:604-663`, 기호 `:704-757`, `drawBeam` `:449-490`, `drawChain` `:492-518`
>   - `src/game/render/skillVfx.ts`(K4 페인터 선례), `src/game/render/visualRegistry.ts:199-209`(`HAZARD_ART`)
>   - `src/game/presentation/presentation.ts`: `SKILL_MARK_SECONDS`·`SKILL_MARK_CAP` `:37-38`, `area/blast` `:286-289`, `addSkillMark` `:501-505`
> - 굽기 선례: `art/atlas-spec.mjs:417-438`(skills 팩, `SKILL_VFX_TIMING`), `scripts/build-atlas.mjs:11`(KIT_FILES)·`:152-178`(`readSkillVfx`)·`:183-207`(펼치기), `art/concept-kit/API-skills-vfx.md` §2·§5·§6·§7
> - 같은 물건 기준: K9 지시서 `docs/art/briefs/arsenal-icons.md` §3.1·§3.2·§3.4(strike·nova·lob·chain·beam·halo 22종의 아이콘 모티프), `art/concept-kit/API-icons2.md` §4·§6b
> - 기준 문서
>   - 스타일 바이블 v1 §2.3·§3·§4.2·§5.1·§5.3·§6·§7.2·§9·§10.1·§12·§13·§15
>   - 로어 바이블 §1.3·§1.4·§3.1·§4
>   - 형식 선례: `docs/art/briefs/terrain-hazards.md`(K11), `docs/art/briefs/arsenal-icons.md`(K9), `docs/art/briefs/bombers.md`(K7)
>
> **렌더**
> - 이 지시서를 쓰며 직접 본 렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/b7-*.png`이다. 임시 폴더라 지워질 수 있어서 결론과 수치를 이 문서에 옮겼다.
> - kit-artist의 렌더 이름은 `k10-`로 시작한다.
> - §7.2의 명령은 모두 실제로 돌려 봤다(`b7-test-*`). 모듈이 아직 없어서 `PN.arsenalFx` 자리에 대역(단순 도형을 돌려주는 가짜 모듈)을 넣었고, 아래 명령은 그 대역 줄만 뺀 것이다. C8은 대역 없이 돌려 기준값을 얻었다.
> - "지금 상태" 렌더(`b7-now-*`)는 게임 화면 캡처가 아니다. 렌더러의 캔버스 코드를 SVG로 옮긴 근사다.

## 0. 요약

| 항목 | 내용 |
|---|---|
| 담당 | `kit-artist` K10. 납품서는 응답으로 돌려준다. 메인 세션이 `docs/art/deliveries/K10-arsenal-fx.md`로 저장한다 |
| 새 파일 | `art/concept-kit/k-arsenal-fx.js`(`window.PN.arsenalFx`)와 `art/concept-kit/API-arsenal-fx.md` 두 개다. 이 밖은 고치지 않는다. K9 작업 중인 `k-icons2.js`, K11 작업 중인 `k-hazards.js`, `k-skills-vfx.js`, `k-icons.js`, `lib.js`도 고치지 않는다 |
| 대상 | ① 투사체가 없는 22종(strike·nova·lob·chain·beam·halo)의 전장 효과, 평상과 각성 ② lob 4종의 날아가는 그림 ③ SYS-16 각성 기믹 44종의 전장 그림. ③은 우선순위 P1·P2만 그리고 P3는 선택이다(§4.1) |
| 범위 밖 | 각성 타일·슬롯 아이콘(K9 §11-6), 투사체 22종의 탄(K9), 적·맵 위험지형(K11), 핵심 스킬 17종 VFX(K4), 소리(§11 Q7) |
| 방식 | K4·K11과 같은 혼합이다. 반경·길이·점 목록을 따라가는 것(판정 고리, 띠, 연쇄 선, 땅 채움, 테)은 `SPEC` 숫자로 넘기고 렌더러가 그린다. 물건(족자, 도장, 손, 종, 단지, 붓, 먹통, 까마귀, 묘비 등)은 고정 크기 조각으로 굽는다. `layout`·`paths`·`lobPath`는 렌더러가 TypeScript로 똑같이 옮긴다. 조각은 늘이지 않는다 |
| 핵심 1 | 같은 look을 쓰던 무기가 1배에서 **서로 다른 물건**으로 읽혀야 한다. 무기마다 두 가지를 갖는다. 하나는 K9 아이콘과 같은 물건이고, 다른 하나는 판정 고리·선의 고유한 문체다 |
| 핵심 2 | 기믹마다 **무엇인지** 그림으로 읽혀야 한다. 땅 조각 8종은 물건으로, 적 위 표식은 그림 표식으로, 이어지는 효과는 예고와 이음으로 보인다. 화면 혼잡 상한과 버리는 순서를 지킨다(§4.5, §5.4) |
| 핵심 3 | 아군 문법을 지킨다. 청록·종이·먹만 쓰고 땅 조각의 테는 바느질 점선으로 긋는다. 산호·호박·자수정·연두는 0이다. 결이 늘 가장 밝다. 오래 남는 땅 채움은 Y ≤ 0.62다(§1.7) |
| 예산 | 조각 ≤ 380장(계획 361), 박스 넓이 합 ≤ 640,000 단위²(계획 약 61만), 새 팩 `arsenal-fx`는 2048² 1장(최대 2장), 화면당 조각 그리기 220/140/70(full/reduced/minimal) |
| 합격 | §7의 판독 시험 T1~T7과 명령 C1~C15 |
| 납품 | 세 번에 나눈다(§8). 1은 뼈대와 22종 평상·각성(착탄 포함), 2는 lob 비행, 3은 기믹 P1을 먼저 그리고 이어서 P2다 |

### 0.1 지금 상태 (모두 확인)

| # | 무엇 | 근거 | 결과 |
|---|---|---|---|
| ① | boneMortar look 6종: 먹 파동·붓 폭우·족자 낙하·먹단지·송이 단지·유성 붓 | `b7-now-bonemortar-x1`, `worldRenderer.ts:1387-1399` | 모두 같은 그림이다. 청록 실 고리 + 가운데 흰 뼛가루 구름(반지름 42 고정) + 가루 점이고, 반경만 다르다. 반경 140 고리 가운데의 42짜리 구름은 거의 보이지 않는다 |
| ② | voidMine·blackSun·chainSpark look의 폭발 | `b7-now-void-sun-chain-x1` | 일곱째 인장·침묵의 종·타르 항아리는 검은 바람개비(무음 지뢰 붕괴) + 실 고리다. 서리 고리는 검은 원반 + 흰 코로나(검은 태양 붕괴)라 서리로 읽히지 않는다. 먹번개·천둥 박수는 작은 종이 별 + 실 고리다 |
| ③ | chain 3종 | `b7-now-chains2-x1`, `worldRenderer.ts:1322` | 불꽃실·폭풍실·서리 사슬 모두 백색 연쇄의 꺾은 흰 줄 하나다 |
| ④ | beam 4종과 halo 3종 | `b7-now-lines-x1`, `:1313`·`:1338-1341` | 먹창·십자 획·심판선은 같은 흑선 창이고, 넓은 붓은 백묵 절단이다. halo 셋은 실 고리 하나다. 일식 테의 빈 안쪽(110)은 그리지 않아서 띠 판정이 보이지 않는다(V4 일부) |
| ⑤ | 각성 땅 조각 8종 | `b7-now-zones-x1`, `GameRenderer.ts:604-663`·`:704-757`, `worldRenderer.ts:93-96` | 땅 조각은 allyGlow(#cff6ff)로 원판 전체를 채우고 가운데에 기호 원판을 둔다. **결 코트 대비가 1.04:1이다(Y 0.864 대 0.902, `b7-test-c10-contrast`)**. 별똥 자국 안에 선 결이 바닥에 묻힌다(P1 위반). 기호도 문제다. 묘비는 '사슬'(적 속박 지대 기호), 연막은 '물결'(감속 기호), 불먹은 '불꽃'(적 화염 기호)이다. 번개 기둥과 별똥 자국은 '+'(회복 십자)다. 마름쇠 24개와 묘비 24개는 같은 단추 줄로 보인다 |
| ⑥ | 적 위 표식 | `b7-now-marks-x1`, `worldRenderer.ts:1160-1184` | 11px 청록 다각형(▲▼◆■⬟⬢)이라 무엇인지 읽히지 않는다. 침묵은 **자수정**이라 정예 표식과 헷갈린다(V2). 까마귀는 변이 2개인 다각형이어서 선 하나로 그려져 거의 보이지 않는다. 얼룩·균열 수는 같은 크기 먹 점이 한 줄로 늘어서서 기절 표식(먹 점 셋)과 헷갈린다 |
| ⑦ | 먹단지 불먹 | `GameEngine.ts:2808`, `worldRenderer.ts:1543`·`:1704-1733` | 불먹 안의 적에게 `enemy.burn`이 켜진다. 그래서 FX-03의 **산호 몸 물듦 + 산호 테 + 산호·호박 불티**가 그려진다. 아군 공격이 적 몸에 산호를 칠한다(V2, 바이블 §10.1) |
| ⑧ | lob 비행 | `GameEngine.ts:915`·`:2542-2548` | 대기 중인 lob이 RenderWorld에 없다. 0.55~1.0초 동안 아무것도 안 보인다 |
| ⑨ | 이어지는 효과 | 코드 | 삼각 봉인 변(폭 2→8)과 펼쳐지는 족자(폭 50)는 대체 그림 `drawBeam`으로 그린다. 너비 ×2짜리 먹 띠 + 청록 + 종이선이라 족자는 폭 100짜리 검은 막대가 된다. 감전 도약은 거울 분신의 점선 실(`tether`)이다. 배후 응징·공포·꽃가루는 실 고리다. 메아리·여덟째 인장·갈라짐·얼룩 터짐은 look의 폭발로 그려져 본 공격과 구별되지 않는다 |
| ⑩ | 되받은 탄(먹 궤도) | `GameEngine.ts:2714`, `worldRenderer.ts:1448` | 조각이 없어 청록 벡터 구슬로 그린다 |
| ⑪ | 참고 | `presentation.ts:227` | 무기 소리도 look의 소리다. 같은 문제가 소리에도 있다(§11 Q7) |

### 0.2 시안에서 확인한 것

| 시안 | 렌더 | 결과 |
|---|---|---|
| nova 고리 문체 넷 | `b7-mock-nova-rings-x1`, `-rings2-x1`, `-frost3-x1` | 넷은 1배에서 서로 갈린다: 굵기가 고르지 않은 먹 띠(먹 파동), 종이 서리 띠(서리 고리), 꺾쇠 번개 고리(천둥 박수), 매끈한 흰 고리 3겹(침묵의 종). 조정할 점이 셋 나왔다. ① 꺾쇠 고리는 꼭짓점 14개면 다각형으로 보인다. 마디 약 26으로 촘촘히 꺾어야 번개로 읽힌다. ② 서리 결정을 한 개씩 세우면 화살촉으로 보인다. 3~4개를 부채로 묶고, 띠 안쪽에 불규칙한 서리 술을 둬야 서리로 읽힌다. ③ 흰 고리 3겹은 물결(K11 물)과 닮을 수 있다. 짧게 퍼지고 사라지게 한다 |
| chain 선 문체 셋 | `b7-mock-chains-x1` | 1배에서 넷이 갈린다: 처지는 실 호(불꽃실), 꼬인 두 가닥(폭풍실), 흰 사슬 고리(서리 사슬), 그리고 핵심 백색 연쇄의 꺾은 줄 |
| 적 위 표식 14px | `b7-mock-emblems-x1`, `-x4` | 1배 14px에서 종·패·물방울·매듭·먹 얼룩·균열판·까마귀는 겨우 갈린다. 표식은 칠한 크기 16~18px로 키운다(§4.3) |
| 아군 불먹 대 적 불(K11 초안) | `b7-mock-allyfire-vs-fire` | 흑백에서도 갈린다. 적 불은 실선 굵은 테 + 촘촘한 밝은 심 불길이다. 아군은 바느질 점선 테 + 드문 검은 불길 + 청록 심이다. 시안의 불길은 너무 작고 적어서 "타는 먹"으로는 약하다 |
| 혼잡 장면 구성 | `b7-test-c12-scene2` | 적 200 + 적 탄 30 + 호박 예고 + 기믹 땅 조각 장면을 C12로 만들 수 있다. 대역 고리 8개가 겹쳐도 이미 시끄럽다. 일곱째 인장의 고리는 얇은 테 + 옅은 원판으로 줄여야 한다(§2.2) |

### 0.3 도구와 기준값

| 무엇 | 렌더 | 결과 |
|---|---|---|
| 이름공간 | `b7-pn-modules` | `PN.arsenalFx`는 비어 있다. 지금 PN 키는 C, _hk, _ki, arsenal, bombers, bossesA/B/C, characters, defs, enemies, env, fieldBosses, halftone, hazards(1.0-d1, fire만), heroKit, icons, rng, skillVfx, speedLines, splat, story, taper, tapers, vfx다 |
| id 접두 | `b7-id-prefixes` + 기존 지시서 | 쓰는 중인 접두는 hk, ke, bA, kb, ki, ev, bmb, ksv, kar, kst, hzd다. 이 모듈은 **`kaf<n>_`**를 쓴다 |
| 토큰 | `b7-skillvfx-spec` | `PN.skillVfx.K`가 구현값 토큰이다: ink #101312, ink700 #343936, ink500 #46423d, ink300 #8c8579, ink100 #bcb4a5, p50 #fffff8, paper #f4f4ef, p300 #d8dad3, ally #00a8c6, allyD #007c94, allyG #cff6ff. K10은 같은 이름과 값을 쓴다 |
| 기준 해시 | `b7-c8-baseline`, `-baseline2` | 두 번 돌려 같은 값이 나왔다: `k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244` |

## 1. 공통 계약

### 1.1 모듈·로드·이름공간
- 모든 선언은 IIFE 안에 둔다(`window.PN = window.PN || {}`).
- **로드**: 리뷰 시트는 이름순으로 자동으로 읽는다. 굽기는 메인 세션이 `scripts/build-atlas.mjs:11`의 `KIT_FILES`에서 `'k-icons2.js'` 바로 뒤에 넣는다.
- **의존**
  - 굽는 조각(`stamp`)은 `lib.js`만 쓴다(`PN.taper`·`PN.rng`·`PN.splat`).
  - 참고 합성(`draw`·`overlay`)은 맥락 그림용으로 `PN.enemies.draw`·`PN.heroKit.placeSprite`·`PN.env`를 읽기만 해서 불러도 된다.
  - `PN.skillVfx`는 `K`·`SPEC`·`jit`를 읽기만 한다. `PN.arsenal`(K9)과 `PN.hazards`(K11)는 부르지 않는다(둘 다 작업 중이다).
- **고치지 않는 것**: 다른 모듈의 이름공간에 항목을 더하거나 값을 바꾸지 않는다. C8의 "호출 전후 같음"이 검사한다.
- **결정성**
  - `Math.random`·`Date`를 쓰지 않는다.
  - `layout`·`paths`·`lobPath`는 `SPEC.jit`만 쓴다. 식은 `((Math.imul(seed*31 + i, 2654435761) >>> 0) % 1000) / 1000`이다(K4·K11과 같다).
  - 조각 안의 들쭉날쭉함은 고정 seed의 `PN.rng`를 써도 된다.
- **id와 마크업**
  - id는 모듈 카운터로 `kaf<n>_`를 붙이고 되감지 않는다. `<defs>`는 호출마다 따로 갖는다.
  - 한 태그에 같은 속성을 두 번 쓰지 않는다(`--check`가 잡는다).
- **글자**: `<text>`가 0이다.
- **한글**: `SPEC`과 `parts()` 서술자에는 한글을 넣지 않는다. 굽기가 이 둘을 매니페스트로 옮긴다. `window` 값도 영문 토큰이다(K9의 한글 `window` 문제를 되풀이하지 않는다). `META`의 `name`만 한글이어도 된다.

### 1.2 호출 형식
```
PN.arsenalFx = {
  version: '1.0',
  K,          // §0.3 토큰 11개 (PN.skillVfx.K와 같은 이름·값)
  ids,        // 44개, arsenal.ts 순서
  kinds,      // ['volley','burst','spray','rear','seeker','strike','nova','lob','chain','beam','halo']
  META,       // §1.2.1
  groups,     // 조각이 있는 무기 id (납품한 것만)
  overlays,   // 적에게 붙는 오버레이 키 (§4.3)
  SPEC,       // §1.5, 숫자와 토큰 이름만
  jit,
  parts(group),                    // → [{part, frames, drive, fps, seconds, still, box, anchor, place, rotate, layer, lod, flash, window, r?}]
  stamp(group, part, { frame }),   // 굽는 조각 (로컬 박스)
  layout(id, stage, opts),         // → [{prim, part, x, y, angle, flip, phase, prio, z, dr?, margin?}]
  paths(id, stage, opts),          // → { 이름: [[x,y],…] } 매개 도형의 꼭짓점 (C9 검증용)
  lobPath(id, { x0, y0, x1, y1, t }), // → { x, y, h, angle, shadow: { rx, ry, alpha } }
  draw(id, stage, opts),           // 참고 합성 (리뷰·골든). 원점은 §1.3
  overlay(key, opts),              // 적 발(판정 원 중심) 원점의 오버레이 참고 합성
};
```

**1.2.1 META[id]**

| 필드 | 내용 |
|---|---|
| `name`, `rarity`, `kind`, `look` | `arsenal.ts`·`ko.json` 그대로 |
| `geo` | `arsenal.ts`의 기하 그대로다: `radius`·`length`·`count`·`jumps`는 [기본, 레벨당], 나머지는 `inner`·`width`·`directions`·`hop`·`scatter`·`delay`·`size` |
| `main` | 주 단계. strike `impact`, nova `burst`, lob `land`, chain `jump`, beam `stroke`, halo `sweep`. 투사체 무기는 없음 |
| `stages` | 납품한 모든 단계(주 단계 + `flight` + 기믹 단계). **아직 안 그린 것은 넣지 않는다** |
| `gimmicks` | `[{stage, priority: 1/2/3}]`(§4.1). 납품한 것만 |
| `object` | 그 무기를 대표하는 물건 조각의 이름(C15 대조용). 물건 조각이 없는 무기(halo·chain 일부)는 `null` |
| `done` | `{fx, lob, gimmick}` 불리언. 메인 세션은 done인 것만 등록한다 |

**opts 기본값**

| 옵션 | 기본값 | 뜻 |
|---|---|---|
| `level` | 3 | `geo`로 반경·길이·수를 셈한다 |
| `awakened` | false | 각성 조각, 공통 강화(수 +1, 범위 ×1.2), 각성 SPEC |
| `p` | 0.35 | 그 단계 안 진행률 |
| `t` | 0.2 | 초. 반복 조각과 슬롯의 시계 |
| `seed` | 1 | 게임에서는 표시 일련번호(§9-3) |
| `radius`, `inner`, `length`, `width`, `points` | `geo`에서 | 덮어쓰기 |
| `lod` | `'full'` | `'full' / 'reduced' / 'minimal'` |
| `reduced` | false | 감소 모션 |
| `ch` | 1 | 맥락 그림의 장 |
| `context` | false | true면 참고 합성에 맥락(먹귀, 주인공)을 함께 그린다(C5) |
| `stack`, `r`, `top` | 1, 12, r별 표 | 오버레이의 겹 수, 적 반경, 머리 위 앵커 y |

- **잘못된 호출**
  - `parts`·`stamp`에서 모르는 group이나 part를 받으면 `throw new Error`를 던진다. 굽기가 조용히 다른 그림을 굽지 않게 한다(K9 문법).
  - `draw`·`overlay`에서 모르는 id·stage·key를 받으면 빈 `<g/>`를 돌려주고 `console.warn`을 남긴다(K7·K11 문법).

### 1.3 단위·좌표·판정 (바꾸지 않는다)
- **단위**: 월드 단위는 1440×900, 줌 1.0의 1x px다. 조각은 `scale: 1`로 @2x에 굽는다.
- **판정 = 게임 값(V4)**. 그림은 판정을 따라가고 판정을 바꾸지 않는다.

  | 효과 | 판정 그림이 놓이는 곳 |
  |---|---|
  | strike·nova·lob 폭발, 기믹 폭발 | 중심선이 정확히 R인 고리. 변하는 굵기 띠는 R에 걸친다 |
  | halo | 바깥 R과 안쪽 `inner` 둘 다. 수호 고리는 inner 0이라 원판 |
  | beam | 축에서 반폭 `width`인 캡슐(K4 `band`와 같다) |
  | chain | 점 목록 그대로 |
  | 땅 조각 | 테 중심선 = `zone.radius`. 마름쇠(18)·묘비(22)는 테 없이, 조각 안 바닥 그림자 타원(rx = r, ry = 0.42r, 먹 α 0.25)으로 보인다 |

- **원점**

  | 무엇 | 원점 |
  |---|---|
  | 폭발 단계 | 사건 중심 |
  | nova·halo | 주인공 발 |
  | beam | 빔 시작점, +x = 빔 방향 |
  | chain | 첫 점(주인공) |
  | lob `flight` | 던진 자리. `opts.dx`·`dy`는 착지 자리 |
  | 땅 조각 | 조각 중심 |
  | `overlay` | 적의 발 |

- **주인공을 가리지 않는다(V4·BUG-12)**
  - 주인공 발에서 시작하는 선·띠·줄·캡슐(beam 넷, chain의 첫 구간)은 시작점에서 `SPEC.footClear` = 26 떨어진 곳부터 칠한다. 발밑 링(rx 24, ry 10.3)을 덮지 않기 위해서다.
  - `place: 'origin'` 조각(술, 먹통)은 앵커에서 26 이상 떨어진 곳에만 칠한다(C7).
  - 주인공에 붙는 조각(`place: 'hero'`)은 두 곳을 피한다: 얼굴 금지 구역 [−8,−58]–[18,−34](오른쪽 보기, 반전 포함)과 발밑 링(y > −11)이다.
  - nova 머리 위 물건(`place: 'head'`)은 앵커를 아래 가운데에 두고, 앵커 아래로 칠하지 않는다. 렌더러는 (0, `SPEC.headY` = −66)에 놓는다. 디버프 타이머가 있으면 `headLift` 26만큼 올린다.
- **3/4 시점**
  - 판정 고리와 띠는 위에서 본 **참 원**이다(K4 규칙).
  - 땅에 눕는 자국(인영, 붓자국, 웅덩이, 분화구, 그림자)은 납작하게 그린다(ry ≈ 0.42·rx).

### 1.4 조각 규칙

| 필드 | 값 | 뜻 |
|---|---|---|
| `drive` | `prog`(`seconds` 창의 진행률로 장을 고른다, 마지막 장에서 멈춤), `loop`(`fps`로 반복, `still`은 감소 모션·minimal에서 멈출 장), `cycle`(슬롯마다 다시 도는 prog, K11과 같다), `idx`(자료가 장이나 변형을 고른다) | |
| `seconds` | prog·cycle은 필수다. 예외는 `window`가 `pending`·`beam`·`chain`일 때로, 창 길이를 자료가 정한다 | |
| `window` | `mark`, `decal`, `zone-start`, `zone-end`, `zone`, `pending`, `beam`, `chain`, `flight`, `status`, `stack`, `class`, `variant`, `event`, `vel` | 영문 토큰만 |
| `place` | `target`, `center`, `hero`, `head`, `origin`, `tip`, `point`, `ring`, `disc`, `line`, `feet`, `over`, `orbit`, `air`, `event` | 렌더러가 놓는 자리 |
| `rotate` | `none`, `radial`(+x가 바깥), `tangent`(시계 방향), `beam`(+x가 빔 방향), `vel`, `path`(lob 진행 접선), `face`(좌우 반전만) | |
| `layer` | `ground`(데칼·땅 조각, 적 위험지형 아래), `feet`(적 발밑, 몸 아래), `front`(그 몸 바로 뒤), `stand`(몸과 함께 y 정렬. 못 하면 ground로 대체), `ally`(allyAttacks 층: 몸 위, 적 탄·예고 아래), `head`(머리 위 일괄 패스), `air`(ally 층 + 땅 그림자) | |
| `lod` | `info`(모든 LOD), `deco`(minimal에서 뺀다) | |
| `flash` | true면 섬광 감소에서 α × 0.5 | 유성 붓 `impact*`과 `seal8`만 true다. 나머지 조각은 한 장 안 종이 섬광이 박스 넓이의 30% 이하다 |
| `r` | 12, 19, 28, 38, 54 | 적에 붙는 조각의 크기 등급(가장 가까운 등급을 고른다, K4 chill과 같다) |

- **박스**: 칠한 모든 기하는 박스 가장자리에서 3 이상 안쪽이다(C7).
- **굽기 키**: `afx/<group>/<part>/<frame>`이다.

### 1.5 SPEC — 렌더러가 그리는 매개 도형

**토큰**
- §0.3의 이름만 쓴다(렌더러가 `palette.ts`로 바꾼다).
- 층 표기는 `[토큰, 굵기, α?]`이고, 아래에서 위로 그린다.
- 청록이 든 점선은 먹 층의 대시를 양 끝으로 `pad` 0.6씩 늘린다(K4 샌드위치).

**원 도형(primitive)**

| 이름 | 매개변수 | 규칙 |
|---|---|---|
| `stroke` | layers, dash?, pad?, gaps {n:[a,b], deg:[a,b]}, span?, inner?, core?, grow, fade | 반경 R의 원 획. 틈 k의 중심각은 2π(k + jit)/n, 폭은 deg 범위 안에서 jit로 고른다. `core`는 [layers, span 각] 호를 jit 각에서 시작해 얹는다. `grow`: r(u) = R·(from + (1 − from)(1 − (1 − u)²)), u = 나이/s. `fade`: 수명의 `at`부터 α가 1에서 0으로 줄거나, `dash`면 ink 층만 점선으로 남는다 |
| `band` | token, edge?, width:[min,max], knots, gaps, core?, fringe?, grow, fade | 굵기가 변하는 채운 고리. w(θ)는 매듭 k의 w_k = min + (max − min)·jit(seed, k)를 코사인 보간한 값이다. R ± w/2를 evenodd로 채운다. `fringe` {side, pitch, h, skip, layers}: 가장자리를 따라 pitch마다 짝수 꼭짓점을 h·jit만큼 바깥(side)으로 밀고, skip 확률로 0으로 둔다(불규칙 서리 술) |
| `multi` | rings [{final, delay, alpha}], layers, grow, fade | 고리 여럿이 delay만큼 늦게 출발해 final·R까지 퍼진다. 첫 고리만 R에 닿는다 |
| `jag` | layers, seg, amp, forks {n, len}, flicker {fps, seeds}, grow, fade | 꺾인 원. n = round(2πR/seg). 꼭짓점 k의 각은 (k + (jit − 0.5)·0.5)·2π/n, 반지름은 R ± (amp0 + (amp1 − amp0)·jit(20 + k)), 부호는 jit(200 + k)로 정한다. 갈래는 꼭짓점에서 바깥으로 꺾인 두 마디(len)다. 깜빡임은 seed 둘을 fps로 번갈아 쓰고, 감소 모션에서는 첫 seed에 고정한다 |
| `ripple` | arcs [{at, span[deg], layers}], full?, core?, grow | 앞쪽(아래) 반원 호. 화면 각 0°는 오른쪽, 시계 방향이다. `full`은 R 전체 원 하나다 |
| `wash` | token, alpha, inner? | 원판이나 고리 띠 채움 |
| `crescent` | token, alpha, span, thick, sweep, start | 고리 띠 위의 초승 부채꼴. 안쪽 경계는 중심을 thick·(R − inner)만큼 옮긴 원이다. 수명 동안 sweep만큼 시계 방향으로 돈다 |
| `rope` | width, body, edge, twist {pitch:[a,b], angle, layers}, core | 꼰 줄 고리. 띠를 가로지르는 비스듬한 꼰 자국을 jit 간격으로 둔다. **같은 간격 평행선 금지** |
| `comet` | rm, span, head:[a,b], rim, body, core, sweep, start | 반지름 rm을 따라 도는 꼬리가 가늘어지는 획이다. 머리가 수명 동안 sweep만큼 돈다 |

**선 도형**

| 이름 | 매개변수 | 규칙 |
|---|---|---|
| `sag` | sag, layers, grow {frac}, fade | 이웃 점 사이를 2차 곡선으로 잇는다. 제어점은 중점 + 법선·(±sag·길이)이고, 구간마다 부호가 바뀐다. 수명 앞 frac 동안 길이를 따라 그려 나간다 |
| `twist` | amp, wave, strands [layers, layers], kinkEvery, kinkAmp, flicker | 구간마다 두 가닥을 그린다. s(t) = 축 + 법선·A·sin(2πt·L/wave + φ)·sin(πt), φ는 0과 π다. 한 가닥은 kinkEvery 표본마다 ±kinkAmp·(jit − 0.5)로 꺾는다 |
| `links` | pitch, ellipse {rx, ry, layers}, bar {len, h, fill, edge}, core, nubs | 점선을 따라 pitch마다 납작한 고리와 옆으로 선 막대를 번갈아 둔다. 구간마다 고리 하나에 청록 심을 둔다 |
| `kink` | seg, push, layers, fade | K4 bolt와 같은 꺾음이다(짧은 도약용) |
| `capsule` | fill, edge, dash? | 반폭 w 캡슐. footClear 앞은 칠하지 않는다 |
| `blade` | shaft, grain, head {len, half, fill, edge}, thrust, retract {at, to} | 먹창. 수명 앞 thrust 동안 끝이 0에서 L로 나가고, at부터 to·L까지 물러나며 옅어진다. 창날은 잎 꼴이다(삼각 화살촉 금지) |
| `brushBand` | fill, edge {layers, ragged {pitch, amp}, sides}, taper?, streaks?, ridge?, front?, core?, grow, fade | 넓은 붓질 띠, 찢긴 획, 펼친 족자에 쓴다. 가장자리는 pitch마다 ±amp만큼 jit로 흔든다. taper는 [t, 반폭비] 목록이다. streaks는 띠 안의 비백 줄로, 길이·위치를 jit로 흔들고 같은 간격은 금지한다 |
| `string` | layers, after {n, bow, seconds, layers} | 팽팽한 줄. 떨림 잔상은 중점이 bow만큼 휜 2차 곡선이고 seconds 동안 0으로 줄어든다 |
| `edges` | pre {layers, dash, pad, sewn}, strike {layers, fill, fillSeconds} | 다각형 변. `sewn`이면 대기 진행률만큼 변을 차례로 꿰맨다 |

**공통 키**

| 키 | 값(기준) |
|---|---|
| `jit` | {mul 31, hash 2654435761, mod 1000} |
| `headY`, `headLift`, `footClear`, `faceZone` | −66, 26, 26, [−8, −58, 18, −34] |
| `rim.ally` | 땅 조각 테. layers [[ink,2.6],[ally,1.4]], dash [6,4], pad 0.6 |
| `rim.pad` | 별똥 자국 전용 실선 테. [[ink,3.4],[ally,1.8],[allyG,0.6]]. 주인공이 안에 있으면 [[ink,4],[ally,2.4],[allyG,0.8]] |
| `awakened` | 각성 고리·선에 더한다: R − 6의 가는 선 [[ink,1],[p50,0.6]], 청록 core 길이 ×1.5 |
| `life[id]` | {mark: 폭발·훑기 표시 초, decal: 데칼 초}. §2·§4 표의 값. 렌더러가 표시 수명으로 쓴다 |
| `caps`, `priority` | §4.5와 §5.4의 상한과 순서 |
| `marks` | rects {12:[−16,−14,16,4], 19:[−22,−18,22,4], 28:[−30,−24,30,5], 38:[−40,−30,40,6], 54:[−56,−38,56,7]}(발 오버레이가 칠할 수 있는 범위). emblem {box [22,22], gap 4}. crow {rx 14, ry 5, period 0.9, lift 8, dive 0.12}. spores {slots 2, rise 16, drift 6} |
| `lob[id]` | §3 |
| `layout[id][stage]` | §1.6 |
| `reference` | chainStep [90, 40](참고 합성의 연쇄 점 간격), spread [120, 80](strike·lob 여러 개를 흩는 타원) |
| `fills` | [이름, 토큰, α, 지속 초] 목록. 모든 채움과 띠를 적는다(C10이 읽는다) |

무기별 SPEC 값은 §2·§4 표에 있다. 값을 바꾸면 API "지시서와 다르게 한 것"에 이유를 적는다.

### 1.6 layout·paths·lobPath
- J(i) = jit(seed, i)다. 출력은 z 순서로 낸다(ground → stand → ally).
- **layout 원형 넷**(SPEC.layout 항목의 `prim`)
  - `ring`
    - 개수: n = count 범위에서 jit로 고르거나 max(min, round(2πR/every))다.
    - 각: −π/2 + (k + 0.5 + (J(k) − 0.5)·2·jitter)·2π/n이고, J(k + 100) < skip이면 건너뛴다.
    - 반지름: R + dr이다. `inout`이면 dr의 부호를 J(k + 300)로 정한다.
    - 변형은 parts[⌊J(k + 200)·len⌋]이다. prio는 앞의 `info`개가 0, 나머지가 2다.
    - K4 blastDust를 일반화한 식이다.
  - `disc`
    - K11 불 무더기와 같은 방식이다.
    - 후보 k = 0..39: 각 2π·J(k), 거리 (r − margin)·√J(k + 40)다. 받은 것과의 거리가 hypot(dx, 1.3dy) < minGap·r이면 거절한다.
    - 개수: n = clamp(round(r/per), min, max)다.
    - 변형 J(k + 80), flip J(k + 120) < 0.5, phase J(k + 160)이다.
  - `line`
    - 위치: s_j = L·(j + 0.5 + (J(j) − 0.5)·0.6)/n이다.
    - 옆으로 (2J(j + 50) − 1)·offset만큼 띄운다. angle은 선 방향이다.
  - `point`·`center`·`tip`·`tail`: 연쇄의 첫 점을 뺀 점들, 중심, 빔 머리, 초승 꼬리 끝에 하나씩 둔다.
- **paths**는 그 단계가 쓰는 매개 도형의 꼭짓점이다(jag 꼭짓점, band 바깥·안쪽 가장자리, fringe, twist 가닥, kink, ragged 가장자리, 잔상 곡선, 균열선). C9가 찍는다.
- **lobPath**(§3)
  - 땅 위치: (x0, y0) → (x1, y1) 선형 보간이다.
  - 높이: h(t) = 4H·t(1 − t)이고, H = clamp(k·d, min, max)다.
  - 그림자: rx = rx0 + (rx1 − rx0)t, ry = 0.42·rx, α = a0 + (a1 − a0)t다.
  - angle: 화면 속도 (dx, dy − 4H(1 − 2t))의 각이다.
- **검증 벡터**: C9가 대표 경우를 숫자로 찍는다. 메인 세션은 그 값을 매니페스트에 싣고, TypeScript 이식이 같은 값을 내는지 단위 시험한다.

### 1.7 그림 규칙
- **색**: §0.3 토큰 11개만 쓴다. 산호·호박·자수정·연두, 장 재질색, ui.seal(인주)은 0이다. 마스크·클립 안의 #000000·#ffffff만 허용한다(C6).
- **청록**
  - 무기마다 청록 요소 한 가지(같은 요소 여럿은 괜찮다)를 두고, K9 아이콘의 청록 요소와 같은 것으로 한다(§2 표).
  - 늘 먹 위에 얹는다(먹 ≥ 2 + 청록 + allyG 또는 종이 심).
  - 각 무기의 주 단계 합성과 모든 적 오버레이에는 청록이 꼭 있다(C6 nocyan 0).
- **명도(P1)**
  - 결이 늘 가장 밝은 물체다.
  - 0.3초를 넘게 남는 채움은 다섯 장 바닥 어디서도 합성 Y ≤ 0.62다.
  - 짧은 띠(≤ 0.3초)는 Y ≤ 0.69다(종이 α ≤ 0.5).
  - 결 코트(Y 0.902)와의 대비는 1.25:1 이상이다.
  - C10이 `SPEC.fills`로 잰다. 시안 값은 `b7-test-c10-contrast`로 확인했다: 종이 α0.14~0.25는 Y 0.44~0.56, α0.45는 0.66, α0.5는 0.69다.
- **선**
  - 판정 고리·선의 먹 층은 3 이상이다(1배 판독).
  - 물건의 먹 외곽은 1.5~2.4, 내부선은 0.8~1.2다.
  - 적에 붙는 표식의 외곽은 1.2~1.6이다.
- **음영**
  - 3계조(먹 / 담묵·중묵 / 종이)를 쓴다.
  - 망점은 쓰지 않는다. 모든 조각이 움직이거나 짧게 머문다(바이블 §6-4).
- **금지**
  - 마크업: `<text>`, 그라데이션, 필터(`<filter>`), 혼합 모드, `<image>`, `<pattern>`, 해칭(같은 각·같은 간격 평행선 셋 이상)
  - 글자로 읽히는 모양: ✕·+·!·?·숫자·한글·한자, V·W·Z·N 지그재그, 같은 기호 셋 이상을 한 줄로
  - 별·햇살: 4갈래 별, 고른 방사 눈금·햇살, 16줄기 햇살
  - 적 문법:
    - 적 텔레그래프의 붓 점선 테와 물방울 붓 머리
    - 산호 채움
    - 단독 물결·사슬·⊘ 기호(적 제어 지대)
    - 먹알 + 종이 점(적 탄)
  - 착각을 부르는 것:
    - 같은 크기 둥근 점 둘을 같은 높이에 두기(얼굴)
    - 밝은 원판 12~18px과 연두·청록 마름모(픽업)
    - 바닥에 놓인 작은 청록 고리 r < 30(주인공 발밑 링)
  - 종교·정치 상징: 卍, 십자가, 합장, 머리에 두른 가시관, 범종
  - 공백 세력의 표식: 가면·종이봉투·거울·문자판, 흰 실로 꿰맨 입, 의사봉, 천칭, 광배처럼 도는 흰 고리(로어 §3.1·§4)
  - 폭력 묘사: 깔끔한 절단면·피(로어 §1.4)
- **흉내 금지**: 적·맵 위험지형(K11)의 실선 산호 테와 해칭, 핵심 스킬 look 그림(§2.8 표의 "가를 것")을 흉내 내지 않는다.

### 1.8 각성 문법 (K10)
- **물건 조각 `-awakened`**: 같은 물건에 두 가지를 더한다.
  - 겹 테: 실루엣을 1.2 바깥으로 옮긴 사본에 종이 1.0 + 먹 0.8을 두른다(섬광에는 두르지 않는다).
  - 첫 장 물건 위쪽 가장자리에 5~6갈래 불규칙 종이 반짝임 하나(r 2.4~3)를 둔다.
  - K9 탄의 각성 문법과 같다.
- **고리·선**: `SPEC.awakened`(가는 선 + 청록 길이 ×1.5)와 무기별 각성 값(§2 표)을 쓴다.
- **수와 범위**: 수 +1, 범위·길이 ×1.2는 자료가 정한다. 그림이 따로 늘리지 않는다.
- **기믹**: 각성 그림에 더해 §4의 기믹 그림이 붙는다. "각성이 특별하다"는 느낌은 주로 기믹이 맡는다.

### 1.9 바뀌면 안 되는 것
- 고칠 수 있는 파일은 `k-arsenal-fx.js`와 `API-arsenal-fx.md` 둘뿐이다.
- C8의 고정 값은 `k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244`이다.
  - "호출 전후"(K9·K11·고정 묶음·PN 키)는 모두 `same`이어야 한다.
  - 작업 전에 돌려 이 값이 나오는지 본다. 다르면(다른 작업이 먼저 반영됐으면) 그때의 값을 기준으로 삼고 납품서에 적는다.
- 모듈을 읽는 동안 kit error가 0건이어야 한다.

## 2. 투사체가 없는 22종 (평상·각성)

### 2.1 kind별 틀
- **strike**
  - 판정이 시전 순간에 바로 난다. 그래서 그림은 **"꽂히는 순간"부터 시작한다**. 0번 장은 물건이 땅에 닿은 순간이고, 위로 속도 획 2~3을 둔다.
  - 그다음 땅의 흔적(데칼)과 R 고리가 남는다. 물건은 목표 자리(적 위치)에 서고 ally 층이다.
- **nova**: 주인공 둘레의 R 고리 문체가 정체성이다. 손뼉과 종은 머리 위 물건(`head`)이다.
- **lob 착탄**: 깨지는 물건 + 땅 흔적 + R 고리. 날아오는 그림은 §3이다.
- **chain**: 선 문체가 정체성이다. 닿은 점마다 작은 조각을 둔다.
- **beam**: 축을 따라가는 매개 도형 + 시작·머리의 물건 조각.
- **halo**: 띠(inner..R)와 "도는" 움직임(혜성, 초승 그림자, 꼰 줄의 튕김)이다. 퍼지는 nova와 다르게 **돈다**.

### 2.2 strike

**조각**

| group / part | 장 | drive · 시간 | box | anchor | place · rotate · layer · lod |
|---|---|---|---|---|---|
| inkLightning / `bolt`, `bolt-awakened` | 4씩 | prog 0.24 (mark) | 36×120 | 18,112 | target · none · ally · info |
| inkLightning / `scorch` | 1 | idx (decal 0.6) | 52×24 | 26,12 | target · none · ground · deco |
| brushDownpour / `stroke-a`, `stroke-b`, `stroke-a-awakened`, `stroke-b-awakened` | 3씩 | prog 0.18 | 48×88 | 14,80 | target · none · ally · info |
| brushDownpour / `mark-s`, `mark-m`, `mark-l` | 1씩 | idx (decal 0.9) | 56×28, 76×36, 100×46 | 가운데 | target · none · ground · deco |
| fallingScroll / `scroll`, `scroll-awakened` | 4씩 | prog 0.42 | 52×104 | 26,98 | target · none · ally · info |
| seventhSeal / `seal`, `seal-awakened` | 3씩 | prog 0.3 | 40×56 | 20,50 | target · none · ally · info |
| seventhSeal / `print-a`, `-b`, `-c` | 1씩 | idx (decal 1.2) | 48×24 | 24,12 | target · none · ground · deco |

**무기별 지시**

먹번개 inkLightning (희귀, chainSpark look, 반경 56, 2발)
- **물건**: 수직으로 꽂히는 먹 번개다. 먹 8~12 + 종이 심 2, 꺾임 4~6, 구간 길이를 30% 이상씩 다르게 한다. 칠한 높이는 약 110이고, 위 끝에 작은 먹구름 조각이 있다.
- **장 진행**: 0번 장이 가장 밝다. 1번 장에 가지 하나가 나오고, 2번 장은 가늘어지며, 3번 장은 먹 점선 잔해다.
- **땅**: `scorch`(담묵 그을음, 금 없음)
- **SPEC**: `ring.inkLightning` stroke, [[ink,3.4],[ally,1.8],[allyG,0.6]], gaps 2~3(8~14°), grow 0.7→1 / 0.08초, fade 0.6
- **청록 요소**: 번개 하나의 심 1.4
- **각성**: 가지 1 + §1.8. 번개 기둥은 §4다
- **가를 점**: 하늘에서 **수직**으로 꽂힌다. 연쇄 셋과 백색 연쇄는 가로로 잇고, 천둥 박수는 주인공 둘레다
- **피할 것**: 고른 Z·N, 땅 균열(균열 장교 shock와 겹친다)
- **life**: mark 0.3, decal 0.6

붓 폭우 brushDownpour (영웅, boneMortar look, 반경 46, 4발)
- **물건**: 굵은 붓 획 하나가 오른쪽 위에서 비스듬히 내려와 앵커에 붓 머리를 누른다. 머리 폭 12~14에서 끝 비백으로 가늘어진다.
  - 기울기: a는 수직에서 18°, 길이 64, b는 26°, 길이 76이다.
  - 한 시전 안에서 seed로 a·b를 섞는다. 같은 길이·같은 간격의 '////'을 피하기 위해서다.
- **장 진행**: 1~2번 장에 획이 위로 걷히며 비백만 남는다.
- **땅**: `mark-s/m/l`(먹 얼룩 + 획 방향 비백 꼬리). 반경 < 52이면 s, < 72면 m, 그 밖은 l이다.
- **SPEC**: `ring.brushDownpour` band, ink, width 1.5~6, knots 13, gaps 5~7(12~26°)이라 붓으로 찍은 테가 된다. core는 한 찍음에만 [[ink,4],[ally,1.8]] 30~50°다.
- **청록 요소**: 붓 획 하나의 젖은 결 1.2
- **각성**: 거세지는 폭우는 데이터대로 1.0→1.6배로 커지고, 자국 크기를 s→m→l로 고른다. 획은 `-awakened`다
- **가를 점**: 비스듬한 검은 붓 획 + 붓자국 고리다. 먹번개처럼 꺾이지 않는다
- **피할 것**: '////', 둥근 먹알
- **life**: mark 0.3, decal 0.9

족자 낙하 fallingScroll (영웅, boneMortar look, 반경 110, 1발, 밀침)
- **물건**: 세로 족자(칠한 높이 약 96)다. 종이 화면(빈 종이나 먹 산 능선 한 획) + 위아래 먹 축봉 + 축 끝 마개 + 청록 걸이 끈으로 되어 있다.
- **장 진행**
  - 0번 장: 아래 축봉이 땅에 닿으며 살짝 찌그러지고, 위로 속도 획 2~3, 아래로 먼지가 난다.
  - 1~2번 장: 6°, 12° 기울며 끈이 흔들린다.
  - 3번 장: p300으로 바래며 사라진다.
- **SPEC**: `ring.fallingScroll` ripple. 앞쪽 반원 종이 파문 둘(0.72R [[ink,2.4],[p50,1.4]] 15~165°, R [[ink,2.8],[p50,1.6]] 10~170°) + R 전체 담묵 원 [[ink300,1.2,0.7]]이다. core는 바깥 호의 60~120°, grow 0.5→1 / 0.15초다.
- **청록 요소**: 걸이 끈
- **각성**: 아래 축봉에서 종이 혀가 풀리기 시작한다. 펼쳐지는 족자는 §4다
- **가를 점**: 하나뿐인 **세로로 큰 물건** + 반원 파문이다
- **피할 것**: 글자·낙관·부적, 말린 두루마리(톱니 전령의 선언문), 4장 문자판 비석처럼 보이는 네모
- **life**: mark 0.45

일곱째 인장 seventhSeal (신화, voidMine look, 반경 58, 7발)
- **물건**: 옆에서 본 둥근 원기둥 도장 + 둥근 꼭지다. 종이 몸이고 인면 테가 청록이다.
- **장 진행**: 0번 장은 누르는 순간(찌그러짐 + 속도 획), 1번 장은 10 들림, 2번 장은 사라짐이다.
- **땅**: 인영 `print-a/b/c`다. 납작한 둥근 인영(종이 α + 끊김 1~2의 먹 테 + 안에 매듭 획 하나)이고, 크기를 다르게 한다.
- **SPEC**: `ring.seventhSeal`
  - wash p50 α0.18 + [[ink,2.6]] 눌린 틈 2(10~18°) + 0.92R [[ink300,1]]
  - core [[ink,3],[ally,1.4]] 40~70°
  - 일곱 개가 겹쳐도 시끄럽지 않도록 얇은 테 + 옅은 원판으로 그린다(`b7-test-c12-scene2`)
- **청록 요소**: 큰 도장의 인면 테
- **각성**: §1.8. 여덟째 인장은 §4다
- **가를 점**: 둥근 도장 + 둥근 인영이다. 소용돌이 팔·바람개비가 없다
- **피할 것**: 인영 안 글자·✕·가운데 점(5장 눈), 붉은 인주, 일곱 개를 한 줄로
- **life**: mark 0.36, decal 1.2

### 2.3 nova

**조각**

| group / part | 장 | drive · 시간 | box | anchor | place · rotate · layer · lod |
|---|---|---|---|---|---|
| inkPulse / `splash-a`, `splash-b` | 3씩 | prog 0.3 | 40×28 | 6,14 | ring · radial · ally · deco |
| frostRing / `shard-a`, `-b`, `-c` | 3씩 | prog 0.45 | 36×32 | 6,16 | ring · radial · ally · info(앞 3개) / deco |
| frostRing / `shard-awakened-a`, `-b` | 3씩 | prog 0.45 | 44×36 | 6,18 | ring · radial · ally · info / deco |
| thunderclap / `clap`, `clap-awakened` | 3씩 | prog 0.24 | 60×44 | 30,42 | head · none · ally · info |
| silenceBell / `bell`, `bell-awakened` | 3씩 | prog 0.45 | 40×52 | 20,50 | head · none · ally · info |

**무기별 지시**

먹 파동 inkPulse (일반, boneMortar look, 반경 135+8/L, 밀침 220)
- **물건**: 없다(주인공이 結 매듭이다).
- **SPEC**: `ring.inkPulse` band
  - ink, width 6~16, knots 9, 바깥 가장자리 틈 3~4(3~7°)
  - core [[ink,4],[ally,2]] 80~120°를 바깥 가장자리에 둔다
  - grow 0.55→1 / 0.1초, fade 0.6
- **layout**: ring `splash-a/b` 3개(각성 4), jitter 0.4, dr 4. 먹 덩이가 바깥으로 튄다.
- **청록 요소**: 고리 앞선 호(1/3 바퀴 이하)
- **각성**: 띠 굵기 ×1.2 + 0.8R [[ink,1.6]] 안쪽 얇은 고리. 밀쳐 부딪힘은 §4다
- **가를 점**: 유일한 **검은 띠** 고리다
- **피할 것**: 굵기가 고른 'O', 원상
- **life**: mark 0.3

서리 고리 frostRing (희귀, blackSun look, 반경 160+9/L, 감속 0.4)
- **SPEC**: `ring.frostRing` band
  - p50, edge [ink,2.2], width 11~13
  - core [[ink,3.2],[ally,1.6]] 한 바퀴
  - fringe 안쪽(side −1, pitch 7, h 1.5~6, skip 0.35, [[ink,1.4]])으로 불규칙 서리 술을 둔다
  - grow 0.6→1 / 0.12초
- **layout**: ring `shard-a/b/c` 6개(각성 7), skip 0.15, `inout`(안팎), dr 6.
  - 결정 조각 하나는 서릿발 3~4개를 묶은 부채다. 밑이 넓고 끝이 뾰족한 종이 + 먹 테 1.6이고, 길이는 18~40 사이로 다르게 한다.
  - 시안(`b7-mock-frost3-x1`)에서 한 개짜리는 화살촉으로 보였다.
- **청록 요소**: 고리 심
- **각성**: fringe를 양쪽에, `shard-awakened` 길게
- **가를 점**: **흰 서리 띠 + 얼음 결정**이다. 검은 원반·코로나·소용돌이(검은 태양)가 없다
- **피할 것**: 6갈래 정칙 눈송이, 고른 톱니(톱니 전령)
- **life**: mark 0.45

천둥 박수 thunderclap (영웅, chainSpark look, 반경 120+8/L, 기절 100% 0.7초)
- **물건**: 머리 위에서 맞부딪치는 옆모습 종이 손 둘이다(30° 이상 기울인다).
  - 0번 장: 벌어짐
  - 1번 장: 부딪힘 + 6~7갈래 불규칙 섬광(청록 심, 종이 면적 ≤ 30%)
  - 2번 장: 벌어지며 먼지
- **SPEC**: `ring.thunderclap` jag
  - [[ink,5],[ally,2.4],[p50,0.8]], seg 26, amp 1.5~6.5
  - 갈래 3(12~24)
  - 깜빡임 12fps(seed 5·6), grow 0.5→1 / 0.08초, fade 0.65(점선)
  - 시안 `-rings2-x1`에서 확인했다
- **청록 요소**: 섬광 심
- **각성**: §1.8. 메아리는 §4다
- **가를 점**: **두 손 + 꺾쇠 고리**다
- **피할 것**: 똑바로 선 합장(종교), 고른 톱니
- **life**: mark 0.3

침묵의 종 silenceBell (전설, voidMine look, 반경 220+12/L, 감속)
- **물건**: 손잡이가 위인 작은 종이 손종이다. 먹 추를 청록 실로 묶었다.
  - 0번 장: 왼쪽으로 기움
  - 1번 장: 오른쪽으로 흔들림
  - 2번 장: 바로 서며 옅어짐
  - 소리선(")))")은 쓰지 않는다. 고리가 소리를 말한다.
- **SPEC**: `ring.silenceBell` multi
  - 고리 셋: final 1 / 0.86 / 0.72, delay 0 / 0.08 / 0.16, α 1 / 0.7 / 0.45
  - layers [[ink,5.4],[p50,2.6]]
  - grow 0.35→ / 0.3초(감속 곡선), fade 0.7
- **청록 요소**: 추를 묶은 실
- **각성**: 고리 넷째(final 0.58). 침묵 표식은 §4다
- **가를 점**: **머리 위 흰 손종 + 매끈한 흰 고리 3겹**이다. 가시 원반·소용돌이(무음 지뢰)가 없다
- **피할 것**: 범종(종탑 간수의 머리), 점선 고리(null), 흰 실로 꿰맨 입(무음 심판관), 불교 문양
- **life**: mark 0.5

### 2.4 lob 착탄

**조각**(비행 조각은 §3)

| group / part | 장 | drive · 시간 | box | anchor | place · rotate · layer · lod |
|---|---|---|---|---|---|
| inkPots / `shatter` | 3 | prog 0.3 | 76×64 | 38,40 | target · none · ally · info |
| inkPots / `splat` | 1 | idx (decal 1.2) | 64×30 | 32,15 | target · none · ground · deco |
| clusterPots / `burst` | 3 | prog 0.24 | 56×48 | 28,30 | target · none · ally · info |
| tarJar / `crack` | 3 | prog 0.32 | 80×56 | 40,34 | target · none · ally · info |
| tarJar / `pool` | 1 | idx (decal 1.5) | 104×44 | 52,22 | target · none · ground · deco |
| meteorBrush / `impact`, `impact-awakened` | 3씩 | prog 0.36, `flash: true` | 88×68 | 44,46 | target · none · ally · info |
| meteorBrush / `crater` | 1 | idx (decal 1.5. 각성은 zone 4초 동안) | 120×52 | 60,26 | target · none · ground · info |
| meteorBrush / `streak-a`, `streak-b` | 2씩 | prog 0.36 | 40×16 | 4,8 | ring · radial · ally · deco |

**무기별 지시**

먹단지 inkPots (일반, boneMortar look, 반경 80+6/L)
- **착탄**: 흰 백자 단지가 깨진다. 종이 조각 4~6(불규칙), 큰 먹 튐, 0번 장 종이 섬광, 날아가는 청록 끈 조각이 있다.
- **땅**: `splat`
- **SPEC**: `ring.inkPots` stroke [[ink,3],[ally,1.6]], 틈 2(6~10°)
- **청록 요소**: 단지 목 끈
- **life**: mark 0.36, decal 1.2

송이 단지 clusterPots (희귀, 반경 56+4/L, 3발, 흩어짐 70)
- **착탄**: 작은 깨짐(조각 2 + 작은 먹 튐)이다. 3~4곳이 동시에 터져 "송이"로 읽힌다.
- **SPEC**: `ring.clusterPots` stroke [[ink,2.6],[ally,1.4]], 틈 1
- **청록 요소**: 송이 끈
- **life**: mark 0.3

타르 항아리 tarJar (영웅, voidMine look, 반경 100+7/L, 감속)
- **착탄**: 검은 항아리가 갈라지며 번들한 타르가 쏟아진다. 늘어지는 줄 2~3이 있다.
- **땅**: `pool`(번들한 타르 + 가장자리에 늘어진 방울·실)
- **SPEC**: `ring.tarJar` stroke [[ink,3.2],[ally,1.4]], 틈 1
- **청록 요소**: 항아리 봉인 끈
- **life**: mark 0.4, decal 1.5

유성 붓 meteorBrush (전설, boneMortar look, 반경 140+10/L, 밀침 180)
- **착탄**: 큰 먹 폭발이다. 붓이 머리부터 땅에 박힌 모습이 0~1번 장에 보인다. 0번 장에 종이 섬광(`flash`)이 있다.
- **땅**: `crater`(분화구 얼룩 + 방사 비백)
- **SPEC**: `ring.meteorBrush` stroke [[ink,5],[ally,2.8],[allyG,0.8]], grow 0.7→1 / 0.08초
- **layout**: ring `streak-a/b` 6~8개, jitter 0.35, dr 2. 비백 줄기다.
- **청록 요소**: 꼬리 심(비행)
- **각성**: §1.8. 별똥 자국은 §4다
- **life**: mark 0.45, decal 1.5

- **공통 각성**: 4종 모두 착탄 각성은 `ring` + `SPEC.awakened`, 비행 물건은 `-awakened`다(§3).
- **공통 피할 것**
  - 골분 박격과 겹치는 것: 수직으로 떨어지는 검은 옹기 + 천 뚜껑 + 노끈 매듭 + 청록 바느질 착탄 원(`b7-test-c11-lob` 아래 줄)
  - 폭탄병과 겹치는 것: 심지·불꽃을 단 단지
  - 과일처럼 보이는 것: 포도 송이

### 2.5 chain

| group / part | 장 | drive | box | anchor | place · layer · lod |
|---|---|---|---|---|---|
| sparkThread / `spark`, `spark-awakened` | 2씩 | prog (chain) | 24×24 | 12,12 | point · ally · deco |
| stormThread / `gust-a`(작음), `gust-b`(큼) | 2씩 | prog (chain) | 24×20, 32×26 | 가운데 | point · ally · deco |
| frostChainlet / `rime12`, `rime19`, `rime28` | 1씩 | idx (class) | 36×18, 48×22, 64×28 | 가운데 | feet · feet · info |

불꽃실 sparkThread (일반)
- **SPEC**: `line.sparkThread` sag
  - sag 0.16, 구간마다 위아래를 바꾼다
  - layers [[ink,3.4],[ally,1.8],[allyG,0.6]]
  - grow 0.4, fade 0.65(점선 [5,4])
- **닿은 점**: `spark`(5~6갈래 불규칙 종이 불꽃)
- **청록 요소**: 실
- **각성**: `spark-awakened`(크고 청록 심). 되감김은 §4다
- **가를 점**: **부드럽게 처지는 호**다. 백색 연쇄는 꺾은 줄이다
- **피할 것**: 같은 호 셋이 한 줄('mmm')

폭풍실 stormThread (영웅, 기절 20%)
- **SPEC**: `line.stormThread` twist
  - amp 4, wave 36
  - 가닥 [[ink,3],[ally,1.5]] / [[ink,2.6],[p50,1]]
  - kinkEvery 3, kinkAmp 5, 깜빡임 12fps(seed 7·8)
- **닿은 점**: `gust-a/b`(열린 바람 획 2~3, 채운 소용돌이 금지)
- **청록 요소**: 실 번개
- **각성**: 증폭은 §4다
- **가를 점**: **꼬인 두 가닥**이다

서리 사슬 frostChainlet (희귀, 감속)
- **SPEC**: `line.frostChainlet` links
  - pitch 14
  - 고리 rx 7.5, ry 4, [[ink,3.4],[p50,1.6]]
  - 막대 14×3.2, p300 + [ink,1.6]
  - 구간마다 청록 심 고리 1개
  - nubs: 4개마다 1개, 2.4, p50 + [ink,0.8]
  - fade 0.6
  - minimal에서는 [[ink,3],[ally,1.6]] 꺾은 줄 하나로 줄인다
- **닿은 점**: 발밑에 `rime<r>`(얼음판 + 서릿발)을 연쇄 수명 + 0.3초 동안 둔다
- **청록 요소**: 고리 하나의 심
- **각성**: 묶인 사슬은 §4다
- **가를 점**: **흰 사슬 고리 줄**이다
- **피할 것**: 적 속박 지대의 단독 사슬 기호, 걸쇠 여제의 사슬(이 사슬은 늘 먹귀 사이를 잇는 움직임으로만 그린다)

- **공통**: 첫 구간은 주인공에서 26 떨어진 곳부터 그린다.
- 시안은 `b7-mock-chains-x1`이다.

### 2.6 beam

| group / part | 장 | drive | box | anchor | place · rotate · layer · lod |
|---|---|---|---|---|---|
| inkLance / `tassel`, `tassel-awakened` | 2씩 | prog (beam) | 60×22 | 56,11 | origin · beam · ally · info |
| wideBrush / `brush`, `brush-awakened` | 3씩 | prog (beam) | 56×48 | 14,24 | tip · beam · ally · info |
| crossStrokes / `scrap-a`, `scrap-b` | 2씩 | prog (beam) | 20×16 | 10,8 | tip · beam · ally · deco |
| judgmentLine / `inkbox`, `inkbox-awakened` | 2씩 | prog (beam) | 64×30 | 60,15 | origin · beam · ally · info |
| judgmentLine / `flick-a`, `flick-b` | 2씩 | prog 0.24 | 22×18 | 11,9 | line · beam · ally · deco |

먹창 inkLance (희귀, railSpear look, 길이 600, 반폭 12)
- **SPEC**: `line.inkLance` = capsule {p50 α0.16, [[ink,1.2]]} + blade
  - 창대 [[ink,4.8→3]] + 종이 결 0.8
  - 창날: 길이 30, 반폭 6.5, p50 + [ink,1.6]
  - thrust 0.18, retract at 0.7 → 0.6L
- **`tassel`**: 창 뒤끝의 먹 술 다발 + 청록 술 매듭 띠다. 앵커에서 26~52 **뒤**에만 칠한다.
- **청록 요소**: 술 매듭 띠
- **각성**: 창날 ×1.2 + 창 그림자 한 줄(옆 3, [[ink300,1.2]]). 가지창은 §4다
- **가를 점**: **가는 창대 + 잎 창날 + 술**이고, **찌르고 물러난다**. 흑선 레일은 굵은 검은 창 + 청록 심 + 섬광이고, 점선으로 부서진다
- **피할 것**: 삼각 화살촉

넓은 붓 wideBrush (영웅, frostLine look, 길이 380, 반폭 34, 밀침 200)
- **SPEC**: `line.wideBrush` brushBand
  - fill p50 α0.45
  - 가장자리 [[ink,2]] ragged(10, 0.5~2.5) 양쪽
  - 비백 줄 3~5([[ink300,1.2]], 길이 0.3~0.8)
  - 앞선 front [[ink,3],[ally,1.6]]
  - grow 0.3, fade 0.6
- **`brush`**: 머리를 따라 움직이는 큰 붓(종이 쇠테 + 눌린 먹 붓털, B2 §6.5 휘의 붓)
- **청록 요소**: 띠 앞선 테
- **각성**: 띠 폭 ×1.2(자료). 되쓸기는 §4다
- **가를 점**: **넓은 흰 붓질 + 큰 붓**이다. 백묵 절단은 가는 분필 띠 + 가루다

십자 획 crossStrokes (영웅, railSpear look, 네 방향, 길이 460, 반폭 14)
- **SPEC**: `line.crossStrokes`
  - capsule 가장자리 [[ink300,1,0.6]] 점선 [6,4]가 판정 띠 전체를 보인다
  - brushBand 찢긴 획:
    - fill p50 α0.5
    - 뒤쪽만 먹 테 [ink,1.6], ragged 0.5~3
    - taper [[0,0.15],[0.35,1],[1,0.4]]
    - 앞 30%에 core [[ink,3],[ally,1.4]]
  - 가운데(26 안)는 비운다
- **`scrap`**: 획 끝에서 찢겨 날아가는 종이 조각
- **청록 요소**: 찢은 획의 심
- **가를 점**: **네 방향 찢긴 종이 획**이고 가운데가 비어 있다
- **피할 것**: 굵기 같은 획 넷이 가운데서 만나는 '✕'·'+'(K9 `b3-mock-beams`), 卍. 판정 모양 자체가 십자라 완전히 피할 수는 없다. 그래서 찢김·가늘어짐·가운데 비움으로 줄인다(§11 Q9)

심판선 judgmentLine (신화, railSpear look, 길이 900, 반폭 18, 처형)
- **SPEC**: `line.judgmentLine`
  - capsule {p50 α0.12, [[ink300,1.2]] 점선 [6,4]}
  - string [[ink,2.8],[ally,1.2],[p50,0.4]]: 시작 장부터 다 그린 팽팽한 줄
  - 떨림 잔상 2(휨 6→0, 0.12초, [[ink300,1.2,0.6]])
- **layout**: line `flick-a/b` 4~6개, offset ±0.6w. 먹 튐이다.
- **`inkbox`**: 목수의 먹통(먹물 통 + 실 감개 바퀴)이다. 앵커에서 26~56 뒤에 칠한다.
- **청록 요소**: 먹줄 심
- **각성**: 잔상 3 + 줄 굵기 ×1.2
- **가를 점**: **가는 팽팽한 줄 + 떨림 + 먹통**이다
- **피할 것**: 세로 줄 아래 인물(교수대), 천칭, 의사봉, 일식 원장의 자·오선지

- **life**: beam 넷 모두 자료 0.28초다.

### 2.7 halo

| group / part | 장 | drive | box | anchor | place · rotate · layer · lod |
|---|---|---|---|---|---|
| inkOrbit / `chip-a`, `chip-b` | 2씩 | prog 0.24 | 16×12 | 4,6 | ring · radial · ally · deco |
| wardRing / `knot-a`, `knot-b` | 1씩 | idx (variant) | 22×18 | 11,9 | ring · radial · ally · info |
| eclipseHalo / `ribbon-a`, `ribbon-b` | 3씩 | loop 12, still 0 | 36×18 | 32,9 | ring(초승 꼬리) · tangent · ally · info |

먹 궤도 inkOrbit (일반, orbitScythes look, 반경 120+6/L, inner 40, 재사용 0.28~0.6초)
- **SPEC**: `halo.inkOrbit`
  - 띠 wash ink α0.14(inner..R, ground)
  - 바깥 [[ink,2.4]] 틈 2
  - 안쪽 [[ink300,1.2]] 점선 [4,4]
  - comet: rm = (inner + R)/2, span 100°, 머리 14~18, rim [ink,1.6], 몸 p50, core [[ink,3.6],[ally,2]], 수명 동안 240° 시계 방향, 시작각 jit
- **`chip`**: 띠 바깥 가장자리에서 깎여 튀는 먹 조각 2~3
- **청록 요소**: 혜성 획 심
- **각성**: 혜성 span 140°. 되받기는 §4다
- **가를 점**: **먹 띠 위를 도는 종이 혜성**이다. 초승 궤도는 날 여러 개가 계속 돈다
- **life**: mark 0.3

수호 고리 wardRing (희귀, eclipseStep look, 반경 90+5/L, inner 0, 밀침 240)
- **SPEC**: `halo.wardRing`
  - wash p50 α0.12(원판, ground)
  - rope: 너비 10, 몸 p50, edge [ink,1.4], 꼰 자국 간격 9~15 · 40° · [[ink,1.4]]
  - core: 바깥 가장자리 120°에 바느질 [[ink,2.4],[ally,1.4]] 점선 [5,4] pad 0.6
  - 튕김 0.82R→R / 0.1초
- **layout**: ring `knot-a/b` 2개(각성 3), jitter 0.4
- **청록 요소**: 고리 바느질 1/3
- **각성**: 줄 너비 12, 매듭 3. 약화는 §4다
- **가를 점**: **굵게 꼰 줄 + 매듭**이다. 일식 보법은 안으로 뻗는 종이 붓 획 바퀴살이고(`b7-test-t1-cores`), 종이 갑주의 찢긴 종이 띠 + 청록 점선 바깥 고리도 다르다
- **피할 것**: 광배처럼 도는 매끈한 흰 고리(백환 관리자), 고리 전체 청록(발밑 링)
- **life**: mark 0.3

일식 테 eclipseHalo (전설, eclipseStep look, 반경 210+10/L, inner 110)
- **SPEC**: `halo.eclipseHalo`
  - 바깥 R [[ink,3.6],[p50,1.8]]
  - 안쪽 inner [[ink300,1.2]] 점선 [5,5]
  - 띠 wash ink α0.10
  - crescent: span 90°, α0.35, thick 0.9, 수명 동안 180°, 시작 jit
- **`ribbon`**: 초승 꼬리 끝에서 날리는 청록 리본 두 가닥(먹 위 청록, 종이 반짝)
- **청록 요소**: 리본
- **각성**: 초승 span 110° + 반대편 얇은 초승 α0.18. 개기일식은 §4다
- **가를 점**: **넓고 가는 테 + 도는 먹 초승 그림자 + 리본**이다
- **피할 것**: 세운 원·광배(일식 원장), 가운데 점(5장 눈), 검은 원반 + 코로나(검은 태양)
- **life**: mark 0.3

### 2.8 같은 look 계열이 갈리는 점 (T1이 확인한다)

| look (핵심 그림) | 무기 → 1배에서 보이는 주 신호 |
|---|---|
| boneMortar (수직 낙하 검은 옹기 + 흰 뼛가루 구름 + 가루 점 + 청록 바느질 예고 원) | 먹 파동: 주인공 둘레 검은 띠 / 붓 폭우: 비스듬한 붓 획 + 붓자국 + 찍은 테 / 족자 낙하: 세로 족자 + 앞 반원 파문 / 먹단지: 흰 단지 깨짐 + 먹 튐 / 송이 단지: 작은 깨짐 3~4곳 / 유성 붓: 큰 붓 박힘 + 큰 먹 폭발 + 방사 비백 |
| voidMine (가시 원반 + 소용돌이 팔 + 청록 망점 띠) | 일곱째 인장: 둥근 도장 + 인영 / 침묵의 종: 머리 위 손종 + 흰 고리 3겹 / 타르 항아리: 검은 항아리 깨짐 + 번들한 웅덩이 |
| chainSpark (꺾은 흰 줄) | 먹번개: 수직 번개 / 천둥 박수: 두 손 + 꺾쇠 고리 / 불꽃실: 처진 실 호 + 종이 불꽃 / 폭풍실: 꼬인 두 가닥 / 서리 사슬: 흰 사슬 고리 |
| railSpear (굵은 검은 창 + 청록 심 + 섬광) | 먹창: 가는 창대 + 잎 창날 + 술 / 십자 획: 찢긴 종이 획 넷 / 심판선: 팽팽한 줄 + 떨림 + 먹통 |
| frostLine (분필 띠 + 가루) | 넓은 붓: 넓은 붓질 + 큰 붓 |
| blackSun (검은 원반 + 코로나) | 서리 고리: 흰 서리 띠 + 얼음 결정 |
| orbitScythes (도는 초승 낫) | 먹 궤도: 먹 띠 + 종이 혜성 |
| eclipseStep (안으로 뻗는 붓 획 바퀴 + 둘레 띠) | 수호 고리: 꼰 줄 + 매듭 / 일식 테: 가는 테 + 초승 그림자 + 리본 |

## 3. lob 비행 4종

| group / part | 장 | drive | box | anchor | place · rotate · layer · lod |
|---|---|---|---|---|---|
| inkPots / `pot`, `pot-awakened` | 4씩 | loop 12, still 0 (flight) | 30×34 | 15,17 | air · none · air · info |
| clusterPots / `pot-s`, `pot-m` | 4씩 | loop 12, still 0 | 22×26, 26×30 | 가운데 | air · none · air · info |
| tarJar / `jar`, `jar-awakened` | 4씩 | loop 8, still 0 | 34×38 | 17,19 | air · none · air · info |
| meteorBrush / `comet`, `comet-awakened` | 4씩 | loop 12, still 0 | 32×92 | 16,14 | air · path · air · info |

- **경로**(`SPEC.lob`, `lobPath`)

  | 무기 | H = [k, min, max] | 그림자 rx | 그림자 α |
  |---|---|---|---|
  | inkPots | [0.35, 48, 140] | 9 → 15 | 0.18 → 0.32 |
  | clusterPots | [0.35, 40, 120] | 7 → 12 | 0.18 → 0.32 |
  | tarJar | [0.33, 48, 130] | 10 → 16 | 0.18 → 0.32 |
  | meteorBrush | [0.5, 90, 220] | 12 → 22 | 0.14 → 0.34 |
  | `mini`(갈라짐) | 높이 28 고정 | 5 → 7 | — |

  - 그림자는 땅 위치에 groundMarks 층(적 탄 그림자와 같은 곳)으로 그린다.
  - 물건은 (땅 x, 땅 y − h)에 그린다.
- **먹단지 `pot`**: 흰 백자 단지(종이 몸, 먹 뚜껑, 흘러내린 먹 줄 1, 청록 목 끈)다. 4장 동안 0·25·50·75°만큼 구르며, 빛은 늘 왼쪽 위에서 온다.
- **송이 단지 `pot-s/m`**: 뚜껑 없는 둥근 작은 단지(먹 입 띠)에 청록 끈 꼬리가 펄럭인다. 한 시전의 단지 셋이 같은 자리에서 출발해 갈라지므로 "끈으로 묶은 송이"로 읽힌다. 순번에 따라 크기를 s, m, s로 바꾼다.
- **타르 항아리 `jar`**: 입이 넓은 낮은 검은 항아리(왼쪽 위 ink500 명부)다. 입에서 타르가 흘러 두 줄로 끌리고, 청록 봉인 끈이 있다.
  - 핵심 골분 박격 옹기와 반드시 갈려야 한다. 박격 옹기는 천 뚜껑 + 노끈 매듭이고 수직으로 떨어진다. 타르 항아리는 열린 입 + 흘러내리는 줄이고 옆으로 포물선을 그린다.
- **유성 붓 `comet`**: 큰 붓(종이 쇠테 + 먹 붓털 + 뾰족한 끝)이 머리부터 날아간다. 뒤로 비백 먹 꼬리(60~70)를 끌고 꼬리 심이 청록이다.
  - `rotate: path`라 경로 접선을 따라 돈다. 높고 가파른 포물선이다.
  - 횃불처럼 둥근 머리는 금지다.
- **착지**: 엔진의 `area/blast`가 나는 순간 비행 그림을 지우고 §2.4 착탄으로 넘긴다. 착지 예고 원은 그리지 않는다(아군 공격이라 피할 필요가 없다. 핵심 골분 박격의 청록 바느질 원과 겹치지 않기 위해서다).
- **상한**: 화면당 비행 12/12/6(full/reduced/minimal)이다. minimal에서는 still 장과 그림자만 그린다.
- **life**: 비행은 자료(지연 0.55·0.6·0.7·1.0초)가 정한다.

## 4. 각성 기믹 44종

### 4.1 우선순위
- **P1**: 그 무기의 기믹을 알아보는 데 꼭 필요한 그림이다. 3차 납품에서 먼저 그린다.
- **P2**: 기믹을 더 잘 보이게 하는 그림이다. 상한이 넘으면 먼저 버린다.
- **P3**: 선택이다. 지금 표시(기절 점, 탄 그림 등)로 충분하다.

| 무기 | 기믹 | 우선 | 그림 (단계 / 조각) | 자료 |
|---|---|---|---|---|
| inkDarts | 먹 얼룩 | P2 | 표식 `mark-stain1~3`, 터짐 `stainBurst` + `ring.stainBurst` r70 | `awk.stain`·`stainUntil`, `area/blast`(echo) |
| brushQuills | 늦게 터지는 붓자국 | P2 | 대기 `dab`(0.6초) → `dabBurst` + `ring.dabBurst` r50 | 새 `pending`(§9-3) |
| sealArrows | 도미노 | P2 | `topple`(부딪힌 자리) | `enemy/stunned` source |
| frostNeedles | 동결 | **P1**(얼어붙음), P2(서리 수) | `freeze-back<r>`·`freeze-front<r>`, `frost1<r>`·`frost2<r>` | 새 `awk.freeze`, `awk.frost` |
| thunderNeedles | 감전 도약 | P2 | `line.leap` + `leapHit` | ChainEffect skillId |
| twinBlades | 회전 베기 | **P1** | 땅 조각 `spin` + 소용돌이 호 + `rim.ally` r60 | zones |
| ghostVolley | 혼령 이어쏘기 | P3 | (선택) `wisp` | echo 탄 생성 |
| headsmanDarts | 공포 | P2 | `ring.fear` r160 + 표식 `mark-fear` | `awk.fear`, skillMark |
| paperStorm | 소용돌이 | — | 탄 경로가 이미 휜다. 그림 없음 | |
| inkBloom | 번지는 꽃가루 | P2 | `spore` + `ring.pollen` r50 + `pollenPuff` | `awk.pollen`, skillMark |
| thornHalo | 가시 박힘 | P2 | 발 `thorn<r>` | `awk.thorn` |
| starShards | 튕김 | P3 | (선택) `bounce` | echo 탄 |
| sunNeedles | 작열 | P2 | 그림 없음. 렌더러가 탄 조각을 radius/size(≤ 1.6)배로 키운다 | `shot.radius` |
| inkDrizzle | 두 줄기 | — | 그림 없음 | |
| pinHail | 마름쇠 | **P1** | 땅 조각 `caltrop-a/b/c`(상한 24), P2 `caltrop-snap` | zones |
| tailGuard | 배후 응징 | P2 | `rearHit` | skillMark |
| smokeTail | 연막 | **P1**(땅), P2(헤맴) | 땅 조각 wash + `puff-a/b/c`, 표식 `lost` | zones, `awk.wander` |
| gravePins | 묘비 | **P1**(땅), P2(묶임) | 땅 조각 `grave-a/b/c` + `grave-rise`, 발 `bound<r>` | zones, 새 `awk.bound` |
| trackingSeals | 삼각 봉인 | **P1** | `line.edges` + `sealCorner` + `sealStrike` | beams(폭 2 → 8) |
| huntersMarks | 사냥감 | **P1** | 표식 `mark-prey` | `awk.prey` |
| crowFeathers | 까마귀 떼 | **P1** | `crow`(맴돌기) + `peck` | `awk.crow`·`crowAt` |
| bossbane | 균열 | P2 | 보스 표식 `mark-crack1~5`, `crackBurst` + `ring.crackBurst` r90 + 종이 균열선 | `awk.crack`, `area/blast` |
| inkLightning | 번개 기둥 | **P1** | 땅 조각 `pillar*` + `rim.ally` r40 | zones |
| brushDownpour | 거세지는 폭우 | **P1** | §2.2 자국 s/m/l + 고리 R이 따라 커진다 | `area/blast` 반경 |
| fallingScroll | 펼쳐지는 족자 | **P1** | `line.unroll` + `roller` | beam(skillId fallingScroll) |
| seventhSeal | 여덟째 인장 | **P1** | 대기 그림자 → `seal8` + `print8` + 무거운 고리 r120 | 새 `pending`, `area/blast` echo |
| inkPulse | 밀쳐 부딪힘 | P2 | `bump`(벽에 부딪힌 자리) | `enemy/stunned` source |
| frostRing | 혹한 | P3 | 그림 없음 | |
| thunderclap | 메아리 | P2 | `ring.thunderclapEcho` 1.4R | `area/blast` echo |
| silenceBell | 침묵 | **P1** | 표식 `mark-silence` | `awk.silence` |
| inkPots | 불먹 | **P1** | 땅 조각 wash + `flame-a/b`, 적 발 `scorch<r>`(산호 물듦 대신) | zones |
| clusterPots | 갈라짐 | P2 | 대기 `mini` 둘이 ±60으로 날아감 → `burst` + 고리 0.6R | 새 `pending`, `area/blast` echo |
| tarJar | 끈끈이 모음 | **P1** | 땅 조각 wash + 윤기 + `string-a/b` + `jarBroken` | zones |
| meteorBrush | 별똥 자국 | **P1**(땅), P2(결 가속 표시) | `crater` + wash + `rim.pad` + `mote-a/b`, 주인공 `haste` | zones |
| sparkThread | 되감김 | P2 | `line.sparkThread`의 되감기 변형 | ChainEffect echo |
| stormThread | 증폭 | P2 | twist 굵기·진폭이 구간마다 커진다. `gust-a`→`-b` | ChainEffect |
| frostChainlet | 묶인 사슬 | P2 | `line.frostLink`(2초) | `awk.link` |
| inkLance | 가지창 | P2 | 가지 빔(술 없음) + `fork` | BeamEffect echo |
| wideBrush | 되쓸기 | P2 | 되쓸기 빔 α0.65, 붓 방향 반대 | BeamEffect echo |
| crossStrokes | 도는 십자 | P3 | 그림 없음(돌아가는 게 보인다) | |
| judgmentLine | 심판의 값 | P3 | 지금의 엽전 반짝임 유지 | skillMark glint |
| inkOrbit | 되받기 | P2 | 되받은 탄 `deflect-*` | Projectile echo |
| wardRing | 약화 | P2 | 표식 `mark-weak` | `awk.weak` |
| eclipseHalo | 개기일식 | **P1** | `halo.eclipseTotal` + `corona-a/b` + 리본 | skillMark heavy |

### 4.2 땅 조각 8종 (RenderWorld.zones)

| group / part | 장 | drive | box | anchor | place · layer · lod |
|---|---|---|---|---|---|
| twinBlades / `spin` | 4 | loop 16, still 0 (zone) | 40×40 | 20,20 | center · ally · info |
| twinBlades / `spin-end` | 2 | prog 0.15 (zone-end) | 40×40 | 20,20 | center · ally · info |
| pinHail / `caltrop-a`, `-b`, `-c` | 1씩 | idx (variant) | 44×26 | 22,17 | center · ground · info |
| pinHail / `caltrop-snap` | 2 | prog 0.15 (event) | 44×30 | 22,19 | center · ally · deco |
| smokeTail / `puff-a`, `-b`, `-c` | 4씩 | loop 6, still 0 | 40×28 | 20,24 | disc · ground · info(1개) / deco |
| gravePins / `grave-a`, `-b`, `-c` | 1씩 | idx | 48×36 | 24,27 | center · stand · info |
| gravePins / `grave-rise` | 2 | prog 0.15 (zone-start) | 48×36 | 24,27 | center · stand · info |
| inkLightning / `pillar-start`, `pillar`, `pillar-end` | 2, 4, 2 | prog 0.12 / loop 12, still 0 / prog 0.2 | 32×84 | 16,78 | center · stand · info |
| inkPots / `flame-a`, `flame-b` | 6씩 | loop 12, still 0 | 22×28 | 11,25 | disc · ground · info(1개) / deco |
| tarJar / `string-a`, `string-b` | 4씩 | loop 8, still 1 | 40×14 | 36,7 | ring · radial · ground · info(3개) / deco |
| tarJar / `jarBroken` | 1 | idx | 36×26 | 18,18 | center · ground · info |
| meteorBrush / `mote-a`, `mote-b` | 4씩 | cycle 1.2 | 10×14 | 5,12 | disc · ally · deco |

- **공통**
  - 땅 조각 테는 `rim.ally`(바느질 점선)다. 적 지대의 실선 산호·호박 테, 중립 지대(물·덫)의 먹 실선과 무늬로 갈린다(P4, 색각).
  - **기호 원판과 allyGlow 채움은 쓰지 않는다.**
  - 수명은 자료(`life`·`maxLife`)를 따른다. 시작 0.15초, 끝 0.3초에 α 0→1, 1→0이다. 테는 수명 끝까지 그린다(V4).
- **회전 베기**
  - 종이 초승 날(쌍날 탄과 같은 물건, 손잡이 없음)이 제자리에서 돈다.
  - SPEC `zone.twinBlades`: 0.75R의 종이 호 둘(70°, [[ink,3.2],[p50,1.6]])이 초당 2바퀴 시계 방향으로 돈다. 감소 모션에서는 멈춘다.
  - `rim.ally` r60
  - 초승 궤도(주인공 둘레를 계속 도는 낫)와 다르다. **자리에 박혀** 0.5초 동안 돈다.
- **마름쇠**
  - 끝을 땅에 박은 단검 핀 2~3개(속 빈 고리 손잡이가 위)를 덤불처럼 세운다.
  - 핀 하나의 날 홈이 청록이다. 바닥 그림자 타원은 rx 18이다.
  - 테·채움이 없다. 최대 24개가 고르게 퍼져도 "같은 단추 줄"이 되지 않도록 변형 3개를 섞는다.
- **연막**
  - SPEC wash ink300 α0.16 + `rim.ally`
  - `puff`: ink500·ink300의 경계가 또렷한 연기 덩이 + 열린 컬 획이다. 굴러 흐르고, 한 덩이당 크기가 다르다. 애벌레처럼 같은 덩이가 이어지면 금지다.
  - layout: disc, per 26, min 2, max 4, margin 16
- **묘비**
  - 땅에 박힌 핀이다. 머리는 작은 둥근 비석판(종이 + 먹 테, 글자·십자 없음)이고, 핀대에 청록 실이 감겨 있다. 바닥 그림자 rx 22다.
  - `stand` 층이다.
  - 4장 바닥의 문자판 비석·부러진 바늘과 갈리도록 작고 밝게 그리고 청록 실을 둔다(로어 §1.3·§5).
- **번개 기둥**
  - 좁은(≤ 14) 먹 번개 기둥이 서서 깜빡인다. 청록 심이 있고, 꼭대기에 먹구름 조각 하나가 있다.
  - `rim.ally` r40
  - 기둥이 몸 위를 덮지 않도록 `stand` 층에 둔다.
- **불먹**
  - SPEC wash ink α0.24 + `rim.ally`
  - `flame`: 혀 2~3개를 합친 **먹 불길**이다. 먹 실루엣 안에 청록 몸 + allyG 심, 끝에 종이 불티 점이 있다.
  - layout: disc, per 24, min 2, max 5, margin 10
  - 적 불(K11)과의 차이: 산호 몸 불길 + 숯불 바닥 + 실선 산호 테가 없다. 시안 `b7-mock-allyfire-vs-fire`에서 갈림을 확인했다. 불길은 시안보다 크고 촘촘하게 그린다.
- **끈끈이 모음**
  - SPEC wash ink700 α0.32 + 윤기 호 [[p300,1.4]](0.55R·0.7R, 200~250°) + `rim.ally`
  - `string`: 테에서 가운데로 늘어난 타르 줄이 조여 든다. layout: ring 5~7개, dr −6.
  - 가운데에 깨진 항아리를 둔다.
  - 무음 지뢰 소용돌이와의 차이: 도는 팔과 청록 망점이 없다. 적 감속 늪(K11)과의 차이: 해칭과 호박 테가 없다.
- **별똥 자국**
  - `crater` 위에 SPEC wash p50 α0.14 + `rim.pad`(실선, 결이 안에 있으면 굵어짐)를 둔다.
  - `mote`: 종이 별가루가 오른다(5~6갈래 불규칙). layout: disc, per 30, min 3, max 6.
  - 결이 안에 있으면 `haste`(표 §4.4)를 그린다.
  - 결이 **서야 할 곳**으로 읽혀야 한다. 다른 땅 조각은 모두 점선 테인데 이것만 실선 테다. 골분 박격 예고(종이 α0.25 + 청록 망점 + 바느질)와도 갈린다.

### 4.3 적 위 표식 (Entity.awk)

| group / part | 장 | drive | box | anchor | place · layer · lod |
|---|---|---|---|---|---|
| silenceBell / `mark-silence` | 1 | idx (status) | 22×22 | 11,20 | over · head · info |
| huntersMarks / `mark-prey` | 2 | loop 4, still 0 | 22×24 | 11,22 | over · head · info |
| headsmanDarts / `mark-fear` | 1 | idx | 22×22 | 11,20 | over · head · info |
| wardRing / `mark-weak` | 1 | idx | 22×22 | 11,20 | over · head · info |
| inkDarts / `mark-stain1`, `-2`, `-3` | 1씩 | idx (stack) | 22×22 | 11,20 | over · head · info |
| bossbane / `mark-crack1` ~ `-5` | 1씩 | idx (stack) | 26×24 | 13,22 | over · head · info |
| smokeTail / `lost` | 4 | loop 8, still 0 | 24×14 | 12,10 | over · head · deco |
| crowFeathers / `crow` | 6 | loop 12, still 0 | 26×18 | 13,9 | orbit · face · head · info |
| crowFeathers / `peck` | 2 | prog 0.12 (event) | 16×16 | 8,8 | orbit · head · deco |
| inkBloom / `spore-a`, `-b` | 4씩 | cycle 1.0 | 10×14 | 5,12 | over · head · deco |
| frostNeedles / `frost1-12/19/28`, `frost2-12/19/28` | 1씩 | idx (stack) | 36×20, 48×24, 64×30 | 가운데 | feet · feet · info |
| frostNeedles / `freeze-back-12/19/28` | 1씩 | idx | 같음 | 가운데 | feet · feet · info |
| frostNeedles / `freeze-front-12/19/28` | 1씩 | idx | 32×24, 44×30, 60×38 | 16,20 · 22,25 · 30,32 | feet · front · info |
| gravePins / `bound12/19/28` | 1씩 | idx | 34×20, 46×24, 62×30 | 가운데 | feet · front · info |
| inkPots / `scorch12/19/28/38/54` | 2씩 | loop 8, still 0 | 30×18, 40×22, 56×26, 72×30, 96×34 | 15,14 · 20,17 · 28,21 · 36,25 · 48,29 | feet · front · info |
| thornHalo / `thorn12/19/28/38/54` | 1씩 | idx | 30×16, 40×18, 56×22, 72×26, 96×30 | 가운데 | feet · feet · info |

- **머리 위 표식**: 칠한 크기 16~18이다. 14px 시안은 1배에서 겨우 갈렸다(`b7-mock-emblems-x1`). 그림은 기믹의 **물건**이다.

  | 표식 | 그림 |
  |---|---|
  | 침묵 | 입을 청록 실로 동여맨 종이 손종(무기의 종 그대로) |
  | 사냥감 | 구멍 뚫린 종이 패가 청록 끈 고리에 매달려 흔들린다 |
  | 공포 | 종이 식은땀 방울 하나(먹 테 + 청록 반짝 획, 머리 뒤쪽으로 비켜 둔다) |
  | 약화 | 수호 고리의 꼰 줄 매듭(청록 바느질 한 땀) |
  | 얼룩 1~3 | 먹 얼룩이 커지고, 2부터 방울 1~2, 3에서 거의 젖은 큰 얼룩이 된다. 종이 테 1.2 |
  | 균열 1~5 | 보스 머리 위 종이판에 한 모서리에서 갈라지는 금 1~5. 가장 새 금이 청록 심이다 |
  | 헤맴 | 머리 위를 도는 담묵 연기 컬 둘(`lost`). 점이 아니라 컬이다(기절 점 셋과 갈린다) |

  - 시안 `b7-mock-emblems-x4`의 모양을 출발점으로 쓴다. 약화 매듭은 리본 나비처럼 귀엽게 읽히지 않도록 꼰 줄로 그린다.
- **까마귀**
  - 먹 까마귀 실루엣(날개 가장자리 종이 획, 다리에 청록 실, 눈 없음)이다.
  - 맴돌기: 머리 위 (0, top − 8) 둘레를 rx 14·ry 5 타원으로 0.9초에 한 바퀴 돈다.
  - 쪼기: `crowAt` 틱마다 0.12초 동안 머리로 내려오고 `peck`이 번쩍인다.
  - 감소 모션에서는 머리 위 (6, top − 6)에 앉아 멈춘다.
  - 적과 헷갈리지 않아야 한다. 새 모양 먹귀는 없다. 종탑 간수의 "등롱 속 종이 새"와는 먹 실루엣과 청록 실로 갈린다.
- **발 오버레이**
  - 동결: 발밑 얼음판 + 뒤 서릿발(`-back`), 앞 서릿발이 몸 높이의 40%까지 올라온다(`-front`). **눈을 가리지 않는다.**
  - 서리 수: 발밑 서릿발이 1→2로 자란다.
  - 묶임: 청록 실 고리가 발을 땅에 꿰매고, 그 옆에 묘침이 꽂혀 있다.
  - 불먹: 발밑 먹 불길(청록 심)이다.
  - 가시: 발 둘레 땅에 박힌 휜 장미 가시 2~3(먹 + 종이 가장자리, 한 가시에 청록 심)이다. **머리 둘레 고리 금지**(가시관).
  - 동결은 백묵 절단의 `root<r>-awakened`(분필 고리) 대신 그린다(§9-4).
- **꽃가루**: 적에게서 꽃가루 포자 2개가 오른다. 0.5초마다 `ring.pollen` r50([[ink,1.6],[ally,1]] 점선 [4,5], 0.6→1 / 0.25초)과 `pollenPuff`가 함께 난다.

### 4.4 이어지는 효과

| group / part | 장 | drive | box | anchor | place · layer · lod |
|---|---|---|---|---|---|
| inkDarts / `stainBurst` | 3 | prog 0.3 | 64×52 | 32,30 | center · ally · info |
| brushQuills / `dab` | 3 | prog (pending) | 28×18 | 14,9 | target · ground · info |
| brushQuills / `dabBurst` | 3 | prog 0.24 | 52×40 | 26,24 | center · ally · info |
| sealArrows / `topple` | 2 | prog 0.16 (event) | 32×28 | 16,14 | event · ally · deco |
| thunderNeedles / `leapHit` | 2 | prog (chain) | 24×24 | 12,12 | point · ally · deco |
| inkPulse / `bump` | 2 | prog 0.16 (event) | 32×32 | 16,16 | event · ally · deco |
| inkBloom / `pollenPuff` | 3 | prog 0.3 | 36×28 | 18,18 | target · ally · deco |
| tailGuard / `rearHit` | 3 | prog 0.2 | 40×32 | 20,18 | target · ally · deco |
| trackingSeals / `sealCorner` | 3 | prog (pending 0.6) | 26×20 | 13,10 | point · ally · info |
| trackingSeals / `sealStrike` | 3 | prog 0.28 | 48×40 | 24,22 | center · ally · info |
| fallingScroll / `roller` | 2 | loop 12, still 0 (beam) | 36×24 | 18,12 | tip · beam · ally · info |
| seventhSeal / `seal8` | 4 | prog 0.45, `flash: true` | 60×80 | 30,74 | center · ally · info |
| seventhSeal / `print8` | 1 | idx (decal 1.2) | 88×36 | 44,18 | center · ground · deco |
| clusterPots / `mini` | 2 | loop 12, still 0 (pending) | 16×18 | 8,9 | air · air · info |
| inkLance / `fork` | 2 | prog 0.2 | 28×28 | 14,14 | origin · beam · ally · deco |
| inkOrbit / `deflect-start`, `-travel`, `-end` | 2씩 | prog 0.06 / loop 12, still 0 / prog 0.1 | 40×18 | 27,9 | air · vel · ally · info |
| eclipseHalo / `corona-a`, `-b` | 2씩 | prog 0.3 | 26×14 | 3,7 | ring · radial · ally · deco |
| meteorBrush / `haste` | 4 | loop 12, still 0 (status) | 52×40 | 26,36 | hero · face · front · info |
| ghostVolley / `wisp` (P3) | 3 | prog 0.24 | 22×30 | 11,27 | event · ally · deco |
| starShards / `bounce` (P3) | 2 | prog 0.15 | 22×22 | 11,11 | event · ally · deco |

- **삼각 봉인**
  - 대기 0.6초(빔 폭 2): `line.edges.pre`가 모서리에서 모서리로 변을 꿰매 나간다([[ink,2.6],[ally,1.4]] 점선 [6,4]).
  - 세 모서리(적)에는 작은 인영 `sealCorner`가 찍힌다.
  - 터짐(빔 폭 8): `edges.strike` [[ink,4],[ally,2.2],[allyG,0.7]] + 삼각형 채움 p50 α0.25를 0.1초 둔다. 무게중심에 `sealStrike`가 찍힌다.
- **펼쳐지는 족자**
  - `line.unroll` brushBand: p50 α0.5, 곧은 가장자리 [[ink,1.6]], 산 능선 한 획 [[ink,1.4]](혹 2, 진폭 0.25w), 0.2초에 펼친다.
  - 머리에 `roller`가 구른다.
  - 지금의 폭 100짜리 먹 막대(§0.1 ⑨)를 대신한다.
- **여덟째 인장**
  - 대기 0.3초: 무게중심에 SPEC 먹 그림자 타원이 커진다(rx 18→64, α 0.12→0.35). 일곱 인영에서 가운데로 청록 바느질 선([[ink,2],[ally,1]] 점선)을 진행률만큼 긋는다(deco).
  - 그다음 `seal8` + `print8` + 무거운 고리 r120([[ink,4],[ally,2.2],[allyG,0.7]] + wash p50 α0.2)를 그린다.
- **메아리**: `ring.thunderclapEcho`(jag 1.4R, [[ink300,3.4],[ally,1.6]] α0.75)만 그리고 손은 그리지 않는다.
- **갈라짐**: 터진 자리에서 `mini` 둘이 ±60 자리로 0.35초 동안 날아가(높이 28) 작은 `burst` + 고리 0.6R가 된다.
- **되감김**: 같은 sag 문체를 sag −0.16, [[ink,2.6],[ally,1.4],[allyG,0.5]]로 꼬리에서 머리로 그려 나간다.
- **증폭**: 구간 i마다 가닥 굵기 ×(1 + 0.15i), 진폭 ×(1 + 0.1i)다. i ≥ 3이면 `gust-b`를 쓴다.
- **묶인 사슬**: 살아 있는 구성원을 차례로 잇는 `line.frostLink`(links α0.45, pitch 20)를 2초 동안 둔다. 피해를 나눌 때는 0.18초 동안 온전한 links를 그린다.
- **가지창**: 가지 빔은 술 없는 먹창이다. 가지 시작점에 `fork`를 둔다.
- **되쓸기**: 같은 넓은 붓 띠를 α0.65로, 붓 방향을 뒤집어 그린다.
- **되받기**: 되받은 탄 `deflect`는 종이 파편 혜성 + 먹 테 + 청록 소용돌이 심이다.
  - 판정 r은 되받은 적 탄 반지름(7)이다. 앞끝은 r − 0.5 ~ r + 2.5, 옆 ≤ r + 2.5, 뒤 ≤ 8r(K9 §4.2와 같은 규칙)이다.
  - 먹알 + 종이 점(적 탄)으로 읽히면 안 된다.
- **얼룩 터짐·늦은 붓자국·균열 터짐**
  - 가운데 조각 + SPEC 고리(r70, r50, r90)를 그린다.
  - 균열 터짐에는 6~8줄 종이 균열선([[ink,3],[p50,1.4]], 두 줄에 청록 심, 0.9R까지, 한 번 가지)을 더한다.
  - 균열 장교의 호박·산호 균열(K11 shock)과 색으로 갈린다.
- **공포 고리**: `ring.fear`는 r160의 찢긴 종이 띠다(p50 3 + 먹 테 1.2, 안쪽 찢김). 0.4R→R로 0.15초에 퍼지고 α0.85다.
- **결 가속**(`haste`)
  - 결 발 뒤로 감아 오르는 청록 속도 획 둘 + 종이 별가루 2를 그린다.
  - 칠한 범위는 y −34 ~ −11이다(얼굴과 발밑 링을 피한다, C7).
  - 별똥 자국 테가 굵어지는 것과 함께 보인다.

### 4.5 혼잡 상한과 버리는 순서
- **적 하나에 붙는 수**
  - 머리 위 표식은 **하나**다. 순서: 침묵 > 사냥감 > 공포 > 헤맴 > 약화 > 얼룩. 보스의 균열판은 따로 늘 그린다.
  - 발 오버레이도 **하나**다. 순서: 동결 > 묶임 > 불먹 > 서리 2 > 서리 1 > 가시 > 서리 사슬 얼음판.
  - 까마귀, 꽃가루 포자는 따로 센다.
- **화면 상한**(full / reduced / minimal). 주인공에게 가까운 것부터 그린다.

  | 묶음 | 상한 |
  |---|---|
  | 머리 위 표식(헤맴 포함) | 24 / 16 / 8 |
  | 발 오버레이 | 24 / 16 / 8 |
  | 까마귀 | 12 / 8 / 4 |
  | 꽃가루 포자 | 16 / 8 / 0 |
  | 꽃가루 고리 | 8 / 4 / 0 |
  | 사건 조각(`bump`·`topple`·`rearHit`·`leapHit`·`pollenPuff`·`peck`·`caltrop-snap`) | 16 / 10 / 4 |
  | 땅 조각 조각 | 120 / 72 / 36 |
  | 데칼 | 16 / 8 / 0 |
  | 비행 | 12 / 12 / 6 |
  | 대기 표시 | 12 / 12 / 12 |
  | 서리 사슬 links 도형 | 120 / 60 / 0 |

- **땅 조각 하나 안의 상한**: 연기 4, 불길 5, 타르 줄 7, 별가루 6이다. reduced에서는 deco를 절반으로 줄인다. minimal에서는 조각마다 물건 1개(마름쇠, 묘비, 기둥, 회전 날, 항아리, 분화구)와 SPEC 채움·테만 남긴다.
- **넘칠 때 버리는 순서**: deco 조각 → 사건 조각 → 데칼 → 먼 표식 → 먼 발 오버레이 → 땅 조각 안 여분이다.
- **버리지 않는 것**: 판정 고리·선·띠·테, 주 물건, 비행, 대기 표시, 동결.

## 5. 층·LOD·감소 설정·예산

### 5.1 층 (TEC-12 계약 안)
- **바닥**: 시체 얼룩 뒤에 K10 데칼(붓자국, 인영, 단지 튐, 타르 웅덩이, 분화구, 그을음)을 그린다.
- **위험지형 층**: K10 땅 조각(채움·테·ground 조각)을 맨 먼저 그린다. 그다음 아군 지대(K4), 그다음 적 위험지형(K11) 순이다.
- **groundMarks**: 적 발 오버레이(feet), lob 그림자, 대기 그림자를 그린다.
- **bodies**: `stand` 조각(묘비, 번개 기둥)을 발 y로 정렬해 함께 그린다. 각 적 몸 바로 뒤에 front 오버레이, 주인공 몸 뒤에 `haste`를 그린다.
- **overheads**: K10 머리 위 표식, 까마귀, 포자, 헤맴을 그린다.
- **allyAttacks**: K10 고리·띠·선, 물건, 비행 물건, 대기 표시, 사건 조각을 그린다. 적 탄과 텔레그래프보다 아래다(V3).

### 5.2 LOD (보이는 적 수)

| LOD | K10 |
|---|---|
| full (< 80) | 전부 |
| reduced (80~159) | 루프 fps 절반, deco 절반, 상한은 §4.5 가운데 값 |
| minimal (≥ 160) | 루프는 still 장에서 멈춘다. deco·데칼·포자·꽃가루 고리 0, 사슬 links는 꺾은 줄 하나. 판정 도형·주 물건·땅 조각 물건 1개·표식 8·비행은 남긴다 |

### 5.3 감소 모션·감소 섬광

| 설정 | 처리 |
|---|---|
| 감소 모션 | 루프는 still 장(인스턴스마다 다른 phase 장)에 둔다. 고리 퍼짐(grow)은 하지 않고 R에서 α로만 들어온다. 회전하는 것(혜성, 초승, 회전 베기 호, 까마귀)은 시작각에 멈춘다. 깜빡임은 첫 seed에 고정한다. prog 조각은 재생한다 |
| 감소 섬광 | `flash: true` 조각만 α × 0.5다. 다른 조각의 한 장 안 종이 섬광은 30% 이하다 |

### 5.4 예산

| 항목 | 상한 | 이 지시서의 계획 |
|---|---|---|
| 조각 장 수 | 380 | 361 |
| 박스 넓이 합 | 640,000 단위² | 약 611,000(가장 큰 것: 유성 붓 7.8만, 붓 폭우 6.0만, 먹번개 5.7만, 먹단지 4.9만) |
| 팩 | 새 `arsenal-fx` 2048² 1장 기대(최대 2장) | 메인 세션이 `npm run build:atlas`로 잰다 |
| 화면당 K10 조각 그리기 | 220 / 140 / 70 | 렌더러가 세서 §4.5 순서로 버린다 |
| 렌더 비용 | 메인 세션 측정 | stress(적 400, minimal) + 각성 무기 6개 장면에서 K10 팩을 켤 때와 끌 때 work p95 차이 ≤ 0.4ms. full LOD 게임 장면(적 80 안팎)에서 ≤ 0.6ms. K11 몫(0.5ms)과 더해 8ms 게이트를 넘지 않는지 함께 본다(§11 Q8) |

- 한 빌드의 액티브 칸은 6개다(`buildDepth.ts:29`, remaster `buildDepth: true`). 그래서 각성 무기가 동시에 7개 이상인 장면은 없다.
- SYS-16 측정에서 44종을 모두 각성한 시험 장면의 땅 조각은 최대 79개였다.

## 6. 참고할 것과 피할 것

**참고**
- 같은 물건: K9 지시서 §3.4의 22종 아이콘 모티프를 따른다. K9 3차 납품이 합격하면 C15로 대조한다.
- 선 굵기 위계와 샌드위치: `API-skills-vfx.md` §6
- 땅 조각 배치·상태 창: K11 지시서 §1.4~§1.6
- 탄 판정 규칙(되받은 탄): K9 지시서 §4.2

**피할 것**

| 무엇 | 이유 |
|---|---|
| 핵심 look 그림 빌리기(실 고리 + look 조각) | 사용자가 지적한 "구분 안 됨"의 원인이다(§0.1) |
| allyGlow 원판 채움, 가운데 기호 원판 | P1(대비 1.04:1)과 적 기호 문법 위반이다 |
| 적 몸에 산호(불먹), 적 위에 자수정(침묵) | V2, 정예 표식과 혼동된다 |
| 혀 하나짜리 불길을 흩기, 한 개짜리 서리 결정 | 1배에서 물방울·화살촉으로 읽힌다(K11 `b6-mock-fire`, `b7-mock-frost`) |
| 굵기가 고른 닫힌 고리 | 'O'로 읽힌다 |
| 같은 간격 평행선, 고른 방사 | 해칭과 햇살로 읽힌다 |
| 머리 둘레 가시, 범종, 합장, 교수대 | 문화 위험(로어 §1.4) |

## 7. 합격 기준

### 7.1 판독 시험

| # | 시험 | 합격 |
|---|---|---|
| T1 | 같은 look 계열(C4 `SEL="look:…"`, 1배, 색과 흑백, 1·3·5장 바닥) | 이름표를 가리고 계열 안의 모든 무기와 핵심 그림을 서로 구별한다. 꼭 볼 묶음: boneMortar(6 + 핵심), chainSpark(5 + 핵심), voidMine(3 + 핵심), railSpear(3 + 핵심), eclipseStep(2 + 핵심) |
| T2 | 같은 kind(`SEL="kind:…"`, 1배, 흑백) | strike 4, nova 4, lob 4, chain 3, beam 4, halo 3이 모두 갈린다 |
| T3 | 섞은 22종(`SEL="all"`, `BLIND=true`, 0.5배 개관) + 정답표 | 검수자가 §2 표만 보고 22종 중 20종 이상을 맞힌다. 헷갈린 쌍은 납품서에 적고 고친다 |
| T4 | 기믹(C5, P1·P2, 1배, 이름표 판과 섞은 판) | P1은 모두, P2는 90% 이상을 §4.1 표만 보고 맞힌다 |
| T5 | 적 위 표식(C13, 1배와 4배, 흑백) | 표식끼리, 그리고 정예 3점 관·기절 점·폭탄병 불꽃·XP 옥과 갈린다. 먹귀 눈을 가리지 않는다 |
| T6 | 혼잡(C12, 1배·0.8배, 색·흑백) | 결이 가장 밝은 물체다. 적 탄과 호박 예고가 그대로 읽힌다. K10 채움이 결보다 밝지 않다. 상한이 지켜진다 |
| T7 | 아군 대 적 지형(C14, 흑백·deutan·protan) | 불먹↔불, 끈끈이↔감속, 연막↔물·null, 마름쇠·묘비↔덫·속박, 별똥 자국↔골분 박격 예고, 번개 기둥↔shock 예고가 무늬·테로 갈린다 |

- 정식 판독 시험(n ≥ 8)은 통합 뒤에 팀이 한다(바이블 §14).

### 7.2 명령
- 결과 PNG는 Read로 직접 연다.
- `--check`를 붙인 명령은 `ok`이고 kit error가 0건이어야 한다.
- 바꿔 돌리는 변수: `SEL`, `GRAY`, `AW`, `BLIND`, `PRI`, `MODE`, `CH`, `G`. 이름 끝을 맞춰 다시 돌린다.

**C1 모든 호출**: 모든 조각 장, 모든 단계(평상·각성 × 레벨 1·5), 모든 오버레이.
```
node scripts/art-review-sheet.mjs expr --name k10-c1-all --scale 0.25 --check --expr '(function(){var X=PN.arsenalFx,s="",n=0;function put(m,k){s+="<g transform=\"translate("+(n%24)*140+","+Math.floor(n/24)*140+")"+(k?" "+k:"")+"\">"+m+"</g>";n++;}X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++)put(X.stamp(g,p.part,{frame:f}),"translate(46,46)");});});X.ids.forEach(function(id){(X.META[id].stages||[]).forEach(function(st){[false,true].forEach(function(aw){[1,5].forEach(function(lv){put(X.draw(id,st,{level:lv,awakened:aw,p:0.4,t:0.2,seed:7}),"translate(70,70) scale(0.2)");});});});});X.overlays.forEach(function(k){[12,19,28,38,54].forEach(function(r){[1,3].forEach(function(st){put(X.overlay(k,{r:r,stack:st,t:0.3}),"translate(70,120)");});});});return s;})()'
```

**C2 조각 표와 예산**: 첫 줄이 `frames=… ok boxArea=… ok badParts=0`이어야 한다. 표 전체를 납품서에 붙인다.
```
node scripts/art-review-sheet.mjs expr --name k10-c2-parts --scale 1 --expr '(function(){var X=PN.arsenalFx,rows=[],fr=0,area=0,bad=[],D=["loop","prog","cycle","idx"],LY=["ground","feet","front","stand","ally","head","air"],RT=["none","radial","tangent","beam","vel","path","face"],PL=["target","center","hero","head","origin","tip","point","ring","disc","line","feet","over","orbit","air","event"],DATA=["pending","beam","chain"];X.groups.forEach(function(g){X.parts(g).forEach(function(p){fr+=p.frames;area+=p.frames*p.box[0]*p.box[1];rows.push(g+"/"+p.part+" f"+p.frames+" "+p.drive+(p.fps?"@"+p.fps:"")+(p.seconds?" "+p.seconds+"s":"")+(p.still!=null?" still"+p.still:"")+" box"+p.box.join("x")+" a"+p.anchor.join(",")+" "+p.place+" "+p.rotate+" "+p.layer+" "+p.lod+(p.flash?" flash":"")+(p.r?" r"+p.r:"")+" w:"+p.window);var timed=p.drive==="prog"||p.drive==="cycle";if(D.indexOf(p.drive)<0||LY.indexOf(p.layer)<0||RT.indexOf(p.rotate)<0||PL.indexOf(p.place)<0||(p.lod!=="info"&&p.lod!=="deco")||(p.drive==="loop"&&!(p.fps>0&&p.still!=null))||(timed&&!(p.seconds>0)&&DATA.indexOf(p.window)<0)||!/^[\x20-\x7e]+$/.test(String(p.window))||p.anchor[0]<0||p.anchor[1]<0||p.anchor[0]>p.box[0]||p.anchor[1]>p.box[1])bad.push(g+"/"+p.part);});});var L=["frames="+fr+(fr<=380?" ok":" FAIL")+" boxArea="+area+(area<=640000?" ok":" FAIL")+" badParts="+bad.length+" "+bad.slice(0,8).join(" ")].concat(rows);return "<rect width=\"1500\" height=\""+(24+L.length*16)+"\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(16+i*16)+"\" font-size=\"11\" font-family=\"monospace\">"+t.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</text>";}).join("");})()'
```

**C3 조각 확대**(그룹마다): `G`를 바꿔 돌린다. 칸마다 1장 바닥색, 3단위 여백 점선, 앵커 십자(리뷰 표시)를 둔다.
```
node scripts/art-review-sheet.mjs expr --name k10-c3-inkPots-parts --scale 4 --check --expr '(function(){var X=PN.arsenalFx,G="inkPots",ch=1,P=X.parts(G),bw=0,bh=0,s="";P.forEach(function(p){bw=Math.max(bw,p.box[0]);bh=Math.max(bh,p.box[1]);});var cols=8,i=0;P.forEach(function(p){for(var f=0;f<p.frames;f++){var x=(i%cols)*(bw+8)+4,y=Math.floor(i/cols)*(bh+8)+4;s+="<g transform=\"translate("+x+","+y+")\"><rect width=\""+p.box[0]+"\" height=\""+p.box[1]+"\" fill=\""+PN.env.CH[ch].base+"\"/><rect x=\"3\" y=\"3\" width=\""+(p.box[0]-6)+"\" height=\""+(p.box[1]-6)+"\" fill=\"none\" stroke=\"#8c8579\" stroke-width=\"0.3\" stroke-dasharray=\"1 1\"/>"+X.stamp(G,p.part,{frame:f})+"<path d=\"M"+(p.anchor[0]-3)+","+p.anchor[1]+" h6 M"+p.anchor[0]+","+(p.anchor[1]-3)+" v6\" stroke=\"#ef5b4f\" stroke-width=\"0.5\"/></g>";i++;}});return "<rect width=\""+(cols*(bw+8)+8)+"\" height=\""+(Math.ceil(i/cols)*(bh+8)+8)+"\" fill=\"#c9c6bc\"/>"+s;})()'
```

**C4 계열 장면(T1·T2·T3)**
- 변수 조합
  - `SEL="look:boneMortar"`(look 8개), `"kind:lob"`(kind 6개), `"all"`(T3, `BLIND=true` + `--scale 0.5`)
  - `GRAY`, `AW`(각성 판), `CH`(1·3·5)
- look 판에는 핵심 그림 칸이 붙는다.
- beam 길이는 시험용으로 640(십자 획은 360)까지 자른다.
```
node scripts/art-review-sheet.mjs expr --name k10-t1-boneMortar --scale 1 --check --crop 0,0,1600,1800 --expr '(function(){var X=PN.arsenalFx,SEL="look:boneMortar",BLIND=false,GRAY=false,AW=false,P=0.35,LV=3,CH=1,BEAMMAX=640,CROSSMAX=360,W=1600,H=1800;window.__k10=(window.__k10||0)+1;var fid="k10g"+window.__k10;var MAIN={strike:"impact",nova:"burst",lob:"land",chain:"jump",beam:"stroke",halo:"sweep"};var kv=SEL.split(":"),L=X.ids.filter(function(id){return MAIN[X.META[id].kind]&&(SEL==="all"||X.META[id][kv[0]]===kv[1]);});if(BLIND){var r=7;for(var i=L.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1),t=L[i];L[i]=L[j];L[j]=t;}}var CORE={boneMortar:["blast",{}],voidMine:["collapse",{awakened:true}],chainSpark:["hold",{}],railSpear:["hold",{}],frostLine:["hold",{}],blackSun:["collapse",{awakened:true}],orbitScythes:["hold",{}],eclipseStep:["slash",{}]};function at(q){return q?q[0]+q[1]*(LV-1):0;}function cell(id){var m=X.META[id],g=m.geo,k=m.kind,r=at(g.radius)*(AW?1.2:1);if(k==="beam"){if(g.directions===4){var c=Math.min(at(g.length)*(AW?1.2:1),CROSSMAX);return [2*c+60,2*c+60,"c"];}return [Math.min(at(g.length)*(AW?1.2:1),BEAMMAX)+90,g.width*2+190,"l"];}if(k==="chain"){var n=Math.floor(at(g.jumps))+1+(AW?1:0);return [90*n+140,300,"l"];}if(k==="strike"||k==="lob")return [Math.max(2*r+120,420),Math.max(2*r+170,340),"c"];return [2*r+110,2*r+170,"c"];}var items=L.map(function(id){return {id:id,c:cell(id)};});if(!BLIND&&kv[0]==="look"&&CORE[kv[1]]){var cm=PN.skillVfx.META[kv[1]];items.push({core:kv[1],c:[cm.cell[0],cm.cell[1]+40,"o"],o:cm.origin});}var x=10,y=10,row=0;items.forEach(function(it){if(x+it.c[0]>W){x=10;y+=row+20;row=0;}it.x=x;it.y=y;x+=it.c[0]+20;row=Math.max(row,it.c[1]);});var s=PN.env.ground(CH,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null}),top="";items.forEach(function(it,i){var ox,oy,lab;if(it.core){ox=it.x+it.o[0];oy=it.y+40+it.o[1];s+="<g transform=\"translate("+ox+","+oy+")\">"+PN.skillVfx.draw(it.core,CORE[it.core][0],CORE[it.core][1])+"</g>";lab="core "+it.core;}else{var m=X.META[it.id],k=m.kind;ox=it.c[2]==="l"?it.x+50:it.x+it.c[0]/2;oy=it.y+it.c[1]/2+20;var o={level:LV,awakened:AW,p:P,t:P*0.3,seed:11+i};if(k==="beam")o.length=Math.min(at(m.geo.length)*(AW?1.2:1),m.geo.directions===4?CROSSMAX:BEAMMAX);s+="<g transform=\"translate("+ox+","+oy+")\">"+X.draw(it.id,MAIN[k],o)+"</g>";if(k==="nova"||k==="halo"||k==="beam")top+=PN.heroKit.placeSprite("idle",0,ox,oy,1);lab=BLIND?String(i+1):it.id+" ("+k+")";}top+="<text x=\""+(it.x+6)+"\" y=\""+(it.y+22)+"\" font-size=\""+(BLIND?28:14)+"\" font-family=\"monospace\" fill=\"#101312\">"+lab+"</text>";});var body=s+top;return GRAY?"<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0\"/></filter></defs><g filter=\"url(#"+fid+")\">"+body+"</g>":body;})()'
```
- T3 정답표(먼저 보지 않는다).
  - T3 실행값: `--name k10-t3-blind --scale 0.5 --crop 0,0,2400,3600`, 식 안에서 `SEL="all",BLIND=true,GRAY=true,W=2400,H=3600`
```
node scripts/art-review-sheet.mjs expr --name k10-t3-key --scale 1 --crop 0,0,1100,90 --expr '(function(){var X=PN.arsenalFx,MAIN={strike:1,nova:1,lob:1,chain:1,beam:1,halo:1},L=X.ids.filter(function(id){return MAIN[X.META[id].kind];}),r=7;for(var i=L.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1),t=L[i];L[i]=L[j];L[j]=t;}return "<rect width=\"1100\" height=\"90\" fill=\"#fff\"/>"+L.map(function(id,i){return "<text x=\""+(4+(i%8)*136)+"\" y=\""+(18+Math.floor(i/8)*22)+"\" font-size=\"11\" font-family=\"monospace\">"+(i+1)+" "+id+"</text>";}).join("");})()'
```

**C5 기믹 판(T4)**: `PRI`(1·2), `BLIND`, `GRAY`를 바꾼다. 참고 합성은 `context: true`로 맥락(먹귀, 결)을 함께 그린다.
```
node scripts/art-review-sheet.mjs expr --name k10-c5-gimmicks-p1 --scale 1 --check --expr '(function(){var X=PN.arsenalFx,PRI=1,BLIND=false,GRAY=false,CH=1,CW=520,CHH=420,COLS=5;window.__k10=(window.__k10||0)+1;var fid="k10m"+window.__k10;var L=[];X.ids.forEach(function(id){(X.META[id].gimmicks||[]).forEach(function(g){if(g.priority===PRI)L.push([id,g.stage]);});});if(BLIND){var r=11;for(var i=L.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1),t=L[i];L[i]=L[j];L[j]=t;}}var W=COLS*CW,H=Math.max(1,Math.ceil(L.length/COLS))*CHH,s=PN.env.ground(CH,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null}),top="";L.forEach(function(q,i){var x=(i%COLS)*CW,y=Math.floor(i/COLS)*CHH;s+="<g transform=\"translate("+(x+CW/2)+","+(y+CHH/2+30)+")\">"+X.draw(q[0],q[1],{level:3,awakened:true,p:0.45,t:0.4,seed:21+i,ch:CH,context:true})+"</g>";top+="<text x=\""+(x+8)+"\" y=\""+(y+26)+"\" font-size=\""+(BLIND?26:14)+"\" font-family=\"monospace\" fill=\"#101312\">"+(BLIND?String(i+1):q[0]+" / "+q[1])+"</text>";});var body=s+top;return GRAY?"<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0\"/></filter></defs><g filter=\"url(#"+fid+")\">"+body+"</g>":body;})()'
```

**C6 색·마크업·토큰 검사**: `calls=… colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`이어야 한다.
```
node scripts/art-review-sheet.mjs expr --name k10-c6-scan --scale 1 --crop 0,0,1600,90 --expr '(function(){var X=PN.arsenalFx,OK={"#101312":1,"#343936":1,"#46423d":1,"#8c8579":1,"#bcb4a5":1,"#fffff8":1,"#f4f4ef":1,"#d8dad3":1,"#00a8c6":1,"#007c94":1,"#cff6ff":1,"#000000":1,"#ffffff":1},TOK={ink:1,ink700:1,ink500:1,ink300:1,ink100:1,p50:1,paper:1,p300:1,ally:1,allyD:1,allyG:1},BAN=/<text|Gradient|<filter|mix-blend|<image|<foreignObject|<pattern|<script|rgb\(|hsl\(/,bad={},nb=0,nonhex=0,ban=[],nocyan=[],badTok=[],n=0;function scan(tag,m){n++;(m.match(/#[0-9a-fA-F]{6}\b/g)||[]).forEach(function(c){c=c.toLowerCase();if(!OK[c]){nb++;bad[c]=(bad[c]||0)+1;}});nonhex+=(m.match(/(?:fill|stroke|stop-color|flood-color)="(?!#|none|url\()[^"]*"/g)||[]).length;if(BAN.test(m))ban.push(tag);}X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++)scan(g+"/"+p.part+f,X.stamp(g,p.part,{frame:f}));});});X.ids.forEach(function(id){(X.META[id].stages||[]).forEach(function(st,si){[false,true].forEach(function(aw){var m=X.draw(id,st,{awakened:aw,p:0.4,t:0.2,seed:5});scan(id+"/"+st,m);if(si===0&&!/#00a8c6/i.test(m))nocyan.push(id+"/"+st+(aw?"*":""));});});});X.overlays.forEach(function(k){[12,28].forEach(function(r){var m=X.overlay(k,{r:r,stack:2,t:0.3});scan("ov/"+k,m);if(!/#00a8c6/i.test(m))nocyan.push("ov/"+k);});});(function walk(v,path){if(Array.isArray(v)){if(typeof v[0]==="string"&&typeof v[1]==="number"&&!TOK[v[0]])badTok.push(path+":"+v[0]);v.forEach(function(e,i){walk(e,path+"["+i+"]");});}else if(v&&typeof v==="object"){Object.keys(v).forEach(function(k){if(k==="token"&&!TOK[v[k]])badTok.push(path+"."+k+":"+v[k]);walk(v[k],path+"."+k);});}})(X.SPEC,"SPEC");var ko=/[가-힣]/.test(JSON.stringify(X.SPEC)+JSON.stringify(X.groups.map(function(g){return X.parts(g);})));var L=["calls="+n+" colours bad="+nb+" nonhex="+nonhex+" banned="+ban.length+" nocyan="+nocyan.length+" specTokens bad="+badTok.length+" korean="+(ko?1:0),"bad="+JSON.stringify(bad).replace(/\x22/g,"")+" banned:"+ban.slice(0,6).join(",")+" nocyan:"+nocyan.slice(0,8).join(",")+" tokens:"+badTok.slice(0,4).join(",")];return "<rect width=\"1600\" height=\"90\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(22+i*24)+"\" font-size=\"13\" font-family=\"monospace\">"+t.replace(/</g,"&lt;")+"</text>";}).join("");})()'
```

**C7 기하·앵커·배치·잘못된 호출**: 1~4줄이 모두 0건이고 5줄이 `invalid calls ok`여야 한다.

| 줄 | 검사하는 것 |
|---|---|
| 1 | 박스 − 3 |
| 2 | 머리 물건이 앵커 아래로 나가는지, 발 오버레이의 범위, 주인공 오버레이의 얼굴·발밑 링, origin 조각의 26 안 |
| 3 | layout 위치 |
| 4 | lob 경로 |
| 5 | 잘못된 호출 |

```
node scripts/art-review-sheet.mjs expr --name k10-c7-geometry --scale 1 --crop 0,0,1700,170 --expr '(function(){var X=PN.arsenalFx,S=X.SPEC,NS="http://www.w3.org/2000/svg",L=[];function bb(m){var s=document.createElementNS(NS,"svg");s.innerHTML=m;document.body.appendChild(s);var b=s.getBBox();s.remove();return b;}var box=[],head=[],feet=[],face=[],ring=[],F=S.faceZone;X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++){var b=bb(X.stamp(g,p.part,{frame:f})),x0=b.x-p.anchor[0],y0=b.y-p.anchor[1],x1=x0+b.width,y1=y0+b.height,tag=g+"/"+p.part+"/"+f;if(b.width===0||b.x<3||b.y<3||b.x+b.width>p.box[0]-3||b.y+b.height>p.box[1]-3)box.push(tag);if(p.place==="head"&&y1>0.5)head.push(tag);if(p.place==="feet"){var R=S.marks.rects[p.r];if(!R||x0<R[0]||y0<R[1]||x1>R[2]||y1>R[3])feet.push(tag);}if(p.place==="hero"&&((x1>-F[2]&&x0<F[2]&&y1>F[1]&&y0<F[3])||y1>-11))face.push(tag);if(p.place==="origin"){var nx=Math.max(x0,Math.min(0,x1)),ny=Math.max(y0,Math.min(0,y1));if(Math.hypot(nx,ny)<26)ring.push(tag);}}});});L.push("1 stamps outside box-3: "+box.length+" "+box.slice(0,6).join(" "));L.push("2 head objects below their anchor: "+head.length+" "+head.slice(0,3).join(" ")+" | feet overlays outside their rect: "+feet.length+" "+feet.slice(0,3).join(" ")+" | hero overlays in the face zone or over the foot ring: "+face.length+" "+face.slice(0,3).join(" ")+" | origin stamps within 26 of the hero: "+ring.length+" "+ring.slice(0,3).join(" "));var lay=[];Object.keys(S.layout||{}).forEach(function(id){Object.keys(S.layout[id]).forEach(function(st){[1,7,23].forEach(function(seed){var o={radius:150,inner:40,points:[{x:0,y:0},{x:200,y:-60},{x:380,y:40}],length:400,width:20,seed:seed,lod:"full"};(X.layout(id,st,o)||[]).forEach(function(q){var d=Math.hypot(q.x,q.y);if(q.prim==="ring"&&Math.abs(d-o.radius-(q.dr||0))>0.5)lay.push(id+"/"+st+":ring");if(q.prim==="disc"&&d>o.radius-(q.margin||0)+0.5)lay.push(id+"/"+st+":disc");});});});});L.push("3 layout placements off their shape: "+lay.length+" "+lay.slice(0,6).join(" "));var lob=[];Object.keys(S.lob||{}).forEach(function(id){var Hr=S.lob[id].H,a=X.lobPath(id,{x0:0,y0:0,x1:300,y1:100,t:0}),m=X.lobPath(id,{x0:0,y0:0,x1:300,y1:100,t:0.5}),e=X.lobPath(id,{x0:0,y0:0,x1:300,y1:100,t:1});if(Math.abs(a.x)>0.01||Math.abs(a.y)>0.01||Math.abs(e.x-300)>0.01||Math.abs(e.y-100)>0.01||Math.abs(a.h)>0.01||Math.abs(e.h)>0.01||m.h<Hr[1]-0.01||m.h>Hr[2]+0.01||Math.abs(m.shadow.ry/m.shadow.rx-0.42)>0.01)lob.push(id);});L.push("4 lob paths wrong: "+lob.length+" "+lob.join(" "));var th=0;[function(){X.parts("nope");},function(){X.stamp("nope","x",{frame:0});},function(){X.stamp(X.groups[0],"nope",{frame:0});}].forEach(function(fn){try{fn();}catch(e){th++;}});var gs=[X.draw("nope","impact",{}),X.draw(X.ids[0],"nope",{}),X.overlay("nope",{})].every(function(t){return /^<g\s*\/>$/.test(t);});L.push("5 invalid calls "+(th===3&&gs?"ok":"FAIL throws="+th+"/3 empty="+gs));return "<rect width=\"1700\" height=\"170\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(22+i*26)+"\" font-size=\"13\" font-family=\"monospace\">"+t.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</text>";}).join("");})()'
```
- `SPEC.lob`의 키는 lob 무기 id다. `mini`의 고정 높이는 `SPEC.lobMini`로 따로 둔다(C7 4줄은 무기 키만 본다).

**C8 바뀌면 안 되는 출력**
- 작업 전과 납품 전에 돌린다.
- 첫 줄의 고정 값은 `k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244`다.
- 둘째 줄은 `k9 … same | k11 … same | fixed set same`, 셋째 줄은 `PN keys same`이어야 한다.
```
node scripts/art-review-sheet.mjs expr --name k10-c8-unchanged --scale 1 --crop 0,0,1700,120 --expr '(function(){var X=PN.arsenalFx;function norm(m){return String(m).replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")+)(\s*\/?)>/g,function(t,n,a,e){var s={},k=a.replace(/\s+([\w:-]+)="[^"]*"/g,function(x,key){if(s[key])return "";s[key]=1;return x;});return "<"+n+k+e+">";}).replace(/\s+(\/?>)/g,"$1").replace(/(id="|url\(#|href="#)([^"\x27)]+)/g,function(_,p,v){return p+v.replace(/\d+/g,"");});}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36)+"/"+s.length;}function frames(M,g,fn){var o="";M.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++)o+=norm(fn(g,p.part,f));});return o;}function snap(){var S=PN.skillVfx,K4="";S.groups.forEach(function(g){K4+=frames(S,g,function(a,b,f){return S.stamp(a,b,{frame:f});});});K4+=JSON.stringify(S.SPEC);var I=PN.icons,IC="";I.list().forEach(function(id){[false,true].forEach(function(aw){IC+=norm(I.skill(id,{awakened:aw}))+norm(I.tile(id,{awakened:aw,metal:true,size:150}));});});var A=PN.arsenal,K9="";A.ids.forEach(function(id){[false,true].forEach(function(aw){K9+=norm(A.skill(id,{awakened:aw}));});});A.shots.forEach(function(id){K9+=frames(A,id,function(a,b,f){return A.stamp(a,b,{frame:f});});});var Hz=PN.hazards,K11="";if(Hz&&Hz.groups)Hz.groups.forEach(function(g){K11+=frames(Hz,g,function(a,b,f){return Hz.stamp(a,b,{frame:f});});});var EN="";for(var ch=1;ch<=5;ch++)PN.enemies.roles.forEach(function(r){EN+=norm(PN.enemies.draw(ch,r,{lod:"game"}))+norm(PN.enemies.draw(ch,r,{lod:"art"}));});var HE="";["idle","run","throw","hurt"].forEach(function(st){HE+=norm(PN.heroKit.sprite(st,0,{}));});return {k4:h(K4),icons:h(IC),k9:h(K9),k11:h(K11),enemies:h(EN),hero:h(HE),keys:Object.keys(PN).sort().join(",")};}var b=snap(),called=0;if(X){X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++){X.stamp(g,p.part,{frame:f});called++;}});});X.ids.forEach(function(id){(X.META[id].stages||[]).forEach(function(st){X.draw(id,st,{});X.draw(id,st,{awakened:true});called+=2;});});}var a=snap();var L=["fixed: k4="+a.k4+" icons="+a.icons+" enemies="+a.enemies+" hero="+a.hero,"in-flight (before -> after must match): k9 "+b.k9+" -> "+a.k9+(b.k9===a.k9?" same":" CHANGED")+" | k11 "+b.k11+" -> "+a.k11+(b.k11===a.k11?" same":" CHANGED")+" | fixed set "+((b.k4===a.k4&&b.icons===a.icons&&b.enemies===a.enemies&&b.hero===a.hero)?"same":"CHANGED"),"PN keys "+(b.keys===a.keys?"same":"CHANGED")+": "+a.keys,"arsenalFx calls: "+called+(X?"":" (module absent)")];return "<rect width=\"1700\" height=\"120\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(20+i*24)+"\" font-size=\"13\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

**C9 검증 벡터**: TypeScript 이식 시험용이다. 출력 원문을 납품서에 붙인다.
```
node scripts/art-review-sheet.mjs expr --name k10-c9-vectors --scale 1 --expr '(function(){var X=PN.arsenalFx,L=[];function r2(v){return Math.round(v*100)/100;}var PTS=[{x:0,y:0},{x:220,y:-70},{x:420,y:20},{x:640,y:-40},{x:860,y:30}],CASES=[["inkPulse","burst",{radius:151,seed:7}],["frostRing","burst",{radius:178,seed:7}],["thunderclap","burst",{radius:136,seed:5}],["silenceBell","burst",{radius:244,seed:5}],["brushDownpour","impact",{radius:46,seed:3}],["meteorBrush","land",{radius:160,seed:3}],["inkPots","fire",{radius:75,seed:9}],["tarJar","gather",{radius:114,seed:9}],["smokeTail","smoke",{radius:70,seed:2}],["meteorBrush","mark",{radius:96,seed:4}],["twinBlades","spin",{radius:60,seed:4}],["eclipseHalo","sweep",{radius:230,inner:110,seed:6,p:0.5}],["eclipseHalo","total",{radius:230,inner:0,seed:6,p:0.5}],["inkOrbit","sweep",{radius:132,inner:40,seed:6,p:0.5}],["wardRing","sweep",{radius:100,inner:0,seed:6,p:0.5}],["sparkThread","jump",{points:PTS,seed:1}],["stormThread","jump",{points:PTS,seed:1}],["frostChainlet","jump",{points:PTS,seed:1}],["inkLance","stroke",{length:640,width:12,seed:1}],["wideBrush","stroke",{length:410,width:34,seed:1}],["crossStrokes","stroke",{length:496,width:14,seed:1}],["judgmentLine","stroke",{length:960,width:18,seed:1}],["fallingScroll","unroll",{length:240,width:50,seed:1}]];CASES.forEach(function(q){var it=(X.layout(q[0],q[1],q[2])||[]).map(function(o){return [o.part,r2(o.x),r2(o.y),r2(o.angle||0),o.variant||0,o.flip?1:0,r2(o.phase||0),o.prio||0];});for(var i=0;i<Math.max(1,it.length);i+=5)L.push((i?"  ":q[0]+"/"+q[1]+" layout ")+JSON.stringify(it.slice(i,i+5)));var P=X.paths(q[0],q[1],q[2])||{};Object.keys(P).forEach(function(k){var pts=P[k].map(function(p){return [r2(p[0]),r2(p[1])];});for(var j=0;j<pts.length;j+=12)L.push((j?"  ":q[0]+"/"+q[1]+" path "+k+" ")+JSON.stringify(pts.slice(j,j+12)));});});["inkPots","clusterPots","tarJar","meteorBrush"].forEach(function(id){var row=[0,0.25,0.5,0.75,1].map(function(t){var p=X.lobPath(id,{x0:0,y0:0,x1:320,y1:-120,t:t});return [t,r2(p.x),r2(p.y),r2(p.h),r2(p.angle),r2(p.shadow.rx),r2(p.shadow.alpha)];});L.push(id+" lob "+JSON.stringify(row));});return "<rect width=\"2200\" height=\""+(24+L.length*15)+"\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(15+i*15)+"\" font-size=\"11\" font-family=\"monospace\">"+t.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</text>";}).join("");})()'
```

**C10 명도**: `fill=… fail=0`이어야 한다. 기준은 0.3초를 넘는 채움 Y ≤ 0.62, 짧은 띠 Y ≤ 0.69, 결 코트 대비 ≥ 1.25다.
```
node scripts/art-review-sheet.mjs expr --name k10-c10-contrast --scale 1 --crop 0,0,1500,330 --expr '(function(){var X=PN.arsenalFx,S=X.SPEC;function rgb(h){var v=parseInt(h.slice(1),16);return [(v>>16)&255,(v>>8)&255,v&255];}function lin(c){c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}function Y(c){return 0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);}function over(t,a,g){return [0,1,2].map(function(i){return t[i]*a+g[i]*(1-a);});}function con(a,b){var x=Math.max(a,b),y=Math.min(a,b);return (x+0.05)/(y+0.05);}var coat=Y(rgb("#f4f4ef")),L=[],fail=0;(S.fills||[]).forEach(function(f){var tk=X.K[f[1]],persist=f[3]>0.3,lim=persist?0.62:0.69,mx=0,mn=99,line=f[0]+" ("+f[1]+" a"+f[2]+", "+f[3]+"s):";for(var ch=1;ch<=5;ch++){var g=rgb(PN.env.CH[ch].base),y=Y(over(rgb(tk),f[2],g));mx=Math.max(mx,y);mn=Math.min(mn,con(coat,y));line+=" ch"+ch+" "+y.toFixed(3);}var ok=mx<=lim&&mn>=1.25;if(!ok)fail++;L.push(line+" | coat "+mn.toFixed(2)+":1 "+(ok?"ok":"FAIL"));});L.unshift("fills="+(S.fills||[]).length+" fail="+fail+" (persistent over 0.3 s: Y max 0.62; brief: Y max 0.69; hero coat Y "+coat.toFixed(3)+", contrast min 1.25)");return "<rect width=\"1500\" height=\"330\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(18+i*18)+"\" font-size=\"12\" font-family=\"monospace\">"+t.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</text>";}).join("");})()'
```

**C11 lob 비행 줄**: t 0.12~0.88을 겹친 줄 + 착탄, 아래 줄은 핵심 골분 박격 옹기다. 1배, 3배, 흑백(`GRAY`)으로 본다.
```
node scripts/art-review-sheet.mjs expr --name k10-c11-lob --scale 1 --check --expr '(function(){var X=PN.arsenalFx,GRAY=false,CH=1,L=["inkPots","clusterPots","tarJar","meteorBrush"],W=900,RH=260,H=L.length*RH+260;window.__k10=(window.__k10||0)+1;var fid="k10l"+window.__k10;var s=PN.env.ground(CH,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null}),top="";L.forEach(function(id,i){var ox=70,oy=i*RH+200,dx=560,dy=-40;top+=PN.heroKit.placeSprite("throw",1,ox,oy,1);[0.12,0.3,0.5,0.7,0.88].forEach(function(t){s+="<g transform=\"translate("+ox+","+oy+")\">"+X.draw(id,"flight",{t:t,dx:dx,dy:dy,level:3,seed:3+i})+"</g>";});s+="<g transform=\"translate("+(ox+dx)+","+(oy+dy)+")\">"+X.draw(id,"land",{level:3,p:0.3,seed:3+i})+"</g>";top+="<text x=\"8\" y=\""+(i*RH+22)+"\" font-size=\"14\" font-family=\"monospace\" fill=\"#101312\">"+id+" flight t .12/.30/.50/.70/.88 + land</text>";});var y0=L.length*RH,P=PN.skillVfx.parts("boneMortar").filter(function(p){return p.part==="shell";})[0];for(var f=0;f<P.frames;f++)s+="<g transform=\"translate("+(140+f*170-P.anchor[0])+","+(y0+240-P.anchor[1])+")\">"+PN.skillVfx.stamp("boneMortar","shell",{frame:f})+"</g>";top+="<text x=\"8\" y=\""+(y0+22)+"\" font-size=\"14\" font-family=\"monospace\" fill=\"#101312\">core boneMortar shell frames 0-3 (reference)</text>";var body=s+top;return GRAY?"<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0\"/></filter></defs><g filter=\"url(#"+fid+")\">"+body+"</g>":body;})()'
```

**C12 혼잡 장면(T6)**
- 구성: 1장 1600×900, 적 200, 적 탄 30, 호박 imminent 예고 하나, 결(가운데)
- 각성 빌드 6개: 침묵의 종 고리 r322, 연막 4, 마름쇠 24, 묘비 12, 일곱째 인장 7 + 여덟째, 침묵 표식, 까마귀
- `--scale 0.8`로 1024×720 화면도 보고, `GRAY=true`로 흑백도 본다.
```
node scripts/art-review-sheet.mjs expr --name k10-c12-scene --scale 1 --check --crop 0,0,1600,900 --expr '(function(){var X=PN.arsenalFx,CH=1,GRAY=false,W=1600,H=900,HX=800,HY=470,R=PN.rng(2026);R();window.__k10=(window.__k10||0)+1;var fid="k10s"+window.__k10;var TOP={stalker:-30,charger:-40,shooter:-44,warden:-74},ROLE=["stalker","stalker","stalker","charger","stalker","shooter","charger","warden","stalker","shooter"];var s=PN.env.ground(CH,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null});var ground="",bodies=[],air="",head="";function at(x,y,m){return "<g transform=\"translate("+x.toFixed(1)+","+y.toFixed(1)+")\">"+m+"</g>";}ground+=at(HX,HY,X.draw("silenceBell","burst",{radius:322,awakened:true,p:0.5,seed:3}));[[300,250],[1250,640],[420,700],[1180,240]].forEach(function(p,i){ground+=at(p[0],p[1],X.draw("smokeTail","smoke",{radius:70,t:0.6+i*0.3,p:0.4,seed:20+i}));});for(var i=0;i<24;i++)ground+=at(80+R()*1440,60+R()*780,X.draw("pinHail","caltrop",{radius:18,t:0.4,p:0.3,seed:40+i}));for(var g2=0;g2<12;g2++)ground+=at(80+R()*1440,60+R()*780,X.draw("gravePins","grave",{radius:22,t:1,p:0.3,seed:60+g2}));[[1020,330],[1100,380],[980,420],[1150,300],[1060,450],[1200,410],[940,350]].forEach(function(p,i){air+=at(p[0],p[1],X.draw("seventhSeal","impact",{radius:70,awakened:true,p:0.3,seed:80+i}));});air+=at(1070,375,X.draw("seventhSeal","eighth",{radius:120,awakened:true,p:0.2,seed:90}));for(var e=0;e<200;e++){var x=40+R()*1520,y=60+R()*800;if(Math.hypot(x-HX,y-HY)<90)continue;var r=ROLE[e%10],m=PN.enemies.meta(CH,r),k=m.displayScale*{stalker:0.9,charger:0.963,shooter:0.783,warden:1}[r];bodies.push([y,"<ellipse cx=\""+x.toFixed(1)+"\" cy=\""+y.toFixed(1)+"\" rx=\""+m.r+"\" ry=\""+(m.r*0.42)+"\" fill=\"#101312\" opacity=\"0.3\"/><g transform=\"translate("+(x-m.feet[0]*k).toFixed(1)+","+(y-m.feet[1]*k).toFixed(1)+") scale("+k+")\">"+PN.enemies.draw(CH,r,{lod:"game",frame:e%4})+"</g>"]);if(e%17===0)head+=at(x,y,X.overlay("silence",{r:m.r,top:TOP[r],t:0.3}));if(e%23===0)head+=at(x,y,X.overlay("crow",{r:m.r,top:TOP[r],t:0.1*e}));}bodies.push([HY,PN.heroKit.placeSprite("run",2,HX,HY,1)]);bodies.sort(function(a,b){return a[0]-b[0];});var shots="";for(var q=0;q<30;q++){var sx=60+R()*1480,sy=60+R()*780,sr=q%5?7:8;shots+="<circle cx=\""+sx.toFixed(1)+"\" cy=\""+sy.toFixed(1)+"\" r=\""+(sr+1.2)+"\" fill=\"#101312\"/><circle cx=\""+sx.toFixed(1)+"\" cy=\""+sy.toFixed(1)+"\" r=\""+sr+"\" fill=\"#ef5b4f\"/><circle cx=\""+sx.toFixed(1)+"\" cy=\""+sy.toFixed(1)+"\" r=\""+(sr-2.4)+"\" fill=\"#101312\"/><circle cx=\""+(sx-1).toFixed(1)+"\" cy=\""+(sy-1).toFixed(1)+"\" r=\"1.2\" fill=\"#fffff8\"/>";}var tele=at(560,300,PN.vfx.telegraph("circle","imminent",90,{}));var body=s+ground+bodies.map(function(b){return b[1];}).join("")+head+air+shots+tele;return GRAY?"<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0\"/></filter></defs><g filter=\"url(#"+fid+")\">"+body+"</g>":body;})()'
```

**C13 적 표식(T5)**: 다섯 장 × 오버레이 키다. 1배와 `--scale 4`, `GRAY`로 본다. `TOP`은 리뷰용 근사이고, 렌더러는 실제 스프라이트 꼭대기를 쓴다.
```
node scripts/art-review-sheet.mjs expr --name k10-c13-marks --scale 1 --check --expr '(function(){var X=PN.arsenalFx,GRAY=false;window.__k10=(window.__k10||0)+1;var fid="k10o"+window.__k10;var KS=X.overlays,ROLES=["stalker","charger","shooter","warden"],SC={stalker:0.9,charger:0.963,shooter:0.783,warden:1},TOP={stalker:-30,charger:-40,shooter:-44,warden:-74},CW=92,RH=132,W=40+KS.length*CW,s="";for(var ch=1;ch<=5;ch++){var row=PN.env.ground(ch,W,RH,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null});KS.forEach(function(k,i){var role=ROLES[i%4],m=PN.enemies.meta(ch,role),d=m.displayScale*SC[role],x=46+i*CW,y=RH-18;row+="<ellipse cx=\""+x+"\" cy=\""+y+"\" rx=\""+m.r+"\" ry=\""+(m.r*0.42)+"\" fill=\"#101312\" opacity=\"0.3\"/><g transform=\"translate("+(x-m.feet[0]*d)+","+(y-m.feet[1]*d)+") scale("+d+")\">"+PN.enemies.draw(ch,role,{lod:"game"})+"</g><g transform=\"translate("+x+","+y+")\">"+X.overlay(k,{r:m.r,top:TOP[role],stack:2,t:0.3,ch:ch})+"</g>";});s+="<svg x=\"0\" y=\""+(30+(ch-1)*RH)+"\" width=\""+W+"\" height=\""+RH+"\" viewBox=\"0 0 "+W+" "+RH+"\">"+row+"</svg>";}var lab="<rect width=\""+W+"\" height=\"30\" fill=\"#fff\"/>"+KS.map(function(k,i){return "<text x=\""+(20+i*CW)+"\" y=\"20\" font-size=\"11\" font-family=\"monospace\">"+k+"</text>";}).join("");return lab+(GRAY?"<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0\"/></filter></defs><g filter=\"url(#"+fid+")\">"+s+"</g>":s);})()'
```

**C14 아군 대 적 지형(T7)**
- `MODE`를 `gray`·`deutan`·`protan`·`color`로 바꿔 네 번 돌린다.
- K11이 아직 그리지 않은 종류는 "(not drawn yet)"으로 나온다. K11 납품이 끝나면 다시 돈다.
```
node scripts/art-review-sheet.mjs expr --name k10-c14-pairs-gray --scale 1 --check --expr '(function(){var X=PN.arsenalFx,Hz=PN.hazards,MODE="gray",CH=1;window.__k10=(window.__k10||0)+1;var fid="k10p"+window.__k10;var M={gray:"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0",deutan:"0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0",protan:"0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0"};var PAIRS=[[["inkPots","fire",{radius:75,t:0.6}],["hz","fire","burn",{r:75}]],[["tarJar","gather",{radius:114,t:0.5}],["hz","slow","static",{r:110}]],[["smokeTail","smoke",{radius:70,t:0.8}],["hz","water","static",{r:110}]],[["pinHail","caltrop",{radius:18}],["hz","trap","armed",{r:60}]],[["gravePins","grave",{radius:22}],["hz","root","static",{r:52}]],[["meteorBrush","mark",{radius:96,t:1}],["k4","boneMortar","warn",{}]],[["inkLightning","pillar",{radius:40,t:0.5}],["hz","shock","telegraph",{r:120,p:0.85}]]];var CW=300,RH=300,W=CW*2,H=RH*PAIRS.length,s=PN.env.ground(CH,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null}),top="";PAIRS.forEach(function(q,i){var y=i*RH+RH/2+10,a=q[0],b=q[1],ma="",mb="";try{ma=X.draw(a[0],a[1],Object.assign({level:3,awakened:true,p:0.5,seed:5+i,ch:CH},a[2]));}catch(e){ma="";}try{mb=b[0]==="hz"?Hz.draw(b[1],b[2],Object.assign({ch:CH,seed:9+i,t:0.3,p:0.5},b[3])):PN.skillVfx.draw(b[1],b[2],b[3]);}catch(e){mb="";}if(!mb||/^<g\s*\/>$/.test(mb))mb="<text x=\"-60\" y=\"0\" font-size=\"12\" font-family=\"monospace\">(not drawn yet)</text>";s+="<g transform=\"translate("+(CW/2)+","+y+")\">"+ma+"</g><g transform=\"translate("+(CW+CW/2)+","+y+")\">"+mb+"</g>";top+="<text x=\"6\" y=\""+(i*RH+18)+"\" font-size=\"12\" font-family=\"monospace\" fill=\"#101312\">"+a[0]+"/"+a[1]+"  vs  "+(b[0]==="hz"?"hazard "+b[1]+"/"+b[2]:"core "+b[1]+"/"+b[2])+"</text>";});var body=s+top;return MODE==="color"?body:"<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\""+M[MODE]+"\"/></filter></defs><g filter=\"url(#"+fid+")\">"+body+"</g>";})()'
```

**C15 아이콘 대 전장 물건**: 같은 물건인지 본다. K9 3차 납품이 합격한 뒤 의미가 있다.
```
node scripts/art-review-sheet.mjs expr --name k10-c15-pairs --scale 1 --check --expr '(function(){var X=PN.arsenalFx,A=PN.arsenal,s="",n=0;X.ids.forEach(function(id){var ob=X.META[id].object;if(!ob)return;var P=X.parts(id).filter(function(p){return p.part===ob;})[0];if(!P)return;var x=(n%6)*270,y=Math.floor(n/6)*160;s+="<g transform=\"translate("+x+","+y+")\"><rect width=\"262\" height=\"152\" fill=\"#b8ac93\"/><g transform=\"translate(6,8) scale(0.5)\">"+A.skill(id,{})+"</g><g transform=\"translate(84,8)\"><g transform=\"scale("+Math.min(2,136/Math.max(P.box[0],P.box[1]))+")\">"+X.stamp(id,ob,{frame:Math.min(1,P.frames-1)})+"</g></g><text x=\"6\" y=\"146\" font-size=\"11\" font-family=\"monospace\">"+id+" / "+ob+"</text></g>";n++;});return "<rect width=\""+(6*270)+"\" height=\""+(Math.ceil(n/6)*160)+"\" fill=\"#c9c6bc\"/>"+s;})()'
```

### 7.3 체크리스트
- [ ] API가 §1.2와 같다. 잘못된 호출의 반응이 §1.2와 같다(C7 5줄)
- [ ] C1·C3·C4·C5·C11·C12·C13·C14·C15가 `--check` ok이고 kit error가 0건이다
- [ ] C2가 `frames ≤ 380 ok, boxArea ≤ 640,000 ok, badParts=0`이다
- [ ] C6이 `colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`이다
- [ ] C7 1~4줄이 0건이고 5줄이 ok다
- [ ] C8 고정 값과 호출 전후가 같다
- [ ] C10이 `fail=0`이다
- [ ] T1~T7 자가 판정과 헷갈린 쌍·고친 점이 납품서에 있다
- [ ] `API-arsenal-fx.md`에 §8의 내용이 있다

## 8. 순서와 납품서

**순서**
- 납품마다 검수 1번, 수정 2번까지다(R5 3단계).
- 안 그린 단계와 조각은 `META.stages`·`gimmicks`·`groups`에 넣지 않는다. 그래서 모든 명령이 매번 돈다.

| 차례 | 내용 | 이 차례에 맞출 것 |
|---|---|---|
| 1차 | 뼈대(§1 전부: K, META 44종과 geo, SPEC 도형, jit, layout·paths, parts·stamp, draw·overlay 골격) + 투사체 없는 22종의 주 단계(평상·각성)와 착탄(§2) | 가장 헷갈리던 boneMortar 6종과 chainSpark 5종을 T1에서 먼저 맞춘다. 순서: boneMortar → chainSpark → voidMine → railSpear → 나머지 |
| 2차 | lob 비행 4종 + `lobPath` + 송이 단지 `mini`(§3) | C11, C7 4줄 |
| 3차 | 기믹 P1 17종 → P2(§4) + 오버레이 + `overlays` 목록 + API 문서 완성 | C5(P1·P2), C12, C13, C14 + C1~C15 전체 |

- 1차를 시작하기 전에 C8을 돌려 기준값을 확인한다.
- K9 3차 납품(22종 아이콘)이 진행 중이다. 물건은 K9 지시서 §3.4를 따른다. K9가 합격하면 C15로 대조해 다른 점을 납품서에 적는다(§11 Q12).

**`API-arsenal-fx.md` v1에 적을 것**
- 로드 순서와 의존
- 호출, opts, 잘못된 호출
- META 표(44줄: id, 이름, kind, look, 주 단계, 물건 조각, 기믹 단계·우선, done)
- 조각 표(실제 값), SPEC 표(실제 값)와 렌더러 규칙, layout·paths·lobPath 식과 jit 번호대
- 층·LOD·감소 설정, 상한과 버리는 순서, 예산 실측
- 자가 확인 명령 C1~C15
- 지시서와 다르게 한 것, 사람 원화가에게 남길 것

**납품서**(kit-artist 형식에 아래를 더한다)
1. 만든 파일과 함수, 이번 차례의 done 목록
2. 무기별 요약(물건, 고리·선 문체, 청록 요소, 각성 변화). 지시서와 다르게 한 것은 이유와 함께
3. C2·C6·C7·C8·C9·C10 출력 원문
4. 직접 본 렌더 목록(1배, 0.8배, 확대, 흑백, 색각)
5. T1~T7 자가 판정: 헷갈린 쌍과 고친 점
6. 메인 세션 등록값: 팩, 키, prog·cycle 조각의 초, still 장, 층, 상한
7. 사람 클린업이 필요한 곳(§10)

## 9. 메인 세션이 할 일 (합격 뒤)

1. **등록·굽기**
   - `scripts/build-atlas.mjs:11` `KIT_FILES`: `'k-icons2.js'` 바로 뒤에 `'k-arsenal-fx.js'`를 넣는다.
   - `art/atlas-spec.mjs` `PACKS`에 `'arsenal-fx': { page: 'assets/packs/arsenal-fx/atlas', frames: [{ arsenalFx: true }] }`를 더한다(§11 Q1).
   - `renderFrames`(`build-atlas.mjs:180-207`)에 skillVfx와 같은 펼치기 분기를 둔다.
     - 키는 `afx/<group>/<part>/<frame>`, 호출은 `['PN.arsenalFx.stamp', group, part, {frame}]`, `scale: 1`이다.
     - 애니메이션 `afx/<group>`은 loop만 fps를 싣는다.
   - 매니페스트에 `arsenalFx = {spec, parts, vectors}`를 싣는다.
     - parts 필드는 drive, fps, seconds, still, place, rotate, layer, lod, flash, r다.
     - vectors는 C9 출력이다.
     - `readSkillVfx`(`:152-178`)처럼 한글 검사를 넣는다.
   - `npm run build:atlas`
     - arsenal-fx 페이지가 1장(최대 2장)이어야 한다.
     - 다른 팩 프레임의 w·h·ax·ay는 그대로여야 한다.
   - `npm run bench:packs`로 팩 크기와 로드를 본다.
2. **런타임**
   - `slots.ts`에 `ARSENAL_FX_PACK = 'arsenal-fx'`를 두고 skills 팩과 같은 때 읽는다.
   - `spriteAtlas.ts`에 `ArsenalFxManifest` 형식을 둔다.
   - 새 `src/game/render/arsenalFx.ts`(`ArsenalFxPainter`)를 만든다. `SkillVfxPainter`와 같은 꼴로 다음을 맡는다:
     - drive 규칙(§1.4)
     - SPEC 도형(§1.5)
     - layout·paths·lobPath 이식(§1.6)
     - 상한·우선순위(§4.5·§5.4)
     - 무기별 표시 수명(`SPEC.life`)
   - 팩이 없거나 실패하면 지금 그림으로 그린다(TEC-10). **단, 대체 그림에서도 §0.1 ⑤⑥⑦을 고친다.**
     - 땅 조각: allyGlow 채움과 기호 대신 K4 `vfx.zone`(종이 α0.25 + 청록 망점 + 바느질)을 쓴다. K4 팩도 없으면 청록 점선 테 + 종이 α0.2다.
     - 침묵: 자수정 대신 청록이다.
     - 불먹: 산호 물듦을 없앤다.
3. **엔진·표시 계층**(그림 전용, 시뮬 결과 불변. 클래식은 arsenal이 꺼져 있어 지문이 바뀌지 않는다)
   - `events.ts:35` `area/blast`에 `echo?: boolean`을 더한다. `arsenalBlast`(`GameEngine.ts:2626-2630`)가 `echo: this.echo`를 싣는다.
   - `worldTypes.ts` `BeamEffect`·`ChainEffect`에 `echo?: boolean`을 더한다.
     - `sweep`(`:2616`)이 `echo: this.echo`를 싣는다.
     - 되감김(`:2567`), 사슬 나눔 번쩍임(`:5429`), 감전 도약(`:5408`)의 연쇄에 echo 표시를 단다.
   - `arsenalLobs`(`:915`)에 `x0, y0, born`을 더하고(`:2546`에서 채움), RenderWorld에 `lobs`(읽기 전용)를 둔다.
   - `later`(`:924`) 항목에 그림 기록 `show`를 붙이고 RenderWorld `pending`으로 넘긴다. 대상:
     - 늦은 붓자국(`:5462`)
     - 여덟째 인장(`:2533`)
     - 갈라짐(`:2655-2658`)
     - (선택) 메아리(`:2540`)·되쓸기(`:2586`)
   - `AwakenedMarks`(`worldTypes.ts:190-219`)에 그림 전용 `freeze?: number`, `bound?: number`를 더하고 동결(`:5483`)·묘비(`:2823`)에서 채운다.
     - 렌더러는 동결이면 백묵 `root<r>-awakened` 대신 K10 동결을 그린다.
   - 불먹(`:2808`)은 `enemy.burn`을 켜지 않는다. 렌더러가 불먹 조각 안의 적을 계산해 `scorch`를 그린다(산호 물듦 제거, V2).
   - `presentation.ts:286-289`
     - 무기 폭발 표시의 수명을 `SPEC.life[id].mark`로 바꾸고 echo를 SkillMark에 싣는다.
     - 필요하면 `SKILL_MARK_CAP`(48)을 64로 올린다(그리기 상한은 K10 페인터가 따로 지킨다).
   - `presentation.ts` `enemy/stunned`의 source가 inkPulse·sealArrows면 K10 사건 조각 목록에 넣는다(상한 16).
   - 표시 일련번호(seed): 표시 계층의 화장용 카운터를 쓴다. 게임 id는 쓰지 않는다(BUG-08).
4. **worldRenderer**
   - `drawHazards`(`:833-849`): K10 땅 조각을 맨 먼저 그린다.
   - 바닥 층(`:453` 뒤): K10 데칼
   - `drawGroundMarks`(`:975-1033`): 적 발 오버레이(feet), lob 그림자, 대기 그림자
   - `drawEnemyBody`(`:1526-1561`): 몸 뒤 front 오버레이
   - `collectBodies`(`:529-615`): `stand` 조각을 새 rank로 넣는다. 미루면 위험지형 층에 그린다.
   - `drawOverheads`(`:1099`): `drawAwakenedMarks` 대신 K10 표식(우선순위·상한)
   - allyAttacks(`:477-487`)
     - `drawSkillMarks`·`drawSkillRing`(`:1355-1401`): K10 그림이 있는 무기의 표시를 K10으로 넘긴다.
     - `drawBeams`(`:1310-1326`): 무기 빔·연쇄·감전 도약을 K10으로 넘긴다.
     - 비행, 대기, 사건 조각
   - `drawPlayerBody`(`:1680-1697`): `haste`
   - `drawFriendlyProjectiles`(`:1444-1489`)
     - 먹 궤도 되받은 탄(skillId inkOrbit, echo)은 `deflect-*`로 그린다.
     - 해바늘 탄은 radius/size(≤ 1.6)배로 키운다.
5. **팔레트·시험**
   - `palette.test.ts`: K10 SPEC 토큰이 아군 소속(청록·중립)인지 검사한다.
   - 새 `arsenalFx.test.ts`: 이식한 layout·paths·lobPath가 매니페스트 vectors와 같은지, drive·상한·우선순위 규칙이 맞는지 검사한다.
   - `npm run fingerprint:draw`: 팩 없는 경로는 의도한 대체 그림 수정(§9-2) 말고는 SAME이어야 한다. 대체 그림 수정은 따로 커밋한다.
6. **성능**
   - `src/bench/renderBench.ts`에 `arsenal` 장면을 둔다: stress(적 400, minimal) + god mode + 각성 무기 6개(pinHail, gravePins, smokeTail, seventhSeal, frostChainlet, silenceBell). K11 지형 묶음은 끄고 잰다.
   - 기준: work p95 차이 ≤ 0.4ms, full LOD 게임 장면 ≤ 0.6ms(§5.4, §11 Q8)
7. **화면 검사**(`npm run test:visual`, 개발 치트로 빌드 고정)
   - (a) boneMortar 계열 6종을 차례로 시전(1440×900)
   - (b) chainSpark 계열 5종
   - (c) lob 비행 4종
   - (d) 각성 6개 빌드 + 적 200(1440×900, 1024×720)
   - (e) 적 표식(침묵·사냥감·까마귀·동결·불먹)
   - (f) 감소 모션·감소 섬광
   - (g) minimal LOD
8. **문서**
   - `docs/art/pipeline.md`(arsenal-fx 팩), `docs/ARCHITECTURE.md`("Arsenal FX")
   - SYS-16 결정 문서의 '표시' 줄
   - 바이블 §5.3·§10.1·§12(§11 Q3·Q4 결정대로)
9. **커밋 항목**: 메인 세션이 정한다. K9 반영(FX-08, SYS-15)과 같은 FX 계열을 권한다.

## 10. 사람 클린업으로 넘길 것 (바이블 §15)
- 킷 출력은 잠정 아트다.
- 물건의 붓 외곽·블랙 스팟·비백: 족자, 둥근 도장, 손, 손종, 백자·항아리·작은 단지, 큰 붓 혜성, 먹통, 술, 까마귀, 묘비 핀
- 먹 불길·연기 덩이·타르 줄·서리 결정·종이 균열의 붓 질감(절차형으로 낼 수 없다)
- 표식 16~18px의 1배 픽셀 다듬기(0.8·1.0·1.2배 리샘플마다)
- 문화 검토
  - 손뼉(합장으로 보이지 않게)
  - 손종(범종이 아니게)
  - 도장·인영(글자·붉은 인주 없음)
  - 족자(글자 없음)
  - 묘비(십자·비문 없음)
  - 가시(가시관 아님)
  - 까마귀(불길한 종교 상징이 아니게)
  - 십자 획의 십자 모양
- 정식 판독 시험(n ≥ 8)은 하지 않았다.

## 11. 열린 질문과 권고

| # | 질문 | 권고 |
|---|---|---|
| Q1 | 팩 위치: 기존 skills 팩에 붙일지, 새 팩으로 둘지 | **새 `arsenal-fx` 팩**으로 둔다. 런 시작 때 skills 팩과 함께 읽는다. skills 팩의 기존 프레임 검증이 쉬워지고, 크기를 따로 잰다 |
| Q2 | 그림 전용 엔진 필드(§9-3: echo 표시, lob 출발점, 대기 표시, freeze·bound, 불먹 burn 제거) | 넣는다. 시뮬은 읽지 않는다. `npm run test:folded-rules`와 클래식 지문으로 확인한다 |
| Q3 | 적에게 건 침묵의 색. 바이블 §5.3의 자수정 '침묵'은 주인공 침묵 표시다 | 적에게 건 침묵은 아군 소속(청록·종이)으로 그리고 자수정을 쓰지 않는다. 정예 표식과 겹치기 때문이다. 바이블 §5.3에 한 줄 더한다 |
| Q4 | 불먹 안 적의 불 표시 | 산호 물듦 대신 K10 먹 불길(청록 심)을 쓴다. 바이블 §10.1에 "아군 효과로 불타는 적은 아군 소속 불길"을 더한다 |
| Q5 | 머리 위 표식 자리(바이블 §19 A-3) | 실제 스프라이트 꼭대기 − 12(체력바 −26)에 엘리트 관·기절·폭탄병 다음으로 쌓는다(지금 렌더러 방식). 적 하나에 표식 하나 |
| Q6 | 무기 감속의 표시(서리침·먹꽃·연막·서리 고리·침묵의 종·타르·서리 사슬). 지금은 아무것도 안 그린다 | 이번 범위 밖으로 둔다. 다음 차수에 감속 출처(그림 전용)를 엔진에 두고 `rime<r>`·먹 발 오버레이를 재사용한다 |
| Q7 | 무기 소리가 look의 소리다(`presentation.ts:227`) | sound-designer에게 무기별 시전·착탄 큐 변형을 발주한다(새 레시피는 `sfx-spec.mjs` 끝에) |
| Q8 | 성능 예산 나누기. stress p95 7.0ms, 게이트 8ms. K11 0.5ms + K10 0.4ms | 두 팩을 함께 켠 장면을 먼저 잰다. 넘으면 minimal 상한(§4.5)을 줄인다. 게이트를 올리지 않는다 |
| Q9 | 십자 획은 판정 모양이 곧 십자다 | 찢김·가늘어짐·가운데 비움으로 줄이고 받아들인다. 사람 클린업에서 다시 본다 |
| Q10 | 심판선을 세로로 쏘면 먹통 + 줄이 매달린 줄처럼 보일 수 있다 | 먹통을 주인공 뒤(시작점에서 26~56)에 두고 줄 위에 인물을 매달지 않는다. 화면 검사에서 본다 |
| Q11 | P3(혼령 이어쏘기, 튕김, 혹한, 도는 십자, 심판의 값) | 그리지 않는다. 플레이테스트에서 기믹이 안 보인다는 말이 나오면 추가 발주한다 |
| Q12 | K9 3차 아이콘이 K10보다 늦게 끝나 물건 꼴이 어긋날 때 | K9 지시서 §3.4가 기준이다. K9 합격 뒤 C15로 대조한다. K9 쪽이 바뀌었으면 K10 수정 1회차에서 맞춘다 |
| Q13 | 표식이 16~18px로 커져 겹친다 | 적 하나에 하나 + 화면 24개 상한(§4.5)으로 막는다. 혼잡하면 reduced 상한부터 줄인다 |

**확인하지 못한 것**
- 실제 게임 화면. 통합 뒤 `npm run test:visual` 캡처로 봐야 한다. 이 문서의 "지금 상태" 렌더는 렌더러 코드를 SVG로 옮긴 근사다.
- 성능. K10이 들어간 측정은 아직 없다. 장면 구성만 제안했다.
- 팩 바이트와 페이지 수. 박스 넓이로만 추정했다(K4의 849,600 단위²가 한 장에 들어간 것을 근거로 1장을 기대한다).
- K9 3차 아이콘(아직 그리지 않음)과 K11의 fire 밖 종류(아직 그리지 않음).
- §7.2 명령은 대역 모듈로 문법·계산·출력 형식만 확인했다. 실제 그림의 판독은 납품 검수에서 T1~T7로 다시 본다.
- 시안은 내가 대충 그린 도형이다. 서리 결정, 손, 종, 까마귀, 표식의 최종 꼴은 kit-artist와 사람 클린업이 정한다.
- 2Hz 이상 깜빡임(번개 고리 12fps 깜빡임)의 광과민 기준. 면적이 작은 선이라 위험이 낮다고 본다. 감소 모션에서는 멈춘다.

## 12. 메인 세션 결정 (2026-10-16)

- 열린 질문 Q1~Q13은 모두 권고안이다(2026-10-14 사용자 "권장대로 진행해줘"를 R5 추가 발주에도 적용): 새 `arsenal-fx` 팩, 그림 전용 엔진 필드를 넣음, 적에게 건 침묵은 아군 소속(자수정 금지), 불먹 안의 적은 K10 먹 불길(청록 심), 표식은 적 하나에 하나, 무기 감속 표시는 다음 차수, 무기별 소리는 sound-designer에게 따로 발주, 성능은 K11과 함께 재고 게이트를 올리지 않음, 십자 획·심판선은 권고대로, P3 기믹은 그리지 않음, K9 3차와 어긋나면 K10 수정 1회차에서 맞춤, 혼잡하면 reduced 상한부터 줄임.
- §0.1의 ⑤⑥⑦은 K10 납품 전에 메인 세션이 임시로 고친다: 각성 땅 조각은 밝은 채움과 가운데 기호를 걷고 Y ≤ 0.62의 옅은 바닥 + 바느질 점선 테로, 적 침묵 표식은 자수정 대신 아군 색으로, 불먹은 적의 `burn`을 켜지 않는다(산호 물듦 없음). 커밋은 이 지시서 커밋 뒤에 따로 한다.

## 13. 검수 1차 정정 (2026-10-16)

검수 1차(`docs/art/deliveries/K10-arsenal-fx.md`, 수정 후 합격)의 정정이다. 세부 값과 식은 검수서 §3·§4다.

1. **착탄 순간이 가장 세다(§2.1·§2.4)**: lob 착탄의 0번 장은 가장 센 장이다(큰 먹 튐, 흰 조각, 섬광). 깨지기 전 단지는 2차 비행 그림의 몫이다.
2. **§1.5에 매개 도형 셋을 더한다**: `punch`(맞는 순간 0.1초 동안 고리 굵기 ×scale, 감소 모션 ≤ 1.5), `splash`(R에 맞춰 자라는 먹 튐, 먹만, 원판 넓이의 10% 이하, 고리 위·바깥 금지, 화면당 12/8/3), `tilt`(족자 기울기를 렌더러가 장마다 0·6·12·12°로 돌림, 좌우 부호는 사건마다).
3. **판정 고리 먹 ≥ 3의 예외**: 일곱째 인장·송이 단지 2.6. 대신 punch로 보완한다.
4. **유성 붓 streak 삭제**: 고리 R−4~R+30에는 고리 말고 아무것도 두지 않는다(적 imminent 눈금과 같은 꼴 금지).
5. **같은 물건은 K9 아이콘과 같은 꼴(C15)**: 타르 항아리는 굽과 입이 보이는 쓰러진 항아리(흰 지그재그 금·둥근 돔 금지), 유성 붓은 짓눌린 붓털 + 먹 마개·걸이 고리 + 넓어지는 마른 꼬리(로켓·다트·대칭 별 금지), 인영은 끊긴 테와 변형마다 다른 획(같은 곡선 반복·가운데 점 금지).
6. **서리 결정 길이**: 평상 14~27, 각성 18~35(박스 안 최대). 서리 띠 α0.5 + fade 0.3은 수용한다(결정 (b)).
7. **족자 박스는 넓히지 않는다(결정 (a))**: 조각은 똑바로 세워 굽고 렌더러가 돌린다.
8. **검사**: C9에 inkPots·clusterPots land, fallingScroll impact 사례를 더한다. 보존 해시 `k10-keep-stamps`·`k10-keep-draw`·`k10-keep-spec`과 1배 타격감 명령(`k10-impact-ages`) 등 검수서 §8의 명령 넷을 쓴다.
9. **2차(lob 비행) 발주 때**: 혜성은 K9 M1 문법, 단지 뚜껑에 꼭지 없음, 타르 항아리는 입과 굽, 땅에 닿는 순간 비행 그림을 지우고 착탄 0번 장으로 넘긴다.

## 14. 검수 2차 정정 (2026-10-19)

검수 2차(`docs/art/deliveries/K10-arsenal-fx.md`, 수정 후 합격)의 정정이다.

1. **착탄 타격감 기준(§13-1, 검수 1차 M1)**: '나이 0.02초' 기준을 버린다. 새 기준은 0번째 프레임(나이 0)에 punch 최대·0번 장이 가장 큰 덩어리·가시 길이 ≥ 0.3, 나이 0.05초에 먹단지 0.5R 이상 방향 평균 ≥ 5·최소 ≥ 4, 유성 붓 0.6R 이상 방향 평균 ≥ 5·최소 ≥ 4, 송이 단지 사건마다 0.45R 이상 방향 ≥ 2, 나이 0.1초에 고리가 기본 굵기다(검수서 §2의 `k10-m1-grown` 명령). punch·splash 값은 그대로다.
2. **인영 매듭 획(인영 a·b·c 모두)**: 곡률이 끊기지 않는 붓 한 획(가장 곧은 구간 ≤ 인영 폭 35%, 꺾인 각 < 120° 금지, 끝이 마름). 작은 닫힌 고리나 안으로 말린 끝으로 끝나지 않는다. 'ㄱ자로 말린 획'이라는 표현은 거둔다.
3. **인장 꼭지**: K9 기준(목 + 공 꼭지). 공 지름 ≤ 몸 폭의 0.4, 목은 5 이상 보인다. 꼭지 값: 전장은 먹(옻칠 빛면), 아이콘은 종이 + 먹 테. 꼴(목 + 공)은 같다(검수 3차).
4. **보존 해시**: frostChainlet R4로 바뀐 값(`fxjb0m`/`2rsj2w`/`v6ki5j`)이 기준이고, 인장 수정 뒤에는 seventhSeal을 뺀 `k10-keep2` 세 값이 그대로여야 한다.
