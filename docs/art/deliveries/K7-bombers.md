# 납품서 K7: 자폭 먹귀(폭탄병) `PN.bombers` v1

작성: kit-artist, 2026-10-14. 지시서는 `docs/art/briefs/bombers.md`(B1), 팀 결정은 `docs/outsourcing/R5-orders.md` '결정'을 따랐다.

C1~C12는 마지막 코드 수정 뒤 전부 다시 돌렸다. `--check`를 붙인 렌더는 모두 ok, kit error 0건이다. 바뀌면 안 되는 출력도 그대로다: C8 해시가 기준값과 같고, C11 먹귀 40장이 모두 ok다.

## 1. 납품 목록

| 파일 | 내용 |
|---|---|
| `art/concept-kit/k-bombers.js` (새 파일) | `window.PN.bombers` |
| `art/concept-kit/API-bombers.md` (새 파일) | API 문서 v1 |

- 이 두 파일 밖은 고치지 않았다. `k-enemies.js`도 그대로다.
- 내려받은 것은 없다.
- 도구 출력에 지시문 같은 데이터는 없었다.

**모듈 구성**

| 파트 | 위치 | 내용 |
|---|---|---|
| part 00 | 코어 | `B.ctx`(`K.ctx` 복사본, 접두 `bmb<n>_`, u 4, gameW 2.5), filterDef 복사본(헤일로·hit·실루엣, `ROUGH` 1·3·5장), 행렬·곡선 도우미, 심지·매듭·먹 불꽃·연기·실밥·균열 |
| part 10 | `k-bombers.js:210~` | 심지형 리그 + 장별 오버레이 5 |
| part 20 | `:432~` | 즉시형 리그 + 장별 오버레이 5 |
| part 30 | | 터짐 |
| part 90 | | 공개 API |

**공개 API**
- `draw(ch, kind, opts)`, `meta(ch, kind)`, `list`(10개), `kinds`(`['fuse','burst']`), `C`(= `PN.enemies._K.C`), `ctx`
- 내부 상태는 `PN.bombers._`에 둔다(공개 API가 아니다).

**opts**

| 옵션 | 기본값 |
|---|---|
| `state` | `'idle'` |
| `frame` | 0 (walk는 순환, plant는 끝 값으로 고정) |
| `lod` | `'art'` |
| `halo` | true |
| `shadow` | true (blast에서는 그리지 않음) |
| `silhouette` | false |
| `hitbox` | false |
| `flip` | false |

잘못된 호출은 `<g/>`를 돌려주고 `console.warn`을 남긴다.

**상태 수**: 장마다 18장, 다섯 장 합계 90장. 모든 상태를 game과 art 두 LOD로 그린다.

| 종류 | idle | walk | plant | blast | hit | 합계 |
|---|---|---|---|---|---|---|
| 심지형 | 1 | 4 | 4 | 1 | 1 | 11 |
| 즉시형 | 1 | 4 | — | 1 | 1 | 7 |

## 2. API 요약

| 항목 | 값 |
|---|---|
| 로컬 박스 | 200×200, 오른쪽을 본다 |
| 피벗(판정 원 중심) | (100,138) |
| 발 | (100,186) |
| 판정 | r 12 (로컬 48) |
| u · displayScale | 4 · 0.25 (`fit` 1) |
| 그림자 | 24×10px |
| 발밑 그림자 중심 | (100,164.4) |

**앵커**

| 앵커 | 심지형 | 즉시형 |
|---|---|---|
| `eye` | (128,92) | (151.1,80.3), 기울기 12° 적용 |
| `head` | ch1·5 (100,56), ch2·3·4 (100,57) | ch1 (122.7,47.7), ch2 (123,44.1), ch3 (122.9,45.3), ch4 (122.9,45), ch5 (123,44.1) |
| `blastCenter` | (100,124), 실측 구름 상자 중심 (100,115.5) | (100,108), 실측 (99,105) |

**`wick` 표** (심지형만, 다섯 장 공통). idle·walk·hit은 매듭 중심, plant는 불꽃 밑동이다.

| 상태 | 프레임별 [x, y] |
|---|---|
| idle | [96,11] |
| walk | [96,16.3], [90,8.7], [96,16.3], [102,8.7] |
| plant | [96,24.4], [103.1,31.9], [105.6,39.2], [103.5,45.4] |
| hit | [96,11] |

**pad** [위, 오른쪽, 아래, 왼쪽]

| 종류 | idle·walk·plant·hit | blast |
|---|---|---|
| 심지형 | [0,0,0,0] | [32,93,72,93] |
| 즉시형 | [0,0,0,0] | [0,22,15,26] |

**게임 표시 크기**
- 심지형: 몸 32.3~32.5px, 전체 45.9px(심지 포함), 주머니 폭 28.5~29px
- 즉시형: 몸 34.6~35.5px, 전체 38.4~39.1px(뿔 포함), 주머니 폭 32~33px

## 3. 검사 결과

**C6 원문**: `signal=0 text=0`

**C7 원문**
```
ch1 fuse body=32.5px w=28.5px eye=23.5px aspect=1.48 ok
ch1 burst body=34.6px w=32.5px eye=26.4px aspect=1.07 ok
ch2 fuse body=32.3px w=28.5px eye=23.5px aspect=1.48 ok
ch2 burst body=35.5px w=33px eye=26.4px aspect=1.08 ok
ch3 fuse body=32.3px w=29px eye=23.5px aspect=1.46 ok
ch3 burst body=35.2px w=32px eye=26.4px aspect=1.08 ok
ch4 fuse body=32.3px w=28.5px eye=23.5px aspect=1.48 ok
ch4 burst body=35.3px w=32.5px eye=26.4px aspect=1.10 ok
ch5 fuse body=32.5px w=28.5px eye=23.5px aspect=1.48 ok
ch5 burst body=35.5px w=32.5px eye=26.4px aspect=1.08 ok
invalid calls ok
```

**C8 원문** (작업 전 `k7-c8-unchanged-before`와 같다)
```
enemy-all=kubxcy len=5226045 list=20 roles=stalker,charger,shooter,warden draw=stalker,charger,shooter,warden
```

**C12 원문**
```
ch1 fuse: idle0[body 82 mid 4 patch 17 paper 1.1 other 0.0] walk0[body 83 mid 4 patch 16 paper 1.1 other 0.0] plant3[body 82 mid 5 patch 15 paper 3.5 other 0.0] blast0[body 72 mid 0 patch 4 paper 23.7 other 0.0] ok
ch1 burst: idle0[body 96 mid 6 patch 3 paper 1.0 other 0.0] walk0[body 95 mid 6 patch 4 paper 1.0 other 0.0] blast0[body 80 mid 0 patch 2 paper 17.6 other 0.0] ok
ch2 fuse: idle0[body 97 mid 11 patch 2 paper 1.5 other 0.0] walk0[body 97 mid 11 patch 2 paper 1.5 other 0.0] plant3[body 95 mid 12 patch 1 paper 3.8 other 0.0] blast0[body 76 mid 0 patch 0 paper 24.2 other 0.0] ok
ch2 burst: idle0[body 96 mid 4 patch 2 paper 1.3 other 0.0] walk0[body 96 mid 4 patch 3 paper 1.2 other 0.0] blast0[body 83 mid 0 patch 0 paper 17.2 other 0.0] ok
ch3 fuse: idle0[body 88 mid 6 patch 10 paper 1.8 other 0.0] walk0[body 89 mid 6 patch 9 paper 1.8 other 0.0] plant3[body 87 mid 7 patch 8 paper 5.1 other 0.0] blast0[body 74 mid 0 patch 1 paper 24.4 other 0.0] ok
ch3 burst: idle0[body 95 mid 4 patch 3 paper 2.2 other 0.0] walk0[body 95 mid 4 patch 3 paper 2.2 other 0.0] blast0[body 82 mid 0 patch 0 paper 17.8 other 0.0] ok
ch4 fuse: idle0[body 88 mid 9 patch 10 paper 2.0 other 0.0] walk0[body 88 mid 9 patch 9 paper 2.1 other 0.0] plant3[body 88 mid 10 patch 7 paper 5.5 other 0.0] blast0[body 75 mid 0 patch 0 paper 24.5 other 0.0] ok
ch4 burst: idle0[body 90 mid 4 patch 8 paper 2.6 other 0.0] walk0[body 89 mid 4 patch 8 paper 2.6 other 0.0] blast0[body 82 mid 0 patch 0 paper 17.7 other 0.0] ok
ch5 fuse: idle0[body 96 mid 6 patch 2 paper 1.9 other 0.0] walk0[body 96 mid 6 patch 2 paper 1.9 other 0.0] plant3[body 95 mid 7 patch 1 paper 4.3 other 0.0] blast0[body 76 mid 0 patch 0 paper 24.4 other 0.0] ok
ch5 burst: idle0[body 95 mid 4 patch 2 paper 2.3 other 0.0] walk0[body 95 mid 4 patch 3 paper 2.3 other 0.0] blast0[body 82 mid 1 patch 0 paper 17.8 other 0.0] ok
```

**최종 실행 목록** (명령은 지시서 §7.2 원문 그대로, 장 번호와 이름만 바꿈)

| 검사 | 렌더 이름 | 배율 | `--check` | 직접 열어 봄 |
|---|---|---|---|---|
| C1 | `k7-c1-all` | 0.25 | ok | 예 |
| C2 | `k7-c2-game` | 0.5 = 게임 크기의 2배 | ok | 예 (개발 중 `k7-c2-game-x1`, 배율 1도 확인) |
| C3 | `k7-c3-ch1..5-art` | 1.2 | 5장 ok | 5장 모두 |
| C4 | `k7-c4-sil32` | 1 (실제 32px) | 원문 명령에 없음 | 예 |
| C4 | `k7-c4-sil32-x3` | 3 | 원문 명령에 없음 | 예 |
| C5 | `k7-c5-ch1..5-crowd` | 1 | 5장 ok | 5장 모두 |
| C5 | `k7-c5-ch1..5-crowd-x08` | 0.8 | 5장 ok | 5장 모두 |
| C5 | `k7-c5-ch1..5-crowd-x3` | 3 | 5장 ok | 1·2·3·5장 |
| C5 | `k7-c5-ch1..5-crowd-gray` | 1 | 없음(고정 id라서) | 5장 모두 |
| C6 | `k7-c6-scan` | 1 | — | 예 |
| C7 | `k7-c7-meta` | 1 | — | 예 |
| C8 | `k7-c8-unchanged` | 1 | — | 예 |
| C9 | `k7-c9-ch1..5-face` | 4 (게임 1px = 16 이미지 px) | 5장 ok | 5장 모두 |
| C10a | `k7-c10a-ch1..5-marks` | 4 | 5장 ok | 5장 모두 |
| C10b | `k7-c10b-ch1..5-plant-blast` | 2 | 5장 ok | 5장 모두 |
| C11 | `enemies --check` | — | 40장 ok | — |
| C12 | `k7-c12-area` | 1 | — | 예 (전사용으로 `-x2`도) |

**보조 측정 렌더** (같은 도구로 잼): `k7-meta-dump2`, `k7-measure-dump2·3`, `k7-blast-measure`, `k7-final-measure`.

**게임 크기와 확대로 본 것**
- 게임 크기(1배): C5 1배·0.8배·흑백, C4 1배
- 확대: C9 16배, C10a 4배, C2 2배·4배, C3 1.2배(박스 단위), C5 3배

## 4. 지시서 대비

### 4.1 실제 수치표

**심지형 리그 (§2.2)**

| 항목 | 지시서 | 실측 |
|---|---|---|
| 주머니 범위 | x 44~156, y 58~168 (±4) | x 43~157, y 56~166 (4장 다각 57~163) |
| 주머니 크기 | 폭 28, 높이 27.5px | 폭 28.5~29, 높이 27.5px |
| 가장 넓은 곳 | y 118~126 | y 112~140 사이, 최대 폭은 y 125 |
| 마개 | x 100, y 46~62, 폭 22~30 | x 100, y 46~64, 폭 26~32 |
| 심지 뿌리 · 끝 | (100,48) · (88~98, 6~14) | (100,48) · (96,11) |
| 심지 길이 · 끝 각도 | 마개 위 34~42 · 20~60° | 약 39 · 34° |
| 심지 기둥 | 실루엣 높이의 20% 이상 | 약 29% |
| 앞다리 | 엉덩이 (128,150), 발끝 ≈ 150 | 엉덩이 (128,150), 발끝 150.8 |
| 뒷다리 | 엉덩이 (70,150), 뒤꿈치 ≈ 50 | 엉덩이 (70,150), 뒤꿈치 50.9 |
| 발 사이 | ≥ 32 | 42 |
| 다리 굵기 | 엉덩이 16~18 → 발목 12~14 | 18 → 13 |
| 먼 다리 | 10~14 안쪽, 2 위 | 12 안쪽, 2 위 |
| 눈 | (128~136, 86~96), 발 위 ≥ 20px | (128,92), 23.5px (walk 최소 22.4px) |
| 몸 · 전체 높이 | 32~33 · 43~46px | 32.3~32.5 · 45.9px |
| 칠한 높이/폭 | 1.35~1.75 | 1.46~1.48 |

**즉시형 리그 (§2.3)**

| 항목 | 지시서 | 실측 |
|---|---|---|
| 기울기 | 10~14° | 12° |
| 주머니 | x 38~162, y 46~158 (±4) | 타원 x 35~165, y 44~156 |
| 면적 (심지형 대비) | +10~20% | 장별 1.113 / 1.122 / 1.147 / 1.119 / 1.108 |
| 뿔 개수 | 5~6 | 5 |
| 뿔 각도 | 195~345° | 196·223·246·281·309° (기울기 뒤 208~321°) |
| 뿔 간격 | 22~36°, 고르지 않게 | 27·23·35·28° |
| 뿔 길이 | 10~22, 이웃 차 ≥ 15% | 16·21·13·19·14, 이웃 차 ≥ 24% |
| 정수리 금지 구간 | ±10° | 기울기 전후 모두 ≥ 11° |
| 뿔 밑동 | ≥ 10 | 10.4~12 |
| 앞다리 발끝 | x 148~162 | 163 (+1, ±4 안) |
| 뒷다리 발끝 | x 40~58 | 47 |
| 무릎 꺾임 | ≥ 35° | 앞 91°, 뒤 92° |
| 보이는 다리 높이 | 7~10px | 약 7.5px |
| 솔기 터짐 | 1~2줄, 길이 ≥ 20, 눈에서 ≥ 24 | 2줄, 길이 26·22, 눈에서 50 이상 |
| 눈 높이 | 기울기 뒤 ≥ 24px | 26.4px (walk 24.6 / 26.6 / 29.7 / 27.4) |
| 몸 · 전체 높이 | 33~36 · 38~42px | 34.6~35.5 · 38.4~39.1px |
| 칠한 높이/폭 | 0.95~1.25 | 1.07~1.10 |

**동작 (§2.5)**
- 심지형 walk 심지 끝 변위: (0,+5.3), (−6,−2.3), (0,+5.3), (+6,−2.3). 지시서의 (0,+4)와 1.3 차이로 ±2 안이다.
- 즉시형 walk2: 칠한 아래 끝이 발 선보다 약 2px 위다.
- 심은 자세: 심지 100/70/45/20%, 불꽃 높이 12/14/16/19, 꼭대기가 13단위 내려간다, 발끝 폭 +20.

**터짐**

| 항목 | 지시서 | 실측 |
|---|---|---|
| 구름 가로 반지름 | 심지형 144~156, 즉시형 86~96 | 148.5 (도달 100의 0.371배), 88.5 (도달 60의 0.369배) |
| 세로/가로 | 0.72~0.80 | 0.734, 0.729 |
| 꽃잎 | 8~10 / 6~8, 이웃 차 ≥ 10% | 10 / 8, 이웃 차 ≥ 14% |
| 종이 심 | 구름의 40~50% | 구성 타원의 0.42 (가로 63 / 37.8) |
| 땅 튐 | 구름 가로의 0.8~0.9배 | 0.86배, 세로 = 가로 × 0.29 |
| 파편 · 먹 방울 | 6~9 · 4~6 (즉시형 뿔 5~6 · 3~5) | 8 · 5 / 뿔 5 · 4 |
| 기하 범위 (심지형) | x −110~310, y −40~290 | x −79~280, y −15~258 |
| 기하 범위 (즉시형) | x −40~240, y 10~250 | x −13~204, y 23~207 |

**장별 재질 (§3)**: 표의 항목을 모두 그렸다. 가칭은 `API-bombers.md` §5.3에만 적었다.

### 4.2 지시서와 다르게 한 것과 이유

| 항목 | 지시서 | 한 것과 이유 |
|---|---|---|
| 꿰맨 입 | `K.stitch` | 같은 재료로 된 자체 함수 `_.stitch`를 썼다. 실밥을 솔기에 수직으로, 간격을 고르지 않게 둔다. `K.stitch`는 같은 각도·같은 간격의 실밥 3개를 그려서 1x에서 'III'로 읽히고, §1.8과 바이블 §6-5의 평행선 3줄 금지에 걸린다 |
| 이빨 | `K.teeth` | 노치 가장자리에 수직으로 뻗는 자체 함수 `_.teeth`를 썼다(종이 + 먹테). `K.teeth`는 세로로만 뻗어서 기울어진 노치에 맞지 않는다 |
| 뿔 개수 | 5~6 | 5개. 앞쪽 6번째 뿔은 앞으로 뻗어 돌격수 뿔이나 부리로 읽혔다(C4 시안에서 확인) |
| 3장 물높이 선 | 몸을 한 바퀴 도는 선 | 몸 뒤쪽 2/3에서 가늘어지며 끝낸다. 얼굴을 지나면 얼굴이 두 면으로 갈린다(§4 금지) |
| 2장 심지형 눈썹 | 눈을 내리누르는 쐐기 | 0.6s 높였다. 열쇠 구멍의 둥근 머리가 잘려 사다리꼴만 남았다. 대신 완고함은 중묵 눈썹 능선으로 읽힌다 |
| 즉시형 주머니 | x 38~162 | x 35~165. 면적 비 +10~20%를 맞추려고 넓혔다(±4 안) |
| `blastCenter` (심지형) | (100,120±6) | (100,124). 구성 중심이며 실측 구름 상자 중심은 115.5다. 둘 다 범위 안이다 |

### 4.3 T1·T2 자가 판정

**T1 (C4, 32px 흑백)**: 통과.
- (a) 다섯 줄 모두에서 폭탄병이 역할 4종 어느 것으로도 읽히지 않는다.
- (b) 모든 쌍에서 심지형(공 + S 심지 + 매듭 + 짧은 발)과 즉시형(가시 공 + 이 빠진 앞 + 꺾인 두 다리)이 갈린다.
- (c) 장마다 같은 종으로 읽힌다.
- (d) 높이/폭은 1.46~1.48과 1.07~1.10이고, 심지 기둥은 약 29%다.

**T2 (C5, 1배·0.8배·흑백)**: 다섯 장 모두 폭탄병 5마리를 찾고 종류를 맞혔다. 추적자와 착각하지 않았고 결이 가장 밝다.

**헷갈렸던 쌍과 고친 점**

| 무엇이 | 무엇으로 읽혔나 | 고친 점 |
|---|---|---|
| 즉시형 앞 뿔 | 돌격수 뿔·부리 | 뿔을 5개로 줄였다 |
| 즉시형 뒷다리 | 땅에 누운 모양이 추적자 꼬리 | 뒤꿈치를 들었다 |
| `K.stitch` 실밥 | 'III' | 자체 실밥 함수로 바꿨다 |
| 심은 자세 균열 | 'Z'와 번개 글리프 | 굽이진 균열로 바꿨다 |
| 즉시형 솔기 두 줄 | 나란한 'S' 쌍 | 방향이 다른 두 갈라짐으로 바꿨다 |
| 4장 통 균열 | 번개 | 꺾임을 줄였다 |
| 터짐 꽃잎 | 막대사탕 모양이 바이러스 아이콘 | 손가락 모양 꽃잎으로 바꿨다 |
| 터짐 종이 심 | 얇은 먹 테 안의 큰 종이 심이 처치 연출의 종이 섬광 | 먹 몸을 0.7로 키웠다 |
| 즉시형 터짐 아래 꽃잎 | 땅 튐과 이어져 버섯 기둥 | 꽃잎 각도를 바꿨다 |
| 4장 시침 | 네모 덩어리 | 삽 머리와 창 모양 바늘로 바꿨다 |
| 5장 art 몸 하이라이트 | 흰 초승 획(고리 하이라이트 하나 규칙 위반) | 삭제했다 |

**남은 약한 점**
- 2장 즉시형의 둥근 리벳 머리가 32px에서 둥근 귀처럼 보일 수 있다.
- 심지형 plant f3 실루엣(납작한 배 + 짧은 불꽃)은 idle보다 '폭탄' 느낌이 약하다.
- 5장 0.8배 장면에서 수문장에 겹친 심지형은 심지로만 찾힌다.

## 5. 메인 세션이 할 일

1. **로드 순서**: `scripts/build-atlas.mjs:11`의 `KIT_FILES`에서 `'k-enemies.js'` 바로 뒤에 `'k-bombers.js'`를 넣는다.

2. **`art/atlas-spec.mjs`**
   - `BOMBER_KINDS = { fuse: { walkFps: 8 }, burst: { walkFps: 12 } }`를 더한다.
   - `chapterPack(ch)`에 `{ bomber: { chapter: ch, kind }, keyPrefix: 'enemy/<ch>/bomber-<kind>' }`를 종류마다 하나씩 더한다.

3. **`renderFrames`의 bomber 분기**
   - meta는 `PN.bombers.meta(ch, kind)`에서 읽는다.
   - 칸 값: `box: meta.box`, `anchor: meta.feet`(100,186), `scale: meta.displayScale`(0.25), `extraPad: meta.pad[state]`.
   - 호출: `['PN.bombers.draw', ch, kind, { lod:'game', shadow:false, halo:true, state, frame }]`.
   - 애니메이션: `{idle:{1,1}, walk:{4,walkFps}, plant:{4,0}, blast:{1,0}, hit:{1,1}}`. plant는 심지형만이다.
   - 키는 `enemy/<ch>/bomber-<kind>/<state>/<frame>`, 합계 90장이다.

4. **슬롯·상태**: 지시서 §9-2 그대로다.
   - `slots.ts`: `enemy.bomber`가 있으면 `enemy/<ch>/bomber-<kind>`를 쓰고, `enemyDrawScale`은 1이다.
   - `animation.ts`: 심은 심지형은 windup 사슬 `['plant','windup']`. 이 판단을 stun보다 앞에 둔다.
   - plant 프레임은 진행률로 고른다: `min(3, ⌊(elapsed − fuseAt)/1.15 × 4⌋)`. minimal에서도 같다.

5. **렌더러 제안 R1**: 불꽃 점을 심지 끝에 붙인다.
   - x = `body.x + facing·(wick.x − 100)·0.25`, y = `body.y − (186 − wick.y)·0.25`.
   - wick 표는 §2의 것을 쓴다.
   - 지금 규칙(그림 맨 위 −15px)으로도 점과 심지 끝은 같은 세로줄 ±2.5px 안에 있다.

6. **렌더러 제안 R2~R4**: 지시서 §9-3과 같다.

7. **헤일로**: blast 프레임에도 헤일로가 들어간다. 그림자는 없다.

8. **확인**
   - 굽기 뒤 매니페스트에서 기존 `enemy/*` 프레임의 w·h·ax·ay가 그대로인지 본다.
   - `npm run bench:packs`, `test:perf`, `test:visual`(폭탄병 장면 셋)을 돌린다.

## 6. 알려진 한계

- **잠정 아트**: 킷 출력은 잠정 아트다(바이블 §15). 사람 원화가 손볼 곳:
  - 최종 붓 외곽과 블랙 스팟 배치
  - 1장 구겨진 종이와 벽보 인쇄
  - 3장 복어 가시와 옹기 결
  - 4장 바늘 끝
  - 5장 흑요 결
  - 먹 불꽃과 연기의 붓질
  - 터짐의 비백 튐과 파편
- **이번 범위 밖** (팀 결정):
  - 처치(해체) 그림과 터진 자리 얼룩은 다음 차수다.
  - 즉시형의 덤벼드는 자세는 넣지 않았다.
  - 정식 0.3초 판독 시험(n ≥ 8)은 하지 않았다.
- **즉시형 walk**: 같은 다리가 늘 앞장서는 깡충 달리기(skip)다. 4프레임 한 주기라 좌우 다리를 번갈아 내딛지 않는다.
- **심지형 걸음**: 8fps와 실제 이동 속도에서 발이 미끄러지는지는 확인하지 않았다.
- **렌더러 고리와 입**: 심지형 호박 점선 고리(17px)는 눈은 피하지만 앞 아래의 꿰맨 입을 가로지른다. 지시서는 눈만 요구한다.
- **즉시형 `head` x**: 기울어진 몸의 실제 꼭대기라 약 123이고, 피벗 x(100)가 아니다.
- **C12 도구 한계**: mask를 무시하므로 5장 투명 구멍이 몸 면적에 잡힌다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-bombers.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-bombers.md`
- 렌더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k7-*.png`

---

## 검수 1차: K7 자폭 먹귀 `PN.bombers` v1

작성: art-director, 2026-10-14.
- 대상: `art/concept-kit/k-bombers.js`, `art/concept-kit/API-bombers.md`
- 기준: 지시서 `docs/art/briefs/bombers.md`(B1), `docs/outsourcing/R5-orders.md`의 '결정'(B1 Q1~Q7 권장안), 스타일 바이블 v1 §3·§4·§5·§6·§7·§8.1·§10.1·§13·§14·§15
- 파일은 고치지 않았다.

## 0. 판정: **합격**

- 지시서 §7의 C1~C12와 T1·T2를 모두 직접 다시 돌렸다.
  - `--check`를 붙인 렌더 48건과 `enemies --check` 40장이 모두 ok다. kit error는 0건이다.
  - C6·C7·C8·C12 출력은 납품서 원문과 글자까지 같다.
- 막음 0건, 고침 0건, 권장 4건(§5)이다.
  - 권장 사항은 앵커·박스·굽기 키·프레임 수를 바꾸지 않는다. 그래서 등록과 굽기를 막지 않는다.
  - 다음 폭탄병 차수(해체 그림, 팀 결정 Q2)에서 함께 고치고 다시 구우면 된다.
- 납품서 §4.2의 7건을 모두 수용한다. §6의 남은 약한 점 3건과 알려진 한계 8건도 모두 수용한다(§3·§4).
- **얼굴**: 10 프로필 모두 옆모습 한 시점이다.
  - 눈은 가까운 쪽 하나이고, 입은 앞 윤곽에 닿는다.
  - 명부, 면 경계, 균열, 벽보 가장자리가 얼굴을 가르지 않는다.
  - R4 리뷰가 지적한 입체파 실수는 없다.

## 1. 직접 본 렌더

모두 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/ad7-*.png`다.

| 검사 | 렌더 | 배율 | `--check` |
|---|---|---|---|
| C1 | `ad7-c1-all` | 0.25 | ok |
| C2 | `ad7-c2-game`(게임 2배), `ad7-c2-game-x1-a~d`(게임 4배) | 0.5 · 1 | ok 5건 |
| C3 | `ad7-c3-ch1~5-art` | 1.2 | ok 5건 |
| C4 | `ad7-c4-sil32`, `-x3` | 1 · 3 | 원문 명령에 없음 |
| C5 | `ad7-c5-ch1~5-crowd`(1배), `-x08`(0.8배), `ch1-x3` | 1 · 0.8 · 3 | ok 11건 |
| C5 흑백 | `ad7-c5-ch1~5-crowd-gray`, `ch2·ch5-gray-x08` | 1 · 0.8 | 고정 id라서 없음 |
| C6 · C7 · C8 · C12 | `ad7-c6-scan`, `ad7-c7-meta`, `ad7-c8-unchanged`, `ad7-c12-area` | 1 | 없음 |
| C9 | `ad7-c9-ch1~5-face`(게임 1px = 16 이미지 px) | 4 | ok 5건 |
| C10a · C10b | `ad7-c10a-ch1~5-marks`, `ad7-c10b-ch1~5-plant-blast` | 4 · 2 | ok 10건 |
| C11 | `enemies --check` | 1 | 40장 ok |

**추가로 돌린 것**

- 굽기 호출 그대로 90장: `ad7-bake-calls`. 칸(박스 + pad + 32)을 함께 그렸고, `--check` ok다.
- 터짐
  - `ad7-blast-fuse-all`, `ad7-blast-burst-all`: 5장 × game·art
  - `ad7-kill-vs-blast`: `PN.vfx.kill` 6프레임과 나란히, ×3
- hit: `ad7-hit-compare`. 추적자 hit와 나란히 놓았다.
- 심은 자세 확대: `ad7-plant-zoom-ch1`
- 옵션: `ad7-opts-ch1`. 반전, 히트박스, 실루엣 game·art를 봤다.
- 즉시형 입 크기별: `ad7-burst-mouth-sizes`
- 다리 확대: `ad7-legs-zoom`
- 5장 구멍
  - `ad7-ch5-holes`: 줄무늬 바탕 위
  - `ad7-ch5-enemy-holes`: 여우·수문장과 비교
- 측정
  - `ad7-eye-measure`: game 흰 눈 px
  - `ad7-notch-profile`: 즉시형 앞 윤곽 프로필
  - `ad7-art-bounds`: art LOD 칠한 범위
  - `ad7-color-audit`, `ad7-tag-audit`, `ad7-game-pattern-audit`, `ad7-meta-dump`
- 위치를 모르는 무작위 장면(T2 보강): `ad7-t2-blind-ch1`·`-ch5`와 각 `-truth`·`-zoom`. 시드가 고정된 무작위 배치이고 흑백 1배다.

## 2. 지시서 대조

### 2.1 C1~C12

| 검사 | 결과 | 확인한 것 |
|---|---|---|
| C1 | 합격 | 10 프로필 × 2 LOD × 모든 상태·프레임 + 실루엣 + 반전·히트박스가 ok다 |
| C2 | 합격 | 발이 점선에 닿고 즉시형 walk2만 뜬다. 피벗 십자가 판정 원 중심이다. plant f0→f3에서 심지가 짧아지고 몸이 부푼다 |
| C3 | 합격 | 1장 벽보(p300, 20/60 망점, 인쇄 블록·줄), 2장 철선묘(art도 균일 선), 3장 습윤 번짐·드립, 4장 miter 다각, 5장 흑요 면과 가장자리 갉기 |
| C4 | 합격 | §2.2 T1 |
| C5 | 합격 | §2.2 T2 |
| C6 | 합격 | `signal=0 text=0` |
| C7 | 합격 | 10줄 ok, `invalid calls ok`. 수치가 납품서 §3과 같다 |
| C8 | 합격 | `enemy-all=kubxcy len=5226045 list=20 roles=stalker,charger,shooter,warden draw=stalker,charger,shooter,warden` |
| C9 | 합격 | 한 시점, 장별 눈, game 흰 눈 ≥ 3×2px(아래 표). 입 노치의 실루엣은 R-1 참고 |
| C10a | 합격(5장) | 첫 칸의 점과 심지 끝의 가로 차가 2.5px 이하다. 둘째 칸의 점은 매듭에 앉는다. 고리(17, 16 / 22.5~24px)는 눈을 비켜 간다 |
| C10b | 합격(5장) | 호박 원 아래에서도 '웅크려 타는 폭탄'으로 읽힌다. f0→f3이 카운트다운으로 읽힌다. 구름은 도달 링의 약 0.37배이고 심지형이 분명히 크다. 처치 연출, 규칙적인 별, X·✕와 다르다 |
| C11 | 합격 | 40장 ok |
| C12 | 합격 | 10줄 ok, 원문과 같다 |

**game 흰 눈 실측**(`ad7-eye-measure`, px)

| 장 | 심지형 | 즉시형 |
|---|---|---|
| 1장 | 4.8 × 2.4 | 5.8 × 2.9 |
| 2장 | 2.9 × 4.9 (열쇠 구멍이 세로로 선다) | 3.8 × 5.9 |
| 3·4·5장 | 5.5 × 4.4 | 6.0 × 6.0 |

- walk 4프레임 모두 같은 크기다.
- 심지형 plant f3에서는 6.7~7.0px로 커진다.

### 2.2 구별 시험

**T1 (C4, 32px 흑백): 합격**
- (a) 다섯 줄 모두에서 폭탄병 다섯 칸이 역할 네 칸 어느 것으로도 읽히지 않는다.
  - 가장 가까운 1장 등롱 포수와 5장 눈알 포대는 포신과 삼각대로 갈린다.
- (b) 모든 쌍에서 '매끈한 배 + S자 심지 + 네 발'과 '가시 공 + 꺾인 두 다리'가 갈린다.
- (c) 장마다 같은 종으로 읽힌다. 2장 즉시형만 혹이 둥글지만 '기뢰'로 읽혀 같은 종이다.
- (d) 높이/폭은 1.46~1.48과 1.07~1.10이다. 심지 기둥은 약 29%다.

**T2 (C5): 합격**
- 다섯 장 모두 1배, 0.8배, 흑백에서 폭탄병 다섯을 모두 찾았고 종류를 맞혔다.
- 추적자를 폭탄병으로 착각하지 않았다. 결이 가장 밝다.

**편향을 줄인 보강 시험(위치를 모르는 무작위 장면 2개)**

| 장면 | 찾은 수 | 종류 | 놓치거나 망설인 것 |
|---|---|---|---|
| 1장 | 6/7 | 모두 맞힘 | 1장 돌격수(먹통 황소) 뒤에 거의 가려진 심지형(195,107). 심지만 보였고, 그것이 돌격수의 파이프 뿔과 섞였다 |
| 5장 | 6/7 | 모두 맞힘 | 5장 사격수(반영 눈알 포대)에 겹친 즉시형(54,385). 둘 다 둥근 먹 덩어리에 같은 일식 눈이라 1배에서 망설였다. 4배에서는 바로 갈린다 |

- 두 건 모두 그림 탓이 아니라 가림이다.
- 게임에서는 렌더러의 고리 표식이 몸 위 층에 남는다.
- T3 재료로 넘긴다(§8 Q-B).

### 2.3 C 검사 밖의 지시서 항목

| 지시서 | 결과 | 근거 |
|---|---|---|
| §1.1 의존·이름공간 | 합격 | `PN.enemies._K`는 읽기만 한다. `Math.random`이 없다. id는 `bmb<n>_` 카운터(`k-bombers.js:20`, `:24`)다. k-enemies가 없으면 warn 뒤 중단한다(`:15`). `PN.bombers.C === PN.enemies._K.C`다(`ad7-meta-dump`) |
| §1.2·§1.5 호출·meta | 합격 | `draw`·`meta`·`list`(10)·`kinds`·`C`·`ctx`와 meta 필드가 모두 있다. `wick`은 다섯 장이 같다 |
| §1.3 박스·판정 | 합격 | 200×200, 피벗 (100,138), 발 (100,186), r 48단위, displayScale 0.25(fit 1), 몸 높이 32.3~35.5px |
| §1.6 굽기 | 합격 | 굽기 호출 그대로 90장이 lint ok이고, 모두 박스 + pad + 32 칸 안에 들어간다(`ad7-bake-calls`) |
| §1.7 렌더러 표식 | 합격 | 그림에 넣지 않았다. 눈 높이는 심지형 22.4~24.1px, 즉시형 24.6~29.7px다 |
| §1.8 game 규칙 | 합격 | game에 망점·feTurbulence·대시가 모두 0이다(`ad7-game-pattern-audit`) |
| §1.8 색 | 합격 | 쓰인 색은 구현 토큰, `env.chN.deep`, 헤일로의 `env.chN.base`, 마스크의 흑백뿐이다(`ad7-color-audit`) |
| §1.8 금지 | 합격 | 그라데이션, blur, blend, `<text>`가 0이다(`ad7-tag-audit`) |
| §2.2·§2.3 리그 | 합격 | 납품서 §4.1 표와 C7 실측이 맞는다. 심지 끝이 위·뒤로 향하고 갈고리가 없다. 다리 사이 틈은 42단위다 |
| §2.5 동작 | 합격 | 심지형 뒤뚱 걸음과 심지 흔들림, 즉시형 착지·밀기·체공·뻗기, 속도선 2줄, 먼지 하나 |
| 터짐 | 합격 | 꽃잎 끝이 둥근 붓 튐이다. 종이 심은 0.42배이고 빛 쪽으로 치우친다. 땅 튐, 장별 파편, 즉시형은 자기 뿔이 날아간다. 몸 모양으로 터지지 않는다(`ad7-kill-vs-blast`) |
| hit | 합격 | k-enemies hit 문법(종이 실루엣, 먹 외곽, 헤일로, 반전 눈)과 같다. 즉시형은 기울기 행렬로 눈을 맞춘다(`ad7-hit-compare`) |
| §3 장별 재질 | 합격 | 표의 항목이 모두 있다. 다만 5장 구멍은 game에서 보이지 않는다(R-2) |
| §4 얼굴 | 합격 | 한 시점이다. 장별 `K.eye`를 그대로 썼다. 크기별 디테일 표대로다. 즉시형 노치의 실루엣 판독만 R-1 |
| §5 LOD | 합격 | walk f0이 접지 프레임이다. 명부, 헤일로, 흰 눈이 모든 LOD에 남는다. art LOD의 pad는 R-3 |
| 바이블 §8.1·§10.1·§14 | 합격 | 반영된 폭탄병 조항(`docs/art/style-bible.md:232-235`, `:258-259`, `:334`)과 그림이 맞는다 |

## 3. 납품서 §4.2 '지시서와 다르게 한 것' 7건

| # | 항목 | 판정 | 이유 |
|---|---|---|---|
| 1 | 꿰맨 입: `K.stitch` 대신 `_.stitch`(`k-bombers.js:191-202`) | **수용** | 재료와 굵기가 `K.stitch`(`k-enemies.js:340-349`)와 같다(game 솔기 0.9u, 실밥 0.6u). 실밥이 굽은 솔기에 수직이라 game 3개의 각도가 서로 다르고, 길이와 기울기가 번갈아 다르다. 그래서 'III'이나 §6-5 해칭(같은 각도·같은 간격)으로 읽히지 않는다(C9 5장) |
| 2 | 이빨: `K.teeth` 대신 `_.teeth`(`:505-514`) | **수용** | 같은 문법이다(p50 + 먹테 0.55u). `K.teeth`는 위아래로만 뻗어 기운 노치에 맞지 않는다. 노치의 실루엣 깊이는 별건이다(R-1) |
| 3 | 뿔 5개 | **수용** | 지시서 범위(5~6) 안이다. 6번째 앞 뿔이 돌격수 뿔·부리로 읽힌다는 판단도 V6에 맞다 |
| 4 | 3장 물높이 선이 몸 뒤 2/3에서 끝남 | **수용** | 한 바퀴 돌면 눈(y 92)과 입(y 117~132) 사이를 지나 얼굴을 가른다. 지시서 §3 3장 줄이 지시서 §4와 부딪친 것이므로 **지시서 쪽 오류**로 기록한다(`ad7-c9-ch3-face`) |
| 5 | 2장 심지형 눈썹을 0.6s 높임 | **수용** | 눈 모양은 장 지문이므로(바이블 §10.1) 열쇠 구멍의 둥근 머리를 지키는 쪽이 앞선다. 대가로 game에서 2장 심지형에만 '내리누른 눈'이 없고, 1px 중묵 능선만 남는다. 3·4·5장은 쐐기가 눈의 윗앞을 깎아 완고한 표정이 남는다. 사람 클린업으로 넘긴다(§7) |
| 6 | 즉시형 주머니 x 35~165 | **수용** | ±4 안이다. 면적 비 1.108~1.147로 +10~20%를 충족한다 |
| 7 | 심지형 `blastCenter` (100,124), 실측 115.5 | **수용** | 둘 다 120±6 안이다. 렌더러 제안 R4는 발(feet) 기준으로 그리므로 영향이 없다 |

**제안**: `docs/art/briefs/bombers.md` §3 3장 심지형 줄의 '물높이 선(ink5) 한 줄' 뒤에 '얼굴 앞에서 끝낸다(§4)'를 덧붙인다. 메인 세션이 반영한다.

## 4. 납품서 §6 판정

### 4.1 남은 약한 점

| 항목 | 판정 | 확인 |
|---|---|---|
| 2장 즉시형 리벳 머리가 32px에서 귀처럼 보일 수 있다 | 수용(권장 R-4) | 32px 검은 실루엣에서는 혹 다섯 개라 기뢰로 읽힌다. hit 흰 실루엣(0.08초)에서는 곰 귀에 가깝다(`ad7-c3-ch2-art` hit 칸) |
| plant f3의 '폭탄' 느낌이 약하다 | 수용 | 32px에서는 '꼭지 달린 낮은 돔'이다. 그래도 역할 4종이나 즉시형으로는 읽히지 않는다(T1). 게임에서는 호박 도달 원 안에서만 보이고, f0~f3 순서가 카운트다운으로 읽힌다(C10b) |
| 5장 0.8배에서 수문장에 겹친 심지형은 심지로만 찾힌다 | 수용 | 내 무작위 장면에서도 같은 부류의 겹침 두 건이 나왔다(§2.2). 가림 문제이고, 렌더러 고리가 대신 알려 준다 |

### 4.2 알려진 한계

| 항목 | 판정 | 이유 |
|---|---|---|
| 잠정 아트 | 수용 | 바이블 §15 |
| 해체 그림·얼룩은 다음 차수, 즉시형 덤벼드는 자세 없음 | 수용 | 팀 결정 Q2·Q3·Q6과 같다 |
| 정식 0.3초 시험 미실시 | 수용 | T3는 통합 뒤 팀이 한다(지시서 §7.1) |
| 즉시형 walk가 같은 다리로 착지하는 깡충 달리기 | 수용 | 지시서 §2.5 표가 바로 이 '4프레임 한 번 뛰기'를 정했다 |
| 심지형 발 미끄러짐 미확인 | 수용(**미확인**) | 기존 추적자도 8fps다(`art/atlas-spec.mjs:46`). 다시 그리지 않고 `BOMBER_KINDS.walkFps`로 맞출 수 있다 |
| 렌더러 고리가 입을 가로지른다 | 수용 | 지시서는 눈만 요구했다. 렌더러 제안 R2(땅 타원)로 풀린다 |
| 즉시형 `head` x ≈ 123 | 수용 | 기울어진 몸의 실제 꼭대기다. 머리 위 표식에 쓸 때 주의한다(§6-4) |
| C12 도구가 mask를 무시함 | 수용, 문구 정정 필요(R-2) | game에서는 먹테가 구멍을 메워 그 자리가 실제로 몸색이다 |

## 5. 검수자가 찾은 것 (심각도: 막음 / 고침 / 권장)

| # | 심각도 | 내용 |
|---|---|---|
| R-1 | 권장 | 즉시형 노치가 단색 실루엣에서 입보다 톱니 가장자리로 읽힌다 |
| R-2 | 권장(문서) + 열린 질문 | 5장 초승 구멍이 game LOD에서 보이지 않는다 |
| R-3 | 권장(문서) | `pad`는 game LOD 기준인데, art plant 연기가 박스 위로 나간다 |
| R-4 | 권장 | 2장 즉시형의 둥근 리벳 머리 |

### R-1 즉시형 노치가 실루엣에서 입으로 덜 읽힌다

**본 렌더**: `ad7-notch-profile`, `ad7-burst-mouth-sizes`, `ad7-opts-ch1`

**문제**
- game 실루엣의 앞 윤곽 프로필로 깊이를 쟀다. 윗입술(≈ 189,104)과 아랫입술(≈ 173,141)을 잇는 현에서 노치 바닥까지 잰 값이다.
  - 가장 깊은 한 행(y 124)이 8단위(2px)다.
  - 나머지 행은 2~6단위(0.5~1.5px)다.
- 납품서의 '약 15단위(3.7px)'는 노치를 내기 전 타원 윤곽에서 잰 값이다.
- game 외곽 stroke(12.5단위, paint-order stroke라 바깥으로 6.25)와 이빨(인셋 3.4 + 높이 6/5.6)이 노치를 반쯤 메운다.
- 그래서 지시서 §4(`docs/art/briefs/bombers.md:397`)의 '단색 실루엣에서도 입으로 읽혀야 한다'를 반만 충족한다.
- 색이 있는 game 1배에서는 흰 이빨이 보여 얼굴은 읽힌다. T1·T2·C9도 통과한다.

**처방**
- `Q.NOTCH`(`k-bombers.js:449`)의 A·D를 안쪽으로 옮긴다. 두 LOD 모두다.
  - A: (150,104) → (143,106)
  - D: (153,117.5) → (147,119)
- `Q.face`(`:541-542`)의 game 이빨 높이를 줄인다: 6 → 5, 5.6 → 4.6.
- 바꾸지 않는 것: U·L, 이빨 개수(game 위 3·아래 2, art 4·3), 눈 (128,72), 기울기 12°, 뿔, meta(eye·head·pouchW·pad).

**합격 기준**
- 같은 프로필 측정에서 현→노치 바닥 깊이가 10단위(2.5px) 이상인 행이 2단위 간격으로 연속 4행 이상이다.
- C4 즉시형 칸에서 앞아래가 파인 쐐기로 보인다.
- C9 game 창에서 위·아래 이빨 사이에 먹 틈이 보인다.
- C1·C7·C12가 ok다.

### R-2 5장 초승 구멍이 game LOD에서 보이지 않는다

**본 렌더**: `ad7-ch5-holes`, `ad7-ch5-enemy-holes`

**확인한 것**
- `K.holed`(`k-enemies.js:199-208`)는 game에서 구멍 테를 `3 * x.u` = 12단위로 긋는다(`:205`).
- 폭탄병 구멍의 최대 두께는 테보다 거의 크지 않다.
  - 심지형: 12.46단위(`k-bombers.js:415`, `K.crescent(63,139,15, 70.5,132.5,12.5)`)
  - 즉시형: 12.05단위(`:659`)
- 그래서 줄무늬 바탕 위에서도 game은 비치는 곳이 0이다. art(테 4.8단위)에서는 초승 틈이 보인다.
- k-enemies 5장 여우도 똑같다(`k-enemies.js:633`, 13.5단위). 큰 구멍을 가진 수문장만 game에서 보인다.
- 바이블 §3의 소형 단순화와도 맞고 기존 선례와도 같으므로 결함으로 막지 않는다.
- 다만 API §5.3과 납품서 §4.1('모두 그렸다')만 읽으면 game에도 구멍이 있는 것으로 오해한다.

**처방(문서, 다음 손질 때)**
- `API-bombers.md` §5.3의 5장 두 줄과 §9에 적는다: "game LOD에서는 3px 먹테가 구멍을 메워 보이지 않는다(art에서만 보인다). k-enemies 5장 여우와 같다."
- C12 한계 문구도 같은 뜻으로 고친다.

**처방(형태)**: 팀 결정 Q-A 뒤에만 한다(§8).

### R-3 art LOD의 `pad`

**본 렌더**: `ad7-art-bounds`

- art plant f1~f3의 연기(`_.smoke`, `:186-187`, `:321`)는 y −24까지 올라간다. art walk는 y −1까지다.
- `meta.pad`는 game 기준으로 0이다(`:856`). 지금 art LOD는 굽지 않으므로 영향이 없다.
- **처방**: `API-bombers.md` §4.3에 "pad는 game LOD 기준이다. art를 구우면 plant에 위 pad 32가 필요하다"를 적는다.

### R-4 2장 즉시형 리벳 머리

**위치**: `Q.CH[2].horn`, `:603-606`, 둥근 머리 r 7.2

- hit 흰 실루엣에서 둥근 귀처럼 읽힐 여지가 있다.
- **처방**: 머리를 기둥 방향으로 납작한 돔(가로 7.2 × 세로 4.8, 밑변 평평)으로 바꿔 '기둥 + 리벳'으로 읽히게 한다. 사람 클린업으로 넘겨도 된다.

## 6. 메인 세션이 반영할 때 확인할 것

1. **등록·굽기**: 납품서 §5의 1~3을 그대로 쓴다. 값은 확인했다.
   - 앵커: `meta.feet` (100,186)
   - 배율: 0.25(fit 1)
   - 여백: `extraPad = meta.pad[state]`. blast는 심지형 [32,93,72,93], 즉시형 [0,22,15,26]
   - 호출: `{lod:'game', shadow:false, halo:true, state, frame}`
2. **굽기 뒤**
   - 매니페스트에서 기존 `enemy/*`의 w·h·ax·ay가 그대로인지, 새 키가 90개(장마다 18)인지 본다.
   - `npm run bench:packs`, `npm run build`(설치 에셋 예산)를 돌린다.
3. **슬롯·상태**: 지시서 §9-2대로 한다. plant 프레임은 minimal에서도 진행률로 고른다.
4. **렌더러**
   - 지금 불꽃 점 규칙으로도 점이 심지 세로줄 ±2.5px 안에 선다(C10a 5장). 그래서 R1은 선택이다.
   - 즉시형의 머리 위 표식(정예·기절)은 피벗 x에 두면 몸 꼭대기보다 약 5.75px 뒤에 선다. `meta.head`를 쓸지 정한다.
5. **`npm run test:visual`**: 지시서의 세 장면에 둘을 더한다.
   - (a) 원 안에 심은 심지형
   - (b) 결 옆의 즉시형
   - (c) 터지는 순간(groundMarks 층)
   - (d) 5장 즉시형이 5장 사격수(반영 눈알 포대)에 붙은 장면
   - (e) 돌격수·수문장 뒤에 반쯤 가린 심지형. 몸 위 층 고리가 가린 몸을 대신 알려 주는지 본다.
6. **개발 빌드**: 걸음 발 미끄러짐을 본다(심지형 8fps·이동 1.1배, 즉시형 12fps·1.4배). 미끄러지면 `BOMBER_KINDS.walkFps`만 바꾼다.
7. **나머지 게이트**: `npm run test:unit`, `npm run test:perf`(적 400).
8. **`git status`**: 이번 납품이 새 파일 두 개뿐인지 확인한다. 내 도구로는 git을 볼 수 없다. C8·C11로 `PN.enemies` 출력이 그대로인 것만 확인했다.

## 7. 사람 원화가 손볼 곳 (바이블 §15)

- 납품서 §6의 목록에 동의한다: 붓 외곽과 블랙 스팟, 1장 종이·벽보, 3장 가시·옹기 결, 4장 바늘 끝, 5장 흑요 결, 먹 불꽃·연기 붓질, 터짐의 비백과 파편.
- 더할 것
  - 2장 심지형의 완고한 표정: 열쇠 구멍을 지키면서 능선을 앞쪽으로 내리누른다.
  - 즉시형 노치(R-1을 킷에서 하지 않을 경우)
  - 2장 리벳 머리(R-4)
  - 5장 구멍(Q-A 결정 뒤)

## 8. 열린 질문

| # | 질문 | 권고 |
|---|---|---|
| Q-A | 5장 소형 적(여우·폭탄병)의 초승 구멍을 game LOD에서도 보이게 할지. 지금은 둘 다 3px 먹테가 구멍을 메운다 | 바이블 §10.1에 '소형 game LOD에서는 구멍을 생략할 수 있다(art에만 둔다)'를 적고 지금 그림을 유지한다. 보이게 하려면 k-enemies 여우와 폭탄병을 함께 고친다. 조건: 최대 두께 ≥ 20단위, 바깥 원이 윤곽에서 8단위 이상 안쪽, 면적 ≤ 12% |
| Q-B | T3(정식 0.3초 시험) 재료 | 5장 즉시형 ↔ 5장 사격수, 심지형 plant f3, 2장 즉시형을 32px 세트와 B 장면에 넣는다 |
| Q-C | 즉시형 walk를 좌우 다리를 번갈아 딛는 8프레임으로 바꿀지 | 지금(4프레임 한 번 뛰기)을 유지한다. '튀는 공' 판독에 맞고 굽기 용량도 작다 |

## 9. 미확인

- 실제 게임 화면(굽기 결과와 렌더러 표식): `test:visual`이 필요하다.
- 발 미끄러짐과 팩 용량
- 파일 범위(git)
- T2는 검수자 한 명의 판정이다. 정식 시험이 아니다.

## 관련 파일

- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-bombers.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-bombers.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K7-bombers.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/bombers.md`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-enemies.js` (`K.holed` :199-208, 여우 구멍 :633, `K.stitch` :340-349)
- 렌더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/ad7-*.png`

---

## 후속 수정 납품서 (2026-10-19)

검수 R-1~R-4 반영을 마쳤습니다.
- 고친 파일은 `k-bombers.js`와 `API-bombers.md` 둘입니다. 내려받은 것은 없습니다.
- `--check`를 붙인 렌더는 모두 ok, kit error 0건입니다.
- 출력이 그대로여야 하는 것은 해시로 확인했습니다: 심지형 전 출력, 즉시형 터짐 1·3·4·5장, `meta`/`list` 전체, `PN.enemies`(C8·C11).
- 지시서에서 벗어난 것이 1건 있습니다. R-1을 처방값대로만 하면 art에서 아래 이빨이 입술에서 떠 보이고, 노치 깊이 기준도 짝수 행 격자에서 한 행 모자랐습니다. 그래서 아래 이빨 줄을 실제 아랫입술 위로 옮겼습니다(§4).

### 1. 바뀐 것

| 파일 | 위치 | 내용 |
|---|---|---|
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-bombers.js` | :448-451 `Q.NOTCH` | R-1 처방대로 A (150,104)→(143,106), D (153,117.5)→(147,119). U·L은 그대로 |
| 같은 파일 | :540-547 `Q.face` | game 이빨 높이: 위 6→5, 아래 5.6→4.6(처방). 아래 이빨 줄을 현 A→L에서 아랫입술 D→(L에서 1.9 앞)으로 옮기고, 방향도 D→L에 수직으로 맞춤(지시서 밖, §4) |
| 같은 파일 | :608-619 `Q.CH[2].horn` | R-4: 리벳 머리를 둥근 r 7.2에서 납작한 돔으로 바꿈. 양옆 7.2 × 높이 4.8, 밑면 평평, 꼭대기는 옛 머리와 같은 거리. ink.500 광택점은 빛 쪽(좌상) 돔 안쪽에 둠(r art 1.3 / game 1.6, 옛 1.7 / 2.2) |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-bombers.md` | v1 → v1.1 | :9-15 변경 기록 · §4.1 :121·:125·:132-136 · §4.3 :160-170(R-3) · §5.2 :185-196(R-1) · §5.3 :209(R-4), :214-215(R-2) · §5.4 :218 · §6 :229·:234-243 · §8 :279-285 · §9 :291-296(Q-C, R-2·Q-A), :300-303(C12 문구 정정) |

- 네임스페이스, 함수, 옵션, 상태 수는 그대로입니다: `PN.bombers`, draw/meta/list/kinds/C/ctx, 장마다 18장.
- 바뀐 출력
  - 즉시형 idle·walk·hit: 다섯 장, 두 LOD, 실루엣 포함.
  - 2장 즉시형 터짐: 날아가는 리벳도 같은 뿔 함수를 쓰기 때문입니다.

### 2. API 요약 (모두 그대로)

- 박스 200×200, 오른쪽을 봄.
- 피벗 (100,138), 발 (100,186), 판정 r 12(로컬 48), u 4, displayScale 0.25.
- 앵커: eye (151.1,80.3)(즉시형), head와 wick 표, blastCenter, displayPx 모두 그대로.
- pad: 즉시형 [0,0,0,0], blast [0,22,15,26].
- `meta-all` 해시가 작업 전후 모두 `1sn7alt`입니다.
- 칠한 높이/폭만 0.01씩 바뀌었습니다: 2장 즉시형 1.08→1.07(돔 끝이 0.4단위 더 나옴), 4장 즉시형 1.10→1.09(A가 움직이며 U의 miter 끝이 나옴). 둘 다 범위 0.95~1.25 안입니다.

### 3. 검사 결과

렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. C1·C4·C6·C7·C8·C9·C12 명령은 지시서 §7.2 원문 그대로이고 이름만 `k7b-`로 바꿨습니다.

| 검사 | 렌더 | 결과 |
|---|---|---|
| C1 | `k7b-c1-all` | ok |
| C4 | `k7b-c4-sil32`(1배), `-x3` | 즉시형 칸(6·8열)의 앞아래가 파인 쐐기로 보임. T1은 그대로 |
| C6 | `k7b-c6-scan` | `signal=0 text=0` |
| C7 | `k7b-c7-meta` | 10줄 ok + `invalid calls ok`(원문 아래) |
| C8 | `k7b-c8-unchanged-before`, `k7b-c8-unchanged` | 둘 다 `enemy-all=kubxcy len=5226045 list=20 roles=stalker,charger,shooter,warden draw=stalker,charger,shooter,warden` |
| C9 | `k7b-c9-ch1..5-face` | 5건 ok. 한 시점, 장별 눈 |
| C11 | `enemies --check` | 40장 ok |
| C12 | `k7b-c12-area` | 10줄 ok |
| 해시 비교 | `k7b-hash-before(-key)` → `k7b-hash-compare` | 심지형 10행 same, 즉시형 blast 1·3·4·5장 same, 2장만 DIFF(예상한 R-4), meta-all same |

**C7 원문(수정 후)**
```
ch1 fuse body=32.5px w=28.5px eye=23.5px aspect=1.48 ok
ch1 burst body=34.6px w=32.5px eye=26.4px aspect=1.07 ok
ch2 fuse body=32.3px w=28.5px eye=23.5px aspect=1.48 ok
ch2 burst body=35.5px w=33px eye=26.4px aspect=1.07 ok
ch3 fuse body=32.3px w=29px eye=23.5px aspect=1.46 ok
ch3 burst body=35.2px w=32px eye=26.4px aspect=1.08 ok
ch4 fuse body=32.3px w=28.5px eye=23.5px aspect=1.48 ok
ch4 burst body=35.3px w=32.5px eye=26.4px aspect=1.09 ok
ch5 fuse body=32.5px w=28.5px eye=23.5px aspect=1.48 ok
ch5 burst body=35.5px w=32.5px eye=26.4px aspect=1.08 ok
invalid calls ok
```

**C12**: 심지형 5행은 원 납품서와 글자까지 같습니다. 즉시형 차이는 반올림 수준뿐입니다.
- 2장: idle·walk0 mid 4→3, walk0 paper 1.2→1.3.
- 4장: walk0 paper 2.6→2.7.
- 10줄 모두 ok, other 0.0입니다.

**`--check`**
- 위 표 밖에 다음 렌더도 모두 ok였습니다: 수정 전후 입 확대·C9·즉시형 game 시트·2장 리벳/터짐, `k7b-c3-ch2-art`, `k7b-c5-ch1-crowd-x3`, `k7b-c5-ch2-crowd`, `k7b-c9low-burst-all`, 아래 이빨 확대 4건, 5장 구멍 3건.
- 실패는 1건이었습니다. `k7b-ch5-holes` 첫 실행에서 제 리뷰용 줄무늬 `<pattern id="k7bst">`의 고정 id가 걸렸습니다(모듈 id가 아님). id 없는 사각형 줄무늬로 바꿔 다시 돌려 ok입니다.

#### 노치 깊이 측정 (R-1 기준)

재는 법
- game 단색 실루엣 idle을 그리고, 기울기 뒤 박스 좌표에서 1단위 행마다 칠한 맨 오른쪽 x를 찾습니다(6px/단위 `elementFromPoint`).
- 깊이 = 현 (189,104)→(173,141)의 x − 그 x입니다.
- 수정 전 측정이 검수서와 맞았습니다: y124에서 8.1, 최대 8.5(y123), 10 이상인 행 0개.

| y | 수정 전 | 처방값만 | 최종 |
|---|---|---|---|
| 116~118 | 3.6 / 3.0 / 3.2 | 8.1 / 8.0 / 8.0 | 8.1 / 8.0 / 8.0 |
| 119 | 6.3 | **13.1** | **13.1** |
| 120 | 5.7 | **12.8** | **12.8** |
| 121 | 5.1 | **12.6** | **12.6** |
| 122 | 4.8 | **12.3** | **12.3** |
| 123 | 8.5 | **15.7** | **15.7** |
| 124 | 8.1 | **14.4** | **15.3** |
| 125 | 7.7 | **11.2** | **14.8** |
| 126 | 6.6 | 8.1 | **14.2** |
| 127 | 4.3 | 7.5 | **13.6** |
| 128~132 | 2.4~4.3 | 7.5~8.1 | 9.1~9.7 |

(1장 기준입니다. 다섯 장 모두 같고, 5장만 최대 15.4입니다.)

| | 수정 전 | 처방값만 | 최종 |
|---|---|---|---|
| 10 이상인 행 | 없음 | y119~125 | y119~127 |
| 2단위 간격 연속 행 수(짝/홀) | 0/0 | **3/4** | **4/5** |
| walk 4프레임(두 입술 끝 현) 연속 행 수 | 0~1 | — | 장·프레임마다 최소 4(4장은 7~9) |

측정 렌더: `k7b-notch-profile-before`, `k7b-notch-profile-after`(처방값만), `k7b-notch-profile-after-final`. 최종 명령 원문(API §8이 가리킴):
```
node scripts/art-review-sheet.mjs expr --name k7b-notch-profile-after-final --scale 1 --crop 0,0,1500,1200 --expr '(function(){var B=PN.bombers,Q=B._.BURST,NS="http://www.w3.org/2000/svg",X0=120,Y0=76,W=84,H=92,S=6;function prof(mk){var svg=document.createElementNS(NS,"svg");svg.setAttribute("width",W*S);svg.setAttribute("height",H*S);svg.setAttribute("viewBox",X0+" "+Y0+" "+W+" "+H);svg.style.position="fixed";svg.style.left="0px";svg.style.top="0px";svg.innerHTML=mk;document.body.appendChild(svg);var o={};for(var y=Y0+2;y<=Y0+H-2;y++){var py=(y-Y0)*S,hx=null;for(var px=W*S-0.5;px>=0;px-=1){var el=document.elementFromPoint(px,py);if(el&&el!==svg&&svg.contains(el)){hx=X0+px/S;break;}}o[y]=hx;}svg.remove();return o;}function lip(o,yc){var b=null;for(var y=Math.round(yc)-6;y<=Math.round(yc)+6;y++){if(o[y]!=null&&(!b||o[y]>b[1]))b=[y,o[y]];}return b;}function depth(o,a,b){var d={};for(var y=a[0]+1;y<b[0];y++){if(o[y]==null)continue;d[y]=a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0])-o[y];}return d;}function run(d,ph){var best=0,cur=0;Object.keys(d).map(Number).sort(function(p,q){return p-q;}).forEach(function(y){if((y-ph)%2)return;if(d[y]>=10){cur++;if(cur>best)best=cur;}else cur=0;});return best;}function mx(d){var b=[0,-1e9];Object.keys(d).forEach(function(y){if(d[y]>b[1])b=[+y,d[y]];});return b;}function ge(d){return Object.keys(d).filter(function(y){return d[y]>=10;}).join(",");}var L=["R-1 notch profile AFTER (final), game silhouette idle. depth = chord x - rightmost painted x per row (units, 4u = 1px). * = depth >= 10"],T={},P={};for(var ch=1;ch<=5;ch++){var o=prof(B.draw(ch,"burst",{lod:"game",silhouette:true,halo:false,shadow:false}));P[ch]=o;var d=depth(o,[104,189],[141,173]);T[ch]=d;var m=mx(d),M=Q.pose("idle",0).M,u=B._.ap(M,Q.NOTCH.U),l=B._.ap(M,Q.NOTCH.L),a=lip(o,u[1]),b=lip(o,l[1]),dh=depth(o,a,b),mh=mx(dh);L.push("ch"+ch+" fixed chord (189,104)-(173,141): max "+m[1].toFixed(1)+" @y"+m[0]+"  rows>=10: ["+ge(d)+"]  run2 even="+run(d,0)+" odd="+run(d,1)+"  | hull chord U("+a[1].toFixed(1)+","+a[0]+") L("+b[1].toFixed(1)+","+b[0]+"): max "+mh[1].toFixed(1)+" @y"+mh[0]+" run2 even="+run(dh,0)+" odd="+run(dh,1));}L.push("");L.push("  y |  ch1 depth (x)   |  ch2 depth (x)   |  ch3 depth (x)   |  ch4 depth (x)   |  ch5 depth (x)");for(var y=104;y<=141;y++){var r=y+" |";for(var c=1;c<=5;c++){var dv=T[c][y],xv=P[c][y];r+="  "+(dv==null?"   -":(dv>=0?" ":"")+dv.toFixed(1))+(dv!=null&&dv>=10?"*":" ")+" ("+(xv==null?"-":xv.toFixed(1))+") |";}L.push(r);}L.push("");for(var ch=1;ch<=5;ch++){var s="ch"+ch+" walk hull chord:";for(var fr=0;fr<4;fr++){var o2=prof(B.draw(ch,"burst",{lod:"game",silhouette:true,halo:false,shadow:false,state:"walk",frame:fr})),M2=Q.pose("walk",fr).M,u2=B._.ap(M2,Q.NOTCH.U),l2=B._.ap(M2,Q.NOTCH.L),a2=lip(o2,u2[1]),b2=lip(o2,l2[1]),d2=depth(o2,a2,b2),m2=mx(d2);s+="  f"+fr+" max "+m2[1].toFixed(1)+"@"+m2[0]+" run "+run(d2,0)+"/"+run(d2,1);}L.push(s);}return "<rect width=\"1500\" height=\"1200\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"6\" y=\""+(18+i*17)+"\" font-size=\"12.5\" font-family=\"monospace\" xml:space=\"preserve\">"+t+"</text>";}).join("");})()'
```

#### 직접 연 전후 렌더

| 항목 | 수정 전 | 수정 후 |
|---|---|---|
| 입 확대(게임 1px = 16px, game·game 실루엣·art·art 실루엣 × 5장) | `k7b-before-mouth` | `k7b-after-mouth` |
| C9 얼굴 창 | `k7b-before-c9-ch1..5-face` | `k7b-c9-ch1..5-face`, 입 전체가 들어가게 창을 22 내린 `k7b-c9low-burst-all` |
| C4 32px | `k7b-before-c4-sil32-x3` | `k7b-c4-sil32`, `-x3` |
| 즉시형 game 시트(게임 2배, 판정 원·발 선) | `k7b-before-burst-game` | `k7b-after-burst-game` |
| 2장 리벳(game, art, hit 2, 실루엣) | `k7b-before-ch2-rivet` | `k7b-after-ch2-rivet`, `-x6` |
| 2장 터짐 | `k7b-before-ch2-blast` | `k7b-after-ch2-blast` |
| 아래 이빨 | `k7b-after-lowerteeth-zoom`(처방값만: art에서 떠 있음) | `k7b-after2-lowerlip-x20`(끝점 0.25 틈) → `k7b-after3-lowerlip-x16`(최종, 틈 없음) |
| 그 밖 | | `k7b-c3-ch2-art`, `k7b-c5-ch1-crowd-x3`, `k7b-c5-ch2-crowd`(1배), `k7b-ch5-holes(-zoom)`, `k7b-ch5-fuse-hole-x40`, `k7b-art-pad-measure`, `k7b-burst-bounds`, `k7b-ch2-leftmost-check` |

### 4. 지시서(검수서) 대비

**R-1**
- 처방값은 그대로 넣었습니다: A, D, game 이빨 높이 5/4.6.
- 바꾸지 않은 것도 검수서대로입니다: U·L, 이빨 개수(game 위 3·아래 2, art 4·3), 인셋(3.4/2.2), 눈 (128,72), 기울기 12°, 뿔, meta.

**지시서와 다르게 한 것: 아래 이빨 줄의 자리.** 밑변을 현 A→L에서 아랫입술 D→(L − 1.9·단위벡터)로 옮기고, 방향을 D→L에 수직으로 바꿨습니다. 이유는 둘입니다.
1. D가 들어가면서 현 A→L이 실제 입술에서 3.3단위 떨어졌습니다. art 외곽(바깥 2.24)으로는 그 틈이 메워지지 않아 아래 이빨이 떠 보였습니다(`k7b-after-lowerteeth-zoom`). game은 외곽(6.25)이 틈을 메웠습니다.
2. 처방값만이면 10단위 이상 행이 y119~125입니다. 홀수 격자로는 4행이라 통과지만 짝수 격자로는 3행입니다. 검수서의 'y124가 가장 깊고 나머지 2~6'은 짝수 격자로 잰 값과 맞으므로, 같은 방식으로 재면 떨어집니다. 옮긴 뒤에는 y119~127이라 두 격자 모두 통과합니다.
- 옛 끝점 `L − (0.6, 1.8)`은 새 입술 방향에서 노치 쪽으로 0.88 비켜나 art에 0.25단위 틈을 냈습니다. 그래서 끝점을 입술 선 위 1.9 앞으로 바꿨습니다(물러나는 거리는 같습니다).

**R-1 합격 기준 판정**
- 프로필: 통과(위 표).
- C4: 즉시형 앞아래가 파인 쐐기로 보입니다.
- C9: game에서 위·아래 이빨 사이에 노치 바닥의 먹 틈이 보입니다. 다만 표준 C9 창은 아래 끝이 y 130.3이라 아래 이빨이 가장자리에 걸립니다. 입 전체는 `k7b-c9low-burst-all`과 `k7b-after-mouth`에서 확인했습니다.
- C1·C7·C12 ok.

**R-2·Q-A**
- API §5.3의 5장 두 줄과 §9에 지정 문구를 넣었습니다.
- C12 한계 문구를 고쳤습니다: game에서는 먹테가 구멍을 메워 실제로 몸색이고, art를 재면 구멍이 몸 면적에 잡힌다.
- Q-A 권고안대로 형태는 그대로입니다(바이블 §10.1과 같습니다).
- 직접 확인하다 찾은 것이 있습니다. 5장 심지형 game 구멍 앞 가장자리에 폭 0.5단위 이하·길이 약 5단위의 실틈이 있습니다(1배 0.13px, `k7b-ch5-fuse-hole-x40`).
  - 심지형 해시가 그대로라서 원래부터 있던 것입니다.
  - 검수서의 '비치는 곳 0'은 1단위 표본보다 가늘어서 잡히지 않은 것으로 보입니다. §9에 적었습니다.

**R-3**
- §4.3에 지정 문구를 넣고, art 실측 표를 붙였습니다.
  - 심지형 plant: 연기 꼭대기 y −23.5 → 위 32.
  - 심지형 walk: y −0.5 → 같은 규칙이면 위 9.
  - art blast는 game pad 안입니다.

**R-4**
- 돔 처방 '가로 7.2 × 세로 4.8'은 반지름(양옆 7.2, 기둥 방향 높이 4.8)으로 읽었습니다.
  - 옛 머리 r 7.2가 반지름이었습니다.
  - 전체 폭 7.2로 읽으면 기둥 꼭대기 폭 9.7보다 좁아져 리벳 머리가 되지 않습니다.
- 꼭대기 거리를 옛 머리와 같게 두어, 뿔 길이와 이웃 차, 칠한 높이(39.1px)가 그대로입니다.
- 기둥이 보이는 길이는 3.4~11단위에서 11~18단위로 늘었습니다.
- hit 흰 실루엣에서 귀가 아니라 '기둥 + 리벳'(볼트)으로 읽힙니다(`k7b-after-ch2-rivet`).

**Q-C**: 즉시형 walk 4프레임을 유지했고 §9에 적었습니다.

### 5. 메인 세션이 할 일

1. **다시 구울 키(31장)**
   - `enemy/<1~5>/bomber-burst/idle/0`, `walk/0..3`, `hit/0`: 30장.
   - `enemy/2/bomber-burst/blast/0`: 1장.
   - 그대로인 키(59장): `enemy/<ch>/bomber-fuse/*` 55장, `enemy/{1,3,4,5}/bomber-burst/blast/0` 4장.
2. **등록값은 바뀌지 않습니다.**
   - 앵커 `meta.feet` (100,186), 배율 0.25(fit 1).
   - `extraPad = meta.pad[state]`: 즉시형 [0,0,0,0], blast [0,22,15,26].
   - 호출 `{lod:'game', shadow:false, halo:true, state, frame}`, 애니메이션, `BOMBER_KINDS`, `KIT_FILES`의 `k-bombers.js` 순서(`k-enemies.js` 바로 뒤).
   - 새 옵션도, 렌더러가 새로 쓸 것도 없습니다.
3. **굽기 뒤 매니페스트 확인**
   - 심지형 55장과 즉시형 blast 1·3·4·5장은 그대로여야 합니다.
   - 바뀐 즉시형 프레임 가운데 w·h·ax·ay가 1px 안에서 움직일 수 있는 것은 2장(돔 끝 +0.4단위)과 4장(U miter +0.1단위)뿐입니다. 1·3·5장은 칠한 범위가 같습니다.
4. 재검수 때 노치 프로필은 짝수·홀수 격자를 모두 보도록 검수자에게 전해 주십시오(위 명령이 둘 다 출력합니다).

### 6. 알려진 한계

- **game 아래 이빨의 흰 부분이 더 작아졌습니다.**
  - 입술 D→L 위로 옮겨 이빨 간격이 7.3에서 5.5단위로 줄었고, 높이도 처방대로 낮아졌습니다.
  - 그래서 1배 흰 부분이 약 0.7px에서 0.4px가 됐습니다. 위 이빨은 0.5px에서 0.8px로 커졌습니다.
  - 1배 판독은 노치 쐐기와 위 이빨이 맡습니다.
  - 더 키우려면 방법은 둘입니다: `_.teeth`의 game 먹테를 0.55u에서 0.45u로(즉시형 이빨에만 쓰임), 또는 사람 클린업. 지시서 밖이라 하지 않았습니다.
- art 아랫입술의 여유는 0.18단위입니다. 1·3·5장 `ROUGH` 변위가 일부 배율에서 아주 작은 틈을 낼 수 있습니다(제 렌더에서는 보이지 않았습니다).
- 5장 심지형 game 구멍의 실틈(0.13px)은 원래부터 있던 것입니다.
- 잠정 아트입니다(바이블 §15). 노치·이빨의 최종 붓질과 리벳 머리는 사람 클린업 대상입니다.
- 실제 게임 화면(굽기 뒤 `test:visual`)은 확인하지 못했습니다.
- PostToolUse 훅이 미리보기 서버(`preview_start`)를 안내했지만, 제 범위에서는 리뷰 시트 명령만 쓸 수 있어 해당하지 않습니다.

### 메인 세션 판정 (2026-10-19)

검수 권장(R-1~R-4)과 문서 항목이라 별도 검수 없이 메인 세션이 렌더(`k7b-after-burst-game`, `k7b-after-ch2-rivet`)와 노치 프로필 표로 확인해 받아들인다. 즉시형 앞아래가 단색 실루엣에서 파인 쐐기로 읽히고, 2장 리벳은 기둥 + 볼트로 읽힌다. 아래 이빨 줄을 아랫입술 위로 옮긴 것(처방 밖)은 art에서 이빨이 떠 보이는 것을 막고 짝수·홀수 격자 모두 깊이 기준을 채우므로 받아들인다. 열린 질문 Q-A·Q-C는 권고안(5장 구멍은 game LOD에서 생략 허용, 즉시형 walk 4프레임 유지).
