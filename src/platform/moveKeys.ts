// Movement keys (UI-08): the four keyboard keys that move the hero, chosen in the settings. Keys are physical key
// codes (KeyboardEvent.code), so they stay where they are on any layout or input source. The arrow keys always move
// too, and keys the game uses for something else cannot be chosen. There is no attack key to choose (G1).
import type { EngineAction } from '../game/engine/contracts.ts';

export type MoveKeys = Readonly<Record<EngineAction, string>>;

export const DEFAULT_MOVE_KEYS: MoveKeys = Object.freeze({ moveUp: 'KeyW', moveDown: 'KeyS', moveLeft: 'KeyA', moveRight: 'KeyD' });

/** The order the settings and the prompts list the keys in: the WASD reading order. */
export const MOVE_KEY_ORDER: readonly EngineAction[] = Object.freeze(['moveUp', 'moveLeft', 'moveDown', 'moveRight']);

const ARROW_KEYS: Readonly<Record<string, EngineAction>> = Object.freeze({
  ArrowUp: 'moveUp',
  ArrowDown: 'moveDown',
  ArrowLeft: 'moveLeft',
  ArrowRight: 'moveRight',
});

const PUNCTUATION: Readonly<Record<string, string>> = Object.freeze({
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backslash: '\\',
  BracketLeft: '[',
  BracketRight: ']',
  Minus: '-',
  Equal: '=',
  Backquote: '`',
});

/** Keys with another job: P pauses, R rerolls a draft, and 1-4 pick draft cards. */
const RESERVED = new Set(['KeyP', 'KeyR', 'Digit1', 'Digit2', 'Digit3', 'Digit4']);

/** A key the settings may give to a movement action: a letter, a digit, a numpad digit, or punctuation. */
export function canBindMoveKey(code: string) {
  if (RESERVED.has(code)) return false;
  return /^(Key[A-Z]|Digit[0-9]|Numpad[0-9])$/.test(code) || code in PUNCTUATION;
}

/** The key's name on the keycap: W, 5, Num 8, ;. */
export function moveKeyLabel(code: string) {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return `Num ${code.slice(6)}`;
  return PUNCTUATION[code] ?? code;
}

/** All four keys in reading order: "WASD", or "Num 8 · Num 4 · Num 5 · Num 6" when a key name is longer than one. */
export function moveKeysLabel(keys: MoveKeys) {
  const labels = MOVE_KEY_ORDER.map((action) => moveKeyLabel(keys[action]));
  return labels.every((label) => label.length === 1) ? labels.join('') : labels.join(' · ');
}

/** Gives `code` to `action`. A key another action had moves over, and that action takes this one's old key. */
export function bindMoveKey(keys: MoveKeys, action: EngineAction, code: string): MoveKeys {
  if (!canBindMoveKey(code) || keys[action] === code) return keys;
  const holder = MOVE_KEY_ORDER.find((other) => other !== action && keys[other] === code);
  return Object.freeze({ ...keys, [action]: code, ...(holder ? { [holder]: keys[action] } : {}) });
}

/** Key code to action, the arrows included. */
export function moveKeyMap(keys: MoveKeys): Readonly<Record<string, EngineAction>> {
  const map: Record<string, EngineAction> = { ...ARROW_KEYS };
  for (const action of MOVE_KEY_ORDER) map[keys[action]] = action;
  return map;
}

/** A saved choice, or the defaults when it is missing, holds a key that cannot be bound, or uses a key twice (G17). */
export function sanitizeMoveKeys(value: unknown): MoveKeys {
  if (typeof value !== 'object' || value === null) return DEFAULT_MOVE_KEYS;
  const record = value as Record<string, unknown>;
  const codes = MOVE_KEY_ORDER.map((action) => record[action]);
  if (!codes.every((code) => typeof code === 'string' && canBindMoveKey(code)) || new Set(codes).size !== codes.length) return DEFAULT_MOVE_KEYS;
  return Object.freeze({ moveUp: record.moveUp as string, moveDown: record.moveDown as string, moveLeft: record.moveLeft as string, moveRight: record.moveRight as string });
}

let currentLabel = moveKeysLabel(DEFAULT_MOVE_KEYS);

/** The prompts name the keys in use ("{keys} 또는 방향키로…"); the app shell keeps this in step with the options. */
export function setMoveKeysInUse(keys: MoveKeys) {
  currentLabel = moveKeysLabel(keys);
}

export function moveKeysInUse() {
  return currentLabel;
}
