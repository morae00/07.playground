# 소리 P2 큐 제안 (AUD-02, 2026-10-27)

sound-designer가 10-23 점검 보고서 P2-1, P2-3, P2-4와 `p1-mix.md`의 남은 일(`boss.shock` 변형 차)을 반영한 레시피의 큐 표 제안이다. 레시피는 `art/sfx-spec.mjs` 맨 끝(`warn.boss` 뒤)에 붙였다. 큐 표(`src/content/data/soundCues.ts`)에는 아직 없으므로 메인 세션이 아래 줄을 더해야 `soundPack.test.ts`가 다시 통과한다.

수준(LU) 목표는 `p1-mix.md`와 같은 "게임 재생 모멘터리 최대(모노)"이고, 흐름은 약 −29다. gain은 레시피 수치로 어림한 출발점이라 `npm run measure:loudness`로 재서 맞춘다.

## 새 큐 6개

| 큐 | 변형 | 길이(변형 0) | 이벤트 | 큐 표 제안 | 수준 목표 |
|---|---:|---:|---|---|---|
| `land.lob` | 3 | 0.20초 | `area/blast`, `lookOf(source)`가 lob 계열이거나 `boneMortar`이고 `!echo`일 때 | `cue('sfx', 1, 2, 0.05, [115, 0.08, 'sine', 0.9])` | `cast.boneMortar`와 ±1 LU. 흐름 아래 |
| `gimmick.echo` | 3 | 0.13초 | `area/blast`의 `echo`. 기믹 기절(P2-2)을 대신 낼 때도 이 큐 | `cue('sfx', 1, 2, 0.08, [600, 0.05, 'triangle', 0.5])` | 흐름 − 6 LU 이하(약 −35) |
| `hazard.trap` | 2 | 0.19초 | `trap/sprung`에서 걸린 것이 플레이어일 때(또는 새 `player/bound`) | `cue('sfx', 4, 1, 0.1, [1100, 0.03, 'triangle', 1.2])` | `player.hurt`(−28.55)와 ±1 LU |
| `boss.phase` | 1 | 0.49초 | `boss/phase` | `cue('sfx', 5, 1, 0, [110, 0.2, 'sawtooth', 1.3])` | −26~−25(보스 패턴 계열), `boss.intro`(−20.9)보다 아래 |
| `cast.eclipseStep` | 2 | 0.24초 | `CAST_EFFECTS.eclipseStep`의 `sound` | `cue('sfx', 1, 1, 0.05, [90, 0.06, 'sine', 0.9])` | `cast.blackSun`(−27.6) 안팎, 경고음(−26)보다 아래 |
| `run.clear` | 1 | 0.74초 | 앱 `onRoundClear` | `cue('sfx', 5, 1, 0, [440, 0.3, 'triangle', 1.0])` | 약 −24. `run.levelUp`보다 크지 않게 |

- **그룹**: 여섯 모두 간격 그룹이 없다. `boss.phase`를 `bossAttack` 그룹에 넣으면 같은 프레임의 패턴음과 서로 막는다. `land.lob`과 `gimmick.echo`도 시전음처럼 그룹을 두지 않는다. 이유는 `castOrder` 때문이다.
- **keep**: 모두 기본값이다. 경고가 아니므로 `keep: 'oldest'`가 필요 없다.
- **우선순위 근거**
  - `gimmick.echo`, `land.lob`, `cast.eclipseStep`은 1이다. 시전음 계열이라 경고·피격·타격에 늘 보이스를 내준다.
  - `hazard.trap`은 4다. 플레이어 상태가 바뀌는 정보라 `player.hurt`와 같은 자리에 둔다.
  - `boss.phase`와 `run.clear`는 5다. 드물고, 판이 바뀌는 순간이다.
- **jitter**: 기본(±4%)으로 둔다. `run.clear`는 음높이(A4·E5·A5)가 곡과 어울려야 하므로 `jitter: 0`을 권한다.

## 광폭화 2~4단계

새 레시피는 필요 없다. 기존 `boss.enraged`를 단계마다 아래 피치로 낸다.

| 단계 | 1 | 2 | 3 | 4 |
|---|---:|---:|---:|---:|
| 피치 | 1.0 | 1.12 | 1.26 | 1.41 |

- 단계 사이는 온음(12%)이다. 믹서 흔들림 ±4%(폭 8%)보다 넓어서, 흔들려도 이웃 단계와 겹치지 않는다.
- 피치가 오르면 소리가 짧아진다(0.8초 → 0.57초). 단계가 오를수록 급해지는 쪽이라 뜻과 맞다.
- 큐 음량은 그대로 둔다. 단계마다 키우려면 presentation의 재생 gain을 +1 dB씩 올리는 방법이 있다. 다만 믹서 API에 그런 인자가 있는지는 확인하지 않았다.

## 레시피를 바꾼 기존 큐 (변형 수 그대로)

`AMBIENCE_LEVELS`는 `src/game/audioPolicy.ts`에 있다. 메인 세션이 `npm run measure:loudness`로 ch1·ch4를 재고, 다른 장과 같은 게임 통합값(−37.0~−37.1)에 맞춰 다시 정한다. sound-designer는 측정 명령을 쓸 수 없다.

| 큐 | 바뀐 파일 | 바뀐 것 | 다시 잴 것 |
|---|---|---|---|
| `boss.shock` | `-0`, `-1` | 균열을 50 ms 붙잡고(hold), 에너지 대부분을 흔들림 없는 잡음 띠(1.9→0.9 kHz)가 나르게 했다. 무작위 크래클은 1 → 0.45로 줄였고, 딱따기는 ×1.3이다 | 변형 차(지금 1.7 LU)와 평균. 피크 대비 에너지가 늘어 같은 gain 1.4에서 +2~4 LU로 어림한다. 평균 −26.5에 맞도록 gain을 다시 정한다 |
| `ambience.ch1` | `-0` | 바스락: highpass 2600 → bandpass 1200 q0.8, gain 0.25 → 0.35. 8초 루프와 시각(1.3·3.9·6.2초)은 그대로 | `AMBIENCE_LEVELS['ambience.ch1']` |
| `ambience.ch4` | `-0` | 0.5초 사각파 똑딱 16개(1760/1320 Hz)를 없앴다. 대신 불규칙하게 멈추려는 삼각파 똑딱 6개를 넣었다. 시각은 1.2·1.47·1.78 / 4.6·4.95 / 6.7초이고, 음은 D6 1175·G5 784 Hz에 놋쇠 클릭(1.4 kHz)이 붙는다. 3.3초에 래칫 미끄러짐(1 kHz 클릭 4개)이 한 번 나고, 420 Hz 톱니 삐걱임 띠가 깔린다 | `AMBIENCE_LEVELS['ambience.ch4']` (지금 0.152) |

## 메인 세션 측정과 정한 값 (2026-10-27)

`npm run measure:loudness`의 '게임 재생 모멘터리 최대'(모노)다. 앰비언스는 '게임 재생 통합값'이다.

| 큐 | 제안 gain → 정한 값 | 측정 (변형별) | 목표 |
|---|---|---|---|
| `land.lob` | 0.9 → **1.2** | −30.2 / −30.7 / −29.8 | `cast.boneMortar`(−30.0 / −30.5) ±1 LU |
| `gimmick.echo` | 0.5 → **0.7** | −36.1 / −37.4 / −37.8 | 흐름(약 −29) − 6 LU 이하. 0.5에서는 −39~−41로 너무 작았다 |
| `hazard.trap` | 1.2 → **1.5** | −28.4 / −28.2 | `player.hurt`(−28.2) ±1 LU |
| `boss.phase` | **1.3** 그대로 | −25.9 | −26~−25 |
| `cast.eclipseStep` | 0.9 → **1.1** | −27.8 / −28.1 | `cast.blackSun`(−27.3) 안팎, −26 아래 |
| `run.clear` | 1.0 → **1.25** | −24.3 | 약 −24, `run.levelUp`(−20.7)보다 작게 |
| `boss.shock` | **1.4** 그대로 | −25.5 / −25.8 (변형 차 0.2 LU, 전 1.7) | 보스 패턴 계열(−25.0~−26.4) |
| `ambience.ch1` | `AMBIENCE_LEVELS` 0.122 → **0.107** | 통합 −37.06 | 다른 장 −37.0~−37.1 |
| `ambience.ch4` | `AMBIENCE_LEVELS` 0.152 → **0.096** | 통합 −37.07 | 〃 |

- 연결(presentation): `area/blast`의 `echo` → `gimmick.echo`. lob 무기나 `boneMortar`의 착탄 → `land.lob`. 새 `player/bound`(플레이어가 덫에 걸림) → `hazard.trap`. `boss/phase` → `boss.phase`. 새 `boss/enrageStep`(2~4단계) → `boss.enraged` 피치 1.12 / 1.26 / 1.41. 일식 보법 시전 → `cast.eclipseStep`. 앱의 스테이지 클리어 → `run.clear`.
- 점검 표의 재사용 둘도 연결했다: 공허 지뢰·검은 태양 붕괴 → 그 시전음 피치 0.85, 충격 지대 폭발 → `bomber.blast` 피치 1.2.
- 새 이벤트 둘은 리마스터 규칙에서만 나온다(`isolatedCosmeticIds`). 클래식 이벤트 흐름은 0.1.0 그대로다.
- 청취 확인(위 '청취 메모')은 아직이다.
