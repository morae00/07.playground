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
  /**
   * SYS-04: bosses appear at least 420 away even next to a world edge, and a boss that touches the player is
   * pushed back out instead of sitting on top of them (the root of BUG-12).
   */
  bossSpacing: boolean;
  /**
   * SYS-04: boss phase moves run their attack grammar and movement mode instead of only speeding up. Ch1:
   * tracked dash pair, crossing dash triple, alternating ring gap, contracting ring walls, and anchor movement.
   * Warnings keep their real-time length at every phase (V3).
   */
  bossMoves: boolean;
  /**
   * FX-04: the screen follows a view camera: a critically damped spring toward a point ahead of the player's
   * movement, kicked along hits, and shaken by a trauma² offset from smooth noise instead of random jitter.
   * Pointer targets map through what is on screen. Spawns, aim, and off-screen checks keep the player-centred
   * simulation camera (G14), so seeded outcomes do not change.
   */
  smoothCamera: boolean;
  /**
   * FX-02: ordinary heavy and critical hits no longer stop the whole simulation; the struck body recoils on its
   * own in the presentation layer instead. Global hit-stop is kept for rare events (the rail spear, a boss kill,
   * an awakening) and still spends the BUG-07 budget, so a strong build no longer makes the game sticky.
   */
  rareHitStop: boolean;
  /**
   * ART-05, ART-07, ART-08: maps are built from the chapter's kit modules (obstacleCatalogue.ts): its block prop in
   * three footprints shared by every chapter, three small props, and the landmark post. The same random draws pick
   * the module, so everything else about the map is unchanged; only the obstacle footprints differ.
   */
  kitProps: boolean;
  /**
   * SYS-06: obstacles are cover. An ordinary enemy shot stops at the first obstacle in its path, and a shooter only
   * starts to aim when it has a clear line to the player; otherwise it circles to find one. Boss barrages are
   * airborne and fly over obstacles, drawn above them with a ground shadow so that reads.
   */
  obstacleCover: boolean;
  /**
   * SYS-06: fire, water, and traps act on enemies at half strength. Fire burns them, water and bindings slow them,
   * and an enemy that walks onto a trap springs it. Bosses are immune. An A/B until the team switched it on in the
   * remaster rules (decision D-05, 2026-10-02).
   */
  terrainOnEnemies: boolean;
  /**
   * SYS-09: a pickup waits 60 s instead of 30 before it flies to the player on its own, and is banked at 75 s
   * instead of 45. Nothing is ever lost, but a route past the drops pays sooner than waiting for them.
   */
  patientPickups: boolean;
  /**
   * CON-03: a normal stage's objective changes it and sets a bonus goal (src/content/data/objectives.ts): a tier mix
   * moved by 15 points, more spawns or terrain, more ranged enemies at once, a strengthened or extra field boss. The
   * campaign's first stage keeps its bonus goal without the modifiers. A goal met on a clear pays gold and a star.
   */
  stageObjectives: boolean;
  /**
   * SYS-07: hits are cut by the hybrid defence (a flat share of defence, then a ratio, never below 15% of the hit), so
   * high defence no longer makes every hit 1. Enemy damage rises 7% per chapter after the first, and boss stages'
   * crowds are 15% lighter. Numbers in src/content/data/catalog.ts (difficulty).
   */
  difficultyCurve: boolean;
  /**
   * SYS-08 (on in the remaster rules since decision D-09, 2026-10-02): builds hold 6 active and 4 passive skills, owned
   * skills weigh more in the draft, six fusion awakenings appear once both of their skills are awakened, account
   * levels unlock up to two reroll-or-banish tokens a stage, chained drafts share one screen, and the XP curve aims
   * at 20-28 drafts an 8-minute stage. Numbers in src/content/data/buildDepth.ts.
   */
  buildDepth: boolean;
  /**
   * SYS-10: elites. An elite beat's spawns, and every spawn on an elite hunt, may come as elites: an enemy with one
   * affix (haste, split, shield, or drain), 2.5 times the health, an elite purple outline, its affix mark, and a coin
   * chest when it falls. The elite hunt objective then asks for elite kills instead of strengthening field bosses.
   * Numbers in src/content/data/elites.ts.
   */
  eliteAffixes: boolean;
  /**
   * CON-08: the infinite run turns through the five chapters (5 wraps to 1). Once a chapter has lasted five minutes,
   * the next round boss to fall turns the run to the next one: its ground, obstacle kit, enemies, and ambience. The
   * map is not rebuilt; blocks keep their footprints and pillars take the new chapter's about their centres. Round
   * bosses come from the chapter on screen (still random, never the same one twice running, back 2.4 s after a kill),
   * and 150 s into each chapter its field boss joins them. Numbers in src/game/infiniteMode.ts (INFINITE_ROTATION).
   */
  infiniteRotation: boolean;
  /**
   * D-02 (decision 2026-10-02): enrage does not stop at its fourth step. Every 30 s after it an overtime step makes
   * the bosses deal 25% more damage and move 8% faster, so a boss fight that neither side ends ends anyway.
   */
  enrageOvertime: boolean;
  /**
   * SYS-12 (user request 2026-10-12): bosses are much harder to fell. Boss stage and field bosses take more health
   * and hit harder, and the infinite run's round bosses take a health factor by the minute they arrive, aimed at
   * 20-35 s fights for a strong build. Numbers in src/content/data/bossToughness.ts.
   */
  bossToughness: boolean;
  /**
   * SYS-13 (user request 2026-10-12): far more monsters. The field holds about twice the enemies and they come twice
   * as fast; each ordinary enemy has less health and pays less XP and fewer coins, so kills come faster without
   * flooding the economy. Numbers in src/content/data/horde.ts.
   */
  horde: boolean;
  /**
   * SYS-14 (user request 2026-10-12): bombers. From Ch1 St4 and from the infinite run's second minute, some small
   * contact enemies come as bombers: a fuse kind plants itself on touch and blows a shown circle a second later, a
   * burst kind blows up on touch. Their share grows with the stage and the minute, under a cap, so dodging them
   * matters without crowding out the other roles. Numbers in src/content/data/bombers.ts.
   */
  bombers: boolean;
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
  bossSpacing: false,
  bossMoves: false,
  smoothCamera: false,
  rareHitStop: false,
  kitProps: false,
  obstacleCover: false,
  terrainOnEnemies: false,
  patientPickups: false,
  stageObjectives: false,
  difficultyCurve: false,
  buildDepth: false,
  eliteAffixes: false,
  infiniteRotation: false,
  enrageOvertime: false,
  bossToughness: false,
  horde: false,
  bombers: false,
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
  bossSpacing: true,
  bossMoves: true,
  smoothCamera: true,
  rareHitStop: true,
  kitProps: true,
  obstacleCover: true,
  terrainOnEnemies: true,
  patientPickups: true,
  stageObjectives: true,
  difficultyCurve: true,
  buildDepth: true,
  eliteAffixes: true,
  infiniteRotation: true,
  enrageOvertime: true,
  bossToughness: true,
  horde: true,
  bombers: true,
});

export function ruleSetFor(id: RuleSetId | undefined): RuleSet {
  return id === 'classic' ? CLASSIC_RULES : REMASTER_RULES;
}

export function rulesLabel(version: number) {
  return `RULES v${version}`;
}
