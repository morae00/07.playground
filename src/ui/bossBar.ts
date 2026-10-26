// The boss bar's enrage line (UI-02): once the boss enrages, its step (or its overtime), and before that the time left
// until it. Only a boss stage's boss enrages (UI-16): a field boss on a normal stage never does, and that stage's clock
// counts down to the clear, so its bar names no enrage at all.
import type { HudSnapshot } from '../game/GameEngine.ts';
import { text, type Text } from '../i18n/text.ts';

type RageSnapshot = Pick<HudSnapshot, 'runMode' | 'stageKind' | 'bossEnrage' | 'bossEnrageSteps' | 'bossOvertime'>;

/** `time` is the stage clock, already formatted. */
export function bossRageLine(snapshot: RageSnapshot, time: string): Text | null {
  const enrage = snapshot.bossEnrage ?? 0;
  const steps = snapshot.bossEnrageSteps ?? 1;
  if (enrage > 0) return snapshot.bossOvertime ? text('hud.enrage.overtime', { n: snapshot.bossOvertime }) : steps > 1 ? text('hud.enrage.step', { step: enrage, steps }) : text('hud.enrage');
  return snapshot.runMode === 'campaign' && snapshot.stageKind !== 'normal' ? text('hud.enrageIn', { time }) : null;
}
