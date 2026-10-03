// Music director (AUD-03): which track plays, when it changes, and how it bends, as a pure state machine. It follows
// the cue sheet (art/audio/cue-sheet.md, a draft the team has yet to confirm): the app tells it the scene (menu, run,
// story, settlement) and the overlays (pause, draft), the engine its events and HUD snapshots, and it answers with
// commands for the music player. It holds no audio, so its tests read the cue sheet's tables directly.
import type { GameEvent } from '../engine/events.ts';

export type MusicTrackId = 'menu' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'boss-mid' | 'boss-final' | 'enrage-sting' | 'ending';
export type MusicStem = 'dense' | 'phase';
export type DuckId = 'pause' | 'draft' | 'story' | 'phase';

export type MusicCommand =
  /** Start a track on a fresh deck: after `fade` seconds of fade-in, crossfading the deck playing now if any. */
  | { type: 'play'; track: MusicTrackId; fade: number; crossfade: boolean; resume: boolean }
  /** Fade the playing deck out; `remember` keeps its position for a later resume; `tape` is the defeat's tape stop. */
  | { type: 'stop'; fade: number; remember: boolean; tape?: boolean }
  /** A stem's level in dB at the next bar line, ramped over one bar; null turns it off. */
  | { type: 'stem'; stem: MusicStem; db: number | null }
  /**
   * A duck on the music (the deepest one wins); `seconds` to reach it. Null db lifts that duck. With `hold`, the duck
   * lifts itself after that long, over `release` seconds (the phase change's short dip).
   */
  | { type: 'duck'; id: DuckId; db: number | null; seconds: number; hold?: number; release?: number }
  /** The pause hub's low-pass on the music: a cutoff in Hz over `seconds`; null opens it again. */
  | { type: 'lowpass'; hz: number | null; seconds: number }
  /** The first enrage step's sting, straight to the music bus; it ducks the boss deck itself. */
  | { type: 'sting' }
  /** Decode these tracks ahead (the next chapter, a boss stage's boss track); others may be let go. */
  | { type: 'preload'; tracks: MusicTrackId[] };

export type MusicScene =
  | { kind: 'silent' }
  | { kind: 'menu' }
  | { kind: 'run'; mode: 'campaign' | 'infinite'; chapter: number; stageKind: 'normal' | 'midBoss' | 'finalBoss' }
  | { kind: 'story'; beat: string }
  | { kind: 'settlement'; cleared: boolean };

export type MusicSnapshot = {
  enemyCount: number;
  enemyCap: number;
  lookChapter: number;
  nextLookChapter: number | null;
  /** The boss the HUD shows, if any: a resumed run replays without events, so a boss stage finds its boss here. */
  boss?: { phase: number; enraged: boolean } | null;
};

/** The cue sheet's numbers (§2), in one place. */
export const MUSIC_RULES = Object.freeze({
  menuFadeIn: 2.0,
  menuResumeFadeIn: 1.5,
  menuFadeOut: 0.8,
  runFadeIn: 1.0,
  runToMenuFadeOut: 1.0,
  bossCrossfade: 1.5,
  bossFadeIn: 0.3,
  bossKillFade: 0.25,
  clearFadeOut: 2.0,
  chapterTurnCrossfade: 2.0,
  storyFade: 2.0,
  endingFadeIn: 1.5,
  phaseStemDb: { 2: -6, 3: 0 } as Readonly<Record<number, number>>,
  phaseDuckDb: -4,
  draftDuckDb: -4,
  draftDuckSeconds: 0.2,
  draftReleaseSeconds: 0.3,
  pauseDuckDb: -8,
  pauseLowpassHz: 1500,
  pauseSeconds: 0.3,
  storyDuckDb: -6,
  crowdOn: 0.55,
  crowdOnHold: 2,
  crowdOff: 0.35,
  crowdOffHold: 6,
  fieldBossRelease: 4,
});

const chapterTrack = (chapter: number) => `ch${Math.min(5, Math.max(1, Math.round(chapter)))}` as MusicTrackId;

export class MusicDirector {
  private scene: MusicScene = { kind: 'silent' };
  private track: MusicTrackId | null = null;
  private readonly out: MusicCommand[] = [];
  private paused = false;
  private draft: 'level' | 'boss' | null = null;
  private dense = false;
  private aboveSince: number | null = null;
  private belowSince: number | null = null;
  private bossesAlive = 0;
  private fieldHoldUntil = -Infinity;
  private enraged = false;
  private bossDown = false;
  private phaseStem = false;
  private preloaded: MusicTrackId | null = null;

  /** Commands since the last call, oldest first. */
  drain(): MusicCommand[] {
    return this.out.splice(0);
  }

  setScene(next: MusicScene) {
    const previous = this.scene;
    if (sameScene(previous, next)) return;
    this.scene = next;
    if (next.kind === 'menu') {
      const fromRun = previous.kind === 'run' || previous.kind === 'settlement';
      if (this.track && this.track !== 'menu') this.stop(MUSIC_RULES.runToMenuFadeOut, true);
      if (previous.kind === 'story') this.emit({ type: 'duck', id: 'story', db: null, seconds: MUSIC_RULES.menuResumeFadeIn });
      // Back from the prologue the menu track never stopped; it only comes up from under the story.
      if (this.track !== 'menu') this.play('menu', fromRun || previous.kind === 'story' ? MUSIC_RULES.menuResumeFadeIn : MUSIC_RULES.menuFadeIn, true);
      return;
    }
    if (next.kind === 'story') {
      if (next.beat === 'prologue' && this.track === 'menu') {
        this.emit({ type: 'duck', id: 'story', db: MUSIC_RULES.storyDuckDb, seconds: 1.0 });
      } else if (next.beat === 'outro-5' || next.beat === 'ending') {
        if (this.track !== 'ending') this.play('ending', MUSIC_RULES.endingFadeIn, false);
      } else if (this.track) {
        this.stop(MUSIC_RULES.storyFade, true);
      }
      return;
    }
    if (next.kind === 'settlement') {
      // A defeat already stopped the deck at the death (player/died); a clear lets the track go and keeps its place.
      // The ending does not outlast its panels: it fades as the settlement opens (§2.7).
      if (this.track) this.stop(MUSIC_RULES.clearFadeOut, next.cleared && this.track !== 'ending');
      this.resetRun();
      return;
    }
    if (next.kind === 'run') {
      const wasRun = previous.kind === 'run' && previous.mode === next.mode && previous.stageKind === next.stageKind;
      if (previous.kind === 'story') this.emit({ type: 'duck', id: 'story', db: null, seconds: 0.5 });
      if (!wasRun) this.resetRun();
      if (this.track === 'menu') this.stop(MUSIC_RULES.menuFadeOut, true);
      if (next.mode === 'campaign' && next.stageKind !== 'normal') {
        // A boss stage waits for its boss with the ambience alone (§2.2), the boss track decoding meanwhile.
        if (this.track && this.track !== 'menu') this.stop(MUSIC_RULES.runFadeIn, false);
        this.emit({ type: 'preload', tracks: [next.stageKind === 'midBoss' ? 'boss-mid' : 'boss-final'] });
        return;
      }
      const track = chapterTrack(next.chapter);
      if (this.track !== track) {
        const turning = wasRun && next.mode === 'infinite' && this.track !== null;
        this.play(track, turning ? MUSIC_RULES.chapterTurnCrossfade : MUSIC_RULES.runFadeIn, !turning, turning);
      }
      return;
    }
    if (this.track) this.stop(MUSIC_RULES.runToMenuFadeOut, true);
  }

  /** The pause hub (with the window's auto pause) and the drafts; the deepest duck wins in the player. */
  setOverlays({ paused, draft }: { paused: boolean; draft: 'level' | 'boss' | null }) {
    if (paused !== this.paused) {
      this.paused = paused;
      this.emit({ type: 'duck', id: 'pause', db: paused ? MUSIC_RULES.pauseDuckDb : null, seconds: MUSIC_RULES.pauseSeconds });
      this.emit({ type: 'lowpass', hz: paused ? MUSIC_RULES.pauseLowpassHz : null, seconds: MUSIC_RULES.pauseSeconds });
    }
    if (draft !== this.draft) {
      this.draft = draft;
      // A boss reward draft follows the boss track's cut, in silence; only level drafts duck a playing track.
      const db = draft === 'level' ? MUSIC_RULES.draftDuckDb : null;
      this.emit({ type: 'duck', id: 'draft', db, seconds: db === null ? MUSIC_RULES.draftReleaseSeconds : MUSIC_RULES.draftDuckSeconds });
    }
  }

  onEvent(event: GameEvent, now: number) {
    const scene = this.scene;
    if (scene.kind !== 'run') return;
    const bossStage = scene.mode === 'campaign' && scene.stageKind !== 'normal';
    switch (event.type) {
      case 'boss/spawned':
        if (bossStage) {
          const track = scene.stageKind === 'midBoss' ? 'boss-mid' : 'boss-final';
          if (this.track !== track) this.play(track, this.track ? MUSIC_RULES.bossCrossfade : MUSIC_RULES.bossFadeIn, false, this.track !== null);
        } else {
          // Field bosses, faded copies, and the infinite round bosses keep the chapter track and raise its dense stem.
          this.bossesAlive += 1;
          this.setDense(true);
        }
        return;
      case 'boss/phase':
        if (!bossStage) return;
        this.phaseStem = true;
        this.emit({ type: 'stem', stem: 'phase', db: MUSIC_RULES.phaseStemDb[event.phase] ?? 0 });
        // The base dips while the boss stiffens for its phase change (0.45 s), then comes back.
        this.emit({ type: 'duck', id: 'phase', db: MUSIC_RULES.phaseDuckDb, seconds: 0.05, hold: 0.45, release: 0.3 });
        return;
      case 'boss/enraged':
        if (!bossStage || this.enraged) return;
        // Only the first step stings; the later steps and the overtime keep to the sound effect (§2.4).
        this.enraged = true;
        this.phaseStem = true;
        this.emit({ type: 'sting' });
        this.emit({ type: 'stem', stem: 'phase', db: 0 });
        return;
      case 'enemy/killed':
        if (!event.isBoss) return;
        if (bossStage) {
          this.bossDown = true;
          if (this.track === 'boss-mid' || this.track === 'boss-final') this.stop(MUSIC_RULES.bossKillFade, false);
          return;
        }
        this.bossesAlive = Math.max(0, this.bossesAlive - 1);
        if (this.bossesAlive === 0) this.fieldHoldUntil = now + MUSIC_RULES.fieldBossRelease;
        return;
      case 'player/died':
        if (this.track) this.stop(0.7, false, true);
        return;
      default:
    }
  }

  /** HUD snapshots: the crowd for the dense stem, and the infinite run's next chapter to decode ahead. */
  onSnapshot(snapshot: MusicSnapshot, now: number) {
    const scene = this.scene;
    if (scene.kind !== 'run') return;
    if (scene.mode === 'infinite' && snapshot.nextLookChapter !== null) {
      const next = chapterTrack(snapshot.nextLookChapter);
      if (this.preloaded !== next) {
        this.preloaded = next;
        this.emit({ type: 'preload', tracks: [next] });
      }
    }
    if (scene.mode === 'campaign' && scene.stageKind !== 'normal') {
      // A boss already standing when the stage comes back (a resumed run): its track, stem, and enrage as they are.
      const track = scene.stageKind === 'midBoss' ? 'boss-mid' : 'boss-final';
      if (snapshot.boss && !this.bossDown && this.track !== track) {
        this.play(track, MUSIC_RULES.bossFadeIn, false);
        const db = snapshot.boss.enraged ? 0 : MUSIC_RULES.phaseStemDb[snapshot.boss.phase];
        if (db !== undefined) {
          this.phaseStem = true;
          this.emit({ type: 'stem', stem: 'phase', db });
        }
        this.enraged = snapshot.boss.enraged;
      }
      return;
    }
    const crowd = snapshot.enemyCap > 0 ? snapshot.enemyCount / snapshot.enemyCap : 0;
    this.aboveSince = crowd >= MUSIC_RULES.crowdOn ? this.aboveSince ?? now : null;
    this.belowSince = crowd <= MUSIC_RULES.crowdOff ? this.belowSince ?? now : null;
    if (!this.dense && this.aboveSince !== null && now - this.aboveSince >= MUSIC_RULES.crowdOnHold) this.setDense(true);
    const bossHolds = this.bossesAlive > 0 || now < this.fieldHoldUntil;
    if (this.dense && !bossHolds && this.belowSince !== null && now - this.belowSince >= MUSIC_RULES.crowdOffHold) this.setDense(false);
  }

  private setDense(on: boolean) {
    if (on === this.dense) return;
    this.dense = on;
    this.emit({ type: 'stem', stem: 'dense', db: on ? 0 : null });
  }

  /** A run's stems end with it, so the next track starts without them. */
  private resetRun() {
    if (this.dense) this.emit({ type: 'stem', stem: 'dense', db: null });
    if (this.phaseStem) this.emit({ type: 'stem', stem: 'phase', db: null });
    this.phaseStem = false;
    this.dense = false;
    this.aboveSince = null;
    this.belowSince = null;
    this.bossesAlive = 0;
    this.fieldHoldUntil = -Infinity;
    this.enraged = false;
    this.bossDown = false;
    this.preloaded = null;
  }

  private play(track: MusicTrackId, fade: number, resume: boolean, crossfade = false) {
    this.track = track;
    this.emit({ type: 'play', track, fade, crossfade, resume });
  }

  private stop(fade: number, remember: boolean, tape = false) {
    this.track = null;
    this.emit(tape ? { type: 'stop', fade, remember, tape } : { type: 'stop', fade, remember });
  }

  private emit(command: MusicCommand) {
    this.out.push(command);
  }
}

function sameScene(a: MusicScene, b: MusicScene) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'run' && b.kind === 'run') return a.mode === b.mode && a.chapter === b.chapter && a.stageKind === b.stageKind;
  if (a.kind === 'story' && b.kind === 'story') return a.beat === b.beat;
  if (a.kind === 'settlement' && b.kind === 'settlement') return a.cleared === b.cleared;
  return true;
}
