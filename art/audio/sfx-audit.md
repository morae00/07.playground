# 효과음 v0 점검 — AUD-02·AUD-04 레시피 53큐

| 항목 | 내용 |
|---|---|
| 작성 | sound-designer, 2026-10-02 |
| 대상 | `art/sfx-spec.mjs`의 레시피 53개(114파일), 규칙 `src/content/data/soundCues.ts`, 믹서 `src/game/audio/mixer.ts`, 이벤트 연결 `src/game/presentation/presentation.ts` |
| 이번 범위 | **점검과 제안만.** 레시피는 고치지 않았다. 승인된 항목은 다음 단계(S2, `docs/outsourcing/R4-orders.md` §5단계)에서 반영한다 |
| 한계 | 나는 소리를 들을 수 없다. 판단은 레시피 수치(주파수, 엔벨로프, 필터, 레이어 균형)와 코드에서 나온다. 수준(dB)은 레시피로 어림한 값이고, 사람이 들어 볼 것은 §9에 적었다 |

## 1. 요약 — 가장 중요한 것부터

| # | 발견 | 근거 | 제안 |
|---|---|---|---|
| 1 | **예고(텔레그래프)에 소리가 거의 없다(V3).** 원거리 조준 0.44초, 보스 돌진 준비 0.62초, 보스 패턴 예고 0.44~0.5초, 광폭화 침묵 지대 0.8초, 페이즈 전환이 모두 무음이다. 보스 패턴음은 **발사 순간**에 난다. 예고 시점에 나는 것은 `boss.shock`(충격 지대 생성), `boss.eclipse`(탄벽 예고 시작), `boss.intro`뿐이다 | `GameEngine.ts:3470`(돌진은 출발 때), `:3483-3498`(준비는 무음), `:3688`(예고 패턴은 발사 때), `:3694`(예고 링은 무음 이벤트), `presentation.ts:319-322`, `:301-304` | 경고음 가족(딱따기)과 새 큐 3개: `warn.ranged`, `warn.boss`, `warn.zone`(§6). 이벤트 3개(§7) |
| 2 | **경고 대역 2~4 kHz를 가장 잦은 소리가 차지한다.** 가벼운 타격(초당 최대 약 28번), 1장 처치(초당 최대 약 33번), 줍기 틱, 2·4장 처치, 4장 앰비언스 똑딱 | §4 표의 대역 열 | 잦은 소리를 2.4~3.6 kHz 밖으로 옮긴다(§5.1) |
| 3 | **앰비언스가 효과음보다 크다.** 앰비언스 출력 피크 약 −11 dBFS, 효과음 피크 −33~−21 dBFS. 2장(73 Hz)·5장(55 Hz) 드론은 심박(58~62 Hz)과 낮은 보스 경고를 가린다 | `mixer.ts:26`·`:160`(0.3), `mixer.ts:95`(효과음은 `SYNTH_PEAK` 수준), `sfx-spec.mjs:83`·`:86` | 드론을 110 Hz 위로(§5.3), 앰비언스 수준을 재서 낮춘다(§8) |
| 4 | **맥북 스피커에서 정보음이 사라진다.** 심박(42~62 Hz 사인만), 일식 탄벽 예고(41~55 Hz 사인 + 500 Hz 아래 잡음), 검은 태양 | `sfx-spec.mjs:37`, `:79`, `:47` | 120~600 Hz 배음과 짧은 어택을 더한다(§5.1) |
| 5 | **1장에서 처치음과 피격음이 같은 종이 찢김 계열이다.** 처치 1.9 kHz 찢김, 피격 0.9 kHz 찢김. 둘 다 크래클이고 길이도 비슷하다(0.13·0.12초). 피격 음량(큐 음량 1)도 처치와 같다 | `sfx-spec.mjs:30`·`:36`, `soundCues.ts:21`·`:25` | 피격 = 낮고 둔하고 젖은 구김, 처치 = 밝고 마른 찢김(§5.1). 피격 큐 음량 1.3(§8) |
| 6 | **4장 앰비언스는 0.5초마다 정확한 똑딱이다.** 사각파 1760·1320 Hz(배음 3960 Hz 포함)가 경고 대역에 있고, 보스 패턴음 `boss.clock`과 **같은 두 음높이**인데 앰비언스가 더 크다. 120 BPM 메트로놈이라 음악 박과 어긋나고, "모든 시계가 멈췄다"는 설정과도 맞지 않는다 | `sfx-spec.mjs:85`, `:77`, 로어 바이블 §1.3 | 불규칙하게 멈추려는 똑딱으로(§5.3), `boss.clock`은 다른 음높이로(§5.2) |
| 7 | **반복 피로.** 앰비언스 8초 루프 안의 사건(1장 바스락 3번, 2장 C5 종 1번)이 8초마다 같은 자리에서 난다. 2-10 용광의 입의 `boss.flame`은 1.05초마다 0.5초짜리 불길 |  `sfx-spec.mjs:82-83`, `GameEngine.ts:3562` | 앰비언스 20초 루프와 불규칙 사건(§5.3), 불길을 짧고 낮게(§5.2) |
| 8 | 타격 3단계(G13)는 지킨다: 낮아지고(탭 2.6 → 1.5 → 1.1 kHz, 몸통 0.9 kHz → 170 Hz → 120 Hz), 길어지고(0.053 → 0.092 → 0.194초), 커진다(큐 음량 0.72 → 1.1 → 1.35) | `afinfo` 길이, `soundCues.ts:16-18` | 유지. 가벼움만 대역을 옮긴다 |
| 9 | 음높이 있는 효과음은 거의 흰건반(C D E F G A B) 위에 있다. 벗어난 것은 `ui.confirm`(F♯5), `shield.block`(F♯6·C♯7), `boss.traps`(F♯5·D♯5) | §4 | 음악 브리프의 음높이 집합(`music-brief.md` §2.5)에 맞춘다 |
| 10 | 소리가 없는 사건: 시작 무기 먹선 바늘, 일식 보법(신화 스킬, 흔들림 12), 덫에 걸림, 보스 페이즈 전환, 스테이지 클리어 | `presentation.ts:70-80`, `:274-276`, `:301-304` | 새 큐 `cast.eclipseStep`, `hazard.trap`, `boss.phase`, `run.clear`(§6). 바늘은 선택 |

## 2. 기준

### 2.1 대역 차선

| 차선 | 대역 | 누가 쓰나 |
|---|---|---|
| **경고(호박)** | 2.4~3.6 kHz 핵심 | 경고음, 예고 시점의 보스 패턴음(`boss.shock`, `boss.eclipse`), `boss.intro`. 음악도 비운다(`music-brief.md` §2.3) |
| 잦은 소리 | 1.6 kHz 아래 + 4.5 kHz 위 | 타격, 처치, 줍기, 시전, 앰비언스 사건 |
| 피격(산호) | 70~1.4 kHz, 둔하고 젖음 | `player.hurt`, 심박 |
| 정지 중 소리 | 제한 없음 | 드래프트, 레벨업, 강화 구매, UI(시뮬레이션이 멈춰 경고가 없다) |

### 2.2 맥북 스피커

정보를 실은 소리는 150 Hz 위에도 에너지가 있어야 한다. 150 Hz 아래 사인만으로 된 소리는 내장 스피커에서 사라진다.

### 2.3 레벨 구조 (지금)

- 효과음 파일은 피크 0.9로 정규화되고(`sfx-spec.mjs:17`), 믹서가 `큐 음량 × 0.055`의 피크로 튼다(`mixer.ts:95`). 큐 음량 1 = 출력 피크 −25.2 dBFS.
- 그래서 레시피 안의 gain은 레이어 사이 균형만 정한다. 큐 사이의 크기는 `soundCues.ts`의 큐 음량이 정한다.
- 앰비언스는 피크 0.9 × `AMBIENCE_LEVEL` 0.3 = 출력 피크 0.27(−11.4 dBFS)이다. 효과음 정규화 경로(`SYNTH_PEAK`)를 거치지 않는다.

### 2.4 보이스 규칙과 소리 길이

샘플이 들어오면 보이스 길이는 합성 대체음 길이가 아니라 샘플 길이다(`mixer.ts:84`). 그래서 길이가 규칙을 무력화하는지 봤다.

- `enemy.kill`: 0.13초 × 보이스 3, 간격 0.03초. 30 ms마다 새 처치가 가장 오래된 보이스를 12 ms 페이드로 끊는다. 각 처치음이 약 90 ms만 산다. 꼬리가 잘려 거칠어진다 → 처치음을 0.11초로 줄이고(§5.1), 간격 0.04초를 제안(§8).
- 줍기: XP·엽전이 따로 보이스 3개씩, 함께 최대 6보이스(16 중). 짧아서(0.06~0.07초) 실제 점유는 적다. 보이스 2개씩을 제안(§8).
- 긴 소리(`boss.intro` 1.04초, `boss.rings` 0.86초, `boss.kill` 0.82초, `boss.enraged` 0.8초)는 모두 우선순위 4~5이고 드물다. 문제없다.
- `player.hurt`는 우선순위 4라 16보이스가 차도 낮은 보이스를 빼앗는다. 문제없다.

## 3. 큐별 출력 수준 (지금)

| 큐 음량 | 출력 피크 | 큐 |
|---|---|---|
| 1.6 | −21.1 dBFS | `player.heartbeat` |
| 1.4 | −22.3 | `boss.intro` |
| 1.35 | −22.6 | `hit.critical` |
| 1.3 | −22.9 | `player.down` |
| 1.2 | −23.6 | `run.levelUp` |
| 1.1 | −24.4 | `hit.heavy`, `draft.sting` |
| 1.0 | −25.2 | 나머지 대부분(처치, 피격, 시전, 보스 패턴, 드래프트) |
| 0.72 | −28.0 | `hit.light` |
| 0.6 / 0.55 | −29.6 / −30.4 | `pickup.xp` / `pickup.coin` |
| 0.5 / 0.4 | −31.2 / −33.2 | `ui.confirm`·`ui.cancel` / `ui.deny` |
| (앰비언스) | **−11.4** | `ambience.ch1~5` |

## 4. 큐별 점검

길이는 변형 0 기준(변형은 ±8%), 대역은 레시피에서 주 에너지가 있는 곳. 판정: **A** 판독 문제(꼭 바꾸자), **B** 권장, **C** 유지.

| 큐 | 변형 | 길이 | 주 대역 | 점검 | 판정 |
|---|---|---|---|---|---|
| `hit.light` | 4 | 0.053 | 1.7~3.5 kHz 탭 + 0.5~0.9 kHz 사각파(배음 2.7 kHz) | G13 맞음. 가장 잦은 소리가 경고 핵심 대역에 있다 | A |
| `hit.heavy` | 4 | 0.092 | 1.0~2.0 kHz 탭, 90~170 Hz, 3 kHz 위 크래클 | G13 맞음. 크래클 하한이 경고 대역 | B |
| `hit.critical` | 4 | 0.194 | 0.8~1.4 kHz, 55~120 Hz, 5.2→0.9 kHz 쓸림 | G13 맞음. 드물다(보스 처치·큰 타격) | C |
| `shield.block` | 3 | 0.11 | 1.3~3.5 kHz 쇳소리 | 방패병이 많은 장에서 잦다. F♯6·C♯7은 음높이 집합 밖 | B |
| `enemy.kill` (1장 종이) | 4 | 0.132 | 1.0~3.4 kHz 크래클, 120~210 Hz | 재질 맞음. 가장 잦은 소리 둘째. 경고 대역, 피격과 혼동, 보이스 끊김(§2.4) | A |
| `enemy.stunned` | 3 | 0.15 | 0.6~1.3 kHz 두 번 오르기 | 만화적이지만 판독 문제 없음 | C |
| `boss.kill` | 2 | 0.82 | 32~90 Hz, 3.4→0.26 kHz 쓸림, 2.2 kHz 위 크래클 | 먹 항아리 터짐. 잡음 쓸림이 있어 노트북에서도 들린다 | C |
| `boss.enraged` | 2 | 0.80 | 62~88 Hz 톱니(배음), 420 Hz 잡음 | 위험 신호인데 중고역이 약하다 | B |
| `boss.intro` | 1 | 1.04 | 49~55 Hz 톱니, 110 Hz, 700 Hz 아래 잡음 | FX-05의 경고음인데 경고 대역이 없다. 5장 55 Hz 드론에 기음이 가린다 | A |
| `player.hurt` | 3 | 0.12 | 70~150 Hz, 0.9 kHz 크래클 | 1장 처치와 같은 계열(§1 #5) | A |
| `player.heartbeat` | 1 | 0.28 | **42~62 Hz 사인만** | 노트북에서 안 들림. 2장 73 Hz·5장 55 Hz 드론에 가림 | A |
| `player.down` | 1 | 0.73 | 45~180 Hz 톱니, 1.8→0.2 kHz | 톱니 배음으로 들린다 | C |
| `cast.fanKnives` | 3 | 0.094 | 4.2→2.4 kHz 쓸림, 1.3~1.7 kHz | 쓸림이 경고 대역으로 내려온다 | B |
| `cast.chainSpark` | 3 | 0.14 | 2.6 kHz 위 크래클, 0.9~1.8 kHz 사각파 | 크래클 하한이 경고 대역 | B |
| `cast.frostLine` | 3 | 0.14 | 5.2→2.6 kHz(q 3), 1.8~2.4 kHz | 쓸림이 경고 대역으로 내려온다 | B |
| `cast.railSpear` | 2 | 0.22 | 70~140 Hz 톱니, 6→0.8 kHz | 드문 큰 기술 | C |
| `cast.boneMortar` | 2 | 0.22 | 60~120 Hz, 1.2 kHz 아래 | 맞음 | C |
| `cast.mirrorClone` | 3 | 0.10 | 0.5~1.4 kHz 옥타브 오르기 | 맞음 | C |
| `cast.voidMine` | 2 | 0.24 | 60~180 Hz, 600 Hz 아래 | "소리를 삼킨다"는 뜻은 맞다. 노트북에서 약하다 | B |
| `cast.blackSun` | 2 | 0.44 | 40~150 Hz, 80~300 Hz | 신화 스킬인데 노트북에서 거의 안 들림 | B |
| `draft.skill` | 1 | 0.21 | C5·G5 | 정지 중 | C |
| `draft.awakening` | 1 | 0.63 | A2→A3 톱니, E5, 3 kHz 위 공기 | 정지 중 | C |
| `draft.heal` | 1 | 0.23 | C5→E5, G5 | 정지 중 | C |
| `draft.coins` | 1 | 0.22 | G6·C7·E7 | 정지 중 | C |
| `draft.overdrive` | 1 | 0.28 | 130→260 Hz 톱니, 0.8→2.4 kHz | 정지 중 | C |
| `run.upgrade` | 1 | 0.14 | G4·D5 | 일시정지 중 | C |
| `run.levelUp` | 1 | 0.63 | 0.6→4.2 kHz 쓸림, C–E–G | 드래프트가 열릴 때(정지) | C |
| `draft.sting` | 1 | 0.48 | G3·D4 톱니, 2.6 kHz 위 크래클 | 정지 중 | C |
| `pickup.xp` | 3 | 0.056 | A6·E7 (1.76·2.64 kHz), 콤보로 최대 +48% → 2.6·3.9 kHz | 잦고, 콤보가 경고 대역으로 올라간다 | A |
| `pickup.coin` | 3 | 0.071 | 2.35·3.52 kHz, 4 kHz 탭 | 잦고 경고 대역 한가운데 | A |
| `ui.confirm` | 2 | 0.051 | 3 kHz 탭, F♯5 | 메뉴·일시정지라 대역은 괜찮다. F♯는 메뉴 곡(D 중심)과 부딪힌다 | B |
| `ui.cancel` | 2 | 0.056 | 1.8 kHz, A4 | 맞음 | C |
| `ui.deny` | 1 | 0.082 | 150 Hz 사각파, 700 Hz | 맞음 | C |
| `enemy.kill.iron` | 4 | 0.14 | A5→E5, 1.33 kHz 사각파(배음 4 kHz), 3.1 kHz 탭 | 재질 맞음. 탭이 경고 대역 | B |
| `enemy.kill.water` | 4 | 0.22 | 2.4→0.38 kHz 잡음, 110~320 Hz | 재질은 맞지만 3장 앰비언스(잡음 물결)와 같은 결이라 묻힌다 | B |
| `enemy.kill.clock` | 4 | 0.14 | 2.1 kHz 사각파, 0.56~1.25 kHz, 2.8 kHz 위 크래클 | 재질 맞음. 사각파와 크래클이 경고 대역 | B |
| `enemy.kill.eclipse` | 4 | 0.24 | 1.76→0.42 kHz 내림, 5.2 kHz 위 | 맞음. 경고 대역 아래로 떨어진다 | C |
| `boss.dash` | 2 | 0.36 | 0.5→2.4 kHz 쓸림, 60~90 Hz | 출발 순간의 휙. 준비(0.62초)가 무음인 것은 §6 `warn.boss`로 | C |
| `boss.rings` | 2 | 0.86 | G3·G4·B5 종 | 종탑·백환 재질 맞음. 음높이 집합 안 | C |
| `boss.shock` | 2 | 0.32 | 1.8 kHz 위 크래클, 40~70 Hz | **예고 시작(0.52초 전)에 난다.** 경고음 역할을 하지만 경고 음색(딱따기)이 없다 | B |
| `boss.clones` | 2 | 0.38 | D6→A6, G6→D7, 6 kHz 위 | 거울 반짝임. 맞음 | C |
| `boss.flame` | 2 | 0.52 | 0.9→2.6 kHz 잡음, 1.4 kHz 크래클 | 1.05초마다 난다. 피로. 쓸림 끝이 경고 대역 | B |
| `boss.tide` | 2 | 0.87 | 0.3→1.5 kHz 잡음, 82~110 Hz | 어택 0.25초: 발사보다 늦게 차오른다 | B |
| `boss.traps` | 2 | 0.19 | F♯5·B5·D♯5 사각파 삐삐, 2.4 kHz 탭 | 전자음이라 먹·종이·쇠 세계와 다르다. 음높이 집합 밖 | B |
| `boss.clock` | 2 | 0.29 | A6·E6 사각파, 120~160 Hz | 4장 앰비언스 똑딱과 같은 음높이(§1 #6) | B |
| `boss.saw` | 2 | 0.39 | 180→420 Hz 톱니, 3.4 kHz(q 2.4) 잡음 | 잡음 띠가 경고 핵심 대역 | B |
| `boss.eclipse` | 2 | 0.92 | **41~55 Hz 사인 + 500 Hz 아래 잡음** | **탄벽 예고 시작(0.6초 전)에 난다.** 그런데 노트북에서 안 들리고 5장 드론에 가린다 | A |
| `boss.null` | 2 | 0.67 | 3→0.3 kHz(어택 0.35초), 880→110 Hz | 발사 0.35초 뒤에야 최고점. "지워짐"이 소리 모양에 없다 | B |
| `ambience.ch1` | 1 | 8.0 | 420 Hz 아래 잡음, 2.6 kHz 위 바스락 | 바스락이 경고 대역이고 8초마다 같은 자리 | B |
| `ambience.ch2` | 1 | 8.0 | D2 73 Hz 드론, D3, C5 종 | 드론이 심박을 가림, 종이 8초마다 | A |
| `ambience.ch3` | 1 | 8.0 | 700 Hz 넓은 잡음(q 0.6), 220 Hz 아래 | 0.3~1.5 kHz를 덮어 피격·물 처치음을 가림 | B |
| `ambience.ch4` | 1 | 8.0 | 0.5초마다 A6·E6 사각파, 300 Hz 아래 | §1 #6 | A |
| `ambience.ch5` | 1 | 8.0 | A1 55 Hz 사인, 4.8 kHz 위 | 심박·일식 경고·보스 등장 기음을 가림 | A |

## 5. 바꿀 레시피 제안

- **모든 제안은 `variants` 수를 바꾸지 않는다.** 변형 시드는 큐 순서와 변형 수로만 이어지므로(`scripts/build-sfx.mjs:148-151`), 레이어만 바꾸면 그 큐의 파일만 바뀌고 다른 큐는 바이트 단위로 그대로다. 앰비언스의 `loop` 길이를 바꿔도 시드는 그대로다.
- 레시피는 데이터와 기존 같은 작은 도우미(`tap`, `thud`)만 쓴다.
- 경고 가족을 위한 도우미 하나를 `tap`·`thud` 옆에 더하자고 제안한다:

```js
// The amber family (V3): a dry wooden clapper (딱따기) in the 2.4-3.6 kHz warning lane, kept free elsewhere.
const clack = (at = 0, hz = 3000, gain = 1) => [
  { tone: 'triangle', hz, to: hz * 0.94, attack: 0.001, decay: 0.03, gain: 0.6 * gain, at },
  { noise: 'white', filter: 'bandpass', hz: hz * 1.07, q: 4, attack: 0.001, decay: 0.018, gain: 0.8 * gain, at },
  { tone: 'sine', hz: hz * 1.47, attack: 0.001, decay: 0.015, gain: 0.25 * gain, at },
];
```

### 5.1 A — 판독 (꼭)

**`hit.light`** — 가장 가벼운 타격은 종이 끝을 붓으로 튕기는 소리. 경고 대역 위(4.6 kHz)로 올려 가장 높고 가장 짧게(G13 유지).
```js
'hit.light': { variants: 4, layers: [{ noise: 'white', filter: 'bandpass', hz: 4600, q: 2.2, attack: 0.001, decay: 0.022, gain: 1 }, { tone: 'triangle', hz: 1100, to: 600, attack: 0.001, decay: 0.014, gain: 0.35 }] },
```

**`enemy.kill`** (1장) — 찢김의 몸통은 1.3 kHz, 찢긴 결은 5.2 kHz 위. 경고 대역을 비우고 0.11초로 줄여 보이스 끊김을 줄인다.
```js
'enemy.kill': { variants: 4, layers: [{ noise: 'crackle', filter: 'bandpass', hz: 1300, q: 1.1, attack: 0.002, decay: 0.09, gain: 1 }, { noise: 'crackle', filter: 'highpass', hz: 5200, attack: 0.001, decay: 0.05, gain: 0.35 }, thud(210, 120, 0.05, 0.4)] },
```

**`player.hurt`** — 결의 종이 몸이 구겨지며 먹이 튄다: 낮고 둔하고 젖은 소리, 짧게 꺾이는 '욱'. 마르고 밝은 처치 찢김과 갈린다.
```js
'player.hurt': { variants: 3, layers: [thud(150, 70, 0.1, 1), { tone: 'triangle', hz: 420, to: 190, attack: 0.002, decay: 0.07, gain: 0.4 }, { noise: 'white', filter: 'lowpass', hz: 1400, to: 300, attack: 0.002, decay: 0.08, gain: 0.5 }, { noise: 'crackle', filter: 'bandpass', hz: 700, q: 1, attack: 0.002, decay: 0.07, gain: 0.45 }] },
```

**`player.heartbeat`** — 같은 두 박에 북 가죽 같은 배음(120 Hz대 삼각파)과 짧은 가죽 소리(500 Hz)를 더해 노트북에서도 들리게.
```js
'player.heartbeat': { variants: 1, layers: [thud(62, 44, 0.09, 1), { tone: 'triangle', hz: 124, to: 88, attack: 0.002, decay: 0.07, gain: 0.45 }, { noise: 'white', filter: 'bandpass', hz: 520, q: 1.2, attack: 0.001, decay: 0.025, gain: 0.3 }, thud(58, 42, 0.1, 0.8, 0.16), { tone: 'triangle', hz: 116, to: 84, attack: 0.002, decay: 0.08, gain: 0.35, at: 0.16 }, { noise: 'white', filter: 'bandpass', hz: 480, q: 1.2, attack: 0.001, decay: 0.025, gain: 0.22, at: 0.16 }] },
```

**`boss.intro`** — 경고 가족의 '딱딱' 두 번 뒤에 낮게 울린다. 보스 등장도 예고다(FX-05). 220 Hz 층을 더해 5장 드론에 묻히지 않게.
```js
'boss.intro': { variants: 1, layers: [...clack(0, 2800), ...clack(0.09, 3100), { tone: 'sawtooth', hz: 55, to: 49, attack: 0.12, decay: 0.9, gain: 0.8, at: 0.1 }, { tone: 'sine', hz: 110, attack: 0.05, decay: 0.8, gain: 0.5, at: 0.1 }, { tone: 'triangle', hz: 220, to: 196, attack: 0.08, decay: 0.7, gain: 0.3, at: 0.1 }, { noise: 'white', filter: 'lowpass', hz: 700, attack: 0.2, decay: 0.7, gain: 0.35, at: 0.1 }] },
```

**`boss.eclipse`** — 탄벽 예고가 시작될 때 난다. 일식 원장이 지휘봉으로 보면대를 세 번 치고(경고 가족), 해가 먹히는 낮은 울림은 110→82 Hz로 올려 들리게.
```js
'boss.eclipse': { variants: 2, layers: [...clack(0, 2900, 0.8), ...clack(0.1, 2900, 0.8), ...clack(0.2, 3200), { tone: 'sine', hz: 110, to: 82, attack: 0.1, decay: 0.7, gain: 0.7, at: 0.1 }, { tone: 'triangle', hz: 220, to: 165, attack: 0.1, decay: 0.6, gain: 0.3, at: 0.1 }, { noise: 'white', filter: 'lowpass', hz: 500, to: 120, attack: 0.1, decay: 0.7, gain: 0.4, at: 0.1 }] },
```

**`pickup.xp`** — 옥 구슬 틱을 C6·G6로 내린다. 콤보 +48%에서도 1.55·2.32 kHz로 핵심 대역 아래.
```js
'pickup.xp': { variants: 3, layers: [{ tone: 'sine', hz: 1047, attack: 0.001, decay: 0.035, gain: 0.7 }, { tone: 'sine', hz: 1568, attack: 0.001, decay: 0.025, gain: 0.35 }] },
```

**`pickup.coin`** — 돌 위의 엽전: 몸통 G6, 울림 D8, 부딪힘 5.6 kHz. 경고 대역을 사이에 두고 위아래로.
```js
'pickup.coin': { variants: 3, layers: [{ tone: 'triangle', hz: 1568, attack: 0.001, decay: 0.05, gain: 0.6 }, { tone: 'sine', hz: 4699, attack: 0.001, decay: 0.04, gain: 0.25 }, { noise: 'white', filter: 'bandpass', hz: 5600, q: 2, attack: 0.001, decay: 0.01, gain: 0.4 }] },
```

### 5.2 B — 권장

**`hit.heavy`** — 크래클을 4.8 kHz 위로(종이 이 빠짐).
```js
'hit.heavy': { variants: 4, layers: [tap(1500, 0.05), thud(170, 90, 0.07, 0.8), { noise: 'crackle', filter: 'highpass', hz: 4800, attack: 0.001, decay: 0.04, gain: 0.35 }] },
```

**`shield.block`** — 쇠 방패에 먹침이 튕긴다. D6→C6과 A6(음높이 집합 안), 부딪힘은 5.2 kHz.
```js
'shield.block': { variants: 3, layers: [{ tone: 'triangle', hz: 1175, to: 1047, attack: 0.001, decay: 0.09, gain: 0.7 }, { tone: 'sine', hz: 1760, attack: 0.001, decay: 0.07, gain: 0.3 }, { noise: 'white', filter: 'bandpass', hz: 5200, q: 2, attack: 0.001, decay: 0.02, gain: 0.5 }] },
```

**`boss.enraged`** — 으르렁 위에 2배음(124→176 Hz)과 먹 불꽃 크래클(4.5 kHz 위).
```js
'boss.enraged': { variants: 2, layers: [{ tone: 'sawtooth', hz: 62, to: 88, attack: 0.08, decay: 0.7, gain: 0.8 }, { tone: 'triangle', hz: 124, to: 176, attack: 0.08, decay: 0.6, gain: 0.45 }, { noise: 'white', filter: 'bandpass', hz: 420, q: 2, attack: 0.1, decay: 0.6, gain: 0.5 }, { noise: 'crackle', filter: 'highpass', hz: 4500, attack: 0.05, decay: 0.4, gain: 0.3, at: 0.1 }] },
```

**`cast.fanKnives`** — 부채가 펴지는 쉭을 6.4→4.2 kHz로.
```js
'cast.fanKnives': { variants: 3, layers: [{ noise: 'white', filter: 'highpass', hz: 6400, to: 4200, attack: 0.004, decay: 0.07, gain: 0.8 }, { tone: 'triangle', hz: 1300, to: 1700, attack: 0.001, decay: 0.03, gain: 0.25 }] },
```

**`cast.chainSpark`** — 흰 획이 튀는 크래클을 4.2 kHz 위로, 사각파는 삼각파로(배음을 줄인다).
```js
'cast.chainSpark': { variants: 3, layers: [{ noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.001, decay: 0.12, gain: 0.9 }, { tone: 'triangle', hz: 1760, to: 880, attack: 0.001, decay: 0.05, gain: 0.3 }] },
```

**`cast.frostLine`** — 분필 긋기: 6.8→4.6 kHz 사각사각, 1.2 kHz 분필 결, 낮은 사인.
```js
'cast.frostLine': { variants: 3, layers: [{ noise: 'white', filter: 'bandpass', hz: 6800, to: 4600, q: 3, attack: 0.002, decay: 0.12, gain: 0.8 }, { noise: 'crackle', filter: 'bandpass', hz: 1200, q: 1.2, attack: 0.002, decay: 0.08, gain: 0.3 }, { tone: 'sine', hz: 1760, to: 1319, attack: 0.002, decay: 0.09, gain: 0.25 }] },
```

**`cast.voidMine`** — 삼키는 소리에 2배음(360→120 Hz).
```js
'cast.voidMine': { variants: 2, layers: [{ tone: 'sine', hz: 180, to: 60, attack: 0.01, decay: 0.2, gain: 0.8 }, { tone: 'triangle', hz: 360, to: 120, attack: 0.01, decay: 0.18, gain: 0.35 }, { noise: 'white', filter: 'lowpass', hz: 600, to: 120, attack: 0.02, decay: 0.2, gain: 0.4 }] },
```

**`cast.blackSun`** — 검은 원반이 끌어당긴다: 300→80 Hz 배음과 1.2→0.25 kHz 빨림.
```js
'cast.blackSun': { variants: 2, layers: [{ tone: 'sine', hz: 150, to: 40, attack: 0.02, decay: 0.4, gain: 0.9 }, { tone: 'triangle', hz: 300, to: 80, attack: 0.02, decay: 0.35, gain: 0.4 }, { noise: 'white', filter: 'bandpass', hz: 1200, to: 250, q: 1.2, attack: 0.05, decay: 0.3, gain: 0.3 }, { noise: 'white', filter: 'bandpass', hz: 300, to: 80, q: 1.5, attack: 0.05, decay: 0.35, gain: 0.5 }] },
```

**`ui.confirm`** — F♯5 → G5(메뉴 곡 D 중심과 어울린다).
```js
'ui.confirm': { variants: 2, layers: [tap(3000, 0.018, 0.8), { tone: 'triangle', hz: 784, attack: 0.001, decay: 0.03, gain: 0.3 }] },
```

**`enemy.kill.iron`** — 창살 쥐가 쇳소리로 쓰러진다. 사각파 → 삼각파 E6, 탭은 4.8 kHz.
```js
'enemy.kill.iron': { variants: 4, layers: [{ tone: 'triangle', hz: 880, to: 640, attack: 0.001, decay: 0.12, gain: 0.7 }, { tone: 'triangle', hz: 1319, attack: 0.001, decay: 0.035, gain: 0.3 }, { noise: 'white', filter: 'bandpass', hz: 4800, q: 2, attack: 0.001, decay: 0.03, gain: 0.6 }] },
```

**`enemy.kill.water`** — 물 잡음만으로는 3장 물결에 묻힌다. 떨어지는 물방울('퐁', 660→1319 Hz 오르기)을 더하고 철벅을 짧게.
```js
'enemy.kill.water': { variants: 4, layers: [{ noise: 'white', filter: 'lowpass', hz: 2400, to: 380, attack: 0.004, decay: 0.14, gain: 0.8 }, { tone: 'sine', hz: 660, to: 1319, attack: 0.002, decay: 0.045, gain: 0.55 }, thud(320, 110, 0.1, 0.5)] },
```

**`enemy.kill.clock`** — 태엽 벌레가 풀린다. 틱은 G6 삼각파, 크래클은 4.8 kHz 위.
```js
'enemy.kill.clock': { variants: 4, layers: [{ tone: 'triangle', hz: 1568, attack: 0.001, decay: 0.018, gain: 0.5 }, { tone: 'triangle', hz: 1250, to: 560, attack: 0.001, decay: 0.09, gain: 0.5, at: 0.03 }, { noise: 'crackle', filter: 'highpass', hz: 4800, attack: 0.001, decay: 0.06, gain: 0.35 }] },
```

**`boss.shock`** — 충격 지대가 생길 때(0.52초 예고 시작) 난다. 균열 장교가 군도를 꽂는 '딱'(경고 가족) 뒤에 균열이 번진다.
```js
'boss.shock': { variants: 2, layers: [...clack(0, 3000), { noise: 'crackle', filter: 'highpass', hz: 1800, attack: 0.001, decay: 0.25, gain: 1, at: 0.04 }, thud(70, 40, 0.3, 0.8, 0.04), { tone: 'triangle', hz: 140, to: 80, attack: 0.002, decay: 0.2, gain: 0.4, at: 0.04 }] },
```

**`boss.flame`** — 1.05초마다 나는 소리라 짧고 낮게(0.6→1.8 kHz, 0.3초).
```js
'boss.flame': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 600, to: 1800, attack: 0.04, decay: 0.3, gain: 0.9 }, { noise: 'crackle', filter: 'bandpass', hz: 1000, q: 0.8, attack: 0.02, decay: 0.28, gain: 0.4 }] },
```

**`boss.tide`** — 밀물이 발사와 함께 차오르게 어택 0.25 → 0.08초, 220 Hz 층을 더한다.
```js
'boss.tide': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 300, to: 1500, attack: 0.08, decay: 0.6, gain: 0.8 }, { tone: 'sine', hz: 110, to: 82, attack: 0.08, decay: 0.6, gain: 0.4 }, { tone: 'triangle', hz: 220, to: 165, attack: 0.08, decay: 0.5, gain: 0.25 }] },
```

**`boss.traps`** — 삐삐 대신 걸쇠 세 번 '철컥'(덫 셋), 마지막에 무게.
```js
'boss.traps': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1800, q: 3, attack: 0.001, decay: 0.02, gain: 0.8 }, { tone: 'triangle', hz: 587, attack: 0.001, decay: 0.05, gain: 0.35 }, { noise: 'white', filter: 'bandpass', hz: 1100, q: 3, attack: 0.001, decay: 0.02, gain: 0.7, at: 0.07 }, { noise: 'white', filter: 'bandpass', hz: 1500, q: 3, attack: 0.001, decay: 0.02, gain: 0.7, at: 0.14 }, thud(140, 90, 0.08, 0.6, 0.14)] },
```

**`boss.clock`** — 괘종의 낮은 '똑–딱'(A5·E5)과 멈춘 시계의 종 한 번(E6). 4장 앰비언스 똑딱(제안: D6·G5)과 음높이를 가른다.
```js
'boss.clock': { variants: 2, layers: [{ tone: 'triangle', hz: 880, attack: 0.001, decay: 0.03, gain: 0.55 }, { noise: 'white', filter: 'bandpass', hz: 1200, q: 3, attack: 0.001, decay: 0.015, gain: 0.4 }, { tone: 'triangle', hz: 659, attack: 0.001, decay: 0.03, gain: 0.5, at: 0.25 }, { noise: 'white', filter: 'bandpass', hz: 900, q: 3, attack: 0.001, decay: 0.015, gain: 0.35, at: 0.25 }, thud(160, 120, 0.2, 0.4), { tone: 'sine', hz: 1319, attack: 0.002, decay: 0.45, gain: 0.2, at: 0.25 }] },
```

**`boss.saw`** — 톱니 회전음의 잡음 띠를 3.4 → 4.8 kHz로.
```js
'boss.saw': { variants: 2, layers: [{ tone: 'sawtooth', hz: 180, to: 420, attack: 0.02, decay: 0.35, gain: 0.45 }, { noise: 'white', filter: 'bandpass', hz: 4800, q: 2.4, attack: 0.02, decay: 0.3, gain: 0.5 }] },
```

**`boss.null`** — 무음 심판관은 소리를 지운다: 발사와 함께 들어와(어택 0.04초) 잠깐 머물다 꼬리 없이 뚝 끊긴다.
```js
'boss.null': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 2400, to: 300, q: 1.5, attack: 0.04, hold: 0.22, decay: 0.03, gain: 0.7 }, { tone: 'sine', hz: 880, to: 110, attack: 0.04, hold: 0.22, decay: 0.03, gain: 0.3 }, thud(90, 60, 0.12, 0.5)] },
```

### 5.3 앰비언스 다섯 (A·B)

공통: 루프 8 → **20초**(사건이 같은 자리에 돌아오는 주기를 늘린다). 연속 층의 `hold`는 21.2(렌더 길이 21초). LFO는 20초에 정수 바퀴가 되게 0.05 Hz의 배수. 사건은 1.0초 뒤에 시작한다(굽기가 꼬리 1초를 머리 1초 위에 접으며 머리를 페이드인하므로, 처음 1초의 사건은 작아진다, `scripts/build-sfx.mjs:114-121`). 음높이는 음악 브리프의 장별 중심음과 맞췄다(`music-brief.md` §3.1).

**`ambience.ch1`** — 비 그친 새벽 골목: 먼 방 공기, 벽보 펄럭임(1.2 kHz), 처마 물방울(D6→G6). 경고 대역에서 바스락을 뺐다.
```js
'ambience.ch1': { variants: 1, loop: 20, layers: [{ noise: 'white', filter: 'lowpass', hz: 380, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.8, lfo: { hz: 0.1, depth: 0.4 } }, ...[1.7, 4.1, 9.3, 12.8, 17.4].map((at) => ({ noise: 'crackle', filter: 'bandpass', hz: 1200, q: 0.8, attack: 0.03, decay: 0.3, gain: 0.22, at })), ...[2.9, 7.6, 8.1, 14.2, 19.0].map((at) => ({ tone: 'sine', hz: 1175, to: 1568, attack: 0.001, decay: 0.03, gain: 0.12, at }))] },
```

**`ambience.ch2`** — 빈 예배당: D3·A3 드론(심박 대역을 비운다), 낮은 쇠 울림, 먼 종 D5·A4가 불규칙하게.
```js
'ambience.ch2': { variants: 1, loop: 20, layers: [{ tone: 'sine', hz: 147, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.4, lfo: { hz: 0.05, depth: 0.4 } }, { tone: 'triangle', hz: 220, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.12, lfo: { hz: 0.1, depth: 0.6 } }, { noise: 'white', filter: 'lowpass', hz: 300, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.3, lfo: { hz: 0.15, depth: 0.3 } }, ...[[2.3, 587], [11.1, 440], [16.4, 587]].map(([at, hz]) => ({ tone: 'sine', hz, attack: 0.002, decay: 3, gain: 0.16, at }))] },
```

**`ambience.ch3`** — 갇힌 운하: 520 Hz 아래 물결 두 겹, 돌방 물방울(G5→D6). 0.7 kHz 넓은 띠를 걷어 피격·처치가 들어올 자리를 낸다.
```js
'ambience.ch3': { variants: 1, loop: 20, layers: [{ noise: 'white', filter: 'lowpass', hz: 520, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.7, lfo: { hz: 0.35, depth: 0.45 } }, { noise: 'white', filter: 'lowpass', hz: 200, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.5, lfo: { hz: 0.1, depth: 0.3 } }, ...[3.4, 6.0, 10.7, 13.3, 18.2].map((at) => ({ tone: 'sine', hz: 784, to: 1175, attack: 0.001, decay: 0.05, gain: 0.14, at }))] },
```

**`ambience.ch4`** — 멈춘 시계의 묘지: 바람, 톱니가 삐걱이는 좁은 띠(420 Hz), 멈추려다 멈추는 똑딱(3번 → 2번 → 1번, D6·G5 삼각파).
```js
'ambience.ch4': { variants: 1, loop: 20, layers: [{ noise: 'white', filter: 'lowpass', hz: 260, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.4, lfo: { hz: 0.05, depth: 0.4 } }, { noise: 'white', filter: 'bandpass', hz: 420, q: 5, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.25, lfo: { hz: 0.15, depth: 0.8 } }, ...[2.0, 2.27, 2.55, 9.4, 9.7, 15.1].map((at, index) => ({ tone: 'triangle', hz: index % 2 ? 784 : 1175, attack: 0.001, decay: 0.02, gain: 0.16, at }))] },
```

**`ambience.ch5`** — 일식의 정적: A2·E3 드론(55 Hz를 비워 심박과 일식 경고가 산다), 6 kHz 위 차가운 공기, 깊게 숨 쉬는 LFO.
```js
'ambience.ch5': { variants: 1, loop: 20, layers: [{ tone: 'sine', hz: 110, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.4, lfo: { hz: 0.05, depth: 0.7 } }, { tone: 'sine', hz: 165, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.15, lfo: { hz: 0.1, depth: 0.6 } }, { noise: 'white', filter: 'highpass', hz: 6000, attack: 0.001, hold: 21.2, decay: 0.1, gain: 0.06, lfo: { hz: 0.25, depth: 0.8 } }] },
```

- 앰비언스를 바꿔도 피크 정규화는 그대로라, **크기 문제(§1 #3)는 레시피로 풀리지 않는다.** 믹서 쪽 수준을 재서 낮춰야 한다(§8, `cue-sheet.md` §5.2).

### 5.4 C — 유지

`hit.critical`, `enemy.stunned`, `boss.kill`, `player.down`, `cast.railSpear`, `cast.boneMortar`, `cast.mirrorClone`, `draft.*` 5개, `run.upgrade`, `run.levelUp`, `draft.sting`, `ui.cancel`, `ui.deny`, `enemy.kill.eclipse`, `boss.dash`, `boss.rings`, `boss.clones`.

- 반복 피로: 변형 2개짜리 보스 패턴음이 1~5초마다 몇 분씩 난다. 변형 수를 늘리면 뒤의 모든 큐 파일이 바뀌므로 이번 규칙(S2: 변형 수 유지)에서는 하지 않는다. 믹서의 재생 속도 흔들림 ±4%(`mixer.ts:24`)가 덜어 준다.

## 6. 새 큐 제안 (경고 가족과 빠진 사건)

새 레시피는 **목록 끝**(`ambience.ch5` 뒤)에 아래 순서로 붙인다. 그래야 기존 114파일이 바이트 단위로 그대로다. 단, 팩 테스트가 팩의 큐와 큐 표가 정확히 같기를 요구하므로(`src/game/audio/soundPack.test.ts:11`), **메인 세션이 먼저 `soundCues.ts`에 큐를 더한 뒤** 레시피를 붙여 굽는다.

| 순서 | 큐 | 무엇 | 언제 (이벤트, §7) | 큐 표 제안 (`cue(bus, priority, maxVoices, spacing, [Hz, s, osc, gain], group)`) |
|---|---|---|---|---|
| 1 | `warn.ranged` | 원거리 적 조준: '딱딱' 두 번 | 조준 시작(0.44초 전) | `cue('sfx', 5, 2, 0.12, [3000, 0.03, 'triangle', 1.2])` |
| 2 | `warn.boss` | 보스 준비: '딱딱딱' 세 번 오르기 + 바닥 울림 | 돌진 준비, 예고 패턴 무장(0.44~0.62초 전) | `cue('sfx', 5, 1, 0.25, [2900, 0.05, 'triangle', 1.3])` |
| 3 | `warn.zone` | 위험지형 예고: 스윽 긁고 '딱' | 광폭화 침묵 지대(0.8초 전) 등 지형 예고 | `cue('sfx', 5, 2, 0.15, [3200, 0.06, 'triangle', 1.2])` |
| 4 | `boss.phase` | 페이즈 전환: 먹 덩어리가 갈라진다 | `boss/phase` | `cue('sfx', 5, 1, 0, [110, 0.2, 'sawtooth', 1.3])` |
| 5 | `run.clear` | 클리어: 낙관 찍기 + 빈 5도 A–E | 스테이지 클리어 | `cue('sfx', 5, 1, 0, [440, 0.3, 'triangle', 1.0])` |
| 6 | `hazard.trap` | 덫에 걸림: 올가미 조임 | 플레이어가 덫을 밟음 | `cue('sfx', 3, 2, 0.08, [1600, 0.03, 'square', 0.8])` |
| 7 | `cast.eclipseStep` | 일식 보법: 그림자를 딛고 한 바퀴 벰 | `skill/cast` eclipseStep | `cue('sfx', 1, 2, 0.03, [90, 0.06, 'sine'])` |

- 원거리 둘, 보스 셋: '딱' 횟수로 누가 노리는지 들린다. 셋 모두 2.4~3.6 kHz 경고 차선에 있고, 다른 소리들은 이 차선을 비운다(§5).
- 보스 패턴 중 `shock`과 `eclipse`는 이미 예고 시점에 패턴음이 나므로(§4) `warn.boss`를 겹쳐 내지 않는다. 대신 그 패턴음에 경고 가족을 넣었다(§5.1·§5.2).
- 우선순위 5라 16보이스가 다 차도 낮은 소리를 빼앗아 울린다.

```js
// Warnings (V3): the amber family, played as a threat is telegraphed. Appended after the beds, so earlier files stay byte-identical.
'warn.ranged': { variants: 2, layers: [...clack(0, 3000, 0.9), ...clack(0.07, 3300, 0.7)] },
'warn.boss': { variants: 2, layers: [...clack(0, 2700), ...clack(0.09, 2900), ...clack(0.18, 3200), { noise: 'white', filter: 'lowpass', hz: 400, to: 900, attack: 0.15, decay: 0.15, gain: 0.5 }] },
'warn.zone': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 2400, to: 3400, q: 3, attack: 0.25, decay: 0.08, gain: 0.7 }, ...clack(0.32, 3300, 0.8)] },
// The moments that had no sound: a phase break, a clear, a trap, the eclipse step.
'boss.phase': { variants: 1, layers: [thud(110, 50, 0.4, 1), { noise: 'crackle', filter: 'bandpass', hz: 1100, q: 0.9, attack: 0.002, decay: 0.3, gain: 0.6 }, { noise: 'white', filter: 'lowpass', hz: 2000, to: 200, attack: 0.004, decay: 0.45, gain: 0.6 }] },
'run.clear': { variants: 1, layers: [thud(180, 120, 0.08, 0.9), tap(900, 0.04, 0.8), { tone: 'triangle', hz: 440, attack: 0.004, decay: 0.6, gain: 0.35, at: 0.12 }, { tone: 'triangle', hz: 659, attack: 0.004, decay: 0.6, gain: 0.3, at: 0.12 }] },
'hazard.trap': { variants: 2, layers: [{ noise: 'white', filter: 'bandpass', hz: 1600, q: 3, attack: 0.001, decay: 0.02, gain: 0.8 }, { noise: 'white', filter: 'bandpass', hz: 1100, q: 3, attack: 0.001, decay: 0.02, gain: 0.7, at: 0.05 }, thud(140, 90, 0.08, 0.6, 0.05)] },
'cast.eclipseStep': { variants: 2, layers: [{ noise: 'white', filter: 'lowpass', hz: 300, to: 1800, attack: 0.03, decay: 0.18, gain: 0.8 }, { noise: 'white', filter: 'highpass', hz: 5000, attack: 0.002, decay: 0.12, gain: 0.5, at: 0.08 }, thud(90, 50, 0.12, 0.6)] },
```

- 길이 어림: `warn.ranged` 0.12초, `warn.boss` 0.42초(가장 짧은 예고 0.44초 안에 끝난다), `warn.zone` 0.38초(가장 짧은 지형 예고 0.52초 안), `boss.phase` 0.47초(경직 0.45초와 같다), `run.clear` 0.75초.
- 선택: 시작 무기 먹선 바늘은 지금 무음이다. 자주 쏘므로 일부러 비워 둔 것일 수 있다. 넣는다면 아주 작은 실 바람(6→4.5 kHz, 0.03초)으로, 우선순위 1, 보이스 1, 간격 0.12초, 큐 음량 0.3. 들어 보고 정한다.

## 7. 제안 — 범위 밖 (이벤트·큐 표·프레젠테이션·믹서)

| # | 파일 | 바꿀 내용 | 이유 |
|---|---|---|---|
| P1 | `src/game/engine/events.ts`, `src/game/GameEngine.ts` | 새 이벤트 `enemy/windup { x, y, lead }`(원거리 조준 시작), `boss/windup { x, y, pattern, lead }`(돌진 준비 `:3483`, 돌진 문법, 예고 패턴 무장 `:3691`에서 한 번), `hazard/warning { kind, x, y, lead }`(광폭화 침묵 지대 `:556`). `shock`·`eclipse`는 이미 예고 시점에 `boss/attack`이 나므로 빼도 된다 | 경고음(§6)을 걸 곳이 없다. `telegraph/ring`은 무장 한 번에 여러 개 나와(`:3694`, 링마다) 경고음 트리거로 쓰기 어렵다 |
| P2 | `src/game/engine/events.ts:36` | `trap/sprung`에 `player: boolean` | 적이 밟아도 같은 이벤트라(`GameEngine.ts:3421`) 플레이어가 걸렸을 때만 `hazard.trap` |
| P3 | `src/game/presentation/presentation.ts` | 연결: `enemy/windup` → `warn.ranged`, `boss/windup` → `warn.boss`, `hazard/warning` → `warn.zone`, `boss/phase`(`:301`) → `boss.phase`, `trap/sprung`(player) → `hazard.trap`, `CAST_EFFECTS.eclipseStep`(`:79`)에 `sound: 'cast.eclipseStep'`. 스테이지 클리어 → `run.clear`(앱 또는 새 엔진 이벤트) | §6 |
| P4 | `src/game/presentation/presentation.ts:237` | 처치음의 `pitch`를 적 티어로: 소 1.0, 중 0.88, 대 0.76(재생 속도가 낮아지면 길어지기도 한다) | AUD-02의 "티어별 처치음"과 G13(무거울수록 낮고 길게)을 새 파일 없이. 지금은 티어와 관계없이 같다 |
| P5 | `src/content/data/soundCues.ts` | §6의 새 큐 7개 | §6 |
| P6 | `src/content/data/soundCues.ts:25` | `player.hurt` 큐 음량 1 → **1.3** | 피격음이 처치·시전(1.0)보다 커야 혼잡에서 들린다(V3) |
| P7 | `src/content/data/soundCues.ts:21`, `:54-57` | 처치음 간격 0.03 → **0.04**, 큐 음량 1 → **0.85** | 보이스 끊김(§2.4)과 가장 잦은 소리의 가림을 줄인다 |
| P8 | `src/content/data/soundCues.ts:44-45` | 줍기 보이스 3 → **2** | 줍기 둘이 6보이스까지 쓴다 |
| P9 | `src/game/audioPolicy.ts:46`, `mixer.ts:108` | 경고 큐(`warn.*`)는 좌우 폭 0.9(지금 모두 0.6). 화면 밖이면(`pan` 절댓값이 1에 붙음) 끝까지 패닝하되 음량과 고역은 그대로 둔다(로우패스로 "멀리"를 만들면 경고 대역이 깎인다) | 백로그 AUD-02의 "화면 밖 위협 인지용". 지금은 화면 끝과 화면 밖이 같게 들리고, 좌우 차이도 작다 |
| P10 | `src/game/audio/mixer.ts:26` | `AMBIENCE_LEVEL` 0.3을 재서 다시 정한다(어림 0.06~0.08), 또는 장별 수준 표 | §1 #3, `cue-sheet.md` §5.2 |
| P11 | 설정(`SettingsPanel.tsx`, 옵션) | 접근성 옵션 "경고음 크게"(`warn.*` +6 dB) | V5. 청각·주의 보조 |

## 8. 굽기 영향 (TEC-05)

- 지금: **53큐, 114파일, 3,025 KiB**(이번에 다시 구워 확인, 레시피 변경 없음). 앰비언스 5개가 1,723 KiB(8초 × 22,050 Hz × 16비트 모노 = 344.6 KiB씩).
- §5를 모두 반영하면: 바뀌는 파일은 그 큐의 변형 파일뿐이다. 길이가 조금씩 달라져 ±10 KiB 안팎.
- 앰비언스 20초 루프: 861 KiB씩, 5개 4,307 KiB(+2,584 KiB).
- 새 큐 7개 11파일: 약 170 KiB.
- 합계 어림 **약 5,780 KiB(5.6 MiB), 60큐, 125파일.** 앰비언스를 8초로 두면 약 3,200 KiB. 설치 에셋 예산(경고 200 MiB) 안이고, `assets/packs/` 아래라 초기 에셋 예산에는 잡히지 않는다.
- 메모리: 디코딩된 앰비언스는 48 kHz Float32 모노로 20초 = 3.8 MB. 한 번에 하나(장 회전 때 둘)만 산다.

## 9. 청취 체크리스트 (사람이 들어 볼 것)

개발 빌드(`npm run build:developer`)에서, 헤드폰과 **맥북 내장 스피커** 두 가지로. 음악·효과음 음량은 기본값.

| # | 장면 | 들려야 하는 것 |
|---|---|---|
| L1 | 1-1, 적 50마리 이상 혼잡 30초 | 내가 맞았을 때(피격)와 적이 쓰러질 때(처치)가 눈을 감고도 구별된다 |
| L2 | 1-5 잉크 도살자 돌진 | 지금: 준비 0.62초가 무음임을 확인. 제안 반영 뒤: '딱딱딱'이 준비 시작에 들리고, 피할 시간이 남는다 |
| L3 | 원거리 적이 있는 장면(투사체 포위망 목표 스테이지) | 화면 밖 원거리 적의 조준(반영 뒤 '딱딱')이 어느 쪽인지 들린다 |
| L4 | 4장 일반 스테이지 36% 초침 집행관(시계 패턴) | 지금: 앰비언스 똑딱과 `boss.clock`이 구별되는가. 반영 뒤: 구별된다 |
| L5 | 2장·5장에서 체력 30% 아래 | 심박이 맥북 스피커에서도, 앰비언스 위에서도 들린다 |
| L6 | 5-5 일식 원장 탄벽 | 예고 시작이 맥북 스피커에서 들린다(지금은 거의 안 들릴 것으로 본다) |
| L7 | 각 장 3분 | 앰비언스의 반복 주기(지금 8초)가 거슬리는가. 2장 C5 종이 8초마다 들리는가 |
| L8 | 각 장, 효과음과 음악 음량 같게 | 앰비언스가 효과음보다 크게 들리는가(수치로는 그렇다, §1 #3) |
| L9 | 타격만 나는 장면(허수아비처럼 큰 적 하나) | 가벼움·무거움·치명이 낮아지고 길어지고 커진다. 반영 뒤 가벼움(4.6 kHz)이 날카롭거나 쉭쉭거리지 않는가 |
| L10 | 줍기 콤보(자석으로 한꺼번에) | 콤보가 올라가도 경고음과 섞이지 않는다 |
| L11 | 2-10 용광의 입 3분 | 1.05초마다 나는 불길이 피곤한가 |
| L12 | 보스 광폭화(개발 치트로 시간 끝내기) | 광폭화가 음악 없이도 효과음만으로 알 수 있다 |
| L13 | 5장 무음 심판관 `null` | 반영 뒤: 소리가 "지워지는" 느낌이 나는가, 끊김이 틱처럼 들리지 않는가 |
| L14 | 메뉴에서 버튼 여러 번 | `ui.confirm`이 거슬리지 않는다(반영 뒤 G5) |
| L15 | 아무 장 10분 | 가장 먼저 거슬리는 소리는 무엇인가(반복 피로 순위) |
