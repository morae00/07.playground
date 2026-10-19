# K10 무기 전장 효과 — 납품·검수 기록

지시서: `docs/art/briefs/arsenal-fx.md`(B7, 351628f). 킷: `art/concept-kit/k-arsenal-fx.js`, `API-arsenal-fx.md`.

## 1차 납품서

작성: kit-artist, 2026-10-16. 지시서: `docs/art/briefs/arsenal-fx.md`(B7, K10). §12 메인 세션 결정(Q1~Q13은 모두 권고안)을 따랐다.
이번 범위는 §8 납품 1이다. 뼈대 전부와 투사체 없는 22종의 평상·각성 전장 효과(lob은 착탄까지)를 넣었다. lob 비행(2차)과 각성 기믹(3차)은 넣지 않았다.
- 재개 기록: 작업 전 C8 기준값을 확인한 뒤 세션 한도로 멈췄다. 재개 후 파일 상태를 확인하고 그 자리부터 이어서 마쳤다.

### 1. 만든 파일과 done 목록

| 파일 | 내용 |
|---|---|
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js` | 새 모듈 `window.PN.arsenalFx`. `version '1.0'`, `SPEC.version '1.0-d1'` |
| `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md` | API v1(§8 항목 전부: 로드·의존, 호출·opts·잘못된 호출, META 44줄, 조각 표, SPEC 표·렌더러 규칙, layout·paths·lobPath 식과 jit 번호대, 층·LOD, 예산, C1~C15, 다르게 한 것, 사람 원화가 몫) |

- 이 두 파일 밖은 건드리지 않았다(`k-icons2.js`·`k-hazards.js`·`k-skills-vfx.js`·`k-icons.js`·`lib.js` 포함). 내려받은 것도 없다.
- 공개 함수: `K`, `ids`(44), `kinds`, `META`, `groups`(22), `overlays`(`[]`), `SPEC`, `jit`, `parts`, `stamp`, `layout`, `paths`, `lobPath`, `draw`, `overlay`. 형식은 지시서 §1.2와 같다.
- 의존이 없다. 다른 킷 모듈과 `lib.js` 도우미를 부르지 않는다. id를 쓰지 않는다(빈 `<defs>`, `kaf<N>_` 카운터만 있음).
- **done.fx = true (22종)**: inkLightning, brushDownpour, fallingScroll, seventhSeal, inkPulse, frostRing, thunderclap, silenceBell, inkPots, clusterPots, tarJar, meteorBrush, sparkThread, stormThread, frostChainlet, inkLance, wideBrush, crossStrokes, judgmentLine, inkOrbit, wardRing, eclipseHalo.
- 44종 모두 `done.lob = false`, `done.gimmick = false`다. `META.gimmicks`는 모두 `[]`이고, 투사체 22종의 `stages`는 `[]`다.
- 조각: **141장**, 박스 넓이 **343,592 단위²**. 1차 단계: strike `impact`, nova `burst`, lob `land`, chain `jump`, beam `stroke`, halo `sweep`(평상·각성).

### 2. API 요약과 무기별 요약

**원점·판정(V4, 지시서 §1.3 그대로)**
- 폭발 고리 중심선 = R. 띠는 R에 걸친다.
- halo는 R과 `inner`. beam은 반폭 w 캡슐(x 26부터 칠함). chain은 점 목록이다.
- 원점: 폭발 = 사건 중심, nova·halo = 주인공 발, beam = 시작점(+x = 방향), chain = 첫 점.
- `footClear` 26. 머리 위 물건은 (0, −66)에 두고 앵커 아래로 칠하지 않는다. 술·먹통은 앵커 뒤 26 이상에만 칠한다.
- 박스·앵커는 모두 지시서 표 그대로다(API §5).

**무기별 요약**: 물건 → 고리·선 문체 → 청록 요소 → 각성 변화. 모든 각성 물건에 §1.8(종이 1.0 + 먹 0.8 겹 테, 0번 장 5~6갈래 반짝임)을 적용했다.

| 무기 | 물건 | 고리·선 문체 | 청록 요소 | 각성 변화 |
|---|---|---|---|---|
| 먹번개 | 먹구름에서 내리꽂는 수직 번개(꺾임 5, 이웃 구간 길이 ≥ 30% 차이)<br>scorch 그을음 | 청록 실 고리, 틈 2~3 | 번개 심 | 위쪽 가지 하나 |
| 붓 폭우 | 비스듬한 붓 획(a 18°·64, b 26°·68)<br>납작하게 눌린 머리, 꼬리 붓털 비백<br>자국 s/m/l | 굵기 1.5~6의 찍은 띠, 틈 5~7 | 가장 긴 찍음 가운데의 젖은 결 | — |
| 족자 낙하 | 세로 족자(축봉·마개, 담묵 산 한 덩이 + 능선 한 획) | 앞 반원 종이 파문 둘 + 담묵 원 | 걸이 끈 | 아래 축봉의 종이 혀 |
| 일곱째 인장 | 옆모습 원기둥 도장 + 납작한 꼭지<br>인영 a/b/c(끊긴 테, 오른쪽 올가미 매듭) | 옅은 원판(한 시전은 합집합) + 얇은 테, 틈 2 + 0.92R 담묵 원 | 인면 테 | — |
| 먹 파동 | 없음(splash 먹 덩이) | 굵기 6~16의 검은 띠, 틈 3~4 | 바깥 앞선 호 | 띠 ×1.2 + 0.8R 얇은 고리 |
| 서리 고리 | 서릿발 3~4개를 묶은 부채 결정(안팎) | 종이 띠 α0.5 + 안쪽 서리 술 | 띠 심(한 바퀴) | 술 양쪽, 긴 결정 |
| 천둥 박수 | 32° 기운 옆모습 종이 손 둘<br>맞닿는 장: 오른손이 어긋나고 손끝에 섬광 | 꺾쇠 jag 고리(26 마디, 갈래 3, 12fps 깜빡임) | 섬광 심 | — |
| 침묵의 종 | 머리 위 종이 손종<br>먹 추를 청록 실로 묶음, 소리선 없음 | 매끈한 흰 고리 3겹 | 추 묶은 실 | 넷째 고리 0.58 |
| 먹단지 | 금 가는 흰 백자 → 큰 먹 튐 + 흰 조각<br>splat | 얇은 청록 고리, 틈 2 | 목 끈, 날아가는 끈 조각 | — |
| 송이 단지 | 작은 흰 단지 깨짐(사건 3~4개, scatter 70) | 얇은 고리, 틈 1 | 송이 끈 | — |
| 타르 항아리 | 입 넓은 검은 항아리<br>번들한 타르, 줄 셋, 갈라짐<br>pool | 고리, 틈 1 | 봉인 끈 | — |
| 유성 붓 | 머리부터 박힌 큰 붓 + 큰 먹 폭발 + 종이 섬광(flash)<br>crater, 갈라진 쐐기 비백 6~8 | 굵은 청록 고리, 틈 2 | 꼬리 끝 심 | 팔 늘어남 |
| 불꽃실 | 6갈래 종이 불꽃 | 처지는 실 호(sag 0.16, 번갈아) | 실 | 불꽃 청록 심 |
| 폭풍실 | 열린 바람 획(대각선으로 어긋나게) | 꼬인 두 가닥(한 가닥 꺾음, 깜빡임) | 실 번개 | — |
| 서리 사슬 | 얼음판 + 누운 결정 셋(r 12/19/28) | 흰 사슬 고리·막대, 혹 | 구간마다 고리 하나 | — |
| 먹창 | 창 뒤 술(앵커 뒤 26.4~52) | 가는 창대 + 잎 창날, 찌르고 물러남 | 술 매듭 띠 | 창날 ×1.2 + 그림자 선 |
| 넓은 붓 | 띠 머리의 큰 붓(종이 쇠테) | 넓은 종이 띠 α0.45, 들쭉날쭉 가장자리, 비백 줄 | 앞선 테 | 폭 ×1.2(자료) |
| 십자 획 | 찢겨 나는 종이 조각 | 네 방향 찢긴 종이 획(가운데 26 비움, 가늘어짐) | 앞 30% 심 | 심 45% |
| 심판선 | 목수의 먹통 옆모습(바퀴 하나) | 팽팽한 줄 + 떨림 잔상 2 + 점선 캡슐 | 먹줄 심 | 잔상 3 + 굵기 ×1.2 |
| 먹 궤도 | 깎인 먹 조각 | 먹 띠 α0.14 + 도는 종이 혜성 | 혜성 심 | 혜성 140° |
| 수호 고리 | 줄 매듭 2개(각성 3개) | 굵게 꼰 종이 줄 + 0.82→1 튕김 | 바깥 바느질 1/3 | 줄 폭 12 |
| 일식 테 | 청록 리본 두 가닥 | 넓고 가는 테 + 도는 먹 초승 그림자(α0.35) | 리본 | 초승 110° + 반대편 얇은 초승 |

### 3. 검사 출력 원문

모든 렌더 이름은 `k10-`로 시작하고, `--check`를 붙인 명령은 모두 `ok`였다(kit error 0). 원래 명령에 `--check` 플래그가 없는 C2·C6·C7·C8·C9·C10은 플래그 없이 지시서 그대로 돌렸고, 그 출력은 아래 원문이다.
- C1: `ok k10-c1-all`
- C3 묶음: `ok k10-c3-strike`, `k10-c3-nova-lob`, `k10-c3-lines`, `k10-c3-review2`, `k10-c3-lines2`
- C4: `ok k10-t1-boneMortar`, `k10-t1-chainSpark`, `k10-t1-voidMine`, `k10-t1-railSpear`, `k10-t1-halos`, `k10-t1-boneMortar-gray-ch3`, `k10-t1-chainSpark-gray-ch5`, `k10-t3-blind`, `k10-t3-awakened-labels`
- C15: `ok k10-c15-pairs`
- 추가: `ok k10-lod-reduced`(minimal·감소 모션·reduced·늦은 p·p 0), `k10-detail-*`, `k10-mix-deutan-0p8`

**C2**
```
frames=141 ok boxArea=343592 ok badParts=0
inkLightning/bolt f4 prog 0.24s box36x120 a18,112 target none ally info w:mark
inkLightning/bolt-awakened f4 prog 0.24s box36x120 a18,112 target none ally info w:mark
inkLightning/scorch f1 idx 0.6s box52x24 a26,12 target none ground deco w:decal
brushDownpour/stroke-a f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/stroke-b f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/stroke-a-awakened f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/stroke-b-awakened f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/mark-s f1 idx 0.9s box56x28 a28,14 target none ground deco w:decal
brushDownpour/mark-m f1 idx 0.9s box76x36 a38,18 target none ground deco w:decal
brushDownpour/mark-l f1 idx 0.9s box100x46 a50,23 target none ground deco w:decal
fallingScroll/scroll f4 prog 0.42s box52x104 a26,98 target none ally info w:mark
fallingScroll/scroll-awakened f4 prog 0.42s box52x104 a26,98 target none ally info w:mark
seventhSeal/seal f3 prog 0.3s box40x56 a20,50 target none ally info w:mark
seventhSeal/seal-awakened f3 prog 0.3s box40x56 a20,50 target none ally info w:mark
seventhSeal/print-a f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
seventhSeal/print-b f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
seventhSeal/print-c f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
inkPulse/splash-a f3 prog 0.3s box40x28 a6,14 ring radial ally deco w:mark
inkPulse/splash-b f3 prog 0.3s box40x28 a6,14 ring radial ally deco w:mark
frostRing/shard-a f3 prog 0.45s box36x32 a6,16 ring radial ally info w:mark
frostRing/shard-b f3 prog 0.45s box36x32 a6,16 ring radial ally info w:mark
frostRing/shard-c f3 prog 0.45s box36x32 a6,16 ring radial ally info w:mark
frostRing/shard-awakened-a f3 prog 0.45s box44x36 a6,18 ring radial ally info w:mark
frostRing/shard-awakened-b f3 prog 0.45s box44x36 a6,18 ring radial ally info w:mark
thunderclap/clap f3 prog 0.24s box60x44 a30,42 head none ally info w:mark
thunderclap/clap-awakened f3 prog 0.24s box60x44 a30,42 head none ally info w:mark
silenceBell/bell f3 prog 0.45s box40x52 a20,50 head none ally info w:mark
silenceBell/bell-awakened f3 prog 0.45s box40x52 a20,50 head none ally info w:mark
inkPots/shatter f3 prog 0.3s box76x64 a38,40 target none ally info w:mark
inkPots/splat f1 idx 1.2s box64x30 a32,15 target none ground deco w:decal
clusterPots/burst f3 prog 0.24s box56x48 a28,30 target none ally info w:mark
tarJar/crack f3 prog 0.32s box80x56 a40,34 target none ally info w:mark
tarJar/pool f1 idx 1.5s box104x44 a52,22 target none ground deco w:decal
meteorBrush/impact f3 prog 0.36s box88x68 a44,46 target none ally info flash w:mark
meteorBrush/impact-awakened f3 prog 0.36s box88x68 a44,46 target none ally info flash w:mark
meteorBrush/crater f1 idx 1.5s box120x52 a60,26 target none ground info w:decal
meteorBrush/streak-a f2 prog 0.36s box40x16 a4,8 ring radial ally deco w:mark
meteorBrush/streak-b f2 prog 0.36s box40x16 a4,8 ring radial ally deco w:mark
sparkThread/spark f2 prog box24x24 a12,12 point none ally deco w:chain
sparkThread/spark-awakened f2 prog box24x24 a12,12 point none ally deco w:chain
stormThread/gust-a f2 prog box24x20 a12,10 point none ally deco w:chain
stormThread/gust-b f2 prog box32x26 a16,13 point none ally deco w:chain
frostChainlet/rime12 f1 idx box36x18 a18,9 feet none feet info r12 w:class
frostChainlet/rime19 f1 idx box48x22 a24,11 feet none feet info r19 w:class
frostChainlet/rime28 f1 idx box64x28 a32,14 feet none feet info r28 w:class
inkLance/tassel f2 prog box60x22 a56,11 origin beam ally info w:beam
inkLance/tassel-awakened f2 prog box60x22 a56,11 origin beam ally info w:beam
wideBrush/brush f3 prog box56x48 a14,24 tip beam ally info w:beam
wideBrush/brush-awakened f3 prog box56x48 a14,24 tip beam ally info w:beam
crossStrokes/scrap-a f2 prog box20x16 a10,8 tip beam ally deco w:beam
crossStrokes/scrap-b f2 prog box20x16 a10,8 tip beam ally deco w:beam
judgmentLine/inkbox f2 prog box64x30 a60,15 origin beam ally info w:beam
judgmentLine/inkbox-awakened f2 prog box64x30 a60,15 origin beam ally info w:beam
judgmentLine/flick-a f2 prog 0.24s box22x18 a11,9 line beam ally deco w:beam
judgmentLine/flick-b f2 prog 0.24s box22x18 a11,9 line beam ally deco w:beam
inkOrbit/chip-a f2 prog 0.24s box16x12 a4,6 ring radial ally deco w:mark
inkOrbit/chip-b f2 prog 0.24s box16x12 a4,6 ring radial ally deco w:mark
wardRing/knot-a f1 idx box22x18 a11,9 ring radial ally info w:variant
wardRing/knot-b f1 idx box22x18 a11,9 ring radial ally info w:variant
eclipseHalo/ribbon-a f3 loop@12 still0 box36x18 a32,9 ring tangent ally info w:mark
eclipseHalo/ribbon-b f3 loop@12 still0 box36x18 a32,9 ring tangent ally info w:mark
```

**C6**
```
calls=185 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```

**C7**
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```

**C8**
작업 전(모듈 없음):
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 167wmyl/2074905 -> 167wmyl/2074905 same | k11 1fngex7/615038 -> 1fngex7/615038 same | fixed set same
PN keys same: C,_hk,_ki,arsenal,bombers,bossesA,bossesB,bossesC,characters,defs,enemies,env,fieldBosses,halftone,hazards,heroKit,icons,rng,skillVfx,speedLines,splat,story,taper,tapers,vfx
arsenalFx calls: 0 (module absent)
```
납품 전:
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 g5t9jg/2078351 -> g5t9jg/2078351 same | k11 7aurnv/612442 -> 7aurnv/612442 same | fixed set same
PN keys same: C,_hk,_ki,arsenal,arsenalFx,bombers,bossesA,bossesB,bossesC,characters,defs,enemies,env,fieldBosses,halftone,hazards,heroKit,icons,rng,skillVfx,speedLines,splat,story,taper,tapers,vfx
arsenalFx calls: 185
```
- 고정값은 지시서 값과 같다.
- K9·K11 해시는 작업하는 동안 바뀌었다. 다른 작업자가 `k-icons2.js`·`k-hazards.js`를 동시에 고치는 중이기 때문이다. 같은 실행 안의 호출 전후는 same이다.

**C9 (원문, 끝 행의 `  `는 이어지는 줄)**
```
inkPulse/burst layout [["splash-a",130.59,-83.49,-0.57,0,0,0.76,0],["splash-b",66.82,139.86,1.13,0,0,0.52,0],["splash-a",-101.48,-117.16,4,0,0,0.99,0]]
inkPulse/burst path knots [[0,11.89],[40,6.54],[80,11.19],[120,8.8],[160,13.45],[200,8.1],[240,15.71],[280,10.36],[320,7.97]]
inkPulse/burst path gaps [[13.8,20.04],[190.67,194.77],[281.06,287.02]]
inkPulse/burst path core [[65.16,182.84]]
frostRing/burst layout [["shard-a",83.04,-150.63,2.07,0,0,0.76,0],["shard-c",168.74,-33.33,2.95,0,0,0.52,0],["shard-b",63.43,159.88,4.33,0,0,0.99,0],["shard-c",-87.29,161.98,2.07,0,0,0.45,2],["shard-b",-163.72,-52.72,6.59,0,0,0.21,2]]
frostRing/burst path knots [[0,12.18],[40,11.11],[80,12.04],[120,11.56],[160,12.49],[200,11.42],[240,12.94],[280,11.87],[320,11.39]]
frostRing/burst path core [[65.16,425.16]]
frostRing/burst path fringe [[0,-171.99],[7.02,-171.87],[14.02,-171.47],[21.01,-170.77],[27.96,-169.78],[34.86,-168.5],[41.11,-164.55],[48.48,-165.11],[54.06,-159.7],[61.79,-160.63],[66.51,-153.86],[74.69,-155.1]]
thunderclap/burst layout [["clap",0,-66,0,0,0,0,0]]
thunderclap/burst path jag [[133.4,4.26],[140.26,24.27],[128.31,55.16],[109.2,70.56],[97.25,101.81],[75.02,110.89],[62.41,127.46],[29.06,129.53],[7.5,141.38],[-25.36,138.07],[-45.96,126.19],[-66.44,124.94]]
  [[-88.15,99.81],[-109.79,88.73],[-119.17,56.84],[-123.7,39.02],[-138.29,19.2],[-132.96,-12.9],[-135.86,-36.78],[-116.3,-63.39],[-113.92,-84.56],[-82.41,-104.14],[-67.74,-115.61],[-40.84,-134.26]]
  [[-16.92,-131.78],[1.67,-141.45],[36.13,-128.22],[55.36,-125.96],[84.54,-111.49],[94.56,-88.86],[115.21,-81.37],[125.43,-46.08],[138.97,-30]]
thunderclap/burst path forks [[84.54,-111.49],[90.26,-117.37],[92.06,-123.83],[-66.44,124.94],[-68.34,131.29],[-72.2,135.1],[36.13,-128.22],[39.51,-137.31],[38.36,-145.16]]
silenceBell/burst layout [["bell",0,-66,0,0,0,0,0]]
silenceBell/burst path rings [[216.47,1],[146.15,0.7],[72.62,0.45]]
brushDownpour/impact layout [["mark-s",0,0,0,0,0,0,0],["stroke-a",0,0,0,0,0,0,0]]
brushDownpour/impact path knots [[0,4.74],[27.69,3.67],[55.38,5.76],[83.08,3.35],[110.77,2.28],[138.46,4.37],[166.15,1.96],[193.85,5.39],[221.54,2.98],[249.23,1.91],[276.92,4],[304.62,1.59]]
  [[332.31,5.01]]
brushDownpour/impact path gaps [[16.68,41.85],[42.26,64.09],[121.35,135.69],[157.23,178.08],[234.25,251.75],[270.13,294.14],[347.15,367.81]]
brushDownpour/impact path core [[76.98,108.46]]
meteorBrush/land layout [["crater",0,0,0,0,0,0,0],["impact",0,0,0,0,0,0,0],["streak-a",118.17,-110.81,-0.75,0,0,0.19,0],["streak-a",161.22,-15.89,-0.1,0,0,0.65,0],["streak-b",115.88,113.21,0.77,0,0,0.42,0]]
  [["streak-a",-90.27,134.52,2.16,0,0,0.88,0],["streak-b",-161.06,17.42,3.03,0,0,0.35,0],["streak-a",-46.4,-155.21,4.42,0,0,0.11,0]]
meteorBrush/land path gaps [[97.54,107.3],[181.72,190.52]]
inkPots/fire layout []
tarJar/gather layout []
smokeTail/smoke layout []
meteorBrush/mark layout []
twinBlades/spin layout []
eclipseHalo/sweep layout [["ribbon-b",-222.41,58.6,4.45,0,0,0.63,0]]
eclipseHalo/sweep path crescent [[-222.41,58.6],[-229.21,19.09],[-229.04,-21.01],[-221.91,-60.46],[-208.04,-98.07],[-187.85,-132.71],[-161.95,-163.31],[-131.13,-188.96],[-96.33,-208.86],[-58.6,-222.41],[-80.86,-175.31],[-91.55,-131.92]]
  [[-96.09,-96.9],[-100.98,-71.34],[-111.84,-52.72],[-131.67,-35.87],[-159.91,-14.67],[-192.4,16.02]]
eclipseHalo/total layout []
inkOrbit/sweep layout [["chip-a",133.86,6.12,0.05,0,0,0.79,0],["chip-b",56.98,121.28,1.13,0,0,0.56,0],["chip-b",-76.75,-109.84,4.1,0,0,0.02,0]]
inkOrbit/sweep path comet [[-42.69,-74.66],[-57.28,-64.15],[-69.36,-50.84],[-78.42,-35.31],[-84.05,-18.23],[-86,-0.36],[-84.19,17.53],[-78.71,34.65],[-69.79,50.26]]
inkOrbit/sweep path gaps [[24.79,37.85],[343.38,353.22]]
wardRing/sweep layout [["knot-a",72.55,68.82,0.76,0,0,0.79,0],["knot-b",-83.34,55.27,2.56,0,0,0.56,0]]
wardRing/sweep path twist [[84.56,43.3],[89.12,55.52],[77.42,55.06],[80.16,67.81],[70.72,63.43],[72.02,76.41],[64.14,70.08],[64.15,83.12],[54.79,77.61],[53.16,90.55],[47.24,82.42],[44.39,95.15]]
wardRing/sweep path stitch [[270,390]]
sparkThread/jump layout [["spark",220,-70,0,0,0,0,0],["spark",420,20,0,0,0,0,0],["spark",640,-40,0,0,0,0,0],["spark",860,30,0,0,0,0,0]]
sparkThread/jump path controls [[121.2,0.2],[334.4,-57],[539.6,25.2],[761.2,-40.2]]
sparkThread/jump path start [[25.99,-0.79]]
stormThread/jump layout [["gust-b",220,-70,0,0,0,0,0],["gust-a",420,20,0,0,1,0,0],["gust-a",640,-40,0,0,0,0,0],["gust-a",860,30,0,0,0,0,0]]
stormThread/jump path strandA [[0,0],[5.88,-1.57],[11.75,-3.15],[17.24,-5.94],[22.81,-8.47],[28.54,-10.48],[33.72,-14.24],[41.13,-11],[46.92,-12.84],[53.05,-13.63],[57.07,-21.01],[62.93,-22.62]]
stormThread/jump path strandB [[0,0],[5.7,-2.12],[11.41,-4.22],[17.38,-5.49],[23.51,-6.27],[29.35,-7.94],[34.69,-11.2],[39.92,-14.79],[45.71,-16.63],[52.2,-16.27],[58.72,-15.83],[64.44,-17.9]]
frostChainlet/jump layout [["rime19",220,-70,0,0,0,0,0],["rime19",420,20,0,0,0,0,0],["rime19",640,-40,0,0,0,0,0],["rime19",860,30,0,0,0,0,0]]
frostChainlet/jump path links [[35.67,-11.35],[49.01,-15.59],[62.35,-19.84],[75.69,-24.08],[89.04,-28.33],[102.38,-32.57],[115.72,-36.82],[129.06,-41.06],[142.4,-45.31],[155.74,-49.55],[169.08,-53.8],[182.42,-58.04]]
inkLance/stroke layout [["tassel",0,0,0,0,0,0,0]]
inkLance/stroke path tip [[640,0]]
inkLance/stroke path head [[610,-1.6],[615.4,-5.52],[620.5,-6.5],[628.6,-4.03],[635.8,-1.43],[640,0],[635.8,1.43],[628.6,4.03],[620.5,6.5],[615.4,5.53],[610,1.6]]
wideBrush/stroke layout [["brush",410,0,0,0,0,0,0]]
wideBrush/stroke path top [[26,-34.52],[35.85,-32.55],[45.69,-36.38],[55.54,-35.9],[65.38,-33.17],[75.23,-35.76],[85.08,-32.71],[94.92,-36.22],[104.77,-32.26],[114.62,-34.67],[124.46,-32.4],[134.31,-32.88]]
wideBrush/stroke path bottom [[26,36.02],[35.85,33.05],[45.69,35.88],[55.54,32.6],[65.38,36.33],[75.23,35.85],[85.08,33.22],[94.92,35.71],[104.77,32.77],[114.62,36.16],[124.46,32.31],[134.31,34.62]]
wideBrush/stroke path streaks [[193.7,-7.57],[342.5,-7.57],[95.17,14.57],[333.25,14.57],[259.47,3.19],[394.83,3.19],[97.77,-22.28],[379.24,-22.28]]
crossStrokes/stroke layout [["scrap-a",496,0,0,0,0,0,0]]
crossStrokes/stroke path top [[26,-2.63],[33.97,-0.99],[41.93,-6.11],[49.9,-6.08],[57.86,-3.49],[65.83,-7.06],[73.8,-4.08],[81.76,-8.78],[89.73,-4.66],[97.69,-8],[105.66,-5.99],[113.63,-7.16]]
crossStrokes/stroke path bottom [[26,4.5],[33.97,1.62],[41.93,5.48],[49.9,2.2],[57.86,7.19],[65.83,7.17],[73.8,4.71],[81.76,8.15],[89.73,5.29],[97.69,9.87],[105.66,5.88],[113.63,9.08]]
judgmentLine/stroke layout [["inkbox",0,0,0,0,0,0,0],["flick-b",208.18,7.37,0,0,0,0,2],["flick-a",408.19,2.2,0,0,0,0,2],["flick-b",566.74,-9.35,0,0,1,0,2],["flick-a",865.39,7.08,0,0,0,0,2]]
judgmentLine/stroke path after [[493,2.2],[493,-1.54]]
fallingScroll/unroll layout []
inkPots lob [[0,0,0,0,-1.08,9,0.18],[0.25,80,-30,89.71,-0.84,10.5,0.22],[0.5,160,-60,119.62,-0.36,12,0.25],[0.75,240,-90,89.71,0.36,13.5,0.29],[1,320,-120,0,0.84,15,0.32]]
clusterPots lob [[0,0,0,0,-1.08,7,0.18],[0.25,80,-30,89.71,-0.84,8.25,0.22],[0.5,160,-60,119.62,-0.36,9.5,0.25],[0.75,240,-90,89.71,0.36,10.75,0.29],[1,320,-120,0,0.84,12,0.32]]
tarJar lob [[0,0,0,0,-1.06,10,0.18],[0.25,80,-30,84.59,-0.82,11.5,0.22],[0.5,160,-60,112.78,-0.36,13,0.25],[0.75,240,-90,84.59,0.32,14.5,0.29],[1,320,-120,0,0.8,16,0.32]]
meteorBrush lob [[0,0,0,0,-1.19,12,0.14],[0.25,80,-30,128.16,-0.96,14.5,0.19],[0.5,160,-60,170.88,-0.36,17,0.24],[0.75,240,-90,128.16,0.61,19.5,0.29],[1,320,-120,0,1.05,22,0.34]]
```
- 3차 단계(fire·gather·smoke·mark·spin·total·unroll)는 빈 layout·paths로 나온다.
- `paths`의 각 키가 무엇인지는 API §8.3에 있다. 대부분 정의 점이고, 앞 12개만 뽑은 키도 있다.

**C10**
```
fills=14 fail=0 (persistent over 0.3 s: Y max 0.62; brief: Y max 0.69; hero coat Y 0.902, contrast min 1.25)
brushDownpour.band (ink a1, 0.3s): ch1 0.006 ch2 0.006 ch3 0.006 ch4 0.006 ch5 0.006 | coat 16.93:1 ok
seventhSeal.wash (p50 a0.18, 0.36s): ch1 0.501 ch2 0.501 ch3 0.525 ch4 0.511 ch5 0.471 | coat 1.66:1 ok
seventhSeal.print (p50 a0.25, 1.2s): ch1 0.535 ch2 0.536 ch3 0.558 ch4 0.545 ch5 0.507 | coat 1.56:1 ok
inkPulse.band (ink a1, 0.3s): ch1 0.006 ch2 0.006 ch3 0.006 ch4 0.006 ch5 0.006 | coat 16.93:1 ok
frostRing.band (p50 a0.5, 0.29s): ch1 0.670 ch2 0.671 ch3 0.688 ch4 0.678 ch5 0.649 | coat 1.29:1 ok
frostRing.band.tail (p50 a0.25, 0.45s): ch1 0.535 ch2 0.536 ch3 0.558 ch4 0.545 ch5 0.507 | coat 1.56:1 ok
inkLance.capsule (p50 a0.16, 0.28s): ch1 0.491 ch2 0.492 ch3 0.516 ch4 0.502 ch5 0.461 | coat 1.68:1 ok
wideBrush.band (p50 a0.45, 0.28s): ch1 0.642 ch2 0.643 ch3 0.661 ch4 0.650 ch5 0.619 | coat 1.34:1 ok
crossStrokes.band (p50 a0.5, 0.28s): ch1 0.670 ch2 0.671 ch3 0.688 ch4 0.678 ch5 0.649 | coat 1.29:1 ok
judgmentLine.capsule (p50 a0.12, 0.28s): ch1 0.472 ch2 0.473 ch3 0.497 ch4 0.483 ch5 0.441 | coat 1.74:1 ok
inkOrbit.wash (ink a0.14, 0.3s): ch1 0.311 ch2 0.311 ch3 0.330 ch4 0.320 ch5 0.288 | coat 2.50:1 ok
wardRing.wash (p50 a0.12, 0.3s): ch1 0.472 ch2 0.473 ch3 0.497 ch4 0.483 ch5 0.441 | coat 1.74:1 ok
eclipseHalo.wash (ink a0.1, 0.3s): ch1 0.340 ch2 0.340 ch3 0.361 ch4 0.349 ch5 0.314 | coat 2.32:1 ok
eclipseHalo.crescent (ink a0.35, 0.3s): ch1 0.184 ch2 0.184 ch3 0.195 ch4 0.189 ch5 0.171 | coat 3.89:1 ok
```

### 4. 직접 본 렌더

모두 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`에 있다. 임시 폴더라 지워질 수 있다.

| 구분 | 렌더 |
|---|---|
| 1배·색 | `k10-t1-boneMortar`, `k10-t1-chainSpark`, `k10-t1-voidMine`, `k10-t1-railSpear`(frostLine 포함), `k10-t1-halos`(blackSun·orbitScythes·eclipseStep 포함), `k10-t1-nova-bands` |
| 0.8배 | `k10-mix-deutan-0p8`(2장 바닥, deutan 행렬) |
| 0.5배 | `k10-t3-blind`(회색), `k10-t3-awakened-labels`(각성 22종) |
| 확대 | `k10-c3-strike`·`-nova-lob`·`-review2`(3배), `k10-c3-lines`·`-lines2`(4배), `k10-detail-1`(2배), `k10-detail-clap`·`-clap2`·`-clap3`(5배) |
| 흑백 | `k10-t1-boneMortar-gray-ch3`, `k10-t1-chainSpark-gray-ch5`, `k10-t3-blind` |
| 색각 | `k10-mix-deutan-0p8` |
| 검사 | `k10-c1-all`, `k10-c2-parts`, `k10-c6-scan`, `k10-c7-geometry`, `k10-c8-unchanged`(-before 포함), `k10-c9-final-a/b/c/r`, `k10-c10-contrast`, `k10-c15-pairs`, `k10-lod-reduced`, `k10-dbg-bounds*` |

### 5. T1~T7 자가 판정 (설계자가 한 판정이라 치우칠 수 있다)

**T1 같은 look**
| look | 판정 |
|---|---|
| boneMortar 6 + 핵심 | 1장 색과 3장 회색에서 모두 갈린다. 먹 파동 = 검은 띠, 붓 폭우 = 비스듬한 획 + 찍은 테, 족자 = 세로 족자 + 앞 반원 파문, 먹단지 = 흰 단지 + 먹 튐, 송이 = 작은 고리 네 개, 유성 붓 = 큰 고리 + 박힌 붓 + 분화구, 핵심 = 바느질 고리 + 흰 뼛가루 |
| chainSpark 5 + 핵심 | 1장 색과 5장 회색에서 갈린다. 수직 번개, jag 고리 + 머리 위 손, 처진 호 + 불꽃, 꼬인 두 가닥, 흰 사슬 고리 대 꺾은 흰 줄 |
| voidMine 3 + 핵심 | 갈린다. 둥근 도장 + 인영, 머리 위 손종 + 흰 고리 3겹, 검은 항아리 + 웅덩이 |
| railSpear 3 + 핵심(+ frostLine) | 갈린다. 가는 창 + 잎 창날, 찢긴 종이 획 넷, 실 같은 줄 + 먹통, 넓은 종이 띠 + 붓 |
| eclipseStep 2 + 핵심 | 갈린다. 꼰 줄 고리 + 매듭, 가는 테 + 먹 초승 + 리본. 서리 고리 대 검은 태양, 먹 궤도 대 초승 궤도도 갈린다 |

**T2 같은 kind**: strike 4, nova 4, lob 4, chain 3, beam 4, halo 3이 모두 다른 물건·문체다.

**T3 (BLIND 회색 0.5배)**: §2 표만으로 22/22를 맞혔다.
- 가장 가까운 쌍 1: 먹창 대 심판선. 0.5배에서 둘 다 주인공에서 뻗는 가는 선이다. 잎 창날과 점선 캡슐로 갈린다.
- 가장 가까운 쌍 2: 먹단지 대 송이 단지. 하나와 넷으로 갈린다.

**헷갈린 것과 고친 것(작업 중 직접 보고 바꾼 15건)**
| # | 무엇 | 어떻게 읽혔나 | 고친 것 |
|---|---|---|---|
| 1 | 먹단지·송이 단지 0번 장 | 검은 공(폭탄병) | 흰 단지가 금 가는 모습 |
| 2 | 유성 붓 비백 | 고리 둘레 눈금(적 imminent) | 갈라진 쐐기 + 방울 |
| 3 | 손뼉 | 작았다. 섬광이 손 뒤에 숨었다 | 손 1.05배, 섬광을 손끝 앞으로, 맞닿는 장에서 어긋나게 |
| 4 | 족자 능선 | 'M' | 담묵 산 + 능선 |
| 5 | 인영 매듭 | ⊘·글자 | 오른쪽 올가미 |
| 6 | 먹통 | 얼굴(두 눈) | 바퀴 하나 옆모습 |
| 7 | 술 매듭 | '?'·'i' | 감은 띠 + 처진 끝 |
| 8 | 줄 매듭 | ⊘·≡ | 울퉁불퉁한 매듭 |
| 9 | 바람 획 | 글자 c, 눈썹 | 대각선 swoosh |
| 10 | 번개 가지 | 다리 | 위쪽 짧은 가지 |
| 11 | 붓 폭우 머리 | 물방울 붓 머리(적 텔레그래프) | 납작한 눌림 |
| 12 | 도장 꼭지 | 머리 | 납작한 갓 |
| 13 | 얼음판 | 가시관 파이 | 누운 결정 |
| 14 | 서리 결정 | 검게 칠해짐 | 먹 테를 종이 아래에 깖 |
| 15 | 불꽃실 | 선보다 불꽃이 먼저 나옴 | 선이 닿은 뒤에 나오게 |

**T4·T5·T7**: 3차 범위다(기믹·표식·땅 조각).
**T6**: P1 부분만 봤다. C10은 fail 0이다. 인장 7~10개 원판을 합집합으로 칠해 겹쳐도 밝아지지 않는다. 혼잡 장면(C12)은 3차에서 돈다.

**C15**: K9 3차 아이콘이 `k-icons2.js`에 작업 중인 상태로 이미 들어와 있어 대조했다. 물건 17종이 모두 같은 물건이다(번개 + 구름, 비스듬한 붓 획, 아치 끈 족자, 둥근 도장, 서리 결정, 손뼉, 손종, 백자, 검은 항아리, 붓 혜성, 불꽃, 술 매듭, 큰 붓, 먹통 + 바퀴, 줄 매듭, 리본). K9가 합격한 뒤 다시 본다(Q12).

### 6. 지시서와 다르게 한 것 (이유는 API §12에 모두 있다)

1. **`K` 값은 구현값 hex다.**
   - K4 파일의 원래 `K`는 v1.0 키트 값(`#121110` 등)이다. 지시서 §0.3의 값은 리뷰 시트가 출력 글자에도 `COLOR_MAP`을 적용해 보인 값이다.
   - C6이 원래 마크업에서 구현값만 받으므로 구현값을 썼다. `COLOR_MAP`이 건드리지 않으므로 구운 색은 같다.
2. **붓 폭우 b 길이 68**(지시서 76): 박스 48 안에 들어가는 최대 길이다.
3. **족자 기울기 3°·3.5°·3.5°**(지시서 6°·12°): 박스 폭 52에 들어가는 한계다.
   - 6°에는 폭 약 58, 12°에는 약 75가 필요하다. 넓히려면 메인 세션 결정이 필요하다.
4. **서리 고리 띠는 p50 α0.5, fade 0.3**: C10(P1) 때문이다. 결정 조각은 흰색 그대로다.
5. **일곱째 인장 원판 합집합**(추가): 한 시전의 원판을 한 경로로 채운다.
6. **일식 초승 그림자는 코사인 두께 초승**이다.
   - 옮긴 원을 span으로 자르면 끝이 곧게 잘린다. 세 점 원은 이 값에서 렌즈가 된다.
7. **얼음판 비율 0.28~0.38**(지시서 0.42): 박스 높이와 발 범위 때문이다. 서리 결정은 판 가장자리에 누웠다.
8. **추가한 grow와 등장 규칙**
   - 폭풍실·서리 사슬에 grow 0.3을 넣었다.
   - 연쇄 점 조각은 선이 닿은 뒤에 보인다.
   - 데칼 페이드 규칙 `SPEC.decal.fadeAt` 0.5를 넣었다.
   - reduced LOD에서 deco를 하나 건너 하나 뺀다.
9. **지시서가 값을 정하지 않은 것**
   - 틈 각도: 송이·타르 8~14°, 먹 궤도 8~14°, 유성 붓은 틈 2개.
   - grow·fade 값, 족자 파문 core 층 [[ink,3.2],[ally,1.6]], 침묵의 종 넷째 고리 delay 0.24·α0.3, 심판선 잔상 부호 [1, −0.7, 0.48].
   - 먹창 thrust·retract를 수명 비율로 읽었다.
   - 십자 획 "뒤쪽 먹 테"는 +y 쪽이다. 캡슐은 26에서 곧게 자른다.
10. **해석한 것**
    - 서리 결정이 안쪽에 놓이면 안쪽을 본다(angle + π).
    - 먹 파동 틈은 띠를 끊는 틈이다.
    - 붓 폭우 core는 가장 긴 찍음 가운데에 둔다(jit로 고르면 4°짜리 찍음에 걸렸다).
11. **출력 형식에 더한 것**
    - layout 항목에 `index`(point)와 `dr`(ring)를 냈다. 머리 위 물건은 `prim: 'head'`다.
    - idx 데칼 조각의 `seconds`에는 데칼 수명(참고값)을 적었다.
    - lob `object`는 1차에 착탄 조각이고, 2차에 비행 물건으로 바꾼다.
12. **각성 가는 선은 고리·halo에만 둔다.** 수호 고리(줄 안쪽과 겹침)와 선(chain·beam)에는 없다.
13. **기믹 목록**: 거세지는 폭우는 새 그림이 없지만 1차 `gimmicks`에 넣지 않았다(3차에서 등록).
14. **jit 번호를 옮겼다**: band 매듭·fringe를 1100번대·1300~1600번대로 옮겼다. 같은 seed에서 ring layout의 건너뜀·inout(100·300번대)과 얽히지 않게 하려는 것이다.
15. **돌린 물건은 실제 좌표로 그린다(모듈 안 `TX`, `k-arsenal-fx.js:217`).** 돌린 `<g>`는 getBBox가 넓게 재서 C7이 실패했다.

### 7. 메인 세션 등록값

**굽기**
- `scripts/build-atlas.mjs:11` `KIT_FILES`: `'k-icons2.js'` 바로 뒤에 `'k-arsenal-fx.js'`를 넣는다.
- `art/atlas-spec.mjs` `PACKS`: `'arsenal-fx': { page: 'assets/packs/arsenal-fx/atlas', frames: [{ arsenalFx: true }] }`.
- 키는 `afx/<group>/<part>/<frame>`, 호출은 `['PN.arsenalFx.stamp', group, part, { frame }]`, `scale: 1`이다. box·anchor는 `parts()` 값을 쓴다.
- 등록할 그룹은 `PN.arsenalFx.groups`(22개)의 모든 조각, 141장이다.
- 기대: 페이지 1장. 박스 343,592 단위²는 @2x 약 137만 px²이고 여백은 별도다. `npm run build:atlas`로 잰다.

**조각 구동 값**
- loop 애니메이션: `afx/eclipseHalo/ribbon-a`·`ribbon-b`만 12fps, still 0이다.
- prog 초(창):

  | 초 | 조각 |
  |---|---|
  | 0.24 | bolt*, clap*, burst(송이), chip-*, flick-* |
  | 0.18 | stroke-* |
  | 0.42 | scroll* |
  | 0.3 | seal*, splash-*, shatter |
  | 0.45 | shard-*, bell* |
  | 0.32 | crack |
  | 0.36 | impact*(flash), streak-* |
  | 자료 창(chain 0.18초) | spark*, gust-* |
  | 자료 창(beam 0.28초) | tassel*, brush*, scrap-*, inkbox* |

- idx 조각: 데칼은 scorch 0.6, mark-* 0.9, print-*·splat 1.2, pool·crater 1.5초 동안 보인다(앞 절반 α 1 → 끝 0). rime*은 적 반경 등급(연쇄 + 0.3초), knot-*는 변형이다.
- 층:

  | 층 | 조각 |
  |---|---|
  | ground(데칼) | scorch, mark-*, print-*, splat, pool, crater |
  | feet(groundMarks) | rime* |
  | ally(allyAttacks, 적 탄·텔레그래프 아래) | 나머지 전부 |

- 상한: 1차는 데칼 16/8/0, 화면 조각 220/140/70이다(지시서 §4.5·§5.4, `SPEC.caps`).
- 매니페스트: `arsenalFx = { spec: SPEC, parts: {group → parts(group)}, vectors: C9 출력 }`. parts 필드는 drive, fps, seconds, still, place, rotate, layer, lod, flash, r, window다. `SPEC`과 `parts`에는 한글이 0이다(C6).
- 등록 대상: `META[id].done.fx === true`인 22종만이다. 투사체 22종과 기믹은 아직 등록하지 않는다.

**렌더러(`ArsenalFxPainter`)가 새로 해야 할 것** — 규칙은 API §7~§9에 있다.
1. **자료 연결**
   - `area/blast`(source = 무기 id) → 사건마다 고리 + layout을 그린다. 표시 수명은 `SPEC.life[id].mark`다(`presentation.ts:286-289`를 이 값으로 바꾼다, 지시서 §9-3).
   - `ChainEffect`(skillId) → 선 + 점 조각.
   - `BeamEffect`(skillId) → 빔 틀(시작점 원점, +x = 방향). 십자 획은 빔 넷을 각각 그린다.
   - halo `skillMark ring` → inner = `META.geo.inner`.
2. **일곱째 인장 원판**: 같은 틱·같은 source의 사건 원판을 한 경로(nonzero)로 한 번 채운다.
3. **연쇄 점 조각**: 자라는 선의 도달 길이 ≥ 곧은 구간 누적 길이일 때만 그린다.
4. **jag(천둥 박수)**: R0에서 한 번 만든 뒤 grow 배율로 늘인다. 깜빡임 seed는 5·6이다(감소 모션은 5).
5. **band**: 점 수는 R0로 셈하고, 폭은 grow로 줄이지 않는다. 수호 고리는 줄 묶음 전체를 배율로 그린다.
6. **LOD**
   - reduced: deco·prio 2 항목을 하나 건너 하나 빼고, loop fps는 절반이다.
   - minimal: deco·prio 2 항목과 데칼을 뺀다(crater는 3차 별똥 자국에서만 남긴다). 서리 사슬은 꺾은 줄 하나다.
   - 감소 모션: grow 대신 α로 들어오고, 혜성·초승은 시작각에 멈춘다.
7. 시험: C9 벡터로 `arsenalFx.test.ts`를 만든다. jit 번호대는 API §8.1에 있다.
8. 결정이 필요한 것: 족자 박스를 넓힐지(6°·12° 기울기, §6-3). 서리 고리 띠 α0.5 + fade 0.3을 받아들일지(§6-4).

### 8. 사람 클린업이 필요한 곳과 알려진 한계

**사람 클린업(지시서 §10)**
- 물건의 붓 외곽·블랙 스팟·비백: 번개·먹구름, 붓 획, 족자, 도장, 손, 손종, 백자 조각, 항아리·타르 줄, 큰 붓, 먹통, 술, 리본, 매듭.
- 서리 결정·얼음판·찢긴 종이 획·먹 폭발 팔·타르 윤기의 붓 질감.
- 문화 검토: 손뼉(합장으로 보이지 않게), 손종(범종 아님), 인영 올가미가 글자로 읽히지 않게, 족자 능선, 십자 획의 십자 모양(Q9).
- 1배 픽셀 다듬기: 머리 위 손(~30px)·손종(~40px), ≤ 24px 불꽃·바람 획, 주인공 뒤 26~56의 술·먹통.

**알려진 한계**
- 유성 붓 비백 줄기는 갈라진 쐐기로 바꿨지만, 1배 화면에서 적 imminent 눈금과 닮을지 화면 검사에서 봐야 한다.
- 실제 게임 화면, 성능, 팩 바이트는 확인하지 않았다(통합 뒤에 잰다).
- 정식 판독 시험(n ≥ 8)은 하지 않았다. 위 T1~T3은 설계자 자가 판정이다.
- 2차·3차 범위의 명령(C5·C11·C12·C13·C14)은 비행·기믹·오버레이가 아직 없어 의미 있는 판이 나오지 않는다.
- jag 12fps 깜빡임의 광과민 위험은 면적이 작은 선이라 낮다고 본다. 감소 모션에서는 멈춘다.
- 이번 작업은 새 모듈뿐이다. 기존 모듈의 기본 출력은 바뀌지 않았다(C8 고정값 same).

---

## K10 검수 1차: 1차 납품(뼈대 + 투사체 없는 22종), art-director, 2026-10-16

**판정: 수정 후 합격.** 반드시 고칠 것은 4건(M1~M4)입니다.
- 통과한 것: 기계 검사 C1~C10과 판독 시험 T1~T3.
- 막힌 것: 1배 타격감과 C15(같은 물건 대조) 두 가지입니다.

반드시 고칠 것
- **M1** strike·lob이 맞는 순간(나이 0~0.1초)에 덩어리가 없습니다. 메인 세션의 관찰이 맞습니다.
  - lob의 0번 장은 깨지기 전의 작은 흰 단지입니다.
  - 큰 먹 튐은 0.1초 뒤에 나옵니다.
  - 반경 R에 맞춰 커지는 덩어리가 없습니다.
- **M2** 유성 붓의 비백 줄기가 고리 위·바깥에 고르게 놓입니다. 흑백에서 적 imminent 예고의 방사 쐐기와 같은 꼴입니다.
- **M3** C15: K9 검수 6차가 지적한 세 꼴이 K10의 같은 물건에도 있습니다.
  - 타르 항아리 = 폭탄
  - 유성 붓 = 막대 + 청록 분사 + 만화 폭발
  - 인영 = 같은 곡선을 일곱 번 찍음
- **M4** 족자 기울기 3~3.5°는 1배에서 보이지 않습니다. 박스는 그대로 두고 렌더러가 돌립니다(결정 (a)).

**요청하신 네 가지에 대한 답**
1. 메인 세션 관찰(1배·0.8배 타격감): 동의합니다.
   - 부족한 것: lob 셋(먹단지·송이 단지·유성 붓)과 족자의 파문·기울기
   - 충분한 것: 붓 폭우·먹 파동·먹번개·인장, 족자 물건 자체(높이 0.85R)
   - 수치는 §2, 처방은 M1·M2에 있습니다.
2. 다르게 한 것 15건
   - 14건은 받아들입니다.
   - #3(족자 3~3.5°)은 그대로 받지 않고 M4로 고칩니다.
   - #4(서리 띠 α0.5 + fade 0.3)는 받아들입니다. 약해진 띠는 권장 R1로 보완합니다.
   - 납품서에 적히지 않은 차이 1건(서리 결정 길이)도 받아들입니다.
3. §7-8 결정 두 건
   - (a) 족자 박스를 넓히지 않습니다. 조각은 똑바로 세워 굽고, 렌더러가 장마다 0·6·12·12° 돌립니다.
   - (b) 서리 띠 α0.5 + fade 0.3을 받아들입니다.
4. C15
   - 세 물건 모두 K9 검수 6차와 같은 꼴에 걸립니다(M3).
   - 작은 어긋남 둘: 족자 기울기(M4), 손뼉 꼴(R2).

---

### 1. 직접 돌린 검사
- 렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r1-*.png`
- kit error 0건, `--check`는 모두 ok입니다.
  - 제 비교 렌더 하나가 제 필터 id(`gq1`) 중복으로 FAIL이었습니다. 킷 출력과는 상관없고, `-gray2`로 다시 돌려 ok입니다.

| 검사 | 결과 |
|---|---|
| C1 `k10r1-c1-all` | ok |
| C2 `k10r1-c2-parts` | `frames=141 ok boxArea=343592 ok badParts=0`, SPEC `1.0-d1`, groups 22, done.fx 22 |
| C6 `k10r1-c6-scan` | `calls=185 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0` |
| C7 `k10r1-c7-geometry` | 1~4줄 0건, 5줄 `invalid calls ok` |
| C8 `k10r1-c8-unchanged` | 고정값은 지시서와 같습니다: `k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244`. 작업 중인 K9(`1waomnk/2118383`)·K11(`n94sp1/617762`)은 호출 전후 same, PN 키 same |
| C9 표본 `k10r1-c9-sample` | inkPulse·meteorBrush·eclipseHalo·stormThread의 layout·paths 앞부분과 meteorBrush lob t0.5가 납품서 원문과 숫자까지 같습니다 |
| C10 `k10r1-c10-contrast` | `fills=14 fail=0`, 값이 납품서와 같습니다 |
| COLOR_MAP | `art/atlas-spec.mjs:14-21`의 키 6개(#121110 등)와 K10의 구현값 hex가 하나도 겹치지 않습니다. #1을 받아들이는 근거입니다 |
| T1 | `k10r1-t1-boneMortar`·`-voidMine`·`-chainSpark`·`-beams-halos`(1장 색), 작가의 `k10-t1-boneMortar-gray-ch3`·`-chainSpark-gray-ch5`(흑백). 다섯 묶음 모두 계열 안에서도, 핵심 그림과도 갈립니다 |
| T2 | 위 판과 T3 판에서 kind별로 모두 갈립니다 |
| T3 | 새 시드 99991로 섞은 흑백 0.5배 판(`k10r1-t3-blind-s99991`). 답을 먼저 적고 정답표를 열어 **22/22**. 다만 그림을 이미 여러 번 본 뒤라 순서만 새로운 판독입니다 |
| 1배 타격감 | `k10r1-impact-ages-lob`·`-strike`(1배, 적 5마리, 나이 0.02·0.08·0.2초), `k10r1-impact-moments-x1`·`-x08` |
| 확대 | `k10r1-zoom-c15risk`(3배), `-zoom-pots-scroll`(3배), `-meteor-impact-x6`, `-pots-f0-x6`, `-small-objects-x6`, `-rest-objects-x5`, `-seal-prints-decal`·`-seal-prints-layout`(2배), `-frost-band-x1` |
| 대조 | `k10r1-c15-pairs`, `-c15-k9-current`(수정 중인 K9), `-tar-vs-bomber-game`(게임 표시 배율 3배), `-meteor-vs-imminent-gray2` |
| 보존 해시 | `k10r1-keep-hash`, `-keep-hash-2`. 호출을 더 끼워 두 번 돌려도 같은 값입니다(§8) |

### 2. 1배·0.8배 타격감(메인 세션 관찰)

| 무기(Lv3 R) | 맞는 순간(나이 0~0.1초) 가운데에 보이는 것 | 크기(1배 / 0.8배) | 고리 먹 굵기 | 판정 |
|---|---|---|---|---|
| 먹단지 (92) | 금 간 흰 단지 23×22(`k-arsenal-fx.js:943`) + 위로 솟는 작은 먹(:942). 큰 먹 튐(가로 약 62)은 1번 장(:949)이라 0.1초 뒤 | 약 25 / 20px, 고리 지름의 약 14% | 3 / 2.4px | 부족 |
| 송이 단지 (64) | 흰 단지 13×12(:979) | 13 / 10px. 지시서 §1.7 '밝은 원판 12~18px(픽업)'에 걸림 | 2.6 / 2.1px | 부족 |
| 유성 붓 (160) | 섬광 r30 + 붓 + 작은 먹 튐 r7 | 60~70px, 지름의 약 20% | 5 / 4px | 부족 + M2 |
| 타르 항아리 (114) | 검은 항아리 + 웅덩이 104×44 | 덩어리는 있음 | 3.2 | 꼴이 문제(M3) |
| 족자 낙하 (110) | 족자 32×94 | 충분 | 파문 먹 2.4·2.8에 종이 1.4·1.6. R 전체 원은 ink300 1.2 α0.7이라 거의 안 보임 | 파문·기울기 부족 |
| 일곱째 인장·먹번개·붓 폭우·먹 파동 | 도장 일곱 / 번개 108 / 붓 획 64~68 / 검은 띠 6~16 | 충분 | — | 충분 |

- **흑백에서**(`k10-t1-boneMortar-gray-ch3`): 먹단지·유성 붓·핵심 골분 박격이 모두 '가는 이중선 고리 + 가운데 작은 것'으로 보입니다. 갈리기는 하지만 가운데 단서가 작아서 겨우 버팁니다.
- **각성에서**: 반경이 ×1.2라(먹단지 110, 유성 붓 192) 물건 대 고리 비율이 더 나빠집니다.

### 3. 반드시 고칠 것

#### M1: strike·lob 착탄 순간의 덩어리
- **본 렌더**: `k10r1-impact-ages-lob`·`-strike`, `k10r1-impact-moments-x1`·`-x08`, `k10r1-pots-f0-x6`
- **문제**
  - 지시서 §2.1(맞는 순간부터 보인다)과 §2.4(큰 먹 튐, 0번 장 섬광, 유성 붓의 큰 먹 폭발)에 어긋납니다.
  - 먹단지 0번 장은 6배로 보면 '조각으로 갈라진 흰 공 + 위로 튀는 먹 가시'라 불붙은 공으로도 읽힙니다.
  - 송이 단지 0번 장은 픽업 크기의 흰 원판입니다(§1.7).
  - 족자는 판정 원의 뒤 절반이 거의 안 보입니다(V4).
- **원인**
  - `shatterArt` :940-946: 0번 장이 `potCracking` 단지(:943)입니다. 큰 먹 튐은 1번 장(:949)입니다.
  - `clusterArt` :976-981: 0번 장이 `potCracking(0,-7,6.4,6.2)`(:979)입니다.
  - 고리 `SPEC.ring` :360·:366-369에 착탄 순간을 키우는 규칙이 없습니다(`drawRing` :1694-1743).
  - R에 맞춰 커지는 덩어리가 없습니다. 조각은 늘이지 않으므로 반경 64~192를 76×64·88×68 조각만으로는 채울 수 없습니다.
- **처방** — 박스·앵커·장 수·초는 그대로 둡니다.
  1. **0번 장을 가장 센 장으로**
     - 먹단지 0번 장
       - 지금 1번 장의 먹 튐(r10, 팔 8, reach 1.8~3.1, 가로 약 62)을 0번 장으로 당깁니다.
       - 흰 백자 조각 다섯(안쪽 p300)은 중심에서 8~12 떨어진, 막 갈라진 자리에 둡니다.
       - 꼭지 없는 뚜껑은 왼쪽 위로, 끊긴 청록 목 끈은 오른쪽 위로 날립니다.
       - 섬광 r22~24는 먹 튐 뒤로 갈래가 보이게 합니다(종이 면적 ≤ 박스의 30%).
       - 단지 몸(`potCracking`)은 착탄 장에서 뺍니다. 깨지기 전 단지는 2차 비행 그림의 몫입니다.
     - 먹단지 1번 장은 조각을 15~19로 옮기고 방울을 단 지금 1번 장, 2번 장은 지금 그대로입니다.
     - 송이 단지 0번 장: 먹 튐 r6.5, 팔 6, reach 1.9~3.0(가로 ≥ 38) + 흰 조각 둘 + 끈 조각. 흰 원판은 없습니다.
  2. **`punch`: 맞는 순간 고리를 굵게**(SPEC만 바꾸므로 조각 넓이는 늘지 않음)
     - `SPEC.ring[id].punch = {scale, seconds: 0.1}`. 모든 층의 굵기에 m을 곱합니다. m = 1 + (scale−1)·(1−u)², u = clamp(나이/0.1). 중심선은 그대로 R(grow)입니다.
     - scale 값
       - inkPots·meteorBrush 2.2
       - tarJar·inkLightning·fallingScroll 2.0(파문 호·전체 원·core 모두)
       - clusterPots 1.8
       - seventhSeal 1.5
     - band·jag·multi(붓 폭우, nova 넷)에는 넣지 않습니다.
     - 감소 모션에서는 scale ≤ 1.5입니다.
     - 넣을 자리: `drawRing`의 stroke 분기(:1700-1705)와 ripple 분기(:1734-1738).
  3. **`splash`: R에 맞춰 커지는 먹 튐**(새 매개 도형, inkPots·clusterPots·meteorBrush)
     - 값

       | 무기 | n(각성) | from | to | width | jitter | fork | drop p·r·gap | grow from·초 | fade at |
       |---|---|---|---|---|---|---|---|---|---|
       | inkPots | 7~9 (8~10) | 0.12 | 0.42~0.72 | 5~10 | 0.4 | 0.25 | 0.5 · 1.8~3.2 · 4~9 | 0.3 · 0.06 | 0.4 |
       | clusterPots | 5~6 (6~7) | 0.15 | 0.35~0.58 | 4~7 | 0.4 | 0 | 0.35 · 1.4~2.4 · 3~6 | 0.3 · 0.05 | 0.4 |
       | meteorBrush | 8~10 (10~12) | 0.10 | 0.50~0.82 | 7~14 | 0.35 | 0.35 | 0.6 · 2.6~4.6 · 6~14 | 0.25 · 0.07 | 0.5 |

     - 식(R0 = 다 자란 R, 사건 seed, jit 1700~1799는 지금 비어 있음)
       - 가시 수 n = n0 + ⌊J(1700)·(n1−n0+1)⌋
       - 방향 θk = 2π·J(1701) + (k + 0.5 + (J(1710+k)−0.5)·2·jitter)·2π/n
       - 밑 rb = from·R0, 끝 rt = lerp(to)·J(1730+k)·R0, 반폭 = lerp(width, J(1740+k))/2, 휨 = (J(1750+k)−0.5)·0.5·반폭
       - 가시 모양: 밑이 넓고 끝이 뾰족한 쐐기. 점 (rb, −h) → (rb+0.45L, −0.55h+휨) → (rt, 0) → (rb+0.45L, 0.55h+휨) → (rb, h)
       - 갈래: J(1760+k) < fork면 끝 30%를 두 갈래(±7°, 길이 L과 0.82L)로 나눕니다.
       - 방울: J(1770+k) < p면 rt + gap(J(1780+k)) 자리에 r(J(1790+k))짜리 눈물꼴 타원(반지름 방향 1.7r)을 둡니다. 끝 + 방울이 R0−6을 넘으면 그 방울은 뺍니다.
       - 길이는 grow로 자랍니다. 방울은 다 자란 뒤 나타나고, fade at 뒤로 직선으로 사라집니다. 감소 모션에서는 다 자란 길이에서 α만 0.06초에 걸쳐 들어옵니다.
     - 칠은 ink만 씁니다. 종이와 청록은 없습니다.
     - 그리는 자리: `DRAW.strike/lob`(:1761-1777)의 ground 다음, rings 앞입니다. 고리가 가시 위에 옵니다.
     - 꼴 규칙
       - 가운데를 흰 구멍으로 비우지 않습니다(K7 폭탄병 폭발과 구별).
       - 방울에 종이 점을 찍지 않습니다(적 탄과 구별).
       - 고리 위나 바깥에는 아무것도 두지 않습니다.
       - 먹 면적은 원판 넓이의 10% 이하입니다(적 몸을 가리지 않게).
     - 상한: `SPEC.caps.splash = [12, 8, 3]`(full/reduced/minimal, 화면당 사건 수)
     - LOD
       - reduced: 짝수 k 가시만, 방울 없음
       - minimal: clusterPots 0, 나머지는 가시 3개(k = 0, ⌊n/3⌋, ⌊2n/3⌋)
     - `paths`에 `splash`(가시 끝점)와 `drops`를 냅니다. C9에 `["inkPots","land",{radius:92,seed:9}]`, `["clusterPots","land",{radius:64,seed:9}]`를 더합니다.
  4. **족자 파문**(:360)
     - 호: 0.72R은 [[ink,3],[p50,1.6]], R은 [[ink,3.4],[p50,2]]
     - 전체 원: [[ink,1.6,0.6]]
- **바꾸면 안 되는 것**
  - 모든 박스·앵커·장 수·drive·초·층·lod
  - 고리 중심선 R, grow·fade·틈·core, 색 토큰, 데칼 `splat`·`pool`·`crater`
  - §8의 보존 해시 셋
- **합격 기준**(`k10-impact-ages`, 1배·0.8배, 색·흑백)
  - 나이 0.02초
    - 먹단지: 먹 덩어리가 5방향 이상에서 0.5R 이상 뻗고, 흰 백자 조각이 보이고, 흰 공은 없습니다.
    - 송이 단지: 사건마다 0.45R 이상이고, 12~18px 흰 원판이 없습니다.
    - 유성 붓: 6방향 이상에서 0.6R 이상, 갈래 2개 이상입니다.
    - 고리 먹은 6 이상(송이 단지 4.5 이상)이고, 0.1초 뒤 기본 굵기로 돌아옵니다.
  - 흑백에서 먹단지·유성 붓이 핵심 골분 박격(흰 별 + 점)과 한눈에 갈립니다.
  - 족자의 판정 원 뒤 절반이 1배에서 보입니다.
  - C2 = 137장, 넓이 341,032(M2 반영). C6·C7·C8·C10 통과, C9에 새 사례 출력.

#### M2: 유성 붓 비백 줄기가 적 imminent 눈금으로 읽힌다
- **본 렌더**: `k10r1-meteor-vs-imminent-gray2`(유성 붓 / 적 imminent 원 / 핵심 골분 박격), `k10-t3-awakened-labels`
- **문제**
  - 쐐기 6~8개가 R+2에 바깥을 향해 고르게 놓입니다. 흑백에서 적 imminent 원의 방사 쐐기 8개와 같은 꼴입니다(V3).
  - 지시서 §1.7의 '고른 방사 눈금'과 '흉내 금지'에 걸립니다.
  - 핵심 골분 박격의 바느질 눈금과도 닮았습니다. 작가도 알려진 한계로 적었습니다.
- **원인**: layout `{prim:'ring', parts:['streak-a','streak-b'], count:[6,8], jitter:0.35, dr:2}`(:400), `streakArt` :1085-1098
- **처방**
  - `streak-a/b` 조각(PT :529-530, ART :1085-1098)과 그 layout 항목을 뺍니다(−4장, −2,560 단위²).
  - 방사로 튀는 먹은 M1 splash(원판 안쪽)가 맡습니다.
  - R−4 ~ R+30 사이에는 고리 말고 아무것도 두지 않습니다.
- **합격 기준**: `k10-meteor-vs-imminent-gray`에서 유성 붓 고리 둘레에 눈금이나 쐐기가 없습니다. API §5·§7.6과 C2 표를 고칩니다.

#### M3: C15. K9 검수 6차가 지적한 꼴을 피한다
- K9 수정본이 검수 7차를 통과하면 그 꼴에 맞춥니다. 그 전에는 K9 검수 6차의 M1~M3 처방을 같은 기준으로 씁니다.

**(a) 타르 항아리 `crack`**
- **본 렌더**: `k10r1-tar-vs-bomber-game`(게임 표시 배율에서 K7 폭탄병 둘과 나란히), `k10r1-zoom-c15risk`
- **문제**
  - 0번 장이 '둥근 검은 몸 + 흰 지그재그 금 + 위쪽 광택 + 몸을 두른 띠'입니다. 폭탄병 몸(약 30)과 크기도 그림 언어도 같습니다(지시서 §2.4, K9 검수 6차 M2).
  - 1번 장에서는 청록 끈이 위로 말려 올라가 심지로 읽힙니다.
- **원인**
  - 타르 돔(:1006)이 입을 덮어 윤곽이 공이 됩니다.
  - 흰 금(:1008), 광택 호와 종이 점(:1007), 몸 띠(:1009)
  - 1·2번 장의 갈라진 가장자리가 흰 지그재그입니다(:1024 p300 0.8).
  - 1번 장의 끈 `M10,-24 C13,-28 17,-29 20.6,-27`(:1027)
- **처방**
  1. 0번 장: 항아리를 25~35° 눕혀 입을 오른쪽 아래로 둡니다.
     - 입은 p50 2 테를 두른 열린 타원입니다.
     - 번들한 타르가 입술에서 쏟아집니다.
     - 반대쪽 끝에 굽이 보입니다.
     - 몸은 축 방향 길이 : 폭 ≥ 1.3이고, 위가 둥근 돔이 아닙니다.
  2. 흰 지그재그는 모든 장에서 뺍니다.
     - 갈라짐은 입 가까이의 어두운 금(ink500, 1 이하)과 깨진 면의 어두운 안쪽(ink700)으로 보입니다.
     - 단면은 지그재그가 아니라 굽은 도자기 단면입니다.
  3. 청록 봉인 끈은 목을 감고, 끝은 몸이나 땅을 따라 처집니다. 윤곽 위로 솟지 않습니다(:1027 포함).
  4. 파편은 몸에서 떨어진 휜 조각 1~2개입니다(네모 금지).
- **바꾸면 안 되는 것**: 80×56, 앵커 (40,34), 3장, 0.32초, 검은 항아리(ink500 명부), 타르 줄, 청록 끈, `pool`
- **합격 기준**: 1배·3배와 흑백에서 '굽과 입이 보이는 쓰러진 항아리'로 읽히고, 폭탄병 둘과 갈립니다.

**(b) 유성 붓 `impact`·`impact-awakened`**
- **본 렌더**: `k10r1-meteor-impact-x6`, `k10r1-c15-k9-current`
- **문제**
  - '긴 막대 + 자루 끝 밖으로 꺾인 청록 토막 + 좌우 대칭의 만화 폭발 별'이라 다트나 폭죽이 박히는 그림으로 읽힙니다.
  - 붓털은 0·1번 장 모두 먹 튐에 덮여 안 보입니다.
  - 자루 끝 p300 타원은 펜 뚜껑으로 읽힙니다.
  - K9 검수 6차 M1(로켓)과 같은 그림 언어입니다. 지금 고치는 K9는 '먼 끝이 넓어지는 마른 꼬리 + 짓눌린 붓털' 쪽으로 가고 있습니다.
- **원인**
  - `tuft`(:1044)가 약 5×8로 작고 먹 튐 아래 묻힙니다.
  - `E(-25.6,-37.8,2.8,2.1,'p300')`(:1047)
  - 청록 토막 `SW('M-26.6,-38.8 C-29,-40 -31.6,-40.4 -34.6,-40.2',…)`(:1054)
  - 섬광 `starD(0,-12,30,7,151,…)`(:1053)
- **처방**
  1. 붓털을 2~3덩이로 짓눌러 부채꼴로 벌립니다. 한 덩이 이상은 먹 튐 가장자리 밖으로 6 이상 나옵니다. 깔끔한 뾰족 끝은 쓰지 않습니다.
  2. 자루 끝은 둥근 먹 마개 + 걸이 고리(먹 1.2, 지름 약 6)로 합니다. p300 타원은 뺍니다. 고리가 박스−3 안에 들도록 자루를 3~4 줄입니다.
  3. 청록 토막은 뺍니다. 0번 장에만 꼬리 자락을 박스 안에 둡니다.
     - 꼬리는 자루를 감싸고, 자루 끝 쪽으로 넓어지며, 끝에서 3~4갈래 마른 결로 흩어집니다.
     - 청록 심은 쇠테 쪽에서 시작해 꼬리 가운데를 따라갑니다.
     - 1번 장에는 꼬리가 없습니다.
  4. 섬광(flash true)은 진행 방향(오른쪽 아래)으로 치우친 찢긴 종이 터짐으로 합니다. 갈래 길이 최대/최소 ≥ 1.6이고, 대칭 별은 금지입니다.
  5. (선택) 자루에 대나무 마디 둘
- **바꾸면 안 되는 것**: 88×68, 앵커 (44,46), 3장, 0.36초, flash, 왼쪽 위에서 머리부터 박히는 방향, 2번 장, `crater`
- **합격 기준**: 6배·1배에서 '붓털이 보이는, 머리부터 박힌 붓 + 혜성 꼬리'로 읽힙니다. 로켓·다트·폭죽·펜으로 읽히지 않습니다.

**(c) 일곱째 인장 `print-a/b/c`**
- **본 렌더**: `k10r1-seal-prints-decal`·`-layout`(2배, 1·5장)
- **문제**
  - 세 변형이 같은 올가미 곡선을 씁니다. 일곱 인장이 같은 필기체 'e' 하나를 반복합니다(지시서 §1.7 같은 기호 셋 이상, §2.2 인영 안 글자).
  - 1배 약 34×14px에서는 '먹 테 아몬드 + 치우친 안쪽 표지'라 곁눈질하는 눈으로도 읽힙니다(K9 M3와 같은 그림 언어).
- **원인**: `printArt` :797-812. 매듭 점 `kp`(:808)가 rx 배율로만 바뀝니다(:813-815).
- **처방**
  1. 테는 둘레의 70~85%만 찍힌 호 1~2개로 하고, 틈 자리를 변형마다 다르게 합니다.
  2. 매듭 획은 가운데를 벗어나 테에 닿거나 걸치고, 인영 폭의 50% 이상입니다.
  3. 변형마다 다른 획을 씁니다: a 열린 고리, b ㄱ자로 말림, c S자 굽음. layout에 좌우 반전(J(955) < 0.5)을 더해 여섯 꼴을 만듭니다.
  4. 하나는 한쪽이 진하게 찍힌 반달 인영입니다. 테 굵기를 2.4 → 0.8로 바꾸고, 종이 채움은 늘리지 않습니다(C10 α0.25 그대로).
  5. 가운데 점, 가운데를 지나는 획은 계속 금지입니다.
- **바꾸면 안 되는 것**: 48×24, 앵커 (24,12), rx 17·13.5·10.5, α0.25, 1.2초, 변형 셋, `seal`·`seal-awakened`
- **합격 기준**: 2배·1배에서 같은 글자의 반복이나 눈으로 읽히지 않고, 찍힌 자국으로 읽힙니다.

#### M4: 족자 기울기(결정 (a)를 따름)
- **문제**
  - 3.5°로는 꼭대기가 약 6 옮겨질 뿐이라 1배에서 쓰러지는 무게감이 보이지 않습니다.
  - K9 아이콘의 족자는 8° 기울어 있습니다.
- **원인**: `scrollArt` :720 `tilt = [0, 3, 3.5, 3.5][fr]`, TX 회전 :753
- **처방**
  1. 모든 장을 0°로 바로 세워 굽습니다. 0번 장의 눌림과 끈 흔들림(:725)은 그대로 둡니다.
  2. `SPEC.tilt = {fallingScroll: {parts: ['scroll','scroll-awakened'], deg: [0,6,12,12], sign: 954}}`
     - 렌더러는 장 번호로 각을 고르고, 부호 s = J(954) < 0.5 ? −1 : +1을 곱해 앵커를 축으로 돌립니다.
     - 조각을 좌우 반전하지 않습니다. 빛이 왼쪽 위라 반전하면 그늘이 뒤집힙니다.
  3. `draw`의 `putItems`(:1679-1691)도 같은 규칙을 씁니다.
  4. `paths`에 `tilt`를 내고, C9에 `["fallingScroll","impact",{radius:110,seed:4}]`를 더합니다.
- **바꾸면 안 되는 것**: 52×104, 앵커 (26,98), 4장, 0.42초, 각성 종이 혀
- **합격 기준**
  - 1배에서 1·2번 장의 기울어짐이 보입니다(꼭대기가 약 10·19 옮겨짐).
  - 사건마다 좌우가 섞입니다.
  - C7 0건

### 4. 권장
- **R1 서리 고리**: 1배에서 '흰 서리 띠'가 약하고, 결정이 6배에서 흰 깃털이나 화살촉처럼 보입니다(`k10r1-frost-band-x1`, `-small-objects-x6`).
  - 띠: α는 그대로 두고 폭 11~13 → 14~17, 안쪽 술 h 1.5~6 → 2~7(:363)
  - 결정
    - 둥근 밑동(:836)을 각진 조각으로 바꿉니다.
    - 가시를 한쪽 반이 p300인 곧은 각기둥으로 하고, 가시 사이에 틈 0.6~1을 둡니다.
    - 길이는 박스 안 최대로: 평상 14~27(지금 10~24, :846-848), 각성 18~35(:849-850)
- **R2 천둥 박수**: 두 손이 같은 32°(:886)라 확대하면 기울인 합장에 가깝습니다.
  - K9 #37처럼 두 손의 각을 20° 이상 다르게 합니다(예: 40°·14°).
  - 한 손은 p300으로 칠합니다.
  - 섬광 r8.6 → 10~11
- **R3 심판선**: 신화 무기인데 1배에서 빔 넷 중 가장 가늡니다.
  - 줄 층에 punch {2, 0.06초}를 넣고, 떨림 잔상 bow를 6 → 9로 합니다(:379).
  - 조각은 바꾸지 않습니다.
- **R4 서리 사슬 얼음판**: 금 둘('V'와 '\', :1127)이 같은 높이에 나란해서 6배에서 감은 눈 한 쌍처럼 보입니다. 하나는 판 가장자리에서 시작하고 높이를 다르게 합니다(발밑이라 위험은 낮음).

### 5. 지시서와 다르게 한 것 15건

| # | 판정 | 근거 |
|---|---|---|
| 1 K 구현값 hex | 수용 | COLOR_MAP 키와 겹치지 않아 구운 색이 K4와 같습니다. C6 0 |
| 2 붓 폭우 b 길이 68 | 수용 | 박스 한계입니다. 18°/26° 기울기 차로 '////'을 피합니다(1배 확인) |
| 3 족자 3~3.5° | **그대로 받지 않음 → M4** | 1배에서 보이지 않습니다 |
| 4 서리 띠 α0.5 + fade 0.3 | 수용 | C10(짧은 띠 ≤ 0.69, 0.3초 넘는 채움 ≤ 0.62)을 지키는 값입니다. 보완은 R1 |
| 5 인장 원판 합집합 | 수용 | 일곱 원판이 겹쳐도 한 밝기입니다(1배 확인). 렌더러 규칙 필요 |
| 6 일식 코사인 초승 | 수용 | 끝이 뾰족한 초승으로 읽힙니다. 지시서의 식이 틀렸습니다 |
| 7 얼음판 비율 0.28~0.38 | 수용 | 발 범위(marks.rects) 때문입니다 |
| 8 grow·등장·데칼 페이드·reduced에서 deco 절반 | 수용 | |
| 9 정하지 않은 값 채움 | 수용 | 족자 파문 굵기는 M1에서 바꿉니다 |
| 10 해석한 것 | 수용 | |
| 11 출력 형식에 더한 것 | 수용 | idx 데칼의 `seconds`는 창이 아니라 수명 참고값입니다(§7) |
| 12 각성 가는 선은 고리·halo에만 | 수용 | |
| 13 거세지는 폭우 기믹 미등록 | 수용 | 3차에서 등록합니다 |
| 14 jit 번호 이동 | 수용 | TypeScript 이식은 API §8.1의 번호를 따릅니다 |
| 15 돌린 물건을 실제 좌표로(TX) | 수용 | |
| 납품서에 없음: 서리 결정 길이 10~24(지시서 18~40) | 수용 | 제 지시서의 박스 36×32(앵커 x 6)로는 27까지만 들어갑니다. 지시서 오류입니다. R1 |

### 6. 결정 요청 두 건(납품서 §7-8)
- **(a) 족자 박스를 넓힐까**
  - 넓히지 않습니다. M4대로 렌더러가 돌립니다. 조각 넓이가 늘지 않고, 사건마다 좌우가 섞이며, 렌더러는 이미 조각을 돌리고 있습니다(radial 등).
  - 렌더러 회전을 원하지 않으면 대안이 있습니다.
    - 박스 76×104, 앵커 (38,98)로 넓히고, 조각 안에서 0·6·12·12°로 그립니다.
    - 넓이는 +19,968 단위²(→ 363,560)입니다.
    - 남은 여유(상한 64만 − 계획 약 61만 ≈ 2.9만, M2 뒤 약 3.2만)의 2/3를 씁니다.
- **(b) 서리 띠 α0.5 + fade 0.3**: 받아들입니다. 렌더러는 띠의 α를 시간에 따라 바꿔야 합니다(`frostRing.band.tail`).

### 7. 메인 세션: 등록 때 주의할 것
1. **지금 굽지 않습니다.**
   - M1~M4가 inkPots·clusterPots·tarJar·meteorBrush·seventhSeal(인영)·fallingScroll 조각을 바꿉니다.
   - SPEC에도 punch·splash·tilt가 더해지고, 유성 붓 layout이 바뀝니다.
   - 검수 2차 합격 뒤에 굽습니다. `afx/meteorBrush/streak-*` 키는 없어지므로 등록하지 않습니다.
2. **지금 시작해도 되는 것**: 렌더러(ArsenalFxPainter)로 옮기는 일 중 바뀌지 않는 부분입니다. 이 부분은 보존 해시 `k10-keep-draw`로 묶여 있습니다.
   - band·jag·multi
   - sag·twist·links
   - blade·brushBand·string·capsule
   - comet·rope·crescent·wash 합집합
   - layout의 ring·point·tip·line·tail·head
   - frameFor·데칼 α·LOD·감소 모션 규칙
   - stroke·ripple 고리는 punch를 받을 자리를 비워 두고 옮깁니다.
3. **굽기(검수 2차 뒤)**
   - `scripts/build-atlas.mjs:11` `KIT_FILES`에서 'k-icons2.js' 바로 뒤에 'k-arsenal-fx.js'를 넣습니다(의존 없음).
   - `art/atlas-spec.mjs` PACKS에 'arsenal-fx'를 더합니다.
   - K9·K11이 같은 폴더에서 작업 중이므로 커밋한 HEAD 스냅숏에서 굽습니다.
   - 굽기 전에 C8 고정값과 검수 2차의 K10 해시를 확인합니다.
4. **렌더러 규칙**
   - 일곱째 인장 원판: 같은 틱·같은 source의 사건을 한 경로(nonzero)로 한 번 채웁니다.
   - 연쇄 점 조각은 자라는 선이 그 점에 닿은 뒤에 그립니다.
   - head 조각은 (0, −66)에 놓고, 디버프 타이머가 있으면 +26 올립니다.
   - jit 번호는 API §8.1을 따릅니다. 수정 뒤에는 1700~1799·954·955가 더해집니다.
   - idx 데칼은 `SPEC.life[id].decal`과 `decal.fadeAt`으로 그립니다.
   - `presentation.ts:286-289`의 표시 수명은 `SPEC.life[id].mark`로 바꿉니다.
   - splash 상한 12/8/3을 지킵니다.
5. **`npm run test:visual`(연결 뒤)**
   - boneMortar 6종의 착탄 직후 0.1초 안 프레임(1440×900, 1024×720)
   - 유성 붓과 적 imminent 원 예고를 흑백으로 함께
   - 인장의 데칼 단계(1.2초)
   - 타르 항아리와 폭탄병 둘
   - 족자 여러 번(좌우 기울기)
   - 감소 모션·감소 섬광, minimal
6. **지시서 정정**: `docs/art/briefs/arsenal-fx.md`에 아래를 더합니다.
   - 서리 결정 길이: 평상 14~27, 각성 18~35
   - '판정 고리 먹 ≥ 3'의 예외: 인장·송이 단지 2.6. 대신 punch로 보완
   - §1.5에 splash·punch·tilt 추가
   - lob 착탄의 0번 장은 가장 센 장이고, 깨지기 전 단지는 비행의 몫
   - 유성 붓 streak 삭제
   - 족자 기울기는 렌더러가 돌림
   - C9 사례 셋 추가, §8의 새 명령 넷 추가
7. **2차 발주(lob 비행) 때 함께 줄 것**
   - 혜성은 K9 M1의 문법(먼 끝이 넓어지는 마른 꼬리, 짓눌린 붓털, 먹 마개 + 걸이 고리)
   - 단지 뚜껑에 꼭지 없음(K9 #38)
   - 타르 항아리는 입과 굽(K9 M2)
   - 땅에 닿는 순간 비행 그림을 지우고 착탄 0번 장으로 바로 넘깁니다.

### 8. 검수 2차에서 돌릴 것
- C1·C2·C6·C7·C8·C9(사례 셋 추가)·C10·C15를 다시 돌립니다.
- **보존 해시**: 아래 셋이 지금 값과 같아야 합니다. 이 묶음은 고치지 않는 조각·draw·공통 SPEC입니다.
  - 지금 값: `k10-keep-stamps=1oioxia len=158464`(첫 글자는 숫자 1), `k10-keep-draw=tlb0e8 len=1615017`(둘째 글자는 소문자 l, 넷째는 숫자 0), `k10-keep-spec=v6ki5j len=2682`

```
node scripts/art-review-sheet.mjs expr --name k10-keep-hash --scale 1 --crop 0,0,1500,90 --expr '(function(){var X=PN.arsenalFx;function norm(m){return String(m).replace(/\bkaf\d+_/g,"kaf_");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}function cc(s){return s.split("").map(function(c){return c.charCodeAt(0);}).join(",");}var KA=["brushDownpour","inkPulse","silenceBell","sparkThread","stormThread","frostChainlet","inkLance","wideBrush","crossStrokes","inkOrbit","wardRing","eclipseHalo"],KS={inkLightning:["bolt","bolt-awakened","scorch"],seventhSeal:["seal","seal-awakened"],judgmentLine:["inkbox","inkbox-awakened","flick-a","flick-b"]},A="",B="",C="";KA.forEach(function(id){X.parts(id).forEach(function(p){for(var f=0;f<p.frames;f++)A+=norm(X.stamp(id,p.part,{frame:f}));});var st=X.META[id].main;[false,true].forEach(function(aw){[1,5].forEach(function(lv){[0.1,0.5,0.9].forEach(function(p){B+=norm(X.draw(id,st,{level:lv,awakened:aw,p:p,t:p*0.3,seed:7}));});});});});Object.keys(KS).forEach(function(id){KS[id].forEach(function(part){var P=X.parts(id).filter(function(q){return q.part===part;})[0];for(var f=0;f<P.frames;f++)A+=norm(X.stamp(id,part,{frame:f}));});});var S=X.SPEC;["jit","headY","headLift","footClear","faceZone","rim","awakened","decal","life","zorder","reference","priority","marks","fills","lob","lobMini"].forEach(function(k){C+=k+":"+JSON.stringify(S[k])+";";});var ha=h(A),hb=h(B),hc=h(C);var L=["k10-keep-stamps="+ha+" len="+A.length+" codes="+cc(ha),"k10-keep-draw="+hb+" len="+B.length+" codes="+cc(hb),"k10-keep-spec="+hc+" len="+C.length+" codes="+cc(hc)];return "<rect width=\"1500\" height=\"90\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(22+i*26)+"\" font-size=\"13\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

- **1배 타격감(M1)**: `SEL`을 "lob"·"strike"로 바꾸고, `GRAY`, `--scale 1`·`0.8`로 돌립니다.

```
node scripts/art-review-sheet.mjs expr --name k10-impact-ages-lob --scale 1 --check --expr '(function(){var X=PN.arsenalFx,SEL="lob",CH=1,GRAY=false,AW=false,AGES=[0.02,0.08,0.2],CW=420,RH=400;window.__k10=(window.__k10||0)+1;var fid="k10i"+window.__k10;var SETS={lob:[["inkPots","land"],["clusterPots","land"],["meteorBrush","land"],["tarJar","land"]],strike:[["fallingScroll","impact"],["seventhSeal","impact"],["inkLightning","impact"],["brushDownpour","impact"]]},L=SETS[SEL],W=CW*AGES.length,H=RH*L.length,R=PN.rng(77);R();var SCL={stalker:0.9,charger:0.963,shooter:0.783,warden:1},ROLE=["stalker","stalker","charger","stalker","shooter"];var s=PN.env.ground(CH,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null}),top="";L.forEach(function(q,ri){AGES.forEach(function(age,ci){var ox=ci*CW+CW/2,oy=ri*RH+RH/2+16,bodies=[];for(var e=0;e<5;e++){var a=R()*6.283,d=30+R()*90,x=ox+Math.cos(a)*d,y=oy+Math.sin(a)*d*0.8,r=ROLE[e],m=PN.enemies.meta(CH,r),k=m.displayScale*SCL[r];bodies.push([y,"<g transform=\"translate("+(x-m.feet[0]*k).toFixed(1)+","+(y-m.feet[1]*k).toFixed(1)+") scale("+k+")\">"+PN.enemies.draw(CH,r,{lod:"game",frame:e%4})+"</g>"]);}bodies.sort(function(a,b){return a[0]-b[0];});s+=bodies.map(function(b){return b[1];}).join("");var life=X.SPEC.life[q[0]].mark;s+="<g transform=\"translate("+ox+","+oy+")\">"+X.draw(q[0],q[1],{level:3,awakened:AW,p:Math.min(0.999,age/life),t:age,seed:5+ri*7+ci})+"</g>";top+="<text x=\""+(ci*CW+8)+"\" y=\""+(ri*RH+20)+"\" font-size=\"13\" font-family=\"monospace\" fill=\"#101312\">"+q[0]+" age "+age+"s</text>";});});var body=s+top;return GRAY?"<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0\"/></filter></defs><g filter=\"url(#"+fid+")\">"+body+"</g>":body;})()'
```

- **M2**:

```
node scripts/art-review-sheet.mjs expr --name k10-meteor-vs-imminent-gray --scale 1 --check --expr '(function(){var X=PN.arsenalFx,W=1100,H=420;window.__k10=(window.__k10||0)+1;var fid="k10v"+window.__k10;var s=PN.env.ground(1,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null});s+="<g transform=\"translate(200,210)\">"+X.draw("meteorBrush","land",{level:3,p:0.08,seed:3})+"</g>";s+="<g transform=\"translate(550,210)\">"+PN.vfx.telegraph("circle","imminent",160,{})+"</g>";s+="<g transform=\"translate(900,210)\">"+PN.skillVfx.draw("boneMortar","blast",{})+"</g>";return "<defs><filter id=\""+fid+"\"><feColorMatrix type=\"matrix\" values=\"0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0\"/></filter></defs><g filter=\"url(#"+fid+")\">"+s+"</g>";})()'
```

- **M3a**: `--scale 3`과 `--scale 1`로 돌립니다.

```
node scripts/art-review-sheet.mjs expr --name k10-tar-vs-bomber --scale 3 --check --expr '(function(){var X=PN.arsenalFx,B=PN.bombers,s="<rect width=\"420\" height=\"90\" fill=\""+PN.env.CH[1].base+"\"/>";[0,1,2].forEach(function(f){s+="<g transform=\"translate("+(6+f*86)+",14)\">"+X.stamp("tarJar","crack",{frame:f})+"</g>";});[["fuse","idle"],["burst","idle"]].forEach(function(q,i){var m=B.meta(1,q[0]),k=m.displayScale;s+="<g transform=\"translate("+(290+i*64-m.feet[0]*k).toFixed(1)+","+(76-m.feet[1]*k).toFixed(1)+") scale("+k+")\">"+B.draw(1,q[0],{state:q[1],lod:"game"})+"</g>";});return s;})()'
```

- **M3c**: layout을 거치므로 반전도 반영됩니다. `--scale 2`와 `1`로 돌립니다.

```
node scripts/art-review-sheet.mjs expr --name k10-seal-prints --scale 2 --check --expr '(function(){var X=PN.arsenalFx,s="";[1,5].forEach(function(ch,ci){var ox=ci*380;s+="<g transform=\"translate("+ox+",0)\">"+PN.env.ground(ch,380,300,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null})+"</g>";for(var k=0;k<7;k++){var a=2*Math.PI*(k+0.7*X.jit(3,960+k))/7,rr=0.35+0.65*Math.sqrt(X.jit(3,980+k)),x=ox+190+120*Math.cos(a)*rr,y=150+80*Math.sin(a)*rr;X.layout("seventhSeal","impact",{seed:3+17*k}).filter(function(it){return it.z==="ground";}).forEach(function(it){var P=X.parts("seventhSeal").filter(function(p){return p.part===it.part;})[0];s+="<g transform=\"translate("+x.toFixed(1)+","+y.toFixed(1)+")"+(it.flip?" scale(-1 1)":"")+" translate("+(-P.anchor[0])+","+(-P.anchor[1])+")\">"+X.stamp("seventhSeal",it.part,{frame:0})+"</g>";});}});return s;})()'
```

### 9. 남은 것과 확인하지 못한 것
- **미확인**
  - 실제 게임 화면: 렌더러를 연결하기 전입니다.
  - 성능: K11과 함께 잽니다.
  - 팩 바이트와 페이지 수
  - splash와 punch의 실제 효과: 이번 처방은 설계값이고, 1배에서 충분한지는 검수 2차 렌더로 다시 판단합니다.
- **T3**: 그림을 이미 본 판독입니다. 정식 판독 시험(n ≥ 8)에 boneMortar 6종의 1배 착탄을 넣어 주세요.
- **K9 쪽**
  - K9 M1~M3 수정본은 아직 검수 7차 전입니다. K10 검수 2차에서 C15를 다시 대조합니다.
  - 인장 손잡이: K9 수정본은 공 + 막대입니다. K10의 납작한 갓은 '머리'로 읽히는 것을 피한 꼴이라, K9 결과를 보고 정합니다.
- **서리 띠**: 1배 판독은 움직이는 화면에서 다시 봅니다(R1).

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`(검수 6차 M1~M3)
- `/Users/kyuukkang/CT_AX/07.playground/art/atlas-spec.mjs`(COLOR_MAP :14-21)
- `/Users/kyuukkang/CT_AX/07.playground/scripts/build-atlas.mjs`(KIT_FILES :11)

---

## 1차 수정 납품서

검수 1차의 필수 M1~M4와 권장 R1~R4를 모두 넣었습니다. 그 사이 확정된 K9 검수 7차 §7(R7·F2 포함)을 C15 꼴 기준으로 맞췄습니다.

먼저 확인이 필요한 것 두 가지:
- **M1 합격 기준(나이 0.02초)은 처방한 식·값으로는 닿지 않습니다.** 식·값은 처방대로 두고 실측값을 적었습니다(§4 표). 검수서 §9가 punch·splash를 '설계값, 검수 2차에서 다시 판단'이라고 했기 때문입니다.
- **인장 몸은 K9 기준과 다릅니다.** K10 `seal`은 납작한 갓이고, K9 §7은 공 꼭지입니다. `seal`·`seal-awakened`는 '바꾸면 안 되는 것'이고 보존 해시 안에 있어 손대지 않았습니다. 맞출지는 검수자가 정해야 합니다.

`--check`는 모두 ok, kit error 0건입니다. 고친 파일은 아래 둘뿐이고, 아무것도 내려받지 않았습니다.
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`

### 1. 납품 목록 — 바뀐 것
- **네임스페이스·공개 API는 그대로입니다**(`PN.arsenalFx`). `SPEC.version`만 `1.0-d1r1`로 올렸습니다(:365, keep-spec에 들지 않음).
- **새 SPEC**
  - `ring[id].punch`: :389-406. inkPots·meteorBrush 2.2, tarJar·inkLightning·fallingScroll 2.0, clusterPots 1.8, seventhSeal 1.5, 모두 seconds 0.1·reducedMax 1.5.
  - `splash`: :407-416. shape + inkPots·clusterPots·meteorBrush, 검수서 표 값 그대로.
  - `tilt`: :417-421.
  - `caps.splash` [12,8,3]: :476.
  - judgmentLine `punch {2, 0.06}`, `after.bow` 9: :430.
  - frostRing `width` [14,17], `fringe.h` [2,7]: :399.
  - fallingScroll 파문: [[ink,3],[p50,1.6]] / [[ink,3.4],[p50,2]], 전체 원 [[ink,1.6,0.6]]: :396.
- **layout**
  - 인영에 `flip: 955`를 넣었습니다(:443).
  - 유성 붓 streak 항목을 지웠습니다(:451).
- **조각**
  - 유성 붓 `streak-a/b`를 지웠습니다(PT·ART). 141 → **137장**, 넓이 343,592 → **341,032**.
  - 장 수·박스·앵커·초는 하나도 바꾸지 않았습니다.
- **다시 그린 조각**

  | 조각 | 위치 | 항목 |
  |---|---|---|
  | inkPots `shatter` 0번 장 | `porcelain`·`SHATTER0`·`shatterArt` :1006-1040 | M1 |
  | clusterPots `burst` 0·1번 장 | `CLUSTER_ARMS`·`clusterArt` :1065-1093 | M1 |
  | tarJar `crack` 3장 | :1095-1144 | M3a |
  | meteorBrush `impact`·`-awakened` 0·1번 장 | :1171-1264 | M3b |
  | `print-a/b/c` | `PRINTS`·`printArt` :845-873 | M3c |
  | `scroll`(똑바로 굽기) | `scrollArt` :766-802 | M4 |
  | frostRing `shard-*` | `prismGeo`·`shardArt` :888-925 | R1 |
  | `clap` | `clapArt` :939- | R2 |
  | `rime12/19/28` 금 | `rimeArt` :1305-1307 | R4 |

- **그리기·식**
  - `punchM`·`thick`, `splashGeo`·`splashKeep`·`spikeOutline`·`spikeTips`: :1557-1600.
  - `paths`의 splash·drops·tilt: :1826-1832.
  - `putItems`의 tilt: :1913-1929.
  - `drawRing`의 punch: :1938-1944, ripple 분기.
  - `drawSplash`·`DRAW.strike/lob` 순서(데칼 → splash → 고리 → 물건): :1999-2035.
  - `drawBeamOne` string 분기의 punch.
- **도우미**
  - `txPath`·`apM`·`inkBurstAt`·`tornD`를 더했습니다(:216-277).
  - `TX`는 알고리즘을 그대로 둔 채 `txPath`로 나눴습니다. 보존 해시로 출력이 같은 것을 확인했습니다.

### 2. API 요약 (바뀐 것만, API 문서 §2·§5~§12에 반영)
- **punch**
  - m = 1 + (s−1)(1−u)², u = clamp(나이/seconds). 감소 모션에서는 s ≤ 1.5입니다.
  - stroke 고리는 layers·inner·core, ripple 고리는 full·arcs·core 모든 층에 곱합니다. 중심선 R은 그대로입니다.
  - 각성 가는 선과 wash에는 곱하지 않습니다. band·jag·multi 고리에는 punch가 없습니다.
- **splash**
  - 검수서 식 그대로입니다(jit 1700·1701·1710+k…1790+k).
  - 갈래는 사건 중심 기준 ±7° 극좌표로 읽었습니다: A 끝 (rb+L, θ+7°), B 끝 (rb+0.82L, θ−7°), 사타구니 (rb+0.7L, 휨/2).
  - 방울은 먼 끝 rt+gap+1.7r이 R0−6을 넘으면 뺍니다.
  - 한 사건을 한 경로로 칠합니다.
  - LOD: reduced는 짝수 가시만, minimal은 송이 0·나머지 3가시. 방울은 full에서만 나옵니다.
  - 감소 모션에서는 다 자란 길이에서 α가 0.06초에 걸쳐 들어옵니다.
- **tilt**: deg[장] × (J(954) < 0.5 ? −1 : +1)만큼 앵커를 축으로 돌립니다. 조각은 똑바로 굽습니다. `paths.tilt` = [[장, 각°]]입니다.
- **인영 반전**: layout center 항목의 `flip` = J(955) < 0.5입니다.
- **jit 번호대 추가**: 954, 955, 1700~1801.

### 3. 검사 결과 (출력 원문)
렌더 폴더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`

**보존 해시 `k10-keep-hash`**(검수서 §8 명령 그대로)

| 시점 | 렌더 | 결과 |
|---|---|---|
| 수정 전 | `k10-keep-hash` | `k10-keep-stamps=1oioxia len=158464` / `k10-keep-draw=tlb0e8 len=1615017` / `k10-keep-spec=v6ki5j len=2682` |
| M1~M4·R1~R3를 모두 넣은 뒤, R4 전 | `k10-keep-hash-mid`, `-preR4` | **세 값 모두 수정 전과 같음** |
| R4 뒤(최종) | `k10-keep-hash-after`, `-final` | `k10-keep-stamps=fxjb0m len=158470` / `k10-keep-draw=2rsj2w len=1615076` / `k10-keep-spec=v6ki5j len=2682` |

- 바뀐 이유: R4가 `frostChainlet/rime12·19·28`의 금을 고쳤습니다. 이 조각은 keep-stamps에 들어 있고, 연쇄 `draw`가 이 조각을 놓으므로 keep-draw에도 들어 있습니다.
- R4 전 값이 정확히 같으므로, 바뀐 것은 R4 하나뿐입니다.
- 다음 수정부터는 최종 값이 기준입니다.

**C1** `k10-c1-all`·`-final`: ok

**C2** `k10-c2-parts`
```
frames=137 ok boxArea=341032 ok badParts=0
inkLightning/bolt f4 prog 0.24s box36x120 a18,112 target none ally info w:mark
inkLightning/bolt-awakened f4 prog 0.24s box36x120 a18,112 target none ally info w:mark
inkLightning/scorch f1 idx 0.6s box52x24 a26,12 target none ground deco w:decal
brushDownpour/stroke-a f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/stroke-b f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/stroke-a-awakened f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/stroke-b-awakened f3 prog 0.18s box48x88 a14,80 target none ally info w:mark
brushDownpour/mark-s f1 idx 0.9s box56x28 a28,14 target none ground deco w:decal
brushDownpour/mark-m f1 idx 0.9s box76x36 a38,18 target none ground deco w:decal
brushDownpour/mark-l f1 idx 0.9s box100x46 a50,23 target none ground deco w:decal
fallingScroll/scroll f4 prog 0.42s box52x104 a26,98 target none ally info w:mark
fallingScroll/scroll-awakened f4 prog 0.42s box52x104 a26,98 target none ally info w:mark
seventhSeal/seal f3 prog 0.3s box40x56 a20,50 target none ally info w:mark
seventhSeal/seal-awakened f3 prog 0.3s box40x56 a20,50 target none ally info w:mark
seventhSeal/print-a f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
seventhSeal/print-b f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
seventhSeal/print-c f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
inkPulse/splash-a f3 prog 0.3s box40x28 a6,14 ring radial ally deco w:mark
inkPulse/splash-b f3 prog 0.3s box40x28 a6,14 ring radial ally deco w:mark
frostRing/shard-a f3 prog 0.45s box36x32 a6,16 ring radial ally info w:mark
frostRing/shard-b f3 prog 0.45s box36x32 a6,16 ring radial ally info w:mark
frostRing/shard-c f3 prog 0.45s box36x32 a6,16 ring radial ally info w:mark
frostRing/shard-awakened-a f3 prog 0.45s box44x36 a6,18 ring radial ally info w:mark
frostRing/shard-awakened-b f3 prog 0.45s box44x36 a6,18 ring radial ally info w:mark
thunderclap/clap f3 prog 0.24s box60x44 a30,42 head none ally info w:mark
thunderclap/clap-awakened f3 prog 0.24s box60x44 a30,42 head none ally info w:mark
silenceBell/bell f3 prog 0.45s box40x52 a20,50 head none ally info w:mark
silenceBell/bell-awakened f3 prog 0.45s box40x52 a20,50 head none ally info w:mark
inkPots/shatter f3 prog 0.3s box76x64 a38,40 target none ally info w:mark
inkPots/splat f1 idx 1.2s box64x30 a32,15 target none ground deco w:decal
clusterPots/burst f3 prog 0.24s box56x48 a28,30 target none ally info w:mark
tarJar/crack f3 prog 0.32s box80x56 a40,34 target none ally info w:mark
tarJar/pool f1 idx 1.5s box104x44 a52,22 target none ground deco w:decal
meteorBrush/impact f3 prog 0.36s box88x68 a44,46 target none ally info flash w:mark
meteorBrush/impact-awakened f3 prog 0.36s box88x68 a44,46 target none ally info flash w:mark
meteorBrush/crater f1 idx 1.5s box120x52 a60,26 target none ground info w:decal
sparkThread/spark f2 prog box24x24 a12,12 point none ally deco w:chain
sparkThread/spark-awakened f2 prog box24x24 a12,12 point none ally deco w:chain
stormThread/gust-a f2 prog box24x20 a12,10 point none ally deco w:chain
stormThread/gust-b f2 prog box32x26 a16,13 point none ally deco w:chain
frostChainlet/rime12 f1 idx box36x18 a18,9 feet none feet info r12 w:class
frostChainlet/rime19 f1 idx box48x22 a24,11 feet none feet info r19 w:class
frostChainlet/rime28 f1 idx box64x28 a32,14 feet none feet info r28 w:class
inkLance/tassel f2 prog box60x22 a56,11 origin beam ally info w:beam
inkLance/tassel-awakened f2 prog box60x22 a56,11 origin beam ally info w:beam
wideBrush/brush f3 prog box56x48 a14,24 tip beam ally info w:beam
wideBrush/brush-awakened f3 prog box56x48 a14,24 tip beam ally info w:beam
crossStrokes/scrap-a f2 prog box20x16 a10,8 tip beam ally deco w:beam
crossStrokes/scrap-b f2 prog box20x16 a10,8 tip beam ally deco w:beam
judgmentLine/inkbox f2 prog box64x30 a60,15 origin beam ally info w:beam
judgmentLine/inkbox-awakened f2 prog box64x30 a60,15 origin beam ally info w:beam
judgmentLine/flick-a f2 prog 0.24s box22x18 a11,9 line beam ally deco w:beam
judgmentLine/flick-b f2 prog 0.24s box22x18 a11,9 line beam ally deco w:beam
inkOrbit/chip-a f2 prog 0.24s box16x12 a4,6 ring radial ally deco w:mark
inkOrbit/chip-b f2 prog 0.24s box16x12 a4,6 ring radial ally deco w:mark
wardRing/knot-a f1 idx box22x18 a11,9 ring radial ally info w:variant
wardRing/knot-b f1 idx box22x18 a11,9 ring radial ally info w:variant
eclipseHalo/ribbon-a f3 loop@12 still0 box36x18 a32,9 ring tangent ally info w:mark
eclipseHalo/ribbon-b f3 loop@12 still0 box36x18 a32,9 ring tangent ally info w:mark
```

**C6** `k10-c6-scan`
```
calls=181 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```

**C7** `k10-c7-geometry-final2`
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```

**C8** `k10-c8-unchanged`
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 n4n4y2/2117692 -> n4n4y2/2117692 same | k11 xkyc9r/881478 -> xkyc9r/881478 same | fixed set same
PN keys same: C,_hk,_ki,arsenal,arsenalFx,bombers,bossesA,bossesB,bossesC,characters,defs,enemies,env,fieldBosses,halftone,hazards,heroKit,icons,rng,skillVfx,speedLines,splat,story,taper,tapers,vfx
arsenalFx calls: 181
```

**C9** `k10-c9-vectors`
- 검수서 C9 식에 사례 셋을 더했습니다: `["inkPots","land",{radius:92,seed:9}]`, `["clusterPots","land",{radius:64,seed:9}]`, `["fallingScroll","impact",{radius:110,seed:4}]`.
- 원문 75줄입니다. 읽기 쉽도록 같은 식을 큰 글씨로 다시 낸 `-p1/-p2/-p3`에서 옮겼습니다.
```
1 inkPulse/burst layout [["splash-a",130.59,-83.49,-0.57,0,0,0.76,0],["splash-b",66.82,139.86,1.13,0,0,0.52,0],["splash-a",-101.48,-117.16,4,0,0,0.99,0]]
2 inkPulse/burst path knots [[0,11.89],[40,6.54],[80,11.19],[120,8.8],[160,13.45],[200,8.1],[240,15.71],[280,10.36],[320,7.97]]
3 inkPulse/burst path gaps [[13.8,20.04],[190.67,194.77],[281.06,287.02]]
4 inkPulse/burst path core [[65.16,182.84]]
5 frostRing/burst layout [["shard-a",83.04,-150.63,2.07,0,0,0.76,0],["shard-c",168.74,-33.33,2.95,0,0,0.52,0],["shard-b",63.43,159.88,4.33,0,0,0.99,0],["shard-c",-87.29,161.98,2.07,0,0,0.45,2],["shard-b",-163.72,-52.72,6.59,0,0,0.21,2]]
6 frostRing/burst path knots [[0,15.77],[40,14.16],[80,15.56],[120,14.84],[160,16.24],[200,14.63],[240,16.91],[280,15.31],[320,14.59]]
7 frostRing/burst path core [[65.16,425.16]]
8 frostRing/burst path fringe [[0,-170.23],[6.95,-170.13],[13.88,-169.74],[20.8,-169.06],[27.68,-168.08],[34.51,-166.82],[40.54,-162.29],[48,-163.47],[53.28,-157.41],[61.18,-159.05],[65.51,-151.55],[73.96,-153.58]]
9 thunderclap/burst layout [["clap",0,-66,0,0,0,0,0]]
10 thunderclap/burst path jag [[133.4,4.26],[140.26,24.27],[128.31,55.16],[109.2,70.56],[97.25,101.81],[75.02,110.89],[62.41,127.46],[29.06,129.53],[7.5,141.38],[-25.36,138.07],[-45.96,126.19],[-66.44,124.94]]
11   [[-88.15,99.81],[-109.79,88.73],[-119.17,56.84],[-123.7,39.02],[-138.29,19.2],[-132.96,-12.9],[-135.86,-36.78],[-116.3,-63.39],[-113.92,-84.56],[-82.41,-104.14],[-67.74,-115.61],[-40.84,-134.26]]
12   [[-16.92,-131.78],[1.67,-141.45],[36.13,-128.22],[55.36,-125.96],[84.54,-111.49],[94.56,-88.86],[115.21,-81.37],[125.43,-46.08],[138.97,-30]]
13 thunderclap/burst path forks [[84.54,-111.49],[90.26,-117.37],[92.06,-123.83],[-66.44,124.94],[-68.34,131.29],[-72.2,135.1],[36.13,-128.22],[39.51,-137.31],[38.36,-145.16]]
14 silenceBell/burst layout [["bell",0,-66,0,0,0,0,0]]
15 silenceBell/burst path rings [[216.47,1],[146.15,0.7],[72.62,0.45]]
16 brushDownpour/impact layout [["mark-s",0,0,0,0,0,0,0],["stroke-a",0,0,0,0,0,0,0]]
17 brushDownpour/impact path knots [[0,4.74],[27.69,3.67],[55.38,5.76],[83.08,3.35],[110.77,2.28],[138.46,4.37],[166.15,1.96],[193.85,5.39],[221.54,2.98],[249.23,1.91],[276.92,4],[304.62,1.59]]
18   [[332.31,5.01]]
19 brushDownpour/impact path gaps [[16.68,41.85],[42.26,64.09],[121.35,135.69],[157.23,178.08],[234.25,251.75],[270.13,294.14],[347.15,367.81]]
20 brushDownpour/impact path core [[76.98,108.46]]
21 meteorBrush/land layout [["crater",0,0,0,0,0,0,0],["impact",0,0,0,0,0,0,0]]
22 meteorBrush/land path gaps [[97.54,107.3],[181.72,190.52]]
23 meteorBrush/land path splash [[-38.04,70.79],[-16.93,66.66],[-84.87,60.4],[-87.64,-27.77],[-85.19,-78.34],[21.24,-85.76],[91.47,-88.55],[56.73,-91.04],[99.86,3.4],[101.03,71.42],[3.35,111.44]]
24 meteorBrush/land path drops [[-33.86,87.05],[-92.01,65.49],[-94.17,-29.84],[22.75,-91.87],[107.96,3.67],[106.09,74.99]]
25 inkPots/fire layout []
26 tarJar/gather layout []
27 smokeTail/smoke layout []
28 meteorBrush/mark layout []
29 twinBlades/spin layout []
30 eclipseHalo/sweep layout [["ribbon-b",-222.41,58.6,4.45,0,0,0.63,0]]
31 eclipseHalo/sweep path crescent [[-222.41,58.6],[-229.21,19.09],[-229.04,-21.01],[-221.91,-60.46],[-208.04,-98.07],[-187.85,-132.71],[-161.95,-163.31],[-131.13,-188.96],[-96.33,-208.86],[-58.6,-222.41],[-80.86,-175.31],[-91.55,-131.92]]
32   [[-96.09,-96.9],[-100.98,-71.34],[-111.84,-52.72],[-131.67,-35.87],[-159.91,-14.67],[-192.4,16.02]]
33 eclipseHalo/total layout []
34 inkOrbit/sweep layout [["chip-a",133.86,6.12,0.05,0,0,0.79,0],["chip-b",56.98,121.28,1.13,0,0,0.56,0],["chip-b",-76.75,-109.84,4.1,0,0,0.02,0]]
35 inkOrbit/sweep path comet [[-42.69,-74.66],[-57.28,-64.15],[-69.36,-50.84],[-78.42,-35.31],[-84.05,-18.23],[-86,-0.36],[-84.19,17.53],[-78.71,34.65],[-69.79,50.26]]
36 inkOrbit/sweep path gaps [[24.79,37.85],[343.38,353.22]]
37 wardRing/sweep layout [["knot-a",72.55,68.82,0.76,0,0,0.79,0],["knot-b",-83.34,55.27,2.56,0,0,0.56,0]]
38 wardRing/sweep path twist [[84.56,43.3],[89.12,55.52],[77.42,55.06],[80.16,67.81],[70.72,63.43],[72.02,76.41],[64.14,70.08],[64.15,83.12],[54.79,77.61],[53.16,90.55],[47.24,82.42],[44.39,95.15]]
39 wardRing/sweep path stitch [[270,390]]
40 sparkThread/jump layout [["spark",220,-70,0,0,0,0,0],["spark",420,20,0,0,0,0,0],["spark",640,-40,0,0,0,0,0],["spark",860,30,0,0,0,0,0]]
41 sparkThread/jump path controls [[121.2,0.2],[334.4,-57],[539.6,25.2],[761.2,-40.2]]
42 sparkThread/jump path start [[25.99,-0.79]]
43 stormThread/jump layout [["gust-b",220,-70,0,0,0,0,0],["gust-a",420,20,0,0,1,0,0],["gust-a",640,-40,0,0,0,0,0],["gust-a",860,30,0,0,0,0,0]]
44 stormThread/jump path strandA [[0,0],[5.88,-1.57],[11.75,-3.15],[17.24,-5.94],[22.81,-8.47],[28.54,-10.48],[33.72,-14.24],[41.13,-11],[46.92,-12.84],[53.05,-13.63],[57.07,-21.01],[62.93,-22.62]]
45 stormThread/jump path strandB [[0,0],[5.7,-2.12],[11.41,-4.22],[17.38,-5.49],[23.51,-6.27],[29.35,-7.94],[34.69,-11.2],[39.92,-14.79],[45.71,-16.63],[52.2,-16.27],[58.72,-15.83],[64.44,-17.9]]
46 frostChainlet/jump layout [["rime19",220,-70,0,0,0,0,0],["rime19",420,20,0,0,0,0,0],["rime19",640,-40,0,0,0,0,0],["rime19",860,30,0,0,0,0,0]]
47 frostChainlet/jump path links [[35.67,-11.35],[49.01,-15.59],[62.35,-19.84],[75.69,-24.08],[89.04,-28.33],[102.38,-32.57],[115.72,-36.82],[129.06,-41.06],[142.4,-45.31],[155.74,-49.55],[169.08,-53.8],[182.42,-58.04]]
48 inkLance/stroke layout [["tassel",0,0,0,0,0,0,0]]
49 inkLance/stroke path tip [[640,0]]
50 inkLance/stroke path head [[610,-1.6],[615.4,-5.52],[620.5,-6.5],[628.6,-4.03],[635.8,-1.43],[640,0],[635.8,1.43],[628.6,4.03],[620.5,6.5],[615.4,5.53],[610,1.6]]
51 wideBrush/stroke layout [["brush",410,0,0,0,0,0,0]]
52 wideBrush/stroke path top [[26,-34.52],[35.85,-32.55],[45.69,-36.38],[55.54,-35.9],[65.38,-33.17],[75.23,-35.76],[85.08,-32.71],[94.92,-36.22],[104.77,-32.26],[114.62,-34.67],[124.46,-32.4],[134.31,-32.88]]
53 wideBrush/stroke path bottom [[26,36.02],[35.85,33.05],[45.69,35.88],[55.54,32.6],[65.38,36.33],[75.23,35.85],[85.08,33.22],[94.92,35.71],[104.77,32.77],[114.62,36.16],[124.46,32.31],[134.31,34.62]]
54 wideBrush/stroke path streaks [[193.7,-7.57],[342.5,-7.57],[95.17,14.57],[333.25,14.57],[259.47,3.19],[394.83,3.19],[97.77,-22.28],[379.24,-22.28]]
55 crossStrokes/stroke layout [["scrap-a",496,0,0,0,0,0,0]]
56 crossStrokes/stroke path top [[26,-2.63],[33.97,-0.99],[41.93,-6.11],[49.9,-6.08],[57.86,-3.49],[65.83,-7.06],[73.8,-4.08],[81.76,-8.78],[89.73,-4.66],[97.69,-8],[105.66,-5.99],[113.63,-7.16]]
57 crossStrokes/stroke path bottom [[26,4.5],[33.97,1.62],[41.93,5.48],[49.9,2.2],[57.86,7.19],[65.83,7.17],[73.8,4.71],[81.76,8.15],[89.73,5.29],[97.69,9.87],[105.66,5.88],[113.63,9.08]]
58 judgmentLine/stroke layout [["inkbox",0,0,0,0,0,0,0],["flick-b",208.18,7.37,0,0,0,0,2],["flick-a",408.19,2.2,0,0,0,0,2],["flick-b",566.74,-9.35,0,0,1,0,2],["flick-a",865.39,7.08,0,0,0,0,2]]
59 judgmentLine/stroke path after [[493,3.3],[493,-2.31]]
60 fallingScroll/unroll layout []
61 inkPots/land layout [["splat",0,0,0,0,0,0,0],["shatter",0,0,0,0,0,0,0]]
62 inkPots/land path gaps [[9.61,17.39],[273.78,280.62]]
63 inkPots/land path splash [[39.13,-35.45],[65.63,-0.66],[51.71,28.48],[-7.23,43.68],[-48.43,30.26],[-33.91,35.12],[-43.04,-26.43],[-18.36,-60.62]]
64 inkPots/land path drops [[73.89,-0.74],[-7.95,48.01],[-49.59,40.17],[-47.74,-29.32]]
65 clusterPots/land layout [["burst",0,0,0,0,0,0,0]]
66 clusterPots/land path gaps [[21.66,32.34]]
67 clusterPots/land path splash [[26.87,-13.23],[31.2,19.51],[9.61,31.86],[-25.16,3.54],[-20.63,-24.79]]
68 clusterPots/land path drops [[35.91,22.46],[-28.36,3.99],[-23.59,-28.34]]
69 fallingScroll/impact layout [["scroll",0,0,0,0,0,0,0]]
70 fallingScroll/impact path core [[60,120]]
71 fallingScroll/impact path tilt [[0,0],[1,-6],[2,-12],[3,-12]]
72 inkPots lob [[0,0,0,0,-1.08,9,0.18],[0.25,80,-30,89.71,-0.84,10.5,0.22],[0.5,160,-60,119.62,-0.36,12,0.25],[0.75,240,-90,89.71,0.36,13.5,0.29],[1,320,-120,0,0.84,15,0.32]]
73 clusterPots lob [[0,0,0,0,-1.08,7,0.18],[0.25,80,-30,89.71,-0.84,8.25,0.22],[0.5,160,-60,119.62,-0.36,9.5,0.25],[0.75,240,-90,89.71,0.36,10.75,0.29],[1,320,-120,0,0.84,12,0.32]]
74 tarJar lob [[0,0,0,0,-1.06,10,0.18],[0.25,80,-30,84.59,-0.82,11.5,0.22],[0.5,160,-60,112.78,-0.36,13,0.25],[0.75,240,-90,84.59,0.32,14.5,0.29],[1,320,-120,0,0.8,16,0.32]]
75 meteorBrush lob [[0,0,0,0,-1.19,12,0.14],[0.25,80,-30,128.16,-0.96,14.5,0.19],[0.5,160,-60,170.88,-0.36,17,0.24],[0.75,240,-90,128.16,0.61,19.5,0.29],[1,320,-120,0,1.05,22,0.34]]
```
1차와 달라진 줄:
- 5~8: 서리 띠 폭과 술 높이(R1).
- 21~24: 유성 붓 streak 삭제(M2), splash·drops 추가(M1).
- 59: 심판선 bow 9(R3).
- 61~71: 새 사례.

**C10** `k10-c10-contrast`
```
fills=14 fail=0 (persistent over 0.3 s: Y max 0.62; brief: Y max 0.69; hero coat Y 0.902, contrast min 1.25)
brushDownpour.band (ink a1, 0.3s): ch1 0.006 ch2 0.006 ch3 0.006 ch4 0.006 ch5 0.006 | coat 16.93:1 ok
seventhSeal.wash (p50 a0.18, 0.36s): ch1 0.501 ch2 0.501 ch3 0.525 ch4 0.511 ch5 0.471 | coat 1.66:1 ok
seventhSeal.print (p50 a0.25, 1.2s): ch1 0.535 ch2 0.536 ch3 0.558 ch4 0.545 ch5 0.507 | coat 1.56:1 ok
inkPulse.band (ink a1, 0.3s): ch1 0.006 ch2 0.006 ch3 0.006 ch4 0.006 ch5 0.006 | coat 16.93:1 ok
frostRing.band (p50 a0.5, 0.29s): ch1 0.670 ch2 0.671 ch3 0.688 ch4 0.678 ch5 0.649 | coat 1.29:1 ok
frostRing.band.tail (p50 a0.25, 0.45s): ch1 0.535 ch2 0.536 ch3 0.558 ch4 0.545 ch5 0.507 | coat 1.56:1 ok
inkLance.capsule (p50 a0.16, 0.28s): ch1 0.491 ch2 0.492 ch3 0.516 ch4 0.502 ch5 0.461 | coat 1.68:1 ok
wideBrush.band (p50 a0.45, 0.28s): ch1 0.642 ch2 0.643 ch3 0.661 ch4 0.650 ch5 0.619 | coat 1.34:1 ok
crossStrokes.band (p50 a0.5, 0.28s): ch1 0.670 ch2 0.671 ch3 0.688 ch4 0.678 ch5 0.649 | coat 1.29:1 ok
judgmentLine.capsule (p50 a0.12, 0.28s): ch1 0.472 ch2 0.473 ch3 0.497 ch4 0.483 ch5 0.441 | coat 1.74:1 ok
inkOrbit.wash (ink a0.14, 0.3s): ch1 0.311 ch2 0.311 ch3 0.330 ch4 0.320 ch5 0.288 | coat 2.50:1 ok
wardRing.wash (p50 a0.12, 0.3s): ch1 0.472 ch2 0.473 ch3 0.497 ch4 0.483 ch5 0.441 | coat 1.74:1 ok
eclipseHalo.wash (ink a0.1, 0.3s): ch1 0.340 ch2 0.340 ch3 0.361 ch4 0.349 ch5 0.314 | coat 2.32:1 ok
eclipseHalo.crescent (ink a0.35, 0.3s): ch1 0.184 ch2 0.184 ch3 0.195 ch4 0.189 ch5 0.171 | coat 3.89:1 ok
```

**C15**
- `k10-c15-pairs`(--check ok)와 `k10-c15-focus`(2배, K9 기준 아이콘 옆에 K10 조각)를 봤습니다.
- 대조한 K9 해시(평상/각성)는 meteorBrush `f0ap7s`/`1eekf35`, tarJar `1mq1jnw`/`chm7dz`, seventhSeal `11totq1`/`1s8ck17`입니다. 아이콘+타일+슬롯 식으로 직접 계산해 지시받은 값과 같습니다.

**검수서 §8 명령 — 모두 `--check` ok**

| 대상 | 렌더 |
|---|---|
| 1배 타격감 | `k10-impact-ages-lob`·`-strike`(1배 색), `-lob-gray-x08`(0.8배 흑백) |
| M2 | `k10-meteor-vs-imminent-gray` |
| M3a | `k10-tar-vs-bomber`(3배), `-final`(3배 최종), `-x1`, `-x1-gray` |
| M3c | `k10-seal-prints`(2배), `-x1` |

**더 잰 것**
- splash 먹 면적: `k10r-splash-area`. Lv1~5 × 평상/각성 × seed 1~300, 무기마다 3,000건입니다.
  - 최대: inkPots 8.57%, clusterPots 4.43%, meteorBrush 9.79%.
  - 평균: 5.84%, 2.73%, 7.24%. 모두 원판의 10% 이하입니다(겹침을 두 번 센 상한값).
- LOD·감소 모션: `k10r-lod-reduced-tilt`.
- 족자 기울기 좌우: `k10r-scroll-tilt`.

**직접 본 렌더**
- **전**(검수자 렌더): `k10r1-pots-f0-x6`, `k10r1-meteor-impact-x6`, `k10r1-zoom-c15risk`, `k10r1-tar-vs-bomber-game`, `k10r1-seal-prints-decal`·`-layout`, `k10r1-frost-band-x1`, `k10r1-small-objects-x6`, `k10r1-meteor-vs-imminent-gray2`, `k10r1-impact-ages-lob`
- **전**(내가 수정 전에 낸 렌더): `k10-c15-pairs-before`, `k10r-rime-before-x6`, `k10-k9-ref-detail`(K9 기준 6배)
- **후**: `k10-after-pots-f0-x6`, `k10-after-meteor-impact-x6`, `k10-tar-vs-bomber-final`, `k10-seal-prints`, `k10-after-frost-band-x1`, `k10r-final-objects-x4`(유성 붓·손뼉·인영), `k10r-small-x4`(서리 결정), `k10r-rime-after-x6`, `k10-c15-focus`

### 4. 지시서 대비

**M1 착탄 순간**

| 항목 | 반영 |
|---|---|
| 먹단지 0번 장 | 1번 장의 먹 튐(r 10·팔 8·reach 1.8~3.1, 같은 seed 105)을 당겨 왔습니다. 섬광 r 23은 골을 먹 튐 안에 숨겨 갈래만 보이게 했습니다. 처음 그린 안은 흰 깃이 '검은 태양'으로 읽혀 고쳤습니다. 흰 백자 조각 다섯은 휜 벽 조각에 안쪽 p300 띠이고, 중심에서 8~12에 크기와 돌림을 제각각 두었습니다. 처음 안은 고리처럼 읽혀 배치를 바꿨습니다. 꼭지 없는 뚜껑은 왼쪽 위로, 끊긴 끈은 오른쪽 위로 날리고, 단지 몸은 없습니다. 1·2번 장은 1차 그대로입니다 |
| 송이 단지 0번 장 | 먹 튐 r 6.5·팔 6·reach 2~3, 가로 38.3입니다. 흰 조각 둘과 끈 조각을 두었고 흰 원판은 없습니다. 1번 장도 같은 먹 튐으로 바꿨습니다(§12-31) |
| punch·splash | 처방 값과 식 그대로입니다. 족자 파문 굵기도 처방대로이고, 판정 원 뒤 절반이 1배에서 보입니다(`-strike`) |

**합격 기준 실측**(검수 렌더 seed 5·12·19, `k10r-m1-metrics`)

| 무기 | 측정 | 기준 | 0초 | 0.02초 | 0.04초 | 0.08초 |
|---|---|---|---|---|---|---|
| 먹단지 | 고리 먹 | ≥ 6 | 6.60 | **5.30** | 4.30 | 3.14 |
| 먹단지 | 0.5R 이상 가시 수 | ≥ 5 | 0 | **2** | 6 | 7 |
| 송이 단지 | 고리 먹 | ≥ 4.5 | 4.68 | **3.93** | 3.35 | — |
| 송이 단지 | 0.45R 이상 가시가 있는 사건 | 4/4 | — | 4/4 ✓ | — | — |
| 유성 붓 | 고리 먹 | ≥ 6 | 11 | 8.84 ✓ | — | — |
| 유성 붓 | 0.6R 이상 가시 수 | ≥ 6 | 0 | **0** | 3 | 5 |
| 유성 붓 | 갈래 수 | ≥ 2 | — | 4 ✓ | — | — |

- 다른 고리의 0.02초 먹: 번개·족자 5.58, 타르 5.25, 인장 3.43.
- 흰 공은 없고, 흑백에서 핵심 골분 박격과 갈립니다. 0.1초 뒤에는 기본 굵기로 돌아옵니다.
- **원인**: 처방 식에서 0.02초의 punch 배율이 1 + (s−1)·0.64이고, splash 길이가 grow 0.3/0.06초로 70%만 자랍니다. 그래서 0.02초 기준과 처방 값이 서로 맞지 않습니다.
- **기준을 맞추는 가장 작은 변경**(검수자 결정 대기)
  - (a) punch에 hold 0.03초를 두어, 그동안 m = scale로 둡니다.
  - (b) splash grow seconds를 0.02로 줄입니다.
  - (c) 유성 붓 `to` 아래 끝을 0.6으로 올립니다. 그래야 0.6R이 늘 6방향 이상입니다.

**M2**: streak 조각, ART, layout을 지웠습니다. `k10-meteor-vs-imminent-gray`에서 유성 붓 고리 둘레에 눈금이나 쐐기가 없습니다. 지시서 C2 기대값 137 / 341,032와 같습니다.

**M3(C15, K9 검수 7차 §7 기준)**
- **(a) 타르 항아리**
  - 120° 눕혀 축이 30° 아래를 향하고, 길이 : 폭은 1.3입니다.
  - 입은 p50 2 테이고 타르가 입술 위로 쏟아집니다. 반대쪽에 굽(띠 + p300 선)이 보입니다.
  - 어깨에 ink500 빛면과 종이 반사를 두고, 금은 입 가까이 ink500 ≤ 1로만 넣었습니다.
  - 청록 끈은 목을 감고 끝이 땅으로 처집니다. 휜 조각 둘이 있습니다.
  - 1·2번 장은 어깨 조각이 금 가고 떨어지는 그림이고, 실루엣은 지켰습니다(§12-32).
  - 3배와 1배 흑백에서 폭탄병 둘과 갈립니다.
  - 80×56, 앵커 (40,34), 3장, 0.32초, `pool`은 그대로입니다.
- **(b) 유성 붓**
  - 붓털을 세 덩이로 짓눌렀습니다. 갈라진 끝이고 결 줄을 넣었으며, 먹 튐 밖으로 9 이상 나옵니다.
  - 종이 쇠테 띠 셋, 종이 대나무 자루(마디 둘), 둥근 먹 마개 + 종이 걸이 고리를 두었습니다. 걸이 고리는 K9 기준을 따랐습니다(§12-33).
  - 자루는 1차보다 약 10 짧습니다.
  - 0번 장 꼬리
    - 마개에서 4.4로 시작해 먼 끝에서 12.4까지 넓어집니다.
    - 마른 갈래 넷은 끝 폭 2.2에 홈이 파인 두 가닥입니다(K9 R7).
    - 끊긴 방울 셋을 두었습니다.
    - 청록 심은 붓 쪽에서 시작해 끝 앞에서 멈춥니다.
  - 1번 장에는 꼬리가 없습니다.
  - 섬광은 진행 방향으로 치우친 찢긴 종이 터짐이고, 갈래 비가 2.7입니다.
  - 88×68, 앵커 (44,46), 3장, 0.36초, flash, 2번 장, `crater`는 그대로입니다.
- **(c) 인영 a/b/c**
  - 테는 75~78%만 찍힌 붓 호이고, 틈 자리가 서로 다릅니다.
  - 매듭 획은 가운데를 비키고 인영 폭의 65~79%입니다: 열린 고리, ㄱ 말림, S 굽음.
  - c는 반달 인영입니다(테 0.8 → 2.4 → 0.8, 종이는 반쪽에만, α 0.25).
  - J(955) 반전으로 꼴이 여섯입니다. 가운데 점과 가운데를 지나는 획은 없습니다.
  - 2배·1배에서 같은 글자의 반복이나 눈으로 읽히지 않습니다.

**M4**: 족자 모든 장을 똑바로 굽고 `SPEC.tilt`, `putItems`, `paths.tilt`를 넣었습니다. 1배에서 6°·12°가 보이고, 사건마다 좌우가 섞입니다. C7은 0건입니다.

**R1**
- 띠 폭 14~17, 술 2~7로 키웠고 α·fade는 그대로입니다.
- 결정은 각진 밑동 + 곧은 각기둥(면 반 p300, 0.8 틈)이고, 길이는 평상 14~26.5, 각성 19~34.5입니다.

**R2**: 뒤 손(p300)은 40°, 앞 손(p50)은 14°로 각이 다르고, 섬광은 r 10.5입니다.

**R3**: 줄 층에 punch {2, 0.06}을 넣고 bow를 9로 했습니다. 조각은 바꾸지 않았습니다.

**R4**: 금 하나는 판 왼쪽 가장자리에서 낮게, 하나는 오른쪽 위에 높게 두었습니다. 감은 눈 꼴이 없어졌습니다.

### 5. 메인 세션이 할 일
1. **지금 굽지 않습니다.** 검수 2차 합격 뒤에 굽습니다.
   - `afx/meteorBrush/streak-*` 키는 없어졌습니다.
   - 굽기 순서: `scripts/build-atlas.mjs:11`의 KIT_FILES에서 'k-icons2.js' 바로 뒤에 'k-arsenal-fx.js'를 넣습니다. `art/atlas-spec.mjs` PACKS에 'arsenal-fx'를 더합니다.
   - 굽기 전 확인할 값
     - C8 고정값
     - 새 보존 해시 `fxjb0m/158470`, `2rsj2w/1615076`, `v6ki5j/2682`
2. **렌더러(ArsenalFxPainter)에 새로 넣을 것**
   - punch: stroke·ripple 고리 모든 층과 심판선 줄 층에 넣습니다. 감소 모션에서는 1.5 이하입니다.
   - splash
     - 식: API §7.3a 그대로이고, jit 1700~1801을 씁니다.
     - 그리는 순서: 데칼과 고리 사이에 사건마다 한 경로로 그립니다.
     - LOD: reduced는 짝수 가시, minimal은 송이 0·나머지 3가시입니다.
     - 상한 12/8/3, 감소 모션에서 α 0.06초입니다.
   - 족자 tilt: deg[장] × J(954) 부호, 앵커를 축으로 돌립니다.
   - 인영 좌우 반전 J(955)
   - 매니페스트 vectors는 위 C9 75줄입니다.
3. **`test:visual`**: 검수서 §7-5 목록 그대로 봅니다(착탄 0.1초 안 프레임, 유성 붓과 imminent 흑백, 인영 데칼, 타르와 폭탄병, 족자 좌우, 감소 설정).

### 6. 알려진 한계
- 위 M1 0.02초 기준 충돌은 검수자 결정이 필요합니다.
- 인장 몸은 K9 기준(공 꼭지)과 다릅니다. 보호 대상이라 손대지 않았습니다(§12-39).
- splash jit 번호가 k ≥ 10에서 겹칩니다. 검수서 식 그대로라 결정적이고, 상관만 생깁니다(§12-30).
- T1~T3 블라인드와 C3·C4는 다시 돌리지 않았습니다(요청 목록 밖). 정식 판독 시험(n ≥ 8)은 하지 않았습니다.
- 사람 클린업으로 넘길 것: 유성 붓 마른 꼬리와 붓털, 항아리 입·굽·깨진 단면, 인영 찍힘 질감, 서리 결정 면, 사기 조각 단면, splash 가시 붓 질감(API §13).
- 이 세션 첫 보존 해시 명령 하나는 `cd … && node scripts/art-review-sheet.mjs …` 형태로 돌렸습니다. 실행한 프로그램은 그 스크립트뿐이고, 그 뒤로는 단일 명령만 썼습니다.
- lob 비행(납품 2)은 아직입니다. 검수서 §7-7의 꼴 규칙을 이어서 씁니다.

---

## K10 검수 2차: 1차 수정 납품(M1~M4·R1~R4, C15 맞춤), art-director, 2026-10-19

**판정: 수정 후 합격.**
- M1~M4와 R1~R4는 모두 받아들입니다. 1배와 0.8배(흑백 포함)에서 착탄이 이제 충분히 셉니다.
- 고칠 것은 둘이고, 둘 다 일곱째 인장 조각만 바꾸는 작은 수정입니다.
  - **F1** 인영 b의 획이 한글 'ㄱ'으로, a의 끝이 'J'로 읽힙니다.
  - **F2** 인장 꼭지를 K9 기준(목 + 공 꼭지)으로 바꿉니다.
- 메인 세션은 지금 굽고 렌더러를 연결해도 됩니다. F1·F2를 확인하는 검수 3차(짧게) 뒤에 `arsenal-fx` 팩만 다시 굽습니다. 그때 바뀌는 것은 seventhSeal 9장(`seal` 3, `seal-awakened` 3, `print-a/b/c`)뿐입니다.

**결정 두 건**
1. **M1 착탄 0.02초 기준: 기준을 고칩니다.** 값은 그대로 두고 (a)·(b)·(c)는 모두 쓰지 않습니다(§2).
2. **인장 몸: K9 기준에 맞춥니다**(F2, §3).

**그 밖의 질문**
- C15
  - 유성 붓과 타르 항아리는 K9 확정 꼴과 같은 물건으로 읽힙니다.
  - 인영은 구조(끊긴 호, 반달, 반전)는 맞지만 획이 글자로 읽혀서 F1입니다.
- API §12-28~39는 모두 받아들입니다. 39는 F2로 해결합니다.

### 1. 직접 돌린 검사
- 렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r2-*.png`
- kit error 0건, `--check`는 모두 ok입니다.

| 검사 | 결과 |
|---|---|
| C1 `k10r2-c1-all` | ok |
| C2 | `frames=137 ok boxArea=341032 ok badParts=0`, `1.0-d1r1`, groups 22, 유성 붓 조각은 impact·impact-awakened·crater |
| C6 | `calls=181 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0` |
| C7 | 1~4줄 0건, `invalid calls ok` |
| C8 | 고정값 4개 같음. 진행 중인 K9 `n4n4y2/2117692`, K11 `bvf9fj/934797`은 호출 전후 same. K11 값이 납품서와 다른 것은 K11 작업이 이어진 탓입니다 |
| C9 표본 | inkPots·clusterPots·meteorBrush land의 gaps·splash·drops가 납품서 원문과 숫자까지 같습니다 |
| C10 | `fills=14 fail=0`, 값 변화 없음 |
| 보존 해시 | `fxjb0m/158470`, `2rsj2w/1615076`, `v6ki5j/2682`로 납품서와 같습니다. 작가의 R4 전 렌더 `k10-keep-hash-preR4`를 직접 열어 보니 1차 값(`1oioxia`·`tlb0e8`·`v6ki5j`)과 같습니다. 그래서 R4만 바뀐 것입니다. **R4가 해시를 바꾼 것은 제 잘못입니다.** 보존 묶음에 frostChainlet을 넣어 둔 채 R4를 권했습니다. 새 값을 기준으로 받아들입니다 |
| T3 | 새 시드 271, 흑백 0.5배에서 답을 먼저 적은 뒤 정답표를 열어 **22/22**. 그림을 이미 본 판독입니다. lob 셋이 같은 먹 튐 문법을 쓰지만 크기·수·물건(흰 조각 / 작은 넷 / 큰 붓 + 분화구)으로 갈립니다 |
| 1배 타격감 | `k10r2-impact-ages-lob`(나이 0·0.02·0.05·0.1초), `-strike`(0·0.02·0.1·0.3초), `-lob-gray-x08`(0.8배 흑백), `k10r2-lod-check`(full·reduced·minimal·감소 모션·각성) |
| 대조·확대 | `k10r2-c15-focus`(K9 확정 아이콘 옆), `-meteor-x5`, `-zoom-revised`(3배), `-prints-x6`, `-seal-prints-x2`, `-tar-vs-bomber`, `-meteor-vs-imminent-gray`, `-frost-band-x1`, `-seal-knob-mock`, `-seal-x1` |
| splash 먹 면적 | 작가 렌더 `k10r-splash-area`를 열어 확인: 최대 8.57·4.43·9.79%로 모두 10% 이하. 재는 식 자체는 검증하지 않았습니다 |

### 2. 결정 1: M1 기준을 고치고 값은 그대로 둔다

**1배에서 실제로 충분한가: 충분합니다.**
- 0번째 프레임(나이 0)에 이미 세 가지가 함께 보입니다.
  - 가장 센 0번 장 조각
  - 가장 굵은 고리(먹단지 6.6, 유성 붓 11)
  - 길이 30%의 가시
- 3프레임(0.05초) 안에 가시가 0.5~0.8R까지 퍼집니다.
- 0.8배 흑백에서도 '검은 먹 튐'으로 읽히고, 핵심 골분 박격(흰 별 + 점)과 한눈에 갈립니다(`k10r2-impact-ages-lob`, `-gray-x08`).
- 메인 세션이 걱정한 '물건이 작고 고리가 가늘다'는 해소되었습니다.

**세 안을 쓰지 않는 이유**
- (b) grow를 0.02초로 줄이면 가시가 한 프레임에 다 자란 채로 튀어나옵니다. 3~4프레임 동안 퍼지는 것이 폭발로 읽히는 핵심입니다.
- (a) hold를 두면 굵은 고리가 가시가 자라는 동안 남습니다. 맞는 순간 굵었다가 가늘어지는 충격 앞선이 무뎌지고 얻는 것이 없습니다.
- (c) `to` 아래 끝을 0.6으로 올리면 길이 비가 1.64에서 1.37로 줄어 별꼴이 고르게 됩니다. 금지한 '고른 방사·햇살'에 가까워집니다. 다 자란 상태에서 이미 0.6R 이상인 방향이 평균 6.2입니다.
- 원래 0.02초 기준은 제가 '첫 프레임의 덩어리'와 '다 퍼진 먹 튐'을 한 시점에 섞어 정한 것이 잘못이었습니다.

**새 기준**(`k10-m1-grown`, 시드 1~60, 16° 안의 끝점은 한 방향으로 셈)
- 0번째 프레임(나이 0)
  - punch가 최대입니다(먹단지·유성 붓 ×2.2, 타르 ×2.0, 송이 ×1.8).
  - 0번 장이 가장 큰 덩어리입니다.
  - 가시 길이가 0.3 이상입니다.
- 나이 0.05초(60fps 셋째 프레임)

  | 무기 | 기준 | 지금 |
  |---|---|---|
  | 먹단지 | 0.5R 이상 방향: 평균 ≥ 5, 최소 ≥ 4 | 5.8, 4 |
  | 유성 붓 | 0.6R 이상 방향: 평균 ≥ 5, 최소 ≥ 4 | 5.3, 4 |
  | 송이 단지 | 사건마다 0.45R 이상 방향 ≥ 2 | 3.1, 최소 2 |

- 나이 0.1초에는 고리가 기본 굵기로 돌아옵니다.
- **지금 값으로 모두 통과합니다.** 다 자란 상태(0.07초)는 먹단지 6.0 [4~7], 유성 붓 6.2 [5~8]입니다.

```
node scripts/art-review-sheet.mjs expr --name k10-m1-grown --scale 1 --crop 0,0,1800,160 --expr '(function(){var X=PN.arsenalFx,S=X.SPEC,L=[];function eo(u){return 1-(1-u)*(1-u);}var C=[["inkPots",92,0.5],["clusterPots",64,0.45],["meteorBrush",160,0.6],["meteorBrush",160,0.5]];var AG=[0,0.017,0.02,0.033,0.04,0.05,0.07];C.forEach(function(c){var sp=S.splash[c[0]],life=S.life[c[0]].mark,R=c[1],rb=sp.from*R,line=c[0]+" R"+R+" dirs>="+c[2]+"R (grown):";AG.forEach(function(a){var tot=0,mn=99,mx=0,N=0;for(var s=1;s<=60;s++){var P=X.paths(c[0],"land",{radius:R,seed:s,p:0.5});var u=Math.min(1,a/sp.grow.seconds),fr=sp.grow.from+(1-sp.grow.from)*eo(u);var angs=[];(P.splash||[]).forEach(function(q){var rf=Math.hypot(q[0],q[1]),r=rb+(rf-rb)*fr;if(r>=c[2]*R-0.01)angs.push(Math.atan2(q[1],q[0])*180/Math.PI);});angs.sort(function(x,y){return x-y;});var k=0;for(var i=0;i<angs.length;i++){if(i===0||angs[i]-angs[i-1]>16)k++;}if(angs.length>1&&k>1&&(angs[0]+360-angs[angs.length-1])<=16)k--;tot+=k;mn=Math.min(mn,k);mx=Math.max(mx,k);N++;}line+="  t"+a+": "+(tot/N).toFixed(1)+" ["+mn+"-"+mx+"]";});L.push(line);});return "<rect width=\"1800\" height=\"160\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(22+i*24)+"\" font-size=\"12\" font-family=\"monospace\">"+t.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</text>";}).join("");})()'
```

- 이 명령은 `paths`의 다 자란 끝점에 API의 grow 식을 곱해 잽니다. 작가가 시드 5·12·19로 잰 값(0.04초 6)과 맞습니다.

### 3. 결정 2: 인장 몸을 K9 기준에 맞춘다(F2)
- **근거 1: C15.** K9 검수 7차 §7이 정한 K10 기준이 '낮고 넓은 원통 + 목 + 공 꼭지'입니다.
- **근거 2: 단지와 헷갈림.** 1배에서 지금 납작한 먹 갓은 '흰 통에 검은 뚜껑'입니다(`k10r2-seal-x1`). 2차 납품의 먹단지 비행 그림(흰 백자 + 먹 뚜껑)과 같은 그림 언어가 됩니다.
- **'머리' 판독 위험은 목으로 막힙니다.** 목업(`k10r2-seal-knob-mock`, 1배·2배, 적 셋과 함께)에서 목이 보이는 공 꼭지는 손잡이로 읽혔습니다. 작가가 1차에서 머리로 본 것은 목 없이 몸 위에 바로 얹은 공이었습니다.

### 4. C15 (K9 검수 7차 §7 기준, `k10r2-c15-focus`·`-meteor-x5`·`-tar-vs-bomber`)

| 물건 | 판정 | 근거 |
|---|---|---|
| 유성 붓 | 통과 | 종이 자루, 쇠테 띠, 먹 마개 + 종이 고리가 있습니다. 꼬리는 자루 폭에서 시작해 먼 끝이 가장 넓고(약 2.8배), 홈 파인 마른 갈래 넷과 방울 셋으로 흩어집니다. 청록은 붓 쪽에서 시작하고, 붓털은 세 덩이로 짓눌립니다. 섬광은 진행 방향으로 치우쳤습니다. 금지 다섯(로켓 코, 모이는 꼬리, 꼬리 끝 청록, 분사 섬광, 가시 끝)이 하나도 없습니다 |
| 타르 항아리 | 통과 | 쓰러진 검은 항아리에 종이 테 입, 굽, 목의 청록 끈, 흘러나온 타르, 땅의 휜 조각이 있습니다. 게임 배율 3배에서 폭탄병 둘과 갈립니다. 흰 균열·네모·심지는 없습니다 |
| 인장 · 인영 | **F1** | 끊긴 호(75~78%)·반달·반전 여섯 꼴은 기준대로입니다. 그런데 b의 획이 'ㄱ', a의 끝이 'J'로 읽힙니다 |
| 인장 · 도장 | **F2** | §3 |

- 인영이 '연한 바닥 위 먹 테'인 것은 바닥 때문입니다(아이콘은 '먹 땅 위 종이'). 받아들입니다.

### 5. 고칠 것 (kit-artist, `k-arsenal-fx.js`·`API-arsenal-fx.md`만)

**F1. 인영 매듭 획이 글자로 읽힌다**
- **본 렌더**: `k10r2-prints-x6`(반전 포함), `k10r2-seal-prints-x2`
  - 섞은 일곱 개 중 넷이 b였고, 넷 모두 'ㄱ'/'⊐'로 읽혔습니다.
- **문제**
  - 지시서 §2.2 '인영 안 글자', §1.7 '한글·숫자로 읽히는 모양'에 걸립니다.
  - 도장 자국 안의 ㄱ은 '찍힌 글자'로 읽힙니다.
  - 제가 1차에 쓴 'ㄱ자로 말린 획'이라는 표현이 오해를 불렀습니다. 그 표현을 거둡니다.
- **원인**: `PRINTS` `k-arsenal-fx.js:852-853`
  - b `knot`은 곧은 윗변 → 모서리 (0.68,−0.44) → 곧은 다리입니다.
  - a는 끝이 안쪽 (0.3,0.08)→(0.5,−0.2)으로 말려 들어갑니다.
  - 획은 굵기가 고른 펜 선입니다(`:869` `q.w`).
- **처방**
  1. 매듭 획은 곡률이 끊기지 않는 한 획으로 그립니다.
     - 가장 곧은 구간은 인영 폭의 35% 이하입니다.
     - 모서리(꺾인 각 < 120°)는 없습니다.
  2. 획 끝은 붓처럼 마릅니다. 테 호와 같은 `brushD`로 끝 0.3~0.5, 가운데 `w`로 그립니다.
  3. 획이 작은 닫힌 고리(e·ℓ·@)나 안으로 말린 끝(J)으로 끝나지 않습니다. a는 끝이 테 쪽으로 풀려 나가게 합니다.
  4. b는 테에서 나와 크게 한 번 휘고, 끝이 바깥으로 튕기는 '풀린 끈'입니다. c(반달 + 물결)는 그대로입니다.
- **바꾸면 안 되는 것**: 박스 48×24, 앵커, rx 17·13.5·10.5, 종이 α0.25, 테 호 자리와 붓 폭, 반달 c, 점, J(955) 반전, 데칼 1.2초
- **합격 기준**: 6배(반전 포함)와 2배·1배 흩음에서 ㄱ·7·J·e·@ 같은 글자나 숫자로 읽히지 않고 '풀린 매듭이 찍힌 자국'으로 읽힙니다.

**F2. 인장 꼭지: 목 + 공 꼭지(K9 기준)**
- **원인**: `sealArt` `:829-831`(목 'M-2.8,-19.2 … -22.6' + 납작한 갓 `ellD(0,-25.4,5.6,3.6)`), 실루엣 `:822`, 각성 반짝임 `:838`
- **처방**
  - 목: `M-2,-19.2 L2,-19.2 L1.5,-25.2 L-1.5,-25.2 Z`(높이 6, 먹)
  - 공: 중심 (0,−28.4), r 4.0, 먹. ink500 빛면은 (−1.2,−29.6) r 1.5, 종이 점은 (−1.7,−30.2) r 0.6입니다.
  - 공 지름(8)은 몸 폭(22)의 0.4 이하입니다. 목은 5 이상 보이게 해서 공이 몸에 붙어 보이지 않게 합니다.
  - 실루엣의 갓을 공 + 목으로 바꿉니다.
  - 각성 반짝임은 공의 오른쪽 위 가장자리로 옮깁니다(예: (5.2,−32.6) r 2.6).
  - 마지막 장(ink300)과 들림(10·14)은 그대로입니다.
- **확인한 계산**
  - 2번 장(들림 14, 테 없음)의 꼭대기는 박스 y 3.6입니다.
  - 각성 1번 장(테 3 + 들림 10)은 4.6입니다.
  - 둘 다 C7(박스 − 3) 안입니다.
- **바꾸면 안 되는 것**: 몸(22×16 원통, p300 그늘, 윗면 타원), 청록 인면 테, 장 진행(눌림·들림·사라짐), 박스 40×56, 앵커 (20,50)
- **합격 기준**
  - 1배(`k10-seal-x1`, 적 셋과 함께)에서 '손잡이 달린 도장'으로 읽히고, '뚜껑 덮은 통'이나 '머리 달린 작은 사람'으로 읽히지 않습니다.
  - 3배에서 K9 아이콘의 꼭지와 같은 꼴입니다.
  - C7 0건

### 6. 다르게 한 것 28~39

| # | 판정 | 근거 |
|---|---|---|
| 28 punch·splash 값과 기준의 충돌 | 수용, 기준 정정 | §2 |
| 29 splash 갈래 ±7°를 사건 중심 극좌표로 | 수용 | 가시 축 기준이면 B 갈래가 0.12L로 1배에서 안 보입니다. TypeScript 이식은 API §7.3a 식 그대로 따릅니다 |
| 30 jit 번호 겹침(k ≥ 10) | 수용 | 결정적이고 상관만 생깁니다. 제 번호대 간격(10)이 n ≤ 12를 못 담은 탓입니다. 이식에서도 같은 번호를 그대로 씁니다 |
| 31 송이 단지 1번 장 먹 튐을 0번 장과 같게 | 수용 | 0 → 1 사이 깜빡임을 막습니다 |
| 32 타르 항아리 1·2번 장은 어깨 조각만 깨짐 | 수용 | K9 기준 '쓰러진 항아리 하나'를 지킵니다. 반쪽 둘은 관 토막·심지로 읽혔다는 판단이 맞습니다 |
| 33 유성 붓 종이 걸이 고리, K9식 꼬리 | 수용 | K9 확정 꼴이 제 1차 처방(먹 1.2 고리, 자루를 감싸는 꼬리)보다 앞섭니다 |
| 34 인영 테 붓 폭, 반달 c | 수용 | K9 §7 그대로입니다 |
| 35 방울을 먼 끝 기준으로 뺌 | 수용 | |
| 36 방울은 full에서만 | 수용 | |
| 37 punch는 각성 가는 선·wash에 곱하지 않음 | 수용 | 유성 붓 안쪽 가장자리가 가는 선에 닿는 것은 0.1초입니다 |
| 38 `1.0-d1r1` | 수용 | |
| 39 인장 몸이 K9와 다름 | F2로 해결 | §3 |

### 7. M2~M4·R1~R4 확인
- **M2**: 유성 붓 고리 둘레에 눈금·쐐기가 없습니다(`k10r2-meteor-vs-imminent-gray`). 먹 튐은 원판 안에 있습니다.
- **M3**: §4
- **M4**
  - 조각은 똑바로 굽혀 있고, `paths.tilt`가 [[0,0],[1,−6],[2,−12],[3,−12]]입니다(seed 4).
  - 1배 0.3초에서 12° 기울기가 보입니다. 족자 파문의 R 전체 원도 보입니다.
- **R1**: 띠 14~17과 술이 1배에서 흰 띠로 읽힙니다. 결정은 각진 각기둥이 되어 깃털 판독이 없어졌습니다.
- **R2**: 두 손의 각이 40°/14°로 다르고, 섬광은 r10.5입니다.
- **R3**: 심판선 줄에 punch를 넣었습니다.
- **R4**: 얼음판 금 높이를 엇갈렸습니다.
- **LOD·감소 모션**(`k10r2-lod-check`): reduced는 짝수 가시만, minimal은 가시 3개입니다. 감소 모션은 다 자란 길이로 그립니다.

### 8. 메인 세션: 굽기·등록 주의
1. **지금 굽고 렌더러를 연결해도 됩니다.**
   - 커밋한 HEAD 스냅숏에서 굽습니다.
   - `scripts/build-atlas.mjs:11` `KIT_FILES`에서 'k-icons2.js' 뒤에 'k-arsenal-fx.js'를 넣고, `art/atlas-spec.mjs` PACKS에 'arsenal-fx'를 더합니다.
   - 굽기 전에 확인할 값(다르면 멈춥니다)
     - C8 고정값
     - `k10-keep-stamps=fxjb0m len=158470`(넷째 글자는 소문자 b, 다섯째는 숫자 0)
     - `k10-keep-draw=2rsj2w len=1615076`
     - `k10-keep-spec=v6ki5j len=2682`
     - 아래 `k10-keep2`의 세 값
2. **F1·F2 뒤(검수 3차)**
   - seventhSeal 9장만 바뀝니다. `arsenal-fx` 팩만 다시 굽습니다.
   - `seal`이 바뀌므로 `k10-keep-stamps`는 바뀌는 것이 정상입니다.
   - 대신 seventhSeal을 뺀 모든 출력을 묶은 `k10-keep2` 세 값은 그대로여야 합니다.
     - `k10-keep2-stamps=s5zgbw len=309624`
     - `k10-keep2-draw=4rja1n len=3324145`(다섯째 글자는 숫자 1)
     - `k10-keep2-spec=4k7tt6 len=13113`

```
node scripts/art-review-sheet.mjs expr --name k10-keep2 --scale 1 --crop 0,0,1600,90 --expr '(function(){var X=PN.arsenalFx;function norm(m){return String(m).replace(/\bkaf\d+_/g,"kaf_");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}function cc(s){return s.split("").map(function(c){return c.charCodeAt(0);}).join(",");}var A="",B="",C="";X.groups.forEach(function(g){if(g==="seventhSeal")return;X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++)A+=norm(X.stamp(g,p.part,{frame:f}));});});X.ids.forEach(function(id){if(id==="seventhSeal")return;(X.META[id].stages||[]).forEach(function(st){[false,true].forEach(function(aw){[1,5].forEach(function(lv){[0.1,0.5,0.9].forEach(function(p){B+=norm(X.draw(id,st,{level:lv,awakened:aw,p:p,t:p*0.3,seed:7}));});});});});});var S=JSON.parse(JSON.stringify(X.SPEC));delete S.version;C=JSON.stringify(S);var ha=h(A),hb=h(B),hc=h(C);var L=["k10-keep2-stamps="+ha+" len="+A.length+" codes="+cc(ha),"k10-keep2-draw="+hb+" len="+B.length+" codes="+cc(hb),"k10-keep2-spec="+hc+" len="+C.length+" codes="+cc(hc)];return "<rect width=\"1600\" height=\"90\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(22+i*26)+"\" font-size=\"13\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

3. **렌더러(ArsenalFxPainter)**: 납품서 §5-2와 API §7~§9를 따릅니다.
   - punch
     - stroke·ripple 고리의 모든 층과 심판선 줄에 곱합니다.
     - 각성 가는 선과 wash에는 곱하지 않습니다.
     - 감소 모션에서는 ≤ 1.5입니다.
   - splash
     - jit 1700~1801을 씁니다.
     - 사건마다 한 경로로 그립니다. 순서는 데칼 → splash → 고리 → 물건입니다.
     - LOD와 상한 12/8/3을 지킵니다.
     - 방울은 full에서만 그립니다.
   - tilt: deg[장] × (J(954) < 0.5 ? −1 : +1)만큼 앵커를 축으로 돌립니다. 반전은 하지 않습니다.
   - 인영 반전 J(955)
   - 매니페스트 vectors는 납품서 C9 75줄입니다.
4. **`test:visual`**(연결 뒤)
   - 검수 1차 §7-5 목록
   - 추가로 볼 것
     - lob 착탄 0~3프레임(1440×900, 1024×720)
     - 각성 유성 붓 착탄(가시 10~12): 실제 화면에서 검은 해·성게로 읽히지 않는지
     - minimal LOD
5. **지시서 정정**: 검수 1차 M1의 합격 기준(나이 0.02초)을 §2의 새 기준(0번째 프레임 + 0.05초 + 0.1초)으로 바꿉니다.
6. **절차 확인**: 작가가 납품서 §6에 적은 `cd … && node …` 한 번은 단일 명령 규칙 밖입니다. scope-guard가 왜 허용했는지 메인 세션이 확인해 주세요. 실행된 것은 리뷰 스크립트뿐이라고 적혀 있습니다.

### 9. 검수 3차에서 볼 것
- `k10-keep2` 세 값이 그대로인지
- C2(137 / 341,032), C6, C7, C10
- 인장 확대
  - `k10r2-prints-x6`와 같은 식으로 6배(반전 포함)
  - `k10-seal-prints`로 2배·1배
- 인장 1배: 아래 명령. 지금 렌더 `k10r2-seal-x1`과 같은 식이라 전후를 견줄 수 있습니다

```
node scripts/art-review-sheet.mjs expr --name k10-seal-x1 --scale 1 --check --expr '(function(){var X=PN.arsenalFx,W=520,H=330,s=PN.env.ground(1,W,H,3,{center:null,canalY:false,drainY:false,posters:[],rose:null,ringC:null});var SCL={stalker:0.9,charger:0.963,shooter:0.783};for(var k=0;k<7;k++){var a=2*Math.PI*(k+0.7*X.jit(3,960+k))/7,rr=0.35+0.65*Math.sqrt(X.jit(3,980+k)),x=260+120*Math.cos(a)*rr,y=170+80*Math.sin(a)*rr,P=X.parts("seventhSeal")[0];s+="<g transform=\"translate("+(x-P.anchor[0]).toFixed(1)+","+(y-P.anchor[1]).toFixed(1)+")\">"+X.stamp("seventhSeal",k%2?"seal":"seal-awakened",{frame:k%3})+"</g>";}["stalker","charger","shooter"].forEach(function(r,i){var m=PN.enemies.meta(1,r),kk=m.displayScale*SCL[r],ex=110+i*150,ey=310;s+="<g transform=\"translate("+(ex-m.feet[0]*kk).toFixed(1)+","+(ey-m.feet[1]*kk).toFixed(1)+") scale("+kk+")\">"+PN.enemies.draw(1,r,{lod:"game"})+"</g>";});return s;})()'
```

- C15 확대(K9 인장 아이콘 옆)

### 10. 남는 것과 확인하지 못한 것
- **미확인**
  - 실제 게임 화면: 히트 스톱·흔들림·다른 효과와 겹친 착탄
  - 성능(K11과 함께 잽니다), 팩 바이트
  - 정식 판독 시험(n ≥ 8)
  - splash 면적 측정 식(작가 렌더의 값만 확인)
- **사람 클린업**(납품서 목록에 더함): splash 가시의 붓 질감, 인영 매듭의 찍힘 질감, 공 꼭지의 옻칠 광택
- **2차 발주(lob 비행)**: 검수 1차 §7-7 그대로입니다. 이번에 정한 '먹 튐 = 착탄 0번째 프레임부터' 문법에 이어지도록, 비행 마지막 장에서 착탄 0번 장으로 바로 넘깁니다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`(F1 `:851-873`, F2 `:817-842`)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`(§7.3a, §12-28~39)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md`(1차 수정 납품서)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`(검수 7차 §7 K10 기준)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md`(§7 M1 기준 정정 대상)

---

## 1차 수정 2회차 납품서

kit-artist, 2026-10-19. 검수 2차('## K10 검수 2차')의 F1·F2만 고쳤습니다. 바뀐 것은 두 가지뿐입니다.
- 일곱째 인장 조각 9장: `seal` 3, `seal-awakened` 3, `print-a/b/c`
- `SPEC.version` 문자열

보존 해시 `k10-keep2`의 세 값은 수정 전, F1·F2 뒤, 마지막 파일에서 모두 같습니다. C1·C2·C6·C7·C8·C10도 모두 통과입니다.

### 1. 납품 목록

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`** (`PN.arsenalFx`, `SPEC.version` `1.0-d1r1` → `1.0-d1r2`)
- `crPts` `:127-139`(새 도우미): `smooth()`가 그리는 Catmull-Rom 곡선 위의 점을 뽑습니다. 매듭 획을 `brushD` 붓 면으로 칠하려고 넣었습니다.
- F2 `sealArt` `:829-861`
  - 목 경로 `SEAL_NECK` `:831`
  - 실루엣 `:837`
  - 꼭지 `:844-847`
  - 각성 반짝임 `:854-855`
- F1 `PRINTS` `:862-877`, `printArt` `:878-897`
  - a·b의 `knot`와 `brush: true` `:874-875`
  - 붓 획 `:891-893`
  - c 줄 `:876`은 그대로입니다.
- 그 밖(layout·paths·lobPath·draw, version을 뺀 SPEC 값)은 손대지 않았습니다. 조각 키, 장 수, 박스, 앵커, 초도 그대로이고 137장 / 341,032입니다.

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`**
- 머리말을 v1.0-d1r2로 바꾸고 납품 표에 '1차 수정 2회차' 줄을 더했습니다. §3의 version 주석도 고쳤습니다.
- §6 일곱째 인장 줄
- §11: 검수 2차 §8 명령 결과
- §12: 39를 해결로 표시하고 40~45를 새로 적었습니다.
- §13: 클린업 한 줄

### 2. API 요약 (박스·앵커·판정은 그대로)

| 조각 | 장 | drive·초 | box | anchor | place·layer·lod |
|---|---|---|---|---|---|
| seventhSeal / seal, seal-awakened | 3씩 | prog 0.3 | 40×56 | 20,50 | target·ally·info |
| seventhSeal / print-a, -b, -c | 1씩 | idx(데칼 1.2) | 48×24 | 24,12 | target·ground·deco |

**꼭지**
- 좌표는 앵커 기준입니다. 0번 장은 1.06×0.9로 눌리고, 1·2번 장은 10·14 들립니다.
- 목: `M-2,-19.2 L2,-19.2 L1.5,-25.2 L-1.5,-25.2 Z`, 먹. 공 아래로 5.2가 보입니다.
- 공: 중심 (0,−28.4), r 4, 먹.
  - ink500 빛면 (−1.2,−29.6) r 1.5, 종이 점 (−1.7,−30.2) r 0.6
  - 지름 8은 몸 폭 22의 0.36입니다.
- 2번 장(ink300, α 0.55): 목과 공도 ink300입니다. 빛면과 종이 점은 그리지 않습니다. ink500 빛면이 ink300 공보다 어두워 검은 점으로 보이기 때문입니다.
- 실루엣은 몸 + 목 + 공입니다. 각성 겹 테가 꼭지까지 두릅니다.
- 각성 반짝임: 0번 장 (4.4,−29.4) r 2.6
- 위 여백(getBBox, 선 제외): 0·1·2번 장이 17.0 / 7.6 / 3.6입니다.
  - 각성 1번 장은 겹 테 바깥 3을 더하면 4.6입니다. 2번 장 3.6과 함께 검수서 §5의 계산과 같습니다.

**인영 매듭 획**(rx·ry 단위)
- a: `[[-1.12,-0.2],[-0.86,0.22],[-0.48,0.52],[-0.04,0.64],[0.4,0.56],[0.74,0.34],[1.08,0]]`, w 1.4
- b: `[[-0.78,0.62],[-0.54,0.76],[-0.2,0.74],[0.16,0.58],[0.46,0.3],[0.66,-0.08],[0.86,-0.46],[1.18,-0.72]]`, w 1.3
- 폭은 0.4 + (w − 0.4)·sin(πt)^0.6, α는 0.85입니다.

### 3. 검사 결과

렌더 위치는 `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`입니다. 명령은 모두 단일 `node scripts/art-review-sheet.mjs …`로 돌렸습니다.

**보존 해시**

| 명령 | 결과 |
|---|---|
| `k10-keep2`(수정 전) | `k10-keep2-stamps=s5zgbw len=309624`, `k10-keep2-draw=4rja1n len=3324145`, `k10-keep2-spec=4k7tt6 len=13113` |
| `k10-keep2-after`(F1·F2 뒤) | 같음 |
| `k10-keep2-final`(version을 바꾼 마지막 파일) | 같음. codes 115,53,122,103,98,119 / 52,114,106,97,49,110 / 52,107,55,116,116,54 |
| 옛 `k10-keep-hash`(`k10-keep-hash-r3`) | `k10-keep-stamps=vume3m len=158248`로 바뀌었습니다(`seal`이 들어 있어서, 검수서 §8-2가 예상한 변화). `k10-keep-draw=2rsj2w len=1615076`, `k10-keep-spec=v6ki5j len=2682`는 그대로입니다 |

- 옛 keep-hash는 version을 바꾸기 전에 돌렸습니다.
- keep-spec에는 version이 들어 있지 않습니다. 1차 → 수정 1회차에서 version이 바뀌었을 때도 `v6ki5j` 그대로였습니다.

**C 명령(마지막 파일로 다시 돌림)**
- C1 `k10-c1-all-r3`: `ok`
- C2 `k10-c2-parts-r3`: 아래 6줄이 나왔습니다. 나머지 54줄은 수정 1회차 표와 같습니다.
```
frames=137 ok boxArea=341032 ok badParts=0
seventhSeal/seal f3 prog 0.3s box40x56 a20,50 target none ally info w:mark
seventhSeal/seal-awakened f3 prog 0.3s box40x56 a20,50 target none ally info w:mark
seventhSeal/print-a f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
seventhSeal/print-b f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
seventhSeal/print-c f1 idx 1.2s box48x24 a24,12 target none ground deco w:decal
```
- C6 `k10-c6-scan-r3`
```
calls=181 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```
- C7 `k10-c7-geometry-r3`
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```
- C10 `k10-c10-contrast-r3`: `fills=14 fail=0`이고 14줄 모두 수정 1회차와 같습니다. 인장 두 줄은 다음과 같습니다.
```
seventhSeal.wash (p50 a0.18, 0.36s): ch1 0.501 ch2 0.501 ch3 0.525 ch4 0.511 ch5 0.471 | coat 1.66:1 ok
seventhSeal.print (p50 a0.25, 1.2s): ch1 0.535 ch2 0.536 ch3 0.558 ch4 0.545 ch5 0.507 | coat 1.56:1 ok
```
- C8 `k10-c8-unchanged-r3`(요청 밖, 굽기 전 확인용)
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 n4n4y2/2117692 -> n4n4y2/2117692 same | k11 bvf9fj/934797 -> bvf9fj/934797 same | fixed set same
PN keys same
arsenalFx calls: 181
```

**잰 값(매듭 획)**
- 잰 방법(API §12-40): Catmull-Rom 표본에서 접선이 12° 창 안에 머무는 가장 긴 길이를 인영 폭(2rx)으로 나눴습니다.

| 획 | 가장 곧은 구간 | 최소 꺾인 각 | 가운데에서 최소 거리(반지름 비) | 폭 차지 | 끝 |
|---|---|---|---|---|---|
| a | 33% | 177.9° | 0.64 | 110% | 두 끝 모두 테 밖 |
| b | 25% | 177.4° | 0.55 | 98% | 오른쪽 위 테 밖으로 튕김 |
| c(참고, 그대로) | 38% | — | — | — | — |

**직접 본 렌더**
- **전**
  - 검수자 렌더: `k10r2-prints-x6`, `k10r2-seal-prints-x2`, `k10r2-seal-x1`, `k10r2-seal-knob-mock`
  - 내 렌더: `k10r3-before-prints-seal`
- **버린 시안**: `k10r3-cord-candidates`, `-2`, `-3`, `-4`, 측정 렌더 `k10r3-cord-metrics`, `-2`, `-3`
- **후**
  - `k10r3-after-prints-seal-x6`: 인영 6배(반전 포함)와 인장 6장
  - `k10r3-prints-x8-final`: 인영 8배(반전 포함), `--check` ok
  - `k10-seal-prints`: 2배 흩음, 두 바닥
  - `k10-seal-prints-x1`: 1배
  - `k10-seal-x1`: 검수서 §9 명령, 적 셋과 함께 1배, `--check` ok
  - `k10r3-c15-seal-zoom`: C15 확대, K9 인장 아이콘 옆
  - `k10r3-seal-bbox`: 위 여백

### 4. 지시서 대비

**F1 인영 매듭 획**

| 처방 | 반영 |
|---|---|
| 곡률이 끊기지 않는 한 획, 곧은 구간 ≤ 35%, 꺾인 각 < 120° 없음 | a 33%·b 25%, 최소 각 177.9°·177.4°입니다. 매듭 점 7·8개를 지나는 곡선 하나로 그렸습니다 |
| 붓처럼 마른 끝(끝 0.3~0.5, 가운데 w) | `brushD` 면입니다. 끝은 0.4, 가운데는 1.4(a)·1.3(b)입니다 |
| 닫힌 고리·안으로 말린 끝 없음, a의 끝은 테 쪽으로 풀림 | a는 왼쪽 틈(165~215°) 밖에서 들어와 가운데 아래로 처졌다가 오른쪽 테(0°)를 넘어 밖에서 끝납니다. 'J'로 읽힌 안쪽 말림은 없앴습니다 |
| b는 테에서 나와 크게 한 번 휘고 끝이 바깥으로 튕김 | b는 왼쪽 아래 테 위 (−0.78, 0.62)에서 나와 아래를 따라 한 번 크게 휩니다. 그리고 오른쪽 위 테(약 315°)를 넘어 (1.18, −0.72)에서 끝납니다. 곧은 윗변, 모서리, 곧은 다리가 없습니다 |
| c 그대로 | knot·w·heavy·arcs·dots 모두 그대로입니다. 고른 펜 선입니다 |
| 바꾸면 안 되는 것 | 박스 48×24, 앵커, rx 17·13.5·10.5, 종이 α 0.25, 테 호 자리와 붓 폭, 반달 c, 점, J(955)(layout 코드 무변경), 데칼 1.2초가 모두 그대로입니다. C2 줄과 keep2-spec이 같습니다 |
| 합격 기준 | 6·8배(반전 포함)와 2·1배 흩음에서 ㄱ·7·J·e·@나 숫자로 읽히는 꼴을 찾지 못했습니다. 1·2배에서는 '끈이 걸린 작은 도장 자국'으로 읽힙니다 |

- **버린 방향**
  - 테를 따라 도는 획: 2배에서 b는 겹 테로, a는 눈꺼풀 달린 눈으로 읽혔습니다.
  - 테 틈을 메우는 획: 테가 닫혀 'O'가 됐습니다.
  - 그래서 테를 넘나드는 끈으로 정했습니다(API §12-41).
- API에서 'ㄱ자로 말린 획', '열린 고리'라는 표현을 지웠습니다.

**F2 인장 꼭지**

| 처방 | 반영 |
|---|---|
| 목·공·빛면·종이 점 값 | 검수서 §5 값 그대로입니다 |
| 공 지름 ≤ 몸 폭의 0.4, 목 ≥ 5 | 0.36, 5.2 |
| 실루엣 | 몸 + 목 + 공 |
| 각성 반짝임 | (4.4,−29.4) r 2.6. 예시 (5.2,−32.6)은 눌리지 않은 공 기준입니다. 0번 장은 1.06×0.9로 눌리므로 눌린 공의 오른쪽 위 가장자리로 옮겼습니다(§12-44) |
| 마지막 장 ink300, 들림 10·14 | 그대로입니다 |
| 바꾸면 안 되는 것 | 몸 경로, p300 그늘, 윗면 타원, 청록 인면 테, 장 진행, 박스, 앵커가 그대로입니다(`:836-843`, `:849-857`) |
| 1배: 손잡이 달린 도장 | `k10-seal-x1`에서 일곱 개 모두 원통 위의 목 + 공 손잡이로 읽힙니다. 목이 공을 몸에서 띄워서 '뚜껑 덮은 통'이나 '머리 달린 사람'으로 읽히지 않습니다 |
| 3배: K9 꼭지와 같은 꼴 | `k10r3-c15-seal-zoom`에서 목 + 공의 비례가 같습니다. 색은 §6을 보세요 |
| C7 0건 | 0건입니다. 2번 장 위 여백은 3.6입니다 |

### 5. 메인 세션이 할 일
1. 검수 3차가 합격하면 `arsenal-fx` 팩만 커밋한 HEAD 스냅숏에서 다시 굽습니다.
   - 바뀌는 키는 9개입니다.
     - `afx/seventhSeal/seal/0..2`
     - `afx/seventhSeal/seal-awakened/0..2`
     - `afx/seventhSeal/print-a/0`, `print-b/0`, `print-c/0`
   - 키, 장 수, 박스, 앵커, 초가 그대로라 매니페스트 parts와 vectors(C9)는 바뀌지 않습니다. SPEC을 그대로 싣는다면 매니페스트 `spec.version`만 `1.0-d1r2`가 됩니다.
   - 굽기 전에 확인할 값
     - C8 고정값(위 출력)
     - `k10-keep2` 세 값
     - 옛 보존 해시의 새 기준 `vume3m/158248`, `2rsj2w/1615076`, `v6ki5j/2682`
2. 렌더러가 새로 쓸 옵션이나 규칙은 없습니다. 인영 J(955) 반전과 데칼 1.2초는 그대로입니다.
3. 지시서 §14-2의 '인영 매듭 획' 기준을 c에도 적용할지 정해 주세요. 적용하지 않으면 지시서에 '(c 제외)'를 적어 두기를 권합니다(§6 첫째 항목).

### 6. 알려진 한계
- **c 물결 획은 내 잣대로 38%입니다.** a·b의 35% 기준을 넘습니다. 검수서가 c를 '바꾸면 안 되는 것'에 넣어서 손대지 않았습니다. c에도 적용하기로 하면 `print-c` 한 장만 다시 그리면 됩니다.
- **6배 이상에서 내가 본 것**(최종 판독은 검수자 몫)
  - a의 왼쪽 절반은 왼쪽 아래 테 호 위에서 약 2.6 떨어져 나란히 갑니다. 1·2배에서는 인영 아래 가장자리에 묻힙니다.
  - 반전한 b는 모서리 없는 내리긋기 + 바닥 쓸기입니다. 그래서 둥근 'ㄴ'을 떠올릴 여지가 조금 있다고 봤습니다. 다만 내리긋는 부분이 수직이 아니라 약 40°이고 꺾임이 없어서, 저는 끈으로 읽었습니다.
- **꼭지 색이 K9와 다릅니다.** K9 아이콘의 꼭지는 종이(먹 테)이고, K10은 §5 처방대로 먹입니다. 같은 색으로 맞출지는 검수자가 정해 주세요.
- **사람 클린업으로 넘길 것**(API §13): 인영 끈의 찍힘 질감과 끊김, 공 꼭지의 옻칠 광택
- **보지 않은 것**: 정식 판독 시험(n ≥ 8), 실제 게임 화면(히트 스톱·흔들림·겹침), 성능, 팩 바이트
- lob 비행(납품 2)은 따로 요청을 기다립니다.
- 이번 회차에는 단일 `node scripts/art-review-sheet.mjs …` 명령만 썼습니다. 아무것도 내려받지 않았고, 고친 파일은 위 두 개뿐입니다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`(`:127-139`, `:829-861`, `:862-897`)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`(§6 일곱째 인장, §11, §12-39~45, §13)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md`(검수 2차 §5·§8·§9)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md`(§14)

---

## K10 검수 3차: 1차 수정 2회차(F1·F2), art-director, 2026-10-19

**판정: 합격.** 메인 세션은 지금 `arsenal-fx` 팩을 굽고 렌더러에 연결하면 됩니다. 굽기는 커밋한 HEAD 스냅숏에서 합니다.

### 판단 두 건
1. **인영 c에도 지시서 §14-2를 적용합니다(예외 없음). 다만 이번 합격을 막지는 않고, 다음 K10 납품(2차, lob 비행) 때 함께 고칩니다.**
   - 지금 c는 1·2·6배 어디에서도 글자로 읽히지 않습니다. 모서리도, 닫힌 고리도 없습니다. 그래서 굽기를 미룰 이유는 없습니다.
   - 그래도 적용하는 이유는 둘입니다.
     - 같은 도장의 인영 셋 가운데 c만 굵기가 고른 펜 선이라 a·b의 붓 획과 어긋납니다.
     - 지시서에 예외를 두면 다음 작업자가 같은 판단을 다시 해야 합니다.
   - 처방
     - 물결 획을 a·b와 같은 `brushD` 붓 획으로 바꿉니다. 끝은 0.4, 가운데 w는 1.0~1.2입니다.
     - 가장 곧은 구간을 인영 폭의 35% 이하로 줄입니다. 물결의 굽음을 조금 키우면 됩니다.
     - 반달 테(0.8 → 2.4 → 0.8), 반쪽 종이, 점, rx 10.5, 박스·앵커는 그대로 둡니다.
   - 확인할 것: 바뀌는 것은 `print-c` 한 장뿐이고, `k10-keep2` 세 값은 그대로여야 합니다.
2. **꼭지 색은 먹 그대로 두고 K9 아이콘에 맞추지 않습니다.**
   - K9 검수 7차 §7이 K10에 정한 것은 꼴(목 + 공 꼭지)입니다. 값은 정하지 않았습니다.
   - 1배에서 종이 공을 흰 몸통 위에 올리면 한 덩어리 흰색이 되어 '머리'에 가까워집니다. 먹 공은 옻칠 손잡이로 읽히고, 도장에 블랙 스팟을 줍니다(`k10r3-seal-x1`).
   - 인영도 아이콘(먹 땅 위 종이)과 전장(연한 바닥 위 먹 테)의 값이 다릅니다. 꼭지도 같은 이유로 맥락에 따라 값이 달라도 됩니다.

### 확인한 것
- 렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r3-*.png`
- `--check`는 모두 ok, kit error 0건입니다.

| 검사 | 결과 |
|---|---|
| `k10-keep2` | `s5zgbw len=309624` / `4rja1n len=3324145` / `4k7tt6 len=13113`: 검수 2차와 같습니다. SPEC version은 `1.0-d1r2` |
| 옛 보존 해시 | `vume3m len=158248`(`seal`이 바뀌어 예상대로 바뀜) / `2rsj2w len=1615076` / `v6ki5j len=2682`. 납품서와 같습니다 |
| C2 | `frames=137 ok boxArea=341032 ok badParts=0`. 인장 5줄의 박스·앵커·drive·초가 그대로입니다 |
| C6 | `calls=181 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0` |
| C7 | 0건, `invalid calls ok`. 인장 위 여백은 0·1·2번 장 17.0 / 7.6 / 3.6이고, 각성 1번 장은 겹 테를 넣어 4.6입니다 |
| C10 | `SPEC.fills`가 같은 값의 keep2-spec 안에 있으므로 검수 2차와 같습니다(`fail=0`) |
| 인영 6배(반전 포함)·2배·1배 | `k10r3-prints-x6`, `-seal-prints-x2`, `-seal-prints-x1`. ㄱ·7·J·e·@나 숫자로 읽히는 꼴이 없습니다. a는 테 양옆을 넘는 아래 받침선이고, b는 오른쪽 아래를 지나 오른쪽 위 테 밖으로 튕깁니다. b가 가운데를 지나지 않아 ⊘로 읽히지 않습니다. 1·2배에서 '끈이 걸린 작은 도장 자국'으로 읽힙니다 |
| 인장 1배 `k10r3-seal-x1` | 일곱 개 모두 '손잡이 달린 도장'입니다. '뚜껑 덮은 통'이나 '머리 달린 사람'으로 읽히지 않습니다. 6배에서 목 5.2, 공 지름 8(몸 폭의 0.36)이고, 2번 장은 ink300이며 빛면이 없습니다 |
| C15 `k10r3-c15-seal` | K9 아이콘과 꼴(원통 + 목 + 공 + 청록 인면 테)이 같습니다. 꼭지 값은 판단 2대로 다릅니다 |

### 메인 세션: 굽기·등록
1. **굽기 전에 확인할 값**(다르면 멈춥니다)
   - C8 고정값
   - `k10-keep2` 세 값
   - 옛 보존 해시의 새 기준 `vume3m/158248`, `2rsj2w/1615076`, `v6ki5j/2682`
2. **매니페스트와 렌더러**: 검수 2차 이후 바뀐 것은 `spec.version`(`1.0-d1r2`)뿐입니다.
   - parts와 vectors(C9 75줄)는 그대로입니다.
   - 렌더러 규칙도 검수 2차 §8-3 그대로입니다: punch, splash, tilt, J(955) 인영 반전, 상한 12/8/3.
3. **`test:visual`**: 검수 2차 §8-4 목록. 인장은 데칼 단계(1.2초)와 도장 단계를 함께 봅니다.
4. **지시서 정정**(`docs/art/briefs/arsenal-fx.md` §14)
   - §14-2에 '(인영 a·b·c 모두)'를 더합니다.
   - §14-3에 '꼭지 값: 전장은 먹(옻칠 빛면), 아이콘은 종이 + 먹 테. 꼴(목 + 공)은 같다'를 더합니다.
5. **2차 발주(lob 비행)**
   - 판단 1의 print-c 수정을 함께 넣습니다.
   - 그 회차의 보존 기준은 `k10-keep2` 세 값입니다. 바뀌는 인장 조각은 `print-c` 한 장뿐이어야 합니다.

### 미확인
- 실제 게임 화면: 히트 스톱·흔들림·다른 효과와 겹친 착탄, 인장 데칼 단계
- 성능(K11과 함께 잼), 팩 바이트·페이지 수
- 정식 판독 시험(n ≥ 8)

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`(인장 `:829-861`, 인영 `:862-897`)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md`(1차 수정 2회차 납품서)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md`(§14-2·§14-3 정정)

---

## 2차 납품서

kit-artist, 2026-10-19. 지시서 §3·§8의 납품 2(lob 비행 4종 + `lobPath` + 송이 단지 `mini`)와 검수 3차 판단 1(`print-c` 붓 획)을 했습니다.

**요약**
- 기존 출력 가운데 바뀐 것은 `print-c` 한 장뿐입니다. 2차가 더한 것만 빼고 잰 `k10-keep2` 세 값이 수정 2회차와 같습니다.
- 검수서의 `k10-keep2` 명령을 그대로 돌리면 값이 바뀝니다. 더한 조각과 단계까지 묶어 재기 때문이고, 자세한 것은 §3에 적었습니다.
- 검사는 모두 `--check` ok, 0건입니다.
- 결정이 필요한 것이 셋 있습니다(§5).
  - 먹단지 구름 loop가 75°에서 0°로 되감기는 문제
  - 송이 단지의 각성 비행 조각을 둘지
  - 왼쪽으로 던진 유성 붓의 착지 방향

### 1. 납품 목록

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`** (`PN.arsenalFx`, `SPEC.version` `1.0-d2`)

| 무엇 | 자리 |
|---|---|
| META: lob 4종 `stages` = [`land`, `flight`], `done.lob` = true, `object` = pot / pot-m / jar / comet | `:366-376`, `:539-547` |
| `SPEC.flight`(새 키) | `:488-501` |
| `SPEC.fills` 끝에 `['lob.shadow','ink',0.14,1]` | `:535` |
| 조각 9종 36장. 각 그룹 목록 **끝**에 붙여 앞 조각의 순서와 키는 그대로다 | `:599-620` |
| 비행 그림 | `:1332-1538` |
| └ 도우미 `crClosed`·`outNormals`·`shadeBand`·`litLine`(빛을 화면 왼쪽 위에 두는 그늘 띠) | 위 범위 안 |
| └ 먹단지 `potArt` | `:1381-1405` |
| └ 송이 `cpArt` | `:1407-1435` |
| └ 타르 `jarFlightArt` | `:1437-1477` |
| └ 유성 붓 `cometArt` | `:1479-1538` |
| `lobPath`의 `mini` 경로 | `:2118-2128` |
| `flightFrame`·`drawFlight`, `DRAW.lob`의 `flight` 분기 | `:2283-2312` |
| `PRINTS['print-c']`: `brush: true`, 매듭 점 둘, w 1.1 | `:904` |

- 조각: 먹단지 `pot`·`pot-awakened`, 송이 `pot-s`·`pot-m`·`mini`, 타르 `jar`·`jar-awakened`, 유성 붓 `comet`·`comet-awakened`. 모두 4장씩입니다.
- 합계: 173장, 박스 넓이 389,928(지시서 상한 380장·640,000 안).

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`** (v1.0-d2) 고친 곳
- 납품 표, §2 원점, §3(opts `t`·`dx`·`dy`, lobPath `mini`)
- §4 META, §5 조각 표·장 수, §6(인영 c, 비행 네 줄)
- §7.7 `flight`, §7.9 fills, §8.1 jit 1850+k, §8.4 lobPath와 비행 그림
- §9.1~9.4, §10 예산, §11 2차 결과와 보존 해시 명령
- §12-42 정정, §12-46~60 새 항목, §13

### 2. API 요약

| 조각 | 장 | drive | box | anchor | place · rotate · layer · lod | window |
|---|---|---|---|---|---|---|
| inkPots / pot, pot-awakened | 4씩 | loop 12, still 0 | 30×34 | 15,17 | air · none · air · info | flight |
| clusterPots / pot-s · pot-m | 4씩 | loop 12, still 0 | 22×26 · 26×30 | 11,13 · 13,15 | air · none · air · info | flight |
| clusterPots / mini | 4 | loop 12, still 0 | 18×20 | 9,11 | air · none · air · info | pending |
| tarJar / jar, jar-awakened | 4씩 | loop 8, still 0 | 34×38 | 17,19 | air · none · air · info | flight |
| meteorBrush / comet, comet-awakened | 4씩 | loop 12, still 0 | 32×92 | 16,14 | air · **path** · air · info | flight |

**앵커와 회전**
- 앵커는 물건 자리(땅 x, 땅 y − h)입니다. 단지·항아리는 물건 가운데, 혜성은 붓털 머리입니다.
- comet은 머리를 위로 구웠습니다. 로컬 −y가 나는 쪽이라 렌더러가 lobPath.angle + `turn` 90°만큼 앵커를 축으로 돌립니다.

**`SPEC.flight`(렌더러 규칙)**
- 조각 고르기
  - 기본은 parts[0], 각성은 awakened[0]입니다.
  - 송이 단지는 시전 안 순번 k로 parts[k % 2]를 씁니다(s, m, s, m).
- 장 = ⌊나이·fps + J(1850 + k)·4⌋ mod 4, 나이 = t × 비행 지연(0.55 / 0.6 / 0.7 / 1.0초)입니다.
  - reduced LOD는 fps를 절반으로 합니다.
  - minimal LOD와 감소 모션은 still 장(0)입니다.
- 그림자(ink, α·rx는 lobPath)는 groundMarks 층에, 물건은 air 층에 그립니다.
- t ≥ 1(`area/blast`)이면 비행 그림을 지우고 착탄 0번 장으로 바로 넘깁니다. 착지 예고 원은 없습니다.

**lobPath `mini`(송이 단지만)**
- 높이는 `lobMini.h` 28로 고정이고, 그림자 rx는 5→7입니다.
- 그림자 α는 지시서에 없어 송이 단지 값 0.18→0.32를 씁니다.
- 다른 무기는 `mini`를 무시합니다. 비-mini 출력은 그대로입니다(C9 72~75줄이 같음).

**`draw(id,'flight', opts)`**
- 원점은 던진 자리입니다. `dx`·`dy`는 착지 자리이고 기본값은 240·−60입니다.
- `t`는 비행 진행률(지시서 C11의 `t`)입니다.
- 사건 자리는 착탄과 같은 scatter를 씁니다. 같은 자리로 가는 lob은 한 번만 그립니다(참고 합성만).

**판정**: 착탄 고리 R과 `SPEC.lob`·`lobMini` 값은 그대로입니다.

### 3. 검사 결과

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 모두 단일 `node scripts/art-review-sheet.mjs …`로 돌렸습니다.

**보존 해시**

| 명령 | 결과 |
|---|---|
| `k10-keep2-d2`·`-d2-final`(2차가 더한 것만 뺀 같은 식) | `k10-keep2-stamps=s5zgbw len=309624`, `k10-keep2-draw=4rja1n len=3324145`, `k10-keep2-spec=4k7tt6 len=13113`. **수정 2회차와 같음** |
| `k10-keep2-d2raw-final`(검수서 명령 그대로) | `1gv83el len=518960`, `1bdlklp len=3831623`, `x87qbn len=13444` |

- **검수서의 `k10-keep2` 명령은 그대로면 반드시 바뀝니다.** seventhSeal을 뺀 모든 조각, 모든 단계, version을 뺀 SPEC 전체를 묶기 때문입니다. 그래서 새 비행 조각, `flight` 단계, `SPEC.flight`, `lob.shadow`가 들어가면 값이 달라집니다.
- '바뀌는 것은 print-c뿐'이라는 기준은 그대로 두고, 검수서 명령에 세 줄만 더해 더한 것을 뺐습니다.
  - 조각: `NEWP` 목록(pot, pot-awakened, pot-s, pot-m, mini, jar, jar-awakened, comet, comet-awakened)에 든 part는 건너뜁니다.
  - draw: 단계가 `flight`면 건너뜁니다.
  - SPEC: `delete S.flight`, fills에서 `lob.shadow`를 뺍니다.
- 명령 원문은 API §11에 있습니다.
- `print-c`는 seventhSeal이라 이 묶음 밖입니다. 인장에서 바뀐 것은 `PRINTS['print-c']` 한 줄이고, `seal`·`print-a/b` 코드는 그대로입니다.

**C 명령 출력 원문(마지막 파일)**
- C1 `k10-c1-all-d2-final`: ok
- C2 `k10-c2-parts-d2b`: `frames=173 ok boxArea=389928 ok badParts=0`. 새 줄과 바뀐 줄만 옮깁니다. 나머지 59줄은 수정 2회차와 같습니다.
```
inkPots/pot f4 loop@12 still0 box30x34 a15,17 air none air info w:flight
inkPots/pot-awakened f4 loop@12 still0 box30x34 a15,17 air none air info w:flight
clusterPots/pot-s f4 loop@12 still0 box22x26 a11,13 air none air info w:flight
clusterPots/pot-m f4 loop@12 still0 box26x30 a13,15 air none air info w:flight
clusterPots/mini f4 loop@12 still0 box18x20 a9,11 air none air info w:pending
tarJar/jar f4 loop@8 still0 box34x38 a17,19 air none air info w:flight
tarJar/jar-awakened f4 loop@8 still0 box34x38 a17,19 air none air info w:flight
meteorBrush/comet f4 loop@12 still0 box32x92 a16,14 air path air info w:flight
meteorBrush/comet-awakened f4 loop@12 still0 box32x92 a16,14 air path air info w:flight
```
- C6 `k10-c6-scan-d2`
```
calls=225 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```
- C7 `k10-c7-geometry-d2b`
  - 첫 실행(`-d2`)에서 `clusterPots/mini/0·3`이 박스 − 3을 넘었습니다. 리본 끝 때문이라 박스를 16×20에서 18×20으로 넓혔습니다.
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```
- C8 `k10-c8-unchanged-d2`
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 n4n4y2/2117692 -> n4n4y2/2117692 same | k11 bvf9fj/934797 -> bvf9fj/934797 same | fixed set same
PN keys same
arsenalFx calls: 225
```
- C9 `k10-c9-vectors-d2`: 75줄이고 lob 넷(72~75)은 1차와 한 글자도 다르지 않습니다. 예:
```
72 inkPots lob [[0,0,0,0,-1.08,9,0.18],[0.25,80,-30,89.71,-0.84,10.5,0.22],[0.5,160,-60,119.62,-0.36,12,0.25],[0.75,240,-90,89.71,0.36,13.5,0.29],[1,320,-120,0,0.84,15,0.32]]
75 meteorBrush lob [[0,0,0,0,-1.19,12,0.14],[0.25,80,-30,128.16,-0.96,14.5,0.19],[0.5,160,-60,170.88,-0.36,17,0.24],[0.75,240,-90,128.16,0.61,19.5,0.29],[1,320,-120,0,1.05,22,0.34]]
```
- 새 mini 벡터 `k10-c9-mini-d2`(TypeScript 이식 시험용)
```
clusterPots mini lob to (60,0) [[0,0,0,0,-1.08,5,0.18],[0.25,15,0,21,-0.75,5.5,0.22],[0.5,30,0,28,0,6,0.25],[0.75,45,0,21,0.75,6.5,0.29],[1,60,0,0,1.08,7,0.32]]
clusterPots mini lob to (-60,0) [[0,0,0,0,-2.06,5,0.18],[0.25,-15,0,21,-2.39,5.5,0.22],[0.5,-30,0,28,3.14,6,0.25],[0.75,-45,0,21,2.39,6.5,0.29],[1,-60,0,0,2.06,7,0.32]]
mini ignored off clusterPots: inkPots h at t .5 = 48 (H min 48)
```
- C10 `k10-c10-contrast-d2`: `fills=15 fail=0`. 앞 14줄은 그대로이고 새 줄은 다음과 같습니다.
```
lob.shadow (ink a0.14, 1s): ch1 0.311 ch2 0.311 ch3 0.330 ch4 0.320 ch5 0.288 | coat 2.50:1 ok
```
- C11: `k10-c11-lob`(1배 색), `k10-c11-lob-gray`(흑백) 모두 ok
- C13 `k10-c13-marks-d2`: ok. 오버레이는 3차라 `overlays`가 비어 칸이 없습니다(바닥 다섯 줄만).
- C15 `k10-c15-pairs-d2`: ok. lob 넷이 이제 비행 물건이고, K9 아이콘과 같은 물건으로 읽힙니다.

**잰 값**
- 인영 매듭 획(12° 창 잣대, `k10d2-cord-metrics-final`)
  - a 33% / 177.9° / 가운데에서 0.64 / 폭 110%
  - b 25% / 177.4° / 0.55 / 98%
  - **c 25%**(전 38%) / 173.2° / 0.44 / 80%
  - 셋 모두 끝이 바깥을 향합니다.
- 비행 조각 여백(getBBox, `k10d2-flight-bbox`): 모든 장이 3 이상입니다. 가장 좁은 곳은 pot-s 왼쪽 3.1, pot-m 오른쪽 3.2, comet 아래 4.2입니다.

**직접 본 렌더**
- 기준: K9 아이콘 `k10d2-k9-lob-icons`, `-x4`, `k10d2-k9-tar-meteor-x4`
- 시안과 고친 과정
  - `k10d2-flight-parts-x5`, `k10d2-flight-f0-x10`·`-x10b`·`-x10c`
  - `k10d2-comet-x5`, `-x5b`, `-x8c`
- 최종
  - `k10d2-flight-parts-x5-final`(단지·항아리 36장 중 28장)
  - `k10d2-comet-x5b`·`-x8c`
  - `k10-c11-lob`, `-gray`, `k10d2-c11-meteor-x2`(2배)
  - `k10d2-c11-awakened-lv5`(각성 Lv5, 3장 바닥)
  - `k10d2-tar-vs-shell-x3-gray`(타르 항아리 대 핵심 골분 박격 옹기, 흑백 3배)
  - `k10d2-flight-lod`(full / reduced / minimal / 감소 모션 / t 1)
  - `k10d2-prints-x8`(인영 반전 포함 8배), `k10d2-prints-scatter-x2`(layout 고르기·반전대로 흩음, 1·3장 바닥)
  - `k10-c15-pairs-d2`

### 4. 지시서 대비

**§3 · 검수 1차 §7-7 · 지시서 §13-9**

| 항목 | 반영 |
|---|---|
| 먹단지 `pot` | 흰 백자, 종이 몸, **꼭지 없는** 먹 뚜껑(K9 #38), 흘러내린 먹 줄 하나, 청록 목 끈. 0·25·50·75° 구르고 빛은 화면 왼쪽 위로 고정했습니다(그늘 띠를 돌린 뒤에 깝니다) |
| 송이 단지 `pot-s/m` | 뚜껑 없는 둥근 단지. 먹 입 띠는 안을 ink700, 먼 안벽을 p300 선으로 해 열린 입으로 읽힙니다. 청록 끈 리본이 펄럭이고, s·m·s 순번입니다. 셋이 한 자리에서 출발해 갈라집니다(C11) |
| 타르 항아리 `jar` | 입과 굽이 보입니다(K9 M2). 착탄 항아리를 0.62배·35°로 돌려 같은 물건으로 썼습니다. 열린 입은 p50 테에 안은 먹, 왼쪽 위 ink500 빛면, 청록 봉인 끈. 타르가 입술을 넘어 두 줄로 처집니다. 흑백 3배에서 박격 옹기(바로 선 몸 + 흰 천 뚜껑)와 기울기·열린 테·타르 줄·포물선으로 갈립니다 |
| 유성 붓 `comet` | K9 M1 문법. 마개에서 자루 폭 3.8로 시작해 약 3배(11.6)까지 넓어지는 마른 꼬리, 홈 파인 마른 갈래 넷 + 방울 셋, 먹 마개 + 종이 걸이 고리, 청록 심은 붓 쪽에서 시작해 끝 앞에서 멈춥니다. `rotate: path`이고 높은 포물선(H 90~220)을 그립니다 |
| 짓눌린 붓털 | 공기에 눌려 쇠테 뒤가 넓고, 휜 끝이 홈으로 두 갈래로 갈라집니다(§12-51) |
| 금지: 로켓 코, 횃불 머리, 모이는 꼬리, 꼬리 끝 청록, 분사 섬광, 가시 끝 | 모두 없습니다 |
| 착지 | t ≥ 1에서 비행 그림을 지우고 착탄 0번 장으로 넘깁니다. 예고 원은 없습니다 |
| 상한·LOD | `caps.flights` 12/12/6(1차부터). minimal은 still 장 + 그림자입니다(`k10d2-flight-lod`) |
| 각성 | §1.8 겹 테 + 0번 장 위쪽 반짝임(pot·jar·comet). comet은 붓에만 테를 두르고 꼬리에는 없습니다 |
| 송이 단지 `mini` | 조각 4장과 lobPath `mini`를 넣었습니다. 쓰는 단계(갈라짐)는 3차입니다(§12-48) |

**print-c(검수 3차 판단 1)**
- 붓 획 `brushD`: 끝 0.4, 가운데 w 1.1.
- 물결을 조금 깊게 했습니다. 매듭 점 둘을 (−0.56,0.58)→(−0.57,0.62), (0.22,0.72)→(0.23,0.78)로 옮겼습니다.
- 곧은 구간은 38% → 25%입니다.
- 반달 테(0.8→2.4→0.8), 반쪽 종이, 점, rx 10.5, 박스, 앵커는 그대로입니다.
- 8배(반전 포함)와 2배 흩음에서 꼴은 전과 같고, 획만 a·b와 같은 붓 획입니다.

**버린 시안**(전부 API §12에 적었습니다)
- 붓털 세 덩이 갈래: 불꽃 왕관으로 읽혔습니다.
- 둥근 세 덩이: 횃불로 읽혔습니다.
- 위로 선 끈 끝(송이·타르): 도화선, 곧 K7 폭탄병으로 읽혔습니다.
- 막대 끝 둥근 방울의 타르 줄: 북채·다리로 읽혔습니다.
- 꽉 찬 먹 입 띠: 뚜껑으로 읽혔습니다.

### 5. 메인 세션이 할 일

1. **검수 합격 뒤 `arsenal-fx` 팩을 다시 굽습니다**(커밋한 HEAD 스냅숏).
   - 새 키 36장
     - `afx/inkPots/pot/0..3`, `pot-awakened/0..3`
     - `afx/clusterPots/pot-s/0..3`, `pot-m/0..3`, `mini/0..3`
     - `afx/tarJar/jar/0..3`, `jar-awakened/0..3`
     - `afx/meteorBrush/comet/0..3`, `comet-awakened/0..3`
   - 바뀌는 키: `afx/seventhSeal/print-c/0` 한 장
   - 다른 키의 박스·앵커·장은 그대로입니다.
   - loop 조각이라 애니메이션 `afx/<group>`에 fps를 싣습니다: 12(타르 8), still 0.
   - 매니페스트
     - parts에 9종을 더합니다.
     - spec에 `flight`, fills 15줄, version `1.0-d2`가 들어갑니다.
     - vectors는 C9 75줄 그대로이고, 위의 mini 두 줄을 더할 것을 권합니다.
   - 굽기 전 확인할 값
     - C8 고정값(위)
     - `k10-keep2-d2` 세 값 = `s5zgbw/309624`, `4rja1n/3324145`, `4k7tt6/13113`
     - 원문 `k10-keep2` 세 값 = `1gv83el/518960`, `1bdlklp/3831623`, `x87qbn/13444`
2. **엔진·표시 계층**(지시서 §9-3): RenderWorld에 `lobs`(읽기 전용)를 둡니다. 필드는 x0, y0, 착지 x·y, born, 지연, 무기 id, 각성, **시전 안 순번 k**입니다. k는 송이 s/m과 phase를 고르는 데 씁니다.
3. **렌더러(ArsenalFxPainter)**
   - API §8.4·§9를 따릅니다: t = (지금 − born)/지연, lobPath, 그림자는 groundMarks, 물건은 air.
   - 조각과 phase는 `SPEC.flight`로 고르고, comet은 angle + 90°로 돌립니다.
   - t ≥ 1이면 착탄 0번 장으로 넘깁니다. 상한은 12/12/6, minimal은 still 장 + 그림자입니다.
   - TypeScript 이식 시험에 lobPath(72~75줄 + mini)를 넣습니다.
4. **`test:visual`**(지시서 §9-7 (c)): lob 비행 4종(1440×900, 1024×720)을 찍습니다. 이번에 더 볼 것은 다음 넷입니다.
   - 작은 흰 단지가 픽업(밝은 원판)으로 읽히지 않는지
   - 타르 항아리와 골분 박격 옹기가 갈리는지
   - 혜성이 착지할 때 방향이 이어지는지
   - 송이 셋이 갈라지는 모습
5. **결정 요청**(검수자)
   - (가) **먹단지 구름 loop**(§12-46): loop 12fps로 0·25·50·75°를 돌리면 0.33초마다 75° 되감기는 톱니가 생깁니다.
     - (a) prog로 비행 동안 한 번 구르기. 지시서 C2 식에 `flight` 창 prog를 더해야 합니다.
     - (b) 0·90·180·270°로 바꾸기
     - (c) 그대로 두기
     - 그림 함수는 각만 바꾸면 됩니다.
   - (나) **송이 단지 각성 비행 조각**(§12-47): 지시서 §3 표에는 없고 §2.4 끝 줄은 '4종 모두'라고 했습니다. 지금은 표를 따랐습니다. 더하면 8장, +5,408입니다.
   - (다) **왼쪽으로 던진 유성 붓의 착지**(§12-60): 착탄 `impact`는 늘 왼쪽 위에서 박힙니다. 선택지는 렌더러 반전(빛이 뒤집힘), 반전 꼴 6장 굽기(+35,904), 그대로 두기입니다.
6. **지시서 정정 제안**
   - §3 유성 붓 '뾰족한 끝'을 'K9 §7: 로켓 코 금지, 갈라진 붓끝'으로 맞춥니다.
   - 꼬리 60~70을 박스 92 안의 약 44로 고칩니다(§12-50).
   - 검수 3차 '보존 기준 = `k10-keep2` 세 값'에 '2차가 더한 조각·단계·SPEC 키를 뺀 식'이라는 단서를 더합니다.

### 6. 알려진 한계
- **먹단지 구름 loop의 톱니**: 위 (가)입니다.
- **작은 흰 단지와 픽업**: 송이 단지 `pot-s`(가로 약 10px)와 먹단지(약 13×18px)는 밝은 몸입니다. 먹 입 띠·뚜껑, 청록 끈, 그림자, 포물선 움직임으로 갈리리라 보지만, 지시서 §1.7의 '밝은 원판 12~18px'과의 혼동은 실제 화면에서 봐야 합니다.
- **혜성 회전**: 경로를 따라 돌 때 구운 빛도 함께 돕니다(rotate path의 한계).
- **혜성 꼬리 길이**: 약 44로 지시서 60~70보다 짧습니다.
- **고정된 방향**: 단지·항아리는 던진 방향과 관계없이 같은 그림입니다(rotate none, 타르 입은 늘 오른쪽 위).
- **사람 클린업**(API §13)
  - 비행 단지의 먹 흘림과 뚜껑 외곽, 송이 리본의 펄럭임, 타르 줄의 윤기
  - 붓털 머리와 꼬리 갈래, 인영 c의 찍힘 질감
  - 1배 픽셀 다듬기
- **보지 않은 것**
  - 정식 판독 시험(n ≥ 8)
  - C3·C4·C5·C12·C14, T1~T7: 이번 요청 밖입니다. C11은 직접 봤습니다.
  - 실제 게임 화면, 성능, 팩 바이트
- 단일 명령만 썼고 아무것도 내려받지 않았습니다. 고친 파일은 `k-arsenal-fx.js`와 `API-arsenal-fx.md` 두 개뿐입니다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`(위 줄 번호)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`(§5, §6, §7.7, §8.4, §9, §11, §12-46~60)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md`(§3, §8, §13-9)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md`(검수 1차 §7-7, 검수 3차 판단 1)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K9-arsenal-icons.md`(검수 7차 §7)

## K10 검수 4차: 2차 납품(lob 비행 4종 + `mini` + print-c), art-director, 2026-10-19

**판정: 수정 후 합격.**
- 고칠 것은 둘이고, 둘 다 결정 요청에서 나온 작은 규칙 수정입니다.
  - **F1** 먹단지 구르기를 prog로 바꿉니다(결정 가).
  - **F2** 왼쪽으로 던진 유성 붓의 착탄 반전 규칙을 넣습니다(결정 다).
- 구운 그림은 하나도 바뀌지 않습니다. 바뀌는 것은 `parts`·`SPEC.flight`·`draw` 옵션뿐입니다.
- 메인 세션은 F1·F2 뒤에 한 번 굽습니다. 그 확인은 C2·C7·해시만 보는 짧은 확인입니다.

**요청하신 판단**
- **작은 흰 단지가 픽업으로 읽히는가: 읽히지 않습니다.**
  - C11 1배 색·흑백에서 먹단지는 '먹 뚜껑을 쓴 흰 단지'로, 송이 단지는 '먹 입이 열린 작은 흰 단지 셋'으로 읽힙니다.
  - 남는 위험이 하나 있습니다. 송이 단지 `pot-s`(약 10px)가 동전 픽업(12px, 밝은 원판)과 크기·명도가 겹칩니다. 땅 그림자와의 거리, 포물선, 셋이 함께 갈라지는 움직임으로 갈리지만 정지 프레임으로는 확인하지 못했습니다. `test:visual` 확인 항목으로 둡니다.
- **타르 항아리와 골분 박격 옹기는 갈립니다.**
  - 타르 항아리: 약 20px, 35° 기울어짐, 종이 테를 두른 열린 입(안은 먹), 늘어진 타르 줄 둘, 옆으로 도는 포물선
  - 박격 옹기: 약 30px, 바로 선 달걀꼴 몸, 흰 천 뚜껑, 수직 낙하
  - 흑백 3배·1배에서 실루엣과 흰 부분의 꼴이 모두 다릅니다(`k10r4-tar-vs-shell-gray`).
- **혜성은 로켓이나 횃불로 읽히지 않습니다.**
  - 앞끝은 홈으로 갈라진 검은 붓끝이고, 종이 자루·쇠테·마디·걸이 고리가 있습니다.
  - 꼬리는 마른 먹 갈래이고 불꽃·연기·밝은 분사가 없습니다. 청록은 꼬리 끝에 없습니다.
  - 내려가는 구간은 K9 기준 그대로 '머리부터 떨어지는 붓'입니다.
  - 올라가는 구간(머리가 위)은 '던진 붓·깃 달린 화살'에 가깝습니다. 이것도 `test:visual`에서 봅니다(`k10r4-meteor-flight-x2`).
- **보존 해시: `k10-keep2-d2`를 기준으로 받아들입니다.**
  - 직접 재어 수정 2회차 값 `s5zgbw/309624`, `4rja1n/3324145`, `4k7tt6/13113`과 같았습니다.
  - 원문 `k10-keep2`가 바뀌는 것은 제 명령이 더한 것까지 묶기 때문이라 정상입니다(직접 잰 값도 `1gv83el`·`1bdlklp`·`x87qbn`으로 납품서와 같음).
  - 앞으로는 '그 납품이 더한 조각·단계·SPEC 키만 빼고 같은 식으로 잰다'를 일반 규칙으로 하고, 아래 새 전체 해시 `k10-keep-all`을 더합니다.
- **결정 셋**: (가) (a) prog, (나) 더하지 않음, (다) 렌더러 반전. 근거는 §2입니다.
- **지시서 정정 제안 셋은 모두 받아들입니다.** 정정 넷을 더합니다(§6).

### 1. 확인한 것
- 렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r4-*.png`
- `--check`는 모두 ok, kit error 0건입니다.

| 검사 | 결과 |
|---|---|
| `k10-keep2-d2` | `s5zgbw/309624`, `4rja1n/3324145`, `4k7tt6/13113`. 수정 2회차와 같습니다 |
| 옛 보존 해시 | `vume3m/158248`(인장 그대로), `2rsj2w/1615076`. keep-spec은 fills에 `lob.shadow`가 더해져 `urd9m6/2710`으로 바뀌었습니다(예상한 변화) |
| C2·C7 | `frames=173 ok boxArea=389928 ok badParts=0`, 박스 − 3 0건. 비행 조각 여백은 가장 좁은 곳이 3.1(pot-s)입니다. lob 경로 0건 |
| C11 1배 색·흑백 | `k10r4-c11-lob`, `-gray`. 단지 넷 모두 그림자와 포물선이 이어지고, t ≥ 1에서 착탄 0번 장으로 넘어갑니다 |
| 픽업 대조 | `k10r4-pots-vs-pickups`: xp 14·16·18, 동전 12, 회복·자석 22 픽업 옆에 단지·항아리를 둠 |
| 확대 | `k10r4-pots-x6`(단지·항아리, 0·25·50·75°, 빛은 늘 왼쪽 위), `-comet-x5`, `-print-c-x8`(c는 a·b와 같은 붓 획이고 글자로 읽히지 않음) |
| C15 `k10r4-c15-lob` | 네 무기 모두 K9 아이콘과 같은 물건입니다. 먹단지는 꼭지 없는 먹 뚜껑, 송이는 셋, 타르는 쓰러진 항아리, 유성 붓은 K9 §7 꼴입니다 |
| LOD | 작가 렌더 `k10d2-flight-lod`를 확인했습니다. minimal·감소 모션은 still 장 + 그림자입니다 |
| C6·C8·C9·C10 | 납품서 원문을 받아들입니다. C10에는 `lob.shadow`(Y 0.29~0.33)가 들어갑니다 |

### 2. 결정 셋
- **(가) 먹단지 구르기: (a) prog로 바꿉니다.**
  - 지시서 §3에서 제가 4장(0·25·50·75°)을 loop로 정한 것이 톱니를 만든 원인입니다.
  - 던진 단지는 포물선 동안 1/4 바퀴 남짓 천천히 구르는 것이 자연스럽고, 착탄 0번 장으로 이어지기도 좋습니다.
  - (b)는 12fps에 초당 3바퀴라 90° 단위로 깜빡여 보이므로 쓰지 않습니다.
- **(나) 송이 단지 각성 비행 조각: 더하지 않습니다.**
  - 7~13px 단지에 §1.8 겹 테(종이 + 먹)를 두르면 12~17px 밝은 원판이 됩니다. 바로 위에서 걱정한 동전 픽업 혼동을 키웁니다.
  - 송이 단지의 각성은 수 +1과 3차 갈라짐(`mini`)이 보여 줍니다.
  - 지시서 §2.4의 '4종 모두'를 '송이 단지 제외'로 고칩니다.
- **(다) 왼쪽으로 던진 유성 붓의 착지: 렌더러가 반전합니다.**
  - 붓이 박힌 방향이 이어지는 것이 구운 빛 방향보다 중요합니다. 혜성은 이미 경로를 따라 돌며 빛도 함께 돌고 있습니다.
  - 착탄 붓은 작고 그늘 단서가 적습니다. 족자는 큰 p300 그늘이 있어 반전을 막은 것이라 사정이 다릅니다.
  - 반전 꼴을 따로 굽는 +35,904는 쓸 가치가 없습니다.

### 3. 고칠 것 (kit-artist, `k-arsenal-fx.js`·`API-arsenal-fx.md`만)

**F1. 먹단지 비행: 비행 동안 한 번 구르기**
- **처방**
  - `inkPots/pot`·`pot-awakened`를 다음으로 바꿉니다.
    - drive `prog`, fps 0, still null, window `flight`
    - seconds 0.55: 먹단지 비행 지연과 같은 참고값입니다. C2 식이 prog에 seconds를 요구하기 때문입니다.
  - `SPEC.flight.inkPots`
    - 장 = min(3, ⌊t·4⌋)이고, t는 lobPath의 비행 진행률입니다. 렌더러는 자료의 지연을 씁니다.
    - phase(J(1850+k))는 쓰지 않습니다.
    - minimal은 0번 장입니다. 감소 모션에서는 prog 규칙대로 재생합니다.
  - 그림(0·25·50·75°)과 박스·앵커는 그대로입니다. API §5·§7.7·§12-46을 고칩니다.
- **합격 기준**
  - C2 줄이 `inkPots/pot f4 prog 0.55s box30x34 a15,17 air none air info w:flight`(awakened도 같음)입니다.
  - `draw('inkPots','flight')`의 t .12/.30/.50/.70/.88에서 장이 0·1·2·2·3입니다.
  - `k10-keep2-d2` 세 값이 그대로입니다.
  - `k10-keep-all-stamps=nvezmq len=535352`가 그대로입니다. 그림을 다시 그리지 않았다는 증거입니다.

**F2. 유성 붓 착탄 반전 규칙**
- **처방**
  - `SPEC.flight.meteorBrush.landMirror`(예: `'dx<0'`)를 둡니다.
  - 렌더러는 그 사건의 lob이 왼쪽으로 날아왔으면(x1 < x0) `impact`·`impact-awakened` 세 장을 앵커를 축으로 좌우 반전합니다.
  - `crater`, splash, 고리는 반전하지 않습니다. 방향을 모르면 반전하지 않습니다.
  - 참고 합성은 `draw(id,'land',{dir:-1})`로 같은 반전을 그립니다. 기본 출력은 그대로입니다.
  - API §9에 렌더러 규칙을 적습니다.
- **합격 기준**
  - `dir:-1` 렌더에서 붓이 오른쪽 위에서 박힙니다.
  - 기본 `land` 출력과 `k10-keep2-d2`가 그대로입니다.

**F1·F2 뒤 작가가 기록할 것**: 아래 `k10-keep-all` 네 값. 3차(기믹)부터는 이 값이 '3차가 더한 것만 뺀' 보존 기준입니다.
- stamps는 그대로여야 합니다: `nvezmq/535352`(지금 값).
- draw·spec·parts는 F1·F2만큼 바뀝니다. 지금 값은 draw `16q45bq/4419724`, spec `x87qbn/13444`, parts `1lej6wb/13867`입니다.

```
node scripts/art-review-sheet.mjs expr --name k10-keep-all --scale 1 --crop 0,0,1700,90 --expr '(function(){var X=PN.arsenalFx;function norm(m){return String(m).replace(/\bkaf\d+_/g,"kaf_");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36);}function cc(s){return s.split("").map(function(c){return c.charCodeAt(0);}).join(",");}var A="",B="";X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++)A+=norm(X.stamp(g,p.part,{frame:f}));});});X.ids.forEach(function(id){(X.META[id].stages||[]).forEach(function(st){[false,true].forEach(function(aw){[1,5].forEach(function(lv){[0.1,0.5,0.9].forEach(function(p){B+=norm(X.draw(id,st,{level:lv,awakened:aw,p:p,t:p*0.3,seed:7}));});});});});});var S=JSON.parse(JSON.stringify(X.SPEC));delete S.version;var C=JSON.stringify(S),P=JSON.stringify(X.groups.map(function(g){return X.parts(g);}));var L=["k10-keep-all-stamps="+h(A)+" len="+A.length+" codes="+cc(h(A)),"k10-keep-all-draw="+h(B)+" len="+B.length+" codes="+cc(h(B)),"k10-keep-all-spec="+h(C)+" len="+C.length+" | parts="+h(P)+" len="+P.length];return "<rect width=\"1700\" height=\"90\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(22+i*24)+"\" font-size=\"12\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

### 4. 다르게 한 것 46~60

| # | 판정 |
|---|---|
| 46 먹단지 loop 톱니 | F1(결정 가 = prog) |
| 47 송이 단지 각성 비행 조각 없음 | 수용(결정 나), 지시서 §2.4 정정 |
| 48 `mini` 조각 18×20 + lobPath `mini`(그림자 α는 송이 값) | 수용 |
| 49 혜성을 머리 위로 굽고 `turn` 90 | 수용. 렌더러는 angle + 90°로 돌립니다 |
| 50 꼬리 약 44 | 수용. 1·2배에서 혜성으로 읽힙니다(머리 끝에서 방울까지 약 83) |
| 51 갈라진 붓끝 머리 | 수용. K9 §7의 '로켓 코 금지'와 맞습니다 |
| 52 끈 끝을 아래·바깥으로 | 수용. 도화선 판독을 피한 좋은 판단입니다 |
| 53 송이 단지 열린 입(ink700 안 + p300 먼 벽) | 수용 |
| 54 타르 비행 = 착탄 항아리 0.62배·35° | 수용(같은 물건) |
| 55 `SPEC.flight` 새 키 | 수용. F1·F2가 여기에 규칙을 더합니다 |
| 56 `lob.shadow` 채움 | 수용(C10 통과) |
| 57 print-c 붓 획 | 수용(8배에서 확인, 곧은 구간 25%) |
| 58 `draw(...,'flight')`의 t는 진행률 | 수용 |
| 59 `1.0-d2` | 수용 |
| 60 왼쪽 착지 | F2(결정 다 = 렌더러 반전) |

### 5. 메인 세션: 굽기·등록
1. **굽기: F1·F2 짧은 확인 뒤 한 번**(커밋한 HEAD 스냅숏).
   - 새 키 36장과 바뀐 `print-c` 한 장이 들어갑니다. F1·F2는 그림을 바꾸지 않으므로 지금 개발용으로 구워 두고 뒤에 다시 구워도 됩니다.
   - 애니메이션 fps: 송이 12, 타르 8, 혜성 12, still 0. 먹단지 `pot`은 F1 뒤 prog라 fps를 싣지 않습니다.
   - 굽기 전에 확인할 값
     - C8 고정값
     - `k10-keep2-d2` 세 값
     - F1·F2 뒤 작가가 기록한 `k10-keep-all` 네 값(stamps는 `nvezmq/535352`)
2. **엔진·표시 계층**: RenderWorld `lobs`(읽기 전용)를 둡니다.
   - 필드: x0·y0·x1·y1, born, 지연, 무기 id, 각성, 시전 안 순번 k
   - F2 반전에는 x1 − x0의 부호가 필요합니다. lob이 끝나는 틱에 같은 자리의 `area/blast`로 넘겨줍니다.
3. **렌더러**: API §8.4·§9와 `SPEC.flight`(F1 prog·F2 반전 포함)를 따릅니다.
   - 그림자는 groundMarks, 물건은 air 층입니다.
   - 혜성은 angle + 90°로 돌립니다.
   - 상한은 12/12/6이고, minimal은 still 장 + 그림자입니다.
   - t ≥ 1이면 착탄 0번 장으로 넘깁니다.
   - 이식 시험: lobPath C9 72~75줄 + mini 두 줄
4. **`test:visual`**(지시서 §9-7 (c) + 이번 확인 항목)
   - 정지 프레임에서 송이·먹단지 단지와 동전·xp 픽업이 헷갈리지 않는지
   - 타르 항아리 대 골분 박격 옹기(같은 화면)
   - 유성 붓의 올라가는 구간: 로켓·폭죽으로 읽히면 다음 회차에서 올라가는 동안 꼬리를 줄이는 방안을 검토합니다
   - 왼쪽으로 던진 유성 붓의 착지 반전
   - 송이 셋이 갈라지는 모습
5. **`docs/art/briefs/arsenal-fx.md` §15로 더할 정정**
   - §3 유성 붓: '뾰족한 끝'을 'K9 §7 꼴: 로켓 코 금지, 갈라진 붓끝, 마른 갈래 꼬리'로, 꼬리 60~70을 '박스 92 안 약 44'로 고칩니다.
   - §3 먹단지: '비행 동안 한 번 0 → 75° 구르기(prog, 진행률 t)'
   - §2.4: '각성 비행 물건은 송이 단지 제외(픽업 크기 밝은 원판 방지)'
   - §3 착지: '유성 붓 착탄은 왼쪽으로 던졌으면 렌더러가 좌우 반전'
   - 보존 해시: '그 납품이 더한 조각·단계·SPEC 키만 빼고 같은 식으로 잰다'. 기준은 `k10-keep-all`(F1·F2 뒤 값)입니다.

### 6. 미확인
- 실제 게임 화면: 픽업과 겹친 정지 프레임, 올라가는 혜성
- 성능(K11과 함께 잼), 팩 바이트·페이지 수
- 정식 판독 시험(n ≥ 8)

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`(`SPEC.flight` `:488-501`, 비행 조각 `:599-620`, `potArt` `:1381-1405`, `drawFlight` `:2283-2312`)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`(§5, §7.7, §9, §11, §12-46~60)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md`(2차 납품서)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md`(§2.4, §3, 새 §15)

## K10 2차 수정 1회차 납품서

kit-artist, 2026-10-19. 검수 4차('## K10 검수 4차') §2·§3의 F1·F2를 반영했습니다. 그림은 다시 그리지 않고 규칙만 고쳤습니다. `SPEC.version`은 `1.0-d2r1`입니다.

**요약**
- 합격 기준은 모두 맞았습니다. C2 줄, 비행 장 0·1·2·2·3, `dir:-1` 반전, `k10-keep2-d2` 세 값 그대로, `k10-keep-all-stamps=nvezmq len=535352` 그대로입니다.
- 검수서 예상과 다른 것이 하나 있습니다. `k10-keep-all-draw`가 F1 뒤에도 그대로입니다. 그 명령이 그리는 t에서 옛 loop 장과 새 prog 장이 우연히 같기 때문이고, 계산은 아래 §2에 적었습니다.

### 1. 바뀐 곳

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`**

| 무엇 | 줄 |
|---|---|
| `SPEC.version` `1.0-d2` → `1.0-d2r1` | `:380` |
| `SPEC.flight` 설명 주석(F1 progress 규칙, F2 landMirror 규칙) | `:488-497` |
| F1 `SPEC.flight.inkPots`에 `frame: 'progress'` | `:499` |
| F2 `SPEC.flight.meteorBrush`에 `landMirror: { when: 'dx<0', parts: ['impact', 'impact-awakened'] }` | `:502` |
| F1 `inkPots/pot`·`pot-awakened`: `['pot', 4, 'prog', 0, 0.55, 'flight', [30,34], [15,17], 'air', 'none', 'air', 'info']`. still 0 옵션을 빼서 still은 null이다 | `:603-606` |
| `potArt` 주석(그림 코드는 그대로) | `:1386-1389` |
| F1 `flightFrame(P, o, u, age, ph, byProgress)`: progress면 minimal은 0, 그 밖은 min(장 수 − 1, ⌊u·장 수⌋)이고 phase를 쓰지 않는다. 감소 모션도 같은 규칙이다 | `:2289-2298` |
| F2 `mirrorLand(id, stage, items, o)`: `landMirror`가 있고, 주 단계이고, `+o.dir < 0`일 때만 그 parts의 layout 항목 `flip`을 뒤집는다 | `:2299-2305` |
| `drawFlight`가 진행률과 progress 표시를 넘긴다 | `:2322` |
| `DRAW.lob`이 착탄 layout 항목을 `mirrorLand`에 통과시킨다. 분화구는 parts 밖이라 그대로이고, splash·고리는 layout이 아니라 그대로다 | `:2340` |

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`** (v1.0-d2r1) 고친 곳
- 머리말과 납품 표('2차 수정 1회차' 줄), §3(version 주석, opts `dir`)
- §5(pot 줄을 prog (0.55)로, 설명 한 줄), §6(먹단지 비행 설명)
- §7.7(`frame 'progress'`, `landMirror`, `phase` 설명), §8.1(1850+k는 먹단지에 쓰지 않음)
- §8.4(loop / prog 장 규칙), §9.2(**유성 붓 착탄 반전 렌더러 규칙**), §9.4(LOD)
- §11(검수 4차 결과), §12-46·47·60 해결 표시, §12-61·62 새 항목

### 2. 검사 출력 원문

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 명령은 모두 단일 `node scripts/art-review-sheet.mjs …`로 돌렸습니다.

**C2** `k10-c2-parts-d2r1`
```
frames=173 ok boxArea=389928 ok badParts=0
inkPots/pot f4 prog 0.55s box30x34 a15,17 air none air info w:flight
inkPots/pot-awakened f4 prog 0.55s box30x34 a15,17 air none air info w:flight
```

**먹단지 비행 장 번호** `k10-pot-flight-frames`
- 조건: `draw('inkPots','flight')`, t .12/.30/.50/.70/.88, dx 560, dy −40, seed 3.
- 잰 방법: 각 장의 `stamp` 출력이 draw 출력 안에 들어 있는지 글자로 맞췄습니다.
```
pot full t .12/.30/.50/.70/.88 -> 0 1 2 2 3
pot-awakened full -> 0 1 2 2 3
pot lod minimal -> 0 0 0 0 0
pot reduced motion -> 0 1 2 2 3
pot lod reduced -> 0 1 2 2 3
```
- 대조 `k10-pot-frame-old-new`
```
J(7,1850) = 0.995 | J(3,1850) = 0.423
keep-all t .03/.15/.27, seed 7: old loop 0,0,1 | new prog 0,0,1
C11 t .12/.30/.50/.70/.88, seed 3: old loop 2,3,0,2,3 | new prog 0,1,2,2,3
```

**F2 `dir:-1` 렌더**
- `k10-meteor-land-dir.png`: 2배, `--check` ok.
  - 왼쪽 열은 기본이고 붓이 왼쪽 위에서 박힙니다. 오른쪽 열은 `dir:-1`이고 **붓이 오른쪽 위에서 박힙니다.**
  - 위에서부터 0번 장, 1번 장, 각성 0번 장입니다.
- 글자 비교 `k10-meteor-dir-diff`
```
p 0.04 aw false lv 1: flips added 1, output minus flips == default: true
p 0.3 aw false lv 3: flips added 1, output minus flips == default: true
p 0.9 aw true lv 5: flips added 3, output minus flips == default: true
p 0.5 aw true lv 2: flips added 2, output minus flips == default: true
inkPots land dir -1 == default: true
```
- 바뀐 것은 impact 조각의 ` scale(-1 1)`뿐입니다(사건 수만큼). 분화구·splash·고리와 기본 출력은 그대로입니다.

**`k10-keep2-d2`** `k10-keep2-d2r1`
```
k10-keep2-stamps=s5zgbw len=309624
k10-keep2-draw=4rja1n len=3324145
k10-keep2-spec=4k7tt6 len=13113
```
세 값 모두 그대로입니다.

**`k10-keep-all` 네 값**(검수서 §3 명령 그대로)
- 수정 전 `k10-keep-all-before`
```
k10-keep-all-stamps=nvezmq len=535352 codes=110,118,101,122,109,113
k10-keep-all-draw=16q45bq len=4419724 codes=49,54,113,52,53,98,113
k10-keep-all-spec=x87qbn len=13444 | parts=1lej6wb len=13867
```
- F1·F2 뒤 `k10-keep-all`
```
k10-keep-all-stamps=nvezmq len=535352 codes=110,118,101,122,109,113
k10-keep-all-draw=16q45bq len=4419724 codes=49,54,113,52,53,98,113
k10-keep-all-spec=ej7o5i len=13529 | parts=9on297 len=13871
```
- stamps는 그대로입니다. 그림을 다시 그리지 않았다는 뜻입니다.
- spec +85자: `"frame":"progress"`와 `landMirror` 객체입니다.
- parts +4자: pot 두 서술자에서 fps 12 → 0(각 −1자), still 0 → null(각 +3자)입니다.
- **draw가 그대로인 까닭**(API §12-61)
  - 이 명령은 비행을 t = p × 0.3 = 0.03·0.15·0.27, seed 7로 그립니다.
  - 먹단지는 같은 자리 lob을 한 번만 그리므로 lob 0 하나뿐입니다.
  - 옛 loop 장 ⌊t·0.55·12 + 4·J(7,1850)⌋ mod 4는 J = 0.995라 0·0·1입니다.
  - 새 ⌊t·4⌋도 0·0·1이라 같은 그림입니다.
  - C11의 t에서는 장이 바뀝니다(위 대조).
  - F2는 `dir`을 주지 않는 기본 출력을 바꾸지 않습니다.
- 3차부터 '더한 것만 뺀' 보존 기준은 위의 F1·F2 뒤 네 값입니다.

**`--check`·검사**
- C1 `k10-c1-all-d2r1`: `ok`
- C6 `k10-c6-scan-d2r1`
```
calls=225 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```
- C7 `k10-c7-geometry-d2r1`
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```
- `k10-meteor-land-dir`: `ok`

### 3. 알려진 한계
- **`k10-keep-all-draw`가 바뀌지 않음**: 검수서 예상('F1·F2만큼 바뀝니다')과 다르지만 위 계산대로 정상입니다. F1이 실제로 장을 바꾸는 것은 `k10-pot-flight-frames`와 `-frame-old-new`로 확인했습니다.
- **F2의 엔진 쪽 일**: 렌더러가 방향을 알려면 lob이 끝나는 틱에 같은 자리의 `area/blast`로 x1 − x0의 부호를 넘겨야 합니다(검수 4차 §5-2, 메인 세션).
  - 방향을 모르면 반전하지 않으므로 그때는 지금처럼 왼쪽 위에서 박힙니다.
  - 반전한 착탄은 구운 빛이 오른쪽 위가 됩니다(검수자가 받아들인 대가).
- **먹단지 prog의 `seconds` 0.55**: C2 식 때문에 둔 참고값입니다. 렌더러는 자료의 지연으로 진행률을 잽니다. 지연이 바뀌어도 그림은 맞지만 서술자의 0.55는 낡은 값이 될 수 있습니다.
- **장 바뀜**: 0.55초 비행에 4장이라 약 0.14초마다 25°씩 바뀝니다. 1배(단지 약 13×18px)에서 계단은 작지만 실제 화면에서 봐야 합니다.
- **reduced LOD**: 먹단지는 prog라 fps를 절반으로 줄이지 않습니다(진행률 규칙 그대로).
- **`test:visual`로 남은 것**(검수 4차 §5-4): 단지와 동전·xp 픽업, 올라가는 혜성, 왼쪽 착지 반전, 송이 셋이 갈라지는 모습.
- 고친 파일은 `k-arsenal-fx.js`·`API-arsenal-fx.md` 둘뿐입니다. 명령은 한 번에 하나씩 단일 명령으로 돌렸고, 아무것도 내려받지 않았습니다.

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`(`:380`, `:488-505`, `:603-606`, `:1386-1389`, `:2289-2305`, `:2322`, `:2340`)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`(§5, §7.7, §8.4, §9.2, §9.4, §11, §12-46·47·60·61·62)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md`(검수 4차 §2·§3·§4)

## 메인 세션 확인: 2차 수정 1회차 (2026-10-19)

검수 4차 §1의 '짧은 확인'을 메인 세션이 했다. 받아들인다(굽는 판 `1.0-d2r1`).
- `k10-keep-all`: stamps `nvezmq/535352`(그대로), draw `16q45bq/4419724`, spec `ej7o5i/13529`, parts `9on297/13871`. 납품서 값과 같다.
- `inkPots/pot`·`pot-awakened`: 4장, prog, fps 0, seconds 0.55, still null.
- `k10-meteor-land-dir`: `dir:-1` 열에서 붓이 오른쪽 위에서 박히고, 분화구·고리는 그대로다.
- 다음 납품(3차, 각성 기믹 그림)의 보존 기준은 위 네 값이다.
