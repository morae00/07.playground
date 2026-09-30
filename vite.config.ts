import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig(({ command, mode }) => {
  const packagedDeveloperBuild = command === 'build' && mode === 'developer';
  const developerUiAvailable = command === 'serve' || packagedDeveloperBuild;

  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __DEVELOPER_UI_AVAILABLE__: JSON.stringify(developerUiAvailable),
      __DEVELOPER_UI_DEFAULT_ENABLED__: JSON.stringify(packagedDeveloperBuild),
    },
    plugins: [react()],
    build: {
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
