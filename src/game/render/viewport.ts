export type Point = {
  x: number;
  y: number;
};

export type Viewport = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type GridLineRange = {
  first: number;
  last: number;
  step: number;
  count: number;
};

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function nonNegativeFiniteOrZero(value: number) {
  return Math.max(0, finiteOr(value, 0));
}

function validViewport(viewport: Viewport) {
  return Number.isFinite(viewport.left)
    && Number.isFinite(viewport.top)
    && Number.isFinite(viewport.right)
    && Number.isFinite(viewport.bottom)
    && viewport.left <= viewport.right
    && viewport.top <= viewport.bottom;
}

export function makeViewport(
  cameraX: number,
  cameraY: number,
  width: number,
  height: number,
  padding = 0,
): Viewport {
  const safeCameraX = finiteOr(cameraX, 0);
  const safeCameraY = finiteOr(cameraY, 0);
  const safeWidth = nonNegativeFiniteOrZero(width);
  const safeHeight = nonNegativeFiniteOrZero(height);
  const safePadding = nonNegativeFiniteOrZero(padding);

  return {
    left: safeCameraX - safePadding,
    top: safeCameraY - safePadding,
    right: safeCameraX + safeWidth + safePadding,
    bottom: safeCameraY + safeHeight + safePadding,
  };
}

export function circleVisible(viewport: Viewport, x: number, y: number, radius = 0) {
  if (!validViewport(viewport) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const safeRadius = nonNegativeFiniteOrZero(radius);
  return x + safeRadius >= viewport.left
    && x - safeRadius <= viewport.right
    && y + safeRadius >= viewport.top
    && y - safeRadius <= viewport.bottom;
}

export function rectVisible(
  viewport: Viewport,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (
    !validViewport(viewport)
    || !Number.isFinite(x)
    || !Number.isFinite(y)
    || !Number.isFinite(width)
    || !Number.isFinite(height)
  ) return false;

  const oppositeX = x + width;
  const oppositeY = y + height;
  const left = Math.min(x, oppositeX);
  const right = Math.max(x, oppositeX);
  const top = Math.min(y, oppositeY);
  const bottom = Math.max(y, oppositeY);

  return right >= viewport.left
    && left <= viewport.right
    && bottom >= viewport.top
    && top <= viewport.bottom;
}

export function segmentVisible(
  viewport: Viewport,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 0,
) {
  if (
    !validViewport(viewport)
    || !Number.isFinite(x1)
    || !Number.isFinite(y1)
    || !Number.isFinite(x2)
    || !Number.isFinite(y2)
  ) return false;

  const halfThickness = nonNegativeFiniteOrZero(thickness) / 2;
  return rectVisible(
    viewport,
    Math.min(x1, x2) - halfThickness,
    Math.min(y1, y2) - halfThickness,
    Math.abs(x2 - x1) + halfThickness * 2,
    Math.abs(y2 - y1) + halfThickness * 2,
  );
}

export function interpolatePosition(previous: Point, current: Point, alpha: number): Point {
  const previousX = Number.isFinite(previous.x) ? previous.x : finiteOr(current.x, 0);
  const previousY = Number.isFinite(previous.y) ? previous.y : finiteOr(current.y, 0);
  const currentX = Number.isFinite(current.x) ? current.x : previousX;
  const currentY = Number.isFinite(current.y) ? current.y : previousY;
  const safeAlpha = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;

  return {
    x: previousX + (currentX - previousX) * safeAlpha,
    y: previousY + (currentY - previousY) * safeAlpha,
  };
}

export function visibleGridLineRange(
  viewMin: number,
  viewMax: number,
  spacing: number,
  worldMin: number,
  worldMax: number,
): GridLineRange | null {
  if (
    !Number.isFinite(viewMin)
    || !Number.isFinite(viewMax)
    || !Number.isFinite(spacing)
    || !Number.isFinite(worldMin)
    || !Number.isFinite(worldMax)
    || spacing <= 0
    || worldMax < worldMin
  ) return null;

  const visibleMin = Math.max(Math.min(viewMin, viewMax), worldMin);
  const visibleMax = Math.min(Math.max(viewMin, viewMax), worldMax);
  if (visibleMin > visibleMax) return null;

  const firstIndex = Math.ceil((visibleMin - worldMin) / spacing);
  const lastIndex = Math.floor((visibleMax - worldMin) / spacing);
  if (firstIndex > lastIndex) return null;

  return {
    first: worldMin + firstIndex * spacing,
    last: worldMin + lastIndex * spacing,
    step: spacing,
    count: lastIndex - firstIndex + 1,
  };
}
