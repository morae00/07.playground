# 작업 지시서 K7: 자폭 먹귀(폭탄병) 2종 × 5장 — 새 모듈 `k-bombers.js` → `PN.bombers`

> 저장할 곳: `docs/art/briefs/bombers.md`. 작성: art-director, 2026-10-12. 발주: R5 실행서 1단계 B1, 제작은 2단계 K7.
> **근거**
> - 게임 쪽 정의: SYS-14 `src/content/data/bombers.ts`, `docs/ARCHITECTURE.md` "Bombers (SYS-14)".
> - 렌더러 표식: `src/game/render/worldRenderer.ts:896-920`, `:1041-1077`.
> - 상태 고르기: `src/game/render/animation.ts:60-123`.
> - 굽기: `art/atlas-spec.mjs:45-50`·`:371-387`, `scripts/build-atlas.mjs:11`·`:185-203`.
> - 기준 문서: 스타일 바이블 v1 §3·§4·§5·§6·§7·§8·§10·§12·§13·§14·§15, v1.0 §9, `art/concept-kit/API-enemies.md` v2.1. 형식은 `docs/art/briefs/env-tops.md`를 따랐다.
>
> **렌더**
> - 이 지시서를 쓰며 직접 본 렌더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/b1-*.png`.
> - kit-artist의 렌더 이름은 `k7-`로 시작한다.
> - §7의 명령은 모두 실제로 돌려 봤다. 모듈이 아직 없어서 `PN.bombers` 자리에 추적자를 넣은 대역으로 실행했다(`b1-test-*`).

## 0. 요약

| 항목 | 내용 |
|---|---|
| 담당 | `kit-artist` K7. 납품서는 응답으로 돌려준다. 메인 세션이 `docs/art/deliveries/K7-bombers.md`로 저장한다 |
| 새 파일 | `art/concept-kit/k-bombers.js`(`window.PN.bombers`)와 `art/concept-kit/API-bombers.md`. 이 두 파일 밖은 고치지 않는다(`k-enemies.js`도 고치지 않는다) |
| 대상 | 심지형(fuse)과 즉시형(burst) × 1~5장 = 10 프로필 |
| 장 수 | 심지형 11장(idle 1, walk 4, plant 4, blast 1, hit 1), 즉시형 7장(idle 1, walk 4, blast 1, hit 1). LOD는 `game`과 `art` 두 벌이다 |
| 핵심 | 멀리서 추적자와 갈리는 실루엣. 심지형은 **둥근 몸 + 심지 한 가닥**, 즉시형은 **둥근 몸 + 촉발 뿔 + 달리는 두 다리**다. 32px 흑백에서 역할 4종과도, 서로와도 갈려야 한다 |
| 지킬 것 | 박스·피벗·판정(§1.3), 상태 이름(§1.4), 앵커(§1.5), 렌더러 표식을 그리지 않는다(§1.7), 그림 규칙(§1.8), 바뀌면 안 되는 출력(§1.9) |
| 합격 | §7의 구별 시험 T1·T2와 C1~C12 |

### 0.1 지금 상태와 시안에서 확인한 것 (모두 렌더로 확인)

**현재 상태**

| 무엇 | 본 렌더 | 결과 |
|---|---|---|
| 지금 화면 | ARCHITECTURE "Bombers"와 대역 렌더 `b1-test-c10a-marks` | 폭탄병은 그 장의 추적자 그림에 표식만 얹는다. 즉시형의 겹 산호 고리(반지름 16, 21~24px 원, 몸 위 층)가 추적자의 **눈을 가로지른다** |
| 기존 역할 32px 흑백 | `b1-sil32-mock-all-x3` | 가장 가까운 둥근 형태는 5장 사격수(삼각대 위 눈알 + 포신)다. 1·4장 사격수 머리도 둥글고 꼭지가 있다 |
| 처치 연출 | `b1-kill-ref-x3`(`PN.vfx.kill`, 추적자) | 몸 모양 종이 섬광 → 몸 모양 먹 폭발 + 작은 흰 별 → ✕✕ 눈 웅덩이다. 터짐 그림이 이것과 닮으면 안 된다 |

**시안에서 확인한 것**

| 무엇 | 본 렌더 | 결과 |
|---|---|---|
| 첫 시안 | `b1-sil32-mock-ch1-x4` | '공 + 심지'는 32px에서 바로 폭탄으로 읽힌다. 다만 끝이 아래로 꺾인 심지는 '?'처럼 보인다. 즉시형의 가는 곧은 다리는 뿔이 하나 더 있는 것처럼 보여, 전체가 바이러스 아이콘처럼 읽힌다 |
| 고친 시안 | `b1-sil32-refined-x4`, `b1-mock-aspect` | 끝이 위·뒤로 향한 S자 심지는 깨끗하다. 무릎이 꺾인 두 다리는 달리는 다리로 읽힌다. 심지형 네 다리가 붙으면 받침대처럼 보이므로 **다리 사이 틈이 필요하다**. 칠한 실루엣의 높이/폭은 심지형 1.58, 즉시형 1.11이다. 같은 방법으로 잰 추적자는 0.43~0.57이다 |
| 1x 무리 장면 | `b1-crowd-mock-ch1-x3` | 두 시안 모두 추적자 무리 속에서 튄다. 렌더러의 불꽃 점은 **심지 끝보다 15px 위에 떠 있다**(체력바를 켜면 29px). 심지형 고리(17px)와 즉시형 고리(16, 21~24px)는 몸 아래쪽을 가로지른다 |
| 심은 자세와 터짐 | `b1-plant-blast-mock-x2` | 웅크린 몸 + 짧아진 심지 + 먹 불꽃은 호박 원 안에서 읽힌다. 터짐 구름을 도달 범위의 약 0.38배로 그리면 비례가 맞다. 대충 그린 별 모양은 규칙적인 별로 보여 피해야 한다 |

**도구와 기준값**

| 무엇 | 본 렌더 | 결과 |
|---|---|---|
| id 접두 | `b1-id-prefixes` | `kb2_`·`kb3_`·`kb4_`는 bossesB·C·fieldBosses가 이미 쓴다. 이 모듈은 **`bmb<n>_`**를 쓴다 |
| 기준 해시 | `b1-enemy-hash-before`, `-before2` | 먹귀 20종 전체 출력 해시는 `enemy-all=kubxcy len=5226045`다. 두 번 돌려 같은 값이 나왔다 |
| 면적 측정 도구 | `b1-calib-area` | 적중 판정 표본(`elementFromPoint`) 방식이다. 1장 추적자 game을 재면 먹 80.9, ink.300 9.7, ink.500 8.2, 종이 1.3%다. 2장 사격수 준비 자세의 호박 4.9%를 '기타'로 잡아낸다 |
| 도구의 한계 | `b1-calib-mask` | 표본은 clip-path는 지키지만 mask는 무시한다. 그래서 5장 투명 구멍은 몸 면적에 잡힌다 |
| 칠한 아래 끝 | `b1-calib-painted` | 기존 먹귀의 칠한 아래 끝은 발 선에서 −1.5~+6.5단위 안에 있다 |

## 1. 공통 계약

### 1.1 모듈·로드·이름공간
- **로드 순서**: `lib.js`와 `k-enemies.js` 뒤에 읽힌다. 리뷰 시트는 이름순으로 자동으로 읽는다. 굽기는 메인 세션이 `scripts/build-atlas.mjs:11`의 `KIT_FILES`에 `k-enemies.js` 바로 뒤로 넣는다.
- **`PN.enemies._K` 도우미는 읽기만 한다.** 순수 함수는 그대로 불러 써도 된다:
  - 기하: `K.sm`, `K.pl`, `K.xf`, `K.jag`, `K.circ`, `K.rng`, `K.drip`
  - 다리: `K.ik`, `K.limbD`, `K.legGeo`, `K.gait`
  - 5장: `K.crescent`, `K.nibble`
- **`x`(컨텍스트)를 받는 도우미**도 쓸 수 있다: `K.eye`, `K.teeth`, `K.stitch`, `K.drips`, `K.speed`, `K.puffs`, `K.arc`, `K.holed`.
  - 이 도우미에 넘길 컨텍스트는 자기 것을 만든다.
  - `K.ctx`(`k-enemies.js:79-125`)를 **이 모듈 안에 복사해서** `B.ctx`를 만든다. id 접두만 `bmb`로 바꾸고, `u = 4`, `gameW = 2.5`로 둔다.
  - `K.ctx` 자체는 부르지도 고치지도 않는다.
- **금지**:
  - `K.ROLE`·`K.DRAW`·`K.ANCH`·`K.CH`·`K.C`·`PN.enemies.list`에 항목을 더하거나 값을 바꾸지 않는다.
  - 다른 모듈의 이름공간을 건드리지 않는다.
  - `Math.random`을 쓰지 않는다. 난수가 필요하면 고정 seed의 `K.rng`를 쓴다.
- **id**: 모듈 단위 카운터로 `bmb<n>_`를 붙인다. 카운터는 되감지 않는다. `<defs>`는 호출마다 따로 가진다.
- **중복 속성 금지**: `x.line`·`x.shape`의 `extra`로 `stroke-linecap`·`stroke-linejoin`을 다시 넘기지 않는다. K5 D 항목과 같은 실수다.

### 1.2 호출 형식
```
PN.bombers.draw(ch, kind, opts) → '<g class="pn-bomber" data-ch data-kind data-state><defs>…</defs>…</g>'
PN.bombers.meta(ch, kind) → 아래 §1.5 필드
PN.bombers.list           → 10개(meta와 같은 객체)
PN.bombers.kinds          → ['fuse', 'burst']
PN.bombers.C              → 킷 토큰(k-enemies K.C와 같은 값)
```

| opts | 기본값 | 뜻 |
|---|---|---|
| `state` | `'idle'` | `'idle' \| 'walk' \| 'plant' \| 'blast' \| 'hit'`. `plant`는 심지형만 있다 |
| `frame` | `0` | `walk` 0~3(넘으면 순환), `plant` 0~3(넘으면 끝 값). 나머지 상태는 무시한다 |
| `lod` | `'art'` | `'art'`(원화·쇼케이스) \| `'game'`(인게임 1x 재드로잉) |
| `halo` | `true` | 1.5px 녹아웃 헤일로(`env.chN.base`). `k-enemies` `filterDef`(:1422-1442)와 같은 식이다 |
| `shadow` | `true` | 킷 발밑 그림자. 중심 피벗 + 0.55r, 크기 24×10px, 먹 α0.3. k-enemies와 같다. 굽기에서는 false다 |
| `silhouette` | `false` | 순흑 실루엣. 그림자·헤일로·연기·속도선·먼지·긴장 호는 그리지 않는다. 불꽃은 그린다(형태라서). 5장 구멍은 투명으로 남긴다 |
| `hitbox` | `false` | 판정 원 점선 + 피벗 십자(개발 오버레이) |
| `flip` | `false` | 피벗 x축 좌우 반전 |

- **잘못된 호출**은 빈 `<g/>`를 돌려주고 `console.warn`을 남긴다(K5-G11과 같은 문법). 해당하는 경우는 다음과 같다:
  - 장이 1~5 밖일 때
  - 모르는 kind나 state일 때
  - 즉시형에 `plant`를 부를 때

### 1.3 박스·피벗·판정·크기 (바꾸지 않는다)

| 항목 | 값 |
|---|---|
| 로컬 박스 | 200 × 200, 오른쪽을 본다(반전은 호출부가 한다) |
| 피벗(판정 원 중심, 킷 관례) | (100, 138) |
| 발 feet = 피벗 + r·u | (100, 186). 굽기 앵커가 되고, 게임에서는 판정 원 중심이 된다(§16) |
| 판정 | r 12(로컬 48). 추적자와 같다(V4). 그림이 바뀌어도 반지름은 바뀌지 않는다 |
| u | 4단위 = 1 게임 px |
| displayScale | 0.25. 굽기에서 `fit`으로 줄이지 않는다(1). 처음부터 범위 안 크기로 그린다 |
| 몸 높이(발 → 주머니 꼭대기, 심지·뿔 제외) | 32~36px(128~144단위). 바이블 §7.1 소형 범위다 |
| 몸 폭(주머니) | ≤ 36px |
| 그림자 | 24 × 10px |

### 1.4 상태와 프레임

| 상태 | 심지형 | 즉시형 | 게임에서 쓰는 때 | 굽기 키(제안) | 재생(제안) |
|---|---|---|---|---|---|
| `idle` | 1 | 1 | 서 있을 때. 스폰 포즈가 없을 때 대신 쓴다 | `…/idle/0` | 정지 |
| `walk` | 4 | 4 | 이동. **f0은 minimal LOD의 정지 프레임**이기도 하다 | `…/walk/0..3` | 심지형 8fps, 즉시형 12fps 순환 |
| `plant` | 4 | — | 닿아서 심은 뒤 1.15초 | `…/plant/0..3` | 심지 진행률로 고른다: min(3, ⌊진행률 × 4⌋) |
| `blast` | 1 | 1 | 터지는 순간 0.15초 | `…/blast/0` | 한 번 |
| `hit` | 1 | 1 | 피격 네거티브 플래시 0.08초 | `…/hit/0` | 정지 |

- 장마다 18장, 다섯 장 합쳐 90장이다. 슬롯은 `enemy/<ch>/bomber-fuse`와 `enemy/<ch>/bomber-burst`다(R5 실행서 4단계).
- 바이블 §10.2의 보스 상태와 대응시키면 이렇다:
  - 준비 자세 = `plant`
  - 공격 순간 = `blast`
  - 처치 = 이번 범위 밖이다(일반 처치 연출을 쓴다, §11 Q2).
  - 페이즈와 광폭화는 없다.

### 1.5 앵커와 meta
`meta(ch, kind)` 필드는 다음과 같다(위치는 모두 로컬 단위):

| 필드 | 내용 |
|---|---|
| 이름·표기 | `ch`, `kind`, `id`(`'ink-alley/bomber-fuse'` 형식), `nameKo`(가칭, §3), `chapterKo`, `eyeKo` |
| 박스·크기 | `box`, `pivot`, `feet`, `r`, `unitsPerPx`, `displayScale`, `shadowPx` |
| 재생 | `states`(즉시형에는 `plant` 키가 없다), `walkFps` |
| `displayPx` | [주머니 폭, 몸 높이] px. idle 기준으로 잰 값 |
| `pad` | 상태별 `[위, 오른쪽, 아래, 왼쪽]`(박스 단위) |
| `head` | idle 주머니 꼭대기. 상태 아이콘 자리다 |
| `eye` | idle 눈 중심. 포즈(기울기)를 적용한 뒤의 값이다 |
| `wick` | 심지형만 있다. `{idle:[[x,y]], walk:[4개], plant:[4개], hit:[[x,y]]}`. 심지 끝 중심이다(그을린 매듭이나 불꽃 밑동) |
| `blastCenter` | 터짐 구름의 중심 |

**지킬 것**
- **`wick` 좌표는 다섯 장이 같다**(±2단위). 리그가 같으니 렌더러가 표 하나로 불꽃 점을 붙일 수 있다(§9 R1).
- 터짐 프레임 말고는 **칠한 맨 위 점이 심지 끝**이어야 한다. 심은 자세에서는 불꽃 꼭대기다.
- `hit.wick`는 `idle`과 같다.
- **눈 높이**: 눈 중심이 발 위로 심지형 ≥ 20px, 즉시형 ≥ 24px다. 이 값은 idle과 모든 walk 프레임에서 지킨다. 렌더러 고리가 눈을 가로지르지 않게 하려는 것이다(§1.7).
- **pad**: 기하가 박스 밖으로 나간 만큼에 8을 더한다.
  - idle·walk·plant·hit은 0이 목표다. 굽기는 사방 32단위 여백을 따로 붙인다.
  - 터짐의 기하 범위는 다음 안이다:
    - 심지형: x −110~310, y −40~290
    - 즉시형: x −40~240, y 10~250

### 1.6 굽기 방식 (참고, 메인 세션이 한다)
굽기는 `PN.bombers.draw(ch, kind, {lod:'game', shadow:false, halo:true, state, frame})`를 @2x로 그린다. 앵커는 `meta.feet`, 배율은 `meta.displayScale`, 여백은 `meta.pad[state]`다. 투명 여백을 잘라 낸다. 그림이 칸 가장자리에 닿으면 굽기가 실패한다.

### 1.7 렌더러가 따로 그리는 것 — 그림에 넣지 않는다
위치를 알아 두고 그림이 그것과 부딪치지 않게 한다.

| 표식 | 지금 렌더러 | 그림 쪽 조건 |
|---|---|---|
| 심지형 호박 점선 고리 | 발 중심의 원. 반지름 r+5 = 17px, 선 2.5, 대시 5/4. 몸 위 층(`overheads`)이다. 심기 전에만 그린다(`worldRenderer.ts:1057-1067`) | 눈 중심이 발 위 ≥ 20px |
| 심지형 머리 위 불꽃 점(호박) | x = 피벗 x, y = 그림의 칠한 맨 위 − 15px(체력바를 켜면 −29px). 반지름 3~5로 박동한다. 심기 전에만 그린다 | 불꽃·불씨에 신호색을 넣지 않는다. 심지 끝이 칠한 맨 위 점이고 피벗 x에서 ±3px 안에 있어야 점이 심지 바로 위 세로줄에 선다 |
| 즉시형 겹 산호 고리 | 발 중심의 원 두 개. 반지름 16px과 21~24px(박동). 몸 위 층이다(`:1069-1074`) | 눈 중심이 발 위 ≥ 24px |
| 심은 심지형의 폭발 범위 | 반지름 100 원. 호박 α0.12 바탕 + 진행 채움 α0.28 + 테 3에서 마지막 1/3에 5. 예고 층(몸 위)이다(`:896-920`) | 심은 자세가 이 원 아래에서도 읽혀야 한다 |
| 터짐 | 도달 범위(100/60)의 산호 링 0.3초 + 먹 파편 30/18개 + 화면 흔들림(`presentation.ts:292-298`) | 터짐 프레임은 중립색만 쓴다 |
| 정예 | 자수정 테두리(그림 오려 내기) + 머리 위 표식 | 킷에 정예 옵션을 만들지 않는다 |

### 1.8 그림 규칙

**외곽선**
- game:
  - k-enemies game `x.shape`와 같은 식이다. W = 10단위(2.5px), stroke 1.25W, `paint-order="stroke"`, 거의 균일하게 긋는다.
  - 작은 부품은 4~6단위로 긋는다.
  - 안쪽 선은 4~6단위이고 한 부품에 3줄까지다.
  - 비백·끊김·망점을 쓰지 않는다(§3 소형 적).
- art: k-enemies art `x.shape`(붓 오프셋)를 쓰고, 장별 선 필터는 `filterDef`의 `ROUGH`(1·3·5장)를 쓴다.

**명도와 면적**(§4.2, C12로 잰다)

| 대상 | 몸(초묵·농묵·중묵) | 중묵 | 패치(ink.300 + env.deep) | 종이 |
|---|---|---|---|---|
| idle·walk | ≥ 70% | ≤ 20% | ≤ 20% | ≤ 5% |
| plant f3 | ≥ 65% | — | — | ≤ 9% |
| 터짐 | ≥ 50% | — | — | 12~30%(종이 심) |

- 토큰 밖의 색은 0%다.
- 참고로 기존 1장 추적자는 몸 89, 패치 10, 종이 1.3%다.

**색**
- 쓸 수 있는 토큰은 다음뿐이다:

  | 계열 | 토큰 |
  |---|---|
  | 먹 | ink #121110, ink7 #2B2926, ink5 #46423D, ink3 #8C8579, ink1 #BCB4A5 |
  | 종이 | p50 #FAF6EC, p100 #F3EEE2, p300 #D8D0C0 |
  | 장 재질 | `env.chN.deep`(`K.CH[ch].deep`) |
  | 헤일로 | `env.chN.base`(헤일로에만) |
- 신호색과 그 glow 계열은 0건이다(청록·산호·호박·자수정·연두). 장 스팟색도 쓰지 않는다.

**음영**
- 명부는 주머니 좌상단을 구 모양대로 감는 ink5 초승달 하나다. art는 아래쪽 경계에 40% 망점 띠 하나를 더한다.
- 윗윤곽에 ink3 1px 비백 림을 준다.
- 망점은 art에서만 쓴다. 20/40/60%, 45°, 피치 6단위 이상, 한 부품에 2단계까지다. game에서는 0이다.

**드립**: 몸의 가장 낮은 끝에서 아래로 1~2개 흐른다. game에서 폭 ≥ 2px다.

**종이 액세서리**
- game에서 벽보·구겨진 종이 모서리는 평면 ink3 + 먹테로 칠한다(k-enemies 규칙).
- 종이 p50은 눈, 이빨, 균열 빛, 불꽃 심, 터짐 심에만 쓴다.

**금지**
- 해칭: 같은 각도·같은 간격 평행선 3줄 이상(§6-5). 심지 꼬임 표시는 굽은 짧은 획 4개 이하를 고르지 않게 둔다.
- 글자처럼 읽히는 표식: K5 지시서 §1.6의 어휘만 쓴다(인쇄 블록·줄, 찢긴 빈 종이).
- 모양: X·十·⊘·'!', 고리 표식.
- 발광, 가산 합성, 그라데이션.

### 1.9 바뀌면 안 되는 것
- 고칠 수 있는 파일은 `k-bombers.js`와 `API-bombers.md` 둘뿐이다.
- `PN.enemies` 출력은 그대로여야 한다. C8 결과가 `enemy-all=kubxcy len=5226045 list=20 roles=stalker,charger,shooter,warden draw=stalker,charger,shooter,warden`이어야 한다.
- `enemies --check`가 40장 모두 ok여야 한다(C11).
- 모듈을 읽는 중에 kit error가 0건이어야 한다.

## 2. 가족 디자인 (5장 공통 리그)

### 2.1 개념
- 먹귀는 형태를 되찾으려고 선을 먹는다(로어 §1.1). **폭탄병은 선을 너무 많이 삼켜 먹이 몸 안에 고여 부푼 먹귀다.** 한계에 이르면 터져 먹을 흩뿌린다.
- **심지형**은 먹 주머니에 **지노(紙撚, 종이를 꼬아 만든 끈) 심지**를 꽂았다.
  - 닿으면 주저앉아 심지를 태운다. 먹선 세계의 도화선이 종이 끈인 셈이다.
  - 느리고 무겁다. 숨을 참고 버티는 표정이다.
- **즉시형**은 몸에 촉발 뿔이 돋은 '다리 달린 기뢰'다.
  - 솔기가 터지기 직전으로 팽팽하다.
  - 튀는 공처럼 달려들고 닿는 순간 터진다. 들뜬 웃음을 짓는다.
- 장은 재질 오버레이, 눈, 선 성질만 바꾼다. 실루엣 변화는 25% 이하다(바이블 §8.1과 같은 문법).

### 2.2 심지형 리그 (key pose = idle)

| 부위 | 모양 | 로컬 좌표·치수 (±4단위) | 게임 1x |
|---|---|---|---|
| 주머니(몸 = 머리) | 아래가 조금 무거운 배 모양이다. 가장 넓은 곳은 y 118~126이다. 완전한 원·타원은 금지한다(먹알 적 탄과 겹친다) | x 44~156, y 58~168 | 폭 28, 높이 27.5 |
| 마개(심지 뿌리) | 장별 재질(§3). 주머니 꼭대기 가운데에 놓는다. 장마다 같은 틀 안에 들어간다 | 중심 x 100, y 46~62, 폭 22~30 | 높이 3~4 |
| 심지 | 꼰 종이 끈이다. 밑에서 앞(+x)으로 8단위 이내로 휘었다가 뒤로 돌아가는 S자다. 끝은 뒤쪽 위를 향한다(수직에서 −x 쪽으로 20~60°). **끝이 아래로 꺾인 갈고리·물음표 모양은 금지한다** | 뿌리 (100, 48), 끝 (88~98, 6~14). 마개 위 길이 34~42 | 높이 9~11. 굵기 3(먹 12단위 + 가운데 ink3 심 4단위) |
| 심지 끝 | idle·walk는 그을린 매듭(먹 원 r 6~7단위)이다. plant는 먹 불꽃이다(§2.5) | — | — |
| 다리 | 짧고 굵은 네 다리다. 가까운 앞·뒤 다리(먹)는 또렷이 떨어져 발 사이가 32단위 이상이다. 먼 다리 둘(농묵)은 10~14단위 안쪽, 2단위 위에서 살짝 보인다. 발은 boot나 hoof다. 다리끼리 붙어 받침대처럼 보이면 안 된다 | 가까운 앞다리: 엉덩이 ≈ (128,150), 발끝 ≈ (150,186). 가까운 뒷다리: 엉덩이 ≈ (70,150), 뒤꿈치 ≈ (50,186). 굵기는 엉덩이 16~18, 발목 12~14 | 다리가 보이는 높이 4.5~6.5 |
| 얼굴 | §4 | 눈 중심 ≈ (128~136, 86~96) | 눈 중심이 발 위 ≥ 20 |
| 명부·드립 | 좌상단 초승달 하나(주머니의 15% 이하). 주머니 밑 다리 사이로 드립 1~2개 | — | — |
| 금지 | 주머니 윤곽에 다른 돌기(뿔·가시·귀·꼬리)를 두지 않는다. 솟는 것은 심지 하나뿐이다 | | |
| 전체 | 칠한 맨 위 = 심지 끝 | | 몸 높이 32~33, 전체 높이 43~46, 칠한 실루엣 높이/폭 1.35~1.75 |

### 2.3 즉시형 리그 (key pose = idle, 출발선에서 웅크린 자세)

| 부위 | 모양 | 로컬 (기울기 적용 전, ±4단위) | 게임 1x |
|---|---|---|---|
| 몸 기울기 | 발 중심 (100,186)을 축으로 앞으로 10~14° 숙인다. 모든 프레임이 같다 | | |
| 주머니 | 터질 듯 팽팽한 둥근 몸이다. 면적은 심지형보다 10~20% 크다. 앞면에 이빨 웃음 노치가 있다(§4) | x 38~162, y 46~158 | 폭 31, 높이 27 |
| 촉발 뿔 | 5~6개, 장별 재질이다. 주머니 중심(≈100,102)에서 화면각 195°~345°(270° = 위) 사이 위쪽 호에만 둔다. 이웃 간격은 22~36°로 고르지 않게, 이웃 길이 차는 15% 이상으로 한다. **정수리 ±10° 안에는 두지 않는다**(심지로 읽힌다). 밑동 굵기 ≥ 10단위 | 길이 10~22 | 2.5~5.5 |
| 다리 | 긴 두 다리, 3마디(허벅지·정강이·발)다. 새처럼 뒤꿈치가 들린다. 무릎 꺾임 ≥ 35°. 발가락 2~3개(장별 claw/web). idle에서는 앞다리를 굽혀 앞으로(발끝 x 148~162), 뒷다리를 뒤로 뻗어(발끝 x 40~58) 둘 다 땅에 딛는다. 곧은 막대 다리는 금지한다(뿔로 읽힌다) | 굵기: 허벅지 14~16에서 10까지 가늘어진다 | 보이는 높이 7~10 |
| 솔기 터짐 | 등 아래쪽에 짧은 균열 1~2개. game은 ink3, art는 p300에 p50 심이다. 눈에서 24단위 이상 떨어뜨린다 | 길이 ≥ 20 | 폭 ≤ 1.5 |
| 얼굴 | §4 | 기울기 뒤 눈 중심이 발 위 ≥ 24px | |
| 명부·드립 | 좌상단 초승달 하나. 뒤아래로 끌리는 드립 1~2개 | | |
| 전체 | | | 기울기 뒤 몸 높이 33~36, 전체 높이 38~42, 칠한 실루엣 높이/폭 0.95~1.25 |

### 2.4 무엇과 갈려야 하나
- **추적자 △와**: 길고 낮은 몸, 귀, 꼬리, 등 가시가 없다. 폭탄병은 둥글고 높다(높이/폭 ≥ 0.95, 추적자는 0.43~0.57).
- **돌격수 ▶와**: 쐐기 몸과 앞으로 뻗은 뿔이 없다.
- **수문장 ■와**: 사각형이 아니다.
- **사격수 ┳와**: 가로 포신이 없다.
  - 5장 눈알 포대(삼각대 위 둥근 눈알)가 가장 가깝다.
  - 심지형은 네 짧은 다리 + 세로 심지로, 즉시형은 뿔 + 꺾인 두 다리로 가른다.
- **심지형과 즉시형끼리**:

  | 심지형 | 즉시형 |
  |---|---|
  | 가는 세로 심지 하나 | 뿔 5~6개 |
  | 매끈한 윤곽 | 이빨 노치 |
  | 짧은 다리 | 긴 다리 |
  | 꼿꼿이 선다 | 앞으로 숙인다 |

  심은 자세에서도 심지 + 불꽃 기둥이 6px 이상 남는다.
- **적 탄과**: 탄은 먹 코어 + 산호 테, 톱니는 톱니 날이다. 그래서 몸은 다리·눈·입·재질이 없는 맨 공이 되면 안 된다. 4장 뿔은 시곗바늘이다. 몸 둘레에 기어 이를 두르지 않는다(4장 보스의 톱니탄과 헷갈린다).
- **픽업과**: 밝은 마름모(경험치 옥 14~18px)나 밝은 원판(엽전 12px) 모양을 몸에 두지 않는다.
- **적중 별·처치 연출과**: 터짐은 규칙적인 별이 아니고, 안에 X·✕ 선이 없다.

### 2.5 동작

**심지형 walk 4f (뒤뚱 걸음, 8fps 권장)**

| f | 접지 | 몸 y | 스쿼시(가로×세로) | 심지 끝 변위(x, y) | 비고 |
|---|---|---|---|---|---|
| 0 | 가까운 앞 + 먼 뒤 다리를 앞으로 딛는다 | +4 | 102 × 98% | (0, +4) | minimal LOD 정지 프레임. 네 발이 모두 땅에 닿아 있다 |
| 1 | 반대쪽 다리가 지나간다(6단위 들림) | −2 | 99 × 101% | (−6, −2) | |
| 2 | 가까운 뒤 + 먼 앞 다리를 딛는다 | +4 | 102 × 98% | (0, +4) | |
| 3 | 반대쪽 다리가 지나간다 | −2 | 99 × 101% | (+6, −2) | |

- 보폭은 ±8~10단위다(`K.gait`). 속도선은 없다(느린 몸).
- 심지는 몸을 한 박자 늦게 따라 흔들린다.

**즉시형 walk 4f (튀는 공 달리기, 12fps 권장)**

| f | 이름 | 몸 y | 스쿼시 | 다리 | 덧붙임 |
|---|---|---|---|---|---|
| 0 | 착지 | +6 | 106 × 94% | 앞다리 접지(무릎 굽힘), 뒷다리는 뒤에서 땅에 닿기 직전 | minimal LOD 정지 프레임. 발이 땅에 닿는다. 뒤꿈치 뒤 담묵 먼지 1개(≤ 4px) |
| 1 | 밀기 | 0 | 98 × 103% | 앞다리를 펴서 밀고 뒷다리를 앞으로 | |
| 2 | 체공 | −12 | 96 × 105% | 두 다리를 몸 밑으로 접는다. **칠한 아래 끝이 발 선보다 1~4px 위** | ink7 속도선 2줄(몸 뒤, `K.speed` 문법). 렌더러 그림자는 땅에 남아 뛰는 느낌이 산다 |
| 3 | 뻗기 | −4 | 100 × 100% | 앞다리를 뻗어 착지를 준비하고 뒷다리를 뒤로 | |

- 뿔은 몸과 함께 움직인다(굽지 않는다).
- 보폭은 심지형의 1.4배 이상이다.

**심지형 plant 4f (심지 진행률 0·25·50·75%)**
- **공통**:
  - 웅크린다. 주머니가 12단위(3px) 내려가 y 70~176이 된다.
  - 다리는 밖으로 벌려 접는다. 발끝 폭이 idle보다 16~24단위 넓어진다.
  - 발은 y 186을 지킨다. 피벗은 그대로다.
  - 모든 프레임이 '웅크림 + 짧은 심지' 실루엣을 지킨다. minimal LOD에서 f0만 보여도 심은 자세로 읽혀야 한다.

| f | 심지 길이(마개 위) | 끝 | 몸(idle 대비) | 균열(종이 빛) | 얼굴 | 덧붙임 |
|---|---|---|---|---|---|---|
| 0 | 100% | 먹 불꽃(높이 12단위) | 104 × 94% | 없음 | 눈썹을 내리누르고 입을 꽉 다문다 | — |
| 1 | 70% | 먹 불꽃 14 | 104 × 96% | 없음 | 같음 | art만 담묵 연기 한 가닥 |
| 2 | 45% | 먹 불꽃 16 | 106 × 98% | 1줄: 뒤아래, 길이 6px 이상, p300 | 눈을 크게 뜨고 눈썹을 든다 | art 연기 |
| 3 | 20% | 먹 불꽃 18~20 | 109 × 101%: 정수리가 마개 옆으로 부푼다 | 2~3줄: 뒤아래 2 + 정수리 1, p50 심 | 눈을 가장 크게 뜨고, 꿰맨 실밥이 벌어진다 | 어깨 위 긴장 호 2줄(`K.arc`) |

- **먹 불꽃**은 바이블의 '먹 불꽃(검은 불 + 종이 심)' 문법이다.
  - 위를 향한 먹 물방울 모양이고 종이 심은 6단위(1.5px) 이하다.
  - 신호색을 쓰지 않는다.
  - art에서는 불꽃 혀 2~3개와 담묵 연기 한 가닥을 더한다.
  - game에서는 연기를 그리지 않는다. 그래야 칠한 맨 위 점이 불꽃이 된다.
- 심지 뿌리는 마개에 붙어 함께 내려간다. 짧아지면서 끝이 내려간다.

**터짐 blast (종류마다 1장, 몸은 사라지고 먹이 터진다)**

| 항목 | 심지형 | 즉시형 |
|---|---|---|
| 구름 중심 `blastCenter` | (100, 120±6) | (100, 108±6) |
| 구름 가로 반지름 | 144~156단위(36~39px ≈ 도달 100의 0.37~0.39배) | 86~96단위(21.5~24px ≈ 도달 60의 0.36~0.40배) |
| 세로 / 가로 | 0.72~0.80 | 같음 |
| 꽃잎 | 8~10개. 끝은 둥근 붓 튐이고, 이웃 길이 차 ≥ 10% | 6~8개 |
| 종이 심(종이 섬광, §12.2 active 문법) | 고르지 않은 덩어리. 반지름은 구름의 40~50%이고, 빛 쪽으로 (−8~−4, −8~−4) 치우친다. 먹 테 ≥ 12단위 | 같음 |
| 땅 튐 | (100,186)에 납작하고 들쭉날쭉한 먹 모양. 가로 = 구름 가로의 0.8~0.9배, 세로 = 그 0.26~0.32배 | 같음 |
| 파편 | 장별 재질 파편 6~9개(§3). 구름의 1.05~1.25배 거리에, 크기 10~24단위, 서로 25° 이상 떨어뜨린다 | 자기 뿔 5~6개가 날아간다 |
| 먹 방울 | 4~6개, r 6~12 | 3~5개 |
| 기하 범위 | x −110~310, y −40~290 | x −40~240, y 10~250 |

- 규칙적인 별(같은 길이 가시), X·십자 선, ✕ 눈, 신호색은 금지한다.
- `PN.vfx.kill`처럼 몸 모양으로 터지는 그림이 아니다. 처치(좋은 일)와 터짐(피해)이 한눈에 갈려야 한다.

**hit (종류마다 1장)**: idle 키 포즈의 네거티브 플래시다. 종이(p50) 실루엣에 먹 외곽을 두르고 눈은 먹으로 반전한다. 만드는 법은 k-enemies의 `filterDef` hit 모드와 `x.eyes` 겹쳐 그리기(:1515)와 같다. 심지도 실루엣에 넣는다.

## 3. 장별 재질

| 장 | 종류 | 가칭 | 몸·재질 | 마개(심지형) / 촉발 뿔(즉시형) | 눈·선 | 터짐 파편 |
|---|---|---|---|---|---|---|
| 1 먹선 골목 | 심지형 | 벽보 보따리 | 먹 주머니를 찢긴 벽보 두 장이 감쌌다(등 위 1, 앞아래 1, 합계 ≤ 18%). art는 p300 + 20/60 망점 + 인쇄 블록·줄, game은 평면 ink3 + 먹테다. 허리에 노끈 한 줄(타원 호 하나). **십자·X로 묶지 않는다** | 주름 잡아 묶은 보따리 주둥이(위가 좁은 사다리꼴 + 매듭 하나, 납작하게). 귀처럼 세우지 않는다 | 찢긴 슬릿(game은 렌즈). 거친 번짐 + 먹 튐(art) | 찢긴 벽보 조각 |
| | 즉시형 | 구김 먹공 | 먹에 젖어 구겨진 벽보 뭉치다. 구김 주름 2~3줄(ink5, game ≤ 1.5px) | 구겨진 종이 모서리 5~6개(세모, 끝이 살짝 찢김). 두 개는 뒷면이 보여 ink3이다 | 같음 | 구겨진 종이 조각 |
| 2 철문 예배당 | 심지형 | 무쇠 등잔 | 어깨가 살짝 각진 무쇠 단지다. 허리에 리벳 쇠테 한 줄(ink7 띠 + 윗변 ink5 1px). 리벳은 먹 점 3~4개를 고르지 않은 간격으로 둔다 | 짧은 쇠 주둥이(위가 넓은 원통 + 입술 턱 1) | 열쇠 구멍. 철선묘(art도 오프셋 없는 균일 선) | 휜 쇠테 조각, 리벳, 쇳조각 |
| | 즉시형 | 리벳 성수통 | 쇠테 사이가 부푼 무쇠 단지다 | 리벳 기둥 5~6개(기둥 굵기 2.5~3px, 둥근 머리 r 1.8px), 곧 촉발 기뢰의 뿔이다. 끊겨 들린 쇠테 끝 하나를 뿔 하나로 센다 | 같음 | 리벳, 쇠테 조각 |
| 3 무채 운하 | 심지형 | 젖은 옹기 | 입이 좁고 배가 부른 옹기다. 몸 높이 55~65%에 물높이 선(ink5) 한 줄을 긋고, 그 아래 젖은 면은 env.deep 12% 이하다. 이끼 무리 하나(env.deep). 드립 +1(art 3, game 2) | 넓은 코르크 마개(env.deep + 먹테) | 기포(두 겹 고리). 습윤 번짐(세로 흐름) | 옹기 조각, 코르크, 먹 물방울 |
| | 즉시형 | 먹 복어 | 다리 둘 달린, 부푼 먹 복어다. 꼬리지느러미가 작다(뒤, ≤ 4px) | 복어 가시 5~6개. 가늘고 끝이 둥글며 밑동 ≥ 2.5px다 | 같음 | 가시, 먹 물방울 |
| 4 시계 무덤 | 심지형 | 태엽 통 | 황동 태엽 통이다. 10~12각 다각 윤곽에 miter 이음이다. 허리에 새김 띠 한 줄(ink5). 황동 면은 env.deep 15% 이하다 | 태엽 꼭지(용두): 위가 넓은 짧은 사다리꼴. **눈금을 넣지 않는다**(같은 간격 세로줄은 'III'로 읽힌다) | 문자판(바늘 = 동공). 기계선(miter, 다각) | 바늘, 태엽 열쇠 1개, 작은 톱니 조각 2개 이하 |
| | 즉시형 | 바늘 터진 시계알 | 금 간 둥근 시계 통이다 | 튀어나온 시곗바늘 5~6개. 시침은 짧고 굵게, 분침은 길게, 초침은 가늘게 하되 초침도 밑동 ≥ 2.5px다. 뿌리에 작은 균형추 혹(r 1.2px)을 단다 | 같음 | 바늘 |
| 5 일식 관문 | 심지형 | 흑요 구슬 | 흑요 면을 3~4개로 나눈다(ink5·ink7). 면 경계선이 얼굴을 지나지 않게 한다. 뒤아래에 초승 투명 구멍(몸의 12% 이하, 먹테 3px, art는 20/60 망점 번짐)을 뚫는다. 바이블의 5장 구멍 규칙이다 | 일식 고리 목: 옆에서 본 납작한 고리. 폭 28~32단위, 두께 8단위이고, 좌상에 종이 초승 하이라이트 1px 이하를 하나 둔다 | 일식 고리(초승 테, K5-E1). 지워진 흑요(art 미세 갉기 + 면) | 흑요 파편, 먹테 두른 ink7 초승 조각 |
| | 즉시형 | 파편 일식알 | 같은 흑요 몸에 초승 구멍이 있다 | 흑요 파편 5~6개(각진 사각, 한 면 ink5, 끝이 날카롭고 밑동 ≥ 2.5px) | 같음 | 흑요 파편 |

**장별 주의**
- 1장: 마개를 둥근 갓처럼 만들지 않는다(1장 사격수의 등롱 머리와 겹친다).
- 2장: 초·촛대·향로 구멍 모티프를 쓰지 않는다(2장 사격수·돌격수와 겹친다). 스테인드 조각을 몸에 쓰지 않는다(스팟색).
- 3장: 어떤 물 표현에도 청록을 쓰지 않는다(§5.2). 젖은 하이라이트를 눈 옆에 두지 않는다(K5-E2).
- 4장: 기어 이를 두르지 않는다. 황동은 큰 면에만 쓰고 링 모양으로 쓰지 않는다(호박과 가깝다).
- 5장: 구멍을 종이로 칠하지 않는다. 흰 초승 획은 고리 하이라이트 하나뿐이다.
- 가칭 이름은 API 문서에만 적는다. 화면 문구가 아니다(열린 질문 Q5).

## 4. 얼굴 (입체파 실수를 피하는 법)

**시점**
- **옆모습 한 시점**으로 그린다. 오른쪽(+x)을 보고, 3/4 부감은 좌상단 명부로만 보여 준다.
- 주머니가 곧 머리다. 코와 귀는 없다.
- **눈은 가까운 쪽 하나만 그린다(game과 art 모두).**
  - 정면 두 눈을 옆모습 몸에 올리지 않는다.
  - 몸 가운데에 정면 미소 곡선을 그리지 않는다.

**눈**
- 앞 위 사분면에 두고, 윤곽에서 6단위 이상 안쪽에 넣는다.
- 장별 `K.eye`를 그대로 쓴다. 새 눈 모양을 만들지 않는다.
- 크기: 심지형 game s 11 / art s 10, 즉시형 game s 12 / art s 11.
- 1장 슬릿은 구 표면을 따라 앞이 조금 높게(−8~−15°) 기울인다. 동공은 +x 쪽을 본다.

**표정**은 눈 위의 먹 조각과 입으로만 만든다:

| | 심지형 | 즉시형 |
|---|---|---|
| 눈 위 | 앞쪽으로 내리누른 굵은 눈썹 쐐기(완고함) | 눈썹이 없거나, 위로 치켜뜬 가는 호(art) |
| 입 | 아래 앞 윤곽과 나란히 굽은 **꿰맨 입**. 앞 윤곽에 닿고, 1x 길이 6~8px, 실밥 3개(`K.stitch`) | 앞 윤곽에 3~4px 깊이로 파인 **이빨 웃음 노치**. 위 이빨 3~4개, 아래 2~3개(`K.teeth`). 노치는 단색 실루엣에서도 입으로 읽혀야 한다 |

**그림자**
- 명부는 좌상단 초승달 덩어리 하나다. 눈·입과 6단위 이상 떨어뜨린다.
- 4·5장의 면 경계, 균열, 벽보 가장자리를 얼굴로 지나가게 하지 않는다. 얼굴이 두 면으로 쪼개져 보이는 것이 R4 얼굴 리뷰가 지적한 실수다.
- 스쿼시(plant·walk)에서는 눈과 입이 구 표면과 함께 움직인다. 표면 위를 미끄러지지 않는다.

**크기별로 남길 것**

| 크기 | 남길 것 | 뺄 것 |
|---|---|---|
| game 1x (눈 ≈ 5~6px) | 흰 눈(≥ 3×2px)과 1px 먹 동공. 심지형 눈썹 쐐기. 즉시형 입 노치와 이빨 2~3개. 심지형 실밥 최대 3 | 눈꺼풀 선, 눈 옆 하이라이트 점(세 번째 눈으로 읽힌다) |
| art (C3·C9, 4배 이상) | 위 전부 + 아래 눈꺼풀 ink5 선, 눈 안 동공 하이라이트 1, 실밥 3~4, 입꼬리 주름 1, 심은 자세의 볼 부풂 | — |

## 5. LOD
- **`game`**: 인게임 1x 전용 재드로잉이다(§1.8의 game 규칙). 축소본이 아니다.
- **`art`**: 쇼케이스·도감·이야기 패널용이다. 같은 리그에 재질 디테일, 망점, 붓 외곽을 더한다. 모든 상태를 `art`로도 그린다.
- **실행 중 LOD**(렌더러, 바이블 §13·FX-01):

  | LOD | 렌더러 동작 | 그림 쪽 조건 |
  |---|---|---|
  | full | 모든 프레임 | — |
  | reduced | walk를 절반 fps로 | — |
  | minimal | walk f0 정지 | walk f0이 실루엣 규칙을 모두 만족하는 접지 프레임이어야 한다 |
- 명부, 헤일로, 흰 눈은 모든 LOD에서 남는다.
- 심은 자세 프레임은 카운트다운 정보이므로 minimal에서도 진행률로 고르기를 권한다(§9).
- 감소 모션은 프레임 애니메이션을 유지한다. 감소 플래시에서는 렌더러가 hit 대신 이동 포즈를 쓰고, 터짐 프레임을 α0.5로 그리기를 권한다(§9).

## 6. 참고할 기존 그림과 피할 것

**참고할 것**: `art/concept-kit/k-enemies.js`

| 무엇 | 위치 |
|---|---|
| 컨텍스트 | `K.ctx` :79-125 |
| 장별 눈 | `K.eye` :129-159 |
| 4장 톱니(마개 장식에만, 윤곽 금지) | `K.gear` :169-176 |
| 5장 구멍 | `K.crescent` :185-195, `K.holed` :199-208, `K.nibble` :210-218 |
| 다리 | `K.ik` :235-240, `K.limbD` :256-274, `K.legGeo` :281-286, `K.gait` :300-305 |
| 속도선·먼지·긴장 호 | `K.speed` :318-319, `K.puffs` :321, `K.arc` :323-332 |
| 이빨·꿰맨 입·드립 | `K.teeth` :334-338, `K.stitch` :340-349, `K.drips` :351 |
| 1장 벽보 | `S.scrap` :446-449, `S.poster` :459-464, 1장 들개 :468- |
| 헤일로·hit·실루엣 필터 | `filterDef` :1422-1442 |
| 상태 처리 | `E.draw` :1485-1521 |
| meta 목록 | `E.list` :1524-1535 |

- 장별 선 성질: 1장 들개(거친 번짐), 2장 쥐(철선묘), 3장 장어(습윤·드립), 4장 벌레(기계선·문자판 눈), 5장 여우(초승 구멍).
- 처치 연출 `PN.vfx.kill`(k-icons.js)은 닮지 말아야 할 대상으로 본다.

**피할 것**
- 맨 먹 공(적 탄)
- 규칙적인 방사 뿔(바이러스 아이콘), 규칙적인 별 모양 터짐
- 아래로 꺾인 갈고리 심지, 곧은 막대 다리, 네 다리가 붙은 받침대
- 귀·꼬리·등 가시(추적자)
- 1장 등롱 갓, 2장 촛대·향로, 4장 기어 이 윤곽
- 큰 종이 면
- 신호색
- 그룹 rotate로 기울인 몸: 금지는 아니다. 다만 C4·C7은 칠한 영역 표본으로 재므로 상관없다.

## 7. 합격 기준

### 7.1 구별 시험

**T1 · 32px 흑백 (C4)**
- 각 장 한 줄에 실루엣 9개를 놓는다: 추적자, 돌격수, 사격수, 수문장, 심지 idle, 즉시 idle, 심지 walk1, 즉시 walk2, 심지 plant3. 모두 순흑이고 최대 변 32px이다.
- 합격 조건:
  - (a) 다섯 줄 모두에서 폭탄병 다섯 칸이 역할 네 칸의 어느 것으로도 읽히지 않는다.
  - (b) 모든 쌍에서 심지형과 즉시형이 갈린다.
  - (c) 다섯 장의 심지형이 한 종으로, 다섯 장의 즉시형이 한 종으로 읽힌다.
  - (d) C7 보조 수치가 맞는다: 칠한 실루엣 높이/폭이 심지형 1.35~1.75, 즉시형 0.95~1.25다. 심지형 심지 기둥은 실루엣 높이의 20% 이상이다.

**T2 · 1x 흑백 장면 (C5 회색판)**
- 장마다 추적자 5, 돌격수·사격수·수문장 각 1, 결 1, 폭탄병 5(심지 3, 즉시 2)를 둔다. 렌더러 표식은 그리지 않는다.
- 1배와 0.8배로 그린다.
- 합격 조건: 검수자가 폭탄병 다섯을 모두 찾고 종류를 맞힌다. 추적자를 폭탄병으로 착각하지 않는다.

**T3 · 정식 0.3초 시험(§14, n ≥ 8)**: 통합 뒤에 팀이 한다(열린 질문 Q1).

### 7.2 명령
- 장마다 돌리는 명령은 `ch=1`과 `--name`의 `ch1`을 2~5로 바꿔 다섯 번 돌린다.
- 결과 PNG는 Read로 직접 연다.
- `--check`를 붙인 모든 렌더가 `ok`이고 kit error가 0건이어야 한다.

**C1 모든 호출 검사**: 10 프로필 × 두 LOD × 모든 상태·프레임 + 실루엣 + 반전·히트박스. `ok`여야 한다.
```
node scripts/art-review-sheet.mjs expr --name k7-c1-all --scale 0.25 --check --expr '(function(){var B=PN.bombers,s="",n=0;function put(m){s+="<g transform=\"translate("+(n%40)*300+","+Math.floor(n/40)*320+")\">"+m+"</g>";n++;}for(var ch=1;ch<=5;ch++){["fuse","burst"].forEach(function(k){var m=B.meta(ch,k);["art","game"].forEach(function(l){Object.keys(m.states).forEach(function(st){for(var f=0;f<m.states[st];f++)put(B.draw(ch,k,{lod:l,state:st,frame:f}));});put(B.draw(ch,k,{lod:l,silhouette:true})+B.draw(ch,k,{lod:l,state:"walk",frame:1,flip:true,hitbox:true,shadow:true,halo:false}));});});}return s;})()'
```

**C2 game 시트, 게임 크기의 2배.** 장마다 한 줄이고 바탕은 장 지면색이다. 산호 점선은 발 선이고 리뷰에만 쓰인다. 확대해 보려면 `--scale 1`로도 돌린다.
```
node scripts/art-review-sheet.mjs expr --name k7-c2-game --scale 0.5 --check --crop 0,0,3520,1150 --expr '(function(){var B=PN.bombers,G={1:"#B8AC93",2:"#ABADB4",3:"#ADB4AA",4:"#BBAE94",5:"#ABA5AC"},L=[["fuse","idle",0],["fuse","walk",0],["fuse","walk",1],["fuse","walk",2],["fuse","walk",3],["fuse","plant",0],["fuse","plant",1],["fuse","plant",2],["fuse","plant",3],["fuse","hit",0],["burst","idle",0],["burst","walk",0],["burst","walk",1],["burst","walk",2],["burst","walk",3],["burst","hit",0]],s="";for(var ch=1;ch<=5;ch++){var y=(ch-1)*230;s+="<rect x=\"0\" y=\""+y+"\" width=\"3520\" height=\"230\" fill=\""+G[ch]+"\"/>";L.forEach(function(q,i){var m=B.meta(ch,q[0]);s+="<g transform=\"translate("+(i*220+10)+","+(y+215-m.feet[1])+")\">"+B.draw(ch,q[0],{lod:"game",state:q[1],frame:q[2],hitbox:true,shadow:true})+"<path d=\"M0,"+m.feet[1]+" H200\" stroke=\"#ef5b4f\" stroke-width=\"1.5\" stroke-dasharray=\"6 4\"/></g>";});}return s;})()'
```
합격 조건:
- §2.2~§2.5의 치수와 프레임 표대로 그려졌다.
- 발이 점선에 닿는다. 즉시형 walk2만 뜬다.
- 피벗 십자가 판정 원 중심이다.
- 심은 자세가 차례로 짧아지고 부푼다.

**C3 art 시트(장마다)**: 재질, 붓선, 망점, 장별 선 성질을 본다.
```
node scripts/art-review-sheet.mjs expr --name k7-c3-ch1-art --scale 1.2 --check --crop 0,0,2200,460 --expr '(function(){var B=PN.bombers,ch=1,G={1:"#B8AC93",2:"#ABADB4",3:"#ADB4AA",4:"#BBAE94",5:"#ABA5AC"}[ch],R=[[["fuse","idle",0],["fuse","walk",0],["fuse","walk",1],["fuse","walk",2],["fuse","walk",3],["fuse","plant",0],["fuse","plant",1],["fuse","plant",2],["fuse","plant",3],["fuse","hit",0]],[["burst","idle",0],["burst","walk",0],["burst","walk",1],["burst","walk",2],["burst","walk",3],["burst","hit",0]]],s="<rect x=\"0\" y=\"0\" width=\"2200\" height=\"460\" fill=\""+G+"\"/>";R.forEach(function(row,j){row.forEach(function(q,i){var m=B.meta(ch,q[0]);s+="<g transform=\"translate("+(i*220+10)+","+(j*230+215-m.feet[1])+")\">"+B.draw(ch,q[0],{lod:"art",state:q[1],frame:q[2]})+"</g>";});});return s;})()'
```

**C4 32px 흑백 (T1)**: 칠한 영역 표본으로 크기를 맞춘다. 실제 크기는 `--scale 1`, 확대는 `--scale 3`으로 두 번 돌린다.
```
node scripts/art-review-sheet.mjs expr --name k7-c4-sil32 --scale 1 --crop 0,0,440,248 --expr '(function(){var B=PN.bombers,NS="http://www.w3.org/2000/svg";function pb(m){var svg=document.createElementNS(NS,"svg");svg.setAttribute("width","230");svg.setAttribute("height","230");svg.setAttribute("viewBox","-15 -15 230 230");svg.style.position="fixed";svg.style.left="0px";svg.style.top="0px";svg.innerHTML=m;document.body.appendChild(svg);var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(var y=0.5;y<230;y+=1){for(var x=0.5;x<230;x+=1){var el=document.elementFromPoint(x,y);if(!el||el===svg||!svg.contains(el))continue;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}svg.remove();return {x:x0-15.5,y:y0-15.5,width:x1-x0+1,height:y1-y0+1};}var O={silhouette:true,lod:"game",halo:false,shadow:false},out="<rect x=\"0\" y=\"0\" width=\"440\" height=\"248\" fill=\"#f4f4ef\"/>";for(var ch=1;ch<=5;ch++){var L=["stalker","charger","shooter","warden"].map(function(r){return PN.enemies.draw(ch,r,O);});[["fuse","idle",0],["burst","idle",0],["fuse","walk",1],["burst","walk",2],["fuse","plant",3]].forEach(function(q){L.push(B.draw(ch,q[0],{silhouette:true,lod:"game",halo:false,shadow:false,state:q[1],frame:q[2]}));});L.forEach(function(m,i){var b=pb(m),k=32/Math.max(b.width,b.height);out+="<g transform=\"translate("+(8+i*48-b.x*k)+","+(8+(ch-1)*48-b.y*k)+") scale("+k+")\">"+m+"</g>";});}return out;})()'
```

**C5 1x 무리 장면 (T2, 장마다)**
- `--scale 1`(실제 크기), `--scale 0.8`(1024×720 화면), `--scale 3`(확대)으로 돌린다.
- 흑백판은 끝의 `return s;`를 `return "<defs><filter id=\"k7gs\"><feColorMatrix type=\"saturate\" values=\"0\"/></filter></defs><g filter=\"url(#k7gs)\">"+s+"</g>";`로 바꾼다. 이름은 `-gray`로 하고 `--check` 없이 돌린다(고정 id라서).
```
node scripts/art-review-sheet.mjs expr --name k7-c5-ch1-crowd --scale 1 --check --crop 0,0,420,240 --expr '(function(){var B=PN.bombers,ch=1,s=PN.env.ground(ch,420,240,3,{center:null,canalY:false,rose:null,ringC:null});function put(m,mk,x,y,fl){var k=m.displayScale;return "<g transform=\"translate("+(fl?x+m.feet[0]*k:x-m.feet[0]*k)+","+(y-m.feet[1]*k)+") scale("+(fl?-k:k)+","+k+")\">"+mk+"</g>";}function sh(x,y,r){return "<ellipse cx=\""+x+"\" cy=\""+y+"\" rx=\""+r+"\" ry=\""+(r*0.42)+"\" fill=\"#101312\" opacity=\"0.3\"/>";}function en(r,x,y,fl,f){var m=PN.enemies.meta(ch,r),k={stalker:0.9,charger:0.963,shooter:0.783,warden:1}[r];return sh(x,y,m.r)+put({feet:m.feet,displayScale:m.displayScale*k},PN.enemies.draw(ch,r,{lod:"game",frame:f}),x,y,fl);}function bo(kind,x,y,fl,st,f){return sh(x,y,12)+put(B.meta(ch,kind),B.draw(ch,kind,{lod:"game",state:st,frame:f}),x,y,fl);}s+=en("stalker",50,60,false,0)+en("stalker",110,48,true,1)+en("warden",60,150,false,1)+bo("fuse",175,80,false,"walk",0)+en("stalker",240,62,true,2)+bo("burst",300,95,true,"walk",1)+en("charger",360,70,true,2)+en("shooter",150,205,false,0)+bo("fuse",245,150,true,"plant",1)+en("stalker",330,175,false,3)+bo("burst",395,215,true,"walk",3)+en("stalker",95,225,false,1)+bo("fuse",30,110,false,"idle",0);s+=PN.heroKit.placeSprite("run",2,200,190,1);return s;})()'
```
합격 조건: T2를 통과한다. 결이 가장 밝다. 폭탄병이 바닥이나 다른 먹귀와 한 덩어리로 뭉치지 않는다.

**C6 신호색·글자 0**: 출력이 `signal=0 text=0`이어야 한다.
```
node scripts/art-review-sheet.mjs expr --name k7-c6-scan --scale 1 --crop 0,0,1200,40 --expr '(function(){var B=PN.bombers,R=/#(00a8c6|007c94|cff6ff|ef5b4f|b8352b|ffe4df|d88d16|fff0c9|86b82d|dff5a5|805ad5|ddd1f5)/gi,sig=0,txt=0,bad=[];for(var ch=1;ch<=5;ch++){["fuse","burst"].forEach(function(k){var m=B.meta(ch,k);["art","game"].forEach(function(l){var all="";Object.keys(m.states).forEach(function(st){for(var f=0;f<m.states[st];f++)all+=B.draw(ch,k,{lod:l,state:st,frame:f});});all+=B.draw(ch,k,{lod:l,silhouette:true});var a=(all.match(R)||[]).length,t=(all.match(/<text/g)||[]).length;sig+=a;txt+=t;if(a||t)bad.push(ch+k+"-"+l+":"+a+"/"+t);});});}return "<rect width=\"1200\" height=\"40\" fill=\"#fff\"/><text x=\"4\" y=\"26\" font-size=\"15\" font-family=\"monospace\">signal="+sig+" text="+txt+" "+bad.join(" ")+"</text>";})()'
```

**C7 meta·경계·앵커**: 칠한 영역 표본으로 잰다. 10줄이 모두 `ok`이고, 마지막 줄이 `invalid calls ok`여야 한다.

검사하는 것:

| 항목 | 기준 |
|---|---|
| 몸 높이 | 32~36px |
| 폭 | ≤ 36px |
| 눈 높이 | 심지형 ≥ 20px, 즉시형 ≥ 24px |
| 높이/폭 | 심지형 1.35~1.75, 즉시형 0.95~1.25 |
| 심지 기둥 | 실루엣 높이의 20% 이상 |
| 발 | 칠한 아래 끝 − 발 = −4~+7단위. 즉시형 walk2만 −16~−4 |
| 심지형 맨 위 점 | 심지 끝에서 12단위 안(plant는 26). x는 ±12 |
| 장별 심지 좌표 | 1장과 ±2 |
| pad | 칠한 범위가 박스 + pad + 24 안 |
| 잘못된 호출 | `<g/>` |

```
node scripts/art-review-sheet.mjs expr --name k7-c7-meta --scale 1 --crop 0,0,1800,260 --expr '(function(){var B=PN.bombers,NS="http://www.w3.org/2000/svg";function pb(markup,big){var vb=big?[-130,-60,460,460]:[-10,-10,220,220],px=220,q=vb[2]/px,svg=document.createElementNS(NS,"svg");svg.setAttribute("width",px);svg.setAttribute("height",px);svg.setAttribute("viewBox",vb.join(" "));svg.style.position="fixed";svg.style.left="0px";svg.style.top="0px";svg.innerHTML=markup;document.body.appendChild(svg);var b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9,tx:0};for(var y=0.5;y<px;y+=1){for(var x=0.5;x<px;x+=1){var el=document.elementFromPoint(x,y);if(!el||el===svg||!svg.contains(el))continue;var X=vb[0]+x*q,Y=vb[1]+y*q;if(Y<b.y0){b.y0=Y;b.tx=X;}if(X<b.x0)b.x0=X;if(X>b.x1)b.x1=X;if(Y>b.y1)b.y1=Y;}}svg.remove();return b;}var L=[],W1=B.meta(1,"fuse").wick,inv=[B.draw(6,"fuse",{}),B.draw(1,"burst",{state:"plant"}),B.draw(1,"nope",{}),B.draw(1,"fuse",{state:"dance"})].every(function(t){return /^<g\s*\/>$/.test(t);});for(var ch=1;ch<=5;ch++){["fuse","burst"].forEach(function(k){var m=B.meta(ch,k),u=m.unitsPerPx,bad=[],bodyH=(m.feet[1]-m.head[1])/u,eyeH=(m.feet[1]-m.eye[1])/u,s=pb(B.draw(ch,k,{lod:"game",silhouette:true,halo:false,shadow:false})),asp=(s.y1-s.y0)/(s.x1-s.x0);if(bodyH<32||bodyH>36)bad.push("body");if(m.displayPx[0]>36)bad.push("width");if(eyeH<(k==="fuse"?20:24))bad.push("eye");if(k==="fuse"?(asp<1.35||asp>1.75):(asp<0.95||asp>1.25))bad.push("aspect");if(k==="fuse"&&(m.head[1]-s.y0)/(s.y1-s.y0)<0.2)bad.push("wick short");Object.keys(m.states).forEach(function(st){for(var f=0;f<m.states[st];f++){var big=st==="blast",b=pb(B.draw(ch,k,{lod:"game",state:st,frame:f,halo:false,shadow:false}),big),d=b.y1-m.feet[1],p=m.pad[st];if(!big){var air=k==="burst"&&st==="walk"&&f===2;if(air?(d<-16||d>-4):(d<-4||d>7))bad.push(st+f+" foot "+d.toFixed(1));}if(k==="fuse"&&!big){var w=m.wick[st][f],w1=W1[st][f],lim=st==="plant"?26:12;if(b.y0<w[1]-lim||b.y0>w[1]||Math.abs(b.tx-w[0])>12)bad.push(st+f+" top");if(Math.abs(w[0]-w1[0])>2||Math.abs(w[1]-w1[1])>2)bad.push(st+f+" wick!=ch1");}if(b.x0<-p[3]-24||b.y0<-p[0]-24||b.x1>m.box[0]+p[1]+24||b.y1>m.box[1]+p[2]+24)bad.push(st+f+" pad");}});L.push("ch"+ch+" "+k+" body="+bodyH.toFixed(1)+"px w="+m.displayPx[0]+"px eye="+eyeH.toFixed(1)+"px aspect="+asp.toFixed(2)+" "+(bad.length?"FAIL "+bad.join(", "):"ok"));});}L.push("invalid calls "+(inv?"ok":"FAIL"));return "<rect width=\"1800\" height=\"260\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(20+i*22)+"\" font-size=\"14\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

**C8 바뀌면 안 되는 출력**
- 작업 전에 한 번 돌려 기준값이 나오는지 확인한다. 다르면 멈추고 보고한다.
- 납품 전에 다시 돌린다.
- 반드시 `enemy-all=kubxcy len=5226045 list=20 roles=stalker,charger,shooter,warden draw=stalker,charger,shooter,warden`이 나와야 한다.
```
node scripts/art-review-sheet.mjs expr --name k7-c8-unchanged --scale 1 --crop 0,0,1300,40 --expr '(function(){function norm(m){return m.replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")+)(\s*\/?)>/g,function(t,n,a,e){var s={},k=a.replace(/\s+([\w:-]+)="[^"]*"/g,function(x,key){if(s[key])return "";s[key]=1;return x;});return "<"+n+k+e+">";}).replace(/\s+(\/?>)/g,"$1").replace(/ke\d+_/g,"ke_");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}var N=PN.enemies,B="";for(var ch=1;ch<=5;ch++){N.roles.forEach(function(r){var m=N.meta(ch,r);["art","game"].forEach(function(l){["idle","windup","hit"].forEach(function(st){B+=norm(N.draw(ch,r,{lod:l,state:st}));});for(var f=0;f<m.frames;f++)B+=norm(N.draw(ch,r,{lod:l,state:"idle",frame:f}));B+=norm(N.draw(ch,r,{lod:l,silhouette:true}))+norm(N.draw(ch,r,{lod:l,elite:true}));});});}var K=N._K;return "<rect width=\"1300\" height=\"40\" fill=\"#fff\"/><text x=\"4\" y=\"26\" font-size=\"16\" font-family=\"monospace\">enemy-all="+h(B)+" len="+B.length+" list="+N.list.length+" roles="+Object.keys(K.ROLE).join(",")+" draw="+Object.keys(K.DRAW).join(",")+"</text>";})()'
```

**C9 얼굴(장마다)**: 눈을 중심에 둔 120×100단위 창 네 개를 나란히 놓는다(심지 art, 심지 game, 즉시 art, 즉시 game). 게임 1px = 16 이미지 px다.
```
node scripts/art-review-sheet.mjs expr --name k7-c9-ch1-face --scale 4 --check --crop 0,0,510,100 --expr '(function(){var B=PN.bombers,ch=1,s="<rect x=\"0\" y=\"0\" width=\"510\" height=\"100\" fill=\""+{1:"#B8AC93",2:"#ABADB4",3:"#ADB4AA",4:"#BBAE94",5:"#ABA5AC"}[ch]+"\"/>";[["fuse","art"],["fuse","game"],["burst","art"],["burst","game"]].forEach(function(q,i){var e=B.meta(ch,q[0]).eye;s+="<svg x=\""+(i*130)+"\" y=\"0\" width=\"120\" height=\"100\" viewBox=\""+(e[0]-60)+" "+(e[1]-50)+" 120 100\">"+B.draw(ch,q[0],{lod:q[1]})+"</svg>";});return s;})()'
```
합격 조건:
- §4의 한 시점 규칙을 지킨다: 눈 하나, 입이 앞 윤곽에 닿음, 명부와 면 경계가 얼굴을 가르지 않음.
- 눈이 장별 모양이다.
- game 눈이 3×2px 이상이다(이 렌더에서 48×32 이미지 px 이상).

**C10a 렌더러 표식과의 관계(장마다)**
- 왼쪽부터 네 칸이다:
  1. 심지형 walk1 + 지금 규칙대로 그린 불꽃 점(그림 맨 위 − 15px)
  2. 같은 몸 + 심지 끝 앵커에 그린 불꽃 점(제안 R1)
  3. 즉시형 walk0 + 겹 고리
  4. 즉시형 walk2 + 겹 고리(박동 최대)
```
node scripts/art-review-sheet.mjs expr --name k7-c10a-ch1-marks --scale 4 --check --crop 0,0,360,150 --expr '(function(){var B=PN.bombers,ch=1,s=PN.env.ground(ch,360,150,3,{center:null,canalY:false,rose:null,ringC:null});function put(k,o,x,y){var m=B.meta(ch,k),d=m.displayScale;return "<ellipse cx=\""+x+"\" cy=\""+y+"\" rx=\"12\" ry=\"5\" fill=\"#101312\" opacity=\"0.3\"/><g transform=\"translate("+(x-m.feet[0]*d)+","+(y-m.feet[1]*d)+") scale("+d+")\">"+B.draw(ch,k,o)+"</g>";}function c(x,y,r,col,w,dash,fill){return "<circle cx=\""+x+"\" cy=\""+y+"\" r=\""+r+"\" fill=\""+(fill||"none")+"\" stroke=\""+(fill?"none":col)+"\" stroke-width=\""+w+"\""+(dash?" stroke-dasharray=\"5 4\"":"")+"/>";}var m=B.meta(ch,"fuse"),d=m.displayScale,w=m.wick.walk[1];s+=put("fuse",{lod:"game",state:"walk",frame:1},70,110)+c(70,110,17,"#d88d16",2.5,true)+c(70,110-(m.feet[1]-w[1]+8)*d-15,4,"",0,false,"#d88d16");s+=put("fuse",{lod:"game",state:"walk",frame:1},160,110)+c(160,110,17,"#d88d16",2.5,true)+c(160+(w[0]-m.feet[0])*d,110-(m.feet[1]-w[1])*d,4,"",0,false,"#d88d16");s+=put("burst",{lod:"game",state:"walk",frame:0},250,110)+c(250,110,16,"#ef5b4f",2.5)+c(250,110,22.5,"#ef5b4f",2.5);s+=put("burst",{lod:"game",state:"walk",frame:2},320,110)+c(320,110,16,"#ef5b4f",2.5)+c(320,110,24,"#ef5b4f",2.5);return s;})()'
```
합격 조건:
- 첫 칸의 점이 심지 끝과 같은 세로줄에 있다(±3px).
- 둘째 칸의 점이 심지 끝에 앉는다.
- 셋째·넷째 칸에서 고리가 눈을 가로지르지 않는다. 첫 칸 고리도 마찬가지다.

**C10b 심은 자세와 터짐(장마다)**
- 화면 구성은 다음과 같다:
  - 왼쪽: 진행 60%인 호박 원 안의 plant f2와, 그 옆에 선 결
  - 위: plant f0~f3 차례
  - 오른쪽: 터짐 두 장과 렌더러의 도달 산호 링(100, 60)
```
node scripts/art-review-sheet.mjs expr --name k7-c10b-ch1-plant-blast --scale 2 --check --crop 0,0,760,260 --expr '(function(){var B=PN.bombers,ch=1,s=PN.env.ground(ch,760,260,3,{center:null,canalY:false,rose:null,ringC:null});function put(k,o,x,y){var m=B.meta(ch,k),d=m.displayScale;return "<g transform=\"translate("+(x-m.feet[0]*d)+","+(y-m.feet[1]*d)+") scale("+d+")\">"+B.draw(ch,k,o)+"</g>";}function ring(x,y,r,c,w,a,fill){return "<circle cx=\""+x+"\" cy=\""+y+"\" r=\""+r+"\" fill=\""+(fill?c:"none")+"\" stroke=\""+(fill?"none":c)+"\" stroke-width=\""+w+"\" opacity=\""+a+"\"/>";}s+=ring(110,140,100,"#d88d16",0,0.12,true)+ring(110,140,62,"#d88d16",0,0.28,true)+ring(110,140,100,"#d88d16",3,0.9,false)+"<ellipse cx=\"110\" cy=\"140\" rx=\"12\" ry=\"5\" fill=\"#101312\" opacity=\"0.3\"/>"+put("fuse",{lod:"game",state:"plant",frame:2},110,140)+PN.heroKit.placeSprite("idle",0,196,170,1);for(var f=0;f<4;f++)s+=put("fuse",{lod:"game",state:"plant",frame:f},250+f*44,60);s+=put("fuse",{lod:"game",state:"blast"},460,150)+ring(460,150,100,"#ef5b4f",4,0.8,false)+put("burst",{lod:"game",state:"blast"},655,150)+ring(655,150,60,"#ef5b4f",4,0.8,false);return s;})()'
```
합격 조건:
- 호박 원 아래에서도 '웅크려 타는 폭탄'으로 읽힌다.
- f0→f3이 카운트다운으로 읽힌다(심지, 불꽃, 부풂, 균열).
- 터짐 구름이 도달 링의 약 0.38배이고 심지형 쪽이 분명히 크다.
- 처치 연출(`b1-kill-ref-x3`)이나 규칙적인 별로 보이지 않는다.

**C11** `node scripts/art-review-sheet.mjs enemies --check`: 40장 모두 ok여야 한다. 새 모듈을 읽어도 먹귀가 깨지지 않는다는 확인이다.

**C12 명부·면적 (§1.8)**: 10줄이 모두 `ok`여야 한다. 5장은 마스크 구멍이 몸 면적에 잡히는 점을 감안한다.
```
node scripts/art-review-sheet.mjs expr --name k7-c12-area --scale 1 --crop 0,0,1700,260 --expr '(function(){var B=PN.bombers,NS="http://www.w3.org/2000/svg";function hex(c){if(!c||c==="none")return "none";if(c.indexOf("url")>=0)return "url";var m=c.match(/[\d.]+/g);return "#"+m.slice(0,3).map(function(v){return ("0"+Math.round(+v).toString(16)).slice(-2);}).join("");}var CAT={"#121110":"ink","#101312":"ink","#2b2926":"ink","#343936":"ink","#46423d":"mid","#8c8579":"pale","#bcb4a5":"pale","#faf6ec":"paper","#f3eee2":"paper","#d8d0c0":"paper","#fffff8":"paper","#f4f4ef":"paper","#d8dad3":"paper","#8f836c":"deep","#878a93":"deep","#8a9288":"deep","#978a70":"deep","#8a848c":"deep"};function area(markup,vb){var svg=document.createElementNS(NS,"svg");svg.setAttribute("width","220");svg.setAttribute("height","220");svg.setAttribute("viewBox",vb);svg.style.position="fixed";svg.style.left="0px";svg.style.top="0px";svg.innerHTML=markup;document.body.appendChild(svg);var n={ink:0,mid:0,pale:0,deep:0,paper:0},o={},tot=0;for(var y=0.5;y<220;y+=1){for(var x=0.5;x<220;x+=1){var el=document.elementFromPoint(x,y);if(!el||el===svg||!svg.contains(el)||!el.getScreenCTM)continue;var cs=getComputedStyle(el),f=hex(cs.fill),s=hex(cs.stroke),p=svg.createSVGPoint();p.x=x;p.y=y;var lp=p.matrixTransform(el.getScreenCTM().inverse()),inF=el.isPointInFill?el.isPointInFill(lp):true,inS=el.isPointInStroke?el.isPointInStroke(lp):false,col=(cs.paintOrder||"").indexOf("stroke")===0?(inF&&f!=="none"?f:s):(inS&&s!=="none"?s:f),c=CAT[col];if(col==="none")continue;if(c)n[c]++;else o[col]=(o[col]||0)+1;tot++;}}svg.remove();var r={other:o};Object.keys(n).forEach(function(k){r[k]=100*n[k]/tot;});r.oth=100*Object.keys(o).reduce(function(a,k){return a+o[k];},0)/tot;return r;}var L=[];for(var ch=1;ch<=5;ch++){["fuse","burst"].forEach(function(k){var row="ch"+ch+" "+k+":",bad=[];[["idle",0],["walk",0]].concat(k==="fuse"?[["plant",3]]:[]).concat([["blast",0]]).forEach(function(q){var big=q[0]==="blast",a=area(B.draw(ch,k,{lod:"game",state:q[0],frame:q[1],halo:false,shadow:false}),big?"-130 -60 460 460":"-10 -10 220 220"),body=a.ink+a.mid;row+=" "+q[0]+q[1]+"[body "+body.toFixed(0)+" mid "+a.mid.toFixed(0)+" patch "+(a.pale+a.deep).toFixed(0)+" paper "+a.paper.toFixed(1)+" other "+a.oth.toFixed(1)+"]";if(a.oth>0.05)bad.push(q[0]+" other "+Object.keys(a.other).join("/"));if(big){if(a.paper<12||a.paper>30||body<50)bad.push("blast mix");}else{if(body<(q[0]==="plant"?65:70)||a.mid>20||a.pale+a.deep>20)bad.push(q[0]+q[1]+" body");if(a.paper>(q[0]==="plant"?9:5))bad.push(q[0]+q[1]+" paper");}});L.push(row+(bad.length?"  FAIL "+bad.join(", "):"  ok"));});}return "<rect width=\"1700\" height=\"260\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(20+i*24)+"\" font-size=\"12\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

## 8. 순서와 납품서

**순서**
1. 시작 전에 C8을 돌려 `kubxcy`가 나오는지 보고, C11이 40장 ok인지 본다.
2. 1장 심지형 idle을 game·art로 그린다. C2·C4·C9로 실루엣과 얼굴을 먼저 맞춘다. 그다음 1장 즉시형 idle을 같은 순서로 그린다.
3. walk, plant, blast, hit 순서로 그린다. C10a·C10b·C7을 돌린다.
4. 2~5장 재질 오버레이를 그린다. 장마다 C3·C5·C9를 돌린다.
5. API 문서를 쓴다.
6. C1~C12를 모두 다시 돌린다. `--check`가 모두 ok이고 kit error가 0건이어야 한다.

**API-bombers.md v1(K7)에 적을 것**
- 로드 순서와 의존(`PN.enemies._K` 읽기 전용)
- 호출, opts, 잘못된 호출
- 상태·프레임 표(§1.4)
- 박스, 피벗, 발, r, u, displayScale, displayPx(10 프로필 실측), 상태별 pad
- 앵커 head, eye, wick(표 전체), blastCenter
- game LOD 규칙과 장별 재질 표(가칭 이름 포함)
- 권장 굽기 키·fps와 plant 진행률 고르기
- 자가 확인 명령 C1~C12
- 알려진 한계

**납품서**(kit-artist 형식 1~6을 따르고 아래를 더한다)
- 지시서 표(§2.2·§2.3·§2.5·§3)와 대조한 실제 수치표: 10 프로필의 몸 높이·폭, 눈 높이, 심지 끝 좌표, 터짐 구름 반지름, pad.
- C6·C7·C8·C12 출력 원문.
- 직접 본 렌더 목록: 게임 크기와 확대를 모두 넣는다.
- T1·T2 자가 판정: 헷갈리는 쌍이 있으면 그 쌍과 고친 점을 적는다.
- 메인 세션 등록값: 키, 앵커, 배율, pad, fps, wick 표.

## 9. 메인 세션이 할 일 (합격 뒤)

**1. 등록·굽기**
- `scripts/build-atlas.mjs:11`: `KIT_FILES`의 `k-enemies.js` 바로 뒤에 `k-bombers.js`를 넣는다.
- `art/atlas-spec.mjs`:
  - `BOMBER_KINDS = { fuse: { walkFps: 8 }, burst: { walkFps: 12 } }`를 더한다.
  - `chapterPack`(:379-387)에 장마다 `{ bomber: { chapter, kind }, keyPrefix: 'enemy/<ch>/bomber-<kind>' }`를 더한다.
- `renderFrames`(:185-203)에 enemy 분기와 같은 꼴의 `frame.bomber` 분기를 둔다:
  - meta는 `PN.bombers.meta`에서 읽는다.
  - 칸 값은 `box: meta.box`, `anchor: meta.feet`, `scale: meta.displayScale`, `extraPad: meta.pad[state]`다.
  - 호출은 `['PN.bombers.draw', ch, kind, {lod:'game', shadow:false, halo:true, state, frame}]`이다.
  - 애니메이션은 `{idle:{1,1}, walk:{4,walkFps}, plant:{4,0}, blast:{1,0}, hit:{1,1}}`이다(`plant`는 심지형만).
- `npm run build:atlas`: chapter-01~05에 새 프레임 90장이 더해진다. 기존 `enemy/*` 프레임의 w·h·ax·ay가 그대로인지 매니페스트에서 확인한다.

**2. 슬롯·상태**
- `slots.ts:92`: `enemy.bomber`가 있으면 `enemy/<ch>/bomber-<kind>`를 쓰고, `enemyDrawScale`은 1이다.
- `animation.ts:113-123`: 심은 심지형(`fuseAt !== undefined`)은 `windup`이다. 이 판단을 stun보다 앞에 둔다(위협 우선, V3). 폭탄병 슬롯의 windup 포즈 사슬은 `['plant', 'windup']`이다.
- `worldRenderer.enemySprite`(:2156-2176): `plant`는 fps가 아니라 진행률로 고른다. 프레임 = `min(3, ⌊(elapsed − fuseAt) / BOMBERS.fuse.seconds × 4⌋)`이고, minimal에서도 이 규칙을 쓴다. 카운트다운 정보라서다(V5).

**3. 렌더러 제안(이번 킷과 별개로 판단)**

| # | 제안 | 이유 |
|---|---|---|
| R1 | 불꽃 점을 심지 끝에 그린다 | 지금은 그림 맨 위에서 15px(체력바를 켜면 29px) 위에 떠 있다(`b1-crowd-mock-ch1-x3`). `wick` 표는 장 공통이니 매니페스트 데이터로 넘기면 된다(skillVfx처럼). 위치는 x = `body.x + facing·(wick.x − feet.x)·0.25`, y = `body.y − (feet.y − wick.y)·0.25`다. 심은 동안에도 그려 plant 프레임을 따라 내려가게 한다(`:1044`는 심기 전에만 부른다) |
| R2 | 두 고리 밑에 먹 샌드위치를 깐다 | §5.3: 호박·산호 대 바닥 대비가 1.2~1.5:1이다. 해칭 머리선처럼 0.7~1px 먹 α0.55를 깐다. 고리를 `groundMarks`의 땅 타원(rx r+5, ry 0.42·rx, 몸 아래)으로 옮기는 것도 권한다. 원거리 적 고리와 같은 층이다. 그림은 이미 눈 높이 규칙으로 지금의 원을 피한다 |
| R3 | 폭발 범위 원을 §12.2 3단계 문법으로 그린다 | 단계는 점선 테 + 성긴 호박 해칭 → 굵은 테 + 촘촘한 해칭 + 눈금 → 산호 순간이다. 지금은 평면 채움이다(`:896-920`). 충격 지형의 단계 그리기(`GameRenderer.drawHazard`)를 진행률로 다시 쓰면 된다 |
| R4 | 터짐 프레임 표시 | `enemy/blast`(`presentation.ts:292-298`)에서 {x, y, kind, at}를 쌓는다. `enemy/<ch>/bomber-<kind>/blast/0`을 0.15초 그리고 마지막 0.05초는 흐리게 한다. **`groundMarks`(몸 아래, 쓰러지는 몸과 같은 층)**에 그려 결이 덮이지 않게 한다(V4, BUG-12). minimal에서는 생략하고, 감소 플래시에서는 α0.5로 그린다. 방향은 마지막 facing을 쓰고 없으면 1이다 |

**4. 확인**
- `npm run test:unit`, `npm run bench:packs`, `npm run build`(설치 에셋 예산), `npm run test:perf`(적 400마리 장면)를 돌린다.
- `npm run test:visual`에는 폭탄병 장면을 넣어 달라. 넣을 것은 다음 셋이다:
  - 원 안에 심은 심지형
  - 결 옆의 즉시형
  - 터지는 순간
- 커밋 항목은 ART-11(SYS-14)이다(R5 실행서 4단계).

## 10. 사람 클린업으로 넘길 것 (바이블 §15)
- 킷 출력은 잠정 아트다.
- 사람 원화가가 손볼 곳:
  - 최종 붓 외곽과 블랙 스팟 배치
  - 1장 구겨진 종이와 벽보 인쇄
  - 3장 복어 가시와 옹기 결
  - 4장 바늘 끝
  - 5장 흑요 조개껍데기 결
  - 먹 불꽃과 연기의 붓질
  - 터짐의 비백 튐과 파편
- 정식 판독 시험(n ≥ 8)은 아직 하지 않았다.

## 11. 열린 질문

| # | 질문 | 권고 |
|---|---|---|
| Q1 | 폭탄병을 스타일 바이블에 올릴지 | 올린다. 넣을 곳은 세 군데다: §8.1 역할 표에 '소형 접촉의 하위형'(심지 ●+심지 / 즉시 ●+촉발 뿔), §10.1 렌더러 표식(호박 점선 고리·불꽃, 겹 산호 고리), §14 시험 재료(32px 세트와 0.3초 답안에 폭탄병 둘) |
| Q2 | 해체(처치) 그림 | 지금 처치된 폭탄병은 추적자 처치 연출을 탄다. 그래서 둥근 몸이 개 모양 종이 섬광과 웅덩이로 사라진다(`b1-kill-ref-x3`, 약 0.25초). 다음 차수에 종류마다 4장을 권한다(심지 꺼짐과 연기 → 주머니가 꺼져 웅덩이). Corpse가 폭탄병 종류를 알아야 한다 |
| Q3 | 터진 자리의 마른 먹 얼룩 | §12.2 active 뒤의 '마른 먹 얼룩 1.2초'와 P6 데칼이다. 기존 데칼 경로를 쓸지, 터짐 데칼을 따로 둘지 정한다. 다음 차수 |
| Q4 | 도감·스테이지 카드 | 도감 66항목에 폭탄병이 없다. 넣을지, 몇 항목으로 넣을지(2 또는 10) 정한다. art LOD는 이번에 준비된다 |
| Q5 | 이름 | §3의 이름은 가칭이고 API 문서에만 있다. 화면에 낼 때는 문자열 표와 용어집(로어 Q-6)을 거친다 |
| Q6 | 즉시형 예고(V3) | 닿는 순간 터지므로 몸의 준비 자세가 없다. 늘 켜진 겹 고리와 몸(뿔·노치·균열)이 상시 예고 역할을 한다. 0.1~0.15초 덤벼드는 자세를 더할지는 게임 디자인 결정이다 |
| Q7 | §9 R1~R4 렌더러 제안 | 메인 세션이 판단한다. 킷은 어느 쪽이든 맞게 그린다 |

**확인하지 못한 것**
- 실제 게임 화면. 통합 뒤 `npm run test:visual` 캡처로 확인해야 한다.
- 소형 적의 실제 이동 속도와 걸음 fps의 발 미끄러짐. 8·12fps는 권장값이다.
- 90장을 더했을 때의 팩 용량. `bench:packs`로 확인한다.
- 시안은 내가 대충 그린 도형이다. 실제 킷 그림의 판독은 납품 검수에서 C4·C5로 다시 본다.
