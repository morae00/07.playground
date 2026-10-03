# K3-1 납품서 — 라운드 보스 얼굴·글자 묶음 (kit-artist, 2026-10-03)

> 메인 세션 메모(2026-10-03): K3-1 발주(`docs/art/briefs/boss-poses.md` §1.1의 1~2단계)의 kit-artist 응답을 그대로 저장했다. 고친 파일은 `art/concept-kit/k-bosses1.js`, `k-bosses2.js`, `API-bosses1.md`, `API-bosses2.md`다. 검수(3단계) 결과는 이 파일 끝에 "검수 N차" 절로 덧붙인다. K3-2(공격·쓰러짐 포즈)의 납품도 이 파일에 이어 붙인다. §6-3 확인: `src/`와 굽기 사양에는 `PN.bossesB.anchors('balance').face`를 읽는 코드가 없다.

지시서 `docs/art/briefs/boss-poses.md` §1.1의 1~2단계를 했다. 범위는 §2 F-A1~F-B3과 §2.3 API 문서다. F0를 확인했고, 얼굴·글자 묶음을 그린 뒤 F1을 기록했다. §3 포즈(`pose`·`frame`·`PN.bossesA.anchors`)는 손대지 않았다.

**요약**
- '딩—'(출시 막음)을 가장 먼저 지웠다. 출력 전체의 `<text>`는 54개에서 0개가 됐다.
- F0는 23줄 모두 지시서 값과 같았다.
- F1은 바뀌어야 할 줄만 바뀌었다. `bossesA META`, `empress anchors`, `herald anchors`는 F0와 같다.
- `--check`가 붙은 모듈 렌더는 모두 ok다. K3-C2는 합격 문구인 `nothing painted` 한 줄씩이다.

---

## 1. 납품 목록

| 파일 | 네임스페이스 | 바꾼 함수 | 옵션 | 상태 수 |
|---|---|---|---|---|
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-bosses1.js` | `PN.bossesA` | `A.butcherCleaver`(간판), `A.BUILD.butcher`(봉투), `A.gaolerBell`(유곽 `nip`), `A.gaolerLantern`(종이학), `A.gaolerChime`(물고기·'딩—'), `A.BUILD.gaoler`(영혼 눈), `A.BUILD.maw`(눈·잉걸불·glow) | 추가 없음 | 그대로: 보스당 12(페이즈 3 × 대기·준비 × 평상·광폭), LOD 2종, silhouette |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-bosses2.js` | `PN.bossesB` | `_.eyeEclipse`(끝에 선택 인자 `core` 추가), 여제 `head()`, 전령 `H.trumpet`(문자판)·`parts.herald`(두건), `parts.balance`(눈·앞 테·걸쇠·축), `anchorsOf.balance`(face) | 추가 없음 | 그대로(12 + mono) |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-bosses1.md` | — | rev 3 절: 바뀐 것 표, 초점 규칙, 눈 규칙, game LOD 규칙, 간판 기호, 출처 문구, 본문 정정 | — | — |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-bosses2.md` | — | rev 3 출처 문구, 얼굴 열 정정, "rev 3 얼굴" 절(여제 눈, 전령 `hoodEyes` 미사용, 천칭 눈·걸쇠·축), 앵커 정정, `eyeEclipse` 인자 | — | — |

**바꾼 곳(줄 번호는 납품 시점)**
- `k-bosses1.js`
  - 간판 :191-204
  - 봉투 :308-326
  - 유곽 :387-391
  - 종이학 :468-475
  - 풍경 :485-501
  - 영혼 :541
  - 입 눈 :735-739, 잉걸불 :742, glow (186,244)·(227,244)
- `k-bosses2.js`
  - `eyeEclipse` :154-161
  - 여제 눈 :321-340
  - 전령 문자판 :469-471, 두건 :555-560, `hoodEyes` 주석 :596
  - 천칭 걸쇠 :712-714, 축 :728-729, 눈·앞 테 :737-743, 앵커 :763-766

## 2. API 요약

박스·피벗·발·판정·배율과 META 값은 바꾸지 않았다.

| | bossesA (butcher·gaoler·maw) | bossesB (empress·herald·balance) |
|---|---|---|
| 로컬 박스 | 400 × 400, 오른쪽을 본다 | 384 × 384, 오른쪽을 본다 |
| 피벗(판정 원 중심) / r | (200, 257) / 135 로컬 = 게임 r54 | (192, 252) / 108 로컬 = 게임 r54 |
| 발 | y 392 | (192, 360) |
| 게임 표시 | `lod:'game'`, 0.4배, 약 156px | `detail:'game'`, 0.5배, 약 156px |

**얼굴 앵커**
- butcher (271,150), gaoler (235,132), maw (206,244): 그대로다.
- empress [197,101]: 그대로다.
- herald: idle [318.46,163.97], windup [305.83,43.81]로 그대로다. `hoodEyes` [214,106]은 값을 그대로 두고 **미사용**으로 문서화했다.
- **balance만 바뀌었다.** idle [342,155] → **[342,159]**, windup [339.23,179.29] → **[339.23,183.29]**. 새 눈 중심(panR + (−6,+3))이다.

## 3. 검사 결과

렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 파일 이름은 모두 `k3-`로 시작한다.

### 3.1 K3-C1 지문

F0는 `k3-fingerprint-f0.png`, F1 최종은 `k3-fingerprint.png`(2배)다. `k3-fingerprint-f1.png`는 중간 기록이다. 이후 도살자 X 위치를 한 번 더 옮겨서 butcher game·sil 두 줄만 최종과 다르다.

| 줄 | F0 | F1 | 바뀐 이유 |
|---|---|---|---|
| butcher art | a55b1ff9 | d843285e | '정육점' `<text>`를 고깃덩이 기호로 바꿨다. 도장 원과 '肉'을 지웠다 |
| butcher game | bf586d63 | c19b48a4 | "HOI" 획을 기호로 바꿨다. 도장 원을 지웠다. 봉투를 game용으로 다시 그렸다(띠·주름·먹물·X 3·입 선·접힘선) |
| butcher sil | 5e23b535 | 9b3a9ea6 | 위 몸 마크업이 바뀌어서다. 실루엣 픽셀은 같다 |
| gaoler art | abdf0827 | f173768d | '딩—'을 지웠다. 물고기·종이학을 paper300 + d40으로 눌렀다. 물고기 표식은 ink300이다. 영혼 눈을 지웠다 |
| gaoler game | c2b29ff1 | d9b7c682 | 물고기·종이학을 ink300 평면으로 했다. 물고기 표식과 영혼 눈을 지웠다. 유곽 칸을 고쳤다 |
| gaoler sil | 90584501 | ffd3cc06 | 몸 마크업만 바뀌었다 |
| maw art / game / sil | 2aea9ded / 96577a02 / 6cbfb696 | 993583d6 / b9f45988 / b72be510 | 눈·동공·glow를 옮겼다. 잉걸불을 ink300으로 했다 |
| empress art | 60f0a326 | e3af225e | 눈을 다시 그렸다. 눈물을 고쳤다. 셋째 기포를 옮겼다. art 이중 테를 지웠다 |
| empress game | 2979030a | eba6c81e | 눈과 눈물을 고쳤다. 쐐기를 paper300 평면으로 했다. 기포 고리를 지웠다 |
| empress mono | 591a5131 | 15c30767 | 몸 마크업만 바뀌었다 |
| **empress anchors** | 915f9002 | **915f9002** | 바뀌지 않음(요구대로) |
| herald art / game / mono | e4d16f87 / 3a6efa3c / 6971fed5 | c12955c3 / aceeeb9c / 86278331 | 문자판 0.69, 두건 광점 삭제 |
| **herald anchors** | 15df39d0 | **15df39d0** | 바뀌지 않음(요구대로) |
| balance art / game / mono | 6fdf915d / da66d59d / 9d3cf897 | 12cd70bb / b0984109 / dbc61831 | 눈을 세우고 앞 테를 다시 그었다. 코어를 0.22로 옮기고 종이 호를 지웠다. 걸쇠·축 마개를 바꿨다 |
| balance anchors | 229c1ad9 | 54938ee6 | face y +4(요구대로) |
| **bossesA META** | 01d09a8a | **01d09a8a** | 바뀌지 않음(요구대로) |
| bossesA anchors | none | none | K3-2에서 생긴다 |

### 3.2 K3-C5 색·글자 감사

전·후 렌더는 `k3-audit-f0.png`, `k3-audit.png`다.

| 보스 | 대기 | 준비 |
|---|---|---|
| butcher·gaoler·empress·herald·balance | 0/0/0 | 0/8/0 |
| maw | 0/0/0 | 0/12/0 |

- 오늘 값과 같다.
- **`text tags: 0`**(오늘 54).
- atk·atkE·d0·d3 칸은 지금 대기·대기광폭 출력이다. `pose`가 아직 없어 무시되기 때문이고, K3-2의 증거가 아니다.

### 3.3 K3-C2 셀 마스크

대기·준비 상태만 검사했다. 템플릿의 `S`에서 attack·death를 넣는 항목을 뺀 판이다.
```
FAIL k3-cell-A: nothing painted
FAIL k3-cell-B: nothing painted
```
두 모듈 모두 합격 문구 한 줄뿐이다. 셀 밖 칠은 0이고 id·속성 문제도 0이다. A는 마지막 수정 뒤에 다시 돌렸다.

### 3.4 K3-C4 48px

대기·준비 두 칸으로, 템플릿의 `P`를 `[{},{windup:true}]`로 줄인 판이다.
- 렌더: `k3-lineup48.png`(4배), `k3-lineup48-1x.png`(48px), 둘 다 ok.
- 수정 전 `a2c-lineup48-existing`과 비교했다. 12개 실루엣이 같다(바꾼 것은 모두 기존 윤곽 안이다).

### 3.5 K3-C9 초상

`k3-portraits.png`, ok. 평상·광폭 12장을 직접 봤다.
- 입은 한 눈선에 동공이 플레이어 쪽을 본다.
- 여제는 반쯤 감은 엄한 눈으로 읽힌다.
- 간수는 열쇠구멍만 밝다.
- 도살자 봉투에 꿰맨 입이 보인다.
- 천칭 눈은 접시 속 일식 초승이다.

### 3.6 K3-C10 얼굴 묶음 개별

- **간수**: `k3-c10-gaoler-08`·`-04`(p1·p3·광폭·준비), `k3-c10-gaoler-sil`(0.123), `k3-gaoler-p1-game-08`, `k3-gaoler-p1-game-bell`(4배), `k3-gaoler-p2-art`, `k3-gaoler-outro-call`(이야기 패널 호출: phase 3, art, fx:false), `k3-gaoler-paper50-list`.
  - phase 1 출력의 paper.50 태그는 game·art 모두 6개다: 열쇠구멍 안 테, 눈 타원, 빛 조각 3개, 그리고 쓰이지 않는 defs 패턴 `p40` 하나.
- **여제·전령·천칭**
  - 1x(0.5): `k3-c10-B-05`, `k3-empress-game-05`
  - 2배: `k3-empress-game-1`, `k3-c10-empress-1`·`-herald-1`·`-balance-1`(p1·p3·광폭·준비)
  - mono 0.154: `k3-c10-B-mono`
  - 8배: `k3-empress-face-game`·`-art`, `k3-herald-face-game`, `k3-herald-bell-game`, `k3-balance-face-game`·`-art`, `k3-balance-game-1`
- **도살자 간판**(4배, crop 305,262,110,128): `k3-butcher-sign-art`, `k3-butcher-sign-game`.
  - 시안 비교: `k3-proto-meat`(기호 3안 4배·0.4배, 2안 채택).
- **도살자 얼굴**: `k3-butcher-face-game`(6배), `k3-butcher-head-game-08`, `k3-butcher-p1-game-04`, `k3-butcher-face-p3-game`, `k3-butcher-face-wu-game`, `k3-butcher-p1-art`.
- **입 얼굴**: `k3-maw-face-game`·`-art`(8배), `k3-maw-face-windup`, `k3-maw-face-enraged`.
- **전 상태 lint**(두 LOD × phase 1~3 × 준비 × 광폭, A는 `hitCircle`, B는 `hitbox:true` 겹침): `k3-states-A-game`, `-A-art`, `-B-game`, `-B-art`. 피벗·판정 원은 제자리다.
- **앵커 출력 확인**: `k3-anchors-print`(값은 §2).

### 3.7 `--check` 결과 전문

```
ok   k3-gaoler-p2-art            ok   k3-gaoler-p1-game-08        ok   k3-gaoler-p1-game-bell
ok   k3-maw-face-game            ok   k3-maw-face-art             ok   k3-maw-face-windup
ok   k3-maw-face-enraged         ok   k3-butcher-sign-art         ok   k3-butcher-sign-game
ok   k3-butcher-face-game        ok   k3-butcher-p1-game-04       ok   k3-butcher-head-game-08
ok   k3-butcher-p1-art           ok   k3-butcher-face-p3-game     ok   k3-butcher-face-wu-game
ok   k3-butcher-face-p3-wu       ok   k3-empress-face-game        ok   k3-empress-face-art
ok   k3-empress-game-05          ok   k3-empress-game-1           ok   k3-herald-face-game
ok   k3-herald-bell-game         ok   k3-balance-face-game        ok   k3-balance-face-art
ok   k3-balance-game-1           ok   k3-lineup48                 ok   k3-lineup48-1x
ok   k3-portraits                ok   k3-c10-gaoler-08            ok   k3-c10-gaoler-04
ok   k3-c10-gaoler-sil           ok   k3-c10-empress-1            ok   k3-c10-herald-1
ok   k3-c10-balance-1            ok   k3-c10-B-05                 ok   k3-c10-B-mono
ok   k3-states-A-game            ok   k3-states-A-art             ok   k3-states-B-game
ok   k3-states-B-art             ok   k3-gaoler-outro-call
FAIL k3-cell-A: nothing painted      (K3-C2 합격 문구)
FAIL k3-cell-B: nothing painted      (K3-C2 합격 문구)
FAIL k3-maw-face-wu-en: ids repeat across calls (use a per-call prefix counter): k3mwc
```
- 마지막 FAIL은 모듈 문제가 아니다. 내 시험 식에 고정 clipPath id `k3mwc`를 넣어서 난 것이다. 같은 내용을 크롭 두 장(`k3-maw-face-windup`, `-enraged`)으로 다시 돌렸고 둘 다 ok다.
- `k3-butcher-face-p3-wu`는 두 그림이 겹친 합성 실수라 판단에 쓰지 않았다.
- kit error는 0이다.
- `--check` 없이 돌린 것(측정용·글자 포함): `k3-fingerprint-f0`, `k3-fingerprint-f1`, `k3-fingerprint`, `k3-audit-f0`, `k3-audit`, `k3-proto-meat`, `k3-gaoler-paper50-list`, `k3-anchors-print`, `k3-probe-noop`.

## 4. 지시서 대비

**F-A1 간수** — 모두 반영했다.
- '딩—' `<text>`를 지웠고 소리 호 2줄은 남겼다.
- 물고기: game ink300 평면, art paper300 + d40. 눈 원과 아가미 획은 art에서만 ink300으로 남겼다.
- 종이학: game ink300 평면, art paper300 + d40.
- 영혼 눈 2개를 모든 페이즈에서 지웠다.
- 유곽(game): 원을 빼고 아래·오른쪽 삼각형만 ink500으로 칠했다. ink300 테는 그 위에 다시 그었다.
- 지킬 것: META, 열쇠구멍 medal 모양과 눈 (226.5,128), 12상태, 48px 실루엣이 모두 그대로다.
- 합격 기준
  - phase 1의 paper50은 열쇠구멍(테·눈)과 빛 조각 3개뿐이다(§3.6 목록).
  - 유곽에 원이 없다.
  - P3 영혼에 눈이 없다.
  - art P2·P3의 `<text>`가 0이다.

**F-A2 입** — 지시 좌표 그대로다.
- 왼눈 `eye(186,244,13.5,8.6,1)` + 동공 (191.5,242.6) r4, 오른눈 `eye(227,244,10.4,6.2,−1)` + 동공 (231.5,242.4) r3.2.
- 두 동공의 윗꺼풀 접점을 8배에서 확인했다. 준비·광폭에서도 맞다.
- glow를 (186,244)·(227,244)로 옮겼다.
- (권장) 잉걸불을 ink300으로 했다.
- META.maw.face (206,244)는 그대로다.

**F-A3 도살자** — 반영했다. 좌표 조정은 §5에 적었다.
- game에서만: X 3개(간격 12.6·선 2.6), 먹물 `drip(266,160,20,5)`·`drip(282,163,13,4.2)`, 주름 획 생략, 아래 띠 paper300 평면.
- art·game 공통: 도장 원과 '肉'을 지웠다. 간판 글자를 걸린 고깃덩이 하나로 바꿨다(갈고리 J, 둥근 뼈 막대, 아래로 넓어지는 먹 물방울, 지방 결 art 2줄·game 1줄 4.05폭).
- META와 칼 프레임·날·리벳·P2 균열·눈구멍·P3 반파는 그대로다.
- 합격 기준
  - `<text>`가 0이다.
  - 간판은 4배와 1x에서 글자로 읽히지 않는다.
  - 0.8배에서 눈구멍·먹물 2방울·X 3이 따로 보인다.
  - 0.4배에서 눈과 먹물은 분명하다. 입은 짧은 꿰맨 띠로 보인다(§6 참고).
  - 봉투에 큰 점 무늬가 없다.

**F-B1 여제** — 정정판 표를 그대로 따랐다.
- 같은 크기 눈 (185,99)·(201,99)이다. game rx 6.0·ry 4.6, art 5.8·4.4.
- 종이 고리: (0, +0.08ry), ×0.6, 굵기 game 2.0 / art 1.4, 눈 모양으로 clip.
- 뚜껑 경계는 cy − 0.15ry를 지나고 코 쪽이 0.35ry 낮다.
- 흰 점이 0이다.
- 눈물은 (180.5,104)에서 시작해 방울 끝 y 115.8까지다. 길이 ≤ 12이고 정중선에서 12 떨어져 있다.
- 쐐기는 game에서 paper300 평면이다.
- game 기포 고리를 지웠다.
- 광폭은 `eyeBubble` hot를 같은 크기로 쓴다.
- 합격 기준: 1x에서 두 눈이 같은 크기이고 종이 고리가 보인다(2.0 로컬 = 1px). 8배에서 머리 좌표 Δy가 0이다. 초상에서 엄한 반쯤 감은 눈으로 읽힌다.

**F-B2 전령** — 반영했다.
- `scale(0.69,1)`로 문자판 11.7 × 17이다. 비율이 종구 27/39 = 0.692와 같다.
- 두건 광점을 평상·광폭 모두 지웠다. 두건 안의 종이 요소가 0이다.
- `hoodEyes`는 값을 남기고 미사용으로 적었다.
- face 앵커는 F0와 같다.

**F-B3 천칭** — 반영했다.
- 눈: 원, 중심 panR + (−6,+3), 코어 x + 0.22r, 종이 호 삭제(`core` 인자. 기본 0.1은 rev 2와 같은 출력이다).
- 앞 테 반호를 눈 위에 game 9 / art 7로 다시 그었다. 가림은 계산으로 game 31%, art 25%이고, 8배 렌더로 확인했다.
- P2 접시 균열은 앞 테 위로 옮겨 그려 지금처럼 보인다.
- 가슴: 고리 없는 사각 걸쇠(ink700 + 먹 테 + ink300 빛 테).
- 축: 속 고리 없는 ink500 마개.
- `anchorsOf.balance.face`를 고쳤다.
- 투명 컷과 저울대·접시 기하는 그대로다. 48px mono도 같다.

**§2.3 API 문서** — 두 문서 모두 지시 문구 "rev 3(K3, 2026-10): 킷 사본을 직접 고쳤다. concept/work 원본은 이 판보다 오래됐다."로 바꿨다. game LOD 규칙, 글자 기호화, 눈 규칙을 적었다.

## 5. 지시서와 다르게 한 것

1. **도살자 game 꿰맨 입의 자리**
   - 지시 자리(중심 262.2·274.8·287.4)에서는 가까운 팔이 입 높이에서 봉투의 x ≈ 280 오른쪽을 덮는다. 셋째 X가 팔 뒤로 숨고 둘째도 팔에 닿는다(렌더로 확인). "0.4배에서 X 3이 따로 보인다"는 합격 기준과 부딪친다.
   - 그래서 game에서만 간격 12.6·선 2.6은 지키고 자리를 옮겼다.
     - X 중심: (243.1,191.7)·(255.7,192.4)·(268.3,190.8)
     - 입 선: `M 236,190 C 252,195 270,192 290,184`
     - 앞 접힘선: 입 위 y 177에서 끊었다
   - 이 자리에서는 P3 먹물(x 262)이 X를 관통하지 않고 둘째·셋째 사이로 흐른다.
   - art는 그대로다.
   - 결과로 game 입 중심이 눈보다 약 19 왼쪽에 있다. 다른 안은 "지시 자리 + 보이는 X 2개"다. 검수 판단을 요청한다.
2. **"크기 ±5.2"의 해석**: 반높이 5.2, 반폭 3.8로 했다(원래 3.2:4.4 비율 유지). 정사각 ±5.2면 간격 12.6에서 X 끝이 맞닿는다.
3. **간판 기호 좌표**(±8 안)
   - 갈고리: 틀 윗변에 붙도록 y 29에서 시작해 J 바닥 y ≈ 39.
   - 뼈: 6 × 16 막대, 기울기 16°. 고깃덩이 위로 보이는 길이 약 10. 짧은 막대는 4배에서 작은 고리로 읽혀서 늘렸다(`k3-proto-meat`).
   - 덩이: y 46~84, 폭 26.
4. **여제**
   - art 눈 바깥의 0.9 고리(r + 2.4)를 없앴다. 지시 표에는 없는 요소다. 남기면 눈 + 고리 + 바깥 고리가 겹고리 눈알이 된다.
   - art 셋째 기포 (207,91)은 오른눈에서 약 2.7이라 "4 이상" 조건에 걸린다. 그래서 (203.5,88)로 옮겨 3개를 유지했다(간격 4.3).
   - 광폭 hot 반지름: "같은 크기"를 눈 rx(game 6.0 / art 5.8)로 해석했다. rev 2의 7.8×1.08을 두 눈에 쓰면 두 원이 겹친다.
   - 눈물: "뿌리 폭 2(game 2.4) 'end'"를 `taper` 폭 인자로 해석했다. 'end'는 시작이 0폭이라 눈 쪽이 가늘고 방울 쪽이 2·2.4다.
5. **천칭 걸쇠의 "ink300 테"**: 닫힌 안쪽 사각 테 대신 왼쪽·위 모서리의 L자 빛 테(바이블 §6-3)로 그었다. 어두운 사각 안의 닫힌 밝은 사각은 창·눈처럼 읽힌다. 닫힌 테를 원하면 한 줄 수정이다.
6. **검사 범위**: K3-C2·K3-C4는 이번 범위대로 대기·준비만 넣었다. 템플릿의 attack·death 항목은 K3-2에서 원본 그대로 돌린다.

## 6. 메인 세션이 할 일

1. 이 납품서를 `docs/art/deliveries/K3-boss-poses.md`로 저장한다.
2. **등록**: 이번에는 `BOSS_SPRITES`·`BOSS_SLOTS`·`atlas-spec`(idle·windup 그대로)과 굽기 순서(`k-bosses1.js`, `k-bosses2.js` 이미 포함)를 바꿀 것이 없다.
   - `BOSS_PORTRAITS`도 그대로 써도 된다. 천칭 face가 (342,155)에서 (342,159)로 내려갔지만 중심 [330,158]·배율 0.34 구도는 그대로 맞다(`k3-portraits`).
3. **확인 요청**: `PN.bossesB.anchors('balance').face`를 읽는 코드(레티클·피격 섬광 등)가 있으면 y가 +4 바뀌었다.
4. **굽기**
   - `npm run build:atlas`: chapter-01 도살자·간수, 02 입, 03~05 여제·전령·천칭의 대기·준비가 바뀐다.
   - `npm run build:ui-art`: 보스 초상 12장과 이야기 패널 outro-1~5(통치자 그림)가 바뀐다. **outro-1에서 '딩—'이 빠진다(출시 막음 해소).**
   - 그 뒤 `npm run test:unit`.
5. **화면 검사**: `npm run test:visual`. 골든 갱신은 명시 검토 뒤에만 한다. 볼 장면:
   - 1-5, 1-10, 2-10, 3-10, 4-10, 5-10 보스
   - 보스 배너 초상
   - 이야기 패널 outro-1~5
   - 1024×720에서 여제 눈 고리와 천칭 눈
6. **렌더러**: 새로 쓸 옵션이 없다.
7. **커밋 항목**: ART-07·ART-08(얼굴·글자, 이야기 패널 막음 포함), D-14.

## 7. 알려진 한계와 관찰

- **이번 범위 밖의 가짜 눈 후보** (고치지 않았다. art-director 판단 요청)
  - 천칭 P3 가슴 코어 `k-bosses2.js:746`: 먹 구슬 + ink300 테 + paper50 점이 2배에서 눈알로 읽힌다.
  - 전령 P3 톱니 코어의 paper50 허브 원(r5): `parts.herald` ph≥3.
  - 천칭 허리띠 장식 `k-bosses2.js:702`: 먹 원 + ink300 테.
  - 도살자 칼날 테의 paper50 리벳 4개 일렬 `k-bosses1.js:209`.
  - 제안: 종이 점을 빼거나 초승 모양으로 바꾸고, 리벳은 ink300으로 누른다.
- **도살자 준비 자세**: 가까운 어깨가 봉투 눈구멍 대부분을 덮는다. 기존 구도이고 바꾸지 않았다. K3-2 공격 자세에서는 얼굴을 가리지 않게 한다(지시서 §1.7).
- **간수 종이학(game)**: ink300 패널 위 ink300 평면이라 거의 선만 보인다. 의도한 누름이다.
- **천칭 눈**: 1x에서 약 3px 폭 초승으로 rev 2의 전체 고리보다 작다. 여전히 몸에서 가장 밝은 점이다.
- **도살자 game 입**: 0.4배에서는 짧은 꿰맨 띠로 보이고 X 하나하나는 0.8배부터 갈린다. 156px 표시의 한계다.
- **사람 원화가 필요한 부분**: 킷 출력은 바이블 §15에 따라 잠정 아트다.
  - 간판 고깃덩이의 최종 그림
  - 여제 눈꺼풀과 눈물의 붓맛
  - 봉투 종이 주름
  - 범종 주물 질감
  - 최종 외곽선과 블랙 스팟
  - 판독 시험(n ≥ 8)

---

# 검수 1차 — art-director · 2026-10-03

대상: `docs/art/deliveries/K3-boss-poses.md`(K3-1)를 지시서 `docs/art/briefs/boss-poses.md` §1.1의 1~2단계(§2 F-A1~F-B3, §2.3)와 대조했다. 모든 상태를 직접 렌더하고 `--check`를 돌렸다. 렌더는 모두 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k3r1-*.png`에 있다.

## 0. 판정: 수정 후 합격

- **K3-1 범위는 합격 기준을 모두 충족한다(렌더로 확인).**
  - 출력 전체의 `<text>`가 0개다. 출시를 막던 '딩—'이 빠졌다.
  - F1이 납품서 값과 23줄 모두 같다.
  - 셀 마스크 결과는 `nothing painted`다.
  - 48px 실루엣이 그대로다.
  - 6보스 얼굴이 모두 한 시점으로 정리됐다.
- **작업자 판단 요청 6건(§5)은 모두 받아들인다**(§4).
- **K3-1f에서 고칠 것은 필수 2건이다.** 둘 다 범위 밖이던 P3 가짜 눈이다.
  - 천칭 P3 가슴 코어: 1x에서도 눈알로 읽힌다.
  - 전령 P3 톱니 허브: paper50 점이다.
- **같은 라운드에 넣을 권장은 6건이다.**
- 위 건들은 모두 기존 대기·준비 출력을 바꾼다. K3-2는 "F2 = F1" 규칙(지시서 §1.4)을 따르므로 **K3-2 전에 K3-1f로 고치고 F1′을 다시 기록해야 한다.**
- **도살자 준비 자세의 얼굴 가림은 다음 차수로 미룬다**(§5).
- 일정: K3-1f를 짧게 따로 돌리고, 합격하면 한 번만 굽기를 권한다.
  - '딩—' 막음을 지금 바로 풀려면 현재 코드로 먼저 구워도 된다. 굽기는 결정적이라 K3-1f 뒤에 다시 구우면 된다.

## 1. 렌더와 `--check` 결과 (직접 실행)

| 렌더 | 무엇 | 결과 |
|---|---|---|
| `k3r1-fingerprint` | K3-C1 지문, 측정용이라 check 없음 | 23줄 모두 납품서 F1과 같다. META `01d09a8a`, empress anchors `915f9002`, herald anchors `15df39d0` = F0. balance anchors `54938ee6` |
| `k3r1-audit` | 색·글자 감사(art·game × P1~3) | 대기 0/0/0, 준비 0/12/0(입 0/18/0), 광폭 6/0/0. **옵션 공간 전체 `<text>` 0** |
| `k3r1-states-A-game`·`-A-art`·`-B-game`·`-B-art` | 6보스 × 12상태 × 2 LOD | 4장 모두 ok |
| `k3r1-mono-all` | silhouette·mono 72상태 | ok |
| `k3r1-cell-A`·`-B` | K3-C2 셀 마스크(대기·준비) | 각 `FAIL …: nothing painted` 한 줄 = 합격 |
| `k3r1-lineup48` | 48px | ok. `a2c-lineup48-existing`과 같은 실루엣 |
| `k3r1-portraits`(@2x)·`k3r1-portraits-84`(1x) | K3-C9 | ok |
| 얼굴 크롭 | butcher-face-game-6x·windup-6x·head-1x2x·sign-4x, gaoler-face-game-8x·strip-08·props-4x·bell-px, maw-faces-6x, empress-faces-6x·face-1x·art-story-scale, herald-faces-6x·p2p3-2x·scroll-px, balance-eye-8x·chest-8x | 모두 ok |
| 1x 화소 에뮬레이션 | `k3r1-faces-1x-px`, `k3r1-bodies-1x-px`, `k3r1-fakeeyes-1x-px` (§9 템플릿) | ok |
| `k3r1-story-rulers` | 이야기 패널 호출(phase 3, art, fx:false, α0.42) | ok. '딩—' 없음 |
| `k3r1-anchors-print`, `k3r1-paper50-inventory` | 측정 | — |

**`--check` FAIL 2건은 내 시험 식의 고정 id 때문이고 모듈 문제가 아니다.**
- `k3r1-butcher-head-scales`: 고정 id `nonebh`.
- `k3r1-butcher-mouth-mock-1x2x`: 목업 clip id를 다시 썼다.

**kit error**
- 첫 렌더(`k3r1-fingerprint`, check 없음)에서 한 번 `kit error: Cannot access 'DRAW' before initialization`가 났다. 이후 실행에서는 나지 않았다.
- `k-bosses1.js`·`k-bosses2.js`에는 `DRAW` 식별자가 없다(두 파일을 끝까지 읽어 확인).
- 동시에 수정 중인 K4·K5 모듈의 일시 오류로 본다. 어느 파일인지는 미확인이다.
- 보스 모듈은 그보다 먼저 로드되므로 보스 판정에 영향이 없다.

## 2. 지시서 항목·합격 기준 대조

| 항목 | 합격 기준 | 결과 |
|---|---|---|
| 공통 K3-C1 | 바뀌어야 할 줄만 바뀜 | **확인** |
| 공통 K3-C2·C4·C5 | nothing painted, 실루엣 동일, text 0, 준비 신호색 오늘과 같음 | **확인** |
| F-A1 간수 | P1 paper50 = 열쇠구멍 테·눈 + 빛 조각 3 | **확인**. 인벤토리상 game·art 각 6개 = 테·눈·조각 3 + 안 쓰는 defs `p40` |
| | 유곽 원 없음 | **확인**. 1x에서 유곽 두 칸은 동공 없는 회색 판이고 눈으로 읽히지 않는다 |
| | P3 영혼 눈 없음, 물고기·종이학 누름 | **확인** |
| F-A2 입 | 한 눈선 y244, 두 동공이 +x 윗꺼풀에 닿음 | **확인**(대기·준비·광폭 6배) |
| | glow 좌표, 잉걸불 ink300 | **확인** |
| F-A3 도살자 | text 0, 간판이 4배·1x에서 글자로 읽히지 않음 | **확인**. 걸린 고깃덩이/북채 모양으로 읽힌다 |
| | 도장 원 없음, 큰 점 무늬 없음 | **확인** |
| | 0.4배에서 눈·먹물·입 분리 | 눈·먹물 2·입 띠가 따로 보인다. X 하나하나는 2x부터 갈린다(납품서와 같은 관찰). 12.6 간격에서는 원래 1x에서 X가 갈리지 않으므로 수용 |
| F-B1 여제 | 두 눈 같은 크기, 머리 좌표 Δy 0 | **확인** |
| | 1x에서 고리 ≥1px, 흰 점 0 | **확인**. 1x 에뮬레이션에서 고리 아래 U가 밝은 1px로 남는다 |
| | 초상에서 엄한 반쯤 감은 눈 | **확인**. 홍채 아래 흰자가 보이는 삼백안이라 엄하게 읽힌다 |
| F-B2 전령 | scale(0.69,1) = 종구 27/39 | **확인** |
| | 두건 안 종이 0, face 앵커 불변 | **확인** |
| F-B3 천칭 | 눈 원, 앞 테 가림 | 가림 game 31%·art 25%로 확인. 기준 20~30%를 1%p 넘지만 지시서 표 자체의 계산값이 31%라 수용 |
| | 걸쇠·축에 고리+원판 없음, mono 동일 | **확인** |
| | face 앵커 | [342,159]·[339.23,183.29] **확인** |
| §2.3 API | rev 3 문구, game LOD 규칙, 간판 기호, 눈 규칙 | **확인**. 문서 정정 권장 1건(§6 R8) |

## 3. 얼굴 진단 (크기별, 입체파 여부)

6종 모두 시점이 하나다. 두 시점이 섞이는 곳은 없다(확인).

| 보스 | 구조 | 1x(게임, `k3r1-faces-1x-px`) | 2x·초상 84px | 남은 것 |
|---|---|---|---|---|
| 도살자 | 3/4 봉투, 눈구멍 하나 | 흰 눈 + 먹물 2 + 입 띠가 따로 보인다 | 입이 왼쪽 아래로 비뚤다. 봉투 가면이라 수용(§4-1) | 준비 자세에서 가까운 어깨·팔이 눈을 거의 다 가린다(`k3r1-butcher-face-windup-6x`, 기존 구도) |
| 간수 | 8° 기운 범종의 열쇠구멍 눈 | 가장 밝은 점이 열쇠구멍 눈 하나다 | ok | P3 영혼(paper300)은 크지만 눈보다 어둡다. 수용 |
| 입 | 정면 화구, 한 눈선 | 두 흰 눈이 오른쪽을 본다 | 찡그린 정면 눈 | 광폭에서는 동공이 glow에 씻긴다. 의도 |
| 여제 | 정면 로켓, 같은 두 눈 | 흰 가면에 어두운 두 눈 | 엄한 눈 + 눈물 | ① 광폭: 두 후광이 겹쳐 밝은 렌즈가 생기고 "고글"로 읽힌다(R5). ② art 얼굴 쐐기 d20 점이 이야기 패널 배율에서 점선 입처럼 찍힌다(R6) |
| 전령 | 종구 평면의 문자판 | 기울어진 시계판 | ok | P3 몸통 허브 paper50(**필수 F2**). 두루마리 꼭지 둘이 "◉≡◉" 작은 얼굴로 읽힌다(R4) |
| 천칭 | 접시에 선 일식 눈 | 흰 초승 | ok | **P3 가슴 코어가 진짜 눈알이다(필수 F1)**. 1x·2x·이야기 패널(outro-5)에서 몸 한가운데 두 번째 얼굴이 된다. 허리띠 장식이 고리+원판이다(R3) |

## 4. 작업자 판단 요청(§5) 판정 — 모두 수용

1. **도살자 game 입 자리를 옮긴 것: 수용.**
   - `k3r1-butcher-mouth-mock-6x`·`-1x2x`에서 지시 자리 목업과 비교했다.
   - 지시 자리에서는 1x에서 눈→먹물→입이 한 기둥으로 붙어 뭉친다. 납품안은 세 표식이 분리된다.
   - 접힘선을 y177에서 끊어 입이 모서리를 넘는 면 충돌도 보이지 않는다.
   - art(입이 눈 아래)와 game의 입 위치가 다른 것은 API에 적혀 있다. 출시 그림(아틀라스·초상)은 모두 game이다. 최종 위치는 사람 클린업이 하나로 정한다.
2. X 반폭 3.8·반높이 5.2 해석: 수용.
3. 간판 기호 좌표: 수용. 4배와 1x 모두 고깃덩이로 읽힌다.
4. 여제 네 건 모두 수용: art 바깥 고리 삭제, 셋째 기포 이동, hot 반지름 = rx, 눈물 'end'. 광폭 후광 겹침은 권장 R5로 다룬다.
5. 천칭 걸쇠 L자 빛 테: 수용. 바이블 §6-3(좌상단 림)에 맞다. 1x에서는 베벨로 읽힌다.
6. 검사 범위(대기·준비만): 수용. K3-2에서 템플릿 원본을 돌린다.

## 5. 범위 밖 후보(§7)와 추가 발견: 배치

| 항목 | 근거 렌더 | 심각도 | 배치 |
|---|---|---|---|
| 천칭 P3 가슴 코어 `k-bosses2.js:746` | `k3r1-balance-chest-8x`, `k3r1-fakeeyes-1x-px`, `k3r1-story-rulers` | 고침(바이블 §10.2-2 "한 곳") | **이번 수정 K3-1f 필수** |
| 전령 P3 허브 paper50 `k-bosses2.js:544` | `k3r1-fakeeyes-1x-px`, `k3r1-herald-p2p3-2x` | 고침 | **K3-1f 필수** |
| 천칭 허리띠 장식 `k-bosses2.js:702` | `k3r1-balance-chest-8x` | 권장 | K3-1f |
| 도살자 리벳 paper50 4개 `k-bosses1.js:209`(+ 날 하이라이트 `:207`) | `k3r1-butcher-sign-4x`, inventory | 권장(paper50은 얼굴 전용) | K3-1f |
| (추가) 전령 두루마리 꼭지 둘 `k-bosses2.js:478` | `k3r1-herald-scroll-px` | 권장(점 두 개 나란히) | K3-1f |
| (추가) 여제 광폭 후광 겹침 `k-bosses2.js:142-146`, `:330` | `k3r1-empress-faces-6x`, `k3r1-empress-enraged-mock` | 권장 | K3-1f |
| (추가) 여제 art 쐐기 d20 `k-bosses2.js:322` | `k3r1-empress-art-story-scale` | 권장(outro-3, α0.42) | K3-1f |
| (추가) `k-bosses1.js:2` 주석 "do not hand-edit the kit copy" | — | 권장(문서) | K3-1f |
| 도살자 준비 자세 얼굴 가림 `k-bosses1.js:333`(headT), `:305-307`(deltN), `:342-344`(근팔) | `k3r1-butcher-face-windup-6x`, `k3r1-faces-1x-px` 4행 | 고침이지만 포즈 수정이다 | **다음 차수**. 머리를 숙여 돌진하는 0.62초 자세로 자연스럽게 읽히고, 고치려면 준비 자세를 다시 짜고 F를 재기록해야 한다. 후보: windup headT `rotate(-6 262 206) translate(-12,2)` 근처(계산상 눈이 어깨·팔에서 20 이상 떨어진다. 미검증) |

## 6. 수정 요청 K3-1f (kit-artist, 렌더 이름 `k3f1-`)

**바꾸면 안 되는 것**
- 박스·피벗·발·r·gameScale·META·anchors 키와 값.
- 48px 실루엣. 바꾸는 것은 모두 기존 윤곽 안이다.
- `eyeBubble`·`eyeEclipse` 등 `PN.bossesB._` 도우미의 기본값 출력. 다른 모듈이 쓸 수 있다.

**F1. (필수) 천칭 P3 가슴 코어 → 먹 구슬** (`k-bosses2.js:746`, `B.parts.balance`의 `rims`)
- 지울 것:
  - paper50 점 `circle (199,220) r3.4`
  - 원 전체를 두른 ink300 테
  - 아래 ink300 호 `M 188,224 A 15 15 …`
- 남길 것: 먹 원 `(203,224) r13`. 테는 먹이나 없음.
- 더할 것:
  - 좌상단 ink500 초승 하나: `M 213.57,216.43 A 13 13 0 1 0 195.43,234.57 A 13 13 0 0 1 213.57,216.43 Z`(최대 두께 4.2).
  - ink300 비백은 좌상단 1/4 호에만 1.2×li 이하로: 예 `M 191.4,219.6 A 13 13 0 0 1 199.4,211.5`.
- 금지: 고리+원판, 흰 점.

**F2. (필수) 전령 P3 톱니 코어** (`k-bosses2.js:544`)
- `circle r17 paper50 opacity 0.24`를 지운다.
- 허브 `circle (196,224) r5`의 fill을 `K.ch4.deep`로 바꾼다. stroke는 ink, `f(1.6*X.li)`.
- P3 표식은 점선 지운 판 + 톱니 + 드립으로 남는다.

**R3. (권장) 천칭 허리띠 장식** (`:702`)
- fill `K.ink`·stroke `K.ink300`을 fill `K.ink500`·stroke `K.ink`(같은 굵기)로 바꾼다. 속 고리 없는 마개로 만든다.

**R4. (권장) 전령 두루마리 꼭지** (`:478` `knob`)
- 안쪽 먹 타원 `ell(xx,yy,r*0.3,r*0.42)`을 지운다.
- game에서는 fill을 `K.ink500`으로 낮춘다. art는 ch4.deep을 유지해도 된다.

**R5. (권장) 여제 광폭 후광 하나로**
- `eyeBubble(X,x,y,r,hot,glow=true)`에 6번째 인자를 더한다. 기본 출력은 바뀌면 안 된다.
- `head()`에서 En일 때 `<g opacity="0.35">` 안에 두 원 `(185,99)`·`(201,99)` r = `f(erx*2.1)` paper50을 한 번만 넣는다.
- `eye()`의 En 분기는 `eyeBubble(X,x,y,erx,true,false)`를 부른다.
- 목업 `k3r1-empress-enraged-mock` 오른쪽 칸이 목표다.

**R6. (권장) 여제 art 얼굴 쐐기** (`:322`)
- art도 `K.paper300` 평면으로 한다(game과 같게).

**R7. (권장) 도살자 칼날**
- `:209` 리벳 fill `K.paper50` → `K.ink300`(먹 테 유지).
- `:207` 날 하이라이트 `K.paper50` → `K.paper300`.
- 두 LOD 모두. API-bosses1 `:147`의 "4 paper.50 dots" 문구도 고친다.

**R8. (권장, 문서)**
- `k-bosses1.js:2` 주석을 rev 3 문구로 바꾼다. 출력은 그대로다.
- API-bosses2 `:10` 천칭 가림을 "game 31% / art 25%"로 맞춘다.
- `:59-60` 전령·천칭 P3 설명을 F1·F2에 맞춰 고친다.

**합격 기준**
- K3-C1 → F1′ 기록.
  - 같아야 하는 줄: gaoler `f173768d/d9b7c682/ffd3cc06`, maw `993583d6/b9f45988/b72be510`, META `01d09a8a`, empress anchors `915f9002`, herald anchors `15df39d0`, balance anchors `54938ee6`, bossesA anchors `none`.
  - 바뀌는 줄: herald·balance 3줄씩. R5·R6을 하면 empress, R7을 하면 butcher.
- K3-C2: `nothing painted`.
- K3-C3 4장, `k3r1-mono-all`과 같은 72상태: ok.
- K3-C4 실루엣 동일, K3-C5 값 동일, text 0.
- §9 템플릿(1x)에서 P3 천칭 가슴·전령 몸통에 흰 점과 고리가 0개.
- `k3r1-story-rulers`와 같은 호출에서 천칭 가슴에 눈알이 없다.

## 7. K3-2에 넘길 것

- K3-2는 F1′에서 시작한다. P3 파손 층(가슴·허브)은 K3-1f판을 쓴다.
- 도살자 windup의 `anchors().face`는 그려진(가려진) 눈 자리로 두고, API에 "준비 자세에서 어깨에 가린다"고 적는다. attack은 지시서 §1.7대로 눈이 보여야 한다.
- 1x 판정(K3-C3·C8)에 §9 에뮬레이션을 더한다.

## 8. 합격(K3-1f) 뒤 메인 세션

- 굽기:
  - `npm run build:atlas`: 6보스 대기·준비 프레임이 바뀐다.
  - `npm run build:ui-art`: 보스 초상 12장과 outro-1~5가 바뀐다.
  - 그 뒤 `npm run test:unit`.
- `npm run test:visual`. 골든 갱신은 명시 검토 뒤에만 한다. 볼 장면:
  - outro-1: '딩—' 없음
  - outro-3: 여제 얼굴
  - outro-5: 천칭 가슴에 눈알 없음
  - 보스 배너 초상 12장
  - 1-5 도살자: 1x 봉투 얼굴
  - 1-10 간수: 밝은 점이 열쇠구멍 하나
  - 2-10 입
  - 3-10 여제: 평상·광폭
  - 4-10 전령
  - 5-10 천칭: P3 포함
  - 1024×720(0.8배)에서 여제 눈과 천칭 눈
- `artifacts/visual/actual/`은 보지 못했다(미확인).

## 9. 1x 화소 에뮬레이션 템플릿 (이번에 만든 판정 도구)

- 8배 렌더를 1 게임 px 칸으로 박스 평균해 점 샘플링한다.
- 실제 굽기의 리샘플과 똑같지는 않은 근사치다.
- 셀 viewBox를 바꾸면 다른 부위도 볼 수 있다. A는 셀 폭 ÷ 0.4, B는 셀 폭 ÷ 0.5로 맞춘다.

```
node scripts/art-review-sheet.mjs expr --name k3f1-faces-1x-px --scale 8 --check --crop 0,0,206,138 --expr '(function(){var n="px"+(window.__px=(window.__px||0)+1);var k=[];for(var i=0;i<64;i++)k.push(1);var W=206,H=138;var flt="<filter id=\""+n+"\" filterUnits=\"userSpaceOnUse\" primitiveUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\""+W+"\" height=\""+H+"\"><feConvolveMatrix order=\"8\" kernelMatrix=\""+k.join(" ")+"\" divisor=\"64\" targetX=\"0\" targetY=\"0\" edgeMode=\"duplicate\" preserveAlpha=\"true\" result=\"avg\"/><feFlood flood-color=\"#fff\" x=\"0\" y=\"0\" width=\"0.125\" height=\"0.125\" result=\"dot\"/><feOffset in=\"dot\" dx=\"0\" dy=\"0\" x=\"0\" y=\"0\" width=\"1\" height=\"1\" result=\"cell\"/><feTile in=\"cell\" x=\"0\" y=\"0\" width=\""+W+"\" height=\""+H+"\" result=\"grid\"/><feComposite in=\"avg\" in2=\"grid\" operator=\"in\" result=\"smp\"/><feMorphology in=\"smp\" operator=\"dilate\" radius=\"0.45\"/></filter>";var B=[["A","butcher",[225,115,80,80],"#B8AC93"],["A","gaoler",[195,92,80,80],"#B8AC93"],["A","maw",[166,204,80,80],"#ABADB4"],["B","empress",[165,69,64,64],"#ADB4AA"],["B","herald",[286,132,64,64],"#BBAE94"],["B","balance",[310,127,64,64],"#ABA5AC"]];var R=[{phase:1},{phase:1,enraged:true},{phase:3},{phase:1,windup:true}];var s="";B.forEach(function(b,c){R.forEach(function(r,j){var o={};for(var key in r)o[key]=r[key];o.shadow=false;var m;if(b[0]==="A"){o.lod="game";o.halo=true;o.fx=true;m=PN.bossesA.draw(b[1],o);}else{o.detail="game";m=PN.bossesB.draw(b[1],o);}var v=b[2];s+="<svg x=\""+(c*34+2)+"\" y=\""+(j*34+2)+"\" width=\"32\" height=\"32\" viewBox=\""+v.join(" ")+"\"><rect x=\""+v[0]+"\" y=\""+v[1]+"\" width=\""+v[2]+"\" height=\""+v[3]+"\" fill=\""+b[3]+"\"/>"+m+"</svg>";});});return "<g><defs>"+flt+"</defs><g filter=\"url(#"+n+")\"><rect x=\"0\" y=\"0\" width=\""+W+"\" height=\""+H+"\" fill=\"#888\"/>"+s+"</g></g>";})()'
```

- P3 몸통 확인은 `k3r1-fakeeyes-1x-px`와 같은 방식이다: `--scale 6`, kernel 6, 셀 = viewBox × 0.5. herald `120 120 210 210`, balance `120 110 260 210`.

## 10. 사람 원화가 필요한 곳 (바이블 §15)

- 도살자 입의 최종 위치를 art·game 하나로 정하기.
- 여제 윗눈꺼풀: 지금은 직선 절단이라 기계적이다. 곡선과 붓맛이 필요하다. 광폭 과녁 눈의 무게도 손봐야 한다.
- 범종 유곽(art 유두)과 주물 질감, 봉투 주름, 간판 고깃덩이 최종 그림.
- 도살자 준비 자세의 머리·어깨 재구성(다음 차수).
- 최종 외곽선, 블랙 스팟, 판독 시험(n ≥ 8).

---

# 수정 납품 1 (검수 1차 반영) — K3-1f · kit-artist · 2026-10-03

검수 1차 §6의 필수 F1·F2와 권장 R3~R8을 모두 넣었다. 기존 대기·준비 출력이 바뀌므로 F1′을 새로 기록했다(F1′의 줄 판정은 합격 기준과 맞다).
- §5의 도살자 준비 자세 얼굴 가림은 손대지 않았다.
- §5에서 수용된 6건도 그대로 두었다.
- 지시서 §3 포즈(K3-2)는 하지 않았다.

**시작 확인.** 손대기 전 `k3f1-fingerprint-start`가 F1과 23줄 모두 같았다. 이번 라운드 실행에서 kit error는 한 번도 나지 않았다.

## 1. 바꾼 함수와 줄 (줄 번호는 납품 시점)

| 항목 | 파일:줄 (함수) | 바꾼 것 |
|---|---|---|
| **F1** 천칭 P3 가슴 코어 | `k-bosses2.js:756-759` (`parts.balance`의 `rims`, ph≥3) | paper50 점 (199,220) r3.4, 원 전체의 ink300 테, 아래 ink300 호를 지웠다. 이제 먹 원 (203,224) r13(테 없음) + 좌상단 ink500 초승(지시 경로 그대로, 최대 4.2) + 좌상단 1/4 ink300 비백 `M 191.4,219.6 A 13 13 0 0 1 199.4,211.5`(1.2×li)다 |
| **F2** 전령 P3 톱니 코어 | `k-bosses2.js:551-553` (`parts.herald`, ph≥3) | paper50 r17 원(α0.24)을 지웠다. 허브 (196,224) r5는 fill `K.ch4.deep`, stroke ink `f(1.6*X.li)`다. P3 표식은 점선으로 지운 판 + 톱니 + 드립이다 |
| R3 천칭 허리띠 장식 | `k-bosses2.js:710-712` | fill `K.ink500`, stroke `K.ink`(굵기 `f(1.4*X.li)` 그대로). 속 고리 없는 마개다 |
| R4 전령 두루마리 꼭지 | `k-bosses2.js:481-485` (`H.scroll`의 `knob`) | 안쪽 먹 타원을 지웠다. game fill은 `K.ink500`, art는 `K.ch4.deep`을 유지했다 |
| R5 여제 광폭 후광 | `k-bosses2.js:142-148` (`eyeBubble`), `:330-335` (`head()`) | `eyeBubble(X,x,y,r,hot=false,glow=true)`에 6번째 인자를 더했다. 기본 출력은 같다. En일 때 `<g opacity="0.35">` 안에 (185,99)·(201,99) r=`f(erx*2.1)` paper50 원을 한 번만 넣고, 눈은 `eyeBubble(X,x,y,erx,true,false)`로 그린다 |
| R6 여제 art 얼굴 쐐기 | `k-bosses2.js:323-325` | art도 `K.paper300` 평면이다(game과 같다) |
| R7 도살자 칼날 | `k-bosses1.js:188`(주석), `:208`, `:210` (`A.butcherCleaver`) | 날 하이라이트 paper50 → paper300, 리벳 4개 fill paper50 → ink300(먹 테 유지). 두 LOD 모두다 |
| R8 문서 | `k-bosses1.js:2` | 주석을 "rev 3(K3, 2026-10): 킷 사본을 직접 고쳤다. concept/work 원본은 이 판보다 오래됐다."로 바꿨다. 출력은 그대로다 |
| R8 문서 | `API-bosses2.md:10` | 천칭 가림을 "game 31% / art 25%"로 고쳤다 |
| R8 문서 | `API-bosses2.md:59-60` | 전령·천칭 P3 설명을 F2·F1에 맞췄다 |
| R8 문서 | `API-bosses1.md` 칼날 edge 줄 | "4 paper.50 dots"를 "paper.300 highlight, 4 ink.300 rivets in ink rims"로 고쳤다 |
| 문서 추가 | `API-bosses2.md` | "K3-1f" 표(6건)를 더했다. 여제 표의 광폭·쐐기 행을 고쳤다. `_.eyeBubble` 인자 설명을 더했다 |
| 문서 추가 | `API-bosses1.md` | rev 3 표에 R7 행을 더했다. 초점 규칙에 한 줄을 더했다 |

- 바꾸면 안 되는 것은 그대로다: 박스·피벗·발·r·gameScale, META, anchors의 키와 값, 48px 실루엣.
- `eyeBubble`·`eyeEclipse`의 기본값 출력도 그대로다.

## 2. F1′ 표 (K3-C1, `k3f1-fingerprint.png`)

| 줄 | F1 | F1′ | 판정 |
|---|---|---|---|
| butcher art / game / sil | d843285e / c19b48a4 / 9b3a9ea6 | bdf0ae90 / 6cab299e / fca0141e | 바뀜(R7). sil은 마크업만 바뀌었고 실루엣 픽셀은 같다 |
| **gaoler art / game / sil** | f173768d / d9b7c682 / ffd3cc06 | f173768d / d9b7c682 / ffd3cc06 | **같음** |
| **maw art / game / sil** | 993583d6 / b9f45988 / b72be510 | 993583d6 / b9f45988 / b72be510 | **같음** |
| empress art | e3af225e | c5e6c483 | 바뀜(R5·R6) |
| empress game | eba6c81e | 79e8edd4 | 바뀜(R5) |
| empress mono | 15c30767 | 15c30767 | 같음. K3-C1의 mono 묶음에는 광폭 상태가 없고(R5 미적용), R6은 art만 바꾼다 |
| **empress anchors** | 915f9002 | 915f9002 | **같음** |
| herald art / game / mono | c12955c3 / aceeeb9c / 86278331 | 267db51c / a1f75007 / 83b3e54c | 바뀜(F2·R4) |
| **herald anchors** | 15df39d0 | 15df39d0 | **같음** |
| balance art / game / mono | 12cd70bb / b0984109 / dbc61831 | 8864a79f / aee2a309 / 3ace1808 | 바뀜(F1·R3) |
| **balance anchors** | 54938ee6 | 54938ee6 | **같음** |
| **bossesA META** | 01d09a8a | 01d09a8a | **같음** |
| **bossesA anchors** | none | none | **같음** |

K3-2는 이 F1′에서 시작한다(F2 = F1′).

## 3. 검사 결과

렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`

### `--check` 결과 전문
```
ok   k3f1-balance-chest-p3-8x        ok   k3f1-balance-chest-p3-art-8x
ok   k3f1-herald-p3-torso-6x         ok   k3f1-herald-p3-torso-art-6x
ok   k3f1-empress-enraged-6x         ok   k3f1-empress-enraged-art-6x
ok   k3f1-empress-face-art-6x        ok   k3f1-butcher-sign-art
ok   k3f1-butcher-sign-game          ok   k3f1-faces-1x-px
ok   k3f1-bodies-p3-1x-px            ok   k3f1-story-rulers
ok   k3f1-story-balance-chest        ok   k3f1-states-A-game
ok   k3f1-states-A-art               ok   k3f1-states-B-game
ok   k3f1-states-B-art               ok   k3f1-mono-all
ok   k3f1-lineup48                   ok   k3f1-portraits
FAIL k3f1-cell-A: nothing painted    (K3-C2 합격 문구)
FAIL k3f1-cell-B: nothing painted    (K3-C2 합격 문구)
```
- `--check` 없이 돌린 것(측정용): `k3f1-fingerprint-start`, `k3f1-fingerprint`, `k3f1-audit`.
- kit error는 0이다.

### 합격 기준 대조

| 기준 | 결과 |
|---|---|
| K3-C1 F1′ | 같아야 할 줄이 모두 같다. 바뀐 줄은 herald·balance 각 3줄, butcher 3줄(R7), empress art·game(R5·R6) |
| K3-C2 | A·B 모두 `nothing painted` 한 줄씩 |
| K3-C3 4장 + 72상태 | `k3f1-states-A-game`·`-A-art`·`-B-game`·`-B-art`(phase 1~3 × 대기·준비 × 평상·광폭, 두 LOD)와 `k3f1-mono-all`(silhouette·mono 72상태) 모두 ok |
| K3-C4 | `k3f1-lineup48`. 대기·준비 12개 실루엣이 이전과 같다 |
| K3-C5 | 대기 0/0/0, 준비 0/8/0(입 0/12/0)으로 이전과 같다. **text tags: 0** |
| §9 1x, P3 몸통 | `k3f1-bodies-p3-1x-px`(scale 6, kernel 6, 셀 = viewBox × 0.5, herald `120 120 210 210`, balance `120 110 260 210`, P1·P3·P3 광폭) |
| | 전령 P3 몸통: 흰 점 0, 고리 0. 놋쇠 허브는 어두운 톱니 위의 황갈색 점이고, 점선으로 지운 판 테가 P3 표식으로 남는다 |
| | 천칭 P3 가슴: 흰 점 0, 닫힌 고리 0. 먹 구슬 위에 왼쪽 위로 열린 초승만 있다 |
| | 허리띠 장식은 어두운 마개 점이다 |
| §9 1x, 얼굴 | `k3f1-faces-1x-px`(§9 템플릿 그대로). 6보스 × 4상태가 검수 때와 같은 판독이고, 여제 광폭은 겹침 렌즈 없이 후광 하나다 |
| 이야기 패널 호출 | `k3f1-story-rulers`, `k3f1-story-balance-chest`. `build-ui-art.mjs:223-231`을 재현했다: phase 3, art, halo·shadow false, bossesA는 fx false, 배율 0.52/0.56, (340,252) 기준 −14° 회전, α0.42. **천칭 가슴에 눈알이 없다** |
| 확대 확인 | 가슴 코어 8배(game·art), 전령 몸통 6배(game·art, 두루마리 꼭지 포함), 여제 광폭 6배(game·art, 목업 오른쪽 칸과 같은 후광 하나), 여제 art 쐐기 평면, 도살자 칼날 4배(리벳 ink300·하이라이트 paper300) |
| 초상 | `k3f1-portraits`(K3-C9). 여제 광폭 초상에서 후광이 하나로 보인다. 나머지는 이전과 같다 |

## 4. 다르게 한 것

- **F1 비백 경로.** 지시 예시 경로를 그대로 썼다. 시작점 (191.4,219.6)은 중심에서 12.4라 r13 원 위가 아니다. 반지름 13 호로 그리면 초승 바깥 가장자리 바로 안쪽에 놓인다. 닫힌 고리가 생기지 않아 그대로 두었다.
- **R4.** art 꼭지는 허용대로 `ch4.deep`을 유지했다.
- **empress mono 줄이 그대로인 이유.** 위 F1′ 표에 적었다.
- **§9 P3 몸통 렌더.** 검수 §9의 설명(`--scale 6`, kernel 6 = order 6·divisor 36, 샘플 칸 1/6, viewBox·셀 규칙)으로 식을 만들었다. 검수자의 `k3r1-fakeeyes-1x-px` 원문 식은 없어서 같은 방식으로 다시 썼다.
- **이야기 패널 호출.** 장 랜드마크 배경 없이 종이 바탕 + 장 base 띠 위에 그렸다. 보스 호출·배치·회전·투명도는 굽기 코드와 같다.

## 5. 메인 세션 참고 (합격 뒤)

굽기와 화면 검사 절차는 검수 §8대로다. K3-1f로 추가로 바뀌는 그림은 다음과 같다.
- **chapter-01**: 도살자 전 프레임(칼날 리벳·하이라이트)
- **chapter-03**: 여제 광폭 프레임
- **chapter-04**: 전령 전 프레임(두루마리 꼭지), P3 프레임(몸통 코어)
- **chapter-05**: 천칭 전 프레임(허리띠), P3 프레임(가슴 코어)
- **초상**: 여제 광폭
- **이야기 패널**: outro-3(여제 art 쐐기), outro-4(전령 P3 코어와 art 꼭지), outro-5(천칭 가슴 구슬과 허리띠)

## 6. 알려진 한계와 관찰

- **전령 P3 허브.** 1x에서 어두운 톱니 위의 작은 황갈색 점으로 보인다(흰색이 아니고 지시대로다). 몸통에 둥근 표식을 아예 없애려면 허브 원을 지우는 안이 있다. 톱니 자체의 `ch4.deep` 안쪽 테는 남는다.
- **(관찰, 범위 밖)** 전령 외바퀴 허브(`circ(WH,16)` ink700 + `circ(WH,7)` ch4.deep)도 1x에서 비슷한 "어두운 고리 + 황갈색 점"이다. 검수에서 다루지 않았고 기존 그림이라 그대로 두었다.
- **(관찰)** 전령 P3의 점선으로 지운 판 테(paper300 대시)는 1x에서 점선 "U"로 보인다. 검수 지시대로 P3 표식으로 남겼다.
- **사람 원화가 필요한 곳**: 검수 §10과 같다.

---

# 검수 2차 — art-director · 2026-10-03

## 0. 판정: 합격 (K3-1 + K3-1f)

- 필수 F1·F2와 권장 R3~R8이 1차 §6의 처방대로 들어갔다. 코드를 읽고 렌더로 확인했다.
- 회귀는 없다. `--check`, 셀 마스크, 48px 실루엣, 신호색·글자 감사가 모두 통과했다.
- 작업자가 적은 F1′ 23줄이 내가 다시 돌린 지문과 같다. **K3-2의 시작 기준은 F1′이다.**
- 이번 라운드의 모든 실행에서 kit error는 0건이다. K4·K5 모듈 오류도 나지 않았다.
- 렌더는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k3r2-*.png`에 있다.

## 1. 렌더와 `--check`

| 렌더 | 결과 |
|---|---|
| `k3r2-fingerprint` | F1′과 같다. butcher `bdf0ae90/6cab299e/fca0141e`, gaoler·maw는 F1 그대로, empress `c5e6c483/79e8edd4/15c30767`, herald `267db51c/a1f75007/83b3e54c`, balance `8864a79f/aee2a309/3ace1808`. anchors 3줄·META `01d09a8a`·`none`은 그대로 |
| `k3r2-audit` | 신호색 칸이 1차와 같다. `<text>` 0 |
| | game P1·P3 paper50: herald 1/1, balance 1/1(얼굴뿐), butcher P1 2(눈 + 안 쓰는 defs 패턴) |
| `k3r2-states-A-game`·`-A-art`·`-B-game`·`-B-art`, `k3r2-mono-all`(72상태) | 모두 ok |
| `k3r2-cell-A`·`-B` | `nothing painted` 한 줄씩 = 합격 |
| `k3r2-lineup48` | ok. 1차와 같은 실루엣 |
| `k3r2-portraits` | ok. 여제 광폭 후광이 하나로 보인다 |
| 확대·1x 에뮬레이션 | `k3r2-balance-herald-p3-6x`, `k3r2-p3-cores-px`, `k3r2-faces-1x-px`, `k3r2-empress-enraged-6x`, `k3r2-misc-checks`, `k3r2-herald-body-px`, `k3r2-empress-p3-heart`, `k3r2-empress-body-px` 모두 ok |
| `k3r2-story-rulers` | 이야기 패널 호출. ok |

## 2. 1차 §6 대조

| 항목 | 확인 |
|---|---|
| F1 천칭 P3 가슴 | `k-bosses2.js:759` 먹 구슬 + ink500 초승 + 1/4 ink300 비백. 흰 점과 닫힌 고리가 없다. 1x에서 빛 받은 먹 구슬로 읽히고 눈알이 아니다(바이블 §6-3 처리와 같다) |
| F2 전령 P3 | `:553` paper50 후광 삭제, 허브 ch4.deep + 먹 테 |
| R3 허리띠 | `:712` ink500 마개 |
| R4 두루마리 꼭지 | `:485` 속 먹 타원 삭제, game ink500. "◉≡◉" 읽힘이 사라졌다 |
| R5 여제 광폭 | `:144`에 `eyeBubble` 6번째 인자 추가(기본 출력 같음), `:333` 공유 후광 하나. 렌즈가 없어졌다 |
| R6 | `:325` art 쐐기 평면. 이야기 패널 배율에서 점선 입이 없어졌다 |
| R7 | `k-bosses1.js:208,210` 하이라이트 paper300, 리벳 ink300 |
| R8 | 주석과 API 두 문서 반영 |

작업자의 "다르게 한 것"은 모두 수용한다.
- F1 비백의 시작점은 반지름 12.4에 있다. 내 예시 경로를 그대로 쓴 것이고 닫힌 고리가 생기지 않으니 무해하다.

## 3. 작업자 관찰 2건 판단

1. **전령 P3 허브(1x 황갈색 점): 그대로 둔다.**
   - 흰색이 아니고 동공도 없다. 놋쇠 톱니의 허브로 읽힌다.
   - 허브를 지우면 톱니 자체의 ch4.deep 안쪽 테가 구멍 위로 드러난다. 그러면 "고리 + 어두운 가운데"가 되어 오히려 눈에 가깝다.
2. **전령 외바퀴 허브(어두운 고리 + 황갈색 점): 그대로 둔다.**
   - 살이 있는 바퀴의 축으로 읽힌다(`k3r2-herald-body-px`).
   - 대비가 낮다(ch4.deep 대 ink700). 후광 톱니와 같은 놋쇠 재질 언어다.
   - 최종 원화에서 사람이 판단한다.

## 4. 새로 본 것 (막지 않음, 다음 차수)

- **여제 P3 자물쇠 심장** `k-bosses2.js:355-356`
  - paper50 열쇠구멍과 paper50 α0.2 원판이 몸 한가운데의 두 번째 밝은 점이다. 1x에서 흰 점 하나로 보인다(`k3r2-empress-body-px`, `-p3-heart`).
  - 눈 모양은 아니다. 처방: 열쇠구멍을 paper300으로 하고 α0.2 원판을 지운다.
- **여제 치마 종이학의 가까운 날개 `K.paper`** `:256`
  - 1x에서 얼굴 유리와 같은 밝기의 흰 티로 보인다. game에서 paper300으로 누르기를 권장한다.
- **전령 P3 점선 판 테**(paper300 대시)
  - 1x에서 점선 "U"로 읽힌다. 천칭처럼 먹 테의 찢긴 가장자리로 바꾸는 안을 다음에 검토한다.
- **천칭 P3 art(이야기 패널)**
  - 가슴 구멍으로 바닥이 먹 구슬 둘레의 밝은 들쭉날쭉한 고리처럼 보인다(`k3r2-story-rulers`). "검은 해"로 읽혀 5장 주제와 맞으므로 수용한다.
- **도살자 준비 자세 얼굴 가림**: 1차 판단대로 다음 차수.

이 건들은 모두 기존 출력을 바꾼다. K3-2(F2 = F1′) 뒤 별도 항목으로 묶어 처리하기를 권한다.

## 5. K3-2 발주 때 작업자에게 넘길 말

1. 기준은 F1′(위 23줄)이다. F2의 모든 줄이 F1′과 같아야 한다. `bossesA anchors`만 새로 생긴다.
2. 얼굴 함수에 `open | out | dead` 인자를 두고, 모든 포즈가 같은 함수를 부른다(지시서 §1.10-2). `out`은 다음과 같다:
   - 도살자·간수·입: 종이 눈 → 먹
   - 여제: 고리 → ink300
   - 전령: 문자판 종이 면 → ink300
   - 천칭: 코어가 원판을 채우고 초승 → ink300
3. 처치 프레임에는 f3 유물의 종이 ✕ 말고는 paper50을 두지 않는다.
   - 여제 P3 자물쇠 열쇠구멍도 처치 경로에서는 ink300 이하로 한다.
   - 새 코드 경로라 F2에 영향이 없다.
4. 광폭 attack은 같은 `head()`를 거쳐 여제 공유 후광(R5)을 그대로 받는다.
   - P3 코어(천칭 먹 구슬, 전령 놋쇠 허브)는 attack에도 얹히고 모양을 바꾸지 않는다.
5. 도살자 windup의 `anchors().face`는 그려진(어깨에 가린) 눈 자리로 두고, API에 적는다. attack에서는 눈이 보여야 한다(§1.7).
6. 검사에 1x 에뮬레이션 템플릿을 더한다(납품서의 검수 1차 §9).
   - K3-C3·C8의 1x 판정과 P3 몸통(`--scale 6`, kernel 6)에 쓴다.
7. `PN.bossesB._` 도우미의 기본값 출력을 바꾸지 않는다(`eyeBubble`에 인자가 하나 늘었다).
8. "kit error"가 나면 다른 모듈의 일시 오류일 수 있으니 다시 돌린다. 보스 모듈은 먼저 로드된다.

## 6. 합격 뒤 메인 세션

- 굽기: `npm run build:atlas` → `npm run build:ui-art` → `npm run test:unit`.
  - 바뀌는 그림은 1차 §8 목록에 납품서 §5(K3-1f) 목록을 더한 것이다.
- `npm run test:visual`. 골든은 명시 검토 뒤에만 갱신한다. 1차 §8의 장면에 더해 볼 것:
  - 4-10 전령 P3 몸통 놋쇠 허브
  - 5-10 천칭 P3 먹 구슬
  - 3-10 여제 광폭 후광 하나
  - outro-5 가슴에 눈알 없음
  - outro-3 여제 art 쐐기 평면
- `artifacts/visual/actual/`은 보지 못했다(미확인).
