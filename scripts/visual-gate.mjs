import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import { comparePngBuffers, inspectPng } from './lib/visual-evidence.mjs';

const outputRoot = path.resolve(process.env.VISUAL_ARTIFACTS ?? 'artifacts/visual');
const goldenRoot = path.resolve(process.env.VISUAL_GOLDENS ?? 'test/visual-golden');
const updateGoldens = process.env.VISUAL_UPDATE_GOLDENS === '1';
const requireGoldens = process.env.VISUAL_REQUIRE_GOLDENS !== '0';
const maxDiffRatio = Number.parseFloat(process.env.VISUAL_MAX_DIFF_RATIO ?? '0.005');
const pixelTolerance = Number.parseInt(process.env.VISUAL_PIXEL_TOLERANCE ?? '24', 10);
// Desktop sizes follow the platform policy (TEC-01: minimum 1024x720, reference 1280x720 and 1440x900,
// largest verified 1920x1080); the small sizes keep the responsive layout covered.
const viewportCatalog = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x720', width: 1024, height: 720 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];
const stateNames = ['menu', 'infinite-menu', 'infinite-playing', 'playing', 'paused', 'draft', 'settlement', 'boss'];

function selectValues(value, catalog, label) {
  if (!value) return catalog;
  const requested = value.split(',').map((item) => item.trim()).filter(Boolean);
  const selected = requested.map((name) => catalog.find((item) => (typeof item === 'string' ? item : item.name) === name));
  if (selected.some((item) => !item)) throw new Error(`Unknown ${label}: ${requested.join(', ')}`);
  return selected;
}

const viewports = selectValues(process.env.VISUAL_VIEWPORTS, viewportCatalog, 'viewport');
const dprs = selectValues(process.env.VISUAL_DPRS, ['1', '2'], 'DPR').map(Number);
const motions = selectValues(process.env.VISUAL_MOTIONS, ['full', 'reduce'], 'motion mode');
const report = {
  version: 2,
  configuration: {
    viewports: viewports.map((item) => item.name),
    dprs,
    motions,
    states: stateNames,
    combinations: viewports.length * dprs.length * motions.length * stateNames.length,
    maxDiffRatio,
    pixelTolerance,
    requireGoldens,
    updateGoldens,
  },
  captures: [],
  runtimeFailures: [],
};

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function unique(locator, description) {
  const count = await locator.count();
  if (count !== 1) throw new Error(`${description} must resolve exactly once; received ${count}`);
  return locator;
}

async function settle(page, milliseconds = 160) {
  if (typeof page.clock?.runFor === 'function') {
    await page.clock.runFor(milliseconds);
  } else {
    await page.waitForTimeout(milliseconds);
  }
}

async function openDeveloperMode(page) {
  const toggle = await unique(page.getByRole('checkbox', { name: '개발자 모드: 모든 Stage 접근' }), 'developer mode checkbox');
  if (!(await toggle.isChecked())) {
    await toggle.check();
    await settle(page, 40);
  }
}

// Dialogs ignore input for a short guard window after opening (BUG-05); wait it out before choosing.
async function passInputGuard(page) {
  await settle(page, 420);
}

async function openCheatDrawer(page) {
  const closedDrawer = page.getByRole('button', { name: '런 패널 열기' });
  if (await closedDrawer.count() === 1) {
    await closedDrawer.click();
    await settle(page, 40);
  }
  const developerTab = await unique(page.getByRole('tab', { name: '개발' }), 'developer drawer tab');
  await developerTab.click();
  await settle(page, 20);
}

async function enterCheat(page, code) {
  const input = await unique(page.getByPlaceholder('CODE', { exact: true }), 'run cheat input');
  await input.fill(code);
  const submit = await unique(page.getByRole('button', { name: '입력' }), 'run cheat submit');
  await submit.click();
  await settle(page, 80);
}

async function inspectLayout(page) {
  return page.evaluate(() => {
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const dialog = document.querySelector('[role="dialog"]');
    const root = dialog ?? document;
    const elements = Array.from(root.querySelectorAll('button, input, select, summary, [role="tab"]'));
    // Controls whose centre is clipped by a scrolling ancestor are scrolled out of view, not occluded.
    const centreVisibleInScrollers = (element, rect) => {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      for (let current = element.parentElement; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
        const clip = current.getBoundingClientRect();
        if (x < clip.left || x > clip.right || y < clip.top || y > clip.bottom) return false;
      }
      return true;
    };
    const candidates = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { element, index, rect, style };
    }).filter(({ element, rect, style }) => (
      style.visibility !== 'hidden'
      && style.display !== 'none'
      && rect.width >= 8
      && rect.height >= 8
      && rect.right > 0
      && rect.bottom > 0
      && rect.left < innerWidth
      && rect.top < innerHeight
      && centreVisibleInScrollers(element, rect)
    ));
    const label = ({ element, index }) => element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 60) || `${element.tagName.toLowerCase()}-${index}`;
    const stickyAncestor = (element) => {
      for (let current = element; current; current = current.parentElement) {
        if (getComputedStyle(current).position === 'sticky') return current;
      }
      return null;
    };
    const scrollParent = (element) => {
      for (let current = element.parentElement; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (/(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight) return current;
      }
      return null;
    };
    // A sticky footer may cover content that its own scroll container can still scroll into view; that is
    // intentional layout, not an overlap. Anything else covering a control counts as occlusion.
    const scrollsUnderSticky = (element, sticky) => {
      if (!sticky || sticky.contains(element)) return false;
      const container = scrollParent(element);
      return Boolean(container && container.contains(sticky) && container.scrollTop + container.clientHeight < container.scrollHeight);
    };
    const overlaps = [];
    for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
        const left = candidates[leftIndex];
        const right = candidates[rightIndex];
        if (left.element.contains(right.element) || right.element.contains(left.element)) continue;
        if (scrollsUnderSticky(left.element, stickyAncestor(right.element)) || scrollsUnderSticky(right.element, stickyAncestor(left.element))) continue;
        const width = Math.max(0, Math.min(left.rect.right, right.rect.right) - Math.max(left.rect.left, right.rect.left));
        const height = Math.max(0, Math.min(left.rect.bottom, right.rect.bottom) - Math.max(left.rect.top, right.rect.top));
        const intersection = width * height;
        const smaller = Math.min(left.rect.width * left.rect.height, right.rect.width * right.rect.height);
        if (intersection > 16 && intersection / smaller > 0.05) overlaps.push(`${label(left)} <> ${label(right)}`);
      }
    }
    const reachableUnderSticky = (candidate, top) => scrollsUnderSticky(candidate.element, stickyAncestor(top));
    const occluded = candidates.filter((candidate) => {
      const x = Math.max(viewport.left, Math.min(viewport.right - 1, candidate.rect.left + candidate.rect.width / 2));
      const y = Math.max(viewport.top, Math.min(viewport.bottom - 1, candidate.rect.top + candidate.rect.height / 2));
      const top = document.elementFromPoint(x, y);
      return top && !candidate.element.contains(top) && !top.contains(candidate.element) && !reachableUnderSticky(candidate, top);
    }).map(label);
    const accessibilityIssues = [];
    const ids = new Map();
    for (const element of document.querySelectorAll('[id]')) {
      const id = element.id;
      ids.set(id, (ids.get(id) ?? 0) + 1);
    }
    for (const [id, count] of ids) {
      if (count > 1) accessibilityIssues.push(`duplicate id #${id}`);
    }
    for (const element of document.querySelectorAll('button, input, select, textarea')) {
      const labelledBy = element.getAttribute('aria-labelledby');
      const hasReferencedLabel = labelledBy?.split(/\s+/).every((id) => document.getElementById(id));
      const wrappedLabel = element.closest('label')?.textContent?.trim();
      const explicitLabel = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent?.trim();
      const directName = element.getAttribute('aria-label')?.trim() || element.textContent?.trim() || wrappedLabel || explicitLabel;
      if (!directName && !hasReferencedLabel) accessibilityIssues.push(`unnamed ${element.tagName.toLowerCase()}`);
    }
    for (const element of document.querySelectorAll('[aria-controls]')) {
      if (element.getAttribute('aria-expanded') === 'false' || element.getAttribute('aria-selected') === 'false') continue;
      for (const id of element.getAttribute('aria-controls').split(/\s+/)) {
        if (!document.getElementById(id)) accessibilityIssues.push(`aria-controls missing #${id}`);
      }
    }
    for (const element of document.querySelectorAll('[aria-describedby], [aria-labelledby]')) {
      for (const attribute of ['aria-describedby', 'aria-labelledby']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        for (const id of value.split(/\s+/)) {
          if (!document.getElementById(id)) accessibilityIssues.push(`${attribute} missing #${id}`);
        }
      }
    }
    return {
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      overlaps,
      occluded,
      accessibilityIssues: [...new Set(accessibilityIssues)],
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      dpr: devicePixelRatio,
    };
  });
}

async function inspectCanvas(page) {
  return page.evaluate(() => {
    const source = document.querySelector('canvas.gameCanvas');
    if (!source) return null;
    const sample = document.createElement('canvas');
    sample.width = 96;
    sample.height = 64;
    const context = sample.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(source, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const buckets = new Set();
    let ink = 0;
    let min = 255;
    let max = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      if (luminance < 225) ink += 1;
      min = Math.min(min, luminance);
      max = Math.max(max, luminance);
      buckets.add(`${red >> 5}:${green >> 5}:${blue >> 5}`);
    }
    const rect = source.getBoundingClientRect();
    return {
      width: source.width,
      height: source.height,
      expectedWidth: Math.round(rect.width * Math.min(2, Math.max(1, devicePixelRatio || 1))),
      expectedHeight: Math.round(rect.height * Math.min(2, Math.max(1, devicePixelRatio || 1))),
      inkRatio: ink / (sample.width * sample.height),
      luminanceRange: max - min,
      colorBuckets: buckets.size,
    };
  });
}

async function captureEvidence(page, viewport, dpr, motion, state) {
  const id = `${viewport.name}-dpr${dpr}-${motion}-${state}`;
  const actualPath = path.join(outputRoot, 'actual', `${id}.png`);
  const goldenPath = path.join(goldenRoot, `${id}.png`);
  const diffPath = path.join(outputRoot, 'diff', `${id}.png`);
  const failures = [];
  await settle(page);
  const buffer = await page.screenshot({ fullPage: false, animations: 'disabled' });
  await writeFile(actualPath, buffer);
  const image = inspectPng(buffer);
  if (image.width !== viewport.width * dpr || image.height !== viewport.height * dpr) {
    failures.push(`screenshot DPR mismatch ${image.width}x${image.height}, expected ${viewport.width * dpr}x${viewport.height * dpr}`);
  }
  if (image.opaqueRatio < 0.98 || image.colorBuckets < 4 || image.luminanceRange < 24 || image.luminanceStdDev < 4) {
    failures.push(`nonblank gate failed: ${JSON.stringify(image)}`);
  }

  const layout = await inspectLayout(page);
  if (layout.horizontalOverflow > 1) failures.push(`horizontal overflow ${layout.horizontalOverflow}px`);
  if (layout.overlaps.length > 0) failures.push(`interactive overlap: ${layout.overlaps.join(' | ')}`);
  if (layout.occluded.length > 0) failures.push(`occluded controls: ${layout.occluded.join(' | ')}`);
  if (layout.accessibilityIssues.length > 0) failures.push(`accessibility contract: ${layout.accessibilityIssues.join(' | ')}`);
  if (Math.abs(layout.dpr - dpr) > 0.01) failures.push(`runtime DPR ${layout.dpr}, expected ${dpr}`);
  if (layout.reducedMotion !== (motion === 'reduce')) failures.push(`reduced-motion media mismatch: ${layout.reducedMotion}`);

  let canvas = null;
  if (state !== 'menu' && state !== 'infinite-menu') {
    canvas = await inspectCanvas(page);
    if (!canvas || canvas.colorBuckets < 3 || canvas.luminanceRange < 20 || canvas.inkRatio < 0.002) {
      failures.push(`canvas nonblank gate failed: ${JSON.stringify(canvas)}`);
    } else if (canvas.width !== canvas.expectedWidth || canvas.height !== canvas.expectedHeight) {
      failures.push(`canvas DPR mismatch ${canvas.width}x${canvas.height}, expected ${canvas.expectedWidth}x${canvas.expectedHeight}`);
    }
  }

  let golden = 'missing';
  let comparison = null;
  if (updateGoldens) {
    await copyFile(actualPath, goldenPath);
    golden = 'updated';
  } else if (await exists(goldenPath)) {
    golden = 'compared';
    comparison = comparePngBuffers(buffer, await readFile(goldenPath), { pixelTolerance });
    await writeFile(diffPath, comparison.diff);
    if (comparison.sizeMismatch || comparison.mismatchRatio > maxDiffRatio) {
      failures.push(`golden diff ${(comparison.mismatchRatio * 100).toFixed(3)}% exceeds ${(maxDiffRatio * 100).toFixed(3)}%`);
    }
  } else if (requireGoldens) {
    failures.push(`missing golden ${path.relative(process.cwd(), goldenPath)}`);
  }

  report.captures.push({
    id,
    viewport: viewport.name,
    dpr,
    motion,
    state,
    actual: path.relative(outputRoot, actualPath),
    golden: path.relative(process.cwd(), goldenPath),
    diff: comparison ? path.relative(outputRoot, diffPath) : null,
    goldenStatus: golden,
    mismatchRatio: comparison?.mismatchRatio ?? null,
    image,
    canvas,
    layout,
    failures,
    passed: failures.length === 0,
  });
}

async function runScenario(page, viewport, dpr, motion) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await settle(page, 120);
  await unique(page.getByRole('heading', { name: '흑백 타격 생존전' }), 'menu heading');
  await captureEvidence(page, viewport, dpr, motion, 'menu');

  await (await unique(page.getByRole('tab', { name: '무한 경쟁' }), 'infinite menu tab')).click();
  await settle(page, 40);
  await unique(page.getByRole('heading', { name: '무한 경쟁' }), 'infinite heading');
  await captureEvidence(page, viewport, dpr, motion, 'infinite-menu');
  await (await unique(page.getByRole('button', { name: '무한 모드 시작' }), 'infinite start')).click();
  await settle(page, 180);
  await unique(page.getByRole('img', { name: '흑백 타격 생존전 플레이 영역' }), 'infinite game canvas');
  await captureEvidence(page, viewport, dpr, motion, 'infinite-playing');
  await page.keyboard.press('p');
  await settle(page, 40);
  await (await unique(page.getByRole('button', { name: 'Stage 메뉴' }), 'return to Stage menu')).click();
  await settle(page, 40);
  await (await unique(page.getByRole('button', { name: '포기하고 메뉴로' }), 'confirm abandoning the run')).click();
  await settle(page, 80);
  await (await unique(page.getByRole('tab', { name: 'Stage 선택' }), 'Stage menu tab')).click();
  await settle(page, 40);

  await openDeveloperMode(page);
  await (await unique(page.getByRole('button', { name: 'Ch.1 / St.1 시작' }), 'Stage 1 start')).click();
  await settle(page, 180);
  await unique(page.getByRole('img', { name: '흑백 타격 생존전 플레이 영역' }), 'game canvas');
  await captureEvidence(page, viewport, dpr, motion, 'playing');

  await page.keyboard.press('p');
  await settle(page, 40);
  await unique(page.getByRole('dialog', { name: '일시정지' }), 'pause dialog');
  await captureEvidence(page, viewport, dpr, motion, 'paused');
  await (await unique(page.getByRole('dialog', { name: '일시정지' }).getByRole('button', { name: '계속하기', exact: true }), 'resume button')).click();
  await settle(page, 40);

  await openCheatDrawer(page);
  await enterCheat(page, 'DRAFT');
  await unique(page.getByRole('dialog'), 'draft dialog');
  await captureEvidence(page, viewport, dpr, motion, 'draft');
  await passInputGuard(page);
  await (await unique(page.locator('[aria-keyshortcuts="1"]'), 'first draft card')).click();
  await settle(page, 80);

  await openCheatDrawer(page);
  await enterCheat(page, 'CLEAR');
  await unique(page.getByRole('dialog'), 'settlement dialog');
  await captureEvidence(page, viewport, dpr, motion, 'settlement');
  await passInputGuard(page);
  await (await unique(page.getByRole('dialog').getByRole('button', { name: 'Stage 선택', exact: true }), 'settlement Stage selection')).click();
  await settle(page, 80);

  const stageFive = await unique(page.locator('.stageNode').filter({ has: page.locator('span', { hasText: /^Stage 5$/ }) }), 'Stage 5 node');
  await stageFive.click();
  await settle(page, 30);
  await (await unique(page.getByRole('button', { name: 'Ch.1 / St.5 시작' }), 'Stage 5 start')).click();
  await settle(page, 180);
  await captureEvidence(page, viewport, dpr, motion, 'boss');
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

async function writeReports() {
  report.summary = {
    passed: report.captures.filter((item) => item.passed).length,
    failed: report.captures.filter((item) => !item.passed).length,
    captured: report.captures.length,
    runtimeFailures: report.runtimeFailures.length,
  };
  await writeFile(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const rows = report.captures.map((item) => `<tr class="${item.passed ? 'pass' : 'fail'}"><td>${escapeHtml(item.id)}</td><td>${item.passed ? 'PASS' : 'FAIL'}</td><td>${item.mismatchRatio === null ? item.goldenStatus : `${(item.mismatchRatio * 100).toFixed(3)}%`}</td><td>${escapeHtml(item.failures.join('; '))}</td><td><a href="${escapeHtml(item.actual)}">actual</a>${item.diff ? ` / <a href="${escapeHtml(item.diff)}">diff</a>` : ''}</td></tr>`).join('');
  const runtime = report.runtimeFailures.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Blackline visual gate</title><style>body{font:14px system-ui;margin:24px;color:#171717}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:8px;text-align:left;vertical-align:top}.pass td:nth-child(2){color:#176b38}.fail{background:#ffe8e8}.fail td:nth-child(2){color:#a40018}code{background:#eee;padding:2px 4px}</style></head><body><h1>Blackline visual gate</h1><p><code>${report.summary.passed}</code> passed, <code>${report.summary.failed}</code> failed, <code>${report.summary.runtimeFailures}</code> runtime errors.</p><ul>${runtime}</ul><table><thead><tr><th>Capture</th><th>Gate</th><th>Golden</th><th>Failures</th><th>Files</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  await writeFile(path.join(outputRoot, 'report.html'), html, 'utf8');
}

if (!Number.isFinite(maxDiffRatio) || maxDiffRatio < 0 || maxDiffRatio > 1) throw new Error('VISUAL_MAX_DIFF_RATIO must be between 0 and 1');
if (!Number.isInteger(pixelTolerance) || pixelTolerance < 0 || pixelTolerance > 255) throw new Error('VISUAL_PIXEL_TOLERANCE must be an integer between 0 and 255');
// The gate captures the packaged developer build (production bundling and CSP, developer cheats enabled)
// instead of the dev server, so what it records matches what ships (BUG-02).
const externalBaseUrl = process.env.VISUAL_BASE_URL;
const developerOutDir = path.resolve(process.env.VISUAL_BUILD_DIR ?? 'dist-developer');
if (!externalBaseUrl && process.env.VISUAL_SKIP_BUILD !== '1') {
  await build({ configFile: path.resolve('vite.config.ts'), mode: 'developer', logLevel: 'error', build: { outDir: developerOutDir, emptyOutDir: true } });
}
const server = externalBaseUrl ? undefined : await preview({
  configFile: path.resolve('vite.config.ts'),
  mode: 'developer',
  logLevel: 'error',
  build: { outDir: developerOutDir },
  preview: { host: '127.0.0.1', port: 5174, strictPort: true },
});
const baseUrl = externalBaseUrl ?? 'http://127.0.0.1:5174/';
let browser;

try {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(path.join(outputRoot, 'actual'), { recursive: true });
  await mkdir(path.join(outputRoot, 'diff'), { recursive: true });
  if (updateGoldens) await mkdir(goldenRoot, { recursive: true });
  browser = await chromium.launch({ headless: true });

  for (const viewport of viewports) {
    for (const dpr of dprs) {
      for (const motion of motions) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: dpr,
          reducedMotion: motion === 'reduce' ? 'reduce' : 'no-preference',
          colorScheme: 'light',
        });
        await context.addInitScript(() => {
          let state = 0x51f15e;
          const next = () => {
            state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
            return state / 0x1_0000_0000;
          };
          Math.random = next;
          Object.defineProperty(globalThis.crypto, 'getRandomValues', {
            configurable: true,
            value(array) {
              for (let index = 0; index < array.length; index += 1) array[index] = Math.floor(next() * 0x1_0000_0000);
              return array;
            },
          });
        });
        const page = await context.newPage();
        const runtimeErrors = [];
        page.on('console', (message) => {
          if (message.type() === 'error' || message.type() === 'warning') runtimeErrors.push(`console.${message.type()}: ${message.text()}`);
        });
        page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
        page.on('requestfailed', (request) => runtimeErrors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
        try {
          await page.clock.install({ time: new Date('2026-07-14T00:00:00.000Z') });
          await runScenario(page, viewport, dpr, motion);
        } catch (error) {
          report.runtimeFailures.push(`${viewport.name}/dpr${dpr}/${motion}: ${error.stack ?? error.message}`);
        }
        report.runtimeFailures.push(...runtimeErrors.map((message) => `${viewport.name}/dpr${dpr}/${motion}: ${message}`));
        await context.close();
      }
    }
  }
} finally {
  await browser?.close();
  await server?.close?.();
  if (report.captures.length !== report.configuration.combinations) {
    report.runtimeFailures.push(`capture count ${report.captures.length}, expected ${report.configuration.combinations}`);
  }
  await writeReports();
}

if (report.runtimeFailures.length > 0 || report.captures.some((item) => !item.passed)) process.exitCode = 1;
