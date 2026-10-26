import assert from 'node:assert/strict';
import test from 'node:test';
import { logicalViewFrame } from '../viewPolicy.ts';
import { SpriteAtlas } from './assets/spriteAtlas.ts';
import { COMMON_PACK, FX_SLOT, HERO_SLOT } from './assets/slots.ts';
import { WorldRenderer, type RenderWorld } from './worldRenderer.ts';

type Call = { name: string; args: unknown[]; fillStyle: unknown; alpha: number };

/**
 * A 2D context that records every call with the fill style and alpha it was made under (save and restore keep both),
 * and answers what the renderer asks.
 */
function recordingContext() {
  const calls: Call[] = [];
  const gradients = new Set<object>();
  const state: Record<string | symbol, unknown> = { globalAlpha: 1 };
  const saved: Record<string | symbol, unknown>[] = [];
  const ctx = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'createRadialGradient' || key === 'createLinearGradient') {
        return () => {
          const gradient = { addColorStop() {} };
          gradients.add(gradient);
          return gradient;
        };
      }
      if (key === 'createPattern') return () => null;
      if (key === 'measureText') return (text: string) => ({ width: String(text).length * 7 });
      if (key === 'save') return () => saved.push({ ...target });
      if (key === 'restore') return () => Object.assign(target, saved.pop() ?? {});
      return (...args: unknown[]) => calls.push({ name: String(key), args, fillStyle: target.fillStyle, alpha: target.globalAlpha as number });
    },
    set(target, key, value) {
      target[key] = value;
      calls.push({ name: `${String(key)}=`, args: [value], fillStyle: target.fillStyle, alpha: target.globalAlpha as number });
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls, gradients };
}

type Overrides = { view?: [number, number]; player?: Record<string, unknown>; effects?: Record<string, unknown>; enemies?: unknown[]; options?: Record<string, unknown>; reducedMotion?: boolean; elapsed?: number };

/** A hand-built world (TEC-02): the hero at (1000, 1000) on chapter 1, nothing else unless asked. */
function worldOf({ view = [1440, 900], player = {}, effects = {}, enemies = [], options = {}, reducedMotion = false, elapsed = 1 }: Overrides = {}) {
  const frame = logicalViewFrame(view[0], view[1]);
  return {
    alpha: 1, view: { width: view[0], height: view[1], dpr: 1, frame }, worldSize: { width: 3200, height: 3200 }, chapter: 1, elapsed, paused: false,
    bossEnraged: false, jitterEveryFrame: false, airShots: true, reducedMotion,
    options: { reducedFlash: false, screenShake: false, healthBars: 'elite', damageNumbers: true, effects: 1, hitReaction: 1, ...options },
    camera: { x: 1000 - frame.width / 2, y: 1000 - frame.height / 2, prevX: 1000 - frame.width / 2, prevY: 1000 - frame.height / 2 },
    player: { x: 1000, y: 1000, prevX: 1000, prevY: 1000, hp: 100, shield: 0, silence: 0, root: 0, rootImmunity: 0, invuln: 0, burn: 0, ...player },
    aim: { angle: 0, targetId: null }, skills: {}, enemies, projectiles: [], bossProjectiles: [], pickups: [], hazards: [], zones: [], obstacles: [],
    beams: [], laneTelegraphs: [], chains: [], lobs: [], pending: [], coinFrenzy: 0, objectiveMarks: [],
    effects: {
      particles: [], damageNumbers: [], impactRings: [], blasts: [], shocks: [], skillMarks: [], corpses: [], hitStamps: [], recoils: [],
      shake: 0, playerHurt: 0, playerBurst: 0, playerCast: 0, hurtVignette: 0, hurtAngle: 0, lowHealth: false, deathMoment: 0, random: () => 0.5, ...effects,
    },
    cosmetics: { outline: null, trail: null }, character: 'gyeol',
  } as unknown as RenderWorld;
}

/** An atlas that counts the listeners subscribed and not yet unsubscribed. */
class CountingAtlas extends SpriteAtlas {
  listening = 0;

  onChange(listener: () => void) {
    const stop = super.onChange(listener);
    this.listening += 1;
    return () => {
      this.listening -= 1;
      return stop();
    };
  }
}

test('disposed renderers leave the app-lifetime atlas with no listeners (BUG-21)', () => {
  const atlas = new CountingAtlas();
  const renderers = Array.from({ length: 5 }, () => {
    const renderer = new WorldRenderer();
    renderer.setSprites(atlas);
    return renderer;
  });
  assert.equal(atlas.listening, 5, 'each run renderer listens for pack changes');
  for (const renderer of renderers) renderer.dispose();
  assert.equal(atlas.listening, 0, 'nothing keeps a finished run reachable from the atlas');
  renderers[0].dispose();
  assert.equal(atlas.listening, 0, 'a second dispose unsubscribes nothing twice');
});

test('a renderer listens to one atlas at a time', () => {
  const first = new CountingAtlas();
  const second = new CountingAtlas();
  const renderer = new WorldRenderer();
  renderer.setSprites(first);
  renderer.setSprites(second);
  assert.equal(first.listening, 0);
  assert.equal(second.listening, 1);
  renderer.setSprites(null);
  assert.equal(second.listening, 0);
});

test('BUG-27: the low-health, burn, and hurt glows fill the shown frame, inside letterbox bars (D-28)', () => {
  const glowFills = (view: [number, number]) => {
    const { ctx, calls, gradients } = recordingContext();
    new WorldRenderer().draw(ctx, worldOf({ view, player: { hp: 10, burn: 1 }, effects: { lowHealth: true, hurtVignette: 0.2, hurtAngle: 1 } }));
    return calls.filter((call) => call.name === 'fillRect' && gradients.has(call.fillStyle as object)).map((call) => call.args);
  };
  // 2560×1440 shows the 1920×1080 frame (1.2×) with bars 320 wide at the sides and 180 high above and below.
  const frame = logicalViewFrame(2560, 1440);
  assert.deepEqual([frame.offsetX, frame.offsetY, frame.width * frame.zoom, frame.height * frame.zoom], [320, 180, 1920, 1080]);
  assert.deepEqual(glowFills([2560, 1440]), [[320, 180, 1920, 1080], [320, 180, 1920, 1080], [320, 180, 1920, 1080]], 'low health, burn, and hurt');
  assert.deepEqual(glowFills([1440, 900]), [[0, 0, 1440, 900], [0, 0, 1440, 900], [0, 0, 1440, 900]], 'a 16:10 window has no bars');
  const square = logicalViewFrame(1000, 1000);
  assert.ok(square.offsetX < 1e-9 && square.offsetY === 125);
  assert.deepEqual(glowFills([1000, 1000]).at(0), [square.offsetX, 125, 1000 - square.offsetX * 2, 750], 'narrower than 4:3: bars above and below only');
});

/** An atlas with only these animations baked, in the common pack; like the real one it hands out one object per frame key. */
function bakedAtlas(animations: Record<string, Record<string, { frames: number; fps: number }>>) {
  const frames = new Map<string, unknown>();
  return {
    onChange: () => () => true,
    status: (pack: string) => (pack === COMMON_PACK ? 'ready' : 'idle'),
    animation: (slot: string, state: string) => animations[slot]?.[state],
    frame(key: string) {
      if (!Object.entries(animations).some(([slot, states]) => Object.keys(states).some((state) => key.startsWith(`${slot}/${state}/`)))) return undefined;
      if (!frames.has(key)) frames.set(key, { image: { key }, sx: 0, sy: 0, sw: 20, sh: 40, ax: 10, ay: 40, scale: 2 });
      return frames.get(key);
    },
    ground: () => undefined,
    bombers: () => undefined,
    skillVfx: () => undefined,
    hazards: () => undefined,
    arsenalFx: () => undefined,
  } as unknown as SpriteAtlas;
}

const imageKey = (call: Call) => (call.args[0] as { key?: string } | undefined)?.key ?? '';

test('FX-09: a headless renderer (no DOM) draws the floor grid as lines', () => {
  assert.equal(typeof (globalThis as { document?: unknown }).document, 'undefined');
  const { ctx, calls } = recordingContext();
  const renderer = new WorldRenderer();
  renderer.draw(ctx, worldOf());
  assert.equal(renderer.gridCacheBuilds, 0);
  assert.ok(calls.filter((call) => call.name === 'stroke').length > 10, 'grid lines');
});

test('FX-09: after a resumed run is settled, the enemies already there do not rise from a spawn bloom again', () => {
  const enemy = {
    id: 5, x: 1100, y: 1000, prevX: 1100, prevY: 1000, vx: 0, vy: 0, radius: 14, hp: 10, maxHp: 10, tier: 'small', variant: 0, isBoss: false,
    attackStyle: 'contact', rangedTelegraph: 0, hitFlash: 0, stun: 0, patternPhase: 'chase', patternX: 0, patternY: 0, bossPhase: 1,
  };
  const rises = (settle: boolean) => {
    const { ctx, calls } = recordingContext();
    const renderer = new WorldRenderer();
    if (settle) renderer.settle();
    renderer.draw(ctx, worldOf({ enemies: [enemy], elapsed: 300 }));
    renderer.draw(ctx, worldOf({ enemies: [enemy], elapsed: 300 }));
    return calls.filter((call) => call.name === 'globalAlpha=' && Math.abs((call.args[0] as number) - 0.35) < 1e-9).length;
  };
  assert.equal(rises(false), 2, 'a new enemy rises (FX-03), and holds while the run is paused');
  assert.equal(rises(true), 0);
});

test('FX-09: one hit star pose missing does not hide the other pose\'s stars', () => {
  const { ctx, calls } = recordingContext();
  const renderer = new WorldRenderer();
  renderer.setSprites(bakedAtlas({ [FX_SLOT]: { 'hit-crit': { frames: 3, fps: 12 } } }));
  const star = { x: 1000, y: 980, radius: 10, angle: 0, life: 0.1, maxLife: 0.12 };
  renderer.draw(ctx, worldOf({ effects: { hitStamps: [{ ...star, crit: false }, { ...star, crit: true }] } }));
  assert.deepEqual(calls.filter((call) => call.name === 'drawImage' && imageKey(call).startsWith(`${FX_SLOT}/`)).map(imageKey), [`${FX_SLOT}/hit-crit/0`]);
});

test('FX-09: the burning body\'s coral wash holds steady under reduced motion, as under reduced flash, when the hazard art is missing', () => {
  const canvases = new Set<object>();
  const global = globalThis as { document?: unknown };
  global.document = {
    createElement: () => {
      const canvas = { width: 0, height: 0, getContext: () => recordingContext().ctx };
      canvases.add(canvas);
      return canvas;
    },
  };
  try {
    const wash = (options: { reducedMotion?: boolean; reducedFlash?: boolean }, elapsed: number) => {
      const { ctx, calls } = recordingContext();
      const renderer = new WorldRenderer();
      renderer.setSprites(bakedAtlas({ [HERO_SLOT]: { idle: { frames: 1, fps: 1 } } }));
      renderer.draw(ctx, worldOf({ player: { burn: 1 }, elapsed, reducedMotion: options.reducedMotion, options: { reducedFlash: options.reducedFlash ?? false } }));
      // The coral cut-out: four rim stamps, then the body washed coral.
      const alphas = calls.filter((call) => call.name === 'drawImage' && canvases.has(call.args[0] as object)).map((call) => Math.round(call.alpha * 1000) / 1000);
      assert.deepEqual(alphas.slice(0, 4), [0.55, 0.55, 0.55, 0.55]);
      assert.equal(alphas.length, 5);
      return alphas[4];
    };
    assert.notEqual(wash({}, 1), wash({}, 1.05), 'it throbs at full motion');
    assert.deepEqual([wash({ reducedMotion: true }, 1), wash({ reducedMotion: true }, 1.05)], [0.5, 0.5]);
    assert.deepEqual([wash({ reducedFlash: true }, 1), wash({ reducedFlash: true }, 1.05)], [0.5, 0.5]);
  } finally {
    delete global.document;
  }
});
