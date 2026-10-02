// The HUD's spoken effect line (UI-08). The effect rack redraws its timers every snapshot, so it is not a live region;
// this line names the effects alone, and its text changes only when an effect starts or ends, so a screen reader
// hears each change once.
import { text, type Text } from '../i18n/text.ts';

/** The line for the effects active now (already translated names); null before the run has had any. */
export function effectAnnouncement(names: readonly string[], hadEffects: boolean): Text | null {
  if (names.length > 0) return text('hud.effects.list', { list: names.join(', ') });
  return hadEffects ? text('hud.effects.none') : null;
}
