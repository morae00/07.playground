// UI sounds (AUD-01): button clicks play a cue on the ui bus of the app's mixer, and any pointer or key press
// unlocks audio, since browsers start audio only after a user gesture. A button can pick its cue with
// data-sound: "cancel", or "none" when its action already makes a game sound (draft cards, the run shop).
import type { CueId, SoundOutput } from '../game/audioPolicy.ts';

type EventRoot = Pick<Document, 'addEventListener' | 'removeEventListener'>;
type SoundButton = { disabled: boolean; dataset: DOMStringMap; getAttribute(name: string): string | null };

/** The cue a button click plays: a dull tick for unavailable actions, otherwise its data-sound choice. */
export function uiCueFor(button: SoundButton): CueId | null {
  if (button.disabled) return null;
  if (button.getAttribute('aria-disabled') === 'true') return 'ui.deny';
  const sound = button.dataset.sound;
  if (sound === 'none') return null;
  return sound === 'cancel' ? 'ui.cancel' : 'ui.confirm';
}

export function installUiSounds(root: EventRoot, sound: SoundOutput) {
  const unlock = () => sound.unlock();
  const click = (event: Event) => {
    const button = (event.target as Element | null)?.closest?.('button') as SoundButton | null | undefined;
    const cue = button ? uiCueFor(button) : null;
    if (cue) sound.play(cue);
  };
  root.addEventListener('pointerdown', unlock, true);
  root.addEventListener('keydown', unlock, true);
  root.addEventListener('click', click, true);
  return () => {
    root.removeEventListener('pointerdown', unlock, true);
    root.removeEventListener('keydown', unlock, true);
    root.removeEventListener('click', click, true);
  };
}
