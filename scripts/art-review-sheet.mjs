// Art review renders: draws concept-kit subjects in Chromium at a large scale, so a reviewer (the art-director agent,
// .claude/agents/art-director.md) can judge faces and small detail that the baked atlas shows only at game size.
// It writes PNG files outside the repository and prints their paths; nothing in the repository changes.
// Usage: node scripts/art-review-sheet.mjs <subject> [--scale N] [--out DIR] [--expr "<kit call>"]
//   hero            full-body poses (PN.heroKit.full)
//   hero-sprite     the 64 px game sprite, one key frame per state (PN.heroKit.sprite)
//   hero-portrait   the six HUD portrait expressions (PN.heroKit.portrait)
//   bosses          the six round bosses, phase 1-3, game detail (PN.bossesA / PN.bossesB)
//   boss-faces      the same bosses cropped to the face, art and game detail
//   enemies         chapters 1-5 x four roles, art and game LOD (PN.enemies.draw)
//   story           the story panels in public/assets/packs/story, re-encoded as PNG
//   ui-sheets       the UI sheets in src/ui/art (portraits, icons, key art), re-encoded as PNG
//   expr            any kit call returning SVG markup, e.g. --expr "PN.heroKit.portrait('hurt', { bg: false })"
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { COLOR_MAP, HERO_STATES } from '../art/atlas-spec.mjs';
import { BOSS_PORTRAITS, HERO_EXPRESSIONS } from '../art/ui-art-spec.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const kitDir = path.join(root, 'art/concept-kit');
const KIT_FILES = ['lib.js', 'k-hero.js', 'k-bosses1.js', 'k-bosses2.js', 'k-icons.js', 'k-enemies.js', 'k-env.js'];
const HERO_POSES = ['front', 'threeQuarter', 'back', 'throw', 'run', 'dash'];
const ROLES = ['stalker', 'charger', 'shooter', 'warden'];
const BACKGROUND = '#c9c6bc';
/** Baked WebP art re-encoded as PNG as it is: the story panels and the UI sheets (portraits, icons, key art). */
const WEBP_DIRS = { story: 'public/assets/packs/story', 'ui-sheets': 'src/ui/art' };

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const subject = args[0];
const outDir = path.resolve(option('out', path.join(tmpdir(), 'blackline-art-review')));
if (outDir === root || outDir.startsWith(`${root}${path.sep}`)) throw new Error(`--out must be outside the repository (${root})`);
const scale = Number(option('scale', subject === 'boss-faces' || subject === 'hero-sprite' ? 8 : 3));
if (!(scale > 0 && scale <= 16)) throw new Error('--scale must be in (0, 16]');

/** Each item: a file name, a kit expression, and an optional crop [x, y, w, h] in local units (bounds otherwise). */
function items() {
  switch (subject) {
    case 'hero':
      return HERO_POSES.map((pose) => ({ name: `hero-${pose}`, expr: `PN.heroKit.full(${JSON.stringify(pose)}, { ground: false })` }));
    case 'hero-sprite':
      return Object.keys(HERO_STATES).map((state) => ({ name: `hero-sprite-${state}`, expr: `PN.heroKit.sprite(${JSON.stringify(state)}, 0, {})` }));
    case 'hero-portrait':
      return HERO_EXPRESSIONS.map((expr) => ({ name: `hero-portrait-${expr}`, expr: `PN.heroKit.portrait(${JSON.stringify(expr)})`, crop: [-2, -2, 164, 164] }));
    case 'bosses':
      return Object.entries(BOSS_PORTRAITS).flatMap(([id, spec]) => [1, 2, 3].map((phase) => ({ name: `boss-${id}-p${phase}`, expr: bossCall(spec, phase, 'game') })));
    case 'boss-faces':
      return Object.entries(BOSS_PORTRAITS).flatMap(([id, spec]) => ['art', 'game'].map((detail) => {
        // The portrait disc spans 148 units at the portrait scale; the face crop is that disc, a little tighter.
        const span = (spec.module === 'bossesB' ? 384 : 400) * spec.scale * 0.8;
        return { name: `boss-face-${id}-${detail}`, expr: bossCall(spec, 1, detail), crop: [spec.center[0] - span / 2, spec.center[1] - span / 2, span, span] };
      }));
    case 'enemies':
      return [1, 2, 3, 4, 5].flatMap((ch) => ROLES.flatMap((role) => ['art', 'game'].map((lod) => ({
        name: `enemy-ch${ch}-${role}-${lod}`,
        expr: `PN.enemies.draw(${ch}, ${JSON.stringify(role)}, { lod: ${JSON.stringify(lod)}, halo: false, shadow: false })`,
      }))));
    case 'expr': {
      const expr = option('expr');
      if (!expr) throw new Error('expr needs --expr "<kit call>"');
      return [{ name: option('name', 'expr').replace(/[^\w.-]/g, '_'), expr }];
    }
    default:
      throw new Error(`unknown subject "${subject}"; see the usage at the top of scripts/art-review-sheet.mjs`);
  }
}

function bossCall({ kit, module = 'bossesA' }, phase, detail) {
  return module === 'bossesB'
    ? `PN.bossesB.draw(${JSON.stringify(kit)}, { phase: ${phase}, detail: ${JSON.stringify(detail)}, halo: false, shadow: false })`
    : `PN.bossesA.draw(${JSON.stringify(kit)}, { phase: ${phase}, lod: ${JSON.stringify(detail)}, halo: false, shadow: false })`;
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  if (WEBP_DIRS[subject]) {
    const dir = path.join(root, WEBP_DIRS[subject]);
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.webp')).sort()) {
      const png = await page.evaluate(reencode, `data:image/webp;base64,${readFileSync(path.join(dir, file)).toString('base64')}`);
      writePng(`${subject}-${file.replace(/\.webp$/, '')}`, png);
    }
  } else {
    for (const file of KIT_FILES) await page.addScriptTag({ content: readFileSync(path.join(kitDir, file), 'utf8') });
    for (const item of items()) {
      const png = await page.evaluate(render, { ...item, scale, colorMap: COLOR_MAP, background: BACKGROUND });
      writePng(item.name, png);
    }
  }
} finally {
  await browser.close();
}

function writePng(name, { dataUrl, width, height }) {
  const file = path.join(outDir, `${name}.png`);
  writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`${file} ${width}x${height}`);
}

// ---- browser side ----

async function reencode(src) {
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}

async function render({ name, expr, crop, scale, colorMap, background }) {
  let markup = new Function('PN', `return (${expr});`)(window.PN);
  if (typeof markup !== 'string' || !markup) throw new Error(`${name}: the expression returned no markup`);
  // The kit's Ch4 enemies repeat an attribute, which an SVG image refuses (as in build-atlas.mjs and build-ui-art.mjs).
  markup = markup.replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")+)(\s*\/?)>/g, (tag, tagName, attributes, end) => {
    const seen = new Set();
    const kept = attributes.replace(/\s+([\w:-]+)="[^"]*"/g, (attribute, key) => (seen.has(key) ? '' : (seen.add(key), attribute)));
    return `<${tagName}${kept}${end}>`;
  });
  for (const [from, to] of colorMap) markup = markup.replace(new RegExp(from, 'gi'), to);
  let box = crop;
  if (!box) {
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    probe.innerHTML = markup;
    document.body.appendChild(probe);
    const bounds = probe.getBBox();
    probe.remove();
    const pad = Math.max(bounds.width, bounds.height) * 0.04;
    box = [bounds.x - pad, bounds.y - pad, bounds.width + pad * 2, bounds.height + pad * 2];
  }
  const [x, y, w, h] = box;
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${w} ${h}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${background}"/>${markup}</svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode().catch((error) => {
    throw new Error(`${name} did not decode as SVG (${error.message})`);
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return { dataUrl: canvas.toDataURL('image/png'), width, height };
}
