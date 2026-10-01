// Browser regression probes (BUG-04, BUG-05, BUG-06, TEC-07, TEC-08, TEC-14, TEC-15, CON-02, CON-04, CON-07, SYS-08, AUD-01, FX-03, UI-02, UI-03, UI-04, UI-05, UI-07, UI-09) against the developer build.
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
  await page.getByRole('button', { name: 'Ch.1 / St.1 출정' }).click();
  await page.waitForTimeout(300);
}

async function cheat(page, code) {
  const opener = page.getByRole('button', { name: '개발 패널 열기' });
  if (await opener.count()) await opener.click();
  const input = page.getByPlaceholder('CODE', { exact: true });
  await input.fill(code);
  await input.press('Enter');
  await page.waitForTimeout(60);
}

const diagnostics = (page) => page.evaluate(() => window.__blacklineDiagnostics?.());

/** Picks the first card of any draft that opened meanwhile (after its 350 ms input guard), so play can go on. */
async function settleDrafts(page) {
  for (let attempt = 0; attempt < 5 && (await page.getByRole('dialog').filter({ has: page.locator('.draftGrid') }).count()) > 0; attempt += 1) {
    await page.waitForTimeout(450);
    await page.keyboard.press('1');
    await page.waitForTimeout(150);
  }
}

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
    await page.getByRole('button', { name: '개발 패널 닫기' }).click();
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
    await page.getByRole('button', { name: '개발 패널 닫기' }).count();
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

    // The first press lands on the start button (UI-07).
    await tap(15);
    const menuFocus = await page.evaluate(() => document.activeElement?.closest('.menuLayer') !== null);
    record('BUG-06 gamepad moves focus in the menu', menuFocus);
    await page.close();
  });

  await probe('CON-02', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await openStage(page);
    await cheat(page, 'CLEAR');
    // The settlement ignores activation for its 0.8 s input guard (UI-05).
    await page.waitForTimeout(900);
    const next = page.getByRole('dialog').getByRole('button', { name: '다음 Stage (Ch.1 / St.2)' });
    const offered = (await next.count()) === 1;
    if (offered) await next.click();
    await page.waitForTimeout(300);
    const badge = await page.locator('.heroLine strong').textContent().catch(() => '');
    record('CON-02 the settlement offers the next stage and starts it', offered && Boolean(badge?.startsWith('Ch.1 / St.2 ')), `badge ${badge?.trim() ?? 'none'}`);
    await page.close();
  });

  await probe('TEC-08', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      if (sessionStorage.getItem('probe-seeded')) return;
      sessionStorage.setItem('probe-seeded', '1');
      const meta = { gold: 4321, xp: 0, level: 3, passivePoints: 0, progress: { chapter: 2, stage: 3 }, upgrades: { attack: 1, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 }, passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 } };
      localStorage.setItem('blackline-survivor-save-v2', JSON.stringify({ version: 2, savedAt: 1, meta, options: { healthBars: 'elite', volume: 0.3, effects: 0.9, damageNumbers: true, screenShake: true, reducedFlash: false, paceMode: 'standard' } }));
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5177/');
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    await page.waitForTimeout(200);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('blackline-survivor-save-v2') ?? '{}'));
    const shownGold = await page.getByText('4,321').count() + await page.getByText('4321').count();
    record('TEC-08 a v2 save keeps its progress and is rewritten as v3', stored.version === 3 && stored.meta?.gold === 4321 && stored.meta?.progress?.chapter === 2 && typeof stored.profile === 'object' && shownGold > 0, `version ${stored.version}, gold ${stored.meta?.gold}`);
    await context.close();
  });

  await probe('TEC-15', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5177/');
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    await page.getByRole('tab', { name: '설정' }).click();
    const box = page.getByRole('textbox', { name: /세이브 글/ });
    const note = page.locator('.saveTransfer [role="status"]');
    await page.getByRole('button', { name: '내보내기', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.saveTransfer [role="status"]')?.textContent);
    const text = await box.inputValue();
    const exported = JSON.parse(text);
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    record('TEC-15 export writes the game\'s entries as one text and copies it', exported.format === 'blackline-survivor-export' && 'blackline-survivor-save-v2' in exported.entries && copied === text, `${Object.keys(exported.entries).length} entries`);

    // A text that is not an export is refused; a changed export asks once more, imports, and reloads.
    const load = page.getByRole('button', { name: /가져오기$/ });
    await box.fill('not an export');
    await load.click();
    await load.click();
    const refused = await note.textContent();
    const save = JSON.parse(exported.entries['blackline-survivor-save-v2']);
    save.meta.gold = 7777;
    exported.entries['blackline-survivor-save-v2'] = JSON.stringify(save);
    await box.fill(JSON.stringify(exported));
    await load.click();
    const asked = await note.textContent();
    await Promise.all([page.waitForEvent('load'), load.click()]);
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    // The wallet groups thousands (4,321); the check reads the number.
    const gold = (await page.locator('.wallet strong').first().innerText()).replace(/,/g, '');
    record('TEC-15 an import is checked, asks once more, then reloads on the imported save', Boolean(refused?.includes('내보낸 세이브 글이 아닙니다') && asked?.includes('한 번 더')) && gold === '7777', `gold ${gold}; ${refused?.slice(0, 16)}`);
    await context.close();
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
    await page.getByRole('button', { name: '개발 패널 닫기' }).click();
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

  await probe('TEC-14 loop', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await openStage(page);
    await cheat(page, 'GOD');
    await page.getByRole('button', { name: '개발 패널 닫기' }).click();
    await page.waitForTimeout(300);
    await cheat(page, 'FAULT');
    const faultDialog = page.getByRole('dialog', { name: '오류로 런을 멈췄습니다' });
    await faultDialog.waitFor({ timeout: 3000 });
    const atFault = await diagnostics(page);
    await page.waitForTimeout(400);
    const later = await diagnostics(page);
    record('TEC-14 a loop fault pauses the run behind a dialog', atFault.paused && later.elapsed === atFault.elapsed && pageErrors.length === 0, `paused ${atFault.paused}, clock ${atFault.elapsed.toFixed(2)} -> ${later.elapsed.toFixed(2)}, page errors ${pageErrors.length}`);
    await faultDialog.getByRole('button', { name: '로그 복사' }).click();
    await page.waitForTimeout(100);
    const report = await page.evaluate(() => navigator.clipboard.readText());
    record('TEC-14 the copied report names the scene and the error', /error report/.test(report) && /scene: Ch\.1 \/ St\.1/.test(report) && /loop: Error: Injected loop fault/.test(report));
    await faultDialog.getByRole('button', { name: '이어서 시도' }).click();
    const pauseDialog = page.getByRole('dialog', { name: '일시정지' });
    await pauseDialog.waitFor({ timeout: 2000 });
    await pauseDialog.getByRole('button', { name: '계속하기' }).click();
    await page.waitForTimeout(500);
    const resumed = await diagnostics(page);
    record('TEC-14 retrying comes back paused, then the run continues', !resumed.paused && resumed.elapsed > atFault.elapsed + 0.2, `clock ${resumed.elapsed.toFixed(2)}`);
    await cheat(page, 'FAULT');
    await faultDialog.waitFor({ timeout: 3000 });
    await faultDialog.getByRole('button', { name: '메뉴로' }).click();
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 2000 });
    record('TEC-14 the fault dialog can leave for the menu', (await diagnostics(page)) === null);
    await context.close();
  });

  await probe('TEC-14 render', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    await openStage(page);
    await cheat(page, 'UIFAULT');
    const recovery = page.getByRole('alertdialog', { name: '화면을 그리다 문제가 생겼습니다' });
    await recovery.waitFor({ timeout: 3000 });
    await recovery.getByRole('button', { name: '로그 복사' }).click();
    await page.waitForTimeout(100);
    const report = await page.evaluate(() => navigator.clipboard.readText());
    record('TEC-14 a render error shows the recovery screen with its log', /render: Error: Injected render fault/.test(report));
    await recovery.getByRole('button', { name: '메뉴로 돌아가기' }).click();
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 3000 });
    await page.getByRole('button', { name: 'Ch.1 / St.1 출정' }).click();
    await page.waitForTimeout(500);
    const running = await diagnostics(page);
    record('TEC-14 returning to the menu remounts the app and a new run plays', running && !running.paused && running.elapsed > 0.2, running ? `clock ${running.elapsed.toFixed(2)}` : 'no engine');
    await context.close();
  });

  await probe('TEC-14 art', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('**/assets/atlas/common-0.png', (route) => route.abort());
    await openStage(page);
    await page.waitForFunction(() => document.documentElement.dataset.sprites !== undefined, undefined, { timeout: 5000 });
    const sprites = await page.evaluate(() => document.documentElement.dataset.sprites);
    const banner = page.getByRole('status').filter({ hasText: '캐릭터 그림을 불러오지 못해' });
    await banner.waitFor({ timeout: 3000 });
    await page.waitForTimeout(400);
    const running = await diagnostics(page);
    record('TEC-14 missing art falls back to vectors with a notice, and the run plays', sprites === 'fallback' && running && !running.paused && running.elapsed > 0.2, `sprites ${sprites}`);
    await banner.getByRole('button', { name: '닫기' }).click();
    record('TEC-14 the notice can be dismissed', (await banner.count()) === 0);
    await page.close();
  });

  await probe('FX-03', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await openStage(page);
    await cheat(page, 'KO');
    await page.getByRole('button', { name: '개발 패널 닫기' }).click();
    const settlement = page.getByRole('dialog').filter({ hasText: '쓰러짐' });
    // The run ends on the next step; 300 ms in, the 700 ms death moment is still on the canvas.
    await page.waitForTimeout(300);
    const earlyDialogs = await settlement.count();
    await page.getByRole('button', { name: '게임 일시정지' }).click();
    const pausedDuringMoment = await page.getByRole('dialog', { name: '일시정지' }).count();
    await settlement.waitFor({ timeout: 3000 });
    record('FX-03 the death moment plays before the settlement, and cannot be paused', earlyDialogs === 0 && pausedDuringMoment === 0, `${earlyDialogs} settlement and ${pausedDuringMoment} pause dialogs during the moment`);
    await page.close();
  });

  await probe('AUD-01', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      const Native = window.AudioContext;
      window.__audioContexts = 0;
      window.AudioContext = class extends Native {
        constructor(...args) {
          super(...args);
          window.__audioContexts += 1;
        }
      };
    });
    await openStage(page);
    await cheat(page, 'GOD');
    await page.getByRole('button', { name: '개발 패널 닫기' }).click();
    // Double speed until a crowd has gathered (about 20 s of play), then clear it in one frame.
    await page.getByRole('button', { name: /게임 속도/ }).click();
    await page.waitForFunction(() => window.__blacklineDiagnostics?.().enemies >= 8, undefined, { timeout: 15000 });
    // A level-up draft may have opened while the crowd gathered; it would block the cheat panel.
    await settleDrafts(page);
    const playing = await diagnostics(page);
    record('AUD-01 a run plays through one running context with a limiter', playing.audio.contexts === 1 && playing.audio.state === 'running' && playing.audio.limiter && playing.audio.started > 0, `state ${playing.audio.state}, ${playing.audio.started} voices started`);
    await cheat(page, 'NUKE');
    const cleared = await diagnostics(page);
    const spaced = cleared.audio.spaced - playing.audio.spaced;
    record('AUD-01 clearing the screen at once stays under the voice cap', spaced >= 5 && cleared.audio.peak <= 16, `${playing.enemies} enemies before, ${spaced} cues spaced out, peak ${cleared.audio.peak} voices`);
    // The cleared crowd's XP can open a draft, which also closes the developer panel.
    await settleDrafts(page);
    const closer = page.getByRole('button', { name: '개발 패널 닫기' });
    if (await closer.count()) await closer.click();
    // Past the 30 ms spacing of the panel button's own click cue.
    await page.waitForTimeout(120);
    const beforeClick = (await diagnostics(page)).audio.started;
    await page.getByRole('button', { name: '게임 일시정지' }).click();
    await page.waitForTimeout(100);
    record('AUD-01 a button click plays a ui cue', (await diagnostics(page)).audio.started > beforeClick);
    const pauseDialog = page.getByRole('dialog', { name: '일시정지' });
    await pauseDialog.getByRole('button', { name: 'Stage 메뉴' }).click();
    // Giving up settles the run as a defeat (CON-04); the settlement then leads back to the menu.
    await page.getByRole('button', { name: '포기하고 정산' }).click();
    // Past the death moment and the settlement's input guard, which ignores clicks at first.
    await page.getByRole('dialog').getByRole('button', { name: '메뉴로' }).waitFor();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: '메뉴로' }).click();
    await page.getByRole('button', { name: 'Ch.1 / St.1 출정' }).click();
    await page.waitForTimeout(500);
    const second = await diagnostics(page);
    const constructed = await page.evaluate(() => window.__audioContexts);
    record('AUD-01 the next run reuses the same audio context', constructed === 1 && second.audio.contexts === 1 && second.audio.state === 'running', `${constructed} contexts constructed`);
    await page.close();
  });

  await probe('UI-02', async () => {
    // Share of the viewport the HUD covers, on a 4 px grid: element boxes for bars, art, chips, and buttons, and the
    // glyph boxes of text; and how many covered cells fall in the centre 40% of the screen.
    const coverage = () => {
      const cell = 4;
      const cols = Math.ceil(innerWidth / cell);
      const rows = Math.ceil(innerHeight / cell);
      const grid = new Uint8Array(cols * rows);
      const mark = (rect) => {
        if (rect.width <= 1 || rect.height <= 1) return;
        for (let y = Math.max(0, Math.floor(rect.top / cell)); y < Math.min(rows, Math.ceil(rect.bottom / cell)); y += 1) {
          for (let x = Math.max(0, Math.floor(rect.left / cell)); x < Math.min(cols, Math.ceil(rect.right / cell)); x += 1) grid[y * cols + x] = 1;
        }
      };
      const boxes = '.xpStrip, .artPortrait, .levelSeal, .hpBar, .skillSlot, .objectiveChip, .hudChip, button, .bossHp, .effectItem, .recordState';
      for (const root of document.querySelectorAll('.gameHud, .xpStrip, .bossBar, .effectRack')) {
        for (const element of [root, ...root.querySelectorAll('*')]) if (element.matches(boxes)) mark(element.getBoundingClientRect());
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent.trim() || node.parentElement.closest('.srOnly')) continue;
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) mark(rect);
        }
      }
      let covered = 0;
      let centre = 0;
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          if (!grid[y * cols + x]) continue;
          covered += 1;
          if (x * cell >= innerWidth * 0.3 && x * cell < innerWidth * 0.7 && y * cell >= innerHeight * 0.3 && y * cell < innerHeight * 0.7) centre += 1;
        }
      }
      return { share: covered / grid.length, centre };
    };
    for (const [width, height, limit] of [[1440, 900, 0.07], [1024, 720, 0.12]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await openStage(page);
      await cheat(page, 'GOD');
      for (let round = 0; round < 6; round += 1) {
        await cheat(page, 'DRAFT');
        await page.waitForTimeout(450);
        await page.keyboard.press('1');
        await page.waitForTimeout(150);
      }
      const closer = page.getByRole('button', { name: '개발 패널 닫기' });
      if (await closer.count()) await closer.click();
      await page.waitForTimeout(300);
      const hud = await page.evaluate(coverage);
      const slots = await page.locator('.skillSlot .artSlot').count();
      record(`UI-02 ${width}x${height} the HUD covers at most ${Math.round(limit * 100)}% of the screen and leaves the centre clear`, hud.share <= limit && hud.centre === 0, `${(hud.share * 100).toFixed(2)}% covered, ${hud.centre} centre cells, ${slots} skill slots`);
      await page.close();
    }
  });

  await probe('UI-04', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:5177/');
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    await page.getByRole('tab', { name: '설정' }).click();
    const flash = page.getByRole('checkbox', { name: '섬광 감소' });
    const flashBefore = await flash.isChecked();
    await flash.click();
    record('UI-04 the menu has the settings screen, so reduced flash can be set before any run', (await flash.isChecked()) !== flashBefore);
    await flash.click();

    await openStage(page);
    await cheat(page, 'GOD');
    await cheat(page, 'COIN');
    const closer = page.getByRole('button', { name: '개발 패널 닫기' });
    if (await closer.count()) await closer.click();
    await page.waitForTimeout(400);
    await page.keyboard.press('p');
    const hub = page.getByRole('dialog', { name: '일시정지' });
    await hub.waitFor();
    const frozen = await diagnostics(page);
    await page.waitForTimeout(600);
    record('UI-04 the run stays stopped while the pause hub is open', (await diagnostics(page)).elapsed === frozen.elapsed, `elapsed ${frozen.elapsed.toFixed(2)} s`);
    const tabs = await hub.getByRole('tab').allTextContents();
    record('UI-04 the pause hub has the build, shop, settings, and controls tabs', tabs.join(',') === '빌드,강화,설정,조작', tabs.join(','));
    await hub.getByRole('tab', { name: '강화' }).click();
    const before = (await diagnostics(page)).player.hp;
    await hub.getByRole('button', { name: /^체력 Lv\./ }).click();
    const bought = (await diagnostics(page)).player.hp;
    record('UI-04 a health upgrade bought while paused adds no health yet (G6)', bought === before, `${before.toFixed(1)} -> ${bought.toFixed(1)}`);
    await hub.getByRole('button', { name: '계속하기', exact: true }).click();
    await page.waitForTimeout(1000);
    const early = (await diagnostics(page)).player.hp - before;
    await page.waitForTimeout(3000);
    const late = (await diagnostics(page)).player.hp - before;
    record('UI-04 the bought health comes back over about three seconds after resuming (G6)', early > 2 && early < 15 && late >= 19.9, `+${early.toFixed(1)} after 1 s, +${late.toFixed(1)} after 4 s`);
    await page.close();
  });

  await probe('UI-09', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await openStage(page);
    const hint = page.locator('.hintToast');
    await page.waitForTimeout(400);
    const first = (await hint.count()) ? await hint.textContent() : '';
    record('UI-09 a first 1-1 run opens with the movement hint, without pausing', Boolean(first?.includes('공격은 자동')) && !(await diagnostics(page)).paused, first ?? 'no hint');
    const box = (await hint.count()) ? await hint.boundingBox() : null;
    record('UI-09 the hint stays out of the centre 40% of the screen', Boolean(box) && box.y >= 900 * 0.7, box ? `top ${box.y.toFixed(0)} px` : 'no hint');
    await page.keyboard.press('p');
    await page.getByRole('dialog', { name: '일시정지' }).getByRole('button', { name: 'Stage 메뉴' }).click();
    await page.getByRole('button', { name: '포기하고 정산' }).click();
    // Past the death moment and the settlement's input guard, which ignores clicks at first.
    await page.getByRole('dialog').getByRole('button', { name: '메뉴로' }).waitFor();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: '메뉴로' }).click();
    await page.getByRole('button', { name: 'Ch.1 / St.1 출정' }).click();
    await page.waitForTimeout(700);
    const again = (await hint.count()) ? await hint.textContent() : '';
    record('UI-09 a hint shows once per save', !again?.includes('공격은 자동'), again || 'no hint');
    await page.close();
  });

  await probe('CON-04', async () => {
    // A run saved as it pauses survives a reload: the menu offers it, and resuming lands on the very same state.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await openStage(page);
    await page.keyboard.down('d');
    await page.waitForTimeout(900);
    await page.keyboard.up('d');
    await page.keyboard.down('s');
    await page.waitForTimeout(700);
    await page.keyboard.up('s');
    await settleDrafts(page);
    await page.keyboard.press('p');
    await page.getByRole('dialog', { name: '일시정지' }).waitFor();
    await page.waitForTimeout(300);
    const before = await diagnostics(page);
    await page.reload();
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    const strip = page.getByRole('region', { name: '중단한 런' });
    record('CON-04 after a reload the menu offers the run left in play', (await strip.count()) === 1, (await strip.count()) ? await strip.innerText() : 'no strip');
    await strip.getByRole('button', { name: '이어하기' }).click();
    await page.getByRole('dialog', { name: '일시정지' }).waitFor({ timeout: 20000 });
    const after = await diagnostics(page);
    const same = before && after && before.elapsed === after.elapsed && before.player.x === after.player.x && before.player.y === after.player.y && before.player.hp === after.player.hp && before.enemies === after.enemies;
    record('CON-04 resuming lands on the same state, paused', Boolean(same) && after.paused, `elapsed ${before?.elapsed} -> ${after?.elapsed}, player ${before?.player.x.toFixed(1)},${before?.player.y.toFixed(1)} -> ${after?.player.x.toFixed(1)},${after?.player.y.toFixed(1)}, enemies ${before?.enemies} -> ${after?.enemies}`);
    await page.close();
  });

  await probe('CON-07', async () => {
    // Stage records: three stars on a node and in the stage detail, and the longest run of a stage not yet cleared.
    const page = await browser.newPage({ viewport: { width: 1024, height: 720 } });
    await page.goto('http://127.0.0.1:5177/');
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    await page.evaluate(() => {
      const key = 'blackline-survivor-save-v2';
      const save = JSON.parse(localStorage.getItem(key));
      save.meta.progress = { chapter: 1, stage: 6 };
      // As a save from before CON-07: no codex chapters and no career totals, so both start from the records.
      save.profile.codex = { enemies: [], bosses: [], skills: [] };
      delete save.profile.stats;
      save.profile.stageRecords = {
        '1-4': { attempts: 2, clears: 1, bestKills: 300, bestClearSeconds: 470, bonus: true, assisted: false, bestSurvivalSeconds: 480, noHit: false, lowDamage: true, swift: false },
        '1-5': { attempts: 1, clears: 0, bestKills: 120, bestClearSeconds: null, bonus: false, assisted: false, bestSurvivalSeconds: 192, noHit: false, lowDamage: false, swift: false },
      };
      localStorage.setItem(key, JSON.stringify(save));
    });
    await page.reload();
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    const node = await page.locator('.stageNode').nth(3).locator('.nodeStar').innerText().catch(() => '');
    await page.locator('.stageNode').nth(3).click();
    const stars = await page.locator('.stageStars span.on').count();
    record('CON-07 a stage with all three stars shows them on its node and in its detail', node === '★★★' && stars === 3, `node ${node || 'none'}, detail ${stars}`);
    await page.locator('.stageNode').nth(4).click();
    const best = await page.locator('.stageFacts').innerText();
    record('CON-07 a stage not yet cleared shows its longest run', best.includes('최고 생존 03:12'), best.split('\n').find((line) => line.includes('최고')) ?? 'none');
    const fits = await page.evaluate(() => document.scrollingElement.scrollHeight <= window.innerHeight + 1);
    record('CON-07 the menu still fits 1024x720 without scrolling', fits);

    // The codex: the nav counts what was found, found entries open their page, the rest stay silhouettes.
    const nav = await page.getByRole('tab', { name: /도감/ }).textContent();
    await page.getByRole('tab', { name: /도감/ }).click();
    const panel = page.locator('#menu-panel-codex');
    await panel.getByRole('button', { name: /먹귀/ }).click();
    const found = await panel.locator('.codexEntry.found').count();
    const unknown = await panel.locator('.codexEntry.unknown').count();
    await panel.locator('.codexEntry.found').first().click();
    const page1 = await panel.locator('.codexDetail').innerText();
    record('CON-07 the codex counts found entries, and a found enemy opens its page', /발견 \d+\/66/.test(nav) && found === 4 && unknown === 16 && page1.includes('벽보 들개'), `${nav}, ${found} found, ${unknown} unknown, ${page1.split('\n')[0]}`);
    const career = (await panel.locator('.careerStats').innerText()).replace(/\s+/g, ' ');
    record('CON-07 the codex shows the career totals', career.includes('출정 3') && career.includes('0시간 7분'), career);

    // Achievements: the older save has already met two goals; their titles and trails can be worn.
    const notice = await page.getByRole('status').filter({ hasText: '업적 달성' }).innerText().catch(() => '');
    record('CON-07 an older save earns the achievements its records show', notice.includes('첫 돌파') && notice.includes('흠 없는 한 장'), notice || 'no notice');
    await panel.getByRole('button', { name: /^업적/ }).click();
    const first = panel.locator('.achievementList li').first();
    await first.getByRole('button', { name: '착용' }).click();
    const title = await page.locator('.walletTitle').innerText().catch(() => '');
    const buy = await panel.locator('.achievementList li').nth(1).getByRole('button').getAttribute('aria-disabled');
    record('CON-07 a title earned can be worn, and a reward not earned is for sale', title === '먹선 필경사' && buy === 'true', `title ${title || 'none'}, buy disabled ${buy}`);
    await page.close();
  });

  await probe('SYS-08', async () => {
    // The build depth experiment for playtests: DEPTH in the menu's cheat input turns it on for the next run. An
    // account at level 16 has two tokens a stage.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:5177/');
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    await page.evaluate(() => {
      const key = 'blackline-survivor-save-v2';
      const save = JSON.parse(localStorage.getItem(key));
      save.meta.level = 16;
      localStorage.setItem(key, JSON.stringify(save));
    });
    await page.reload();
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    const devToggle = page.getByRole('checkbox', { name: '개발자 모드: 모든 Stage 접근' });
    if (!(await devToggle.isChecked())) await devToggle.check();
    const menuCheat = page.getByLabel('Cheat code');
    await menuCheat.fill('DEPTH');
    await menuCheat.press('Enter');
    record('SYS-08 DEPTH turns the experiment on for the next run', (await page.getByText('BUILD DEPTH ON (next run)').count()) === 1);
    await page.getByRole('button', { name: 'Ch.1 / St.1 출정' }).click();
    await page.waitForTimeout(300);
    await cheat(page, 'DRAFT');
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const slots = await dialog.locator('.buildLabel small').innerText();
    const tokens = await dialog.locator('.draftTokens').innerText();
    record('SYS-08 the draft counts the slots and offers two tokens', slots.includes('액티브 1/6') && tokens.includes('교체권 2'), `${slots} | ${tokens.split('\n')[0]}`);
    // Past the draft's input guard, R redraws the cards (a new draft, counted by the tokens left).
    await page.waitForTimeout(400);
    await page.keyboard.press('r');
    await page.waitForTimeout(450);
    const left = await page.getByRole('dialog').locator('.draftTokens').innerText();
    record('SYS-08 R redraws the cards and spends a token', left.includes('교체권 1'), left.split('\n')[0]);
    await page.close();
  });

  await probe('UI-03', async () => {
    for (const [width, height] of [[1440, 900], [1024, 720]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await openStage(page);
      await cheat(page, 'DRAFT');
      await page.waitForTimeout(450);
      const draft = await page.evaluate(async () => {
        const dialog = document.querySelector('.draftBox');
        const cards = [...dialog.querySelectorAll('.draftCard')];
        const box = dialog.getBoundingClientRect();
        const left = Math.min(...cards.map((card) => card.getBoundingClientRect().left)) - box.left;
        const right = box.right - Math.max(...cards.map((card) => card.getBoundingClientRect().right));
        const sheets = [...new Set(cards.map((card) => getComputedStyle(card.querySelector('.artTile')).backgroundImage))];
        const widths = await Promise.all(sheets.map((value) => {
          const image = new Image();
          image.src = value.replace(/^url\("?|"?\)$/g, '');
          return image.decode().then(() => image.naturalWidth, () => 0);
        }));
        // UI-01 baseline (UI-08): no text under 13 px.
        const small = [...dialog.querySelectorAll('*')]
          .filter((node) => [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()))
          .filter((node) => parseFloat(getComputedStyle(node).fontSize) < 13)
          .map((node) => `${node.className || node.tagName} ${getComputedStyle(node).fontSize}`);
        return { cards: cards.length, left, right, widths, small, scrolls: dialog.scrollHeight > dialog.clientHeight + 1 };
      });
      const size = `${width}x${height}`;
      record(`UI-03 ${size} three draft cards sit centred`, draft.cards === 3 && Math.abs(draft.left - draft.right) <= 2, `margins ${draft.left.toFixed(1)} / ${draft.right.toFixed(1)}`);
      record(`UI-03 ${size} every card shows its baked tile`, draft.widths.length > 0 && draft.widths.every((sheetWidth) => sheetWidth > 0), `${draft.widths.length} sheet(s)`);
      record(`UI-03 ${size} no draft text under 13 px`, draft.small.length === 0, draft.small.slice(0, 3).join(', '));
      record(`UI-03 ${size} the draft fits without scrolling`, !draft.scrolls);
      await page.close();
    }
  });

  await probe('UI-05', async () => {
    for (const [width, height] of [[1440, 900], [1024, 720]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await openStage(page);
      // A few seconds of play, so the settlement has kills and damage to show.
      await page.waitForTimeout(6000);
      await settleDrafts(page);
      await cheat(page, 'CLEAR');
      const dialog = page.getByRole('dialog', { name: 'Stage 돌파' });
      await dialog.waitFor({ timeout: 3000 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(120);
      const heldByGuard = (await dialog.count()) === 1;
      // Past the 0.8 s input guard and the 0.7 s gold count-up.
      await page.waitForTimeout(900);
      const shown = await page.evaluate(() => {
        const box = document.querySelector('.settlementBox');
        const portrait = box.querySelector('.settlementFace .artPortrait');
        // UI-01 baseline (UI-08): no text under 13 px.
        const small = [...box.querySelectorAll('*')]
          .filter((node) => [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()))
          .filter((node) => parseFloat(getComputedStyle(node).fontSize) < 13)
          .map((node) => `${node.className || node.tagName} ${getComputedStyle(node).fontSize}`);
        return {
          portrait: portrait?.dataset.art ?? '',
          portraitImage: portrait ? getComputedStyle(portrait).backgroundImage : 'none',
          gold: box.querySelector('.settlementGold b')?.textContent ?? '',
          parts: box.querySelectorAll('.settlementGold li').length,
          bars: box.querySelectorAll('.settlementDamage li').length,
          small,
          scrolls: box.scrollHeight > box.clientHeight + 1,
        };
      });
      const size = `${width}x${height}`;
      record(`UI-05 ${size} Enter inside the input guard does nothing`, heldByGuard);
      record(`UI-05 ${size} the settlement shows the victory portrait, the gold's parts, and the damage bars`, shown.portrait === 'hero-victory' && shown.portraitImage !== 'none' && shown.parts > 0 && shown.bars > 0, `gold ${shown.gold}, ${shown.parts} part(s), ${shown.bars} bar(s)`);
      record(`UI-05 ${size} no settlement text under 13 px, and it fits without scrolling`, shown.small.length === 0 && !shown.scrolls, shown.small.slice(0, 3).join(', '));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const badge = await page.locator('.heroLine strong').textContent().catch(() => '');
      record(`UI-05 ${size} Enter after the guard starts the next stage`, Boolean(badge?.startsWith('Ch.1 / St.2 ')), `badge ${badge?.trim() ?? 'none'}`);
      await page.close();
    }
  });
  await probe('UI-07', async () => {
    // A virtual pad drives the whole loop: start 1-1, move, pick a draft card, use the pause hub and its tabs, and
    // take the settlement to 1-2. Only the draft and the stage end are forced, by the developer cheats.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      const pad = { connected: true, index: 0, id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e)', axes: [0, 0, 0, 0], buttons, mapping: 'standard', timestamp: 0 };
      window.__probePad = {
        press(index) { buttons[index] = { pressed: true, value: 1 }; },
        release(index) { buttons[index] = { pressed: false, value: 0 }; },
        stick(x, y) { pad.axes[0] = x; pad.axes[1] = y; },
        rename(id) { pad.id = id; },
      };
      navigator.getGamepads = () => [pad, null, null, null];
    });
    const tap = async (index) => {
      await page.evaluate((button) => window.__probePad.press(button), index);
      await page.waitForTimeout(80);
      await page.evaluate((button) => window.__probePad.release(button), index);
      await page.waitForTimeout(100);
    };
    const [A, B, LB, RB, START, RIGHT] = [0, 1, 4, 5, 9, 15];
    await page.goto('http://127.0.0.1:5177/');
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    await tap(A);
    const focusedStart = await page.evaluate(() => document.activeElement?.textContent ?? '');
    await tap(A);
    await page.waitForTimeout(400);
    const badge = async () => (await page.locator('.heroLine strong').textContent().catch(() => '')) ?? '';
    const started = (await badge()).startsWith('Ch.1 / St.1 ');
    record('UI-07 A lands on the start button, then starts 1-1', focusedStart.includes('Ch.1 / St.1') && started, `focus "${focusedStart.trim()}", badge ${await badge()}`);

    const before = (await diagnostics(page)).player.x;
    await page.evaluate(() => window.__probePad.stick(1, 0));
    await page.waitForTimeout(700);
    await page.evaluate(() => window.__probePad.stick(0, 0));
    record('UI-07 the stick moves the hero in play', (await diagnostics(page)).player.x > before + 20);

    // Typing the cheat hands the glyphs to the keyboard; the first pad press takes them back.
    await cheat(page, 'DRAFT');
    await page.waitForTimeout(450);
    await tap(RIGHT);
    await tap(RIGHT);
    const keysLine = await page.locator('#draft-dialog-keys').textContent();
    const secondCard = await page.evaluate(() => [...document.querySelectorAll('.draftCard')].indexOf(document.activeElement));
    await tap(A);
    await page.waitForTimeout(150);
    const draftClosed = (await page.locator('.draftGrid').count()) === 0;
    record('UI-07 the D-pad walks the draft cards and A picks one', secondCard === 1 && draftClosed, `card ${secondCard}`);
    record('UI-07 the draft names the pad glyphs', Boolean(keysLine?.includes('D-pad') && keysLine.includes('A')), keysLine ?? '');

    await tap(START);
    await page.waitForTimeout(200);
    const hub = page.getByRole('dialog', { name: '일시정지' });
    const hubOpen = (await hub.count()) === 1;
    await tap(RB);
    const afterRb = await hub.getByRole('tab', { selected: true }).textContent();
    await tap(LB);
    const afterLb = await hub.getByRole('tab', { selected: true }).textContent();
    await tap(B);
    await page.waitForTimeout(200);
    const resumed = (await hub.count()) === 0;
    record('UI-07 Start opens the pause hub, RB and LB switch its tabs, B resumes', hubOpen && afterRb === '강화' && afterLb === '빌드' && resumed, `${afterRb} / ${afterLb}`);

    await cheat(page, 'CLEAR');
    await page.getByRole('dialog', { name: 'Stage 돌파' }).waitFor({ timeout: 3000 });
    await page.waitForTimeout(900);
    // A small stick nudge uses the pad without navigating, so the glyphs follow it.
    const nudge = async () => {
      await page.evaluate(() => window.__probePad.stick(0.4, 0));
      await page.waitForTimeout(80);
      await page.evaluate(() => window.__probePad.stick(0, 0));
      await page.waitForTimeout(80);
    };
    await nudge();
    const glyphText = await page.locator('.modalActions .glyph').textContent();
    await page.evaluate(() => window.__probePad.rename('DualSense Wireless Controller (Vendor: 054c)'));
    await nudge();
    const psGlyph = await page.locator('.modalActions .glyph').textContent();
    await tap(A);
    const focusedNext = await page.evaluate(() => document.activeElement?.textContent ?? '');
    await tap(A);
    await page.waitForTimeout(400);
    record('UI-07 the settlement shows the pad glyph (A, then ✕ on a PlayStation pad)', glyphText === 'A' && psGlyph === '✕', `${glyphText} / ${psGlyph}`);
    record('UI-07 A reaches the next stage from the settlement', focusedNext.startsWith('다음 Stage') && (await badge()).startsWith('Ch.1 / St.2 '), `badge ${await badge()}`);
    await page.close();
  });

} finally {
  await browser.close();
  await server.close();
}

const failed = results.filter((result) => !result.passed);
console.log(`${results.length - failed.length}/${results.length} UI probes passed`);
if (failed.length > 0) process.exitCode = 1;
