// Obstacle catalogue (ART-05, ART-07): the footprints remaster maps are built from, one per kit module baked in the
// chapter pack (art/atlas-spec.mjs OBSTACLE_CATALOGUE; obstacleCatalogue.test.ts keeps the two in step). Solid
// obstacles are the chapter's block prop in the same three footprints everywhere; pillars are the chapter's small
// props; landmark stages use the chapter's post. An obstacle's hit box is its module's footprint, so outline and
// hit box agree. Chapters without a catalogue keep their random blocks.
export type ObstacleModuleKind = 'solid' | 'pillar' | 'landmark';

const SOLID = Object.freeze([[120, 70], [200, 130], [280, 190]] as const);

export const OBSTACLE_CATALOGUE: Readonly<Record<number, Readonly<Record<ObstacleModuleKind, readonly (readonly [w: number, h: number])[]>>>> = Object.freeze({
  // Walls; a pole, a jar pile, a cart; the corridor post.
  1: Object.freeze({ solid: SOLID, pillar: Object.freeze([[34, 34], [92, 60], [124, 60]] as const), landmark: Object.freeze([[70, 132]] as const) }),
  // Iron-rail partitions; broken column drums and a short rail; a drum in the nave ring.
  2: Object.freeze({ solid: SOLID, pillar: Object.freeze([[50, 32], [76, 49], [104, 30]] as const), landmark: Object.freeze([[66, 42]] as const) }),
  // Canal embankments; mooring bollards and a sluice gate; a sluice along the channel.
  3: Object.freeze({ solid: SOLID, pillar: Object.freeze([[28, 28], [40, 40], [124, 30]] as const), landmark: Object.freeze([[170, 54]] as const) }),
});
