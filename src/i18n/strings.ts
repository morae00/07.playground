// The string table in use (UI-10): main.tsx loads the locale file before the app renders, and t() reads it.
import type { StringKey, Text, TextParam } from './text';

export const LOCALES = ['ko', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';

let table: Readonly<Record<string, string>> = {};
let current: Locale = DEFAULT_LOCALE;

/** Replaces the table in use: the app does this once at boot, tests with the file itself. */
export function installStrings(strings: Readonly<Record<string, string>>, locale: Locale = DEFAULT_LOCALE) {
  table = strings;
  current = locale;
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** A parameter as shown: a Text resolved, anything else as written. */
export function tp(value: TextParam): string {
  return typeof value === 'object' ? tx(value) : String(value);
}

/** The string for `key` with its {name} placeholders filled. A key missing from the table shows as itself. */
export function t(key: StringKey, params?: Text['params']): string {
  const template = table[key] ?? key;
  return params ? template.replace(PLACEHOLDER, (whole, name: string) => (name in params ? tp(params[name]) : whole)) : template;
}

export function tx(value: Text) {
  return t(value.key, value.params);
}

/** Numbers and dates in the locale's own format (thousands separators, date order). */
export function formatCount(value: number) {
  return value.toLocaleString(current === 'ko' ? 'ko-KR' : 'en-US');
}

export function formatDate(time: string | number) {
  return new Date(time).toLocaleDateString(current === 'ko' ? 'ko-KR' : 'en-US');
}

export const stringsUrl = (locale: Locale) => `assets/content/strings/${locale}.json`;

/** Fetches and installs a locale's table; rejects when the file is missing or is not a table of strings. */
export async function loadStrings(locale: Locale) {
  const response = await fetch(stringsUrl(locale));
  if (!response.ok) throw new Error(`strings ${locale}: HTTP ${response.status}`);
  const strings: unknown = await response.json();
  if (!strings || typeof strings !== 'object' || Object.values(strings).some((value) => typeof value !== 'string')) {
    throw new Error(`strings ${locale}: not a table of strings`);
  }
  installStrings(strings as Record<string, string>, locale);
}
