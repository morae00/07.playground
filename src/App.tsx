import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DEVELOPER_UI_AVAILABLE, DEVELOPER_UI_DEFAULT_ENABLED } from './platform/developerAccess';
import { RULES_VERSION, rulesLabel } from './game/rules';
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
  recordCareer,
  recordCodex,
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
import { newlyMet, unlockAchievements } from './ui/achievements';
import type { AchievementId } from './content/data/achievements';
import COSMETICS, { type CosmeticId } from './content/data/cosmetics';
import { t } from './i18n/strings';
import { FaultDialog, ResetDialog, SuspendDialog } from './ui/screens/RunDialogs';
import { HudLayer } from './ui/screens/HudLayer';
import { DevPanel } from './ui/screens/DevPanel';
import { PauseHub, type PauseTab } from './ui/screens/PauseHub';
import { HintLayer, type HintId } from './ui/screens/HintLayer';
import { StoryPanels } from './ui/screens/StoryPanels';
import { appendDevRunLog, devRunEntry } from './platform/devRunLog';
import { clearSaveMoveNotice, readSaveMoveNotice, type SaveMoveNotice } from './platform/saveMove';
import { moveKeyMap, setMoveKeysInUse } from './platform/moveKeys';
import { beatsAfterClear, beatsBeforeRun, type StoryBeatId } from './ui/story';
import { CHARACTERS, CHARACTER_COSTS, CHARACTER_IDS, CHARACTER_MAX_LEVEL } from './game/characters';
import { characterOpen, type CharacterAction } from './ui/screens/CharactersView';
import { NAV as MENU_NAV, MenuScreen, type MenuView } from './ui/screens/MenuScreen';
import { nextRovingId, watchReducedMotion, type RovingKey } from './ui/inputContracts';
import { InputAdapter } from './ui/inputAdapter';
import { SpriteAtlas } from './game/render/assets/spriteAtlas';
import { ErrorLog, describeError } from './platform/errorReport';
import { copyErrorReport } from './ui/ErrorBoundary';
import { ARSENAL_FX_PACK, CHAPTER_PACKS, COMMON_PACK, HAZARDS_PACK, SKILLS_PACK, characterPack } from './game/render/assets/slots';
import { INFINITE_BASELINE } from './game/infiniteMode';
import { useGamepadNavigation } from './ui/useGamepadNavigation';
import { AudioMixer, type SoundPack } from './game/audio/mixer';
import type { MusicBridge } from './game/audio/musicBridge';
import { installUiSounds } from './ui/uiSounds';
import {
  CHAPTERS,
  GameEngine,
  META_PASSIVES,
  META_UPGRADES,
  asSuspendedRun,
  buildStats,
  formatClock,
  isStageUnlocked,
  makeRunUpgrades,
  metaUpgradeCost,
  nextStageProgress,
  stageIndex,
  suspendedRunReward,
  xpForMetaLevel,
  type DraftState,
  type HudSnapshot,
  type RunUpgradeId,
  type Settlement,
  type SkillOffer,
  type SuspendedRun,
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
// AUD-03: a build ships the music code only with a music pack (vite.config.ts); without one the music bus stays silent.
const MUSIC_PACK = typeof __MUSIC_PACK__ === 'boolean' && __MUSIC_PACK__;
let appMusic: MusicBridge | null = null;
const appMusicReady = MUSIC_PACK
  ? import('./game/audio/musicBridge').then(({ loadMusic }) => loadMusic(appMixer)).then((music) => { appMusic = music; return music; }, () => null)
  : null;
/** The death moment (FX-03): the canvas shows the fall this long before the settlement opens. */
const DEATH_MOMENT_MS = 700;

/** CON-07: the longest endless run on the local board, in seconds. */
const longestRun = (entries: readonly InfiniteScoreEntry[]) => entries.reduce((best, entry) => Math.max(best, entry.survivedSeconds), 0);

/** CON-07: the cosmetics the hero wears in play, as the renderer draws them. */
function wornLooks(cosmetics: ProfileData['cosmetics']) {
  const color = (id: string | null) => (id ? COSMETICS.cosmetics[id as CosmeticId]?.color ?? null : null);
  const trail = color(cosmetics.trail);
  return { outline: color(cosmetics.outline), trail: cosmetics.trail && trail ? { id: cosmetics.trail, color: trail } : null };
}

/** A result folds into the stage record (campaign) and the career totals (CON-07). */
function recordResult(profile: ProfileData, result: Settlement) {
  const recorded = recordCareer(
    result.runMode === 'campaign' ? recordStageResult(profile, { ...result, bonus: result.bonus?.met ?? false, assisted: result.assisted }) : profile,
    { ...result, bossKills: result.bossesDefeated },
  );
  return recordCodex(recorded, result.found);
}

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
  // CON-07: a save from before achievements earns what its records already show as it loads, so the first write
  // carries them (G17); later goals are met after settlements (below).
  const [initialAchievements] = useState(() => newlyMet(initialSave.data.profile, initialSave.data.meta, longestRun(initialInfiniteLeaderboard.entries)));
  const [profile, setProfile] = useState<ProfileData>(() => unlockAchievements(initialSave.data.profile, initialAchievements, Date.now()));
  const [phase, setPhase] = useState<'menu' | 'playing' | 'draft' | 'roundClear' | 'gameOver'>('menu');
  /** The chapter of the run on screen; the menu shows the selected chapter instead (atlas packs follow it). */
  const [runChapter, setRunChapter] = useState(1);
  // UI-14: the menu opens on the stage to play next.
  const [selectedChapterId, setSelectedChapterId] = useState(() => initialSave.data.meta.progress.chapter);
  const [selectedStageNo, setSelectedStageNo] = useState(() => initialSave.data.meta.progress.stage);
  const [developerMode, setDeveloperMode] = useState(DEVELOPER_UI_DEFAULT_ENABLED);
  const [menuView, setMenuView] = useState<MenuView>('play');
  // Developer builds only: the cheat panel (UI-04). The pause hub keeps its last tab between pauses.
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [pauseTab, setPauseTab] = useState<PauseTab>('build');
  const [cheatCode, setCheatCode] = useState('');
  const [cheatMessage, setCheatMessage] = useState('');
  const [snapshot, setSnapshot] = useState<HudSnapshot | null>(null);
  // CON-06: the story beats playing, if any, and what comes after them (a run to start, or nothing).
  const [story, setStory] = useState<{ beats: StoryBeatId[]; then?: () => void } | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  /** New records and level-ups of the settlement on screen, worked out before it is applied (UI-05). */
  const [notes, setNotes] = useState<SettlementNotes | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  /** UI-13: a new run (what it starts) or Discard (null) waits on this confirmation while a run is suspended. */
  const [suspendConfirm, setSuspendConfirm] = useState<{ then: (() => void) | null } | null>(null);
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
  /** CON-04: what a suspended run the rules no longer replay (or that failed to replay, UI-11) was paid; shown once. */
  const [suspendPaid, setSuspendPaid] = useState<{ gold: number; xp: number; broken?: boolean } | null>(null);
  /** BUG-22: what the player must know about the desktop save move (src/platform/saveMove.ts); shown until closed. */
  const [saveMoveNotice, setSaveMoveNotice] = useState<SaveMoveNotice | null>(() => readSaveMoveNotice(window.localStorage));
  /** CON-07: achievements met since the menu last said so. */
  const [achievementNotice, setAchievementNotice] = useState<AchievementId[]>(initialAchievements);
  const [resuming, setResuming] = useState(false);
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
  // UI-08: the input reads the movement keys on every key event, and the prompts name them.
  const moveKeysRef = useRef(options.moveKeys);
  moveKeysRef.current = options.moveKeys;
  setMoveKeysInUse(options.moveKeys);
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
    clearSaveMoveNotice(window.localStorage);
  }, []);

  // AUD-03: the music follows the screens, the pause, the drafts, and the run's snapshots.
  const [musicReady, setMusicReady] = useState(false);
  useEffect(() => {
    if (MUSIC_PACK) void appMusicReady?.then((music) => setMusicReady(music !== null));
  }, []);
  useEffect(() => {
    if (MUSIC_PACK && musicReady) appMusic?.app({ phase, story: story?.beats ?? null, paused: runPaused, draft: draft?.reason ?? null, snapshot });
  }, [musicReady, phase, story, runPaused, draft, snapshot]);

  useEffect(() => {
    if (developerAccess || isStageUnlocked(meta, selectedChapterId, selectedStageNo)) return;
    setSelectedChapterId(meta.progress.chapter);
    setSelectedStageNo(meta.progress.stage);
  }, [developerAccess, meta, selectedChapterId, selectedStageNo]);

  // Atlas packs (ART-07): the common pack and the pack of the chapter on screen stay resident, and the other chapters
  // are released, so textures keep to their budget. The menu loads the selected chapter ahead of its run.
  const artChapter = phase === 'menu' ? selectedChapterId : runChapter;
  // CON-08: an infinite run turns through the chapters; the next one's pack loads as its turn comes due.
  const lookChapter = phase === 'menu' ? null : snapshot?.lookChapter ?? null;
  const nextArtChapter = phase === 'menu' ? null : snapshot?.nextLookChapter ?? null;
  // CON-10 (K8): the character on screen: the run's (a resumed run keeps its own), else the one selected in the menu.
  const artCharacter = phase === 'menu' ? profile.characters.selected : snapshot?.character ?? profile.characters.selected;
  const reportedPacks = useRef(new Set<string>());
  useEffect(() => {
    if (lookChapter === null) return;
    setRunChapter(lookChapter);
    appMixer.ambience(`ambience.ch${Math.min(5, Math.max(1, lookChapter)) as 1 | 2 | 3 | 4 | 5}`);
  }, [lookChapter]);
  useEffect(() => {
    let cancelled = false;
    // Cleared while the packs load, so checks that wait for ready or fallback wait for this chapter's packs.
    delete document.documentElement.dataset.sprites;
    const chapterPack = CHAPTER_PACKS[artChapter];
    const nextPack = nextArtChapter === null ? undefined : CHAPTER_PACKS[nextArtChapter];
    for (const pack of Object.values(CHAPTER_PACKS)) if (pack !== chapterPack && pack !== nextPack) spriteAtlas.release(pack);
    const heroPack = characterPack(artCharacter);
    for (const id of CHARACTER_IDS) {
      const pack = characterPack(id);
      if (pack && pack !== heroPack) spriteAtlas.release(pack);
    }
    const packs = [COMMON_PACK, SKILLS_PACK, HAZARDS_PACK, ARSENAL_FX_PACK, heroPack, chapterPack, nextPack].filter((pack): pack is string => pack !== undefined);
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
  }, [artChapter, nextArtChapter, artCharacter, errorLog, spriteAtlas]);

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

  // CON-07: goals the save meets after a settlement (an endless run's length shows on the local board).
  const bestInfiniteSeconds = useMemo(() => longestRun(infiniteEntries), [infiniteEntries]);
  useEffect(() => {
    const met = newlyMet(profile, meta, bestInfiniteSeconds);
    if (met.length === 0) return;
    setProfile((previous) => unlockAchievements(previous, newlyMet(previous, meta, bestInfiniteSeconds), Date.now()));
    setAchievementNotice((previous) => [...previous, ...met.filter((id) => !previous.includes(id))]);
  }, [profile, meta, bestInfiniteSeconds]);

  /** CON-07: a cosmetic not earned yet costs its price in gold (a gold sink for finished builds). */
  const buyCosmetic = useCallback((id: CosmeticId) => {
    const price = COSMETICS.cosmetics[id]?.price ?? Number.POSITIVE_INFINITY;
    if (profileRef.current.cosmetics.owned.includes(id) || metaRef.current.gold < price) return;
    setMeta((previous) => ({ ...previous, gold: previous.gold - price }));
    setProfile((previous) => ({ ...previous, cosmetics: { ...previous.cosmetics, owned: [...previous.cosmetics.owned, id] } }));
  }, []);
  // CON-10: selects a playable character (keeping one unlocked by its chapter), or spends gold to unlock or upgrade.
  const characterAction = useCallback((action: CharacterAction, id: string) => {
    const def = CHARACTERS[id];
    const { characters } = profileRef.current;
    if (!def) return;
    if (action === 'select') {
      if (!characterOpen(id, profileRef.current, metaRef.current, developerAccess)) return;
      setProfile((previous) => ({ ...previous, characters: { ...previous.characters, selected: id, unlocked: previous.characters.unlocked.includes(id) ? previous.characters.unlocked : [...previous.characters.unlocked, id] } }));
      return;
    }
    const level = characters.levels[id] ?? 0;
    const price = action === 'unlock'
      ? (characters.unlocked.includes(id) ? Infinity : def.unlock?.gold ?? Infinity)
      : (characterOpen(id, profileRef.current, metaRef.current, developerAccess) && level < CHARACTER_MAX_LEVEL ? CHARACTER_COSTS[level] : Infinity);
    if (!(metaRef.current.gold >= price)) return;
    setMeta((previous) => ({ ...previous, gold: previous.gold - price }));
    setProfile((previous) => ({
      ...previous,
      characters: action === 'unlock'
        ? { ...previous.characters, unlocked: [...previous.characters.unlocked, id] }
        : { ...previous.characters, levels: { ...previous.characters.levels, [id]: level + 1 } },
    }));
  }, [developerAccess]);
  const wearCosmetic = useCallback((id: CosmeticId, wear: boolean) => {
    const { kind } = COSMETICS.cosmetics[id];
    setProfile((previous) => (previous.cosmetics.owned.includes(id) ? { ...previous, cosmetics: { ...previous.cosmetics, [kind]: wear ? id : null } } : previous));
  }, []);

  // CON-04: the run in play is kept as a suspended run, every 10 s and whenever it pauses (focus loss included), so a
  // crash or a quit costs a few seconds at most. A settlement clears it.
  const suspendRun = useCallback(() => {
    const state = engineRef.current?.suspendState();
    if (state) setProfile((previous) => ({ ...previous, runSuspend: { savedAt: Date.now(), rulesVersion: state.rulesVersion, state } }));
  }, []);
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'draft') return undefined;
    const timer = window.setInterval(suspendRun, 10_000);
    return () => window.clearInterval(timer);
  }, [phase, suspendRun]);
  useEffect(() => {
    if (runPaused) suspendRun();
  }, [runPaused, suspendRun]);
  /** A suspended run that will not be resumed is settled as a defeat for what it reached at its last save, then dropped (G14). */
  const settleSuspended = useCallback((run: SuspendedRun) => {
    const reward = suspendedRunReward(run);
    grantSettlement({ ...reward, cleared: false, chapter: run.chapter, stage: run.stage }, false);
    setProfile((previous) => ({ ...previous, runSuspend: null }));
    return reward;
  }, []);
  // A run this build's rules cannot replay is settled at start.
  useEffect(() => {
    const suspended = profileRef.current.runSuspend;
    if (!suspended) return;
    const run = asSuspendedRun(suspended.state);
    if (run && suspended.rulesVersion === RULES_VERSION) return;
    if (run) setSuspendPaid(settleSuspended(run));
    setProfile((previous) => ({ ...previous, runSuspend: null }));
    // On start only.
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

  const grantSettlement = useCallback((result: Pick<Settlement, 'gold' | 'xp' | 'cleared' | 'chapter' | 'stage'>, unlockProgress: boolean) => {
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
        setProfile((prev) => ({ ...recordResult(prev, result), runSuspend: null }));
        grantSettlement(result, unlockProgress);
        // D-07: developer builds keep every run's numbers for playtest export.
        if (DEVELOPER_UI_AVAILABLE) appendDevRunLog(window.localStorage, devRunEntry(result, Date.now()));
        // CON-06: a chapter's final clear plays its outro (and the last one the ending) before the settlement.
        const beats = beatsAfterClear(profileRef.current.storySeen, result);
        if (beats.length > 0) setStory({ beats });
        setPhase('roundClear');
      },
      onGameOver: (result: Settlement) => {
        runPausedRef.current = false;
        setRunPaused(false);
        setNotes(settlementNotes(result, profileRef.current.stageRecords[`${result.chapter}-${result.stage}`], metaRef.current, false));
        setSettlement(result);
        setProfile((prev) => ({ ...recordResult(prev, result), runSuspend: null }));
        if (result.runMode === 'infinite') setInfiniteSeed(String(result.seed));
        grantSettlement(result, false);
        if (DEVELOPER_UI_AVAILABLE) appendDevRunLog(window.localStorage, devRunEntry(result, Date.now()));
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

  const selectedCharacter = profile.characters.selected;
  const characterLevel = profile.characters.levels[selectedCharacter] ?? 0;
  const visibleStats = useMemo(() => buildStats(meta, makeRunUpgrades(), {}, { id: selectedCharacter, level: characterLevel }), [meta, selectedCharacter, characterLevel]);
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
    engine.setCosmetics(wornLooks(profileRef.current.cosmetics));
    engineRef.current = engine;
    engine.setSprites(spriteAtlas);
    engine.setSound(appMixer);
    // CON-10: the run starts as the selected character, if it is playable here.
    const { characters } = profileRef.current;
    engine.setCharacter(characterOpen(characters.selected, profileRef.current, metaRef.current, developerAccess) ? { id: characters.selected, level: characters.levels[characters.selected] ?? 0 } : null);
    if (MUSIC_PACK) engine.subscribe((event) => appMusic?.event(event));
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
      moveKeys: () => moveKeysRef.current,
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
  }, [callbacks, developerAccess, meta, options, spriteAtlas]);

  /** CON-06: plays the story beats due first, if any, then goes on. */
  const afterStory = useCallback((beats: StoryBeatId[], then: () => void) => {
    if (beats.length > 0) setStory({ beats, then });
    else then();
  }, []);
  const finishStory = useCallback(() => {
    if (!story) return;
    setStory(null);
    setProfile((previous) => ({ ...previous, storySeen: [...new Set([...previous.storySeen, ...story.beats])] }));
    story.then?.();
  }, [story]);

  /** UI-13: goes on at once, unless a run is suspended: then the player confirms that it ends (settled) first. */
  const replaceSuspended = useCallback((then: (() => void) | null) => {
    if (asSuspendedRun(profileRef.current.runSuspend?.state)) setSuspendConfirm({ then });
    else then?.();
  }, []);
  const confirmSuspended = () => {
    const run = asSuspendedRun(profileRef.current.runSuspend?.state);
    setSuspendConfirm(null);
    if (run) settleSuspended(run);
    suspendConfirm?.then?.();
  };

  const startRun = useCallback(() => {
    if (selectedStageLocked) return;
    const [chapter, stage] = [selectedChapter.id, selectedStage.id];
    replaceSuspended(() => afterStory(beatsBeforeRun(profileRef.current.storySeen, chapter), () => beginRun(chapter, (engine) => engine.startRun(chapter, stage))));
  }, [afterStory, beginRun, replaceSuspended, selectedChapter.id, selectedStage.id, selectedStageLocked]);

  /** CON-04: replays the suspended run in a new engine, then opens the pause hub (or the draft it was saved in). */
  const resumeSuspended = useCallback(() => {
    const run = asSuspendedRun(profileRef.current.runSuspend?.state);
    if (!run) return;
    // UI-14: the settlement's retry starts the selected stage, which is the resumed run's.
    if (run.mode === 'campaign') {
      setSelectedChapterId(run.chapter);
      setSelectedStageNo(run.stage);
    }
    setResuming(true);
    beginRun(run.mode === 'infinite' ? INFINITE_BASELINE.chapter : run.chapter, (engine) => {
      void engine.resumeRun(run).then(() => {
        if (engineRef.current !== engine) return;
        setResuming(false);
        if (!engine.awaitingDraft) setManualPause(true);
      }, (error: unknown) => {
        // UI-11: a run that throws as it replays would throw again next time, so it is settled and dropped.
        if (engineRef.current !== engine) return;
        errorLog.record('loop', error, 'resume');
        toMenu();
        setSuspendPaid({ ...settleSuspended(run), broken: true });
        setNotice('error');
      });
    });
  }, [beginRun, errorLog, setManualPause, settleSuspended]);
  const discardSuspended = useCallback(() => replaceSuspended(null), [replaceSuspended]);

  /** Settlement's primary action: go straight on to the next stage (CON-02). */
  const startStage = useCallback((address: { chapter: number; stage: number }) => {
    setSelectedChapterId(address.chapter as typeof selectedChapterId);
    setSelectedStageNo(address.stage);
    afterStory(beatsBeforeRun(profileRef.current.storySeen, address.chapter), () => beginRun(address.chapter, (engine) => engine.startRun(address.chapter, address.stage)));
  }, [afterStory, beginRun]);

  const startInfiniteRun = useCallback(() => {
    const normalizedName = normalizeInfinitePlayerName(infinitePlayerName);
    setInfinitePlayerName(normalizedName);
    saveInfinitePlayerName(window.localStorage, normalizedName, infiniteEntriesRef.current);
    const seedText = infiniteSeed.trim();
    const parsedSeed = seedText && /^\d+$/.test(seedText) ? Number(seedText) : Number.NaN;
    const seed = Number.isSafeInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 0xffff_ffff
      ? parsedSeed >>> 0
      : undefined;
    replaceSuspended(() => beginRun(INFINITE_BASELINE.chapter, (engine) => engine.startInfiniteRun(seed, !developerAccess)));
  }, [beginRun, developerAccess, infinitePlayerName, infiniteSeed, replaceSuspended]);

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
      // SYS-08: R spends a token to redraw the cards.
      if (event.key.toLowerCase() === 'r' && draft.depth?.tokens) {
        event.preventDefault();
        engineRef.current?.rerollDraft();
        return;
      }
      // A digit chosen as a movement key moves; it does not pick a card (UI-08).
      if (moveKeyMap(moveKeysRef.current)[event.code]) return;
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
    setResuming(false);
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

  /** UI-11: leaving from the fault dialog settles the run exactly as giving up does, so it is not offered again. */
  const leaveFaultedRun = () => {
    try {
      engineRef.current?.forfeit();
    } catch (error) {
      errorLog.record('loop', error, 'forfeit');
      setProfile((previous) => ({ ...previous, runSuspend: null }));
    }
    toMenu();
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
  const achievementBanner = achievementNotice.length > 0 && (
    <div className="noticeBanner inline" role="status" aria-live="polite">
      <p>{t('notice.achievements', { names: achievementNotice.map((id) => t(`achievement.${id}`)).join(' · ') })}</p>
      <div className="noticeActions">
        <button className="ghost" type="button" data-sound="cancel" onClick={() => setAchievementNotice([])}>{t('common.close')}</button>
      </div>
    </div>
  );
  const suspendBanner = suspendPaid && (
    <div className="noticeBanner inline" role="status" aria-live="polite">
      <p>{t(suspendPaid.broken ? 'notice.suspendBroken' : 'notice.suspendPaid', { gold: suspendPaid.gold, xp: suspendPaid.xp })}</p>
      <div className="noticeActions">
        <button className="ghost" type="button" data-sound="cancel" onClick={() => setSuspendPaid(null)}>{t('common.close')}</button>
      </div>
    </div>
  );
  const saveMoveBanner = saveMoveNotice && (
    <div className="noticeBanner inline" role="status" aria-live="polite">
      <p>{t(`notice.saveMove.${saveMoveNotice.status}`)}</p>
      <div className="noticeActions">
        <button className="ghost" type="button" data-sound="cancel" onClick={() => setSaveMoveNotice(null)}>{t('common.close')}</button>
      </div>
      {saveMoveNotice.backup && <p className="noticePath">{t('notice.saveMove.backup', { path: saveMoveNotice.backup })}</p>}
      {saveMoveNotice.rawCopy && <p className="noticePath">{t('notice.saveMove.rawCopy', { path: saveMoveNotice.rawCopy })}</p>}
    </div>
  );
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
    const next = nextRovingId(MENU_NAV, menuView, key as RovingKey);
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

  const suspended = asSuspendedRun(profile.runSuspend?.state);

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
          frame={profile.cosmetics.frame}
        />
      )}

      {resuming && <div className="resumeOverlay" role="status" aria-live="polite">{t('resume.loading')}</div>}
      {phase === 'playing' && !runPaused && snapshot && <HintLayer snapshot={snapshot} seen={profile.hintsSeen} onSeen={markHintSeen} />}

      {DEVELOPER_UI_AVAILABLE && developerAccess && phase !== 'menu' && devPanelOpen && (
        <DevPanel cheatCode={cheatCode} setCheatCode={setCheatCode} cheatMessage={cheatMessage} onApplyCheat={applyCheat} />
      )}

      {phase === 'menu' && (
        <MenuScreen
          meta={meta}
          records={profile.stageRecords}
          profile={profile}
          bestInfiniteSeconds={bestInfiniteSeconds}
          onBuyCosmetic={buyCosmetic}
          onCharacter={characterAction}
          onWearCosmetic={wearCosmetic}
          onPlayStory={(beats) => setStory({ beats })}
          inlineNotice={<>{saveMoveBanner}{achievementBanner}{suspendBanner}{noticeBanner('inline')}</>}
          suspended={suspended}
          onResumeSuspended={resumeSuspended}
          onDiscardSuspended={discardSuspended}
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
          onMenu={leaveFaultedRun}
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
          onAbandon={() => {
            setAbandonConfirmOpen(false);
            engineRef.current?.forfeit();
          }}
          onBuyRunUpgrade={buyRunUpgrade}
          options={options}
          setOptions={setOptions}
          seedCopyStatus={seedCopyStatus}
          onCopySeed={() => void copyRunSeed()}
        />
      )}

      {!loopFault && phase === 'draft' && draft && (
        <DraftModal
          key={draft.id}
          draft={draft}
          build={snapshot ?? { skills: {}, fusions: [], slots: null }}
          onPick={handleOffer}
          onReroll={() => engineRef.current?.rerollDraft()}
          onBanish={(offerId) => engineRef.current?.banishOffer(offerId)}
        />
      )}

      {story && <StoryPanels beats={story.beats} onDone={finishStory} />}
      {!loopFault && !story && (phase === 'roundClear' || phase === 'gameOver') && settlement && (
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
          character={snapshot?.character ?? 'gyeol'}
        />
      )}

      {phase !== 'menu' && !loopFault && noticeBanner('floating')}

      {DEVELOPER_UI_AVAILABLE && uiFault && <InjectedRenderFault />}

      {phase === 'menu' && resetConfirmOpen && <ResetDialog onConfirm={confirmResetMeta} onCancel={() => setResetConfirmOpen(false)} />}
      {phase === 'menu' && suspendConfirm && suspended && (
        <SuspendDialog discard={!suspendConfirm.then} {...suspendedRunReward(suspended)} onConfirm={confirmSuspended} onCancel={() => setSuspendConfirm(null)} />
      )}
    </div>
  );
}

export default App;
