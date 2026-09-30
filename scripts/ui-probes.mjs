// Browser regression probes for input (BUG-04, BUG-05, BUG-06, TEC-07) against the developer build.
// Usage: npm run test:ui-probes  (builds dist-developer unless UI_PROBE_SKIP_BUILD=1)
import path from 'node:path';
import { chromium } from 'playwright';
import { build, preview } from 'vite';

const outDir = path.resolve(process.env.UI_PROBE_BUILD_DIR ?? 'dist-developer');
if (process.env.UI_PROBE_SKIP_BUILD !== '1') {
  await build({ configFile: path.resolve('vite.config.ts'), mode: 'developer', logLevel: 'error', build: { outDir, emptyOutDir: true } });
}
const server = await preview({
  configFile: path.resolve('vite.config.ts'),
  mode: 'developer',
  logLevel: 'error',
  build: { outDir },
  preview: { host: '127.0.0.1', port: 5177, strictPort: true },
});

const results = [];
const record = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

async function openStage(page) {
  await page.goto('http://127.0.0.1:5177/');
  await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
  const devToggle = page.getByRole('checkbox', { name: '개발자 모드: 모든 Stage 접근' });
  if (!(await devToggle.isChecked())) await devToggle.check();
  await page.getByRole('button', { name: 'Ch.1 / St.1 시작' }).click();
  await page.waitForTimeout(300);
}

async function cheat(page, code) {
  const opener = page.getByRole('button', { name: '런 패널 열기' });
  if (await opener.count()) await opener.click();
  await page.getByRole('tab', { name: '개발' }).click();
  const input = page.getByPlaceholder('CODE', { exact: true });
  await input.fill(code);
  await input.press('Enter');
  await page.waitForTimeout(60);
}

const diagnostics = (page) => page.evaluate(() => window.__blacklineDiagnostics?.());

const browser = await chromium.launch({ headless: true });
async function probe(name, body) {
  try {
    await body();
  } catch (error) {
    record(`${name} (probe error)`, false, error instanceof Error ? error.message.split('\n')[0] : String(error));
  }
}
try {
  await probe('BUG-04', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await openStage(page);
    await cheat(page, 'GOD');
    await page.getByRole('button', { name: '런 패널 닫기' }).click();
    await page.getByRole('button', { name: /게임 속도/ }).click();
    const before = await diagnostics(page);
    if (!before) throw new Error('diagnostics hook missing (not a developer build of this version)');
    await page.keyboard.down('d');
    await page.waitForTimeout(600);
    await page.keyboard.up('d');
    const after = await diagnostics(page);
    const moved = after.player.x - before.player.x;
    record('BUG-04 WASD still moves after clicking a HUD button', moved > 40, `moved ${moved.toFixed(1)} units`);
    await page.close();
  });

  await probe('BUG-05', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await openStage(page);
    await cheat(page, 'DRAFT');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.waitForTimeout(80);
    const stillOpen = await page.getByRole('dialog').count();
    record('BUG-05 Enter/Space right after a draft opens do not pick a card', stillOpen === 1);
    await page.waitForTimeout(400);
    const draftOpen = await page.getByRole('dialog').count();
    await page.keyboard.press('1');
    await page.waitForTimeout(120);
    record('BUG-05 number key picks a card once the guard ends', draftOpen === 1 && (await page.getByRole('dialog').count()) === 0);

    await cheat(page, 'CLEAR');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
    record('BUG-05 Enter right after the settlement opens does not dismiss it', (await page.getByRole('dialog').count()) === 1);
    await page.close();
  });

  await probe('BUG-06', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      const pad = { connected: true, index: 0, id: 'probe-pad', axes: [0, 0, 0, 0], buttons, mapping: 'standard', timestamp: 0 };
      window.__probePad = {
        press(index) { buttons[index] = { pressed: true, value: 1 }; },
        release(index) { buttons[index] = { pressed: false, value: 0 }; },
      };
      navigator.getGamepads = () => [pad, null, null, null];
    });
    const tap = async (index) => {
      await page.evaluate((button) => window.__probePad.press(button), index);
      await page.waitForTimeout(80);
      await page.evaluate((button) => window.__probePad.release(button), index);
      await page.waitForTimeout(80);
    };
    await openStage(page);
    await cheat(page, 'DRAFT');
    await page.getByRole('button', { name: '런 패널 닫기' }).count();
    await page.waitForTimeout(420);
    await tap(15);
    const focused = await page.evaluate(() => document.activeElement?.classList.contains('draftCard'));
    record('BUG-06 D-pad moves focus onto a draft card', Boolean(focused));
    const draftOpenBeforeA = await page.getByRole('dialog').count();
    await tap(0);
    await page.waitForTimeout(120);
    record('BUG-06 gamepad A confirms the focused draft card', draftOpenBeforeA === 1 && (await page.getByRole('dialog').count()) === 0);

    await cheat(page, 'CLEAR');
    await page.waitForTimeout(420);
    const settlementOpen = await page.getByRole('dialog').count();
    await tap(1);
    await page.waitForTimeout(200);
    const backToMenu = await page.getByRole('heading', { name: '흑백 타격 생존전' }).count();
    record('BUG-06 gamepad B leaves the settlement for the menu', settlementOpen === 1 && backToMenu === 1);

    await tap(15);
    await tap(0);
    const menuFocus = await page.evaluate(() => document.activeElement?.closest('.menuLayer') !== null);
    record('BUG-06 gamepad moves focus in the menu', menuFocus);
    await page.close();
  });

  await probe('TEC-07', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      const pad = { connected: true, index: 0, id: 'probe-pad', axes: [0, 0, 0, 0], buttons, mapping: 'standard', timestamp: 0 };
      window.__probePad = {
        stick(x, y) { pad.axes = [x, y, 0, 0]; },
        press(index) { buttons[index] = { pressed: true, value: 1 }; },
        release(index) { buttons[index] = { pressed: false, value: 0 }; },
      };
      navigator.getGamepads = () => [pad, null, null, null];
    });
    await openStage(page);
    await cheat(page, 'GOD');
    await page.getByRole('button', { name: '런 패널 닫기' }).click();
    const before = await diagnostics(page);
    await page.evaluate(() => window.__probePad.stick(1, 0));
    await page.waitForTimeout(600);
    await page.evaluate(() => window.__probePad.stick(0, 0));
    const after = await diagnostics(page);
    record('TEC-07 gamepad stick moves the player through the input adapter', after.player.x - before.player.x > 40, `moved ${(after.player.x - before.player.x).toFixed(1)} units`);
    await page.evaluate(() => window.__probePad.press(9));
    await page.waitForTimeout(120);
    await page.evaluate(() => window.__probePad.release(9));
    await page.waitForTimeout(120);
    record('TEC-07 gamepad Start pauses the run', (await diagnostics(page)).paused === true);
    await page.close();
  });
} finally {
  await browser.close();
  await server.close();
}

const failed = results.filter((result) => !result.passed);
console.log(`${results.length - failed.length}/${results.length} UI probes passed`);
if (failed.length > 0) process.exitCode = 1;
