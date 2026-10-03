// Music bridge (AUD-03): the app's state, the engine's events, and the HUD snapshots in; the music director's
// commands out to the mixer. The app imports it only in a build that ships a music pack, so a build without one
// carries none of the music code.
import type { StageKind } from '../../content/campaign.ts';
import type { GameEvent } from '../engine/events.ts';
import type { DraftReason, HudSnapshot } from '../GameEngine.ts';
import { MusicDirector, type MusicCommand, type MusicScene } from './musicDirector.ts';
import { MusicPlayer, type MusicPack } from './musicPlayer.ts';
import type { MusicPlayerFactory } from './mixer.ts';

export const MUSIC_PACK_URL = 'assets/packs/music/pack.json';

export type MusicAppState = {
  phase: 'menu' | 'playing' | 'draft' | 'roundClear' | 'gameOver';
  /** The story beats on screen, if any; they cover every phase. */
  story: readonly string[] | null;
  paused: boolean;
  draft: DraftReason | null;
  snapshot: Pick<HudSnapshot, 'runMode' | 'chapter' | 'lookChapter' | 'nextLookChapter' | 'stageKind' | 'enemyCount' | 'enemyCap' | 'elapsed' | 'bossId' | 'bossPhase' | 'bossEnrage'> | null;
};

/** Events kept from a run's start until the app shows it (a boss stage's boss arrives as the stage starts). */
const PENDING_EVENTS = 32;

/** The music scene of the app's state; null while a run has started but sent no snapshot yet (the scene holds). */
export function musicScene({ phase, story, snapshot }: MusicAppState): MusicScene | null {
  if (story && story.length > 0) {
    // The last chapter's outro and the ending play the ending track; another beat's first beat names the scene.
    const beat = story.includes('ending') ? 'ending' : story.includes('outro-5') ? 'outro-5' : story[0];
    return { kind: 'story', beat };
  }
  if (phase === 'menu') return { kind: 'menu' };
  if (phase === 'roundClear' || phase === 'gameOver') return { kind: 'settlement', cleared: phase === 'roundClear' };
  if (!snapshot) return null;
  const stageKind: StageKind = snapshot.stageKind;
  return {
    kind: 'run',
    mode: snapshot.runMode,
    // An infinite run turns through the chapters' looks, and its music with them.
    chapter: snapshot.runMode === 'infinite' ? snapshot.lookChapter : snapshot.chapter,
    stageKind: snapshot.runMode === 'infinite' ? 'normal' : stageKind,
  };
}

export class MusicBridge {
  private readonly director = new MusicDirector();
  private readonly output: { music: (command: MusicCommand) => void };
  private snapshot: MusicAppState['snapshot'] = null;
  private elapsed = 0;
  private inRun = false;
  private readonly pending: GameEvent[] = [];

  constructor(output: { music: (command: MusicCommand) => void }) {
    this.output = output;
  }

  app(state: MusicAppState) {
    const scene = musicScene(state);
    const fresh = state.snapshot && state.snapshot !== this.snapshot && (state.phase === 'playing' || state.phase === 'draft') ? state.snapshot : null;
    if (fresh) this.elapsed = fresh.elapsed;
    if (scene) {
      this.director.setScene(scene);
      this.inRun = scene.kind === 'run';
      // The engine starts a run before the app shows it: its first events wait for the run scene.
      const pending = this.pending.splice(0);
      if (this.inRun) for (const event of pending) this.director.onEvent(event, this.elapsed);
    }
    this.director.setOverlays({ paused: state.paused && state.phase === 'playing', draft: state.phase === 'draft' ? state.draft : null });
    if (fresh) {
      const { enemyCount, enemyCap, lookChapter, nextLookChapter, elapsed, bossId, bossPhase, bossEnrage } = fresh;
      const boss = bossId ? { phase: bossPhase ?? 1, enraged: (bossEnrage ?? 0) > 0 } : null;
      this.director.onSnapshot({ enemyCount, enemyCap, lookChapter, nextLookChapter, boss }, elapsed);
    }
    this.snapshot = state.snapshot;
    this.flush();
  }

  /** An engine event, timed by the run clock of the last snapshot. */
  event(event: GameEvent) {
    if (!this.inRun) {
      if (this.pending.length < PENDING_EVENTS) this.pending.push(event);
      return;
    }
    this.director.onEvent(event, this.elapsed);
    this.flush();
  }

  private flush() {
    for (const command of this.director.drain()) this.output.music(command);
  }
}

export const createMusicPlayer: MusicPlayerFactory = (options) => new MusicPlayer({
  ...options,
  onError: (message) => console.warn(message),
});

/** Loads the music pack and hands it to the mixer; null when it is missing or unreadable (the music stays silent). */
export async function loadMusic(mixer: { setMusic: (pack: MusicPack, create: MusicPlayerFactory) => void; music: (command: MusicCommand) => void }, fetchJson: (url: string) => Promise<unknown> = fetchPack) {
  const pack = await fetchJson(MUSIC_PACK_URL).catch(() => null);
  if (!isMusicPack(pack)) return null;
  mixer.setMusic(pack, createMusicPlayer);
  return new MusicBridge(mixer);
}

async function fetchPack(url: string) {
  const response = await fetch(url);
  return response.ok ? response.json() : null;
}

function isMusicPack(value: unknown): value is MusicPack {
  if (!value || typeof value !== 'object') return false;
  const pack = value as Partial<MusicPack>;
  return typeof pack.id === 'string' && typeof pack.base === 'string' && !!pack.tracks && typeof pack.tracks === 'object';
}
