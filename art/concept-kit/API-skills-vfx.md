# API — `k-skills-vfx.js` · `PN.skillVfx` v1.0 (스킬 VFX 17종 + 각성)

작업 지시서: `docs/art/briefs/skill-vfx.md`(K4, 끝의 "정정 (K4 검수 1차)"가 본문보다 우선). 스타일 기준: 바이블 v1 §3·§4·§5.3·§6·§7.2·§9·§12·§13, v1.0 부록 §12.3.
킷 출력은 잠정 아트다(바이블 §15). 최종 외곽선과 블랙 스팟은 사람이 다시 긋는다(§11 "사람 원화").
수정 납품 1(K4 검수 1차 반영)에서 바뀐 곳은 §10의 10~17번에 모았다.

## 1. 로드와 의존

```html
<script src="kit/lib.js"></script>          <!-- 필수 -->
<script src="kit/k-hero.js"></script>       <!-- 거울 분신 프레임(clone-*)과 일식 잔상만 PN.heroKit.sprite를 부른다 -->
<script src="kit/k-skills-vfx.js"></script> <!-- window.PN.skillVfx -->
```

- 모든 선언은 IIFE 안에 있다. 다른 킷 모듈(`PN.vfx`, `PN.icons`, `PN.enemies` …)은 부르지 않는다. `PN.heroKit.sprite`만 쓴다.
  - 주인공 스프라이트 문자열에 늘 들어 있는 블러 필터 정의(`hk<N>_glow`, 스프라이트가 참조하지 않음)는 분신 조각에서 빼고 넣는다. 참조가 있으면 남긴다.
  - `k-hero.js`가 없으면 분신 조각은 작은 자리표시(종이 마름모)로 그려진다.
  - **분신은 주인공 프레임에 묶여 있다.** 상태별 감싼 선 점 목록(`CLONE_ENVELOPE`)과 throw 2번 장의 바늘 자르기(손 앞 x > 22.5, 팔 높이 y −42~−22)는 지금 주인공 스프라이트에 맞춘 값이다. 주인공 스프라이트가 바뀌면 분신 21장을 C1·C7과 얼굴 확대(`clone-idle` 0번, `--crop 26,4,60,48 --scale 8`)로 다시 본다. 굽기 체크리스트에도 같은 줄을 넣는다.
- 반환은 늘 `<g class="ksv ksv-<group 또는 skillId>">` 하나이고 자기 `<defs>`를 가진다. 내부 id는 호출마다 `ksv<N>_…`이다. 분신 조각 안의 `hk<N>_…` id는 주인공 킷이 만든다.
- 결정적이다. `Math.random`·`Date`를 쓰지 않는다. 들쭉날쭉한 값은 `jit(seed, i)`(SPEC.jit)로 만든다. id를 빼면 같은 호출의 출력은 바이트 단위로 같다(C6 nondeterministic 0).
- 글자(`<text>`) 0, 블러·그라데이션·혼합 모드 0, 이미지 0, 종이결 0. 색은 `K`의 11개 토큰과 필터 정의 안의 `#000000`뿐이다(C6 bad colours `{}`).

## 2. 단위·좌표·회전

- **단위 = 월드 단위 = 1440×900(줌 1.0)의 1x px.** 조각은 `scale: 1`로 @2x에 굽는다.
- 조각은 로컬 박스 `[0, w] × [0, h]`에 그린다. **앵커가 시뮬 좌표에 놓인다.** 모든 그림은 박스 가장자리에서 3 이상 안쪽이다(C7 getBBox 기준, 0건).
- 원과 띠는 위에서 본 **참 원**이다. 발밑 표식(감속·속박, 일식 원반)만 ry = 0.42·rx 타원이다.

| `rotate` | +x 방향 | 쓰는 조각 |
|---|---|---|
| `vel` | 속도 방향 `atan2(vy, vx)` | 투사체(바늘, 단검, 분신 탄, 회복 실 탄). 단검 귀환도 속도 방향(+π 관례 폐기) |
| `beam` | x1,y1 → x2,y2 | 백묵·흑선 `origin`·`flash`, 바늘 `shard-awakened`(x1,y1 = 맞은 적, x2,y2 = 파편 대상) |
| `radial` | 중심 → 바깥 | 궤도 낫(위치각 그대로, +π/2 관례 폐기), 박격 `dust`, 갑주 `plate-awakened` |
| `tangent` | 바느질이 나아가는 시계 방향 접선 | `common/stitchHead` |
| `ray` | 광선의 바깥 방향 | 일식 `slash` |
| `face` | 회전 없음, 좌우 반전만 | 분신 몸 `clone-*` |
| `none` | 회전·반전 없음 | 장판 중심, 오라, 팝, 표식 |

- `layer`: `ground` = hazards·groundMarks 층(아군 장판은 적 위험지형보다 먼저), `body` = 주인공 바로 뒤나 분신 자리, `ally` = allyAttacks 층(적 탄·텔레그래프보다 아래).
- `lod`: `info` = 모든 LOD·감소 모션에서 그린다, `deco` = minimal에서 뺀다. `flash: true`(흑선 `flash*`)는 섬광 감소 설정에서 렌더러가 α × 0.5로 그린다.
- `drive`: `prog` = `window` 구간 진행률 p로 장 = ⌊p × frames⌋(마지막 장에서 멈춤), `loop` = `fps`로 반복, `idx` = 데이터가 장을 고른다. `still` = loop 조각이 감소 모션·minimal에서 멈출 장(모두 0).

## 3. 공개 API

```js
PN.skillVfx = {
  version: '1.0',
  K,            // 토큰 11개 (아래 §5)
  ids,          // 게임 SkillId 17개, worldTypes.ts 순서
  groups,       // ids + 'common'
  META,         // §4
  SIZES,        // 지시서 §2 판정 수치의 사본 (C9)
  SPEC,         // 매개 도형 (§6), 토큰 이름과 숫자만 — 매니페스트에 그대로 싣는다
  jit,          // jit(seed, i) → 0..1, SPEC.jit의 식
  parts(group), // → [{part, frames, drive, fps, window, box, anchor, rotate, layer, lod, still, flash}]
  stamp(group, part, { frame, fill }),  // 굽는 조각 (로컬 박스). fill은 분신 clone-* 비교안 전용(굽지 않음)
  draw(id, stage, opts),          // 참고 합성 그림 (리뷰·골든). 원점은 §4
  hit(id, stage, opts),           // → { circles: [[x,y,r]], capsules: [[x1,y1,x2,y2,halfWidth]] } (draw와 같은 좌표)
};
```

- `draw`/`hit` opts: `level` 1~5(기본 5), `awakened`, `frame`(조각 장 강제), `progress` 0~1(그 단계 안 진행률), `t`(초: 궤도 위치, 소용돌이 각, 펄스 시간, 연쇄·균열 고리 나이), `radius`·`width`·`length`·`points`(덮어쓰기), `reduced`(감소 모션), `lod: 'full' | 'minimal'`, `copy`(흑선 레일: 거울 레일 복제 ±42 `spearCopy`).
- 목록에 없는 단계는 가장 가까운 단계로 바뀐다(예: 평상 `shard` → `end`, 각성 `aura` → `shield`/`pulse`/`volley`, 각성 무음 지뢰 `end` → `collapse`). 모르는 단계는 `main`.
- `stamp`의 `fill: true`(분신 `clone-*`만): 선 사본 아래에 p50 α 0.2 채움을 깐 비교안이다(검수 1차 고침 4의 선택 비교안). 굽기 사양에는 넣지 않는다. 다른 조각은 이 옵션을 무시한다.
- `hit`는 `reduced`·`lod`와 무관하다(판정 모양은 어느 설정에서도 같다, C3).
- 반환 문자열은 늘 무언가를 칠한다. minimal에서 장식뿐인 단계(백묵 `chill`)도 참고 그림에는 표식을 남긴다(렌더러는 `lod: 'deco'`로 뺀다).

## 4. META — 단계, 칸, 원점

`cell`·`origin`은 `draw(id, *, {level 5, awakened})`가 칸 안에 4 이상 여백으로 들어가는 크기다(C7 0건). `draw`의 로컬 원점은 아래 "원점"이다.

| id | 이름 | 평상 단계 | 각성 단계 | main | cell | origin | 원점 · 리뷰 배치 |
|---|---|---|---|---|---|---|---|
| needleStorm | 먹선 바늘 | start, travel, end | start, travel, end, shard | travel | 184×196 | 28,98 | 주인공 발. 부채꼴 바늘을 120(start 24)에. shard는 (120,0)에서 −50° |
| fanKnives | 부채 단검 | start, travel, end | start, travel, return, end | travel | 160×268 | 14,134 | 주인공 발. 120(start 24, 각성 end 84). 각성 return·end는 손잡이가 주인공 쪽 |
| chainSpark | 백색 연쇄 | start, hold, end | start, hold, end, burst | hold | 904×172 | 10,118 | 주인공 발. 점은 x 90 간격, y ∓30 번갈아(지시서 배치) |
| frostLine | 백묵 절단 | start, hold, end, chill | start, hold, end, root | hold | 728×92 | 44,46 | 빔 시작. +x 640까지. 표식은 x 110/210/320/440/570에 r 12/19/28/38/54 |
| railSpear | 흑선 레일 | start, hold, end | start, hold, end, fissure | hold | 744×136 | 52,68 | 빔 시작. +x 640까지. 균열은 x 210, 440 |
| orbitScythes | 초승 궤도 | hold | hold | hold | 396×396 | 198,198 | 주인공 발. 날 i의 각 = t·속도 + 2πi/날 수(t 기본 0.35) |
| boneMortar | 골분 박격 | warn, blast | warn, blast | warn | 408×408 | 204,204 | 착탄점 |
| mirrorClone | 거울 분신 | volley, travel | volley, travel | travel | 196×176 | 52,120 | 주인공 발. 조준 +x, 분신 (0, ±42). 조준 사격 표적 (360, 0) |
| voidMine | 무음 지뢰 | start, hold, end | start, hold, collapse | hold | 436×436 | 218,218 | 장판 중심 |
| blackSun | 검은 태양 | start, hold, end | start, hold, collapse | hold | 536×536 | 268,268 | 장판 중심 |
| eclipseStep | 일식 보법 | slash | slash, afterimage | slash | 556×556 | 278,278 | 주인공 발. 광선 5+L개, 각 = 2πi/n + 0.3 |
| ironFrame | 철골 프레임 | pop, aura | pop, shield | shield | 88×128 | 44,114 | 주인공 발. 팝은 (0, −68) |
| magnetSigil | 수거 자석 | pop, aura | pop, pulse | pulse | 324×324 | 162,162 | 주인공 발 |
| paperWard | 종이 갑주 | pop, plates | pop, plates, ward | ward | 312×312 | 156,156 | 주인공 발 |
| recoveryThread | 회복 실 | pop, aura | pop, volley | volley | 180×184 | 90,108 | 주인공 발. 8방향 탄을 64에. aura는 (0, −32) 중심 r 35 |
| coinFever | 동전 열병 | pop, glint | pop, glint, frenzy | frenzy | 100×124 | 50,110 | 주인공 발. glint는 (30, −6). frenzy 단계는 폭주 조각만 그린다(glint가 오른쪽 기둥을 가려서 뺐다) |
| executionMark | 집행 표식 | pop, mark | pop, mark, markBoss | mark | 116×116 | 26,106 | 주인공 발. 표식 앵커는 (64, −30)(대상 몸 꼭대기 − 4 자리) |

- 팝 자리: 주인공 키 64(발 → 흑립 꼭대기) + 4 → 앵커 (0, −68). 머리 위 디버프 타이머가 있으면 렌더러가 그 위로 올린다.

## 5. 굽는 조각 (`parts(group)`) — 188장, 박스 넓이 합 849,600 단위²

굽기 키는 `skill/<group>/<part>/<frame>`, 호출은 `['PN.skillVfx.stamp', group, part, { frame }]`, `scale: 1`. fps는 loop만 값이 있고 나머지는 0, `still`은 loop만 0(나머지 null). 각성에서만 쓰는 조각은 이름이 `-awakened`로 끝난다.

| group / part | 장 | drive | fps | window | box | anchor | rotate | layer | lod |
|---|---|---|---|---|---|---|---|---|---|
| needleStorm / start | 2 | prog | 0 | 나이 0~0.06초 | 64×20 | 46,10 | vel | ally | info |
| needleStorm / travel | 2 | loop | 12 | 비행 중 | 64×20 | 46,10 | vel | ally | info |
| needleStorm / end | 2 | prog | 0 | 남은 수명 0.10→0초 | 64×20 | 46,10 | vel | ally | info |
| needleStorm / start-awakened · travel-awakened · end-awakened | 2씩 | 위와 같음 | | | 64×24 | 46,12 | vel | ally | info |
| needleStorm / shard-awakened | 2 | prog | 0 | 파편 0~0.12초 | 48×14 | 4,7 | beam(맞은 적 → 파편 대상) | ally | deco |
| fanKnives / start · travel · end | 2씩 | prog / loop 12 / prog | | 바늘과 같음 | 44×16 | 28,8 | vel | ally | info |
| fanKnives / start-awakened · travel-awakened · end-awakened | 2씩 | 같음 | | travel은 나이 0.675초까지 | 44×16 | 28,8 | vel | ally | info |
| fanKnives / return-awakened | 2 | loop | 12 | 귀환 중(+x = 주인공 쪽) | 44×16 | 28,8 | vel | ally | info |
| chainSpark / burst-awakened | 3 | prog | 0 | 연쇄 폭발 0~0.24초 | 64×64 | 32,32 | none | ally | deco |
| frostLine / origin · origin-awakened | 2씩 | prog | 0 | 빔 수명 0.28초 | 48×48 | 24,24 | beam | ally | deco |
| frostLine / chill12 · 19 · 28 · 38 · 54 | 1씩 | idx | 0 | 적 반지름(감속 중) | 36×24 · 50×28 · 68×36 · 88×44 · 120×58 | 박스 중심 | none | ground | deco |
| frostLine / root12-awakened … root54-awakened | 1씩 | idx | 0 | 적 반지름(속박 중) | 같음 | 박스 중심 | none | ground | info |
| railSpear / origin · origin-awakened | 2씩 | prog | 0 | 빔 수명 0.22초 | 64×64 | 32,32 | beam | ally | deco |
| railSpear / flash · flash-awakened | 1씩 | prog | 0 | 처음 0.08초 (`flash: true`) | 64×64 | 32,32 | beam | ally | deco |
| railSpear / fissure-awakened | 3 | prog | 0 | 균열 0~0.24초 | 72×72 | 36,36 | none | ground | deco |
| orbitScythes / blade | 2 | loop | 8 | 상시 | 44×44 | 22,22 | radial | ally | info |
| orbitScythes / blade-outer-awakened | 2 | loop | 8 | 상시(역회전) | 44×44 | 22,22 | radial | ally | info |
| boneMortar / shell · shell-awakened | 4씩 | prog | 0 | 착탄 예고 0.48초 | 40×176 | 20,166 | none | ally | deco |
| boneMortar / blast · blast-awakened | 3씩 | prog | 0 | area/blast부터 0.24초 | 96×96 | 48,48 | none | ally | deco |
| boneMortar / dust | 2 | idx | 0 | 변형(자리·변형 번호는 §6 `blastDust`) | 24×16 | 12,8 | radial | ally | deco |
| mirrorClone / clone-idle 6 · clone-run 8 · clone-throw 4 · clone-hurt 3 | 21 | idx | 0 | 주인공 상태·프레임 번호 | **112×100** | **56,79** | face | body | info |
| mirrorClone / shot-start · shot-travel · shot-end | 2씩 | prog / loop 12 / prog | | 바늘과 같음 | 52×16 | 38,8 | vel | ally | info |
| mirrorClone / shot-*-awakened | 2씩 | 같음 | | 조준 사격(추적 탄) | 52×16 | 38,8 | vel | ally | info |
| voidMine / core-start 3 · core-hold 2 · core-end 3 | 8 | prog / loop 6 / prog | | 생성 0~0.2초 / 지속 / 마지막 0.3초 | 64×48 | 32,24 | none | ground | info |
| voidMine / core-start-awakened 3 · core-hold-awakened 2 | 5 | 같음 | | | 64×48 | 32,24 | none | ground | info |
| voidMine / collapse-awakened | 3 | prog | 0 | vortex/collapse부터 0.3초 | 96×96 | 48,48 | none | ally | info |
| blackSun / core-start 3 · core-hold 2 · core-end 3 | 8 | 무음 지뢰와 같음 | | | 96×96 | 48,48 | none | ground | info |
| blackSun / core-start-awakened 3 · core-hold-awakened 2 | 5 | 같음 | | | 112×112 | 56,56 | none | ground | info |
| blackSun / collapse-awakened | 3 | prog | 0 | 0.3초 | 120×120 | 60,60 | none | ally | info |
| eclipseStep / slash · slash-awakened | 2씩 | prog | 0 | 광선 수명 0.2초 | 128×24 | 124,12 | ray | ally | deco |
| eclipseStep / feet · feet-awakened | 3씩 | prog | 0 | 무적 시간(0.33~0.53초) | 72×32 | 36,16 | none | ground | info |
| 패시브 6종 / pop · pop-awakened | 1씩 | idx | 0 | 획득·레벨업·각성 때(같은 패시브 1.5초에 1번) | 36×38 | 18,35 | none | ally | info |
| ironFrame / shield | 3 | prog | 0 | 보호막 0.36초 | 72×100 | 36,88 | none | body | info |
| paperWard / plates | 3 | prog | 0 | 피격 무적(0.22~0.38초) | 80×100 | 40,88 | none | body | info |
| paperWard / plate-awakened | 2 | idx | 0 | 변형(갑편 6장, 0.2초 비행) | 20×14 | 10,7 | radial | ally | deco |
| recoveryThread / shot-start-awakened · shot-travel-awakened · shot-end-awakened | 2씩 | prog / loop 12 / prog | | 바늘과 같음 | 36×14 | 26,7 | vel | ally | info |
| coinFever / glint | 2 | prog | 0 | 엽전 획득 0~0.12초 | 24×24 | 12,12 | none | ally | deco |
| coinFever / frenzy-awakened | 3 | loop | 8 | 폭주 2.4초 동안 | **96×48** | **48,38** | none | **ally** | info |
| executionMark / mark | 3 | prog | 0 | 치명 적중 0~0.3초 | 32×32 | 16,29 | none | ally | info |
| executionMark / markBoss-awakened | 3 | prog | 0 | 보스 치명 적중 0~0.3초 | 44×44 | 22,41 | none | ally | info |
| common / stitchHead | 2 | loop | 12 | 바느질 진행 중 | 28×12 | 16,6 | tangent | ally | deco |

장 수 합계: 바늘 14, 단검 14, 연쇄 3, 백묵 14, 흑선 9, 궤도 4, 박격 16, 분신 33, 무음 지뢰 16, 검은 태양 16, 일식 10, 철골 5, 자석 2, 갑주 7, 회복 실 8, 동전 7, 집행 8, 공용 2 = **188**.

### 5.1 조각 그림 요약

- **바늘**: 길이 18(끝 +6, 뒤 −12), p50 몸 + 먹 1.5, 앞 5 먹, 바늘귀(−9.6) 청록. 실 [ink 2.6, ally 1.6, allyG 0.5]이 −38까지 S자. start는 실 8 → 18, end는 실이 처지고 끝 7이 가늘게 풀리며 몸이 p300. shard는 청록 실 한 획 + 끝의 5갈래 반짝임.
  - 각성은 **꼬인 겹실**이다(검수 1차 고침 3). t는 바늘귀 −9.6(0) → 실 끝(1), env(t) = min(1, t/0.3).
    - A = 1.4·sin(φ + 2.2π·t)·env(t) (THREAD 층), B = −1.4·sin(φ + 2.2π·t)·env(t) + 0.4·env(t) ([ink 2, ally 1.1], A보다 4 짧다). 각성 end는 둘 다 sag·t²만큼 처진다.
    - 중심 간격 = env·|2.8·sin − 0.4| ≤ 3.2, 바늘귀 뒤에서 교차 두 번. 벌어지는 Y·집게 모양은 없다.
    - φ: start 0.5(끝 −25/−31), travel 0/2.6(끝 −38), end 1.2(끝 −34/−28, sag 0.8/1.6).
    - 6갈래 종이 반짝임(r 2.6, 바늘 끝 위)은 travel 0번 장에만 있다(검수 R6).
- **단검**: 한지 부채살 칼(날끝 +8), 능선 한 획, 손잡이 먹 마디 둘 + 축 고리, 날끝 청록 점(먹 테). 각성은 뒤에 한 겹 더(능선 둘) + 날 등의 청록 실. return·각성 end는 좌우를 뒤집어 손잡이가 앞(+x), 날끝이 뒤, −x 쪽 끌림 획 1~2(길이·각도 다름).
- **분신 탄**: 속 빈 바늘(p50 α 0.6 + ink300 1.2), 바늘귀 청록, 바느질 실 [ink 2.6, ally 1.6] 점선 [4, 3]. 평상 2땀(−9 → −20), 조준 사격(각성) 4땀(−34까지).
- **회복 실 탄**(검수 1차 고침 1): **속 빈 매듭 고리 + 한 번 휘는 꼬리**. 채운 원·후광·바늘·먹알 + 종이 점은 없다.
  - 고리: THREAD 층의 눈물방울이다. 앞끝 (+5.5, 0), 뒤 교차점 (−4.5, 0), 가장 넓은 반폭 2.2(x −0.5). 실이 뒤에서 한 번 엇갈리고(매듭) 고리 안으로 바닥이 보인다.
  - 꼬리: 교차점에서 시작하는 2차 곡선 하나(변곡 없음). 끝 약 6은 [ink 1.6, ally 0.8]로 가늘고, 길이 약 5와 3인 섬유 둘로 풀린다.
  - 장: start는 꼬리 8(제어 (−8, 2.4)/(−8.5, 1.6)). travel은 제어 (−12, 3.5)/(−12, 2) → 끝 (−20, 1.5)/(−20, 0.8)로 처짐만 다르다. end는 교차점이 2 벌어지고(뒤 끝 y −1/+1) 꼬리가 처지며(제어 (−12, 3.8)) [ink 2.4, allyD 1.4]로 어두워진다(1번 장 α 0.6).
  - 범위 x −23~+6, y −4~+4. 앞끝 +5.5는 판정 r 5보다 0.5 바깥이다(§10-15).
- **분신 몸**(검수 1차 고침 4): 주인공 스프라이트(`ring/shadow/halo: false`)를 SVG 필터로 바꾼 선 사본이다. 채움은 없다.
  - 알파 바깥 가장자리(erode 1.4 → out)는 **ink500**, 먹 부분의 가장자리(휘도 문턱 → erode 0.55 → out)는 ink300이다. 5장 바닥(#ABA5AC)·0.8배·α 0.8에서도 모자·몸 윤곽·다리가 읽힌다.
  - throw 2번 장은 손 앞의 바늘(팔 높이 띠 y −42~−22에서 x > 22.5)을 잘라 낸다(검수 R8). 모자 챙과 코트는 그대로다. 분신의 바늘은 `shot-*` 조각이 맡는다.
  - 바깥은 상태별 감싼 선 위의 청록 바느질 1.5, 점선 [5, 3], 먹 층 2.7(+0.6 패드). 얼굴은 주인공 머리 그대로라 시점이 같다.
  - `fill: true` 비교안: SourceAlpha 위에 p50 α 0.2 채움을 선 아래에 깐다(굽지 않음).
- **백묵**: origin = 분필이 긁힌 자리(종이 얼룩 + 분필 조각 2, 각성은 부러진 분필 + 조각 3 + 얼룩 위 청록). chill = 발 그림자 타원 둘레의 분필 가루 점(불규칙 간격·크기). root = 같은 타원의 들쭉날쭉한 종이 고리(ink 0.8).
- **흑선**: origin = 반동 먹 얼룩 + 뒤로 튄 먹 방울(각성은 청록 불티 둘). flash = 앞으로 긴 7갈래(각성 9갈래) 종이 섬광.
  - fissure(검수 R1): 금 6개이고, 금마다 두 토막(가운데서 한 번 꺾임, 끝에는 꺾임 없음)이다. 길이는 12/9/27/14/8/16(긴 것 하나)이다.
  - 금 폭은 2.4 → 0.3, 첫 토막에 종이 가장자리를 둔다. 가운데 먹 덩이는 r 2.2이고 가지는 없다. 첫 장은 길이 0.55배, 마지막 장은 ink300으로 마른다.
- **연쇄 폭발**: 종이 튐(7갈래) → 종이 조각 + 먹 방울 + 청록 불티 2 → 잦아듦, 반지름 26 안.
- **궤도 낫**: 정방향은 종이 초승 낫 + ink 1.5 + 안쪽 청록 곡선 [ink 1.7, ally 0.95], 슴베에 먹 감개 둘. 바깥 날은 y를 뒤집은 먹 낫 + 종이 테 1.2 + 바깥 청록 곡선. 모두 r 17 안(외곽 포함).
- **박격**: 먹 옹기(ink500 명부, 종이 천 뚜껑, 노끈 매듭 하나), 아래가 앵커 위 128/86/44/8, 땅 그림자 rx 7+3f, ry 3+f. 각성은 배에 청록 실 띠. blast = 종이 튐 → 뼛가루 구름 → 옅은 가루, 반지름 42 안. dust = 점 + 짧은 획(변형 0은 먹 가시 하나), 바깥으로 7 이내. 고리 위 배치는 §6 `blastDust`(검수 R4).
- **무음 지뢰**: 3/4 가시 원반(가시 7, 길이·간격·굽음 불규칙, ink500 명부, p50 테 1.2, 가운데 소용돌이 새김). 각성은 가시 8 + 뚜껑 위 짧은 가시 관. 끝은 가시가 들어가고 금이 가며 ink300으로 마름.
  - 생성 0번 장(검수 1차 고침 7): 모난 종이 조각 셋을 고정 자리에 둔다. 평상 (−15, −3) 1.2 · (−4, −10) 1.8 · (10, −6) 1.0, 각성 (−16, −2) 1.3 · (−5, −11) 1.6 · (11, −5.5) 1.1이다. p300 + ink300 0.6, 높이 차 ≥ 3, 둥근 알갱이는 없다.
  - 각성 가시 관의 종이 빛 두 줄은 관이 반 이상 섰을 때(crown ≥ 0.5, 1번 장부터)만 그린다. 0번 장에서는 같은 높이의 점 한 쌍으로 보였다.
  - collapse 0번 장(검수 R3): 길이·폭이 다른 안쪽 쐐기 다섯(길이 33/24/30/22/35, 폭 6/3.6/5/3/4.4) + 먹 덩이 r 7.6 + 덩이 가장자리까지 가는 종이 금 하나. 1번 장 종이 조각, 2번 장 먹 먼지.
- **검은 태양**: 먹 원반 r 26(각성 32) + ink500 초승 명부 + 뒤쪽 종이 코로나(길고 휜 가닥과 짧은 가는 가닥이 섞임, 바깥 ≤ 39 / 47) + 원반 가장자리 청록 다이아 하나.
  - collapse 0번 장(검수 R2): 길이·폭이 다른 코로나 가닥 여섯(길이 44/30/39/26/41/33, 폭 4.6/2.6/3.8/2.2/3.2/2.8)이 r 17 원반으로 감겨 든다. 원반의 종이 금 하나가 가장자리까지 가고, 가운데 지그재그는 없다. 1번 장 종이 튐, 2번 장 먹 먼지.
- **일식**: slash = 바깥 끝(앵커)에서 안으로 118 뻗는 종이 붓 획 + 위쪽 청록 테(각성은 먹 심, 두 갈래 꼬리, 아래쪽 짧은 청록 테). feet = 먹 원반 rx 18·ry 7.56 + 링 밖(rx 26.8~28.2)의 끊긴 종이 호, 시간이 갈수록 줄고 마지막 장은 원반 가장자리에 빛이 돌아오는 종이 호. 각성은 호가 더 많고 5·6갈래 반짝임 둘.
- **팝**: 평상 = p50 원 r 12 + ink 2 테 + 먹 기호, 각성 = 먹 원 r 12.4 + 종이 기호 + 끊긴 종이 원상(r 13.4, 폭 ≤ 2.2). 청록 없음.
  - 철골 = 뾰족 방패 + 비스듬한 대들보 하나, 자석 = 38° 기운 말굽 + 종이 극 + 부적 꼬리, 갑주 = 비늘처럼 겹친 갑편 셋, 회복 실 = 30° 기운 3/4 실패.
  - 동전(검수 1차 고침 5) = 3/4로 기운 엽전 한 닢(중심 (−1, 2), s 6.4, 눌림 0.55, 기울기 −20°, 선 1.1)과 엽전 왼쪽 위 테에 걸친 5갈래 종이 반짝임(r 2.6, (−5.5, −1.5))이다.
    - 엽전은 면 + 아래 두께 테(면을 1.6 내린 타원)다. 네모 구멍은 면과 테를 함께 뚫어서, 구멍 위쪽에는 안쪽 벽 띠(테 색)가 보이고 그 아래로 원판이 비친다.
    - 평상은 면 ink100·테 ink700(구멍으로 종이 원판)이고, 각성은 면 p50·테 p300(구멍으로 먹 원판)이다. 오른쪽 위 사분면에는 엽전 밖 요소가 없다. 선택안이던 "뒤에 옆으로 선 엽전"은 뺐다(§10-13).
  - 집행(검수 1차 고침 2) = 오른쪽 위 → 왼쪽 아래 바늘 + 바늘 끝 아래의 먹 땀 셋(바늘 끝 중심 r 4.4, 62° → 179°, 길이 2/1.6/1.2, 틈 2.2/2)이다. 원판 중심을 감싸는 호는 없다.
- **철골 shield**: 청록 바느질 타원(중심 (0,−33), rx 30, ry 41, [ink 2.6, ally 1.4], 점선 [3.6, 5.2] 둥근 끝) + 타원 둘레의 먹 대들보 5개(1.4) + 끝마다 종이 리벳. 대들보는 얼굴 금지 구역(x −8~18, y −58~−34)에 들어가지 않는다.
- **갑주 plates**: 접힌 종이 갑편(p50 + ink 1.2 + p300 접힘 면 + 끈 한 획) 셋이 등 뒤 어깨(−24,−47), 앞 어깨(25,−41), 등 아래(−25,−28)에 뜬다. plate-awakened는 날아가는 작은 갑편 두 변형.
- **동전**: glint = 6갈래 종이 반짝임 + 엽전 테 일부.
  - frenzy(검수 1차 고침 6): 몸 옆 두 기둥(x −40~−26, +24~+40)에서만 3/4 엽전 넷이 솟는다. 왼쪽 x −34·−30, 오른쪽 x 29·35, 크기 3.8~4.8, 기울기·눌림은 제각각이다.
  - 엽전 높이는 y = 1 − 31·u(u = 장/3 + 위상, 위상 0·0.5 / 0.25·0.75)다. 한쪽에 늘 둘이고 높이 차는 15.5, 꼭대기는 −30이다.
  - 종이 별 둘(x −23, +22, y −6 → −28)을 둔다. 층 `ally`(실루엣 밖이라 몸을 덮지 않음)이고, 얼굴 금지 구역(−34 위)으로 가지 않는다. 박스 96×48, 앵커 (48, 38).
- **집행 표식**(검수 1차 고침 2): 비스듬히 꽂힌 바늘 하나(바늘귀 B (6, −22) → 끝 T (−4, −9.5))다.
  - 바늘 끝 T를 중심으로 한 청록 땀 호가 있다: r 7, 64° → 174°(≤ 120°), 땀 셋 3/2.4/1.8, 틈 3.2/3(먹 층 2.6보다 넓어서 땀이 떨어져 보인다). 바늘이 호의 중심 위를 지나지 않는다.
  - 실은 바늘귀에서 오른쪽 위 바깥으로 풀리는 꼬리 약 8 하나다. 휨은 한 번이고 호로 돌아오지 않는다.
  - 보스 각성(markBoss)은 긴 바늘(B (12, −34.5) → T (−5, −15)) + 땀 넷(r 9, 62° → 178°, 3/2.6/2.2/1.8) + 3.5 바깥(r 12.5)의 짧은 땀 둘이다. 겹치는 동심 반원은 쓰지 않는다.
  - 첫 장은 바늘 끝이 2.6 덜 들어가고 땀 하나, 실 꼬리가 절반이다. 마지막 장은 α 0.55. 닫힌 원·⊘·✕·조준 레티클은 없다.
- **stitchHead**: 작은 바늘(p50 + 먹 1.5, 바늘귀 청록)과 뒤로 이어지는 실.

## 6. SPEC — 렌더러가 캔버스로 똑같이 그리는 매개 도형

색은 토큰 이름이다(`palette.ts`로 바꾼다: ink → NEUTRAL.ink, ink700 → inkSoft, ink300 → inkMuted, p50 → paperBright, paper → paper, p300 → paperShadow, ally/allyD/allyG → SIGNAL.ally 계열). 매개 도형에는 ink500·ink100을 쓰지 않는다. 층은 `[토큰, 굵기]`를 아래에서 위로, 굵기는 선 전체 폭이다. 각도는 화면 좌표(y 아래), cw = 캔버스 각이 커지는 방향.

| 키 | 값 | 렌더러 규칙 |
|---|---|---|
| `stitch` | layers [ink 5, ally 2.8, allyG 0.8], dash [4.5, 7.5], cap round, fit 1, start −90, dir cw | 중심선 = 판정 반지름. `fit`: n = max(3, round(2πR / 12)), k = 2πR / (12n), dash = [4.5k, 7.5k] — 둘레에 땀이 정수 개라 12시 이음매가 겹치지 않는다. 진행 p는 12시에서 시계 방향 호 `arc(R, −π/2, −π/2 + 2πp)`, 같은 dash로(위치 고정). 땀 사이 바닥 ≈ 2.5 |
| `guide` | layers [allyD 1.2], alpha 0.55 | 판정 원 전체, 첫 프레임부터 |
| `fill` | p50, alpha 0.25 | 장판·빔 띠 채움 |
| `dots` | ally r 1.5, pitch 6, angle 45, alphaWarn 0.6, alphaVortex 1, band [34, 0.25] | 패턴 원점 = 장판 중심. 박격 예고는 원 전체 α 0.6, 소용돌이 장판은 띠 [R − min(34, 0.25R), R]에만 α 1 |
| `thread` | layers [ink 4, ally 2.2, allyG 0.7], seconds 0.24, fade 0.6 | 실선 고리, 크기 고정. α = 1(나이 ≤ 0.096초), 이후 (1 − u)/0.6로 0까지(u = 나이/0.24) |
| `threadHeavy` | layers [ink 5, ally 2.8, allyG 0.8], 시간은 thread와 같음 | 골분 박격 여진 0.55R |
| `band` | frostLine: edge [ink 1.2], inner [p50 0.8, 반폭 w − 1.4]. railSpear: edge [ink 1.4] | 캡슐(시작 (0,0) → 끝 (L,0), 반폭 w = 게임 width), fill 위에 가장자리. 가장자리 중심선 = ±w |
| `chalk` | edge [3.5, 2], step 12, fill p50, line [ink 0.8], core [ally 2.2], grow 0.25, dust {every 14, r [0.8, 1.6], fill p50, line [ink 0.4], inset 3} | 위 가장자리 y_k = −(3.5 + 2·jit(seed, k)), 아래 y_k = 3.5 + 2·jit(seed, k + 500), x_k = 12k(끝은 그려진 길이 Lg, 앞뒤 끝은 축 위 (0,0)·(Lg + 2, 0)). 심은 축 위 직선. 가루 j: x = 7 + 14j + (jit(seed, j + 1700) − 0.5)·6, y = (2·jit(seed, j + 900) − 1)(w − 3), r = lerp(0.8, 1.6, jit(seed, j + 1300)). 수명 앞 25% 동안 Lg = L·(나이/0.07) |
| `spear` | fill ink, half [6, 4], grain [p50 0.9, y −3], core [ally 2.4, allyG 0.8], head 18, headHalf 6.5, grow 0.25, fade {ink 3, dash [6, 4]} | 창대 반폭 6 → 4(x = L − 18까지), 오목한 잎 창날(어깨 반폭 ≈ 6.5에서 끝으로 오목하게, 삼각 화살촉 아님). 심은 x 0 → L − 16. 사라짐은 축 위 ink 3 점선 [6, 4] |
| `spearCopy` | offset 42, edge [ink300 1.2] dash [5, 3], shaft {p50 α 0.5, line [ink300 0.9]}, core [ink 2.6, ally 1.6] dash [6, 4], pad 0.6 | 창대는 spear와 같은 윤곽을 속 비게 |
| `bolt` | layers [ink 6, ally 3, p50 1.2], awakened [ink 7, ally 3.6, p50 1.4], join miter, miter 10, cap round, seg 30, push [3, 3], seeds [11, 12], start 0.28, end 0.35, fade {ink, dash [6, 4]} | 점 사이 구간 i(1부터)를 k = max(1, round(길이/30))로 나눠 j = 1..k−1 꼭짓점을 법선으로 (j 홀수 +, 짝수 −)(3 + 3·jit(seed, 64i + j)) 민다. 끝점은 정확히. 앞 28%는 길이를 따라 그려 나가고, 마지막 35%는 ink 층만 점선(butt). 떨림은 seed 11·12를 번갈아(감소 모션은 11 고정) |
| `tether` | layers [ink 3, ally 1.6], dash [6, 4], pad 0.6, sag 0.06 | 2차 곡선, 제어점 = 중점 + (0, 2·0.06·길이) → 가운데가 0.06·길이만큼 +y로 처진다 |
| `swirl` | voidMine {arms 3, r [0.16, 0.88], wind 200°, width [0.09, 0.015], ink α 0.5, speed 0.6, turn cw}, blackSun {arms 4, r [0.16, 0.88], wind 190°, width [0.1, 0.02], α 0.55, speed 0.45, turn cw} | 팔 i: 매개 t ∈ [0,1], 반지름 R·lerp(r0, r1, t), 각 θ = rot + 2πi/arms + wind·t(cw), 전체 폭 R·lerp(w0, w1, t^0.8)인 채운 띠. rot = speed·시간(cw로 돌면 팔이 안으로 빨려 든다). 감소 모션은 rot 0 |
| `unravel` | seconds 0.3, gap [1, 2], alpha [1, 0] | 비각성 끝 0.3초: 땀 간격 배수 1 → 2(fit 다시 계산), 테·채움·망점·팔 α 1 → 0 |
| `slashRing` | band [p50 5], edge [ink 1.2], outer {at 4.4, layers [ink 3, ally 1.6]}, seconds 0.2 | 종이 띠 중심선 = R, 가장자리 ink 1.2를 R ± 2.5에, 바깥 [ink 3, ally 1.6]을 R + 4.4에(청록이 먹 위에 얹힌다) |
| `wardRing` | band [p50 4], jag [10, 2], edge [ink 1.2], outer {at 4.6, layers [ink 2.6, ally 1.6], dash [6, 4], pad 0.6}, seconds 0.24, plates {count 6, from 20, to 140, seconds 0.2, angleJitter 10, toMin 126, seed 9} | 바깥 가장자리 R + 2 원, 안쪽 가장자리는 10 간격 꼭짓점이 번갈아 R − 2 − 2·(0.4 + 0.6·jit) / R − 2 − 0.3·jit로 찢긴 다각형. 갑편 i(0..5, 검수 R5 — 등간격이면 시계 눈금처럼 섰다): 각 = −π/2 + 2π(i + 0.5)/6 + (jit(9, i) − 0.5)·2·10°, 끝 반지름 r_i = lerp(126, 140, jit(9, i + 50)), 반지름 = lerp(20, r_i, 1 − (1 − u)²)(u = 나이/0.2), 변형 = i % 2, 회전 radial. 감소 모션은 r_i에 바로 |
| `pulse` | rings [allyD 1.2, allyG 0.5], r [24, 150], seconds 0.45, ease 2, alpha [0.6, 0], delay 0.08, reducedR 60 | 고리 반지름 = 24 + 126·(1 − (1 − u)²), α = 0.6(1 − u). 둘째 고리는 0.08초 늦게. 감소 모션은 반지름 60에 고정하고 α만 줄인다. 채움·바느질 없음 |
| `orbitTrail` | arc 0.35, layers [p50 1, ally 0.8], alpha [0.6, 0] | 날 뒤 0.35 rad 호를 세 토막(α 0.6, 0.4, 0.2). 선택 장식(minimal에서 뺀다) |
| `aura` | stitchR 35, seconds 0.3, centerY −32, layer ally | 회복 실 획득 오라: 몸 중심(발 −32)의 반지름 35를 `guide` + `stitch`가 0.3초에 한 바퀴(+ `stitchHead`). 층은 `ally`다. r 35이면 먹 테(폭 5) 안쪽 가장자리가 얼굴 금지 구역(발 기준 x −8~18, y −58~−34) 밖에 있다(§10-11) |
| `blastDust` | every 40, jitter 0.35, skip 0.25, spike 0.33, seed 5, reach 7 | 골분 박격 착탄 고리 R 둘레의 `dust` 조각(검수 R4 — 등간격 + 한 칸 건너 가시는 고른 방사 눈금처럼 보였다). n = max(6, round(2πR/40)), 칸 k = 0..n−1: jit(5, k + 100) < 0.25이면 건너뛴다. 각 = −π/2 + (k + 0.5 + (jit(5, k) − 0.5)·2·0.35)·2π/n, 자리 = 고리 위 (R cos, R sin), 회전 radial(+x = 바깥), 변형 = jit(5, k + 200) < 0.33 ? 0(먹 가시 있음) : 1. 조각은 고리 바깥으로 7 이내. minimal에서 뺀다 |
| `jit` | mul 31, hash 2654435761, mod 1000 | `((Math.imul(seed * 31 + i, 2654435761) >>> 0) % 1000) / 1000` (`worldRenderer.ts:1887`과 같은 방식) |

- `stitch`를 뺀 점선은 butt 끝이다. 청록이 든 점선(`tether`, `spearCopy.core`, `wardRing.outer`, 분신 탄 실, 분신 바느질)은 먹 층의 대시를 [d + 2·pad, g − 2·pad], dashoffset = pad로 그려 청록 대시의 양 끝까지 먹이 받친다(샌드위치).
- 고리·띠·테의 굵기는 판정 크기와 함께 바뀌지 않는다(늘 위 값).

## 7. 렌더러가 단계를 그리는 법 (시뮬 데이터 → 조각 + SPEC)

| 스킬 | 시뮬 데이터 | 그리는 것 |
|---|---|---|
| 바늘·단검·분신 탄·회복 실 탄 | Projectile(skillId) | 나이 < 0.06초 `start`(진행 = 나이/0.06), 남은 수명 < 0.10초 `end`(진행 = 1 − 남은/0.10), 그 사이 `travel`(loop 12). 각성 접미사는 그 스킬이 각성일 때. **`end`는 수명이 다해 가는 투사체에만 쓴다. 관통이 다해(또는 맞아서) 지워지는 투사체는 `end` 없이 그 틱에 사라진다.** 단검 각성은 나이 ≥ 0.675초(returning)에 `return-awakened`이고, 수명 끝(남은 < 0.10초)은 늘 귀환 중이므로 `end-awakened`다(둘 다 손잡이가 앞, 회전 vel). 분신 조준 사격(추적 탄)은 `shot-*-awakened`, 옆 사격은 `shot-*` |
| 바늘 파편 | (선택) 파편 이벤트 | `shard-awakened`를 맞은 적에 앵커, 회전 = 맞은 적 → 파편 대상, 0.12초 |
| 백색 연쇄 | ChainEffect + skillId | `bolt`. 각성: 마지막 점에 `thread` r 78 + `burst-awakened`(0.24초) |
| 분신 실 | ChainEffect + skillId(mirrorClone) | `tether` 0.16초 |
| 백묵 절단 | BeamEffect + skillId | `band`(반폭 = width) + `chalk` + 가루 + `origin` 조각(회전 beam, 빔 수명 진행). 감속·속박 표식은 데이터가 생긴 뒤 `chill<r>`/`root<r>-awakened`(r = 적 반지름 12/19/28/38/54) |
| 흑선 레일 | BeamEffect + skillId | `band` + `spear`(앞 25% 동안 자라남) + `origin` + 처음 0.08초 `flash`. 각성 균열: area/damage r 58마다 `thread` + `fissure-awakened`. 거울 레일 복제는 `spearCopy` |
| 일식 광선 | BeamEffect(0.2초, 5+L개) | `slash` 조각의 앵커를 광선 바깥 끝 쪽 R − 2에 두고 회전 = 광선 방향(늘이지 않음). `skill/cast`에 `slashRing` R(0.2초) + 무적 시간 동안 `feet` |
| 일식 잔상 | Hazard warning + sourceSkillId eclipseStep(0.24초) | `clone-throw` 1번 장 + `guide`·`stitch` 진행 0.82R + `stitchHead`, 터질 때 `thread` 0.82R(= Hazard.radius) |
| 초승 궤도 | world.skills.orbitScythes | 지금 식으로 위치, 회전 = 위치각. 정방향 `blade`, 역회전 `blade-outer-awakened`. (선택) `orbitTrail` |
| 골분 박격 | Hazard warning + sourceSkillId boneMortar | `fill` + `dots`(원 전체 α 0.6) + `guide` + `stitch` 진행(= 1 − life/maxLife) + `stitchHead` + `shell`(같은 진행). area/blast: `thread` R + `blast` + §6 `blastDust` 규칙의 `dust`(흔든 각, 25% 건너뜀, 가시 변형 1/3, 회전 radial). 각성은 `threadHeavy` 0.55R + `*-awakened` |
| 무음 지뢰·검은 태양 | Hazard vortex + sourceSkillId | `fill` + `dots`(테 띠) + `swirl` + `core-*` + `guide` + `stitch`(처음 0.2초 진행 + `stitchHead`). 비각성 끝 0.3초 `unravel` + `core-end`. vortex/collapse: R + 30에 `thread` + `collapse-awakened` |
| 철골 프레임 | player/hurt, world.player.shield > 0 | 각성 `shield`(0.36초 진행). 평상 aura = `shield` 1번 장 α 0.6을 획득·레벨업 때 한 번 |
| 수거 자석 | magnet/pulse | `pulse` 두 고리 + 각성 팝. 평상 aura = 첫 고리만 한 번 |
| 종이 갑주 | player/hurt | `plates`(무적 = paperWardDirectHitInvulnerability) + 각성 `wardRing` 140 + `plate-awakened` 6장(§6 `wardRing.plates`의 흔든 각·끝 반지름) |
| 회복 실 | 8방향 탄, 획득 | 각성 volley = 탄 조각. aura = §6 `aura`(r 35, 층 `ally`) |
| 동전 열병 | pickup/collected coin | `glint`(엽전 자리). 각성 `frenzy-awakened`를 주인공 발에 앵커, 층 `ally`, 폭주 동안 loop 8(폭주 남은 시간 데이터 필요) |
| 집행 표식 | enemy/hit crit | `mark`(보스 + 각성은 `markBoss-awakened`), 대상 몸 꼭대기 − 4. 한 적 0.3초에 1개, 동시 12개 |
| 패시브 공통 | world.skills 변화 | `pop`/`pop-awakened`를 머리 꼭대기 − 4(디버프 타이머 위). 같은 패시브는 1.5초에 1번 |

- 층(§2 `layer`): 아군 장판은 적 위험지형보다 먼저(아래), 폭발·붕괴 고리와 팝은 `allyAttacks`, 모든 아군 그림은 적 탄·텔레그래프보다 아래.
- 합성 각성 6종은 새 그림 없이 위 조각과 SPEC로 그린다: 집행 바늘비 = 바늘 +2, 빙결 연쇄 = 연쇄 대상마다 `chill<r>`·마지막 `root<r>-awakened`, 공허 박격 = 착탄점에 무음 지뢰 장판 0.9R(1.1초), 거울 레일 = `spearCopy` ±42, 일식 흑점 = 검은 태양 0.7배, 강철 부적 = `wardRing` 140(렌더 `k4-fusions`로 확인).

## 8. 감소 모션·섬광 감소·LOD

- 판정 모양(테, 띠, 고리, 낫 위치, 투사체)은 어느 설정에서도 그대로다. 궤도 낫은 감소 모션에서도 시뮬 위치대로 움직인다.
- 감소 모션: loop 조각은 `still`(0번 장), 소용돌이 회전 0, 펄스는 반지름 60에서 α만, 연쇄 떨림 seed 11 고정, 갑편은 끝 반지름(126~140)에 바로. prog 조각은 그대로 재생한다. 팝은 크기 변화 없이 α로만.
- 섬광 감소: `flash: true` 조각만 α × 0.5. 다른 조각의 한 장 안 종이 섬광 면적은 조각 넓이의 30% 이하다.
- minimal(적 160 이상): `deco` 조각, 가루(백묵 dust, 박격 dust), 꼬리(orbitTrail), 펄스, 바느질 머리를 뺀다. loop는 still. 매개 도형(테, 띠, 채움, 멈춘 소용돌이)은 그대로.

## 9. 신호색과 문법 (소속 검수)

- 청록은 모두 먹 위에 얹는다(실·심·테·바느질은 [ink, ally(, allyG)] 층, 청록 점·다이아는 먹 테). 예외는 SPEC `guide`·`pulse`(allyD 바탕)뿐이다. 회복 실 구슬의 후광은 검수 1차 고침 1로 없어졌다.
- 산호·호박·자수정·연두·장 재질색 0. 보라 기운 먹(#2a2134)·분홍 종이(#fff0ed) 0.
- 해칭 0, 고른 방사 눈금 0(박격 가루·갑편도 흔든다), 물방울 붓 머리 0, 삼각 화살촉 0(창날은 오목한 잎), 4갈래 별 0(반짝임은 5~7갈래 불규칙), 같은 크기 점 둘을 같은 높이에 0, 먹알 + 종이 점 0, 둥근 머리 + 꼬불 꼬리(올챙이) 0, 벌어지는 Y 실 0, ✕ 0, ⊘(닫힌 원 + 사선) 0. 집행 표식은 바늘 + 바늘 끝 아래 땀 호(≤ 120°)다. 일식 광선은 시뮬과 같이 5+L개가 고르게 돌지만 원 안쪽으로 뻗는 긴 붓 획이다(적 imminent 눈금은 원 밖의 짧은 먹 쐐기).

## 10. 지시서와 다르게 한 것

1. **바느질 점선 값**: 지시서 §1.5는 "`allyZone` 테의 값을 그대로"와 "땀 사이 바닥 2.5 이상(잰 값 약 [4.5, 7.5]의 둥근 끝)"을 함께 적었다. `allyZone`의 실제 값 [8, 5] 둥근 끝(먹 5)은 직선·큰 반지름에서 땀 사이가 0이 된다(렌더 `k4-ref-dash-test`). 측정 기준을 따라 [4.5, 7.5] 둥근 끝을 쓰고, 이음매가 겹치지 않게 둘레에 정수 개로 맞추는 `fit`을 더했다. 층 굵기 [ink 5, ally 2.8, allyG 0.8]은 그대로다.
2. **분신 박스**: 112×96 / (56,75) → **112×100 / (56,79)**. 주인공 킷의 run 2·6번 장 그림이 발 위 74.3까지 올라가서 96 높이로는 C7 여백 3을 지킬 수 없다. 발 아래 21은 그대로다. 박스 넓이 합 836,448 → 845,856(≤ 900,000). 검수 1차에서 수용됐다(지시서 정정 2).
3. **분신 바느질**: "실루엣을 따르거나 몸을 감싼 타원" 중 상태(idle·run·throw·hurt)마다 그 상태 모든 장의 합집합을 3.5 바깥에서 감싼 매끈한 선을 손으로 짰다. 필터로 실루엣을 바로 따라가는 방식은 대시가 방향·해상도에 따라 끊기거나 이어져서(@2x에서 흐려짐) 버렸다. throw 2번 장의 바늘은 수정 납품 1부터 잘라 낸다(§10-12).
4. **샌드위치 점선**: 청록이 든 butt 점선은 먹 층을 대시 양 끝으로 0.6 더 늘렸다(§6 아래 문단). 보이는 대시 값은 지시서 그대로다.
5. **`slashRing` 바깥 청록**: "바깥 ally 1.6"을 R + 4.4의 [ink 3, ally 1.6]으로 그렸다(청록이 바닥에 직접 닿지 않게).
6. **`rotate` 값**: 바늘 `shard-awakened`의 "맞은 적 → 파편 대상"은 새 값을 만들지 않고 `beam`(x1,y1 → x2,y2)으로 적었다.
7. **패시브 `main`**: 지시서에 없어서 각성 단계 중 판정·발동이 가장 잘 보이는 단계로 정했다(철골 shield, 자석 pulse, 갑주 ward, 회복 실 volley, 동전 frenzy, 집행 mark). 평상 호출은 같은 뜻의 평상 단계로 바뀐다(shield → aura 등).
8. **회복 실 aura 중심**: 바느질 원(반지름 30, 수정 납품 1부터 35 — §10-11)을 발이 아니라 몸 중심(발 −32)에 둔 참 원으로 그렸다. 발 중심이면 "바닥에 놓인 청록 고리" 금지(§1.7)에 걸린다.
9. **각성 단검 end**: 각성 단검은 귀환 중에 수명이 끝나므로 `end-awakened`도 손잡이가 앞이다(날끝이 주인공을 겨누지 않게).

수정 납품 1(K4 검수 1차 반영, 2026-10-03)에서 다르게 한 것:

10. **각성 바늘 겹실 진폭 1.4**(검수 고침 3의 1.6 대신): 두 가닥 간격은 env·|2·진폭·sin − 0.4|라서 1.6이면 최대 3.6으로 "중심 간격 ≤ 3.2"를 넘는다. 1.4이면 최대가 정확히 3.2다.
11. **회복 실 aura r 35**(검수 R7의 "r 28 검토" 대신): 먹 층 폭 5의 안쪽 가장자리(r − 2.5)가 얼굴 금지 구역의 가장 먼 모서리(발 기준 (18, −58), 몸 중심 (0, −32)에서 31.6)보다 바깥이어야 한다. 그러려면 r > 34.1이다. r 28·30은 구역을 지난다(렌더 `k4r2-aura-facezone`: r 28 / 30 / 35 세 칸). 층은 `ally`로 적었다.
12. **분신 throw 2번 장 바늘**(검수 R8): 감싼 선에 혹을 더하는 대신 선 사본에서 손 앞 바늘을 잘랐다(clipPath: 팔 높이 띠 y −42~−22의 x > 22.5). 혹을 더하면 감싼 선이 +46까지 뻗은 "화살 자루"가 된다. 모자 챙(+31까지)과 코트는 그대로다.
13. **동전 팝**: 선택안 "뒤에 옆으로 선 엽전"은 1x에서 프라이팬·돋보기 손잡이처럼 튀어나와 뺐다. 네모 구멍이 테까지 뚫리게 했다. 지시서의 "구멍으로 먹 원판이 보인다"가 앞 판에서는 테 색에 가려 있었다.
14. **동전 폭주 시작 높이 y +1**(검수 고침 6의 +4 대신): 박스 96×48 / 앵커 (48, 38)에서 발 아래 여백은 10이고 C7 여백 3을 빼면 7이다. 크기 4.6 엽전을 +4에서 띄우면 두께 테까지 +8을 넘는다. 그래서 +1 → −30으로 솟게 했다. 참고 그림 `draw(coinFever, 'frenzy')`에서는 glint를 뺐다(오른쪽 기둥 엽전을 덮었다).
15. **회복 실 매듭 앞끝 +5.5**: 검수 고침 1의 좌표 그대로라 판정 r 5보다 0.5 바깥이다(낫 기준 "1 이내"와 같은 허용).
16. **집행 표식 땀 틈 3.2/3**(검수 고침 2의 "틈 ≥ 1.8"보다 넓게): 틈이 먹 층 폭 2.6보다 좁으면 둥근 끝의 먹이 이어져 땀이 하나의 사슬로 보인다. 호는 64° → 174°(110°)로 120° 안이다. 보스 땀 넷은 3/2.6/2.2/1.8, 틈 3/2.9/2.8(62° → 178°, 116°)이다. 팝은 같은 구성을 r 4.4로 줄였다(땀 2/1.6/1.2, 틈 2.2/2, 먹 1.5, 117°).
17. **각성 무음 지뢰 가시 관의 종이 빛**(검수에 없던 것, 고침 7 확인 중 발견): 생성 0번 장(관 높이 0.2배)에서 두 줄이 원반 위 같은 높이의 점 한 쌍으로 보였다. 관이 반 이상 선 뒤(crown ≥ 0.5)에만 그린다.

## 11. 사람 원화가에게 남길 것 (바이블 §15)

- 분필 가장자리, 먹 소용돌이 팔, 검은 태양 코로나, 일식 붓 획의 붓 질감(비백·번짐)은 절차형 테이퍼로 낼 수 없다.
- 분신 선 사본: 필터가 먹 덩어리 가장자리를 두 번 따서 흑립 동심선·외곽이 이중 윤곽으로 보인다. 프레임 21장의 선 정리와 감싼 바느질 선의 땀 배치는 손으로 다듬어야 한다. throw 2번 장은 바늘을 잘라 낸 자리(손 끝)가 직선으로 끊긴다.
- 팝 기호(28px)는 배율별 픽셀 다듬기가 필요하다(특히 자석 부적 꼬리, 회복 실 실패, 집행 땀 셋). 동전 팝 각성은 1x에서 흰 엽전 가운데 먹 구멍이 2px 점이라, 눈으로 읽힐 여지를 손으로 없애야 한다.
- 종이 갑편의 접힘, 엽전의 3/4 원근, 옹기의 노끈 매듭은 단순화했다.
- 균열(흑선 fissure)과 붕괴 폭발(검은 태양·무음 지뢰 collapse 0번 장)의 최종 실루엣: 생물처럼 읽히지 않게 다듬는다(검수 1차 §9).
- 고친 뒤의 집행 표식·동전 팝·회복 실 매듭의 최종 기호.
- 연쇄의 리뷰 배치(지시서의 x 90, y ±30)는 큰 지그재그가 되므로, 실제 화면 판독은 C4 장면으로 본다.

## 12. 확인

- **K4 납품 때**: C1~C9 명령(지시서 §6)으로 확인했다. `--check` ok, C6 `text 0 · blur/gradient/blend 0 · image 0 · non-hex colour 0 · nondeterministic 0 · bad colours {}`, C7 `outside 0 · stamp box area 845856`, C9은 지시서 §2와 같다.
- **수정 납품 1(검수 1차 반영) 때**: 고침마다 "합격" 명령을 돌렸고 C1·C6·C7·C9를 다시 돌렸다(렌더 이름 `k4r2-*`). C6은 위와 같고, C7은 `checked 316 · outside 0 · stamp box area 849600`, C9은 지시서 §2와 같다.
- 결과 목록은 납품서 `docs/art/deliveries/K4-skill-vfx.md`에 있다.
