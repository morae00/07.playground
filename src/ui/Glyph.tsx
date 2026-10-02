// Button glyphs for the device in use (UI-07): Enter on the keyboard, A on an Xbox pad, ✕ on a PlayStation pad.
import { t } from '../i18n/strings';
import { moveKeysInUse } from '../platform/moveKeys';
import { useInputDevice, type InputDevice } from './inputDevice';

export type GlyphAction = 'confirm' | 'back' | 'pause' | 'tabs' | 'move' | 'navigate';

export function glyph(device: InputDevice, action: GlyphAction) {
  return t(`glyph.${device}.${action}`, { keys: moveKeysInUse() });
}

/** Every glyph for a device, as template parameters: t('pause.lead.pad', glyphs(device)). */
export function glyphs(device: InputDevice) {
  return {
    confirm: glyph(device, 'confirm'),
    back: glyph(device, 'back'),
    pause: glyph(device, 'pause'),
    tabs: glyph(device, 'tabs'),
    move: glyph(device, 'move'),
    navigate: glyph(device, 'navigate'),
  };
}

export function Glyph({ action }: { action: GlyphAction }) {
  const device = useInputDevice();
  return <kbd className="glyph" data-device={device} aria-hidden="true">{glyph(device, action)}</kbd>;
}
