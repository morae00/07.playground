import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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
    },
    plugins: [react(), devContentSecurityPolicy()],
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
