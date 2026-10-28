// Which headless engine bundle a balance or soak tool runs (TEC-07). The integration tests and the docs name it
// BLACKLINE_TEST_BUNDLE; older tools read BLACKLINE_ENGINE_BUNDLE. Both are accepted. With neither, the tool falls back
// to the shared bundle that `npm run build:test-bundles` writes, which any other checkout or session may have rebuilt,
// so it says so loudly instead of silently measuring someone else's engine.
export const SHARED_ENGINE_BUNDLE = '/tmp/blackline-survivor-p0/testing.mjs';

/** The bundle path from the environment, or the shared one with a warning on stderr. */
export function resolveEngineBundle(env = process.env, warn = (message) => console.error(message)) {
  const test = env.BLACKLINE_TEST_BUNDLE || undefined;
  const engine = env.BLACKLINE_ENGINE_BUNDLE || undefined;
  if (test && engine && test !== engine) {
    throw new Error(`BLACKLINE_TEST_BUNDLE (${test}) and BLACKLINE_ENGINE_BUNDLE (${engine}) name different bundles; set one of them`);
  }
  if (test ?? engine) return test ?? engine;
  warn([
    '',
    '!!! WARNING: neither BLACKLINE_TEST_BUNDLE nor BLACKLINE_ENGINE_BUNDLE is set.',
    `!!! Running the SHARED bundle ${SHARED_ENGINE_BUNDLE}, whatever source last built it.`,
    '!!! Set BLACKLINE_TEST_BUNDLE to your own build to measure your own engine.',
    '',
  ].join('\n'));
  return SHARED_ENGINE_BUNDLE;
}
