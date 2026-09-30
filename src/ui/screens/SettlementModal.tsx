// Settlement (UI-05): the result first, then the numbers behind it, then where to go next.
// - A clear shows the hero's victory portrait under an ink seal; a defeat the hurt portrait over an ink bleed.
// - Survival time, kills, highest level, and damage taken, with a badge for each new stage record.
// - Gold counts up to its sum and lists the parts it is made of; outer XP and any account level-up follow.
// - A first clear that opens a stage or a chapter says so.
// - Each skill's share of the damage dealt, as bars.
// Activation waits SETTLEMENT_INPUT_GUARD_MS after it opens (BUG-05), and Enter starts the next stage.
import { useEffect, useRef, useState } from 'react';
import { FINAL_CHAPTER } from '../../content/campaign';
import { CHAPTERS, SKILLS, formatClock, type Settlement, type SkillId, type StageProgress } from '../../game/GameEngine';
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

const GOLD_PARTS: readonly (readonly [keyof Settlement['goldParts'], string])[] = [
  ['base', '기본'],
  ['boss', '보스'],
  ['kills', '처치'],
  ['coins', '코인 환산'],
  ['stage', 'Stage 보너스'],
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
    <section className="settlementDamage" aria-label="스킬별 피해 비율">
      <h3>피해 기여</h3>
      <ul>
        {rows.map(([id, value]) => (
          <li key={id}>
            <span className="artSlot" data-art={id} aria-hidden="true" />
            <span className="settlementDamageName">{SKILLS[id].name}</span>
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
  const heading = infinite ? '무한 기록' : settlement.gameComplete ? `${FINAL_CHAPTER}챕터 돌파` : won ? 'Stage 돌파' : '쓰러짐';
  const place = infinite ? `생존 ${formatClock(settlement.survivedSeconds)}` : `Ch.${settlement.chapter} / St.${settlement.stage}`;
  const objective = CHAPTERS[settlement.chapter - 1]?.stages[settlement.stage - 1]?.objective ?? '';
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
          {won && <span className="settlementSeal">돌파</span>}
        </span>
        <div>
          <p>{place}</p>
          <h2 id="settlement-dialog-title">{heading}</h2>
          {!infinite && <p className="settlementTitle">{settlement.practice ? `${objective} · 연습` : objective}</p>}
        </div>
      </header>

      {infinite ? (
        <div className="settlementGrid infiniteResultGrid">
          <div className="scoreResult"><span>최종 점수</span><b>{settlement.score.toLocaleString('ko-KR')}</b></div>
          <div><span>생존 시간</span><b>{formatClock(settlement.survivedSeconds)}</b></div>
          <div><span>보스 처치</span><b>{settlement.bossKills}</b></div>
          <div><span>전체 처치</span><b>{settlement.kills}</b></div>
          <div><span>최고 레벨</span><b>{settlement.level}</b></div>
          <div><span>받은 피해</span><b>{Math.round(settlement.damageTaken)}</b></div>
        </div>
      ) : (
        <div className="settlementGrid">
          <div><span>생존 시간</span><b>{formatClock(settlement.clearSeconds)}</b>{notes.newTime && <em className="recordBadge">최단 기록</em>}</div>
          <div><span>처치</span><b>{settlement.kills}</b>{notes.newKills && <em className="recordBadge">처치 신기록</em>}</div>
          <div><span>최고 레벨</span><b>{settlement.level}</b></div>
          <div><span>받은 피해</span><b>{Math.round(settlement.damageTaken)}</b></div>
        </div>
      )}

      <section className="settlementRewards" aria-label="보상">
        <div className="settlementGold">
          <span>획득 골드</span>
          <b aria-live="off">{gold}</b>
          <ul aria-label="골드 산식">
            {GOLD_PARTS.map(([key, label]) => settlement.goldParts[key] > 0 && <li key={key}>{label} {Math.floor(settlement.goldParts[key])}</li>)}
          </ul>
        </div>
        <div className="settlementXp">
          <span>외부 XP</span>
          <b>+{settlement.xp}</b>
          {notes.levelUp && <p className="levelUpBanner" role="status">외부 레벨 {notes.levelUp} 달성 · 패시브 포인트 +{notes.passivePoints}</p>}
        </div>
      </section>

      {notes.unlocked && (
        <p className="unlockBanner" role="status">
          {notes.unlocked.stage === 1 ? `Chapter ${notes.unlocked.chapter} 해금` : `Ch.${notes.unlocked.chapter} / St.${notes.unlocked.stage} 해금`}
        </p>
      )}

      <DamageBars damage={settlement.damageBySkill} />

      {infinite && <div className={settlement.scoreEligible ? 'soonStrip recordSaved' : 'soonStrip recordRejected'}>{leaderboardStatus || (settlement.scoreEligible ? '경쟁 기록 판정 완료' : '연습 · 기록 제외')}</div>}
      {infinite && seedCopyStatus && <p className="seedStatus" role="status" aria-live="polite">{seedCopyStatus}</p>}
      {settlement.gameComplete && <div className="soonStrip">Chapter {FINAL_CHAPTER + 1} Coming Soon</div>}
      {settlement.practice && <div className="soonStrip">연습 Stage는 해금에 반영되지 않고 보상은 30%입니다.</div>}
      {!settlement.practice && settlement.cleared && !settlement.gameComplete && !goNext && <div className="soonStrip">다음 Stage는 Stage 선택에서 시작할 수 있습니다.</div>}

      <div className="modalActions">
        {goNext && <button className="primary" onClick={() => onNextStage(goNext)}>다음 Stage (Ch.{goNext.chapter} / St.{goNext.stage})<kbd aria-hidden="true">Enter</kbd></button>}
        <button className="ghost" onClick={onRetry}>다시 도전</button>
        <button className={goNext ? 'ghost' : 'primary'} onClick={onMenu}>메뉴로</button>
        {infinite && <button className="ghost" type="button" onClick={onCopyInfiniteResult}>결과 복사</button>}
      </div>
    </ModalDialog>
  );
}
