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
    });
    assert.ok(recorder.calls.length > 20, `${id} should emit a complete silhouette`);
    fingerprints.add(recorder.calls.join('|'));
    recorder.reset();
  }

  assert.equal(fingerprints.size, 15);
});

test('renderer preserves core signals while reducing decorative density', () => {
  const recorder = createRecordingContext();
  const renderer = new GameRenderer();
  renderer.beginFrame(frame(3, 12));
  renderer.drawEnemy(recorder.context, {
    id: 2,
    x: 0,
    y: 0,
    vx: 1,
    vy: 0,
    radius: 20,
    tier: 'medium',
    variant: 1,
    isBoss: false,
    attackStyle: 'ranged',
    hitFlash: 0,
    bossPhase: 1,
    legacyBoss: false,
  });
  const fullCommands = recorder.calls.length;

  recorder.reset();
  renderer.beginFrame(frame(3, 180));
  renderer.drawEnemy(recorder.context, {
    id: 2,
    x: 0,
    y: 0,
    vx: 1,
    vy: 0,
    radius: 20,
    tier: 'medium',
    variant: 1,
    isBoss: false,
    attackStyle: 'ranged',
    hitFlash: 0,
    bossPhase: 1,
    legacyBoss: false,
  });
  const minimalCommands = recorder.calls.length;

  assert.ok(minimalCommands > 12, 'minimal detail must keep the combat silhouette and ranged core');
  assert.ok(minimalCommands < fullCommands, 'minimal detail should remove decorative draw commands');
});

test('player and clone share a readable silhouette with different signal strength', () => {
  const recorder = createRecordingContext();
  const renderer = new GameRenderer();
  renderer.beginFrame(frame(1));
  renderer.drawPlayer(recorder.context, {
    x: 0,
    y: 0,
    aimAngle: 0,
    moving: true,
    shield: 1,
    silence: 0,
  });
  const playerCommands = recorder.calls.length;

  recorder.reset();
  renderer.drawMirrorClone(recorder.context, {
    x: 0,
    y: 0,
    aimAngle: 0,
    moving: true,
    shield: 0,
    silence: 0,
    alpha: 0.35,
  });
  const cloneLog = recorder.calls.join('|');

  assert.ok(playerCommands > 30);
  assert.match(cloneLog, /globalAlpha/);
  assert.match(cloneLog, /setLineDash/);
});
