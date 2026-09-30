import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './render/assets/atlasManifest.generated.ts';
import { OBSTACLE_CATALOGUE } from './obstacleCatalogue.ts';

type BakeSpec = { OBSTACLE_CATALOGUE: Record<string, Record<string, readonly (readonly [string, number, number])[]>> };
type Pack = { frames: Record<string, unknown>; ground?: unknown };

// ART-05, ART-07: the engine's footprints are the ones the kit modules were baked at, and every module, the edge
// strip, and the ground tile are in the chapter's pack.
test('every catalogue footprint matches the bake spec and has a baked kit module', async () => {
  const spec = (await import(new URL('../../art/atlas-spec.mjs', import.meta.url).href)) as BakeSpec;
  assert.deepEqual(Object.keys(OBSTACLE_CATALOGUE), Object.keys(spec.OBSTACLE_CATALOGUE), 'the same chapters');
  for (const [chapter, kinds] of Object.entries(OBSTACLE_CATALOGUE)) {
    const name = `chapter-${chapter.padStart(2, '0')}`;
    const pack = (ATLAS_MANIFEST.packs as unknown as Record<string, Pack>)[name];
    assert.ok(pack, `${name} is baked`);
    for (const [kind, modules] of Object.entries(kinds)) {
      const baked = spec.OBSTACLE_CATALOGUE[chapter][kind].map(([, w, d]) => [w, d]);
      assert.deepEqual(modules.map(([w, h]) => [w, h]), baked, `Ch${chapter} ${kind} footprints`);
      modules.forEach((_, index) => assert.ok(pack.frames[`env/${chapter}/${kind}${index}/0`], `Ch${chapter} ${kind}${index} is baked`));
    }
    assert.ok(pack.frames[`env/${chapter}/boundary/0`], `the Ch${chapter} edge strip is baked`);
    assert.deepEqual(pack.ground, { file: `assets/packs/${name}/ground-0.webp`, size: 512 });
  }
});

test('solid obstacles share one set of footprints in every chapter (ART-07)', () => {
  const solids = Object.values(OBSTACLE_CATALOGUE).map((kinds) => JSON.stringify(kinds.solid));
  assert.equal(new Set(solids).size, 1, 'obstacle geometry stays the same across chapters');
});
