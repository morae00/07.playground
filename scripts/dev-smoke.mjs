// Dev-server smoke test (BUG-01): the Vite dev server must serve a styled page with no console errors.
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({
  configFile: path.resolve('vite.config.ts'),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 5175, strictPort: true },
});
let browser;
const failures = [];
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') failures.push(`console.${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 10_000 });
  const styles = await page.evaluate(() => ({
    sheets: document.styleSheets.length,
    rootFont: getComputedStyle(document.documentElement).fontFamily,
    menuDisplay: getComputedStyle(document.querySelector('.menuLayer') ?? document.body).display,
  }));
  if (styles.sheets < 1) failures.push(`no stylesheet applied (${JSON.stringify(styles)})`);
  if (/^"?Times/i.test(styles.rootFont)) failures.push(`root font fell back to ${styles.rootFont}`);
  console.log(`Dev smoke: ${styles.sheets} stylesheet(s), root font ${styles.rootFont}`);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser?.close();
  await server.close();
}
if (failures.length > 0) {
  console.error(`Dev smoke failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
}
