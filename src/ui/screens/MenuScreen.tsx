// Menu screen (UI-01, UI-04): the title and wallet, then four tabs: stage selection, the infinite score attack with
// its local leaderboard, permanent growth, and the settings the pause hub shares, so options such as reduced flash
// can be set before the first run. Developer-only parts test DEVELOPER_UI_AVAILABLE themselves, so shipped
// builds drop them.
import type { KeyboardEvent, ReactNode } from 'react';
import { DEVELOPER_UI_AVAILABLE, DEVELOPER_UI_DEFAULT_ENABLED } from '../../platform/developerAccess';
import { RULES_VERSION } from '../../game/rules';
import type { InfiniteScoreEntry } from '../../platform/infiniteLeaderboard';
import type { GameOptions, MetaState, MetaUpgradeId, PassiveId } from '../../platform/save';
import {
  CHAPTERS,
  META_PASSIVES,
  META_UPGRADES,
  formatClock,
  isStageUnlocked,
  metaUpgradeCost,
  xpForMetaLevel,
  type StatBlock,
} from '../../game/GameEngine';
import { ProgressBar } from '../ProgressBar';
import { SettingsPanel } from './SettingsPanel';
import { StatGrid } from './StatGrid';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

export type MenuView = 'play' | 'infinite' | 'growth' | 'settings';

export type MenuScreenProps = {
  meta: MetaState;
  inlineNotice: ReactNode;
  menuView: MenuView;
  setMenuView: (view: MenuView) => void;
  handleMenuTabKey: (event: KeyboardEvent<HTMLButtonElement>) => void;
  developerAccess: boolean;
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
  options: GameOptions;
  setOptions: (options: GameOptions) => void;
  selectedChapterId: number;
  setSelectedChapterId: (id: number) => void;
  selectedStageNo: number;
  setSelectedStageNo: (stage: number) => void;
  selectedChapter: (typeof CHAPTERS)[number];
  selectedStage: (typeof CHAPTERS)[number]['stages'][number];
  selectedStageLocked: boolean;
  visibleStats: StatBlock;
  startRun: () => void;
  resetMeta: () => void;
  cheatCode: string;
  setCheatCode: (code: string) => void;
  cheatMessage: string;
  applyCheat: () => void;
  infinitePlayerName: string;
  setInfinitePlayerName: (name: string) => void;
  onPlayerNameBlur: () => void;
  infiniteSeed: string;
  setInfiniteSeed: (seed: string) => void;
  startInfiniteRun: () => void;
  leaderboardStatus: string;
  infiniteEntries: readonly InfiniteScoreEntry[];
  legacyEntries: readonly InfiniteScoreEntry[];
  buyMetaUpgrade: (id: MetaUpgradeId) => void;
  buyPassive: (id: PassiveId) => void;
};

export function MenuScreen({ meta, inlineNotice, menuView, setMenuView, handleMenuTabKey, developerAccess, developerMode, setDeveloperMode, options, setOptions, selectedChapterId, setSelectedChapterId, selectedStageNo, setSelectedStageNo, selectedChapter, selectedStage, selectedStageLocked, visibleStats, startRun, resetMeta, cheatCode, setCheatCode, cheatMessage, applyCheat, infinitePlayerName, setInfinitePlayerName, onPlayerNameBlur, infiniteSeed, setInfiniteSeed, startInfiniteRun, leaderboardStatus, infiniteEntries, legacyEntries, buyMetaUpgrade, buyPassive }: MenuScreenProps) {
  return (
    <main className="menuLayer">
      <section className="titleBlock">
        <div>
          <p className="eyebrow">
            BLACKLINE SURVIVOR <span className="appVersion">v{APP_VERSION}</span>
            {DEVELOPER_UI_DEFAULT_ENABLED && <span className="developerBuildBadge">DEV APP</span>}
          </p>
          <h1>흑백 타격 생존전</h1>
        </div>
        <div className="wallet">
          <span>골드</span>
          <strong>{meta.gold}</strong>
          <span>외부 레벨</span>
          <strong>{meta.level}</strong>
          <span>패시브 포인트</span>
          <strong>{meta.passivePoints}</strong>
          <span>해금 Stage</span>
          <strong>Ch.{meta.progress.chapter} / St.{meta.progress.stage}</strong>
        </div>
      </section>

      {inlineNotice}

      <nav className="menuTabs" role="tablist" aria-label="메뉴 보기">
        <button id="menu-tab-play" className={menuView === 'play' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'play'} aria-controls="menu-panel-play" tabIndex={menuView === 'play' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('play')}>Stage 선택</button>
        <button id="menu-tab-infinite" className={menuView === 'infinite' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'infinite'} aria-controls="menu-panel-infinite" tabIndex={menuView === 'infinite' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('infinite')}>무한 경쟁</button>
        <button id="menu-tab-growth" className={menuView === 'growth' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'growth'} aria-controls="menu-panel-growth" tabIndex={menuView === 'growth' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('growth')}>영구 성장</button>
        <button id="menu-tab-settings" className={menuView === 'settings' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'settings'} aria-controls="menu-panel-settings" tabIndex={menuView === 'settings' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('settings')}>설정</button>
      </nav>

      <section className="menuGrid single">
        <div className="stageColumn" id="menu-panel-play" role="tabpanel" aria-labelledby="menu-tab-play" hidden={menuView !== 'play'}>
          <h2>Chapter</h2>
          <div className="stageList" role="group" aria-label="Chapter 선택">
            {CHAPTERS.map((chapter) => {
              const chapterLocked = !developerAccess && !isStageUnlocked(meta, chapter.id, 1);
              const reasonId = `chapter-${chapter.id}-lock-reason`;
              return (
                <button
                  className={[
                    selectedChapterId === chapter.id ? 'stageCard selected' : 'stageCard',
                    chapterLocked ? 'locked' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (chapterLocked) return;
                    setSelectedChapterId(chapter.id);
                    if (!developerAccess && !isStageUnlocked(meta, chapter.id, selectedStageNo)) {
                      setSelectedStageNo(1);
                    }
                  }}
                  aria-disabled={chapterLocked}
                  aria-pressed={selectedChapterId === chapter.id}
                  aria-describedby={chapterLocked ? reasonId : undefined}
                  title={chapterLocked ? '이전 Chapter의 Stage 10 클리어 필요' : chapter.subtitle}
                  key={chapter.id}
                >
                  <span>{chapter.name}</span>
                  <strong>{chapterLocked ? '잠김' : chapter.difficulty}</strong>
                  <em>{chapter.subtitle}</em>
                  <small>{chapter.stages.map((item) => item.kind === 'normal' ? item.id : item.kind === 'midBoss' ? '5M' : '10B').join(' / ')}</small>
                  {chapterLocked && <span className="srOnly" id={reasonId}>이전 Chapter의 Stage 10 클리어 필요</span>}
                </button>
              );
            })}
            <button className="stageCard locked" aria-disabled="true" aria-describedby="chapter-6-lock-reason">
              <span>Chapter 6: 미개방 구역</span>
              <strong>Coming Soon</strong>
              <em>10개 신규 Stage와 보스가 곧 열립니다</em>
              <span className="srOnly" id="chapter-6-lock-reason">현재 버전에서는 Chapter 6을 선택할 수 없습니다</span>
            </button>
          </div>
          {DEVELOPER_UI_AVAILABLE && <label className="devToggle">
            <input type="checkbox" checked={developerMode} onChange={(event) => setDeveloperMode(event.target.checked)} />
            <span>개발자 모드: 모든 Stage 접근</span>
          </label>}
          <div className="chapterTree">
            <strong>{selectedChapter.name} / Stage 선택</strong>
            {selectedChapter.stages.map((item) => {
              const locked = !developerAccess && !isStageUnlocked(meta, selectedChapter.id, item.id);
              const reasonId = `stage-${selectedChapter.id}-${item.id}-lock-reason`;
              return <button
                className={[
                  'treeRow',
                  'stageNode',
                  selectedStageNo === item.id ? 'selected' : '',
                  locked ? 'locked' : '',
                ].filter(Boolean).join(' ')}
                key={item.id}
                aria-disabled={locked}
                aria-describedby={locked ? reasonId : undefined}
                aria-current={selectedStageNo === item.id ? 'step' : undefined}
                title={locked ? '이전 Stage 클리어 필요' : item.objective}
                onClick={() => {
                  if (locked) return;
                  setSelectedStageNo(item.id);
                }}
              >
                <span>Stage {item.id}</span>
                <em>{item.objective}</em>
                <b>{item.kind === 'normal' ? '일반' : item.kind === 'midBoss' ? '중간보스' : '챕터보스'}</b>
                {locked && <span className="srOnly" id={reasonId}>이전 Stage 클리어 필요</span>}
              </button>;
            })}
          </div>
          <div className="menuSection loadoutSummary">
            <h2>현재 기본 스펙</h2>
            <StatGrid stats={visibleStats} />
          </div>
          <div className="startRow">
            <button className="primary launch" onClick={startRun} aria-disabled={selectedStageLocked} aria-describedby={selectedStageLocked ? 'selected-stage-lock-reason' : undefined} title={selectedStageLocked ? '이전 Stage 클리어 필요' : selectedStage.objective}>Ch.{selectedChapter.id} / St.{selectedStage.id} 시작{selectedStageLocked && <span className="srOnly" id="selected-stage-lock-reason">이전 Stage 클리어 필요</span>}</button>
            <button className="ghost" onClick={resetMeta}>초기화</button>
          </div>
          {DEVELOPER_UI_AVAILABLE && developerAccess && <div className="menuSection cheatMenu">
            <h2>Cheat Code</h2>
            <div className="cheatRow">
              <input aria-label="Cheat code" value={cheatCode} onChange={(event) => setCheatCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') applyCheat(); }} placeholder="DEV / GOLD999 / GOD / COIN / MAGNET / NUKE" />
              <button className="ghost" onClick={applyCheat}>입력</button>
            </div>
            {cheatMessage && <div className="emptyText" role="status" aria-live="polite" aria-atomic="true">{cheatMessage}</div>}
          </div>}
        </div>

        <div className="infiniteColumn" id="menu-panel-infinite" role="tabpanel" aria-labelledby="menu-tab-infinite" hidden={menuView !== 'infinite'}>
          <header className="infiniteHeader">
            <div>
              <p className="eyebrow">ENDLESS SCORE ATTACK</p>
              <h2>무한 경쟁</h2>
            </div>
            <div className="infiniteModeFacts" aria-label="무한 모드 규칙">
              <div><span>START</span><b>Stage 5 Mid Boss</b></div>
              <div><span>BOSS</span><b>Random Respawn</b></div>
              <div><span>LIMIT</span><b>None</b></div>
            </div>
          </header>

          <div className="infiniteControls">
            <label>
              <span>플레이어 이름</span>
              <input
                value={infinitePlayerName}
                maxLength={16}
                autoComplete="nickname"
                onChange={(event) => setInfinitePlayerName(event.target.value)}
                onBlur={onPlayerNameBlur}
              />
            </label>
            <label>
              <span>Challenge Seed</span>
              <input
                value={infiniteSeed}
                inputMode="numeric"
                maxLength={10}
                placeholder="비우면 랜덤"
                onChange={(event) => setInfiniteSeed(event.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </label>
            <button className="primary launch" type="button" onClick={startInfiniteRun}>무한 모드 시작</button>
          </div>
          {DEVELOPER_UI_AVAILABLE && developerAccess && <div className="recordWarning">개발자 모드 Run은 경쟁 기록에서 제외됩니다.</div>}
          {leaderboardStatus && <div className="leaderboardStatus" role="status" aria-live="polite">{leaderboardStatus}</div>}

          <section className="leaderboardSection" aria-labelledby="infinite-ranking-title">
            <div className="leaderboardHead">
              <div>
                <p className="eyebrow">LOCAL RECORDS</p>
                <h2 id="infinite-ranking-title">TOP 10</h2>
              </div>
              <b>{infiniteEntries.length} / 10</b>
            </div>
            {infiniteEntries.length > 0 ? (
              <div className="leaderboardTableWrap">
                <table className="leaderboardTable">
                  <thead>
                    <tr><th>RANK</th><th>PLAYER</th><th>SCORE</th><th>TIME</th><th>BOSS</th><th>SEED</th></tr>
                  </thead>
                  <tbody>
                    {infiniteEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>{String(index + 1).padStart(2, '0')}</td>
                        <td><strong>{entry.player}</strong><small>{new Date(entry.endedAt).toLocaleDateString('ko-KR')}</small></td>
                        <td><b>{entry.score.toLocaleString('ko-KR')}</b></td>
                        <td>{formatClock(entry.survivedSeconds)}</td>
                        <td>{entry.bosses}</td>
                        <td><button className="ghost small seedChallenge" type="button" aria-label={`Seed ${entry.seed}로 도전`} onClick={() => setInfiniteSeed(String(entry.seed))}>{entry.seed}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="leaderboardEmpty">아직 기록이 없습니다.</div>}
            {legacyEntries.length > 0 && (
              <p className="leaderboardLegacy">
                이전 규칙(v1) 기록 {legacyEntries.length}건은 현재 규칙(v{RULES_VERSION}) 순위와 섞이지 않도록 따로 보관합니다.
                최고 {legacyEntries[0].score.toLocaleString('ko-KR')}점 · {legacyEntries[0].player}
              </p>
            )}
          </section>
        </div>

        <div className="upgradeColumn" id="menu-panel-growth" role="tabpanel" aria-labelledby="menu-tab-growth" hidden={menuView !== 'growth'}>
          <div className="menuSection">
            <h2>기본 스펙</h2>
            <StatGrid stats={visibleStats} />
          </div>

          <div className="menuSection">
            <h2>영구 강화</h2>
            <div className="upgradeGrid">
              {(Object.keys(META_UPGRADES) as MetaUpgradeId[]).map((id) => {
                const level = meta.upgrades[id];
                const def = META_UPGRADES[id];
                const cost = metaUpgradeCost(id, level);
                const reason = level >= def.max ? '최대 레벨' : meta.gold < cost ? `골드 ${cost - meta.gold} 부족` : undefined;
                const reasonId = `meta-upgrade-${id}-reason`;
                return (
                  <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? def.line} onClick={() => buyMetaUpgrade(id)} key={id}>
                    <span>{def.label}</span>
                    <em>{def.line} Lv.{level}/{def.max}</em>
                    <b>{level >= def.max ? 'MAX' : `${cost}g`}</b>
                    {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="menuSection">
            <h2>외부 레벨 패시브</h2>
            <div className="upgradeGrid passiveGrid">
              {(Object.keys(META_PASSIVES) as PassiveId[]).map((id) => {
                const level = meta.passives[id];
                const def = META_PASSIVES[id];
                const reason = level >= def.max ? '최대 레벨' : meta.passivePoints <= 0 ? '패시브 포인트 필요' : undefined;
                const reasonId = `passive-${id}-reason`;
                return (
                  <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? def.line} onClick={() => buyPassive(id)} key={id}>
                    <span>{def.label}</span>
                    <em>{def.line} Lv.{level}/{def.max}</em>
                    <b>1p</b>
                    {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                  </button>
                );
              })}
            </div>
            <div className="metaXp">
              <span>다음 외부 레벨</span>
              <ProgressBar label="외부 레벨 경험치" value={meta.xp} max={xpForMetaLevel(meta.level)} className="xpBar" valueText={`${meta.xp} / ${xpForMetaLevel(meta.level)}`} />
              <b>{meta.xp} / {xpForMetaLevel(meta.level)}</b>
            </div>
          </div>
        </div>

        <div className="settingsColumn" id="menu-panel-settings" role="tabpanel" aria-labelledby="menu-tab-settings" hidden={menuView !== 'settings'}>
          <h2>설정</h2>
          <SettingsPanel options={options} setOptions={setOptions} />
        </div>
      </section>
    </main>
  );
}
