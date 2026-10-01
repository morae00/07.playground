// Settlement (UI-05): the result first, then the numbers behind it, then where to go next.
// - A clear shows the hero's victory portrait under an ink seal; a defeat the hurt portrait over an ink bleed.
// - Survival time, kills, highest level, and damage taken, with a badge for each new stage record.
// - Gold counts up to its sum and lists the parts it is made of; outer XP and any account level-up follow.
// - A first clear that opens a stage or a chapter says so.
// - Each skill's share of the damage dealt, as bars.
// Activation waits SETTLEMENT_INPUT_GUARD_MS after it opens (BUG-05), and Enter starts the next stage.
import { useEffect, useRef, useState } from 'react';
import { FINAL_CHAPTER } from '../../content/campaign';
import { CHAPTERS, formatClock, type Settlement, type SkillId, type StageProgress } from '../../game/GameEngine';
import { formatCount, t, tx } from '../../i18n/strings';
import type { StringKey } from '../../i18n/text';
import { Glyph } from '../Glyph';
import { ModalDialog } from '../ModalDialog';
import type { SettlementNotes } from '../settlementNotes';
import { SETTLEMENT_INPUT_GUARD_MS } from './constants';

export type SettlementModalProps = {
  settlement: Settlement;
  defeated: boolean;
  /** New records and account level-ups this result brings (settlementNotes). */
  notes: SettlementNotes;
  reducedMotion: boolean;
  leaderboardStatus: string;
  seedCopyStatus: string;
  /** The next stage when this one was cleared, and whether it can be started now. */
  nextStage: StageProgress | null;
  nextStageOpen: boolean;
  onNextStage: (address: StageProgress) => void;
  onMenu: () => void;
  onRetry: () => void;
  onCopyInfiniteResult: () => void;
};

const GOLD_PARTS: readonly (readonly [keyof Settlement['goldParts'], StringKey])[] = [
  ['base', 'settle.gold.base'],
  ['boss', 'settle.gold.boss'],
  ['kills', 'settle.gold.kills'],
  ['coins', 'settle.gold.coins'],
  ['stage', 'settle.gold.stage'],
  ['bonus', 'settle.gold.bonus'],
];
const COUNT_UP_MS = 700;
/** Skills shown in the damage bars, most damage first. */
const DAMAGE_ROWS = 5;

/** Counts from 0 to `target` with an ease-out; shows the target at once under reduced motion. */
function useCountUp(target: number, reduced: boolean) {
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return value;
}

function DamageBars({ damage }: { damage: Settlement['damageBySkill'] }) {
  const rows = (Object.entries(damage) as [SkillId, number][]).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).slice(0, DAMAGE_ROWS);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  if (total <= 0) return null;
  return (
    <section className="settlementDamage" aria-label={t('settle.damage.label')}>
      <h3>{t('settle.damage')}</h3>
      <ul>
        {rows.map(([id, value]) => (
          <li key={id}>
            <span className="artSlot" data-art={id} aria-hidden="true" />
            <span className="settlementDamageName">{t(`skill.${id}`)}</span>
            <span className="settlementDamageBar" aria-hidden="true"><i style={{ width: `${Math.round((value / rows[0][1]) * 100)}%` }} /></span>
            <b>{Math.round((value / total) * 100)}%</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SettlementModal({ settlement, defeated, notes, reducedMotion, leaderboardStatus, seedCopyStatus, nextStage, nextStageOpen, onNextStage, onMenu, onRetry, onCopyInfiniteResult }: SettlementModalProps) {
  const infinite = settlement.runMode === 'infinite';
  const reduced = reducedMotion || (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const gold = useCountUp(settlement.gold, reduced);
  const won = !defeated && settlement.cleared;
  const heading = infinite
    ? t('settle.heading.infinite')
    : settlement.gameComplete ? t('settle.heading.complete', { chapter: FINAL_CHAPTER }) : t(won ? 'settle.heading.clear' : 'settle.heading.defeat');
  const place = infinite ? t('settle.survived', { time: formatClock(settlement.survivedSeconds) }) : t('stage.address', { chapter: settlement.chapter, stage: settlement.stage });
  const stageObjective = CHAPTERS[settlement.chapter - 1]?.stages[settlement.stage - 1]?.objective;
  const objective = stageObjective ? tx(stageObjective) : '';
  const goNext = nextStage && nextStageOpen ? nextStage : null;

  // The app re-renders on every HUD snapshot, so the Enter listener reads the next stage through a ref and is set
  // up once: re-registering would restart its guard clock.
  const nextRef = useRef<(() => void) | null>(null);
  nextRef.current = goNext ? () => onNextStage(goNext) : null;
  useEffect(() => {
    // Enter starts the next stage once the input guard has passed (BUG-05); a focused button keeps its own Enter.
    const openedAt = performance.now();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || performance.now() - openedAt < SETTLEMENT_INPUT_GUARD_MS) return;
      if (!nextRef.current || document.activeElement instanceof HTMLButtonElement) return;
      event.preventDefault();
      nextRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ModalDialog className={won ? 'settlementBox settlementWon' : 'settlementBox settlementLost'} labelledBy="settlement-dialog-title" onEscape={onMenu} inputGuardMs={SETTLEMENT_INPUT_GUARD_MS}>
      <header className="settlementHead">
        <span className="settlementFace" aria-hidden="true">
          <span className="artPortrait" data-art={won ? 'hero-victory' : 'hero-hurt'} />
          {won && <span className="settlementSeal">{t('settle.seal')}</span>}
        </span>
        <div>
          <p>{place}</p>
          <h2 id="settlement-dialog-title">{heading}</h2>
          {!infinite && <p className="settlementTitle">{settlement.practice ? t('settle.practice', { objective }) : objective}{settlement.assisted && <span className="assistTag">{t('settle.assisted')}</span>}</p>}
          {notes.stars && (
            <p className="settlementStars" role="img" aria-label={t('menu.starsLabel', { n: notes.stars.filter(Boolean).length })}>
              {notes.stars.map((on, index) => <span className={on ? 'on' : undefined} aria-hidden="true" key={index}>{on ? '★' : '☆'}</span>)}
              {notes.newStars > 0 && <em className="recordBadge">{t('settle.newStars', { n: notes.newStars })}</em>}
            </p>
          )}
        </div>
      </header>

      {infinite ? (
        <div className="settlementGrid infiniteResultGrid">
          <div className="scoreResult"><span>{t('settle.score')}</span><b>{formatCount(settlement.score)}</b></div>
          <div><span>{t('settle.time')}</span><b>{formatClock(settlement.survivedSeconds)}</b></div>
          <div><span>{t('settle.bossKills')}</span><b>{settlement.bossKills}</b></div>
          <div><span>{t('settle.allKills')}</span><b>{settlement.kills}</b></div>
          <div><span>{t('settle.level')}</span><b>{settlement.level}</b></div>
          <div><span>{t('settle.damageTaken')}</span><b>{Math.round(settlement.damageTaken)}</b></div>
        </div>
      ) : (
        <div className="settlementGrid">
          <div><span>{t('settle.time')}</span><b>{formatClock(settlement.clearSeconds)}</b>{notes.newTime && <em className="recordBadge">{t('settle.record.time')}</em>}</div>
          <div><span>{t('settle.kills')}</span><b>{settlement.kills}</b>{notes.newKills && <em className="recordBadge">{t('settle.record.kills')}</em>}</div>
          <div><span>{t('settle.level')}</span><b>{settlement.level}</b></div>
          <div><span>{t('settle.damageTaken')}</span><b>{Math.round(settlement.damageTaken)}</b></div>
        </div>
      )}

      <section className="settlementRewards" aria-label={t('settle.rewards')}>
        <div className="settlementGold">
          <span>{t('settle.gold')}</span>
          <b aria-live="off">{gold}</b>
          <ul aria-label={t('settle.gold.parts')}>
            {/* A part that rounds down to nothing (0.9 gold for one kill) is left out rather than shown as 0. */}
            {GOLD_PARTS.map(([key, label]) => Math.floor(settlement.goldParts[key]) > 0 && <li key={key}>{t(label)} {Math.floor(settlement.goldParts[key])}</li>)}
          </ul>
        </div>
        <div className="settlementXp">
          <span>{t('settle.xp')}</span>
          <b>+{settlement.xp}</b>
          {notes.levelUp && <p className="levelUpBanner" role="status">{t('settle.levelUp', { level: notes.levelUp, points: notes.passivePoints })}</p>}
        </div>
      </section>

      {settlement.bonus && (
        <p className={settlement.bonus.met ? 'bonusResult met' : 'bonusResult'}>
          {settlement.bonus.met && <span className="bonusStar" aria-hidden="true">★</span>}
          {t(settlement.bonus.met ? 'settle.bonus.met' : 'settle.bonus.missed', { goal: tx(settlement.bonus.goal) })}
        </p>
      )}

      {notes.unlocked && (
        <p className="unlockBanner" role="status">
          {t(notes.unlocked.stage === 1 ? 'settle.unlock.chapter' : 'settle.unlock.stage', notes.unlocked)}
        </p>
      )}

      <DamageBars damage={settlement.damageBySkill} />

      {infinite && <div className={settlement.scoreEligible ? 'soonStrip recordSaved' : 'soonStrip recordRejected'}>{leaderboardStatus || t(settlement.scoreEligible ? 'settle.recordChecked' : 'record.practice')}</div>}
      {infinite && seedCopyStatus && <p className="seedStatus" role="status" aria-live="polite">{seedCopyStatus}</p>}
      {settlement.gameComplete && <div className="soonStrip">{t('settle.comingSoon', { chapter: FINAL_CHAPTER + 1 })}</div>}
      {settlement.practice && <div className="soonStrip">{t('settle.practiceNote')}</div>}
      {!settlement.practice && settlement.cleared && !settlement.gameComplete && !goNext && <div className="soonStrip">{t('settle.nextFromMenu')}</div>}

      <div className="modalActions">
        {goNext && <button className="primary" onClick={() => onNextStage(goNext)}>{t('settle.next', goNext)}<Glyph action="confirm" /></button>}
        <button className="ghost" onClick={onRetry}>{t('settle.retry')}</button>
        <button className={goNext ? 'ghost' : 'primary'} onClick={onMenu}>{t('common.menu')}</button>
        {infinite && <button className="ghost" type="button" onClick={onCopyInfiniteResult}>{t('settle.copy')}</button>}
      </div>
    </ModalDialog>
  );
}
