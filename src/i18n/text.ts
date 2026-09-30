// UI text (UI-10). Every player-facing string lives in a locale file, public/assets/content/strings/<locale>.json,
// and code names it by key. The engine hands the UI keys and parameters (Text) and never builds a sentence, so the
// simulation does not depend on the language; the UI resolves them (strings.ts).
import type KO from '../../public/assets/content/strings/ko.json';

/** Every key of the Korean table, the reference locale: code that names a key it lacks does not compile. */
export type StringKey = keyof typeof KO;
export type TextParam = string | number | Text;
/** A string to show: its key, and values for its {name} placeholders. A value may itself be a Text. */
export type Text = Readonly<{ key: StringKey; params?: Readonly<Record<string, TextParam>> }>;

export function text(key: StringKey, params?: Text['params']): Text {
  return params ? { key, params } : { key };
}
