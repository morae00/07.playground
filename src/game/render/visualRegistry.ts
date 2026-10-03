import type {
  BossProjectile,
  EnemyTier,
  Hazard,
  SkillId,
} from '../engine/worldTypes.ts';
import { enemyRole } from '../enemyBehaviors.ts';
import { NEUTRAL, SIGNAL } from './palette.ts';

export type VisualChapter = 1 | 2 | 3 | 4 | 5;
export type EnemyVisualRole = 'stalker' | 'charger' | 'shooter' | 'warden';
export type VisualDetail = 'full' | 'reduced' | 'minimal';

export const VISUAL_PALETTE = Object.freeze({
  paper: NEUTRAL.paper,
  paperBright: NEUTRAL.paperBright,
  paperShadow: NEUTRAL.paperShadow,
  ink: NEUTRAL.ink,
  inkSoft: NEUTRAL.inkSoft,
  player: SIGNAL.ally,
  playerDeep: SIGNAL.allyDeep,
  playerCore: '#dffaff',
  danger: SIGNAL.hostile,
  warning: SIGNAL.warn,
  elite: SIGNAL.elite,
  reward: SIGNAL.reward,
});

export type ChapterArtProfile = Readonly<{
  chapter: VisualChapter;
  key: string;
  label: string;
  accent: string;
  secondary: string;
  surface: string;
}>;

export const CHAPTER_ART: Readonly<Record<VisualChapter, ChapterArtProfile>> = Object.freeze({
  1: Object.freeze({
    chapter: 1,
    key: 'ink-alley',
    label: '먹선 골목',
    accent: '#5f6661',
    secondary: '#7e6a4e',
    surface: '#c8cbc4',
  }),
  2: Object.freeze({
    chapter: 2,
    key: 'iron-chapel',
    label: '철문 예배당',
    accent: '#665d78',
    secondary: '#566077',
    surface: '#a9a7ad',
  }),
  3: Object.freeze({
    chapter: 3,
    key: 'ashen-canal',
    label: '무채 운하',
    accent: '#56706b',
    secondary: '#56625c',
    surface: '#a7c1c4',
  }),
  4: Object.freeze({
    chapter: 4,
    key: 'clock-grave',
    label: '시계 무덤',
    accent: '#76654a',
    secondary: '#6f6048',
    surface: '#b9aa8a',
  }),
  5: Object.freeze({
    chapter: 5,
    key: 'eclipse-gate',
    label: '일식 관문',
    accent: '#684f82',
    secondary: '#3e3747',
    surface: '#928a9c',
  }),
});

export const ENEMY_VISUAL_ROLES = Object.freeze([
  'stalker',
  'charger',
  'shooter',
  'warden',
] as const);

/** The same mapping the simulation uses for role behaviour (SYS-02), so art and behaviour never disagree. */
export function enemyRoleFor(
  tier: EnemyTier,
  attackStyle: 'contact' | 'ranged',
): EnemyVisualRole {
  return enemyRole(tier, attackStyle);
}


export type BossBody =
  | 'commander'
  | 'reliquary'
  | 'architect'
  | 'executioner'
  | 'judge'
  | 'butcher'
  | 'gaoler'
  | 'bishop'
  | 'maw'
  | 'tide-king'
  | 'empress'
  | 'tyrant'
  | 'herald'
  | 'director'
  | 'balance';

export type BossArtProfile = Readonly<{
  chapter: VisualChapter;
  body: BossBody;
  fill: string;
  accent: string;
  core: string;
}>;

const bossProfile = (
  chapter: VisualChapter,
  body: BossBody,
): BossArtProfile => {
  const chapterArt = CHAPTER_ART[chapter];
  return Object.freeze({
    chapter,
    body,
    fill: '#111513',
    accent: chapterArt.accent,
    core: chapterArt.secondary,
  });
};

export const BOSS_ART: Readonly<Record<string, BossArtProfile>> = Object.freeze({
  'field-shock': bossProfile(1, 'commander'),
  'field-rings': bossProfile(2, 'reliquary'),
  'field-trap': bossProfile(3, 'architect'),
  'field-clock': bossProfile(4, 'executioner'),
  'field-null': bossProfile(5, 'judge'),
  's1-mid-dash': bossProfile(1, 'butcher'),
  's1-final-rings': bossProfile(1, 'gaoler'),
  's2-mid-clones': bossProfile(2, 'bishop'),
  's2-final-flame': bossProfile(2, 'maw'),
  's3-mid-tide': bossProfile(3, 'tide-king'),
  's3-final-traps': bossProfile(3, 'empress'),
  's4-mid-clock': bossProfile(4, 'tyrant'),
  's4-final-saw': bossProfile(4, 'herald'),
  's5-mid-eclipse': bossProfile(5, 'director'),
  's5-final-null': bossProfile(5, 'balance'),
});

export function bossArtFor(id: string | undefined, chapter: number): BossArtProfile {
  if (id && BOSS_ART[id]) return BOSS_ART[id];
  const safeChapter = Math.min(5, Math.max(1, Math.round(chapter))) as VisualChapter;
  return Object.freeze({
    chapter: safeChapter,
    body: 'commander',
    fill: '#111513',
    accent: CHAPTER_ART[safeChapter].accent,
    core: CHAPTER_ART[safeChapter].secondary,
  });
}

export type ProjectileShape = 'needle' | 'knife' | 'spark' | 'orb' | 'spear' | 'sigil';

export type ProjectileArtProfile = Readonly<{
  shape: ProjectileShape;
  fill: string;
  core: string;
  trail: string;
}>;

const projectile = (
  shape: ProjectileShape,
  fill: string,
  core: string,
  trail: string,
): ProjectileArtProfile => Object.freeze({
  shape,
  fill,
  core,
  trail,
});

// Every enemy shot that deals damage is coral; the kinds differ by shape and weight of the hostile outline.
export const HOSTILE_PROJECTILE_ART: Readonly<Record<BossProjectile['kind'], ProjectileArtProfile>> = Object.freeze({
  dot: projectile('orb', SIGNAL.hostile, '#fff4f1', '#ff8b82'),
  ring: projectile('sigil', SIGNAL.hostile, '#fff4f1', '#ff8b82'),
  saw: projectile('knife', SIGNAL.hostileDeep, '#fff4f1', '#ff8b82'),
  eclipse: projectile('spear', SIGNAL.hostileDeep, '#fff4f1', '#ff8b82'),
  enemy: projectile('needle', SIGNAL.hostile, '#fff4f1', '#ff8b82'),
});

export type HazardGlyph = 'wave' | 'chain' | 'null' | 'flame' | 'shatter' | 'spiral' | 'star';

export type HazardArtProfile = Readonly<{
  /** Ownership sets the look (ART-06, kit PN.env.hazard): hostile ground is hatched amber inside an ink ring,
   * ally ground is a cyan stitch with light dots, neutral ground an ink wash. */
  owner: 'hostile' | 'ally' | 'neutral';
  /** Rim colour inside the ink ring, and the hatch or dot colour. */
  color: string;
  fill: string;
  glyph: HazardGlyph;
}>;

// Every hazard is a circle, like its hit test (ART-06): the old square trap no longer shows corners it does not hit.
// Water and trap are neutral terrain; slow, root, and null are enemy control zones (amber); fire deals enemy damage
// (coral); shock is an enemy telegraph (amber, coral once active); warning and vortex belong to player skills (cyan).
export const HAZARD_ART: Readonly<Record<Hazard['kind'], HazardArtProfile>> = Object.freeze({
  water: Object.freeze({ owner: 'neutral', color: '#5e7c82', fill: '#c9d5d6', glyph: 'wave' }),
  trap: Object.freeze({ owner: 'neutral', color: '#343936', fill: '#cfd1ca', glyph: 'chain' }),
  fire: Object.freeze({ owner: 'hostile', color: SIGNAL.hostile, fill: SIGNAL.hostileGlow, glyph: 'flame' }),
  slow: Object.freeze({ owner: 'hostile', color: SIGNAL.warn, fill: '#f3ead7', glyph: 'wave' }),
  root: Object.freeze({ owner: 'hostile', color: SIGNAL.warn, fill: '#efe6d3', glyph: 'chain' }),
  null: Object.freeze({ owner: 'hostile', color: SIGNAL.warn, fill: '#fbfaf5', glyph: 'null' }),
  warning: Object.freeze({ owner: 'ally', color: SIGNAL.ally, fill: SIGNAL.allyGlow, glyph: 'star' }),
  vortex: Object.freeze({ owner: 'ally', color: SIGNAL.allyDeep, fill: '#e3ecee', glyph: 'spiral' }),
  shock: Object.freeze({ owner: 'hostile', color: SIGNAL.warn, fill: SIGNAL.warnGlow, glyph: 'shatter' }),
});

export type ChapterMotif = 'orthogonal' | 'radial' | 'flow' | 'clock' | 'eclipse';

export const CHAPTER_VISUALS: Record<number, { motif: ChapterMotif; accent: string; label: string }> = {
  1: { motif: 'orthogonal', accent: CHAPTER_ART[1].accent, label: CHAPTER_ART[1].label },
  2: { motif: 'radial', accent: CHAPTER_ART[2].accent, label: CHAPTER_ART[2].label },
  3: { motif: 'flow', accent: CHAPTER_ART[3].accent, label: CHAPTER_ART[3].label },
  4: { motif: 'clock', accent: CHAPTER_ART[4].accent, label: CHAPTER_ART[4].label },
  5: { motif: 'eclipse', accent: CHAPTER_ART[5].accent, label: CHAPTER_ART[5].label },
};
