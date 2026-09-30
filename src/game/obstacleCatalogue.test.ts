import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ATLAS_MANIFEST } from './render/assets/atlasManifest.generated.ts';
import { OBSTACLE_CATALOGUE } from './obstacleCatalogue.ts';

// ART-05: the engine's footprints are the ones the kit modules were baked at, and every module has a frame.
test('every catalogue footprint matches the bake spec and has a baked kit module', () => {
  const spec = readFileSync(new URL('../../art/atlas-spec.mjs', import.meta.url), 'utf8');
  const frames = ATLAS_MANIFEST.packs['chapter-01'].frames as Record<string, unknown>;
  for (const [chapter, kinds] of Object.entries(OBSTACLE_CATALOGUE)) {
    for (const [kind, modules] of Object.entries(kinds)) {
      const block = new RegExp(`${kind}: Object\\.freeze\\(\\[([^\\n]*)\\]\\)`).exec(spec)?.[1] ?? '';
      const baked = [...block.matchAll(/\['\w+', (\d+), (\d+)\]/g)].map((match) => [Number(match[1]), Number(match[2])]);
      assert.deepEqual(modules.map(([w, h]) => [w, h]), baked, `Ch${chapter} ${kind} footprints`);
      modules.forEach((_, index) => assert.ok(frames[`env/${chapter}/${kind}${index}/0`], `Ch${chapter} ${kind}${index} is baked`));
    }
  }
  assert.ok(frames['env/1/boundary/0'], 'the Ch1 edge strip is baked');
  assert.deepEqual(ATLAS_MANIFEST.packs['chapter-01'].ground, { file: 'assets/packs/chapter-01/ground-0.webp', size: 512 });
});
