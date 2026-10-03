# 작업 지시서 A2c (K3): 라운드 보스 6종 attack·death 포즈 + 보스 얼굴·글자 처방

> 메인 세션 메모(2026-10-03): A2c 발주(`docs/outsourcing/R4-orders.md`)의 art-director 응답을 그대로 저장했다. §8 열린 질문은 사용자가 정하기 전까지 권고안으로 진행한다: Q1 attack은 보스당 하나, Q2 광폭 공격 18장 그대로, Q3 outro 패널은 합격 뒤 메인 세션이 정한다, Q4 여제 눈 정정판, Q5 걸린 고깃덩이, Q6 키 프레임만, Q7 bossesA는 틈을 만들지 않는 규칙. 작성 메모의 권장대로 K3을 얼굴·글자 묶음(K3-1)과 포즈 묶음(K3-2)으로 나눠 납품·검수한다.

> **작성 메모 (art-director, 2026-10-03)**
> - 저장 위치(메인 세션): `docs/art/briefs/boss-poses.md`. 사용: kit-artist K3가 `art/concept-kit/k-bosses1.js`, `k-bosses2.js`, `API-bosses1.md`, `API-bosses2.md`를 고칠 때 쓴다.
> - K3는 이 지시서와 함께 `docs/art/reviews/R4-faces.md`의 보스 처방도 맡는다(§2.6, §3, §4.2 A1~A3, §4.3 B1~B3, 출시 막음 '딩—'). 이 문서 §2가 그 처방을 사용자 결정(Q3·Q4·Q5)과 정정에 맞춰 다시 정리한 것이다. **R4-faces와 이 문서가 다르면 이 문서를 따른다.**
> - 문법은 이미 합격한 새 모듈과 맞췄다: `docs/art/briefs/bossesC.md` §1.3·§1.11과 그 정오, `art/concept-kit/API-bosses3.md`, `API-bosses4.md`.
> - 내 렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 이 문서에 쓴 렌더는 모두 `a2c-*.png`다. K3 렌더 이름은 `k3-`로, 수정 납품은 `k3f1-`로 시작한다.
> - 파일 표기는 저장소 기준 `경로:줄`이고, 줄 번호는 2026-10-03에 읽은 판 기준이다.

---

## 0. 요약

| 항목 | 내용 |
|---|---|
| 근거 | D-14, handoff §1.3(`docs/art/handoff-r4.md:44-47`). R4-faces 보스 처방. 사용자 결정 Q3(장식 글자도 기호로), Q4(전령 두건 광점 삭제), Q5(여제 눈은 먹 원판 + 종이 고리) |
| 담당 | kit-artist K3 |
| 쓸 파일 | `art/concept-kit/k-bosses1.js`(`PN.bossesA`), `art/concept-kit/k-bosses2.js`(`PN.bossesB`), `API-bosses1.md`, `API-bosses2.md`. 이 네 파일만 쓴다 |
| 일 | ① 얼굴·글자 묶음(§2): 기존 출력을 **의도적으로** 바꾼다. ② 포즈 묶음(§1·§3): 보스마다 `pose:'attack'` 1장 + `pose:'death'` 4장(`frame` 0~3). 기본 옵션 출력은 **한 글자도 바뀌면 안 된다** |
| 순서 | ① 얼굴·글자 → 지문 F1 기록 → ② 포즈 → 지문 F2 = F1 확인(§1.4) |
| 상태 수 | 보스마다 새 상태 = 공격 6장(페이즈 3 × 평상·광폭) + 처치 4장. 기존 12장(대기·준비 × 페이즈 3 × 평상·광폭)은 그대로 |
| 잠정 아트 | 바이블 §15(`docs/art/style-bible.md:345-370`). 최종 외곽선과 블랙 스팟은 사람이 긋는다 |
| 납품 | kit-artist 납품서 형식 + §5 수치. 메인 세션이 `docs/art/deliveries/K3-boss-poses.md`로 저장 |

### 0.1 확인한 사실 (코드·렌더로 확인)

**렌더러와 굽기**
- 보스 attack 프레임은 예고가 끝난 뒤 **0.25초** 보인다(`src/game/render/animation.ts:37`, `:144`).
- 잉크 도살자는 다르다. `patternPhase === 'dash'` 동안 계속 attack이다(`animation.ts:143`). 돌진 0.55초 동안 attack 그림이 화면을 가로질러 달린다(`src/game/GameEngine.ts:472-475`). 그래서 도살자의 attack은 "달리는 자세"여야 한다.
- attack 프레임이 없으면 같은 페이즈 idle을 쓴다(`src/game/render/worldRenderer.ts:1803-1807`).
- death는 4프레임을 6fps(0.67초)로 시체 자리에서 재생한다(`art/atlas-spec.mjs:105-106`, `worldRenderer.ts:1825-1850`). 그 아래에 벡터 얼룩이 같이 깔린다: 반경 = 54 × 1.4 = 75.6 월드, 세로 비 0.45(`worldRenderer.ts:1573-1591`).
- 굽기 상태 키: `phaseN`, `phaseN-windup`, `phaseN-attack`(+`-enraged`), `death/0~3`(`atlas-spec.mjs:118-166`, `src/game/render/assets/slots.ts:78-80`).
- 지금 bossesA·B는 idle·windup만 굽는다(`atlas-spec.mjs:119-120`). attack·death는 이 납품이 합격한 뒤 메인 세션이 등록한다(§7).

**이 6종은 P2·P3 무브가 실제로 돈다**
- `IMPLEMENTED_GRAMMARS`(`GameEngine.ts:484-489`)에 도살자·간수·입·여제·전령·천칭의 P2·P3 문법이 모두 있다. bossesC(중간 보스)와 다르다.
- 그래도 지금 준비 자세는 무브별이 아니라 보스당 하나다. 이번 attack도 보스당 하나로 그린다(§8 Q1).

**셀 크기 검사**
- 기존 72상태(6보스 × 12)는 모두 굽기 셀 안에 칠해진다(`a2c-cellmask-existing-A`, `a2c-cellmask-existing-B`).
- 셀 밖을 잡아내는지는 양성 대조로 확인했다(`a2c-cellmask-control`).
- getBBox는 셀 판정에 쓰지 못한다. 간수 대기의 getBBox x1이 425인데 셀 끝은 420이고 굽기는 통과한다(`a2c-bbox-existing`). 베지어 제어점 때문이다. 그래서 이 지시서는 **셀 마스크 검사**(§4 K3-C2)를 판정 기준으로 쓴다.

**지문 F0** (`a2c-fingerprint-baseline`, `a2c-tpl-fingerprint`)
- 호출 순서와 id 카운터가 달라도 같은 값이 나온다(`a2c-fingerprint-repeat`).
- 값: §1.4.

**글자** (`a2c-audit-template`)
- 오늘 출력 전체에 `<text>`가 **54개** 있다.
  - 도살자 art의 '정육점' 3자와 '肉'
  - 간수 art P2·P3의 '딩—'
- 도살자 game LOD의 간판 획은 "HOI"처럼 읽힌다(`a2c-butcher-sign-game2`, art는 `a2c-butcher-sign-art`). 아틀라스에 구워져 출시되는 그림이다.

**R4-faces 처방의 모순 3건** (§2에서 정정)
1. **B1 여제 눈.** 지시대로 "먹 원판 + 종이 고리 + 먹 동공"을 그리면 동공이 먹 위에 놓여 보이지 않는다(`a2c-empress-eye-mock`).
   - 고리 굵기 r×0.16(game 0.9~1.25 로컬)은 B1 자신의 합격 기준(1px = 2 로컬)에 못 미친다.
   - "크기 7.8/5.8 유지"는 bossesC 지시서가 반례로 든 "크기만 다른 정면 원 두 개"(`bossesC.md:454`)와 부딪친다.
2. **B3 천칭 눈.** 눈 중심이 접시 중심 −1이면 앞 테가 game에서 약 18%, art에서 약 4%만 가린다(계산). 합격 기준 20~30%에 못 미친다.
3. **A3 도살자.** "art는 유지, '肉'·'정육점'은 lettering 옵션 뒤로"는 사용자 결정 Q3(장식 글자도 기호로)로 대체됐다.

### 0.2 가정과 미확인
- (미확인) 이야기 패널 outro에서 쓰러진 통치자를 death 프레임으로 바꿀지는 메인 세션이 정한다(§8 Q3).
- (가정) 굽기 pad는 지금 값을 유지한다. 새 상태가 셀 검사를 통과하면 pad를 바꿀 필요가 없다.
- (미확인) 아틀라스 증가량은 보스당 10장 × 6 = 60장이다. 장 팩의 페이지 수는 메인 세션이 TEC-05 예산으로 확인한다(§8 Q2).

---

## 1. 공통 사양

### 1.1 작업 순서
1. **F0 확인.** 손대기 전에 K3-C1(지문)을 돌린다. 값이 §1.4의 F0와 다르면 누가 먼저 파일을 바꾼 것이니 멈추고 납품서에 적는다.
2. **얼굴·글자 묶음(§2).** 끝나면 K3-C1을 다시 돌려 **F1**로 기록한다.
   - 바뀌어야 하는 줄: 6보스의 art·game·sil/mono 줄, balance anchors 줄.
   - 바뀌면 안 되는 줄: `bossesA META`, empress·herald anchors 줄.
3. **포즈 묶음(§3).** 얼굴 함수는 §2에서 고친 것을 그대로 다시 쓴다. 포즈마다 새 얼굴을 그리지 않는다(§1.10).
4. **F2 확인.** K3-C1의 **모든 줄이 F1과 같아야** 한다. `bossesA anchors` 줄은 새로 생기므로 F1의 `none` 대신 값이 나온다. 이 줄은 F1과 비교하지 않는다.
5. 측정하고 API 문서를 쓴다.

> 권장(메인 세션 판단): 얼굴·글자 묶음을 K3-1로 먼저 납품·검수하고, 포즈를 K3-2로 나누면 검수 주기가 짧아진다. 한 번에 납품할 때도 납품서에 F0·F1·F2를 모두 적는다.

### 1.2 지켜야 할 것 (바꾸지 않는다)

| 항목 | `PN.bossesA` (butcher·gaoler·maw) | `PN.bossesB` (empress·herald·balance) |
|---|---|---|
| 로컬 박스 | 400 × 400 | 384 × 384 |
| pivot (판정 원 중심) | (200, 257), r 135 로컬 = 게임 r54 | (192, 252), r 108 로컬 = 게임 r54 |
| feet (굽기 앵커) | (200, 392) | (192, 360) |
| 게임 배율 | 0.4 (`lod:'game'`) | 0.5 (`detail:'game'`) |
| 방향 | 오른쪽(3/4). 반전은 호출부. 몸은 자전하지 않는다 | 같음 |
| 옵션 이름 | `lod`, `silhouette`, `halo`, `haloW`, `shadow`, `fx`, `seed` | `detail`, `mono`, `monoColor`, `halo`, `shadow`, `spin`, `hitbox` |
| 앵커 | `META[id]`(face·muzzle·head·fist/grip). **값과 키를 바꾸지 않는다** | `anchors(id, opts)`의 기존 키. 기존 옵션의 값은 F1과 같아야 한다 |
| 그 밖 | `telegraph`, `bullet`, `hitCircle`, `_baseDefs`, `mk`, `BUILD`의 호출 형식. 모르는 id는 지금처럼 오류를 던진다 | `fx.*`, `parts`, `anchorsOf`, `_` 도우미의 호출 형식. 모르는 id는 지금처럼 빈 `<g>` |
| 굽기 셀 (로컬, pad + 여백 포함) | butcher·gaoler x −20~420, y −170~480 / maw x −100~500, y −170~460 | empress x −76~460, y −96~430 / herald·balance x −76~480, y −96~430 |

- 셀은 `atlas-spec.mjs:78-83`의 pad와 `BAKE_MARGIN`(16px@2x = A 20 로컬, B 16 로컬)으로 계산했다.
- 새 상태는 **이 셀 안에서** 그린다. 판정은 K3-C2다.
- 좌표는 셀 끝에서 24 로컬 이상 안쪽을 목표로 잡는다.

### 1.3 호출 형식과 옵션 (bossesC §1.3과 같은 문법)

`PN.bossesA.draw(id, opts)`, `PN.bossesB.draw(id, opts)`에 다음 두 옵션을 더한다.

| opt | 기본 | 뜻 |
|---|---|---|
| `pose` | `'idle'` | `'idle'` \| `'attack'` \| `'death'`. 모르는 값은 `'idle'`. **`pose`가 없거나 `'idle'`이면 지금 출력과 한 글자도 다르지 않아야 한다** |
| `frame` | `0` | death 0~3. 정수로 자르고 0~3으로 묶는다. 3이 먹 웅덩이. 다른 pose에서는 무시 |

- `windup`은 `pose:'idle'`일 때만 뜻이 있다. `pose:'attack'`은 windup을 무시하고 '!'를 그리지 않는다.
- `pose:'death'`는 `phase`·`windup`·`enraged`를 무시하고 **P3 파손 상태에서 시작**한다. 산호·호박이 없다.
- attack은 `phase` 1~3의 파손 층과 `enraged`(먹 불꽃, 백열 눈, 산호 외곽 펄스)를 받는다.
- 기존 옵션은 그대로 받는다.
  - A: `lod`, `halo`, `silhouette`, `shadow`, `fx`
  - B: `detail`, `halo`, `mono`, `shadow`, `hitbox`, `spin`(attack은 받은 spin에 자기 회전을 더한다)
- 단색에서 빠지는 것
  - A: `silhouette:true`는 지금처럼 `ground`·`fx` 층을 뺀다. attack·death의 포즈 FX는 `fx` 층에 둔다.
  - B: `mono:true`는 `under`·`front`를 뺀다. 포즈 FX는 `front`, 지면 FX는 `under`에 둔다.

**앵커**
- `PN.bossesA.anchors(id, opts)`를 **새로 더한다**(추가만). 돌려주는 값은 다음과 같다.
  - `{ pivot:[200,257], feet:[200,392], r:135, head, face, muzzle }`
  - 보스별 추가 키: butcher `fist`, `cleaver`(날 중심), gaoler `grip`, `bow`(열쇠 활 중심), maw `fists:[왼,오]`
- 계산 규칙
  - 대기(`{}`)는 `META[id]`의 face·muzzle·head·fist/grip과 같은 값이다.
  - 준비는 실제로 그린 자리다. 예: butcher '!'는 `bang(300,64)`(`k-bosses1.js:344`)이므로 head = (300,64). 지금 META.butcher.head (270,46)와 다르다는 것을 API 문서에 적는다.
  - attack·death는 그 포즈를 그린 리그 값에서 계산한다. 따로 적은 상수를 쓰지 않는다.
- `PN.bossesB.anchorsOf[id](o)`는 `o.pose`·`o.frame`을 반영하도록 넓힌다. 기존 옵션의 값은 F1과 같아야 한다.
- 처치 프레임의 앵커
  - face는 그 프레임의 꺼진 눈 자리다. f3에서는 유물의 ✕ 중심이다.
  - head는 남은 덩어리 꼭대기 + 10 위다.
- `muzzle`은 attack에서 발사원이다(§3 표).

### 1.4 기존 출력 불변: 지문 F0 → F1 → F2

K3-C1(§4)은 기존 옵션 공간 전체를 해시한다.
- A: 페이즈 3 × windup × enraged × lod 2 × fx × halo × shadow, 그리고 silhouette
- B: 페이즈 3 × windup × enraged × detail 2 × halo × shadow·hitbox, 그리고 mono·anchors
- 호출 id(`bA<n>_`, `kb2_<n>_`)와 `seed="…"`는 정규화한다.
- bossesB art의 거친 필터 seed가 호출 번호 자릿수에 따라 바뀌는 기존 동작(`k-bosses2.js:865`)은 고치지 않는다. 이야기 패널 굽기 결과가 바뀌기 때문이다. 지문은 이 차이를 무시한다.

**F0 (2026-10-03, 오늘 코드)**

| 줄 | 값 | 줄 | 값 |
|---|---|---|---|
| butcher art | a55b1ff9 | empress art | 60f0a326 |
| butcher game | bf586d63 | empress game | 2979030a |
| butcher sil | 5e23b535 | empress mono | 591a5131 |
| gaoler art | abdf0827 | empress anchors | 915f9002 |
| gaoler game | c2b29ff1 | herald art | e4d16f87 |
| gaoler sil | 90584501 | herald game | 3a6efa3c |
| maw art | 2aea9ded | herald mono | 6971fed5 |
| maw game | 96577a02 | herald anchors | 15df39d0 |
| maw sil | 6cbfb696 | balance art | 6fdf915d |
| bossesA META | 01d09a8a | balance game | da66d59d |
| bossesA anchors | none | balance mono | 9d3cf897 |
| | | balance anchors | 229c1ad9 |

- **합격 조건:** F2의 모든 줄 = F1(`bossesA anchors` 제외).
- 구현 요령
  - 포즈는 `draw`의 앞머리에서 갈라 새 경로로 그린다.
  - 기존 BUILD/parts 안을 고칠 때는 `pose`가 idle일 때 같은 문자열이 나오게 한다. 숫자 반올림(`f()`), 속성 순서, defs 순서까지 같아야 한다.
  - idle 경로에서 `ctx()`/`mk()`를 한 번 더 부르면 안 된다. id 카운터는 정규화되지만, 습관적으로 피한다.

### 1.5 레이어

- **bossesA**: `ground`(바닥 접지 타원) → `body`(거친 먹선 필터, 광폭 rage 필터, 헤일로가 여기만 걸린다) → `fx`(포즈 FX, 광폭 불꽃·백열 눈, '!'). 구조는 `k-bosses1.js:136-150`.
- **bossesB**: `under` · `back`+`fig` · `holes` · `rims` · `over` · `solid` · `front`. 구조는 `k-bosses2.js:846-924`.

**광폭 펄스 (좁은 틈 규칙, bossesC 정오와 같다)**
- bossesB: 새 자세에서 생기는 닫힌 구멍과 폭 26 로컬 미만의 틈은 `solid`에 다각형으로 넣는다. 다리 사이처럼 넓게 열린 공간은 펄스를 허용한다.
- bossesA: `solid`가 없고 rage 필터가 body 알파 전체를 부풀린다(`k-bosses1.js:126`). 그래서 새 자세에서는 **닫힌 구멍과 폭 32 로컬(게임 13px) 미만의 틈을 만들지 않는다.**
  - 대상: 팔↔몸통, 소품↔몸, 사슬↔다리 사이.
  - 피할 수 없으면 그 틈 뒤에 먹(ink) 채움 다각형을 body 맨 뒤 층에 깔아 막는다.
  - 판정은 K3-C7 광폭 확대에서 틈 안쪽 산호 0이다.

### 1.6 색과 명도
- 토큰은 각 모듈의 `K` 그대로다. 굽기 `COLOR_MAP`이 구현값으로 바꾼다.
- **attack(평상): 산호 0, 호박 0.** 용광의 입의 호박 예열도 attack에서는 끈다.
- attack(광폭): 산호는 rage/pulse 필터의 flood 하나뿐이다(K3-C5에서 출력마다 1).
- **death: 산호 0, 호박 0.**
- 청록·자수정·연두는 0이다. 블러는 쓰지 않는다. 예외는 bossesA에 이미 있는 광폭 백열 눈 `glow`(바이블 §6-9 예외)를 같은 방식으로 쓰는 것뿐이다.
- 명도 순서는 얼굴(눈빛) > 종이 소품 > 재질 > 몸이다(바이블 §4.2). 포즈 FX의 종이 심은 paper300을 기본으로 한다. paper50 심은 얼굴에서 60 로컬 이상 떨어진 곳에만 쓴다.

### 1.7 공격 포즈 공통 규칙 (bossesC §1.4·§1.11과 같다)
- attack은 **기존 windup의 다음 박자**다. windup이 예비 동작이면 attack은 그 동작이 끝난 자세(팔로스루)다.
  - 같은 소품을 쓰고, 소품 길이는 대기와 같다. 손이 쥐는 자리만 옮길 수 있다.
- 48px 단색에서 attack은 idle·windup과 다르게 읽혀야 한다. 셋 중 하나 이상이 필요하다.
  - 소품 각도 20° 이상 차이
  - 몸 기울기 8° 이상 차이
  - 큰 돌출(소품·팔)이 40 로컬 이상 이동
- **포즈 FX**는 모양 단서다. 방향 단서가 아니다.
  - 소품에서 80 로컬(bossesA는 100) 이내로 짧게 그린다.
  - 먹·종이만 쓴다.
  - 사선 해칭을 쓰지 않는다(바이블 §6-5).
  - '!', 긁힘 데칼, 노력선, 점선 타격 호 같은 준비 자세 FX는 attack에 없다.
- 얼굴은 attack에서도 가려지지 않는다. 소품·팔·FX가 얼굴 테 안으로 들어오면 안 된다.

### 1.8 처치 4장 공통 규칙

| 프레임 | 내용 |
|---|---|
| f0 피격 | 눈빛이 꺼진다. 종이 눈은 먹, 종이 고리는 ink300. 얼굴 판이 깨지고, 소품이 손에서 미끄러진다. 실루엣은 대기와 비슷하게 둔다 |
| f1 무너짐 | 키가 대기의 약 70%(±8%)다. 소품이 떨어지고 머리 장식이 기운다 |
| f2 녹아내림 | 키 약 40%(±8%). 먹이 아래로 흐른다. art에는 원고 종이 조각 2~3개를 둔다(v1.0 §10.4) |
| f3 먹 웅덩이 | 아래 표의 타원. ink700 젖은 면 + ink 테. art에는 ink300 비백 조각. **얼굴 유물 하나**를 웅덩이에 눕히고 그 눈을 종이 ✕(먹테)로 바꾼다(적 데칼 ✕✕ 문법) |

| | bossesA | bossesB (bossesC 정오값과 같다) |
|---|---|---|
| f3 웅덩이 | 중심 (200, 370), rx 165(±10), ry 36(±4) = 월드 66 × 14.4, 발에서 9 위 | 중심 (192, 342), rx 132(±10), ry 29(±3) = 월드 66 × 14.5 |
| f3 높이 제한 | y 317 위로 솟는 것 없음. 누운 소품 끝만 y 280까지 | y 300 위로 솟는 것 없음. 누운 소품 끝만 y 270까지 |

- 웅덩이는 렌더러의 벡터 얼룩(반경 75.6 × 34 월드)보다 작아야 한다. 프레임이 끝날 때 줄어 보이지 않게 하려는 것이다.
- **유물은 그 보스의 얼굴 함수를 그대로 부르고**, 그 묶음에 눕히는 변환(세로 ×0.4 + 이동·회전)만 건다. 새 얼굴을 그리지 않는다.
  - ✕ 팔 길이: game ≥ 6 로컬, art ≥ 4
  - ✕ 먹테: game 3.6 / art 2
- 처치 프레임에는 '!'·광폭 불꽃·산호·호박이 없다. 날아가는 파편은 bossesA `fx`, bossesB `front`에 둔다.

### 1.9 그릴 수 있는 범위
- §1.2 셀 안에 칠해진 픽셀만 있어야 한다. 판정은 K3-C2이고, `nothing painted`가 합격이다.
- 이 지시서의 좌표는 모두 셀 안에서 계산했다. 두 자세는 오버레이로 확인했다(§3.1, §3.2). 납품에서 좌표를 ±8 로컬까지 바꾸는 것은 자유다.
- 셀 검사에 걸리면 좌표를 안으로 당긴다. pad를 늘리는 쪽으로 해결하지 않는다. 꼭 필요하면 납품서에 필요한 pad를 적는다.

### 1.10 포즈 속 얼굴 규칙 (입체파 얼굴을 피하는 법)
1. **얼굴은 지금 각도 하나다.** 포즈는 얼굴 묶음 전체에 이동·회전만 건다. 새 가로 압축(scale)이나 다른 각도의 눈을 붙이지 않는다.
   - 도살자 봉투: 3/4
   - 간수 범종: 8° 기울기
   - 입 화구: 정면
   - 여제 로켓: 정면 판
   - 전령 문자판: 종구 평면 0.69
   - 천칭 일식 눈: 접시 위에 선 원
2. **얼굴 함수에 상태 인자를 둔다:** `open` | `out` | `dead`. 대기·준비·공격은 `open`, f0~f2는 `out`, f3 유물은 `dead`(✕). 모든 포즈가 같은 함수를 부른다.
3. 두 눈이 있는 얼굴(입, 여제)은 두 눈이 같은 평면·같은 기울기 안에 있다. 동공·눈빛은 둘 다 플레이어 쪽(+x)을 본다.
4. 그림자는 덩어리 하나 + 액센트 하나다. 두 눈을 가로지르는 수평 띠와 직선 다각형 그림자는 쓰지 않는다(bossesC §1.10-4).

### 1.11 반복된 실수를 미리 막는 규칙
- **가짜 눈 금지.** 얼굴 밖에 "원 + 가운데 점", "고리 + 원판", "점 두 개 나란히"를 새로 두지 않는다. 특히 조심할 곳:
  - 전령 빈 톱니 소켓: 동심원 금지 → 톱니 이가 빠진 홈으로 그린다
  - 리벳 여러 개
  - ✦ 반짝임 옆의 점
  - 처치 파편 점 두 개
- **글자처럼 읽히는 기호 금지.** 나란한 가로 획 셋(三), ✕ 여러 개 줄짓기(XXX), V·Λ 줄짓기, # 격자, + 자, 'HOI' 같은 직선 획 묶음을 쓰지 않는다. 속도선과 음파는 길이·각도가 서로 다르게 긋는다.
- **좁은 틈의 광폭 펄스 금지**(§1.5).
- **범위 초과 금지**(§1.9). 셀 검사로 확인한다.
- **지시 값끼리 모순될 때**는 구조 규칙(§1.2, §1.10)과 합격 기준을 좌표보다 앞에 둔다. 무엇을 바꿨는지 납품서에 적는다.

---

## 2. 얼굴·글자 묶음 (R4-faces 처방, 사용자 결정 반영, 정정 포함)

모두 기존 출력을 바꾸는 일이다(의도). 각 항목의 "지킬 것"은 바꾸지 않는다.

### 2.1 `k-bosses1.js` · bossesA

**F-A1 종탑 간수 초점 정리 + '딩—'** (출시 막음 포함)

| 바꿀 곳 | 바꿀 내용 |
|---|---|
| `gaolerChime` `<text>`(`:479`) | **삭제.** 소리 호 2줄은 유지한다. outro-1 이야기 패널에 나오는 막음 항목이다 |
| 물고기(`:477`) | game은 `K.ink300` 평면. art는 `K.paper300` + `X.ht(fish,'d40')` |
| 물고기 눈 원·아가미 획(`:478`) | art에서만 ink300으로 남긴다 |
| 종이학(`:455-458`) | game은 ink300 평면, art는 paper300 + d40 |
| 영혼 눈 ellipse 2개(`:532`) | 모든 페이즈에서 삭제한다 |
| 유곽 game(`:375`) | 원을 뺀다. 칸(평행사변형)을 대각선으로 나눠 아래·오른쪽 삼각형만 ink500으로 칠한다 |

- **지킬 것:** META.gaoler 전부, 열쇠구멍 medal(`:402-412`)의 모양과 눈 (226.5,128), 박스·피벗·발·r·gameScale, 12상태, 48px 실루엣.
- **합격**
  - phase 1, 0.4배·0.8배에서 paper50 요소는 열쇠구멍 눈과 그 아래 빛 조각 3개뿐이다(준비 '!' 제외. P2·P3 종이 균열은 페이즈 표식이라 예외).
  - 유곽 칸에 원이 없다. P3 영혼에 눈이 없다. art P2·P3에 `<text>`가 0이다.

**F-A2 용광의 입 눈** (R4 값을 계산으로 검증했다)
- `eye()`·동공(`:716-717`)
  - 왼눈: `eye(186,244,13.5,8.6,1)` + 동공 (191.5,242.6) r4
  - 오른눈: `eye(227,244,10.4,6.2,-1)` + 동공 (231.5,242.4) r3.2
  - 두 동공 모두 +x쪽 윗꺼풀에 닿는다(계산: 윗꺼풀 y 239.9 / 239.1).
- 광폭 glow(`:730`): (186,244)와 (227,244)로 옮긴다.
- (권장) 잉걸불 점(`:720`): paper300 → ink300.
- **지킬 것:** META.maw.face (206,244).

**F-A3 잉크 도살자 봉투 + 글자 (Q3 반영)**
- game만 바꾸는 것(`X.game`)
  - 꿰맨 X: 5개 → 3개(간격 12.6, 크기 ±5.2, 선 2.6). `:311-312`
  - 먹물: `drip(266,160,20,5)`, `drip(282,163,13,4.2)`. `:310`
  - 주름 획(`:306`) 생략
  - 봉투 아래 d20 띠(`:303`)는 paper300 평면
- art·game 공통 (Q3: 장식 글자도 기호로)
  - **도장 원과 '肉'(`:307`)을 삭제**한다. 원 안 원은 가짜 눈이 되므로 기호로도 남기지 않는다.
  - **간판 글자를 그림 기호로 바꾼다:** art `<text>` '정육점'과 game 직선 획(`:191`) 모두.
- 간판 기호: **걸린 고깃덩이 하나**. 간판 틀 안(칼 프레임 x −21~17, y 28~96)에 그린다.
  - 갈고리 한 획: (−2,32) → (−2,40), 끝을 오른쪽으로 말아 올린다.
  - 아래로 넓어지는 물방울꼴 먹 덩이: 폭 최대 26, y 40~84, 아래는 둥글다.
  - 위에 짧은 뼈 끝: 폭 6, 길이 10, 둥근 막대. 원 끝 금지.
  - art: 그 안에 곡선 paper300 지방 결 2줄. game: 지방 결 1줄, 폭 ≥ 3.6.
  - 직선 획 묶음, 원 + 점은 쓰지 않는다.
- **지킬 것:** META.butcher 전부(face (271,150)), 칼 프레임과 날 모양, 리벳, 균열(P2), 눈구멍, P3 반파.
- **합격**
  - `<text>` 0
  - 간판이 4배 확대와 1x에서 글자·숫자로 읽히지 않는다
  - 0.4배에서 눈구멍(흰 눈), 꿰맨 입(X 3), 먹물 2방울이 따로 보이고 큰 점 무늬가 없다

### 2.2 `k-bosses2.js` · bossesB

**F-B1 걸쇠 여제 얼굴 — R4 B1 정정판 (Q5 "먹 원판 + 종이 고리" 유지)**

- 정정 이유: §0.1. 이 처방은 시험 렌더로 확인했다(`a2c-empress-eye-mock3`, 최종 `a2c-empress-eye-final`).
- 모두 머리 템플릿 좌표다(`rotate(9 190 132)`을 걸기 전, `:300-335`).

| 요소 | 값 |
|---|---|
| 두 눈 | **같은 크기, 같은 높이.** 중심 (185,99)와 (201,99). 지금 (185,97)/(203,103), 7.8/5.8은 "크기만 다른 정면 원 두 개"라 고친다 |
| 눈 모양 | 먹 타원 rx 6.0·ry 4.6(game) / rx 5.8·ry 4.4(art) |
| 종이 고리 | 같은 중심에서 (0, +0.08ry) 내린 타원, 크기 ×0.6, paper50 획. 굵기 game 2.0(1px) / art 1.4. 눈 모양으로 clip |
| 윗눈꺼풀 | 눈 clip 안의 먹 뚜껑. 아래 경계는 눈 중심 −0.15ry를 지나는 기울어진 직선. 얼굴 안쪽(코 쪽)이 0.35ry 낮고 바깥이 0.35ry 높다. 엄한 반쯤 감은 눈이다 |
| 동공·하이라이트 | 따로 그리지 않는다. 고리 안 먹이 동공이다. **흰 점 0** |
| 광폭 | 지금 `eyeBubble(...hot)`(`:320`)을 새 두 중심에 같은 크기로 쓴다 |
| 눈물(`:327`) | 왼눈 바깥 아래 (180.5,104)에서 시작, 길이 ≤ 12, 뿌리 폭 2(game 2.4) 'end', 끝 방울 r 1.6(game 2.0). 얼굴 정중선(x 193)에서 8 이상 떨어진다 |
| 얼굴 쐐기(`:318`) | game은 `K.paper300` 평면(망점 금지). art는 그대로 |
| 기포(`:325-326`) | game의 기포 고리(182,81) r3는 **삭제**한다. 눈 고리와 같은 도형이라 세 번째 눈이 된다. art 기포 3개는 눈에서 4 이상 떨어지면 유지 |

- **지킬 것:** `anchorsOf.empress`의 face [197,101]·faceRim, 베젤 `:315`, 상자·피벗·발·r, mono.
- **합격**
  - 1x(`--scale 0.5`): 두 눈이 같은 크기다. 각 눈에 종이 고리가 1px 이상 보이고 흰 점이 0이다.
  - 8배: 눈선이 얼굴 축에 수직이다(머리 좌표 |Δy| ≤ 0.5).
  - 초상(K3-C9): 반쯤 감은 엄한 눈으로 읽힌다.

**F-B2 톱니 전령 (Q4 반영)**
- `:457` `scale(0.84,1)` → `scale(0.69,1)`: 문자판 r17 → 11.7×17. 목구멍 22×33 안에 들어간다.
- 두건 광점 `:546-547`: 정상·광폭 **모두 삭제**(사용자 결정 Q4).
- `hoodEyes` 키는 남기고 API에 "미사용"으로 적는다.
- **합격:** 문자판 타원 비율 = 종구 비율(0.69±0.03). 두건 안 종이 요소 0. face 앵커 불변.

**F-B3 공백 천칭 — R4 B3 정정판**

| 바꿀 곳 | 바꿀 내용 |
|---|---|
| 눈(`:720-721`) | `scale(1,0.8)` → 없앤다(원으로 세운다). 눈 중심 = (panR.x − 6, panR.y **+ 3**). 지금은 −1 |
| 앞 테 반호 | 눈 **위에** 다시 그린다: 먹, 굵기 game 9 / art 7. 가림 비율(계산): game 약 31%, art 약 25% |
| 일식 코어 | `eyeEclipse`에 코어 오프셋 인자를 둔다. 천칭만 x + r×0.22(지금 0.1, `:156`). 코어 왼쪽 paper50 호(`:157`)는 코어를 옮기면 종이 위에서 보이지 않는 선이 되므로 지운다 |
| 가슴 브로치(`:697`) | 고리 없는 납작한 사각 걸쇠(ink700 + ink300 테)로 바꾼다 |
| 저울대 축(`:711`) | 속 고리 없는 ink500 마개로 바꾼다. R4는 권장이었지만 bossesC §1.7의 가짜 눈 규칙으로 **필수**로 올린다 |

- `anchorsOf.balance.face`를 새 눈 중심으로 고친다: 대기 [342,159](지금 [342,155]), 준비도 같은 식.
- **지킬 것:** 투명 컷 5곳과 P3 2곳, 머리 공백, 저울대·접시 기하, mono 실루엣.
- **합격:** 눈 비율 1.0이고 아래 20~30%가 접시 앞 테에 가린다. 가슴·저울대에 고리 + 원판 도형이 없다. 48px mono가 그대로다.

### 2.3 API 문서
- 두 문서 모두 "concept/work 원본을 이어 붙인 사본이니 손으로 고치지 않는다"는 문구가 있다(`API-bosses1.md:30`, `API-bosses2.md:19`). 외주 체계와 맞지 않는다.
- 다음처럼 바꾼다: "rev 3(K3, 2026-10): 킷 사본을 직접 고쳤다. concept/work 원본은 이 판보다 오래됐다."
- 바뀐 game LOD 규칙, 글자 기호화, 눈 규칙을 적는다.

---

## 3. 보스별 attack·death

좌표는 각 모듈의 로컬 박스 기준이다. ±8 로컬 조정 허용. 숫자 중 "≈"는 다른 값에서 계산한 결과이며, 렌더로 맞춘다.

### 3.1 잉크 도살자 `butcher` (s1-mid-dash · 돌진 · P2 추적 2연 · P3 교차 3연)

**칭호와 형태:** 골목의 푸주한. 준비 자세에서 식칼을 끌다가, 돌진하는 동안 **식칼을 머리 위로 치켜든 채 달린다.** 돌진 0.55초 내내 이 그림이 보인다(§0.1).
- 리그 시험: `a2c-butcher-attack-geom`. 식칼과 몸 기울기가 셀 안에 들어가고 얼굴이 가려지지 않는다.

| 부분 | attack 값 (준비 자세 비교) |
|---|---|
| 상체 그룹 UP(torso·strap·먼 팔·deltF·apron·head·deltN) | `translate(0,8) rotate(15 200 320)`. 준비는 translate(10,18) rotate(11). 덜 웅크리고 더 앞으로 기운다. 혹 꼭대기 ≈ (268,67), 몸통 앞 ≈ x 384 |
| 머리 headT (UP 안) | `rotate(-2 262 206) translate(4,0)`. 봉투 눈(face) ≈ (315,182) |
| 먼 팔 farT (UP 안) | `rotate(22 92 150)`. 갈고리가 뒤(왼쪽)로 휘날린다. 갈고리 끝 x ≥ 12 |
| 가까운 팔 (UP 밖, 맨 앞) | 어깨 ≈ (362,200) → 팔꿈치 (366,128) → 주먹 (336,74). limb 반지름은 대기와 같다 |
| 식칼 | `translate(336,74) rotate(160)`. 날 끝 모서리 ≈ (272,−18)·(326,−37), 손잡이 고리 ≈ (356,130). **가장 높은 점이 식칼**이다 |
| 다리 | 뒷다리는 엉덩이 (170,300) → 무릎 (128,346) → 발목 (96,372). 나막신은 앞코가 땅(70,392)에 닿고 뒤꿈치가 약 25° 들린다. 앞다리는 준비 자세의 legFw/bootFw(`:183-184`)를 그대로 쓴다 |
| ground | 앞발 아래 (300,393) rx 70 ry 6 α0.5 + 뒷발 앞코 아래 작은 타원 |
| FX (fx) | 뒤쪽 속도선 3획: x 8~74, y 170~300, 'start' 테이퍼 먹. 서로 15° 이상 벌어지고 길이가 다르다(三 금지). 뒷발 앞코에서 먹 튐 2~3방울(지름 ≤ 8) |
| 페이즈·광폭 | P2 앞치마 찢김·칼 균열, P3 봉투 반파가 그대로 얹힌다. 광폭 김(`:337-340`)은 attack의 UP·headT 변환을 따라간다 |
| 틈 | 치켜든 팔과 머리 사이, 두 다리 사이에 폭 32 미만 틈이 생기면 먹 채움으로 막는다(§1.5) |

- 48px: 식칼이 머리 위로 솟은 유일한 자세다. idle은 칼이 오른쪽 아래, windup은 칼이 왼쪽 아래다.
- 앵커: `muzzle` = 날 중심 ≈ (304,8), `fist` = (336,74), `head` = 식칼 끝 위 ≈ (300,−50), `face` ≈ (315,182).

**처치**

| f | 내용 |
|---|---|
| f0 | 봉투 눈(P3의 큰 눈 포함)이 먹으로 꺼지고 먹물만 남는다. 상체가 뒤로 젖혀진다(UP `rotate(-7 200 320)`). 식칼이 손에서 빠진다(칼 프레임 +25°, 주먹이 펴짐). 갈고리 사슬이 출렁인다 |
| f1 | 무릎을 꿇는다(두 무릎 y ≈ 370). 혹 꼭대기 y ≈ 154(±15). 봉투 머리가 앞으로 18° 처진다. 식칼은 앞 바닥에 눕는다: 날이 y 376~392, x 250~358 |
| f2 | 녹는 먹 언덕(꼭대기 y ≈ 256, x 90~330), 방울이 흐른다. 봉투는 오른쪽 위에서 구겨진 종이로 미끄러진다. art 종이 조각 3 |
| f3 | 웅덩이 (200,370) rx 165 ry 36. 납작하게 구겨진 봉투 유물 (232,364) 약 64×22, 눈구멍 = 종이 ✕, 꿰맨 입 선 하나. 식칼은 웅덩이 왼쪽 가장자리에 눕는다((90,380)→(176,372), 간판 기호가 보인다). 갈고리 하나 |

### 3.2 종탑 간수 `gaoler` (s1-final-rings · 링 22발 · P2 틈 링 · P3 수축 링 벽)

**형태:** 울리지 않는 종의 간수. 준비 자세의 점선 타격 호가 가리키는 대로(`:557`, 끝 ≈ (252,26)), 열쇠를 수직으로 내리꽂아 **활이 범종 꼭대기 음통을 친다.** 종이 울려 풍경 셋이 모두 튀고, 담묵 파문이 퍼진다.
- 리그 시험: `a2c-gaoler-attack-geom`. 열쇠 활이 음통에 닿고, 비트는 땅에 닿으며, 열쇠구멍 눈에서 약 35 떨어진다.

| 부분 | attack 값 |
|---|---|
| 범종 | `rotate(8 200 190)` 그대로. face (235,132) = META |
| 열쇠 + 장갑 | `translate(287,242) rotate(-3)`(대기 grip (286,248) rotate(19), 준비 (318,150) rotate(−8)). 활 중심 ≈ (275,10), 꼭지 ≈ (272,−38), 자루 끝 ≈ (295,392), 비트 바깥 모서리 ≈ (342,381). 활 고리가 음통 오른쪽 위(≈ (259,29))에 닿는다. 닿지 않으면 grip x를 −4까지 옮긴다 |
| 가까운 팔뚝 | limb (352,206) → (300,240), 반지름 18→15. 기와 망토 앞 |
| 풍경 3 | 왼쪽 (52,134) sw +24, 오른쪽 (348,134) sw −24, 앞 (98,226) sw +16. 세 개 모두 `loud`(소리 호, 글자 없음, F-A1). 오른쪽 물고기 꼬리 x ≤ 396 |
| 등롱 | 등롱 묶음 `rotate(-20 46 256)`. 앞으로 흔들린다 |
| FX (fx) | 담묵(ink300) 파문 호: 중심 (200,150), 반지름 150·176, 왼쪽 160°~200°, 오른쪽 −20°~20°, 굵기 3.4/2.4(×LW). 음통 접점 (262,24)에 먹 충격 별: 4갈래 테이퍼, 폭 ≤ 26, 심은 **paper300**(paper50은 눈만). 범종 양 옆구리에 짧은 진동선 ink300 1줄씩 |
| 광폭 | 등롱 흑염, 백열 눈(`:556`) 그대로 |
| 틈 | 열쇠 자루↔범종·망토 사이 틈이 32 미만이면 자루 뒤 ink300 gap 획(`:422`)을 넓혀 막는다 |

- 48px: 수직 열쇠가 범종 바로 옆에 있다(활 y 10). 풍경 셋이 바깥으로 튀고 등롱이 앞으로 흔들린다. idle의 열쇠는 사선, windup은 활이 y −80까지 솟는다.
- 앵커: `muzzle` = (210,121)(종, 그대로), `grip` = (287,242), `bow` ≈ (275,10), `head` ≈ (272,−50).

**처치**

| f | 내용 |
|---|---|
| f0 | 열쇠구멍 눈과 빛 조각 3이 꺼진다(먹). 범종을 위에서 테까지 가르는 굵은 종이 균열 + 두 번째 이 빠짐. 장갑 손가락이 펴지지만 열쇠는 대기 자리에 서 있다(돌리면 셀 밖이나 얼굴 위로 간다). 등롱이 바닥 (46,360)에 떨어져 기운다 |
| f1 | 망토·외투가 주저앉는다(종 꼭대기 y ≈ 126). 범종이 −25° 왼쪽으로 기운다. 열쇠가 손에서 빠져 비트를 (300,392)에 둔 채 왼쪽으로 35° 기울어 넘어가는 중이다. 활 ≈ (81,79). 자루가 열쇠구멍 왼쪽으로 지나가야 한다(y 132에서 x ≈ 118) |
| f2 | 범종이 녹는 언덕(꼭대기 y ≈ 240) 위에 옆으로 눕는다. 철창 문이 떨어진다. art 종이 조각 3 |
| f3 | 웅덩이 (200,370) rx 165 ry 36. 옆으로 누워 반쯤 잠긴 범종: 당좌가 위를 보고, 열쇠구멍 눈 = 종이 ✕. 열쇠는 웅덩이 앞을 비스듬히 가로질러 대부분 잠긴다(누운 소품 끝 ≤ y 280). 풍경 하나 |

### 3.3 용광의 입 `maw` (s2-final-flame · 자기 자리 화염 · P2 순차 화염 통로 · P3 방사 붕괴 + 순간이동)

**형태:** 봉헌을 삼키는 화덕. 들고 있던 오른팔을 내리찍어 **두 주먹으로 땅을 짚고** 화구로 검은 불을 토한다. 화염 지대는 자기 발밑에 생긴다.

| 부분 | attack 값 |
|---|---|
| 왼팔 | 그대로 |
| 오른팔 | 위 파이프 (284,204)→(350,250)은 대기와 같다. 아래 파이프 (350,252)→(352,340)(곧게 아래). 손목 칼라 (352,338) rx 20 ry 9. 주먹은 `mawFist(X, 352, 368, 1, true, 1)`로 땅에 짚는다 |
| 화구(입) | 아래 이빨 줄 `translate(0,8)`(입이 더 벌어짐). 호박 예열·잉걸 바닥을 끈다. 화구 바닥(y 310)에서 검은 불꽃 3개(x 176·206·236, 높이 ≤ 30, 폭 16~20, paper50 심 ≤ 3)가 오르되 눈(y 244)에 닿지 않는다(꼭대기 ≥ y 280) |
| 눈 | F-A2 자리에서 높이 ×0.7로 가늘게 뜬다(왼 h 6.0, 오른 h 4.3). 동공은 +x쪽 윗꺼풀에 닿는다(동공 y = 눈 중심 y − 0.3h) |
| FX (fx) | 바닥 앞 검은 불꽃 5개: x 130·170·206·242·282, 밑 y 390, 높이 34/46/56/46/34, 폭 20~26, paper50 심. 화염 지대가 생기는 모양 단서다. 그을음은 `mawSoot(X, true)` |
| 광폭 | 파이프 5 + 입 불꽃, 백열 눈 glow 좌표 = F-A2 |

- 48px: 두 주먹이 모두 땅에 있다(idle·windup은 오른 주먹이 y 324에 매달린다). windup은 idle과 단색에서 같은 모양이라(`a2c-lineup48-existing`) attack이 이 보스의 유일한 동작 실루엣이다.
- 앵커: `muzzle` = (206,290), `fists` = [[58,368],[352,368]], `face` = (206,244).

**처치**

| f | 내용 |
|---|---|
| f0 | 두 눈이 먹으로 꺼진다. 쇠창살 이빨 2~3개가 부러지고 그을음이 멈춘다. 대신 ink300 가는 연기 2줄. 오른팔이 아래로 처진다 |
| f1 | 다리가 꺾여 몸이 주저앉고(꼭대기 y ≈ 126) 왼쪽으로 8° 기운다. 파이프 2개가 부러져 기운다. 쐐기돌이 떨어진다 |
| f2 | 무쇠 판이 쌓인 먹 언덕(꼭대기 y ≈ 240). 파이프가 눕는다. art 종이 조각 3 |
| f3 | 웅덩이 (200,370) rx 165 ry 36. 위를 보고 누운 뾰족 아치 화구 틀(세로 ×0.4), 그 안의 두 눈 = 종이 ✕✕. 파이프 하나가 가로놓이고 리벳 3개가 흩어진다(나란한 두 점 금지) |

### 3.4 걸쇠 여제 `empress` (s3-final-traps · 덫 3 · P2 엇갈린 격자 · P3 닫히는 감옥 칸)

**형태:** 흐름을 가둔 여제. 준비 자세에서 열린 걸쇠와 치켜든 열쇠를 이어 받아 **열쇠를 앞으로 꽂아 돌린다(잠금).** 걸쇠 3개가 탁 닫히고 새장 치마가 조여진다.

| 부분 | attack 값 |
|---|---|
| 머리 | `rotate(14 190 132)`(대기 9). 잠금 쪽으로 숙인다. face ≈ (200,103) |
| 가까운 팔 | `na = { s:[224,164], e:[262,176], w:[300,170] }`. 팔뚝이 거의 수평으로 앞으로 나간다. palm·pin은 기존 식(`:386-387`)을 쓴다. pin ≈ (322,154) |
| 열쇠 | `E.key(X, pin.x+1, pin.y+6, -90, g?1.35:1.2)`: 수평, 플레이어 쪽. 끝 x ≈ 393(≤ 420), 비트가 위로 선다 |
| 먼 팔 | `fa = { s:[160,170], e:[118,238], w:[84,300] }`. 갈고리 손은 아래(약 100°)를 향하고 spread 8, len 38, lens [0.6,0.75,0.75,0.6]으로 오므려 땅(y 345~355)을 움켜쥔다 |
| 치마 | 고리 반폭 ×0.94(조임). 걸쇠 사이 사슬은 처짐 13 → 4로 팽팽하다. 걸쇠는 닫힘(W false) |
| FX | front: 고리 2의 걸쇠 3개(`E.ringPt(2, -70/-14/42)` + (10,−8)) 옆에 먹 ✦ 3개(4갈래 테이퍼, 폭 ≤ 12, 종이 심 없음) = **3** 덫 단서. under: 먼 손 접지점에서 좌우로 바닥에 누운 짧은 사슬 2토막(각 ≤ 50, 먹 + ink300 고리). 격자 선·# 금지 |
| solid | 앞으로 뻗은 팔·열쇠와 부채 칼라·머리 사이, 먼 팔과 치마 사이 틈 |
| 광폭 | 관·부채 끝 불꽃, `eyeBubble` hot(F-B1) |

- 48px: 가슴 높이에서 앞으로 뻗은 팔과 수평 열쇠(x ≈ 393까지)가 보인다. idle은 열쇠가 매달려 있고, windup은 머리 위에 있다.
- 앵커: `muzzle` = [198,290](그대로), `key` = 열쇠 중심, `hands` = [가까운, 먼].

**처치**

| f | 내용 |
|---|---|
| f0 | 로켓 유리를 가로지르는 종이 균열(이번에는 눈 사이를 지나도 된다). 두 눈이 꺼진다(고리 → ink300). 열쇠가 손에서 떨어지는 중이다. 걸쇠가 모두 터져 열린다(W true 그림) |
| f1 | 새장 치마가 구겨지고 고리가 내려앉는다(꼭대기 y ≈ 129). 보디스가 치마 속으로 가라앉고, 머리가 −20° 왼쪽으로 넘어간다. 먼 갈고리 손이 바닥에 떨어진다 |
| f2 | 굽은 창살과 사슬 더미가 녹는다(꼭대기 y ≈ 228). 로켓 머리가 위에 얹히고 뚜껑이 매달린다. art 종이 조각 3 |
| f3 | 웅덩이 (192,342) rx 132 ry 29. 위를 보고 누운 로켓(얼굴 유리 세로 ×0.4), 두 눈 = 종이 ✕✕. 열린 뚜껑이 옆에 있다. 걸쇠 3개와 마스터 열쇠, 굽은 창살 끝(≤ y 270) |

### 3.5 톱니 전령 `herald` (s4-final-saw · 톱니 4 · P2 역회전 궤도 · P3 낙하 레인)

**형태:** 멈춤을 알리는 전령. 치켜든 나팔을 **정면으로 내려 불고, 후광의 톱니가 모두 떨어져 날아간다.**

| 부분 | attack 값 |
|---|---|
| 나팔 | `ang = 2`(대기 26, 준비 −38). 종구 중심 ≈ (330,118). 문자판(F-B2)이 플레이어를 본다 |
| 가까운 팔 | `sh (232,160)`, `el (252,172)`, grip은 기존 식 ≈ (273.8,120.0) |
| 후광 | 톱니 소켓 4곳(−150°, −90°, −30°, 160°)이 빈다. **빈 소켓은 동심원으로 그리지 않는다.** 톱니 이 3개가 빠진 들쭉날쭉한 먹 홈 + 볼트 막대 하나로 그린다. P2·P3에서는 페이즈 표식 소켓(−30°, `:492-497`)을 지금 그림 그대로 둔다 |
| FX (front) | 날아가는 톱니: 각 각도에서 반지름 108(중심 ≈ (96.5,64), (190,10), (283.5,64), (88.5,155)), `H.saw` r19, 회전 spin+40. 각각 소켓 쪽으로 짧은 먹 속도선 2~3(≤ 30, 길이·각도 다르게). **P1은 4개, P2·P3은 3개**(빈 표식 소켓 제외). 종구 앞 음파: 중심 (330,118), 반지름 46/60/74, −32°~32°, 굵기 3.6/2.8/2.0(×li), 테이퍼 |
| 바퀴·후광 회전 | `spin + 30` |
| 먼 팔·두루마리 | `fa = { s:[156,162], e:[128,198], w:[118,234] }`, 두루마리 rot −14 |
| solid | 기존(바퀴·후광) + 새 틈 |
| 광폭 | 후광 불꽃 7, 종구 불꽃, 백열 문자판 |

- 48px: 수평 나팔 + 톱니 혹이 없는 후광. idle은 나팔이 오른쪽 아래, windup은 위다.
- 앵커: `muzzle` = halo.c [190,118], `face` = 종구 문자판 중심 ≈ (330,118), `saws` = 날아가는 톱니 중심들.

**처치**

| f | 내용 |
|---|---|
| f0 | 문자판 유리가 깨진다. 바늘이 6시 반으로 떨어지고 종이 면이 ink300으로 꺼진다. 나팔이 처진다(ang +55). 후광에 종이 균열, 톱니 하나가 떨어진다. 바퀴가 멈춘다 |
| f1 | 외바퀴가 옆으로 쓰러지며 몸이 −30° 왼쪽으로 기운다(꼭대기 y ≈ 129). 후광이 기울고 나팔이 땅에 닿는다 |
| f2 | 쓰러진 바퀴(납작한 타원) 위로 몸이 녹아 덮인다(꼭대기 y ≈ 228). 후광 고리가 뒤로 주저앉는다. 두루마리가 바닥에 펼쳐진다(글자 없이 먹 줄만). art 종이 조각 3 |
| f3 | 웅덩이 (192,342) rx 132 ry 29. 종구가 위를 보고 누운 나팔(문자판 세로 ×0.4, 눈 = 종이 ✕). 반쯤 잠긴 후광 톱니 고리 호(≤ y 270), 누운 톱니 2개 |

### 3.6 공백 천칭 `balance` (s5-final-null · null 지대 + 16발 · P2 짝 지대 · P3 수축하는 안전 공백)

**형태:** 원고를 다는 천칭. 준비 자세의 기울기(+13°, 먹 접시가 아래)에서 **판결이 떨어지듯 반대로 −16°까지 넘어간다.** 공백 접시가 내려앉고 먹 접시(눈)가 올라간다.

| 부분 | attack 값 |
|---|---|
| 저울대 | `tilt = -16`: endL ≈ (136.2,69.8), endR ≈ (343.8,10.2), panL ≈ (136.2,185.8), panR ≈ (343.8,126.2). 공백 접시 구멍(`holes`)·테·사슬(`over`)·solid 부채가 모두 따라간다 |
| 일식 눈 | F-B3 규칙(panR + (−6,+3)) ≈ (337.8,129.2) = face |
| 먼 손 | 판결을 누르는 손: `Q.palm(X, 96, 300, 98, 12, 26, 3.8)` |
| FX (front) | 저울대 양 끝 뒤에 지나온 궤적 먹 호. 오른쪽은 PIV 중심 반지름 122, 13° → −16°((358.9,67.4)→(357.3,6.4)). 왼쪽은 193° → 164°((121.1,12.6)→(122.7,73.6)). 'start' 테이퍼, 각 길이 ≤ 65. 접시 아래 바닥 FX는 두지 않는다(진짜 null 지대로 오인된다) |
| 광폭 | 공백 가장자리·소매·접시 불꽃, 백열 일식 눈 |

- 48px: 저울대가 반대쪽으로 기운다(idle 0°, windup +13°).
- 앵커: `muzzle` = [[panL],[panR]], `pans`, `beamEnds`, `head` = [201,112](그대로, 머리 공백).

**처치**

| f | 내용 |
|---|---|
| f0 | 일식 눈이 꺼진다. 코어가 원판을 채운 먹, 종이 초승은 ink300. 저울대가 축에서 금 간다. 두 접시가 흔들리고 눈가림 끝자락이 처진다 |
| f1 | 저울대가 축에서 부러져 두 팔이 늘어진다. 접시가 땅에 닿고, 먹 접시가 쏟아져 먹이 흐른다. 몸 꼭대기(두건) y ≈ 164 |
| f2 | 로브가 녹는다(꼭대기 y ≈ 245). 공백 접시가 바닥에 눕고, 그 투명 구멍이 언덕에 뚫린 구멍으로 남는다(5장 투명 규칙) |
| f3 | 웅덩이 (192,342) rx 132 ry 29. 웅덩이 안에 공백 접시 모양 **투명 구멍**(`holes` + `rims`, 바닥이 비침). 엎어진 먹 접시와 그 위 일식 눈 = 종이 ✕. 엇갈려 누운 저울대 두 토막, 눈가림 끝자락 |

---

## 4. 합격 기준

### 4.1 검사 명령
- 각 명령은 한 줄로 실행한다. 식은 작은따옴표 안에 쓰고, 안에서는 큰따옴표만 쓴다.
- 모든 템플릿은 2026-10-03에 오늘 코드로 실행해 확인했다(`a2c-tpl-*`).
- 이름은 `k3-`로 시작한다.

**K3-C1 지문(F0/F1/F2):**
```
node scripts/art-review-sheet.mjs expr --name k3-fingerprint --scale 1 --expr '(function(){var h=function(s){var x=2166136261;for(var i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0;}return ("0000000"+x.toString(16)).slice(-8);};var n=function(m){return m.replace(/bA\d+_/g,"bA_").replace(/kb2_\d+_/g,"kb2_").replace(/seed="\d+"/g,"seed=\"\"");};var rows=[];["butcher","gaoler","maw"].forEach(function(id){["art","game"].forEach(function(l){var acc="";[1,2,3].forEach(function(p){[false,true].forEach(function(w){[false,true].forEach(function(e){[true,false].forEach(function(fx){[null,true].forEach(function(ha){[true,false].forEach(function(sh){acc+=h(n(PN.bossesA.draw(id,{phase:p,windup:w,enraged:e,lod:l,halo:ha,shadow:sh,fx:fx})));});});});});});});rows.push(id+" "+l+" "+h(acc));});var s="";[1,2,3].forEach(function(p){[false,true].forEach(function(w){s+=h(n(PN.bossesA.draw(id,{phase:p,windup:w,lod:"game",silhouette:true})));});});rows.push(id+" sil "+h(s));});["empress","herald","balance"].forEach(function(id){["art","game"].forEach(function(d){var acc="";[1,2,3].forEach(function(p){[false,true].forEach(function(w){[false,true].forEach(function(e){[undefined,false].forEach(function(ha){[true,false].forEach(function(sh){acc+=h(n(PN.bossesB.draw(id,{phase:p,windup:w,enraged:e,detail:d,halo:ha,shadow:sh,hitbox:sh})));});});});});});rows.push(id+" "+d+" "+h(acc));});var s="";[1,2,3].forEach(function(p){[false,true].forEach(function(w){s+=h(n(PN.bossesB.draw(id,{phase:p,windup:w,detail:"game",mono:true})));});});rows.push(id+" mono "+h(s));rows.push(id+" anchors "+h(JSON.stringify([PN.bossesB.anchors(id,{}),PN.bossesB.anchors(id,{windup:true}),PN.bossesB.anchors(id,{phase:3})])));});rows.push("bossesA META "+h(JSON.stringify(PN.bossesA.META)));rows.push("bossesA anchors "+(PN.bossesA.anchors?h(JSON.stringify(["butcher","gaoler","maw"].map(function(id){return [PN.bossesA.anchors(id,{}),PN.bossesA.anchors(id,{windup:true})];}))):"none"));var out="";rows.forEach(function(r,i){out+="<text x=\"6\" y=\""+(22+i*20)+"\" font-size=\"16\" font-family=\"monospace\" fill=\"#000\">"+r+"</text>";});return "<g><rect x=\"0\" y=\"0\" width=\"330\" height=\""+(30+rows.length*20)+"\" fill=\"#fff\"/>"+out+"</g>";})()'
```
측정 전용 화면이라 글자가 있어도 된다. `--check` 없이 돌린다.

**K3-C2 셀 검사 (판정 기준):** 출력이 `FAIL k3-cell-A: nothing painted` **한 줄뿐이면 합격**이다. 셀 밖에 칠해진 픽셀이 0이라는 뜻이다. `ok`가 나오면 셀 밖에 무언가 칠해졌다는 뜻이고, PNG에 그 자리만 보인다. 다른 문구(id·속성 문제)가 붙어도 불합격이다.
```
node scripts/art-review-sheet.mjs expr --name k3-cell-A --scale 1 --check --expr '(function(){var n=(window.__fm=(window.__fm||0)+1),out="",defs="";var C={butcher:[-20,-170,440,650],gaoler:[-20,-170,440,650],maw:[-100,-170,600,630]};["butcher","gaoler","maw"].forEach(function(id,i){var c=C[id],m="fm"+n+"_"+i;defs+="<mask id=\""+m+"\" maskUnits=\"userSpaceOnUse\" x=\"-3000\" y=\"-3000\" width=\"6000\" height=\"6000\"><rect x=\"-3000\" y=\"-3000\" width=\"6000\" height=\"6000\" fill=\"#fff\"/><rect x=\""+(c[0]+2.5)+"\" y=\""+(c[1]+2.5)+"\" width=\""+(c[2]-5)+"\" height=\""+(c[3]-5)+"\" fill=\"#000\"/></mask>";var S=[];[1,2,3].forEach(function(p){[false,true].forEach(function(e){S.push({phase:p,enraged:e});S.push({phase:p,enraged:e,windup:true});S.push({phase:p,enraged:e,pose:"attack"});});});[0,1,2,3].forEach(function(f){S.push({pose:"death",frame:f});});S.forEach(function(o){o.lod="game";o.halo=true;o.shadow=false;o.fx=true;out+="<g mask=\"url(#"+m+")\">"+PN.bossesA.draw(id,o)+"</g>";});});return "<g><defs>"+defs+"</defs>"+out+"</g>";})()'
node scripts/art-review-sheet.mjs expr --name k3-cell-B --scale 1 --check --expr '(function(){var n=(window.__fm=(window.__fm||0)+1),out="",defs="";var C={empress:[-76,-96,536,526],herald:[-76,-96,556,526],balance:[-76,-96,556,526]};["empress","herald","balance"].forEach(function(id,i){var c=C[id],m="fmb"+n+"_"+i;defs+="<mask id=\""+m+"\" maskUnits=\"userSpaceOnUse\" x=\"-3000\" y=\"-3000\" width=\"6000\" height=\"6000\"><rect x=\"-3000\" y=\"-3000\" width=\"6000\" height=\"6000\" fill=\"#fff\"/><rect x=\""+(c[0]+2.5)+"\" y=\""+(c[1]+2.5)+"\" width=\""+(c[2]-5)+"\" height=\""+(c[3]-5)+"\" fill=\"#000\"/></mask>";var S=[];[1,2,3].forEach(function(p){[false,true].forEach(function(e){S.push({phase:p,enraged:e});S.push({phase:p,enraged:e,windup:true});S.push({phase:p,enraged:e,pose:"attack"});});});[0,1,2,3].forEach(function(f){S.push({pose:"death",frame:f});});S.forEach(function(o){o.detail="game";o.shadow=false;out+="<g mask=\"url(#"+m+")\">"+PN.bossesB.draw(id,o)+"</g>";});});return "<g><defs>"+defs+"</defs>"+out+"</g>";})()'
```

**K3-C3 22상태 격자 (1x 게임 크기):** `--scale 0.4`로 보고, `--scale 1`(@2x 아틀라스)도 본다. `lod:"art"`/`detail:"art"`로 바꾼 것도 `--check`.
```
node scripts/art-review-sheet.mjs expr --name k3-states-A --scale 0.4 --check --expr '(function(){var A=PN.bossesA,ids=["butcher","gaoler","maw"],out="";ids.forEach(function(id,r){var S=[];[1,2,3].forEach(function(ph){["idle","windup","attack"].forEach(function(p){[false,true].forEach(function(en){S.push({phase:ph,windup:p==="windup",pose:p==="attack"?"attack":"idle",enraged:en});});});});[0,1,2,3].forEach(function(f){S.push({pose:"death",frame:f});});S.forEach(function(o,c){o.lod="game";o.halo=true;o.shadow=false;o.fx=true;out+="<g transform=\"translate("+(c*520+120)+","+(r*680+200)+")\">"+A.draw(id,o)+A.hitCircle({px:2.5})+"</g>";});});return "<g>"+out+"</g>";})()'
node scripts/art-review-sheet.mjs expr --name k3-states-B --scale 0.4 --check --expr '(function(){var B=PN.bossesB,ids=["empress","herald","balance"],out="";ids.forEach(function(id,r){var S=[];[1,2,3].forEach(function(ph){["idle","windup","attack"].forEach(function(p){[false,true].forEach(function(en){S.push({phase:ph,windup:p==="windup",pose:p==="attack"?"attack":"idle",enraged:en});});});});[0,1,2,3].forEach(function(f){S.push({pose:"death",frame:f});});S.forEach(function(o,c){o.detail="game";o.shadow=false;o.hitbox=true;out+="<g transform=\"translate("+(c*500+80)+","+(r*500+100)+")\">"+B.draw(id,o)+"</g>";});});return "<g>"+out+"</g>";})()'
```

**K3-C4 48px 단색 (idle·windup·attack·death 0·1·3):** `--scale 1`(실제 48px)도 본다.
```
node scripts/art-review-sheet.mjs expr --name k3-lineup48 --scale 4 --check --expr '(function(){var L=[["bossesA","butcher"],["bossesA","gaoler"],["bossesA","maw"],["bossesB","empress"],["bossesB","herald"],["bossesB","balance"]],P=[{},{windup:true},{pose:"attack"},{pose:"death",frame:0},{pose:"death",frame:1},{pose:"death",frame:3}],out="";L.forEach(function(e,r){var A=e[0]==="bossesA",k=A?0.123:0.154,fy=A?392:360,fx=A?200:192;P.forEach(function(p,c){var o={};for(var key in p)o[key]=p[key];var m;if(A){o.silhouette=true;o.lod="game";m=PN.bossesA.draw(e[1],o);}else{o.mono=true;o.detail="game";m=PN.bossesB.draw(e[1],o);}out+="<g transform=\"translate("+(40+c*70-fx*k)+","+(70+r*80-fy*k)+") scale("+k+")\">"+m+"</g>";});out+="<rect x=\"10\" y=\""+(70+r*80)+"\" width=\"440\" height=\"0.6\" fill=\"#8C8579\"/>";});return "<g>"+out+"</g>";})()'
```

**K3-C5 색·글자 감사:** 칸은 `산호/호박/그 밖 신호색` 개수다(art·game × 페이즈 1·3 = 4장 합계).
- 합격: 모든 보스에서 `atk 0/0/0`, `atkE 4/0/0`(필터 flood만), `d0`·`d3` `0/0/0`, `windup`은 오늘과 같다(8, 입 12), **`text tags: 0`**(오늘 54).
```
node scripts/art-review-sheet.mjs expr --name k3-audit --scale 1 --expr '(function(){var cnt=function(m,c){return (m.match(new RegExp(c,"gi"))||[]).length;};var rows=[],texts=0;var A=["butcher","gaoler","maw"],B=["empress","herald","balance"];var call=function(id,o){return A.indexOf(id)>=0?PN.bossesA.draw(id,Object.assign({lod:o.d,halo:true,shadow:false,fx:true},o)):PN.bossesB.draw(id,Object.assign({detail:o.d,shadow:false},o));};A.concat(B).forEach(function(id){var S=[["idle",{}],["windup",{windup:true}],["atk",{pose:"attack"}],["atkE",{pose:"attack",enraged:true}],["d0",{pose:"death",frame:0}],["d3",{pose:"death",frame:3}]];var line=id+":";S.forEach(function(s){var c=[0,0,0];["art","game"].forEach(function(d){[1,3].forEach(function(p){var o=Object.assign({phase:p,d:d},s[1]);var m=call(id,o);c[0]+=cnt(m,"#EF5B4F");c[1]+=cnt(m,"#D88D16");c[2]+=cnt(m,"#00A8C6|#805AD5|#86B82D");texts+=cnt(m,"<text");});});line+=" "+s[0]+" "+c.join("/");});rows.push(line);});rows.push("text tags: "+texts);var out="";rows.forEach(function(r,i){out+="<text x=\"6\" y=\""+(22+i*20)+"\" font-size=\"15\" font-family=\"monospace\" fill=\"#000\">"+r+"</text>";});return "<g><rect x=\"0\" y=\"0\" width=\"860\" height=\""+(30+rows.length*20)+"\" fill=\"#fff\"/>"+out+"</g>";})()'
```

**K3-C6 처치 줄 (준비 → 공격 → f0~f3):** 한 보스씩, game `--scale 0.4`와 art `--scale 1`. bossesB는 `PN.bossesB.draw(id,{...,detail:"game",shadow:false})`, 바닥선 y 360으로 바꿔 같은 식으로 돌린다.
```
node scripts/art-review-sheet.mjs expr --name k3-seq-butcher --scale 0.4 --check --expr '(function(){var out="";[{windup:true},{pose:"attack"},{pose:"death",frame:0},{pose:"death",frame:1},{pose:"death",frame:2},{pose:"death",frame:3}].forEach(function(o,c){o.lod="game";o.halo=true;o.shadow=false;o.fx=true;out+="<g transform=\"translate("+(c*470+60)+",200)\">"+PN.bossesA.draw("butcher",o)+"<path d=\"M -10,392 H 410\" stroke=\"#8C8579\"/></g>";});return "<g>"+out+"</g>";})()'
```

**K3-C7 광폭 틈 확대:** 공격 광폭(phase 2)을 `--scale 1`로 그린다. 각 보스의 팔·소품 틈을 `--crop`으로 3배 확대해 산호가 닫힌 구멍과 좁은 틈 안에 없는지 본다.
```
node scripts/art-review-sheet.mjs expr --name k3-enraged-attack --scale 1 --check --expr '(function(){var out="";["butcher","gaoler","maw"].forEach(function(id,c){out+="<g transform=\"translate("+(c*520+120)+",200)\">"+PN.bossesA.draw(id,{phase:2,pose:"attack",enraged:true,lod:"game",halo:true,shadow:false,fx:true})+"</g>";});["empress","herald","balance"].forEach(function(id,c){out+="<g transform=\"translate("+(c*520+120)+",760)\">"+PN.bossesB.draw(id,{phase:2,pose:"attack",enraged:true,detail:"game",shadow:false})+"</g>";});return "<g>"+out+"</g>";})()'
```

**K3-C8 공격 얼굴 크롭:** 얼굴 테·눈이 가려지지 않았는지 본다. game `--scale 4`, art `--scale 6`.
```
node scripts/art-review-sheet.mjs expr --name k3-face-attack-butcher --scale 4 --check --crop 260,127,110,110 --expr 'PN.bossesA.draw("butcher",{pose:"attack",lod:"game",halo:false,shadow:false})'
```

| 보스 | 크롭(attack) |
|---|---|
| butcher | 260,127,110,110 |
| gaoler | 180,77,110,110 |
| maw | 146,190,120,110 |
| empress | 145,48,110,110 |
| herald | 275,63,110,110 |
| balance | 283,74,110,110 |

대기 얼굴 크롭은 `boss-faces`와 같은 영역을 `expr`로 돌린다(고정 이름 주제는 다른 세션 파일을 덮어쓰니 쓰지 않는다).

**K3-C9 초상 84px@2x (얼굴 묶음 확인, 굽기 레시피 재현):**
```
node scripts/art-review-sheet.mjs expr --name k3-portraits --scale 1.75 --check --crop 0,0,620,200 --expr '(function(){var K=PN.icons.K,s="",f=function(v){return Math.round(v*100)/100;};var L=[["butcher","A",[262,146],0.5],["gaoler","A",[230,128],0.54],["maw","A",[204,236],0.5],["empress","B",[196,112],0.36],["herald","B",[306,168],0.34],["balance","B",[330,158],0.34]];L.forEach(function(e,j){[false,true].forEach(function(en,r){var A=e[1]==="A",c=e[2],k=148/(e[3]*(A?400:384)),b=A?PN.bossesA.draw(e[0],{phase:1,enraged:en,lod:"game",halo:false,shadow:false,fx:true}):PN.bossesB.draw(e[0],{phase:1,enraged:en,detail:"game",halo:false,shadow:false}),u="pk"+(window.__pk=(window.__pk||0)+1);var vig=PN.halftone(0,0,160,160,5,function(x,y){return Math.max(0,Math.min(1.9,(Math.hypot(x-80,y-70)-44)/30));},K.ink1,45);s+="<g transform=\"translate("+(j*100+2)+" "+(r*100+2)+") scale(0.6)\"><defs><clipPath id=\""+u+"\"><circle cx=\"80\" cy=\"80\" r=\"74\"/></clipPath></defs><g clip-path=\"url(#"+u+")\"><rect width=\"160\" height=\"160\" fill=\""+K.paper+"\"/>"+vig+"<g transform=\"translate("+f(80-c[0]*k)+" "+f(80-c[1]*k)+") scale("+f(k)+")\">"+b+"</g></g><circle cx=\"80\" cy=\"80\" r=\"74\" fill=\"none\" stroke=\""+K.ink+"\" stroke-width=\"6\"/><circle cx=\"80\" cy=\"80\" r=\"78.5\" fill=\"none\" stroke=\""+K.p50+"\" stroke-width=\"2.4\"/></g>";});});return "<g>"+s+"</g>";})()'
```

**K3-C10 얼굴 묶음 개별:** R4-faces의 확인 명령을 이름만 `k3-`로 바꿔 돌린다.
- 간수 `--scale 0.8`·`0.4`, phase 3, `enraged:true`, `windup:true`
- 여제·전령·천칭 `detail:"game"` `--scale 0.5`·`1`, `mono:true` `--scale 0.154`
- 도살자 간판 `--crop 305,262,110,128 --scale 4`(art·game)

### 4.2 보여야 하는 것

**공통**
1. `--check`가 붙은 명령은 모두 `ok`다. 예외는 K3-C2이고, 이것은 `nothing painted` 한 줄이어야 한다. kit error 0.
2. F2 = F1(§1.4).
3. K3-C5: `text tags: 0`. attack·death의 신호색 칸이 위 값과 같다.
4. 1x(K3-C3 `--scale 0.4`)에서:
   - attack이 windup의 다음 박자로 읽힌다.
   - 얼굴 테와 눈빛이 보인다.
   - P2 표식과 P3 코어가 attack에도 얹힌다.
5. 48px(K3-C4): 보스마다 idle·windup·attack이 서로 다르다(§1.7 셋 중 하나 이상). 처치 f1·f3이 무너짐과 웅덩이로 읽힌다. 6보스가 서로 구별된다.
6. 처치(K3-C6)
   - 4장이 이어진 동작이다.
   - f1 키 ≈ 70%, f2 ≈ 40%(±8%).
   - f3 웅덩이 중심·크기와 높이 제한이 §1.8대로다.
   - 유물 ✕ 눈이 있다. 산호·호박이 0이다.
7. 광폭(K3-C7): 닫힌 구멍과 좁은 틈 안쪽에 산호가 0이다.
8. 얼굴(K3-C8·C9·C10)
   - 포즈마다 같은 얼굴 함수, 같은 각도다.
   - 가짜 눈이 0이고, 글자처럼 읽히는 기호가 0이다.
   - §2 항목별 합격 기준을 만족한다.

**보스별 확인**

| 보스 | 추가로 보여야 하는 것 |
|---|---|
| butcher | 식칼이 가장 높은 점이다. 봉투 눈이 팔에 가려지지 않는다. 속도선이 三으로 읽히지 않는다 |
| gaoler | 열쇠 활이 음통에 닿는다. 자루가 열쇠구멍에서 30 이상 떨어진다. 풍경 셋이 바깥으로 튄다. 소리 호에 글자가 없다 |
| maw | 두 주먹이 땅에 있다. 호박 0. 화구 불꽃 꼭대기가 눈보다 25 이상 아래다 |
| empress | 수평 열쇠가 x ≤ 420이다. 걸쇠 옆 ✦ 3개. 땅에 격자 선이 없다 |
| herald | 빈 소켓이 동심원이 아니다. 날아가는 톱니는 P1 4개, P2·P3 3개 |
| balance | 저울대 −16°. 공백 접시 구멍이 따라간다. 눈 아래 20~30%가 앞 테에 가린다 |

---

## 5. 납품서에 넣을 것 (kit-artist 형식에 더해)

1. **F0·F1·F2 표**(K3-C1 출력 전문)와 F1에서 바뀐 줄의 이유.
2. **API 문서**
   - `API-bosses1.md`
     - `pose`·`frame` 옵션 표
     - 새 `anchors()` 표: 대기·준비·공격·f0~f3
     - 보스별 attack·death 설명
     - game LOD 규칙(F-A1·A3)
     - 간판 기호
     - rev 3 출처 문구
   - `API-bosses2.md`
     - 같은 항목
     - `solid` 목록 추가분
     - 여제 눈 규칙(F-B1)
     - 전령 `hoodEyes` 미사용
     - 천칭 눈·브로치·축
3. **수치**
   - 보스별 attack 몸 높이와 최고점
   - f1·f2 키(대기 대비 %)
   - f3 웅덩이 값
   - 상태별 getBBox 표(참고용)
   - K3-C2 결과
4. **렌더 목록:** K3-C1~C10 PNG 경로와 `--check` 출력 전문.
5. **지시서와 다르게 한 것과 그 이유**
   - 좌표는 ±8까지 자유롭게 바꿔도 된다.
   - 구조 규칙(§1.2, §1.4, §1.10)은 바꿀 수 없다.
   - 지시 값끼리 부딪쳤으면 어느 쪽을 따랐는지 적는다.
6. **알려진 한계**(사람 원화가 필요한 곳).

---

## 6. 참고할 것과 피할 것

**참고**

| 그림 | 위치 | 배울 것 |
|---|---|---|
| bossesC 포즈 문법 | `docs/art/briefs/bossesC.md` §1.4·§1.11, `API-bosses3.md` | 준비·공격 리그, 처치 4장, ✕ 유물 |
| 필드 보스 처치 | `API-bosses4.md` 상태 표 | 경량 세트의 무너짐 순서 |
| 적 처치 데칼 | `PN.vfx.decal(0, { role: 'warden', seed: 0 })` | 웅덩이와 ✕✕ |
| 기존 준비 자세 | `k-bosses1.js:241-344`(도살자), `:548-557`(간수), `:712-731`(입), `k-bosses2.js:370-404`(여제), `:533-577`(전령), `:668-735`(천칭) | attack은 이 동작의 다음 박자다 |
| 내 시험 렌더 | `a2c-gaoler-attack-geom`, `a2c-butcher-attack-geom`, `a2c-empress-eye-final` | 좌표가 셀 안에 들어가고 얼굴이 가려지지 않는 것을 확인했다 |

**피할 것**
- 포즈마다 얼굴을 새로 그리기(두 시점 혼합)
- 크기만 다른 정면 원 두 개(여제 반례)
- 동심원 빈 소켓, 리벳·파편 점 두 개 나란히(가짜 눈)
- 三·XXX·#·+ 같은 기호
- 좁은 틈 산호
- attack에 남은 '!'·호박 예열·점선 호
- 셀 밖으로 나가는 소품(간수 열쇠를 시계 방향으로 돌리면 셀 밖, 반시계로 돌리면 얼굴 위다)
- 공백 접시 아래 void.paper 지면 FX(진짜 null 지대로 오인된다)

---

## 7. 메인 세션 참고 (합격 뒤 등록·굽기)

1. **굽기 사양** `art/atlas-spec.mjs:118-141`

   ```js
   bossesA: { phases: [1, 2, 3], poses: ['idle', 'windup', 'attack'], enraged: [false, true], death: true },
   bossesB: { phases: [1, 2, 3], poses: ['idle', 'windup', 'attack'], enraged: [false, true], death: true },
   // stateOptions: idle·windup 호출은 지금과 같은 객체로 남긴다(pose 키를 넣지 않는다)
   return { phase: state.phase, windup: state.pose === 'windup', enraged: state.enraged, ...(state.pose === 'attack' ? { pose: 'attack' } : {}) };
   ```

   - death 4프레임 루프(`:160-163`)와 `bossAnimations`는 그대로 동작한다.
   - pad는 K3-C2가 통과하면 그대로 둔다.
   - 보스당 10장 × 6 = 60장 증가: 팩 페이지·설치 예산을 확인한다(TEC-05).
2. **렌더러**는 바꿀 것이 없다. attack 폴백(`worldRenderer.ts:1806-1807`)과 처치 재생(`:1825-1850`)이 이미 있다. 도살자는 돌진 내내 attack을 쓴다(의도).
3. **굽기:** `npm run build:atlas`, `npm run build:ui-art`. 얼굴 묶음으로 초상이 바뀌고, '딩—' 삭제를 반영하려면 이야기 패널 outro-1을 다시 굽는다. 이야기 패널은 bossesA를 `fx:false`, phase 3, art로 그린다(`scripts/build-ui-art.mjs:224-231`). 그 뒤 `npm run test:unit`.
4. **화면 검사** `npm run test:visual`. 그림이 바뀌므로 골든 갱신은 명시 검토 뒤에만 한다. 볼 장면:
   - 1-5 도살자 돌진(attack이 달리는 동안)
   - 1-10 간수, 2-10 입, 3-10 여제, 4-10 전령, 5-10 천칭의 준비 → 공격(0.25초)
   - 6보스 처치 4프레임과 얼룩 전환
   - 광폭 공격
   - 보스 배너 초상 12장
   - 1024×720(0.8배)에서 여제 눈 고리와 천칭 눈
5. **커밋 항목:** 얼굴·글자는 ART-07·ART-08(이야기 패널 막음 포함), 포즈는 ART-04·ART-07·ART-08. 모두 D-14.

---

## 8. 열린 질문 (팀 결정)

| # | 질문 | 선택지 (권고) |
|---|---|---|
| Q1 | 이 6종은 P2·P3 무브가 실제로 도는데 attack은 보스당 하나다 | 이번은 하나 **(권고, 0.25초 노출)** / 무브별 attack 3벌(`move` 옵션, bossesC 방식)을 후속 발주 |
| Q2 | 광폭 공격 18장 | 그대로 **(권고, 광폭에서도 동작이 보여야 한다)** / 예산이 모자라면 광폭 공격 생략, 렌더러가 평상 공격을 쓴다 |
| Q3 | 이야기 패널 outro의 쓰러진 통치자 | death f1을 쓴다 **(권고, 합격 뒤 메인 세션)** / 지금 기울임 + 흐림 유지 |
| Q4 | F-B1 여제 눈 정정(같은 크기, 반쯤 감은 고리 눈)은 R4 B1 "크기 유지"와 다르다 | 정정판 **(권고, 근거 §0.1)** / R4 원안 |
| Q5 | 도살자 간판 기호 | 걸린 고깃덩이 **(권고)** / 빈 간판(먹 틀만) |
| Q6 | 프레임 수: 바이블 §10.2-8은 attack 8~12·death 12다 | 키 프레임만, 사이는 렌더러 트윈이나 원화 **(권고, bossesC Q4와 같다)** |
| Q7 | bossesA에는 광폭 펄스용 `solid`가 없다 | 이번에는 틈을 만들지 않는 규칙으로 막는다 **(권고)** / bossesA 조합기를 bossesB 방식으로 바꾸기(기존 출력이 바뀌므로 별도 항목) |

---

## 9. 킷으로 고칠 수 없는 것 (사람 원화)
- attack 8~12·death 12프레임의 사이 동작(트윈 또는 원화).
- 도살자의 달리는 다리와 치켜든 팔의 해부. 간수 장갑이 펴지는 손가락. 여제 갈고리 손이 움켜쥐는 모양.
- 처치 f2·f3의 녹는 질감, 무쇠 판 더미, 옆으로 누운 범종의 입체.
- 최종 외곽선, 비백, 블랙 스팟(바이블 §15). 판독 시험(n ≥ 8).

## 10. 이번 조사 렌더 (`a2c-*`)
- 기존 자세: `a2c-A-idle-windup-art`, `a2c-B-idle-windup-art`, `a2c-lineup48-existing`, `a2c-bbox-existing`
- 셀 검사: `a2c-cellmask-existing-A`·`-B`·`-control`
- 지문: `a2c-fingerprint-baseline`·`-repeat`
- 얼굴·글자: `a2c-butcher-sign-art`·`-game2`, `a2c-empress-face-game`, `a2c-empress-eye-mock`·`-mock2`·`-mock3`·`-final`, `a2c-balance-herald-face-game`
- 템플릿 실행 확인: `a2c-tpl-fingerprint`·`-lineup`·`-states-A`·`-states-B`·`-cell-A`·`-portraits`, `a2c-audit-template`
- 리그 확인: `a2c-gaoler-attack-geom`, `a2c-butcher-attack-geom`
- 기타: `a2c-probe`, `a2c-butcher-sign-game`, `a2c-butcher-sign-both`(크롭을 잘못 잡은 렌더라 판단에 쓰지 않음)
