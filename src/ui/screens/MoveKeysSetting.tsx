// Movement key setting (UI-08): one button per direction. Pressing it listens for the next key, which then moves
// that way; a key another direction had swaps with it, Esc cancels, and keys with another job are refused.
import { useEffect, useState } from 'react';
import type { EngineAction } from '../../game/engine/contracts';
import { t } from '../../i18n/strings';
import { DEFAULT_MOVE_KEYS, MOVE_KEY_ORDER, bindMoveKey, canBindMoveKey, moveKeyLabel, type MoveKeys } from '../../platform/moveKeys';

const ACTION_LABEL = {
  moveUp: 'settings.moveKeys.up',
  moveDown: 'settings.moveKeys.down',
  moveLeft: 'settings.moveKeys.left',
  moveRight: 'settings.moveKeys.right',
} as const;

export function MoveKeysSetting({ keys, onChange }: { keys: MoveKeys; onChange: (keys: MoveKeys) => void }) {
  const [listening, setListening] = useState<EngineAction | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!listening) return undefined;
    // Capture phase on the window, so the key reaches neither the game's input nor the dialog's own keys.
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (event.code === 'Escape') {
        setListening(null);
        setNote(t('settings.moveKeys.cancelled'));
        return;
      }
      if (!canBindMoveKey(event.code)) {
        setNote(t('settings.moveKeys.refused', { key: event.code ? moveKeyLabel(event.code) : event.key }));
        return;
      }
      const next = bindMoveKey(keys, listening, event.code);
      const swapped = MOVE_KEY_ORDER.find((action) => action !== listening && next[action] !== keys[action]);
      onChange(next);
      setListening(null);
      setNote(swapped
        ? t('settings.moveKeys.swapped', { key: moveKeyLabel(event.code), action: t(ACTION_LABEL[listening]), other: t(ACTION_LABEL[swapped]), old: moveKeyLabel(next[swapped]) })
        : t('settings.moveKeys.set', { key: moveKeyLabel(event.code), action: t(ACTION_LABEL[listening]) }));
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, keys, onChange]);

  return (
    <div className="moveKeys" role="group" aria-label={t('settings.moveKeys')}>
      <span>{t('settings.moveKeys')}</span>
      <div className="moveKeyGrid">
        {MOVE_KEY_ORDER.map((action) => (
          <button
            key={action}
            type="button"
            className={listening === action ? 'ghost small listening' : 'ghost small'}
            aria-pressed={listening === action}
            onClick={() => {
              setListening(listening === action ? null : action);
              setNote(listening === action ? '' : t('settings.moveKeys.press', { action: t(ACTION_LABEL[action]) }));
            }}
          >
            <span>{t(ACTION_LABEL[action])}</span>
            <kbd>{listening === action ? '…' : moveKeyLabel(keys[action])}</kbd>
          </button>
        ))}
        <button
          type="button"
          className="ghost small"
          disabled={MOVE_KEY_ORDER.every((action) => keys[action] === DEFAULT_MOVE_KEYS[action])}
          onClick={() => {
            setListening(null);
            onChange(DEFAULT_MOVE_KEYS);
            setNote(t('settings.moveKeys.restored'));
          }}
        >
          {t('settings.moveKeys.reset')}
        </button>
      </div>
      <p className="settingsNote" role="status" aria-live="polite">{note || t('settings.moveKeys.note')}</p>
    </div>
  );
}
