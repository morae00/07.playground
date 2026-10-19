// Sprite atlas runtime (TEC-03): loads baked atlas pages per pack and hands out frames by key.
// Pages load through <img> + createImageBitmap (works under Electron's app:// as well as http). The manifest is
// data, fetched as JSON beside the pages, so it adds nothing to the app JS budget (TEC-05); the generated
// TypeScript copy serves tests and types.

/** [page, x, y, w, h, anchorX, anchorY] in atlas pixels. */
export type AtlasFrame = readonly [number, number, number, number, number, number, number];

export type AtlasPackManifest = Readonly<{
  pages: readonly string[];
  frames: Readonly<Record<string, AtlasFrame>>;
  /** ART-05: a seamless ground tile for the chapter, `size` world units square, turned by `angle` radians (ART-08). */
  ground?: Readonly<{ file: string; size: number; angle?: number }>;
}>;

export type GroundTile = Readonly<{ image: SpriteImage; size: number; angle: number }>;

export type AnimationSpec = Readonly<{ frames: number; fps: number }>;

/** FX-06, FX-07: how one skill stamp plays (API-skills-vfx §2.3); `seconds` for parts a fixed window times. */
export type SkillVfxPart = Readonly<{
  drive: 'prog' | 'loop' | 'idx';
  rotate: 'vel' | 'beam' | 'radial' | 'tangent' | 'ray' | 'face' | 'none';
  layer: 'ground' | 'body' | 'ally';
  lod: 'info' | 'deco';
  still: number | null;
  flash: boolean;
  seconds: number | null;
}>;

/** The kit's skill shapes (SPEC) and part rules, baked as data so their numbers stay out of the app JS. */
export type SkillVfxManifest = Readonly<{
  spec: Readonly<Record<string, unknown>>;
  parts: Readonly<Record<string, Readonly<Record<string, SkillVfxPart>>>>;
  render: Readonly<{ cloneAlpha: number; popRise: number; popEvery: number; rayInset: number; boltFps: number }>;
}>;

/** K11: how one hazard stamp plays and where it sits (API-hazards §5); box and anchor in world units. */
export type HazardPart = Readonly<{
  frames: number;
  drive: 'loop' | 'prog' | 'cycle' | 'idx';
  fps: number;
  seconds: number | null;
  still: number | null;
  box: readonly [number, number];
  anchor: readonly [number, number];
  layer: string;
  z: string;
  lod: 'info' | 'deco';
  flash: boolean;
  ch: number | null;
}>;

/** K11: the kit's hazard shapes (SPEC), part rules, states, and the vectors the layout port is tested against. */
export type HazardManifest = Readonly<{
  version: string;
  spec: Readonly<Record<string, unknown>>;
  parts: Readonly<Record<string, Readonly<Record<string, HazardPart>>>>;
  states: Readonly<Record<string, readonly string[]>>;
  /**
   * layout `kind:r:seed[:lod]` -> [part, x, y, flip, phase, z, prio]; embers `fire:r:seed:t` / `hero:t` -> [part, x, y, frame];
   * paths `kind:r:seed` -> the kit's paths() (shock cracks, null ghost lines and jag) as lines of points.
   */
  vectors: Readonly<{
    layout: Readonly<Record<string, readonly (readonly (string | number)[])[]>>;
    embers: Readonly<Record<string, readonly (readonly (string | number)[])[]>>;
    paths: Readonly<Record<string, Readonly<Record<string, readonly (readonly (readonly [number, number])[])[]>>>>;
  }>;
  render: Readonly<{ fireStamps: readonly number[] }>;
}>;

/** K10: how one weapon field-effect stamp plays and where it sits (API-arsenal-fx §5); box and anchor in world units. */
export type ArsenalFxPart = Readonly<{
  frames: number;
  drive: 'prog' | 'loop' | 'cycle' | 'idx';
  fps: number;
  seconds: number | null;
  still: number | null;
  box: readonly [number, number];
  anchor: readonly [number, number];
  place: string;
  rotate: string;
  layer: string;
  lod: 'info' | 'deco';
  flash: boolean;
  window: string;
  r?: number;
}>;

/**
 * K10: the kit's weapon shapes (SPEC), the drawn weapons' numbers (META without names), part rules, and the C9 vectors
 * the renderer's port is tested against: cases [id, stage, opts, layout items, paths], and lob paths.
 */
export type ArsenalFxManifest = Readonly<{
  version: string;
  spec: Readonly<Record<string, unknown>>;
  meta: Readonly<Record<string, Readonly<{ kind: string; look: string; main: string | null; stages: readonly string[]; geo: Readonly<{ inner?: number; delay?: number }>; done: Readonly<{ fx: boolean; lob: boolean; gimmick: boolean }> }>>>;
  parts: Readonly<Record<string, Readonly<Record<string, ArsenalFxPart>>>>;
  vectors: Readonly<{
    cases: readonly (readonly [string, string, Readonly<Record<string, unknown>>, readonly (readonly (string | number)[])[], Readonly<Record<string, readonly (readonly [number, number])[]>>])[];
    lob: Readonly<Record<string, readonly (readonly number[])[]>>;
    mini: readonly (readonly [number, number, readonly (readonly number[])[]])[];
  }>;
}>;

export type AtlasManifest = Readonly<{
  version: number;
  /** Atlas pixels per world unit. */
  atlasScale: number;
  packs: Readonly<Record<string, AtlasPackManifest>>;
  animations: Readonly<Record<string, Readonly<Record<string, AnimationSpec>>>>;
  skillVfx?: SkillVfxManifest;
  hazards?: HazardManifest;
  /** K10: the weapons' field effects. */
  arsenalFx?: ArsenalFxManifest;
  /** SYS-14 (K7): the fuse bomber's wick tip per state and frame, in kit units around its feet (API-bombers §4.2). */
  bombers?: BomberManifest;
}>;

export type BomberManifest = Readonly<{
  feet: readonly [number, number];
  displayScale: number;
  wick: Readonly<Record<string, readonly (readonly [number, number])[]>>;
}>;

export type SpriteImage = CanvasImageSource & { readonly width: number; readonly height: number };

export type SpriteFrame = Readonly<{
  image: SpriteImage;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Anchor inside the frame, in atlas pixels. */
  ax: number;
  ay: number;
  /** Atlas pixels per world unit. */
  scale: number;
}>;

export type PackStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type SpriteAtlasOptions = {
  loadManifest?: () => Promise<AtlasManifest>;
  loadImage?: (url: string) => Promise<SpriteImage>;
};

async function defaultLoadImage(url: string): Promise<SpriteImage> {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  try {
    await image.decode();
  } catch (error) {
    throw new Error(`atlas page ${url} did not load (${error instanceof Error ? error.message : String(error)})`);
  }
  return typeof createImageBitmap === 'function' ? createImageBitmap(image) : image;
}

/** Written by scripts/build-atlas.mjs next to the pages. */
export const ATLAS_MANIFEST_URL = 'assets/atlas/manifest.json';

async function defaultLoadManifest(): Promise<AtlasManifest> {
  const response = await fetch(ATLAS_MANIFEST_URL);
  if (!response.ok) throw new Error(`atlas manifest ${ATLAS_MANIFEST_URL} did not load (${response.status})`);
  return (await response.json()) as AtlasManifest;
}

export class SpriteAtlas {
  private manifest: AtlasManifest | null = null;
  private manifestLoad: Promise<AtlasManifest> | null = null;
  private readonly pages = new Map<string, SpriteImage[]>();
  private readonly grounds = new Map<string, GroundTile>();
  private readonly statuses = new Map<string, PackStatus>();
  private readonly failures = new Map<string, unknown>();
  /** Bumped by release, so a load still in flight for a released pack is thrown away. */
  private readonly generations = new Map<string, number>();
  /**
   * One frame object per key while the resident packs stay the same (TEC-09): the renderer caches cut-outs by frame,
   * so a new object for every lookup made it build a canvas for every hit flash, elite outline, and hero outline.
   */
  private readonly frames = new Map<string, SpriteFrame | undefined>();
  private readonly options: Required<SpriteAtlasOptions>;
  private readonly listeners = new Set<() => void>();

  constructor(options: SpriteAtlasOptions = {}) {
    this.options = {
      loadManifest: options.loadManifest ?? defaultLoadManifest,
      loadImage: options.loadImage ?? defaultLoadImage,
    };
  }

  status(pack: string): PackStatus {
    return this.statuses.get(pack) ?? 'idle';
  }

  /** Why a pack failed to load, for the error log (TEC-14). */
  failure(pack: string): unknown {
    return this.failures.get(pack);
  }

  /** Loads a pack once; resolves true when its pages are ready, false if anything failed (callers fall back). */
  async load(pack: string): Promise<boolean> {
    const current = this.status(pack);
    if (current === 'ready') return true;
    if (current === 'failed') return false;
    if (current === 'loading') return new Promise((resolve) => this.whenSettled(pack, resolve));
    this.statuses.set(pack, 'loading');
    const generation = this.generations.get(pack) ?? 0;
    try {
      this.manifestLoad ??= this.options.loadManifest();
      const manifest = await this.manifestLoad;
      this.manifest = manifest;
      const entry = manifest.packs[pack];
      if (!entry) throw new Error(`unknown atlas pack ${pack}`);
      const [images, ground] = await Promise.all([
        Promise.all(entry.pages.map((url) => this.options.loadImage(url))),
        entry.ground ? this.options.loadImage(entry.ground.file) : undefined,
      ]);
      if ((this.generations.get(pack) ?? 0) !== generation) {
        closeImages([...images, ground]);
        return false;
      }
      this.pages.set(pack, images);
      if (ground && entry.ground) this.grounds.set(pack, { image: ground, size: entry.ground.size, angle: entry.ground.angle ?? 0 });
      this.statuses.set(pack, 'ready');
    } catch (error) {
      if ((this.generations.get(pack) ?? 0) !== generation) return false;
      this.statuses.set(pack, 'failed');
      this.failures.set(pack, error);
    }
    this.frames.clear();
    for (const listener of this.listeners) listener();
    return this.status(pack) === 'ready';
  }

  /**
   * Drops a pack's pages and ground (ART-07), so only the chapter on screen stays resident and textures keep to
   * their budget. A later load fetches the pack again; a failed pack is tried again too.
   */
  release(pack: string) {
    if (this.status(pack) === 'idle') return;
    this.generations.set(pack, (this.generations.get(pack) ?? 0) + 1);
    closeImages([...(this.pages.get(pack) ?? []), this.grounds.get(pack)?.image]);
    this.pages.delete(pack);
    this.grounds.delete(pack);
    this.statuses.delete(pack);
    this.failures.delete(pack);
    this.frames.clear();
    for (const listener of this.listeners) listener();
  }

  /** Called whenever a pack finishes loading or fails. Returns an unsubscribe function. */
  onChange(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** The pack's ground tile once the pack is ready. */
  ground(pack: string): GroundTile | undefined {
    return this.grounds.get(pack);
  }

  animation(slot: string, state: string): AnimationSpec | undefined {
    return this.manifest?.animations[slot]?.[state];
  }

  /** The skill VFX's shapes and part rules (FX-06), once the manifest has loaded. */
  bombers(): BomberManifest | undefined {
    return this.manifest?.bombers;
  }

  skillVfx(): SkillVfxManifest | undefined {
    return this.manifest?.skillVfx;
  }

  hazards(): HazardManifest | undefined {
    return this.manifest?.hazards;
  }

  arsenalFx(): ArsenalFxManifest | undefined {
    return this.manifest?.arsenalFx;
  }

  /** The frame for a key from any ready pack, or undefined (not baked, pack not loaded, or load failed). */
  frame(key: string): SpriteFrame | undefined {
    if (this.frames.has(key)) return this.frames.get(key);
    const frame = this.findFrame(key);
    if (this.manifest) this.frames.set(key, frame);
    return frame;
  }

  private findFrame(key: string): SpriteFrame | undefined {
    const manifest = this.manifest;
    if (!manifest) return undefined;
    for (const [pack, images] of this.pages) {
      const entry = manifest.packs[pack]?.frames[key];
      if (!entry) continue;
      const image = images[entry[0]];
      if (!image) return undefined;
      return { image, sx: entry[1], sy: entry[2], sw: entry[3], sh: entry[4], ax: entry[5], ay: entry[6], scale: manifest.atlasScale };
    }
    return undefined;
  }

  private whenSettled(pack: string, resolve: (ready: boolean) => void) {
    const stop = this.onChange(() => {
      const status = this.status(pack);
      if (status === 'loading') return;
      stop();
      resolve(status === 'ready');
    });
  }
}

/** Frees decoded pages right away where the browser allows it (ImageBitmap.close); others wait for collection. */
function closeImages(images: readonly (SpriteImage | undefined)[]) {
  for (const image of images) (image as { close?: () => void } | undefined)?.close?.();
}

/** The frame index of a looping animation at time t, offset per entity so crowds do not march in step. */
export function loopFrame(spec: AnimationSpec, seconds: number, phase = 0) {
  if (spec.frames <= 1) return 0;
  return Math.floor(Math.max(0, seconds * spec.fps + phase * spec.frames)) % spec.frames;
}

/** A stable 0..1 phase for an id (Knuth multiplicative hash). */
export function phaseFor(id: number) {
  return ((Math.imul(id, 2654435761) >>> 0) % 1000) / 1000;
}
