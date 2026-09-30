import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  loadGameSave,
  saveGameSave,
  type GameOptions,
  type MetaState,
  type MetaUpgradeId,
  type PaceMode,
  type PassiveId,
} from './platform/save';
import { ModalDialog } from './ui/ModalDialog';
import { ProgressBar } from './ui/ProgressBar';
import { nextRovingId, type RovingKey } from './ui/inputContracts';
import { InputAdapter } from './ui/inputAdapter';
import { useGamepadNavigation } from './ui/useGamepadNavigation';
import {
  CHAPTERS,
  GameEngine,
  META_PASSIVES,
  META_UPGRADES,
  RARITY,
  RUN_UPGRADES,
  SKILLS,
  SKILL_IDS,
  buildStats,
  formatClock,
  isStageUnlocked,
  makeRunUpgrades,
  metaUpgradeCost,
  nextStageProgress,
  runUpgradeCost,
  stageIndex,
  xpForMetaLevel,
  type DraftState,
  type HudSnapshot,
  type RunUpgradeId,
  type Settlement,
  type SkillOffer,
  type StageProgress,
  type StatBlock,
} from './game/GameEngine';

export { GameEngine } from './game/GameEngine';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
/** Reward and result dialogs ignore activation input this long after opening (BUG-05). */
const DIALOG_INPUT_GUARD_MS = 350;

function StatGrid({ stats }: { stats: StatBlock }) {
  const rows = [
    ['공격력', stats.attack.toFixed(1)],
    ['방어력', stats.defense.toFixed(1)],
    ['체력', Math.round(stats.maxHp).toString()],
    ['이동속도', Math.round(stats.moveSpeed).toString()],
    ['치명타', `${Math.round(stats.critChance * 100)}%`],
    ['치명피해', `${Math.round(stats.critDamage * 100)}%`],
    ['보스피해', `${Math.round(stats.bossDamage * 100)}%`],
    ['공격속도', `${Math.round(stats.attackSpeed * 100)}%`],
    ['회복속도', `${stats.hpRegen.toFixed(1)}/s`],
    ['자석', Math.round(stats.magnet).toString()],
  ];
  const renderRows = (items: string[][]) => items.map(([label, value]) => (
        <div className="statCell" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
  ));
  return (
    <div className="statSummary">
      <div className="statGrid coreStats">{renderRows(rows.slice(0, 5))}</div>
      <details className="statDetails">
        <summary>상세 능력치</summary>
        <div className="statGrid">{renderRows(rows.slice(5))}</div>
      </details>
    </div>
  );
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  // Keyboard, pointer, and gamepad reach the engine only as commands through this adapter (TEC-07).
  const inputRef = useRef<InputAdapter | null>(null);
  const pauseIntentRef = useRef<() => void>(() => undefined);
  const drawerToggleRef = useRef<HTMLButtonElement | null>(null);
  const runPausedRef = useRef(false);
  const phaseRef = useRef<'menu' | 'playing' | 'draft' | 'roundClear' | 'gameOver'>('menu');
  const [initialSave] = useState(() => loadGameSave(window.localStorage));
  const [initialInfiniteLeaderboard] = useState(() => loadInfiniteLeaderboard(window.localStorage));
  const [meta, setMeta] = useState<MetaState>(() => initialSave.data.meta);
  const [options, setOptions] = useState<GameOptions>(() => initialSave.data.options);
  const [phase, setPhase] = useState<'menu' | 'playing' | 'draft' | 'roundClear' | 'gameOver'>('menu');
  const [selectedChapterId, setSelectedChapterId] = useState(1);
  const [selectedStageNo, setSelectedStageNo] = useState(1);
  const [developerMode, setDeveloperMode] = useState(DEVELOPER_UI_DEFAULT_ENABLED);
  const [menuView, setMenuView] = useState<'play' | 'infinite' | 'growth'>('play');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'skills' | 'upgrades' | 'options' | 'cheats'>('skills');
  const [cheatCode, setCheatCode] = useState('');
  const [cheatMessage, setCheatMessage] = useState('');
  const [snapshot, setSnapshot] = useState<HudSnapshot | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [abandonConfirmOpen, setAbandonConfirmOpen] = useState(false);
  const [runPaused, setRunPaused] = useState(false);
  const [seedCopyStatus, setSeedCopyStatus] = useState('');
  const [infiniteEntries, setInfiniteEntries] = useState<InfiniteScoreEntry[]>(() => initialInfiniteLeaderboard.entries);
  const [infinitePlayerName, setInfinitePlayerName] = useState(() => initialInfiniteLeaderboard.playerName);
  const [infiniteSeed, setInfiniteSeed] = useState('');
  const [leaderboardStatus, setLeaderboardStatus] = useState('');
  const infiniteEntriesRef = useRef(infiniteEntries);
  const developerAccess = DEVELOPER_UI_AVAILABLE && developerMode;
  phaseRef.current = phase;
  // During active play the gamepad only moves the player; menus and dialogs take it over otherwise.
  useGamepadNavigation(phase !== 'playing' || runPaused);
  infiniteEntriesRef.current = infiniteEntries;

  useEffect(() => {
    if (initialSave.writable) saveGameSave(window.localStorage, { meta, options });
    engineRef.current?.setMeta(meta);
    engineRef.current?.setOptions(options);
  }, [initialSave.writable, meta, options]);

  useEffect(() => {
    if (developerAccess || isStageUnlocked(meta, selectedChapterId, selectedStageNo)) return;
    setSelectedChapterId(meta.progress.chapter);
    setSelectedStageNo(meta.progress.stage);
  }, [developerAccess, meta, selectedChapterId, selectedStageNo]);

  useEffect(() => {
    return () => {
      inputRef.current?.dispose();
      engineRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    // Read-only diagnostics for browser regression probes; developer builds only.
    if (!DEVELOPER_UI_AVAILABLE) return undefined;
    const target = window as typeof window & { __blacklineDiagnostics?: () => unknown };
    target.__blacklineDiagnostics = () => engineRef.current?.getDiagnostics() ?? null;
    return () => { delete target.__blacklineDiagnostics; };
  }, []);

  useEffect(() => {
    if (!sidePanelOpen) return;
    requestAnimationFrame(() => document.getElementById(`drawer-tab-${drawerTab}`)?.focus());
  }, [drawerTab, sidePanelOpen]);

  const closeRunDrawer = useCallback((restoreFocus = true) => {
    setSidePanelOpen(false);
    if (restoreFocus) requestAnimationFrame(() => drawerToggleRef.current?.focus());
  }, []);

  const setManualPause = useCallback((paused: boolean) => {
    const engine = engineRef.current;
    if (!engine || phaseRef.current !== 'playing') return;
    runPausedRef.current = paused;
    setRunPaused(paused);
    setAbandonConfirmOpen(false);
    if (paused) {
      engine.pause();
      setSidePanelOpen(false);
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
      if (event.key === 'Escape' && sidePanelOpen) {
        closeRunDrawer(true);
        return;
      }
      toggleManualPause();
    };
    window.addEventListener('keydown', onPauseShortcut);
    return () => window.removeEventListener('keydown', onPauseShortcut);
  }, [closeRunDrawer, phase, sidePanelOpen, toggleManualPause]);

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
      setLeaderboardStatus('치트 또는 개발자 모드 사용으로 경쟁 기록에서 제외되었습니다.');
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
      ? ranked ? 'LOCAL TOP 10에 기록되었습니다.' : '기록을 저장했지만 TOP 10에는 들지 못했습니다.'
      : '브라우저 저장소를 사용할 수 없어 기록을 저장하지 못했습니다.');
  }, [infinitePlayerName]);

  const callbacks = useMemo(
    () => ({
      onSnapshot: setSnapshot,
      onDraft: (nextDraft: DraftState) => {
        runPausedRef.current = false;
        setRunPaused(false);
        setSidePanelOpen(false);
        setDraft(nextDraft);
        setPhase('draft');
      },
      onRoundClear: (result: Settlement) => {
        runPausedRef.current = false;
        setRunPaused(false);
        setSettlement(result);
        grantSettlement(result, !developerAccess);
        setPhase('roundClear');
      },
      onGameOver: (result: Settlement) => {
        runPausedRef.current = false;
        setRunPaused(false);
        setSettlement(result);
        if (result.runMode === 'infinite') setInfiniteSeed(String(result.seed));
        grantSettlement(result, false);
        recordInfiniteSettlement(result);
        setPhase('gameOver');
      },
      onFrameStart: () => inputRef.current?.poll(),
    }),
    [developerAccess, grantSettlement, recordInfiniteSettlement],
  );

  const visibleStats = useMemo(() => buildStats(meta, makeRunUpgrades(), {}), [meta]);
  const selectedChapter = useMemo(() => CHAPTERS.find((chapter) => chapter.id === selectedChapterId) ?? CHAPTERS[0], [selectedChapterId]);
  const selectedStage = useMemo(
    () => selectedChapter.stages.find((stage) => stage.id === selectedStageNo) ?? selectedChapter.stages[0],
    [selectedChapter, selectedStageNo],
  );
  const selectedStageLocked = !developerAccess && !isStageUnlocked(meta, selectedChapter.id, selectedStage.id);

  const beginRun = useCallback((launch: (engine: GameEngine) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    inputRef.current?.dispose();
    engineRef.current?.dispose();
    const engine = new GameEngine(canvas, meta, options, callbacks);
    engineRef.current = engine;
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
    setSidePanelOpen(false);
    runPausedRef.current = false;
    setRunPaused(false);
    setSeedCopyStatus('');
    setLeaderboardStatus('');
    setCheatMessage('');
    setPhase('playing');
    launch(engine);
  }, [callbacks, meta, options]);

  const startRun = useCallback(() => {
    if (selectedStageLocked) return;
    beginRun((engine) => engine.startRun(selectedChapter.id, selectedStage.id));
  }, [beginRun, selectedChapter.id, selectedStage.id, selectedStageLocked]);

  const startInfiniteRun = useCallback(() => {
    const normalizedName = normalizeInfinitePlayerName(infinitePlayerName);
    setInfinitePlayerName(normalizedName);
    saveInfinitePlayerName(window.localStorage, normalizedName, infiniteEntriesRef.current);
    const seedText = infiniteSeed.trim();
    const parsedSeed = seedText && /^\d+$/.test(seedText) ? Number(seedText) : Number.NaN;
    const seed = Number.isSafeInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 0xffff_ffff
      ? parsedSeed >>> 0
      : undefined;
    beginRun((engine) => engine.startInfiniteRun(seed, !developerAccess));
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
    inputRef.current?.dispose();
    inputRef.current = null;
    engineRef.current?.dispose();
    engineRef.current = null;
    setPhase('menu');
    setSnapshot(null);
    setDraft(null);
    setSettlement(null);
    runPausedRef.current = false;
    setRunPaused(false);
    setAbandonConfirmOpen(false);
    setSidePanelOpen(false);
  };

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
      setSeedCopyStatus('Seed를 복사했습니다');
    } catch {
      setSeedCopyStatus(`복사할 Seed: ${snapshot.seed}`);
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
      setSeedCopyStatus('결과와 Challenge Seed를 복사했습니다.');
    } catch {
      setSeedCopyStatus(summary.replace(/\n/g, ' / '));
    }
  };

  const handleMenuTabKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = nextRovingId(['play', 'infinite', 'growth'] as const, menuView, event.key as RovingKey);
    setMenuView(next);
    requestAnimationFrame(() => document.getElementById(`menu-tab-${next}`)?.focus());
  };

  const handleDrawerTabKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const ids: Array<typeof drawerTab> = developerAccess ? ['skills', 'upgrades', 'options', 'cheats'] : ['skills', 'upgrades', 'options'];
    const next = nextRovingId(ids, drawerTab, event.key as RovingKey);
    setDrawerTab(next);
    requestAnimationFrame(() => document.getElementById(`drawer-tab-${next}`)?.focus());
  };

  const resetMeta = () => {
    setResetConfirmOpen(true);
  };

  const confirmResetMeta = () => {
    setMeta(createDefaultMeta());
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
    <div className="appShell">
      <canvas
        ref={canvasRef}
        className="gameCanvas"
        role="img"
        aria-label="흑백 타격 생존전 플레이 영역"
        aria-describedby={phase === 'playing' ? 'game-state-summary' : undefined}
        aria-hidden={phase !== 'playing'}
        aria-keyshortcuts="W A S D ArrowUp ArrowDown ArrowLeft ArrowRight P Escape"
        tabIndex={phase === 'playing' ? 0 : -1}
      >
        이 브라우저는 Canvas 플레이 화면을 지원하지 않습니다.
      </canvas>
      {phase === 'playing' && snapshot && (
        <p className="srOnly" id="game-state-summary">
          {snapshot.runMode === 'infinite'
            ? `무한 모드. 경과 시간 ${formatClock(snapshot.elapsed)}. 점수 ${snapshot.score}. 보스 처치 ${snapshot.bossKills}.`
            : `Chapter ${snapshot.chapter}, Stage ${snapshot.stage}. 남은 시간 ${formatClock(snapshot.timeLeft)}.`}
          체력 {Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}. 적 {snapshot.enemyCount}명. WASD, 방향키, 포인터 또는 게임패드로 이동합니다.
          P, Escape 또는 게임패드 Start로 일시정지합니다. {runPaused ? '현재 일시정지 상태입니다.' : ''}
        </p>
      )}

      {phase !== 'menu' && snapshot && (
        <div className={sidePanelOpen ? 'gameHud panelOpen' : 'gameHud panelClosed'}>
          <div className="hudLeft">
            <div className="roundBadge">
              <strong>{snapshot.runMode === 'infinite' ? 'INFINITE' : `Ch.${snapshot.chapter} / St.${snapshot.stage}`}</strong>
              <span>{snapshot.runMode === 'infinite'
                ? `DANGER ${snapshot.dangerRank}`
                : snapshot.stageKind === 'normal'
                  ? '생존'
                  : snapshot.stageKind === 'midBoss'
                    ? '중간보스'
                    : '챕터보스'}</span>
            </div>
            <div className="barGroup">
              <div className="barLabel">
                <span>HP</span>
                <b>{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</b>
              </div>
              <ProgressBar label="플레이어 체력" value={snapshot.hp} max={snapshot.maxHp} className="hpBar" valueText={`${Math.ceil(snapshot.hp)} / ${Math.ceil(snapshot.maxHp)}`} />
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
              </div>
            )}
          </div>
          <div className="hudRight">
            <button className={snapshot.timeScale === 2 ? 'primary small iconButton active' : 'primary small iconButton'} onClick={toggleSpeed} aria-pressed={snapshot.timeScale === 2} aria-label={`게임 속도 ${snapshot.timeScale === 2 ? '1배속' : '2배속'}으로 변경`} title="게임 속도">
              <span aria-hidden="true">{snapshot.timeScale === 2 ? '×2' : '×1'}</span>
            </button>
            <button ref={drawerToggleRef} className="ghost small iconButton" onClick={() => { if (sidePanelOpen) closeRunDrawer(false); else setSidePanelOpen(true); }} aria-expanded={sidePanelOpen} aria-controls="run-drawer" aria-label={sidePanelOpen ? '런 패널 닫기' : '런 패널 열기'} title="런 패널">
              <span aria-hidden="true">{sidePanelOpen ? '×' : '☰'}</span>
            </button>
            <button className="ghost small iconButton" onClick={toggleManualPause} aria-pressed={runPaused} aria-label={runPaused ? '일시정지 해제' : '게임 일시정지'} title="일시정지 (P / Esc)"><span aria-hidden="true">{runPaused ? '▶' : 'Ⅱ'}</span></button>
            <div className="metricLine"><span>코인</span><b>{snapshot.coins}</b></div>
            <div className="metricLine"><span>{snapshot.runMode === 'infinite' ? '보스' : '킬'}</span><b>{snapshot.runMode === 'infinite' ? snapshot.bossKills : snapshot.kills}</b></div>
            <div className="metricLine"><span>적</span><b>{snapshot.enemyCount}</b></div>
          </div>
        </div>
      )}

      {phase !== 'menu' && snapshot && snapshot.activeEffects.length > 0 && (
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

      {phase !== 'menu' && snapshot && sidePanelOpen && (
        <aside className="sidePanel" id="run-drawer" aria-label="런 정보 패널">
          <nav className="drawerTabs" role="tablist" aria-label="런 패널 보기">
            {([
              ['skills', '빌드'],
              ['upgrades', '강화'],
              ['options', '옵션'],
              ...(developerAccess ? [['cheats', '개발'] as const] : []),
            ] as const).map(([id, label]) => (
              <button
                id={`drawer-tab-${id}`}
                className={drawerTab === id ? 'drawerTab active' : 'drawerTab'}
                role="tab"
                aria-selected={drawerTab === id}
                aria-controls={`drawer-panel-${id}`}
                onClick={() => setDrawerTab(id)}
                tabIndex={drawerTab === id ? 0 : -1}
                onKeyDown={handleDrawerTabKey}
                key={id}
              >
                {label}
              </button>
            ))}
          </nav>

          {drawerTab === 'skills' && <section className="panelBlock drawerPanel" id="drawer-panel-skills" role="tabpanel" aria-labelledby="drawer-tab-skills" tabIndex={0}>
            <h2>현재 빌드</h2>
            <div className="seedLine">
              <span>RUN SEED</span>
              <code>{snapshot.seed}</code>
              <button className="ghost small" type="button" onClick={() => void copyRunSeed()}>복사</button>
            </div>
            {seedCopyStatus && <p className="seedStatus" role="status" aria-live="polite">{seedCopyStatus}</p>}
            <div className="skillList">
              {SKILL_IDS.filter((id) => snapshot.skills[id]).map((id) => {
                const state = snapshot.skills[id]!;
                const def = SKILLS[id];
                return (
                  <div className={`skillPill ${RARITY[def.rarity].className}`} key={id}>
                    <span>{def.shortName}</span>
                    <b>Lv.{state.level}{state.awakened ? 'A' : ''}</b>
                  </div>
                );
              })}
              {SKILL_IDS.every((id) => !snapshot.skills[id]) && <div className="emptyText">첫 레벨업 대기</div>}
            </div>
          </section>}

          {drawerTab === 'upgrades' && <section className="panelBlock drawerPanel" id="drawer-panel-upgrades" role="tabpanel" aria-labelledby="drawer-tab-upgrades" tabIndex={0}>
            <h2>런 강화</h2>
            <div className="runShop">
              {(Object.keys(RUN_UPGRADES) as RunUpgradeId[]).map((id) => {
                const level = snapshot.runUpgrades[id];
                const cost = runUpgradeCost(id, level);
                const reason = snapshot.coins < cost ? `코인 ${cost - snapshot.coins}개 부족` : undefined;
                const reasonId = `run-upgrade-${id}-reason`;
                return (
                  <button className="shopButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? RUN_UPGRADES[id].line} onClick={() => { if (!reason) buyRunUpgrade(id); }} key={id}>
                    <span>{RUN_UPGRADES[id].label} <em>Lv.{level}</em></span>
                    <b>{cost}c</b>
                    {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                  </button>
                );
              })}
            </div>
          </section>}

          {drawerTab === 'options' && <section className="panelBlock compactOptions drawerPanel" id="drawer-panel-options" role="tabpanel" aria-labelledby="drawer-tab-options" tabIndex={0}>
            <h2>플레이 옵션</h2>
            <label>
              <span>체력바</span>
              <select value={options.healthBars} onChange={(event) => setOptions({ ...options, healthBars: event.target.value as GameOptions['healthBars'] })}>
                <option value="elite">대형+</option>
                <option value="all">전체</option>
                <option value="off">끄기</option>
              </select>
            </label>
            <label>
              <span>볼륨</span>
              <input type="range" min="0" max="1" step="0.01" value={options.volume} onChange={(event) => setOptions({ ...options, volume: Number(event.target.value) })} />
            </label>
            <label>
              <span>이펙트</span>
              <input type="range" min="0.25" max="1" step="0.05" value={options.effects} onChange={(event) => setOptions({ ...options, effects: Number(event.target.value) })} />
            </label>
            <label className="checkLine">
              <input type="checkbox" checked={options.damageNumbers} onChange={(event) => setOptions({ ...options, damageNumbers: event.target.checked })} />
              <span>데미지 숫자</span>
            </label>
            <label className="checkLine">
              <input type="checkbox" checked={options.screenShake} onChange={(event) => setOptions({ ...options, screenShake: event.target.checked })} />
              <span>화면 흔들림</span>
            </label>
            <label className="checkLine">
              <input type="checkbox" checked={options.reducedFlash} onChange={(event) => setOptions({ ...options, reducedFlash: event.target.checked })} />
              <span>섬광 감소</span>
            </label>
            <label className="checkLine">
              <input type="checkbox" checked={options.autoPause} onChange={(event) => setOptions({ ...options, autoPause: event.target.checked })} />
              <span>창을 벗어나면 자동 일시정지</span>
            </label>
            {DEVELOPER_UI_AVAILABLE && <label>
              <span>라운드 길이</span>
              <select value={options.paceMode} onChange={(event) => setOptions({ ...options, paceMode: event.target.value as PaceMode })}>
                <option value="standard">표준</option>
                <option value="showcase">쇼케이스</option>
              </select>
            </label>}
          </section>}

          {drawerTab === 'cheats' && developerAccess && <section className="panelBlock cheatBlock drawerPanel" id="drawer-panel-cheats" role="tabpanel" aria-labelledby="drawer-tab-cheats" tabIndex={0}>
            <h2>개발 도구</h2>
            <div className="cheatRow">
              <input aria-label="Cheat code" value={cheatCode} onChange={(event) => setCheatCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') applyCheat(); }} placeholder="CODE" />
              <button className="ghost small" onClick={applyCheat}>입력</button>
            </div>
            {cheatMessage && <div className="emptyText" role="status" aria-live="polite" aria-atomic="true">{cheatMessage}</div>}
          </section>}
        </aside>
      )}

      {phase === 'menu' && (
        <main className="menuLayer">
          <section className="titleBlock">
            <div>
              <p className="eyebrow">
                BLACKLINE SURVIVOR <span className="appVersion">v{APP_VERSION}</span>
                {DEVELOPER_UI_DEFAULT_ENABLED && <span className="developerBuildBadge">DEV APP</span>}
              </p>
              <h1>흑백 타격 생존전</h1>
            </div>
            <div className="wallet">
              <span>골드</span>
              <strong>{meta.gold}</strong>
              <span>외부 레벨</span>
              <strong>{meta.level}</strong>
              <span>패시브 포인트</span>
              <strong>{meta.passivePoints}</strong>
              <span>해금 Stage</span>
              <strong>Ch.{meta.progress.chapter} / St.{meta.progress.stage}</strong>
            </div>
          </section>

          <nav className="menuTabs" role="tablist" aria-label="메뉴 보기">
            <button id="menu-tab-play" className={menuView === 'play' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'play'} aria-controls="menu-panel-play" tabIndex={menuView === 'play' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('play')}>Stage 선택</button>
            <button id="menu-tab-infinite" className={menuView === 'infinite' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'infinite'} aria-controls="menu-panel-infinite" tabIndex={menuView === 'infinite' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('infinite')}>무한 경쟁</button>
            <button id="menu-tab-growth" className={menuView === 'growth' ? 'menuTab active' : 'menuTab'} role="tab" aria-selected={menuView === 'growth'} aria-controls="menu-panel-growth" tabIndex={menuView === 'growth' ? 0 : -1} onKeyDown={handleMenuTabKey} onClick={() => setMenuView('growth')}>영구 성장</button>
          </nav>

          <section className="menuGrid single">
            <div className="stageColumn" id="menu-panel-play" role="tabpanel" aria-labelledby="menu-tab-play" hidden={menuView !== 'play'}>
              <h2>Chapter</h2>
              <div className="stageList" role="group" aria-label="Chapter 선택">
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
                      title={chapterLocked ? '이전 Chapter의 Stage 10 클리어 필요' : chapter.subtitle}
                      key={chapter.id}
                    >
                      <span>{chapter.name}</span>
                      <strong>{chapterLocked ? '잠김' : chapter.difficulty}</strong>
                      <em>{chapter.subtitle}</em>
                      <small>{chapter.stages.map((item) => item.kind === 'normal' ? item.id : item.kind === 'midBoss' ? '5M' : '10B').join(' / ')}</small>
                      {chapterLocked && <span className="srOnly" id={reasonId}>이전 Chapter의 Stage 10 클리어 필요</span>}
                    </button>
                  );
                })}
                <button className="stageCard locked" aria-disabled="true" aria-describedby="chapter-6-lock-reason">
                  <span>Chapter 6: 미개방 구역</span>
                  <strong>Coming Soon</strong>
                  <em>10개 신규 Stage와 보스가 곧 열립니다</em>
                  <span className="srOnly" id="chapter-6-lock-reason">현재 버전에서는 Chapter 6을 선택할 수 없습니다</span>
                </button>
              </div>
              {DEVELOPER_UI_AVAILABLE && <label className="devToggle">
                <input type="checkbox" checked={developerMode} onChange={(event) => { setDeveloperMode(event.target.checked); if (!event.target.checked && drawerTab === 'cheats') setDrawerTab('skills'); }} />
                <span>개발자 모드: 모든 Stage 접근</span>
              </label>}
              <div className="chapterTree">
                <strong>{selectedChapter.name} / Stage 선택</strong>
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
                    title={locked ? '이전 Stage 클리어 필요' : item.objective}
                    onClick={() => {
                      if (locked) return;
                      setSelectedStageNo(item.id);
                    }}
                  >
                    <span>Stage {item.id}</span>
                    <em>{item.objective}</em>
                    <b>{item.kind === 'normal' ? '일반' : item.kind === 'midBoss' ? '중간보스' : '챕터보스'}</b>
                    {locked && <span className="srOnly" id={reasonId}>이전 Stage 클리어 필요</span>}
                  </button>;
                })}
              </div>
              <div className="menuSection loadoutSummary">
                <h2>현재 기본 스펙</h2>
                <StatGrid stats={visibleStats} />
              </div>
              <div className="startRow">
                <button className="primary launch" onClick={startRun} aria-disabled={selectedStageLocked} aria-describedby={selectedStageLocked ? 'selected-stage-lock-reason' : undefined} title={selectedStageLocked ? '이전 Stage 클리어 필요' : selectedStage.objective}>Ch.{selectedChapter.id} / St.{selectedStage.id} 시작{selectedStageLocked && <span className="srOnly" id="selected-stage-lock-reason">이전 Stage 클리어 필요</span>}</button>
                <button className="ghost" onClick={resetMeta}>초기화</button>
              </div>
              {developerAccess && <div className="menuSection cheatMenu">
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
                  <p className="eyebrow">ENDLESS SCORE ATTACK</p>
                  <h2>무한 경쟁</h2>
                </div>
                <div className="infiniteModeFacts" aria-label="무한 모드 규칙">
                  <div><span>START</span><b>Stage 5 Mid Boss</b></div>
                  <div><span>BOSS</span><b>Random Respawn</b></div>
                  <div><span>LIMIT</span><b>None</b></div>
                </div>
              </header>

              <div className="infiniteControls">
                <label>
                  <span>플레이어 이름</span>
                  <input
                    value={infinitePlayerName}
                    maxLength={16}
                    autoComplete="nickname"
                    onChange={(event) => setInfinitePlayerName(event.target.value)}
                    onBlur={() => saveInfinitePlayerName(window.localStorage, infinitePlayerName, infiniteEntriesRef.current)}
                  />
                </label>
                <label>
                  <span>Challenge Seed</span>
                  <input
                    value={infiniteSeed}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="비우면 랜덤"
                    onChange={(event) => setInfiniteSeed(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </label>
                <button className="primary launch" type="button" onClick={startInfiniteRun}>무한 모드 시작</button>
              </div>
              {developerAccess && <div className="recordWarning">개발자 모드 Run은 경쟁 기록에서 제외됩니다.</div>}
              {leaderboardStatus && <div className="leaderboardStatus" role="status" aria-live="polite">{leaderboardStatus}</div>}

              <section className="leaderboardSection" aria-labelledby="infinite-ranking-title">
                <div className="leaderboardHead">
                  <div>
                    <p className="eyebrow">LOCAL RECORDS</p>
                    <h2 id="infinite-ranking-title">TOP 10</h2>
                  </div>
                  <b>{infiniteEntries.length} / 10</b>
                </div>
                {infiniteEntries.length > 0 ? (
                  <div className="leaderboardTableWrap">
                    <table className="leaderboardTable">
                      <thead>
                        <tr><th>RANK</th><th>PLAYER</th><th>SCORE</th><th>TIME</th><th>BOSS</th><th>SEED</th></tr>
                      </thead>
                      <tbody>
                        {infiniteEntries.map((entry, index) => (
                          <tr key={entry.id}>
                            <td>{String(index + 1).padStart(2, '0')}</td>
                            <td><strong>{entry.player}</strong><small>{new Date(entry.endedAt).toLocaleDateString('ko-KR')}</small></td>
                            <td><b>{entry.score.toLocaleString('ko-KR')}</b></td>
                            <td>{formatClock(entry.survivedSeconds)}</td>
                            <td>{entry.bosses}</td>
                            <td><button className="ghost small seedChallenge" type="button" aria-label={`Seed ${entry.seed}로 도전`} onClick={() => setInfiniteSeed(String(entry.seed))}>{entry.seed}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="leaderboardEmpty">아직 기록이 없습니다.</div>}
                {initialInfiniteLeaderboard.legacyEntries.length > 0 && (
                  <p className="leaderboardLegacy">
                    이전 규칙(v1) 기록 {initialInfiniteLeaderboard.legacyEntries.length}건은 현재 규칙(v{RULES_VERSION}) 순위와 섞이지 않도록 따로 보관합니다.
                    최고 {initialInfiniteLeaderboard.legacyEntries[0].score.toLocaleString('ko-KR')}점 · {initialInfiniteLeaderboard.legacyEntries[0].player}
                  </p>
                )}
              </section>
            </div>

            <div className="upgradeColumn" id="menu-panel-growth" role="tabpanel" aria-labelledby="menu-tab-growth" hidden={menuView !== 'growth'}>
              <div className="menuSection">
                <h2>기본 스펙</h2>
                <StatGrid stats={visibleStats} />
              </div>

              <div className="menuSection">
                <h2>영구 강화</h2>
                <div className="upgradeGrid">
                  {(Object.keys(META_UPGRADES) as MetaUpgradeId[]).map((id) => {
                    const level = meta.upgrades[id];
                    const def = META_UPGRADES[id];
                    const cost = metaUpgradeCost(id, level);
                    const reason = level >= def.max ? '최대 레벨' : meta.gold < cost ? `골드 ${cost - meta.gold} 부족` : undefined;
                    const reasonId = `meta-upgrade-${id}-reason`;
                    return (
                      <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? def.line} onClick={() => buyMetaUpgrade(id)} key={id}>
                        <span>{def.label}</span>
                        <em>{def.line} Lv.{level}/{def.max}</em>
                        <b>{level >= def.max ? 'MAX' : `${cost}g`}</b>
                        {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="menuSection">
                <h2>외부 레벨 패시브</h2>
                <div className="upgradeGrid passiveGrid">
                  {(Object.keys(META_PASSIVES) as PassiveId[]).map((id) => {
                    const level = meta.passives[id];
                    const def = META_PASSIVES[id];
                    const reason = level >= def.max ? '최대 레벨' : meta.passivePoints <= 0 ? '패시브 포인트 필요' : undefined;
                    const reasonId = `passive-${id}-reason`;
                    return (
                      <button className="upgradeButton" aria-disabled={Boolean(reason)} aria-describedby={reason ? reasonId : undefined} title={reason ?? def.line} onClick={() => buyPassive(id)} key={id}>
                        <span>{def.label}</span>
                        <em>{def.line} Lv.{level}/{def.max}</em>
                        <b>1p</b>
                        {reason && <small className="srOnly" id={reasonId}>{reason}</small>}
                      </button>
                    );
                  })}
                </div>
                <div className="metaXp">
                  <span>다음 외부 레벨</span>
                  <ProgressBar label="외부 레벨 경험치" value={meta.xp} max={xpForMetaLevel(meta.level)} className="xpBar" valueText={`${meta.xp} / ${xpForMetaLevel(meta.level)}`} />
                  <b>{meta.xp} / {xpForMetaLevel(meta.level)}</b>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {phase === 'playing' && runPaused && (
        <ModalDialog className="settlementBox pauseBox" labelledBy="pause-dialog-title" describedBy="pause-dialog-description" onEscape={() => setManualPause(false)}>
          <div className="modalHead">
            <p>RUN PAUSED</p>
            <h2 id="pause-dialog-title">일시정지</h2>
          </div>
          {abandonConfirmOpen ? (
            <>
              <p id="pause-dialog-description">
                {snapshot?.runMode === 'infinite'
                  ? '지금 포기하면 이번 무한 경쟁 기록과 보상이 남지 않습니다. 정말 메뉴로 돌아갈까요?'
                  : '지금 포기하면 이번 Stage의 골드와 경험치를 받지 못합니다. 정말 메뉴로 돌아갈까요?'}
              </p>
              <div className="modalActions">
                <button className="primary" onClick={() => setAbandonConfirmOpen(false)}>계속 플레이</button>
                <button className="danger" onClick={toMenu}>포기하고 메뉴로</button>
              </div>
            </>
          ) : (
            <>
              <p id="pause-dialog-description">현재 Run은 멈춰 있습니다. P, Escape 또는 게임패드 Start로 계속할 수 있습니다.</p>
              <div className="pauseSeed"><span>RUN SEED</span><code>{snapshot?.seed}</code></div>
              <div className="modalActions">
                <button className="primary" onClick={() => setManualPause(false)}>계속하기</button>
                <button className="ghost" onClick={() => setAbandonConfirmOpen(true)}>Stage 메뉴</button>
              </div>
            </>
          )}
        </ModalDialog>
      )}

      {phase === 'draft' && draft && (
        <ModalDialog key={draft.id} className="draftBox" labelledBy="draft-dialog-title" describedBy="draft-dialog-description" inputGuardMs={DIALOG_INPUT_GUARD_MS}>
            <p className="srOnly" id="draft-dialog-description">계속하려면 보상 하나를 반드시 선택해야 합니다. 숫자키, 방향키와 Enter, 또는 게임패드 A로 고릅니다.</p>
            <div className="modalHead">
              <p>{draft.reason === 'boss' ? '확정 보상' : '랜덤 스킬'}</p>
              <h2 id="draft-dialog-title">{draft.title}</h2>
            </div>
            <div className="draftGrid">
              {draft.cards.map((offer, index) => {
                const activeLine = offer.kind === 'bonus' ? 'BONUS' : SKILLS[offer.skillId].active ? 'ACTIVE' : 'PASSIVE';
                return (
                  <button
                    className={`draftCard ${RARITY[offer.rarity].className} ${offer.kind === 'awakening' ? 'awakening' : ''}`}
                    onClick={() => handleOffer(offer)}
                    aria-keyshortcuts={`${index + 1}`}
                    key={offer.kind === 'bonus' ? `${offer.kind}-${offer.bonus}` : `${offer.kind}-${offer.skillId}`}
                  >
                    <b className="cardShortcut" aria-hidden="true">{index + 1}</b>
                    <span>{RARITY[offer.rarity].label}</span>
                    <h3>{offer.title}</h3>
                    <p>{offer.body}</p>
                    <em>{offer.levelLine}</em>
                    <strong>{activeLine}</strong>
                  </button>
                );
              })}
            </div>
        </ModalDialog>
      )}

      {(phase === 'roundClear' || phase === 'gameOver') && settlement && (
        <ModalDialog key={`${settlement.runMode}-${settlement.seed}-${phase}`} className="settlementBox" labelledBy="settlement-dialog-title" onEscape={toMenu} inputGuardMs={DIALOG_INPUT_GUARD_MS}>
            <div className="modalHead">
              <p>{settlement.runMode === 'infinite' ? 'INFINITE RUN END' : phase === 'gameOver' ? 'STAGE MATCH END' : settlement.gameComplete ? 'CHAPTER 5 CLEAR' : `CH.${settlement.chapter} / ST.${settlement.stage}`}</p>
              <h2 id="settlement-dialog-title">{settlement.gameComplete ? '5챕터 돌파' : settlement.title}</h2>
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
            {settlement.gameComplete && <div className="soonStrip">Chapter 6 Coming Soon</div>}
            {settlement.cleared && !settlement.gameComplete && <div className="soonStrip">Stage 클리어. 다음 Stage는 Stage 선택에서 시작할 수 있습니다.</div>}
            <div className="modalActions">
              <button className="primary" onClick={toMenu}>{settlement.runMode === 'infinite' ? '무한 경쟁' : 'Stage 선택'}</button>
              <button className="ghost" onClick={settlement.runMode === 'infinite' ? startInfiniteRun : startRun}>{settlement.runMode === 'infinite' ? '다시 도전' : phase === 'gameOver' ? '재시작' : '같은 Stage 재시작'}</button>
              {settlement.runMode === 'infinite' && <button className="ghost" type="button" onClick={() => void copyInfiniteResult()}>결과 복사</button>}
            </div>
        </ModalDialog>
      )}

      {phase === 'menu' && resetConfirmOpen && (
        <ModalDialog className="settlementBox confirmBox" labelledBy="reset-dialog-title" onEscape={() => setResetConfirmOpen(false)}>
          <div className="modalHead">
            <p>LOCAL SAVE RESET</p>
            <h2 id="reset-dialog-title">진행 데이터를 초기화할까요?</h2>
          </div>
          <p>골드, 외부 레벨, 영구 강화, Stage 해금 진행도가 기본 상태로 돌아갑니다.</p>
          <div className="modalActions">
            <button className="danger" onClick={confirmResetMeta}>초기화</button>
            <button className="ghost" onClick={() => setResetConfirmOpen(false)}>취소</button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

export default App;
