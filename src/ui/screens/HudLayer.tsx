// In-run HUD (UI-01, UI-02), concept A. Top left: the hero portrait with the level seal, HP, and the skill slots.
// Top centre: the clock and the objective. Top right: the coin and kill chips and the run buttons. The XP strip runs
// along the top edge, and the boss bar sits at the bottom: portrait, phase diamonds, move, and enrage state. Nothing
// sits on a panel, so the HUD covers little of the field, and the centre stays clear. Slots and chips use no signal
// colour (V2). HUD buttons never keep focus away from play (BUG-04): the input adapter handles that.
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { DEVELOPER_UI_AVAILABLE } from '../../platform/developerAccess';
import { LOW_HEALTH_RATIO, SKILLS, SKILL_IDS, formatClock, type HudSnapshot } from '../../game/GameEngine';
import { MAX_SKILL_LEVEL } from '../../game/grammar';
import { formatCount, t, tx } from '../../i18n/strings';
import { glyph } from '../Glyph';
import { useInputDevice } from '../inputDevice';
import { loadBossTitles, loadLandmarkTitles, type BossTitle, type LandmarkTitle } from '../bossTitles';
import { loadStory } from '../story';
import { ProgressBar } from '../ProgressBar';
import { effectAnnouncement } from '../effectAnnouncement';

export type HudLayerProps = {
  snapshot: HudSnapshot;
  /** The summary is read only while a run is actually playing. */
  playing: boolean;
  runPaused: boolean;
  /** Developer builds with developer mode on: the cheat panel's toggle (UI-04). Players buy and change settings in the pause hub. */
  devTools: boolean;
  devPanelOpen: boolean;
  devToggleRef: RefObject<HTMLButtonElement | null>;
  onToggleSpeed: () => void;
  onToggleDevPanel: () => void;
  onTogglePause: () => void;
  /** CON-07: the portrait frame worn, or null. */
  frame?: string | null;
};

/** How long the portrait winces after the hero loses health. */
const HURT_FACE_MS = 500;
/** A boss's title card shows this long when it appears, outside the centre 40% of the screen (FX-05). */
const BOSS_INTRO_MS = 1200;
/** CON-03: how long a landmark's name card stays as its stage begins (its CSS animation runs as long). */
const LANDMARK_CARD_MS = 2800;
/** CON-06: how long a round boss's phase line stays over the boss bar (its CSS animation runs as long). */
const PHASE_LINE_MS = 3600;


function SkillSlots({ snapshot }: { snapshot: HudSnapshot }) {
  const rows = [true, false].map((active) => SKILL_IDS.filter((id) => snapshot.skills[id] && SKILLS[id].active === active));
  return (
    <div className="skillSlots" aria-label={t('hud.skills')}>
      {rows.map((ids, row) => ids.length > 0 && (
        <ul key={row}>
          {ids.map((id) => {
            const state = snapshot.skills[id]!;
            const cooldown = snapshot.cooldowns[id] ?? 0;
            return (
              <li className="skillSlot" key={id} aria-label={t(state.awakened ? 'skill.slot.awakened' : 'skill.slot', { skill: t(`skill.${id}`), level: state.level })}>
                <span className="artSlot" data-art={state.awakened ? `${id}-awakened` : id} />
                {cooldown > 0 && <i className="slotCooldown" style={{ '--cooldown': cooldown } as CSSProperties} />}
                {state.level >= MAX_SKILL_LEVEL && !state.awakened && <i className="slotAwaken" title={t('hud.canAwaken')} />}
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

/** A live line that changes only when an effect starts or ends (UI-08); always mounted, so the first change is heard. */
function EffectAnnouncer({ names }: { names: string[] }) {
  const hadEffects = useRef(false);
  const line = effectAnnouncement(names, hadEffects.current);
  if (names.length > 0) hadEffects.current = true;
  return <p className="srOnly" role="status" aria-live="polite" data-effect-announcer="">{line ? tx(line) : ''}</p>;
}

function BossBar({ snapshot, name, line }: { snapshot: HudSnapshot; name: string; line: string | null }) {
  const phase = snapshot.bossPhase ?? 1;
  const enrage = snapshot.bossEnrage ?? 0;
  const steps = snapshot.bossEnrageSteps ?? 1;
  return (
    <section className={enrage > 0 ? 'bossBar enraged' : 'bossBar'} aria-label={t('hud.boss')}>
      {line && <p className="bossNarration" role="status">{line}</p>}
      <span className="artPortrait" data-art={enrage > 0 ? `${snapshot.bossId}-enraged` : snapshot.bossId} aria-hidden="true" />
      <div className="bossBody">
        <div className="bossLine">
          <strong>{name}</strong>
          <span>{t('hud.phase', { phase })} <i aria-hidden="true">{'◆'.repeat(phase)}{'◇'.repeat(Math.max(0, 3 - phase))}</i></span>
        </div>
        <ProgressBar label={t('hud.bossHealth', { boss: name })} value={snapshot.bossHp ?? 0} max={snapshot.bossMaxHp ?? 1} className="bossHp" />
        <div className="bossLine">
          <span>{snapshot.bossMoveName ? t('hud.move', { move: t(snapshot.bossMoveName) }) : ''}</span>
          <span className={enrage > 0 ? 'bossRage on' : 'bossRage'}>
            {enrage > 0
              ? (snapshot.bossOvertime ? t('hud.enrage.overtime', { n: snapshot.bossOvertime }) : steps > 1 ? t('hud.enrage.step', { step: enrage, steps }) : t('hud.enrage'))
              : snapshot.runMode === 'campaign' ? t('hud.enrageIn', { time: formatClock(snapshot.timeLeft) }) : ''}
          </span>
        </div>
      </div>
    </section>
  );
}

export function HudLayer({ snapshot, playing, runPaused, devTools, devPanelOpen, devToggleRef, onToggleSpeed, onToggleDevPanel, onTogglePause, frame }: HudLayerProps) {
  const infinite = snapshot.runMode === 'infinite';
  const device = useInputDevice();
  const lastHp = useRef(snapshot.hp);
  const [hurtAt, setHurtAt] = useState(-Infinity);
  useEffect(() => {
    if (snapshot.hp < lastHp.current - 0.5) setHurtAt(performance.now());
    lastHp.current = snapshot.hp;
  }, [snapshot.hp]);
  const [intro, setIntro] = useState<Partial<BossTitle> & { name: string } | null>(null);
  const bossId = snapshot.bossId;
  const bossName = snapshot.bossName ? t(snapshot.bossName) : '';
  useEffect(() => {
    if (!bossId) return undefined;
    let live = true;
    const name = bossName;
    setIntro({ name });
    void loadBossTitles().then((titles) => { if (live && titles[bossId]) setIntro({ ...titles[bossId], name }); });
    const timer = window.setTimeout(() => setIntro(null), BOSS_INTRO_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
      setIntro(null);
    };
    // Only a new boss id brings a new card; its name comes with it.
  }, [bossId]);
  const [landmarkCard, setLandmarkCard] = useState<LandmarkTitle | null>(null);
  const landmark = snapshot.landmark;
  const stageKey = `${snapshot.seed}-${snapshot.chapter}-${snapshot.stage}`;
  useEffect(() => {
    if (!landmark) return undefined;
    let live = true;
    void loadLandmarkTitles().then((titles) => { if (live && titles[landmark]) setLandmarkCard(titles[landmark]); });
    const timer = window.setTimeout(() => setLandmarkCard(null), LANDMARK_CARD_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
      setLandmarkCard(null);
    };
    // A card per landmark stage started; the stage key brings it back on a retry.
  }, [landmark, stageKey]);
  // CON-06: a round boss's phase change brings its narrated line over the boss bar, clear of the centre 40%.
  const [phaseLine, setPhaseLine] = useState<string | null>(null);
  const phaseKey = bossId && (snapshot.bossPhase ?? 1) > 1 ? `${bossId}:${snapshot.bossPhase}` : null;
  useEffect(() => {
    if (!phaseKey) return undefined;
    let live = true;
    const [id, phase] = phaseKey.split(':') as [string, '2' | '3'];
    void loadStory().then((story) => { if (live) setPhaseLine(story.phases[id]?.[phase] ?? null); });
    const timer = window.setTimeout(() => setPhaseLine(null), PHASE_LINE_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
      setPhaseLine(null);
    };
  }, [phaseKey]);
  // CON-08: an infinite run's turn to the next chapter shows the chapter's name card.
  const [chapterCard, setChapterCard] = useState<number | null>(null);
  const lookChapter = snapshot.lookChapter;
  const lastLook = useRef(lookChapter);
  useEffect(() => {
    if (lastLook.current === lookChapter) return undefined;
    lastLook.current = lookChapter;
    setChapterCard(lookChapter);
    const timer = window.setTimeout(() => setChapterCard(null), LANDMARK_CARD_MS);
    return () => {
      window.clearTimeout(timer);
      setChapterCard(null);
    };
  }, [lookChapter]);
  const bonus = snapshot.bonus;
  const low = snapshot.hp > 0 && snapshot.hp <= snapshot.maxHp * LOW_HEALTH_RATIO;
  const face = performance.now() - hurtAt < HURT_FACE_MS
    ? 'hurt'
    : low
      ? 'lowhp'
      : bossName
        ? 'focus'
        : SKILL_IDS.some((id) => snapshot.skills[id]?.awakened) ? 'awakened' : 'calm';
  const bossStage = snapshot.stageKind !== 'normal';
  return (
    <>
      {playing && (
        <p className="srOnly" id="game-state-summary">
          {infinite
            ? t('hud.summary.infinite', { chapter: lookChapter, time: formatClock(snapshot.elapsed), score: snapshot.score, bosses: snapshot.bossKills })
            : t('hud.summary.campaign', { chapter: snapshot.chapter, stage: snapshot.stage, time: formatClock(snapshot.timeLeft) })}
          {' '}{t('hud.summary.health', { hp: Math.ceil(snapshot.hp), max: Math.ceil(snapshot.maxHp) })}
          {' '}{t('hud.summary.pause')} {runPaused ? t('hud.summary.paused') : ''}
        </p>
      )}
      <ProgressBar label={t('hud.runXp')} value={snapshot.xp} max={snapshot.nextXp} className="xpStrip" valueText={`Lv.${snapshot.level} ${Math.floor(snapshot.xp)} / ${snapshot.nextXp}`} />
      <div className="gameHud">
        <section className="hudHero" aria-label={t('hud.hero')}>
          <div className="heroFace" data-frame={frame ?? undefined}>
            <span className="artPortrait" data-art={`hero-${face}`} aria-hidden="true" />
            <b className="levelSeal" aria-label={t('hud.level', { level: snapshot.level })}>{snapshot.level}</b>
          </div>
          <div className="heroBody">
            <div className="heroLine">
              <strong>{infinite
                ? t('hud.infiniteLine', { chapter: lookChapter, rank: snapshot.dangerRank })
                : `${t('stage.address', { chapter: snapshot.chapter, stage: snapshot.stage })} · ${t(`hud.kind.${snapshot.stageKind}`)}${snapshot.practice ? ` · ${t('hud.practice')}` : ''}`}</strong>
              <span>{t('hud.nextLevel', { pct: Math.floor((snapshot.xp / Math.max(1, snapshot.nextXp)) * 100) })}</span>
            </div>
            <div className="hpLine">
              <ProgressBar label={t('hud.health')} value={snapshot.hp} max={snapshot.maxHp} className={low ? 'hpBar low' : 'hpBar'} valueText={`${Math.ceil(snapshot.hp)} / ${Math.ceil(snapshot.maxHp)}`} />
              <b>{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</b>
            </div>
            <SkillSlots snapshot={snapshot} />
          </div>
        </section>
        <section className="hudClock" aria-label={t('hud.clock')}>
          <div className="timer">{formatClock(infinite ? snapshot.elapsed : snapshot.timeLeft)}</div>
          <div className="timerSub">{t(infinite ? 'hud.elapsed' : bossStage ? 'hud.untilEnrage' : 'hud.timeLeft')}</div>
          <div className="objectiveChip">
            {infinite
              ? t('hud.scoreLine', { score: formatCount(snapshot.score), bosses: snapshot.bossKills })
              : bossStage
                ? t('hud.bossGoal', { boss: bossName || t('hud.bossFallback'), progress: snapshot.objectiveProgress, target: snapshot.objectiveTarget })
                : tx(snapshot.objective)}
          </div>
          {bonus && (
            <div className={`bonusChip ${bonus.status}`}>
              {bonus.status === 'done'
                ? t('hud.bonusDone', { goal: tx(bonus.goal) })
                : bonus.status === 'failed'
                  ? t('hud.bonusFailed', { goal: tx(bonus.goal) })
                  : t('hud.bonus', { goal: tx(bonus.goal), progress: bonus.progress, target: bonus.target })}
            </div>
          )}
          {infinite && <div className={snapshot.scoreEligible ? 'recordState eligible' : 'recordState practice'}>{t(snapshot.scoreEligible ? 'record.ranked' : 'record.practice')}</div>}
        </section>
        <section className="hudChips">
          {/* Keyed on the count, so the chip pulses again whenever it changes (FX-05). */}
          <span className="hudChip pulse" key={`coins-${snapshot.coins}`} title={t('hud.coins')}><i className="artPickup" data-art="coin" aria-hidden="true" /><span className="srOnly">{t('hud.coins')}</span>{snapshot.coins}</span>
          <span className="hudChip" title={t(infinite ? 'hud.bossKills' : 'hud.kills')}><i className="killMark" aria-hidden="true" /><span className="srOnly">{t(infinite ? 'hud.bossKills' : 'hud.kills')}</span>{infinite ? snapshot.bossKills : snapshot.kills}</span>
          {DEVELOPER_UI_AVAILABLE && <span className="hudChip devOnly" title="적">적 {snapshot.enemyCount}</span>}
          <button className={snapshot.timeScale === 2 ? 'primary small iconButton active' : 'primary small iconButton'} onClick={onToggleSpeed} aria-pressed={snapshot.timeScale === 2} aria-label={t(snapshot.timeScale === 2 ? 'hud.speed.to1' : 'hud.speed.to2')} title={t('hud.speed')}>
            <span aria-hidden="true">{snapshot.timeScale === 2 ? '×2' : '×1'}</span>
          </button>
          {DEVELOPER_UI_AVAILABLE && devTools && (
            <button ref={devToggleRef} className="ghost small iconButton" onClick={onToggleDevPanel} aria-expanded={devPanelOpen} aria-controls="dev-panel" aria-label={devPanelOpen ? '개발 패널 닫기' : '개발 패널 열기'} title="개발 패널">
              <span aria-hidden="true">{devPanelOpen ? '×' : '⚙'}</span>
            </button>
          )}
          <button className="ghost small iconButton" onClick={onTogglePause} aria-pressed={runPaused} aria-label={t(runPaused ? 'hud.resume' : 'hud.pause')} title={t('hud.pauseTitle', { pause: device === 'keyboard' ? 'P / Esc' : glyph(device, 'pause') })}><span aria-hidden="true">{runPaused ? '▶' : 'Ⅱ'}</span></button>
        </section>
      </div>
      {bossName && <BossBar snapshot={snapshot} name={bossName} line={phaseLine} />}
      {chapterCard && !intro && (
        <div className="bossIntro landmarkIntro" role="status" aria-live="polite">
          <strong>{t('chapter.name', { n: chapterCard, theme: t(`chapter.${chapterCard as 1 | 2 | 3 | 4 | 5}`) })}</strong>
          <p>{t('hud.chapterTurn')}</p>
        </div>
      )}
      {landmarkCard && !intro && (
        <div className="bossIntro landmarkIntro" role="status" aria-live="polite">
          <strong>{landmarkCard.name}</strong>
          <p>{landmarkCard.line}</p>
        </div>
      )}
      {intro && (
        <div className="bossIntro" role="status" aria-live="polite">
          {intro.title && <span>{intro.title}</span>}
          <strong>{intro.name}</strong>
          {intro.line && <p>{intro.line}</p>}
        </div>
      )}
      <EffectAnnouncer names={snapshot.activeEffects.map((effect) => t(effect.label))} />
      {snapshot.activeEffects.length > 0 && (
        // Not a live region: its timers change every snapshot. EffectAnnouncer speaks the changes (UI-08).
        <div className="effectRack" role="group" aria-label={t('hud.effects')}>
          {snapshot.activeEffects.map((effect) => (
            // Silence and root show as timers over the hero (UI-02); the rack still lists them for screen readers.
            <div className={`effectItem ${effect.kind}${effect.id === 'silence' || effect.id === 'root' ? ' srOnly' : ''}`} key={effect.id}>
              <span className="effectMark" aria-hidden="true">{effect.kind === 'buff' ? '+' : '!'}</span>
              <span className="effectCopy">
                <b>{t(effect.label)}</b>
                <small>{effect.value ?? (effect.remaining !== undefined
                  ? `${effect.remaining < 10 ? effect.remaining.toFixed(1) : Math.ceil(effect.remaining)}s`
                  : t('hud.effectActive'))}</small>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
