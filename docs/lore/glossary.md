# 용어집 (UI-10)

> 화면에 나오는 말을 한곳에 모은다. 게임 안의 문구는 모두 `public/assets/content/strings/ko.json`(기준)과 `en.json`(영문 틀)에 있고, 코드는 키로만 부른다(docs/ARCHITECTURE.md "Strings"). 용어를 바꿀 때는 이 표와 두 파일을 함께 고친다. **[팀 확인]** 표시는 아직 확정되지 않은 항목이다.

## 1. 게임 용어

| 쓰는 말 | 영문 | 뜻 | 바꾼 말 |
|---|---|---|---|
| 계정 레벨 | account level | 런 밖에서 쌓이는 레벨. 오르면 패시브 포인트를 준다 | 외부 레벨 |
| 계정 XP | account XP | 계정 레벨을 올리는 경험치 | 외부 XP |
| 금 | gold | 런 밖의 재화. 영구 강화를 산다. 값은 `금 35`로 쓴다 | 골드 |
| 엽전 | coins | 런 안의 재화. 일시정지 허브에서 런 강화를 산다. 값은 `엽전 34`로 쓴다 | 코인 |
| 런 | run | 한 번 출정해서 정산까지의 한 판 | Run |
| 시드 | seed | 같은 전개를 다시 만드는 번호. 무한 경쟁에서는 '도전 시드' | Seed, Challenge Seed |
| 런 레벨 | run level | 런 안에서 먹 조각으로 오르는 레벨. 오를 때마다 드래프트가 열린다 | |
| 드래프트 | draft | 레벨 업이나 보스 처치 뒤 카드 3~4장 중 하나를 고르는 일 | |
| 각성 | awakening | Lv.5 스킬의 다음 단계. 다음 드래프트 첫 칸에 나온다 | |
| 슬롯 | slot | 빌드가 가질 수 있는 스킬 칸. 액티브 6, 패시브 4(SYS-08) | |
| 합성 각성 | fusion awakening | 두 스킬이 모두 각성되면 드래프트 마지막 칸에 나오는 추가 카드(SYS-08) | |
| 교체권 | swap token | 드래프트를 다시 뽑거나 카드 하나의 스킬을 그 런에서 제외하는 데 쓰는 것. 계정 레벨 8과 16에 하나씩 열린다(SYS-08) | 리롤·제외 토큰 |
| 연속 선택 | chained picks | 한꺼번에 열린 드래프트를 한 화면에서 차례로 고르는 것(SYS-08) | |
| 광폭화 | enrage | 보스 Stage의 시간이 다 되면 보스가 4단계로 강해지는 것 | |
| 연습 | practice | 짧은 Stage, 해금 없음, 보상 30% | |
| 돌파 / 쓰러짐 | cleared / fallen | 정산 화면의 결과 | 정산(패배 제목) |
| 출정 | campaign / go | 메뉴의 스테이지 선택과 시작 버튼 | Stage 선택, 시작 |
| 수련 | training | 금과 패시브 포인트로 영구 강화를 사는 메뉴 | 영구 성장 |
| 도감 | codex | 스킬·먹귀·보스·지형·구역 66항목. 얻거나 처치하거나 밟으면 기록된다(CON-07) | |
| 보너스 목표 | bonus goal | 일반 Stage의 목표에 딸린 추가 과제. 돌파하며 달성하면 금을 더 주고 별을 남긴다(CON-03) | |
| 별 | star | Stage마다 셋: 돌파, 보너스 목표(보스 Stage는 광폭화 전 처치), 최대 체력보다 적은 피해로 돌파(CON-07) | |
| 노히트 | no hit | 피해를 한 번도 받지 않고 돌파한 기록 | |
| 업적 | achievement | 세이브 전체에 걸친 목표 30개. 달성하면 꾸밈 하나를 준다(CON-07) | |
| 외곽선 · 먹 궤적 · 초상 테 · 칭호 | outline · ink trail · portrait frame · title | 업적이나 금으로 얻는 꾸밈 네 가지. 게임에는 영향이 없다 | 코스메틱 |
| 달라지는 점 | changes | 목표가 Stage에 주는 변화(비중, 등장, 위험지형 등). Stage 카드에 적는다 | |
| 점령 구역 | marked ground | 버티기 목표에서 서 있어야 하는 원. 10초마다 옮겨 간다 | |
| 먹 꾸러미 | ink cache | 회수 목표의 물건. 위에 서서 1.5초 버티면 회수된다 | 먹병 |
| 정예 | elite | 어픽스 하나를 단 먹귀. 보라 외곽선과 머리 위 문양으로 보인다(SYS-10) | |
| 가속 · 분열 · 보호막 · 흡수 오라 | haste · split · shield · drain | 정예의 어픽스 네 가지 | |
| 이야기 | story | 프롤로그, 장마다 들어서며·맺으며, 엔딩. 한 번씩 재생되고 도감 구역 항목에서 다시 본다(CON-06) | |
| 들어서며 · 맺으며 | entering · closing | 장의 첫 Run 앞과 St10 첫 돌파 뒤에 나오는 이야기 패널 | 인트로·아웃트로 |
| 챕터 순환 | chapter rotation | 무한 경쟁에서 한 장이 5분을 넘긴 뒤 라운드 보스를 쓰러뜨리면 다음 장의 모습으로 넘어가는 것. 5장 다음은 1장이다(CON-08) | |
| 오늘의 시드 · 이번 주 시드 | today's seed · this week's seed | 날짜로 정해지는 도전 시드. 같은 날(같은 주)에는 누구나 같은 판을 받는다. 순위표에는 '오늘', '이번 주'로 표시한다(CON-08) | 일일·주간 시드 |

- 'Stage', 'Chapter', 'Ch.1 / St.1', 'Lv.3'은 게임의 고유 표기로 그대로 쓴다. 문장 안에서는 '5챕터', '6장'처럼 한국어로도 쓴다. 'Stage' 표기는 지금대로 둔다(2026-10-02, D-12).
- 영문은 로고(BLACKLINE SURVIVOR)와 작은 eyebrow(RUN PAUSED, ENDLESS SCORE ATTACK, LOCAL RECORDS, RUN INTERRUPTED, LOCAL SAVE RESET)에만 쓴다(로어 바이블 §8). 그 밖의 영어 전용 표기는 한국어로 바꿨다: 표 머리(RANK → 순위 등), 무한 경쟁 규칙(START → 시작, Random Respawn → 무작위 재등장, None → 없음), TOP 10 → 상위 10위, DANGER → 위험도, ACTIVE → 적용 중, Coming Soon → 준비 중.
- 개발자 빌드 전용 문구(개발 도구, 치트, 쇼케이스)는 배포 빌드에 들어가지 않으므로 표에 올리지 않고 코드에 둔다.

## 2. 세계 용어

로어 바이블 §1.2의 용어다. 화면에는 아직 도감(CON-07)과 서사 연출(CON-06) 전이라 쓰이지 않는다.

| 쓰는 말 | 영문(초안) | 뜻 |
|---|---|---|
| 원고 | the manuscript | 먹선으로 그려진 세계 전체 |
| 먹선 | blackline | 형태를 붙잡는 선. 끊기면 형태가 풀린다 |
| 공백 | the null | 원고 가장자리에서 번지는 백지 |
| 먹귀 | ink wraith | 선을 잃은 먹이 형체를 얻은 것 |
| 필경사 | scribe | 원고를 베껴 쓰는 사람. 주인공 결 |
| 여백 | margin | 그림을 살리는 빈 곳 |
| 지움 | erasure | 공백이 선을 없애는 일 |

## 3. 이름

챕터 5, 보스 15, 스킬 17의 한국어 이름은 게임 데이터 그대로다(V1). 영문명은 `en.json`에 초안으로 넣었다. 컨셉 키트에 있는 3종(Ink Butcher, Belfry Gaoler, Furnace Maw)을 뺀 보스 12종과 챕터·스킬 영문명은 초안이다. 영문판과 함께 1.1에서 확정한다(2026-10-02, D-12).

| 키 | 한국어 | 영문(초안) |
|---|---|---|
| chapter.1~5 | 먹선 골목 · 철문 예배당 · 무채 운하 · 시계 무덤 · 일식 관문 | Inkline Alley · Iron Gate Chapel · Colourless Canal · Clock Grave · Eclipse Gate |
| boss.s1-mid-dash · s1-final-rings · s2-final-flame | 잉크 도살자 · 종탑 간수 · 용광의 입 | Ink Butcher · Belfry Gaoler · Furnace Maw (키트) |
| 나머지 보스 12종 | `ko.json`의 boss.* | `en.json`의 boss.* |
| 스킬 17종 | `ko.json`의 skill.* | `en.json`의 skill.* |

보스 칭호와 한 줄(FX-05, `public/assets/content/boss-titles.json`)은 로어 바이블 초안에서 나오므로 아직 한국어만 있다. 영문은 Q-7·Q-9가 정해진 뒤 같은 방식으로 나눈다.
