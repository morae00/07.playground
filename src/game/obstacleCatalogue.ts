// Obstacle catalogue (ART-05): the footprints remaster maps are built from, one per kit module baked in the chapter
// pack (art/atlas-spec.mjs OBSTACLE_CATALOGUE; obstacleCatalogue.test.ts keeps the two in step). Solid obstacles
// are walls in three sizes and pillars a pole, a jar pile, and a cart; landmark stages use the corridor post. An
// obstacle's hit box is its module's footprint, so outline and hit box agree. Chapters without a catalogue keep
// their random blocks.
export type ObstacleModuleKind = 'solid' | 'pillar' | 'landmark';

export const OBSTACLE_CATALOGUE: Readonly<Record<number, Readonly<Record<ObstacleModuleKind, readonly (readonly [w: number, h: number])[]>>>> = Object.freeze({
  1: Object.freeze({
    solid: Object.freeze([[120, 70], [200, 130], [280, 190]] as const),
    pillar: Object.freeze([[34, 34], [92, 60], [124, 60]] as const),
    landmark: Object.freeze([[70, 132]] as const),
  }),
});
