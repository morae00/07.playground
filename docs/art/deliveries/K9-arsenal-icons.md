

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
