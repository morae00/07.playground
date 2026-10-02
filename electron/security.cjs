// The page's own meta policy (index.html) is the same list without frame-ancestors, which a meta tag cannot set.
// Sound and music are fetched and decoded through Web Audio, so media-src only covers a future media element;
// the game runs no workers (TEC-09).
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "worker-src 'none'",
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

/** The game only navigates to its own entry page (TEC-15: app://game/index.html), ignoring the fragment. */
function isAllowedAppNavigation(value, entryUrl) {
  const url = parseUrl(value);
  if (!url || url.search) return false;
  url.hash = '';
  return url.href === new URL(entryUrl).href;
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
