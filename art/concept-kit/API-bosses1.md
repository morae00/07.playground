# API — `k-bosses1.js` · `PN.bossesA` (라운드 보스 A) — rev 3

잉크 도살자 `butcher` (Ch1 St5 · dash) · 종탑 간수 `gaoler` (Ch1 St10 · rings) · 용광의 입 `maw` (Ch2 St10 · flame).
먹극화 · PAPER NOIR INK. Style bible §4 (lines), §5 (shading), §7.3 (size), §10.1/§10.3 (bosses), §12.2/§12.4 (telegraphs and bullets).

**rev 3(K3, 2026-10): 킷 사본을 직접 고쳤다. concept/work 원본은 이 판보다 오래됐다.** 작업 지시서 `docs/art/briefs/boss-poses.md` §2(얼굴·글자 묶음, K3-1)를 반영했다. 호출 형식, 옵션 이름, 박스·피벗·발·판정 반지름·`gameScale`, `META`의 키와 값은 그대로다. 기존 옵션의 출력은 아래 표만큼 **의도적으로** 바뀌었다. 지문 F0 → F1과 렌더는 납품서 `docs/art/deliveries/K3-boss-poses.md`에 있다. 포즈(`pose`·`frame`, `anchors()`)는 K3-2에서 더했다(아래 "K3-2 포즈" 절). 기존 옵션의 출력은 K3-2에서 바뀌지 않았다(지문 F2 = F1′).

| 보스 | 바뀐 것 | LOD |
|---|---|---|
| 공통 | **그림 안 글자 0.** 출력 어디에도 `<text>`가 없다(rev 2는 지문 범위에서 54개) | art · game |
| butcher | 간판 글자(art `<text>` 정육점, game에서 "HOI"처럼 읽히던 직선 획)를 **걸린 고깃덩이 기호 하나**로 바꿨다(아래 "간판 기호") | art · game |
| butcher | 봉투의 도장 원과 '肉'을 지웠다. 원 안의 원은 가짜 눈이 된다 | art · game |
| butcher | 봉투 game 재드로잉(아래 "game LOD 규칙") | game |
| gaoler | P2 풍경의 「딩—」 `<text>`를 지웠다. 소리 호 2줄은 남는다. 이야기 패널 outro-1에 구워지던 글자다 | art |
| gaoler | 풍경 물고기와 등롱 속 종이학을 눌렀다: game ink.300 평면, art paper.300 + 40% 망점. 물고기 눈 원·아가미 획은 art에서만, ink.300으로 | art · game |
| gaoler | 철창 속 영혼의 눈 2개를 지웠다(모든 페이즈). 얼굴은 열쇠구멍 하나다 | art · game |
| gaoler | 범종 유곽 칸(game)에서 원을 뺐다. 두 칸이 "두 눈 + 열쇠구멍 코"로 읽혔다 | game |
| maw | 두 눈을 한 눈선(y 244)에 맞추고 두 동공이 플레이어(+x)를 본다. 광폭 glow도 같은 중심으로 | art · game |
| maw | 화구 바닥 잉걸불 점 7개: paper.300 → ink.300 | art · game |
| butcher | (K3-1f, 검수 1차 R7) 칼날 강철 테의 하이라이트 paper.50 → paper.300, 리벳 4개 paper.50 → ink.300(먹 테 유지). paper.50은 얼굴(눈구멍) 전용이다 | art · game |

**초점 규칙(rev 3).** 보스 얼굴(약점) 밖의 종이 소품은 game에서 ink.300 평면, art에서 paper.300 + 40% 망점으로 누른다. 도살자 칼날의 하이라이트·리벳도 paper.50을 쓰지 않는다(K3-1f). 간수 phase 1의 paper.50 요소는 열쇠구멍 테·눈과 그 아래 빛 조각 3개뿐이다(준비 '!', P2·P3 종이 균열·이 빠짐은 페이즈 표식이라 예외). 얼굴 밖에 "원 + 가운데 점", "고리 + 원판", "점 두 개 나란히"를 새로 두지 않는다.

**눈 규칙(rev 3).** 얼굴은 각도 하나다. 입(maw)은 정면 화구라서 두 눈이 같은 높이에 있고, 비대칭은 크기·높이(원근)가 아니라 크게 뜬 눈 대 가늘게 뜬 눈으로 둔다. 두 동공은 모두 +x쪽 윗꺼풀에 닿는다.

| maw 눈 | 눈 (`eye(x, y, w, h, tilt)`) | 동공 | 광폭 glow |
|---|---|---|---|
| 왼눈(크게 뜸) | (186, 244), 13.5 × 8.6, tilt +1 | (191.5, 242.6) r 4 — 윗꺼풀 y ≈ 239.9 | (186, 244) rx 18 ry 12 |
| 오른눈(가늘게 뜸) | (227, 244), 10.4 × 6.2, tilt −1 | (231.5, 242.4) r 3.2 — 윗꺼풀 y ≈ 239.1 | (227, 244) rx 14 ry 10 |

`META.maw.face` (206, 244)는 두 눈의 가운데로 그대로다. 광폭에서는 지금처럼 눈 크기만 ×1.25다.

**game LOD 규칙(rev 3).** game은 축소본이 아니라 156px용 재드로잉이다.

| 보스 | game에서만 다른 것 | 이유 |
|---|---|---|
| butcher 봉투 | 주름 획 4개 생략. 아래 띠는 20% 망점 대신 paper.300 평면. 눈 먹물 `drip(266,160,20,5)`·`drip(282,163,13,4.2)`(art는 38·22 길이의 가는 줄) | 0.4배에서 큰 점 무늬·긴 막대가 얼굴을 덮었다 |
| butcher 입 | 꿰맨 X 5 → **3**: 간격 12.6, 반폭 3.8 × 반높이 5.2, 선 2.6(×LW). 중심 (243.1,191.7)·(255.7,192.4)·(268.3,190.8). 입 선은 `M 236,190 C 252,195 270,192 290,184`. 앞 접힘선은 입 위 y 177에서 끊는다 | 가까운 팔이 봉투의 x ≈ 280 오른쪽을 가린다. 지시 자리(262.2~287.4)면 셋째 X가 팔 뒤로 들어간다. P3 먹물(x 262)은 둘째·셋째 X 사이로 흐른다 |
| gaoler 유곽 | 칸(평행사변형)을 대각선으로 나눠 아래·오른쪽 삼각형만 ink.500, ink.300 테를 그 위에 다시 | 오목한 칸의 빛 받는 면. 원을 빼서 두 번째 눈 쌍을 없앴다 |
| gaoler 종이 소품 | 물고기·종이학 ink.300 평면(먹 1.5~1.8 테), 물고기 눈·아가미 없음 | 열쇠구멍 눈(약 6px)보다 밝고 큰 종이 면이 없게 |

**간판 기호(rev 3, 사용자 결정 Q3·Q5).** 칼 간판에는 글자 대신 걸린 고깃덩이 하나를 그린다. 좌표는 `A.butcherCleaver`의 칼 프레임(손잡이 축 x = 0, 날이 +y)이고, 간판 틀 x −21~17, y 28~96 안이다. 망점 위에 얹어 game에서도 한 덩어리로 읽힌다.

| 부분 | 값 |
|---|---|
| 갈고리 | 먹 한 획 `M -2,29 L -2,35 C -2,40.5 6,40.5 6,35`(J, 끝이 오른쪽으로 말려 올라감), 굵기 2.4(×LW) |
| 뼈 끝 | 둥근 막대 6 × 16(rx 2.6), `rotate(16 1 46)`, paper.300 + 먹 1.5(×LW). 보이는 길이 약 10. 원 끝(뼈 혹) 없음 |
| 고깃덩이 | 먹 물방울꼴, y 46~84, 폭 최대 26(x −14~12), 아래가 둥글다 |
| 지방 결 | paper.300 곡선 획: art 2줄(2.2·1.6), game 1줄(최대 폭 4.05 ≥ 3.6) |

직선 획 묶음, 원 + 점, 글자·숫자처럼 읽히는 획은 쓰지 않는다. P2 칼 균열은 기호 위로 지나간다.

**rev 3 검사.** 두 LOD × phase 1~3 × 준비 × 광폭 72상태와 실루엣 6장 모두 `--check` ok, 굽기 셀 마스크(K3-C2) 밖 칠 0, 48px 실루엣은 rev 2와 같다.

## K3-2 포즈 (rev 3, 2026-10): `pose` · `frame` · `anchors()`

지시서 `docs/art/briefs/boss-poses.md` §1·§3.1~§3.3과 검수 2차 §5를 따랐다. **`pose`가 없거나 `'idle'`이면 출력은 K3-1f와 한 글자도 다르지 않다**(지문 F2 = F1′, 납품서). 새 옵션 두 개와 메서드 하나를 더했고, 기존 호출 형식은 그대로다.

| opt | 기본 | 뜻 |
|---|---|---|
| `pose` | `'idle'` | `'idle'` \| `'attack'` \| `'death'`. 모르는 값은 `'idle'` |
| `frame` | `0` | death 0~3. 정수로 자르고 0~3으로 묶는다. 3이 먹 웅덩이. 다른 pose에서는 무시 |

- **attack**은 준비 자세의 다음 박자(팔로스루) 한 장이다. `windup`을 무시하고 '!'·긁힘 데칼·노력선·점선 타격 호를 그리지 않는다. `phase` 1~3의 파손 층과 `enraged`(먹 불꽃, 백열 눈, 산호 외곽 펄스)를 받는다. 호박은 0이다(입의 예열도 끈다).
- **death**는 `phase`·`windup`·`enraged`를 무시하고 P3 파손에서 시작한다. 산호·호박이 없다. 처치 프레임의 paper.50은 f3 유물의 ✕뿐이다: `draw()`가 처치 프레임의 body·fx에서 `#FAF6EC`를 paper.300으로 바꾼다(P2·P3 종이 균열·이 빠짐·조각). ✕는 소문자 `#faf6ec`로 적어 이 치환을 피한다(굽기 `COLOR_MAP`은 대소문자를 가리지 않으므로 구현값은 같다). 쓰이지 않는 defs 패턴 `p40`에는 paper.50이 그대로 있다(칠하지 않음).
- 포즈 FX와 날아가는 파편은 `fx` 층이다(`silhouette`과 `fx:false`에서 빠진다). 바닥 접지 타원은 `ground`.
- 상태 수: 보스마다 attack 6장(페이즈 3 × 평상·광폭) + death 4장. 기존 12장은 그대로다.

**얼굴 함수(지시서 §1.10-2).** 보스마다 얼굴을 그리는 함수가 하나이고, 모든 포즈가 그 함수를 부른다. 포즈는 얼굴 묶음 전체에 이동·회전만 건다(처치 f1처럼 몸을 누를 때도 얼굴은 squash 밖에서 그린다).

| 보스 | 함수 | 각도 | `'out'`(f0~f2) | `'dead'`(f3 유물) |
|---|---|---|---|---|
| butcher | `A.butcherFace(X, state, m)` | 봉투 3/4 | 눈구멍(P3 큰 눈 포함)이 먹, 먹물만 남는다 | 눈구멍 = 종이 ✕ |
| gaoler | `A.gaolerBell(X, state, m, split)` | 범종 8° | 열쇠구멍 눈·빛 조각 3이 먹, 안쪽 테 ink.300. `split`: 위에서 테까지 가르는 굵은 균열 + 두 번째 이 빠짐 | 열쇠구멍 눈 = 종이 ✕ |
| maw | `A.mawFace(X, state, m, opt)` | 정면 화구 | 두 눈이 먹. `opt.broken` 아래 이빨 2개 부러짐, `opt.noKeystone` 쐐기돌 빠짐 | 두 눈 = 종이 ✕✕ |

- `opt.at`(maw 공격): 눈 높이 ×0.7(왼 6.0, 오른 4.3), 동공은 cy − 0.3h에서 +x 윗꺼풀에 닿는다. 아래 이빨 줄 +8(입이 벌어짐), 예열·잉걸 바닥 끔, 화구 바닥 y 310에서 검은 불꽃 3(x 176·206·236, 높이 26·28·24, 꼭대기 y ≥ 282, paper.50 심 폭 ≤ 3).
- ✕ = `A.xMark(X, x, y, m)`: 팔(중심→끝) game 7 / art 5(기준 ≥ 6 / ≥ 4), 종이 획 3.8 / 2.4, 먹테(종이 밖 총폭) 4.4 / 3(기준 ≥ 3.6 / ≥ 2). `m` = `A._inv(유물 변환)`이면 누운 유물 안에서도 화면에 똑바로 선 정사각 ✕가 된다(적 처치 데칼 문법).

**리그.** `A.RIG[id]`(butcher·gaoler·maw)는 변환 연산 목록(`['translate',x,y]`, `['rotate',deg,cx,cy]`, `['scale',sx,sy]`, 앞이 바깥)이다. 같은 목록에서 SVG transform 문자열(`A._tfs`)과 점 변환(`A._xf`)을 만들므로 `anchors()`가 그린 자리를 그대로 따라간다. `A._inv(ops)` = 선형 부분의 역행렬.

### 보스별 attack

| 보스 | attack (리그 값) | 48px 단서 |
|---|---|---|
| butcher | 돌진하는 동안 계속 보이는 "달리는 자세": 상체 UP `translate(0,8) rotate(15 200 320)`, 머리 `rotate(-2 262 206) translate(-4,0)`, 먼 팔 `rotate(9 92 150)`(갈고리가 뒤로). 가까운 팔 어깨 (362,200) → 팔꿈치 (366,128) → 주먹 (336,74), 식칼 `translate(336,74) rotate(160)`: **가장 높은 점이 식칼**(y ≈ −51). 뒷다리 엉덩이 (170,300) → 무릎 (128,346) → 발목 (96,372), 나막신 앞코가 (70,392)에 닿고 뒤꿈치가 25° 들림. 앞다리는 준비의 `legFw`/`bootFw` | 머리 위로 솟은 식칼 |
| | FX(`fx`): 뒤쪽 속도선 3획(x 12~74, 길이·각도가 서로 다름, 'start' 먹), 뒷발 앞코의 먹 튐. ground: 앞발 (300,393) rx 70 + 뒷발 작은 타원 | |
| | 틈 채움 `atFill`(body 맨 뒤 먹 다각형 2개): 치켜든 주먹↔혹, 먼 주먹·갈고리↔뒷다리 | |
| gaoler | 열쇠를 수직으로 내리꽂아 활이 음통을 친다: 열쇠 `translate(287,242) rotate(-3)`, 활 (274.9,10.3), 가까운 팔뚝 limb (352,206)→(300,240). 범종 `rotate(8 200 190)` 그대로. 풍경 셋 모두 `loud`(왼 sw +24, 오른 −24, 앞 +16, 글자 없음). 등롱 `rotate(-20 46 256)` | 범종 옆 수직 열쇠, 바깥으로 튄 풍경 |
| | FX: 담묵 ink.300 파문 호 r 150·176(왼 160°~200°, 오른 −20°~20°), 음통 (262,24)의 4갈래 먹 충격 별(심 paper.300), 범종 양 옆구리 ink.300 진동선 1줄씩 | |
| | 틈: 새 좁은 틈 없음(`k3p-enraged-gaoler-z`) | |
| maw | 들었던 오른팔을 내리찍어 두 주먹으로 땅을 짚는다: 위 파이프 (284,204)→(350,244)는 대기와 같고, 아래 파이프 (350,246)→(352,340), 손목 칼라 (352,338), 주먹 `mawFist(X,352,368,1,true,1)`. 화구는 `mawFace(…, {at:true})` | 땅을 짚은 두 주먹 |
| | FX: 바닥 앞 검은 불꽃 5(x 130·170·206·242·282, 밑 y 390, 높이 32~56, 폭 20~26, paper.50 심, 줄지은 ΛΛΛ로 읽히지 않게 높이·폭·기울기를 조금씩 어긋나게), 그을음 `mawSoot(X, true)` | |
| | 틈 채움 `atFill`: 양 팔뚝 파이프↔배·밑판의 좁은 틈(폭 8~18) 두 곳 | |

### 보스별 death

| 보스 | f0 피격 | f1 무너짐 | f2 녹아내림 | f3 먹 웅덩이 |
|---|---|---|---|---|
| butcher | 봉투 눈 'out', 상체 `rotate(-7 200 320)`로 젖혀짐, 식칼이 주먹에서 빠짐(주먹이 펴짐), 갈고리 사슬 출렁임, 봉투 파편(`fx`) | 무릎 꿇기: 몸 squash 0.7(혹 y ≈ 155), 봉투는 squash 밖에서 앞으로 18° 처짐, 식칼은 앞 바닥에 눕는다(x 250~358) | 녹는 먹 언덕(꼭대기 ≈ 255), 구겨진 봉투가 오른쪽 위에서 미끄러짐(꼭대기 ≈ 242), 갈고리, art 종이 조각 3 | 웅덩이 (200,370) rx 165 ry 36. 누운 봉투 유물 (232,364) ×0.4 + 종이 ✕, 식칼이 웅덩이 왼쪽 가장자리에 눕고(간판 기호가 보임), 갈고리 하나 |
| gaoler | 열쇠구멍 눈·빛 조각 'out' + split 균열·두 번째 이 빠짐, 장갑 손가락이 펴짐(열쇠는 대기 자리), 등롱이 바닥 (46,360)에 떨어져 기욺 | 망토·외투 squash 0.7, 범종 `translate(0,97) rotate(-25 200 190)`(꼭대기 y ≈ 126), 열쇠가 비트 (300,392)를 두고 왼쪽으로 **40°** 넘어감(활 (54.5,99.4)) | 범종이 녹는 언덕 위에 옆으로 눕는다(꼭대기 ≈ 221), 열쇠는 언덕 뒤에 납작하게, 철창 문(창살 둘, 가로대 없음)이 언덕 오른쪽에 기대 떨어짐, art 종이 조각 3 | 웅덩이 (200,370) rx 165 ry 36. 옆으로 누워 반쯤 잠긴 범종(당좌 위, ×0.4, 수면에서 잘림) + 종이 ✕, 열쇠가 웅덩이를 비스듬히 가로질러 잠김, 풍경 하나 |
| maw | 두 눈 'out', 이빨 2개 부러짐, 그을음이 멈추고 ink.300 연기 2줄, 오른팔이 처짐(주먹 (346,352)) | 다리가 꺾여 squash 0.7 + 왼쪽으로 8° 기욺(파이프 꼭대기 y ≈ 128), 화구는 squash 밖, 파이프 2개 부러짐, 쐐기돌이 바닥에 떨어짐 | 무쇠 판이 쌓인 먹 언덕(꼭대기 ≈ 236), 화구가 언덕에 기대고, 파이프 둘이 눕는다, art 종이 조각 3 | 웅덩이 (200,370) rx 165 ry 36. 위를 보고 누운 화구 틀(×0.4) + 종이 ✕✕, 파이프 하나 가로놓임, 리벳 3개(높이가 서로 다름) |

- f3 높이: 웅덩이 위로 y 317보다 높이 솟는 것이 없다. 누운 소품 끝만 y 280까지(간수 열쇠 활의 탑 끝 ≈ y 281, 반대쪽 비트 끝은 웅덩이 앞으로 나온다).
- 키(대기 대비, 몸 기준·소품 제외): butcher f1 70%·f2 44%, gaoler f1 70%·f2 45%, maw f1 69%·f2 41%.

### `PN.bossesA.anchors(id, opts) → object` (K3-2, 새로 더함)

`draw`와 같은 옵션 정규화(`A._norm`)와 같은 리그에서 계산한다. 공통 키 `pivot:[200,257]`, `feet:[200,392]`, `r:135`에 보스별 키가 붙는다: butcher `head, face, muzzle, fist, cleaver`(날 중심), gaoler `head, face, muzzle, grip, bow`(열쇠 활 중심), maw `head, face, muzzle, fists:[왼,오]`. 모르는 id는 `draw`처럼 오류를 던진다.

| 상태 | butcher | gaoler | maw |
|---|---|---|---|
| idle | head [270,46] face [271,150] muzzle [358,321] fist [340,262] cleaver [359,324.2] | head [200,0] face [235,132] muzzle [210,121] grip [286,248] bow [361.5,28.6] | head [206,104] face [206,244] muzzle [206,284] fists [[58,368],[348,324]] |
| windup | **head [300,64]** face **[322.3,195]** muzzle [178.6,344.5] fist [236,314] cleaver = muzzle | **head [186,4]** grip [318,150] bow [285.7,−79.7] | idle과 같다 |
| attack | head [328.4,−43.8] face [310.5,182.4] muzzle = cleaver [313.8,12.9] fist [336,74] | head [272.3,−49.6] face [235,132] grip [287,242] bow [274.9,10.3] | muzzle [206,290] fists [[58,368],[352,368]] |
| f0 | head [165.8,48.2] face [251.5,135.4] muzzle [335,334.4] | head [224.8,3.7] face [234.9,132.3] bow [361.5,28.6] | head [202,2] face [206,244] fists [[58,368],[346,352]] |
| f1 | head [175,145.4] face [298.9,207.8] muzzle [315,384] | head [124.8,115.7] face [197.8,219.6] bow [54.5,99.4] | head [165,118.3] face [192.5,289.7] muzzle [197.5,329.4] |
| f2 | head [317,222.6] face [339.5,288.3] | head [294,216] face [238,271.5] bow [47.6,322.6] | head [196.5,224.1] face [217.3,329.8] |
| f3 | head [200,324] face = ✕ [247,354] cleaver [132.8,378.3] | head [260,313.2] face = ✕ [204,341.4] bow [111.5,301.4] | head [202.6,308.5] face = ✕✕ 가운데 [200.4,357.6] |

- 대기(`{}`)는 `META[id]`의 face·muzzle·head·fist/grip과 같다.
- 준비는 **그린 자리**다. butcher '!'는 `bang(300,64)`, gaoler '!'는 `bang(186,4)`이므로 head가 META(270,46)·(200,0)와 다르다. butcher 준비의 face [322.3,195]는 그려진 눈 자리이고, **준비 자세에서는 가까운 어깨·팔에 가린다**(기존 구도, 검수 1차 §5 "다음 차수"). attack에서는 눈이 보인다.
- 처치: face = 그 프레임의 꺼진 눈 자리, f3은 유물의 ✕ 중심(maw는 ✕✕ 가운데). head = 남은 덩어리 꼭대기 + 10 위. f2·f3의 muzzle·fist·grip·cleaver는 그 소품이 놓인 자리다.

**rev 2 (art-director rework).** The three bodies are redrawn. The calls, box, pivot, feet, hit radius and `gameScale` are unchanged, so existing scene code keeps working. What changed:
- Anchors moved: `face`, `muzzle` and `head` in `META` (see the table below).
- New anchors: `META.butcher.fist` and `META.gaoler.grip`.
- New option: `haloW`.
- New helper: `PN.bossesA.hitCircle()`.
- Visual extents changed (see the table).

## Load order
```html
<script src="kit/lib.js"></script>          <!-- PN.C, PN.taper, PN.halftone, PN.splat, PN.rng (required) -->
<script src="kit/sprites.js"></script>      <!-- only if you also place PN.heroSprite -->
<script src="kit/k-bosses1.js"></script>    <!-- this module -->
```
The module has no DOM access and uses only string building, so it also runs in Node with `global.window = {}`.
It does **not** need `PN.defs()`. Each call emits its own `<defs>` (patterns, clipPaths, filters) with a per-call id prefix (`bA<n>_`, and `bT<n>_` for telegraphs).

Verified in rev 2 with one page holding:
- all 72 draw variants (3 ids × 3 phases × windup × enraged × 2 LODs)
- 3 silhouettes
- every telegraph kind and stage
- the three `hitCircle` parts

Result: 2763 ids, 0 duplicates, 0 dangling `url(#…)`.

rev 3(K3, 2026-10): 킷 사본을 직접 고쳤다. concept/work 원본은 이 판보다 오래됐다. (rev 2까지는 `concept/work/bosses1/src/*.js`를 `build.sh`로 이어 붙인 사본이었다. 아래 `src/00-core.js` 같은 이름은 그 원본 기준이며, 킷 사본에서는 `k-bosses1.js`의 첫 블록이다.)

## `PN.bossesA.draw(id, opts) → string`
Returns `<g class="bossA bossA-<id>"><defs>…</defs>shadow · ground · body · fx</g>`.

| opt | default | meaning |
|---|---|---|
| `phase` | `1` | `1` \| `2` \| `3`. Damage is cumulative (P3 includes P2 marks). |
| `windup` | `false` | Windup pose (telegraph stage 1). It is a **separate drawing**, not a transform of idle (bible §15: windup is designed bigger and first), plus the amber `!` and pose FX. |
| `enraged` | `false` | Ink flame, white-hot eyes, and a **coral outline pulse 2px** sandwiched in ink (filter). This is the only coral on an enemy body. |
| `lod` | `'art'` | `'art'`: key-art weights, 5-unit halftone pitch. `'game'`: outline ×1.55 (about 4px at 156px), brush ×1.35, **halftone pitch 8** (3.2px at 1x), redrawn small details (rev 3 "game LOD 규칙" above: butcher bag, 유곽 cells, gaoler paper props). Neither LOD draws lettering (rev 3). |
| `halo` | `null` | `true` = knock-out halo in the chapter `env.base` colour (§5-6). A colour string gives a custom colour. |
| `haloW` | auto | **new**. Halo dilate radius in local units. Default: game 3.8 (= 1.5px at 0.4), art 3. Sheets use 2.6–2.8 at art scale 1.1–1.4 (about 3–4px). |
| `silhouette` | `false` | Flat `ink` silhouette (no shadow/ground/fx). Use it for 32/48px silhouette tests. |
| `shadow` | `true` | Ground shadow = hit display ellipse |
| `fx` | `true` | Windup `!`, scrape marks, soot plumes, enrage flames, P3 eave drips (gaoler) |
| `seed` | `3` | Turbulence seed for the brush wobble (the wobble is lighter in rev 2: art 1.5, game 1.0) |
| `pose` | `'idle'` | **K3-2.** `'idle'` \| `'attack'` \| `'death'` (anything else = `'idle'`). See "K3-2 포즈" above |
| `frame` | `0` | **K3-2.** death frame 0..3 (truncated, clamped); ignored by other poses |

### Local box, pivot, display size (identical for all three)
| key | value |
|---|---|
| local box | **400 × 400**, all bosses **face RIGHT**. Flip: `translate(x+400·s, y) scale(-s, s)`. No self-rotation (§7.1). |
| pivot (hit centre) | **(200, 257)** |
| hit radius | r54 world → **135 local** |
| feet | **y = 392** (pivot + r). Boots, clogs, fists and the key bit all stand on it. |
| ground shadow | ellipse centre (200, 331) = pivot + 0.55r, rx 135 / ry 55 (= hit diameter 108 × 44 px) |
| `gameScale` | **0.4**. Figure ≈ 156 px tall, width ≤ 160 px (1440×900, zoom 1.0) |
| place at world (wx, wy) | `translate(wx − 200·0.4, wy − 257·0.4) scale(0.4)` |

### Measured visual extents (pixel bbox, art LOD, local units)
| variant | x | y | width → px at 0.4 |
|---|---|---|---|
| butcher idle | 34 … 402 | 50 … 392 (drips 406) | 368 → 147 |
| butcher windup | 10 … 402 | 6 … 406 (effort lines, scrape decal) | 392 → 157 |
| gaoler idle | 4 … 400 | −20 … 392 (hem drips 414) | 396 → 158 |
| gaoler windup | 4 … 388 | **−132** (raised key bow) … 414 | 384 → 154 |
| maw idle | 22 … 384 | 12 pipes / −82 soot … 404 | 362 → 145 |

Atlas cells should pad about 140 units on top for gaoler windup and maw soot. Everything above the hit circle is "visual only" (§7.3).

### Per-boss anchors (`PN.bossesA.META[id]`)
| id | name | face (weak point / reticle) | muzzle (attack source) | head (`!` / status icon, bottom-centre) | extra | windup |
|---|---|---|---|---|---|---|
| `butcher` | 잉크 도살자 · INK BUTCHER | (271, 150) paper-bag eye hole | (358, 321) sign-board cleaver | (270, 46) clear of hump + bag | `fist` (340, 262) | 0.62 s |
| `gaoler` | 종탑 간수 · BELFRY GAOLER | (235, 132) keyhole eye (bell tilted 8°) | (210, 121) bell body = ripple / ring origin | (200, 0) above the bell loop | `grip` (286, 248) gauntlet on staff | 0.6 s |
| `maw` | 용광의 입 · FURNACE MAW | (206, 244) two eyes in the firebox | (206, 284) firebox mouth | (206, 104) over the finial | | 0.6 s |

`META[id]` also carries `chapter, stage, pattern, env` (chapter palette `{light, base, deep, spot}`), `box, pivot, feet, r, gameScale`.

### Rig and states (cut-out parts, §10.4)
Shared construction is in `src/00-core.js`:
- `X.limb(p0, p1, r0, r1)` builds a capsule limb with designed planes: an ink.500 lit crescent with a notched terminator on the key-light side, 60% dots and then a solid black spot on the underside, an ink.300 dry-brush rim, and a tapered shadow-side contour. `brk0`/`brk1` add 2px ink.300 break lines so limbs never merge with the torso.
- `X.C` lays tapered **shadow-side contour** strokes on the lower-right outlines. They swell mid-stroke, which gives the §4 +40% weight.
- `X.R` draws the ink.300 top-left rims.

**butcher.** Hunched 3/4 stance. The torso pitches forward about 15°, and a pointed trapezius hump rises behind a paper-bag head sunk to shoulder height.
- Parts:
  - bowed ink.700 trousers with a knee break, a stitched knee patch, and clogs with ink.500 toe caps
  - torso with a hump lit crescent (zigzag terminator), scapula plane, pec wedge and fat-fold highlights
  - apron waist strap and back-hip knife roll
  - far arm (upper arm, rolled cuff, forearm, clenched fist) holding the chain and meat hook
  - far shoulder cap
  - ink-soaked leather apron (ink.300 under 40% dots) with a black zigzag hem, belly crescent and running splash
  - paper-bag head
  - near shoulder cap and upper arm with a cuff
  - near forearm
  - sign-board cleaver in the fist
- The cleaver (`A.butcherCleaver`, frame: handle axis x = 0):
  - blade: 58×86 paper.300 slab under 40% dots with the hanging-meat sign glyph (rev 3 "간판 기호"; no lettering)
  - edge: ink.300 steel strip (14% of the width) with a paper.300 highlight, riveted with 4 ink.300 rivets in ink rims (K3-1f: paper.50 is for the face only)
  - handle: wrapped, with a ring pommel and a riveted ferrule
  - idle pose: tilted 17° off vertical
- The fist (`A.butcherFist`) has 4 ink.500 finger wedges with a 1.5px paper.300 rim, and a thumb over the top.
- Windup:
  - rigid upper body `translate(10,18) rotate(11 200 320)` (shoulders dropped, chest forward)
  - crouch-lunge legs redrawn
  - near arm swung back, and the cleaver **dragging on the ground behind him** (tip near (150,395), opposite the lane)
  - 3-stroke scrape decal with paper sparks
  - far arm swung out, effort lines, `!`
- P2: the apron is torn (ragged paper edge and flap), and the cleaver gets a paper crack.
- P3: the bag is half torn away, revealing an ink void with one big eye and heavier drips.
- Enraged: ink steam from the top of the bag.

**gaoler.** 범종 head tilted 8° toward facing.
- 당좌 medallion: a **true keyhole** (round top plus tapering slot, 3px ink frame, paper.50 inner rim, eye in the round part, 3 dripping light slivers).
- Tiled eave cape with **3 풍경 on visible cords**, hung from the two upturned tips and the front-left corner. Each has a bronze cup, a clapper, and a fish plate about 30 local long (rev 3: game flat ink.300, art paper.300 under 40% dots, eye and gill marks art-only in ink.300).
- Chest cage (the trapped soul has no eyes since rev 3), belt with the key ring on the left hip.
- Lantern arm: comes from under the left eave, and the gauntlet fist holds a paper lantern at hip height. Inside is a **folded-paper bird** (head, beak, tail, 2 wing folds, 1.5px ink; rev 3: game flat ink.300, art paper.300 under 40% dots).
- Tower-key staff (`A.gaolerKey`, frame: grip at 0,0):
  - crosses the body diagonally (idle rotation 19°: pagoda bow upper-right, stepped 3-tooth ward bit at the lower-left, 72 of 364 shaft = 20%)
  - an ink.300 gap outline separates it from the robe
  - gripped at chest height by `A.gaolerGauntlet` (plated back, thumb, 3 finger wedges)
- Windup: forearm raised, grip (318,150), staff `rotate(-8)`, bow high over the bell, dashed strike arc, `!`.
- P2: bell crack, and the left 풍경 swings and rings (2 sound arcs; the art-LOD 「딩—」 lettering was removed in rev 3).
- P3:
  - cage door hangs open on its hinge, padlock swinging, soul core exposed (paper.300)
  - second bell crack plus a **chip knocked out of the bell lip**
  - ink drips (ink.900 teardrops with a 1px ink.300 rim) off the eave tips and hem
- Enraged: black flame in the lantern.

**maw.** Cast-iron stove idol. The face is frontal: two eyes on ONE eye line (y 244), wide-open left vs narrowed right, both pupils looking +x (rev 3, "눈 규칙" above). One stovepipe arm is planted on clenched iron knuckles (4 blocky fingers plus a thumb block, `A.mawFist`). The other is lifted with a bent elbow in a **rivet collar**.
- Belly:
  - designed ink.500 lit crescent with a notched terminator
  - ink.500 dot band under the collar
  - plate seams curving round the volume, riveted along the curve
- Firebox: a **gothic pointed-arch frame** with a keystone, a lit inner bevel and a double-edge break line, plus grille teeth.
- Organ pipes: **V-cut organ mouths** (ink.500 V lip over a black slot, lip plate below).
- Soot = `A.mawSoot`: 1–3 tapered **dry-brush plumes** per pipe (flat ink.300, ragged turbulence edge) bending right, away from the key light, then a 20% dot tail.
- Windup: amber pre-heat inside the firebox with a paper ember bed, heat squiggles, `!`.
- P2: belly-plate crack and one snapped pipe.
- P3: left plate torn off (ember lattice), grille teeth broken, bleed drips.
- Enraged: black flames on all 5 pipes and the mouth, enlarged eyes.

### Ownership rules followed
- Bodies stay ink.900/700/500. Material patches (apron, key bit, sign board under dots) stay ≤ ink.300.
- Ink drips always run **down**.
- No cyan, violet or lime anywhere.
- Amber appears only in windup (`!`, pre-heat) and telegraphs.
- Coral appears only when enraged and on bullets / active zones.

## `PN.bossesA.hitCircle(opts) → string` (new)
The dashed hit circle in the **same local box as `draw`** (centre (200,257), r 135 = r54 world): paper.50 dashes over an ink.900 underlay.

| opt | default | meaning |
|---|---|---|
| `part` | `'full'` | `'full'`, `'back'` (upper half, emit **before** `draw`), or `'front'` (lower half, emit **after** `draw`, so feet sit on the circle bottom) |
| `px` | 1 | Local units per screen px (`1/scale`), so `w` and `dash` are in screen px |
| `w` | 1.2 | paper stroke width (px). The ink underlay is w + 2 px. |
| `dash` | `[3,3]` | dasharray (px) |
| `alpha` | 0.85 | group opacity |

Example (156px in-game dev overlay): `B.draw('gaoler',{lod:'game'}) + B.hitCircle({px: 2.5})` inside the same `scale(0.4)` group.

## `PN.bossesA.telegraph(kind, opts) → string`
Unchanged from rev 1. These are ground-plane telegraphs in the **same local units as `draw`** (1 world unit = 2.5 local), centred on (0,0). Place them with the same `scale(0.4)` as the boss, translated to the pivot / zone centre, and draw them *under* the boss.

| kind | opts | drawing (bible §12.2) |
|---|---|---|
| `dashLane` | `len=700, w=70, fan=150, stage, progress` | Lane along +x. The end fans to ±`fan` (3.8× homing). preview: dotted ink rim, solid part = `progress`, teardrop brush head, sparse amber hatch (2px/10px). imminent: hatch 5px pitch, 5px rim, chevrons. Use `w = 135` for the r54 body. |
| `dashTrail` | `len, w` | Dry-ink trail decal after the dash (3 s) |
| `tollRing` | `r=150, band=34, stage, progress` | Amber hatched annulus under the gaoler during windup (+12 ticks when imminent) |
| `ripple` | `r0=170, r1=420, n=3` | 담묵 concentric ripples that precede the ring shots |
| `ringShots` | `n=22, r=300, size=17, phase` | Bullets on a ring (see `bullet`) |
| `fireZone` | `r=130, stage: preview\|imminent\|active\|decal` | preview/imminent: hatched circle, coral core, ink flame symbol, 8 ticks. active: coral α0.55, ink-dot edge, black flames with paper cores, coral core. decal: harmless ink.300 soot. |

`PN.bossesA.bullet(x, y, r, angle)` draws an enemy bullet: ink-ball core, coral rim, ink outline, paper glint and a coral speed tail (§12.4). Use `r ≥ 18` local (≥ 14 px at 1x).

## Sheet
`concept/out/boss-sheet-1.png` (1600×1000) is built from `concept/work/bosses1/sheet.html`.

| file | contents |
|---|---|
| `sheet-a.js` | Hero panels (art scale 1.4 / 1.12 / 1.24), halo 2.6–2.8, dashed hit circle split back/front, title plates |
| `sheet-b.js` | Insets, phase strip with hit circles drawn **on top**, silhouettes on measured fixed slots (48px row, 50px enrage row), BEFORE header |
| `sheet-c.js` | Callouts in negative space, leaders ending on part edges |

The BEFORE crops are CSS `background-position` at 0.36 into `analysis/visuals-current-entity-sheet.png`: the whole polygon token plus its red dashed hit circle, with labels below the boxes. rev 1 is preserved in `concept/work/bosses1-v1/`.
