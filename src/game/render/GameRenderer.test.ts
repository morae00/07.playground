import assert from 'node:assert/strict';
import test from 'node:test';
import { GameRenderer } from './GameRenderer.ts';
import { BOSS_ART } from './visualRegistry.ts';
import { createRenderFrameSnapshot } from './renderSnapshot.ts';

function createRecordingContext() {
  const calls: string[] = [];
  const target = {
    measureText: () => ({ width: 0 }),
  } as Record<PropertyKey, unknown>;
  const context = new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      return (...args: unknown[]) => {
        calls.push(`${String(property)}:${args.map((value) => (
          typeof value === 'number' ? value.toFixed(2) : String(value)
        )).join(',')}`);
      };
    },
    set(object, property, value) {
      object[property] = value;
      calls.push(`set:${String(property)}:${String(value)}`);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return {
    context,
    calls,
    reset() {
      calls.length = 0;
    },
  };
}

function frame(chapter: number, enemyCount = 1, reducedMotion = false) {
  return createRenderFrameSnapshot({
    chapter,
    elapsed: 4.25,
    alpha: 1,
    reducedMotion,
    aimAngle: 0.4,
    moving: true,
    bossEnraged: false,
    enemyCount,
  });
}

test('all fifteen boss profiles produce distinct code-rendered silhouettes', () => {
  const recorder = createRecordingContext();
  const renderer = new GameRenderer();
  const fingerprints = new Set<string>();

  for (const [id, profile] of Object.entries(BOSS_ART)) {
    renderer.beginFrame(frame(profile.chapter));
    renderer.drawEnemy(recorder.context, {
      id: 1,
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 48,
      tier: 'boss',
      variant: 0,
      isBoss: true,
      attackStyle: 'contact',
      hitFlash: 0,
      bossId: id,
      bossPattern: 'dash',
      bossPhase: 1,
      legacyBoss: false,
      heading: 0,
    });
    assert.ok(recorder.calls.length > 20, `${id} should emit a complete silhouette`);
    fingerprints.add(recorder.calls.join('|'));
    recorder.reset();
  }

  assert.equal(fingerprints.size, 15);
});

const mob = (overrides: Record<string, unknown> = {}) => ({
  id: 2, x: 0, y: 0, vx: 1, vy: 0, radius: 20, tier: 'medium' as const, variant: 1, isBoss: false,
  attackStyle: 'ranged' as const, hitFlash: 0, bossPhase: 1 as const, legacyBoss: false, heading: 0, ...overrides,
});

test('an enemy without its sprite is the hit circle with the hostile rim and its role glyph (TEC-10)', () => {
  const recorder = createRecordingContext();
  const renderer = new GameRenderer();
  renderer.beginFrame(frame(3, 12));
  renderer.drawEnemy(recorder.context, mob());
  const log = recorder.calls.join('|');
  assert.match(log, /arc:0\.00,0\.00,20\.00/, 'the body is the hit circle');
  assert.match(log, /set:strokeStyle:#ef5b4f/, 'in the hostile rim');
  assert.match(log, /set:fillStyle:#101312.*set:fillStyle:#fffff8/, 'an ink body with a paper glyph');
  assert.ok(recorder.calls.length < 40, `one silhouette, not a drawing (${recorder.calls.length} commands)`);

  recorder.reset();
  renderer.drawEnemy(recorder.context, mob({ hitFlash: 0.05 }));
  assert.match(recorder.calls.join('|'), /set:fillStyle:#fffff8.*set:fillStyle:#101312/, 'a hit flashes the body paper with an ink glyph');

  const glyphs = new Set();
  for (const [tier, attackStyle] of [['small', 'contact'], ['medium', 'contact'], ['medium', 'ranged'], ['large', 'contact']]) {
    recorder.reset();
    renderer.drawEnemy(recorder.context, mob({ tier, attackStyle }));
    glyphs.add(recorder.calls.filter((call) => /^(moveTo|lineTo|rect):/.test(call)).join('|'));
  }
  assert.equal(glyphs.size, 4, 'each role keeps its own glyph');
});

test('player and clone share one silhouette, the clone faint and dashed (TEC-10)', () => {
  const recorder = createRecordingContext();
  const renderer = new GameRenderer();
  renderer.beginFrame(frame(1));
  renderer.drawPlayer(recorder.context, { x: 0, y: 0, aimAngle: 0, moving: true, shield: 1 });
  const playerLog = recorder.calls.join('|');
  assert.match(playerLog, /arc:0\.00,0\.00,20\.00/, 'the hero disc');
  assert.match(playerLog, /set:strokeStyle:#00a8c6/, 'in the ally rim');
  assert.match(playerLog, /arc:0\.00,0\.00,32\.00/, 'a shield adds the outer ring');

  recorder.reset();
  renderer.drawMirrorClone(recorder.context, { x: 0, y: 0, aimAngle: 0, moving: true, shield: 0, alpha: 0.35 });
  const cloneLog = recorder.calls.join('|');
  assert.match(cloneLog, /globalAlpha/);
  assert.match(cloneLog, /setLineDash/);
  assert.doesNotMatch(cloneLog, /arc:0\.00,0\.00,32\.00/, 'no shield ring without a shield');
});

test('player x-ray keyline redraws the silhouette and hit circle above covering bodies (BUG-12)', () => {
  const recorder = createRecordingContext();
  const renderer = new GameRenderer();
  renderer.beginFrame(frame(1));
  renderer.drawPlayerXray(recorder.context, { x: 40, y: 60, hitRadius: 15 });
  const log = recorder.calls.join('|');
  assert.match(log, /translate:40\.00,60\.00/);
  assert.match(log, /set:strokeStyle:#00a8c6/);
  assert.match(log, /arc:0\.00,0\.00,15\.00/, 'the hit circle is drawn at the true contact radius');
  assert.equal(recorder.calls.filter((call) => call.startsWith('fill:') || call === 'fill:').length, 0, 'the keyline never fills over the scene');
});

test('damage numbers start fully opaque whatever their lifetime (BUG-15)', () => {
  const recorder = createRecordingContext();
  const renderer = new GameRenderer();
  renderer.beginFrame(frame(1));
  renderer.drawDamageNumber(recorder.context, { x: 0, y: 0, value: 12, crit: false, life: 0.62, maxLife: 0.62, owner: 'player' });
  assert.ok(recorder.calls.includes('set:globalAlpha:1'), recorder.calls.filter((call) => call.includes('globalAlpha')).join(','));
});
