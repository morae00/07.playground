// The arsenal (SYS-15, arsenal rule; user request 2026-10-12: five times the weapons). 44 weapons beside the 11 active
// skills, each a row of data the engine fires generically (GameEngine.fireArsenal). Data, not code (TEC-05).
// - kind: volley (shots at the nearest enemy, `spread` apart), burst (shots all around), spray (one stream with a
//   random wobble of `spread`), rear (shots behind the way the player moves), seeker (one shot at each of the nearest
//   different enemies; `bossFirst` aims at a boss first), strike (blows of `radius` on enemies within `range`), nova
//   (a blast of `radius` around the player), lob (a blast of `radius` at the target after `delay`, `scatter` apart),
//   chain (from the nearest enemy within `range`, `jumps` hops of up to `hop`), beam (an instant line of `length` and
//   `width`, in `directions` 1 or 4), halo (a sweep of the band from `inner` to `radius` around the player).
// - Pairs are [base, per level]: `damage` times the player's attack; `count`, `radius`, `length`, and `jumps` (counts
//   round down). `cooldown` is [base, less per level, floor], divided by attack speed.
// - Projectiles: `speed`, `size` (hit radius), `life` (seconds), `pierce`. Effects on every hit: `slow`
//   [speed multiplier, seconds], `stun` [chance, seconds], `knockback`, `execute` (an ordinary enemy left under that
//   share of its health falls), `crit` (extra crit chance), `boss` (damage multiplier on bosses).
// - `look`: the active skill whose art draws it until the kit draws its own (icons alias the look's tile).
// - Awakened at level 5 like every skill: `awakening` adds damage, one more of its count, and reach.
import type { ArsenalId, CoreSkillId } from '../../game/engine/worldTypes.ts';
import { deepFreeze } from '../deepFreeze.ts';

export type ArsenalKind = 'volley' | 'burst' | 'spray' | 'rear' | 'seeker' | 'strike' | 'nova' | 'lob' | 'chain' | 'beam' | 'halo';
type Pair = [number, number];
export type ArsenalWeapon = {
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  chapterMin: number;
  tags: string[];
  kind: ArsenalKind;
  look: CoreSkillId;
  damage: Pair;
  cooldown: [number, number, number];
  count?: Pair;
  radius?: Pair;
  length?: Pair;
  jumps?: Pair;
  spread?: number;
  speed?: number;
  size?: number;
  life?: number;
  pierce?: number;
  range?: number;
  hop?: number;
  inner?: number;
  delay?: number;
  scatter?: number;
  width?: number;
  directions?: number;
  knockback?: number;
  execute?: number;
  crit?: number;
  boss?: number;
  bossFirst?: boolean;
  slow?: Pair;
  stun?: Pair;
};

const ARSENAL: Record<ArsenalId, ArsenalWeapon> = {
  inkDarts: { rarity: 'common', chapterMin: 1, tags: ['projectile', 'single'], kind: 'volley', look: 'needleStorm', damage: [0.6, 0.14], cooldown: [0.62, 0.03, 0.2], count: [2, 0.25], spread: 0.12, speed: 820, size: 4, life: 1.1, pierce: 0 },
  brushQuills: { rarity: 'common', chapterMin: 1, tags: ['projectile', 'fan'], kind: 'volley', look: 'fanKnives', damage: [0.62, 0.13], cooldown: [1.0, 0.04, 0.4], count: [3, 0.5], spread: 0.24, speed: 700, size: 5, life: 0.9, pierce: 1 },
  sealArrows: { rarity: 'rare', chapterMin: 1, tags: ['projectile', 'pierce'], kind: 'volley', look: 'needleStorm', damage: [1.9, 0.32], cooldown: [1.5, 0.06, 0.7], count: [1, 0.25], spread: 0.1, speed: 900, size: 6, life: 1.3, pierce: 3, knockback: 90 },
  frostNeedles: { rarity: 'rare', chapterMin: 1, tags: ['projectile', 'slow'], kind: 'volley', look: 'needleStorm', damage: [0.7, 0.15], cooldown: [0.8, 0.035, 0.28], count: [2, 0.25], spread: 0.14, speed: 760, size: 4.5, life: 1.15, pierce: 0, slow: [0.55, 1.4] },
  thunderNeedles: { rarity: 'rare', chapterMin: 2, tags: ['projectile', 'crowdControl'], kind: 'volley', look: 'needleStorm', damage: [0.85, 0.17], cooldown: [0.9, 0.04, 0.32], count: [1, 0.5], spread: 0.14, speed: 800, size: 4.5, life: 1.15, pierce: 1, stun: [0.22, 0.6] },
  twinBlades: { rarity: 'common', chapterMin: 1, tags: ['projectile', 'fan'], kind: 'volley', look: 'fanKnives', damage: [0.9, 0.16], cooldown: [1.05, 0.04, 0.45], count: [2, 0.25], spread: 0.2, speed: 640, size: 6, life: 0.85, pierce: 1, knockback: 160 },
  ghostVolley: { rarity: 'epic', chapterMin: 2, tags: ['clone', 'projectile'], kind: 'volley', look: 'mirrorClone', damage: [0.8, 0.17], cooldown: [1.2, 0.05, 0.5], count: [4, 0.5], spread: 0.16, speed: 760, size: 5, life: 1.1, pierce: 1 },
  headsmanDarts: { rarity: 'legendary', chapterMin: 3, tags: ['projectile', 'crit'], kind: 'volley', look: 'needleStorm', damage: [1.2, 0.22], cooldown: [0.85, 0.04, 0.3], count: [1, 0.5], spread: 0.1, speed: 900, size: 4.5, life: 1.2, pierce: 1, execute: 0.18 },
  paperStorm: { rarity: 'rare', chapterMin: 1, tags: ['projectile', 'area'], kind: 'burst', look: 'fanKnives', damage: [0.75, 0.14], cooldown: [1.6, 0.07, 0.7], count: [8, 1], speed: 560, size: 5, life: 0.75, pierce: 1 },
  inkBloom: { rarity: 'rare', chapterMin: 2, tags: ['projectile', 'slow'], kind: 'burst', look: 'needleStorm', damage: [0.7, 0.13], cooldown: [1.5, 0.06, 0.65], count: [6, 1], speed: 620, size: 4.5, life: 0.9, pierce: 0, slow: [0.6, 1.2] },
  thornHalo: { rarity: 'epic', chapterMin: 2, tags: ['projectile', 'melee'], kind: 'burst', look: 'needleStorm', damage: [0.9, 0.17], cooldown: [1.3, 0.05, 0.55], count: [12, 1.5], speed: 520, size: 4, life: 0.4, pierce: 1 },
  starShards: { rarity: 'epic', chapterMin: 3, tags: ['clone', 'projectile'], kind: 'burst', look: 'mirrorClone', damage: [1.1, 0.2], cooldown: [1.8, 0.07, 0.8], count: [5, 0.75], speed: 700, size: 5.5, life: 1.0, pierce: 2 },
  sunNeedles: { rarity: 'mythic', chapterMin: 4, tags: ['projectile', 'area'], kind: 'burst', look: 'needleStorm', damage: [1.35, 0.24], cooldown: [2.4, 0.09, 1.1], count: [16, 2], speed: 760, size: 5, life: 1.0, pierce: 2 },
  inkDrizzle: { rarity: 'common', chapterMin: 1, tags: ['projectile', 'sustained'], kind: 'spray', look: 'needleStorm', damage: [0.42, 0.09], cooldown: [0.24, 0.01, 0.1], count: [1, 0], spread: 0.38, speed: 740, size: 3.5, life: 0.9, pierce: 0 },
  pinHail: { rarity: 'rare', chapterMin: 2, tags: ['projectile', 'sustained'], kind: 'spray', look: 'fanKnives', damage: [0.5, 0.1], cooldown: [0.22, 0.01, 0.09], count: [1, 0.25], spread: 0.6, speed: 660, size: 4.5, life: 0.8, pierce: 0 },
  tailGuard: { rarity: 'common', chapterMin: 1, tags: ['projectile', 'defense'], kind: 'rear', look: 'fanKnives', damage: [0.8, 0.15], cooldown: [0.95, 0.04, 0.4], count: [3, 0.5], spread: 0.3, speed: 620, size: 5, life: 0.8, pierce: 1 },
  smokeTail: { rarity: 'rare', chapterMin: 1, tags: ['projectile', 'slow'], kind: 'rear', look: 'needleStorm', damage: [0.7, 0.14], cooldown: [0.9, 0.04, 0.38], count: [2, 0.25], spread: 0.12, speed: 640, size: 4.5, life: 0.85, pierce: 1, slow: [0.5, 1.6] },
  gravePins: { rarity: 'epic', chapterMin: 3, tags: ['projectile', 'pierce'], kind: 'rear', look: 'needleStorm', damage: [1.05, 0.2], cooldown: [1.1, 0.05, 0.45], count: [5, 0.5], spread: 0.2, speed: 700, size: 4.5, life: 0.9, pierce: 2 },
  trackingSeals: { rarity: 'rare', chapterMin: 1, tags: ['projectile', 'single'], kind: 'seeker', look: 'needleStorm', damage: [0.85, 0.16], cooldown: [1.0, 0.04, 0.4], count: [3, 0.5], speed: 820, size: 4.5, life: 1.2, pierce: 0 },
  huntersMarks: { rarity: 'epic', chapterMin: 2, tags: ['clone', 'projectile'], kind: 'seeker', look: 'mirrorClone', damage: [0.95, 0.18], cooldown: [1.25, 0.05, 0.5], count: [4, 0.5], speed: 760, size: 5, life: 1.2, pierce: 0, crit: 0.25 },
  crowFeathers: { rarity: 'rare', chapterMin: 2, tags: ['projectile', 'fan'], kind: 'seeker', look: 'fanKnives', damage: [0.75, 0.14], cooldown: [1.15, 0.05, 0.45], count: [5, 0.5], speed: 700, size: 5, life: 0.9, pierce: 0, range: 520 },
  bossbane: { rarity: 'legendary', chapterMin: 3, tags: ['projectile', 'boss'], kind: 'seeker', look: 'needleStorm', damage: [2.2, 0.38], cooldown: [1.4, 0.06, 0.6], count: [1, 0.25], speed: 980, size: 5.5, life: 1.4, pierce: 0, boss: 1.6, bossFirst: true },
  inkLightning: { rarity: 'rare', chapterMin: 1, tags: ['area', 'instant'], kind: 'strike', look: 'chainSpark', damage: [1.1, 0.2], cooldown: [1.4, 0.06, 0.6], count: [2, 0.5], radius: [56, 0], range: 560, stun: [0.25, 0.5] },
  brushDownpour: { rarity: 'epic', chapterMin: 2, tags: ['area', 'instant'], kind: 'strike', look: 'boneMortar', damage: [0.95, 0.18], cooldown: [1.6, 0.07, 0.7], count: [4, 0.5], radius: [46, 0], range: 600 },
  fallingScroll: { rarity: 'epic', chapterMin: 3, tags: ['area', 'explosive'], kind: 'strike', look: 'boneMortar', damage: [2.6, 0.42], cooldown: [2.6, 0.1, 1.2], count: [1, 0.25], radius: [110, 0], range: 620, knockback: 120 },
  seventhSeal: { rarity: 'mythic', chapterMin: 4, tags: ['area', 'instant'], kind: 'strike', look: 'voidMine', damage: [1.7, 0.3], cooldown: [3.0, 0.12, 1.4], count: [7, 1], radius: [58, 0], range: 640 },
  inkPulse: { rarity: 'common', chapterMin: 1, tags: ['area', 'melee'], kind: 'nova', look: 'boneMortar', damage: [0.8, 0.15], cooldown: [2.0, 0.08, 0.9], radius: [135, 8], knockback: 220 },
  frostRing: { rarity: 'rare', chapterMin: 1, tags: ['area', 'slow'], kind: 'nova', look: 'blackSun', damage: [0.7, 0.13], cooldown: [2.4, 0.09, 1.1], radius: [160, 9], slow: [0.4, 2.0] },
  thunderclap: { rarity: 'epic', chapterMin: 2, tags: ['area', 'crowdControl'], kind: 'nova', look: 'chainSpark', damage: [1.0, 0.18], cooldown: [3.0, 0.11, 1.4], radius: [120, 8], stun: [1, 0.7] },
  silenceBell: { rarity: 'legendary', chapterMin: 4, tags: ['area', 'slow'], kind: 'nova', look: 'voidMine', damage: [2.4, 0.4], cooldown: [4.2, 0.15, 2.0], radius: [220, 12], slow: [0.55, 1.6] },
  inkPots: { rarity: 'common', chapterMin: 1, tags: ['area', 'explosive'], kind: 'lob', look: 'boneMortar', damage: [1.25, 0.22], cooldown: [1.9, 0.07, 0.85], count: [1, 0.25], radius: [80, 6], range: 560, delay: 0.55, scatter: 0 },
  clusterPots: { rarity: 'rare', chapterMin: 2, tags: ['area', 'explosive'], kind: 'lob', look: 'boneMortar', damage: [0.9, 0.17], cooldown: [2.1, 0.08, 0.95], count: [3, 0.5], radius: [56, 4], range: 560, delay: 0.6, scatter: 70 },
  tarJar: { rarity: 'epic', chapterMin: 2, tags: ['area', 'slow'], kind: 'lob', look: 'voidMine', damage: [1.4, 0.24], cooldown: [2.6, 0.1, 1.2], count: [1, 0.25], radius: [100, 7], range: 600, delay: 0.7, scatter: 0, slow: [0.45, 2.2] },
  meteorBrush: { rarity: 'legendary', chapterMin: 3, tags: ['area', 'explosive'], kind: 'lob', look: 'boneMortar', damage: [3.6, 0.6], cooldown: [3.6, 0.14, 1.8], count: [1, 0.25], radius: [140, 10], range: 680, delay: 1.0, scatter: 0, knockback: 180 },
  sparkThread: { rarity: 'common', chapterMin: 1, tags: ['chain', 'instant'], kind: 'chain', look: 'chainSpark', damage: [0.8, 0.15], cooldown: [1.25, 0.05, 0.5], jumps: [3, 0.5], range: 420, hop: 260 },
  stormThread: { rarity: 'epic', chapterMin: 3, tags: ['chain', 'crowdControl'], kind: 'chain', look: 'chainSpark', damage: [1.0, 0.18], cooldown: [1.7, 0.07, 0.75], jumps: [6, 0.75], range: 480, hop: 300, stun: [0.2, 0.45] },
  frostChainlet: { rarity: 'rare', chapterMin: 2, tags: ['chain', 'slow'], kind: 'chain', look: 'chainSpark', damage: [0.85, 0.16], cooldown: [1.5, 0.06, 0.65], jumps: [4, 0.5], range: 440, hop: 280, slow: [0.55, 1.5] },
  inkLance: { rarity: 'rare', chapterMin: 1, tags: ['line', 'pierce'], kind: 'beam', look: 'railSpear', damage: [1.5, 0.26], cooldown: [1.6, 0.06, 0.7], length: [600, 20], width: 12, directions: 1 },
  wideBrush: { rarity: 'epic', chapterMin: 2, tags: ['line', 'area'], kind: 'beam', look: 'frostLine', damage: [1.2, 0.22], cooldown: [2.0, 0.08, 0.9], length: [380, 15], width: 34, directions: 1, knockback: 200 },
  crossStrokes: { rarity: 'epic', chapterMin: 3, tags: ['line', 'area'], kind: 'beam', look: 'railSpear', damage: [1.1, 0.2], cooldown: [2.2, 0.08, 1.0], length: [460, 18], width: 14, directions: 4 },
  judgmentLine: { rarity: 'mythic', chapterMin: 5, tags: ['line', 'pierce'], kind: 'beam', look: 'railSpear', damage: [2.8, 0.45], cooldown: [2.6, 0.1, 1.2], length: [900, 30], width: 18, directions: 1, execute: 0.12 },
  inkOrbit: { rarity: 'common', chapterMin: 1, tags: ['melee', 'sustained'], kind: 'halo', look: 'orbitScythes', damage: [0.5, 0.1], cooldown: [0.6, 0.02, 0.28], radius: [120, 6], inner: 40 },
  wardRing: { rarity: 'rare', chapterMin: 1, tags: ['melee', 'defense'], kind: 'halo', look: 'eclipseStep', damage: [0.7, 0.13], cooldown: [1.0, 0.04, 0.45], radius: [90, 5], inner: 0, knockback: 240 },
  eclipseHalo: { rarity: 'legendary', chapterMin: 4, tags: ['melee', 'area'], kind: 'halo', look: 'eclipseStep', damage: [1.6, 0.28], cooldown: [1.8, 0.07, 0.8], radius: [210, 10], inner: 110 },
};

/**
 * Balance audit P2-1 proposals (2026-10-23), each read only under its rule flag, all off until the team decides:
 * - lobScatter (lobScatter rule): how far from the target the extra blasts of the three lobs that stack land. The
 *   lobSingle rule takes the same three.
 * - lobFold (lobSingle rule): each blast their count would add adds this share of a blast's damage to their one blast.
 * - awakeningCount (awakeningScale rule): an awakening multiplies the count by 1 + this instead of adding one (the
 *   flat one gave the weapons 1.21 times their count on average at level 5).
 * - rarityDamage (rarityDamage rule): damage times this, by rarity.
 */
const RETUNE = {
  lobScatter: { inkPots: 70, tarJar: 80, meteorBrush: 90 } as Partial<Record<ArsenalId, number>>,
  lobFold: 0.5,
  awakeningCount: 0.2,
  rarityDamage: { common: 1, rare: 1.25, epic: 1, legendary: 1, mythic: 1.1 } as Record<ArsenalWeapon['rarity'], number>,
};

/** An awakened weapon: damage x`damage`, `count` more of its count, reach x`reach`. */
export default deepFreeze({ weapons: ARSENAL, awakening: { damage: 1.35, count: 1, reach: 1.2 }, retune: RETUNE });
