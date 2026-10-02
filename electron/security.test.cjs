const assert = require('node:assert/strict');
const test = require('node:test');
const packageJson = require('../package.json');
const developerBuild = require('../electron-builder.developer.cjs');
const {
  CONTENT_SECURITY_POLICY,
  focusPrimaryWindow,
  isAllowedAppNavigation,
  isAllowedExternalUrl,
  withContentSecurityPolicy,
} = require('./security.cjs');

test('external navigation permits credential-free HTTPS only', () => {
  assert.equal(isAllowedExternalUrl('https://example.com/docs?q=1'), true);
  assert.equal(isAllowedExternalUrl('https://user:pass@example.com'), false);
  assert.equal(isAllowedExternalUrl('http://example.com'), false);
  assert.equal(isAllowedExternalUrl('file:///tmp/index.html'), false);
  assert.equal(isAllowedExternalUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedExternalUrl('not a url'), false);
});

test('app navigation is constrained to the app:// entry page (TEC-15)', () => {
  const entry = 'app://game/index.html';
  assert.equal(isAllowedAppNavigation('app://game/index.html', entry), true);
  assert.equal(isAllowedAppNavigation('app://game/index.html#settings', entry), true);
  assert.equal(isAllowedAppNavigation('app://game/index.html?next=1', entry), false);
  assert.equal(isAllowedAppNavigation('app://game/storage-bridge.html', entry), false);
  assert.equal(isAllowedAppNavigation('app://other/index.html', entry), false);
  assert.equal(isAllowedAppNavigation('file:///tmp/blackline/dist/index.html', entry), false);
  assert.equal(isAllowedAppNavigation('https://example.com', entry), false);
});

test('CSP blocks remote scripts, objects, forms and framing', () => {
  assert.match(CONTENT_SECURITY_POLICY, /script-src 'self'/);
  assert.match(CONTENT_SECURITY_POLICY, /object-src 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /form-action 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /media-src 'self'/, 'media only from the app (TEC-09)');
  assert.match(CONTENT_SECURITY_POLICY, /worker-src 'none'/, 'no workers (TEC-09)');
  assert.deepEqual(withContentSecurityPolicy({ Existing: ['value'] }), {
    Existing: ['value'],
    'Content-Security-Policy': [CONTENT_SECURITY_POLICY],
  });
});

test("the page's meta policy matches the app's header policy, which adds only frame-ancestors (TEC-09)", () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const meta = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
  assert.ok(meta, 'index.html carries a meta policy');
  const directives = (policy) => policy.split(';').map((part) => part.trim()).filter(Boolean);
  assert.deepEqual(directives(meta[1]), directives(CONTENT_SECURITY_POLICY).filter((directive) => !directive.startsWith('frame-ancestors')));
});

test('release metadata exposes isolated arm64 and x64 package paths', () => {
  assert.equal(packageJson.build.appId, 'com.blackline.survivor');
  assert.equal(packageJson.build.mac.hardenedRuntime, true);
  assert.equal(packageJson.build.mac.notarize, true);
  assert.equal(packageJson.build.mac.icon, 'build/icon.png');
  assert.deepEqual(packageJson.build.mac.target[0].arch, ['arm64', 'x64']);
  assert.match(packageJson.scripts['package:mac:arm64'], /--arm64/);
  assert.match(packageJson.scripts['package:mac:x64'], /--x64/);
  assert.match(packageJson.scripts['package:mac:release'], /dmg zip --arm64 --x64/);
  assert.equal(packageJson.scripts['verify:mac:release'], 'node scripts/verify-macos-release.mjs');
});

test('developer app uses an isolated identity, renderer, and local output', () => {
  assert.equal(developerBuild.appId, 'com.blackline.survivor.dev');
  assert.equal(developerBuild.productName, 'Blackline Survivor Dev');
  assert.equal(developerBuild.electronDist, 'node_modules/electron/dist');
  assert.equal(developerBuild.directories.output, 'release-developer');
  assert.equal(developerBuild.extraMetadata.main, 'electron/main.developer.cjs');
  assert.equal(developerBuild.extraMetadata.name, 'blackline-survivor-dev');
  assert.ok(developerBuild.files.includes('dist-developer/**/*'));
  assert.ok(!developerBuild.files.includes('dist/**/*'));
  assert.equal(developerBuild.mac.identity, null);
  assert.equal(developerBuild.mac.notarize, false);
  assert.equal(developerBuild.mac.icon, 'build/icon.icns');
  assert.deepEqual(developerBuild.electronFuses, packageJson.build.electronFuses);
  assert.match(packageJson.scripts['package:mac:developer'], /electron-builder\.developer\.cjs/);
  assert.match(packageJson.scripts['package:mac:developer'], /sign:mac:developer/);
  assert.match(packageJson.scripts['sign:mac:developer'], /codesign --force --deep --sign -/);
});

test('a second instance restores, shows, and focuses the primary window', () => {
  const calls = [];
  const window = {
    isMinimized: () => true,
    isVisible: () => false,
    restore: () => calls.push('restore'),
    show: () => calls.push('show'),
    focus: () => calls.push('focus'),
  };
  assert.equal(focusPrimaryWindow([window]), true);
  assert.deepEqual(calls, ['restore', 'show', 'focus']);
  assert.equal(focusPrimaryWindow([]), false);
});

test('electron fuses disable Node escape hatches and require the packaged ASAR', () => {
  assert.deepEqual(packageJson.build.electronFuses, {
    runAsNode: false,
    enableCookieEncryption: true,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
    loadBrowserProcessSpecificV8Snapshot: false,
    grantFileProtocolExtraPrivileges: true,
  });
});
