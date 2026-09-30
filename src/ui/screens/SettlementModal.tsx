// Settlement modal (UI-01): the result of a stage or an infinite run, and where to go next. Activation is guarded
// for DIALOG_INPUT_GUARD_MS after it opens (BUG-05).
import { FINAL_CHAPTER } from '../../content/campaign';
import { formatClock, type Settlement, type StageProgress } from '../../game/GameEngine';
import { ModalDialog } from '../ModalDialog';
import { DIALOG_INPUT_GUARD_MS } from './constants';

export type SettlementModalProps = {
  settlement: Settlement;
  defeated: boolean;
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

export function SettlementModal({ settlement, defeated, leaderboardStatus, seedCopyStatus, nextStage, nextStageOpen, onNextStage, onMenu, onRetry, onCopyInfiniteResult }: SettlementModalProps) {
  return (
    <ModalDialog className="settlementBox" labelledBy="settlement-dialog-title" onEscape={onMenu} inputGuardMs={DIALOG_INPUT_GUARD_MS}>
      <div className="modalHead">
        <p>{settlement.runMode === 'infinite' ? 'INFINITE RUN END' : defeated ? 'STAGE MATCH END' : settlement.gameComplete ? `CHAPTER ${FINAL_CHAPTER} CLEAR` : `CH.${settlement.chapter} / ST.${settlement.stage}`}</p>
        <h2 id="settlement-dialog-title">{settlement.gameComplete ? `${FINAL_CHAPTER}챕터 돌파` : settlement.title}</h2>
      </div>
      {settlement.runMode === 'infinite' ? (
        <div className="settlementGrid infiniteResultGrid">
          <div className="scoreResult"><span>최종 점수</span><b>{settlement.score.toLocaleString('ko-KR')}</b></div>
          <div><span>생존 시간</span><b>{formatClock(settlement.survivedSeconds)}</b></div>
          <div><span>보스 처치</span><b>{settlement.bossKills}</b></div>
          <div><span>전체 처치</span><b>{settlement.kills}</b></div>
          <div><span>획득 골드</span><b>{settlement.gold}</b></div>
          <div><span>외부 XP</span><b>{settlement.xp}</b></div>
        </div>
      ) : (
        <div className="settlementGrid">
          <div><span>처치</span><b>{settlement.kills}</b></div>
          <div><span>획득 코인 <small>골드 환산 ×0.28</small></span><b>{settlement.coinsEarned}</b></div>
          <div><span>획득 골드</span><b>{settlement.gold}</b></div>
          <div><span>외부 XP</span><b>{settlement.xp}</b></div>
        </div>
      )}
      {settlement.runMode === 'infinite' && <div className={settlement.scoreEligible ? 'soonStrip recordSaved' : 'soonStrip recordRejected'}>{leaderboardStatus || (settlement.scoreEligible ? '경쟁 기록 판정 완료' : 'PRACTICE / 기록 제외')}</div>}
      {settlement.runMode === 'infinite' && seedCopyStatus && <p className="seedStatus" role="status" aria-live="polite">{seedCopyStatus}</p>}
      {settlement.gameComplete && <div className="soonStrip">Chapter {FINAL_CHAPTER + 1} Coming Soon</div>}
      {settlement.practice && <div className="soonStrip">연습 Stage는 해금에 반영되지 않고 보상은 30%입니다.</div>}
      {!settlement.practice && settlement.cleared && !settlement.gameComplete && <div className="soonStrip">{nextStageOpen ? 'Stage 클리어. 다음 Stage로 바로 이어갈 수 있습니다.' : 'Stage 클리어. 다음 Stage는 Stage 선택에서 시작할 수 있습니다.'}</div>}
      <div className="modalActions">
        {nextStage && nextStageOpen && <button className="primary" onClick={() => onNextStage(nextStage)}>다음 Stage (Ch.{nextStage.chapter} / St.{nextStage.stage})</button>}
        <button className={nextStageOpen ? 'ghost' : 'primary'} onClick={onMenu}>{settlement.runMode === 'infinite' ? '무한 경쟁' : 'Stage 선택'}</button>
        <button className="ghost" onClick={onRetry}>{settlement.runMode === 'infinite' ? '다시 도전' : defeated ? '재시작' : '같은 Stage 재시작'}</button>
        {settlement.runMode === 'infinite' && <button className="ghost" type="button" onClick={onCopyInfiniteResult}>결과 복사</button>}
      </div>
    </ModalDialog>
  );
}
