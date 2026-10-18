# K11 위험지형 — 납품·검수 기록

지시서: `docs/art/briefs/terrain-hazards.md`(B6, 631ec68). 킷: `art/concept-kit/k-hazards.js`, `API-hazards.md`.

## 1차 납품서 — 위험지형 납품 1: 공용 틀 + 불 + 오버레이

납품 1 범위(지시서 §8)를 마쳤습니다. 공용 틀, 불의 네 상태(ignite·burn·gutter·soot), 주인공 오버레이(back·front·embers), 적 발밑 불길(mob/front-12·19·28)입니다.
- 불 관련 검사(C1, C2a, C3, C4-fire, C6~C12)는 모두 통과했습니다. kit error 0, 기준 해시 그대로입니다.
- C7은 1·2·5줄 0건, 6줄 ok입니다. 3·4줄에 남은 33건은 전부 납품 2 항목(shock·null 경로 9, bind-back·bind-front 24)입니다.
- 미달·판단이 필요한 것은 네 가지입니다:
  - 달리기 큰 걸음 장에서 장화가 많이 가려집니다.
  - 그을음이 덮는 비율이 15~30%에 못 미칩니다.
  - 치마가 원의 맨 좌우에서 가까운 테에 조금 닿습니다.
  - 불티 먹 테가 1.5보다 얇습니다.

  아래 6장 A~D에 정리했습니다.

고친 파일은 둘뿐입니다. 다른 파일은 손대지 않았고(`k-env.js`의 `PN.env.hazard` 포함) 아무것도 내려받지 않았습니다.
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`(새 파일)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-hazards.md`(새 파일)

---

### 1. 납품 목록

| 파일 | 네임스페이스 | 내용 |
|---|---|---|
| `art/concept-kit/k-hazards.js` | `window.PN.hazards` | `version '1.0-d1'`, `K`, `kinds`, `groups`, `states`, `META`, `SPEC`, `jit`, `planned`, `parts`, `stamp`, `layout`, `paths`, `draw`, `overlay`, `_`(검사용) |
| `art/concept-kit/API-hazards.md` | — | 로드·호출·상태·조각 표·SPEC 표·layout 식·순서·LOD·예산·검사·지시서와 다르게 한 것·원화가 몫 |

- **조각**: 158장(fire 134, hero 12, mob 12), 박스 넓이 합 198,080 단위²다. 납품 2를 더하면 지시서 표상 301장, 약 39만이 된다.
- **draw 상태**: fire 4개(burn, ignite, gutter, soot).
- **overlay 층**: hero back·front·embers, mob front.
- **옵션**: `draw({r, ch, t, p, seed, lod, reduced, flash})`, `overlay({t, p, r, facing, reduced, lod})`. `flash`(섬광 세기 곱, 기본 1)는 새로 더했다.
- **이번 판의 목록**: `kinds`·`groups`·`states`에는 이번에 그리는 것만 넣었다(fire / fire·hero·mob). 7종 전체 계약은 `planned`에 있다.
- **납품 2 항목**(종류 6개, `bind-back`·`bind-front`)은 `console.warn` 후 `<g/>`를 돌려준다. layout은 `[]`, paths는 `{}`다.
- **기존 모듈**: 고치지 않았다. 기본 출력이 바뀐 것은 없다.

### 2. API 요약

- **좌표**
  - `draw` 원점 = 지형 중심 = 시뮬 (x, y)다. 판정 원 = `Hazard.radius`이고, 테 중심선이 r이다(V4). 원을 늘이지 않는다.
  - `overlay` 원점 = 발(판정 원 중심)이다. 오른쪽 보기로 그리고, `facing: -1`이면 x를 반전한다.
  - 몸은 회전하지 않는다. 불길은 좌우 반전(앵커 축)만 한다.
- **조각 박스·앵커·layer**: 지시서 §1.4와 같다. hero·mob 조각의 z만 `'body'`로 적었다.

  | 조각 | 박스 | 앵커 | 비고 |
  |---|---|---|---|
  | cluster s | 28×32 | 14,28 | |
  | cluster m | 36×44 | 18,39 | |
  | cluster l | 48×58 | 24,52 | |
  | skirt-a·b | 30×22 | 15,19 | |
  | skirt-low | 26×16 | 13,13 | |
  | char·char-cold | 44×22 | 22,11 | |
  | ember | 10×12 | 5,6 | |
  | smoke | 18×34 | 9,30 | |
  | hero back | 46×22 | 23,17 | body-back |
  | hero front | 42×24 | 21,18 | body-front |
  | mob 12 | 30×19 | 15,14 | body-front |
  | mob 19 | 40×22 | 20,17 | body-front |
  | mob 28 | 56×26 | 28,21 | body-front |

- **게임 표시 크기**: 1x 그대로이고 `scale: 1`을 @2x로 굽는다. 무더기 칠한 크기는 s 21×22.8, m 28.5×32.5, l 40×43.8(0번 장)이다.
- **id**: 납품 1 그림은 id를 쓰지 않는다(필터·패턴·클립 없음). 모든 그림이 채움이라 getBBox가 칠한 범위와 같다. 접두 카운터 `hzd<N>_`는 있고 되감지 않는다.

### 3. 검사 결과

모든 명령은 `node scripts/art-review-sheet.mjs …`로 돌렸다. 결과 폴더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`다.

- **C8**(시작 전 `k11-c8-unchanged-before`, 납품 직전 `k11-c8-unchanged`, 둘 다 같음):
  ```
  env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045
  ```
- **C11** `enemies --check`: 시작 전과 납품 전 모두 40장 `ok`, kit error 0이다.
- **C1** `k11-c1-all --check`: `ok`
- **C3** `k11-c3-fire-parts`, `k11-c3-hero-parts`, `k11-c3-mob-parts` (4배, `--check`): 모두 `ok`
- **C4-fire** `k11-c4-fire` (2배, `--check`): `ok`
- **C2a** (모두 `--check ok`)
  - 1x: `k11-c2a-ch1-fire` … `-ch5-fire`
  - 0.8x: `-ch1-fire-x08`
  - 2x: `-ch1-fire-x2`
  - 흑백: `-ch1-fire-gray`, `-ch5-fire-gray`
  - 색각: `-ch1-fire-deutan`, `-ch1-fire-protan` (C5 행렬)
- **C6** 원문: `bad colours=0 banned=0`
- **C7** 원문:
  ```
  1 stamps outside box-3: 0
  2 bases outside r-6: 0 | ground items over r-2: 0 | tips over far rim+6: 0 | over per-hazard cap: 0
  3 paths outside: 9 shock no cracks shock no cracks shock no cracks null no ghost
  4 overlays outside their rects: 24 bind-back@0f1 bind-back@0f-1 bind-back@0.1f1 bind-back@0.1f-1 bind-back@0.2f1 bind-back@0.2f-1
  5 hero ember paths through the face zone (outward drift): 0
  6 invalid calls ok
  ```
  3줄 9건은 shock 3 + null 6 경로이고, 4줄 24건은 bind 2층 × t 6개 × 방향 2개다. 모두 납품 2 항목이다. back·front·mob은 0건이다.
- **C9** 원문(지시서 명령 그대로, 4개씩 한 줄). slow·water·root·null·shock은 납품 2라서 빈 줄이다.
  ```
  fire:50:1 layout [["char-d",7.36,-22.66,1,0,"ground",1],["char-b",15.45,3.86,1,0,"ground",1],["skirt-low",-3.17,-38.59,1,0.177,"flame",2],["cluster-s-b",-3.74,-26.91,1,0.184,"flame",0]]
    [["skirt-a",-33.2,-22.51,1,0.712,"flame",2],["skirt-a",37.54,-6.13,1,0.403,"flame",2],["cluster-s-a",16.7,-3.51,1,0.423,"flame",0],["skirt-b",-39.39,0.08,0,0.951,"flame",2]]
    [["skirt-a",-25.51,31.82,1,0.486,"flame",2],["skirt-a",14.85,35.49,1,0.26,"flame",2],["skirt-b",-3.04,39.07,0,0.725,"flame",2]]
  fire:74:7 layout [["char-a",5.92,-44.64,1,0,"ground",1],["char-d",-45.07,-13.09,0,0,"ground",1],["char-b",-10.14,27.61,0,0,"ground",1],["skirt-low",-1.98,-62.81,0,0.135,"flame",2]]
    [["skirt-low",-20.5,-58.65,1,0.374,"flame",2],["cluster-m-a",-12.42,-37.43,1,0.155,"flame",0],["skirt-b",49.72,-37.32,1,0.065,"flame",2],["skirt-a",-62.46,-17.7,1,0.148,"flame",2]]
    [["cluster-m-b",-40.67,6.97,0,0.225,"flame",0],["skirt-b",59.23,19.45,0,0.301,"flame",2],["cluster-m-a",2.41,23.89,0,0.69,"flame",0],["skirt-b",-51.57,35.48,0,0.218,"flame",2]]
    [["skirt-b",51.97,37.26,0,0.766,"flame",2],["skirt-a",23.67,60.18,1,0.527,"flame",2],["skirt-a",-20.06,61.7,1,0.457,"flame",2],["skirt-b",-0.61,63.27,0,0.992,"flame",2]]
  fire:150:23 layout [["char-a",40.65,-108.6,1,0,"ground",1],["char-c",-61.03,-85.12,0,0,"ground",1],["char-b",93.63,-77.45,1,0,"ground",1],["char-a",13.37,-43.96,1,0,"ground",1]]
    [["char-d",-115.06,1.45,0,0,"ground",1],["char-b",37.12,33.14,0,0,"ground",1],["char-c",-76.56,39.01,0,0,"ground",1],["char-c",-13.54,97.31,0,0,"ground",1]]
    [["skirt-low",-25.03,-136.67,1,0.101,"flame",2],["skirt-low",54.13,-127.23,1,0.327,"flame",2],["skirt-b",77.07,-115.66,0,0.792,"flame",2],["skirt-b",-96.03,-100.13,0,0.171,"flame",2]]
    [["skirt-a",102.96,-95.73,0,0.553,"flame",2],["cluster-l-a",-7.7,-81.51,1,0.191,"flame",0],["skirt-a",-112.27,-80.28,1,0.41,"flame",2],["skirt-b",128.23,-54.15,0,0.018,"flame",2]]
    [["cluster-l-a",82.3,-40,1,0.384,"flame",0],["cluster-l-b",-64.34,-34.85,0,0.035,"flame",0],["cluster-l-a",15.12,-33.22,1,0.274,"flame",0],["skirt-a",138,-23.06,1,0.779,"flame",2]]
    [["skirt-a",-140.71,-5.26,1,0.184,"flame",2],["skirt-b",138.5,17.4,0,0.885,"flame",2],["cluster-l-a",46.43,41.98,0,0.869,"flame",0],["skirt-a",-133.33,43.01,0,0.719,"flame",2]]
    [["cluster-l-a",-35.15,46.51,0,0.809,"flame",0],["skirt-a",124.82,64.09,1,0.646,"flame",2],["skirt-b",-121.7,66.09,0,0.254,"flame",2],["skirt-b",105.5,90.38,1,0.111,"flame",2]]
    [["skirt-a",-88.01,109.87,1,0.493,"flame",2],["skirt-b",-65.48,122.8,0,0.028,"flame",2],["skirt-b",38.07,132.89,1,0.337,"flame",2],["skirt-a",-35.57,135.98,1,0.563,"flame",2]]
    [["skirt-b",13.06,139.23,0,0.802,"flame",2]]
  ```
  두 배로 키운 렌더(`k11-c9-readable-*`)로 한 번 더 대조했다. 이식 시험용 불티 벡터(`k11-ember-vectors`, [조각, x, y, 장]):
  - `_.emberSlots(74,7,0.3)` = `[ember-a,-13.46,-51.12,1] [ember-b,-41.52,-27.91,4] [ember-a,2.71,12.07,0] [ember-b,-27.59,-74.35,5] [ember-a,-38.53,-13.27,1]`
  - `_.heroEmberSlots(0.3)` = `[ember-a,-23.37,-38.83,5] [ember-b,-25.53,-45.63,3] [ember-a,24.51,-12.56,0] [ember-b,27.63,-52.16,5]`
- **C10** 원문(모두 ok):
  ```
  fire (ink a0.3): ch1 1.80 ch2 1.80 ch3 1.82 ch4 1.81 ch5 1.78 | ok
  water (ink a0.24): ch1 1.59 ch2 1.59 ch3 1.60 ch4 1.59 ch5 1.57 | ok
  trap (ink700 a0.5): ch1 2.37 ch2 2.37 ch3 2.42 ch4 2.39 ch5 2.31 | ok
  null (voidPaper a1): ch1 1.63 ch2 1.63 ch3 1.54 ch4 1.59 ch5 1.75 | ok
  soot (ink a0.16): ch1 1.35 ch2 1.35 ch3 1.36 ch4 1.35 ch5 1.34 | ok
  hero coat peak multiply a0.3: Y=0.620 ok
  hero coat trough multiply a0.12: Y=0.780 ok
  hero coat steady multiply a0.2: Y=0.705 ok
  ```
- **C12** 원문:
  ```
  frames=158 ok boxArea=198080 ok badDrive=0
  fire/cluster-s-a f6 loop@12 box28x32 a14,28 hazard/flame info
  fire/cluster-s-b f6 loop@12 box28x32 a14,28 hazard/flame info
  fire/cluster-m-a f6 loop@12 box36x44 a18,39 hazard/flame info
  fire/cluster-m-b f6 loop@12 box36x44 a18,39 hazard/flame info
  fire/cluster-l-a f6 loop@12 box48x58 a24,52 hazard/flame info
  fire/cluster-l-b f6 loop@12 box48x58 a24,52 hazard/flame info
  fire/cluster-s-a-ignite f4 prog 0.25s box28x32 a14,28 hazard/flame info
  fire/cluster-s-b-ignite f4 prog 0.25s box28x32 a14,28 hazard/flame info
  fire/cluster-m-a-ignite f4 prog 0.25s box36x44 a18,39 hazard/flame info
  fire/cluster-m-b-ignite f4 prog 0.25s box36x44 a18,39 hazard/flame info
  fire/cluster-l-a-ignite f4 prog 0.25s box48x58 a24,52 hazard/flame info
  fire/cluster-l-b-ignite f4 prog 0.25s box48x58 a24,52 hazard/flame info
  fire/cluster-s-a-gutter f4 prog 0.5s box28x32 a14,28 hazard/flame info
  fire/cluster-s-b-gutter f4 prog 0.5s box28x32 a14,28 hazard/flame info
  fire/cluster-m-a-gutter f4 prog 0.5s box36x44 a18,39 hazard/flame info
  fire/cluster-m-b-gutter f4 prog 0.5s box36x44 a18,39 hazard/flame info
  fire/cluster-l-a-gutter f4 prog 0.5s box48x58 a24,52 hazard/flame info
  fire/cluster-l-b-gutter f4 prog 0.5s box48x58 a24,52 hazard/flame info
  fire/skirt-a f6 loop@12 box30x22 a15,19 hazard/flame deco
  fire/skirt-b f6 loop@12 box30x22 a15,19 hazard/flame deco
  fire/skirt-low f6 loop@12 box26x16 a13,13 hazard/flame deco
  fire/char-a f1 idx box44x22 a22,11 hazard/ground info
  fire/char-b f1 idx box44x22 a22,11 hazard/ground info
  fire/char-c f1 idx box44x22 a22,11 hazard/ground info
  fire/char-d f1 idx box44x22 a22,11 hazard/ground info
  fire/char-cold-a f1 idx box44x22 a22,11 ground/ground deco
  fire/char-cold-b f1 idx box44x22 a22,11 ground/ground deco
  fire/char-cold-c f1 idx box44x22 a22,11 ground/ground deco
  fire/char-cold-d f1 idx box44x22 a22,11 ground/ground deco
  fire/ember-a f6 cycle 0.7s box10x12 a5,6 hazard/air deco
  fire/ember-b f6 cycle 0.7s box10x12 a5,6 hazard/air deco
  fire/smoke-a f6 cycle 1s box18x34 a9,30 hazard/air deco
  fire/smoke-b f6 cycle 1s box18x34 a9,30 hazard/air deco
  hero/back f6 loop@12 box46x22 a23,17 body-back/body info
  hero/front f6 loop@12 box42x24 a21,18 body-front/body info
  mob/front-12 f4 loop@12 box30x19 a15,14 body-front/body deco
  mob/front-19 f4 loop@12 box40x22 a20,17 body-front/body deco
  mob/front-28 f4 loop@12 box56x26 a28,21 body-front/body deco
  ```
- **추가 검사**(지시서 수치 중 C 명령이 재지 않는 것)
  - `PN.hazards._.check()` 0건(`k11-selfcheck`). 무더기·낮은 불길 모든 루프 장에서 이웃 혀 높이차 ≥ 15%, 산호 끝이 먹 끝에서 ≥ 3 아래다.
  - 면적은 `isPointInFill` 0.25 격자로 쟀다: `k11-measure-clusters`, `-l`, `-lb`, `-low`.
  - 장화 가림(`k11-measure-boots`), 그을음·바닥 Y(`k11-measure-floor`), 테 가림(`k11-measure-rim`)도 쟀다.

#### 직접 본 렌더(Read로 열어 봄, 전부 위 폴더)
- **게임 크기 1x**
  - `k11-c2a-ch1-fire` … `k11-c2a-ch5-fire`
  - `k11-extra-r150-ch2`(r 150 l 무더기 + r 68 다섯, 왼쪽 보는 달리는 결)
- **0.8배**: `k11-c2a-ch1-fire-x08`
- **확대**
  - 장면: `k11-c2a-ch1-fire-x2`(2x), `k11-c2a-ch1-fire-x2`의 왼쪽 자름(2x), `k11-lod-modes`(1.5x)
  - 조각: `k11-c3-fire-parts`, `-hero-parts`, `-mob-parts`(4x), `k11-zoom-m-a`·`k11-zoom-small`(8x), `k11-zoom-l`(6x)
  - 주인공: `k11-hero-zoom`(5x, 물듦 3단계 + 왼쪽 보기), `k11-hero-run-feet`(5x)
  - 상태 진행: `k11-c4-fire`(2x)
- **흑백**: `k11-c2a-ch1-fire-gray`, `k11-c2a-ch5-fire-gray`
- **색각**: `k11-c2a-ch1-fire-deutan`, `k11-c2a-ch1-fire-protan`
- **보정·탐침**: `k11-probe-hero-feet`(8x, 발 좌표 격자), `k11-probe-bbox`
- **숫자 렌더**: C6·C7·C8·C9·C10·C12와 측정 결과

### 4. 지시서 대비

#### 4.1 항목별 반영

| 지시서 | 반영 |
|---|---|
| §1.1 로드·이름공간·결정성·중복 속성 | `k-env.js` 뒤에 로드한다. `PN.env`도 부르지 않는다(납품 2에서 `CH`만 읽기). `Math.random`·`Date`가 없다. layout·슬롯은 `SPEC.jit`만 쓴다. `--check` 전부 ok |
| §1.2 호출 형식·기본값·잘못된 호출 | 그대로 만들었고 `flash` 옵션을 더했다. C7 6줄 ok |
| §1.3 판정·박스·원 안 머물기 | C7 1·2줄 0건. 무더기·치마 밑동은 r − 6 안, 바닥 조각 내접 타원은 r − 2 안, 먼 테 + 6 이하 |
| §1.4 조각 표 | 장 수·drive·fps·초·박스·앵커·layer·lod가 표와 같다(C12) |
| §1.5 SPEC | 모든 키를 옮겼다. 그림과 맞춘 것은 fire·hero·mob이다. null `active.on`은 §12.3 Q3대로 `false`다. 추가한 키는 §4.3에 있다 |
| §1.6 layout·불티 식 | 그대로 따랐다. 지시서에 없던 세부(minimal·reduced 선택 순서, 출력 정렬 기준, 상한 잘라내기, 연기 슬롯, 주인공 불티 jit)는 API §8에 식으로 적었다 |
| §1.9 외곽·명도·색·음영·금지 | 불길 먹 실루엣은 옆 ≥ 2, 밑동 ≥ 2, 끝 ≥ 3.2이다. 무더기 안 이음선이 없다(층마다 합집합 한 경로). C6 0. 망점은 쓰지 않았다(선택 사항). 해칭·기호·원판 탄·둥근 밝은 점·바느질이 없다 |
| §2.2 바닥·그을음 | 원판·테는 SPEC으로 그린다. char는 ink700 들쭉날쭉 평면에 숯덩이 2~4, 테이퍼 금 1줄 + 갈래 0~1(먹 2.6 / 산호 1.2 / glow 0.5), 재 ≤ 3이다. 처음 고른 지그재그 금이 번개 기호로 읽혀서 불규칙 마디로 바꿨다. char-cold는 판 α 0.55, 금 ink300 1.2, 재 7~8이다 |
| §2.3 무더기 | 혀 3~5개를 합쳤고, a는 가운데 왼쪽이 가장 높고 b는 봉우리가 둘이다. 바깥으로 기운 혀가 하나 있다. 맥동 ±12%, 흔들림 ±2, glow 면적 ±20%, 바닥 정지다. 뜬 불꽃 조각은 2·3번 장(틈 3.2 / 5)이다. ignite·gutter 4장은 표대로 했다. 숯불 바닥 glow 한 줄은 실눈으로 읽혀서 짧은 두 줄로 바꿨다 |
| §2.4 치마 | 몸통 돔 + 혀 3개를 한 무리로 그렸고 ink700 그을음 자국을 둔다. 높이 14.3 / 13.8 / 9.0이다 |
| §2.5 불티·연기 | 불티 6장은 마름모 → 기운 마름모 → 각진 물방울 → 쉼표 → hostD → 재다. 원판이 아니고 4×6이다. 연기는 ink300 α 0.7 → 0.55, 갈라져 사라진다 |
| §2.6 상태 | API §4 표대로다. 테는 모든 상태에서 α 1이고 soot에는 테가 없다. 상태 진행은 `k11-c4-fire`에서 확인했다 |
| §2.7 판정 맞추기 | 먼 테 가림 ≤ 3.6%. 가까운 테는 원의 맨 좌우에서만 ≤ 0.8% 닿는다(6장 C) |
| §3.2 물듦 | 렌더러 몫이다. SPEC `hero.tint`는 지시서 값이다. 장면 렌더에는 곱하기 오려내기로 넣었고 목도리 청록이 남는 것을 확인했다(`k11-hero-zoom`) |
| §3.3 발밑 불길 | back은 몸보다 넓은 무리 둘 + 장화 뒤 하나다. front는 장화 양옆 무리 둘이고, 칠한 범위와 링 조건은 C7 ok다. 장화 비침은 6장 A |
| §3.4 몸 불티 | 슬롯 4개, 0.6초, 위로 30, 바깥 6이다. 얼굴 금지 구역 0건(C7 5줄). 감소 모션·minimal에서는 그리지 않는다 |
| §3.5 적 발밑 불길 | 12·19·28은 4장 @12fps이고 칠한 사각형 안이다. 몸 물듦·불티는 없다 |
| §5 LOD·감소 | API §10대로 했다. `k11-lod-modes`에서 full·reduced·minimal·감소 모션, soot full·minimal을 확인했다 |
| §1.10 바뀌면 안 되는 것 | 두 파일만 고쳤다. C8 해시가 같고 C11은 40 ok, kit error 0이다 |

#### 4.2 실제 수치표

**불 무더기**: 0.25 격자 실측이고, 루프 6장의 범위다.

| 항목 | 지시서 | s | m | l |
|---|---|---|---|---|
| 칠한 높이 | 20~26 / 30~36 / 40~48 | 0번 장 22.8 (a) · 21.8 (b), 범위 19.0~25.3 | 32.5 · 31.3, 27.3~35.5 | 43.8 · 42.5, 36.8~46.3 |
| 칠한 폭 | 22~28 / 28~34 / 36~44 | 20.8~21.0 | 28.3~28.5 | 39.3~40.0 |
| 먹 | ≥ 40% | 57.2~61.3 | 51.2~53.7 | 48.6~51.4 |
| 산호 | ≤ 45% | 30.7~34.9 | 34.3~38.0 | 37.4~41.2 |
| hostD | ≤ 산호의 25% | 0 | 2.2~3.7 (≤ 산호의 10%) | 1.9~3.6 |
| 산호 + hostD | — | — | ≤ 40.4 | ≤ 43.2 |
| glow | ≤ 12% | 4.1~9.3 | 5.6~10.1 | 5.0~9.7 |
| p50 | ≤ 3% | 0.8~1.0 | 0.7~0.9 | 0.7~0.9 |
| glow 심이 아래 35% 안 | 예 | 6/6 | 6/6 | 6/6 |
| 숯불 바닥 ry/rx · 폭(무더기 대비) | 0.35~0.45 · 0.9~1.1× | 0.41 · 20.8(≈1.0×) | 0.41 · 28.4 | 0.36 · 39.6 |
| 앵커 아래 | ≤ 2 | 1 | 2 | 2 |

**나머지 조각**

| 항목 | 지시서 | 실측 |
|---|---|---|
| 치마 높이 | ≤ 16 / ≤ 10 | a 14.3, b 13.8 / low 9.0 |
| 치마 면적(먹/산호/glow) | 층 같음 | a 72.6/23.3/4.0, b 72.8/23.4/3.8, low 88.9/6.8/4.0 |
| char 칠한 크기 | ≤ 40×18 | ≤ 38×16(박스 −3 한계), 넓이 376~401 |
| char가 원판을 덮는 비율 | 15~30% | char 4.4~10.1%, 숯불 바닥 포함 8.2~13.7% ✗ (6장 B) |
| 불 바닥 평균 Y(불길 제외) | 0.12~0.22 | 0.193~0.203 |
| 불티 크기 | 1x 4~7px | 4×6 |
| 연기 α | 0.55~0.7 | 0.7 → 0.55 |
| 먼 테 가림 | ≤ 20% | 0~3.6%(전체 0~3.9%) |
| hero front 장화 비침 | ≥ 40% 모든 장 | idle 82~88%. run 0: 15~20, run 4: 15~26, run 1: 37~58, run 5: 43~61, run 2·3·6·7: 90~100 (6장 A) |
| hero·mob 칠한 범위 | §3.3·§3.5 사각형 | C7 4줄에서 back·front·mob 0건 |
| 낮은 불길 면적(먹/산호/glow) | — | back 84.0/12.2/3.7, front 81.4/15.0/3.6, mob 12: 87.2/8.7/4.1, 19: 76.4/20.6/3.0, 28: 66.0/31.5/2.5 |
| 물듦 코트 Y | 최고점 ≥ 0.60, 그 밖 ≥ 0.69 | 0.620 / 0.780 / 0.705 |

#### 4.3 지시서와 다르게 한 것 (이유)

1. **`SPEC.fire.smoke`를 새로 정했다.** 지시서에는 연기 조각만 있고 자리 규칙이 없다. 무더기당 최대 3개, gutter 0.25초부터 soot 0.6초까지 슬롯마다 한 번 오른다(API §8.4).
2. **한 지형 항목 상한 잘라내기를 넣었다**(prio·gen 큰 것부터). 치마 수에 따라 r 150이 36을 넘을 수 있어서다. 대표 seed에서는 작동하지 않았다.
3. **무더기 s 폭은 21이다.** 박스 28 − 6 = 22가 상한이다. 높이는 0번 장 기준으로 맞췄고, ±12% 맥동의 낮은 장은 범위 밑으로 10% 내려간다. 박스가 상한 맥동과 뜬 조각을 함께 막기 때문이다.
4. **낮은 불길(치마·주인공·적) 단면을 바꿨다.** 무더기와 같은 가는 혀로 그리면 1x에서 "검은 가시·왕관"으로 읽혔다(초판 `k11-c2a-ch1-fire`). 그래서 "정지 몸통 돔 + 넓은 몸·짧은 끝 혀"로 바꿨다. 먹 2·층 3단은 같다.
5. **뜬 불꽃 끝을 양 끝이 뾰족한 휜 조각으로 그렸다.** 둥근 물방울은 물방울로 읽힌다.
6. **불티 먹 테는 약 1.0~1.2다**(Q11의 1.5보다 얇다). 칠한 4×6 안에 산호를 남기기 위해서다.
7. **l 무더기 먹 테는 2.2 / 3.0으로 굵다.** 큰 물체 외곽을 굵게 하는 바이블 §3에 맞추고 산호 ≤ 45%를 맞추기 위해서다. l 숯불 바닥 ry도 7.2로 낮췄다(ry/rx 0.36).
8. **`draw`의 `flash` 옵션, hero·mob 조각의 z `'body'`, 이번 판만 담은 `kinds`/`groups`/`states`와 전체 계약용 `planned`**를 새로 두었다.

### 5. 메인 세션이 할 일 (합격 뒤)

1. **굽기 등록**
   - `scripts/build-atlas.mjs:11` `KIT_FILES`의 `k-env.js` 바로 뒤에 `'k-hazards.js'`를 넣는다.
   - `art/atlas-spec.mjs` `PACKS`에 `hazards: { page: 'assets/packs/hazards/atlas', frames: [{ hazards: true }] }`를 더한다.
   - 펼치기: `PN.hazards.groups`의 각 group, `parts(group)`의 각 p, 각 frame마다
     - key `hazard/<group>/<part>/<frame>`
     - call `['PN.hazards.stamp', group, part, { frame }]`
     - box `p.box`, anchor `p.anchor`, `scale: 1`, `COLOR_MAP` 적용
   - 애니메이션 `hazard/<group>`: `{ [part]: { frames, fps } }`. fps는 loop만 12이고, prog·cycle·idx는 0(초는 매니페스트 `parts.seconds`)이다.
   - 예상: 158장, 2048² 한 장(@2x 약 79만 px² + 여백). 기존 프레임의 w·h·ax·ay는 바뀌지 않는다.
2. **매니페스트**: `hazards = { spec: PN.hazards.SPEC, parts: {fire, hero, mob: parts(g)}, states: PN.hazards.states, vectors }`
   - vectors는 C9의 세 불 layout이고, 원하면 위의 불티 벡터 둘을 더한다.
   - SPEC·parts·states에는 한글이 없다. META에는 한글이 없지만 매니페스트 대상이 아니다.
3. **재생 값**
   - prog: `cluster-*-ignite` 0.25초, `cluster-*-gutter` 0.5초. 장 = min(F−1, ⌊p·F⌋)
   - cycle: `ember-*` 0.7초(지터 ±0.2 → 0.56~0.84초), `smoke-*` 1.0초(±0.15)
   - still: 고정 장이 없다. loop는 ⌊phase·F⌋에서 멈추고, cycle은 감소 모션·minimal에서 그리지 않는다.
   - layer: `hazard`(z ground → 원판·테 → flame y순 → air), `ground`(char-cold soot 데칼 층), `body-back`(hero/back), `body-front`(hero/front, 주인공 불티, mob/front-*)
4. **렌더러**(API §8~§10에 식이 있다)
   - layout·불티·연기·주인공 불티 식을 TS로 옮기고, 벡터가 같은지 단위 시험한다.
   - 그림이 있는 불은 글리프와 수명 페이드를 쓰지 않는다.
   - 겹친 불은 두 번에 나눠 그린다.
   - soot는 id·위치·반경을 기억해 layout(seed = id)으로 그린다(상한 12/6/0).
   - 주인공 순서: back → 코스메틱 → 몸 → 곱하기 물듦 → front → embers. X-ray 물듦은 × 0.6이다.
   - §12.2대로 FX-03 덮기 물듦·산호 테·둥근 불티를 걷는다. 조건은 불길 `player.burn > 0`, 물듦·불티 추가 `shield ≤ 0`이다.
   - 적은 `Entity.burn > 0`인 스프라이트 적에만 `mob/front-<12|19|28>`를 가까운 순 24/12/0까지 그린다. 몸 물듦은 없다. `RenderWorld.terrainOnEnemies`는 필요 없다.
   - 감소 섬광은 시작 띠 α × 0.5다(`draw`의 `flash: 0.5`).
5. **납품 2와 팔레트**: `palette.ts` `NEUTRAL.voidPaper`는 null(납품 2)에서 필요하다. 불만 먼저 켜려면 종류별 켜기 목록에 fire만 넣는다.

### 6. 알려진 한계·열린 질문 (art-director 판단 요청)

- **A. 달리기 큰 걸음 장의 장화**
  - front 불길이 장화 양옆에 있어서 idle은 82~88%가 보인다. run 0·4는 다리가 x −17~−8, +6~+19로 벌어져 15~26%만 보인다.
  - 한 오버레이로 두 자세(idle 장화 x −8~12 / 큰 걸음 발)를 모두 비키는 자리가 없다(`k11-hero-run-feet`).
  - 선택지:
    - (1) 그대로 둔다(걸음 중 2/8장만 불에 묻힘).
    - (2) front를 가운데로 옮긴다(idle 비침이 약 45~60%로 떨어진다).
    - (3) 주인공 상태별 front 변형을 더한다(+6장).
- **B. 그을음 15~30%**
  - 지시서 개수식 r²/1800(상한 10)과 박스 44×22로는 이론상 약 10.6%가 최대다.
  - 선택지: `char.per` 900, 상한 20(r 150 항목 상한 36도 조정), 박스 60×28(+5.7천 단위²).
  - 바닥 평균 Y는 목표 안이다.
- **C. 가까운 테 접촉**: 치마 반폭 12가 inset 9보다 커서 원의 맨 좌우(±10°)에서 테 띠에 닿는다(둘레 ≤ 0.8%). 고치려면 `skirt.inset`을 12~14로 올린다(SPEC 숫자만 바꾸면 된다).
- **D. 불티 먹 테 1.0~1.2**(지시서 1.5). 4×6 안에서는 1.5면 산호가 1px 남짓이다.
- **E. 낮은 불길은 먹이 많다**(66~89%). 무더기 면적 규칙 대상은 아니지만 1x에서 작은 치마는 어둡게 읽힌다.
- **F. 이번 판에서 판정하지 못한 것**
  - T1·C5 판독 격자, C2b·C2c·C4-misc는 다른 6종이 있어야 해서 납품 2에서 한다.
  - 2Hz 물듦 깜빡임과 루프 움직임은 정지 렌더로 판단할 수 없다. 실제 화면 확인은 통합 뒤 `test:visual`이다.
- **G. 사람 원화가 몫**(바이블 §15): 불길 무더기·치마의 붓 실루엣과 비백, 숯불 바닥·그을음의 비백과 숯덩이, 빛나는 금의 붓질, 불티·연기 붓질, 위 A의 자세별 발밑 불길. 정식 판독 시험(n ≥ 8)은 하지 않았다.

### 7. T1·T2 자가 판정

- **T1**: 납품 1에는 불만 있어서 쌍 비교(fire↔slow, trap↔fire 등)를 할 수 없다. 납품 2에서 C5 네 모드로 한다.
  - 불 단독으로는 흑백·적록·청황 모두에서 판독된다(`-gray`, `-deutan`, `-protan`). 어두운 원판 + 먹 테 + 밝은 심을 가진 세로 불길로 읽히고, 적 탄(원형)·픽업·아군 지대로 읽히는 요소는 없다.
- **T2**
  - (a) 1·5장 흑백에서 결이 가장 밝다. 물듦 최고점 코트 Y 0.62 대 바닥 0.19~0.20이다.
  - (b) 1x·0.8x에서 불 위의 결은 연분홍 물듦 + 장화 양옆 불길 + 몸 둘레 불티로 '타는 중'으로 읽힌다. 깜빡임은 정지 렌더라 확인하지 못했다.
  - (c) 그을린 원판 위 숯불 바닥의 무더기, 빛나는 금이 있는 그을음, 테 안쪽의 불길 치마로 실제 타는 바닥으로 읽힌다.
    - 헷갈렸던 것은 두 가지이고 고쳤다: 초판의 치마("검은 가시 고리")는 단면을 바꿨고, 숯불 바닥 glow 한 줄("실눈")은 두 줄로 나눴다.
  - (d) 테 가림은 ≤ 3.9%다.
  - (e) 적 몸에 산호가 없다. 발밑 불길은 지시서 사각형 안이고, warden은 y −18까지다.
  - (f) soot에는 테가 없고 대비 1.34~1.36이다.
  - (g) 1~5장 모두 같은 판단이다.

---

## 검수 1차 — K11 납품 1 (art-director, 2026-10-16)

### 판정: **수정 후 합격**

- 고칠 것 R1~R8을 반영한 수정 납품 1을 검수 2차에서 다시 본다. 볼 것은 C2a 1x·0.8x·흑백과 T2-b·T2-c다.
- 기술 계약은 지켜졌다. 바뀌면 안 되는 출력, 판정 원, 색, 조각 박스, LOD 문법이 모두 맞다. 무더기·그을음·불티 그림과 ignite·gutter·soot 상태도 잘 만들어졌다.
- 그러나 **사용자 요청의 핵심인 "1x에서 실제로 타는 바닥"을 아직 채우지 못한다.**
- 원인은 대부분 **내 지시서의 숫자**다. 무더기 개수식(r/24), 크기 기준(s < 62), 치마 높이 ≤ 16이 그 숫자다. kit-artist는 그것을 정확히 따랐다.
- 그래서 처방의 대부분은 SPEC 숫자와 낮은 불길 조각의 다시 그리기다. 무더기·그을음 조각은 그대로 쓴다.

판단 근거는 렌더 폴더 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`의 `k11r-*`다.

### 1. 사용자 요청을 채우는가 (게임 크기)

| 무엇 | 렌더 | 판단 |
|---|---|---|
| 불타는 바닥(1x) | `k11r-c2a-ch1-x1` | **미충족.** 화면을 차지하는 것은 어두운 원판이다. 테 안쪽 치마는 같은 키의 **'빨간 천막·삼각 이빨' 고리**로 읽히고, 불길은 가운데 s 무더기(21×23px) 2~3개뿐이다. 메인 세션 관찰("불씨가 몇 개 있는 어두운 원")이 맞다 |
| 0.8배 흑백(5장) | `k11r-c2a-ch5-x08-gray` | 같다. 흰 천막 고리 + 작은 불 몇 개다 |
| 데미지 느낌 | `k11r-c2a-ch1-x1`, `k11r-hero-overlay-zoom`(6배) | **부분 충족.** 곱하기 물듦은 1x에서 분명한 분홍으로 읽힌다(목도리 청록 유지 확인). 발밑 불길(front 높이 ≤ 15, 먹 81~84%)과 불티(4×6, 거의 검정)는 1x에서 거의 보이지 않는다 |
| 적이 불 위 | `k11r-mob-overlay-zoom`(5배) | 낮은 먹 '왕관'이다. 1x에서는 발밑의 검은 점이다 |
| 처방 적용 시안 | `k11r-rx-proposal2-x1`, `k11r-rx-proposal2-x08-gray`, `k11r-r150-rx2`, `k11r-mock-v5-x3`(3배) | 납품된 조각에 R1·R2·R5·R6 숫자만 적용해 그렸다. 1x·0.8x·흑백 모두 **불길이 들어찬 바닥**으로 읽히고, 결이 여전히 가장 밝고, 테가 보인다. 한 지형 항목 수는 r50 11, r60 13, r74 19, r98 28, r150 36(상한에서 잘림)이다 |

### 2. 검사 대조 (불 범위)

| 검사 | 내 실행 | 결과 |
|---|---|---|
| C1 | `k11r-c1-all --check` | ok |
| C3 | `k11r-c3-fire-parts`(4배), 확대 `k11r-zoom-skirt-ember`(8배) | ok. 무더기 s·m·l의 실루엣·층·떨어진 불꽃 끝이 좋다. 치마·skirt-low는 천막 모양(§4 E) |
| C4-fire | `k11r-c4-fire`(2배) | ok. 시작 띠, 꺼짐, 그을음(테 없음) 진행이 읽힌다 |
| C6 | `k11r-c6-c8-c12` | `bad colours=0 banned=0` |
| C7(불·hero·mob 줄) | `k11r-c7-geometry` | 1·2·4·5줄 0, 6줄 ok |
| C8 | `k11r-c8-unchanged` | `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045` |
| C10 | (납품 원문, SPEC 값 확인) | ok |
| C11 | `enemies --check` | 40장 ok |
| C12 | `k11r-c6-c8-c12` | frames 158, boxArea 198,080 |
| T2 | 위 렌더 | (a) 결이 가장 밝다 ok. (d) 테 보임 ok. (e) 적 몸 산호 없음 ok. (f) 그을음 무해 ok. (g) 5장 ok. **(b) 부분, (c) 미충족** |

### 3. 반드시 고칠 것

조각의 앵커·layer·판정 원은 그대로다. 아래 숫자는 지시서 §1.5·§1.6을 바꾼다. 메인 세션이 지시서에 §13 "검수 1차 정정"으로 붙인다.

**R1 몸 무더기 — 크기와 개수**
- 크기: r < 56이면 `cluster-m-*`, r ≥ 56이면 `cluster-l-*`다. **s는 몸 무더기에 쓰지 않고 테두리 고리(R2)에만 쓴다.**
- `fire.layout.cluster`:

  | 키 | 값 |
  |---|---|
  | per | 16 |
  | min / max / minimal | 3 / 10 / 3 |
  | tries | 60 |
  | reach | r ≥ 100이면 0.70, 그 밖은 0.60 |
  | gap | r ×(r ≥ 100이면 0.30, n_c > 4이면 0.36, 그 밖은 0.48) |
  | far / squash | 6 / 1.3(그대로) |

- 결과 개수: r50 m 3, r60·r68·r74 l 3~4, r98 l 5, r150 l 9.

**R2 테두리 고리 — 치마 대체(가까운 테 접촉 C의 답 포함)**
- `skirt-a`·`skirt-b`를 **빼고**, 테두리 고리는 기존 `cluster-s-a`/`-b` 조각으로 둔다. 1x에서 '실제 불 이미지들'로 읽힌다(`k11r-mock-v5-x3`).
- 먼 테 쪽에서 먼 테 규칙(끝 ≤ 먼 테 + 6)을 못 지키는 자리만 `skirt-low`로 바꾸고, 그래도 안 되면 버린다.
- `fire.layout.rim`(옛 skirt):

  | 키 | 값 |
  |---|---|
  | pitch | r ≥ 100이면 40, 그 밖은 32 |
  | skip | 0.15 |
  | inset(a, part) | **max(12, hw·\|cos a\| + 4) + 3·J(i+580)**, hw = (그 조각 box w − 6)/2 |
  | prio | 2 |
  | z | flame |
  | reduced / minimal | 짝수 i만 / 0 |
  | jit 번호대 | 지금 그대로 |

  - inset은 원의 맨 좌우에서 넓은 조각이 가까운 테에 닿던 문제(C)를 없앤다. 렌더러가 parts의 box로 같은 식을 쓴다.
- 상태: 고리의 `cluster-s` 항목은 ignite·gutter에서 `cluster-s-*-ignite`/`-gutter` 장을 쓴다. `skirt-low`는 지금처럼 α 경사로 들어오고 나간다.
- 반경 150은 한 지형 상한 36에서 잘린다(prio 2부터). §13-2의 잘라내기 규칙이 여기서 쓰인다.

**R3 낮은 불길 다시 그리기 (E의 답)**
- 대상: `skirt-low`, hero `back`·`front`, mob `front-12·19·28`.
- 지금의 '돔 몸통 + 짧은 끝 + 평평한 검은 밑 띠'는 1x에서 천막·왕관이다. 처음의 가는 혀가 '검은 가시'로 읽혔던 것도 맞다. 그래서 세 번째 문법으로 그린다.
- **작은 무더기 문법으로 그린다**:
  - 높이가 다른 혀 3~5개(이웃 차 ≥ 15%)
  - 돔 몸통과 검은 밑 띠 없음
  - 밑동은 산호 숯불 띠(먹 테 1.5~2)
  - 무리마다 glow 심 하나
  - 빛 쪽(좌상) 먹은 1.4까지 얇게 해도 된다(바이블 §3 빛 쪽 0.7배)
- **면적**: 산호 ≥ 30%(skirt-low·mob-12는 ≥ 25%), 먹 ≤ 62%.
- **크기·자리**:

  | 조각 | 크기·자리 |
  |---|---|
  | `skirt-low` | box 30×18, anchor (15,15), 칠한 높이 ≤ 10 |
  | hero `back` | **칠할 수 있는 범위 [−22,−26]–[22,2], box 50×34, anchor (25,29).** 몸 뒤라 결을 덮지 않는다. idle 0번 장에서 코트 양옆으로 불길이 각 4px 이상 보여야 "불 속에 서 있다"가 앞 조각 없이도 읽힌다 |
  | hero `front` | 칠할 수 있는 범위 그대로([−18,−15]–[18,3]). 링 조건 그대로 |
  | mob | 칠할 수 있는 범위 그대로. 높이를 범위 끝까지 쓴다 |

- `SPEC.hero.clear.back`를 [−22,−26,22,2]로 바꾼다.

**R4 불티 (D의 답)**
- 먹 테 1.0~1.2는 **받아들인다**(Q11 1.5보다 얇은 승인 예외로 적는다). 그러나 지금은 1x에서 검은 티끌이다. 아래처럼 고친다:
  - box 12×14, anchor (6,7), 칠한 크기 ≤ 5×7
  - 0~3번 장은 산호 + glow ≥ 칠한 넓이의 55%이고, 0~1번 장에 glow 심 ≥ 1px
  - `fire.embers.per` 14 → 12
- 둥근 원판 금지는 그대로다.

**R5 테 안쪽 열 띠**
- `fire.rim` = [[hostile, 6, −9, 0.35], [ink, 5, 0], [hostile, 2.4, −3.6], [hostileGlow, 0.8, −3.6]]로 바꾼다. 열 띠가 맨 앞이고 먹 테 아래에 그린다.
- 원판 가장자리가 달아오른 것으로 읽혀서, 판정 경계가 '불의 끝'으로 보인다.
- soot를 뺀 모든 상태와 minimal(info)에서 그린다.
- 테 띠 사이 r−6~r−4.8은 원판이 보여서 테가 먹 + 산호 선으로 분명히 남는다.

**R6 그을음 (B의 답)**
- 15~30% 목표는 버린다. 대신 아래 둘을 맞춘다:
  - char 단독 5~15%
  - **char + 숯불 바닥 + 불길이 원판을 덮는 비율 ≥ 40%**(반경 50~98, full, 0번 장, 불길 포함 칠한 넓이)
- `fire.layout.char.per` 1800 → **1400**(min 2, max 10)이다. 박스 44×22는 그대로다(60×28로 키우지 않는다).
- 이 두 값을 `_.check()`에 넣는다.

**R7 다시 돌릴 것**
- C1, C2a(1~5장 1x, 1장 0.8x·2x, 1·5장 흑백, 1장 적록·청황), C3, C4-fire, C6, C10, C12.
- C7: 2줄에 "테두리 고리 항목이 inset(a, part)보다 테에 가까움 = 0"을 더한다.
- C9: 벡터가 바뀐다. 새 원문을 낸다.
- R6 덮임 실측, R3·R4 면적 실측.
- 검수 2차 합격선:

  | 항목 | 기준 |
  |---|---|
  | T2-b·T2-c | 1x·0.8x에서 충족 |
  | 덮임 | ≥ 40% |
  | 테 둘레 보임(T2-d) | ≥ 80% |
  | 화면당 불 조각 상한 | 72/40/20 그대로 |
  | 한 지형 상한 | 36/22/5 그대로 |

**R8 문서**
- API §5(조각: skirt-a/b 삭제, 크기 변경), §7(SPEC), §8.1(layout 식, inset), §10, §13(다르게 한 것 갱신)을 고친다.
- 장 수는 약 146장이다(−12 skirt-a/b). 박스 넓이 합은 약 19.6만이다.

### 4. 판단 요청 A~E

| # | 판정 |
|---|---|
| A 달리기 큰 걸음 장의 장화 | **(1) 그대로 수용.** 걸음 8장 중 2장이고, 흑립 챙·코트 삼각형·목도리는 남는다. 지시서의 "모든 장 40%"는 "idle·throw·hurt ≥ 60%, run 0·4는 예외"로 바꾼다. '불 속에 서 있음'은 R3의 높아진 back 조각이 걸음과 상관없이 맡는다 |
| B 그을음 15~30% | R6으로 목표를 바꾼다(char 5~15%, 덮임 합 ≥ 40%, per 1400) |
| C 치마가 가까운 테에 닿음 | R2의 각도별 inset으로 해결한다(테두리 고리 전체에 적용) |
| D 불티 먹 테 1.0~1.2 | 수용한다. 단 R4(크기 5×7, 산호 + glow ≥ 55%) |
| E 낮은 불길의 먹 비율 | 지금 형태는 불수용이다. R3(산호 ≥ 30%, 돔·검은 띠 없음) |

### 5. §4.3 지시서와 다르게 한 것 8건

| # | 내용 | 판정 |
|---|---|---|
| 1 | `fire.smoke` 슬롯 SPEC 신설 | 수용 |
| 2 | 한 지형 항목 상한 잘라내기(prio → gen) | 수용. R1·R2 숫자에서는 반경 150에서 실제로 작동한다 |
| 3 | s 폭 21, 맥동 낮은 장이 범위 밑 | 수용. s는 이제 테두리 고리 전용이다 |
| 4 | 낮은 불길 단면(돔 + 넓은 혀) | **불수용**. R3 |
| 5 | 떨어진 불꽃 끝을 뾰족한 휜 조각으로 | 수용 |
| 6 | 불티 먹 테 1.0~1.2 | 조건부 수용(R4) |
| 7 | l 먹 테 2.2/3.0, l 숯불 바닥 ry/rx 0.36 | 수용 |
| 8 | `draw`의 `flash`, hero·mob z `'body'`, 이번 판만 담은 kinds/groups/states + `planned` | 수용. 단 마지막 납품에서는 kinds·groups·states가 7종·9그룹 전체여야 한다 |

API §13의 나머지(숯불 바닥 glow 두 줄, 지그재그 금 → 불규칙 마디)도 수용한다.

### 6. 권장
- 무더기 glow 심을 8~14%로 키운다. 지시서 상한 12% → 14%로 바꾼다. 1x에서 '뜨거운 심'이 더 산다.
- 큰 원(r ≥ 100)의 반복이 눈에 띄면 `cluster-l-c` 변형 하나를 더한다(+18장). 지금은 a/b + 반전 + 위상으로 버틴다.
- 시작 섬광 띠(hostileGlow 3, r−7)와 R5 열 띠가 겹치는 0.12초는 C4-fire 2배로 한 번 확인한다.

### 7. 납품 2 전에 공용 틀에 고칠 것
1. **테에 붙는 조각 공통 규칙**:
   - 불길처럼 솟는 조각(덩굴 등)은 R2의 `inset(a, part) = max(12, hw·|cos a| + 4)`를 쓴다.
   - 바닥 조각(웅덩이·물결·부스러기)은 지금처럼 내접 타원 ≤ r − 2를 지킨다.
   - 도우미 하나로 묶어 layout 전체가 같이 쓰게 한다. 렌더러 이식도 하나로 끝난다.
2. 마지막 납품에서 `kinds`·`groups`·`states`를 전체 목록으로 바꾼다. `planned`와 같아야 한다.
3. `_.check()`에 종류별 면적 검사를 넣는다: 불 덮임 ≥ 40%, 감속 웅덩이 25~35%, 덩굴 ≤ 18%.
4. 낮은 오버레이(bind-back·bind-front)도 1x에서 덩굴로 읽히는지 C2b 1x로 먼저 본다. 이번 천막 문제처럼 확대에서만 맞는 모양을 피한다.
5. C9 벡터는 수정 판의 값으로 다시 낸다(메인 세션 이식 시험의 기준).

### 8. 메인 세션 등록 때 주의할 것
1. **종류별 켜기 목록에는 fire만** 넣는다. 나머지 6종은 벡터(글리프 포함) 대체 그림을 쓴다.
2. **FX-03 교체**(§12.2):
   - 주인공: 덮기 α 0.5 ± 0.18 + 산호 테 + 원 불티를 걷어 낸다. 곱하기 물듦(α 0.30 ↔ 0.12, 2Hz, 감소 설정 0.20 고정) + back/front + 불티 조각으로 바꾼다.
   - 조건: 불길은 `player.burn > 0`, 물듦·불티는 그 위에 `shield <= 0`일 때다.
   - FX-03보다 약하게 느껴지면 최고점을 **0.36까지만** 올린다(코트 Y ≥ 0.58). 덮기 합성으로 돌아가지 않는다(코트 Y가 바닥 밴드까지 내려가 P1이 깨진다).
3. **적**: FX-03 몸 물듦·테·불티를 걷는다. `Entity.burn > 0`인 스프라이트 적에만 `mob/front-*`를 가까운 순 24/12/0까지 그린다.
4. **불 그리기**:
   - 두 번에 나눠 그린다(원판·char·열 띠·테 → 월드 y 순 불길 → 불티·연기).
   - SPEC 층의 넷째 값(α)을 지킨다. 열 띠가 α 0.35다.
   - 글리프·수명 페이드를 끈다.
   - soot는 id로 기억하고 layout seed = id로 그린다.
5. **layout 이식**: R1·R2 식(inset(a, part)는 parts의 box로 계산, 먼 테 규칙, 한 지형 잘라내기)을 옮기고 수정 판 C9 벡터로 단위 시험한다.
6. **굽기**: 약 146장, `hazards` 팩 한 장이다. 테두리 고리는 `hazard/fire/cluster-s-*` 키를 쓴다(skirt-a/b 키 없음).
7. **성능**: 한 지형 항목이 늘었다(r98 약 28, r150 36). 화면당 상한 72/40/20과 160/90/40은 그대로다. 지시서 §9-7의 stress + 지형 묶음(불길 레인 21개 포함)으로 work p95 ≤ 8ms, 지형 비용 ≤ 0.5ms를 확인한다.
8. **화면 검사**: `test:visual` burning 장면을 1x·0.8x, 감소 모션·감소 섬광으로 캡처한다. 화면 가장자리 산호 빛(FX-03)을 남길지는 §12.2대로 Q4 틱 숫자를 넣은 뒤 정한다.

### 9. 본 렌더 (모두 Read로 열어 봄, 위 폴더)

| 무엇 | 렌더 |
|---|---|
| 납품 그대로 | `k11r-c2a-ch1-x1`(1x), `k11r-c2a-ch1-x2-left`(3배 자름), `k11r-c2a-ch5-x08-gray`(0.8배 흑백), `k11r-c3-fire-parts`(4배), `k11r-zoom-skirt-ember`(8배), `k11r-hero-overlay-zoom`(6배, idle·run 0·4), `k11r-mob-overlay-zoom`(5배), `k11r-c4-fire`(2배), `k11r-r150-delivered-vs-rx`(1x) |
| 숫자 | `k11r-c1-all`, `k11r-c6-c8-c12`, `k11r-spec-fire`, `k11r-c7-geometry`, `k11r-c8-unchanged`, C11 `enemy-*` 40장 |
| 처방 검증 시안(납품 조각 + 내 layout 코드) | `k11r-mock-variants-x1`, `k11r-mock-variants2-x1`, `k11r-mock-v5-x3`, `k11r-rx-proposal-x1`, `k11r-rx-proposal2-x1`, `k11r-rx-proposal2-x08-gray`, `k11r-r150-rx2` |

### 10. 확인하지 못한 것
- R3·R4로 다시 그릴 낮은 불길·불티의 실제 모습. 시안은 지금 조각(천막 모양 skirt-low 포함)으로 그렸다. 검수 2차에서 본다.
- 2Hz 물듦과 루프 움직임(정지 렌더). 통합 뒤 `test:visual`과 실제 화면으로 본다.
- 성능 수치(측정 전).
- 납품 2 항목(T1·C5, C2b·C2c·C4-misc).

---

## 1차 수정 납품서 — 위험지형 납품 1 수정판 (검수 1차 R1~R8 반영)

수정판(`version '1.0-d1r1'`)을 마쳤습니다. 검수 1차 R1~R8을 모두 넣었고, 공용 틀 항목 중 이번 몫(§7-1 inset 도우미, §7-3 `_.check()` 면적 검사, §7-5 C9 재발행)도 넣었습니다. 우선순위로 주신 R1·R2·R3·R5(1x에서 타는 바닥으로 읽히게 하는 것)는 모두 끝났습니다.

- **검사**: C1, C2a(10장), C3(3장), C4-fire, C6~C12를 모두 돌렸고, `--check`는 전부 ok입니다.
  - kit error 0건, C8 기준 해시 그대로, C11 40장 ok입니다.
  - C7 3·4줄에 남은 33건은 첫 납품과 같이 납품 2 항목뿐입니다.
- **판단이 필요한 것(가장 중요)**: R6의 덮임 ≥ 40%는 R1·R2·R6 숫자 그대로는 r60에서만 됩니다(15경우 중 11경우 미달).
  - 지시서 숫자와 합격선이 부딪치므로 숫자를 바꾸지 않고 보고합니다.
  - 바꾸는 안 12가지의 실측을 §3.4에 표로 적었습니다.
- **그 밖에 판단을 받을 것**(§4.3):
  - 불티 먹 테가 0.45~0.78로, 승인된 1.0~1.2보다 얇다.
  - `skirt-low`는 높이 ≤ 10 안에 그려야 해서 표현에 한계가 있다.
  - 작은 숯불 바닥의 빛 점을 하나로 줄였다(눈처럼 읽혀서).
  - m·l 무더기 높이가 2 늘었고 l 먹 테가 2.4/3.2로 굵어졌다.

고친 파일은 둘뿐입니다. `k-env.js`의 `PN.env.hazard`를 포함해 다른 파일은 손대지 않았고, 아무것도 내려받지 않았습니다.
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-hazards.md`(R8, 전면 갱신)

렌더 폴더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`입니다.

---

### 1. 납품 목록

| 파일 | 네임스페이스 | 내용 |
|---|---|---|
| `k-hazards.js` | `window.PN.hazards` | `version '1.0-d1r1'`, `K`, `kinds`, `groups`, `states`, `META`, `SPEC`, `jit`, `planned`, `parts`, `stamp`, `layout`, `paths`, `draw`, `overlay`, `_` |
| `API-hazards.md` | — | §3 `_` 표, §5 조각, §6 그림·실측, §7 SPEC, §8 layout 식(R1·R2·R6, `rimDist`), §10 LOD, §11 예산, §12 검사·규칙표, §13 다르게 한 것 |

- **조각**: 146장(fire 122, hero 12, mob 12), 박스 넓이 합 195,608 단위²다(첫 납품은 158장, 198,080).
  - `skirt-a`·`skirt-b` 12장을 뺐다.
  - 박스를 키운 조각: `skirt-low` 30×18, ember 12×14, hero back 50×34.
- **상태·옵션**: draw 상태 4개(burn, ignite, gutter, soot), overlay 층(hero back·front·embers, mob front), 옵션은 첫 납품과 같다.
- **`_`(검사용)에 더한 것**: `measure(o)`, `fireCover(r, seed, step, withBand)`, `rimDist(r, a, box, mode, u, o)`, `AREA_RULES`. `check({areas:false})`도 받는다.
- **기본 출력이 바뀐 것**: `PN.hazards`의 layout·draw·조각 전부가 바뀐다(R1~R6). 아직 굽지 않았으므로 저장소의 굽기 결과는 바뀌지 않는다. 다른 모듈의 출력은 그대로다(C8).

### 2. API 요약

- **좌표·판정**: 첫 납품과 같다.
  - `draw` 원점 = 지형 중심, 판정 원 = 반경, 테 중심선 = r(V4).
  - `overlay` 원점 = 발이고, `facing:-1`이면 반전한다. 몸은 회전하지 않는다.
- **바뀐 조각**(박스, 앵커, layer/z):
  - `skirt-low`: 30×18, 15,15, hazard/flame
  - `ember-a·b`: 12×14, 6,7, hazard/air
  - hero `back`: 50×34, 25,29, body-back
  - 나머지는 그대로다.
- **바뀐 SPEC**:
  - `fire.rim`: 맨 앞에 열 띠 `['hostile', 6, -9, 0.35]`를 더했다.
  - `fire.size {m: 56}`
  - `fire.layout.cluster` / `.rim`(옛 `skirt` 자리) / `.char.per 1400`
  - `fire.embers.per 12`
  - `hero.clear.back [-22,-26,22,2]`
- **칠한 범위**(앵커 원점, 전 장):

  | 조각 | 칠한 범위 | 크기 |
  |---|---|---|
  | `skirt-low` | x −11.2~10.6, y −9.9~−0.2 | 높이 9.7 |
  | hero back | x −22.0~21.9, y −25.7~1.9 | |
  | hero front | x −17.7~17.8, y −14.9~2.9 | |
  | mob-12 | x −11.8~10.9, y −10.4~1.8 | |
  | mob-19 | x −16.1~15.3, y −13.7~1.8 | |
  | mob-28 | x −24.0~22.8, y −17.7~1.8 | |
  | 불티 0~4번 장 | — | ≤ 4.94×6.90 |

### 3. 검사 결과

#### 3.1 명령과 결과(렌더 이름 `k11-v2-`)

- **C1** `k11-v2-c1-all --check`: ok
- **C2a**(지시서 명령 그대로, 이름·`ch`·`GRAY`·배율만 바꿈): 모두 ok
  - 1x: `k11-v2-c2a-ch1-fire`, `-ch2-fire`, `-ch3-fire`, `-ch4-fire`, `-ch5-fire`
  - 0.8x: `-ch1-x08`, 2x: `-ch1-x2`
  - 흑백: `-ch1-gray`, `-ch5-gray`
  - 색각: `-ch1-deutan`, `-ch1-protan`. 흑백 필터 값 자리에 C5의 deutan·protan 행렬을 넣었다.
- **C3** `k11-v2-c3-fire-parts`, `-hero-parts`, `-mob-parts`(4배): 모두 ok
- **C4-fire** `k11-v2-c4-fire`(2배): ok
- **C6**: `bad colours=0 banned=0`
- **C7**: 지시서 명령에서 두 가지를 바꿨다. `RC.back`을 R3의 [−22,−26,22,2]로 바꿨고, R7의 줄을 `2+`로 더했다(`H._.rimDist`로 계산).
  ```
  1 stamps outside box-3: 0
  2 bases outside r-6: 0 | ground items over r-2: 0 | tips over far rim+6: 0 | over per-hazard cap: 0
  2+ rim ring items closer to the rim than inset(a, part): 0
  3 paths outside: 9 shock no cracks shock no cracks shock no cracks null no ghost
  4 overlays outside their rects: 24 bind-back@0f1 bind-back@0f-1 bind-back@0.1f1 bind-back@0.1f-1 bind-back@0.2f1 bind-back@0.2f-1
  5 hero ember paths through the face zone (outward drift): 0
  6 invalid calls ok
  ```
  4줄의 24건은 모두 bind-back·bind-front(납품 2)다. hero back·front와 mob 3종은 0건이다.
- **C8**: `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045`
- **C10**:
  ```
  fire (ink a0.3): ch1 1.80 ch2 1.80 ch3 1.82 ch4 1.81 ch5 1.78 | ok
  water (ink a0.24): ch1 1.59 ch2 1.59 ch3 1.60 ch4 1.59 ch5 1.57 | ok
  trap (ink700 a0.5): ch1 2.37 ch2 2.37 ch3 2.42 ch4 2.39 ch5 2.31 | ok
  null (voidPaper a1): ch1 1.63 ch2 1.63 ch3 1.54 ch4 1.59 ch5 1.75 | ok
  soot (ink a0.16): ch1 1.35 ch2 1.35 ch3 1.36 ch4 1.35 ch5 1.34 | ok
  hero coat peak multiply a0.3: Y=0.620 ok
  hero coat trough multiply a0.12: Y=0.780 ok
  hero coat steady multiply a0.2: Y=0.705 ok
  ```
- **C11** `enemies --check`: 40장 모두 ok
- **C12**:
  ```
  frames=146 ok boxArea=195608 ok badDrive=0
  fire/cluster-s-a f6 loop@12 box28x32 a14,28 hazard/flame info
  fire/cluster-s-b f6 loop@12 box28x32 a14,28 hazard/flame info
  fire/cluster-m-a f6 loop@12 box36x44 a18,39 hazard/flame info
  fire/cluster-m-b f6 loop@12 box36x44 a18,39 hazard/flame info
  fire/cluster-l-a f6 loop@12 box48x58 a24,52 hazard/flame info
  fire/cluster-l-b f6 loop@12 box48x58 a24,52 hazard/flame info
  fire/cluster-{s,m,l}-{a,b}-ignite f4 prog 0.25s (크기별 같은 box·a) hazard/flame info   ← 6줄
  fire/cluster-{s,m,l}-{a,b}-gutter f4 prog 0.5s (크기별 같은 box·a) hazard/flame info    ← 6줄
  fire/skirt-low f6 loop@12 box30x18 a15,15 hazard/flame deco
  fire/char-a~d f1 idx box44x22 a22,11 hazard/ground info                                ← 4줄
  fire/char-cold-a~d f1 idx box44x22 a22,11 ground/ground deco                           ← 4줄
  fire/ember-a f6 cycle 0.7s box12x14 a6,7 hazard/air deco
  fire/ember-b f6 cycle 0.7s box12x14 a6,7 hazard/air deco
  fire/smoke-a f6 cycle 1s box18x34 a9,30 hazard/air deco
  fire/smoke-b f6 cycle 1s box18x34 a9,30 hazard/air deco
  hero/back f6 loop@12 box50x34 a25,29 body-back/body info
  hero/front f6 loop@12 box42x24 a21,18 body-front/body info
  mob/front-12 f4 loop@12 box30x19 a15,14 body-front/body deco
  mob/front-19 f4 loop@12 box40x22 a20,17 body-front/body deco
  mob/front-28 f4 loop@12 box56x26 a28,21 body-front/body deco
  ```
  (원문 렌더 `k11-v2-c12-parts`에는 ignite·gutter·char 행이 한 줄씩 따로 있다.)
- **`_.check()`** `k11-v2-selfcheck-final`:
  ```
  PN.hazards._.check(): 11 issue(s) (8 s), version 1.0-d1r1
  fire cover r50s1 37.2% | fire cover r50s7 39.77% | fire cover r50s23 36.17% | fire cover r68s1 36.32% | fire cover r68s7 34.49% | fire cover r68s23 39%
  fire cover r74s1 39.05% | fire cover r74s23 39.16% | fire cover r98s1 33.16% | fire cover r98s7 33.02% | fire cover r98s23 30.71%
  PN.hazards._.check({areas:false}) (rim inset + tongue rules): 0 issue(s)
  ```
  덮임 말고는 0건이다. 0건인 항목: 테두리 고리 inset, 무더기 면적, 낮은 불길 면적, 불티 면적, 그을음 단독, 이웃 혀 높이, 산호 끝.

#### 3.2 C9 새 벡터 (원문 `k11-v2-c9-vectors`, 읽기 쉽게 다시 그린 `k11-v2-c9-read-50-74`, `-read-150`)

필드는 [part, x, y, flip, phase, z, prio]다. 납품 2 종류는 빈 목록이다.

```
fire:50:1 (11)
["char-d",7.36,-22.66,1,0,"ground",1] ["char-b",15.45,3.86,1,0,"ground",1]
["skirt-low",-18.04,-32.43,1,0.712,"flame",2] ["skirt-low",17.02,-31.4,1,0.177,"flame",2]
["cluster-s-b",-31.65,-13.02,0,0.951,"flame",2] ["cluster-m-b",-21.53,-8.84,0,0.018,"flame",0]
["cluster-m-a",16.16,-3.4,1,0.423,"flame",0] ["cluster-m-b",5.08,13.56,0,0.649,"flame",0]
["cluster-s-a",-30.07,21.21,1,0.486,"flame",2] ["cluster-s-a",8.76,34.37,1,0.26,"flame",2]
["cluster-s-b",-10.13,34.74,0,0.725,"flame",2]

fire:74:7 (20)
["char-a",5.92,-44.64,1,0,"ground",1] ["char-d",-45.07,-13.09,0,0,"ground",1]
["char-a",9.62,-0.18,1,0,"ground",1] ["char-b",-10.14,27.61,0,0,"ground",1]
["skirt-low",0.02,-59.13,1,0.374,"flame",2] ["skirt-low",19.31,-56.64,0,0.135,"flame",2]
["skirt-low",-51.16,-30.6,1,0.148,"flame",2] ["cluster-l-b",-29.46,-19.49,0,0.049,"flame",0]
["cluster-s-b",55.17,-11.76,1,0.065,"flame",2] ["cluster-l-a",-2.63,-6.51,1,0.441,"flame",0]
["cluster-l-a",25.66,-0.32,1,0.454,"flame",0] ["cluster-s-a",-58.05,4.61,0,0.683,"flame",2]
["cluster-l-b",-39.36,6.74,0,0.225,"flame",0] ["cluster-s-b",53.69,19.09,0,0.301,"flame",2]
["cluster-s-b",-52.79,22.78,0,0.218,"flame",2] ["cluster-l-a",2.33,23.12,0,0.69,"flame",0]
["cluster-s-b",47.29,37.46,0,0.766,"flame",2] ["cluster-s-a",-27.44,55.46,1,0.457,"flame",2]
["cluster-s-a",17.2,59.22,1,0.527,"flame",2] ["cluster-s-b",-7.89,59.75,0,0.992,"flame",2]

fire:150:23 (36, 상한에서 잘림)
["char-a",40.65,-108.6,1,0,"ground",1] ["char-c",-61.03,-85.12,0,0,"ground",1]
["char-b",93.63,-77.45,1,0,"ground",1] ["char-a",13.37,-43.96,1,0,"ground",1]
["char-d",-115.06,1.45,0,0,"ground",1] ["char-b",37.12,33.14,0,0,"ground",1]
["char-c",-76.56,39.01,0,0,"ground",1] ["char-c",-13.54,97.31,0,0,"ground",1]
["skirt-low",3.38,-135.9,1,0.101,"flame",2] ["skirt-low",-74.96,-113.16,0,0.171,"flame",2]
["skirt-low",80.21,-108.92,1,0.327,"flame",2] ["skirt-low",-94.56,-95.77,1,0.41,"flame",2]
["cluster-l-a",-8.7,-92.03,1,0.191,"flame",0] ["skirt-low",99.6,-91.33,0,0.792,"flame",2]
["cluster-l-a",-50.45,-71.3,1,0.108,"flame",0] ["cluster-l-b",72.47,-69.78,1,0.334,"flame",0]
["cluster-s-a",119.45,-64.86,0,0.553,"flame",2] ["cluster-s-b",-122.36,-55.6,0,0.945,"flame",2]
["cluster-l-b",-72.64,-39.34,0,0.035,"flame",0] ["cluster-l-a",17.07,-37.5,1,0.274,"flame",0]
["cluster-s-a",-132.76,-24.42,1,0.184,"flame",2] ["cluster-s-b",132.13,-17.57,0,0.018,"flame",2]
["cluster-l-b",-96.37,-5.46,0,0.965,"flame",0] ["cluster-l-a",29.28,8.31,1,0.5,"flame",0]
["cluster-s-b",132.55,17.41,0,0.885,"flame",2] ["cluster-s-a",-132.02,24.49,0,0.719,"flame",2]
["cluster-l-a",19.29,46.16,1,0.643,"flame",0] ["cluster-s-b",-123.89,49.1,0,0.254,"flame",2]
["cluster-l-a",-39.69,52.51,0,0.809,"flame",0] ["cluster-s-a",119.3,64.54,1,0.646,"flame",2]
["cluster-s-b",100.23,91.62,1,0.111,"flame",2] ["cluster-s-a",-96.64,98.19,1,0.493,"flame",2]
["cluster-s-b",-75.02,113.63,0,0.028,"flame",2] ["cluster-s-a",-45.73,129.74,1,0.563,"flame",2]
["cluster-s-b",29.55,131.97,1,0.337,"flame",2] ["cluster-s-b",3.61,136.79,0,0.802,"flame",2]
```

불티 벡터(`k11-v2-c9-embers`, `-c9-hero-embers`), 필드는 [part, x, y, 장]이다:
- `_.emberSlots(50,1,0.3)` = [a −21.16,−40.72 f3] [b 13.8,−13.93 f0] [a 14.68,−14.28 f4] [b −18.38,−29.23 f2]
- `_.emberSlots(74,7,0.3)` = [a −30.5,−33.18 f1] [b −3.47,−41.38 f4] [a 25.96,−12.15 f0] [b −54.53,−30.18 f5] [a 4.48,2.89 f1] [b −26.74,−54.16 f4]
- `_.emberSlots(150,23,0.3)` = [a −8.39,−131.03 f4] [b −49.06,−87.54 f1] [a 74.72,−108.86 f5] [b −73.94,−64.07 f2] [a 16.85,−52.48 f1] [b −96.86,−41.57 f4] [a 25.17,−4.85 f0] [b 20.15,8.02 f5]
- `_.heroEmberSlots(0.3)` = [a −23.37,−38.83 f5] [b −25.53,−45.63 f3] [a 24.51,−12.56 f0] [b 27.63,−52.16 f5](바뀌지 않음)

#### 3.3 실측

**무더기**(`k11-v2-measure-areas`, 0.5 격자, a·b 루프 6장 범위):

| 크기 | 칠한 폭 | 칠한 높이 0번 장 a/b(범위) | 먹 | 산호 | hostD | glow | p50 |
|---|---|---|---|---|---|---|---|
| s | 20.7~21.1 | 22.8/22.3 (19.3~25.4) | 58.0~61.3 | 26.5~31.0 | 0 | 8.1~13.6 | 0.7~0.9 |
| m | 28.2~28.8 | 34.4/33.9 (29.2~36.8) | 49.0~52.4 | 32.5~35.9 | 2.5~4.1 | 8.9~13.8 | 0.6~0.7 |
| l | 39.3~40.2 | 45.8/45.4 (39.0~48.1) | 48.6~51.8 | 32.5~36.4 | 2.0~3.8 | 9.1~13.9 | 0.7~0.9 |

**낮은 불길**(`k11-v2-lowarea3`, 전 장):

| 조각 | 먹 % | 산호 % | glow % | 규칙 |
|---|---|---|---|---|
| skirt-low | 58.7~61.0 | 35.1~35.6 | 3.7~5.8 | ≥ 25 / ≤ 62 |
| hero back | 60.8~61.7 | 31.5~33.3 | 5.0~7.5 | ≥ 30 / ≤ 62 |
| hero front | 57.9~59.6 | 32.0~34.4 | 6.2~9.2 | ≥ 30 / ≤ 62 |
| mob-12 | 60.0~61.7 | 33.5~34.9 | 3.4~5.8 | ≥ 25 / ≤ 62 |
| mob-19 | 50.7~52.3 | 42.0~43.0 | 4.8~7.2 | ≥ 30 / ≤ 62 |
| mob-28 | 42.3~44.1 | 50.3~52.2 | 4.2~6.6 | ≥ 30 / ≤ 62 |

**불티**(`k11-v2-ember-bbox2`, 0.1 격자):

| 장 | 산호 + glow | glow 심 | 칠한 크기 |
|---|---|---|---|
| f0 | 58.3% | 4.64 u² | 4.90×6.90 |
| f1 | 56.3% | 2.28 u² | 4.94×5.98 |
| f2 | 59.3% | — | 4.60×6.40 |
| f3 | 63.0% | — | 4.03×6.78 |
| f4 | — | — | 3.81×4.88 |

**주인공**(`k11-v2-measure-hero5`, `-measure-hero`):
- front 장화 먹이 보이는 비율(%, overlay 6장):
  - idle0 88.5~90.0, idle3 87.3~90.4
  - throw0 87.6~89.5, throw2 89.4~92.0
  - hurt0 61.9~68.4, hurt1 63.5~70.4, hurt2 82.3~85.7
  - run0 14.3~19.7, run4 17.6~23.2(예외 승인)
- back이 idle 0에서 코트 양옆으로 보이는 폭(밑단 위 가로 줄 최대 px): 왼쪽 4.5~5.3, 오른쪽 8.5~9.8 → ≥ 4 ok.

**그 밖**:
- 그을음 단독 8.5~11.5%(규칙 5~15% 안).
- 바닥 평균 Y(불길 제외): 1장 0.192~0.194, 5장 0.178~0.180이다. 테를 넣으면 0.196~0.198 / 0.184~0.188이다(`k11-v2-floor-y`).
- 테 보임(T2-d): 99.2~100%(`k11-v2-t2d-rim`).
- 한 지형 항목 수(full): r50 11~13, r60 14~16, r68 16~18, r74 19~21, r98 27~28, r150 36(상한). reduced는 7~22, minimal은 5다(`k11-v2-layout-counts`).
- 몸 무더기 수는 r50 3, r60·r68 3~4, r74 5, r98 6, r150 9다. 검수서 예상 "r74 3~4, r98 5"보다 많다. round(r/16) = 5와 6이 간격 규칙을 통과했다.

#### 3.4 덮임 실측과 선택지 (`k11-v2-cover-final-1`, `-2`)

- **조건**: 1 격자, full, 0번 장, 합집합, 원판 πr² 안, seed 1·7·23의 최소~최대.
- **표의 안**: 다른 안은 SPEC 숫자만 바꿔 같은 조각으로 쟀고, 모듈에는 넣지 않았다.
- **납품 A의 seed별 값**(cover / char / 불길 조각):

  | r | s1 | s7 | s23 |
  |---|---|---|---|
  | 50 | 37.2 / 11.0 / 30.7 | 39.8 / 11.0 / 35.7 | 36.2 / 10.7 / 33.4 |
  | 60 | 40.6 / 11.3 / 33.2 | 43.1 / 11.5 / 36.3 | 44.5 / 11.0 / 40.2 |
  | 68 | 36.3 / 8.8 / 29.2 | 34.5 / 9.0 / 28.8 | 39.0 / 8.5 / 35.5 |
  | 74 | 39.1 / 10.0 / 32.4 | 40.4 / 10.1 / 34.2 | 39.2 / 9.8 / 34.9 |
  | 98 | 33.2 / 9.9 / 25.1 | 33.0 / 10.0 / 25.3 | 30.7 / 9.9 / 25.4 |

| 안 | 바꾸는 것 | r50 | r60 | r68 | r74 | r98 | 비고 |
|---|---|---|---|---|---|---|---|
| **A 납품** | 없음(R 숫자) | 36.2~39.8 | 40.6~44.5 | 34.5~39.0 | 39.1~40.4 | 30.7~33.2 | |
| B | 열 띠를 덮임에 센다(그림 변화 없음) | 50.6~53.2 | 54.0~56.6 | 47.1~50.1 | 49.4~51.8 | 39.4~42.0 | r98 s1만 미달 |
| C | char.per 1000 | 36.5~44.8 | 42.2~44.5 | 37.3~42.0 | 39.8~42.5 | 31.7~34.4 | char 단독 r50 16.6% > 15 ✗ |
| D | C + B | 50.8~58.2 | 55.6~56.6 | 49.9~53.1 | 51.4~53.9 | 40.3~43.3 | char 규칙 ✗ |
| E | rim pitch 26/32 | 40.6~43.5 | 42.0~48.0 | 37.5~41.6 | 40.8~43.0 | 33.5~35.5 | |
| F | cluster.per 13 | 37.2~41.1 | 44.1~46.7 | 38.6~44.1 | 39.1~40.4 | 33.1~37.7 | |
| G | cluster gap .42/.32/.27 | 36.2~39.8 | 40.7~44.5 | 34.5~41.0 | 38.7~40.2 | 31.7~33.2 | |
| H | rim skip 0 | 38.0~40.3 | 43.4~46.5 | 36.9~40.6 | 40.5~42.9 | 31.8~35.1 | |
| I | char inset 18, gap .30 | 37.2~40.1 | 41.9~46.8 | 35.0~40.2 | 39.4~41.3 | 31.9~33.2 | |
| K | cluster.big 96 | 36.2~39.8 | 40.6~44.5 | 34.5~39.0 | 39.1~40.4 | 31.4~32.2 | |
| **M** | K + B | 50.6~53.2 | 54.0~56.6 | 47.1~50.1 | 49.4~51.8 | 40.2~41.0 | 모두 ≥ 40 |
| N | E + F | 41.9~45.7 | 45.6~48.0 | 41.7~45.2 | 40.8~43.0 | 35.9~40.0 | 항목 r50 13~15, r98 32~34 |
| P | E + F + H | 45.1~48.3 | 48.7~49.9 | 45.0~48.8 | 43.4~45.8 | 37.4~40.9 | r98이 항목 상한 36에 닿음 |

- **원인**: 개수가 r에 비례해 늘고(R1 r/16, R2 둘레/pitch) 원판은 r²로 넓어진다. 그래서 반경이 클수록 덮임이 떨어진다.
- **r98의 한계**: 조각만으로는 한 지형 상한 36에 먼저 막힌다(P).
- **제안**:
  - 덮임 정의에 열 띠를 넣는다(B). 그림이 바뀌지 않고, R5가 노린 '달아오른 원판'을 센다.
  - 모든 반경 ≥ 40%가 꼭 필요하면 K를 더한다(M, `cluster.big` 100 → 96).
  - 화면에서 r50~74를 더 빽빽하게 하고 싶으면 N이다(엄격한 정의로도 r50~74 ≥ 40.8, r98 35.9~40.0).
- **판단 근거 렌더**(1x): `k11-v2-c2a-ch1-fire`, `k11-v2-r150-x1`

#### 3.5 직접 본 렌더

**전**:
- 내 첫 납품 `k11-c2a-ch1-fire`
- 검수 `k11r-c2a-ch1-x1`, `k11r-c2a-ch5-x08-gray`, `k11r-hero-overlay-zoom`, `k11r-mob-overlay-zoom`
- 목표 시안 `k11r-rx-proposal2-x1`, `k11r-r150-rx2`

**후**:
- 게임 크기: `k11-v2-c2a-ch1~5-fire`(1x), `-ch1-x08`, `-ch1-x2`, 내 장면 `k11-v2-c2a-ch1-x1`
- 흑백·색각: `-ch1-gray`, `-ch5-gray`, `-ch1-deutan`, `-ch1-protan`
- 확대:
  - 테두리 고리·skirt-low 3배 `k11-v2-c2a-ch1-x3-top`, `-skirtlow-scene-x3`
  - 낮은 불길 6배 `k11-v2-c3-low-x6c`
  - 조각표 4배 `k11-v2-c3-fire-parts`(+`-crop`), `-hero-parts`, `-mob-parts`
  - 주인공 6배 `k11-v2-hero-overlay-zoom`(idle·throw·hurt·run0·run4), 적 5배 `k11-v2-mob-overlay-zoom`
- 상태:
  - `k11-v2-c4-fire`(2배)
  - 섬광 띠와 열 띠 4배 `k11-v2-c4-ignite-flash-x4`
  - 작은 바닥 빛 점 전후 `k11-v2-gutter-x3`(전), `-gutter-x3b`(후)
- 큰 원: `k11-v2-r150-x1`(cluster-l-c 판단)
- 숫자: 위 3.1~3.4의 렌더들

**T2 자가 판정**:
- **(a)** 흑백에서 결이 가장 밝다. 물듦 최고점 코트 Y 0.62, 바닥 0.18~0.20이다.
- **(b)** 1x·0.8x에서 '타는 중'으로 읽힌다. 근거는 네 가지다:
  - 분홍 물듦
  - 장화 양옆의 산호 물방울 불길
  - 코트 옆으로 솟는 back 불길
  - 산호로 읽히는 불티
- **(c)** 1x·0.8x·흑백 모두 산호 몸의 무더기, 테두리의 s 불길, 달아오른 테로 '불이 들어찬 바닥'으로 읽힌다. r98은 군데군데 비고, r150은 성기다(덮임 약 19%).
- **(d)** 테 보임 99.2% 이상.
- **(e)** 적 몸에 산호가 없다.
- **(f)** soot에 테가 없고 대비 1.34~1.36이다.
- **(g)** 1~5장이 같다.

### 4. 지시서(검수 1차) 대비

#### 4.1 R1~R8

- **R1**: 크기 r < 56 → m, 그 밖은 l. per 16, min/max/minimal 3/10/3, tries 60, reach 0.60/0.70, gap 0.48/0.36/0.30, far 6, squash 1.3. s는 몸 무더기에 쓰지 않는다.
- **R2**: `skirt-a/b`를 지웠다. 테두리 고리는 `cluster-s-a/b`다.
  - pitch 32/40, skip 0.15
  - inset(a, part) = max(12, hw·|cos a| + 4) + 3·J(i+580). 먼 테 실패 시 `skirt-low`, 그래도 실패하면 버린다.
  - prio 2, z flame, reduced 짝수만, minimal 0, jit 번호대 그대로.
  - ignite·gutter에서는 s의 ignite/gutter 장을 쓴다. `skirt-low`만 α 경사를 쓴다.
  - C7 2+줄이 0건이다.
- **R3**: 다섯 조각을 작은 무더기 문법으로 다시 그렸다. 대상은 `skirt-low`(30×18, 15,15, 칠한 높이 9.7), hero back(50×34, 25,29, 범위 [−22,−26]–[22,2]), hero front(범위 그대로), mob 3종(범위 높이 끝까지).
  - 혀 3~5개, 이웃 차 ≥ 15%
  - 돔과 검은 밑 띠 없음
  - 산호 띠의 먹 테 1.5~1.6
  - 무리마다 glow 하나
  - 빛 쪽 먹 1.4
  - 면적은 3.3 표대로 모두 통과했다. `SPEC.hero.clear.back = [-22,-26,22,2]`.
- **R4**: box 12×14, anchor 6,7, 칠한 크기 ≤ 4.94×6.90. 0~3번 장 산호 + glow 56.3~63.0%, 0~1번 장 glow 2.28~4.64 u², `embers.per` 12. 둥근 원판 없음. 먹 테는 §4.3-1을 본다.
- **R5**: `fire.rim` 맨 앞에 열 띠 [hostile, 6, −9, 0.35]를 넣었다. soot를 뺀 모든 상태와 minimal에서 그린다. r−6~r−4.8에는 원판이 보인다.
- **R6**: `char.per` 1400(min 2, max 10), 박스 44×22 그대로. 얼룩 모양만 꽉 차게 했다(초타원 지수 2.6 → 3.2).
  - char 단독 8.5~11.5%로 ok다.
  - 덮임 ≥ 40%는 §3.4대로 미달이다. 두 값을 `_.check()`(`AREA_RULES.fire`)에 넣었다.
- **R7**: 위 3.1의 명령을 모두 다시 돌렸다. C7 2+줄을 더했고, C9를 새로 냈고, 덮임·면적을 실측했다.
- **R8**: API를 고쳤다(§5 조각, §7 SPEC, §8.1 식과 inset, §10, §11, §12, §13).

#### 4.2 권장(§6)·공용 틀(§7)

- **glow 심 8~14%**: 반영했다. 실측 s 8.1~13.6, m 8.9~13.8, l 9.1~13.9다.
  - 주 심 폭에 변형별 계수를 곱하고, 모든 크기에 둘째 심을 둔다.
  - 규칙 상한도 14%로 맞췄다.
- **cluster-l-c**: 더하지 않았다(146장 유지). `k11-v2-r150-x1` 두 장에서 a/b + 반전 + 위상으로 같은 실루엣이 나란히 겹쳐 보이지 않았다. 큰 원의 문제는 반복보다 성김이다.
- **섬광 띠와 열 띠**: 4배로 확인했다(`k11-v2-c4-ignite-flash-x4`). 0.12초 동안 섬광 띠가 열 띠의 바깥 절반 위에 밝은 고리로 얹히고, 그 뒤 열 띠만 남는다. 충돌은 없다.
- **§7-1**: `rimDist(r, a, box, mode, u, o)` 하나로 묶었다.
  - `'rise'`(솟는 조각): R2 inset 식
  - `'ground'`(바닥 조각): 내접 타원 ≤ r − 2, 16점 보정 두 번
  - layout과 `_.check()`가 같은 함수를 쓴다.
- **§7-3**: `_.check()`에 종류별 면적 규칙을 넣었다(`AREA_RULES`: fire 덮임 ≥ 40%·char 5~15%, slow 웅덩이 25~35%, root 덩굴 ≤ 18%). slow·root 줄은 납품 2에서 그리면 붙는다.
- **§7-5**: C9를 다시 냈다.
- **§7-2·§7-4**: 납품 2 몫이다(전체 목록, bind의 C2b 1x 선확인).

#### 4.3 판단이 필요한 것·R 밖에서 바꾼 것

1. **불티 먹 테 0.45~0.78**(승인된 1.0~1.2보다 얇다). R4의 칠한 크기 ≤ 5×7과 산호 + glow ≥ 55%를 함께 지키려면 이 굵기여야 한다.
   - 1.0~1.2로 그려 재 보니 0~2번 장이 29.9~33.4%였고, 1번 장 glow는 0.24 u²였다(`k11-v2-ember-rim10`).
   - 둘 중 어느 쪽을 앞세울지 정해 주세요.
2. **`skirt-low`의 칠한 높이 ≤ 10**: 혀 끝 먹 3.2와 띠 높이를 빼면 혀 안에 산호가 거의 남지 않는다. 1x에서 "산호 띠 위의 검은 불꽃 끝"(먼 테의 낮은 불)으로 읽힌다.
   - 면적 규칙은 통과한다.
   - 더 불답게 하려면 높이 상한을 12로 올리거나 손 그림이 필요하다.
3. **작은 숯불 바닥의 빛 점을 하나로 줄였다**(ignite 0번 장, gutter 2·3번 장). 빨간 타원 안의 빛 두 점이 1x에서 눈처럼 읽혔다(§1.9 금지).
   - 첫 납품의 ignite·gutter 조각(수용된 것)이 이만큼 바뀐다.
4. **glow 조정 중에 m·l 무더기의 0번 장 칠한 높이가 약 2 늘었다**(m 32.5 → 34.4, l 43.8 → 45.8). l 먹 테도 2.2/3.0에서 2.4/3.2로 굵어졌다.
   - 박스·앵커·layer는 그대로이고 C7 1줄 0건이다.
5. **hero front glow를 [0.55, 0.26]으로 작게 했다**(기본 [0.6, 0.3]).
   - 장화 쪽으로 넓히지 않고 산호 ≥ 30%를 지키려고 했다. 주 혀는 대신 위로 키웠다(12.8 / 11.4, y −15까지).
   - hurt0 최저 61.9%로 60% 선에 가깝다.
6. **불티·연기는 몸 무더기(prio 0)에서만 나온다.** 테두리 고리 s 무더기는 뺐다. 불티 수식 r/12가 몸 무더기 기준이라서다.

### 5. 메인 세션이 할 일 (검수 2차 합격 뒤)

1. **등록·굽기**
   - `scripts/build-atlas.mjs:11` `KIT_FILES`의 `k-env.js` 바로 뒤에 `'k-hazards.js'`를 넣는다.
   - `art/atlas-spec.mjs` `PACKS`에 `hazards: { page: 'assets/packs/hazards/atlas', frames: [{ hazards: true }] }`를 더한다.
   - 펼치기: group fire·hero·mob → `parts(g)` → 각 frame마다
     - key `hazard/<group>/<part>/<frame>`
     - call `['PN.hazards.stamp', group, part, { frame }]`
     - box `p.box`, anchor `p.anchor`, `scale: 1`, `COLOR_MAP` 적용
   - 146장이고 @2x 약 78만 px²라서 2048² 한 장이다.
   - **테두리 고리는 `hazard/fire/cluster-s-*`(ignite·gutter 포함) 키를 쓴다. `skirt-a`/`-b` 키는 없다.**
2. **애니메이션·재생 값**
   - `hazard/<group>`: loop fps 12
   - prog: `cluster-*-ignite` 0.25초, `-gutter` 0.5초
   - cycle: `ember-*` 0.7초(±0.2), `smoke-*` 1.0초(±0.15)
   - still 없음
3. **매니페스트**: `hazards = { spec: SPEC, parts, states, vectors }`. vectors는 위 3.2의 새 C9 벡터 세 개와 불티 벡터다.
4. **렌더러(첫 납품 대비 바뀐 점)**
   - layout을 R1·R2·R6 식으로 옮긴다. `rimDist` 'rise'는 parts의 box로 계산하고, 먼 테 실패 시 `skirt-low` → 버림 순서를 따른다(API §8.1).
   - `fire.rim` 첫 행(열 띠 α 0.35)을 먹 테 아래에 그린다. soot를 뺀 전 상태, 전 LOD다.
   - 불티·연기 슬롯은 prio 0 항목에서만 낸다. `embers.per`는 12다.
   - `skirt-low`만 ignite·gutter α 경사를 쓰고, 고리의 s 무더기는 prog 장을 쓴다.
   - 상한을 줄이는 순서는 테두리 고리 → 그을음 → (몸 무더기 1개는 끝까지)다.
   - 주인공 back의 칠할 수 있는 범위가 [−22,−26,22,2]로 바뀌었다.
   - `hazardArt.test.ts`는 새 벡터로 이식 결과를 시험한다.
5. **나머지**: 첫 납품서 §5와 검수 1차 §8의 등록 주의(종류별 켜기는 fire만, FX-03 교체, 두 번 나눠 그리기, soot 기억, 성능 확인)는 그대로다.
   - 한 지형 항목 수가 늘었다: r98 27~28, r150 36(상한).

### 6. 알려진 한계

- **덮임 ≥ 40% 미달**(§3.4): R 숫자를 그대로 두었고, 결정이 필요하다.
- **큰 원(r150)은 성기다**(덮임 약 19%). 첫 요청("불씨 몇 개 있는 어두운 원")에 가장 가까운 남은 곳이다.
- **`skirt-low`**는 높이 ≤ 10 안에서 표현이 제한된다.
- **불티 먹 테**는 판단이 필요하다(§4.3-1).
- **달리기 큰 걸음 장**(run 0·4)에서 장화가 14~23%만 보인다(승인된 예외).
- **정지 렌더로 판단하지 못한 것**: 2Hz 물듦과 루프 움직임. 통합 뒤 `test:visual`로 본다.
- **사람 원화가 몫**: 불길 붓 실루엣과 비백, 숯불 바닥·그을음의 비백, 낮은 불길(특히 skirt-low), 불티·연기 붓질. 정식 판독 시험(n ≥ 8)은 하지 않았다.
- **납품 2 몫**: 6종, bind 오버레이, `kinds`/`groups`/`states` 전체 목록, C2b·C2c·C4-misc·C5.

---

## 검수 2차: K11 납품 1 수정판 `1.0-d1r1` (art-director, 2026-10-16)

### 판정: **수정 후 합격**

- **그림(조각)은 합격이다.** R1~R5의 그림 처방이 모두 들어갔다.
  - 반경 50~74 원은 1x, 0.8x, 흑백에서 '불길이 들어찬 바닥'으로 읽힌다. 메인 세션 관찰과 같다.
  - 결은 분홍으로 물든다. 코트 양옆과 장화에 불길이 보이고, 불티는 산호색으로 보인다.
  - 테는 99% 이상 보이고, 바뀌면 안 되는 출력은 그대로다.
- **고칠 것은 배치(layout) 규칙과 숫자다.**
  - 큰 원이 성긴 것은 구조 문제다. 개수(r/16)와 간격(0.36r)은 r에 비례하는데 넓이는 r²로 는다. 첫 자리 맞춤 난수 배치라 구멍도 남는다.
  - 맵 불 반경은 `60 + 난수×38`로 연속값이다(`/Users/kyuukkang/CT_AX/07.playground/src/game/GameEngine.ts:1987`). 그래서 맵 불의 절반(79~98)이 성긴 쪽에 든다.
- **처방 S1~S6은 조각을 다시 그리지 않는다.** 바뀌는 조각은 skirt-low 삭제 하나다.
  - 숫자는 내 시안에서 쟀다. 시안은 납품 조각에 킷 `layoutFire`를 그대로 옮긴 코드를 쓰고, 규칙만 바꿨다.
  - 시안이 납품 배치를 그대로 재현하는지 확인했다. 실제 `draw`의 빈 자리 값과 같았다(r98 46/46/52, r74 32/28/38).
  - 반경 50~98(4 간격)과 150, seed 5개(1·7·23·42·99)로 쟀다.
  - 파일은 고치지 않았다. SPEC은 리뷰 시트 메모리 안에서만 바꿨다.
- **납품 2 시작 전에 S1~S6을 공용 틀에 먼저 넣는다.** §7의 scatter 도우미는 납품 2의 웅덩이·물결·덩굴 배치에도 쓰인다.
  - 따로 검수 3차를 하지 않는다. 납품 2 첫 보고에 S6의 숫자와 렌더를 붙이면 내가 대조한다.
  - 기대값에서 ±3 넘게 벗어날 때만 다시 본다.

### 1. 합격선(검수 1차 R7) 대조

| 항목 | 내 확인 | 판정 |
|---|---|---|
| T2-b 데미지 느낌(1x·0.8x) | 근거 렌더: `k11r2-c2a-ch1-x1`, `-hero-scene-x3`(3배), `-c2a-ch5-x08-gray`. 코트 분홍, back 불길이 코트 양옆에, front 불길이 장화에, 산호 불티. 흑백에서 결이 가장 밝은 덩어리다 | 충족. 2Hz 물듦 움직임은 미확인 |
| T2-c 불이 들어찬 바닥 | r50~74는 충족한다(빈 자리 ≤ 38). r86~98은 부분 충족이다(빈 자리 46~56, `k11r2-r98-variants-a` 1x). r150은 미충족이다(빈 자리 71~95) | S1·S3로 고침 |
| 덮임 ≥ 40%(엄격 정의) | `k11r2-selfcheck`: 납품서와 같은 11건 미달 | 정의와 선을 바꾼다(§2) |
| 테 둘레 보임 ≥ 80% | 전체 99.6~100%, 먼 테 99.2~99.8%(`k11r2-mock-farin-eval`) | 충족 |
| 상한 72/40/20, 36/22/5 | r150이 36에 닿는다 | 충족 |
| C8 | `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045`(`k11r2-c8-unchanged`) | 충족 |
| `_.check({areas:false})`, 장 수 | 0건, 146장 | 충족 |
| C4-fire | `k11r2-c4-fire-x2`: ignite·gutter·soot 진행, 작은 숯불 바닥의 빛 점 하나 | 충족 |
| C1·C6·C7·C10·C12 | 납품서 원문을 받아들였다. 내가 다시 돌리지는 않았다 | 미확인(납품서 값 수용) |

### 2. 판단 1: 덮임, 안 B·M·N, r98·r150

**세 안 평가**
- **B(열 띠를 덮임에 셈): 정의로는 채택한다.**
  - 열 띠는 R5가 일부러 그린 '달아오른 가장자리'이고 화면에서도 그렇게 읽힌다.
  - 그러나 B만으로는 그림이 바뀌지 않는다. r86~98의 빈 자리(46~56)가 그대로 남는다.
- **M(B + `cluster.big` 96): 불채택.**
  - 납품서 표에서 K의 r98 엄격 덮임은 31.4~32.2다. A(30.7~33.2)와 같다.
  - 띠를 세서 통과할 뿐 그림은 그대로다.
- **N(rim pitch 26/32 + `cluster.per` 13): 불채택.**
  - 이미 잘 읽히는 r50~74만 더 채운다(r50 항목 13~15).
  - r98 빈 자리는 45·46·45로 거의 그대로다(`k11r2-holes-table-1`).
  - r98 항목이 32~34로 상한 36에 붙는다.

**결정**
- 덮임 정의는 B로 한다.
- 합격선을 **덮임(B) ≥ 45% + 빈 자리 지름 ≤ 44**로 바꾼다. 덮임 비율만으로는 구멍과 뭉침을 잡지 못한다.
- 숫자는 S1~S3의 새 배치 규칙으로 맞춘다.
- 근거:
  - 지금 배치(A)에서 1x로 잘 읽힌 반경은 덮임(B) ≥ 47, 빈 자리 ≤ 38이었다.
  - 성겨 보인 r86~98은 덮임(B) ≤ 42, 빈 자리 ≥ 46이었다.

**측정 (step 2, seed 5개의 최소·최대, 렌더 `k11r2-mock-eval-2`, `-eval-5`)**

| r | A 몸 수 | A 덮임(B) 최소 | A 빈 자리 최대 | 새 몸 수 | 새 덮임(B) 최소 | 새 빈 자리 최대 | 새 항목 수(full) |
|---|---|---|---|---|---|---|---|
| 50 | 3 | 48.5 | 29 | 3 | 52.5 | 28 | 13 |
| 54 | 3 | 44.3 | 33 | 3 | 48.3 | 32 | 13 |
| 62 | 3~4 | 46.8 | 34 | 4 | 53.2 | 31 | 16 |
| 66 | 3~4 | 44.6 | 37 | 4 | 49.3 | 40 | 17 |
| 70 | 3~4 | 42.5 | 44 | 5 | 54.4 | 29 | 20 |
| 74 | 5 | 47.3 | 38 | 5 | 51.2 | 30 | 21 |
| 78 | 5 | 45.0 | 41 | 6 | 50.6 | 34 | 23 |
| 82 | 5 | 42.4 | 45 | 7 | 51.0 | 34 | 25 |
| 86 | 5 | 42.0 | 49 | 7 | 47.8 | 38 | 26 |
| 90 | 6 | 42.0 | 49 | 8 | 48.0 | 40 | 28 |
| 94 | 6 | 40.9 | 51 | 9 | 47.6 | 40 | 30 |
| 98 | 6 | 38.2 | 56 | 10 | 47.3 | 41 | 32 |
| 150 | 9 | 24.0 | 95 | 16 | 29.7 | 77 | 36 |

- 새 규칙의 엄격 정의 덮임은 33.5~45.7%다. 합격선에는 넣지 않고 보고만 한다.
- 1x 비교 렌더(1x에서 과밀하지 않다):
  - `k11r2-mock-q1-x1`: A와 새 규칙, r62·70·82·90·98
  - `k11r2-mock-q1far-x1`: 먼 테 처리 전후
- 고른 배치(최선 후보 6)는 효과가 있다. 같은 개수에 무작위 배치만 쓰면 r98 빈 자리가 49였다(`k11r2-mock-eval-3`, Q1nb).

**r150**
- 한 지형 상한 36과 조각 비확대 원칙 때문에 r50~98과 같은 밀도는 낼 수 없다.
- S3(몸 16, 그을음 4, 고리 고르게 솎기)로 덮임(B)을 24 → 29.7, 빈 자리를 95 → 77로 올린다(`k11r2-mock-r150-x1`, `-r150-hole-x1`).
- 이 원은 원형 붕괴의 가운데 코어다(`GameEngine.ts:4403-4418`). 반경 68 조각 여러 개와 함께 나오므로, 실제 모습은 화면당 상한 72가 정한다(§8-4).
- 그래서 r ≥ 100은 따로 정한 '허용 한계' 선(덮임(B) ≥ 27%, 빈 자리 ≤ 84)을 둔다. 최종 판단은 메인 세션의 보스 장면 캡처로 한다.

### 3. 판단 2: 불티 먹 테 0.45~0.78 → **수용**
- Q11(1.5)과 R4(1.0~1.2)의 승인 예외로 API §13에 적는다.
- 근거:
  - 8배(`k11r2-skirtlow-x8`)와 4배(`-zoom-top-r98-x4`)에서 불티는 테가 보이는 산호 불꽃 조각으로 읽힌다.
  - 어두운 원판 위에서 불티를 갈라 주는 것은 먹 테가 아니라 산호와 glow다.
  - 1x에서 '검은 티끌'이 되던 실패를 고친 R4(산호 + glow ≥ 55%)가 우선이다.
- 조건은 그대로다: 칠한 크기 ≤ 5×7, 0~1번 장 glow 심, 둥근 원판 금지.

### 4. 판단 3: `skirt-low` 높이 → **12로 올리지 않는다. layout에서 빼고 조각을 지운다(S2·S5)**
- 8배에서 skirt-low는 '산호 받침 + 검은 왕관'이다. 1x에서는 테 위의 빨간 입술·이빨로 읽힌다(`k11r2-zoom-top-r98-x4`).
- 높이 12로 올려도 30×18 조각이라 s 무더기와 같은 문법이 되기 어렵다.
- 대신 먼 테에서 s 무더기를 1단위씩 안으로 옮긴다(최대 r − 24).
  - 인셋 22면 어느 각도에서도 먼 테 규칙(끝 ≤ 먼 테 + 6)이 성립한다. 그래서 skirt-low는 다시 쓰이지 않는다.
  - 실측(`k11r2-mock-farin-eval`): 테 둘레 보임 전체 99.5~99.8%, 먼 테 99.0~99.5%, skirt-low 0개(r50~98, seed 3개).
- 둘레 전체가 같은 불길 문법이 되고, 먼 테의 불끝이 테에 닿는 3/4 시점 모습이 된다(`k11r2-mock-q1far-x1` 아랫줄).

### 5. 판단 4: R 밖에서 바꾼 것 → **모두 수용**

| # | 내용 | 판정 |
|---|---|---|
| 1 | 불티 먹 테 0.45~0.78 | 수용(§3) |
| 2 | skirt-low 높이 ≤ 10 | S5로 대체(조각 삭제) |
| 3 | 작은 숯불 바닥(ignite 0번 장, gutter 2·3번 장)의 빛 점 하나 | 수용. §1.9 눈 금지와 맞다. `k11r2-c4-fire-x2` 확인 |
| 4 | m·l 0번 장 높이 +2, l 먹 테 2.4/3.2 | 수용. 박스·앵커·layer가 그대로다. 먼 테 판정은 앵커 높이(52/39)로 하므로 칠한 높이 48.1은 안전하다 |
| 5 | hero front glow [0.55, 0.26], 주 혀를 위로 | 수용. hurt0 장화 61.9%는 60% 선에 가깝다. 앞으로 front를 키우는 변경은 hurt ≥ 60%를 다시 잰다 |
| 6 | 불티·연기는 몸 무더기(prio 0)에서만 | 수용. S1로 몸 무더기가 늘어 출처가 더 고르게 퍼진다. 불티 수(r/12)는 그대로다 |
| 추가 | char 초타원 지수 2.6 → 3.2, glow 심 변형별 계수와 둘째 심 | 수용 |

### 6. 고칠 것 (`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`, API-hazards.md)

**S1 몸 무더기: 넓이 비례 개수 + 최선 후보 배치**
- 바꿀 곳: `SPEC.fire.layout.cluster`(:150), `layoutFire` 몸 부분(:672-682).
- `per`, `reach[]`, `gap[]`, `wideOver`, 기존 jit 번호를 아래로 바꾼다:
  ```
  cluster: { area: 1000, min: 3, max: 10, maxBig: 16, big: 100, minimal: 3, tries: 60, cand: 6,
             reach: { frac: 0.6, pad: 30 }, gap: { frac: 0.48, cap: 28 }, far: 6, squash: 1.3, fallbackY: 0.2,
             jit: { base: 3000, stride: 5 } }
  ```
- 그대로 두는 것: `fire.size.m` 56(m/l 경계).
- 식(렌더러가 그대로 옮긴다, `J(i) = jit(seed, i)`):
  ```
  const C = SPEC.fire.layout.cluster, size = r < SPEC.fire.size.m ? 'm' : 'l', P = part('cluster-' + size + '-a');
  const nc = clamp(Math.round(r * r / C.area), C.min, r >= C.big ? C.maxBig : C.max);
  const reach = Math.max(C.reach.frac * r, r - C.reach.pad), gap = Math.min(C.gap.frac * r, C.gap.cap);
  for (let k = 0; k < C.tries && out.length < nc; k++) {
    let best = null, bestS = -Infinity;
    for (let c = 0; c < C.cand; c++) {
      const ix = C.jit.base + (k * C.cand + c) * C.jit.stride;
      const a = TAU * J(ix), d = reach * Math.sqrt(J(ix + 1)), x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (!farOK(x, y, P.anchor[1])) continue;
      if (d > rimDist(r, a, P.box, 'rise', 0)) continue;           // 옆 테 닿음 방지(새 규칙)
      const s = out.length ? Math.min(...out.map((q) => Math.hypot(q.x - x, C.squash * (q.y - y)))) : -Math.hypot(x, y);
      if (s > bestS) { bestS = s; best = { x, y, ix }; }
    }
    if (!best || (out.length && bestS < gap)) continue;
    out.push({ part: 'cluster-' + size + '-' + (J(best.ix + 2) < 0.5 ? 'a' : 'b'), x: best.x, y: best.y,
               flip: J(best.ix + 3) < 0.5, phase: J(best.ix + 4), z: 'flame', prio: 0, gen: k });
  }
  // 하나도 못 놓으면 지금의 fallback(0, fallbackY·r)
  ```
- 결과 몸 수: r50~58은 3, r60~66은 4, r68~74는 5, r78은 6, r82·86은 7, r90은 8, r94는 9, r98은 10, r150은 16이다.
- minimal은 생성 순서의 앞 3개다. 첫 개가 중심 쪽이라 고르게 남는다.

**S2 고리의 먼 테 처리(`rim`, :151, :684-698)**
- `low` 키를 지우고 `farIn: 24`를 더한다.
- 먼 테 규칙에 걸리면 같은 각도로 1단위씩 안으로 옮긴다(dd = d−1, d−2, …, r − farIn). 처음 통과하는 자리를 쓰고, 끝까지 안 되면 버린다.
- reduced(짝수 i), minimal 0, jit 번호대는 그대로다.

**S3 상한 솎기와 큰 원(:152-153, :707-714)**
- 같은 지형이 상한을 넘으면 먼저 고리를 **고르게** 뺀다.
  - 고리를 생성 순서로 놓는다(n개, 뺄 수 nd = min(n, 넘친 수)).
  - `Math.floor((j + 0.5) * n / nd)`번째(j = 0..nd−1)를 뺀다.
  - 지금처럼 '나중에 만든 것부터' 빼면 한 구간(오른쪽 위)이 통째로 빈다.
- 그래도 넘으면 지금 규칙을 쓴다: char → 몸, 나중 것부터, 몸은 1개 남긴다.
- `char.maxBig: 4`(r ≥ 100), `cluster.maxBig: 16`. 상한 36/22/5는 그대로다.

**S4 합격선(`_.check()`, `AREA_RULES.fire`)**
- 덮임(B) = (불길 조각 ∪ char ∪ 열 띠 [r−12, r−6]) / πr²이다. 조건: full, t = 0, seed 1·7·23.
  - 선: **≥ 45%**
  - 반경: 50, 54, 58, 60, 62, 66, 68, 70, 74, 78, 82, 86, 90, 94, 98
  - 격자: 게임 반경 50·60·68·74·98은 step 1, 나머지는 step 2
- 빈 자리 = r − 12 안에서, 불길 조각(몸·고리)이 칠하지 않은 점만으로 된 가장 큰 원의 지름이다. char는 빈 것으로 본다.
  - 선: **≤ 44**
  - 계산: step 2 격자에 불길 칠함을 표시하고 거리 변환(Felzenszwalb 1D 제곱 EDT를 열→행으로)을 한다. 값은 `max_p min(dist(p), (r−12) − |p|) × 2`다.
- r150: 덮임(B) ≥ 27%, 빈 자리 ≤ 84. 허용 한계 선이다.
- char 단독 5~15%는 그대로다. 엄격 덮임은 보고만 한다.
- 기대값은 §2 표의 '새' 열이다. 내 값은 DOM 맨 위 요소 판정이라 `fireCover`보다 1~3 낮게 나온다.

**S5 skirt-low 삭제의 뒤처리**
- `PARTS`에서 `skirt-low`를 지운다.
- `drawFire`의 `skirtA` 분기(:794, :800-803)를 지운다.
- SPEC의 `ignite.skirtAlpha`, `gutter.skirtFade`·`skirtAlpha`, `rim.low`를 지운다.
- `_.check()`의 낮은 불길 면적에서 skirt-low를 지운다.
- 결과: 140장, 박스 넓이 합 192,368(−3,240).
- hero·mob의 `lowFlames`는 그대로 쓴다.

**S6 다시 돌릴 것과 보고할 것**
- 명령:
  - C1, C7. 2줄에 '몸 무더기가 `rimDist(r, a, box, 'rise', 0)`보다 바깥 = 0'을 더한다.
  - C9 새 벡터: fire:50:1, 74:7, **98:7(신설)**, 150:23과 불티 슬롯
  - C12(140장)
  - `_.check()` 0건
- 렌더:
  - C2a 1장 1x
  - 5장 0.8x 흑백
  - r98 seed 1·7·23 1x, r150 1x
  - T2-d 재측정
- 표: §2와 같은 반경별 표(몸 수, 항목 수, 덮임(B), 엄격, 빈 자리)

### 7. 납품 2 전에 공용 틀에 더 고칠 것
1. **`scatter()` 도우미 하나로 묶기.** S1의 식을 종류 무관하게 만든다.
   - 매개: 넓이당 개수, 후보 수, reach(frac, pad), gap(frac, cap), 조각 box
   - 거르기: rise면 farOK + rimDist 'rise', ground면 rimDist 'ground'
   - 감속 웅덩이, 물결, 덩굴, 덫 리벳 외 흩는 것이 모두 쓴다. 뭉침과 구멍이 같은 방식으로 막히고, 렌더러 이식도 한 번이면 된다.
2. **`rimPlace()`**: rimDist + farIn 안쪽 탐색을 묶는다. 테에 붙는 솟는 조각(덩굴 등)이 쓴다.
3. **`capCut()`**: S3의 고른 솎기를 모든 종류의 한 지형 상한에 쓴다.
4. **`_.measure` 일반화**: 종류별 '채움 조각' 마스크로 덮임과 빈 자리를 낸다.
   - 납품 2는 웅덩이 25~35%, 덩굴 ≤ 18%에 더해 빈 자리 최대값을 보고만 한다(합격선 아님). 1x에서 뭉쳐 보이면 그 숫자로 고친다.
5. 검수 1차 §7-2(마지막 납품에서 `kinds`·`groups`·`states` 전체 목록)와 §7-4(bind 오버레이를 C2b 1x로 먼저 확인)는 그대로다.

### 8. 메인 세션 등록 때 주의할 것
1. **순서**: layout 이식과 `hazardArt.test.ts`는 S1~S5가 들어간 판(새 C9 벡터)을 받은 뒤에 한다.
   - 굽기도 skirt-low가 빠진 140장으로 한 번에 한다.
   - 키는 `hazard/fire/cluster-s-*`(고리, ignite·gutter 포함)다. `skirt-*` 키는 없다.
2. **layout 이식**:
   - S1의 최선 후보 배치는 60 × 6 후보 × 최대 16개 거리 계산이다.
   - 지형 id로 한 번 계산해 캐시하고, reduced·minimal은 같은 결과를 걸러서 쓴다(짝수 고리, char 절반, 앞 3개 몸).
   - Electron과 킷이 같은 V8이라 부동소수 결과가 같다. C9 벡터로 시험한다.
3. **ignite·gutter**: 고리 s 무더기도 prog 장을 쓴다. α 경사 규칙은 없어졌다.
4. **화면당 상한(72/40/20) 배분**: 지형마다 앞에서부터가 아니라 prio 등급으로 나눈다.
   - 모든 불의 몸 → char → 고리 순이다.
   - 고리는 지형마다 고르게 솎는다(S3와 같은 식). 그래야 어떤 불은 꽉 차고 어떤 불은 맨바닥이 되는 일이 없다.
5. **볼 장면**(성능 + `test:visual`):
   - 맵 불 2~4개(반경 60~98 섞임)
   - 원형 붕괴: r150 코어 + 반경 68 조각 여러 개, `GameEngine.ts:4403-4418`
   - 불길 레인: `:4394-4402`, stress에서 21개
   - 두 보스 장면에서 상한 72 때문에 고리가 거의 사라질 수 있다. 지형 비용 ≤ 0.5ms, work p95 ≤ 8ms를 재 보고 판단한다.
     - 여유가 있으면 불 상한을 96~120으로 올린다(전체 160 안에서).
     - 여유가 없으면 고리 없는 모습을 받아들인다.
   - 항목 수가 늘었다: r98 32, r82 25, r70 20.
6. **흑백 0.8x 확인**: r98 불 안의 결이 여전히 가장 밝은 덩어리인지 본다. 몸 무더기가 10개로 늘어 glow 심과 종이 핫스폿이 많아진다.
7. **FX-03 교체, 두 번 나눠 그리기, soot 기억, 종류별 켜기는 fire만**: 검수 1차 §8 그대로다.
8. API §13에 불티 먹 테 0.45~0.78 승인 예외를 기록한다.

### 9. 본 렌더와 확인하지 못한 것
- 렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 이름은 모두 `k11r2-*`이고 전부 Read로 열어 봤다.
  - 장면: `c2a-ch1-x1`, `c2a-ch5-x08-gray`, `hero-scene-x3`, `mob-scene-x3`, `zoom-top-r98-x4`, `skirtlow-x8`, `c4-fire-x2`
  - 안 비교: `variants-x1`, `r98-variants-a`, `r150-variants-x1`, `mock-q1-x1`, `mock-q1far-x1`, `mock-r150-x1`, `r150-hole-x1`
  - 숫자: `cover-table-1`, `holes-table-1`, `mock-eval-1`~`-5`, `mock-farin-eval`, `selfcheck`, `c8-unchanged`
  - 코드 확인: `spec-dump`, `src-probe`, `src-cover`, `underscore`
- 미확인:
  - 새 규칙을 킷이 구현했을 때 `fireCover` step 1 값(내 값은 시안 기준)
  - r150의 테 둘레 보임
  - 2Hz 물듦과 루프 움직임
  - 성능
  - 화면당 상한 아래 보스 장면의 실제 모습
  - C1·C6·C7·C10·C12 재실행(납품서 값 수용)
  - 납품 2 항목

---

## 1차 수정 2회차 납품서 — 배치 규칙 S1~S5 + 공용 틀 도우미 (`1.0-d1r2`)

검수 2차의 S1~S5와 §7 공용 틀 도우미를 넣었고, S6 검사를 모두 돌렸습니다.

- **결과**
  - `PN.hazards._.check()`는 0건입니다(새 합격선: 덮임 B ≥ 45%, 빈 자리 ≤ 44, r150 허용 한계 27%/84 포함).
  - 반경별 표는 검수서 §2 '새' 열과 모든 줄에서 ±3 안입니다. 표시할 줄이 없습니다.
- **조각**: 140장, 박스 넓이 합 192,368입니다(`skirt-low` 6장 삭제). 다른 그림 조각은 그대로입니다.
- **검사**
  - C1·C3·C4-fire·C2a(2장)·r98·r150 렌더의 `--check`가 모두 ok입니다.
  - C6 0/0, C7 추가 줄 포함 0건(3·4줄은 납품 2 항목뿐), C10 ok, C12 `frames=140 ok boxArea=192368 ok badDrive=0`입니다.
  - C8 기준 해시 그대로, C11 40장 ok, kit error 0건입니다.
- **고친 파일은 둘뿐입니다**. 아무것도 내려받지 않았습니다.
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-hazards.md`

렌더 폴더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`이고, 이번 이름은 `k11-v3-*`입니다.

---

### 1. 바뀐 것

**S1 몸 무더기**(`SPEC.fire.layout.cluster`)
- 키를 검수서 그대로 바꿨다: {area 1000, min 3, max 10, maxBig 16, big 100, minimal 3, tries 60, cand 6, reach {frac 0.6, pad 30}, gap {frac 0.48, cap 28}, far 6, squash 1.3, fallbackY 0.2, jit {base 3000, stride 5}}.
- 식은 검수서 코드와 같고, 공용 `scatter()`로 옮겼다(아래 §7).
- 몸 수는 검수서 예상과 모두 같다: r50~58 3, r60~66 4, r68~74 5, r78 6, r82·86 7, r90 8, r94 9, r98 10, r150 16.

**S2 고리의 먼 테**
- `rim.low`를 지우고 `farIn: 24`를 더했다.
- `rimPlace()`가 d = d0 − k(k = 0, 1, 2…, d ≥ r − 24)에서 먼 테 규칙을 처음 지키는 자리를 쓰고, 없으면 버린다.
- 15개 반경 × seed 5개에서 skirt-low는 0개다(C7).

**S3 상한 솎기**
- `capCut()`이 상한을 넘을 때 고리를 생성 순서에서 ⌊(j + 0.5)·n/nd⌋번째로 고르게 뺀다.
- 그래도 넘치면 char → 몸 순으로, 나중 것부터, 몸 1개를 남기고 뺀다.
- `char.maxBig 4`(r ≥ 100)를 넣었고, 같은 문턱을 SPEC만 보고 쓰도록 `char.big 100`도 두었다.
- 실측: r150 full = 몸 16 + 고리 16 + char 4 = 36, reduced = 16 + 4 + 2 = 22.

**S4 합격선**(`AREA_RULES.fire`, `_.check()`)
- 덮임(B) = (불길 조각 ∪ char ∪ 열 띠 [r−12, r−6]) / πr² ≥ 45%. full, t = 0의 장, seed 1·7·23, 반경 15개다.
- 격자는 게임 반경 50·60·68·74·98은 1, 나머지는 2다.
- 빈 자리 ≤ 44다. step 2 마스크, 제곱 EDT(Felzenszwalb, 열 → 행), 2·max min(√D·2, (r−12) − |p|)로 잰다. char는 빈 것으로 본다.
- r150은 덮임(B) ≥ 27%, 빈 자리 ≤ 84다. char 5~15%는 반경 15개에만 적용한다. 엄격 덮임은 보고만 한다.

**S5 skirt-low 삭제**: 조각, `SKIRT`, stampBody 분기, `drawFire`의 α 경사, SPEC `ignite.skirtAlpha`·`gutter.skirtFade`·`skirtAlpha`·`rim.low`, 검사의 skirt-low 줄을 지웠다. 140장, 192,368이다.

**불티 먹 테 0.45~0.78**: API §13-1에 Q11·R4 승인 예외로 적었다(조건: 칠한 크기 ≤ 5×7, 0~1번 장 glow 심, 원판 금지).

### 2. §7 공용 틀 도우미 (불 layout이 쓴다. 식은 API §8.0)

| 도우미 | 하는 일 |
|---|---|
| `scatter(r, seed, o)` | 넓이당 개수를 받아 최선 후보로 흩는다. 'rise'는 farOK + rimDist 'rise', 'ground'는 rimDist 'ground'로 거른다. 놓은 순서와 jit 위치 ix를 돌려주고, 부르는 쪽이 J(ix+2..4)로 변형·flip·phase를 뽑는다 |
| `rimPlace(r, a, box, tip, u, o)` | rimDist + farIn 안쪽 탐색 |
| `capCut(items, cap, o)` | 고른 솎기 + prio·gen 잘라내기({even, keep}) |
| `areaOf(kind, r, seed, {step, holeStep, t})` | `_.measure` 일반화. 종류별 `MASKS`(fill 판정, 띠 행, inset)로 {cover(B), strict, fill, ground, hole, n, body}를 낸다. 지금은 fire 마스크만 있고, 납품 2는 마스크만 더하면 된다 |

`_`에 `areaOf`, `scatter`, `rimPlace`, `capCut`을 내보냈다. `fireCover`는 `areaOf`로 대체했다.

### 3. 검사 출력 원문

**C7**(`k11-v3-c7-geometry`, RC.back [−22,−26,22,2], 2줄 추가 둘):
```
1 stamps outside box-3: 0
2 bases outside r-6: 0 | ground items over r-2: 0 | tips over far rim+6: 0 | over per-hazard cap: 0
2+ rim ring items closer to the rim than inset(a, part): 0 | skirt-low items: 0
2+ body clusters outside rimDist(r, a, box, rise, 0): 0
3 paths outside: 9 shock no cracks shock no cracks shock no cracks null no ghost
4 overlays outside their rects: 24 bind-back@0f1 bind-back@0f-1 bind-back@0.1f1 bind-back@0.1f-1 bind-back@0.2f1 bind-back@0.2f-1
5 hero ember paths through the face zone (outward drift): 0
6 invalid calls ok
```

**C8**: `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045`

**C12**:
```
frames=140 ok boxArea=192368 ok badDrive=0
(행은 1회차 표에서 fire/skirt-low 한 줄만 빠졌다. cluster s·m·l a·b 루프·ignite·gutter, char·char-cold a~d, ember·smoke a·b, hero back·front, mob front-12·19·28)
```

**`_.check()`**(`k11-v3-selfcheck`):
```
PN.hazards._.check(): 0 issue(s) (16 s), version 1.0-d1r2
PN.hazards._.check({areas:false}): 0 issue(s)
```

**C10**: 1회차와 같은 값으로 모든 줄 ok다(fire 1.78~1.82, soot 1.34~1.36, coat Y 0.620/0.780/0.705).

**C9 새 벡터**(`k11-v3-c9-vectors` 원문, 읽기용 `-c9-read-50-74`, `-c9-read-98`, `-c9-read-150`). 필드는 [part, x, y, flip, phase, z, prio]다:
```
fire:50:1 (11)
["char-d",7.36,-22.66,1,0,"ground",1] ["char-b",15.45,3.86,1,0,"ground",1]
["cluster-s-a",-14.15,-25.44,1,0.712,"flame",2] ["cluster-s-b",13.69,-25.24,1,0.177,"flame",2]
["cluster-m-b",1.63,-14.39,1,0.924,"flame",0] ["cluster-s-b",-31.65,-13.02,0,0.951,"flame",2]
["cluster-m-a",-28.77,4.37,1,0.632,"flame",0] ["cluster-s-a",-30.07,21.21,1,0.486,"flame",2]
["cluster-m-a",18.15,21.94,1,0.592,"flame",0] ["cluster-s-a",8.76,34.37,1,0.26,"flame",2]
["cluster-s-b",-10.13,34.74,0,0.725,"flame",2]

fire:74:7 (20)
["char-a",5.92,-44.64,1,0,"ground",1] ["char-d",-45.07,-13.09,0,0,"ground",1]
["char-a",9.62,-0.18,1,0,"ground",1] ["char-b",-10.14,27.61,0,0,"ground",1]
["cluster-s-a",0.02,-51.13,1,0.374,"flame",2] ["cluster-s-b",16.73,-49.07,0,0.135,"flame",2]
["cluster-s-a",-51.04,-30.53,1,0.148,"flame",2] ["cluster-l-b",-21.15,-16.62,1,0.058,"flame",0]
["cluster-s-b",55.17,-11.76,1,0.065,"flame",2] ["cluster-l-a",29.5,-3.35,0,0.138,"flame",0]
["cluster-s-a",-58.05,4.61,0,0.683,"flame",2] ["cluster-l-a",-42.88,5.14,1,0.637,"flame",0]
["cluster-l-b",-9.15,11.95,1,0.806,"flame",0] ["cluster-s-b",53.69,19.09,0,0.301,"flame",2]
["cluster-s-b",-52.79,22.78,0,0.218,"flame",2] ["cluster-l-a",13.03,33.52,0,0.347,"flame",0]
["cluster-s-b",47.29,37.46,0,0.766,"flame",2] ["cluster-s-a",-27.44,55.46,1,0.457,"flame",2]
["cluster-s-a",17.2,59.22,1,0.527,"flame",2] ["cluster-s-b",-7.89,59.75,0,0.992,"flame",2]

fire:98:7 (31, 신설)
["char-a",8.77,-66.06,1,0,"ground",1] ["char-d",61.98,-37.18,1,0,"ground",1]
["char-d",-66.7,-19.38,0,0,"ground",1] ["char-a",14.23,-0.27,1,0,"ground",1]
["char-d",-64.23,15.63,0,0,"ground",1] ["char-b",-15,40.86,0,0,"ground",1]
["char-c",29.62,42.43,0,0,"ground",1] ["cluster-s-b",-5.12,-74.99,1,0.065,"flame",2]
["cluster-s-a",53.06,-60.37,1,0.291,"flame",2] ["cluster-s-b",-61.65,-53.34,0,0.135,"flame",2]
["cluster-l-b",6.21,-49.16,1,0.222,"flame",0] ["cluster-s-b",68.57,-46.78,0,0.756,"flame",2]
["cluster-s-a",-72.75,-36.25,1,0.374,"flame",2] ["cluster-l-a",23.8,-30.29,0,0.012,"flame",0]
["cluster-l-b",-32.39,-25.45,1,0.058,"flame",0] ["cluster-s-a",79.84,-23.15,1,0.517,"flame",2]
["cluster-l-a",45.17,-5.13,0,0.138,"flame",0] ["cluster-l-b",-35.69,-4.05,0,0.97,"flame",0]
["cluster-l-a",-65.67,7.88,1,0.637,"flame",0] ["cluster-l-b",-14.02,18.31,1,0.806,"flame",0]
["cluster-s-b",77.98,20.85,0,0.301,"flame",2] ["cluster-l-a",57.07,23.43,0,0.514,"flame",0]
["cluster-s-a",-79.07,26.82,1,0.148,"flame",2] ["cluster-s-b",72.66,40.86,0,0.766,"flame",2]
["cluster-l-b",-37.74,48.66,1,0.511,"flame",0] ["cluster-l-a",19.95,51.33,0,0.347,"flame",0]
["cluster-s-a",-59.37,61.1,0,0.683,"flame",2] ["cluster-s-a",47.36,71.38,1,0.527,"flame",2]
["cluster-s-b",-41.54,72.54,0,0.218,"flame",2] ["cluster-s-b",22.41,81.24,0,0.992,"flame",2]
["cluster-s-a",1.57,85.86,1,0.457,"flame",2]

fire:150:23 (36, 고리를 고르게 솎음)
["char-c",-61.03,-85.12,0,0,"ground",1] ["char-b",93.63,-77.45,1,0,"ground",1]
["char-b",37.12,33.14,0,0,"ground",1] ["char-c",-76.56,39.01,0,0,"ground",1]
["cluster-s-a",3.18,-127.91,1,0.101,"flame",2] ["cluster-s-b",-72.2,-108.99,0,0.171,"flame",2]
["cluster-s-a",-93.45,-94.66,1,0.41,"flame",2] ["cluster-s-b",98.67,-90.48,0,0.792,"flame",2]
["cluster-l-a",36.17,-83.58,0,0.267,"flame",0] ["cluster-s-a",119.45,-64.86,0,0.553,"flame",2]
["cluster-l-b",-46.21,-61.15,1,0.099,"flame",0] ["cluster-l-b",9.58,-58.13,1,0.932,"flame",0]
["cluster-s-b",-122.36,-55.6,0,0.945,"flame",2] ["cluster-l-a",57.6,-43.53,0,0.053,"flame",0]
["cluster-l-a",93.11,-37.55,0,0.391,"flame",0] ["cluster-s-a",-132.76,-24.42,1,0.184,"flame",2]
["cluster-s-b",132.13,-17.57,0,0.018,"flame",2] ["cluster-l-b",-20.08,-9.3,1,0.725,"flame",0]
["cluster-l-b",80.14,-7.58,0,0.141,"flame",0] ["cluster-l-a",-116.31,11.73,1,0.64,"flame",0]
["cluster-l-a",105.21,13.29,0,0.472,"flame",0] ["cluster-s-b",132.55,17.41,0,0.885,"flame",2]
["cluster-l-b",-49.52,20.33,1,0.89,"flame",0] ["cluster-l-b",-12.31,29.99,1,0.764,"flame",0]
["cluster-l-b",80.03,35.23,0,0.222,"flame",0] ["cluster-l-a",-106.46,41.38,1,0.597,"flame",0]
["cluster-s-b",-123.89,49.1,0,0.254,"flame",2] ["cluster-s-a",119.3,64.54,1,0.646,"flame",2]
["cluster-l-a",54.88,76.54,0,0.307,"flame",0] ["cluster-l-b",-69.48,83.98,1,0.516,"flame",0]
["cluster-s-b",100.23,91.62,1,0.111,"flame",2] ["cluster-s-a",-96.64,98.19,1,0.493,"flame",2]
["cluster-s-b",-75.02,113.63,0,0.028,"flame",2] ["cluster-l-a",14.23,118.67,0,0.683,"flame",0]
["cluster-s-a",-45.73,129.74,1,0.563,"flame",2] ["cluster-s-b",3.61,136.79,0,0.802,"flame",2]
```

불티 슬롯 벡터(`k11-v3-c9-embers`), 필드는 [part, x, y, 장]이다:
- `_.emberSlots(50,1,0.3)` = [a 2.01,−46.27 f3] [b −31.13,−6.16 f0] [a 27.75,−5.9 f4] [b 4.78,−34.78 f2]
- `_.emberSlots(74,7,0.3)` = [a −22.19,−30.31 f1] [b 28.65,−38.22 f4] [a −42.58,−6.69 f0] [b −24.32,−24.97 f5] [a 15.18,13.28 f1] [b −18.42,−51.29 f4]
- `_.emberSlots(98,7,0.3)` = [a 5.17,−62.85 f1] [b 22.96,−65.17 f4] [a −32.09,−37.28 f0] [b 30,−42.05 f5] [a −33.54,−24.29 f1] [b −62.94,−26.8 f4] [a −15.69,−13.74 f3] [b 52.16,14.64 f0]
- `_.emberSlots(150,23,0.3)` = [a 36.48,−122.59 f4] [b −44.82,−77.38 f1] [a 11.83,−97.2 f5] [b 56.3,−68.26 f2] [a 92.89,−52.53 f1] [b −20.58,−45.41 f4] [a 76.04,−20.73 f0] [b −115.45,−26.41 f5]
- `_.heroEmberSlots(0.3)`는 바뀌지 않았다.

### 4. 반경별 표 (검수서 §2와 같은 방식: step 2, seed 1·7·23·42·99, full, t 0 — `k11-v3-table-step2`)

| r | 몸 | 항목(full) | 덮임(B) | 엄격 | char | 빈 자리 | 검수 '새' 덮임 최소 / 빈 자리 최대 | 차이 |
|---|---|---|---|---|---|---|---|---|
| 50 | 3 | 11~13 | 53.0~58.4 | 36.2~43.1 | 10.5~11.1 | 20.0~28.0 | 52.5 / 28 | +0.5 / 0 |
| 54 | 3 | 12~13 | 47.9~52.7 | 33.2~38.6 | 9.2~9.5 | 25.3~32.0 | 48.3 / 32 | −0.4 / 0 |
| 58 | 3 | 13~14 | 52.7~55.3 | 39.1~41.1 | 7.9~8.3 | 20.0~23.3 | — | |
| 60 | 4 | 15~16 | 54.6~58.9 | 41.4~45.0 | 11.0~11.5 | 20.4~28.3 | — | |
| 62 | 4 | 15~16 | 52.5~56.7 | 39.7~43.3 | 10.1~10.9 | 24.3~31.2 | 53.2 / 31 | −0.7 / +0.2 |
| 66 | 4 | 16~17 | 48.9~54.9 | 36.0~42.8 | 9.3~9.5 | 25.6~40.8 | 49.3 / 40 | −0.4 / +0.8 |
| 68 | 5 | 18~19 | 52.8~56.4 | 40.8~44.9 | 8.5~9.1 | 24.0~28.3 | — | |
| 70 | 5 | 19~20 | 54.1~56.2 | 42.0~44.7 | 11.0~11.2 | 24.0~29.1 | 54.4 / 29 | −0.3 / +0.1 |
| 74 | 5 | 19~21 | 51.2~52.6 | 38.8~41.3 | 9.7~10.3 | 28.3~30.5 | 51.2 / 30 | 0 / +0.5 |
| 78 | 6 | 21~23 | 50.3~52.4 | 39.6~42.5 | 8.9~9.1 | 26.8~35.8 | 50.6 / 34 | −0.3 / +1.8 |
| 82 | 7 | 23~25 | 51.0~53.8 | 40.1~43.6 | 9.9~10.2 | 28.8~34.4 | 51.0 / 34 | 0 / +0.4 |
| 86 | 7 | 24~26 | 47.7~50.3 | 37.5~40.7 | 9.1~9.3 | 32.2~39.6 | 47.8 / 38 | −0.1 / +1.6 |
| 90 | 8 | 27~28 | 48.0~49.9 | 38.4~40.5 | 10.0~10.1 | 32.0~39.4 | 48.0 / 40 | 0 / −0.6 |
| 94 | 9 | 29~30 | 47.1~48.8 | 37.7~39.6 | 9.1~9.4 | 32.2~40.0 | 47.6 / 40 | −0.5 / 0 |
| 98 | 10 | 31~32 | 47.4~49.7 | 38.1~40.4 | 9.8~10.0 | 33.9~43.3 | 47.3 / 41 | +0.1 / +2.3 |
| 150 | 16 | 36 | 29.8~30.3 | 23.3~23.8 | 2.4~2.5 | 62.2~76.4 | 29.7 / 77 | +0.1 / −0.6 |

- ±3 넘게 벗어나는 줄은 없다. 가장 큰 차이는 r98 빈 자리 +2.3(43.3, 선 44 안)이다.
- 몸 수는 검수서 예상과 같다. 항목 수의 최대는 검수서 '새 항목 수'와 같다(r50 13 … r98 32, r150 36).
- 엄격 덮임은 33.2~45.0%다(검수서 33.5~45.7).
- `_.check()` 정의(seed 1·7·23, 게임 반경 step 1)의 값: 덮임(B) 47.1~59.2%, 빈 자리 ≤ 43.3, r150 29.8~30.2% / 68.0~76.4, char 7.9~11.5%로 모두 통과다.
- **T2-d**(`k11-v3-t2d-rim`): 반경 50~98(4 간격)·150 × seed 1·7·23 × t 0·0.3에서 테 보임은 전체 99.2~100%, 먼 테 반쪽 98.3~100%다.

### 5. 렌더 (모두 Read로 열어 봄)

- **`k11-v3-c2a-ch1-fire`(1장 1x)**
  - r50~98이 모두 불이 들어찬 바닥으로 읽힌다.
  - r98은 l 무더기 10개가 고르게 차서 1회차의 빈 구역이 없다.
  - 먼 테의 '빨간 입술' 띠가 사라지고, s 무더기가 테 안쪽에 선다.
- **`k11-v3-c2a-ch5-x08-gray`(5장 0.8x 흑백)**: r98 불 안에서도 결이 가장 밝은 덩어리다. 무더기 glow 심은 작은 밝은 점들로 남는다(검수서 §8-6 확인 항목, 판단 ok).
- **`k11-v3-r98-seeds-x1`(r98 seed 1·7·23, 1x)**: 세 seed 모두 고르게 퍼지고, 큰 구멍이나 뭉침이 없다.
- **`k11-v3-r150-x1`(r150 seed 1·23, 1x)**: 몸 16 + 고리 16(고르게 솎음) + char 4다. 1회차(몸 9)보다 덜 성기지만 빈 자리 62~76이 남는다(허용 한계 안).
- 확인용: `k11-v3-c4-fire`(2배, ignite·gutter에서 고리 s도 prog 장, 먼 테 s 무더기 확인), `k11-v3-c3-fire-parts`(4배)
- 숫자:
  - 검사: `k11-v3-quick`, `-table-step2`, `-selfcheck`, `-c1-all`, `-c6-scan`, `-c7-geometry`, `-c8-unchanged`, `-c10-contrast`, `-c12-parts`
  - 벡터: `-c9-vectors`, `-c9-read-50-74`, `-c9-read-98`, `-c9-read-150`, `-c9-embers`
  - 측정: `-t2d-rim`, `-layout-counts`
  - C11 `enemy-*` 40장

### 6. 메인 세션이 할 일

1. **굽기**
   - 140장, 한 번에 굽는다. `skirt-*` 키는 없다.
   - 고리는 `hazard/fire/cluster-s-*`(ignite·gutter 포함)를 쓴다. 나머지 등록값은 1회차 납품서 §5와 같다.
2. **layout 이식**: API §8.0(`rimDist`, `scatter`, `rimPlace`, `capCut`)과 §8.1(불 식)을 옮긴다.
   - 지형 id로 **상한 전의 세 목록(몸·고리·char)**을 캐시한다.
   - reduced·minimal은 그 목록을 거른 뒤(짝수 i 고리, char 앞 절반 또는 2개, 몸 앞 3개) 그 LOD의 상한으로 capCut한다. full의 잘린 결과를 다시 거르면 r150에서 달라진다.
3. **`hazardArt.test.ts`**: 위 C9 벡터(50:1, 74:7, 98:7, 150:23)와 불티 슬롯 네 개로 시험한다.
4. **ignite·gutter**: 모든 무더기가 prog 장을 쓴다. α 경사 규칙은 없다.
5. **화면당 상한 72/40/20**: prio 등급(모든 불의 몸 → char → 고리)으로 나누고, 고리는 지형마다 capCut과 같은 식으로 고르게 솎는다.
6. **늘어난 한 지형 항목 수**: r98 31~32, r82 23~25, r70 19~20, r150 36. 보스 장면(원형 붕괴, 불길 레인)의 비용을 재고, 여유가 있으면 불 상한을 96~120으로 올린다(검수서 §8-5).

### 7. 알려진 한계

- **r150은 허용 한계 선으로 통과한다**(덮임 30%, 빈 자리 ≤ 76). 실제 모습은 화면당 상한 아래 보스 장면 캡처로 메인 세션이 판단한다.
- **hero front의 hurt0 장화 비침 최저 61.9%**는 그대로다(이번 회차에 front를 바꾸지 않았다).
- **정지 렌더로 판단하지 못한 것**: 2Hz 물듦과 루프 움직임, 성능.
- **사람 원화가 몫**: 불길 붓 실루엣과 비백, 숯불 바닥·그을음의 비백, 불티·연기 붓질.
- **납품 2 몫**: 6종, bind 오버레이, 전체 `kinds`/`groups`/`states`, C2b·C2c·C4-misc·C5, 6종의 `MASKS` 줄. 납품 2는 `scatter`·`rimPlace`·`capCut`·`areaOf`를 그대로 쓴다.

### 메인 세션 판정 (2026-10-16)

반경별 표가 검수 2차 §2 '새' 열과 모든 줄에서 ±3 안이고 `_.check()` 0건이라, 지시서 §14-8에 따라 검수 3차 없이 불(fire)을 합격으로 본다. 등록은 이 판(`1.0-d1r2`, 140장)과 위 C9 벡터로 한다.

---

## 2차 납품서 — 위험지형 납품 2: 나머지 6종 + 주인공 묶임 (`PN.hazards` v1.0)

### 0. 요약 (중단 뒤 파일 상태 확인 결과)

턴 한도로 멈춘 뒤 파일을 다시 확인했습니다. 7종이 모두 끝나서 중간 납품서가 아니라 전체 납품서로 드립니다.

| 종류 | 상태 | 확인 |
|---|---|---|
| fire | 수정 2회차(`1.0-d1r2`) 출력 그대로 | C9 불 벡터 4개와 불티 벡터 5개가 같은 값, 덮임·빈 자리 표 같은 값, C2a·C4-fire 같은 그림 |
| shock | 완료: telegraph·burst·decal, 돌 조각·파편·core·먼지, 균열 paths | C2c 색·흑백, C4-misc |
| slow | 완료: 웅덩이(넓이 목표, xl 추가), 기포, 4장 다이얼, `end` 옅어짐 | C2b 1~5장, 반경 60~270 면적 |
| water | 완료: 물결·흐름·반짝임 | C2b, 반경 145~270 |
| root | 완료: 덩굴 emerge·static·wither·faded, 주인공 bind-back·bind-front | C2b 1x를 먼저 보고 4배로 확인(§7-4) |
| trap | 완료: 1~4장 기계 armed·spring·shut(5장은 1장 그림) | C2b, C4-misc |
| null | 완료: erase·static·restore, 유령 선·jag paths, 부스러기. 산호 링은 끔(Q3) | C2b, C4-misc |

- `kinds`·`groups`·`states`는 7종·9그룹 전체이고 `planned`와 같습니다(`true`로 확인).
- 최종 검사(이름 `k11-d2f-*`)는 모두 통과했습니다.
  - C1~C12와 `_.check()`를 다시 돌렸고, `--check`는 전부 ok입니다. kit error는 0건입니다.
  - C6 0/0, C7 1~5줄 0건 + 6줄 ok, C12 `frames=285 ok boxArea=400936 ok badDrive=0`.
  - C8은 기준 해시 그대로이고, C11은 40장 ok, `_.check()`는 0건입니다.
- 고친 파일은 둘뿐이고, 아무것도 내려받지 않았습니다.
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-hazards.md`(v1.0으로 전면 개정)

**먼저 알려 드릴 것 세 가지**
1. **`jit`의 성질.** J(i+1)은 J(i)로 정해집니다. 값은 frac(J(i) + 0.761)이거나 frac(J(i) + 0.465)입니다(2654435761 mod 1000 = 761, 2³² mod 1000 = 296).
   - 그래서 불과 같은 후보식(a = 2πJ(ix), d = √J(ix+1))으로 뽑은 후보는 원 안의 나선 두 줄 위에만 놓입니다(`k11-d2-jit-pairs`에서 확인).
   - 그 결과 웅덩이가 한쪽에 몰리고 큰 빈 곳이 남았습니다. 납품 2 종류는 공용 `scatter()`에 선택 키 `pool: 'kr'`(시드로 돌린 R2 Kronecker 격자)와 `mirror`(거울 경계)를 더해 고쳤습니다.
   - 불은 합격한 판이라 건드리지 않았습니다. 키가 없으면 S1과 같은 결과입니다.
   - 불도 같은 pool로 바꾸면 더 고르게 퍼지지만, C9 벡터와 덮임 표가 바뀝니다. 바꿀지는 검수·메인 세션이 판단할 일입니다.
2. **감속 웅덩이에 `mire-xl` 조각 2장(132×60)을 더했습니다.**
   - 지시서 식(r²/2600, 최대 18개)으로는 웅덩이 덮임이 6~10%에 그칩니다. 맵 감속 반경 145~270에서는 한 지형 상한 24 안에서 l만으로 25~35%를 낼 수 없습니다.
   - 개수는 넓이로 정하고, 큰 단의 수는 목표 30%로 정했습니다. 결과는 반경 60~270 모두 28.9~30.9%입니다.
   - 조각 285장, 박스 넓이 합 400,936으로 상한 안입니다.
3. **물의 무늬는 성깁니다(보고만).** 지시서 크기(물결 40×18)와 상한 13 때문에 r ≥ 200에서 물결이 지나는 자리가 1~2%입니다. T1은 통과합니다(§6).

---

### 1. 납품 목록

| 파일 | 네임스페이스 | 내용 |
|---|---|---|
| `art/concept-kit/k-hazards.js` | `window.PN.hazards` | `version '1.0'`, `K`, `kinds`(7), `groups`(9), `states`, `META`, `SPEC`, `jit`, `planned`, `parts`, `stamp`, `layout`, `paths`, `draw`, `overlay`, `_` |
| `art/concept-kit/API-hazards.md` | — | v1.0. 로드·호출·상태 창(7종)·조각 표·그림 요약·SPEC 표(7종)·layout·paths 식과 jit 번호대·그리는 순서·LOD·예산·검사·지시서와 다르게 한 것 33항·원화가 몫·알려진 한계 |

- **draw 상태**: fire 4 / shock 3(telegraph, burst, decal) / slow 1(static, 4장 다이얼) / water 1 / root 4(emerge, static, wither, faded) / trap 3(armed, spring, shut) / null 3(erase, static, restore)
- **overlay**: hero back·front·embers·**bind-back·bind-front**, mob front-12·19·28
- **옵션**: 기존 `{r, ch, t, p, seed, lod, reduced, flash}`에 `end`(slow, 끝 0.5초 웅덩이·기포 α 경사)를 더했습니다.
- **기존 옵션의 기본 출력 변화**: 불·hero·mob은 바뀐 것이 없습니다. 납품 2 항목은 이전에 `<g/>`를 돌려주던 호출이 이제 그림을 돌려줍니다.
- **파일 밖 변경**: 없습니다. `k-env.js`(`PN.env.hazard` 포함)도 그대로입니다.

### 2. API 요약

- **좌표**
  - `draw` 원점 = 지형 중심 = 시뮬 (x, y)입니다. 판정 원은 `Hazard.radius` 그대로이고 테 중심선이 r에 옵니다(V4).
  - `overlay` 원점 = 발입니다. 오른쪽을 볼 때 그리고 `facing: -1`이면 반전합니다.
  - 조각은 늘이지 않습니다. 솟는 조각은 좌우 반전만 합니다.
- **paths**: shock → `{cracks}`(팔 7 + 가지 7), null → `{ghost, jag}`입니다. jag는 닫힌 선 하나짜리 목록으로 바꿨습니다(값이 모두 선 목록이 되게).

| 조각 | 장 | drive | box | anchor | layer / z | 칠한 범위(앵커 원점) |
|---|---|---|---|---|---|---|
| shock pebble-a·b | 2 | loop 12 | 10×10 | 5,8 | hazard / ground | 3.1×3.8 |
| shock shard-a·b·c | 4 | prog 0.3 | 20×20 | 10,16 | hazard / air | ≤ 7.1×6.2 |
| shock core | 4 | prog 0.25, flash | 72×72 | 36,44 | hazard / flame | 53.3×44.5 |
| shock dust-a·b | 4 | prog 0.3 | 28×18 | 14,14 | hazard / air | 19.8×9.6 |
| slow mire-s/m/l/**xl**-a·b | 1 | idx | 36×20 / 52×28 / 76×40 / **132×60** | 가운데 | hazard / ground | 29.5×11.7 / 45.1×18.0 / 68.5×27.6 / 121.2×49.3 |
| slow bubble-a·b | 6 | cycle 0.9, still 2 | 14×14 | 7,11 | hazard / flame | 7.5×7.4 |
| water ripple-a·b | 8 | cycle 1.6, still 3 | 40×18 | 20,9 | hazard / ground | 30.7×11.0 |
| water flow-a·b | 6 | loop 6 | 44×10 | 22,5 | hazard / ground | 32.0×3.4 |
| water glint | 2 | loop 2 | 14×8 | 7,4 | hazard / ground | 6.0×1.6 |
| root vine-a·b·c(+emerge, +wither) | 4씩 | loop 6 / prog 0.25 / prog 0.4 | 26×24 | 13,20 | hazard / flame | 높이 ≤ 15.5, 폭 ≤ 19 |
| trap armed/spring/shut-ch1~4 | 1/3/1 | idx / prog 0.15 / idx | 82×62 | 41,33 | hazard / ground | ≤ 73.3×44.0 |
| null crumb-a·b·c | 1 | idx | 12×10 | 6,5 | hazard / ground | ≤ 5.2×3.4 |
| hero bind-back | 4 | prog 0.2(마지막 장 유지) | 46×24 | 23,19 | body-back | x ±18.5, y −15.7~1.8 |
| hero bind-front | 4 | prog 0.2(마지막 장 유지) | 42×24 | 21,18 | body-front | x ±16.9, y −11.6~2.8 |

- **게임 표시**: 조각은 1x 월드 단위 그대로(@2x 굽기, scale 1)입니다. 반경은 게임 값(shock 190, slow 86~270, water 145~270, root 50·52, trap 60~98, null 120~170)입니다.
- **예산**: 285장(fire 116, hero 20, mob 12, shock 28, slow 20, water 30, root 36, trap 20, null 3), 박스 넓이 합 400,936입니다. @2x로 약 160만 px²라서 2048² 한 장에 듭니다.

### 3. 검사 결과

렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 최종 이름은 `k11-d2f-*`, 작업 중 이름은 `k11-d2-*`입니다.

**`--check` 결과**: 모두 `ok`입니다.
- C1 `k11-d2f-c1-all`
- C2a `-c2a-ch1-fire`
- C2b `-c2b-ch1~ch5-terrain`, `-c2b-ch5-x08-gray`(작업 중 `k11-d2-c2b-ch3-x08-gray`)
- C2c `-c2c-shock`, `-c2c-shock-gray`
- C3 9그룹 `-c3-{fire,hero,mob,shock,slow,water,root,trap,null}-parts`
- C4 `-c4-fire`, `-c4-misc`
- C5 `-c5-t1-{gray,deutan,protan,color}`
- C11 40장

**C6**
```
bad colours=0 banned=0
```

**C7**(4줄 `RC.back` [−22,−26,22,2])
```
1 stamps outside box-3: 0
2 bases outside r-6: 0 | ground items over r-2: 0 | tips over far rim+6: 0 | over per-hazard cap: 0
3 paths outside: 0
4 overlays outside their rects: 0
5 hero ember paths through the face zone (outward drift): 0
6 invalid calls ok
```

**C8**
```
env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045
```

**C9**(필드 [part, x, y, flip, phase, z, prio])
- **불은 수정 2회차 납품서 원문과 한 자리도 다르지 않습니다.** `fire:50:1`(11), `74:7`(20), `98:7`(31), `150:23`(36)과 `_.emberSlots` 4개, `_.heroEmberSlots(0.3)`가 모두 같습니다(`k11-d2f-c9-read-fire`, `-c9-embers`에서 줄마다 대조).
- 새 벡터:
```
slow:150:5 (23)  ch 3
["mire-l-b",-38.1,-110.91,1,0,"ground",0] ["mire-l-a",31.65,-73.92,1,0,"ground",0] ["mire-l-b",94.91,-68.09,1,0,"ground",0]
["mire-l-a",-37.74,-65.51,0,0,"ground",0] ["mire-l-b",-56.25,-40.75,1,0,"ground",0] ["mire-l-a",70.45,-22.42,1,0,"ground",0]
["mire-l-a",-87.54,-9.26,1,0,"ground",0] ["mire-l-a",-20.7,-1.4,0,0,"ground",0] ["mire-l-b",88.55,16.32,0,0,"ground",0]
["mire-l-b",34.62,21.98,0,0,"ground",0] ["mire-l-a",-103.08,27.68,0,0,"ground",0] ["mire-l-b",-57.19,51.92,0,0,"ground",0]
["mire-l-a",9.53,58.08,0,0,"ground",0] ["mire-l-b",81.1,64.6,0,0,"ground",0] ["mire-m-a",-27.88,75.92,0,0,"ground",0]
["mire-l-a",39.37,95.18,0,0,"ground",0] ["mire-l-a",-59.03,103.24,1,0,"ground",0] ["mire-l-b",-10.44,126.2,1,0,"ground",0]
["bubble-b",-35.11,-114.27,0,0.298,"flame",2] ["bubble-b",-42.28,-40.11,0,0.69,"flame",2] ["bubble-a",-13.34,-3.17,0,0.454,"flame",2]
["bubble-a",35.93,18,0,0.238,"flame",2] ["bubble-a",29.71,97.4,0,0.846,"flame",2]

water:200:3 (9)  ch 3
["ripple-b",6.4,-139.74,0,0.268,"ground",0] ["glint",-66.13,-61.04,0,0.194,"ground",2] ["ripple-a",78.15,-28.76,0,0.345,"ground",0]
["ripple-a",-119.65,-24.13,1,0.729,"ground",0] ["flow-b",-53.65,4.81,0,0.85,"ground",1] ["flow-a",-118.18,41.08,0,0.389,"ground",1]
["ripple-a",11.17,80.4,1,0.806,"ground",0] ["ripple-b",-62.82,122.2,1,0.191,"ground",0] ["flow-a",-10.57,165.32,0,0.312,"ground",1]

root:52:9 (4)
["vine-a",12.45,-18.3,1,0.846,"flame",0] ["vine-c",-10.31,-2.74,0,0.923,"flame",0] ["vine-b",23.91,11.37,1,0.384,"flame",0]
["vine-c",-23.11,23.31,0,0.307,"flame",0]

null:130:11 (8)
["crumb-a",14.96,-122.29,0,0,"ground",0] ["crumb-c",-55.36,-107.4,0,0,"ground",0] ["crumb-a",-89.09,-79.67,1,0,"ground",0]
["crumb-c",115.11,-35.41,1,0,"ground",0] ["crumb-b",-110.55,49.5,0,0,"ground",0] ["crumb-c",98.58,68.48,0,0,"ground",0]
["crumb-a",69.03,101.23,0,0,"ground",0] ["crumb-a",-64.79,105.17,1,0,"ground",0]
null:130:11 ghost0 [[103.24,68.69],[-94.32,80.49]]
null:130:11 ghost1 [[-62.93,-106.84],[-23.79,121.7]]
null:130:11 ghost2 [[-69.66,-102.58],[117.45,39.76]]
null:130:11 ghost3 [[115.92,-44.03],[15.71,123]]
null:130:11 jag0 [[127.86,0],[108.31,62.53],[64.14,111.09],[0,129.71],[-63.46,109.92],[-111.16,64.18],[-125.57,0],[-111.52,-64.39],[-62.11,-107.57],[0,-127.42],[62.32,-107.93],[109.17,-63.03]]

shock:190:11 (6)
["pebble-a",76.32,-61.32,0,0.908,"ground",1] ["pebble-b",-103.32,-40.51,1,0.443,"ground",1] ["pebble-a",113.37,-10.29,1,0.217,"ground",1]
["pebble-b",73.51,-6.5,1,0.669,"ground",1] ["pebble-a",-3.99,86.36,0,0.978,"ground",1] ["pebble-a",-4.16,94.16,0,0.134,"ground",1]
shock:190:11 cracks0 [[10,-0.08],[28.11,-0.51],[55.54,-0.49],[78.81,-8.27],[96.43,-12.5],[124.07,-8.89],[152.45,-5.73],[166.6,-14.2]]
shock:190:11 cracks1 [[4.18,9.09],[22.66,19.28],[25.34,48.22],[41.5,67.16],[55.26,85.11],[61.62,103.01],[65.16,118.68],[86.54,134.8],[90.26,140.75]]
shock:190:11 cracks2 [[-1.78,9.84],[7.02,29.5],[-4.7,46.37],[-3.75,75.46],[-4.26,98.63],[-10.17,117.05],[-21.53,130.64],[-21.55,156.41],[-22.39,165.69]]
shock:190:11 cracks3 [[-8.12,5.84],[-18.45,29.5],[-39.75,32.37],[-50.5,44.5],[-73.35,55.42],[-83,75.85],[-101.35,77.16],[-113.58,88.55],[-130.45,104.59]]
shock:190:11 cracks4 [[-8.65,-5.01],[-35.18,-5.18],[-53.2,-12.2],[-65.7,-21.43],[-84.95,-39],[-111.7,-41.21],[-122.51,-61.44],[-138.3,-68.19],[-150.13,-73.6]]
shock:190:11 cracks5 [[-2.74,-9.62],[-14.55,-32.27],[-22.18,-50.78],[-23.75,-70.45],[-24.35,-87.6],[-40.17,-109.13],[-32.29,-131.77],[-33.22,-148.18],[-33.82,-163.74]]
shock:190:11 cracks6 [[7.65,-6.44],[17.18,-20.35],[34.15,-38.07],[51.78,-47.45],[68.42,-54.27],[88.01,-71.74],[104.41,-86.01],[119.63,-93.08],[134.82,-98.89]]
shock:190:11 cracks7 [[96.84,-12.45],[110.32,-21.49],[126.35,-25.24],[141.24,-30.32]]
shock:190:11 cracks8 [[51.55,80.28],[55.89,96.61],[54.92,113.34],[54.91,129.81]]
shock:190:11 cracks9 [[-4.2,95.85],[-9.1,112.36],[-19.62,125.24],[-28.82,139.1]]
shock:190:11 cracks10 [[-75.3,59.54],[-75.56,76.08],[-72.1,92.45],[-63.47,107.86]]
shock:190:11 cracks11 [[-89.55,-39.38],[-101.47,-50.8],[-115.59,-58.96],[-126.55,-70.98]]
shock:190:11 cracks12 [[-29.31,-94.35],[-44.89,-99.65],[-59.59,-107.56],[-74.52,-114.09]]
shock:190:11 cracks13 [[75.03,-60.17],[89.96,-67.6],[105.94,-68.84],[121.76,-71.16]]
```

**C10**
```
fire (ink a0.3): ch1 1.80 ch2 1.80 ch3 1.82 ch4 1.81 ch5 1.78 | ok
water (ink a0.24): ch1 1.59 ch2 1.59 ch3 1.60 ch4 1.59 ch5 1.57 | ok
trap (ink700 a0.5): ch1 2.37 ch2 2.37 ch3 2.42 ch4 2.39 ch5 2.31 | ok
null (voidPaper a1): ch1 1.63 ch2 1.63 ch3 1.54 ch4 1.59 ch5 1.75 | ok
soot (ink a0.16): ch1 1.35 ch2 1.35 ch3 1.36 ch4 1.35 ch5 1.34 | ok
hero coat peak multiply a0.3: Y=0.620 ok
hero coat trough multiply a0.12: Y=0.780 ok
hero coat steady multiply a0.2: Y=0.705 ok
```

**C12**
```
frames=285 ok boxArea=400936 ok badDrive=0
```
나머지 줄은 §2 표와 같습니다. 불·hero back/front·mob 줄은 수정 2회차와 같고, 납품 2 줄이 더해졌습니다. mire-xl은 `f1 idx box132x60 a66,30 hazard/ground info`입니다.

**`_.check()`**(`k11-d2f-selfcheck`)
```
PN.hazards._.check(): 0 issue(s) (20 s), version 1.0
PN.hazards._.check({areas:false}): 0 issue(s)
kinds/groups/states == planned: true
```
새로 더한 검사 줄:
- `AREA_RULES.slow`: 웅덩이 25~35%, 반경 86·145·150·200·270 × seed 1·5·9
- `AREA_RULES.root`: 덩굴 ≤ 18%, 반경 50·52

**직접 본 렌더(모두 Read로 열었음)**
- **게임 크기 1x**
  - `k11-d2f-c2b-ch3-terrain`, `-c2a-ch1-fire`
  - `k11-d2-c2b-ch1/ch2/ch4/ch5-terrain`(같은 장면의 앞 판)
  - `k11-d2-c2c-shock`
  - `k11-d2-slow-big-now`(고치기 전), `-slow-big-v2`, `-slow-big-v3`(r150·200·270)
  - `k11-d2-water-big`(r145·200·270), `k11-d2-root-slow-mid`(덩굴 8개, 감속 r86~120)
  - `k11-d2f-c5-t1-color`
- **0.8배 흑백**: `k11-d2-c2b-ch3-x08-gray`, `k11-d2f-c2b-ch5-x08-gray`
- **확대**
  - `k11-d2-bind-1x-zoom`(1x 장면을 4배로)
  - `k11-d2f-c3-{shock,trap,hero,water,null}-parts`, `k11-d2-c3-{slow,root}-parts`(3~8배)
  - `k11-d2f-c4-misc`(1.5배), `k11-d2f-c4-fire`(2배)
- **흑백·색각**: `k11-d2f-c5-t1-gray`, `k11-d2-c5-t1-{deutan,protan}`(마지막 판은 ok만 확인), `k11-d2f-c2c-shock-gray`
- **숫자**
  - `k11-d2f-c6-scan`, `-c7-geometry`, `-c8-unchanged`, `-c9-vectors`, `-c9-read-fire`, `-c9-embers`, `-c9-read-rest`, `-c10-contrast`, `-c12-parts`, `-selfcheck`, `-area-table`
  - `k11-d2-c9-read-a~f`, `-layout-counts`, `-part-extents`, `-root-extents2`, `-mire-areas`, `-jit-pairs`

### 4. 지시서 대비

#### 4.1 실제 수치표 (§1.4·§1.5·§3.6·§4)

| 항목 | 지시서 | 실제 |
|---|---|---|
| 조각 수 / 박스 넓이 | 301 / 약 39만 | 285 / 400,936(불 치마 −18, mire-xl +2) |
| shock core 칠한 크기 | ≤ 66×66 | 53.3×44.5 |
| shock 파편 / 먼지 / 돌 조각 | 8곳(0.3~0.9r, 바깥 14, 위 10) / 8곳(테 안쪽) / 6곳(팔 0·2·4·6의 40~70%) | 같음 / r − 6 / 같음(full·imminent만) |
| 균열 | 7줄 + 가지, 0.88r, p 0.85에 다 자람 | 같음(팔 7 + 가지 7, 굵기 3.6 → 1.6) |
| 웅덩이 칠한 크기 s/m/l | ≤ 30×14 / 46×22 / 70×34 | 29.5×11.7 / 45.1×18.0 / 68.5×27.6 |
| 웅덩이 면적 | 25~35% | 28.9~30.9%(반경 60~270) |
| 기포 | 6장, 2번 장 정지 | 같음 |
| 물결 / 흐름 / 반짝임 | rx 3 → 16, 고리 둘, 6~7번 장 끊김 / 길이 10~18, 오른쪽 2씩 / ≤ 6×2 | 같음 / 10~14 / 6.0×1.6 |
| 덩굴 높이 / 면적 | ≤ 16 / ≤ 18% | ≤ 15.5 / 2.4~2.6% |
| 덩굴 끝 흔들림 | ±2 | 2만큼(+0.3 → −1.7, 갈고리가 박스 오른쪽 여백에 닿아 안쪽으로) |
| 덫 기계 | ≤ 76×56 | ≤ 73.3×44.0 |
| bind 범위 | back ±20, −16~+2 / front ±18, −15~+3 | back ±18.5, −15.7~1.8 / front ±16.9, −11.6~2.8 |
| 한 지형 상한 | slow 24/12/3, water 13/7/1, root 6, trap 1, null 9/0/0, shock 6/0/0 | 최대 24/9/3, 13/7/1, 4, 1, 9/0/0, 6/0/0 |
| null 산호 링 | Q3 끈다 | `active.on: false` |
| 명도 | 물 0.23~0.26, null 0.71, 덫 판 0.14~0.15, 대비 ≥ 1.5 | C10 모든 줄 ok |

#### 4.2 지시서와 다르게 한 것 (API §13의 16~33)

16. **감속 웅덩이 개수·크기**
    - 단 [r < 100 m·s], [100 ≤ r < 160 l·m], [r ≥ 160 xl·l]로 나눴다.
    - n = clamp(round(r²/area), 3, 18)이고, 큰 것의 수는 목표 30%의 넓이로 정했다. 조각에서 잰 칠한 넓이는 s 220, m 524, l 1220, xl 3900이다.
    - `mire-xl` 2장을 더했다. 이유는 §0-2와 같다.
17. **`scatter` pool 'kr' + `mirror` + 놓은 순서의 Kronecker w(변형·flip·phase)**: 납품 2 종류만 쓴다(§0-1).
18. **`shock.coreLayers.burst`**: [hostileGlow 0.5w, p50 0.18w]로 바꿨다. 산호 금이 산호 채움 위에서 사라졌다.
19. **`shock.burst.edge`**: 3줄 망점(오프셋 −2.5·−7·−11.5, 점 2.2·1.6·1.0, 간격 6)으로 그렸다. 반경 190에서 점 40개는 띠로 읽히지 않았다.
20. **jit 번호대를 정했다**: shock 2000·2100·2090·2400·7000~7030·7100·7200, null 2200·2240·2280·6000~6120, slow 3000·6000·3200, water 4000·4100·4300, root 5000.
21. **root 배치**: 고리식 대신 `scatter` 'rise'를 썼다(§14-7). reach 0.72r, gap min(0.5r, 24), flip = x > 0이다.
22. **water 배치**: `scatter` 'ground'를 썼다(거리·간격은 지시서 값). 흐름은 물결과도 30 떨어지게 했다.
23. **null 부스러기**: rimDist 'ground'(pad 2, jitter 4)로 놓는다(§14-7).
24. **jag는 닫힌 선 하나짜리 목록**이다. `null.ghost.inset 6`을 SPEC에 적었다.
25. **null 산호 링을 껐다**(Q3).
26. **`draw`의 `end`**(slow): 끝 0.5초 옅어짐을 참고 합성에 넣었다.
27. **기포·물결 주기**의 J로 항목 phase에서 frac(7.919·phase)를 쓴다.
28. **shock 파편·먼지(0.3초)**: 자국의 처음 0.05초까지 마저 그린다.
29. **덫 shut의 p**: 마지막 0.6초 진행률이다. 판·홈·살·리벳·기계·테가 함께 사라진다.
30. **덩굴**: 가시덤불(긴 낮은 줄기 + 작은 갈고리 + 둘째 줄기)로 그렸다. 한 줄 갈고리는 1x에서 해마·올챙이로 읽혔다. 가시는 바깥 3 + 안쪽 1 + 둘째 줄기 1이다(지시서 "바깥 2~3").
31. **묶임**: 장화는 어두워 덩굴이 묻혀서 코트 자락 높이(y −9.4·−6.4)에 감았다. 다리마다 두 가닥이 X로 겹친다.
32. **water 면적**: `extent`(물결이 쓸고 가는 내접 타원)로 잰다. 보고만 한다.
33. **`AREA_RULES.slow`**: 맵 반경 145·200·270까지 검사한다.

#### 4.3 T1·T2 자가 판정

**T1(C5 흑백·적록·청황·색)**
- 기호 없이 7종 모두 이름을 댈 수 있다.
  - fire: 어두운 원 + 밝은 심 불길
  - shock: 테 아래 가지 친 균열 + 눈금 테
  - slow: 해칭 + 검은 웅덩이(4장: 해칭 + 눈금 원 + 바늘)
  - water: 중간 어둠 + 밝은 고리
  - root: 해칭 + 작은 검은 덩굴
  - trap: 어두운 쇠판 + 기계 + 네모 리벳 + 바퀴살
  - null: 가장 밝은 빈 종이 + 유령 점선 + 점선 테
- 쌍 6개(fire↔slow, slow↔root, water↔slow, water↔null, trap↔fire, shock 예고↔slow)가 흑백에서 모양·무늬로 갈린다.
- **가장 가까운 쌍은 slow(r86, s·m 웅덩이) ↔ root**다. 둘 다 해칭 위 검은 자국이다. 그래도 납작한 27~45 폭 덩어리 18개와 가시 달린 18 폭 곡선 4개라서 C5와 C2b에서 헷갈리지 않았다. 고친 점은 없다.
- 적·적 탄·픽업·아군 지대로 읽히는 칸이 없다.
  - 청록이 없다.
  - 밝은 12~18px 원판이 없다(물결은 속 빈 고리, 반짝임은 6×1.6 렌즈, 기포는 어두운 돔).
  - 돌 조각은 각지다. 부스러기는 밝은 바닥 위의 회색이다.

**T2(C2b 1~5장 1x, 3·5장 0.8x 흑백, C2c 색·흑백)**
- (a) 모든 장면에서 결이 가장 밝다.
  - slow·root 바닥(`draw`는 p100 α 0.92, 렌더러는 현행 `#f3ead7`·`#efe6d3`)은 흑백에서 코트와 명도 차가 작다. 결은 먹 외곽으로 갈린다(현행 렌더러와 같은 조건).
- (b)(c)(e) 불은 수정 2회차 그대로다(합격 판).
- (d) 테 보임
  - 바닥 조각은 r − 2 안, 솟는 조각은 밑동 r − 6 안과 먼 테 + 6(C7 2줄 0건)이라 테를 덮지 않는다.
  - C2b에서 테가 끊긴 곳이 없다. 새 종류의 둘레 비율은 따로 재지 않았다.
- (f) 무해하게 읽힌다.
  - shock 자국에는 테가 없고 α 0.6 → 0이다.
  - 덫 shut은 판 α 0.7에 금·먼지가 있고 마지막에 사라진다.
- (g) 다섯 장 바닥 모두에서 성립한다. 4장은 다이얼, 5장은 null이다.
- **bind(§7-4)**: C2b 1x를 먼저 봤다(`k11-d2f-c2b-ch3-terrain`). 결의 코트 자락과 장화에 검은 덩굴 고리와 땅 덩굴이 보여 '발이 묶임'으로 읽힌다. 4배(`k11-d2-bind-1x-zoom`)는 확인용으로만 봤다.

#### 4.4 종류별 면적·빈 자리 (`areaOf`, `k11-d2f-area-table`)

| 종류 r | 채움(%) | 빈 자리(지름) | seed / 격자 |
|---|---|---|---|
| fire 74 / 98 / 150 | 덮임(B) 51.2~52.6 / 47.4~49.7 / 29.8~30.3 | 28.3~30.5 / 33.9~43.3 / 62.2~76.4 | 1·7·23·42·99 / 2. 수정 2회차와 같음 |
| slow 60 / 86 / 100 / 120 | 30.8~30.9 / 29.8~30.0 / 29.9~30.0 / 29.8~29.9 | 23.3~36.0 / 30.5~36.0 / 40.2~51.2 / 51.2~62.1 | 1·5·9 / 2 |
| slow 145 / 150 / 160 | 29.9 / 29.8~30.0 / 28.9~30.6 | 56.7~59.4 / 57.3~61.3 / 54.4~61.2 | |
| slow 200 / 240 / 270 | 30.0~30.2 / 29.8 / 29.2~29.4 | 75.5~77.3 / 95.1~99.1 / 102.5~132.5 | |
| root 50 / 52 | 2.5~2.6 / 2.4~2.5 | 38.6~40.2 / 42.5~44.2 | 1·5·9 / 1 |
| water 145 / 200 / 270 | 자리(extent) 2.2~2.3 / 1.6 / 1.2~1.3 | 116.2~124.9 / 152.0~164.7 / 184.0~201.0 | 1·3·7 / 2 |

- 고치기 전(지시서 후보식, l만, 18개)에는 slow 150에서 27%·빈 자리 82, 200에서 15%·124~127, 270에서 8%·178~184였다.
- 지금 slow 빈 자리는 웅덩이 크기에 비례한다(지름의 약 0.2~0.25). 1x에서 고르게 퍼진다(`k11-d2-slow-big-v3`).
- shock·trap·null은 흩는 채움이 없어 마스크가 없다.

### 5. 메인 세션이 할 일

1. **굽기**
   - `scripts/build-atlas.mjs:11` `KIT_FILES`에 `k-env.js` 바로 뒤로 `'k-hazards.js'`를 넣는다.
   - `PACKS.hazards = { page: 'assets/packs/hazards/atlas', frames: [{ hazards: true }] }`를 더한다.
   - 9그룹 × `parts(g)` × 장을 굽는다: 키 `hazard/<group>/<part>/<frame>`, 호출 `['PN.hazards.stamp', group, part, { frame }]`, box·anchor는 parts 값, `scale: 1`, `COLOR_MAP`.
   - 285장, 2048² 한 장이다. 덫 조각에는 `PN.env.CH` 장 재질색이 구워진다.
2. **애니메이션 `hazard/<group>`**
   - loop fps: 불 무더기·hero back/front·mob·shock pebble 12, water flow 6, glint 2, root vine 6
   - prog 초: fire ignite 0.25·gutter 0.5, shock shard 0.3·core 0.25(flash)·dust 0.3, root emerge 0.25·wither 0.4, trap spring 0.15, hero bind 0.2(마지막 장 유지)
   - cycle 초: ember 0.7, smoke 1.0, bubble 0.9(still 2), ripple 1.6(still 3)
   - idx: char·char-cold·mire-*·trap armed/shut·crumb
   - layer: body-back = hero back·bind-back, body-front = hero front·bind-front·mob front, ground = char-cold, 나머지 hazard
3. **매니페스트**: `hazards = {spec: SPEC, parts, states, vectors}`. SPEC에 `jit.kron` 다섯 수가 들어 있다. vectors는 불 4 + 불티 5(그대로) + 위 C9 새 벡터 5(paths 포함)다.
4. **렌더러 이식**(`hazardArt.ts`, API §8)
   - `scatter`의 pool 'kr'·`mirror`·w, `mirePlan`(tiers·fill·target)
   - water·root·null·shock layout과 paths(jag는 `jag[0]`), cycle 주기 식
   - 그리는 순서(§9), LOD·감소 설정(§10)
   - 상태 매핑: shock telegraph p(< 0.65 preview), burst 0.25 + decal 1.2초(파편·먼지는 터진 뒤 0.3초), root emerge·wither·faded(`rootImmunity`), trap spring 0.15·shut(마지막 0.6초 p), null erase 0.3·restore 0.5, slow 4장 다이얼 진행·끝 0.5초 `end`, bind(`player.root > 0`, p = 묶인 초/0.2)
   - 종류별 켜기 목록은 검수 뒤 불 다음 순서로 연다.
5. **팔레트·시험**
   - `NEUTRAL.voidPaper '#e2dbcb'`를 더하고 `visualRegistry.ts:205` null 채움을 바꾼다.
   - `palette.test.ts` 종류별 소속: null은 산호 링이 꺼져 호박·중립만이다.
   - `hazardArt.test.ts`는 위 벡터로 시험한다.
6. **성능 장면**(§9-7)
   - 감속 r200은 xl 6 + l 12 + 기포 6 = 24 항목, 속박 r52는 덩굴 4, null r170은 부스러기 9, 물 r250은 13 항목이다.
   - 화면당 상한 160/90/40 배분을 잰다.
7. **판단 요청**
   - 불에도 pool 'kr'을 쓸지(§0-1). 쓰면 벡터와 덮임 표를 다시 낸다.
   - 물 무늬 밀도(§6).

### 6. 알려진 한계

- **물이 성기다**(r ≥ 200에서 물결·흐름 자리 1.2~1.6%, 빈 자리 150~200). 처방이 필요하면 xl 웅덩이처럼 큰 물결 단을 더한다(조각 +16장, 상한 안).
- **불 후보 나선**: 합격 판이라 그대로 두었다(§0-1).
- **정지 렌더로 보지 못한 것**: 루프·cycle 움직임, 다이얼 바늘 쓸기, 2Hz 물듦, 성능.
- **새 종류 테 보임 비율**: 구조상 덮지 않으나 따로 재지 않았다.
- **사람 원화가 몫**
  - 덩굴 가시와 테이퍼, 묶임 덩굴의 앞뒤 감김
  - 덫 쇠 질감(3장 그물, 4장 톱니)
  - shock 판석·돌 조각과 균열 리듬
  - 웅덩이 번짐과 xl 표면(지금은 평평한 ink700 + 초승 윤기)
  - 지우개 부스러기
  - 불길·숯불·그을음의 비백
- **정식 판독 시험(n ≥ 8)**: 하지 않았다.

---

## 검수 3차: K11 납품 2(6종 + 묶임, `PN.hazards` v1.0) (art-director, 2026-10-19)

### 판정: **수정 후 합격**

- **불(fire)은 수정 2회차(`1.0-d1r2`) 그대로 합격이다. 메인 세션은 지금 불부터 연결해도 된다.**
  - 불 C9 벡터는 수정 2회차와 같다(납품서 주장). 나는 C8과 `_.check()`만 다시 돌렸다.
  - (1)의 'kr' 전환은 하지 않는다. 근거는 §2-1이다.
- **나머지 6종 그림과 기술 계약은 합격이다.** 다만 두 가지는 그 종류를 켜기 전에 고친다:
  - **W1 물**: 1x에서 물로 읽히지 않는다.
  - **B1 묶임**: 1x에서 약하고, hurt 장에서 사라진다.
  - 이 둘은 불 연결을 막지 않는다. 검수는 고친 판의 렌더와 숫자를 대조하는 것으로 한다.
- 내가 다시 돌린 검사는 모두 기준 통과다.

| 검사 | 결과 | 렌더 |
|---|---|---|
| C6 | `bad colours=0 banned=0` | `k11r3-c6-scan` |
| C7 | 1~5줄 0건, 6줄 ok(RC.back [−22,−26,22,2]) | `k11r3-c7-geometry` |
| C8 | `env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045` | `k11r3-c8-unchanged` |
| `_.check()`, 예산, 목록 | 0건, version 1.0, frames 285, boxArea 400,936, kinds·groups·states = planned true | `k11r3-selfcheck` |

### 1. 지시서 대조 (§4, §7 T1·T2, §13·§14)

| 항목 | 내 확인(렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k11r3-*`) | 판정 |
|---|---|---|
| T1(흑백) | `c5-t1-gray`: 일곱 종류가 기호 없이 갈린다. 다만 물 칸은 '테 가는 중간 어둠 원'이라 소거법으로만 물이다 | 물만 W1 |
| T1 쌍 | fire↔slow, water↔slow, water↔null, trap↔fire, shock 예고↔slow는 분명하다. slow↔root는 아래 (5) | 통과 |
| 적·탄·픽업 혼동 | `confusion-x1`(1x 색·흑백): 픽업(xp·코인·자석·회복), 먹 + 산호 테 탄 모형(14~30px), 적과 나란히 놓고 봤다. 기포는 어두운 작은 돔, 물결은 속 빈 납작 고리, 부스러기·돌 조각은 회색·먹 티끌, 덩굴은 가시 갈고리라 혼동이 없다 | 통과 |
| T2(a) 결이 가장 밝다 | `c2b-ch5-x08-gray`, `c2b-ch3-x1`: 모든 장면에서 성립한다. 감속·속박 바탕(p100, 현행 렌더러 `#f3ead7`)은 코트와 명도 차가 작지만 결은 먹 외곽과 종이 halo로 갈린다. 납품 전부터 있던 조건이다(§6 열린 질문) | 통과 |
| T2(d) 테 | 구조상 덮지 않는다(C7 2줄 0건). 새 종류의 둘레 비율은 재지 않았다 | 통과(비율 미측정) |
| T2(f) 무해 | `c2c-shock`: 자국은 테 없이 옅어진다. `c4-misc`: 덫 shut은 판과 함께 옅어진다 | 통과 |
| T2(g) 5장 | `c2b-ch1/ch3/ch4-x1`, `-ch5-x08-gray`: 4장 다이얼, 5장 null, 1~4장 덫 기계 모두 성립한다 | 통과 |
| shock | `c2c-shock`: 붓 테 + 균열이 p 0.85에 0.88r까지 자라고, 터짐은 산호 채움 + 3줄 망점 가장자리 + 빛나는 금이다. 자국은 옅다 | 통과 |
| slow | `slow-big-x1`(r150·200·270), `c3-slow-parts`(3배): 웅덩이 30% 안팎으로 고르게 퍼지고, 안에 점이 없다 | 통과 |
| trap | `c3-trap-parts`(2.5배): 장별 기계 넷이 갈린다. 3장 그물에 평행 3줄이 없다 | 통과 |
| null | 가장 밝은 빈 종이 + 유령 점선 + 점선 테, 산호 링 끔(Q3) | 통과 |
| root | `c3-root-parts`(4배), `root-variants-x1`: 가시덤불 갈고리 4개. 판독은 되지만 성기다 | 통과, 권장 R1 |
| water | `water-big-x1`, `water-variants-x1`, `water-mock-x1`: 아래 (3) | **W1** |
| bind | `bind-x1`, `bind-x5`: 아래 (5) | **B1** |
| 상태 진행 | `c4-misc`: shock·root·trap 1~4·null·dial·slow·water 진행이 지시서대로다 | 통과 |

### 2. 판단 요청 (1)~(5)

**(1) 불도 pool 'kr'로 바꿀지 → 바꾸지 않는다(합격 판 유지)**
- 확인한 사실:
  - `jit`의 성질은 납품서 말이 맞다. J(i+1) = frac(J(i) + 0.761) 또는 frac(J(i) + 0.465)다.
  - 내가 검수 2차 S1에 쓴 후보식(a = 2πJ(ix), d = √J(ix+1))은 seed와 상관없이 **같은 두 나선** 위에만 놓인다. r98 몸 무더기 12개 seed가 모두 그 두 곡선 위에 있다(`k11r3-fire-spiral-points`).
  - **내 처방의 결함이다.** 처음 지시서의 각 J(k)·거리 J(k+40)도 같은 성질(직선 둘)이다.
- 그래도 바꾸지 않는 근거(step 2, seed 7개, `k11r3-fire-kr-eval`, `-eval2`):

  | 안 | r98 빈 자리 | r70 빈 자리 | 덮임(B) |
  |---|---|---|---|
  | S1(지금) | 43 | 29 | — |
  | kr cand 6 | 45 | — | — |
  | kr cand 10 | 45 | 40 | — |
  | kr + mirror 30 | 48 | — | — |
  | kr cand 16 + mirror 30 | 45 | — | — |
  | 모든 안 | — | — | 같은 수준(46.5~54) |

  - 'kr'은 합격선(≤ 44)을 오히려 넘는다.
  - 연속 seed(101~105) 불 다섯 개를 1x로 나란히 놓아도 같은 배치가 되풀이되어 보이지 않는다(`k11r3-fire-template-x1`).
  - 불은 합격해 연결을 기다리는 판이다. 바꾸면 벡터와 표를 다시 내고 다시 맞춰야 한다.
- 앞으로의 규칙(API §8.0에 적는다):
  - **2D 위치를 jit 두 값의 짝으로 뽑지 않는다.** 간격이 무엇이든 직선 몇 개 위에 놓인다. 새 배치는 모두 'kr'을 쓴다.
  - 불 몸 무더기(S1)와 char만 기존 jit 짝을 쓰는 승인된 예외로 남긴다.
- 렌더러 이식: `scatter`는 두 pool을 모두 옮긴다. 불은 pool 없음(J(ix), J(ix+1), 변형·flip·phase는 J(ix+2..4)), 6종은 'kr'(w로 변형·flip·phase)이다.

**(2) `mire-xl` 2장과 넓이 목표 30% 식 → 수용**
- 맵 감속(145~270)은 지시서 식(r²/2600, l 최대 18)과 상한 24로는 6~10%밖에 안 된다. 큰 단(xl)이 필요하다.
- 식은 결정적이고 렌더러가 그대로 옮기기 쉽다. tiers [<100 m·s / <160 l·m / ≥160 xl·l], n = clamp(round(r²/area), 3, 18), nBig는 목표 0.3·πr²를 칠한 넓이 표(s 220, m 524, l 1220, xl 3900)로 푼다.
- 1x(`k11r3-slow-big-x1`)에서 r150~270 모두 고르게 퍼진 먹물 웅덩이로 읽힌다. 실측 28.9~30.9%다.
- 예산 +2장 / +15,840은 상한 안이다.
- 주의(메인 세션 화면 검사): 적(가장 어두운 밴드)이 ink700 웅덩이 위에 서면 실루엣이 붙는다. 3장 감속 장면에서 돌격수·추적자가 웅덩이 위에 있는 캡처를 한 장 본다. 적 halo가 있어 지금은 읽힌다.

**(3) 물 r ≥ 200의 성김 → 처방이 필요하다(W1, 물 켜기 전)**
- 1x(`k11r3-water-big-x1`)에서 r145·200·270 물은 '타일 위의 그림자 원'으로 읽힌다. 물결(31×11)과 흐름(32×3)이 너무 작다.
- 개수만 두 배로 늘려도(`water-variants-x1` D1, 17개) 티끌만 늘 뿐 물로 읽히지 않는다. 바탕 α를 0.34로 올려도(D2) 같다.
- 길게 끊긴 수면 획을 넣으면 바로 물이 된다(`water-mock-x1`: 흐름 조각을 가로 2.8배로 늘인 모형).
- 그래서 새 조각을 그린다(§3 W1). 큰 물결 고리(+16장)는 비 오는 수면처럼 읽혀서 넓이 예산을 쓸 값이 낮다. 넣지 않는다.

**(4) 다르게 한 것 16~33 → 모두 수용(조건 둘)**

| # | 판정 |
|---|---|
| 16 | 수용((2)) |
| 17 | 6종 수용, 불은 (1)대로 지금 판 유지 |
| 18 | 수용. 터짐 금이 산호 채움 위에서 빛나는 선으로 읽힌다(`c2c-shock`) |
| 19 | 수용. 3줄 망점 가장자리가 1x에서 띠로 읽힌다 |
| 20 | 수용. 번호대 겹침 없음(slow 3000은 불 3000과 다른 지형이라 무관). 단 (1)의 규칙: 2D 위치는 'kr'만 |
| 21~23 | 수용 |
| 24 | 수용. paths 값은 늘 '선 목록'이다(이식 주의) |
| 25~29 | 수용(29: 덫 shut은 무해 상태라 테도 함께 옅어져도 V4에 걸리지 않는다) |
| 30 | 수용 |
| 31 | B1로 보강 |
| 32·33 | 수용. W1 뒤 물 extent를 다시 보고한다 |

**(5) 묶임과 가장 가까운 쌍**
- **묶임**
  - 5배(`k11r3-bind-x5`)에서는 코트 자락 아래로 X로 감긴 가시 덩굴이 분명하다.
  - 1x(`k11r3-bind-x1`)에서는 묶이지 않은 결과 나란히 놓으면 '자락 아래 검은 띠'로 구별은 된다. 그러나 '묶임'으로는 약하다. 덩굴이 검은 장화와 붙는다.
  - hurt 장(검은 코트)에서는 거의 사라진다.
  - 묶인 동안 결은 idle·hurt 자세에 머무르므로 B1로 보강한다.
- **slow ↔ root**
  - 색·흑백 1x(`k11r3-slow-root-pair`)에서 갈린다. slow r86은 27~45 폭 덩어리 약 18개, root r52는 18 폭 가시 갈고리 4개다.
  - 다만 root는 성겨서(덩굴 2.5%) '가시덤불 지대'의 존재감이 약하다. 6개면 덤불로 더 읽힌다(`root-variants-x1`, 권장 R1).
- **적·적 탄·픽업**: 혼동 없음(§1 표).

### 3. 반드시 고칠 것 (그 종류를 켜기 전에. 불 연결과는 무관)

**W1 물: 긴 수면 획 `wave-a`·`wave-b` 신설**
- 조각:

  | 항목 | 값 |
  |---|---|
  | 장·drive | 6장 loop @6fps |
  | box / anchor | 100×14 / (50,7) |
  | layer / z / lod | hazard / ground / **info** |
  | 칠한 크기 | ≤ 90×6 |
  | 색 | p300 획 1.6(끝 0.8로 가늘어짐) + 아래 ink3 0.8 그늘선. 물결과 같은 토큰 |

  - 모양: 한 조각에 끊긴 가로 획 두 줄이다.
    - 위 줄 40~70, 아래 줄 25~45 길이이고, 가로로 10 이상 어긋난다. 세로 간격은 3~4다.
    - 각 줄은 2~3마디(틈 4~8)다. 물결 진폭 ≤ 1.5, 파장 28~40이다.
    - 닫힌 도형과 점은 쓰지 않는다.
  - 움직임: 마디가 장마다 오른쪽으로 2씩 흐르고 끊긴 자리가 옮겨 간다. 통째로 미는 것이 아니다. 마지막 장 → 첫 장 이음매 점프는 ≤ 2다.
- 배치:
  - n = clamp(round(r²/6000), 2, 10). r145는 4, r200은 7, r270은 10이다.
  - `scatter` 'ground', pool 'kr', reach {frac 0, pad 28}, gap {frac 1, cap 46}, squash 3, mirror 2, jit base 4400 / stride 5. 변형·flip·phase는 w로 정한다.
- prio와 상한:
  - prio: wave 0, ripple 1, flow·glint 2. 상한을 넘으면 2부터, 나중 것부터 뺀다.
  - water 상한 13/7/1 → **20/10/3**. reduced는 wave·ripple 절반, flow 0이다. minimal은 wave 2(멈춤) + ripple 1(still 3)이다.
- 예산: +12장 → 297장, +16,800 → 417,736(상한 330 / 450,000 안).
- 합격 기준:
  - 3장 r145·200·270을 1x와 0.8x 흑백으로 렌더해 수면 획이 원 전체에 보이고 물로 읽힌다(`k11r3-water-big-x1`과 같은 장면).
  - C5 흑백의 물 칸이 소거법 없이 물로 읽힌다.
  - 어느 60×60 창에도 같은 길이·같은 간격의 평행 획이 3줄 이상 없다(해칭 금지).
  - C6·C7·C12 0건, `_.check()` 0건.
  - water:200:3 C9 벡터를 다시 내고, extent를 보고한다.

**B1 묶임 보강(`bind-back`·`bind-front` 각 4장, 박스·앵커·layer 그대로)**
- `bind-front`:
  - 위 가닥을 y −12~−13으로 올린다(칠할 범위 [−18,−15,18,3] 안).
  - 다리마다 두 가닥을 비스듬한 한 가닥으로 이어 띠 둘이 아니라 **감김(나선)**으로 보이게 한다.
  - 먹 굵기는 1x ≥ 2다.
- 두 조각 공통: 덩굴 바깥(빛 쪽 위·왼쪽)에 **p300 0.8 가장자리**를 둔다. 검은 장화와 hurt의 검은 코트 위에서도 덩굴이 남는다. hero 그룹 허용 색 안이다.
- `bind-back`: 발 양옆에서 땅으로부터 다리로 올라오는 덩굴을 하나씩 키운다. 높이는 y −15까지, 폭은 x ±18까지다(범위 [−20,−16,20,2] 안). 땅에서 올라와 감는 것이 1x에 보여야 한다.
- 합격 기준:
  - 1x 자름 렌더에서 '묶인 결 / 안 묶인 결'을 idle, run 0·4, hurt 0, facing ±1에 대해 색과 흑백으로 나란히 놓고, 모든 칸에서 묶인 쪽이 1x로 구별된다.
  - 4배에서 덩굴이 다리를 감는다.
  - C7 4줄 0건, 링 조건(아래 끝 ≤ +3) 유지, C6 0건.

### 4. 권장
- **R1**: 속박 덩굴 수를 clamp(round(r/8.5), 3, 6)로 한다. r50·52에서 6개이고, 상한 6 안이다. root:52:9 벡터를 다시 낸다.
- **R2**: API §8.0에 (1)의 규칙(2D 위치는 'kr'만, 불은 승인 예외)을 적는다.
- **R3(메인 세션)**: 다른 킷 모듈(`PN.arsenalFx.layout`, `PN.skillVfx` 등)도 jit 두 값을 2D 위치로 짝지어 쓰면 같은 나선에 묶인다. 확인하지 않았으니 다음 검수 때 본다.

### 5. 메인 세션 등록 주의 (굽기 · 렌더러 이식 · 종류별 켜기 순서)

1. **굽기**
   - 지금 285장으로 굽고 불부터 연결한다. 키는 `hazard/<group>/<part>/<frame>`이고, 매니페스트 vectors에 불 4 + 불티 5를 싣는다.
   - W1(+12장)·B1(8장 다시 그림)·R1이 들어오면 다시 굽는다. 키 이름으로 찾으므로 기존 키는 그대로이고, 페이지 안 위치만 바뀐다.
   - 덫 조각에는 `PN.env.CH` 장 재질색이 구워진다(COLOR_MAP 확인).
2. **렌더러 이식(`hazardArt.ts`)**
   - `scatter`(pool 없음 = 불의 jit 짝 / 'kr' + mirror + w), `rimPlace`, `capCut`, `mirePlan`, 종류별 layout·paths를 옮긴다. paths 값은 늘 선 목록이고, jag는 `jag[0]`이다.
   - layout은 지형 id로 상한 전 목록을 캐시하고, LOD마다 거른 뒤 그 LOD 상한으로 capCut한다(2회차 납품서 §6-2).
   - `hazardArt.test.ts`는 종류를 켤 때마다 그 종류 벡터로 시험한다. W1·R1 뒤 물·속박 벡터가 바뀐다.
3. **켜기 순서**

   | 순서 | 종류 | 조건 |
   |---|---|---|
   | ① | **fire** | 지금. FX-03 교체와 검수 1차 §8, 2차 §8 그대로 |
   | ② | **trap, null** | null은 `palette.ts` `NEUTRAL.voidPaper '#e2dbcb'`, `visualRegistry.ts:205` 채움 교체, `palette.test.ts`에서 null은 호박·중립만 허용(산호 링 끔) |
   | ③ | **shock** | 엔진 표시 계층 변경 뒤: `shock/burst` 이벤트에 id·radius, `presentation.ts` shocks 목록(지시서 §9-4). 예고 테는 현행 그대로, 가운데 기호만 뺀다 |
   | ④ | **slow** | 4장 다이얼, `end` 0.5초. 해칭은 현행 렌더러 패턴(큰 원 성능 주의, 지시서 §5.3) |
   | ⑤ | **root + bind** | B1(+R1) 반영 판 |
   | ⑥ | **water** | W1 반영 판 |

   켜지 않은 종류는 지금 벡터 그림(글리프 포함)을 쓴다.
4. **성능**: 지시서 §9-7 지형 묶음(불 레인 21, 원형 붕괴, 감속 r200 ×2, 속박 ×9, null r170, 물 r250, 덫 ×2)을 쓴다.
   - 상한 160/90/40과 불 72/40/20의 prio 등급 배분을 잰다.
   - 물 상한은 W1 뒤 20/10/3이다. 지형 비용 ≤ 0.5ms, work p95 ≤ 8ms여야 한다.
5. **화면 검사**(`test:visual`, 지시서 §9-8)에 다음을 더한다:
   - 3장 감속 웅덩이 위의 적(실루엣 붙음 확인)
   - 속박 묶임 1x(B1 뒤)
   - 물 r200 이상(W1 뒤)

### 6. 열린 질문
- **감속·속박 바탕 명도(P1)**: 현행 렌더러 채움(`#f3ead7`, `#efe6d3`)은 결 코트(Y 0.90)와 명도 차가 작다. 이번 납품 전부터 있던 조건이다. 바이블 §4 밴드에 제어 지대 바탕 상한(예: Y ≤ 0.80)을 둘지 팀이 정한다.

### 7. 본 렌더와 확인하지 못한 것
- 직접 연 렌더(`k11r3-*`):
  - 장면: `c2b-ch1-x1`, `c2b-ch3-x1`, `c2b-ch4-x1`, `c2b-ch5-x08-gray`, `c2c-shock`, `c5-t1-gray`, `slow-big-x1`, `water-big-x1`, `slow-root-pair`, `root-variants-x1`, `bind-x1`, `bind-x5`, `confusion-x1`
  - 조각·상태: `c3-root-parts`, `c3-slow-parts`, `c3-misc-parts`, `c3-trap-parts`, `c4-misc`
  - 물 안: `water-variants-x1`, `water-mock-x1`
  - 불 'kr': `fire-spiral-points`, `fire-kr-eval`, `fire-kr-eval2`, `fire-template-x1`
  - 검사: `c6-scan`, `c7-geometry`, `c8-unchanged`, `selfcheck`
  - 코드 확인: `api-probe`, `src-scatter`, `src-layout`
- 내 시안은 리뷰 시트 메모리에서만 SPEC을 바꾸거나 조각을 늘여 그린 것이다. 파일은 고치지 않았다. W1의 늘인 모형은 판단용이고, 실제 조각은 새로 그린다(조각 비확대 원칙).
- 미확인:
  - 색각(deutan·protan) C5는 이번에 다시 돌리지 않았다(납품서 ok 수용).
  - C1·C10·C11·C12 행 표는 다시 돌리지 않았다. C12 첫 줄 값은 `selfcheck`로 확인했다.
  - 새 종류의 테 둘레 비율 수치
  - 루프·cycle 움직임, 다이얼 바늘, 2Hz 물듦
  - 성능
  - 다른 모듈의 jit 짝 사용(R3)
- 관련 파일:
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`
    - `layoutFire` :1232-1268
    - `scatter`·`rimPlace`·`capCut` :1150 부근-1230
    - `mirePlan`·`LAYOUTS.slow` :1362-1379
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-hazards.md`
  - `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K11-hazards.md`
  - `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/terrain-hazards.md`

---

## 3차 납품서 — 검수 3차 수정: W1 물 수면 획 · B1 묶임 · R1 덩굴 수 · R2 2D 위치 규칙 (`PN.hazards` v1.0-d2r1)

### 0. 요약

검수서 §3·§4와 지시서 §15의 네 항목(W1, B1, R1, R2)을 넣었습니다. 아래 검사는 모두 통과했습니다.
- **불 출력은 바뀌지 않았습니다.** C9 불 벡터 4개(50:1, 74:7, 98:7, 150:23)와 불티 벡터 5개를 수정 2회차 원문과 줄마다 대조했고, 한 자리도 다르지 않습니다.
  - 불 조각·그림 해시도 냈습니다(§5-1). 메인 세션의 285장 스냅숏과 대조할 수 있습니다.
- `--check`: 모두 ok
- C6: `bad colours=0 banned=0`
- C7: 1~5줄 0건, 6줄 ok. 물 상한은 새 값 20/10/3으로 검사했습니다.
- C8: 기준 해시 그대로
- C11: 40장 ok
- C12: `frames=297 ok boxArea=417736 ok badDrive=0`
- `_.check()`: 0건
- kit error: 0건

고친 파일은 둘뿐이고, 아무것도 내려받지 않았습니다.
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-hazards.md`(v1.0-d2r1로 갱신. §13의 34~40에 이번에 정한 것을 적었습니다.)

**먼저 알려 드릴 것 세 가지**

1. **R2를 6종에 남아 있던 jit 짝에도 적용했습니다.** 그래서 water·root 말고도 바뀐 벡터가 있습니다.
   - 바꾼 곳: 기포의 웅덩이 위 자리, 지우개 부스러기의 칸 안 각·깊이, null 유령 선의 각·거리. 셋 다 jit 두 값을 짝지어 쓰던 곳이고, 이제 `kron`을 씁니다.
   - 이유: 지시서 §15-1의 승인 예외는 '불 몸 무더기와 char뿐'입니다.
   - 그 결과 `slow:150:5`(기포 다섯만)와 `null:130:11`(부스러기·유령 선) 벡터가 바뀌었습니다. 웅덩이, jag, shock, trap은 그대로입니다.
   - 이 두 종류는 아직 켜지지 않았으니 이식할 때 새 벡터를 쓰면 됩니다.
2. **shock 균열 마디의 (길이, 꺾임)도 jit 연속값입니다.** 위치가 아니라 선 모양 매개라서 바꾸지 않았습니다.
   - 바꾸면 합격한 균열 모양과 벡터가 바뀝니다.
   - 규칙을 여기까지 넓힐지는 검수에서 판단해 주십시오(API §8.0-0, §13-39).
3. **버전 문자열을 `'1.0-d2r1'`로 바꿨습니다.** 285장 스냅숏(`'1.0'`)과 구분하려는 것입니다.
   - 조각은 297장이 됐습니다. 새 키는 `hazard/water/wave-a/0..5`, `wave-b/0..5` 12장입니다.
   - bind 8장은 키는 그대로이고 그림만 바뀌었습니다.

---

### 1. 납품 목록

| 파일 | 네임스페이스 | 이번에 바뀐 것 |
|---|---|---|
| `k-hazards.js` | `window.PN.hazards` | `version '1.0-d2r1'`, 조각 `water/wave-a`·`wave-b`(6장 loop @6), `hero/bind-back`·`bind-front` 다시 그림, `SPEC.water.layout`(wave·prio·caps·cut), `SPEC.root.layout.vine.per` 8.5, `SPEC.null.ghost.jit`·`null.layout.crumb.jit`를 `{base}`로, `kron()` 도우미(`_.kron`으로도 내보냄), `MASKS.water`에 wave 추가 |
| `API-hazards.md` | — | 판 표기·§4.4·§5·§6.6·§6.7·§7.3·§7.5·§7.6·§8.0-0(2D 위치 규칙)·§8.6·§8.8·§8.9·§8.10·§8.12·§8.13·§10·§11·§12·§13(34~40)·§14·§15 |

- **기본 출력이 바뀐 것**
  - `layout/draw('water')`: 수면 획이 생겼고 prio와 상한이 바뀌었다.
  - `layout/draw('root')`: 덩굴이 4개에서 6개가 됐다.
  - `overlay('hero','bind-*')`: 그림이 바뀌었다.
  - `layout/draw('slow')`: 기포 자리·위상만 바뀌었다.
  - `layout/paths/draw('null')`: 부스러기와 유령 선이 바뀌었다.
  - 그대로인 것: fire, shock, trap, hero back·front·embers, mob.

### 2. API 요약 (바뀐 것만)

- **`wave-a`·`wave-b`**: box 100×14, anchor (50, 7), hazard/ground, **info**, 6장 loop @6fps.
  - 칠한 크기: a 66.0×5.84, b 80.1×5.85(상한 90×6).
  - 끊긴 가로 획 두 줄이다. 위 줄 58~60, 아래 줄 44 길이이고, 두 줄 가운데가 14~29 어긋나며 세로 간격은 3이다.
  - 줄마다 끊김 자리가 둘이다. 끊김은 장마다 오른쪽으로 2씩 흐르며 열렸다 닫히고(폭 0·4·6·6·4·0), 두 자리가 3장 어긋난다.
  - 그래서 줄은 늘 2~3마디(최소 마디 8, 틈 4~6)이고, 마지막 장 → 첫 장 이음매 점프는 2다.
  - 색: p300 1.6(끝 0.8) + ink300 0.8 그늘선. 닫힌 도형·점은 없다.
- **water layout**
  - 개수: nw = clamp(round(r²/6000), 2, 10)이다. r145는 4, r200은 7, r270은 10이다.
  - 배치: scatter 'ground', pool 'kr', reach r − 28, gap min(r, 46), squash 3, mirror 2, jit base 4400 / stride 5. 변형·flip·phase는 w로 뽑는다.
  - 물결과 흐름은 수면 획과 떨어지게 놓는다(`fixed`).
  - prio: wave 0, ripple 1, flow·glint 2.
  - 상한: 20/10/3. 넘치면 prio 2부터, 나중 것부터 뺀다.
  - reduced: 획과 물결은 각각 절반, 흐름은 0.
  - minimal: 획 2(phase 장에서 정지) + 물결 1(still 3).
  - 감소 모션: 획은 phase 장에 멈춰 남고, 흐름·반짝임은 그리지 않는다.
- **root**: n = clamp(round(r/8.5), 3, 6)이다. 반경 50·52에서 6개이고, seed 1~60 모두 6개를 놓는다.
- **bind**(박스·앵커·layer 그대로)
  - **back**
    - 발밑과 양옆에 낮은 가시 뿌리 덩어리(x ±19, 윗가장자리 p300)가 장마다 솟는다.
    - 양옆에서 덩굴 하나씩이 실루엣 바깥을 타고 y −13.8까지 오른다. 먹 3.6 → 2.4, p300 0.8 가장자리, 가시 2.
  - **front**
    - 다리마다 나선 한 가닥: 다리 오른쪽 가장자리 옆 땅에서 나와 다리 앞을 가로질러 y −12.8까지 감아 오른다. 먹 3.4 → 2.4, 가시 3.
    - 두 다리가 같은 감김 방향이다. 거울로 그리면 V자로 읽혔다.
    - 발끝마다 짧은 뿌리 고리(먹 2.8 → 2.0)가 있다.
  - 모든 덩굴의 빛 쪽에 p300 0.8 가장자리를 두었다.
  - 칠한 범위(4장 전체): back x −19.72~19.39, y −15.79~1.70(상한 [−20, −16]–[20, 2]) / front x −13.88~16.15, y −13.21~2.19(상한 [−18, −15]–[18, 3]). 아래 끝 ≤ +3이라 링 조건을 지킨다.
- **`kron(seed, base)`** = kr(t, n) = frac(J(base + t) + n·SPEC.jit.kron[t]), t = 0..4.
  - scatter pool 'kr', 기포, 부스러기, 유령 선이 쓴다.
  - API §8.0-0에 2D 위치 규칙을 적었다. 2D 위치는 jit 짝을 쓰지 않는다. 승인 예외는 불 전체(몸 무더기, char, 고리의 칸 안 흔들림, 불티·연기 슬롯)다. 1D 뽑기는 jit을 그대로 써도 된다.

### 3. 검사 결과

렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 최종 이름은 `k11-r3z-*`·`k11-r3f-*`, 작업 중 이름은 `k11-r3-*`이다.

**`--check`(모두 ok)**
- C1 `k11-r3z-c1-all`
- C2a `k11-r3f-c2a-ch1-fire`
- C2b `k11-r3f-c2b-ch1~ch5-terrain`, `-c2b-ch3-x08-gray`
- C2c `k11-r3f-c2c-shock`
- C3 `k11-r3z-c3-{hero,water,root}-parts`, `k11-r3-c3-water-parts`
- C4 `k11-r3f-c4-fire`, `-c4-misc`
- C5 `k11-r3-c5-t1-gray`, `k11-r3z-c5-t1-{deutan,protan,color}`
- W1 `k11-r3-water-big-x1b`, `k11-r3-water-big-x08-gray`, `k11-r3-wave-frames-x6`
- B1 `k11-r3-bind-x1`, `-x1-gray`, `-x4`
- C11: 40장

**C6**
```
bad colours=0 banned=0
```

**C7**(2줄 물 상한 20/10/3, 4줄 RC.back [−22,−26,22,2])
```
1 stamps outside box-3: 0
2 bases outside r-6: 0 | ground items over r-2: 0 | tips over far rim+6: 0 | over per-hazard cap: 0
3 paths outside: 0
4 overlays outside their rects: 0
5 hero ember paths through the face zone (outward drift): 0
6 invalid calls ok
```

**C8**
```
env-hazard=1t61rxb len=1541876 skillVfx=7bdpsi len=679982 enemy-all=kubxcy len=5226045
```

**C9**(필드 [part, x, y, flip, phase, z, prio])
- 그대로인 것:
  - 불 4개(`fire:50:1` 11, `74:7` 20, `98:7` 31, `150:23` 36)
  - 불티 5개(`_.emberSlots` 4개 + `_.heroEmberSlots(0.3)`)
  - `shock:190:11`(돌 조각 6 + cracks 14줄)
- 새 벡터:
```
water:200:3 (16)  ch 3
["ripple-a",-49.62,-148.74,0,0.345,"ground",1] ["wave-a",37.31,-114.42,0,0.094,"ground",0] ["flow-a",-20.47,-82.71,0,0.389,"ground",2]
["glint",-66.13,-61.04,0,0.194,"ground",2] ["wave-b",-48.49,-53.68,1,0.479,"ground",0] ["ripple-a",-145.6,-48.51,1,0.729,"ground",1]
["wave-b",105.81,-44.42,0,0.94,"ground",0] ["wave-a",48.99,-4.09,1,0.633,"ground",0] ["wave-a",-64.89,5.92,1,0.401,"ground",0]
["ripple-b",101.84,14.12,0,0.268,"ground",1] ["ripple-a",-139.11,23.7,1,0.806,"ground",1] ["wave-a",-43.43,60.63,0,0.017,"ground",0]
["ripple-b",154.88,62.38,1,0.191,"ground",1] ["flow-b",19.17,104.54,0,0.85,"ground",2] ["wave-b",-50.16,126.89,1,0.556,"ground",0]
["flow-a",-10.57,165.32,0,0.312,"ground",2]

root:52:9 (6)   v1.0의 네 항목은 값까지 그대로, 둘이 더해짐
["vine-b",-17.73,-27.34,0,0.769,"flame",0] ["vine-a",12.45,-18.3,1,0.846,"flame",0] ["vine-c",-10.31,-2.74,0,0.923,"flame",0]
["vine-b",23.91,11.37,1,0.384,"flame",0] ["vine-c",-23.11,23.31,0,0.307,"flame",0] ["vine-a",17.43,30.88,1,0.23,"flame",0]

slow:150:5 (23)  ch 3. 웅덩이 18개는 2차 납품서와 같고 기포만 바뀜
... mire 18 (2차 납품서 원문 그대로) ...
["bubble-b",-29.38,-107.65,0,0.659,"flame",2] ["bubble-b",-61.8,-38.91,0,0.402,"flame",2] ["bubble-a",-18.84,-2.53,0,0.288,"flame",2]
["bubble-a",35.93,18,0,0.773,"flame",2] ["bubble-a",26.96,92.63,0,0.03,"flame",2]

null:130:11 (8)
["crumb-b",28.53,-117.9,0,0,"ground",0] ["crumb-c",-42.98,-115.78,1,0,"ground",0] ["crumb-a",90.42,-82.65,1,0,"ground",0]
["crumb-a",-98.49,-70.68,0,0,"ground",0] ["crumb-c",100.47,69.79,1,0,"ground",0] ["crumb-b",-87.06,82.06,1,0,"ground",0]
["crumb-a",43.71,112.41,1,0,"ground",0] ["crumb-c",-26.97,119.42,0,0,"ground",0]
null:130:11 ghost0 [[124,1.03],[-122.99,15.79]]
null:130:11 ghost1 [[122.11,-21.57],[-10.66,123.54]]
null:130:11 ghost2 [[-16.94,-122.84],[-9.78,123.61]]
null:130:11 ghost3 [[-42.62,-116.44],[117.57,39.41]]
null:130:11 jag0 (그대로) [[127.86,0],[108.31,62.53],[64.14,111.09],[0,129.71],[-63.46,109.92],[-111.16,64.18],[-125.57,0],[-111.52,-64.39],[-62.11,-107.57],[0,-127.42],[62.32,-107.93],[109.17,-63.03]]
```

**C10**: 모든 줄 ok로, 1·2차와 같은 값이다(fire 1.78~1.82, water 1.57~1.60, trap 2.31~2.42, null 1.54~1.75, soot 1.34~1.36, coat Y 0.620/0.780/0.705).

**C12**
```
frames=297 ok boxArea=417736 ok badDrive=0
water/wave-a f6 loop@6 box100x14 a50,7 hazard/ground info
water/wave-b f6 loop@6 box100x14 a50,7 hazard/ground info
hero/bind-back f4 prog 0.2s box46x24 a23,19 body-back/body info
hero/bind-front f4 prog 0.2s box42x24 a21,18 body-front/body info
(나머지 줄은 2차와 같다)
```

**`_.check()`**(`k11-r3z-selfcheck`)
```
PN.hazards._.check(): 0 issue(s) (21 s), version 1.0-d2r1
PN.hazards._.check({areas:false}): 0 issue(s)
kinds/groups/states == planned: true  frames 297 boxArea 417736  kron function
```

**W1 해칭 검사**(`k11-r3-water-hatch-check`): r145·200·270 × seed 1~20의 수면 획 840줄을 봤다. 60×60 창 안에서 같은 길이(±2)·같은 간격(±1.5)으로 겹친 평행 3줄은 **0건**이고, 창 하나의 최대 줄 수는 4다.

**물 항목 수**(`k11-r3z-water-lod`, seed 1·7·23)
- r140: full 10(획 3, 물결 4, 흐름 2, 반짝임 1), reduced 4, minimal 3
- r145: full 11(4, 4, 2, 1), reduced 4, minimal 3
- r200: full 16(7, 5, 3, 1), reduced 7, minimal 3
- r270: full 20(획 10, 물결 7, 흐름 3. 반짝임과 흐름 둘은 상한에서 빠짐), reduced 9, minimal 3

**종류별 면적·빈 자리**(`k11-r3f-area-table`)

| 종류 r | 채움 | 빈 자리 | 비고 |
|---|---|---|---|
| fire 74 / 98 / 150 | 덮임(B) 51.2~52.6 / 47.4~49.7 / 29.8~30.3 | 28.3~30.5 / 33.9~43.3 / 62.2~76.4 | 수정 2회차와 같음 |
| slow 60~270 | 28.9~30.9 | (2차와 같음) | 기포만 바뀌어 같은 값 |
| root 50 / 52 | 3.8~3.9 / 3.5~3.7(≤ 18) | 28.8~39.6 / 34.2~37.9 | v1.0은 2.4~2.6 / 38.6~44.2 |
| **water 145 / 200 / 270 (extent)** | **5.8~5.9 / 4.7~4.9 / 3.7** | **81.2~98.1 / 106.2~113.8 / 130.2~148.0** | v1.0은 2.2~2.3 / 1.6 / 1.2~1.3, 빈 자리 116~201 |

물의 extent는 획·물결·흐름이 흐르며 쓸고 가는 자리(내접 타원)다. 획이 길고 얇아서 비율은 작지만, 1x에서 원 전체에 고르게 보인다.

**직접 본 렌더(모두 Read로 열었음)**
- **W1**
  - `k11-r3-water-big-x1b`(r145·200·270 1x), `k11-r3-water-big-x08-gray`(0.8x 흑백)
  - `k11-r3-wave-frames-x6`(6장 × 2변형), `k11-r3z-c3-water-parts`
  - `k11-r3-c5-t1-gray`(물 칸)
  - 고치기 전 판: `k11-r3-water-big-x1`, `k11-r3-c3-water-parts`
- **B1**
  - `k11-r3-bind-x1`·`-x1-gray`(1x 16칸)
  - `k11-r3-bind-sim1x-all`(1x 흐림을 흉내 낸 3배)
  - `k11-r3-bind-x4`, `k11-r3-bind-poses-x5b`, `k11-r3-bind-zoom2`, `k11-r3z-c3-hero-parts`
  - 고치기 전 판: `k11-r3-bind-pairs-x1~x1d`, `-x3~x3c`, `-idle-x6`(V자 판), `-sim1x-x6`·`x6b`
- **장면**
  - `k11-r3f-c2b-ch1~ch5-terrain`, `-c2b-ch3-x08-gray`, `-c2c-shock`, `-c2a-ch1-fire`, `-c4-misc`, `-c4-fire`
  - `k11-r3z-c5-t1-color`
- **숫자**
  - `k11-r3z-{c6-scan, c7-geometry, c8-unchanged, selfcheck, water-lod, fire-hash}`
  - `k11-r3f-{c9-read-fire, c9-embers, c9-read-new, c9-read-null, c9-shock, c10-contrast, c12-parts, area-table, bind-extents}`
  - `k11-r3-{root-counts, water-hatch-check, wave-extents2, wave-segs, root-extents2}`

### 4. 지시서 대비 (검수서 §3·§4)

**W1 물**

| 기준 | 결과 |
|---|---|
| 조각 6장 loop @6, box 100×14 / (50, 7), hazard/ground/info, 칠한 ≤ 90×6 | 맞음(66.0×5.84, 80.1×5.85) |
| 위 줄 40~70, 아래 줄 25~45, 가로 10 이상 어긋남, 세로 3~4 | 58~60 / 44 / 가운데 14~29 / 3 |
| 줄마다 2~3마디(틈 4~8), 진폭 ≤ 1.5, 파장 28~40 | 2~3마디(최소 마디 8, 틈 4~6), 진폭 0.5~0.55, 파장 30~36 |
| 마디가 오른쪽으로 2씩 흐르고 끊김이 옮겨 감(통째로 밀지 않음), 이음매 점프 ≤ 2 | 맞음(줄 끝 고정, 끊김만 흐름) |
| n = clamp(round(r²/6000), 2, 10), scatter 'ground' 'kr' reach pad 28 · gap 46 · squash 3 · mirror 2 · base 4400/5, w로 변형·flip·phase | 맞음(4/7/10) |
| prio wave 0 / ripple 1 / flow·glint 2, 상한 20/10/3, reduced 절반·flow 0, minimal wave 2 + ripple 1 | 맞음 |
| 예산 297장 / 417,736 | 맞음 |
| 3장 r145·200·270 1x·0.8x 흑백에서 물로 읽힘 | 맞음: 원 전체에 끊긴 밝은 수면 획이 고르게 깔려 '흐르는 수면'으로 읽힌다. 고치기 전의 '타일 위 그림자 원'이 아니다 |
| C5 흑백 물 칸이 소거법 없이 물로 읽힘 | 맞음: 중간 어둠 + 가로 수면 획 + 고리 |
| 60×60 창 평행 3줄 없음 | 0건 |
| C6·C7·C12 0건, `_.check()` 0건, water:200:3 C9, extent 보고 | 맞음(§3) |

**B1 묶임**

| 기준 | 결과 |
|---|---|
| front 위 가닥 y −12~−13 | 나선 위 끝 y −12.8 |
| 다리마다 두 가닥 대신 감기는 한 가닥(나선), 먹 ≥ 2 | 다리마다 한 가닥(먹 3.4 → 2.4), 같은 감김 방향 |
| 두 조각 빛 쪽 p300 0.8 가장자리 | 맞음(모든 덩굴과 뿌리 덩어리 윗가장자리) |
| back: 발 양옆 땅에서 다리로 올라오는 덩굴, 높이 y −15·폭 x ±18까지(범위 [−20,−16,20,2] 안) | 오르는 덩굴은 y −13.8까지 닿는다(가장자리·가시 포함 칠 −15.8). 뿌리 덩어리 포함 칠은 x ±19.7로 C7 범위 안이다. '±18 / −15'는 덩굴이 닿는 곳으로 읽었다 |
| 1x에서 idle·run 0·run 4·hurt 0 × facing ±1, 색·흑백, 모든 칸에서 묶인 쪽이 구별됨 | 16칸 모두 구별된다. 묶인 쪽은 발밑의 어두운 가시 덩어리, 실루엣 양옆으로 오르는 덩굴, 다리 위 밝은 가장자리 띠가 보인다. hurt의 검은 코트에서도 p300 가장자리로 남는다 |
| 4배에서 다리를 감음 | 맞음(`k11-r3-bind-x4`) |
| C7 4줄 0건, 아래 끝 ≤ +3, C6 0건 | 맞음 |

검수서에 없던 것을 세 가지 더했다(API §13-34).
- 뿌리 덩어리: 1x에서 '땅에서 나왔다'는 출발점이 보이게 하려고 넣었다.
- 같은 감김 방향: 거울로 그리면 V자로 읽혔다.
- 발끝 뿌리 고리: 장화를 땅에 붙든다.

**R1**: `root.layout.vine.per` 8.5다. 반경 50·52에서 6개(seed 1~60 모두)이고, 상한 6 안이다. 덩굴 면적은 3.5~3.9%(≤ 18%)다. root:52:9 벡터를 새로 냈다.

**R2**
- API §8.0-0에 규칙을 적었다. 2D 위치는 jit 짝을 쓰지 않고 `kron`·pool 'kr'을 쓴다. 승인 예외는 불(몸 무더기·char·고리 흔들림·불티·연기)이다.
- 6종의 남은 짝(기포·부스러기·유령 선)도 `kron`으로 바꿨다(§0-1).
- shock 균열 마디는 위치가 아니라서 그대로 두었다(§0-2).

**T1·T2 자가 판정**
- 물: 흑백에서 '중간 어둠 + 밝은 가로 수면 획 + 고리'다. 소거법 없이 갈리고 water↔slow, water↔null 쌍도 분명하다.
- 묶임: 1x에서 구별된다.
- 그 밖의 종류는 2차와 같다.
- 적·탄·픽업 혼동: 수면 획은 닫히지 않은 가는 획이고 점이 없다(최소 마디 8). 혼동이 없다.

### 5. 메인 세션이 할 일

1. **불 연결은 그대로 진행하면 된다.** 불 출력 확인값:
   - C9 불 4개 + 불티 5개가 수정 2회차와 같다.
   - 이번 판의 불 조각·그림 해시는 `fire-stamps=6wx6hi len=593187`, `fire-draws=1ydln4g len=2730763`이다(`k11-r3z-fire-hash`).
   - 해시 범위: fire·mob 전 조각과 hero back·front 12장, 그리고 `draw('fire', burn·ignite·gutter·soot, r 50·74·98·150, seed 1·7, ch 1, t 0.3, p 0.5)`와 hero back·front·embers 오버레이다. id는 `hzd\d+_ → hzd_`로 정규화했고, djb2-xor 해시를 36진수로 적었다.
   - 스냅숏에서 같은 식을 돌리면 대조할 수 있다.
2. **다시 굽기**(W1·B1 반영 때)
   - 297장, @2x 약 167만 px²로 2048² 한 장이다.
   - 새 키는 `hazard/water/wave-a/0..5`, `wave-b/0..5`다(loop fps 6, info).
   - `hazard/hero/bind-back|front/0..3`은 다시 굽는다.
3. **이식(`hazardArt.ts`)**
   - `kron(seed, base)`를 하나 두고 scatter 'kr', 기포, 부스러기, 유령 선이 같이 쓴다.
   - water: wave 배치·prio {0,1,2,2}·상한 20/10/3·`cut {even −1, keep 1}`·LOD 규칙(API §8.9). 감소 모션에서 획은 정지해서 남긴다.
   - root: per 8.5.
   - `SPEC.null.ghost.jit`·`null.layout.crumb.jit`는 `{base}` 하나로 바뀌었다.
   - 벡터:
     - water:200:3, root:52:9, slow:150:5, null:130:11은 이번 값을 쓴다.
     - shock:190:11은 그대로다.
     - 불 벡터는 수정 2회차 값 그대로다.
4. **켜기 순서**(검수서 §5-3): ⑤ root + bind, ⑥ water는 이 판으로 한다. ② trap·null, ④ slow도 이 판의 벡터로 이식한다(null·slow 기포가 바뀌었다).
5. **성능**: 물 상한이 20/10/3으로 늘었다. 지형 묶음의 물 r250은 full 20 항목 근처다.

### 6. 알려진 한계

- **수면 획은 모두 가로다.** 'ground' 내접 타원이 r − 2 안이어야 해서 원의 맨 좌우 끝에는 획이 덜 닿는다. 넓이 비율(자리 3.7~5.9%)은 작다. 1x 판독은 된다.
- **묶임 조각은 자세를 모른다.** 조각 하나를 모든 자세에 쓴다. run 큰 걸음에서는 나선이 다리와 어긋난다. 1x에서는 '발밑에서 올라온 덩굴'로 읽힌다. 자세별 조각이 필요하면 hero 프레임 수만큼 늘어난다.
- **shock 균열 마디**: jit 연속값(위치가 아님)이라 그대로 두었다(§0-2).
- **정지 렌더로 보지 못한 것**: 수면 획의 흐름 움직임(장 6개를 나란히 놓고 확인만 함), 묶임 0.2초 재생, 루프·cycle 움직임, 성능.
- **사람 원화가 몫**(API §14): 수면 획의 붓 리듬, 묶임 덩굴의 앞뒤 감김(자세별), 가시와 테이퍼.

---

## 검수 4차(짧은 확인): K11 `1.0-d2r1`, 297장 (art-director, 2026-10-19)

### 판정: **합격**. null만 N1 하나를 고친 뒤 켠다
- W1, B1, R1, R2는 검수 3차 §3의 합격 기준을 모두 충족한다.
- 불 출력은 그대로다. 불 연결과 이 판의 굽기, 물·속박·감속·덫·충격 이식을 그대로 진행해도 된다.
- 새로 찾은 것은 하나다. R2를 유령 선에 적용한 결과, null 원 가운데에서 두 줄이 '十·X'로 엇갈리는 경우가 생겼다(아래 판단 1). null을 켜기 전에 N1로 고친다. 작은 식 수정이고 null 벡터만 바뀐다.
- 다시 돌린 검사는 모두 통과다.

| 검사 | 결과 | 렌더 |
|---|---|---|
| C6 | `bad colours=0 banned=0`. 수면 획, bind p300 가장자리, facing ±1 포함 | `k11r4-c6-scan` |
| C7 | 1~5줄 0건, 6줄 ok. 물 상한 20/10/3, null r130 seed 11 포함 | `k11r4-c7-geometry` |
| `_.check()` | 0건, kinds·groups·states = planned | `k11r4-selfcheck` |
| 버전·예산 | version `1.0-d2r1`, 297장, 417,736 | `k11r4-version` |
| 개수 | root 6개(r50·52, seed 5개 모두), water r145·200·270 = 11·16·20(획 4·7·10) | `k11r4-selfcheck` |

### 합격 기준 대조
렌더 폴더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k11r4-*`다.

| 기준 | 확인 | 판정 |
|---|---|---|
| 물 r145·200·270, 1x | `water-big-x1`: 끊긴 밝은 수면 획이 원 전체에 고르게 깔린다. 고치기 전의 '타일 위 그림자 원'이 아니라 돌바닥 위 얕은 물로 읽힌다 | 통과 |
| 같은 장면 0.8x 흑백 | `water-big-x08-gray`: 획이 남고, 결이 가장 밝다 | 통과 |
| C5 물 칸(흑백) | `c5-t1-gray`: 중간 어둠 + 가로 수면 획 2 + 고리. 소거법 없이 물로 읽힌다. 속박 칸은 덩굴 6개로 덤불로 더 읽힌다 | 통과 |
| 60×60 평행 3줄 | 납품서 실측 0건(840줄, 창 최대 4줄)을 수용했다. 렌더에서도 해칭처럼 고른 평행선은 보이지 않는다 | 통과(숫자는 납품서 값) |
| 묶임 1x 16칸 | `bind-x1-f1`(facing +1, 색·흑백): 묶인 결은 영역 안, 안 묶인 결은 밖이다. `bind-x1-fm1`(facing −1, 색·흑백): 둘 다 영역 안이다. idle, run 0, run 4, hurt 0 모든 칸에서 묶인 쪽이 1x로 구별된다. 발밑 가시 덩어리, 양옆으로 오르는 덩굴, 다리 위 밝은 가장자리 띠가 보이고, hurt의 검은 코트에서도 p300 가장자리로 남는다 | 통과 |
| 묶임 4배 | `bind-x4`, `bind-legs-x6`, `bind-throw-x6`: idle·throw·hurt에서 나선이 자락과 장화를 감는다 | 통과 |
| 불 C9 벡터 | `fire-c9`를 수정 2회차 원문과 대조했다. fire:50:1(11)과 74:7(20)은 전 항목, 98:7(31)과 150:23(36)은 앞뒤 4항목, `emberSlots(98,7,0.3)` 8개가 모두 같다 | 통과 |
| 불 해시 | `fire-hash`: 납품서 값을 그대로 재현했다(`fire-stamps=6wx6hi len=593187`, `fire-draws=1ydln4g len=2730763`) | 통과 |

불 해시 식(메인 세션이 285장 스냅숏에 같은 식을 돌려 대조한다):
- 정규화는 `.replace(/hzd\d+_/g,'hzd_')`, 해시는 djb2-xor(x = 5381, x = ((x·33) ^ c) >>> 0, 36진수)다.
- stamps: `['fire','mob']`의 parts 순서 × 장, 그다음 hero `back`·`front` × 장을 `stamp(g, part, {frame})`로 이어 붙인다.
- draws: state [burn, ignite, gutter, soot] → r [50, 74, 98, 150] → seed [1, 7] 순으로 `draw('fire', st, {r, seed, ch:1, t:0.3, p:0.5})`를 이어 붙이고, 그 뒤에 `overlay('hero', back|front|embers, {t:0.3, facing:1})`를 붙인다.

### 판단

**(1) R2를 기포·부스러기·유령 선에 적용(slow:150:5, null:130:11 벡터 변경) → 수용. 유령 선은 N1을 더한다**
- 기포와 부스러기의 kron 전환은 규칙에 맞고 문제가 없다(`null-slow-x1`). 두 종류 모두 아직 켜지지 않아 이식 비용도 없다.
- 유령 선은 kron이 거리 값을 고르게 펴서, 두 줄이 가운데를 지나며 크게 엇갈리는 경우가 잦다.
  - 기준: 두 줄 모두 중심에서 0.12r 안을 지나고, 엇갈리는 각이 60°를 넘는 경우.
  - 실측(`ghost-cross2`, seed 200개): r120·130에서 33개(16.5%), r170에서 82개(41%)다. 같은 기준으로 지시서의 jit 식은 0개였다.
  - 1x(`null-cross-x1`, r130 seed 19)에서 원 전체를 가로지르는 옅은 'X'로 보인다. 지시서 §1.9의 기호 금지(X·十)에 닿는다. r170의 6줄은 그물처럼 흩어져 덜하다.
- **N1(null 켜기 전)**: 유령 선의 중심 거리를 |d| ≥ 0.15r로 둔다. 예: d = sign(v − 0.5)·(0.15 + 1.1·|v − 0.5|)·r, v는 그 줄의 kron 값, |d| ∈ [0.15r, 0.7r].
  - SPEC `null.ghost.minOffset 0.15`로 적는다.
  - 가운데를 지나는 줄이 없어지므로 가운데 十·X가 구조적으로 사라진다. 가장자리 쪽 교차는 지운 줄눈으로 읽혀서 괜찮다.
  - 확인: 같은 기준(0.12r, 60°)으로 r120·130·170 × seed 200개에서 0건, C7 3줄 0건, null:130:11 벡터 재발행, `null-cross-x1` 같은 1x 장면 한 장.

**(2) shock 균열 마디(길이, 꺾임)를 jit 연속값으로 둔 것 → 수용**
- 한 마디 안의 1D 모양 매개라 2D 위치 규칙의 대상이 아니다. 두 값이 서로 묶이는 성질은 있다.
- 합격한 균열이 1x(검수 3차 `c2c-shock`)에서 규칙성 없이 자연스럽다.
- 바꾸면 합격한 모양과 벡터가 바뀐다.
- API §8.0-0에 규칙의 범위를 적는다: '2D 위치 = 두 값이 한 점의 좌표가 되는 경우. 한 선의 모양 매개는 jit을 써도 된다. 다만 눈에 띄는 규칙성이 보이면 kron으로 바꾼다.'

**(3) 묶임 조각이 자세를 모르는 한계 → 수용**
- 묶여 있는 동안 걷기 주기는 돌지 않는다. `/Users/kyuukkang/CT_AX/07.playground/src/game/render/worldRenderer.ts:1666-1669`(BUG-15: 'keys held while rooted … must not animate')가 실제 이동이 있을 때만 걸음 장을 쓴다.
- 그래서 묶인 결은 idle·throw·hurt만 보인다. 세 자세 모두 나선이 맞는다(`bind-legs-x6`, `bind-throw-x6`).
- run 큰 걸음에서 어긋나는 것은 정지 렌더에서만 생기는 경우다.
- 조건(메인 세션): 이 규칙을 유지한다. 묶인 상태에서 걸음 장이 나오는 경로(밀려남 등)가 생기면 그 장에서는 bind 오버레이를 그리지 않는다.

### 메인 세션 등록 주의(검수 3차 §5에 더할 것)
- 이 판(`1.0-d2r1`, 297장)으로 굽는다. 새 키는 `hazard/water/wave-a|b/0..5`이고, `hazard/hero/bind-*/0..3`는 다시 굽는다.
- 벡터:
  - 불·shock: 그대로
  - water:200:3, root:52:9, slow:150:5: 이 판 값
  - null:130:11: N1 뒤 다시 낸 값
- 켜기 순서는 검수 3차 §5-3 그대로이고, null만 N1 뒤에 켠다.
- `kron(seed, base)`는 하나만 두고 scatter 'kr', 기포, 부스러기, 유령 선이 같이 쓴다. 불은 jit 짝 승인 예외다.

### 확인하지 못한 것
- 60×60 평행 3줄 수치를 따로 재지 않았다(납품서 값 수용).
- 루프 움직임(수면 획의 끊김 흐름, 이음매 점프 2)
- 성능(물 상한 20)
- 색각(deutan·protan) C5 재실행

### 메인 세션 확인 (2026-10-19)

불 연결에 쓰는 285장 스냅숏(`1.0`)에서 같은 식으로 잰 불 해시가 `fire-stamps=6wx6hi len=593187`, `fire-draws=1ydln4g len=2730763`으로 이 판(`1.0-d2r1`)과 같다.

---

## 3차 수정 납품서 — N1 null 유령 선 (`PN.hazards` v1.0-d2r2)

검수 4차 N1을 넣었습니다. 이제 null 원 가운데를 지나는 유령 선이 없어서, 가운데에서 '十·X'로 엇갈리는 경우가 0건입니다.

바뀐 출력은 `paths('null').ghost`와 그것을 그리는 `draw('null')`뿐입니다. 불 해시와 C7을 다시 확인했습니다.

고친 파일은 둘뿐이고, 명령은 하나씩만 실행했으며, 아무것도 내려받지 않았습니다.
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-hazards.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-hazards.md`

### 1. 바뀐 것

- **식(`PATHS.null`)**: 줄 i의 v = kr(1, i)이고, 중심 거리는 d = s·(minOffset + 1.1·|v − 0.5|)·r다.
  - s는 v < 0.5이면 −1, 아니면 +1이다. 검수서 식의 sign(v − 0.5)를 v = 0.5일 때 +1로 정한 것이다. sign이 0이 되면 줄이 가운데를 지나기 때문이다.
  - 그래서 |d|는 0.15r~0.7r 안에 든다. 각 θ = π·kr(0, i), 현 계산, kron base 2200은 그대로다.
- **SPEC**: `null.ghost.minOffset: 0.15`를 더했다.
- **버전**: `'1.0-d2r2'`로 올렸다. 조각 297장은 d2r1과 같다(다시 구울 것 없음).
- **API**
  - §8.0-0에 규칙의 범위를 적었다. "2D 위치는 두 값이 한 점의 좌표가 되는 경우다. 한 선의 모양 매개는 jit을 써도 되지만, 눈에 띄는 규칙성이 보이면 kron으로 바꾼다. 줄의 (각, 중심 거리)는 그 줄의 자리라서 2D 위치로 본다." shock 균열 마디는 수용됐다고 적었다.
  - §8.6에 새 식과 이력을, §7.6에 SPEC을, §8.13에 벡터 메모를, §12.1에 검사 행을, §13의 41·42에 이번 결정을, §15에 남은 한계를 적었다.

### 2. 확인

**가운데 엇갈림**(`k11-n1-ghost-cross`). 기준은 검수서와 같다: 두 줄 모두 중심에서 0.12r 안을 지나고 엇갈리는 각이 60°를 넘는 seed를 센다.

| r | N1(d2r2) | d2r1 식(같은 기준으로 다시 잼) | 줄의 \|d\|/r |
|---|---|---|---|
| 120 | **0 / 200** | 33(16.5%) | 0.151~0.699 |
| 130 | **0 / 200** | 33(16.5%) | 0.151~0.699 |
| 170 | **0 / 200** | 82(41.0%) | 0.150~0.700 |

d2r1 식의 값이 검수서 실측(33·82)과 같아서, 같은 기준으로 잰 것을 확인했다.

**C7**(`k11-n1-c7-geometry`)
```
1 stamps outside box-3: 0
2 bases outside r-6: 0 | ground items over r-2: 0 | tips over far rim+6: 0 | over per-hazard cap: 0
3 paths outside: 0
4 overlays outside their rects: 0
5 hero ember paths through the face zone (outward drift): 0
6 invalid calls ok
```

**불 해시**(`k11-n1-fire-hash2`, 검수 4차와 같은 식): `fire-stamps=6wx6hi len=593187 fire-draws=1ydln4g len=2730763`으로 그대로다. version `1.0-d2r2`, frames 297이다.
- 다른 종류는 코드가 바뀌지 않았다. 바뀐 곳은 `PATHS.null`의 거리 식, SPEC 키 하나, 버전 문자열뿐이다.
- null의 부스러기와 jag는 3차 납품서 값과 같다.

**C1**: `--check` ok다(`k11-n1-c1-all`).

**null:130:11 다시 낸 벡터**(`k11-n1-c9-null`). 부스러기와 jag는 그대로이고 유령 선만 바뀌었다.
```
layout (8)
["crumb-b",28.53,-117.9,0,0,"ground",0] ["crumb-c",-42.98,-115.78,1,0,"ground",0] ["crumb-a",90.42,-82.65,1,0,"ground",0]
["crumb-a",-98.49,-70.68,0,0,"ground",0] ["crumb-c",100.47,69.79,1,0,"ground",0] ["crumb-b",-87.06,82.06,1,0,"ground",0]
["crumb-a",43.71,112.41,1,0,"ground",0] ["crumb-c",-26.97,119.42,0,0,"ground",0]
ghost0 [[122.38,19.96],[-119.14,34.39]]
ghost1 [[123.94,-4],[7,123.8]]
ghost2 [[-35.22,-118.89],[-28.26,120.74]]
ghost3 [[-26.01,-121.24],[121.91,22.67]]
jag0 [[127.86,0],[108.31,62.53],[64.14,111.09],[0,129.71],[-63.46,109.92],[-111.16,64.18],[-125.57,0],[-111.52,-64.39],[-62.11,-107.57],[0,-127.42],[62.32,-107.93],[109.17,-63.03]]
```

**1x 장면**(`k11-n1-null-x1`, `--check` ok). 5장 바닥에 null 여섯 개를 놓았다: r130 seed 19(검수서 `null-cross-x1`과 같은 경우, 결 포함), r120 seed 19, r170 seed 19, r130 seed 42, r120 seed 77, r170 seed 101.
- 어느 원에도 가운데 十·X가 없다.
- 줄은 가운데를 비켜 지나고, 교차는 원의 바깥쪽에 흩어져 지운 줄눈으로 읽힌다.
- 2배 확인(`k11-n1-null-x2`, r170 seed 101·r130 seed 42)에서도 별·그물 기호로 읽히지 않는다.

### 3. 메인 세션이 할 일

- null을 이식할 때 유령 선 식은 API §8.6의 d2r2 식을 쓴다. v = 0.5에서 s = +1이다. `minOffset`은 SPEC에서 읽는다.
- `hazardArt.test.ts`의 null 벡터는 위 `null:130:11` 값으로 한다.
- 다른 벡터(불 4개, 불티 5개, shock, water:200:3, root:52:9, slow:150:5)와 조각 297장은 d2r1 그대로다. 다시 구울 것이 없다.
- 켜기 순서는 검수 3차 §5-3 그대로이고, null은 이 판으로 켠다.

### 4. 알려진 한계

- 유령 선 방향은 θ = π·kr(0, i)이다. 4줄이면 약 44°씩 벌어지고, 6줄이면 두 쌍이 3.5° 차이로 거의 나란하다.
  - 가운데 엇갈림은 없앴고, 1x에서 규칙성으로 읽히지는 않았다(API §15에 적음).
  - 눈에 띄면 방향에 작은 흔들림을 더하는 것이 다음 처방이다(이번에는 바꾸지 않음).

### 메인 세션 판정 (2026-10-19)

N1은 검수 4차가 정한 기준(같은 측정 0건, C7 0건, 불 해시 그대로)을 채워 합격으로 본다. 그림은 `1.0-d2r2`(297장)로 확정이다. 불 연결 커밋은 불 출력이 같은 285장 스냅숏(`1.0`)으로 구웠고, 다른 종류를 켤 때 이 판으로 다시 굽는다.
