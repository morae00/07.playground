import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { foldRuleReads } from './scripts/lib/fold-rules.mjs';
import { REMASTER_RULES } from './src/game/rules';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// Vite's dev server injects <style> tags, the React refresh preamble, and an HMR websocket. The shipped
// Content-Security-Policy (index.html) blocks all three, so the dev server alone relaxes it (BUG-01).
// Production and developer builds keep the strict policy unchanged.
function devContentSecurityPolicy(): Plugin {
  return {
    name: 'blackline-dev-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html
        .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
        .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
        .replace("connect-src 'self'", "connect-src 'self' ws: wss:");
    },
  };
}

// Content tables (TEC-05): the modules in src/content/data are data, and the budget measures code. A build evaluates
// their index the way tests and tools import it, emits it as assets/content/tables.json, and swaps each module for a
// read of that file (src/content/tableRuntime.ts). The dev server serves the modules as they are.
function contentTables(): Plugin {
  const dataDir = fileURLToPath(new URL('./src/content/data', import.meta.url));
  const runtime = fileURLToPath(new URL('./src/content/tableRuntime.ts', import.meta.url));
  let tables = '';
  return {
    name: 'blackline-content-tables',
    apply: 'build',
    async buildStart() {
      const result = await esbuild({ entryPoints: [path.join(dataDir, 'index.ts')], bundle: true, format: 'esm', platform: 'neutral', write: false, logLevel: 'error' });
      const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
      tables = JSON.stringify(module.default);
    },
    load(id) {
      if (path.dirname(id) !== dataDir || !id.endsWith('.ts') || path.basename(id) === 'index.ts') return null;
      return `import { table } from ${JSON.stringify(runtime)};\nexport default table(${JSON.stringify(path.basename(id, '.ts'))});\n`;
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'assets/content/tables.json', source: tables });
    },
  };
}

// TEC-05: the app always plays the remaster rules (only tests, the balance harness, and benches switch rule sets), so
// app builds read GameEngine's rule flags as constants and the minifier drops the classic branches. Tests and tools
// build the engine unfolded; scripts/verify-folded-rules.mjs checks the folded one plays the same.
function shippedRules(): Plugin {
  const engine = fileURLToPath(new URL('./src/game/GameEngine.ts', import.meta.url));
  return {
    name: 'blackline-shipped-rules',
    apply: 'build',
    enforce: 'pre',
    transform(code, id) {
      if (id !== engine) return null;
      const folded = foldRuleReads(code, REMASTER_RULES);
      if (folded.count === 0) this.error('GameEngine.ts has no rule reads to fold');
      return { code: folded.code, map: null };
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const packagedDeveloperBuild = command === 'build' && mode === 'developer';
  const developerUiAvailable = command === 'serve' || packagedDeveloperBuild;

  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __DEVELOPER_UI_AVAILABLE__: JSON.stringify(developerUiAvailable),
      __DEVELOPER_UI_DEFAULT_ENABLED__: JSON.stringify(packagedDeveloperBuild),
      __CONTENT_CHECKS__: JSON.stringify(command === 'serve'),
      // AUD-03: the music code ships with a music pack, so a build without one requests nothing and carries none.
      __MUSIC_PACK__: JSON.stringify(existsSync(fileURLToPath(new URL('./public/assets/packs/music/pack.json', import.meta.url)))),
    },
    plugins: [shippedRules(), react(), devContentSecurityPolicy(), contentTables()],
    build: {
      // Electron 43 runs Chromium 142, and the gates run current Chromium. Native class fields and other ES2022
      // syntax are smaller than esbuild's down-levelled helpers (about 1.1 KiB gzip of app JS).
      target: 'es2022',
      rollupOptions: {
        output: {
          // Split third-party runtime code so the bundle budget can track app and vendor growth separately.
          manualChunks(id) {
            if (id.includes('/node_modules/')) return 'vendor';
            return undefined;
          },
        },
      },
    },
  };
});
