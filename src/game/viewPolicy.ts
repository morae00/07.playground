// View and spawn frame policy (BUG-09, TEC-01, team decision 2026-09-30):
// the camera always shows 900 world units vertically and scales to the window (1024×720 = 0.8×,
// 1440×900 = 1.0×, 1920×1080 = 1.2×). Windows wider than 16:9 are pillarboxed, so no player ever sees
// more than 1600 world units across. Spawns, view-edge attacks, and off-screen checks use the fixed
// 1600×900 logical frame around the player, independent of the window.
// Decision D-28 (2026-10-02, TEC-01 O-3 and O-11): the view never zooms past 1.2× (the 1920×1080 size), so a larger
// window shows the 1920×1080 frame with bars round it instead of upsampling the @2x art; and it never shows fewer than
// 1200 world units across, so a window narrower than 4:3 is letterboxed above and below instead of losing its sides.

export const LOGICAL_VIEW = Object.freeze({ width: 1600, height: 900 });
export const SPAWN_MARGIN = 110;
const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 1.2;
export const MIN_VIEW_WIDTH = 1200;

export type ViewFrame = Readonly<{
  /** Screen pixels (CSS) per world unit. */
  zoom: number;
  /** Visible world size in world units. */
  width: number;
  height: number;
  /** Left inset in CSS pixels where the visible world starts (pillarbox bar width). */
  offsetX: number;
  /** Top inset in CSS pixels where the visible world starts (letterbox bar height, D-28). */
  offsetY: number;
}>;

export function logicalViewFrame(viewW: number, viewH: number): ViewFrame {
  const safeW = Number.isFinite(viewW) && viewW > 0 ? viewW : LOGICAL_VIEW.width;
  const safeH = Number.isFinite(viewH) && viewH > 0 ? viewH : LOGICAL_VIEW.height;
  const zoom = Math.max(MIN_ZOOM, Math.min(safeH / LOGICAL_VIEW.height, safeW / MIN_VIEW_WIDTH, MAX_ZOOM));
  const width = Math.min(safeW / zoom, LOGICAL_VIEW.width);
  const height = Math.min(safeH / zoom, LOGICAL_VIEW.height);
  return Object.freeze({
    zoom,
    width,
    height,
    offsetX: Math.max(0, (safeW - width * zoom) / 2),
    offsetY: Math.max(0, (safeH - height * zoom) / 2),
  });
}

/** The legacy 1:1 frame used by classic rules: one world unit per CSS pixel, the whole canvas visible. */
export function classicViewFrame(viewW: number, viewH: number): ViewFrame {
  return Object.freeze({ zoom: 1, width: Math.max(1, viewW), height: Math.max(1, viewH), offsetX: 0, offsetY: 0 });
}

/** Top-left corner of the logical spawn frame centred on the player and kept inside the world bounds. */
export function spawnFrameOrigin(playerX: number, playerY: number, worldW: number, worldH: number, frame = LOGICAL_VIEW) {
  const clampAxis = (value: number, span: number, world: number) => Math.min(Math.max(value, 40), Math.max(40, world - span - 40));
  return {
    left: clampAxis(playerX - frame.width / 2, frame.width, worldW),
    top: clampAxis(playerY - frame.height / 2, frame.height, worldH),
    width: frame.width,
    height: frame.height,
  };
}
