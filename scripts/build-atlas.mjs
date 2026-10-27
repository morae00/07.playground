// Atlas baker (TEC-03): renders the concept-kit drawings listed in art/atlas-spec.mjs in Chromium at @2x,
// trims them, packs them into pages, and writes the PNG pages plus a generated TypeScript manifest.
// Usage: node scripts/build-atlas.mjs   (output is deterministic for the same kit, spec, and Chromium)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ARSENAL_FX_VECTORS, ATLAS_SCALE, BAKE_MARGIN, COLOR_MAP, ENEMY_ROLES, FRAME_PADDING, GROUND_TILE, HAZARD_RENDER, HAZARD_VECTORS, HERO_STATES, PACKS, PAGE_SIZE, SKILL_VFX_RENDER, SKILL_VFX_TIMING } from '../art/atlas-spec.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const kitDir = path.join(root, 'art/concept-kit');
const KIT_FILES = ['lib.js', 'k-hero.js', 'k-characters.js', 'k-skills-vfx.js', 'k-enemies.js', 'k-bombers.js', 'k-bosses1.js', 'k-bosses2.js', 'k-bosses3.js', 'k-bosses4.js', 'k-icons.js', 'k-icons2.js', 'k-arsenal-fx.js', 'k-env.js', 'k-hazards.js'];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  for (const file of KIT_FILES) await page.addScriptTag({ content: readFileSync(path.join(kitDir, file), 'utf8') });
  await page.evaluate(installBakeRecipes);

  const manifest = { version: 2, atlasScale: ATLAS_SCALE, packs: {}, animations: {} };
  for (const [packName, pack] of Object.entries(PACKS)) {
    const frames = await page.evaluate(renderFrames, { frames: pack.frames, scale: ATLAS_SCALE, margin: BAKE_MARGIN, colorMap: COLOR_MAP, roles: ENEMY_ROLES });
    const pages = packFrames(frames);
    const pagePaths = [];
    for (let index = 0; index < pages.length; index += 1) {
      const png = await page.evaluate(composePage, { placed: pages[index].placed, width: pages[index].width, height: pages[index].height });
      const relative = `${pack.page}-${index}.png`;
      const file = path.join(root, 'public', relative);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(png.split(',')[1], 'base64'));
      pagePaths.push(relative);
    }
    // Pages a pack no longer fills go, so the build does not ship them.
    for (let index = pages.length; existsSync(path.join(root, 'public', `${pack.page}-${index}.png`)); index += 1) rmSync(path.join(root, 'public', `${pack.page}-${index}.png`));
    const table = {};
    pages.forEach((sheet, pageIndex) => {
      for (const item of sheet.placed) table[item.key] = [pageIndex, item.x, item.y, item.w, item.h, item.ax, item.ay];
    });
    manifest.packs[packName] = { pages: pagePaths, frames: Object.fromEntries(Object.entries(table).sort(([a], [b]) => a.localeCompare(b))) };
    if (pack.ground) {
      // The chapter's seamless ground tile (ART-05), drawn as a repeating pattern in world space.
      const webp = await page.evaluate(renderGround, { call: pack.ground.call, size: GROUND_TILE, scale: ATLAS_SCALE, colorMap: COLOR_MAP });
      writeFileSync(path.join(root, 'public', pack.ground.file), Buffer.from(webp.split(',')[1], 'base64'));
      manifest.packs[packName].ground = { file: pack.ground.file, size: GROUND_TILE, ...(pack.ground.angle ? { angle: pack.ground.angle } : {}) };
    }
    for (const item of frames) if (item.animation) manifest.animations[item.animation.key] = item.animation.spec;
    // Pack animations add states to a slot (the Ch1 death and decal poses) rather than replace it.
    for (const [slot, states] of Object.entries(pack.animations ?? {})) manifest.animations[slot] = { ...manifest.animations[slot], ...states };
    console.log(`${packName}: ${frames.length} frames on ${pages.length} page(s): ${pages.map((sheet) => `${sheet.width}x${sheet.height}`).join(', ')}`);
  }
  manifest.animations.hero = Object.fromEntries(Object.entries(HERO_STATES).map(([state, spec]) => [state, spec]));
  // The skill VFX's shapes and part rules as data (FX-06, FX-07): the renderer reads its numbers from here.
  manifest.skillVfx = await page.evaluate(readSkillVfx, { timing: SKILL_VFX_TIMING, render: SKILL_VFX_RENDER });
  // K11: the terrain hazards' shapes, part rules, states, and the layout vectors their renderer port is tested against.
  manifest.hazards = await page.evaluate(readHazards, { vectors: HAZARD_VECTORS, render: HAZARD_RENDER });
  // K10: the weapons' field effects: their shapes, the drawn weapons' numbers, part rules, and the vectors their port is tested against.
  manifest.arsenalFx = await page.evaluate(readArsenalFx, ARSENAL_FX_VECTORS);
  // SYS-14 (K7): where the fuse bomber's wick ends in each frame (the same rig in every chapter), for the spark.
  manifest.bombers = await page.evaluate(() => {
    const { feet, displayScale, wick } = window.PN.bombers.meta(1, 'fuse');
    return { feet, displayScale, wick };
  });
  manifest.animations = Object.fromEntries(Object.entries(manifest.animations).sort(([a], [b]) => a.localeCompare(b)));
  // One line per frame keeps the generated file short and its diffs readable.
  const body = JSON.stringify(manifest, null, 2).replace(/\[\s+([-\d.,\s]+?)\s+\]/g, (_match, inner) => `[${inner.trim().split(/\s*,\s*/).join(', ')}]`);
  const source = `// Generated by scripts/build-atlas.mjs from art/atlas-spec.mjs and art/concept-kit. Do not edit.
// Frames: [page, x, y, w, h, anchorX, anchorY] in atlas pixels; atlasScale pixels = 1 world unit.
// Provenance: concept-kit drawings (AI-assisted concept art, provisional until hand-cleaned art replaces them).
export const ATLAS_MANIFEST = ${body} as const;
`;
  writeFileSync(path.join(root, 'src/game/render/assets/atlasManifest.generated.ts'), source);
  // The runtime fetches the same manifest as data (TEC-05: data stays out of the app JS budget).
  writeFileSync(path.join(root, 'public/assets/atlas/manifest.json'), `${JSON.stringify(manifest)}\n`);
  console.log(`enemy role fits: ${Object.entries(ENEMY_ROLES).map(([role, { fit }]) => `${role} ${fit.toFixed(3)}`).join(', ')}`);
} finally {
  await browser.close();
}

/**
 * Deterministic MaxRects packing (TEC-04): tallest first, then by key, each frame in the free space where it sits
 * highest, then leftmost. A page takes frames until no more fit; the last page takes the width that gives it the
 * smallest area.
 */
function packFrames(frames) {
  const order = [...frames].sort((a, b) => b.h - a.h || a.key.localeCompare(b.key)).map((frame) => {
    const w = frame.w + FRAME_PADDING * 2;
    const h = frame.h + FRAME_PADDING * 2;
    if (w > PAGE_SIZE || h > PAGE_SIZE) throw new Error(`${frame.key} is larger than a page`);
    return { frame, w, h };
  });
  const pages = [];
  for (let remaining = order; remaining.length > 0;) {
    let sheet = fillPage(remaining, PAGE_SIZE);
    for (let width = PAGE_SIZE - 4; sheet.rest.length === 0 && width >= 4; width -= 4) {
      const narrower = fillPage(remaining, width);
      if (narrower.rest.length > 0) break;
      if (narrower.width * narrower.height < sheet.width * sheet.height) sheet = narrower;
    }
    pages.push(sheet);
    remaining = sheet.rest;
  }
  return pages;
}

/** One page `width` wide and at most a page tall: the frames that fit, in order, and the rest. */
function fillPage(items, width) {
  let free = [{ x: 0, y: 0, w: width, h: PAGE_SIZE }];
  const sheet = { placed: [], rest: [], width: 0, height: 0 };
  for (const item of items) {
    let spot = null;
    for (const space of free) {
      if (item.w > space.w || item.h > space.h) continue;
      if (!spot || space.y < spot.y || (space.y === spot.y && space.x < spot.x)) spot = space;
    }
    if (!spot) {
      sheet.rest.push(item);
      continue;
    }
    const box = { x: spot.x, y: spot.y, w: item.w, h: item.h };
    sheet.placed.push({ ...item.frame, x: box.x + FRAME_PADDING, y: box.y + FRAME_PADDING });
    sheet.width = Math.max(sheet.width, box.x + box.w);
    sheet.height = Math.max(sheet.height, box.y + box.h);
    const split = [];
    for (const space of free) {
      if (box.x >= space.x + space.w || box.x + box.w <= space.x || box.y >= space.y + space.h || box.y + box.h <= space.y) {
        split.push(space);
        continue;
      }
      if (box.x > space.x) split.push({ x: space.x, y: space.y, w: box.x - space.x, h: space.h });
      if (box.x + box.w < space.x + space.w) split.push({ x: box.x + box.w, y: space.y, w: space.x + space.w - box.x - box.w, h: space.h });
      if (box.y > space.y) split.push({ x: space.x, y: space.y, w: space.w, h: box.y - space.y });
      if (box.y + box.h < space.y + space.h) split.push({ x: space.x, y: box.y + box.h, w: space.w, h: space.y + space.h - box.y - box.h });
    }
    // Drop spaces inside another (the first of two equal ones stays).
    free = split.filter((a, i) => !split.some((b, j) => j !== i && a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h
      && (j < i || a.x !== b.x || a.y !== b.y || a.w !== b.w || a.h !== b.h)));
  }
  sheet.width = Math.ceil(sheet.width / 4) * 4;
  sheet.height = Math.ceil(sheet.height / 4) * 4;
  return sheet;
}

// ---- browser side ----

/**
 * Drawings the kit has no call for, composed from its own parts. turnedSlabs is the Ch4 ground: E.ground draws Ch4's
 * cut slabs in a frame turned about the world origin, which cannot wrap, so this draws the same slab layer, decals,
 * and paper grain unturned with the wrap period (as E.ground does for the other chapters); the renderer turns the
 * repeating pattern.
 */
function installBakeRecipes() {
  const E = window.PN.env;
  window.bake = {
    /**
     * The kit's sheets are HTML, which keeps the first of a repeated attribute; an SVG image is XML and refuses the
     * whole drawing (the Ch4 stalker repeats stroke-linejoin). Tags with a repeat keep the first, as the sheets
     * showed them; every other tag is left as it is.
     */
    firstAttributes(markup) {
      return markup.replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")+)(\s*\/?)>/g, (tag, name, attributes, end) => {
        const seen = new Set();
        let repeated = false;
        const kept = attributes.replace(/\s+([\w:-]+)="[^"]*"/g, (attribute, key) => {
          if (!seen.has(key)) {
            seen.add(key);
            return attribute;
          }
          repeated = true;
          return '';
        });
        return repeated ? `<${name}${kept}${end}>` : tag;
      });
    },
    turnedSlabs(ch, size, seed) {
      const c = E.CH[ch];
      const p = E.uid();
      const rnd = E.rng(seed * 97 + ch);
      const defs = [`<clipPath id="${p}cl"><rect width="${size}" height="${size}"/></clipPath>`, E.grainDef(`${p}gr`, seed + ch), E.roughDef(`${p}rf`, 3, 0.04, seed), E.dotDefs(`${p}w`, E.mix(c.base, c.deep, 0.72), 5)];
      const period = [Math.max(1, Math.round(size / 280)), Math.max(2, 2 * Math.round(size / 240 / 2))];
      const cells = E.rectSlabs(-8, -8, size + 8, size + 8, { mw: size / period[0], mh: size / period[1], bias: 1.1, min: 58, maxD: 4, seed: seed * 19 + ch, period });
      let body = `<rect x="-2" y="-2" width="${size + 4}" height="${size + 4}" fill="${E.mix(c.base, c.deep, 0.55)}"/>`;
      body += E.slabLayer(c, cells, p, rnd, { wear: true, crackP: 0.16, round: 3 });
      body += E[`ch${ch}Decals`](c, size, size, rnd, p, { tile: true, center: null }, null);
      body += `<rect width="${size}" height="${size}" filter="url(#${p}gr)" opacity="0.055"/>`;
      return `<g class="pn-ground ch${ch}"><defs>${defs.join('')}</defs><g clip-path="url(#${p}cl)">${body}</g></g>`;
    },
  };
}

/** The kit's SPEC and each part's playback rules, checked: every timed part has its seconds, and no text is Korean. */
function readSkillVfx({ timing, render }) {
  const S = window.PN.skillVfx;
  const parts = {};
  for (const group of S.groups) {
    parts[group] = {};
    for (const p of S.parts(group)) {
      const base = p.part.replace(/-awakened$/, '').replace(/^shot-/, '');
      if (p.drive === 'prog' && !(base in timing)) throw new Error(`skill/${group}/${p.part} has no timing in SKILL_VFX_TIMING`);
      parts[group][p.part] = { drive: p.drive, rotate: p.rotate, layer: p.layer, lod: p.lod, still: p.still, flash: p.flash === true, seconds: p.drive === 'prog' ? timing[base] : null };
    }
  }
  // SYS-15 (K9): each arsenal weapon the kit has drawn is a group of its own, named by the weapon. Its parts carry a
  // Korean `window` note for review; only the playback fields travel.
  const A = window.PN.arsenal;
  for (const id of A.shots.filter((shotId) => A.META[shotId].done)) {
    parts[id] = {};
    for (const p of A.parts(id)) {
      const base = p.part.replace(/-awakened$/, '');
      if (p.drive === 'prog' && !(base in timing)) throw new Error(`skill/${id}/${p.part} has no timing in SKILL_VFX_TIMING`);
      parts[id][p.part] = { drive: p.drive, rotate: p.rotate, layer: p.layer, lod: p.lod, still: p.still, flash: p.flash === true, seconds: p.drive === 'prog' ? timing[base] : null };
    }
  }
  const data = { spec: S.SPEC, parts, render };
  const text = JSON.stringify(data);
  if (/[\uAC00-\uD7A3]/.test(text)) throw new Error('skill VFX data carries Korean text; strings belong in the string tables');
  return JSON.parse(text);
}

/**
 * K11 (API-hazards §3, §5, §8.13): the kit's SPEC, every part's playback rule and box, the states, and the C9 vectors
 * (layout items [part, x, y, flip, phase, z, prio] and ember slots [part, x, y, frame], rounded as C9 prints them).
 * The vectors come from the kit's own layout and its check helpers, so the renderer's TypeScript port is tested
 * against the kit itself. No text may be Korean.
 */
function readHazards({ vectors, render }) {
  const H = window.PN.hazards;
  const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
  const parts = {};
  for (const group of H.groups) {
    parts[group] = {};
    for (const { part, ...rule } of H.parts(group)) parts[group][part] = rule;
  }
  const layout = {};
  for (const [kind, r, seed, lod = 'full', ch = 1] of vectors.layout) {
    layout[`${kind}:${r}:${seed}${lod === 'full' ? '' : `:${lod}`}`] = H.layout(kind, r, seed, { lod, ch }).map((q) => [q.part, round(q.x, 2), round(q.y, 2), q.flip ? 1 : 0, round(q.phase, 3), q.z, q.prio]);
  }
  const slot = (q) => [q.part, round(q.x, 2), round(q.y, 2), q.frame];
  const embers = Object.fromEntries(vectors.embers.map(([r, seed, t]) => [`fire:${r}:${seed}:${t}`, H._.emberSlots(r, seed, t, 'full').map(slot)]));
  embers[`hero:${vectors.hero}`] = H._.heroEmberSlots(vectors.hero).map(slot);
  // Every paths() value is a list of lines [[x, y], …][] (API §8.6).
  const paths = Object.fromEntries(vectors.paths.map(([kind, r, seed]) => [`${kind}:${r}:${seed}`, Object.fromEntries(Object.entries(H.paths(kind, r, seed)).map(([name, lines]) => [name, lines.map((line) => line.map((p) => [round(p[0], 2), round(p[1], 2)]))]))]));
  const data = { version: H.version, spec: H.SPEC, parts, states: H.states, vectors: { layout, embers, paths }, render };
  const text = JSON.stringify(data);
  if (/[가-힣]/.test(text)) throw new Error('hazard data carries Korean text; strings belong in the string tables');
  return JSON.parse(text);
}

/**
 * K10 (API-arsenal-fx §3-§8): the kit's SPEC, the drawn weapons' META without their names, every part's rule, and the
 * C9 vectors from the kit's own layout(), paths(), and lobPath() (layout items [part, x, y, angle, flip, phase, prio, z],
 * points rounded as C9 prints them), so the renderer's TypeScript port is tested against the kit itself. No text may be
 * Korean.
 */
function readArsenalFx({ cases, lob }) {
  const X = window.PN.arsenalFx;
  const r = (value, places = 2) => Math.round(value * 10 ** places) / 10 ** places + 0;
  const parts = {};
  for (const group of X.groups) parts[group] = Object.fromEntries(X.parts(group).map(({ part, ...rule }) => [part, rule]));
  const meta = {};
  for (const id of X.ids) {
    const { kind, look, geo, main, stages, done } = X.META[id];
    if (stages.length) meta[id] = { kind, look, geo, main, stages, done };
  }
  const vectors = {
    cases: cases.filter(([id, stage]) => meta[id]?.stages.includes(stage)).map(([id, stage, opts]) => [id, stage, opts,
      X.layout(id, stage, opts).map((q) => [q.part, r(q.x), r(q.y), r(q.angle, 3), q.flip ? 1 : 0, r(q.phase, 3), q.prio, q.z]),
      Object.fromEntries(Object.entries(X.paths(id, stage, opts)).map(([name, pts]) => [name, pts.map((p) => [r(p[0]), r(p[1])])]))]),
    lob: Object.fromEntries(Object.keys(X.SPEC.lob).map((id) => [id, lob.t.map((t) => {
      const p = X.lobPath(id, { x0: 0, y0: 0, x1: lob.to[0], y1: lob.to[1], t });
      return [t, r(p.x), r(p.y), r(p.h), r(p.angle, 3), r(p.shadow.rx), r(p.shadow.alpha, 3)];
    })])),
    mini: lob.mini.map(([x1, y1]) => [x1, y1, lob.t.map((t) => {
      const p = X.lobPath('clusterPots', { x0: 0, y0: 0, x1, y1, t, mini: true });
      return [t, r(p.x), r(p.y), r(p.h), r(p.angle, 3), r(p.shadow.rx), r(p.shadow.alpha, 3)];
    })]),
  };
  const data = { version: X.SPEC.version, spec: X.SPEC, meta, parts, vectors };
  const text = JSON.stringify(data);
  if (/[\uAC00-\uD7A3]/.test(text)) throw new Error('arsenal fx data carries Korean text; strings belong in the string tables');
  return JSON.parse(text);
}

async function renderFrames({ frames, scale, margin, colorMap, roles }) {
  const expanded = [];
  for (const frame of frames) {
    if (frame.arsenalFx) {
      // K10: every stamp of every weapon group the kit has drawn (PN.arsenalFx.groups), anchored where it sits.
      const X = window.PN.arsenalFx;
      for (const group of X.groups) {
        const parts = X.parts(group);
        for (const p of parts) {
          for (let index = 0; index < p.frames; index += 1) {
            expanded.push({ key: `afx/${group}/${p.part}/${index}`, call: ['PN.arsenalFx.stamp', group, p.part, { frame: index }], box: p.box, anchor: p.anchor, scale: 1 });
          }
        }
        expanded.at(-1).animation = { key: `afx/${group}`, spec: Object.fromEntries(parts.map((p) => [p.part, { frames: p.frames, fps: p.drive === 'loop' ? p.fps : 0 }])) };
      }
      continue;
    }
    if (frame.hazards) {
      // K11: every stamp of every hazard group (PN.hazards.parts), anchored where it sits in the world.
      const H = window.PN.hazards;
      for (const group of H.groups) {
        const parts = H.parts(group);
        for (const p of parts) {
          for (let index = 0; index < p.frames; index += 1) {
            expanded.push({ key: `hazard/${group}/${p.part}/${index}`, call: ['PN.hazards.stamp', group, p.part, { frame: index }], box: p.box, anchor: p.anchor, scale: 1 });
          }
        }
        expanded.at(-1).animation = { key: `hazard/${group}`, spec: Object.fromEntries(parts.map((p) => [p.part, { frames: p.frames, fps: p.drive === 'loop' ? p.fps : 0 }])) };
      }
      continue;
    }
    if (frame.skillVfx) {
      // Every stamp of every skill group (PN.skillVfx.parts), anchored where it sits in the world.
      const S = window.PN.skillVfx;
      for (const group of S.groups) {
        const parts = S.parts(group);
        for (const p of parts) {
          for (let index = 0; index < p.frames; index += 1) {
            expanded.push({ key: `skill/${group}/${p.part}/${index}`, call: ['PN.skillVfx.stamp', group, p.part, { frame: index }], box: p.box, anchor: p.anchor, scale: 1 });
          }
        }
        expanded.at(-1).animation = { key: `skill/${group}`, spec: Object.fromEntries(parts.map((p) => [p.part, { frames: p.frames, fps: p.drive === 'loop' ? p.fps : 0 }])) };
      }
      // SYS-15 (K9): the shots of every arsenal weapon the kit has drawn (PN.arsenal META done), under the weapon's id.
      const A = window.PN.arsenal;
      for (const id of A.shots.filter((shotId) => A.META[shotId].done)) {
        const parts = A.parts(id);
        for (const p of parts) {
          for (let index = 0; index < p.frames; index += 1) {
            expanded.push({ key: `skill/${id}/${p.part}/${index}`, call: ['PN.arsenal.stamp', id, p.part, { frame: index }], box: p.box, anchor: p.anchor, scale: 1 });
          }
        }
        expanded.at(-1).animation = { key: `skill/${id}`, spec: Object.fromEntries(parts.map((p) => [p.part, { frames: p.frames, fps: p.drive === 'loop' ? p.fps : 0 }])) };
      }
      continue;
    }
    if (frame.bomber) {
      // SYS-14 (K7): a bomber's every state from the kit at its own size (fit 1, API-bombers §7). Plant frames are
      // picked by the fuse's progress, so they carry no clock rate; idle and hit are stills.
      const { chapter, kind } = frame.bomber;
      const meta = window.PN.bombers.meta(chapter, kind);
      const spec = {};
      for (const [state, count] of Object.entries(meta.states)) {
        for (let index = 0; index < count; index += 1) {
          expanded.push({
            key: `${frame.keyPrefix}/${state}/${index}`,
            call: ['PN.bombers.draw', chapter, kind, { lod: 'game', shadow: false, halo: true, state, frame: index }],
            box: meta.box,
            anchor: [meta.feet[0], meta.feet[1]],
            scale: meta.displayScale,
            extraPad: meta.pad[state],
          });
        }
        spec[state] = { frames: count, fps: state === 'walk' ? meta.walkFps : state === 'idle' || state === 'hit' ? 1 : 0 };
      }
      expanded.at(-1).animation = { key: frame.keyPrefix, spec };
      continue;
    }
    if (!frame.enemy) {
      expanded.push(frame);
      continue;
    }
    const { chapter, role, fit } = frame.enemy;
    const meta = window.PN.enemies.meta(chapter, role);
    const base = {
      box: meta.box,
      anchor: [meta.feet[0], meta.feet[1]],
      scale: meta.displayScale * fit,
      extraPad: roles[role].pad,
    };
    const options = { lod: 'game', shadow: false, halo: true };
    expanded.push({ ...base, key: `${frame.keyPrefix}/idle/0`, call: ['PN.enemies.draw', chapter, role, { ...options, state: 'idle' }] });
    expanded.push({ ...base, key: `${frame.keyPrefix}/windup/0`, call: ['PN.enemies.draw', chapter, role, { ...options, state: 'windup' }], strip: roles[role].strip?.windup });
    expanded.push({ ...base, key: `${frame.keyPrefix}/hit/0`, call: ['PN.enemies.draw', chapter, role, { ...options, state: 'hit' }] });
    for (let walk = 0; walk < meta.frames; walk += 1) {
      expanded.push({ ...base, key: `${frame.keyPrefix}/walk/${walk}`, call: ['PN.enemies.draw', chapter, role, { ...options, state: 'idle', frame: walk }] });
    }
    expanded.at(-1).animation = {
      key: frame.keyPrefix,
      spec: { walk: { frames: meta.frames, fps: roles[role].walkFps }, idle: { frames: 1, fps: 1 }, windup: { frames: 1, fps: 1 }, hit: { frames: 1, fps: 1 } },
    };
  }

  const out = [];
  const cropped = [];
  for (const frame of expanded) {
    const [fnPath, ...args] = frame.call;
    const fn = fnPath.split('.').reduce((owner, key) => owner[key], window);
    let markup = window.bake.firstAttributes(fn(...args));
    if (frame.strip) markup = markup.replace(new RegExp(frame.strip, 'g'), '');
    // Drawings made around their own pivot (kit props) are moved onto the box.
    if (frame.translate) markup = `<g transform="translate(${frame.translate[0]} ${frame.translate[1]})">${markup}</g>`;
    for (const [from, to] of colorMap) markup = markup.replace(new RegExp(from, 'gi'), to);
    const pxPerUnit = frame.scale * scale;
    const pad = margin / pxPerUnit;
    // Extra room in box units for drawings that reach past their box: [top, right, bottom, left].
    const [padTop, padRight, padBottom, padLeft] = frame.extraPad ?? [0, 0, 0, 0];
    const [bw, bh] = frame.box;
    const width = Math.ceil((bw + padLeft + padRight) * pxPerUnit + margin * 2);
    const height = Math.ceil((bh + padTop + padBottom) * pxPerUnit + margin * 2);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${-pad - padLeft} ${-pad - padTop} ${width / pxPerUnit} ${height / pxPerUnit}">${markup}</svg>`;
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode().catch((error) => {
      throw new Error(`${frame.key} did not decode as SVG (${error.message})`);
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, width, height);
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] === 0) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    if (right < 0) throw new Error(`${frame.key} rendered empty`);
    // A drawing that reaches the cell edge was cut off: give it more room (extraPad) instead of shipping it cropped.
    // Within a pixel: the viewBox edge can leave the last column clear under a cut stroke.
    const edges = [top <= 1 && 'top', right >= width - 2 && 'right', bottom >= height - 2 && 'bottom', left <= 1 && 'left'].filter(Boolean);
    if (edges.length > 0) cropped.push(`${frame.key} (${edges.join(', ')})`);
    const w = right - left + 1;
    const h = bottom - top + 1;
    const trimmed = document.createElement('canvas');
    trimmed.width = w;
    trimmed.height = h;
    trimmed.getContext('2d').drawImage(canvas, left, top, w, h, 0, 0, w, h);
    const ax = Math.round(((frame.anchor[0] + pad + padLeft) * pxPerUnit - left) * 10) / 10;
    const ay = Math.round(((frame.anchor[1] + pad + padTop) * pxPerUnit - top) * 10) / 10;
    out.push({ key: frame.key, w, h, ax, ay, png: trimmed.toDataURL('image/png'), animation: frame.animation });
  }
  if (cropped.length > 0) throw new Error(`drawings reach their cell edge, widen their extraPad: ${cropped.join('; ')}`);
  return out;
}

async function renderGround({ call, size, scale, colorMap }) {
  const [fnPath, ...args] = call;
  const fn = fnPath.split('.').reduce((owner, key) => owner[key], window);
  let markup = window.bake.firstAttributes(fn(...args));
  for (const [from, to] of colorMap) markup = markup.replace(new RegExp(from, 'gi'), to);
  const pixels = size * scale;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 ${size} ${size}">${markup}</svg>`)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = pixels;
  canvas.height = pixels;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvas.toDataURL('image/webp', 0.85);
}

async function composePage({ placed, width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  for (const item of placed) {
    const image = new Image();
    image.src = item.png;
    await image.decode();
    ctx.drawImage(image, item.x, item.y);
  }
  return canvas.toDataURL('image/png');
}
