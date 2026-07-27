import type {
  BossProjectile,
  EnemyTier,
  Hazard,
  SkillId,
} from '../GameEngine';

export type VisualChapter = 1 | 2 | 3 | 4 | 5;
export type EnemyVisualRole = 'stalker' | 'charger' | 'shooter' | 'warden';
export type VisualDetail = 'full' | 'reduced' | 'minimal';

export const VISUAL_PALETTE = Object.freeze({
  paper: '#f4f4ef',
  paperBright: '#fffff8',
  paperShadow: '#d8dad3',
  ink: '#101312',
  inkSoft: '#343936',
  player: '#00a8c6',
  playerCore: '#dffaff',
  danger: '#ef5b4f',
  warning: '#d88d16',
  elite: '#805ad5',
  reward: '#86b82d',
});

export type ChapterArtProfile = Readonly<{
  chapter: VisualChapter;
  key: string;
  label: string;
  accent: string;
  secondary: string;
  surface: string;
  enemyMaterial: 'scrap' | 'iron' | 'water' | 'clockwork' | 'eclipse';
  obstacleMaterial: 'plaster' | 'iron' | 'stone' | 'brass' | 'obsidian';
}>;

export const CHAPTER_ART: Readonly<Record<VisualChapter, ChapterArtProfile>> = Object.freeze({
  1: Object.freeze({
    chapter: 1,
    key: 'ink-alley',
    label: '먹선 골목',
    accent: '#5f6661',
    secondary: '#ef5b4f',
    surface: '#c8cbc4',
    enemyMaterial: 'scrap',
    obstacleMaterial: 'plaster',
  }),
  2: Object.freeze({
    chapter: 2,
    key: 'iron-chapel',
    label: '철문 예배당',
    accent: '#665d78',
    secondary: '#d88d16',
    surface: '#a9a7ad',
    enemyMaterial: 'iron',
    obstacleMaterial: 'iron',
  }),
  3: Object.freeze({
    chapter: 3,
    key: 'ashen-canal',
    label: '무채 운하',
    accent: '#397f8d',
    secondary: '#00a8c6',
    surface: '#a7c1c4',
    enemyMaterial: 'water',
    obstacleMaterial: 'stone',
  }),
  4: Object.freeze({
    chapter: 4,
    key: 'clock-grave',
    label: '시계 무덤',
    accent: '#8a692d',
    secondary: '#86b82d',
    surface: '#b9aa8a',
    enemyMaterial: 'clockwork',
    obstacleMaterial: 'brass',
  }),
  5: Object.freeze({
    chapter: 5,
    key: 'eclipse-gate',
    label: '일식 관문',
    accent: '#684f82',
    secondary: '#ef5b4f',
    surface: '#928a9c',
    enemyMaterial: 'eclipse',
    obstacleMaterial: 'obsidian',
  }),
});

export type EnemyArtProfile = Readonly<{
  chapter: VisualChapter;
  role: EnemyVisualRole;
  material: ChapterArtProfile['enemyMaterial'];
  fill: string;
  accent: string;
  core: string;
  rotationRate: number;
}>;

export const ENEMY_VISUAL_ROLES = Object.freeze([
  'stalker',
  'charger',
  'shooter',
  'warden',
] as const);

const roleFill: Record<EnemyVisualRole, string> = {
  stalker: '#1a1e1c',
  charger: '#292e2b',
  shooter: '#343a36',
  warden: '#484f4a',
};

const roleRotation: Record<EnemyVisualRole, number> = {
  stalker: 0.9,
  charger: 0.16,
  shooter: 0,
  warden: 0.08,
};

const enemyProfiles = Object.fromEntries(
  ([1, 2, 3, 4, 5] as const).flatMap((chapter) => (
    ENEMY_VISUAL_ROLES.map((role) => {
      const chapterArt = CHAPTER_ART[chapter];
      const key = `enemy-${chapterArt.key}-${role}`;
      return [key, Object.freeze({
        chapter,
        role,
        material: chapterArt.enemyMaterial,
        fill: roleFill[role],
        accent: chapterArt.accent,
        core: chapterArt.secondary,
        rotationRate: roleRotation[role],
      } satisfies EnemyArtProfile)];
    })
  )),
) as Record<string, EnemyArtProfile>;

export const ENEMY_ART = Object.freeze(enemyProfiles);

export function enemyRoleFor(
  tier: EnemyTier,
  attackStyle: 'contact' | 'ranged',
): EnemyVisualRole {
  if (attackStyle === 'ranged') return 'shooter';
  if (tier === 'large') return 'warden';
  if (tier === 'medium') return 'charger';
  return 'stalker';
}

export function enemyArtFor(
  chapter: number,
  tier: EnemyTier,
  attackStyle: 'contact' | 'ranged',
): EnemyArtProfile {
  const safeChapter = Math.min(5, Math.max(1, Math.round(chapter))) as VisualChapter;
  const role = enemyRoleFor(tier, attackStyle);
  return ENEMY_ART[`enemy-${CHAPTER_ART[safeChapter].key}-${role}`];
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

export const SKILL_PROJECTILE_ART: Readonly<Record<SkillId, ProjectileArtProfile>> = Object.freeze({
  needleStorm: projectile('needle', '#f6feff', '#00a8c6', '#6ad7e8'),
  fanKnives: projectile('knife', '#fffff8', '#343936', '#00a8c6'),
  chainSpark: projectile('spark', '#dffaff', '#00a8c6', '#86b82d'),
  frostLine: projectile('spear', '#e8fbff', '#397f8d', '#80d8e5'),
  orbitScythes: projectile('knife', '#fffff8', '#101312', '#805ad5'),
  boneMortar: projectile('orb', '#ece8dc', '#343936', '#d88d16'),
  railSpear: projectile('spear', '#fffff8', '#101312', '#ef5b4f'),
  mirrorClone: projectile('needle', '#e5faff', '#00a8c6', '#805ad5'),
  voidMine: projectile('sigil', '#2a2134', '#805ad5', '#ef5b4f'),
  blackSun: projectile('orb', '#101312', '#805ad5', '#ef5b4f'),
  ironFrame: projectile('sigil', '#d8dad3', '#343936', '#d88d16'),
  magnetSigil: projectile('sigil', '#eff8da', '#86b82d', '#00a8c6'),
  paperWard: projectile('sigil', '#fffff8', '#00a8c6', '#d88d16'),
  recoveryThread: projectile('needle', '#eff8da', '#86b82d', '#00a8c6'),
  coinFever: projectile('orb', '#fff1c8', '#d88d16', '#86b82d'),
  eclipseStep: projectile('knife', '#2a2134', '#805ad5', '#00a8c6'),
  executionMark: projectile('spear', '#fff0ed', '#ef5b4f', '#d88d16'),
});

export const HOSTILE_PROJECTILE_ART: Readonly<Record<BossProjectile['kind'], ProjectileArtProfile>> = Object.freeze({
  dot: projectile('orb', '#ef5b4f', '#fff4f1', '#ff8b82'),
  ring: projectile('sigil', '#00a8c6', '#e9fdff', '#65d8e6'),
  saw: projectile('knife', '#d88d16', '#fff3cd', '#ffd268'),
  eclipse: projectile('spear', '#805ad5', '#f4efff', '#b69ae8'),
  enemy: projectile('needle', '#dd3c75', '#fff0f5', '#ff79a5'),
});

export type HazardArtProfile = Readonly<{
  color: string;
  fill: string;
  edge: 'circle' | 'square' | 'flow' | 'spiral' | 'burst';
}>;

export const HAZARD_ART: Readonly<Record<Hazard['kind'], HazardArtProfile>> = Object.freeze({
  water: Object.freeze({ color: '#397f8d', fill: '#c5e3e7', edge: 'flow' }),
  trap: Object.freeze({ color: '#343936', fill: '#d8dad3', edge: 'square' }),
  fire: Object.freeze({ color: '#ef5b4f', fill: '#ffe4df', edge: 'burst' }),
  slow: Object.freeze({ color: '#00a8c6', fill: '#dffaff', edge: 'flow' }),
  root: Object.freeze({ color: '#665d45', fill: '#e8e0cd', edge: 'square' }),
  null: Object.freeze({ color: '#805ad5', fill: '#ddd1f5', edge: 'circle' }),
  warning: Object.freeze({ color: '#ef5b4f', fill: '#ffe4df', edge: 'circle' }),
  vortex: Object.freeze({ color: '#684f82', fill: '#e1d8eb', edge: 'spiral' }),
  shock: Object.freeze({ color: '#d88d16', fill: '#fff0c9', edge: 'burst' }),
});
