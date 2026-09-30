// In-run HUD (UI-01, UI-02), concept A. Top left: the hero portrait with the level seal, HP, and the skill slots.
// Top centre: the clock and the objective. Top right: the coin and kill chips and the run buttons. The XP strip runs
// along the top edge, and the boss bar sits at the bottom: portrait, phase diamonds, move, and enrage state. Nothing
// sits on a panel, so the HUD covers little of the field, and the centre stays clear. Slots and chips use no signal
// colour (V2). HUD buttons never keep focus away from play (BUG-04): the input adapter handles that.
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { DEVELOPER_UI_AVAILABLE } from '../../platform/developerAccess';
import { LOW_HEALTH_RATIO, SKILLS, SKILL_IDS, formatClock, type HudSnapshot } from '../../game/GameEngine';
import { MAX_SKILL_LEVEL } from '../../game/grammar';
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

/** How long the portrait winces after the hero loses health. */
const HURT_FACE_MS = 500;

const STAGE_KIND = { normal: '생존', midBoss: '중간 보스', finalBoss: '챕터 보스' } as const;

function SkillSlots({ snapshot }: { snapshot: HudSnapshot }) {
  const rows = [true, false].map((active) => SKILL_IDS.filter((id) => snapshot.skills[id] && SKILLS[id].active === active));
  return (
    <div className="skillSlots" aria-label="보유 스킬">
      {rows.map((ids, row) => ids.length > 0 && (
        <ul key={row}>
          {ids.map((id) => {
            const state = snapshot.skills[id]!;
            const cooldown = snapshot.cooldowns[id] ?? 0;
            return (
              <li className="skillSlot" key={id} aria-label={`${SKILLS[id].name} Lv.${state.level}${state.awakened ? ' 각성' : ''}`}>
                <span className="artSlot" data-art={state.awakened ? `${id}-awakened` : id} />
                {cooldown > 0 && <i className="slotCooldown" style={{ '--cooldown': cooldown } as CSSProperties} />}
                {state.level >= MAX_SKILL_LEVEL && !state.awakened && <i className="slotAwaken" title="각성 가능" />}
                <span className="levelPips" aria-hidden="true">
                  {Array.from({ length: MAX_SKILL_LEVEL }, (_, pip) => <i key={pip} className={pip < state.level ? 'on' : undefined} />)}
                </span>
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}

function BossBar({ snapshot }: { snapshot: HudSnapshot }) {
  const phase = snapshot.bossPhase ?? 1;
  const enrage = snapshot.bossEnrage ?? 0;
  const steps = snapshot.bossEnrageSteps ?? 1;
  return (
    <section className={enrage > 0 ? 'bossBar enraged' : 'bossBar'} aria-label="보스">
      <span className="artPortrait" data-art={enrage > 0 ? `${snapshot.bossId}-enraged` : snapshot.bossId} aria-hidden="true" />
      <div className="bossBody">
        <div className="bossLine">
          <strong>{snapshot.bossName}</strong>
          <span>{phase} 페이즈 <i aria-hidden="true">{'◆'.repeat(phase)}{'◇'.repeat(Math.max(0, 3 - phase))}</i></span>
        </div>
        <ProgressBar label={`${snapshot.bossName} 체력`} value={snapshot.bossHp ?? 0} max={snapshot.bossMaxHp ?? 1} className="bossHp" />
        <div className="bossLine">
          <span>{snapshot.bossMoveName ? `패턴 · ${snapshot.bossMoveName}` : ''}</span>
          <span className={enrage > 0 ? 'bossRage on' : 'bossRage'}>
            {enrage > 0 ? (steps > 1 ? `광폭화 ${enrage}/${steps}` : '광폭화') : snapshot.runMode === 'campaign' ? `광폭화까지 ${formatClock(snapshot.timeLeft)}` : ''}
          </span>
        </div>
      </div>
    </section>
  );
}

export function HudLayer({ snapshot, playing, runPaused, sidePanelOpen, drawerToggleRef, onToggleSpeed, onToggleDrawer, onTogglePause }: HudLayerProps) {
  const infinite = snapshot.runMode === 'infinite';
  const lastHp = useRef(snapshot.hp);
  const [hurtAt, setHurtAt] = useState(-Infinity);
  useEffect(() => {
    if (snapshot.hp < lastHp.current - 0.5) setHurtAt(performance.now());
    lastHp.current = snapshot.hp;
  }, [snapshot.hp]);
  const low = snapshot.hp > 0 && snapshot.hp <= snapshot.maxHp * LOW_HEALTH_RATIO;
  const face = performance.now() - hurtAt < HURT_FACE_MS
    ? 'hurt'
    : low
      ? 'lowhp'
      : snapshot.bossName
        ? 'focus'
        : SKILL_IDS.some((id) => snapshot.skills[id]?.awakened) ? 'awakened' : 'calm';
  const bossStage = snapshot.stageKind !== 'normal';
  return (
    <>
      {playing && (
        <p className="srOnly" id="game-state-summary">
          {infinite
            ? `무한 모드. 경과 시간 ${formatClock(snapshot.elapsed)}. 점수 ${snapshot.score}. 보스 처치 ${snapshot.bossKills}.`
            : `Chapter ${snapshot.chapter}, Stage ${snapshot.stage}. 남은 시간 ${formatClock(snapshot.timeLeft)}.`}
          체력 {Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}. WASD, 방향키, 포인터 또는 게임패드로 이동합니다.
          P, Escape 또는 게임패드 Start로 일시정지합니다. {runPaused ? '현재 일시정지 상태입니다.' : ''}
        </p>
      )}
      <ProgressBar label="런 레벨 경험치" value={snapshot.xp} max={snapshot.nextXp} className="xpStrip" valueText={`Lv.${snapshot.level} ${Math.floor(snapshot.xp)} / ${snapshot.nextXp}`} />
      <div className={sidePanelOpen ? 'gameHud panelOpen' : 'gameHud panelClosed'}>
        <section className="hudHero" aria-label="주인공">
          <div className="heroFace">
            <span className="artPortrait" data-art={`hero-${face}`} aria-hidden="true" />
            <b className="levelSeal" aria-label={`레벨 ${snapshot.level}`}>{snapshot.level}</b>
          </div>
          <div className="heroBody">
            <div className="heroLine">
              <strong>{infinite ? `무한 · DANGER ${snapshot.dangerRank}` : `Ch.${snapshot.chapter} / St.${snapshot.stage} · ${STAGE_KIND[snapshot.stageKind]}${snapshot.practice ? ' · 연습' : ''}`}</strong>
              <span>다음 레벨 {Math.floor((snapshot.xp / Math.max(1, snapshot.nextXp)) * 100)}%</span>
            </div>
            <div className="hpLine">
              <ProgressBar label="플레이어 체력" value={snapshot.hp} max={snapshot.maxHp} className={low ? 'hpBar low' : 'hpBar'} valueText={`${Math.ceil(snapshot.hp)} / ${Math.ceil(snapshot.maxHp)}`} />
              <b>{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</b>
            </div>
            <SkillSlots snapshot={snapshot} />
          </div>
        </section>
        <section className="hudClock" aria-label="시간과 목표">
          <div className="timer">{formatClock(infinite ? snapshot.elapsed : snapshot.timeLeft)}</div>
          <div className="timerSub">{infinite ? '경과 시간' : bossStage ? '광폭화까지' : '남은 시간'}</div>
          <div className="objectiveChip">
            {infinite
              ? `점수 ${snapshot.score.toLocaleString('ko-KR')} · 보스 ${snapshot.bossKills}`
              : bossStage
                ? `목표 · ${snapshot.bossName ?? '보스'} 처치 ${snapshot.objectiveProgress} / ${snapshot.objectiveTarget}`
                : snapshot.objective}
          </div>
          {infinite && <div className={snapshot.scoreEligible ? 'recordState eligible' : 'recordState practice'}>{snapshot.scoreEligible ? '경쟁 기록' : '연습 · 기록 제외'}</div>}
        </section>
        <section className="hudChips">
          <span className="hudChip" title="코인"><i className="artPickup" data-art="coin" aria-hidden="true" /><span className="srOnly">코인</span>{snapshot.coins}</span>
          <span className="hudChip" title={infinite ? '보스 처치' : '처치'}><i className="killMark" aria-hidden="true" /><span className="srOnly">{infinite ? '보스 처치' : '처치'}</span>{infinite ? snapshot.bossKills : snapshot.kills}</span>
          {DEVELOPER_UI_AVAILABLE && <span className="hudChip devOnly" title="적">적 {snapshot.enemyCount}</span>}
          <button className={snapshot.timeScale === 2 ? 'primary small iconButton active' : 'primary small iconButton'} onClick={onToggleSpeed} aria-pressed={snapshot.timeScale === 2} aria-label={`게임 속도 ${snapshot.timeScale === 2 ? '1배속' : '2배속'}으로 변경`} title="게임 속도">
            <span aria-hidden="true">{snapshot.timeScale === 2 ? '×2' : '×1'}</span>
          </button>
          <button ref={drawerToggleRef} className="ghost small iconButton" onClick={onToggleDrawer} aria-expanded={sidePanelOpen} aria-controls="run-drawer" aria-label={sidePanelOpen ? '런 패널 닫기' : '런 패널 열기'} title="런 패널">
            <span aria-hidden="true">{sidePanelOpen ? '×' : '☰'}</span>
          </button>
          <button className="ghost small iconButton" onClick={onTogglePause} aria-pressed={runPaused} aria-label={runPaused ? '일시정지 해제' : '게임 일시정지'} title="일시정지 (P / Esc)"><span aria-hidden="true">{runPaused ? '▶' : 'Ⅱ'}</span></button>
        </section>
      </div>
      {snapshot.bossName && <BossBar snapshot={snapshot} />}
      {snapshot.activeEffects.length > 0 && (
        <div className="effectRack" role="status" aria-live="polite" aria-label="현재 버프와 디버프">
          {snapshot.activeEffects.map((effect) => (
            // Silence and root show as timers over the hero (UI-02); the rack still announces them.
            <div className={`effectItem ${effect.kind}${effect.id === 'silence' || effect.id === 'root' ? ' srOnly' : ''}`} key={effect.id}>
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
