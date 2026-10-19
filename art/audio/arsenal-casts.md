# 무기별 시전음 (K10 Q7)과 폭탄병 소리 점검 (S4)

R5 5단계 소리 발주(`docs/outsourcing/R5-orders.md` S4, `docs/art/briefs/arsenal-fx.md` §11 Q7)의 납품서와 메인 세션 반영 기록이다.

## 메인 세션 반영 (2026-10-19)

- 무기 44종의 새 레시피(`art/sfx-spec.mjs` 끝, 기존 레시피 그대로)와 77개 파일, 큐 표 44줄(`src/content/data/soundCues.ts`), presentation의 선택 규칙(`cast.<무기>` → 없으면 `cast.<계열>`)을 한 커밋에 넣었다. 기존 sfx-common 파일은 바이트가 같다(새 파일과 `pack.json`만 바뀜).
- `npm run measure:loudness`(메인 세션이 잼): 게임 재생 모멘터리 최대가 납품서 추정보다 4~6 dB 높았다. 기준을 '무기 소리 ≤ 그 계열 시전음 + 1 LU(계열 시전음이 없는 needleStorm·orbitScythes·eclipseStep은 `cast.fanKnives` −30.5 기준)'로 잡고, 넘은 네 큐는 큐 표 gain만 낮췄다(파일 그대로): ghostVolley 0.8 → 0.5(−30.4 → −34.5), starShards 0.8 → 0.5(−29.9 → −34.0), sunNeedles 0.9 → 0.6(−26.5 → −30.0), inkLightning 1 → 0.95(−28.8 → −29.3).
- 납품서 기준 ②(≤ `hit.heavy`)는 쓰지 않았다. `hit.heavy`(−32.4)가 이미 기존 계열 시전음(−30 안팎)보다 작아서, 맞추려면 무기 소리만 기존 시전음보다 작아진다. 새 시전음은 −38.6(inkDrizzle)~−28.4(tarJar)로 기존 시전음(−34.8~−24.2) 범위 안이다.
- S4(심지·폭발 레시피 수정, 심지 해체 때 소리 끊기)는 이 커밋에 넣지 않았다. 아래 §1이 제안이다.

## 소리 납품서 S4·K10Q7

**먼저 알아 둘 것**
- `npm run measure:loudness`는 scope-guard가 막았습니다. sound-designer에게 허용된 명령 목록에 없습니다. 그래서 아래 라우드니스 값은 **실측이 아닙니다**. 레시피 수치로 계산한 추정입니다.
  - 계산 방식: 레이어별 에너지, 피크 정규화 0.9, K-가중 근사, 400 ms 모멘터리.
  - 오차: 절대값 ±4 dB, 같은 계산끼리 비교한 상대값 ±2 dB. AUD-05의 실측 중앙값과 견주면 이 계산은 약 5 dB 낮게 나오는 쪽으로 치우칩니다.
  - 메인 세션이 측정 한 번으로 확인해 주세요(§3.3에 합격 기준).
- `test:unit`은 345개 중 1개가 실패합니다. 새 큐 44개가 팩에는 있는데 큐 표(`soundCues.ts`)에는 아직 없어서 `soundPack.test.ts:10`이 막는 것입니다. §4의 큐 표 제안을 넣으면 통과합니다. 팩과 큐 표는 **같은 커밋**에 넣어 주세요.

### 1. S4 점검: `bomber.fuse`·`bomber.blast`

**판정**
- 심지는 "고쳐야 함"입니다. 카운트다운은 들리지만, 정보가 없는 쉭 소리가 소리 전체를 차지하고 경고 계열 소리도 아닙니다.
- 폭발은 "통과"입니다. 흐름 위로 튀지 않습니다. 작은 수정을 권합니다.

| | 지금 레시피 | 추정 수치 | 판정 |
|---|---|---|---|
| 심지 1.15초 | 4.2 kHz 이상 쉭 소리(gain 0.3)가 0.95초 동안 같은 크기로 이어짐. 사각파 틱 4개(1200→1980 Hz)가 0, 0.45, 0.75, 0.95초 | 파일 모멘터리 최대 약 −10.7 LUFS, 게임 재생(cue gain 0.7) 약 **−22 LUFS**. 기준 `cast.fanKnives`보다 약 +13 LU. 동시 3개면 약 −17. 틱 에너지가 쉭 소리보다 약 15 dB 낮음 | 틱 간격이 0.45→0.30→0.20초로 줄고 음이 올라가서 "곧 터진다"는 들림. 그러나 ① 쉭 소리가 변하지 않아 "타들어 간다"는 느낌이 약함 ② 정보 없는 쉭 소리가 AUD-05 §5 효과음 흐름(버스 통합 −26~−24.6, 모노 환산 약 −29~−27.6)보다 6~7 LU 위에 1.15초 머묾 ③ 틱이 호박 계열(딱따기, 2.4~3.6 kHz)이 아님 ④ 쉭 소리가 4.6 kHz 약타와 5.2 kHz 처치 섬유음을 덮음 |
| 폭발 0.53초 | 저역통과 노이즈 2400→180 Hz, 사인 90→38 Hz(gain 0.9), 2.4 kHz 이상 크래클(gain 0.45) | 게임 재생(cue gain 1.4) 약 **−30 LUFS**로 효과음 중앙값과 비슷. 한 소리의 피크는 버스에서 −6.3 dBFS(마스터 0.8 뒤 −8.2)로 효과음 중 가장 높은 쪽. 3개가 겹치면 약 −0.6 dBFS라 리미터(−3)가 잡음 | 흐름 위로 과하게 튀지 않음. 다만 ① 피크 여유의 대부분을 90→38 Hz 사인이 써서 노트북 스피커에서는 몸통이 거의 안 들림 ② 크래클이 경고 대역에 0.22초 머묾 ③ LUFS로는 심지가 폭발보다 약 8 LU 큼(뒤바뀜) |

**제안 diff**: 승인 뒤 반영합니다. `variants` 수는 그대로라 바뀌는 파일은 `bomber.fuse-0/1`과 `bomber.blast-0/1/2`뿐입니다.

```diff
-  'bomber.fuse': { variants: 2, layers: [{ noise: 'white', filter: 'highpass', hz: 4200, attack: 0.02, hold: 0.95, decay: 0.15, gain: 0.3 }, ...[0, 0.45, 0.75, 0.95].map((at, index) => ({ tone: 'square', hz: 1200 + index * 260, attack: 0.001, decay: 0.03, gain: 0.35, at }))] },
+  // The fuse burns: a paper sizzle that brightens and swells toward the blast, under five amber clacks that speed up.
+  'bomber.fuse': { variants: 2, layers: [{ noise: 'crackle', filter: 'highpass', hz: 3800, to: 6000, attack: 0.6, hold: 0.35, decay: 0.15, gain: 0.2 }, { noise: 'white', filter: 'bandpass', hz: 1400, to: 2200, q: 1.2, attack: 0.9, hold: 0.05, decay: 0.15, gain: 0.12 }, ...[0, 0.45, 0.75, 0.95, 1.07].flatMap((at, index) => clack(at, 2500 + index * 200, 0.7 + index * 0.075))] },
-  'bomber.blast': { variants: 3, layers: [{ noise: 'white', filter: 'lowpass', hz: 2400, to: 180, attack: 0.002, decay: 0.5, gain: 1 }, thud(90, 38, 0.4, 0.9), { noise: 'crackle', filter: 'highpass', hz: 2400, attack: 0.001, decay: 0.22, gain: 0.45 }] },
+  'bomber.blast': { variants: 3, layers: [{ noise: 'white', filter: 'lowpass', hz: 2400, to: 180, attack: 0.002, decay: 0.5, gain: 1 }, thud(110, 45, 0.4, 0.7), { tone: 'triangle', hz: 220, to: 90, attack: 0.002, decay: 0.25, gain: 0.35 }, { noise: 'crackle', filter: 'highpass', hz: 4200, attack: 0.001, decay: 0.22, gain: 0.45 }] },
```

- 큐 표도 함께 바꿉니다: `'bomber.fuse'`의 gain을 0.7에서 **1.0**으로.
- 기대 효과(추정)
  - 심지: 게임 재생 약 −32 LUFS로 내려갑니다. 정보는 딱따기 5번이 맡고, 간격은 0.45/0.30/0.20/0.12초입니다.
  - 폭발: 약 −28~−29 LUFS로 오르고, 심지보다 4~5 LU 커집니다.
  - 경고 대역은 폭발 쪽에서 비워집니다.

**제안(코드)**: 심지가 다 타기 전에 폭탄병을 처치하면(해체) 심지 소리가 끝까지 울려서 거짓 경고가 됩니다.
- 믹서가 voice id를 돌려주게 하고 `stop(id)`를 더합니다.
- presentation은 무장한 폭탄병이 처치되면 그 voice를 끊습니다.
- 파일: `src/game/audio/mixer.ts`, `src/game/audioPolicy.ts`(`SoundOutput`), `src/game/presentation/presentation.ts`.

### 2. 무기별 시전 소리 (K10 Q7)

**바꾼 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/sfx-spec.mjs`: `bomber.blast` 뒤에 새 레시피 44개를 붙였습니다(`arsenal.ts` 순서). 기존 레시피는 글자 하나 바꾸지 않았습니다.
- 굽기 결과: `/Users/kyuukkang/CT_AX/07.playground/public/assets/packs/sfx-common/`에 새 WAV 77개, `pack.json` 갱신.

**공통 원칙**
- 주 에너지는 2.4~3.6 kHz 경고 대역 밖에 둡니다.
- 딱따기·처치 찢김·방패 쨍·줍기 똑과 같은 꼴은 피했습니다.
- 변형 수: 자주 쏘는 무기는 2개, 재사용이 1초 이상인 무기는 1개입니다.
- lob의 시전 소리는 **던지는 소리**입니다. 착탄(`area/blast`)에는 지금 소리가 없습니다.

| 계열(기준 큐) | 무기 → 큐 | 변형·길이 | 소리 |
|---|---|---|---|
| needleStorm(기준 큐 없음, 지금 무음) | inkDarts → `cast.inkDarts` | 2·0.09s | 짧은 다트 두 발 "틱-틱"(1.9/1.65 kHz) + 나무 촉 |
| | sealArrows → `cast.sealArrows` | 2·0.15s | 활시위 저음(210→150 Hz) + 무거운 화살대 바람 + 도장 머리 툭 |
| | frostNeedles → `cast.frostNeedles` | 2·0.09s | 유리 같은 서리 울림(4.4/5.9 kHz) + 서릿발 쉭 |
| | thunderNeedles → `cast.thunderNeedles` | 2·0.1s | 1.5 kHz 대역 전기 크래클 + 낮은 웅 소리 + 짧은 지직 |
| | headsmanDarts → `cast.headsmanDarts` | 2·0.17s | 큰 외날의 낮은 금속 쇳소리 + 620 Hz 칼날 울림 |
| | inkBloom → `cast.inkBloom` | 2·0.14s | 먹이 꽃처럼 번지는 둥근 "뿡" + 먹 방울 두 번 |
| | thornHalo → `cast.thornHalo` | 2·0.11s | 덩굴 휘두름 + 가시 네 개가 툭툭 튐 |
| | sunNeedles → `cast.sunNeedles` | 1·0.18s | 솜 방석 퍽 + 바늘 6개가 고음으로 흩어지는 쨍 |
| | inkDrizzle → `cast.inkDrizzle` | 2·0.05s | 젖은 먹 방울 "픗픗"(가장 짧고 담백) |
| | smokeTail → `cast.smokeTail` | 2·0.17s | 뒤로 피어나는 연막 "푸슉" |
| | gravePins → `cast.gravePins` | 2·0.13s | 뒤로 나는 바람 + 돌에 핀 박히는 소리 세 번 |
| | trackingSeals → `cast.trackingSeals` | 2·0.11s | 실이 풀리며 올라가는 소리 + 작은 도장 톡 |
| | bossbane → `cast.bossbane` | 1·0.17s | 작살의 낮은 퉁 + 거친 밧줄 풀림 + 미늘 반짝 |
| fanKnives(`cast.fanKnives`) | brushQuills → `cast.brushQuills` | 2·0.1s | 부드러운 깃털 쉭 + 펜촉 긁힘 |
| | twinBlades → `cast.twinBlades` | 2·0.16s | 도는 날의 "웅웅"(28 Hz 맥동) + 쇠 울림 두 번 |
| | paperStorm → `cast.paperStorm` | 2·0.18s | 종이가 펄럭이며 감겨 올라가는 소용돌이 |
| | pinHail → `cast.pinHail` | 2·0.05s | 핀·우박 알갱이 짤랑(가장 짧음) |
| | tailGuard → `cast.tailGuard` | 2·0.11s | 뒤로 감기는 바람 + 낮은 날밑 쨍(방패 막힘음과 다른 음높이) |
| | crowFeathers → `cast.crowFeathers` | 2·0.14s | 날갯짓 "푸덕-푸덕" + 깃 가장자리 |
| mirrorClone(`cast.mirrorClone`) | ghostVolley → `cast.ghostVolley` | 2·0.14s | 떠오르는 혼령 휘파람 + 숨결 |
| | starShards → `cast.starShards` | 2·0.09s | 종이 별이 바삭 깨지는 소리 + 조각 반짝 |
| | huntersMarks → `cast.huntersMarks` | 2·0.11s | 다트 탁 + 종이 패 팔랑 + 겨냥이 잠기며 올라가는 음 |
| chainSpark(`cast.chainSpark`) | inkLightning → `cast.inkLightning` | 2·0.26s | 위에서 꽂히는 번개 딱 + 먹 우르릉 |
| | thunderclap → `cast.thunderclap` | 1·0.32s | 손뼉 짝 + 천둥 굴림 |
| | sparkThread → `cast.sparkThread` | 2·0.13s | 실 튕김 + 고음 불티 지글 |
| | stormThread → `cast.stormThread` | 2·0.17s | 돌풍 + 꼬인 전기 크래클 + 낮은 웅 소리 |
| | frostChainlet → `cast.frostChainlet` | 2·0.11s | 사슬 고리 세 번 철컥(엇갈린 배음) + 서리 |
| boneMortar(`cast.boneMortar`) | brushDownpour → `cast.brushDownpour` | 2·0.12s | 젖은 붓 두 번 "착착" + 둔한 몸 |
| | fallingScroll → `cast.fallingScroll` | 1·0.2s | 축봉 쿵 + 나무 딱 + 종이 펄럭 |
| | inkPulse → `cast.inkPulse` | 2·0.22s | 낮은 먹 파동 "웅" + 퍼지며 올라가는 바람 |
| | inkPots → `cast.inkPots` | 2·0.15s | 던짐 바람 + 백자 뚜껑 쨍 |
| | clusterPots → `cast.clusterPots` | 2·0.13s | 작은 단지 세 개가 차례로 짤랑 + 던짐 |
| | meteorBrush → `cast.meteorBrush` | 1·0.31s | 하늘로 치솟는 굉음(저역이 열림) + 붓털 지글 |
| voidMine(`cast.voidMine`) | seventhSeal → `cast.seventhSeal` | 1·0.16s | 도장 세 번 꾹꾹꾹(450 Hz 나무) + 둔한 몸 |
| | silenceBell → `cast.silenceBell` | 1·0.42s | 작은 손종 두 번 땡(880 Hz, 추 소리) → 고요한 숨 |
| | tarJar → `cast.tarJar` | 1·0.15s | 묵직한 타르 "꿀렁꿀렁" + 무거운 던짐 |
| blackSun(`cast.blackSun`) | frostRing → `cast.frostRing` | 2·0.24s | 서리가 맺히는 고음 크래클 + 유리 부풂 + 찬 저음 |
| railSpear(`cast.railSpear`) | inkLance → `cast.inkLance` | 2·0.2s | 찌름 쉭 + 잎 창날 쨍 + 물러남 |
| | crossStrokes → `cast.crossStrokes` | 1·0.13s | 종이를 네 번 연달아 찢음(음높이가 매번 다름) + 붓 몸 |
| | judgmentLine → `cast.judgmentLine` | 1·0.27s | 먹줄 튕기기: 탁 + 팽팽한 줄 울림(200/400 Hz) |
| frostLine(`cast.frostLine`) | wideBrush → `cast.wideBrush` | 2·0.19s | 넓은 붓질 쓸기 + 붓털 결 |
| orbitScythes(기준 큐 없음) | inkOrbit → `cast.inkOrbit` | 2·0.13s | 한 바퀴 도는 혜성 "휘-익"(올라갔다 내려옴) |
| eclipseStep(기준 큐 없음) | wardRing → `cast.wardRing` | 2·0.11s | 꼰 밧줄 삐걱 + 퉁 튕김 + 팽팽한 탁 |
| | eclipseHalo → `cast.eclipseHalo` | 1·0.27s | 낮게 올라가는 빈 회오리 + 리본 펄럭 |

### 3. 굽기·측정 결과

#### 3.1 굽기
- `npm run build:sfx`
  - 전: `55 cues, 119 files, 3189 KiB`
  - 후: `99 cues, 196 files, 3681 KiB`
- 더한 양은 **큐 44개, 파일 77개, +492 KiB**로 1 MB 안입니다. 그래서 계열별로 묶는 안은 필요 없습니다.
- 가장 긴 파일은 `cast.silenceBell-0.wav` 0.42초입니다(afinfo). 0.25초를 넘는 것은 silenceBell, thunderclap 0.32, meteorBrush 0.31, judgmentLine 0.27, eclipseHalo 0.27, inkLightning 0.26입니다. 모두 재사용 0.6초 이상의 드문 무기입니다.

#### 3.2 기존 파일이 바뀌지 않았는지
- 근거는 구조입니다.
  - 변형 시드는 변형마다 1씩 오르고, 새 레시피는 모두 기존 55개 뒤에 있습니다.
  - 기존 레시피의 텍스트와 `variants` 수는 그대로입니다.
  - 굽기는 바이트 단위로 재현됩니다(`build-sfx.mjs` 머리 주석).
- 그래서 기존 119개 파일은 바이트가 같아야 합니다. 바뀐 것은 새 `cast.<weapon>-N.wav` 77개와 `pack.json`뿐이어야 합니다.
- 저는 git과 해시 명령을 쓸 수 없어서 직접 대조하지 못했습니다. 메인 세션이 `GIT_DIR=.repo-git GIT_WORK_TREE=. git status --porcelain public/assets/packs/sfx-common`로 확인해 주세요. 기대 결과는 `M pack.json`과 `??` 새 파일뿐입니다.

#### 3.3 테스트
| 명령 | 결과 |
|---|---|
| `node --test src/game/audioPolicy.test.ts src/game/audio/*.test.ts` | 54개 중 통과 53, 실패 1 |
| `npm run test:unit` | 345개 중 통과 344, 실패 1 |

- 실패는 둘 다 같은 하나입니다: `soundPack.test.ts:10` "names no cue the game does not have". 팩에 새 큐 44개가 있고 `CUES`에는 없어서입니다.
- "pack files are 16-bit mono WAV normalized…"는 통과합니다.

#### 3.4 라우드니스 (추정)
게임 재생값 = 파일 + 20·log10(gain × 0.3856).

| 큐 | 파일 모멘터리 최대 | 제안 gain | 게임 재생 | 기준 fanKnives 대비 |
|---|---:|---:|---:|---:|
| cast.fanKnives (기준) | −27.0 | 1.0 | −35.3 | 0 |
| cast.boneMortar (기준) | −25.0 | 1.0 | −33.3 | +2.0 |
| enemy.kill (참고) | −33.3 | 1.0 | −41.6 | −6.3 |
| cast.silenceBell | −22.3 | 0.6 | −35.0 | +0.3 |
| cast.eclipseHalo | −23.1 | 0.7 | −34.5 | +0.8 |
| cast.meteorBrush | −24.2 | 0.8 | −34.4 | +0.9 |
| cast.judgmentLine | −25.6 | 0.9 | −34.8 | +0.5 |
| cast.inkPulse | −26.7 | 1.0 | −35.0 | +0.3 |
| cast.frostRing | −27.7 | 0.8 | −37.9 | −2.6 |
| cast.smokeTail / frostNeedles | −27.9 | 0.7 | −39.3 | −4.0 |
| cast.inkLightning | −30.0 | 1.0 | −38.3 | −3.0 |
| cast.paperStorm | −30.1 | 0.8 | −40.3 | −5.0 |
| cast.thunderclap | −31.5 | 1.0 | −39.8 | −4.5 |
| cast.inkDrizzle (가장 조용) | −37.4 | 0.7 | −48.8 | −13.5 |

- 나머지는 0.1초 안팎의 짧은 소리 하나여서 기준보다 −3~−8 LU 아래로 봅니다.
- 판단: 새 시전음은 모두 기준 시전음 +1 LU 안이고, AUD-05 §5 흐름(모노 환산 −29~−27.6)보다 6 LU 이상 아래입니다. 계산이 5 dB 낮게 치우쳤다고 쳐도 마찬가지입니다.
- 메인 세션이 `npm run measure:loudness`로 확인할 합격 기준:
  - ① 새 `cast.*`의 게임 재생 모멘터리 최대 ≤ 기준 `cast.*` 최대 + 1 LU
  - ② 같은 값 ≤ `hit.heavy`의 값
  - ③ S4 반영 뒤 `bomber.fuse` ≤ `bomber.blast` − 3 LU
- 벗어나는 큐는 큐 표의 gain으로만 맞추면 됩니다. 레시피를 바꾸지 않으므로 파일도 바뀌지 않습니다.

### 4. 큐 표 제안 (메인 세션 반영용)

`src/content/data/soundCues.ts`의 `bomber.blast` 뒤에 넣습니다.

```ts
  // SYS-15 arsenal casts (K10 Q7): each weapon's own cast; presentation falls back to cast.<look> without one. Priority 1
  // like the look casts, so warnings and hits always win a voice. No shared group: castOrder fires every ready weapon in
  // one tick, and a group spacing would always silence the ones later in the table. The sprays and the orbit are spaced.
  'cast.inkDarts': cue('sfx', 1, 2, 0.03, [820, 0.025, 'triangle', 0.8]),
  'cast.brushQuills': cue('sfx', 1, 2, 0.03, [1300, 0.03, 'triangle', 0.8]),
  'cast.sealArrows': cue('sfx', 1, 2, 0.03, [210, 0.05, 'triangle', 0.9]),
  'cast.frostNeedles': cue('sfx', 1, 2, 0.03, [1500, 0.03, 'sine', 0.7]),
  'cast.thunderNeedles': cue('sfx', 1, 2, 0.03, [180, 0.035, 'sawtooth', 0.8]),
  'cast.twinBlades': cue('sfx', 1, 2, 0.03, [1050, 0.04, 'triangle', 0.8]),
  'cast.ghostVolley': cue('sfx', 1, 2, 0.03, [1300, 0.05, 'sine', 0.8]),
  'cast.headsmanDarts': cue('sfx', 1, 2, 0.03, [620, 0.05, 'triangle', 0.9]),
  'cast.paperStorm': cue('sfx', 1, 2, 0.03, [900, 0.05, 'triangle', 0.8]),
  'cast.inkBloom': cue('sfx', 1, 2, 0.03, [330, 0.04, 'sine', 0.8]),
  'cast.thornHalo': cue('sfx', 1, 2, 0.03, [1720, 0.025, 'triangle', 0.8]),
  'cast.starShards': cue('sfx', 1, 2, 0.03, [1400, 0.035, 'triangle', 0.8]),
  'cast.sunNeedles': cue('sfx', 1, 1, 0.05, [1600, 0.04, 'sine', 0.9]),
  'cast.inkDrizzle': cue('sfx', 1, 1, 0.14, [1300, 0.015, 'triangle', 0.7]),
  'cast.pinHail': cue('sfx', 1, 1, 0.14, [1800, 0.012, 'sine', 0.7]),
  'cast.tailGuard': cue('sfx', 1, 2, 0.03, [840, 0.03, 'triangle', 0.8]),
  'cast.smokeTail': cue('sfx', 1, 2, 0.03, [500, 0.05, 'sine', 0.7]),
  'cast.gravePins': cue('sfx', 1, 2, 0.03, [300, 0.035, 'triangle', 0.8]),
  'cast.trackingSeals': cue('sfx', 1, 2, 0.03, [700, 0.03, 'triangle', 0.8]),
  'cast.huntersMarks': cue('sfx', 1, 2, 0.03, [600, 0.035, 'triangle', 0.8]),
  'cast.crowFeathers': cue('sfx', 1, 2, 0.03, [400, 0.04, 'triangle', 0.8]),
  'cast.bossbane': cue('sfx', 1, 1, 0.05, [110, 0.06, 'sine', 1]),
  'cast.inkLightning': cue('sfx', 1, 2, 0.03, [95, 0.06, 'sawtooth', 1]),
  'cast.brushDownpour': cue('sfx', 1, 2, 0.03, [160, 0.04, 'triangle', 0.9]),
  'cast.fallingScroll': cue('sfx', 1, 1, 0.05, [140, 0.07, 'sine', 1]),
  'cast.seventhSeal': cue('sfx', 1, 1, 0.05, [150, 0.05, 'triangle', 1]),
  'cast.inkPulse': cue('sfx', 1, 1, 0.05, [85, 0.07, 'sine', 1]),
  'cast.frostRing': cue('sfx', 1, 1, 0.05, [1050, 0.06, 'sine', 0.8]),
  'cast.thunderclap': cue('sfx', 1, 1, 0.05, [110, 0.08, 'sawtooth', 1]),
  'cast.silenceBell': cue('sfx', 1, 1, 0.05, [880, 0.12, 'sine', 0.6]),
  'cast.inkPots': cue('sfx', 1, 2, 0.03, [1720, 0.03, 'triangle', 0.8]),
  'cast.clusterPots': cue('sfx', 1, 2, 0.03, [2050, 0.025, 'triangle', 0.8]),
  'cast.tarJar': cue('sfx', 1, 1, 0.05, [220, 0.05, 'sine', 0.9]),
  'cast.meteorBrush': cue('sfx', 1, 1, 0.05, [70, 0.1, 'sawtooth', 0.8]),
  'cast.sparkThread': cue('sfx', 1, 2, 0.03, [1400, 0.025, 'triangle', 0.8]),
  'cast.stormThread': cue('sfx', 1, 2, 0.03, [130, 0.05, 'sawtooth', 0.9]),
  'cast.frostChainlet': cue('sfx', 1, 2, 0.03, [980, 0.035, 'triangle', 0.8]),
  'cast.inkLance': cue('sfx', 1, 2, 0.03, [1660, 0.04, 'triangle', 0.9]),
  'cast.wideBrush': cue('sfx', 1, 2, 0.03, [700, 0.05, 'triangle', 0.9]),
  'cast.crossStrokes': cue('sfx', 1, 1, 0.05, [1500, 0.04, 'triangle', 0.9]),
  'cast.judgmentLine': cue('sfx', 1, 1, 0.05, [200, 0.1, 'triangle', 0.9]),
  'cast.inkOrbit': cue('sfx', 1, 1, 0.1, [1000, 0.03, 'triangle', 0.6]),
  'cast.wardRing': cue('sfx', 1, 2, 0.03, [130, 0.05, 'triangle', 0.9]),
  'cast.eclipseHalo': cue('sfx', 1, 1, 0.05, [130, 0.08, 'sine', 0.7]),
```

**선택 규칙**: `src/game/presentation/presentation.ts`의 `skill/cast`에서, 무기 큐가 있으면 그것을, 없으면 지금처럼 계열 큐를 씁니다. 흔들림과 burst는 계열 값을 그대로 둡니다. `isArsenal`은 `../arsenal.ts`에서 가져옵니다.

```ts
      case 'skill/cast': {
        this.playerCast = PLAYER_CAST_POSE_SECONDS;
        const cast = CAST_EFFECTS[lookOf(event.skillId)];
        if (cast?.burst) this.playerBurst = PLAYER_BURST_POSE_SECONDS;
        if (cast?.shake !== undefined) this.addShake(cast.shake);
        // K10 Q7: an arsenal weapon plays its own cast when the cue table has one, else its look's.
        const own = `cast.${event.skillId}`;
        const sound = isArsenal(event.skillId) && own in CUES ? (own as CueId) : cast?.sound;
        if (sound) this.play(sound, event.x);
        return;
      }
```

**규칙 요약**: `cast.<weaponId>` → 없으면 `cast.<look>` → 그것도 없으면 무음(needleStorm, orbitScythes, eclipseStep 계열의 핵심 스킬은 지금처럼 무음). 무기는 remaster 규칙에만 있으므로 classic 지문에는 영향이 없습니다.

**추가 제안**
- 이 문장에 맞춘 테스트를 하나 둡니다: "모든 `ARSENAL_IDS`에 `cast.<id>` 큐가 있다".
- `docs/ARCHITECTURE.md`의 Audio 절에 무기 큐 대체 규칙을 한 줄 적습니다.

### 5. 청취 체크리스트 (사람이 게임에서)

1. **같은 계열 구분**: 같은 계열 무기 둘을 함께 들고(예: boneMortar의 먹 파동과 먹단지, chainSpark의 불꽃실·폭풍실·서리 사슬) 눈을 감고 어느 무기인지 맞히는지.
2. **헷갈릴 짝**
   - 서리 사슬 ↔ 엽전 줍기
   - 먹 이슬비·핀 우박 ↔ 경험치 구슬 똑
   - 십자 획 ↔ 1장 처치 찢김
   - 꼬리 방패 ↔ 수비병 방패 막힘
   - 침묵의 종 ↔ 보스 rings
   - 일식 테 ↔ 5장 일식 보스·드론
3. **혼잡 장면**(적 200 + 무기 6종): 경고 딱따기(boss.intro, boss.eclipse)와 피격음이 묻히지 않는지. 시전음이 계속 깔려 피곤하지 않은지, 특히 지금까지 무음이던 needleStorm 계열 13종.
4. **연사**: 먹 이슬비·핀 우박을 공속 최대로 써서 "다다닥" 짜증이 없는지. 노트북 스피커에서 너무 작지 않은지(추정 −49 LUFS).
5. **lob**: 던지는 소리 뒤 0.55~1.0초 무음 착탄이 어색한지(§6의 착탄 큐 참고).
6. **S4 반영 뒤**: 심지 1.15초가 타들어 가며 빨라지다 터지는지. 폭발 몸통이 노트북에서 들리는지. 폭탄병 셋이 동시에 터질 때 리미터 펌핑이 거슬리지 않는지.

### 6. 알려진 한계와 필요한 것

- 소리를 들을 수 없고 측정 명령도 막혀 있습니다. 라우드니스는 모두 추정입니다.
- 합성 v0 자리표시 소리입니다. 녹음 라이브러리가 오면 같은 이름(`cast.<weaponId>-N.wav`)으로 바꾸면 됩니다.
- 22.05 kHz 모노라 9.9 kHz 위가 없습니다. 서리·반짝임은 6 kHz 근처가 위 끝입니다.
- 각성 기믹 소리는 범위 밖입니다. 각성한 무기도 같은 시전음을 냅니다.
- lob 착탄과 strike·nova 폭발(`area/blast`)에는 소리가 없습니다. 다음 발주로 `land.<weaponId>` 큐(lob 4종)를 권합니다.
- needleStorm, orbitScythes, eclipseStep 계열 16종은 지금 무음이었는데 이번에 소리가 생깁니다. 그만큼 전체 소리 밀도가 오릅니다. 우선순위 1이라 보이스가 꽉 차면 먼저 빠집니다.
- 필요한 것
  - `npm run measure:loudness` 실행(메인 세션).
  - 길게는 sound-designer 허용 명령에 `^npm run measure:loudness$`를 더하는 것을 검토해 주세요. 그러면 다음부터 제가 직접 잽니다.
  - 내려받기나 외부 도구는 필요 없습니다.
