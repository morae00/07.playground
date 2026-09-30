// In-run HUD (UI-01): the screen-reader summary of the run, the HUD bars and buttons, and the buff and debuff rack.
// HUD buttons never keep focus away from play (BUG-04): the input adapter handles that.
import type { RefObject } from 'react';
import { LOW_HEALTH_RATIO, formatClock, type HudSnapshot } from '../../game/GameEngine';
import { ProgressBar } from '../ProgressBar';

export type HudLayerProps = {
  snapshot: HudSnapshot;
  /** The summary is read only while a run is actually playing. */
  playing: boolean;
  runPaused: boolean;
  sidePanelOpen: boolean;
  drawerToggleRef: RefObject<HTMLButtonElement | null>;
  onToggleSpeed: () => void;
  onToggleDrawer: () => void;
  onTogglePause: () => void;
};

export function HudLayer({ snapshot, playing, runPaused, sidePanelOpen, drawerToggleRef, onToggleSpeed, onToggleDrawer, onTogglePause }: HudLayerProps) {
  return (
    <>
      {playing && (
        <p className="srOnly" id="game-state-summary">
          {snapshot.runMode === 'infinite'
            ? `무한 모드. 경과 시간 ${formatClock(snapshot.elapsed)}. 점수 ${snapshot.score}. 보스 처치 ${snapshot.bossKills}.`
            : `Chapter ${snapshot.chapter}, Stage ${snapshot.stage}. 남은 시간 ${formatClock(snapshot.timeLeft)}.`}
          체력 {Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}. 적 {snapshot.enemyCount}명. WASD, 방향키, 포인터 또는 게임패드로 이동합니다.
          P, Escape 또는 게임패드 Start로 일시정지합니다. {runPaused ? '현재 일시정지 상태입니다.' : ''}
        </p>
      )}
      <div className={sidePanelOpen ? 'gameHud panelOpen' : 'gameHud panelClosed'}>
        <div className="hudLeft">
          <div className="roundBadge">
            <strong>{snapshot.runMode === 'infinite' ? 'INFINITE' : `Ch.${snapshot.chapter} / St.${snapshot.stage}`}</strong>
            <span>{snapshot.runMode === 'infinite'
              ? `DANGER ${snapshot.dangerRank}`
              : `${snapshot.stageKind === 'normal'
                ? '생존'
                : snapshot.stageKind === 'midBoss'
                  ? '중간보스'
                  : '챕터보스'}${snapshot.practice ? ' · 연습' : ''}`}</span>
          </div>
          <div className="barGroup">
            <div className="barLabel">
              <span>HP</span>
              <b>{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</b>
            </div>
            <ProgressBar label="플레이어 체력" value={snapshot.hp} max={snapshot.maxHp} className={snapshot.hp > 0 && snapshot.hp <= snapshot.maxHp * LOW_HEALTH_RATIO ? 'hpBar low' : 'hpBar'} valueText={`${Math.ceil(snapshot.hp)} / ${Math.ceil(snapshot.maxHp)}`} />
          </div>
          <div className="barGroup narrow">
            <div className="barLabel">
              <span>{snapshot.objective}</span>
              <b>{snapshot.runMode === 'infinite'
                ? `${snapshot.bossKills} Boss`
                : snapshot.stageKind === 'normal'
                  ? `${formatClock(snapshot.objectiveProgress)} 생존`
                  : `${snapshot.objectiveProgress} / ${snapshot.objectiveTarget}`}</b>
            </div>
            {snapshot.runMode === 'campaign' && <ProgressBar
              label={snapshot.stageKind === 'normal' ? '생존 진행 시간' : '보스 처치 목표'}
              value={snapshot.objectiveProgress}
              max={snapshot.objectiveTarget}
              className="objectiveBar"
              valueText={snapshot.stageKind === 'normal'
                ? `${formatClock(snapshot.objectiveProgress)} / ${formatClock(snapshot.objectiveTarget)}`
                : `${snapshot.objectiveProgress} / ${snapshot.objectiveTarget}`}
            />}
            {snapshot.runMode === 'infinite' && <div className={snapshot.scoreEligible ? 'recordState eligible' : 'recordState practice'}>{snapshot.scoreEligible ? 'COMPETITIVE RECORD' : 'PRACTICE / NO RECORD'}</div>}
            <div className="barLabel subXp">
              <span>LV {snapshot.level}</span>
              <b>{Math.floor(snapshot.xp)} / {snapshot.nextXp}</b>
            </div>
            <ProgressBar label="런 레벨 경험치" value={snapshot.xp} max={snapshot.nextXp} className="xpBar mini" valueText={`${Math.floor(snapshot.xp)} / ${snapshot.nextXp}`} />
          </div>
        </div>
        <div className="hudCenter">
          <div className="timer">{formatClock(snapshot.runMode === 'infinite' ? snapshot.elapsed : snapshot.timeLeft)}</div>
          <div className="timerSub">{snapshot.runMode === 'infinite'
            ? `SCORE ${snapshot.score.toLocaleString('ko-KR')} / DANGER ${snapshot.dangerRank}`
            : snapshot.stageKind === 'normal'
              ? 'SURVIVE UNTIL ZERO'
              : 'BOSS ENRAGES AT ZERO'}</div>
          {snapshot.bossName && (
            <div className="bossStrip">
              <span>{snapshot.bossName}</span>
              <ProgressBar label={`${snapshot.bossName} 체력`} value={snapshot.bossHp ?? 0} max={snapshot.bossMaxHp ?? 1} className="bossBar" />
              {snapshot.bossMoveName && <span className="bossMoveName">{snapshot.bossMoveName}</span>}
            </div>
          )}
        </div>
        <div className="hudRight">
          <button className={snapshot.timeScale === 2 ? 'primary small iconButton active' : 'primary small iconButton'} onClick={onToggleSpeed} aria-pressed={snapshot.timeScale === 2} aria-label={`게임 속도 ${snapshot.timeScale === 2 ? '1배속' : '2배속'}으로 변경`} title="게임 속도">
            <span aria-hidden="true">{snapshot.timeScale === 2 ? '×2' : '×1'}</span>
          </button>
          <button ref={drawerToggleRef} className="ghost small iconButton" onClick={onToggleDrawer} aria-expanded={sidePanelOpen} aria-controls="run-drawer" aria-label={sidePanelOpen ? '런 패널 닫기' : '런 패널 열기'} title="런 패널">
            <span aria-hidden="true">{sidePanelOpen ? '×' : '☰'}</span>
          </button>
          <button className="ghost small iconButton" onClick={onTogglePause} aria-pressed={runPaused} aria-label={runPaused ? '일시정지 해제' : '게임 일시정지'} title="일시정지 (P / Esc)"><span aria-hidden="true">{runPaused ? '▶' : 'Ⅱ'}</span></button>
          <div className="metricLine"><span>코인</span><b>{snapshot.coins}</b></div>
          <div className="metricLine"><span>{snapshot.runMode === 'infinite' ? '보스' : '킬'}</span><b>{snapshot.runMode === 'infinite' ? snapshot.bossKills : snapshot.kills}</b></div>
          <div className="metricLine"><span>적</span><b>{snapshot.enemyCount}</b></div>
        </div>
      </div>
      {snapshot.activeEffects.length > 0 && (
        <div className="effectRack" role="status" aria-live="polite" aria-label="현재 버프와 디버프">
          {snapshot.activeEffects.map((effect) => (
            <div className={`effectItem ${effect.kind}`} key={effect.id}>
              <span className="effectMark" aria-hidden="true">{effect.kind === 'buff' ? '+' : '!'}</span>
              <span className="effectCopy">
                <b>{effect.label}</b>
                <small>{effect.value ?? (effect.remaining !== undefined
                  ? `${effect.remaining < 10 ? effect.remaining.toFixed(1) : Math.ceil(effect.remaining)}s`
                  : 'ACTIVE')}</small>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
