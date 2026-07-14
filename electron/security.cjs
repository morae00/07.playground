const { pathToFileURL } = require('node:url');

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isAllowedExternalUrl(value) {
  const url = parseUrl(value);
  return Boolean(
    url
    && url.protocol === 'https:'
    && !url.username
    && !url.password,
  );
}

function isAllowedAppNavigation(value, entryFile) {
  const url = parseUrl(value);
  if (!url || url.protocol !== 'file:' || url.search) return false;
  const expected = new URL(pathToFileURL(entryFile).href);
  url.hash = '';
  return url.href === expected.href;
}

function withContentSecurityPolicy(responseHeaders = {}) {
  return {
    ...responseHeaders,
    'Content-Security-Policy': [CONTENT_SECURITY_POLICY],
  };
}

function focusPrimaryWindow(windows) {
  const window = windows[0];
  if (!window) return false;
  if (window.isMinimized()) window.restore();
  if (!window.isVisible()) window.show();
  window.focus();
  return true;
}

module.exports = {
  CONTENT_SECURITY_POLICY,
  focusPrimaryWindow,
  isAllowedAppNavigation,
  isAllowedExternalUrl,
  withContentSecurityPolicy,
};
