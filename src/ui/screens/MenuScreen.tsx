// Menu screen (UI-01, UI-04, UI-06, concept C). Left: the title, a vertical nav (campaign, endless, growth, the
// codex to come, settings), and the hero's key art. Right: the gold and account level, then the view the nav picks.
// The campaign view reads top to bottom: the chapter (its landmark thumbnails, and chapter 6 to come), a path map of
// its ten stages (cleared stages carry the ink seal, the next one glows teal, the boss stops show the boss), and
// the selected stage: its goal, its enemies, the least a clear pays, the best record, and the start button.
// Developer-only parts test DEVELOPER_UI_AVAILABLE themselves, so shipped builds drop them.
import { useEffect, type KeyboardEvent, type ReactNode } from 'react';
import type { ChapterId } from '../../content/schema';
import { formatCount, formatDate, t, tx } from '../../i18n/strings';
import { DEVELOPER_UI_AVAILABLE, DEVELOPER_UI_DEFAULT_ENABLED } from '../../platform/developerAccess';
import { RULES_VERSION } from '../../game/rules';
import { BOSS_SLOTS } from '../../game/render/assets/slots';
import type { InfiniteScoreEntry } from '../../platform/infiniteLeaderboard';
import type { CosmeticId } from '../../content/data/cosmetics';
import { stageStars, type GameOptions, type MetaState, type MetaUpgradeId, type PassiveId, type ProfileData, type StageRecord } from '../../platform/save';
import CODEX from '../../content/data/codex';
import {
  CHAPTERS,
  META_PASSIVES,
  META_UPGRADES,
  STAGES_PER_CHAPTER,
  formatClock,
  isStageUnlocked,
  metaUpgradeCost,
  stageDuration,
  xpForMetaLevel,
  type StatBlock,
  type SuspendedRun,
} from '../../game/GameEngine';
import { Glyph } from '../Glyph';
import { ProgressBar } from '../ProgressBar';
import { STAGE_PATH, chapterCleared, passiveEffect, smoothPath, stageBoss, stageObjective, stageRewardFloor, stageStatus, upgradeEffect } from '../menuStage';
import { CodexView } from './CodexView';
import { SaveTransfer } from './SaveTransfer';
import { SettingsPanel } from './SettingsPanel';
import { StatGrid } from './StatGrid';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const ENEMY_ROLES = ['stalker', 'charger', 'shooter', 'warden'] as const;
/** The chapter still to come, shown small after the five (lore bible §7). */
const NEXT_CHAPTER = CHAPTERS.length + 1;

export type MenuView = 'play' | 'infinite' | 'growth' | 'settings' | 'codex';

/** "Chapter 1: 먹선 골목" from the chapter's strings (UI-10). */
export const chapterName = (id: number) => t('chapter.name', { n: id, theme: t(`chapter.${id as ChapterId}`) });

export type MenuScreenProps = {
  meta: MetaState;
  records: Readonly<Record<string, StageRecord>>;
  /** CON-07: the save's profile for the codex, its achievements, and the cosmetics worn or bought. */
  profile: ProfileData;
  bestInfiniteSeconds: number;
  onBuyCosmetic: (id: CosmeticId) => void;
  onWearCosmetic: (id: CosmeticId, wear: boolean) => void;
  inlineNotice: ReactNode;
  /** CON-04: a run left in play, offered first so a crash or a quit never loses it. */
  suspended: SuspendedRun | null;
  onResumeSuspended: () => void;
  onDiscardSuspended: () => void;
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

export const NAV: readonly MenuView[] = ['play', 'infinite', 'growth', 'settings', 'codex'];

type PlayProps = Pick<MenuScreenProps, 'meta' | 'records' | 'developerAccess' | 'developerMode' | 'setDeveloperMode' | 'options' | 'selectedChapterId' | 'setSelectedChapterId' | 'selectedStageNo' | 'setSelectedStageNo' | 'selectedChapter' | 'selectedStage' | 'selectedStageLocked' | 'visibleStats' | 'startRun' | 'setMenuView' | 'cheatCode' | 'setCheatCode' | 'cheatMessage' | 'applyCheat'>;

const CODEX_TOTAL = Object.values(CODEX).reduce((sum, ids) => sum + ids.length, 0);
/** Codex entries found, counting only ids the codex lists. */
const codexFound = (codex: ProfileData['codex']) => (Object.keys(CODEX) as (keyof typeof CODEX)[]).reduce((sum, part) => sum + codex[part].filter((id) => (CODEX[part] as readonly string[]).includes(id)).length, 0);

/** CON-07: the stars' names: the clear, a normal stage's bonus goal, the low-damage clear, and a boss stage's swift clear. */
const STAR_LABELS = ['star.clear', 'star.bonus', 'star.lowDamage', 'star.swift'] as const;
const starCount = (record: StageRecord | undefined) => stageStars(record).filter(Boolean).length;

function PlayView({ meta, records, developerAccess, developerMode, setDeveloperMode, options, selectedChapterId, setSelectedChapterId, selectedStageNo, setSelectedStageNo, selectedChapter, selectedStage, selectedStageLocked, visibleStats, startRun, setMenuView, cheatCode, setCheatCode, cheatMessage, applyCheat }: PlayProps) {
  const chapter = selectedChapter.id;
  const midBoss = stageBoss(chapter, 5);
  const finalBoss = stageBoss(chapter, 10);
  const boss = stageBoss(chapter, selectedStage.id);
  const goal = selectedStage.objective.params?.goal;
  const practice = options.paceMode === 'practice';
  const reward = stageRewardFloor(chapter, selectedStage.id, practice);
  const record = records[`${chapter}-${selectedStage.id}`];
  const objectiveInfo = stageObjective(chapter, selectedStage.id);
  const duration = stageDuration(selectedStage.kind, options.paceMode, { chapter, stage: selectedStage.id });
  const statusOf = (stage: number) => stageStatus(meta, chapter, stage, developerAccess);
  const current = selectedChapter.stages.findIndex((item) => statusOf(item.id) === 'current');
  const reached = current < 0 ? (statusOf(1) === 'cleared' ? STAGES_PER_CHAPTER : 0) : current + 1;
  const address = t('stage.address', { chapter, stage: selectedStage.id });

  return (
    <>
      <header className="chapterHead">
        <p className="eyebrow">{t('menu.chapterEyebrow', { n: chapter })}</p>
        <h2>{t(`chapter.${chapter as ChapterId}`)}</h2>
        <span className="chapterMeta">
          {t('menu.chapterMeta', { difficulty: t(`chapter.${chapter as ChapterId}.difficulty`), mid: midBoss ? t(midBoss.name) : '', final: finalBoss ? t(finalBoss.name) : '' })}
        </span>
        <b className="chapterProgress">{t('menu.progress', { cleared: chapterCleared(meta, chapter), total: STAGES_PER_CHAPTER })}</b>
      </header>

      <div className="chapterStrip" role="group" aria-label={t('menu.chapterSelect')}>
        {CHAPTERS.map((item) => {
          const locked = !developerAccess && !isStageUnlocked(meta, item.id, 1);
          const reasonId = `chapter-${item.id}-lock-reason`;
          return (
            <button
              className={['chapterCard', selectedChapterId === item.id ? 'selected' : '', locked ? 'locked' : ''].filter(Boolean).join(' ')}
              onClick={() => {
                if (locked) return;
                setSelectedChapterId(item.id);
                if (!developerAccess && !isStageUnlocked(meta, item.id, selectedStageNo)) setSelectedStageNo(1);
              }}
              aria-disabled={locked}
              aria-pressed={selectedChapterId === item.id}
              aria-describedby={locked ? reasonId : undefined}
              title={locked ? t('menu.chapterLocked') : chapterName(item.id)}
              key={item.id}
            >
              <span className="artChapter" data-art={`chapter-${item.id}`} aria-hidden="true" />
              <span className="chapterCardName">{t('menu.chapterCard', { n: item.id, name: t(`chapter.${item.id as ChapterId}`) })}</span>
              <small>{locked ? t('menu.locked') : t('menu.progressShort', { cleared: chapterCleared(meta, item.id), total: STAGES_PER_CHAPTER })}</small>
              {locked && <span className="srOnly" id={reasonId}>{t('menu.chapterLocked')}</span>}
            </button>
          );
        })}
        <div className="chapterSoon">{t('menu.chapterSoon', { n: NEXT_CHAPTER })}</div>
      </div>

      <div className="stageMap" role="group" aria-label={t('menu.stageMap', { chapter: chapterName(chapter) })}>
        <div className="stageMapInner">
        <svg className="stageMapPath" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="pathAhead" d={smoothPath(STAGE_PATH)} />
          {reached > 1 && <path className="pathDone" d={smoothPath(STAGE_PATH.slice(0, reached))} />}
        </svg>
        {selectedChapter.stages.map((item, index) => {
          const status = statusOf(item.id);
          const locked = status === 'locked';
          const stageBossDef = item.kind === 'normal' ? undefined : stageBoss(chapter, item.id);
          const reasonId = `stage-${chapter}-${item.id}-lock-reason`;
          const [x, y] = STAGE_PATH[index];
          return (
            <button
              className={['stageNode', status, stageBossDef ? 'bossNode' : '', selectedStageNo === item.id ? 'selected' : ''].filter(Boolean).join(' ')}
              style={{ left: `${x}%`, top: `${y}%` }}
              key={item.id}
              aria-disabled={locked}
              aria-describedby={locked ? reasonId : undefined}
              aria-current={selectedStageNo === item.id ? 'step' : undefined}
              title={locked ? t('menu.stageLocked') : tx(item.objective)}
              onClick={() => {
                if (!locked) setSelectedStageNo(item.id);
              }}
            >
              {stageBossDef && stageBossDef.id in BOSS_SLOTS
                ? <span className="artPortrait" data-art={stageBossDef.id} aria-hidden="true" />
                : <b className="nodeNumber" aria-hidden="true">{item.id}</b>}
              <span className="srOnly">{t('menu.stage', { n: item.id })}</span>
              {stageBossDef && <em className="nodeCaption">{t('menu.bossNode', { n: item.id, boss: t(stageBossDef.name) })}</em>}
              {status === 'current' && <em className="nodeCaption nowCaption">{t('menu.current')}</em>}
              {status === 'cleared' && <i className="nodeSeal" aria-label={t('menu.cleared')} />}
              {starCount(records[`${chapter}-${item.id}`]) > 0 && <i className="nodeStar" role="img" aria-label={t('menu.starsLabel', { n: starCount(records[`${chapter}-${item.id}`]) })}>{'★'.repeat(starCount(records[`${chapter}-${item.id}`]))}</i>}
              {locked && <span className="srOnly" id={reasonId}>{t('menu.stageLocked')}</span>}
            </button>
          );
        })}
        </div>
      </div>

      {DEVELOPER_UI_AVAILABLE && <label className="devToggle">
        <input type="checkbox" checked={developerMode} onChange={(event) => setDeveloperMode(event.target.checked)} />
        <span>개발자 모드: 모든 Stage 접근</span>
      </label>}

      <div className="stageDetail">
        <section className="stageBrief" aria-labelledby="stage-brief-title">
          <p className="eyebrow">{t('menu.stageEyebrow', { n: selectedStage.id, kind: t(`menu.kind.${selectedStage.kind}`) })}</p>
          <h3 id="stage-brief-title">{boss ? t(boss.name) : goal && typeof goal === 'object' ? tx(goal) : tx(selectedStage.objective)}</h3>
          <p className="stageLine">{boss ? tx(selectedStage.objective) : t('menu.surviveLine', { time: formatClock(duration) })}</p>
          {objectiveInfo && objectiveInfo.changes.length > 0 && (
            <p className="stageChanges"><span>{t('menu.changes')}</span> {objectiveInfo.changes.map((change) => tx(change)).join(' · ')}</p>
          )}
          <dl className="stageFacts">
            <div>
              <dt>{t('menu.enemies')}</dt>
              <dd className="enemyIcons">
                {ENEMY_ROLES.map((role) => <span className="artEnemy" data-art={`${chapter}-${role}`} role="img" aria-label={t(`role.${role}`)} title={t(`role.${role}`)} key={role} />)}
              </dd>
            </div>
            <div>
              <dt>{t('menu.reward')}</dt>
              <dd>{t('menu.rewardValue', { gold: reward.gold, xp: reward.xp })}</dd>
            </div>
            {objectiveInfo && (
              <div>
                <dt>{t('menu.bonus')}</dt>
                <dd>{tx(objectiveInfo.goal)}{record?.bonus && <span className="bonusStar" role="img" aria-label={t('menu.bonusMet')}> ★</span>}</dd>
              </div>
            )}
            <div>
              <dt>{t('menu.stars')}</dt>
              <dd className="stageStars">
                {stageStars(record).map((on, index) => {
                  const label = t(STAR_LABELS[index === 1 && selectedStage.kind !== 'normal' ? 3 : index]);
                  return <span className={on ? 'on' : undefined} title={label} key={index}>{on ? '★' : '☆'}<span className="srOnly">{t(on ? 'menu.starOn' : 'menu.starOff', { star: label })}</span></span>;
                })}
              </dd>
            </div>
            <div>
              <dt>{t('menu.best')}</dt>
              <dd>
                {record && record.bestClearSeconds !== null
                  ? t('menu.bestValue', { time: formatClock(record.bestClearSeconds), kills: record.bestKills })
                  : record ? t('menu.bestSurvival', { time: formatClock(record.bestSurvivalSeconds), kills: record.bestKills }) : '—'}
                {record?.noHit && <span className="assistTag">{t('menu.noHit')}</span>}
                {record?.assisted && <span className="assistTag">{t('menu.bestAssisted')}</span>}
              </dd>
            </div>
          </dl>
          <div className="stageActions">
            <button
              className="primary launch"
              onClick={startRun}
              aria-disabled={selectedStageLocked}
              aria-describedby={selectedStageLocked ? 'selected-stage-lock-reason' : undefined}
              title={selectedStageLocked ? t('menu.stageLocked') : tx(selectedStage.objective)}
            >
              <span className="launchStage">{address}</span> <span className="launchLabel">{t('menu.go')}</span>
              <Glyph action="confirm" />
              {selectedStageLocked && <span className="srOnly" id="selected-stage-lock-reason">{t('menu.stageLocked')}</span>}
            </button>
            <button className="ghost" type="button" onClick={() => setMenuView('growth')}>{t('menu.buildStats')}</button>
          </div>
        </section>
        <section className="loadoutSummary" aria-labelledby="loadout-title">
          <h3 id="loadout-title">{t('menu.loadout')}</h3>
          <StatGrid stats={visibleStats} />
          {meta.passivePoints > 0 && <button className="linkButton" type="button" onClick={() => setMenuView('growth')}>{t('menu.pointsHint', { n: meta.passivePoints })}</button>}
        </section>
      </div>

      {DEVELOPER_UI_AVAILABLE && developerAccess && <div className="menuSection cheatMenu">
        <h2>Cheat Code</h2>
        <div className="cheatRow">
          <input aria-label="Cheat code" value={cheatCode} onChange={(event) => setCheatCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') applyCheat(); }} placeholder="DEV / GOLD999 / GOD / COIN / MAGNET / NUKE" />
          <button className="ghost" onClick={applyCheat}>입력</button>
        </div>
        {cheatMessage && <div className="emptyText" role="status" aria-live="polite" aria-atomic="true">{cheatMessage}</div>}
      </div>}
    </>
  );
}

function GrowthView({ meta, visibleStats, buyMetaUpgrade, buyPassive }: Pick<MenuScreenProps, 'meta' | 'visibleStats' | 'buyMetaUpgrade' | 'buyPassive'>) {
  return (
    <>
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
            const maxed = level >= def.max;
            const reason = maxed ? t('menu.maxLevel') : meta.gold < cost ? t('menu.goldShort', { n: cost - meta.gold }) : undefined;
            const reasonId = `meta-upgrade-${id}-reason`;
            const next = upgradeEffect(meta, id);
            return (
              <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? t(`upgrade.${id}.line`)} onClick={() => buyMetaUpgrade(id)} key={id}>
                <span>{t(`upgrade.${id}`)}</span>
                <em>{t('menu.upgradeLine', { line: t(`upgrade.${id}.line`), level, max: def.max })}</em>
                {!maxed && <small className="upgradeNext">{t('menu.upgradeEffect', { stat: t(next.stat), from: next.from, to: next.to })}</small>}
                <b>{maxed ? t('price.max') : t('price.gold', { n: cost })}</b>
                {reason && <small className="upgradeReason" id={reasonId}>{reason}</small>}
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
            const maxed = level >= def.max;
            const reason = maxed ? t('menu.maxLevel') : meta.passivePoints <= 0 ? t('menu.needPoint') : undefined;
            const reasonId = `passive-${id}-reason`;
            const next = passiveEffect(meta, id);
            return (
              <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? t(`passive.${id}.line`)} onClick={() => buyPassive(id)} key={id}>
                {/* CON-07: past its first points a passive grows its branch's second node. */}
                <span>{level >= def.tier ? t('menu.passiveBranch', { first: t(`passive.${id}`), second: t(`passive.${id}.tier2`) }) : t(`passive.${id}`)}</span>
                <em>{t('menu.upgradeLine', { line: t(level >= def.tier ? `passive.${id}.tier2.line` : `passive.${id}.line`), level, max: def.max })}</em>
                {!maxed && (
                  <small className="upgradeNext">
                    {next ? t('menu.upgradeEffect', { stat: t(next.stat), from: next.from, to: next.to }) : t('menu.passiveLevel', { from: level, to: level + 1 })}
                  </small>
                )}
                <b>{t('price.point', { n: 1 })}</b>
                {reason && <small className="upgradeReason" id={reasonId}>{reason}</small>}
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
    </>
  );
}

type InfiniteProps = Pick<MenuScreenProps, 'developerAccess' | 'infinitePlayerName' | 'setInfinitePlayerName' | 'onPlayerNameBlur' | 'infiniteSeed' | 'setInfiniteSeed' | 'startInfiniteRun' | 'leaderboardStatus' | 'infiniteEntries' | 'legacyEntries'>;

function InfiniteView({ developerAccess, infinitePlayerName, setInfinitePlayerName, onPlayerNameBlur, infiniteSeed, setInfiniteSeed, startInfiniteRun, leaderboardStatus, infiniteEntries, legacyEntries }: InfiniteProps) {
  return (
    <>
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
          <input value={infinitePlayerName} maxLength={16} autoComplete="nickname" onChange={(event) => setInfinitePlayerName(event.target.value)} onBlur={onPlayerNameBlur} />
        </label>
        <label>
          <span>{t('infinite.seed')}</span>
          <input value={infiniteSeed} inputMode="numeric" maxLength={10} placeholder={t('infinite.seedEmpty')} onChange={(event) => setInfiniteSeed(event.target.value.replace(/\D/g, '').slice(0, 10))} />
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
    </>
  );
}

export function MenuScreen(props: MenuScreenProps) {
  const { meta, inlineNotice, menuView, setMenuView, handleMenuTabKey, options, setOptions, resetMeta, selectedStageLocked, startRun, suspended, onResumeSuspended, onDiscardSuspended } = props;

  useEffect(() => {
    if (menuView !== 'play') return undefined;
    // Enter starts the selected stage (UI-06), unless a control has focus and takes Enter itself.
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.defaultPrevented) return;
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && focused !== document.body && focused.closest('button, input, select, textarea, a, summary')) return;
      if (selectedStageLocked) return;
      event.preventDefault();
      startRun();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuView, selectedStageLocked, startRun]);

  return (
    <main className="menuLayer">
      <aside className="menuSide">
        <header className="titleBlock">
          <p className="eyebrow">
            BLACKLINE SURVIVOR <span className="appVersion">v{APP_VERSION}</span>
            {DEVELOPER_UI_DEFAULT_ENABLED && <span className="developerBuildBadge">DEV APP</span>}
          </p>
          <h1>{t('game.title')}</h1>
        </header>
        <nav className="menuNav" role="tablist" aria-orientation="vertical" aria-label={t('menu.tabs')}>
          {NAV.map((view) => (
            <button
              id={`menu-tab-${view}`}
              className={menuView === view ? 'menuNavItem active' : 'menuNavItem'}
              role="tab"
              aria-selected={menuView === view}
              aria-controls={`menu-panel-${view}`}
              tabIndex={menuView === view ? 0 : -1}
              onKeyDown={handleMenuTabKey}
              onClick={() => setMenuView(view)}
              key={view}
            >
              <b>{t(`menu.nav.${view}`)}</b>
              <small>
                {view === 'growth' && meta.passivePoints > 0
                  ? t('menu.nav.growth.points', { n: meta.passivePoints })
                  : view === 'codex' ? t('menu.nav.codex.note', { found: codexFound(props.profile.codex), total: CODEX_TOTAL }) : t(`menu.nav.${view}.note`)}
              </small>
            </button>
          ))}
        </nav>
        <div className="menuKeyart" aria-hidden="true"><span className="artKeyart" data-art="hero" /></div>
      </aside>

      <section className="menuMain">
        <div className="menuTopbar">
          <div className="wallet">
            <span>{t('wallet.gold')}</span>
            <strong>{formatCount(meta.gold)}</strong>
          </div>
          <div className="accountChip">
            <span>{t('wallet.level', { level: meta.level })}</span>
            {props.profile.cosmetics.title && <small className="walletTitle">{t(`cosmetic.${props.profile.cosmetics.title as CosmeticId}`)}</small>}
            <ProgressBar label={t('menu.levelXp')} value={meta.xp} max={xpForMetaLevel(meta.level)} className="xpBar" valueText={`${meta.xp} / ${xpForMetaLevel(meta.level)}`} />
            {meta.passivePoints > 0 && <b className="pointBadge">{t('wallet.points', { n: meta.passivePoints })}</b>}
          </div>
        </div>

        {inlineNotice}

        {suspended && (
          <section className="resumeStrip" aria-labelledby="resume-title">
            <h3 id="resume-title">{t('resume.title')}</h3>
            <p>
              {suspended.mode === 'infinite'
                ? t('resume.infinite', { time: formatClock(suspended.elapsed) })
                : t('resume.campaign', { address: t('stage.address', { chapter: suspended.chapter, stage: suspended.stage }), time: formatClock(suspended.elapsed) })}
            </p>
            <button className="primary" type="button" onClick={onResumeSuspended}>{t('resume.go')}</button>
            <button className="ghost" type="button" data-sound="cancel" onClick={onDiscardSuspended}>{t('resume.discard')}</button>
          </section>
        )}

        <div className="menuPanel playPanel" id="menu-panel-play" role="tabpanel" aria-labelledby="menu-tab-play" hidden={menuView !== 'play'}>
          <PlayView {...props} />
        </div>
        <div className="menuPanel infiniteColumn" id="menu-panel-infinite" role="tabpanel" aria-labelledby="menu-tab-infinite" hidden={menuView !== 'infinite'}>
          <InfiniteView {...props} />
        </div>
        <div className="menuPanel upgradeColumn" id="menu-panel-growth" role="tabpanel" aria-labelledby="menu-tab-growth" hidden={menuView !== 'growth'}>
          <GrowthView {...props} />
        </div>
        <div className="menuPanel codexColumn" id="menu-panel-codex" role="tabpanel" aria-labelledby="menu-tab-codex" hidden={menuView !== 'codex'}>
          {menuView === 'codex' && <CodexView profile={props.profile} meta={meta} bestInfiniteSeconds={props.bestInfiniteSeconds} onBuyCosmetic={props.onBuyCosmetic} onWearCosmetic={props.onWearCosmetic} />}
        </div>
        <div className="menuPanel settingsColumn" id="menu-panel-settings" role="tabpanel" aria-labelledby="menu-tab-settings" hidden={menuView !== 'settings'}>
          <h2>{t('menu.nav.settings')}</h2>
          <SettingsPanel options={options} setOptions={setOptions}>
            <SaveTransfer />
            <fieldset>
              <legend>{t('menu.resetLegend')}</legend>
              <button className="ghost" type="button" onClick={resetMeta}>{t('menu.resetProgress')}</button>
            </fieldset>
          </SettingsPanel>
        </div>
      </section>
    </main>
  );
}
