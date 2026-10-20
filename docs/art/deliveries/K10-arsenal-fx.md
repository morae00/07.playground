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

## K10 3차 납품서

**3차 1회(3a): 각성 기믹 P1 17종 · `SPEC.version` `1.0-d3a`**

kit-artist, 2026-10-19. 분량이 커서 허락받은 대로 P1만 먼저 냅니다. P2는 3차 2회로 넘깁니다.

**검수자가 먼저 볼 것**
- 모든 `--check` 결과가 ok이고 kit error는 0건입니다.
- 보존 해시(이번에 더한 것만 빼고 잰 값) 네 개가 2차 수정 1회차 값과 같습니다. 기존 그림·SPEC·조각의 기본 출력은 하나도 바뀌지 않았습니다.
- 정해 주실 것은 §9의 셋입니다. 판독 쪽 약점(머리 위 표식 두 개가 1배에서 작음, 흑백 1배 불먹 발밑 불길)은 §5에 적었습니다.

고친 파일은 둘뿐입니다.
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`(새 §14, §11·§12-63~78·§13 갱신)

### 1. 만든 것과 done 목록

**코드 위치(k-arsenal-fx.js)**

| 무엇 | 줄 |
|---|---|
| `GSTAGE`(기믹 단계 17), `GOBJECT` | 380–386 |
| `SPEC.zone` | 521–531 |
| `SPEC.gimmick` | 535–541 |
| `SPEC.overlay` | 547–551 |
| `fills` 새 9줄 | 586–595 |
| `GLAYOUT`(`SPEC.layout`에 합침) | 599–613 |
| 조각 표 `PT`(새 그룹 8 + 기존 그룹 끝에 붙임) | 628– |
| 조각 그림 §3b | 1839–2145 |
| `stageR`·`glayout` | 2472–2527 |
| `gpaths`·`ridgePts` | `paths` 앞 |
| 오버레이·땅 조각·기믹 그림(`ovBody`, `ctxEnemy`, `drawZone`, `drawMarks`, `drawTriangle`, `drawUnroll`, `drawEighth`, `drawTotal`, `drawSurge`) | 3006–3168 |
| `overlay()` | 3183 |

**공개 API에 생긴 것**
- `groups`가 22개에서 30개가 되었습니다(투사체 무기 8개가 기믹 조각으로 들어옴).
- `overlays` = `['silence', 'prey', 'crow', 'freeze', 'scorch']`
- `overlay(key, {r, top, t, peck, layer})`: `peck`과 `layer`가 새 옵션입니다. 둘 다 없으면 출력이 예전과 같습니다.
- 조각 280장(+107), 박스 넓이 합 522,964(+133,036). 상한 380장·640,000 안입니다.

**done.gimmick = true(17종)**: frostNeedles(freeze), twinBlades(spin), pinHail(caltrop), smokeTail(smoke), gravePins(grave), trackingSeals(triangle), huntersMarks(prey), crowFeathers(crow), inkLightning(pillar), brushDownpour(surge), fallingScroll(unroll), seventhSeal(eighth), silenceBell(silence), inkPots(fire), tarJar(gather), meteorBrush(mark), eclipseHalo(total).
- 각 무기의 `gimmicks`는 `[{stage, priority: 1}]` 하나이고, `stages` 끝에 그 단계가 붙습니다.

**3차 2회로 넘긴 것(P2, `META`에 없음)**: 먹 얼룩, 늦은 붓자국, 도미노, 서리 수, 감전 도약, 공포, 꽃가루, 가시, 해바늘(렌더러 배율), 배후 응징, 헤맴, 묶임, 균열, 밀쳐 부딪힘, 메아리, 갈라짐(`mini` 조각은 2차에 이미 있음), 되감김, 증폭, 묶인 사슬, 가지창, 되쓸기, 되받기, 약화, 결 가속.

**그리지 않음**(§11 Q11): P3와 '그림 없음' 항목.

### 2. 무기별 요약

| 무기 / 단계 | 물건(조각) | SPEC 도형·규칙 | 청록 |
|---|---|---|---|
| 서리침 / freeze | `freeze-back-12/19/28`(얼음판 + 뒤 결정 넷, 몸 아래), `freeze-front-*`(앞 서릿발, 몸 높이의 약 40%, 눈 안 가림) | 발 오버레이, 버리지 않음 | 가장 높은 결정의 심 |
| 쌍날 / spin | `spin`: 손잡이 없는 종이 초승 날 둘. 45°씩 4장 × 16fps = 초당 2바퀴. `spin-end`(0.15초) | zone r60, `rim.ally`, 0.75R 종이 호 둘(70°, 초당 2바퀴, 감소 모션에서 멈춤) | 날 심 |
| 핀 우박 / caltrop | `caltrop-a/b/c`: K9 단검 핀 2~3개가 땅에 박혀 크게 기욺. 그림자 rx 18은 조각 안 | 테·채움 없음, center pick J(1950) | 한 핀의 날 홈 |
| 연막 꼬리 / smoke | `puff-a/b/c`: 밝은 ink300 덩이 + 낮은 ink500 심 + p300 컬. 크기 제각각 | wash ink300 α0.16, `rim.ally`, disc 2~4 | 테 |
| 묘침 / grave | `grave-a/b/c`: 둥근 머리 종이 비석판 핀(글자·십자 없음). `grave-rise`(0.15초) | stand 층, 테 없음, 그림자 rx 21은 조각 안 | 핀대에 감은 실 |
| 추적 인장 / triangle | `sealCorner`(대기 0.6초), `sealStrike`(0.28초) 네모 인영. 안쪽 네모 없음 | 대기: 바느질 변이 모서리에서 모서리로 자람. 터짐: 굵은 변 + 채움 p50 α0.25 0.1초 | 매듭, 실 끝, 변 |
| 사냥꾼 표식 / prey | `mark-prey`: 구멍 뚫린 종이 패가 끈 고리에서 ±9° 흔들림(4fps) | (0, top − 12) | 끈 고리 |
| 까마귀 깃 / crow | `crow`: 먹 까마귀, 날개 종이 획, 눈 없음, 6장. `peck` | 맴돌기 rx 14 ry 5 0.9초. 쪼기 0.12초에 머리로 내려옴. 감소 모션에서는 (6, top − 6)에 앉음 | 다리 실 |
| 먹번개 / pillar | `pillar-start` → `pillar`(loop 12) → `pillar-end`. 좁은 먹 기둥(칠한 폭 ≤ 14) + 먹구름 | zone r40, `rim.ally`, stand 층 | 기둥 심 |
| 붓 폭우 / surge | 새 그림 없음 | 커진 사건 반경으로 고리와 자국 s/m/l | (주 단계) |
| 족자 낙하 / unroll | `roller`: 띠 머리 가운데의 말린 종이 + 걸이 끈 | 빔 틀. 종이 띠 ±w(판정) α0.5, 곧은 가장자리, 산 능선, 머리 축봉 [[ink,6],[p50,3.4]], 0.2초에 펼침 | 걸이 끈 |
| 일곱째 인장 / eighth | `seal8`(인장 1.55배, 0번 장 flash), `print8`(rx 32 겹 테 인영) | 대기 0.3초: 그림자 타원 rx 18→64 + 일곱 인영에서 오는 바느질. 터짐: wash p50 α0.2 + 무거운 고리 r120(틈 2) | 인면 테, 고리 |
| 침묵의 종 / silence | `mark-silence`: 무기의 종이 손종, 입을 청록 실로 동여맴 | 머리 표식, 자수정 없음 | 실 |
| 먹단지 / fire | `flame-a/b`(먹 불길 6장), `scorch12~54`(발 앞 불길) | wash ink α0.24, `rim.ally`, disc 2~5. 안에 선 적에게 `scorch`(산호 물듦 대신) | 불길 몸·심 |
| 타르 항아리 / gather | `string-a/b`(테에서 가운데로 조이는 타르 줄), `jarBroken`(착탄 항아리 0.5배) | wash ink700 α0.32, 윤기 호 둘, `rim.ally`, ring 5~7개, dr −6 | 봉인 끈 |
| 유성 붓 / mark | `mote-a/b`(종이 별가루, cycle 1.2초) + 바닥 `crater` | wash p50 α0.14, `rim.pad` 실선(결이 안에 있으면 `inside`) | 테 |
| 일식 테 / total | `corona-a/b`(찢긴 종이 깃) + 리본 | 원판 먹 α0.2 + 0.62R~R 먹 α0.22 + 바깥 테 [[ink,4],[p50,2]]. 검은 원판이 아니라 반투명 | 리본 |

- 물건 꼴은 K9 아이콘과 같습니다(C15). 예외는 까마귀 깃 하나입니다: K9 아이콘은 깃이고 기믹 물건은 까마귀입니다.
- 각성 변화: 기믹은 각성에서만 나오므로 평상·각성 변형이 없습니다.

### 3. C 검사 출력 원문

마지막 상태에서 다시 돌렸습니다.

**C1** `k10-c1-all-d3a3`
```
ok   k10-c1-all-d3a3
```

**C2** `k10-c2-parts-d3a2`: 첫 줄과 새 줄 44개입니다. 나머지 68줄은 2차 수정 1회차와 같습니다(제한 parts 해시가 같음).
```
frames=280 ok boxArea=522964 ok badParts=0
frostNeedles/freeze-back-12 f1 idx box36x20 a18,10 feet none feet info r12 w:status
frostNeedles/freeze-back-19 f1 idx box48x24 a24,12 feet none feet info r19 w:status
frostNeedles/freeze-back-28 f1 idx box64x30 a32,15 feet none feet info r28 w:status
frostNeedles/freeze-front-12 f1 idx box32x24 a16,20 feet none front info r12 w:status
frostNeedles/freeze-front-19 f1 idx box44x30 a22,25 feet none front info r19 w:status
frostNeedles/freeze-front-28 f1 idx box60x38 a30,32 feet none front info r28 w:status
twinBlades/spin f4 loop@16 still0 box40x40 a20,20 center none ally info w:zone
twinBlades/spin-end f2 prog 0.15s box40x40 a20,20 center none ally info w:zone-end
pinHail/caltrop-a f1 idx box44x26 a22,17 center none ground info w:variant
pinHail/caltrop-b f1 idx box44x26 a22,17 center none ground info w:variant
pinHail/caltrop-c f1 idx box44x26 a22,17 center none ground info w:variant
smokeTail/puff-a f4 loop@6 still0 box40x28 a20,24 disc none ground info w:zone
smokeTail/puff-b f4 loop@6 still0 box40x28 a20,24 disc none ground info w:zone
smokeTail/puff-c f4 loop@6 still0 box40x28 a20,24 disc none ground info w:zone
gravePins/grave-a f1 idx box48x36 a24,27 center none stand info w:variant
gravePins/grave-b f1 idx box48x36 a24,27 center none stand info w:variant
gravePins/grave-c f1 idx box48x36 a24,27 center none stand info w:variant
gravePins/grave-rise f2 prog 0.15s box48x36 a24,27 center none stand info w:zone-start
trackingSeals/sealCorner f3 prog 0.6s box26x20 a13,10 point none ally info w:pending
trackingSeals/sealStrike f3 prog 0.28s box48x40 a24,22 center none ally info w:event
huntersMarks/mark-prey f2 loop@4 still0 box22x24 a11,22 over none head info w:status
crowFeathers/crow f6 loop@12 still0 box26x18 a13,9 orbit face head info w:status
crowFeathers/peck f2 prog 0.12s box16x16 a8,8 orbit none head deco w:event
inkLightning/pillar-start f2 prog 0.12s box32x84 a16,78 center none stand info w:zone-start
inkLightning/pillar f4 loop@12 still0 box32x84 a16,78 center none stand info w:zone
inkLightning/pillar-end f2 prog 0.2s box32x84 a16,78 center none stand info w:zone-end
fallingScroll/roller f2 loop@12 still0 box36x24 a18,12 tip beam ally info w:beam
seventhSeal/seal8 f4 prog 0.45s box60x80 a30,74 center none ally info flash w:mark
seventhSeal/print8 f1 idx 1.2s box88x36 a44,18 center none ground deco w:decal
silenceBell/mark-silence f1 idx box22x22 a11,20 over none head info w:status
inkPots/flame-a f6 loop@12 still0 box22x28 a11,25 disc none ground info w:zone
inkPots/flame-b f6 loop@12 still0 box22x28 a11,25 disc none ground info w:zone
inkPots/scorch12 f2 loop@8 still0 box30x18 a15,14 feet none front info r12 w:status
inkPots/scorch19 f2 loop@8 still0 box40x22 a20,17 feet none front info r19 w:status
inkPots/scorch28 f2 loop@8 still0 box56x26 a28,21 feet none front info r28 w:status
inkPots/scorch38 f2 loop@8 still0 box72x30 a36,25 feet none front info r38 w:status
inkPots/scorch54 f2 loop@8 still0 box96x34 a48,29 feet none front info r54 w:status
tarJar/string-a f4 loop@8 still1 box40x14 a36,7 ring radial ground info w:zone
tarJar/string-b f4 loop@8 still1 box40x14 a36,7 ring radial ground info w:zone
tarJar/jarBroken f1 idx box36x26 a18,18 center none ground info w:variant
meteorBrush/mote-a f4 cycle 1.2s box10x14 a5,12 disc none ally deco w:zone
meteorBrush/mote-b f4 cycle 1.2s box10x14 a5,12 disc none ally deco w:zone
eclipseHalo/corona-a f2 prog 0.3s box26x14 a3,7 ring radial ally deco w:mark
eclipseHalo/corona-b f2 prog 0.3s box26x14 a3,7 ring radial ally deco w:mark
```

**C5** P1 판
```
ok   k10-c5-gimmicks-p1-d3a2            (PRI 1, 17칸, 맥락, 1배)
ok   k10-c5-gimmicks-p1-blind-gray      (BLIND·GRAY)
```

**C6** `k10-c6-scan-d3a3`
```
calls=376 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```

**C7** `k10-c7-geometry-d3a3`
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```

**C8** `k10-c8-unchanged-d3a2`
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 n4n4y2/2117692 -> n4n4y2/2117692 same | k11 bvf9fj/934797 -> bvf9fj/934797 same | fixed set same
PN keys same: C,_hk,_ki,arsenal,arsenalFx,bombers,bossesA,bossesB,bossesC,characters,defs,enemies,env,fieldBosses,halftone,hazards,heroKit,icons,rng,skillVfx,speedLines,splat,story,taper,tapers,vfx
arsenalFx calls: 366
```

**C9** `k10-c9-vectors-d3a2`(지시서 원문 명령): 69줄입니다.
- 기믹 사례 7개가 아래 줄을 냅니다. 2차까지 이 일곱 사례는 `layout []` 한 줄씩이었습니다.
- 나머지 줄과 lob 네 줄은 그대로입니다.
- 2차 납품서의 75줄은 검수 1차가 더한 사례 셋(11줄)이 든 명령이고, 그 명령으로는 3a가 80줄입니다.
```
L25 inkPots/fire layout [["flame-b",-36.25,23.97,0,0,0,0.86,0],["flame-a",20.56,-21.35,0,0,1,0.62,2],["flame-b",-35.76,-39.55,0,0,1,0.09,2]]
L26 tarJar/gather layout [["jarBroken",0,0,0,0,0,0,0],["string-b",41.93,-99.53,-1.17,0,0,0.7,0],["string-b",107.97,-2.6,-0.02,0,0,0.16,0],["string-a",79.4,73.21,0.74,0,0,0.92,0],["string-b",23.2,105.48,1.35,0,0,0.39,2]]
L27   [["string-a",-95.8,49.86,2.66,0,0,0.85,2],["string-b",-107.09,-13.96,3.27,0,0,0.61,2],["string-b",-31.21,-103.39,4.42,0,0,0.08,2]]
L28 smokeTail/smoke layout [["puff-a",48.78,-21.47,0,0,1,0.39,0],["puff-c",-15.68,-43.56,0,0,0,0.15,2],["puff-b",12.94,20.39,0,0,0,0.62,2]]
L29 meteorBrush/mark layout [["mote-b",56.63,-61.84,0,0,1,0.32,0],["mote-b",-35.86,62.41,0,0,0,0.79,0],["mote-a",26.76,17.94,0,0,1,0.55,0]]
L30 twinBlades/spin layout [["spin",0,0,0,0,0,0,0]]
L31 twinBlades/spin path arcs [[115.92,185.92],[295.92,5.92]]
L35 eclipseHalo/total layout [["corona-a",110.54,-203.97,-1.07,0,0,0.79,0],["corona-b",186.44,-138.08,-0.64,0,0,0.56,0],["corona-b",222.45,65.88,0.29,0,0,0.02,0],["corona-b",149.73,177.21,0.87,0,0,0.49,0],["corona-a",-51.49,226.21,1.79,0,0,0.25,0]]
L36   [["corona-a",-142.34,183.21,2.23,0,0,0.71,0],["corona-b",-219.56,74.95,2.81,0,0,0.47,0],["corona-a",-191.95,-130.31,3.74,0,0,0.94,0],["corona-b",-88.86,-214.31,4.32,0,0,0.4,0],["ribbon-b",-222.41,58.6,4.45,0,0,0.63,0]]
L63 fallingScroll/unroll layout [["roller",177.58,0,0,0,0,0,0]]
L64 fallingScroll/unroll path ridge [[14.4,9],[23.4,5.76],[32.4,2.75],[41.4,0.16],[50.4,-1.83],[59.4,-3.07],[68.4,-3.5],[77.4,-3.07],[86.4,-1.83],[95.4,0.16],[104.4,2.75],[113.4,5.76]]
L65 fallingScroll/unroll path head [[177.58,0]]
```

**C10** `k10-c10-contrast-d3a`: 첫 줄과 새 9줄입니다. 앞 15줄은 2차 값 그대로입니다. 채움 SPEC은 그 뒤 바뀌지 않았습니다.
```
fills=24 fail=0 (persistent over 0.3 s: Y max 0.62; brief: Y max 0.69; hero coat Y 0.902, contrast min 1.25)
smokeTail.smoke (ink300 a0.16, 2s): ch1 0.385 ch2 0.385 ch3 0.406 ch4 0.394 ch5 0.359 | coat 2.09:1 ok
inkPots.fire (ink a0.24, 2s): ch1 0.246 ch2 0.246 ch3 0.260 ch4 0.252 ch5 0.228 | coat 3.07:1 ok
tarJar.gather (ink700 a0.32, 1.5s): ch1 0.244 ch2 0.244 ch3 0.257 ch4 0.250 ch5 0.228 | coat 3.10:1 ok
meteorBrush.mark (p50 a0.14, 4s): ch1 0.482 ch2 0.482 ch3 0.506 ch4 0.493 ch5 0.451 | coat 1.71:1 ok
seventhSeal.eighth (p50 a0.2, 0.3s): ch1 0.511 ch2 0.511 ch3 0.534 ch4 0.521 ch5 0.481 | coat 1.63:1 ok
seventhSeal.shadow (ink a0.12, 0.3s): ch1 0.325 ch2 0.326 ch3 0.345 ch4 0.334 ch5 0.300 | coat 2.41:1 ok
trackingSeals.fill (p50 a0.25, 0.1s): ch1 0.535 ch2 0.536 ch3 0.558 ch4 0.545 ch5 0.507 | coat 1.56:1 ok
fallingScroll.unroll (p50 a0.5, 0.28s): ch1 0.670 ch2 0.671 ch3 0.688 ch4 0.678 ch5 0.649 | coat 1.29:1 ok
eclipseHalo.total (ink a0.2, 0.3s): ch1 0.271 ch2 0.271 ch3 0.287 ch4 0.278 ch5 0.251 | coat 2.82:1 ok
```

**C12·C13·C14·C15**
```
ok   k10-c12-scene                ok   k10-c12-scene-gray-x08
ok   k10-c13-marks-d3a            ok   k10-c13-marks-gray-d3a      ok   k10-c13-marks-x4-ch1
ok   k10-c14-pairs-gray           ok   k10-c14-pairs-deutan        ok   k10-c14-pairs-protan
ok   k10-c15-pairs-d3a
```
- C12·C13·C14·C15의 그린 결과는 그 뒤 바뀐 코드의 영향을 받지 않습니다. 오버레이 기본 출력이 같고, 그 명령들의 나이에는 땅 조각 처음·끝 장이 없으며, LOD는 full입니다.

**C3·C4·C11**
- 주 단계·비행이 바뀌지 않아 다시 돌리지 않았습니다(제한 보존 해시가 같음).
- 새 조각은 3배 확대 판 `k10d3-p1-parts-x3`로 봤습니다.

### 4. 직접 본 렌더

위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`

| 배율 | 렌더 |
|---|---|
| 1배 | `k10-c5-gimmicks-p1-d3a2`, `k10d3-zones-x1`, `k10d3-gimmicks-x1`, `k10-c12-scene`, `k10-c13-marks-d3a` |
| 0.8배 + 흑백 | `k10-c12-scene-gray-x08` |
| 흑백·색각 | `k10-c5-gimmicks-p1-blind-gray`, `k10-c13-marks-gray-d3a`, `k10-c14-pairs-gray`·`-deutan`·`-protan` |
| 확대 | `k10d3-p1-parts-x3`(새 조각 전부 3배), `k10-c13-marks-x4-ch1`(4배), `k10d3-crow-peck-layers`(3배), `k10d3-crow-peck-x5`(5배), `k10d3-freeze-ctx-x4`(4배), `k10d3-zone-ends-lod`(2배: 묘비·기둥·회전 날의 처음·끝 장, 별똥 자국·일식·여덟째 인장 full/reduced/minimal) |
| 대조 | `k10d3-k9-p1-icons`, `k10d3-k9-objs-x3`(K9 아이콘 기준), `k10-c15-pairs-d3a` |
| 박스 수정 확인 | `k10d3-bbox`, `k10d3-bbox2` |

### 5. 자가 판정 T1~T7

**T1~T3**: 주 단계 그림을 바꾸지 않아 해당이 없습니다(제한 draw 해시가 같음).

**T4 기믹(C5)**
- §4.1 표만 보고 17종 모두 짝을 지을 수 있다고 판단합니다. 다만 저는 답을 알고 있어 진짜 블라인드 시험은 아닙니다.
- 가장 약한 쌍
  - 사냥감 패 대 침묵 손종: 둘 다 16~18px 종이 표식입니다. 실루엣(사각 패 + 고리 / 종 돔)으로 갈립니다.
  - 마름쇠 대 묘비: 기운 핀 2~3개 / 둥근 머리 핀 하나로 갈립니다.
  - 거세지는 폭우: 정지 한 장으로는 '커진다'가 안 보입니다. 시간이 지나며 고리가 커지는 것으로만 읽힙니다.
- 땅 조각 셋(연막·불먹·끈끈이)은 모두 점선 테라서, 안의 내용(밝은 덩이 / 먹 불길 / 줄 + 항아리)과 명도로 갈립니다.

**T5 표식(C13, 1배·4배·흑백)**
- 다섯 표식은 서로 갈리고, 먹귀 눈을 가리지 않습니다(동결 앞 서릿발은 몸 높이의 약 40%).
- 약점 1: 흑백 1배에서 불먹 `scorch`는 다리와 붙어 작게 보입니다. 청록 심이 회색이 되기 때문입니다. 색에서는 또렷합니다.
- 약점 2: 3장 사수 먹귀가 새 꼴이라 까마귀와 같은 칸에 있으면 겹쳐 보일 수 있습니다. 크기(까마귀 약 18px)와 머리 위 맴돌기로 갈립니다.

**T6 혼잡(C12, 1배·0.8배·흑백)**
- 적 탄과 호박 예고는 그대로 읽힙니다. K10 채움은 결보다 밝지 않습니다(C10 coat ≥ 1.29).
- 오른쪽 덩어리는 명령이 각성 일곱째 인장을 일곱 번 시전해 인장 약 70개가 겹친 것이라 과합니다. 게임에서는 한 번에 한 시전입니다.
- 종이 인장 몸이 결과 같은 명도인 것은 1차에 받아들여진 주 단계 그림입니다.

**T7 아군 대 적 지형(C14, 흑백·deutan·protan)**
- 일곱 쌍 모두 점선 청록 테 대 실선 색·먹 테로, 그리고 무늬(불길 수, 해칭, 물결, 균열)로 갈립니다.
- 별똥 자국(실선 청록 이중 테 + 분화구)과 골분 박격 예고(큰 망점 원판 + 바느질)도 갈립니다.

### 6. 메인 세션 등록값

**굽기**
- `KIT_FILES`·`PACKS 'arsenal-fx'` 등록은 그대로입니다. 커밋한 HEAD 스냅숏에서 굽습니다.
- 새 키 107장: `afx/<group>/<part>/<frame>`. 새 그룹은 frostNeedles, twinBlades, pinHail, smokeTail, gravePins, trackingSeals, huntersMarks, crowFeathers입니다.
- 기존 173장은 바뀌지 않았습니다(stamps `nvezmq/535352`).

**애니메이션**

| 종류 | 조각 |
|---|---|
| loop fps | spin 16, puff 6, mark-prey 4, crow 12, pillar 12, roller 12, flame 12, scorch 8, string 8 |
| still | 모두 0. string만 1 |
| cycle(새 drive, fps 없음) | mote-a/b 1.2초 |
| prog 초 | spin-end 0.15, grave-rise 0.15, sealCorner 0.6(pending), sealStrike 0.28, peck 0.12, pillar-start 0.12, pillar-end 0.2, seal8 0.45(flash), corona 0.3 |
| idx | freeze-back/front, caltrop, grave, print8(데칼 1.2초), mark-silence, jarBroken |

**매니페스트**
- 실어야 할 SPEC 키: `zone`·`gimmick`·`overlay`. `layout`의 기믹 단계와 `fills` 9줄은 이미 그 안에 있습니다.
- parts 읽기가 받아야 할 새 값
  - drive: `cycle`
  - window: `zone`, `zone-start`, `zone-end`, `status`, `event`, `variant`
  - place: `disc`, `over`, `orbit`, `feet`
  - rotate: `face`
- vectors = C9 69줄.

**렌더러**: API §14.3~§14.8을 따릅니다.
- 층
  - 땅 조각: 위험지형 층 맨 앞
  - `stand` 조각(묘비·기둥): bodies에서 발 y로 정렬
  - 오버레이: `feet` = groundMarks, `front` = 그 적 몸 바로 뒤, `head` = overheads
- 테는 수명 내내 α 1입니다. 나머지는 0.15초 들어오고 0.3초 나갑니다. 가운데 물건의 start·end 조각은 α 1입니다.
- 상한·우선순위: `caps`(heads·feet 24/16/8, crows 12/8/4, events 16/10/4, zoneStamps 120/72/36, pending 12, perZone)와 `priority.heads/feet/drop/keep`.
- 별똥 자국이 선 착탄은 `crater` 데칼을 따로 그리지 않습니다.
- `zone.*.shadow`는 조각 안 그림자의 기록값이라 따로 그리지 않습니다.

**엔진·표시 계층**(지시서 §9-3, 그림 전용)
- `awk.freeze`를 더하고, 동결이면 백묵 분필 고리 대신 K10 동결을 그립니다.
- 여덟째 인장 `pending`(무게중심 + 일곱 사건 자리, 0.3초).
- `crowAt`: 쪼기 시각(`overlay` `peck`).
- zones에 무기 id·반경·born·수명·seed를 둡니다.
- 불먹은 `enemy.burn`을 켜지 않습니다. 렌더러가 조각 안의 적에게 `scorch<r>`를 그립니다.
- 적 침묵은 청록입니다(자수정 없음).
- 삼각 봉인: BeamEffect(skillId trackingSeals) 폭 2 = 대기, 8 = 터짐.
- 족자: BeamEffect(skillId fallingScroll)가 폭 100 먹 막대를 대신합니다.
- 개기일식: skillMark heavy.

**버전**: `SPEC.version` `1.0-d3a`. P2 키는 없습니다.

### 7. 보존 해시 결과

**제한 측정** `k10-keep-all-d3a3`(검수 4차 §3 식에서 이번에 더한 것만 뺌)

| 항목 | 값 | 2차 수정 1회차와 |
|---|---|---|
| stamps | `nvezmq len=535352` | 같음 |
| draw | `16q45bq len=4419724` | 같음 |
| spec | `ej7o5i len=13529` | 같음 |
| parts | `9on297 len=13871` | 같음 |

뺀 것
- 조각: 새 그룹 8개, 그리고 기존 그룹 끝의 part `/^(pillar|roller|seal8|print8|mark-silence|flame-|scorch\d|string-|jarBroken|mote-|corona-)/`
- 단계: 기믹 17개
- SPEC: `version`, `zone`, `gimmick`, `overlay`, `fills` 새 9줄, `layout`의 새 id와 기믹 단계

**아무것도 빼지 않은 원문 측정**(3차 2회의 보존 기준)

| 항목 | 값 |
|---|---|
| stamps | `1g0md21/704665` |
| draw | `1m88g03/5467013` |
| spec | `146lftr/17916` |
| parts | `qe5odc/22955` |

### 8. 사람 클린업

- 서리 결정·얼음판의 면
- 회전 날의 붓 외곽
- 마름쇠 핀: 1배 약 13px에서 작은 사람으로 읽히지 않게
- 연기 덩이의 붓 질감과 컬
- 묘비 핀
- 네모 인영의 찍힘
- 표식 셋(손종·패·까마귀): 16~18px 1배 픽셀 다듬기
- 번개 기둥, 말린 족자, 큰 인장과 큰 인영
- 먹 불길과 발밑 불길, 타르 줄, 깨진 항아리, 별가루, 코로나 깃
- 문화 검토: 묘비(십자·비문 없음), 까마귀(불길한 상징이 아니게), 손종(범종 아님)

### 9. 지시서와 다르게 한 것 (API §12-63~78)

1. **P1만 납품**(`1.0-d3a`). 까마귀 깃은 K9 아이콘(깃)과 기믹 물건(까마귀)이 다른 물건이라 C15 같은 꼴 대조가 성립하지 않습니다. **판단 요청 ①**: 이대로 받을지.
2. **새 SPEC 키**: 지시서의 `halo.eclipseTotal`·`line.edges`·`line.unroll` 이름 대신 `SPEC.zone`·`gimmick`·`overlay`에 넣었습니다. 보존 해시를 '더한 키만 빼기'로 재기 위해서입니다. 배치는 `SPEC.layout[id][stage]`에 넣었습니다.
3. **단계 이름**: §7.2 명령의 이름을 썼고, 없는 것은 freeze, triangle, prey, crow, surge, silence로 정했습니다.
4. **disc minGap**: minGap × 조각 반경 R로 읽었습니다.
5. **기믹 ring prim**: 각이 늘 바깥(+x)을 봅니다(dr −6인 타르 줄).
6. **묘비 그림자 rx 21**(지시서 22): 박스 48×36 안의 최대입니다.
7. **삼각 봉인 인영에 안쪽 네모 없음**: 네모 안 네모가 한자 '回'로 읽혔습니다.
8. **시안을 고친 셋**
   - 마름쇠: 똑바로 선 핀이 작은 사람으로 읽혀 크게 기울이고 깊이를 엇갈렸습니다.
   - 연막: 짙은 덩이가 바위로 읽혀 밝은 덩이로 바꿨습니다.
   - 작은 땅 조각의 맥락 적: 조각을 가려서 옆에 두었습니다.
9. **족자**: 띠 반폭 = 판정 폭입니다. 폭 전체를 가로지르는 축봉은 SPEC이고, `roller` 조각(36×24)은 그 가운데 부분입니다.
10. **여덟째 인장 고리에 틈 둘**: 고른 닫힌 고리가 'O'로 읽히는 것을 피했습니다.
11. **개기일식**: 바닥이 비치는 반투명 원판 + 0.62R~R 띠입니다. 검은 태양 원판으로 그리지 않았습니다. **판단 요청 ②**: 이 읽힘이 맞는지.
12. **거세지는 폭우**: 새 그림이 없습니다. 참고 합성만 R × 1·1.2·1.4·1.6으로 넷을 그립니다.
13. **오버레이 `layer` 옵션과 까마귀 쪼기 규칙**(추가)
    - `opts.peck`과 `SPEC.overlay.crow.dive` {crow [7, −5], peck [0, −1]}로 정했습니다.
    - 기본 출력은 예전과 같습니다.
    - 지시서에 없던 fade 둘을 SPEC에 적었습니다: 삼각 봉인 터짐 변 at 0.6, 족자 at 0.75.
14. **땅 조각 처음·끝 조각은 α 1**: 지시서 §4.2의 α 0→1을 겹치면 묘비가 솟고 기둥이 내리치는 첫 장이 거의 안 보였습니다. reduced LOD에서는 deco 조각(별가루·코로나·바느질)도 하나 건너 하나 뺍니다. **판단 요청 ③**: 이 해석을 받을지.
15. `mini`는 2차 값(18×20, 4장)을 그대로 둡니다. 지시서 §4.4의 16×18·2장은 2차에서 이미 정리했습니다.

### 10. 알려진 한계

- P2와 남은 오버레이(공포·헤맴·약화·얼룩·균열·꽃가루·서리 수·묶임·가시)는 3차 2회입니다.
- 참고 합성은 게임과 다른 근사입니다: 맥락 적의 자리, 여덟째 인장의 일곱 자리, 참고 삼각형. 실제 화면은 `test:visual`에서 봐야 합니다.
- 정식 판독 시험(n ≥ 8), 성능, 팩 페이지·바이트는 메인 세션 몫입니다.

## K10 검수 5차: 3차 1회 납품(각성 기믹 P1 17종, `1.0-d3a`), art-director, 2026-10-19

**판정: 수정 후 합격.**
- 고칠 것은 둘입니다. 나머지 P1 그림, SPEC, 조각 표는 그대로 받습니다.
  - **F1** 불먹 발밑 불길 `scorch<r>`를 다시 그립니다(그림).
  - **F2** 땅 조각 가운데 물건의 페이드 규칙을 고칩니다(코드·API만).
- kit-artist가 F1·F2를 `1.0-d3a-r1`로 냅니다. F1은 그림 판정이라 제가 렌더 넷만 보는 짧은 확인(검수 6차)을 합니다. F2와 해시는 메인 세션 확인으로 충분합니다. 그다음 굽습니다.
- 결정 셋
  - ① 까마귀 C15 예외: 받습니다.
  - ② 반투명 개기일식: 받습니다. 조건은 층과 섬광 감소, 둘입니다.
  - ③ 처음·끝 조각 α 1: 받습니다. 다만 F2를 함께 고쳐야 그 사이가 이어집니다.
- 검수 4차 §5-4의 test:visual 네 항목은 모두 괜찮습니다.
  - 검수 중에 착탄 반전의 부호가 뒤집혔다고 의심했습니다.
  - `scripts/visual-gate.mjs:554-556`을 읽어 보니 AFX3 장면의 붓은 왼쪽으로 던진 것이었습니다. 그래서 반전이 맞고, 의심은 철회합니다.

### 1. 확인한 것

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r5-*.png`

| 검사 | 결과 |
|---|---|
| 제한 보존 해시(이번에 더한 것만 뺌) | stamps `nvezmq/535352`, draw `16q45bq/4419724`, spec `ej7o5i/13529`, parts `9on297/13871`. 2차 수정 1회차와 같습니다 |
| 원문 해시(`k10-keep-3a-r1`) | `1g0md21/704665`, `1m88g03/5467013`, `146lftr/17916`, `qe5odc/22955`. 납품서와 같습니다 |
| C2 | `frames=280 ok boxArea=522964 ok badParts=0` |
| C6 | `calls=376`, 모두 0 |
| C7 | 1~4줄 0건, 5줄 ok |
| C8 | 고정 값, k9·k11 전후 값, PN 키 모두 같습니다. `arsenalFx calls: 366` |
| C9(`k10r5-c9-vectors`) | 69줄. 기믹 일곱 사례 줄(L25~31, L35~36, L63~65)이 납품서 원문과 같습니다 |
| C10 | `fills=24 fail=0` |
| C5 P1 1배(`k10r5-c5-p1`) | §4.1 표만 보고 17종 모두 짝을 지었습니다. 이름표 판이라 블라인드는 아닙니다 |
| C12 흑백 0.8배(`k10r5-c12-gray-x08`) | `ok` |
| C13 1배·4배·흑백(`k10r5-marks-x1-x4`, `-x1-gray`, `k10r5-marks-vs-elite`) | 손종·패·까마귀는 서로 갈리고 정예 3구슬 관과도 갈립니다. 흑백에서 무너지는 것은 발밑 불길뿐입니다(F1) |
| C14 흑백(`k10r5-c14-gray`) | `ok`. 일곱 쌍 모두 테(점선 청록 / 실선)와 무늬로 갈립니다 |
| C15 | 작가 렌더 `k10-c15-pairs-d3a`와 제 `k10r5-crow-vs-k9`, `k10r5-crow-frames-x8` |
| 그 밖에 직접 본 렌더 | `k10r5-total-vs-blacksun`, `k10r5-total-game`, `k10r5-zone-end-pop`, `k10d3-zone-ends-lod`, `k10r5-smoke-check`, `k10r5-grave-vs-marks`, `k10r5-caltrop-grave`, `k10r5-scorch-flame-x6`, `k10r5-meteor-dir` |
| test:visual | `.../r5-k10wire/visual/actual/1440x900-dpr1-full-arsenal-lob.png`, `-land.png`, `-crowd.png`, `1024x720-dpr2-full-arsenal-lob.png` |

- C12 장면에서 본 것
  - 결, 적 탄, 호박 예고가 그대로 읽힙니다.
  - 마름쇠 24개와 묘비 12개가 '같은 단추 줄'이 되지 않습니다.
  - 오른쪽 인장 덩어리가 과한 것은 명령이 일곱째 인장을 일곱 번 시전한 탓입니다. 납품서 T6에 동의합니다.
- `k10r5-total-vs-blacksun`의 `--check` 실패는 제 식 탓입니다. 바닥을 두 번 넣어 `ev0_*` id가 겹쳤습니다. 킷 출력과는 무관하고, `draw('eclipseHalo','total')`은 id를 쓰지 않습니다.

### 2. 결정

**① 까마귀 깃의 C15: 받습니다.**
- K9 아이콘은 깃이고 기믹 물건은 까마귀라, 같은 꼴 대조가 성립하지 않습니다.
- 대신 문체를 대조했고, 맞습니다.
  - 까마귀 날개 가장자리의 종이 획이 K9 깃의 종이 깃대 획과 같은 말입니다.
  - 청록은 지시서 §4.3(`docs/art/briefs/arsenal-fx.md:897`)이 정한 대로 다리 실 하나입니다.
- 날갯짓 6장은 8배 렌더에서 위(0장)에서 아래(3장)까지 실제로 움직입니다.
- 더 다듬을 것은 R1(권장)입니다.

**② 반투명 개기일식: 받습니다.**
- 근거
  - 검은 원판으로 그리면 지시서 §2.7이 금지한 '검은 원반 + 코로나(검은 태양)'(`:702`)가 됩니다.
  - inner 0이라 결을 덮어 P1(§1.7 `:300`)도 깨집니다.
  - 지금 꼴은 sweep의 초승 그림자가 한 바퀴를 다 덮은 '닫힌 초승'으로 읽힙니다. 핵심 blackSun(작은 검은 원판, 소용돌이 팔, 청록 큰 고리)과는 크기·채움·꼴이 모두 다르고, 흑백에서도 갈립니다(`k10r5-total-vs-blacksun`).
  - 1배에서 띠 안의 1·5장 적은 흰 테두리로 읽힙니다. 결은 가장 밝습니다(`k10r5-total-game`).
  - 코로나 깃은 1배에서 작은 가시 정도로만 보입니다. 그래서 검은 태양 쪽으로 기울지 않고, deco로 둡니다.
- **조건 (가) 층**
  - 원판(inner 0)과 띠(0.62R~R)는 몸 아래 바닥 층에 그립니다. halo wash와 같은 쪽입니다(inkOrbit `(inner..R, ground)` `:670`).
  - 바깥 테, 각성 가는 선, 코로나, 리본은 allyAttacks 층입니다.
  - 지름 약 550px(1280×720 높이의 약 77%)의 먹 채움이 결과 적 위에 올라가면 안 됩니다.
- **조건 (나) 섬광 감소**
  - 섬광 감소 설정에서 원판·띠 α에 0.5를 곱합니다.
  - 이 원판은 0.3초 동안 화면 넓이의 약 26%를 페이드 인 없이 어둡게 하는 맥동입니다. 지시서 §1.4 `flash` 규칙(`:207`)의 취지를 여기까지 넓힙니다.
  - 렌더러는 3a를 연결할 때 이 규칙을 넣습니다. 킷은 3차 2회 때 SPEC에 기록합니다(§5-1).

**③ 땅 조각 처음·끝 조각 α 1: 받습니다. 단, F2를 함께 고칩니다.**
- `grave-rise`, `pillar-start`/`-end`, `spin-end`는 물건이 나오고 사라지는 그림 자체입니다. α 0→1을 겹치면 첫 장이 안 보입니다(`k10d3-zone-ends-lod`). 받습니다.
- 테는 수명 내내 α 1입니다(V4). wash와 나머지 조각은 α(a)를 받습니다. reduced에서 deco를 하나 건너 하나 빼는 것은 지시서 §5.2와 같습니다.
- 다만 지금 규칙은 그 물건의 loop 장에도 페이드를 곱해서, 처음·끝 조각과 이어지지 않습니다(F2).

**납품서 §5 약점 판정**
- **사냥감 패 대 침묵 손종: 갈립니다.**
  - 패는 네모에 위쪽 청록 고리, 손종은 돔에 아래쪽 청록 띠입니다. 흑백 1배에서도 실루엣과 청록의 자리(위·아래)로 갈립니다. 받습니다.
- **마름쇠 대 묘비: 갈립니다.** 기운 고리 핀 2~3개 대 선 흰 머리 핀 하나입니다.
  - 묘비 머리(흰 둥근 판)는 1배에서 '삽날·팻말'로도 읽힙니다.
  - 군중 속에서는 침묵 손종의 흰 돔과도 실루엣이 가깝습니다(`k10r5-grave-vs-marks`, C12 흑백). 땅 그림자와 핀대로 갈리니 받습니다.
  - 머리 다듬기는 R2(사람 클린업)입니다.
- **흑백 1배 발밑 불길: 받지 않습니다(F1).**
- **3장 사수 대 까마귀: 갈립니다.** 크기(약 40px 대 18px)와 자리(땅에 섬 / 머리 위를 맴돎)가 다릅니다. 받습니다. 실제 군중 판독은 미확인입니다.
- **거세지는 폭우: 받습니다.** 지시서 §4.1의 P1 정의(`:782`, 고리와 자국이 반경을 따라 커짐) 그대로입니다. 정지 한 장으로는 커지는 것이 안 보이는 것은 시간축의 한계입니다.

**test:visual(검수 4차 §5-4)**
- **단지 대 픽업: 갈립니다.**
  - 먹단지는 먹 뚜껑을 쓴 흰 단지이고 청록 끈이 있습니다. 송이 단지 셋은 땅 그림자가 떨어져 있습니다.
  - 동전(어두운 ◎)과 xp 옥(연두 마름모)과 갈립니다(`1440x900-dpr1-full-arsenal-lob.png`).
- **타르 항아리 대 박격 옹기: 갈립니다.** 기운 검은 항아리에 청록 띠, 대 바로 선 달걀꼴에 흰 천 뚜껑입니다.
- **올라가는 유성 붓: 괜찮습니다.**
  - 갈라진 먹 붓끝이 앞이고, 마른 먹 꼬리와 청록 심이 뒤입니다(`1024x720-dpr2-full-arsenal-lob.png`).
  - '머리부터 던진 붓'으로 읽힙니다. 로켓이나 횃불로 읽히지 않습니다.
- **왼쪽 착지 반전: 맞습니다.**
  - 왼쪽으로 던진 붓의 착탄은 자루가 오른쪽 위를 향합니다(`-land.png`).
  - 킷의 `dir:-1`(`k10r5-meteor-dir`)과 같습니다.

### 3. 고칠 것 (kit-artist, `k-arsenal-fx.js`와 `API-arsenal-fx.md`만)

**F1. 불먹 발밑 불길 `scorch12/19/28/38/54`를 다시 그립니다** (`art/concept-kit/k-arsenal-fx.js:2102-2112`)

문제(렌더로 확인):
- **같은 꼴을 고른 간격으로 한 줄에 세웠습니다.**
  - `scorchArt`는 같은 폭(max(3, 0.42hm))의 혀 하나짜리 불길 3~7개를 `lerp(-0.78hw, 0.78hw, (i+0.5)/n)` 간격으로 세웁니다.
  - 지시서 §6 '혀 하나짜리 불길을 흩기'(`:1045`)와 §1.7 '같은 기호 셋 이상을 한 줄로'(`:314`)에 걸립니다.
  - 1배에서 고른 원뿔 줄이 이빨이나 가시로 읽힙니다. 3장 가시 도마뱀에서는 다리 가시처럼 보입니다(`k10r5-marks-vs-elite` 3·4줄).
- **청록 위에 allyG·종이 심이 없습니다.**
  - §1.7 '먹 ≥ 2 + 청록 + allyG 또는 종이 심'(`:297`) 위반입니다.
  - 그래서 흑백에서 청록이 중간 회색이 되어 다리와 붙습니다(`k10r5-scorch-flame-x6` 아래 줄).
- **먹 테가 얇습니다.** 혀 폭 4의 0.24, 약 1.0px로, '적에 붙는 표식 외곽 1.2~1.6'(`:308`)보다 얇습니다.

처방: 땅 조각 불길 `flameArt`(`:2092-2100`)와 같은 문체의 **덩이** 1~3개로 바꿉니다.
- **덩이 배치**
  - `SCORCH`를 덩이 목록 `[x, s, 혀 수]`로 바꿉니다.
  - 높이 H = hm·s이고, hm은 지금 값(9.5, 12, 15, 18, 21) 그대로입니다.
  - 아래 표의 값이나 같은 성질의 값을 씁니다. 간격과 크기가 고르지 않아야 합니다.

  | 등급 | 덩이 |
  |---|---|
  | 12 | [−1, 1, 3] |
  | 19 | [−5, 1, 3], [7, 0.72, 2] |
  | 28 | [−8, 1, 3], [10, 0.76, 2] |
  | 38 | [−19, 0.8, 2], [−1, 1, 3], [17, 0.64, 2] |
  | 54 | [−30, 0.86, 3], [1, 1, 3], [29, 0.68, 2] |

- **한 덩이를 그리는 법**
  - 혀 배치는 `FLAMES['flame-a']`(혀 셋), `['flame-b']`(혀 둘)를 H/18로 줄인 것입니다.
  - 칠 순서는 `flameArt`와 같습니다.
    1. 혀 전부와 바닥 타원(rx = 덩이 반폭 + 1, ry 1.4)을 **한 경로**로 먹 칠합니다.
    2. 안쪽 혀(0.7h, 0.52w)를 청록으로 칠합니다.
    3. 가장 큰 혀에 allyG 심(0.42h, 0.3w, 칠한 폭 1.4 이상)을 둡니다.
    4. 박스 −3과 rect 안에 들어갈 때만, 가장 큰 덩이 끝 옆에 종이 불티 점 하나(r 0.75, 먹 0.45)를 둡니다. 12 등급은 넣지 않습니다.
  - 큰 혀 폭은 5 이상, 곁 혀는 3.4 이상입니다. 먹 테는 가장 넓은 곳에서 1.2 이상 보여야 합니다.
  - 혀 끝은 `tongueD`의 lean으로 굽힙니다. 곧은 삼각형(원뿔)으로 그리지 않습니다.
- **두 장(8fps)의 차이**
  - 큰 혀: sway +1.0, 높이 ×0.95
  - 곁 혀: sway −0.7, 높이 ×1.05
  - 전체를 같은 배율로 키웠다 줄이지 않습니다.
- **바꾸지 않을 것**
  - 다섯 조각의 box, anchor, 2장, loop 8, still 0, place feet, layer front, r, window(C2 다섯 줄 그대로)
  - `SPEC.marks.rects` 안(C7 2줄 0건)
  - 토큰(C6 0건). 산호·호박은 0입니다.

합격 기준:
- **6배 확대**
  - 그릴 것: `scorch12~54` 두 장씩 + `flame-a/b` 0번 장, 1장 바닥, 위는 색·아래는 흑백
  - 등급마다 크기와 간격이 다른 덩이 1~3개가 있습니다.
  - 따로 선 같은 혀가 셋 이상 한 줄로 놓이지 않습니다.
  - 흑백에서 덩이마다 가장 밝은 심이 보입니다.
- **1배**
  - 그릴 것: C13(색·흑백, 1·3·5장)과 `draw('inkPots','fire',{context:true, ch:1/3/5})`
  - '발밑 먹 불길'로 읽히고, 땅 조각 `flame-a/b`와 같은 물건으로 보입니다.
  - 동결 서릿발(흰 각기둥)과 적의 다리 가시와 갈립니다.
- C2·C6·C7 그대로이고, `--check` ok입니다.
- 보존 해시(아래 명령)
  - 그대로여야 하는 값
    - `stamps without inkPots/scorch*=15xeu33/676866`
    - `spec=146lftr/17916`
    - `parts=qe5odc/22955`
    - `overlays without scorch=m2dsj8/82965`
  - raw stamps만 바뀝니다.
  - 기본 draw(맥락 없음)에는 scorch가 들어 있지 않습니다. 직접 확인했습니다(`k10r5-scorch-in-draw`).

**F2. 땅 조각 가운데 물건의 loop 페이드** (`k-arsenal-fx.js:3071-3075`, `API-arsenal-fx.md:831`)

문제(`k10r5-zone-end-pop`에서 확인):
- start·end 조각은 α 1인데, 그 사이의 가운데 loop 장은 `zoneAlpha`를 곱합니다(`:3075`, `a: own ? 1 : A`).
- **회전 베기**: 날이 나이 0.2초부터 옅어져 0.345초에 α 약 0.5가 됩니다. 그러다 0.355초에 `spin-end`가 α 1로 다시 진해집니다. 매번 끝에서 깜빡입니다.
- **번개 기둥**
  - 처음: `pillar-start`가 0.12초에 끝나면 loop가 α 0.8로 시작해 0.15초에 1로 돌아옵니다.
  - 끝: α 0.67까지 옅어진 기둥 뒤에 `pillar-end`가 α 1로 옵니다.

처방:
- 가운데(center) 항목의 loop·idx 장 α = min(Z.start ? 1 : fadeIn(a), Z.end ? 1 : fadeOut(a))로 바꿉니다. 처음·끝 조각이 있는 쪽의 페이드는 그 조각이 맡습니다.
- 다른 땅 조각은 이렇게 됩니다.
  - 묘비(start만 있음): 끝 0.3초 페이드가 그대로 남습니다.
  - 마름쇠·항아리(둘 다 없음): 지금과 같습니다.
  - floor, wash, gloss, arcs, disc·ring 조각: 지금처럼 α(a)입니다.
  - 테: α 1입니다.
- SPEC 값은 바꾸지 않습니다. 규칙은 Z.start·Z.end가 있는지로 정해집니다.
- API §14.3 '조각 장'과 §12-77에 이 규칙을 적습니다.

합격 기준:
- **나이 훑기**(칸 간격을 넉넉히)
  - 번개 기둥 a 0.06/0.11/0.13/0.15/0.84/0.95/0.98/1.00/1.03/1.14: loop가 a 0.12~1.0 내내 α 1입니다.
  - 회전 베기 a 0.10/0.20/0.30/0.345/0.355/0.40/0.475: 날이 0.15초부터 `spin-end`까지 α 1입니다.
  - 묘비 a 2.6/2.8/2.95: 지금처럼 끝 0.3초에 옅어집니다.
- 보존 해시: `draw without inkLightning/pillar, twinBlades/spin=c3gfpf/5397061`이 그대로입니다. raw draw만 바뀝니다.

**F1·F2 보존 해시 명령**

현재 3a에서 돌린 결과: `stamps raw=1g0md21/704665 | without inkPots/scorch*=15xeu33/676866`, `draw raw=1m88g03/5467013 | without …=c3gfpf/5397061`, `spec=146lftr/17916 parts=qe5odc/22955 overlays without scorch=m2dsj8/82965`.

```
node scripts/art-review-sheet.mjs expr --name k10-keep-3a-r1 --scale 1 --crop 0,0,1700,140 --expr '(function(){var X=PN.arsenalFx;function norm(m){return String(m).replace(/\bkaf\d+_/g,"kaf_");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36)+"/"+s.length;}var A="",A2="",B="",B2="",O="",skip={"inkLightning/pillar":1,"twinBlades/spin":1};X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++){var m=norm(X.stamp(g,p.part,{frame:f}));A+=m;if(!(g==="inkPots"&&/^scorch\d/.test(p.part)))A2+=m;}});});X.ids.forEach(function(id){(X.META[id].stages||[]).forEach(function(st){[false,true].forEach(function(aw){[1,5].forEach(function(lv){[0.1,0.5,0.9].forEach(function(p){var m=norm(X.draw(id,st,{level:lv,awakened:aw,p:p,t:p*0.3,seed:7}));B+=m;if(!skip[id+"/"+st])B2+=m;});});});});});X.overlays.forEach(function(k){if(k==="scorch")return;[12,19,28,38,54].forEach(function(r){[0,0.3].forEach(function(t){O+=norm(X.overlay(k,{r:r,top:-30,t:t}));});});});var S=JSON.parse(JSON.stringify(X.SPEC));delete S.version;var L=["stamps raw="+h(A)+" | without inkPots/scorch*="+h(A2),"draw raw="+h(B)+" | without inkLightning/pillar, twinBlades/spin="+h(B2),"spec="+h(JSON.stringify(S))+" parts="+h(JSON.stringify(X.groups.map(function(g){return X.parts(g);})))+" overlays without scorch="+h(O)];return "<rect width=\"1700\" height=\"140\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(24+i*26)+"\" font-size=\"12\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

- SPEC 해시를 지키려면 `SPEC.version`을 지운 상태로 잽니다. 이 식은 이미 그렇게 합니다.
- F1·F2 뒤의 원문 넷(stamps, draw, spec, parts)이 3차 2회의 보존 기준입니다. 납품서에 적어 주세요.

**권장(3차 2회나 사람 클린업에서)**
- **R1 까마귀**
  - 날개를 든 장과 수평인 장에서 날개 끝에 첫째 깃 3~4개를 벌립니다. 꼴은 K9 깃(뾰족한 먹 깃 + 종이 깃대 획)입니다.
  - 부리를 조금 굵고 길게 해서 '작은 새'가 아닌 까마귀로 읽히게 합니다.
  - 눈 없음, 장 수, 박스는 그대로입니다. 청록을 깃에 더하지 않습니다(다리 실 하나).
- **R2 묘비 머리**(사람 클린업)
  - 너비가 높이 이상인 비석판으로 바꾸고, 위는 낮은 아치로 합니다. p300 옆면으로 두께를 보입니다.
  - 1배에서 삽날이나 손종 돔과 갈리게 합니다.
- **R3 API §1 문장**(`API-arsenal-fx.md:28`)
  - '의존 없음' 뒤에 다음을 더합니다: "참고 합성 `context: true`만 `PN.enemies`·`PN.heroKit`을 읽는다(§14.9). `stamp`와 기본 `draw`는 의존 없음."
  - §12-75와 맞춥니다.

### 4. 지시서와 다르게 한 것 63~78 판정

| # | 판정 |
|---|---|
| 63 P1 먼저, 까마귀 C15 | 수용(결정 ①) |
| 64 `SPEC.zone`·`gimmick`·`overlay` | 수용. P2도 같은 세 키 아래 새 하위 키로 넣습니다(§5-1). 지시서 이름은 정정합니다(§7) |
| 65 단계 이름 | 수용 |
| 66 disc minGap × R | 수용 |
| 67 기믹 ring은 +x가 바깥 | 수용. 1차 ring 코드를 건드리지 않은 것도 맞습니다 |
| 68 묘비 그림자 rx 21 | 수용. 아래 설명 |
| 69 삼각 봉인 인영에 안쪽 네모 없음 | 수용(§1.7 글자 '回') |
| 70 시안 고친 셋 | 수용. 기운 핀은 1배에서 사람으로 읽히지 않고, 밝힌 연기는 작은 회색 구름으로 읽힙니다 |
| 71 족자 띠 = 판정 폭 | 수용(V4) |
| 72 여덟째 인장 고리 틈 둘 | 수용 |
| 73 개기일식 반투명 | 수용(결정 ②, 조건 둘) |
| 74 거세지는 폭우 새 그림 없음 | 수용 |
| 75 참고 합성 맥락 | 수용. API §1 문장만 고칩니다(R3) |
| 76 overlay `layer`, 까마귀 쪼기, fade 둘 | 수용. 렌더러 값을 SPEC에 둔 것이 맞습니다 |
| 77 처음·끝 α 1, reduced deco 절반 | 수용(결정 ③) + F2 |
| 78 version | 수용. 수정판은 `1.0-d3a-r1`입니다 |
| (납품서 15) `mini` 18×20·4장 | 수용(2차에서 정함). 지시서 §4.4는 정정합니다 |

- **68 묘비 그림자**
  - 지시서 §1.3(`:173`)에서 이 그림자는 판정 원의 납작한 암시(ry 0.42)이지 판정 외곽선이 아닙니다.
  - 그래서 1단위 차이와, 확인한 중심 올림(묘비 y −2.9, 마름쇠 −1.6, `:1918`, `:1951`)은 판독에 영향이 없습니다.
- **70 연기 덩이 아래 먹 점**
  - ink500 심 원이 조약돌처럼 보이는 것은 사람 클린업으로 넘깁니다(API §13에 이미 '연기 덩이의 붓 질감'이 있음).

### 5. 3차 2회(P2)에 맞출 것

1. **보존 기준과 SPEC 자리**
   - 보존 기준은 3a-r1 원문 넷이고, '그 납품이 더한 것만 빼고 잰다' 규칙도 그대로입니다.
   - 새 SPEC은 모두 `SPEC.gimmick`(사건 고리·선·띠)과 `SPEC.overlay`(표식·발 오버레이) 아래 새 하위 키로 넣습니다.
   - 기존 `ring`·`line`·`halo`·`caps`·`marks`·`priority` 값은 건드리지 않습니다. `priority`에는 P2 이름이 이미 있습니다.
   - 결정 ②도 이때 `SPEC.gimmick.eclipseHalo`의 새 키로 적습니다. 예: `layers {wash:'ground', band:'ground', outer:'ally'}`, `reducedFlash 0.5`.
2. **예산**
   - 남은 것: 100장, 117,036
   - 지시서 §4.2~§4.4의 P2 조각을 표대로 그리면 약 71장, 72,856입니다(제 합산).
     - 표식·발 오버레이: 36장, 26,416
     - 이어지는 효과 + `caltrop-snap`: 35장, 46,440
   - P3(wisp, bounce)는 +5장, 2,948입니다.
3. **모양 규칙(3a에서 배운 것)**
   - 혀 하나, 결정 하나를 흩지 않습니다. 같은 꼴 셋 이상을 한 줄로 두지 않습니다(가시, 얼룩 방울, 포자, 균열선).
   - 청록 위에는 늘 allyG나 종이 심을 둡니다. 흑백 1배에서 그 심이 보여야 합니다.
   - **발 오버레이**: 동결, 서리 1·2, 묶임, 불먹, 가시, 얼음판(rime)이 흑백 1배에서 서로 갈려야 합니다.
     - 서리 2: 몸 높이 25% 이하, 얼음판은 없거나 얇게. 동결과 갈리게 합니다.
     - 가시: 굽은 장미 가시 2~3개(먹 + 종이 가장자리, 한 가시에 청록 심). 곧은 원뿔은 금지입니다.
     - 묶임: 청록 실 고리 + 3a 묘비 문체의 작은 핀
   - **머리 표식**(공포, 약화, 얼룩 1~3, 균열 1~5, 헤맴)
     - 칠한 크기 16~18, 외곽 1.2~1.6입니다.
     - 손종 돔, 패(네모 + 고리), 정예 3구슬 관, 기절 점, 폭탄병 불꽃, xp 옥, 동전과 실루엣이 달라야 합니다.
     - 얼룩 3은 가장자리 방울과 종이 테로, 18px 검은 원판이 되지 않게 합니다.
   - **사건 고리**(r70, r50, r90, r160, 꽃가루 r50, 1.4R)
     - 중심선은 정확히 R입니다(V4).
     - 고른 닫힌 고리는 금지입니다(틈, 찢김, 꺾음을 둠). 청록은 1/3 이하입니다.
   - 큰 채움을 더하면 층과 섬광 감소 여부를 SPEC에 함께 적습니다. 렌더러가 추측하지 않게 하려는 것입니다.
   - `haste`: y −34~−11 안(C7 2줄 hero)
   - `deflect`: 판정 r 7(K9 §4.2). 먹알 + 종이 점(적 탄)으로 읽히지 않게 합니다.
4. **확인**
   - C5: PRI 2, 이름표 판과 BLIND 판, 1배·흑백. T4 90% 이상
   - C13: P1·P2 오버레이 전부, 1배·4배·흑백. 정예와 기절 점 대조 칸을 넣습니다
   - C12: P2 표식이 든 군중
   - C2, C6~C10, 보존 해시
5. **API**: §14를 P2까지 넓히고, R3 문장과 §13 클린업 목록을 갱신합니다.

### 6. 메인 세션 굽기·등록 주의

1. **순서**
   1. F1·F2(`1.0-d3a-r1`)
   2. 검수 6차(F1 렌더 넷), F2와 해시는 메인 세션 확인
   3. 커밋한 HEAD 스냅숏에서 `npm run build:atlas`
2. **팩**
   - `arsenal-fx`가 173장에서 280장이 됩니다. 새 키 107개 `afx/<group>/<part>/<frame>`, 새 그룹 8개입니다.
   - 박스 합은 522,964입니다.
   - 2048² 1장(최대 2장)이 기대값입니다. 페이지와 바이트는 `npm run bench:packs`로 잽니다.
3. **매니페스트**
   - SPEC: `zone`, `gimmick`, `overlay`
   - drive: `cycle`
   - window: `zone`, `zone-start`, `zone-end`, `status`, `event`, `variant`, `pending`
   - place: `disc`, `over`, `orbit`, `feet`
   - rotate: `face`
   - 검증 벡터: C9 69줄
4. **땅 조각 α**
   - 테: α 1, 수명 내내
   - wash, gloss, floor, arcs, 나머지 조각: α(a)
   - start·end 조각: α 1, 그리고 F2 규칙
   - end 조각은 수명 끝의 `seconds` 안에서 재생합니다. 수명 뒤로 넘기지 않습니다(V4).
5. **개기일식(결정 ②)**
   - 원판·띠는 몸 아래 바닥 층, 테·선·코로나·리본은 allyAttacks 층입니다.
   - 결 위에 먹을 칠하지 않습니다. 플레이어 가림 x-ray 판정(`scripts/visual-gate.mjs:298-303`)도 건드리지 않게 됩니다.
   - 섬광 감소에서 원판·띠 α × 0.5입니다.
   - 지금 렌더러가 sweep의 wash와 초승을 어느 층에 그리는지는 보지 못했습니다(미확인).
6. **오버레이 층**
   - feet(groundMarks): `freeze-back`
   - front(그 적 몸 바로 뒤): `freeze-front`, `scorch`
   - head(overheads): 손종, 패, 까마귀, 쪼기
   - 머리 표식은 (0, 실제 스프라이트 top − 12)에 하나만 둡니다(`priority.heads`). 까마귀는 `caps.crows`로 따로 셉니다.
7. **상한**
   - `caps`: heads·feet 24/16/8, crows 12/8/4, events 16/10/4, zoneStamps 120/72/36, pending 12
   - `priority.drop`·`keep`. 동결은 버리지 않습니다.
8. **엔진·표시**(납품서 §6 그대로)
   - `awk.freeze`: 백묵 분필 고리 대신 그립니다.
   - 여덟째 인장 `pending` 0.3초
   - `crowAt` → `overlay` `peck`
   - zones 필드
   - 불먹은 `enemy.burn`을 켜지 않고 `scorch`를 그립니다.
   - 침묵은 청록입니다(자수정 없음).
   - 삼각 봉인: BeamEffect 폭 2 → 8
   - 족자: BeamEffect가 폭 100 먹 막대를 대신합니다.
   - 개기일식: skillMark heavy
9. **그리지 않을 것**
   - `zone.*.shadow`: 조각 안에 이미 있습니다.
   - 별똥 자국 자리의 `crater` 데칼: 두 겹이 됩니다.
   - 조각 늘이기
10. **3a 연결 뒤 test:visual에 더할 장면(제안)**
    - (a) 불먹 지대 안의 적 셋 이상
    - (b) 4장 바닥 위 마름쇠 24 + 묘비 12, 손종 표식을 단 적을 곁에
    - (c) 침묵·사냥감·까마귀 표식 + 정예 + 기절 적이 섞인 군중
    - (d) 개기일식 순간, 1024x720, flash 모드 포함
    - (e) 삼각 봉인 대기·터짐, 족자, 여덟째 인장
    - (f) 번개 기둥·회전 베기의 끝 장면(F2)

### 7. 지시서 정정 (`docs/art/briefs/arsenal-fx.md`, 메인 세션)

- **§4.1**
  - `:777` `line.edges` → `SPEC.gimmick.trackingSeals`
  - `:783` `line.unroll` → `SPEC.gimmick.fallingScroll`
  - `:802` `halo.eclipseTotal` → `SPEC.gimmick.eclipseHalo`(반투명 원판 + 0.62R~R 띠, 검은 원반 아님, 층과 섬광 감소는 검수 5차 결정 ②)
- **§4.2 `:824`**: 다음을 더합니다. "가운데 물건의 zone-start·zone-end 조각은 α 1. 그 물건의 loop 장은 처음·끝 조각이 있는 쪽 페이드를 받지 않는다(검수 5차 ③·F2)."
- **§4.2 `:839`**: 묘비 그림자 rx 22 → 21. 판정 반경 22(`:173`, 자료)는 그대로입니다.
- **§4.3 `:906`**: 다음을 더합니다. "발밑 불길은 땅 조각 flame 문체의 덩이 1~3개(혀 2~3개를 합침, allyG 심). 혀 하나를 줄 세우지 않는다."
- **§4.4 `:928`**: `mini` 16×18·2장 → 18×20·4장
- **§1.4 `:207`**: `flash`에 다음을 더합니다. "섬광 감소는 개기일식 원판·띠 α에도 × 0.5(검수 5차)."

### 8. 미확인

- 3a 기믹은 아직 게임에 연결되지 않았습니다. 그래서 보지 못한 것:
  - 실제 크기, 층, 상한, LOD
  - 까마귀 대 3장 사수, 묘비 대 손종의 군중 판독
  - 개기일식 순간의 결 명도, 섬광 감소의 체감
  - 거세지는 폭우가 실제로 커지는 모습
- 지금 렌더러가 halo wash와 초승을 그리는 층
- C1·C3·C4·C11은 다시 돌리지 않았습니다. 주 단계와 비행이 그대로인 것은 제한 해시로 확인했습니다.
- 정식 판독 시험(n ≥ 8), 렌더 비용(K10 몫 ≤ 0.4/0.6ms), 팩 페이지·바이트
- F1·F2 결과(검수 6차와 메인 세션 확인에서 봅니다)

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js` (`:2088-2112` 불길·발밑 불길, `:3045` zoneAlpha, `:3054-3077` drawZone, `:1913-1961` 마름쇠·묘비)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md` (`:28` §1, `:691-706` §12-63~78, `:823-838` §14.3, `:856-858` §14.4 개기일식)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md` (`:207`, `:297`, `:308`, `:314`, `:670`, `:702`, `:777-802`, `:821-841`, `:880`, `:906`, `:928`, `:1045`)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md` (3차 납품서 `:2305-2665`)
- `/Users/kyuukkang/CT_AX/07.playground/scripts/visual-gate.mjs` (`:554-563` AFX3 왼쪽 던지기, `:298-303` x-ray)
- 렌더: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r5-*.png`, `k10-keep-3a-r1.png`
- 캡처: `/private/tmp/claude-501/-Users-kyuukkang-CT-AX-07-playground/75a03af2-1f67-4f99-b38d-99223a69768e/scratchpad/r5-k10wire/visual/actual/`

## K10 3차 1회 수정 납품서

**대상**: 검수 5차 F1·F2·R3 · `SPEC.version` `1.0-d3a-r1`

kit-artist, 2026-10-19. 고친 파일은 `k-arsenal-fx.js`와 `API-arsenal-fx.md` 둘뿐입니다.

**결과**
- 합격 기준을 모두 맞췄습니다.
  - `k10-keep-3a-r1`에서 그대로여야 하는 다섯 값이 3a와 같습니다. 바뀐 것은 raw stamps·raw draw뿐입니다.
  - C2·C6·C7은 그대로이고, 렌더 `--check`는 모두 ok입니다.
  - F2 나이 훑기는 세 무기 모두 기준대로입니다.
- 검수서와 다르게 한 것은 둘입니다(§12-79).
  - **38 등급 가운데 덩이 x를 −1에서 −2로**: 표대로면 덩이 중심 간격이 18·18로 같아집니다. 지금은 17·19입니다.
  - **곁 혀의 청록 폭을 줄임**: 안쪽 혀 폭을 min(0.52w, w − 2.4 − 0.24·|lean|)로 정했습니다. 0.52w만 쓰면 곁 혀(폭 3.4)의 먹 테가 0.82가 되어 1.2를 밑돕니다.

### 1. 바뀐 곳(줄)

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`**

| 무엇 | 줄 |
|---|---|
| 머리 주석(R3): 의존 문장 | `:17-18` |
| `SPEC.version` `'1.0-d3a-r1'` | `:391` |
| F1 불길 단락 주석 | `:2087-2089` |
| F1 `SCORCH_HM`, `SCORCH`(덩이 표), `SCORCH_LEAN`, 새 `scorchArt(fr, rc, P)`, 등록 `(fr, c, P) => scorchArt(fr, rc, P)` | `:2104-2143` |
| F2 `drawZone` 주석 | `:3082-3085` |
| F2 가운데 물건의 loop·idx α 규칙 | `:3107-3110` |
| 버전 주석 | `:3229` |

F2 규칙(코드 원문):
```js
const a = own ? 1 : it.prim === 'center' ? Math.min(Z.start ? 1 : clamp(age / SPEC.zone.fadeIn, 0, 1), Z.end ? 1 : clamp((life - age) / SPEC.zone.fadeOut, 0, 1)) : A;
```

**바꾸지 않은 것**
- SPEC 값(`spec=146lftr/17916`)
- 조각 표(`parts=qe5odc/22955`). 다섯 scorch의 박스·앵커·2장·loop 8·still 0·feet·front·r·window가 그대로입니다.
- `marks.rects`, 토큰

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`**

| 무엇 | 줄 |
|---|---|
| 머리말 v1.0-d3a-r1 | `:1` |
| 납품 표 '3차 1회 수정(3a-r1)' 줄 | `:16` |
| §1 R3 문장(검수서 문구 그대로) | `:29` |
| §3 version 주석 | |
| §11 3a-r1 결과 | `:616-621` |
| §12-77 F2 규칙(하위 항목) | `:714` |
| §12-79 F1 결정 | `:719` |
| §12-80 version | `:720` |
| §13 클린업 한 줄 | |
| §14.2 먹단지 줄: 덩이 표와 칠 순서 | |
| §14.3 '조각 장': F2 규칙, end 조각은 수명 안 | |

**F1 그림**
- 덩이마다 `flame-a`(혀 셋)·`flame-b`(혀 둘)를 H/18로 줄였습니다(H = hm·배율).
- 큰 혀 폭은 5 이상, 곁 혀는 3.4 이상입니다.
- 칠 순서는 `flameArt`와 같습니다.
  1. 혀 전부 + 덩이마다 바닥 타원((x, −1), rx 반폭 + 1, ry 1.4)을 먹 한 경로로
  2. 안쪽 혀(0.7h, min(0.52w, w − 2.4 − 0.24·|lean|))를 청록으로
  3. 덩이마다 큰 혀에 allyG 심(0.42h, max(1.4, 0.3w))
  4. 19~54 등급만: 가장 큰 덩이의 큰 혀 끝 옆 (+2.1, +1.2)에 종이 불티 r 0.75(먹 0.45). 박스 − 3과 rect 안일 때만 그리고, 다섯 등급 중 19~54는 모두 들어갑니다.
- 큰 혀 끝은 덩이마다 lean(+0.5, −0.6, +0.4) × H/18로 굽혔습니다.
- 1번 장: 큰 혀 sway +1·높이 ×0.95, 곁 혀 sway −0.7·높이 ×1.05입니다.

### 2. 검사 출력 원문

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 명령은 모두 단일 `node scripts/art-review-sheet.mjs …`로 돌렸습니다.

**보존 해시**: 검수서 명령 `k10-keep-3a-r1` 그대로입니다.
```
stamps raw=mwewtb/715817 | without inkPots/scorch*=15xeu33/676866
draw raw=7vot8j/5466897 | without inkLightning/pillar, twinBlades/spin=c3gfpf/5397061
spec=146lftr/17916 parts=qe5odc/22955 overlays without scorch=m2dsj8/82965
```
그대로여야 하는 다섯 값(`15xeu33/676866`, `c3gfpf/5397061`, `146lftr/17916`, `qe5odc/22955`, `m2dsj8/82965`)이 모두 같습니다.

**원문 넷(3차 2회 보존 기준)**: 검수 4차 `k10-keep-all` 명령 그대로입니다(`k10-keep-all-3a-r1`). 글자는 코드로 확인했습니다.
```
k10-keep-all-stamps=mwewtb len=715817 codes=109,119,101,119,116,98
k10-keep-all-draw=7vot8j len=5466897 codes=55,118,111,116,56,106
k10-keep-all-spec=146lftr len=17916 | parts=qe5odc len=22955
```

**C2** `k10-c2-parts-3a-r1`: 첫 줄과 scorch 다섯 줄입니다.
```
frames=280 ok boxArea=522964 ok badParts=0
inkPots/scorch12 f2 loop@8 still0 box30x18 a15,14 feet none front info r12 w:status
inkPots/scorch19 f2 loop@8 still0 box40x22 a20,17 feet none front info r19 w:status
inkPots/scorch28 f2 loop@8 still0 box56x26 a28,21 feet none front info r28 w:status
inkPots/scorch38 f2 loop@8 still0 box72x30 a36,25 feet none front info r38 w:status
inkPots/scorch54 f2 loop@8 still0 box96x34 a48,29 feet none front info r54 w:status
```

**C6** `k10-c6-scan-3a-r1`
```
calls=376 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```

**C7** `k10-c7-geometry-3a-r1`: 새 scorch는 박스 − 3과 발 rect 안입니다.
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```

**C1** `k10-c1-all-3a-r1`
```
ok   k10-c1-all-3a-r1
```

**F2 나이 훑기** `k10r5f2-age-sweep-alpha`: 가운데 물건의 α는 draw 출력의 opacity에서 읽었습니다.
```
inkLightning/pillar (life 1.2):  a0.06 pillar-start alpha 1;  a0.11 pillar-start alpha 1;  a0.13 loop alpha 1;  a0.15 loop alpha 1;  a0.84 loop alpha 1;  a0.95 loop alpha 1;  a0.98 loop alpha 1;  a1 loop alpha 1;  a1.03 pillar-end alpha 1;  a1.14 pillar-end alpha 1;
twinBlades/spin (life 0.5):  a0.1 loop alpha 0.67;  a0.2 loop alpha 1;  a0.3 loop alpha 1;  a0.345 loop alpha 1;  a0.355 spin-end alpha 1;  a0.4 spin-end alpha 1;  a0.475 spin-end alpha 1;
gravePins/grave (life 3):  a2.6 loop alpha 1;  a2.8 loop alpha 0.67;  a2.95 loop alpha 0.17;
```
- 'loop' 표시는 처음·끝 조각 사이라는 뜻입니다. 묘비는 idx 장입니다.
- 번개 기둥: a 0.12~1.0 내내 α 1입니다.
- 회전 베기: 처음 조각이 없어 0.15초까지만 페이드하고, 그 뒤 `spin-end`까지 α 1입니다.
- 묘비: 끝 0.3초에 옅어집니다.
- 그림으로 본 판 `k10r5f2-age-sweep`(2배, `--check` ok): 테는 수명 내내 α 1이고, 회전 베기 호는 α(a)로 옅어집니다.

### 3. 렌더 경로(검수 6차용 넷)

모두 `--check` ok입니다.

| 렌더 | 경로 |
|---|---|
| 6배: scorch12~54 두 장씩 + `flame-a/b` 0번 장, 1장 바닥, 위 색·아래 흑백 | `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r5f1-scorch-x6.png` |
| 1배 C13 색(다섯 장, 1·3·5장 포함) | `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r5f1-c13-x1.png` |
| 1배 C13 흑백 | `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r5f1-c13-x1-gray.png` |
| 1배 `draw('inkPots','fire',{context:true, ch:1/3/5})`, 위 색·아래 흑백 | `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r5f1-fire-ctx-x1.png` |

직접 본 것
- 6배: 등급마다 크기와 간격이 다른 덩이 1~3개입니다. 따로 선 같은 혀가 한 줄로 서지 않습니다. 흑백에서 덩이마다 allyG 심이 가장 밝게 보입니다.
- 1배 맥락: 발밑 불길이 땅 조각 `flame-a/b`와 같은 물건으로 보입니다.
- 흑백 C13: 동결의 흰 각기둥과 꼴로 갈립니다.

### 4. 알려진 한계

- **12 등급은 덩이 하나뿐입니다**(1배 약 10px). 흑백 1배에서 보이지만 작습니다. 박스 30×18을 바꾸지 않는 조건 안의 최대입니다.
- **곁 혀의 청록이 가늡니다**: 위 청록 폭 규칙 때문에 곁 혀(폭 3.4)의 청록이 약 0.8~1.0으로, `flame-a/b`의 곁 혀보다 가늡니다. 0.52w로 되돌릴지는 검수 6차에서 정해 주십시오.
- **3차 2회로 넘긴 것**
  - R1 까마귀 첫째 깃·부리
  - 결정 ②의 SPEC 기록(층, 섬광 감소 0.5)
- R2 묘비 머리는 사람 클린업입니다.
- 실제 게임 화면(층·상한·LOD), 정식 판독 시험, 성능은 확인하지 않았습니다.

## K10 검수 6차: 3차 1회 수정(`1.0-d3a-r1`), art-director, 2026-10-19

**판정: 합격. 굽기 판은 `1.0-d3a-r1`로 확정합니다.** 발밑 불길(F1)과 땅 조각 페이드(F2) 모두 합격 기준을 맞췄습니다.

**F1 발밑 불길**: 렌더 넷과 제가 따로 그린 1배 렌더(`k10r6-scorch-x1`, 1·3·5장 × 색·흑백 × 네 역할)로 봤습니다.
- **6배**
  - 덩이 수는 12 등급 1개, 19·28 등급 2개, 38·54 등급 3개이고, 덩이마다 크기와 간격이 다릅니다.
  - 따로 선 같은 혀가 한 줄로 서는 곳이 없습니다.
  - 흑백에서 덩이마다 allyG 심이 가장 밝습니다.
- **1배**
  - 발밑 불길이 '먹 불길'로 읽히고, 땅 조각 `flame-a/b`와 같은 물건으로 보입니다.
  - 흑백에서는 이빨처럼 고른 줄이 사라지고, 밝은 심이 든 불길 덩이로 읽힙니다.
  - 동결의 흰 각기둥, 3장 가시 도마뱀의 다리와 갈립니다. 눈을 가리지 않습니다.
- 12 등급은 덩이 하나(1배 약 10px)라 작지만, 흑백 1배에서도 심이 보입니다. 박스 30×18 안에서 가장 큰 크기라 받습니다.

**F2 땅 조각 페이드**: 제 나이 렌더(`k10r6-zone-ages`, 2배)로 봤습니다.
- 번개 기둥은 a 0.11~1.0 동안 진하기가 그대로입니다.
- 회전 베기 날은 a 0.2~0.4 동안 진하기가 그대로이고, `spin-end`로 넘어갈 때 튀지 않습니다.
- 납품서 §2 수치와 같습니다.

**보존 해시**: `k10-keep-3a-r1`을 다시 돌렸습니다(`k10r6-keep-3a-r1`).
- 그대로여야 하는 다섯 값이 같습니다.
- 바뀐 값은 raw stamps `mwewtb/715817`, raw draw `7vot8j/5466897`이고, version은 `1.0-d3a-r1`입니다.
- C2·C6·C7은 납품서 원문을 받아들입니다. parts 해시 `qe5odc/22955`가 그대로라 scorch 다섯 줄도 같습니다.

**결정(API §12-79)**
1. **38 등급 가운데 덩이 x −2(간격 17·19): 받습니다.** 검수서 표가 노린 것이 고르지 않은 간격이었고, 그 뜻에 맞습니다.
2. **곁 혀 청록 폭 min(0.52w, w − 2.4 − 0.24·|lean|): 그대로 둡니다.** 0.52w로 되돌리지 않습니다.
   - 근거는 지시서 §1.7의 '적에 붙는 표식 외곽 1.2~1.6'(`docs/art/briefs/arsenal-fx.md:308`)입니다.
   - 0.52w로 되돌리면 곁 혀의 먹 테가 0.82가 됩니다. 발밑 불길은 front 층이라 적의 검은 발 위에 얹히는데, 그 테로는 1배에서 곁 혀가 발과 붙습니다.
   - 청록 몸과 allyG 심은 큰 혀가 맡습니다. 1배 색에서 덩이는 청록 불길로 읽힙니다. 곁 혀가 어두운 것은 오히려 혀 실루엣에 변화를 줍니다.
   - 청록을 더 원하면 곁 혀 폭을 4.4 이상으로 넓히면 됩니다. 그러면 0.52w 청록과 1.2 테를 함께 지킬 수 있습니다. 이것은 킷 수정이 아니라 사람 클린업 몫으로 둡니다.

**남는 것**
- **메인 세션**
  - 굽기·등록은 검수 5차 §6 그대로입니다: HEAD 스냅숏에서 `npm run build:atlas`, 280장, 박스 합 522,964.
  - F2 규칙(납품서 §1의 코드 원문)을 렌더러에 옮깁니다. end 조각은 수명 안에서 재생합니다.
  - 개기일식은 결정 ②대로 원판·띠를 몸 아래에 두고, 섬광 감소에서 α × 0.5입니다.
  - test:visual에 (a)~(f) 장면을 더합니다.
  - 지시서 정정(검수 5차 §7)도 메인 세션 몫입니다.
- **3차 2회(P2) 보존 기준**
  - 원문 넷: stamps `mwewtb/715817`, draw `7vot8j/5466897`, spec `146lftr/17916`, parts `qe5odc/22955`. 검수 4차 `k10-keep-all` 식으로 잽니다.
  - 함께 할 것:
    - R1 까마귀 첫째 깃·부리
    - 결정 ②의 SPEC 기록(층, `reducedFlash` 0.5)
    - 검수 5차 §5 목록
- **사람 클린업**
  - R2 묘비 머리
  - 곁 혀 청록(위 결정 2)
  - 연기 덩이 아래 먹 점
  - API §13 목록
- **미확인**
  - 게임에 연결한 화면: 층, 상한, LOD, 군중 판독
  - 정식 판독 시험(n ≥ 8), 성능, 팩 바이트

**렌더**: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`
- `k10r5f1-scorch-x6.png`, `k10r5f1-c13-x1.png`, `k10r5f1-c13-x1-gray.png`, `k10r5f1-fire-ctx-x1.png` (작가)
- `k10r6-scorch-x1.png`, `k10r6-zone-ages.png`, `k10r6-keep-3a-r1.png` (제 렌더)

## K10 3차 2회 납품서

**1/2회(3b1): 각성 기믹 P2의 적 표식·발 오버레이 9종 + R1 까마귀 + 결정 ② SPEC 기록 · `SPEC.version` `1.0-d3b1`**

kit-artist, 2026-10-19. 분량이 커서 허락받은 대로 둘로 나눴습니다. 이번은 표식·발 오버레이이고, 이어지는 효과(§4.4)는 3b2(`1.0-d3b2`)입니다.

**검수자가 먼저 볼 것**
- `--check`는 모두 ok, kit error 0건입니다. C2·C6·C7·C8·C10 모두 기준 안입니다.
- 보존 해시: 이번에 더한 것을 빼면 spec·parts가 3a-r1과 같습니다. stamps·draw는 R1(기존 `crowFeathers/crow` 6장)만큼 바뀌었고, 그 조각과 그것을 그리는 `crow` 단계까지 빼면 3a-r1과 같습니다(§7).
- 지시서와 다른 판단 둘을 봐 주십시오.
  - 서리 수·가시의 층을 `feet`에서 `front`로 바꿨습니다. 몸 아래 층에서는 발과 몸이 가려 1배에서 보이지 않았습니다(§9-2).
  - 얼룩에 청록 반짝 호를 넣었습니다. 지시서 표에는 청록이 없지만, 모든 오버레이에 청록이 있어야 한다는 C6 규칙 때문입니다.

고친 파일은 둘뿐입니다.
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`(새 §14.10, §3·§4·§5·§10·§11·§12-81~91·§13 갱신)

### 1. 만든 것과 done 목록

**코드 위치(k-arsenal-fx.js)**

| 무엇 | 줄 |
|---|---|
| 머리 주석 | `:3-10` |
| `GSTAGE2`(P2 단계 9), `isGimmick`, `GOBJECT` 새 5개 | `:388-394` |
| `SPEC.version` | `:398` |
| 결정 ② `SPEC.gimmick.eclipseHalo.layers`·`reducedFlash` | `:547-550` |
| `SPEC.overlay` 새 하위 키 | `:553-570` |
| META(stages·gimmicks priority 2·done) | `:636-643` |
| 조각 표: 새 그룹 5 | `:649-680` |
| 조각 표: 기존 그룹 끝(frost1/2, lost, bound, mark-weak) | |
| R1 까마귀 | `:2059-2082` |
| 새 그림 §3c | `:2250-2410` |
| `ovBody` 새 키 | `:3265-3302` |
| `MARK_STAGES`·`MARK_CTX`·`drawMarks` | `:3376-3386` |
| `drawTotal` `reducedFlash` | |
| `OVERLAYS` 14키 | `:3481` |

**공개 API에 생긴 것**
- `groups` 30 → 35: inkDarts, headsmanDarts, inkBloom, thornHalo, bossbane
- `overlays`에 9키: `fear`, `lost`, `weak`, `stain`, `crack`, `pollen`, `frost`, `bound`, `thorn`
- 새 opts: `stack`(얼룩 1~3·균열 1~5·서리 1~2), `facing`(공포 땀방울 반전), `reducedFlash`(개기일식)
- 조각 280 → **316장**, 박스 넓이 522,964 → **549,380**

**P2 단계(우선 2) 9개, done.gimmick ✓**

| 무기 | 단계 |
|---|---|
| inkDarts | stain |
| headsmanDarts | fear |
| wardRing | weak |
| bossbane | crack |
| smokeTail | lost |
| inkBloom | pollen |
| frostNeedles | frost |
| gravePins | bound |
| thornHalo | thorn |

- 먹침, 망나니 침, 먹꽃, 가시 테, 보스 사냥침은 이번에 처음 done이 되었습니다.

**3b2로 넘긴 것**
- 먹 얼룩 터짐, 늦은 붓자국, 도미노, 감전 도약, 공포 고리, 꽃가루 고리·퍼짐, 배후 응징, 균열 터짐, 밀쳐 부딪힘, 메아리, 갈라짐, 되감김, 증폭, 묶인 사슬, 가지창, 되쓸기, 되받기, 결 가속, 마름쇠 꺾임, 해바늘 배율 규칙
- 터짐·고리는 같은 기믹의 3b1 단계(stain, fear, crack, pollen)에 더합니다. 그때 그 네 단계의 draw가 바뀝니다.

### 2. 무기별 요약

| 무기 / 단계 | 물건(조각) | 층·규칙 | 청록 |
|---|---|---|---|
| 먹침 / stain | `mark-stain1~3`: 들쭉날쭉한 먹 얼룩(r 3.6 → 4.8 + 방울 → 5.8 + 가장자리 방울 둘), 종이 테 1.2 + 먹 바깥 선. 둥근 원판·동전이 아님 | head, stack 1~3, heads 마지막 | 젖은 먹 위 반짝 호 |
| 망나니 침 / fear | `mark-fear`: 종이 식은땀 방울(먹 테 1.4, p300 그늘), −16° 기울여 머리 뒤쪽에 둠 | head, `rotate: 'face'`(적이 왼쪽을 보면 반전) | 방울 안 반짝 획 |
| 수호 고리 / weak | `mark-weak`: 꼰 줄 한 토막의 혹 매듭, 두 끝은 길이가 달라 리본 나비가 아님 | head | 매듭을 꿰는 바느질 한 땀 |
| 보스 사냥침 / crack | `mark-crack1~5`: 찢긴 종이판(19×13)에 왼쪽 위 모서리에서 갈라지는 금 n개(각·길이 제각각). 원판·눈구멍 없음 | head, stack 1~5. 늘 그리고, 다른 표식이 있으면 오른쪽 26 | 가장 새 금 |
| 연막 꼬리 / lost | `lost`: 머리 위를 도는 담묵 연기 컬 둘(4장 × 45°). 점이 아님 | head, loop 8, deco | 컬 끝의 작은 리본 |
| 먹꽃 / pollen | `spore-a/b`: 먹 테를 두른 청록 꽃가루 알갱이 + allyG 점(cycle 1초) | 슬롯 둘이 rise 16·drift 6으로 반 주기 엇갈려 오름. deco | 알갱이 |
| 서리침 / frost | `frost1-<r>`(한 무더기), `frost2-<r>`(두 무더기 + 얇은 얼음판). 결정 각기둥, 몸 높이 25% 이하 | **front**(§9-2), stack 1~2 | 가장 높은 결정의 심 |
| 묘침 / bound | `bound<r>`: 발 앞을 지나는 열린 호의 청록 홈질 + 풀린 실 끝 + 작은 묘침 | front. 닫힌 고리가 아니라 주인공 발밑 링과 갈림 | 실 |
| 가시 테 / thorn | `thorn<r>`: 발 앞·옆 땅에 박힌 휜 장미 가시 셋(먹 + 바깥 반 종이, 먹 외곽 0.8) | **front**(§9-2), 머리 둘레 없음 | 한 가시의 심 |

**R1 까마귀**
- 든 장·수평 장(0·1·2·4·5)에서 날개 끝을 홈 셋으로 갈라 첫째 깃 넷을 벌렸습니다.
- 종이 깃대 획은 가장 긴 둘에만 둡니다. 넷 모두 두면 빗살로 읽혔습니다.
- 내린 장(3)은 닫힌 날개 그대로입니다.
- 부리: 밑동 1.6 → 2.4, 길이 2.2 → 3.2.
- 눈 없음, 6장, 박스 26×18, 청록 다리 실 하나는 그대로입니다.

**결정 ②**
- `layers {wash: ground, band: ground, outer·inset·corona·ribbon: ally}`, `reducedFlash 0.5`
- 참고 합성은 `draw('eclipseHalo','total',{reducedFlash:true})`로 같은 규칙을 그립니다. 기본 출력은 그대로입니다.

### 3. C 검사 출력 원문

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 명령은 모두 단일 `node scripts/art-review-sheet.mjs …`입니다.

**C1** `k10-c1-all-d3b1`
```
ok   k10-c1-all-d3b1
```

**C2** `k10-c2-parts-d3b1`: 첫 줄과 새 줄 27개입니다. 나머지 줄은 3a-r1과 같습니다(제한 parts 해시가 같음).
```
frames=316 ok boxArea=549380 ok badParts=0
inkDarts/mark-stain1 f1 idx box22x22 a11,20 over none head info w:stack
inkDarts/mark-stain2 f1 idx box22x22 a11,20 over none head info w:stack
inkDarts/mark-stain3 f1 idx box22x22 a11,20 over none head info w:stack
frostNeedles/frost1-12 f1 idx box36x20 a18,10 feet none front info r12 w:stack
frostNeedles/frost1-19 f1 idx box48x24 a24,12 feet none front info r19 w:stack
frostNeedles/frost1-28 f1 idx box64x30 a32,15 feet none front info r28 w:stack
frostNeedles/frost2-12 f1 idx box36x20 a18,10 feet none front info r12 w:stack
frostNeedles/frost2-19 f1 idx box48x24 a24,12 feet none front info r19 w:stack
frostNeedles/frost2-28 f1 idx box64x30 a32,15 feet none front info r28 w:stack
headsmanDarts/mark-fear f1 idx box22x22 a11,20 over face head info w:status
inkBloom/spore-a f4 cycle 1s box10x14 a5,12 over none head deco w:status
inkBloom/spore-b f4 cycle 1s box10x14 a5,12 over none head deco w:status
thornHalo/thorn12 f1 idx box30x16 a15,8 feet none front info r12 w:status
thornHalo/thorn19 f1 idx box40x18 a20,9 feet none front info r19 w:status
thornHalo/thorn28 f1 idx box56x22 a28,11 feet none front info r28 w:status
thornHalo/thorn38 f1 idx box72x26 a36,13 feet none front info r38 w:status
thornHalo/thorn54 f1 idx box96x30 a48,15 feet none front info r54 w:status
smokeTail/lost f4 loop@8 still0 box24x14 a12,10 over none head deco w:status
gravePins/bound12 f1 idx box34x20 a17,10 feet none front info r12 w:status
gravePins/bound19 f1 idx box46x24 a23,12 feet none front info r19 w:status
gravePins/bound28 f1 idx box62x30 a31,15 feet none front info r28 w:status
bossbane/mark-crack1 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack2 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack3 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack4 f1 idx box26x24 a13,22 over none head info w:stack
bossbane/mark-crack5 f1 idx box26x24 a13,22 over none head info w:stack
wardRing/mark-weak f1 idx box22x22 a11,20 over none head info w:status
```

**C5** PRI 2(3b1의 9칸)
```
ok   k10-c5-gimmicks-p2-d3b1              (이름표, 맥락, 1배)
ok   k10-c5-gimmicks-p2-blind-gray-d3b1   (BLIND·흑백)
```

**C6** `k10-c6-scan-d3b1`
```
calls=448 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```

**C7** `k10-c7-geometry-d3b1`(마지막 상태)
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```

**C8** `k10-c8-unchanged-d3b1`
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 n4n4y2/2117692 -> n4n4y2/2117692 same | k11 bvf9fj/934797 -> bvf9fj/934797 same | fixed set same
PN keys same: C,_hk,_ki,arsenal,arsenalFx,bombers,bossesA,bossesB,bossesC,characters,defs,enemies,env,fieldBosses,halftone,hazards,heroKit,icons,rng,skillVfx,speedLines,splat,story,taper,tapers,vfx
arsenalFx calls: 420
```

**C9** `k10-c9-vectors-d3b1`
- 69줄입니다. 3b1은 layout·paths를 더하지 않습니다. 줄 수와 글자 해시(`k10-c9-count-d3b1`):
```
C9 lines=69 text hash=19cnic1 len=8948
```

**C10** `k10-c10-contrast-d3b1`: 채움을 더하지 않았습니다.
```
fills=24 fail=0 (persistent over 0.3 s: Y max 0.62; brief: Y max 0.69; hero coat Y 0.902, contrast min 1.25)
```

**C12·C13·C15**
```
ok   k10-c12-scene-p2            ok   k10-c12-scene-p2-gray-x08
ok   k10-c13-marks-d3b1          ok   k10-c13-marks-gray-d3b1
ok   k10-c13-marks-d3b1-x4a      ok   k10-c13-marks-d3b1-x4b      ok   k10-c13-marks-gray-d3b1-x4
ok   k10-c15-pairs-d3b1
```
- C13은 오버레이 14키 전부에 정예(`enemies.draw` elite)·기절(점 셋)·xp·동전 대조 칸을 더했습니다. 렌더러 층 순서(feet → 몸 → front → head)로 그렸습니다.
- C12는 적 200에 머리 표식 24, 발 오버레이 24, 까마귀 12, 포자 8마리를 상한대로 주인공에게 가까운 적부터 걸었습니다. 간수 일부에 균열판을 걸었습니다.

**다시 돌리지 않은 것**
- C14: 땅 조각 변화 없음.
- C3·C4·C11: 주 단계·비행 변화 없음.
- 위 셋 모두 제한 draw 해시가 같은 것으로 확인했습니다.

### 4. 직접 본 렌더

위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`

| 배율 | 렌더 |
|---|---|
| 1배 | `k10-c5-gimmicks-p2-d3b1`, `k10-c13-marks-d3b1`, `k10-c12-scene-p2` |
| 0.8배 + 흑백 | `k10-c12-scene-p2-gray-x08` |
| 흑백 | `k10-c5-gimmicks-p2-blind-gray-d3b1`, `k10-c13-marks-gray-d3b1`, `k10-c13-marks-gray-d3b1-x4` |
| 확대 | `k10-c13-marks-d3b1-x4a`·`-x4b`(4배), `k10d3b-marks-x6`(머리 표식·포자 6배), `k10d3b-feet-x4`(발 오버레이와 박스·rect), `k10d3b-feet7-x3`(발 오버레이 일곱 종을 한 적에 층대로, 색·흑백), `k10d3b-feet-ctx-x3`·`k10d3b-c5-cells-x3`(맥락 칸) |
| R1 전후 | `k10d3b-crow-before-x8`, `k10d3b-crow-after-x10` |
| 대조 | `k10d3b-k9-p2-icons`(K9 아이콘), `k10-c15-pairs-d3b1` |

### 5. 자가 판정

**T4 기믹(C5 PRI 2, 3b1 9종)**
- §4.1 표만 보고 9종을 짝지을 수 있다고 판단합니다: 땀방울 = 공포, 꼰 줄 매듭 = 약화, 먹 얼룩 = 얼룩, 종이판 = 균열, 연기 컬 = 헤맴, 청록 알갱이 = 꽃가루, 결정 = 서리 수, 홈질 = 묶임, 가시 = 가시.
- 약점: 1배에서 꽃가루 포자(약 3px)와 12 등급 가시·서리 수가 작습니다. 흑백 1배에서는 서리 1과 가시가 둘 다 발치의 작은 밝은 조각입니다(꼴은 곧은 각기둥 / 휜 가시로 다름).

**T5 표식(C13 1배·4배·흑백)**
- 머리 표식은 서로 갈리고 정예 세 구슬·기절 점·xp·동전과도 갈립니다.
- 위험 하나: 1배 흑백에서 얼룩 1(작은 먹 덩이 + 종이 테)과 동전(어두운 ◎)이 둘 다 '작은 어두운 둥근 것'입니다. 4배에서는 들쭉날쭉한 테와 반짝 호로 갈립니다.
- 발 오버레이 일곱(동결·서리 1·서리 2·묶임·불먹·가시·얼음판)은 `k10d3b-feet7-x3` 흑백에서 꼴로 갈립니다. 눈을 가리는 것은 없습니다(서리 수 25% 이하).

**T6 혼잡(C12 P2)**
- 결이 가장 밝고, 적 탄과 호박 예고가 그대로 읽힙니다.
- 균열판(흰 종이)은 밝지만 게임에서는 보스 하나에만 붙습니다.

**T7**: 땅 조각이 바뀌지 않아 해당이 없습니다.

### 6. 메인 세션 등록값

**굽기**: HEAD 스냅숏.
- 새 키 36장
  - `afx/inkDarts/mark-stain1~3/0`
  - `afx/headsmanDarts/mark-fear/0`
  - `afx/inkBloom/spore-a|b/0~3`
  - `afx/thornHalo/thorn12|19|28|38|54/0`
  - `afx/bossbane/mark-crack1~5/0`
  - `afx/frostNeedles/frost1-12|19|28/0`, `frost2-…/0`
  - `afx/smokeTail/lost/0~3`
  - `afx/gravePins/bound12|19|28/0`
  - `afx/wardRing/mark-weak/0`
- **다시 구울 기존 키 6장**: `afx/crowFeathers/crow/0~5`(R1)
- 새 그룹 5개: inkDarts, headsmanDarts, inkBloom, thornHalo, bossbane
- 316장, 박스 합 549,380. 상한까지 64장·90,620이 남고, 3b2 계획은 35장·46,440입니다.

**애니메이션**
- `lost` loop 8fps, still 0
- `spore-a/b` cycle 1초
- 나머지는 idx(stack은 자료가 장을 고름)

**매니페스트**: SPEC의 `overlay` 새 키(head.parts.fear/lost/weak/stain, feet.frost/bound/thorn, crack, pollen), `gimmick.eclipseHalo.layers`·`reducedFlash`. 새 window 값은 없고 `stack`은 기존 목록에 있습니다.

**렌더러**(API §14.10)
- 층
  - 머리 표식·균열판·포자·까마귀: overheads
  - 서리 수·묶임·가시·동결 앞·불먹: 그 적 몸 바로 뒤(front)
  - 동결 뒤: groundMarks
- 표식은 (0, 실제 top − 12)에 하나만 둡니다(`priority.heads`). 균열판은 늘 그리고, 표식이 함께 있으면 x + 26입니다.
- 포자: 슬롯 둘, rise 16·drift 6·cycle 1초·반 주기 엇갈림. minimal에서는 없습니다.
- `mark-fear`는 적이 왼쪽을 보면 좌우 반전합니다.
- stack: 얼룩 1~3, 균열 1~5, 서리 1·2(= `priority.feet`의 frost1·frost2)
- 상한: heads·feet [24, 16, 8], crows [12, 8, 4], spores [16, 8, 0]
- 개기일식: 원판·띠는 몸 아래, 섬광 감소에서 α × 0.5

**엔진·표시 필드**(지시서 §9-3)
- `awk.stain`·`stainUntil`, `awk.fear`, `awk.weak`, `awk.wander`, `awk.crack`(보스), `awk.pollen`, `awk.frost`(겹 수), `awk.bound`(새), `awk.thorn`
- 지금의 `drawAwakenedMarks`(먹 점·청록 다각형)를 이 오버레이로 바꿉니다.

**버전**: `1.0-d3b1`

### 7. 보존 해시 결과

검수 4차 `k10-keep-all` 식으로 쟀습니다. 글자는 코드로 확인했습니다.

**뺀 것**
- 새 그룹 5개
- 기존 그룹 끝의 part `/^(mark-weak|lost|frost[12]-\d+|bound\d+)$/`
- 단계 9개
- SPEC의 `version`, `overlay.head.parts.{fear, lost, weak, stain}`, `overlay.feet.{frost, bound, thorn}`, `overlay.{crack, pollen}`, `gimmick.eclipseHalo.{layers, reducedFlash}`

| 측정 | 3b1 뒤 | 3a-r1 기준 | |
|---|---|---|---|
| spec | `146lftr/17916` | `146lftr/17916` | 같음 |
| parts | `qe5odc/22955` | `qe5odc/22955` | 같음 |
| stamps(더한 것만 뺌) | `ege9ps/716624` | `mwewtb/715817` | R1 |
| draw(더한 것만 뺌) | `1nsdkzn/5468237` | `7vot8j/5466897` | R1 |
| stamps(+ `crowFeathers/crow` 조각도 뺌) | `mk33bj/704087` | `mk33bj/704087` | 같음 |
| draw(+ `crowFeathers/crow` 단계도 뺌) | `rq8mbn/5442029` | `rq8mbn/5442029` | 같음 |

- 3a-r1 기준의 '까마귀까지 뺀' 두 값은 고치기 전 코드에서 같은 식으로 미리 잰 값입니다(`k10-keep-3b1-base`). 그래서 바뀐 기존 출력은 까마귀 조각과 그것을 쓰는 단계·오버레이(C12·C13의 까마귀 포함)뿐입니다.
- **R1 변경의 이유**: 검수 5차 R1(첫째 깃·부리)을 지시자가 이번 회차에 요청했습니다.

**원문 넷**(아무것도 빼지 않음, `k10-keep-all-3b1`). 3b2의 보존 기준입니다.

| 항목 | 값 |
|---|---|
| stamps | `ornn3o/786972` |
| draw | `1mc15ab/5720453` |
| spec | `p3d9vk/18629` |
| parts | `1fawmjd/28554` |

### 8. 사람 클린업

- 머리 표식 넷(땀방울, 꼰 줄 매듭, 얼룩 1~3, 연기 컬)과 균열판 1~5: 16~18px 1배 픽셀 다듬기, 찢긴 종이 가장자리
- 포자(3px)
- 서리 결정의 면, 가시의 휜 꼴과 종이 면
- 묶임 바느질의 들고 나는 땀과 작은 묘침
- 까마귀 첫째 깃의 마른 붓 끝
- 12 등급 가시·서리 수(몇 px)
- 문화 검토: 땀방울이 우스꽝스럽지 않게, 가시는 발치 땅에만(가시관 아님)

### 9. 지시서와 다르게 한 것 (API §12-81~91)

1. **둘로 나눔**(허락받음). 같은 기믹의 표식과 사건은 한 단계에 모읍니다(stain, fear, crack, pollen). 3b2에서 그 단계에 사건을 더합니다.
2. **서리 수·가시 층: `feet` → `front`**
   - 지시서 §4.3 표는 몸 아래 층이었지만, 그 층에서는 발과 몸이 가려 1배에서 보이지 않았습니다(`k10d3b-feet-ctx-x3` 앞 렌더).
   - 박스·rect는 그대로 두고, 키는 몸 높이 25% 이하, 가시는 발 선 앞과 옆에 꽂았습니다.
   - **판단 요청**: 이 층 변경을 받을지.
3. **오버레이 키에 `stack`**: `frost`(1~2)·`stain`(1~3)·`crack`(1~5)이 한 키에서 stack을 받습니다. `priority.feet`의 frost1·frost2는 frost의 stack입니다. 균열판은 `priority.heads` 밖에서 늘 그립니다(`beside` 26).
4. **포자는 먹 테 청록 알갱이**: 종이 알갱이 + 먹 점은 눈알로, 꼬리를 단 것은 숫자 9로 읽혀 바꿨습니다. 3px라 청록 샌드위치를 먹 1 + 청록 + allyG로 줄였습니다.
5. **공포 땀방울 `rotate: 'face'` + `opts.facing`**: 머리 뒤쪽을 유지하려고 넣었습니다.
6. **얼룩의 청록**: 지시서 표에는 없지만 C6 규칙 때문에 젖은 먹 위 반짝 호를 넣었습니다(위 '먼저 볼 것' 둘째).
7. **헤맴 컬 끝의 청록 리본**: K9 연막 꼬리의 리본입니다.
8. **약화 매듭**: 끝 길이를 달리해 리본 나비를 피했습니다.
9. **R1 깃대 획은 둘만**: 넷 모두 두면 빗살로 읽혔습니다.
10. **결정 ②를 `SPEC.gimmick.eclipseHalo`에 기록**(검수 5차 §5-1 그대로).
11. `SPEC.version` `1.0-d3b1`.

### 10. 알려진 한계

- 3b2의 이어지는 효과가 남았습니다. 3b2에서 stain·fear·crack·pollen 단계의 draw가 바뀝니다.
- 1배에서 작은 등급(12)의 발 오버레이와 포자는 몇 px라 실제 화면 판독은 `test:visual`에서 봐야 합니다.
- C5의 균열판은 보스 대신 간수에 건 참고 합성입니다.
- 정식 판독 시험, 성능, 팩 페이지·바이트는 메인 세션 몫입니다.

## K10 검수 7차: 3차 2회 1/2(3b1, `1.0-d3b1`), art-director, 2026-10-19

**판정: 수정 후 합격.**
- 고칠 것은 둘이고, 둘 다 그림만 바꿉니다. 박스, 앵커, SPEC은 그대로입니다.
  - **F1** 헤맴 `lost`가 1배에서 거의 안 보입니다.
  - **F2** 가시 `thorn<r>`: 흑백 1배에서 서리와 같은 '밝은 점'이 되고, 외곽도 규정보다 얇습니다.
- 나머지 표식·발 오버레이 7종, R1 까마귀, 결정 ② SPEC 기록은 그대로 받습니다.
- 판단 요청 둘(층 front, 얼룩 청록)도 받습니다.
- F1·F2를 내는 방법은 둘 중 하나입니다. 어느 쪽이든 보존 해시는 §3 끝의 식으로 잽니다.
  - 3b1을 3b2보다 먼저 굽거나 연결하려면 `1.0-d3b1-r1`로 따로 냅니다.
  - 아니면 3b2에 함께 넣어도 됩니다. 3b1은 아직 굽지 않았습니다.

### 1. 확인한 것

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 모두 `--check` ok입니다.

| 검사 | 결과 |
|---|---|
| 원문 해시(`k10r7-keep`) | `ornn3o/786972`, `1mc15ab/5720453`, `p3d9vk/18629`, `1fawmjd/28554`. version `1.0-d3b1`, 그룹 35. 납품서 §7과 같습니다 |
| 더한 것만 뺀 해시 | spec `146lftr/17916`, parts `qe5odc/22955`로 3a-r1과 같습니다. stamps `ege9ps/716624`, draw `1nsdkzn/5468237` |
| 까마귀 조각·단계까지 뺀 해시 | stamps `mk33bj/704087`, draw `rq8mbn/5442029`. 납품서 값과 같습니다 |
| C2 | `frames=316 ok boxArea=549380 ok badParts=0` |
| C6 | `calls=448`, 모두 0 |
| C7 | 1~4줄 0건, 5줄 ok |
| C8 | 고정 값, k9·k11, PN 키 모두 같습니다. calls 420 |
| C9 | 69줄. 글자 해시 `19cnic1`(len 8948)이 납품서와 같습니다 |
| C10 | 채움을 더하지 않았습니다(제한 spec이 같음) |
| C5 PRI 2(`k10r7-c5-p2`, 2배 자른 판 `-crop`) | 1배에서 §4.1 표만으로 짝지어지는 것은 9칸 중 6칸입니다. 얼룩, 공포, 약화, 균열, 서리, 묶임은 됩니다. 헤맴(흐림), 가시(점), 포자(작은 구슬)는 안 됩니다. T4 'P2 90%'(지시서 `:1059`)에 못 미칩니다. F1·F2와 3b2의 꽃가루 고리 뒤에 다시 봅니다 |
| C13 대조 | `k10r7-heads-x1`(1·3·5장 × 색·흑백): 표식 12종 + 정예, 기절 점(제 근사), 폭탄병, xp, 동전, 회복, 자석 |
| 확대 | `k10r7-heads-x4`, 얼룩 대 적 탄 `k10r7-stain-vs-shot`, 발 일곱 1배 세 크기 `k10r7-feet7-x1`, 6배 `k10r7-thorn-lost-x6`, 2배 `k10r7-bound-crack-x2` |
| 작가 렌더 | C13 넷, `k10d3b-feet7-x3`, `k10d3b-marks-x6` |
| C12(작가 `k10-c12-scene-p2-gray-x08`) | 결, 적 탄, 호박 예고가 그대로 읽힙니다 |
| 결정 ②(`k10r7-total-rf`) | `reducedFlash`에서 원판·띠만 절반이 되고, 테·코로나·리본은 그대로입니다. 기본 출력도 그대로입니다 |
| R1 | 작가 렌더 `k10d3b-crow-before-x8`, `-after-x10` |

### 2. 결정

**① 서리 수·가시의 층 `feet` → `front`: 받습니다.**
- 몸 아래 층에서는 발과 몸이 가려 안 보였습니다.
- front 층에서도 키가 몸 높이의 25% 이하이고 발 선 앞과 옆에만 있어 눈을 가리지 않습니다.
- 묶임, 불먹, 동결 앞쪽과 같은 층이라 규칙이 하나로 맞습니다.
- 지시서 §4.3 표(`docs/art/briefs/arsenal-fx.md:876-881`)의 frost1/2와 thorn을 `feet · front`로 정정합니다(메인 세션).

**② 얼룩의 청록 반짝 호: 받습니다.**
- 지시서 §1.7 '모든 적 오버레이에는 청록이 꼭 있다'(`:298`)가 §4.3 표보다 앞섭니다.
- 청록은 먹 위에 얹혀 있어 `:297`과도 맞습니다.

**판독 위험 판정**
- **얼룩 1 대 동전: 갈립니다.**
  - 얼룩은 먹 속 + 종이 테, 동전은 밝은 판 + 먹 테 + 네모 구멍으로 명도가 반대입니다.
  - 적 탄(어두운 바깥 고리 + 산호 + 흰 점, 14~18px)과도 바깥 명도와 크기로 갈립니다.
  - 다만 얼룩 1은 거의 둥근 덩이라, 'splat'으로 더 읽히게 하는 것은 R2입니다.
- **서리 1 대 가시: 흑백 1배에서 갈리지 않습니다 → F2.**
- **포자 3px**: 1배에서 점이라 헷갈림도 정보도 없습니다. deco로 받고, 3b2에서 키웁니다(§5-6).
- **12 등급 발 오버레이**
  - 박스 크기가 한계라 받습니다.
  - 가시는 F2에서 박스 끝까지 키웁니다.
  - 서리 1은 25% 안에서 조금 더 키워도 됩니다(R4, 선택).
- **머리 표식**
  - 손종(돔), 패(네모 + 고리), 정예 3구슬, 기절 점 셋, 폭탄병, xp, 동전과 모두 갈립니다.
  - 예외는 헤맴입니다. 1배 색·흑백 모두 5px 회색 곱슬이라 거의 안 보입니다(F1).
  - 약화(흰 줄 아치)는 자석 픽업(검은 말굽)과 실루엣이 같은 ∩입니다. 명도는 반대라 R3으로 둡니다.
- **발 오버레이 일곱**
  - 동결(긴 흰 결정 + 판), 얼음판(흰 판), 묶임(점선 호 + 핀), 불먹(어두운 덩이 + 밝은 심)은 갈립니다.
  - 서리 1·2와 가시는 흑백 1배에서 둘 다 '발치의 작은 밝은 점'입니다. F2 뒤에는 '밝은 결정 대 어두운 갈고리'로 갈립니다.

**R1 까마귀: 받습니다.**
- 든 장과 수평 장에 첫째 깃 넷이 있고, 깃대 획은 둘입니다(넷이면 빗살로 읽힘).
- 부리가 굵고 길어졌습니다. 눈 없음, 6장, 박스, 다리 실은 그대로입니다.

### 3. 고칠 것 (kit-artist, `k-arsenal-fx.js`·`API-arsenal-fx.md`만)

**F1. 헤맴 `lost`를 1배에서 보이게** (`art/concept-kit/k-arsenal-fx.js:2317-2331`)

문제:
- 곱슬은 지름 약 5.5px(`curlPts` 반지름 k·1.2·(2.3 − 1.5u))입니다.
- 테두리가 먹이 아니라 ink500/ink300이고 한쪽 약 0.75px입니다: `[['ink500',2.3],['p300',0.8]]`, `[['ink300',2],['p300',0.7]]`.
- '적에 붙는 표식 외곽 1.2~1.6'(`:308`)에 못 미치고, 1·3·5장 바닥에서 색·흑백 모두 거의 안 보입니다.

처방:
- **층(획 샌드위치)**
  - 앞 곱슬: `[['ink',3.4],['p300',1.0]]` (먹 테 한쪽 1.2)
  - 뒤 곱슬: `[['ink',2.8],['ink300',0.8]]`
  - '담묵'은 밝은 심이 맡고, 앞뒤 깊이는 크기와 심 명도로 나눕니다. 먹 테를 빼지 않습니다.
- **크기와 자리**
  - 곱슬 반지름 계수를 k·1.2에서 k·1.7 안팎으로 올립니다.
  - 두 곱슬의 궤도 x를 3.6에서 5 안팎으로 넓혀 서로 붙지 않게 합니다.
  - 모두 박스 24×14 − 3 안이어야 합니다(앵커 12,10이므로 y −7~+1).
- **그대로 둘 것**: 열린 곱슬(점이나 닫힌 고리가 아님), 청록 리본 끝, 4장, loop 8, deco, box, anchor

합격 기준:
- 1배(scale 1), 1·3·5장, 색·흑백, `k10r7-heads-x1`과 같은 판에서 곱슬 둘이 먹 테 두른 열린 곱슬로 한눈에 보입니다.
- 기절 점 셋, 약화 아치와 갈립니다.
- C7 0건(box − 3, 앵커 아래로 칠하지 않음), C6 0건

**F2. 가시 `thorn<r>`: 어두운 갈고리로** (`k-arsenal-fx.js:2381-2408`)

문제:
- 먹 외곽이 0.8입니다(`:2403`). `:308`의 1.2~1.6에 못 미칩니다.
- 볼록한 쪽 절반을 통째로 종이(p50)로 칠했습니다. 그래서 흑백에서 서리 결정과 같은 명도의 반백 점이 됩니다.
- r12의 가시 끝이 땅 위로 3~4px뿐이라 1배에서 점입니다.
- 세 가시의 땅 y가 2.2·1.6·3.1로 거의 같아 한 줄로 보입니다(`k10r7-feet7-x1`, `k10r7-thorn-lost-x6`).

처방:
- **명도**
  - 몸은 먹입니다.
  - 종이는 볼록한 쪽 가장자리를 따라 너비 약 0.25·b의 가는 띠로만 둡니다(빛 받는 면).
  - 먹 외곽은 1.2입니다.
- **크기**
  - 각 등급의 박스 −3과 발 rect 안에서 가장 크게 합니다.
  - 앞 가시 높이 목표: r12 ≈ 6.4, r19 ≈ 7.6, r28 ≈ 9.6, r38 ≈ 11.6, r54 ≈ 13.6
  - 곁 가시 둘은 앞 가시의 약 0.78·0.62배, 밑동 폭은 높이의 약 0.75배입니다.
- **배치**
  - 앞 가시는 가장 앞(땅 y 가장 큼)에 두고, 곁 가시 둘은 발 선 가까이 더 위에 둡니다.
  - 그래서 셋이 발 둘레의 얕은 호에 놓입니다(한 줄이 아님).
  - 갈고리 방향은 지금처럼 둘은 바깥, 하나는 안쪽입니다.
- **그대로 둘 것**: 한 가시의 청록 심 `[ally 1, allyG 0.35]`, ink700 땅 패임, front 층, 머리 둘레 없음, box·anchor

합격 기준:
- 1배(scale 1)에서 `k10r7-feet7-x1` 판(일곱 종 × 세 크기 × 1·3·5장, 색·흑백)
  - 가시가 '발치의 어두운 갈고리'로 읽힙니다.
  - 서리 1·2(흰 결정)와 명도로 갈립니다.
  - 같은 꼴 셋이 한 줄로 서지 않습니다.
- C7 0건(rect), C6 0건

**F1·F2 보존 해시**
- 그대로여야 하는 값(3b1에서 미리 잼)
  - `stamps without smokeTail/lost, thornHalo/*=1d1pfw/759026`
  - `draw without lost, thorn stages=i29rer/5642637`
  - `spec=p3d9vk/18629`
  - `parts=1fawmjd/28554`
  - `overlays without lost, thorn=18o4se4/846311`
- 바뀌는 것은 raw stamps·draw뿐입니다.
- 3b2에 함께 넣으면 이 식에 3b2가 더한 것(조각, 단계, SPEC 하위 키)과 stain·fear·crack·pollen 단계 draw를 더 뺍니다.

```
node scripts/art-review-sheet.mjs expr --name k10-keep-3b1-r1 --scale 1 --crop 0,0,1700,140 --expr '(function(){var X=PN.arsenalFx;function norm(m){return String(m).replace(/\bkaf\d+_/g,"kaf_");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36)+"/"+s.length;}var A="",A2="",B="",B2="",O="",fx=function(g,p){return (g==="smokeTail"&&p==="lost")||(g==="thornHalo");},sk={lost:1,thorn:1};X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++){var m=norm(X.stamp(g,p.part,{frame:f}));A+=m;if(!fx(g,p.part))A2+=m;}});});X.ids.forEach(function(id){(X.META[id].stages||[]).forEach(function(st){[false,true].forEach(function(aw){[1,5].forEach(function(lv){[0.1,0.5,0.9].forEach(function(p){var m=norm(X.draw(id,st,{level:lv,awakened:aw,p:p,t:p*0.3,seed:7}));B+=m;if(!sk[st])B2+=m;});});});});});X.overlays.forEach(function(k){if(sk[k])return;[12,19,28,38,54].forEach(function(r){[1,2,3].forEach(function(stk){[0,0.3].forEach(function(t){O+=norm(X.overlay(k,{r:r,top:-30,t:t,stack:stk}));});});});});var S=JSON.parse(JSON.stringify(X.SPEC));delete S.version;var L=["stamps raw="+h(A)+" | without smokeTail/lost, thornHalo/*="+h(A2),"draw raw="+h(B)+" | without lost, thorn stages="+h(B2),"spec="+h(JSON.stringify(S))+" parts="+h(JSON.stringify(X.groups.map(function(g){return X.parts(g);})))+" overlays without lost, thorn="+h(O)+" version="+X.SPEC.version];return "<rect width=\"1700\" height=\"140\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(24+i*26)+"\" font-size=\"12\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

**권장(3b2나 사람 클린업에서)**
- **R2 얼룩 1**: `STAINS[1]`의 amp를 0.26에서 0.34 안팎으로 올리고, 가로로 조금 늘입니다(rx ≈ 1.15r, ry ≈ 0.85r). 방울 없이도 '공'이 아니라 '번짐'으로 읽히게 합니다. 3b2에서 고치면 `inkDarts/mark-stain1`을 보존 해시에서 뺍니다.
- **R3 약화 매듭**: 좌우 대칭 ∩ 아치를 피하고, 줄이 한 번 교차하는 매듭이 보이게 합니다(자석 말굽과 갈림). 사람 클린업입니다.
- **R4 서리 1**: r12 키 4.6을 25% 안(약 5.6)까지 올려도 됩니다. 선택입니다.
- **사람 클린업**
  - 균열판 1~2는 2배·흑백 군중에서 '봉투(✉)'로도 보입니다. 첫 금을 모서리 대각선보다 들쭉날쭉하게 합니다.
  - 그 밖은 납품서 §8 목록입니다.

### 4. 지시서와 다르게 한 것 81~91 판정

| # | 판정 |
|---|---|
| 81 둘로 나눔, 표식과 사건을 한 단계에 | 수용. 3b2에서 stain·fear·crack·pollen의 draw가 바뀌는 것은 3b2 보존 식에서 뺍니다 |
| 82 서리 수·가시 front | 수용(결정 ①). 지시서 정정 |
| 83 `stack` 키, 균열판은 우선순위 밖·`beside` 26 | 수용(지시서 §4.5 '보스의 균열판은 따로 늘 그린다'와 같음) |
| 84 포자 = 먹 테 청록 알갱이 + allyG, 샌드위치 축소 | 수용(deco). 3b2에서 크기를 키웁니다(§5-6) |
| 85 공포 `rotate: 'face'` + `facing` | 수용 |
| 86 약화 매듭 | 수용. R3 |
| 87 얼룩 청록 | 수용(결정 ②) |
| 88 헤맴 청록 리본 끝 | 수용. 판독은 F1 |
| 89 R1 깃대 획 둘 | 수용 |
| 90 결정 ② SPEC | 수용. `layers`와 `reducedFlash` 0.5를 렌더로 확인했습니다 |
| 91 version | 수용. 수정판은 `1.0-d3b1-r1`입니다 |

### 5. 3b2에 맞출 것

1. **보존 기준**
   - F1·F2를 3b1-r1로 따로 내면 그 원문 넷이 기준입니다. 3b2에 함께 넣으면 3b1 원문 넷이 기준입니다.
   - 빼는 것: 3b2가 더한 것만, 그리고 stain·fear·crack·pollen 단계 draw. F1·F2를 함께 넣었으면 lost·thorn 조각·단계도 뺍니다.
   - 새 SPEC은 `SPEC.gimmick`·`SPEC.overlay` 아래 새 하위 키로만 넣습니다.
2. **예산**: 남은 것은 64장·90,620이고, 계획은 35장·46,440입니다.
3. **사건 고리**(stainBurst r70, dabBurst r50, crackBurst r90, fear r160, 꽃가루 r50, 메아리 1.4R)
   - 중심선은 정확히 R입니다(V4).
   - 고른 닫힌 고리는 금지입니다. 청록은 1/3 이하입니다.
   - 공포 고리는 적 예고의 붓 점선 테·물방울 붓 머리(지시서 `:317`)와 갈려야 합니다.
4. **균열 터짐의 금**: 종이 금 `[[ink,3],[p50,1.4]]`(밝은 선)으로 그립니다. 흑백에서 K11 shock 예고의 어두운 금과 갈려야 합니다.
5. **결 가속 `haste`와 되받은 탄 `deflect`**
   - `haste`: y −34~−11(C7 2줄 hero), 결을 가리지 않습니다.
   - `deflect`: 판정 r 7(K9 §4.2). 먹알 + 종이 점(적 탄, `:320`)으로 읽히지 않게 하고, 산호를 쓰지 않습니다.
6. **꽃가루 포자**
   - 반지름 약 2.4(1배 약 5px)로 키웁니다.
   - 몸은 밝게(청록 + allyG가 대부분), 반짝임은 가운데에서 비키게, 꼬리는 없게 합니다.
   - 그래서 흑백에서 '검은 점(기절)'이 아니라 '밝은 알갱이'로 오르게 합니다.
   - pollen 단계가 3b2에서 어차피 바뀌므로 함께 합니다.
7. **확인**
   - C5: PRI 2 전부, 이름표 판과 BLIND 판, 1배·흑백. T4 90% 이상
   - C13: 14키 + 정예, 기절 점, xp, 동전 칸. 1배·4배·흑백
   - C12: P2 사건이 든 군중
   - C2, C6~C10, 보존 해시
8. **API**: §14를 3b2까지 넓히고 §13 클린업 목록을 갱신합니다.

### 6. 메인 세션 굽기·등록 주의

- **굽기**
  - 3b1은 F1·F2가 들어간 판(3b1-r1 또는 3b2)으로만 굽습니다.
  - 새 키 36장(납품서 §6 목록)을 굽고, 기존 키 `afx/crowFeathers/crow/0~5` 6장은 R1 때문에 다시 굽습니다.
  - 316장, 549,380입니다.
- **렌더러**(API §14.10)
  - 지금의 `drawAwakenedMarks`(먹 점, 청록 다각형)를 오버레이로 바꿉니다.
  - 층: head = overheads, 서리 수·묶임·가시 = front(그 몸 바로 뒤), 동결 뒤쪽 = groundMarks
  - `priority.heads`·`feet`로 적 하나에 하나씩 둡니다.
  - 상한: heads·feet 24/16/8, crows 12/8/4, spores 16/8/0
  - stack: 얼룩 1~3, 균열 1~5, 서리 1·2
  - 균열판은 보스에 늘 그리고, 다른 표식이 있으면 x + 26
  - 공포 방울은 적이 보는 쪽에 따라 반전합니다.
  - minimal에서는 헤맴과 포자를 그리지 않습니다.
- **개기일식**: 검수 5차에서 손으로 정한 값 대신 이제 `SPEC.gimmick.eclipseHalo.layers`와 `reducedFlash`를 읽습니다.
- **엔진 필드**: `awk.stain`·`stainUntil`, `fear`, `weak`, `wander`, `crack`(보스), `pollen`, `frost`(겹 수), `bound`(새), `thorn`
- **test:visual에 더할 장면**
  - 1024x720 DPR1을 꼭 넣습니다.
  - 머리 표식 종류별 적 + 정예 + 기절 + 근처의 동전·xp
  - 작은 적(r12)과 큰 적의 발 오버레이
- **지시서 정정**
  - §4.3 표 `:876-881`: 서리 1·2와 가시의 층을 front로
  - 얼룩 줄에 '청록: 젖은 먹 반짝 호(§1.7 :298)'를 더합니다.

### 7. 미확인

- **해시**: 3a-r1 쪽 '까마귀까지 뺀' 두 값(`mk33bj`, `rq8mbn`)은 작가가 고치기 전 코드에서 잰 값입니다. 코드가 바뀌어 제가 다시 잴 수 없습니다. 지금 쪽 값과 spec·parts가 같은 것은 확인했습니다.
- **기절 점**: 제 대조 렌더의 기절 점은 점 셋으로 그린 근사이고, 게임의 실제 그림이 아닙니다.
- **게임에 연결한 화면**: 움직이는 헤맴·포자의 판독, 공포 반전, 군중 속 균열판, 12 등급 발 오버레이(실제 DPR1 화면)
- **그 밖**: 정식 판독 시험(n ≥ 8), 성능, 팩 바이트

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js` (`:2251-2408` 3c, `:2317-2331` lost, `:2381-2408` thorn, `:2284-2293` stain)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md` (`:740-751` §12-81~91, `:963-1032` §14.10)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md` (`:297`, `:298`, `:308`, `:317`, `:320`, `:862-909`, `:1059`)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md` (3b1 납품서 `:3245-3563`)

## K10 3차 2회 2/2 납품서

**3b2: 각성 기믹 P2의 이어지는 효과 + 검수 7차 F1·F2·R2·R4·§5-6 · `SPEC.version` `1.0-d3b2`**

kit-artist, 2026-10-19. 검수 7차 수정(F1·F2)과 권장(R2·R4), §5-6(포자)을 3b2에 함께 넣었습니다. 3b1은 아직 굽지 않았으므로 3b1 36장과 3b2 38장을 한 번에 구우면 됩니다.

**검수자가 먼저 볼 것**
- **검사**: `--check`는 모두 ok, kit error 0건입니다. C2·C6·C7·C8·C10은 기준 안이고, C9 지시서 명령의 출력은 3b1과 같습니다.
- **보존 해시**: 넓힌 식으로 잰 다섯 값(stamps, draw, spec, parts, overlays)이 3b1 코드에서 먼저 잰 기준과 모두 같습니다(§7).
- **판단 요청 둘**
  - 공포 고리의 종이 띠(p50 α0.85, 폭 3, 0.45초)를 C10의 면으로 세지 않았습니다. 면으로 센다면 기준을 넘습니다(§9-4).
  - F1 헤맴은 처방보다 조금 작고(k·1.6, 궤도 4.7), 4장의 움직임이 반 바퀴 돌기에서 흔들기로 바뀌었습니다(§9-13).
- **지시서와 다르게 한 것 중 셋**
  - 균열 터짐 가운데 조각 `crackBurst` 3장을 더했습니다. §4.4 표에는 없고 본문에만 있습니다.
  - 가지창 `fork`의 place는 `point`입니다(지시서 `origin`). `origin`이면 C7 2줄이 실패합니다.
  - 꽃가루 고리·메아리의 청록은 1/3 이하로 줄였습니다(검수 7차 §5-3을 지시서 값보다 앞세움).

**고친 파일 둘**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`
  - 머리말과 납품 표, §3 opts(`share`, 3b2의 `points`·`context`), §4 META, §5, §10, §11, §12-92~118, §13, §14.10 수정 행
  - 새 §14.11: 단계, 조각, 그림, SPEC, 식, 층·LOD·상한, jit, 참고 합성, C9 벡터

#### 1. 만든 것과 done 목록

**코드 위치(k-arsenal-fx.js)**

| 무엇 | 줄 |
|---|---|
| 머리 주석 | `:3-13` |
| `GSTAGE2`(새 단계 15), `GOBJECT` 새 4 | `:390-400` |
| `SPEC.version` | `:404` |
| `SPEC.gimmick` 새 키 20 | `:558-592` |
| 조각 표: `stainBurst`, `pollenPuff`, 새 그룹 4 | `:695-720` |
| 조각 표: 기존 그룹 끝(`crackBurst`, `caltrop-snap`, `bump`, `haste`, `fork`, `deflect-*`) | 각 그룹 끝 |
| 검수 7차 수정: R2 얼룩 | `:2357-2367` |
| 검수 7차 수정: F1 헤맴 | `:2392-2413` |
| 검수 7차 수정: §5-6 포자 | `:2415-2428` |
| 검수 7차 수정: R4 서리(`FROST`) | `:2436` 안팎 |
| 검수 7차 수정: F2 가시 | `:2467-2500` |
| 새 그림 §3d | `:2502-2811` |
| `paths` 3b2 | `:3256-3280` |
| `ctxEnemy`의 `heads` 인자, `ctxHero` | `:3748-3759` |
| `MARK_EVENT`·`EVENT_CTX`·`markEvent`·`drawMarks` | `:3813-3850` |
| `eventRing`·`tornRing`·`crackLines`·`drawCracks`·`kinkPts`와 새 단계 15 | `:3924-4216` |
| `drawGimmick` 분기 | `:4218-4232` |

**공개 API에 생긴 것**
- `groups` 35 → 39: brushQuills, sealArrows, thunderNeedles, tailGuard
- `overlays`는 14키 그대로입니다.
- 새 opts `share`(묶인 사슬)
- 조각 316 → **354장**, 박스 넓이 549,380 → **603,884**

**새 단계 15(우선 2, done.gimmick ✓)**

| 무기 | 단계 | 비고 |
|---|---|---|
| brushQuills | dab | 이번에 처음 done |
| sealArrows | topple | 이번에 처음 done |
| thunderNeedles | leap | 이번에 처음 done |
| tailGuard | rear | 이번에 처음 done |
| inkPulse | bump | 주 단계가 있던 무기, 기믹 done은 처음 |
| thunderclap | echo | 위와 같음 |
| clusterPots | split | 위와 같음 |
| sparkThread | rewind | 위와 같음 |
| stormThread | amplify | 위와 같음 |
| frostChainlet | link | 위와 같음 |
| inkLance | branch | 위와 같음 |
| wideBrush | resweep | 위와 같음 |
| inkOrbit | deflect | 위와 같음 |
| meteorBrush | haste | |
| pinHail | snap | |

- 3b1 단계 넷(stain, fear, crack, pollen)에는 사건(터짐·고리)을 더했습니다.
- 해바늘은 규칙만 있습니다(`SPEC.gimmick.sunNeedles.scale`). 단계가 없어 done.gimmick은 false입니다.
- P2 단계는 모두 24개입니다.

#### 2. 무기별 요약

| 무기 / 단계 | 물건·도형 | 청록 |
|---|---|---|
| 먹침 / stain | `stainBurst`: 종이 테를 두른 얼룩 몸이 터지고, 테 없는 먹 팔과 방울이 나간다. 1장은 테를 두른 조각 넷, 2장은 땅에 누운 ink700. 고리 r70은 stroke [[ink,3.2],[p50,1.2]], 틈 3~4 | 젖은 반짝 호, 고리 core 60~100° |
| 붓깃 / dab | `dab`: 들쭉날쭉한 먹 웅덩이에 펜촉 획, 대기 0.6초 동안 부푼다. `dabBurst`: 곧은 펜 튐 여섯과 깃 날개 조각. 고리 r50은 band ink 2.4~5, 틈 3 | 펜촉 획, core 40~70° |
| 인장 화살 / topple | K9 인장 머리(종이 덩이 + 먹 인면 띠)가 28° → 62° 넘어지고, 부딪힌 자리에 찢긴 종이 터짐 | 인면 테 |
| 뇌침 / leap | kink 번개(n 3~8, 옆 3~8 번갈아, [[ink,3.4],[ally,1.8],[allyG,0.6]])와 `leapHit`(꺾인 가지 셋 + 작은 종이 섬광) | 번개 심 |
| 망나니 침 / fear | r160 찢긴 종이 띠(p50 3, 먹 테 1.2, 안쪽 찢김), 찢어진 곳 둘, 0.4R → R을 0.15초, α0.85. 점선·물방울 머리 없음 | 없음(지시서대로) |
| 먹꽃 / pollen | r50 먹 점선 [4,5] + `pollenPuff`(밝은 알갱이 여섯) | core 60~100°에만 청록 점선 |
| 꼬리 방패 / rear | 둥근 날밑 단검과 종이 베기, 1장에서 베기 둘(엇갈림, ✕ 아님) | 손잡이 끝 리본 |
| 보스 사냥침 / crack | `crackBurst`(판 파편 + 찢긴 섬광), 고리 r90 stroke [[ink,3.4],[p50,1.6]], 종이 균열선 6~8([[ink,3],[p50,1.4]], ≤ 0.9R, 갈래 하나) | 고리 core 70~110°, 균열선 둘, 파편의 새 금 |
| 먹 파동 / bump | 둥근 충격(먹 덩이 + 찢긴 섬광)과 검은 띠 조각(회전 없음) | 띠 앞선 |
| 천둥 박수 / echo | 1.4R jag [[ink300,3.4],[p300,1.2]] α0.75, 틈 둘, 손 없음 | core 80~110°에만 |
| 송이 단지 / split | `mini` 둘이 ±60으로 lobMini 0.35초, `burst` + 송이 단지 고리 0.6R(평상) | 고리 |
| 불꽃실 / rewind | sag −0.16 [[ink,2.6],[ally,1.4],[allyG,0.5]], 꼬리에서 머리로, 닿은 적에 `spark` | 실 |
| 폭풍실 / amplify | 구간 i마다 굵기 ×(1 + 0.15i), 진폭 ×(1 + 0.1i), i ≥ 3이면 `gust-b` | 가닥 |
| 서리 사슬 / link | 구성원 사이 links pitch 20, α0.45, 공유 피해 뒤 0.18초는 α1 | 구간 가운데 고리 |
| 먹창 / branch | 창 끝에서 ±35°, 0.4L 가지 창(술 없음, 창날 ×0.85, 캡슐은 0부터) + `fork` | 매듭 띠 |
| 넓은 붓 / resweep | 같은 띠 α×0.65, 머리가 먼 끝에서 결 쪽으로, 붓 좌우 반전 | 앞선 |
| 먹 궤도 / deflect | 종이 파편 혜성(각진 머리: 앞끝 +8.6, 옆 ±5.2, 꼬리 −22), 산호 없음 | 소용돌이 획 |
| 유성 붓 / haste | 결 발 뒤로 감아 오르는 청록 띠 둘 + 종이 별가루, y −32.7~−12, 자국 테는 inside | 띠 |
| 핀 우박 / snap | 땅에 납작한 찢긴 섬광, 부러진 핀 반쪽 둘 | 날 홈 |

**검수 7차 수정**
- **F1 헤맴**: 층은 처방대로 앞 [[ink,3.4],[p300,1]], 뒤 [[ink,2.8],[ink300,0.8]]입니다. 크기는 컬 k·1.6, 궤도 4.7입니다. 4장 동안 쌍이 0→13→25→13°로 흔들리며 각 컬이 돕니다. 열린 끝은 늘 바깥이고 리본은 [ink 2.2, ally 1.2, allyG 0.4]입니다.
- **F2 가시**: 먹 몸에 볼록 가장자리를 따라 종이 띠(0.25b → 0), 먹 외곽 1.2입니다. 앞 가시 높이는 6.4/7.6/9.6/11.6/13.6이고, 곁 가시는 그 0.78·0.62배, 밑동은 높이의 0.75배입니다. 앞 가시가 가장 낮고 셋이 얕은 호에 놓입니다. 청록 심은 앞 가시로 옮겼습니다.
- **R2**: 얼룩 1은 amp 0.34, rx 1.15r, ry 0.85r입니다.
- **R4**: 서리 1의 r12 키는 5.6입니다.
- **§5-6 포자**: 반지름 2(박스 10×14 − 3 안의 최대, 먹 테까지 약 5px), allyG 몸, 반짝은 비켜 둠, 꼬리 없음입니다.

#### 3. C 검사 출력 원문

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/`. 명령은 모두 단일 `node scripts/art-review-sheet.mjs …`입니다.

- **C1** `k10-c1-all-d3b2`: `ok`

**C2** `k10-c2-parts-d3b2`(첫 줄과 새 줄)
```
frames=354 ok boxArea=603884 ok badParts=0
inkDarts/stainBurst f3 prog 0.3s box64x52 a32,30 center none ally info w:event
brushQuills/dab f3 prog box28x18 a14,9 target none ground info w:pending
brushQuills/dabBurst f3 prog 0.24s box52x40 a26,24 center none ally info w:event
sealArrows/topple f2 prog 0.16s box32x28 a16,14 event none ally deco w:event
thunderNeedles/leapHit f2 prog box24x24 a12,12 point none ally deco w:chain
inkBloom/pollenPuff f3 prog 0.3s box36x28 a18,18 target none ally deco w:event
pinHail/caltrop-snap f2 prog 0.15s box44x30 a22,19 center none ally deco w:event
tailGuard/rearHit f3 prog 0.2s box40x32 a20,18 target none ally deco w:event
bossbane/crackBurst f3 prog 0.3s box56x48 a28,30 center none ally info w:event
inkPulse/bump f2 prog 0.16s box32x32 a16,16 event none ally deco w:event
meteorBrush/haste f4 loop@12 still0 box52x40 a26,36 hero face front info w:status
inkLance/fork f2 prog 0.2s box28x28 a14,14 point beam ally deco w:event
inkOrbit/deflect-start f2 prog 0.06s box40x18 a27,9 air vel ally info w:vel
inkOrbit/deflect-travel f2 loop@12 still0 box40x18 a27,9 air vel ally info w:vel
inkOrbit/deflect-end f2 prog 0.1s box40x18 a27,9 air vel ally info w:vel
```

**C6** `k10-c6-scan-d3b2`
```
calls=516 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0
bad={} banned: nocyan: tokens:
```

**C7** `k10-c7-geometry-d3b2`(마지막 상태)
```
1 stamps outside box-3: 0
2 head objects below their anchor: 0 | feet overlays outside their rect: 0 | hero overlays in the face zone or over the foot ring: 0 | origin stamps within 26 of the hero: 0
3 layout placements off their shape: 0
4 lob paths wrong: 0
5 invalid calls ok
```

**C8** `k10-c8-unchanged-d3b2`
```
fixed: k4=taptby/681935 icons=10absaa/1414173 enemies=1eysntd/554335 hero=v9hbkt/51244
in-flight (before -> after must match): k9 n4n4y2/2117692 -> n4n4y2/2117692 same | k11 bvf9fj/934797 -> bvf9fj/934797 same | fixed set same
PN keys same: C,_hk,_ki,arsenal,arsenalFx,bombers,bossesA,bossesB,bossesC,characters,defs,enemies,env,fieldBosses,halftone,hazards,heroKit,icons,rng,skillVfx,speedLines,splat,story,taper,tapers,vfx
arsenalFx calls: 488
```

**C9**
- 지시서 명령 `k10-c9-count-d3b2`: `C9 lines=69 text hash=19cnic1 len=8948`(3b1과 같음)
- 3b2 단계 벡터 `k10-c9b-vectors-d3b2`는 31줄입니다. 원문은 API §14.11에 있습니다. 대표 줄:
```
inkDarts/stain path gaps [[8.78,25.06],[186.99,198.45],[276.21,291.87]]
inkDarts/stain path core [[65.16,162.84]]
thunderclap/echo path core [[195.48,275.72]]
thunderNeedles/leap path kink [[0,-14],[23.03,-17.91],[39.85,-33.5],[70.93,-32.69],[83.7,-49.31],[118.37,-48.86],[132.47,-61.49],[162.94,-62.53],[180,-74]]
bossbane/crack path coreLines [[0,8],[4,8]]
inkLance/branch path tips [[849.7,-146.84],[849.7,146.84]]
clusterPots/split path mini [[15,-21],[30,-28],[45,-21]]
```

**C10** `k10-c10-contrast-d3b2`
```
fills=24 fail=0 (persistent over 0.3 s: Y max 0.62; brief: Y max 0.69; hero coat Y 0.902, contrast min 1.25)
```
- 채움 줄을 더하지 않았습니다(§9-4).

**C5·C12·C13·C15**(모두 ok)
- C5: `k10-c5-gimmicks-p2-d3b2`(이름표, 24칸), `-blind-gray-d3b2`
- C13: `k10-c13-marks-d3b2`, `-gray-d3b2`, `-d3b2-x4`
- C12: `k10-c12-scene-p2-d3b2`, `-gray-x08-d3b2`
- C15: `k10-c15-pairs-d3b2`

**다시 돌리지 않은 것**
- C3·C4·C11·C14: 주 단계, 비행, 땅 조각이 바뀌지 않았습니다(제한 draw 해시가 같음).

#### 4. 직접 본 렌더

| 배율 | 렌더 |
|---|---|
| 1배 | `k10-c5-gimmicks-p2-d3b2`, 칸 확대 `k10-c5-p2-crop-a~d`, `k10-c13-marks-d3b2`, `k10-c12-scene-p2-d3b2` |
| F1·F2 합격 판(검수 7차와 같은 짜임) | `k10b2-feet7-x1`(발 일곱 + 없음 × 1·3·5장 × 색·흑백), `k10b2-heads-x1`(머리 표식, 포자, 균열판, 정예, 기절 점, xp, 동전, 회복, 자석) |
| 0.6·0.8배 흑백 | `k10-c5-gimmicks-p2-blind-gray-d3b2`, `k10-c12-scene-p2-gray-x08-d3b2`, `k10-c13-marks-gray-d3b2` |
| 확대 | `k10b2-feet7-zoom-x4`, `k10b2-heads-lost-x6`, `k10b2-lost-x8d`(헤맴 장별, 박스 − 3, 색·흑백), `k10-c13-marks-d3b2-x4` |
| 새 조각 | `k10b2-new-parts-x3`·`-x3b`·`-x3c` |
| 고리 | `k10b2-rings-x2`, `k10b2-dabring-x5` |
| LOD·감소 설정 | `k10b2-variants`(588호출) |
| 대조 | `k10-c15-pairs-d3b2` |

**고친 시안**
- 얼룩 터짐: 팔·방울까지 종이 테를 두르니 분자 모형으로 읽혔습니다.
- dab: 꼬리와 점을 단 덩이가 눈 달린 물고기로 읽혔습니다.
- 되받은 탄: 가운데 소용돌이는 눈으로, 말린 고리는 'G'로 읽혔습니다.
- 결 가속: 말려 돌아오는 띠는 'C'·초승달로, 가운데가 두꺼운 띠는 잎으로 읽혔습니다.
- 인장: 꼭지를 단 덩이가 병으로 읽혔습니다.
- 부딪힘: 위쪽 호가 눈썹으로 읽혔습니다.
- dab 고리: 이웃한 틈 둘이 'C'를 만들어 틈을 셋으로 바꿨습니다.

#### 5. 자가 판정

**T4 기믹(C5, 24칸)**
- 이름표 판 1배에서 24칸이 모두 §4.1 표의 그림과 맞습니다.
- BLIND 흑백 0.6배에서 22~24/24로 판단합니다(≥ 90%).
- 약점
  - 마름쇠 꺾임은 작은 deco 조각입니다.
  - 되감김은 꼬리에서 머리로 가는 방향이 움직임에서만 보입니다.
  - 12 등급의 묶임·가시는 작습니다.

**T5 표식(C13, 1·4배, 흑백)**
- 헤맴: 먹 테 컬 둘이 1배에서 보이고, 기절 점 셋·약화 아치와 갈립니다.
- 포자: 흑백에서 밝은 알갱이입니다(기절 점은 어두움).
- 가시: '발치의 어두운 갈고리'이고, 서리 1·2(흰 결정)와 명도로 갈립니다. 셋이 한 줄로 서지 않습니다.
- 얼룩 1과 동전은 명도가 반대입니다.

**T6 혼잡(C12, 상한대로 P2를 더한 스트레스 판)**
- 결, 산호 적 탄, 호박 예고가 그대로 읽힙니다.
- 새 고리는 가는 선입니다. 가장 밝은 새 요소는 공포 고리입니다(r160, 0.45초).

**T7**: 땅 조각이 바뀌지 않아 해당이 없습니다.

#### 6. 메인 세션 등록값

**굽기**(HEAD 스냅숏): 354장, 603,884
- 3b1 새 키 36장. 그중 `lost`, `thorn*`, `mark-stain1`, `frost1-12`, `spore-a/b`는 이번에 고친 그림입니다.
- `afx/crowFeathers/crow/0~5` 다시 굽기
- 3b2 새 키 38장
  - `afx/inkDarts/stainBurst/0~2`
  - `afx/brushQuills/dab/0~2`, `dabBurst/0~2`
  - `afx/sealArrows/topple/0~1`
  - `afx/thunderNeedles/leapHit/0~1`
  - `afx/inkBloom/pollenPuff/0~2`
  - `afx/pinHail/caltrop-snap/0~1`
  - `afx/tailGuard/rearHit/0~2`
  - `afx/bossbane/crackBurst/0~2`
  - `afx/inkPulse/bump/0~1`
  - `afx/meteorBrush/haste/0~3`
  - `afx/inkLance/fork/0~1`
  - `afx/inkOrbit/deflect-start|travel|end/0~1`
- 새 그룹: brushQuills, sealArrows, thunderNeedles, tailGuard

**애니메이션**
- loop: `deflect-travel` 12fps still 0, `haste` 12fps still 0
- 나머지 3b2 조각은 prog입니다(seconds는 C2). `dab`은 대기 진행률, `leapHit`은 연쇄 창입니다.

**매니페스트**
- `SPEC.gimmick` 새 키 20
- 새 window 값 `vel`

**렌더러**(API §14.11)
- 사건 고리 다섯 prim(stroke·band·torn·dashed·jag: 틈, core만 청록, 각성 선 없음)
- 균열선, kink, 되감김, 증폭, 묶인 사슬(`share`), 가지창(캡슐은 0부터), 되쓸기(반전, α0.65)
- 되받은 탄(+x = 속도), 결 가속(결 몸 바로 뒤, face 반전, 자국 테 inside)
- 갈라짐(lobMini + burst + 0.6R 고리), 해바늘 배율(≤ 1.6)
- 상한: `caps.events` 16/10/4, `pollenRings` 8/4/0, `links` 120/60/0

**엔진·표시 자료**(지시서 §9-3)

| 자료 | 무기 |
|---|---|
| 얼룩·균열 터짐 `area/blast` echo | inkDarts, bossbane |
| `pending` 붓자국(자리, born, 0.6) | brushQuills |
| `enemy/stunned` source와 부딪힌 자리 | sealArrows, inkPulse |
| 도약 점 둘 | thunderNeedles |
| 처형 자리 | headsmanDarts |
| 꽃가루 틱 | inkBloom |
| 뒤쪽 명중 표시 | tailGuard |
| 메아리 blast | thunderclap |
| 작은 단지 pending 둘 | clusterPots |
| 되감김 echo | sparkThread |
| 구간 번호 | stormThread |
| 새 `awk.link`(구성원, 공유 시각) | frostChainlet |
| 가지 BeamEffect 둘 | inkLance |
| 되쓸기 echo | wideBrush |
| 되받은 탄 표시·나이 | inkOrbit |
| 결이 자국 안 | meteorBrush |
| 마름쇠 발동 | pinHail |
| `shot.radius` | sunNeedles |

**지시서 정정**
- §4.4 표에 `crackBurst` 줄을 더합니다.
- `fork`의 place를 `point`로 고칩니다.
- `ring.*`·`line.*` 이름을 `SPEC.gimmick` 키로 바꿉니다(§12-92).
- 꽃가루·메아리 청록을 core에만 둡니다.

#### 7. 보존 해시 결과

검수 7차 §3 끝 `k10-keep-3b1-r1`을 넓힌 식입니다. 같은 식을 3b1 코드에서 먼저 쟀고(`k10-keep-3b2-base`), 같은 3b1 코드에서 검수서 식은 `1d1pfw/759026`, `i29rer/5642637`, `18o4se4/846311`로 검수서 값과 같았습니다.

**뺀 것과 이유**
- **3b2가 더한 것**
  - 새 그룹 4개
  - 기존 그룹 끝 part 10개(`stainBurst`, `pollenPuff`, `crackBurst`, `bump`, `fork`, `deflect-*`, `haste`, `caltrop-snap`)
  - 새 단계 15
  - SPEC `version`과 `gimmick`의 새 키 20
- **사건을 더한 단계**: stain, fear, crack, pollen의 draw
- **검수 7차로 고친 조각**: `lost`, `thorn*`(F1·F2), `mark-stain1`(R2), `frost1-12`(R4), `spore-a/b`(§5-6). 포자는 지시자 목록에 없지만 검수 7차 §5-6이 요청한 변경입니다.
- **그 조각을 쓰는 단계와 오버레이 조합**: 단계 `lost`·`thorn`, 오버레이 `lost`·`thorn`·`pollen` 전부, `stain` stack 1, `frost` r12 stack 1

| 측정 | 3b1 코드 | 3b2 코드 |
|---|---|---|
| stamps | `1h66c1i/754425` | 같음 |
| draw | `ob7a83/5582105` | 같음 |
| spec | `p3d9vk/18629` | 같음(= 3b1 원문) |
| parts | `1fawmjd/28554` | 같음(= 3b1 원문) |
| overlays | `1c7d5xg/807605` | 같음 |

**원문**(아무것도 빼지 않음, `k10-keep-3b2-final`). 다음 회차의 기준입니다.

| 항목 | 값 |
|---|---|
| stamps | `l0nap6/878803` |
| draw | `8crhz3/7063925` |
| spec | `128ji9u/22506` |
| parts | `qxfght/31609` |
| overlays | `1umqwpr/1079940` |

- version `1.0-d3b2`, 그룹 39, 단계 67

**명령**: `k10-keep-3b2-final`의 식(위 목록대로 건너뜀)을 그대로 다시 돌리면 됩니다. 넓힌 식의 3b1 쪽 값은 3b1 코드에서만 잴 수 있어, 검수자가 지금 코드에서 다시 잴 수는 없습니다.

#### 8. 사람 클린업

- 사건 조각의 붓 질감: 먹 튐, 찢긴 섬광, 파편, 펜 튐, 깃 조각, 인장 덩이, 단검, 균열판 파편, 되받은 탄 머리·꼬리, 결 가속 띠, 핀 반쪽
- 1배 픽셀 다듬기: `leapHit`, 꽃가루 알갱이, 헤맴 컬(약 8px), 12 등급 가시(6.4)·서리 수
- 공포 띠의 찢김과 꽃가루 점선의 붓 질감
- 검수 7차 R3(약화 매듭)과 균열판 1~2의 첫 금(✉로 읽힘)은 사람 몫으로 남겼습니다.
- 문화 검토: 배후 응징(종이 베기, 피 없음), 인장(글자 없음)

#### 9. 지시서와 다르게 한 것 (API §12-92~118)

1. **SPEC 자리**: 모든 새 SPEC을 `SPEC.gimmick[id]`에 넣었습니다(대응표는 §12-92). `layout`·`fills`는 늘리지 않았습니다.
2. **`crackBurst` 추가**: 3장, 8,064.
3. **사건 고리**: 꽃가루·메아리의 청록을 core에만 두었습니다. 층이 없던 세 터짐 고리는 층을 정했습니다. 공포 고리에는 청록이 없습니다. 사건 고리에는 각성 선과 coreScale을 쓰지 않습니다.
4. **C10(판단 요청)**: 되쓸기는 α0.29라 기존 줄보다 어둡습니다. 공포 띠는 선으로 보았습니다. 면이면 α나 폭을 바꿔야 합니다.
5. **해바늘**: 규칙만 있고 단계·C5 칸이 없습니다.
6. **`fork`의 place = `point`**: C7 origin 규칙 때문입니다.
7. **window**: event, pending, chain, vel, status
8. **되쓸기**: 같은 축에서 먼 끝 → 결로 돌아오는 띠, 붓 좌우 반전, seed + 500
9. **가지창**: 창이 끝에 닿은 뒤 시작, 창날 ×0.85
10. **되감김·증폭·묶인 사슬·kink 식**: §12-101~104
11. **갈라짐 참고 자리**: ±60을 x축 위에 둡니다.
12. **그림을 고친 이유**: 결 가속·되받은 탄·dab·얼룩 터짐·인장·부딪힘을 고친 이유는 §4 '고친 시안'과 같습니다.
13. **F1**: k·1.6, 궤도 4.7('안팎'). 반 바퀴 돌기는 90° 장에서 두 컬이 겹쳐 한 덩이가 되고, 43°에서는 맞닿아 흔들기로 바꿨습니다. 4장·loop 8·deco·박스·앵커·리본은 그대로입니다.
14. **F2 갈고리 방향**: 3b1 그대로(곁 둘은 안쪽, 앞은 오른쪽)입니다. 검수서의 '둘은 바깥' 서술과 다를 수 있습니다. 청록 심은 앞 가시로 옮겼습니다.
15. **포자**: 박스를 그대로 두어 반지름이 2입니다(2.4가 꼭 필요하면 박스를 12×14로 넓혀야 함).
16. **참고 합성(context)**: 몸 → 사건 → 머리 표식 순으로 그립니다. 연쇄는 점 6개, 빔은 300·380으로 줄였습니다.
17. **`drawZone` 내부 옵션 `inside`**: 기존 출력은 그대로입니다.
18. **version**: `1.0-d3b2`

#### 10. 알려진 한계

- 실제 렌더러·DPR1 화면(움직이는 헤맴·포자, 되감김 방향, 사건 상한)은 아직 확인하지 않았습니다.
- 정식 판독 시험(n ≥ 8), 성능, 팩 페이지·바이트는 메인 세션 몫입니다.
- C12는 한 빌드보다 많은 무기를 섞은 스트레스 판입니다.
- C5·C12의 보스 효과는 간수로 대신 그렸습니다.
- 남은 예산은 26장, 36,116입니다.

## K10 검수 8차: 3차 2회 2/2(3b2, `1.0-d3b2`) + P1 연결 캡처, art-director, 2026-10-20

**판정: 수정 후 합격.**
- 고칠 것은 하나입니다(F1). 꽃가루 고리를 지시서의 먹 + 청록 점선으로 되돌립니다.
  - 이 문제는 제 검수 7차 §5-3이 꽃가루 고리까지 '청록 1/3 이하'에 넣어서 생겼습니다.
  - 바뀌는 것은 `SPEC.gimmick.inkBloom.ring`과 pollen 단계 draw뿐이고, 조각(stamp)은 하나도 바뀌지 않습니다.
  - 그래서 메인 세션은 354장 팩을 지금 구워도 됩니다. F1 뒤에는 매니페스트 SPEC만 바꿉니다.
- 검수 7차 수정은 모두 합격 기준을 맞췄습니다: F1 헤맴, F2 가시, R2 얼룩 1, R4 서리 1, §5-6 포자.
- 판단 요청 넷과 다르게 한 것(§12-92~118)은 꽃가루 고리 하나만 빼고 받습니다.
- P1 연결 캡처 일곱 장면(검수 5차 §6-10 (a)~(f))은 합격입니다. 아래 §5에 주의 하나를 적었습니다.

### 1. 확인한 것

렌더 위치: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10r8-*.png`. 모두 `--check` ok입니다.

| 검사 | 결과 |
|---|---|
| 원문 해시(`k10r8-keep`, 제가 다시 짠 식) | stamps `l0nap6/878803`, draw `8crhz3/7063925`, spec `128ji9u/22506`, parts `qxfght/31609`, overlays `1umqwpr/1079940`. version `1.0-d3b2`, 그룹 39. 납품서 §7과 같습니다 |
| 넓힌 식 다섯 값 | stamps `1h66c1i/754425`, draw `ob7a83/5582105`, spec `p3d9vk/18629`, parts `1fawmjd/28554`, overlays `1c7d5xg/807605`. 납품서와 같습니다 |
| 넓힌 spec·parts의 독립 확인 | 제가 검수 7차에 3b1 코드에서 직접 잰 원문(`k10r7-keep`)과 같습니다. 나머지 셋의 3b1 쪽 값은 작가가 잰 값입니다(§6) |
| C2 | `frames=354 ok boxArea=603884 ok badParts=0` |
| C6 | `calls=516`, 모두 0 |
| C7 | 1~4줄 0건, 5줄 ok |
| C8 | 고정 값, k9·k11, PN 키 같음. calls 488 |
| C9 | 69줄, `19cnic1`(8948) |
| C10 | `fills=24 fail=0` |
| 검수 7차 F1·F2 합격 판(`k10r8-heads-x1`, `k10r8-feet7-x1`) | 1배, 1·3·5장, 색·흑백, 검수 7차와 같은 짜임입니다. 결과는 아래 |
| C5 PRI 2 24칸(`k10r8-c5-p2`, 1.5배 자른 판 `-crop1`·`-crop2`) | 이름표 판에서는 24칸 모두 §4.1 그림과 맞습니다. T4 판정은 아래 |
| C12(작가 `k10-c12-scene-p2-gray-x08-d3b2`) | 결, 적 탄, 호박 예고가 그대로 읽힙니다. 새 요소 중 가장 밝은 것은 공포 고리이고, 가는 선입니다 |
| 새 조각 38장 3배(`k10r8-parts-x3`) | 작가가 고친 시안의 문제(분자 모형, 눈 달린 물고기, 'G', 'C')가 지금 그림에는 남아 있지 않습니다 |

**검수 7차 수정 판정**
- **F1 헤맴**: 1배 색·흑백 모두에서 먹 테 두른 곱슬 둘(약 8px)이 보입니다. 기절 점 셋, 약화 아치와 갈립니다. 합격입니다.
- **F2 가시**: 흑백 1배에서 '발치의 어두운 갈고리'로 읽히고, 서리 1·2의 흰 결정과 명도로 갈립니다. 셋이 얕은 호에 놓여 한 줄로 서지 않습니다. 합격입니다.
  - 불먹 덩이(어두운 덩이 + 밝은 심)와는 심이 있느냐로 갈립니다.
- **R2 얼룩 1**: 가로로 넓고 들쭉날쭉한 번짐이 됐습니다.
- **R4 서리 1**: r12 키 5.6입니다.
- **§5-6 포자**: 흑백에서 밝은 알갱이(약 5px)라 검은 기절 점과 갈립니다.

**T4(P2 ≥ 90%, 지시서 `:1059`)는 경계선입니다.**
- 1배 정지 화면에서 블라인드로 맞힐 수 있다고 보는 것은 24칸 중 21~22칸입니다.
- 약한 칸
  - 사건 조각이 작은 셋: 도미노(넘어지는 인장 머리), 마름쇠 꺾임, 밀쳐 부딪힘
  - 되감김: 정지 화면에서는 '꼬리 쪽에만 붙은 덜 그린 선'일 뿐이고, 방향은 움직임에서 보입니다(`k10r8-rewind-ages`)
- 지금 고칠 것은 아닙니다. 정식 판독 시험(n ≥ 8, 움직임 포함)으로 판정합니다.

**1배 판독 위험(요청 4)**
- **되감김 방향**: 꼬리(마지막 적)에서 결 쪽으로 그려 나가고, 결 쪽 26 안은 비웁니다. 움직임에서 읽힙니다.
- **마름쇠 꺾임**: 작지만 '찢긴 섬광 + 부러진 핀 반쪽'으로 마름쇠 자리에 맞습니다(deco).
- **12 등급 묶임·가시**: 1배에서 둘 다 보입니다. 묶임은 청록 점선 호 + 핀, 가시는 어두운 갈고리입니다.
- **공포 고리 대 적 예고 테**(`k10r8-rings-vs-tele`): 공포 고리는 채움 없는 흰 찢긴 띠이고 틈이 둘입니다. 적 예고는 호박 해칭 원판 + 먹 테·눈금, active는 산호 원판입니다. 흑백에서도 해칭 유무와 테 굵기로 갈립니다. 갈립니다.
- **균열 터짐 금 대 K11 shock 예고 금**(같은 판): 균열 터짐은 가는 끊긴 고리 + 밝은 심 금(종이)입니다. shock은 굵은 먹 테 + 눈금 + 호박 심 금이고, 흑백에서는 중간 회색 심입니다. 테 굵기와 금 심 명도로 갈립니다.
- **되받은 탄 대 적 탄**(`k10r8-deflect-haste-x3`): 되받은 탄은 흰 각진 종이 파편 + 청록 소용돌이 획, 적 탄은 먹 테 + 산호 + 먹 심 + 흰 점입니다. 흑백에서도 바깥 명도(흰 대 어두움)와 꼴로 갈립니다.
- **결 가속**
  - 청록 띠 둘이 결 뒤쪽 가장자리에 조금 겹치지만 얼굴 금지 구역과 발밑 링은 비어 있습니다(C7 2줄 0).
  - 결이 여전히 가장 밝습니다.

### 2. 결정

1. **공포 고리 종이 띠(p50 α0.85, 폭 3, 0.45초)를 C10 면으로 세지 않음: 받습니다.**
   - 폭 3의 테는 선입니다. 침묵의 종 고리 `[[ink,5.4],[p50,2.6]]`, 개기일식 바깥 테 같은 종이 획을 C10에 넣지 않은 것과 같은 규칙입니다.
   - 규칙: **폭 3 이하의 테·획은 C10 면이 아니다. 원판, 띠 채움, 폭이 3보다 넓은 것만 센다.**
   - kit-artist는 F1 때 API §14.11에 이 규칙을 한 줄 적습니다.
2. **F1 헤맴이 처방보다 조금 작은 것(k·1.6, 궤도 4.7)과 4장 흔들기: 받습니다.**
   - 1배에서 보인다는 합격 기준을 맞췄습니다.
   - 반 바퀴 돌기의 90° 장에서 두 곱슬이 한 덩이가 된다는 이유가 맞습니다.
3. **F2 갈고리 방향(곁 둘은 안쪽, 앞은 오른쪽): 받습니다.**
   - 검수 7차 처방의 '둘은 바깥, 하나는 안쪽'은 3b1 그림을 잘못 읽고 쓴 서술이라 철회합니다.
   - 안쪽으로 굽은 곁 가시는 '발을 조이는 가시'로 읽힙니다.
4. **포자 반지름 2(박스 그대로): 받습니다.** 흑백 1배에서 밝은 알갱이로 갈리므로 박스를 12×14로 넓히지 않습니다.
5. **`crackBurst` 추가(3장, 8,064): 받습니다.** 지시서 §4.4 본문의 '가운데 조각'을 표에 옮긴 것입니다. 지시서 정정 대상입니다.
6. **`fork` place = `point`: 받습니다.** 렌더러는 이 조각을 주 창 빔 틀의 끝 (L, 0)에 둡니다(§4).
7. **청록을 core에만 둔 것**
   - **메아리: 받습니다.** 회색 jag + 종이 심은 천둥 박수 고리의 '잔향'으로 읽히고, 어떤 적 예고와도 꼴이 다릅니다.
   - **꽃가루 고리: 되돌립니다(F1).** 근거는 아래와 같습니다.
     - 지금 꼴은 r50 고리 대부분이 맨 먹 점선이라 '적 예고의 붓 점선 테'(지시서 §1.7 `:317`)에 가깝습니다.
     - 0.5초마다 적 둘레에 맨 먹 점선 원이 생기면 흑백·색각 사용자에게 '적 범위 공격 준비'로 오독될 수 있습니다.
     - 점선 고리의 아군 문법은 `rim.ally`와 같은 먹 + 청록 샌드위치입니다.
     - 검수 7차 §5-3의 '청록 1/3 이하'는 실선 사건 고리용이었는데 꽃가루 고리까지 넣은 것이 제 잘못입니다.
8. **§12-92~118의 나머지: 모두 받습니다.**
   - SPEC 자리를 모두 `SPEC.gimmick`에 둔 것
   - 터짐 고리 셋의 층, 사건 고리에 각성 선과 coreScale을 쓰지 않은 것
   - 해바늘 배율 규칙만 둔 것
   - window, 되쓸기·가지창·되감김·증폭·묶인 사슬·kink 식
   - 갈라짐 참고 자리, 고친 시안, context 그리는 순서, `drawZone`의 `inside`, version
   - 가지창의 Y(V)자는 자료가 정한 기하(창 끝 ±35°)라 글자 금지 조항의 예외로 봅니다.

### 3. 고칠 것 (kit-artist, `k-arsenal-fx.js`·`API-arsenal-fx.md`만, `1.0-d3b2-r1`)

**F1. 꽃가루 고리를 먹 + 청록 점선 샌드위치로**

처방:
- `SPEC.gimmick.inkBloom.ring`
  - 지시서 값으로 돌립니다: dashed, layers `[[ink,1.6],[ally,1]]`, dash `[4,5]`, pad 0.6. 지시서 `docs/art/briefs/arsenal-fx.md:909`.
  - 틈 둘(16~28°), grow 0.6 → 1 / 0.25초, 수명 0.45, fade 0.6은 그대로입니다.
  - 따로 둔 `core`는 지우거나 쓰지 않습니다.
- 점선 고리 그리기(사건 고리 dashed prim, API §14.11 'dashed')
  - 틈 사이 호마다 먹 점선 위에 같은 위상의 청록 점선을 고리 전체에 겹칩니다.
  - 샌드위치 규칙(§1.5 `:218`)대로, 먹 층의 대시를 양 끝으로 0.6씩 늘립니다.
- API §14.11 'dashed' 식과 표의 꽃가루 줄을 고치고, §12에 되돌린 까닭을 적습니다.
- 위 결정 1의 C10 규칙 한 줄도 같은 API 수정에 넣습니다.

합격 기준:
- `k10r8-rings-vs-tele`와 같은 판(1배, 1장, 색·흑백, 적 예고 preview·imminent·active r50 옆)에서 보이는 것
  - 색: 꽃가루 고리가 고리 전체에서 청록 점선으로 읽힙니다.
  - 흑백: 점선마다 밝은 심이 보여, 적 예고의 맨 먹 점선·해칭과 갈립니다.
- C6 0건, C7 0건, `--check` ok
- 보존 해시
  - 그대로여야 하는 값
    - stamps `l0nap6/878803`, parts `qxfght/31609`, overlays `1umqwpr/1079940`
    - draw without inkBloom/pollen `1skcben/7041757`
    - spec without gimmick.inkBloom `1ba8cfh/22210`
  - 바뀌는 것은 raw draw·spec뿐입니다.
  - 고친 뒤의 원문 다섯을 다음 기준으로 적습니다.

```
node scripts/art-review-sheet.mjs expr --name k10-keep-3b2-r1 --scale 1 --crop 0,0,1700,140 --expr '(function(){var X=PN.arsenalFx;function norm(m){return String(m).replace(/\bkaf\d+_/g,"kaf_");}function h(s){var x=5381;for(var i=0;i<s.length;i++){x=((x*33)^s.charCodeAt(i))>>>0;}return x.toString(36)+"/"+s.length;}var A="",B="",B2="",O="";X.groups.forEach(function(g){X.parts(g).forEach(function(p){for(var f=0;f<p.frames;f++)A+=norm(X.stamp(g,p.part,{frame:f}));});});X.ids.forEach(function(id){(X.META[id].stages||[]).forEach(function(st){[false,true].forEach(function(aw){[1,5].forEach(function(lv){[0.1,0.5,0.9].forEach(function(p){var m=norm(X.draw(id,st,{level:lv,awakened:aw,p:p,t:p*0.3,seed:7}));B+=m;if(!(id==="inkBloom"&&st==="pollen"))B2+=m;});});});});});X.overlays.forEach(function(k){[12,19,28,38,54].forEach(function(r){[1,2,3].forEach(function(stk){[0,0.3].forEach(function(t){O+=norm(X.overlay(k,{r:r,top:-30,t:t,stack:stk}));});});});});var S=JSON.parse(JSON.stringify(X.SPEC));delete S.version;var C0=JSON.stringify(S);delete S.gimmick.inkBloom;var C1=JSON.stringify(S);var L=["stamps="+h(A)+" parts="+h(JSON.stringify(X.groups.map(function(g){return X.parts(g);})))+" overlays="+h(O),"draw raw="+h(B)+" | without inkBloom/pollen="+h(B2),"spec raw="+h(C0)+" | without gimmick.inkBloom="+h(C1)+" version="+X.SPEC.version];return "<rect width=\"1700\" height=\"140\" fill=\"#fff\"/>"+L.map(function(t,i){return "<text x=\"4\" y=\""+(24+i*26)+"\" font-size=\"12\" font-family=\"monospace\">"+t+"</text>";}).join("");})()'
```

**사람 클린업(지금 고치지 않음)**
- 납품서 §8 목록
- 도미노 인장 머리가 1배에서 작은 깡통처럼 보이는 것
- 꽃가루 퍼짐 알갱이가 거품처럼 보이는 것
- 균열판 1~2의 첫 금이 ✉로 보이는 것
- 약화 매듭(검수 7차 R3)

### 4. 메인 세션 굽기·등록 주의

- **굽기**
  - 지금 판(`1.0-d3b2`)의 조각으로 354장, 603,884를 구워도 됩니다. F1은 조각을 바꾸지 않습니다.
  - 들어가는 키
    - 3b1 36장. lost, thorn*, mark-stain1, frost1-12, spore-a/b는 고친 그림입니다.
    - `crowFeathers/crow/0~5` 다시 굽기
    - 3b2 38장
  - 2048² 1장(최대 2장) 기대입니다. 페이지와 바이트는 `npm run bench:packs`로 잽니다.
  - F1 뒤에는 매니페스트 SPEC(`gimmick.inkBloom.ring`)만 다시 냅니다.
- **렌더러**(API §14.11)
  - 사건 고리 prim 다섯: stroke, band, torn, dashed, jag. 꽃가루 dashed는 F1의 샌드위치입니다.
  - 균열선, kink, 되감김(점 순서를 뒤집어 그려 나감, 결 쪽 26 비움), 증폭
  - 묶인 사슬: `share` 0.18초 α 1
  - 가지창: 주 창이 끝에 닿은 뒤 시작, 캡슐은 0부터. `fork`는 주 창 끝 (L, 0)
  - 되쓸기: 반전, α0.65
  - 되받은 탄: +x = 속도
  - 결 가속: 결 몸 바로 뒤 front, 보는 쪽 반전, 자국 테 inside
  - 갈라짐, 해바늘 배율 ≤ 1.6
- **층과 상한**
  - 대기 `dab`은 바닥 층, 그 밖의 사건·선은 allyAttacks(적 탄·예고 아래)
  - 상한: events 16/10/4, pollenRings 8/4/0, links 120/60/0
- **엔진 자료**: 납품서 §6 표 그대로입니다.
- **test:visual에 더할 장면(제안)**
  - 1024x720 DPR1과 흑백 확인용 flash 모드를 함께 넣습니다.
  - (a) 꽃가루 고리를 두른 적 + 적 예고 preview 원
  - (b) 공포 고리
  - (c) 보스 균열 터짐 + K11 shock 예고
  - (d) 적 탄 사이의 되받은 탄
  - (e) 별똥 자국 안의 결 가속
  - (f) 되감김·증폭·묶인 사슬 연쇄
  - (g) 가지창·되쓸기 빔
  - (h) 대기 붓자국 → 터짐
  - (i) 12 등급 적의 가시·묶임·서리
- **지시서 정정**
  - §4.4에 `crackBurst` 줄
  - `fork` place → point
  - `ring.*`·`line.*` 이름 → `SPEC.gimmick` 키
  - 메아리 청록은 core만
  - 가시 갈고리 방향(곁 안쪽, 앞 오른쪽)
  - C10 규칙(폭 3 이하의 테는 면이 아님)
  - 꽃가루 고리는 지시서 원래 값 그대로라 정정하지 않습니다.

### 5. P1 연결 캡처 판정 (`r5-k10p1/visual/actual/`, 1024x720 DPR1 일곱 장면 + 1440x900 DPR2 marks + flash eclipse + reduce ends·marks)

| 장면 | 판정 |
|---|---|
| fire | 합격. 불먹 지대(점선 청록 테, 먹 wash, 청록 불길)와 발밑 불길, 결이 선 별똥 자국(inside 실선 테), 연막, 끈끈이가 모두 읽힙니다 |
| marks | 합격. 손종, 패, 까마귀가 DPR1·DPR2 모두에서 정예 표시(자수정 고리 + »)·기절 점과 갈립니다 |
| graves(4장) | 합격. 묘비(흰 둥근 판 + 그림자)와 마름쇠 덩이가 바닥 톱니 무늬, 손종 표식과 갈립니다. 마름쇠가 바둑판처럼 놓인 것은 장면 배치 탓입니다 |
| seal, strike | 합격. 삼각 봉인 대기·터짐, 펼친 족자 띠, 여덟째 인장(무거운 고리 + 일곱 인영)이 읽힙니다. 일곱째 인장 덩어리가 붐비는 것은 일곱 사건이 한자리라서입니다 |
| ends | 합격. 기둥 처음·loop·끝, 회전 베기가 읽힙니다. reduce 모드에서는 호가 멈춥니다. F2의 이어짐은 정지 화면으로는 볼 수 없습니다(메인 세션 틱 확인 몫) |
| eclipse | 합격. 원판·띠가 적 몸 아래에 깔리고 결이 가장 밝습니다. flash 모드에서 원판이 절반으로 옅어집니다 |

- **주의(미확인)**: marks 장면에서 기절 점을 단 적 셋이 온몸 흰색으로 그려졌습니다.
  - 피격 섬광이면 문제없습니다.
  - 동결 동안 흰 틴트를 쓰는 것이라면 K10 동결 서릿발(흰 결정)이 흰 몸에 묻힙니다. 메인 세션이 확인합니다.

### 6. 미확인

- **해시**: 넓힌 식 stamps·draw·overlays의 3b1 쪽 값은 작가가 3b1 코드에서 잰 값이라 제가 다시 잴 수 없습니다. spec·parts는 제 검수 7차 측정값과 같습니다.
- **움직임 판독**: 되감김 방향, 헤맴 흔들기, 포자 오름, 되받은 탄 loop, 사건 상한(P2 연결 전)
- **T4**: 정식 판독 시험(n ≥ 8)
- **그 밖**: 성능, 팩 페이지·바이트
- **기절 점**: 제 대조 렌더의 기절 점은 점 셋으로 그린 근사입니다.
- **F1 결과**: 다음 짧은 확인에서 봅니다(렌더 하나 + 해시).

**관련 파일**
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js` (`:558-592` SPEC.gimmick, `:3924-4216` 사건 고리·새 단계)
- `/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md` (`:1088-1241` §14.11)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/briefs/arsenal-fx.md` (`:218`, `:301-303`, `:314`, `:317`, `:909`, `:1059`)
- `/Users/kyuukkang/CT_AX/07.playground/docs/art/deliveries/K10-arsenal-fx.md` (3b2 납품서 `:3795-4160`)

## K10 3b2 수정 납품서

**3b2-r1: 검수 8차 F1 · `SPEC.version` `1.0-d3b2-r1`** (kit-artist, 2026-10-20)

꽃가루 고리를 지시서의 먹 + 청록 점선 샌드위치로 되돌렸습니다. 조각(stamp)은 바뀌지 않았으므로 354장 팩을 지금 구워도 됩니다. F1 뒤에 다시 낼 것은 매니페스트 SPEC(`gimmick.inkBloom.ring`)뿐입니다.

#### 바뀐 곳

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/k-arsenal-fx.js`**
- `SPEC.gimmick.inkBloom.ring`을 지시서 `:909` 값으로 돌렸습니다: dashed, layers `[[ink,1.6],[ally,1]]`, dash `[4,5]`, pad 0.6. `core`는 지웠습니다.
- 틈 둘(16~28°), grow 0.6 → 1 / 0.25초, 수명 0.45, fade 0.6은 그대로입니다.
- `eventRing`의 dashed 갈래를 고쳤습니다.
  - 틈 사이 호마다 `rim.ally`와 같은 SWD로 그립니다.
  - 청록 [ally,1]은 점선 [4,5], 먹 [ink,1.6]은 같은 위상에서 양 끝으로 0.6씩 늘린 [5.2,3.8], 오프셋 0.6입니다.
  - 고리 전체를 이렇게 그리고, 호마다 무늬가 그 호의 시작에서 다시 시작합니다.
- 머리 주석, SPEC 주석, `eventRing` 주석을 고쳤고, `SPEC.version`을 `1.0-d3b2-r1`로 바꿨습니다.

**`/Users/kyuukkang/CT_AX/07.playground/art/concept-kit/API-arsenal-fx.md`**
- 머리말 버전, 납품 표의 3b2-r1 줄, §3 버전 주석
- §11에 3b2-r1 결과
- §12: 94의 꽃가루 항목에 '되돌림' 표시, 119(되돌린 까닭), 120(version)
- §14.11
  - 사건 고리 공통: 점선 고리는 고리 전체가 샌드위치
  - **C10 규칙 한 줄**: "폭 3 이하의 테·획은 C10 면이 아니다. 원판, 띠 채움, 폭이 3보다 넓은 것만 센다."
  - 'dashed' 식, 단계 표와 SPEC 표의 꽃가루 줄
  - C9 벡터에서 `inkBloom/pollen path core` 줄 삭제

#### 해시 출력 원문

검수서 명령 `k10-keep-3b2-r1`을 그대로 돌렸습니다.
```
stamps=l0nap6/878803 parts=qxfght/31609 overlays=1umqwpr/1079940
draw raw=v80e67/7065693 | without inkBloom/pollen=1skcben/7041757
spec raw=ii86b1/22458 | without gimmick.inkBloom=1ba8cfh/22210 version=1.0-d3b2-r1
```
- 그대로여야 하는 다섯 값이 모두 같습니다.
- 바뀐 것은 raw draw(`8crhz3/7063925` → `v80e67/7065693`)와 raw spec(`128ji9u/22506` → `ii86b1/22458`)뿐입니다. 글자는 `k10-keep-3b2-r1-x2`에서 대·소문자로 확인했습니다.

**다음 기준(원문 다섯)**

| 항목 | 값 |
|---|---|
| stamps | `l0nap6/878803` |
| draw | `v80e67/7065693` |
| spec | `ii86b1/22458` |
| parts | `qxfght/31609` |
| overlays | `1umqwpr/1079940` |

**검사**
- C6 `k10-c6-scan-d3b2-r1`: `calls=516 colours bad=0 nonhex=0 banned=0 nocyan=0 specTokens bad=0 korean=0`
- C7 `k10-c7-geometry-d3b2-r1`: 1~4줄 0건, 5줄 `invalid calls ok`
- C1 `k10-c1-all-d3b2-r1`: ok
- 모든 명령이 `--check` ok입니다.

#### 렌더 경로

- **합격 판**: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10b2r1-rings-vs-tele.png`
  - 1배, 1장, 위 색·아래 흑백
  - 적 예고 preview·imminent·active r50 옆에 꽃가루 고리 셋(p 0.35, p 0.6, 추적자를 두른 p 0.5)
  - 색: 고리 전체가 청록 점선으로 읽힙니다.
  - 흑백: 꽃가루 점선은 적 preview의 맨 먹 점선보다 밝은 회색 대시로 보이고, 해칭·물방울 머리·눈금이 없습니다.
- **흑백 3배 확대**: `/var/folders/p6/8x9_dsj97mbg_d6323ptytvc0000gn/T/blackline-art-review/k10b2r1-rings-vs-tele-gray-x3.png`. 대시마다 먹 테 안의 밝은 심이 보입니다.

#### 알려진 한계

- 1배 흑백에서 '밝은 심'은 대시(굵기 1.6, 심 1)가 맨 먹 대시보다 밝은 회색으로 보이는 정도입니다. 심이 테와 따로 갈려 보이는 것은 3배부터입니다. 굵기는 지시서 값 그대로입니다.
- 정정: 3b2 납품서와 API에 3b2 단계 C9 벡터를 '31줄'이라 적었는데, 세어 보니 29줄이었습니다. 3b2-r1은 28줄입니다(`k10-c9b-count-d3b2-r1`). API는 고쳤습니다. 지시서 C9 명령의 출력(69줄, `19cnic1`)은 이 수정과 관계없습니다.
- 실제 렌더러에서 확인하는 것은 메인 세션 몫입니다(test:visual 장면 (a)).

## 메인 세션 확인: 3b2 수정 (2026-10-20)

검수 8차가 맡긴 짧은 확인(렌더 하나 + 해시)을 메인 세션이 했다. 조각이 바뀌지 않는 SPEC 수정이라 2차 수정 1회차와 같은 방식이다. 받아들인다(굽는 판 `1.0-d3b2-r1`).
- `k10-keep-3b2-r1`: stamps `l0nap6/878803`, parts `qxfght/31609`, overlays `1umqwpr/1079940`, draw without inkBloom/pollen `1skcben/7041757`, spec without gimmick.inkBloom `1ba8cfh/22210` 모두 그대로. raw draw `v80e67/7065693`, raw spec `ii86b1/22458`, version `1.0-d3b2-r1`.
- `k10b2r1-rings-vs-tele`: 색에서 꽃가루 고리 셋이 고리 전체 청록 점선으로 읽히고, 흑백에서 적 예고(해칭 원판, 물방울 붓 머리, 굵은 테·눈금)와 갈린다. 1배 흑백의 '밝은 심'은 맨 먹 점선보다 밝은 회색 대시 정도다(지시서 굵기 그대로).
- 다음 납품의 보존 기준은 위 원문 다섯이다.
