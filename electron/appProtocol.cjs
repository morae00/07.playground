// App protocol (TEC-15): the game loads from app://game/ instead of file://, so the page has a real, secure origin
// and the GrantFileProtocolExtraPrivileges fuse can be turned off once saves have moved (saveMigration.cjs). Files
// are served from the build folder only; a path that would leave it, a folder, another host, or a method other than
// GET is refused.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP_SCHEME = 'app';
const APP_HOST = 'game';
const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
const APP_ENTRY = `${APP_ORIGIN}/index.html`;

/** Must run before the app is ready: the scheme is standard (relative URLs, localStorage), secure, and fetchable. */
function registerAppScheme(protocol) {
  protocol.registerSchemesAsPrivileged([{ scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
}

/** The file under root that an app:// URL names, or null when it names another host or would leave root. */
function appFilePath(requestUrl, root) {
  let url;
  let pathname;
  try {
    url = new URL(requestUrl);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (url.protocol !== `${APP_SCHEME}:` || url.host !== APP_HOST) return null;
  const base = path.resolve(root);
  const file = path.resolve(base, `.${pathname === '/' ? '/index.html' : pathname}`);
  return file.startsWith(base + path.sep) ? file : null;
}

/** Answers app:// requests with files under root, adding `headers` (the content security policy) to each. */
function serveAppFiles(protocol, net, root, headers = {}) {
  protocol.handle(APP_SCHEME, async (request) => {
    const file = request.method === 'GET' ? appFilePath(request.url, root) : null;
    if (!file || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return new Response('Not found', { status: 404 });
    const response = await net.fetch(pathToFileURL(file).toString());
    const merged = new Headers(response.headers);
    for (const [name, value] of Object.entries(headers)) merged.set(name, value);
    return new Response(response.body, { status: response.status || 200, headers: merged });
  });
}

module.exports = { APP_ENTRY, APP_HOST, APP_ORIGIN, APP_SCHEME, appFilePath, registerAppScheme, serveAppFiles };
