// Sprite atlas runtime (TEC-03): loads baked atlas pages per pack and hands out frames by key.
// Pages load through <img> + createImageBitmap (works under Electron's file:// as well as http). The manifest is
// data, fetched as JSON beside the pages, so it adds nothing to the app JS budget (TEC-05); the generated
// TypeScript copy serves tests and types.

/** [page, x, y, w, h, anchorX, anchorY] in atlas pixels. */
export type AtlasFrame = readonly [number, number, number, number, number, number, number];

export type AtlasPackManifest = Readonly<{
  pages: readonly string[];
  frames: Readonly<Record<string, AtlasFrame>>;
}>;

export type AnimationSpec = Readonly<{ frames: number; fps: number }>;

export type AtlasManifest = Readonly<{
  version: number;
  /** Atlas pixels per world unit. */
  atlasScale: number;
  packs: Readonly<Record<string, AtlasPackManifest>>;
  animations: Readonly<Record<string, Readonly<Record<string, AnimationSpec>>>>;
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
  private readonly statuses = new Map<string, PackStatus>();
  private readonly failures = new Map<string, unknown>();
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
    try {
      this.manifestLoad ??= this.options.loadManifest();
      const manifest = await this.manifestLoad;
      this.manifest = manifest;
      const entry = manifest.packs[pack];
      if (!entry) throw new Error(`unknown atlas pack ${pack}`);
      const images = await Promise.all(entry.pages.map((url) => this.options.loadImage(url)));
      this.pages.set(pack, images);
      this.statuses.set(pack, 'ready');
    } catch (error) {
      this.statuses.set(pack, 'failed');
      this.failures.set(pack, error);
    }
    for (const listener of this.listeners) listener();
    return this.status(pack) === 'ready';
  }

  /** Called whenever a pack finishes loading or fails. Returns an unsubscribe function. */
  onChange(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  animation(slot: string, state: string): AnimationSpec | undefined {
    return this.manifest?.animations[slot]?.[state];
  }

  /** The frame for a key from any ready pack, or undefined (not baked, pack not loaded, or load failed). */
  frame(key: string): SpriteFrame | undefined {
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

/** The frame index of a looping animation at time t, offset per entity so crowds do not march in step. */
export function loopFrame(spec: AnimationSpec, seconds: number, phase = 0) {
  if (spec.frames <= 1) return 0;
  return Math.floor(Math.max(0, seconds * spec.fps + phase * spec.frames)) % spec.frames;
}

/** A stable 0..1 phase for an id (Knuth multiplicative hash). */
export function phaseFor(id: number) {
  return ((Math.imul(id, 2654435761) >>> 0) % 1000) / 1000;
}
