import assert from 'node:assert/strict';
import test from 'node:test';
import { MusicBridge, createMusicPlayer, loadMusic, musicScene, type MusicAppState } from './musicBridge.ts';
import { MUSIC_RULES, type MusicCommand } from './musicDirector.ts';

const run = (overrides: Partial<NonNullable<MusicAppState['snapshot']>> = {}): NonNullable<MusicAppState['snapshot']> => ({
  runMode: 'campaign', chapter: 2, lookChapter: 2, nextLookChapter: null, stageKind: 'normal', enemyCount: 0, enemyCap: 100, elapsed: 0, ...overrides,
});
const state = (overrides: Partial<MusicAppState> = {}): MusicAppState => ({ phase: 'menu', story: null, paused: false, draft: null, snapshot: null, ...overrides });

test('AUD-03: the app state names the music scene; story covers every phase, and a run waits for its first snapshot', () => {
  assert.deepEqual(musicScene(state()), { kind: 'menu' });
  assert.deepEqual(musicScene(state({ story: ['intro-2'] })), { kind: 'story', beat: 'intro-2' });
  assert.deepEqual(musicScene(state({ phase: 'roundClear', story: ['outro-5', 'ending'] })), { kind: 'story', beat: 'ending' });
  assert.deepEqual(musicScene(state({ phase: 'roundClear' })), { kind: 'settlement', cleared: true });
  assert.deepEqual(musicScene(state({ phase: 'gameOver' })), { kind: 'settlement', cleared: false });
  assert.equal(musicScene(state({ phase: 'playing' })), null);
  assert.deepEqual(musicScene(state({ phase: 'draft', snapshot: run({ stageKind: 'midBoss' }) })), { kind: 'run', mode: 'campaign', chapter: 2, stageKind: 'midBoss' });
  // An infinite run follows the chapter it looks like; its round bosses never make it a boss stage.
  assert.deepEqual(musicScene(state({ phase: 'playing', snapshot: run({ runMode: 'infinite', chapter: 1, lookChapter: 4, stageKind: 'midBoss' }) })), { kind: 'run', mode: 'infinite', chapter: 4, stageKind: 'normal' });
});

test('AUD-03: the bridge carries scenes, overlays, snapshots, and events to the mixer as commands', () => {
  const sent: MusicCommand[] = [];
  const bridge = new MusicBridge({ music: (command) => sent.push(command) });
  const take = () => sent.splice(0);
  bridge.app(state());
  assert.deepEqual(take(), [{ type: 'play', track: 'menu', fade: MUSIC_RULES.menuFadeIn, crossfade: false, resume: true }]);
  bridge.app(state({ phase: 'playing' }));
  assert.deepEqual(take(), [], 'the menu holds until the run sends a snapshot');
  bridge.app(state({ phase: 'playing', snapshot: run() }));
  assert.deepEqual(take().map((command) => command.type), ['stop', 'play']);
  bridge.app(state({ phase: 'playing', paused: true, snapshot: run() }));
  assert.deepEqual(take().map((command) => command.type), ['duck', 'lowpass']);
  bridge.app(state({ phase: 'playing', snapshot: run() }));
  take();
  // The crowd holds above 55% of the cap for 2 s of run time: the dense stem comes in.
  bridge.app(state({ phase: 'playing', snapshot: run({ enemyCount: 60, elapsed: 10 }) }));
  bridge.app(state({ phase: 'playing', snapshot: run({ enemyCount: 60, elapsed: 12 }) }));
  assert.deepEqual(take(), [{ type: 'stem', stem: 'dense', db: 0 }]);
  bridge.app(state({ phase: 'draft', draft: 'level', snapshot: run({ enemyCount: 60, elapsed: 12 }) }));
  assert.deepEqual(take(), [{ type: 'duck', id: 'draft', db: MUSIC_RULES.draftDuckDb, seconds: MUSIC_RULES.draftDuckSeconds }]);
  bridge.app(state({ phase: 'playing', snapshot: run({ enemyCount: 60, elapsed: 13 }) }));
  take();
  bridge.event({ type: 'player/died', source: 'unknown', bossEnraged: false });
  assert.deepEqual(take(), [{ type: 'stop', fade: 0.7, remember: false, tape: true }]);
  bridge.app(state({ phase: 'gameOver', snapshot: run({ enemyCount: 60, elapsed: 13 }) }));
  assert.deepEqual(take(), [{ type: 'stem', stem: 'dense', db: null }], 'the run ends with its stems');
});

test('AUD-03: the music pack loads into the mixer, and a missing or malformed one leaves the music silent', async () => {
  const given: unknown[] = [];
  const mixer = { setMusic: (...args: unknown[]) => given.push(args), music: () => undefined };
  assert.equal(await loadMusic(mixer, async () => null), null);
  assert.equal(await loadMusic(mixer, async () => ({ id: 'x' })), null);
  assert.equal(await loadMusic(mixer, async () => { throw new Error('offline'); }), null);
  assert.equal(given.length, 0);
  const pack = { id: 'music-r4', base: 'assets/packs/music/', tracks: {} };
  assert.ok(await loadMusic(mixer, async (url) => (url === 'assets/packs/music/pack.json' ? pack : null)) instanceof MusicBridge);
  assert.deepEqual(given, [[pack, createMusicPlayer]]);
});

test('AUD-03: a boss stage\'s boss arrives as the engine starts the stage, before the app shows the run, and still brings its track', () => {
  const sent: MusicCommand[] = [];
  const bridge = new MusicBridge({ music: (command) => sent.push(command) });
  bridge.app(state());
  sent.length = 0;
  bridge.event({ type: 'boss/spawned', x: 0, y: 0, infinite: false });
  assert.equal(sent.length, 0, 'held until the run scene');
  bridge.app(state({ phase: 'playing', snapshot: run({ chapter: 1, lookChapter: 1, stageKind: 'midBoss', bossId: 'butcher', bossPhase: 1, bossEnrage: 0 }) }));
  assert.deepEqual(sent, [
    { type: 'stop', fade: MUSIC_RULES.menuFadeOut, remember: true },
    { type: 'preload', tracks: ['boss-mid'] },
    { type: 'play', track: 'boss-mid', fade: MUSIC_RULES.bossFadeIn, crossfade: false, resume: false },
  ]);
  // Events from before a settlement never reach the next run.
  sent.length = 0;
  bridge.app(state({ phase: 'gameOver' }));
  bridge.event({ type: 'boss/spawned', x: 0, y: 0, infinite: false });
  bridge.app(state());
  bridge.app(state({ phase: 'playing', snapshot: run({ elapsed: 1 }) }));
  assert.ok(!sent.some((command) => command.type === 'stem'), 'no dense stem from a stale boss');
});
