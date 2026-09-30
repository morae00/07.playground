# 아트 파이프라인 (TEC-03)

캐릭터 아트는 아틀라스로 구워 런타임에 그린다. 규격은 [스타일 바이블](style-bible.md)을 따른다.

## 구성

| 단계 | 위치 | 내용 |
|---|---|---|
| 원본 | `art/concept-kit/` | 컨셉 키트 SVG 생성기(`PN.heroKit`, `PN.enemies` 등). 잠정 아트다(AI 보조 컨셉, 스타일 바이블 §15). |
| 사양 | `art/atlas-spec.mjs` | 어떤 그림을 어느 팩에 굽는지, 앵커, 크기 맞춤(`fit`), 키트 색 → 구현 토큰 대응표 |
| 굽기 | `npm run build:atlas` | Chromium에서 @2x(월드 1단위 = 2px)로 렌더 → 투명 여백 트림 → 페이지(최대 2048²) 배치 |
| 산출물 | `public/assets/atlas/common-*.png`, `public/assets/packs/chapter-NN/atlas-*.png`, `src/game/render/assets/atlasManifest.generated.ts` | 공통 팩은 초기 에셋, 챕터 팩은 설치 에셋 예산(TEC-05)으로 잡힌다. 매니페스트는 동적 import라 앱 번들에 들어가지 않는다. |
| 런타임 | `src/game/render/assets/spriteAtlas.ts`, `slots.ts` | `<img>` + `createImageBitmap`으로 페이지를 미리 디코딩한다(Electron `file://`에서도 동작). 팩이 없거나 실패하면 벡터 렌더러로 그린다. |

같은 킷·사양·Chromium이면 굽기 결과는 바이트 단위로 같다. 굽기 결과는 커밋한다.

## 규칙

- **앵커**: 시뮬 좌표 = 판정 원 중심 = 발밑 그림자·링 중심이다. 키트는 v1.0 앵커(골반 = 판정 원 중심)로 그렸으므로, 키트의 feet 점(pivot + r)을 앵커로 굽는다(스타일 바이블 §2.3, §16). 발밑 그림자와 주인공 청록 링은 게임이 앵커 위치에 그린다.
- **크기**: 키트 표시 크기가 §7.1 범위를 넘는 역할은 `fit`으로 줄인다(stalker 0.9, charger 0.963, shooter 0.783). 판정 반경은 바꾸지 않는다. 중형 shooter는 같은 그림을 ×1.26으로 그린다.
- **색**: 굽기 전에 키트의 v1.0 먹·종이 토큰을 `palette.ts` 구현값으로 바꾼다(§5.1).
- **슬롯**: 굽힌 슬롯은 팩이 로드되면 바로 쓰인다. `slots.ts`의 `DISABLED_SLOTS`에 슬롯 이름 한 줄을 넣으면 그 슬롯만 벡터로 되돌아간다.
- **상태**: 주인공은 idle · run · throw(스킬 발사) · hurt(피격), 적은 walk · idle · windup(원거리 예고) · hit(피격 네거티브 플래시)를 쓴다. 보행 프레임은 개체 id로 위상을 어긋나게 해 무리가 발맞춰 걷지 않는다.

## 현재 범위 (R1 진행 중)

- 공통 팩: 주인공 결 21프레임(idle 6, run 8, throw 4, hurt 3). 측면 한 방향이고 좌우 반전으로 방향을 바꾼다.
- 1챕터 팩: 먹선 골목 적 4역할(stalker, charger, shooter, warden) 28프레임과 라운드 보스 2종 24프레임.
  - 보스는 잉크 도살자(`boss/1/butcher`)와 종탑 간수(`boss/1/gaoler`)다.
  - 각 보스는 페이즈 1~3 × 평상·준비 자세 × 평상·광폭화의 12상태다.
  - 준비 자세는 돌진 준비 중이거나 탄막이 무장된 동안 쓴다.
  - 간수의 준비 자세는 열쇠 지팡이가 상자 위로 솟으므로, 칸 위쪽에 150 유닛 여백(`extraPad`)을 둔다.
- 필드 보스(균열 장교)는 키트 그림이 없어 벡터로 남는다. 환경, 픽업, 텔레그래프, UI 아이콘도 아직 벡터다(ART-04, ART-05, ART-06, ART-09).

## 최종 원화로 교체하기

손으로 정리한 원화가 오면 같은 키(`hero/run/3`, `enemy/1/warden/walk/2` …)로 굽도록 사양만 바꾼다. 앵커·크기 규칙과 매니페스트 형식이 같으면 코드는 바꾸지 않는다. 교체 후 `npm run test:unit`의 매니페스트 검사와 `npm run test:visual`로 확인한다.
