// Simulation rule versions and flags (TEC-11).
// Rule-changing fixes are gated here so the original rules stay reproducible for A/B balance runs.
// The infinite leaderboard and replay fixtures are namespaced by RULES_VERSION so records made under different
// rules never mix. Until a build ships it, the remaster rule set may keep changing under the same version;
// after that, the first change to seeded outcomes must bump it.

export const RULES_VERSION = 2;
export const CLASSIC_RULES_VERSION = 1;

export type RuleSetId = 'classic' | 'remaster';

export type RuleSet = Readonly<{
  id: RuleSetId;
  version: number;
  /** BUG-07: per-second hit-stop budget, kill = heavy, stage timer ignores hit-stop slowdown. */
  hitStopBudget: boolean;
  /** BUG-08: cosmetic objects use their own id stream; ranged strafe side comes from the spawn variant roll. */
  isolatedCosmeticIds: boolean;
  /** BUG-09: spawns and view-edge attacks use the fixed 1600×900 logical frame instead of the canvas size. */
  logicalSpawnFrame: boolean;
  /** BUG-10: boss dash locks its direction during a visible windup and does not home. */
  telegraphedDash: boolean;
  /** BUG-11: eclipse walls enter from the logical view edge with a guaranteed safe lane. */
  eclipseWallFromView: boolean;
  /** BUG-13: root traps bind once per entry with immunity afterwards; static hazards keep the start area clear. */
  fairTerrain: boolean;
  /** BUG-16: mirror clone awakening adds clone shots instead of depending on the rail skill. */
  mirrorAwakeningRework: boolean;
  /** SYS-01: auto-aim leads moving targets, skips walled-off targets, retargets after 3 misses, stays in view. */
  reliableAim: boolean;
}>;

export const CLASSIC_RULES: RuleSet = Object.freeze({
  id: 'classic',
  version: CLASSIC_RULES_VERSION,
  hitStopBudget: false,
  isolatedCosmeticIds: false,
  logicalSpawnFrame: false,
  telegraphedDash: false,
  eclipseWallFromView: false,
  fairTerrain: false,
  mirrorAwakeningRework: false,
  reliableAim: false,
});

export const REMASTER_RULES: RuleSet = Object.freeze({
  id: 'remaster',
  version: RULES_VERSION,
  hitStopBudget: true,
  isolatedCosmeticIds: true,
  logicalSpawnFrame: true,
  telegraphedDash: true,
  eclipseWallFromView: true,
  fairTerrain: true,
  mirrorAwakeningRework: true,
  reliableAim: true,
});

export function ruleSetFor(id: RuleSetId | undefined): RuleSet {
  return id === 'classic' ? CLASSIC_RULES : REMASTER_RULES;
}

export function rulesLabel(version: number) {
  return `RULES v${version}`;
}
