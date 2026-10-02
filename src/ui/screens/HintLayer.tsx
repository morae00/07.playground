// Onboarding hints (UI-09): context hints that never stop play, each shown once per save (profile.hintsSeen).
// In 1-1: moving is all it takes because attacks are automatic, ink shards level you up, and coins buy upgrades in
// the pause hub. At the first boss: read the telegraph and step out. Keys are named for the device in use (UI-07).
// The hint sits above the boss bar, clear of the centre 40% of the screen.
import { useEffect, useState } from 'react';
import { moveKeysInUse } from '../../platform/moveKeys';
import type { HudSnapshot } from '../../game/GameEngine';
import { t } from '../../i18n/strings';
import { glyphs } from '../Glyph';
import { useInputDevice, type InputDevice } from '../inputDevice';

/** Each shows as the string hint.<id>; the move hint has one wording per device. */
export type HintId = 'move' | 'xp' | 'shop' | 'telegraph';

function hintText(id: HintId, device: InputDevice) {
  const keys = glyphs(device);
  if (id === 'move') return device === 'keyboard' ? t('hint.move.keyboard', { keys: moveKeysInUse() }) : t('hint.move.pad', keys);
  return t(`hint.${id}`, keys);
}

/** How long a hint stays up. */
export const HINT_MS = 6000;
/** The cheapest run upgrade (magnet): the shop hint waits until the player can afford one. */
const FIRST_UPGRADE_COST = 24;

/** The hint due now, in order, or null. */
export function dueHint(snapshot: HudSnapshot, seen: readonly string[]): HintId | null {
  if (snapshot.runMode !== 'campaign') return null;
  if (snapshot.chapter === 1 && snapshot.stage === 1) {
    if (!seen.includes('move')) return 'move';
    if (!seen.includes('xp') && snapshot.elapsed >= 8) return 'xp';
    if (!seen.includes('shop') && snapshot.coins >= FIRST_UPGRADE_COST) return 'shop';
    return null;
  }
  return snapshot.bossId && !seen.includes('telegraph') ? 'telegraph' : null;
}

export function HintLayer({ snapshot, seen, onSeen }: { snapshot: HudSnapshot; seen: readonly string[]; onSeen: (id: HintId) => void }) {
  const [shown, setShown] = useState<HintId | null>(null);
  const device = useInputDevice();
  const due = shown ? null : dueHint(snapshot, seen);
  useEffect(() => {
    if (!due) return;
    // Marked seen as it shows, so a run that ends early does not repeat it.
    setShown(due);
    onSeen(due);
  }, [due, onSeen]);
  useEffect(() => {
    if (!shown) return undefined;
    const timer = window.setTimeout(() => setShown(null), HINT_MS);
    return () => window.clearTimeout(timer);
  }, [shown]);
  return shown ? <div className="hintToast" role="status" aria-live="polite">{hintText(shown, device)}</div> : null;
}
