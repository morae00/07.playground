export type RectBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Point = {
  x: number;
  y: number;
};

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize(x: number, y: number) {
  const magnitude = Math.hypot(x, y) || 1;
  return { x: x / magnitude, y: y / magnitude };
}

export function pointInRect(x: number, y: number, rect: RectBounds) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function circleRectPush(x: number, y: number, radius: number, rect: RectBounds) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude >= radius || magnitude === 0) {
    if (magnitude === 0 && pointInRect(x, y, rect)) {
      const left = Math.abs(x - rect.x);
      const right = Math.abs(rect.x + rect.w - x);
      const top = Math.abs(y - rect.y);
      const bottom = Math.abs(rect.y + rect.h - y);
      const nearestEdge = Math.min(left, right, top, bottom);
      if (nearestEdge === left) return { x: rect.x - radius, y };
      if (nearestEdge === right) return { x: rect.x + rect.w + radius, y };
      if (nearestEdge === top) return { x, y: rect.y - radius };
      return { x, y: rect.y + rect.h + radius };
    }
    return { x, y };
  }
  const push = radius - magnitude + 0.2;
  return { x: x + (dx / magnitude) * push, y: y + (dy / magnitude) * push };
}

export function distancePointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lengthSquared, 0, 1);
  const x = x1 + t * dx;
  const y = y1 + t * dy;
  return Math.hypot(px - x, py - y);
}
