import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import CATALOG from '../content/data/catalog.ts';
import { beatsAfterClear, beatsBeforeRun, chapterBeats, type StoryData } from './story.ts';

// Story beats (CON-06): the prologue, the chapter intros and outros, the ending, and the round bosses' phase lines.
const story = JSON.parse(readFileSync(new URL('../../public/assets/content/story.json', import.meta.url), 'utf8')) as StoryData;
type ArtSpec = { STORY_PANEL: { size: [number, number] }; STORY_PANELS: Record<string, unknown> };
const { STORY_PANEL, STORY_PANELS } = (await import(new URL('../../art/ui-art-spec.mjs', import.meta.url).href)) as ArtSpec;
const clear = (chapter: number, stage: number, extra: object = {}) => ({ runMode: 'campaign', cleared: true, practice: false, chapter, stage, ...extra });

test('a beat plays before the first run of a chapter, and after its final stage, once', () => {
  assert.deepEqual(beatsBeforeRun([], 1), ['prologue']);
  assert.deepEqual(beatsBeforeRun(['prologue'], 1), []);
  assert.deepEqual(beatsBeforeRun(['prologue'], 3), ['intro-3']);
  assert.deepEqual(beatsAfterClear([], clear(2, 10)), ['outro-2']);
  assert.deepEqual(beatsAfterClear([], clear(5, 10)), ['outro-5', 'ending']);
  assert.deepEqual(beatsAfterClear(['outro-5'], clear(5, 10)), ['ending']);
  // A stage before the last, a defeat, practice, and the infinite run play nothing.
  assert.deepEqual(beatsAfterClear([], clear(2, 9)), []);
  assert.deepEqual(beatsAfterClear([], clear(2, 10, { cleared: false })), []);
  assert.deepEqual(beatsAfterClear([], clear(2, 10, { practice: true })), []);
  assert.deepEqual(beatsAfterClear([], clear(1, 5, { runMode: 'infinite' })), []);
  assert.deepEqual(chapterBeats(1), ['prologue', 'outro-1']);
  assert.deepEqual(chapterBeats(5), ['intro-5', 'outro-5', 'ending']);
});

test('every beat has its panels, and every panel its words and its baked art', () => {
  const beats = [1, 2, 3, 4, 5].flatMap((chapter) => chapterBeats(chapter));
  assert.deepEqual(Object.keys(story.beats).sort(), [...beats].sort());
  const arts = Object.values(story.beats).flatMap((panels) => panels!.map((panel) => panel.art));
  assert.deepEqual([...arts].sort(), Object.keys(STORY_PANELS).sort(), 'one panel to one baked scene');
  for (const [beat, panels] of Object.entries(story.beats)) {
    assert.ok(panels!.length > 0, beat);
    for (const panel of panels!) {
      assert.ok(panel.lines.length > 0 && panel.lines.every((line) => line.length > 0 && line.length <= 48), `${panel.art}: one or two short lines`);
      const file = new URL(`../../public/assets/packs/story/${panel.art}.webp`, import.meta.url);
      assert.ok(existsSync(file), `${panel.art} is baked`);
      const bytes = readFileSync(file);
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
  }
  // The intros and outros name their chapter; the ending's last panel looks ahead.
  for (let chapter = 2; chapter <= 5; chapter += 1) assert.equal(story.beats[`intro-${chapter}`]![0].chapter, chapter);
  for (let chapter = 1; chapter <= 5; chapter += 1) assert.equal(story.beats[`outro-${chapter}`]![0].chapter, chapter);
  assert.equal(story.beats.ending!.at(-1)!.next, true);
  assert.deepEqual(STORY_PANEL.size, [480, 270]);
});

test('each round boss has a line for its second and third phase', () => {
  const ids = CATALOG.roundBosses.map((boss) => boss.id);
  assert.deepEqual(Object.keys(story.phases).sort(), [...ids].sort());
  for (const id of ids) {
    for (const phase of ['2', '3'] as const) {
      const line = story.phases[id][phase];
      assert.ok(line && line.length <= 40, `${id} phase ${phase}: one line over the boss bar`);
    }
  }
});
