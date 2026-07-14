const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const packageJson = require('../package.json');
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

test('app navigation is constrained to the packaged entry file', () => {
  const entry = path.resolve('/tmp/blackline/dist/index.html');
  assert.equal(isAllowedAppNavigation('file:///tmp/blackline/dist/index.html', entry), true);
  assert.equal(isAllowedAppNavigation('file:///tmp/blackline/dist/index.html#settings', entry), true);
  assert.equal(isAllowedAppNavigation('file:///tmp/blackline/dist/index.html?next=1', entry), false);
  assert.equal(isAllowedAppNavigation('file:///tmp/blackline/dist/other.html', entry), false);
  assert.equal(isAllowedAppNavigation('https://example.com', entry), false);
});

test('CSP blocks remote scripts, objects, forms and framing', () => {
  assert.match(CONTENT_SECURITY_POLICY, /script-src 'self'/);
  assert.match(CONTENT_SECURITY_POLICY, /object-src 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /form-action 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'none'/);
  assert.deepEqual(withContentSecurityPolicy({ Existing: ['value'] }), {
    Existing: ['value'],
    'Content-Security-Policy': [CONTENT_SECURITY_POLICY],
  });
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
    loadBrowserProcessSpecificV8Snapshot: true,
    grantFileProtocolExtraPrivileges: true,
  });
});
