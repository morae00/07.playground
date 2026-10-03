import assert from 'node:assert/strict';
import test from 'node:test';
import { MUSIC_RULES, MusicDirector } from './musicDirector.ts';

const kill = (isBoss: boolean) => ({ type: 'enemy/killed', x: 0, y: 0, isBoss, radius: 10, tier: 'small', attackStyle: 'contact', dx: 0, dy: 0 }) as const;
const spawned = { type: 'boss/spawned', x: 0, y: 0, infinite: false } as const;
const phase = (n: number) => ({ type: 'boss/phase', x: 0, y: 0, phase: n, chapter: 1 }) as const;
const enraged = { type: 'boss/enraged', x: 0, y: 0 } as const;
const snapshot = (enemyCount: number, nextLookChapter: number | null = null) => ({ enemyCount, enemyCap: 100, lookChapter: 1, nextLookChapter });

test('AUD-03: the menu plays its track, and a run fades it for the chapter track', () => {
  const director = new MusicDirector();
  director.setScene({ kind: 'menu' });
  assert.deepEqual(director.drain(), [{ type: 'play', track: 'menu', fade: MUSIC_RULES.menuFadeIn, crossfade: false, resume: true }]);
  director.setScene({ kind: 'run', mode: 'campaign', chapter: 2, stageKind: 'normal' });
  assert.deepEqual(director.drain(), [
    { type: 'stop', fade: MUSIC_RULES.menuFadeOut, remember: true },
    { type: 'play', track: 'ch2', fade: MUSIC_RULES.runFadeIn, crossfade: false, resume: true },
  ]);
  director.setScene({ kind: 'settlement', cleared: true });
  assert.deepEqual(director.drain(), [{ type: 'stop', fade: MUSIC_RULES.clearFadeOut, remember: true }], 'a clear keeps its place for the next stage');
  director.setScene({ kind: 'menu' });
  assert.deepEqual(director.drain(), [{ type: 'play', track: 'menu', fade: MUSIC_RULES.menuResumeFadeIn, crossfade: false, resume: true }]);
});

test('AUD-03: a boss stage waits for its boss, which crossfades in its track; phases raise the stem, the first enrage stings once, and the kill cuts', () => {
  const director = new MusicDirector();
  director.setScene({ kind: 'run', mode: 'campaign', chapter: 1, stageKind: 'finalBoss' });
  assert.deepEqual(director.drain(), [{ type: 'preload', tracks: ['boss-final'] }], 'no chapter track on a boss stage');
  director.onEvent(spawned, 1);
  assert.deepEqual(director.drain(), [{ type: 'play', track: 'boss-final', fade: MUSIC_RULES.bossFadeIn, crossfade: false, resume: false }]);
  director.onEvent(phase(2), 2);
  assert.deepEqual(director.drain(), [
    { type: 'stem', stem: 'phase', db: -6 },
    { type: 'duck', id: 'phase', db: -4, seconds: 0.05, hold: 0.45, release: 0.3 },
  ]);
  director.onEvent(phase(3), 3);
  assert.deepEqual(director.drain()[0], { type: 'stem', stem: 'phase', db: 0 });
  director.onEvent(enraged, 4);
  assert.deepEqual(director.drain()[0], { type: 'sting' });
  director.onEvent(enraged, 34);
  assert.deepEqual(director.drain(), [], 'later steps and the overtime keep to the sound effect');
  director.onEvent(kill(false), 35);
  assert.deepEqual(director.drain(), []);
  director.onEvent(kill(true), 36);
  assert.deepEqual(director.drain(), [{ type: 'stop', fade: MUSIC_RULES.bossKillFade, remember: false }]);
  director.setScene({ kind: 'settlement', cleared: true });
  assert.deepEqual(director.drain(), [{ type: 'stem', stem: 'phase', db: null }], 'the next boss track starts without the stem');
});

test('AUD-03: the dense stem follows the crowd with 2 s and 6 s holds, and bosses on normal stages hold it', () => {
  const director = new MusicDirector();
  director.setScene({ kind: 'run', mode: 'campaign', chapter: 1, stageKind: 'normal' });
  director.drain();
  director.onSnapshot(snapshot(60), 10);
  director.onSnapshot(snapshot(60), 11.9);
  assert.deepEqual(director.drain(), [], 'not before 2 s above 0.55');
  director.onSnapshot(snapshot(60), 12);
  assert.deepEqual(director.drain(), [{ type: 'stem', stem: 'dense', db: 0 }]);
  director.onSnapshot(snapshot(45), 13);
  director.onSnapshot(snapshot(30), 14);
  director.onSnapshot(snapshot(30), 19.9);
  assert.deepEqual(director.drain(), [], 'between the thresholds nothing changes, and below needs 6 s');
  director.onSnapshot(snapshot(30), 20);
  assert.deepEqual(director.drain(), [{ type: 'stem', stem: 'dense', db: null }]);
  director.onEvent(spawned, 21);
  assert.deepEqual(director.drain(), [{ type: 'stem', stem: 'dense', db: 0 }], 'a field boss raises it whatever the crowd');
  director.onSnapshot(snapshot(10), 22);
  director.onSnapshot(snapshot(10), 40);
  assert.deepEqual(director.drain(), [], 'held while the field boss lives');
  director.onEvent(kill(true), 41);
  director.onSnapshot(snapshot(10), 44);
  assert.deepEqual(director.drain(), [], 'and for 4 s after it falls');
  director.onSnapshot(snapshot(10), 45.1);
  assert.deepEqual(director.drain(), [{ type: 'stem', stem: 'dense', db: null }]);
});

test('AUD-03: an infinite run keeps chapter tracks, decodes the next one ahead, and crossfades on the turn', () => {
  const director = new MusicDirector();
  director.setScene({ kind: 'run', mode: 'infinite', chapter: 1, stageKind: 'normal' });
  assert.deepEqual(director.drain(), [{ type: 'play', track: 'ch1', fade: MUSIC_RULES.runFadeIn, crossfade: false, resume: true }]);
  director.onEvent({ ...spawned, infinite: true }, 5);
  assert.deepEqual(director.drain(), [{ type: 'stem', stem: 'dense', db: 0 }], 'round bosses get the dense stem, not a boss track');
  director.onSnapshot(snapshot(10, 2), 280);
  director.onSnapshot(snapshot(10, 2), 281);
  assert.deepEqual(director.drain(), [{ type: 'preload', tracks: ['ch2'] }], 'once');
  director.setScene({ kind: 'run', mode: 'infinite', chapter: 2, stageKind: 'normal' });
  assert.deepEqual(director.drain(), [{ type: 'play', track: 'ch2', fade: MUSIC_RULES.chapterTurnCrossfade, crossfade: true, resume: false }]);
});

test('AUD-03: pause ducks and filters, level drafts duck lightly, and a defeat stops the tape', () => {
  const director = new MusicDirector();
  director.setScene({ kind: 'run', mode: 'campaign', chapter: 1, stageKind: 'normal' });
  director.drain();
  director.setOverlays({ paused: true, draft: null });
  assert.deepEqual(director.drain(), [
    { type: 'duck', id: 'pause', db: -8, seconds: 0.3 },
    { type: 'lowpass', hz: 1500, seconds: 0.3 },
  ]);
  director.setOverlays({ paused: false, draft: 'level' });
  assert.deepEqual(director.drain(), [
    { type: 'duck', id: 'pause', db: null, seconds: 0.3 },
    { type: 'lowpass', hz: null, seconds: 0.3 },
    { type: 'duck', id: 'draft', db: -4, seconds: 0.2 },
  ]);
  director.setOverlays({ paused: false, draft: null });
  assert.deepEqual(director.drain(), [{ type: 'duck', id: 'draft', db: null, seconds: 0.3 }]);
  director.onEvent({ type: 'player/died', source: 'contact', bossEnraged: false }, 90);
  assert.deepEqual(director.drain(), [{ type: 'stop', fade: 0.7, remember: false, tape: true }]);
  director.setScene({ kind: 'settlement', cleared: false });
  assert.deepEqual(director.drain(), [], 'the tape stop already ended the track');
});

test('AUD-03: the prologue ducks the menu track, and the ending plays over the last panels and fades at the settlement', () => {
  const director = new MusicDirector();
  director.setScene({ kind: 'menu' });
  director.drain();
  director.setScene({ kind: 'story', beat: 'prologue' });
  assert.deepEqual(director.drain(), [{ type: 'duck', id: 'story', db: -6, seconds: 1 }]);
  director.setScene({ kind: 'menu' });
  assert.deepEqual(director.drain(), [{ type: 'duck', id: 'story', db: null, seconds: MUSIC_RULES.menuResumeFadeIn }], 'back from the prologue the menu track only comes up');
  director.setScene({ kind: 'story', beat: 'prologue' });
  director.drain();
  director.setScene({ kind: 'run', mode: 'campaign', chapter: 1, stageKind: 'normal' });
  assert.deepEqual(director.drain(), [
    { type: 'duck', id: 'story', db: null, seconds: 0.5 },
    { type: 'stop', fade: MUSIC_RULES.menuFadeOut, remember: true },
    { type: 'play', track: 'ch1', fade: MUSIC_RULES.runFadeIn, crossfade: false, resume: true },
  ]);
  director.setScene({ kind: 'story', beat: 'outro-5' });
  assert.deepEqual(director.drain(), [{ type: 'play', track: 'ending', fade: MUSIC_RULES.endingFadeIn, crossfade: false, resume: false }]);
  director.setScene({ kind: 'story', beat: 'ending' });
  assert.deepEqual(director.drain(), [], 'one ending across the outro and the ending panels');
  director.setScene({ kind: 'settlement', cleared: true });
  assert.deepEqual(director.drain(), [{ type: 'stop', fade: MUSIC_RULES.clearFadeOut, remember: false }]);
});

test('AUD-03: a resumed boss stage finds its standing boss in the snapshot: track, phase stem, and enrage without a sting', () => {
  const director = new MusicDirector();
  director.setScene({ kind: 'run', mode: 'campaign', chapter: 3, stageKind: 'finalBoss' });
  director.drain();
  director.onSnapshot({ ...snapshot(10), boss: { phase: 3, enraged: true } }, 40);
  assert.deepEqual(director.drain(), [
    { type: 'play', track: 'boss-final', fade: MUSIC_RULES.bossFadeIn, crossfade: false, resume: false },
    { type: 'stem', stem: 'phase', db: 0 },
  ]);
  director.onEvent(enraged, 41);
  director.onSnapshot({ ...snapshot(10), boss: { phase: 3, enraged: true } }, 41);
  assert.deepEqual(director.drain(), [], 'the enrage already happened: no sting, no second play');
  director.onEvent(kill(true), 42);
  director.onSnapshot({ ...snapshot(10), boss: { phase: 3, enraged: true } }, 42);
  assert.deepEqual(director.drain(), [{ type: 'stop', fade: MUSIC_RULES.bossKillFade, remember: false }], 'a felled boss does not come back from a late snapshot');
});
