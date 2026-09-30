import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DEVELOPER_UI_AVAILABLE, DEVELOPER_UI_DEFAULT_ENABLED } from './platform/developerAccess';
import { rulesLabel } from './game/rules';
import {
  addInfiniteScore,
  loadInfiniteLeaderboard,
  normalizeInfinitePlayerName,
  saveInfinitePlayerName,
  type InfiniteScoreEntry,
} from './platform/infiniteLeaderboard';
import {
  createDefaultMeta,
  createDefaultProfile,
  loadGameSave,
  recordStageResult,
  saveGameSave,
  type GameOptions,
  type ProfileData,
  type MetaState,
  type MetaUpgradeId,
  type PassiveId,
} from './platform/save';
import { DraftModal } from './ui/screens/DraftModal';
import { SettlementModal } from './ui/screens/SettlementModal';
import { NO_SETTLEMENT_NOTES, settlementNotes, type SettlementNotes } from './ui/settlementNotes';
import { t } from './i18n/strings';
import { FaultDialog, ResetDialog } from './ui/screens/RunDialogs';
import { HudLayer } from './ui/screens/HudLayer';
import { DevPanel } from './ui/screens/DevPanel';
import { PauseHub, type PauseTab } from './ui/screens/PauseHub';
import { HintLayer, type HintId } from './ui/screens/HintLayer';
import { MenuScreen, type MenuView } from './ui/screens/MenuScreen';
import { nextRovingId, watchReducedMotion, type RovingKey } from './ui/inputContracts';
import { InputAdapter } from './ui/inputAdapter';
import { SpriteAtlas } from './game/render/assets/spriteAtlas';
import { ErrorLog, describeError } from './platform/errorReport';
import { copyErrorReport } from './ui/ErrorBoundary';
import { CHAPTER_PACKS, COMMON_PACK } from './game/render/assets/slots';
import { INFINITE_BASELINE } from './game/infiniteMode';
import { useGamepadNavigation } from './ui/useGamepadNavigation';
import { AudioMixer, type SoundPack } from './game/audio/mixer';
import { installUiSounds } from './ui/uiSounds';
import {
  CHAPTERS,
  GameEngine,
  META_PASSIVES,
  META_UPGRADES,
  buildStats,
  formatClock,
  isStageUnlocked,
  makeRunUpgrades,
  metaUpgradeCost,
  nextStageProgress,
  stageIndex,
  xpForMetaLevel,
  type DraftState,
  type HudSnapshot,
  type RunUpgradeId,
  type Settlement,
  type SkillOffer,
} from './game/GameEngine';

export { GameEngine } from './game/GameEngine';

// Developer cheat UIFAULT (TEC-14): throws while rendering to exercise the error boundary.
function InjectedRenderFault(): never {
  throw new Error('Injected render fault (developer cheat UIFAULT)');
}

const standaloneErrorLog = new ErrorLog();
// One mixer and audio context for the whole session (AUD-01); it outlives every run and every app remount.
const appMixer = new AudioMixer();
// The SFX pack (AUD-02) decodes once audio unlocks; until then, and for any file that fails, cues play their synth.
void fetch('assets/packs/sfx-common/pack.json')
  .then((response) => (response.ok ? response.json() : null))
  .then((pack: SoundPack | null) => pack && appMixer.loadPack(pack), () => undefined);
/** The death moment (FX-03): the canvas shows the fall this long before the settlement opens. */
const DEATH_MOMENT_MS = 700;

function App({ errorLog = standaloneErrorLog }: { errorLog?: ErrorLog }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  // Keyboard, pointer, and gamepad reach the engine only as commands through this adapter (TEC-07).
  const inputRef = useRef<InputAdapter | null>(null);
  const releaseReducedMotionRef = useRef<(() => void) | null>(null);
  // Character art (TEC-03) loads once in the background; until it is ready, or if it fails, vectors draw.
  const [spriteAtlas] = useState(() => new SpriteAtlas());
  const pauseIntentRef = useRef<() => void>(() => undefined);
  const devToggleRef = useRef<HTMLButtonElement | null>(null);
  const runPausedRef = useRef(false);
  // While the death moment plays, the run is over but the settlement is not up yet: nothing can pause it.
  const deathMomentRef = useRef<number | null>(null);
  const endDeathMoment = () => {
    if (deathMomentRef.current !== null) window.clearTimeout(deathMomentRef.current);
    deathMomentRef.current = null;
  };
  const phaseRef = useRef<'menu' | 'playing' | 'draft' | 'roundClear' | 'gameOver'>('menu');
  const [initialSave] = useState(() => loadGameSave(window.localStorage));
  const [initialInfiniteLeaderboard] = useState(() => loadInfiniteLeaderboard(window.localStorage));
  const [meta, setMeta] = useState<MetaState>(() => initialSave.data.meta);
  const [options, setOptions] = useState<GameOptions>(() => initialSave.data.options);
  const [profile, setProfile] = useState<ProfileData>(() => initialSave.data.profile);
  const [phase, setPhase] = useState<'menu' | 'playing' | 'draft' | 'roundClear' | 'gameOver'>('menu');
  /** The chapter of the run on screen; the menu shows the selected chapter instead (atlas packs follow it). */
  const [runChapter, setRunChapter] = useState(1);
  const [selectedChapterId, setSelectedChapterId] = useState(1);
  const [selectedStageNo, setSelectedStageNo] = useState(1);
  const [developerMode, setDeveloperMode] = useState(DEVELOPER_UI_DEFAULT_ENABLED);
  const [menuView, setMenuView] = useState<MenuView>('play');
  // Developer builds only: the cheat panel (UI-04). The pause hub keeps its last tab between pauses.
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [pauseTab, setPauseTab] = useState<PauseTab>('build');
  const [cheatCode, setCheatCode] = useState('');
  const [cheatMessage, setCheatMessage] = useState('');
  const [snapshot, setSnapshot] = useState<HudSnapshot | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  /** New records and level-ups of the settlement on screen, worked out before it is applied (UI-05). */
  const [notes, setNotes] = useState<SettlementNotes | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [abandonConfirmOpen, setAbandonConfirmOpen] = useState(false);
  const [runPaused, setRunPaused] = useState(false);
  const [seedCopyStatus, setSeedCopyStatus] = useState('');
  const [infiniteEntries, setInfiniteEntries] = useState<InfiniteScoreEntry[]>(() => initialInfiniteLeaderboard.entries);
  const [infinitePlayerName, setInfinitePlayerName] = useState(() => initialInfiniteLeaderboard.playerName);
  const [infiniteSeed, setInfiniteSeed] = useState('');
  const [leaderboardStatus, setLeaderboardStatus] = useState('');
  // TEC-14: a frame that threw stops the loop, and the run waits paused behind this dialog.
  const [loopFault, setLoopFault] = useState<{ message: string; count: number } | null>(null);
  const [notice, setNotice] = useState<'art' | 'error' | null>(null);
  const [errorCopyStatus, setErrorCopyStatus] = useState('');
  const [uiFault, setUiFault] = useState(false);
  const infiniteEntriesRef = useRef(infiniteEntries);
  const developerAccess = DEVELOPER_UI_AVAILABLE && developerMode;
  phaseRef.current = phase;
  // During active play the gamepad only moves the player; menus and dialogs take it over otherwise.
  useGamepadNavigation(phase !== 'playing' || runPaused);
  infiniteEntriesRef.current = infiniteEntries;
  // The settlement callbacks read the save as it was before the result is applied (UI-05 notes).
  const metaRef = useRef(meta);
  const profileRef = useRef(profile);
  metaRef.current = meta;
  profileRef.current = profile;

  useEffect(() => {
    if (initialSave.writable) saveGameSave(window.localStorage, { meta, options, profile });
    engineRef.current?.setMeta(meta);
    engineRef.current?.setOptions(options);
    appMixer.setLevels(options);
  }, [initialSave.writable, meta, options, profile]);

  useEffect(() => installUiSounds(document, appMixer), []);

  useEffect(() => {
    if (developerAccess || isStageUnlocked(meta, selectedChapterId, selectedStageNo)) return;
    setSelectedChapterId(meta.progress.chapter);
    setSelectedStageNo(meta.progress.stage);
  }, [developerAccess, meta, selectedChapterId, selectedStageNo]);

  // Atlas packs (ART-07): the common pack and the pack of the chapter on screen stay resident, and the other chapters
  // are released, so textures keep to their budget. The menu loads the selected chapter ahead of its run.
  const artChapter = phase === 'menu' ? selectedChapterId : runChapter;
  const reportedPacks = useRef(new Set<string>());
  useEffect(() => {
    let cancelled = false;
    // Cleared while the packs load, so checks that wait for ready or fallback wait for this chapter's packs.
    delete document.documentElement.dataset.sprites;
    const chapterPack = CHAPTER_PACKS[artChapter];
    for (const pack of Object.values(CHAPTER_PACKS)) if (pack !== chapterPack) spriteAtlas.release(pack);
    const packs = chapterPack ? [COMMON_PACK, chapterPack] : [COMMON_PACK];
    void Promise.all(packs.map((pack) => spriteAtlas.load(pack))).then((loaded) => {
      if (cancelled) return;
      const ready = loaded.every(Boolean);
      document.documentElement.dataset.sprites = ready ? 'ready' : 'fallback';
      // Vectors stand in for missing art (TEC-03); the player is told once per pack instead of left guessing (TEC-14).
      const failed = packs.filter((pack) => spriteAtlas.status(pack) === 'failed' && !reportedPacks.current.has(pack));
      for (const pack of failed) {
        reportedPacks.current.add(pack);
        errorLog.record('asset', spriteAtlas.failure(pack) ?? `atlas pack ${pack} failed`);
      }
      if (failed.length > 0) setNotice('art');
    });
    return () => {
      cancelled = true;
    };
  }, [artChapter, errorLog, spriteAtlas]);

  useEffect(() => errorLog.subscribe((entry) => {
    if (entry.source === 'window' || entry.source === 'promise') setNotice('error');
  }), [errorLog]);

  useEffect(() => {
    return () => {
      endDeathMoment();
      inputRef.current?.dispose();
      releaseReducedMotionRef.current?.();
      engineRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    // Read-only diagnostics for browser regression probes; developer builds only.
    if (!DEVELOPER_UI_AVAILABLE) return undefined;
    const target = window as typeof window & { __blacklineDiagnostics?: () => unknown };
    target.__blacklineDiagnostics = () => {
      const diagnostics = engineRef.current?.getDiagnostics();
      return diagnostics ? { ...diagnostics, audio: appMixer.stats() } : null;
    };
    return () => { delete target.__blacklineDiagnostics; };
  }, []);

  const markHintSeen = useCallback((id: HintId) => {
    setProfile((previous) => (previous.hintsSeen.includes(id) ? previous : { ...previous, hintsSeen: [...previous.hintsSeen, id] }));
  }, []);

  const closeDevPanel = useCallback((restoreFocus = true) => {
    setDevPanelOpen(false);
    if (restoreFocus) requestAnimationFrame(() => devToggleRef.current?.focus());
  }, []);

  const setManualPause = useCallback((paused: boolean) => {
    const engine = engineRef.current;
    if (!engine || phaseRef.current !== 'playing' || deathMomentRef.current !== null) return;
    runPausedRef.current = paused;
    setRunPaused(paused);
    setAbandonConfirmOpen(false);
    if (paused) {
      engine.pause();
      setDevPanelOpen(false);
    } else {
      engine.resume();
    }
  }, []);

  const toggleManualPause = useCallback(() => {
    setManualPause(!runPausedRef.current);
  }, [setManualPause]);
  pauseIntentRef.current = toggleManualPause;

  useEffect(() => {
    // Losing the window should never leave enemies attacking an idle player (BUG-03).
    if (phase !== 'playing' || !options.autoPause) return undefined;
    const pauseForFocusLoss = () => {
      if (!runPausedRef.current) setManualPause(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pauseForFocusLoss();
    };
    window.addEventListener('blur', pauseForFocusLoss);
    window.addEventListener('gamepaddisconnected', pauseForFocusLoss);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', pauseForFocusLoss);
      window.removeEventListener('gamepaddisconnected', pauseForFocusLoss);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [options.autoPause, phase, setManualPause]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onPauseShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))) return;
      const isPauseKey = event.key.toLowerCase() === 'p';
      if (!isPauseKey && event.key !== 'Escape') return;
      if (event.key === 'Escape' && runPausedRef.current) return;
      event.preventDefault();
      if (event.key === 'Escape' && devPanelOpen) {
        closeDevPanel(true);
        return;
      }
      toggleManualPause();
    };
    window.addEventListener('keydown', onPauseShortcut);
    return () => window.removeEventListener('keydown', onPauseShortcut);
  }, [closeDevPanel, devPanelOpen, phase, toggleManualPause]);

  const grantSettlement = useCallback((result: Settlement, unlockProgress: boolean) => {
    setMeta((prev) => {
      const next: MetaState = {
        ...prev,
        gold: prev.gold + result.gold,
        xp: prev.xp + result.xp,
        progress: { ...prev.progress },
        upgrades: { ...prev.upgrades },
        passives: { ...prev.passives },
      };
      while (next.xp >= xpForMetaLevel(next.level)) {
        next.xp -= xpForMetaLevel(next.level);
        next.level += 1;
        next.passivePoints += 1;
      }
      if (result.cleared && unlockProgress) {
        const unlocked = nextStageProgress(result.chapter, result.stage);
        if (stageIndex(unlocked.chapter, unlocked.stage) > stageIndex(next.progress.chapter, next.progress.stage)) {
          next.progress = unlocked;
        }
      }
      return next;
    });
  }, []);

  const recordInfiniteSettlement = useCallback((result: Settlement) => {
    if (result.runMode !== 'infinite') return;
    if (!result.scoreEligible) {
      setLeaderboardStatus(t('board.status.excluded'));
      return;
    }
    const saved = addInfiniteScore(
      window.localStorage,
      infinitePlayerName,
      infiniteEntriesRef.current,
      {
        score: result.score,
        survivedSeconds: result.survivedSeconds,
        kills: result.kills,
        bosses: result.bossKills,
        seed: result.seed,
      },
    );
    infiniteEntriesRef.current = saved.entries;
    setInfiniteEntries(saved.entries);
    const ranked = saved.entries.some((entry) => entry.id === saved.entry.id);
    setLeaderboardStatus(saved.writable
      ? t(ranked ? 'board.status.ranked' : 'board.status.saved')
      : t('board.status.noStorage'));
  }, [infinitePlayerName]);

  const callbacks = useMemo(
    () => ({
      onSnapshot: setSnapshot,
      onDraft: (nextDraft: DraftState) => {
        runPausedRef.current = false;
        setRunPaused(false);
        setDevPanelOpen(false);
        setDraft(nextDraft);
        setPhase('draft');
      },
      onRoundClear: (result: Settlement) => {
        runPausedRef.current = false;
        setRunPaused(false);
        // Practice pace never unlocks stages (CON-02).
        const unlockProgress = !developerAccess && !result.practice;
        setNotes(settlementNotes(result, profileRef.current.stageRecords[`${result.chapter}-${result.stage}`], metaRef.current, unlockProgress));
        setSettlement(result);
        if (result.runMode === 'campaign') setProfile((prev) => recordStageResult(prev, result));
        grantSettlement(result, unlockProgress);
        setPhase('roundClear');
      },
      onGameOver: (result: Settlement) => {
        runPausedRef.current = false;
        setRunPaused(false);
        setNotes(settlementNotes(result, profileRef.current.stageRecords[`${result.chapter}-${result.stage}`], metaRef.current, false));
        setSettlement(result);
        if (result.runMode === 'campaign') setProfile((prev) => recordStageResult(prev, result));
        if (result.runMode === 'infinite') setInfiniteSeed(String(result.seed));
        grantSettlement(result, false);
        recordInfiniteSettlement(result);
        // The results are kept at once; the dialog waits for the death moment on the canvas (FX-03).
        deathMomentRef.current = window.setTimeout(() => {
          deathMomentRef.current = null;
          setPhase('gameOver');
        }, DEATH_MOMENT_MS);
      },
      onFrameStart: () => inputRef.current?.poll(),
      onFault: (error: unknown) => {
        const entry = errorLog.record('loop', error);
        runPausedRef.current = false;
        setRunPaused(false);
        setDevPanelOpen(false);
        setErrorCopyStatus('');
        setLoopFault({ message: entry?.message ?? describeError(error).message, count: entry?.count ?? 1 });
      },
    }),
    [developerAccess, errorLog, grantSettlement, recordInfiniteSettlement],
  );

  const visibleStats = useMemo(() => buildStats(meta, makeRunUpgrades(), {}), [meta]);
  const selectedChapter = useMemo(() => CHAPTERS.find((chapter) => chapter.id === selectedChapterId) ?? CHAPTERS[0], [selectedChapterId]);
  const selectedStage = useMemo(
    () => selectedChapter.stages.find((stage) => stage.id === selectedStageNo) ?? selectedChapter.stages[0],
    [selectedChapter, selectedStageNo],
  );
  const selectedStageLocked = !developerAccess && !isStageUnlocked(meta, selectedChapter.id, selectedStage.id);
  const nextStage = settlement && settlement.runMode === 'campaign' && settlement.cleared && !settlement.gameComplete
    ? nextStageProgress(settlement.chapter, settlement.stage)
    : null;
  const nextStageOpen = nextStage !== null && (developerAccess || isStageUnlocked(meta, nextStage.chapter, nextStage.stage));

  const beginRun = useCallback((chapter: number, launch: (engine: GameEngine) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRunChapter(chapter);
    // The chapter's ambience bed plays under the run (AUD-04).
    appMixer.ambience(`ambience.ch${Math.min(5, Math.max(1, chapter)) as 1 | 2 | 3 | 4 | 5}`);
    endDeathMoment();
    inputRef.current?.dispose();
    releaseReducedMotionRef.current?.();
    engineRef.current?.dispose();
    const engine = new GameEngine(canvas, meta, options, callbacks);
    engineRef.current = engine;
    engine.setSprites(spriteAtlas);
    engine.setSound(appMixer);
    releaseReducedMotionRef.current = watchReducedMotion(
      typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
      (reduced) => engine.setSystemReducedMotion(reduced),
    );
    inputRef.current = new InputAdapter({
      window,
      document,
      canvas,
      target: engine,
      onPauseIntent: () => pauseIntentRef.current(),
    });
    setSettlement(null);
    setDraft(null);
    setSnapshot(null);
    setDevPanelOpen(false);
    runPausedRef.current = false;
    setRunPaused(false);
    setSeedCopyStatus('');
    setLeaderboardStatus('');
    setCheatMessage('');
    setLoopFault(null);
    setPhase('playing');
    launch(engine);
  }, [callbacks, meta, options, spriteAtlas]);

  const startRun = useCallback(() => {
    if (selectedStageLocked) return;
    beginRun(selectedChapter.id, (engine) => engine.startRun(selectedChapter.id, selectedStage.id));
  }, [beginRun, selectedChapter.id, selectedStage.id, selectedStageLocked]);

  /** Settlement's primary action: go straight on to the next stage (CON-02). */
  const startStage = useCallback((address: { chapter: number; stage: number }) => {
    setSelectedChapterId(address.chapter as typeof selectedChapterId);
    setSelectedStageNo(address.stage);
    beginRun(address.chapter, (engine) => engine.startRun(address.chapter, address.stage));
  }, [beginRun]);

  const startInfiniteRun = useCallback(() => {
    const normalizedName = normalizeInfinitePlayerName(infinitePlayerName);
    setInfinitePlayerName(normalizedName);
    saveInfinitePlayerName(window.localStorage, normalizedName, infiniteEntriesRef.current);
    const seedText = infiniteSeed.trim();
    const parsedSeed = seedText && /^\d+$/.test(seedText) ? Number(seedText) : Number.NaN;
    const seed = Number.isSafeInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 0xffff_ffff
      ? parsedSeed >>> 0
      : undefined;
    beginRun(INFINITE_BASELINE.chapter, (engine) => engine.startInfiniteRun(seed, !developerAccess));
  }, [beginRun, developerAccess, infinitePlayerName, infiniteSeed]);

  const buyMetaUpgrade = (id: MetaUpgradeId) => {
    setMeta((prev) => {
      const level = prev.upgrades[id];
      const def = META_UPGRADES[id];
      const cost = metaUpgradeCost(id, level);
      if (level >= def.max || prev.gold < cost) return prev;
      return {
        ...prev,
        gold: prev.gold - cost,
        upgrades: { ...prev.upgrades, [id]: level + 1 },
      };
    });
  };

  const buyPassive = (id: PassiveId) => {
    setMeta((prev) => {
      const level = prev.passives[id];
      const def = META_PASSIVES[id];
      if (level >= def.max || prev.passivePoints <= 0) return prev;
      return {
        ...prev,
        passivePoints: prev.passivePoints - 1,
        passives: { ...prev.passives, [id]: level + 1 },
      };
    });
  };

  const handleOffer = (offer: SkillOffer) => {
    const engine = engineRef.current;
    if (!engine || !draft) return;
    const resolution = engine.completeDraft(offer, draft.id);
    if (resolution === 'ignored') return;
    if (resolution === 'draft') {
      setPhase('draft');
      return;
    }
    setDraft(null);
    if (resolution === 'resume') {
      setPhase('playing');
    }
  };

  useEffect(() => {
    if (phase !== 'draft' || !draft) return;
    const onDraftShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.draftCard'));
        if (cards.length === 0) return;
        event.preventDefault();
        const current = cards.findIndex((card) => card === document.activeElement);
        const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const next = current < 0 ? (step > 0 ? 0 : cards.length - 1) : (current + step + cards.length) % cards.length;
        cards[next].focus();
        return;
      }
      if (event.repeat) return;
      const index = Number(event.key) - 1;
      const offer = draft.cards[index];
      if (!offer) return;
      event.preventDefault();
      handleOffer(offer);
    };
    window.addEventListener('keydown', onDraftShortcut);
    return () => window.removeEventListener('keydown', onDraftShortcut);
  }, [draft, phase]);

  const toMenu = () => {
    appMixer.ambience(null);
    endDeathMoment();
    inputRef.current?.dispose();
    inputRef.current = null;
    releaseReducedMotionRef.current?.();
    releaseReducedMotionRef.current = null;
    engineRef.current?.dispose();
    engineRef.current = null;
    setLoopFault(null);
    setPhase('menu');
    setSnapshot(null);
    setDraft(null);
    setSettlement(null);
    runPausedRef.current = false;
    setRunPaused(false);
    setAbandonConfirmOpen(false);
    setDevPanelOpen(false);
  };

  const retryAfterFault = () => {
    setLoopFault(null);
    engineRef.current?.recoverFromFault();
    // The run comes back paused, so the player is ready before enemies move again.
    setManualPause(true);
  };

  const copyErrorLog = async () => {
    const scene = snapshot
      ? snapshot.runMode === 'infinite' ? `infinite (${rulesLabel(snapshot.rulesVersion)})` : `Ch.${snapshot.chapter} / St.${snapshot.stage} (${rulesLabel(snapshot.rulesVersion)})`
      : phase;
    try {
      await copyErrorReport(errorLog, scene);
      setErrorCopyStatus(t('error.copied'));
    } catch {
      setErrorCopyStatus(t('error.copyFailed'));
    }
  };

  // In the menu the notice sits in the page flow so it never covers the start button; in play it floats.
  const noticeBanner = (placement: 'inline' | 'floating') => notice && (
    <div className={`noticeBanner ${placement}`} role="status" aria-live="polite">
      <p>{t(notice === 'art' ? 'notice.art' : 'notice.error')}</p>
      <div className="noticeActions">
        <button className="ghost" type="button" onClick={() => void copyErrorLog()}>{t('common.copyLog')}</button>
        <button className="ghost" type="button" data-sound="cancel" onClick={() => { setNotice(null); setErrorCopyStatus(''); }}>{t('common.close')}</button>
      </div>
      {errorCopyStatus && <p className="seedStatus">{errorCopyStatus}</p>}
    </div>
  );

  const toggleSpeed = () => {
    const next = snapshot?.timeScale === 2 ? 1 : 2;
    engineRef.current?.setTimeScale(next);
    setSnapshot((prev) => (prev ? { ...prev, timeScale: next } : prev));
  };

  const buyRunUpgrade = (id: RunUpgradeId) => {
    engineRef.current?.buyRunUpgrade(id);
  };

  const copyRunSeed = async () => {
    if (!snapshot) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(String(snapshot.seed));
      setSeedCopyStatus(t('seed.copied'));
    } catch {
      setSeedCopyStatus(t('seed.manual', { seed: snapshot.seed }));
    }
  };

  const copyInfiniteResult = async () => {
    if (!settlement || settlement.runMode !== 'infinite') return;
    const summary = [
      'BLACKLINE SURVIVOR / INFINITE',
      `SCORE ${settlement.score}`,
      `TIME ${formatClock(settlement.survivedSeconds)}`,
      `BOSS ${settlement.bossKills} / KILLS ${settlement.kills}`,
      `SEED ${settlement.seed}`,
      rulesLabel(settlement.rulesVersion),
    ].join('\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(summary);
      setSeedCopyStatus(t('seed.resultCopied'));
    } catch {
      setSeedCopyStatus(summary.replace(/\n/g, ' / '));
    }
  };

  const handleMenuTabKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // The menu nav is vertical (UI-06): up and down move along it, as left and right still do.
    const key = event.key === 'ArrowUp' ? 'ArrowLeft' : event.key === 'ArrowDown' ? 'ArrowRight' : event.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const next = nextRovingId(['play', 'infinite', 'growth', 'settings'] as const, menuView, key as RovingKey);
    setMenuView(next);
    requestAnimationFrame(() => document.getElementById(`menu-tab-${next}`)?.focus());
  };

  const resetMeta = () => {
    setResetConfirmOpen(true);
  };

  const confirmResetMeta = () => {
    setMeta(createDefaultMeta());
    setProfile(createDefaultProfile());
    setSelectedChapterId(1);
    setSelectedStageNo(1);
    setResetConfirmOpen(false);
  };

  const applyCheat = () => {
    if (!DEVELOPER_UI_AVAILABLE) return;
    const code = cheatCode.trim().toUpperCase();
    if (!code) return;
    setCheatCode('');
    engineRef.current?.invalidateInfiniteScore();

    if (code === 'UIFAULT') {
      setUiFault(true);
      setCheatMessage('UI FAULT ARMED');
      return;
    }

    if (code === 'GOLD999' || code === 'GOLD') {
      setMeta((prev) => ({ ...prev, gold: prev.gold + 9999 }));
      setCheatMessage('GOLD +9999');
      return;
    }

    if (code === 'METAUP' || code === 'LEVEL') {
      setMeta((prev) => ({ ...prev, xp: prev.xp + xpForMetaLevel(prev.level), passivePoints: prev.passivePoints + 1 }));
      setCheatMessage('META XP + PASSIVE POINT');
      return;
    }

    if (code === 'DEV') {
      const next = !developerMode;
      setDeveloperMode(next);
      setCheatMessage(next ? 'DEV MODE ON' : 'DEV MODE OFF');
      return;
    }

    const message = engineRef.current?.applyCheat(code) ?? '게임 중 사용 가능한 코드입니다';
    setCheatMessage(message);
  };

  return (
    <div
      className="appShell"
      data-reduced-flash={options.reducedFlash ? 'on' : undefined}
      data-reduced-motion={options.reducedMotion ? 'on' : undefined}
      style={{ '--ui-scale': options.uiScale } as CSSProperties}
    >
      <canvas
        ref={canvasRef}
        className="gameCanvas"
        role="img"
        aria-label={t('game.canvas')}
        aria-describedby={phase === 'playing' ? 'game-state-summary' : undefined}
        aria-hidden={phase !== 'playing'}
        aria-keyshortcuts="W A S D ArrowUp ArrowDown ArrowLeft ArrowRight P Escape"
        tabIndex={phase === 'playing' ? 0 : -1}
      >
        {t('game.noCanvas')}
      </canvas>
      {phase !== 'menu' && snapshot && (
        <HudLayer
          snapshot={snapshot}
          playing={phase === 'playing'}
          runPaused={runPaused}
          devTools={developerAccess}
          devPanelOpen={devPanelOpen}
          devToggleRef={devToggleRef}
          onToggleSpeed={toggleSpeed}
          onToggleDevPanel={() => { if (devPanelOpen) closeDevPanel(false); else setDevPanelOpen(true); }}
          onTogglePause={toggleManualPause}
        />
      )}

      {phase === 'playing' && !runPaused && snapshot && <HintLayer snapshot={snapshot} seen={profile.hintsSeen} onSeen={markHintSeen} />}

      {DEVELOPER_UI_AVAILABLE && developerAccess && phase !== 'menu' && devPanelOpen && (
        <DevPanel cheatCode={cheatCode} setCheatCode={setCheatCode} cheatMessage={cheatMessage} onApplyCheat={applyCheat} />
      )}

      {phase === 'menu' && (
        <MenuScreen
          meta={meta}
          records={profile.stageRecords}
          inlineNotice={noticeBanner('inline')}
          menuView={menuView}
          setMenuView={setMenuView}
          handleMenuTabKey={handleMenuTabKey}
          developerAccess={developerAccess}
          developerMode={developerMode}
          setDeveloperMode={setDeveloperMode}
          options={options}
          setOptions={setOptions}
          selectedChapterId={selectedChapterId}
          setSelectedChapterId={setSelectedChapterId}
          selectedStageNo={selectedStageNo}
          setSelectedStageNo={setSelectedStageNo}
          selectedChapter={selectedChapter}
          selectedStage={selectedStage}
          selectedStageLocked={selectedStageLocked}
          visibleStats={visibleStats}
          startRun={startRun}
          resetMeta={resetMeta}
          cheatCode={cheatCode}
          setCheatCode={setCheatCode}
          cheatMessage={cheatMessage}
          applyCheat={applyCheat}
          infinitePlayerName={infinitePlayerName}
          setInfinitePlayerName={setInfinitePlayerName}
          onPlayerNameBlur={() => saveInfinitePlayerName(window.localStorage, infinitePlayerName, infiniteEntriesRef.current)}
          infiniteSeed={infiniteSeed}
          setInfiniteSeed={setInfiniteSeed}
          startInfiniteRun={startInfiniteRun}
          leaderboardStatus={leaderboardStatus}
          infiniteEntries={infiniteEntries}
          legacyEntries={initialInfiniteLeaderboard.legacyEntries}
          buyMetaUpgrade={buyMetaUpgrade}
          buyPassive={buyPassive}
        />
      )}

      {loopFault && (
        <FaultDialog
          message={loopFault.message}
          count={loopFault.count}
          copyStatus={errorCopyStatus}
          onRetry={retryAfterFault}
          onMenu={toMenu}
          onCopyLog={() => void copyErrorLog()}
        />
      )}

      {!loopFault && phase === 'playing' && runPaused && snapshot && (
        <PauseHub
          snapshot={snapshot}
          tab={pauseTab}
          setTab={setPauseTab}
          confirmingAbandon={abandonConfirmOpen}
          onResume={() => setManualPause(false)}
          onAskAbandon={() => setAbandonConfirmOpen(true)}
          onCancelAbandon={() => setAbandonConfirmOpen(false)}
          onAbandon={toMenu}
          onBuyRunUpgrade={buyRunUpgrade}
          options={options}
          setOptions={setOptions}
          seedCopyStatus={seedCopyStatus}
          onCopySeed={() => void copyRunSeed()}
        />
      )}

      {!loopFault && phase === 'draft' && draft && <DraftModal key={draft.id} draft={draft} skills={snapshot?.skills ?? {}} onPick={handleOffer} />}

      {!loopFault && (phase === 'roundClear' || phase === 'gameOver') && settlement && (
        <SettlementModal
          key={`${settlement.runMode}-${settlement.seed}-${phase}`}
          settlement={settlement}
          defeated={phase === 'gameOver'}
          notes={notes ?? NO_SETTLEMENT_NOTES}
          reducedMotion={options.reducedMotion}
          leaderboardStatus={leaderboardStatus}
          seedCopyStatus={seedCopyStatus}
          nextStage={nextStage}
          nextStageOpen={nextStageOpen}
          onNextStage={startStage}
          onMenu={toMenu}
          onRetry={settlement.runMode === 'infinite' ? startInfiniteRun : startRun}
          onCopyInfiniteResult={() => void copyInfiniteResult()}
        />
      )}

      {phase !== 'menu' && !loopFault && noticeBanner('floating')}

      {DEVELOPER_UI_AVAILABLE && uiFault && <InjectedRenderFault />}

      {phase === 'menu' && resetConfirmOpen && <ResetDialog onConfirm={confirmResetMeta} onCancel={() => setResetConfirmOpen(false)} />}
    </div>
  );
}

export default App;
