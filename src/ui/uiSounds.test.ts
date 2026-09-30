import assert from 'node:assert/strict';
import test from 'node:test';
import type { CueId, SoundOutput } from '../game/audioPolicy.ts';
import { installUiSounds, uiCueFor } from './uiSounds.ts';

function button({ disabled = false, ariaDisabled = false, sound }: { disabled?: boolean; ariaDisabled?: boolean; sound?: string } = {}) {
  const element = {
    disabled,
    dataset: sound === undefined ? {} : { sound },
    getAttribute: (name: string) => (name === 'aria-disabled' && ariaDisabled ? 'true' : null),
    closest: (selector: string) => (selector === 'button' ? element : null),
  };
  return element;
}

test('buttons confirm, cancel, deny when unavailable, or stay quiet when their action already sounds', () => {
  assert.equal(uiCueFor(button()), 'ui.confirm');
  assert.equal(uiCueFor(button({ sound: 'cancel' })), 'ui.cancel');
  assert.equal(uiCueFor(button({ sound: 'none' })), null);
  assert.equal(uiCueFor(button({ ariaDisabled: true, sound: 'none' })), 'ui.deny', 'a locked shop item still answers');
  assert.equal(uiCueFor(button({ disabled: true })), null);
});

test('pointer and key presses unlock audio, clicks on buttons play their cue, and cleanup removes both', () => {
  const listeners = new Map<string, (event: Event) => void>();
  const root = {
    addEventListener: (type: string, listener: (event: Event) => void) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  } as unknown as Document;
  const played: CueId[] = [];
  let unlocks = 0;
  const sound: SoundOutput = { unlock: () => { unlocks += 1; }, play: (cue) => { played.push(cue); } };
  const remove = installUiSounds(root, sound);
  listeners.get('pointerdown')?.({} as Event);
  listeners.get('keydown')?.({} as Event);
  listeners.get('click')?.({ target: button({ sound: 'cancel' }) } as unknown as Event);
  listeners.get('click')?.({ target: { closest: () => null } } as unknown as Event);
  assert.equal(unlocks, 2);
  assert.deepEqual(played, ['ui.cancel']);
  remove();
  assert.equal(listeners.size, 0);
});
