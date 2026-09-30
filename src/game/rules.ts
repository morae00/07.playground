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
  /** CON-02: 8-minute stages, 10-minute boss enrage timer, 5-minute Ch1-St1, and the practice pace. */
  pacing: boolean;
  /**
   * SYS-11 (a): silence only blocks new casts (cooldowns, orbit blades, and the magnet pulse keep running), and
   * skills ready at release fire one by one 0.1 s apart. Also stops the recovery-thread timer counting twice.
   */
  skillLoopRework: boolean;
  /**
   * SYS-03: normal stages follow the chapter's encounter grammar: a 45-second opening ramp (0.4x to 1.0x spawn
   * rate), then pressure, breather, and elite beats that set the spawn rhythm, direction, formation bursts, the
   * boss-made terrain count, and breather rewards. Tier mix and field boss marks are unchanged.
   */
  encounterDirector: boolean;
  /** SYS-02: overlapping enemies push apart by hit radius (heavier bodies give way less). */
  enemySeparation: boolean;
  /** SYS-02: stalkers (small contact) chase in packs: alignment and cohesion with nearby stalkers. */
  stalkerFlocking: boolean;
  /**
   * SYS-02: chargers (medium contact) wind up for 0.62 s behind a lane telegraph, then dash straight; a wall
   * stuns them for 0.8 s. Only within 320 of the player, 4-6 s apart, at most three windups at once.
   */
  chargerDash: boolean;
  /** SYS-02: shooters aim where a moving player will be when the shot arrives (windup plus travel time). */
  shooterLeadAim: boolean;
  /** SYS-02 (team decision: shield): wardens (large contact) carry a front shield that turns at 90 degrees/s. */
  wardenShield: boolean;
  /**
   * SYS-04: every boss volley and zone is armed first and telegraphed (rings and bursts: a ring at the muzzle;
   * saws: their paths; clones: summoning circles; zones: their footprints), then fires exactly as shown. Volleys
   * wait for room under the shot cap, and shots pushed over it fade out harmlessly instead of vanishing.
   */
  bossTelegraphs: boolean;
  /**
   * SYS-04: when a boss stage's clock runs out, enrage climbs a step every 30 s (speed, then pattern density,
   * then damage x1.5 and x2.0) instead of x4.5 damage at once, and the silence zone lands after a warning.
   */
  steppedEnrage: boolean;
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
  pacing: false,
  skillLoopRework: false,
  encounterDirector: false,
  enemySeparation: false,
  stalkerFlocking: false,
  chargerDash: false,
  shooterLeadAim: false,
  wardenShield: false,
  bossTelegraphs: false,
  steppedEnrage: false,
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
  pacing: true,
  skillLoopRework: true,
  encounterDirector: true,
  enemySeparation: true,
  stalkerFlocking: true,
  chargerDash: true,
  shooterLeadAim: true,
  wardenShield: true,
  bossTelegraphs: true,
  steppedEnrage: true,
});

export function ruleSetFor(id: RuleSetId | undefined): RuleSet {
  return id === 'classic' ? CLASSIC_RULES : REMASTER_RULES;
}

export function rulesLabel(version: number) {
  return `RULES v${version}`;
}
