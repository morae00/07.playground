# K9 무기 아이콘·탄 — 납품·검수 기록

지시서: `docs/art/briefs/arsenal-icons.md`(B3, 8a81f57; §10~§13 검수 정정). 킷: `art/concept-kit/k-icons2.js`, `API-icons2.md`.

1차 납품서부터 1차 수정 2회차 납품서까지 다섯 절은 2026-10-15에 메인 세션이 절을 덧붙일 때마다 파일을 먼저 비운 실수로 지워졌고, 2026-10-27 킷 점검 P2-3에서 서브에이전트 기록으로 되살렸다. 되살린 절마다 출처를 적었다.

## 1차 납품서 — 무기 아이콘·탄 (`PN.arsenal`, 뼈대 + volley 8종)

(되살림: 서브에이전트 기록 `agent-a7c1c9697e5fa5666`(kit-artist, 'K9 arsenal icons kit, part 1')의 SubagentHandback 원문, 2026-10-14 16:04 KST. 메인 세션이 이 파일에 넣었던 글과 같은 추출이다(세션 기록 `75a03af2-….jsonl` 줄 41425, 추출 길이 일치). 머리말 단계만 이 파일에 맞췄다; §4.2의 4번 끝에는 메인 세션이 수정 1회차를 붙이며 단 R7 정정 주석(세션 기록 줄 42574)도 그대로 넣었다.)

작성: kit-artist, 2026-10-14. 지시서는 `docs/art/briefs/arsenal-icons.md`이고, 팀 결정(R5-orders.md '결정' B3 Q1~Q7, 모두 권장안)을 따랐습니다.

**요약**
- 1차 범위는 다 했습니다. 뼈대(§1 전부: 틀 빌리기, META 44종, `parts`·`stamp`, 자리표시)와 volley 8종의 아이콘(평상·각성)·탄입니다.
- 검사 결과
  - `--check`를 붙인 명령은 모두 ok입니다: C1, C2 11 kind 전부, C6(1x·6x), C8(1x·0.8x·3x), 리뷰 도우미 둘.
  - C4·C5는 기준값과 글자 하나 다르지 않습니다.
  - C7은 meta·invalid calls ok, 탄 22줄 모두 ok입니다.
  - 모든 실행에서 kit error는 0건입니다. 다른 작업자의 모듈이 함께 로드된 상태에서도 0건이었습니다.
- 손댄 것은 맡은 두 파일뿐이고, 아무것도 내려받지 않았습니다.
- 지시서와 다르게 한 곳이 9개 있습니다(§4.2). 가장 큰 것은 넷입니다.
  - 흰 모티프 넷에 먹 바탕을 더했습니다.
  - 붓깃과 혼령 일제사격의 벌어짐 각을 줄였습니다(volley 틀 ≤ 14°와 충돌).
  - 혼령 화살 촉의 채움을 α 0.6 → 0.35로 낮췄습니다.
  - 뇌침 번개와 망나니 칼 머리를 키웠습니다(20px 판독).

### 1. 납품 목록

| 파일 | 내용 |
|---|---|
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js` (새 파일, 796줄) | `window.PN.arsenal` v1.0. 모든 선언이 IIFE 안에 있습니다. 결정적이고(`Math.random`·`Date` 0) 글자 0입니다 |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md` (새 파일) | 1~10절: 로드·의존, 틀 빌리기, 공개 API·오류, META 44줄 표, 타일·슬롯 규격과 낙관 구역, volley 아이콘 요약, 탄 조각·박스·실측, C1~C8·T1~T3 명령, 다르게 한 것, 한계·사람 클린업 |

공개 API(`k-icons2.js:781-795`)
- 데이터: `version`, `K`(= `PN.icons.K`), `ids`(44개, arsenal.ts 순서), `kinds`(11개), `META`, `shots`(22개)
- `skill(id, {size, awakened, pitchFor})`, `tile(id, {awakened, metal, size, rarity})`, `hudSlot(id, {size, level, cooldown, awakenReady, awakened})`
- `parts(id)`, `stamp(id, part, {frame})`
- 리뷰용(선택): `sheet({kind, awakened})`, `shotSheet({kind})`

오류를 던지는 경우
- 모르는 id
- 투사체 없는 무기에 `parts`·`stamp`
- 모르는 조각 이름
- 핵심 아이콘 id와 겹침

틀 빌리기(`k-icons2.js:543-563`)
- 지시서 §1.3 방식 그대로입니다. 호출하는 동안에만 `PN._ki.ICON[id]`에 넣고 `finally`에서 지웁니다.
- 각성 슬롯은 호출 동안만 `PN.icons.skill`을 바꿨다가 되돌립니다.
- 호출 뒤 `list=17 ICON=17`입니다.

**이번 차례 `done` 목록(8)**: inkDarts, brushQuills, sealArrows, frostNeedles, thunderNeedles, twinBlades, ghostVolley, headsmanDarts
- 각 무기: 아이콘 평상·각성, 타일·슬롯, 탄 6조각 × 2장
- 나머지 36종은 `done:false`입니다.
  - 아이콘은 look의 핵심 그림입니다.
  - 탄은 §4.2 규격을 지키는 종이 바늘 자리표시입니다.

### 2. API 요약

**아이콘·타일·슬롯**
- 마스터 128 × 128, 빛은 왼쪽 위, 피벗 = 왼쪽 위(UI 요소)입니다.
- 타일 160 박스: `tile(id, {awakened, metal:true, size:150})`. 칸 166 × 166 CSS, 원점 (−8, −8), 드래프트에서 아이콘 120px.
- 슬롯 52 × 56: `hudSlot(id, {size:40, awakened})`. 칸 56 × 60, 원점 (−2, −2). 표시 크기는 40·32(24)·28.6·20px.
- 낙관 피할 구역: 아이콘 좌표 (94~128, 0~34). 네 모서리 10 안에도 정보를 두지 않습니다.

**탄**
- 앵커 = 투사체 좌표 = 판정 원 중심, +x = 속도 방향입니다.
- 공통 필드: `rotate:'vel'`, `layer:'ally'`, `lod:'info'`, `flash:false`, `scale:1`.
- 박스·앵커(r별)
  - r 3.5: 40×18 / (31, 9)
  - r 4: 46×20 / (35, 10)
  - r 4.5: 50×20 / (39, 10)
  - r 5: 54×22 / (43, 11)
  - r 5.5: 60×22 / (47, 11)
  - r 6: 64×24 / (51, 12)
- 판정은 그림 때문에 바뀌지 않습니다(V4).

### 3. 검사 결과

#### 3.1 명령과 결과
명령은 모두 `node scripts/art-review-sheet.mjs expr …`이고, 지시서 §5.2 원문 그대로입니다.

| 명령 | 결과 |
|---|---|
| 시작 전 C5 기준값 (`k9-c5-baseline`) | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18` — 지시서와 같음 |
| C1 `k9-c1-all` `--check` | ok |
| C2 `k9-c2-{volley,burst,spray,rear,seeker,strike,nova,lob,chain,beam,halo}` `--check` | 11개 모두 ok. volley 밖은 자리표시 |
| C6 `k9-c6-shots`(1x)·`k9-c6-shots-x6`(6x) `--check` | ok |
| C8 `k9-c8-scene`(1x)·`-08`(0.8x)·`-x3`(3x) `--check` | ok |
| C8 흑백 `k9-c8-scene-gray` | 확인함(아래) |
| `PN.arsenal.sheet({kind:'volley'})`·`shotSheet({kind:'volley'})` `--check` | ok |

**C4 출력 원문**
```
icons bad=0 text=0 hatch=0 nocyan=0
stamps bad=0 text=0 filter=0 nocyan=0 colours={}
```

**C5 출력 원문**(새 모듈의 모든 호출 뒤)
```
icons-all=19vh262 len=2634966 list=17 ICON=17 | skillvfx-all=1xq1i37 len=698432 groups=18
```

**C7 출력 원문**
```
meta ok | invalid calls ok | core list=17
inkDarts r=4 front=5.5 back=23.5 side=4.8 ok
brushQuills r=5 front=6.2 back=19.5 side=5.9 ok
sealArrows r=6 front=7.5 back=44.5 side=7.1 ok
frostNeedles r=4.5 front=6.0 back=32.1 side=5.3 ok
thunderNeedles r=4.5 front=6.0 back=16.0 side=5.3 ok
twinBlades r=6 front=6.5 back=15.3 side=7.8 ok
ghostVolley r=5 front=6.5 back=24.4 side=5.9 ok
headsmanDarts r=4.5 front=6.0 back=27.0 side=5.3 ok
paperStorm r=5 front=6.0 back=16.0 side=1.7 ok
inkBloom r=4.5 front=5.5 back=14.8 side=1.7 ok
thornHalo r=4 front=5.0 back=13.6 side=1.7 ok
starShards r=5.5 front=6.5 back=17.2 side=1.7 ok
sunNeedles r=5 front=6.0 back=16.0 side=1.7 ok
inkDrizzle r=3.5 front=4.5 back=12.4 side=1.7 ok
pinHail r=4.5 front=5.5 back=14.8 side=1.7 ok
tailGuard r=5 front=6.0 back=16.0 side=1.7 ok
smokeTail r=4.5 front=5.5 back=14.8 side=1.7 ok
gravePins r=4.5 front=5.5 back=14.8 side=1.7 ok
trackingSeals r=4.5 front=5.5 back=14.8 side=1.7 ok
huntersMarks r=5 front=6.0 back=16.0 side=1.7 ok
crowFeathers r=5 front=6.0 back=16.0 side=1.7 ok
bossbane r=5.5 front=6.5 back=17.2 side=1.7 ok
```

#### 3.2 탄 실측표 (C7, 모든 조각·장 중 최대)

각성 꼬리 1.25배와 반짝임을 포함한 값입니다.

| 무기 | r | 앞(허용 r−0.5~r+2.5) | 뒤(≤ 8r) | 옆(≤ r+2.5) |
|---|---|---|---|---|
| inkDarts | 4 | 5.5 | 23.5 / 32 | 4.8 / 6.5 |
| brushQuills | 5 | 6.2 | 19.5 / 40 | 5.9 / 7.5 |
| sealArrows | 6 | 7.5 | 44.5 / 48 | 7.1 / 8.5 |
| frostNeedles | 4.5 | 6.0 | 32.1 / 36 | 5.3 / 7 |
| thunderNeedles | 4.5 | 6.0 | 16.0 / 36 | 5.3 / 7 |
| twinBlades | 6 | 6.5 | 15.3 / 48 | 7.8 / 8.5 |
| ghostVolley | 5 | 6.5 | 24.4 / 40 | 5.9 / 7.5 |
| headsmanDarts | 4.5 | 6.0 | 27.0 / 36 | 5.3 / 7 |

#### 3.3 직접 본 렌더
모두 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`에 있습니다.

**게임 크기(1x)**
- `k9-t2-volley-both`: volley 행, 32px 색·32px 흑백·20px 흑백, 평상과 각성
- `k9-t2-kinds`, `k9-t2-kinds-awakened`, `k9-t1-looks`, `k9-t3-blind20`(먼저 봄) → `k9-t3-key`
- `k9-c6-shots`
- `k9-c8-scene`, `k9-c8-scene-08`, `k9-c8-scene-gray`
- `k9-c2-volley`

**확대**
- `k9-t6-normal`·`k9-t6-awakened`(1.5x): 타일과 낙관 구역 네모
- `k9-wip-final8`(2.4x): 아이콘 평상·각성 8종
- `k9-wip-f1`·`-f2`(3.6x)
- `k9-c6-zoom-a`·`k9-c6-zoom-final`(5x)
- `k9-helper-shotsheet-a`·`-b`(3x): 탄 6조각 × 2장 전부
- `k9-c8-scene-x3`
- 참고 `k9-ref-core3`(핵심 3종)

**판정**
- 1x 전투 장면(색·흑백)에서 무기 탄 22종이 모두 '밝은 몸 + 청록'으로 읽힙니다. 적 탄(먹 알 + 산호 테)과 갈립니다.
- T6
  - 평상 타일의 산호 점선 네모 안이 8종 모두 비어 있습니다. 뇌침의 기절 나선은 네모 바로 아래에 있습니다.
  - 각성 타일의 覺 낙관은 바탕만 가립니다.

### 4. 지시서 대비

#### 4.1 무기별 디자인 (주 덩어리 / 청록 / 각성)
좌표는 128 창 기준입니다. 상세는 `API-icons2.md` §6과 §7.4에 있습니다.

| 무기 | 주 덩어리(지시서 문구 그대로) / 블랙 스팟 | 청록 | 각성 |
|---|---|---|---|
| 먹침 | 검은 쐐기 둘: 먹 쐐기 폭 16, 종이 몸 7 + 실감기 + 깃털 비행깃. 다트 뒤에 마른 붓 먹 꼬리 | 위 다트의 위 깃(먹 테) | 3발 |
| 붓깃 | 흰 깃 셋, 벌어짐 14°. 가운데 깃이 과녁을 꿰뚫고 나옴(종이 구멍). 다발 밑에 좁은 먹 붓 획 | 펜촉 끝 점 r 3(먹 테) | 4개 |
| 인장 화살 | 먹귀 셋(r 9·11·13)을 꿴 굵은 꼬치. 자루가 눈 아래로 지나감. 인장 몸 16 × 18(홈, 먹 앞면), 맨 앞 먹귀가 젖혀지고 끌림 획 둘 | 인장 앞면 테 | 2발, 먹귀 넷 |
| 서리침 | 먹귀 아래 절반의 가지 친 서릿발 8 + 얼음판. 오른쪽 아래 언 땅(먹) | 침 끝 둘 | 3개 + 서릿발 몸 2/3까지 |
| 뇌침 | 꺾쇠 번개(꺾임 5, 구간 33·12·47·15·22·13, 굵기 8→15.5) + 바늘. 기절 나선 | 번개 심 | 2발, 둘째 먹귀로 튐 |
| 쌍날 | 흰 초승 날 둘(지름 36·40, 크기·높이·회전이 다름, V 대칭 없음) + 가늘어지는 회전 호. 밀침 표지 | 위 날의 안쪽 날선 | 3개 |
| 혼령 일제사격 | 선 그림 화살 넷(잎맥 있는 버들잎 윤곽, 종이 선 자루) + 청록 불꽃 깃. 왼쪽 아래 부채꼴 먹 번짐. `halo:false` | 불꽃 깃 넷 | 5발, 불꽃 1.35배 |
| 망나니 침 | 외날 칼 머리(곧은 등, 뾰족한 끝, 위 절반 먹 등) + 찢긴 먹귀(눈 아래로 7계단 찢김선, 위 조각이 −22° 벌어짐, 먹 4가닥) | 칼 날선 | 2발, 찢긴 먹귀 둘 |

#### 4.2 지시서와 다르게 한 것 (이유)
1. **먹 바탕 추가**: 붓깃 붓질 띠, 서리침 언 땅, 혼령 부채꼴 번짐, 먹침 마른 붓 꼬리를 더했습니다. 흰 모티프는 종이 위에서 20px에 사라집니다(§0.2 서리발 시안과 같은 이유). 놓는 자리는 무기마다 다르게 했습니다.
2. **벌어짐 각**: 붓깃 ±8° → ±7°, 혼령 ±12° → 약 ±10°. volley 틀 '≤ 14°'와 무기 지시가 부딪쳤습니다.
3. **혼령 화살 촉(아이콘)**: 채움 α 0.6 → 0.35 + 종이 안쪽 선. α 0.6에서는 버들잎이 숟가락처럼 메워졌습니다.
4. **혼령 탄의 자루**: ink300 1.2 대신 ink300 테 2.2 안의 종이 선 0.9입니다. 몸의 종이가 40% 이상이 되도록 했습니다. *(정정, 검수 1차 R7: 측정은 종이 17~19%·담묵 46~52%다. 종이 선과 담묵 테로 밝게 했다.)*
5. **뇌침 번개 굵기**: 먹 11 → 8~15.5. 비율 1 : 0.5 : 0.17은 그대로입니다.
6. **망나니 칼 머리 크기**: 1.12배(≈ 44 × 23, 지시서 '날 26~32'). 자리는 (55~97, 50~84)이고 지시서 (70~96, 46~78)보다 조금 왼쪽 아래입니다. 낙관 구역 밖입니다. 주 덩어리 짧은 변 ≥ 14를 맞추려고 키웠습니다.
7. **찢김선**: 종이 테를 뺐습니다. 이빨처럼 읽혔습니다.
8. **쌍날의 긴 먹 꼬리 제거**: 두 꼬리가 '<'를 만들었습니다.
9. **인장 꼭지(돔) 제거**: 컵처럼 읽혔습니다. 대신 홈 한 줄을 넣었습니다.

#### 4.3 지키지 못했거나 판정이 남은 것
- **블랙 스팟 15~55%**: 잴 도구가 없어 눈대중입니다. 밝은 쪽(인장 화살·뇌침·망나니 침·쌍날)은 하한 근처로 봅니다.
- **T3**: 36종이 자리표시라서 이번 차례에는 판정할 수 없습니다.

#### 4.4 T1~T3 자가 판정
- **T1**: 그린 무기는 같은 줄의 핵심 아이콘과도 서로와도 32·20px에서 갈립니다.
  - needleStorm 줄: 먹침·인장 화살·서리침·뇌침·망나니 침
  - fanKnives 줄: 붓깃·쌍날
  - mirrorClone 줄: 혼령
- **T2 volley**
  - 32px 흑백에서 8종이 모두 갈립니다.
  - 20px 주 덩어리: 쐐기 둘 / 흰 잎 + 먹 줄 / 점 한 줄 + 흰 네모 / 오른쪽 아래 먹 / 지그재그 / 초승 둘 / 먹 부채 / 자루 + 칼 머리.
  - 헷갈렸던 쌍과 고친 점
    - 뇌침 ↔ 망나니 침: 둘 다 밝은 바탕에 대각선 + 오른쪽 덩어리였습니다. 번개를 굵히고 칼 머리를 키웠습니다.
    - 붓깃 ↔ 혼령: 둘 다 왼쪽에 먹 덩어리였습니다. 붓깃 띠를 좁혀 다발 밑으로 옮겼습니다.
  - 각성판은 20px에서 빌린 틀(먹 바탕 + 종이 원상)이 화면을 거의 채워 차이가 작습니다. 핵심 아이콘도 같습니다.
- **T3**: 섞은 시트의 volley 자리는 4 ghostVolley, 9 headsmanDarts, 11 inkDarts, 13 thunderNeedles, 20 twinBlades, 22 frostNeedles, 35 brushQuills, 38 sealArrows입니다.
- **작업 중에 고친 오독**
  - 아이콘
    - 다트가 미사일로 읽힘
    - 번개 'WWW/ΛΛ'
    - 칼 머리가 숟가락, 바탕이 달걀
    - 쌍날 꼬리가 검은 원뿔
    - 인장 화살 '<' 모양 찢김 표시
    - 기절 나선 '@'
  - 탄
    - 쌍날 '( )'
    - 혼령 불꽃 '<'
    - 망나니 'D/P'
    - 뇌침 '^^^'

### 5. 메인 세션이 할 일 (등록값)

#### 5.1 굽기 순서
- `scripts/build-ui-art.mjs:17`과 `scripts/build-atlas.mjs:11`의 `KIT_FILES`에 `'k-icons2.js'`를 `'k-icons.js'` 바로 뒤에 넣습니다.

#### 5.2 UI 시트 (`art/ui-art-spec.mjs`, 지시서 §7 권장대로 따로 둠)
- 항목은 `done`인 무기만입니다. 1차 칸 순서: inkDarts, brushQuills, sealArrows, frostNeedles, thunderNeedles, twinBlades, ghostVolley, headsmanDarts × [평상 `<id>`, 각성 `<id>-awakened`] = 16칸.
- `arsenal-tiles`
  - 열 8, 칸 [166,166], 원점 [−8,−8]
  - 레시피 `PN.arsenal.tile(id, {awakened, metal: true, size: 150})`
  - 1차 크기 2행 = 2656 × 664 px(@2x)
- `arsenal-slots`
  - 열 9, 칸 [56,60], 원점 [−2,−2]
  - 레시피 `PN.arsenal.hudSlot(id, {size: 40, awakened}).replace(/<rect x="46\.4"[^>]*\/>/g, '')`
  - 1차 크기 2행 = 1008 × 240 px
- CSS
  - `build-arsenal-art.mjs`가 `done`인 키에서 배지(`::after`)와 `position: relative` 규칙을 뺍니다.
  - `.artTile`·`.artSlot`의 `background-image`·`size`·`position`을 키마다 덮어씁니다.
  - `src/ui/uiArt.test.ts:53-56`의 키 목록을 갱신합니다.

#### 5.3 탄 (skills 팩, `art/atlas-spec.mjs:405`)
- `build-atlas.mjs` `renderFrames`가 `PN.arsenal.shots` 중 `META[id].done`인 것의 `parts(id)`를 펼칩니다.
  - 키 `skill/<id>/<part>/<frame>`
  - 호출 `['PN.arsenal.stamp', id, part, {frame}]`
  - `box`·`anchor`는 parts 값, `scale: 1`
- 1차는 8종 × 12장 = 96장이고 박스 넓이 합은 112,416 단위²입니다.
- 조각 이름(start·travel·end·*-awakened)이 `SKILL_VFX_TIMING`과 맞습니다.
- `readSkillVfx`가 `PN.arsenal.parts`도 읽게 합니다. `window`만 한글이므로 지금처럼 빼고 옮기면 됩니다.

#### 5.4 렌더러 (지시서 §7-2)
- `worldRenderer.ts:85` `SKILL_SHOTS`에 done 8종을 넣습니다.
- `:1337` 조건이 `projectile.skillId`도 보게 합니다.
- `:1359` 무기 자신의 조각이 있으면 `shot.skillId`, 없으면 `shot.look`을 고릅니다(`prefix`는 look 그룹만).
- 각성 조각이 없으면 평상 조각으로 떨어지게 하기를 권합니다.

#### 5.5 참고
- 망나니 침 아이콘은 같은 먹귀를 두 번 보이려고 `<use href="#…">`를 씁니다. `--check`의 참조 검사는 통과합니다.
- 아이콘은 빌린 틀의 rough·grain 필터를 핵심 아이콘과 똑같이 씁니다. 탄에는 필터가 0입니다.
- 확인은 지시서 §7-3대로 합니다(`build:ui-art`, `build-arsenal-art.mjs`, `build:atlas`, `test:unit`, `npm run build` 예산, `test:visual`).

### 6. 알려진 한계 · 사람 클린업 (지시서 §8, 바이블 §15)
- 사람이 다시 그을 것
  - 8종의 최종 붓 외곽·블랙 스팟·비백(마른 붓 꼬리, 붓질 띠, 서릿발, 찢김선, 번개 꺾쇠)
  - 20~32px 픽셀 다듬기. 슬롯 하나를 20~45px에 씁니다.
  - 탄 96장(전체 264장)의 1x 픽셀 정리
- 기절 나선은 '한 획 1.5바퀴' 지시를 지키면 작은 크기에서 '@'와 닮을 여지가 남습니다. 납작하게(0.38) 하고 꼬리를 열어 줄였습니다.
- 문화 검토가 필요합니다: 인장·손·종·가시·별·바늘꽂이의 최종 꼴(로어 §1.4).
- 정식 판독 시험(n ≥ 8)은 하지 않았습니다.
- 2·3차에서 바뀔 수 있는 것: 지금 블랙 스팟 배치(왼쪽 붓질 띠·왼쪽 아래 부채·오른쪽 아래 언 땅)가 나머지 kind(rear·spray·strike 바닥 띠 등)와 20px에서 겹치면 다시 조정합니다.

---

## 검수 1차 — art-director, 2026-10-14

(되살림: 서브에이전트 기록 `agent-a4c877d3024d1c717`(art-director, 'Review K9 first delivery')의 SubagentHandback 원문, 2026-10-14 16:36 KST. 메인 세션이 이 파일에 넣었던 글과 같은 추출이다(세션 기록 `75a03af2-….jsonl` 줄 41997, 추출 길이 일치). 머리말 단계만 이 파일에 맞췄다.)

**판정: 수정 후 합격.**
- 뼈대(§1)와 검사 C1~C8은 모두 통과했고, 납품서 §4.2의 '다르게 한 것' 9건도 모두 받아들인다.
- 고칠 것은 넷이다(F1~F4). 모두 `k-icons2.js` 안에서 국소적으로 고치면 된다.
  - F1 망나니 칼 머리가 '국자'로 읽힘
  - F2 찢긴 먹귀의 먹 튐이 고양이 수염으로 읽힘
  - F3 1배에서 몸이 어두운 탄 둘(먹침·망나니 침)
  - F4 32px에서 청록이 사라지는 아이콘 셋(먹침·인장 화살·서리침)
- 고친 뒤 §7 명령으로 재검수한다. R5 기준으로 수정 1회차다.
- 자리표시 36종은 맞게 되어 있다(§2.5).

---

### 1. 직접 돌린 검사

- 렌더는 모두 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r1-*.png`에 있다.
- 다른 작업자 모듈(bombers·characters·bossesC·fieldBosses)이 함께 로드된 상태에서 돌렸고, 모든 실행에서 kit error는 0건이다.

| 검사 | 렌더 | 결과 |
|---|---|---|
| C5 | `k9r1-c5-unchanged` | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18`. 기준값과 같다 |
| C4 | `k9r1-c4-scan` | `icons bad=0 text=0 hatch=0 nocyan=0`, `stamps bad=0 text=0 filter=0 nocyan=0 colours={}` |
| C7 | `k9r1-c7-meta` | `meta ok \| invalid calls ok \| core list=17`. 탄 22줄 모두 ok이고, 실측값은 납품서 §3.2와 같다 |
| C1 `--check` | `k9r1-c1-all` | ok |
| C2 11 kind `--check` | `k9r1-c2-{volley,burst,spray,rear,seeker,strike,nova,lob,chain,beam,halo}` | 11개 모두 ok |
| C6 `--check` | `k9r1-c6-shots`(1배), `-x6`(6배) | ok |
| C8 `--check` | `k9r1-c8-scene`(1배), `-08`(0.8배), `-x3`(3배), 흑백 `-gray` | ok |
| T1·T2·T3 | `k9r1-t1-*`, `k9r1-t2-*`, `k9r1-core-aw-20gray`, `k9r1-t3-blind20` → `k9r1-t3-key` | §2.1 |
| 확대 | `k9r1-icon-<id>` 8종(3배, 평상+각성, 낙관 구역·모서리 표시, `--check` ok)<br>`k9r1-zoom-headsman`(8배), `-thunder-frost`(6배), `-seal-darts`(6배), `-twin-aw`(4배)<br>`k9r1-shotsheet-a/-b`(4배, 6조각 × 2장 전부, `--check` ok), `k9r1-c6-volley-x6a/b` | §2~§4 |
| 이번에 더한 측정 | `k9r1-shot-paper`(C9 탄 색 비율), `k9r1-icon-ink`(C10 아이콘 먹 면적), `k9r1-cyan-32`(C11), `k9r1-volley-shots-scene`·`-gray`(C12)<br>`k9r1-placeholder-match`, `k9r1-parts-desc`, `k9r1-determinism` | 아래 |

### 2. 지시서 대조

#### 2.1 합격 기준

| 기준 | 판정 | 근거 |
|---|---|---|
| C1·C2·C6·C8, kit error 0 | 통과 | |
| C4·C5·C7 | 통과 | 호출 뒤 `list=17 ICON=17`이고 `PN.icons.skill`도 원래대로 돌아온다 |
| T1 | 통과 | 그린 무기는 32px 색·흑백, 20px 흑백에서 같은 줄의 핵심 아이콘과도, 서로와도 갈린다.<br>needleStorm 줄: 먹침·인장 화살·서리침·뇌침·망나니 침. fanKnives 줄: 붓깃·쌍날. mirrorClone 줄: 혼령 |
| T2 평상판 | 통과 | 20px 흑백 주 덩어리가 모두 다르다: 가로 검은 쐐기 둘 / 흰 잎 + 왼쪽 먹 / 점 한 줄 + 흰 네모 / 오른쪽 아래 먹 / 밝은 대각 지그재그 / 초승 둘 / 먹 부채 / 대각 자루 + 머리 |
| T2 각성판 | 32px 통과, 20px 약함 | 20px에서는 빌린 틀(먹 바탕 + 원상)이 화면을 채워 8종이 비슷해진다. 핵심 아이콘 각성판도 같은 정도라 틀의 한계로 본다. 팀 결정 Q7(20px 전용판)을 정할 때 각성판도 함께 본다 |
| T3 | 보류 | 36종이 자리표시라 판정하지 않는다. 섞은 시트에서 volley 자리(4·9·11·13·20·22·35·38)는 납품서와 같다 |
| T4 | 8종 중 6종 통과 | 먹침·망나니 침 평상 탄이 1배에서 '어두운 몸'으로 읽힌다(F3). 적 탄과는 8종 모두 모양으로 갈린다 |
| T5 | 조건부 통과 | §2.6 금지 모양은 없다. 다만 지시서 §3.3이 허락하지 않은 동물 얼굴이 하나 생겼다(F2).<br>기절 나선의 '@' 기미는 지시서 사양(1.5바퀴 한 획)에서 오는 것이라 받아들이고 사람 클린업으로 넘긴다 |
| T6 | 통과 | 평상 타일 8종의 낙관 구역(94~128, 0~34)과 HUD 배지 자리(105~128, 0~21)가 비어 있다. 각성 覺 낙관은 바탕만 가리고, 뇌침 각성 나선은 그 아래(y 약 36~44)에 있다 |

T4 보충
- 납품서 §3.3의 C8 판정은 먹침 평상 탄을 보지 못했다. C8은 `i%3===0`인 칸을 각성판으로 그려서 먹침·서리침·혼령이 각성판으로만 나온다.
- 그래서 volley 8종 평상·각성 탄만 놓은 C12 장면을 따로 만들어 봤다.

#### 2.2 §1 뼈대 (모두 확인)
- API는 §1.2와 같다(`scale:1`만 더함). 잘못된 호출 5종에 오류를 던진다.
- 틀 빌리기는 §1.3 방식 그대로다(`k-icons2.js:551-563`).
- META 44종의 이름이 `ko.json:770-857`과 모두 같다. count·awakenedCount는 §1.4·§2.4 규칙대로다.
  - 수 8 이상은 2~4개를 더했다: 종이 폭풍 10, 가시 테 14, 해바늘 20.
  - beam은 방향 수를 그대로 둔다.
- 결정적이다: 아이콘·타일·슬롯·탄 528개 호출을 두 번씩 돌려 비교하니 id 말고는 같다.
- `parts()` 서술자는 K4 `PN.skillVfx.parts`와 같은 꼴이다. 한글은 `window`에만 있고, 이 필드는 굽기 `readSkillVfx`가 옮기지 않는다.

#### 2.3 §3.4 무기별 (volley 8)

| 무기 | 주 덩어리·배치 | 효과 표지 | 청록 | 각성 수 | 메모 |
|---|---|---|---|---|---|
| 먹침 | 맞음 | 없음(지시대로) | 위 깃. 32px에서 안 보임 → F4 | 3발 | 미사일 기미 → R6 |
| 붓깃 | 맞음(벌어짐 14°) | 관통 구멍 있음 | 펜촉 끝 점. 32px에서 흐림 | 4개 | |
| 인장 화살 | 맞음 | 밀침(16°, 끌림 둘)과 관통 찢김 있음 | 인면 선(굵기 1.4). 32px에서 안 보임 → F4 | 2발, 먹귀 넷 | |
| 서리침 | 맞음(먹 언 땅 위) | 서릿발 8개(지시는 5~7, 미신고 → R8), 얼음판 있음 | 침 끝. 32px에서 안 보임 → F4 | 3개, 몸 2/3까지 | |
| 뇌침 | 맞음 | 기절 나선 있음 | 번개 심 | 2발, 둘째 먹귀로 튐 | |
| 쌍날 | 맞음(V 대칭 없음) | 밀침 있음 | 날선. 32px에서 흐림 | 3개 | R2·R3 |
| 혼령 | 맞음(벌어짐 20.5°) | 관통 있음 | 불꽃 깃 넷 | 5발, 불꽃 1.35배 | |
| 망나니 침 | 자리·크기는 맞음, 판독이 틀림 → F1 | 찢김은 맞음, 먹 튐이 틀림 → F2 | 날선. 32px에서 흐림 | 2발, 먹귀 둘 | |

#### 2.4 §4 탄
- C7로 확인한 것: 조각 이름, drive·fps·still, 박스·앵커, 여백 3, 앞끝 r−0.5~r+2.5, 옆 r+2.5 이하, 뒤 8r 이하.
- 12장을 모두 4배로 보며 확인한 것(`k9r1-shotsheet-a/b`):
  - 장 규칙: start 꼬리 30%·70%, travel 위상 차이, end 처짐과 allyD, end 1번 장은 p300·ink300·α 0.6
  - 각성: 겹 테, 앞끝 3 비움, travel-awakened 0번 장의 6갈래 반짝임, 꼬리 1.25배
- 색은 K 토큰만 쓰고 필터는 0이다.
- 둥근 먹알 + 종이 점(적 탄 문법)은 없다. 혼령 촉은 버들잎 꼴이다.
- 결 바늘(가는 바늘 + 긴 청록 S실)과 닮지 않는다.
- 남은 것은 몸의 명도 하나다(F3).

#### 2.5 자리표시 36종 — 맞음
- `done:false`가 36종, `done:true`는 volley 8종이다.
- 아이콘: id와 종이결 시드를 정규화하면 look 핵심 그림과 평상·각성 72/72가 같다. 타일·슬롯의 매듭과 틀은 무기 자신의 등급이다.
- 탄: §4.2 규격의 종이 바늘(앞끝 r+1, 뒤 −(2.4r+4), 반폭 1.7, 먹 1.5)에 청록 바늘귀가 있고, end 조각은 allyD로 흐려진다. 각성 조각은 평상과 같은데 자리표시라 괜찮다.
- 메인 세션은 `done`인 8종만 등록한다.

**얼굴.**
- 이 발주에 사람 얼굴은 없다.
- 과녁 먹귀는 모두 `PN._ki.inkDot` 그대로다.
- 지시서 §3.3 밖의 얼굴은 망나니 침의 찢긴 먹귀 하나뿐이다(F2).

### 3. 납품서 §4.2 '지시서와 다르게 한 것' 9건

| # | 내용 | 판정 | 이유·조건 |
|---|---|---|---|
| 1 | 먹 바탕 4종 추가(붓깃 붓질 띠, 서리침 언 땅, 혼령 부채 번짐, 먹침 마른 붓 꼬리) | 수용 | §2.2가 블랙 스팟을 '주 덩어리 자체이거나 그 바탕'으로 허용하고, T2 20px도 통과한다.<br>조건: 2·3차에서 rear(왼쪽 부채), spray(왼쪽 아래 발원), lob(왼쪽 아래 출발)와 20px에서 겹치는지 T2·T3로 다시 본다 |
| 2 | 벌어짐: 붓깃 14°, 혼령 약 20.5° | 수용 | 지시서 안에서 부딪쳤다(§3.1 '14° 이하' 대 §3.4 '±8°'·'±12°').<br>혼령은 요약 문구의 '부채꼴'이 앞선다. 방향(−24°~−3.5°)도 핵심 먹선 바늘(−65°~−25°)과 겹치지 않는다. 지시서를 고친다(§6) |
| 3 | 혼령 촉(아이콘) 채움 α 0.35 + 종이 안선 | 수용 | '선만 있는 화살'이라는 의도에 더 맞다. 3배에서 잎맥 있는 버들잎으로 읽힌다 |
| 4 | 혼령 탄 자루를 담묵 테 2.2 + 종이 선 0.9로 | 수용 | 1배에서 자루가 밝은 선으로 남는다.<br>다만 '몸의 종이 40% 이상'이라는 주장은 측정과 다르다(C9: 종이 17~19%, 담묵 46~52%). 문구만 고친다(R7) |
| 5 | 뇌침 번개 굵기 8 → 15.5 | 수용 | 지시서의 '끝으로 갈수록 굵다'를 구현한 것이고, 평균은 11 안팎, 먹·청록·종이 비율도 그대로다. 20px에서 망나니 침과 갈린다 |
| 6 | 망나니 칼 머리 1.12배, 자리 (55~97, 50~84) | 수용 | 20px 주 덩어리의 짧은 변 14 이상을 맞췄고 낙관 구역 밖이다. 칼 머리가 국자로 읽히는 것은 크기 탓이 아니라 F1에서 따로 고친다 |
| 7 | 찢김선의 종이 테 제거 | 수용 | 이빨로 읽히는 것을 막는다. 먹 튐 배치는 F2에서 고친다 |
| 8 | 쌍날의 긴 먹 꼬리 제거 | 수용 | '<'로 읽히는 것을 막는다. 남은 회전 호의 무게와 겹줄은 R2 |
| 9 | 인장 꼭지(돔) 제거, 홈 한 줄 | 수용 | §3.4의 인장 화살 머리에는 꼭지 요구가 없다(꼭지는 추적 인장 사양이다). 컵으로 읽히던 것이 없어졌다 |

### 4. 고칠 것 (필수, 수정 1회차)

#### F1 — 망나니 칼 머리(아이콘)가 120px에서 '검은 국자·배'로 읽힌다
- **본 렌더:** `k9r1-icon-headsmanDarts`(3배), `k9r1-zoom-headsman`(8배, crop 50,40,230,90).
- **문제:** §3.4의 주 덩어리는 '큰 외날 칼 머리'다. 드래프트 카드(120px)에서 무기를 알아볼 수 있어야 한다.
- **원인:** `headsmanDart()`(`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js:515-528`)
  - 배 곡선(`belly`, `:518`)이 손잡이 쪽(x 5~15)에서 가장 깊다(s +10.5). 칼보다 국자·사발 단면에 가깝다.
  - 먹 등(`back`, `:521`)이 날 높이의 55~67%를 덮는다. 손잡이 쪽에서는 s +1.4로 중심선 아래까지 내려온다.
  - 끝(x 35~37)은 `S()`의 둥근 이음이라 뾰족하지 않다.
- **처방**(블레이드 공간, 예시 좌표 ±2 안에서 다듬어도 된다)
  1. 가장 넓은 곳을 끝 쪽으로 옮긴다(팔치온 꼴). 예: belly `[[37,-10.5],[34,-4],[28,5],[19,8.6],[9,7],[1,4.8],[-1,4.2]]`.
  2. 먹 등은 위 가장자리 띠로 줄인다(두께 3~4). 예: back `[[-2,-6],[13,-8.4],[27,-9.4],[35,-10.2],[31,-7.4],[20,-5.6],[9,-4.6],[-2,-2.6]]`.
     - 날 몸은 종이로 둔다.
     - p300 그늘(`shade`)과 청록 날선(`eLine`)은 새 배 곡선을 따라 2~3 안쪽에 둔다.
  3. 등선 끝에서 3~4 더 나가는 뾰족한 끝을 `stroke-linejoin="miter"` 경로로 덧그린다. 예: 종이 삼각 `[33,-11.6]→[40,-11]→[34,-7.4]` + 먹 테 2.6.
  4. 날과 자루 사이에 칼 목(먹 띠, x −4~0, s −7~+5.5)을 둔다. 자루에 꽂은 날로 읽히게 하려는 것이다.
  5. 먹 면적이 줄어드는 만큼은 찢긴 먹귀 아래 먹 튐을 키워 메운다(R1 참조).
- **바꾸면 안 되는 것**
  - 칼 머리 자리(55~97, 50~84)와 1.12배
  - 낙관 구역 비움
  - 20px 주 덩어리(대각 자루 + 오른쪽 머리)
  - 청록은 날선 하나
  - 각성판 구성(작은 칼 0.72배 + 둘째 먹귀)
- **합격 기준**
  - `k9-fix-headsman-x8`(§7)에서 곧은 등과 뾰족한 끝을 가진 '자루에 꽂힌 외날'로 읽힌다.
  - T2 20px 흑백에서 뇌침과 계속 갈린다.

#### F2 — 찢긴 먹귀의 먹 튐이 부리·고양이 수염으로 읽힌다(각성판 둘째 먹귀는 고양이 얼굴)
- **본 렌더:** `k9r1-zoom-headsman`(8배, 평상·각성).
- **문제:** 지시서 §3.3은 얼굴로 읽혀도 되는 곳을 먹귀 슬릿 눈으로 한정한다. 동물 얼굴은 허용 밖이다. §3.2 '처형' 표지는 먹이 찢긴 가장자리에서 튀어야 한다.
- **원인:** `tornGhoul()`의 먹 튐(`k-icons2.js:214-217`)
  - 네 가닥 모두 찢김선 오른쪽 끝(t 0.7~1.35 r)에서 시작한다.
  - 방향도 찢김선 기준 −40°~+20°로 같은 쪽이다. 결국 한 점에서 오른쪽으로 부채꼴이 된다.
- **처방**
  - 시작점을 찢김선 전체에 흩는다: t ≈ −0.9, −0.2, +0.5, +1.1 r에 하나씩.
  - 방향은 찢김선에 거의 수직으로 둔다. 위 조각 가장자리에서는 위로 60~110°, 아래 조각에서는 아래로.
  - 길이는 5~12로 서로 다르게 하고, 한 가닥 끝에 먹 방울을 단다.
  - 한 점에서 세 가닥 이상 갈라지지 않게 한다. 오른쪽 윤곽 밖으로 0.6r 넘게 나가지 않게 한다.
- **바꾸면 안 되는 것:** 7계단 찢김선(종이 테 없음, §3 #7), 위 조각 벌어짐 `open`, `<use>` 구조, seed.
- **합격 기준**
  - `k9-fix-headsman-x8`의 평상·각성 두 먹귀 어디서도 수염·부리·얼굴이 읽히지 않는다.
  - 32px에서 '찢어진 먹귀'로 읽힌다.

#### F3 — 1배에서 먹침·망나니 침 탄의 몸이 어둡게 읽힌다(T4, 바이블 P1·§12.1)
- **본 렌더:** `k9r1-volley-shots-scene`·`-gray`(C12, 1배), `k9r1-c8-scene`(망나니 칸), `k9r1-shot-paper`(C9).
- **측정(C9, travel 0·1 기준, 종이/먹)**
  - 먹침 14~15% / 75~77%, 망나니 침 18~19% / 68~71%
  - 비교로, 밝게 읽히는 것: 서리침 33~34 / 63~65, 붓깃 32~33 / 51~53, K4 부채 단검 32 / 66
- **원인**
  - 먹침: `SHOT.inkDarts`(`k-icons2.js:632-633`)
    - 먹 쐐기가 앞 45%(x −0.35~+5.5, 반폭 3.2)를 차지한다.
    - 종이 몸은 반폭 1.8인데 외곽 1.5에 거의 덮인다.
    - 이것은 지시서 §4.4 사양 그대로다. 지시서도 고친다(§6).
  - 망나니 침: `SHOT.headsmanDarts`(`:741`)의 먹 등이 날 위 40%를 덮는다.
- **처방**
  - 먹침
    - 쐐기를 앞 30%(x +1.6~+5.5)로 줄인다. 담금 경계는 들쭉날쭉한 채로 둔다.
    - 종이 몸을 x −7.5~+1.6, 반폭 2.4로 넓힌다. 예: `M-7.5,-2 C-8.1,-1 -8.1,1 -7.5,2 L1.2,2.4 L1.6,3.2 … L1.6,-3.2 L1.2,-2.4 Z`.
    - 깃과 속도 획은 그대로 둔다.
  - 망나니 침
    - 먹 등을 두께 1.2 정도의 등 띠로 줄인다. 예: `M-2,-4.6 L2.8,-5.2 L6,-3.4 L5.2,-2.9 L2.6,-3.9 L-2,-3.3 Z`.
    - F1과 같은 문법이다. 아이콘과 탄은 같은 물건이어야 한다(§4.1).
- **바꾸면 안 되는 것**
  - 박스와 앵커: 먹침 46×20, (35,10) / 망나니 50×20, (39,10)
  - 앞끝 5.5·6.0, 옆 r+2.5 이하, 뒤 8r 이하(C7)
  - 청록 요소: 먹침 위 깃, 망나니 날선
  - 외곽 먹 1.5(바이블 §3)
- **합격 기준**
  - C9에서 두 탄의 travel 0·1이 종이 25% 이상, 먹 60% 이하다.
  - C12(1배 색·흑백)에서 두 탄 모두 몸의 가장 큰 덩어리가 종이로 읽힌다.
  - C7은 22줄 모두 ok다.

#### F4 — 32px HUD에서 청록 요소가 보이지 않는 셋(먹침·인장 화살·서리침)
- **본 렌더:** `k9r1-cyan-32`(C11, 32px 색, 한지 바탕), `k9r1-volley-32-40-color`.
  - 뇌침과 혼령은 뚜렷하다.
  - 붓깃·쌍날·망나니 침은 흐리지만 보인다.
  - 위 셋은 안 보인다. 핵심 부채 단검의 섬광도 흐리다.
- **문제:** 지시서 §2.5의 32px 행은 청록 요소를 남기고 짧은 변을 8 단위 이상으로 하라고 한다. 바이블 §12.4는 액티브에 청록 한 점을 둔다.
- **원인(코드상 굵기)**
  - 인장 화살: `cyanLine(rimD, 1.4, false)`(`:301`)라 청록 선이 1.4다.
  - 서리침: 침 끝 청록 구간(`:416-418`)의 밑변이 약 2.5다.
  - 먹침: 청록 깃(`:258`) 폭이 약 5이고, 테 2.2를 넣어도 약 7이다.
- **처방**
  - 인장 화살: `sealArrow()`의 `face`·`rimD`. 앞면 띠를 8로 넓히고, 안쪽을 청록 4.8(양쪽 먹 1.6)로 해 '청록 인주가 묻은 인면'으로 만든다.
  - 서리침: `frostNeedle()`. 침 폭 w를 7 → 9로 하고, 청록 구간을 앞 28% → 45%(t 0.55부터)로 늘린다. 청록 밑변이 먹 테를 넣어 8 정도가 된다.
  - 먹침: `dart()` 청록 깃. 바깥 오프셋을 `b+6.6` → `b+8.5`로 하고, 테를 2.2 → 1.6으로 줄인다.
- **바꾸면 안 되는 것:** 청록은 무기마다 한 가지(C4 nocyan 0), 늘 먹 위에(샌드위치), 낙관 구역 비움, 20px 주 덩어리.
- **합격 기준:** C11에서 volley 8종 모두 32px 색으로 청록 한 점 이상이 보인다.

### 5. 권장 (이번 수정에 함께 하면 좋고, 늦어도 2차 납품 때)

- **R1 블랙 스팟 하한**
  - 지시서 §2.2는 창 안 먹 면적 15~55%를 요구한다.
  - C10(평상판, 창 안 먹 면적) 측정
    - 인장 화살 13%, 뇌침 11%, 쌍날 15%
    - 망나니 침은 측정상 8%다. 찢긴 먹귀가 `<use>`라 표본에서 빠졌고, 그만큼(약 5%)을 더하면 약 13%로 추정한다.
    - 나머지: 먹침 18%, 붓깃 18%, 서리침 31%, 혼령 19%. 비교로 핵심 먹선 바늘 20%, 부채 단검 40%.
  - 15% 아래인 것은 낙관 구역과 다른 kind 자리(왼쪽 아래)를 피해 바탕 먹을 더한다. 3차 T3 때 함께 판정한다.
- **R2 쌍날 회전 호**
  - `bladeSpin()`(`:459-463`)이 날마다 호 둘(먹 3~4 + 종이 심)을 그린다.
  - 그래서 120px에서 동심 평행선 서너 줄로 보인다. §2.6의 '같은 간격 평행선' 경향이고, 지시서의 '종이 1.4 + 먹 0.8' 한 줄보다 무겁다.
  - 날마다 호 하나로 줄이거나, 두 호의 길이와 간격을 크게 다르게 한다.
- **R3 쌍날 각성판의 배치**
  - 흰 원판 셋이 원상 안에서 삼각으로 놓여 문장(三つ巴·삼태극) 쪽으로 읽힐 여지가 있다(`k9r1-zoom-twin-aw`). 회전이 고르지 않아 바람개비는 아니다.
  - 셋째(R 15) 날을 왼쪽 아래 뒤로 더 빼서 균형 잡힌 삼각을 깬다(`:467`).
  - 문화 검토 목록에도 올린다.
- **R4 인장 화살 탄**
  - 머리 비율이 길이 6 × 높이 9(`:664`)라서, 1배에서 세로로 날면 망치·의사봉(§2.6 공백 표식)처럼 보인다.
  - 머리를 x −1.5~+7.5, 반폭 3.8의 '도장 몸' 비율로 바꾼다.
  - 자루(`:663`, 먹 2.4)는 먹 2.4 안에 종이 심 0.9를 넣는다. 지금 종이 20%, 먹 64~66%다.
- **R5 각성 탄 겹 테**
  - `shot()`(`:618`)이 앞 3 단위를 세로 직선으로 잘라, 쌍날·망나니·인장 머리에서 테 끝이 칼로 자른 듯 남는다.
  - 몸 외곽을 x −3 옮긴 모양으로 자른다.
- **R6 먹침 아이콘이 미사일·만년필 뚜껑처럼 보인다**
  - 원인: 같은 간격의 실감기 셋(`:260`)과 쐐기의 담묵 빗면 줄(`:262`)이 공산품 느낌을 준다.
  - 실감기는 한 뭉치로, 빗면은 끊긴 마른 붓 한 획으로 바꾸고, 깃을 더 크게 한다.
- **R7 문서**
  - `API-icons2.md:244-254` §9 목록이 납품서 §4.2와 번호·항목이 다르다. 혼령 탄 자루가 3번에 합쳐져 있고, '쌍날 탄 회전'이 들어가 있다. 둘을 맞춘다.
  - `API-icons2.md:240`의 'C4~C8은 지시서 543~568줄 참조'는 지시서가 바뀌면 깨진다. 3차에서 명령 원문을 옮긴다.
  - 납품서 §4.2-4와 API §9-3의 '혼령 탄 종이 40% 이상'은 측정과 다르다. '종이 선과 담묵 테로 밝게 했다'로 고친다.
- **R8 서리침 서릿발 수**
  - 8개로, 지시서 5~7과 다르다(`:428`).
  - 그대로 두되 API에 '다르게 한 것'으로 적는다.

### 6. 지시서 정정 (`docs/art/briefs/arsenal-icons.md`, 메인 세션이 반영)
1. **§3.1 volley 벌어짐:** '14° 이하'로 두되 혼령 일제사격만 22° 이하로 예외를 둔다. §3.4 붓깃의 '±8°'는 '±7°'로 고친다.
2. **§4.3 종이 비율**
   - '칠한 넓이의 40% 이상을 종이'를 다음으로 바꾼다: '1배 흑백에서 몸의 가장 큰 덩어리가 종이로 읽힌다(C12). C9의 먹 비율이 65%를 넘으면 다시 본다.'
   - 이유: 외곽 1.5를 넣어 재면 기존 K4 탄도 40%에 못 미친다(결 바늘 9%, 부채 단검 32%, 분신 탄 22%).
3. **§4.4 먹침 탄:** '앞 45% 먹 쐐기'를 '앞 30% 먹 쐐기, 뒤 종이 몸 반폭 2.4'로 고친다. 아이콘은 45% 그대로 둔다.
4. **§4.4 인장 화살 탄(권장, R4):** 머리를 '−1.5~+7.5, 반폭 3.8'로, 자루를 '먹 2.4 + 종이 심 0.9'로 고친다.
5. **§2.5 32px 청록:** '짧은 변 8 단위 이상'에 '먹 테 포함, 청록 심 3.2 이상, C11로 확인'을 덧붙인다.
6. **§5.2:** 아래 C9~C12를 더하고, §5.1 T4의 근거로 C12를 쓴다.

### 7. 재검수 때 돌릴 명령
- 기존 명령은 모두 그대로 다시 돌린다: C1, C2-volley, C4, C5(값이 같아야 한다), C6(1배·6배), C7(22줄 ok), C8(1배·0.8배·흑백), T1, T2(평상·각성).
- 측정 명령(C9·C10)은 필터·clip·`<use>`·묶음 opacity를 무시하는 근사 측정이다.
- 새로 더하는 명령:

```
node scripts/art-review-sheet.mjs expr --name k9-c9-paper --scale 1 --crop 0,0,1400,420 --expr '(function(){var X=PN.arsenal,S=PN.skillVfx,NS="http://www.w3.org/2000/svg",L=[];var C={"#faf6ec":"p","#f3eee2":"p","#d8d0c0":"p","#fffff8":"p","#121110":"k","#2b2926":"k","#46423d":"k","#101312":"k","#8c8579":"t","#bcb4a5":"t","#00a8c6":"c","#007c94":"c","#cff6ff":"c"};function hex(v){var m=v.match(/[\d.]+/g);if(!m)return v;return "#"+m.slice(0,3).map(function(x){return ("0"+Math.round(+x).toString(16)).slice(-2);}).join("");}function meas(mk,box){var s=document.createElementNS(NS,"svg");s.setAttribute("width",box[0]);s.setAttribute("height",box[1]);s.innerHTML=mk;document.body.appendChild(s);var els=[].slice.call(s.querySelectorAll("path,circle,ellipse,rect,polygon,polyline,line")).filter(function(e){return !e.closest("clipPath,defs,mask,pattern");});var info=els.map(function(e){var cs=getComputedStyle(e);return {e:e,inv:e.getCTM().inverse(),st:cs.stroke!=="none"&&parseFloat(cs.strokeWidth)>0?hex(cs.stroke):null,fi:cs.fill!=="none"?hex(cs.fill):null};}).reverse();var n={p:0,k:0,t:0,c:0,x:0},st=0.25,pt=s.createSVGPoint();for(var y=0;y<box[1];y+=st)for(var x=0;x<box[0];x+=st){pt.x=x;pt.y=y;for(var i=0;i<info.length;i++){var q=info[i],lp=pt.matrixTransform(q.inv),col=null;if(q.st&&q.e.isPointInStroke(lp))col=q.st;else if(q.fi&&q.e.isPointInFill(lp))col=q.fi;if(col){n[C[col]||"x"]++;break;}}}s.remove();var tot=n.p+n.k+n.t+n.c+n.x;return "paper "+Math.round(100*n.p/tot)+"% ink "+Math.round(100*n.k/tot)+"% ink300 "+Math.round(100*n.t/tot)+"% cyan "+Math.round(100*n.c/tot)+"% other "+Math.round(100*n.x/tot)+"% (area "+(tot*st*st).toFixed(0)+")";}X.ids.filter(function(id){return X.META[id].done;}).forEach(function(id){var P={};X.parts(id).forEach(function(p){P[p.part]=p;});[["travel",0],["travel",1],["start",1],["end",0]].forEach(function(q){L.push(id+" "+q[0]+q[1]+": "+meas(X.stamp(id,q[0],{frame:q[1]}),P[q[0]].box));});});[["needleStorm","travel"],["fanKnives","travel"],["mirrorClone","shot-travel"]].forEach(function(g){var p=S.parts(g[0]).filter(function(x){return x.part===g[1];})[0];L.push("K4 "+g[0]+" "+g[1]+"0: "+meas(S.stamp(g[0],g[1],{frame:0}),p.box));});return "<rect width=\"1400\" height=\"420\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(12+i*11.6)+"\" font-size=\"10\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'

node scripts/art-review-sheet.mjs expr --name k9-c10-ink --scale 1 --crop 0,0,1300,160 --expr '(function(){var X=PN.arsenal,I=PN.icons,NS="http://www.w3.org/2000/svg",L=[];var C={"#faf6ec":"p","#f3eee2":"p","#d8d0c0":"p","#fffff8":"p","#efe6d2":"p","#121110":"k","#2b2926":"k","#46423d":"k","#101312":"k","#000000":"k","#8c8579":"t","#bcb4a5":"t","#00a8c6":"c","#007c94":"c","#cff6ff":"c"};function hex(v){if(!v||v.indexOf("url")>=0)return "url";var m=v.match(/[\d.]+/g);if(!m)return v;return "#"+m.slice(0,3).map(function(x){return ("0"+Math.round(+x).toString(16)).slice(-2);}).join("");}function meas(mk){var s=document.createElementNS(NS,"svg");s.setAttribute("width",128);s.setAttribute("height",128);s.innerHTML=mk;document.body.appendChild(s);var info=[];[].slice.call(s.querySelectorAll("path,circle,ellipse,rect,polygon,polyline,line")).forEach(function(e){if(e.closest("clipPath,defs,mask,pattern"))return;if(e.tagName==="rect"&&e.getAttribute("filter"))return;var cs=getComputedStyle(e),m=e.getCTM(),b=e.getBBox(),sw=parseFloat(cs.strokeWidth)||0;var P=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(function(p){var q=s.createSVGPoint();q.x=p[0];q.y=p[1];return q.matrixTransform(m);});var xs=P.map(function(p){return p.x;}),ys=P.map(function(p){return p.y;}),pad=sw*2+1;info.push({e:e,inv:m.inverse(),x0:Math.min.apply(0,xs)-pad,x1:Math.max.apply(0,xs)+pad,y0:Math.min.apply(0,ys)-pad,y1:Math.max.apply(0,ys)+pad,st:cs.stroke!=="none"&&sw>0?hex(cs.stroke):null,fi:cs.fill!=="none"?hex(cs.fill):null});});info.reverse();var n={p:0,k:0,t:0,c:0,x:0},pt=s.createSVGPoint();for(var y=0.5;y<128;y+=1)for(var x=0.5;x<128;x+=1){pt.x=x;pt.y=y;for(var i=0;i<info.length;i++){var q=info[i];if(x<q.x0||x>q.x1||y<q.y0||y>q.y1)continue;var lp=pt.matrixTransform(q.inv),col=null;if(q.st&&q.e.isPointInStroke(lp))col=q.st;else if(q.fi&&q.e.isPointInFill(lp))col=q.fi;if(col){n[C[col]||"x"]++;break;}}}s.remove();var T=n.p+n.k+n.t+n.c+n.x;function pc(v){return Math.round(100*v/T)+"%";}return "ink "+pc(n.k)+" paper "+pc(n.p)+" ink300 "+pc(n.t)+" cyan "+pc(n.c)+" other "+pc(n.x);}X.ids.filter(function(id){return X.META[id].done;}).forEach(function(id){L.push(id+": "+meas(X.skill(id,{})));});["needleStorm","fanKnives","mirrorClone","railSpear"].forEach(function(id){L.push("core "+id+": "+meas(I.skill(id,{})));});return "<rect width=\"1300\" height=\"160\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(12+i*12)+"\" font-size=\"10\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'

node scripts/art-review-sheet.mjs expr --name k9-c11-cyan32 --scale 1 --crop 0,0,400,48 --expr '(function(){var X=PN.arsenal,I=PN.icons,s="<rect width=\"400\" height=\"48\" fill=\"#efe6d2\"/>",L=[["c","needleStorm"],["c","fanKnives"],["c","mirrorClone"],["a","inkDarts"],["a","brushQuills"],["a","sealArrows"],["a","frostNeedles"],["a","thunderNeedles"],["a","twinBlades"],["a","ghostVolley"],["a","headsmanDarts"]];L.forEach(function(it,i){var m=it[0]==="c"?I.hudSlot(it[1],{size:40}):X.hudSlot(it[1],{size:40});s+="<g transform=\"translate("+(4+i*36)+",3) scale(0.80357)\">"+m+"</g>";});return s;})()'

node scripts/art-review-sheet.mjs expr --name k9-c12-volley-scene --scale 1 --check --crop 0,0,420,130 --expr '(function(){var X=PN.arsenal,S=PN.skillVfx,s=PN.env.ground(1,420,130,3,{center:null,canalY:false,rose:null,ringC:null});function es(x,y,r){return "<circle cx=\""+x+"\" cy=\""+y+"\" r=\""+(r+1.2)+"\" fill=\"#101312\"/><circle cx=\""+x+"\" cy=\""+y+"\" r=\""+r+"\" fill=\"#ef5b4f\"/><circle cx=\""+x+"\" cy=\""+y+"\" r=\""+(r-2.4)+"\" fill=\"#101312\"/><circle cx=\""+(x-1)+"\" cy=\""+(y-1)+"\" r=\"1.2\" fill=\"#fffff8\"/>";}var V=X.ids.filter(function(id){return X.META[id].kind==="volley";});[["travel",20],["travel-awakened",62]].forEach(function(row,ri){V.forEach(function(id,i){var P={};X.parts(id).forEach(function(p){P[p.part]=p;});var p=P[row[0]],a=[0,-30,200,150,30,-120,90,330][i],x=30+i*46,y=row[1]+(i%2)*8;s+="<g transform=\"translate("+x+","+y+") rotate("+a+") translate("+(-p.anchor[0])+","+(-p.anchor[1])+")\">"+X.stamp(id,row[0],{frame:0})+"</g>";});});var np=S.parts("needleStorm").filter(function(x){return x.part==="travel";})[0];s+="<g transform=\"translate(60,108) rotate(-20) translate("+(-np.anchor[0])+","+(-np.anchor[1])+")\">"+S.stamp("needleStorm","travel",{frame:0})+"</g>";var fp=S.parts("fanKnives").filter(function(x){return x.part==="travel";})[0];s+="<g transform=\"translate(130,108) rotate(15) translate("+(-fp.anchor[0])+","+(-fp.anchor[1])+")\">"+S.stamp("fanKnives","travel",{frame:0})+"</g>";s+=es(200,108,7)+es(240,104,7)+es(280,110,8)+PN.heroKit.placeSprite("run",2,360,118,1);return s;})()'

node scripts/art-review-sheet.mjs expr --name k9-fix-headsman-x8 --scale 8 --crop 50,40,230,90 --expr '(function(){var X=PN.arsenal;return "<g>"+X.skill("headsmanDarts",{})+"</g><g transform=\"translate(148,0)\">"+X.skill("headsmanDarts",{awakened:true})+"</g>";})()'
```

- C12 흑백판: C8과 같은 방식으로 끝의 `return s;`를 `feColorMatrix saturate 0` 필터로 감싸고, 이름을 `-gray`로 바꿔 `--check` 없이 돌린다.

### 8. 합격(재검수 통과) 뒤 메인 세션이 할 것과 확인할 것
- 납품서 §5의 등록값은 검증했다.
  - `scripts/build-ui-art.mjs:17`과 `scripts/build-atlas.mjs:11`의 `KIT_FILES`에 `'k-icons2.js'`를 `'k-icons.js'` 바로 뒤에 넣는다.
  - 시트는 Q1대로 따로 둔다. 1차 크기: `arsenal-tiles` 2656×664, `arsenal-slots` 1008×240.
  - 탄은 8종 × 12장 = 96장이고, 박스 넓이 합 112,416 단위²가 맞다.
  - 렌더러 위치 `worldRenderer.ts:85`, `:1337`, `:1359-1362`가 실제 코드와 맞는다.
  - `readSkillVfx`(`build-atlas.mjs:147-162`)는 `window`를 옮기지 않으므로 PN.arsenal 조각을 읽게 해도 한글 검사에 걸리지 않는다.
- 각성 조각이 없을 때 평상 조각으로 떨어지게 하는 것을 권한다(지시서 §7-2).
- 돌릴 것: `npm run build:ui-art`, `node scripts/build-arsenal-art.mjs`(done 키의 배지 제거, `src/ui/uiArt.test.ts:53-56`), `npm run build:atlas`, `npm run test:unit`, `npm run build`(초기 에셋 예산), `npm run bench:packs`.
- `npm run test:visual`에서 볼 장면
  - 드래프트: 망나니 침(전설)·혼령(영웅) 평상과 각성 카드 하나
  - HUD 45px: 먹침·인장 화살·서리침 포함 6슬롯 + 각성 준비 배지. F4 청록을 실제 HUD 크기로 확인한다
  - 일시정지 40px, 정산 28px, 좁은 창 34px
  - 전투 1.0배·0.8배: volley 8종 평상·각성 탄
    - Ch1 바닥과, 바닥이 가장 어두운 Ch5 바닥(Y 0.385) 둘 다
    - 먹침이 많이 나는 고밀도 장면(적 200 + 적 탄 120 + 아군 탄 150)에서 F3 명도를 확인한다

### 9. 사람 클린업 · 미확인
- **사람 클린업:** 납품서 §6 목록에 동의한다. 더할 것:
  - 망나니 칼 머리 실루엣, 찢긴 먹귀의 먹 튐
  - 서릿발 꼴(흰 꽃잎·불꽃처럼 보일 기미)
  - 기절 나선(작은 크기에서 '@')
  - 쌍날 각성 배치의 문화 검토
- **미확인**
  - 실제 게임 화면의 무기 타일·슬롯·탄: 등록 전이라 `npm run test:visual`로 봐야 한다.
  - 0.8·1.2배로 다시 굽거나 표시 크기를 바꿨을 때의 탄 픽셀
  - T3 정식 판정(3차)과 정식 판독 시험(n ≥ 8)
  - C9·C10 측정은 근사치다. 필터·clip·`<use>`·묶음 opacity를 무시하고, 망나니 아이콘은 먹귀가 빠진 값이다.
- **열린 질문:** 새로 팀 결정이 필요한 것은 없다. Q7(20px 전용판)을 판단할 때 각성판 20px도 함께 본다.

**관련 파일:**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-icons.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`

---

## 1차 수정 1회차 납품서 — 무기 아이콘·탄 (`PN.arsenal`, volley 8종)

(되살림: 서브에이전트 기록 `agent-a7c1c9697e5fa5666`(kit-artist, 'K9 arsenal icons kit, part 1')의 SubagentHandback 원문, 2026-10-15 07:45 KST. 메인 세션이 이 파일에 넣었던 글과 같은 추출이다(세션 기록 `75a03af2-….jsonl` 줄 42574, 추출 길이 일치). 머리말 단계만 이 파일에 맞췄다.)

작성: kit-artist, 2026-10-15. 검수서 `docs/art/deliveries/K9-arsenal-icons.md` '## 검수 1차'를 반영했다. 연결이 끊긴 뒤 두 파일을 다시 확인했고, 빠져 있던 API 문서 갱신(R7·R8)과 아래 '이번에 마저 고친 것'까지 모두 들어가 있다.

**요약**
- 필수 F1~F4: 모두 고쳤다. 합격 기준 수치(C9·C11)는 기준 안이다.
- 권장 R1~R8: 모두 반영했다. R1 쌍날만 측정 방식에 따라 하한 아래로 나온다(§4 R1).
- 명령: 검수서 §7 명령을 모두 다시 돌렸다. 렌더 이름은 `k9-fix1-`로 시작한다.
  - `--check`를 붙인 명령은 모두 `ok`다.
  - C4·C5는 기준값과 글자 하나 다르지 않다.
  - C7은 22줄 모두 ok다.
  - kit error는 0건이다.
- 처방과 다르게 한 곳이 다섯 군데 있다(§4.3).
  - F2 먹 튐을 위 둘·아래 둘 대신 아래 셋으로 했다.
  - 먹침 탄의 깃을 옮겼다.
  - 망나니 칼 머리 자리가 처방만큼 늘었다.
  - R5 테를 clip 대신 옮긴 사본에 둘렀다.
  - 서릿발은 8개로 두었다(R8).
- 손댄 파일은 맡은 두 개뿐이다. 아무것도 내려받지 않았다.

### 1. 납품 목록

| 파일 | 내용 |
|---|---|
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js` | `window.PN.arsenal` v1.0. API·META·조각 규격은 1차와 같다. volley 8종 그림만 바꿨다 |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md` | 바꾼 절: 납품 차례 표, §2 줄 번호, §6, §7.3, §7.4, §8, §9, §10 |

API-icons2.md에서 바꾼 내용
- §6: 아이콘 표. 바뀐 곳마다 '수정 1회차' 표시
- §7.3: 각성 테 규칙
- §7.4: 탄 표, C9 값, 쌍날 회전 메모(1차 §9에서 옮김)
- §8: C9~C12와 망나니 8배를 표에 더했다. C4~C12 명령 원문을 모두 옮겼다(R7)
- §9: 9.1 = 납품서 §4.2와 같은 번호 1~9. 9.2 = 이번에 더한 10~15. 서릿발 8개는 9-10(R8)
- §10: C10 값, 사람 클린업 추가

- `done` 목록은 그대로 8종이다(inkDarts, brushQuills, sealArrows, frostNeedles, thunderNeedles, twinBlades, ghostVolley, headsmanDarts).
- 상태 수는 1차와 같다: 무기마다 아이콘 평상·각성, 타일·슬롯, 탄 6조각 × 2장.

### 2. API 요약 (1차와 같음)

- 아이콘 마스터는 128 × 128이다.
- 타일: `tile(id,{awakened,metal:true,size:150})`, 칸 166 × 166, 원점 (−8, −8).
- 슬롯: `hudSlot(id,{size:40,awakened})`, 칸 56 × 60, 원점 (−2, −2).
- 낙관 피할 구역은 (94~128, 0~34)다.
- 탄 앵커 = 판정 원 중심, +x = 속도 방향이다.
- 박스·앵커는 r별로 같다(r 4: 46×20/(35,10) … r 6: 64×24/(51,12)).
- 판정은 바뀌지 않았다(V4).
- C7 실측에서 바뀐 값은 먹침 옆 4.8 → 5.8 하나다(허용 6.5).

### 3. 검사 결과

#### 3.1 명령과 결과
- 명령은 검수서 §7과 지시서 §5.2 원문 그대로다. 이름만 `k9-fix1-…`로 바꿨다.
- 모든 명령을 최종 코드로 다시 돌렸다. 탄만 쓰는 C6·C8·C9·C12는 마지막 탄 수정 뒤에 돌렸고, 그 뒤 탄 코드는 바뀌지 않았다.

| 명령 | 결과 |
|---|---|
| C1 `k9-fix1-c1-all` (0.25, `--check`) | ok |
| C2 `k9-fix1-c2-volley` (`--check`) | ok. 평상 타일 8종의 산호 점선 네모(낙관 구역)가 비어 있다 |
| C4 `k9-fix1-c4-scan` | 아래 원문 |
| C5 `k9-fix1-c5-unchanged` | 아래 원문. 기준값과 같다 |
| C6 `k9-fix1-c6-shots` (1배), `-x6` (6배, volley 줄) | 둘 다 `--check` ok |
| C7 `k9-fix1-c7-meta` | 아래 원문. 22줄 ok |
| C8 `k9-fix1-c8-scene` (1배), `-08`, `-x3` | 셋 다 `--check` ok |
| C8 흑백 `-gray` | 모든 탄이 밝은 몸이다. 적 탄은 검은 알 + 밝은 테로 갈린다 |
| C9 `k9-fix1-c9-paper` | 아래 원문 |
| C10 `k9-fix1-c10-ink` | 아래 원문 |
| C11 `k9-fix1-c11-cyan32` | 글자 출력이 없는 렌더다. 판정은 §4 F4 |
| C12 `k9-fix1-c12-volley-scene` | `--check` ok |
| C12 흑백 `-gray` | 필터 id `k9g12` |
| T1 `k9-fix1-t1-looks` | 본 결과는 §4 |
| T2 `k9-fix1-t2-kinds`, `-awakened` | 본 결과는 §4 |
| `k9-fix1-headsman-x8` | 검수서의 `k9-fix-headsman-x8` 명령. 본 결과는 F1·F2 |

**C4 원문**
```
icons bad=0 text=0 hatch=0 nocyan=0
stamps bad=0 text=0 filter=0 nocyan=0 colours={}
```
**C5 원문**
```
icons-all=19vh262 len=2634966 list=17 ICON=17 | skillvfx-all=1xq1i37 len=698432 groups=18
```
**C7 원문**
```
meta ok | invalid calls ok | core list=17
inkDarts r=4 front=5.5 back=23.5 side=5.8 ok
brushQuills r=5 front=6.2 back=19.5 side=5.9 ok
sealArrows r=6 front=7.5 back=44.5 side=7.1 ok
frostNeedles r=4.5 front=6.0 back=32.1 side=5.3 ok
thunderNeedles r=4.5 front=6.0 back=16.0 side=5.3 ok
twinBlades r=6 front=6.5 back=15.3 side=7.8 ok
ghostVolley r=5 front=6.5 back=24.4 side=5.9 ok
headsmanDarts r=4.5 front=6.0 back=27.0 side=5.3 ok
paperStorm r=5 front=6.0 back=16.0 side=1.7 ok
inkBloom r=4.5 front=5.5 back=14.8 side=1.7 ok
thornHalo r=4 front=5.0 back=13.6 side=1.7 ok
starShards r=5.5 front=6.5 back=17.2 side=1.7 ok
sunNeedles r=5 front=6.0 back=16.0 side=1.7 ok
inkDrizzle r=3.5 front=4.5 back=12.4 side=1.7 ok
pinHail r=4.5 front=5.5 back=14.8 side=1.7 ok
tailGuard r=5 front=6.0 back=16.0 side=1.7 ok
smokeTail r=4.5 front=5.5 back=14.8 side=1.7 ok
gravePins r=4.5 front=5.5 back=14.8 side=1.7 ok
trackingSeals r=4.5 front=5.5 back=14.8 side=1.7 ok
huntersMarks r=5 front=6.0 back=16.0 side=1.7 ok
crowFeathers r=5 front=6.0 back=16.0 side=1.7 ok
bossbane r=5.5 front=6.5 back=17.2 side=1.7 ok
```
**C9 원문**
```
inkDarts travel0: paper 34% ink 58% ink300 6% cyan 2% other 0% (area 102)
inkDarts travel1: paper 34% ink 57% ink300 8% cyan 2% other 0% (area 104)
inkDarts start1: paper 36% ink 59% ink300 5% cyan 0% other 0% (area 93)
inkDarts end0: paper 35% ink 58% ink300 6% cyan 1% other 0% (area 102)
brushQuills travel0: paper 33% ink 51% ink300 14% cyan 3% other 0% (area 112)
brushQuills travel1: paper 33% ink 52% ink300 12% cyan 3% other 0% (area 110)
brushQuills start1: paper 32% ink 53% ink300 12% cyan 3% other 0% (area 107)
brushQuills end0: paper 33% ink 51% ink300 13% cyan 3% other 0% (area 112)
sealArrows travel0: paper 34% ink 51% ink300 12% cyan 3% other 0% (area 178)
sealArrows travel1: paper 34% ink 51% ink300 12% cyan 3% other 0% (area 178)
sealArrows start1: paper 35% ink 53% ink300 8% cyan 3% other 0% (area 172)
sealArrows end0: paper 34% ink 51% ink300 12% cyan 3% other 0% (area 178)
frostNeedles travel0: paper 33% ink 65% ink300 0% cyan 2% other 0% (area 98)
frostNeedles travel1: paper 34% ink 64% ink300 0% cyan 2% other 0% (area 97)
frostNeedles start1: paper 34% ink 63% ink300 0% cyan 2% other 0% (area 90)
frostNeedles end0: paper 34% ink 64% ink300 0% cyan 2% other 0% (area 98)
thunderNeedles travel0: paper 26% ink 54% ink300 0% cyan 20% other 0% (area 101)
thunderNeedles travel1: paper 26% ink 55% ink300 0% cyan 19% other 0% (area 99)
thunderNeedles start1: paper 27% ink 57% ink300 0% cyan 16% other 0% (area 84)
thunderNeedles end0: paper 24% ink 59% ink300 0% cyan 17% other 0% (area 92)
twinBlades travel0: paper 27% ink 58% ink300 11% cyan 4% other 0% (area 120)
twinBlades travel1: paper 27% ink 60% ink300 9% cyan 4% other 0% (area 117)
twinBlades start1: paper 26% ink 64% ink300 5% cyan 4% other 0% (area 110)
twinBlades end0: paper 27% ink 59% ink300 9% cyan 4% other 0% (area 118)
ghostVolley travel0: paper 17% ink 21% ink300 46% cyan 15% other 0% (area 95)
ghostVolley travel1: paper 18% ink 21% ink300 50% cyan 11% other 0% (area 88)
ghostVolley start1: paper 19% ink 18% ink300 52% cyan 11% other 0% (area 85)
ghostVolley end0: paper 17% ink 21% ink300 46% cyan 16% other 0% (area 95)
headsmanDarts travel0: paper 34% ink 54% ink300 7% cyan 6% other 0% (area 94)
headsmanDarts travel1: paper 33% ink 53% ink300 8% cyan 6% other 0% (area 96)
headsmanDarts start1: paper 34% ink 55% ink300 5% cyan 6% other 0% (area 92)
headsmanDarts end0: paper 33% ink 54% ink300 7% cyan 6% other 0% (area 94)
K4 needleStorm travel0: paper 9% ink 59% ink300 0% cyan 31% other 0% (area 149)
K4 fanKnives travel0: paper 32% ink 66% ink300 0% cyan 1% other 0% (area 141)
K4 mirrorClone shot-travel0: paper 22% ink 17% ink300 47% cyan 14% other 0% (area 87)
```
**C10 원문**
```
inkDarts: ink 18% paper 81% ink300 0% cyan 0% other 0%
brushQuills: ink 18% paper 82% ink300 1% cyan 0% other 0%
sealArrows: ink 15% paper 84% ink300 0% cyan 0% other 0%
frostNeedles: ink 32% paper 68% ink300 0% cyan 1% other 0%
thunderNeedles: ink 15% paper 83% ink300 0% cyan 2% other 0%
twinBlades: ink 15% paper 85% ink300 0% cyan 0% other 0%
ghostVolley: ink 19% paper 76% ink300 3% cyan 2% other 0%
headsmanDarts: ink 10% paper 90% ink300 0% cyan 1% other 0%
core needleStorm: ink 20% paper 79% ink300 0% cyan 1% other 0%
core fanKnives: ink 40% paper 54% ink300 0% cyan 0% other 5%
core mirrorClone: ink 55% paper 43% ink300 0% cyan 2% other 0%
core railSpear: ink 29% paper 64% ink300 5% cyan 1% other 0%
```

**C10 보조 측정** `k9-fix1-c10u-ink`
- C10 식을 그대로 쓰되 두 가지를 더했다: `<use>`를 펼치고 clip을 반영한다. 소수 한 자리다.
- 결과는 '먹 C10 / 보조' 순서다.
  - 먹침 18.5 / 18.5, 붓깃 17.5 / 17.5
  - 인장 화살 15.5 / 15.4, 서리침 31.6 / 31.6, 뇌침 15.4 / 15.3
  - 쌍날 14.8 / 12.4, 혼령 19.5 / 19.4, 망나니 침 9.6 / 15.2
- 망나니 침은 C10이 찢긴 먹귀(`<use>`)를 빼고 잰다.
- 쌍날은 C10이 날 안쪽 먹 등의 clip을 무시해 크게 잡는다.

#### 3.2 직접 본 렌더
- 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`
- 모두 최종 코드로 렌더한 것이다.

**게임 크기**
- `k9-fix1-c2-volley`
- `k9-fix1-c11-cyan32`
- `k9-fix1-t1-looks`, `k9-fix1-t2-kinds`, `k9-fix1-t2-kinds-awakened`
- `k9-fix1-c6-shots`
- `k9-fix1-c8-scene`, `-08`, `-gray`
- `k9-fix1-c12-volley-scene`, `-gray`

**확대**
- `k9-fix1-icons8` (2배, 8종 평상·각성, 낙관 구역 표시)
- `k9-fix1-headsman-x8`
- `k9-fix1-torn-x10`, `k9-fix1-torn-aw-x10` (먹귀 10배)
- `k9-fix1-t2-kinds-zoom` (volley 줄 3배)
- `k9-fix1-c6-shots-x6`, `k9-fix1-c8-scene-x3`, `k9-fix1-c12-volley-scene-x3`
- `k9-fix1-darts-shot-x8` (먹침 탄 8장)
- `k9-fix1-icon-twinBlades` (3배)
- 글자 출력: `k9-fix1-c9-paper`(+ 읽기용 `-x2`), `k9-fix1-c1-all`

**작업 중에 보고 대체된 렌더:** `k9-fix1-r1-icons-x3`, `k9-fix1-r1-thunder-x6`, `k9-fix1-icon-thunder-x4`, `k9-fix1-t1-looks-zoom`, `k9-fix1-c2-volley-zoom`, `k9-fix1-c11-cyan32-x3`, `k9-fix1-t2-kinds-awakened-zoom`.

### 4. 지시서(검수서) 대비

#### 4.1 필수

**F1 망나니 칼 머리** (`k-icons2.js:553-573`)
- 고친 것(처방 1~4 그대로)
  - belly를 끝 쪽이 가장 넓은 팔치온 꼴로 바꿨다.
  - 먹 등을 위 가장자리 띠(두께 3~4)로 줄이고, 날 몸은 종이로 두었다.
  - p300 그늘과 청록 날선을 새 배 곡선 2~3 안쪽으로 옮겼다.
  - 마이터 끝을 달았다: 종이 삼각 [33,−11.6]→[40,−11]→[34,−7.4] + 먹 테 2.6.
  - 칼 목(먹 띠, x −4~0, s −7~+5.5)을 넣었다.
  - 처방 5: 먹 면적은 먹귀 아래 땅의 먹 튐으로 메웠다(R1 참조).
- 지킨 것: 1.12배, 낙관 구역 비움, 청록 하나(날선), 각성판 구성(0.72배 칼 + 둘째 먹귀).
- 확인
  - `headsman-x8`: 곧은 등, 등선 너머 뾰족한 끝, 칼 목에 꽂힌 외날로 읽힌다. 국자·사발 단면은 없어졌다.
  - T2 20px 흑백: 뇌침(굵고 밝은 지그재그 + 오른쪽 먹 터짐)과 망나니(가는 대각 자루 + 칼 머리 고리 + 오른쪽 아래 먹귀)가 계속 갈린다.

**F2 찢긴 먹귀의 먹 튐** (`k-icons2.js:199-231`)
- 지킨 것: 7계단 찢김선(종이 테 없음), `open`, `<use>` 구조, seed.
- 먹 튐 배치
  - 시작점을 찢김선 t −0.75·0.15·0.9 r에 흩었다.
  - 방향은 찢김선 기준 104°·88°·66°로 거의 수직이고, 아래로 떨어진다.
  - 길이 9·5.5·11, 굵기 3·2.6·3.4로 서로 다르다. 가장 긴 가닥 끝에 떨어진 먹 방울을 달았다.
  - 각 가닥은 찢김선에서 수직으로 그은 선이 윤곽을 나가는 자리에서 시작한다. 몸 안에서 시작하면 뿔이나 이마 점으로 보였다.
  - 한 점에서 갈라지는 가닥이 없다. 오른쪽 윤곽 밖으로는 약 0.5r까지만 나간다.
- 처방과 다른 점(§4.3-1): 위 조각에서 위로 던지는 가닥은 뺐다.
- 확인
  - `torn-x10`·`torn-aw-x10`·`headsman-x8`: 평상·각성 두 먹귀 어디에도 수염·부리·고양이 얼굴·더듬이가 없다.
  - 32px(T1·T2): 비스듬히 들린 윗부분과 아래로 떨어지는 먹으로 '찢어진 먹귀'로 읽힌다.

**F3 1배에서 몸이 어두운 탄**
- 먹침 `SHOT.inkDarts` (`k-icons2.js:682-694`)
  - 쐐기를 앞 30%(+1.6~+5.5)로 줄이고, 담금 경계는 들쭉날쭉하게 두었다.
  - 종이 몸은 처방 예시 경로 그대로다(−7.5~+1.6, 반폭 2~2.4).
- 망나니 침 `SHOT.headsmanDarts` (`k-icons2.js:793-802`)
  - 먹 등을 처방 예시대로 두께 약 1.2의 띠로 줄였다.
  - 자루에 종이 심 0.6을 넣었다(먹 1.7).
- 합격 수치(C9 travel 0·1, 종이 / 먹)
  - 먹침 34 / 58, 34 / 57
  - 망나니 침 34 / 54, 33 / 53
  - 기준은 종이 25% 이상, 먹 60% 이하다.
- 1차 측정값은 먹침 14~15 / 75~77, 망나니 18~19 / 68~71이었다.
- 박스·앵커·앞끝·외곽 1.5와 청록 요소는 그대로다. C7은 22줄 ok다.
- C12(색·흑백, 3배 확인): 두 탄 모두 몸의 가장 큰 덩어리가 종이로 읽힌다.

**F4 32px 청록**
- 인장 화살 (`k-icons2.js:305-321`): 앞면 띠를 8로 넓혔다(먹 1.6 · 청록 인주 4.8 · 먹 1.6). glow 세로 획을 더했다.
- 서리침 (`:447-454`): 폭 7 → 9, 청록을 t 0.55부터(앞 45%)로 늘렸다. 청록 밑변은 약 6, 먹 테 1.4를 넣으면 약 7.4다.
- 먹침 (`:257-280`): 깃 바깥을 반폭 + 6.6 → + 8.5로, 테를 2.2 → 1.6으로 했다.
- 함께 한 것
  - 붓깃 끝 점: r 3 → 3.6(검수 §2.3 '흐림').
  - 쌍날·망나니 날선: 청록 2.4(먹 테 포함 4.8).
- C11(1배 색, 한지 바탕): volley 8종 모두 청록 한 점 이상이 보인다.
  - 뚜렷함: 뇌침, 혼령, 인장 앞면, 서리침 끝
  - 보임: 먹침 깃, 붓깃 점
  - 흐리지만 보임: 쌍날·망나니 날선

#### 4.2 권장

**R1 블랙 스팟 하한**
- 인장 화살 (`:322-342`): 먹 꼬리 폭 34, 맨 앞 먹귀의 끌림 획 2배(`knocked` 옵션 `dw`).
- 뇌침 (`:378-405`)
  - 과녁 뒤로 오른쪽에 치우친 납작하고 거친 탄 자국: (115, 72), r 30, 세로 0.82, 방울 셋.
  - 번개 그림자 쪽 먹 사본: `boltAround` 옵션 `shadow`, `:362-365`.
  - 먹귀 등 쪽 종이 끊김 호. 둥근 덩어리로 그리면 먹귀를 삼켜 검은 공으로 읽혀서 넣었다.
- 망나니 침 (`:574-588`)
  - 먹귀 오른쪽 아래 땅에 거친 먹 튐 + 방울 셋.
  - 자루 5 → 6.
- 결과(C10 / 보조 측정)
  - 인장 화살 15 / 15.4
  - 뇌침 15 / 15.3
  - 망나니 침 10 / 15.2
  - 1차 C10은 13 / 11 / 8(추정 13)이었다.
- 쌍날: C10은 15이지만, clip을 반영하면 12.4로 하한 아래다. 검수서대로 3차 T3 때 판정한다.

**R2 쌍날 회전 호** (`:493-499`)
- 날마다 호 하나로 줄였다: 반지름 R+5, 110°, 먹 3 → 0.4 안에 종이 1.4 → 0.2.
- 동심 평행선은 없어졌다.

**R3 쌍날 각성 배치** (`:500-513`)
- 셋째 날(R 15)을 왼쪽 아래 뒤 (22, 93)으로 빼서 원상 안의 고른 삼각을 깼다.
- 문화 검토 목록에 올렸다.

**R4 인장 화살 탄** (`:714-725`)
- 머리를 −1.5~+7.5, 반폭 3.8로 바꿨다.
- 자루는 먹 2.4 안에 종이 심 0.9를 넣었다.
- C9: 종이 34 / 먹 51(1차 20 / 64~66).
- C8 3배에서 세로로 날 때도 도장 몸으로 읽힌다.

**R5 각성 탄 겹 테** (`:666-672`): 세로 clip을 없앴다. 몸 외곽선 사본을 x −3 옮겨 테를 두른다(§4.3-4). C7 앞끝 값은 그대로다.

**R6 먹침 아이콘** (`:257-280`)
- 같은 간격 실감기 셋 → 손으로 감은 한 뭉치
- 담묵 빗면 줄 → 끊긴 마른 붓 두 획
- 깃을 키웠다(F4와 같이).

**R7 문서**
- API §9를 납품서 §4.2 번호(1~9)에 맞췄다. 혼령 탄 자루는 4번으로 나눴고, '쌍날 탄 회전'은 §7.4 메모로 옮겼다.
- '종이 40% 이상'을 '종이 선과 담묵 테로 밝게 했다'로 고치고 C9 값을 적었다.
- §8에 C4~C12와 망나니 8배 명령 원문을 옮겼다.
- 납품서 §4.2-4의 같은 문구는 메인 세션 파일이라 고치지 못했다.

**R8 서리침 서릿발 8개**: 그대로 두었다. API §9-10에 '다르게 한 것'으로 적었다.

#### 4.3 처방과 다르게 한 것 (이유)

1. **F2 위 조각 먹 튐 빼기**
   - 처방은 위 조각 위로 둘, 아래 조각 아래로 둘이었다.
   - 위로 던진 가닥은 위 조각 몸 안을 지나 머리 꼭대기에서 나온다. 각성판 둘째 먹귀에서는 뿔·더듬이처럼 보여 벌레 얼굴이 됐다(`torn-aw-x10`으로 확인). 평상판에서는 칼 머리에 가려 보이지도 않았다.
   - 그래서 아래 조각에서 세 가닥을 떨어뜨렸다. 위 조각은 벌어진 틈이 찢김을 보여 준다.
   - 처방의 +1.1 r은 먹귀 윤곽 밖이라 0.9 r로 당겼다.
2. **먹침 탄 깃**
   - F3는 '깃은 그대로'였다. 하지만 처방대로 넓힌 종이 몸이 깃을 거의 다 가려 청록 깃이 C9 0%가 됐다(`darts-shot-x8`로 확인).
   - 깃 밑동을 몸 가장자리(±2)로 옮기고, 몸 밖 끝을 3.6 → 4.6으로 늘렸다. 꼴·색·자리 문법은 같다.
   - C7 옆이 4.8 → 5.8이 됐다(허용 6.5). C9 청록은 2%다.
3. **망나니 칼 머리 자리**
   - 처방 3(끝 3~4 더)·4(칼 목 x −4~0)만큼 늘었다: (55~97, 50~84) → 대략 (53~101, 48~84).
   - 1.12배와 낙관 구역 비움은 그대로다.
4. **R5 해석**
   - '몸 외곽을 x −3 옮긴 모양으로 자른다'를 그대로 하면, 옮긴 외곽선 clip이 테(외곽선 둘레의 획)의 바깥 절반을 다 잘라 테가 사라진다.
   - 그래서 테를 옮긴 외곽선 사본에 둘렀다. 테는 몸 꼴을 따라가고 앞끝보다 0.45 뒤에서 끝난다.
5. **R1 요소 추가**: 뇌침의 탄 자국·번개 그림자·종이 끊김 호와 망나니 자루 6은 지시서 §3.4에 없는 요소다. 1차 §4.2-1과 같은 근거(§2.2)로 더했다.

#### 4.4 T 판정 (자가)

**T1**
- 그린 8종은 32px 색·흑백, 20px 흑백에서 같은 줄 핵심 아이콘과도, 서로와도 갈린다.

**T2 평상판 20px 흑백 주 덩어리** (모두 다르다)
- 먹침: 검은 쐐기 둘 + 깃
- 붓깃: 흰 잎 + 왼쪽 먹
- 인장 화살: 점 한 줄 + 흰 네모, 왼쪽 먹 꼬리
- 서리침: 오른쪽 아래 먹
- 뇌침: 밝은 대각 지그재그 + 오른쪽 먹 터짐
- 쌍날: 초승 둘
- 혼령: 먹 부채
- 망나니 침: 가는 대각 자루 + 칼 고리 + 오른쪽 아래 먹귀

**T2 각성판**: 32px은 갈린다. 20px은 1차와 같이 틀이 화면을 채워 약하다.

**T6**: 평상 타일 8종의 낙관 구역이 비어 있다(C2, `icons8`).

### 5. 메인 세션이 할 일

**등록값**: 1차 납품서 §5와 같다.
- `KIT_FILES`: `'k-icons.js'` 바로 뒤에 넣는다.
- `arsenal-tiles` 2656×664, `arsenal-slots` 1008×240
- 탄 8종 × 12장 = 96장, 박스 넓이 합 112,416
- 렌더러 3곳
- 조각 이름·박스·앵커는 바뀌지 않았다. 그림만 바뀌어 굽기 결과는 1차 그림과 다르다(아직 굽기 전이다).

**지시서 정정**: 검수서 §6(메인 세션 반영)에 하나를 더 권한다.
- 쌍날·망나니 날선은 청록 2.4다. §2.5 정정안 '청록 심 3.2 이상'을 2·3차부터 적용할지 정해 달라.
- 지금 두께에서 3.2로 올리면 날 몸보다 굵어진다.

**재검수**: 검수자가 `k9-` 이름으로 다시 돌릴 때도 명령은 API §8 원문 그대로 쓰면 된다.

**저장**: 이 납품서를 저장할 때 1차 §4.2-4의 '몸의 종이 40% 이상' 문구 옆에 정정(R7) 표시를 부탁한다.

### 6. 알려진 한계

- **쌍날 블랙 스팟**: clip을 반영하면 12.4%다. 3차 T3 때 44종을 함께 보며 정한다.
- **각성판 20px**: 틀(먹 바탕 + 원상)이 화면을 채워 무기끼리 차이가 작다(팀 결정 Q7과 함께).
- **C11 판정 방식**: 1배 렌더를 눈으로 봤다. 쌍날·망나니 날선은 32px에서 보이지만 흐리다.
- **측정 도구**: C9·C10은 근사다(필터·clip·`<use>`·묶음 opacity 무시). 보조 측정은 `<use>`와 clip만 보정한다.
- **사람 클린업**: 검수서 §9에 더해 아래를 넘긴다(API §10).
  - 망나니 칼 머리 실루엣
  - 먹귀의 먹 튐과 땅의 먹 튐(킷 다각형 튐은 꼭짓점이 곧다)
  - 위 조각의 꺾인 끝(8배에서 뾰족해 보일 여지)
  - 서릿발 꼴
  - 뇌침 탄 자국과 종이 끊김 호
  - 기절 나선 '@'
  - 쌍날 각성 배치 문화 검토
- **판독 시험**: 정식 판독 시험(n ≥ 8)과 실제 게임 화면(`test:visual`)은 등록 뒤에 본다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`

---

## 검수 2차 — art-director, 2026-10-15

(되살림: 서브에이전트 기록 `agent-a4c877d3024d1c717`(art-director, 'Review K9 first delivery')의 SubagentHandback 원문, 2026-10-15 08:02 KST. 메인 세션이 이 파일에 넣었던 글과 같은 추출이다(세션 기록 `75a03af2-….jsonl` 줄 42688, 추출 길이 일치). 머리말 단계만 이 파일에 맞췄다.)

**판정: 수정 후 합격 (남은 것 한 곳).**
- F1·F3·F4는 통과했다.
- F2는 평상판만 통과했다. 각성판에는 새 오독이 하나 생겼다(F2b): 찢긴 먹귀 둘이 '다리 달린 벌레'로 읽힌다.
- R1~R8 반영을 확인했다.
  - R1은 보정 측정으로 망나니 침 13.9%, 쌍날 12.3%다. 1차에 정한 대로 3차 T3 때 판정한다.
  - R3은 부분 반영이다.
- 납품서 §4.3의 '처방과 다르게 한 것' 5건은 모두 받아들인다.
- §5 질문: '청록 심 3.2 이상'은 거두고, 선 요소는 '청록 심 2.4 이상'을 기준으로 지시서를 고친다. 2·3차부터 적용한다. 지금 쌍날·망나니 날선의 2.4는 합격이다.
- 수정 2회차(마지막)는 F2b 하나뿐이다.
  - 각성 망나니 침 아이콘 말고는 출력을 바꾸지 않는다. §6의 보존 해시로 확인한다.
  - 수정 2회차 뒤에도 F2b가 남으면, 그 아이콘만 사람 클린업으로 넘기고 나머지는 합격으로 등록하기를 권한다.

---

### 1. 다시 돌린 검사

- 렌더는 모두 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r2-*.png`에 있다.
- 다른 작업자 모듈이 함께 로드된 상태에서 돌렸고, kit error는 0건이다.

| 검사 | 렌더 | 결과 |
|---|---|---|
| C5 | `k9r2-c5-unchanged` | 기준값 `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18`과 같다 |
| C4 | `k9r2-c4-scan` | `icons bad=0 text=0 hatch=0 nocyan=0`, `stamps bad=0 text=0 filter=0 nocyan=0 colours={}` |
| C7 | `k9r2-c7-meta` | `meta ok \| invalid calls ok \| core list=17`, 22줄 모두 ok. 납품서 원문과 같다(먹침 옆 5.8, 허용 6.5) |
| C1 `--check` | `k9r2-c1-all` | ok |
| C2 volley `--check` | `k9r2-c2-volley`, 1배 크롭 `-a`~`-d` | ok. 평상 타일 8종 모두 낙관 구역이 비어 있다 |
| C6 `--check` | `k9r2-c6-shots`(1배), `-x6`, 6배 크롭 `k9r2-c6-volley-x6a/b` | ok |
| C8 `--check` | `k9r2-c8-scene`(1배), `-08`, `-x3`, 흑백 `-gray` | ok. 22종 모두 밝은 몸이고 적 탄과 갈린다 |
| T1 | `k9r2-t1-looks`, `-rows012`, `-needle-x2` | 통과 |
| T2 | `k9r2-t2-kinds`, `-awakened`, `-volley-both-x1`, `-volley-20gray` | 평상판 통과. 각성판은 32px 통과, 20px은 1차와 같은 틀의 한계 |
| C9 | `k9r2-c9-paper` | 납품서 원문과 같다 |
| C10 | `k9r2-c10-ink` | 납품서 원문과 같다 |
| C10 보정 | `k9r2-c10u-ink`, `k9r2-c10-variants` | §3 R1 |
| C11 | `k9r2-c11-cyan32` | 8종 모두 32px 색에서 청록이 보인다 |
| C12 `--check` | `k9r2-c12-volley-scene`, `-gray` | ok |
| 확대 | `k9r2-icon-<id>` 8종(3배, `--check` ok)<br>`k9r2-fix-headsman-x8`, `k9r2-torn-x12`, `k9r2-torn-aw-x12`<br>`k9r2-headsman-aw-tile-x1/-x2`, `k9r2-twin-aw-tile-x2`<br>`k9r2-shotsheet-a/-b`(12장 전부, `--check` ok) | §2~§4 |
| 결정성·자리표시 | `k9r2-determinism` | 528개 호출이 두 번 모두 같다. 자리표시 72/72, `list 17 ICON 17` |
| 보존 해시 | `k9r2-keep-hash`(-big) | `volley-keep=vko1lv len=992714 \| shots=8wzptx len=134704` |

### 2. 필수 F1~F4

| | 판정 | 근거 |
|---|---|---|
| F1 망나니 칼 머리 | **통과** | 8배에서 곧은 등(먹 띠), 끝 쪽이 넓은 배, 등선 너머 마이터 끝, 칼 목이 보여 '자루에 꽂힌 외날'로 읽힌다. 국자·배 판독은 없어졌다.<br>T2 20px 흑백에서 뇌침(굵고 밝은 지그재그)과 갈린다(가는 검은 자루 + 머리). 칼 머리는 y 48 이상이라 낙관 구역이 비어 있다 |
| F2 먹 튐 | **평상판 통과, 각성판 미통과 → F2b** | 평상판: 아래 조각에서 떨어지는 세 가닥과 땅의 먹 튐으로 '찢겨 먹이 흐르는 먹귀'로 읽힌다. 수염·부리·고양이 얼굴은 없다.<br>각성판은 §6 |
| F3 어두운 탄 | **통과** | C9(종이/먹): 먹침 34/58·34/57, 망나니 침 34/54·33/53.<br>C12·C8 1배 색·흑백에서 두 탄 모두 몸의 가장 큰 덩어리가 종이다. C7 22줄 ok |
| F4 32px 청록 | **통과** | C11에서 8종 모두 청록이 보인다.<br>뚜렷함: 인장 인면, 서리침 끝. 보임: 먹침 깃, 붓깃 점. 흐리지만 보임: 쌍날·망나니 날선 |

F4 보충 — 보정 측정(`k9r2-c10u-ink`)의 청록 면적을 32px로 환산한 값
- 무기: 먹침 2.6 px², 붓깃 1.5, 인장 화살 4.2, 서리침 6.5, 뇌침 19.3, 쌍날 4.3, 혼령 22.6, 망나니 침 5.2
- 비교로 핵심 아이콘: 먹선 바늘 11.4, 부채 단검 0.5. 핵심 부채 단검의 섬광도 32px에서 흐리다.

### 3. 권장 R1~R8

| | 판정 | 근거 |
|---|---|---|
| R1 블랙 스팟 | 부분 | 아래 보충 |
| R2 쌍날 회전 호 | 반영 | 날마다 호가 하나다. 3배에서 종이 심 때문에 두 줄로 보이지만, 동심 평행선 서너 줄은 없어졌다 |
| R3 쌍날 각성 배치 | 부분 | 셋째 날을 (22, 93)으로 빼서 창 가장자리에 걸쳐 균형 잡힌 삼각은 약해졌다. 그래도 2배 타일에서 '원상 안의 흰 원판 셋' 인상은 남는다. 문화 검토 목록에 둔다 |
| R4 인장 화살 탄 | 반영 | C9 34/51. C8 3배에서 세로로 날 때도 도장 머리 화살로 읽힌다 |
| R5 각성 겹 테 | 반영 | §4 #4 |
| R6 먹침 아이콘 | 반영 | 실감기 한 뭉치, 끊긴 빗면 두 획, 큰 깃으로 3배에서 미사일 기미가 크게 줄었다 |
| R7 문서 | 반영 | API §8에 C1~C12와 망나니 8배 명령 원문이 들어갔다. §9는 납품서 번호에 맞췄고, '40%' 문구도 고쳤다.<br>납품서 1차 §4.2-4의 정정 표시는 메인 세션이 한다(요청에 동의한다) |
| R8 서릿발 8개 | 반영 | API §9-10에 적었다 |

R1 보충 — `<use>`와 clip을 모두 반영한 보정 측정(`k9r2-c10u-ink`)
- 결과: 먹침 18.5, 붓깃 17.4, 인장 화살 15.4, 서리침 31.6, 뇌침 15.4, 쌍날 12.3, 혼령 19.3, 망나니 침 13.9%
- 납품서와 API §10의 '망나니 침 15.2'는 반쪽 clip이 덜 반영된 값이다.
  - `<use>`만 펼치면 15.9, clip까지 반영하면 13.9다(`k9r2-c10-variants`).
  - API 숫자를 13.9로 고친다.
- 하한(15%)을 넘은 것: 인장 화살, 뇌침. 아래인 것: 망나니 침, 쌍날. 3차 T3 때 판정한다.

### 4. 납품서 §4.3 '처방과 다르게 한 것' 5건

| # | 판정 | 이유 |
|---|---|---|
| 1 위 조각 먹 튐을 빼고 아래로 셋 | 수용 | 평상판에서 처방의 목적(한 점 부채꼴과 수염을 없앰)을 이뤘다. 각성판의 남은 문제는 이 선택 때문이 아니라 종이 테·둥근 끝·먹귀 맞닿음 때문이다(F2b) |
| 2 먹침 탄 깃을 옮기고 키움 | 수용 | 넓힌 몸이 청록 깃을 가렸다는 판단이 맞다. C9 청록 2%, C7 옆 5.8(허용 6.5)이다. 지시서 §4.4 숫자를 고친다(§7) |
| 3 망나니 칼 머리 자리 (53~101, 48~84) | 수용 | 처방 3·4에서 자연히 생긴 결과다. 1.12배와 낙관 구역 비움을 지켰다 |
| 4 R5를 옮긴 외곽선 사본에 테로 두름 | 수용 | clip으로 하면 테 바깥 절반이 잘린다는 지적이 맞다. 목적(몸 꼴을 따르고 앞끝이 늘지 않음)은 같고 C7 앞끝 값도 그대로다.<br>6배에서 테가 뒤로 치우친 잔상처럼 보이지만 판독에는 문제가 없다 |
| 5 R1 요소 추가(뇌침 탄 자국·번개 그림자·끊김 호, 망나니 땅 먹 튐·자루 6) | 수용 | 근거는 §2.2다. 낙관 구역과 왼쪽 아래를 피했고 T2 20px도 유지된다.<br>조건: 3차 T3에서 '오른쪽 먹 덩어리'를 가진 무기들과 함께 다시 본다(서리침 언 땅, 뇌침 탄 자국, 망나니 땅 먹 튐, lob 착지 튐, 타르 웅덩이) |

### 5. §5 질문 판정 — 청록 심 3.2
- 2·3차에는 '청록 심 3.2 이상'을 적용하지 않는다. 날선처럼 몸보다 굵어지는 경우가 생기기 때문이다.
- 지금 날선 2.4는 C11에서 보이므로 합격이다.
- 지시서 §2.5는 §7-1처럼 고친다.

### 6. 고칠 것 (수정 2회차): F2b — 각성 망나니 침의 먹귀 둘이 '다리 달린 벌레'로 읽힌다

**본 렌더**
- `k9r2-headsman-aw-tile-x2`(드래프트 타일 2배), `k9r2-torn-aw-x12`, `k9r2-fix-headsman-x8`의 오른쪽 절반
- 1배 타일(`k9r2-headsman-aw-tile-x1`)에서도 기미가 보인다.

**문제**
- 지시서 §3.3은 얼굴·생물로 읽혀도 되는 곳을 먹귀 슬릿 눈으로 한정한다.
- F2 합격 기준은 '평상·각성 두 먹귀 어디서도'였다. 전설 무기의 각성 카드라 드래프트에서 잘 보이는 자리다.

**원인**(`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`)
1. 먹 튐이 윤곽에서 `+1.2k` 떨어져 시작한다(`:221`). 그래서 각성 종이 테(빌린 틀의 halo 2.2, `k-icons.js:451`)가 가닥마다 따로 둘러져, 흰 테 두른 막대가 된다.
2. 가닥 끝의 둥근 점(`:224`의 circle)이 발처럼 보인다.
3. 둘째 먹귀 (90, 106) r 11이 첫째 (100, 80) r 16에 맞닿는다. 중심 사이가 27.9로 반지름 합 27과 거의 같아서, 두 덩이가 머리·배 마디로 읽힌다(`:585-586`).
4. 땅의 먹 튐은 평상판에만 있다(`:582`, `!A`). 그래서 각성판의 먹 튐이 공중에 뜬다.

**처방**(각성판만. 평상판 출력은 바꾸지 않는다)
1. 두 먹귀를 띄운다. 종이 테를 넣어 실루엣 사이가 4 이상이어야 하고, 중심 사이는 약 36 이상이다.
   - 예: 둘째를 (70~78, 108~112) 근처로 옮기고, 작은 칼(0.72배)의 각도를 그쪽에 맞춘다.
   - 낙관 구역과 모서리 10 안은 피한다.
2. 각성 호출에서만 먹 튐을 바꾼다. 둘 중 하나를 고른다.
   - (a) `tornGhoul()`에 옵션을 더한다: 윤곽 0.5 안쪽에서 시작해 종이 테가 몸과 한 덩어리로 두르게 하고, 끝은 둥근 공 대신 뾰족하게, 먹귀마다 2가닥 이하.
   - (b) 각성판에서는 먹 튐을 빼고, 평상판과 같은 땅 먹 튐을 ink7로 깐다(§2.4 각성 규칙).

**바꾸면 안 되는 것**
- 평상판 아이콘·타일·슬롯과 탄 96장 전부 → 아래 보존 해시가 같아야 한다
- 칼 머리(F1), 각성 수(2발·먹귀 둘), 낙관 구역, C4·C5·C7

**합격 기준**
- 아래 첫째·둘째 명령에서 다리·더듬이·마디 몸이 읽히지 않고 '찢긴 먹귀 둘'로 읽힌다. 둘째 명령의 crop은 먹귀를 옮긴 자리에 맞춘다.
- 1배 C2 각성 타일에서도 같다.
- T2 각성 32px에서 계속 갈린다. C1·C2 `--check`는 ok다.
- 셋째 명령의 출력이 정확히 `volley-keep=vko1lv len=992714 | shots=8wzptx len=134704`다. 넷째 글자는 숫자 1, 다섯째는 소문자 l이다.

```
node scripts/art-review-sheet.mjs expr --name k9-fix2-headsman-tiles-x2 --scale 2 --crop 0,0,340,170 --expr '(function(){var X=PN.arsenal;return "<rect width=\"340\" height=\"170\" fill=\"#fbfaf5\"/><g transform=\"translate(8,8)\">"+X.tile("headsmanDarts",{awakened:false,metal:true,size:150})+"</g><g transform=\"translate(174,8)\">"+X.tile("headsmanDarts",{awakened:true,metal:true,size:150})+"</g>";})()'
node scripts/art-review-sheet.mjs expr --name k9-fix2-torn-aw-x12 --scale 12 --crop 72,62,64,66 --expr 'PN.arsenal.skill("headsmanDarts",{awakened:true})'
node scripts/art-review-sheet.mjs expr --name k9-fix2-keep-hash --scale 1 --crop 0,0,900,40 --expr '(function(){var X=PN.arsenal;function norm(m){return m.replace(/\bki\d+/g,"ki").replace(/\bkar\d+/g,"kar");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}var A="",B="";X.ids.filter(function(id){return X.META[id].done;}).forEach(function(id){[false,true].forEach(function(a){if(id==="headsmanDarts"&&a)return;A+=norm(X.skill(id,{awakened:a}))+norm(X.tile(id,{awakened:a,metal:true,size:150}))+norm(X.hudSlot(id,{size:40,awakened:a}));});X.parts(id).forEach(function(p){for(var f=0;f<p.frames;f++)B+=norm(X.stamp(id,p.part,{frame:f}));});});return "<rect width=\"900\" height=\"40\" fill=\"#fff\"/><text x=\"4\" y=\"26\" font-size=\"14\" font-family=\"monospace\">volley-keep="+h(A)+" len="+A.length+" | shots="+h(B)+" len="+B.length+"</text>";})()'
```

- 문서: API §6(망나니 각성 칸)과 §9에 F2b를 적고, §10의 '망나니 침 15.2'를 13.9로 고친다.

### 7. 지시서 정정 (`docs/art/briefs/arsenal-icons.md`, 검수 1차 §6에 더한다)
1. **§2.5 32px 청록**(검수 1차 §6-5를 바꾼다)
   - 'C11에서 32px 색으로 보여야 한다'를 기준으로 한다. 기준값은 다음과 같다.
     - 선 요소: 청록 심 2.4 이상 + 양쪽 먹 1.2 이상(합 4.8 이상), 길이 20 단위 이상
     - 점·면 요소: 청록 지름 5 이상 + 먹 테
   - '청록 심 3.2 이상'은 거둔다.
2. **§3.3 먹귀**(새 조항)
   - 한 그림 안의 먹귀끼리 실루엣이 닿게 위아래로 쌓지 않는다(종이 테까지 4 이상 띄운다). 각성 종이 테가 하나로 묶어 마디 있는 벌레 몸으로 읽힌다.
   - 먹 튐은 몸 윤곽에서 붙여 시작하고, 끝을 둥근 공으로 맺지 않는다. 떨어진 가닥에 종이 테가 둘러지면 다리·더듬이가 된다.
   - 2·3차의 seeker·chain·strike처럼 먹귀가 여럿인 그림에 해당한다.
3. **§4.3 각성 겹 테:** '앞끝 3 단위는 비워서'를 '몸 외곽선을 x −3 옮긴 사본에 두른다(clip 없음). C7 앞끝은 늘지 않는다'로 고친다(R5 결과).
4. **§4.4 먹침 탄:** 쐐기 앞 30%(검수 1차 §6-3)에 더해, 깃 숫자를 '(−4.4~−9.2, 바깥 4.6, 밑동은 몸 가장자리)'로 고친다.
5. **§5.2 C10**
   - 블랙 스팟 판정은 `<use>`와 clip을 반영하는 보정 측정으로 한다.
   - 기존 C10은 망나니 침을 9.6%로 낮게, 쌍날을 14.8%로 높게 잰다(보정값 13.9, 12.3).
   - 명령은 `k9r2-c10u-ink`와 같은 식이다. 기존 C10 식에 두 가지를 더했다: `<use>`를 원본 사본으로 바꾸고, 표본점마다 조상 `clip-path`의 도형 안에 있는지 `isPointInFill`로 확인한다. 이름은 `k9-c10u-ink`로 한다.
6. **§3.4 망나니 침 문구**(기록용): 칼 머리를 받아들인 꼴로 고친다.
   - 끝 쪽이 넓은 팔치온, 위 가장자리 먹 띠(두께 3~4), 등선 너머 마이터 끝, 칼 목
   - 자리 (53~101, 48~84), 자루 6

### 8. 메인 세션
- 등록값(시트 2개, 탄 96장·넓이 합 112,416, `KIT_FILES`, 렌더러 3곳)은 바뀌지 않았다.
  - 등록 코드는 지금 준비해도 된다.
  - 굽기는 F2b를 확인한 뒤(검수 3차, 짧다)에 한다.
- 검수 1차 §6과 이번 §7의 지시서 정정을 반영한다. 납품서 1차 §4.2-4 문구에는 R7 정정 표시를 단다.
- `npm run test:visual`에서 볼 장면: 검수 1차 §8에 더해 다음 셋을 넣는다.
  - 망나니 침 각성 드래프트 카드(F2b)
  - 쌍날 각성 카드(R3 문화 검토용)
  - 먹침 슬롯이 있는 HUD 32px(F4. 청록이 가장 작다)

### 9. 사람 클린업 · 미확인
- **사람 클린업:** 납품서 §6 목록에 동의한다. 다음 둘을 더한다.
  - 쌍날 각성 배치('원판 셋', 문화 검토)
  - 인장 화살의 굵은 먹 꼬리(왼쪽 검은 쐐기)의 붓 질감
- 위 조각의 꺾인 끝이 8배에서 부리처럼 보일 여지는 사람 클린업으로 넘긴다. 1배와 32px에서는 보이지 않는다.
- **미확인**
  - 실제 게임 화면(등록 전)
  - 정식 판독 시험(n ≥ 8)
  - T3(3차)
  - C9·C10 보정 측정도 필터와 묶음 opacity는 무시하는 근사치다.

**관련 파일:**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-icons.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`

---

## 1차 수정 2회차 납품서: F2b (각성 망나니 침)

(되살림: 서브에이전트 기록 `agent-a7c1c9697e5fa5666`(kit-artist, 'K9 arsenal icons kit, part 1')의 SubagentHandback 원문, 2026-10-15 08:12 KST. 메인 세션이 이 파일에 넣었던 글과 같은 추출이다(세션 기록 `75a03af2-….jsonl` 줄 42737, 추출 길이 일치). 머리말 단계만 이 파일에 맞췄다.)

각성 망나니 침 아이콘만 고쳤다. 보존 해시가 기준값과 정확히 같아서, 평상판 아이콘·타일·슬롯과 탄 96장은 바뀌지 않았다. `--check`를 붙인 명령은 모두 `ok`다.

### 바꾼 것

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`**
- `tornGhoul`에 옵션 `flicks: false`를 더했다(`:227-231`). 이 옵션을 주면 먹 튐을 그리지 않는다. 옵션이 없으면 예전과 같다.
- `DRAW.headsmanDarts`(`:576-594`)는 각성판만 바꿨다.
  - **둘째 먹귀**: (90, 106) → (71, 110)으로 옮겼다(r 11, `open`은 그대로).
    - 중심 사이: 27.9 → 41.7
    - 위 조각을 벌린 뒤의 실루엣 사이: 약 9.5
    - 각성 1.1배에 종이 테 2.2 × 2를 빼도 약 6이다(기준 4 이상).
  - **작은 칼(0.72배)**: (−2, 111)·−10°·길이 48 → (−4, 111)·−6°·길이 38.6. 칼끝이 둘째 먹귀 윤곽에 닿는다.
  - **먹 튐**: 처방 (b)를 따랐다.
    - 두 먹귀 모두 `flicks: false`로 먹 튐을 뺐다.
    - 평상판과 같은 땅 먹 튐을 깔고, 각성판은 ink7로 칠한다. 예전의 `!A` 조건을 없애고 색만 `col`로 갈랐다.
    - (a)를 고르지 않은 이유: 32~45px 각성 슬롯에서는 짧은 가닥이 종이 테에 묻혀 다시 다리처럼 보일 수 있다. (b)는 평상판과 같은 문법이다.
- 그대로 둔 것: 칼 머리(F1), 각성 수(2발·먹귀 둘), 낙관 구역.

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`**
- 납품 차례 표에 '1차 수정 2회차' 줄을 더했다.
- §6 망나니 침 각성 칸을 새 배치로 고쳤다.
- §9.3에 16번(F2b)을 새로 적었다.
- §10 보정 측정값을 검수 2차 `k9r2-c10u-ink` 값으로 바꿨다. 망나니 침은 15.2 → 13.9다.
- §10 32px 청록 줄을 검수 2차 결정(청록 심 2.4 이상)에 맞췄다.

### 명령 결과 원문

`k9-fix2-keep-hash`
```
volley-keep=vko1lv len=992714 | shots=8wzptx len=134704
```
- 글자 확인용 변형 `k9-fix2-keep-hash-codes`의 출력은 `match=true codes=118,107,111,49,108,118`이다.
- 넷째 글자는 숫자 1(49), 다섯째는 소문자 l(108)이다.

`k9-fix2-c1-all` (`--check`): `ok   k9-fix2-c1-all`

`k9-fix2-c2-volley` (`--check`): `ok   k9-fix2-c2-volley`

`k9-fix2-c4-scan` (추가로 돌림)
```
icons bad=0 text=0 hatch=0 nocyan=0
stamps bad=0 text=0 filter=0 nocyan=0 colours={}
```

`k9-fix2-c5-unchanged` (추가로 돌림)
```
icons-all=19vh262 len=2634966 list=17 ICON=17 | skillvfx-all=1xq1i37 len=698432 groups=18
```

`k9-fix2-headsman-aw-x4` (`--check`, 추가로 돌림): ok

`k9-fix2-headsman-tiles-x2`, `k9-fix2-torn-aw-x12`, `k9-fix2-t2-kinds-awakened`: 렌더만 했다. 검수서 명령에 `--check`가 없다. torn-aw의 crop은 먹귀를 옮긴 자리에 맞춰 `54,60,74,68`로 바꿨다.

### 직접 본 렌더

위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`

- **`k9-fix2-headsman-tiles-x2`**
  - 평상 타일은 그대로다.
  - 각성 타일에서 두 먹귀가 종이 테까지 떨어져 따로 선다.
  - 다리·더듬이·마디 몸은 읽히지 않는다.
  - 큰 먹귀는 들린 위 조각의 틈으로, 작은 먹귀는 눈 아래 흰 찢김 틈으로 '찢긴 먹귀'로 읽힌다.
- **`k9-fix2-torn-aw-x12`**
  - 두 종이 테 사이에 먹 바탕이 보인다.
  - 그 사이로 틀의 원상 꼬리(가는 마른 붓)가 지나가지만, 둘을 한 몸으로 묶지는 않는다.
- **`k9-fix2-headsman-aw-x4`, `k9-fix2-c2-volley`, 1배 크롭 `k9-fix2-c2-volley-headsman`**
  - 1배 각성 타일에서도 두 먹귀가 갈리고, 벌레로 읽히지 않는다.
  - 평상 타일 8종의 낙관 구역은 비어 있다.
- **`k9-fix2-t2-kinds-awakened`, 3배 `-zoom`**
  - 32px 각성(색·흑백)에서 망나니 침은 긴 대각 자루 둘 + 칼 고리 + 떨어진 먹귀 둘로 보인다.
  - 다른 7종과 갈린다.
- **작업 중 버린 시도**: 첫 시도는 (74, 110)·길이 40.4였다. 12배에서 종이 테 사이가 4 안팎으로 빠듯해서 (71, 110)으로 더 띄웠다.

### 남은 것

- 각성 1.1배에서 작은 먹귀의 아래 끝과 종이 테가 창 아래 가장자리를 조금 넘는다. 창 밖 10 안이고, 타일 2배에서 틀 안쪽 선에 닿는 정도다.
- 먹귀 몸의 먹 방울은 핵심 `inkDot` 문법이라 그대로 두었다.
- 메인 세션의 등록값은 바뀌지 않았다. 검수 3차(F2b 확인) 뒤에 굽기를 하면 된다.

---

## 검수 3차 — art-director, 2026-10-15

**판정: 합격.**
- F2b(각성 망나니 침)가 검수 2차 §6의 합격 기준을 모두 채운다.
- 따라서 K9 1차(뼈대 + volley 8종)는 합격이다. 메인 세션은 등록·굽기·렌더러 연결을 진행하면 된다.

### 다시 돌린 것
렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r3-*.png`에 있고, kit error는 0건이다.

| 명령 | 결과 |
|---|---|
| `k9r3-keep-hash` | `volley-keep=vko1lv len=992714 \| shots=8wzptx len=134704`. 기준과 **정확히 같다** |
| `k9r3-keep-hash-codes` | `exact-match=true`(해시와 길이 모두). 글자 코드는 118,107,111,49,108,118 / 56,119,122,112,116,120이다 |
| `k9r3-c5-unchanged` | 기준값 `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18`과 같다 |
| `k9r3-c1-all` `--check` | ok |
| `k9r3-c2-volley` `--check` | ok. 망나니 칸은 1배 크롭 `k9r3-c2-headsman-x1`로 따로 봤다 |
| `k9r3-headsman-tiles-x2` | 아래 F2b |
| `k9r3-torn-aw-x12` | crop을 `52,58,80,76`으로 옮겼다. 먹귀를 옮긴 자리와 각성 1.1배를 덮는 범위다 |
| `k9r3-t2-kinds-awakened`, `k9r3-t2-aw-volley-32` | 아래 F2b |

보존 해시가 같다는 것은 각성 망나니 아이콘 말고는 아무것도 바뀌지 않았다는 뜻이다. 평상판 아이콘·타일·슬롯, 다른 7종의 모든 출력, 탄 96장이 그대로다.

### F2b 판정 (검수 2차 §6 기준)

| 기준 | 결과 |
|---|---|
| 타일 2배와 12배에서 다리·더듬이·마디 몸이 읽히지 않고 '찢긴 먹귀 둘'로 읽힌다 | **통과** |
| 1배 드래프트 각성 타일 | **통과**. 두 먹귀가 갈리고 벌레로 읽히지 않는다 |
| T2 각성 32px(색·흑백) | **통과**. 대각 자루 둘, 칼 고리, 떨어진 먹귀 둘로 다른 7종과 갈린다 |
| C1·C2 `--check` | ok |
| 바꾸면 안 되는 것 | 지켰다. 칼 머리(F1), 각성 수(2발·먹귀 둘), 낙관 구역이 그대로이고 C5도 같다 |

첫째 기준을 통과로 본 근거
- 둘째 먹귀를 (71, 110)으로 옮겨, 종이 테 사이에 먹 바탕이 보인다.
- 먹 튐을 빼서 흰 테를 두른 막대가 없다.
- 각성판에도 땅 먹 튐(ink7)을 깔아 큰 먹귀가 공중에 뜨지 않는다.
- 찢김은 그대로 읽힌다. 큰 먹귀는 들린 위 조각으로, 작은 먹귀는 눈 아래 찢김 틈으로 보인다.

처방 (b)를 고른 판단에 동의한다. 평상판과 같은 문법이고, 32~45px 슬롯에서 짧은 가닥이 다시 다리로 보일 위험이 없다.

### 남은 것 (합격을 막지 않음)
- 작은 먹귀의 아래 끝과 종이 테가 각성 1.1배에서 창 아래로 조금 나간다.
  - 창 밖 10 안이라 각성 문법 안이다. 타일 2배에서 틀 안쪽 선에 닿는 정도다.
  - 사람 클린업 때 2~3 올리면 좋다.
- 검수 2차에서 넘긴 것은 그대로 남는다.
  - R1 블랙 스팟(망나니 침 13.9%, 쌍날 12.3%), T3, 각성판 20px(팀 결정 Q7)은 3차 납품 때 판정한다.
  - R3 쌍날 각성 배치(문화 검토), 망나니 위 조각의 꺾인 끝, 서릿발 꼴, 기절 나선은 사람 클린업으로 넘긴다.

### 메인 세션
- 등록·굽기·렌더러 연결은 검수 1차 §8 그대로 한다. 등록값은 바뀌지 않았다.
  - `KIT_FILES`: `scripts/build-ui-art.mjs:17`과 `scripts/build-atlas.mjs:11`에서 `'k-icons2.js'`를 `'k-icons.js'` 바로 뒤에 넣는다.
  - UI 시트: `arsenal-tiles` 2656×664, `arsenal-slots` 1008×240. done 8종 × [평상, 각성]이다.
  - 탄: skills 팩에 96장, 박스 넓이 합 112,416. `readSkillVfx`가 `PN.arsenal.parts`도 읽게 하되 `window`는 옮기지 않는다.
  - 렌더러: `worldRenderer.ts:85`·`:1337`·`:1359-1362`. 각성 조각이 없으면 평상 조각으로 떨어지게 한다.
  - `build-arsenal-art.mjs`에서 done 키의 배지를 지우고, `src/ui/uiArt.test.ts:53-56`의 키 목록을 갱신한다.
- 확인: `npm run build:ui-art`, `node scripts/build-arsenal-art.mjs`, `npm run build:atlas`, `npm run test:unit`, `npm run build`(예산), `npm run bench:packs`.
- `npm run test:visual` 장면: 검수 1차 §8과 검수 2차 §8의 장면 전부. 망나니 침 각성 드래프트 카드도 포함한다.
- 지시서 정정(검수 1차 §6 + 검수 2차 §7)이 아직 반영되지 않았다면 함께 반영한다.
- 커밋 항목은 FX-08 (SYS-15)이다.

**관련 파일:**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`

---

## 2차 납품서 — burst·spray·rear·seeker 14종 아이콘·탄 (`PN.arsenal`)

작성: kit-artist, 2026-10-16. 지시서는 `docs/art/briefs/arsenal-icons.md` §6 2차이고, 본문에 들어간 1차 정정과 §10 '검수 정정(검수 2차)'을 따랐다.

**요약**
- 14종의 아이콘(평상·각성)과 탄(6조각 × 2장)을 다 그렸다. 이로써 탄 22종이 모두 끝났다.
- 보존 해시: volley 8종 출력이 그대로다. `volley-keep=vko1lv len=992714 | shots=8wzptx len=134704`이고 글자 코드까지 정확히 같다(§3).
- 검사
  - `--check`를 붙인 명령은 모두 ok다.
  - C4·C5는 기준값과 같고, C7은 22줄 모두 ok다.
  - kit error는 0건이다.
- 손댄 파일은 맡은 두 개뿐이고, 아무것도 내려받지 않았다.
- 지시서와 다르게 한 곳은 9건이다(§7.2, API §9.4 17~25). 큰 것은 셋이다.
  - 탄 셋의 먹 비율을 줄였다(C9 먹 65% 초과).
  - 흰 모티프 아이콘에 먹 바탕을 깔았다.
  - 블랙 스팟 하한을 맞추려고 크기·자리를 조정했다.

### 1. 납품 목록
| 파일 | 내용 |
|---|---|
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js` | 2차 공용 도우미 `:253-273`(rotP·bez·dropD·polar·pierced) / 아이콘 `DRAW` burst `:619`~, spray·rear·seeker ~`:1093` / 탄 `SHOT` `:1307-1497` / `DONE`에 14종 추가 |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md` | 납품 표, §4 META ✓, §6b(14종 아이콘), §7.2, §7.5(14종 탄), §8(보정 C10·2차 C11·C12·보존 해시 명령 원문), §9.4, §10 |

- 이번 `done` 14종: paperStorm, inkBloom, thornHalo, starShards, sunNeedles, inkDrizzle, pinHail, tailGuard, smokeTail, gravePins, trackingSeals, huntersMarks, crowFeathers, bossbane
- 누적 `done`은 22종이다. 남은 자리표시 22종은 투사체 없는 6 kind의 아이콘뿐이다.
- API와 서술자 꼴은 1차와 같다(`parts`·`stamp`·박스·앵커 규칙 그대로).

### 2. 무기별 디자인 요약 (상세: API §6b·§7.5)

| 무기 | 주 덩어리 / 블랙 스팟 | 청록 | 각성 |
|---|---|---|---|
| 종이 폭풍 | 접힌 종이날 8이 가운데 먹 번짐에서 비껴 펼쳐짐 + 붓 휘감기 셋 | 가운데에서 벌어지는 나선 팔 한 획 | 10장 + 둘째 감김 |
| 먹꽃 | 검은 꽃잎 여섯(끝마다 처진 방울), 종이 꽃술(가운데 점 없음) | 꽃술 테 반 바퀴(청록 3.4) | 7잎 + 방울 |
| 가시 테 | 세 토막 먹 덩굴 고리 + 장미 가시 12 + 날아가는 가시 셋(안은 비움) | 한 토막 안쪽 실 | 가시 1.2배 + 2 |
| 별조각 | 가운데 먹 폭발 위 흰 파편 5 + 7갈래 섬광 | 섬광 심 | 6조각 |
| 해바늘 | 3/4 흰 바늘꽂이 + 반경에서 비껴 구르는 바늘 16(둘은 꽂힘) + 그림자 | 누빔 실 한 줄 | 바늘 22 |
| 먹 이슬비 | 왼쪽 아래 붓 + 털어 낸 먹 튐 → 먹 방울 12의 원뿔 | 맨 앞 셋 뒤 젖은 줄(20~22) | 16방울 |
| 핀 우박 | 먹 핀통 + 흰 단검 핀 9·알갱이 5의 넓은 원뿔(56°) | 가장 큰 핀의 날 홈(약 20) | 핀 13 + 알갱이 7 |
| 꼬리 방패 | 매듭 아래 왼쪽으로 펼친 흰 단검 셋(타원 날밑) | 목도리 | 4개 |
| 연막 꼬리 | 매듭에서 왼쪽으로 퍼지는 먹 연기 한 덩어리 + 연막침 둘 | 목도리 | 3개, 연기 1.2배 |
| 묘침 | 왼쪽 아래 먹 땅 + 비석 머리 핀 넷(깊이·기울기 다름) | 목도리 | 핀 6 |
| 추적 인장 | 먹 인주 덩이 → 갈라져 휘는 실 셋 → 도장이 누른 먹귀 셋(네모 인영) | 점선 추적 실 셋 | 4개 |
| 사냥꾼 표식 | 크기·높이 다른 먹귀 넷에 꽂힌 다트 + 매단 종이 패, 치명 섬광 | 패를 묶은 끈 | 5개 |
| 까마귀 깃 | 오른쪽 반원 먹귀 다섯 앞에서 멈춘 검은 비대칭 깃 다섯 | 한 깃의 깃대 심 | 6개 |
| 보스 사냥침 | 오른쪽 40% 보스 먹 덩어리(뒤로 젖힌 뿔) + 3/4 종이 가면 + 작살 | 침 꼬리 실(한 번 휨) | 2발 |

공통 규칙
- 낙관 구역 (94~128, 0~34)과 네 모서리 10은 비웠다(C2로 확인).
- 먹귀끼리 실루엣이 닿지 않게 했다(검수 2차 §10-2).
- 먹 튐은 몸에 붙이거나 땅에 떨어진 튐으로 그렸다. 둥근 끝을 단 떨어진 가닥은 없다.

### 3. 검사 결과 (렌더 이름 `k9b-…`, 명령은 API §8 원문)

**보존 해시** `k9b-keep-hash`
```
volley-keep=vko1lv len=992714 | shots=8wzptx len=134704
```
- `k9b-keep-hash-codes`: `exact-match=true codes=118,107,111,49,108,118 / 56,119,122,112,116,120`
- 검수 2차 §6의 원래 식은 `done`으로 거른다. 2차부터 `done`이 22종이라 그 식은 14종이 섞여 다른 값을 낸다.
- 그래서 무기 목록만 volley 8종 이름으로 고정한 식을 썼다. 나머지는 같다(API §8 `k9-keep-hash`).

**C4** `k9b-c4-scan`
```
icons bad=0 text=0 hatch=0 nocyan=0
stamps bad=0 text=0 filter=0 nocyan=0 colours={}
```
**C5** `k9b-c5-unchanged`(작업 전 `k9b-c5-before`와도 같다)
```
icons-all=19vh262 len=2634966 list=17 ICON=17 | skillvfx-all=1xq1i37 len=698432 groups=18
```
**C7** `k9b-c7-meta`
```
meta ok | invalid calls ok | core list=17
inkDarts r=4 front=5.5 back=23.5 side=5.8 ok
brushQuills r=5 front=6.2 back=19.5 side=5.9 ok
sealArrows r=6 front=7.5 back=44.5 side=7.1 ok
frostNeedles r=4.5 front=6.0 back=32.1 side=5.3 ok
thunderNeedles r=4.5 front=6.0 back=16.0 side=5.3 ok
twinBlades r=6 front=6.5 back=15.3 side=7.8 ok
ghostVolley r=5 front=6.5 back=24.4 side=5.9 ok
headsmanDarts r=4.5 front=6.0 back=27.0 side=5.3 ok
paperStorm r=5 front=6.5 back=17.4 side=5.9 ok
inkBloom r=4.5 front=6.0 back=22.3 side=6.3 ok
thornHalo r=4 front=6.1 back=9.0 side=4.7 ok
starShards r=5.5 front=7.0 back=18.0 side=6.5 ok
sunNeedles r=5 front=6.5 back=27.0 side=5.9 ok
inkDrizzle r=3.5 front=5.2 back=12.6 side=5.3 ok
pinHail r=4.5 front=6.0 back=18.9 side=5.3 ok
tailGuard r=5 front=6.5 back=9.8 side=5.9 ok
smokeTail r=4.5 front=6.0 back=28.6 side=6.7 ok
gravePins r=4.5 front=6.0 back=11.5 side=5.3 ok
trackingSeals r=4.5 front=6.0 back=35.5 side=5.3 ok
huntersMarks r=5 front=6.5 back=19.2 side=6.9 ok
crowFeathers r=5 front=6.5 back=19.8 side=5.9 ok
bossbane r=5.5 front=7.0 back=43.0 side=6.5 ok
```

**`--check` 결과**: 모두 ok
- C1 `k9b-c1-all`
- C2 `k9b-c2-volley`·`-burst`·`-spray`·`-rear`·`-seeker`
- C6 `k9b-c6-shots`(1배)·`-x6`
- C8 `k9b-c8-scene`·`-08`·`-x3`
- C12b `k9b-c12-scene`·`-x3`
- 확대 렌더 전부

**C9**(탄 travel 0·1, 종이/먹 %, `k9b-c9-paper`)
- 종이 폭풍 30~31/59, 먹꽃 31/65, 가시 테 34/59, 별조각 48/41
- 해바늘 25/57, 먹 이슬비 35/61, 핀 우박 23/61, 꼬리 방패 31/62
- 연막 꼬리 52~53/27~28, 묘침 33/61, 추적 인장 30/51
- 사냥꾼 표식 39/56, 까마귀 깃 28~29/63~64, 보스 사냥침 28/51
- 모두 먹 65% 이하다. volley 8종 값은 1차와 같다.
- 22종이면 원래 crop 420에서 아래가 잘려서 `--crop 0,0,1400,1080`으로 돌렸다.

**보정 C10**(`k9b-c10u-ink`, 지시서 §10-5, 창 안 먹 %)
- 종이 폭풍 17.4, 먹꽃 16.0, 가시 테 15.7, 별조각 29.2, 해바늘 19.6
- 먹 이슬비 15.4, 핀 우박 15.4, 꼬리 방패 15.2, 연막 꼬리 16.4, 묘침 27.5
- 추적 인장 15.3, 사냥꾼 표식 16.5, 까마귀 깃 15.9, 보스 사냥침 26.9
- 14종 모두 하한 15% 이상이다. volley 값은 검수 2차와 같다(쌍날 12.4, 망나니 13.9).

**C11**(`k9b-c11b-cyan32`, 32px 색): 14종 모두 청록이 보인다.
- 먹꽃은 처음에 꽃잎에 묻혀 꽃술 테를 반 바퀴·청록 3.4로 키웠다.

**C12b**(1배 색·흑백, `k9b-c12-scene`·`-gray`): 14종 평상·각성 탄 모두 몸의 가장 큰 덩어리가 종이로 읽힌다. 적 탄(먹 알 + 산호 테)과 갈린다.

### 4. 탄 실측표 (2차 14종, C7)
| 무기 | r | 앞(r−0.5~r+2.5) | 뒤(≤ 8r) | 옆(≤ r+2.5) |
|---|---|---|---|---|
| paperStorm | 5 | 6.5 | 17.4 / 40 | 5.9 / 7.5 |
| inkBloom | 4.5 | 6.0 | 22.3 / 36 | 6.3 / 7 |
| thornHalo | 4 | 6.1 | 9.0 / 32 | 4.7 / 6.5 |
| starShards | 5.5 | 7.0 | 18.0 / 44 | 6.5 / 8 |
| sunNeedles | 5 | 6.5 | 27.0 / 40 | 5.9 / 7.5 |
| inkDrizzle | 3.5 | 5.2 | 12.6 / 28 | 5.3 / 6 |
| pinHail | 4.5 | 6.0 | 18.9 / 36 | 5.3 / 7 |
| tailGuard | 5 | 6.5 | 9.8 / 40 | 5.9 / 7.5 |
| smokeTail | 4.5 | 6.0 | 28.6 / 36 | 6.7 / 7 |
| gravePins | 4.5 | 6.0 | 11.5 / 36 | 5.3 / 7 |
| trackingSeals | 4.5 | 6.0 | 35.5 / 36 | 5.3 / 7 |
| huntersMarks | 5 | 6.5 | 19.2 / 40 | 6.9 / 7.5 |
| crowFeathers | 5 | 6.5 | 19.8 / 40 | 5.9 / 7.5 |
| bossbane | 5.5 | 7.0 | 43.0 / 44 | 6.5 / 8 |

### 5. 직접 본 렌더
위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`

**게임 크기**
- C2: `k9b-c2-volley`·`-burst`·`-spray`·`-rear`·`-seeker`(1배 드래프트 타일)
- C11: `k9b-c11b-cyan32`
- T1·T2·T3: `k9b-t1-looks`, `k9b-t2-kinds`, `k9b-t2-kinds-awakened`, `k9b-t2-cross`(volley ↔ spray·rear 32·20px 흑백), `k9b-burst-small`, `k9b-t3-blind20` → `k9b-t3-key`
- 탄 장면: `k9b-c6-shots`, `k9b-c8-scene`·`-08`·`-gray`, `k9b-c12-scene`·`-gray`

**확대**
- 아이콘: `k9b-icons14`(14종 평상·각성 2배), `k9b-burst-icons`, `k9b-spray-icons`, `k9b-rear-icons`, `k9b-seeker-icons`, `k9b-r1-icons`, `k9b-c11-fix-icons`
- 세부: `k9b-drizzle-x6`, `k9b-hunters-x4`, `k9b-bossbane-x4`, `k9b-bloom-32-x8`, `k9b-t1-zoom`, `k9b-t2-zoom`
- 탄: `k9b-shots14-x8`(+ `-left`·`-right` 크롭), `k9b-shotsheet-burst`, `k9b-shotsheet-rest`, `k9b-darts-shot`…, `k9b-c6-shots-x6`, `k9b-c8-scene-x3`, `k9b-c12-scene-x3`

**글자 출력**: `k9b-c4-scan`, `k9b-c5-unchanged`(+`-before`), `k9b-c7-meta`, `k9b-c9-paper`, `k9b-c10u-ink`, `k9b-keep-hash`(+`-codes`·`-before`)

### 6. T1~T3 자가 판정

**T1**
- needleStorm 14칸(핵심 + 13), fanKnives 7칸, mirrorClone 4칸이 32px 색·흑백, 20px 흑백에서 서로, 그리고 핵심 아이콘과 갈린다.

**T2**
- 20px 흑백 주 덩어리가 kind 안에서 모두 다르다.
  - burst: 바람개비 / 검은 꽃 / 끊긴 가시 고리 / 먹 폭발 위 흰 파편 / 흰 공 + 바늘
  - spray: 검은 방울 원뿔 / 흰 핀 원뿔 + 검은 통
  - rear: 흰 단검 부채 / 회색 연기 띠 / 검은 땅 + 흰 핀(셋 다 위에 목도리)
  - seeker: 갈라지는 점선 셋 / 다트 넷 / 깃 부채 / 오른쪽 검은 보스 + 흰 가면
- 각성판은 32px에서 갈리지만, 20px에서는 1차와 같이 틀이 화면을 채운다(Q7).

**검수 1차 §3 #1 조건**(volley 먹 바탕 ↔ rear·spray, 20px, `k9b-t2-cross`)
- 겹치는 쌍은 없다.
- 가장 가까운 쌍은 둘이고, 3차 T3에서 다시 본다.
  - 혼령 ↔ 먹 이슬비: 꽉 찬 부채 대 낱낱의 방울
  - 서리침 ↔ 묘침: 먹 땅이 오른쪽 아래 대 왼쪽 아래

**작업 중 고친 오독**

| 무기 | 오독 | 고친 것 |
|---|---|---|
| 종이 폭풍 | 먹 나선 '@' | 휘감기 셋으로 나눔 |
| 가시 테 | 가운데 점이 눈 | 고리 안을 비움 |
| 해바늘 | 반경 바늘이 햇살 | 18~32° 비낌 |
| 꼬리 방패 | 한 축 부채가 셔틀콕, 원반 날밑이 막대사탕 | 손잡이를 겹쳐 모음, 날밑을 타원으로 |
| 연막 꼬리 | 덩이 줄이 조약돌, 나선 컬이 '@' | 한 덩어리 + 열린 호 |
| 까마귀 깃 | 검은 깃과 먹귀가 붙음, 대칭 깃이 나뭇잎 | 먹귀 앞에서 멈춤, 비대칭 깃 + 깃촉 |
| 보스 사냥침 | 선 뿔 둘이 고양이 귀 | 뒤로 젖힌 뿔 하나, 가면은 3/4 한 시점 |
| 사냥꾼 표식 | 섬광이 가시 덩이 | 박힌 자리로 옮김 |
| 탄: 먹꽃·먹 이슬비 | 눈 | 길게 늘이고 비대칭 |
| 탄: 핀 우박 | 일식 눈 | 먹 선 고리 |
| 탄: 꼬리 방패 | 막대사탕 | 비스듬한 타원 날밑 |
| 탄: 까마귀 깃 | 물고기 | 비대칭 깃 |

**T3**
- 22종이 자리표시라 정식 판정은 3차다.
- 섞은 시트에서 2차 14종 자리는 다음과 같다: 1 crowFeathers, 3 pinHail, 6 bossbane, 15 sunNeedles, 16 thornHalo, 17 inkDrizzle, 18 tailGuard, 24 huntersMarks, 26 trackingSeals, 29 smokeTail, 33 gravePins, 34 paperStorm, 37 starShards, 40 inkBloom.

### 7. 지시서 대비

#### 7.1 검수 정정 반영
- §10-1 32px 청록: 선 요소는 청록 2.4 이상 + 먹 테(합 4.8)다. 길이는 대부분 20 이상이다.
  - 예외는 핀 우박 홈이다. 날 안에 머물러야 해서 2.4 → 0.6으로 가늘어진다(약 20).
  - 별조각 섬광 심은 면 요소이고, 지름 5 이상이다.
- §10-2: 먹귀는 겹치지 않는다. 먹 튐은 윤곽에 붙이거나 땅에 떨어진 튐으로 그렸다.
- §10-3 각성 겹 테: 공용 `shot()` 그대로다.
- §10-5: C10은 보정 측정으로 판정했다.

#### 7.2 다르게 한 것 (API §9.4 17~25)
- **17. 탄 먹 비율 줄임.** 사양대로면 C9 먹이 먹꽃 약 80%, 가시 테 82%, 먹 이슬비 74%였다. 먹침 F3와 같은 판단으로 고쳤다.
  - 먹꽃: 앞 55% → 35%
  - 가시 테: 밑동 35% → 좁은 띠 + p300
  - 먹 이슬비: 앞 40% → 25%
- **18. 탄 비율.** 길이 ≥ 폭 2배를 맞추고 눈 기미를 없애려고 늘였다.
  - 먹꽃 꽃잎 12×7.2 → 14.5×6.7
  - 먹 이슬비 물방울 10.5×5.6 → 12.2×5.4
- **19. 탄 세부**
  - 꼬리 방패 날밑: 날 뒤 타원
  - 핀 우박 손잡이: 먹 선 고리
  - 연막 꼬리 연기: 한 덩이
  - 까마귀 깃: 비대칭
  - 묘침: 비석 받침
  - 꼬리 길이: 추적 인장 −30, 보스 사냥침 −38(각성 8r 안)
- **20. 아이콘 먹 바탕.** 1차 #1과 같은 근거로 깔았다: 종이 폭풍, 별조각, 해바늘 그림자, 추적 인주, 먹 이슬비 튐, 핀 우박 튐.
- **21. 크기·자리**(20px 주 덩어리와 C10 하한)
  - 가시 테: 덩굴 9.6±2.6, 가시 11~22
  - 핀 우박: 핀 18~38
  - 먹 이슬비: 방울 9.5~17
  - 추적 인장: 과녁 r +1.5
  - 꼬리 방패: 먹귀 (46, 112) r 13, 단검 50·54·64
  - 까마귀 깃: 출발 (36, 70), 거리 44~60
- **22. 해바늘 바늘.** 반경에서 18~32° 비꼈다(욱일 무늬 회피).
- **23. 청록 길이·굵기.** 먹꽃 반 바퀴 3.4, 먹 이슬비 줄 20~22, 사냥꾼 끈 약 22로 했다.
- **24. 연막 꼬리 연기 덩이.** 6개다(지시서 3~4).
- **25. 보스.** 가면은 왼쪽을 향한 3/4 한 시점이고, 뿔은 뒤로 젖힌 하나다.

### 8. 메인 세션 등록값

**굽기 순서**: `KIT_FILES`는 그대로다(`'k-icons2.js'`는 이미 `'k-icons.js'` 뒤).

**UI 시트**(done 22종 × [평상, 각성] = 44칸, ids 순서)
- `arsenal-tiles`: 열 8, 칸 [166,166], 원점 [−8,−8] → 6행, 2656 × 1992(@2x)
- `arsenal-slots`: 열 9, 칸 [56,60], 원점 [−2,−2] → 5행, 1008 × 600(@2x)
- 칸 순서: inkDarts, brushQuills, sealArrows, frostNeedles, thunderNeedles, twinBlades, ghostVolley, headsmanDarts, paperStorm, inkBloom, thornHalo, starShards, sunNeedles, inkDrizzle, pinHail, tailGuard, smokeTail, gravePins, trackingSeals, huntersMarks, crowFeathers, bossbane
- `build-arsenal-art.mjs`: done 키의 배지를 지운다. `src/ui/uiArt.test.ts` 키 목록을 갱신한다.

**탄**(skills 팩)
- 22종 × 12장 = 264장. 2차 추가는 168장이다.
- 박스 넓이 합은 295,056이다(1차 112,416 + 2차 182,640).
- 키 `skill/<id>/<part>/<frame>`, `scale: 1`, 박스·앵커는 parts 값이다.

**렌더러**: `worldRenderer.ts:85` `SKILL_SHOTS`에 14종을 더해 22종으로 한다. 각성 조각이 없으면 평상 조각으로 떨어지게 하는 권장은 그대로다.

**확인**: `npm run build:ui-art`, `node scripts/build-arsenal-art.mjs`, `npm run build:atlas`, `npm run test:unit`, `npm run build`(초기 에셋 예산), `npm run bench:packs`.

### 9. 사람 클린업 · 한계
- **사람 클린업**(1차 목록에 더함)
  - 연기·덩굴·바늘꽂이·비석·별 파편·보스 가면과 뿔·깃털 결·접힌 종이·붓 튐의 붓 질감
  - 문화 검토: 가시 테(가시관), 해바늘(햇살·욱일), 별조각, 묘침(묘·비석)
- **블랙 스팟**: 먹 이슬비·핀 우박·꼬리 방패·추적 인장은 하한 15%에 붙어 있다. 3차 T3에서 44종과 함께 다시 본다.
- **각성판 20px**: 1차와 같이 틀의 한계가 있다(Q7).
- **판독 시험**: 정식 판독 시험(n ≥ 8)과 실제 게임 화면(`test:visual`)은 등록 뒤에 본다.
- **측정 한계**: C9와 보정 C10은 필터·묶음 opacity를 무시하는 근사치다.

---

## 검수 4차 — K9 2차 납품 (burst·spray·rear·seeker 14종), art-director, 2026-10-16

**판정: 수정 후 합격.** 고칠 것은 셋이다(M1~M3).

- **같은 계열 구별(사용자 요청)**: 아이콘은 충족한다. 탄은 한 쌍만 1배에서 겹친다(M3: 먹꽃 ↔ 먹 이슬비).
- **volley 보존 해시**: 정확히 같다.
- **다르게 한 것 17~25**: 9건 모두 받아들인다.
- **문화 검토 3건**(가시 테·해바늘·묘침): 지시서의 회피 규칙을 지켜 받아들인다. 사람 검토는 그대로 남긴다.
- **고칠 것**
  - M1 별조각: 다섯 조각이 정칙 별로 놓였다. 지시서 §3.4가 이 무기에 금지한 꼴이다.
  - M2 연막 꼬리: 효과 표지 먹귀가 연기에 묻혔고, 연기가 애벌레·조약돌로 읽힌다.
  - M3 먹꽃 탄: 같은 계열인 먹 이슬비 탄과 1배에서 같은 꼴이다.
- 세 곳 말고는 출력을 바꾸지 않는다(§6의 보존 해시로 확인). 수정 1회차 뒤 검수 5차로 확인한다.

### 1. 직접 돌린 검사
렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r4-*.png`에 있고, kit error는 0건이다.

| 검사 | 결과 |
|---|---|
| C5 `k9r4-c5-unchanged` | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18`. 기준값과 같다 |
| C4 `k9r4-c4-scan` | `icons bad=0 text=0 hatch=0 nocyan=0`, `stamps bad=0 text=0 filter=0 nocyan=0 colours={}` |
| C7 `k9r4-c7-meta` | `meta ok \| invalid calls ok \| core list=17`. 22줄 모두 ok이고 실측이 납품서 §4와 같다 |
| `--check` | 모두 ok: C1, C2(volley·burst·spray+rear·seeker·나머지 6 kind), C6(1배·6배), C8(1배·0.8배), C12b, 탄 시트 14종 6조각 × 2장, 아이콘 14종 3배 |
| C9 `k9r4-c9-paper` | 납품서 원문과 같다. 14종 모두 먹 65% 이하 |
| C10u `k9r4-c10u-ink` | 14종 모두 15% 이상(가장 낮은 것은 꼬리 방패 15.2). volley는 그대로다(쌍날 12.4, 망나니 13.9, 3차 T3에서 판정) |
| C11b `k9r4-c11b-cyan32` | 32px 색에서 14종 모두 청록이 보인다 |
| C8·C12b 흑백 | 22종 모두 밝은 몸이고 적 탄(어두운 알 + 밝은 테)과 갈린다 |
| 결정성·자리표시 `k9r4-placeholder-determinism` | 528개 호출이 두 번 모두 같다. 남은 22종 자리표시 44/44가 핵심 그림 그대로다. `list 17 ICON 17`, done 22, shots 22 |
| T6 | 14종 평상 타일의 낙관 구역이 비어 있다. 覺 낙관은 바탕만 가린다 |

### 2. 요청하신 네 가지

**(1) 같은 look 무기끼리 32px·20px에서 갈리는가 — 아이콘은 갈린다. 탄은 한 쌍이 겹친다.**
- **T1** 나란히 보기(`k9r4-t1-*`, 2배 확대 포함): needleStorm 14칸, fanKnives 7칸, mirrorClone 4칸이 32px 색·흑백과 20px 흑백에서 서로 갈리고 핵심 아이콘과도 갈린다.
- **블라인드 시험**: 정답을 모르는 새 순서로 섞어 먼저 맞힌 뒤 정답표와 대조했다.
  - 1배 렌더를 그대로 보면 20px 6/25, 32px 13/25였다. 이건 제 작은 이미지 판독 한계 때문이다.
  - 그래서 렌더 정보량은 32px·20px 그대로 두고 픽셀 블록으로 확대해 다시 봤다.
  - 32px needleStorm 14칸(`k9r4-blind-needle32px`): **14/14**.
  - 20px 흑백, 그린 22종 + 핵심 3종(`k9r4-blind-all20px`): **25/25**.
  - 이 확대 시험을 지시서에 넣자고 제안한다(§5-4).
- **T2**: 20px 흑백에서 kind 안의 주 덩어리가 모두 다르다.
  - 각성판은 32px에서 갈린다. 20px은 1차와 같이 빌린 틀의 한계다(Q7).
- **탄**: 같은 kind 안에서는 1배에서 모두 갈린다(C6).
  - 같은 계열로 넓히면 먹꽃과 먹 이슬비가 1배에서 둘 다 '먹 끝이 뾰족한 흰 물방울 + 뒤 방울'이다(`k9r4-needle-shots-1xpx`, `k9r4-family-shots-x4`) → M3.

**(2) volley 8종 보존 해시 — 정확히 같다.**
- `k9r4-keep-hash`: `volley-keep=vko1lv len=992714 | shots=8wzptx len=134704 | exact-match=true`. 넷째 글자는 숫자 1, 다섯째는 소문자 l이다.
- 납품서의 설명이 맞다. 원래 식은 `done`으로 걸러서 2차부터는 14종이 섞인다. 무기 목록을 8종 이름으로 고정한 식이 맞다.
- 각성 망나니까지 넣은 volley 전체 기준값: `lfot85 len=1080615`. 첫 글자는 소문자 l이고, 글자 코드는 108,102,111,116,56,53이다. 3차에서는 이 값도 함께 대조한다.

**(3) 다르게 한 것 17~25** → §3.

**(4) 문화 검토**

| 무기 | 판정 | 근거 · 남은 위험 |
|---|---|---|
| 가시 테 | 받아들임 (사람 검토) | 덩굴이 세 토막으로 끊겼고, 가시는 바깥으로만 휘며 길이가 제각각이다. 머리·인물이 없는 정면 원이고 가운데는 비었다. 지시서의 회피 조건을 지켰다.<br>가시 고리라는 꼴 자체가 가시관과 가까운 건 남는다. 권장 R7로 줄인다 |
| 해바늘 | 받아들임 (사람 검토) | 바늘이 반경에서 18~32° 비껴, 기울기가 번갈아 바뀌고, 시작 반경·길이가 다르며, 틀 가장자리에 닿지 않는다. 흰 3/4 바늘꽂이와 그림자가 있어 평면 원반 문장이 아니다. 고른 16줄기 햇살은 없다.<br>20px에서는 일반적인 '☀'로 읽힌다. 각성(22개)도 기울기가 번갈아 회전 문양(태양 바퀴)이 되지 않는다 |
| 묘침 | 받아들임 | 비석이 둥근 위 판뿐이고 십자·글자가 없다. 이름 그대로의 '묘 표지'다. 사람 클린업 때도 종교 표식·비문을 넣지 않는다 |
| 더 올리는 것 | 사람 검토 목록 | 별조각(M1 뒤 다시), 종이 폭풍(쉼표 둘이 감기는 巴 꼴·네 팔 갈고리 바람개비가 되지 않게; 지금은 날 5 + 3, 휘감기 셋이 길이·반경이 달라 괜찮다), 쌍날 각성(1차부터), 보스 사냥침(가오나시와 닮음, R3) |

### 3. 지시서와 다르게 한 것 17~25

| # | 판정 | 이유·조건 |
|---|---|---|
| 17 탄 먹 비율 줄임(먹꽃·가시 테·먹 이슬비) | 수용 | 검수 1차 F3와 같은 판단이고 C9가 65% 이하다. 먹꽃이 먹 이슬비와 같아진 건 M3에서 꼴로 가른다 |
| 18 탄 꼴 비율(길이 ≥ 폭 2배) | 수용 | 지시서 수치가 자기 규칙(§4.3)과 부딪쳤다 |
| 19 탄 세부(타원 날밑, 먹 선 고리, 연기 한 덩이, 비대칭 깃, 비석 받침, 실 −30·−38) | 수용 | 막대사탕·일식 눈·조약돌·물고기 판독을 막았다. C7 뒤 35.5/36, 43.0/44로 8r 안이다 |
| 20 아이콘 먹 바탕 | 수용 | 1차 #1과 같은 근거다. 조건: 3차 T3에서 왼쪽 아래 먹(혼령·먹 이슬비·핀 우박·묘침)과 오른쪽 먹(서리침·뇌침·망나니·보스)을 lob·strike와 함께 다시 본다 |
| 21 크기·자리 | 수용 | 지시서 범위를 넘는 것(핀 18~38, 방울 9.5~17, 덩굴 9.6 ± 2.6 등)은 20px 주 덩어리와 C10u 하한 때문이다. 판독이 좋아졌다 |
| 22 해바늘 비낌 | 수용 | 지시서가 의도한 문화 회피를 제대로 구현했다 |
| 23 청록 길이·굵기 | 수용 | §10-1에 맞는다. 먹 이슬비 줄이 평행선처럼 보이는 건 R2 |
| 24 연기 덩이 여섯 | 수용(개수) | 개수는 문제가 아니다. 덩이마다 따로 둘린 그림자와 고르게 커지는 크기가 마디를 만든다 → M2 |
| 25 보스 가면·뿔 | 수용 | §3.3을 지켰다(아래 얼굴 검토). 실루엣은 R3 |

**얼굴 검토**(`k9r4-bossbane-mask-x8`): 이번 발주에서 유일한 얼굴이다.
- 왼쪽으로 돈 3/4 한 시점이고, 먼 눈 폭 5.6 / 가까운 눈 9.2 = 0.61이다.
- 먼 쪽 여백 4.2가 가까운 쪽 5.7보다 좁다.
- 코·입이 없고, 먹테 3.4, 눈빛 둘, 오른쪽 아래 p300 그늘이 있다.
- 면적은 약 4.9%다(12% 이하).
- 섞인 시점은 없다.

### 4. 고칠 것 (수정 1회차)

#### M1 — 별조각이 '5갈래 정칙 별'로 읽힌다 (T5)
- **본 렌더**: `k9r4-icon-starShards`(3배), `k9r4-starshards-sizes`(흑백 120·32·20px), `k9r4-blind-all20px` 10번 칸.
- **문제**: 지시서 §3.4 별조각 '피할 것: 4·5갈래 정칙 별', §2.6 '고르게 뻗은 별'.
- **원인**: `DRAW.starShards` `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js:729-752`
  - `pos`(`:741`)의 각이 −152·−82·−8·62·134°라 사이각이 70·74·70·72·74°다.
  - 거리는 39~41로 같고, 조각마다 반경 방향을 향해 5회 회전대칭이 된다.
  - 뒤 폭발 `splashD(64,66,47,8,…)`(`:732`)도 가운데에 놓인 8갈래 별꼴이다.
- **처방**(예시 값이고 ±6 안에서 다듬어도 된다)
  - `pos = [[-160,36,0,1.2],[-104,50,1,0.85],[-60,36,2,1.0],[6,50,3,1.25],[100,40,4,0.95]]`. 사이각은 56·44·66·94·100°로, 가장 큰 사이각이 가장 작은 것의 1.8배 이상이다.
  - 조각마다 반경에서 ±12~28° 비틀어 돈다(`shard(…, a + tilt, …)`).
  - 각성 여섯째 조각도 다시 고르게 만들지 않는 자리에 둔다.
  - 폭발은 중심을 (60, 70) 쪽으로 옮기고, 세로를 0.86으로 줄이고, 갈래를 6~7개로 고르지 않게 해 한쪽으로 치우친 터짐으로 만든다.
- **바꾸면 안 되는 것**
  - 조각 5(각성 6). 4~5각 조각, 바깥 꼭짓점, p300 면, 두꺼운 테
  - 가운데 먹 금 + 7갈래 섬광 + 청록 심
  - 관통 먹귀 (104, 102) r 11. 조각은 이 먹귀와 종이 테까지 4 이상 띄운다
  - 낙관 구역 비움, 탄(`SHOT.starShards`)
- **합격 기준**
  - 흑백 120·32·20px와 20px 확대 시험에서 별·오각형·꽃으로 읽히지 않는다.
  - burst 줄(종이 폭풍·별조각·해바늘)이 계속 갈린다.
  - C10u 15~55%, C2-burst `--check` ok.

#### M2 — 연막 꼬리: 효과 표지 먹귀가 연기에 묻혔고, 연기가 애벌레·조약돌로 읽힌다
- **본 렌더**
  - `k9r4-smoke-ghoul-x6`: 먹귀 (22, 90)이 덮여 슬릿 눈이 보이지 않는다.
  - `k9r4-smoke-tiles-x2`, `k9r4-icon-smokeTail`: 고르게 커지는 둥근 마디 사슬로 보인다.
- **문제**
  - 지시서 §3.2 '먹 감속: 먹귀 발이 먹에 잠기고 뒤로 방울 1~3', §3.4 연막 꼬리 효과 표지가 사라졌다.
  - 드래프트 120px에서 애벌레·조약돌로 읽힌다. 지시서가 경계한 판독이다.
- **원인**: `DRAW.smokeTail` `k-icons2.js:898-921`
  - 먹귀를 연기보다 먼저 그린다(`:917-918`).
  - 덩이 여섯(`:908`)의 반지름이 7 → 15 → 11로 고르게 변한다.
  - 덩이마다 담묵 그림자를 따로 옮겨 그리고(`:910`), 색을 ink5/ink7로 번갈아 칠한다(`:911`).
- **처방**
  1. 그리는 순서를 바꾼다: 연기 뒤쪽 → 먹귀 → 먹귀 아래 30%(발)만 덮는 앞 연기 자락 → 먹귀 뒤로 끌리는 방울 1~3.
     - 슬릿 눈과 위 절반이 드러나야 한다. 필요하면 먹귀를 (20, 88) 쯤으로 옮긴다.
  2. 덩이 윤곽이 따로 드러나지 않게 한 실루엣으로 만든다.
     - 반지름은 고르게 커지지 않게 한다(예: 6·10·8·15·11·14). 50% 이상 겹친다.
     - 바탕은 ink5 한 톤에 ink7 뭉게 면 2~3개, 열린 컬 획 3~4를 넣는다. '@'는 금지다.
     - 담묵 그림자는 실루엣 사본 하나를 아래 가장자리에만 둔다(탄 `SHOT.smokeTail`의 '한 덩이' 문법).
  3. 매듭 쪽은 가늘고, 왼쪽으로 갈수록 넓어지며 조금 오른다. 위 가장자리는 물결, 아래는 땅을 따라 평평하게 한다.
- **바꾸면 안 되는 것**
  - 매듭 + 청록 목도리
  - 종이 연막침 둘이 왼쪽으로 튀어나옴(앞 55~60%는 보이게)
  - 각성 3개 + 연기 1.2배
  - C10u ≥ 15%, 낙관 구역 비움
- **합격 기준**
  - C2 타일 1배·2배에서 연기 줄기로 읽히고 마디·조약돌로 읽히지 않는다.
  - 2배에서 먹귀 슬릿 눈이 보이고, 발이 연기에 잠기며, 방울이 끌린다.
  - 32·20px 확대 시험과 T2 rear 줄에서 계속 갈린다. C2 `--check` ok.

#### M3 — 먹꽃 탄과 먹 이슬비 탄이 1배에서 같은 꼴이다 (같은 계열, 사용자 요청)
- **본 렌더**: `k9r4-needle-shots-1xpx`(1배 정보량 8배 확대), `k9r4-c6-burst-x6`, `k9r4-c6-spray-rear-x6`.
- **문제**
  - 둘 다 needleStorm 계열이다(사용자 2026-10-15 요청).
  - 지시서 §4.1 '탄은 아이콘 모티프와 같은 물건'인데, 아이콘은 검은 꽃잎이고 탄은 흰 물방울이다.
- **원인**
  - `SHOT.inkBloom` `k-icons2.js:1330-1339`: 둥근 뒤 −8.5, 먹 끝 +6, 반폭 3.7/3.0, 뒤 방울.
  - `SHOT.inkDrizzle` `:1381-1391`: 둥근 뒤 −7, 먹 끝 +5.2, 반폭 2.7, 뒤 방울. 같은 꼴이다.
- **처방**(먹꽃만 고친다. 먹 이슬비는 '둥근 물방울'로 남긴다)
  1. 실루엣을 뒤집는다. 가장 넓은 곳을 x ≈ +1(반폭 3.6)로 옮기고, 뒤로 갈수록 가늘어져 x −8.5에서 반폭 1.4 이하가 되게 한다. 끝에는 깊이 1.2~1.6의 V 홈을 둔다.
     - 결과는 '밑이 갈라진 잎꼴 꽃잎'이고, 먹 이슬비는 '뒤가 둥근 물방울'이다.
  2. 방울을 뒤가 아니라 꽃잎 아래에 매단다(x −3~−6, y +4.2~+5.2). 꽃잎 아랫면에서 내려오는 짧은 먹 줄에 단다.
  3. 앞쪽 먹은 35% 이하로 두고 C9 먹 ≤ 65%를 지킨다. 청록 잎맥은 그대로 둔다.
- **바꾸면 안 되는 것**: 박스 50×20, 앵커 (39, 10), 앞끝 6.0, 옆 ≤ 7.0, 6조각 × 2장과 end·각성 문법, 먹 이슬비 탄 전부.
- **합격 기준**
  - 1배 정보량 확대 렌더(`k9r4-needle-shots-1xpx`와 같은 식)에서 두 탄이 다른 물건으로 읽힌다.
  - C7 inkBloom ok, C9 먹 ≤ 65%, C12b 흑백에서 밝은 몸.

### 5. 권장 (이번에 함께 하거나 3차까지)
- **R1 사냥꾼 표식**: 청록 끈 넷이 모두 같은 J 갈고리다(`markDart :1000`의 `sd`가 늘 −1, 처짐 14~17). 32px에서 같은 기호가 넷 반복된다.
  - 흔드는 쪽을 번갈아(±1) 두고, 처짐을 9~20으로 하고, 한 패는 위로 날리게 한다.
- **R2 먹 이슬비 아이콘**: 청록 줄 셋(`:805-810`)이 거의 평행하고 길이가 같아(20/22/20) '≡'로 읽힌다(§2.6).
  - 길이를 14/20/26으로, 사이 각을 8° 이상 벌리거나 살짝 휘게 한다.
- **R3 보스 사냥침**(`:1066-1091`): 얼굴 규칙은 합격이다. 다만 실루엣이 두건 쓴 유령(가오나시)에 가깝다.
  - 뿔을 머리 덩어리와 홈으로 떼고, 마디 있는 굽은 뿔로 만들고, 어깨 갑주 혹을 더한다.
  - 가면은 달걀꼴 대신 이마를 자른 선이나 각진 턱으로 한다.
- **R4 먹꽃 아이콘**: 꽃잎 사이각이 60° ± 4°라 20px에서 '✻'로 읽힌다. ±8~10°로 흔들고 한 잎을 휘게 한다(`pe :672`).
- **R5 꼬리 방패 아이콘**: 속도 획이 손잡이 끝에서 바로 시작해(`:883`) 손잡이와 한 몸의 긴 펜·주사기처럼 보인다. 획을 손잡이 끝에서 3 뒤에서 시작한다.
- **R6 추적 인장**: 종이 네모 인영(`:986-987`)이 슬릿 눈 옆·아래에 놓여 120px에서 벌린 입처럼 보인다. 몸 아래 뒤쪽으로 옮긴다.
- **R7 가시 테**(`:704`): 16°·18° 틈을 24° 이상으로 벌리고, 한 토막 끝에 덩굴손을 둔다(가시관에서 멀어진다).
  - 3차에서 각성판이 핵심 검은 태양(서리 고리 look)과 32·20px에서 갈리는지 교차 확인한다.
- **R8 결 매듭**(`knotScarf :860`): 고리 위 담묵 획 둘이 안쪽으로 모여 2배 이상에서 성난 눈썹(작은 얼굴)으로 보인다. 고리 윤곽을 따르는 접힘 선 하나로 바꾼다.

### 6. 수정 뒤 확인 명령 (검수 5차)
- M1~M3에서 바뀌는 것은 다음 셋뿐이다. 나머지 출력이 그대로인지 보존 해시로 확인한다.
  - 별조각 아이콘(평상·각성)
  - 연막 꼬리 아이콘(평상·각성)
  - 먹꽃 탄
- 아래 명령의 출력을 수정 전과 후에 같은 값으로 맞춘다. 수정 전 값을 납품서에 적는다.

```
node scripts/art-review-sheet.mjs expr --name k9-keep22-hash --scale 1 --crop 0,0,1000,40 --expr '(function(){var X=PN.arsenal;function norm(m){return m.replace(/\bki\d+/g,"ki").replace(/\bkar\d+/g,"kar");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}var A="",B="",SKIPI={starShards:1,smokeTail:1},SKIPS={inkBloom:1};X.ids.filter(function(id){return X.META[id].done;}).forEach(function(id){if(!SKIPI[id])[false,true].forEach(function(a){A+=norm(X.skill(id,{awakened:a}))+norm(X.tile(id,{awakened:a,metal:true,size:150}))+norm(X.hudSlot(id,{size:40,awakened:a}));});if(X.META[id].shot&&!SKIPS[id])X.parts(id).forEach(function(p){for(var f=0;f<p.frames;f++)B+=norm(X.stamp(id,p.part,{frame:f}));});});return "<rect width=\"1000\" height=\"40\" fill=\"#fff\"/><text x=\"4\" y=\"26\" font-size=\"14\" font-family=\"monospace\">keep22-icons="+h(A)+" len="+A.length+" | keep22-shots="+h(B)+" len="+B.length+"</text>";})()'
```

- 그 밖에 다시 돌릴 것
  - C1, C2(burst·rear), C4, C5, C7, C9, C10u, C11b, C12b(흑백 포함)
  - volley 보존 해시: `vko1lv`·`8wzptx`와 위 `lfot85`
  - 20px 확대 블라인드 시험(아래 §7-4 명령)

### 7. 메인 세션: 등록 때 주의할 것
1. **굽기 시점**
   - volley 8종은 검수 3차 뒤로 바뀌지 않았다(해시 확인). 바로 등록·굽기해도 된다.
   - 2차 14종은 검수 5차(M1~M3) 뒤에 굽는다. 세 곳을 빼고 미리 구우면 시트와 CSS를 두 번 굽게 된다.
2. **UI 시트**(done 22 × [평상, 각성] = 44칸, ids 순서)
   - `arsenal-tiles` 2656×1992(6행), `arsenal-slots` 1008×600(5행). 계산이 맞다.
   - 1차(2행)와 행 수가 달라 CSS `background-size`·`position` 백분율이 모두 바뀐다. 시트·CSS·`build-arsenal-art.mjs`(done 22키 배지 제거)·`src/ui/uiArt.test.ts` 키 목록을 한 번에 다시 만든다.
   - 디코드는 약 21 MB + 2.4 MB(계산)다. `npm run build`로 초기 에셋 예산을 본다. 3차면 2656×3652가 된다.
3. **탄**
   - 22종 × 12장 = 264장, 박스 넓이 합 295,056이다. 2차 추가분 182,640을 직접 계산해 확인했다.
   - skills 팩을 늘린 뒤 `npm run bench:packs`를 돌린다.
   - `readSkillVfx`가 `PN.arsenal.parts`를 읽게 하되 `window`(한글)는 옮기지 않는다.
4. **렌더러**
   - `worldRenderer.ts:85` `SKILL_SHOTS`를 22종으로 한다.
   - 무기 자신의 그룹을 고르고(`:1359`), 각성 조각이 없으면 평상 조각으로 떨어지게 한다.
5. **`npm run test:visual` 장면**
   - HUD에 needleStorm 계열 6슬롯: 먹침·인장 화살·먹꽃·가시 테·먹 이슬비·추적 인장. 사용자 요청을 실제 화면에서 본다.
   - 드래프트: 해바늘(신화), 별조각(수정 뒤), 보스 사냥침, 가시 테 각성
   - 전투 1.0배·0.8배, Ch1·Ch5 바닥
     - burst 고리 다섯
     - spray 줄기 둘(먹꽃 ↔ 먹 이슬비 M3 확인)
     - rear 셋
     - seeker 넷(보스가 있을 때 보스 사냥침)
6. **지시서 정정**(`docs/art/briefs/arsenal-icons.md` §10에 더한다)
   1. §3.1 burst
      - 모티프 6개 이하는 회전 규칙성을 깬다: 가장 큰 사이각이 가장 작은 것의 1.6배 이상, 거리 차 20% 이상.
      - 무기별 '정칙 별 금지'가 ±6° 틀보다 앞선다.
   2. §4.5: 같은 **look** 계열의 탄도 1배에서 갈려야 한다(사용자 2026-10-15). C13으로 계열별 1배 확대 탄 시트를 더한다.
   3. §3.2: 효과 표지 먹귀는 눈이 보여야 한다(먹·연기·타르에는 발만 잠김).
   4. §5.1 T3
      - 에이전트 검수자는 1배 렌더를 그대로 판독하기 어렵다(이번 6/25 대 확대 25/25).
      - 20px 정보량을 픽셀 블록으로 확대한 블라인드 시험을 보조 도구로 더한다. 명령은 `k9r4-blind-all20px` 식이고, 아래에 시드를 바꿔 쓸 수 있게 둔다.
      - 사람 판독 시험(n ≥ 8)은 그대로다.
   5. 보존 해시는 무기 목록을 고정한 식으로 바꾼다. C9 crop은 `0,0,1400,1080`으로 한다.
7. **사람 클린업**(납품서 §9에 더한다)
   - 연기 줄기의 붓 질감, 별조각 흩어짐, 결 매듭 접힘 선
   - 보스 실루엣(가오나시와 닮은 점 확인 포함)
   - 가시 덩굴(덩굴손·잎)

**T3 보조 명령(20px 확대 블라인드, 시드 `r=90210`을 바꿔 쓴다)**
```
node scripts/art-review-sheet.mjs expr --name k9-t3px-blind20 --scale 8 --crop 0,0,135,135 --expr '(function(){var X=PN.arsenal,I=PN.icons,ids=X.ids.filter(function(i){return X.META[i].done;}).map(function(i){return ["a",i];}).concat([["c","needleStorm"],["c","fanKnives"],["c","mirrorClone"]]),r=90210;for(var i=ids.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1),t=ids[i];ids[i]=ids[j];ids[j]=t;}var g="";ids.forEach(function(it,i){var m=it[0]==="c"?I.hudSlot(it[1],{size:40}):X.hudSlot(it[1],{size:40});g+="<g transform=\"translate("+(3+(i%5)*26.5)+","+(3+Math.floor(i/5)*26.5)+") scale(0.5)\">"+m+"</g>";});return "<defs><filter id=\"k9gray\"><feColorMatrix type=\"saturate\" values=\"0\"/></filter><filter id=\"k9px\" x=\"0\" y=\"0\" width=\"135\" height=\"135\" filterUnits=\"userSpaceOnUse\" primitiveUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\"><feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"0.35\" result=\"b\"/><feFlood x=\"0.33\" y=\"0.33\" width=\"0.34\" height=\"0.34\" flood-color=\"#000\" result=\"d\"/><feComposite in=\"d\" in2=\"d\" operator=\"over\" x=\"0\" y=\"0\" width=\"1\" height=\"1\" result=\"c\"/><feTile in=\"c\" x=\"0\" y=\"0\" width=\"135\" height=\"135\" result=\"t\"/><feComposite in=\"b\" in2=\"t\" operator=\"in\" result=\"s\"/><feMorphology in=\"s\" operator=\"dilate\" radius=\"0.34\"/></filter></defs><g filter=\"url(#k9px)\"><rect width=\"135\" height=\"135\" fill=\"#b8ac93\"/><g filter=\"url(#k9gray)\">"+g+"</g></g>";})()'
```
정답표는 같은 시드의 섞기 결과를 글자로 뽑는다. `k9r4-blind-all20px-key` 식을 그대로 쓰고, 맞힌 뒤에 연다.

### 8. 미확인 · 열린 질문
- **미확인**
  - 실제 게임 화면: 등록 전이다.
  - 정식 판독 시험(n ≥ 8)
  - T3 44종: 3차에서 판정한다.
  - C9·C10u는 필터와 묶음 opacity를 무시하는 근사치다.
- **열린 질문(팀 결정)**: 사용자 2026-10-15 요청(SYS-16, 각성 기믹을 무기마다 다르게)으로 기믹이 무기별로 달라지면, 각성 아이콘 88칸도 그 기믹을 보여야 하는가?
  - 지금 각성 그림은 지시서 §2.4대로 '수 +1, 범위 1.2배'다.
  - `docs/decisions/SYS-16-awakening-gimmicks.md`는 아직 없어서 확인하지 못했다.
  - 정해지면 3차 발주 전에 지시서 §2.4를 고친다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-icons.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`

---

## 2차 수정 1회차 납품서

검수 4차의 필수 M1~M3와 권장 R1~R8을 모두 반영했습니다. 바뀐 출력은 아이콘 10종(평상·각성)과 먹꽃 탄 12장뿐입니다. volley 해시 `vko1lv`·`8wzptx`·`lfot85`는 그대로입니다. 바뀐 무기를 SKIP에 넣은 2차 해시 `12h4k5f`·`1p7d1ev`도 수정 전과 같습니다. `--check`를 붙인 명령은 모두 ok이고 실패는 0건입니다. 고친 파일은 아래 둘뿐이고, 내려받은 것은 없습니다.

### 1. 납품 목록
- 파일
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`
- 공개 API(`PN.arsenal` v1.0)는 그대로입니다. 함수·옵션·`parts()` 규격·박스·앵커가 바뀌지 않았습니다.
- 내부 도우미
  - 새로 넣음: `smokeD`(덩이 합집합 실루엣, 바닥 평평), `smokeCurl`(열린 컬)
  - 인자 추가: `inkPetal`에 `bend`, `markDart`에 `sd`
- 바뀐 출력

| 무기 | 바뀐 출력 | 항목 |
|---|---|---|
| starShards | 아이콘 평상·각성 | M1 |
| smokeTail | 아이콘 평상·각성 | M2, R8 |
| inkBloom | 아이콘 평상·각성, 탄 6조각 × 2장 | M3(탄), R4(아이콘) |
| huntersMarks | 아이콘 평상·각성 | R1 |
| inkDrizzle | 아이콘 평상·각성 | R2 |
| bossbane | 아이콘 평상·각성 | R3 |
| tailGuard | 아이콘 평상·각성 | R5, R8 |
| trackingSeals | 아이콘 평상·각성 | R6 |
| thornHalo | 아이콘 평상·각성 | R7 |
| gravePins | 아이콘 평상·각성 | R8 |

- 아이콘 출력이란 그 무기의 skill·tile·hudSlot입니다.
- 먹 이슬비 탄을 포함한 나머지 탄 21종은 바이트 단위로 같습니다.

### 2. 바뀐 것

**M1 별조각**(`k-icons2.js:737-772`)
- 조각 배치(`:756-761`)
  - 처방대로 각 −160·−104·−60·6·100°에 두었습니다. 사이각은 56·44·66·94·100°입니다.
  - 거리는 36·50·36·43·40입니다. 6° 조각만 처방의 50이 아니라 43입니다(±6 안). 46 이상이면 각성 1.1배에서 창 오른쪽 끝에 걸렸습니다.
  - 조각마다 반경에서 +22·−18·−20·+16·−26° 비틀었습니다.
  - 각성 여섯째는 비어 있던 왼쪽 아래 152°·거리 52에 둡니다. 사이각은 56·44·66·94·52·48°가 됩니다.
- 폭발(`:739-747`)
  - 중심 (60, 70), 세로 0.86의 찢긴 다각형입니다. 갈래 일곱 각각에 옆 홈을 냈습니다.
  - 왼쪽·왼쪽 아래 갈래는 반경 45~46으로 길고, 낙관 쪽·먹귀 쪽은 20~27로 짧습니다.
  - 처음 그린 깨끗한 삼각 갈래 일곱은 검은 별로 읽혔고, 가는 줄기 일곱은 기뢰·성게로 읽혀서 이 꼴로 바꿨습니다(API §9.5-26).
- 먹 금, 7갈래 섬광, 청록 심, 관통 먹귀 (104, 102) r 11, 탄은 그대로입니다. 흩어진 조각과 먹귀 테 사이는 9 이상입니다.

**M2 연막 꼬리**(`:927-978`)
- 그리는 순서: 바늘 → 뒤 연기 → 종이 테 + 먹귀 → 앞 자락 → 먹귀 왼쪽으로 끌리는 방울 둘 → 매듭.
- 연기 실루엣
  - 한 실루엣입니다. 덩이 반지름 5·8·9·13·14에 발치를 둥글리는 8을 더했고, 이웃과 약 절반씩 겹칩니다.
  - 매듭 쪽은 가는 김(높이 약 13)이고, 땅에 내려앉아 왼쪽으로 넓어지며(약 40) 왼쪽 끝이 조금 오릅니다.
  - 아래는 땅 y 104에 평평합니다.
- 연기 안쪽
  - ink5 한 톤에 ink7 뭉게 면 셋, 열린 ink3 컬 넷을 넣었습니다('@' 없음).
  - ink3 그림자는 실루엣 사본 하나뿐이고 아래 가장자리에만 보입니다.
- 먹귀와 앞 자락
  - 먹귀는 (22, 88)이고 종이 테(5.6)로 뒤 연기와 갈립니다.
  - 앞 자락은 먹귀 아래 약 30%(y 92.6 아래)만 덮습니다. 각성에서는 1.1배라 약 33%입니다.
- 연막침 둘은 연기 왼쪽 끝에서 먹귀 위로 나옵니다. 보이는 앞은 약 57%이고(계산), 각성에서는 약 51%입니다.

**M3 먹꽃 탄**(`:1397-1414`)
- 밑이 갈라진 잎꼴로 바꿨습니다.
  - 앞끝은 +6이고, 가장 넓은 곳은 x +1에서 위 3.6, 아래 3.3입니다.
  - 뒤로 가늘어져 −8.5에서 반폭 1.0이고, 그 끝에 깊이 1.3의 V 홈이 있습니다.
- 앞 먹은 19%로 줄였습니다. 24%에서는 C9 먹이 65%로 경계에 붙었습니다.
- 잎맥 청록은 가운데에 그대로 있습니다.
- 방울
  - 꽃잎 아랫면에서 뒤로 비스듬히 내려온 먹 줄에 방울 하나를 매답니다(x −4.4 ~ −5.8, y +4.4 ~ +5.0).
  - 둘을 매달면 1배에서 다리로 읽혔고, 줄이 수직이면 막대사탕 막대로 읽혔습니다.
  - end 장에서는 방울이 처져 y +5.7까지 내려갑니다.
- 박스·앵커·앞끝·6조각 × 2장은 그대로입니다.

**R1~R8**
- **R1**(`:1051-1072`): 끈이 흔들리는 쪽을 +1·−1·+1·−1로 번갈았습니다. 처짐은 12·20·−12·9이고, (104, 60)의 패는 위로 날립니다. 각성 다섯째(처짐 −10)의 패도 위로 날립니다. 아래로 처지면 첫째 먹귀에 겹칩니다(계산).
- **R2**(`:823-831`): 청록 줄을 26·14·20으로 하고, 방울 축에서 −6·+3·+5° 틀어 서로 다른 쪽으로 휘게 했습니다. 줄 사이 각은 11~13°입니다.
- **R3**(`:1127-1152`)
  - 왼쪽 어깨에 갑주 판 혹을 더했습니다(p300 테 선 둘).
  - 뿔은 종이 홈으로 머리와 떼고, p300 마디 셋을 넣어 뒤로 휘게 했습니다. 끝은 (126.5, 37.6)으로 낙관 구역 밖입니다.
  - 가면은 곧은 이마 선과 각진 턱입니다. 턱 끝 (101, 86.5)은 먼 쪽으로 치우쳤습니다.
  - 3/4 규칙은 유지합니다: 먼 눈은 가까운 눈 폭의 0.61, 눈 높이에서 먼 쪽 여백 4.3 < 가까운 쪽 5.2, 코·입 없음, 면적 약 4.4%.
- **R4**(`:659-675`): 꽃잎 각을 −171·−109·−33·9·93·130°로 했습니다(사이각 37~84°). 130° 꽃잎은 끝이 9 휩니다. 각성 일곱째는 51°입니다.
- **R5**(`:910-912`): 속도 획이 손잡이 끝점에서 8.2~21 뒤로 갑니다. 둥근 끝(−5.2)에서 3 떨어집니다.
- **R6**(`:1042-1046`): 인영을 몸 아래 뒤쪽 (−0.5r, +0.5r)으로 옮겼습니다. 반변 0.24r, d + 30° 돌림입니다.
- **R7**(`:702-730`)
  - 토막을 [−29, 64]·[88, 146]·[174, 298]°로 나눠 틈을 24·28·33°로 벌렸습니다.
  - 146° 끝에 덩굴손을 더했습니다. 고리 밖으로 250° 열린 갈고리입니다.
  - 토막 끝에 걸린 가시 넷을 1~6° 옮겼습니다.
  - 각성 72° 가시는 옛 틈 안에 떠 있어서 43°로 옮겼습니다.
  - 청록 실은 95~139°로 줄였습니다.
- **R8**(`:882-887`): 담묵 획 둘을 왼쪽 고리 아래 윤곽을 따르는 접힘 선 하나로 바꿨습니다. rear 세 무기 모두 바뀝니다.
- 지시서와 다르게 한 것은 API §9.5 26~30에 적었습니다.

### 3. 수정 전 값 → 수정 뒤 값

| 명령 | 수정 전 | 수정 뒤 |
|---|---|---|
| `k9-keep-hash` | `volley-keep=vko1lv len=992714 \| shots=8wzptx len=134704` | 같음 |
| volley 전체 | `volley-all=lfot85 len=1080615 codes=108,102,111,116,56,53` | 같음 |
| keep22x(바뀐 10종 아이콘·먹꽃 탄 SKIP) | `keep22x-icons=12h4k5f len=1787852 \| keep22x-shots=1p7d1ev len=328482` | 같음(codes 49,50,104,52,107,53,102 / 49,112,55,100,49,101,118) |
| 검수 4차 §6 keep22 원문 | `keep22-icons=1bzfhyq len=2875358 \| keep22-shots=1p7d1ev len=328482` | `keep22-icons=1m5zi4s len=2892572 codes=49,109,53,122,105,52,115 \| keep22-shots=1p7d1ev len=328482` |

keep22 원문의 아이콘 값이 바뀐 것은 예상대로입니다. 원문 식은 별조각·연막 꼬리만 빼므로 R로 바뀐 8종이 섞입니다.

### 4. 검사 출력 원문
- **C1** `k9-c1-all`: `ok   k9-c1-all`
- **C2**: `ok   k9-c2-burst`, `ok   k9-c2-spray`, `ok   k9-c2-rear`, `ok   k9-c2-seeker`. 낙관 점선 네모 안에 주 덩어리가 없음을 직접 확인했습니다.
- **C4**
  - `icons bad=0 text=0 hatch=0 nocyan=0`
  - `stamps bad=0 text=0 filter=0 nocyan=0 colours={}`
- **C5**: `icons-all=19vh262 len=2634966 list=17 ICON=17 | skillvfx-all=1xq1i37 len=698432 groups=18`
- **C7**
  - `meta ok | invalid calls ok | core list=17`
  - 22줄 모두 `ok`입니다. 바뀐 줄은 `inkBloom r=4.5 front=6.0 back=11.5 side=6.9 ok`입니다(옛 6.0/22.3/6.3).
- **C9**(crop 0,0,1400,1080)

| 탄 | travel0 | travel1 | start1 | end0 |
|---|---|---|---|---|
| inkBloom | paper 33% ink 63% cyan 5% | paper 33% ink 62% cyan 5% | paper 33% ink 62% cyan 5% | paper 33% ink 63% cyan 5% |
| inkDrizzle | paper 35% ink 61% cyan 4% | 같음 | 같음 | 같음 |

  - 나머지 21종은 해시로 바이트가 같으므로 API §7.4·§7.5 값 그대로입니다.
- **C10u**: 바뀐 10종은 아래와 같습니다. 나머지 12종은 변하지 않았습니다. 모두 15% 이상이고, 가시 테는 15.3으로 하한에 붙어 있습니다.

| 무기 | 수정 뒤 ink | 수정 전 |
|---|---|---|
| inkBloom | 15.7% | 16.0 |
| thornHalo | 15.3% | 15.7 |
| starShards | 20.8% | 29.2 |
| inkDrizzle | 15.4% | 15.4 |
| tailGuard | 15.4% | 15.2 |
| smokeTail | 20.5% | 16.4 |
| gravePins | 27.6% | 27.5 |
| trackingSeals | 15.5% | 15.3 |
| huntersMarks | 16.1% | 16.5 |
| bossbane | 26.9% | 26.9 |

- **C11b**: 글자 출력이 없는 검사라 그림으로 봤습니다. `k9c-c11b-cyan32-px`(1px 블록 확대)에서 14종 모두 32px에 청록이 한 점 이상 보입니다.
- **C12b**: `ok   k9-c12b-scene`. 흑백판 `k9-c12b-scene-gray`에서 먹꽃 탄을 포함한 모든 탄의 몸이 밝게 읽힙니다.
- **T3 보조**(`k9-t3px-blind20`, 시드 90210, 25칸)
  - 정답표를 열기 전에 한 번 풀어 20/25였습니다. 그때 연막 꼬리는 고치던 중간 상태였습니다.
  - 틀린 칸: 망나니 침, 뇌침, 연막 꼬리(서로 엇갈림), 핵심 부채 단검 ↔ 핵심 먹선 바늘.
  - 이번에 고친 10종 중 9종은 맞혔습니다.
  - 저는 그림을 알고 정답표도 이미 열었으므로, 판정은 다른 시드로 다시 해 주세요.
- **C13**(`k9-c13-needle-1xpx-a`·`-b`): 1배에서 먹꽃(앞이 넓고 밑이 갈라진 꽃잎 + 아래 매단 방울)과 먹 이슬비(뒤가 둥근 물방울 + 뒤 점)가 다른 물건으로 갈립니다. 나머지 바늘 계열도 서로 갈립니다.

### 5. 전후 렌더
위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`

| 수정 전 | 수정 뒤 |
|---|---|
| `k9c-before-icons10` | `k9c-after-icons10` |
| `k9c-before-smoke-star-tiles-x2` | `k9c-after-smoke-star-tiles-x2` |
| `k9c-before-smoke-ghoul-x6` | `k9c-after-smoke-ghoul-x6` |
| `k9c-before-starshards-sizes` | `k9c-after-starshards-sizes` |
| `k9c-before-c13-needle-1xpx` | `k9-c13-needle-1xpx-a`·`-b`, `k9c-after-c13-bloom-drizzle-1xpx`, `k9c-after-bloom-drizzle-x8` |
| `k9c-keep-hash-before` · `k9c-volley-all-before` · `k9c-keep22-orig-before` · `k9c-keep22x-before` | `k9-keep-hash` · `k9c-volley-all-after` · `k9c-keep22-orig-after` · `k9c-keep22x-after` |

- 항목별 4배 렌더(격자 + 낙관 구역, 평상·각성): `k9c-m1-star-grid`, `k9c-m2-smoke-grid`, `k9c-r1-hunters-grid`, `k9c-r2-drizzle-grid`, `k9c-r3-bossbane-grid`, `k9c-r4-bloom-grid`, `k9c-r5-tailguard-grid`, `k9c-r6-seals-grid`, `k9c-r6-seals-tile-x3`, `k9c-r7-thorn-grid`, `k9c-r8-knot-x8`
- 크기별·줄별 확인: `k9c-after-burst-32-20-gray`, `k9c-after-smoke-confusers-20px`, `k9c-t2-kinds-2nd-x3`, `k9c-t2-kinds-awakened-2nd-x3`, `k9-t3px-blind20`, `k9-t3px-blind20-key`

### 6. 검수서 §4 대비
- **M1**
  - 지킨 것: 조각 5(각성 6), 조각 꼴·테·p300 면, 가운데 금·섬광·청록 심, 관통 먹귀와 간격, 낙관 구역 비움, 탄.
  - 흑백 120·32·20px에서 정칙 별·오각형·꽃으로 읽히지 않는다고 봅니다. burst 줄도 계속 갈립니다(T2).
- **M2**: 슬릿 눈과 위 70%가 보이고, 발은 앞 자락에 잠기며, 방울이 끌립니다. 매듭·목도리·각성 3개·연기 1.2배는 지켰습니다.
- **M3**: 1배에서 먹 이슬비와 갈립니다. C7 ok, C9 먹 62~63%, 흑백에서 밝은 몸입니다. 먹 이슬비 탄은 바이트가 같습니다.
- **R7 교차 확인**(각성판을 핵심 검은 태양과 비교)은 검수서가 3차 몫으로 정한 것이라 이번에는 하지 않았습니다.

### 7. 메인 세션이 할 일
- 굽기 등록 값은 바뀌지 않았습니다. id·parts·박스·앵커·조각 이름이 그대로라 새로 넣을 값이 없습니다. 검수 5차 뒤 2차 14종을 굽습니다(검수서 §7-1).
- API에 다음을 반영했습니다: borrow 줄을 `:1175`로 고침, §6b·§7.5 갱신, §8에 새 명령(volley 전체 해시, keep22x, C13, T3 정답표)과 C9 crop 1080, §9.5 26~30, §10 C10u·클린업·판독 메모.

### 8. 알려진 한계
- 흑백 20px 섞은 판에서는 연막 꼬리의 청록 목도리가 회색 띠가 됩니다. 그래서 volley의 대각 구도(뇌침·망나니 침)와 가까워질 여지가 남습니다. rear 줄(T2)에서는 갈립니다.
- 먹꽃 탄의 C7 옆은 6.9로 한도 7.0에 가깝습니다(end 처짐 때문).
- 가시 테·먹 이슬비·핀 우박·꼬리 방패·추적 인장의 C10u는 하한 15%에 붙어 있습니다.
- 사람 클린업으로 넘길 것: 연기 붓 질감, 찢긴 폭발 다각형, 매듭 접힘 선, 보스 뿔·갑주 실루엣(가오나시와 닮은 점 재확인), 가시 덩굴손·잎, 먹꽃 탄의 1배 픽셀 정리.

---

## 검수 5차 — K9 2차 수정 1회차, art-director, 2026-10-16

**판정: 합격.** 메인 세션은 2차 14종을 지금 구워도 됩니다.

- M1~M3이 검수 4차 §4의 합격 기준을 모두 채웁니다.
  - M1 별조각은 정칙 별이 사라졌습니다.
  - M2 연막 꼬리는 먹귀 눈이 보입니다.
  - M3 먹꽃 탄은 1배에서 먹 이슬비 탄과 갈립니다.
- 권장 R1~R8은 모두 반영됐습니다. '다르게 한 것' 26~30도 모두 받아들입니다.
- 보존 해시는 수정 납품서 값과 글자까지 같습니다: volley `vko1lv`·`8wzptx`·`lfot85`, 2차 keep22x `12h4k5f`·`1p7d1ev`.
- **새로 찾은 것(N1)이 하나 있습니다. 이번 굽기는 막지 않습니다.** HUD 크기(32px)의 각성판 블라인드에서 1차 volley 셋(먹침·서리침·망나니 침)이 서로 맞바뀝니다. 사용자 요청(같은 계열 구분)에 바로 걸리는 문제라 3차 합격 전에 고칠 필수 항목으로 올립니다(§5).
  - 검수 1차·3차에서 '각성 32px 통과'라고 했던 판정은 나란히 놓고 본 것이었습니다. 이번 블라인드 결과로 그 판정을 정정합니다.

### 1. 다시 돌린 검사
- 렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r5-*.png`에 있습니다.
- 다른 작업자 모듈이 함께 로드된 상태에서 돌렸고, kit error는 0건입니다.

| 검사 | 결과 |
|---|---|
| C5 | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18`. 기준값과 같습니다 |
| C4 | `icons bad=0 text=0 hatch=0 nocyan=0`, `stamps bad=0 text=0 filter=0 nocyan=0 colours={}` |
| C7 | 22줄 모두 ok입니다. 바뀐 줄은 `inkBloom front=6.0 back=11.5 side=6.9` 하나입니다(옆 한도 7.0) |
| `--check` | 모두 ok: C1, C2(burst·spray+rear·seeker), C6 1배, C12b, 아이콘 10종 3배, burst 탄 시트 |
| volley 해시 (`k9r5-volley-all`) | `vko1lv len=992714`, `8wzptx len=134704`, `lfot85 len=1080615`. exact-match=true |
| keep22x (`k9r5-keep22x`) | `12h4k5f len=1787852`, `1p7d1ev len=328482`. exact-match=true. 작가의 수정 전 렌더 `k9c-keep22x-before.png`를 직접 열어 보니 같은 값이었습니다 |
| C9 | 먹꽃 탄 종이 33 / 먹 62~63%(65% 이하). 나머지 21종은 검수 4차 값과 같습니다 |
| C10u | 2차 14종 모두 15% 이상입니다. 하한에 붙은 것: 가시 테 15.3, 먹 이슬비·핀 우박·꼬리 방패 15.4, 추적 인장 15.5. volley의 쌍날 12.4·망나니 13.9는 3차 T3에서 판정합니다 |
| C11b | 32px 색에서 14종 모두 청록이 보입니다. 핀 우박 홈은 2~3픽셀로 가장 약하지만, 핵심 부채 단검 섬광과 같은 수준이라 기준 안입니다(`k9r5-pinhail-32-px`) |
| C12b·흑백 | 모든 탄이 밝은 몸이고 적 탄과 갈립니다 |
| 결정성·자리표시 | 528개 호출이 두 번 모두 같습니다. 자리표시 44/44, `list 17 ICON 17` |

### 2. 필수 M1~M3

| | 판정 | 근거 |
|---|---|---|
| M1 별조각 | **통과** | 조각 사이각 56·44·66·94·100°, 거리 36~50, 조각마다 비틈. 폭발은 한쪽으로 치우친 찢긴 다각형입니다.<br>흑백 120·32·20px에서 별·오각형·꽃으로 읽히지 않습니다(`k9r5-starshards-sizes`). 각성 6조각도 고르지 않습니다.<br>블라인드 20px 두 번 모두 맞혔습니다. C10u 20.8%, C2-burst ok |
| M2 연막 꼬리 | **통과** | 1배·2배 타일에서 한 덩어리 연기 줄기로 읽히고 마디·조약돌은 없습니다(`k9r5-smoke-tiles-x2`).<br>6배에서 슬릿 눈이 보이고, 발은 앞 자락에 잠기며, 왼쪽으로 방울 둘이 끌립니다(`-ghoul-x6`, 각성 `-ghoul-aw-x6`).<br>블라인드 20px 두 번 모두 맞혔습니다 |
| M3 먹꽃 탄 | **통과** | 1배 정보량 확대에서 먹꽃(뒤가 갈라진 잎꼴 + 아래 매단 방울)과 먹 이슬비(뒤가 둥근 물방울 + 뒤 점)가 다른 물건으로 읽힙니다(`k9r5-bloom-drizzle-1xpx`, 계열 전체 `k9r5-needle-family-shots-1xpx`). 계열 14종 탄이 실루엣으로 모두 갈립니다.<br>C7 ok, C9 ≤ 65%, 흑백에서 밝은 몸 |

**R1~R8은 모두 반영을 확인했습니다**(3배·8배).
- R1: 끈이 좌우로 번갈아 처지고, 패 하나는 위로 날립니다. 낙관 구역 밖입니다.
- R2: 청록 줄이 26·14·20으로 서로 틀어져 '≡'가 아닙니다.
- R3: 뿔에 마디가 있고, 어깨 갑주가 생겼고, 가면은 곧은 이마에 각진 턱입니다.
  - 얼굴 규칙도 지켰습니다(`k9r5-bossbane-mask-x8`): 왼쪽을 향한 3/4 한 시점, 먼 눈이 작고, 턱은 먼 쪽으로 치우쳤고, 코·입이 없습니다. 섞인 시점은 없습니다.
- R4: 꽃잎 사이각이 37~84°입니다.
- R5: 속도 획이 손잡이와 떨어졌습니다.
- R6: 인영이 몸 뒤 아래로 옮겨져 입으로 읽히지 않습니다.
- R7: 틈이 24~33°이고 덩굴손이 생겼습니다.
- R8: 8배에서 성난 눈썹이 사라졌습니다(`k9r5-knot-x8`).

**'다르게 한 것' 26~30 — 모두 받아들입니다.**
- 26 별조각: 둘째 조각 거리가 43으로 처방 50±6보다 1 작습니다. 각성 1.1배에서 창에 걸리는 걸 피한 것이라 정당합니다.
- 27 연막 꼬리: 먹귀 종이 테는 뇌침 끊김 호와 같은 문법이고, 연막침이 보이는 길이는 약 57%(각성 51%)입니다.
- 28 먹꽃 탄: 방울 하나는 지시서 1~2 안이고, end 처짐도 end 문법대로입니다.
- 29 사냥꾼 표식: 다섯째 패를 위로 올려 첫째 먹귀와 겹치는 걸 피했습니다.
- 30 가시 테: 청록 실은 약 29로 20 이상입니다.

### 3. 같은 계열 구분 (사용자 요청) — 직접 한 블라인드 시험
- 작가가 쓴 시드 90210과 제가 앞서 쓴 시드는 피했습니다.
- 칸마다 답을 먼저 적고 나서 정답표를 열었습니다.
- 렌더 정보량은 그 크기 그대로 두고 픽셀 블록으로만 확대했습니다.

| 시험 | 시드 | 결과 |
|---|---|---|
| 20px 흑백 슬롯, 그린 22종 + 핵심 3종 | 271828 | **25/25** |
| 20px 흑백 아이콘 창만(등급 매듭·틀 단서 제거) | 161803 | **25/25**. 가장 어려웠던 쌍은 먹 이슬비 ↔ 핀 우박, 붓깃 ↔ 먹침 |
| 32px 색 **각성**, needleStorm 계열 14칸 | 141421 | **11/14**. 틀린 셋은 먹침 → 서리침 → 망나니 침 → 먹침으로 맞바뀜 = N1. 2차 무기 8종은 모두 맞힘 |
| 32px 색 각성, fanKnives·mirrorClone 계열 11칸 | 223606 | **11/11** |
| 32px 색 각성, 전체 25칸 | 314159 | 25/25. 다만 직전 비교 렌더를 본 뒤라 N1 세 칸은 편향됐고, 공정한 칸은 22/22 |
| 탄 1배 정보량, needleStorm 계열 14 | — | 실루엣으로 모두 갈립니다(M3 포함) |

- 결론: 평상 아이콘과 탄은 계열 안에서 갈립니다. 남은 것은 1차 volley 셋의 각성판(N1)뿐입니다.
- 에이전트 한 명의 판독이므로 정식 판독 시험(n ≥ 8)에 N1 세 무기의 각성 32px을 꼭 넣어 주세요.

### 4. 남는 것
**3차 납품으로**
- N1(§5, 필수)
- 쌍날 12.4·망나니 13.9 블랙 스팟 하한(T3)
- 가시 테 각성판 ↔ 핵심 검은 태양 교차 확인(R7)
- 연막 꼬리 흑백 20px ↔ volley 대각 구도 재확인
- 하한에 붙은 5종(15.3~15.5)

**사람 클린업으로**(납품서 §8 목록에 더함)
- 핀 우박 청록 홈의 32px 픽셀 다듬기
- 먹꽃 탄의 갈라진 밑과 매단 방울을 1배에서 과장
- 보스 뿔·갑주 실루엣
- 별조각의 찢긴 폭발 다각형

**팀 결정(열린 질문)**
- 각성 틀(먹 바탕 + 종이 테)은 작은 크기에서 블랙 스팟 단서를 지웁니다.
- 그래서 HUD 각성 슬롯에 각성 그림 대신 평상 아이콘 + 각성 표지를 쓸지, Q7(20px 전용판)과 함께 정해 주세요.
- 이렇게 바꾸면 핵심 아이콘 17종의 HUD도 함께 바뀝니다.

### 5. N1 — 3차 합격 전에 고칠 것 (각성 아이콘 3개만)
- **본 렌더**: `k9r5-blind32-needle-aw-s141421`(+`-key`), `k9r5-volley3-aw-compare`.
- **원인**: 평상판에서 셋을 가르던 먹 단서가 각성 틀의 먹 바탕에 묻힙니다.
  - 먹침: 검은 쐐기, 마른 붓 꼬리(ink7)
  - 서리침: 오른쪽 아래 언 땅(bg ink7)
  - 망나니 침: 먹 등, 땅 먹 튐(ink7)
  - 게다가 모든 fg에 종이 테가 둘러져, 셋 다 '흰 테 두른 길쭉한 것 셋이 오른쪽 먹귀를 향함'으로 같아집니다.
- **처방**: 각성판에서 평상판 구도를 명도만 뒤집어 남깁니다.
  - 서리침 각성(`DRAW.frostNeedles`의 A 분기): 언 땅을 같은 쐐기 꼴의 밝은 얼음판으로 바꿉니다. p300 채움 + 먹 테 2.4 + ink3 금 2~3.
  - 먹침 각성(`DRAW.inkDarts`): 마른 붓 꼬리를 p300 획으로 바꿉니다. 지시서 §2.4의 'bg의 먹 선은 p300' 규칙입니다. 검은 쐐기는 그대로 둡니다.
  - 망나니 침 각성: 큰 칼 머리가 가장 큰 밝은 덩어리가 되게 합니다. 작은 칼(0.72배)의 자루를 줄여 긴 막대 둘이 나란히 보이지 않게 합니다.
  - 두 무기가 같은 꼴이 되지 않도록 서로 다른 단서를 고릅니다. 예를 들어 서리침에 '오른쪽 아래 밝은 쐐기'를 줬으면 망나니 침에는 오른쪽 아래 밝은 면을 주지 않습니다.
- **바꾸면 안 되는 것**
  - 세 무기의 평상판 전부와 탄
  - 다른 19종의 모든 출력
  - 각성 수(먹침 3, 서리침 3, 망나니 2)
  - 낙관 구역 비움
- **합격 기준**
  - 검수자가 새 시드로 돌리는 needleStorm 계열 각성 32px 블라인드에서 14/14.
  - `volley-keep-v2`와 `batch2-accepted`가 아래 값 그대로여야 합니다.
  - C1·C2 `--check` ok.

```
node scripts/art-review-sheet.mjs expr --name k9-baselines-v2 --scale 1 --crop 0,0,1400,60 --expr '(function(){var X=PN.arsenal;function norm(m){return m.replace(/\bki\d+/g,"ki").replace(/\bkar\d+/g,"kar");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}function cc(s){return s.split("").map(function(ch){return ch.charCodeAt(0);}).join(",");}var V=["inkDarts","brushQuills","sealArrows","frostNeedles","thunderNeedles","twinBlades","ghostVolley","headsmanDarts"],N1={inkDarts:1,frostNeedles:1,headsmanDarts:1},B2=["paperStorm","inkBloom","thornHalo","starShards","sunNeedles","inkDrizzle","pinHail","tailGuard","smokeTail","gravePins","trackingSeals","huntersMarks","crowFeathers","bossbane"],A="",B="";function icon(id,a){return norm(X.skill(id,{awakened:a}))+norm(X.tile(id,{awakened:a,metal:true,size:150}))+norm(X.hudSlot(id,{size:40,awakened:a}));}function shots(id){var s="";X.parts(id).forEach(function(p){for(var f=0;f<p.frames;f++)s+=norm(X.stamp(id,p.part,{frame:f}));});return s;}V.forEach(function(id){[false,true].forEach(function(a){if(a&&N1[id])return;A+=icon(id,a);});A+=shots(id);});B2.forEach(function(id){[false,true].forEach(function(a){B+=icon(id,a);});B+=shots(id);});var ha=h(A),hb=h(B);return "<rect width=\"1400\" height=\"60\" fill=\"#fff\"/><text x=\"4\" y=\"22\" font-size=\"13\" font-family=\"monospace\">volley-keep-v2="+ha+" len="+A.length+" codes="+cc(ha)+"</text><text x=\"4\" y=\"46\" font-size=\"13\" font-family=\"monospace\">batch2-accepted="+hb+" len="+B.length+" codes="+cc(hb)+"</text>";})()'
```

지금 값
- `volley-keep-v2=1lqy0p len=943345`, codes 49,108,113,121,48,112(넷째 '0'은 숫자, 둘째 'l'은 소문자 엘)
- `batch2-accepted=164mqj7 len=2284498`, codes 49,54,52,109,113,106,55

### 6. 메인 세션: 굽기 때 주의할 것
1. **굽기 전 입력 확인**
   - 위 명령을 돌려 `batch2-accepted=164mqj7 len=2284498`이 나오는지 봅니다. volley `vko1lv`·`8wzptx`·`lfot85`도 같은지 봅니다.
   - 다르면 검수 뒤에 모듈이 바뀐 것이니 멈춥니다.
   - 운영 규칙대로 커밋한 HEAD 스냅숏에서 굽습니다.
2. **UI 시트**: done 22 × [평상, 각성] = 44칸, ids 순서입니다.
   - `arsenal-tiles` 2656×1992(6행), `arsenal-slots` 1008×600(5행).
   - 1차 때(2행)와 행 수가 달라 CSS 백분율이 모두 바뀝니다. 시트·CSS·`build-arsenal-art.mjs`(done 22키 배지 제거)·`src/ui/uiArt.test.ts` 키 목록을 한 번에 다시 만듭니다.
3. **탄**
   - 22종 × 12장 = 264장, 박스 넓이 합 295,056(바뀌지 않음).
   - `readSkillVfx`는 `PN.arsenal.parts`를 읽되 `window`(한글)는 옮기지 않습니다.
   - `npm run bench:packs`로 확인합니다.
4. **렌더러**: `worldRenderer.ts:85` `SKILL_SHOTS`를 22종으로 합니다. 무기 자신의 조각 그룹을 고르고, 각성 조각이 없으면 평상 조각으로 떨어지게 합니다.
5. **N1**: 굽기를 미루지 않아도 됩니다. N1 수정은 UI 시트 6칸(세 무기 각성 타일·슬롯)만 바꾸므로 그때 UI 시트만 다시 굽습니다. 탄과 아틀라스는 그대로입니다.
6. **`npm run test:visual`**
   - 검수 4차 §7-5 장면에 HUD 하나를 더합니다: 먹침·서리침·망나니 침 각성 + 먹꽃·먹 이슬비·연막 꼬리, 45px·34px. N1과 사용자 요청을 실제 화면에서 봅니다.
   - 전투 장면에 먹꽃과 먹 이슬비가 함께 나는 장면을 넣습니다(M3 실화면).
7. **지시서 정정**(검수 4차 §7-6에 더함)
   - §2.4: 각성판도 HUD 32px에서 같은 계열과 갈려야 합니다. 큰 먹 면 블랙 스팟은 각성에서 밝은 면으로 뒤집어 같은 구도를 남깁니다.
   - §5.1 T2: '각성 32px 블라인드(새 시드)'를 합격 기준에 더합니다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-icons.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`

---

## 3차 납품서

N1(각성 아이콘 3개)을 먼저 고친 뒤, 투사체가 없는 22종의 아이콘(평상·각성)을 모두 그렸습니다. 이제 44종이 모두 `done`이고, look 자리표시로 그려지는 무기는 없습니다.
- 1·2차 보존 해시 두 개는 수정 전과 글자까지 같습니다: `volley-keep-v2=1lqy0p len=943345`, `batch2-accepted=164mqj7 len=2284498`.
- `--check`를 붙인 명령은 모두 ok이고 실패는 0건입니다.
- 고친 파일은 아래 둘뿐이고, 내려받은 것은 없습니다.
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
  - `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`

### 1. 납품 목록
- 공개 API(`PN.arsenal` v1.0)는 바뀌지 않았습니다. `done` 집합만 44종이 되었습니다.
- 3차 22종은 아이콘·타일·HUD 슬롯만 있고 탄은 없습니다. 이 무기에 `parts`·`stamp`를 부르면 기존대로 오류를 던집니다.
- 새 내부 도우미는 `knotAt`, `zig`, `groundBand`, `pushed`, `ringBand`, `clapHand`, `lobArc`·`lobLine`, `whiteJar`, `meteorBrushD`, `iceChain`, `tornOff`, `ellP`·`ellBand`, `ropeRing`입니다. 1·2차 그림이 쓰는 도우미는 고치지 않았습니다.

### 2. N1 수정 전후 (각성 아이콘만, 검수 5차 §5 처방대로)

| 무기 | 수정 전 | 수정 뒤 |
|---|---|---|
| 먹침 | 마른 붓 꼬리가 ink7이라 각성 먹 바탕에 묻힘 | 꼬리를 p300으로 바꿈(지시서 §2.4). 검은 쐐기는 그대로 |
| 서리침 | 언 땅이 ink7이라 묻힘 | 같은 쐐기 꼴의 밝은 얼음판(p300 + 먹 테 2.4 + ink3 금 셋). '오른쪽 아래 밝은 쐐기'는 세 무기 중 서리침에만 줌 |
| 망나니 침 | 칼 1.12배, 작은 칼 자루 38.6이라 긴 막대 둘이 나란함 | 큰 칼을 1.2배로 키워 가장 큰 흰 덩어리로 만듦. 칼날이 먹귀 눈을 덮지 않게 장착점을 4 뒤로 옮김(자루 54). 작은 칼은 장착점·겨냥을 그대로 두고 자루만 20.5로 줄임. 땅 먹 튐은 어두운 채로 둠 |

- 바뀐 것은 세 무기의 각성 아이콘·타일·슬롯뿐입니다. 평상판, 탄, 다른 19종은 그대로입니다(위 기준선 해시로 확인).
- 렌더
  - 전: `k9n1-before-aw-x3`, `k9n1-before-needle-aw32-px`
  - 후: `k9n1-after-aw-x3`, `k9n1-after-needle-aw32-px`, `k9n1-after-trio-32-20`

### 3. 22종 디자인 요약

전체 내용은 `API-icons2.md` §6c에 있습니다. 공통으로 지킨 정정은 다음과 같습니다.
- §10~§12를 처음부터 지켰습니다. 효과 표지 먹귀는 모두 눈이 보이고, 먹귀끼리 실루엣이 닿지 않습니다.
- 각성판에서 큰 먹 면이 먹 바탕에 묻히는 곳은 밝은 면으로 뒤집었습니다(먹번개 구름 띠 → p300, 서리 고리 안쪽 → p300 원반).

| kind | 무기: 주 덩어리 · 청록 · 각성 |
|---|---|
| strike | **먹번개**: 위 먹구름 띠 + 꺾쇠 번개 둘이 먹귀에 꽂힘(기절 나선) · 번개 심 · 번개 셋<br>**붓 폭우**: 둥근 머리가 앞서 떨어지는 마른 붓 획 넷(20~24° 기욺, 바닥에 닿기 전 멈춤) + 바닥 붓자국 · 젖은 결 · 다섯 획<br>**족자 낙하**: 8° 기운 빈 족자 + 종이 파문 + 밀려나는 먹귀 둘 · 걸이 끈 · 뒤에 작은 족자<br>**일곱째 인장**: 낮고 넓은 둥근 도장 + 먹 땅에 종이로 찍힌 인영 일곱 · 인면 테 · 인영 여덟 |
| nova | **먹 파동**: 굵기가 변하는 참 원 먹 고리. 14° 틈 셋, 틈 사이 호 62·89·167°, 틈 하나는 낙관 위. 가운데 결 매듭 · 고리 앞선 1/4바퀴 · 1.2배 + 안쪽 고리<br>**서리 고리**: 종이 고리 + 서릿발 열 + 얼어붙은 먹귀. 안쪽은 종이 · 고리 심 3 · 1.2배 + p300 안쪽 원반<br>**천둥 박수**: 겹쳐 맞부딪치는 손 둘(38°·14°, 명도 다름, 합장 아님) + 7갈래 섬광 + 꺾쇠 고리 · 섬광 심 · 고리 둘<br>**침묵의 종**: 작은 종이 손종 + 매끈한 종이 고리 둘. 추를 청록 실로 묶음 · 묶은 실 · 고리 셋 |
| lob | **먹단지**: 점선 포물선 꼭대기의 백자 단지(뚜껑 꼭지 없음) + 착지 먹 튐 · 목 끈 · 깨진 단지 하나 더<br>**송이 단지**: 서로 떨어진 작은 단지 셋이 세 점선으로 갈라짐(포도송이 아님) · 풀리는 송이 끈 · 넷<br>**타르 항아리**: 쓰러져 붓는 검은 항아리(종이 금, 파편) + 넓은 타르 웅덩이 + 발 잡힌 먹귀 · 봉인 끈 3 · 둘<br>**유성 붓**: 머리부터 떨어지는 큰 붓 + 자루를 감싸는 마른 먹 꼬리 + 착지 튐·섬광 · 꼬리 심 · 작은 붓 하나 더 |
| chain | **불꽃실**: 먹귀 넷의 옆에서 옆으로 잇는 높이 다른 부드러운 호(몸을 가로지르지 않음) · 실 · 과녁 다섯<br>**폭풍실**: 3/4로 본 회오리 깔때기(두 가닥 실 번개) + 휘감긴 작은 먹귀 일곱 · 실 번개 · 여덟<br>**서리 사슬**: 땅에 선 먹귀 다섯의 치우친 아치 + 얼음 고리 사슬 + 얼음판 · 고리 하나의 심 3 · 여섯 |
| beam | **먹창**: 창 폭의 94%를 −3°로 가르는 창 + 위아래로 찢겨 튕긴 먹귀 둘 · 술 매듭 띠 · 창날 1.2배 + 그림자 선<br>**넓은 붓**: 창 높이 31%인 종이 띠(무거운 먹 가장자리, 비백) + 띠 끝에 눌린 기운 붓 · 띠 앞선 테 · 폭 1.2배<br>**십자 획**: 결 매듭 둘레의 찢긴 먹귀 넷(30° 돌림, 위아래 0.8 원근), 연결은 가는 점선뿐('✕' 아님) · 찢은 획 하나 · 거리 1.2배<br>**심판선**: 먹통 + 실 감개에서 ↘로 튕긴 먹줄 + 줄을 따라 찢긴 먹귀 둘(세로 줄 아님) · 먹줄 심 · 잔상 둘 |
| halo | **먹 궤도**: 두꺼운 먹 타원 띠 + 혜성 획 + 높이 다른 먹귀 둘 · 혜성 심 · 1.12배<br>**수호 고리**: 결 매듭을 두른 꼰 줄 고리(매듭 셋) + 튕긴 먹귀 셋 · 바느질 1/3 · 1.2배<br>**일식 테**: −8° 기운 넓고 가는 속 빈 타원 테 + 뒤 오른쪽 먹 초승 + 청록 리본 둘 · 리본 · 1.12배 + 왼쪽 초승 |

지시서와 다르게 한 것은 API §9.6의 31~44에 근거와 함께 적었습니다.
- 붓 폭우: 획 방향을 정하고, 붓 머리가 땅에 닿기 전에 멈추게 함
- 일곱째 인장: 인영을 종이로 찍음
- 먹 파동: 먹 덩이 대신 튕겨 나가는 먹귀와 속도 획을 둠
- 천둥 박수: 손을 손등에서 본 꼴로 그림
- 단지 두 무기: 크기와 꼭지
- 먹창: 자루 6.4
- 넓은 붓: 붓을 기울임
- 심판선: 실 감개 자리
- 일식 테: rx 52
- 폭풍실: 깔때기 꼴
- 서리 사슬: 청록 굵기

### 4. 검사 출력 원문
- **기준선** `k9-baselines-v2`(N1 전과 3차 뒤가 같음)
  - `volley-keep-v2=1lqy0p len=943345 codes=49,108,113,121,48,112`
  - `batch2-accepted=164mqj7 len=2284498 codes=49,54,52,109,113,106,55`
- **3차 기록용 해시** `k9-batch3-hash`
  - `batch3-icons=181xtfv len=2615354 codes=49,56,49,120,116,102,118`
  - `n1-awakened=1agojwf len=272829 codes=49,97,103,111,106,119,102`
- **자리표시 확인** `k9t-done-check`(look 그림이 불리면 던지게 바꾼 상태로 88 × 3 호출)
  - `done=44/44 placeholder-draws=0`
  - `ICON keys=17 list=17 arsenal ids left in ICON=0 shots=22`
- **C1**: `ok   k9-c1-all`
- **C2**: `ok   k9-c2-strike`, `ok   k9-c2-nova`, `ok   k9-c2-lob`, `ok   k9-c2-chain`, `ok   k9-c2-beam`, `ok   k9-c2-halo`, `ok   k9-c2-volley`
  - 낙관 구역 안에 주 덩어리가 없음을 직접 봤습니다. 먹번개 구름 띠는 바탕이라 지시서상 걸쳐도 됩니다.
- **C4**
  - `icons bad=0 text=0 hatch=0 nocyan=0`
  - `stamps bad=0 text=0 filter=0 nocyan=0 colours={}`
- **C5**: `icons-all=19vh262 len=2634966 list=17 ICON=17 | skillvfx-all=1xq1i37 len=698432 groups=18`
- **C7**: `meta ok | invalid calls ok | core list=17`, 탄 22줄 모두 ok(값은 2차와 같음)
- **C10u**(3차 22종, 모두 15~55%)

| 무기 | ink | 무기 | ink |
|---|---|---|---|
| 먹번개 | 47.6% | 송이 단지 | 15.1% |
| 붓 폭우 | 30.4% | 타르 항아리 | 19.2% |
| 족자 낙하 | 33.0% | 유성 붓 | 15.7% |
| 일곱째 인장 | 37.8% | 불꽃실 | 15.8% |
| 먹 파동 | 21.7% | 폭풍실 | 18.1% |
| 서리 고리 | 17.4% | 서리 사슬 | 29.4% |
| 천둥 박수 | 18.2% | 먹창 | 19.3% |
| 침묵의 종 | 21.2% | 넓은 붓 | 15.6% |
| 먹단지 | 15.1% | 십자 획 | 23.4% |
| 심판선 | 15.6% | 먹 궤도 | 16.9% |
| 수호 고리 | 22.4% | 일식 테 | 15.4% |

- **C11c**(32px 청록, `k9t-c11c-cyan32-px`): 22종 모두 청록이 보입니다. 가장 약했던 서리 고리·타르 항아리·서리 사슬은 청록을 3까지 키워 `k9t-c11c-weak3-px`에서 다시 확인했습니다.
- **T1**(`k9-t1-looks`, crop 780)과 **T2**(`k9t-t2-kinds-new6-x3`): 새 kind 여섯 줄이 32px·20px 흑백에서 서로 갈립니다.

### 5. 블라인드 자가 판정
제가 그린 그림이라 편향된 판독입니다. 정식 판정은 검수자가 새 시드로 해 주세요. 모든 시험은 답을 먼저 적은 뒤 정답표를 열었습니다.

| 시험 | 결과 |
|---|---|
| N1 확인: needleStorm 계열 각성 32px 색(`k9n1-blind-needle-aw32`, 시드 990117) | 14/14. 먹침·서리침·망나니 침이 서로 갈림 |
| 3차 계열 여덟 줄 각성 32px 색(`k9t-blind-look32aw`, 시드 777001) | 30/30 |
| T3 자료: 20px 흑백 픽셀 블록, 44종 + 핵심 11종(`k9-t3px-blind20-all`, 시드 31337) | 48/55. 3차 22종과 핵심 11종은 모두 맞힘 |

- T3 자료에서 틀린 7칸은 모두 1·2차 무기입니다: 먹꽃→종이 폭풍, 종이 폭풍→망나니 침, 까마귀 깃→먹꽃, 혼령 일제사격↔먹침, 연막 꼬리→까마귀 깃, 망나니 침→연막 꼬리.
- 이 무기들은 검수 5차 블라인드에서는 모두 맞았습니다. 1·2차 출력은 이번에 바꿀 수 없어 그대로 둡니다. 판정 자료로 넘깁니다.
- 평상판 계열 블라인드(`k9t-blind-look32`)는 답을 적기 전에 정답표를 열어서 판정에 쓰지 않았습니다.
- 가시 테 각성 ↔ 핵심 검은 태양 교차 확인(`k9t-r7-cross-aw`)
  - 32px 색에서는 갈립니다(매끈한 원반 + 바닥 띠 대 틈 난 들쭉날쭉한 고리 + 청록 호).
  - 20px 흑백에서는 가장 가까운 쌍입니다. 가시 테는 2차 보존 대상이라 고치지 않았습니다.

### 6. 메인 세션 등록값
- **굽기 전에 확인할 값**: `volley-keep-v2=1lqy0p`, `batch2-accepted=164mqj7`, `batch3-icons=181xtfv`, `n1-awakened=1agojwf`. 다르면 검수 뒤 모듈이 바뀐 것이니 멈춥니다.
- **UI 시트**: 44종 × [평상, 각성] = 88칸, ids 순서
  - `arsenal-tiles`: 8열, 칸 [166,166], 원점 [−8,−8], 11행. @2x 2656×3652(디코드 약 38.8 MB, 계산)
  - `arsenal-slots`: 9열, 칸 [56,60], 원점 [−2,−2], 10행. @2x 1008×1200(약 4.8 MB, 계산)
  - 레시피는 지시서 §7 그대로입니다. 슬롯은 레벨 점 `<rect x="46.4"…/>`를 지웁니다.
  - 시트, CSS 백분율, `build-arsenal-art.mjs`(44키 모두 배지 제거), `src/ui/uiArt.test.ts` 키 목록을 한 번에 다시 만듭니다.
  - `npm run build`로 초기 에셋 예산을 확인해 주세요.
- **N1**: UI 시트의 6칸(세 무기 각성 타일·슬롯)만 바뀝니다.
- **탄**: 변화 없음(22종 × 12 = 264장). 아틀라스와 skills 팩은 다시 굽지 않아도 됩니다.
- **렌더러**: 새로 쓸 옵션은 없습니다. 3차 22종의 전장 효과는 K10 몫입니다.
- **`npm run test:visual`에 넣을 것**
  - HUD 45px·34px: 먹침·서리침·망나니 침 각성(N1)
  - 드래프트 카드: 3차 신화(일곱째 인장·심판선)와 각성 하나
  - HUD: chainSpark·boneMortar 계열 슬롯 줄
- **API 문서**: §6(N1), §6c(22종), §8(새 명령 원문), §9.6(31~44), §10(C10u, 자가 판독, 클린업)을 고쳤습니다.

### 7. 알려진 한계
- 하한(15%)에 붙은 C10u
  - 3차: 먹단지·송이 단지 15.1, 일식 테 15.4, 넓은 붓·심판선 15.6, 유성 붓 15.7, 불꽃실 15.8
  - 1차(평상판 보존이라 그대로): 쌍날 12.4, 망나니 침 13.9
- 20px 흑백에서 가장 가까운 쌍: 가시 테 각성 ↔ 검은 태양, 그리고 위 자가 판독에서 틀린 1·2차 쌍들.
- 사람 클린업
  - 22종의 붓 외곽·비백(구름 띠, 붓 획, 혜성 꼬리, 타르, 먼지)
  - 문화 검토: 천둥 박수 손(합장과의 거리), 침묵의 종(범종·불교 문양), 일곱째 인장(종교 도상), 족자(빈 화면 유지), 서리 사슬(걸쇠 여제 사슬과의 거리)
  - 폭풍실 깔때기가 채운 원반으로 보이지 않는지
- 열린 팀 질문(HUD 각성 슬롯에 평상 아이콘 + 각성 표지를 쓸지)은 정해지지 않아, 지금 방식(각성 그림)으로 그렸습니다.

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`
- 이름 앞머리 `k9n1-`: N1
- `k9t-`: 3차 작업 렌더
- `k9-`: 검사 명령 출력
- 3차 전체 그림: `k9t-batch3-grid-all`, `k9t-c2-new6-view`

---

## 검수 6차 — K9 3차 납품 (N1 + 투사체 없는 22종), art-director, 2026-10-16

**판정: 수정 후 합격.** 반드시 고칠 것은 셋이며, 모두 3차 아이콘이고 지시서 §2.6 금지 모양(T5)에 걸립니다.
- M1 유성 붓: 드래프트 크기에서 '로켓'으로 읽히고, 떨어지는 방향도 거꾸로(왼쪽 위로 발사) 읽힙니다.
- M2 타르 항아리: '검은 공 + 네모 마개 + 흰 균열'이라 즉시형 폭탄병(K7)으로 읽힙니다.
- M3 일곱째 인장: 인영이 32px에서 '흰 테 + 검은 안 + 가운데 표지'가 되어 5장 먹귀 일식 눈 꼴이 되고, 같은 'ㅅ' 획이 일곱 번 반복됩니다.

요청하신 다섯 가지에 대한 답입니다.
- (1) N1: 통과(새 시드 14/14).
- (2) 3차 22종 계열 블라인드: 평상 32px, 각성 32px, 20px 흑백 모두 30/30입니다.
- (3) T3 44종: 무기 40/44로 합격선(40)에 딱 걸칩니다. 1·2차 수정이 필수는 아닙니다. 다만 같은 계열 쌍(뇌침 ↔ 망나니 침)은 사용자 요청과 직결되므로 이번 수정에 함께 넣기를 강하게 권합니다(R1).
- (4) 31~44: 13건 수용, 1건(34)은 부분 수용입니다.
- (5) 문화 검토 다섯 가지: 모두 받아들입니다. 일곱째 인장은 인영만 M3로 고칩니다.

### 1. 직접 돌린 검사
- 렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r6-*.png`에 있습니다.
- 다른 작업자 모듈이 함께 로드된 상태에서 돌렸고, kit error는 0건입니다.

| 검사 | 결과 |
|---|---|
| 보존 해시 `k9r6-baselines-v2` | `volley-keep-v2=1lqy0p len=943345`, `batch2-accepted=164mqj7 len=2284498`. exact-match=true |
| 3차 기록 해시 `k9r6-batch3-hash` | `batch3-icons=181xtfv len=2615354`, `n1-awakened=1agojwf len=272829`. 납품서와 같습니다(exact-match=true) |
| C5 | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18` |
| C4 | `icons bad=0 text=0 hatch=0 nocyan=0`, `stamps bad=0 text=0 filter=0 nocyan=0 colours={}` |
| C7 | `meta ok \| invalid calls ok \| core list=17`. 탄 22줄 ok이고 값이 2차와 같습니다 |
| 자리표시 확인 | `done=44/44 placeholder-draws=0`, `ICON keys=17 list=17 arsenal ids left in ICON=0 shots=22` |
| `--check` | 모두 ok: C1, C2 여섯 kind(strike+nova, lob+chain, beam+halo), 3차 22종 2.5배 쌍 렌더 11장 |
| T6 | 22종 모두 평상 타일의 낙관 구역에 주 덩어리가 없습니다. 먹번개 구름 띠는 바탕이고, 침묵의 종 고리는 긴 선의 일부라 지시서 §2.2 허용입니다 |
| C11c | 32px 색(픽셀 블록)에서 22종 모두 청록이 보입니다 |
| C10u | 22종 모두 15~55%입니다. 하한에 붙은 것: 먹단지·송이 단지 15.1, 일식 테 15.4, 넓은 붓·심판선 15.6 |

### 2. 요청 (1)~(3): 블라인드 시험
- 작가가 쓴 시드는 모두 피했습니다(990117·777001·424242·31337·90210).
- 칸마다 답을 먼저 적고 나서 정답표를 열었습니다.
- 그림 정보량은 그 크기 그대로 두고 픽셀 블록으로만 확대했습니다.

| 시험 | 시드 | 결과 |
|---|---|---|
| (1) N1: needleStorm 계열 각성 32px 색 14칸 | 524287 | **14/14** |
| (2) 3차 계열 여덟 줄, 평상 32px 색 30칸(줄마다 핵심 섞음) | 606060 | **30/30** |
| (2) 같은 줄, 각성 32px 색 | 707070 | **30/30** |
| (2) 같은 줄, 20px 흑백 | 808080 | **30/30** |
| (3) T3: 20px 흑백 55칸(무기 44 + 핵심 11), 첫 판독 | 8675309 | **무기 40/44**, 핵심 6/11 |
| (3) T3 2회(1회 정답표를 본 뒤라 학습 효과 있음) | 20261016 | 55/55. 참고용 |

T3 첫 판독에서 틀린 것
- 무기 넷은 두 쌍이 서로 맞바뀐 것입니다.
  - 망나니 침 ↔ 뇌침: 같은 needleStorm 계열이고 같은 volley입니다.
  - 연막 꼬리 ↔ 혼령
- 3차 22종은 모두 맞혔습니다. 무기와 핵심 아이콘 사이의 혼동은 없습니다.
- 핵심 아이콘의 오답(대각 셋 흑선 창·백묵 절단·일식 보법이 서로 섞임, 무음 지뢰 ↔ 초승 궤도)은 `k-icons.js` 원본의 문제이고, 지시서 §0.1이 이미 적어 둔 한계입니다. K9 범위 밖입니다.

(3)의 판단: 1·2차 수정이 필요한가
- 합격 기준(40/44)은 통과하므로 필수 수정은 아닙니다.
- 그래도 이 무기들은 체계적 약점입니다. 같은 무기가 작가 판독(48/55)과 작가의 이전 시드 90210 판독에서도 틀렸습니다(망나니 침, 연막 꼬리, 혼령).
- 원인(`k9r6-confused-pairs-px`, 정답을 아는 상태의 진단)
  - 20px 흑백에서 뇌침과 망나니 침은 둘 다 '가는 대각선 + 오른쪽 먹 덩어리'가 됩니다. 번개의 꺾임은 2px 남짓이라 사라지고, 흰 칼날은 종이 위의 윤곽선뿐입니다.
  - 연막 꼬리와 혼령은 둘 다 '왼쪽 아래 검은 쐐기 + 그 위 회색 띠'가 됩니다.
- HUD 32px에서는 갈립니다(needleStorm 블라인드 14/14, 이번과 검수 4차 모두).
- 그래서 R1로 이번 수정에 함께 넣기를 강하게 권합니다. 넣지 않으면 사람 클린업 20px 다듬기의 1순위로 넘깁니다.
- **Q7 권고**: 20px 전용판은 만들지 않습니다(T3 통과). 약한 두 쌍만 R1로 손봅니다.

### 3. 반드시 고칠 것

#### M1 — 유성 붓이 '로켓'으로 읽힌다
- **본 렌더**: `k9r6-meteor-sizes`(96·32·20px), `k9r6-risk-tar-meteor`(4배), C2 1배 타일.
- **문제**
  - 96~120px에서 '뾰족한 머리 + 청록 줄무늬 + 날개(갈라진 꼬리) + 아래 분사 섬광'으로 읽히고, 왼쪽 위로 발사되는 로켓으로 보입니다.
  - 붓이라는 물건과 '떨어진다'는 방향이 둘 다 사라집니다. 세계 톤(V1)에도 맞지 않습니다.
  - 각성판은 로켓 둘로 읽힙니다.
- **원인**: `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js:1553-1559`
  - 꼬리 굵기가 `2.4 + 28·t^1.1`이라 먼 끝(왼쪽 위)이 한 점으로 모입니다. 혜성 꼬리와 반대 방향입니다.
  - 청록 심이 그 뾰족한 먼 끝 쪽에 놓여 줄무늬처럼 보입니다.
- **처방**
  1. 꼬리를 뒤집습니다. 먼 끝(왼쪽 위)이 가장 넓고(24~30), 붓에 가까울수록 자루 폭으로 좁아집니다. 먼 끝은 한 점으로 모으지 말고, 길이가 다른 마른 붓 갈래 3~4개와 끊긴 먹 점으로 흩어지게 합니다.
  2. 붓 머리(`meteorBrushD :1537`)는 착지에서 붓털이 갈래 2~3개로 짓눌려 퍼지게 합니다. 깔끔한 뾰족 끝은 로켓 코로 읽힙니다.
  3. 자루 뒤끝은 둥근 먹 마개 + 작은 걸이 고리로 꼬리 안쪽에 보이게 합니다. 붓이라는 단서입니다.
  4. 청록 심은 넓어진 꼬리의 가운데를 따라 붓 쪽에서 시작합니다.
- **바꾸면 안 되는 것**: 42° 낙하 방향, 착지 큰 먹 튐 + 종이 섬광, 밀려나는 먹귀, 각성 2개, 낙관 구역 비움, C10u ≥ 15.
- **합격 기준**
  - 120·32px에서 '머리부터 떨어지는 붓 + 혜성 꼬리'로 읽힙니다. 로켓·미사일·폭죽으로 읽히지 않습니다.
  - lob·boneMortar 줄 블라인드가 계속 갈립니다.
  - C2 `--check` ok.

#### M2 — 타르 항아리가 폭탄(폭탄병)으로 읽힌다
- **본 렌더**: `k9r6-tarjar-vs-bomber`(K7 심지형·즉시형과 나란히), `k9r6-risk-tar-meteor`.
- **문제**
  - 지시서 §2.6 '심지·도화선·불꽃 단 단지 = 폭탄병(B1)'에 해당합니다.
  - 검은 둥근 몸, 몸을 가로지르는 흰 지그재그 균열, 몸 위 왼쪽에 붙은 네모 덩이가 만화 폭탄과 즉시형 폭탄병(검은 둥근 몸 + 흰 균열)과 같은 어휘입니다.
- **원인**: `k-icons2.js:1514-1526`
  - 항아리 입(ink5 타원)이 먹 몸에 묻혀 안 보입니다.
  - 흰 균열(`:1523`)이 몸을 가로지릅니다.
  - 네모 파편(`:1526`)이 몸 위 왼쪽에 붙어 마개처럼 보입니다.
- **처방**
  1. 입을 보이게 합니다. 오른쪽 아래로 향한 입에 종이 테(p50 2)를 두른 열린 타원을 그리고, 타르가 그 입술에서 흘러나오게 합니다.
  2. 굽(바닥 테)을 반대쪽 끝(왼쪽 위)에 보이게 합니다. '쓰러진 항아리'로 읽히게 하려는 것입니다.
  3. 흰 균열은 뺍니다. 꼭 둔다면 입 가까이 짧고 어두운 금 하나(ink5, 1 이하)만 둡니다.
  4. 파편은 몸에서 떼어 웅덩이 가 땅에 둡니다. 휜 도자기 조각 1~2개로 하고, 네모는 쓰지 않습니다.
  5. 각성판의 뒤쪽 작은 항아리도 같은 꼴로 합니다.
- **바꾸면 안 되는 것**: 검은 항아리(ink5 명부), 넓은 타르 웅덩이와 늘어진 방울, 발 잡힌 먹귀(눈 보임), 청록 봉인 끈, 각성 2개 + 웅덩이 1.2배, C10u ≥ 15.
- **합격 기준**
  - 120·32px 흑백에서 K7 폭탄병 둘과 나란히 놓아도 '굽과 입이 보이는 쓰러진 항아리'로 갈립니다.
  - lob·voidMine 줄 블라인드가 계속 갈립니다.

#### M3 — 일곱째 인장 인영이 5장 일식 눈 꼴이자 반복 글자처럼 읽힌다
- **본 렌더**: `k9r6-seal-eyes-sizes`(96·32·20px, 5장 먹귀 눈과 나란히), `k9r6-seal-imprints-x8`.
- **문제**
  - 지시서 §2.6 '흰 테 + 검은 원 + 가운데 점 = 5장 먹귀 일식 고리 눈'에 해당합니다.
  - 종이 타원 테 안으로 먹 땅이 보이고, 가운데에 종이 매듭 획이 있습니다. 32px에서는 매듭 획이 점이 됩니다.
  - 같은 'ㅅ'자 매듭 획이 일곱 번 반복되어 글자처럼 읽힐 여지도 있습니다(§2.6).
- **원인**: `k-icons2.js:1298-1305`. 모든 인영이 닫힌 타원 테이고, 매듭 획이 가운데에 같은 꼴입니다.
- **처방**
  1. 인영마다 테를 끊습니다. 둘레의 70~85%만 찍힌 호 1~2개로, 틈 자리를 인영마다 다르게 합니다.
  2. 매듭 획은 가운데를 벗어나 테에 닿거나 걸치게 하고, 인영 폭의 50% 이상으로 키웁니다.
  3. 꼴을 인영마다 바꿉니다: 열린 고리, ㄱ 말림, S 굽음, 돌림 ±40°, 좌우 뒤집기.
  4. 인영 2~3개는 한쪽이 진하게 찍힌 반달 꼴 종이 면으로 둡니다.
- **바꾸면 안 되는 것**: 낮고 넓은 도장 몸(31~44의 34 수용분), 인면 청록 테, 인영 일곱(각성 여덟), 크기를 다르게 하고 한 줄로 두지 않는 것, 먹 땅 띠.
- **합격 기준**: 120·32·20px에서 눈·같은 글자 반복으로 읽히지 않고 '찍힌 인영'으로 읽힙니다.

### 4. 권장
- **R1 (강력 권장, 1·2차 평상 아이콘 넷)**: 20px에서 주 덩어리를 서로 다른 꼴로 만듭니다.
  - 뇌침(`DRAW.thunderNeedles`의 `main0`): 가운데 꺾임 하나를 22 이상 깊게 해서 20px에서도 Z자 홈이 남게 합니다. 이웃 구간이 30% 이상 다른 규칙은 지킵니다.
  - 망나니 침(`headsmanDart` 평상): 칼날을 '검은 등(6 안팎) + 흰 면'의 덩어리로 해서, 윤곽선이 아니라 면으로 읽히게 합니다.
  - 연막 꼬리: 땅에 낮게 깔린 회색 구름 둑(위 가장자리 뭉게)과 그 위 대각 목도리 사이에 종이 틈(10 이상)을 둡니다.
  - 혼령: 곧은 변의 검은 쐐기를 지킵니다.
  - 합격 기준
    - 검수자의 새 시드 55칸 20px 블라인드에서 두 쌍이 맞바뀌지 않습니다.
    - needleStorm 32px 블라인드는 14/14를 유지합니다.
    - C10u ≥ 15.
  - `volley-keep-v2`·`batch2-accepted`가 바뀌는 건 예상된 일입니다. 새 값을 적습니다.
- **R2 먹번개 각성**: 번개 셋이 거의 평행하고 간격이 같아 '같은 기호 셋 한 줄'(§2.6)에 가깝습니다. 가운데 번개를 짧게 하고 갈래를 내며, 구름에서 시작하는 높이와 기울기를 다르게 합니다(`:1228-1229`).
- **R3 불꽃실**: 과녁 높이가 56·100·58·94라 고른 W자입니다. 예를 들어 50·100·72·88처럼 높이를 고르지 않게 하고, 가로 간격도 다르게 합니다.
- **R4 수호 고리**: 꼰 자국이 같은 간격(12°)이라 사다리·해칭 고리로 읽힙니다. 간격을 ±30%로 흔들고, S자 꼰 획과 매듭 곁 틈을 둡니다.
- **R5 심판선 실 감개**: '굵은 테 + 가운데 점 + 고른 방사 눈금 셋'이라 레티클로 읽힙니다(`k9r6-judgment-reel-x10`). 실이 감긴 3/4 실패 + 손잡이로 바꾸고, 가운데 점과 고른 눈금은 뺍니다.
- **R6 폭풍실**: 위 오른쪽 먹귀 둘이 겹칩니다(§10-2, 종이 테까지 4 이상). 둘을 띄웁니다.

### 5. 지시서와 다르게 한 것 31~44

| # | 판정 | 근거 |
|---|---|---|
| 31 N1 | 수용 | 블라인드 14/14. 세 무기의 단서가 서로 다릅니다 |
| 32 먹번개 각성 구름 띠 p300 | 수용 | §12-1 그대로입니다 |
| 33 붓 폭우 획 방향·땅 위 멈춤 | 수용 | 비로 읽힙니다. 머리 간격 30·26·22로 고르지 않습니다 |
| 34 일곱째 인장 | **부분 수용** | 낮고 넓은 도장 몸은 수용합니다. 종이로 찍은 테 + 가운데 매듭 인영은 M3로 다시 그립니다 |
| 35 먹 파동 틈 셋, 먹귀가 틈으로 튐 | 수용 | 낙관 구역에 덩이가 들어가지 않습니다. 사이 호가 고르지 않습니다 |
| 36 서리 고리 각성 안쪽 p300 | 수용 | 검은 태양을 피합니다 |
| 37 천둥 박수 손등 두 손 | 수용 | 아래 문화 검토 |
| 38 단지 크기·꼭지 없음 | 수용 | 꼭지 = 도화선 회피가 맞습니다 |
| 39 먹창 자루 6.4·먹귀 키움 | 수용 | C10u 하한을 맞추려는 것입니다 |
| 40 넓은 붓 기운 붓 | 수용 | 선 붓이 병으로 읽히는 걸 피했습니다 |
| 41 심판선 감개 위치 | 수용 | 꼴은 R5 |
| 42 일식 테 rx 52 | 수용 | ±6 안입니다 |
| 43 폭풍실 깔때기 | 수용 | 평면 나선이 '6·G'로 읽히는 걸 피했습니다. 겹침은 R6 |
| 44 서리 사슬 청록 3 + 먹 6 | 수용 | §10-1 기준 안이고 C11c에서 보입니다 |

### 6. 문화 검토 (5)
| 대상 | 판정 | 근거 · 사람 검토로 넘길 것 |
|---|---|---|
| 천둥 박수 손 | 수용 | 6배(`k9r6-thunderclap-hands-x6`)에서 기울기(38°·14°)·명도·겹침이 달라 박수로 읽힙니다. 손끝 섬광과 충격 고리도 있습니다. 똑바로 선 대칭 합장이 아닙니다. 클린업 때 맞닿는 순간 손가락을 조금 더 벌립니다 |
| 침묵의 종 | 수용 | 손잡이 달린 작은 손종이고, 범종 요소(당좌·용뉴·연꽃 무늬)가 없습니다. 고리는 매끈하고 끊김이 없으며 점선 고리가 아닙니다 |
| 일곱째 인장 | 도장은 수용, 인영은 M3 | 일곱 봉인 두루마리·종교 도상이 없습니다 |
| 족자 | 수용 | 빈 화면이고 글자·낙관·부적 문양이 없습니다 |
| 서리 사슬 | 수용 | 먹귀 사이를 잇는 얼음 고리 사슬이고, 걸쇠 여제의 쇠사슬·자물쇠 꼴이 아닙니다 |

### 7. 메인 세션: 굽기 때 주의할 것
1. **44종 시트는 검수 7차(M1~M3) 뒤에 굽습니다.**
   - 지금 `done`으로 거르면 고칠 세 아이콘이 함께 구워집니다.
   - 지금 N1만 반영하려면 시트 항목을 1·2차 22종 이름 목록으로 고정해 굽습니다(N1 6칸만 바뀝니다).
2. **지금 굽는다면 그 전에 확인할 해시**(다르면 멈춥니다)
   - `volley-keep-v2=1lqy0p len=943345`
   - `batch2-accepted=164mqj7 len=2284498`
   - `n1-awakened=1agojwf len=272829`
3. **수정 회차가 지켜야 할 해시**
   - `keep-but-M-R1=1kg6nti len=5253520`: 수정과 무관하게 늘 같아야 합니다.
   - `keep-but-M=lo8anh len=5827952`: R1을 하지 않으면 같아야 합니다(첫 글자는 소문자 l).
   - 탄 22종 264장도 이 해시 안에 들어 있습니다. 3차는 탄을 바꾸지 않으므로 아틀라스·skills 팩은 다시 굽지 않습니다.

```
node scripts/art-review-sheet.mjs expr --name k9-keep-but-M --scale 1 --crop 0,0,1400,60 --expr '(function(){var X=PN.arsenal;function norm(m){return m.replace(/\bki\d+/g,"ki").replace(/\bkar\d+/g,"kar");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}function cc(s){return s.split("").map(function(ch){return ch.charCodeAt(0);}).join(",");}function icon(id,a){return norm(X.skill(id,{awakened:a}))+norm(X.tile(id,{awakened:a,metal:true,size:150}))+norm(X.hudSlot(id,{size:40,awakened:a}));}var M={meteorBrush:1,tarJar:1,seventhSeal:1},R={thunderNeedles:1,headsmanDarts:1,smokeTail:1,ghostVolley:1},A="",B="",S="";X.ids.forEach(function(id){if(!M[id]){[false,true].forEach(function(a){var m=icon(id,a);A+=m;if(!R[id])B+=m;});}});X.shots.forEach(function(id){X.parts(id).forEach(function(p){for(var f=0;f<p.frames;f++)S+=norm(X.stamp(id,p.part,{frame:f}));});});var ha=h(A+S),hb=h(B+S);return "<rect width=\"1400\" height=\"60\" fill=\"#fff\"/><text x=\"4\" y=\"22\" font-size=\"13\" font-family=\"monospace\">keep-but-M="+ha+" len="+(A+S).length+" codes="+cc(ha)+"</text><text x=\"4\" y=\"46\" font-size=\"13\" font-family=\"monospace\">keep-but-M-R1="+hb+" len="+(B+S).length+" codes="+cc(hb)+"</text>";})()'
```

4. **44종 시트(검수 7차 뒤)**
   - `arsenal-tiles` 2656×3652(11행, 디코드 약 38.8 MB), `arsenal-slots` 1008×1200(10행, 약 4.8 MB).
   - `npm run build`로 예산을 봅니다. 드래프트 모달 메모리가 무거우면 Q1 결정대로 kind별 시트로 나눕니다.
   - 시트, CSS 백분율, `build-arsenal-art.mjs`(44키 모두 배지 제거, 앞머리 겹침 검사는 필요 없음), `src/ui/uiArt.test.ts` 키 목록을 한 번에 다시 만듭니다.
5. **렌더러**: 3차 22종은 탄이 없습니다. 전장 효과는 K10 몫이라 이번에 렌더러를 바꿀 것은 없습니다.
6. **`npm run test:visual`**
   - 드래프트: 일곱째 인장·심판선(신화), 유성 붓·타르 항아리(수정 뒤)
   - HUD: chainSpark·boneMortar 계열 줄
   - 정산 피해 목록 20px: 뇌침·망나니 침·연막 꼬리·혼령. 목록에 무기 이름이 함께 나오는지 확인해 R1의 실제 영향을 판단합니다

### 8. 남는 것
- **3차 뒤로 넘기는 것**: R1~R6, 그리고 하한에 붙은 C10u(3차 일곱 종, 1차 쌍날 12.4·망나니 13.9)를 최종 정비 때 다시 봅니다.
- **사람 클린업**(납품서 목록에 더함): 유성 붓 꼬리와 짓눌린 붓털, 타르 항아리 입·굽, 인영의 찍힘 질감, 20px 약한 쌍 넷의 픽셀 다듬기, 핵심 대각 셋(k-icons 원본)의 20px 구분.
- **팀 결정**
  - Q7: 위 권고대로 20px 전용판은 만들지 않습니다.
  - HUD 각성 슬롯 표시 방식(지시서 §12-4)은 미정 그대로입니다. 이번 결과(각성 32px 30/30·14/14)로는 지금 방식(각성 그림)을 유지해도 됩니다.
- **미확인**
  - 실제 게임 화면
  - 정식 판독 시험(n ≥ 8)
  - 정산 목록에 이름이 함께 표시되는지
  - C9·C10u는 필터와 묶음 opacity를 무시하는 근사치입니다

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-icons.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`

---

## 3차 수정 납품서

검수 6차 '## 검수 6차'의 필수 M1~M3와 권장 R1~R6을 모두 반영했습니다.
- 고친 파일: `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`, `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`. 다른 파일은 건드리지 않았고 아무것도 내려받지 않았습니다.
- 출력이 바뀐 무기는 11종입니다. 혼령 일제사격은 R1('곧은 변의 검은 쐐기를 지킵니다')대로 코드를 건드리지 않았습니다.
- 바뀐 12종(혼령 포함)을 뺀 나머지 32종의 아이콘·타일·슬롯과 탄 264장은 수정 전후 해시가 같습니다.
- `--check`는 모두 ok, kit error 0건입니다.

### 1. 납품 목록 — 바뀐 것

| 무기 | 바뀐 출력 | 항목 | 요약 |
|---|---|---|---|
| meteorBrush | 평상·각성 | M1 | 꼬리를 뒤집었습니다. 자루 쪽 폭 9에서 먼 끝(왼쪽 위) 28까지 넓어지고, 먼 끝은 마른 붓 갈래 넷 + 끊긴 먹 방울 셋으로 흩어집니다. 자루 뒤끝에 둥근 먹 마개(r 4.4) + 종이 걸이 고리가 있고, 붓털은 착지에서 갈래 셋으로 짓눌립니다. 청록 심은 붓 쪽에서 시작해 꼬리 가운데를 22 따라갑니다. 42° 낙하, 착지 먹 튐 + 종이 섬광, 밀려나는 먹귀, 각성 2개는 그대로입니다 |
| tarJar | 평상·각성 | M2 | 입(종이 테 p50 2를 두른 열린 타원)이 오른쪽 아래를 향하고 타르가 입술에서 흘러내립니다. 반대쪽 끝(왼쪽 위)에 굽이 보입니다. 흰 균열은 뺐고, 네모 파편 대신 휜 도자기 조각 둘을 웅덩이 왼쪽 땅에 두었습니다. 각성의 작은 항아리도 같은 꼴입니다. 웅덩이·먹귀·청록 끈은 그대로입니다 |
| seventhSeal | 평상·각성 | M3 | 인영 테는 72~80%만 찍힌 호 1~2개이고 틈 자리가 인영마다 다릅니다. 테 붓 폭은 가운데가 굵고 끝으로 마릅니다. 매듭 획은 가운데를 비켜 테에 닿고, 폭은 인영의 57~91%입니다. 꼴은 열린 고리(두 다리), ㄱ 말림, S 굽음에 돌림 −30~+40°와 좌우 뒤집기를 섞었습니다. 셋은 반달 종이 면입니다. 도장 몸·청록 인면 테·인영 7(각성 8)·자리·먹 땅은 그대로입니다 |
| thunderNeedles | 평상·각성 | R1 | 주 번개 점을 (4,100)(30,80)(36,90)(76,46)(70,78)(86,62)(99,66)로 바꿨습니다. 가운데 되꺾임 깊이가 32이고, 구간은 32.8·11.7·59.5·32.6·22.6·13.6이라 이웃 구간이 모두 30% 이상 다릅니다 |
| headsmanDarts | 평상만 | R1 | 먹 등을 약 6(아이콘 6.6~6.9)으로 굵혀 '검은 등 + 흰 면'으로 만들었습니다(`headsmanDart(…, heavy)`). 땅 먹 튐은 세로 0.32 → 0.5로 늘렸습니다(C10u용). 각성은 그대로입니다 |
| smokeTail | 평상·각성 | R1 | 매듭 밑의 가는 김이 땅에 낮게 깔린 회색 구름 둑(높이 13~25, 위 가장자리 뭉게)으로 떨어집니다. 둑 위와 대각 목도리 사이 종이 틈은 x 40에서 약 40, x 80에서 약 28입니다. 연막침은 뒤끝이 둑에 묻히게 옮겼습니다 |
| inkLightning | 각성만 | R2 | 가운데 번개는 구름의 늘어진 혀(y 40)에서 시작합니다. 다른 둘과 반대로 왼쪽 아래로 기울고 먹 6.5로 더 가늘고 짧으며, 한 번 갈라져 두 끝 모두 공중에서 끝납니다 |
| sparkThread | 평상·각성 | R3 | 과녁 높이를 50·100·72·92로, 가로 간격을 36·22·26으로 했습니다. 각성 다섯째는 (116, 56)입니다 |
| wardRing | 평상·각성 | R4 | 꼰 자국 간격을 12° ± 30%로 흔들었고(시드 421), 자국마다 가운데가 부푸는 S 획입니다. 묶은 자리 양옆은 비웠습니다 |
| judgmentLine | 평상·각성 | R5 | 레티클 바퀴를 3/4 실패((12, 45))로 바꿨습니다. 날개판 둘 + 감긴 먹줄 + 위 날개판 가장자리의 손잡이 + 먹통으로 오르는 줄 한 가닥이고, 가운데 점과 눈금은 없습니다 |
| stormThread | 평상·각성 | R6 | 먹귀를 두 가닥에 나눠 놓았습니다. 실루엣 사이가 최소 10.4(각성 여덟째 8.5)이고, 셋이 한 줄로 서지 않으며 위 바퀴에는 셋까지만 둡니다 |

도우미 변경
- `headsmanDart`에 `heavy`를 더했습니다. 기본값이 옛 출력입니다.
- `meteorBrushD`와 `ropeRing`(`binds`·`seed` 인자 추가)은 각각 해당 무기만 씁니다. 다른 무기가 쓰지 않는다는 것은 `keep-but-MR`로 확인했습니다.

API 문서에서 고친 곳
- 납품 표에 '3차 수정 1회차' 줄을 더했습니다.
- §2 줄 번호(`borrow` :1935)를 고쳤습니다.
- 표: §6(뇌침·망나니 침), §6b(연막 꼬리), §6c(8줄)를 고쳤습니다.
- §8: 이번 명령 원문 세 개와 해시 전후 표를 더했습니다.
- §9.6: 34·41에 후속 메모를 달았습니다.
- §9.7을 새로 썼습니다(바뀐 출력 표, 처방과 다르게 한 것 45~54).
- §10: C10u·블라인드·클린업을 더했습니다.

### 2. API 요약
- 공개 API, 틀 빌리기, META, 탄 규격은 바뀌지 않았습니다.
- 아이콘 마스터는 128, 낙관 피할 구역은 (94~128, 0~34)이고 지켰습니다(C2 렌더로 확인).
- 탄 22종 264장의 출력과 C7 값은 같습니다.

### 3. 검사 결과 (출력 원문)

#### 해시 전후

| 명령 | 수정 전 | 수정 뒤 |
|---|---|---|
| 검수 6차 §7-3 `k9-keep-but-M`(수정 전 파일 `k9-keep-but-M`, 수정 뒤 `k9u-keep-but-M-final`) | `keep-but-M=lo8anh len=5827952 codes=108,111,56,97,110,104` | `keep-but-M=18cb7f6 len=5875151 codes=49,56,99,98,55,102,54` |
| 같은 명령 둘째 줄 | `keep-but-M-R1=1kg6nti len=5253520 codes=49,107,103,54,110,116,105` | `keep-but-M-R1=j853k3 len=5290144 codes=106,56,53,51,107,51` |
| SKIP에 R2~R6 무기를 더한 식(`k9u-keep-but-MR-before` → `-final`) | `keep-but-MR=1nz2ip3 len=4552974 codes=49,110,122,50,105,112,51`, `icons32=st2cpv len=4208357 \| shots264=194b48x len=344617` | **같음**: `keep-but-MR=1nz2ip3 len=4552974 codes=49,110,122,50,105,112,51`, `icons32=st2cpv len=4208357 \| shots264=194b48x len=344617` |
| `k9-baselines-v2` 첫째 줄 | `volley-keep-v2=1lqy0p len=943345` | `volley-keep-v2=1vrl75n len=943384 codes=49,118,114,108,55,53,110` |
| `k9-baselines-v2` 둘째 줄 | `batch2-accepted=164mqj7 len=2284498` | `batch2-accepted=1cu38bf len=2295034 codes=49,99,117,51,56,98,102` |
| `k9-batch3-hash` 첫째 줄 | `batch3-icons=181xtfv len=2615354` | `batch3-icons=wgek8m len=2722700 codes=119,103,101,107,56,109` |
| `k9-batch3-hash` 둘째 줄 | `n1-awakened=1agojwf len=272829` | **같음**: `n1-awakened=1agojwf len=272829 codes=49,97,103,111,106,119,102` |
| 굽기 입력 확인용(`k9u-keep-but-MR-final2`) | — | `all44-icons=19ir0aw len=5889330 codes=49,57,105,114,48,97,119` |

해시 판정
- `keep-but-M-R1`은 수정 뒤 값이 달라졌습니다. 이 식에는 R2~R6 다섯 종(먹번개·불꽃실·수호 고리·심판선·폭풍실)이 들어 있어 예상된 변화입니다.
- 바뀐 12종을 모두 SKIP에 넣은 `keep-but-MR`은 수정 전후가 같습니다. 그래서 나머지 32종과 탄 264장은 그대로입니다.
- `volley-keep-v2`·`batch2-accepted`는 R1으로 바뀌었고 위의 새 값이 기준입니다.
- 바뀐 12종의 무기별 해시(평상/각성)는 API §8에 있습니다(`k9u-weapon-hashes12-codes`).
- 혼령 일제사격과 먹번개 평상판은 그리는 코드를 고치지 않았습니다. 다만 수정 전 무기별 값이 없어 해시로는 증명하지 못합니다.

#### 나머지 검사
```
C1  k9u-c1-all-final (--scale 0.25 --check): ok
C2  --check: ok k9u-c2-strike-final, ok k9u-c2-lob-final, ok k9u-c2-chain, ok k9u-c2-beam, ok k9u-c2-halo, ok k9u-c2-nova, ok k9u-c2-volley, ok k9u-c2-rear
C4  icons bad=0 text=0 hatch=0 nocyan=0
    stamps bad=0 text=0 filter=0 nocyan=0 colours={}
C5  icons-all=19vh262 len=2634966 list=17 ICON=17 | skillvfx-all=1xq1i37 len=698432 groups=18
done done=44/44 placeholder-draws=0
     ICON keys=17 list=17 arsenal ids left in ICON=0 shots=22
C7  meta ok | invalid calls ok | core list=17
    inkDarts r=4 front=5.5 back=23.5 side=5.8 ok / brushQuills r=5 front=6.2 back=19.5 side=5.9 ok / sealArrows r=6 front=7.5 back=44.5 side=7.1 ok
    frostNeedles r=4.5 front=6.0 back=32.1 side=5.3 ok / thunderNeedles r=4.5 front=6.0 back=16.0 side=5.3 ok / twinBlades r=6 front=6.5 back=15.3 side=7.8 ok
    ghostVolley r=5 front=6.5 back=24.4 side=5.9 ok / headsmanDarts r=4.5 front=6.0 back=27.0 side=5.3 ok / paperStorm r=5 front=6.5 back=17.4 side=5.9 ok
    inkBloom r=4.5 front=6.0 back=11.5 side=6.9 ok / thornHalo r=4 front=6.1 back=9.0 side=4.7 ok / starShards r=5.5 front=7.0 back=18.0 side=6.5 ok
    sunNeedles r=5 front=6.5 back=27.0 side=5.9 ok / inkDrizzle r=3.5 front=5.2 back=12.6 side=5.3 ok / pinHail r=4.5 front=6.0 back=18.9 side=5.3 ok
    tailGuard r=5 front=6.5 back=9.8 side=5.9 ok / smokeTail r=4.5 front=6.0 back=28.6 side=6.7 ok / gravePins r=4.5 front=6.0 back=11.5 side=5.3 ok
    trackingSeals r=4.5 front=6.0 back=35.5 side=5.3 ok / huntersMarks r=5 front=6.5 back=19.2 side=6.9 ok / crowFeathers r=5 front=6.5 back=19.8 side=5.9 ok
    bossbane r=5.5 front=7.0 back=43.0 side=6.5 ok
C10u k9u-c10u-ink-final2 (crop 0,0,1300,600, 두 단)
    inkDarts 18.5 · brushQuills 17.5 · sealArrows 15.4 · frostNeedles 31.6 · thunderNeedles 17.3 · twinBlades 12.4 · ghostVolley 19.4 · headsmanDarts 15.3
    paperStorm 17.4 · inkBloom 15.7 · thornHalo 15.3 · starShards 20.8 · sunNeedles 19.6 · inkDrizzle 15.4 · pinHail 15.4 · tailGuard 15.4 · smokeTail 16.9
    gravePins 27.6 · trackingSeals 15.5 · huntersMarks 16.1 · crowFeathers 15.9 · bossbane 26.9 · inkLightning 47.6 · brushDownpour 30.4 · fallingScroll 33.0
    seventhSeal 37.8 · inkPulse 21.7 · frostRing 17.4 · thunderclap 18.2 · silenceBell 21.2 · inkPots 15.1 · clusterPots 15.1 · tarJar 19.8 · meteorBrush 15.9
    sparkThread 15.5 · stormThread 18.7 · frostChainlet 29.4 · inkLance 19.3 · wideBrush 15.6 · crossStrokes 23.4 · judgmentLine 16.6 · inkOrbit 16.9
    wardRing 22.3 · eclipseHalo 15.4 · core needleStorm 19.5 · core fanKnives 40.3 · core mirrorClone 54.2 · core railSpear 29.2  (ink %)
C11c k9u-c11c-cyan32-px (32px 색, 1px 블록): 3차 22종 + R1 넷, 26칸 모두 청록이 보임
```
- 바뀐 무기는 모두 C10u 15 이상입니다. 망나니 침은 13.9에서 15.3이 되었습니다. 15 아래는 1차 쌍날 12.4 하나이고, 이번 범위가 아닙니다.

#### 블라인드 (답을 적은 뒤 정답표를 열었습니다)
- **20px 흑백 55칸, 시드 271828**
  - 돌린 뒤에야 검수 5차에서 쓴 시드인 것을 알았습니다.
  - 첫 판독 45/55(무기 36/44, 핵심 9/11)입니다. **R1 두 쌍은 맞바뀌지 않았습니다**(뇌침·망나니 침·연막 꼬리 정답).
  - 혼령은 핵심 먹선 바늘로 잘못 봤습니다.
  - 틀린 무기: 까마귀 깃→사냥꾼 표식, 사냥꾼 표식→폭풍실, 폭풍실→먹꽃, 먹꽃→종이 폭풍, 종이 폭풍→천둥 박수, 천둥 박수→핵심 골분 박격, 서리침→혼령, 혼령→핵심 먹선 바늘.
- **20px 새 시드 314159**: 55/55. 앞 정답표를 본 뒤라 학습 효과가 있습니다.
- **needleStorm 32px(14칸)**: 각성 시드 161803 14/14, 새 시드 662607 14/14, 평상 시드 141421 14/14.
- **boneMortar·voidMine 계열 줄 + lob 줄(32px 색, 시드 577215)**: 15/15(`k9u-blind-look32-s577215`). M1·M2의 합격 기준인 '줄 블라인드가 계속 갈림'에 대한 자가 확인입니다.
- 정식 판정은 검수자의 새 시드입니다.

#### 전후 렌더 (`/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`)
- 전: `k9u-before-icons12`(12종 평상/각성), `k9u-before-r1-pairs-20px`
- 후, 같은 배치: `k9u-after-icons12-row`, `k9u-after-r1-pairs-20px-final`
- M1~M3: `k9u-m1-meteor-x4b`, `k9u-m2-tar-vs-bomber`(K7 심지형·즉시형과 120·32px), `k9u-m3-seal-grid3`, `k9u-m3-imprints-x8`, `k9u-m3-seal-small2`, `k9u-m123-sizes`(120·32·20px)
- R1: `k9u-r1-thunder-a`, `k9u-r1-headsman-b`, `k9u-r1-smoke-b`
- R2~R6: `k9u-r2-lightning-x4`, `k9u-r2r3-x4`(불꽃실), `k9u-r4-ward-x5`, `k9u-r5-judg-x5b`, `k9u-r6-storm-x5`

### 4. 검수서 대비
- **M1**: 처방 1~4를 모두 반영했고, 바꾸면 안 되는 것도 지켰습니다. 갈래는 넷입니다. 여섯으로 그렸을 때 빗자루처럼 보여 줄였습니다(§9.7-45).
- **M2**: 처방 1~5를 반영했습니다. '짧은 어두운 금'도 두지 않았습니다(§9.7-46).
- **M3**: 처방 1~4를 반영했습니다.
  - 반달 셋 중 둘은 획이 없습니다. 반달 면에 획을 붙이면 'D'·팩맨 꼴이 났습니다.
  - 획이 인영 가운데를 지나지 않게 했습니다(처방에 없음). 반쯤 찍힌 원판을 S가 가로지르면 태극으로 읽힐 여지가 있습니다(§9.7-47).
  - 32px에서 '흰 테 + 검은 안 + 가운데 점' 꼴은 남지 않습니다(`k9u-m3-seal-small2`).
- **R1**
  - 뇌침 각성판과 연막 꼬리 각성판도 같은 그림이라 함께 바뀌었습니다(§9.7-48·49).
  - 망나니 침 땅 먹 튐 0.5는 처방에 없던 것입니다. C10u ≥ 15를 맞추려는 것입니다(§9.7-50).
  - 연막 꼬리의 종이 틈 안으로 종이 연막침 둘이 지나갑니다.
- **R2**: 셋째 번개는 바닥에 꽂히지 않습니다. 갈라져 공중에서 끝나고, 옛 셋째의 바닥 종이 튐은 뺐습니다. 각성 구름에 혀를 하나 더했습니다(§9.7-51).
- **R3**: 넷째 높이는 검수서 예 88 대신 92입니다. 88이면 셋째와 실루엣 사이가 8 아래로 붙었습니다(§9.7-52).
- **R4·R5**: 처방대로 했습니다. 실패 중심은 (12, 45)로 내렸습니다(§9.7-53).
- **R6**: 처방대로 띄웠습니다. 가닥 a만으로는 조건을 함께 맞추는 배치를 찾지 못해 가닥 b도 썼습니다(§9.7-54).

### 5. 메인 세션이 할 일
- **굽기 시점**: 44종 시트는 검수 7차 합격 뒤에 굽습니다(검수 6차 §7-1).
- **굽기 전 확인할 값**(다르면 멈춤):
  - `volley-keep-v2=1vrl75n len=943384`
  - `batch2-accepted=1cu38bf len=2295034`
  - `batch3-icons=wgek8m len=2722700`
  - `n1-awakened=1agojwf len=272829`
  - `keep-but-MR=1nz2ip3 len=4552974`
  - `all44-icons=19ir0aw len=5889330`
- **이미 구운 1·2차 22종 시트(01166a7)**: 뇌침(평상·각성), 망나니 침(평상), 연막 꼬리(평상·각성) 칸이 바뀌었습니다. 44종 시트와 함께 다시 굽습니다.
- **탄**: 바뀌지 않았습니다(`shots264=194b48x`). 아틀라스·skills 팩은 다시 굽지 않습니다.
- **렌더러**: 바꿀 것이 없습니다.
- **`test:visual`**: 검수 6차 §7-6 목록에 정산 20px의 뇌침·망나니 침·연막 꼬리·혼령을 함께 봅니다.

### 6. 알려진 한계
- 작가 자가 블라인드는 편향됩니다. 첫 시드(271828)는 검수자가 이미 쓴 시드였습니다.
- 20px에서 폭풍실 깔때기는 술잔 꼴로 읽혀 한 번 먹꽃과 헷갈렸습니다.
- 혼령·먹번개 평상판은 '고치지 않음'을 해시로 증명하지 못했습니다(위 해시 판정 참고).
- 사람 클린업에 더할 것:
  - 인영의 찍힘 질감
  - 유성 붓 마른 꼬리 갈래와 짓눌린 붓털
  - 항아리 입·굽·도자기 조각
  - 실패 디테일
  - 폭풍실 먹귀 크기 차와 겹침 순서
  - 수호 고리 꼰 자국의 붓 결
  - 망나니 침 땅 먹 튐(세로 0.5의 가시가 칼날로 읽히지 않는지)
- 각성 유성 붓의 끊긴 먹 방울은 종이 테 때문에 작은 흰 점으로 보입니다.

---

## 검수 7차: K9 3차 수정 납품 (M1~M3, R1~R6), art-director, 2026-10-16

**판정: 수정 후 합격.**
- **필수 M1~M3:** 검수 6차 §3의 합격 기준을 모두 채운다. 유성 붓, 타르 항아리, 일곱째 인장 인영의 지금 꼴을 **K10(무기 전장 효과)의 기준으로 확정한다**(§6).
- **권장 R1~R6:** 각 합격 기준을 채운다. 다만 R1로 깊어진 뇌침 번개가 종이 바늘과 겹쳐서, 드래프트 120px와 HUD 32px에서 'A'(또는 '4')로 읽힌다. 지시서 §2.6 첫 줄(글자처럼 읽히는 획, T5)에 걸리므로 이것은 고친다(F1).
- **작은 것 하나:** 각성 유성 붓의 종이 테 두른 먹 방울이 전설 틀의 모서리 마름모 옆에 붙는다. 지시서 §2.2의 모서리 규칙에 걸린다(F2).
- **처방과 다르게 한 45~54:** 열 건 모두 받아들인다.
- **굽기:** 44종 시트는 지금 굽는다. F1·F2가 바꾸는 것은 뇌침 평상·각성과 유성 붓 각성의 타일·슬롯 6칸뿐이다. 그 납품을 짧게 확인(검수 8차)한 뒤 UI 시트만 다시 굽는다.

요청 세 가지에 대한 답
- (1) 120·32·20px에서 K7 폭탄병과 나란히 놓고 봤다. 유성 붓은 로켓으로, 타르 항아리는 폭탄병으로, 인영은 눈이나 반복 글자로 읽히지 않는다.
- (2) 블라인드 결과
  - 새 시드 20px 흑백 55칸, 첫 판독: 55/55(무기 44/44, 핵심 11/11). R1 두 쌍은 맞바뀌지 않았다.
  - needleStorm 32px: 평상 14/14, 각성 14/14.
  - 작가가 첫 판독에서 틀린 혼령·폭풍실·먹꽃·종이 폭풍·천둥 박수·까마귀 깃·사냥꾼 표식·서리침도 모두 맞혔다. 판독 단서와 편향은 §2에 적었다.
- (3) 45~54: 모두 수용(§5).

### 1. 직접 돌린 검사
렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r7-*.png`에 있다. 다른 작업자의 모듈(K10·K11 진행 중)이 함께 로드된 상태였고 kit error는 0건이다.

| 검사 | 결과 |
|---|---|
| 해시 `k9r7-final-hash-check`(코드 안에서 문자열·길이를 비교) | 모두 exact-match=true: `keep-but-MR=1nz2ip3 len=4552974`, `icons32=st2cpv len=4208357`, `shots264=194b48x len=344617`, `keep-but-M=18cb7f6 len=5875151`, `keep-but-M-R1=j853k3 len=5290144`, `volley-keep-v2=1vrl75n len=943384`, `batch2-accepted=1cu38bf len=2295034`, `batch3-icons=wgek8m len=2722700`, `n1-awakened=1agojwf len=272829`, `all44-icons=19ir0aw len=5889330`. 바뀐 12종의 무기별 해시(API §8)는 12/12 일치 |
| 독립 확인(내가 전에 받아들인 값) | 옛 volley 탄 `8wzptx len=134704`(검수 3차)와 `keep22x-shots=1p7d1ev len=328482`(검수 4차 뒤)가 그대로다. 그래서 탄 264장은 바뀌지 않았다. `n1-awakened`도 검수 6차 값과 같다 |
| 길이 산수(검수 6차 값 대비) | keep-but-M은 +47199, keep-but-M-R1은 +36624다. 그 차 10575는 volley-keep-v2 증가 39와 batch2 증가 10536의 합과 정확히 같다. '12종 밖은 바뀌지 않았다'는 납품서 주장과 맞는다. `keep-but-MR`의 수정 전 값은 작가가 잰 것이고, 나는 수정 뒤 값만 확인했다 |
| C5 | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18` |
| C4 | `icons bad=0 text=0 hatch=0 nocyan=0`, `stamps bad=0 text=0 filter=0 nocyan=0 colours={}` |
| C7 | `meta ok \| invalid calls ok \| core list=17`. 탄 22줄이 모두 ok이고 값이 검수 6차와 같다 |
| 자리표시 | `done=44/44 placeholder-draws=0`, `ICON keys=17 list=17 arsenal ids left in ICON=0 shots=22` |
| `--check` | 모두 ok: C1, C2 일곱 kind(volley·rear·strike·lob·chain·beam·halo), 바뀐 11종의 3배 쌍 렌더 11장 |
| T6 낙관 구역 | 바뀐 11종의 평상 타일에서 주 덩어리·과녁·모티프 머리가 구역 밖에 있다. 먹번개 구름 띠는 바탕이다 |
| C10u | 작가 값과 같다: 유성 붓 15.9, 타르 항아리 19.8, 일곱째 인장 37.8, 뇌침 17.3, 망나니 침 15.3, 연막 꼬리 16.9, 혼령 19.4, 불꽃실 15.5, 수호 고리 22.3, 심판선 16.6, 폭풍실 18.7. 15 아래는 쌍날 12.4 하나(1차 보존분) |
| C11c | 32px 색에서 바뀐 11종 모두 청록이 보인다(평상·각성) |

### 2. 블라인드 (새 시드, 칸마다 답을 먼저 적고 정답표를 열었다)
그림은 그 크기의 정보량 그대로 두고 픽셀 블록으로만 확대했다.

| 시험 | 시드 | 결과 |
|---|---|---|
| T3: 20px 흑백 55칸(무기 44 + 핵심 11) | 1299709 | **55/55** |
| needleStorm 32px 색, 각성 14칸 | 104729 | **14/14** |
| needleStorm 32px 색, 평상 14칸 | 7919 | **14/14** |
| 3차 계열 여덟 줄, 평상 32px 색 | 3571 | 30/30 |
| 같은 줄, 각성 32px 색 | 27449 | 30/30 |
| 같은 줄, 20px 흑백 | 17389 | 30/30 |
| 참고: 매듭을 잘라 낸 20px 흑백(투사체 22종 + 핵심 3) | 15485863 | 25/25. T3 정답표를 본 뒤라 참고값 |

편향과 단서
- 이 그림들을 여러 차례 본 사람의 판독이라 학습 효과가 있다.
- 슬롯 밑 등급 매듭 수를 단서로 썼다. 매듭은 그림 정보를 늘리지 않으려고 매듭만 남긴 렌더(`k9r7-t3-blind20-knotsonly`)로 셌다. 정보가 많은 `k9r7-t3-blind20-knots`는 열지 않았다.
- R1 두 쌍은 등급이 달라 매듭만으로도 갈린다(뇌침 희귀 ↔ 망나니 침 전설, 연막 꼬리 희귀 ↔ 혼령 영웅). 그래서 매듭을 잘라 낸 판을 따로 돌렸고, 두 쌍은 꼴만으로도 갈렸다.
  - 뇌침: 깊은 홈이 있는 들쭉날쭉한 대각선
  - 망나니 침: 가는 자루 + 칼날 윤곽 + 찢긴 먹귀
  - 연막 꼬리: 낮은 회색 둑 + 종이 틈 + 대각 목도리
  - 혼령: 곧은 변의 검은 쐐기
- 매듭이 없었다면 확신이 낮았을 칸(모두 이번에 바뀌지 않은 1·2차 무기와 핵심)
  - 먹꽃 ↔ 별조각
  - 별조각·종이 폭풍
  - 추적 인장 ↔ 까마귀 깃
  - 핵심 먹선 바늘·먹침·붓깃
  - 남은 20px 약한 쌍으로 사람 클린업에 넘긴다.
- 정식 판독 시험(n ≥ 8)은 미확인이다.

### 3. M1~M3 판정 (검수 6차 §3 기준)

| 항목 | 본 렌더 | 결과 |
|---|---|---|
| **M1 유성 붓** | `k9r7-meteor-x3`, `-x6`, `k9r7-m12-120`(1배), `-x2`, `-gray`, `k9r7-m123-32-20-px2` | **합격.** 앞끝은 뾰족한 코가 아니라 땅에 짓눌린 먹 붓털이다. 착지에 섬광과 먹 튐이 있어 '오른쪽 아래로 떨어진다'가 읽힌다. 120px에서 걸이 고리 + 먹 마개, 종이 자루, 쇠테 두 띠, 붓털이 붓으로 읽히고, 꼬리는 먼 끝에서 가장 넓다. 32px에서는 '붓·화살이 먹 튐에 꽂힘'이고 로켓·미사일·폭죽은 아니다. 바꾸면 안 되는 것도 지켰다: 42°, 착지 튐·섬광, 밀린 먹귀, 각성 2, 낙관 구역 비움, C10u 15.9. 계열 줄 블라인드에서도 갈린다 |
| M1에 남는 것 | | 꼬리 갈래 넷이 `taperPoly(..., w, 0.9)`라 끝이 뾰족한 가시다(`k-icons2.js:1627-1628`). 함수 주석은 '가시 금지'인데 결과는 가시다. 그래서 32px에서 화살 깃처럼 보일 기미가 있다. 권장 R7, 클린업 |
| **M2 타르 항아리** | `k9r7-tarjar-x3`, `k9r7-m12-120-gray`(1배), `-x2`(K7 심지형·즉시형과 나란히), `k9r7-m123-32-20-px2` | **합격.** 종이 테 두른 열린 입에서 타르가 흘러내리고, 반대쪽 끝에 굽이 있어 '쓰러진 항아리'로 읽힌다. 흰 균열, 몸에 붙은 네모, 꼭지·심지가 없다. 흑백 120·32px에서 폭탄병(심지·다리, 가시·흰 금)과 갈린다. 각성의 작은 항아리는 바로 선 꼴이라 오히려 더 항아리답다. 바꾸면 안 되는 것(웅덩이·방울, 눈 보이는 먹귀, 청록 끈, 각성 2 + 웅덩이 1.2배, C10u 19.8)도 지켰다 |
| **M3 일곱째 인장** | `k9r7-seal-x3`, `k9r7-seal-imprints-x8`, `k9r7-seal-120-x2`, `k9r7-m123-32-20-px2`, T3 칸 | **합격.** 닫힌 흰 테 + 검은 안 + 가운데 점이 없다. 그래서 일식 눈이 아니다. 테는 끊긴 호이고 틈 자리가 다르며, 반달 셋과 꼴·돌림·뒤집기가 제각각이라 같은 획의 반복이 아니다. 120px에서는 도장 아래 찍힌 자국이고, 32·20px에서는 먹 땅 위 밝은 점들이다. 인영 7(각성 8), 한 줄 아님, 청록 인면 테, 먹 땅을 지켰다 |
| M3에 남는 것 | | 8배에서 몇 개가 'C·G·Є' 같은 라틴 글자 꼴이다(2·6·7번). 120px에서는 5~9px라 글자로 읽히지 않는다. 클린업 때 매듭 꼴로 다듬는다 |

### 4. R1~R6 판정 (검수 6차 §4 기준)

| 항목 | 본 렌더 | 결과 |
|---|---|---|
| R1 뇌침 | `k9r7-thunder-x3`, `-plain-x6`, `-120`, `-32-solo`, `k9r7-r1-four-32-20` | 기준 통과: 되꺾임 32, 20px Z 홈 열림, T3 정답, needleStorm 14/14, C10u 17.3. **그러나 'A' 꼴이 생겼다 → F1** |
| R1 망나니 침(평상) | `k9r7-headsman-x3` | 통과. 검은 등 약 6 + 흰 면으로 덩어리가 읽힌다. 땅 먹 튐 0.5는 칼날로 읽히지 않는다(3배) |
| R1 연막 꼬리 | `k9r7-smoke-x3` | 통과. 낮은 회색 둑(위 뭉게)과 대각 목도리 사이에 종이 틈이 약 28~40이다 |
| R1 혼령 | C2, 블라인드 | 곧은 변의 검은 쐐기 그대로. 코드를 고치지 않았다는 것은 해시로 증명하지 못한다(작가 진술). 육안으로는 6차와 같다 |
| R2 먹번개 각성 | `k9r7-lightning-x3`, `-aw-x6` | 통과. 가운데 번개가 가늘고(6.5) 짧으며, 반대로 기울고, 구름 혀에서 시작해 갈라져 공중에서 끝난다. 세 개가 같은 기호로 늘어선 줄이 아니다 |
| R3 불꽃실 | `k9r7-spark-x3` | 통과. 높이 50·100·72·92, 간격 36·22·26이라 W가 아니다 |
| R4 수호 고리 | `k9r7-ward-x3` | 통과. S 꼰 획의 간격이 흔들리고 묶은 자리 곁이 비어, 사다리·해칭이 아니라 꼰 줄로 읽힌다 |
| R5 심판선 | `k9r7-judgment-x3` | 통과. 3/4 실패 + 손잡이이고 가운데 점·눈금이 없어 레티클이 아니다 |
| R6 폭풍실 | `k9r7-storm-x3`, `-aw-x6` | 통과. 평상·각성 모두 먹귀끼리 닿지 않는다(각성 종이 테 사이에도 틈이 있다) |

### 5. 고칠 것 (kit-artist, `k-icons2.js`와 `API-icons2.md`만)

**F1. 뇌침(평상·각성): 깊은 꺾임 + 종이 바늘이 'A'(또는 '4')로 읽힌다** (고침, R1의 부작용)
- **본 렌더:** `k9r7-thunder-120`(드래프트 1배), `k9r7-draft3-thunder`(드래프트 세 장 나란히), `k9r7-thunder-32-solo`(32px 색·흑백, 픽셀 블록 8배), `k9r7-thunder-plain-x6`
- **문제:** 지시서 §2.6 첫 줄 '숫자·한글·한자처럼 읽히는 획'(CONTEXT §2, T5)
  - 120px와 32px에서 청록 심의 높은 Λ와, 그 안을 가로지르는 흰 종이 바늘이 '가로획 있는 A'가 된다. 오른쪽 다리와 바늘은 '4'로도 읽힌다.
  - 각성판은 같은 `main0`을 써서 'A'가 겹친다.
  - 20px에서는 들쭉날쭉한 대각선이라 괜찮다.
- **원인:** `art/concept-kit/k-icons2.js:435`의 `main0.pts` 가운데 (36,90)→(76,46)→(70,78)
  - 꼭짓점이 바늘선(`:419`, (10,90)→(104,65))보다 약 26 위에 있다.
  - 두 다리가 꼭짓점에서 약 80%·87% 내려온 자리, 계산으로 (44,81)과 (71,74)에서 바늘을 지난다.
  - 그래서 길이 약 28의 바늘 토막이 삼각형 안 가로획으로 남는다. `front: [1, 3]`이라 왼쪽 다리는 바늘 뒤에 그려져 가로획이 그대로 보인다.
- **처방:** 깊은 꺾임(되꺾임 ≥ 22)은 지키되, 바늘이 한 꺾임의 두 다리를 모두 가로질러 종이 칸 안에 가로획을 만드는 일을 없앤다. 방법은 작가가 고른다.
  - (a) 꺾임의 두 발(`pts[2]`, `pts[4]`)을 바늘선 위나 바로 위로 올린다. 그러면 바늘이 삼각형 밑변을 지나고, 삼각형 안에는 바늘이 없다.
  - (b) 꺾임 안쪽(두 다리와 바늘 사이)을 먹으로 채워 검은 쐐기로 만들고, 바늘은 그 뒤로 지나게 한다.
  - 다른 직선(바늘, 둘째 번개)과 만나 '닫힌 종이 삼각형 + 가로획'이 생기지 않는지 각성판에서도 본다.
- **바꾸면 안 되는 것**
  - 20px에서 열린 Z 홈
  - 이웃 구간 길이가 30% 이상 다른 규칙
  - 굵기 w0 8 / w1 15.5와 먹·청록·종이 심
  - 과녁 먹귀, 기절 나선, 먹 튐, 낙관 구역 비움
  - 탄(변경 없음), 다른 43종의 출력
- **합격 기준**
  - 120px 1배와 32px(색·흑백, 픽셀 블록)에서 'A'·'4'·'Λ에 가로획'으로 읽히지 않는다(위 렌더와 같은 식).
  - needleStorm 32px 평상·각성 블라인드 14/14.
  - C10u 15~55.
  - `keep-but-MR=1nz2ip3 len=4552974` 그대로. 뇌침 말고 11종의 무기별 해시도 그대로(F2를 같이 하면 유성 붓 각성만 바뀐다).
  - C1, C2 volley `--check` ok.
  - 새 시드 20px 판독(뇌침 ↔ 망나니 침이 맞바뀌지 않음)은 검수자가 본다.

**F2. 각성 유성 붓: 종이 테 두른 먹 방울이 틀 모서리 마름모 옆에 '리벳'처럼 붙는다** (고침, 작음)
- **본 렌더:** `k9r7-meteor-aw-tile-corner`(각성 타일 왼쪽 위 5배), 비교용 `k9r7-meteor-plain-tile-corner`(평상은 괜찮다), `k9r7-meteor-x3`
- **문제:** 지시서 §2.2 '네 모서리 10 안에 정보를 두지 않는다'(영웅 이상 틀의 마름모가 8까지 들어온다)
  - 각성 1.1배와 종이 테 2.2 때문에, 꼬리 끝의 끊긴 먹 방울 셋이 흰 테 두른 작은 점이 된다.
  - 자리는 아이콘 좌표 약 (2,7)·(15,7)·(−3,22)다. 마름모 바로 옆에서 틀 장식이나 '흰 테 + 검은 점'으로 보인다.
  - 작가도 알려진 한계로 적었다.
- **원인:** `k-icons2.js:1630`의 방울이 `comet()` 출력에 섞여 `fg`로 들어가(`:1637`) 각성 종이 테를 받는다.
- **처방:** 각성판에서 방울을 빼거나, `bg`로 옮긴다(종이 테 없음, 창 안에 남음). 남긴다면 창 모서리에서 12 이상 떨어뜨린다. 평상판은 그대로 둔다.
- **바꾸면 안 되는 것:** M1 꼴 전부(넓어지는 꼬리와 갈래, 마개·고리, 짓눌린 붓털, 청록 심, 착지)와 평상판 출력(해시 `8e7c47`)
- **합격 기준**
  - 각성 타일 5배 크롭에서 모서리 10 안에 흰 테 점이 없다.
  - C2 lob `--check` ok.
  - 유성 붓 평상 해시 그대로.

**권장 R7(F2와 함께 하면 좋다):** 유성 붓 꼬리 갈래의 끝을 뾰족한 가시 대신 갈라진 마른 끝으로 바꾼다. 끝 폭은 1.6 이상이고 끝에서 둘로 갈라지게 한다(`:1628`). 32px에서 화살 깃으로 보이는 기미를 줄인다. 하지 않으면 사람 클린업으로 넘긴다.

### 6. 처방과 다르게 한 것 45~54

| # | 판정 | 근거 |
|---|---|---|
| 45 유성 붓 갈래 넷 + 방울 셋, 종이 걸이 고리 | 수용 | 처방 범위(3~4) 안이다. 여섯 갈래가 빗자루로 읽혔다는 판단에 동의한다. 갈래 끝 모양은 R7 |
| 46 타르 항아리 금 없음, 조각 둘 | 수용 | 처방 3의 선택 항목을 쓰지 않은 것이라 오히려 안전하다 |
| 47 반달 둘에 획 없음, 획이 가운데를 지나지 않음, 테 붓 폭이 끝으로 마름 | 수용 | 'D'·팩맨과 태극을 피한 판단이 맞다. 태극 회피는 문화 검토 항목으로 남긴다 |
| 48 뇌침 각성도 바뀜(`main0` 공유) | 수용 | 평상·각성 단서를 같게 둔 것은 맞다. 'A' 꼴은 F1에서 둘 다 고친다 |
| 49 연막 꼬리 각성도 바뀜, 틈 안의 종이 연막침, 침 뒤끝을 둑에 묻음 | 수용 | |
| 50 망나니 침 땅 먹 튐 세로 0.5 | 수용 | C10u 하한을 맞추려는 것이다. 3배에서 칼날로 읽히지 않는다 |
| 51 먹번개 각성 셋째가 공중에서 갈라져 끝남, 구름 혀 (66,40) | 수용 | strike 틀의 '바닥에 꽂힌다'에 대한 예외로 둔다. 셋이라는 수는 읽히고, 같은 기호의 반복을 깬다 |
| 52 불꽃실 넷째 높이 92 | 수용 | 실루엣 사이 8 이상을 맞추려는 것이다 |
| 53 심판선 실패 (12,45) | 수용 | 각성에서 창 밖으로 나가는 것은 10 안이다 |
| 54 폭풍실 먹귀를 두 가닥에 나눔 | 수용 | 한 가닥 후보가 고른 한 줄이 된다는 판단이 맞다 |

### 7. K10 기준 (합격 확정)
유성 붓, 타르 항아리, 일곱째 인장(도장 + 인영)은 이번 출력의 꼴을 K10 무기 전장 효과의 기준으로 쓴다.
- 기준 버전(무기별 해시, 평상/각성): meteorBrush `8e7c47`/`1wjcsxc`, tarJar `1mq1jnw`/`chm7dz`, seventhSeal `11totq1`/`1s8ck17`
- F2는 각성 유성 붓의 방울만 건드린다. 꼴 기준은 바뀌지 않는다.

**유성 붓**
- 큰 붓이 머리(붓털)부터 떨어진다. 화면에서는 왼쪽 위 → 오른쪽 아래다.
- 붓의 단서: 종이 자루, 쇠테 띠, 먹 붓털, 자루 뒤끝의 둥근 먹 마개 + 걸이 고리.
- 혜성 꼬리는 자루 뒤끝에서 자루 폭으로 시작해 먼 끝에서 가장 넓다(약 3배). 먼 끝은 한 점으로 모이지 않고, 길이가 다른 마른 갈래 3~4와 끊긴 먹 방울로 흩어진다.
- 청록 심은 붓 쪽에서 시작해 꼬리 가운데를 따른다.
- 착지에서 붓털이 2~3갈래로 짓눌리고, 넓적한 먹 튐과 불규칙 종이 섬광이 난다.
- 금지
  - 뾰족한 앞끝(로켓 코)
  - 먼 끝으로 모이는 꼬리
  - 꼬리 끝의 청록
  - 꼬리 쪽 분사 섬광
  - 가시처럼 뾰족한 갈래 끝(깃·불꽃으로 읽힘)

**타르 항아리**
- 쓰러진 검은 항아리다: 먹 몸, ink5 빛면, 어깨의 종이 반사.
- 입은 종이 테(p50 2)를 두른 열린 타원(안은 먹)이고, 타르가 입술에서 흘러 넓은 웅덩이가 된다.
- 반대쪽 끝에 굽(바닥 타원 + p300 선)이 보인다. 목에 청록 봉인 끈이 있다.
- 깨진 조각은 웅덩이 가 땅의 휜 도자기 조각이다.
- 금지(= K7 폭탄병의 어휘)
  - 흰 균열
  - 몸에 붙은 네모 덩이·마개
  - 꼭지·심지·도화선·불꽃
  - 입이 보이지 않는 검은 공

**일곱째 인장**
- 도장: 낮고 넓은 원통 + 목 + 공 꼭지(키 큰 깡통 아님), 인면 테가 청록.
- 인영: 먹 땅에 종이로 덜 찍힌 자국이다.
  - 테는 둘레의 70~85%만 찍힌 호 1~2개이고, 틈 자리가 제각각이며, 붓 폭은 가운데가 굵고 끝으로 마른다.
  - 매듭 획은 가운데를 비켜 테에 닿는다(폭 50% 이상). 꼴(열린 고리·말림·S)과 돌림·뒤집기가 인영마다 다르다.
  - 2~3개는 반달 종이 면이다. 크기는 서로 다르게 하고, 한 줄이나 고리로 늘어놓지 않는다.
- 금지
  - 닫힌 흰 테 + 검은 안 + 가운데 점(5장 먹귀 일식 눈)
  - 같은 획의 반복
  - 가운데를 가로지르는 S(태극)

**K10 공통**
- 게임 화면 크기(1배, 30~60px)에서도 다음 단서가 남아야 한다.
  - 유성 붓: 머리부터 떨어지는 방향, 넓어지며 갈라지는 꼬리, 착지 튐
  - 항아리: 종이 입 테와 굽
  - 인영: 끊긴 호(닫힌 고리 금지)
- 번개를 그린다면 바늘이나 직선과 겹쳐 'A'·'4'를 만들지 않는다(F1과 같은 교훈).

### 8. 남는 것
- **kit-artist:** F1·F2(필수, 작음), R7(권장). 납품은 검수 8차에서 짧게 확인한다(렌더 서너 장 + 해시 + 20px 새 시드 한 번).
- **사람 클린업**(납품서 목록에 더함)
  - 유성 붓 꼬리 갈래를 마른 붓 끝으로, 짓눌린 붓털
  - 인영을 매듭 꼴로 다듬기: 라틴 글자 같은 C·G 말림을 피하고 찍힘 질감을 더한다
  - 폭풍실: 20px에서 술잔 꼴 → 깔때기 아래를 꺾인 회오리 꼬리로
  - 망나니 침 땅 먹 튐
  - 20px 약한 쌍의 픽셀 다듬기: 혼령 ↔ 핵심 먹선 바늘, 먹꽃 ↔ 별조각, seeker 셋, 핀 우박 ↔ 먹 이슬비
- **팀 결정**
  - 쌍날 C10u 12.4(하한 아래, 1차 보존분)를 예외로 둘지, 최종 정비 때 고칠지
  - HUD 각성 슬롯 표시 방식(지시서 §12-4)은 미정 그대로다. 이번 결과(각성 32px 30/30·14/14)로는 지금 방식을 유지해도 된다
- **미확인**
  - 실제 게임 화면
  - 정식 판독 시험(n ≥ 8)
  - 정산 목록에 무기 이름이 함께 나오는지
  - 혼령·먹번개 평상판이 코드상 그대로인지(해시로 증명 불가, 육안으로는 같음)

### 9. 메인 세션: 굽기 때 주의할 것
1. **지금 44종을 굽는다.**
   - 커밋한 스냅숏에서 굽고, 같은 스냅숏으로 아래 값을 확인한다. 다르면 멈춘다.
   - K10·K11이 같은 시각에 돌고 있다. 이 값은 출력 해시라 다른 모듈의 코드 추가에는 흔들리지 않지만, `k-icons2.js`의 출력이 바뀌면 달라진다.
   - 확인 값(모두 내가 exact-match로 확인함):
     - `volley-keep-v2=1vrl75n len=943384`
     - `batch2-accepted=1cu38bf len=2295034`
     - `batch3-icons=wgek8m len=2722700`
     - `n1-awakened=1agojwf len=272829`
     - `keep-but-MR=1nz2ip3 len=4552974`
     - `all44-icons=19ir0aw len=5889330`
   - 명령 원문은 `API-icons2.md` §8에 있다. 한 번에 보는 식은 `k9r7-final-hash-check`와 같다.
2. **탄은 바뀌지 않았다**(`shots264=194b48x len=344617`, 옛 `8wzptx`·`1p7d1ev`도 같음). 아틀라스와 skills 팩은 다시 굽지 않는다.
3. **시트**
   - `arsenal-tiles` 2656×3652(11행, 디코드 약 38.8 MB), `arsenal-slots` 1008×1200(10행).
   - `build-arsenal-art.mjs`에서 44키 모두 배지를 지운다.
   - `src/ui/uiArt.test.ts` 키 목록을 갱신한다.
   - `npm run build`로 예산을 본다. 드래프트 모달 메모리가 무거우면 Q1대로 kind별로 나눈다.
   - 이미 구운 1·2차 22종 시트(01166a7)는 44종 시트로 대체된다.
4. **F1·F2 납품 뒤**
   - 검수 8차 합격 후 UI 시트만 다시 굽는다(`npm run build:ui-art`, `node scripts/build-arsenal-art.mjs`).
   - 바뀌는 칸: 뇌침 평상·각성 × 타일·슬롯 4칸, 유성 붓 각성 × 타일·슬롯 2칸.
   - 그때 `keep-but-MR`은 같아야 하고, `all44-icons`·`volley-keep-v2`·`batch3-icons`는 바뀌는 것이 맞다(새 값은 그 납품서에 적힌다).
5. **`npm run test:visual`**
   - 드래프트: 일곱째 인장·심판선(신화), 유성 붓·타르 항아리, 뇌침(F1 전후의 'A' 확인)
   - HUD: needleStorm·chainSpark·boneMortar 계열 줄
   - 정산 20px: 뇌침·망나니 침·연막 꼬리·혼령(무기 이름이 함께 나오는지)
6. **지시서 정정**(검수 6차 §7에 더함)
   - §2.6: '번개·꺾쇠가 바늘 같은 직선과 겹쳐 닫힌 종이 삼각형 + 가로획('A'·'4')을 만들지 않는다'
   - §2.2: '각성 fg의 떨어진 작은 조각(방울)은 종이 테를 받아 흰 테 점이 되므로, 모서리 12 밖에 두거나 bg로 옮긴다'

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`(F1 `:411-441`·`:435`·`:419`, `boltAround` `:379-410`; F2 `:1622-1637`, R7 `:1627-1628`)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`(§6c, §8, §9.7)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-icons.md`(§2.2, §2.6, §3.1)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`(3차 수정 납품서, 검수 6차)
- 렌더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r7-*.png`

파일은 하나도 고치지 않았고, 아무것도 내려받지 않았다.

---

## 3차 수정 2회차 납품서

검수 7차 §5의 F1·F2와 권장 R7을 반영했습니다.
- 고친 파일은 `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`와 `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md` 둘뿐입니다. 아무것도 내려받지 않았습니다.
- 세션 한도로 멈췄다 재개할 때 파일 상태를 다시 확인했습니다. F1·F2·R7 코드가 모두 들어 있었고, 모듈은 오류 없이 로드됩니다(kit error 0). 그 자리부터 검사와 문서를 마쳤습니다.
- 출력이 바뀐 무기는 **뇌침(평상·각성)과 유성 붓(평상·각성)** 둘뿐입니다.
- `keep-but-MR=1nz2ip3 len=4552974`는 그대로이고, 나머지 무기별 해시 10종도 그대로입니다.

### 1. 바뀐 것

**F1 뇌침(평상·각성) — 처방 (b)**
- 되꺾임 안쪽을 먹 쐐기로 채웠습니다. 쐐기는 두 다리 사이에서 바늘 중심선 너머 3.8까지 이릅니다.
- 쐐기를 바늘 위에 얹어 바늘이 쐐기 뒤로 지나가게 했고, 두 다리는 쐐기 앞에 다시 그립니다(`front` [1, 3] → [1, 2, 3]).
- 종이 삼각형 안의 가로획('A')과 '오른쪽 다리 + 바늘'('4')이 없어집니다.
- 그대로 둔 것: 점, 굵기 w0 8 / w1 15.5, 먹·청록·종이 심, Z 홈, 과녁·기절 나선·먹 튐.
- (a)도 그려 봤습니다(`k9u-f1-a-120-32`). 두 발을 바늘선에 올리면 바늘이 삼각형 밑변이 되어 'Δ'나 밑변 있는 'A'로 남아서 버렸습니다.
- 각성 둘째 바늘의 작은 번개는 바늘을 밑변으로 하는 작은 꺾쇠라 안쪽 가로획이 없습니다(8배 `k9u-f1-aw-second-x8`).

**F2 각성 유성 붓**
- 각성판에서 꼬리의 끊긴 먹 방울을 뺐습니다(`comet(…, drops=false)`). 둘째 붓 꼬리의 방울도 같이 뺐습니다.
- bg로 옮기는 안은 쓰지 않았습니다. 1.1배로 커진 fg 꼬리와 자리가 어긋나 꼬리 끝에 묻히고, 각성 먹 바탕에서는 먹 방울이 보이지 않습니다.
- 평상판의 방울은 그대로입니다.

**R7 유성 붓 꼬리 갈래 끝(평상·각성)**
- 끝이 뾰족한 가시(끝 폭 0.9)이던 것을 갈라진 마른 끝으로 바꿨습니다(새 도우미 `dryTine`).
- 끝 폭은 max(1.8, 시작 폭 × 0.75)입니다.
- 끝에 깊이 min(끝 폭, 갈래 길이 × 0.3)의 홈을 내서 두 가닥으로 가릅니다. 가닥마다 0.32 × 끝 폭의 납작한 끝이 있어 뾰족하지 않습니다.
- 그 밖의 M1 꼴(넓어지는 꼬리, 마개·고리, 짓눌린 붓털, 청록 심, 착지)과 난수 순서는 같습니다.

### 2. 전후 렌더 (`/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`)
1. **F1**
   - 전: `k9u-f1-before-120-32`(120px 1배 + 32px 색·흑백 픽셀 블록). 검수자 렌더 `k9r7-thunder-120`, `k9r7-thunder-32-solo`도 같은 상태입니다.
   - 후: `k9u-f1-b-120-32`(같은 배치), 5배 `k9u-f1-b-x5`
2. **F2**
   - 전: `k9r7-meteor-aw-tile-corner`(검수자)
   - 후: `k9u-f2-meteor-aw-tile-corner`(각성 타일 왼쪽 위 5배). 모서리 마름모 옆 흰 테 점이 없습니다.
3. **R7**
   - 전: `k9u-m1-meteor-x4b`(가시 갈래)
   - 후: 8배 `k9u-r7-tines-x8b`, 4배 `k9u-f2r7-meteor-x4`
4. **크기 확인**: `k9u-f2r7-meteor-120-32`(유성 붓 120px·32px 색·흑백)

### 3. 해시 전후 (`k9u-f12-hashes`, 무기별 `k9u-weapon-hashes12-f12`)

| 해시 | 전(1회차 뒤) | 후 | 판정 |
|---|---|---|---|
| keep-but-MR | `1nz2ip3 len=4552974` | `1nz2ip3 len=4552974 codes=49,110,122,50,105,112,51` | **같음**(`icons32=st2cpv len=4208357`, `shots264=194b48x len=344617`) |
| keep-but-M | `18cb7f6 len=5875151` | `1fjlgj1 len=5877248 codes=49,102,106,108,103,106,49` | 뇌침으로 바뀜 |
| keep-but-M-R1 | `j853k3 len=5290144` | `j853k3 len=5290144 codes=106,56,53,51,107,51` | **같음** |
| volley-keep-v2 | `1vrl75n len=943384` | `11ea404 len=945481 codes=49,49,101,97,52,48,52` | 뇌침으로 바뀜 |
| batch2-accepted | `1cu38bf len=2295034` | `1cu38bf len=2295034` | **같음** |
| batch3-icons | `wgek8m len=2722700` | `1prsfzs len=2720789 codes=49,112,114,115,102,122,115` | 유성 붓으로 바뀜 |
| n1-awakened | `1agojwf len=272829` | `1agojwf len=272829` | **같음** |
| all44-icons | `19ir0aw len=5889330` | `13kuvqx len=5889516 codes=49,51,107,117,118,113,120` | 바뀜(굽기 전 확인값) |

무기별 해시
```
meteorBrush    plain=f0ap7s [102,48,97,112,55,115] CHANGED  awakened=1eekf35 [49,101,101,107,102,51,53] CHANGED
thunderNeedles plain=1rnwt16 [49,114,110,119,116,49,54] CHANGED  awakened=14rsbvu [49,52,114,115,98,118,117] CHANGED
tarJar, seventhSeal, headsmanDarts, smokeTail, ghostVolley, inkLightning, sparkThread, wardRing, judgmentLine, stormThread: plain·awakened 모두 same
```
- **유성 붓 평상 `8e7c47` → `f0ap7s`**: 바뀐 이유는 R7(갈래 끝 모양) 하나입니다. 방울은 평상판에 그대로 있고 난수 호출 순서도 같습니다.
- **유성 붓 각성 `1wjcsxc` → `1eekf35`**: R7 + F2(방울 뺌)입니다.
- K10 기준 버전으로 쓰던 유성 붓 해시는 이 새 값으로 바뀝니다. 꼴 기준은 갈래 끝과 각성 방울 말고는 같습니다.

### 4. 검사 출력
```
C1  k9u-f12-c1-all (--scale 0.25 --check): ok
C2  k9u-f12-c2-volley (--check): ok
C2  k9u-f12-c2-lob (--check): ok
C10u k9u-f12-c10u-ink (ink %):
  inkDarts 18.5 · brushQuills 17.5 · sealArrows 15.4 · frostNeedles 31.6 · thunderNeedles 17.8 · twinBlades 12.4 · ghostVolley 19.4 · headsmanDarts 15.3
  paperStorm 17.4 · inkBloom 15.7 · thornHalo 15.3 · starShards 20.8 · sunNeedles 19.6 · inkDrizzle 15.4 · pinHail 15.4 · tailGuard 15.4 · smokeTail 16.9
  gravePins 27.6 · trackingSeals 15.5 · huntersMarks 16.1 · crowFeathers 15.9 · bossbane 26.9 · inkLightning 47.6 · brushDownpour 30.4 · fallingScroll 33.0
  seventhSeal 37.8 · inkPulse 21.7 · frostRing 17.4 · thunderclap 18.2 · silenceBell 21.2 · inkPots 15.1 · clusterPots 15.1 · tarJar 19.8 · meteorBrush 16.2
  sparkThread 15.5 · stormThread 18.7 · frostChainlet 29.4 · inkLance 19.3 · wideBrush 15.6 · crossStrokes 23.4 · judgmentLine 16.6 · inkOrbit 16.9
  wardRing 22.3 · eclipseHalo 15.4 · core needleStorm 19.5 · core fanKnives 40.3 · core mirrorClone 54.2 · core railSpear 29.2
  (thunderNeedles: ink 17.8% paper 79.0% cyan 3.1% / meteorBrush: ink 16.2% paper 83.3% cyan 0.4%)
```
- C10u 변화: 뇌침 17.3 → 17.8, 유성 붓 15.9 → 16.2입니다. 15 아래는 이번 범위 밖인 쌍날 12.4 하나입니다.
- needleStorm 32px 블라인드(새 시드, 답을 먼저 적고 정답표를 열었습니다)
  - 평상 `k9u-f1-blind-needle-32-s1618033`: **14/14**
  - 각성 `k9u-f1-blind-needle-aw32-s1414213`: **14/14**
  - 32px에서 뇌침은 검은 쐐기가 있는 들쭉날쭉한 번개로 읽혔고, 'A' 가로획은 보이지 않았습니다.

### 5. 메인 세션이 할 일
- 검수 8차 합격 뒤 UI 시트만 다시 굽습니다(`npm run build:ui-art`, `node scripts/build-arsenal-art.mjs`).
- 바뀌는 칸은 뇌침 평상·각성 × 타일·슬롯 4칸과 **유성 붓 평상·각성 × 타일·슬롯 4칸**입니다. R7 때문에 검수 7차 §9-4의 예상(유성 붓 각성 2칸)보다 평상 2칸이 더 바뀝니다.
- 굽기 전 확인할 값(다르면 멈춤):
  - `keep-but-MR=1nz2ip3 len=4552974`
  - `all44-icons=13kuvqx len=5889516`
  - `volley-keep-v2=11ea404 len=945481`
  - `batch3-icons=1prsfzs len=2720789`
  - `batch2-accepted=1cu38bf len=2295034`
  - `n1-awakened=1agojwf len=272829`
- 탄은 바뀌지 않았습니다(`shots264=194b48x`). 아틀라스와 skills 팩은 다시 굽지 않습니다.
- K10 무기 전장 효과의 유성 붓 기준 해시는 `f0ap7s`/`1eekf35`로 바꿉니다.

### 6. API 문서에서 고친 곳과 알려진 한계
API 문서
- 납품 표에 '3차 수정 2회차' 줄을 더했습니다.
- 표: §6 뇌침(F1), §6c 유성 붓(R7·F2)을 고쳤습니다.
- §8에 2회차 해시 표를 더했습니다.
- §9.8을 새로 썼습니다(55 F1에 (b)를 고른 이유, 56 F2에 빼기를 고른 이유, 57 R7 치수와 평상 해시가 바뀐 이유).
- §10에 C10u·블라인드·클린업을 더했습니다.

알려진 한계
- 뇌침 먹 쐐기는 곧은 변 다각형입니다. 사람 클린업 때 붓 질감을 넣어야 합니다.
- 유성 붓 갈래 끝의 마른 붓 결도 클린업 몫입니다.
- 새 시드 20px 판독(뇌침 ↔ 망나니 침)은 검수자가 봅니다.

---

## 검수 8차: K9 3차 수정 2회차 (F1·F2·R7), art-director, 2026-10-19

**판정: 합격.** 검수 7차 §5의 F1·F2 합격 기준과 권장 R7을 모두 채운다. 메인 세션은 UI 시트 8칸을 다시 구우면 된다.
- 다시 굽는 칸: 뇌침 평상·각성, 유성 붓 평상·각성 × 타일·슬롯.
- 처방과 다르게 한 55~57은 모두 받아들인다.

### 1. 직접 돌린 검사
렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r8-*.png`에 있다. kit error는 0건이다.

| 검사 | 결과 |
|---|---|
| 해시 `k9r8-hash-check`(코드 안에서 문자열·길이 비교) | 모두 exact-match=true. 값은 아래 '굽기 전 확인 값'과 같고, 여기에 `keep-but-M=1fjlgj1 len=5877248`, `keep-but-M-R1=j853k3 len=5290144`(그대로), `icons32=st2cpv`, `shots264=194b48x len=344617`이 더해진다 |
| 무기별 해시 | 12/12 일치. 유성 붓 `f0ap7s`/`1eekf35`, 뇌침 `1rnwt16`/`14rsbvu`. 나머지 10종은 검수 7차에 내가 확인한 값과 같으므로, 그 10종이 바뀌지 않았다는 독립 증명이 된다 |
| 탄 | 옛 `8wzptx len=134704`·`1p7d1ev len=328482`가 그대로다. 탄은 바뀌지 않았다 |
| 길이 산수 | keep-but-M과 volley-keep-v2가 똑같이 +2097(뇌침), batch3-icons가 −1911(유성 붓)이다. all44의 +186 = 2097 − 1911로 정확히 맞는다 |
| C5 | `icons-all=19vh262 len=2634966 list=17 ICON=17 \| skillvfx-all=1xq1i37 len=698432 groups=18`, exact-match=true |
| `--check` | 모두 ok: C1, C2 volley, C2 lob, 뇌침·유성 붓 3배 쌍 렌더 |
| C10u | 뇌침 17.8, 유성 붓 16.2(작가 값과 같음, 15~55 안) |

### 2. F1 뇌침: 'A'·'4' 제거 → 합격
- **렌더:** `k9r8-thunder-120`(드래프트 1배), `k9r8-draft3-thunder`(드래프트 세 장), `k9r8-thunder-32-solo`(32px 색·흑백 픽셀 블록 8배), `k9r8-thunder-x3`
- **결과**
  - 되꺾임 안쪽이 먹 쐐기로 채워져 종이 삼각형이 없다. 바늘은 쐐기 뒤로 지나 오른쪽 다리 밖에서만 다시 보인다.
  - 그래서 120px와 32px(색·흑백)에서 '가로획 있는 A'도, '다리 + 바늘 = 4'도 없다. 지금은 '검은 가시가 솟은 들쭉날쭉한 번개'로 읽힌다.
  - 각성판도 같다. 둘째 바늘의 작은 꺾쇠에도 가로획이 없다.
  - 점, 굵기, 청록·종이 심, Z 홈은 그대로다.
- **20px 새 시드 55칸**(시드 49979687, 흑백 픽셀 블록)
  - 매듭을 세지 않고 꼴만으로 첫 판독: 55/55.
  - 뇌침(1.6)과 망나니 침(2.6)은 맞바뀌지 않았다.
- **needleStorm 32px:** 평상 14/14(시드 611953), 각성 14/14(시드 2750159).
- **편향:** 같은 그림을 여러 차례 본 검수자의 판독이라 학습 효과가 있다. 정식 판독 시험(n ≥ 8)은 미확인이다.

### 3. F2 각성 유성 붓: 모서리 방울 → 합격
- `k9r8-meteor-aw-tile-corner`(각성 타일 왼쪽 위 5배)에서 모서리 마름모 옆의 흰 테 점이 없어졌다.
- 가장 가까운 것은 꼬리 갈래 끝(아이콘 좌표 약 (15, 9))으로, 모서리 10 구역 밖이다.
- 틀 왼쪽 가장자리의 먹 얼룩은 빌린 각성 틀(k-icons)의 번짐이고 무기 그림이 아니다.
- 평상판의 방울은 그대로다.

### 4. R7 유성 붓 갈래 끝 → 합격
- `k9r8-meteor-tines-x8`: 갈래 끝이 뾰족하지 않고, 홈으로 갈라진 납작한 마른 끝이다.
- `k9r8-meteor-32-px`: 32px 색·흑백에서 인장 화살·붓깃·먹침과 나란히 놓아도, 꼬리는 좌우 대칭 깃이 아니라 거친 먹 술로 보인다. 화살 깃으로 읽히지 않는다.
- `k9r8-meteor-x3`, `k9r8-meteor-120-32`(드래프트 120): M1 꼴은 그대로다. 먼 끝이 넓은 꼬리, 마개·고리, 짓눌린 붓털, 청록 심, 착지, 42°, 낙관 구역 비움.

### 5. 55~57
| # | 판정 | 근거 |
|---|---|---|
| 55 F1에 처방 (b) | 수용 | (a)는 바늘이 밑변이 되어 'Δ'·밑변 있는 'A'로 남았다는 판단에 동의한다. `front`에 2를 더해 다리를 쐐기 앞에 다시 그린 것도 맞다 |
| 56 F2를 '빼기'로 | 수용 | bg로 옮기면 1.1배 fg 꼬리와 어긋나고 먹 바탕에서 보이지 않는다 |
| 57 R7 치수, 평상 해시 변경 | 수용 | 끝 폭 1.8 이상(처방 1.6 이상)이다. 평상 해시는 갈래 끝 때문에만 바뀌었고, 나머지는 같은 코드·같은 난수 순서다 |

### 6. K10 기준 갱신
- 유성 붓의 K10 기준 해시를 `f0ap7s`/`1eekf35`로 바꾼다.
- 꼴 기준은 검수 7차 §7 그대로이고, 갈래 끝은 '갈라진 마른 끝'이 기준이다. 이미 금지 목록에 '가시처럼 뾰족한 갈래 끝'으로 들어 있다.
- 타르 항아리 `1mq1jnw`/`chm7dz`, 일곱째 인장 `11totq1`/`1s8ck17`은 그대로다.

### 7. 남는 것
- **사람 클린업**(검수 7차 §8 목록에 더함)
  - 뇌침 먹 쐐기는 곧은 변 다각형이라 붓 질감이 필요하다.
  - 유성 붓 갈래 끝의 마른 붓 결.
- **팀 결정**(검수 7차와 같음): 쌍날 C10u 12.4, HUD 각성 슬롯 표시 방식.
- **미확인:** 실제 게임 화면, 정식 판독 시험, 정산 목록의 무기 이름 표시.

### 8. 메인 세션: 굽기 때 주의할 것
1. **UI 시트만 다시 굽는다**(`npm run build:ui-art`, `node scripts/build-arsenal-art.mjs`).
   - 바뀌는 칸은 8칸이다.
   - 44종을 아직 굽지 않았다면 지금 이 값으로 44종을 한 번에 굽는다. 검수 7차 §9의 확인 값은 아래 값으로 대체된다.
2. **굽기 전 확인 값**(커밋한 스냅숏에서, 다르면 멈춤; 모두 내가 exact-match로 확인함)
   - `keep-but-MR=1nz2ip3 len=4552974`
   - `all44-icons=13kuvqx len=5889516`
   - `volley-keep-v2=11ea404 len=945481`
   - `batch3-icons=1prsfzs len=2720789`
   - `batch2-accepted=1cu38bf len=2295034`
   - `n1-awakened=1agojwf len=272829`
   - K10·K11이 진행 중이니 굽기 직전에 다시 돌린다.
3. **탄은 바뀌지 않았다**(`shots264=194b48x`). 아틀라스와 skills 팩은 다시 굽지 않는다.
4. **`npm run test:visual`**
   - 드래프트 카드에서 뇌침('A'가 실제 UI에서도 사라졌는지)과 유성 붓을 본다.
   - 나머지 장면은 검수 7차 §9-5 그대로다.
5. **지시서 정정:** 검수 7차 §9-6의 두 줄(§2.6 'A'·'4', §2.2 각성 방울)은 아직 더할 것으로 남아 있다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-icons2.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-icons2.md`(§8, §9.8)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`(3차 수정 2회차 납품서)
- 렌더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k9r8-*.png`

파일은 하나도 고치지 않았고, 아무것도 내려받지 않았다.
