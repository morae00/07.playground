import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './assets/atlasManifest.generated.ts';
import type { AtlasManifest } from './assets/spriteAtlas.ts';
import { signalFamily } from './palette.ts';
import { boltPoints, jit, stitchDash, threadAlpha, tokenColor, type SkillSpec, type Token } from './skillVfx.ts';

const manifest = ATLAS_MANIFEST as unknown as AtlasManifest;
const data = manifest.skillVfx!;
const spec = data.spec as unknown as SkillSpec;

test('FX-06: the bake carries the kit SPEC and a rule for every skill stamp, and no Korean text', () => {
  assert.ok(data, 'the manifest has skillVfx data');
  const pack = manifest.packs.skills;
  assert.ok(pack, 'the skill stamps have their own pack');
  for (const [group, parts] of Object.entries(data.parts)) {
    const animation = manifest.animations[`skill/${group}`];
    for (const [part, rule] of Object.entries(parts)) {
      assert.ok(animation?.[part], `skill/${group}/${part} is animated`);
      for (let frame = 0; frame < animation[part].frames; frame += 1) assert.ok(pack.frames[`skill/${group}/${part}/${frame}`], `skill/${group}/${part}/${frame} is baked`);
      assert.equal(rule.drive === 'loop', animation[part].fps > 0, `${group}/${part} loops on the clock only when it is a loop`);
    }
  }
  assert.equal(Object.keys(pack.frames).length, 188);
  assert.doesNotMatch(JSON.stringify(data), /[가-힣]/);
});

test('FX-06: SPEC colours are palette tokens of the ally or neutral families only (V2)', () => {
  const tokens = new Set<string>();
  JSON.stringify(spec, (key, value) => {
    if (Array.isArray(value) && typeof value[0] === 'string' && typeof value[1] === 'number') tokens.add(value[0]);
    if ((key === 'token' || key === 'fill') && typeof value === 'string') tokens.add(value);
    return value;
  });
  assert.ok(tokens.size >= 5);
  for (const token of tokens) {
    const colour = tokenColor(token as Token);
    assert.ok(colour, `${token} is a palette token`);
    assert.ok([null, 'ally'].includes(signalFamily(colour)), `${token} reads as ${signalFamily(colour)}`);
  }
});

test('FX-06: stitches fit a whole number round any circle, and a thread ring holds, then fades', () => {
  for (const radius of [30, 78, 146, 228]) {
    const [dash, gap] = stitchDash(spec, radius);
    const count = (Math.PI * 2 * radius) / (dash + gap);
    assert.ok(Math.abs(count - Math.round(count)) < 1e-9, `r ${radius}: ${count} stitches`);
    assert.ok(Math.abs(dash / gap - spec.stitch.dash[0] / spec.stitch.dash[1]) < 1e-9, 'the dash keeps its proportion');
  }
  const [, wider] = stitchDash(spec, 146, 2);
  assert.ok(wider > stitchDash(spec, 146)[1] * 1.5, 'unravelling opens the gaps');
  assert.equal(threadAlpha(spec, 0), 1);
  assert.equal(threadAlpha(spec, spec.thread.seconds * (1 - spec.thread.fade)), 1);
  assert.equal(threadAlpha(spec, spec.thread.seconds), 0);
});

test('FX-07: the white chain keeps every jump point and kinks in between, the same for the same seed', () => {
  const points = [{ x: 0, y: 0 }, { x: 90, y: 30 }, { x: 180, y: -30 }];
  const bolt = boltPoints(spec, points, spec.bolt.seeds[0]);
  for (const point of points) assert.ok(bolt.some((kink) => kink.x === point.x && kink.y === point.y), `${point.x},${point.y} stays on the bolt`);
  assert.ok(bolt.length > points.length + 2);
  assert.deepEqual(boltPoints(spec, points, spec.bolt.seeds[0]), bolt);
  assert.notDeepEqual(boltPoints(spec, points, spec.bolt.seeds[1]), bolt);
  assert.equal(jit(11, 64), jit(11, 64));
  assert.ok(jit(11, 64) >= 0 && jit(11, 64) < 1);
});
