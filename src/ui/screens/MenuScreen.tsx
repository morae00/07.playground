// Menu screen (UI-01, UI-04): the title and wallet, then four tabs: stage selection, the infinite score attack with
// its local leaderboard, permanent growth, and the settings the pause hub shares, so options such as reduced flash
// can be set before the first run. Developer-only parts test DEVELOPER_UI_AVAILABLE themselves, so shipped
// builds drop them.
import type { KeyboardEvent, ReactNode } from 'react';
import type { ChapterId } from '../../content/schema';
import { formatCount, formatDate, t, tx } from '../../i18n/strings';
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
import { SaveTransfer } from './SaveTransfer';
import { SettingsPanel } from './SettingsPanel';
import { StatGrid } from './StatGrid';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

/** "Chapter 1: 먹선 골목" from the chapter's strings (UI-10). */
export const chapterName = (id: number) => t('chapter.name', { n: id, theme: t(`chapter.${id as ChapterId}`) });

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
          <h1>{t('game.title')}</h1>
        </div>
        <div className="wallet">
          <span>{t('wallet.gold')}</span>
          <strong>{meta.gold}</strong>
          <span>{t('wallet.level')}</span>
          <strong>{meta.level}</strong>
          <span>{t('wallet.points')}</span>
          <strong>{meta.passivePoints}</strong>
          <span>{t('wallet.unlocked')}</span>
          <strong>{t('stage.address', meta.progress)}</strong>
        </div>
      </section>

      {inlineNotice}

      <nav className="menuTabs" role="tablist" aria-label={t('menu.tabs')}>
        <button id="menu-tab-play" className={menuView === 'play' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'play'} aria-controls="menu-panel-play" tabIndex={menuView === 'play' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('play')}>{t('menu.tab.play')}</button>
        <button id="menu-tab-infinite" className={menuView === 'infinite' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'infinite'} aria-controls="menu-panel-infinite" tabIndex={menuView === 'infinite' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('infinite')}>{t('menu.tab.infinite')}</button>
        <button id="menu-tab-growth" className={menuView === 'growth' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'growth'} aria-controls="menu-panel-growth" tabIndex={menuView === 'growth' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('growth')}>{t('menu.tab.growth')}</button>
        <button id="menu-tab-settings" className={menuView === 'settings' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'settings'} aria-controls="menu-panel-settings" tabIndex={menuView === 'settings' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('settings')}>{t('menu.tab.settings')}</button>
      </nav>

      <section className="menuGrid single">
        <div className="stageColumn" id="menu-panel-play" role="tabpanel" aria-labelledby="menu-tab-play" hidden={menuView !== 'play'}>
          <h2>{t('menu.chapters')}</h2>
          <div className="stageList" role="group" aria-label={t('menu.chapterSelect')}>
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
                  title={t(chapterLocked ? 'menu.chapterLocked' : 'chapter.subtitle')}
                  key={chapter.id}
                >
                  <span>{chapterName(chapter.id)}</span>
                  <strong>{chapterLocked ? t('menu.locked') : t(`chapter.${chapter.id as ChapterId}.difficulty`)}</strong>
                  <em>{t('chapter.subtitle')}</em>
                  <small>{chapter.stages.map((item) => item.kind === 'normal' ? item.id : item.kind === 'midBoss' ? '5M' : '10B').join(' / ')}</small>
                  {chapterLocked && <span className="srOnly" id={reasonId}>{t('menu.chapterLocked')}</span>}
                </button>
              );
            })}
            <button className="stageCard locked" aria-disabled="true" aria-describedby="chapter-6-lock-reason">
              <span>{t('menu.chapter6')}</span>
              <strong>{t('menu.comingSoon')}</strong>
              <em>{t('menu.chapter6.body')}</em>
              <span className="srOnly" id="chapter-6-lock-reason">{t('menu.chapter6.locked')}</span>
            </button>
          </div>
          {DEVELOPER_UI_AVAILABLE && <label className="devToggle">
            <input type="checkbox" checked={developerMode} onChange={(event) => setDeveloperMode(event.target.checked)} />
            <span>개발자 모드: 모든 Stage 접근</span>
          </label>}
          <div className="chapterTree">
            <strong>{t('menu.stageTree', { chapter: chapterName(selectedChapter.id) })}</strong>
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
                title={locked ? t('menu.stageLocked') : tx(item.objective)}
                onClick={() => {
                  if (locked) return;
                  setSelectedStageNo(item.id);
                }}
              >
                <span>{t('menu.stage', { n: item.id })}</span>
                <em>{tx(item.objective)}</em>
                <b>{t(`menu.kind.${item.kind}`)}</b>
                {locked && <span className="srOnly" id={reasonId}>{t('menu.stageLocked')}</span>}
              </button>;
            })}
          </div>
          <div className="menuSection loadoutSummary">
            <h2>{t('menu.loadout')}</h2>
            <StatGrid stats={visibleStats} />
          </div>
          <div className="startRow">
            <button className="primary launch" onClick={startRun} aria-disabled={selectedStageLocked} aria-describedby={selectedStageLocked ? 'selected-stage-lock-reason' : undefined} title={selectedStageLocked ? t('menu.stageLocked') : tx(selectedStage.objective)}>{t('menu.start', { chapter: selectedChapter.id, stage: selectedStage.id })}{selectedStageLocked && <span className="srOnly" id="selected-stage-lock-reason">{t('menu.stageLocked')}</span>}</button>
            <button className="ghost" onClick={resetMeta}>{t('menu.reset')}</button>
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
              <p className="eyebrow">{t('infinite.kicker')}</p>
              <h2>{t('infinite.title')}</h2>
            </div>
            <div className="infiniteModeFacts" aria-label={t('infinite.rules')}>
              <div><span>{t('infinite.start')}</span><b>{t('infinite.startValue')}</b></div>
              <div><span>{t('infinite.boss')}</span><b>{t('infinite.bossValue')}</b></div>
              <div><span>{t('infinite.limit')}</span><b>{t('infinite.limitValue')}</b></div>
            </div>
          </header>

          <div className="infiniteControls">
            <label>
              <span>{t('infinite.name')}</span>
              <input
                value={infinitePlayerName}
                maxLength={16}
                autoComplete="nickname"
                onChange={(event) => setInfinitePlayerName(event.target.value)}
                onBlur={onPlayerNameBlur}
              />
            </label>
            <label>
              <span>{t('infinite.seed')}</span>
              <input
                value={infiniteSeed}
                inputMode="numeric"
                maxLength={10}
                placeholder={t('infinite.seedEmpty')}
                onChange={(event) => setInfiniteSeed(event.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </label>
            <button className="primary launch" type="button" onClick={startInfiniteRun}>{t('infinite.go')}</button>
          </div>
          {DEVELOPER_UI_AVAILABLE && developerAccess && <div className="recordWarning">개발자 모드 Run은 경쟁 기록에서 제외됩니다.</div>}
          {leaderboardStatus && <div className="leaderboardStatus" role="status" aria-live="polite">{leaderboardStatus}</div>}

          <section className="leaderboardSection" aria-labelledby="infinite-ranking-title">
            <div className="leaderboardHead">
              <div>
                <p className="eyebrow">{t('board.kicker')}</p>
                <h2 id="infinite-ranking-title">{t('board.title')}</h2>
              </div>
              <b>{infiniteEntries.length} / 10</b>
            </div>
            {infiniteEntries.length > 0 ? (
              <div className="leaderboardTableWrap">
                <table className="leaderboardTable">
                  <thead>
                    <tr><th>{t('board.rank')}</th><th>{t('board.player')}</th><th>{t('board.score')}</th><th>{t('board.time')}</th><th>{t('board.bosses')}</th><th>{t('board.seed')}</th></tr>
                  </thead>
                  <tbody>
                    {infiniteEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>{String(index + 1).padStart(2, '0')}</td>
                        <td><strong>{entry.player}</strong><small>{formatDate(entry.endedAt)}</small></td>
                        <td><b>{formatCount(entry.score)}</b></td>
                        <td>{formatClock(entry.survivedSeconds)}</td>
                        <td>{entry.bosses}</td>
                        <td><button className="ghost small seedChallenge" type="button" aria-label={t('board.challenge', { seed: entry.seed })} onClick={() => setInfiniteSeed(String(entry.seed))}>{entry.seed}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="leaderboardEmpty">{t('board.empty')}</div>}
            {legacyEntries.length > 0 && (
              <p className="leaderboardLegacy">
                {t('board.legacy', { count: legacyEntries.length, version: RULES_VERSION })}
                {' '}{t('board.legacyBest', { score: formatCount(legacyEntries[0].score), player: legacyEntries[0].player })}
              </p>
            )}
          </section>
        </div>

        <div className="upgradeColumn" id="menu-panel-growth" role="tabpanel" aria-labelledby="menu-tab-growth" hidden={menuView !== 'growth'}>
          <div className="menuSection">
            <h2>{t('menu.baseStats')}</h2>
            <StatGrid stats={visibleStats} />
          </div>

          <div className="menuSection">
            <h2>{t('menu.upgrades')}</h2>
            <div className="upgradeGrid">
              {(Object.keys(META_UPGRADES) as MetaUpgradeId[]).map((id) => {
                const level = meta.upgrades[id];
                const def = META_UPGRADES[id];
                const cost = metaUpgradeCost(id, level);
                const reason = level >= def.max ? t('menu.maxLevel') : meta.gold < cost ? t('menu.goldShort', { n: cost - meta.gold }) : undefined;
                const reasonId = `meta-upgrade-${id}-reason`;
                return (
                  <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? t(`upgrade.${id}.line`)} onClick={() => buyMetaUpgrade(id)} key={id}>
                    <span>{t(`upgrade.${id}`)}</span>
                    <em>{t('menu.upgradeLine', { line: t(`upgrade.${id}.line`), level, max: def.max })}</em>
                    <b>{level >= def.max ? t('price.max') : t('price.gold', { n: cost })}</b>
                    {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="menuSection">
            <h2>{t('menu.passives')}</h2>
            <div className="upgradeGrid passiveGrid">
              {(Object.keys(META_PASSIVES) as PassiveId[]).map((id) => {
                const level = meta.passives[id];
                const def = META_PASSIVES[id];
                const reason = level >= def.max ? t('menu.maxLevel') : meta.passivePoints <= 0 ? t('menu.needPoint') : undefined;
                const reasonId = `passive-${id}-reason`;
                return (
                  <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? t(`passive.${id}.line`)} onClick={() => buyPassive(id)} key={id}>
                    <span>{t(`passive.${id}`)}</span>
                    <em>{t('menu.upgradeLine', { line: t(`passive.${id}.line`), level, max: def.max })}</em>
                    <b>{t('price.point', { n: 1 })}</b>
                    {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                  </button>
                );
              })}
            </div>
            <div className="metaXp">
              <span>{t('menu.nextLevel')}</span>
              <ProgressBar label={t('menu.levelXp')} value={meta.xp} max={xpForMetaLevel(meta.level)} className="xpBar" valueText={`${meta.xp} / ${xpForMetaLevel(meta.level)}`} />
              <b>{meta.xp} / {xpForMetaLevel(meta.level)}</b>
            </div>
          </div>
        </div>

        <div className="settingsColumn" id="menu-panel-settings" role="tabpanel" aria-labelledby="menu-tab-settings" hidden={menuView !== 'settings'}>
          <h2>{t('menu.tab.settings')}</h2>
          <SettingsPanel options={options} setOptions={setOptions}>
            <SaveTransfer />
          </SettingsPanel>
        </div>
      </section>
    </main>
  );
}
