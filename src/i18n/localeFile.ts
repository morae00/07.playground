// Installs a locale file's table outside the browser, for unit tests (UI-10). The app never imports this: it
// fetches the same file at boot (strings.ts, loadStrings).
import { readFileSync } from 'node:fs';
import { installStrings, type Locale } from './strings.ts';

export function localeTable(locale: Locale): Record<string, string> {
  return JSON.parse(readFileSync(new URL(`../../public/assets/content/strings/${locale}.json`, import.meta.url), 'utf8'));
}

export function installLocaleFile(locale: Locale = 'ko') {
  installStrings(localeTable(locale), locale);
}
